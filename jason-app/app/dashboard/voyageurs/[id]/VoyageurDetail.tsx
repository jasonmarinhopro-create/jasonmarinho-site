'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Warning, Plus, X, Pencil, Check,
  Envelope, Phone, Note, CalendarBlank, House,
  CurrencyEur, Seal, Link as LinkIcon, ShieldWarning, Star, FileText, Lock,
  ListChecks, CheckSquare, Square, Bandaids,
} from '@phosphor-icons/react'
import { updateVoyageur, addSejour, updateSejour, deleteSejour, type VoyageurData, type SejourData } from '../actions'
import { updateContractChecklist } from '../../calendrier/actions'
import { reportGuest } from '../../securite/actions'
import IncidentsPanel from './IncidentsPanel'
import dynamic from 'next/dynamic'

const ContractModal = dynamic(() => import('./ContractModal'), { ssr: false })
const DepositModal  = dynamic(() => import('./DepositModal'),  { ssr: false })

const INCIDENT_TYPES = [
  'Dégradation du logement',
  'Fête non autorisée',
  'Non-respect des règles',
  'Fumée dans le logement',
  'Présence de personnes non déclarées',
  "Tentative d'arnaque / fraude",
  'Avis négatif abusif',
  'Impayé / remboursement abusif',
  'Autre',
]

const POSITIVE_TYPES = [
  'Voyageur exemplaire',
  'Logement laissé impeccable',
  'Communication excellente',
  'Respect total des règles',
  'Je recommande vivement',
]

type Voyageur = {
  id: string; prenom: string; nom: string
  email: string | null; telephone: string | null
  notes: string | null; created_at: string
  // Phase 1 — enrichi
  tags?: string[] | null
  source?: string | null
  date_naissance?: string | null
  nationalite?: string | null
  adresse?: string | null
  code_postal?: string | null
  ville?: string | null
  pays?: string | null
  id_verifie?: boolean | null
  id_url?: string | null
  id_type?: string | null
  preferences?: string[] | null
  note_privee?: number | null
  bloque?: boolean | null
  bloque_motif?: string | null
}

const SOURCE_LABELS: Record<string, { label: string; emoji: string }> = {
  airbnb:           { label: 'Airbnb',           emoji: '🏠' },
  booking:          { label: 'Booking.com',      emoji: '🛎️' },
  vrbo:             { label: 'Vrbo',             emoji: '🌴' },
  abritel:          { label: 'Abritel',          emoji: '🏡' },
  gites_de_france:  { label: 'Gîtes de France',  emoji: '🌳' },
  driing:           { label: 'Driing',           emoji: '🔔' },
  direct:           { label: 'Direct',           emoji: '📞' },
  recommandation:   { label: 'Recommandation',   emoji: '💌' },
  autre:            { label: 'Autre',            emoji: '✨' },
}

type Sejour = {
  id: string; voyageur_id: string; logement: string | null
  date_arrivee: string; date_depart: string
  montant: number | null
  contrat_statut: 'signe' | 'en_attente' | 'non_requis' | 'nouveau'
  contrat_date_signature: string | null; contrat_lien: string | null
}

type DepositContract = {
  id: string
  token: string
  statut: string
  locataire_prenom: string
  locataire_nom: string
  montant_loyer: number | null
  montant_caution: number | null
  modalites_paiement: string | null
  stripe_payment_enabled: boolean
  stripe_payment_status: 'pending' | 'paid' | 'refunded' | 'failed' | null
  stripe_deposit_status: 'pending' | 'held' | 'captured' | 'released' | 'failed' | null
}

function avatarColor(name: string) {
  const palette = ['#2D9A7B', '#4F7DB8', '#9B5E8C', '#D4875A', '#6B8E6B', '#8B6D5E']
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return palette[Math.abs(h) % palette.length]
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function nights(arrivee: string, depart: string) {
  const diff = new Date(depart).getTime() - new Date(arrivee).getTime()
  return Math.round(diff / 86400000)
}

const CONTRAT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  signe:       { label: 'Signé',       color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  en_attente:  { label: 'En attente',  color: 'var(--accent-text)', bg: 'var(--accent-bg-2)' },
  non_requis:  { label: 'Non requis',  color: 'var(--text-muted)', bg: 'var(--surface-2)' },
  nouveau:     { label: 'Nouveau',     color: '#7EB8F7', bg: 'rgba(126,184,247,0.12)' },
}

const CHECKLIST_PHASES = [
  {
    label: "Avant l'arrivée",
    items: [
      { key: 'contrat_envoye',       label: 'Contrat envoyé' },
      { key: 'contrat_signe',        label: 'Contrat signé' },
      { key: 'acompte_recu',         label: 'Acompte reçu' },
      { key: 'solde_recu',           label: 'Solde reçu' },
      { key: 'caution_recue',        label: 'Caution reçue' },
      { key: 'identite_verifiee',    label: "Pièce d'identité vérifiée" },
      { key: 'instructions_envoyees',label: "Instructions d'arrivée envoyées" },
      { key: 'menage_planifie',      label: 'Ménage planifié' },
    ],
  },
  {
    label: 'Pendant le séjour',
    items: [
      { key: 'checkin_effectue', label: 'Check-in effectué' },
    ],
  },
  {
    label: 'Après le départ',
    items: [
      { key: 'checkout_effectue',  label: 'Check-out effectué' },
      { key: 'etat_des_lieux',     label: 'État des lieux de sortie' },
      { key: 'caution_restituee',  label: 'Caution restituée' },
      { key: 'avis_demande',       label: 'Avis demandé' },
    ],
  },
]
const CL_TOTAL = CHECKLIST_PHASES.flatMap(p => p.items).length

const EMPTY_SEJOUR: Omit<SejourData, 'voyageur_id'> = {
  logement: '', date_arrivee: '', date_depart: '',
  montant: null, contrat_statut: 'nouveau',
  contrat_date_signature: null, contrat_lien: null,
}

// Aesthetic calendar date picker (popup)
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
      ) {
        setOpen(false)
      }
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
          border: `1px solid ${open ? '#4a7260' : 'var(--border)'}`,
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
            background: '#0f2018', border: '1px solid #2a5040',
            borderRadius: '16px', padding: '14px 14px 10px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          }}
        >
          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <button type="button" onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} style={calNavBtnStyle}>‹</button>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f0ebe1', textTransform: 'capitalize' as const }}>
              {monthName}
            </span>
            <button type="button" onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} style={calNavBtnStyle}>›</button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '2px' }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 600, color: '#4a7260', padding: '3px 0', letterSpacing: '0.5px' }}>{d}</div>
            ))}
          </div>

          {/* Days grid */}
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
                  background: isSel ? 'var(--accent-bg-2)' : isToday2 ? 'rgba(52,211,153,0.1)' : 'transparent',
                  color: isSel ? 'var(--accent-text)' : isToday2 ? '#34D399' : '#a5c4b0',
                  cursor: 'pointer',
                  outline: isSel ? '1.5px solid var(--accent-border)' : 'none',
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
  background: 'var(--surface)', border: '1px solid #1e3d2f',
  borderRadius: '8px', color: '#a5c4b0', fontSize: '18px',
  width: '32px', height: '32px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', lineHeight: 1,
}

type BailleurProfile = {
  prenom: string
  nom: string
  email: string
  iban: string | null
  bic: string | null
  adresse?: string | null
  stripeReady?: boolean
}

type LogementOption = {
  id: string
  nom: string
  adresse: string
  telephone: string | null
  description: string | null
  capacite_max: number
  reglement_interieur: string | null
  conditions_annulation: string | null
  animaux_acceptes: boolean
  fumeur_accepte: boolean
  methodes_paiement?: string | null
}

interface Props {
  voyageur: Voyageur
  sejours: Sejour[]
  isFlagged: boolean
  bailleur: BailleurProfile
  logements?: LogementOption[]
  plan?: string
}

