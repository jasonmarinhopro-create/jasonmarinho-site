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

  const cols = 'id, title, summary, source_url, category, is_published, published_at, created_at, read_time_minutes'
  // Public (migration 20261017_137), relu sans la colonne si elle manque
  type Row = { id: string; title: string; summary: string; source_url: string | null; category: string; is_published: boolean; published_at: string | null; created_at: string; read_time_minutes: number | null; audience?: string[] | null }
  const first = await supabase.from('actualites').select(`${cols}, audience`).order('created_at', { ascending: false })
  const articles = (first.error
    ? (await supabase.from('actualites').select(cols).order('created_at', { ascending: false })).data
    : first.data) as Row[] | null

  return (
    <>
      <div style={{ padding: 'clamp(24px,3vw,40px)', width: '100%' }}>
        <ActualitesAdmin articles={articles ?? []} />
      </div>
    </>
  )
}
