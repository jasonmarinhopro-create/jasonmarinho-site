// Newsletter mensuelle automatique « Le Check-in » (11/10/2026) : le cron
// quotidien appelle prepareMonthlyNewsletter ; le premier lundi du mois (Paris),
// une édition par public (editions.ts : hôtes, investisseurs, photographes,
// équipes de ménage) est composée (build.ts), ses destinataires sont rangés
// dans une liste Brevo par édition (créées toutes seules), chaque édition est
// programmée pour le lendemain 9 h 30, et un aperçu de chacune part chez Jason
// (Resend) : il peut la suspendre dans Brevo (Campagnes) d'ici là. Une seule
// lettre par mois (table newsletter_issues, migration 127 : mois réservé avant
// Brevo, une ligne « mois#édition » par édition en plus). Clé : BREVO_API_KEY.
import 'server-only'
import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'
import { dedupeActualites } from '@/lib/actualites/dedup'
import { CHANGELOG } from '@/lib/constants/changelog'
import { NEWSLETTER_LISTS } from './lists'
import { buildNewsletter, isPreparationDay, monthKey, monthLabel, parseRss, sendAt, type Newsletter, type NlActu } from './build'
import { EDITIONS, EDITION_CONFIG, assignEditions, type Edition } from './editions'
import { NEWSLETTER_NAME } from './template'
import { isPaidPro } from '@/lib/admin/revenue'

const BREVO = 'https://api.brevo.com/v3'
const SENDER = { name: 'Jason Marinho', email: 'contact@jasonmarinho.com' }
const LOOKBACK_DAYS = 35

type Db = SupabaseClient

