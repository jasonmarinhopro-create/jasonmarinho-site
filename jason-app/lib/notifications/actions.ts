'use server'

// Server actions pour interagir avec les notifications (mark read, etc.)
// Sécurité : on récupère toujours l'utilisateur via getUser() (validation JWT
// côté serveur, conformément à CLAUDE.md), pas getSession().

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function markNotificationRead(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('recipient_id', user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard', 'layout')
  return { ok: true }
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean; count: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, count: 0, error: 'unauthenticated' }

  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', user.id)
    .is('read_at', null)
    .select('id')

  if (error) return { ok: false, count: 0, error: error.message }
  revalidatePath('/dashboard', 'layout')
  return { ok: true, count: data?.length ?? 0 }
}
