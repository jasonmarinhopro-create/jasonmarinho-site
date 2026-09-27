// Extrait de CalendrierView.tsx (découpage sept. 2026, code inchangé).
// Constantes, types et fonctions utilitaires du Calendrier.
import { Check } from '@phosphor-icons/react/dist/ssr'

// ── Mapping checklist key → catégorie de gabarit pertinente
export const CHECKLIST_TO_GABARIT: Record<string, { cat: string; label: string }> = {
  contrat_signe:         { cat: 'confirmation', label: 'Relance contrat' },
  solde_recu:            { cat: 'confirmation', label: 'Relance paiement' },
  instructions_envoyees: { cat: 'checkin',      label: "Instructions d'arrivée" },
  avis_demande:          { cat: 'avis',         label: "Demande d'avis" },
}

export interface CalEvent {
  id: string
  title: string
  date: string
  end_date: string | null
  start_time: string | null
  end_time: string | null
  description: string | null
  category: string
}

export const CAT: Record<string, { label: string; color: string; bg: string; border: string }> = {
  arrivee:   { label: 'Arrivée',     color: 'var(--success-1)', bg: 'rgba(16,185,129,0.13)',  border: 'rgba(16,185,129,0.30)' },
  depart:    { label: 'Départ',      color: 'var(--info)', bg: 'rgba(96,165,250,0.13)',  border: 'rgba(96,165,250,0.30)' },
  sejour:    { label: 'Séjour',      color: '#F472B6', bg: 'rgba(244,114,182,0.13)', border: 'rgba(244,114,182,0.30)' },
  menage:    { label: 'Ménage',      color: '#5DC077', bg: 'rgba(93,192,119,0.13)',  border: 'rgba(93,192,119,0.30)' },
  rdv:       { label: 'RDV',         color: 'var(--accent-text)', bg: 'var(--accent-bg-2)', border: 'var(--accent-border)' },
  tache:     { label: 'Tâche',       color: '#a78bfa', bg: 'rgba(167,139,250,0.13)', border: 'rgba(167,139,250,0.30)' },
  note:      { label: 'Note',        color: '#94a3b8', bg: 'rgba(148,163,184,0.13)', border: 'rgba(148,163,184,0.30)' },
  // Legacy aliases (display only, not shown in pickers)
  entretien: { label: 'Ménage',      color: '#5DC077', bg: 'rgba(93,192,119,0.13)',  border: 'rgba(93,192,119,0.30)' },
  admin:     { label: 'Tâche',       color: '#a78bfa', bg: 'rgba(167,139,250,0.13)', border: 'rgba(167,139,250,0.30)' },
}

export type CatKey = 'arrivee' | 'depart' | 'sejour' | 'menage' | 'rdv' | 'tache' | 'note'
export const PICKER_CATS: CatKey[] = ['sejour', 'menage', 'rdv', 'tache']

export function catToDisplay(c: string): CatKey {
  if (c === 'entretien') return 'menage'
  if (c === 'admin')     return 'tache'
  return (c as CatKey) || 'menage'
}

export const CHECKLIST_ITEMS: Array<{ key: string; label: string; phase: 'avant' | 'pendant' | 'apres' }> = [
  { key: 'contrat_envoye',        label: 'Contrat envoyé',                 phase: 'avant' },
  { key: 'contrat_signe',         label: 'Contrat signé',                  phase: 'avant' },
  { key: 'acompte_recu',          label: 'Acompte reçu',                   phase: 'avant' },
  { key: 'solde_recu',            label: 'Solde reçu',                     phase: 'avant' },
  { key: 'caution_recue',         label: 'Caution reçue',                  phase: 'avant' },
  { key: 'identite_verifiee',     label: "Pièce d'identité vérifiée",      phase: 'avant' },
  { key: 'instructions_envoyees', label: "Instructions d'arrivée envoyées", phase: 'avant' },
  { key: 'menage_planifie',       label: 'Ménage planifié',                phase: 'avant' },
  { key: 'checkin_effectue',      label: 'Check-in effectué',              phase: 'pendant' },
  { key: 'checkout_effectue',     label: 'Check-out effectué',             phase: 'apres' },
  { key: 'etat_des_lieux',        label: 'État des lieux de sortie',       phase: 'apres' },
  { key: 'caution_restituee',     label: 'Caution restituée',              phase: 'apres' },
  { key: 'avis_demande',          label: 'Avis demandé',                   phase: 'apres' },
]

export const DAYS_FR   = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
export const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export function pad2(n: number) { return String(n).padStart(2, '0') }
export function toStr(y: number, m: number, d: number) { return `${y}-${pad2(m + 1)}-${pad2(d)}` }

// Sur Airbnb, "Not available" couvre 2 cas : vraie réservation (la description contient
// "Reservation URL") OU date manuellement bloquée par l'hôte (description vide).
// Idem pour Booking.com : "CLOSED - Not available" peut être un blocage manuel.
// On ne compte pas les blocages dans le taux d'occupation.
export function todayString() {
  const t = new Date()
  return toStr(t.getFullYear(), t.getMonth(), t.getDate())
}

// True si l'event iCal est une VRAIE réservation (pas un blocage automatique
// du jour J par Airbnb / Booking pour empêcher les réservations same-day).
// Airbnb génère chaque matin une dispo "Not available" pour aujourd'hui →
// sinon le badge "Prochain" affichait "Airbnb (Not available) aujourd'hui"
// 365 jours par an, bruit pur.
export function isRealReservation(e: { title: string; description: string | null }): boolean {
  const desc = (e.description ?? '').toLowerCase()
  // Réservation Airbnb : description contient l'URL de la résa
  if (desc.includes('reservation url') || desc.includes('phone last 4')) return true
  // Réservation Booking : description contient le numéro de résa
  if (desc.includes('cn=')) return true
  const title = (e.title ?? '').toLowerCase()
  // Patterns de blocage SANS résa associée (matching permissif : Airbnb prépend
  // parfois la source, ex. "Airbnb (Not available)", "Airbnb - Not available", etc.)
  if (
    title.includes('not available') ||
    title.includes('unavailable') ||
    title.includes('closed') ||
    title.includes('blocked')
  ) return false
  // Par défaut : on considère l'event comme une vraie résa (titres custom voyageur)
  return true
}

