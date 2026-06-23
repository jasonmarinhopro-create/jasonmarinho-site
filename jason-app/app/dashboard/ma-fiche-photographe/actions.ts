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

/**
 * Résout la fiche cible :
 * - Photographe connecté : sa propre fiche (via user_id)
 * - Admin avec targetId : la fiche désignée (édition pour le compte du pro)
 * - Autre cas : erreur
 */
async function resolveTargetFiche(targetId?: string): Promise<
  { photographerId: string; isAdminEdit: boolean } | { error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = getServiceClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const isAdmin = profile?.role === 'admin'

  // Mode admin : si targetId fourni et user admin → édition pour le compte du pro
  if (targetId && isAdmin) {
    const { data: target } = await admin
      .from('photographers')
      .select('id')
      .eq('id', targetId)
      .maybeSingle()
    if (!target) return { error: 'Photographe cible introuvable.' }
    return { photographerId: target.id, isAdminEdit: true }
  }

  // Mode standard : le pro édite sa propre fiche
  const { data: ph } = await admin
    .from('photographers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!ph) return { error: 'Aucune fiche photographe rattachée à ce compte.' }
  return { photographerId: ph.id, isAdminEdit: false }
}

/**
 * Met à jour une fiche photographe. Le pro met à jour sa propre fiche ;
 * un admin peut éditer la fiche de n'importe quel pro en passant targetId.
 * L'email et le user_id ne sont pas modifiables (clé d'identité auth).
 * Le slug n'est pas regénéré (préserve les liens SEO).
 */
export async function updatePhotographerFiche(payload: {
  targetId?: string
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
}): Promise<{ success?: boolean; error?: string; adminEdit?: boolean }> {
  const target = await resolveTargetFiche(payload.targetId)
  if ('error' in target) return { error: target.error }

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
    .eq('id', target.photographerId)

  if (updateErr) {
    log.error('update failed', updateErr)
    return { error: 'Erreur lors de la sauvegarde.' }
  }

  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL
  if (hookUrl) fetch(hookUrl, { method: 'POST' }).catch(() => {})

  revalidatePath('/dashboard/ma-fiche-photographe')
  if (target.isAdminEdit) revalidatePath('/dashboard/admin/photographes')
  return { success: true, adminEdit: target.isAdminEdit }
}

/**
 * Upload du logo via FormData. File au format jpeg/png/webp, max 500 KB.
 * Stocké dans le bucket pro-logos sous {photographerId}/avatar.{ext}.
 * Met à jour photographers.logo_url.
 */
export async function uploadPhotographerLogo(formData: FormData): Promise<{ success?: boolean; url?: string; error?: string }> {
  const targetId = formData.get('targetId') as string | null
  const target = await resolveTargetFiche(targetId ?? undefined)
  if ('error' in target) return { error: target.error }

  const file = formData.get('logo') as File | null
  if (!file || file.size === 0) return { error: 'Aucun fichier.' }
  if (file.size > 524288) return { error: 'Fichier trop lourd (max 500 KB).' }
  const mime = file.type
  const validExt: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
  if (!validExt[mime]) return { error: 'Format invalide. Accepté : JPEG, PNG, WebP.' }
  const ext = validExt[mime]

  const admin = getServiceClient()
  const path = `${target.photographerId}/avatar.${ext}`
  const { error: uploadErr } = await admin.storage
    .from('pro-logos')
    .upload(path, file, { contentType: mime, upsert: true })
  if (uploadErr) {
    log.error('upload logo failed', uploadErr)
    return { error: 'Upload échoué.' }
  }
  const { data: pub } = admin.storage.from('pro-logos').getPublicUrl(path)
  // Cache buster pour forcer le refetch après chaque update
  const url = `${pub.publicUrl}?v=${Date.now()}`

  const { error: updateErr } = await admin
    .from('photographers')
    .update({ logo_url: url, updated_at: new Date().toISOString() })
    .eq('id', target.photographerId)
  if (updateErr) {
    log.error('update logo_url failed', updateErr)
    return { error: 'Erreur lors de la sauvegarde.' }
  }

  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL
  if (hookUrl) fetch(hookUrl, { method: 'POST' }).catch(() => {})

  revalidatePath('/dashboard/ma-fiche-photographe')
  return { success: true, url }
}

/**
 * Supprime le logo. Le bucket conserve le fichier physique (cleanup
 * cron éventuel) mais photographers.logo_url repasse à null.
 */
export async function deletePhotographerLogo(targetId?: string): Promise<{ success?: boolean; error?: string }> {
  const target = await resolveTargetFiche(targetId)
  if ('error' in target) return { error: target.error }
  const admin = getServiceClient()
  await admin.from('photographers').update({ logo_url: null, updated_at: new Date().toISOString() }).eq('id', target.photographerId)
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL
  if (hookUrl) fetch(hookUrl, { method: 'POST' }).catch(() => {})
  revalidatePath('/dashboard/ma-fiche-photographe')
  return { success: true }
}

/**
 * Crée une session Stripe Customer Portal. Admin peut aussi ouvrir le
 * portail d'un autre pro (support).
 */
export async function createCustomerPortalSession(targetId?: string): Promise<{ url?: string; error?: string }> {
  const target = await resolveTargetFiche(targetId)
  if ('error' in target) return { error: target.error }

  const admin = getServiceClient()
  const { data: ph } = await admin
    .from('photographers')
    .select('stripe_customer_id, email')
    .eq('id', target.photographerId)
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
