// Notifications sur le téléphone : abonner / désabonner cet appareil, envoyer
// un essai. Toujours pour l'utilisateur connecté (getUser).
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { pushConfigured, sendPushToUser } from '@/lib/notifications/push'
import { deviceLabel } from '@/lib/notifications/push-rules'
import { rateLimit, getClientIp } from '@/lib/security/rate-limit'

export const dynamic = 'force-dynamic'

type Body = {
  action?: 'subscribe' | 'unsubscribe' | 'test'
  subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
  endpoint?: string
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non connecté.' }, { status: 401 })
  const limit = await rateLimit('push', `${user.id}:${getClientIp(req)}`, 20, 60 * 60_000)
  if (!limit.allowed) return NextResponse.json({ error: 'Trop de tentatives, réessaie plus tard.' }, { status: 429 })

  const body = await req.json().catch(() => ({})) as Body

  if (body.action === 'subscribe') {
    const s = body.subscription
    const endpoint = s?.endpoint ?? ''
    if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !s?.keys?.p256dh || !s.keys.auth) {
      return NextResponse.json({ error: 'Abonnement invalide.' }, { status: 400 })
    }
    // Service role : un appareil déjà abonné par un autre compte (connexion
    // changée sur le même téléphone) passe au compte connecté.
    const { error } = await getServiceClient().from('push_subscriptions').upsert({
      user_id: user.id, endpoint, p256dh: s.keys.p256dh, auth: s.keys.auth,
      device: deviceLabel(req.headers.get('user-agent')), failures: 0,
    }, { onConflict: 'endpoint' })
    if (error) return NextResponse.json({ error: error.code === '42P01' ? 'Mise à jour de la base en attente (migration 119).' : 'Enregistrement impossible.' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'unsubscribe') {
    if (body.endpoint) await supabase.from('push_subscriptions').delete().eq('user_id', user.id).eq('endpoint', body.endpoint)
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'test') {
    if (!pushConfigured()) return NextResponse.json({ error: 'Envoi pas encore configuré.' }, { status: 503 })
    const sent = await sendPushToUser(user.id, {
      title: 'Notifications activées',
      body: 'Tu recevras ici les nouvelles réservations, contrats signés, paiements et check-in.',
      url: '/dashboard/notifications',
      tag: 'essai',
    })
    return NextResponse.json({ ok: sent > 0, sent })
  }

  return NextResponse.json({ error: 'Action inconnue.' }, { status: 400 })
}
