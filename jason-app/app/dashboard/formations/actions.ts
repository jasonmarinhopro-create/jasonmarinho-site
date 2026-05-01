'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function enrollInFormation(formationId: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('user_formations')
    .upsert(
      { user_id: session.user.id, formation_id: formationId, progress: 0, completed_lessons: [] },
      { onConflict: 'user_id,formation_id', ignoreDuplicates: true }
    )

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Phase 2 — Notes personnelles par leçon ────────────────────

export async function saveLessonNote(input: {
  formationId: string
  moduleId: number
  lessonId: number
  content: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('user_lesson_notes')
    .upsert(
      {
        user_id: session.user.id,
        formation_id: input.formationId,
        module_id: input.moduleId,
        lesson_id: input.lessonId,
        content: input.content,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,formation_id,lesson_id' }
    )

  if (error) return { error: error.message }
  return {}
}

export async function getLessonNotes(formationId: string): Promise<Record<string, string>> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return {}
  const { data } = await supabase
    .from('user_lesson_notes')
    .select('lesson_id, content')
    .eq('user_id', session.user.id)
    .eq('formation_id', formationId)
  const out: Record<string, string> = {}
  ;(data ?? []).forEach((n: any) => { out[String(n.lesson_id)] = n.content })
  return out
}

// ─── Phase 3 — Favoris/bookmarks par leçon ─────────────────────

export async function toggleLessonBookmark(input: {
  formationId: string
  formationSlug: string
  formationTitle: string
  moduleId: number
  lessonId: number
  lessonTitle: string
  add: boolean
}): Promise<{ error?: string; bookmarked?: boolean }> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  if (input.add) {
    const { error } = await supabase
      .from('user_lesson_bookmarks')
      .upsert(
        {
          user_id: session.user.id,
          formation_id: input.formationId,
          formation_slug: input.formationSlug,
          formation_title: input.formationTitle,
          module_id: input.moduleId,
          lesson_id: input.lessonId,
          lesson_title: input.lessonTitle,
        },
        { onConflict: 'user_id,formation_id,lesson_id', ignoreDuplicates: true }
      )
    if (error) return { error: error.message }
    revalidatePath('/dashboard/formations/favoris')
    return { bookmarked: true }
  } else {
    const { error } = await supabase
      .from('user_lesson_bookmarks')
      .delete()
      .eq('user_id', session.user.id)
      .eq('formation_id', input.formationId)
      .eq('lesson_id', input.lessonId)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/formations/favoris')
    return { bookmarked: false }
  }
}

export async function getLessonBookmarks(formationId: string): Promise<number[]> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []
  const { data } = await supabase
    .from('user_lesson_bookmarks')
    .select('lesson_id')
    .eq('user_id', session.user.id)
    .eq('formation_id', formationId)
  return (data ?? []).map((b: any) => b.lesson_id as number)
}

// ─── Phase 7 — Notation par leçon (utile / pas utile) ─────────

