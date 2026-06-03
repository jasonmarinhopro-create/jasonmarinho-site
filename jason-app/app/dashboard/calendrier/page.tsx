import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import CalendrierView from './CalendrierView'
import OnboardingTour, { CALENDRIER_STEPS } from '../OnboardingTour'
import { computeMenageSlots, type Occupation, type LogementSettings, type MenageSlot } from '@/lib/menage/compute'
import { isBlockedIcalEvent } from '@/lib/ical/blocked'

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

export interface SejourEvent {
  id: string
  voyageur_id: string | null
  voyageur_label: string
  logement_label: string
  date_arrivee: string
  date_depart: string
  montant: number | null
  contrat_statut: string | null
}

export interface VoyageurOption {
  id: string
  label: string
}

export interface LogementOption {
  id: string
  nom: string
}

export type { MenageSlot } from '@/lib/menage/compute'

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
    { data: sejoursRaw },
    { data: voyageursRaw },
    { data: logementsRaw },
  ] = await Promise.all([
    supabase
      .from('calendar_events')
      .select('id, title, date, end_date, start_time, end_time, description, category')
      .eq('user_id', userId)
      .order('date')
      .order('start_time'),
    supabase
      .from('contracts')
      .select('id, logement_nom, date_arrivee, date_depart, statut, checklist_status, sejour_id')
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
    supabase
      .from('sejours')
      .select('id, voyageur_id, logement, date_arrivee, date_depart, montant, contrat_statut, voyageurs(prenom, nom)')
      .eq('user_id', userId)
      .not('date_arrivee', 'is', null)
      .not('date_depart', 'is', null),
    supabase
      .from('voyageurs')
      .select('id, prenom, nom')
      .eq('user_id', userId)
      .order('prenom'),
    supabase
      .from('logements')
      .select('id, nom, adresse, menage_duree_min, menage_heure_defaut, menage_notes, contact_menage_nom, contact_menage_tel, frais_menage')
      .eq('user_id', userId)
      .order('nom'),
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

  // Séjours déjà couverts par un contrat actif → on les masque pour éviter le doublon
  const sejourIdsWithContract = new Set(
    (contracts ?? [])
      .map(c => (c as any).sejour_id as string | null)
      .filter((v): v is string => !!v)
  )

  const sejourEvents: SejourEvent[] = (sejoursRaw ?? [])
    .filter((s: any) => !sejourIdsWithContract.has(s.id))
    .map((s: any) => {
      const v = s.voyageurs as { prenom?: string; nom?: string } | null
      const voyageurLabel = v
        ? `${v.prenom ?? ''} ${v.nom ?? ''}`.trim() || 'Voyageur'
        : s.voyageur_id ? 'Voyageur' : 'Privé'
      return {
        id: s.id,
        voyageur_id: s.voyageur_id ?? null,
        voyageur_label: voyageurLabel,
        logement_label: s.logement ?? 'Logement',
        date_arrivee: s.date_arrivee,
        date_depart: s.date_depart,
        montant: s.montant ?? null,
        contrat_statut: s.contrat_statut ?? null,
      }
    })

  const icalEvents: IcalEvent[] = (icalEventsRaw ?? []).map((e: any) => ({
    id: e.id, feed_id: e.feed_id, title: e.title,
    start_date: e.start_date, end_date: e.end_date,
    start_time: e.start_time, end_time: e.end_time,
    description: e.description,
    feed_color: (e.ical_feeds as any)?.color ?? 'var(--info)',
  }))

  const voyageurOptions: VoyageurOption[] = (voyageursRaw ?? []).map((v: any) => ({
    id: v.id,
    label: `${v.prenom ?? ''} ${v.nom ?? ''}`.trim() || 'Voyageur sans nom',
  }))

  const logementOptions: LogementOption[] = (logementsRaw ?? []).map((l: any) => ({
    id: l.id,
    nom: l.nom ?? 'Logement',
  }))

  // ── Calcul des créneaux ménage auto ─────────────────────────────────────
  // On fusionne contracts + sejours + ical events pour avoir TOUTES les
  // occupations (la femme de ménage doit nettoyer entre chaque, peu importe
  // le canal). Les contracts annulés sont déjà filtrés en amont.
  const allLogementSettings: LogementSettings[] = (logementsRaw ?? []).map((l: any) => ({
    id: l.id,
    nom: l.nom ?? 'Logement',
    menageDureeMin: l.menage_duree_min ?? 180,
    menageHeureDefaut: l.menage_heure_defaut ?? '11:00',
    menageNotes: l.menage_notes ?? null,
    adresse: l.adresse ?? null,
    contactMenageNom: l.contact_menage_nom ?? null,
    contactMenageTel: l.contact_menage_tel ?? null,
    fraisMenage: l.frais_menage ?? null,
  }))

  const occupations: Occupation[] = []
  for (const c of contracts ?? []) {
    if (!c.date_arrivee || !c.date_depart) continue
    occupations.push({
      sourceId: `contract-${c.id}`,
      source: 'contract',
      logementName: c.logement_nom ?? '',
      dateArrivee: c.date_arrivee,
      dateDepart: c.date_depart,
      voyageurLabel: null,
    })
  }
  for (const s of (sejoursRaw ?? []) as any[]) {
    if (!s.date_arrivee || !s.date_depart) continue
    // Skip si déjà couvert par un contrat (sinon doublon dans la planification)
    if (sejourIdsWithContract.has(s.id)) continue
    const v = s.voyageurs as { prenom?: string; nom?: string } | null
    const voyageurLabel = v
      ? `${v.prenom ?? ''} ${v.nom ?? ''}`.trim() || null
      : null
    occupations.push({
      sourceId: `sejour-${s.id}`,
      source: 'sejour',
      logementName: s.logement ?? '',
      dateArrivee: s.date_arrivee,
      dateDepart: s.date_depart,
      voyageurLabel,
    })
  }
  // Note : les events iCal n'ont PAS de logement explicite — ils sont liés à
  // un feed qui correspond à 1 logement. On peut faire ce mapping plus tard.
  // Pour l'instant, on s'appuie uniquement sur contracts + sejours qui ont
  // bien un logement_nom / logement.

  const menageSlots: MenageSlot[] = computeMenageSlots(occupations, allLogementSettings)

  const icalToken: string | null = (profileData as any)?.ical_token ?? null

  return (
    <>
      <OnboardingTour userId={userId} steps={CALENDRIER_STEPS} storageScope="calendrier" />
      <CalendrierView
        events={events ?? []}
        contractEvents={contractEvents}
        icalFeeds={feeds ?? []}
        icalEvents={icalEvents}
        sejourEvents={sejourEvents}
        voyageurOptions={voyageurOptions}
        logementOptions={logementOptions}
        menageSlots={menageSlots}
        icalToken={icalToken}
        hostName={profile?.full_name ?? null}
        appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ''}
      />
    </>
  )
}
