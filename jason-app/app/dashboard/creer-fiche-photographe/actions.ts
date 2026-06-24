'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/client'
import { logger } from '@/lib/logger'

const log = logger('creer-fiche-photographe/actions')
const FOUNDER_QUOTA = 20
const FOUNDER_PRICE_ID = process.env.STRIPE_PHOTOGRAPHER_FOUNDER_PRICE_ID || ''
const STANDARD_PRICE_ID = process.env.STRIPE_PHOTOGRAPHER_STANDARD_PRICE_ID || ''
const APP_URL = 'https://app.jasonmarinho.com'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export interface PhotographerSignupPayload {
  fullName: string
  ville: string
  zoneCouverte: string
  portfolioUrl: string
  instagramHandle: string
  telephone: string
  specialite: string
  tarifMin: number | null
  tarifMax: number | null
  bio: string
}

/**
 * Crée la fiche photographe pour l'utilisateur authentifié (compte déjà
 * existant côté Supabase Auth) et démarre un Stripe Checkout. Variante
 * dashboard du flow public /api/photographer/signup : pas de création de
 * compte (et donc pas de password à saisir), pas d'email à confirmer.
 * Le webhook customer.subscription.created active la fiche au retour Stripe.
 */
export async function submitPhotographerSignup(
  payload: PhotographerSignupPayload,
): Promise<{ checkoutUrl?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  if (!FOUNDER_PRICE_ID || !STANDARD_PRICE_ID) {
    log.error('price_id Stripe manquants')
    return { error: 'Service indisponible (config Stripe).' }
  }

  const fullName = String(payload.fullName || '').trim().slice(0, 100)
  const ville = String(payload.ville || '').trim().slice(0, 80)
  const portfolioUrl = String(payload.portfolioUrl || '').trim().slice(0, 300)
  if (!fullName || !ville || !portfolioUrl) {
    return { error: 'Nom, ville et portfolio sont obligatoires.' }
  }
  if (!/^https?:\/\//i.test(portfolioUrl)) {
    return { error: 'Le portfolio doit commencer par https://' }
  }

  const admin = getServiceClient()

  // Si une fiche existe déjà (active ou pending légitime), on bloque
  // l'inscription en double. Les orphelins (status=pending_payment sans
  // stripe_subscription_id) ont déjà été nettoyés par la page.
  const { data: existing } = await admin
    .from('photographers')
    .select('id, status, stripe_subscription_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing && !(existing.status === 'pending_payment' && !existing.stripe_subscription_id)) {
    return { error: 'Une fiche est déjà rattachée à ce compte.' }
  }

  // Détermine le tier (place fondateur restante ou non)
  const { count: founderCount } = await admin
    .from('photographers')
    .select('id', { count: 'exact', head: true })
    .eq('tier', 'fondateur')
    .in('status', ['active', 'pending_payment', 'approved_pending_payment'])
  const tier: 'fondateur' | 'standard' = (founderCount ?? 0) < FOUNDER_QUOTA ? 'fondateur' : 'standard'
  const priceId = tier === 'fondateur' ? FOUNDER_PRICE_ID : STANDARD_PRICE_ID

  // Insert pending_payment
  const { data: inserted, error: insertErr } = await admin
    .from('photographers')
    .insert({
      user_id: user.id,
      email: user.email,
      full_name: fullName,
      ville,
      zone_couverte: String(payload.zoneCouverte || '').trim().slice(0, 200) || null,
      portfolio_url: portfolioUrl,
      instagram_handle: String(payload.instagramHandle || '').trim().slice(0, 50).replace(/^@/, '') || null,
      telephone: String(payload.telephone || '').trim().slice(0, 30) || null,
      specialite: String(payload.specialite || '').trim().slice(0, 100) || null,
      tarif_min: payload.tarifMin ?? null,
      tarif_max: payload.tarifMax ?? null,
      bio: String(payload.bio || '').trim().slice(0, 600) || null,
      tier,
      status: 'pending_payment',
    })
    .select('id')
    .single()
  if (insertErr || !inserted) {
    log.error('insert failed', insertErr)
    return { error: 'Erreur lors de l\'enregistrement.' }
  }
  const photographerId = inserted.id

  // Stripe Checkout
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/dashboard/ma-fiche-photographe?paid=1`,
      cancel_url: `${APP_URL}/dashboard/creer-fiche-photographe?canceled=1`,
      locale: 'fr',
      allow_promotion_codes: true,
      metadata: { photographer_id: photographerId, tier, user_id: user.id },
      subscription_data: { metadata: { photographer_id: photographerId, tier, user_id: user.id } },
    })
    if (!session.url) {
      await admin.from('photographers').delete().eq('id', photographerId)
      return { error: 'Stripe n\'a pas renvoyé d\'URL de paiement.' }
    }
    return { checkoutUrl: session.url }
  } catch (e) {
    log.error('checkout session create failed', e)
    await admin.from('photographers').delete().eq('id', photographerId)
    const msg = e instanceof Error ? e.message : 'Erreur Stripe.'
    return { error: `Stripe : ${msg}` }
  }
}
