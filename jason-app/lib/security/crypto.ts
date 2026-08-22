// Chiffrement des tokens OAuth réseaux sociaux avant écriture en base
// (jamais de token en clair dans social_accounts). AES-256-GCM, clé dédiée
// SOCIAL_TOKENS_ENCRYPTION_KEY — séparée de SUPABASE_SERVICE_ROLE_KEY.
//
// Génération de la clé : `openssl rand -base64 32`

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGO = 'aes-256-gcm'

function getKey(): Buffer {
  const b64 = process.env.SOCIAL_TOKENS_ENCRYPTION_KEY
  if (!b64) throw new Error('SOCIAL_TOKENS_ENCRYPTION_KEY manquante')
  const key = Buffer.from(b64, 'base64')
  if (key.length !== 32) throw new Error('SOCIAL_TOKENS_ENCRYPTION_KEY doit faire 32 octets (base64)')
  return key
}

// Format stocké : iv.authTag.ciphertext, chaque segment en base64.
export function encryptToken(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, getKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv, authTag, ciphertext].map(b => b.toString('base64')).join('.')
}

export function decryptToken(stored: string): string {
  const [ivB64, authTagB64, ciphertextB64] = stored.split('.')
  if (!ivB64 || !authTagB64 || !ciphertextB64) throw new Error('Token chiffré malformé')
  const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'))
  const plain = Buffer.concat([decipher.update(Buffer.from(ciphertextB64, 'base64')), decipher.final()])
  return plain.toString('utf8')
}
