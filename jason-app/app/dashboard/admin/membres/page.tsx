import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { getServiceClient } from '@/lib/supabase/service'
import MembresUI from './MembresUI'
import { allRows } from '@/lib/supabase/all-rows'
import { perfTimer } from '@/lib/perf/server-timing'
import { loadMemberActivity } from '@/lib/admin/activity-load'
import { computeRevenue } from '@/lib/admin/revenue'
import { hostJourney, hostFeed, usageFromRows, type HostUsageRow } from '@/lib/admin/host-journey'
import { describeAcquisition, type Acquisition } from '@/lib/acquisition/rules'

export const metadata = { title: 'Hôtes, Jason Marinho' }

export default async function MembresPage({ searchParams }: { searchParams?: { filtre?: string } }) {
  // getProfile : session et profil déjà lus par le layout (dédupliqués)
  const timer = perfTimer('page /dashboard/admin/membres')
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const adminClient = getServiceClient()

  const [{ data: members }, { data: photographers }, { data: cleaners }, { data: depannage }, activity, logementsRes, usageRes] = await Promise.all([
    adminClient
      .from('profiles')
      .select(`
        id, email, full_name, role, driing_status, plan, stripe_price_id, is_contributor, is_investor, created_at,
        stripe_account_id, stripe_onboarding_complete, acquisition,
        user_formations(id, progress, enrolled_at, formation:formations(id, title, slug))
      `)
      // Anciens rôles pros exclus ; les comptes qui n'ont qu'une fiche pro
      // sont retirés plus bas (page Hôtes, 24/11/2026 : ils ont la page Pros).
      .not('role', 'in', '("photographer","cleaner")')
      .order('created_at', { ascending: false }),
    // Les inscriptions annuaire gardent role='user' (multi-espaces) : le
    // profil pro se détecte par la présence d'une fiche photographers/cleaners.
    adminClient.from('photographers').select('user_id, tier, status, stripe_subscription_status'),
    adminClient.from('cleaners').select('user_id, tier, status, stripe_subscription_status'),
    adminClient.from('depannage_pros').select('user_id, tier, status, stripe_subscription_status'),
    // Dernière visite et dernière action de chaque membre (une source en panne n'empêche rien)
    loadMemberActivity().catch(() => new Map()),
    // Membres avec au moins un logement (filtre « sans logement », 19/11/2026)
    // (+ photo de couverture du premier logement pour la fiche carrée, 24/11/2026)
    allRows<{ user_id: string | null; photo_couverture_url: string | null; created_at: string }>((from, to) => adminClient.from('logements').select('user_id, photo_couverture_url, created_at').not('user_id', 'is', null).order('id').range(from, to)),
    // Avancement de chaque hôte (7 étapes) en une requête : nombres et dates seulement
    // (migration 20261124_199 ; sans elle, les fiches n'affichent pas l'avancement)
    (async () => {
      try {
        const { data, error } = await adminClient.rpc('admin_hosts_usage', { p_user_ids: null })
        return error || !Array.isArray(data) ? null : data as Array<HostUsageRow & { user_id: string }>
      } catch { return null }
    })(),
  ])

  timer.mark('membres')
  // Revenu des hôtes : Standard au prix réel de chaque abonné (même calcul que la Vue
  // d'ensemble). Les fiches pros payées sont comptées sur la page Pros (24/11/2026).
  const revenue = computeRevenue({
    standardMembers: 0,
    standardPriceIds: (members ?? []).filter((m: { plan: string | null }) => m.plan === 'standard').map((m: { stripe_price_id?: string | null }) => m.stripe_price_id ?? null),
    // Page Hôtes : seulement les abonnements hôtes (les fiches pros sont sur la page Pros)
    photographers: [],
    cleaners: [],
    depannage: [],
  })
  const photographerIds = new Set((photographers ?? []).map(p => p.user_id))
  const cleanerIds = new Set((cleaners ?? []).map(c => c.user_id))
  const depannageIds = new Set((depannage ?? []).map(c => c.user_id))
  const withLogement = new Set(logementsRes.rows.map(r => r.user_id))

  // Page Hôtes (24/11/2026, option A validée par Jason) : un compte qui n'a
  // qu'une fiche pro (ni logement, ni abonnement hôte, pas admin) est sur la
  // page Pros. Un compte à la fois hôte et pro reste ici avec « Aussi pro ».
  // Logements illisibles : personne n'est retiré (on ne sait pas trancher).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isProOnly = (m: any) =>
    !logementsRes.error && m.role !== 'admin' && !withLogement.has(m.id) &&
    m.plan !== 'standard' && m.plan !== 'driing' && !m.is_investor &&
    (photographerIds.has(m.id) || cleanerIds.has(m.id) || depannageIds.has(m.id))
  const hosts = (members ?? []).filter(m => !isProOnly(m))

  // Normalize Supabase join result: formation relation comes as array from generic client
  const usageByUser = new Map<string, HostUsageRow[]>()
  for (const r of usageRes ?? []) usageByUser.set(r.user_id, [...(usageByUser.get(r.user_id) ?? []), r])
  // Photo de couverture : celle du plus ancien logement qui en a une (adresse https seulement)
  const coverByUser = new Map<string, string>()
  for (const l of [...logementsRes.rows].sort((a, b) => (a.created_at < b.created_at ? -1 : 1))) {
    if (l.user_id && !coverByUser.has(l.user_id) && typeof l.photo_couverture_url === 'string' && /^https:\/\//.test(l.photo_couverture_url)) coverByUser.set(l.user_id, l.photo_couverture_url)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalized = hosts.map((m: any) => {
    const usage = usageRes ? usageFromRows(usageByUser.get(m.id) ?? [], { accountId: m.stripe_account_id ?? null, onboarded: m.stripe_onboarding_complete ?? null }) : null
    const journey = usage ? hostJourney(usage) : null
    const formations = (m.user_formations ?? []) as Array<{ enrolled_at: string; formation: { title?: string } | Array<{ title?: string }> | null }>
    const formationTitle = (f: (typeof formations)[number]) => (Array.isArray(f.formation) ? f.formation[0]?.title : f.formation?.title) ?? 'sans titre'
    return {
    ...m,
    stripe_account_id: undefined, stripe_onboarding_complete: undefined, acquisition: undefined,
    cover_url: coverByUser.get(m.id) ?? null,
    provenance: m.acquisition ? describeAcquisition(m.acquisition as Acquisition).label : null,
    journey: journey ? {
      done: journey.done,
      niveau: journey.niveau,
      blocage: journey.blocage?.message ?? null,
      steps: journey.steps.map(st => ({ key: st.key, title: st.title, state: st.state, detail: st.detail })),
    } : null,
    counts: usage ? { logements: usage.logements.n, sejours: usage.sejours.n, contrats: usage.contrats.n } : null,
    feed: usage ? hostFeed(usage, formations.filter(f => f.enrolled_at).map(f => ({ label: `Formation : ${formationTitle(f)}`, at: f.enrolled_at }))).slice(0, 6) : [],
    ...m,
    is_photographer: photographerIds.has(m.id),
    is_cleaner: cleanerIds.has(m.id),
    is_depannage: depannageIds.has(m.id),
    // Lecture des logements en erreur : filtre inactif (undefined) plutôt que faux
    has_logement: logementsRes.error ? undefined : withLogement.has(m.id),
    last_seen_at: activity.get(m.id)?.lastSeenAt ?? null,
    last_action: activity.get(m.id)?.lastAction ?? null,
    user_formations: (m.user_formations ?? []).map((uf: any) => ({
      ...uf,
      formation: Array.isArray(uf.formation) ? (uf.formation[0] ?? null) : uf.formation,
    })),
  }})

  timer.done()
  return (
    <>
      <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%' }}>
        <MembresUI members={normalized} monthlyRevenue={revenue.monthly} nowMs={Date.now()} initialFilter={searchParams?.filtre === 'sans-logement' ? 'sans-logement' : 'all'} />
      </div>
    </>
  )
}
