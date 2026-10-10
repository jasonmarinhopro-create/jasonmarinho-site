// Acquisition (10/10/2026, demande de Jason, modèle : la page Acquisition de
// son CRM Driing) : visiteurs, inscriptions et clients par canal, ce qui se
// passe en ce moment et aujourd'hui, Google Search Console jour par jour, et
// le résumé de la Vue d'ensemble. Pur et testé (traffic.test.ts).
import { sourceOf, pageLabel, parisDay, addDays, type SourceKind } from '@/lib/visibility/rules'
import { channelOf, type Acquisition } from './rules'

export interface TrafficVisit {
  session_id: string
  path: string
  referrer: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  created_at: string
}
export interface TrafficMember { id: string; created_at: string; acquisition: Acquisition | null; paid: boolean }
export interface TrafficLink { code: string; label: string; channel: string }
export interface TrafficClick { code: string; created_at: string }
export interface GscDay { date: string; clicks: number; impressions: number; position: number }

export type ChannelKey = 'facebook' | 'google' | 'ia' | 'liens' | 'email' | 'autres' | 'direct' | 'sans'

export const CHANNEL_META: Record<ChannelKey, { label: string; hint: string }> = {
  facebook: { label: 'Facebook', hint: 'groupes, page, liens suivis postés sur Facebook' },
  google: { label: 'Google', hint: 'recherche naturelle' },
  ia: { label: 'IA', hint: 'ChatGPT, Perplexity, Gemini…' },
  liens: { label: 'Liens suivis', hint: 'Instagram, WhatsApp, e-mails, QR codes' },
  email: { label: 'E-mails', hint: 'prospection, newsletter' },
  autres: { label: 'Autres sites et réseaux', hint: 'Instagram, LinkedIn, sites qui parlent de toi' },
  direct: { label: 'Accès direct', hint: 'favoris, lien copié, applis qui masquent l\'origine' },
  sans: { label: 'Sans origine', hint: 'comptes créés avant le suivi' },
}
export const CHANNEL_ORDER: ChannelKey[] = ['facebook', 'google', 'ia', 'liens', 'email', 'autres', 'direct', 'sans']

const KIND_TO_CHANNEL: Record<SourceKind, ChannelKey> = {
  facebook: 'facebook', google: 'google', ia: 'ia', 'e-mail': 'email',
  instagram: 'autres', 'autre-reseau': 'autres', 'autre-site': 'autres', 'autre-moteur': 'autres',
  direct: 'direct', interne: 'direct',
}

type LinkMap = Map<string, TrafficLink>
const linkChannelKey = (l: TrafficLink): ChannelKey => (channelOf(l.channel).source === 'facebook' ? 'facebook' : 'liens')

/** Canal d'une visite (première page de la session) */
export function visitChannel(v: Pick<TrafficVisit, 'referrer' | 'utm_source' | 'utm_medium' | 'utm_campaign'>, links: LinkMap): ChannelKey {
  const l = v.utm_campaign ? links.get(v.utm_campaign) : undefined
  if (l) return linkChannelKey(l)
  return KIND_TO_CHANNEL[sourceOf(v).kind]
}

/** Canal d'une inscription (provenance gardée sur le compte) */
export function acquisitionChannel(acq: Acquisition | null, links: LinkMap): ChannelKey {
  if (!acq) return 'sans'
  return visitChannel({ referrer: acq.ref ? `https://${acq.ref}/` : null, utm_source: acq.source ?? null, utm_medium: acq.medium ?? null, utm_campaign: acq.campaign ?? null }, links)
}

/** Nom court d'une provenance de visite, pour les listes (« Google », « ChatGPT », « le13depic.wixsite.com ») */
function sourceName(v: TrafficVisit, links: LinkMap): string {
  const l = v.utm_campaign ? links.get(v.utm_campaign) : undefined
  if (l) return l.label
  const s = sourceOf(v)
  if (s.kind === 'ia') return s.ai ?? 'IA'
  if (s.kind === 'google') return 'Google'
  if (s.kind === 'facebook') return 'Facebook'
  if (s.kind === 'instagram') return 'Instagram'
  if (s.kind === 'direct' || s.kind === 'interne') return 'Accès direct'
  if (s.kind === 'e-mail') return v.utm_source === 'prospection' ? 'E-mail de prospection' : 'E-mail'
  return (s.site ?? 'Autre site').replace(/^www\./, '')
}

