/**
 * Requêtes globales cachées via unstable_cache.
 *
 * Usage : uniquement pour les données partagées entre tous les utilisateurs
 * (ex: liste des groupes communauté, roadmap publique, contributeurs).
 *
 * Les mutations DOIVENT appeler revalidateTag(<tag>) pour invalider le cache.
 * Tags exportés depuis CACHE_TAGS.
 */

import { unstable_cache } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const CACHE_TAGS = {
  COMMUNITY_GROUPS: 'community-groups',
  ROADMAP_ITEMS:    'roadmap-items',
  ROADMAP_COMMENTS: 'roadmap-comments',
  ROADMAP_VOTES:    'roadmap-votes',
  CONTRIBUTORS:     'contributors',
} as const

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

// ─── Communauté ────────────────────────────────────────────────────────────

export const getCachedCommunityGroups = unstable_cache(
  async () => {
    const db = getServiceClient()
    const { data } = await db
      .from('community_groups')
      .select('id, name, platform, description, members_count, url, category, tag, sort_order')
      .order('category')
      .order('sort_order')
      .order('name')
    return data ?? []
  },
  ['community-groups-v1'],
  { tags: [CACHE_TAGS.COMMUNITY_GROUPS], revalidate: 600 },
)

// ─── Roadmap ───────────────────────────────────────────────────────────────

export const getCachedRoadmapItems = unstable_cache(
  async () => {
    const db = getServiceClient()
    const { data } = await db
      .from('roadmap_items')
      .select('id, title, description, status, author_id, author_name, created_at')
      .order('created_at', { ascending: false })
    return data ?? []
  },
  ['roadmap-items-v1'],
  { tags: [CACHE_TAGS.ROADMAP_ITEMS], revalidate: 300 },
)

export const getCachedRoadmapComments = unstable_cache(
  async () => {
    const db = getServiceClient()
    const { data } = await db
      .from('roadmap_comments')
      .select('id, item_id, author_id, author_name, content, created_at')
      .order('created_at', { ascending: true })
    return data ?? []
  },
  ['roadmap-comments-v1'],
  { tags: [CACHE_TAGS.ROADMAP_COMMENTS], revalidate: 300 },
)

export const getCachedRoadmapVotes = unstable_cache(
  async () => {
    const db = getServiceClient()
    const { data } = await db
      .from('roadmap_votes')
      .select('item_id')
    return data ?? []
  },
  ['roadmap-votes-v1'],
  { tags: [CACHE_TAGS.ROADMAP_VOTES], revalidate: 120 },
)

// ─── Contributeurs (mur public) ────────────────────────────────────────────

export const getCachedContributors = unstable_cache(
  async () => {
    const db = getServiceClient()
    const { data } = await db
      .from('profiles')
      .select('id, full_name, created_at')
      .eq('is_contributor', true)
      .order('created_at', { ascending: true })
    return data ?? []
  },
  ['contributors-v1'],
  { tags: [CACHE_TAGS.CONTRIBUTORS], revalidate: 600 },
)
