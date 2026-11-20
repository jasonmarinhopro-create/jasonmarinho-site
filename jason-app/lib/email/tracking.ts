// Suivi des e-mails de la plateforme (20/11/2026). Fonctions pures, testées
// (tracking.test.ts) : catégories, tag Resend posé à l'envoi, liens suivis
// (clics anonymes par bouton), lecture et vérification du webhook Resend.
// Règles de confidentialité : voir la migration 20261120_196_suivi_emails.sql.

export type EmailAudience = 'membres' | 'voyageurs' | 'pros' | 'toi'

/** Catégories (valeur du tag Resend « categorie ») : lettres, chiffres et tirets seulement */
export const EMAIL_CATEGORIES = {
  compte: { label: 'Compte (confirmation, mot de passe)', audience: 'membres' },
  'acces-membre': { label: 'Accès créé ou Driing confirmé', audience: 'membres' },
  'paiement-hote': { label: 'Loyer et caution reçus', audience: 'membres' },
  'contrat-hote': { label: 'Contrat signé (hôte)', audience: 'membres' },
  checkin: { label: 'Check-in rempli', audience: 'membres' },
  'entre-hotes': { label: 'Entre Hôtes', audience: 'membres' },
  'demande-hote': { label: 'Trouver un pro (hôte)', audience: 'membres' },
  voyageur: { label: 'Contrats et caution (voyageur)', audience: 'voyageurs' },
  'demande-pro': { label: 'Demandes reçues (pro)', audience: 'pros' },
  'bienvenue-pro': { label: 'Bienvenue dans l’annuaire', audience: 'pros' },
  'bilan-pro': { label: 'Bilan mensuel', audience: 'pros' },
  devis: { label: 'Devis des pros', audience: 'pros' },
  admin: { label: 'Alertes pour toi', audience: 'toi' },
  autre: { label: 'Autres', audience: 'toi' },
} as const satisfies Record<string, { label: string; audience: EmailAudience }>

export type EmailCategory = keyof typeof EMAIL_CATEGORIES

export const isEmailCategory = (v: string): v is EmailCategory => Object.prototype.hasOwnProperty.call(EMAIL_CATEGORIES, v)

/** Tag Resend à joindre à l'envoi */
export const emailTags = (c: EmailCategory) => [{ name: 'categorie', value: c }]

/** Catégories dont l'adresse n'est jamais gardée (clients des hôtes et des pros) */
const PRIVATE: ReadonlySet<EmailCategory> = new Set(['voyageur', 'devis'])

/** Adresse gardée pour un rejet : masquée pour un voyageur ou un client d'un pro */
export function keptRecipient(c: EmailCategory, to: string | null | undefined): string | null {
  if (!to) return null
  if (PRIVATE.has(c)) return 'adresse masquée (client d’un membre)'
  return to.trim().toLowerCase().slice(0, 200)
}

// ─── Clics ────────────────────────────────────────────────────────────

const APP = (process.env.NEXT_PUBLIC_APP_URL || 'https://app.jasonmarinho.com').replace(/\/$/, '')
const ALLOWED_HOSTS = new Set(['jasonmarinho.com', 'www.jasonmarinho.com', 'app.jasonmarinho.com'])

/** Seules nos adresses sont redirigées (pas de redirection ouverte) */
export function isAllowedTarget(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && ALLOWED_HOSTS.has(u.hostname)
  } catch {
    return false
  }
}

/** Nom court du bouton, tiré de son libellé (« Voir mes statistiques » → voir-mes-statistiques) */
export function buttonKey(label: string): string {
  return label
    .replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .split('-').slice(0, 6).join('-').slice(0, 60) || 'lien'
}

export function clickUrl(c: EmailCategory, bouton: string, target: string): string {
  return `${APP}/api/e/c?c=${encodeURIComponent(c)}&b=${encodeURIComponent(bouton)}&u=${encodeURIComponent(target)}`
}

/**
 * Fait passer les liens vers nos sites par la redirection de comptage.
 * Ni lien de connexion (jeton), ni mailto, ni site extérieur : laissés tels quels.
 */
export function trackLinks(html: string, c: EmailCategory): string {
  return html.replace(/<a ([^>]*?)href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/gi, (all, before: string, href: string, after: string, label: string) => {
    const target = href.replace(/&amp;/g, '&')
    // Lien porteur d'un jeton (connexion, contrat, devis, suivi) : jamais dans une autre adresse ni dans les journaux
    if (!isAllowedTarget(target) || /\/auth\/|[?&](t|token|hashed_token)=|[A-Za-z0-9_]{20,}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i.test(target) || target.startsWith(`${APP}/api/e/`)) return all
    return `<a ${before}href="${clickUrl(c, buttonKey(label), target).replace(/&/g, '&amp;')}"${after}>${label}</a>`
  })
}
