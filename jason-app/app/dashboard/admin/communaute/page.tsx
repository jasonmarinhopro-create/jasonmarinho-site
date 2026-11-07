import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CommunauteAdmin, { type Group } from './CommunauteAdmin'
import { getServiceClient } from '@/lib/supabase/service'
import { allRows } from '@/lib/supabase/all-rows'
import { groupLinkCode } from '@/lib/pros/groupes-clients'

export const metadata = { title: 'Communauté, Admin, Jason Marinho' }

export default async function AdminCommunautePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // audiences : migration 180 (07/11/2026), lecture tolérante tant qu'elle manque
  const base = 'id, name, description, platform, members_count, url, category, tag, sort_order'
  const run = (cols: string) => supabase.from('community_groups').select(cols).order('category').order('sort_order').order('name')
  let res = await run(`${base}, audiences`)
  if (res.error) res = await run(base)
  const rows = (res.data ?? []) as unknown as Array<Omit<Group, 'clicks'>>

  // Ouvertures de chaque groupe depuis l'app (liens suivis gfb-…, /api/groupes/ouvrir)
  const codes = rows.map(g => groupLinkCode(g.id))
  const clicks = new Map<string, number>()
  if (codes.length) {
    const db = getServiceClient()
    const { rows: hits } = await allRows<{ code: string }>(from => db.from('tracked_link_clicks').select('code').in('code', codes).range(from, from + 999))
    for (const h of hits) clicks.set(h.code, (clicks.get(h.code) ?? 0) + 1)
  }
  const groups: Group[] = rows.map(g => ({ ...g, clicks: clicks.get(groupLinkCode(g.id)) ?? 0 }))

  return (
    <>
      <div style={{ padding: 'clamp(24px,3vw,40px)', width: '100%' }}>
        <CommunauteAdmin groups={groups} />
      </div>
    </>
  )
}
