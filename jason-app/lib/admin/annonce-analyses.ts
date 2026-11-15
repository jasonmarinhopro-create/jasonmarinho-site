// Compteur des analyses d'annonce Airbnb (page du site
// /services/analyse-annonce-airbnb), affiché dans Admin → Visibilité.
// Une lecture SQL (annonce_analyses_stats, migration 189), gardée 5 minutes.
// Avant la migration ou en cas d'erreur : null, la carte le dit.
import 'server-only'
import { unstable_cache } from 'next/cache'
import { getServiceClient } from '@/lib/supabase/service'

export interface AnnonceAnalysesStats {
  total: number
  jours7: number
  jours30: number
  jours30Avant: number
  noteMoyenne30: number | null
  partielles30: number
  derniere: string | null
}

/** Met en forme la réponse de la base ; null si elle n'a pas la forme attendue. Pur, testé. */
export function parseAnnonceAnalysesStats(raw: unknown): AnnonceAnalysesStats | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : null)
  const total = n(r.total), jours7 = n(r.jours7), jours30 = n(r.jours30)
  if (total === null || jours7 === null || jours30 === null) return null
  return {
    total, jours7, jours30,
    jours30Avant: n(r.jours30_avant) ?? 0,
    noteMoyenne30: n(r.note_moyenne30),
    partielles30: n(r.partielles30) ?? 0,
    derniere: typeof r.derniere === 'string' ? r.derniere : null,
  }
}

const cached = unstable_cache(async () => {
  const { data, error } = await getServiceClient().rpc('annonce_analyses_stats')
  if (error) throw new Error(error.message)
  const stats = parseAnnonceAnalysesStats(data)
  if (!stats) throw new Error('annonce_analyses_stats : réponse inattendue')
  return stats
}, ['annonce-analyses-stats-v1'], { revalidate: 300, tags: ['annonce-analyses'] })

/** À n'appeler qu'après la vérification du rôle admin (page Visibilité). */
export async function loadAnnonceAnalysesStats(): Promise<AnnonceAnalysesStats | null> {
  try { return await cached() } catch { return null }
}