// Parser "saisie rapide" : « Ménage Villa demain 10h » → { category, title, date, start_time }
export function parseQuickAdd(input: string, defaultDate: string): {
  category: CatKey
  title: string
  date: string
  start_time: string | null
} | null {
  const raw = input.trim()
  if (!raw) return null

  let category: CatKey = 'tache'
  let cleaned = raw

  const catPatterns: Array<{ regex: RegExp; cat: CatKey }> = [
    { regex: /\bm[ée]nages?\b/i,                  cat: 'menage' },
    { regex: /\b(rdv|rendez[\s-]?vous|appel|meeting)\b/i, cat: 'rdv' },
    { regex: /\b(t[âa]che|todo)\b/i,              cat: 'tache' },
    { regex: /\bnote\b/i,                         cat: 'note' as CatKey },
  ]
  for (const p of catPatterns) {
    if (p.regex.test(cleaned)) {
      category = p.cat
      cleaned = cleaned.replace(p.regex, ' ')
      break
    }
  }

  // Date
  let date = defaultDate
  const today = new Date()
  const dayMs = 86400000

  if (/\baujourd'?hui\b/i.test(cleaned)) {
    cleaned = cleaned.replace(/\baujourd'?hui\b/i, ' ')
  } else if (/\bapr[èe]s[-\s]demain\b/i.test(cleaned)) {
    const t = new Date(today.getTime() + 2 * dayMs)
    date = toStr(t.getFullYear(), t.getMonth(), t.getDate())
    cleaned = cleaned.replace(/\bapr[èe]s[-\s]demain\b/i, ' ')
  } else if (/\bdemain\b/i.test(cleaned)) {
    const t = new Date(today.getTime() + dayMs)
    date = toStr(t.getFullYear(), t.getMonth(), t.getDate())
    cleaned = cleaned.replace(/\bdemain\b/i, ' ')
  }

  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  for (let i = 0; i < days.length; i++) {
    const re = new RegExp(`\\b${days[i]}\\b`, 'i')
    if (re.test(cleaned)) {
      const cur = today.getDay()
      let diffD = i - cur
      if (diffD <= 0) diffD += 7
      const t = new Date(today.getTime() + diffD * dayMs)
      date = toStr(t.getFullYear(), t.getMonth(), t.getDate())
      cleaned = cleaned.replace(re, ' ')
      break
    }
  }

  const plusMatch = cleaned.match(/\+(\d+)\s*j\b/i)
  if (plusMatch) {
    const n = parseInt(plusMatch[1], 10)
    const t = new Date(today.getTime() + n * dayMs)
    date = toStr(t.getFullYear(), t.getMonth(), t.getDate())
    cleaned = cleaned.replace(plusMatch[0], ' ')
  }

  const dateMatch = cleaned.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/)
  if (dateMatch) {
    const dd = parseInt(dateMatch[1], 10)
    const mm = parseInt(dateMatch[2], 10) - 1
    let yyyy = dateMatch[3] ? parseInt(dateMatch[3], 10) : today.getFullYear()
    if (yyyy < 100) yyyy += 2000
    if (dd >= 1 && dd <= 31 && mm >= 0 && mm <= 11) {
      date = toStr(yyyy, mm, dd)
      cleaned = cleaned.replace(dateMatch[0], ' ')
    }
  }

  // Heure : 10h, 10h30, 10:30
  let start_time: string | null = null
  const timeMatch = cleaned.match(/\b(\d{1,2})\s*[h:]\s*(\d{2})?\b/i)
  if (timeMatch) {
    const h = parseInt(timeMatch[1], 10)
    const mm = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0
    if (h >= 0 && h < 24 && mm >= 0 && mm < 60) {
      start_time = `${pad2(h)}:${pad2(mm)}`
      cleaned = cleaned.replace(timeMatch[0], ' ')
    }
  }

  // Préposition résiduelle "à"
  cleaned = cleaned.replace(/\bà\b/gi, ' ')
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  const title = cleaned || 'Événement'

  return { category, title, date, start_time }
}

export function buildCalendarDays(year: number, month: number) {
  const firstDay    = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const cells: { date: string; day: number; inMonth: boolean }[] = []
  for (let i = startDow; i > 0; i--) {
    const d = new Date(year, month, 1 - i)
    cells.push({ date: toStr(d.getFullYear(), d.getMonth(), d.getDate()), day: d.getDate(), inMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: toStr(year, month, d), day: d, inMonth: true })
  }
  const trailing = 7 - (cells.length % 7)
  if (trailing < 7) {
    for (let d = 1; d <= trailing; d++) {
      const nd = new Date(year, month + 1, d)
      cells.push({ date: toStr(nd.getFullYear(), nd.getMonth(), nd.getDate()), day: d, inMonth: false })
    }
  }
  return cells
}

export function formatDayLong(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

export function fmtDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function fmtTime(t: string) { return t.slice(0, 5) }
export function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }
// Format date court pour les cartes reservation : "1 juil" au lieu de "2026-07-01"
export function fmtShortDate(d: string) {
  const [y, m, dd] = d.split('-').map(Number)
  return new Date(y, m - 1, dd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// ─── Vue liste : événements chronologiques à venir ─────────────────────────
