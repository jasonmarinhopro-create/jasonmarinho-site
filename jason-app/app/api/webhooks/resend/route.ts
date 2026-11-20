// Événements Resend (20/11/2026) : envoyé, remis, rejeté, signalé comme spam,
// retardé. Signature Svix vérifiée avec RESEND_WEBHOOK_SECRET. Un événement
// déjà reçu (même svix-id) n'est pas recompté. Voir lib/email/webhook.ts.
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { eventRow, verifyResendWebhook } from '@/lib/email/webhook'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
const log = logger('api/webhooks/resend')

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'not configured' }, { status: 503 })
  const body = await req.text()
  const id = req.headers.get('svix-id')
  const ok = verifyResendWebhook({ secret, id, timestamp: req.headers.get('svix-timestamp'), signature: req.headers.get('svix-signature'), body })
  if (!ok) return NextResponse.json({ error: 'bad signature' }, { status: 401 })
  let payload: unknown
  try { payload = JSON.parse(body) } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }) }
  const row = eventRow(id as string, payload)
  if (!row) return NextResponse.json({ ok: true, ignored: true })
  const { error } = await getServiceClient().from('email_events').upsert(row, { onConflict: 'id', ignoreDuplicates: true })
  if (error) {
    // 500 : Resend renverra l'événement plus tard (table absente, base en panne)
    log.error('insert', { msg: error.message.slice(0, 200) })
    return NextResponse.json({ error: 'store failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
