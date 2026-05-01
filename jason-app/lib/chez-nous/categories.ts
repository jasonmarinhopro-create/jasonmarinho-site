export type CategoryId = 'bienvenue' | 'reglementation' | 'voyageurs' | 'optimisation' | 'entraide' | 'cas' | 'autres'

export type Category = {
  id: CategoryId
  label: string
  short: string
  emoji: string
  color: string
  bg: string
  description: string
}

export const CATEGORIES: Record<CategoryId, Category> = {
  bienvenue: {
    id: 'bienvenue', label: 'Bienvenue', short: 'Bienvenue', emoji: '👋',
    color: '#34d399', bg: 'rgba(52,211,153,0.14)',
    description: 'Présente-toi en 2 lignes, qui tu es, où, depuis combien de temps',
  },
  reglementation: {
    id: 'reglementation', label: 'Réglementation & Fiscal', short: 'Régl. & Fiscal', emoji: '⚖️',
    color: '#fb923c', bg: 'rgba(251,146,60,0.14)',
    description: 'Lois, mairie, taxe séjour, micro-BIC, déclarations',
  },
  voyageurs: {
    id: 'voyageurs', label: 'Voyageurs', short: 'Voyageurs', emoji: '🧳',
    color: '#f472b6', bg: 'rgba(244,114,182,0.14)',
    description: 'Gestion, sécurité, litiges, check-in/out, cautions',
  },
  optimisation: {
    id: 'optimisation', label: 'Annonces & Optimisation', short: 'Annonces', emoji: '📈',
    color: '#60a5fa', bg: 'rgba(96,165,250,0.14)',
    description: 'Airbnb, Booking, photos, prix, taux d\'occupation',
  },
  entraide: {
    id: 'entraide', label: 'Entraide locale', short: 'Entraide', emoji: '🤝',
    color: '#34d399', bg: 'rgba(52,211,153,0.14)',
    description: 'Plombier, ménage, dépannage, contacts par ville',
  },
  cas: {
    id: 'cas', label: 'Études de cas & Retours', short: 'Cas', emoji: '📊',
    color: '#a78bfa', bg: 'rgba(167,139,250,0.14)',
    description: 'Ce qui marche (ou pas), chiffres, expériences',
  },
  autres: {
    id: 'autres', label: 'Autres', short: 'Autres', emoji: '💬',
    color: '#94a3b8', bg: 'rgba(148,163,184,0.14)',
    description: 'Tout ce qui ne rentre pas ailleurs',
  },
}

export const CATEGORY_ORDER: CategoryId[] = ['bienvenue', 'reglementation', 'voyageurs', 'optimisation', 'entraide', 'cas', 'autres']

export function isValidCategory(c: string): c is CategoryId {
  return c in CATEGORIES
}
