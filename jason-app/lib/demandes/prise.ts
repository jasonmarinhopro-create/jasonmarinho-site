// Bouton « Je m'en occupe » de l'e-mail envoyé au pro (26/10/2026, Jason :
// Mamoone répondait par e-mail sans toucher à l'app, la demande restait
// « Pas encore » dans le QG et partait à d'autres pros au bout de 48 h).
// Le jeton est la ligne de Demandes reçues signée par HMAC (comme
// member-unsub.ts), sans table ni connexion. Module pur, testé.
import { createHmac, timingSafeEqual } from 'crypto'

export type PriseMetier = 'photographe' | 'menage' | 'depannage'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CODE: Record<PriseMetier, string> = { photographe: 'p', menage: 'm', depannage: 'd' }

function sign(metier: PriseMetier, contactId: string, secret: string) {
  return createHmac('sha256', secret).update(`demande-prise:${metier}:${contactId}`).digest('base64url').slice(0, 22)
}

export function priseToken(metier: PriseMetier, contactId: string, secret: string): string {
  return `${CODE[metier]}.${contactId}.${sign(metier, contactId, secret)}`
}

/** Métier et ligne de Demandes reçues si le jeton est valable, sinon null. */
export function verifyPriseToken(token: string, secret: string): { metier: PriseMetier; contactId: string } | null {
  const [code, contactId, sig] = String(token || '').split('.')
  const metier = code === 'p' ? 'photographe' : code === 'm' ? 'menage' : code === 'd' ? 'depannage' : null
  if (!metier || !contactId || !sig || !UUID.test(contactId) || !secret) return null
  const expected = Buffer.from(sign(metier, contactId, secret))
  const got = Buffer.from(sig)
  return expected.length === got.length && timingSafeEqual(expected, got) ? { metier, contactId } : null
}
