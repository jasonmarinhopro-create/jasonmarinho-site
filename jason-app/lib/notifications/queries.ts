// Queries client/server pour les notifications utilisateur.
// Côté serveur : utilise le client RLS (l'utilisateur ne voit que les siennes).
// Pas de cache : le compteur de la cloche doit refléter l'état réel.

import { createClient } from '@/lib/supabase/server'
import type { AppNotification } from './types'

export async function getNotifications(opts?: {
  unreadOnly?: boolean
  limit?: number
}): Promise<AppNotification[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('notifications')
    .select('id, category, type, title, body, cta_label, cta_href, severity, metadata, dedup_key, read_at, created_at, expires_at')
    .eq('recipient_id', user.id)
    // On filtre les expirées côté query pour ne jamais les afficher même si la purge n'a pas tourné
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(opts?.limit ?? 30)

  if (opts?.unreadOnly) {
    query = query.is('read_at', null)
  }

  const { data, error } = await query
  if (error) {
    console.error('[getNotifications]', error)
    return []
  }
  return (data ?? []) as AppNotification[]
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .is('read_at', null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
  if (error) {
    console.error('[getUnreadCount]', error)
    return 0
  }
  return count ?? 0
}
