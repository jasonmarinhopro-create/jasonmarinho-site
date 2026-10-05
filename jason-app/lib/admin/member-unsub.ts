// Jeton de désinscription des e-mails aux membres (05/10/2026) : l'id du
// compte signé par HMAC, sans table ni migration. Le secret reste côté
// serveur (member-mail-send.ts) ; ce module est pur pour être testé.
import { createHmac, timingSafeEqual } from 'crypto'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function sign(userId: string, secret: string) {
  return createHmac('sha256', secret).update(`member-unsub:${userId}`).digest('base64url').slice(0, 22)
}

export function memberUnsubToken(userId: string, secret: string): string {
  return `${userId}.${sign(userId, secret)}`
}

/** Id du compte si le jeton est valable, sinon null. */
export function verifyMemberUnsubToken(token: string, secret: string): string | null {
  const [userId, sig] = token.split('.')
  if (!userId || !sig || !UUID.test(userId) || !secret) return null
  const expected = Buffer.from(sign(userId, secret))
  const got = Buffer.from(sig)
  return expected.length === got.length && timingSafeEqual(expected, got) ? userId : null
}
