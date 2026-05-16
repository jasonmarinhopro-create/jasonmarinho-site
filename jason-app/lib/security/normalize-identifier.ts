// Normalisation des identifiants (téléphone / email) pour la table
// reported_guests. Centralisé pour garantir cohérence entre saisie user
// et corrections admin.

/**
 * Normalise un numéro de téléphone :
 * - Supprime espaces, tirets, points, parenthèses, slashes
 * - Conserve le + initial s'il existe
 * - Convertit les préfixes 00XX en +XX
 * - Si commence par 0 (France) → +33 + reste
 * - Garde uniquement les chiffres + le + initial
 */
export function normalizePhone(raw: string): string {
  if (!raw) return ''
  let s = String(raw).trim()
  // Préserve le + s'il est au début
  const hasPlus = s.startsWith('+')
  // Vire tout ce qui n'est pas un chiffre
  s = s.replace(/[^\d]/g, '')
  if (!s) return ''
  // 00XX → +XX
  if (s.startsWith('00')) {
    return `+${s.slice(2)}`
  }
  if (hasPlus) {
    return `+${s}`
  }
  // 0... (FR) → +33...
  if (s.startsWith('0') && s.length >= 9) {
    return `+33${s.slice(1)}`
  }
  // Numéro sans préfixe : on le laisse tel quel sans préjuger du pays
  return s
}

/**
 * Normalise un email : trim + lowercase + vire trailing dot.
 */
export function normalizeEmail(raw: string): string {
  if (!raw) return ''
  return String(raw).trim().toLowerCase().replace(/\.+$/, '')
}

/**
 * Normalise selon le type d'identifiant. Fallback = trim + suppression
 * des points/espaces en fin de chaîne.
 */
export function normalizeIdentifier(raw: string, type: 'phone' | 'email' | string): string {
  if (type === 'phone') return normalizePhone(raw)
  if (type === 'email') return normalizeEmail(raw)
  return String(raw ?? '').trim().replace(/[\s.]+$/, '')
}
