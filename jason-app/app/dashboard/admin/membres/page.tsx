import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { getServiceClient } from '@/lib/supabase/service'
import MembresUI from './MembresUI'
import { perfTimer } from '@/lib/perf/server-timing'
import { loadMemberActivity } from '@/lib/admin/activity-load'
import { computeRevenue, type ProRow } from '@/lib/admin/revenue'
import { adminUserIds, splitDemo } from '@/lib/pros/demo'

export const metadata = { title: 'Membres, Jason Marinho' }

export default async function MembresPage() {
  // getProfile : session et profil déjà lus par le layout (dédupliqués)
  const timer = perfTimer('page /dashboard/admin/membres')
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const adminClient = getServiceClient()

  const [{ data: members }, { data: photographers }, { data: cleaners }, { data: depannage }, activity] = await Promise.all([
    adminClient
      .from('profiles')
      .select(`
        id, email, full_name, role, driing_status, plan, stripe_price_id, is_contributor, is_investor, created_at,
        user_formations(id, progress, enrolled_at, formation:formations(id, title, slug))
      `)
      // Exclut les comptes pros annuaire qui ont leur propre admin
      // (/dashboard/admin/photographes et /dashboard/admin/menage).
      // La page Membres reste centrée sur les hôtes LCD (role user/admin).
      .not('role', 'in', '("photographer","cleaner")')
      .order('created_at', { ascending: false }),
    // Les inscriptions annuaire gardent role='user' (multi-espaces) : le
    // profil pro se détecte par la présence d'une fiche photographers/cleaners.
    adminClient.from('photographers').select('user_id, tier, status, stripe_subscription_status'),
    adminClient.from('cleaners').select('user_id, tier, status, stripe_subscription_status'),
    adminClient.from('depannage_pros').select('user_id, tier, status, stripe_subscription_status'),
    // Dernière visite et dernière action de chaque membre (une source en panne n'empêche rien)
    loadMemberActivity().catch(() => new Map()),
  ])

  timer.mark('membres')
  timer.done()
  // Revenu : même calcul que la Vue d'ensemble (Standard au prix réel de chaque abonné +
  // fiches photographes et ménage payées, fiches d'exemple écartées). Avant le 20/10/2026 :
  // Standard × 19,98 € seulement, bloqué à 5 € alors que les fiches pros payaient.
  const admins = await adminUserIds(adminClient)
  const revenue = computeRevenue({
    standardMembers: 0,
    standardPriceIds: (members ?? []).filter((m: { plan: string | null }) => m.plan === 'standard').map((m: { stripe_price_id?: string | null }) => m.stripe_price_id ?? null),
    photographers: splitDemo((photographers ?? []) as ProRow[], admins).real,
    cleaners: splitDemo((cleaners ?? []) as ProRow[], admins).real,
    depannage: splitDemo((depannage ?? []) as ProRow[], admins).real,
  })
  const photographerIds = new Set((photographers ?? []).map(p => p.user_id))
  const cleanerIds = new Set((cleaners ?? []).map(c => c.user_id))
  const depannageIds = new Set((depannage ?? []).map(c => c.user_id))

  // Normalize Supabase join result: formation relation comes as array from generic client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalized = (members ?? []).map((m: any) => ({
    ...m,
    is_photographer: photographerIds.has(m.id),
    is_cleaner: cleanerIds.has(m.id),
    is_depannage: depannageIds.has(m.id),
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
        <MembresUI members={normalized} monthlyRevenue={revenue.monthly} />
      </div>
    </>
  )
}
