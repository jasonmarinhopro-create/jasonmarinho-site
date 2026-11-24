// Admin « Pros » (24/11/2026, option A validée par Jason) : une seule page pour
// les 3 métiers de l'annuaire (photo et vidéo, ménage, dépannage), en fiches
// carrées avec une bascule en liste. Remplace les pages photographes, ménage
// et dépannage (redirigées ici avec ?metier=). Fiches d'exemple (comptes
// admin) à part, hors chiffres et places Fondateur. Rien des demandes reçues
// ni du carnet clients d'un pro (confidentialité) : seulement les compteurs.
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { getServiceClient } from '@/lib/supabase/service'
import { syncProSubscriptions } from '@/lib/pros/subscription-sync'
import { adminUserIds, splitDemo } from '@/lib/pros/demo'
import { KINDS, METIERS, metierParSlug, type ProKind } from '@/lib/pros/metiers'
import { COMMON_COLUMNS, EXTRA_COLUMNS, toAdminPro, type AdminPro } from '@/lib/pros/admin-list'
import { perfTimer } from '@/lib/perf/server-timing'
import ProsAdmin from './ProsAdmin'

export const metadata = { title: 'Pros, Admin' }
export const dynamic = 'force-dynamic'

const STATUTS = ['active', 'pending_payment', 'approved_pending_payment', 'hidden', 'cancelled']

export default async function ProsAdminPage({ searchParams }: { searchParams?: { metier?: string } }) {
  const timer = perfTimer('page /dashboard/admin/pros')
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const db = getServiceClient()
  // Statut des abonnements relu chez Stripe avant d'afficher (3 s au plus)
  await syncProSubscriptions(db, 3000)
  timer.mark('sync')
  const [admins, ...results] = await Promise.all([
    adminUserIds(db),
    ...KINDS.map(kind => db.from(METIERS[kind].table)
      .select(`${COMMON_COLUMNS}, ${EXTRA_COLUMNS[kind]}`)
      .in('status', STATUTS)
      .order('created_at', { ascending: false })
      .limit(1000)),
  ])
  timer.mark('fiches')
  timer.done()

  const pros: AdminPro[] = []
  const demo: AdminPro[] = []
  const errors: string[] = []
  KINDS.forEach((kind, i) => {
    const { data, error } = results[i] as { data: Array<Record<string, unknown>> | null; error: { message: string } | null }
    if (error) { errors.push(METIERS[kind].nom); return }
    const split = splitDemo((data ?? []) as Array<{ user_id?: string | null } & Record<string, unknown>>, admins)
    pros.push(...split.real.map(r => toAdminPro(kind, r)))
    demo.push(...split.demo.map(r => toAdminPro(kind, r)))
  })

  const initialKind: ProKind | 'tous' = metierParSlug(searchParams?.metier)?.kind ?? 'tous'
  return <ProsAdmin pros={pros} demo={demo} errors={errors} initialKind={initialKind} />
}
