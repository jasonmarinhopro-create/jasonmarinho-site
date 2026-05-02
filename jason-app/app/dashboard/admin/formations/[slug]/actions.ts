'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function getServiceClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié', adminClient: null }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Non autorisé', adminClient: null }
  return { error: null, adminClient: getServiceClient() }
}

function revalidateFormation(slug: string) {
  revalidatePath(`/dashboard/admin/formations/${slug}`)
  revalidatePath(`/dashboard/admin/formations`)
  revalidatePath(`/dashboard/formations/${slug}`)
  revalidatePath(`/dashboard/formations`)
}

// ── Formation metadata ───────────────────────────────────────

export async function updateFormationMeta(
  formationId: string,
  slug: string,
  data: {
    title: string
    description: string
    duration: string
    level: string
    objectifs: string[]
  }
) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  const { error: dbError } = await adminClient
    .from('formations')
    .update({
      title: data.title,
      description: data.description,
      duration: data.duration,
      level: data.level,
      objectifs: data.objectifs,
    })
    .eq('id', formationId)

  if (dbError) return { success: false, error: dbError.message }

  revalidateFormation(slug)
  return { success: true }
}

// ── Modules ──────────────────────────────────────────────────

export async function upsertModule(
  formationId: string,
  slug: string,
  moduleNumber: number,
  title: string,
  duration: string
) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error, id: null as string | null }

  const { data, error: dbError } = await adminClient
    .from('formation_modules')
    .upsert(
      { formation_id: formationId, module_number: moduleNumber, title, duration },
      { onConflict: 'formation_id,module_number' }
    )
    .select('id')
    .single()

  if (dbError) return { success: false, error: dbError.message, id: null }

  revalidateFormation(slug)
  return { success: true, id: data.id }
}

export async function deleteModule(moduleId: string, slug: string) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  const { error: dbError } = await adminClient
    .from('formation_modules')
    .delete()
    .eq('id', moduleId)

  if (dbError) return { success: false, error: dbError.message }

  revalidateFormation(slug)
  return { success: true }
}

// ── Lessons ──────────────────────────────────────────────────

export async function upsertLesson(
  moduleId: string,
  slug: string,
  lessonNumber: number,
  title: string,
  duration: string,
  content: string
) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error, id: null as string | null }

  const { data, error: dbError } = await adminClient
    .from('formation_lessons')
    .upsert(
      { module_id: moduleId, lesson_number: lessonNumber, title, duration, content },
      { onConflict: 'module_id,lesson_number' }
    )
    .select('id')
    .single()

  if (dbError) return { success: false, error: dbError.message, id: null }

  revalidateFormation(slug)
  return { success: true, id: data.id }
}

export async function deleteLesson(lessonId: string, slug: string) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  const { error: dbError } = await adminClient
    .from('formation_lessons')
    .delete()
    .eq('id', lessonId)

  if (dbError) return { success: false, error: dbError.message }

  revalidateFormation(slug)
  return { success: true }
}

// ── Import static content ────────────────────────────────────

interface StaticLesson {
  id: number
  title: string
  duration: string
  content: string
}

interface StaticModule {
  id: number
  title: string
  duration: string
  lessons: StaticLesson[]
}

export async function importStaticContent(
  formationId: string,
  slug: string,
  modules: StaticModule[]
) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  for (const mod of modules) {
    const { data: modData, error: modErr } = await adminClient
      .from('formation_modules')
      .upsert(
        {
          formation_id: formationId,
          module_number: mod.id,
          title: mod.title,
          duration: mod.duration,
        },
        { onConflict: 'formation_id,module_number' }
      )
      .select('id')
      .single()

    if (modErr || !modData) continue

    for (const lesson of mod.lessons) {
      await adminClient
        .from('formation_lessons')
        .upsert(
          {
            module_id: modData.id,
            lesson_number: lesson.id,
            title: lesson.title,
            duration: lesson.duration,
            content: lesson.content,
          },
          { onConflict: 'module_id,lesson_number' }
        )
    }
  }

  revalidateFormation(slug)
  return { success: true }
}

// ── Reorder modules ──────────────────────────────────────────

export async function reorderModules(
  formationId: string,
  slug: string,
  moduleIds: string[]
) {
  const { error, adminClient } = await assertAdmin()
  if (error || !adminClient) return { success: false, error }

  for (let i = 0; i < moduleIds.length; i++) {
    await adminClient
      .from('formation_modules')
      .update({ module_number: i + 1 })
      .eq('id', moduleIds[i])
      .eq('formation_id', formationId)
  }

  revalidateFormation(slug)
  return { success: true }
}
