import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/queries/profile'
import { getEncaissementsSummary, deriveImpayes } from '@/lib/stripe/connect-queries'
import EncaissementsView from './EncaissementsView'

// Données Stripe en temps réel : pas de cache, l'hôte veut voir l'état exact.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EncaissementsPage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')

  const supabase = await createClient()

  // Récup stripe_account_id séparé (pas dans getProfile pour éviter de surcharger
  // le cache profil avec un champ peu fréquent).
  const { data: profRow } = await supabase
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', profile.userId)
    .maybeSingle()

  const stripeAccountId = profRow?.stripe_account_id ?? null

  // Stripe + contrats impayés en parallèle
  const [stripeSummary, { data: contracts }] = await Promise.all([
    getEncaissementsSummary(stripeAccountId),
    supabase
      .from('contracts')
      .select('id, locataire_prenom, locataire_nom, locataire_email, logement_nom, montant_loyer, date_arrivee, date_depart, statut, stripe_payment_status, stripe_payment_enabled')
      .eq('user_id', profile.userId)
      .neq('statut', 'annule')
      .order('date_arrivee', { ascending: false })
      .limit(50),
  ])

  const impayes = deriveImpayes(contracts ?? [])

  return (
    <EncaissementsView
      summary={stripeSummary}
      impayes={impayes}
      planLabel={profile.plan}
    />
  )
}
