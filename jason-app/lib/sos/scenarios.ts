// Définition des scénarios SOS Hôte (slug, titre, icône, canaux supportés).
// Fichier neutre (sans 'use client') pour pouvoir être importé indifféremment
// depuis un Server Component (page scénario) et un Client Component (SOSModal).
//
// Avant : SOS_SCENARIOS était exporté depuis SOSModal.tsx (use client), ce qui
// transformait le tableau en client reference côté serveur → `.find()` cassait.

import {
  House, Star, Confetti, DoorOpen, Scales, CalendarX,
} from '@phosphor-icons/react/dist/ssr'

export type Channel = 'airbnb' | 'booking' | 'vrbo' | 'direct'

export interface SOSScenario {
  slug: string
  title: string
  short: string
  icon: React.ElementType
  channels: Channel[]
  urgency: 'high' | 'medium'
}

export const SOS_SCENARIOS: SOSScenario[] = [
  {
    slug: 'degradation-logement',
    title: 'Mon voyageur a dégradé mon logement',
    short: 'Réagir vite, documenter, récupérer le coût',
    icon: House,
    channels: ['airbnb', 'booking', 'vrbo', 'direct'],
    urgency: 'high',
  },
  {
    slug: 'avis-injuste',
    title: 'J\'ai reçu un avis négatif injuste',
    short: 'Identifier le motif, signaler, répondre publiquement',
    icon: Star,
    channels: ['airbnb', 'booking', 'vrbo'],
    urgency: 'medium',
  },
  {
    slug: 'voyageur-fete-nuisance',
    title: 'Voyageur fait la fête / nuisance',
    short: 'Documenter, contacter, signaler, escalader',
    icon: Confetti,
    channels: ['airbnb', 'booking', 'vrbo', 'direct'],
    urgency: 'high',
  },
  {
    slug: 'voyageur-refuse-partir',
    title: 'Mon voyageur refuse de partir',
    short: 'Occupation sans droit, réagir le jour même',
    icon: DoorOpen,
    channels: ['airbnb', 'booking', 'vrbo', 'direct'],
    urgency: 'high',
  },
  {
    slug: 'litige-plateforme',
    title: 'Litige avec Airbnb / Booking',
    short: 'Paiement, blocage, annulation, épuiser les recours',
    icon: Scales,
    channels: ['airbnb', 'booking', 'vrbo'],
    urgency: 'medium',
  },
  {
    slug: 'annulation-last-minute',
    title: 'Voyageur annule à la dernière minute',
    short: 'Compenser la perte, relouer vite, ajuster les pénalités',
    icon: CalendarX,
    channels: ['airbnb', 'booking', 'vrbo', 'direct'],
    urgency: 'medium',
  },
]
