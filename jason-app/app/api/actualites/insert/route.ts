import { getServiceClient as serviceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { findSimilarActualite } from '@/lib/actualites/dedup'
import { readAudience } from '@/lib/actualites/audience'

const VALID_CATEGORIES = new Set([
  'reglementation', 'fiscalite', 'plateformes', 'marche', 'outils', 'juridique', 'driing',
  'gites', 'chambres-hotes', 'conciergerie', 'reservation-directe', 'communes', 'general',
  // Actualités des pros (17/10/2026) : métier photo / vidéo, métier du ménage, statut et obligations d'entreprise
  'photo-video', 'menage', 'entreprise',
])

/**
 * Historique lu par la routine de veille (23/10/2026) : les actualités des 60 derniers jours,
 * publiées ou masquées, ajoutées par la routine OU depuis l'admin. Avant, l'historique ne
 * listait que ce que la routine avait réussi à publier : une actu PLF 2027 déjà en base
 * n'y figurait pas, et la routine l'a reproposée trois jours de suite (refusée comme doublon).
 * Même jeton que l'insertion.
 */
export async function GET(req: NextRequest) {
  const token = req.headers.get('x-insert-token')
  if (!token || token !== process.env.ACTUALITES_INSERT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const since = new Date(Date.now() - 60 * 86_400_000).toISOString()
  let res = await serviceClient().from('actualites')
    .select('title, category, source_url, is_published, published_at, created_at, audience')
    .gte('created_at', since).order('created_at', { ascending: true }).limit(500)
  if (res.error && /audience/.test(res.error.message)) {
    res = await serviceClient().from('actualites')
      .select('title, category, source_url, is_published, published_at, created_at')
      .gte('created_at', since).order('created_at', { ascending: true }).limit(500) as typeof res
  }
  if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 })
  return NextResponse.json({ items: res.data ?? [] }, { headers: { 'Cache-Control': 'no-store' } })
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
  const results: { title: string; status: 'inserted' | 'duplicate' | 'error'; error?: string; similar_to?: string }[] = []

  // Actualités des 60 derniers jours (publiées ou masquées : une actu masquée
  // comme doublon doit continuer à bloquer ses reformulations).
  const since = new Date(Date.now() - 60 * 86_400_000).toISOString()
  const { data: recent } = await supabase
    .from('actualites')
    .select('title, summary, source_url')
    .gte('created_at', since)
  const known: { title: string; summary: string; source_url: string | null }[] = recent ?? []

  for (const item of items) {
    if (
      typeof item !== 'object' || item === null ||
      !('title' in item) || !('summary' in item) || !('category' in item)
    ) {
      results.push({ title: String((item as Record<string, unknown>)?.title ?? '?'), status: 'error', error: 'Missing title/summary/category' })
      continue
    }

    const { title, summary, source_url, category, published_at, is_published = true, read_time_minutes, is_update, audience } =
      item as Record<string, unknown>

    if (!VALID_CATEGORIES.has(String(category))) {
      results.push({ title: String(title), status: 'error', error: `Unknown category: ${category}` })
      continue
    }

    // Déduplication 1 : titre exact, sur tout l'historique.
    const { data: existing } = await supabase
      .from('actualites')
      .select('id')
      .eq('title', title)
      .maybeSingle()

    if (existing) {
      results.push({ title: String(title), status: 'duplicate' })
      continue
    }

    // Déduplication 2 : même sujet reformulé dans les 60 derniers jours
    // (lib/actualites/dedup.ts). `is_update: true` laisse passer une vraie
    // évolution (nouvelle date, décision publiée), le titre doit alors dire
    // ce qui change.
    const candidate = { title: String(title), summary: String(summary), source_url: source_url ? String(source_url) : null }
    const similar = is_update === true ? null : findSimilarActualite(candidate, known)
    if (similar) {
      results.push({ title: String(title), status: 'duplicate', similar_to: similar.title })
      continue
    }

    // Public (hôtes par défaut) : colonne de la migration 20261017_137
    const who = readAudience(audience)
    const row = {
      title,
      summary,
      source_url:        source_url || null,
      category,
      is_published,
      published_at:      published_at || (is_published ? new Date().toISOString() : null),
      read_time_minutes: read_time_minutes ? parseInt(String(read_time_minutes), 10) : null,
    }
    let { error } = await supabase.from('actualites').insert({ ...row, audience: who })
    // Migration pas encore passée : une actu des hôtes s'enregistre quand même,
    // une actu des pros attend la colonne (sinon elle s'afficherait aux hôtes).
    if (error && /audience/.test(error.message) && who.length === 1 && who[0] === 'hote') {
      ({ error } = await supabase.from('actualites').insert(row))
    }

    if (error) {
      results.push({ title: String(title), status: 'error', error: error.message })
    } else {
      results.push({ title: String(title), status: 'inserted' })
      known.push(candidate) // un lot ne peut pas contenir deux fois le même sujet
    }
  }

  const inserted  = results.filter(r => r.status === 'inserted').length
  const duplicates = results.filter(r => r.status === 'duplicate').length
  const errors    = results.filter(r => r.status === 'error').length

  return NextResponse.json({ inserted, duplicates, errors, results }, {
    status: errors > 0 && inserted === 0 ? 400 : 200,
  })
}
