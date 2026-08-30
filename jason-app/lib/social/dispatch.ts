// Exécute la publication d'un social_posts vers chacune de ses cibles.
// Appelé à la fois par l'action "Publier maintenant" (immédiat) et par
// le cron /api/cron/social-dispatch (posts programmés) — même chemin de
// code, pour ne jamais avoir deux logiques de publication qui divergent.

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { decryptToken } from '@/lib/security/crypto'
import { publishToFacebook, publishToInstagram, getFacebookPostInsights, getInstagramMediaInsights, InstagramMediaTimeoutError } from '@/lib/social/meta'
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

  // En parallèle plutôt que séquentiel : Instagram peut prendre jusqu'à ~52s
  // rien que pour le traitement du média (waitForMediaReady) — l'enchaîner
  // après Facebook (même rapide) rapprochait dangereusement le total du
  // timeout de 60s de la fonction Vercel, provoquant des posts bloqués en
  // "pending" pile au milieu (Meta publie réellement, mais la fonction est
  // tuée avant l'écriture du statut en base). En parallèle, le temps total
  // est borné par le plus lent des deux au lieu de leur somme.
  const results = await Promise.all((targets ?? []).map(async (target): Promise<boolean> => {
    if (target.status === 'published') {
      // Déjà publié (ex : Facebook OK, Instagram en échec) — on ne
      // republie pas, sinon "Réessayer" créerait un doublon sur ce réseau.
      return true
    }
    const account = (accounts ?? []).find(a => a.platform === target.platform)
    if (!account) {
      await db.from('social_post_targets')
        .update({ status: 'failed', error: 'Aucun compte connecté pour cette plateforme' })
        .eq('id', target.id)
      return false
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
        externalId = await publishToInstagram(account.external_account_id, accessToken, content, target.pending_media_id ?? null)
      } else {
        throw new Error(`Plateforme non supportée pour le moment : ${target.platform}`)
      }
      await db.from('social_post_targets').update({
        status: 'published',
        external_post_id: externalId,
        published_at: new Date().toISOString(),
        error: null,
        pending_media_id: null,
      }).eq('id', target.id)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      // Instagram a expiré mais garde le conteneur en traitement en arrière-
      // plan : on le conserve pour que le prochain "Réessayer" le réutilise
      // au lieu de repartir de zéro et retomber sur le même délai.
      const pendingMediaId = err instanceof InstagramMediaTimeoutError ? err.creationId : null
      log.error('publication échouée', { postId, platform: target.platform, err: message })
      await db.from('social_post_targets').update({
        status: 'failed',
        error: message,
        pending_media_id: pendingMediaId,
      }).eq('id', target.id)
      return false
    }
  }))

  const succeeded = results.filter(Boolean).length
  const failed = results.length - succeeded
  const finalStatus = failed === 0 ? 'done' : succeeded === 0 ? 'failed' : 'partial'
  await db.from('social_posts').update({ status: finalStatus }).eq('id', postId)
}

// Un backlog de plusieurs posts en retard (ex : pipeline cassé depuis des
// jours) traité séquentiellement peut lui-même dépasser les 60s de la
// fonction Vercel, même si chaque dispatchPost() individuel est rapide —
// observé en conditions réelles (HTTP 504 FUNCTION_INVOCATION_TIMEOUT sur
// /api/cron/social-dispatch). Même remède que checkAllUrls() (SEO
// indexation) : on s'arrête proprement avant la limite et on renvoie ce
// qu'il reste, plutôt que de se faire tuer en plein milieu d'un post.
const DUE_POSTS_BUDGET_MS = 50_000 // le cron et l'action serveur ont maxDuration=60

// Trouve les posts programmés dont l'heure est arrivée et les publie.
export async function dispatchDuePosts(): Promise<{ processed: number; remaining: number }> {
  const db = serviceClient()
  const { data: due } = await db
    .from('social_posts')
    .select('id')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })

  const queue = due ?? []
  const started = Date.now()
  let processed = 0

  for (const p of queue) {
    if (Date.now() - started > DUE_POSTS_BUDGET_MS) break
    await dispatchPost(p.id)
    processed++
  }

  return { processed, remaining: queue.length - processed }
}

// Rafraîchit un seul target publié depuis l'API Meta. Partagé par
// refreshPostStats (un post) et refreshAllStats (tous les posts).
async function refreshTargetStats(
  db: ReturnType<typeof serviceClient>,
  target: { id: string; platform: string; external_post_id: string | null },
  accounts: Array<{ platform: string; access_token: string }>,
): Promise<boolean> {
  if (!target.external_post_id) return false
  const account = accounts.find(a => a.platform === target.platform)
  if (!account) return false
  try {
    const accessToken = decryptToken(account.access_token)
    const insights = target.platform === 'facebook'
      ? await getFacebookPostInsights(target.external_post_id, accessToken)
      : target.platform === 'instagram'
        ? await getInstagramMediaInsights(target.external_post_id, accessToken)
        : null
    if (!insights) return false
    await db.from('social_post_targets').update({
      like_count: insights.likeCount,
      comment_count: insights.commentCount,
      stats_updated_at: new Date().toISOString(),
    }).eq('id', target.id)
    return true
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error('refresh stats échoué', { platform: target.platform, err: message })
    return false
  }
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
    await refreshTargetStats(db, target, accounts ?? [])
  }
}

// Même chose mais pour toutes les cibles publiées, tous posts confondus —
// utilisé par le bouton "Actualiser tout" de l'onglet Statistiques.
export async function refreshAllStats(): Promise<{ updated: number }> {
  const db = serviceClient()
  const [{ data: targets }, { data: accounts }] = await Promise.all([
    db.from('social_post_targets').select('*').eq('status', 'published'),
    db.from('social_accounts').select('*').eq('status', 'active'),
  ])
  let updated = 0
  for (const target of targets ?? []) {
    if (await refreshTargetStats(db, target, accounts ?? [])) updated++
  }
  return { updated }
}
