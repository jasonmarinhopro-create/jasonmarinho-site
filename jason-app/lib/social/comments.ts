// Commentaires Facebook / Instagram et réponses publiques (24/10/2026).
// Circuit : syncComments() relève les commentaires des posts récents (et le
// webhook en ajoute au fil de l'eau) → la routine « Community manager » écrit
// la réponse dans social_comments (reply_status = 'a_envoyer') → sendReplies()
// la publie sous le commentaire. Rien n'est inventé côté app : sans réponse
// écrite, rien ne part.

import { getServiceClient as serviceClient } from '@/lib/supabase/service'
import { decryptToken } from '@/lib/security/crypto'
import { listFacebookComments, listInstagramComments, replyToComment } from '@/lib/social/meta'
import { cleanReply, isOwnComment } from '@/lib/social/comment-rules'
import { logger } from '@/lib/logger'

const log = logger('lib/social/comments')

type Platform = 'facebook' | 'instagram'

export interface StoredComment {
  platform: Platform
  commentId: string
  parentId: string | null
  postExternalId: string | null
  text: string
  authorName: string | null
  createdAt: string | null
}

/** Enregistre un commentaire une seule fois (contrainte unique plateforme + id). */
export async function storeComments(rows: StoredComment[]): Promise<number> {
  if (!rows.length) return 0
  const db = serviceClient()
  const { data, error } = await db.from('social_comments').upsert(rows.map(r => ({
    platform: r.platform, comment_id: r.commentId, parent_id: r.parentId, post_external_id: r.postExternalId,
    text: r.text.slice(0, 4000), author_name: r.authorName, commented_at: r.createdAt,
  })), { onConflict: 'platform,comment_id', ignoreDuplicates: true }).select('id')
  if (error) { log.error('enregistrement des commentaires', { msg: error.message }); return 0 }
  return data?.length ?? 0
}

async function activeAccounts() {
  const db = serviceClient()
  const { data } = await db.from('social_accounts').select('platform, external_account_id, display_name, access_token').eq('status', 'active')
  return (data ?? []) as Array<{ platform: Platform; external_account_id: string; display_name: string | null; access_token: string }>
}

/** Relève les commentaires des posts publiés depuis 21 jours. */
export async function syncComments(): Promise<{ posts: number; added: number; errors: number }> {
  const db = serviceClient()
  const since = new Date(Date.now() - 21 * 86_400_000).toISOString()
  const [{ data: targets }, accounts] = await Promise.all([
    db.from('social_post_targets').select('platform, external_post_id').in('platform', ['facebook', 'instagram']).eq('status', 'published').gte('published_at', since).not('external_post_id', 'is', null),
    activeAccounts(),
  ])
  let added = 0, errors = 0
  for (const t of (targets ?? []) as Array<{ platform: Platform; external_post_id: string }>) {
    const account = accounts.find(a => a.platform === t.platform)
    if (!account) continue
    try {
      const token = decryptToken(account.access_token)
      const list = t.platform === 'facebook' ? await listFacebookComments(t.external_post_id, token) : await listInstagramComments(t.external_post_id, token)
      const fresh = list.filter(c => c.text.trim() && !isOwnComment(c, account))
      added += await storeComments(fresh.map(c => ({ platform: t.platform, commentId: c.commentId, parentId: c.parentId, postExternalId: t.external_post_id, text: c.text, authorName: c.authorName, createdAt: c.createdAt })))
    } catch (err) {
      errors++
      log.error('relève des commentaires', { platform: t.platform, err: err instanceof Error ? err.message : String(err) })
    }
  }
  return { posts: targets?.length ?? 0, added, errors }
}

/** Publie les réponses écrites par la routine (15 au plus par passage, commentaires de moins de 7 jours). */
export async function sendReplies(): Promise<{ sent: number; failed: number; skipped: number }> {
  const db = serviceClient()
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const [{ data: rows }, accounts] = await Promise.all([
    db.from('social_comments').select('id, platform, comment_id, reply_text, created_at').eq('reply_status', 'a_envoyer').gte('created_at', since).order('created_at').limit(15),
    activeAccounts(),
  ])
  let sent = 0, failed = 0, skipped = 0
  for (const r of (rows ?? []) as Array<{ id: string; platform: Platform; comment_id: string; reply_text: string | null }>) {
    const text = cleanReply(r.reply_text)
    const account = accounts.find(a => a.platform === r.platform)
    if (!text || !account) {
      skipped++
      await db.from('social_comments').update({ reply_status: 'echec', reply_error: !text ? 'Réponse vide ou refusée par les règles' : 'Aucun compte connecté' }).eq('id', r.id)
      continue
    }
    try {
      const id = await replyToComment(r.platform, r.comment_id, decryptToken(account.access_token), text)
      await db.from('social_comments').update({ reply_status: 'envoye', reply_text: text, reply_external_id: id, replied_at: new Date().toISOString(), reply_error: null }).eq('id', r.id)
      sent++
    } catch (err) {
      failed++
      await db.from('social_comments').update({ reply_status: 'echec', reply_error: err instanceof Error ? err.message.slice(0, 500) : String(err) }).eq('id', r.id)
    }
  }
  return { sent, failed, skipped }
}
