// Prospection : opérations en base (service role, appelées par le cron et
// les actions admin après vérification du rôle). Voir engine.ts pour les
// règles pures et mailer.ts pour l'envoi.

import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { parisToday } from '@/lib/stripe/deposit-window'
import { logger } from '@/lib/logger'
import {
  afterSend, complianceFooter, guessFirstName, isoWeekday, renderTemplate, replySubject, scheduleStep,
  textToHtml, DEFAULT_SIGNATURE, LEGACY_DEFAULT_SIGNATURE, CLOSED_STAGES, type Audience, type Source, type Stage,
} from './engine'
import { isPermanentAddressError, outreachConfig, scanInbox, sendOutreachMail } from './mailer'

const log = logger('outreach')
type Db = SupabaseClient<any, 'public', any>

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

export interface Settings {
  daily_cap: number
  send_days: number[]
  paused: boolean
  signature: string | null
  last_imap_check: string | null
  last_run_at: string | null
  last_run_summary: string | null
}

export async function loadSettings(db: Db): Promise<Settings> {
  const { data } = await db.from('outreach_settings').select('daily_cap, send_days, paused, signature, last_imap_check, last_run_at, last_run_summary').eq('id', 1).maybeSingle()
  return {
    daily_cap: data?.daily_cap ?? 25,
    send_days: data?.send_days ?? [1, 2, 3, 4, 5],
    paused: data?.paused ?? false,
    signature: data?.signature && data.signature.trim() !== LEGACY_DEFAULT_SIGNATURE ? data.signature : null,
    last_imap_check: data?.last_imap_check ?? null,
    last_run_at: data?.last_run_at ?? null,
    last_run_summary: data?.last_run_summary ?? null,
  }
}


export function unsubscribeUrls(token: string) {
  return {
    page: `${APP_URL}/desinscription/${token}`,
    oneClick: `${APP_URL}/api/outreach/unsubscribe?t=${token}`,
  }
}

// ─── Opposition ─────────────────────────────────────────────────────────────

export async function suppress(db: Db, email: string, reason: 'desinscrit' | 'rebond' | 'plainte' | 'manuel') {
  const norm = email.trim().toLowerCase()
  if (!norm) return
  await db.from('outreach_suppressions').upsert({ email_norm: norm, reason }, { onConflict: 'email_norm', ignoreDuplicates: true })
  const { data: contacts } = await db.from('outreach_contacts').select('id').eq('email_norm', norm)
  const ids = (contacts ?? []).map(c => c.id)
  if (ids.length) await setStage(db, ids, reason === 'rebond' ? 'invalide' : 'desinscrit')
}

// ─── Inscriptions dans une séquence ────────────────────────────────────────

/** Inscrit des contacts dans une séquence (ignore sans e-mail, opposés, étapes fermées, déjà inscrits). */
export async function enroll(db: Db, sequenceId: string, contactIds: string[], opts: { today?: string } = {}): Promise<number> {
  if (!contactIds.length) return 0
  const today = opts.today ?? parisToday()
  const settings = await loadSettings(db)
  const { data: steps } = await db.from('outreach_steps').select('delay_days, position').eq('sequence_id', sequenceId).order('position')
  if (!steps?.length) return 0
  const { data: contacts } = await db.from('outreach_contacts').select('id, email_norm, stage').in('id', contactIds)
  const emails = (contacts ?? []).map(c => c.email_norm).filter(Boolean) as string[]
  const { data: supp } = emails.length ? await db.from('outreach_suppressions').select('email_norm').in('email_norm', emails) : { data: [] }
  const blocked = new Set((supp ?? []).map(s => s.email_norm))
  const eligible = (contacts ?? []).filter(c => c.email_norm && !blocked.has(c.email_norm) && !CLOSED_STAGES.includes(c.stage) && c.stage !== 'a_repondu' && c.stage !== 'a_trouver')
  if (!eligible.length) return 0
  const next = scheduleStep(today, steps[0].delay_days, settings.send_days)
  const rows = eligible.map(c => ({ sequence_id: sequenceId, contact_id: c.id, status: 'en_cours', next_step: 0, next_send_on: next, loop_count: 0 }))
  const { data, error } = await db.from('outreach_enrollments').upsert(rows, { onConflict: 'sequence_id,contact_id', ignoreDuplicates: true }).select('id')
  if (error) { log.error('enroll', error); return 0 }
  return data?.length ?? 0
}

