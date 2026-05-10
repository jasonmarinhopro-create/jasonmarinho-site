import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { planFromPriceId } from '@/lib/constants/stripe-plans'
import { invalidateProfileCache } from '@/lib/queries/profile'

// Applique l'effet d'un event Stripe sur Supabase. Utilisé par le webhook
// et par l'endpoint admin /api/stripe/sync (replay manuel).
export async function dispatchStripeEvent(event: Stripe.Event, db: SupabaseClient): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const contractId = session.metadata?.contract_id
      if (!contractId || session.payment_status !== 'paid') break

      const paymentIntentId = session.payment_intent as string
      const type = session.metadata?.type

      const { data: currentRow } = await db
        .from('contracts')
        .select('checklist_status')
        .eq('id', contractId)
        .single()
      const currentChecklist = (currentRow?.checklist_status as Record<string, boolean>) ?? {}

      if (type === 'loyer') {
        await db
          .from('contracts')
          .update({
            stripe_payment_intent_id: paymentIntentId,
            stripe_payment_status: 'paid',
            checklist_status: { ...currentChecklist, solde_recu: true },
          })
          .eq('id', contractId)
      } else {
        await db
          .from('contracts')
          .update({
            stripe_deposit_payment_intent_id: paymentIntentId,
            stripe_deposit_status: 'held',
            checklist_status: { ...currentChecklist, caution_recue: true },
          })
          .eq('id', contractId)
      }
      break
    }

    case 'payment_intent.amount_capturable_updated': {
      const pi = event.data.object as Stripe.PaymentIntent
      const contractId = pi.metadata?.contract_id
      if (!contractId) break
      const { data: currentRow } = await db
        .from('contracts')
        .select('checklist_status')
        .eq('id', contractId)
        .single()
      const currentChecklist = (currentRow?.checklist_status as Record<string, boolean>) ?? {}
      await db
        .from('contracts')
        .update({
          stripe_deposit_payment_intent_id: pi.id,
          stripe_deposit_status: 'held',
          checklist_status: { ...currentChecklist, caution_recue: true },
        })
        .eq('id', contractId)
        .in('stripe_deposit_status', ['pending', null])
      break
    }

    case 'payment_intent.canceled': {
      const pi = event.data.object as Stripe.PaymentIntent
      const contractId = pi.metadata?.contract_id
      if (!contractId) break
      await db
        .from('contracts')
        .update({ stripe_deposit_status: 'pending', stripe_deposit_payment_intent_id: null })
        .eq('id', contractId)
        .eq('stripe_deposit_status', 'held')
      break
    }

    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      if (account.details_submitted) {
        const { data } = await db
          .from('profiles')
          .update({ stripe_onboarding_complete: true })
          .eq('stripe_account_id', account.id)
          .select('id')
          .maybeSingle()
        if (data?.id) invalidateProfileCache(data.id)
      }
      break
    }

    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      if (!userId) break
      const priceId = sub.items.data[0]?.price?.id ?? ''
      await db.from('profiles').update({
        plan: planFromPriceId(priceId),
        stripe_subscription_id: sub.id,
        stripe_subscription_status: sub.status,
        stripe_price_id: priceId,
      }).eq('id', userId)
      invalidateProfileCache(userId)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      if (!userId) break
      const priceId = sub.items.data[0]?.price?.id ?? ''
      const plan = sub.status === 'active' ? planFromPriceId(priceId) : 'decouverte'
      await db.from('profiles').update({
        plan,
        stripe_subscription_status: sub.status,
        stripe_price_id: priceId,
      }).eq('id', userId)
      invalidateProfileCache(userId)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      if (!userId) break
      await db.from('profiles').update({
        plan: 'decouverte',
        stripe_subscription_id: null,
        stripe_subscription_status: 'canceled',
        stripe_price_id: null,
      }).eq('id', userId)
      invalidateProfileCache(userId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }
      const subId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : (invoice.subscription as Stripe.Subscription | null | undefined)?.id
      if (!subId) break
      const { data } = await db.from('profiles').update({
        stripe_subscription_status: 'past_due',
      }).eq('stripe_subscription_id', subId).select('id').maybeSingle()
      if (data?.id) invalidateProfileCache(data.id)
      break
    }
  }
}
