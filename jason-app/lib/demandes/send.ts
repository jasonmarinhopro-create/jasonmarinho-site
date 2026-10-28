// Demande inversée, côté serveur : enregistrement, envoi aux pros, e-mails,
// relances (cron notifications-engine) et purge. Règles pures : rules.ts.
// E-mails par Resend (offre gratuite : 100 par jour) : au plus 3 pros + l'hôte
// + Jason par demande.

import { priseToken } from './prise'
import { memberMailSecret } from '@/lib/admin/member-mail-secret'
import 'server-only'
import { Resend } from 'resend'
import { randomBytes, randomUUID } from 'node:crypto'
import { unstable_cache } from 'next/cache'
import { getServiceClient } from '@/lib/supabase/service'
import { logger } from '@/lib/logger'
import { adminUserIds, isDemoFiche } from '@/lib/pros/demo'
import { sendAdminEmail } from '@/lib/email/admin'
import { proEmail, hoteEmail, hoteManuelEmail, adminEmail, type ProMail } from './emails'
import {
  choisirPros, messagePourPro, anonymizedNeed, prochaineAction, CONSERVATION_MOIS,
  besoinPhoto, convientAuBesoin, pourquoiCePro, manquesDuPro, adequationLabel,
  type DemandeInput, type DemandeMetier, type ProCandidat, type DemandeEtat,
} from './rules'
import type { ProChoix } from './admin'
import { cartePro, suiviVue, apercuPhrase, isSuiviToken, type CartePro, type ProPublic, type SuiviRow, type SuiviVue } from './public'

const log = logger('demandes')
const FROM = 'Jason Marinho <notifications@jasonmarinho.com>'
const SITE = 'https://jasonmarinho.com'
const APP = 'https://app.jasonmarinho.com'

type Pro = ProCandidat & { slug: string; full_name: string; pseudo: string | null; email: string; user_id: string | null; portfolio_photos?: unknown; logo_url?: string | null }
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

const T = {
  photographe: { table: 'photographers', contacts: 'contacts' as const, contactTable: 'photographer_contacts', fk: 'photographer_id', rpc: 'increment_photographer_contacts', dir: 'photographes', dash: 'ma-fiche-photographe', label: 'photographe', labels: 'photographes', un: 'un photographe' },
  menage: { table: 'cleaners', contacts: 'contacts' as const, contactTable: 'cleaner_contacts', fk: 'cleaner_id', rpc: 'increment_cleaner_contacts', dir: 'menage', dash: 'ma-fiche-menage', label: 'équipe de ménage', labels: 'équipes de ménage', un: 'une équipe de ménage' },
} as const

interface DemandeRow extends DemandeEtat {
  id: string; metier: DemandeMetier; etablissement?: DemandeInput['etablissement']; ville: string; logement: string | null; quand: string | null; frequence: string | null
  budget: string | null; message: string | null; nom: string; email: string; telephone: string | null; source: string | null
  suivi_token?: string | null; host_closed_at?: string | null
}

function resend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

async function loadPros(metier: DemandeMetier): Promise<Pro[]> {
  const db = getServiceClient()
  const t = T[metier]
  const cols = 'id, slug, full_name, pseudo, email, ville, zone_couverte, villes_couvertes, contacts_count, created_at, user_id'
  const q = (c: string) => db.from(t.table).select(c).eq('status', 'active').eq('is_public', true).not('slug', 'is', null).limit(1000)
  // Photographes : métier et options pour servir d'abord ceux qui font de la vidéo ou du drone (migration 136)
  // Photo et logo : cartes montrées à l'hôte avant l'envoi et dans son suivi (migration 131 pour les photos des équipes)
  const visuel = ', portfolio_photos, logo_url'
  let res: { data: unknown; error: { message: string } | null } = await q(metier === 'photographe' ? `${cols}, metier, options${visuel}` : `${cols}${visuel}`)
  if (res.error && /portfolio_photos|logo_url/.test(res.error.message)) res = await q(metier === 'photographe' ? `${cols}, metier, options` : cols)
  if (res.error && /metier|options/.test(res.error.message)) res = await q(cols)
  if (res.error && /villes_couvertes/.test(res.error.message)) res = await q(cols.replace(' villes_couvertes,', ''))
  // Clientèles (hôtels, conciergeries, gîtes ; migration 154) : lues à part, sans bloquer si la colonne manque
  if (!res.error && Array.isArray(res.data) && res.data.length) {
    const { data: cl, error: clErr } = await db.from(t.table).select('id, clienteles').in('id', (res.data as Array<{ id: string }>).map(p => p.id))
    if (!clErr) {
      const byId = new Map(((cl ?? []) as Array<{ id: string; clienteles: string[] | null }>).map(r => [r.id, r.clienteles ?? []]))
      for (const p of res.data as Array<{ id: string; clienteles?: string[] }>) p.clienteles = byId.get(p.id) ?? []
    }
  }
  if (res.error) { log.error('lecture des pros', { metier, err: res.error.message }); return [] }
  const admins = await adminUserIds(db)
  return ((res.data ?? []) as unknown as Pro[]).filter(p => p.email && !isDemoFiche(p, admins))
}

