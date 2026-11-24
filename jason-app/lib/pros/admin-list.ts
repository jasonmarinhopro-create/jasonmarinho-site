// Liste admin des pros (24/11/2026, Jason : « distinguer les pros des hôtes …
// les fiches carré »). Une seule page /dashboard/admin/pros pour les 3 métiers :
// chaque fiche ramenée à la même forme, puis filtrée et triée ici (calcul pur,
// testé dans admin-list.test.ts). Rien des demandes reçues ni du carnet
// clients d'un pro : seulement les compteurs de la fiche.
import { isUnpaidFiche } from '@/lib/pros/paid'
import { isPaidPro, proAnnualPrice } from '@/lib/admin/revenue'
import { metierLabel } from '@/lib/pros/visuel'
import { SPECIALITES_DEPANNAGE, type ProKind } from '@/lib/pros/metiers'

export type ProEtat = 'active' | 'pending_payment' | 'hidden' | 'cancelled'

export interface AdminPro {
  id: string
  kind: ProKind
  name: string
  fullName: string
  email: string | null
  ville: string
  villes: number
  tier: string
  etat: ProEtat
  unpaid: boolean
  paid: boolean
  annual: number
  slug: string | null
  createdAt: string
  updatedAt: string | null
  views: number
  contacts: number
  clicks: number
  photo: string | null
  detail: string
  tarif: string
  subStatus: string | null
}

/** Colonnes lues dans chaque table (communes + propres au métier) */
export const COMMON_COLUMNS = 'id, user_id, full_name, pseudo, email, ville, villes_couvertes, tier, status, slug, created_at, updated_at, views_count, contacts_count, instagram_clicks_count, logo_url, portfolio_photos, stripe_subscription_status'
export const EXTRA_COLUMNS: Record<ProKind, string> = {
  photographer: 'metier, specialite, tarif_min, tarif_max, portfolio_clicks_count',
  cleaner: 'equipe_type, logements_geres, tarif_heure, tarif_forfait_min, tarif_forfait_max, site_clicks_count',
  depannage: 'specialites, tarif_heure, site_clicks_count',
}

const EQUIPE: Record<string, string> = { solo: 'Solo', duo: 'Duo', equipe_3_5: 'Équipe de 3 à 5', equipe_6_plus: 'Équipe de 6 et plus' }

const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
const eur = (v: unknown) => `${Math.round(n(v))} €`

