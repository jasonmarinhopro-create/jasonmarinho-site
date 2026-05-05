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
  COMMUNITY_GROUPS:      'community-groups',
  ROADMAP_ITEMS:         'roadmap-items',
  ROADMAP_COMMENTS:      'roadmap-comments',
  ROADMAP_VOTES:         'roadmap-votes',
  CONTRIBUTORS:          'contributors',
  ACTUALITES_PUBLISHED:  'actualites-published',
  FORMATIONS_PUBLISHED:  'formations-published',
  TEMPLATES_CATALOG:     'templates-catalog',
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
      .limit(200)
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
      .limit(500)
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

// ─── Actualités publiées (catalogue public partagé) ───────────────────────
// Données identiques pour tous les users : 1 query DB par fenêtre de cache,
// pas 1 query par visite. Invalidé via revalidateTag dans les server actions
// admin (addActualite/updateActualite/deleteActualite/togglePublish).

export interface CachedActualite {
  id: string
  title: string
  summary: string
  source_url: string | null
  category: string
  published_at: string | null
  created_at: string
  deadline_date?: string | null
  is_pinned?: boolean | null
  regions?: string[] | null
  read_time_minutes?: number | null
}

export const getCachedPublishedActualites = unstable_cache(
  async (): Promise<CachedActualite[]> => {
    const db = getServiceClient()
    const { data } = await db
      .from('actualites')
      .select('id, title, summary, source_url, category, published_at, created_at, deadline_date, is_pinned, regions, read_time_minutes')
      .eq('is_published', true)
      .order('is_pinned', { ascending: false, nullsFirst: false })
      .order('published_at', { ascending: false, nullsFirst: false })
    return (data ?? []) as CachedActualite[]
  },
  ['actualites-published-v1'],
  { tags: [CACHE_TAGS.ACTUALITES_PUBLISHED], revalidate: 300 },
)

// ─── Formations publiées (catalogue public) ───────────────────────────────
// Liste partagée entre tous les utilisateurs : 1 query DB par fenêtre de
// cache. Invalidé via revalidateTag dans les actions admin (toggle publié,
// republish, delete).

export interface CachedFormation {
  id: string
  slug: string
  title: string
  description: string | null
  duration: string | null
  level: string | null
  modules_count: number | null
  lessons_count: number | null
  created_at: string
}

export const getCachedPublishedFormations = unstable_cache(
  async (): Promise<CachedFormation[]> => {
    const db = getServiceClient()
    const { data } = await db
      .from('formations')
      .select('id, slug, title, description, duration, level, modules_count, lessons_count, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: true })
    return (data ?? []) as CachedFormation[]
  },
  ['formations-published-v1'],
  { tags: [CACHE_TAGS.FORMATIONS_PUBLISHED], revalidate: 600 },
)

// ─── Catalogue gabarits (templates de messages) ───────────────────────────
// Identique pour tous les utilisateurs hors copy_count (compteur d'usage
// purement décoratif, accepté en gel court). Invalidé via revalidateTag
// dans les server actions admin (add/update/delete).

export interface CachedTemplate {
  id: string
  title: string
  content: string
  corps_en: string | null
  category: string
  timing: string | null
  variante: string | null
  variables: string[] | null
  tags: string[] | null
  copy_count: number | null
  created_at: string
}

export const getCachedTemplatesCatalog = unstable_cache(
  async (): Promise<CachedTemplate[]> => {
    const db = getServiceClient()
    const { data } = await db
      .from('templates')
      .select('id, title, content, corps_en, category, timing, variante, variables, tags, copy_count, created_at')
      .order('category')
      .order('title')
      .limit(500)
    return (data ?? []) as CachedTemplate[]
  },
  ['templates-catalog-v1'],
  { tags: [CACHE_TAGS.TEMPLATES_CATALOG], revalidate: 300 },
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