const firstName = (p: Pro) => (p.pseudo || p.full_name || '').split(' ')[0]
const displayName = (p: Pro) => p.pseudo || p.full_name

const proMail = (p: Pro, metier: DemandeMetier): ProMail => ({ nom: displayName(p), ville: p.ville ?? null, url: `${SITE}/annuaires/${T[metier].dir}/${p.slug}` })
const qgUrl = (id: string) => `${APP}/dashboard/admin/qg?onglet=hotes&demande=${id}`

async function emailPro(d: DemandeInput, pro: Pro, metier: DemandeMetier, manuel = false, contactId: string | null = null) {
  const r = resend(); if (!r) return
  const secret = memberMailSecret()
  const { subject, html, text } = proEmail(d, {
    proPrenom: firstName(pro),
    manuel,
    adequation: metier === 'photographe' ? pourquoiCePro(pro, d.frequence) : null,
    filtre: metier === 'photographe' && !!besoinPhoto(d.frequence),
    demandesUrl: `${APP}/dashboard/${T[metier].dash}/demandes`,
    priseUrl: contactId && secret ? `${APP}/demande/prise/${priseToken(metier, contactId, secret)}` : null,
  })
  await r.emails.send({ from: FROM, to: pro.email, replyTo: d.email, subject, html, text })
    .catch(e => log.error('e-mail au pro', { err: e instanceof Error ? e.message : String(e) }))
}

/** Hôte prévenu quand aucun des pros choisis ne fait tout ce qu'il demande (ex. drone pas indiqué sur leur fiche) */
function partiel(d: DemandeInput, metier: DemandeMetier, pros: Pro[]): string | null {
  if (metier !== 'photographe' || !pros.length || pros.some(p => convientAuBesoin(p, d.frequence) === 2)) return null
  const manque = [...new Set(pros.flatMap(p => manquesDuPro(p, d.frequence)))]
  return `Aucun pro près de chez toi n’indique encore ${manque.join(' ni ')} sur sa fiche : ta demande est partie chez ceux qui s’en approchent le plus. Demande-leur s’ils peuvent s’en charger.`
}

const suiviUrl = (token: string) => `${SITE}/ma-demande?t=${token}`

async function emailHote(d: DemandeInput, metier: DemandeMetier, pros: Pro[], vague: number, token?: string | null) {
  const r = resend(); if (!r) return
  const { subject, html } = hoteEmail(d, {
    pros: pros.map(p => proMail(p, metier)),
    vague,
    suiviUrl: token ? suiviUrl(token) : null,
    sansProQui: metier === 'menage' ? 'd’équipe de ménage inscrite' : besoinPhoto(d.frequence)?.video ? 'de vidéaste inscrit' : 'de photographe inscrit',
    guideUrl: `${SITE}/annuaires/${T[metier].dir}`,
    partielNote: partiel(d, metier, pros),
    inscriptionUrl: `${SITE}/annuaires/${T[metier].dir}/inscription`,
  })
  await r.emails.send({ from: FROM, to: d.email, subject, html })
    .catch(e => log.error('e-mail à l’hôte', { err: e instanceof Error ? e.message : String(e) }))
}

