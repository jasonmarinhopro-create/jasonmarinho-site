// Rangement des cautions de l'onglet Cautions de Contrats & paiements
// (05/10/2026). Pur et testé : partagé par l'onglet et le compteur de l'onglet.
import { depositWindow } from '@/lib/stripe/deposit-window'

export type CautionGroup = 'decider' | 'attente' | 'expiree' | 'terminee' | 'horsligne'

export interface CautionLike {
  stripe_deposit_status: string | null
  date_arrivee: string | null
  date_depart: string | null
}

/** Où en est la caution de ce contrat */
export function cautionGroup(c: CautionLike, stripeReady: boolean, now?: Date): CautionGroup {
  const st = c.stripe_deposit_status
  // Carte bloquée (ou action de l'hôte en cours chez Stripe) : à décider
  if (st === 'held' || st === 'capturing' || st === 'releasing') return 'decider'
  if (st === 'captured' || st === 'released') return 'terminee'
  // Sans Stripe, la caution se règle hors de l'app (espèces, virement)
  if (!stripeReady) return 'horsligne'
  const win = c.date_arrivee && c.date_depart ? depositWindow(c.date_arrivee, c.date_depart, now) : 'closed'
  if (st === 'expired') return win === 'closed' ? 'terminee' : 'expiree'
  return win === 'closed' ? 'terminee' : 'attente'
}
