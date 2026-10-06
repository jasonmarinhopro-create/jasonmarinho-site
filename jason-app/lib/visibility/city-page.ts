// Page de ville d'un pro (06/10/2026, Jason : « mettre aussi les stats liées
// à la page photographe de la ville concernée du client sur son profil »).
// Les 60 pages /photographe-lcd-<ville> et /menage-lcd-<ville> du site
// statique (scripts/build-pages-pros-villes.mjs) : la fiche d'un pro de la
// ville y est présentée (scripts/build-photographers.mjs, build-cleaners.mjs).
// Pur et testé : city-page.test.ts (vérifie aussi la liste contre le site).

export const CITY_PAGE_SLUGS = [
  'aix-en-provence', 'ajaccio', 'angers', 'annecy', 'antibes', 'arcachon', 'avignon', 'bastia', 'bayonne', 'beaune',
  'biarritz', 'bordeaux', 'brest', 'caen', 'cannes', 'carcassonne', 'chambery', 'chamonix', 'clermont-ferrand', 'colmar',
  'deauville', 'dijon', 'dinard', 'epernay', 'etretat', 'grenoble', 'honfleur', 'la-baule', 'la-rochelle', 'le-mans',
  'le-touquet', 'lille', 'lyon', 'marseille', 'megeve', 'menton', 'metz', 'montpellier', 'nancy', 'nantes',
  'nice', 'nimes', 'paris', 'pau', 'perpignan', 'poitiers', 'quimper', 'reims', 'rennes', 'rouen',
  'saint-malo', 'saint-tropez', 'sarlat', 'sete', 'strasbourg', 'toulouse', 'tours', 'troyes', 'vannes', 'versailles',
] as const

/** « Saint-Malo », « Lyon 6e », « Clermont Ferrand » → saint-malo, lyon-6e, clermont-ferrand */
export function slugifyCity(ville: string): string {
  return ville
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\bst\b\.?/g, 'saint')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Page de ville correspondant à la ville saisie par le pro : nom exact, ou
 * nom suivi d'un arrondissement / d'une précision (« Lyon 6e », « Paris 15 »,
 * « Bordeaux et alentours »). La plus longue correspondance gagne
 * (« La Rochelle » avant « La »). Null si la ville n'a pas de page.
 */
export function citySlugOf(ville: string | null | undefined): string | null {
  if (!ville) return null
  const s = slugifyCity(ville)
  if (!s) return null
  const hits = CITY_PAGE_SLUGS.filter(c => s === c || s.startsWith(`${c}-`))
  if (!hits.length) return null
  return [...hits].sort((a, b) => b.length - a.length)[0]
}

export type CityMetier = 'photographe' | 'menage'

export function cityPagePath(metier: CityMetier, slug: string): string {
  return `/${metier === 'photographe' ? 'photographe' : 'menage'}-lcd-${slug}`
}

/** Nom d'affichage : saint-malo → Saint-Malo, la-rochelle → La Rochelle, aix-en-provence → Aix-en-Provence */
export function cityLabel(slug: string): string {
  const special: Record<string, string> = {
    'aix-en-provence': 'Aix-en-Provence', 'clermont-ferrand': 'Clermont-Ferrand', 'la-baule': 'La Baule', 'la-rochelle': 'La Rochelle',
    'le-mans': 'Le Mans', 'le-touquet': 'Le Touquet', 'saint-malo': 'Saint-Malo', 'saint-tropez': 'Saint-Tropez',
    chambery: 'Chambéry', epernay: 'Épernay', etretat: 'Étretat', megeve: 'Megève', nimes: 'Nîmes', sete: 'Sète',
  }
  return special[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1)
}

/** Chemin d'une adresse de référent interne (https://jasonmarinho.com/x?y → /x), sinon null */
export function internalReferrerPath(referrer: string | null | undefined): string | null {
  if (!referrer) return null
  try {
    const u = new URL(referrer)
    if (!/(^|\.)jasonmarinho\.com$/.test(u.hostname)) return null
    return u.pathname.replace(/\/+$/, '') || '/'
  } catch { return null }
}
