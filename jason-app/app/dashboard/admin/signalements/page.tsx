import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js'
import SignalementsAdmin from './SignalementsAdmin'
import ModerationQueue from './ModerationQueue'
import { getModerationQueue } from './moderation-actions'

export const metadata = { title: 'Signalements, Admin' }
export const dynamic = 'force-dynamic'

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

  // Diagnostic visible côté UI : si une de ces conditions est true, on affiche
  // un banner explicite plutôt qu'un mystérieux "0" silencieux.
  let diagnostic: { kind: 'env' | 'query' | 'empty'; msg: string } | null = null

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    diagnostic = { kind: 'env', msg: 'SUPABASE_SERVICE_ROLE_KEY manquant dans les env vars Vercel. Ajoute-le dans Vercel → Settings → Environment Variables.' }
    return <SignalementsAdmin initialReports={[]} diagnostic={diagnostic} />
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    diagnostic = { kind: 'env', msg: 'NEXT_PUBLIC_SUPABASE_URL manquant dans les env vars Vercel.' }
    return <SignalementsAdmin initialReports={[]} diagnostic={diagnostic} />
  }

  const admin = getServiceClient()
  const { data: reports, error: reportsErr, count } = await admin
    .from('reported_guests')
    .select('id, identifier, identifier_type, name, incident_type, is_validated, reporter_city, reporter_id, reported_at, description', { count: 'exact' })
    .order('reported_at', { ascending: false })
    .limit(500)

  console.log(`[SignalementsAdminPage] count=${count ?? 'n/a'} fetched=${reports?.length ?? 0} err=${reportsErr ? JSON.stringify(reportsErr) : 'none'}`)

  if (reportsErr) {
    diagnostic = {
      kind: 'query',
      msg: `Query SELECT échouée : ${reportsErr.message}${reportsErr.hint ? ` (hint: ${reportsErr.hint})` : ''}${reportsErr.code ? ` [code: ${reportsErr.code}]` : ''}`,
    }
  } else if ((reports?.length ?? 0) === 0 && (count ?? 0) === 0) {
    diagnostic = {
      kind: 'empty',
      msg: 'La query a réussi mais la table reported_guests est vide. Si tu vois des reports dans Supabase Studio, vérifie le nom de la table.',
    }
  }

  // Queue de modération des signalements publics anonymisés (Sprint 1 du
  // chantier "signalements publics"). On charge en parallèle de la liste
  // privée historique.
  const moderation = await getModerationQueue()

  return (
    <>
      <ModerationQueue
        pending={moderation.pending}
        removalRequests={moderation.removalRequests}
        approvedCount={moderation.approvedCount}
      />
      <SignalementsAdmin initialReports={reports ?? []} diagnostic={diagnostic} />
    </>
  )
}
