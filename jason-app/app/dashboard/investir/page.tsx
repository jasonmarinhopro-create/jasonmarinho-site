import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import InvestirView from './InvestirView'
import type { InvestorProject } from '@/lib/investor/actions'

export const metadata = { title: 'Espace investisseur — Jason Marinho' }
export const dynamic = 'force-dynamic'

// Espace investisseur : dashboard tourné acquisition (pré-achat), pas
// exploitation. Accessible à tout compte connecté — la 1re sauvegarde de
// projet active l'espace (is_investor). Distinct du dashboard hôte.
export default async function InvestirPage() {
  const profile = await getProfile()
  if (!profile?.userId) redirect('/auth/login')

  const supabase = await createClient()
  const { data } = await supabase
    .from('investor_projects')
    .select('id, nom, pays, ville, type_logement, nb_chambres, mode, prix_achat, mensualite, snapshot, notes, created_at')
    .eq('user_id', profile.userId)
    .order('created_at', { ascending: false })

  return (
    <InvestirView
      projects={(data ?? []) as InvestorProject[]}
      firstName={profile.full_name?.split(' ')[0] ?? null}
    />
  )
}
