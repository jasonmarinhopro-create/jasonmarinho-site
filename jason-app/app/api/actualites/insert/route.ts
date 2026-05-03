import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const VALID_CATEGORIES = new Set([
  'reglementation', 'fiscalite', 'plateformes', 'marche', 'outils', 'juridique', 'driing',
  'gites', 'chambres-hotes', 'conciergerie', 'reservation-directe', 'communes', 'general',
])

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function POST(req: NextRequest) {
  // ── Auth ───────────────────────────────────────────────────────
  const token = req.headers.get('x-insert-token')
  if (!token || token !== process.env.ACTUALITES_INSERT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse body ─────────────────────────────────────────────────
  let items: unknown[]
  try {
    const body = await req.json()
    items = Array.isArray(body) ? body : [body]
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = serviceClient()
  const results: { title: string; status: 'inserted' | 'duplicate' | 'error'; error?: string }[] = []

  for (const item of items) {
    if (
      typeof item !== 'object' || item === null ||
      !('title' in item) || !('summary' in item) || !('category' in item)
    ) {
      results.push({ title: String((item as Record<string, unknown>)?.title ?? '?'), status: 'error', error: 'Missing title/summary/category' })
      continue
    }

    const { title, summary, source_url, category, published_at, is_published = true, read_time_minutes } =
      item as Record<string, unknown>

    if (!VALID_CATEGORIES.has(String(category))) {
      results.push({ title: String(title), status: 'error', error: `Unknown category: ${category}` })
      continue
    }

    // Deduplication
    const { data: existing } = await supabase
      .from('actualites')
      .select('id')
      .eq('title', title)
      .maybeSingle()

    if (existing) {
      results.push({ title: String(title), status: 'duplicate' })
      continue
    }

    const { error } = await supabase.from('actualites').insert({
      title,
      summary,
      source_url:        source_url || null,
      category,
      is_published,
      published_at:      published_at || (is_published ? new Date().toISOString() : null),
      read_time_minutes: read_time_minutes ? parseInt(String(read_time_minutes), 10) : null,
    })

    if (error) {
      results.push({ title: String(title), status: 'error', error: error.message })
    } else {
      results.push({ title: String(title), status: 'inserted' })
    }
  }

  const inserted  = results.filter(r => r.status === 'inserted').length
  const duplicates = results.filter(r => r.status === 'duplicate').length
  const errors    = results.filter(r => r.status === 'error').length

  return NextResponse.json({ inserted, duplicates, errors, results }, {
    status: errors > 0 && inserted === 0 ? 400 : 200,
  })
}
