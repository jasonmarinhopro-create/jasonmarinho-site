import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SOSFeedbackAdmin from './SOSFeedbackAdmin'

export const metadata = { title: 'SOS Feedback, Admin, Jason Marinho' }

export default async function AdminSOSFeedbackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: feedback } = await supabase
    .from('sos_feedback')
    .select('id, user_email, user_name, scenario, channel, feedback_type, message, status, admin_note, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <div style={{ padding: 'clamp(20px,3vw,40px)', width: '100%' }}>
      <SOSFeedbackAdmin items={feedback ?? []} />
    </div>
  )
}
