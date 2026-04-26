import { notFound, redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import PostDetail from './PostDetail'
import type { CategoryId } from '@/lib/chez-nous/categories'

export const dynamic  = 'force-dynamic'

type Props = { params: Promise<{ postId: string }> }

export default async function ChezNousPostPage({ params }: Props) {
  const { postId } = await params
  const profile = await getProfile()
  if (!profile?.userId) redirect('/auth/login')

  const supabase = await createClient()

  const { data: post } = await supabase
    .from('chez_nous_posts')
    .select('id, author_id, category, title, body, pinned, locked, reply_count, created_at')
    .eq('id', postId)
    .maybeSingle()

  if (!post) notFound()

  const { data: replies } = await supabase
    .from('chez_nous_replies')
    .select('id, author_id, body, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  const userIds = Array.from(new Set([post.author_id, ...(replies ?? []).map(r => r.author_id)]))
  const { data: usersData } = userIds.length
    ? await supabase
        .from('profiles')
        .select('id, full_name, pseudo, role, is_contributor, created_at')
        .in('id', userIds)
    : { data: [] }

  const usersMap: Record<string, {
    full_name: string | null
    pseudo: string | null
    role: string | null
    is_contributor: boolean
    created_at: string | null
  }> = {}
  ;(usersData ?? []).forEach(u => {
    usersMap[u.id] = {
      full_name: u.full_name,
      pseudo: u.pseudo,
      role: u.role,
      is_contributor: u.is_contributor ?? false,
      created_at: u.created_at,
    }
  })

  return (
    <>
      <Header title="Chez Nous" userName={profile.full_name ?? undefined} />
      <PostDetail
        post={{
          id:          post.id,
          author_id:   post.author_id,
          category:    post.category as CategoryId,
          title:       post.title,
          body:        post.body,
          pinned:      post.pinned,
          locked:      post.locked,
          reply_count: post.reply_count,
          created_at:  post.created_at,
        }}
        replies={(replies ?? []).map(r => ({
          id:         r.id,
          author_id:  r.author_id,
          body:       r.body,
          created_at: r.created_at,
        }))}
        usersMap={usersMap}
        currentUserId={profile.userId}
        isAdmin={profile.role === 'admin'}
      />
    </>
  )
}
