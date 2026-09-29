'use client'

// Fiche d'un logement (refonte 29/09/2026, demande de Jason : « plus visuel
// en UI et en UX »). Bandeau vert avec les photos (envoi direct, PhotosCard),
// les chiffres clés et ce qui manque à la fiche ; puis 2 colonnes : à gauche
// la vie du logement (réservations à venir, y compris Airbnb / Booking,
// calendriers, caractéristiques, tarifs, textes du contrat), à droite ce
// qu'on consulte au quotidien (arrivée des voyageurs, contacts, voyageurs
// récents, informations, propriétaire). Chaque carte s'édite sur place ;
// `#modifier-<carte>` ouvre directement son formulaire.

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  ArrowLeft, House, MapPin, Star, ArrowSquareOut, CurrencyEur, CalendarBlank, CalendarCheck, Users, WifiHigh, Key, Phone,
  Sparkle, ShieldCheck, Check, Copy, ArrowRight, ChatText, Car, SwimmingPool, Snowflake, Fire, WashingMachine, ForkKnife,
  Television, Tree, Chair, Plant, Wheelchair, Elevator, Campfire, Bathtub, PawPrint, Cigarette, Broom, Bed, Door, Shower,
  Ruler, Plus, Globe, FileText, Scroll, Handshake, Info, Printer, SignIn, SignOut, Tag, LinkSimple, Warning, CheckCircle,
  Circle, TrendUp, Translate, ListChecks,
} from '@phosphor-icons/react/dist/ssr'
import { EditableCard } from './EditableCard'
import IcalSyncSection, { SOURCE_FG } from './IcalSyncSection'
import PhotosCard from './PhotosCard'
import type { VoyageurOption } from './QuickSejourModal'
import { contratOptions, type RegimeAvance } from '@/lib/contracts/details'
import { updateLogement, type LogementIcalFeedStatus } from '../actions'

const QuickSejourModal = dynamic(() => import('./QuickSejourModal'), { ssr: false })

const AMBER = '#B7791F'
const AMBER_DARK = '#8A5A12'
const BROWN = '#6E5446'

/** Textarea avec onglets FR / PT / EN pour les textes libres (description,
 *  clauses) : le sélecteur de langue du contrat ne peut pas traduire un
 *  texte libre, le bailleur saisit lui-même les versions traduites. */
function LangTextarea({
  fr, pt, en, onChangeFr, onChangePt, onChangeEn, placeholder, rows = 5,
}: {
  fr: string; pt: string; en: string
  onChangeFr: (v: string) => void; onChangePt: (v: string) => void; onChangeEn: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  const [tab, setTab] = useState<'fr' | 'pt' | 'en'>('fr')
  const value = tab === 'fr' ? fr : tab === 'pt' ? pt : en
  const onChange = tab === 'fr' ? onChangeFr : tab === 'pt' ? onChangePt : onChangeEn
  const names = { fr: 'Français', pt: 'Portugais', en: 'Anglais' }
  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
        {(['fr', 'pt', 'en'] as const).map(l => {
          const on = tab === l
          const empty = l !== 'fr' && !(l === 'pt' ? pt : en)
          return (
            <button
              key={l}
              type="button"
              onClick={() => setTab(l)}
              style={{
                ...s.langTab,
                background: on ? 'var(--accent-bg)' : 'var(--surface)',
                border: `1px solid ${on ? 'var(--accent-text)' : 'var(--border)'}`,
                color: on ? 'var(--accent-text)' : 'var(--text-2)',
              }}
            >
              {names[l]}
              {empty && <span style={{ opacity: 0.6, fontWeight: 500 }}> (vide)</span>}
            </button>
          )
        })}
      </div>
      <textarea
        style={s.editTextarea}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={tab === 'fr' ? placeholder : `Traduction en ${tab === 'pt' ? 'portugais' : 'anglais'} (facultative : sinon le texte français s'affiche)`}
        rows={rows}
      />
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Logement = {
  id: string
  nom: string
  adresse: string
  telephone: string | null
  description: string | null
  description_pt: string | null
  description_en: string | null
  type_logement: string | null
  capacite_max: number
  surface_m2: number | null
  nb_chambres: number | null
  nb_lits: number | null
  nb_sdb: number | null
  numero_enregistrement: string | null
  classement_etoiles: number | null
  dpe: string | null
  tarif_nuitee_moyen: number | null
  frais_menage: number | null
  caution: number | null
  equipements: string[] | null
  lien_airbnb: string | null
  lien_booking: string | null
  lien_gmb: string | null
  lien_site_direct: string | null
  lien_driing: string | null
  ical_airbnb: string | null
  ical_booking: string | null
  ical_vrbo: string | null
  ical_autre: string | null
  photo_couverture_url: string | null
  photos_urls: string[] | null
  contact_urgence_nom: string | null
  contact_urgence_tel: string | null
  contact_menage_nom: string | null
  contact_menage_tel: string | null
  actif: boolean | null
  proprietaire_nom: string | null
  proprietaire_email: string | null
  proprietaire_telephone: string | null
  honoraires_pct: number | null
  iban: string | null
  bic: string | null
  reglement_interieur: string | null
  conditions_annulation: string | null
  conditions_annulation_pt: string | null
  conditions_annulation_en: string | null
  reglement_interieur_pt: string | null
  reglement_interieur_en: string | null
  contrat_options?: unknown
  clauses_particulieres?: string | null
  clauses_particulieres_pt?: string | null
  clauses_particulieres_en?: string | null
  animaux_acceptes: boolean
  fumeur_accepte: boolean
  methodes_paiement: string | null
  heure_arrivee: string | null
  heure_depart: string | null
  code_acces: string | null
  wifi_nom: string | null
  wifi_mdp: string | null
  pays: string | null
  numero_al: string | null
}

type Sejour = {
  id: string
  voyageur_id: string
  logement: string | null
  date_arrivee: string
  date_depart: string
  montant: number | null
  contrat_statut: string | null
  contrat_date_signature: string | null
  contrat_lien: string | null
  voyageurs: { id: string; prenom: string; nom: string; email: string | null; telephone: string | null } | null
}

/** Réservation Airbnb / Booking / Vrbo de ce logement (flux iCal, départ = dernière nuit + 1). */
export type IcalResa = {
  id: string
  label: string
  platform: 'airbnb' | 'booking' | 'vrbo' | null
  dateArrivee: string
  dateDepart: string
}

interface Props {
  logement: Logement
  sejours: Sejour[]
  contractsCount: number
  icalStatus: LogementIcalFeedStatus[]
  voyageurs: VoyageurOption[]
  /** Date du jour à Paris, calculée par le serveur (évite l'heure UTC et un écart serveur / navigateur) */
  today?: string
  icalResas?: IcalResa[]
  /** Carte en plus en bas de la colonne de droite (configuration SIBA au Portugal) */
  sideExtra?: React.ReactNode
}

const TYPE_LABELS: Record<string, string> = {
  'gite': 'Gîte',
  'chambres-hotes': "Chambres d'hôtes",
  'appartement': 'Appartement',
  'studio': 'Studio',
  'maison': 'Maison',
  'villa': 'Villa',
  'autre': 'Autre',
}

const EQUIPEMENT_LABELS: Record<string, { label: string; Icon: React.ElementType }> = {
  'wifi':           { label: 'Wi-Fi',          Icon: WifiHigh },
  'parking':        { label: 'Parking',        Icon: Car },
  'piscine':        { label: 'Piscine',        Icon: SwimmingPool },
  'climatisation':  { label: 'Climatisation',  Icon: Snowflake },
  'chauffage':      { label: 'Chauffage',      Icon: Fire },
  'lave-linge':     { label: 'Lave-linge',     Icon: WashingMachine },
  'lave-vaisselle': { label: 'Lave-vaisselle', Icon: ForkKnife },
  'tv':             { label: 'TV',             Icon: Television },
  'jardin':         { label: 'Jardin',         Icon: Tree },
  'terrasse':       { label: 'Terrasse',       Icon: Chair },
  'balcon':         { label: 'Balcon',         Icon: Plant },
  'pmr':            { label: 'Accès PMR',      Icon: Wheelchair },
  'ascenseur':      { label: 'Ascenseur',      Icon: Elevator },
  'cheminee':       { label: 'Cheminée',       Icon: Campfire },
  'spa':            { label: 'Spa / jacuzzi',  Icon: Bathtub },
}

const PLATFORM_LABEL: Record<string, string> = { airbnb: 'Airbnb', booking: 'Booking', vrbo: 'Vrbo' }

// ─── Dates (chaînes AAAA-MM-JJ, calculs en UTC : pas d'écart de fuseau) ─────

function toUtc(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}
function addDays(iso: string, n: number): string {
  return new Date(toUtc(iso) + n * 86400000).toISOString().slice(0, 10)
}
function daysBetween(a: string, b: string): number {
  return Math.round((toUtc(b) - toUtc(a)) / 86400000)
}
function fmtDate(iso: string, withYear = false): string {
  return new Date(toUtc(iso)).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC',
  })
}
function fmtDay(iso: string): { day: string; month: string; weekday: string } {
  const d = new Date(toUtc(iso))
  return {
    day: String(d.getUTCDate()),
    month: d.toLocaleDateString('fr-FR', { month: 'short', timeZone: 'UTC' }).replace('.', ''),
    weekday: d.toLocaleDateString('fr-FR', { weekday: 'short', timeZone: 'UTC' }).replace('.', ''),
  }
}
function fmtEur(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
}

// Échelle officielle du DPE : ne pas la recolorer aux couleurs de la marque
function dpeColor(letter: string): { bg: string; fg: string; border: string } {
  switch (letter) {
    case 'A': return { bg: 'rgba(34,197,94,0.12)',  fg: '#16a34a', border: 'rgba(34,197,94,0.30)' }
    case 'B': return { bg: 'rgba(132,204,22,0.12)', fg: '#65a30d', border: 'rgba(132,204,22,0.30)' }
    case 'C': return { bg: 'rgba(234,179,8,0.12)',  fg: '#ca8a04', border: 'rgba(234,179,8,0.30)' }
    case 'D': return { bg: 'rgba(245,158,11,0.12)', fg: '#d97706', border: 'rgba(245,158,11,0.30)' }
    case 'E': return { bg: 'rgba(249,115,22,0.12)', fg: '#ea580c', border: 'rgba(249,115,22,0.30)' }
    case 'F': return { bg: 'rgba(239,68,68,0.12)',  fg: 'var(--danger)', border: 'rgba(239,68,68,0.30)' }
    case 'G': return { bg: 'rgba(127,29,29,0.18)',  fg: '#991b1b', border: 'rgba(127,29,29,0.40)' }
    default:  return { bg: 'var(--surface)',        fg: 'var(--text-2)', border: 'var(--border)' }
  }
}
const DPE_SCALE = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

// ─── Petits composants ───────────────────────────────────────────────────────

function CopyButton({ value, label = 'Copier' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  async function onClick() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* presse-papiers indisponible */ }
  }
  return (
    <button type="button" onClick={onClick} style={s.copyBtn} aria-label={`${label} : ${value}`}>
      {copied ? <Check size={12} weight="bold" /> : <Copy size={12} weight="bold" />}
      {copied ? 'Copié' : label}
    </button>
  )
}

