import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/auth-user'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import DemandesRecues, { type ProContact } from '@/components/pros/DemandesRecues'
import { updateContactStatus, updateContactNotes, deleteContact, addClientFromContact } from '../actions'

export const metadata = { title: 'Demandes reçues — Équipe ménage' }
export const dynamic = 'force-dynamic'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export default async function Page() {
  const user = await getAuthUser()
  if (!user) redirect('/auth/login?as=menage')

  const admin = getServiceClient()
  const { data: cleaner } = await admin
    .from('cleaners')
    .select('id, full_name, pseudo')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!cleaner) redirect('/dashboard/ma-fiche-menage')

  const { data: contacts } = await admin
    .from('cleaner_contacts')
    .select('id, contact_name, contact_email, message, status, pro_notes, created_at')
    .eq('cleaner_id', cleaner.id)
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
        metier="équipe"
        standalone
      />
    </div>
  )
}
