// Catalogue partenaires du dashboard (Entre Hôtes → Partenaires), lu depuis
// la même source que la page publique /partenaires : scripts/data/partenaires.mjs,
// copiée en JSON par `node scripts/build-partenaires.mjs` (projet Vercel séparé).
// Ne pas éditer partenaires-data.json à la main.
import data from './partenaires-data.json'

export type PartnerBadge = 'affilie' | 'parrainage' | 'membre' | 'fondateur'

export interface PartnerLink { label: string; href: string; sponsored?: boolean; externe?: boolean }

export interface PartnerEntry {
  nom: string
  mono: string
  couleur: string
  cats: string[]
  desc: string
  liens: PartnerLink[]
  badge?: PartnerBadge
  offre?: string
}

export const PARTNER_CATEGORIES = data.categories as Array<{ id: string; label: string; icon: string; mots?: string[] }>
export const PARTNERS = data.outils as PartnerEntry[]

export const BADGE_LABEL: Record<PartnerBadge, string> = {
  affilie: 'Lien affilié',
  parrainage: 'Parrainage',
  membre: 'Réduction membre',
  fondateur: 'Co-fondé par Jason',
}

/** Identifiant stable d'un outil (votes « M'intéresse », table tool_interests). */
export function partnerSlug(nom: string): string {
  return nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** Offres (affiliation, parrainage, réduction membre), hors Driing présenté à part. */
export const PARTNER_OFFERS = PARTNERS.filter(p => p.badge && p.badge !== 'fondateur')
/** Outils référencés sans rémunération. */
export const PARTNER_CATALOG = PARTNERS.filter(p => !p.badge)

// ─── Recherche (17/11/2026, comme la page publique /partenaires) ──────────
const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2019']/g, ' ')

/** Texte cherché d'un outil : nom, accroche, description, catégories et leurs mots courants. */
export function partnerSearchText(p: PartnerEntry, cats = PARTNER_CATEGORIES): string {
  const cs = cats.filter(c => p.cats.includes(c.id))
  return norm([p.nom, p.offre ?? '', p.desc, ...cs.map(c => c.label), ...cs.flatMap(c => c.mots ?? [])].join(' '))
}

/** Outils dont le texte contient tous les mots de la recherche (mots d'une lettre ignorés). */
export function searchPartners<T extends PartnerEntry>(list: T[], query: string, cats = PARTNER_CATEGORIES): T[] {
  const words = norm(query).split(/\s+/).filter(w => w.length > 1)
  if (!words.length) return list
  return list.filter(p => { const t = partnerSearchText(p, cats); return words.every(w => t.includes(w)) })
}
