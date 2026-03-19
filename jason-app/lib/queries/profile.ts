import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * Fetches the current user's profile.
 * Wrapped in React cache() so multiple calls within the same server request
 * (e.g. layout + page) execute only ONE Supabase roundtrip.
 */
export const getProfile = cache(async () => {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, driing_status')
    .eq('id', session.user.id)
    .single()

  return {
    userId: session.user.id,
    full_name: profile?.full_name ?? null,
    role: (profile?.role ?? 'user') as 'user' | 'driing' | 'admin',
    driing_status: (profile?.driing_status ?? 'none') as 'none' | 'pending' | 'confirmed',
  }
})
