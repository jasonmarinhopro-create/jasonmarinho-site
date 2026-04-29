import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import ChezNousFeed from './ChezNousFeed'
import WelcomeModal from '@/components/chez-nous/WelcomeModal'
import type { CategoryId } from '@/lib/chez-nous/categories'
import { computeBadges, type BadgeId } from '@/lib/badges'
import { getBulkProStats, type ProStats } from '@/lib/chez-nous/pro-stats'
import { aggregateRegionsByMember } from '@/lib/chez-nous/regions'

export const dynamic  = 'force-dynamic'
export const metadata = { title: 'Chez Nous — Jason Marinho' }

type SearchParams = { cat?: string; sort?: string; q?: string }

export default async function ChezNousPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const profile = await getProfile()
  if (!profile?.userId) redirect('/auth/login')

  const sp       = await searchParams
  const supabase = await createClient()

  // Onboarding : si jamais vu le tour
  const { data: meProfile } = await supabase
    .from('profiles')
    .select('chez_nous_onboarded_at')
    .eq('id', profile.userId)
    .maybeSingle()
  const showWelcome = !meProfile?.chez_nous_onboarded_at
  const sort     = (sp.sort as 'recent' | 'popular' | 'unanswered' | 'unresolved') ?? 'recent'
  const q        = sp.q?.trim() ?? ''

  // Posts (avec filtres)
  let query = supabase
    .from('chez_nous_posts')
    .select('id, author_id, category, title, body, pinned, locked, reply_count, vote_count, last_reply_at, created_at, edited_at, accepted_reply_id, images')
    .order('pinned', { ascending: false })
    .limit(50)

  if (sort === 'popular')         query = query.order('vote_count', { ascending: false }).order('created_at', { ascending: false })
  else if (sort === 'unanswered') query = query.eq('reply_count', 0).order('created_at', { ascending: false })
  else if (sort === 'unresolved') query = query.is('accepted_reply_id', null).order('last_reply_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })
  else                            query = query.order('last_reply_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })

  if (sp.cat && sp.cat !== 'all') query = query.eq('category', sp.cat)

  if (q) {
    // Échappe les % et _ pour ILIKE, puis cherche dans titre OU body
    const escaped = q.replace(/[\\%_]/g, '\\$&')
    query = query.or(`title.ilike.%${escaped}%,body.ilike.%${escaped}%`)
  }

  const { data: postsRaw } = await query
  const posts = postsRaw ?? []

  // Auteurs en bulk (avec privacy flags pour computer les pro stats)
  const authorIds = Array.from(new Set(posts.map(p => p.author_id)))
  const { data: authorsData } = authorIds.length
    ? await supabase
        .from('profiles')
        .select('id, full_name, pseudo, role, is_contributor, created_at, privacy_show_logements, privacy_show_city')
        .in('id', authorIds)
    : { data: [] }

  // Pro stats compactes (logements, ville, ancienneté)
  const proStatsByUser = await getBulkProStats(
    supabase,
    (authorsData ?? []).map(a => ({
      id: a.id,
      created_at: a.created_at,
      privacy_show_logements: a.privacy_show_logements,
      privacy_show_city: a.privacy_show_city,
    })),
  )

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
    // Tous les auteurs présents dans les posts du feed ont posté Chez Nous
    chezNousAuthorIds: new Set(authorIds),
  })

  const myVotedSet = new Set((userVotesData as Array<{ post_id: string }> | null ?? []).map(v => v.post_id))

  const authorsMap: Record<string, {
    full_name: string | null
    pseudo: string | null
    role: string | null
    is_contributor: boolean
    created_at: string | null
    badges: BadgeId[]
    proStats: ProStats | null
  }> = {}
  ;(authorsData ?? []).forEach(a => {
    authorsMap[a.id] = {
      full_name: a.full_name,
      pseudo: a.pseudo,
      role: a.role,
      is_contributor: a.is_contributor ?? false,
      created_at: a.created_at,
      badges: badgesByUser[a.id] ?? [],
      proStats: proStatsByUser[a.id] ?? null,
    }
  })

  const { count: totalPosts }   = await supabase.from('chez_nous_posts').select('*', { count: 'exact', head: true })
  const { count: totalReplies } = await supabase.from('chez_nous_replies').select('*', { count: 'exact', head: true })
  const { count: totalMembers } = await supabase.from('profiles').select('*', { count: 'exact', head: true })

  // Nouveaux membres : les 5 derniers inscrits (hors moi-même)
  const { data: newMembersData } = await supabase
    .from('profiles')
    .select('id, full_name, pseudo, is_contributor, created_at, privacy_show_city')
    .neq('id', profile.userId)
    .order('created_at', { ascending: false })
    .limit(6)
  const newMemberIds = (newMembersData ?? []).map(m => m.id)
  const newMembersStats = await getBulkProStats(
    supabase,
    (newMembersData ?? []).map(m => ({
      id: m.id, created_at: m.created_at,
      privacy_show_logements: false, privacy_show_city: m.privacy_show_city,
    })),
  )
  const newMembers = (newMembersData ?? []).map(m => ({
    id: m.id,
    full_name: m.full_name,
    pseudo: m.pseudo,
    is_contributor: m.is_contributor ?? false,
    created_at: m.created_at,
    city: newMembersStats[m.id]?.city ?? null,
  }))
  void newMemberIds

  // Top contributors derniers 30 jours (post = 2pts, réponse = 1pt)
  const since30d = new Date(Date.now() - 30 * 86400000).toISOString()
  const [{ data: recentPostsForRank }, { data: recentRepliesForRank }] = await Promise.all([
    supabase.from('chez_nous_posts').select('author_id').gte('created_at', since30d),
    supabase.from('chez_nous_replies').select('author_id').gte('created_at', since30d),
  ])
  const activityScore: Record<string, number> = {}
  ;(recentPostsForRank ?? []).forEach(p => { activityScore[p.author_id] = (activityScore[p.author_id] ?? 0) + 2 })
  ;(recentRepliesForRank ?? []).forEach(r => { activityScore[r.author_id] = (activityScore[r.author_id] ?? 0) + 1 })
  const topMemberIds = Object.entries(activityScore)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => id)
  const { data: topMembersData } = topMemberIds.length
    ? await supabase.from('profiles').select('id, full_name, pseudo, is_contributor').in('id', topMemberIds)
    : { data: [] }
  const topMembers = topMemberIds
    .map(id => {
      const m = (topMembersData ?? []).find(p => p.id === id)
      if (!m) return null
      return {
        id, full_name: m.full_name, pseudo: m.pseudo,
        is_contributor: m.is_contributor ?? false,
        score: activityScore[id] ?? 0,
      }
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)

  // Compteurs par catégorie
  const { data: catCountsRaw } = await supabase.from('chez_nous_posts').select('category')
  const catCounts: Record<string, number> = {}
  ;(catCountsRaw ?? []).forEach(c => { catCounts[c.category] = (catCounts[c.category] ?? 0) + 1 })

  // Activité ambiante : derniers événements (posts + replies)
  const [{ data: recentReplies }, { data: recentPosts }] = await Promise.all([
    supabase
      .from('chez_nous_replies')
      .select('id, post_id, author_id, created_at, chez_nous_posts(title, author_id)')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('chez_nous_posts')
      .select('id, author_id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // Mappe tous les auteurs nécessaires (replies + post auteur cible)
  const activityUserIds = new Set<string>()
  ;(recentReplies ?? []).forEach((r: { author_id: string; chez_nous_posts?: { author_id?: string } | { author_id?: string }[] | null }) => {
    activityUserIds.add(r.author_id)
    const cnp = Array.isArray(r.chez_nous_posts) ? r.chez_nous_posts[0] : r.chez_nous_posts
    if (cnp?.author_id) activityUserIds.add(cnp.author_id)
  })
  ;(recentPosts ?? []).forEach(p => activityUserIds.add(p.author_id))

  const { data: activityProfilesData } = activityUserIds.size
    ? await supabase
        .from('profiles')
        .select('id, full_name, pseudo')
        .in('id', Array.from(activityUserIds))
    : { data: [] }
  const activityProfiles: Record<string, { full_name: string | null; pseudo: string | null }> = {}
  ;(activityProfilesData ?? []).forEach(p => {
    activityProfiles[p.id] = { full_name: p.full_name, pseudo: p.pseudo }
  })

  type ActivityEvent =
    | { kind: 'reply'; id: string; created_at: string; replierId: string; postTitle: string; postAuthorId: string; postId: string }
    | { kind: 'post'; id: string; created_at: string; authorId: string; title: string }

  const activityEvents: ActivityEvent[] = []
  ;(recentReplies ?? []).forEach((r: { id: string; post_id: string; author_id: string; created_at: string; chez_nous_posts?: { title?: string; author_id?: string } | { title?: string; author_id?: string }[] | null }) => {
    const cnp = Array.isArray(r.chez_nous_posts) ? r.chez_nous_posts[0] : r.chez_nous_posts
    if (!cnp?.title || !cnp?.author_id) return
    activityEvents.push({
      kind: 'reply', id: r.id, created_at: r.created_at,
      replierId: r.author_id, postTitle: cnp.title, postAuthorId: cnp.author_id, postId: r.post_id,
    })
  })
  ;(recentPosts ?? []).forEach(p => {
    activityEvents.push({
      kind: 'post', id: p.id, created_at: p.created_at,
      authorId: p.author_id, title: p.title,
    })
  })
  activityEvents.sort((a, b) => b.created_at.localeCompare(a.created_at))
  const activity = activityEvents.slice(0, 6)

  // Régions des membres (carte de France) — uniquement profils ayant
  // privacy_show_city != false, agrégé par membre (pas par logement)
  const { data: allLogements } = await supabase
    .from('logements')
    .select('user_id, adresse')
  const { data: privacyData } = await supabase
    .from('profiles')
    .select('id, privacy_show_city')

  const allowedUserIds = new Set(
    (privacyData ?? [])
      .filter(p => p.privacy_show_city !== false)
      .map(p => p.id),
  )
  const addressesByMember: Record<string, string[]> = {}
  ;(allLogements ?? []).forEach((l: { user_id: string; adresse: string | null }) => {
    if (!allowedUserIds.has(l.user_id) || !l.adresse) return
    if (!addressesByMember[l.user_id]) addressesByMember[l.user_id] = []
    addressesByMember[l.user_id].push(l.adresse)
  })
  const regionCounts = aggregateRegionsByMember(addressesByMember)

  return (
    <>
      {showWelcome && <WelcomeModal />}
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
          is_resolved:   !!p.accepted_reply_id,
          image_count:   Array.isArray(p.images) ? p.images.length : 0,
        }))}
        authorsMap={authorsMap}
        currentUserId={profile.userId}
        isAdmin={profile.role === 'admin'}
        currentCategory={(sp.cat as CategoryId | 'all') ?? 'all'}
        currentSort={sort}
        currentSearch={q}
        stats={{
          totalPosts:   totalPosts ?? 0,
          totalReplies: totalReplies ?? 0,
          totalMembers: totalMembers ?? 0,
        }}
        topMembers={topMembers}
        newMembers={newMembers}
        catCounts={catCounts}
        activity={activity}
        activityProfiles={activityProfiles}
        regionCounts={regionCounts}
      />
    </>
  )
}
