// Menu des pros (17/10/2026) : nombre de demandes pas encore ouvertes (statut
// « nouvelle ») pour le compteur de « Demandes reçues ». Client utilisateur :
// la RLS ne laisse lire que les demandes de sa propre fiche. Seulement pour un
// compte qui a une fiche photographe ou ménage ; une erreur donne 0.
import 'server-only'
import { createClient } from '@/lib/supabase/server'

export interface ProNewDemandes { photographer: number; cleaner: number }

async function countFor(table: 'photographers' | 'cleaners', contacts: 'photographer_contacts' | 'cleaner_contacts', fk: 'photographer_id' | 'cleaner_id', userId: string): Promise<number> {
  try {
    const db = await createClient()
    const { data: fiche } = await db.from(table).select('id').eq('user_id', userId).maybeSingle()
    if (!fiche?.id) return 0
    const { count } = await db.from(contacts).select('id', { count: 'exact', head: true }).eq(fk, fiche.id).eq('status', 'nouvelle')
    return count ?? 0
  } catch {
    return 0
  }
}

export async function loadProNewDemandes(userId: string, has: { photographer: boolean; cleaner: boolean }): Promise<ProNewDemandes> {
  const [photographer, cleaner] = await Promise.all([
    has.photographer ? countFor('photographers', 'photographer_contacts', 'photographer_id', userId) : 0,
    has.cleaner ? countFor('cleaners', 'cleaner_contacts', 'cleaner_id', userId) : 0,
  ])
  return { photographer, cleaner }
}
