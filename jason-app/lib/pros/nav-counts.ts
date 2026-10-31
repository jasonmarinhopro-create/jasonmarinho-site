// Menu des pros (17/10/2026) : nombre de demandes pas encore ouvertes (statut
// « nouvelle ») pour le compteur de « Demandes reçues ». Client utilisateur :
// la RLS ne laisse lire que les demandes de sa propre fiche. Seulement pour un
// compte qui a une fiche photographe ou ménage ; une erreur donne 0.
import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { METIERS, KINDS, type ProKind } from './metiers'

export type ProNewDemandes = Record<ProKind, number>

async function countFor(kind: ProKind, userId: string): Promise<number> {
  const m = METIERS[kind]
  try {
    const db = await createClient()
    const { data: fiche } = await db.from(m.table).select('id').eq('user_id', userId).maybeSingle()
    if (!fiche?.id) return 0
    const { count } = await db.from(m.contactsTable).select('id', { count: 'exact', head: true }).eq(m.idColumn, fiche.id).eq('status', 'nouvelle')
    return count ?? 0
  } catch {
    return 0
  }
}

export async function loadProNewDemandes(userId: string, has: Partial<Record<ProKind, boolean>>): Promise<ProNewDemandes> {
  const counts = await Promise.all(KINDS.map(k => has[k] ? countFor(k, userId) : 0))
  return Object.fromEntries(KINDS.map((k, i) => [k, counts[i]])) as ProNewDemandes
}

/**
 * Dernière visite des actualités de chaque espace pro (migration 20261023_147).
 * Avant elle, ou en cas d'erreur : la date commune à tous les espaces.
 */
export async function loadProActusSeen(userId: string, fallback: string | null): Promise<{ photographer: string | null; cleaner: string | null }> {
  try {
    const db = await createClient()
    const { data, error } = await db.from('profiles').select('last_seen_actualites_photo_at, last_seen_actualites_menage_at').eq('id', userId).maybeSingle()
    if (error || !data) return { photographer: fallback, cleaner: fallback }
    return { photographer: data.last_seen_actualites_photo_at ?? null, cleaner: data.last_seen_actualites_menage_at ?? null }
  } catch {
    return { photographer: fallback, cleaner: fallback }
  }
}
