import 'server-only'
// Lecture de la base communautaire de signalements (reported_guests).
// Service role : la base est partagée entre tous les hôtes, alors que la RLS
// ne laisse lire à chacun que ses propres lignes. Toujours appelé APRÈS
// vérification de l'utilisateur (getUser), filtré sur les signalements
// validés, et avec les seules colonnes affichées.
import { getServiceClient } from '@/lib/supabase/service'
import { orFilter, voyageurIdentifiers, type QueryKind } from './identifiers'

export interface CommunityReport {
  id: string
  identifier: string
  identifier_type: string
  name: string | null
  incident_type: string
  description: string | null
  reported_at: string
  extra_identifiers?: string[] | null
}

const COLS = 'id, identifier, identifier_type, name, incident_type, description, reported_at'

/**
 * Cherche les signalements validés qui correspondent à ces formes d'un
 * identifiant. Tolère l'absence de la colonne extra_identifiers (migration
 * 20260928_113 pas encore appliquée).
 */
export async function findReports(values: string[], kind: QueryKind, limit = 20): Promise<{ data: CommunityReport[]; error?: string }> {
  if (values.length === 0) return { data: [] }
  const admin = getServiceClient()
  const run = (withExtra: boolean) => admin
    .from('reported_guests')
    .select(withExtra ? `${COLS}, extra_identifiers` : COLS)
    .or(orFilter(values, kind, withExtra))
    .eq('is_validated', true)
    .order('reported_at', { ascending: false })
    .limit(limit)

  let res = await run(true)
  if (res.error && res.error.code === '42703') res = await run(false)
  if (res.error) return { data: [], error: res.error.code === '42P01' ? 'TABLE_MISSING' : res.error.message }
  return { data: (res.data ?? []) as unknown as CommunityReport[] }
}

/**
 * Pour une liste de voyageurs : lesquels sont signalés (au moins un
 * signalement négatif validé). Renvoie les motifs par voyageur.
 */
export async function flaggedVoyageurs<T extends { id: string; email?: string | null; telephone?: string | null }>(
  voyageurs: T[],
  isNegative: (incidentType: string) => boolean,
): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>()
  const idsByValue = new Map<string, string[]>()
  for (const v of voyageurs) {
    for (const val of voyageurIdentifiers(v)) {
      idsByValue.set(val, [...(idsByValue.get(val) ?? []), v.id])
    }
  }
  const values = Array.from(idsByValue.keys())
  // Par paquets : l'URL PostgREST a une longueur limite
  for (let i = 0; i < values.length; i += 80) {
    const chunk = values.slice(i, i + 80)
    const { data } = await findReports(chunk, 'phone', 500)
    for (const r of data) {
      if (!isNegative(r.incident_type)) continue
      const keys = [r.identifier, ...(r.extra_identifiers ?? [])]
      for (const k of keys) {
        for (const vid of idsByValue.get(k) ?? []) {
          const motifs = out.get(vid) ?? []
          if (!motifs.includes(r.incident_type)) motifs.push(r.incident_type)
          out.set(vid, motifs)
        }
      }
    }
  }
  return out
}
