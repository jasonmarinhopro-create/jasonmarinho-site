// Libellé et couleur d'une réservation importée (iCal) dans le Calendrier.
// Avant (sept. 2026) : le titre brut des plateformes (« Reserved ») et la
// couleur du flux (bleu Booking #003B95) s'affichaient tels quels, et la
// plateforme était devinée à partir de la couleur. Maintenant : plateforme
// déduite de l'URL du flux, couleurs de la page Mes réservations (pas de bleu).
import { icalPlatformOf } from './display'

export const ICAL_PLATFORM_DISPLAY = {
  airbnb: { label: 'Airbnb', color: '#E0475B' },
  booking: { label: 'Booking', color: '#D97706' },
  vrbo: { label: 'Vrbo', color: '#8B6D5E' },
} as const

const NEUTRAL = '#8B6D5E'
// Couleurs bleues à ne jamais afficher sur les pages hôte
const BLUE = /^(#003b95|#1877f2|#4285f4|#3b82f6|#60a5fa|#93c5fd|var\(--info\))$/i
const GENERIC_TITLE = /^\s*(reserved|réservé|closed\b.*|airbnb \(not available\)|not available|unavailable|booked)\s*$/i

export function icalCalendarDisplay(input: {
  title: string | null | undefined
  feedUrl: string | null | undefined
  feedName?: string | null
  feedColor?: string | null
}): { platformLabel: string | null; color: string; title: string } {
  const platform = icalPlatformOf(input.feedUrl)
  const meta = platform ? ICAL_PLATFORM_DISPLAY[platform] : null
  const fallbackColor = input.feedColor && !BLUE.test(input.feedColor) ? input.feedColor : NEUTRAL
  const raw = (input.title ?? '').trim()
  const source = meta?.label ?? input.feedName?.trim() ?? null
  const title = !raw || GENERIC_TITLE.test(raw)
    ? `Réservation ${source ?? 'synchronisée'}`
    : raw
  return { platformLabel: meta?.label ?? null, color: meta?.color ?? fallbackColor, title }
}
