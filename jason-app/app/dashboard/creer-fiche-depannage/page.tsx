import { getServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { founderSeatFilter, FOUNDER_QUOTA } from '@/lib/pros/founder-seats'
import { getAuthIdentity } from '@/lib/supabase/auth-user'
import { METIERS } from '@/lib/pros/metiers'
import CreerFicheDepannage from './CreerFicheDepannage'

export const metadata = { title: 'Créer ma fiche dépannage' }
export const dynamic = 'force-dynamic'

const M = METIERS.depannage

export default async function Page() {
  const user = await getAuthIdentity()
  if (!user) redirect('/auth/login?as=depannage')

  const admin = getServiceClient()
  const { data: existing } = await admin.from(M.table).select('id').eq('user_id', user.id).maybeSingle()
  if (existing) redirect(M.espace)

  const [{ data: profile }, { count: founderCount }] = await Promise.all([
    admin.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle(),
    admin.from(M.table).select('id', { count: 'exact', head: true }).eq('tier', 'fondateur').or(founderSeatFilter()),
  ])
  const tier: 'fondateur' | 'standard' = (founderCount ?? 0) < FOUNDER_QUOTA ? 'fondateur' : 'standard'
  // Métier pas encore ouvert : « Bientôt » pour tous, sauf l'admin qui teste
  const bientot = !M.ouvert && profile?.role !== 'admin'

  return <CreerFicheDepannage email={user.email ?? ''} defaultFullName={profile?.full_name ?? ''} tier={tier} bientot={bientot} />
}
