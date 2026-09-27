import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import ChezNousFeed, { type Sort } from './ChezNousFeed'
import { isValidCategory, type CategoryId } from '@/lib/chez-nous/categories'
import { computeBadges, type BadgeId } from '@/lib/badges'
import { getBulkProStats, type ProStats } from '@/lib/chez-nous/pro-stats'

export const dynamic  = 'force-dynamic'
export const metadata = { title: 'Questions & réponses, Jason Marinho' }

type SearchParams = { cat?: string; sort?: string; q?: string; ask?: string }

// Questions & réponses (ex-forum Entre Hôtes, refonte sept. 2026) : la page
// ne cherche plus à ressembler à un réseau social (compteurs de membres, top
// contributeurs, carte, nouveaux membres, présentation en 3 écrans) : avec peu
// de membres, tout ça affichait surtout le vide et décourageait de poster.
// Promesse : réponse sous 48 h par Jason ou un hôte (lib/chez-nous/unanswered.ts).

export default async function ChezNousPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [profile, supabase, sp] = await Promise.all([getProfile(), createClient(), searchParams])
  if (!profile?.userId) redirect('/auth/login')

  const sort: Sort = sp.sort === 'answered' || sp.sort === 'unanswered' || sp.sort === 'popular' || sp.sort === 'unresolved'
    ? sp.sort : 'recent'
  const q   = sp.q?.trim() ?? ''
  const cat = sp.cat && isValidCategory(sp.cat) ? sp.cat : 'all'

  // ─── Phase 1 : questions + compteurs en parallèle ───────────────────────

  let postsQuery = supabase
    .from('chez_nous_posts')
    .select('id, author_id, category, title, body, pinned, locked, reply_count, vote_count, last_reply_at, created_at, edited_at, accepted_reply_id, images')
    .order('pinned', { ascending: false })
    .limit(50)

  if (sort === 'popular')         postsQuery = postsQuery.order('vote_count', { ascending: false }).order('created_at', { ascending: false })
  else if (sort === 'unanswered') postsQuery = postsQuery.eq('reply_count', 0).order('created_at', { ascending: false })
  else if (sort === 'answered')   postsQuery = postsQuery.gt('reply_count', 0).order('last_reply_at', { ascending: false, nullsFirst: false })
  else if (sort === 'unresolved') postsQuery = postsQuery.is('accepted_reply_id', null).order('last_reply_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })
  else                            postsQuery = postsQuery.order('last_reply_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })

  if (cat !== 'all') postsQuery = postsQuery.eq('category', cat)
  if (q) {
    const escaped = q.replace(/[\\%_,]/g, '\\$&')
    postsQuery = postsQuery.or(`title.ilike.%${escaped}%,body.ilike.%${escaped}%`)
  }

  const [meProfileResult, postsResult, answeredResult] = await Promise.all([
    supabase.from('profiles').select('pseudo').eq('id', profile.userId).maybeSingle(),
    postsQuery,
    supabase.from('chez_nous_posts').select('*', { count: 'exact', head: true }).gt('reply_count', 0),
  ])

  const posts           = postsResult.data ?? []
  const currentUserName = (meProfileResult.data?.pseudo ?? profile.full_name ?? '').trim()
  const authorIds       = Array.from(new Set(posts.map(p => p.author_id)))

  // ─── Phase 2 : auteurs, badges, votes, aperçus de réponses ──────────────

  type ProfileRow = { id: string; full_name: string | null; pseudo: string | null; role: string | null; is_contributor: boolean | null; created_at: string | null; privacy_show_logements: boolean | null; privacy_show_city: boolean | null }
  const none = <T,>() => Promise.resolve({ data: [] as T[] })
  const [
    profilesResult,
    votesResult,
    ideasResult,
    auditsResult,
    formationsResult,
    communityResult,
    userVotesResult,
    repliesPreviewResult,
    logementsResult,
  ] = await Promise.all([
    authorIds.length ? supabase.from('profiles').select('id, full_name, pseudo, role, is_contributor, created_at, privacy_show_logements, privacy_show_city').in('id', authorIds) : none<ProfileRow>(),
    authorIds.length ? supabase.from('roadmap_votes').select('user_id').in('user_id', authorIds) : none<{ user_id: string }>(),
    authorIds.length ? supabase.from('roadmap_items').select('author_id').in('author_id', authorIds) : none<{ author_id: string }>(),
    authorIds.length ? supabase.from('audit_gbp_sessions').select('user_id').in('user_id', authorIds).not('completed_at', 'is', null) : none<{ user_id: string }>(),
    authorIds.length ? supabase.from('user_formations').select('user_id').in('user_id', authorIds) : none<{ user_id: string }>(),
    authorIds.length ? supabase.from('user_community_memberships').select('user_id').in('user_id', authorIds).eq('status', 'joined') : none<{ user_id: string }>(),
    posts.length ? supabase.from('chez_nous_post_votes').select('post_id').eq('user_id', profile.userId).in('post_id', posts.map(p => p.id)) : none<{ post_id: string }>(),
    // 2 réponses les plus récentes par question, en aperçu sous chaque carte
    posts.length
      ? supabase.from('chez_nous_replies').select('id, post_id, author_id, body, created_at').in('post_id', posts.map(p => p.id)).order('created_at', { ascending: false }).limit(50)
      : none<{ id: string; post_id: string; author_id: string; body: string; created_at: string }>(),
    // Logements des auteurs (ville affichée à côté du nom), chargés dans la même vague
    authorIds.length ? supabase.from('logements').select('user_id, adresse').in('user_id', authorIds) : none<{ user_id: string; adresse: string | null }>(),
  ])

  const authorsData = (profilesResult.data ?? []) as ProfileRow[]
  const proStatsByUser = await getBulkProStats(supabase, authorsData.map(a => ({
    id: a.id, created_at: a.created_at,
    privacy_show_logements: a.privacy_show_logements,
    privacy_show_city: a.privacy_show_city,
  })), logementsResult.data ?? [])

  // ─── Construction des structures finales ─────────────────────────────────

  const voteCountByUser: Record<string, number> = {}
  ;(votesResult.data ?? []).forEach(v => {
    voteCountByUser[v.user_id] = (voteCountByUser[v.user_id] ?? 0) + 1
  })

  const createdAts: Record<string, string> = {}
  authorsData.forEach(a => { createdAts[a.id] = a.created_at ?? '' })

  const badgesByUser = computeBadges({
    contributorIds: authorIds,
    createdAts,
    voteCountByUser,
    ideaAuthorIds:     new Set((ideasResult.data ?? []).map(i => i.author_id)),
    auditCompletedIds: new Set((auditsResult.data ?? []).map(a => a.user_id)),
    formationIds:      new Set((formationsResult.data ?? []).map(f => f.user_id)),
    communityIds:      new Set((communityResult.data ?? []).map(c => c.user_id)),
    chezNousAuthorIds: new Set(authorIds),
  })

  const myVotedSet = new Set((userVotesResult.data ?? []).map(v => v.post_id))

  const authorsMap: Record<string, {
    full_name: string | null
    pseudo: string | null
    role: string | null
    is_contributor: boolean
    created_at: string | null
    badges: BadgeId[]
    proStats: ProStats | null
  }> = {}
  authorsData.forEach(a => {
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

  const recentRepliesByPost: Record<string, Array<{ id: string; author_id: string; body: string; created_at: string }>> = {}
  ;(repliesPreviewResult.data ?? []).forEach(r => {
    if (!recentRepliesByPost[r.post_id]) recentRepliesByPost[r.post_id] = []
    if (recentRepliesByPost[r.post_id].length < 2) {
      recentRepliesByPost[r.post_id].push({ id: r.id, author_id: r.author_id, body: r.body, created_at: r.created_at })
    }
  })

  return (
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
        images:        Array.isArray(p.images) ? p.images.slice(0, 4) : [],
        recent_replies: recentRepliesByPost[p.id] ?? [],
      }))}
      authorsMap={authorsMap}
      currentUserId={profile.userId}
      currentUserName={currentUserName}
      isAdmin={profile.role === 'admin'}
      currentCategory={cat}
      currentSort={sort}
      currentSearch={q}
      answeredCount={answeredResult.count ?? 0}
      openComposer={sp.ask === '1'}
    />
  )
}
