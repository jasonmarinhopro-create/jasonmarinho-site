import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import BlogView from './BlogView'

export const metadata = { title: 'Blog — Jason Marinho' }

export interface BlogPost {
  id: string
  title: string
  slug: string
  summary: string | null
  category: string
  reading_time: number | null
  is_published: boolean
  published_at: string | null
  created_at: string
}

export default async function BlogPage() {
  const [profile, supabase] = await Promise.all([
    getProfile(),
    createClient(),
  ])

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, summary, category, reading_time, is_published, published_at, created_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false, nullsFirst: false })

  return (
    <>
      <Header title="Blog" userName={profile?.full_name ?? undefined} />
      <BlogView posts={posts ?? []} />
    </>
  )
}
