import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/auth-user'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { loadHostMenageSlots, menageKey } from '@/lib/menage/host-slots'
import PlanningMenage, { type PlanningClient, type PlanningSlot } from './PlanningMenage'
import { parisToday, addDaysIso } from '@/lib/stripe/deposit-window'

export const metadata = { title: 'Mes ménages, Équipe ménage' }
export const dynamic = 'force-dynamic'

const DAYS_AHEAD = 13

export default async function Page() {
  const user = await getAuthUser()
  if (!user) redirect('/auth/login?as=menage')

  // Date du jour à Paris (avant : UTC, le planning basculait à 1 h ou 2 h du matin)
  const today = parisToday()
  const fromDate = addDaysIso(today, -1)   // hier (ménages oubliés)
  const toDate = addDaysIso(today, DAYS_AHEAD)

  // Liste des plannings : client utilisateur (la RLS limite à ses propres liens).
  const supabase = await createClient()
  const { data: links, error: linksErr } = await supabase
    .from('menage_links')
    .select('id, host_user_id, host_token, label')
    .order('created_at')
  if (linksErr) {
    return <PlanningMenage clients={[]} slots={[]} today={today} unavailable />
  }

  // Les données des hôtes ne sont PAS lisibles par l'équipe via la RLS :
  // service role, uniquement pour les hôtes dont le lien est valide.
  const db = getServiceClient()
  const hostIds = (links ?? []).map(l => l.host_user_id)
  const { data: hosts } = hostIds.length
    ? await db.from('profiles').select('id, ical_token').in('id', hostIds)
    : { data: [] as Array<{ id: string; ical_token: string | null }> }
  const tokenByHost = new Map((hosts ?? []).map(h => [h.id, h.ical_token]))

  const clients: PlanningClient[] = (links ?? []).map(l => ({
    linkId: l.id,
    hostId: l.host_user_id,
    label: l.label ?? 'Client',
    expired: !tokenByHost.get(l.host_user_id) || tokenByHost.get(l.host_user_id) !== l.host_token,
  }))
  const active = clients.filter(c => !c.expired)

  const perHost = await Promise.all(active.map(async c => {
    const [slots, { data: completions }, { data: hostDone }] = await Promise.all([
      loadHostMenageSlots(db, c.hostId, fromDate, toDate),
      db.from('menage_completions')
        .select('logement_nom, date, note, photos, cleaner_user_id')
        .eq('host_user_id', c.hostId)
        .gte('date', fromDate).lte('date', toDate),
      // Ménages cochés « fait » par l'hôte lui-même dans son Calendrier.
      db.from('calendar_events')
        .select('title, date, description')
        .eq('user_id', c.hostId).eq('category', 'menage')
        .gte('date', fromDate).lte('date', toDate)
        .ilike('description', '%[FAIT]%'),
    ])
    const compByKey = new Map((completions ?? []).map(r => [menageKey(r.date, r.logement_nom), r]))
    const hostDoneDates = (hostDone ?? []) as Array<{ title: string; date: string }>

    return Promise.all(slots.map(async (s): Promise<PlanningSlot> => {
      const comp = compByKey.get(menageKey(s.date, s.logementName))
      let photoUrls: string[] = []
      if (comp?.photos?.length) {
        const { data } = await db.storage.from('menage-photos').createSignedUrls(comp.photos, 3600)
        photoUrls = (data ?? []).map(d => d.signedUrl).filter(Boolean) as string[]
      }
      const doneByHost = !comp && hostDoneDates.some(e => e.date === s.date && e.title.toLowerCase().includes(s.logementName.toLowerCase()))
      return {
        id: `${c.hostId}-${s.id}`,
        hostId: c.hostId,
        clientLabel: c.label,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        logementName: s.logementName,
        adresse: s.adresse,
        notes: s.notes,
        sameDay: s.sameDay,
        prochainCheckIn: s.prochainCheckIn,
        fraisMenage: s.fraisMenage,
        done: comp ? { byMe: comp.cleaner_user_id === user.id, note: comp.note, photoUrls } : doneByHost ? { byMe: false, note: null, photoUrls: [] } : null,
      }
    }))
  }))

  const slots = perHost.flat().sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))

  return (
    <div style={{ padding: 'clamp(20px, 3vw, 44px)', width: '100%' }}>
      <PlanningMenage clients={clients} slots={slots} today={today} />
    </div>
  )
}
