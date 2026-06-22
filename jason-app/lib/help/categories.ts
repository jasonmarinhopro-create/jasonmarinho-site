// Catégories du Help Center.
// Organisées par TÂCHE utilisateur, pas par section du dashboard.
// Chaque catégorie contient des articles (créés en Phase 3).

import {
  Rocket, House, FileText, ChartLineUp, Toolbox, UsersThree,
} from '@phosphor-icons/react/dist/ssr'

type PhosphorIcon = typeof Rocket

export interface HelpCategory {
  slug: string
  emoji: string
  Icon: PhosphorIcon
  title: string
  description: string
  color: string
  bg: string
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    slug: 'demarrer',
    emoji: '🚀',
    Icon: Rocket,
    title: 'Démarrer',
    description: 'Premiers pas, configurer ton espace, créer ton premier contrat',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.10)',
  },
  {
    slug: 'logements-voyageurs',
    emoji: '🏠',
    Icon: House,
    title: 'Logements & voyageurs',
    description: 'Gérer tes biens, tes voyageurs, tes séjours et ton calendrier',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.10)',
  },
  {
    slug: 'contrats-paiements',
    emoji: '📄',
    Icon: FileText,
    title: 'Contrats & paiements',
    description: 'Contrats signés électroniquement, Stripe, caution, encaissements',
    color: '#FFD56B',
    bg: 'rgba(255,213,107,0.10)',
  },
  {
    slug: 'revenus-performances',
    emoji: '💰',
    Icon: ChartLineUp,
    title: 'Revenus & performances',
    description: 'Suivi financier, KPI, simulateurs fiscaux, exports comptables',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.10)',
  },
  {
    slug: 'outils',
    emoji: '🛠️',
    Icon: Toolbox,
    title: 'Outils',
    description: 'Gabarits messages, audit GBP, sécurité voyageur, formations',
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.10)',
  },
  {
    slug: 'communaute-compte',
    emoji: '👥',
    Icon: UsersThree,
    title: 'Communauté & compte',
    description: 'Entre Hôtes, groupes FB, abonnement, profil, RGPD',
    color: '#f472b6',
    bg: 'rgba(244,114,182,0.10)',
  },
]

export function getCategory(slug: string): HelpCategory | undefined {
  return HELP_CATEGORIES.find(c => c.slug === slug)
}