/** Première page vue de chaque session */
export function firstVisits(visits: TrafficVisit[]): TrafficVisit[] {
  const first = new Map<string, TrafficVisit>()
  for (const v of [...visits].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    if (!first.has(v.session_id)) first.set(v.session_id, v)
  }
  return [...first.values()]
}

const inDays = (iso: string, start: string, end: string) => { const d = parisDay(iso); return d >= start && d <= end }
const topCounts = (m: Map<string, number>, n: number) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, count]) => ({ name, count }))
const bump = (m: Map<string, number>, k: string, by = 1) => m.set(k, (m.get(k) ?? 0) + by)

export interface ChannelCard {
  key: ChannelKey
  label: string
  hint: string
  visitors: number | null
  signups: number
  clients: number
  /** Clics : liens suivis (Facebook, liens), Google Search Console (Google) */
  clicks: number | null
  clicksLabel: string | null
  /** Les plus fréquents du canal (sites, IA, liens…) */
  top: Array<{ name: string; count: number }>
  note: string | null
}

export interface GscSummary { clicks: number; impressions: number; position: number; from: string; to: string }

function gscSum(days: GscDay[], start: string, end: string): GscSummary | null {
  const sel = days.filter(d => d.date >= start && d.date <= end)
  if (!sel.length) return null
  const clicks = sel.reduce((n, d) => n + d.clicks, 0)
  const impressions = sel.reduce((n, d) => n + d.impressions, 0)
  const position = impressions ? sel.reduce((n, d) => n + d.position * d.impressions, 0) / impressions : 0
  return { clicks, impressions, position, from: sel[0].date, to: sel[sel.length - 1].date }
}

/** Cartes « Par canal » entre deux jours de Paris (inclus) */
export function buildChannelCards(input: {
  visits: TrafficVisit[]; members: TrafficMember[]; links: TrafficLink[]; clicks: TrafficClick[]; gsc: GscDay[] | null
  start: string; end: string; gscLagDays?: number
}): ChannelCard[] {
  const links: LinkMap = new Map(input.links.map(l => [l.code, l]))
  const visitors = new Map<ChannelKey, number>()
  const top = new Map<ChannelKey, Map<string, number>>()
  for (const v of firstVisits(input.visits)) {
    if (!inDays(v.created_at, input.start, input.end)) continue
    const c = visitChannel(v, links)
    bump(visitors as Map<string, number>, c)
    if (!top.has(c)) top.set(c, new Map())
    if (c !== 'direct' && c !== 'google' && c !== 'facebook') bump(top.get(c)!, sourceName(v, links))
  }
  const signups = new Map<ChannelKey, number>()
  const clients = new Map<ChannelKey, number>()
  for (const m of input.members) {
    if (!inDays(m.created_at, input.start, input.end)) continue
    const c = acquisitionChannel(m.acquisition, links)
    bump(signups as Map<string, number>, c)
    if (m.paid) bump(clients as Map<string, number>, c)
  }
  const linkClicks = new Map<ChannelKey, number>()
  const byLink = new Map<ChannelKey, Map<string, number>>()
  for (const k of input.clicks) {
    const l = links.get(k.code)
    if (!l || !inDays(k.created_at, input.start, input.end)) continue
    const c = linkChannelKey(l)
    bump(linkClicks as Map<string, number>, c)
    if (!byLink.has(c)) byLink.set(c, new Map())
    bump(byLink.get(c)!, l.label)
  }
  // Google : 2 jours de retard, on prend la même durée finissant au dernier jour connu
  const lag = input.gscLagDays ?? 2
  const gEnd = addDays(input.end, -lag)
  const gStart = addDays(input.start, -lag)
  const g = input.gsc ? gscSum(input.gsc, gStart, gEnd) : null

  return CHANNEL_ORDER.map(key => {
    const meta = CHANNEL_META[key]
    const card: ChannelCard = {
      key, label: meta.label, hint: meta.hint,
      visitors: key === 'sans' ? null : visitors.get(key) ?? 0,
      signups: signups.get(key) ?? 0,
      clients: clients.get(key) ?? 0,
      clicks: null, clicksLabel: null, top: topCounts(top.get(key) ?? new Map(), 3), note: null,
    }
    if (key === 'facebook' || key === 'liens') {
      card.clicks = linkClicks.get(key) ?? 0
      card.clicksLabel = 'clics sur tes liens'
      card.top = topCounts(byLink.get(key) ?? new Map(), 3)
    }
    if (key === 'google') {
      card.clicks = g?.clicks ?? null
      card.clicksLabel = 'clics selon Google'
      card.note = g ? `${g.impressions.toLocaleString('fr-FR')} affichages · place moyenne ${g.position.toFixed(1).replace('.', ',')}` : input.gsc ? 'Pas encore de chiffres Google sur ces jours' : 'Search Console indisponible'
    }
    if (key === 'direct') card.note = meta.hint
    if (key === 'sans') card.note = meta.hint
    return card
  })
}

