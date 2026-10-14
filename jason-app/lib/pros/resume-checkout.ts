import 'server-only'
import { getServiceClient } from '@/lib/supabase/service'
import { getAuthUser } from '@/lib/supabase/auth-user'
import { stripe } from '@/lib/stripe/client'
import { logger } from '@/lib/logger'
import { canResumePayment, founderSeatFilter, tierFor } from './founder-seats'

// Reprendre un paiement abandonné (14/10/2026, Jason : « une personne qui a
// tout rempli, arrive au paiement et quitte : s'il revient, a-t-il un endroit
// facile pour payer ? »). Bouton « Finaliser mon paiement » de Ma fiche :
// nouvelle session Stripe Checkout pour la fiche déjà enregistrée, sans
// refaire le formulaire. Le webhook customer.subscription.created l'active.

const log = logger('pros/resume-checkout')
const APP_URL = 'https://app.jasonmarinho.com'

const CONF = {
  photographer: {
    table: 'photographers',
    metaKey: 'photographer_id',
    page: '/dashboard/ma-fiche-photographe',
    founderPrice: process.env.STRIPE_PHOTOGRAPHER_FOUNDER_PRICE_ID || '',
    standardPrice: process.env.STRIPE_PHOTOGRAPHER_STANDARD_PRICE_ID || '',
  },
  cleaner: {
    table: 'cleaners',
    metaKey: 'cleaner_id',
    page: '/dashboard/ma-fiche-menage',
    founderPrice: process.env.STRIPE_CLEANER_FOUNDER_PRICE_ID || '',
    standardPrice: process.env.STRIPE_CLEANER_STANDARD_PRICE_ID || '',
  },
} as const

export type ProKind = keyof typeof CONF

export async function resumeProCheckout(kind: ProKind): Promise<{ checkoutUrl?: string; error?: string; info?: string }> {
  const c = CONF[kind]
  const user = await getAuthUser()
  if (!user) return { error: 'Connecte-toi pour finaliser ton paiement.' }
  if (!c.founderPrice || !c.standardPrice) {
    log.error('price_id Stripe manquants', { kind })
    return { error: 'Paiement indisponible pour le moment. Écris à contact@jasonmarinho.com.' }
  }

  const admin = getServiceClient()
  // Seulement la fiche du compte connecté : jamais en aperçu admin
  const { data: fiche } = await admin
    .from(c.table)
    .select('id, email, tier, status, stripe_subscription_status')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!fiche) return { error: 'Aucune fiche rattachée à ce compte.' }
  if (!canResumePayment(fiche)) {
    return { info: 'Ton abonnement est déjà en place : ta fiche s’active dans quelques minutes.' }
  }

  // Jamais deux abonnements : un paiement déjà fait dont le webhook n'est pas
  // encore arrivé est retrouvé chez Stripe par la fiche.
  try {
    const found = await stripe.subscriptions.search({
      query: `metadata['${c.metaKey}']:'${fiche.id}'`,
      limit: 5,
    })
    if (found.data.some(s => s.status === 'active' || s.status === 'trialing' || s.status === 'past_due')) {
      return { info: 'Ton paiement est bien reçu : ta fiche s’active dans quelques minutes.' }
    }
  } catch (e) {
    // Recherche indisponible : on continue (Stripe Checkout reste la seule voie de paiement)
    log.warn('subscription search failed', e)
  }

  // Palier recalculé : la place Fondateur n'est gardée que 7 jours sans paiement
  const { count } = await admin
    .from(c.table)
    .select('id', { count: 'exact', head: true })
    .eq('tier', 'fondateur')
    .neq('id', fiche.id)
    .or(founderSeatFilter())
  const tier = tierFor(count ?? 0)
  const priceId = tier === 'fondateur' ? c.founderPrice : c.standardPrice

  // La fiche repart de maintenant : elle regarde sa place 7 jours de plus
  await admin.from(c.table).update({ tier, created_at: new Date().toISOString() }).eq('id', fiche.id)

  const metadata = { [c.metaKey]: fiche.id, tier, user_id: user.id }
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: fiche.email || user.email || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}${c.page}?paid=1`,
      cancel_url: `${APP_URL}${c.page}?canceled=1`,
      locale: 'fr',
      allow_promotion_codes: true,
      metadata,
      subscription_data: { metadata },
    })
    if (!session.url) return { error: 'Stripe n’a pas renvoyé de page de paiement. Réessaie.' }
    return { checkoutUrl: session.url }
  } catch (e) {
    log.error('checkout session create failed', e)
    return { error: 'Impossible d’ouvrir le paiement Stripe. Réessaie ou écris à contact@jasonmarinho.com.' }
  }
}