function Section({ id, icon, title, subtitle, action, children }: {
  id?: string; icon: React.ReactNode; title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <section id={id} style={s.section}>
      <header style={s.sectionHead}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <span style={s.iconBox}>{icon}</span>
          <div style={{ minWidth: 0 }}>
            <h3 style={s.sectionTitle}>{title}</h3>
            {subtitle && <p style={s.sectionSub}>{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label style={{ ...s.editLabel, ...(wide ? { gridColumn: '1 / -1' } : {}) }}>
      <span>{label}</span>
      {children}
    </label>
  )
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function LogementDetail({ logement: l, sejours, icalStatus, voyageurs, today: todayProp, icalResas = [], sideExtra }: Props) {
  const today = todayProp ?? new Date().toISOString().slice(0, 10)
  const isPT = (l.pays ?? 'FR') === 'PT'

  // ─── Brouillons de l'édition sur place ───
  const [draftCapacite, setDraftCapacite] = useState(l.capacite_max)
  const [draftSurface, setDraftSurface] = useState<number | null>(l.surface_m2)
  const [draftChambres, setDraftChambres] = useState<number | null>(l.nb_chambres)
  const [draftLits, setDraftLits] = useState<number | null>(l.nb_lits)
  const [draftSdb, setDraftSdb] = useState<number | null>(l.nb_sdb)
  const [draftNumeroEnreg, setDraftNumeroEnreg] = useState(l.numero_enregistrement ?? '')
  const [draftClassement, setDraftClassement] = useState<number | null>(l.classement_etoiles)
  const [draftDpe, setDraftDpe] = useState(l.dpe ?? '')
  const [draftDescription, setDraftDescription] = useState(l.description ?? '')
  const [draftDescriptionPt, setDraftDescriptionPt] = useState(l.description_pt ?? '')
  const [draftDescriptionEn, setDraftDescriptionEn] = useState(l.description_en ?? '')
  const [draftConditions, setDraftConditions] = useState(l.conditions_annulation ?? '')
  const [draftConditionsPt, setDraftConditionsPt] = useState(l.conditions_annulation_pt ?? '')
  const [draftConditionsEn, setDraftConditionsEn] = useState(l.conditions_annulation_en ?? '')
  const [draftReglement, setDraftReglement] = useState(l.reglement_interieur ?? '')
  const [draftReglementPt, setDraftReglementPt] = useState(l.reglement_interieur_pt ?? '')
  const [draftReglementEn, setDraftReglementEn] = useState(l.reglement_interieur_en ?? '')
  const contratOpts = contratOptions(l.contrat_options)
  const [draftRegime, setDraftRegime] = useState<RegimeAvance>(contratOpts.regime)
  const [draftDelaiCaution, setDraftDelaiCaution] = useState(contratOpts.delai_caution_jours)
  const [draftCharges, setDraftCharges] = useState(contratOpts.charges_incluses)
  const [draftClauses, setDraftClauses] = useState(l.clauses_particulieres ?? '')
  const [draftClausesPt, setDraftClausesPt] = useState(l.clauses_particulieres_pt ?? '')
  const [draftClausesEn, setDraftClausesEn] = useState(l.clauses_particulieres_en ?? '')
  const [draftTarifNuit, setDraftTarifNuit] = useState<number | null>(l.tarif_nuitee_moyen)
  const [draftFraisMenage, setDraftFraisMenage] = useState<number | null>(l.frais_menage)
  const [draftCaution, setDraftCaution] = useState<number | null>(l.caution)
  const [draftMethodesPaiement, setDraftMethodesPaiement] = useState(l.methodes_paiement ?? '')
  const [draftEquipements, setDraftEquipements] = useState<string[]>(l.equipements ?? [])
  const [draftAnimaux, setDraftAnimaux] = useState(l.animaux_acceptes ?? false)
  const [draftFumeur, setDraftFumeur] = useState(l.fumeur_accepte ?? false)
  const [draftLienAirbnb, setDraftLienAirbnb] = useState(l.lien_airbnb ?? '')
  const [draftLienBooking, setDraftLienBooking] = useState(l.lien_booking ?? '')
  const [draftLienGmb, setDraftLienGmb] = useState(l.lien_gmb ?? '')
  const [draftLienSiteDirect, setDraftLienSiteDirect] = useState(l.lien_site_direct ?? '')
  const [draftLienDriing, setDraftLienDriing] = useState(l.lien_driing ?? '')
  const [draftIcalAirbnb, setDraftIcalAirbnb] = useState(l.ical_airbnb ?? '')
  const [draftIcalBooking, setDraftIcalBooking] = useState(l.ical_booking ?? '')
  const [draftIcalVrbo, setDraftIcalVrbo] = useState(l.ical_vrbo ?? '')
  const [draftIcalAutre, setDraftIcalAutre] = useState(l.ical_autre ?? '')
  const [draftPropNom, setDraftPropNom] = useState(l.proprietaire_nom ?? '')
  const [draftPropEmail, setDraftPropEmail] = useState(l.proprietaire_email ?? '')
  const [draftPropTel, setDraftPropTel] = useState(l.proprietaire_telephone ?? '')
  const [draftHonoraires, setDraftHonoraires] = useState<number | null>(l.honoraires_pct)
  const [draftIban, setDraftIban] = useState(l.iban ?? '')
  const [draftBic, setDraftBic] = useState(l.bic ?? '')
  const [draftNom, setDraftNom] = useState(l.nom)
  const [draftType, setDraftType] = useState(l.type_logement ?? '')
  const [draftAdresse, setDraftAdresse] = useState(l.adresse)
  const [draftTelephone, setDraftTelephone] = useState(l.telephone ?? '')
  const [draftPays, setDraftPays] = useState(l.pays ?? 'FR')
  const [draftNumeroAl, setDraftNumeroAl] = useState(l.numero_al ?? '')
  const [draftHeureArrivee, setDraftHeureArrivee] = useState(l.heure_arrivee ?? '')
  const [draftHeureDepart, setDraftHeureDepart] = useState(l.heure_depart ?? '')
  const [draftWifiNom, setDraftWifiNom] = useState(l.wifi_nom ?? '')
  const [draftWifiMdp, setDraftWifiMdp] = useState(l.wifi_mdp ?? '')
  const [draftCodeAcces, setDraftCodeAcces] = useState(l.code_acces ?? '')
  const [draftUrgenceNom, setDraftUrgenceNom] = useState(l.contact_urgence_nom ?? '')
  const [draftUrgenceTel, setDraftUrgenceTel] = useState(l.contact_urgence_tel ?? '')
  const [draftMenageNom, setDraftMenageNom] = useState(l.contact_menage_nom ?? '')
  const [draftMenageTel, setDraftMenageTel] = useState(l.contact_menage_tel ?? '')

  // Modale « Nouvelle réservation » (vide, ou préremplie depuis une réservation Airbnb / Booking)
  const [quick, setQuick] = useState<null | { defaults?: { logementNom?: string; dateArrivee?: string; dateDepart?: string }; platform?: 'airbnb' | 'booking' | 'vrbo' }>(null)

  // ─── Enregistrement ───
  const saveCaracteristiques = () => updateLogement(l.id, {
    capacite_max: draftCapacite,
    surface_m2: draftSurface,
    nb_chambres: draftChambres,
    nb_lits: draftLits,
    nb_sdb: draftSdb,
    numero_enregistrement: draftNumeroEnreg || null,
    classement_etoiles: draftClassement,
    dpe: draftDpe || null,
  })
  const saveDescription = () => updateLogement(l.id, {
    description: draftDescription,
    description_pt: draftDescriptionPt || null,
    description_en: draftDescriptionEn || null,
  })
  const saveConditions = () => updateLogement(l.id, {
    conditions_annulation: draftConditions.trim() || null,
    conditions_annulation_pt: draftConditionsPt || null,
    conditions_annulation_en: draftConditionsEn || null,
  })
  const saveReglement = () => updateLogement(l.id, {
    reglement_interieur: draftReglement.trim() || null,
    reglement_interieur_pt: draftReglementPt || null,
    reglement_interieur_en: draftReglementEn || null,
  })
  const saveContrat = () => updateLogement(l.id, {
    contrat_options: { regime: draftRegime, delai_caution_jours: draftDelaiCaution, charges_incluses: draftCharges },
    clauses_particulieres: draftClauses.trim() || null,
    clauses_particulieres_pt: draftClausesPt.trim() || null,
    clauses_particulieres_en: draftClausesEn.trim() || null,
  })
  const resetContrat = () => {
    setDraftRegime(contratOpts.regime); setDraftDelaiCaution(contratOpts.delai_caution_jours); setDraftCharges(contratOpts.charges_incluses)
    setDraftClauses(l.clauses_particulieres ?? ''); setDraftClausesPt(l.clauses_particulieres_pt ?? ''); setDraftClausesEn(l.clauses_particulieres_en ?? '')
  }
  const saveTarifs = () => updateLogement(l.id, {
    tarif_nuitee_moyen: draftTarifNuit,
    frais_menage: draftFraisMenage,
    caution: draftCaution,
    methodes_paiement: draftMethodesPaiement || undefined,
  })
  const saveEquipements = () => updateLogement(l.id, {
    equipements: draftEquipements,
    animaux_acceptes: draftAnimaux,
    fumeur_accepte: draftFumeur,
  })
  const saveLiens = () => updateLogement(l.id, {
    lien_airbnb: draftLienAirbnb || null,
    lien_booking: draftLienBooking || null,
    lien_gmb: draftLienGmb || null,
    lien_site_direct: draftLienSiteDirect || null,
    lien_driing: draftLienDriing || null,
  })
  async function saveCalendriers() {
    const urls = [draftIcalAirbnb, draftIcalBooking, draftIcalVrbo, draftIcalAutre].map(u => u.trim())
    if (urls.some(u => u && !/^(https?|webcal):\/\//i.test(u))) {
      return { error: 'Un lien de calendrier commence par https:// (ou webcal://).' }
    }
    return updateLogement(l.id, {
      ical_airbnb: urls[0] || null,
      ical_booking: urls[1] || null,
      ical_vrbo: urls[2] || null,
      ical_autre: urls[3] || null,
    })
  }
  const saveProprietaire = () => updateLogement(l.id, {
    proprietaire_nom: draftPropNom || null,
    proprietaire_email: draftPropEmail || null,
    proprietaire_telephone: draftPropTel || null,
    honoraires_pct: draftHonoraires,
    iban: draftIban.trim() || null,
    bic: draftBic.trim() || null,
  })
  async function saveInfosGenerales() {
    if (!draftNom.trim()) return { error: 'Le nom du logement est requis.' }
    if (!draftAdresse.trim()) return { error: "L'adresse est requise." }
    return updateLogement(l.id, {
      nom: draftNom.trim(),
      type_logement: draftType || null,
      adresse: draftAdresse.trim(),
      telephone: draftTelephone,
      pays: draftPays,
      numero_al: draftPays === 'PT' ? (draftNumeroAl || null) : null,
    })
  }
  const saveInfosPratiques = () => updateLogement(l.id, {
    heure_arrivee: draftHeureArrivee || undefined,
    heure_depart: draftHeureDepart || undefined,
    wifi_nom: draftWifiNom,
    wifi_mdp: draftWifiMdp,
    code_acces: draftCodeAcces,
  })
  const saveContacts = () => updateLogement(l.id, {
    contact_urgence_nom: draftUrgenceNom || null,
    contact_urgence_tel: draftUrgenceTel || null,
    contact_menage_nom: draftMenageNom || null,
    contact_menage_tel: draftMenageTel || null,
  })

  // ─── Réservations : séjours saisis + réservations Airbnb / Booking non encore complétées ───
  const sejourArrivals = new Set(sejours.map(sj => sj.date_arrivee))
  const icalFree = icalResas.filter(r => !sejourArrivals.has(r.dateArrivee))

  type Stay = {
    key: string
    kind: 'sejour' | 'ical'
    arrive: string
    depart: string
    name: string
    amount: number | null
    sejour?: Sejour
    ical?: IcalResa
  }
  const stays: Stay[] = [
    ...sejours.map(sj => ({
      key: `s-${sj.id}`, kind: 'sejour' as const, arrive: sj.date_arrivee, depart: sj.date_depart,
      name: sj.voyageurs ? `${sj.voyageurs.prenom} ${sj.voyageurs.nom}`.trim() : 'Séjour privé',
      amount: sj.montant, sejour: sj,
    })),
    ...icalFree.map(r => ({
      key: `i-${r.id}`, kind: 'ical' as const, arrive: r.dateArrivee, depart: r.dateDepart,
      name: r.label, amount: null, ical: r,
    })),
  ]
  const upcoming = stays
    .filter(st => st.depart > today)
    .sort((a, b) => a.arrive.localeCompare(b.arrive))
  const current = upcoming.find(st => st.arrive <= today)
  const nextArrival = upcoming.find(st => st.arrive >= today)

  // ─── Chiffres de l'année (date du jour à Paris) ───
  const year = today.slice(0, 4)
  const yearStart = `${year}-01-01`
  const yearEnd = `${year}-12-31`
  const staysYear = stays.filter(st => st.arrive >= yearStart && st.arrive <= yearEnd)
  const montantYear = staysYear.reduce((sum, st) => sum + (st.amount ?? 0), 0)
  const montantAVenir = staysYear.filter(st => st.arrive > today).reduce((sum, st) => sum + (st.amount ?? 0), 0)
  const icalYear = staysYear.filter(st => st.kind === 'ical').length
  const elapsed = Math.max(1, daysBetween(yearStart, today))
  const nights = new Set<string>()
  for (const st of stays) {
    let d = st.arrive < yearStart ? yearStart : st.arrive
    const end = st.depart < today ? st.depart : today
    let guard = 0
    while (d < end && guard++ < 400) { nights.add(d); d = addDays(d, 1) }
  }
  const occupation = Math.min(100, Math.round((nights.size / elapsed) * 100))

  const recentVoyageurs = (() => {
    const seen = new Set<string>()
    return [...sejours]
      .filter(sj => sj.date_arrivee <= today)
      .sort((a, b) => b.date_arrivee.localeCompare(a.date_arrivee))
      .filter(sj => {
        if (!sj.voyageurs || seen.has(sj.voyageur_id)) return false
        seen.add(sj.voyageur_id)
        return true
      })
      .slice(0, 5)
  })()

  // ─── Ce qui manque à la fiche ───
  const numeroOk = isPT ? !!l.numero_al : !!l.numero_enregistrement
  const checklist: Array<{ key: string; label: string; done: boolean; href: string }> = [
    { key: 'photos', label: 'Photos', done: !!l.photo_couverture_url, href: '#photos' },
    { key: 'calendriers', label: 'Calendrier Airbnb / Booking', done: icalStatus.length > 0, href: '#modifier-calendriers' },
    { key: 'numero', label: isPT ? 'Numéro AL' : "Numéro d'enregistrement", done: numeroOk, href: isPT ? '#modifier-infos' : '#modifier-caracteristiques' },
    { key: 'accueil', label: 'Arrivée des voyageurs', done: !!(l.heure_arrivee && (l.wifi_nom || l.code_acces)), href: '#modifier-accueil' },
    { key: 'tarifs', label: 'Tarifs', done: !!l.tarif_nuitee_moyen, href: '#modifier-tarifs' },
    { key: 'description', label: 'Description', done: !!l.description, href: '#modifier-description' },
    { key: 'annulation', label: "Conditions d'annulation", done: !!l.conditions_annulation, href: '#modifier-annulation' },
    { key: 'reglement', label: 'Règlement intérieur', done: !!l.reglement_interieur, href: '#modifier-reglement' },
  ]
  const doneCount = checklist.filter(c => c.done).length
  const completion = Math.round((doneCount / checklist.length) * 100)
  const missing = checklist.filter(c => !c.done)

  const facts: Array<{ Icon: React.ElementType; value: string; label: string }> = [
    { Icon: Users, value: String(l.capacite_max), label: l.capacite_max > 1 ? 'voyageurs' : 'voyageur' },
    ...(l.nb_chambres ? [{ Icon: Door, value: String(l.nb_chambres), label: l.nb_chambres > 1 ? 'chambres' : 'chambre' }] : []),
    ...(l.nb_lits ? [{ Icon: Bed, value: String(l.nb_lits), label: l.nb_lits > 1 ? 'lits' : 'lit' }] : []),
    ...(l.nb_sdb ? [{ Icon: Shower, value: String(l.nb_sdb), label: l.nb_sdb > 1 ? 'salles de bain' : 'salle de bain' }] : []),
    ...(l.surface_m2 ? [{ Icon: Ruler, value: `${l.surface_m2}`, label: 'm²' }] : []),
  ]

  const annonces = [
    { key: 'airbnb', label: 'Airbnb', url: l.lien_airbnb, color: SOURCE_FG.airbnb, letter: 'A' },
    { key: 'booking', label: 'Booking.com', url: l.lien_booking, color: SOURCE_FG.booking, letter: 'B' },
    { key: 'gmb', label: 'Fiche Google', url: l.lien_gmb, color: 'var(--accent-text)', letter: 'G' },
    { key: 'driing', label: 'Driing', url: l.lien_driing, color: BROWN, letter: 'D' },
    { key: 'site', label: 'Site de réservation directe', url: l.lien_site_direct, color: AMBER, letter: '' },
  ].filter(a => !!a.url)

  type Contact = { key: string; role: string; Icon: React.ElementType; color: string; name: string; tel: string | null }
  const contacts: Contact[] = []
  if (l.contact_menage_nom) contacts.push({ key: 'menage', role: 'Ménage', Icon: Broom, color: '#B83A7C', name: l.contact_menage_nom, tel: l.contact_menage_tel })
  if (l.contact_urgence_nom) contacts.push({ key: 'urgence', role: 'Urgence', Icon: Warning, color: 'var(--danger)', name: l.contact_urgence_nom, tel: l.contact_urgence_tel })
  if (l.telephone) contacts.push({ key: 'logement', role: 'Logement', Icon: House, color: 'var(--accent-text)', name: 'Téléphone du logement', tel: l.telephone })

  const typeLabel = l.type_logement ? (TYPE_LABELS[l.type_logement] ?? l.type_logement) : 'Logement'
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.adresse)}`

  return (
    <div style={s.page}>
      <Link href="/dashboard/logements" style={s.backLink}>
        <ArrowLeft size={14} weight="bold" />
        Mes logements
      </Link>

      {/* ─── Bandeau ─── */}
      <div style={s.hero}>
        <div style={s.heroMain}>
          <div style={s.eyebrow}>
            <House size={14} weight="fill" />
            {typeLabel} · {isPT ? 'Portugal' : 'France'}
          </div>
          <h1 style={s.heroTitle}>{l.nom}</h1>
          <a href={mapsHref} target="_blank" rel="noopener noreferrer" style={s.heroAddress}>
            <MapPin size={14} weight="fill" />
            <span>{l.adresse}</span>
            <ArrowSquareOut size={12} style={{ opacity: 0.6, flexShrink: 0 }} />
          </a>

          <div style={s.badges}>
            {l.actif === false && <span style={{ ...s.badge, ...s.badgeMuted }}>En pause</span>}
            {l.classement_etoiles != null && l.classement_etoiles > 0 && (
              <span style={{ ...s.badge, ...s.badgeAmber }} aria-label={`${l.classement_etoiles} étoiles`}>
                {Array.from({ length: l.classement_etoiles }).map((_, i) => <Star key={i} size={11} weight="fill" />)}
                Classé
              </span>
            )}
            {!isPT && l.dpe && (() => {
              const dc = dpeColor(l.dpe)
              return <span style={{ ...s.badge, background: dc.bg, color: dc.fg, borderColor: dc.border }}>DPE {l.dpe}</span>
            })()}
            {numeroOk ? (
              <span style={s.badge}><ShieldCheck size={12} weight="fill" /> {isPT ? `AL ${l.numero_al}` : `N° ${l.numero_enregistrement}`}</span>
            ) : (
              <a href={isPT ? '#modifier-infos' : '#modifier-caracteristiques'} style={{ ...s.badge, ...s.badgeAmber, textDecoration: 'none' }}>
                <Warning size={12} weight="fill" /> {isPT ? 'Numéro AL à renseigner' : "Numéro d'enregistrement à renseigner"}
              </a>
            )}
          </div>

          {facts.length > 0 && (
            <div style={s.facts}>
              {facts.map(f => (
                <div key={f.label} style={s.fact}>
                  <f.Icon size={18} weight="duotone" color="var(--accent-text)" />
                  <span style={s.factValue}>{f.value}</span>
                  <span style={s.factLabel}>{f.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Ce qui manque à la fiche */}
          <div style={s.completion}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 260px', minWidth: 0 }}>
              <div style={{ ...s.ring, background: `conic-gradient(var(--accent-text) ${completion * 3.6}deg, var(--border) 0deg)` }}>
                <span style={s.ringInner}>{completion} %</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={s.completionTitle}>{missing.length === 0 ? 'Ta fiche est complète' : 'Ta fiche est presque prête'}</div>
                <div style={s.kpiSub}>
                  {missing.length === 0
                    ? 'Contrats, messages et planning ménage reprennent ces informations.'
                    : `Encore ${missing.length} point${missing.length > 1 ? 's' : ''} : ils sont repris dans tes contrats, messages et ménages.`}
                </div>
              </div>
            </div>
            <div style={s.checkChips}>
              {checklist.map(c => c.done ? (
                <span key={c.key} style={{ ...s.checkChip, ...s.checkChipDone }}>
                  <CheckCircle size={14} weight="fill" /> {c.label}
                </span>
              ) : (
                <a key={c.key} href={c.href} style={s.checkChip}>
                  <Circle size={14} weight="bold" /> {c.label}
                  <ArrowRight size={11} weight="bold" />
                </a>
              ))}
            </div>
          </div>

          <div style={s.actions}>
            <button type="button" onClick={() => setQuick({})} style={s.btnPrimary}>
              <Plus size={15} weight="bold" /> Nouvelle réservation
            </button>
            <Link href={`/dashboard/calendrier?logement=${encodeURIComponent(l.nom)}`} style={s.btnGhost}>
              <CalendarBlank size={15} weight="bold" /> Calendrier
            </Link>
            <Link href="/dashboard/calendrier/menage" style={s.btnGhost}>
              <Broom size={15} weight="bold" /> Ménages
            </Link>
            <Link href={`/dashboard/gabarits?logement=${l.id}`} style={s.btnGhost}>
              <ChatText size={15} weight="bold" /> Messages
            </Link>
            <Link href={`/dashboard/finances/logement/${l.id}`} style={s.btnGhost}>
              <CurrencyEur size={15} weight="bold" /> Finances
            </Link>
          </div>
        </div>

        <div id="photos" style={s.heroPhotos}>
          <PhotosCard
            logementId={l.id}
            nom={l.nom}
            cover={l.photo_couverture_url}
            photos={[l.photo_couverture_url, ...(l.photos_urls ?? [])].filter((u, i, arr): u is string => !!u && arr.indexOf(u) === i)}
          />
        </div>
      </div>

      {/* ─── Chiffres de l'année ─── */}
      <div style={s.kpis}>
        <div style={s.kpi}>
          <span style={s.kpiLabel}><CurrencyEur size={14} weight="bold" /> Séjours {year}</span>
          <span style={s.kpiValue}>{fmtEur(montantYear)}</span>
          <span style={s.kpiSub}>
            {montantAVenir > 0 ? `dont ${fmtEur(montantAVenir)} à venir` : 'montants des séjours saisis'}
            {icalYear > 0 && `, hors ${icalYear} résa${icalYear > 1 ? 's' : ''} sans montant`}
          </span>
        </div>
        <div style={s.kpi}>
          <span style={s.kpiLabel}><TrendUp size={14} weight="bold" /> Occupation</span>
          <span style={s.kpiValue}>{occupation} %</span>
          <div style={s.bar}><div style={{ ...s.barFill, width: `${occupation}%` }} /></div>
          <span style={s.kpiSub}>{nights.size} nuit{nights.size > 1 ? 's' : ''} sur {elapsed} depuis le 1er janvier</span>
        </div>
        <div style={s.kpi}>
          <span style={s.kpiLabel}><CalendarCheck size={14} weight="bold" /> Réservations {year}</span>
          <span style={s.kpiValue}>{staysYear.length}</span>
          <span style={s.kpiSub}>{icalYear > 0 ? `dont ${icalYear} Airbnb / Booking à compléter` : 'séjours saisis et synchronisés'}</span>
        </div>
        <div style={s.kpi}>
          <span style={s.kpiLabel}><SignIn size={14} weight="bold" /> {current ? 'En ce moment' : 'Prochaine arrivée'}</span>
          {current ? (
            <>
              <span style={s.kpiValueSm}>{current.name}</span>
              <span style={s.kpiSub}>départ le {fmtDate(current.depart)}</span>
            </>
          ) : nextArrival ? (
            <>
              <span style={s.kpiValueSm}>{fmtDate(nextArrival.arrive)}</span>
              <span style={s.kpiSub}>{nextArrival.name}, {daysBetween(nextArrival.arrive, nextArrival.depart)} nuit{daysBetween(nextArrival.arrive, nextArrival.depart) > 1 ? 's' : ''}</span>
            </>
          ) : (
            <>
              <span style={{ ...s.kpiValueSm, color: 'var(--text-3)' }}>Aucune</span>
              <span style={s.kpiSub}>pas d&apos;arrivée prévue</span>
            </>
          )}
        </div>
      </div>

      {/* ─── 2 colonnes ─── */}
      <div style={s.columns}>
        <div style={s.colMain}>
          {/* Réservations à venir */}
          <Section
            id="reservations"
            icon={<CalendarCheck size={17} weight="fill" />}
            title="Réservations à venir"
            subtitle="Séjours saisis et réservations Airbnb, Booking ou Vrbo synchronisées"
            action={<Link href="/dashboard/reservations" style={s.headLink}>Toutes <ArrowRight size={11} weight="bold" /></Link>}
          >
            {upcoming.length === 0 ? (
              <div style={s.emptyBox}>
                <CalendarBlank size={26} weight="duotone" color="var(--accent-text)" />
                <strong style={{ fontSize: '14px', color: 'var(--text)' }}>Aucune réservation à venir</strong>
                <span style={{ fontSize: '12.5px', color: 'var(--text-3)', lineHeight: 1.5 }}>
                  {icalStatus.length > 0
                    ? 'Tes réservations Airbnb et Booking apparaîtront ici dès qu\'elles tombent.'
                    : 'Connecte ton calendrier Airbnb ou Booking : tes réservations arriveront toutes seules.'}
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button type="button" onClick={() => setQuick({})} style={s.btnSoft}><Plus size={13} weight="bold" /> Ajouter une réservation</button>
                  {icalStatus.length === 0 && <a href="#modifier-calendriers" style={s.btnSoft}><LinkSimple size={13} weight="bold" /> Connecter un calendrier</a>}
                </div>
              </div>
            ) : (
              <div style={s.stayList}>
                {upcoming.slice(0, 6).map(st => {
                  const d = fmtDay(st.arrive)
                  const n = daysBetween(st.arrive, st.depart)
                  const inProgress = st.arrive <= today
                  const pf = st.ical?.platform
                  const pfColor = pf ? SOURCE_FG[pf] : 'var(--accent-text)'
                  const sj = st.sejour
                  const body = (
                    <>
                      <div style={{ ...s.dateBlock, ...(inProgress ? s.dateBlockOn : {}) }}>
                        <span style={s.dateWeekday}>{d.weekday}</span>
                        <span style={s.dateDay}>{d.day}</span>
                        <span style={s.dateMonth}>{d.month}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={s.stayName}>{st.name}</span>
                        <span style={s.stayMeta}>
                          {fmtDate(st.arrive)} <ArrowRight size={10} weight="bold" /> {fmtDate(st.depart)} · {n} nuit{n > 1 ? 's' : ''}
                          {st.amount != null && st.amount > 0 && <> · <strong style={{ color: 'var(--text)' }}>{fmtEur(st.amount)}</strong></>}
                        </span>
                        <span style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {inProgress && <span style={{ ...s.pill, ...s.pillOn }}>En cours</span>}
                          {st.kind === 'ical' ? (
                            <span style={{ ...s.pill, color: pfColor, borderColor: `color-mix(in srgb, ${pfColor} 35%, transparent)`, background: `color-mix(in srgb, ${pfColor} 10%, transparent)` }}>
                              {pf ? PLATFORM_LABEL[pf] : 'Synchronisée'}
                            </span>
                          ) : sj && !sj.voyageurs ? (
                            <span style={s.pill}>Séjour privé</span>
                          ) : sj?.contrat_statut === 'signe' ? (
                            <span style={{ ...s.pill, ...s.pillOn }}><Check size={10} weight="bold" /> Contrat signé</span>
                          ) : sj?.contrat_statut === 'en_attente' ? (
                            <span style={{ ...s.pill, ...s.pillAmber }}>Contrat à signer</span>
                          ) : (
                            <span style={s.pill}>Sans contrat</span>
                          )}
                        </span>
                      </div>
                    </>
                  )
                  if (st.kind === 'ical' && st.ical) {
                    const r = st.ical
                    return (
                      <div key={st.key} style={s.stay}>
                        {body}
                        <button
                          type="button"
                          onClick={() => setQuick({ defaults: { logementNom: l.nom, dateArrivee: r.dateArrivee, dateDepart: r.dateDepart }, platform: r.platform ?? undefined })}
                          style={s.btnSoft}
                          title="Ajoute le voyageur : déclaration, montant et fiche voyageur"
                        >
                          <Plus size={12} weight="bold" /> Compléter
                        </button>
                      </div>
                    )
                  }
                  const href = sj?.voyageurs ? `/dashboard/voyageurs/${sj.voyageurs.id}` : `/dashboard/calendrier?logement=${encodeURIComponent(l.nom)}`
                  return (
                    <Link key={st.key} href={href} style={{ ...s.stay, textDecoration: 'none' }}>
                      {body}
                      <ArrowRight size={14} weight="bold" color="var(--text-3)" style={{ flexShrink: 0 }} />
                    </Link>
                  )
                })}
                {upcoming.length > 6 && (
                  <Link href={`/dashboard/calendrier?logement=${encodeURIComponent(l.nom)}`} style={s.moreLink}>
                    {upcoming.length - 6} autre{upcoming.length - 6 > 1 ? 's' : ''} dans le calendrier <ArrowRight size={11} weight="bold" />
                  </Link>
                )}
              </div>
            )}
          </Section>

          {/* Calendriers connectés */}
          <EditableCard
            id="calendriers"
            title="Calendriers connectés"
            subtitle="Tes réservations Airbnb, Booking et Vrbo arrivent toutes seules, les ménages se planifient"
            icon={<LinkSimple size={17} weight="bold" />}
            onSave={saveCalendriers}
            onCancel={() => {
              setDraftIcalAirbnb(l.ical_airbnb ?? '')
              setDraftIcalBooking(l.ical_booking ?? '')
              setDraftIcalVrbo(l.ical_vrbo ?? '')
              setDraftIcalAutre(l.ical_autre ?? '')
            }}
            hasValue={icalStatus.length > 0}
            addLabel="Connecter"
            emptyView={
              <div style={s.emptyBox}>
                <CalendarBlank size={26} weight="duotone" color="var(--accent-text)" />
                <strong style={{ fontSize: '14px', color: 'var(--text)' }}>Aucun calendrier connecté</strong>
                <span style={{ fontSize: '12.5px', color: 'var(--text-3)', lineHeight: 1.5, maxWidth: '440px' }}>
                  Colle le lien d&apos;export de ton annonce Airbnb ou Booking : tes réservations s&apos;affichent ici,
                  dans le calendrier et dans le planning de ton équipe de ménage.
                </span>
                <a href="#modifier-calendriers" style={s.btnSoft}><LinkSimple size={13} weight="bold" /> Connecter un calendrier</a>
              </div>
            }
            view={<IcalSyncSection logementId={l.id} status={icalStatus} />}
            edit={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={s.editGrid2}>
                  <Field label="Airbnb"><input style={s.editInput} type="url" value={draftIcalAirbnb} onChange={e => setDraftIcalAirbnb(e.target.value)} placeholder="https://www.airbnb.fr/calendar/ical/…" /></Field>
                  <Field label="Booking.com"><input style={s.editInput} type="url" value={draftIcalBooking} onChange={e => setDraftIcalBooking(e.target.value)} placeholder="https://admin.booking.com/…/ical.html?…" /></Field>
                  <Field label="Vrbo / Abritel"><input style={s.editInput} type="url" value={draftIcalVrbo} onChange={e => setDraftIcalVrbo(e.target.value)} placeholder="https://www.vrbo.com/icalendar/…" /></Field>
                  <Field label="Autre (site, logiciel…)"><input style={s.editInput} type="url" value={draftIcalAutre} onChange={e => setDraftIcalAutre(e.target.value)} placeholder="https://…" /></Field>
                </div>
                <div style={s.tip}>
                  <Info size={15} weight="fill" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>
                    <strong>Airbnb</strong> : Calendrier, ton annonce, Disponibilités, Synchroniser les calendriers, Exporter le calendrier.{' '}
                    <strong>Booking.com</strong> : extranet, Tarifs et disponibilités, Synchroniser les calendriers, Exporter.{' '}
                    <Link href="/dashboard/aide/logements-voyageurs/synchroniser-airbnb-ical" style={{ color: 'var(--accent-text)', fontWeight: 600 }}>Guide pas à pas</Link>
                  </span>
                </div>
              </div>
            }
          />

          {/* Caractéristiques & conformité */}
          <EditableCard
            id="caracteristiques"
            title="Caractéristiques et conformité"
            subtitle={isPT ? 'Capacité et pièces, reprises dans tes contrats' : "Capacité, numéro d'enregistrement, classement et DPE, repris dans tes contrats"}
            icon={<ShieldCheck size={17} weight="fill" />}
            onSave={saveCaracteristiques}
            onCancel={() => {
              setDraftCapacite(l.capacite_max); setDraftSurface(l.surface_m2); setDraftChambres(l.nb_chambres)
              setDraftLits(l.nb_lits); setDraftSdb(l.nb_sdb); setDraftNumeroEnreg(l.numero_enregistrement ?? '')
              setDraftClassement(l.classement_etoiles); setDraftDpe(l.dpe ?? '')
            }}
            view={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={s.tiles}>
                  <div style={s.tile}>
                    <span style={s.tileLabel}>{isPT ? 'Numéro AL' : "Numéro d'enregistrement"}</span>
                    {numeroOk
                      ? <span style={{ ...s.tileValue, fontSize: '15px', wordBreak: 'break-all' }}>{isPT ? l.numero_al : l.numero_enregistrement}</span>
                      : <a href={isPT ? '#modifier-infos' : '#modifier-caracteristiques'} style={s.tileMissing}><Warning size={13} weight="fill" /> À renseigner</a>}
                  </div>
                  <div style={s.tile}>
                    <span style={s.tileLabel}>Classement</span>
                    {l.classement_etoiles
                      ? <span style={{ ...s.tileValue, color: AMBER, display: 'flex', gap: '2px' }}>{Array.from({ length: l.classement_etoiles }).map((_, i) => <Star key={i} size={16} weight="fill" />)}</span>
                      : <span style={{ ...s.tileValue, fontSize: '15px', color: 'var(--text-3)' }}>Non classé</span>}
                  </div>
                  {!isPT && (
                    <div style={{ ...s.tile, flex: '2 1 260px' }}>
                      <span style={s.tileLabel}>Diagnostic de performance énergétique</span>
                      <div style={s.dpeScale} aria-label={l.dpe ? `DPE ${l.dpe}` : 'DPE non renseigné'}>
                        {DPE_SCALE.map(letter => {
                          const dc = dpeColor(letter)
                          const on = l.dpe === letter
                          return (
                            <span key={letter} style={{
                              ...s.dpeCell, background: on ? dc.fg : dc.bg, color: on ? '#fff' : dc.fg,
                              transform: on ? 'scale(1.12)' : undefined, fontWeight: on ? 800 : 600,
                              boxShadow: on ? '0 2px 8px rgba(0,0,0,0.18)' : undefined,
                            }}>{letter}</span>
                          )
                        })}
                      </div>
                      {!l.dpe && <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Non renseigné</span>}
                    </div>
                  )}
                </div>
                <div style={s.inlineFacts}>
                  <span><Users size={14} weight="duotone" /> {l.capacite_max} voyageur{l.capacite_max > 1 ? 's' : ''}</span>
                  <span><Door size={14} weight="duotone" /> {l.nb_chambres ?? '?'} chambre{(l.nb_chambres ?? 0) > 1 ? 's' : ''}</span>
                  <span><Bed size={14} weight="duotone" /> {l.nb_lits ?? '?'} lit{(l.nb_lits ?? 0) > 1 ? 's' : ''}</span>
                  <span><Shower size={14} weight="duotone" /> {l.nb_sdb ?? '?'} salle{(l.nb_sdb ?? 0) > 1 ? 's' : ''} de bain</span>
                  <span><Ruler size={14} weight="duotone" /> {l.surface_m2 ? `${l.surface_m2} m²` : 'surface ?'}</span>
                </div>
              </div>
            }
            edit={
              <div style={s.editGrid}>
                <Field label="Capacité (personnes)"><input style={s.editInput} type="number" min={1} value={draftCapacite} onChange={e => setDraftCapacite(parseInt(e.target.value) || 1)} /></Field>
                <Field label="Surface (m²)"><input style={s.editInput} type="number" min={0} value={draftSurface ?? ''} onChange={e => setDraftSurface(e.target.value ? parseFloat(e.target.value) : null)} /></Field>
                <Field label="Chambres"><input style={s.editInput} type="number" min={0} value={draftChambres ?? ''} onChange={e => setDraftChambres(e.target.value ? parseInt(e.target.value) : null)} /></Field>
                <Field label="Lits"><input style={s.editInput} type="number" min={0} value={draftLits ?? ''} onChange={e => setDraftLits(e.target.value ? parseInt(e.target.value) : null)} /></Field>
                <Field label="Salles de bain"><input style={s.editInput} type="number" min={0} value={draftSdb ?? ''} onChange={e => setDraftSdb(e.target.value ? parseInt(e.target.value) : null)} /></Field>
                {!isPT && (
                  <Field label="Numéro d'enregistrement"><input style={s.editInput} type="text" value={draftNumeroEnreg} onChange={e => setDraftNumeroEnreg(e.target.value)} placeholder="Délivré par ta mairie" /></Field>
                )}
                <Field label={isPT ? 'Classement (étoiles)' : 'Classement Atout France'}>
                  <select style={s.editInput} value={draftClassement ?? ''} onChange={e => setDraftClassement(e.target.value ? parseInt(e.target.value) : null)}>
                    <option value="">Non classé</option>
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} étoile{n > 1 ? 's' : ''}</option>)}
                  </select>
                </Field>
                {!isPT && (
                  <Field label="DPE">
                    <select style={s.editInput} value={draftDpe} onChange={e => setDraftDpe(e.target.value)}>
                      <option value="">Non renseigné</option>
                      {DPE_SCALE.map(x => <option key={x} value={x}>{x}</option>)}
                    </select>
                  </Field>
                )}
                {isPT && <p style={{ ...s.hintText, gridColumn: '1 / -1' }}>Le numéro d&apos;Alojamento Local se renseigne dans Informations générales.</p>}
              </div>
            }
          />

          {/* Équipements */}
          <EditableCard
            id="equipements"
            title="Équipements et règles"
            subtitle="Ce que trouvent tes voyageurs, animaux et tabac compris"
            icon={<Sparkle size={17} weight="fill" />}
            onSave={saveEquipements}
            onCancel={() => { setDraftEquipements(l.equipements ?? []); setDraftAnimaux(l.animaux_acceptes ?? false); setDraftFumeur(l.fumeur_accepte ?? false) }}
            hasValue={!!(l.equipements && l.equipements.length > 0) || l.animaux_acceptes || l.fumeur_accepte}
            addLabel="Ajouter"
            emptyView={<p style={s.emptyHint}>Aucun équipement renseigné pour l&apos;instant.</p>}
            view={
              <div style={s.equipGrid}>
                {(l.equipements ?? []).map(eq => {
                  const def = EQUIPEMENT_LABELS[eq] ?? { label: eq, Icon: Check }
                  return <span key={eq} style={s.equipTile}><def.Icon size={20} weight="duotone" color="var(--accent-text)" />{def.label}</span>
                })}
                <span style={{ ...s.equipTile, ...(l.animaux_acceptes ? {} : s.equipOff) }}><PawPrint size={20} weight="duotone" color={l.animaux_acceptes ? 'var(--accent-text)' : 'var(--text-3)'} />{l.animaux_acceptes ? 'Animaux acceptés' : 'Pas d\'animaux'}</span>
                <span style={{ ...s.equipTile, ...(l.fumeur_accepte ? {} : s.equipOff) }}><Cigarette size={20} weight="duotone" color={l.fumeur_accepte ? 'var(--accent-text)' : 'var(--text-3)'} />{l.fumeur_accepte ? 'Fumeur autorisé' : 'Non-fumeur'}</span>
              </div>
            }
            edit={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={s.equipGrid}>
                  {Object.entries(EQUIPEMENT_LABELS).map(([slug, { label, Icon }]) => {
                    const on = draftEquipements.includes(slug)
                    return (
                      <button
                        key={slug}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setDraftEquipements(prev => on ? prev.filter(e => e !== slug) : [...prev, slug])}
                        style={{ ...s.equipTile, ...s.equipToggle, ...(on ? s.equipToggleOn : {}) }}
                      >
                        <Icon size={20} weight={on ? 'fill' : 'duotone'} />{label}
                        {on && <Check size={12} weight="bold" style={{ position: 'absolute', top: '7px', right: '8px' }} />}
                      </button>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {([
                    { on: draftAnimaux, set: setDraftAnimaux, Icon: PawPrint, label: 'Animaux acceptés' },
                    { on: draftFumeur, set: setDraftFumeur, Icon: Cigarette, label: 'Fumeur autorisé' },
                  ]).map(t => (
                    <button key={t.label} type="button" aria-pressed={t.on} onClick={() => t.set(!t.on)} style={{ ...s.toggleChip, ...(t.on ? s.toggleChipOn : {}) }}>
                      <t.Icon size={15} weight={t.on ? 'fill' : 'duotone'} /> {t.label}
                      <span style={{ ...s.switch, ...(t.on ? s.switchOn : {}) }}><span style={{ ...s.switchDot, ...(t.on ? s.switchDotOn : {}) }} /></span>
                    </button>
                  ))}
                </div>
              </div>
            }
          />

          {/* Tarifs */}
          <EditableCard
            id="tarifs"
            title="Tarifs"
            subtitle="Prix de base repris dans tes contrats et tes calculs"
            icon={<Tag size={17} weight="fill" />}
            onSave={saveTarifs}
            onCancel={() => { setDraftTarifNuit(l.tarif_nuitee_moyen); setDraftFraisMenage(l.frais_menage); setDraftCaution(l.caution); setDraftMethodesPaiement(l.methodes_paiement ?? '') }}
            hasValue={!!(l.tarif_nuitee_moyen || l.frais_menage || l.caution || l.methodes_paiement)}
            addLabel="Ajouter"
            emptyView={<p style={s.emptyHint}>Aucun tarif renseigné pour l&apos;instant.</p>}
            view={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={s.tiles}>
                  <div style={{ ...s.tile, background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
                    <span style={s.tileLabel}>Nuitée moyenne</span>
                    <span style={{ ...s.tileValue, color: 'var(--accent-text)' }}>{l.tarif_nuitee_moyen ? fmtEur(l.tarif_nuitee_moyen) : '?'}</span>
                  </div>
                  <div style={s.tile}>
                    <span style={s.tileLabel}>Frais de ménage</span>
                    <span style={s.tileValue}>{l.frais_menage ? fmtEur(l.frais_menage) : '?'}</span>
                  </div>
                  <div style={s.tile}>
                    <span style={s.tileLabel}>Caution</span>
                    <span style={s.tileValue}>{l.caution ? fmtEur(l.caution) : '?'}</span>
                  </div>
                </div>
                {l.methodes_paiement && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={s.tileLabel}>Paiements acceptés</span>
                    {l.methodes_paiement.split(',').map(m => m.trim()).filter(Boolean).map(m => <span key={m} style={s.pill}>{m}</span>)}
                  </div>
                )}
                <Link href={`/dashboard/calculateurs?logement=${l.id}#mes-prix`} style={s.linkRow}>
                  <TrendUp size={16} weight="bold" />
                  <span style={{ flex: 1 }}>Prix par plateforme et par saison</span>
                  <ArrowRight size={13} weight="bold" />
                </Link>
              </div>
            }
            edit={
              <div style={s.editGrid}>
                <Field label="Nuitée moyenne (€)"><input style={s.editInput} type="number" min={0} value={draftTarifNuit ?? ''} onChange={e => setDraftTarifNuit(e.target.value ? parseFloat(e.target.value) : null)} /></Field>
                <Field label="Frais de ménage (€)"><input style={s.editInput} type="number" min={0} value={draftFraisMenage ?? ''} onChange={e => setDraftFraisMenage(e.target.value ? parseFloat(e.target.value) : null)} /></Field>
                <Field label="Caution (€)"><input style={s.editInput} type="number" min={0} value={draftCaution ?? ''} onChange={e => setDraftCaution(e.target.value ? parseFloat(e.target.value) : null)} /></Field>
                <Field label="Paiements acceptés"><input style={s.editInput} type="text" value={draftMethodesPaiement} onChange={e => setDraftMethodesPaiement(e.target.value)} placeholder="Virement, carte, espèces" /></Field>
              </div>
            }
          />

          {/* Description */}
          <EditableCard
            id="description"
            title="Description"
            subtitle="Présentation du logement, reprise dans le contrat (en français, portugais ou anglais)"
            icon={<FileText size={17} weight="fill" />}
            onSave={saveDescription}
            onCancel={() => { setDraftDescription(l.description ?? ''); setDraftDescriptionPt(l.description_pt ?? ''); setDraftDescriptionEn(l.description_en ?? '') }}
            hasValue={!!l.description}
            addLabel="Rédiger"
            emptyView={<p style={s.emptyHint}>Présente ton logement en quelques lignes : son ambiance, ses atouts, le quartier.</p>}
            view={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={s.descText}>{l.description}</p>
                <LangBadges pt={!!l.description_pt} en={!!l.description_en} />
              </div>
            }
            edit={
              <LangTextarea
                fr={draftDescription} pt={draftDescriptionPt} en={draftDescriptionEn}
                onChangeFr={setDraftDescription} onChangePt={setDraftDescriptionPt} onChangeEn={setDraftDescriptionEn}
                placeholder="Décris ton logement, son ambiance, ses atouts…"
                rows={6}
              />
            }
          />

          {/* Conditions & règlement */}
          <div style={s.pair}>
            <EditableCard
              id="annulation"
              title="Conditions d'annulation"
              subtitle="Article du contrat"
              icon={<Scroll size={17} weight="fill" />}
              onSave={saveConditions}
              onCancel={() => { setDraftConditions(l.conditions_annulation ?? ''); setDraftConditionsPt(l.conditions_annulation_pt ?? ''); setDraftConditionsEn(l.conditions_annulation_en ?? '') }}
              hasValue={!!l.conditions_annulation}
              addLabel="Rédiger"
              emptyView={<p style={s.emptyHint}>Sans texte ici, le contrat reprend les conditions par défaut.</p>}
              view={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ ...s.descText, whiteSpace: 'pre-wrap' }}>{l.conditions_annulation}</p>
                  <LangBadges pt={!!l.conditions_annulation_pt} en={!!l.conditions_annulation_en} />
                </div>
              }
              edit={
                <LangTextarea
                  fr={draftConditions} pt={draftConditionsPt} en={draftConditionsEn}
                  onChangeFr={setDraftConditions} onChangePt={setDraftConditionsPt} onChangeEn={setDraftConditionsEn}
                  placeholder="Ex. : annulation gratuite jusqu'à 30 jours avant l'arrivée, 50 % entre 30 et 7 jours, 100 % après."
                />
              }
            />
            <EditableCard
              id="reglement"
              title="Règlement intérieur"
              subtitle="Les règles de la maison, dans le contrat"
              icon={<ListChecks size={17} weight="bold" />}
              onSave={saveReglement}
              onCancel={() => { setDraftReglement(l.reglement_interieur ?? ''); setDraftReglementPt(l.reglement_interieur_pt ?? ''); setDraftReglementEn(l.reglement_interieur_en ?? '') }}
              hasValue={!!l.reglement_interieur}
              addLabel="Rédiger"
              emptyView={<p style={s.emptyHint}>Sans texte ici, le contrat reprend le règlement par défaut.</p>}
              view={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ ...s.descText, whiteSpace: 'pre-wrap' }}>{l.reglement_interieur}</p>
                  <LangBadges pt={!!l.reglement_interieur_pt} en={!!l.reglement_interieur_en} />
                </div>
              }
              edit={
                <LangTextarea
                  fr={draftReglement} pt={draftReglementPt} en={draftReglementEn}
                  onChangeFr={setDraftReglement} onChangePt={setDraftReglementPt} onChangeEn={setDraftReglementEn}
                  placeholder={'- Pas de fête\n- Non-fumeur à l\'intérieur\n- Arrivée après 16 h'}
                />
              }
            />
          </div>

          {/* Contrat : réglages repris par l'assistant de contrat */}
          <EditableCard
            id="contrat"
            title="Contrat"
            subtitle="Tes règles, reprises dans chaque contrat de ce logement"
            icon={<FileText size={17} weight="fill" />}
            onSave={saveContrat}
            onCancel={resetContrat}
            hasValue
            view={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={s.tiles}>
                  {(l.pays ?? 'FR') === 'FR' && (
                    <div style={s.tile}>
                      <span style={s.tileLabel}>Sommes versées à la réservation</span>
                      <span style={s.tileValue}>{contratOpts.regime === 'acompte' ? 'Acompte' : 'Arrhes'}</span>
                    </div>
                  )}
                  <div style={s.tile}>
                    <span style={s.tileLabel}>Caution rendue sous</span>
                    <span style={s.tileValue}>{contratOpts.delai_caution_jours} jours</span>
                  </div>
                  <div style={s.tile}>
                    <span style={s.tileLabel}>Charges</span>
                    <span style={s.tileValue}>{contratOpts.charges_incluses ? 'Comprises' : 'En plus'}</span>
                  </div>
                </div>
                {l.clauses_particulieres
                  ? <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={s.tileLabel}>Clauses particulières</span>
                      <p style={{ ...s.descText, whiteSpace: 'pre-wrap' }}>{l.clauses_particulieres}</p>
                      <LangBadges pt={!!l.clauses_particulieres_pt} en={!!l.clauses_particulieres_en} />
                    </div>
                  : <p style={s.emptyHint}>Pas de clause particulière. Ajoute ici ce qui est propre à ce logement : linge fourni, accès piscine, bois de chauffage…</p>}
                <p style={{ ...s.emptyHint, margin: 0 }}>Le contrat reprend aussi tout seul l&apos;état descriptif du logement (type, surface, pièces, couchages, équipements, classement, numéro d&apos;enregistrement) depuis Caractéristiques et Équipements.</p>
              </div>
            }
            edit={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={s.editGrid2}>
                  {(l.pays ?? 'FR') === 'FR' && (
                    <Field label="Sommes versées à la réservation">
                      <select style={s.editInput} value={draftRegime} onChange={e => setDraftRegime(e.target.value === 'acompte' ? 'acompte' : 'arrhes')}>
                        <option value="arrhes">Arrhes (conseillé) : le voyageur qui annule les perd, tu rends le double si tu annules</option>
                        <option value="acompte">Acompte : réservation ferme, le voyageur reste redevable du prix</option>
                      </select>
                    </Field>
                  )}
                  <Field label="Caution rendue au plus tard (jours après le départ)">
                    <input style={s.editInput} type="number" min={1} max={60} value={draftDelaiCaution} onChange={e => setDraftDelaiCaution(Math.max(1, Math.min(60, parseInt(e.target.value) || 7)))} />
                  </Field>
                  <Field label="Charges (eau, électricité, chauffage, internet)">
                    <select style={s.editInput} value={draftCharges ? 'oui' : 'non'} onChange={e => setDraftCharges(e.target.value === 'oui')}>
                      <option value="oui">Comprises dans le prix</option>
                      <option value="non">En plus du prix</option>
                    </select>
                  </Field>
                </div>
                <div>
                  <span style={{ ...s.tileLabel, display: 'block', marginBottom: '6px' }}>Clauses particulières</span>
                  <LangTextarea
                    fr={draftClauses} pt={draftClausesPt} en={draftClausesEn}
                    onChangeFr={setDraftClauses} onChangePt={setDraftClausesPt} onChangeEn={setDraftClausesEn}
                    placeholder={'Ex. : linge de lit et serviettes fournis.\nAccès à la piscine de 9 h à 20 h.\nBois de chauffage en supplément : 15 € le stère.'}
                  />
                  <p style={{ ...s.emptyHint, marginTop: '6px' }}>Une clause ne peut pas retirer au voyageur un droit que la loi lui donne.</p>
                </div>
              </div>
            }
          />

          {/* Annonces */}
          <EditableCard
            id="annonces"
            title="Annonces en ligne"
            subtitle="Tes pages Airbnb, Booking, Google et ton site, utilisées par les outils de visibilité"
            icon={<Globe size={17} weight="fill" />}
            onSave={saveLiens}
            onCancel={() => { setDraftLienAirbnb(l.lien_airbnb ?? ''); setDraftLienBooking(l.lien_booking ?? ''); setDraftLienGmb(l.lien_gmb ?? ''); setDraftLienSiteDirect(l.lien_site_direct ?? ''); setDraftLienDriing(l.lien_driing ?? '') }}
            hasValue={annonces.length > 0}
            addLabel="Ajouter"
            emptyView={<p style={s.emptyHint}>Aucun lien d&apos;annonce pour l&apos;instant.</p>}
            view={
              <div style={s.annonceGrid}>
                {annonces.map(a => (
                  <a key={a.key} href={a.url!} target="_blank" rel="noopener noreferrer" style={s.annonce}>
                    <span style={{ ...s.annonceLogo, background: `color-mix(in srgb, ${a.color} 14%, transparent)`, color: a.color }}>
                      {a.letter || <Globe size={16} weight="bold" />}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>{a.label}</span>
                    <ArrowSquareOut size={13} color="var(--text-3)" />
                  </a>
                ))}
              </div>
            }
            edit={
              <div style={s.editGrid2}>
                <Field label="Airbnb"><input style={s.editInput} type="url" value={draftLienAirbnb} onChange={e => setDraftLienAirbnb(e.target.value)} placeholder="https://www.airbnb.fr/rooms/…" /></Field>
                <Field label="Booking.com"><input style={s.editInput} type="url" value={draftLienBooking} onChange={e => setDraftLienBooking(e.target.value)} placeholder="https://www.booking.com/…" /></Field>
                <Field label="Fiche Google"><input style={s.editInput} type="url" value={draftLienGmb} onChange={e => setDraftLienGmb(e.target.value)} placeholder="https://maps.google.com/…" /></Field>
                <Field label="Driing"><input style={s.editInput} type="url" value={draftLienDriing} onChange={e => setDraftLienDriing(e.target.value)} placeholder="https://driing.co/…" /></Field>
                <Field label="Site de réservation directe" wide><input style={s.editInput} type="url" value={draftLienSiteDirect} onChange={e => setDraftLienSiteDirect(e.target.value)} placeholder="https://…" /></Field>
              </div>
            }
          />
        </div>

        {/* ─── Colonne de droite ─── */}
        <div style={s.colSide}>
          {/* Arrivée des voyageurs */}
          <EditableCard
            id="accueil"
            title="Arrivée des voyageurs"
            subtitle="Horaires, Wi-Fi et code, repris dans tes messages"
            icon={<Key size={17} weight="fill" />}
            onSave={saveInfosPratiques}
            onCancel={() => { setDraftHeureArrivee(l.heure_arrivee ?? ''); setDraftHeureDepart(l.heure_depart ?? ''); setDraftWifiNom(l.wifi_nom ?? ''); setDraftWifiMdp(l.wifi_mdp ?? ''); setDraftCodeAcces(l.code_acces ?? '') }}
            hasValue={!!(l.heure_arrivee || l.heure_depart || l.code_acces || l.wifi_nom)}
            addLabel="Ajouter"
            emptyView={<p style={s.emptyHint}>Horaires d&apos;arrivée et de départ, Wi-Fi, code de la boîte à clés.</p>}
            view={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={s.timeRow}>
                  <div style={s.timeTile}>
                    <SignIn size={18} weight="duotone" color="var(--accent-text)" />
                    <span style={s.tileLabel}>Arrivée</span>
                    <span style={s.timeValue}>{l.heure_arrivee ? `dès ${l.heure_arrivee.slice(0, 5)}` : '?'}</span>
                  </div>
                  <div style={s.timeTile}>
                    <SignOut size={18} weight="duotone" color={AMBER} />
                    <span style={s.tileLabel}>Départ</span>
                    <span style={s.timeValue}>{l.heure_depart ? `avant ${l.heure_depart.slice(0, 5)}` : '?'}</span>
                  </div>
                </div>
                {l.wifi_nom && (
                  <div style={s.secretRow}>
                    <WifiHigh size={18} weight="bold" color="var(--accent-text)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={s.secretLabel}>Wi-Fi : {l.wifi_nom}</div>
                      {l.wifi_mdp && <div style={s.secretValue}>{l.wifi_mdp}</div>}
                    </div>
                    <CopyButton value={l.wifi_mdp || l.wifi_nom} />
                  </div>
                )}
                {l.code_acces && (
                  <div style={s.secretRow}>
                    <Key size={18} weight="bold" color="var(--accent-text)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={s.secretLabel}>Code d&apos;accès</div>
                      <div style={s.secretValue}>{l.code_acces}</div>
                    </div>
                    <CopyButton value={l.code_acces} />
                  </div>
                )}
                <Link href="/dashboard/outils-impression#affiche" style={s.linkRow}>
                  <Printer size={16} weight="bold" />
                  <span style={{ flex: 1 }}>Imprimer l&apos;affiche Wi-Fi et accueil</span>
                  <ArrowRight size={13} weight="bold" />
                </Link>
              </div>
            }
            edit={
              <div style={s.editGrid}>
                <Field label="Heure d'arrivée"><input style={s.editInput} type="time" value={draftHeureArrivee} onChange={e => setDraftHeureArrivee(e.target.value)} /></Field>
                <Field label="Heure de départ"><input style={s.editInput} type="time" value={draftHeureDepart} onChange={e => setDraftHeureDepart(e.target.value)} /></Field>
                <Field label="Nom du Wi-Fi"><input style={s.editInput} type="text" value={draftWifiNom} onChange={e => setDraftWifiNom(e.target.value)} placeholder="MaBox-5G" /></Field>
                <Field label="Mot de passe Wi-Fi"><input style={s.editInput} type="text" value={draftWifiMdp} onChange={e => setDraftWifiMdp(e.target.value)} /></Field>
                <Field label="Code d'accès (boîte à clés, porte)" wide><input style={s.editInput} type="text" value={draftCodeAcces} onChange={e => setDraftCodeAcces(e.target.value)} placeholder="1234A" /></Field>
              </div>
            }
          />

          {/* Contacts utiles */}
          <EditableCard
            id="contacts"
            title="Contacts utiles"
            subtitle="Ménage et urgence, à portée de main"
            icon={<Phone size={17} weight="fill" />}
            onSave={saveContacts}
            onCancel={() => { setDraftUrgenceNom(l.contact_urgence_nom ?? ''); setDraftUrgenceTel(l.contact_urgence_tel ?? ''); setDraftMenageNom(l.contact_menage_nom ?? ''); setDraftMenageTel(l.contact_menage_tel ?? '') }}
            hasValue={!!(l.contact_urgence_nom || l.contact_menage_nom || l.telephone)}
            addLabel="Ajouter"
            emptyView={<p style={s.emptyHint}>Ta personne de ménage, un voisin ou un artisan à appeler en cas d&apos;urgence.</p>}
            view={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {contacts.map(c => (
                  <div key={c.key} style={s.contact}>
                    <span style={{ ...s.contactIcon, color: c.color, background: `color-mix(in srgb, ${c.color} 12%, transparent)` }}><c.Icon size={16} weight="fill" /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={s.tileLabel}>{c.role}</div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>{c.name}</div>
                      {c.tel && <div style={{ fontSize: '12.5px', color: 'var(--text-2)' }}>{c.tel}</div>}
                    </div>
                    {c.tel && <a href={`tel:${c.tel.replace(/\s/g, '')}`} style={s.callBtn} aria-label={`Appeler ${c.name}`}><Phone size={14} weight="fill" /></a>}
                  </div>
                ))}
              </div>
            }
            edit={
              <div style={s.editGrid}>
                <Field label="Ménage : nom"><input style={s.editInput} type="text" value={draftMenageNom} onChange={e => setDraftMenageNom(e.target.value)} placeholder="Personne ou société" /></Field>
                <Field label="Ménage : téléphone"><input style={s.editInput} type="tel" value={draftMenageTel} onChange={e => setDraftMenageTel(e.target.value)} placeholder="06 00 00 00 00" /></Field>
                <Field label="Urgence : nom"><input style={s.editInput} type="text" value={draftUrgenceNom} onChange={e => setDraftUrgenceNom(e.target.value)} placeholder="Voisin, artisan…" /></Field>
                <Field label="Urgence : téléphone"><input style={s.editInput} type="tel" value={draftUrgenceTel} onChange={e => setDraftUrgenceTel(e.target.value)} placeholder="06 00 00 00 00" /></Field>
              </div>
            }
          />

          {/* Voyageurs récents */}
          <Section icon={<Users size={17} weight="fill" />} title="Voyageurs récents" subtitle="Les derniers passés par ici">
            {recentVoyageurs.length === 0 ? (
              <p style={s.emptyHint}>Personne n&apos;est encore passé ici.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {recentVoyageurs.map(sj => {
                  const v = sj.voyageurs!
                  const initials = `${v.prenom?.[0] ?? ''}${v.nom?.[0] ?? ''}`.toUpperCase()
                  return (
                    <Link key={v.id} href={`/dashboard/voyageurs/${v.id}`} style={s.voyageur}>
                      <span style={s.avatar}>{initials}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={s.voyageurName}>{v.prenom} {v.nom}</div>
                        <div style={s.voyageurMeta}>venu le {fmtDate(sj.date_arrivee, true)}</div>
                      </div>
                      <ArrowRight size={12} weight="bold" color="var(--text-3)" />
                    </Link>
                  )
                })}
              </div>
            )}
          </Section>

          {/* Informations générales */}
          <EditableCard
            id="infos"
            title="Informations générales"
            subtitle="Nom, type, adresse et pays"
            icon={<Info size={17} weight="fill" />}
            onSave={saveInfosGenerales}
            onCancel={() => { setDraftNom(l.nom); setDraftType(l.type_logement ?? ''); setDraftAdresse(l.adresse); setDraftTelephone(l.telephone ?? ''); setDraftPays(l.pays ?? 'FR'); setDraftNumeroAl(l.numero_al ?? '') }}
            view={
              <div style={s.rows}>
                <Row k="Nom" v={l.nom} />
                <Row k="Type" v={typeLabel} />
                <Row k="Adresse" v={l.adresse} />
                <Row k="Pays" v={isPT ? 'Portugal' : 'France'} />
                {isPT && <Row k="N° Alojamento Local" v={l.numero_al || 'À renseigner'} muted={!l.numero_al} />}
              </div>
            }
            edit={
              <div style={s.editGrid}>
                <Field label="Nom du logement" wide><input style={s.editInput} type="text" value={draftNom} onChange={e => setDraftNom(e.target.value)} /></Field>
                <Field label="Type">
                  <select style={s.editInput} value={draftType} onChange={e => setDraftType(e.target.value)}>
                    <option value="">Non renseigné</option>
                    {Object.entries(TYPE_LABELS).map(([slug, label]) => <option key={slug} value={slug}>{label}</option>)}
                  </select>
                </Field>
                <Field label="Pays">
                  <select style={s.editInput} value={draftPays} onChange={e => setDraftPays(e.target.value)}>
                    <option value="FR">France</option>
                    <option value="PT">Portugal</option>
                  </select>
                </Field>
                <Field label="Adresse complète" wide><input style={s.editInput} type="text" value={draftAdresse} onChange={e => setDraftAdresse(e.target.value)} /></Field>
                <Field label="Téléphone du logement"><input style={s.editInput} type="tel" value={draftTelephone} onChange={e => setDraftTelephone(e.target.value)} placeholder="06 00 00 00 00" /></Field>
                {draftPays === 'PT' && (
                  <Field label="N° Alojamento Local"><input style={s.editInput} type="text" value={draftNumeroAl} onChange={e => setDraftNumeroAl(e.target.value)} placeholder="12345/AL" /></Field>
                )}
                <p style={{ ...s.hintText, gridColumn: '1 / -1' }}>
                  Si tu renommes le logement, tout l&apos;historique (séjours, contrats, déclarations, revenus) suit automatiquement.
                </p>
              </div>
            }
          />

          {/* Propriétaire (conciergerie) */}
          <EditableCard
            id="proprietaire"
            title="Propriétaire"
            subtitle="Si tu gères ce logement pour quelqu'un (conciergerie)"
            icon={<Handshake size={17} weight="fill" />}
            onSave={saveProprietaire}
            onCancel={() => { setDraftPropNom(l.proprietaire_nom ?? ''); setDraftPropEmail(l.proprietaire_email ?? ''); setDraftPropTel(l.proprietaire_telephone ?? ''); setDraftHonoraires(l.honoraires_pct); setDraftIban(l.iban ?? ''); setDraftBic(l.bic ?? '') }}
            hasValue={!!(l.proprietaire_nom || l.proprietaire_email || l.proprietaire_telephone || l.honoraires_pct != null || l.iban)}
            addLabel="Ajouter"
            emptyView={<p style={s.emptyHint}>C&apos;est ton logement ? Rien à remplir ici. Sinon, les contrats seront au nom du propriétaire.</p>}
            view={
              <div style={s.rows}>
                {l.proprietaire_nom && <Row k="Nom" v={l.proprietaire_nom} />}
                {l.proprietaire_email && <Row k="E-mail" v={<a href={`mailto:${l.proprietaire_email}`} style={{ color: 'var(--accent-text)', textDecoration: 'none' }}>{l.proprietaire_email}</a>} />}
                {l.proprietaire_telephone && <Row k="Téléphone" v={<a href={`tel:${l.proprietaire_telephone.replace(/\s/g, '')}`} style={{ color: 'var(--accent-text)', textDecoration: 'none' }}>{l.proprietaire_telephone}</a>} />}
                {l.honoraires_pct != null && <Row k="Honoraires" v={<strong style={{ color: AMBER_DARK }}>{l.honoraires_pct} %</strong>} />}
                {l.iban && <Row k="IBAN" v={<span style={{ fontFamily: 'monospace', letterSpacing: '0.4px', wordBreak: 'break-all' }}>{l.iban}</span>} />}
                {l.bic && <Row k="BIC" v={<span style={{ fontFamily: 'monospace' }}>{l.bic}</span>} />}
              </div>
            }
            edit={
              <div style={s.editGrid}>
                <Field label="Nom du propriétaire" wide><input style={s.editInput} type="text" value={draftPropNom} onChange={e => setDraftPropNom(e.target.value)} placeholder="Jean Dupont" /></Field>
                <Field label="E-mail"><input style={s.editInput} type="email" value={draftPropEmail} onChange={e => setDraftPropEmail(e.target.value)} /></Field>
                <Field label="Téléphone"><input style={s.editInput} type="tel" value={draftPropTel} onChange={e => setDraftPropTel(e.target.value)} /></Field>
                <Field label="Honoraires (%)"><input style={s.editInput} type="number" min={0} max={100} value={draftHonoraires ?? ''} onChange={e => setDraftHonoraires(e.target.value ? parseFloat(e.target.value) : null)} placeholder="20" /></Field>
                <Field label="BIC"><input style={{ ...s.editInput, fontFamily: 'monospace' }} type="text" value={draftBic} onChange={e => setDraftBic(e.target.value)} /></Field>
                <Field label="IBAN du propriétaire" wide><input style={{ ...s.editInput, fontFamily: 'monospace' }} type="text" value={draftIban} onChange={e => setDraftIban(e.target.value)} placeholder="FR76 …" /></Field>
                <p style={{ ...s.hintText, gridColumn: '1 / -1' }}>
                  Si tu le renseignes, c&apos;est cet IBAN qui s&apos;affiche au locataire pour le virement (pas le tien) : l&apos;argent va directement au propriétaire.
                </p>
              </div>
            }
          />

          {sideExtra}
        </div>
      </div>

      {quick && (
        <QuickSejourModal
          logementId={l.id}
          logementNom={l.nom}
          voyageurs={voyageurs}
          defaults={quick.defaults}
          platform={quick.platform}
          onClose={() => setQuick(null)}
        />
      )}
    </div>
  )
}