// ── Aujourd'hui et en ce moment ──

export interface TodayData {
  today: string
  liveNow: number
  last30: number
  livePages: Array<{ name: string; count: number }>
  visitorsToday: number
  viewsToday: number
  visitorsYesterday: number
  sources: Array<{ name: string; count: number }>
  sourcesDay: 'today' | 'yesterday'
  clicksToday: number
  clicksYesterday: number
  clicksLast30: number
  signupsToday: number
  signupsYesterday: number
  recentLinks: Array<{ code: string; label: string; channel: string; count: number; lastClick: string }>
  linkPagesToday: Array<{ name: string; count: number; links: string[] }>
  google: { day: GscDay | null; prevDay: GscDay | null; week: GscSummary | null; prevWeek: GscSummary | null }
}

export function buildToday(input: {
  visits: TrafficVisit[]; members: TrafficMember[]; links: TrafficLink[]; clicks: TrafficClick[]; gsc: GscDay[] | null; now: Date
}): TodayData {
  const nowMs = input.now.getTime()
  const today = parisDay(input.now.toISOString())
  const yesterday = addDays(today, -1)
  const links: LinkMap = new Map(input.links.map(l => [l.code, l]))
  const ago = (iso: string) => nowMs - Date.parse(iso)

  const lastBySession = new Map<string, TrafficVisit>()
  const recent30 = new Set<string>()
  for (const v of input.visits) {
    const a = ago(v.created_at)
    if (a <= 30 * 60_000 && a >= 0) recent30.add(v.session_id)
    if (a <= 5 * 60_000 && a >= 0) {
      const prev = lastBySession.get(v.session_id)
      if (!prev || v.created_at > prev.created_at) lastBySession.set(v.session_id, v)
    }
  }
  const pages = new Map<string, number>()
  for (const v of lastBySession.values()) bump(pages, pageLabel(v.path))

  const dayOf = (v: TrafficVisit) => parisDay(v.created_at)
  const todayVisits = input.visits.filter(v => dayOf(v) === today)
  const sessionsOn = (day: string) => new Set(input.visits.filter(v => dayOf(v) === day).map(v => v.session_id)).size

  const firsts = firstVisits(input.visits)
  const sourcesOn = (day: string) => {
    const m = new Map<string, number>()
    for (const v of firsts) if (dayOf(v) === day) bump(m, sourceName(v, links))
    return topCounts(m, 6)
  }
  let sources = sourcesOn(today)
  let sourcesDay: 'today' | 'yesterday' = 'today'
  if (!sources.length) { sources = sourcesOn(yesterday); sourcesDay = 'yesterday' }

  const clickDay = (day: string) => input.clicks.filter(c => links.has(c.code) && parisDay(c.created_at) === day).length
  const signupDay = (day: string) => input.members.filter(m => parisDay(m.created_at) === day).length

  const weekStart = addDays(today, -6)
  const perLink = new Map<string, { count: number; lastClick: string }>()
  for (const c of input.clicks) {
    if (!links.has(c.code) || parisDay(c.created_at) < weekStart) continue
    const cur = perLink.get(c.code) ?? { count: 0, lastClick: c.created_at }
    cur.count++
    if (c.created_at > cur.lastClick) cur.lastClick = c.created_at
    perLink.set(c.code, cur)
  }
  const recentLinks = [...perLink.entries()]
    .map(([code, s]) => ({ code, label: links.get(code)!.label, channel: links.get(code)!.channel, ...s }))
    .sort((a, b) => b.lastClick.localeCompare(a.lastClick))
    .slice(0, 8)

  const linkPages = new Map<string, { count: number; links: Set<string> }>()
  for (const v of todayVisits) {
    const l = v.utm_campaign ? links.get(v.utm_campaign) : undefined
    if (!l) continue
    const name = pageLabel(v.path)
    const cur = linkPages.get(name) ?? { count: 0, links: new Set<string>() }
    cur.count++
    cur.links.add(l.label)
    linkPages.set(name, cur)
  }

  // Google : dernier jour connu et la semaine qui finit ce jour-là
  const gsc = [...(input.gsc ?? [])].sort((a, b) => a.date.localeCompare(b.date))
  const day = gsc.length ? gsc[gsc.length - 1] : null
  const prevDay = gsc.length > 1 ? gsc[gsc.length - 2] : null
  const week = day ? gscSum(gsc, addDays(day.date, -6), day.date) : null
  const prevWeek = day ? gscSum(gsc, addDays(day.date, -13), addDays(day.date, -7)) : null

  return {
    today,
    liveNow: lastBySession.size,
    last30: recent30.size,
    livePages: topCounts(pages, 6),
    visitorsToday: sessionsOn(today),
    viewsToday: todayVisits.length,
    visitorsYesterday: sessionsOn(yesterday),
    sources, sourcesDay,
    clicksToday: clickDay(today),
    clicksYesterday: clickDay(yesterday),
    clicksLast30: input.clicks.filter(c => links.has(c.code) && ago(c.created_at) <= 30 * 60_000 && ago(c.created_at) >= 0).length,
    signupsToday: signupDay(today),
    signupsYesterday: signupDay(yesterday),
    recentLinks,
    linkPagesToday: [...linkPages.entries()].map(([name, s]) => ({ name, count: s.count, links: [...s.links] })).sort((a, b) => b.count - a.count).slice(0, 6),
    google: { day, prevDay, week, prevWeek },
  }
}

