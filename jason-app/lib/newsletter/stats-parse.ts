// Statistiques de « Le Check-in » pour l'onglet Newsletter de Provenance
// (11/10/2026). Pur et testé (stats-parse.test.ts) : lecture tolérante des
// réponses de Brevo et croisement avec nos visites et inscriptions.
import type { Edition } from './editions'

export interface CampaignStats { sent: number; delivered: number; opens: number; clicks: number; unsubscribed: number; bounces: number }
export interface LinkClick { url: string; label: string; clicks: number }

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

/** `statistics.globalStats` d'une campagne (GET /emailCampaigns/{id}?statistics=globalStats) */
export function parseCampaignStats(json: unknown): CampaignStats | null {
  const stats = (json as { statistics?: { globalStats?: Record<string, unknown>; campaignStats?: Array<Record<string, unknown>> } })?.statistics
  if (!stats) return null
  let g = stats.globalStats
  // Certaines réponses n'ont que le détail par liste : on additionne
  if (!g || !Object.keys(g).length) {
    const rows = stats.campaignStats ?? []
    if (!rows.length) return null
    g = rows.reduce<Record<string, number>>((acc, r) => {
      for (const [k, v] of Object.entries(r)) if (typeof v === 'number') acc[k] = (acc[k] ?? 0) + v
      return acc
    }, {})
  }
  return {
    sent: num(g.sent),
    delivered: num(g.delivered),
    opens: num(g.uniqueViews) || num(g.viewed),
    clicks: num(g.uniqueClicks) || num(g.clickers),
    unsubscribed: num(g.unsubscriptions),
    bounces: num(g.hardBounces) + num(g.softBounces),
  }
}

/** Libellé lisible d'un lien de la lettre (sans les paramètres de suivi) */
export function linkLabel(url: string): string {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    const path = u.pathname.replace(/\/$/, '')
    if (host === 'jasonmarinho.com') return path || 'Accueil du site'
    if (host === 'app.jasonmarinho.com') return `App ${path.replace(/^\/dashboard/, '') || '(accueil)'}`
    return `${host}${path}`
  } catch { return url }
}

/** `statistics.linksStats` : clics par lien, regroupés sans les paramètres utm */
export function parseLinkStats(json: unknown): LinkClick[] {
  const raw = (json as { statistics?: { linksStats?: unknown } })?.statistics?.linksStats
  const counts = new Map<string, number>()
  const walk = (o: unknown) => {
    if (!o || typeof o !== 'object') return
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      if (typeof v === 'number' && /^https?:\/\//.test(k)) {
        let key = k
        try { const u = new URL(k); u.search = ''; u.hash = ''; key = u.toString() } catch { /* lien tel quel */ }
        counts.set(key, (counts.get(key) ?? 0) + v)
      } else if (v && typeof v === 'object') walk(v)
    }
  }
  walk(raw)
  return [...counts.entries()]
    .filter(([url]) => !/\{\{|unsubscribe|mirror/i.test(url))
    .map(([url, clicks]) => ({ url, label: linkLabel(url), clicks }))
    .sort((a, b) => b.clicks - a.clicks)
}

export const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 1000) / 10 : null)

/** Code de campagne (utm_campaign) d'une lettre : « lettre-2026-11 » ou « lettre-2026-11-photographe » */
export function campaignCode(issueKey: string): string {
  const [month, edition] = issueKey.split('#')
  return `lettre-${month}${edition ? `-${edition}` : ''}`
}

export function editionOfKey(issueKey: string): Edition {
  return (issueKey.split('#')[1] as Edition | undefined) ?? 'hote'
}

export interface IssueRow { month: string; status: string; campaign_id: number | null; subject: string | null; scheduled_at: string | null; recipients?: number | null }

export interface IssueReport {
  key: string
  month: string
  edition: Edition
  code: string
  subject: string
  scheduledAt: string | null
  sent: boolean
  recipients: number | null
  stats: CampaignStats | null
  openRate: number | null
  clickRate: number | null
  links: LinkClick[]
  visitors: number
  signups: number
  clients: number
}

/** Une ligne par lettre et par édition, la plus récente d'abord */
export function buildIssueReports(input: {
  issues: IssueRow[]
  stats: Map<number, { stats: CampaignStats | null; links: LinkClick[] }>
  visits: Array<{ session_id: string; utm_campaign: string | null }>
  signups: Array<{ campaign: string; paid: boolean }>
  now: Date
}): IssueReport[] {
  const sessions = new Map<string, Set<string>>()
  for (const v of input.visits) {
    if (!v.utm_campaign) continue
    if (!sessions.has(v.utm_campaign)) sessions.set(v.utm_campaign, new Set())
    sessions.get(v.utm_campaign)!.add(v.session_id)
  }
  return input.issues
    .filter(i => i.campaign_id && i.status === 'programmee')
    .map(i => {
      const code = campaignCode(i.month)
      const s = input.stats.get(i.campaign_id!) ?? { stats: null, links: [] }
      const delivered = s.stats?.delivered || s.stats?.sent || 0
      const own = input.signups.filter(x => x.campaign === code)
      return {
        key: i.month,
        month: i.month.split('#')[0],
        edition: editionOfKey(i.month),
        code,
        subject: i.subject ?? '',
        scheduledAt: i.scheduled_at,
        sent: !!i.scheduled_at && Date.parse(i.scheduled_at) <= input.now.getTime(),
        recipients: i.recipients ?? null,
        stats: s.stats,
        openRate: s.stats ? pct(s.stats.opens, delivered) : null,
        clickRate: s.stats ? pct(s.stats.clicks, delivered) : null,
        links: s.links.slice(0, 6),
        visitors: sessions.get(code)?.size ?? 0,
        signups: own.length,
        clients: own.filter(x => x.paid).length,
      }
    })
    .sort((a, b) => b.month.localeCompare(a.month) || a.edition.localeCompare(b.edition))
}

/** Prochain envoi : le mardi qui suit le premier lundi du mois (aujourd'hui compris) */
export function nextSendDate(parisDate: string): string {
  const d = new Date(`${parisDate}T12:00:00Z`)
  for (let i = 0; i < 40; i++) {
    const day = new Date(d.getTime() + i * 86_400_000)
    if (day.getUTCDay() === 1 && day.getUTCDate() <= 7) return new Date(day.getTime() + 86_400_000).toISOString().slice(0, 10)
  }
  return parisDate
}
