'use server'

// Actions de la page Admin → Prospection. Chaque action vérifie le rôle
// admin avant d'utiliser le service role (tables outreach_* sans policy).

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { PLAYBOOK } from '@/lib/outreach/playbook'
import { enroll, loadSettings, onTagsAdded, runOutreach, sendTest, setStage, stopEnrollments, type RunSummary } from '@/lib/outreach/service'
import { relaunchOutreach } from '@/lib/outreach/relaunch'
import { searchGooglePlaces, searchSirene, findEmailOnSite, type FoundContact } from '@/lib/outreach/sources'
import { cleanTag, mergeTags, normalizeTag, type Audience, type Stage } from '@/lib/outreach/engine'
import type { CsvContact } from '@/lib/outreach/csv'

const PATH = '/dashboard/admin/prospection'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié.')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') throw new Error('Non autorisé.')
  return getServiceClient()
}

type Res<T = unknown> = { ok: true; data?: T } | { ok: false; error: string }
async function wrap<T>(fn: () => Promise<T>): Promise<Res<T>> {
  try { return { ok: true, data: await fn() } } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Erreur inattendue' } }
}

/** Colonne ou valeur inconnue : la migration 116 n'est pas encore appliquée */
function migrationHint(message: string): string {
  return /trigger_tag|next_action|signature_photo|trigger_check|column .* does not exist/i.test(message)
    ? 'Applique d\'abord la migration 20260929_116_prospection_pipeline.sql dans Supabase.'
    : message
}

const AUDIENCES: Audience[] = ['photographe', 'menage', 'hote', 'autre']
const STAGE_KEYS: Stage[] = ['a_trouver', 'a_contacter', 'contacte', 'a_repondu', 'interesse', 'inscrit', 'client', 'pas_interesse', 'desinscrit', 'invalide']

// ─── Séquences ──────────────────────────────────────────────────────────────

export async function installPlaybook(): Promise<Res<{ added: number }>> {
  return wrap(async () => {
    const db = await requireAdmin()
    const { data: existing } = await db.from('outreach_sequences').select('id, playbook_key')
    const byKey = new Map((existing ?? []).filter(s => s.playbook_key).map(s => [s.playbook_key as string, s.id as string]))
    let added = 0
    for (const [i, p] of PLAYBOOK.entries()) {
      if (byKey.has(p.key)) continue
      const { data: seq, error } = await db.from('outreach_sequences').insert({
        nom: p.nom, audience: p.audience, description: p.description, trigger: p.trigger, trigger_stage: p.trigger_stage ?? null,
        enabled: false, stop_on_reply: p.stop_on_reply ?? true, repeat_after_days: p.repeat_after_days ?? null,
        max_repeats: p.max_repeats ?? 0, end_stage: p.end_stage ?? null, playbook_key: p.key, position: i,
      }).select('id').single()
      if (error || !seq) throw new Error(error?.message ?? 'Création impossible')
      byKey.set(p.key, seq.id)
      await db.from('outreach_steps').insert(p.steps.map((st, j) => ({
        sequence_id: seq.id, position: j, delay_days: st.delay_days, subject: st.subject, body: st.body, same_thread: st.same_thread ?? j > 0,
      })))
      added++
    }
    for (const p of PLAYBOOK) {
      if (p.then_key && byKey.get(p.key) && byKey.get(p.then_key)) {
        await db.from('outreach_sequences').update({ then_sequence_id: byKey.get(p.then_key) }).eq('id', byKey.get(p.key)!).is('then_sequence_id', null)
      }
    }
    revalidatePath(PATH)
    return { added }
  })
}

export interface SequenceInput {
  id?: string
  nom: string
  audience: Audience
  description: string | null
  trigger: 'manuel' | 'nouveau_contact' | 'etape' | 'etiquette'
  trigger_stage: Stage | null
  trigger_tag: string | null
  stop_on_reply: boolean
  repeat_after_days: number | null
  max_repeats: number
  then_sequence_id: string | null
  end_stage: Stage | null
  steps: Array<{ id?: string; delay_days: number; subject: string; body: string; same_thread: boolean }>
}

