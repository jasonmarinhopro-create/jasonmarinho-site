import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import CalendrierView from './CalendrierView'

export interface ContractEvent {
  id: string
  contractId: string
  title: string
  date: string
  type: 'arrivee' | 'depart'
  logement_nom: string | null
  date_arrivee: string
  date_depart: string | null
  checklist_status: Record<string, boolean>
}

export interface IcalFeed {
  id: string
  name: string
  url: string
  color: string
  last_synced: string | null
}

export interface IcalEvent {
  id: string
  feed_id: string
  title: string
  start_date: string
  end_date: string | null
  start_time: string | null
  end_time: string | null
  description: string | null
  feed_color: string
}

export default async function CalendrierPage() {
  const profile = await getProfile()
  const supabase = await createClient()
  const userId = profile?.userId ?? ''

  const [
    { data: events },
    { data: contracts },
    { data: feeds },
    { data: icalEventsRaw },
    { data: profileData },
  ] = await Promise.all([
    supabase
      .from('calendar_events')
      .select('id, title, date, end_date, start_time, end_time, description, category')
      .eq('user_id', userId)
      .order('date')
      .order('start_time'),
    supabase
      .from('contracts')
      .select('id, logement_nom, date_arrivee, date_depart, statut, checklist_status')
      .eq('user_id', userId)
      .neq('statut', 'annule'),
    supabase
      .from('ical_feeds')
      .select('id, name, url, color, last_synced')
      .eq('user_id', userId)
      .order('created_at'),
    supabase
      .from('ical_events')
      .select('id, feed_id, title, start_date, end_date, start_time, end_time, description, ical_feeds(color)')
      .eq('user_id', userId),
    supabase
      .from('profiles')
      .select('ical_token')
      .eq('id', userId)
      .single(),
  ])

  const contractEvents: ContractEvent[] = []
  contracts?.forEach(c => {
    const cl = (c.checklist_status as Record<string, boolean>) ?? {}
    if (c.date_arrivee) contractEvents.push({
      id: `arr-${c.id}`, contractId: c.id,
      title: `Arrivée · ${c.logement_nom ?? 'Logement'}`,
      date: c.date_arrivee, type: 'arrivee', logement_nom: c.logement_nom,
      date_arrivee: c.date_arrivee, date_depart: c.date_depart ?? null,
      checklist_status: cl,
    })
    if (c.date_depart) contractEvents.push({
      id: `dep-${c.id}`, contractId: c.id,
      title: `Départ · ${c.logement_nom ?? 'Logement'}`,
      date: c.date_depart!, type: 'depart', logement_nom: c.logement_nom,
      date_arrivee: c.date_arrivee ?? '', date_depart: c.date_depart ?? null,
      checklist_status: cl,
    })
  })

  const icalEvents: IcalEvent[] = (icalEventsRaw ?? []).map((e: any) => ({
    id: e.id, feed_id: e.feed_id, title: e.title,
    start_date: e.start_date, end_date: e.end_date,
    start_time: e.start_time, end_time: e.end_time,
    description: e.description,
    feed_color: (e.ical_feeds as any)?.color ?? '#60a5fa',
  }))

  const icalToken: string | null = (profileData as any)?.ical_token ?? null

  return (
    <>
      <Header title="Calendrier" userName={profile?.full_name ?? undefined} />
      <CalendrierView
        events={events ?? []}
        contractEvents={contractEvents}
        icalFeeds={feeds ?? []}
        icalEvents={icalEvents}
        icalToken={icalToken}
        appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ''}
      />
    </>
  )
}
