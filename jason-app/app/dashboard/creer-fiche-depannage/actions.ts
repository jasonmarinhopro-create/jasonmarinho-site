'use server'

// Créer ma fiche Dépannage depuis l'app (compte déjà connecté), 31/10/2026.
// Même parcours que le ménage : fiche enregistrée en attente de paiement, puis
// Stripe Checkout (place Fondateur tant qu'il en reste). Fermé tant que le
// métier n'est pas ouvert (METIERS.depannage.ouvert), sauf pour l'admin qui teste.
import { getServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { logger } from '@/lib/logger'
import { founderSeatFilter, FOUNDER_QUOTA } from '@/lib/pros/founder-seats'
import { checkoutCustomer } from '@/lib/stripe/customer'
import { METIERS, SPECIALITES_DEPANNAGE } from '@/lib/pros/metiers'
import { DELAIS_DEPANNAGE } from '@/lib/pros/depannage'

const log = logger('creer-fiche-depannage/actions')
const M = METIERS.depannage
const APP_URL = 'https://app.jasonmarinho.com'
const ALLOWED_SPECIALITES = new Set<string>(SPECIALITES_DEPANNAGE.map(s => s.id))
const ALLOWED_DELAI = new Set<string>(DELAIS_DEPANNAGE.map(d => d.id))

export interface DepannageSignupPayload {
  fullName: string
  pseudo: string
  ville: string
  zoneCouverte: string
  telephone: string
  siret: string
  tarifHeure: number | null
  deplacementPrix: number | null
  delaiIntervention: string
  specialites: string[]
  bio: string
}

const intOrNull = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max ? Math.round(v) : null)

export async function submitDepannageSignup(payload: DepannageSignupPayload): Promise<{ checkoutUrl?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const admin = getServiceClient()
  if (!M.ouvert) {
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (profile?.role !== 'admin') return { error: 'Les inscriptions ouvrent très bientôt.' }
  }

  const founderPrice = process.env[M.stripeFounder] || ''
  const standardPrice = process.env[M.stripeStandard] || ''
  if (!founderPrice || !standardPrice) {
    log.error('prix Stripe manquants')
    return { error: 'Service indisponible (config Stripe).' }
  }

  const fullName = String(payload.fullName || '').trim().slice(0, 100)
  const ville = String(payload.ville || '').trim().slice(0, 80)
  if (!fullName || !ville) return { error: 'Nom et ville sont obligatoires.' }
  if (payload.delaiIntervention && !ALLOWED_DELAI.has(payload.delaiIntervention)) return { error: 'Délai d\'intervention invalide.' }
  const siret = String(payload.siret || '').replace(/\s+/g, '').slice(0, 14)
  if (siret && !/^[0-9]{14}$/.test(siret)) return { error: 'Le SIRET doit faire 14 chiffres (sans espaces).' }
  const specialites = Array.from(new Set((payload.specialites || []).filter(s => ALLOWED_SPECIALITES.has(s)))).slice(0, 9)
  if (!specialites.length) return { error: 'Coche au moins une spécialité.' }

  const { data: existing } = await admin.from(M.table).select('id, status').eq('user_id', user.id).maybeSingle()
  if (existing) {
    return { error: existing.status === 'pending_payment' || existing.status === 'approved_pending_payment'
      ? 'Ta fiche est déjà enregistrée : finalise le paiement depuis Ma fiche.'
      : 'Une fiche est déjà rattachée à ce compte.' }
  }

  const { count: founderCount } = await admin.from(M.table).select('id', { count: 'exact', head: true })
    .eq('tier', 'fondateur').or(founderSeatFilter())
  const tier: 'fondateur' | 'standard' = (founderCount ?? 0) < FOUNDER_QUOTA ? 'fondateur' : 'standard'

  const { data: inserted, error: insertErr } = await admin.from(M.table).insert({
    user_id: user.id,
    email: user.email,
    full_name: fullName,
    pseudo: String(payload.pseudo || '').trim().slice(0, 100) || null,
    ville,
    zone_couverte: String(payload.zoneCouverte || '').trim().slice(0, 200) || null,
    telephone: String(payload.telephone || '').trim().slice(0, 30) || null,
    siret: siret || null,
    tarif_heure: intOrNull(payload.tarifHeure, 500),
    deplacement_prix: intOrNull(payload.deplacementPrix, 500),
    delai_intervention: payload.delaiIntervention || null,
    specialites,
    langues: ['fr'],
    bio: String(payload.bio || '').trim().slice(0, 600) || null,
    tier,
    status: 'pending_payment',
  }).select('id').single()
  if (insertErr || !inserted) {
    log.error('enregistrement de la fiche', { err: insertErr?.message })
    return { error: 'Erreur lors de l\'enregistrement.' }
  }
  const proId = inserted.id as string
  const meta = { [M.idColumn]: proId, tier, user_id: user.id }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      ...(await checkoutCustomer({ email: user.email, userId: user.id })),
      line_items: [{ price: tier === 'fondateur' ? founderPrice : standardPrice, quantity: 1 }],
      success_url: `${APP_URL}${M.espace}?paid=1`,
      cancel_url: `${APP_URL}${M.espace}?canceled=1`,
      locale: 'fr',
      allow_promotion_codes: true,
      metadata: meta,
      subscription_data: { metadata: meta },
    })
    if (!session.url) {
      await admin.from(M.table).delete().eq('id', proId)
      return { error: 'Stripe n\'a pas renvoyé d\'URL de paiement.' }
    }
    return { checkoutUrl: session.url }
  } catch (e) {
    log.error('session Stripe', { err: e instanceof Error ? e.message : String(e) })
    await admin.from(M.table).delete().eq('id', proId)
    return { error: `Stripe : ${e instanceof Error ? e.message : 'erreur.'}` }
  }
}
