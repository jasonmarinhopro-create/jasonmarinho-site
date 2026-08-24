// Exécute la publication d'un social_posts vers chacune de ses cibles.
// Appelé à la fois par l'action "Publier maintenant" (immédiat) et par
// le cron /api/cron/social-dispatch (posts programmés) — même chemin de
// code, pour ne jamais avoir deux logiques de publication qui divergent.

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { decryptToken } from '@/lib/security/crypto'
import { publishToFacebook, publishToInstagram, getFacebookPostInsights, getInstagramMediaInsights } from '@/lib/social/meta'
import { logger } from '@/lib/logger'

const log = logger('lib/social/dispatch')

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

export async function dispatchPost(postId: string): Promise<void> {
  const db = serviceClient()
  const { data: post } = await db.from('social_posts').select('*').eq('id', postId).maybeSingle()
  if (!post) return

  await db.from('social_posts').update({ status: 'publishing' }).eq('id', postId)

  const [{ data: targets }, { data: accounts }] = await Promise.all([
    db.from('social_post_targets').select('*').eq('post_id', postId),
    db.from('social_accounts').select('*').eq('status', 'active'),
  ])

  let succeeded = 0
  let failed = 0

  for (const target of targets ?? []) {
    if (target.status === 'published') {
      // Déjà publié (ex : Facebook OK, Instagram en échec) — on ne
      // republie pas, sinon "Réessayer" créerait un doublon sur ce réseau.
      succeeded++
      continue
    }
    const account = (accounts ?? []).find(a => a.platform === target.platform)
    if (!account) {
      failed++
      await db.from('social_post_targets')
        .update({ status: 'failed', error: 'Aucun compte connecté pour cette plateforme' })
        .eq('id', target.id)
      continue
    }
    try {
      const accessToken = decryptToken(account.access_token)
      const content = {
        body: (target.body_override as string | null) || (post.body as string),
        mediaUrls: (post.media_urls ?? []) as string[],
      }
      let externalId: string
      if (target.platform === 'facebook') {
        externalId = await publishToFacebook(account.external_account_id, accessToken, content)
      } else if (target.platform === 'instagram') {
        externalId = await publishToInstagram(account.external_account_id, accessToken, content)
      } else {
        throw new Error(`Plateforme non supportée pour le moment : ${target.platform}`)
      }
      succeeded++
      await db.from('social_post_targets').update({
        status: 'published',
        external_post_id: externalId,
        published_at: new Date().toISOString(),
        error: null,
      }).eq('id', target.id)
    } catch (err) {
      failed++
      const message = err instanceof Error ? err.message : String(err)
      log.error('publication échouée', { postId, platform: target.platform, err: message })
      await db.from('social_post_targets').update({ status: 'failed', error: message }).eq('id', target.id)
    }
  }

  const finalStatus = failed === 0 ? 'done' : succeeded === 0 ? 'failed' : 'partial'
  await db.from('social_posts').update({ status: finalStatus }).eq('id', postId)
}

// Trouve les posts programmés dont l'heure est arrivée et les publie.
export async function dispatchDuePosts(): Promise<{ processed: number }> {
  const db = serviceClient()
  const { data: due } = await db
    .from('social_posts')
    .select('id')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())

  for (const p of due ?? []) {
    await dispatchPost(p.id)
  }
  return { processed: (due ?? []).length }
}

// Rafraîchit les likes/commentaires des cibles publiées d'un post, depuis
// l'API Meta. Appelé à la demande (bouton "Actualiser les stats"), pas en
// tâche de fond — évite un cron de plus pour un besoin non temps-réel.
export async function refreshPostStats(postId: string): Promise<void> {
  const db = serviceClient()
  const [{ data: targets }, { data: accounts }] = await Promise.all([
    db.from('social_post_targets').select('*').eq('post_id', postId).eq('status', 'published'),
    db.from('social_accounts').select('*').eq('status', 'active'),
  ])

  for (const target of targets ?? []) {
    if (!target.external_post_id) continue
    const account = (accounts ?? []).find(a => a.platform === target.platform)
    if (!account) continue
    try {
      const accessToken = decryptToken(account.access_token)
      const insights = target.platform === 'facebook'
        ? await getFacebookPostInsights(target.external_post_id, accessToken)
        : target.platform === 'instagram'
          ? await getInstagramMediaInsights(target.external_post_id, accessToken)
          : null
      if (!insights) continue
      await db.from('social_post_targets').update({
        like_count: insights.likeCount,
        comment_count: insights.commentCount,
        stats_updated_at: new Date().toISOString(),
      }).eq('id', target.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      log.error('refresh stats échoué', { postId, platform: target.platform, err: message })
    }
  }
}
