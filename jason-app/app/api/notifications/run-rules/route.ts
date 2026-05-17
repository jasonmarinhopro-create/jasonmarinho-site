// Trigger le rules-engine pour l'utilisateur connecté. Best-effort, idempotent.
// Appelé depuis le client à l'ouverture de la cloche (throttlé côté UI).

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runNotificationRules } from '@/lib/notifications/rules'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const result = await runNotificationRules(user.id)
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
}
