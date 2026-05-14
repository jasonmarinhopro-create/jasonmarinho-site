'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isValidCategory, type CategoryId } from '@/lib/chez-nous/categories'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  return { supabase, userId: user.id }
}

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle()
  return data?.role === 'admin'
}

// ─── POSTS ────────────────────────────────────────────────────────────────

const MAX_IMAGES_PER_POST = 3

function validateImages(images: string[] | undefined): string[] {
  if (!Array.isArray(images)) return []
  return images
    .filter(u => typeof u === 'string' && /^https:\/\/[^\s]+\.(jpe?g|png|webp)(\?.*)?$/i.test(u))
    .slice(0, MAX_IMAGES_PER_POST)
}

/**
 * Plafond pour le broadcast @tousleshôtes : on ne notifie pas plus de
 * 300 hôtes d'un coup pour ne pas DoS la table notifications. Au-delà,
 * on tronque silencieusement (les plus anciens membres d'abord par
 * created_at desc).
 */
const BROADCAST_MENTION_CAP = 300

/**
 * Parse le texte pour extraire les mentions @pseudo et insère les rows
 * correspondantes dans chez_nous_mentions (qui déclenche la notif via
 * le trigger SQL chez_nous_notify_on_mention).
 *
 * Spéciaux :
 * - @tousleshôtes → broadcast à tous les membres Chez Nous actifs
 *   (plafonné à BROADCAST_MENTION_CAP). RÉSERVÉ AUX ADMINS — si l'auteur
 *   n'est pas admin, le tag est ignoré côté notif (le texte reste mais
 *   personne n'est notifié).
 *
 * Mentions individuelles :
 * - Match pseudos entre 2 et 30 caractères [a-zA-Z0-9_-]
 * - Résout pseudo → user_id via la table profiles
 * - Déduplique : une seule mention par utilisateur par source
 * - N'inclut PAS l'auteur lui-même (anti auto-notif)
 */
