import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import RevenusView from './RevenusView'

export default async function RevenusPage() {
  const profile = await getProfile()
  const supabase = await createClient()

  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, montant_loyer, stripe_payment_status, stripe_payment_enabled, date_arrivee, date_depart, logement_nom, logement_id, statut')
    .eq('user_id', profile?.userId ?? '')
    .neq('statut', 'annule')
    .order('date_arrivee', { ascending: false })

  return (
    <>
      <Header title="Revenus" userName={profile?.full_name ?? undefined} />
      <RevenusView contracts={contracts ?? []} />
    </>
  )
}
