import { getServiceClient as serviceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import Stripe from 'stripe'
import { logger } from '@/lib/logger'
import { dispatchStripeEvent } from '@/lib/stripe/dispatch'
const log = logger('api/stripe/webhooks')

// POST /api/stripe/webhooks
// Reçoit les événements Stripe Connect (pour tous les comptes connectés)
export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  // Deux destinations Stripe peuvent viser cette route, chacune avec son
  // secret : « Ton compte » (abonnements, STRIPE_WEBHOOK_SECRET) et « Comptes
  // connectés » (loyers et cautions payés sur le compte des hôtes,
  // STRIPE_CONNECT_WEBHOOK_SECRET). Avant le 04/10/2026, seule la première
  // existait : un loyer payé n'était jamais confirmé par webhook.
  const secrets = [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_CONNECT_WEBHOOK_SECRET].filter((s): s is string => !!s)
  if (!sig || !secrets.length) {
    return NextResponse.json({ error: 'Signature manquante.' }, { status: 400 })
  }

  let event: Stripe.Event | null = null
  let lastErr: unknown = null
  for (const secret of secrets) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, secret)
      break
    } catch (err) { lastErr = err }
  }
  if (!event) {
    log.error('invalidSignature', { err: String(lastErr) })
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 })
  }

  log.info('event reçu', { event_id: event.id, type: event.type })

  const db = serviceClient()

  // Idempotence : Stripe garantit "at-least-once delivery", on saute si déjà traité
  const { error: insertErr } = await db
    .from('stripe_webhook_events')
    .insert({ event_id: event.id, type: event.type })
  if (insertErr && insertErr.code === '23505') {
    log.info('event dupliqué, dispatch sauté', { event_id: event.id, type: event.type })
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
