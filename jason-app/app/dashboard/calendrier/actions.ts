'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { fetchAndUpsertIcalFeed } from '@/lib/ical/sync'
import { invalidateDashboardPrefill } from '@/lib/lcd/dashboard-prefill'

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

/**
 * Crée un événement calendrier de catégorie 'menage' à la date donnée.
 * Utilisé par le popover séjour quand l'hôte clique "Marquer ménage fait".
 * Idempotent : si un événement menage existe déjà ce jour-là pour ce
 * logement, on ne crée pas de doublon.
 */
export async function markMenageDone(input: {
  date: string
  logementName: string
  startTime?: string
  endTime?: string
  notes?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non authentifié' }

  // Dédup : un menage déjà saisi le même jour, même logement → no-op
  const { data: existing } = await supabase
    .from('calendar_events')
    .select('id, description')
    .eq('user_id', user.id)
    .eq('date', input.date)
    .eq('category', 'menage')
    .ilike('title', `%${input.logementName}%`)
    .limit(1)
    .maybeSingle()

  if (existing) {
    // Marqué comme fait : on appose "[FAIT]" si pas déjà présent
    const desc = existing.description ?? ''
    if (!desc.includes('[FAIT]')) {
      await supabase
        .from('calendar_events')
        .update({ description: `[FAIT] ${desc}`.trim() })
        .eq('id', existing.id)
    }
    revalidatePath('/dashboard/calendrier')
    return { ok: true }
  }

  const { error } = await supabase
    .from('calendar_events')
    .insert({
      user_id: user.id,
      title: `Ménage · ${input.logementName}`,
      date: input.date,
      end_date: null,
      start_time: input.startTime ?? '11:00',
      end_time: input.endTime ?? '14:00',
      category: 'menage',
      description: `[FAIT]${input.notes ? ' · ' + input.notes : ''}`,
    })

  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard/calendrier')
  return { ok: true }
}

export async function createCalendarEvent(input: EventInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/calendrier')
  return { event: data }
}

export async function updateCalendarEvent(id: string, input: EventUpdate) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('calendar_events')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('contracts')
    .select('checklist_status, sejour_id')
    .eq('id', contractId)
    .eq('user_id', user.id)
    .single()

  if (error) return { error: error.message }

  const current = (data.checklist_status as Record<string, boolean>) ?? {}
  const { error: updateError } = await supabase
    .from('contracts')
    .update({ checklist_status: { ...current, [key]: value } })
    .eq('id', contractId)
    .eq('user_id', user.id)

  // Rafraîchir les deux vues qui affichent cette checklist (calendrier + voyageur)
  revalidatePath('/dashboard/calendrier')
  if (data.sejour_id) {
    const { data: sejourRow } = await supabase
      .from('sejours')
      .select('voyageur_id')
      .eq('id', data.sejour_id)
      .eq('user_id', user.id)
      .single()
    if (sejourRow?.voyageur_id) {
      revalidatePath(`/dashboard/voyageurs/${sejourRow.voyageur_id}`)
    }
  }

  return { error: updateError?.message }
}

export async function deleteCalendarEvent(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/calendrier')
  return { success: true }
}

// ─── Séjours depuis le calendrier ──────────────────────────────────────────

interface SejourFromCalendarInput {
  voyageur_id: string | null
  voyageur_label_libre?: string | null
  logement_id: string
  logement_nom: string
  date_arrivee: string
  date_depart: string
  montant: number | null
  contrat_statut: 'nouveau' | 'en_attente' | 'signe' | 'non_requis'
}

export async function createSejourFromCalendar(input: SejourFromCalendarInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: row, error } = await supabase
    .from('sejours')
    .insert({
      voyageur_id: input.voyageur_id,
      logement: input.logement_nom,
      date_arrivee: input.date_arrivee,
      date_depart: input.date_depart,
      montant: input.montant,
      contrat_statut: input.contrat_statut,
      user_id: user.id,
    })
    .select('id, voyageur_id, logement, date_arrivee, date_depart, montant, contrat_statut')
    .single()

  if (error) return { error: error.message }

  // Récupère le label voyageur pour le retour client (uniquement si voyageur_id présent)
  let voyageurLabel = input.voyageur_label_libre?.trim() || 'Privé'
  if (input.voyageur_id) {
    const { data: voyageur } = await supabase
      .from('voyageurs')
      .select('prenom, nom')
      .eq('id', input.voyageur_id)
      .eq('user_id', user.id)
      .single()
    voyageurLabel = voyageur
      ? `${voyageur.prenom ?? ''} ${voyageur.nom ?? ''}`.trim() || 'Voyageur'
      : 'Voyageur'
  }

  revalidatePath('/dashboard/calendrier')
  if (input.voyageur_id) revalidatePath(`/dashboard/voyageurs/${input.voyageur_id}`)
  await invalidateDashboardPrefill(user.id)

  return {
    sejour: {
      id: row.id,
      voyageur_id: row.voyageur_id,
      voyageur_label: voyageurLabel,
      logement_label: row.logement ?? 'Logement',
      date_arrivee: row.date_arrivee,
      date_depart: row.date_depart,
      montant: row.montant ?? null,
      contrat_statut: row.contrat_statut ?? null,
    },
  }
}

// Update d'un séjour depuis le calendrier (édition rapide : dates + montant).
// Le contrat lié, s'il existe, n'est pas modifié ici (édition via la page voyageur).
export async function updateSejourFromCalendar(input: {
  id: string
  date_arrivee?: string
  date_depart?: string
  montant?: number | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  if (input.date_arrivee && input.date_depart && input.date_depart < input.date_arrivee) {
    return { error: 'La date de départ doit être après la date d\'arrivée.' }
  }

  const patch: Record<string, unknown> = {}
  if (input.date_arrivee !== undefined) patch.date_arrivee = input.date_arrivee
  if (input.date_depart !== undefined)  patch.date_depart  = input.date_depart
  if (input.montant !== undefined)      patch.montant      = input.montant
  if (Object.keys(patch).length === 0)  return { error: 'Aucun champ à modifier.' }

  const { data: row, error } = await supabase
    .from('sejours')
    .update(patch)
    .eq('id', input.id)
    .eq('user_id', user.id)
    .select('id, voyageur_id, logement, date_arrivee, date_depart, montant, contrat_statut')
    .single()

  if (error) return { error: error.message }
  if (!row)  return { error: 'Séjour introuvable.' }

  revalidatePath('/dashboard/calendrier')
  if (row.voyageur_id) revalidatePath(`/dashboard/voyageurs/${row.voyageur_id}`)
  revalidatePath('/dashboard/revenus')
  await invalidateDashboardPrefill(user.id)

  return { sejour: row }
}

// ─── iCal feeds ─────────────────────────────────────────────────────────────

export async function addIcalFeed(input: { name: string; url: string; color: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('ical_feeds')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }
  return { feed: data }
}

export async function removeIcalFeed(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('ical_feeds')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function syncIcalFeed(feedId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: feed } = await supabase
    .from('ical_feeds')
    .select('id, url')
    .eq('id', feedId)
    .eq('user_id', user.id)
    .single()

  if (!feed) return { error: 'Flux introuvable' }

  const result = await fetchAndUpsertIcalFeed(supabase, feedId, feed.url, user.id)
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
