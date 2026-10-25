// Exécute la publication d'un social_posts vers chacune de ses cibles.
// Appelé à la fois par l'action "Publier maintenant" (immédiat) et par
// le cron /api/cron/social-dispatch (posts programmés) — même chemin de
// code, pour ne jamais avoir deux logiques de publication qui divergent.

import { getServiceClient as serviceClient } from '@/lib/supabase/service'
import { decryptToken } from '@/lib/security/crypto'
import { publishToFacebook, publishToInstagram, publishFacebookStory, prepareInstagramStories, publishInstagramStory, getFacebookPostInsights, getInstagramMediaInsights, InstagramMediaTimeoutError } from '@/lib/social/meta'
import { logger } from '@/lib/logger'

const log = logger('lib/social/dispatch')

export async function dispatchPost(postId: string): Promise<void> {
  const db = serviceClient()
  const { data: post } = await db.from('social_posts').select('*').eq('id', postId).maybeSingle()
  if (!post) return

  await db.from('social_posts').update({ status: 'publishing', updated_at: new Date().toISOString() }).eq('id', postId)

  const [{ data: targets }, { data: accounts }] = await Promise.all([
    db.from('social_post_targets').select('*').eq('post_id', postId),
    db.from('social_accounts').select('*').eq('status', 'active'),
  ])

  // En parallèle plutôt que séquentiel : Instagram peut prendre jusqu'à ~34s
  // rien que pour le traitement du média (waitForMediaReady) — l'enchaîner
  // après Facebook (même rapide) rapprochait dangereusement le total du
  // timeout de 60s de la fonction Vercel, provoquant des posts bloqués en
  // "pending" pile au milieu (Meta publie réellement, mais la fonction est
  // tuée avant l'écriture du statut en base). En parallèle, le temps total
  // est borné par le plus lent des deux au lieu de leur somme.
  // Instagram encore en train de traiter une vidéo : le post reste programmé
  // et repart au passage suivant sur le même conteneur (24/10/2026, Reels)
  let stillProcessing = 0
  const feedStatusAtStart = new Map((targets ?? []).map(t => [t.id as string, t.status as string]))
  const results = await Promise.all((targets ?? []).map(async (target): Promise<boolean> => {
    // Une story qui annonce le post attend que le post soit en ligne sur ce
    // réseau (« À voir sur notre profil ») : elle part au passage suivant
    // (pg_cron 17 h 20 et 17 h 40 UTC, migration 161)
    const net = storyNetwork(target.platform)
    if (net && target.status !== 'published') {
      const feed = (targets ?? []).find(t => t.platform === net)
      if (feed && feedStatusAtStart.get(feed.id) !== 'published') {
        if (feedStatusAtStart.get(feed.id) !== 'failed') { stillProcessing++; return false }
        await db.from('social_post_targets').update({ status: 'failed', error: 'Le post n’est pas en ligne sur ce réseau : story retenue' }).eq('id', target.id)
        return false
      }
    }
    if (target.status === 'published') {
      // Déjà publié (ex : Facebook OK, Instagram en échec) — on ne
      // republie pas, sinon "Réessayer" créerait un doublon sur ce réseau.
      return true
    }
    // Les stories passent par le compte du réseau (facebook_story → facebook)
    const network = storyNetwork(target.platform) ?? target.platform
    const account = (accounts ?? []).find(a => a.platform === network)
    if (!account) {
      const { error: writeErr } = await db.from('social_post_targets')
        .update({ status: 'failed', error: 'Aucun compte connecté pour cette plateforme' })
        .eq('id', target.id)
      if (writeErr) log.error('écriture du statut échouée', { postId, platform: target.platform, err: writeErr.message })
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
      } else if (storyNetwork(target.platform)) {
        // Série de stories, écran par écran dans l'ordre. Les ids déjà publiés
        // restent dans external_post_id : une reprise après un échec repart de
        // l'écran suivant, sans doublon.
        const images = (target.media_override ?? []) as string[]
        if (!images.length) throw new Error('Story sans visuel')
        const done = storyDone(target.external_post_id as string | null)
        const todo = images.slice(done.length)
        const containers = target.platform === 'instagram_story' ? await prepareInstagramStories(account.external_account_id, accessToken, todo) : []
        for (const [k, image] of todo.entries()) {
          try {
            done.push(target.platform === 'facebook_story'
              ? await publishFacebookStory(account.external_account_id, accessToken, image)
              : await publishInstagramStory(account.external_account_id, accessToken, containers[k]))
          } catch (err) {
            await db.from('social_post_targets').update({ external_post_id: done.join(',') || null }).eq('id', target.id)
            throw err
          }
        }
        externalId = done.join(',')
      } else {
        throw new Error(`Plateforme non supportée pour le moment : ${target.platform}`)
      }
      const { error: writeErr } = await db.from('social_post_targets').update({
        status: 'published',
        external_post_id: externalId,
        published_at: new Date().toISOString(),
        error: null,
        pending_media_id: null,
      }).eq('id', target.id)
      // La publication Meta a réellement réussi (externalId obtenu) mais
      // l'écriture du statut en base a échoué (ex : colonne manquante côté
      // schéma — déjà arrivé en prod, cf. migration 091 non appliquée) :
      // sans ce log, le cas restait invisible et le post repartait "pending"
      // indéfiniment tout en étant déjà réellement publié côté Meta.
      if (writeErr) {
        log.error('publication réussie mais écriture du statut échouée', { postId, platform: target.platform, externalId, err: writeErr.message })
        return false
      }
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      // Instagram a expiré mais garde le conteneur en traitement en arrière-
      // plan : on le conserve pour que le prochain "Réessayer" le réutilise
      // au lieu de repartir de zéro et retomber sur le même délai.
      const pendingMediaId = err instanceof InstagramMediaTimeoutError ? err.creationId : null
      const retry = !!pendingMediaId && isRecent(post.scheduled_at as string | null)
      if (retry) stillProcessing++
      else log.error('publication échouée', { postId, platform: target.platform, err: message })
      const { error: writeErr } = await db.from('social_post_targets').update({
        status: retry ? 'pending' : 'failed',
        error: message,
        pending_media_id: pendingMediaId,
      }).eq('id', target.id)
      if (writeErr) log.error('écriture du statut échec échouée', { postId, platform: target.platform, err: writeErr.message })
      return false
    }
  }))

  const succeeded = results.filter(Boolean).length
  const failed = results.length - succeeded
  const finalStatus = stillProcessing > 0 ? 'scheduled' : failed === 0 ? 'done' : succeeded === 0 ? 'failed' : 'partial'
  await db.from('social_posts').update({ status: finalStatus }).eq('id', postId)
}

