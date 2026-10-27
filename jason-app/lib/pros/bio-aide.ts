// Coup de pouce pour la présentation des pros (atelier, étape 3, 27/10/2026).
// Repère un début « crié » en majuscules (« PHOTOGRAPHE IMMOBILIER… », fiche
// de Thierry) et le remet en minuscules, liste ce qu'un hôte aime y lire, et
// montre ce qui s'affiche avant « Lire la suite » (fiche v3 : ~4 lignes). Testé.

/** Sigles courts gardés tels quels (LCD, TVA, IDF, 3D…) */
const SIGLE_MAX = 3

const UPPER_WORD = /^[A-ZÀ-ÖØ-Þ0-9'’\-]+$/
const hasLetter = (w: string) => /[A-ZÀ-ÖØ-Þ]/.test(w)

function words(text: string): string[] {
  return text.split(/(\s+)/)
}

/** Premier passage en majuscules d'au moins 2 mots (ou un mot de 8 lettres et plus), sinon null */
export function majusculesCriardes(text: string): string | null {
  const parts = text.split(/\s+/).filter(Boolean)
  let run: string[] = []
  const flush = () => {
    const letters = run.join('').replace(/[^A-ZÀ-ÖØ-Þ]/g, '').length
    return (run.length >= 2 && letters >= 8) || (run.length === 1 && letters >= 8) ? run.join(' ') : null
  }
  for (const w of parts) {
    const clean = w.replace(/[.,;:!?()«»"]/g, '')
    if (clean && hasLetter(clean) && UPPER_WORD.test(clean) && clean.replace(/[^A-ZÀ-ÖØ-Þ]/g, '').length > SIGLE_MAX) {
      run.push(clean)
    } else {
      const found = flush()
      if (found) return found
      run = []
    }
  }
  return flush()
}

/** Mots en majuscules remis en minuscules (majuscule gardée en début de phrase), sigles courts gardés */
export function adoucirMajuscules(text: string): string {
  let sentenceStart = true
  return words(text).map(tok => {
    if (/^\s+$/.test(tok) || !tok) return tok
    const core = tok.replace(/[.,;:!?()«»"]/g, '')
    const letters = core.replace(/[^A-ZÀ-ÖØ-Þa-zà-öø-ÿ]/g, '')
    let out = tok
    if (letters.length > SIGLE_MAX && hasLetter(core) && UPPER_WORD.test(core)) {
      const low = tok.toLowerCase()
      out = sentenceStart ? low.replace(/[a-zà-öø-ÿ]/, c => c.toUpperCase()) : low
    }
    if (/[a-zA-ZÀ-ÿ0-9]/.test(tok)) sentenceStart = /[.!?]["»]?$/.test(tok)
    return out
  }).join('')
}

export interface BioRepere { key: string; label: string; ok: boolean }

/** Ce qu'un hôte aime trouver dans une présentation */
export function bioReperes(text: string, ville: string): BioRepere[] {
  const t = text.toLowerCase()
  const v = ville.trim().toLowerCase()
  return [
    { key: 'quoi', label: 'Ce que tu fais', ok: text.trim().length >= 60 },
    { key: 'ou', label: 'Où tu interviens', ok: (!!v && t.includes(v)) || /\b(région|département|alentours|autour de|km)\b/.test(t) },
    { key: 'delai', label: 'Ton délai', ok: /\b(sous|en)\s+\d+\s*(h|heures?|jours?)\b|\bdélai|\blivr|\b24\s?h|\b48\s?h|\bjour même\b/.test(t) },
    { key: 'depuis', label: 'Depuis quand', ok: /\bdepuis\b|\bans d|expérience|\b(19|20)\d\d\b/.test(t) },
  ]
}

/** Ce qui s'affiche avant « Lire la suite » (environ 4 lignes, coupé au mot) */
export function apercuBio(text: string, max = 260): { visible: string; coupe: boolean } {
  const t = text.trim()
  if (t.length <= max) return { visible: t, coupe: false }
  const cut = t.slice(0, max)
  const at = cut.lastIndexOf(' ')
  return { visible: `${cut.slice(0, at > max * 0.6 ? at : max).trim()}…`, coupe: true }
}
