// Envoi des notifications sur le téléphone (Web Push), SERVER ONLY.
// Clés VAPID dans les variables d'environnement : VAPID_PUBLIC_KEY,
// VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:). Pas de préfixe NEXT_PUBLIC_
// (Vercel le signale comme exposé au navigateur) : la clé publique est lue ici
// côté serveur et passée à la page (vapidPublicKey). Sans elles, rien n'est envoyé et
// la page Notifications l'indique. Abonnements : table push_subscriptions
// (migration 20260930_119), un par appareil.
import 'server-only'
import webpush from 'web-push'
import { getServiceClient } from '@/lib/supabase/service'
import { isGoneStatus, type PushPayload } from './push-rules'

let configured: boolean | null = null

/** Clé publique à donner au navigateur (null si l'envoi n'est pas configuré) */
export function vapidPublicKey(): string | null {
  return pushConfigured() ? (process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null) : null
}

export function pushConfigured(): boolean {
  if (configured !== null) return configured
  const pub = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return (configured = false)
  try {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:contact@jasonmarinho.com', pub, priv)
    configured = true
  } catch (e) {
    console.error('[push] clés VAPID invalides', e)
    configured = false
  }
  return configured
}

type SubRow = { id: string; endpoint: string; p256dh: string; auth: string; failures: number }

/** Envoie à tous les appareils de l'utilisateur. Retourne le nombre d'envois réussis. Ne lève jamais. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!pushConfigured()) return 0
  try {
    const db = getServiceClient()
    const { data, error } = await db.from('push_subscriptions')
      .select('id, endpoint, p256dh, auth, failures').eq('user_id', userId).limit(10)
    if (error || !data?.length) return 0
    const body = JSON.stringify(payload)
    const results = await Promise.all((data as SubRow[]).map(async s => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
          { TTL: 12 * 3600, urgency: 'normal', timeout: 5000 },
        )
        await db.from('push_subscriptions').update({ last_used_at: new Date().toISOString(), failures: 0 }).eq('id', s.id)
        return true
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode
        if (isGoneStatus(status) || s.failures >= 5) await db.from('push_subscriptions').delete().eq('id', s.id)
        else await db.from('push_subscriptions').update({ failures: s.failures + 1 }).eq('id', s.id)
        return false
      }
    }))
    return results.filter(Boolean).length
  } catch (e) {
    console.error('[push] envoi', e)
    return 0
  }
}
