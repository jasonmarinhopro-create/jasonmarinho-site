// Queries client/server pour les notifications utilisateur.
// Côté serveur : utilise le client RLS (l'utilisateur ne voit que les siennes).
// Pas de cache : le compteur de la cloche doit refléter l'état réel.
//
// Défensif : on TRY/CATCH tout pour ne JAMAIS faire crasher un server component
// parent. Si la table est absente, malformée ou si PostgREST rejette la query,
// on log et on retourne tableau vide / 0. Le widget consommateur affiche null.

import { createClient } from '@/lib/supabase/server'
import type { AppNotification } from './types'

export async function getNotifications(opts?: {
  unreadOnly?: boolean
  limit?: number
}): Promise<AppNotification[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('notifications')
      .select('id, category, type, title, body, cta_label, cta_href, severity, metadata, dedup_key, read_at, created_at, expires_at')
      .eq('recipient_id', user.id)
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
    // Filtre des expirées en mémoire (la syntaxe `.or(...gt.<isoDate>)` de
    // PostgREST est fragile à cause des points dans le timestamp — on évite).
    const now = Date.now()
    const fresh = (data ?? []).filter(n => !n.expires_at || new Date(n.expires_at).getTime() > now)
    return fresh as AppNotification[]
  } catch (e) {
    console.error('[getNotifications] crash', e)
    return []
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .is('read_at', null)
    if (error) {
      console.error('[getUnreadCount]', error)
      return 0
    }
    return count ?? 0
  } catch (e) {
    console.error('[getUnreadCount] crash', e)
    return 0
  }
}