export async function voteLesson(input: {
  formationId: string
  lessonId: number
  vote: 1 | -1 | 0 // 0 = retirer le vote
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  if (input.vote === 0) {
    const { error } = await supabase
      .from('lesson_feedback')
      .delete()
      .eq('user_id', session.user.id)
      .eq('formation_id', input.formationId)
      .eq('lesson_id', input.lessonId)
    if (error) return { error: error.message }
    return {}
  }

  const { error } = await supabase
    .from('lesson_feedback')
    .upsert(
      {
        user_id: session.user.id,
        formation_id: input.formationId,
        lesson_id: input.lessonId,
        vote: input.vote,
      },
      { onConflict: 'user_id,formation_id,lesson_id' }
    )
  if (error) return { error: error.message }
  return {}
}

// ─── Phase 8 — Q&A et commentaires par leçon ─────────────────

export async function postLessonComment(input: {
  formationId: string
  lessonId: number
  content: string
  parentId?: string | null
  displayName?: string
}): Promise<{ error?: string; comment?: any }> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const trimmed = input.content.trim()
  if (!trimmed) return { error: 'Le commentaire est vide' }
  if (trimmed.length > 4000) return { error: 'Trop long (4000 max)' }

  const { data, error } = await supabase
    .from('lesson_comments')
    .insert({
      user_id: session.user.id,
      formation_id: input.formationId,
      lesson_id: input.lessonId,
      content: trimmed,
      parent_id: input.parentId ?? null,
      display_name: input.displayName?.trim() || null,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { comment: data }
}

export async function deleteLessonComment(commentId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('lesson_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', session.user.id)
  if (error) return { error: error.message }
  return {}
}

export async function listLessonComments(formationId: string, lessonId: number): Promise<{
  comments: Array<{
    id: string
    user_id: string
    parent_id: string | null
    content: string
    display_name: string | null
    author_role: string
    created_at: string
  }>
}> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lesson_comments')
    .select('id, user_id, parent_id, content, display_name, author_role, created_at')
    .eq('formation_id', formationId)
    .eq('lesson_id', lessonId)
    .eq('is_visible', true)
    .order('created_at', { ascending: true })
  return { comments: data ?? [] }
}

// ─── Phase 7 — Avis public par formation ──────────────────────

export async function submitFormationReview(input: {
  formationId: string
  rating: number
  comment?: string
  displayName?: string
  isPublic?: boolean
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  if (input.rating < 1 || input.rating > 5) return { error: 'Note invalide (1 à 5)' }

  const { error } = await supabase
    .from('formation_reviews')
    .upsert(
      {
        user_id: session.user.id,
        formation_id: input.formationId,
        rating: input.rating,
        comment: input.comment?.trim() || null,
        display_name: input.displayName?.trim() || null,
        is_public: input.isPublic ?? true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,formation_id' }
    )
  if (error) return { error: error.message }
  revalidatePath('/dashboard/formations')
  return {}
}

export async function updateFormationProgress(
  formationId: string,
  progress: number,
  completedLessons?: number[],
  newlyCompletedLessonId?: number, // Phase 6 — pour logger la date dans completion_log
) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const updateData: Record<string, unknown> = { progress }
  if (completedLessons !== undefined) {
    updateData.completed_lessons = completedLessons
  }

  // Upsert pour sauvegarder même si l'utilisateur n'a pas cliqué "S'inscrire"
  const { error } = await supabase
    .from('user_formations')
    .upsert(
      { user_id: session.user.id, formation_id: formationId, ...updateData },
      { onConflict: 'user_id,formation_id' }
    )

  if (error) return { error: error.message }

  // Phase 6 — Logger la complétion pour le streak/historique
  if (newlyCompletedLessonId !== undefined) {
    await supabase
      .from('user_lesson_completion_log')
      .insert({
        user_id: session.user.id,
        formation_id: formationId,
        lesson_id: newlyCompletedLessonId,
      })
      .then(() => null, () => null) // Silently ignore log errors
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Favoris au niveau FORMATION ────────────────────────────────

export async function toggleFormationFavorite(input: {
  formationId: string
  formationSlug: string
  formationTitle: string
  add: boolean
}): Promise<{ error?: string; favorited?: boolean }> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  if (input.add) {
    const { error } = await supabase
      .from('user_formation_favorites')
      .upsert(
        {
          user_id: session.user.id,
          formation_id: input.formationId,
          formation_slug: input.formationSlug,
          formation_title: input.formationTitle,
        },
        { onConflict: 'user_id,formation_id', ignoreDuplicates: true }
      )
    if (error) return { error: error.message }
    revalidatePath('/dashboard/formations')
    revalidatePath('/dashboard/formations/favoris')
    return { favorited: true }
  } else {
    const { error } = await supabase
      .from('user_formation_favorites')
      .delete()
      .eq('user_id', session.user.id)
      .eq('formation_id', input.formationId)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/formations')
    revalidatePath('/dashboard/formations/favoris')
    return { favorited: false }
  }
}
