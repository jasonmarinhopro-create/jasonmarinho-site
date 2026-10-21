// SERVER ONLY — utilisateur authentifié, dédupliqué par rendu.
//
// PERF : supabase.auth.getUser() fait UN ALLER-RETOUR réseau vers l'Auth
// Supabase à chaque appel. getProfile, getUserSpaces et getActiveProperty
// l'appelaient chacun de leur côté → 3 RTT d'auth par rendu du layout
// dashboard (dont un séquentiel avant les autres). React cache() garantit
// UN SEUL appel par requête serveur, partagé par tous les consommateurs.
//
// Sécurité inchangée : c'est toujours getUser() (validation JWT côté
// serveur Supabase), conformément aux conventions du projet — simplement
// pas répété N fois dans le même rendu.

import { cache } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export interface AuthIdentity {
  id: string
  email: string | null
  user_metadata: Record<string, unknown>
}

// Verify the JWT and return only the identity fields used by read paths.
// Asymmetric signing keys use cached JWKS; symmetric keys retain server verification.
export const getAuthIdentity = cache(async (): Promise<AuthIdentity | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data || typeof data.claims?.sub !== 'string') return null

  const claims = data.claims as unknown as Record<string, unknown>
  const rawMetadata = claims.user_metadata
  const userMetadata = rawMetadata && typeof rawMetadata === 'object' && !Array.isArray(rawMetadata)
    ? rawMetadata as Record<string, unknown>
    : {}

  return {
    id: claims.sub as string,
    email: typeof claims.email === 'string' ? claims.email : null,
    user_metadata: userMetadata,
  }
})

export const getAuthUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
