// Liste les notifications de l'utilisateur connecté. Utilisé par le panneau
// de la cloche pour afficher les 4-5 dernières alertes.

import { NextResponse } from 'next/server'
import { getNotifications } from '@/lib/notifications/queries'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '10', 10)))
  const unreadOnly = url.searchParams.get('unreadOnly') === '1'

  const notifications = await getNotifications({ limit, unreadOnly })
  return NextResponse.json({ notifications }, { headers: { 'Cache-Control': 'no-store' } })
}
