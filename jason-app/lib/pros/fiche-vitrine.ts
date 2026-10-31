// Fiche des pros façon site vitrine (12/10/2026) : photos, formules, villes
// couvertes, déroulé en 3 étapes. Règles pures, testées (fiche-vitrine.test.ts),
// partagées par les deux « Ma fiche » (photographe, ménage).
//
// Offres gratuites (demande de Jason : « ne dépasse jamais les versions
// gratuites ») : Supabase Free = 1 Go de fichiers pour tout le compte et 5 Go
// de sortie par mois (+ 5 Go servis depuis le cache). Les photos sont donc
// compressées dans le navigateur (grande image 1600 px, vignette 640 px en
// JPEG), le bucket refuse plus de 600 Ko par fichier (migration 131), et
// l'envoi est refusé bien avant la limite (`storageDecision`).

export type ProMetier = 'photographe' | 'menage' | 'depannage'

export const PHOTOS_MAX = 6
export const PHOTO_FULL_SIDE = 1600
export const PHOTO_THUMB_SIDE = 640
export const PHOTO_FULL_MAX_BYTES = 450_000
export const PHOTO_THUMB_MAX_BYTES = 120_000

export const FREE_STORAGE_BYTES = 1024 ** 3 // 1 Go (Supabase Free, tout le compte)
/** Au-delà, plus aucune nouvelle photo de fiche (marge pour les photos de ménage, les images des questions…) */
export const STORAGE_STOP_TOTAL_BYTES = 750 * 1024 ** 2
/** Part réservée aux photos des fiches */
export const PORTFOLIO_STOP_BYTES = 350 * 1024 ** 2
export const PORTFOLIO_BUCKET = 'pro-portfolio'

/** Sortie mensuelle Supabase Free (hors cache) et part que l'on s'autorise pour les photos des fiches */
export const FREE_EGRESS_BYTES = 5 * 1024 ** 3
export const PHOTO_EGRESS_BUDGET_BYTES = 2 * 1024 ** 3

export interface StorageUsageRow { bucket_id: string; bytes: number; objects?: number }

/** Peut-on accepter `incoming` octets de photos de fiches ? */
export function storageDecision(rows: StorageUsageRow[] | null, incoming: number): { ok: true } | { ok: false; reason: string } {
  // Mesure indisponible : on refuse (mieux vaut bloquer un envoi que dépasser)
  if (!rows) return { ok: false, reason: 'Envoi de photos indisponible pour le moment. Réessaie dans quelques minutes.' }
  const total = rows.reduce((s, r) => s + Number(r.bytes || 0), 0)
  const portfolio = rows.filter(r => r.bucket_id === PORTFOLIO_BUCKET).reduce((s, r) => s + Number(r.bytes || 0), 0)
  if (total + incoming > STORAGE_STOP_TOTAL_BYTES || portfolio + incoming > PORTFOLIO_STOP_BYTES) {
    return { ok: false, reason: 'Les photos des fiches ont atteint la place prévue. Jason a été prévenu, réessaie dans quelques jours.' }
  }
  return { ok: true }
}

/** Estimation de la sortie mensuelle due aux photos : vues des fiches × vignettes affichées */
export function photoEgressEstimate(views: number, photosShown: number, thumbBytes = 70_000): number {
  return Math.max(0, views) * Math.max(0, Math.min(PHOTOS_MAX, photosShown)) * thumbBytes
}

// ── Chemins des photos ──────────────────────────────────────────────
// Nouvelle forme : `<proId>/v2-<uuid>.jpg` (grande) + `<proId>/v2-<uuid>-t.jpg` (vignette).
// Les anciennes photos (`<proId>/<uuid>.jpg`, 2000 px, avant le 05/10/2026)
// ne sont pas affichées : trop lourdes, à remplacer.
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const V2_RE = new RegExp(`^(${UUID})/v2-(${UUID})\\.jpg$`, 'i')

export function newPhotoPath(proId: string, id: string): string {
  return `${proId}/v2-${id}.jpg`
}
export function thumbPath(path: string): string {
  return path.replace(/\.jpg$/i, '-t.jpg')
}
export function isPhotoPath(path: unknown, proId: string): path is string {
  if (typeof path !== 'string') return false
  const m = V2_RE.exec(path)
  return !!m && m[1].toLowerCase() === proId.toLowerCase()
}
export function isLegacyPhoto(path: string): boolean {
  return !V2_RE.test(path)
}

// ── Formules, villes, déroulé ───────────────────────────────────────
/** `vedette` : la formule mise en avant (« La plus demandée », une seule, atelier 27/10/2026) */
export interface Formule { nom: string; prix: number | null; detail: string; vedette?: true }
export interface Etape { titre: string; texte: string }

