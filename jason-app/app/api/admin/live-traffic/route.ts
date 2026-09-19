import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getLiveVisitorsCount, getChannelBreakdown, CHANNEL_LABELS } from '@/lib/queries/site-traffic'

// Polling léger depuis AdminUI (toutes les ~25s) pour rafraîchir le
// compteur "en direct" sans recharger toute la page admin.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const [live, channels] = await Promise.all([
    getLiveVisitorsCount(admin),
    getChannelBreakdown(admin),
  ])

  return NextResponse.json({
    live,
    channels: channels.map(c => ({ ...c, label: CHANNEL_LABELS[c.channel] })),
  })
}
