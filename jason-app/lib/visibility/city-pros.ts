// Onglet « Pages pros par ville » de Visibilité (06/10/2026, Jason : « une
// partie sur les pages photographe + ville et équipe de ménage + ville ») :
// les 60 pages /photographe-lcd-<ville> et les 60 /menage-lcd-<ville>, avec
// Google, nos visites, les pros de la ville (présentés sur la page) et les
// fiches ouvertes depuis la page. Pur et testé : city-pros.test.ts.
import { CITY_PAGE_SLUGS, cityLabel, cityPagePath, citySlugOf, internalReferrerPath, type CityMetier } from './city-page'
import type { QueryLite } from './admin-rules'
import { isFirstPage } from './rules'

export interface CityPageTruth {
  clicks: number
  impressions: number
  /** Place arrondie de la page (null si jamais montrée) */
  pagePlace: number | null
  prevPagePlace: number | null
  queries: QueryLite[]
}

export interface CityProRow {
  name: string
  ville: string | null
  /** Zone couverte, essayée si la ville n'a pas de page */
  zone?: string | null
  slug: string | null
  online: boolean
  /** Refusée ou annulée : ignorée */
  excluded: boolean
}

export interface CityProPage {
  slug: string
  label: string
  path: string
  clicks: number
  impressions: number
  pagePlace: number | null
  /** Places gagnées depuis la période d'avant (positif = mieux) */
  delta: number | null
  main: QueryLite | null
  queries: QueryLite[]
  visitors: number
  prevVisitors: number
  /** Visiteurs qui ont ouvert une fiche de l'annuaire depuis la page */
  toFiches: number
  pros: Array<{ name: string; slug: string | null; online: boolean }>
}

export interface CityProsSide {
  items: CityProPage[]
  clicks: number
  impressions: number
  visitors: number
  toFiches: number
  /** Pages dont la recherche principale est en première page */
  firstPage: number
  /** Pages vues sur Google, sans aucun pro en ligne : villes où recruter */
  toRecruit: number
  withPro: number
}

export type PagesProsData = Record<CityMetier, CityProsSide>

interface VisitLite { session_id: string; path: string; referrer: string | null }

const FICHE_PREFIX: Record<CityMetier, string> = { photographe: '/annuaires/photographes/', menage: '/annuaires/menage/' }

export function buildCityPros(input: {
  pages: Map<string, CityPageTruth>
  visits: VisitLite[]
  prevVisits: VisitLite[]
  pros: Record<CityMetier, CityProRow[]>
}): PagesProsData {
  const sessions = (rows: VisitLite[], path: string) => new Set(rows.filter(r => r.path === path).map(r => r.session_id)).size
  const side = (metier: CityMetier): CityProsSide => {
    const prosBySlug = new Map<string, CityProRow[]>()
    for (const p of input.pros[metier]) {
      if (p.excluded) continue
      const slug = citySlugOf(p.ville, p.zone)
      if (!slug) continue
      prosBySlug.set(slug, [...(prosBySlug.get(slug) ?? []), p])
    }
    const items = CITY_PAGE_SLUGS.map((slug): CityProPage => {
      const path = cityPagePath(metier, slug)
      const t = input.pages.get(path)
      const fromPage = input.visits.filter(v => v.path.startsWith(FICHE_PREFIX[metier]) && internalReferrerPath(v.referrer) === path)
      return {
        slug,
        label: cityLabel(slug),
        path,
        clicks: t?.clicks ?? 0,
        impressions: t?.impressions ?? 0,
        pagePlace: t?.pagePlace ?? null,
        delta: t && t.pagePlace !== null && t.prevPagePlace !== null ? t.prevPagePlace - t.pagePlace : null,
        main: t?.queries[0] ?? null,
        queries: t?.queries ?? [],
        visitors: sessions(input.visits, path),
        prevVisitors: sessions(input.prevVisits, path),
        toFiches: new Set(fromPage.map(v => v.session_id)).size,
        pros: (prosBySlug.get(slug) ?? []).map(p => ({ name: p.name, slug: p.slug, online: p.online })),
      }
    })
    const online = (c: CityProPage) => c.pros.some(p => p.online)
    return {
      items,
      clicks: items.reduce((n, c) => n + c.clicks, 0),
      impressions: items.reduce((n, c) => n + c.impressions, 0),
      visitors: items.reduce((n, c) => n + c.visitors, 0),
      toFiches: items.reduce((n, c) => n + c.toFiches, 0),
      firstPage: items.filter(c => c.main && isFirstPage(c.main.place)).length,
      toRecruit: items.filter(c => c.impressions > 0 && !online(c)).length,
      withPro: items.filter(online).length,
    }
  }
  return { photographe: side('photographe'), menage: side('menage') }
}
