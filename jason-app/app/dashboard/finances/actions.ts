'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const PATHS = ['/dashboard/finances/revenus', '/dashboard/finances/performances', '/dashboard/finances/fiscalite', '/dashboard/finances/journal']

/**
 * Objectif de chiffre d'affaires annuel. logementId = objectif de ce logement
 * (colonne logements.objectif_ca_annuel, migration 112) ; null = objectif
 * global (vue « tous les logements », ou compte à un seul logement).
 */
export async function setObjectif(logementId: string | null, montant: number | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }
  const value = montant && montant > 0 ? Math.round(montant) : null

  if (logementId) {
    const { error } = await supabase
      .from('logements')
      .update({ objectif_ca_annuel: value })
      .eq('id', logementId)
      .eq('user_id', user.id)
    if (!error) {
      PATHS.forEach(p => revalidatePath(p))
      revalidatePath('/dashboard')
      return { success: true }
    }
    // Migration 112 pas encore appliquée : un compte à un seul logement
    // retombe sur l'objectif global, sinon on le dit.
    const { count } = await supabase.from('logements').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
    if ((count ?? 0) > 1) return { error: "L'objectif par logement sera disponible après la prochaine mise à jour. Choisis « Tous les logements » pour fixer un objectif global." }
  }

  const year = new Date().getFullYear()
  const { error } = value === null
    ? await supabase.from('revenus_objectifs').delete().eq('user_id', user.id)
    : await supabase.from('revenus_objectifs').upsert(
        { user_id: user.id, objectif_ca_annuel: value, annee: year, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      )
  if (error) return { error: error.message }
  PATHS.forEach(p => revalidatePath(p))
  revalidatePath('/dashboard')
  return { success: true }
}
