// Détection des actualités en double « reformulées ».
//
// La veille quotidienne (routine Claude → data/actualites-queue → API
// /api/actualites/insert) reformulait chaque jour la même information avec un
// titre légèrement différent (« Airbnb passe à 15,5 %… », « Airbnb bascule à
// 15,5 %… ») : 22 fois la même actu en un mois, que la dédup sur le titre
// exact laissait passer. Ici : comparaison par mots significatifs (titre et
// résumé) + chiffres clés partagés, calibrée sur les 54 actualités réellement
// publiées entre le 28 août et le 26 septembre 2026 (0 faux positif).

export interface ActuLike {
  title: string
  summary: string
  source_url?: string | null
}

const STOP = new Set(
  ('le la les l de des du d a au aux en et ou pour sur ton tes ta ce ces cet cette dans par avec est sont un une '
    + 'qu que qui ne pas plus se sa son ses leur leurs il elle on tu te t toi y ca vs tout tous mais si comme '
    + 'entre sans sous chez depuis des jusqu').split(' '),
)

/** Mots significatifs : minuscules, sans accents, sans mots vides, pluriel simple retiré. */
export function tokens(s: string): Set<string> {
  return new Set(
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/(\d)[,.](\d)/g, '$1_$2')          // 15,5 et 15.5 → 15_5
      .replace(/(\d)\s+(\d{3})\b/g, '$1$2')        // 83 600 → 83600
      .split(/[^a-z0-9_]+/)
      .filter(w => w && !STOP.has(w) && (w.length > 2 || /\d/.test(w)))
      .map(w => (/\d/.test(w) ? w : w.replace(/(?<=.{3})[sx]$/, ''))),
  )
}

function inter(a: Set<string>, b: Set<string>): number {
  let n = 0
  for (const x of a) if (b.has(x)) n++
  return n
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const i = inter(a, b)
  return i / (a.size + b.size - i || 1)
}

/** Chiffres clés (hors années) : 15_5, 13, 83600… */
function keyNumbers(s: Set<string>): Set<string> {
  return new Set([...s].filter(w => /\d/.test(w) && !/^20\d\d$/.test(w)))
}

export function normalizeSourceUrl(u: string | null | undefined): string | null {
  if (!u) return null
  try {
    const url = new URL(u)
    return (url.hostname.replace(/^www\./, '') + url.pathname.replace(/\/+$/, '')).toLowerCase()
  } catch {
    return null
  }
}

export function isSimilarActualite(a: ActuLike, b: ActuLike): boolean {
  const ta = tokens(a.title), tb = tokens(b.title)
  const sa = tokens(a.summary), sb = tokens(b.summary)
  const t = jaccard(ta, tb)
  const s = jaccard(sa, sb)
  const sharedNums = inter(keyNumbers(new Set([...ta, ...sa])), keyNumbers(new Set([...tb, ...sb])))
  return t >= 0.5 || s >= 0.3 || (t >= 0.25 && s >= 0.2) || (sharedNums >= 2 && (t >= 0.2 || s >= 0.18))
}

/** Première actualité existante qui traite visiblement du même sujet, sinon null. */
export function findSimilarActualite<T extends ActuLike>(candidate: ActuLike, existing: T[]): T | null {
  const src = normalizeSourceUrl(candidate.source_url)
  for (const e of existing) {
    if (e.title.trim().toLowerCase() === candidate.title.trim().toLowerCase()) return e
    if (isSimilarActualite(candidate, e)) return e
  }
  // Même page source : même article reformulé. Vérifié après la similarité
  // pour qu'un article « bilan » cité par deux actus distinctes ne bloque pas
  // à tort : on exige en plus un minimum de mots communs dans le titre.
  if (src) {
    for (const e of existing) {
      if (normalizeSourceUrl(e.source_url) === src && jaccard(tokens(candidate.title), tokens(e.title)) >= 0.15) return e
    }
  }
  return null
}
