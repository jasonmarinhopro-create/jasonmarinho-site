'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/client'
import { logger } from '@/lib/logger'

const log = logger('creer-fiche-menage/actions')
const FOUNDER_QUOTA = 20
const FOUNDER_PRICE_ID = process.env.STRIPE_CLEANER_FOUNDER_PRICE_ID || ''
const STANDARD_PRICE_ID = process.env.STRIPE_CLEANER_STANDARD_PRICE_ID || ''
const APP_URL = 'https://app.jasonmarinho.com'

const ALLOWED_PRESTATIONS = new Set([
  'menage_standard', 'gestion_linge', 'repassage', 'reapprovisionnement',
  'etat_des_lieux_photo', 'petite_maintenance', 'nettoyage_exterieur', 'gestion_dechets',
])
const ALLOWED_EQUIPE = new Set(['solo', 'duo', 'equipe_3_5', 'equipe_6_plus'])
const ALLOWED_DELAI = new Set(['jour_meme', '24h', '48h', '72h'])
const ALLOWED_LANGUES = new Set(['fr', 'en', 'es', 'it', 'de', 'pt', 'ar', 'zh'])

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export interface CleanerSignupPayload {
  fullName: string
  pseudo: string
  ville: string
  zoneCouverte: string
  siteUrl: string
  instagramHandle: string
  telephone: string
  tarifForfaitMin: number | null
  tarifForfaitMax: number | null
  tarifHeure: number | null
  equipeType: string
  logementsGeres: number | null
  delaiReservation: string
  assuranceRcPro: boolean
  siret: string
  bio: string
  prestations: string[]
  langues: string[]
}

export async function submitCleanerSignup(
  payload: CleanerSignupPayload,
): Promise<{ checkoutUrl?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  if (!FOUNDER_PRICE_ID || !STANDARD_PRICE_ID) {
    log.error('price_id Stripe manquants')
    return { error: 'Service indisponible (config Stripe).' }
  }

  const fullName = String(payload.fullName || '').trim().slice(0, 100)
  const pseudo = String(payload.pseudo || '').trim().slice(0, 100)
  const ville = String(payload.ville || '').trim().slice(0, 80)
  const siteUrl = String(payload.siteUrl || '').trim().slice(0, 300)
  if (!fullName || !ville) {
    return { error: 'Nom et ville sont obligatoires.' }
  }
  if (siteUrl && !/^https?:\/\//i.test(siteUrl)) {
    return { error: 'Le site web doit commencer par https://' }
  }
  if (payload.equipeType && !ALLOWED_EQUIPE.has(payload.equipeType)) {
    return { error: 'Type d\'équipe invalide.' }
  }
  if (payload.delaiReservation && !ALLOWED_DELAI.has(payload.delaiReservation)) {
    return { error: 'Délai de réservation invalide.' }
  }
  const siret = String(payload.siret || '').trim().replace(/\s+/g, '').slice(0, 14)
  if (siret && !/^[0-9]{14}$/.test(siret)) {
    return { error: 'Le SIRET doit faire 14 chiffres (sans espaces).' }
  }

  const prestations = (payload.prestations || []).filter(p => ALLOWED_PRESTATIONS.has(p)).slice(0, 12)
  const langues = (payload.langues || []).filter(l => ALLOWED_LANGUES.has(l)).slice(0, 8)

  const admin = getServiceClient()

  const { data: existing } = await admin
    .from('cleaners')
    .select('id, status, stripe_subscription_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing && !(existing.status === 'pending_payment' && !existing.stripe_subscription_id)) {
    return { error: 'Une fiche est déjà rattachée à ce compte.' }
  }

  const { count: founderCount } = await admin
    .from('cleaners')
    .select('id', { count: 'exact', head: true })
    .eq('tier', 'fondateur')
    .in('status', ['active', 'pending_payment', 'approved_pending_payment'])
  const tier: 'fondateur' | 'standard' = (founderCount ?? 0) < FOUNDER_QUOTA ? 'fondateur' : 'standard'
  const priceId = tier === 'fondateur' ? FOUNDER_PRICE_ID : STANDARD_PRICE_ID

  const { data: inserted, error: insertErr } = await admin
    .from('cleaners')
    .insert({
      user_id: user.id,
      email: user.email,
      full_name: fullName,
      pseudo: pseudo || null,
      ville,
      zone_couverte: String(payload.zoneCouverte || '').trim().slice(0, 200) || null,
      site_url: siteUrl || null,
      instagram_handle: String(payload.instagramHandle || '').trim().slice(0, 50).replace(/^@/, '') || null,
      telephone: String(payload.telephone || '').trim().slice(0, 30) || null,
      tarif_forfait_min: payload.tarifForfaitMin ?? null,
      tarif_forfait_max: payload.tarifForfaitMax ?? null,
      tarif_heure: payload.tarifHeure ?? null,
      prestations: prestations.length ? prestations : null,
      equipe_type: payload.equipeType || null,
      logements_geres: payload.logementsGeres ?? null,
      delai_reservation: payload.delaiReservation || null,
      langues: langues.length ? langues : null,
      assurance_rc_pro: !!payload.assuranceRcPro,
      siret: siret || null,
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
  const cleanerId = inserted.id

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/dashboard/ma-fiche-menage?paid=1`,
      cancel_url: `${APP_URL}/dashboard/creer-fiche-menage?canceled=1`,
      locale: 'fr',
      allow_promotion_codes: true,
      metadata: { cleaner_id: cleanerId, tier, user_id: user.id },
      subscription_data: { metadata: { cleaner_id: cleanerId, tier, user_id: user.id } },
    })
    if (!session.url) {
      await admin.from('cleaners').delete().eq('id', cleanerId)
      return { error: 'Stripe n\'a pas renvoyé d\'URL de paiement.' }
    }
    return { checkoutUrl: session.url }
  } catch (e) {
    log.error('checkout session create failed', e)
    await admin.from('cleaners').delete().eq('id', cleanerId)
    const msg = e instanceof Error ? e.message : 'Erreur Stripe.'
    return { error: `Stripe : ${msg}` }
  }
}
