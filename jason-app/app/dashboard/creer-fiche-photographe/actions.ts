'use server'

import { getServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { logger } from '@/lib/logger'
import { founderSeatFilter } from '@/lib/pros/founder-seats'
import { normSiteUrl, siteUrlOk, SITE_URL_ERROR } from '@/lib/pros/site-url'
import { readMetier, readOptions, normalizeVideoUrl } from '@/lib/pros/visuel'
import { checkoutCustomer } from '@/lib/stripe/customer'
import { instaHandle } from '@/lib/pros/reseaux'

const log = logger('creer-fiche-photographe/actions')
const FOUNDER_QUOTA = 20
const FOUNDER_PRICE_ID = process.env.STRIPE_PHOTOGRAPHER_FOUNDER_PRICE_ID || ''
const STANDARD_PRICE_ID = process.env.STRIPE_PHOTOGRAPHER_STANDARD_PRICE_ID || ''
const APP_URL = 'https://app.jasonmarinho.com'

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
  metier?: string
  options?: string[]
  videoUrl?: string
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
  const portfolioUrl = normSiteUrl(payload.portfolioUrl)
  if (!fullName || !ville || !portfolioUrl) {
    return { error: 'Nom, ville et portfolio sont obligatoires.' }
  }
  if (!siteUrlOk(portfolioUrl)) {
    return { error: `Ton site ou ton portfolio : ${SITE_URL_ERROR}.` }
  }

  const video = normalizeVideoUrl(payload.videoUrl)
  if (video.error) return { error: video.error }
  const visuel = { metier: readMetier(payload.metier), options: readOptions(payload.options), video_url: video.url }

  const admin = getServiceClient()

  // Une fiche existe déjà (payée ou en attente de paiement) : pas de doublon,
  // le paiement se reprend depuis Ma fiche (« Finaliser mon paiement »).
  const { data: existing } = await admin
    .from('photographers')
    .select('id, status, stripe_subscription_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing) {
    return { error: existing.status === 'pending_payment' || existing.status === 'approved_pending_payment'
      ? 'Ta fiche est déjà enregistrée : finalise le paiement depuis Ma fiche.'
      : 'Une fiche est déjà rattachée à ce compte.' }
  }

  // Détermine le tier (place fondateur restante ou non)
  const { count: founderCount } = await admin
    .from('photographers')
    .select('id', { count: 'exact', head: true })
    .eq('tier', 'fondateur')
    .or(founderSeatFilter())
  const tier: 'fondateur' | 'standard' = (founderCount ?? 0) < FOUNDER_QUOTA ? 'fondateur' : 'standard'
  const priceId = tier === 'fondateur' ? FOUNDER_PRICE_ID : STANDARD_PRICE_ID

  // Insert pending_payment
  const row = {
    user_id: user.id,
    email: user.email,
    full_name: fullName,
    ville,
    zone_couverte: String(payload.zoneCouverte || '').trim().slice(0, 200) || null,
    portfolio_url: portfolioUrl,
    instagram_handle: instaHandle(payload.instagramHandle) || null,
    telephone: String(payload.telephone || '').trim().slice(0, 30) || null,
    specialite: String(payload.specialite || '').trim().slice(0, 100) || null,
    tarif_min: payload.tarifMin ?? null,
    tarif_max: payload.tarifMax ?? null,
    bio: String(payload.bio || '').trim().slice(0, 600) || null,
    tier,
    status: 'pending_payment',
  }
  let { data: inserted, error: insertErr } = await admin.from('photographers').insert({ ...row, ...visuel }).select('id').single()
  // Migration 136 pas encore passée : la fiche s'enregistre sans ces champs
  if (insertErr && /metier|options|video_url/.test(`${insertErr.message} ${insertErr.details ?? ''}`)) {
    ({ data: inserted, error: insertErr } = await admin.from('photographers').insert(row).select('id').single())
  }
  if (insertErr || !inserted) {
    log.error('insert failed', insertErr)
    return { error: 'Erreur lors de l\'enregistrement.' }
  }
  const photographerId = inserted.id

  // Stripe Checkout
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      ...(await checkoutCustomer({ email: user.email, userId: user.id })),
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/dashboard/ma-fiche-photographe?paid=1`,
      cancel_url: `${APP_URL}/dashboard/ma-fiche-photographe?canceled=1`,
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