// ── Résumé pour la Vue d'ensemble ──

export interface SnapshotSide {
  visitors: number
  prevVisitors: number
  signups: number
  prevSignups: number
  linkClicks: number
  google: { clicks: number; impressions: number; label: string } | null
  topChannels: Array<{ label: string; visitors: number }>
}

export function buildSnapshot(input: {
  visits: TrafficVisit[]; members: TrafficMember[]; links: TrafficLink[]; clicks: TrafficClick[]; gsc: GscDay[] | null; now: Date
}): { day: SnapshotSide; week: SnapshotSide } {
  const today = parisDay(input.now.toISOString())
  const side = (start: string, end: string, prevStart: string, prevEnd: string, googleDays: number): SnapshotSide => {
    const cards = buildChannelCards({ ...input, start, end })
    const prev = buildChannelCards({ ...input, start: prevStart, end: prevEnd })
    const sum = (cs: ChannelCard[], f: (c: ChannelCard) => number) => cs.reduce((n, c) => n + f(c), 0)
    const gsc = [...(input.gsc ?? [])].sort((a, b) => a.date.localeCompare(b.date))
    const last = gsc.length ? gsc[gsc.length - 1].date : null
    const g = last ? gscSum(gsc, addDays(last, -(googleDays - 1)), last) : null
    const dateFr = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
    return {
      visitors: sum(cards, c => c.visitors ?? 0),
      prevVisitors: sum(prev, c => c.visitors ?? 0),
      signups: sum(cards, c => c.signups),
      prevSignups: sum(prev, c => c.signups),
      linkClicks: sum(cards, c => (c.key === 'facebook' || c.key === 'liens' ? c.clicks ?? 0 : 0)),
      google: g ? { clicks: g.clicks, impressions: g.impressions, label: googleDays === 1 ? `le ${dateFr(g.to)}` : `du ${dateFr(g.from)} au ${dateFr(g.to)}` } : null,
      topChannels: cards.filter(c => (c.visitors ?? 0) > 0).sort((a, b) => (b.visitors ?? 0) - (a.visitors ?? 0)).slice(0, 4).map(c => ({ label: c.label, visitors: c.visitors ?? 0 })),
    }
  }
  return {
    day: side(today, today, addDays(today, -1), addDays(today, -1), 1),
    week: side(addDays(today, -6), today, addDays(today, -13), addDays(today, -7), 7),
  }
}
