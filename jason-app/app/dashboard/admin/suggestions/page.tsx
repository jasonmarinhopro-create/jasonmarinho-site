import { getServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/require-admin'
import { createClient } from '@/lib/supabase/server'
import SuggestionsAdmin from './SuggestionsAdmin'

export const metadata = { title: 'Suggestions, Admin' }
export const dynamic = 'force-dynamic'

export default async function SuggestionsAdminPage() {
  const supabase = await createClient()
  await requireAdmin()

  const admin = getServiceClient()
  const { data: suggestions } = await admin
    .from('suggestions')
    .select('id, type, message, user_email, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  return <SuggestionsAdmin initialSuggestions={suggestions ?? []} />
}
