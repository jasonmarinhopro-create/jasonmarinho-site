'use server'

// Marquer des notifications comme lues (alertes de l'app, Questions &
// réponses, nouveautés de l'app). Toujours getUser() : le JWT est vérifié côté
// serveur. Le badge et les listes sont mis à jour côté client de façon
// optimiste (événement 'notif-count-changed') : pas de revalidation du layout,
// qui referait tout le rendu du dashboard à chaque clic.
import { createClient } from '@/lib/supabase/server'
import { invalidateProfileCache } from '@/lib/queries/profile'

type Result = { ok: boolean; error?: string }

/** Clés du fil : `app:<id>`, `qr:<id>`, `changelog:<id>` */
export async function markFeedRead(keys: string[]): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthenticated' }
  const ids = (prefix: string) => keys.filter(k => k.startsWith(prefix)).map(k => k.slice(prefix.length)).filter(Boolean).slice(0, 200)
  const app = ids('app:')
  const qr = ids('qr:')
  const news = ids('changelog:')
  const now = new Date().toISOString()
  const ops: Array<PromiseLike<{ error: { message: string } | null }>> = []
  if (app.length) ops.push(supabase.from('notifications').update({ read_at: now }).eq('recipient_id', user.id).in('id', app).is('read_at', null))
  if (qr.length) ops.push(supabase.from('chez_nous_notifications').update({ read_at: now }).eq('recipient_id', user.id).in('id', qr).is('read_at', null))
  if (news.length) ops.push(supabase.from('profiles').update({ last_seen_nouveautes_at: now }).eq('id', user.id))
  const res = await Promise.all(ops)
  const err = res.find(r => r.error)?.error
  if (news.length) invalidateProfileCache(user.id)
  return err ? { ok: false, error: err.message } : { ok: true }
}

export async function markNotificationRead(id: string): Promise<Result> {
  return markFeedRead([`app:${id}`])
}

/** Tout marquer comme lu : alertes, Questions & réponses et nouveautés */
export async function markAllNotificationsRead(): Promise<Result & { count: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, count: 0, error: 'unauthenticated' }
  const now = new Date().toISOString()
  const [a, q, p] = await Promise.all([
    supabase.from('notifications').update({ read_at: now }).eq('recipient_id', user.id).is('read_at', null).select('id'),
    supabase.from('chez_nous_notifications').update({ read_at: now }).eq('recipient_id', user.id).is('read_at', null).select('id'),
    supabase.from('profiles').update({ last_seen_nouveautes_at: now }).eq('id', user.id),
  ])
  invalidateProfileCache(user.id)
  const err = a.error ?? q.error ?? p.error
  if (err) return { ok: false, count: 0, error: err.message }
  return { ok: true, count: (a.data?.length ?? 0) + (q.data?.length ?? 0) }
}
