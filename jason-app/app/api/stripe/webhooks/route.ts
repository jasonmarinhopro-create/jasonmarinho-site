import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/client'
import Stripe from 'stripe'

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

      // Paiement capturé (bailleur a encaissé)
      case 'payment_intent.amount_capturable_updated': {
        const pi = event.data.object as Stripe.PaymentIntent
        const contractId = pi.metadata?.contract_id
        if (!contractId) break
        // Mise à jour si besoin (déjà géré côté API capture)
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
    }
  } catch (err) {
    console.error('[stripe/webhooks] Traitement:', err)
  }

  return NextResponse.json({ received: true })
}
