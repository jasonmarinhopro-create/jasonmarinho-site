import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js'
import SignalementsAdmin from './SignalementsAdmin'

export const metadata = { title: 'Signalements, Admin' }
export const dynamic = 'force-dynamic'

// Service client pour lire TOUS les signalements (la RLS sur reported_guests
// limite à l'utilisateur courant pour les hôtes, ce qui rendait la vue admin
// vide). Le check du rôle 'admin' est effectué juste au-dessus avant d'appeler.
function getServiceClient(): SupabaseClient<any, 'public', any> {
  return createServiceClient<any, 'public', any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export default async function SignalementsAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // Ici on est admin authentifié → service role pour bypasser RLS et voir tous les reports.
  // Vérification env vars + log explicite si erreur — la page affichait 0 sans erreur
  // visible côté UI, on veut voir le vrai message dans les logs Vercel.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[SignalementsAdminPage] SUPABASE_SERVICE_ROLE_KEY manquant dans les env vars Vercel')
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('[SignalementsAdminPage] NEXT_PUBLIC_SUPABASE_URL manquant dans les env vars Vercel')
  }

  const admin = getServiceClient()
  const { data: reports, error: reportsErr, count } = await admin
    .from('reported_guests')
    .select('id, identifier, identifier_type, name, incident_type, is_validated, reporter_city, reporter_id, reported_at, description, created_at', { count: 'exact' })
    .order('reported_at', { ascending: false })
    .limit(500)

  if (reportsErr) {
    console.error('[SignalementsAdminPage] reported_guests SELECT failed:', JSON.stringify(reportsErr))
  } else {
    console.log(`[SignalementsAdminPage] OK · ${reports?.length ?? 0} rows fetched · total count=${count ?? 'n/a'}`)
  }

  return <SignalementsAdmin initialReports={reports ?? []} />
}