/** Arrête les parcours en cours d'un ou plusieurs contacts. */
export async function stopEnrollments(db: Db, contactIds: string[], reason: string, onlyStopOnReply = false) {
  if (!contactIds.length) return
  const q = db.from('outreach_enrollments').select('id, sequence_id, outreach_sequences(stop_on_reply)').in('contact_id', contactIds).eq('status', 'en_cours')
  const { data } = await q
  const ids = (data ?? [])
    .filter((e: any) => !onlyStopOnReply || (Array.isArray(e.outreach_sequences) ? e.outreach_sequences[0]?.stop_on_reply : e.outreach_sequences?.stop_on_reply) !== false)
    .map((e: any) => e.id)
  if (ids.length) await db.from('outreach_enrollments').update({ status: 'arretee', stop_reason: reason, updated_at: new Date().toISOString() }).in('id', ids)
}

/**
 * Change l'étape du pipeline : arrête ce qui doit l'être puis démarre les
 * séquences actives déclenchées par cette étape.
 */
export async function setStage(db: Db, contactIds: string[], stage: Stage, extra: Record<string, unknown> = {}) {
  if (!contactIds.length) return
  await db.from('outreach_contacts').update({ stage, updated_at: new Date().toISOString(), ...extra }).in('id', contactIds)
  if (stage === 'a_repondu') await stopEnrollments(db, contactIds, 'reponse', true)
  else if (['desinscrit', 'invalide', 'pas_interesse', 'interesse', 'inscrit', 'client'].includes(stage)) await stopEnrollments(db, contactIds, stage)
  // Séquences déclenchées par cette étape, pour l'audience de chaque contact
  const { data: seqs } = await db.from('outreach_sequences').select('id, audience').eq('trigger', 'etape').eq('trigger_stage', stage).eq('enabled', true)
  if (!seqs?.length) return
  const { data: contacts } = await db.from('outreach_contacts').select('id, audience').in('id', contactIds)
  for (const s of seqs) {
    const ids = (contacts ?? []).filter(c => c.audience === s.audience).map(c => c.id)
    if (ids.length) await enroll(db, s.id, ids)
  }
}

// ─── Passage du cron ────────────────────────────────────────────────────────

export interface RunSummary {
  configured: boolean
  replies: number
  bounces: number
  signups: number
  autoEnrolled: number
  sent: number
  errors: number
  skipped?: string
  /** Envois encore dus quand le temps du passage est écoulé : relancer un passage */
  more?: boolean
}

/**
 * Écart entre deux envois. Les boîtes mutualisées limitent le débit
 * (Hostinger Business Email : 10 e-mails par minute, 100 par jour sur
 * l'offre gratuite) : 6,5 à 8,5 s garde toujours sous 10 par minute.
 */
export const SEND_GAP_MS = 6_500
const SEND_GAP_JITTER_MS = 2_000

const OPEN_FOR_SIGNUP: Stage[] = ['a_trouver', 'a_contacter', 'contacte', 'a_repondu', 'interesse', 'pas_interesse']

