import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params
  const supabase = getServiceClient()

  // Get formation
  const { data: formation } = await supabase
    .from('formations')
    .select('id, title, description, duration, level, modules_count, lessons_count, is_published')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!formation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Get first module and first lesson from DB
  const { data: modules } = await supabase
    .from('formation_modules')
    .select(`
      module_number, title, duration,
      formation_lessons(lesson_number, title, duration, content)
    `)
    .eq('formation_id', formation.id)
    .order('module_number')
    .limit(1)

  let firstLesson = null
  if (modules && modules.length > 0) {
    const mod = modules[0] as any
    const lessons = ((mod.formation_lessons ?? []) as any[]).sort(
      (a: any, b: any) => a.lesson_number - b.lesson_number
    )
    if (lessons.length > 0) {
      const l = lessons[0]
      firstLesson = {
        moduleTitle: mod.title,
        moduleNumber: mod.module_number,
        lessonNumber: l.lesson_number,
        title: l.title,
        duration: l.duration,
        // Send only first ~800 chars for the preview
        preview: l.content.slice(0, 800),
      }
    }
  }

  return NextResponse.json(
    {
      formation: {
        title: formation.title,
        description: formation.description,
        duration: formation.duration,
        level: formation.level,
        modulesCount: formation.modules_count,
        lessonsCount: formation.lessons_count,
      },
      firstLesson,
    },
    {
      headers: {
        'Access-Control-Allow-Origin': 'https://jasonmarinho.com',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  )
}
