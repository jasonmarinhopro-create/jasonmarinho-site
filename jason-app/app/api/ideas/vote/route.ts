import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const id = body.id as string

  if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 })

  const supabase = getClient()
  const { error } = await supabase.rpc('increment_idea_votes', { idea_id: id })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
