import 'server-only'
import { getServiceClient } from '@/lib/supabase/service'
import { parisToday } from '@/lib/stripe/deposit-window'
import { loadProFicheById, loadProStats } from '@/lib/visibility/pro-load'
import { GSC_LAG_DAYS, periodRange } from '@/lib/visibility/rules'
import type { ProStatsData } from '@/lib/visibility/pro-stats'

// Chargement de la fiche membre de l'admin (04/10/2026). Sorti de la server
// action getFullMemberProfile : la page vérifie déjà le rôle avec
// getProfile() (dédupliqué avec le layout), l'action refaisait un getUser()
// réseau + une lecture du profil avant les requêtes. Toutes les lectures
// partent maintenant en une seule vague. À n'appeler qu'après avoir vérifié
// que l'utilisateur est admin.

export interface MemberProSpace {
  kind: 'photographe' | 'menage'
  id: string
  full_name: string | null
  pseudo: string | null
  ville: string | null
  status: string | null
  tier: string | null
  slug: string | null
  is_public: boolean | null
  stripe_subscription_status: string | null
  views_count: number | null
  contacts_count: number | null
  created_at: string
}

/**
 * Statistiques d'une fiche pro pour la fiche membre (05/10/2026) : audience
 * des 30 derniers jours, Google sur 28 jours. Chargées à part (Suspense) par
 * la page : une panne ou une lenteur de Google ne bloque pas la fiche membre.
 * Admin vérifié par la page avant l'appel.
 */
export async function loadMemberProStats(pro: Pick<MemberProSpace, 'kind' | 'id'>): Promise<ProStatsData | null> {
  const fiche = await loadProFicheById(pro.kind, pro.id)
  if (!fiche) return null
  const today = parisToday()
  const g = periodRange('28j', today, GSC_LAG_DAYS)
  return loadProStats({
    metier: pro.kind,
    fiche,
    db: getServiceClient(),
    periodKey: '28j',
    today,
    isAdminPreview: true,
    isAdmin: true,
    googlePeriod: { ...g, key: '28j', label: '28 derniers jours', granularity: 'day' },
    googleTimeoutMs: 10_000,
    skipReport: true,
  })
}

export async function loadMemberProfile(memberId: string) {
  const adminClient = getServiceClient()

  const [
    { data: memberProfile },
    { data: formations },
    { count: voyageursCount },
    { count: favoritesCount },
    { count: customizationsCount },
    { count: signalementsCount },
    { count: suggestionsCount },
    { count: sejoursCount },
    { data: communityMemberships },
    { data: audits },
    { data: investorProjects },
    { data: photographerRows },
    { data: cleanerRows },
    { count: logementsCount },
    { count: contratsCount },
    { data: allGroups },
  ] = await Promise.all([
    adminClient
      .from('profiles')
      .select('id, email, full_name, role, driing_status, plan, is_investor, created_at, admin_notes')
      .eq('id', memberId)
      .single(),
    adminClient
      .from('user_formations')
      .select('id, progress, enrolled_at, completed_at, formation:formations(id, title, slug, duration, level)')
      .eq('user_id', memberId)
      .order('enrolled_at', { ascending: false }),
    adminClient.from('voyageurs').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
    adminClient.from('user_template_favorites').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
    adminClient.from('user_template_customizations').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
    adminClient.from('reported_guests').select('*', { count: 'exact', head: true }).eq('reporter_id', memberId),
    adminClient.from('suggestions').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
    adminClient.from('sejours').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
    // ─── Communauté Facebook : groupes rejoints (sans jointure pour éviter FK manquante) ───
    adminClient
      .from('user_community_memberships')
      .select('group_id')
      .eq('user_id', memberId)
      .eq('status', 'joined'),
    // ─── Audits GBP : sessions complétées + brouillons ───
    adminClient
      .from('audit_gbp_sessions')
      .select('id, business_name, started_at, completed_at, score_global')
      .eq('user_id', memberId)
      .order('started_at', { ascending: false })
      .limit(5),
    // ─── Espace investisseur : projets d'acquisition sauvegardés depuis
    // l'estimateur (cf. /dashboard/admin/investisseurs, même requête) —
    // sans ça, la fiche d'un investisseur pur (sans logement/séjour/voyageur)
    // n'affiche que des zéros dans "Activité sur la plateforme".
    adminClient
      .from('investor_projects')
      .select('id, nom, ville, pays, type_logement, prix_achat, mensualite, created_at')
      .eq('user_id', memberId)
      .order('created_at', { ascending: false }),
    // Espaces pros du compte (04/10/2026) : sans ça, un photographe
    // apparaissait seulement « Découverte » (sa formule hôte)
    adminClient
      .from('photographers')
      .select('id, full_name, ville, status, tier, slug, is_public, stripe_subscription_status, views_count, contacts_count, created_at')
      .eq('user_id', memberId),
    adminClient
      .from('cleaners')
      .select('id, full_name, pseudo, ville, status, tier, slug, is_public, stripe_subscription_status, views_count, contacts_count, created_at')
      .eq('user_id', memberId),
    adminClient.from('logements').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
    adminClient.from('contracts').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
    // Tous les groupes (une trentaine) dans la même vague : avant, une 2e
    // requête attendait la liste des groupes rejoints
    adminClient.from('community_groups').select('id, name, member_count'),
  ])

  if (!memberProfile) return { error: 'Membre introuvable' }

  const groupIds = new Set((communityMemberships ?? []).map(m => m.group_id as string))
  const joinedGroups = (allGroups ?? [])
    .filter(g => groupIds.has(g.id as string))
    .map(g => ({ id: g.id as string, name: (g.name as string) ?? null, member_count: (g.member_count as number) ?? 0 }))
  const totalReach = joinedGroups.reduce((sum, g) => sum + (g.member_count ?? 0), 0)

  // Audits : split complétés vs brouillons
  const auditsData = audits ?? []
  const completedAudits = auditsData.filter(a => a.completed_at)
  const draftAudits = auditsData.filter(a => !a.completed_at)
  const bestScore = completedAudits.reduce((max, a) => Math.max(max, a.score_global ?? 0), 0)

  return {
    profile: memberProfile,
    formations: formations ?? [],
    stats: {
      voyageurs: voyageursCount ?? 0,
      favorites: favoritesCount ?? 0,
      customizations: customizationsCount ?? 0,
      signalements: signalementsCount ?? 0,
      suggestions: suggestionsCount ?? 0,
      sejours: sejoursCount ?? 0,
      communityGroupsCount: joinedGroups.length,
      communityTotalReach: totalReach,
      auditsCount: auditsData.length,
      auditsCompleted: completedAudits.length,
      auditsBestScore: bestScore,
    },
    community: { joinedGroups },
    audits: auditsData,
    investorProjects: investorProjects ?? [],
    pros: [
      ...(photographerRows ?? []).map(r => ({ ...r, kind: 'photographe' as const, pseudo: null })),
      ...(cleanerRows ?? []).map(r => ({ ...r, kind: 'menage' as const })),
    ] as MemberProSpace[],
    host: { logements: logementsCount ?? 0, contrats: contratsCount ?? 0 },
  }
}
