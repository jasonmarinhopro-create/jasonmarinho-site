// Helpers Stripe Connect : balance, payouts, charges pour un compte connecté.
// Toutes les requêtes sont scopées au `stripeAccount` de l'hôte (option Stripe).
// Robuste aux comptes non-onboardés : renvoie zéros/listes vides plutôt que throw.

import { getStripe } from './client'

export interface EncaissementsSummary {
  hasAccount: boolean
  hasOnboarded: boolean
  defaultCurrency: string
  balance: {
    available: number  // en centimes
    pending: number
  }
  nextPayout: {
    amount: number
    arrivalDate: number | null  // unix seconds
    status: string | null
  } | null
  recentPayouts: Array<{
    id: string
    amount: number
    arrivalDate: number
    status: string
    failureMessage: string | null
    method: string
  }>
  monthToDate: {
    grossEur: number   // en centimes
    netEur: number     // après frais Stripe
    chargeCount: number
    refundedEur: number
  }
  recentFailedCharges: Array<{
    id: string
    amount: number
    created: number
    failureMessage: string | null
    customerEmail: string | null
    description: string | null
  }>
}

const EMPTY: EncaissementsSummary = {
  hasAccount: false,
  hasOnboarded: false,
  defaultCurrency: 'eur',
  balance: { available: 0, pending: 0 },
  nextPayout: null,
  recentPayouts: [],
  monthToDate: { grossEur: 0, netEur: 0, chargeCount: 0, refundedEur: 0 },
  recentFailedCharges: [],
}

export async function getEncaissementsSummary(
  stripeAccountId: string | null | undefined,
): Promise<EncaissementsSummary> {
  if (!stripeAccountId) return EMPTY

  const stripe = getStripe()
  const account = await stripe.accounts.retrieve(stripeAccountId).catch(() => null)
  if (!account) return EMPTY

  // payouts_enabled : meilleur signal "compte prêt à encaisser"
  const hasOnboarded = !!account.payouts_enabled
  const result: EncaissementsSummary = {
    ...EMPTY,
    hasAccount: true,
    hasOnboarded,
    defaultCurrency: account.default_currency ?? 'eur',
  }

  if (!hasOnboarded) return result

  // Périmètre temporel : début du mois en cours
  const now = new Date()
  const startOfMonth = Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000)

  // Balance + payouts + charges du mois — en parallèle
  const [balance, payouts, charges, failedCharges] = await Promise.all([
    stripe.balance.retrieve(undefined, { stripeAccount: stripeAccountId }).catch(() => null),
    stripe.payouts.list({ limit: 10 }, { stripeAccount: stripeAccountId }).catch(() => null),
    stripe.charges.list(
      { limit: 100, created: { gte: startOfMonth } },
      { stripeAccount: stripeAccountId },
    ).catch(() => null),
    stripe.charges.list(
      { limit: 5, created: { gte: startOfMonth - 30 * 24 * 3600 } }, // 30 derniers jours
      { stripeAccount: stripeAccountId },
    ).catch(() => null),
  ])

  if (balance) {
    const availEur = balance.available.find(b => b.currency === 'eur')
    const pendEur = balance.pending.find(b => b.currency === 'eur')
    result.balance = {
      available: availEur?.amount ?? 0,
      pending: pendEur?.amount ?? 0,
    }
  }

  if (payouts && payouts.data.length > 0) {
    // Prochain payout = le plus récent in_transit ou pending
    const upcoming = payouts.data.find(p => p.status === 'in_transit' || p.status === 'pending')
    if (upcoming) {
      result.nextPayout = {
        amount: upcoming.amount,
        arrivalDate: upcoming.arrival_date,
        status: upcoming.status,
      }
    }
    result.recentPayouts = payouts.data.map(p => ({
      id: p.id,
      amount: p.amount,
      arrivalDate: p.arrival_date,
      status: p.status,
      failureMessage: p.failure_message ?? null,
      method: p.method,
    }))
  }

  if (charges) {
    let gross = 0, refunded = 0, net = 0, count = 0
    for (const ch of charges.data) {
      if (ch.status !== 'succeeded') continue
      count++
      gross += ch.amount
      refunded += ch.amount_refunded ?? 0
      // Stripe pose les frais sur balance_transaction (fee) — net = amount - fee - refunded
      // Sans balance_transaction expansion on approxime : net ≈ amount * 0.973 - refunded
      // (frais Stripe ~2,7 % EU). Précis suffit pour un dashboard.
      net += Math.round(ch.amount * 0.973) - (ch.amount_refunded ?? 0)
    }
    result.monthToDate = { grossEur: gross, netEur: net, chargeCount: count, refundedEur: refunded }
  }

  if (failedCharges) {
    result.recentFailedCharges = failedCharges.data
      .filter(c => c.status === 'failed')
      .slice(0, 5)
      .map(c => ({
        id: c.id,
        amount: c.amount,
        created: c.created,
        failureMessage: c.failure_message ?? null,
        customerEmail: (c.billing_details?.email as string | null) ?? null,
        description: c.description ?? null,
      }))
  }

  return result
}

// Liste les contrats impayés (séjour à venir ou passé sans paiement encaissé)
// On la garde côté Supabase plutôt que Stripe car la source de vérité métier
// (séjour + contrat) est dans notre DB. Le bouton "Rappel paiement" générera
// un mailto: pré-rempli côté UI.
export interface ContractImpaye {
  id: string
  locataire_prenom: string | null
  locataire_nom: string | null
  locataire_email: string | null
  logement_nom: string | null
  montant_loyer: number | null
  date_arrivee: string | null
  date_depart: string | null
  daysOverdue: number
}

export function deriveImpayes(
  contracts: Array<{
    id: string
    locataire_prenom: string | null
    locataire_nom: string | null
    locataire_email: string | null
    logement_nom: string | null
    montant_loyer: number | null
    date_arrivee: string | null
    date_depart: string | null
    statut: string | null
    stripe_payment_status: string | null
    stripe_payment_enabled: boolean | null
  }>,
): ContractImpaye[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayMs = today.getTime()

  return contracts
    .filter(c => {
      if (c.statut === 'annule') return false
      if (!c.stripe_payment_enabled) return false  // pas concerné par l'encaissement Stripe
      if (c.stripe_payment_status === 'succeeded') return false
      if (!c.date_arrivee) return false
      // Impayé si date d'arrivée passée OU dans moins de 7 jours
      const arrivee = new Date(c.date_arrivee).getTime()
      const daysUntil = (arrivee - todayMs) / (24 * 3600 * 1000)
      return daysUntil <= 7
    })
    .map(c => {
      const arrivee = new Date(c.date_arrivee!).getTime()
      const daysOverdue = Math.floor((todayMs - arrivee) / (24 * 3600 * 1000))
      return {
        id: c.id,
        locataire_prenom: c.locataire_prenom,
        locataire_nom: c.locataire_nom,
        locataire_email: c.locataire_email,
        logement_nom: c.logement_nom,
        montant_loyer: c.montant_loyer,
        date_arrivee: c.date_arrivee,
        date_depart: c.date_depart,
        daysOverdue,
      }
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
}
