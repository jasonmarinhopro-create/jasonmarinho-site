// Demandes d'hôtes en chiffres publics (17/10/2026, Jason : « être
// transparent sur la page des chiffres, même si c'est zéro, que tout soit
// branché, même pour les futures villes »). Deux portes d'entrée :
// - le formulaire « Trouver un pro » (table demandes_hotes) ;
// - le bouton « Contacter » d'une fiche (photographer_contacts /
//   cleaner_contacts), sans les lignes créées par une demande du formulaire
//   (source_url …/trouver-un-pro#demande-…), déjà comptées une fois.
// Jamais publiés : nom, e-mail, téléphone, message, logement, jour exact
// (le mois seulement). Ville = page de ville (citySlugOf) : une ville qui
// reçoit sa page plus tard est rattachée toute seule ; sinon « Autre ville ».
// Tests et fiches d'exemple écartés. Pur et testé (demandes.test.ts).

export type DemandeMetier = 'photographe' | 'menage'
export type DemandeSource = 'formulaire' | 'fiche'
/** ouverte : un pro l'a ouverte ou y a répondu ; transmise : envoyée, pas encore ouverte ; sans_pro : attend un pro dans la zone */
export type DemandeEtat = 'ouverte' | 'transmise' | 'sans_pro'

export interface DemandeItem {
  at: string
  metier: DemandeMetier
  slug: string | null
  source: DemandeSource
  etat: DemandeEtat
}

export interface DemandeCity {
  slug: string | null
  label: string
  total: number
  photographe: number
  menage: number
  /** Fiches en ligne de la ville (null : inconnu, ou « Autre ville ») */
  pros: { photographe: number; menage: number } | null
}

export interface PublicDemandes {
  total: number
  /** Mois de la première demande comptée (AAAA-MM), null sans demande */
  since: string | null
  byMetier: Record<DemandeMetier, number>
  bySource: Record<DemandeSource, number>
  byEtat: Record<DemandeEtat, number>
  cities: DemandeCity[]
  months: Array<{ month: string; count: number; current: boolean }>
  fil: Array<{ month: string; metier: DemandeMetier; slug: string | null; label: string; source: DemandeSource; etat: DemandeEtat }>
  /** Écartées, et pourquoi : messages de test, fiches d'exemple (affiché pour la transparence) */
  excluded: { test: number; exemple: number }
}

export const FIL_MAX = 12
export const MONTHS_SHOWN = 6
export const OTHER_CITY = 'Autre ville'

/** Ligne de Demandes reçues créée par le formulaire « Trouver un pro » (comptée avec la demande) */
export function fromTrouverUnPro(sourceUrl: string | null | undefined): boolean {
  return /\/trouver-un-pro(#|$|\?)/.test(sourceUrl ?? '')
}

/** Adresse de test : comptes admin et adresses de jasonmarinho.com */
export function isTestEmail(email: string | null | undefined, adminEmails: Set<string>): boolean {
  const e = (email ?? '').trim().toLowerCase()
  if (!e) return false
  return adminEmails.has(e) || e.endsWith('@jasonmarinho.com')
}

/** État public d'un statut de Demandes reçues (nouvelle = pas encore ouverte) */
export function etatOfContact(status: string | null | undefined): DemandeEtat {
  return status && status !== 'nouvelle' ? 'ouverte' : 'transmise'
}

/** État public d'une demande du formulaire, d'après les statuts des pros qui l'ont reçue */
export function etatOfDemande(status: string | null | undefined, contactStatuses: Array<string | null | undefined>): DemandeEtat {
  if (contactStatuses.some(s => etatOfContact(s) === 'ouverte')) return 'ouverte'
  if (contactStatuses.length) return 'transmise'
  return status === 'sans_pro' || status === 'envoyee' || status === 'elargie' ? 'sans_pro' : 'transmise'
}

/** Mois à l'heure de Paris (AAAA-MM) */
export function parisMonth(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 7)
  const parts = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit' }).formatToParts(d)
  const y = parts.find(p => p.type === 'year')?.value ?? iso.slice(0, 4)
  const m = parts.find(p => p.type === 'month')?.value ?? iso.slice(5, 7)
  return `${y}-${m}`
}

function prevMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}

export function buildPublicDemandes(
  items: DemandeItem[],
  opts: {
    today: string
    labelOf: (slug: string) => string
    pros?: { photographe: Map<string, number>; menage: Map<string, number> } | null
    excluded?: { test: number; exemple: number }
  },
): PublicDemandes {
  const sorted = [...items].sort((a, b) => b.at.localeCompare(a.at))
  const byMetier = { photographe: 0, menage: 0 }
  const bySource = { formulaire: 0, fiche: 0 }
  const byEtat = { ouverte: 0, transmise: 0, sans_pro: 0 }
  const cityMap = new Map<string, DemandeCity>()
  const perMonth = new Map<string, number>()
  for (const it of sorted) {
    byMetier[it.metier]++
    bySource[it.source]++
    byEtat[it.etat]++
    const key = it.slug ?? ''
    let c = cityMap.get(key)
    if (!c) {
      c = {
        slug: it.slug,
        label: it.slug ? opts.labelOf(it.slug) : OTHER_CITY,
        total: 0, photographe: 0, menage: 0,
        pros: it.slug && opts.pros ? { photographe: opts.pros.photographe.get(it.slug) ?? 0, menage: opts.pros.menage.get(it.slug) ?? 0 } : null,
      }
      cityMap.set(key, c)
    }
    c.total++
    c[it.metier]++
    const m = parisMonth(it.at)
    perMonth.set(m, (perMonth.get(m) ?? 0) + 1)
  }
  const current = opts.today.slice(0, 7)
  const months: PublicDemandes['months'] = []
  let m = current
  for (let i = 0; i < MONTHS_SHOWN; i++) {
    months.unshift({ month: m, count: perMonth.get(m) ?? 0, current: i === 0 })
    m = prevMonth(m)
  }
  const cities = [...cityMap.values()].sort((a, b) =>
    (a.slug === null ? 1 : 0) - (b.slug === null ? 1 : 0) || b.total - a.total || a.label.localeCompare(b.label, 'fr'))
  return {
    total: sorted.length,
    since: sorted.length ? parisMonth(sorted[sorted.length - 1].at) : null,
    byMetier, bySource, byEtat, cities, months,
    excluded: opts.excluded ?? { test: 0, exemple: 0 },
    fil: sorted.slice(0, FIL_MAX).map(it => ({
      month: parisMonth(it.at),
      metier: it.metier,
      slug: it.slug,
      label: it.slug ? opts.labelOf(it.slug) : OTHER_CITY,
      source: it.source,
      etat: it.etat,
    })),
  }
}

/** Demandes d'une ville (recherche « Ta ville ») : zéro compris */
export function demandesOfCity(d: PublicDemandes, slug: string): { total: number; photographe: number; menage: number } {
  const c = d.cities.find(x => x.slug === slug)
  return { total: c?.total ?? 0, photographe: c?.photographe ?? 0, menage: c?.menage ?? 0 }
}
