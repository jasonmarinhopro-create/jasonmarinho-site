// Exécute la publication d'un social_posts vers chacune de ses cibles.
// Appelé à la fois par l'action "Publier maintenant" (immédiat) et par
// le cron /api/cron/social-dispatch (posts programmés) — même chemin de
// code, pour ne jamais avoir deux logiques de publication qui divergent.

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { decryptToken } from '@/lib/security/crypto'
import { publishToFacebook, publishToInstagram } from '@/lib/social/meta'
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
      const content = { body: post.body as string, mediaUrls: (post.media_urls ?? []) as string[] }
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
