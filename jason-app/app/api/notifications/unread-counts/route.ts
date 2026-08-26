// Compteurs de la cloche (Alertes app + Entre Hôtes) pour l'utilisateur
// connecté. Même logique que le rendu initial côté serveur (dashboard/layout.tsx)
// — un seul endroit qui sait filtrer correctement les notifications expirées —
// pour que le rafraîchissement client (navigation, changement de page) ne
// réintroduise pas le badge "fantôme" que corrige getUnreadCount().

import { NextResponse } from 'next/server'
import { getUnreadCount, getChezNousUnreadCount } from '@/lib/notifications/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [appNotifUnread, chezNousUnread] = await Promise.all([
    getUnreadCount(),
    getChezNousUnreadCount(),
  ])
  return NextResponse.json({ appNotifUnread, chezNousUnread }, { headers: { 'Cache-Control': 'no-store' } })
}
