// Places « Fondateur » des annuaires (photographes, équipes de ménage).
// Une fiche payée ou approuvée garde sa place. Une inscription restée au
// paiement (pending_payment) ne la garde que 7 jours : au-delà, la place
// revient aux suivants (avant : un formulaire abandonné la bloquait pour
// toujours). Même règle côté site statique : api/annuaire-places.js,
// api/photographer/signup.js, api/cleaner/signup.js (pas d'import possible,
// règle recopiée : garder les deux identiques).

export const FOUNDER_QUOTA = 20
export const PENDING_HOLD_DAYS = 7

export type ProTier = 'fondateur' | 'standard'

/** Date (ISO, à la seconde) avant laquelle une inscription non payée ne garde plus sa place. */
export function holdCutoff(now: Date = new Date()): string {
  const d = new Date(now.getTime() - PENDING_HOLD_DAYS * 86_400_000)
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

/** Filtre PostgREST `or` : fiches qui occupent une place (avec `.eq('tier', 'fondateur')`). */
export function founderSeatFilter(now: Date = new Date()): string {
  return `status.in.(active,approved_pending_payment),and(status.eq.pending_payment,created_at.gte.${holdCutoff(now)})`
}

/** La fiche occupe-t-elle une place (hors palier) ? */
export function holdsSeat(row: { status: string; created_at: string }, now: Date = new Date()): boolean {
  if (row.status === 'active' || row.status === 'approved_pending_payment') return true
  if (row.status !== 'pending_payment') return false
  return new Date(row.created_at).getTime() >= now.getTime() - PENDING_HOLD_DAYS * 86_400_000
}

/** Palier d'une inscription d'après les places prises par les autres fiches. */
export function tierFor(othersHoldingSeats: number, quota: number = FOUNDER_QUOTA): ProTier {
  return othersHoldingSeats < quota ? 'fondateur' : 'standard'
}

/** Une fiche qui attend son paiement peut-elle le reprendre ? */
export function canResumePayment(row: { status: string; stripe_subscription_status?: string | null }): boolean {
  if (row.status !== 'pending_payment' && row.status !== 'approved_pending_payment') return false
  const st = row.stripe_subscription_status
  return !(st === 'active' || st === 'trialing' || st === 'past_due')
}
