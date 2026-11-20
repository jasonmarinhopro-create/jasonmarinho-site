// Webhook Resend (signé par Svix) : vérification et ligne à enregistrer.
// Fonctions pures, testées (tracking.test.ts). Route : app/api/webhooks/resend.
import { createHmac, timingSafeEqual } from 'node:crypto'
import { isEmailCategory, keptRecipient, type EmailCategory } from './tracking'

/** Vérifie la signature Svix : HMAC SHA-256 de « id.horodatage.corps », 5 minutes de tolérance */
export function verifyResendWebhook(o: { secret: string; id: string | null; timestamp: string | null; signature: string | null; body: string; now?: number }): boolean {
  if (!o.id || !o.timestamp || !o.signature || !o.secret) return false
  const ts = Number(o.timestamp)
  if (!Number.isFinite(ts) || Math.abs((o.now ?? Date.now()) / 1000 - ts) > 300) return false
  const key = Buffer.from(o.secret.replace(/^whsec_/, ''), 'base64')
  const expected = createHmac('sha256', key).update(`${o.id}.${o.timestamp}.${o.body}`).digest()
  return o.signature.split(' ').some(part => {
    const [v, sig] = part.split(',')
    if (v !== 'v1' || !sig) return false
    const got = Buffer.from(sig, 'base64')
    return got.length === expected.length && timingSafeEqual(got, expected)
  })
}

const TYPES: Record<string, string> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.delivery_delayed': 'delivery_delayed',
  'email.failed': 'failed',
}

export interface EmailEventRow { id: string; email_id: string | null; type: string; categorie: EmailCategory; destinataire: string | null; raison: string | null }

/** Ligne à enregistrer pour un événement du webhook, null s'il ne nous intéresse pas (ouverture, clic Resend…) */
export function eventRow(svixId: string, payload: unknown): EmailEventRow | null {
  const p = payload as { type?: string; data?: { email_id?: string; to?: string[] | string; tags?: Record<string, string> | Array<{ name: string; value: string }>; bounce?: { message?: string; subType?: string; type?: string }; failed?: { reason?: string } } }
  const type = TYPES[p?.type ?? '']
  if (!type) return null
  const d = p.data ?? {}
  const tags = Array.isArray(d.tags) ? Object.fromEntries(d.tags.map(t => [t.name, t.value])) : (d.tags ?? {})
  const cat = typeof tags.categorie === 'string' && isEmailCategory(tags.categorie) ? tags.categorie : 'autre'
  const problem = type === 'bounced' || type === 'complained' || type === 'failed'
  const to = Array.isArray(d.to) ? d.to[0] : d.to
  const raison = type === 'bounced' ? [d.bounce?.type, d.bounce?.subType, d.bounce?.message].filter(Boolean).join(' · ').slice(0, 300) || null
    : type === 'failed' ? (d.failed?.reason ?? null)
    : type === 'complained' ? 'Signalé comme spam par le destinataire' : null
  return { id: svixId.slice(0, 100), email_id: d.email_id ?? null, type, categorie: cat, destinataire: problem ? keptRecipient(cat, to) : null, raison }
}
