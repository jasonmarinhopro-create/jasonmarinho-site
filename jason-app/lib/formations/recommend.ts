// « Pour toi » sur la page Formations (sept. 2026) : 3 formations choisies
// d'après la situation réelle de l'hôte, avec la raison affichée. Règles
// simples et explicables plutôt qu'un score opaque.

export interface RecommendInput {
  /** Pays des logements (FR, PT…). */
  countries: string[]
  logementsCount: number
  /** L'hôte a déjà au moins un contrat de réservation directe. */
  hasContracts: boolean
  /** Mois courant, 1 à 12. */
  month: number
  /** Formations déjà commencées ou terminées (exclues). */
  startedSlugs: Set<string>
  /** Formations proposables (publiées et accessibles). */
  availableSlugs: Set<string>
}

export interface Recommendation { slug: string; reason: string }

export function recommendFormations(input: RecommendInput, max = 3): Recommendation[] {
  const out: Recommendation[] = []
  const add = (slug: string, reason: string) => {
    if (out.length >= max) return
    if (!input.availableSlugs.has(slug) || input.startedSlugs.has(slug)) return
    if (out.some(r => r.slug === slug)) return
    out.push({ slug, reason })
  }

  if (input.logementsCount === 0) {
    add('optimiser-annonce-airbnb', 'Pour bien démarrer ta première annonce')
    add('photographie-lcd-smartphone', 'Des photos qui donnent envie de réserver')
    add('mettre-le-bon-prix-lcd', 'Fixer un prix juste dès le départ')
  }
  if (input.countries.includes('FR')) {
    add('fiscalite-reglementation-lcd-france-2026', 'Ton logement est en France : règles et fiscalité 2026')
    if (input.month >= 3 && input.month <= 6) add('declarer-lmnp-seul-decla-fr', 'Période de déclaration des revenus')
  }
  if (!input.hasContracts) {
    add('annonce-directe', 'Tu n’as pas encore de réservation directe')
    add('google-my-business-lcd', 'Être trouvé sur Google sans commission')
  }
  if (input.month >= 10 || input.month <= 3) add('lcd-basse-saison', 'Basse saison : remplir d’octobre à mars')
  add('mettre-le-bon-prix-lcd', 'Le levier de revenu le plus rapide')
  add('optimiser-annonce-airbnb', 'Plus de clics sur ton annonce')
  add('ecrire-avis-repondre-voyageurs', 'Des avis qui rassurent les prochains voyageurs')
  return out
}
