// Onglet « Partenaires » de la page Visibilité (05/10/2026) : clics vers les
// liens affiliés du site (affiliate_clicks, écrits par nav.js sur tout lien
// rel="sponsored"), croisés avec nos visites (d'où viennent les visiteurs qui
// cliquent, quelles pages envoient des clics) et avec Google (place des
// pages), plus les ventes suivies par Affilae (Indy, LegalPlace, Tiime).
// Pur et testé (partners.test.ts). Un clic n'est pas une vente : les ventes
// Lodgify, Hospitable et Shine restent dans le tableau de bord du partenaire.
import type { AffilaeOverview } from '@/lib/affiliation/affilae'
import type { ConversionStatus } from '@/lib/affiliation/affilae-parse'
import {
  bucketKeys, bucketOf, granularityFor, pageKind, pageLabel, parisDay, pctChange, placeOf, sourceOf, SOURCE_LABEL,
  type Granularity, type PageKind, type Period, type SourceKind, type VisitRow,
} from './rules'

export interface ClickRow { session_id: string; path: string; partner: string; created_at: string }

export interface PartnerInfo {
  name: string
  /** Ce que rapporte un client amené (faits relevés, voir CLAUDE.md « Liens affiliés ») */
  reward: string
  /** Où voir les ventes */
  salesWhere: string
  affilae: boolean
}

export const PARTNERS: Record<string, PartnerInfo> = {
  lodgify: { name: 'Lodgify', reward: '20 % des abonnements des clients amenés (25 % au-delà de 3 000 $ de ventes, 30 % au-delà de 10 000 $)', salesWhere: 'Tableau de bord affilié Lodgify', affilae: false },
  hospitable: { name: 'Hospitable', reward: '200 $ par client parrainé, sans plafond', salesWhere: 'Espace partenaire Hospitable', affilae: false },
  shine: { name: 'Shine', reward: 'Parrainage (2 par an selon les conditions de Shine)', salesWhere: 'Application Shine, rubrique parrainage', affilae: false },
  indy: { name: 'Indy', reward: 'De 10 € HT (inscription) à 250 € HT (société), selon le compte ouvert', salesWhere: 'Affilae', affilae: true },
  legalplace: { name: 'LegalPlace', reward: 'Jusqu\'à 150 € par vente', salesWhere: 'Affilae', affilae: true },
  tiime: { name: 'Tiime', reward: 'Commission Affilae', salesWhere: 'Affilae', affilae: true },
}

export function partnerInfo(slug: string): PartnerInfo {
  const known = PARTNERS[slug.toLowerCase()]
  if (known) return known
  const name = slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Autre'
  return { name, reward: '', salesWhere: 'Tableau de bord du partenaire', affilae: slug === 'affilae' }
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')

export interface PartnerSales {
  conversions: number
  commissionCents: number
  byStatus: Record<ConversionStatus, number>
  status: string | null
  affilaeClicks: number | null
}

export interface PartnerItem {
  slug: string
  name: string
  reward: string
  salesWhere: string
  affilae: boolean
  clicks: number
  prevClicks: number
  clicksPct: number | null
  /** Visiteurs distincts qui ont cliqué */
  clickers: number
  pages: Array<{ path: string; label: string; clicks: number }>
  sources: Array<{ key: SourceKind; label: string; count: number }>
  sales: PartnerSales | null
}

export interface PartnerPageItem {
  path: string
  label: string
  kind: PageKind
  clicks: number
  clickers: number
  visitors: number
  /** Part des visiteurs de la page qui ont cliqué un lien partenaire */
  ratePct: number | null
  partners: Array<{ name: string; clicks: number }>
  place: number | null
  impressions: number
}

export interface PartnerOpportunity {
  path: string
  label: string
  kind: PageKind
  visitors: number
  impressions: number
  place: number | null
  clicks: number
  ratePct: number | null
}

export interface PartnersData {
  clicks: number
  prevClicks: number
  clicksPct: number | null
  clickers: number
  siteVisitors: number
  /** Part des visiteurs du site qui ont cliqué au moins un lien partenaire */
  clickRatePct: number | null
  granularity: Granularity
  series: Array<{ key: string; clicks: number; prev: number | null }>
  partners: PartnerItem[]
  pages: PartnerPageItem[]
  opportunities: PartnerOpportunity[]
  sources: Array<{ key: SourceKind; label: string; count: number; pct: number }>
  affilae: AffilaeOverview | null
}

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null)

