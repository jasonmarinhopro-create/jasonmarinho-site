// Demandes d'hôtes dans le QG de l'admin (12/10/2026) : règles pures, testées
// (admin.test.ts). Où en est chaque demande, ce qui reste à traiter, texte à
// partager sans les coordonnées de l'hôte (décision de Jason), pros à qui la
// transmettre à la main.

import { anonymizedNeed, proximite, convientAuBesoin, RELANCE_APRES_H, type Adequation, type DemandeMetier, type ProCandidat } from './rules'
import { readEtablissement } from '@/lib/pros/clienteles'

export interface SentTo { id: string; contact_id?: string | null; round: number; at?: string; manual?: boolean }

export interface DemandeAdminRow {
  id: string
  created_at: string
  metier: DemandeMetier
  /** Type d'hébergement (migration 154) ; absent = logement d'un hôte */
  etablissement?: string | null
  ville: string
  logement: string | null
  quand: string | null
  frequence: string | null
  budget: string | null
  status: 'envoyee' | 'elargie' | 'sans_pro' | 'close'
  sent_to: SentTo[]
  last_round_at: string | null
  admin_seen_at: string | null
  admin_done_at: string | null
}

/** Où en est la demande, vu de l'admin */
export type EtatAdmin = 'traitee' | 'sans_pro' | 'repondue' | 'attente'

export const ETAT_LABELS: Record<EtatAdmin, string> = {
  traitee: 'Traitée',
  sans_pro: 'Sans pro',
  repondue: 'Un pro l’a ouverte',
  attente: 'En attente des pros',
}

/** Un pro a « touché » la demande dans Demandes reçues (statut autre que nouvelle) */
export function proAOuvert(contactId: string | null | undefined, statuts: Map<string, string>): boolean {
  return !!contactId && (statuts.get(contactId) ?? 'nouvelle') !== 'nouvelle'
}

export function etatAdmin(d: Pick<DemandeAdminRow, 'status' | 'sent_to' | 'admin_done_at'>, statuts: Map<string, string>): EtatAdmin {
  if (d.admin_done_at || d.status === 'close') return 'traitee'
  if (d.sent_to.some(s => proAOuvert(s.contact_id, statuts))) return 'repondue'
  if (d.status === 'sans_pro' || d.sent_to.length === 0) return 'sans_pro'
  return 'attente'
}

/**
 * À traiter par l'admin : pas encore vue, sans pro, ou envoyée depuis plus de
 * 48 h sans qu'aucun pro l'ait ouverte (et plus de relance automatique possible).
 */
export function aTraiter(d: DemandeAdminRow, statuts: Map<string, string>, now: Date): boolean {
  const etat = etatAdmin(d, statuts)
  if (etat === 'traitee') return false
  if (!d.admin_seen_at || etat === 'sans_pro') return true
  if (etat === 'attente' && d.last_round_at) return now.getTime() - new Date(d.last_round_at).getTime() > RELANCE_APRES_H * 3_600_000 * 2
  return false
}

const JOIN: Record<DemandeMetier, string> = {
  photographe: 'https://jasonmarinho.com/devenir-photographe-lcd',
  menage: 'https://jasonmarinho.com/devenir-prestataire-menage-lcd',
}

/**
 * Texte à envoyer à quelqu'un hors de l'annuaire (pro de la ville, groupe) :
 * le besoin seul, jamais le nom, l'e-mail, le téléphone ni le message de l'hôte.
 */
export function texteAPartager(d: Pick<DemandeAdminRow, 'metier' | 'ville' | 'logement' | 'quand' | 'frequence' | 'budget' | 'etablissement'>, tu = true): string {
  const besoin = anonymizedNeed({ ...d, etablissement: readEtablissement(d.etablissement) })
  const pro = d.metier === 'photographe' ? 'photographes' : 'équipes de ménage'
  return tu
    ? `Bonjour,\n\n${besoin}\n\nSi ça t’intéresse, crée ta fiche sur l’annuaire de Jason Marinho (sans commission) : les demandes des hôtes de ta ville arrivent directement aux ${pro} inscrits.\n${JOIN[d.metier]}`
    : `Bonjour,\n\n${besoin}\n\nSi cela vous intéresse, créez votre fiche sur l’annuaire de Jason Marinho (sans commission) : les demandes des hôtes de votre ville arrivent directement aux ${pro} inscrits.\n${JOIN[d.metier]}`
}

export interface ProChoix extends ProCandidat { nom: string; slug: string }

export const PROXIMITE_LABELS: Array<[number, string]> = [
  [100, 'Même ville'], [90, 'Même ville'], [80, 'Couvre la ville'], [55, 'Même secteur'], [50, 'Zone indiquée'], [0, 'Autre ville'],
]
export function proximiteLabel(score: number): string {
  return (PROXIMITE_LABELS.find(([min]) => score >= min) ?? [0, 'Autre ville'])[1]
}

/**
 * Pros à proposer pour un envoi à la main : pas encore sollicités ; ceux qui font ce que l'hôte demande
 * (vidéo, drone) d'abord parmi ceux de la zone, puis les plus proches, puis par nom. Ceux qui ne le font pas restent proposés.
 */
export function prosAProposer<T extends ProChoix>(pros: T[], d: Pick<DemandeAdminRow, 'ville' | 'sent_to'> & { frequence?: string | null }, recherche = ''): Array<T & { score: number; adequation: Adequation }> {
  const deja = new Set(d.sent_to.map(s => s.id))
  const q = recherche.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  return pros
    .filter(p => !deja.has(p.id))
    .map(p => ({ ...p, score: proximite(p, d.ville), adequation: convientAuBesoin(p, d.frequence) }))
    .filter(p => !q || `${p.nom} ${p.ville ?? ''} ${p.zone_couverte ?? ''}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q))
    .sort((a, b) => Number(b.score > 0) - Number(a.score > 0) || b.adequation - a.adequation || b.score - a.score || a.nom.localeCompare(b.nom, 'fr'))
}
