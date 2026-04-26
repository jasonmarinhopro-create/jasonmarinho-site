import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import ChezNousFeed from './ChezNousFeed'
import type { CategoryId } from '@/lib/chez-nous/categories'

export const dynamic  = 'force-dynamic'
export const metadata = { title: 'Chez Nous — Jason Marinho' }

type SearchParams = { cat?: string }

export default async function ChezNousPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const profile = await getProfile()
  if (!profile?.userId) redirect('/auth/login')

  const sp = await searchParams
  const supabase = await createClient()

  // Récupère les posts (avec filtre catégorie si demandé)
  let query = supabase
    .from('chez_nous_posts')
    .select('id, author_id, category, title, body, pinned, locked, reply_count, last_reply_at, created_at')
    .order('pinned', { ascending: false })
    .order('last_reply_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (sp.cat && sp.cat !== 'all') {
    query = query.eq('category', sp.cat)
  }

  const { data: postsRaw } = await query

  const posts = postsRaw ?? []

  // Récupère les profils des auteurs en bulk
  const authorIds = Array.from(new Set(posts.map(p => p.author_id)))
  const { data: authorsData } = authorIds.length
    ? await supabase
        .from('profiles')
        .select('id, full_name, pseudo, role, is_contributor, created_at')
        .in('id', authorIds)
    : { data: [] }

  const authorsMap: Record<string, {
    full_name: string | null
    pseudo: string | null
    role: string | null
    is_contributor: boolean
    created_at: string | null
  }> = {}
  ;(authorsData ?? []).forEach(a => {
    authorsMap[a.id] = {
      full_name: a.full_name,
      pseudo: a.pseudo,
      role: a.role,
      is_contributor: a.is_contributor ?? false,
      created_at: a.created_at,
    }
  })

  // Stats globales
  const { count: totalPosts }   = await supabase.from('chez_nous_posts').select('*', { count: 'exact', head: true })
  const { count: totalReplies } = await supabase.from('chez_nous_replies').select('*', { count: 'exact', head: true })

  return (
    <>
      <Header title="Chez Nous" userName={profile.full_name ?? undefined} />
      <ChezNousFeed
        posts={posts.map(p => ({
          id:            p.id,
          author_id:     p.author_id,
          category:      p.category as CategoryId,
          title:         p.title,
          body:          p.body,
          pinned:        p.pinned,
          locked:        p.locked,
          reply_count:   p.reply_count,
          last_reply_at: p.last_reply_at,
          created_at:    p.created_at,
        }))}
        authorsMap={authorsMap}
        currentUserId={profile.userId}
        isAdmin={profile.role === 'admin'}
        currentCategory={(sp.cat as CategoryId | 'all') ?? 'all'}
        stats={{ totalPosts: totalPosts ?? 0, totalReplies: totalReplies ?? 0 }}
      />
    </>
  )
}
