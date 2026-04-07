import { GMB_FORMATION } from '@/app/dashboard/formations/google-my-business-lcd/content'
import { ANNONCE_DIRECTE_FORMATION } from '@/app/dashboard/formations/annonce-directe/content'
import { TARIFICATION_DYNAMIQUE_FORMATION } from '@/app/dashboard/formations/tarification-dynamique/content'
import { SECURISER_RESERVATIONS_FORMATION } from '@/app/dashboard/formations/securiser-reservations-eviter-mauvais-voyageurs/content'
import { RESEAUX_SOCIAUX_FORMATION } from '@/app/dashboard/formations/reseaux-sociaux-lcd/content'
import { OPTIMISER_ANNONCE_FORMATION } from '@/app/dashboard/formations/optimiser-annonce-airbnb/content'
import { METTRE_BON_PRIX_FORMATION } from '@/app/dashboard/formations/mettre-le-bon-prix-lcd/content'
import { LIVRET_ACCUEIL_FORMATION } from '@/app/dashboard/formations/livret-accueil-digital/content'
import { LCD_BASSE_SAISON_FORMATION } from '@/app/dashboard/formations/lcd-basse-saison/content'
import { GERER_LCD_FORMATION } from '@/app/dashboard/formations/gerer-lcd-automatisation/content'
import { FISCALITE_LCD_FORMATION } from '@/app/dashboard/formations/fiscalite-reglementation-lcd-france-2026/content'
import { ECRIRE_AVIS_FORMATION } from '@/app/dashboard/formations/ecrire-avis-repondre-voyageurs/content'
import { DECORER_AMENAGER_FORMATION } from '@/app/dashboard/formations/decorer-amenager-logement-lcd/content'
import { CREER_CONCIERGERIE_FORMATION } from '@/app/dashboard/formations/creer-conciergerie-lcd/content'

export interface StaticFormation {
  slug?: string
  title: string
  description: string
  duration: string
  level: string
  objectifs: string[]
  modules: {
    id: number
    title: string
    duration: string
    lessons: {
      id: number
      title: string
      duration: string
      content: string
    }[]
  }[]
}

export const FORMATION_CONTENT_MAP: Record<string, StaticFormation> = {
  'google-my-business-lcd': GMB_FORMATION,
  'annonce-directe': ANNONCE_DIRECTE_FORMATION,
  'tarification-dynamique': TARIFICATION_DYNAMIQUE_FORMATION,
  'securiser-reservations-eviter-mauvais-voyageurs': SECURISER_RESERVATIONS_FORMATION,
  'reseaux-sociaux-lcd': RESEAUX_SOCIAUX_FORMATION,
  'optimiser-annonce-airbnb': OPTIMISER_ANNONCE_FORMATION,
  'mettre-le-bon-prix-lcd': METTRE_BON_PRIX_FORMATION,
  'livret-accueil-digital': LIVRET_ACCUEIL_FORMATION,
  'lcd-basse-saison': LCD_BASSE_SAISON_FORMATION,
  'gerer-lcd-automatisation': GERER_LCD_FORMATION,
  'fiscalite-reglementation-lcd-france-2026': FISCALITE_LCD_FORMATION,
  'ecrire-avis-repondre-voyageurs': ECRIRE_AVIS_FORMATION,
  'decorer-amenager-logement-lcd': DECORER_AMENAGER_FORMATION,
  'creer-conciergerie-lcd': CREER_CONCIERGERIE_FORMATION,
}
