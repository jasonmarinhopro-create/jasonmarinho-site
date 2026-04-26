import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import ChezNousFeed from './ChezNousFeed'
import type { CategoryId } from '@/lib/chez-nous/categories'
import { computeBadges, type BadgeId } from '@/lib/badges'

export const dynamic  = 'force-dynamic'
export const metadata = { title: 'Chez Nous — Jason Marinho' }

type SearchParams = { cat?: string; sort?: string }

export default async function ChezNousPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const profile = await getProfile()
  if (!profile?.userId) redirect('/auth/login')

  const sp       = await searchParams
  const supabase = await createClient()
  const sort     = (sp.sort as 'recent' | 'popular' | 'unanswered') ?? 'recent'

  // Posts (avec filtres)
  let query = supabase
    .from('chez_nous_posts')
    .select('id, author_id, category, title, body, pinned, locked, reply_count, vote_count, last_reply_at, created_at, edited_at')
    .order('pinned', { ascending: false })
    .limit(50)

  if (sort === 'popular')         query = query.order('vote_count', { ascending: false }).order('created_at', { ascending: false })
  else if (sort === 'unanswered') query = query.eq('reply_count', 0).order('created_at', { ascending: false })
  else                            query = query.order('last_reply_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })

  if (sp.cat && sp.cat !== 'all') query = query.eq('category', sp.cat)

  const { data: postsRaw } = await query
  const posts = postsRaw ?? []

  // Auteurs en bulk
  const authorIds = Array.from(new Set(posts.map(p => p.author_id)))
  const { data: authorsData } = authorIds.length
    ? await supabase
        .from('profiles')
        .select('id, full_name, pseudo, role, is_contributor, created_at')
        .in('id', authorIds)
    : { data: [] }

  // Données pour calculer les badges des auteurs
  const [
    { data: votesData },
    { data: ideasData },
    { data: auditsData },
    { data: formationsData },
    { data: communityData },
    { data: userVotesData },
  ] = await Promise.all([
    authorIds.length ? supabase.from('roadmap_votes').select('user_id').in('user_id', authorIds) : Promise.resolve({ data: [] }),
    authorIds.length ? supabase.from('roadmap_items').select('author_id').in('author_id', authorIds) : Promise.resolve({ data: [] }),
    authorIds.length ? supabase.from('audit_gbp_sessions').select('user_id').in('user_id', authorIds).not('completed_at', 'is', null) : Promise.resolve({ data: [] }),
    authorIds.length ? supabase.from('user_formations').select('user_id').in('user_id', authorIds) : Promise.resolve({ data: [] }),
    authorIds.length ? supabase.from('user_community_memberships').select('user_id').in('user_id', authorIds).eq('status', 'joined') : Promise.resolve({ data: [] }),
    posts.length     ? supabase.from('chez_nous_post_votes').select('post_id').eq('user_id', profile.userId).in('post_id', posts.map(p => p.id)) : Promise.resolve({ data: [] }),
  ])

  const voteCountByUser: Record<string, number> = {}
  ;(votesData as Array<{ user_id: string }> | null ?? []).forEach(v => {
    voteCountByUser[v.user_id] = (voteCountByUser[v.user_id] ?? 0) + 1
  })

  const createdAts: Record<string, string> = {}
  ;(authorsData ?? []).forEach(a => { createdAts[a.id] = a.created_at ?? '' })

  const badgesByUser = computeBadges({
    contributorIds: authorIds,
    createdAts,
    voteCountByUser,
    ideaAuthorIds:     new Set((ideasData as Array<{ author_id: string }> | null ?? []).map(i => i.author_id)),
    auditCompletedIds: new Set((auditsData as Array<{ user_id: string }> | null ?? []).map(a => a.user_id)),
    formationIds:      new Set((formationsData as Array<{ user_id: string }> | null ?? []).map(f => f.user_id)),
    communityIds:      new Set((communityData as Array<{ user_id: string }> | null ?? []).map(c => c.user_id)),
  })

  const myVotedSet = new Set((userVotesData as Array<{ post_id: string }> | null ?? []).map(v => v.post_id))

  const authorsMap: Record<string, {
    full_name: string | null
    pseudo: string | null
    role: string | null
    is_contributor: boolean
    created_at: string | null
    badges: BadgeId[]
  }> = {}
  ;(authorsData ?? []).forEach(a => {
    authorsMap[a.id] = {
      full_name: a.full_name,
      pseudo: a.pseudo,
      role: a.role,
      is_contributor: a.is_contributor ?? false,
      created_at: a.created_at,
      badges: badgesByUser[a.id] ?? [],
    }
  })

  const { count: totalPosts }   = await supabase.from('chez_nous_posts').select('*', { count: 'exact', head: true })
  const { count: totalReplies } = await supabase.from('chez_nous_replies').select('*', { count: 'exact', head: true })
  const { count: totalMembers } = await supabase.from('profiles').select('*', { count: 'exact', head: true })

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
          vote_count:    p.vote_count ?? 0,
          last_reply_at: p.last_reply_at,
          created_at:    p.created_at,
          edited_at:     p.edited_at,
          has_voted:     myVotedSet.has(p.id),
        }))}
        authorsMap={authorsMap}
        currentUserId={profile.userId}
        isAdmin={profile.role === 'admin'}
        currentCategory={(sp.cat as CategoryId | 'all') ?? 'all'}
        currentSort={sort}
        stats={{
          totalPosts:   totalPosts ?? 0,
          totalReplies: totalReplies ?? 0,
          totalMembers: totalMembers ?? 0,
        }}
      />
    </>
  )
}
