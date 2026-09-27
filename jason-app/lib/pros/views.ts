// Vues des fiches pros par jour (table pro_fiche_views_daily, migration
// 20260927_110) → « vues ce mois-ci », comparaison au mois dernier et
// histogramme des 30 derniers jours, affichés dans l'espace pro.
import type { SupabaseClient } from '@supabase/supabase-js'

export interface ViewsTrend {
  thisMonth: number
  lastMonth: number
  /** 30 derniers jours, du plus ancien au plus récent (jours sans vue = 0) */
  daily: Array<{ day: string; views: number }>
  available: boolean
}

function isoDay(d: Date) { return d.toISOString().slice(0, 10) }

/** Pur (testé) : agrège les lignes (day, views) par rapport à `today` (YYYY-MM-DD). */
export function summarizeDailyViews(rows: Array<{ day: string; views: number }>, today: string): Omit<ViewsTrend, 'available'> {
  const [y, m] = today.split('-').map(Number)
  const monthPfx = today.slice(0, 7)
  const prev = new Date(Date.UTC(y, m - 2, 1))
  const prevPfx = isoDay(prev).slice(0, 7)
  let thisMonth = 0, lastMonth = 0
  const byDay = new Map<string, number>()
  for (const r of rows) {
    if (r.day.startsWith(monthPfx)) thisMonth += r.views
    else if (r.day.startsWith(prevPfx)) lastMonth += r.views
    byDay.set(r.day, (byDay.get(r.day) ?? 0) + r.views)
  }
  const t = new Date(today + 'T00:00:00Z').getTime()
  const daily = Array.from({ length: 30 }, (_, i) => {
    const day = isoDay(new Date(t - (29 - i) * 86_400_000))
    return { day, views: byDay.get(day) ?? 0 }
  })
  return { thisMonth, lastMonth, daily }
}

export async function getViewsTrend(db: SupabaseClient, kind: 'photographer' | 'cleaner', proId: string): Promise<ViewsTrend> {
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' }) // YYYY-MM-DD, heure de Paris
  const since = isoDay(new Date(Date.now() - 65 * 86_400_000))
  const { data, error } = await db
    .from('pro_fiche_views_daily')
    .select('day, views')
    .eq('kind', kind)
    .eq('pro_id', proId)
    .gte('day', since)
  if (error) return { thisMonth: 0, lastMonth: 0, daily: [], available: false }
  return { ...summarizeDailyViews((data ?? []) as Array<{ day: string; views: number }>, today), available: true }
}