async function processMentions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  text: string,
  actorId: string,
  source: { postId?: string; replyId?: string },
): Promise<void> {
  // 1) Détection broadcast @tousleshôtes (réservé admin)
  const hasBroadcast = /(^|\s)@tousleshôtes\b/i.test(text)

  // 2) Mentions individuelles classiques (on retire 'tousleshôtes' qui
  //    contient un accent et ne match pas le pattern ASCII de toute façon ;
  //    on garde le filtre par sécurité au cas où quelqu'un ajouterait
  //    un alias ASCII type 'tousleshotes')
  const pseudos = Array.from(new Set(
    [...text.matchAll(/@([a-zA-Z0-9_-]{2,30})/g)]
      .map(m => m[1])
      .filter(p => p.toLowerCase() !== 'tousleshotes')
  ))

  if (!hasBroadcast && pseudos.length === 0) return

  const recipientIds = new Set<string>()

  if (hasBroadcast) {
    // Vérif admin avant de broadcaster
    const { data: actorProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', actorId)
      .maybeSingle()
    const isActorAdmin = actorProfile?.role === 'admin'

    if (isActorAdmin) {
      const { data: allMembers } = await supabase
        .from('profiles')
        .select('id, created_at')
        .neq('id', actorId)
        .order('created_at', { ascending: false })
        .limit(BROADCAST_MENTION_CAP)
      ;(allMembers ?? []).forEach(m => recipientIds.add(m.id))
    }
    // Sinon : ignore silencieusement, le texte reste mais aucune notif
  }

  if (pseudos.length > 0) {
    const { data: matches } = await supabase
      .from('profiles')
      .select('id, pseudo')
      .in('pseudo', pseudos)
    ;(matches ?? [])
      .filter(m => m.id !== actorId)
      .forEach(m => recipientIds.add(m.id))
  }

  if (recipientIds.size === 0) return

  const rows = Array.from(recipientIds).map(id => ({
    mentioned_user_id: id,
    actor_id: actorId,
    post_id: source.postId ?? null,
    reply_id: source.replyId ?? null,
  }))

  await supabase.from('chez_nous_mentions').insert(rows)
}

export async function createPost(input: {
  category: string
  title: string
  body: string
  images?: string[]
}): Promise<{ ok: true; postId: string } | { ok: false; error: string }> {
  const { supabase, userId } = await requireAuth()

  const title  = input.title.trim()
  const body   = input.body.trim()
  const images = validateImages(input.images)

  if (!isValidCategory(input.category)) return { ok: false, error: 'Catégorie invalide' }
  if (title.length < 3 || title.length > 200)   return { ok: false, error: 'Le titre doit faire entre 3 et 200 caractères' }
  if (body.length < 1 || body.length > 8000)    return { ok: false, error: 'Le message doit faire entre 1 et 8000 caractères' }

  const { data, error } = await supabase
    .from('chez_nous_posts')
    .insert({ author_id: userId, category: input.category as CategoryId, title, body, images })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Erreur création' }

  // Parser titre + body pour les mentions @pseudo (best-effort, n'échoue pas le post)
  await processMentions(supabase, `${title} ${body}`, userId, { postId: data.id }).catch(() => {})

  revalidatePath('/dashboard/chez-nous')
  return { ok: true, postId: data.id }
}

export async function deletePost(postId: string): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await requireAuth()
  const { error } = await supabase.from('chez_nous_posts').delete().eq('id', postId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard/chez-nous')
  return { ok: true }
}

export async function togglePinPost(postId: string, pinned: boolean): Promise<{ ok: boolean; error?: string }> {
  const { supabase, userId } = await requireAuth()
  if (!await isAdmin(supabase, userId)) return { ok: false, error: 'Réservé à l\'admin' }
  const { error } = await supabase.from('chez_nous_posts').update({ pinned }).eq('id', postId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard/chez-nous')
  revalidatePath(`/dashboard/chez-nous/${postId}`)
  return { ok: true }
}

export async function toggleLockPost(postId: string, locked: boolean): Promise<{ ok: boolean; error?: string }> {
  const { supabase, userId } = await requireAuth()
  if (!await isAdmin(supabase, userId)) return { ok: false, error: 'Réservé à l\'admin' }
  const { error } = await supabase.from('chez_nous_posts').update({ locked }).eq('id', postId)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/dashboard/chez-nous/${postId}`)
  return { ok: true }
}

// ─── REPLIES ──────────────────────────────────────────────────────────────

export async function createReply(input: {
  postId: string
  body: string
  parentReplyId?: string | null
}): Promise<{ ok: true; replyId: string } | { ok: false; error: string }> {
  const { supabase, userId } = await requireAuth()

  const body = input.body.trim()
  if (body.length < 1 || body.length > 4000) {
    return { ok: false, error: 'La réponse doit faire entre 1 et 4000 caractères' }
  }

  // Anti-nesting > 1 niveau : si parentReplyId est lui-même une réponse à
  // une réponse, on remonte au parent pour rester sur 2 niveaux max (style
  // Facebook). Évite les threads infinis qui détruisent la lisibilité.
  let parentReplyId: string | null = input.parentReplyId ?? null
  if (parentReplyId) {
    const { data: parentRow } = await supabase
      .from('chez_nous_replies')
      .select('id, post_id, parent_reply_id')
      .eq('id', parentReplyId)
      .maybeSingle()
    if (!parentRow || parentRow.post_id !== input.postId) {
      return { ok: false, error: 'Commentaire parent invalide.' }
    }
    if (parentRow.parent_reply_id) {
      // Le parent est déjà une réponse imbriquée → on attache au grand-parent
      parentReplyId = parentRow.parent_reply_id
    }
  }

  const { data, error } = await supabase
    .from('chez_nous_replies')
    .insert({ post_id: input.postId, author_id: userId, body, parent_reply_id: parentReplyId })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Erreur création' }

  // Mentions @pseudo dans le body (best-effort, n'échoue pas la reply)
  await processMentions(supabase, body, userId, { replyId: data.id }).catch(() => {})

  revalidatePath(`/dashboard/chez-nous/${input.postId}`)
  revalidatePath('/dashboard/chez-nous')
  return { ok: true, replyId: data.id }
}

export async function deleteReply(replyId: string, postId: string): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await requireAuth()
  const { error } = await supabase.from('chez_nous_replies').delete().eq('id', replyId)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/dashboard/chez-nous/${postId}`)
  return { ok: true }
}

export async function updatePost(input: {
  postId: string
  title: string
  body: string
  category: string
  images?: string[]
}): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await requireAuth()

  const title  = input.title.trim()
  const body   = input.body.trim()
  const images = validateImages(input.images)

  if (!isValidCategory(input.category)) return { ok: false, error: 'Catégorie invalide' }
  if (title.length < 3 || title.length > 200)  return { ok: false, error: 'Titre 3-200 car.' }
  if (body.length < 1 || body.length > 8000)   return { ok: false, error: 'Message 1-8000 car.' }

  const { error } = await supabase
    .from('chez_nous_posts')
    .update({ title, body, category: input.category, images, edited_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', input.postId)

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/dashboard/chez-nous/${input.postId}`)
  revalidatePath('/dashboard/chez-nous')
  return { ok: true }
}

// ─── IMAGE UPLOAD ─────────────────────────────────────────────────────────

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp']

export async function uploadPostImage(formData: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const { supabase, userId } = await requireAuth()

  const file = formData.get('file')
  if (!(file instanceof File)) return { ok: false, error: 'Fichier invalide' }

  if (file.size === 0)            return { ok: false, error: 'Fichier vide' }
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: 'Image trop lourde (max 5 Mo)' }
  if (!ALLOWED_MIMES.includes(file.type)) return { ok: false, error: 'Format non supporté (JPEG, PNG ou WebP)' }

  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`

  const { error: upErr } = await supabase.storage
    .from('chez-nous-images')
    .upload(path, file, { contentType: file.type, cacheControl: '31536000' })

  if (upErr) return { ok: false, error: upErr.message }

  const { data: urlData } = supabase.storage.from('chez-nous-images').getPublicUrl(path)
  return { ok: true, url: urlData.publicUrl }
}

export async function updateReply(input: {
  replyId: string
  postId: string
  body: string
}): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await requireAuth()
  const body = input.body.trim()
  if (body.length < 1 || body.length > 4000) return { ok: false, error: 'Réponse 1-4000 car.' }

  const { error } = await supabase
    .from('chez_nous_replies')
    .update({ body, edited_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', input.replyId)

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/dashboard/chez-nous/${input.postId}`)
  return { ok: true }
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────

export async function markChezNousOnboarded(): Promise<{ ok: boolean }> {
  const { supabase, userId } = await requireAuth()
  await supabase
    .from('profiles')
    .update({ chez_nous_onboarded_at: new Date().toISOString() })
    .eq('id', userId)
  return { ok: true }
}

// ─── REPORTS ──────────────────────────────────────────────────────────────

const REPORT_REASONS = ['off_topic', 'spam', 'aggressive', 'other'] as const

export async function reportContent(input: {
  postId?: string | null
  replyId?: string | null
  reason: string
  message?: string | null
}): Promise<{ ok: boolean; error?: string }> {
  const { supabase, userId } = await requireAuth()

  if (!input.postId && !input.replyId) return { ok: false, error: 'Cible manquante' }
  if (!REPORT_REASONS.includes(input.reason as typeof REPORT_REASONS[number])) {
    return { ok: false, error: 'Raison invalide' }
  }

  const message = input.message?.trim().slice(0, 500) || null

  const { error } = await supabase.from('chez_nous_reports').insert({
    reporter_id: userId,
    post_id:     input.postId ?? null,
    reply_id:    input.replyId ?? null,
    reason:      input.reason,
    message,
  })

  if (error) return { ok: false, error: error.message }

  // Notification admin (fire-and-forget)
  const { sendAdminEmail } = await import('@/lib/email/admin')
  void sendAdminEmail({
    subject: `[Chez Nous] Signalement : ${input.reason}`,
    text:
      `Un membre a signalé un contenu Chez Nous.\n\n` +
      `Raison : ${input.reason}\n` +
      (message ? `Message : ${message}\n` : '') +
      (input.postId ? `Post : https://app.jasonmarinho.com/dashboard/chez-nous/${input.postId}\n` : '') +
      (input.replyId ? `Reply ID : ${input.replyId}\n` : ''),
  })

  return { ok: true }
}

// ─── ACCEPTED REPLY ───────────────────────────────────────────────────────

export async function acceptReply(postId: string, replyId: string | null): Promise<{ ok: boolean; error?: string }> {
  const { supabase, userId } = await requireAuth()

  // Vérifier que c'est bien l'auteur du post
  const { data: post } = await supabase
    .from('chez_nous_posts')
    .select('author_id')
    .eq('id', postId)
    .maybeSingle()

  if (!post)                       return { ok: false, error: 'Post introuvable' }
  if (post.author_id !== userId)   return { ok: false, error: 'Seul l\'auteur du post peut accepter une réponse' }

  // Si replyId, vérifier qu'il appartient bien au post
  if (replyId) {
    const { data: reply } = await supabase
      .from('chez_nous_replies')
      .select('post_id')
      .eq('id', replyId)
      .maybeSingle()
    if (!reply || reply.post_id !== postId) return { ok: false, error: 'Réponse invalide' }
  }

  const { error } = await supabase
    .from('chez_nous_posts')
    .update({ accepted_reply_id: replyId })
    .eq('id', postId)

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/dashboard/chez-nous/${postId}`)
  revalidatePath('/dashboard/chez-nous')
  return { ok: true }
}

// ─── VOTES ────────────────────────────────────────────────────────────────

export async function togglePostVote(postId: string, hasVoted: boolean): Promise<{ ok: boolean; voted?: boolean; error?: string }> {
  const { supabase, userId } = await requireAuth()

  if (hasVoted) {
    const { error } = await supabase
      .from('chez_nous_post_votes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/dashboard/chez-nous')
    revalidatePath(`/dashboard/chez-nous/${postId}`)
    return { ok: true, voted: false }
  } else {
    const { error } = await supabase
      .from('chez_nous_post_votes')
      .insert({ post_id: postId, user_id: userId })
    if (error && !error.message.includes('duplicate')) return { ok: false, error: error.message }
    revalidatePath('/dashboard/chez-nous')
    revalidatePath(`/dashboard/chez-nous/${postId}`)
    return { ok: true, voted: true }
  }
}

// ─── PROFILE ──────────────────────────────────────────────────────────────

export async function updateProfilePseudo(input: {
  pseudo: string | null
  bio: string | null
  privacy_show_logements: boolean
  privacy_show_platforms: boolean
  privacy_show_city: boolean
}): Promise<{ ok: boolean; error?: string }> {
  const { supabase, userId } = await requireAuth()

  const pseudo = input.pseudo?.trim() || null
  const bio    = input.bio?.trim() || null

  if (pseudo) {
    if (pseudo.length < 2 || pseudo.length > 30) {
      return { ok: false, error: 'Le pseudo doit faire entre 2 et 30 caractères' }
    }
    if (!/^[a-zA-Z0-9_\-.\s]+$/.test(pseudo)) {
      return { ok: false, error: 'Pseudo : uniquement lettres, chiffres, espaces, _ - .' }
    }
    // Vérifier unicité (case-insensitive)
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .ilike('pseudo', pseudo)
      .neq('id', userId)
      .maybeSingle()
    if (existing) return { ok: false, error: 'Ce pseudo est déjà pris' }
  }

  if (bio && bio.length > 500) return { ok: false, error: 'Bio max 500 caractères' }

  const { error } = await supabase
    .from('profiles')
    .update({
      pseudo,
      bio,
      privacy_show_logements: input.privacy_show_logements,
      privacy_show_platforms: input.privacy_show_platforms,
      privacy_show_city: input.privacy_show_city,
    })
    .eq('id', userId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard/profil')
  revalidatePath('/dashboard/chez-nous')
  return { ok: true }
}

/**
 * Recherche autocomplete de pseudos pour les mentions @ dans les
 * textareas Chez Nous. Renvoie max 6 résultats matchant le préfixe
 * (case-insensitive).
 *
 * Inclut une entrée spéciale 'tousleshôtes' en tête si l'auteur courant
 * est admin ET que le préfixe matche (les non-admins ne la voient pas
 * du tout, le tag est silencieusement ignoré côté server processMentions
 * même s'ils l'écrivent manuellement).
 */
export async function searchMentions(prefix: string): Promise<{
  suggestions: Array<{ pseudo: string; isBroadcast?: true }>
}> {
  const cleaned = prefix.trim().toLowerCase()
  if (!cleaned) return { suggestions: [] }

  const { supabase, userId } = await requireAuth()

  // Check admin pour inclure @tousleshôtes
  const { data: actor } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  const isAdmin = actor?.role === 'admin'

  const suggestions: Array<{ pseudo: string; isBroadcast?: true }> = []

  if (isAdmin && 'tousleshôtes'.startsWith(cleaned)) {
    suggestions.push({ pseudo: 'tousleshôtes', isBroadcast: true })
  }

  // Pseudos commençant par le préfixe (ILIKE pour case-insensitive)
  // On échappe les wildcards SQL pour éviter une injection LIKE.
  const safePrefix = cleaned.replace(/[%_\\,]/g, '\\$&')
  const { data: matches } = await supabase
    .from('profiles')
    .select('pseudo')
    .ilike('pseudo', `${safePrefix}%`)
    .neq('id', userId)
    .not('pseudo', 'is', null)
    .limit(6)

  ;(matches ?? []).forEach(m => {
    if (m.pseudo && !suggestions.some(s => s.pseudo === m.pseudo)) {
      suggestions.push({ pseudo: m.pseudo })
    }
  })

  return { suggestions: suggestions.slice(0, 6) }
}
