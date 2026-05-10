import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/client'
import Stripe from 'stripe'
import { logger } from '@/lib/logger'
import { dispatchStripeEvent } from '@/lib/stripe/dispatch'
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

  // Idempotence : Stripe garantit "at-least-once delivery", on saute si déjà traité
  const { error: insertErr } = await db
    .from('stripe_webhook_events')
    .insert({ event_id: event.id, type: event.type })
  if (insertErr && insertErr.code === '23505') {
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    await dispatchStripeEvent(event, db)
  } catch (err) {
    // Libère le lock pour que Stripe retry automatiquement (jusqu'à 3 jours).
    // Sinon le replay manuel via /api/stripe/sync reste possible.
    await db.from('stripe_webhook_events').delete().eq('event_id', event.id)
    log.error('unexpected', { err: String(err), event_id: event.id, type: event.type })
    return NextResponse.json({ error: 'dispatch failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