/* eslint-disable @typescript-eslint/no-explicit-any */
export function toAdminPro(kind: ProKind, r: Record<string, any>): AdminPro {
  const unpaid = isUnpaidFiche(r as { status: string | null; stripe_subscription_status?: string | null })
  const raw = String(r.status ?? '')
  // Une fiche jamais payée n'est pas « en ligne », même marquée active (20/10/2026)
  const etat: ProEtat = unpaid || raw === 'approved_pending_payment' ? 'pending_payment'
    : raw === 'active' || raw === 'hidden' || raw === 'cancelled' || raw === 'pending_payment' ? raw : 'pending_payment'
  const photos: string[] = Array.isArray(r.portfolio_photos) ? r.portfolio_photos.filter((p: unknown) => typeof p === 'string' && p) : []
  let detail = ''
  let tarif = ''
  if (kind === 'photographer') {
    detail = [metierLabel(r.metier), r.specialite ?? ''].filter(Boolean).join(' · ')
    tarif = r.tarif_min || r.tarif_max ? (r.tarif_min && r.tarif_max ? `${eur(r.tarif_min)} à ${eur(r.tarif_max)}` : `dès ${eur(r.tarif_min || r.tarif_max)}`) : ''
  } else if (kind === 'cleaner') {
    detail = [EQUIPE[String(r.equipe_type ?? '')] ?? '', r.logements_geres ? `${r.logements_geres} logements gérés` : ''].filter(Boolean).join(' · ')
    tarif = r.tarif_forfait_min && r.tarif_forfait_max ? `${eur(r.tarif_forfait_min)} à ${eur(r.tarif_forfait_max)} le ménage` : r.tarif_heure ? `${eur(r.tarif_heure)} de l’heure` : ''
  } else {
    const specs: string[] = Array.isArray(r.specialites) ? r.specialites : []
    detail = specs.map(id => SPECIALITES_DEPANNAGE.find(s => s.id === id)?.label ?? id).join(', ')
    tarif = r.tarif_heure ? `${eur(r.tarif_heure)} de l’heure` : ''
  }
  const paid = isPaidPro({ stripe_subscription_status: r.stripe_subscription_status ?? null })
  return {
    id: String(r.id),
    kind,
    name: String(r.pseudo || r.full_name || 'Sans nom'),
    fullName: String(r.full_name ?? ''),
    email: r.email ?? null,
    ville: String(r.ville ?? ''),
    villes: Array.isArray(r.villes_couvertes) ? r.villes_couvertes.length : 0,
    tier: String(r.tier ?? 'standard'),
    etat,
    unpaid,
    paid,
    annual: paid ? proAnnualPrice(r.tier ?? null) : 0,
    slug: r.slug ?? null,
    createdAt: String(r.created_at ?? ''),
    updatedAt: r.updated_at ?? null,
    views: n(r.views_count),
    contacts: n(r.contacts_count),
    clicks: n(r.instagram_clicks_count) + n(r.site_clicks_count) + n(r.portfolio_clicks_count),
    photo: r.logo_url || photos[0] || null,
    detail,
    tarif,
    subStatus: r.stripe_subscription_status ?? null,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export type ProTri = 'recent' | 'vues' | 'contacts' | 'nom'
export type ProFiltre = 'tous' | ProEtat | 'fondateur'

export function filterPros(list: AdminPro[], { kind, filtre, q }: { kind: ProKind | 'tous'; filtre: ProFiltre; q: string }): AdminPro[] {
  const needle = q.trim().toLowerCase()
  return list.filter(p =>
    (kind === 'tous' || p.kind === kind) &&
    (filtre === 'tous' || (filtre === 'fondateur' ? p.tier === 'fondateur' && p.etat !== 'cancelled' : p.etat === filtre)) &&
    (!needle || [p.name, p.fullName, p.email ?? '', p.ville].some(v => v.toLowerCase().includes(needle))),
  )
}

export function sortPros(list: AdminPro[], tri: ProTri): AdminPro[] {
  const out = [...list]
  const t = (iso: string) => Date.parse(iso) || 0
  if (tri === 'vues') out.sort((a, b) => b.views - a.views || t(b.createdAt) - t(a.createdAt))
  else if (tri === 'contacts') out.sort((a, b) => b.contacts - a.contacts || b.views - a.views)
  else if (tri === 'nom') out.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  else out.sort((a, b) => t(b.createdAt) - t(a.createdAt))
  return out
}

/** Chiffres du haut : en ligne, places Fondateur prises par métier, paiements à finaliser, masquées, revenu */
export function prosKpis(list: AdminPro[], kind: ProKind | 'tous') {
  const scope = list.filter(p => kind === 'tous' || p.kind === kind)
  const founders = (k: ProKind) => list.filter(p => p.kind === k && p.tier === 'fondateur' && p.etat !== 'cancelled').length
  return {
    total: scope.length,
    enLigne: scope.filter(p => p.etat === 'active').length,
    aFinaliser: scope.filter(p => p.etat === 'pending_payment').length,
    masquees: scope.filter(p => p.etat === 'hidden').length,
    resiliees: scope.filter(p => p.etat === 'cancelled').length,
    fondateurs: scope.filter(p => p.tier === 'fondateur' && p.etat !== 'cancelled').length,
    placesFondateur: { photographer: founders('photographer'), cleaner: founders('cleaner'), depannage: founders('depannage') },
    vues: scope.reduce((s, p) => s + p.views, 0),
    contacts: scope.reduce((s, p) => s + p.contacts, 0),
    annual: scope.reduce((s, p) => s + p.annual, 0),
  }
}
