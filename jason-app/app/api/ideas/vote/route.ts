import { getServiceClient as getClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/security/rate-limit'
import { isUuid } from '@/lib/security/validate'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const limit = await rateLimit('ideas:vote', ip, 30, 60_000)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Trop de votes. Réessaye dans 1 minute.' }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const id = body.id

  if (!isUuid(id)) {
    return NextResponse.json({ error: 'id invalide' }, { status: 400 })
  }

  const supabase = getClient()
  const { error } = await supabase.rpc('increment_idea_votes', { idea_id: id })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
