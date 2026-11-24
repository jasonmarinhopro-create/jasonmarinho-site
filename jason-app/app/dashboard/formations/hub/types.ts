// Données de l'espace Formations (calculées côté serveur, page.tsx).
import type { Signal } from '@/lib/formations/signals'

export type HubTab = 'aujourdhui' | 'parcours' | 'catalogue' | 'moi'
export const HUB_TABS: Array<{ key: HubTab; label: string; hint: string }> = [
  { key: 'aujourdhui', label: "Aujourd'hui", hint: 'Ta prochaine leçon' },
  { key: 'parcours', label: 'Parcours', hint: 'Un objectif, étape par étape' },
  { key: 'catalogue', label: 'Catalogue', hint: 'Toutes les formations' },
  { key: 'moi', label: 'Moi', hint: 'Progrès et attestations' },
]

export interface HubFormation {
  id: string
  slug: string
  title: string
  duration: string
  lessons: number
  progress: number          // 0 à 100, -1 = jamais ouverte
  locked: boolean           // formule Découverte, places épuisées
  isNew: boolean
  objectif: string          // libellé
  objectifKey: string       // clé (ObjectifKey)
  description: string       // promesse de la formation (content.ts)
  level: string
  cover: string             // fond CSS, vignette
  coverLg: string           // fond CSS, grande carte
  next: { id: number; title: string; duration: string; steps: number } | null
}

export interface HubResume {
  slug: string
  title: string
  lessonId: number
  lessonTitle: string
  moduleLabel: string
  steps: number
  duration: string
  moduleBars: { done: number; total: number }
  isStart: boolean          // aucune formation en cours : on propose de commencer
}

export interface HubParcours {
  slug: string
  title: string
  forWho: string
  duration: string
  icon: string
  formations: string[]
}

export interface HubAction { title: string; href: string | null; dueAt: string | null; doneAt: string | null; formationTitle: string }
export interface HubSaved { kind: 'lecon' | 'formation' | 'note'; label: string; sub: string; href: string }

export interface HubData {
  firstName: string
  plan: string
  formations: HubFormation[]
  resume: HubResume | null
  signal: Signal | null
  recommended: Array<{ slug: string; reason: string }>
  parcours: HubParcours[]
  weekDone: number
  weekGoal: number
  weekDays: boolean[]       // lundi à dimanche : au moins une leçon ce jour-là
  todayIndex: number        // 0 = lundi
  actions: HubAction[]
  stats: { lessons: number; actionsDone: number; goodPct: number | null; good: number; answered: number; minutes: number }
  /** Leçons faites par jour sur 12 semaines (84 cases, du lundi d'il y a 11 semaines à aujourd'hui) */
  activity: number[]
  /** Progression par objectif du catalogue (leçons faites / leçons) */
  byObjectif: Array<{ key: string; label: string; done: number; total: number }>
  saved: HubSaved[]
}
