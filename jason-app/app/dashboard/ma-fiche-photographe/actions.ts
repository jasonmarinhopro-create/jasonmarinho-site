'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/client'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

const log = logger('ma-fiche-photographe/actions')

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function requireOwnFiche(): Promise<{ userId: string; photographerId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }
  const admin = getServiceClient()
  const { data: ph } = await admin
    .from('photographers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!ph) return { error: 'Aucune fiche photographe rattachée à ce compte.' }
  return { userId: user.id, photographerId: ph.id }
}

/**
 * Met à jour la fiche du photographe connecté. L'email et le user_id ne
 * sont pas modifiables ici (clé d'identité auth). Le slug n'est pas
 * regénéré (préserve les liens SEO et les URLs partagées).
 */
export async function updatePhotographerFiche(payload: {
  full_name?: string
  ville?: string
  zone_couverte?: string | null
  bio?: string | null
  specialite?: string | null
  tarif_min?: number | null
  tarif_max?: number | null
  portfolio_url?: string
  instagram_handle?: string | null
  telephone?: string | null
}): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireOwnFiche()
  if ('error' in auth) return { error: auth.error }

  // Validation minimale, identique au signup
  const fullName = String(payload.full_name || '').trim().slice(0, 100)
  const ville = String(payload.ville || '').trim().slice(0, 80)
  const portfolioUrl = String(payload.portfolio_url || '').trim().slice(0, 300)
  if (!fullName || !ville || !portfolioUrl) {
    return { error: 'Nom, ville et portfolio sont obligatoires.' }
  }
  if (!/^https?:\/\//i.test(portfolioUrl)) {
    return { error: 'Le portfolio doit commencer par https://' }
  }

  const admin = getServiceClient()
  const { error: updateErr } = await admin
    .from('photographers')
    .update({
      full_name: fullName,
      ville,
      zone_couverte: (payload.zone_couverte ?? '').toString().trim().slice(0, 200) || null,
      bio: (payload.bio ?? '').toString().trim().slice(0, 600) || null,
      specialite: (payload.specialite ?? '').toString().trim().slice(0, 100) || null,
      tarif_min: payload.tarif_min ?? null,
      tarif_max: payload.tarif_max ?? null,
      portfolio_url: portfolioUrl,
      instagram_handle: (payload.instagram_handle ?? '').toString().trim().slice(0, 50).replace(/^@/, '') || null,
      telephone: (payload.telephone ?? '').toString().trim().slice(0, 30) || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', auth.photographerId)

  if (updateErr) {
    log.error('update failed', updateErr)
    return { error: 'Erreur lors de la sauvegarde.' }
  }

  // Trigger rebuild du site statique pour régénérer la fiche publique
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL
  if (hookUrl) fetch(hookUrl, { method: 'POST' }).catch(() => {})

  revalidatePath('/dashboard/ma-fiche-photographe')
  return { success: true }
}

/**
 * Crée une session Stripe Customer Portal pour la gestion d'abonnement
 * (factures, changement de carte, résiliation).
 */
export async function createCustomerPortalSession(): Promise<{ url?: string; error?: string }> {
  const auth = await requireOwnFiche()
  if ('error' in auth) return { error: auth.error }

  const admin = getServiceClient()
  const { data: ph } = await admin
    .from('photographers')
    .select('stripe_customer_id, email')
    .eq('id', auth.photographerId)
    .maybeSingle()
  if (!ph?.stripe_customer_id) return { error: 'Abonnement Stripe non encore initialisé.' }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: ph.stripe_customer_id,
      return_url: 'https://app.jasonmarinho.com/dashboard/ma-fiche-photographe',
    })
    return { url: session.url }
  } catch (e) {
    log.error('billing portal create failed', e)
    return { error: 'Impossible de créer la session de gestion d\'abonnement.' }
  }
}
