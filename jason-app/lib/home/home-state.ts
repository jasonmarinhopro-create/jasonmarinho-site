// Accueil hôte en une seule requête (24/10/2026) : la fonction SQL home_state
// (migration 20261024_149) renvoie les lignes que l'Accueil lisait en une
// vingtaine de requêtes. Lecture sous RLS (client utilisateur). Avant la
// migration : null, et la page reprend les anciennes requêtes une par une.
import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isMissingFunction } from './missing-function'

export type HomeState = Record<string, unknown> & {
  contracts: any[]; logements: any[]; revenus_entries: any[]; revenus_objectif: any | null
  memberships: { group_id: string }[]; user_formations: any[]; completion_log: { completed_at: string }[]
  cn_posts: any[]; cn_total: number; cn_authors: { id: string; full_name: string | null; pseudo: string | null }[]
  sejours: any[]; profile_extra: any | null; ical_events: any[]; declarations: any[]; ical_feeds: any[]
  menage_completions: { logement_nom: string; date: string }[]; menage_events: any[]
}

const LISTS = ['contracts', 'logements', 'revenus_entries', 'memberships', 'user_formations', 'completion_log', 'cn_posts', 'cn_authors', 'sejours', 'ical_events', 'declarations', 'ical_feeds', 'menage_completions', 'menage_events']

/** Base lente ou en panne : l'Accueil affiche l'écran d'erreur (nouvel essai)
 *  au lieu de relancer une vingtaine de requêtes sur une base déjà saturée. */
export class HomeStateUnavailable extends Error {
  constructor(detail: string) { super(`Accueil indisponible (home_state) : ${detail}`); this.name = 'HomeStateUnavailable' }
}

// null : seulement si la fonction manque (anciennes requêtes une par une).
// Toute autre erreur (délai dépassé, réponse incomplète) : HomeStateUnavailable.
// Avant le 18/11/2026, toute erreur donnait null : un délai dépassé de 25 s
// relançait alors 17 requêtes et l'Accueil a mis 40 s (base saturée).
export async function loadHomeState(db: SupabaseClient, p: { today: string; caStart: string; yearStart: string; yearEnd: string }): Promise<HomeState | null> {
  let res: { data: unknown; error: { code?: string; message?: string } | null }
  try {
    res = await db.rpc('home_state', { p_today: p.today, p_ca_start: p.caStart, p_year_start: p.yearStart, p_year_end: p.yearEnd })
  } catch (e) {
    throw new HomeStateUnavailable(String(e))
  }
  const { data, error } = res
  if (error) {
    if (isMissingFunction(error)) return null
    throw new HomeStateUnavailable(error.message ?? 'erreur')
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new HomeStateUnavailable('réponse vide')
  const r = data as Record<string, unknown>
  // Réponse incomplète (fonction d'une autre version) : anciennes requêtes
  if (!LISTS.every(k => Array.isArray(r[k]))) return null
  return { ...r, cn_total: Number(r.cn_total) || 0 } as HomeState
}