/** Envoie une vague : ligne dans Demandes reçues + e-mail, pour chaque pro */
async function envoyerVague(d: DemandeInput, metier: DemandeMetier, pros: Pro[], round: number, demandeId: string, manuel = false) {
  const db = getServiceClient()
  const t = T[metier]
  const sent: Array<{ id: string; contact_id: string | null; round: number; at: string; manual?: true }> = []
  for (const pro of pros) {
    const { data, error } = await db.from(t.contactTable)
      .insert({ [t.fk]: pro.id, contact_email: d.email, contact_name: d.nom, message: messagePourPro(d), source_url: `${SITE}/trouver-un-pro#demande-${demandeId}` })
      .select('id').maybeSingle()
    if (error) log.error('ligne Demandes reçues', { err: error.message })
    await db.rpc(t.rpc, { p_id: pro.id })
    await emailPro(d, pro, metier, manuel, (data as { id: string } | null)?.id ?? null)
    sent.push({ id: pro.id, contact_id: (data as { id: string } | null)?.id ?? null, round, at: new Date().toISOString(), ...(manuel ? { manual: true } : {}) })
  }
  return sent
}

/** Nouvelle demande : enregistrement, première vague, e-mails. */
type DemandeCreee = { ok: true; envoyes: number; suivi: string | null; pros: CartePro[] }

/**
 * Demande en plusieurs villes (29/10/2026) : une demande par ville, chacune
 * avec ses pros, son relais et son lien de suivi, liées par `groupe`
 * (migration 168). Les pros ne voient que la ville qui les concerne.
 */
export async function creerDemandeMultiVilles(d: DemandeInput, acquisition: unknown): Promise<(DemandeCreee & { villes: Array<{ ville: string; envoyes: number; suivi: string | null; pros: CartePro[] }> }) | { error: string }> {
  const villes = [d.ville, ...(d.autresVilles ?? [])]
  const groupe = villes.length > 1 ? randomUUID() : null
  const out: Array<{ ville: string; envoyes: number; suivi: string | null; pros: CartePro[] }> = []
  for (const ville of villes) {
    const r = await creerDemande({ ...d, ville, autresVilles: [] }, acquisition, groupe)
    if ('error' in r) {
      // La première ville est obligatoire ; une ville suivante en échec n'annule pas les autres
      if (!out.length) return r
      log.error('demande multi-villes : une ville en échec', { err: r.error })
      continue
    }
    out.push({ ville, envoyes: r.envoyes, suivi: r.suivi, pros: r.pros })
  }
  return { ok: true, envoyes: out.reduce((n, v) => n + v.envoyes, 0), suivi: out[0].suivi, pros: out[0].pros, villes: out }
}

