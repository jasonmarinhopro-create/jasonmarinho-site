import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import SocialAdmin, { type SocialAccountRow, type SocialPostRow } from './SocialAdmin'
import type { SocialCommentRow } from './SocialAutopilot'
import { loadCmDocs } from '@/lib/social/cm-docs'

export const metadata = { title: 'Réseaux sociaux, Admin' }
export const dynamic = 'force-dynamic'
// La publication Instagram attend le traitement du média (jusqu'à ~40s,
// voir waitForMediaReady dans lib/social/meta.ts) — au-delà du timeout
// par défaut des Server Actions.
export const maxDuration = 60

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

  const [{ data: accounts }, { data: posts }, { data: targets }, { data: cadence }, { data: comments }, cmDocs] = await Promise.all([
    admin.from('social_accounts')
      .select('id, platform, external_account_id, display_name, status, token_expires_at, created_at')
      .order('created_at', { ascending: true }),
    admin.from('social_posts')
      .select('id, body, media_urls, platforms, scheduled_at, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
    admin.from('social_post_targets')
      .select('id, post_id, platform, status, external_post_id, error, published_at, body_override, like_count, comment_count, stats_updated_at'),
    admin.from('social_cadence').select('weekdays, time_of_day').limit(1).maybeSingle(),
    // Commentaires relevés et réponses du community manager (migration 155 ; table absente : liste vide)
    admin.from('social_comments')
      .select('id, platform, text, reply_text, reply_status, reply_error, created_at, replied_at')
      .order('created_at', { ascending: false })
      .limit(60),
    loadCmDocs(),
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
      <SocialAdmin
        accounts={(accounts ?? []) as SocialAccountRow[]}
        posts={postRows}
        cadence={cadence ? { weekdays: cadence.weekdays as number[], timeOfDay: cadence.time_of_day as string } : null}
        comments={(comments ?? []) as SocialCommentRow[]}
        cmReport={cmDocs.report}
        cmLearnings={cmDocs.learnings}
      />
    </div>
  )
}
