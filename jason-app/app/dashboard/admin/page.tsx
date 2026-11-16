import { getServiceClient } from '@/lib/supabase/service'
import { perfTimer } from '@/lib/perf/server-timing'
import { redirect } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { getProfile } from '@/lib/queries/profile'
import { Suspense, cache } from 'react'
import { loadCockpitTraffic } from '@/lib/acquisition/load'
import AdminUI, { AffiliationCard } from './AdminUI'
import { LivePanel, AudienceCard } from './Cockpit'
import { buildMemberSpaces, type CockpitProfile } from '@/lib/admin/members-cockpit'
import { allRows } from '@/lib/supabase/all-rows'
import { getAffilaeOverview } from '@/lib/affiliation/affilae'
import { getPartnerStackOverview } from '@/lib/affiliation/partnerstack'
import { computeRevenue, proSpacesByUser, type ProRow } from '@/lib/admin/revenue'
import { getCachedLiveVisitors, getAffiliateClicks } from '@/lib/queries/site-traffic'
import { adminUserIds, splitDemo } from '@/lib/pros/demo'

// Service client : la RLS limite chaque utilisateur à SES données (profile,
// reports, etc.). Pour la vue admin on bypasse une fois l'auth admin vérifiée.

export const metadata = { title: 'Administration, Jason Marinho' }

// Chiffres de la Vue d'ensemble : 4 lectures (compteurs en une requête depuis
// le 24/10/2026, avant ~20). 02/11/2026 (Jason : « le mode admin prend
// beaucoup trop de temps à charger », mesuré 17 à 33 s) : la minute en cours
// faisait partie de la clé, donc presque chaque passage en mode admin
// recalculait tout pendant que la base était lente. Maintenant : valeur
// gardée et servie tout de suite, recalculée en arrière-plan au-delà de
// 3 minutes (« stale-while-revalidate » de unstable_cache) ; les actions
// admin vident le cache (tag admin-overview). Un nouveau membre apparaît donc
// au plus tard au passage suivant. Le trafic « en direct » reste calculé à
// chaque fois (rafraîchi toutes les 25 s par LiveTraffic).
const getAdminOverview = unstable_cache(computeAdminOverview, ['admin-overview-v4'], { revalidate: 180, tags: ['admin-overview'] })
// Dernière Vue d'ensemble réussie (par instance du serveur) : servie si la
// base ne répond pas, avec un bandeau, plutôt que des zéros
let lastOverview: Awaited<ReturnType<typeof computeAdminOverview>> | null = null
async function overviewOrLast() {
  try {
    const o = await getAdminOverview()
    lastOverview = o
    return { o, stale: false }
  } catch {
    return { o: lastOverview, stale: true }
  }
}

