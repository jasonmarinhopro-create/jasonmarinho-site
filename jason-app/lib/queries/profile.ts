import { cache } from 'react'
import { unstable_cache, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'djason.marinho@gmail.com'
const PROFILE_CACHE_TTL_SECONDS = 300 // 5 min — invalidé via tag à chaque mutation

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/** Tag pour le cache profil d'un utilisateur — utilisé pour l'invalidation. */
export function profileCacheTag(userId: string) {
  return `user-profile-${userId}`
}

/**
 * Invalide le cache profil après une mutation (changement de nom, plan,
 * abonnement, statut Driing, contributeur, IBAN…). À appeler depuis les
 * server actions et webhook handlers qui modifient `profiles`.
 */
export function invalidateProfileCache(userId: string) {
  revalidateTag(profileCacheTag(userId))
}

// Lookup direct profil par userId — service role pour pouvoir s'exécuter
// hors contexte de requête (unstable_cache n'a pas accès aux cookies).
async function fetchProfileData(userId: string) {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('profiles')
    .select('full_name, plan, driing_status, stripe_subscription_id, stripe_subscription_status, stripe_customer_id, is_contributor')
    .eq('id', userId)
    .maybeSingle()
  return data
}

// Wrapper unstable_cache : cache cross-requêtes, invalidation par tag
function getCachedProfileData(userId: string) {
  return unstable_cache(
    () => fetchProfileData(userId),
    ['user-profile', userId],
    { tags: [profileCacheTag(userId)], revalidate: PROFILE_CACHE_TTL_SECONDS },
  )()
}

/**
 * Récupère le profil de l'utilisateur courant.
 * - `cache()` React : 1 seul appel par request (dedup layout + page)
 * - `unstable_cache` : cache cross-request basé sur userId + invalidé par tag
 *   (fini le re-fetch Supabase à chaque navigation pour des données quasi-statiques)
 */
export const getProfile = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const isAdmin = user.email === ADMIN_EMAIL
  const profile = await getCachedProfileData(user.id)

  const isDriingMember = profile?.plan === 'driing' || profile?.driing_status === 'confirmed'
  const resolvedPlan = isAdmin ? 'driing' : (isDriingMember ? 'driing' : (profile?.plan ?? 'decouverte'))

  return {
    userId: user.id,
    full_name: profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? null,
    role: (isAdmin ? 'admin' : 'user') as 'user' | 'driing' | 'admin',
    driing_status: (profile?.driing_status ?? 'none') as 'none' | 'pending' | 'confirmed',
    plan: resolvedPlan as 'decouverte' | 'standard' | 'driing',
    stripe_subscription_id: profile?.stripe_subscription_id ?? null,
    stripe_subscription_status: profile?.stripe_subscription_status ?? null,
    stripe_customer_id: profile?.stripe_customer_id ?? null,
    is_contributor: (isAdmin ? true : (profile?.is_contributor ?? false)),
  }
})
