import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import Header from '@/components/layout/Header'
import dynamic from 'next/dynamic'
import DashboardSkeleton from '@/components/ui/DashboardSkeleton'
import { FORMATION_CONTENT_MAP } from './contentMap'

const FormationEditor = dynamic(() => import('./FormationEditor'), {
  ssr: false,
  loading: () => <DashboardSkeleton />,
})

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

interface PageProps {
  params: { slug: string }
}

export default async function AdminFormationEditorPage({ params }: PageProps) {
  const { slug } = params

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const adminClient = getServiceClient()

  // Fetch formation metadata
  const { data: formation } = await adminClient
    .from('formations')
    .select('id, title')
    .eq('slug', slug)
    .single()

  if (!formation) notFound()

  // Fetch existing DB modules + lessons
  const { data: dbModules } = await adminClient
    .from('formation_modules')
    .select(`
      id, module_number, title, duration,
      formation_lessons(id, lesson_number, title, duration, content)
    `)
    .eq('formation_id', formation.id)
    .order('module_number')

  // Normalize nested lessons
  const normalizedModules = (dbModules ?? []).map((m: any) => ({
    id: m.id,
    module_number: m.module_number,
    title: m.title,
    duration: m.duration,
    lessons: ((m.formation_lessons ?? []) as any[])
      .sort((a: any, b: any) => a.lesson_number - b.lesson_number)
      .map((l: any) => ({
        id: l.id,
        lesson_number: l.lesson_number,
        title: l.title,
        duration: l.duration,
        content: l.content,
      })),
  }))

  // Static content for import button
  const staticContent = FORMATION_CONTENT_MAP[slug] ?? null

  return (
    <>
      <Header title={`Éditer — ${formation.title}`} userName={profile?.full_name ?? ''} currentPlan="Administrateur" />
      <FormationEditor
        formation={formation}
        dbModules={normalizedModules}
        staticContent={staticContent}
        slug={slug}
      />
    </>
  )
}
