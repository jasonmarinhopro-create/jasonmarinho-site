// Onglet Newsletter de Provenance (11/10/2026, demande de Jason : « voir ton
// contenu et les stats »). Service role, appelé après vérification du rôle
// admin. Statistiques de chaque campagne lues chez Brevo, croisées avec nos
// visites (utm_campaign = lettre-…) et les inscriptions venues d'une lettre.
import 'server-only'
import { getServiceClient } from '@/lib/supabase/service'
import { isPaidPro } from '@/lib/admin/revenue'
import { parisToday } from '@/lib/stripe/deposit-window'
import { brevo, composeNewsletter, editionCounts, NEWSLETTER_LISTS } from './run'
import { EDITIONS, type Edition } from './editions'
import { buildIssueReports, nextSendDate, parseCampaignStats, parseLinkStats, type IssueReport, type IssueRow } from './stats-parse'

export interface NewsletterTabData {
  reports: IssueReport[]
  subscribers: { brevo: number | null; optIns: number | null; byEdition: Record<Edition, number> | null }
  totals: { visitors: number; signups: number; clients: number }
  next: { date: string; edition: Edition; html: string | null; subject: string | null }
  viewing: { key: string; subject: string; html: string } | null
  error: string | null
}

export async function loadNewsletterTab(opts: { edition: Edition; voir: string | null }): Promise<NewsletterTabData> {
  const db = getServiceClient()
  const today = parisToday()
  let error: string | null = null

  const { data: issueData } = await db.from('newsletter_issues')
    .select('month, status, campaign_id, subject, scheduled_at, recipients').order('month', { ascending: false }).limit(60)
    .then(r => (r.error ? db.from('newsletter_issues').select('month, status, campaign_id, subject, scheduled_at').order('month', { ascending: false }).limit(60) : r))
  const issues = (issueData ?? []) as IssueRow[]

  // Statistiques Brevo de chaque campagne (globales + clics par lien)
  const stats = new Map<number, { stats: ReturnType<typeof parseCampaignStats>; links: ReturnType<typeof parseLinkStats> }>()
  await Promise.all(issues.filter(i => i.campaign_id).map(async i => {
    try {
      const [g, l] = await Promise.all([
        brevo<unknown>(`/emailCampaigns/${i.campaign_id}?statistics=globalStats`),
        brevo<unknown>(`/emailCampaigns/${i.campaign_id}?statistics=linksStats`).catch(() => null),
      ])
      stats.set(i.campaign_id!, { stats: parseCampaignStats(g), links: parseLinkStats(l) })
    } catch (e) { error = `Brevo : ${String((e as Error).message).slice(0, 120)}` }
  }))

  // Nos mesures : visites et inscriptions arrivées par une lettre
  const [visitsRes, profilesRes, photoRes, cleanRes] = await Promise.all([
    db.from('site_visits').select('session_id, utm_campaign').like('utm_campaign', 'lettre-%').limit(20_000),
    db.from('profiles').select('id, plan, acquisition').like('acquisition->>campaign', 'lettre-%').limit(5_000),
    db.from('photographers').select('user_id, stripe_subscription_status').limit(5_000),
    db.from('cleaners').select('user_id, stripe_subscription_status').limit(5_000),
  ])
  const paidPros = new Set([...(photoRes.data ?? []), ...(cleanRes.data ?? [])].filter(r => isPaidPro(r as { stripe_subscription_status: string | null })).map(r => (r as { user_id: string }).user_id))
  const signups = ((profilesRes.data ?? []) as Array<{ id: string; plan: string | null; acquisition: { campaign?: string } | null }>)
    .map(p => ({ campaign: p.acquisition?.campaign ?? '', paid: p.plan === 'standard' || paidPros.has(p.id) }))
  const visits = (visitsRes.data ?? []) as Array<{ session_id: string; utm_campaign: string | null }>

  const reports = buildIssueReports({ issues, stats, visits, signups, now: new Date() })

  // Abonnés : liste Brevo, cases cochées, destinataires par édition
  let brevoCount: number | null = null
  try {
    const l = await brevo<{ uniqueSubscribers?: number; totalSubscribers?: number }>(`/contacts/lists/${NEWSLETTER_LISTS[0]}`)
    brevoCount = l.uniqueSubscribers ?? l.totalSubscribers ?? null
  } catch (e) { error = error ?? `Brevo : ${String((e as Error).message).slice(0, 120)}` }
  const optInRes = await db.from('profiles').select('id', { count: 'exact', head: true }).eq('newsletter_opt_in', true)
  const byEdition = await editionCounts(db).catch(() => null)

  // La prochaine lettre, composée avec ce qui est publié aujourd'hui
  let next: NewsletterTabData['next'] = { date: nextSendDate(today), edition: opts.edition, html: null, subject: null }
  try {
    const n = await composeNewsletter(db, today, opts.edition)
    next = { ...next, html: n?.html ?? null, subject: n?.subject ?? null }
  } catch { /* contenu indisponible */ }

  // Contenu d'une lettre envoyée (enregistré, sinon relu chez Brevo)
  let viewing: NewsletterTabData['viewing'] = null
  if (opts.voir) {
    const { data: row } = await db.from('newsletter_issues').select('month, subject, campaign_id, html').eq('month', opts.voir).maybeSingle()
      .then(r => (r.error ? db.from('newsletter_issues').select('month, subject, campaign_id').eq('month', opts.voir!).maybeSingle() : r))
    const r = row as { month: string; subject: string | null; campaign_id: number | null; html?: string | null } | null
    let html = r?.html ?? null
    if (!html && r?.campaign_id) {
      try { html = (await brevo<{ htmlContent?: string }>(`/emailCampaigns/${r.campaign_id}`)).htmlContent ?? null } catch { /* indisponible */ }
    }
    if (r && html) viewing = { key: r.month, subject: r.subject ?? '', html }
  }

  return {
    reports,
    subscribers: { brevo: brevoCount, optIns: optInRes.error ? null : optInRes.count ?? 0, byEdition },
    totals: { visitors: new Set(visits.map(v => v.session_id)).size, signups: signups.length, clients: signups.filter(s => s.paid).length },
    next, viewing, error,
  }
}

export { EDITIONS }
