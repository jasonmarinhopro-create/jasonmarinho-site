// Heuristique pour détecter les "blocages" iCal (Airbnb bloque automatiquement
// les dates > 12 mois rolling, "CLOSED - Not available" sur Booking pour blocage
// manuel, etc.) — par opposition aux vraies réservations voyageur.
//
// Utilisé par :
// - L'affichage dashboard calendrier (les afficher en gris, ne pas les compter
//   dans le taux d'occupation).
// - L'export iCal public (les filtrer pour ne pas polluer Google Agenda /
//   Driing / autre client iCal externe).

export function isBlockedIcalEvent(
  title: string | null | undefined,
  description: string | null | undefined,
): boolean {
  const t = (title ?? '').toLowerCase()
  const d = (description ?? '').toLowerCase()
  // Vraie réservation : présence d'un identifiant voyageur dans la description
  if (d.includes('reservation url') || d.includes('phone number') || d.includes('checkin')) return false
  // Patterns "non disponible" sans données voyageur → blocage technique/manuel
  if (t.includes('not available') || t.includes('unavailable') || t.includes('blocked') || t.includes('blocage')) return true
  if (t.startsWith('closed') || t.includes('- not available')) return true
  return false
}
