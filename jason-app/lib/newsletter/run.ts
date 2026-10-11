// Newsletter mensuelle automatique (11/10/2026) : le cron quotidien appelle
// prepareMonthlyNewsletter ; le premier lundi du mois (Paris), la lettre est
// composée (build.ts), créée dans Brevo et programmée pour le lendemain 9 h 30,
// et un aperçu part chez Jason (Resend) : il peut la suspendre dans Brevo
// (Campagnes) d'ici là. Une seule lettre par mois (table newsletter_issues,
// migration 127). Clé : BREVO_API_KEY (déjà utilisée pour les inscriptions).
import 'server-only'
import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'
import { dedupeActualites } from '@/lib/actualites/dedup'
import { CHANGELOG } from '@/lib/constants/changelog'
import { buildNewsletter, isPreparationDay, monthKey, monthLabel, parseRss, sendAt, type Newsletter, type NlActu } from './build'

const BREVO = 'https://api.brevo.com/v3'
const SENDER = { name: 'Jason Marinho', email: 'contact@jasonmarinho.com' }
/** Listes Brevo : 2 = inscrits de l'app (case cochée), 3 = inscrits du site */
export const NEWSLETTER_LISTS = (process.env.BREVO_NEWSLETTER_LISTS ?? '2,3').split(',').map(n => Number(n.trim())).filter(n => n > 0)
const LOOKBACK_DAYS = 35

type Db = SupabaseClient

async function brevo<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
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
    .select('id, title, summary, category, source_url, published_at, created_at, is_pinned')
    .eq('is_published', true)
    .gte('published_at', since.toISOString())
    .order('is_pinned', { ascending: false, nullsFirst: false })
    .order('published_at', { ascending: false })
    .limit(60)
  type Row = { id: string; title: string; summary: string; category: string; source_url: string | null; published_at: string | null; created_at: string | null }
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

export async function composeNewsletter(db: Db, parisDate: string): Promise<Newsletter | null> {
  const c = await gatherContent(db, parisDate)
  return buildNewsletter({ parisDate, ...c })
}

async function sendPreview(n: Newsletter, note: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) return
  const banner = `<div style="font-family:Helvetica,Arial,sans-serif;background:#FFF6DA;border:1px solid #F0D58A;padding:14px 18px;margin:0 0 0;font-size:14px;line-height:1.55;color:#3a2f12;">${note}</div>`
  await new Resend(key).emails.send({
    from: 'Jason Marinho <noreply@jasonmarinho.com>',
    to: SENDER.email,
    subject: `[Aperçu] ${n.subject}`,
    html: n.html.replace('<body style="margin:0;padding:0;background:#ECF5EF;">', `<body style="margin:0;padding:0;background:#ECF5EF;">${banner}`),
  }).catch(() => undefined)
}

export type PrepareResult =
  | { state: 'pas-le-jour' | 'deja-faite' }
  | { state: 'pas-assez'; counts: null }
  | { state: 'programmee'; campaignId: number; scheduledAt: string; counts: Newsletter['counts'] }

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

  const n = await composeNewsletter(db, parisDate)
  if (!n) {
    await db.from('newsletter_issues').update({ status: 'pas-assez' }).eq('month', month)
    await sendPreviewText(`Pas de lettre des hôtes en ${monthLabel(parisDate)} : pas assez de contenu publié ce mois-ci (actualités et articles). Rien n'a été envoyé.`)
    return { state: 'pas-assez', counts: null }
  }
  const scheduledAt = sendAt(parisDate)
  try {
    const created = await brevo<{ id: number }>('/emailCampaigns', {
      method: 'POST',
      body: {
        name: `Lettre des hôtes · ${monthLabel(parisDate)}`,
        subject: n.subject,
        previewText: n.preheader,
        sender: SENDER,
        replyTo: SENDER.email,
        htmlContent: n.html,
        recipients: { listIds: NEWSLETTER_LISTS },
        scheduledAt,
        inlineImageActivation: false,
      },
    })
    await db.from('newsletter_issues').update({ status: 'programmee', campaign_id: created.id, subject: n.subject, scheduled_at: scheduledAt }).eq('month', month)
    const when = new Date(scheduledAt).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
    await sendPreview(n, `<strong>Aperçu de ta lettre des hôtes.</strong> Elle est programmée dans Brevo pour ${when}, vers tes listes d'inscrits. Rien à faire si elle te convient. Pour l'arrêter ou la modifier : Brevo → Campagnes → « ${`Lettre des hôtes · ${monthLabel(parisDate)}`} » → Suspendre.`)
    return { state: 'programmee', campaignId: created.id, scheduledAt, counts: n.counts }
  } catch (e) {
    // Échec chez Brevo : on libère le mois pour pouvoir réessayer (workflow)
    await db.from('newsletter_issues').delete().eq('month', month)
    throw e
  }
}

async function sendPreviewText(text: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) return
  await new Resend(key).emails.send({ from: 'Jason Marinho <noreply@jasonmarinho.com>', to: SENDER.email, subject: 'Lettre des hôtes', text }).catch(() => undefined)
}

/** Aperçu seul (workflow) : la lettre du jour, envoyée à Jason, sans rien programmer */
export async function previewNewsletter(db: Db, parisDate: string) {
  const n = await composeNewsletter(db, parisDate)
  if (!n) return { state: 'pas-assez' as const }
  await sendPreview(n, '<strong>Aperçu seulement</strong> : rien n\'est programmé. Voici la lettre telle qu\'elle partirait aujourd\'hui.')
  return { state: 'apercu' as const, counts: n.counts, subjectLength: n.subject.length }
}

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
