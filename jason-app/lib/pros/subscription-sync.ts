import 'server-only'
// Abonnements des fiches pros vérifiés chez Stripe (17/10/2026 : une
// photographe a payé, mais sa fiche restait « incomplete » : à la création,
// Stripe envoie l'abonnement « incomplete » puis presque aussitôt « active »,
// et le premier message, traité en dernier, écrasait le bon statut). Le
// webhook relit maintenant l'abonnement chez Stripe ; ce rattrapage relit tous
// les abonnements non résiliés (cron quotidien + ouverture des pages admin).
import type { SupabaseClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/client'
import { logger } from '@/lib/logger'
import { triggerSiteRebuild } from '@/lib/pros/site-rebuild'
import { applyProSubscription } from '@/lib/pros/activate'

const log = logger('lib/pros/subscription-sync')
const LIVE = new Set(['active', 'trialing'])

export interface ProSubSync { checked: number; fixed: number; nowPaid: number }

/** Relit chez Stripe les abonnements des fiches pros et corrige le statut en base. Ne lève jamais. */
export async function syncProSubscriptions(db: SupabaseClient, budgetMs = 6000): Promise<ProSubSync> {
  const out: ProSubSync = { checked: 0, fixed: 0, nowPaid: 0 }
  const started = Date.now()
  for (const table of ['photographers', 'cleaners'] as const) {
    const { data, error } = await db.from(table)
      .select('id, status, is_public, stripe_subscription_id, stripe_subscription_status')
      .not('stripe_subscription_id', 'is', null)
      .or('stripe_subscription_status.is.null,stripe_subscription_status.not.in.(canceled,incomplete_expired)')
      .limit(100)
    if (error) { log.error('lecture des fiches', { table, err: error.message }); continue }
    for (const r of data ?? []) {
      if (Date.now() - started > budgetMs) return out
      out.checked++
      try {
        const sub = await stripe.subscriptions.retrieve(r.stripe_subscription_id as string)
        const done = await applyProSubscription(db, table === 'photographers' ? 'photographer' : 'cleaner', r.id, {
          id: sub.id, status: sub.status, customer: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null,
        }, { rebuild: false })
        if (done === 'rien') continue
        out.fixed++
        if (done === 'activee' || (LIVE.has(sub.status) && !LIVE.has(r.stripe_subscription_status ?? ''))) out.nowPaid++
      } catch (e) {
        log.error('lecture Stripe', { table, err: e instanceof Error ? e.message : String(e) })
      }
    }
  }
  if (out.fixed) await triggerSiteRebuild('stripe')
  return out
}
