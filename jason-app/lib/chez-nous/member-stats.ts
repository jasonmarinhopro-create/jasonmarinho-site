/**
 * Compute badges + activity stats for a single member,
 * using existing tables. All queries respect the user's privacy flags.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { computeBadges, type BadgeId } from '@/lib/badges'

export type MemberProfile = {
  id: string
  full_name: string | null
  pseudo: string | null
  bio: string | null
  role: string | null
  is_contributor: boolean
  created_at: string | null
  privacy_show_logements: boolean
  privacy_show_platforms: boolean
  privacy_show_city: boolean
}

export type MemberStats = {
  badges: BadgeId[]
  postsCount: number
  repliesCount: number
  logementsCount: number | null   // null if hidden
  city: string | null              // null if hidden or unknown
  platforms: string[]              // [] if hidden
  joinedSince: string | null
  topCategories: { category: string; count: number }[]
  lastActiveAt: string | null
}

/**
 * Fetch a member's full Chez Nous profile + computed stats.
 * Respects privacy flags from the member's own profile settings.
 */
export async function getMemberStats(
  supabase: SupabaseClient,
  userId: string,
  profile: MemberProfile,
): Promise<MemberStats> {
  // Stats Chez Nous (toujours visibles)
  const [postsRes, repliesRes, votesRes, ideasRes, auditsRes, formationsRes, communityRes, logementsRes, postCatsRes, lastPostRes, lastReplyRes, platformsRes] = await Promise.all([
    supabase.from('chez_nous_posts').select('*', { count: 'exact', head: true }).eq('author_id', userId),
    supabase.from('chez_nous_replies').select('*', { count: 'exact', head: true }).eq('author_id', userId),
    supabase.from('roadmap_votes').select('item_id').eq('user_id', userId),
    supabase.from('roadmap_items').select('id').eq('author_id', userId).limit(1),
    supabase.from('audit_gbp_sessions').select('id').eq('user_id', userId).not('completed_at', 'is', null).limit(1),
    supabase.from('user_formations').select('formation_id').eq('user_id', userId).limit(1),
    supabase.from('user_community_memberships').select('group_id').eq('user_id', userId).eq('status', 'joined').limit(1),
    profile.privacy_show_logements
      ? supabase.from('logements').select('*', { count: 'exact', head: true }).eq('user_id', userId)
      : Promise.resolve({ count: null }),
    // Top catégories sur les 50 derniers posts
    supabase.from('chez_nous_posts').select('category').eq('author_id', userId).limit(50),
    // Last activity = max(last post, last reply)
    supabase.from('chez_nous_posts').select('created_at').eq('author_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('chez_nous_replies').select('created_at').eq('author_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    // Plateformes (depuis les liens d'annonces sur les logements)
    profile.privacy_show_platforms
      ? supabase.from('logements').select('lien_airbnb, lien_booking, lien_gmb, lien_site_direct').eq('user_id', userId)
      : Promise.resolve({ data: null }),
  ])

  // Top catégories
  const catCount: Record<string, number> = {}
  for (const p of (postCatsRes.data ?? [])) {
    const c = (p as { category: string }).category
    if (c) catCount[c] = (catCount[c] ?? 0) + 1
  }
  const topCategories = Object.entries(catCount)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  // Last active
  const lastPostAt  = (lastPostRes.data as { created_at: string } | null)?.created_at ?? null
  const lastReplyAt = (lastReplyRes.data as { created_at: string } | null)?.created_at ?? null
  const lastActiveAt = lastPostAt && lastReplyAt
    ? (lastPostAt > lastReplyAt ? lastPostAt : lastReplyAt)
    : (lastPostAt ?? lastReplyAt)

  // Plateformes utilisées (au moins 1 logement avec ce lien)
  const platformsSet = new Set<string>()
  for (const l of ((platformsRes.data ?? []) as Array<{ lien_airbnb?: string | null; lien_booking?: string | null; lien_gmb?: string | null; lien_site_direct?: string | null }>)) {
    if (l.lien_airbnb)      platformsSet.add('airbnb')
    if (l.lien_booking)     platformsSet.add('booking')
    if (l.lien_gmb)         platformsSet.add('gmb')
    if (l.lien_site_direct) platformsSet.add('direct')
  }
  const platforms = Array.from(platformsSet)

  // Calcul des badges
  const voteIds = (votesRes.data ?? []).map(v => v.item_id)
  const badges = computeBadges({
    contributorIds: [userId],
    createdAts: { [userId]: profile.created_at ?? '' },
    voteCountByUser: { [userId]: voteIds.length },
    ideaAuthorIds: new Set((ideasRes.data ?? []).length > 0 ? [userId] : []),
    auditCompletedIds: new Set((auditsRes.data ?? []).length > 0 ? [userId] : []),
    formationIds: new Set((formationsRes.data ?? []).length > 0 ? [userId] : []),
    communityIds: new Set((communityRes.data ?? []).length > 0 ? [userId] : []),
  })[userId] ?? []

  return {
    badges,
    postsCount:    postsRes.count ?? 0,
    repliesCount:  repliesRes.count ?? 0,
    logementsCount: profile.privacy_show_logements ? (logementsRes.count ?? 0) : null,
    city:          null,
    platforms,
    joinedSince:   profile.created_at,
    topCategories,
    lastActiveAt,
  }
}
