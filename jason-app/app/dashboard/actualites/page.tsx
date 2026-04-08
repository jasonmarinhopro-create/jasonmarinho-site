import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import ActualitesView from './ActualitesView'

export const metadata = { title: 'Actualités LCD — Jason Marinho' }

export interface Actualite {
  id: string
  title: string
  summary: string
  source_url: string | null
  category: string
  published_at: string | null
  created_at: string
}

export default async function ActualitesPage() {
  const [profile, supabase] = await Promise.all([
    getProfile(),
    createClient(),
  ])

  const { data: articles } = await supabase
    .from('actualites')
    .select('id, title, summary, source_url, category, published_at, created_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false, nullsFirst: false })

  return (
    <>
      <Header title="Actualités" userName={profile?.full_name ?? undefined} />
      <ActualitesView articles={articles ?? []} />
    </>
  )
}
