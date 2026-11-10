import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import CleanersAdmin from './CleanersAdmin'
import { getCleanersQueue } from './actions'

export const metadata = { title: 'Ménage LCD, Admin' }
export const dynamic = 'force-dynamic'

export default async function CleanersAdminPage() {
  const supabase = await createClient()
  await requireAdmin()

  const queue = await getCleanersQueue()
  return <CleanersAdmin {...queue} />
}
