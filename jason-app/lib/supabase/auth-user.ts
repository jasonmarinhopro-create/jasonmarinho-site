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

export const getAuthUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