export async function creerDemande(d: DemandeInput, acquisition: unknown, groupe: string | null = null): Promise<DemandeCreee | { error: string }> {
  const db = getServiceClient()
  const base = {
    // Demandes envoyées ensemble dans plusieurs villes (migration 168) : retiré plus bas si la colonne manque
    ...(groupe ? { groupe } : {}),
    metier: d.metier, ville: d.ville, logement: d.logement, quand: d.quand, frequence: d.frequence, budget: d.budget,
    message: d.message, nom: d.nom, email: d.email, telephone: d.telephone, source: d.source,
    // Type d'hébergement (migration 154) : retiré plus bas si la colonne manque
    ...(d.etablissement ? { etablissement: d.etablissement } : {}),
    acquisition: acquisition && typeof acquisition === 'object' ? acquisition : null,
    consent_at: new Date().toISOString(),
  }
  // Lien de suivi secret (migration 139 ; sans elle, la demande part sans lien de suivi)
  let token: string | null = randomBytes(16).toString('hex')
  let { data: row, error } = await db.from('demandes_hotes').insert({ ...base, suivi_token: token }).select('id').maybeSingle()
  if (error && /groupe/.test(error.message)) {
    delete (base as { groupe?: string }).groupe
    ;({ data: row, error } = await db.from('demandes_hotes').insert({ ...base, suivi_token: token }).select('id').maybeSingle())
  }
  if (error && /etablissement/.test(error.message)) {
    delete (base as { etablissement?: string }).etablissement
    ;({ data: row, error } = await db.from('demandes_hotes').insert({ ...base, suivi_token: token }).select('id').maybeSingle())
  }
  if (error && /suivi_token/.test(error.message)) {
    token = null
    ;({ data: row, error } = await db.from('demandes_hotes').insert(base).select('id').maybeSingle())
  }
  if (error || !row) {
    log.error('enregistrement de la demande', { err: error?.message })
    return { error: 'Envoi impossible pour le moment. Réessaie dans quelques minutes.' }
  }
  const id = (row as { id: string }).id
  const pros = choisirPros(await loadPros(d.metier), d.ville, new Set(), undefined, d.frequence, d.etablissement)
  const sent = pros.length ? await envoyerVague(d, d.metier, pros, 1, id) : []
  await db.from('demandes_hotes').update({
    sent_to: sent, status: sent.length ? 'envoyee' : 'sans_pro', last_round_at: new Date().toISOString(),
    admin_notified_at: sent.length ? null : new Date().toISOString(),
  }).eq('id', id)
  await emailHote(d, d.metier, pros, 1, token)
  const prosNoms = pros.map(p => d.metier === 'photographe' && besoinPhoto(d.frequence) ? `${displayName(p)} (${adequationLabel(convientAuBesoin(p, d.frequence)).toLowerCase()})` : displayName(p))
  const suite = sent.length ? `Envoyée à : ${prosNoms.join(', ')}.` : 'Aucun pro de l’annuaire dans la zone qui propose ce besoin : à transmettre à la main depuis le QG, ou à présenter aux pros de la ville (sans les coordonnées de l’hôte).'
  await sendAdminEmail({
    subject: sent.length ? `Demande d’hôte : ${T[d.metier].label} à ${d.ville} (${sent.length} pro${sent.length > 1 ? 's' : ''})` : `Demande d’hôte SANS PRO : ${T[d.metier].label} à ${d.ville}`,
    text: `${anonymizedNeed(d)}\n\n${suite}\n\nLa fiche de la demande : ${qgUrl(id)}`,
    html: adminEmail(d, {
      etiquette: sent.length ? 'Nouvelle demande' : 'Nouvelle demande · sans pro',
      title: `Un hôte cherche ${T[d.metier].un} à ${d.ville}`,
      texte: sent.length ? `Partie chez ${sent.length} pro${sent.length > 1 ? 's' : ''} de l’annuaire.` : 'Aucun pro de l’annuaire dans la zone qui propose ce besoin : à transmettre à la main depuis le QG, ou à présenter aux pros de la ville (sans les coordonnées de l’hôte).',
      pros: sent.length ? prosNoms : [],
      qgUrl: qgUrl(id),
    }),
  })
  return { ok: true, envoyes: sent.length, suivi: token, pros: pros.map(p => cartePro(p, d.metier, d.frequence, SUPABASE_URL)) }
}

