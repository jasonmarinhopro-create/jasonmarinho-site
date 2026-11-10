import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import GabaritsAdmin from './GabaritsAdmin'

export const metadata = { title: 'Gabarits, Admin, Jason Marinho' }

export default async function AdminGabaritsPage() {
  const supabase = await createClient()
  await requireAdmin()

  const { data: templates } = await supabase
    .from('templates')
    .select('id, title, content, category, timing, variante, corps_en, tags, copy_count, created_at')
    .order('created_at', { ascending: false })

  return (
    <>
      <div style={{ padding: 'clamp(24px,3vw,40px)', width: '100%' }}>
        <GabaritsAdmin templates={templates ?? []} />
      </div>
    </>
  )
}
