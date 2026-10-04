import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/auth-user'
import DemandesRecues, { type ProContact } from '@/components/pros/DemandesRecues'
import { updateContactStatus, updateContactNotes, deleteContact, addClientFromContact } from '../actions'

export const metadata = { title: 'Demandes reçues, Photographe' }
export const dynamic = 'force-dynamic'

export default async function Page() {
  const user = await getAuthUser()
  if (!user) redirect('/auth/login?as=photographe')

  // Client utilisateur : la RLS (migrations 062 et 069) limite déjà la lecture
  // à la fiche, aux demandes et au carnet du pro connecté.
  const admin = await createClient()
  const { data: photographer } = await admin
    .from('photographers')
    .select('id, full_name, pseudo')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!photographer) redirect('/dashboard/ma-fiche-photographe')

  const { data: contacts } = await admin
    .from('photographer_contacts')
    .select('id, contact_name, contact_email, message, status, pro_notes, created_at')
    .eq('photographer_id', photographer.id)
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
        metier="photographe"
        quoteBase="/dashboard/ma-fiche-photographe/devis-factures"
        standalone
      />
    </div>
  )
}