export default function VoyageurDetail({ voyageur, sejours, isFlagged, bailleur, logements = [], plan = 'decouverte' }: Props) {
  const isDecouverte = plan === 'decouverte'
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Contract modal
  const [contractSejour, setContractSejour] = useState<Sejour | null>(null)

  // Deposit modal
  const [depositContract, setDepositContract] = useState<DepositContract | null>(null)
  const [depositLoading, setDepositLoading] = useState<string | null>(null)
  const [forceSyncModal, setForceSyncModal] = useState<{ contractId: string; name: string } | null>(null)

  async function openDepositModal(sejourId: string) {
    setDepositLoading(sejourId)
    try {
      const { getContractsBySejour } = await import('../contract-actions')
      const res = await getContractsBySejour(sejourId)
      const signed = res.contracts?.find(c => c.statut === 'signe')
      if (signed) {
        setDepositContract(signed as DepositContract)
      } else {
        const pending = res.contracts?.[0]
        if (pending) {
          setForceSyncModal({ contractId: pending.id, name: `${pending.locataire_prenom} ${pending.locataire_nom}` })
        }
      }
    } finally {
      setDepositLoading(null)
    }
  }

  // Contract loading state (for fetching token when contrat_lien is null)
  const [contractLoading, setContractLoading] = useState<string | null>(null)

  async function handleContractClick(sj: Sejour) {
    // If a link already exists, open it directly
    if (sj.contrat_lien) {
      window.open(sj.contrat_lien, '_blank', 'noopener,noreferrer')
      return
    }
    // If there's an existing (en_attente) contract without link yet, fetch it
    if (sj.contrat_statut === 'en_attente') {
      setContractLoading(sj.id)
      try {
        const { getContractsBySejour } = await import('../contract-actions')
        const res = await getContractsBySejour(sj.id)
        const latest = res.contracts?.[0]
        if (latest?.token) {
          const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'
          window.open(`${APP_URL}/sign/${latest.token}`, '_blank', 'noopener,noreferrer')
          return
        }
      } finally {
        setContractLoading(null)
      }
    }
    // No contract yet — open creation modal
    setContractSejour(sj)
  }

  // Profile inline edit
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    prenom: voyageur.prenom,
    nom: voyageur.nom,
    email: voyageur.email ?? '',
    telephone: voyageur.telephone ?? '',
  })
  const [profileError, setProfileError] = useState('')

  // Notes inline edit
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState(voyageur.notes ?? '')

  // Phase 4 — états locaux pour tags, source, vérification, blocage, note privée
  const [tags, setTags] = useState<string[]>(voyageur.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [source, setSource] = useState<string | null>(voyageur.source ?? null)
  const [idVerifie, setIdVerifie] = useState<boolean>(voyageur.id_verifie ?? false)
  const [idType, setIdType] = useState<string | null>(voyageur.id_type ?? null)
  const [idUrl, setIdUrl] = useState<string>(voyageur.id_url ?? '')
  const [bloque, setBloque] = useState<boolean>(voyageur.bloque ?? false)
  const [bloqueMotif, setBloqueMotif] = useState<string>(voyageur.bloque_motif ?? '')
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [notePrivee, setNotePrivee] = useState<number | null>(voyageur.note_privee ?? null)

  async function persistField(patch: Partial<VoyageurData>) {
    startTransition(async () => {
      await updateVoyageur(voyageur.id, {
        prenom: voyageur.prenom, nom: voyageur.nom,
        email: voyageur.email ?? undefined,
        telephone: voyageur.telephone ?? undefined,
        notes: voyageur.notes ?? undefined,
        ...patch,
      })
    })
  }

  function handleAddTag(t: string) {
    const cleaned = t.trim()
    if (!cleaned || tags.includes(cleaned)) return
    const next = [...tags, cleaned]
    setTags(next); setTagInput('')
    persistField({ tags: next })
  }
  function handleRemoveTag(t: string) {
    const next = tags.filter(x => x !== t)
    setTags(next)
    persistField({ tags: next })
  }
  function handleSourceChange(s: string | null) {
    setSource(s)
    persistField({ source: s })
  }
  function handleNotePriveeChange(n: number | null) {
    setNotePrivee(n)
    persistField({ note_privee: n })
  }
  function handleBlockConfirm() {
    setBloque(true); setShowBlockDialog(false)
    persistField({ bloque: true, bloque_motif: bloqueMotif || null })
  }
  function handleUnblock() {
    setBloque(false); setBloqueMotif('')
    persistField({ bloque: false, bloque_motif: null })
  }
  function saveIdVerification() {
    persistField({ id_verifie: idVerifie, id_type: idType, id_url: idUrl || null })
  }

  // Report / Testimony modal
  const [reportModal, setReportModal] = useState<'report' | 'positive' | null>(null)
  const [reportForm, setReportForm] = useState({ incident_type: INCIDENT_TYPES[0], description: '' })
  const [positiveForm, setPositiveForm] = useState({ incident_type: POSITIVE_TYPES[0], description: '' })
  const [reportError, setReportError] = useState('')
  const [reportSuccess, setReportSuccess] = useState(false)
  const [isReporting, startReport] = useTransition()

  // Séjour modal
  const [sejourModal, setSejourModal] = useState<'add' | 'edit' | null>(null)
  const [editSejour, setEditSejour] = useState<Sejour | null>(null)
  const [sejourForm, setSejourForm] = useState<Omit<SejourData, 'voyageur_id'>>(EMPTY_SEJOUR)
  const [sejourError, setSejourError] = useState('')
  const [manualLogement, setManualLogement] = useState(false)

  // Checklist panel
  const [expandedSejourId, setExpandedSejourId] = useState<string | null>(null)
  const [checklistData, setChecklistData] = useState<
    Record<string, { contractId: string; items: Record<string, boolean> } | null>
  >({})
  const [checklistLoading, setChecklistLoading] = useState<string | null>(null)

  // Incidents panel
  const [expandedIncidentsSejourId, setExpandedIncidentsSejourId] = useState<string | null>(null)
  const [incidentCounts, setIncidentCounts] = useState<Record<string, { open: number; total: number }>>({})

  async function toggleChecklist(sejourId: string) {
    if (expandedSejourId === sejourId) { setExpandedSejourId(null); return }
    setExpandedSejourId(sejourId)
    if (checklistData[sejourId] !== undefined) return
    setChecklistLoading(sejourId)
    try {
      const { getChecklistBySejour } = await import('../contract-actions')
      const res = await getChecklistBySejour(sejourId)
      setChecklistData(prev => ({
        ...prev,
        [sejourId]: res.contractId
          ? { contractId: res.contractId, items: res.checklist ?? {} }
          : null,
      }))
    } finally {
      setChecklistLoading(null)
    }
  }

  async function handleChecklistToggle(sejourId: string, contractId: string, key: string, value: boolean) {
    setChecklistData(prev => {
      const entry = prev[sejourId]
      if (!entry) return prev
      return { ...prev, [sejourId]: { ...entry, items: { ...entry.items, [key]: value } } }
    })
    await updateContractChecklist(contractId, key, value)
  }

  const initials = `${voyageur.prenom[0]}${voyageur.nom[0]}`.toUpperCase()
  const color = avatarColor(voyageur.prenom + voyageur.nom)

  // ─── Stats voyageur (CA, séjours, durée moyenne, dernière venue, statut auto) ──
  const todayISO = new Date().toISOString().slice(0, 10)
  const stats = (() => {
    const totalCA = sejours.reduce((sum, s) => sum + (s.montant ?? 0), 0)
    const nbSejours = sejours.length
    const totalNuits = sejours.reduce((sum, s) => sum + nights(s.date_arrivee, s.date_depart), 0)
    const dureeMoyenne = nbSejours > 0 ? Math.round(totalNuits / nbSejours) : 0

    // Dernière venue = date_depart la plus récente parmi les séjours passés
    const past = sejours.filter(s => s.date_depart < todayISO).sort((a, b) => b.date_depart.localeCompare(a.date_depart))
    const lastVisit = past[0]?.date_depart ?? null

    // Prochain séjour à venir
    const upcoming = sejours.filter(s => s.date_arrivee >= todayISO).sort((a, b) => a.date_arrivee.localeCompare(b.date_arrivee))
    const nextStay = upcoming[0] ?? null

    // Statut auto
    let statut: { label: string; color: string; bg: string; border: string }
    if (isFlagged) {
      statut = { label: 'Signalé', color: '#ef4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.30)' }
    } else if (totalCA >= 5000 || nbSejours >= 5) {
      statut = { label: 'VIP', color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.30)' }
    } else if (nbSejours >= 4) {
      statut = { label: 'Fidèle', color: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.30)' }
    } else if (nbSejours >= 2) {
      statut = { label: 'Récurrent', color: '#60a5fa', bg: 'rgba(96,165,250,0.10)', border: 'rgba(96,165,250,0.30)' }
    } else {
      statut = { label: 'Nouveau', color: 'var(--text-muted)', bg: 'var(--surface)', border: 'var(--border)' }
    }

    return { totalCA, nbSejours, dureeMoyenne, lastVisit, nextStay, statut }
  })()

  // ─── Logements fréquentés (pour bouton "Voir le logement") ──
  const logementsFrequentes = (() => {
    const counts = new Map<string, number>()
    sejours.forEach(sj => {
      if (sj.logement) counts.set(sj.logement, (counts.get(sj.logement) ?? 0) + 1)
    })
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
    return sorted.map(([nom, count]) => ({ nom, count, logementId: logements.find(l => l.nom === nom)?.id }))
  })()

  // Date à utiliser pour le calendrier : prochain à venir, sinon dernier passé
  const calendrierTargetDate = stats.nextStay?.date_arrivee ?? stats.lastVisit ?? null

  // ─── Score de confiance (algorithmique) ──
  const trustScore = (() => {
    let score = 50 // base neutre
    if (idVerifie) score += 25
    if (sejours.length >= 2) score += 10
    if (sejours.length >= 4) score += 15
    if (notePrivee && notePrivee >= 4) score += 10
    if (isFlagged) score -= 60
    if (bloque) score -= 100
    return Math.max(0, Math.min(100, score))
  })()
  const trustLabel =
    trustScore >= 80 ? { label: 'Très fiable',  color: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.30)' } :
    trustScore >= 60 ? { label: 'Fiable',        color: '#34d399', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.30)' } :
    trustScore >= 40 ? { label: 'Neutre',        color: 'var(--text-2)', bg: 'var(--surface)',  border: 'var(--border)' } :
    trustScore >= 20 ? { label: 'À surveiller',  color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)' } :
                       { label: 'Risque élevé',  color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.30)' }

  // ─── Timeline d'événements (calculée depuis séjours + contrat) ──
  type TimelineEvent = { date: string; icon: string; label: string; subtitle?: string; tone: 'past' | 'today' | 'future' }
  const timeline: TimelineEvent[] = (() => {
    const events: TimelineEvent[] = []
    sejours.forEach(sj => {
      const tone = (d: string): TimelineEvent['tone'] =>
        d < todayISO ? 'past' : d === todayISO ? 'today' : 'future'

      // Création (contrat envoyé / signé)
      if (sj.contrat_statut === 'signe' && sj.contrat_date_signature) {
        events.push({
          date: sj.contrat_date_signature,
          icon: '✍️',
          label: 'Contrat signé',
          subtitle: sj.logement ?? undefined,
          tone: tone(sj.contrat_date_signature),
        })
      } else if (sj.contrat_statut === 'en_attente') {
        events.push({
          date: sj.date_arrivee,
          icon: '📨',
          label: 'Contrat envoyé, en attente de signature',
          subtitle: sj.logement ?? undefined,
          tone: 'future',
        })
      }

      // Arrivée
      events.push({
        date: sj.date_arrivee,
        icon: '🛬',
        label: 'Arrivée',
        subtitle: sj.logement ? `${sj.logement}${sj.montant ? ` · ${sj.montant} €` : ''}` : undefined,
        tone: tone(sj.date_arrivee),
      })

      // Départ
      events.push({
        date: sj.date_depart,
        icon: '🛫',
        label: 'Départ',
        subtitle: `${nights(sj.date_arrivee, sj.date_depart)} nuit${nights(sj.date_arrivee, sj.date_depart) > 1 ? 's' : ''}`,
        tone: tone(sj.date_depart),
      })
    })

    // Ajout de la création du voyageur
    events.push({
      date: voyageur.created_at.slice(0, 10),
      icon: '👤',
      label: 'Voyageur ajouté',
      tone: 'past',
    })

    return events.sort((a, b) => b.date.localeCompare(a.date))
  })()

  function saveProfile() {
    if (!profileForm.prenom.trim() || !profileForm.nom.trim()) {
      setProfileError('Prénom et nom sont obligatoires.')
      return
    }
    setProfileError('')
    startTransition(async () => {
      const data: VoyageurData = {
        prenom: profileForm.prenom.trim(),
        nom: profileForm.nom.trim(),
        email: profileForm.email.trim() || undefined,
        telephone: profileForm.telephone.trim() || undefined,
        notes: notes.trim() || undefined,
      }
      const res = await updateVoyageur(voyageur.id, data)
      if (res.error) { setProfileError(res.error); return }
      setEditingProfile(false)
      router.refresh()
    })
  }

  function saveNotes() {
    startTransition(async () => {
      const data: VoyageurData = {
        prenom: profileForm.prenom || voyageur.prenom,
        nom: profileForm.nom || voyageur.nom,
        email: profileForm.email.trim() || voyageur.email || undefined,
        telephone: profileForm.telephone.trim() || voyageur.telephone || undefined,
        notes: notes.trim() || undefined,
      }
      await updateVoyageur(voyageur.id, data)
      setEditingNotes(false)
      router.refresh()
    })
  }

  function openAddSejour() {
    setSejourForm(EMPTY_SEJOUR)
    setSejourError('')
    setEditSejour(null)
    setManualLogement(false)
    setSejourModal('add')
  }

  function openEditSejour(s: Sejour) {
    // En édition : si la valeur actuelle ne correspond à aucun logement enregistré, activer le mode manuel
    setManualLogement(logements.length === 0 || !logements.some(l => l.nom === s.logement))
    setSejourForm({
      logement: s.logement ?? '',
      date_arrivee: s.date_arrivee,
      date_depart: s.date_depart,
      montant: s.montant,
      contrat_statut: s.contrat_statut,
      contrat_date_signature: s.contrat_date_signature,
      contrat_lien: s.contrat_lien,
    })
    setSejourError('')
    setEditSejour(s)
    setSejourModal('edit')
  }

  function handleSejourSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sejourForm.date_arrivee || !sejourForm.date_depart) {
      setSejourError('Les dates sont obligatoires.')
      return
    }
    if (sejourForm.date_depart <= sejourForm.date_arrivee) {
      setSejourError('La date de départ doit être après l\'arrivée.')
      return
    }
    setSejourError('')
    startTransition(async () => {
      const data: SejourData = { ...sejourForm, voyageur_id: voyageur.id }
      const res = sejourModal === 'edit' && editSejour
        ? await updateSejour(editSejour.id, voyageur.id, sejourForm)
        : await addSejour(data)
      if (res.error) { setSejourError(res.error); return }
      setSejourModal(null)
      router.refresh()
    })
  }

  function handleDeleteSejour(id: string) {
    if (!confirm('Supprimer ce séjour ?')) return
    startTransition(async () => {
      await deleteSejour(id, voyageur.id)
      router.refresh()
    })
  }

  function openReportModal(type: 'report' | 'positive') {
    setReportForm({ incident_type: INCIDENT_TYPES[0], description: '' })
    setPositiveForm({ incident_type: POSITIVE_TYPES[0], description: '' })
    setReportError('')
    setReportSuccess(false)
    setReportModal(type)
  }

  function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault()
    const isPositive = reportModal === 'positive'
    const form = isPositive ? positiveForm : reportForm
    if (!form.description || form.description.trim().length < 20) {
      setReportError('La description doit faire au moins 20 caractères.')
      return
    }
    setReportError('')
    startReport(async () => {
      const res = await reportGuest({
        email: voyageur.email ?? undefined,
        phone: voyageur.telephone ?? undefined,
        full_name: `${voyageur.prenom} ${voyageur.nom}`,
        incident_type: form.incident_type,
        description: form.description.trim(),
      })
      if (res.error) { setReportError(res.error); return }
      setReportSuccess(true)
    })
  }

  return (
    <div style={s.page}>
      <style>{`
        .sejour-actions {
          display: flex;
          gap: 6px;
          align-items: center;
          flex-wrap: wrap;
          flex-shrink: 0;
        }
        @media (max-width: 900px) {
          .voyageur-layout {
            grid-template-columns: 1fr !important;
          }
          .voyageur-left {
            position: static !important;
          }
        }
        @media (max-width: 600px) {
          .sejour-row-mobile {
            flex-direction: column !important;
          }
          .sejour-actions {
            width: 100%;
            justify-content: flex-start;
            border-top: 1px solid var(--border);
            padding-top: 10px;
            margin-top: 4px;
          }
        }
      `}</style>

      {/* Back */}
      <button onClick={() => router.push('/dashboard/voyageurs')} style={s.backBtn} className="fade-up">
        <ArrowLeft size={16} />
        Mes Voyageurs
      </button>

      {/* Flag banner */}
      {isFlagged && (
        <div style={s.flagBanner} className="fade-up">
          <Warning size={18} weight="fill" color="#ef4444" />
          <div>
            <strong>Ce voyageur est signalé</strong> dans la base Sécurité Voyageur.
            Consultez la fiche avant d&apos;accepter une réservation.
          </div>
        </div>
      )}

      {/* Layout 2 colonnes (devient 1 col en < 900px) */}
      <div className="voyageur-layout" style={s.layoutGrid}>
        <div className="voyageur-left" style={s.leftColumn}>

      {/* Profile card */}
      <div style={s.profileCard} className="fade-up glass-card">
        <div style={{ ...s.bigAvatar, background: color }}>
          <span style={s.bigAvatarText}>{initials}</span>
        </div>
        <div style={s.profileInfo}>
          {editingProfile ? (
            <div style={s.profileEditForm}>
              <div style={s.profileEditRow}>
                <div style={s.field}>
                  <label style={s.label}>Prénom *</label>
                  <div style={s.inputWrap}>
                    <input
                      style={s.input} autoFocus
                      value={profileForm.prenom}
                      onChange={e => setProfileForm(f => ({ ...f, prenom: e.target.value }))}
                      placeholder="Jean"
                    />
                  </div>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Nom *</label>
                  <div style={s.inputWrap}>
                    <input
                      style={s.input}
                      value={profileForm.nom}
                      onChange={e => setProfileForm(f => ({ ...f, nom: e.target.value }))}
                      placeholder="Dupont"
                    />
                  </div>
                </div>
              </div>
              <div style={s.profileEditRow}>
                <div style={s.field}>
                  <label style={s.label}>Email</label>
                  <div style={s.inputWrap}>
                    <Envelope size={14} color="var(--text-muted)" />
                    <input
                      style={s.input} type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="jean@email.com"
                    />
                  </div>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Téléphone</label>
                  <div style={s.inputWrap}>
                    <Phone size={14} color="var(--text-muted)" />
                    <input
                      style={s.input} type="tel"
                      value={profileForm.telephone}
                      onChange={e => setProfileForm(f => ({ ...f, telephone: e.target.value }))}
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                </div>
              </div>
              {profileError && <p style={s.error}>{profileError}</p>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setEditingProfile(false); setProfileError('') }} className="btn-ghost">
                  Annuler
                </button>
                <button onClick={saveProfile} className="btn-primary" disabled={isPending}>
                  <Check size={14} />
                  {isPending ? 'Enregistrement…' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={s.profileNameRow}>
                <h2 style={s.profileName}>{voyageur.prenom} {voyageur.nom}</h2>
                <button onClick={() => setEditingProfile(true)} style={s.editBtn}>
                  <Pencil size={14} />
                  Modifier
                </button>
                <button onClick={() => openReportModal('report')} style={s.reportBtn} title="Signaler un incident">
                  <ShieldWarning size={14} />
                  Signaler
                </button>
                <button onClick={() => openReportModal('positive')} style={s.testimonyBtn} title="Laisser un témoignage positif">
                  <Star size={14} />
                  Témoigner
                </button>
              </div>
              <div style={s.contactList}>
                {voyageur.email ? (
                  <a href={`mailto:${voyageur.email}`} style={s.contactItem}>
                    <Envelope size={14} color="var(--text-muted)" />
                    {voyageur.email}
                  </a>
                ) : (
                  <button onClick={() => setEditingProfile(true)} style={s.addFieldBtn}>
                    <Envelope size={14} />
                    Ajouter un email
                  </button>
                )}
                {voyageur.telephone ? (
                  <a href={`tel:${voyageur.telephone}`} style={s.contactItem}>
                    <Phone size={14} color="var(--text-muted)" />
                    {voyageur.telephone}
                  </a>
                ) : (
                  <button onClick={() => setEditingProfile(true)} style={s.addFieldBtn}>
                    <Phone size={14} />
                    Ajouter un téléphone
                  </button>
                )}
              </div>

              {/* Quick actions communication */}
              {(voyageur.email || voyageur.telephone) && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const, justifyContent: 'center', marginTop: '4px' }}>
                  {voyageur.email && (
                    <a
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(voyageur.email)}&su=${encodeURIComponent(`Bonjour ${voyageur.prenom}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '6px 12px', fontSize: '12px', fontWeight: 500,
                        background: 'var(--accent-bg)', color: 'var(--accent-text)',
                        border: '1px solid var(--accent-border)', borderRadius: '8px',
                        textDecoration: 'none' as const,
                      }}
                      title="Ouvre Gmail dans un nouvel onglet"
                    >
                      <Envelope size={13} weight="fill" />
                      Envoyer un email
                    </a>
                  )}
                  {voyageur.telephone && (
                    <a
                      href={`sms:${voyageur.telephone}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '6px 12px', fontSize: '12px', fontWeight: 500,
                        background: 'var(--surface)', color: 'var(--text-2)',
                        border: '1px solid var(--border)', borderRadius: '8px',
                        textDecoration: 'none' as const,
                      }}
                    >
                      <Phone size={13} weight="fill" />
                      SMS
                    </a>
                  )}
                </div>
              )}

              {/* Liens inter-modules (calendrier + logement) */}
              {(calendrierTargetDate || logementsFrequentes.length > 0) && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const, justifyContent: 'center', marginTop: '4px' }}>
                  {calendrierTargetDate && (
                    <a
                      href={`/dashboard/calendrier`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '6px 12px', fontSize: '12px', fontWeight: 500,
                        background: 'var(--surface)', color: 'var(--text-2)',
                        border: '1px solid var(--border)', borderRadius: '8px',
                        textDecoration: 'none' as const,
                      }}
                    >
                      <CalendarBlank size={13} weight="fill" />
                      Calendrier
                    </a>
                  )}
                  {logementsFrequentes.length === 1 && logementsFrequentes[0].logementId && (
                    <a
                      href={`/dashboard/logements/${logementsFrequentes[0].logementId}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '6px 12px', fontSize: '12px', fontWeight: 500,
                        background: 'var(--surface)', color: 'var(--text-2)',
                        border: '1px solid var(--border)', borderRadius: '8px',
                        textDecoration: 'none' as const,
                      }}
                    >
                      <House size={13} weight="fill" />
                      {logementsFrequentes[0].nom}
                    </a>
                  )}
                  {logementsFrequentes.length > 1 && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '6px 12px', fontSize: '12px', fontWeight: 500,
                      background: 'var(--surface)', color: 'var(--text-muted)',
                      border: '1px solid var(--border)', borderRadius: '8px',
                    }}>
                      <House size={13} weight="fill" />
                      {logementsFrequentes.length} logements visités
                    </span>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' as const, justifyContent: 'center' }}>
                <span style={{ ...s.statutBadge, color: stats.statut.color, background: stats.statut.bg, borderColor: stats.statut.border }}>
                  {stats.statut.label}
                </span>
                {bloque && (
                  <span style={{ ...s.statutBadge, color: '#94a3b8', background: 'rgba(148,163,184,0.12)', borderColor: 'rgba(148,163,184,0.30)' }}>
                    🚫 Bloqué
                  </span>
                )}
                {source && SOURCE_LABELS[source] && (
                  <span style={{ ...s.statutBadge, color: 'var(--text-2)', background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                    {SOURCE_LABELS[source].emoji} {SOURCE_LABELS[source].label}
                  </span>
                )}
                <span style={s.since}>Ajouté le {formatDate(voyageur.created_at)}</span>
              </div>

              {/* Note privée (étoiles) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', justifyContent: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.4px', textTransform: 'uppercase' as const }}>
                  Note
                </span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map(n => {
                    const filled = (notePrivee ?? 0) >= n
                    return (
                      <button
                        key={n} type="button"
                        onClick={() => handleNotePriveeChange(notePrivee === n ? null : n)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}
                        title={`${n} étoile${n > 1 ? 's' : ''}`}
                      >
                        <Star size={14} weight={filled ? 'fill' : 'regular'} color={filled ? '#fbbf24' : 'var(--text-muted)'} />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Mini-stats voyageur */}
              {sejours.length > 0 && (
                <div style={s.voyageurStats}>
                  <div style={s.voyageurStat}>
                    <span style={s.voyageurStatLabel}>CA total</span>
                    <span style={s.voyageurStatValue}>{stats.totalCA.toLocaleString('fr-FR')} €</span>
                  </div>
                  <div style={s.voyageurStat}>
                    <span style={s.voyageurStatLabel}>Séjours</span>
                    <span style={s.voyageurStatValue}>{stats.nbSejours}</span>
                  </div>
                  <div style={s.voyageurStat}>
                    <span style={s.voyageurStatLabel}>Durée moyenne</span>
                    <span style={s.voyageurStatValue}>{stats.dureeMoyenne}n.</span>
                  </div>
                  <div style={s.voyageurStat}>
                    <span style={s.voyageurStatLabel}>Dernière venue</span>
                    <span style={s.voyageurStatValue}>{stats.lastVisit ? formatDate(stats.lastVisit) : '—'}</span>
                  </div>
                  {stats.nextStay && (
                    <div style={{ ...s.voyageurStat, gridColumn: 'span 2', background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
                      <span style={{ ...s.voyageurStatLabel, color: 'var(--accent-text)' }}>Prochain séjour</span>
                      <span style={{ ...s.voyageurStatValue, color: 'var(--accent-text)' }}>
                        {formatDate(stats.nextStay.date_arrivee)}
                        {stats.nextStay.logement && ` · ${stats.nextStay.logement}`}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Notes */}
      <div style={s.section} className="fade-up">
        <div style={s.sectionHeader}>
          <div style={s.sectionTitle}>
            <Note size={16} color="var(--text-3)" />
            Notes privées
          </div>
          {!editingNotes && (
            <button onClick={() => setEditingNotes(true)} style={s.editBtn}>
              <Pencil size={14} />
              Modifier
            </button>
          )}
        </div>
        {editingNotes ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={s.notesTextarea}
              rows={4}
              placeholder="Préférences, habitudes, informations utiles…"
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setNotes(voyageur.notes ?? ''); setEditingNotes(false) }} className="btn-ghost">
                Annuler
              </button>
              <button onClick={saveNotes} className="btn-primary" disabled={isPending}>
                <Check size={14} />
                Sauvegarder
              </button>
            </div>
          </div>
        ) : (
          <p style={s.notesText}>
            {notes || <em style={{ color: 'var(--text-muted)' }}>Aucune note pour l&apos;instant.</em>}
          </p>
        )}
      </div>

      {/* ── Tags ── */}
      <div style={s.section} className="fade-up">
        <div style={s.sectionHeader}>
          <div style={s.sectionTitle}>
            🏷️ Tags
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: '8px' }}>
          {tags.length === 0 ? (
            <em style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Aucun tag.</em>
          ) : tags.map(t => (
            <span key={t} style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '11.5px', fontWeight: 600,
              padding: '4px 4px 4px 10px',
              background: 'var(--accent-bg)', color: 'var(--accent-text)',
              border: '1px solid var(--accent-border)', borderRadius: '100px',
            }}>
              {t}
              <button
                onClick={() => handleRemoveTag(t)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0 2px', display: 'flex' }}
                title="Retirer ce tag"
              >
                <X size={11} weight="bold" />
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(tagInput) } }}
            placeholder="Famille, Business, VIP, À fidéliser…"
            style={{
              flex: 1, padding: '7px 10px', fontSize: '12px',
              fontFamily: 'inherit', color: 'var(--text)',
              background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: '8px', outline: 'none',
            }}
          />
          <button
            onClick={() => handleAddTag(tagInput)}
            disabled={!tagInput.trim()}
            style={{
              padding: '7px 12px', fontSize: '12px', fontWeight: 600,
              background: 'var(--accent-bg)', color: 'var(--accent-text)',
              border: '1px solid var(--accent-border)', borderRadius: '8px',
              cursor: tagInput.trim() ? 'pointer' : 'not-allowed',
              opacity: tagInput.trim() ? 1 : 0.5, fontFamily: 'inherit',
            }}
          >
            + Ajouter
          </button>
        </div>
      </div>

      {/* ── Source d'acquisition ── */}
      <div style={s.section} className="fade-up">
        <div style={s.sectionHeader}>
          <div style={s.sectionTitle}>
            📍 Source d&apos;acquisition
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
          {Object.entries(SOURCE_LABELS).map(([key, def]) => {
            const selected = source === key
            return (
              <button
                key={key}
                onClick={() => handleSourceChange(selected ? null : key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '5px 10px',
                  fontSize: '11.5px', fontWeight: 500,
                  background: selected ? 'var(--accent-bg)' : 'var(--surface)',
                  color: selected ? 'var(--accent-text)' : 'var(--text-2)',
                  border: `1px solid ${selected ? 'var(--accent-border)' : 'var(--border)'}`,
                  borderRadius: '100px',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <span>{def.emoji}</span>
                {def.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Vérification & sécurité ── */}
      <div style={s.section} className="fade-up">
        <div style={s.sectionHeader}>
          <div style={s.sectionTitle}>
            🔒 Vérification & sécurité
          </div>
        </div>

        {/* Score de confiance */}
        <div style={{
          padding: '12px 14px',
          background: trustLabel.bg,
          border: `1px solid ${trustLabel.border}`,
          borderRadius: '10px',
          marginBottom: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Score de confiance
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '24px', fontWeight: 500, color: trustLabel.color, lineHeight: 1 }}>
                {trustScore}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ 100</span>
              <span style={{ marginLeft: '6px', fontSize: '11px', fontWeight: 600, color: trustLabel.color, letterSpacing: '0.3px' }}>
                {trustLabel.label}
              </span>
            </div>
          </div>
          {/* Mini barre de progression */}
          <div style={{ width: '70px', height: '6px', background: 'var(--surface-2)', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ width: `${trustScore}%`, height: '100%', background: trustLabel.color, transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* ID vérifiée */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={idVerifie}
              onChange={(e) => { setIdVerifie(e.target.checked); persistField({ id_verifie: e.target.checked }) }}
              style={{ width: '15px', height: '15px', accentColor: '#10b981' }}
            />
            <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 500 }}>
              Pièce d&apos;identité vérifiée
            </span>
            {idVerifie && <Check size={12} weight="bold" color="#10b981" />}
          </label>

          {idVerifie && (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px', marginLeft: '23px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {(['cni', 'passeport', 'permis', 'autre'] as const).map(t => {
                  const sel = idType === t
                  const labels = { cni: 'CNI', passeport: 'Passeport', permis: 'Permis', autre: 'Autre' }
                  return (
                    <button
                      key={t}
                      onClick={() => { setIdType(t); persistField({ id_type: t }) }}
                      style={{
                        flex: 1,
                        padding: '5px 8px',
                        fontSize: '11px', fontWeight: 500,
                        background: sel ? 'var(--accent-bg)' : 'var(--surface)',
                        color: sel ? 'var(--accent-text)' : 'var(--text-2)',
                        border: `1px solid ${sel ? 'var(--accent-border)' : 'var(--border)'}`,
                        borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {labels[t]}
                    </button>
                  )
                })}
              </div>
              <input
                value={idUrl}
                onChange={(e) => setIdUrl(e.target.value)}
                onBlur={saveIdVerification}
                placeholder="URL de la pièce (optionnel)"
                style={{
                  padding: '7px 10px', fontSize: '12px',
                  fontFamily: 'inherit', color: 'var(--text)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)', borderRadius: '7px', outline: 'none',
                }}
              />
            </div>
          )}
        </div>

        {/* Blocage */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
          {!bloque ? (
            <button
              onClick={() => setShowBlockDialog(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px',
                fontSize: '12px', fontWeight: 500,
                background: 'rgba(239,68,68,0.05)',
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.20)',
                borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              🚫 Bloquer ce voyageur
            </button>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444' }}>
                  🚫 Voyageur bloqué
                </span>
              </div>
              {bloqueMotif && (
                <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: '0 0 8px', lineHeight: 1.5 }}>
                  Motif : {bloqueMotif}
                </p>
              )}
              <button
                onClick={handleUnblock}
                style={{
                  padding: '5px 10px',
                  fontSize: '11.5px', fontWeight: 500,
                  background: 'var(--surface)',
                  color: 'var(--text-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Débloquer
              </button>
            </div>
          )}

          {showBlockDialog && (
            <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '10px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: '0 0 8px', lineHeight: 1.5 }}>
                Bloquer un voyageur ne supprime pas son historique mais l&apos;empêche d&apos;avoir de nouveaux séjours. Donnez un motif (optionnel) :
              </p>
              <textarea
                value={bloqueMotif}
                onChange={(e) => setBloqueMotif(e.target.value)}
                placeholder="Dégradation, fraude, comportement inapproprié…"
                rows={2}
                style={{
                  width: '100%', boxSizing: 'border-box' as const,
                  padding: '7px 10px', fontSize: '12px',
                  fontFamily: 'inherit', color: 'var(--text)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)', borderRadius: '7px', outline: 'none',
                  resize: 'vertical' as const, marginBottom: '8px',
                }}
              />
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowBlockDialog(false); setBloqueMotif('') }}
                  style={{ padding: '5px 10px', fontSize: '12px', background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleBlockConfirm}
                  style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Confirmer le blocage
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

        </div>
        {/* ─── Colonne droite ─── */}
        <div style={s.rightColumn}>

      {/* Séjours */}
      <div style={s.section} className="fade-up">
        <div style={s.sectionHeader}>
          <div style={s.sectionTitle}>
            <CalendarBlank size={16} color="var(--text-3)" />
            Séjours ({sejours.length})
          </div>
          <button onClick={openAddSejour} className="btn-primary" style={{ padding: '7px 14px', fontSize: '13px' }}>
            <Plus size={14} weight="bold" />
            Ajouter
          </button>
        </div>

        {sejours.length === 0 && (
          <p style={{ ...s.notesText, textAlign: 'center', padding: '24px 0' }}>
            <em style={{ color: 'var(--text-muted)' }}>Aucun séjour enregistré.</em>
          </p>
        )}

        <div style={s.sejourList}>
          {sejours.map(sj => {
            const ct = CONTRAT_LABELS[sj.contrat_statut]
            const n = nights(sj.date_arrivee, sj.date_depart)
            const isExpanded = expandedSejourId === sj.id
            const cl = checklistData[sj.id]
            const doneCount = cl ? Object.values(cl.items).filter(Boolean).length : 0
            const pct = cl ? Math.round((doneCount / CL_TOTAL) * 100) : 0
            return (
              <div key={sj.id}>
              <div style={s.sejourRow} className="sejour-row-mobile">
                <div style={s.sejourLeft}>
                  <div style={s.sejourDates}>
                    {formatDate(sj.date_arrivee)} → {formatDate(sj.date_depart)}
                    <span style={s.nightsBadge}>{n} nuit{n > 1 ? 's' : ''}</span>
                  </div>
                  <div style={s.sejourMeta}>
                    {sj.logement && (
                      <span style={s.metaChip}>
                        <House size={12} />
                        {sj.logement}
                      </span>
                    )}
                    {sj.montant != null && (
                      <span style={s.metaChip}>
                        <CurrencyEur size={12} />
                        {sj.montant.toLocaleString('fr-FR')} €
                      </span>
                    )}
                    <span style={{ ...s.metaChip, color: ct.color, background: ct.bg }}>
                      <Seal size={12} />
                      {ct.label}
                    </span>
                  </div>
                </div>
                <div className="sejour-actions">
                  {isDecouverte ? (
                    <a href="/dashboard/abonnement" style={{ ...s.contractBtn, opacity: 0.6, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }} title="Contrats disponibles en Standard">
                      <Lock size={13} /> Standard
                    </a>
                  ) : (
                  <button
                    onClick={() => handleContractClick(sj)}
                    style={s.contractBtn}
                    disabled={contractLoading === sj.id}
                    title={sj.contrat_statut === 'nouveau' ? 'Créer un contrat' : 'Voir le contrat'}
                  >
                    <FileText size={13} weight="fill" />
                    {contractLoading === sj.id ? '…' : sj.contrat_statut === 'nouveau' ? 'Créer contrat' : 'Voir contrat'}
                  </button>
                  )}
                  {sj.contrat_statut === 'signe' && (
                    <button
                      onClick={() => openDepositModal(sj.id)}
                      disabled={depositLoading === sj.id}
                      style={s.depositBtn}
                      title="Gérer les paiements"
                    >
                      {depositLoading === sj.id ? '…' : 'Paiements'}
                    </button>
                  )}
                  <button onClick={() => openEditSejour(sj)} style={s.sejourActionBtn} title="Modifier">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDeleteSejour(sj.id)} style={{ ...s.sejourActionBtn, color: '#ef4444' }} title="Supprimer">
                    <X size={14} />
                  </button>
                  <button
                    onClick={() => toggleChecklist(sj.id)}
                    disabled={checklistLoading === sj.id}
                    style={{ ...s.checklistBtn, ...(isExpanded ? s.checklistBtnActive : {}) }}
                    title="Checklist du séjour"
                  >
                    <ListChecks size={13} />
                    {checklistLoading === sj.id ? '…' : (
                      cl ? `${doneCount}/${CL_TOTAL}` : 'Checklist'
                    )}
                  </button>
                  {(() => {
                    const incExpanded = expandedIncidentsSejourId === sj.id
                    const counts = incidentCounts[sj.id]
                    const hasOpen = (counts?.open ?? 0) > 0
                    const total = counts?.total ?? 0
                    return (
                      <button
                        onClick={() => setExpandedIncidentsSejourId(incExpanded ? null : sj.id)}
                        style={{
                          ...s.checklistBtn,
                          ...(incExpanded ? s.checklistBtnActive : {}),
                          ...(hasOpen ? { color: '#F87171', borderColor: 'rgba(248,113,113,0.4)' } : {}),
                        }}
                        title="Incidents du séjour"
                      >
                        <Bandaids size={13} />
                        {total > 0 ? `Incidents · ${total}` : 'Incidents'}
                      </button>
                    )
                  })()}
                </div>
              </div>

              {/* ── Checklist panel ────────────────────────────── */}
              {isExpanded && (
                <div style={s.clPanel}>
                  {cl === undefined && (
                    <p style={s.clEmpty}>Chargement…</p>
                  )}
                  {cl === null && (
                    <p style={s.clEmpty}>Aucun contrat associé à ce séjour — crée d&apos;abord un contrat pour accéder à la checklist.</p>
                  )}
                  {cl && (() => {
                    const barColor = pct === 100 ? '#10b981' : pct >= 50 ? '#eab308' : '#f97316'
                    return (
                      <>
                        {/* Progress bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                          <div style={{ flex: 1, height: '5px', background: 'var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '10px', transition: 'width 0.3s' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: barColor, whiteSpace: 'nowrap' }}>
                            {doneCount}/{CL_TOTAL} complétés
                          </span>
                        </div>

                        {/* Phases */}
                        {CHECKLIST_PHASES.map(phase => {
                          const phaseDone = phase.items.filter(it => cl.items[it.key]).length
                          return (
                            <div key={phase.label} style={{ marginBottom: '14px' }}>
                              <div style={s.clPhaseLabel}>
                                {phase.label}
                                <span style={{ ...s.clPhaseBadge, color: phaseDone === phase.items.length ? '#10b981' : 'var(--text-muted)' }}>
                                  {phaseDone}/{phase.items.length}
                                </span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {phase.items.map(it => {
                                  const checked = !!cl.items[it.key]
                                  return (
                                    <button
                                      key={it.key}
                                      onClick={() => handleChecklistToggle(sj.id, cl.contractId, it.key, !checked)}
                                      style={{ ...s.clItem, ...(checked ? s.clItemDone : {}) }}
                                    >
                                      {checked
                                        ? <CheckSquare size={15} color="#10b981" weight="fill" style={{ flexShrink: 0 }} />
                                        : <Square size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />}
                                      <span style={{ textDecoration: checked ? 'line-through' : 'none', color: checked ? 'var(--text-muted)' : 'var(--text-2)' }}>
                                        {it.label}
                                      </span>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </>
                    )
                  })()}
                </div>
              )}

              {/* ── Incidents panel ────────────────────────────── */}
              <IncidentsPanel
                sejourId={sj.id}
                voyageurId={voyageur.id}
                open={expandedIncidentsSejourId === sj.id}
                onCountChange={(open, total) => {
                  setIncidentCounts(prev => ({ ...prev, [sj.id]: { open, total } }))
                }}
              />
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Timeline ── */}
      {timeline.length > 0 && (
        <div style={s.section} className="fade-up">
          <div style={s.sectionHeader}>
            <div style={s.sectionTitle}>
              ⏱️ Historique chronologique
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0' }}>
            {timeline.map((ev, i) => {
              const opacity = ev.tone === 'past' ? 0.7 : 1
              const accent = ev.tone === 'today' ? 'var(--accent-text)' : ev.tone === 'future' ? '#10b981' : 'var(--text-muted)'
              return (
                <div key={i} style={{ display: 'flex', gap: '12px', opacity, padding: '8px 0', borderBottom: i < timeline.length - 1 ? '1px dashed var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px', flexShrink: 0, position: 'relative' as const }}>
                    <span style={{ fontSize: '18px', lineHeight: 1 }}>{ev.icon}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: accent, letterSpacing: '0.3px', textTransform: 'uppercase' as const, marginBottom: '2px' }}>
                      {formatDate(ev.date)}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{ev.label}</div>
                    {ev.subtitle && (
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '1px' }}>{ev.subtitle}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

        </div>
      </div>

      {/* Report / Testimony modal */}
      {reportModal && (
        <div style={s.overlay} onClick={() => setReportModal(null)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              {reportModal === 'report' ? (
                <>
                  <h3 style={{ ...s.modalTitle, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldWarning size={20} weight="fill" color="#ef4444" />
                    Signaler un incident
                  </h3>
                </>
              ) : (
                <h3 style={{ ...s.modalTitle, color: '#34D399', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Star size={20} weight="fill" color="#34D399" />
                  Témoignage positif
                </h3>
              )}
              <button onClick={() => setReportModal(null)} style={s.modalClose}><X size={18} /></button>
            </div>
            {reportSuccess ? (
              <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>{reportModal === 'positive' ? '⭐' : '✅'}</div>
                <p style={{ fontSize: '15px', color: 'var(--text-2)', margin: 0 }}>
                  {reportModal === 'positive'
                    ? 'Témoignage envoyé. Merci pour votre retour !'
                    : 'Signalement envoyé. Il sera examiné par la modération.'}
                </p>
                <button onClick={() => setReportModal(null)} className="btn-primary" style={{ marginTop: '20px' }}>
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} style={s.form}>
                <div style={s.field}>
                  <label style={s.label}>Voyageur concerné</label>
                  <div style={{ ...s.inputWrap, opacity: 0.7, pointerEvents: 'none' as const }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-2)' }}>
                      {voyageur.prenom} {voyageur.nom}
                      {voyageur.email && ` · ${voyageur.email}`}
                      {voyageur.telephone && ` · ${voyageur.telephone}`}
                    </span>
                  </div>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Type</label>
                  <select
                    value={reportModal === 'positive' ? positiveForm.incident_type : reportForm.incident_type}
                    onChange={e => reportModal === 'positive'
                      ? setPositiveForm(f => ({ ...f, incident_type: e.target.value }))
                      : setReportForm(f => ({ ...f, incident_type: e.target.value }))
                    }
                    style={{ ...s.inputWrap, cursor: 'pointer' }}
                  >
                    {(reportModal === 'positive' ? POSITIVE_TYPES : INCIDENT_TYPES).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Description <span style={{ color: 'var(--text-muted)' }}>(min. 20 caractères)</span></label>
                  <textarea
                    value={reportModal === 'positive' ? positiveForm.description : reportForm.description}
                    onChange={e => reportModal === 'positive'
                      ? setPositiveForm(f => ({ ...f, description: e.target.value }))
                      : setReportForm(f => ({ ...f, description: e.target.value }))
                    }
                    rows={4}
                    style={s.notesTextarea}
                    placeholder={reportModal === 'positive'
                      ? 'Décrivez votre expérience positive avec ce voyageur…'
                      : "Décrivez l'incident de manière précise et factuelle…"
                    }
                  />
                </div>
                {reportError && <p style={s.error}>{reportError}</p>}
                <div style={s.formActions}>
                  <button type="button" onClick={() => setReportModal(null)} className="btn-ghost">Annuler</button>
                  <button
                    type="submit"
                    disabled={isReporting}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '9px 18px', borderRadius: '10px', border: 'none',
                      cursor: isReporting ? 'not-allowed' : 'pointer',
                      fontSize: '13px', fontWeight: 500,
                      background: reportModal === 'positive' ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.12)',
                      color: reportModal === 'positive' ? '#34D399' : '#ef4444',
                    }}
                  >
                    {reportModal === 'positive' ? <Star size={14} /> : <ShieldWarning size={14} />}
                    {isReporting ? 'Envoi…' : reportModal === 'positive' ? 'Envoyer le témoignage' : 'Envoyer le signalement'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Contract modal */}
      {contractSejour && (
        <ContractModal
          sejour={contractSejour}
          voyageur={voyageur}
          bailleur={bailleur}
          logements={logements}
          onClose={() => { setContractSejour(null); router.refresh() }}
          onSuccess={() => router.refresh()}
        />
      )}

      {/* Deposit modal */}
      {depositContract && (
        <DepositModal
          contract={depositContract}
          hostIban={bailleur.iban}
          hostBic={bailleur.bic}
          onClose={() => setDepositContract(null)}
        />
      )}

      {/* Séjour modal */}
      {sejourModal && (
        <div style={s.overlay} onClick={() => setSejourModal(null)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>{sejourModal === 'edit' ? 'Modifier le séjour' : 'Nouveau séjour'}</h3>
              <button onClick={() => setSejourModal(null)} style={s.modalClose}><X size={18} /></button>
            </div>
            <form onSubmit={handleSejourSubmit} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Logement</label>
                {logements.length > 0 && !manualLogement ? (
                  /* Sélecteur carte style */
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
                    {logements.map(l => {
                      const isSel = sejourForm.logement === l.nom
                      return (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => setSejourForm(f => ({ ...f, logement: isSel ? '' : l.nom }))}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '9px 12px', borderRadius: '10px', cursor: 'pointer',
                            textAlign: 'left' as const, fontFamily: 'inherit',
                            background: isSel ? 'rgba(52,211,153,0.1)' : 'var(--surface)',
                            border: `1px solid ${isSel ? 'rgba(52,211,153,0.35)' : 'var(--border)'}`,
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{
                            width: '28px', height: '28px', flexShrink: 0, borderRadius: '7px',
                            background: isSel ? 'rgba(52,211,153,0.15)' : 'var(--surface-2)',
                            border: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {isSel
                              ? <Check size={13} color="#34D399" weight="bold" />
                              : <House size={13} color="var(--text-muted)" />
                            }
                          </div>
                          <span style={{ flex: 1, fontSize: '13px', fontWeight: isSel ? 600 : 400, color: isSel ? '#34D399' : 'var(--text)' }}>
                            {l.nom}
                          </span>
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      onClick={() => { setManualLogement(true); setSejourForm(f => ({ ...f, logement: '' })) }}
                      style={{ fontSize: '12px', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const, padding: '4px 0 0' }}
                    >
                      + Saisir manuellement
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
                    <div style={s.inputWrap}>
                      <House size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                      <input
                        style={s.input}
                        value={sejourForm.logement ?? ''}
                        onChange={e => setSejourForm(f => ({ ...f, logement: e.target.value }))}
                        placeholder="Studio Paris 11e"
                      />
                    </div>
                    {logements.length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setManualLogement(false); setSejourForm(f => ({ ...f, logement: '' })) }}
                        style={{ fontSize: '12px', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const, padding: '0' }}
                      >
                        ← Choisir parmi mes logements
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div style={s.formRow}>
                <div style={s.field}>
                  <label style={s.label}>Arrivée *</label>
                  <CalendarInput value={sejourForm.date_arrivee} onChange={v => setSejourForm(f => ({ ...f, date_arrivee: v }))} />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Départ *</label>
                  <CalendarInput value={sejourForm.date_depart} onChange={v => setSejourForm(f => ({ ...f, date_depart: v }))} />
                </div>
              </div>
              <div style={s.field}>
                <label style={s.label}>Montant total (€)</label>
                <div style={s.inputWrap}>
                  <CurrencyEur size={15} color="var(--text-muted)" />
                  <input style={s.input} type="number" min="0" step="0.01" value={sejourForm.montant ?? ''} onChange={e => setSejourForm(f => ({ ...f, montant: e.target.value ? Number(e.target.value) : null }))} placeholder="450" />
                </div>
              </div>
              <div style={s.field}>
                <label style={s.label}>Statut contrat</label>
                <select
                  value={sejourForm.contrat_statut}
                  onChange={e => setSejourForm(f => ({ ...f, contrat_statut: e.target.value as SejourData['contrat_statut'] }))}
                  style={{ ...s.inputWrap, cursor: 'pointer' }}
                >
                  <option value="nouveau">Nouveau</option>
                  <option value="en_attente">En attente</option>
                  <option value="signe">Signé</option>
                </select>
              </div>
              {sejourForm.contrat_statut === 'signe' && (
                <div style={s.formRow}>
                  <div style={s.field}>
                    <label style={s.label}>Date de signature</label>
                    <CalendarInput value={sejourForm.contrat_date_signature ?? ''} onChange={v => setSejourForm(f => ({ ...f, contrat_date_signature: v || null }))} />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Lien contrat</label>
                    <div style={s.inputWrap}>
                      <LinkIcon size={15} color="var(--text-muted)" />
                      <input style={s.input} type="url" value={sejourForm.contrat_lien ?? ''} onChange={e => setSejourForm(f => ({ ...f, contrat_lien: e.target.value || null }))} placeholder="https://…" />
                    </div>
                  </div>
                </div>
              )}
              {sejourError && <p style={s.error}>{sejourError}</p>}
              <div style={s.formActions}>
                <button type="button" onClick={() => setSejourModal(null)} className="btn-ghost">Annuler</button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? 'Enregistrement…' : sejourModal === 'edit' ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', maxWidth: '1600px', margin: '0 auto' },
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(320px, 420px) 1fr',
    gap: '20px',
    alignItems: 'flex-start',
  },
  leftColumn: {
    display: 'flex', flexDirection: 'column' as const, gap: '16px',
    position: 'sticky' as const, top: '20px',
  },
  rightColumn: {
    display: 'flex', flexDirection: 'column' as const, gap: '16px',
    minWidth: 0,
  },

  // Stats voyageur
  voyageurStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    marginTop: '16px',
    width: '100%',
  },
  voyageurStat: {
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '10px 12px',
    display: 'flex', flexDirection: 'column' as const, gap: '2px',
  },
  voyageurStatLabel: {
    fontSize: '10px', fontWeight: 600, letterSpacing: '0.4px',
    textTransform: 'uppercase' as const, color: 'var(--text-muted)',
  },
  voyageurStatValue: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '17px', fontWeight: 500, color: 'var(--text)',
    lineHeight: 1.2,
  },
  statutBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.4px',
    textTransform: 'uppercase' as const,
    padding: '4px 10px', borderRadius: '100px', border: '1px solid',
  },
  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '13px', color: 'var(--text-3)', marginBottom: '20px',
    padding: '6px 0', transition: 'color 0.15s',
  },
  flagBanner: {
    display: 'flex', alignItems: 'flex-start', gap: '12px',
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: '12px', padding: '14px 18px',
    fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6,
    marginBottom: '20px',
  },
  profileCard: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '14px',
    padding: '22px 20px', borderRadius: '18px',
    textAlign: 'center' as const,
  },
  bigAvatar: {
    width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  bigAvatarText: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '28px', fontWeight: 600, color: '#fff',
  },
  profileInfo: { width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '8px' },
  profileNameRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const, justifyContent: 'center' },
  profileName: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '22px',
    fontWeight: 400, color: 'var(--text)', margin: 0,
  },
  profileEditForm: { display: 'flex', flexDirection: 'column' as const, gap: '12px', width: '100%' },
  profileEditRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' as const },
  contactList: { display: 'flex', flexWrap: 'wrap' as const, gap: '10px', justifyContent: 'center' },
  contactItem: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', color: 'var(--text-2)', textDecoration: 'none',
  },
  addFieldBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'none', border: '1px dashed var(--border)',
    borderRadius: '8px', padding: '4px 10px',
    fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer',
    transition: 'all 0.15s',
  },
  since: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' },

  section: {
    background: 'var(--surface)', border: '1px solid var(--surface-2)',
    borderRadius: '16px', padding: '20px', marginBottom: '16px',
  },
  sectionHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '14px',
  },
  sectionTitle: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '13px', fontWeight: 500, color: 'var(--text-2)',
  },
  editBtn: {
    display: 'flex', alignItems: 'center', gap: '5px',
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '12px', color: 'var(--text-muted)',
  },
  reportBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: '8px', padding: '4px 10px',
    fontSize: '12px', color: '#ef4444', cursor: 'pointer',
    transition: 'all 0.15s',
  },
  testimonyBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
    borderRadius: '8px', padding: '4px 10px',
    fontSize: '12px', color: '#34D399', cursor: 'pointer',
    transition: 'all 0.15s',
  },
  notesText: { fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.7, margin: 0 },
  notesTextarea: {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '10px 12px',
    fontSize: '14px', color: 'var(--text)',
    fontFamily: 'inherit', resize: 'vertical',
  },

  sejourList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  sejourRow: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '14px 16px',
  },
  sejourLeft: { flex: 1, minWidth: 0 },
  sejourDates: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px',
  },
  nightsBadge: {
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: '100px', padding: '2px 8px',
    fontSize: '11px', fontWeight: 500, color: 'var(--text-3)',
  },
  sejourMeta: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  metaChip: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: '100px', padding: '3px 9px',
    fontSize: '12px', color: 'var(--text-3)',
  },
  sejourActionBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', padding: '5px', borderRadius: '7px',
    transition: 'all 0.15s',
  },
  contractBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    borderRadius: '8px', padding: '5px 11px',
    fontSize: '12px', fontWeight: 500, color: 'var(--accent-text)',
    cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
  },
  depositBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    background: 'rgba(99,91,255,0.1)', border: '1px solid rgba(99,91,255,0.25)',
    borderRadius: '8px', padding: '5px 11px',
    fontSize: '12px', fontWeight: 500, color: '#a29bfe',
    cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
  },
  checklistBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
    borderRadius: '8px', padding: '5px 11px',
    fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)',
    cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
  },
  checklistBtnActive: {
    background: 'rgba(16,185,129,0.18)', borderColor: 'rgba(16,185,129,0.45)', color: '#10b981',
  },
  clPanel: {
    margin: '0 0 8px 0', padding: '18px 20px',
    background: 'rgba(0,76,63,0.06)', border: '1px solid rgba(16,185,129,0.12)',
    borderTop: 'none', borderRadius: '0 0 12px 12px',
  },
  clEmpty: { fontSize: '13px', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' },
  clPhaseLabel: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' as const,
    color: 'var(--text-3)', marginBottom: '6px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  clPhaseBadge: { fontSize: '10px', fontWeight: 600 },
  clItem: {
    display: 'flex', alignItems: 'center', gap: '9px', width: '100%',
    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const,
    padding: '5px 6px', borderRadius: '7px', transition: 'background 0.12s',
    fontSize: '13px',
  },
  clItemDone: { background: 'rgba(16,185,129,0.06)' },

  /* Modal */
  overlay: {
    position: 'fixed', inset: 0, zIndex: 300,
    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
  },
  modalBox: {
    background: 'var(--bg-2)', border: '1px solid var(--border-2)',
    borderRadius: '20px', width: '100%', maxWidth: '560px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
    animation: 'fadeIn 0.18s ease', maxHeight: '90vh', overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px 16px', borderBottom: '1px solid var(--border)',
  },
  modalTitle: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '18px',
    fontWeight: 400, color: 'var(--text)',
  },
  modalClose: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '4px' },
  form: { padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  formRow: { display: 'flex', gap: '14px' },
  field: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: 500, color: 'var(--text-2)' },
  inputWrap: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '10px 12px',
    fontSize: '14px', color: 'var(--text)',
  },
  input: { flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '14px', color: 'var(--text)' },
  error: { fontSize: '13px', color: '#ef4444', margin: 0 },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' },
}
