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

export async function updateFormationProgress(
  formationId: string,
  progress: number,
  completedLessons?: number[]
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
  revalidatePath('/dashboard')
  return { success: true }
}
