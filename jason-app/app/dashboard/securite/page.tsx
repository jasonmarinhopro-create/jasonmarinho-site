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

export default async function SecuritePage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])

  const [{ count: totalAll }, { count: totalPositive }] = await Promise.all([
    supabase
      .from('reported_guests')
      .select('*', { count: 'exact', head: true })
      .eq('is_validated', true),
    supabase
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
