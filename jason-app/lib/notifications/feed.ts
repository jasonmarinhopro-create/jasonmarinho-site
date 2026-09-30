// Fil de notifications de l'hôte connecté (SERVER ONLY, client utilisateur :
// la RLS limite chaque table à ses propres lignes). Réunit les alertes de
// l'app, les notifications de Questions & réponses et les dernières
// nouveautés de l'app, dans un seul ordre chronologique.
import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { CHANGELOG } from '@/lib/constants/changelog'
import { displayName } from '@/lib/chez-nous/display'
import { parisToday } from '@/lib/stripe/deposit-window'
import {
  fromAppNotification, fromForumNotification, fromChangelog, sortFeed, CHANGELOG_IN_FEED,
  type FeedItem, type ForumNotifRow,
} from './present'
import type { AppNotification } from './types'

export interface Feed {
  items: FeedItem[]
  today: string
  unread: number
}

export async function loadFeed(opts: { limit?: number; unreadOnly?: boolean } = {}): Promise<Feed> {
  const limit = opts.limit ?? 60
  const today = parisToday()
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { items: [], today, unread: 0 }

    let appQ = supabase.from('notifications')
      .select('id, category, type, title, body, cta_label, cta_href, severity, metadata, dedup_key, read_at, created_at, expires_at')
      .eq('recipient_id', user.id).order('created_at', { ascending: false }).limit(limit)
    let qrQ = supabase.from('chez_nous_notifications')
      .select('id, actor_id, type, post_id, read_at, created_at')
      .eq('recipient_id', user.id).order('created_at', { ascending: false }).limit(Math.min(limit, 40))
    if (opts.unreadOnly) { appQ = appQ.is('read_at', null); qrQ = qrQ.is('read_at', null) }

    const [appRes, qrRes, profRes] = await Promise.all([
      appQ,
      qrQ,
      supabase.from('profiles').select('last_seen_nouveautes_at').eq('id', user.id).maybeSingle(),
    ])

    const now = Date.now()
    const app = ((appRes.data ?? []) as AppNotification[])
      .filter(n => !n.expires_at || new Date(n.expires_at).getTime() > now)
      .map(fromAppNotification)

    const qrRows = (qrRes.data ?? []) as ForumNotifRow[]
    const postIds = Array.from(new Set(qrRows.map(n => n.post_id).filter((x): x is string => !!x)))
    const actorIds = Array.from(new Set(qrRows.map(n => n.actor_id).filter((x): x is string => !!x)))
    const [postsRes, actorsRes] = await Promise.all([
      postIds.length ? supabase.from('chez_nous_posts').select('id, title').in('id', postIds) : Promise.resolve({ data: [] as Array<{ id: string; title: string }> }),
      actorIds.length ? supabase.from('profiles').select('id, full_name, pseudo').in('id', actorIds) : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; pseudo: string | null }> }),
    ])
    const posts = new Map((postsRes.data ?? []).map(p => [p.id, p.title as string]))
    const actors = new Map((actorsRes.data ?? []).map(a => [a.id, displayName(a)]))
    const qr = qrRows.map(n => fromForumNotification(n, n.post_id ? posts.get(n.post_id) ?? null : null, n.actor_id ? actors.get(n.actor_id) ?? null : null))

    const lastSeen = (profRes.data?.last_seen_nouveautes_at as string | null | undefined) ?? null
    const news = fromChangelog(CHANGELOG, lastSeen, CHANGELOG_IN_FEED).filter(i => !opts.unreadOnly || !i.read)

    const items = sortFeed([...app, ...qr, ...news]).slice(0, limit)
    return { items, today, unread: items.filter(i => !i.read).length }
  } catch (e) {
    console.error('[loadFeed]', e)
    return { items: [], today, unread: 0 }
  }
}