export async function saveSequence(input: SequenceInput): Promise<Res<{ id: string }>> {
  return wrap(async () => {
    const db = await requireAdmin()
    if (!input.nom.trim()) throw new Error('Donne un nom à la séquence.')
    if (!AUDIENCES.includes(input.audience)) throw new Error('Audience inconnue.')
    if (input.trigger === 'etape' && !input.trigger_stage) throw new Error('Choisis l\'étape qui déclenche la séquence.')
    if (input.trigger === 'etiquette' && !cleanTag(input.trigger_tag ?? '')) throw new Error('Choisis l\'étiquette qui déclenche la séquence.')
    if (!input.steps.length) throw new Error('Ajoute au moins un e-mail.')
    for (const [i, st] of input.steps.entries()) {
      if (!st.subject.trim() || !st.body.trim()) throw new Error(`L'e-mail ${i + 1} n'a pas d'objet ou de texte.`)
      if (st.delay_days < 0 || st.delay_days > 90) throw new Error(`Délai de l'e-mail ${i + 1} : entre 0 et 90 jours.`)
    }
    if (input.id && input.then_sequence_id === input.id) throw new Error('Une séquence ne peut pas s\'enchaîner sur elle-même.')
    const row = {
      nom: input.nom.trim().slice(0, 120), audience: input.audience, description: input.description?.trim() || null,
      trigger: input.trigger, trigger_stage: input.trigger === 'etape' ? input.trigger_stage : null,
      ...(input.trigger === 'etiquette' || input.trigger_tag ? { trigger_tag: input.trigger === 'etiquette' ? cleanTag(input.trigger_tag ?? '') : null } : {}),
      stop_on_reply: input.stop_on_reply,
      repeat_after_days: input.repeat_after_days && input.max_repeats > 0 ? Math.min(365, Math.max(7, input.repeat_after_days)) : null,
      max_repeats: input.repeat_after_days ? Math.min(5, Math.max(0, input.max_repeats)) : 0,
      then_sequence_id: input.then_sequence_id || null, end_stage: input.end_stage || null, updated_at: new Date().toISOString(),
    }
    let id = input.id
    if (id) {
      const { error } = await db.from('outreach_sequences').update(row).eq('id', id)
      if (error) throw new Error(migrationHint(error.message))
    } else {
      const { data, error } = await db.from('outreach_sequences').insert({ ...row, enabled: false }).select('id').single()
      if (error || !data) throw new Error(error ? migrationHint(error.message) : 'Création impossible')
      id = data.id as string
    }
    // Étapes : mise à jour de celles qui restent, ajout des nouvelles, suppression des retirées
    const { data: current } = await db.from('outreach_steps').select('id').eq('sequence_id', id)
    const keep = new Set(input.steps.map(s => s.id).filter(Boolean))
    const removed = (current ?? []).map(s => s.id).filter(sid => !keep.has(sid))
    if (removed.length) await db.from('outreach_steps').delete().in('id', removed)
    for (const [i, st] of input.steps.entries()) {
      const data = { position: i, delay_days: Math.round(st.delay_days), subject: st.subject.trim(), body: st.body.trim(), same_thread: i > 0 && st.same_thread, updated_at: new Date().toISOString() }
      if (st.id) await db.from('outreach_steps').update(data).eq('id', st.id).eq('sequence_id', id)
      else await db.from('outreach_steps').insert({ ...data, sequence_id: id })
    }
    revalidatePath(PATH)
    return { id: id! }
  })
}

export async function setSequenceEnabled(id: string, enabled: boolean): Promise<Res> {
  return wrap(async () => {
    const db = await requireAdmin()
    await db.from('outreach_sequences').update({ enabled, updated_at: new Date().toISOString() }).eq('id', id)
    revalidatePath(PATH)
  })
}

export async function deleteSequence(id: string): Promise<Res> {
  return wrap(async () => {
    const db = await requireAdmin()
    await db.from('outreach_sequences').delete().eq('id', id)
    revalidatePath(PATH)
  })
}

// ─── Contacts ───────────────────────────────────────────────────────────────

export async function enrollInSequence(sequenceId: string, contactIds: string[]): Promise<Res<{ added: number }>> {
  return wrap(async () => {
    const db = await requireAdmin()
    const added = await enroll(db, sequenceId, contactIds.slice(0, 1000))
    revalidatePath(PATH)
    return { added }
  })
}

export async function stopContacts(contactIds: string[]): Promise<Res> {
  return wrap(async () => {
    const db = await requireAdmin()
    await stopEnrollments(db, contactIds, 'manuel')
    revalidatePath(PATH)
  })
}

