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

// NB : pas de `count: 'exact', head: true` ici — il faudrait alors filtrer
// l'expiration côté DB, et la syntaxe `.or(...)` de PostgREST est fragile à
// cause des points dans le timestamp (cf. getNotifications ci-dessus). On
// récupère donc les lignes non lues (volume faible, par utilisateur) et on
// filtre les expirées en mémoire, comme getNotifications — sinon une
// notification expirée mais jamais purgée (purge quotidienne seulement,
// cf. cron notifications-engine) reste comptée dans le badge alors qu'elle
// est déjà invisible dans le panneau, ce qui affiche un badge "fantôme".
export async function getUnreadCount(): Promise<number> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0
    const { data, error } = await supabase
      .from('notifications')
      .select('id, expires_at')
      .eq('recipient_id', user.id)
      .is('read_at', null)
    if (error) {
      console.error('[getUnreadCount]', error)
      return 0
    }
    const now = Date.now()
    return (data ?? []).filter(n => !n.expires_at || new Date(n.expires_at).getTime() > now).length
  } catch (e) {
    console.error('[getUnreadCount] crash', e)
    return 0
  }
}

// Compteur non lu du forum Entre Hôtes (chez_nous_notifications) — pas de
// notion d'expiration sur cette table, un count exact DB suffit.
export async function getChezNousUnreadCount(): Promise<number> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0
    const { count, error } = await supabase
      .from('chez_nous_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .is('read_at', null)
    if (error) {
      console.error('[getChezNousUnreadCount]', error)
      return 0
    }
    return count ?? 0
  } catch (e) {
    console.error('[getChezNousUnreadCount] crash', e)
    return 0
  }
}
