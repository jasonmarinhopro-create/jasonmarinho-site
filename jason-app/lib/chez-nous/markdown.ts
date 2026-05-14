/**
 * Parser markdown léger (no external lib).
 * Supporte : **gras**, *italique*, [texte](url), sauts de ligne, autolinks.
 * Échappe le HTML pour éviter les XSS.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const URL_RE = /\bhttps?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)]/g

/**
 * Retire les marqueurs markdown pour produire un aperçu propre.
 */
export function stripMarkdown(input: string): string {
  if (!input) return ''
  return input
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')  // [texte](url) → texte
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')                      // **gras** → gras
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1$2')          // *italique* → italique
    .replace(/\n+/g, ' ')                                     // sauts de ligne → espaces
    .trim()
}

/**
 * Convertit un texte brut markdown en HTML safe.
 */
export function renderMarkdown(input: string): string {
  if (!input) return ''

  // 1) Échapper le HTML brut d'entrée
  let s = escapeHtml(input)

  // 2) Liens markdown [texte](url), exécuté avant les autolinks
  //    On encode l'URL pour éviter d'injecter du JS via javascript:
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, text: string, url: string) => {
    const safeUrl = url.replace(/"/g, '%22')
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer nofollow" class="cn-link">${text}</a>`
  })

  // 3) Autolinks (URLs nues hors balises), on évite de re-linker ce qui est déjà dans <a ...>
  //    Approche simple : pas d'autolinks à l'intérieur de tags HTML déjà créés.
  //    On split sur les <a ...> pour ne traiter que ce qui est en dehors.
  s = s.split(/(<a[^>]*>.*?<\/a>)/gi).map(chunk => {
    if (chunk.startsWith('<a')) return chunk
    return chunk.replace(URL_RE, url => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer nofollow" class="cn-link">${url}</a>`
    })
  }).join('')

  // 4) Gras **texte**
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')

  // 5) Italique *texte* (en évitant les ** déjà traités)
  s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')

  // 6) Mention @tousleshôtes → pill broadcast spéciale (pas un lien car
  //    il n'y a pas d'utilisateur 'tousleshôtes'). Traitée AVANT les
  //    mentions individuelles pour éviter le mismatch. Note : l'envoi
  //    de notif est restreint aux admins côté serveur, mais on rend la
  //    pill pour tout le monde car c'est juste du texte.
  //    Le 'ô' est échappé en HTML entity à l'étape 1 → on match donc
  //    'ô' en clair dans le texte échappé.
  s = s.split(/(<a[^>]*>.*?<\/a>)/gi).map(chunk => {
    if (chunk.startsWith('<a')) return chunk
    return chunk.replace(/(^|[^a-zA-Z0-9_-])@tousleshôtes\b/gi,
      '$1<span class="cn-mention cn-mention-all">@tousleshôtes</span>')
  }).join('')

  // 7) Mentions @pseudo individuelles → lien vers le profil membre.
  //    Pas de XSS car le pseudo a été échappé en étape 1. On limite à
  //    [a-zA-Z0-9_-]{2,30} pour matcher exactement ce que le parser
  //    serveur considère comme une mention valide.
  //    On ne re-link pas ce qui est déjà dans un <a> ou <span>.
  s = s.split(/(<(?:a|span)[^>]*>.*?<\/(?:a|span)>)/gi).map(chunk => {
    if (chunk.startsWith('<a') || chunk.startsWith('<span')) return chunk
    return chunk.replace(/(^|[^a-zA-Z0-9_-])@([a-zA-Z0-9_-]{2,30})/g,
      '$1<a href="/dashboard/chez-nous/membre-pseudo/$2" class="cn-mention">@$2</a>')
  }).join('')

  // 7) Sauts de ligne → <br/>
  s = s.replace(/\n/g, '<br/>')

  return s
}
