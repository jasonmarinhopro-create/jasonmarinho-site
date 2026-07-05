import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import ClientsCrm, { type ProClient } from '@/components/pros/ClientsCrm'
import { createProClient, updateProClient, deleteProClient } from '../actions'

export const metadata = { title: 'Mes clients — Photographe' }
export const dynamic = 'force-dynamic'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?as=photographe')

  const admin = getServiceClient()
  const { data: pro } = await admin
    .from('photographers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!pro) redirect('/dashboard/ma-fiche-photographe')

  const { data: clients } = await admin
    .from('pro_clients')
    .select('id, nom, email, telephone, ville, logement, statut, notes, created_at')
    .eq('owner_kind', 'photographer')
    .eq('owner_id', pro.id)
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <div style={{ padding: 'clamp(20px, 3vw, 44px)', width: '100%' }}>
      <ClientsCrm
        clients={(clients ?? []) as ProClient[]}
        onCreate={createProClient}
        onUpdate={updateProClient}
        onDelete={deleteProClient}
        metier="photographe"
      />
    </div>
  )
}