export async function brevo<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const key = process.env.BREVO_API_KEY
  if (!key) throw new Error('BREVO_API_KEY absente')
  const res = await fetch(`${BREVO}${path}`, {
    method: init?.method ?? 'GET',
    headers: { 'api-key': key, 'content-type': 'application/json', accept: 'application/json' },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Brevo ${res.status} : ${text.slice(0, 200)}`)
  return (text ? JSON.parse(text) : {}) as T
}

/** Contenu publié pendant le mois écoulé */
export async function gatherContent(db: Db, parisDate: string) {
  const since = new Date(Date.parse(`${parisDate}T00:00:00Z`) - LOOKBACK_DAYS * 86_400_000)
  const { data } = await db.from('actualites')
    .select('id, title, summary, category, source_url, published_at, created_at, is_pinned, deadline_date')
    .eq('is_published', true)
    .gte('published_at', since.toISOString())
    .order('is_pinned', { ascending: false, nullsFirst: false })
    .order('published_at', { ascending: false })
    .limit(60)
  type Row = { id: string; title: string; summary: string; category: string; source_url: string | null; published_at: string | null; created_at: string | null; deadline_date: string | null }
  const rows = ((data ?? []) as Array<Omit<Row, 'summary'> & { summary: string | null }>).map(r => ({ ...r, summary: r.summary ?? '' }))
  const actus: NlActu[] = dedupeActualites<Row>(rows)

  let articles: ReturnType<typeof parseRss> = []
  try {
    const res = await fetch('https://jasonmarinho.com/rss.xml', { cache: 'no-store', signal: AbortSignal.timeout(10_000) })
    if (res.ok) articles = parseRss(await res.text()).filter(a => Date.parse(a.pubDate) >= since.getTime())
  } catch { /* blog indisponible : la lettre se fait avec le reste */ }

  const changes = CHANGELOG.filter(c => Date.parse(c.date) >= since.getTime() && c.tag !== 'correction')
    .map(c => ({ title: c.title, description: c.description, date: c.date }))

  return { actus, articles, changes }
}

/** Numéro de la lettre : lettres déjà programmées (édition hôtes) + 1 */
async function issueNumber(db: Db, parisDate: string): Promise<number> {
  const { count } = await db.from('newsletter_issues').select('month', { count: 'exact', head: true })
    .eq('status', 'programmee').not('month', 'like', '%#%').neq('month', monthKey(parisDate))
  return (count ?? 0) + 1
}

export async function composeNewsletter(db: Db, parisDate: string, edition: Edition = 'hote'): Promise<Newsletter | null> {
  const c = await gatherContent(db, parisDate)
  return buildNewsletter({ parisDate, ...c, issueNumber: await issueNumber(db, parisDate), edition })
}

async function sendPreview(n: Newsletter, note: string, label: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) return
  const banner = `<div style="font-family:Helvetica,Arial,sans-serif;background:#FFF6DA;border-bottom:1px solid #F0D58A;padding:14px 18px;font-size:14px;line-height:1.55;color:#3a2f12;">${note}</div>`
  await new Resend(key).emails.send({
    from: 'Jason Marinho <noreply@jasonmarinho.com>',
    to: SENDER.email,
    subject: `[Aperçu · ${label}] ${n.subject}`,
    html: n.html.replace(/<body([^>]*)>/, (m) => `${m}${banner}`),
  }).catch(() => undefined)
}

async function sendPreviewText(text: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) return
  await new Resend(key).emails.send({ from: 'Jason Marinho <noreply@jasonmarinho.com>', to: SENDER.email, subject: 'Le Check-in', text }).catch(() => undefined)
}

// ── Listes Brevo par édition ──

const LIST_NAMES: Record<Exclude<Edition, 'hote'>, string> = {
  investisseur: 'Le Check-in · Investisseurs',
  photographe: 'Le Check-in · Photographes',
  menage: 'Le Check-in · Équipes de ménage',
}

/** Listes des éditions investisseurs, photographes et ménage : créées dans Brevo si elles manquent */
async function ensureEditionLists(): Promise<Record<Exclude<Edition, 'hote'>, number>> {
  const { lists = [] } = await brevo<{ lists?: Array<{ id: number; name: string }> }>('/contacts/lists?limit=50&offset=0')
  const out = {} as Record<Exclude<Edition, 'hote'>, number>
  let folderId: number | null = null
  for (const [edition, name] of Object.entries(LIST_NAMES) as Array<[Exclude<Edition, 'hote'>, string]>) {
    const found = lists.find(l => l.name === name)
    if (found) { out[edition] = found.id; continue }
    if (folderId === null) {
      const { folders = [] } = await brevo<{ folders?: Array<{ id: number }> }>('/contacts/folders?limit=10&offset=0')
      folderId = folders[0]?.id ?? (await brevo<{ id: number }>('/contacts/folders', { method: 'POST', body: { name: 'Le Check-in' } })).id
    }
    out[edition] = (await brevo<{ id: number }>('/contacts/lists', { method: 'POST', body: { name, folderId } })).id
  }
  return out
}

/** Adresses d'une liste Brevo (désinscrits compris, signalés par `blacklisted`) */
async function listContacts(listId: number): Promise<Array<{ email: string; blacklisted: boolean }>> {
  const out: Array<{ email: string; blacklisted: boolean }> = []
  for (let offset = 0; offset < 20_000; offset += 500) {
    const { contacts = [] } = await brevo<{ contacts?: Array<{ email: string; emailBlacklisted?: boolean }> }>(`/contacts/lists/${listId}/contacts?limit=500&offset=${offset}`)
    out.push(...contacts.map(c => ({ email: c.email.toLowerCase(), blacklisted: !!c.emailBlacklisted })))
    if (contacts.length < 500) break
  }
  return out
}

/** Toutes les adresses bloquées dans Brevo (lien de désinscription d'une lettre, interrupteur de Mon compte coupé) */
async function blacklistedContacts(): Promise<Set<string>> {
  const out = new Set<string>()
  for (let offset = 0; offset < 50_000; offset += 1000) {
    const { contacts = [] } = await brevo<{ contacts?: Array<{ email: string; emailBlacklisted?: boolean }> }>(`/contacts?limit=1000&offset=${offset}`)
    for (const c of contacts) if (c.emailBlacklisted && c.email) out.add(c.email.toLowerCase())
    if (contacts.length < 1000) break
  }
  return out
}

/** Qui reçoit quelle édition (inscrits de la lettre + pros clients) */
async function recipients(db: Db): Promise<Record<Edition, string[]>> {
  const [subs, profiles, photographers, cleaners, suppressions, blocked] = await Promise.all([
    listContacts(NEWSLETTER_LISTS[0]),
    selectProfiles(db),
    db.from('photographers').select('user_id, email, stripe_subscription_status').limit(5_000),
    db.from('cleaners').select('user_id, email, stripe_subscription_status').limit(5_000),
    db.from('outreach_suppressions').select('email_norm').limit(20_000),
    blacklistedContacts().catch(() => new Set<string>()),
  ])
  type Pro = { user_id: string | null; email: string | null; stripe_subscription_status: string | null }
  const prof = profiles
  const admins = new Set(prof.filter(p => p.role === 'admin').map(p => p.id))
  const photo = (photographers.data ?? []) as Pro[]
  const clean = (cleaners.data ?? []) as Pro[]
  const photoUsers = new Set(photo.map(r => r.user_id).filter(Boolean))
  const cleanUsers = new Set(clean.map(r => r.user_id).filter(Boolean))
  const accounts = prof.filter(p => p.email).map(p => ({
    email: p.email!, isAdmin: p.role === 'admin', isInvestor: !!p.is_investor,
    photographer: photoUsers.has(p.id), cleaner: cleanUsers.has(p.id),
  }))
  const emailOf = new Map(prof.map(p => [p.id, p.email]))
  const proClients = [
    ...photo.filter(r => isPaidPro(r) && !(r.user_id && admins.has(r.user_id))).map(r => ({ email: (r.email || emailOf.get(r.user_id ?? '') || '') as string, metier: 'photographe' as const })),
    ...clean.filter(r => isPaidPro(r) && !(r.user_id && admins.has(r.user_id))).map(r => ({ email: (r.email || emailOf.get(r.user_id ?? '') || '') as string, metier: 'menage' as const })),
  ].filter(p => p.email)
  // Inscrits = liste Brevo + comptes qui ont coché la case à l'inscription
  // (désinscrits chez Brevo toujours exclus)
  const blacklisted = new Set([...subs.filter(c => c.blacklisted).map(c => c.email), ...blocked])
  const optIn = prof.filter(p => p.newsletter_opt_in && p.email).map(p => p.email!.toLowerCase()).filter(e => !blacklisted.has(e))
  return assignEditions({
    subscribers: [...new Set([...subs.filter(c => !c.blacklisted).map(c => c.email), ...optIn])],
    accounts, proClients,
    // Désinscrits de la prospection et adresses bloquées chez Brevo : aucune édition, celle des pros comprise
    suppressed: new Set([...((suppressions.data ?? []) as Array<{ email_norm: string }>).map(r => r.email_norm), ...blacklisted]),
  })
}

type ProfileRow = { id: string; email: string | null; role: string | null; is_investor: boolean | null; newsletter_opt_in?: boolean | null }

/** Comptes de l'app (sans la migration 128 : sans le choix de la newsletter) */
async function selectProfiles(db: Db): Promise<ProfileRow[]> {
  const full = await db.from('profiles').select('id, email, role, is_investor, newsletter_opt_in').limit(20_000)
  if (!full.error) return (full.data ?? []) as ProfileRow[]
  const legacy = await db.from('profiles').select('id, email, role, is_investor').limit(20_000)
  return (legacy.data ?? []) as ProfileRow[]
}

/** Comptes qui ont coché la case mais manquent dans la liste Brevo : rajoutés (inscription perdue, liste n° 2…) */
async function syncOptIns(db: Db) {
  const [subs, prof] = await Promise.all([listContacts(NEWSLETTER_LISTS[0]), selectProfiles(db)])
  const inList = new Set(subs.map(c => c.email))
  for (const p of prof) {
    const e = p.email?.toLowerCase()
    if (!p.newsletter_opt_in || !e || inList.has(e)) continue
    await brevo('/contacts', { method: 'POST', body: { email: e, listIds: NEWSLETTER_LISTS, updateEnabled: true } }).catch(() => undefined)
  }
}

/** Met chaque liste d'édition à jour (ajouts, retraits) */
async function syncList(listId: number, wanted: string[]) {
  const current = await listContacts(listId)
  const have = new Set(current.map(c => c.email))
  const want = new Set(wanted)
  for (const email of wanted) {
    if (have.has(email)) continue
    await brevo('/contacts', { method: 'POST', body: { email, listIds: [listId], updateEnabled: true } }).catch(() => undefined)
  }
  const extra = current.map(c => c.email).filter(e => !want.has(e))
  for (let i = 0; i < extra.length; i += 150) {
    await brevo(`/contacts/lists/${listId}/contacts/remove`, { method: 'POST', body: { emails: extra.slice(i, i + 150) } }).catch(() => undefined)
  }
}

export type PrepareResult =
  | { state: 'pas-le-jour' | 'deja-faite' }
  | { state: 'pas-assez'; counts: null }
  | { state: 'programmee'; scheduledAt: string; editions: Array<{ edition: Edition; destinataires: number; campagne: number | null }> }

const issueKey = (month: string, edition: Edition) => (edition === 'hote' ? month : `${month}#${edition}`)

/** Appelé chaque jour par le cron ; `force` (workflow) ignore le jour */
export async function prepareMonthlyNewsletter(db: Db, parisDate: string, opts: { force?: boolean } = {}): Promise<PrepareResult> {
  if (!opts.force && !isPreparationDay(parisDate)) return { state: 'pas-le-jour' }
  const month = monthKey(parisDate)
  const { data: existing, error: readError } = await db.from('newsletter_issues').select('month').eq('month', month).maybeSingle()
  // Table absente ou illisible : on ne prend pas le risque d'envoyer deux fois
  if (readError) throw new Error(`newsletter_issues illisible : ${readError.message}`)
  if (existing) return { state: 'deja-faite' }

  // On réserve le mois avant d'appeler Brevo : jamais deux lettres le même mois
  const { error: claimError } = await db.from('newsletter_issues').insert({ month, status: 'preparation' })
  if (claimError) return { state: 'deja-faite' }

  const content = await gatherContent(db, parisDate)
  const number = await issueNumber(db, parisDate)
  if (!buildNewsletter({ parisDate, ...content, issueNumber: number })) {
    await db.from('newsletter_issues').update({ status: 'pas-assez' }).eq('month', month)
    await sendPreviewText(`Pas de lettre en ${monthLabel(parisDate)} : pas assez de contenu publié ce mois-ci (actualités et articles). Rien n'a été envoyé.`)
    return { state: 'pas-assez', counts: null }
  }

  const scheduledAt = sendAt(parisDate)
  const when = new Date(scheduledAt).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
  const results: Array<{ edition: Edition; destinataires: number; campagne: number | null }> = []
  try {
    const lists = await ensureEditionLists()
    await syncOptIns(db)
    const who = await recipients(db)
    for (const e of ['investisseur', 'photographe', 'menage'] as const) await syncList(lists[e], who[e])

    for (const edition of EDITIONS) {
      const count = who[edition].length
      if (!count) { results.push({ edition, destinataires: 0, campagne: null }); continue }
      const n = buildNewsletter({ parisDate, ...content, issueNumber: number, edition })
      if (!n) { results.push({ edition, destinataires: count, campagne: null }); continue }
      const label = EDITION_CONFIG[edition].label
      const name = `${NEWSLETTER_NAME} · ${label} · ${monthLabel(parisDate)}`
      const recipientsSpec = edition === 'hote'
        ? { listIds: NEWSLETTER_LISTS, exclusionListIds: Object.values(lists) }
        : { listIds: [lists[edition]] }
      const created = await brevo<{ id: number }>('/emailCampaigns', {
        method: 'POST',
        body: { name, subject: n.subject, previewText: n.preheader, sender: SENDER, replyTo: SENDER.email, htmlContent: n.html, recipients: recipientsSpec, scheduledAt, inlineImageActivation: false },
      })
      // Contenu et destinataires gardés pour l'onglet Newsletter de Provenance (migration 128, tolérée si absente)
      const row = { status: 'programmee', campaign_id: created.id, subject: n.subject, scheduled_at: scheduledAt }
      const extra = { edition, preheader: n.preheader, recipients: count, html: n.html }
      const save = (r: Record<string, unknown>) => edition !== 'hote'
        ? db.from('newsletter_issues').insert({ month: issueKey(month, edition), ...r })
        : db.from('newsletter_issues').update(r).eq('month', month)
      const { error: saveError } = await save({ ...row, ...extra })
      if (saveError) await save(row)
      results.push({ edition, destinataires: count, campagne: created.id })
      await sendPreview(n, `<strong>Aperçu de l'édition ${label} (${count} destinataire${count > 1 ? 's' : ''}).</strong> Programmée dans Brevo pour ${when}. Rien à faire si elle te convient. Pour l'arrêter ou la modifier : Brevo → Campagnes → « ${name} » → Suspendre.`, label)
    }
    if (!results.some(r => r.campagne)) await db.from('newsletter_issues').update({ status: 'sans-destinataire' }).eq('month', month)
    return { state: 'programmee', scheduledAt, editions: results }
  } catch (e) {
    // Échec chez Brevo avant toute campagne : on libère le mois pour réessayer (workflow)
    if (!results.some(r => r.campagne)) await db.from('newsletter_issues').delete().eq('month', month)
    throw e
  }
}

/** Destinataires par édition, sans rien envoyer ni modifier (workflow, mode etat) */
export async function editionCounts(db: Db): Promise<Record<Edition, number>> {
  const who = await recipients(db)
  return Object.fromEntries(EDITIONS.map(e => [e, who[e].length])) as Record<Edition, number>
}

/** Aperçu seul (workflow) : chaque édition du jour, envoyée à Jason, sans rien programmer */
export async function previewNewsletter(db: Db, parisDate: string) {
  const content = await gatherContent(db, parisDate)
  const number = await issueNumber(db, parisDate)
  let counts: Record<Edition, number> | null = null
  try {
    const who = await recipients(db)
    counts = Object.fromEntries(EDITIONS.map(e => [e, who[e].length])) as Record<Edition, number>
  } catch { /* Brevo indisponible : aperçu sans les nombres */ }
  const out: Array<{ edition: Edition; destinataires: number | null }> = []
  for (const edition of EDITIONS) {
    const n = buildNewsletter({ parisDate, ...content, issueNumber: number, edition })
    if (!n) return { state: 'pas-assez' as const }
    const label = EDITION_CONFIG[edition].label
    const c = counts?.[edition] ?? null
    await sendPreview(n, `<strong>Aperçu seulement, édition ${label}</strong>${c !== null ? ` (${c} destinataire${c > 1 ? 's' : ''} aujourd'hui)` : ''} : rien n'est programmé. Voici la lettre telle qu'elle partirait aujourd'hui.`, label)
    out.push({ edition, destinataires: c })
  }
  return { state: 'apercu' as const, editions: out }
}

export { NEWSLETTER_LISTS }

/** État de Brevo pour les journaux publics : nombres et oui / non seulement */
export async function brevoStatus() {
  const lists = await Promise.all(NEWSLETTER_LISTS.map(async id => {
    try {
      const l = await brevo<{ totalSubscribers?: number; uniqueSubscribers?: number; totalBlacklisted?: number }>(`/contacts/lists/${id}`)
      return { liste: id, inscrits: l.uniqueSubscribers ?? l.totalSubscribers ?? 0, desinscrits: l.totalBlacklisted ?? 0 }
    } catch (e) { return { liste: id, erreur: String((e as Error).message).slice(0, 80) } }
  }))
  let expediteur: boolean | string = false
  try {
    const s = await brevo<{ senders?: Array<{ email: string; active: boolean }> }>('/senders')
    expediteur = !!s.senders?.some(x => x.email.toLowerCase() === SENDER.email && x.active)
  } catch (e) { expediteur = String((e as Error).message).slice(0, 80) }
  return { lists, expediteur_actif: expediteur }
}