export async function changeStage(contactIds: string[], stage: Stage): Promise<Res<{ started: string[] }>> {
  return wrap(async () => {
    const db = await requireAdmin()
    if (!STAGE_KEYS.includes(stage)) throw new Error('Étape inconnue.')
    if (stage === 'desinscrit') {
      const { data } = await db.from('outreach_contacts').select('email_norm').in('id', contactIds)
      const rows = (data ?? []).filter(c => c.email_norm).map(c => ({ email_norm: c.email_norm, reason: 'manuel' }))
      if (rows.length) await db.from('outreach_suppressions').upsert(rows, { onConflict: 'email_norm', ignoreDuplicates: true })
    }
    const started = await setStage(db, contactIds, stage)
    revalidatePath(PATH)
    return { started }
  })
}

/** Étiquettes et rappel d'un contact. Les étiquettes nouvelles lancent leurs séquences. */
export async function updateContactMeta(id: string, input: { tags: string[]; next_action: string | null; next_action_on: string | null }): Promise<Res<{ started: string[] }>> {
  return wrap(async () => {
    const db = await requireAdmin()
    const { data: before } = await db.from('outreach_contacts').select('tags').eq('id', id).maybeSingle()
    const tags = mergeTags([], input.tags).slice(0, 20)
    const had = new Set(((before?.tags as string[] | null) ?? []).map(normalizeTag))
    const added = tags.filter(t => !had.has(normalizeTag(t)))
    const on = input.next_action_on && /^\d{4}-\d{2}-\d{2}$/.test(input.next_action_on) ? input.next_action_on : null
    const { error } = await db.from('outreach_contacts').update({
      tags, next_action: clean(input.next_action, 160), next_action_on: on, updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) throw new Error(migrationHint(error.message))
    const started = await onTagsAdded(db, [id], added)
    revalidatePath(PATH)
    return { started }
  })
}

/** Ajoute ou retire une étiquette sur plusieurs contacts (sélection). */
export async function tagContacts(ids: string[], tag: string, mode: 'ajouter' | 'retirer'): Promise<Res<{ changed: number; started: string[] }>> {
  return wrap(async () => {
    const db = await requireAdmin()
    const t = cleanTag(tag)
    if (!t) throw new Error('Étiquette vide.')
    const { data } = await db.from('outreach_contacts').select('id, tags').in('id', ids.slice(0, 1000))
    let changed = 0
    const gained: string[] = []
    for (const c of data ?? []) {
      const cur = (c.tags as string[] | null) ?? []
      const has = cur.some(x => normalizeTag(x) === normalizeTag(t))
      if (mode === 'ajouter' && has) continue
      if (mode === 'retirer' && !has) continue
      const next = mode === 'ajouter' ? mergeTags(cur, [t]) : cur.filter(x => normalizeTag(x) !== normalizeTag(t))
      await db.from('outreach_contacts').update({ tags: next, updated_at: new Date().toISOString() }).eq('id', c.id)
      if (mode === 'ajouter') gained.push(c.id)
      changed++
    }
    const started = mode === 'ajouter' ? await onTagsAdded(db, gained, [t]) : []
    revalidatePath(PATH)
    return { changed, started }
  })
}

export interface ContactInput {
  id?: string
  audience: Audience
  email?: string | null
  prenom?: string | null
  nom?: string | null
  entreprise?: string | null
  ville?: string | null
  departement?: string | null
  site_web?: string | null
  telephone?: string | null
  instagram?: string | null
  notes?: string | null
  /** Étape de départ d'un nouveau contact (« Ajouter une carte » dans une colonne du pipeline) */
  stage?: Stage | null
}

const clean = (v?: string | null, max = 200) => (v ?? '').trim().slice(0, max) || null
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function saveContact(input: ContactInput): Promise<Res<{ id: string }>> {
  return wrap(async () => {
    const db = await requireAdmin()
    const email = clean(input.email)?.toLowerCase() ?? null
    if (email && !EMAIL_OK.test(email)) throw new Error('Adresse e-mail invalide.')
    if (!email && !clean(input.nom) && !clean(input.entreprise)) throw new Error('Il faut au moins un nom ou un e-mail.')
    const row = {
      audience: input.audience, email, prenom: clean(input.prenom, 60), nom: clean(input.nom), entreprise: clean(input.entreprise),
      ville: clean(input.ville, 80), departement: clean(input.departement, 3), site_web: clean(input.site_web, 300),
      telephone: clean(input.telephone, 40), instagram: clean(input.instagram, 80), notes: clean(input.notes, 2000),
      updated_at: new Date().toISOString(),
    }
    if (input.id) {
      const { data: before } = await db.from('outreach_contacts').select('stage, email').eq('id', input.id).maybeSingle()
      const stageFix = before?.stage === 'a_trouver' && email ? { stage: 'a_contacter' } : {}
      const { error } = await db.from('outreach_contacts').update({ ...row, ...stageFix }).eq('id', input.id)
      if (error) throw new Error(/duplicate|unique/i.test(error.message) ? 'Cette adresse est déjà dans tes contacts.' : error.message)
      revalidatePath(PATH)
      return { id: input.id }
    }
    const wanted = input.stage && STAGE_KEYS.includes(input.stage) ? input.stage : null
    const initial: Stage = wanted && (email || wanted !== 'a_contacter') ? wanted : email ? 'a_contacter' : 'a_trouver'
    const { data, error } = await db.from('outreach_contacts').insert({ ...row, source: 'manuel', stage: initial }).select('id').single()
    if (error || !data) throw new Error(error && /duplicate|unique/i.test(error.message) ? 'Cette adresse est déjà dans tes contacts.' : (error?.message ?? 'Ajout impossible'))
    // Une carte posée directement dans une étape lance les séquences de cette étape
    if (!['a_trouver', 'a_contacter'].includes(initial)) await setStage(db, [data.id as string], initial)
    revalidatePath(PATH)
    return { id: data.id as string }
  })
}

export async function deleteContacts(ids: string[]): Promise<Res> {
  return wrap(async () => {
    const db = await requireAdmin()
    await db.from('outreach_contacts').delete().in('id', ids)
    revalidatePath(PATH)
  })
}

/** Ajoute des contacts trouvés (fichier, annuaire, Google). Doublons (e-mail ou SIREN) et adresses opposées ignorés. */
export async function importContacts(audience: Audience, rows: Array<CsvContact | FoundContact>, source: 'csv' | 'datatourisme' | 'sirene' | 'google', sourceDetail: string): Promise<Res<{ added: number; skipped: number; ids: string[] }>> {
  return wrap(async () => {
    const db = await requireAdmin()
    if (!AUDIENCES.includes(audience)) throw new Error('Audience inconnue.')
    const list = rows.slice(0, 2000)
    const emails = list.map(r => r.email?.toLowerCase()).filter(Boolean) as string[]
    const blocked = new Set<string>()
    for (let i = 0; i < emails.length; i += 300) {
      const { data } = await db.from('outreach_suppressions').select('email_norm').in('email_norm', emails.slice(i, i + 300))
      for (const r of data ?? []) blocked.add(r.email_norm)
    }
    const seen = new Set<string>()
    const toInsert = list.flatMap(r => {
      const email = r.email?.toLowerCase().trim() || null
      if (email && (blocked.has(email) || !EMAIL_OK.test(email))) return []
      const key = email ?? ('siren' in r && r.siren ? `siren:${r.siren}` : `${r.nom}|${r.ville}`)
      if (seen.has(key)) return []
      seen.add(key)
      return [{
        audience, email, prenom: clean(r.prenom, 60), nom: clean(r.nom), entreprise: clean(r.entreprise), ville: clean(r.ville, 80),
        departement: clean(r.departement, 3), site_web: clean(r.site_web, 300), telephone: clean(r.telephone, 40),
        instagram: 'instagram' in r ? clean((r as CsvContact).instagram, 80) : null, siren: clean(r.siren, 14),
        source, source_detail: ('source_detail' in r && r.source_detail) ? r.source_detail : sourceDetail,
        stage: email ? 'a_contacter' : 'a_trouver',
      }]
    })
    const ids: string[] = []
    for (let i = 0; i < toInsert.length; i += 200) {
      const chunk = toInsert.slice(i, i + 200)
      // Un doublon ne doit pas bloquer le reste : insertion ligne par ligne en cas de conflit
      const { data, error } = await db.from('outreach_contacts').insert(chunk).select('id')
      if (!error) { ids.push(...(data ?? []).map(d => d.id as string)); continue }
      for (const row of chunk) {
        const { data: one, error: e2 } = await db.from('outreach_contacts').insert(row).select('id').single()
        if (!e2 && one) ids.push(one.id as string)
      }
    }
    revalidatePath(PATH)
    return { added: ids.length, skipped: list.length - ids.length, ids }
  })
}

// ─── Sources ────────────────────────────────────────────────────────────────

export async function searchSireneAction(audience: Audience, naf: string, departement: string, page: number): Promise<Res<{ results: FoundContact[]; total: number; pages: number; known: string[] }>> {
  return wrap(async () => {
    const db = await requireAdmin()
    const res = await searchSirene({ audience, naf, departement, page })
    const sirens = res.results.map(r => r.siren).filter(Boolean) as string[]
    const { data } = sirens.length ? await db.from('outreach_contacts').select('siren').in('siren', sirens) : { data: [] }
    return { ...res, known: (data ?? []).map(d => d.siren as string) }
  })
}

export async function searchGoogleAction(audience: Audience, query: string, pageToken?: string): Promise<Res<{ results: FoundContact[]; nextPageToken: string | null; known: string[] }>> {
  return wrap(async () => {
    const db = await requireAdmin()
    const res = await searchGooglePlaces({ audience, query, pageToken })
    const sites = res.results.map(r => r.site_web).filter(Boolean) as string[]
    const { data } = sites.length ? await db.from('outreach_contacts').select('site_web').in('site_web', sites) : { data: [] }
    return { ...res, known: (data ?? []).map(d => d.site_web as string) }
  })
}

/** Cherche l'e-mail sur le site des contacts « E-mail à trouver » (par lots, ~40 s max). */
export async function findEmails(contactIds: string[]): Promise<Res<{ found: number; checked: number; left: number }>> {
  return wrap(async () => {
    const db = await requireAdmin()
    const started = Date.now()
    const { data } = await db.from('outreach_contacts').select('id, site_web, source_detail, source').in('id', contactIds.slice(0, 60)).is('email', null).not('site_web', 'is', null)
    let found = 0
    let checked = 0
    for (const c of data ?? []) {
      if (Date.now() - started > 40_000) break
      checked++
      const { email } = await findEmailOnSite(c.site_web as string)
      if (!email) continue
      const { data: supp } = await db.from('outreach_suppressions').select('email_norm').eq('email_norm', email).maybeSingle()
      if (supp) continue
      const { error } = await db.from('outreach_contacts').update({
        email, stage: 'a_contacter', source: 'site',
        source_detail: `E-mail publié sur ${c.site_web}${c.source_detail ? ` (${c.source_detail})` : ''}`.slice(0, 300),
        updated_at: new Date().toISOString(),
      }).eq('id', c.id)
      if (!error) found++
    }
    revalidatePath(PATH)
    return { found, checked, left: (data?.length ?? 0) - checked }
  })
}

// ─── Réglages et envois ─────────────────────────────────────────────────────

export async function saveSettings(input: { daily_cap: number; send_days: number[]; paused: boolean; signature: string; signature_photo: boolean }): Promise<Res> {
  return wrap(async () => {
    const db = await requireAdmin()
    const days = input.send_days.filter(d => d >= 1 && d <= 7)
    if (!days.length) throw new Error('Choisis au moins un jour d\'envoi.')
    await db.from('outreach_settings').update({
      daily_cap: Math.min(200, Math.max(1, Math.round(input.daily_cap))), send_days: days, paused: input.paused,
      signature: input.signature.trim().slice(0, 500) || null, updated_at: new Date().toISOString(),
    }).eq('id', 1)
    // Colonne de la migration 116 : écrite à part pour que le reste s'enregistre même sans elle
    const { error } = await db.from('outreach_settings').update({ signature_photo: input.signature_photo }).eq('id', 1)
    if (error && !input.signature_photo) throw new Error(migrationHint(error.message))
    revalidatePath(PATH)
  })
}

export async function runNow(): Promise<Res<RunSummary>> {
  return wrap(async () => {
    const db = await requireAdmin()
    const summary = await runOutreach(db, { budgetMs: 40_000, force: true })
    if (summary.more) await relaunchOutreach(1, true)
    revalidatePath(PATH)
    return summary
  })
}

export async function sendTestEmail(subject: string, body: string): Promise<Res<{ to: string }>> {
  return wrap(async () => {
    const db = await requireAdmin()
    const res = await sendTest(subject, body, await loadSettings(db))
    if (!res.ok) throw new Error(res.error)
    return { to: res.to! }
  })
}

export async function contactHistory(contactId: string): Promise<Res<{
  sends: Array<{ subject: string; sent_at: string; status: string; error: string | null; sequence_id: string | null }>
  enrollments: Array<{ sequence_id: string; status: string; stop_reason: string | null; next_step: number; next_send_on: string | null; loop_count: number }>
}>> {
  return wrap(async () => {
    const db = await requireAdmin()
    const [{ data: sends }, { data: enrollments }] = await Promise.all([
      db.from('outreach_sends').select('subject, sent_at, status, error, sequence_id').eq('contact_id', contactId).order('sent_at', { ascending: false }).limit(30),
      db.from('outreach_enrollments').select('sequence_id, status, stop_reason, next_step, next_send_on, loop_count').eq('contact_id', contactId).order('created_at', { ascending: false }),
    ])
    return { sends: sends ?? [], enrollments: enrollments ?? [] }
  })
}
