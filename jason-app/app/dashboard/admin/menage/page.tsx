import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CleanersAdmin from './CleanersAdmin'
import { getCleanersQueue } from './actions'

export const metadata = { title: 'Ménage LCD, Admin' }
export const dynamic = 'force-dynamic'

export default async function CleanersAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const queue = await getCleanersQueue()
  return <CleanersAdmin {...queue} />
}
