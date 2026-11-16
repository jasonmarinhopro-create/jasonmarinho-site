// Bloc « Audience » de la Vue d'ensemble admin (16/11/2026, Jason : « un vrai
// cockpit », maquette A retenue). Pour aujourd'hui, 7 jours et 30 jours :
// visiteurs, inscriptions, inscrits devenus clients et clics Google, chacun
// comparé à la période d'avant ; d'où ils viennent ; ce qu'ils lisent ; la
// courbe des visiteurs jour par jour avec la période d'avant et les jours
// d'inscription. Pur et testé (audience.test.ts).
import { pageLabel, parisDay, addDays } from '@/lib/visibility/rules'
import { buildChannelCards, type GscDay, type TrafficClick, type TrafficLink, type TrafficMember, type TrafficVisit } from './traffic'

export type AudiencePeriod = 'day' | 'week' | 'month'
export const AUDIENCE_DAYS: Record<AudiencePeriod, number> = { day: 1, week: 7, month: 30 }

export interface AudienceSide {
  visitors: number; prevVisitors: number
  signups: number; prevSignups: number
  clients: number; prevClients: number
  google: { clicks: number; impressions: number; prevClicks: number; from: string; to: string } | null
  sources: Array<{ key: string; label: string; count: number }>
  pages: Array<{ label: string; path: string; views: number }>
  /** Jour par jour : 14 jours (aujourd'hui, 7 jours) ou 30 jours */
  series: Array<{ date: string; visitors: number; prev: number; signups: number }>
}

export function buildAudience(input: {
  visits: TrafficVisit[]; members: TrafficMember[]; links: TrafficLink[]; clicks: TrafficClick[]; gsc: GscDay[] | null; now: Date
}): Record<AudiencePeriod, AudienceSide> {
  const today = parisDay(input.now.toISOString())
  // Sessions par jour et pages vues par jour, calculées une fois
  const sessionsByDay = new Map<string, Set<string>>()
  const viewsByDay = new Map<string, Map<string, number>>()
  for (const v of input.visits) {
    const d = parisDay(v.created_at)
    if (!sessionsByDay.has(d)) sessionsByDay.set(d, new Set())
    sessionsByDay.get(d)!.add(v.session_id)
    if (!viewsByDay.has(d)) viewsByDay.set(d, new Map())
    const m = viewsByDay.get(d)!
    m.set(v.path, (m.get(v.path) ?? 0) + 1)
  }
  const signupsByDay = new Map<string, number>()
  for (const m of input.members) {
    const d = parisDay(m.created_at)
    signupsByDay.set(d, (signupsByDay.get(d) ?? 0) + 1)
  }
  const gsc = [...(input.gsc ?? [])].sort((a, b) => a.date.localeCompare(b.date))
  const gscLast = gsc.length ? gsc[gsc.length - 1].date : null
  const gscSum = (from: string, to: string) => gsc.filter(g => g.date >= from && g.date <= to)
    .reduce((s, g) => ({ clicks: s.clicks + g.clicks, impressions: s.impressions + g.impressions }), { clicks: 0, impressions: 0 })

  const side = (n: number): AudienceSide => {
    const start = addDays(today, -(n - 1))
    const prevEnd = addDays(start, -1)
    const prevStart = addDays(prevEnd, -(n - 1))
    const cards = buildChannelCards({ ...input, start, end: today })
    const prev = buildChannelCards({ ...input, start: prevStart, end: prevEnd })
    const sum = (cs: typeof cards, f: (c: typeof cards[number]) => number) => cs.reduce((t, c) => t + f(c), 0)

    const pageViews = new Map<string, number>()
    for (let d = start; d <= today; d = addDays(d, 1)) {
      for (const [p, c] of viewsByDay.get(d) ?? []) pageViews.set(p, (pageViews.get(p) ?? 0) + c)
    }
    // Pages regroupées par libellé (une même page avec ou sans « / » final)
    const byLabel = new Map<string, { path: string; views: number }>()
    for (const [path, views] of pageViews) {
      const label = pageLabel(path)
      const cur = byLabel.get(label)
      if (cur) { cur.views += views; if (path.length < cur.path.length) cur.path = path } else byLabel.set(label, { path, views })
    }

    const len = n === 30 ? 30 : 14
    const series: AudienceSide['series'] = []
    for (let i = len - 1; i >= 0; i--) {
      const d = addDays(today, -i)
      series.push({ date: d, visitors: sessionsByDay.get(d)?.size ?? 0, prev: sessionsByDay.get(addDays(d, -len))?.size ?? 0, signups: signupsByDay.get(d) ?? 0 })
    }

    // Google : même durée, finissant au dernier jour connu (2 jours de retard)
    let google: AudienceSide['google'] = null
    if (gscLast) {
      const gFrom = addDays(gscLast, -(n - 1))
      const cur = gscSum(gFrom, gscLast)
      const before = gscSum(addDays(gFrom, -n), addDays(gFrom, -1))
      google = { clicks: cur.clicks, impressions: cur.impressions, prevClicks: before.clicks, from: gFrom, to: gscLast }
    }

    return {
      visitors: sum(cards, c => c.visitors ?? 0), prevVisitors: sum(prev, c => c.visitors ?? 0),
      signups: sum(cards, c => c.signups), prevSignups: sum(prev, c => c.signups),
      clients: sum(cards, c => c.clients), prevClients: sum(prev, c => c.clients),
      google,
      sources: cards.filter(c => (c.visitors ?? 0) > 0).sort((a, b) => (b.visitors ?? 0) - (a.visitors ?? 0)).slice(0, 6)
        .map(c => ({ key: c.key, label: c.label, count: c.visitors ?? 0 })),
      pages: [...byLabel.entries()].sort((a, b) => b[1].views - a[1].views).slice(0, 5)
        .map(([label, p]) => ({ label, path: p.path, views: p.views })),
      series,
    }
  }
  return { day: side(1), week: side(7), month: side(30) }
}