/** Contacts devenus inscrits ou clients (fiche photographe / ménage, compte hôte). */
async function syncSignups(db: Db): Promise<number> {
  let changed = 0
  const tables: Array<{ audience: Audience; table: 'photographers' | 'cleaners' }> = [
    { audience: 'photographe', table: 'photographers' },
    { audience: 'menage', table: 'cleaners' },
  ]
  for (const t of tables) {
    const { data: contacts } = await db.from('outreach_contacts').select('id, email_norm, stage').eq('audience', t.audience).in('stage', [...OPEN_FOR_SIGNUP, 'inscrit']).not('email_norm', 'is', null).limit(2000)
    if (!contacts?.length) continue
    const emails = contacts.map(c => c.email_norm as string)
    const found = new Map<string, string>()
    for (let i = 0; i < emails.length; i += 200) {
      const { data } = await db.from(t.table).select('email, status').in('email', emails.slice(i, i + 200))
      for (const r of data ?? []) found.set(String(r.email).toLowerCase(), r.status)
    }
    const toClient = contacts.filter(c => found.get(c.email_norm as string) === 'active' && c.stage !== 'client').map(c => c.id)
    const toInscrit = contacts.filter(c => found.has(c.email_norm as string) && found.get(c.email_norm as string) !== 'active' && c.stage !== 'inscrit').map(c => c.id)
    if (toClient.length) await setStage(db, toClient, 'client')
    if (toInscrit.length) await setStage(db, toInscrit, 'inscrit')
    changed += toClient.length + toInscrit.length
  }
  // Hôtes : compte créé (profiles.email), abonnement Standard = client
  const { data: hosts } = await db.from('outreach_contacts').select('id, email_norm, stage').eq('audience', 'hote').in('stage', [...OPEN_FOR_SIGNUP, 'inscrit']).not('email_norm', 'is', null).limit(2000)
  if (hosts?.length) {
    const emails = hosts.map(c => c.email_norm as string)
    const plans = new Map<string, string>()
    for (let i = 0; i < emails.length; i += 200) {
      const { data } = await db.from('profiles').select('email, plan').in('email', emails.slice(i, i + 200))
      for (const r of data ?? []) if (r.email) plans.set(String(r.email).toLowerCase(), r.plan ?? 'decouverte')
    }
    const toClient = hosts.filter(c => plans.has(c.email_norm as string) && plans.get(c.email_norm as string) !== 'decouverte' && c.stage !== 'client').map(c => c.id)
    const toInscrit = hosts.filter(c => plans.get(c.email_norm as string) === 'decouverte' && c.stage !== 'inscrit').map(c => c.id)
    if (toClient.length) await setStage(db, toClient, 'client')
    if (toInscrit.length) await setStage(db, toInscrit, 'inscrit')
    changed += toClient.length + toInscrit.length
  }
  return changed
}

/** Séquences « automatiques » : contacts « À contacter » jamais contactés. */
async function autoEnroll(db: Db, today: string): Promise<number> {
  const { data: seqs } = await db.from('outreach_sequences').select('id, audience').eq('trigger', 'nouveau_contact').eq('enabled', true)
  let n = 0
  for (const s of seqs ?? []) {
    const { data: contacts } = await db.from('outreach_contacts').select('id').eq('audience', s.audience).eq('stage', 'a_contacter').is('last_contacted_at', null).not('email_norm', 'is', null).limit(300)
    const ids = (contacts ?? []).map(c => c.id)
    if (!ids.length) continue
    const { data: busy } = await db.from('outreach_enrollments').select('contact_id').in('contact_id', ids).eq('status', 'en_cours')
    const busySet = new Set((busy ?? []).map(b => b.contact_id))
    n += await enroll(db, s.id, ids.filter(id => !busySet.has(id)), { today })
  }
  return n
}

async function handleInbox(db: Db, settings: Settings): Promise<{ replies: number; bounces: number }> {
  const cfg = outreachConfig()
  if (!cfg) return { replies: 0, bounces: 0 }
  // Contacts à surveiller : ceux qu'on a déjà contactés
  const { data: contacted } = await db.from('outreach_contacts').select('id, email_norm, stage').not('last_contacted_at', 'is', null).not('email_norm', 'is', null).limit(5000)
  const byEmail = new Map((contacted ?? []).map(c => [c.email_norm as string, c]))
  const since = settings.last_imap_check
    ? new Date(Math.max(new Date(settings.last_imap_check).getTime() - 36 * 3600_000, Date.now() - 10 * 86400_000))
    : new Date(Date.now() - 3 * 86400_000)
  const scan = await scanInbox(cfg, since, new Set(byEmail.keys()))
  let replies = 0
  for (const [email, when] of Array.from(scan.replies.entries())) {
    const c = byEmail.get(email)
    if (!c || ['a_repondu', 'interesse', 'inscrit', 'client', 'desinscrit', 'invalide', 'pas_interesse'].includes(c.stage)) continue
    await setStage(db, [c.id], 'a_repondu', { replied_at: when.toISOString() })
    replies++
  }
  for (const email of scan.bounces) await suppress(db, email, 'rebond')
  await db.from('outreach_settings').update({ last_imap_check: new Date().toISOString() }).eq('id', 1)
  return { replies, bounces: scan.bounces.length }
}