/** Cron quotidien : relances (48 h sans réponse), nouveaux pros, purge 12 mois. */
export async function traiterDemandes(now = new Date()): Promise<{ elargies: number; transmises: number; sansPro: number; purgees: number }> {
  const db = getServiceClient()
  const out = { elargies: 0, transmises: 0, sansPro: 0, purgees: 0 }
  const { data, error } = await db.from('demandes_hotes')
    .select('*')
    .in('status', ['envoyee', 'elargie', 'sans_pro']).gte('created_at', new Date(now.getTime() - 35 * 86_400_000).toISOString()).limit(200)
  if (error) { if (!/demandes_hotes/.test(error.message)) log.error('relances des demandes', { err: error.message }); return out }
  const rows = (data ?? []) as unknown as DemandeRow[]

  // Statuts des lignes « Demandes reçues » des dernières vagues
  const statuts = new Map<string, string>()
  for (const metier of ['photographe', 'menage'] as const) {
    const ids = rows.filter(r => r.metier === metier).flatMap(r => r.sent_to.map(s => s.contact_id)).filter(Boolean) as string[]
    if (!ids.length) continue
    const { data: c } = await db.from(T[metier].contactTable).select('id, status').in('id', ids)
    for (const x of (c ?? []) as Array<{ id: string; status: string }>) statuts.set(x.id, x.status)
  }

  const prosCache = new Map<DemandeMetier, Pro[]>()
  for (const r of rows) {
    const action = prochaineAction(r, statuts, now)
    if (action === 'rien') continue
    if (!prosCache.has(r.metier)) prosCache.set(r.metier, await loadPros(r.metier))
    const pros = choisirPros(prosCache.get(r.metier)!, r.ville, new Set(r.sent_to.map(s => s.id)), undefined, r.frequence, r.etablissement)
    if (!pros.length) {
      if (action === 'elargir') {
        await db.from('demandes_hotes').update({ status: 'sans_pro', admin_notified_at: now.toISOString() }).eq('id', r.id)
        out.sansPro++
        const texte = 'Aucun des pros sollicités n’a répondu sous 48 h et il n’y en a pas d’autres dans la zone.'
        await sendAdminEmail({
          subject: `Demande d’hôte sans réponse : ${T[r.metier].label} à ${r.ville}`,
          text: `${anonymizedNeed(r)}\n\n${texte}\n\n${qgUrl(r.id)}`,
          html: adminEmail(r, { etiquette: 'Sans réponse sous 48 h', title: `Un hôte cherche ${T[r.metier].un} à ${r.ville}`, texte, pros: [], qgUrl: qgUrl(r.id) }),
        })
      }
      continue
    }
    const round = Math.max(0, ...r.sent_to.map(s => s.round)) + 1
    const sent = await envoyerVague(r, r.metier, pros, round, r.id)
    await db.from('demandes_hotes').update({ sent_to: [...r.sent_to, ...sent], status: 'elargie', last_round_at: now.toISOString() }).eq('id', r.id)
    await emailHote(r, r.metier, pros, round, r.suivi_token)
    if (action === 'elargir') out.elargies++; else out.transmises++
  }

  const limite = new Date(now); limite.setMonth(limite.getMonth() - CONSERVATION_MOIS)
  const { count } = await db.from('demandes_hotes').delete({ count: 'exact' }).lt('created_at', limite.toISOString())
  out.purgees = count ?? 0
  return out
}

/** Pros proposés dans le QG pour un envoi à la main (sans leur e-mail) */
export async function listProsChoix(metier: DemandeMetier): Promise<ProChoix[]> {
  return (await loadPros(metier)).map(p => ({
    id: p.id, nom: displayName(p), slug: p.slug, ville: p.ville, zone_couverte: p.zone_couverte,
    villes_couvertes: p.villes_couvertes ?? null, contacts_count: p.contacts_count ?? null,
    metier: p.metier ?? null, options: p.options ?? null,
  }))
}

async function emailHoteManuel(d: DemandeInput & { suivi_token?: string | null }, metier: DemandeMetier, pro: Pro, premier: boolean) {
  const r = resend(); if (!r) return
  const { subject, html } = hoteManuelEmail(d, proMail(pro, metier), d.suivi_token ? suiviUrl(d.suivi_token) : null, premier)
  await r.emails.send({ from: FROM, to: d.email, subject, html })
    .catch(e => log.error('e-mail à l’hôte (envoi manuel)', { err: e instanceof Error ? e.message : String(e) }))
}

/** QG : l'admin transmet la demande à un pro de l'annuaire qu'il a choisi */
export async function envoyerAUnPro(demandeId: string, proId: string): Promise<{ ok: true; nom: string } | { error: string }> {
  const db = getServiceClient()
  const { data, error } = await db.from('demandes_hotes')
    .select('*')
    .eq('id', demandeId).maybeSingle()
  if (error || !data) return { error: 'Demande introuvable.' }
  const d = data as unknown as DemandeRow
  if (d.sent_to.some(s => s.id === proId)) return { error: 'Ce pro a déjà reçu la demande.' }
  const pro = (await loadPros(d.metier)).find(p => p.id === proId)
  if (!pro) return { error: 'Ce pro n’est pas (ou plus) en ligne dans l’annuaire.' }
  const round = Math.max(1, ...d.sent_to.map(s => s.round))
  const sent = await envoyerVague(d, d.metier, [pro], round, d.id, true)
  const { error: upErr } = await db.from('demandes_hotes').update({
    sent_to: [...d.sent_to, ...sent],
    status: d.status === 'sans_pro' ? 'elargie' : d.status,
    last_round_at: new Date().toISOString(),
  }).eq('id', d.id)
  if (upErr) log.error('envoi manuel : mise à jour', { err: upErr.message })
  await emailHoteManuel(d, d.metier, pro, d.sent_to.length === 0)
  return { ok: true, nom: displayName(pro) }
}

