// Phase 9, Parcours d'apprentissage thématiques
// Combine plusieurs formations dans un ordre logique pour atteindre un objectif business.

export interface Parcours {
  slug: string
  emoji: string
  title: string
  description: string
  duration: string // estimation totale
  level: 'debutant' | 'intermediaire' | 'avance'
  formations: string[] // slugs dans l'ordre logique
  forWho: string
}

export const PARCOURS: Parcours[] = [
  {
    slug: 'demarrer-en-lcd-30-jours',
    emoji: '🚀',
    title: 'Démarrer en LCD en 30 jours',
    description: 'De zéro à ton premier voyageur : règles légales, annonce optimisée, tarification, automatisation des messages.',
    duration: '~10h',
    level: 'debutant',
    forWho: 'Tu lances ton activité ou ton premier bien LCD.',
    formations: [
      'fiscalite-reglementation-lcd-france-2026',
      'optimiser-annonce-airbnb',
      'mettre-le-bon-prix-lcd',
      'gerer-lcd-automatisation',
    ],
  },
  {
    slug: 'maximiser-tes-revenus',
    emoji: '💰',
    title: 'Maximiser tes revenus LCD',
    description: 'Augmente ton revenu par bien : pricing dynamique, canal direct sans commission, optimisation algorithme + avis 5★.',
    duration: '~12h',
    level: 'intermediaire',
    forWho: 'Tu loues déjà mais tu sens que tu laisses de l\'argent sur la table.',
    formations: [
      'tarification-dynamique',
      'annonce-directe',
      'optimiser-annonce-airbnb',
      'ecrire-avis-repondre-voyageurs',
    ],
  },
  {
    slug: 'devenir-conciergerie',
    emoji: '🏢',
    title: 'Devenir conciergerie en 60 jours',
    description: 'Création juridique (loi Hoguet, statuts), prospection des premiers mandats, automatisation pour scaler.',
    duration: '~14h',
    level: 'avance',
    forWho: 'Tu veux gérer des biens pour des propriétaires tiers.',
    formations: [
      'creer-conciergerie-lcd',
      'fiscalite-statut-conciergerie-tourisme',
      'optimiser-annonce-airbnb',
      'gerer-lcd-automatisation',
    ],
  },
  {
    slug: 'visibilite-directe',
    emoji: '📍',
    title: 'Booster ta visibilité hors plateformes',
    description: 'Construis ton canal direct : Google Business, réseaux sociaux, site web, avis Google, réduis ta dépendance Airbnb.',
    duration: '~9h',
    level: 'intermediaire',
    forWho: 'Tu veux moins dépendre d\'Airbnb et générer des résas directes.',
    formations: [
      'google-my-business-lcd',
      'reseaux-sociaux-lcd',
      'annonce-directe',
      'ecrire-avis-repondre-voyageurs',
    ],
  },
  {
    slug: 'securite-conformite',
    emoji: '🛡️',
    title: 'Sécurité, conformité & sérénité',
    description: 'Tout ce qu\'il faut savoir pour louer en règle : fiscalité 2026, réglementation, vérification voyageurs, gestion des conflits.',
    duration: '~7h',
    level: 'debutant',
    forWho: 'Tu veux dormir tranquille en sachant que tout est carré.',
    formations: [
      'fiscalite-reglementation-lcd-france-2026',
      'securiser-reservations-eviter-mauvais-voyageurs',
      'ecrire-avis-repondre-voyageurs',
    ],
  },
]

export function getParcoursBySlug(slug: string): Parcours | null {
  return PARCOURS.find(p => p.slug === slug) ?? null
}

export const PARCOURS_LEVEL_LABELS: Record<Parcours['level'], string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
}
