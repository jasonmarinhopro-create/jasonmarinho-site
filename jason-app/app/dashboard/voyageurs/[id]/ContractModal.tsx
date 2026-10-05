'use client'

import { holdMayExpireBeforeCheckout } from '@/lib/stripe/deposit-window'
import { useState, useTransition, useRef, useEffect } from 'react'
import { X, FileText, Check, Copy, Envelope, CalendarBlank, Clock, Warning, House, Lock, Eye, ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { createContract, type ContractData } from '../contract-actions'
import { DEFAULT_ANNULATION as DEFAULT_ANNULATION_I18N, DEFAULT_REGLEMENT as DEFAULT_REGLEMENT_I18N } from '@/lib/contract-default-clauses'
import { buildEtatDescriptif, contratOptions, type RegimeAvance } from '@/lib/contracts/details'
import { showsIban, WIZARD_PREVIEW_KEY } from '@/lib/contracts/preview'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import InlineStyle from '@/components/ui/InlineStyle'

// Valeur française utilisée comme pré-remplissage par défaut (langue de
// référence) — les traductions PT/EN correspondantes se retrouvent
// automatiquement sur /sign/[token] via resolveClauseText, sans rien
// stocker de plus ici (cf. lib/contract-default-clauses.ts).
const DEFAULT_ANNULATION = DEFAULT_ANNULATION_I18N.fr
const DEFAULT_REGLEMENT = DEFAULT_REGLEMENT_I18N.fr

type Sejour = {
  id: string
  logement: string | null
  date_arrivee: string
  date_depart: string
  montant: number | null
}

type Voyageur = {
  id: string
  prenom: string
  nom: string
  email: string | null
  telephone: string | null
  /** Taille du groupe déclarée pour le check-in (ex: 6) — sert à préremplir
   *  la capacité du contrat, plus pertinente que la capacité max du logement. */
  checkin_expected_count?: number | null
}

type BailleurProfile = {
  prenom: string
  nom: string
  email: string
  adresse?: string | null
  iban?: string | null
  bic?: string | null
  stripeReady?: boolean
}

export type LogementOption = {
  id: string
  nom: string
  adresse: string
  telephone: string | null
  description: string | null
  description_pt?: string | null
  description_en?: string | null
  capacite_max: number
  heure_arrivee?: string | null
  heure_depart?: string | null
  reglement_interieur: string | null
  conditions_annulation: string | null
  conditions_annulation_pt?: string | null
  conditions_annulation_en?: string | null
  reglement_interieur_pt?: string | null
  reglement_interieur_en?: string | null
  animaux_acceptes: boolean
  fumeur_accepte: boolean
  methodes_paiement?: string | null
  pays?: string | null
  proprietaire_nom?: string | null
  proprietaire_email?: string | null
  proprietaire_telephone?: string | null
  frais_menage?: number | null
  caution?: number | null
  type_logement?: string | null
  surface_m2?: number | null
  nb_chambres?: number | null
  nb_lits?: number | null
  nb_sdb?: number | null
  equipements?: string[] | null
  classement_etoiles?: number | null
  numero_enregistrement?: string | null
  contrat_options?: unknown
  clauses_particulieres?: string | null
  clauses_particulieres_pt?: string | null
  clauses_particulieres_en?: string | null
}

/** Réglages du contrat repris de la fiche logement (carte « Contrat ») */
function contractFieldsFromLogement(l: LogementOption | null) {
  const o = contratOptions(l?.contrat_options)
  return {
    frais_menage: Number(l?.frais_menage) > 0 ? Number(l?.frais_menage) : 0,
    // Caution de la fiche logement (carte Tarifs), avant : toujours 0 à remplir à la main
    montant_caution: Number(l?.caution) > 0 ? Number(l?.caution) : 0,
    regime: o.regime as RegimeAvance,
    delai_caution_jours: o.delai_caution_jours,
    charges_incluses: o.charges_incluses,
    clauses_particulieres: l?.clauses_particulieres ?? '',
    clauses_particulieres_pt: l?.clauses_particulieres_pt ?? '',
    clauses_particulieres_en: l?.clauses_particulieres_en ?? '',
  }
}

/** Découpe "Prénom Nom" au premier espace, pour reconstruire bailleur_prenom/bailleur_nom
 *  depuis le champ unique logements.proprietaire_nom (conciergerie). */
function splitName(fullName: string): { prenom: string; nom: string } {
  const trimmed = fullName.trim()
  const i = trimmed.indexOf(' ')
  if (i === -1) return { prenom: trimmed, nom: '' }
  return { prenom: trimmed.slice(0, i), nom: trimmed.slice(i + 1) }
}

interface Props {
  sejour: Sejour
  voyageur: Voyageur
  bailleur: BailleurProfile
  logements?: LogementOption[]
  onClose: () => void
  onSuccess: () => void
}

type Step = 'bailleur' | 'locataire' | 'bien' | 'financier' | 'clauses' | 'done'

const STEPS: Step[] = ['bailleur', 'locataire', 'bien', 'financier', 'clauses']

const STEP_LABELS: Record<Step, string> = {
  bailleur:  'Toi, le bailleur',
  locataire: 'Le locataire',
  bien:      'Le logement',
  financier: 'Prix et paiement',
  clauses:   'Clauses',
  done:      'Terminé',
}

/** Libellés courts du fil d'étapes (lisibles à 390 px) */
const STEP_SHORT: Record<Step, string> = {
  bailleur: 'Toi', locataire: 'Locataire', bien: 'Logement', financier: 'Prix', clauses: 'Clauses', done: 'Fin',
}

export default function ContractModal({ sejour, voyageur, bailleur, logements = [], onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('bailleur')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [contractToken, setContractToken] = useState('')
  const [copied, setCopied] = useState(false)
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

  // Auto-sélectionner le logement correspondant au séjour
  const initialLogement = logements.find(l => l.nom === sejour.logement) ?? null

  const [selectedLogementId, setSelectedLogementId] = useState<string | null>(initialLogement?.id ?? null)

  // Bailleur : si le logement est géré pour le compte d'un propriétaire tiers
  // (conciergerie, cf. logements.proprietaire_nom/email/telephone), ses coordonnées
  // priment sur le profil de l'utilisateur connecté.
  const initialProprietaire = initialLogement?.proprietaire_nom
    ? splitName(initialLogement.proprietaire_nom)
    : null

  // Form state, pré-rempli depuis le logement si disponible
  const [form, setForm] = useState({
    // Bailleur
    bailleur_prenom: initialProprietaire?.prenom ?? bailleur.prenom,
    bailleur_nom: initialProprietaire?.nom ?? bailleur.nom,
    bailleur_email: initialLogement?.proprietaire_email ?? bailleur.email,
    bailleur_telephone: initialLogement?.proprietaire_telephone ?? initialLogement?.telephone ?? '',
    bailleur_adresse: bailleur.adresse ?? '',

    // Locataire
    locataire_prenom: voyageur.prenom,
    locataire_nom: voyageur.nom,
    locataire_email: voyageur.email ?? '',
    locataire_telephone: voyageur.telephone ?? '',
    // Locataire professionnel (structure) : pour une facture au nom d'une
    // entreprise/association plutôt qu'un particulier. locataire_prenom/nom
    // restent le signataire ; ces champs s'ajoutent pour la structure.
    locataire_type: 'particulier' as 'particulier' | 'professionnel',
    locataire_structure: '',
    locataire_nif: '',

    // Bien, pré-rempli depuis la fiche logement si elle correspond
    logement_nom: initialLogement?.nom ?? '',
    logement_adresse: initialLogement?.adresse ?? '',
    logement_description: initialLogement?.description ?? '',
    // Traductions PT/EN de la description, si la fiche logement les a (sinon
    // le contrat retombe sur le texte français sur /sign/[token]).
    logement_description_pt: initialLogement?.description_pt ?? '',
    logement_description_en: initialLogement?.description_en ?? '',
    // Capacité : la taille réelle du groupe qui vient (déclarée au check-in)
    // prime sur la capacité max du logement, plus pertinente pour le contrat.
    capacite_max: voyageur.checkin_expected_count ?? initialLogement?.capacite_max ?? 1,

    // Séjour
    date_arrivee: sejour.date_arrivee,
    date_depart: sejour.date_depart,
    // Horaires d'arrivée/départ habituels du logement, sinon défaut standard.
    heure_arrivee: initialLogement?.heure_arrivee ?? '16:00',
    heure_depart: initialLogement?.heure_depart ?? '11:00',

    // Financier, pré-rempli selon les méthodes de paiement du logement
    montant_loyer: sejour.montant ?? 0,
    acompte_percent: 100,

    // Langue du contrat (fr ou pt) : le corps du contrat est toujours affiché
    // dans cette langue PUIS en anglais en complément (cf. migration 099).
    langue: 'fr' as 'fr' | 'pt',
    methodes_keys: initialLogement?.methodes_paiement ?? 'virement',
    ...(() => {
      const labels: Record<string, string> = {
        virement: 'Virement bancaire', stripe: 'Paiement en ligne (Stripe)',
        especes: 'Espèces', cheque: 'Chèque', paypal: 'PayPal',
        airbnb: 'Airbnb / Booking (plateforme)', carte: 'Carte bancaire',
        les_deux: 'Virement bancaire ou paiement en ligne (Stripe)',
      }
      const m = initialLogement?.methodes_paiement ?? 'virement'
      const parts = m.split(',').map((s: string) => s.trim()).filter(Boolean)
      return {
        stripe_payment_enabled: parts.includes('stripe') || m === 'les_deux',
        modalites_paiement: parts.map((p: string) => labels[p] ?? p).join(', ') || 'Virement bancaire',
      }
    })(),

    // Clauses, pré-remplies depuis la fiche logement si disponible
    conditions_annulation: initialLogement?.conditions_annulation ?? DEFAULT_ANNULATION,
    reglement_interieur: initialLogement?.reglement_interieur ?? DEFAULT_REGLEMENT,
    // Traductions PT/EN des clauses : si le logement a les siennes, sinon
    // vide (le texte par défaut ci-dessus se traduit tout seul côté
    // /sign/[token] via resolveClauseText, pas besoin de les dupliquer ici).
    conditions_annulation_pt: initialLogement?.conditions_annulation_pt ?? '',
    conditions_annulation_en: initialLogement?.conditions_annulation_en ?? '',
    reglement_interieur_pt: initialLogement?.reglement_interieur_pt ?? '',
    reglement_interieur_en: initialLogement?.reglement_interieur_en ?? '',
    animaux_acceptes: initialLogement?.animaux_acceptes ?? false,
    fumeur_accepte: initialLogement?.fumeur_accepte ?? false,

    // Prix détaillé, arrhes ou acompte, caution, clauses particulières
    ...contractFieldsFromLogement(initialLogement),
    taxe_sejour: 0,
    taxe_sejour_mode: 'incluse' as 'incluse' | 'en_sus',
  })

  function set(field: string, value: string | number | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function paymentFieldsFromLogement(methodes: string | null | undefined) {
    const labels: Record<string, string> = {
      virement: 'Virement bancaire',
      stripe: 'Paiement en ligne (Stripe)',
      especes: 'Espèces',
      cheque: 'Chèque',
      paypal: 'PayPal',
      airbnb: 'Airbnb / Booking (plateforme)',
      carte: 'Carte bancaire',
      les_deux: 'Virement bancaire ou paiement en ligne (Stripe)',
    }
    if (!methodes) return { stripe_payment_enabled: false, modalites_paiement: 'Virement bancaire' }
    const parts = methodes.split(',').map(s => s.trim()).filter(Boolean)
    const hasStripe = parts.includes('stripe') || methodes === 'les_deux'
    const modalites = parts.map(p => labels[p] ?? p).join(', ')
    return { stripe_payment_enabled: hasStripe, modalites_paiement: modalites || 'Virement bancaire' }
  }

  function selectLogement(l: LogementOption) {
    setSelectedLogementId(l.id)
    const paymentFields = paymentFieldsFromLogement(l.methodes_paiement)
    const proprietaire = l.proprietaire_nom ? splitName(l.proprietaire_nom) : null
    setForm(f => ({
      ...f,
      logement_nom: l.nom,
      logement_adresse: l.adresse,
      logement_description: l.description ?? '',
      logement_description_pt: l.description_pt ?? '',
      logement_description_en: l.description_en ?? '',
      // Idem qu'à l'ouverture : la taille réelle du groupe (si déclarée)
      // prime sur la capacité max du logement sélectionné.
      capacite_max: voyageur.checkin_expected_count ?? l.capacite_max,
      heure_arrivee: l.heure_arrivee ?? f.heure_arrivee,
      heure_depart: l.heure_depart ?? f.heure_depart,
      // Conciergerie : si le logement a un propriétaire tiers renseigné, ses
      // coordonnées remplacent celles du bailleur (l'utilisateur connecté).
      bailleur_prenom: proprietaire?.prenom ?? bailleur.prenom,
      bailleur_nom: proprietaire?.nom ?? bailleur.nom,
      bailleur_email: l.proprietaire_email ?? bailleur.email,
      bailleur_telephone: l.proprietaire_telephone ?? l.telephone ?? f.bailleur_telephone,
      conditions_annulation: l.conditions_annulation ?? f.conditions_annulation,
      conditions_annulation_pt: l.conditions_annulation_pt ?? '',
      conditions_annulation_en: l.conditions_annulation_en ?? '',
      reglement_interieur: l.reglement_interieur ?? f.reglement_interieur,
      reglement_interieur_pt: l.reglement_interieur_pt ?? '',
      reglement_interieur_en: l.reglement_interieur_en ?? '',
      animaux_acceptes: l.animaux_acceptes,
      fumeur_accepte: l.fumeur_accepte,
      methodes_keys: l.methodes_paiement ?? 'virement',
      ...paymentFields,
      ...contractFieldsFromLogement(l),
    }))
  }

  function clearLogement() {
    setSelectedLogementId(null)
    setForm(f => ({
      ...f,
      logement_nom: '', logement_adresse: '', logement_description: '',
      logement_description_pt: '', logement_description_en: '', capacite_max: 1,
      // Revenir au profil de l'utilisateur connecté (plus de propriétaire tiers).
      bailleur_prenom: bailleur.prenom,
      bailleur_nom: bailleur.nom,
      bailleur_email: bailleur.email,
    }))
  }

  function nextStep() {
    const idx = STEPS.indexOf(step as Step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
    else handleSubmit()
  }

  function prevStep() {
    const idx = STEPS.indexOf(step as Step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }

  function validateStep(): string {
    if (step === 'bailleur') {
      if (!form.bailleur_prenom.trim() || !form.bailleur_nom.trim()) return 'Prénom et nom du bailleur sont requis.'
      if (!form.bailleur_email.trim()) return 'Email du bailleur requis.'
    }
    if (step === 'locataire') {
      if (!form.locataire_prenom.trim() || !form.locataire_nom.trim()) return 'Prénom et nom du locataire sont requis.'
      if (form.locataire_type === 'professionnel') {
        if (!form.locataire_structure.trim()) return 'Le nom de la structure est requis.'
        if (!form.locataire_nif.trim()) return 'Le NIF / numéro fiscal de la structure est requis.'
      }
    }
    if (step === 'bien') {
      if (!form.logement_adresse.trim()) return 'L\'adresse du logement est requise.'
      if (form.capacite_max < 1) return 'La capacité doit être d\'au moins 1 personne.'
    }
    if (step === 'financier') {
      if (form.montant_loyer <= 0) return 'Le montant du loyer doit être supérieur à 0.'
    }
    if (step === 'clauses') {
      if (!form.conditions_annulation.trim()) return 'Les conditions d\'annulation sont requises.'
    }
    return ''
  }

  function handleNext() {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    nextStep()
  }

  function handleSubmit() {
    // Pays du logement sélectionné → template juridique adapté.
    // Fallback 'FR' si le logement n'a pas encore le champ pays.
    const selectedLogement = selectedLogementId
      ? (logements ?? []).find(l => l.id === selectedLogementId)
      : null
    const contractPays = selectedLogement?.pays ?? 'FR'

    const contractData: ContractData = {
      sejour_id: sejour.id,
      voyageur_id: voyageur.id,
      bailleur_prenom: form.bailleur_prenom.trim(),
      bailleur_nom: form.bailleur_nom.trim(),
      bailleur_email: form.bailleur_email.trim(),
      bailleur_telephone: form.bailleur_telephone.trim() || undefined,
      bailleur_adresse: form.bailleur_adresse.trim() || undefined,
      locataire_prenom: form.locataire_prenom.trim(),
      locataire_nom: form.locataire_nom.trim(),
      locataire_email: form.locataire_email.trim() || undefined,
      locataire_telephone: form.locataire_telephone.trim() || undefined,
      locataire_type: form.locataire_type,
      locataire_structure: form.locataire_type === 'professionnel' ? form.locataire_structure.trim() || undefined : undefined,
      locataire_nif: form.locataire_type === 'professionnel' ? form.locataire_nif.trim() || undefined : undefined,
      logement_nom: form.logement_nom.trim() || undefined,
      logement_id: selectedLogementId ?? undefined,
      logement_adresse: form.logement_adresse.trim(),
      logement_description: form.logement_description.trim() || undefined,
      logement_description_pt: form.logement_description_pt.trim() || undefined,
      logement_description_en: form.logement_description_en.trim() || undefined,
      capacite_max: form.capacite_max,
      date_arrivee: form.date_arrivee,
      date_depart: form.date_depart,
      heure_arrivee: form.heure_arrivee,
      heure_depart: form.heure_depart,
      montant_loyer: form.montant_loyer,
      montant_caution: form.montant_caution,
      acompte_percent: form.acompte_percent,
      modalites_paiement: form.modalites_paiement,
      stripe_payment_enabled: form.stripe_payment_enabled,
      conditions_annulation: form.conditions_annulation.trim(),
      conditions_annulation_pt: form.conditions_annulation_pt.trim() || undefined,
      conditions_annulation_en: form.conditions_annulation_en.trim() || undefined,
      reglement_interieur: form.reglement_interieur.trim(),
      reglement_interieur_pt: form.reglement_interieur_pt.trim() || undefined,
      reglement_interieur_en: form.reglement_interieur_en.trim() || undefined,
      animaux_acceptes: form.animaux_acceptes,
      fumeur_accepte: form.fumeur_accepte,
      pays: contractPays,
      langue: form.langue,
      details: {
        frais_menage: form.frais_menage > 0 ? form.frais_menage : null,
        taxe_sejour: form.taxe_sejour > 0 ? form.taxe_sejour : null,
        taxe_sejour_mode: form.taxe_sejour_mode,
        charges_incluses: form.charges_incluses,
        regime: form.regime,
        delai_caution_jours: form.delai_caution_jours,
      },
      clauses_particulieres: form.clauses_particulieres.trim() || undefined,
      clauses_particulieres_pt: form.clauses_particulieres_pt.trim() || undefined,
      clauses_particulieres_en: form.clauses_particulieres_en.trim() || undefined,
    }

    startTransition(async () => {
      const res = await createContract(contractData)
      if (res.error) {
        setError(res.error)
        return
      }
      setContractToken(res.token!)
      setStep('done')
      onSuccess()
    })
  }

  /** Aperçu dans un nouvel onglet, avec ce qui est saisi (rien n'est enregistré) */
  function openPreview() {
    const lg = selectedLogementId ? logements.find(l => l.id === selectedLogementId) ?? null : null
    const pays = lg?.pays ?? 'FR'
    const nights = Math.max(1, Math.round((Date.parse(form.date_depart) - Date.parse(form.date_arrivee)) / 86400000) || 1)
    const contract = {
      id: '00000000-apercu', statut: 'en_attente', token_expires_at: form.date_arrivee, signature_date: null, signature_image: null,
      created_at: new Date().toISOString(), langue: form.langue,
      bailleur_prenom: form.bailleur_prenom, bailleur_nom: form.bailleur_nom, bailleur_adresse: form.bailleur_adresse || null,
      bailleur_email: form.bailleur_email || null, bailleur_telephone: form.bailleur_telephone || null,
      locataire_prenom: form.locataire_prenom, locataire_nom: form.locataire_nom, locataire_email: form.locataire_email || null,
      locataire_telephone: form.locataire_telephone || null, locataire_type: form.locataire_type,
      locataire_structure: form.locataire_structure || null, locataire_nif: form.locataire_nif || null,
      logement_adresse: form.logement_adresse, logement_description: form.logement_description || null,
      logement_description_pt: form.logement_description_pt || null, logement_description_en: form.logement_description_en || null,
      capacite_max: form.capacite_max, date_arrivee: form.date_arrivee, date_depart: form.date_depart,
      heure_arrivee: form.heure_arrivee, heure_depart: form.heure_depart,
      montant_loyer: form.montant_loyer, montant_caution: form.montant_caution,
      modalites_paiement: form.modalites_paiement, stripe_payment_enabled: form.stripe_payment_enabled,
      animaux_acceptes: form.animaux_acceptes, fumeur_accepte: form.fumeur_accepte,
      conditions_annulation: form.conditions_annulation, conditions_annulation_pt: form.conditions_annulation_pt || null, conditions_annulation_en: form.conditions_annulation_en || null,
      reglement_interieur: form.reglement_interieur || null, reglement_interieur_pt: form.reglement_interieur_pt || null, reglement_interieur_en: form.reglement_interieur_en || null,
      details: {
        etat: lg ? buildEtatDescriptif(lg) : undefined,
        frais_menage: form.frais_menage > 0 ? form.frais_menage : null,
        taxe_sejour: form.taxe_sejour > 0 ? form.taxe_sejour : null,
        taxe_sejour_mode: form.taxe_sejour_mode, charges_incluses: form.charges_incluses,
        regime: form.regime, delai_caution_jours: form.delai_caution_jours,
      },
      clauses_particulieres: form.clauses_particulieres || null,
      clauses_particulieres_pt: form.clauses_particulieres_pt || null, clauses_particulieres_en: form.clauses_particulieres_en || null,
    }
    const wantIban = showsIban(form.modalites_paiement, form.stripe_payment_enabled)
    const iban = wantIban ? (bailleur.iban ?? null) : null
    try {
      localStorage.setItem(WIZARD_PREVIEW_KEY, JSON.stringify({ contract, pays, nights, acomptePercent: form.acompte_percent, hostIban: iban, hostBic: iban ? bailleur.bic ?? null : null }))
      window.open('/apercu-contrat/assistant', '_blank', 'noopener')
    } catch {
      setError('Aperçu impossible dans ce navigateur (stockage bloqué).')
    }
  }

  function copyLink() {
    const url = `${APP_URL}/sign/${contractToken}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const currentStepIndex = STEPS.indexOf(step as Step)
  const isLastStep = step === 'clauses'

  // Fermer l'assistant avant la création = tout perdre : on demande (05/10/2026)
  const { confirm, dialog } = useConfirm()
  async function requestClose() {
    if (step === 'done' || isPending) { if (!isPending) onClose(); return }
    const ok = await confirm({
      title: 'Quitter l\'assistant ?',
      message: 'Le contrat n\'est pas encore créé : ce que tu as rempli sera perdu. Le séjour, lui, reste enregistré.',
      confirmLabel: 'Quitter sans créer',
      danger: true,
    })
    if (ok) onClose()
  }
  const signUrl = contractToken ? `${APP_URL}/sign/${contractToken}` : ''

  return (
    <div style={overlay}>
      {dialog}
      {/* Pas de fermeture au clic sur l'overlay : un clic accidentel en dehors
          du formulaire (long à remplir, 5 étapes) faisait tout perdre. Seule
          la croix ferme volontairement le modal. */}
      <div style={modal}>
        {/* En-tête (DA 05/10/2026, même famille que « Nouvelle réservation ») */}
        <div style={modalHeader}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ minWidth: 0 }}>
              <p style={modalTag}>
                <FileText size={13} weight="fill" style={{ verticalAlign: '-2px', marginRight: '5px' }} />
                Nouveau contrat · {voyageur.prenom} {voyageur.nom}{sejour.logement ? ` · ${sejour.logement}` : ''}
              </p>
              <h3 style={modalTitle}>
                {step === 'done' ? 'Contrat créé, prêt à envoyer' : STEP_LABELS[step]}
              </h3>
            </div>
            <button type="button" onClick={requestClose} style={closeBtn} aria-label="Fermer"><X size={18} /></button>
          </div>

          {/* Fil des étapes : une étape déjà faite se rouvre d'un clic */}
          {step !== 'done' && (
            <ol style={stepper} aria-label="Étapes du contrat">
              {/* Au téléphone, numéros seulement : le titre dit déjà l'étape en cours */}
              <InlineStyle css="@media (max-width: 560px) { .cm-step-name { display: none; } }" />
              {STEPS.map((st, i) => {
                const done = i < currentStepIndex
                const cur = i === currentStepIndex
                return (
                  <li key={st} style={{ minWidth: 0 }}>
                    <button
                      type="button"
                      onClick={() => done && setStep(st)}
                      disabled={!done}
                      aria-current={cur ? 'step' : undefined}
                      style={{ ...stepBtn, cursor: done ? 'pointer' : 'default' }}
                    >
                      <span style={{ ...stepBar, background: done || cur ? 'var(--accent-text)' : 'var(--border-2)', opacity: cur ? 1 : done ? 0.75 : 1 }} />
                      <span style={{ ...stepLabel, color: cur ? 'var(--accent-text)' : done ? 'var(--text-2)' : 'var(--text-3)', fontWeight: cur ? 700 : 600 }}>
                        {done ? <Check size={11} weight="bold" style={{ verticalAlign: '-1px', marginRight: '3px' }} /> : `${i + 1}`}
                        <span className="cm-step-name">{done ? '' : '. '}{STEP_SHORT[st]}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          )}
        </div>

        <div style={formBody}>
          {/* ── Step: Bailleur ─────────────────────────────────────────────── */}
          {step === 'bailleur' && (
            <>
              <p style={stepHint}>Tes informations de propriétaire, reprises dans le contrat.</p>
              <div style={row}>
                <Field label="Prénom *" value={form.bailleur_prenom} onChange={v => set('bailleur_prenom', v)} placeholder="Jason" />
                <Field label="Nom *" value={form.bailleur_nom} onChange={v => set('bailleur_nom', v)} placeholder="Marinho" />
              </div>
              <Field label="Email *" value={form.bailleur_email} onChange={v => set('bailleur_email', v)} placeholder="jason@email.com" type="email" />
              <Field label="Téléphone" value={form.bailleur_telephone} onChange={v => set('bailleur_telephone', v)} placeholder="+33 6 12 34 56 78" type="tel" />
              <Field label="Adresse postale" value={form.bailleur_adresse} onChange={v => set('bailleur_adresse', v)} placeholder="12 rue de la Paix, 75001 Paris" />
            </>
          )}

          {/* ── Step: Locataire ────────────────────────────────────────────── */}
          {step === 'locataire' && (
            <>
              <p style={stepHint}>Les informations de ton voyageur.</p>
              <div style={row}>
                <Field label="Prénom *" value={form.locataire_prenom} onChange={v => set('locataire_prenom', v)} placeholder="Martin" />
                <Field label="Nom *" value={form.locataire_nom} onChange={v => set('locataire_nom', v)} placeholder="Dupont" />
              </div>
              <Field label="Email" value={form.locataire_email} onChange={v => set('locataire_email', v)} placeholder="martin@email.com" type="email" />
              <Field label="Téléphone" value={form.locataire_telephone} onChange={v => set('locataire_telephone', v)} placeholder="+33 6 12 34 56 78" type="tel" />
              {!form.locataire_email && (
                <p style={{ ...warnText, display: 'flex', gap: '6px', alignItems: 'flex-start' }}><Warning size={14} weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} /> Sans e-mail, le lien de signature ne pourra pas être envoyé automatiquement.</p>
              )}

              {/* Locataire professionnel : pour une location au nom d'une
                  structure (entreprise, association, club…) avec son
                  numéro fiscal, utile notamment pour émettre une facture
                  ensuite (cf. issueInvoice). */}
              <div>
                <label style={fieldLabel}>Type de locataire</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  {(['particulier', 'professionnel'] as const).map(t => {
                    const checked = form.locataire_type === t
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => set('locataire_type', t)}
                        style={{
                          flex: 1, padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                          fontSize: '13px', fontWeight: checked ? 600 : 400,
                          background: checked ? 'var(--accent-bg)' : 'var(--surface)',
                          border: `1px solid ${checked ? 'var(--accent-border-2)' : 'var(--border)'}`,
                          color: checked ? 'var(--accent-text)' : 'var(--text-2)',
                          transition: 'all 0.15s',
                        }}
                      >
                        {t === 'particulier' ? 'Particulier' : 'Professionnel (structure)'}
                      </button>
                    )
                  })}
                </div>
              </div>
              {form.locataire_type === 'professionnel' && (
                <>
                  <Field
                    label="Nom de la structure *"
                    value={form.locataire_structure}
                    onChange={v => set('locataire_structure', v)}
                    placeholder="Ex : Clube Desportivo de Granja"
                  />
                  <Field
                    label="NIF / Numéro fiscal *"
                    value={form.locataire_nif}
                    onChange={v => set('locataire_nif', v)}
                    placeholder="Ex : 500123456"
                  />
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '-6px 0 0' }}>
                    Ces informations apparaîtront sur le contrat et sur la facture émise ensuite.
                  </p>
                </>
              )}

              {/* Langue du contrat : le corps entier (Article 1-10) est affiché
                  dans cette langue PUIS toujours en anglais en complément, pour
                  que le locataire comprenne ce qu'il signe (cf. migration 099). */}
              <div>
                <label style={fieldLabel}>Langue du contrat</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  {(['fr', 'pt'] as const).map(l => {
                    const checked = form.langue === l
                    return (
                      <button
                        key={l}
                        type="button"
                        onClick={() => set('langue', l)}
                        style={{
                          flex: 1, padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                          fontSize: '13px', fontWeight: checked ? 600 : 400,
                          background: checked ? 'var(--accent-bg)' : 'var(--surface)',
                          border: `1px solid ${checked ? 'var(--accent-border-2)' : 'var(--border)'}`,
                          color: checked ? 'var(--accent-text)' : 'var(--text-2)',
                          transition: 'all 0.15s',
                        }}
                      >
                        {l === 'fr' ? 'Français + English' : 'Português + English'}
                      </button>
                    )
                  })}
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '6px 0 0' }}>
                  Le contrat est toujours affiché en anglais en complément de la langue choisie.
                </p>
              </div>
            </>
          )}

          {/* ── Step: Bien ─────────────────────────────────────────────────── */}
          {step === 'bien' && (
            <>
              <p style={stepHint}>Description du logement mis en location.</p>

              {/* Logement déjà sélectionné → carte récap + bouton changer */}
              {selectedLogementId ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', borderRadius: '12px',
                  background: 'var(--accent-bg)',
                  border: '1px solid color-mix(in srgb, var(--accent-text) 25%, transparent)',
                  marginBottom: '4px',
                }}>
                  <div style={{
                    width: '34px', height: '34px', flexShrink: 0,
                    background: 'var(--accent-border)', borderRadius: '9px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={16} color="var(--accent-text)" weight="bold" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--accent-text)' }}>{form.logement_nom}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{form.logement_adresse}</p>
                  </div>
                  {logements.length > 1 && (
                    <button type="button" onClick={clearLogement} style={{
                      flexShrink: 0, fontSize: '12px', color: 'var(--text-3)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
                    }}>Changer</button>
                  )}
                </div>
              ) : (
                /* Sélecteur de logements enregistrés */
                logements.length > 0 && (
                  <div style={{ marginBottom: '4px' }}>
                    <p style={{ ...fieldLabel, marginBottom: '8px' }}>Choisir un logement enregistré</p>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
                      {logements.map(l => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => selectLogement(l)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                            textAlign: 'left' as const, fontFamily: 'inherit',
                            background: 'var(--surface)', border: '1px solid var(--border)',
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{
                            width: '32px', height: '32px', flexShrink: 0,
                            background: 'var(--surface-2)', border: '1px solid var(--border)',
                            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <House size={15} weight="fill" color="var(--accent-text)" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>{l.nom}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{l.adresse}</p>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)', flexShrink: 0 }}>{l.capacite_max} pers.</span>
                        </button>
                      ))}
                    </div>
                    <div style={{ height: '1px', background: 'var(--border)', margin: '14px 0 2px' }} />
                    <Field label="Ou saisir manuellement" value={form.logement_nom} onChange={v => set('logement_nom', v)} placeholder="Villa les Pins, Appartement Paris…" />
                  </div>
                )
              )}

              {/* Champs toujours éditables */}
              {!selectedLogementId && logements.length === 0 && (
                <Field label="Nom du logement (optionnel)" value={form.logement_nom} onChange={v => set('logement_nom', v)} placeholder="Villa les Pins, Appartement Paris…" />
              )}
              <Field label="Adresse complète du logement *" value={form.logement_adresse} onChange={v => set('logement_adresse', v)} placeholder="12 rue de la Paix, 75001 Paris" />
              <Field label="Description (type, superficie, équipements)" value={form.logement_description} onChange={v => set('logement_description', v)} placeholder="Studio de 25m², 1 pièce, cuisine équipée, Wi-Fi" />
              <div style={row}>
                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>Arrivée</label>
                  <CalendarInput value={form.date_arrivee} onChange={v => set('date_arrivee', v)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>Heure arrivée</label>
                  <TimePickerInput value={form.heure_arrivee} onChange={v => set('heure_arrivee', v)} />
                </div>
              </div>
              <div style={row}>
                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>Départ</label>
                  <CalendarInput value={form.date_depart} onChange={v => set('date_depart', v)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>Heure départ</label>
                  <TimePickerInput value={form.heure_depart} onChange={v => set('heure_depart', v)} />
                </div>
              </div>
              <div>
                <label style={fieldLabel}>Capacité maximale (personnes) *</label>
                <input
                  style={inputStyle} type="number" min={1} max={20}
                  value={form.capacite_max}
                  onChange={e => set('capacite_max', parseInt(e.target.value) || 1)}
                />
              </div>
            </>
          )}

          {/* ── Step: Financier ────────────────────────────────────────────── */}
          {step === 'financier' && (
            <>
              <p style={stepHint}>Montants et modalités de paiement.</p>
              <div style={row}>
                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>Loyer total (€) *</label>
                  <input
                    style={inputStyle} type="number" min={0} step={0.01}
                    value={form.montant_loyer}
                    onChange={e => set('montant_loyer', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>Dépôt de garantie (€)</label>
                  <input
                    style={inputStyle} type="number" min={0} step={0.01}
                    value={form.montant_caution}
                    onChange={e => set('montant_caution', parseFloat(e.target.value) || 0)}
                  />
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    À ne pas confondre avec l&apos;acompte ci-dessous : la caution ne fait pas partie du loyer. Par carte, elle est seulement bloquée, jamais débitée sans ton clic sur « Retenir une somme » après le séjour.
                  </p>
                  {form.montant_caution > 0 && form.date_arrivee && form.date_depart && (
                    <p style={{ fontSize: '11px', color: 'var(--text-2)', margin: '6px 0 0', lineHeight: 1.5 }}>
                      Par carte, le lien de caution part au voyageur 2 jours avant l&apos;arrivée : une carte ne reste bloquée qu&apos;environ 7 jours.
                      {holdMayExpireBeforeCheckout(form.date_arrivee, form.date_depart) && (
                        <strong style={{ color: '#8A5A12' }}> Séjour de plus de 4 nuits : la carte sera débloquée avant ton état des lieux de sortie, préfère une caution par virement.</strong>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Acompte à la réservation : distinct de la caution ci-dessus.
                  C'est une part du LOYER encaissée pour bloquer la réservation,
                  le solde restant étant à régler par le locataire selon les
                  modalités convenues (pas de suivi Stripe automatisé pour le
                  solde, cf. migration 097). */}
              <div>
                <label style={fieldLabel}>Acompte à la réservation</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  {[50, 100].map(pct => {
                    const checked = form.acompte_percent === pct
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => set('acompte_percent', pct)}
                        style={{
                          flex: 1, padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                          fontSize: '13px', fontWeight: checked ? 600 : 400,
                          background: checked ? 'var(--accent-bg)' : 'var(--surface)',
                          border: `1px solid ${checked ? 'color-mix(in srgb, var(--accent-text) 40%, transparent)' : 'var(--border)'}`,
                          color: checked ? 'var(--accent-text)' : 'var(--text-2)',
                          transition: 'all 0.15s',
                        }}
                      >
                        {pct === 100 ? '100 %, solde intégral à la signature' : '50 % maintenant, 50 % à l’arrivée'}
                      </button>
                    )
                  })}
                </div>
                {form.acompte_percent < 100 && form.montant_loyer > 0 && (
                  <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: '8px 0 0' }}>
                    Acompte&nbsp;: <strong>{(form.montant_loyer * form.acompte_percent / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</strong>
                    {' · '}Solde à l&apos;arrivée&nbsp;: <strong>{(form.montant_loyer * (100 - form.acompte_percent) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</strong>
                  </p>
                )}
              </div>
              {/* Détail du prix (Code du tourisme L324-2 : le prix figure au contrat) */}
              <div style={row}>
                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>Dont frais de ménage (€)</label>
                  <input style={inputStyle} type="number" min={0} step={0.01} value={form.frais_menage}
                    onChange={e => set('frais_menage', parseFloat(e.target.value) || 0)} />
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Compris dans le loyer total, affiché à part sur le contrat.</p>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>Taxe de séjour (€, tout le séjour)</label>
                  <input style={inputStyle} type="number" min={0} step={0.01} value={form.taxe_sejour}
                    onChange={e => set('taxe_sejour', parseFloat(e.target.value) || 0)} />
                  <select style={{ ...inputStyle, marginTop: '6px' }} value={form.taxe_sejour_mode} onChange={e => set('taxe_sejour_mode', e.target.value)}>
                    <option value="incluse">Comprise dans le loyer total</option>
                    <option value="en_sus">À régler en plus du loyer</option>
                  </select>
                </div>
              </div>
              <ToggleField label="Charges comprises (eau, électricité, chauffage, internet)" value={form.charges_incluses} onChange={v => set('charges_incluses', v)} />

              {/* Arrhes ou acompte : sans précision, la loi présume des arrhes (L214-1 Code de la consommation) */}
              {(logements.find(l => l.id === selectedLogementId)?.pays ?? 'FR') === 'FR' && (
                <div>
                  <label style={fieldLabel}>Les sommes versées à la réservation sont</label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    {(['arrhes', 'acompte'] as const).map(r => {
                      const checked = form.regime === r
                      return (
                        <button key={r} type="button" onClick={() => set('regime', r)} style={{
                          flex: 1, padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left' as const,
                          fontSize: '13px', fontWeight: checked ? 600 : 400, fontFamily: 'inherit',
                          background: checked ? 'var(--accent-bg)' : 'var(--surface)',
                          border: `1px solid ${checked ? 'color-mix(in srgb, var(--accent-text) 40%, transparent)' : 'var(--border)'}`,
                          color: checked ? 'var(--accent-text)' : 'var(--text-2)',
                        }}>
                          {r === 'arrhes' ? 'Des arrhes (conseillé)' : 'Un acompte'}
                          <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 400, color: 'var(--text-3)', marginTop: '3px' }}>
                            {r === 'arrhes'
                              ? 'Le voyageur qui annule les perd, toi tu rends le double si tu annules.'
                              : 'Réservation ferme : le voyageur reste redevable du prix s’il annule.'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {form.montant_caution > 0 && (
                <div>
                  <label style={fieldLabel}>Caution restituée au plus tard (jours après le départ)</label>
                  <input style={{ ...inputStyle, maxWidth: '140px' }} type="number" min={1} max={60} value={form.delai_caution_jours}
                    onChange={e => set('delai_caution_jours', Math.max(1, Math.min(60, parseInt(e.target.value) || 7)))} />
                </div>
              )}

              <div>
                <label style={fieldLabel}>Méthodes de paiement acceptées</label>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px', marginTop: '4px' }}>
                  {([
                    { value: 'virement', label: 'Virement bancaire',     disabled: false },
                    { value: 'stripe',   label: 'Paiement en ligne (Stripe)',      disabled: !bailleur.stripeReady },
                    { value: 'especes',  label: 'Espèces',               disabled: false },
                    { value: 'cheque',   label: 'Chèque',                disabled: false },
                    { value: 'paypal',   label: 'PayPal',               disabled: false },
                    { value: 'airbnb',   label: 'Airbnb / Booking',      disabled: false },
                    { value: 'carte',    label: 'Carte bancaire (TPE)',   disabled: false },
                  ] as { value: string; label: string; disabled: boolean }[]).map(opt => {
                    const LABELS: Record<string, string> = {
                      virement: 'Virement bancaire', stripe: 'Paiement en ligne (Stripe)',
                      especes: 'Espèces', cheque: 'Chèque', paypal: 'PayPal',
                      airbnb: 'Airbnb / Booking (plateforme)', carte: 'Carte bancaire',
                    }
                    const keys = form.methodes_keys.split(',').map(s => s.trim()).filter(Boolean)
                    const checked = keys.includes(opt.value)
                    const isDisabled = opt.disabled
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isDisabled}
                        title={isDisabled ? 'Connecte ton compte Stripe dans Mon compte → Encaissements pour activer cette option' : undefined}
                        onClick={() => {
                          const next = checked ? keys.filter(v => v !== opt.value) : [...keys, opt.value]
                          const nextKeys = next.length ? next : ['virement']
                          const nextStripe = nextKeys.includes('stripe')
                          const nextModalites = nextKeys.map(k => LABELS[k] ?? k).join(', ')
                          setForm(f => ({ ...f, methodes_keys: nextKeys.join(','), stripe_payment_enabled: nextStripe, modalites_paiement: nextModalites }))
                        }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          padding: '7px 13px', borderRadius: '10px', cursor: isDisabled ? 'not-allowed' : 'pointer',
                          fontSize: '13px', fontWeight: checked ? 600 : 400, border: 'none',
                          background: isDisabled
                            ? 'var(--bg-2)'
                            : checked ? 'var(--accent-bg)' : 'var(--surface)',
                          outline: isDisabled
                            ? '1px solid var(--border)'
                            : checked ? '1px solid color-mix(in srgb, var(--accent-text) 40%, transparent)' : '1px solid var(--border)',
                          color: isDisabled ? 'var(--text-muted)' : checked ? 'var(--accent-text)' : 'var(--text-2)',
                          transition: 'all 0.15s',
                          opacity: isDisabled ? 0.6 : 1,
                        }}
                      >
                        {opt.label}
                        {isDisabled && <Lock size={11} weight="bold" style={{ marginLeft: '2px' }} />}
                      </button>
                    )
                  })}
                </div>
                {!bailleur.stripeReady && (
                  <p style={{ margin: '8px 0 0', fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.5 }}>
                    <Lock size={11} weight="bold" style={{ verticalAlign: '-1px' }} /> Paiement en ligne pas encore activé : connecte Stripe dans <strong>Mon compte, Encaissements</strong>.
                  </p>
                )}
              </div>
            </>
          )}

          {/* ── Step: Clauses ──────────────────────────────────────────────── */}
          {step === 'clauses' && (
            <>
              <p style={stepHint}>Ces clauses reprennent ta fiche logement (carte « Contrat »). Tu peux les ajuster pour ce voyageur.</p>
              <div>
                <label style={fieldLabel}>Conditions d&apos;annulation * <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(obligatoire)</span></label>
                <textarea
                  style={{ ...inputStyle, height: '90px', resize: 'vertical' as const, fontFamily: 'inherit' }}
                  value={form.conditions_annulation}
                  onChange={e => set('conditions_annulation', e.target.value)}
                />
              </div>
              <div>
                <label style={fieldLabel}>Règlement intérieur</label>
                <textarea
                  style={{ ...inputStyle, height: '110px', resize: 'vertical' as const, fontFamily: 'inherit' }}
                  value={form.reglement_interieur}
                  onChange={e => set('reglement_interieur', e.target.value)}
                />
              </div>
              <div>
                <label style={fieldLabel}>Clauses particulières <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(facultatif)</span></label>
                <textarea
                  style={{ ...inputStyle, height: '90px', resize: 'vertical' as const, fontFamily: 'inherit' }}
                  value={form.clauses_particulieres}
                  placeholder="Ex : linge de lit et serviettes fournis. Accès à la piscine de 9 h à 20 h. Bois de chauffage en supplément (15 € le stère)."
                  onChange={e => set('clauses_particulieres', e.target.value)}
                />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Ajoutées au contrat dans un article à part. Elles ne peuvent pas retirer au voyageur un droit que la loi lui donne.</p>
              </div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' as const }}>
                <ToggleField
                  label="Animaux admis"
                  value={form.animaux_acceptes}
                  onChange={v => set('animaux_acceptes', v)}
                />
                <ToggleField
                  label="Tabac autorisé"
                  value={form.fumeur_accepte}
                  onChange={v => set('fumeur_accepte', v)}
                />
              </div>
            </>
          )}

          {/* ── Step: Done ─────────────────────────────────────────────────── */}
          {step === 'done' && (
            <div style={doneBox}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}><span style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--accent-bg)', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={32} weight="duotone" /></span></div>
              <p style={doneText}>
                Le contrat a été créé avec succès.
                {form.locataire_email ? (
                  <> Un email avec le lien de signature a été envoyé à <strong style={{ color: 'var(--accent-text)' }}>{form.locataire_email}</strong>.</>
                ) : (
                  <> Partagez le lien ci-dessous avec le locataire pour qu&apos;il puisse signer.</>
                )}
              </p>

              {/* Lien de signature */}
              <div style={linkBox}>
                <p style={linkLabel}>Lien de signature</p>
                <div style={linkRow}>
                  <a href={signUrl} target="_blank" rel="noopener noreferrer" style={linkText}>
                    {signUrl}
                  </a>
                  <button onClick={copyLink} style={copyBtn}>
                    {copied ? <Check size={14} color="var(--accent-text)" /> : <Copy size={14} />}
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
                <a
                  href={signUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={previewBtn}
                >
                  <FileText size={14} />
                  Voir le contrat
                </a>
                {form.locataire_email && (
                  <div style={sentNotice}>
                    <Envelope size={14} color="var(--accent-text)" />
                    Email envoyé à {form.locataire_email}
                  </div>
                )}
              </div>

              <p style={legalNotice}>
                Ce contrat constitue une signature électronique simple valide selon le règlement eIDAS (UE) 910/2014
                et l&apos;article 1366 du Code civil français. Le lien expire dans 30 jours.
              </p>
            </div>
          )}

          {error && <p style={errorStyle}>{error}</p>}
        </div>

        {/* Footer buttons */}
        {step !== 'done' && (
          <div style={footer}>
            <button
              type="button"
              onClick={currentStepIndex === 0 ? requestClose : prevStep}
              style={ghostBtn}
            >
              {currentStepIndex === 0 ? 'Annuler' : 'Retour'}
            </button>
            {isLastStep && (
              <button type="button" onClick={openPreview} style={{ ...ghostBtn, marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={14} /> Voir le contrat
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={isPending}
              style={primaryBtn}
            >
              {isPending ? 'Création…' : isLastStep ? (
                <><FileText size={14} /> Créer le contrat</>
              ) : (
                <>Suivant : {STEP_SHORT[STEPS[currentStepIndex + 1]]} <ArrowRight size={14} weight="bold" /></>
              )}
            </button>
          </div>
        )}
        {step === 'done' && (
          <div style={footer}>
            <button type="button" onClick={onClose} style={primaryBtn}>
              <Check size={14} />
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Field helper ─────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div style={{ flex: 1 }}>
      <label style={fieldLabel}>{label}</label>
      <input
        style={inputStyle}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

function ToggleField({
  label, value, onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={value}
        onChange={e => onChange(e.target.checked)}
        style={{ width: '16px', height: '16px', accentColor: 'var(--accent-text)' }}
      />
      <span style={{ fontSize: '14px', color: 'var(--text-2)' }}>{label}</span>
    </label>
  )
}

// ─── CalendarInput ────────────────────────────────────────────────────────────

function CalendarInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value + 'T12:00:00')
    return new Date()
  })
  const [popupPos, setPopupPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) setViewDate(new Date(value + 'T12:00:00'))
  }, [value])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        popupRef.current && !popupRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleOpen() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPopupPos({ top: rect.bottom + 6, left: rect.left, width: Math.max(rect.width, 280) })
    }
    setOpen(o => !o)
  }

  const selectedDate = value ? new Date(value + 'T12:00:00') : null
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = (() => { const d = new Date(year, month, 1).getDay(); return (d + 6) % 7 })()
  const monthName = viewDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Choisir une date'
  const DAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']

  function selectDay(day: number) {
    const d = new Date(year, month, day)
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    setOpen(false)
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
          background: 'var(--surface)',
          border: `1px solid ${open ? 'var(--text-3)' : 'var(--border)'}`,
          borderRadius: '10px', padding: '10px 12px',
          fontSize: '14px', color: selectedDate ? 'var(--text)' : 'var(--text-muted)',
          cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
          transition: 'border-color 0.15s', boxSizing: 'border-box',
        }}
      >
        <CalendarBlank size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{displayValue}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '9px', marginLeft: '4px' }}>▼</span>
      </button>

      {open && popupPos && (
        <div
          ref={popupRef}
          style={{
            position: 'fixed', top: popupPos.top, left: popupPos.left,
            zIndex: 9999, minWidth: popupPos.width,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '14px 14px 10px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <button type="button" onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} style={calNavBtnStyle}>‹</button>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' as const }}>
              {monthName}
            </span>
            <button type="button" onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} style={calNavBtnStyle}>›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '2px' }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', padding: '3px 0', letterSpacing: '0.5px' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} style={{ height: '34px' }} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const d = new Date(year, month, day); d.setHours(0, 0, 0, 0)
              const isSel = selectedDate ? d.getTime() === selectedDate.getTime() : false
              const isToday2 = d.getTime() === today.getTime()
              return (
                <button key={day} type="button" onClick={() => selectDay(day)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '34px', borderRadius: '8px', border: 'none',
                  fontSize: '13px', fontWeight: isSel ? 700 : 400,
                  background: isSel ? 'var(--accent-bg-2)' : isToday2 ? 'color-mix(in srgb, var(--accent-text) 10%, transparent)' : 'transparent',
                  color: isSel ? 'var(--accent-text)' : isToday2 ? 'var(--accent-text)' : 'var(--text-2)',
                  cursor: 'pointer',
                  outline: isSel ? '1.5px solid var(--accent-border-2)' : 'none',
                  transition: 'background 0.1s',
                }}>{day}</button>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

const calNavBtnStyle: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: '8px', color: 'var(--text-2)', fontSize: '18px',
  width: '32px', height: '32px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', lineHeight: '1',
}

// ─── TimePickerInput ──────────────────────────────────────────────────────────

function TimePickerInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [popupPos, setPopupPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const times: string[] = []
  for (let h = 6; h <= 23; h++) {
    times.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 23) times.push(`${String(h).padStart(2, '0')}:30`)
  }

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        popupRef.current && !popupRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleOpen() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPopupPos({ top: rect.bottom + 6, left: rect.left, width: Math.max(rect.width, 220) })
    }
    setOpen(o => !o)
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
          background: 'var(--surface)',
          border: `1px solid ${open ? 'var(--text-3)' : 'var(--border)'}`,
          borderRadius: '10px', padding: '10px 12px',
          fontSize: '14px', color: value ? 'var(--text)' : 'var(--text-muted)',
          cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
          transition: 'border-color 0.15s', boxSizing: 'border-box',
        }}
      >
        <Clock size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{value || 'Choisir une heure'}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '9px', marginLeft: '4px' }}>▼</span>
      </button>

      {open && popupPos && (
        <div
          ref={popupRef}
          style={{
            position: 'fixed', top: popupPos.top, left: popupPos.left,
            zIndex: 9999, width: popupPos.width,
            // Couleurs jaunes en dur avant (pensées pour un fond sombre) :
            // rendaient un jaune vif sur le fond vert pâle du thème clair.
            // Passe aux tokens d'accent theme-aware, comme le reste de l'app.
            background: 'var(--bg-2)', border: '1px solid var(--border-2)',
            borderRadius: '16px', padding: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', maxHeight: '220px', overflowY: 'auto' }}>
            {times.map(t => (
              <button key={t} type="button" onClick={() => { onChange(t); setOpen(false) }} style={{
                padding: '8px 4px', borderRadius: '8px', border: 'none',
                fontSize: '13px', fontWeight: value === t ? 700 : 400,
                background: value === t ? 'var(--accent-bg-2)' : 'transparent',
                color: value === t ? 'var(--accent-text)' : 'var(--text-2)',
                cursor: 'pointer',
                outline: value === t ? '1.5px solid var(--accent-border-2)' : 'none',
                transition: 'background 0.1s',
              }}>{t}</button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 400,
  background: 'rgba(0,20,14,0.5)',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(8px, 3vw, 28px)',
  animation: 'fadeIn var(--d-base) var(--ease-smooth)',
}

const modal: React.CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border-2)',
  borderRadius: '20px',
  width: '100%', maxWidth: '720px',
  boxShadow: 'var(--shadow-xl)',
  maxHeight: 'calc(100dvh - 16px)', overflow: 'hidden',
  display: 'flex', flexDirection: 'column',
  animation: 'scaleIn var(--d-base) var(--ease-out)',
}

const modalHeader: React.CSSProperties = {
  padding: 'clamp(16px, 3vw, 22px) clamp(16px, 3vw, 26px) 14px',
  background: 'linear-gradient(135deg, var(--accent-bg) 0%, rgba(99,214,131,0.10) 55%, rgba(255,213,107,0.14) 100%)',
  borderBottom: '1px solid var(--accent-border)',
  flexShrink: 0,
}

const stepper: React.CSSProperties = {
  listStyle: 'none', margin: '16px 0 0', padding: 0,
  display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '6px',
}

const stepBtn: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', padding: 0,
  background: 'none', border: 'none', textAlign: 'left', fontFamily: 'inherit',
}

const stepBar: React.CSSProperties = { display: 'block', height: '4px', borderRadius: '99px', width: '100%' }

const stepLabel: React.CSSProperties = {
  fontSize: '11.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
}

const modalTag: React.CSSProperties = {
  fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.6px', margin: '0 0 6px',
  textTransform: 'uppercase' as const, color: 'var(--accent-text)',
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
}

const modalTitle: React.CSSProperties = {
  fontFamily: 'var(--font-fraunces), Georgia, serif',
  fontSize: 'clamp(22px, 3vw, 27px)', fontWeight: 400, lineHeight: 1.15,
  color: 'var(--text)', margin: 0, letterSpacing: '-0.3px',
}

const closeBtn: React.CSSProperties = {
  width: '36px', height: '36px', flexShrink: 0,
  background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer',
  color: 'var(--text-2)', borderRadius: '10px',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
}

const formBody: React.CSSProperties = {
  padding: 'clamp(14px, 2.5vw, 22px) clamp(16px, 3vw, 26px)',
  display: 'flex', flexDirection: 'column' as const, gap: 'var(--s-4)',
  overflowY: 'auto', flex: 1, minHeight: 0,
}

const row: React.CSSProperties = {
  display: 'flex', gap: 'var(--s-3)', flexWrap: 'wrap' as const,
}

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--t-xs)', fontWeight: 600,
  color: 'var(--text-2)',
  marginBottom: 'var(--s-2)',
  letterSpacing: '0.2px',
}

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', boxSizing: 'border-box' as const,
  background: 'var(--bg-3)',
  border: '1px solid var(--border-2)',
  borderRadius: 'var(--r-md)', padding: '11px 14px',
  fontSize: 'var(--t-base)', color: 'var(--text)',
  outline: 'none',
  transition: 'border-color var(--d-base) var(--ease-smooth), background var(--d-base) var(--ease-smooth), box-shadow var(--d-base) var(--ease-smooth)',
}

const stepHint: React.CSSProperties = {
  fontSize: 'var(--t-sm)', color: 'var(--text-muted)',
  margin: '0 0 var(--s-1)', lineHeight: 'var(--lh-base)',
}

const warnText: React.CSSProperties = {
  fontSize: '13px', color: 'var(--accent-text)',
  background: 'var(--accent-bg)',
  border: '1px solid var(--accent-border)',
  borderRadius: '8px', padding: '10px 14px', margin: 0,
}

const errorStyle: React.CSSProperties = {
  color: 'var(--danger)', fontSize: '13px', margin: 0,
}

const footer: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
  padding: '12px clamp(16px, 3vw, 26px)',
  borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0,
}

const ghostBtn: React.CSSProperties = {
  background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer',
  fontSize: '14px', fontWeight: 500, color: 'var(--text-2)', fontFamily: 'inherit',
  padding: '11px 16px', borderRadius: '11px',
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  background: 'var(--accent-text)', color: 'var(--bg)',
  border: '1px solid var(--accent-text)', borderRadius: '11px',
  padding: '11px 18px', fontSize: '14px', fontWeight: 700, fontFamily: 'inherit',
  cursor: 'pointer',
}

// Done step styles

const doneBox: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '16px',
}

const doneText: React.CSSProperties = {
  fontSize: '14px', color: 'var(--text-2)',
  lineHeight: 1.7, margin: 0,
}

const linkBox: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '12px', padding: '14px 16px',
}

const linkLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600,
  letterSpacing: '1px', textTransform: 'uppercase' as const,
  color: 'var(--text-muted)', margin: '0 0 8px',
}

const linkRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '10px',
}

const linkText: React.CSSProperties = {
  flex: 1, fontSize: '13px', color: 'var(--accent-text)',
  textDecoration: 'none', wordBreak: 'break-all' as const,
}

const copyBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  background: 'none', border: '1px solid var(--border)',
  borderRadius: '8px', padding: '5px 12px',
  fontSize: '12px', color: 'var(--text-2)',
  cursor: 'pointer', flexShrink: 0,
}

const previewBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  background: 'var(--accent-bg)',
  border: '1px solid var(--accent-border)',
  borderRadius: '10px', padding: '8px 16px',
  fontSize: '13px', color: 'var(--accent-text)',
  textDecoration: 'none', cursor: 'pointer',
}

const sentNotice: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  background: 'var(--accent-bg)',
  border: '1px solid color-mix(in srgb, var(--accent-text) 20%, transparent)',
  borderRadius: '10px', padding: '8px 16px',
  fontSize: '13px', color: 'var(--accent-text)',
}

const legalNotice: React.CSSProperties = {
  fontSize: '11px', color: 'var(--text-muted)',
  lineHeight: 1.6, margin: 0,
}
