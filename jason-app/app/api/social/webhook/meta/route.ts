// Webhook Meta (Facebook Page "feed" + Instagram "comments") — reçoit
// chaque nouveau commentaire sur les posts publiés, pour déclencher une
// réponse privée automatique quand il contient un mot-clé configuré
// (cf. lib/social/comment-triggers.ts). À configurer côté Meta App :
// Produit "Webhooks" → URL de rappel = cette route, jeton de vérification =
// META_WEBHOOK_VERIFY_TOKEN, puis abonner la Page (champ "feed") et le
// compte Instagram Business (champ "comments").

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { handleIncomingComment } from '@/lib/social/comment-triggers'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const log = logger('api/social/webhook/meta')

// Handshake de vérification — Meta appelle cette route une fois lors de la
// configuration du webhook et attend le hub.challenge tel quel en réponse.
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode')
  const token = req.nextUrl.searchParams.get('hub.verify_token')
  const challenge = req.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && challenge && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

function isValidSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET
  if (!appSecret || !signatureHeader) return false
  const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex')
  const expectedBuf = Buffer.from(expected)
  const actualBuf = Buffer.from(signatureHeader)
  if (expectedBuf.length !== actualBuf.length) return false
  return timingSafeEqual(expectedBuf, actualBuf)
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  if (!isValidSignature(rawBody, req.headers.get('x-hub-signature-256'))) {
    return new NextResponse('Invalid signature', { status: 401 })
  }

  let payload: {
    object?: string
    entry?: Array<{
      id: string
      changes?: Array<{ field: string; value: Record<string, unknown> }>
    }>
  }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new NextResponse('Bad payload', { status: 400 })
  }

  // Répond vite — Meta réémet l'événement si l'accusé de réception (200)
  // n'arrive pas sous quelques secondes. Le traitement d'un commentaire ne
  // doit jamais retarder la réponse aux autres.
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      try {
        if (payload.object === 'page' && change.field === 'feed') {
          const v = change.value as { item?: string; verb?: string; comment_id?: string; post_id?: string; message?: string; sender_id?: string; sender_name?: string }
          if (v.item === 'comment' && v.verb === 'add' && v.comment_id) {
            await handleIncomingComment({
              platform: 'facebook',
              commentId: v.comment_id,
              postId: v.post_id ?? null,
              commentText: v.message ?? '',
              commenterName: v.sender_name ?? null,
              senderId: v.sender_id ?? null,
              pageId: entry.id,
            })
          }
        } else if (payload.object === 'instagram' && change.field === 'comments') {
          const v = change.value as { id?: string; text?: string; from?: { id?: string; username?: string }; media?: { id?: string } }
          if (v.id) {
            await handleIncomingComment({
              platform: 'instagram',
              commentId: v.id,
              postId: v.media?.id ?? null,
              commentText: v.text ?? '',
              commenterName: v.from?.username ?? null,
              senderId: v.from?.id ?? null,
              pageId: entry.id,
            })
          }
        }
      } catch (err) {
        log.error('traitement commentaire échoué', { err: err instanceof Error ? err.message : String(err) })
      }
    }
  }

  return NextResponse.json({ received: true })
}
