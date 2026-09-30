// Création d'une notification, de façon idempotente (SERVER ONLY).
//
// Service role : les notifications naissent hors du contexte de leur
// destinataire (cron, webhook Stripe, signature du voyageur, équipe de
// ménage). La clé unique (recipient_id, dedup_key) garantit qu'une même
// règle peut tourner plusieurs fois sans doublon (ex. « arrivée demain »
// vérifiée à chaque ouverture de la cloche).
import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getServiceClient } from '@/lib/supabase/service'
import { cleanText } from './present'
import type { NotificationCategory, NotificationSeverity } from './types'

export interface CreateNotificationInput {
  recipientId: string
  category: NotificationCategory
  type: string
  title: string
  body?: string
  ctaLabel?: string
  ctaHref?: string
  severity?: NotificationSeverity
  metadata?: Record<string, unknown>
  dedupKey: string  // Convention : <type>:<entity_id>[:<period>]
  expiresAt?: string | Date  // Optionnel : auto-expire
}

/**
 * Crée (ou ignore si déjà existante) une notification.
 * Renvoie `true` si une nouvelle a été créée, `false` si déduplication ou erreur.
 * Ne lève jamais : une notification ne doit pas faire échouer l'action qui la déclenche.
 */
export async function createNotification(input: CreateNotificationInput): Promise<boolean> {
  try {
    const { error } = await getServiceClient()
      .from('notifications')
      .insert({
        recipient_id:  input.recipientId,
        category:      input.category,
        type:          input.type,
        // Garde-fou DA : ni emoji ni tiret cadratin dans les textes visibles
        title:         cleanText(input.title) ?? input.title,
        body:          cleanText(input.body) ?? null,
        cta_label:     input.ctaLabel ?? null,
        cta_href:      input.ctaHref ?? null,
        severity:      input.severity ?? 'info',
        metadata:      input.metadata ?? {},
        dedup_key:     input.dedupKey.slice(0, 250),
        expires_at:    input.expiresAt
          ? (typeof input.expiresAt === 'string' ? input.expiresAt : input.expiresAt.toISOString())
          : null,
      })
    if (error) {
      // 23505 = unique_violation = déjà notifié, pas une erreur
      if (error.code !== '23505') console.error('[createNotification]', error)
      return false
    }
    return true
  } catch (e) {
    console.error('[createNotification] crash', e)
    return false
  }
}

/** Crée plusieurs notifications. Retourne le nombre de nouvelles (hors doublons). */
export async function createNotificationsBatch(inputs: CreateNotificationInput[]): Promise<number> {
  const res = await Promise.all(inputs.map(i => createNotification(i)))
  return res.filter(Boolean).length
}

/** Lien vers la fiche du voyageur d'un séjour (repli : Contrats & paiements) */
export async function sejourHref(db: SupabaseClient, sejourId: string | null | undefined, fallback = '/dashboard/contrats'): Promise<string> {
  if (!sejourId) return fallback
  try {
    const { data } = await db.from('sejours').select('voyageur_id').eq('id', sejourId).maybeSingle()
    return data?.voyageur_id ? `/dashboard/voyageurs/${data.voyageur_id}` : fallback
  } catch {
    return fallback
  }
}
