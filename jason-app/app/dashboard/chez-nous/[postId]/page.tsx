import { notFound, redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import PostDetail from './PostDetail'
import type { CategoryId } from '@/lib/chez-nous/categories'
import { computeBadges, type BadgeId } from '@/lib/badges'
import { getBulkProStats, type ProStats } from '@/lib/chez-nous/pro-stats'

export const dynamic  = 'force-dynamic'

type Props = { params: Promise<{ postId: string }> }

export default async function ChezNousPostPage({ params }: Props) {
  const { postId } = await params
  const profile = await getProfile()
  if (!profile?.userId) redirect('/auth/login')

  const supabase = await createClient()

  const { data: post } = await supabase
    .from('chez_nous_posts')
    .select('id, author_id, category, title, body, pinned, locked, reply_count, vote_count, created_at, edited_at, accepted_reply_id')
    .eq('id', postId)
    .maybeSingle()

  if (!post) notFound()

  const { data: replies } = await supabase
    .from('chez_nous_replies')
    .select('id, author_id, body, created_at, edited_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  const userIds = Array.from(new Set([post.author_id, ...(replies ?? []).map(r => r.author_id)]))

  const [{ data: usersData }, { data: myVote }, ...badgeQueries] = await Promise.all([
    userIds.length ? supabase.from('profiles').select('id, full_name, pseudo, role, is_contributor, created_at, privacy_show_logements, privacy_show_city').in('id', userIds) : Promise.resolve({ data: [] }),
    supabase.from('chez_nous_post_votes').select('post_id').eq('user_id', profile.userId).eq('post_id', postId).maybeSingle(),
    userIds.length ? supabase.from('roadmap_votes').select('user_id').in('user_id', userIds) : Promise.resolve({ data: [] }),
    userIds.length ? supabase.from('roadmap_items').select('author_id').in('author_id', userIds) : Promise.resolve({ data: [] }),
    userIds.length ? supabase.from('audit_gbp_sessions').select('user_id').in('user_id', userIds).not('completed_at', 'is', null) : Promise.resolve({ data: [] }),
    userIds.length ? supabase.from('user_formations').select('user_id').in('user_id', userIds) : Promise.resolve({ data: [] }),
    userIds.length ? supabase.from('user_community_memberships').select('user_id').in('user_id', userIds).eq('status', 'joined') : Promise.resolve({ data: [] }),
  ])

  const [votesRes, ideasRes, auditsRes, formationsRes, communityRes] = badgeQueries as Array<{ data: Array<Record<string, string>> | null }>

  const voteCountByUser: Record<string, number> = {}
  ;(votesRes.data ?? []).forEach(v => { voteCountByUser[v.user_id] = (voteCountByUser[v.user_id] ?? 0) + 1 })

  const createdAts: Record<string, string> = {}
  ;(usersData ?? []).forEach(u => { createdAts[u.id] = u.created_at ?? '' })

  const badgesByUser = computeBadges({
    contributorIds: userIds,
    createdAts,
    voteCountByUser,
    ideaAuthorIds:     new Set((ideasRes.data ?? []).map(i => i.author_id)),
    auditCompletedIds: new Set((auditsRes.data ?? []).map(a => a.user_id)),
    formationIds:      new Set((formationsRes.data ?? []).map(f => f.user_id)),
    communityIds:      new Set((communityRes.data ?? []).map(c => c.user_id)),
  })

  const proStatsByUser = await getBulkProStats(
    supabase,
    (usersData ?? []).map(u => ({
      id: u.id,
      created_at: u.created_at,
      privacy_show_logements: (u as { privacy_show_logements?: boolean | null }).privacy_show_logements ?? null,
      privacy_show_city:      (u as { privacy_show_city?: boolean | null }).privacy_show_city ?? null,
    })),
  )

  const usersMap: Record<string, {
    full_name: string | null
    pseudo: string | null
    role: string | null
    is_contributor: boolean
    created_at: string | null
    badges: BadgeId[]
    proStats: ProStats | null
  }> = {}
  ;(usersData ?? []).forEach(u => {
    usersMap[u.id] = {
      full_name: u.full_name,
      pseudo: u.pseudo,
      role: u.role,
      is_contributor: u.is_contributor ?? false,
      created_at: u.created_at,
      badges: badgesByUser[u.id] ?? [],
      proStats: proStatsByUser[u.id] ?? null,
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
          vote_count:  post.vote_count ?? 0,
          created_at:  post.created_at,
          edited_at:   post.edited_at,
          has_voted:   !!myVote,
          accepted_reply_id: post.accepted_reply_id ?? null,
        }}
        replies={(replies ?? []).map(r => ({
          id:         r.id,
          author_id:  r.author_id,
          body:       r.body,
          created_at: r.created_at,
          edited_at:  r.edited_at,
        }))}
        usersMap={usersMap}
        currentUserId={profile.userId}
        isAdmin={profile.role === 'admin'}
      />
    </>
  )
}
