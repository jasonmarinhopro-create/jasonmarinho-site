// Accueil hôte en une seule requête (24/10/2026) : la fonction SQL home_state
// (migration 20261024_149) renvoie les lignes que l'Accueil lisait en une
// vingtaine de requêtes. Lecture sous RLS (client utilisateur). Avant la
// migration, ou en cas d'erreur : null, et la page reprend les anciennes
// requêtes une par une.
import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

export type HomeState = Record<string, unknown> & {
  contracts: any[]; logements: any[]; revenus_entries: any[]; revenus_objectif: any | null
  memberships: { group_id: string }[]; user_formations: any[]; completion_log: { completed_at: string }[]
  cn_posts: any[]; cn_total: number; cn_authors: { id: string; full_name: string | null; pseudo: string | null }[]
  sejours: any[]; profile_extra: any | null; ical_events: any[]; declarations: any[]; ical_feeds: any[]
  menage_completions: { logement_nom: string; date: string }[]; menage_events: any[]
}

const LISTS = ['contracts', 'logements', 'revenus_entries', 'memberships', 'user_formations', 'completion_log', 'cn_posts', 'cn_authors', 'sejours', 'ical_events', 'declarations', 'ical_feeds', 'menage_completions', 'menage_events']

export async function loadHomeState(db: SupabaseClient, p: { today: string; caStart: string; yearStart: string; yearEnd: string }): Promise<HomeState | null> {
  try {
    const { data, error } = await db.rpc('home_state', { p_today: p.today, p_ca_start: p.caStart, p_year_start: p.yearStart, p_year_end: p.yearEnd })
    if (error || !data || typeof data !== 'object' || Array.isArray(data)) return null
    const r = data as Record<string, unknown>
    // Réponse incomplète (fonction d'une autre version) : on ne s'y fie pas
    if (!LISTS.every(k => Array.isArray(r[k]))) return null
    return { ...r, cn_total: Number(r.cn_total) || 0 } as HomeState
  } catch {
    return null
  }
}
