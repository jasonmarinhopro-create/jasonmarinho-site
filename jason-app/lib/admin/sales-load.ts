// Chargement de la page « Ventes » de l'admin (05/10/2026). Appelée après
// vérification du rôle admin : service role pour compter sur tous les comptes.
// Règles et calculs : sales.ts (testé) et revenue.ts.
import 'server-only'
import { getServiceClient } from '@/lib/supabase/service'
import { parisToday } from '@/lib/stripe/deposit-window'
import { computeRevenue, isPaidPro, PRICES, type ProRow } from './revenue'
import {
  SALES_GOALS, memberGroup, missingFor, netAnnual, pipelineCounts, sortForOutreach, weeklyCounts,
  type MemberActivity, type MemberGroup,
} from './sales'

const FOUNDER_QUOTA = 20

type ProFull = ProRow & { created_at: string | null }

function countBy(rows: Array<{ user_id: string | null }> | null | undefined) {
  const m = new Map<string, number>()
  for (const r of rows ?? []) if (r.user_id) m.set(r.user_id, (m.get(r.user_id) ?? 0) + 1)
  return m
}

/** Toutes les lignes d'une colonne user_id (la REST plafonne à 1 000 par appel). */
async function allUserIds(table: string, extra?: (q: any) => any) {
  const db = getServiceClient()
  const out: Array<{ user_id: string | null }> = []
  for (let from = 0; from < 20_000; from += 1000) {
    let q = db.from(table).select('user_id').range(from, from + 999)
    if (extra) q = extra(q)
    const { data, error } = await q
    if (error || !data) break
    out.push(...(data as Array<{ user_id: string | null }>))
    if (data.length < 1000) break
  }
  return out
}

async function lastSignIns() {
  const db = getServiceClient()
  const map = new Map<string, string | null>()
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !data) break
    for (const u of data.users) map.set(u.id, u.last_sign_in_at ?? null)
    if (data.users.length < 1000) break
  }
  return map
}

export async function loadSales() {
  const db = getServiceClient()
  const today = parisToday()

  const [profilesRes, logements, sejours, contracts, phRes, clRes, outreachRes, signIns] = await Promise.all([
    db.from('profiles').select('id, email, full_name, plan, role, driing_status, created_at').limit(5000),
    allUserIds('logements'),
    allUserIds('sejours'),
    allUserIds('contracts', q => q.neq('statut', 'annule')),
    db.from('photographers').select('user_id, tier, status, stripe_subscription_status, created_at'),
    db.from('cleaners').select('user_id, tier, status, stripe_subscription_status, created_at'),
    db.from('outreach_contacts').select('stage, audience').limit(10000),
    lastSignIns().catch(() => new Map<string, string | null>()),
  ])

  const photographers = (phRes.data ?? []) as ProFull[]
  const cleaners = (clRes.data ?? []) as ProFull[]
  const proUsers = new Set([...photographers, ...cleaners].map(r => r.user_id).filter(Boolean) as string[])
  const logCount = countBy(logements), sejCount = countBy(sejours), conCount = countBy(contracts)

  const members: MemberActivity[] = (profilesRes.data ?? []).map(p => ({
    id: p.id,
    fullName: p.full_name,
    email: p.email,
    plan: p.plan,
    role: p.role,
    driingStatus: p.driing_status,
    createdAt: p.created_at,
    lastSignInAt: signIns.get(p.id) ?? null,
    logements: logCount.get(p.id) ?? 0,
    sejours: sejCount.get(p.id) ?? 0,
    contracts: conCount.get(p.id) ?? 0,
    isPro: proUsers.has(p.id),
  }))

  const groups = new Map<MemberGroup, MemberActivity[]>()
  for (const m of members) {
    const g = memberGroup(m)
    groups.set(g, [...(groups.get(g) ?? []), m])
  }
  const n = (g: MemberGroup) => groups.get(g)?.length ?? 0

  // Revenu : Standard des hôtes + fiches pros payées (même règle que la Vue d'ensemble)
  const standardMembers = n('payant')
  const revenue = computeRevenue({ standardMembers, photographers, cleaners })
  const paidPros = [...photographers, ...cleaners].filter(isPaidPro)
  const net = netAnnual([
    { price: PRICES.standard, count: standardMembers },
    { price: PRICES.proFondateur, count: paidPros.filter(r => r.tier === 'fondateur').length },
    { price: PRICES.proStandard, count: paidPros.filter(r => r.tier !== 'fondateur').length },
  ])
  const goals = SALES_GOALS.map(g => ({ ...g, ...missingFor(g.annual, net) }))

  // Entonnoir hôtes (hors admin et comptes pros sans activité hôte)
  const hosts = members.filter(m => m.role !== 'admin' && !(m.isPro && memberGroup(m) === 'pro'))
  const hostFunnel = {
    comptes: hosts.length,
    avecLogement: hosts.filter(m => m.logements > 0).length,
    avecReservation: hosts.filter(m => m.sejours > 0 || m.contracts > 0).length,
    avecContrat: hosts.filter(m => m.contracts > 0).length,
    payants: standardMembers,
    driing: n('driing'),
  }

  const outreach = outreachRes.error ? [] : (outreachRes.data ?? [])
  const proFunnel = (kind: 'photographe' | 'menage', rows: ProFull[]) => ({
    pipeline: pipelineCounts(outreach, kind),
    fiches: rows.length,
    payees: rows.filter(isPaidPro).length,
    founderLeft: Math.max(0, FOUNDER_QUOTA - rows.filter(r => r.tier === 'fondateur').length),
  })

  return {
    today,
    revenue,
    net,
    goals,
    hostFunnel,
    pros: {
      photographe: proFunnel('photographe', photographers),
      menage: proFunnel('menage', cleaners),
    },
    outreachAvailable: !outreachRes.error,
    weekly: weeklyCounts(members.filter(m => m.role !== 'admin').map(m => m.createdAt), today),
    toWake: {
      actif: sortForOutreach(groups.get('actif') ?? []),
      inactif: sortForOutreach(groups.get('inactif') ?? []),
    },
  }
}

export type SalesData = Awaited<ReturnType<typeof loadSales>>
