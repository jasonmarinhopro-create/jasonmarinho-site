import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { getServiceClient } from '@/lib/supabase/service'
import MembresUI from './MembresUI'
import { allRows } from '@/lib/supabase/all-rows'
import { perfTimer } from '@/lib/perf/server-timing'
import { loadMemberActivity } from '@/lib/admin/activity-load'
import { computeRevenue } from '@/lib/admin/revenue'

export const metadata = { title: 'Hôtes, Jason Marinho' }

export default async function MembresPage({ searchParams }: { searchParams?: { filtre?: string } }) {
  // getProfile : session et profil déjà lus par le layout (dédupliqués)
  const timer = perfTimer('page /dashboard/admin/membres')
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const adminClient = getServiceClient()

  const [{ data: members }, { data: photographers }, { data: cleaners }, { data: depannage }, activity, logementsRes] = await Promise.all([
    adminClient
      .from('profiles')
      .select(`
        id, email, full_name, role, driing_status, plan, stripe_price_id, is_contributor, is_investor, created_at,
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
    allRows<{ user_id: string | null }>((from, to) => adminClient.from('logements').select('user_id').not('user_id', 'is', null).order('id').range(from, to)),
  ])

  timer.mark('membres')
  timer.done()
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalized = hosts.map((m: any) => ({
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
  }))

  return (
    <>
      <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%' }}>
        <MembresUI members={normalized} monthlyRevenue={revenue.monthly} initialFilter={searchParams?.filtre === 'sans-logement' ? 'sans-logement' : 'all'} />
      </div>
    </>
  )
}
