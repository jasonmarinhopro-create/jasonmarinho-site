// Assemblage de la page admin « Liens & inscriptions » (10/10/2026). Pur et
// testé (report.test.ts) : chargement dans load.ts.
import { describeAcquisition, shortLinkUrl, trackedTarget, channelOf, ACQ_LABEL, type Acquisition, type AcqKind, type AcqView } from './rules'

export type SpaceKey = 'hote' | 'photographe' | 'menage' | 'investisseur'
export const SPACE_LABEL: Record<SpaceKey, string> = { hote: 'Hôte', photographe: 'Photographe', menage: 'Équipe de ménage', investisseur: 'Investisseur' }

export interface MemberRow { id: string; name: string; created_at: string; acquisition: Acquisition | null; spaces: SpaceKey[] }
export interface LinkRow { id: string; code: string; label: string; channel: string; destination: string; archived: boolean; created_at: string }
export interface LinkClickRow { code: string; created_at: string }
export interface CampaignVisitRow { session_id: string; utm_campaign: string | null }

export interface LinkStat extends LinkRow {
  url: string
  target: string
  channelLabel: string
  clicks: number
  clicksTotal: number
  visitors: number
  signups: Array<{ id: string; name: string; created_at: string }>
  lastClick: string | null
}

export interface ProvenanceReport {
  periodDays: number
  signups: number
  measured: number
  byKind: Array<{ kind: AcqKind; label: string; count: number; pct: number }>
  bySpace: Array<{ space: SpaceKey; label: string; count: number; measured: number }>
  recent: Array<{ id: string; name: string; created_at: string; spaces: SpaceKey[]; view: AcqView }>
  links: LinkStat[]
  /** Date du premier compte dont la provenance est connue */
  measuredSince: string | null
}

export function buildProvenance(input: {
  members: MemberRow[]
  links: LinkRow[]
  clicks: LinkClickRow[]
  visits: CampaignVisitRow[]
  periodDays: number
  now: Date
}): ProvenanceReport {
  const { members, links, clicks, visits, periodDays, now } = input
  const since = now.getTime() - periodDays * 86_400_000
  const names = new Map(links.map(l => [l.code, l.label]))
  const inPeriod = members.filter(m => Date.parse(m.created_at) >= since)

  const kindCount = new Map<AcqKind, number>()
  for (const m of inPeriod) {
    const k = describeAcquisition(m.acquisition, names).kind
    kindCount.set(k, (kindCount.get(k) ?? 0) + 1)
  }
  const measured = inPeriod.filter(m => m.acquisition).length
  const byKind = [...kindCount.entries()]
    .filter(([k]) => k !== 'inconnu')
    .map(([kind, count]) => ({ kind, label: ACQ_LABEL[kind], count, pct: measured ? Math.round((count / measured) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)

  const bySpace = (Object.keys(SPACE_LABEL) as SpaceKey[]).map(space => {
    const ms = inPeriod.filter(m => m.spaces.includes(space))
    return { space, label: SPACE_LABEL[space], count: ms.length, measured: ms.filter(m => m.acquisition).length }
  }).filter(s => s.count > 0)

  const sorted = [...members].sort((a, b) => b.created_at.localeCompare(a.created_at))
  const recent = sorted.slice(0, 40).map(m => ({ id: m.id, name: m.name, created_at: m.created_at, spaces: m.spaces, view: describeAcquisition(m.acquisition, names) }))
  const firstMeasured = [...members].filter(m => m.acquisition).sort((a, b) => a.created_at.localeCompare(b.created_at))[0]

  const sessionsByCode = new Map<string, Set<string>>()
  for (const v of visits) {
    if (!v.utm_campaign) continue
    if (!sessionsByCode.has(v.utm_campaign)) sessionsByCode.set(v.utm_campaign, new Set())
    sessionsByCode.get(v.utm_campaign)!.add(v.session_id)
  }

  const linkStats: LinkStat[] = links.map(l => {
    const own = clicks.filter(c => c.code === l.code)
    const last = own.reduce<string | null>((m, c) => (!m || c.created_at > m ? c.created_at : m), null)
    return {
      ...l,
      url: shortLinkUrl(l.code),
      target: trackedTarget(l.destination, l.code, l.channel),
      channelLabel: channelOf(l.channel).label,
      clicks: own.filter(c => Date.parse(c.created_at) >= since).length,
      clicksTotal: own.length,
      visitors: sessionsByCode.get(l.code)?.size ?? 0,
      signups: sorted.filter(m => m.acquisition?.campaign === l.code).map(m => ({ id: m.id, name: m.name, created_at: m.created_at })),
      lastClick: last,
    }
  }).sort((a, b) => Number(a.archived) - Number(b.archived) || b.created_at.localeCompare(a.created_at))

  return { periodDays, signups: inPeriod.length, measured, byKind, bySpace, recent, links: linkStats, measuredSince: firstMeasured?.created_at ?? null }
}
