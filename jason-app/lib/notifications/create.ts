// Helper côté serveur pour créer une notification de façon idempotente.
//
// Utilise le service role pour bypasser RLS (le rules-engine tourne hors
// contexte utilisateur). Le upsert sur `dedup_key` garantit qu'une même
// règle peut être ré-exécutée sans créer de doublons (ex: le check
// "arrivée demain" peut tourner toutes les heures sans flooder).

import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js'
import type { NotificationCategory, NotificationSeverity } from './types'

// On laisse le schema en `any` car pas de Database type généré localement.
// (Sans ce cast explicite, supabase-js 2.99 résout le schema interne et
// toutes les tables remontent en type `never` → build error.)
type ServiceClient = SupabaseClient<any, 'public', any>

let _serviceClient: ServiceClient | null = null

function getServiceClient(): ServiceClient {
  if (_serviceClient) return _serviceClient
  _serviceClient = createServiceClient<any, 'public', any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  return _serviceClient
}

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
 * Renvoie `true` si une nouvelle a été créée, `false` si déduplication.
 */
export async function createNotification(input: CreateNotificationInput): Promise<boolean> {
  const supabase = getServiceClient()
  const { error } = await supabase
    .from('notifications')
    .insert({
      recipient_id:  input.recipientId,
      category:      input.category,
      type:          input.type,
      title:         input.title,
      body:          input.body ?? null,
      cta_label:     input.ctaLabel ?? null,
      cta_href:      input.ctaHref ?? null,
      severity:      input.severity ?? 'info',
      metadata:      input.metadata ?? {},
      dedup_key:     input.dedupKey,
      expires_at:    input.expiresAt
        ? (typeof input.expiresAt === 'string' ? input.expiresAt : input.expiresAt.toISOString())
        : null,
    })

  if (error) {
    // Code 23505 = unique_violation = déduplication = pas une erreur métier
    if (error.code === '23505') return false
    console.error('[createNotification]', error)
    return false
  }
  return true
}

/**
 * Crée plusieurs notifications en batch. Retourne le nombre de NOUVELLES
 * notifications (hors dédup).
 */
export async function createNotificationsBatch(
  inputs: CreateNotificationInput[],
): Promise<number> {
  let created = 0
  for (const i of inputs) {
    if (await createNotification(i)) created++
  }
  return created
}
