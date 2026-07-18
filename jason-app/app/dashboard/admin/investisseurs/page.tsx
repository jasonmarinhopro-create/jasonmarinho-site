import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import InvestisseursAdmin, { type InvestorRow, type InvestorProject } from './InvestisseursAdmin'

export const metadata = { title: 'Investisseurs, Admin' }
export const dynamic = 'force-dynamic'

export default async function InvestisseursAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // Service role : investor_projects est en RLS "own only", l'admin doit tout voir
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const [{ data: investors }, { data: projects }] = await Promise.all([
    admin
      .from('profiles')
      .select('id, email, full_name, plan, created_at')
      .eq('is_investor', true)
      .order('created_at', { ascending: false }),
    admin
      .from('investor_projects')
      .select('id, user_id, nom, ville, pays, type_logement, prix_achat, mensualite, created_at')
      .order('created_at', { ascending: false }),
  ])

  // Rattache les projets à leur investisseur
  const byUser = new Map<string, InvestorProject[]>()
  for (const p of (projects ?? []) as InvestorProject[]) {
    const list = byUser.get(p.user_id) ?? []
    list.push(p)
    byUser.set(p.user_id, list)
  }
  const rows: InvestorRow[] = ((investors ?? []) as Omit<InvestorRow, 'projects'>[]).map(inv => ({
    ...inv,
    projects: byUser.get(inv.id) ?? [],
  }))

  return (
    <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%' }}>
      <InvestisseursAdmin investors={rows} totalProjects={(projects ?? []).length} />
    </div>
  )
}
