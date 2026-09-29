// Aperçu du contrat (29/09/2026, demande de Jason : « que les hôtes voient à
// quoi ressemble le contrat de cette maison avant de l'envoyer ») : construit
// un contrat d'exemple à partir de la fiche logement, affiché avec le même
// composant que la page de signature (ContractView), sans pouvoir le signer.

import { DEFAULT_ANNULATION, DEFAULT_REGLEMENT } from '@/lib/contract-default-clauses'
import { buildEtatDescriptif, contratOptions, type ContractDetails, type LogementForContract } from './details'

export const PAYMENT_LABELS: Record<string, string> = {
  virement: 'Virement bancaire', stripe: 'Paiement en ligne (Stripe)', especes: 'Espèces', cheque: 'Chèque',
  paypal: 'PayPal', airbnb: 'Airbnb / Booking (plateforme)', carte: 'Carte bancaire',
  les_deux: 'Virement bancaire ou paiement en ligne (Stripe)',
}

export function paymentLabels(methodes: string | null | undefined): string {
  const parts = (methodes || 'virement').split(',').map(s => s.trim()).filter(Boolean)
  return parts.map(p => PAYMENT_LABELS[p] ?? p).join(', ') || 'Virement bancaire'
}

/** L'IBAN n'apparaît que si le virement est proposé (même règle que /sign/[token]) */
export function showsIban(modalites: string, stripeEnabled: boolean): boolean {
  return /virement|transfer/i.test(modalites) || !stripeEnabled
}

export interface PreviewLogement extends LogementForContract {
  id: string
  nom: string
  adresse: string | null
  description?: string | null
  description_pt?: string | null
  description_en?: string | null
  capacite_max?: number | null
  heure_arrivee?: string | null
  heure_depart?: string | null
  tarif_nuitee_moyen?: number | null
  frais_menage?: number | null
  caution?: number | null
  methodes_paiement?: string | null
  animaux_acceptes?: boolean | null
  fumeur_accepte?: boolean | null
  conditions_annulation?: string | null
  conditions_annulation_pt?: string | null
  conditions_annulation_en?: string | null
  reglement_interieur?: string | null
  reglement_interieur_pt?: string | null
  reglement_interieur_en?: string | null
  contrat_options?: unknown
  clauses_particulieres?: string | null
  clauses_particulieres_pt?: string | null
  clauses_particulieres_en?: string | null
  proprietaire_nom?: string | null
  proprietaire_email?: string | null
  proprietaire_telephone?: string | null
  telephone?: string | null
}

export interface PreviewBailleur { prenom: string; nom: string; email: string; adresse?: string | null }

/** Données passées à ContractView pour un aperçu */
export interface ContractPreviewData {
  contract: Record<string, unknown> & { id: string; montant_loyer: number; montant_caution: number; modalites_paiement: string; stripe_payment_enabled: boolean }
  pays: string
  nights: number
  acomptePercent: number
}

export const PREVIEW_NIGHTS = 3

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d) + n * 86400000).toISOString().slice(0, 10)
}

/** Contrat d'exemple d'un logement : voyageur fictif, séjour de 3 nuits dans un mois */
export function previewFromLogement(l: PreviewLogement, bailleur: PreviewBailleur, today: string): ContractPreviewData {
  const opts = contratOptions(l.contrat_options)
  const nuit = Number(l.tarif_nuitee_moyen) > 0 ? Number(l.tarif_nuitee_moyen) : 100
  const menage = Number(l.frais_menage) > 0 ? Number(l.frais_menage) : 0
  const modalites = paymentLabels(l.methodes_paiement)
  const stripe = /stripe|les_deux/.test(l.methodes_paiement ?? '')
  const owner = l.proprietaire_nom?.trim()
  const [ownerPrenom, ...ownerNom] = (owner ?? '').split(' ')
  const details: ContractDetails = {
    etat: buildEtatDescriptif(l),
    frais_menage: menage || null,
    taxe_sejour: null,
    charges_incluses: opts.charges_incluses,
    regime: opts.regime,
    delai_caution_jours: opts.delai_caution_jours,
  }
  const arrivee = addDays(today, 30)
  return {
    pays: l.pays ?? 'FR',
    nights: PREVIEW_NIGHTS,
    acomptePercent: 50,
    contract: {
      id: '00000000-apercu', statut: 'en_attente', token_expires_at: addDays(today, 30), signature_date: null, signature_image: null,
      created_at: `${today}T12:00:00Z`,
      bailleur_prenom: owner ? ownerPrenom : bailleur.prenom,
      bailleur_nom: owner ? ownerNom.join(' ') : bailleur.nom,
      bailleur_adresse: owner ? null : bailleur.adresse ?? null,
      bailleur_email: owner ? l.proprietaire_email ?? null : bailleur.email,
      bailleur_telephone: owner ? l.proprietaire_telephone ?? null : l.telephone ?? null,
      locataire_prenom: 'Camille', locataire_nom: 'Exemple', locataire_email: 'camille@exemple.fr', locataire_telephone: null,
      logement_adresse: l.adresse, logement_description: l.description ?? null,
      logement_description_pt: l.description_pt ?? null, logement_description_en: l.description_en ?? null,
      capacite_max: Number(l.capacite_max) > 0 ? Number(l.capacite_max) : 2,
      date_arrivee: arrivee, date_depart: addDays(arrivee, PREVIEW_NIGHTS),
      heure_arrivee: l.heure_arrivee || '16:00', heure_depart: l.heure_depart || '11:00',
      montant_loyer: nuit * PREVIEW_NIGHTS + menage, montant_caution: Number(l.caution) > 0 ? Number(l.caution) : 0,
      modalites_paiement: modalites, stripe_payment_enabled: stripe,
      animaux_acceptes: !!l.animaux_acceptes, fumeur_accepte: !!l.fumeur_accepte,
      conditions_annulation: l.conditions_annulation || DEFAULT_ANNULATION.fr,
      conditions_annulation_pt: l.conditions_annulation_pt ?? null, conditions_annulation_en: l.conditions_annulation_en ?? null,
      reglement_interieur: l.reglement_interieur || DEFAULT_REGLEMENT.fr,
      reglement_interieur_pt: l.reglement_interieur_pt ?? null, reglement_interieur_en: l.reglement_interieur_en ?? null,
      details,
      clauses_particulieres: l.clauses_particulieres ?? null,
      clauses_particulieres_pt: l.clauses_particulieres_pt ?? null, clauses_particulieres_en: l.clauses_particulieres_en ?? null,
    },
  }
}

/** Clé du stockage local qui passe l'aperçu de l'assistant au nouvel onglet */
export const WIZARD_PREVIEW_KEY = 'contrat-apercu'
