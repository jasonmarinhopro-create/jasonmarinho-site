import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { dispatchStripeEvent } from '@/lib/stripe/dispatch'
import { logger } from '@/lib/logger'
const log = logger('api/stripe/sync')

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

// POST /api/stripe/sync
// Replay manuel d'un event Stripe quand un webhook a été manqué.
// Body : { event_id: 'evt_...' } — visible dans le dashboard Stripe.
// Auth : admin uniquement.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const eventId = typeof body?.event_id === 'string' ? body.event_id.trim() : ''
  if (!eventId.startsWith('evt_')) {
    return NextResponse.json({ error: 'event_id manquant ou invalide.' }, { status: 400 })
  }

  let event
  try {
    event = await stripe.events.retrieve(eventId)
  } catch (err) {
    log.error('retrieveFailed', { err: String(err), eventId })
    return NextResponse.json({ error: 'Event introuvable côté Stripe.' }, { status: 404 })
  }

  const db = serviceClient()
  // Force le replay : on supprime le lock d'idempotence avant dispatch
  await db.from('stripe_webhook_events').delete().eq('event_id', event.id)

  try {
    await dispatchStripeEvent(event, db)
  } catch (err) {
    log.error('dispatchFailed', { err: String(err), event_id: event.id, type: event.type })
    return NextResponse.json({ error: 'Échec du dispatch — voir logs.' }, { status: 500 })
  }

  // Re-pose le lock
  await db.from('stripe_webhook_events').insert({ event_id: event.id, type: event.type })

  return NextResponse.json({ ok: true, event_id: event.id, type: event.type })
}
