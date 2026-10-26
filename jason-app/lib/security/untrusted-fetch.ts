// Lecture d'une adresse fournie par un tiers (flux iCal des hôtes, sites des
// prospects) : refuse les réponses compressées en Brotli (26/10/2026). Faille
// d'exécution de code dans le décodeur Brotli de Node (CVE-2026-111497,
// corrigée en 22.23.4, 24.22.1 et 26.12.1) ; Vercel faisait encore tourner
// Node 24.21.0, et fetch décode tout seul le corps d'une réponse « br ».
// Les en-têtes arrivent avant le corps : on coupe avant tout décodage.

/** Encodages acceptés pour une adresse non maîtrisée (jamais br) */
export const UNTRUSTED_ACCEPT_ENCODING = 'gzip, deflate'

/** true si la réponse est encodée en Brotli (à refuser sans lire le corps) */
export function isBrotli(contentEncoding: string | null): boolean {
  return !!contentEncoding && contentEncoding.toLowerCase().split(',').some(e => e.trim() === 'br')
}

/** Corps texte d'une réponse non maîtrisée, ou erreur si elle est en Brotli */
export async function untrustedText(res: Response): Promise<string> {
  if (isBrotli(res.headers.get('content-encoding'))) {
    try { await res.body?.cancel() } catch { /* déjà fermé */ }
    throw new Error('Réponse compressée en Brotli refusée (sécurité)')
  }
  return res.text()
}
