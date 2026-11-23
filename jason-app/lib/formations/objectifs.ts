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
export function coverBackground(slug: string, scale = 1): string {
  const px = (n: number) => `${Math.round(n * scale)}px`
  const ring = (n: number) => `${px(n)}, transparent ${px(n + 1)}`
  switch (objectifOf(slug)) {
    case 'gagner':
      return `radial-gradient(circle at 84% 28%, #FFD56B 0 ${ring(78)}), radial-gradient(circle at 6% 120%, rgba(255,255,255,0.18) 0 ${ring(150)}), #0E5A4A`
    case 'visible':
      return `radial-gradient(circle at 80% 42%, rgba(255,213,107,0.75) 0 ${ring(56)}), linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.14) 60%), #577534`
    case 'accueillir':
      return `radial-gradient(circle at 88% 20%, rgba(255,213,107,0.55) 0 ${ring(40)}), repeating-linear-gradient(135deg, rgba(255,255,255,0.12) 0 ${px(14)}, transparent ${px(14)} ${px(28)}), #2C7A5A`
    case 'proteger':
      return `radial-gradient(circle at 26% 34%, rgba(255,255,255,0.32) 0 ${ring(52)}), radial-gradient(circle at 78% 80%, rgba(0,0,0,0.12) 0 ${ring(110)}), #B4862A`
    case 'fiscalite':
      return `repeating-radial-gradient(circle at 100% 100%, rgba(255,255,255,0.14) 0 ${px(12)}, transparent ${px(12)} ${px(26)}), #2F6B5A`
    case 'conciergerie':
      return `radial-gradient(circle at 16% 26%, #FFD56B 0 ${ring(34)}), repeating-linear-gradient(45deg, rgba(255,255,255,0.09) 0 ${px(18)}, transparent ${px(18)} ${px(36)}), #0B4A3E`
  }
}
