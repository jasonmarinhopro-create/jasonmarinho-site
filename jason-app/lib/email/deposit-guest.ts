// E-mail au voyageur quand l'hôte décide de la caution (05/10/2026) :
// « caution libérée, rien n'a été prélevé » ou « X € retenus, motif ».
// Avant, le voyageur n'était prévenu de rien et devait surveiller son compte.
// Contenu dans deposit-guest-content.ts (pur, testé) ; ici, l'envoi.

import 'server-only'
import { Resend } from 'resend'
import { buildDepositGuestEmail, type DepositGuestEmail } from './deposit-guest-content'
import { logger } from '@/lib/logger'

export type { DepositGuestEmail }

const log = logger('email/deposit-guest')
const FROM = 'contrats@jasonmarinho.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

export async function sendDepositOutcomeToGuest(e: DepositGuestEmail): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key || !e.to) return
  const { subject, html, fromName } = buildDepositGuestEmail(e, APP_URL)
  try {
    const r = new Resend(key)
    const { error } = await r.emails.send({
      from: `${fromName} <${FROM}>`,
      to: e.to,
      ...(e.hostEmail ? { replyTo: e.hostEmail } : {}),
      subject,
      html,
    })
    if (error) log.error('envoi', { err: error.message })
  } catch (err) {
    log.error('envoi', { err: (err as Error).message })
  }
}
