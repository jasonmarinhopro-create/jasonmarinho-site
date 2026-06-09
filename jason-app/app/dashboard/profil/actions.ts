'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { invalidateProfileCache } from '@/lib/queries/profile'
import { stripe } from '@/lib/stripe/client'
import { logger } from '@/lib/logger'

const log = logger('profil/actions')

export async function saveProfileName(fullName: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: session.user.id,
      email: session.user.email ?? '',
      full_name: fullName.trim() || null,
      updated_at: new Date().toISOString(),
    })

  if (error) return { error: `Erreur: ${error.message}` }

  invalidateProfileCache(session.user.id)
  revalidatePath('/dashboard', 'layout')

  return {}
}

export async function saveIban(iban: string, bic: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: session.user.id,
      email: session.user.email ?? '',
      iban: iban || null,
      bic: bic || null,
      updated_at: new Date().toISOString(),
    })

  if (error) return { error: `Erreur: ${error.message}` }

  invalidateProfileCache(session.user.id)
  revalidatePath('/dashboard', 'layout')

  return {}
}

export async function saveAdresse(adresse: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: session.user.id,
      email: session.user.email ?? '',
      adresse: adresse.trim() || null,
      updated_at: new Date().toISOString(),
    })

  if (error) return { error: `Erreur: ${error.message}` }

  invalidateProfileCache(session.user.id)
  revalidatePath('/dashboard', 'layout')

  return {}
}

// ─── Suppression de compte (RGPD article 17 + droit de rétractation L221-18) ───
//
// Flow :
// 1. Annule l'abonnement Stripe en cours si présent (immédiatement).
// 2. Supprime le user dans auth.users via service role.
// 3. Toutes les tables (profiles, logements, voyageurs, sejours, contracts,
//    user_facebook_posts, user_pinned_templates, etc.) cascade via leurs FK
//    ON DELETE CASCADE → nettoyage complet automatique côté DB.
// 4. La session courante devient invalide → le client est redirigé vers /auth/login.
export async function deleteAccount(confirmation: string): Promise<{ error?: string }> {
  if (confirmation !== 'SUPPRIMER') {
    return { error: 'Confirmation invalide.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  // Récupère le profil pour savoir s'il y a un abonnement Stripe à annuler
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', user.id)
    .maybeSingle()

  // Annulation Stripe (best-effort : on continue même en cas d'erreur Stripe
  // pour ne pas bloquer la suppression du compte — c'est le droit du user)
  if (profile?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(profile.stripe_subscription_id)
    } catch (err) {
      log.error('stripeCancelFailed', { err: String(err), userId: user.id })
    }
  }

  // Suppression du user via service role (cascade sur toutes les tables)
  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { error: deleteErr } = await adminClient.auth.admin.deleteUser(user.id)
  if (deleteErr) {
    log.error('deleteUserFailed', { err: deleteErr.message, userId: user.id })
    return { error: `Erreur lors de la suppression : ${deleteErr.message}` }
  }

  // Sign out côté client courant (cookies de session)
  await supabase.auth.signOut()

  return {}
}

export async function saveAutresRevenusPro(value: number | null): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié" }

  // Validation : entre 0 et 10M €, ou null pour effacer
  if (value !== null) {
    if (!Number.isFinite(value) || value < 0 || value > 10_000_000) {
      return { error: "Montant invalide (0 à 10 000 000 €)" }
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ autres_revenus_pro: value })
    .eq("id", user.id)

  if (error) return { error: error.message }
  invalidateProfileCache(user.id)
  revalidatePath("/dashboard/profil")
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/simulateurs")
  return {}
}


// ─── Liens plateformes globaux (Airbnb, Booking, Driing, etc.) ─────────

export type PlatformLinksInput = {
  inbox_airbnb_url?: string | null
  inbox_booking_url?: string | null
  inbox_vrbo_url?: string | null
  inbox_abritel_url?: string | null
  inbox_driing_url?: string | null
  inbox_gmb_url?: string | null
  custom_platform_links?: Array<{ label: string; url: string; color?: string }>
}

/**
 * Met à jour les liens plateformes (inbox/dashboard par plateforme +
 * liste libre). Validation URL côté serveur, sinon on remet null.
 */
export async function savePlatformLinks(input: PlatformLinksInput): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Helper : retourne l'URL nettoyée OU null si invalide / vide
  const cleanUrl = (raw: string | null | undefined): string | null => {
    if (!raw) return null
    const trimmed = raw.trim()
    if (trimmed.length === 0) return null
    try {
      const u = new URL(trimmed)
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
      return u.toString()
    } catch {
      return null
    }
  }

  // Valide la liste custom : on supprime entries invalides, garde max 20
  const customSafe = (input.custom_platform_links ?? [])
    .map(item => ({
      label: typeof item?.label === 'string' ? item.label.trim().slice(0, 40) : '',
      url: cleanUrl(item?.url),
      color: typeof item?.color === 'string' && /^#[0-9a-f]{3,8}$/i.test(item.color)
        ? item.color
        : undefined,
    }))
    .filter(item => item.label.length > 0 && item.url !== null)
    .slice(0, 20)

  const patch: Record<string, unknown> = {
    custom_platform_links: customSafe,
  }
  if (input.inbox_airbnb_url !== undefined)  patch.inbox_airbnb_url  = cleanUrl(input.inbox_airbnb_url)
  if (input.inbox_booking_url !== undefined) patch.inbox_booking_url = cleanUrl(input.inbox_booking_url)
  if (input.inbox_vrbo_url !== undefined)    patch.inbox_vrbo_url    = cleanUrl(input.inbox_vrbo_url)
  if (input.inbox_abritel_url !== undefined) patch.inbox_abritel_url = cleanUrl(input.inbox_abritel_url)
  if (input.inbox_driing_url !== undefined)  patch.inbox_driing_url  = cleanUrl(input.inbox_driing_url)
  if (input.inbox_gmb_url !== undefined)     patch.inbox_gmb_url     = cleanUrl(input.inbox_gmb_url)

  const { error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', user.id)

  if (error) return { error: error.message }
  invalidateProfileCache(user.id)
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/profil')
  return {}
}
