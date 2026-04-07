import { createClient } from '@/lib/supabase/server'

export interface FormationContent {
  title: string
  description: string
  duration: string
  level: string
  objectifs: string[]
  modules: {
    id: number
    title: string
    duration: string
    lessons: {
      id: number
      title: string
      duration: string
      content: string
    }[]
  }[]
}

/**
 * Fetches formation modules and lessons from the database.
 * Returns null if no DB content exists for this formation yet.
 * Falls back to staticFormation if no DB content found.
 */
export async function getFormationDbContent(
  formationId: string | null,
  staticFormation: FormationContent,
): Promise<FormationContent> {
  if (!formationId) return staticFormation

  try {
    const supabase = await createClient()

    const { data: dbModules } = await supabase
      .from('formation_modules')
      .select(`
        module_number, title, duration,
        formation_lessons(lesson_number, title, duration, content)
      `)
      .eq('formation_id', formationId)
      .order('module_number')

    if (!dbModules || dbModules.length === 0) return staticFormation

    // Also fetch updated metadata (title, description, objectifs)
    const { data: meta } = await supabase
      .from('formations')
      .select('title, description, duration, level, objectifs')
      .eq('id', formationId)
      .single()

    return {
      title: meta?.title ?? staticFormation.title,
      description: meta?.description ?? staticFormation.description,
      duration: meta?.duration ?? staticFormation.duration,
      level: meta?.level ?? staticFormation.level,
      objectifs: (meta?.objectifs && (meta.objectifs as string[]).length > 0)
        ? (meta.objectifs as string[])
        : staticFormation.objectifs,
      modules: (dbModules as any[]).map(m => ({
        id: m.module_number,
        title: m.title,
        duration: m.duration,
        lessons: ((m.formation_lessons ?? []) as any[])
          .sort((a: any, b: any) => a.lesson_number - b.lesson_number)
          .map((l: any) => ({
            id: l.lesson_number,
            title: l.title,
            duration: l.duration,
            content: l.content,
          })),
      })),
    }
  } catch {
    return staticFormation
  }
}