/**
 * Un passage complet : réponses et rebonds, inscriptions détectées,
 * inscriptions automatiques, puis envois dus dans la limite du plafond
 * quotidien et du temps disponible.
 */
export async function runOutreach(db: Db, opts: { budgetMs?: number; force?: boolean; sendOnly?: boolean } = {}): Promise<RunSummary> {
  const started = Date.now()
  const budget = opts.budgetMs ?? 45_000
  const cfg = outreachConfig()
  const settings = await loadSettings(db)
  const today = parisToday()
  const summary: RunSummary = { configured: !!cfg, replies: 0, bounces: 0, signups: 0, autoEnrolled: 0, sent: 0, errors: 0 }

  // Passage de relance (suite d'un passage à court de temps) : envois seulement
  if (!opts.sendOnly) {
    try {
      const inbox = await handleInbox(db, settings)
      summary.replies = inbox.replies
      summary.bounces = inbox.bounces
    } catch (e) { log.error('lecture de la boîte', e) }
    try { summary.signups = await syncSignups(db) } catch (e) { log.error('inscriptions', e) }
    try { summary.autoEnrolled = await autoEnroll(db, today) } catch (e) { log.error('inscription auto', e) }
  }

  if (!cfg) summary.skipped = 'Boîte d\'envoi non configurée'
  else if (settings.paused) summary.skipped = 'Envois en pause'
  else if (!opts.force && !settings.send_days.includes(isoWeekday(today))) summary.skipped = 'Pas un jour d\'envoi'
  else await sendDue(db, settings, today, started, budget, summary)

  const text = [
    `${summary.sent} envoyé${summary.sent > 1 ? 's' : ''}`,
    summary.errors ? `${summary.errors} erreur${summary.errors > 1 ? 's' : ''}` : '',
    summary.replies ? `${summary.replies} réponse${summary.replies > 1 ? 's' : ''}` : '',
    summary.bounces ? `${summary.bounces} rebond${summary.bounces > 1 ? 's' : ''}` : '',
    summary.signups ? `${summary.signups} inscription${summary.signups > 1 ? 's' : ''}` : '',
    summary.skipped ?? '',
  ].filter(Boolean).join(' · ')
  const label = `${opts.sendOnly ? 'Suite du passage : ' : ''}${text}${summary.more ? ' · la suite part dans la foulée' : ''}`
  await db.from('outreach_settings').update({ last_run_at: new Date().toISOString(), last_run_summary: label }).eq('id', 1)
  return summary
}

/** Minuit à Paris pour la date `today` (heure d'été ou d'hiver). */
function parisMidnight(today: string): Date {
  for (const off of ['+02:00', '+01:00']) {
    const t = new Date(`${today}T00:00:00${off}`)
    if (parisToday(t) === today && parisToday(new Date(t.getTime() - 1)) !== today) return t
  }
  return new Date(`${today}T00:00:00Z`)
}

type DueRow = {
  id: string; sequence_id: string; contact_id: string; next_step: number; loop_count: number
  thread_message_id: string | null; thread_subject: string | null
}

