import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js'
import SuggestionsAdmin from './SuggestionsAdmin'

export const metadata = { title: 'Suggestions, Admin' }
export const dynamic = 'force-dynamic'

function getServiceClient(): SupabaseClient<any, 'public', any> {
  return createServiceClient<any, 'public', any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export default async function SuggestionsAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const admin = getServiceClient()
  const { data: suggestions } = await admin
    .from('suggestions')
    .select('id, type, message, user_email, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  return <SuggestionsAdmin initialSuggestions={suggestions ?? []} />
}