function firstVisitBySession(visits: VisitRow[]): Map<string, VisitRow> {
  const out = new Map<string, VisitRow>()
  for (const v of [...visits].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    if (!out.has(v.session_id)) out.set(v.session_id, v)
  }
  return out
}

function sessionsPerPath(visits: VisitRow[]): Map<string, number> {
  const m = new Map<string, Set<string>>()
  for (const v of visits) {
    if (!m.has(v.path)) m.set(v.path, new Set())
    m.get(v.path)!.add(v.session_id)
  }
  return new Map([...m.entries()].map(([p, s]) => [p, s.size]))
}

/** Ventes Affilae d'un partenaire, retrouvées par le nom du programme */
export function affilaeSalesFor(name: string, overview: AffilaeOverview | null): PartnerSales | null {
  if (!overview || overview.state !== 'ok') return null
  const n = norm(name)
  const prog = overview.summary.programs.find(p => norm(p.name).includes(n) || (n.length > 3 && n.includes(norm(p.name))))
  if (!prog) return null
  return {
    conversions: prog.conversions,
    commissionCents: prog.commissionCents,
    byStatus: prog.byStatus,
    status: prog.status,
    affilaeClicks: prog.clicks,
  }
}

/** Pages où un lien partenaire a du sens (avis, prix, comparatifs, pages partenaires) */
const PARTNER_PAGE_KINDS: PageKind[] = ['partenaire', 'comparatif']

