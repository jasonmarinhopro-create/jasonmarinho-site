import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/queries/profile'
import PerformancesView from './PerformancesView'

export const dynamic = 'force-dynamic'

export type SejourRow = {
  id: string
  voyageur_id: string | null
  logement: string | null
  date_arrivee: string
  date_depart: string
  montant: number | null
  created_at: string | null
}

export type LogementRow = {
  id: string
  nom: string
  adresse: string | null
  ville: string | null
  prix_nuit: number | null
}

export type VoyageurMin = {
  id: string
  source: string | null
}

export default async function PerformancesPage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')

  const supabase = await createClient()

  const [sejoursRes, logementsRes, voyageursRes] = await Promise.all([
    supabase
      .from('sejours')
      .select('id, voyageur_id, logement, date_arrivee, date_depart, montant, created_at')
      .eq('user_id', profile.userId)
      .order('date_arrivee', { ascending: false }),
    supabase
      .from('logements')
      .select('id, nom, adresse, ville, prix_nuit')
      .eq('user_id', profile.userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('voyageurs')
      .select('id, source')
      .eq('user_id', profile.userId),
  ])

  const sejours: SejourRow[] = (sejoursRes.data ?? []) as SejourRow[]
  const logements: LogementRow[] = (logementsRes.data ?? []) as LogementRow[]
  const voyageurs: VoyageurMin[] = (voyageursRes.data ?? []) as VoyageurMin[]

  return (
    <PerformancesView
      sejours={sejours}
      logements={logements}
      voyageurs={voyageurs}
    />
  )
}
