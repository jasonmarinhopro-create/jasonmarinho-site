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

/**
 * Règle plus large, réservée à l'affichage : même catégorie ET (titres ou
 * résumés assez proches). Sur les 54 actus réelles, elle regroupe aussi les
 * « Été 2026 : … » reformulés que isSimilarActualite laisse passer, sans
 * rapprocher deux sujets différents (seul rapprochement « inattendu » : deux
 * actus sur la même proposition européenne du 9 septembre, un vrai doublon).
 * Pas utilisée pour refuser une publication (l'API reste sur la règle stricte).
 */
export function isSameTopicLoose(a: ActuLike & { category?: string }, b: ActuLike & { category?: string }): boolean {
  if (!a.category || a.category !== b.category) return false
  return jaccard(tokens(a.title), tokens(b.title)) >= 0.25 || jaccard(tokens(a.summary), tokens(b.summary)) >= 0.2
}

/**
 * Filet de sécurité à l'affichage : ne garde qu'une actualité par sujet.
 * La liste doit arriver déjà triée par priorité (épinglées puis plus récentes
 * d'abord) : la première de chaque sujet est gardée, les suivantes sont
 * masquées si elles sont similaires ET publiées à moins de `windowDays` jours
 * d'une actu gardée (un sujet qui revient des mois plus tard reste visible).
 * Indépendant du nettoyage en base (migration 20260927_111) : les doublons ne
 * s'affichent plus même si la migration n'a pas été appliquée.
 */
export function dedupeActualites<T extends ActuLike & { category?: string; published_at?: string | null; created_at?: string | null }>(
  list: T[],
  windowDays = 60,
): T[] {
  const kept: T[] = []
  const ts = (a: T) => new Date(a.published_at ?? a.created_at ?? 0).getTime()
  const windowMs = windowDays * 86_400_000
  for (const item of list) {
    const t = ts(item)
    const dup = kept.some(k => Math.abs(ts(k) - t) <= windowMs && (
      k.title.trim().toLowerCase() === item.title.trim().toLowerCase()
      || isSimilarActualite(k, item)
      || isSameTopicLoose(k, item)
    ))
    if (!dup) kept.push(item)
  }
  return kept
}
