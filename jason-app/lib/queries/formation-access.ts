import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Vérifie et débloque une formation pour un utilisateur Découverte.
 * - Si Standard/Driing → accès libre
 * - Si déjà débloquée → accès libre
 * - Si < 2 débloquées → débloque et autorise
 * - Si >= 2 débloquées et pas débloquée → refuse
 */
export async function checkFormationAccess(
  supabase: SupabaseClient,
  userId: string,
  formationId: string,
  plan: string,
): Promise<{ allowed: boolean }> {
  if (plan !== 'decouverte') return { allowed: true }

  const { data: existing } = await supabase
    .from('user_formations')
    .select('id')
    .eq('user_id', userId)
    .eq('formation_id', formationId)
    .maybeSingle()

  if (existing) return { allowed: true }

  const { count } = await supabase
    .from('user_formations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if ((count ?? 0) >= 2) return { allowed: false }

  await supabase.from('user_formations').upsert(
    { user_id: userId, formation_id: formationId, progress: 0, completed_lessons: [] },
    { onConflict: 'user_id,formation_id' },
  )

  return { allowed: true }
}

/** Retourne les slugs débloqués pour un utilisateur Découverte (pour la grille). */
export async function getUnlockedFormationSlugs(
  supabase: SupabaseClient,
  userId: string,
  plan: string,
): Promise<string[] | null> {
  if (plan !== 'decouverte') return null // null = tout accessible

  const { data } = await supabase
    .from('user_formations')
    .select('formation_id, formations(slug)')
    .eq('user_id', userId)

  return (data ?? [])
    .map((row: any) => row.formations?.slug)
    .filter(Boolean) as string[]
}
