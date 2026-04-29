import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GabaritsAdmin from './GabaritsAdmin'

export const metadata = { title: 'Gabarits — Admin — Jason Marinho' }

export default async function AdminGabaritsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: templates } = await supabase
    .from('templates')
    .select('id, title, content, category, timing, variante, corps_en, tags, copy_count, created_at')
    .order('created_at', { ascending: false })

  return (
    <>
      <div style={{ padding: 'clamp(24px,3vw,40px)', maxWidth: '900px' }}>
        <GabaritsAdmin templates={templates ?? []} />
      </div>
    </>
  )
}
