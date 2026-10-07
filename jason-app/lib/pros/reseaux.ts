// Réseaux sociaux et fiche Google d'un pro (07/10/2026, Jason : « que les
// photographes ou équipes de ménage puissent partager leurs réseaux sociaux
// ainsi que leur page Google s'ils le souhaitent, discret sur la fiche »).
// Colonne `reseaux` (jsonb) de photographers / cleaners, migration 125.
// Instagram garde sa colonne historique (instagram_handle).
// Même liste côté site : scripts/lib/pro-reseaux.mjs (test de synchro).
// Pur et testé : reseaux.test.ts.

export type ReseauKey = 'google' | 'facebook' | 'linkedin' | 'tiktok' | 'youtube' | 'pinterest'

export interface ReseauDef {
  key: ReseauKey
  label: string
  /** Domaines acceptés (le domaine lui-même ou un sous-domaine) */
  hosts: string[]
  placeholder: string
  /** Icône Phosphor (classe ph-<icon> sur le site, composant dans l'app) */
  icon: string
}

export const RESEAUX: ReseauDef[] = [
  { key: 'google', label: 'Fiche Google', icon: 'google-logo', placeholder: 'https://maps.app.goo.gl/…',
    hosts: ['google.com', 'google.fr', 'maps.app.goo.gl', 'goo.gl', 'g.page', 'g.co', 'share.google', 'business.site'] },
  { key: 'facebook', label: 'Facebook', icon: 'facebook-logo', placeholder: 'https://www.facebook.com/…', hosts: ['facebook.com', 'fb.com', 'fb.me'] },
  { key: 'linkedin', label: 'LinkedIn', icon: 'linkedin-logo', placeholder: 'https://www.linkedin.com/in/…', hosts: ['linkedin.com', 'lnkd.in'] },
  { key: 'tiktok', label: 'TikTok', icon: 'tiktok-logo', placeholder: '@toncompte ou lien', hosts: ['tiktok.com'] },
  { key: 'youtube', label: 'YouTube', icon: 'youtube-logo', placeholder: 'https://www.youtube.com/@…', hosts: ['youtube.com', 'youtu.be'] },
  { key: 'pinterest', label: 'Pinterest', icon: 'pinterest-logo', placeholder: 'https://www.pinterest.fr/…', hosts: ['pinterest.com', 'pinterest.fr', 'pin.it'] },
]

export type Reseaux = Partial<Record<ReseauKey, string>>

const hostOk = (host: string, hosts: string[]) => hosts.some(h => host === h || host.endsWith(`.${h}`))

/**
 * Lien saisi par le pro → adresse https propre, ou erreur lisible.
 * Vide = null (rien à enregistrer). TikTok et YouTube acceptent « @compte ».
 */
export function normalizeReseau(key: ReseauKey, raw: string | null | undefined): { url: string | null; error?: string } {
  const def = RESEAUX.find(r => r.key === key)
  if (!def) return { url: null, error: 'Réseau inconnu' }
  let v = String(raw ?? '').trim()
  if (!v) return { url: null }
  if (/^@[\w.\-]{2,60}$/.test(v)) {
    if (key === 'tiktok') return { url: `https://www.tiktok.com/${v}` }
    if (key === 'youtube') return { url: `https://www.youtube.com/${v}` }
  }
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`
  let u: URL
  try { u = new URL(v) } catch { return { url: null, error: `${def.label} : lien illisible` } }
  const host = u.hostname.toLowerCase().replace(/^www\./, '')
  if (!hostOk(host, def.hosts)) return { url: null, error: `${def.label} : ce lien ne mène pas à ${def.label}` }
  // Google : uniquement des liens de fiche (Maps, profil d'établissement), pas une recherche
  if (key === 'google' && /^(google\.(com|fr))$/.test(host) && !/^\/(maps|search\?.*kgmid)/.test(u.pathname + u.search)) {
    return { url: null, error: 'Fiche Google : colle le lien « Partager » de ta fiche dans Google Maps' }
  }
  u.protocol = 'https:'
  u.hash = ''
  const out = u.toString()
  if (out.length > 300) return { url: null, error: `${def.label} : lien trop long` }
  return { url: out }
}

/** Valeurs du formulaire → objet à enregistrer (seulement les liens valides) + erreurs */
export function cleanReseaux(input: Record<string, unknown> | null | undefined): { value: Reseaux; errors: string[] } {
  const value: Reseaux = {}
  const errors: string[] = []
  for (const def of RESEAUX) {
    const res = normalizeReseau(def.key, typeof input?.[def.key] === 'string' ? (input[def.key] as string) : '')
    if (res.error) errors.push(res.error)
    else if (res.url) value[def.key] = res.url
  }
  return { value, errors }
}

/** Lecture tolérante d'une valeur venue de la base */
export function readReseaux(raw: unknown): Reseaux {
  if (!raw || typeof raw !== 'object') return {}
  return cleanReseaux(raw as Record<string, unknown>).value
}
