// Détecte un mot-clé dans un commentaire Facebook/Instagram entrant et
// envoie automatiquement une réponse privée (DM) — appelé par le webhook
// Meta (app/api/social/webhook/meta/route.ts). Pas d'email possible ici :
// Meta ne donne jamais l'adresse d'un commentateur, cf. lib/social/meta.ts.

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { decryptToken } from '@/lib/security/crypto'
import { sendPrivateReply } from '@/lib/social/meta'
import { logger } from '@/lib/logger'

const log = logger('lib/social/comment-triggers')

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

export interface IncomingComment {
  platform: 'facebook' | 'instagram'
  commentId: string
  postId: string | null
  commentText: string
  commenterName: string | null
  senderId: string | null
  // ID de la Page (Facebook) ou du compte Instagram Business qui a reçu
  // le commentaire — sert à ignorer les commentaires de la Page elle-même.
  pageId: string
}

export async function handleIncomingComment(comment: IncomingComment): Promise<void> {
  if (comment.senderId && comment.senderId === comment.pageId) return
  if (!comment.commentText.trim()) return

  const db = serviceClient()
  const text = comment.commentText.toLowerCase()

  const { data: triggers } = await db
    .from('social_comment_triggers')
    .select('*')
    .eq('active', true)
    .in('platform', [comment.platform, 'both'])

  const trigger = (triggers ?? []).find(t => text.includes((t.keyword as string).toLowerCase()))
  if (!trigger) return

  // Verrou d'idempotence : Meta redélivre parfois le même événement webhook.
  // La contrainte unique (platform, comment_id) rejette silencieusement le
  // doublon si ce commentaire a déjà été traité.
  const { error: insertError } = await db.from('social_comment_replies').insert({
    trigger_id: trigger.id,
    platform: comment.platform,
    comment_id: comment.commentId,
    post_id: comment.postId,
    commenter_name: comment.commenterName,
    status: 'pending',
  })
  if (insertError) {
    if (insertError.code !== '23505') log.error('log insert échoué', { msg: insertError.message })
    return
  }

  try {
    const { data: account } = await db
      .from('social_accounts')
      .select('access_token')
      .eq('platform', comment.platform)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()
    if (!account) throw new Error('Aucun compte connecté pour cette plateforme')

    const accessToken = decryptToken(account.access_token)
    await sendPrivateReply(comment.platform, comment.pageId, comment.commentId, accessToken, trigger.reply_message)

    await db.from('social_comment_replies')
      .update({ status: 'sent' })
      .eq('platform', comment.platform).eq('comment_id', comment.commentId)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error('réponse privée échouée', { platform: comment.platform, commentId: comment.commentId, err: message })
    await db.from('social_comment_replies')
      .update({ status: 'failed', error: message })
      .eq('platform', comment.platform).eq('comment_id', comment.commentId)
  }
}
