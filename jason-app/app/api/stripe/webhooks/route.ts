import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/client'
import Stripe from 'stripe'
import { planFromPriceId } from '@/lib/constants/stripe-plans'
import { logger } from '@/lib/logger'
import { invalidateProfileCache } from '@/lib/queries/profile'
const log = logger('api/stripe/webhooks')

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// POST /api/stripe/webhooks
// Reçoit les événements Stripe Connect (pour tous les comptes connectés)
export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Signature manquante.' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    log.error('invalidSignature', { err: String(err) })
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 })
  }

  const db = serviceClient()

  try {
    switch (event.type) {
      // La Checkout Session est complète
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const contractId = session.metadata?.contract_id
        if (!contractId || session.payment_status !== 'paid') break

        const paymentIntentId = session.payment_intent as string
        const type = session.metadata?.type // 'loyer' | undefined (caution)

        // Récupère la checklist actuelle pour merge
        const { data: currentRow } = await db
          .from('contracts')
          .select('checklist_status')
          .eq('id', contractId)
          .single()
        const currentChecklist = (currentRow?.checklist_status as Record<string, boolean>) ?? {}

        if (type === 'loyer') {
          // Paiement immédiat du loyer → coche "Solde reçu" auto
          await db
            .from('contracts')
            .update({
              stripe_payment_intent_id: paymentIntentId,
              stripe_payment_status: 'paid',
              checklist_status: { ...currentChecklist, solde_recu: true },
            })
            .eq('id', contractId)
        } else {
          // Pré-autorisation caution (capture manuelle) → coche "Caution reçue"
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

      // Pré-autorisation confirmée (caution retenue sur la carte)
      // Fiable même si checkout.session.completed est manqué
      case 'payment_intent.amount_capturable_updated': {
        const pi = event.data.object as Stripe.PaymentIntent
        const contractId = pi.metadata?.contract_id
        if (!contractId) break
        // Récupère la checklist actuelle pour merge
        const { data: currentRow } = await db
          .from('contracts')
          .select('checklist_status')
          .eq('id', contractId)
          .single()
        const currentChecklist = (currentRow?.checklist_status as Record<string, boolean>) ?? {}
        // Passer en 'held' seulement si ce n'est pas déjà capturé/libéré
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

      // Autorisation expirée ou annulée (Stripe expire les pré-auths après 7–30 jours)
      case 'payment_intent.canceled': {
        const pi = event.data.object as Stripe.PaymentIntent
        const contractId = pi.metadata?.contract_id
        if (!contractId) break
        // Si l'autorisation était retenue, remettre en 'pending' pour que le voyageur puisse repayer
        await db
          .from('contracts')
          .update({ stripe_deposit_status: 'pending', stripe_deposit_payment_intent_id: null })
          .eq('id', contractId)
          .eq('stripe_deposit_status', 'held')
        break
      }

      // Compte Connect : onboarding terminé
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

      // Abonnement plateforme créé
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

      // Abonnement mis à jour (upgrade, downgrade, renouvellement)
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

      // Abonnement résilié
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

      // Paiement échoué → passe en past_due
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
  } catch (err) {
    log.error('unexpected', { err: String(err) })
  }

  return NextResponse.json({ received: true })
}
