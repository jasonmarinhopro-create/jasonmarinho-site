// Menu du dashboard en une seule requête (24/10/2026) : la fonction SQL
// menu_state (migration 20261024_148) renvoie la cloche, le forum, les contrats
// à traiter, les étapes du parcours et les compteurs des pros. Lecture sous RLS
// (client utilisateur). Avant la migration, ou en cas d'erreur : null, et le
// layout reprend les anciennes requêtes une par une.
import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { parseMenuState, type MenuState } from './menu-state-parse'

export type { MenuState } from './menu-state-parse'

export async function loadMenuState(opts: { onboarding: boolean; pro: boolean }): Promise<MenuState | null> {
  try {
    const db = await createClient()
    const { data, error } = await db.rpc('menu_state', { p_onboarding: opts.onboarding, p_pro: opts.pro })
    if (error) return null
    return parseMenuState(data)
  } catch {
    return null
  }
}
