// Idées & feuille de route (13/10/2026, décision de Jason) : avant, la
// feuille de route était réservée aux « contributeurs » qui avaient payé une
// contribution sur /soutenir (page retirée : elle faisait « appel aux dons »
// à côté d'offres payantes). Maintenant ouverte à tous les membres, dans
// chacun des 4 espaces. Règles pures, testées.

export type IdeeEspace = 'hote' | 'photographe' | 'menage' | 'investisseur'
export type IdeeStatus = 'suggestion' | 'planned' | 'in_progress' | 'done'

export const ESPACES: IdeeEspace[] = ['hote', 'photographe', 'menage', 'investisseur']

export const ESPACE_LABEL: Record<IdeeEspace, string> = {
  hote: 'Hôtes',
  photographe: 'Photographes',
  menage: 'Équipes de ménage',
  investisseur: 'Investisseurs',
}

/** Adresse de la page Idées dans chaque espace (le menu de l'espace reste affiché) */
export const IDEES_HREF: Record<IdeeEspace, string> = {
  hote: '/dashboard/idees',
  photographe: '/dashboard/ma-fiche-photographe/idees',
  menage: '/dashboard/ma-fiche-menage/idees',
  investisseur: '/dashboard/investir/idees',
}

export const STATUS_ORDER: IdeeStatus[] = ['suggestion', 'planned', 'in_progress', 'done']

/** Couleurs de la marque (jamais de bleu ni de violet) */
export const STATUS_META: Record<IdeeStatus, { label: string; short: string; color: string }> = {
  suggestion:  { label: 'Proposée', short: 'Proposées', color: '#6E5446' },
  planned:     { label: 'Prévue',   short: 'Prévues',   color: '#B7791F' },
  in_progress: { label: 'En cours', short: 'En cours',  color: '#B83A7C' },
  done:        { label: 'Livrée',   short: 'Livrées',   color: '#2F7D52' },
}

export const TITLE_MIN = 5
export const TITLE_MAX = 120
export const DESC_MAX = 600
export const COMMENT_MAX = 400
export const REPONSE_MAX = 280

export function isEspace(v: unknown): v is IdeeEspace {
  return typeof v === 'string' && (ESPACES as string[]).includes(v)
}

export function isStatus(v: unknown): v is IdeeStatus {
  return typeof v === 'string' && (STATUS_ORDER as string[]).includes(v)
}

const squash = (s: string) => s.replace(/\s+/g, ' ').trim()

/** Vérifie et nettoie une idée proposée. Renvoie le texte prêt à enregistrer ou un message d'erreur clair. */
export function cleanIdea(title: unknown, description: unknown):
  { ok: true; title: string; description: string | null } | { ok: false; error: string } {
  const t = squash(typeof title === 'string' ? title : '')
  if (t.length < TITLE_MIN) return { ok: false, error: `Décris ton idée en ${TITLE_MIN} caractères au moins.` }
  if (t.length > TITLE_MAX) return { ok: false, error: `Le titre est trop long (${TITLE_MAX} caractères au plus).` }
  const d = typeof description === 'string' ? description.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim() : ''
  if (d.length > DESC_MAX) return { ok: false, error: `Les détails sont trop longs (${DESC_MAX} caractères au plus).` }
  return { ok: true, title: t, description: d || null }
}

/** Nettoie un commentaire (null si vide ou trop long) */
export function cleanComment(content: unknown): string | null {
  const c = typeof content === 'string' ? content.replace(/\s+/g, ' ').trim() : ''
  if (!c || c.length > COMMENT_MAX) return null
  return c
}

/**
 * Nom affiché aux autres membres : prénom + initiale du nom (« Camille S. »).
 * Le nom complet n'est jamais envoyé au navigateur des autres membres.
 */
export function shortName(full: string | null | undefined): string {
  const parts = (full ?? '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  if (!parts.length) return 'Un membre'
  const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  const last = parts.length > 1 ? parts[parts.length - 1] : ''
  return last ? `${first} ${last.charAt(0).toUpperCase()}.` : first
}

export interface IdeeLike {
  id: string
  status: IdeeStatus
  espace: IdeeEspace | null
  created_at: string
  status_changed_at?: string | null
}

/** Une idée sans espace (anciennes idées) concerne tout le monde */
export function concerns(item: Pick<IdeeLike, 'espace'>, filtre: IdeeEspace | 'tous'): boolean {
  return filtre === 'tous' || item.espace === null || item.espace === filtre
}

export type IdeeTri = 'populaires' | 'recentes'

/** Populaires : plus de votes d'abord, puis la plus récente. Récentes : date seule. */
export function sortIdeas<T extends IdeeLike>(items: T[], votes: Record<string, number>, tri: IdeeTri): T[] {
  const time = (i: T) => new Date(i.created_at).getTime()
  return items.slice().sort((a, b) => {
    if (tri === 'populaires') {
      const d = (votes[b.id] ?? 0) - (votes[a.id] ?? 0)
      if (d !== 0) return d
    }
    return time(b) - time(a)
  })
}

/** Nombre d'idées par statut */
export function countByStatus(items: Pick<IdeeLike, 'status'>[]): Record<IdeeStatus, number> {
  const c: Record<IdeeStatus, number> = { suggestion: 0, planned: 0, in_progress: 0, done: 0 }
  for (const i of items) c[i.status] += 1
  return c
}

/** Dernières idées livrées, de la plus récente à la plus ancienne */
export function lastDelivered<T extends IdeeLike>(items: T[], n = 4): T[] {
  const when = (i: T) => new Date(i.status_changed_at ?? i.created_at).getTime()
  return items.filter(i => i.status === 'done').sort((a, b) => when(b) - when(a)).slice(0, n)
}

/** Texte de la notification envoyée à l'auteur quand le statut de son idée change */
export function statusNotification(status: IdeeStatus, title: string): { title: string; body: string } | null {
  const t = title.length > 80 ? `${title.slice(0, 79)}…` : title
  if (status === 'planned') return { title: 'Ton idée est prévue', body: `« ${t} » fait partie des prochaines choses à construire.` }
  if (status === 'in_progress') return { title: 'Ton idée est en cours', body: `« ${t} » est en train d'être construite.` }
  if (status === 'done') return { title: 'Ton idée est livrée', body: `« ${t} » est disponible dans l'app. Merci pour la proposition.` }
  return null
}
