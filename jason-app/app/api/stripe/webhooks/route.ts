import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/client'
import Stripe from 'stripe'
import { planFromPriceId } from '@/lib/constants/stripe-plans'

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
    console.error('[stripe/webhooks] Signature invalide:', err)
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

        if (type === 'loyer') {
          // Paiement immédiat du loyer
          await db
            .from('contracts')
            .update({
              stripe_payment_intent_id: paymentIntentId,
              stripe_payment_status: 'paid',
            })
            .eq('id', contractId)
        } else {
          // Pré-autorisation caution (capture manuelle)
          await db
            .from('contracts')
            .update({
              stripe_deposit_payment_intent_id: paymentIntentId,
              stripe_deposit_status: 'held',
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
        // Passer en 'held' seulement si ce n'est pas déjà capturé/libéré
        await db
          .from('contracts')
          .update({
            stripe_deposit_payment_intent_id: pi.id,
            stripe_deposit_status: 'held',
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
          await db
            .from('profiles')
            .update({ stripe_onboarding_complete: true })
            .eq('stripe_account_id', account.id)
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
        break
      }

      // Paiement échoué → passe en past_due
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }
        const subId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : (invoice.subscription as Stripe.Subscription | null | undefined)?.id
        if (!subId) break
        await db.from('profiles').update({
          stripe_subscription_status: 'past_due',
        }).eq('stripe_subscription_id', subId)
        break
      }
    }
  } catch (err) {
    console.error('[stripe/webhooks] Traitement:', err)
  }

  return NextResponse.json({ received: true })
}
