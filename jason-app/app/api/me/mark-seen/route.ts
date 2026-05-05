import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { invalidateProfileCache } from '@/lib/queries/profile'

export const runtime = 'nodejs'

const KIND_TO_COLUMN = {
  actualites: 'last_seen_actualites_at',
  nouveautes: 'last_seen_nouveautes_at',
} as const

type Kind = keyof typeof KIND_TO_COLUMN

export async function POST(req: Request) {
  let body: { kind?: Kind } = {}
  try { body = await req.json() } catch { /* body vide → 400 */ }

  const kind = body.kind
  if (!kind || !(kind in KIND_TO_COLUMN)) {
    return NextResponse.json({ error: 'invalid_kind' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const column = KIND_TO_COLUMN[kind]
  const { error } = await supabase
    .from('profiles')
    .update({ [column]: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  invalidateProfileCache(user.id)
  return NextResponse.json({ ok: true })
}