async function sendDue(db: Db, settings: Settings, today: string, started: number, budget: number, summary: RunSummary) {
  const cfg = outreachConfig()!
  const dayStart = parisMidnight(today).toISOString()
  const { count: sentToday } = await db.from('outreach_sends').select('id', { count: 'exact', head: true }).eq('status', 'envoye').gte('sent_at', dayStart)
  let remaining = Math.max(0, settings.daily_cap - (sentToday ?? 0))
  if (!remaining) { summary.skipped = 'Plafond du jour atteint'; return }

  const { data: seqs } = await db.from('outreach_sequences').select('id, enabled, repeat_after_days, max_repeats, then_sequence_id, end_stage')
  const seqMap = new Map((seqs ?? []).map(s => [s.id, s]))
  const enabledIds = (seqs ?? []).filter(s => s.enabled).map(s => s.id)
  if (!enabledIds.length) { summary.skipped = 'Aucune séquence active'; return }

  const { data: due } = await db.from('outreach_enrollments')
    .select('id, sequence_id, contact_id, next_step, loop_count, thread_message_id, thread_subject')
    .eq('status', 'en_cours').lte('next_send_on', today).in('sequence_id', enabledIds)
    .order('next_send_on').order('created_at').limit(remaining * 2)
  if (!due?.length) return

  const stepsCache = new Map<string, Array<{ position: number; delay_days: number; subject: string; body: string; same_thread: boolean }>>()
  const contactIds = Array.from(new Set(due.map(d => d.contact_id)))
  const { data: contacts } = await db.from('outreach_contacts').select('id, email, email_norm, prenom, nom, entreprise, ville, source, stage, unsubscribe_token').in('id', contactIds)
  const contactMap = new Map((contacts ?? []).map(c => [c.id, c]))
  const emails = (contacts ?? []).map(c => c.email_norm).filter(Boolean) as string[]
  const { data: supp } = emails.length ? await db.from('outreach_suppressions').select('email_norm').in('email_norm', emails) : { data: [] }
  const blocked = new Set((supp ?? []).map(s => s.email_norm))
  const { data: prior } = await db.from('outreach_sends').select('contact_id').in('contact_id', contactIds).eq('status', 'envoye')
  const alreadyWritten = new Set((prior ?? []).map(p => p.contact_id))
  const signature = settings.signature?.trim() || DEFAULT_SIGNATURE

  let attempts = 0
  for (const e of due as DueRow[]) {
    if (remaining <= 0) break
    const c = contactMap.get(e.contact_id)
    if (!c || !c.email || blocked.has(c.email_norm) || CLOSED_STAGES.includes(c.stage) || c.stage === 'a_repondu') {
      await db.from('outreach_enrollments').update({ status: 'arretee', stop_reason: 'contact', updated_at: new Date().toISOString() }).eq('id', e.id)
      continue
    }
    if (!stepsCache.has(e.sequence_id)) {
      const { data: st } = await db.from('outreach_steps').select('position, delay_days, subject, body, same_thread').eq('sequence_id', e.sequence_id).order('position')
      stepsCache.set(e.sequence_id, st ?? [])
    }
    const steps = stepsCache.get(e.sequence_id)!
    const step = steps[e.next_step]
    const seq = seqMap.get(e.sequence_id)
    if (!step || !seq) {
      await db.from('outreach_enrollments').update({ status: 'terminee', updated_at: new Date().toISOString() }).eq('id', e.id)
      continue
    }

    const vars = { prenom: guessFirstName(c.prenom, c.nom), nom: c.nom, entreprise: c.entreprise, ville: c.ville }
    const inThread = step.same_thread && !!e.thread_message_id && e.next_step > 0
    const baseSubject = renderTemplate(step.subject, vars)
    const subject = inThread ? replySubject(e.thread_subject || baseSubject) : baseSubject
    const urls = unsubscribeUrls(c.unsubscribe_token)
    const footer = complianceFooter({ source: c.source as Source, firstMessage: !alreadyWritten.has(c.id), unsubscribeUrl: urls.page })
    const bodyText = renderTemplate(step.body, vars).trim()
    const text = `${bodyText}\n\n${signature}`
    // Rythme humain et limite de débit de la boîte : pause avant chaque envoi
    // sauf le premier, et arrêt propre si la pause dépasse le temps restant.
    const gap = attempts ? SEND_GAP_MS + Math.floor(Math.random() * SEND_GAP_JITTER_MS) : 0
    if (Date.now() - started + gap + 5_000 > budget) { summary.more = true; break }
    if (gap) await new Promise(r => setTimeout(r, gap))
    attempts++
    try {
      const { messageId } = await sendOutreachMail(cfg, {
        to: c.email, subject, text: `${text}\n\n--\n${footer}`, html: textToHtml(bodyText, footer, signature),
        inReplyTo: inThread ? e.thread_message_id : null, unsubscribeUrl: urls.page, oneClickUrl: urls.oneClick,
      })
      await db.from('outreach_sends').insert({ enrollment_id: e.id, contact_id: c.id, sequence_id: e.sequence_id, step_position: e.next_step, email: c.email, subject, message_id: messageId, status: 'envoye' })
      alreadyWritten.add(c.id)
      summary.sent++
      remaining--

      const delays = steps.map(s => s.delay_days)
      const next = afterSend(e.next_step, delays, seq, e.loop_count, today, settings.send_days)
      const threadFields = inThread ? {} : { thread_message_id: messageId, thread_subject: subject }
      if (next.kind === 'next') {
        await db.from('outreach_enrollments').update({ next_step: next.next_step, next_send_on: next.next_send_on, ...threadFields, updated_at: new Date().toISOString() }).eq('id', e.id)
      } else if (next.kind === 'loop') {
        await db.from('outreach_enrollments').update({ next_step: 0, next_send_on: next.next_send_on, loop_count: next.loop_count, thread_message_id: null, thread_subject: null, updated_at: new Date().toISOString() }).eq('id', e.id)
      } else {
        await db.from('outreach_enrollments').update({ status: 'terminee', next_send_on: null, ...threadFields, updated_at: new Date().toISOString() }).eq('id', e.id)
        if (next.chain_to) await enroll(db, next.chain_to, [c.id], { today })
        if (next.end_stage && ['a_contacter', 'contacte'].includes(c.stage)) await setStage(db, [c.id], next.end_stage)
      }
      await db.from('outreach_contacts').update({
        last_contacted_at: new Date().toISOString(),
        ...(c.stage === 'a_contacter' ? { stage: 'contacte' } : {}),
        updated_at: new Date().toISOString(),
      }).eq('id', c.id)
      c.stage = c.stage === 'a_contacter' ? 'contacte' : c.stage
    } catch (err) {
      summary.errors++
      const message = err instanceof Error ? err.message.slice(0, 300) : 'Erreur inconnue'
      await db.from('outreach_sends').insert({ enrollment_id: e.id, contact_id: c.id, sequence_id: e.sequence_id, step_position: e.next_step, email: c.email, subject, status: 'erreur', error: message })
      if (isPermanentAddressError(err)) await suppress(db, c.email, 'rebond')
      else log.warn('envoi', { message })
    }
  }
}

