import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import PartenairesView from './PartenairesView'

export default async function PartenairesPage() {
  const profile = await getProfile()
  const supabase = await createClient()
  const plan = profile?.plan ?? 'decouverte'

  // Partenaires additionnels hors Driing (actifs dans la DB)
  const { data: additionalPartners } = await supabase
    .from('partners')
    .select('id, name, description, advantage, promo_code, url, category')
    .eq('is_active', true)
    .order('name')

  return (
    <>
      <Header title="Partenaires" userName={profile?.full_name ?? undefined} />
      <PartenairesView additionalPartners={additionalPartners ?? []} plan={plan} />
    </>
  )
}
