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
  const title = (body.title as string)?.trim()

  if (!title || title.length < 5) {
    return NextResponse.json({ error: 'Titre trop court' }, { status: 400 })
  }
  if (title.length > 120) {
    return NextResponse.json({ error: 'Titre trop long (120 car. max)' }, { status: 400 })
  }

  const supabase = getClient()
  const { data, error } = await supabase
    .from('ideas')
    .insert({ title, votes: 0, status: 'pending' })
    .select('id, title, votes, status, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ idea: data }, { status: 201 })
}
