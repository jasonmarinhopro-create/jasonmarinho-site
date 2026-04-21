import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('roadmap_items')
    .select('id, title, description, status, author_name, upvotes, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_contributor, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.is_contributor) {
    return NextResponse.json({ error: 'Réservé aux contributeurs' }, { status: 403 })
  }

  const body = await req.json()
  const title = String(body.title ?? '').trim().slice(0, 200)
  const description = String(body.description ?? '').trim().slice(0, 800)
  if (!title) return NextResponse.json({ error: 'Titre requis' }, { status: 400 })

  const { data, error } = await supabase
    .from('roadmap_items')
    .insert({
      title,
      description: description || null,
      status: 'suggestion',
      author_id: user.id,
      author_name: profile.full_name ?? 'Contributeur',
    })
    .select('id, title, description, status, author_name, upvotes, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}
