/**
 * Récupère les détails d'un abonnement Stripe + ses dernières factures.
 * Utilisé par /dashboard/abonnement et /dashboard/profil pour afficher
 * la date de renouvellement, le statut d'annulation, l'historique de
 * factures.
 *
 * Tout est try/catch : si Stripe est down ou si le customer n'existe
 * pas (cas dev/preview), on renvoie null plutôt que de planter la page.
 */

import { stripe } from './client'
import { STRIPE_PLANS } from '@/lib/constants/stripe-plans'

export type SubscriptionInterval = 'month' | 'year' | null

export type SubscriptionDetails = {
  status: string                       // 'active' | 'trialing' | 'past_due' | 'canceled' | ...
  interval: SubscriptionInterval       // 'month' | 'year'
  priceId: string | null
  amount: number | null                // en centimes
  currency: string | null
  currentPeriodEnd: number | null      // unix seconds
  cancelAtPeriodEnd: boolean
  cancelAt: number | null              // unix seconds (annulation différée)
  canceledAt: number | null            // unix seconds (déjà annulé)
  isFounding: boolean                  // tarif fondateur ?
  isMonthly: boolean
  isYearly: boolean
}

export type InvoiceSummary = {
  id: string
  number: string | null
  status: string                       // 'paid' | 'open' | 'void' | 'uncollectible' | 'draft'
  amountPaid: number                   // centimes
  currency: string
  created: number                      // unix seconds
  hostedInvoiceUrl: string | null
  invoicePdf: string | null
}

const FOUNDING_PRICE_IDS = new Set<string>([
  STRIPE_PLANS.STANDARD_FOUNDING_MONTHLY,
  STRIPE_PLANS.STANDARD_FOUNDING_YEARLY,
].filter(Boolean) as string[])

const MONTHLY_PRICE_IDS = new Set<string>([
  STRIPE_PLANS.STANDARD_FOUNDING_MONTHLY,
  STRIPE_PLANS.STANDARD_PUBLIC_MONTHLY,
  STRIPE_PLANS.DRIING_MEMBER_MONTHLY,
].filter(Boolean) as string[])

const YEARLY_PRICE_IDS = new Set<string>([
  STRIPE_PLANS.STANDARD_FOUNDING_YEARLY,
  STRIPE_PLANS.STANDARD_PUBLIC_YEARLY,
  STRIPE_PLANS.DRIING_MEMBER_YEARLY,
].filter(Boolean) as string[])

/** Map mensuel → annuel (et inverse) pour la même offre. */
export function counterpartPriceId(priceId: string): string | null {
  if (priceId === STRIPE_PLANS.STANDARD_FOUNDING_MONTHLY) return STRIPE_PLANS.STANDARD_FOUNDING_YEARLY
  if (priceId === STRIPE_PLANS.STANDARD_FOUNDING_YEARLY) return STRIPE_PLANS.STANDARD_FOUNDING_MONTHLY
  if (priceId === STRIPE_PLANS.STANDARD_PUBLIC_MONTHLY) return STRIPE_PLANS.STANDARD_PUBLIC_YEARLY
  if (priceId === STRIPE_PLANS.STANDARD_PUBLIC_YEARLY) return STRIPE_PLANS.STANDARD_PUBLIC_MONTHLY
  if (priceId === STRIPE_PLANS.DRIING_MEMBER_MONTHLY) return STRIPE_PLANS.DRIING_MEMBER_YEARLY
  if (priceId === STRIPE_PLANS.DRIING_MEMBER_YEARLY) return STRIPE_PLANS.DRIING_MEMBER_MONTHLY
  return null
}

/** Récupère les détails d'un abonnement. Null si erreur ou non trouvé. */
export async function getSubscriptionDetails(
  subscriptionId: string | null | undefined,
): Promise<SubscriptionDetails | null> {
  if (!subscriptionId) return null
  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId)
    const item = sub.items.data[0]
    const price = item?.price
    const priceId = price?.id ?? null
    // Type cast : current_period_end et cancel_at sont au niveau item dans
    // l'API récente, mais la prop subscription.current_period_end existe
    // toujours (deprecated). On gère les deux pour robustesse.
    const subAny = sub as unknown as {
      current_period_end?: number
      cancel_at?: number | null
      canceled_at?: number | null
      cancel_at_period_end?: boolean
    }
    const itemAny = item as unknown as { current_period_end?: number } | undefined
    return {
      status: sub.status,
      interval: price?.recurring?.interval as SubscriptionInterval ?? null,
      priceId,
      amount: price?.unit_amount ?? null,
      currency: price?.currency ?? null,
      currentPeriodEnd: itemAny?.current_period_end ?? subAny.current_period_end ?? null,
      cancelAtPeriodEnd: subAny.cancel_at_period_end ?? false,
      cancelAt: subAny.cancel_at ?? null,
      canceledAt: subAny.canceled_at ?? null,
      isFounding: priceId ? FOUNDING_PRICE_IDS.has(priceId) : false,
      isMonthly: priceId ? MONTHLY_PRICE_IDS.has(priceId) : false,
      isYearly: priceId ? YEARLY_PRICE_IDS.has(priceId) : false,
    }
  } catch (e) {
    console.error('[stripe] getSubscriptionDetails failed', e)
    return null
  }
}

/** Liste les dernières factures d'un customer (5 par défaut). */
export async function listRecentInvoices(
  customerId: string | null | undefined,
  limit = 5,
): Promise<InvoiceSummary[]> {
  if (!customerId) return []
  try {
    const list = await stripe.invoices.list({ customer: customerId, limit })
    return list.data.map(inv => ({
      id: inv.id ?? '',
      number: inv.number,
      status: inv.status ?? 'unknown',
      amountPaid: inv.amount_paid,
      currency: inv.currency,
      created: inv.created,
      hostedInvoiceUrl: inv.hosted_invoice_url,
      invoicePdf: inv.invoice_pdf,
    }))
  } catch (e) {
    console.error('[stripe] listRecentInvoices failed', e)
    return []
  }
}
