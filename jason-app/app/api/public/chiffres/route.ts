// Chiffres publics de visibilité (13/10/2026) : lus par jasonmarinho.com/chiffres
// et par l'encart des pages de ville des pros. Totaux, recherches Google et
// adresses de pages seulement, rien de personnel. `?page=/photographe-lcd-lyon`
// renvoie seulement ce qu'il faut pour une page de ville.
import { NextResponse } from 'next/server'
import { loadPublicStats } from '@/lib/public-stats/load'
import { isProCityPage } from '@/lib/public-stats/rules'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ALLOWED_ORIGINS = new Set([
  'https://jasonmarinho.com',
  'https://www.jasonmarinho.com',
  'https://app.jasonmarinho.com',
  'http://localhost:8765',
])

function headers(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://jasonmarinho.com',
    Vary: 'Origin',
    // Cache CDN 1 h, ancienne valeur servie pendant le recalcul
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=21600',
  }
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: { ...headers(req.headers.get('origin')), 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Max-Age': '86400' },
  })
}

export async function GET(req: Request) {
  const origin = req.headers.get('origin')
  const page = new URL(req.url).searchParams.get('page')
  try {
    const s = await loadPublicStats()
    if (page !== null) {
      const path = page.replace(/\/+$/, '')
      if (!isProCityPage(path)) return NextResponse.json({ error: 'Page inconnue' }, { status: 400, headers: headers(origin) })
      return NextResponse.json({
        updatedAt: s.updatedAt,
        period: s.google ? { start: s.google.start, end: s.google.end } : null,
        city: s.cities?.[path] ?? null,
        site: s.google ? { impressions: s.google.impressions, clicks: s.google.clicks, visitors: s.visitors?.last30 ?? null } : null,
        threshold: s.threshold,
      }, { headers: headers(origin) })
    }
    return NextResponse.json(s, { headers: headers(origin) })
  } catch {
    return NextResponse.json({ error: 'Chiffres indisponibles pour le moment' }, { status: 503, headers: { ...headers(origin), 'Cache-Control': 'no-store' } })
  }
}
