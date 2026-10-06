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
  'les-sables-d-olonne',
] as const

/**
 * Autres façons d'écrire une ville qui a sa page : nom court, anciennes
 * communes fusionnées, département qui n'a qu'une page (06/10/2026 : un
 * photographe client avait saisi « Vendée » et « Les Sables-d'Olonne »).
 * Même liste dans scripts/lib/inject-ville-pros.mjs.
 */
export const CITY_ALIASES: Record<string, string> = {
  'sables-d-olonne': 'les-sables-d-olonne',
  'olonne-sur-mer': 'les-sables-d-olonne',
  'chateau-d-olonne': 'les-sables-d-olonne',
  vendee: 'les-sables-d-olonne',
}

/** « Saint-Malo », « Lyon 6e », « Clermont Ferrand » → saint-malo, lyon-6e, clermont-ferrand */
export function slugifyCity(ville: string): string {
  return ville
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\bst\b\.?/g, 'saint')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Correspondance la plus longue : ville seule ou suivie d'une précision, puis ville citée dans le texte */
function bestMatch(s: string, names: readonly string[]): string | null {
  const longest = (xs: string[]) => xs.sort((a, b) => b.length - a.length)[0] ?? null
  return longest(names.filter(c => s === c || s.startsWith(`${c}-`)))
    ?? longest(names.filter(c => s.includes(`-${c}-`) || s.endsWith(`-${c}`)))
}

function slugOfText(text: string | null | undefined): string | null {
  if (!text) return null
  const s = slugifyCity(text)
  if (!s) return null
  const direct = bestMatch(s, CITY_PAGE_SLUGS)
  if (direct) return direct
  const alias = bestMatch(s, Object.keys(CITY_ALIASES))
  return alias ? CITY_ALIASES[alias] : null
}

/**
 * Page de ville correspondant à la ville saisie par le pro : nom exact, nom
 * suivi d'une précision (« Lyon 6e », « Paris 15 »), nom cité dans le texte
 * (« 75015 Paris », « Vendée, Les Sables-d'Olonne ») ou autre nom connu
 * (CITY_ALIASES). La plus longue correspondance gagne (« La Rochelle »
 * avant « La »). Sans résultat, la zone couverte de la fiche est essayée.
 * Null si aucune page ne correspond.
 */
export function citySlugOf(ville: string | null | undefined, zone?: string | null): string | null {
  return slugOfText(ville) ?? slugOfText(zone)
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
    'les-sables-d-olonne': "Les Sables-d'Olonne",
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
