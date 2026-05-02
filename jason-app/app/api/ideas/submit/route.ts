import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getClientIp } from '@/lib/security/rate-limit'
import { isStringInRange } from '@/lib/security/validate'

export const runtime = 'edge'

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const limit = await rateLimit('ideas:submit', ip, 5, 60_000)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes. Réessaye dans 1 minute.' }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const rawTitle = typeof body.title === 'string' ? body.title.trim() : ''

  if (!isStringInRange(rawTitle, 5, 120)) {
    return NextResponse.json({ error: 'Titre invalide (5–120 caractères)' }, { status: 400 })
  }

  const supabase = getClient()
  const { data, error } = await supabase
    .from('ideas')
    .insert({ title: rawTitle, votes: 0, status: 'pending' })
    .select('id, title, votes, status, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ idea: data }, { status: 201 })
}
