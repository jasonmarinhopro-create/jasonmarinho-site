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
  const [postsRes, repliesRes, votesRes, ideasRes, auditsRes, formationsRes, communityRes, logementsRes] = await Promise.all([
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
  ])

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
    platforms:     [],
    joinedSince:   profile.created_at,
  }
}