// ── Ce que voit l'hôte : aperçu avant l'envoi, suivi après ──────────

/** Fiches en ligne d'un métier, sans e-mail, gardées 5 min (la page d'envoi interroge à chaque ville tapée) */
const prosPublics = (metier: DemandeMetier) => unstable_cache(
  async (): Promise<ProPublic[]> => (await loadPros(metier)).map(p => ({
    id: p.id, slug: p.slug, full_name: p.full_name, pseudo: p.pseudo, ville: p.ville, zone_couverte: p.zone_couverte,
    villes_couvertes: p.villes_couvertes ?? null, contacts_count: p.contacts_count ?? null, created_at: p.created_at ?? null,
    metier: p.metier ?? null, options: p.options ?? null, clienteles: p.clienteles ?? null, portfolio_photos: p.portfolio_photos ?? null, logo_url: p.logo_url ?? null,
  })),
  ['demandes-pros-publics-v2', metier],
  { revalidate: 300, tags: ['demandes-pros'] },
)()

/** Les pros qui recevraient la demande maintenant (même règle que l'envoi) */
export async function apercuDemande(metier: DemandeMetier, ville: string, besoin: string | null, etablissement: string | null = null): Promise<{ pros: CartePro[]; phrase: string }> {
  const pros = choisirPros(await prosPublics(metier), ville, new Set(), undefined, besoin, etablissement)
  return { pros: pros.map(p => cartePro(p, metier, besoin, SUPABASE_URL)), phrase: apercuPhrase(metier, pros.length, ville, besoin) }
}

async function demandeParJeton(token: string): Promise<(DemandeRow & { id: string }) | null> {
  if (!isSuiviToken(token)) return null
  const { data, error } = await getServiceClient().from('demandes_hotes').select('*').eq('suivi_token', token).maybeSingle()
  if (error) { if (!/suivi_token/.test(error.message)) log.error('suivi : lecture', { err: error.message }); return null }
  return (data as unknown as DemandeRow & { id: string }) ?? null
}

/** Suivi de l'hôte : à qui la demande est partie, qui l'a prise en main, prochain relais */
export async function suiviDemande(token: string): Promise<SuiviVue | null> {
  const r = await demandeParJeton(token)
  if (!r) return null
  const db = getServiceClient()
  const t = T[r.metier]
  const ids = r.sent_to.map(s => s.contact_id).filter(Boolean) as string[]
  const statuts = new Map<string, string>()
  if (ids.length) {
    const { data } = await db.from(t.contactTable).select('id, status').in('id', ids)
    for (const x of (data ?? []) as Array<{ id: string; status: string }>) statuts.set(x.id, x.status)
  }
  const fiches = new Map((await prosPublics(r.metier)).filter(p => r.sent_to.some(s => s.id === p.id)).map(p => {
    const { adequation: _a, ...c } = cartePro(p, r.metier, r.frequence, SUPABASE_URL)
    void _a
    return [p.id, c] as const
  }))
  return suiviVue(r as SuiviRow, statuts, fiches, new Date())
}

/** « J'ai trouvé mon pro » : la demande est fermée, plus aucun relais */
export async function fermerDemande(token: string): Promise<boolean> {
  const r = await demandeParJeton(token)
  if (!r) return false
  if (r.status === 'close') return true
  const { error } = await getServiceClient().from('demandes_hotes').update({ status: 'close', host_closed_at: new Date().toISOString() }).eq('id', r.id)
  if (error) { log.error('suivi : fermeture', { err: error.message }); return false }
  await sendAdminEmail({ subject: `Demande d’hôte fermée par l’hôte : ${T[r.metier].label} à ${r.ville}`, text: `L’hôte indique avoir trouvé son pro.\n\n${APP}/dashboard/admin/qg?onglet=hotes&demande=${r.id}` })
  return true
}
