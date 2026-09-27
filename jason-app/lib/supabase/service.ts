// Client Supabase « service role » : contourne TOUTES les règles d'accès (RLS).
//
// SERVER ONLY (import 'server-only' fait échouer le build si ce fichier est
// importé par un composant client, ce qui exposerait la logique d'accès).
//
// Règles d'usage (cf. CLAUDE.md, « Clé service role ») :
//  1. Préférer le client utilisateur (`@/lib/supabase/server`) : la RLS
//     protège alors les données même si une requête oublie un filtre.
//  2. N'utiliser ce client que quand c'est nécessaire : routes publiques à
//     jeton (contrat, check-in, flux iCal), crons, webhooks, vues admin après
//     vérification du rôle, écritures croisées entre comptes (ex : l'équipe
//     de ménage marque « terminé » chez son client).
//  3. Toujours filtrer explicitement par l'utilisateur ou la ressource
//     autorisée (eq('user_id', …)), jamais de lecture « ouverte ».
import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cached: SupabaseClient<any, 'public', any> | null = null

export function getServiceClient(): SupabaseClient<any, 'public', any> {
  if (cached) return cached
  cached = createClient<any, 'public', any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  return cached
}
