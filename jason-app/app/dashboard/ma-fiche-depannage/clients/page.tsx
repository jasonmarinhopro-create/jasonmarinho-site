import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAuthIdentity } from '@/lib/supabase/auth-user'
import ClientsCrm, { type ProClient } from '@/components/pros/ClientsCrm'
import { createProClient, updateProClient, deleteProClient } from '../actions'

export const metadata = { title: 'Mes clients, Dépannage' }
export const dynamic = 'force-dynamic'

export default async function Page() {
  const user = await getAuthIdentity()
  if (!user) redirect('/auth/login?as=depannage')

  // Client utilisateur : la RLS (migrations 062 et 069) limite déjà la lecture
  // à la fiche, aux demandes et au carnet du pro connecté.
  const admin = await createClient()
  const { data: pro } = await admin
    .from('depannage_pros')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!pro) redirect('/dashboard/ma-fiche-depannage')

  const { data: clients } = await admin
    .from('pro_clients')
    .select('id, nom, email, telephone, ville, logement, statut, notes, created_at')
    .eq('owner_kind', 'depannage')
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
        metier="pro"
        quoteBase="/dashboard/ma-fiche-depannage/devis"
      />
    </div>
  )
}
