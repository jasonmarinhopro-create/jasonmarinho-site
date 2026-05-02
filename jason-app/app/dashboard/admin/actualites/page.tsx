import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ActualitesAdmin from './ActualitesAdmin'

export const metadata = { title: 'Actualités, Admin, Jason Marinho' }

export default async function AdminActualitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: articles } = await supabase
    .from('actualites')
    .select('id, title, summary, source_url, category, is_published, published_at, created_at, read_time_minutes')
    .order('created_at', { ascending: false })

  return (
    <>
      <div style={{ padding: 'clamp(24px,3vw,40px)', maxWidth: '900px' }}>
        <ActualitesAdmin articles={articles ?? []} />
      </div>
    </>
  )
}
