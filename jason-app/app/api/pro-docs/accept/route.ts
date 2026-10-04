// Acceptation en ligne d'un devis d'un pro de l'annuaire (page /doc/<jeton>).
// Garde le nom saisi et la date (pas l'adresse IP), prévient le pro par e-mail
// et dans ses notifications.

import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { rateLimit, getClientIp } from '@/lib/security/rate-limit'
import { parisToday } from '@/lib/stripe/deposit-window'
import { createNotification } from '@/lib/notifications/create'
import { sendQuoteAcceptedToPro } from '@/lib/email/pro-documents'
import { eur } from '@/lib/pros/billing'
import { BILLING_BASE } from '@/lib/pros/billing-server'

export async function POST(req: Request) {
  const rl = await rateLimit('proDocAccept', getClientIp(req), 10, 60 * 60 * 1000)
  if (!rl.allowed) return NextResponse.json({ error: 'Trop de tentatives, réessaie plus tard.' }, { status: 429 })

  const body = await req.json().catch(() => ({})) as { token?: string; name?: string }
  const token = String(body.token ?? '')
  const name = String(body.name ?? '').trim().slice(0, 120)
  if (!/^[0-9a-f]{32,64}$/i.test(token) || name.length < 2) return NextResponse.json({ error: 'Indique ton nom pour accepter.' }, { status: 400 })

  const db = getServiceClient()
  const today = parisToday()
  const { data: doc } = await db.from('pro_documents')
    .select('id, kind, status, number, client_name, total_ttc, valid_until, owner_kind, owner_id')
    .eq('public_token', token).maybeSingle()
  if (!doc || doc.kind !== 'devis') return NextResponse.json({ error: 'Devis introuvable.' }, { status: 404 })
  if (doc.status === 'accepte') return NextResponse.json({ ok: true })
  if (doc.status !== 'envoye') return NextResponse.json({ error: 'Ce devis ne peut plus être accepté en ligne.' }, { status: 409 })
  if (doc.valid_until && doc.valid_until < today) return NextResponse.json({ error: 'Ce devis a expiré : demande une nouvelle version à ton prestataire.' }, { status: 409 })

  const { data: updated } = await db.from('pro_documents')
    .update({ status: 'accepte', accepted_at: new Date().toISOString(), accepted_name: name })
    .eq('id', doc.id).eq('status', 'envoye').select('id').maybeSingle()
  if (!updated) return NextResponse.json({ error: 'Acceptation impossible, réessaie.' }, { status: 409 })

  // Prévenir le pro (best-effort)
  const table = doc.owner_kind === 'cleaner' ? 'cleaners' : 'photographers'
  const { data: pro } = await db.from(table).select('user_id, email').eq('id', doc.owner_id).maybeSingle()
  const href = `${BILLING_BASE[doc.owner_kind === 'cleaner' ? 'cleaner' : 'photographer']}/${doc.id}`
  await Promise.allSettled([
    pro?.email ? sendQuoteAcceptedToPro({ to: pro.email, doc: { ...doc, total_ttc: Number(doc.total_ttc), accepted_name: name }, href: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'}${href}` }) : Promise.resolve(),
    pro?.user_id ? createNotification({
      recipientId: pro.user_id, category: 'system', type: 'devis_accepte',
      title: `Devis ${doc.number} accepté`, body: `${doc.client_name} a accepté ton devis de ${eur(Number(doc.total_ttc))}.`,
      ctaLabel: 'Ouvrir le devis', ctaHref: href, severity: 'success', dedupKey: `devis_accepte:${doc.id}`,
    }) : Promise.resolve(),
  ])
  return NextResponse.json({ ok: true })
}