export const FORMULES_MAX = 3
export const VILLES_MAX = 10
/** Longueurs proposées dans Ma fiche (courtes pour éviter les pavés, surtout au téléphone) ; le serveur tolère un peu plus pour les textes déjà saisis */
export const FORMULE_DETAIL_MAX = 120
export const ETAPE_TITRE_MAX = 40
export const ETAPE_TEXTE_MAX = 110

const txt = (v: unknown, max: number) => (typeof v === 'string' ? v : '').replace(/\s+/g, ' ').trim().slice(0, max)

export function cleanFormules(raw: unknown): Formule[] {
  if (!Array.isArray(raw)) return []
  const out: Formule[] = []
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue
    const o = r as Record<string, unknown>
    const nom = txt(o.nom, 40)
    const detail = txt(o.detail, 160)
    const n = typeof o.prix === 'number' ? o.prix : Number(String(o.prix ?? '').replace(',', '.').replace(/[^\d.]/g, ''))
    const prix = Number.isFinite(n) && n > 0 ? Math.min(Math.round(n), 100_000) : null
    if (!nom) continue
    const f: Formule = { nom, prix, detail }
    if (o.vedette === true && !out.some(x => x.vedette)) f.vedette = true
    out.push(f)
    if (out.length >= FORMULES_MAX) break
  }
  return out
}

const PARTICULES = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'sur', 'sous', 'en', 'et', 'aux', 'lès'])

/** Nom de ville tout en majuscules ou tout en minuscules remis en forme
 *  (« LEVALLOIS » → « Levallois », « neuilly-sur-seine » → « Neuilly-sur-Seine ») ;
 *  une saisie déjà en casse mixte est gardée telle quelle (26/10/2026, Jason :
 *  « Levallois écrit en majuscules, c'est moche et pas sérieux »). */
export function villeCasse(v: string): string {
  const name = v.trim()
  if (!name || (/[a-zà-ÿ]/.test(name) && /[A-ZÀ-Þ]/.test(name))) return name
  let i = 0
  return name.toLowerCase().replace(/[^\s\-]+/g, w => {
    const first = i++ === 0
    if (!first && PARTICULES.has(w)) return w
    const m = /^([dl])(['’])(.+)$/.exec(w)
    if (m) return (first ? m[1].toUpperCase() : m[1]) + m[2] + m[3].charAt(0).toUpperCase() + m[3].slice(1)
    return w.charAt(0).toUpperCase() + w.slice(1)
  })
}

export function cleanVilles(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(/[,;\n]/) : []
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of list) {
    const name = villeCasse(txt(v, 40))
    const key = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (!name || seen.has(key)) continue
    seen.add(key)
    out.push(name)
    if (out.length >= VILLES_MAX) break
  }
  return out
}

export const DEFAULT_DEROULE: Record<ProMetier, Etape[]> = {
  photographe: [
    { titre: 'Tu m’envoies ta demande', texte: 'Ton logement, la ville et tes dates : je te réponds avec un devis.' },
    { titre: 'Le shooting', texte: 'Je photographie le logement préparé, à la meilleure lumière.' },
    { titre: 'La livraison', texte: 'Tu reçois tes photos retouchées, prêtes pour Airbnb et Booking.' },
  ],
  menage: [
    { titre: 'Tu m’envoies ta demande', texte: 'Ton logement, sa taille et le rythme des réservations : je te propose un tarif.' },
    { titre: 'Le premier passage', texte: 'On fait le point sur les clés, le linge et tes consignes.' },
    { titre: 'Les ménages entre deux voyageurs', texte: 'Je suis ton planning Airbnb et Booking et je te préviens quand c’est prêt.' },
  ],
  depannage: [
    { titre: 'Tu m’envoies ta demande', texte: 'Le souci, le logement et l’accès : je te dis quand je peux passer et à quel prix.' },
    { titre: 'L’intervention', texte: 'Je viens entre deux voyageurs, avec la boîte à clés si tu n’es pas là.' },
    { titre: 'Le compte rendu', texte: 'Tu reçois une photo après l’intervention et ma facture.' },
  ],
}

/** 3 étapes ou rien (rien = étapes par défaut du métier sur la fiche) */
export function cleanDeroule(raw: unknown, metier: ProMetier): Etape[] {
  if (!Array.isArray(raw)) return []
  const etapes = raw.slice(0, 3).map(r => {
    const o = (r && typeof r === 'object' ? r : {}) as Record<string, unknown>
    return { titre: txt(o.titre, 40), texte: txt(o.texte, 140) }
  })
  if (etapes.length !== 3 || etapes.some(e => !e.titre)) return []
  const same = etapes.every((e, i) => e.titre === DEFAULT_DEROULE[metier][i].titre && e.texte === DEFAULT_DEROULE[metier][i].texte)
  return same ? [] : etapes
}
