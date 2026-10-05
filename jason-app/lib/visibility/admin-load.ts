// Chargement de la page « Visibilité » de l'admin (05/10/2026). Service role :
// n'appeler qu'après avoir vérifié le rôle admin (page.tsx). Trois sources
// indépendantes, lues en parallèle : Google Search Console, nos visites
// (site_visits) et les fiches pros. L'assemblage est dans admin-build.ts.
import 'server-only'
import { getServiceClient } from '@/lib/supabase/service'
import { safeGsc } from '@/lib/google/search-analytics'
import { loadVisits, loadGscQueryPages, loadGscDaily, loadGscPages } from './load'
import { periodRange, GSC_LAG_DAYS, type PeriodKey, type VisitRow } from './rules'
import type { VisTab } from './admin-rules'
import { buildVisibility, type ProRow, type VisibilityData } from './admin-build'

const PRO_COLUMNS = 'id, slug, full_name, pseudo, ville, status, is_public, tier, stripe_subscription_status'

const errMsg = (e: unknown) => String((e as Error)?.message ?? e).slice(0, 200)

async function loadPros() {
  const db = getServiceClient()
  const [ph, cl] = await Promise.all([
    db.from('photographers').select(PRO_COLUMNS),
    db.from('cleaners').select(PRO_COLUMNS),
  ])
  if (ph.error) throw new Error(ph.error.message)
  if (cl.error) throw new Error(cl.error.message)
  return { photographers: (ph.data ?? []) as ProRow[], cleaners: (cl.data ?? []) as ProRow[] }
}

/** Demandes reçues par fiche entre deux jours (inclus) */
async function loadDemandes(start: string, end: string): Promise<Map<string, number>> {
  const db = getServiceClient()
  const out = new Map<string, number>()
  const read = async (table: string, col: string) => {
    const { data, error } = await db.from(table).select(col)
      .gte('created_at', `${start}T00:00:00+02:00`).lte('created_at', `${end}T23:59:59+02:00`).limit(5000)
    if (error) return
    for (const r of (data ?? []) as unknown as Array<Record<string, string>>) out.set(r[col], (out.get(r[col]) ?? 0) + 1)
  }
  await Promise.all([read('photographer_contacts', 'photographer_id'), read('cleaner_contacts', 'cleaner_id')])
  return out
}

export async function loadVisibility(periodKey: PeriodKey, tab: VisTab, today: string): Promise<VisibilityData> {
  const gscPeriod = periodRange(periodKey, today, GSC_LAG_DAYS)
  const visitPeriod = periodRange(periodKey, today, 0)

  const [qp, daily, truth, visitsRes, prevVisitsRes, prosRes, demandes] = await Promise.all([
    safeGsc(() => loadGscQueryPages(gscPeriod)),
    safeGsc(() => loadGscDaily(gscPeriod)),
    safeGsc(() => loadGscPages(gscPeriod)),
    loadVisits({ start: visitPeriod.start, end: visitPeriod.end }).then(rows => ({ ok: true as const, rows }), e => ({ ok: false as const, error: errMsg(e) })),
    loadVisits({ start: visitPeriod.prevStart, end: visitPeriod.prevEnd }).then(rows => ({ ok: true as const, rows }), () => ({ ok: false as const, rows: [] as VisitRow[] })),
    loadPros().then(d => ({ ok: true as const, ...d }), e => ({ ok: false as const, error: errMsg(e) })),
    loadDemandes(visitPeriod.start, visitPeriod.end).catch(() => new Map<string, number>()),
  ])

  return buildVisibility({ periodKey, tab, gscPeriod, visitPeriod, qp, daily, truth, visitsRes, prevVisitsRes, prosRes, demandes })
}
