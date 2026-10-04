import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { getServiceClient } from '@/lib/supabase/service'
import MembresUI from './MembresUI'
import { perfTimer } from '@/lib/perf/server-timing'

export const metadata = { title: 'Membres, Jason Marinho' }

export default async function MembresPage() {
  // getProfile : session et profil déjà lus par le layout (dédupliqués)
  const timer = perfTimer('page /dashboard/admin/membres')
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const adminClient = getServiceClient()

  const [{ data: members }, { data: photographers }, { data: cleaners }] = await Promise.all([
    adminClient
      .from('profiles')
      .select(`
        id, email, full_name, role, driing_status, plan, is_contributor, is_investor, created_at,
        user_formations(id, progress, enrolled_at, formation:formations(id, title, slug))
      `)
      // Exclut les comptes pros annuaire qui ont leur propre admin
      // (/dashboard/admin/photographes et /dashboard/admin/menage).
      // La page Membres reste centrée sur les hôtes LCD (role user/admin).
      .not('role', 'in', '("photographer","cleaner")')
      .order('created_at', { ascending: false }),
    // Les inscriptions annuaire gardent role='user' (multi-espaces) : le
    // profil pro se détecte par la présence d'une fiche photographers/cleaners.
    adminClient.from('photographers').select('user_id'),
    adminClient.from('cleaners').select('user_id'),
  ])

  timer.mark('membres')
  timer.done()
  const photographerIds = new Set((photographers ?? []).map(p => p.user_id))
  const cleanerIds = new Set((cleaners ?? []).map(c => c.user_id))

  // Normalize Supabase join result: formation relation comes as array from generic client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalized = (members ?? []).map((m: any) => ({
    ...m,
    is_photographer: photographerIds.has(m.id),
    is_cleaner: cleanerIds.has(m.id),
    user_formations: (m.user_formations ?? []).map((uf: any) => ({
      ...uf,
      formation: Array.isArray(uf.formation) ? (uf.formation[0] ?? null) : uf.formation,
    })),
  }))

  return (
    <>
      <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%' }}>
        <MembresUI members={normalized} />
      </div>
    </>
  )
}