/** Envoi d'essai d'une étape à la boîte de Jason (variables d'exemple). */
export async function sendTest(stepSubject: string, stepBody: string, settings: Settings): Promise<{ ok: boolean; error?: string; to?: string }> {
  const cfg = outreachConfig()
  if (!cfg) return { ok: false, error: 'Boîte d\'envoi non configurée (variables OUTREACH_SMTP_*).' }
  const vars = { prenom: 'Marie', nom: 'Dupont', entreprise: 'Studio Lumière', ville: 'Lyon' }
  const urls = unsubscribeUrls('00000000-0000-0000-0000-000000000000')
  const footer = complianceFooter({ source: 'google', firstMessage: true, unsubscribeUrl: urls.page })
  const signature = settings.signature?.trim() || DEFAULT_SIGNATURE
  const bodyText = renderTemplate(stepBody, vars).trim()
  const text = `${bodyText}\n\n${signature}`
  try {
    await sendOutreachMail(cfg, {
      to: cfg.fromEmail, subject: `[Essai] ${renderTemplate(stepSubject, vars)}`,
      text: `${text}\n\n--\n${footer}`, html: textToHtml(bodyText, footer, signature), unsubscribeUrl: urls.page, oneClickUrl: urls.oneClick,
    })
    return { ok: true, to: cfg.fromEmail }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 200) : 'Envoi impossible' }
  }
}
