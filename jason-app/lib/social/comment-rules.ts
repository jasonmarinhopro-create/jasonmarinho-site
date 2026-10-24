// Règles pures des réponses aux commentaires (24/10/2026), testées.

/** Commentaire écrit par la Page ou le compte Instagram eux-mêmes (nos propres réponses). */
export function isOwnComment(
  c: { authorId: string | null; authorName: string | null },
  account: { external_account_id: string; display_name: string | null },
): boolean {
  if (c.authorId && c.authorId === account.external_account_id) return true
  const own = (account.display_name ?? '').replace(/^@/, '').toLowerCase()
  return !!own && (c.authorName ?? '').replace(/^@/, '').toLowerCase() === own
}

/**
 * Texte d'une réponse prêt à publier, ou null s'il enfreint les règles de la
 * marque : vide, trop long, tiret cadratin, emoji, lien hors de nos domaines.
 */
export function cleanReply(raw: string | null | undefined): string | null {
  const text = (raw ?? '').replace(/\s+\n/g, '\n').trim()
  if (!text || text.length > 600) return null
  if (/—/.test(text)) return null
  if (/\p{Extended_Pictographic}/u.test(text)) return null
  const links = text.match(/https?:\/\/[^\s)]+/g) ?? []
  if (links.some(l => !/^https:\/\/(app\.)?jasonmarinho\.com(\/|$)/.test(l))) return null
  return text
}
