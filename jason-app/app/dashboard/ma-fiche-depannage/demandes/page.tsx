import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAuthIdentity } from '@/lib/supabase/auth-user'
import DemandesRecues, { type ProContact } from '@/components/pros/DemandesRecues'
import { updateContactStatus, updateContactNotes, deleteContact, addClientFromContact } from '../actions'

export const metadata = { title: 'Demandes reçues, Dépannage' }
export const dynamic = 'force-dynamic'

export default async function Page() {
  const user = await getAuthIdentity()
  if (!user) redirect('/auth/login?as=depannage')

  // Client utilisateur : la RLS (migrations 062 et 069) limite déjà la lecture
  // à la fiche, aux demandes et au carnet du pro connecté.
  const admin = await createClient()
  const { data: pro } = await admin
    .from('depannage_pros')
    .select('id, full_name, pseudo')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!pro) redirect('/dashboard/ma-fiche-depannage')

  const { data: contacts } = await admin
    .from('depannage_contacts')
    .select('id, contact_name, contact_email, contact_phone, message, status, pro_notes, created_at')
    .eq('depannage_id', pro.id)
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div style={{ padding: 'clamp(20px, 3vw, 44px)', width: '100%' }}>
      <DemandesRecues
        contacts={(contacts ?? []) as ProContact[]}
        onUpdateStatus={updateContactStatus}
        onUpdateNotes={updateContactNotes}
        onDelete={deleteContact}
        onAddToClients={addClientFromContact}
        metier="pro"
        quoteBase="/dashboard/ma-fiche-depannage/devis"
        standalone
      />
    </div>
  )
}
