import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import SocialAdmin, { type SocialAccountRow, type SocialPostRow } from './SocialAdmin'

export const metadata = { title: 'Réseaux sociaux, Admin' }
export const dynamic = 'force-dynamic'

export default async function SocialAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const [{ data: accounts }, { data: posts }, { data: targets }] = await Promise.all([
    admin.from('social_accounts')
      .select('id, platform, external_account_id, display_name, status, token_expires_at, created_at')
      .order('created_at', { ascending: true }),
    admin.from('social_posts')
      .select('id, body, media_urls, platforms, scheduled_at, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
    admin.from('social_post_targets')
      .select('id, post_id, platform, status, external_post_id, error, published_at'),
  ])

  const targetsByPost = new Map<string, typeof targets>()
  for (const t of targets ?? []) {
    const list = targetsByPost.get(t.post_id) ?? []
    list.push(t)
    targetsByPost.set(t.post_id, list)
  }

  const postRows: SocialPostRow[] = ((posts ?? []) as any[]).map(p => ({
    ...p,
    targets: targetsByPost.get(p.id) ?? [],
  }))

  return (
    <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%' }}>
      <SocialAdmin accounts={(accounts ?? []) as SocialAccountRow[]} posts={postRows} />
    </div>
  )
}
