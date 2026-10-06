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
import { getAffilaeOverview } from '@/lib/affiliation/affilae'
import { getPartnerStackOverview } from '@/lib/affiliation/partnerstack'
import type { ClickRow } from './partners'
import { adminUserIds, splitDemo } from '@/lib/pros/demo'

const PRO_COLUMNS = 'id, user_id, slug, full_name, pseudo, ville, zone_couverte, status, is_public, tier, stripe_subscription_status'

const errMsg = (e: unknown) => String((e as Error)?.message ?? e).slice(0, 200)

async function loadPros() {
  const db = getServiceClient()
  const [ph, cl, admins] = await Promise.all([
    db.from('photographers').select(PRO_COLUMNS),
    db.from('cleaners').select(PRO_COLUMNS),
    adminUserIds(db),
  ])
  if (ph.error) throw new Error(ph.error.message)
  if (cl.error) throw new Error(cl.error.message)
  // Fiches d'exemple des comptes admin écartées (Jason, 06/10/2026 : « est-ce nécessaire ? »)
  return {
    photographers: splitDemo((ph.data ?? []) as Array<ProRow & { user_id?: string | null }>, admins).real,
    cleaners: splitDemo((cl.data ?? []) as Array<ProRow & { user_id?: string | null }>, admins).real,
  }
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

/** Clics vers les liens affiliés entre deux jours (inclus) */
async function loadAffiliateClicks(start: string, end: string): Promise<ClickRow[]> {
  const db = getServiceClient()
  const out: ClickRow[] = []
  for (let from = 0; from < 20_000; from += 1000) {
    const { data, error } = await db.from('affiliate_clicks').select('session_id, path, partner, created_at')
      .gte('created_at', `${start}T00:00:00+02:00`).lte('created_at', `${end}T23:59:59+02:00`)
      .order('created_at', { ascending: true }).range(from, from + 999)
    if (error) throw new Error(error.message)
    out.push(...((data ?? []) as ClickRow[]))
    if (!data || data.length < 1000) break
  }
  return out
}

export async function loadVisibility(periodKey: PeriodKey, tab: VisTab, today: string): Promise<VisibilityData> {
  const gscPeriod = periodRange(periodKey, today, GSC_LAG_DAYS)
  const visitPeriod = periodRange(periodKey, today, 0)

  // Clics affiliés et ventes Affilae lancés en même temps que le reste
  const affPromise = Promise.all([
    Promise.all([loadAffiliateClicks(visitPeriod.start, visitPeriod.end), loadAffiliateClicks(visitPeriod.prevStart, visitPeriod.prevEnd)])
      .then(([cur, prev]) => ({ ok: true as const, cur, prev }), e => ({ ok: false as const, error: errMsg(e) })),
    // Affilae (appel externe, parfois lent) : seulement pour l'onglet Partenaires
    tab === 'partenaires' ? getAffilaeOverview().catch(() => null) : Promise.resolve(null),
    // PartnerStack (Brevo) : même règle
    tab === 'partenaires' ? getPartnerStackOverview().catch(() => null) : Promise.resolve(null),
  ])

  const [qp, daily, truth, visitsRes, prevVisitsRes, prosRes, demandes] = await Promise.all([
    safeGsc(() => loadGscQueryPages(gscPeriod)),
    safeGsc(() => loadGscDaily(gscPeriod)),
    safeGsc(() => loadGscPages(gscPeriod)),
    loadVisits({ start: visitPeriod.start, end: visitPeriod.end }).then(rows => ({ ok: true as const, rows }), e => ({ ok: false as const, error: errMsg(e) })),
    loadVisits({ start: visitPeriod.prevStart, end: visitPeriod.prevEnd }).then(rows => ({ ok: true as const, rows }), () => ({ ok: false as const, rows: [] as VisitRow[] })),
    loadPros().then(d => ({ ok: true as const, ...d }), e => ({ ok: false as const, error: errMsg(e) })),
    loadDemandes(visitPeriod.start, visitPeriod.end).catch(() => new Map<string, number>()),
  ])
  const [affClicksRes, affilae, partnerstack] = await affPromise

  return buildVisibility({ periodKey, tab, gscPeriod, visitPeriod, qp, daily, truth, visitsRes, prevVisitsRes, prosRes, demandes, affClicksRes, affilae, partnerstack })
}
