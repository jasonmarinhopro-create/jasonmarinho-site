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

/**
 * `adminTargetId` : aperçu admin (« Voir la page de paiement ») : ouvre la même
 * page Stripe que le pro verrait, sans rien changer à sa fiche (palier, date).
 * Si l'admin payait, c'est la fiche du pro qui serait activée : bouton prévenu.
 */
export async function resumeProCheckout(kind: ProKind, adminTargetId?: string): Promise<{ checkoutUrl?: string; error?: string; info?: string }> {
  const c = CONF[kind]
  const user = await getAuthUser()
  if (!user) return { error: 'Connecte-toi pour finaliser ton paiement.' }
  if (!c.founderPrice || !c.standardPrice) {
    log.error('price_id Stripe manquants', { kind })
    return { error: 'Paiement indisponible pour le moment. Écris à contact@jasonmarinho.com.' }
  }

  const admin = getServiceClient()
  let preview = false
  if (adminTargetId) {
    const { data: prof } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (prof?.role !== 'admin') return { error: 'Réservé à l’admin.' }
    preview = true
  }
  const base = admin.from(c.table).select('id, email, tier, status, stripe_subscription_status, user_id')
  const { data: fiche } = preview
    ? await base.eq('id', adminTargetId!).maybeSingle()
    : await base.eq('user_id', user.id).maybeSingle()
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
  // Aperçu admin : palier enregistré, rien n'est modifié
  const tier = preview ? (fiche.tier === 'standard' ? 'standard' : 'fondateur') : tierFor(count ?? 0)
  const priceId = tier === 'fondateur' ? c.founderPrice : c.standardPrice

  // La fiche repart de maintenant : elle garde sa place 7 jours de plus
  if (!preview) await admin.from(c.table).update({ tier, created_at: new Date().toISOString() }).eq('id', fiche.id)

  const back = preview ? `${APP_URL}${c.page}?id=${fiche.id}` : `${APP_URL}${c.page}?`
  const metadata = { [c.metaKey]: fiche.id, tier, user_id: fiche.user_id ?? user.id }
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: fiche.email || user.email || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${back}${preview ? '&' : ''}paid=1`,
      cancel_url: `${back}${preview ? '&' : ''}canceled=1`,
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
