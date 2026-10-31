// Interrupteur « Recevoir Le Check-in » de Mon compte (11/10/2026, demande de
// Jason). Pur et testé (account-rules.test.ts) : qui reçoit la lettre, d'après
// Brevo (source de vérité des désinscriptions) et le compte.
import type { Edition } from './editions'

export interface NewsletterFacts {
  /** Brevo a bloqué l'adresse (lien de désinscription d'une lettre, ou interrupteur coupé) */
  blacklisted: boolean
  /** Adresse présente dans la liste de la lettre (formulaire du site, case de l'inscription) */
  inList: boolean
  /** Case cochée à l'inscription ou interrupteur allumé (profiles.newsletter_opt_in) */
  optIn: boolean
  /** Fiche photographe ou ménage payée : reçoit l'édition des pros sans inscription */
  paidPro: boolean
}

export type NewsletterReason = 'desinscrit' | 'inscrit' | 'client-pro' | 'pas-inscrit'

export function newsletterState(f: NewsletterFacts): { subscribed: boolean; reason: NewsletterReason } {
  if (f.blacklisted) return { subscribed: false, reason: 'desinscrit' }
  if (f.inList || f.optIn) return { subscribed: true, reason: 'inscrit' }
  if (f.paidPro) return { subscribed: true, reason: 'client-pro' }
  return { subscribed: false, reason: 'pas-inscrit' }
}

const EDITION_TEXT: Record<Edition, string> = {
  hote: 'l’édition des hôtes',
  investisseur: 'l’édition des investisseurs',
  photographe: 'l’édition des photographes',
  menage: 'l’édition des équipes de ménage',
  depannage: 'l’édition du dépannage et de la maintenance',
}

/** Phrase sous l'interrupteur */
export function newsletterNote(state: { subscribed: boolean; reason: NewsletterReason }, edition: Edition): string {
  if (state.subscribed) {
    return state.reason === 'client-pro'
      ? `Tu reçois ${EDITION_TEXT[edition]}, comme tous les pros de l’annuaire. Un mail par mois, le premier mardi.`
      : `Tu reçois ${EDITION_TEXT[edition]}. Un mail par mois, le premier mardi.`
  }
  return state.reason === 'desinscrit'
    ? 'Tu t’es désinscrit. Rallume l’interrupteur pour la recevoir de nouveau.'
    : 'Un mail par mois, le premier mardi : les changements de règles, un chiffre, un outil et les nouveautés de l’app.'
}
