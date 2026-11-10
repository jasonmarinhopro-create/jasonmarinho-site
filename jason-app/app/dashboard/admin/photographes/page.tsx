import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import PhotographersAdmin from './PhotographersAdmin'
import { getPhotographersQueue } from './actions'

export const metadata = { title: 'Photographes, Admin' }
export const dynamic = 'force-dynamic'

export default async function PhotographersAdminPage() {
  const supabase = await createClient()
  await requireAdmin()

  const queue = await getPhotographersQueue()
  return <PhotographersAdmin {...queue} />
}
