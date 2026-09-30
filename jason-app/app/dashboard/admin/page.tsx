import { getServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { getProfile } from '@/lib/queries/profile'
import AdminUI from './AdminUI'
import { getAffilaeOverview } from '@/lib/affiliation/affilae'
import { getLiveVisitorsCount, getChannelBreakdown, getTopPages, getAffiliateClicks, getAppErrors, CHANNEL_LABELS } from '@/lib/queries/site-traffic'

// Service client : la RLS limite chaque utilisateur à SES données (profile,
// reports, etc.). Pour la vue admin on bypasse une fois l'auth admin vérifiée.

export const metadata = { title: 'Administration, Jason Marinho' }

// Chiffres de la Vue d'ensemble : ~20 requêtes, gardées 60 s en cache.
// Avant, chaque passage en mode admin les relançait toutes (écran de
// chargement de plusieurs secondes). Le trafic « en direct » reste calculé
// à chaque fois (et rafraîchi toutes les 25 s par LiveTraffic).
const getAdminOverview = unstable_cache(async () => {
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

  // MRR estimé (annuel / 12) : plan Standard vendu en annuel 19,98 €/an TTC
  // Seul le plan Standard contribue (Driing = gratuit pour les clients Driing)
  const mrr = (standardMembers ?? 0) * (19.98 / 12)

  return {
    recentSignups: (recentSignups ?? []) as Array<{ id: string; email: string; full_name: string | null; plan: string; created_at: string }>,
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
      mrr,
      completedFormations: completedFormations ?? 0,
    },
  }
}, ['admin-overview-v1'], { revalidate: 60, tags: ['admin-overview'] })

export default async function AdminPage() {
  // getProfile : getUser() + profil en cache, déjà dédupliqués avec le layout
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const admin = getServiceClient()
  const [overview, liveVisitors, channelBreakdown, affilae] = await Promise.all([
    getAdminOverview(),
    getLiveVisitorsCount(admin),
    getChannelBreakdown(admin),
    getAffilaeOverview(),
  ])

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
        affilae={affilae}
        stats={overview.stats}
      />
    </div>
  )

}
