import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import RevenusView from './RevenusView'

export default async function RevenusPage() {
  const profile = await getProfile()
  const supabase = await createClient()
  const userId = profile?.userId ?? ''

  const [
    { data: contracts },
    { data: entries },
    { data: logements },
  ] = await Promise.all([
    supabase
      .from('contracts')
      .select('id, montant_loyer, stripe_payment_status, stripe_payment_enabled, date_arrivee, date_depart, logement_nom, logement_id, statut, locataire_prenom, locataire_nom')
      .eq('user_id', userId)
      .neq('statut', 'annule')
      .order('date_arrivee', { ascending: false }),
    supabase
      .from('revenus_entries')
      .select('id, logement_nom, montant, date_paiement, mode_paiement, type_paiement, description')
      .eq('user_id', userId)
      .order('date_paiement', { ascending: false }),
    supabase
      .from('logements')
      .select('nom')
      .eq('user_id', userId),
  ])

  const logementNoms = [
    ...new Set([
      ...(logements ?? []).map(l => l.nom).filter(Boolean),
      ...(contracts ?? []).map(c => c.logement_nom).filter(Boolean),
    ]),
  ] as string[]

  return (
    <>
      <Header title="Revenus" userName={profile?.full_name ?? undefined} />
      <RevenusView
        contracts={contracts ?? []}
        initialEntries={entries ?? []}
        logementNoms={logementNoms}
      />
    </>
  )
}
