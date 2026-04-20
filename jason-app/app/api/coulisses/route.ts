import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ADMIN_EMAIL = 'djason.marinho@gmail.com'

export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const isAdmin = session.user.email === ADMIN_EMAIL
  if (!isAdmin) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_contributor')
      .eq('id', session.user.id)
      .maybeSingle()
    if (!profile?.is_contributor) {
      return NextResponse.json({ error: 'Accès réservé aux contributeurs' }, { status: 403 })
    }
  }

  const { data: posts, error } = await supabase
    .from('coulisses_posts')
    .select('id, content, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts: posts ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Réservé à Jason' }, { status: 403 })
  }

  const { content } = await req.json()
  if (!content?.trim() || content.trim().length > 1200) {
    return NextResponse.json({ error: 'Contenu invalide (1–1200 caractères)' }, { status: 400 })
  }

  const { data: post, error } = await supabase
    .from('coulisses_posts')
    .insert({ content: content.trim() })
    .select('id, content, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post })
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Réservé à Jason' }, { status: 403 })
  }

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const { error } = await supabase.from('coulisses_posts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
