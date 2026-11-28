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

// Une de nos réponses déjà envoyées, revenue dans la relève (28/11/2026) :
// Facebook ne renvoie ni l'auteur ni le parent de la réponse de la Page sans
// permission en plus, isOwnComment ne la voyait pas et la routine la recevait
// comme un nouveau commentaire. On la reconnaît par son identifiant Meta
// (reply_external_id) ou, à défaut, par son texte exact.
const sameText = (a: string, b: string) => a.replace(/\s+/g, ' ').trim() === b.replace(/\s+/g, ' ').trim()
export function isOwnReply(
  c: { commentId: string; text: string },
  sent: { ids: Set<string>; texts: string[] },
): boolean {
  if (sent.ids.has(c.commentId)) return true
  return !!c.text.trim() && sent.texts.some(t => !!t && sameText(t, c.text))
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

/**
 * Meta répond « Object with ID … does not exist » quand un post a été supprimé
 * sur Facebook ou Instagram : rien à corriger chez nous, donc un avertissement
 * et pas une erreur (15/11/2026 : deux posts supprimés remplissaient le
 * journal d'erreurs à chaque passage).
 */
export function isPostGone(message: string): boolean {
  return /does not exist|cannot be loaded due to missing permissions/i.test(message)
}
