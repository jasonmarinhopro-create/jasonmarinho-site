import { getServiceClient as getClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('ideas')
    .select('id, title, votes, status, created_at')
    .order('votes', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ideas: data ?? [] })
}
