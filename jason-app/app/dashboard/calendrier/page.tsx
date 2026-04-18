import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import CalendrierView from './CalendrierView'

export interface ContractEvent {
  id: string
  title: string
  date: string
  type: 'arrivee' | 'depart'
  logement_nom: string | null
}

export default async function CalendrierPage() {
  const profile = await getProfile()
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('calendar_events')
    .select('id, title, date, start_time, end_time, description, category')
    .eq('user_id', profile?.userId ?? '')
    .order('date')
    .order('start_time')

  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, logement_nom, date_arrivee, date_depart, statut')
    .eq('user_id', profile?.userId ?? '')
    .neq('statut', 'annule')

  const contractEvents: ContractEvent[] = []
  if (contracts) {
    contracts.forEach(c => {
      if (c.date_arrivee) {
        contractEvents.push({
          id: `arr-${c.id}`,
          title: `Arrivée · ${c.logement_nom ?? 'Logement'}`,
          date: c.date_arrivee,
          type: 'arrivee',
          logement_nom: c.logement_nom,
        })
      }
      if (c.date_depart) {
        contractEvents.push({
          id: `dep-${c.id}`,
          title: `Départ · ${c.logement_nom ?? 'Logement'}`,
          date: c.date_depart,
          type: 'depart',
          logement_nom: c.logement_nom,
        })
      }
    })
  }

  return (
    <>
      <Header title="Calendrier" userName={profile?.full_name ?? undefined} />
      <CalendrierView events={events ?? []} contractEvents={contractEvents} />
    </>
  )
}
