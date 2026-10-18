// Règles de la liste de suggestions (SuggestInput), pures et testées.
// Même logique que suggestions.js du site.

export const norm = (s: string) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
/** Clé d'une ville (« Les Sables-d'Olonne » → « les-sables-d-olonne ») */
export const cityKey = (s: string) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const POPULAR_CITIES = ['paris', 'lyon', 'bordeaux', 'nice', 'annecy', 'biarritz', 'marseille', 'saint-malo']

export interface SuggestResult {
  items: string[]
  heading: string
  /** Texte libre proposé (« Utiliser « … » »), null sinon */
  free: string | null
}

export function suggestList(options: string[], q: string, opts: { city?: boolean; strict?: boolean; max?: number } = {}): SuggestResult {
  const city = !!opts.city
  const nq = norm(q.trim())
  const uniq = [...new Set(options.filter(Boolean))]
  let list: string[]
  if (!nq) {
    list = city ? POPULAR_CITIES.map(k => uniq.find(o => cityKey(o) === k)).filter((x): x is string => !!x) : uniq
    if (!list.length) list = uniq
  } else {
    list = uniq.filter(o => norm(o).includes(nq))
    list.sort((a, b) => (norm(a).startsWith(nq) ? 0 : 1) - (norm(b).startsWith(nq) ? 0 : 1) || a.localeCompare(b, 'fr'))
  }
  const exact = uniq.some(o => norm(o) === nq)
  return {
    items: list.slice(0, opts.max ?? 8),
    heading: !nq ? (city ? 'Les plus demandées' : list.length ? 'Suggestions' : '') : list.length ? (city ? 'Villes avec une page sur le site' : 'Suggestions') : city ? 'Pas encore de page pour cette ville' : '',
    free: nq && !exact && !opts.strict ? q.trim() : null,
  }
}

/** Découpe une suggestion autour du texte tapé : [avant, tapé, après] */
export function matchParts(v: string, q: string): [string, string, string] {
  const nq = norm(q.trim())
  const k = nq ? norm(v).indexOf(nq) : -1
  return k >= 0 ? [v.slice(0, k), v.slice(k, k + nq.length), v.slice(k + nq.length)] : [v, '', '']
}

import { CITY_PAGE_SLUGS, INTL_CITY_PAGES, cityLabel } from '@/lib/visibility/city-page'
/** Villes qui ont leurs pages sur le site (champs « ville » des pros) */
export const CITY_OPTIONS: string[] = [...CITY_PAGE_SLUGS.map(s => cityLabel(s)), ...Object.values(INTL_CITY_PAGES).map(v => v.label)].sort((a, b) => a.localeCompare(b, 'fr'))
