import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import MembresUI from './MembresUI'

export const metadata = { title: 'Membres, Jason Marinho' }

export default async function MembresPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Use service role to bypass RLS and see all members' formations
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { data: members } = await adminClient
    .from('profiles')
    .select(`
      id, email, full_name, role, driing_status, plan, is_contributor, created_at,
      user_formations(id, progress, enrolled_at, formation:formations(id, title, slug))
    `)
    .order('created_at', { ascending: false })

  // Normalize Supabase join result: formation relation comes as array from generic client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalized = (members ?? []).map((m: any) => ({
    ...m,
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
