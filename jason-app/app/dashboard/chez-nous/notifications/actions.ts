'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  return { supabase, userId: user.id }
}

export async function getUnreadNotifCount(): Promise<number> {
  const { supabase, userId } = await requireAuth()
  const { count } = await supabase
    .from('chez_nous_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .is('read_at', null)
  return count ?? 0
}

export async function markNotifRead(notifId: string): Promise<{ ok: boolean; error?: string }> {
  const { supabase, userId } = await requireAuth()
  const { error } = await supabase
    .from('chez_nous_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notifId)
    .eq('recipient_id', userId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard/chez-nous/notifications')
  return { ok: true }
}

export async function markAllNotifsRead(): Promise<{ ok: boolean; error?: string }> {
  const { supabase, userId } = await requireAuth()
  const { error } = await supabase
    .from('chez_nous_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', userId)
    .is('read_at', null)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard/chez-nous/notifications')
  return { ok: true }
}