export function buildPartners(input: {
  clicks: ClickRow[]
  prevClicks: ClickRow[]
  visits: VisitRow[]
  period: Period
  /** Place et affichages Google par chemin */
  pages: Map<string, { impressions: number; position: number }>
  affilae: AffilaeOverview | null
}): PartnersData {
  const { clicks, prevClicks, visits, period, pages, affilae } = input
  const first = firstVisitBySession(visits)
  const visitorsByPath = sessionsPerPath(visits)
  const siteVisitors = first.size

  // ── Par partenaire ──
  const bySlug = new Map<string, ClickRow[]>()
  for (const c of clicks) bySlug.set(c.partner, [...(bySlug.get(c.partner) ?? []), c])
  const prevBySlug = new Map<string, number>()
  for (const c of prevClicks) prevBySlug.set(c.partner, (prevBySlug.get(c.partner) ?? 0) + 1)
  const slugs = new Set([...bySlug.keys(), ...prevBySlug.keys(), ...Object.keys(PARTNERS)])

  const partners: PartnerItem[] = [...slugs].map(slug => {
    const list = bySlug.get(slug) ?? []
    const info = partnerInfo(slug)
    const pageCount = new Map<string, number>()
    for (const c of list) pageCount.set(c.path, (pageCount.get(c.path) ?? 0) + 1)
    const sessions = new Set(list.map(c => c.session_id))
    const srcCount = new Map<SourceKind, number>()
    for (const s of sessions) {
      const v = first.get(s)
      if (v) { const k = sourceOf(v).kind; srcCount.set(k, (srcCount.get(k) ?? 0) + 1) }
    }
    const prev = prevBySlug.get(slug) ?? 0
    return {
      slug,
      ...info,
      clicks: list.length,
      prevClicks: prev,
      clicksPct: pctChange(list.length, prev),
      clickers: sessions.size,
      pages: [...pageCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([path, n]) => ({ path, label: pageLabel(path), clicks: n })),
      sources: [...srcCount.entries()].sort((a, b) => b[1] - a[1]).map(([key, count]) => ({ key, label: SOURCE_LABEL[key], count })),
      sales: info.affilae ? affilaeSalesFor(info.name, affilae) : null,
    }
  }).sort((a, b) => b.clicks - a.clicks || b.prevClicks - a.prevClicks || a.name.localeCompare(b.name))

  // ── Par page ──
  const byPath = new Map<string, ClickRow[]>()
  for (const c of clicks) byPath.set(c.path, [...(byPath.get(c.path) ?? []), c])
  const pageItems: PartnerPageItem[] = [...byPath.entries()].map(([path, list]) => {
    const clickers = new Set(list.map(c => c.session_id)).size
    const visitors = visitorsByPath.get(path) ?? 0
    const per = new Map<string, number>()
    for (const c of list) per.set(c.partner, (per.get(c.partner) ?? 0) + 1)
    const g = pages.get(path)
    return {
      path, label: pageLabel(path), kind: pageKind(path), clicks: list.length, clickers, visitors,
      ratePct: visitors ? pct(clickers, Math.max(visitors, clickers)) : null,
      partners: [...per.entries()].sort((a, b) => b[1] - a[1]).map(([slug, n]) => ({ name: partnerInfo(slug).name, clicks: n })),
      place: g && g.impressions > 0 ? placeOf(g.position) : null,
      impressions: g?.impressions ?? 0,
    }
  }).sort((a, b) => b.clicks - a.clicks || b.visitors - a.visitors)

  // ── Pages à améliorer : vues (Google ou visiteurs) mais peu de clics ──
  const candidates = new Set<string>([...visitorsByPath.keys(), ...pages.keys()].filter(p => PARTNER_PAGE_KINDS.includes(pageKind(p))))
  const opportunities: PartnerOpportunity[] = [...candidates].map(path => {
    const list = byPath.get(path) ?? []
    const clickers = new Set(list.map(c => c.session_id)).size
    const visitors = visitorsByPath.get(path) ?? 0
    const g = pages.get(path)
    return {
      path, label: pageLabel(path), kind: pageKind(path), visitors,
      impressions: g?.impressions ?? 0,
      place: g && g.impressions > 0 ? placeOf(g.position) : null,
      clicks: list.length,
      ratePct: visitors ? pct(clickers, Math.max(visitors, clickers)) : null,
    }
  })
    .filter(o => (o.visitors >= 5 || o.impressions >= 50) && (o.ratePct === null || o.ratePct < 5))
    .sort((a, b) => (b.visitors * 20 + b.impressions) - (a.visitors * 20 + a.impressions))
    .slice(0, 8)

  // ── Courbe des clics ──
  const granularity = granularityFor(period.days)
  const keys = bucketKeys(period.start, period.end, granularity)
  const prevKeys = bucketKeys(period.prevStart, period.prevEnd, granularity)
  const count = (rows: ClickRow[]) => {
    const m = new Map<string, number>()
    for (const c of rows) { const k = bucketOf(parisDay(c.created_at), granularity); m.set(k, (m.get(k) ?? 0) + 1) }
    return m
  }
  const cur = count(clicks)
  const prev = count(prevClicks)
  const series = keys.map((key, i) => ({ key, clicks: cur.get(key) ?? 0, prev: prevKeys[i] ? prev.get(prevKeys[i]) ?? 0 : null }))

  // ── D'où viennent ceux qui cliquent ──
  const clickerSessions = new Set(clicks.map(c => c.session_id))
  const src = new Map<SourceKind, number>()
  let known = 0
  for (const s of clickerSessions) {
    const v = first.get(s)
    if (v) { known++; const k = sourceOf(v).kind; src.set(k, (src.get(k) ?? 0) + 1) }
  }

  return {
    clicks: clicks.length,
    prevClicks: prevClicks.length,
    clicksPct: pctChange(clicks.length, prevClicks.length),
    clickers: clickerSessions.size,
    siteVisitors,
    clickRatePct: siteVisitors ? pct(clickerSessions.size, Math.max(siteVisitors, clickerSessions.size)) : null,
    granularity,
    series,
    partners,
    pages: pageItems.slice(0, 40),
    opportunities,
    sources: [...src.entries()].sort((a, b) => b[1] - a[1]).map(([key, n]) => ({ key, label: SOURCE_LABEL[key], count: n, pct: known ? Math.round((n / known) * 100) : 0 })),
    affilae,
  }
}

/** « 12,50 € » à partir de centimes */
export function euros(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}