async function computeAdminOverview() {
  // Début du mois courant
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  // 12 mois glissants pour la courbe de croissance
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11)
  twelveMonthsAgo.setDate(1)
  twelveMonthsAgo.setHours(0, 0, 0, 0)

  // Service role pour bypasser RLS sur les lectures admin (profiles, reports,
  // suggestions). Les agrégats count/list ne marchaient pas en user-context.
  const admin = getServiceClient()

  // Compteurs en une seule requête (fonction admin_overview, migration
  // 20261024_150) ; repli sur les 18 lectures si elle manque. Les pages vues,
  // clics affiliés et erreurs gardent leurs lectures (paginées).
  const [base, affiliateClicks, depRes, profilesRes] = await Promise.all([
    loadOverviewBase(admin, startOfMonth, twelveMonthsAgo),
    getAffiliateClicks(admin),
    // Dépannage (31/10/2026) : hors de la fonction admin_overview, lu à part
    admin.from('depannage_pros').select('user_id, tier, status, stripe_subscription_status').limit(1000),
    // Membres par espace (cockpit, 16/11/2026) : comptes hors admins
    allRows<CockpitProfile>((from, to) => admin.from('profiles').select('id, full_name, email, created_at, plan, is_investor').neq('role', 'admin').order('created_at', { ascending: false }).range(from, to)),
  ])
  if (profilesRes.error) throw new Error(`membres : ${profilesRes.error.message}`)
  const {
    totalUsers, driingMembers, standardMembers, standardRows, newThisMonth, templatesCount, formationsCount, groupsCount,
    totalVoyageurs, totalSejours, completedFormations, pendingDriingCount, pendingReportsCount, suggestionsCount,
    formationEnrollments, recentSignups, monthlySignups, photographers, cleaners, admins,
  } = base

  // Formation la plus commencée, tri par count desc puis titre alphabétique
  // (tiebreaker déterministe : sans ça, l'ordre des Object.values dépend de l'insertion).
  const formationCounts: Record<string, { title: string; count: number }> = {}
  for (const uf of formationEnrollments ?? []) {
    const fid = uf.formation_id as string
    const formation = uf.formations as unknown as { title: string } | { title: string }[] | null
    const title = Array.isArray(formation) ? (formation[0]?.title ?? 'Inconnue') : (formation?.title ?? 'Inconnue')
    if (!formationCounts[fid]) formationCounts[fid] = { title, count: 0 }
    formationCounts[fid].count++
  }
  const topFormation = Object.values(formationCounts).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    return a.title.localeCompare(b.title, 'fr')  // tiebreaker alphabétique FR
  })[0] ?? null

  // Build monthly signup counts for the last 12 months
  const signupsPerMonth: Record<string, { total: number; paid: number }> = {}
  for (let i = 0; i < 12; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    signupsPerMonth[key] = { total: 0, paid: 0 }
  }
  for (const s of monthlySignups ?? []) {
    const d = new Date(s.created_at as string)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (key in signupsPerMonth) {
      signupsPerMonth[key].total++
      if (s.plan === 'standard') signupsPerMonth[key].paid++
    }
  }
  const monthlySignupsChart = Object.entries(signupsPerMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, counts]) => ({ month, ...counts }))

  // Revenu : Standard des hôtes (19,98 €/an) + fiches photographes et ménage
  // payées (39,98 € fondateur ou 79,98 €/an). Driing = offert.
  // Fiches d'exemple des comptes admin écartées (lib/pros/demo.ts)
  const phRows = splitDemo((photographers ?? []) as unknown as ProRow[], admins).real
  const clRows = splitDemo((cleaners ?? []) as unknown as ProRow[], admins).real
  const depRows = splitDemo((depRes.data ?? []) as ProRow[], admins).real
  const revenue = computeRevenue({ standardMembers: standardMembers ?? 0, standardPriceIds: standardRows ? (standardRows as Array<{ stripe_price_id: string | null }>).map(r => r.stripe_price_id) : undefined, photographers: phRows, cleaners: clRows, depannage: depRows })
  const spaces = proSpacesByUser(phRows, clRows, depRows)
  const memberSpaces = buildMemberSpaces(profilesRes.rows, [...spaces.entries()].flatMap(([user_id, list]) => list.map(x => ({ user_id, kind: x.kind, paid: x.paid, tier: x.tier }))), new Date())

  return {
    recentSignups: ((recentSignups ?? []) as Array<{ id: string; email: string; full_name: string | null; plan: string; created_at: string }>)
      .map(u => ({ ...u, pros: spaces.get(u.id) ?? [] })),
    monthlySignupsChart,
    memberSpaces,
    affiliateClicks,
    stats: {
      totalUsers: totalUsers ?? 0,
      driingMembers: driingMembers ?? 0,
      standardMembers: standardMembers ?? 0,
      newThisMonth: newThisMonth ?? 0,
      pendingDriing: pendingDriingCount ?? 0,
      pendingReports: pendingReportsCount ?? 0,
      suggestions: suggestionsCount ?? 0,
      templatesCount: templatesCount ?? 0,
      formationsCount: formationsCount ?? 0,
      groupsCount: groupsCount ?? 0,
      totalVoyageurs: totalVoyageurs ?? 0,
      totalSejours: totalSejours ?? 0,
      topFormation: topFormation,
      mrr: revenue.monthly,
      revenue,
      photographersCount: phRows.filter(r => r.user_id).length,
      cleanersCount: clRows.filter(r => r.user_id).length,
      depannageCount: depRows.filter(r => r.user_id).length,
      completedFormations: completedFormations ?? 0,
    },
  }
}

