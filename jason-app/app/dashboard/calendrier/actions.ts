'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { fetchAndUpsertIcalFeed } from '@/lib/ical/sync'

// ─── Custom events ──────────────────────────────────────────────────────────

interface EventInput {
  title: string
  date: string
  end_date: string | null
  start_time: string | null
  end_time: string | null
  category: string
  description: string | null
}

interface EventUpdate {
  title: string
  end_date: string | null
  start_time: string | null
  end_time: string | null
  category: string
  description: string | null
}

export async function createCalendarEvent(input: EventInput) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({ ...input, user_id: session.user.id })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/calendrier')
  return { event: data }
}

export async function updateCalendarEvent(id: string, input: EventUpdate) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('calendar_events')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/calendrier')
  return { event: data }
}

export async function updateContractChecklist(
  contractId: string,
  key: string,
  value: boolean,
) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('contracts')
    .select('checklist_status, sejour_id')
    .eq('id', contractId)
    .eq('user_id', session.user.id)
    .single()

  if (error) return { error: error.message }

  const current = (data.checklist_status as Record<string, boolean>) ?? {}
  const { error: updateError } = await supabase
    .from('contracts')
    .update({ checklist_status: { ...current, [key]: value } })
    .eq('id', contractId)
    .eq('user_id', session.user.id)

  // Rafraîchir les deux vues qui affichent cette checklist (calendrier + voyageur)
  revalidatePath('/dashboard/calendrier')
  if (data.sejour_id) {
    const { data: sejourRow } = await supabase
      .from('sejours')
      .select('voyageur_id')
      .eq('id', data.sejour_id)
      .eq('user_id', session.user.id)
      .single()
    if (sejourRow?.voyageur_id) {
      revalidatePath(`/dashboard/voyageurs/${sejourRow.voyageur_id}`)
    }
  }

  return { error: updateError?.message }
}

export async function deleteCalendarEvent(id: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/calendrier')
  return { success: true }
}

// ─── Séjours depuis le calendrier ──────────────────────────────────────────

interface SejourFromCalendarInput {
  voyageur_id: string
  logement_id: string
  logement_nom: string
  date_arrivee: string
  date_depart: string
  montant: number | null
  contrat_statut: 'nouveau' | 'en_attente' | 'signe' | 'non_requis'
}

export async function createSejourFromCalendar(input: SejourFromCalendarInput) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { data: row, error } = await supabase
    .from('sejours')
    .insert({
      voyageur_id: input.voyageur_id,
      logement: input.logement_nom,
      date_arrivee: input.date_arrivee,
      date_depart: input.date_depart,
      montant: input.montant,
      contrat_statut: input.contrat_statut,
      user_id: session.user.id,
    })
    .select('id, voyageur_id, logement, date_arrivee, date_depart, montant, contrat_statut')
    .single()

  if (error) return { error: error.message }

  // Récupère le label voyageur pour le retour client
  const { data: voyageur } = await supabase
    .from('voyageurs')
    .select('prenom, nom')
    .eq('id', input.voyageur_id)
    .eq('user_id', session.user.id)
    .single()

  revalidatePath('/dashboard/calendrier')
  revalidatePath(`/dashboard/voyageurs/${input.voyageur_id}`)

  return {
    sejour: {
      id: row.id,
      voyageur_id: row.voyageur_id,
      voyageur_label: voyageur
        ? `${voyageur.prenom ?? ''} ${voyageur.nom ?? ''}`.trim() || 'Voyageur'
        : 'Voyageur',
      logement_label: row.logement ?? 'Logement',
      date_arrivee: row.date_arrivee,
      date_depart: row.date_depart,
      montant: row.montant ?? null,
      contrat_statut: row.contrat_statut ?? null,
    },
  }
}

// ─── iCal feeds ─────────────────────────────────────────────────────────────

export async function addIcalFeed(input: { name: string; url: string; color: string }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('ical_feeds')
    .insert({ ...input, user_id: session.user.id })
    .select()
    .single()

  if (error) return { error: error.message }
  return { feed: data }
}

export async function removeIcalFeed(id: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('ical_feeds')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function syncIcalFeed(feedId: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { data: feed } = await supabase
    .from('ical_feeds')
    .select('id, url')
    .eq('id', feedId)
    .eq('user_id', session.user.id)
    .single()

  if (!feed) return { error: 'Flux introuvable' }

  const result = await fetchAndUpsertIcalFeed(supabase, feedId, feed.url, session.user.id)
  if (result.synced) revalidatePath('/dashboard/calendrier')
  return result
}

// ─── Export iCal (lien public sécurisé par token) ─────────────────────────────

export async function generateIcalToken() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const token = crypto.randomUUID()
  const { error } = await supabase
    .from('profiles')
    .update({ ical_token: token })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/calendrier')
  return { token }
}

export async function revokeIcalToken() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('profiles')
    .update({ ical_token: null })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/calendrier')
  return { ok: true }
}
