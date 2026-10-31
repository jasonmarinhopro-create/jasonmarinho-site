import 'server-only'
// Une seule règle pour appliquer le statut d'un abonnement Stripe à une fiche pro
// (webhook created / updated et synchro quotidienne). La fiche n'est activée,
// publiée et annoncée par e-mail que si l'abonnement est réellement payé.
import type { SupabaseClient } from '@supabase/supabase-js'
import { sendProWelcomeEmail } from '@/lib/email/pro-welcome'
import { triggerSiteRebuild } from '@/lib/pros/site-rebuild'
import { logger } from '@/lib/logger'
import { subscriptionAction, isLiveSub } from './paid'

const log = logger('lib/pros/activate')
import { METIERS, type ProKind } from './metiers'
export type { ProKind }

interface SubInfo { id: string; status: string; customer: string | null }

const slugBase = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)

/** Retourne ce qui a été fait (pour les compteurs de la synchro). Ne lève jamais. */
export async function applyProSubscription(db: SupabaseClient, kind: ProKind, ficheId: string, sub: SubInfo, opts: { rebuild?: boolean } = {}): Promise<'activee' | 'en_attente' | 'suivie' | 'rien'> {
  const table = METIERS[kind].table
  const cols = kind !== 'photographer' ? 'id, full_name, pseudo, ville, email, slug, tier, status, is_public, stripe_subscription_status' : 'id, full_name, ville, email, slug, tier, status, is_public, stripe_subscription_status'
  const { data, error } = await db.from(table).select(cols).eq('id', ficheId).maybeSingle()
  if (error || !data) { if (error) log.error('lecture de la fiche', { table, err: error.message }); return 'rien' }
  const f = data as unknown as { id: string; full_name: string; pseudo?: string | null; ville: string; email: string; slug: string | null; tier: string; status: string; is_public: boolean; stripe_subscription_status: string | null }
  const stripeFields = { stripe_subscription_id: sub.id, stripe_subscription_status: sub.status, ...(sub.customer ? { stripe_customer_id: sub.customer } : {}) }
  const now = new Date().toISOString()
  const rebuild = opts.rebuild !== false
  const action = subscriptionAction(f.status, sub.status)

  if (action === 'activer') {
    let slug = f.slug
    if (!slug) {
      const base = slugBase(`${(kind !== 'photographer' && f.pseudo) || f.full_name}-${f.ville}`)
      const { data: clash } = await db.from(table).select('id').eq('slug', base).neq('id', ficheId).maybeSingle()
      slug = clash ? `${base}-${ficheId.slice(0, 6)}` : base
    }
    await db.from(table).update({ ...stripeFields, status: 'active', is_public: true, slug, updated_at: now }).eq('id', ficheId)
    if (rebuild) await triggerSiteRebuild('stripe')
    await sendProWelcomeEmail({
      pro: kind, email: f.email, fullName: f.full_name, displayName: (kind !== 'photographer' && f.pseudo) || f.full_name,
      ville: f.ville, slug, tier: f.tier as never,
    }).catch(() => {})
    return 'activee'
  }
  if (action === 'remettre_en_attente') {
    // Passée « active » sans avoir jamais payé : retour en attente, retirée du site
    await db.from(table).update({ ...stripeFields, status: 'pending_payment', is_public: false, updated_at: now }).eq('id', ficheId)
    if (rebuild && f.is_public) await triggerSiteRebuild('stripe')
    return 'en_attente'
  }
  if (action === 'suivre') {
    const publicNow = isLiveSub(sub.status)
    if (sub.status === f.stripe_subscription_status && publicNow === f.is_public) return 'rien'
    await db.from(table).update({ ...stripeFields, is_public: publicNow, updated_at: now }).eq('id', ficheId)
    if (rebuild && publicNow !== f.is_public) await triggerSiteRebuild('stripe')
    return 'suivie'
  }
  // En attente et pas encore payé (ou fiche masquée / annulée) : on garde la trace de l'abonnement, rien de public
  if (sub.status !== f.stripe_subscription_status) await db.from(table).update({ ...stripeFields, updated_at: now }).eq('id', ficheId)
  return 'rien'
}
