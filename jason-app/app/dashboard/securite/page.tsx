import { getServiceClient } from '@/lib/supabase/service'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import SecuriteView from './SecuriteView'

const POSITIVE_TYPES = [
  'Voyageur exemplaire',
  'Logement laissé impeccable',
  'Communication excellente',
  'Respect total des règles',
  'Je recommande vivement',
]

// Service client : la RLS sur reported_guests filtre par utilisateur courant
// (chaque hôte voit seulement ses propres reports). Mais le COMPTEUR de la
// base communautaire (« 200+ voyageurs signalés par la communauté ») doit
// inclure tous les signalements validés, pas juste les miens. Service role
// pour lecture seule des stats agrégées.

export default async function SecuritePage() {
  const [profile] = await Promise.all([getProfile()])

  // Service role pour les comptes globaux (tous les signalements validés
  // de la communauté, pas que ceux de l'utilisateur courant).
  const admin = getServiceClient()
  const [{ count: totalAll }, { count: totalPositive }] = await Promise.all([
    admin
      .from('reported_guests')
      .select('*', { count: 'exact', head: true })
      .eq('is_validated', true),
    admin
      .from('reported_guests')
      .select('*', { count: 'exact', head: true })
      .eq('is_validated', true)
      .in('incident_type', POSITIVE_TYPES),
  ])

  const total = totalAll ?? 0
  const positive = totalPositive ?? 0
  const negative = total - positive

  return (
    <>
      <SecuriteView totalNegative={negative} totalPositive={positive} />
    </>
  )
}
