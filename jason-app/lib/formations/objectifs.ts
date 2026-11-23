// Objectifs du catalogue et couvertures des formations (refonte du 23/11/2026,
// docs/claude/formations.md). Une couleur de couverture par objectif, motifs
// en CSS seul (aucune image à charger), couleurs de la marque uniquement.

export type ObjectifKey = 'gagner' | 'visible' | 'accueillir' | 'proteger' | 'fiscalite' | 'conciergerie'

export const OBJECTIFS: Array<{ key: ObjectifKey; label: string }> = [
  { key: 'gagner', label: 'Gagner plus' },
  { key: 'visible', label: 'Être visible' },
  { key: 'accueillir', label: 'Bien accueillir' },
  { key: 'proteger', label: 'Me protéger' },
  { key: 'fiscalite', label: 'Fiscalité' },
  { key: 'conciergerie', label: 'Conciergerie' },
]

export const SLUG_OBJECTIF: Record<string, ObjectifKey> = {
  'mettre-le-bon-prix-lcd': 'gagner',
  'tarification-dynamique': 'gagner',
  'lcd-basse-saison': 'gagner',
  'annonce-directe': 'gagner',
  'google-my-business-lcd': 'visible',
  'reseaux-sociaux-lcd': 'visible',
  'optimiser-annonce-airbnb': 'visible',
  'ecrire-avis-repondre-voyageurs': 'visible',
  'maitriser-booking-com-algorithme-genius': 'visible',
  'photographie-lcd-smartphone': 'visible',
  'annonce-360': 'visible',
  'audit-annonce': 'visible',
  'gerer-lcd-automatisation': 'accueillir',
  'livret-accueil-digital': 'accueillir',
  'decorer-amenager-logement-lcd': 'accueillir',
  'securiser-reservations-eviter-mauvais-voyageurs': 'proteger',
  'gerer-incidents-litiges-lcd': 'proteger',
  'louer-en-direct-securise': 'proteger',
  'fiscalite-reglementation-lcd-france-2026': 'fiscalite',
  'fiscalite-statut-conciergerie-tourisme': 'fiscalite',
  'declarer-lmnp-seul-decla-fr': 'fiscalite',
  'creer-conciergerie-lcd': 'conciergerie',
}

export function objectifOf(slug: string): ObjectifKey {
  return SLUG_OBJECTIF[slug] ?? 'gagner'
}

export function objectifLabel(slug: string): string {
  const k = objectifOf(slug)
  return OBJECTIFS.find(o => o.key === k)?.label ?? ''
}

/**
 * Fond CSS de la couverture d'une formation (motif selon l'objectif).
 * Tailles en pixels (bords nets à toute largeur) : `scale` 1 pour la grande
 * couverture (environ 230 px de haut), 0.25 pour une vignette de 50 px.
 */
/** Rang d'une formation parmi celles du même objectif (ordre de SLUG_OBJECTIF) */
function variantOf(slug: string): number {
  const k = objectifOf(slug)
  const same = Object.keys(SLUG_OBJECTIF).filter(x => SLUG_OBJECTIF[x] === k)
  const i = same.indexOf(slug)
  if (i >= 0) return i
  let h = 0
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h % 8
}

// Variantes (23/11/2026, Jason : le catalogue doit avoir un effet « wow ») :
// les formations d'un même objectif gardent leur couleur et leur motif, mais
// le cercle change de place et de taille, et le fond alterne entre deux tons.
const POS: Array<[number, number]> = [[84, 28], [20, 30], [78, 76], [48, 22]]
const SIZE = [1, 0.78, 1.18, 0.9]
const SHADES: Record<ObjectifKey, [string, string]> = {
  gagner: ['#0E5A4A', '#0A4D40'],
  visible: ['#577534', '#4B6A2C'],
  accueillir: ['#2C7A5A', '#23694C'],
  proteger: ['#B4862A', '#A5781F'],
  fiscalite: ['#2F6B5A', '#275D4E'],
  conciergerie: ['#0B4A3E', '#0F5A4B'],
}

export function coverBackground(slug: string, scale = 1): string {
  const px = (n: number) => `${Math.round(n * scale)}px`
  const v = variantOf(slug)
  const [x, y] = POS[v % 4]
  const z = SIZE[v % 4]
  const ring = (n: number) => `${px(n * z)}, transparent ${px(n * z + 1)}`
  const k = objectifOf(slug)
  const bg = SHADES[k][Math.floor(v / 4) % 2]
  const ox = 100 - x, oy = 100 - y + 40
  switch (k) {
    case 'gagner':
      return `radial-gradient(circle at ${x}% ${y}%, #FFD56B 0 ${ring(78)}), radial-gradient(circle at ${ox}% ${oy}%, rgba(255,255,255,0.18) 0 ${ring(150)}), ${bg}`
    case 'visible':
      return `radial-gradient(circle at ${x}% ${Math.min(y + 14, 60)}%, rgba(255,213,107,0.75) 0 ${ring(56)}), linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.14) 60%), ${bg}`
    case 'accueillir':
      return `radial-gradient(circle at ${x}% ${y}%, rgba(255,213,107,0.55) 0 ${ring(40)}), repeating-linear-gradient(${v % 2 ? 45 : 135}deg, rgba(255,255,255,0.12) 0 ${px(14)}, transparent ${px(14)} ${px(28)}), ${bg}`
    case 'proteger':
      return `radial-gradient(circle at ${ox}% ${y}%, rgba(255,255,255,0.32) 0 ${ring(52)}), radial-gradient(circle at ${x}% ${oy}%, rgba(0,0,0,0.12) 0 ${ring(110)}), ${bg}`
    case 'fiscalite':
      return `repeating-radial-gradient(circle at ${x > 50 ? 100 : 0}% ${y > 50 ? 100 : 0}%, rgba(255,255,255,0.14) 0 ${px(12)}, transparent ${px(12)} ${px(26)}), ${bg}`
    case 'conciergerie':
      return `radial-gradient(circle at ${x}% ${y}%, #FFD56B 0 ${ring(34)}), repeating-linear-gradient(45deg, rgba(255,255,255,0.09) 0 ${px(18)}, transparent ${px(18)} ${px(36)}), ${bg}`
  }
}
