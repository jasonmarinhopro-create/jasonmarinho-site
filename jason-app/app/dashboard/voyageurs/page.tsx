import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import VoyageursView from './VoyageursView'

export default async function VoyageursPage() {
  const profile = await getProfile()
  if (!profile) return null

  const supabase = await createClient()

  const { data: voyageurs, error } = await supabase
    .from('voyageurs')
    .select('id, prenom, nom, email, telephone, notes, created_at, updated_at, sejours(id, date_arrivee, date_depart)')
    .eq('user_id', profile.userId)
    .order('updated_at', { ascending: false })
    .limit(500)

  // Table manquante → affiche quand même la vue (état vide avec message clair)
  if (error && error.code !== '42P01') console.error('[voyageurs]', error.message)

  const list = (voyageurs ?? []) as Array<{
    id: string; prenom: string; nom: string; email: string | null
    telephone: string | null; notes: string | null; created_at: string; updated_at: string
    sejours: Array<{ id: string; date_arrivee: string; date_depart: string }>
    is_flagged: boolean
  }>

  // Croiser avec reported_guests pour badge "Signalé"
  const identifiers = list.flatMap(v =>
    [v.email?.toLowerCase(), v.telephone].filter(Boolean) as string[]
  )
  if (identifiers.length > 0) {
    const { data: reported } = await supabase
      .from('reported_guests')
      .select('identifier')
      .in('identifier', identifiers)
      .eq('is_validated', true)

    const flagged = new Set((reported ?? []).map(r => r.identifier))
    list.forEach(v => {
      v.is_flagged = !!(
        (v.email && flagged.has(v.email.toLowerCase())) ||
        (v.telephone && flagged.has(v.telephone))
      )
    })
  }

  return (
    <>
      <Header title="Mes Voyageurs" userName={profile.full_name ?? undefined} />
      <VoyageursView voyageurs={list} tableReady={!error} />
    </>
  )
}
