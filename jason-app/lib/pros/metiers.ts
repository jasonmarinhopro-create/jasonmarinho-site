// Registre des métiers de l'annuaire (31/10/2026, projet « Dépannage et
// maintenance », docs/claude/projet-maintenance.md). Une seule description par
// métier : table, libellés, adresses, Stripe. Un nouveau métier = une entrée
// ici (et son équivalent pour les scripts du site, scripts/lib/metiers.mjs,
// gardé identique par metiers.test.ts). Pas d'accès à l'environnement : les
// noms des variables Stripe sont lus côté serveur par ceux qui en ont besoin.

export type ProKind = 'photographer' | 'cleaner' | 'depannage'

export interface Metier {
  kind: ProKind
  /** Mot court dans les adresses du site et les paramètres (?as=, demandes) */
  slug: 'photographe' | 'menage' | 'depannage'
  table: 'photographers' | 'cleaners' | 'depannage_pros'
  contactsTable: 'photographer_contacts' | 'cleaner_contacts' | 'depannage_contacts'
  /** Colonne du pro dans sa table de contacts et dans les métadonnées Stripe */
  idColumn: 'photographer_id' | 'cleaner_id' | 'depannage_id'
  /** Libellés */
  nom: string            // « Photographes et vidéastes »
  pro: string            // « photographe »
  pros: string           // « photographes »
  leMetier: string       // « la photographie »
  /** Espace pro dans l'app */
  espace: string         // /dashboard/ma-fiche-photographe
  creer: string          // /dashboard/creer-fiche-photographe
  /** Site */
  annuaire: string       // /annuaires/photographes
  inscription: string    // https://jasonmarinho.com/annuaires/photographes/inscription
  pageVille: (ville: string) => string
  fiche: (slug: string) => string
  /** Variables Stripe (noms) */
  stripeFounder: string
  stripeStandard: string
  /** Ouvert aux inscriptions */
  ouvert: boolean
}

const SITE = 'https://jasonmarinho.com'

export const METIERS: Record<ProKind, Metier> = {
  photographer: {
    kind: 'photographer', slug: 'photographe', table: 'photographers', contactsTable: 'photographer_contacts', idColumn: 'photographer_id',
    nom: 'Photographes et vidéastes', pro: 'photographe', pros: 'photographes', leMetier: 'la photo et la vidéo',
    espace: '/dashboard/ma-fiche-photographe', creer: '/dashboard/creer-fiche-photographe',
    annuaire: '/annuaires/photographes', inscription: `${SITE}/annuaires/photographes/inscription`,
    pageVille: v => `/photographe-lcd-${v}`, fiche: s => `/annuaires/photographes/${s}`,
    stripeFounder: 'STRIPE_PHOTOGRAPHER_FOUNDER_PRICE_ID', stripeStandard: 'STRIPE_PHOTOGRAPHER_STANDARD_PRICE_ID',
    ouvert: true,
  },
  cleaner: {
    kind: 'cleaner', slug: 'menage', table: 'cleaners', contactsTable: 'cleaner_contacts', idColumn: 'cleaner_id',
    nom: 'Équipes de ménage', pro: 'équipe de ménage', pros: 'équipes de ménage', leMetier: 'le ménage',
    espace: '/dashboard/ma-fiche-menage', creer: '/dashboard/creer-fiche-menage',
    annuaire: '/annuaires/menage', inscription: `${SITE}/annuaires/menage/inscription`,
    pageVille: v => `/menage-lcd-${v}`, fiche: s => `/annuaires/menage/${s}`,
    stripeFounder: 'STRIPE_CLEANER_FOUNDER_PRICE_ID', stripeStandard: 'STRIPE_CLEANER_STANDARD_PRICE_ID',
    ouvert: true,
  },
  depannage: {
    kind: 'depannage', slug: 'depannage', table: 'depannage_pros', contactsTable: 'depannage_contacts', idColumn: 'depannage_id',
    nom: 'Dépannage et maintenance', pro: 'pro du dépannage', pros: 'pros du dépannage', leMetier: 'le dépannage',
    espace: '/dashboard/ma-fiche-depannage', creer: '/dashboard/creer-fiche-depannage',
    annuaire: '/annuaires/depannage', inscription: `${SITE}/annuaires/depannage/inscription`,
    pageVille: v => `/depannage-lcd-${v}`, fiche: s => `/annuaires/depannage/${s}`,
    stripeFounder: 'STRIPE_DEPANNAGE_FOUNDER_PRICE_ID', stripeStandard: 'STRIPE_DEPANNAGE_STANDARD_PRICE_ID',
    // Ouvert le 31/10/2026 (feu vert de Jason)
    ouvert: true,
  },
}

/** Spécialités d'un pro du dépannage (plusieurs possibles) */
export const SPECIALITES_DEPANNAGE = [
  { id: 'electricite', label: 'Électricité' },
  { id: 'plomberie', label: 'Plomberie' },
  { id: 'chauffage', label: 'Chauffage et climatisation' },
  { id: 'serrurerie', label: 'Serrurerie' },
  { id: 'multiservice', label: 'Multiservice et petits travaux' },
  { id: 'montage', label: 'Montage de meubles' },
  { id: 'vitrerie', label: 'Vitrerie' },
  { id: 'electromenager', label: 'Électroménager' },
  { id: 'exterieur', label: 'Entretien extérieur (jardin, piscine)' },
] as const

export const KINDS = Object.keys(METIERS) as ProKind[]

export function metierParSlug(slug: string | null | undefined): Metier | null {
  return KINDS.map(k => METIERS[k]).find(m => m.slug === slug) ?? null
}

/** Fiche pro désignée par les métadonnées Stripe (photographer_id, cleaner_id, depannage_id) */
export function proFromMetadata(meta: Record<string, string> | null | undefined): { kind: ProKind; id: string } | null {
  for (const k of KINDS) {
    const id = meta?.[METIERS[k].idColumn]
    if (id) return { kind: k, id }
  }
  return null
}

export function isProKind(v: unknown): v is ProKind {
  return typeof v === 'string' && (KINDS as string[]).includes(v)
}
