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
