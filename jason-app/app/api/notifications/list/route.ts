// Fil de notifications de l'utilisateur connecté (alertes de l'app,
// Questions & réponses, nouveautés), pour le panneau de la cloche.
import { NextResponse } from 'next/server'
import { loadFeed } from '@/lib/notifications/feed'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '15', 10) || 15))
  const unreadOnly = url.searchParams.get('unreadOnly') === '1'
  const feed = await loadFeed({ limit, unreadOnly })
  return NextResponse.json(feed, { headers: { 'Cache-Control': 'no-store' } })
}
