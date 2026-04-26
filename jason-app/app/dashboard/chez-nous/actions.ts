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

export async function createPost(input: {
  category: string
  title: string
  body: string
}): Promise<{ ok: true; postId: string } | { ok: false; error: string }> {
  const { supabase, userId } = await requireAuth()

  const title = input.title.trim()
  const body  = input.body.trim()

  if (!isValidCategory(input.category)) return { ok: false, error: 'Catégorie invalide' }
  if (title.length < 3 || title.length > 200)   return { ok: false, error: 'Le titre doit faire entre 3 et 200 caractères' }
  if (body.length < 1 || body.length > 8000)    return { ok: false, error: 'Le message doit faire entre 1 et 8000 caractères' }

  const { data, error } = await supabase
    .from('chez_nous_posts')
    .insert({ author_id: userId, category: input.category as CategoryId, title, body })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Erreur création' }

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
}): Promise<{ ok: true; replyId: string } | { ok: false; error: string }> {
  const { supabase, userId } = await requireAuth()

  const body = input.body.trim()
  if (body.length < 1 || body.length > 4000) {
    return { ok: false, error: 'La réponse doit faire entre 1 et 4000 caractères' }
  }

  const { data, error } = await supabase
    .from('chez_nous_replies')
    .insert({ post_id: input.postId, author_id: userId, body })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Erreur création' }

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