/** Réseau d'une cible story (facebook_story → facebook), sinon null */
export function storyNetwork(platform: string): 'facebook' | 'instagram' | null {
  return platform === 'facebook_story' ? 'facebook' : platform === 'instagram_story' ? 'instagram' : null
}

/** Écrans de stories déjà publiés (ids séparés par des virgules) */
export function storyDone(externalPostId: string | null): string[] {
  return (externalPostId ?? '').split(',').map(x => x.trim()).filter(Boolean)
}

/** Reprise automatique d'un conteneur Instagram : seulement les deux jours qui suivent l'heure prévue. */
function isRecent(scheduledAt: string | null): boolean {
  return !!scheduledAt && Date.now() - new Date(scheduledAt).getTime() < 2 * 86_400_000
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
  const now = new Date()
  // Posts dus, et posts restés « publishing » plus de 15 min (fonction coupée)
  const stale = new Date(now.getTime() - 15 * 60_000).toISOString()
  const { data: due } = await db
    .from('social_posts')
    .select('id, status')
    .or(`status.eq.scheduled,and(status.eq.publishing,updated_at.lt.${stale})`)
    .lte('scheduled_at', now.toISOString())
    .order('scheduled_at', { ascending: true })

  const queue = due ?? []
  const started = Date.now()
  let processed = 0

  for (const p of queue) {
    if (Date.now() - started > DUE_POSTS_BUDGET_MS) break
    // Réservation atomique : deux passages simultanés (pg_cron, cron Vercel,
    // workflow GitHub) ne publient jamais le même post deux fois. Le 25/10/2026,
    // deux passages concurrents ont publié le post du dimanche deux fois sur
    // Facebook.
    let claim = db.from('social_posts').update({ status: 'publishing', updated_at: new Date().toISOString() }).eq('id', p.id).eq('status', p.status as string)
    if (p.status === 'publishing') claim = claim.lt('updated_at', stale)
    const { data: claimed } = await claim.select('id')
    if (!claimed?.length) continue
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
