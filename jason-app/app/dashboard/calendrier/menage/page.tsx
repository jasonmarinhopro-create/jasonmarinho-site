import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { loadHostMenageSlots, menageKey } from '@/lib/menage/host-slots'
import CalendrierTabBar from '../CalendrierTabBar'
import MenageHostView, { type HostMenageSlot, type HostTeam } from './MenageHostView'

export const metadata = { title: 'Ménage' }
export const dynamic = 'force-dynamic'

const DAYS_AHEAD = 13

function iso(d: Date) { return d.toISOString().slice(0, 10) }

// Vue « Ménage » de l'hôte (sept. 2026) : les ménages des 2 prochaines
// semaines, générés depuis ses réservations, avec leur état (fait par
// l'équipe avec photos, coché par l'hôte, ou à faire) et le partage du
// planning. Même source que le flux iCal et l'espace de l'équipe.
export default async function MenagePage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])
  if (!profile) return null
  const userId = profile.userId

  const today = new Date()
  const fromDate = iso(new Date(today.getTime() - 86_400_000))   // hier : ménage oublié ?
  const toDate = iso(new Date(today.getTime() + DAYS_AHEAD * 86_400_000))

  // Données de l'hôte lui-même : client utilisateur (RLS).
  const [slots, { data: completions }, { data: doneEvents }, { data: prof }] = await Promise.all([
    loadHostMenageSlots(supabase, userId, fromDate, toDate),
    supabase.from('menage_completions')
      .select('id, logement_nom, date, cleaner_user_id, photos')
      .eq('host_user_id', userId)
      .gte('date', fromDate).lte('date', toDate),
    supabase.from('calendar_events')
      .select('title, date')
      .eq('user_id', userId).eq('category', 'menage')
      .gte('date', fromDate).lte('date', toDate)
      .ilike('description', '%[FAIT]%'),
    supabase.from('profiles').select('ical_token').eq('id', userId).maybeSingle(),
  ])
  const icalToken = (prof?.ical_token as string | null) ?? null

  // Équipes qui suivent ce planning + noms de qui a validé : comptes d'autres
  // utilisateurs, non lisibles via la RLS de l'hôte → service role, filtré
  // explicitement sur cet hôte.
  const db = getServiceClient()
  const { data: links } = await db
    .from('menage_links')
    .select('cleaner_user_id, host_token')
    .eq('host_user_id', userId)
  const cleanerIds = Array.from(new Set([
    ...(links ?? []).map(l => l.cleaner_user_id as string),
    ...(completions ?? []).map(c => c.cleaner_user_id as string | null).filter((v): v is string => !!v),
  ]))
  const { data: cleaners } = cleanerIds.length
    ? await db.from('cleaners').select('user_id, full_name').in('user_id', cleanerIds)
    : { data: [] as Array<{ user_id: string; full_name: string | null }> }
  const nameOf = new Map((cleaners ?? []).map(c => [c.user_id as string, (c.full_name as string | null) ?? 'Équipe de ménage']))

  const teams: HostTeam[] = (links ?? []).map(l => ({
    name: nameOf.get(l.cleaner_user_id) ?? 'Équipe de ménage',
    active: !!icalToken && l.host_token === icalToken,
  }))

  const compByKey = new Map((completions ?? []).map(c => [menageKey(c.date, c.logement_nom), c]))
  const hostDone = (doneEvents ?? []) as Array<{ title: string; date: string }>

  const view: HostMenageSlot[] = slots.map(s => {
    const comp = compByKey.get(menageKey(s.date, s.logementName))
    const low = s.logementName.trim().toLowerCase()
    const doneByHost = hostDone.some(e => e.date === s.date && e.title.toLowerCase().includes(low))
    return {
      id: s.id,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      logementName: s.logementName,
      adresse: s.adresse,
      notes: s.notes,
      sameDay: s.sameDay,
      voyageurSortant: s.voyageurSortant,
      voyageurEntrant: s.voyageurEntrant,
      fraisMenage: s.fraisMenage,
      done: comp
        ? { by: comp.cleaner_user_id ? nameOf.get(comp.cleaner_user_id) ?? 'Équipe de ménage' : 'Équipe de ménage', completionId: comp.id, photos: comp.photos?.length ?? 0 }
        : doneByHost ? { by: null, completionId: null, photos: 0 } : null,
    }
  })

  return (
    <>
      <CalendrierTabBar />
      <MenageHostView
        slots={view}
        teams={teams}
        icalToken={icalToken}
        appUrl={process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'}
        today={iso(today)}
      />
    </>
  )
}
