'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface EventInput {
  title: string
  date: string
  start_time: string | null
  end_time: string | null
  category: string
  description: string | null
}

interface EventUpdate {
  title: string
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
