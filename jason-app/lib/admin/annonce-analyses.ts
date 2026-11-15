// Compteur des deux outils publics du site : analyse d'annonce Airbnb
// (/services/analyse-annonce-airbnb) et audit express de la fiche Google
// (/services/audit-gbp), affiché dans Admin → Visibilité.
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

const cached = unstable_cache(async (outil: AnalyseOutil) => {
  const { data, error } = await getServiceClient().rpc('annonce_analyses_stats', { p_outil: outil })
  if (error) throw new Error(error.message)
  const stats = parseAnnonceAnalysesStats(data)
  if (!stats) throw new Error('annonce_analyses_stats : réponse inattendue')
  return stats
}, ['annonce-analyses-stats-v2'], { revalidate: 300, tags: ['annonce-analyses'] })

export interface AnnonceAnalyse {
  date: string
  score: number
  complet: boolean
  /** Lien de l'annonce, refait à partir de son numéro ; null pour les lignes d'avant la migration 190 */
  lien: string | null
  /** Nom de l'établissement (fiche Google) ; null pour une annonce Airbnb */
  libelle: string | null
  sections: Array<{ id: string; score: number; max: number }>
}

/** Dernières analyses rendues par annonce_analyses_recentes ; lignes illisibles ignorées. Pur, testé. */
export type AnalyseOutil = 'airbnb' | 'gbp'

export function parseAnnonceAnalyses(raw: unknown, outil: AnalyseOutil = 'airbnb'): AnnonceAnalyse[] {
  if (!Array.isArray(raw)) return []
  const out: AnnonceAnalyse[] = []
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue
    const r = x as Record<string, unknown>
    if (typeof r.created_at !== 'string' || typeof r.score !== 'number') continue
    const brut = typeof r.annonce_id === 'string' ? r.annonce_id : ''
    const lien = outil === 'gbp'
      ? (/^[A-Za-z0-9_-]{10,200}$/.test(brut) ? `https://www.google.com/maps/place/?q=place_id:${brut}` : null)
      : (/^\d{5,24}$/.test(brut) ? `https://www.airbnb.fr/rooms/${brut}` : null)
    const sections = Array.isArray(r.sections)
      ? r.sections.flatMap(sec => {
          const o = sec as Record<string, unknown> | null
          return o && typeof o.id === 'string' && typeof o.score === 'number' && typeof o.max === 'number' ? [{ id: o.id, score: o.score, max: o.max }] : []
        })
      : []
    out.push({ date: r.created_at, score: Math.round(r.score), complet: r.complet !== false, lien, libelle: typeof r.libelle === 'string' && r.libelle ? r.libelle : null, sections })
  }
  return out
}

const cachedRecent = unstable_cache(async (outil: AnalyseOutil) => {
  const { data, error } = await getServiceClient().rpc('annonce_analyses_recentes', { p_limit: 20, p_outil: outil })
  if (error) throw new Error(error.message)
  return parseAnnonceAnalyses(data, outil)
}, ['annonce-analyses-recentes-v2'], { revalidate: 300, tags: ['annonce-analyses'] })

/** Vide avant la migration 191 ou en cas d'erreur. À n'appeler qu'après la vérification du rôle admin. */
export async function loadAnnonceAnalysesRecentes(outil: AnalyseOutil = 'airbnb'): Promise<AnnonceAnalyse[]> {
  try { return await cachedRecent(outil) } catch { return [] }
}

/** À n'appeler qu'après la vérification du rôle admin (page Visibilité). */
export async function loadAnnonceAnalysesStats(outil: AnalyseOutil = 'airbnb'): Promise<AnnonceAnalysesStats | null> {
  try { return await cached(outil) } catch { return null }
}