export default async function AdminPage() {
  const timer = perfTimer('page /dashboard/admin')
  // getProfile : getUser() + profil en cache, déjà dédupliqués avec le layout
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  // Pas admin : on retire aussi le cookie du mode admin (sinon le middleware
  // renverrait ici depuis /dashboard, en boucle)
  if (profile.role !== 'admin') redirect('/api/me/admin-mode')

  const [{ o: overview, stale }, liveVisitors] = await Promise.all([
    overviewOrLast(),
    getCachedLiveVisitors().catch(() => 0),
  ])
  timer.mark('vue d\'ensemble et trafic')
  timer.done()

  if (!overview) {
    return (
      <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%' }}>
        <div role="alert" style={{ padding: '22px 24px', borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', maxWidth: 640 }}>
          <strong style={{ display: 'block', fontSize: 16, marginBottom: 6, color: 'var(--text)' }}>La base de données ne répond pas pour le moment</strong>
          <span style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>Les chiffres de la Vue d’ensemble reviennent dès qu’elle répond (en général moins d’une minute). Recharge la page dans un instant.</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%' }}>
      {stale && (
        <div role="status" style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 13.5, color: 'var(--text-2)' }}>
          La base de données répond lentement : chiffres de la dernière lecture réussie. Recharge la page dans une minute.
        </div>
      )}
      <AdminUI
        todayLabel={new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' })}
        memberSpaces={overview.memberSpaces}
        liveVisitors={liveVisitors}
        affiliateClicks={overview.affiliateClicks}
        affilaeSlot={<Suspense fallback={<AffilaeSkeleton />}><AffilaeSection /></Suspense>}
        liveSlot={<Suspense fallback={<AffilaeSkeleton height={190} />}><LiveSection /></Suspense>}
        audienceSlot={<Suspense fallback={<AffilaeSkeleton height={620} />}><AudienceSection /></Suspense>}
        stats={overview.stats}
      />
    </div>
  )

}

// Affilae et PartnerStack (API externes, jusqu'à ~2 s sans cache) : diffusés
// à part, la Vue d'ensemble s'affiche sans les attendre
async function AffilaeSection() {
  const [af, ps] = await Promise.all([getAffilaeOverview(), getPartnerStackOverview()])
  return <AffiliationCard af={af} ps={ps} />
}

// Cockpit (16/11/2026) : « En ce moment » et Audience, diffusés à part.
// Visites de la base gardées 2 minutes (acquisition_base), Google 6 h : le
// calcul est refait à chaque ouverture, les chiffres d'aujourd'hui restent justes.
const cockpitTraffic = cache(() => loadCockpitTraffic())

async function LiveSection() {
  try { return <LivePanel today={(await cockpitTraffic()).today} /> } catch { return null }
}

async function AudienceSection() {
  try {
    const t = await cockpitTraffic()
    return <AudienceCard audience={t.audience} gscError={t.gscError} />
  } catch {
    return null
  }
}

// Hauteur proche de la carte finale : la page ne bouge pas quand elle arrive
function AffilaeSkeleton({ height = 150 }: { height?: number }) {
  return <div style={{ height, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)' }} aria-busy="true" />
}

type Db = ReturnType<typeof getServiceClient>
type Rows = Array<Record<string, unknown>>

/** Compteurs et listes de la Vue d'ensemble, en une requête si possible */
async function loadOverviewBase(admin: Db, startOfMonth: Date, twelveMonthsAgo: Date) {
  try {
    const { data, error } = await admin.rpc('admin_overview', { p_month_start: startOfMonth.toISOString(), p_twelve_months: twelveMonthsAgo.toISOString() })
    if (!error && data && typeof data === 'object') {
      const d = data as Record<string, unknown>
      const n = (k: string) => Number(d[k]) || 0
      const list = (k: string) => (Array.isArray(d[k]) ? d[k] : []) as Rows
      return {
        totalUsers: n('total_users'), driingMembers: n('driing_members'), standardMembers: n('standard_members'),
        standardRows: list('standard_price_ids').map(id => ({ stripe_price_id: (id as unknown as string | null) })),
        newThisMonth: n('new_this_month'), templatesCount: n('templates'), formationsCount: n('formations'), groupsCount: n('groups'),
        totalVoyageurs: n('voyageurs'), totalSejours: n('sejours'), completedFormations: n('completed_formations'),
        pendingDriingCount: n('pending_driing'), pendingReportsCount: n('pending_reports'), suggestionsCount: n('suggestions'),
        formationEnrollments: list('formation_enrollments'), recentSignups: list('recent_signups'), monthlySignups: list('monthly_signups'),
        photographers: list('photographers'), cleaners: list('cleaners'),
        admins: new Set((list('admin_ids') as unknown as string[]).map(String)),
      }
    }
  } catch { /* repli */ }

  const replis = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'driing'),
    admin.from('profiles').select('stripe_price_id', { count: 'exact' }).eq('plan', 'standard').limit(1000),
    admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
    admin.from('templates').select('*', { count: 'exact', head: true }),
    admin.from('formations').select('*', { count: 'exact', head: true }).eq('is_published', true),
    admin.from('community_groups').select('*', { count: 'exact', head: true }),
    admin.from('voyageurs').select('*', { count: 'exact', head: true }),
    admin.from('sejours').select('*', { count: 'exact', head: true }),
    admin.from('user_formations').select('*', { count: 'exact', head: true }).eq('progress', 100),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('driing_status', 'pending'),
    admin.from('reported_guests').select('*', { count: 'exact', head: true }).eq('is_validated', false),
    admin.from('suggestions').select('*', { count: 'exact', head: true }).is('treated_at', null),
    admin.from('user_formations').select('formation_id, formations(title)'),
    admin.from('profiles').select('id, email, full_name, plan, created_at').neq('role', 'admin').order('created_at', { ascending: false }).limit(8),
    admin.from('profiles').select('created_at, plan').gte('created_at', twelveMonthsAgo.toISOString()).neq('role', 'admin'),
    admin.from('photographers').select('user_id, tier, status, stripe_subscription_status'),
    admin.from('cleaners').select('user_id, tier, status, stripe_subscription_status'),
    adminUserIds(admin),
  ])
  // Base injoignable (ralenti de l'offre gratuite) : on échoue au lieu de
  // renvoyer des zéros, que le cache aurait servis pendant des minutes
  // (16/11/2026, Vue d'ensemble « 0 compte, 0 formation »)
  const echec = (replis.slice(0, -1) as Array<{ error?: { message?: string } | null }>).find(r => r?.error)
  if (echec) throw new Error(`vue d'ensemble indisponible : ${echec.error?.message ?? 'erreur'}`)
  const [
    { count: totalUsers },
    { count: driingMembers },
    { count: standardMembers, data: standardRows },
    { count: newThisMonth },
    { count: templatesCount },
    { count: formationsCount },
    { count: groupsCount },
    { count: totalVoyageurs },
    { count: totalSejours },
    { count: completedFormations },
    { count: pendingDriingCount },
    { count: pendingReportsCount },
    { count: suggestionsCount },
    { data: formationEnrollments },
    { data: recentSignups },
    { data: monthlySignups },
    { data: photographers },
    { data: cleaners },
    admins,
  ] = replis

  return {
    totalUsers, driingMembers, standardMembers, standardRows: standardRows as Array<{ stripe_price_id: string | null }> | null,
    newThisMonth, templatesCount, formationsCount, groupsCount, totalVoyageurs, totalSejours, completedFormations,
    pendingDriingCount, pendingReportsCount, suggestionsCount,
    formationEnrollments: formationEnrollments as Rows | null, recentSignups: recentSignups as Rows | null, monthlySignups: monthlySignups as Rows | null,
    photographers: photographers as Rows | null, cleaners: cleaners as Rows | null, admins,
  }
}
