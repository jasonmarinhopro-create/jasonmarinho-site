// Admin Investisseurs en fiches carrées (24/11/2026, maquette validée par Jason,
// même principe que les pages Pros et Hôtes) : le dernier projet d'achat
// enregistré dans l'estimateur en avant, nombre de projets, budget total,
// dernière visite, « Aussi hôte » quand il a un logement.
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { getServiceClient } from '@/lib/supabase/service'
import { loadMemberActivity } from '@/lib/admin/activity-load'
import InvestisseursAdmin, { type InvestorRow, type InvestorProject } from './InvestisseursAdmin'

export const metadata = { title: 'Investisseurs, Admin' }
export const dynamic = 'force-dynamic'

export default async function InvestisseursAdminPage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  // Service role : investor_projects est en RLS « own only », l'admin doit tout voir
  const admin = getServiceClient()
  const { data: investors } = await admin
    .from('profiles')
    .select('id, email, full_name, plan, role, created_at')
    .eq('is_investor', true)
    .order('created_at', { ascending: false })
  const ids = (investors ?? []).map(i => i.id as string)

  const [{ data: projects }, { data: logements }, activity] = await Promise.all([
    ids.length
      ? admin.from('investor_projects')
        .select('id, user_id, nom, ville, pays, type_logement, nb_chambres, prix_achat, mensualite, created_at')
        .in('user_id', ids)
        .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as InvestorProject[] }),
    ids.length
      ? admin.from('logements').select('user_id').in('user_id', ids)
      : Promise.resolve({ data: [] as Array<{ user_id: string }> }),
    loadMemberActivity(ids).catch(() => new Map()),
  ])

  const byUser = new Map<string, InvestorProject[]>()
  for (const p of (projects ?? []) as InvestorProject[]) byUser.set(p.user_id, [...(byUser.get(p.user_id) ?? []), p])
  const logementsBy = new Map<string, number>()
  for (const l of (logements ?? []) as Array<{ user_id: string }>) logementsBy.set(l.user_id, (logementsBy.get(l.user_id) ?? 0) + 1)

  const rows: InvestorRow[] = ((investors ?? []) as Array<Omit<InvestorRow, 'projects' | 'logements' | 'last_seen_at'>>).map(inv => ({
    ...inv,
    projects: byUser.get(inv.id) ?? [],
    logements: logementsBy.get(inv.id) ?? 0,
    last_seen_at: activity.get(inv.id)?.lastSeenAt ?? null,
  }))

  return (
    <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%' }}>
      <InvestisseursAdmin investors={rows} nowMs={Date.now()} />
    </div>
  )
}
