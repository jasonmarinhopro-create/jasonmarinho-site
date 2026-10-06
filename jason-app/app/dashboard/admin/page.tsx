import { getServiceClient } from '@/lib/supabase/service'
import { perfTimer } from '@/lib/perf/server-timing'
import { redirect } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { getProfile } from '@/lib/queries/profile'
import { Suspense } from 'react'
import AdminUI, { AffiliationCard } from './AdminUI'
import { getAffilaeOverview } from '@/lib/affiliation/affilae'
import { getPartnerStackOverview } from '@/lib/affiliation/partnerstack'
import { computeRevenue, proSpacesByUser, type ProRow } from '@/lib/admin/revenue'
import { getLiveVisitorsCount, getChannelBreakdown, getTopPages, getAffiliateClicks, getAppErrors, CHANNEL_LABELS } from '@/lib/queries/site-traffic'
import { adminUserIds, splitDemo } from '@/lib/pros/demo'

// Service client : la RLS limite chaque utilisateur à SES données (profile,
// reports, etc.). Pour la vue admin on bypasse une fois l'auth admin vérifiée.

export const metadata = { title: 'Administration, Jason Marinho' }

// Chiffres de la Vue d'ensemble : ~20 requêtes, gardées en cache le temps
// de la minute en cours. Avant, chaque passage en mode admin les relançait
// toutes (écran de chargement de plusieurs secondes). La minute fait partie
// de la clé : unstable_cache sert sinon l'ancienne valeur à la première
// visite après expiration (04/10/2026 : nouveau membre absent des chiffres).
// Le trafic « en direct » reste calculé à chaque fois (rafraîchi toutes les
// 25 s par LiveTraffic).
const getAdminOverview = () => unstable_cache(computeAdminOverview, ['admin-overview-v2', String(Math.floor(Date.now() / 60_000))], { revalidate: 120, tags: ['admin-overview'] })()

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

  const [
    { count: totalUsers },
    { count: driingMembers },
    { count: standardMembers },
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
    topPages,
    affiliateClicks,
    appErrors,
    { data: photographers },
    { data: cleaners },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'driing'),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'standard'),
    admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
    admin.from('templates').select('*', { count: 'exact', head: true }),
    admin.from('formations').select('*', { count: 'exact', head: true }).eq('is_published', true),
    admin.from('community_groups').select('*', { count: 'exact', head: true }),
    admin.from('voyageurs').select('*', { count: 'exact', head: true }),
    admin.from('sejours').select('*', { count: 'exact', head: true }),
    admin.from('user_formations').select('*', { count: 'exact', head: true }).eq('progress', 100),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('driing_status', 'pending'),
    admin.from('reported_guests').select('*', { count: 'exact', head: true }).eq('is_validated', false),
    admin.from('suggestions').select('*', { count: 'exact', head: true }),
    admin.from('user_formations').select('formation_id, formations(title)'),
    admin.from('profiles').select('id, email, full_name, plan, created_at').neq('role', 'admin').order('created_at', { ascending: false }).limit(8),
    admin.from('profiles').select('created_at, plan').gte('created_at', twelveMonthsAgo.toISOString()).neq('role', 'admin'),
    getTopPages(admin),
    getAffiliateClicks(admin),
    getAppErrors(admin),
    admin.from('photographers').select('user_id, tier, status, stripe_subscription_status'),
    admin.from('cleaners').select('user_id, tier, status, stripe_subscription_status'),
  ])

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
  const admins = await adminUserIds(admin)
  const phRows = splitDemo((photographers ?? []) as ProRow[], admins).real
  const clRows = splitDemo((cleaners ?? []) as ProRow[], admins).real
  const revenue = computeRevenue({ standardMembers: standardMembers ?? 0, photographers: phRows, cleaners: clRows })
  const spaces = proSpacesByUser(phRows, clRows)

  return {
    recentSignups: ((recentSignups ?? []) as Array<{ id: string; email: string; full_name: string | null; plan: string; created_at: string }>)
      .map(u => ({ ...u, pros: spaces.get(u.id) ?? [] })),
    monthlySignupsChart,
    topPages,
    affiliateClicks,
    appErrors,
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

  const admin = getServiceClient()
  const [overview, liveVisitors, channelBreakdown] = await Promise.all([
    getAdminOverview(),
    getLiveVisitorsCount(admin),
    getChannelBreakdown(admin),
  ])
  timer.mark('vue d\'ensemble et trafic')
  timer.done()

  return (
    <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%' }}>
      <AdminUI
        todayLabel={new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' })}
        recentSignups={overview.recentSignups}
        monthlySignupsChart={overview.monthlySignupsChart}
        liveVisitors={liveVisitors}
        channelBreakdown={channelBreakdown.map(c => ({ ...c, label: CHANNEL_LABELS[c.channel] }))}
        topPages={overview.topPages}
        affiliateClicks={overview.affiliateClicks}
        appErrors={overview.appErrors}
        affilaeSlot={<Suspense fallback={<AffilaeSkeleton />}><AffilaeSection /></Suspense>}
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

function AffilaeSkeleton() {
  return <div style={{ height: 150, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)' }} aria-busy="true" />
}
