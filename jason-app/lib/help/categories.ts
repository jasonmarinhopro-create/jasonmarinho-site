// Catégories du Help Center.
// Organisées par TÂCHE utilisateur, pas par section du dashboard.
// Articles : content/help/<slug>/*.md (réécrits en sept. 2026, faits vérifiés dans le code).

import {
  Rocket, House, FileText, ChartLineUp, Broom, Megaphone, UserCircle,
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

// Couleurs : vert de la marque pour toutes les catégories (pas de bleu ni de
// violet sur les pages hôte) ; l'icône suffit à les distinguer.
const ACCENT = { color: 'var(--accent-text)', bg: 'var(--accent-bg)' }

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    slug: 'demarrer', emoji: '🚀', Icon: Rocket,
    title: 'Démarrer',
    description: 'À quoi sert l\'app, la checklist de démarrage, le menu, les formules',
    ...ACCENT,
  },
  {
    slug: 'logements-voyageurs', emoji: '🏠', Icon: House,
    title: 'Logements, voyageurs & calendrier',
    description: 'Fiche logement, synchro Airbnb et Booking, séjours, agenda',
    ...ACCENT,
  },
  {
    slug: 'contrats-paiements', emoji: '📄', Icon: FileText,
    title: 'Contrats & paiements',
    description: 'Contrat signé en ligne, Stripe, loyer, caution, facture',
    ...ACCENT,
  },
  {
    slug: 'menage-declarations', emoji: '🧹', Icon: Broom,
    title: 'Ménage & déclarations',
    description: 'Planning ménage partagé avec ton équipe, fiche de police, SIBA',
    ...ACCENT,
  },
  {
    slug: 'revenus-performances', emoji: '💰', Icon: ChartLineUp,
    title: 'Mes finances',
    description: 'Revenus, charges, performances, simulateurs fiscaux',
    ...ACCENT,
  },
  {
    slug: 'outils', emoji: '📣', Icon: Megaphone,
    title: 'Voyageurs en direct & outils',
    description: 'Groupes Facebook, fiche Google, sécurité voyageur, modèles de messages',
    ...ACCENT,
  },
  {
    slug: 'communaute-compte', emoji: '👤', Icon: UserCircle,
    title: 'Compte & abonnement',
    description: 'Mon compte, abonnement et factures, Questions & réponses',
    ...ACCENT,
  },
]

export function getCategory(slug: string): HelpCategory | undefined {
  return HELP_CATEGORIES.find(c => c.slug === slug)
}