function LangBadges({ pt, en }: { pt: boolean; en: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
      <Translate size={13} weight="bold" color="var(--text-3)" />
      <span style={{ ...s.pill, ...s.pillOn }}>FR</span>
      <span style={pt ? { ...s.pill, ...s.pillOn } : { ...s.pill, opacity: 0.55 }}>PT{pt ? '' : ' à traduire'}</span>
      <span style={en ? { ...s.pill, ...s.pillOn } : { ...s.pill, opacity: 0.55 }}>EN{en ? '' : ' à traduire'}</span>
    </div>
  )
}

function Row({ k, v, muted }: { k: string; v: React.ReactNode; muted?: boolean }) {
  return (
    <div style={s.row}>
      <span style={s.rowKey}>{k}</span>
      <span style={{ ...s.rowVal, ...(muted ? { color: 'var(--text-3)', fontWeight: 500 } : {}) }}>{v}</span>
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(16px,3vw,40px)', width: '100%', display: 'flex', flexDirection: 'column', gap: '18px', boxSizing: 'border-box' },
  backLink: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', textDecoration: 'none', width: 'fit-content' },

  // Bandeau
  hero: {
    display: 'flex', flexWrap: 'wrap', gap: '24px 36px', alignItems: 'stretch',
    padding: 'clamp(18px,3vw,32px)', borderRadius: '22px',
    background: 'linear-gradient(135deg, var(--accent-bg) 0%, rgba(99,214,131,0.10) 55%, rgba(255,213,107,0.14) 100%)',
    border: '1px solid var(--accent-border)',
  },
  heroMain: { flex: '1 1 460px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' },
  heroPhotos: { flex: '1 1 340px', maxWidth: '520px', minWidth: 0, scrollMarginTop: '90px' },
  eyebrow: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '0.6px' },
  heroTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(28px,3.4vw,42px)', fontWeight: 400, color: 'var(--text)', margin: 0, lineHeight: 1.1, letterSpacing: '-0.5px', overflowWrap: 'anywhere' },
  heroAddress: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-2)', textDecoration: 'none', width: 'fit-content', maxWidth: '100%' },
  badges: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '999px',
    fontSize: '12px', fontWeight: 700, color: 'var(--accent-text)', background: 'var(--surface)', border: '1px solid var(--accent-border)',
  },
  badgeAmber: { color: AMBER_DARK, background: `color-mix(in srgb, ${AMBER} 12%, var(--surface))`, borderColor: `color-mix(in srgb, ${AMBER} 35%, transparent)` },
  badgeMuted: { color: 'var(--text-3)', borderColor: 'var(--border)' },
  facts: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  fact: {
    display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 13px', borderRadius: '12px',
    background: 'var(--surface)', border: '1px solid var(--border)',
  },
  factValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: '19px', color: 'var(--text)', lineHeight: 1 },
  factLabel: { fontSize: '12.5px', color: 'var(--text-2)' },
  actions: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 'auto', paddingTop: '6px' },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '11px 18px', borderRadius: '12px', border: 'none',
    background: 'var(--accent-text)', color: 'var(--bg)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 14px', borderRadius: '12px',
    background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: '13.5px', fontWeight: 600, textDecoration: 'none',
  },
  btnSoft: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '10px', flexShrink: 0,
    background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)',
    fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none',
  },

  // Chiffres
  kpis: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))', gap: '12px' },
  kpi: { display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px 18px', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 0 },
  kpiLabel: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px' },
  kpiValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: '28px', color: 'var(--text)', lineHeight: 1.1, whiteSpace: 'nowrap' },
  kpiValueSm: { fontFamily: 'var(--font-fraunces), serif', fontSize: '21px', color: 'var(--text)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  kpiSub: { fontSize: '12.5px', color: 'var(--text-3)', lineHeight: 1.45 },
  bar: { height: '6px', borderRadius: '999px', background: 'var(--border)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '999px', background: 'var(--accent-text)' },

  // Complétude
  completion: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 20px', padding: '14px 16px',
    borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)',
  },
  ring: { width: '54px', height: '54px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  ringInner: { width: '42px', height: '42px', borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: 'var(--accent-text)' },
  completionTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', color: 'var(--text)', lineHeight: 1.25 },
  checkChips: { display: 'flex', flexWrap: 'wrap', gap: '6px', flex: '1 1 100%', minWidth: 0 },
  checkChip: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 11px', borderRadius: '999px',
    fontSize: '12.5px', fontWeight: 600, textDecoration: 'none',
    color: AMBER_DARK, background: `color-mix(in srgb, ${AMBER} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${AMBER} 30%, transparent)`,
  },
  checkChipDone: { color: 'var(--accent-text)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' },

  // Colonnes
  columns: { display: 'flex', flexWrap: 'wrap', gap: '18px', alignItems: 'flex-start' },
  colMain: { flex: '999 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '18px' },
  colSide: { flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '18px' },
  pair: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '18px' },

  // Sections non éditables (même en-tête que EditableCard)
  section: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0, scrollMarginTop: '90px' },
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' },
  iconBox: { width: '36px', height: '36px', borderRadius: '11px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  sectionTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', fontWeight: 400, color: 'var(--text)', margin: 0, lineHeight: 1.25 },
  sectionSub: { fontSize: '12.5px', color: 'var(--text-3)', margin: '3px 0 0', lineHeight: 1.45 },
  headLink: { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', fontWeight: 700, color: 'var(--accent-text)', textDecoration: 'none', flexShrink: 0, paddingTop: '4px' },

  // Réservations
  stayList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  stay: { display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 12px', borderRadius: '14px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-2)' },
  dateBlock: {
    width: '52px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 0', borderRadius: '11px',
    background: 'var(--surface)', border: '1px solid var(--border)',
  },
  dateBlockOn: { background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' },
  dateWeekday: { fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.4px' },
  dateDay: { fontFamily: 'var(--font-fraunces), serif', fontSize: '22px', lineHeight: 1.05, color: 'var(--text)' },
  dateMonth: { fontSize: '11px', fontWeight: 600, color: 'var(--accent-text)' },
  stayName: { fontSize: '14px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  stayMeta: { display: 'inline-flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', fontSize: '12.5px', color: 'var(--text-2)' },
  pill: {
    display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
    color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--border)',
  },
  pillOn: { color: 'var(--accent-text)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' },
  pillAmber: { color: AMBER_DARK, background: `color-mix(in srgb, ${AMBER} 12%, transparent)`, borderColor: `color-mix(in srgb, ${AMBER} 30%, transparent)` },
  moreLink: { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', fontWeight: 700, color: 'var(--accent-text)', textDecoration: 'none', padding: '4px 2px' },
  emptyBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center', padding: '22px 16px',
    borderRadius: '14px', border: '1.5px dashed var(--accent-border)', background: 'color-mix(in srgb, var(--accent-bg) 50%, transparent)',
  },

  // Tuiles
  tiles: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  tile: { flex: '1 1 150px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px 14px', borderRadius: '14px', background: 'var(--bg)', border: '1px solid var(--border)' },
  tileLabel: { fontSize: '11.5px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px' },
  tileValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: '22px', color: 'var(--text)', lineHeight: 1.15 },
  tileMissing: { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 700, color: AMBER_DARK, textDecoration: 'none' },
  dpeScale: { display: 'flex', gap: '4px', alignItems: 'center', padding: '2px 0' },
  dpeCell: { flex: 1, minWidth: '22px', height: '26px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', transition: 'transform .15s ease' },
  inlineFacts: { display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: '13px', color: 'var(--text-2)' },

  // Équipements
  equipGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 118px), 1fr))', gap: '8px' },
  equipTile: {
    position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', padding: '12px',
    borderRadius: '13px', background: 'var(--bg)', border: '1px solid var(--border)', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)',
  },
  equipOff: { color: 'var(--text-3)', border: '1px dashed var(--border)' },
  equipToggle: { cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', color: 'var(--text-2)' },
  equipToggleOn: { background: 'var(--accent-bg)', border: '1px solid var(--accent-text)', color: 'var(--accent-text)' },
  toggleChip: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 10px 8px 12px', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit',
    background: 'var(--bg)', border: '1px solid var(--border)', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)',
  },
  toggleChipOn: { background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)' },
  switch: { width: '30px', height: '18px', borderRadius: '999px', background: 'var(--border)', position: 'relative', flexShrink: 0, transition: 'background .15s' },
  switchOn: { background: 'var(--accent-text)' },
  switchDot: { position: 'absolute', top: '2px', left: '2px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', transition: 'left .15s' },
  switchDotOn: { left: '14px' },

  // Arrivée
  timeRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  timeTile: { flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px 14px', borderRadius: '14px', background: 'var(--bg)', border: '1px solid var(--border)' },
  timeValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: '20px', color: 'var(--text)', lineHeight: 1.15 },
  secretRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '14px', background: 'var(--bg)', border: '1px solid var(--border)' },
  secretLabel: { fontSize: '12px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  secretValue: { fontSize: '15px', fontWeight: 700, color: 'var(--text)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', letterSpacing: '0.3px', wordBreak: 'break-all' },
  copyBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 10px', borderRadius: '9px', flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit',
    fontSize: '12px', fontWeight: 700, color: 'var(--accent-text)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
  },
  linkRow: {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderRadius: '12px', textDecoration: 'none',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)', fontSize: '13px', fontWeight: 700,
  },

  // Contacts
  contact: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '14px', background: 'var(--bg)', border: '1px solid var(--border)' },
  contactIcon: { width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  callBtn: { width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--accent-text)', color: 'var(--bg)' },

  // Voyageurs
  voyageur: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--border)', textDecoration: 'none' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-bg)', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11.5px', fontWeight: 800, flexShrink: 0 },
  voyageurName: { fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  voyageurMeta: { fontSize: '12px', color: 'var(--text-3)' },

  // Lignes clé / valeur
  rows: { display: 'flex', flexDirection: 'column' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '14px', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '13.5px' },
  rowKey: { color: 'var(--text-3)', flexShrink: 0 },
  rowVal: { color: 'var(--text)', fontWeight: 600, textAlign: 'right', minWidth: 0, overflowWrap: 'anywhere' },

  // Annonces
  annonceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: '8px' },
  annonce: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '13px', background: 'var(--bg)', border: '1px solid var(--border)', textDecoration: 'none' },
  annonceLogo: { width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-fraunces), serif', fontSize: '17px', fontWeight: 600, flexShrink: 0 },

  // Édition
  editGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '12px' },
  editGrid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '12px' },
  editLabel: { display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', minWidth: 0 },
  editInput: {
    width: '100%', padding: '9px 11px', fontSize: '14px', background: 'var(--bg)', color: 'var(--text)',
    border: '1px solid var(--border)', borderRadius: '10px', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  editTextarea: {
    width: '100%', padding: '11px 13px', fontSize: '14px', lineHeight: 1.55, background: 'var(--bg)', color: 'var(--text)',
    border: '1px solid var(--border)', borderRadius: '10px', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical', minHeight: '120px',
  },
  langTab: { padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid var(--border)' },
  tip: { display: 'flex', gap: '8px', padding: '10px 12px', borderRadius: '12px', background: 'var(--accent-bg)', color: 'var(--text-2)', fontSize: '12.5px', lineHeight: 1.55 },
  hintText: { fontSize: '12px', color: 'var(--text-3)', margin: 0, lineHeight: 1.5 },
  emptyHint: { fontSize: '13px', color: 'var(--text-3)', margin: 0, lineHeight: 1.55 },
  descText: { fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 },
}
