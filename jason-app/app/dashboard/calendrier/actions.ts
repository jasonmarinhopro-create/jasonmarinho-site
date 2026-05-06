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
