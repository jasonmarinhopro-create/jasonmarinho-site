'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Warning, Plus, X, Pencil, Check,
  Envelope, Phone, Note, CalendarBlank, House,
  CurrencyEur, Seal, Link as LinkIcon, ShieldWarning, Star, FileText,
} from '@phosphor-icons/react'
import { updateVoyageur, addSejour, updateSejour, deleteSejour, type VoyageurData, type SejourData } from '../actions'
import { reportGuest } from '../../securite/actions'
import ContractModal from './ContractModal'
import DepositModal from './DepositModal'

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
  en_attente:  { label: 'En attente',  color: '#FFD56B', bg: 'rgba(255,213,107,0.12)' },
  non_requis:  { label: 'Non requis',  color: 'var(--text-muted)', bg: 'var(--surface-2)' },
  nouveau:     { label: 'Nouveau',     color: '#7EB8F7', bg: 'rgba(126,184,247,0.12)' },
}

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
                  background: isSel ? 'rgba(255,213,107,0.18)' : isToday2 ? 'rgba(52,211,153,0.1)' : 'transparent',
                  color: isSel ? '#FFD56B' : isToday2 ? '#34D399' : '#a5c4b0',
                  cursor: 'pointer',
                  outline: isSel ? '1.5px solid rgba(255,213,107,0.45)' : 'none',
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
  background: 'rgba(255,255,255,0.05)', border: '1px solid #1e3d2f',
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
}

interface Props {
  voyageur: Voyageur
  sejours: Sejour[]
  isFlagged: boolean
  bailleur: BailleurProfile
  logements?: LogementOption[]
}

export default function VoyageurDetail({ voyageur, sejours, isFlagged, bailleur, logements = [] }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Contract modal
  const [contractSejour, setContractSejour] = useState<Sejour | null>(null)

  // Deposit modal
  const [depositContract, setDepositContract] = useState<DepositContract | null>(null)
  const [depositLoading, setDepositLoading] = useState<string | null>(null) // sejourId en cours de chargement

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

  const initials = `${voyageur.prenom[0]}${voyageur.nom[0]}`.toUpperCase()
  const color = avatarColor(voyageur.prenom + voyageur.nom)

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
              <div style={s.since}>Ajouté le {formatDate(voyageur.created_at)}</div>
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
            return (
              <div key={sj.id} style={s.sejourRow} className="sejour-row-mobile">
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
                  <button
                    onClick={() => handleContractClick(sj)}
                    style={s.contractBtn}
                    disabled={contractLoading === sj.id}
                    title={sj.contrat_statut === 'nouveau' ? 'Créer un contrat' : 'Voir le contrat'}
                  >
                    <FileText size={13} weight="fill" />
                    {contractLoading === sj.id ? '…' : sj.contrat_statut === 'nouveau' ? 'Créer contrat' : 'Voir contrat'}
                  </button>
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
                </div>
              </div>
            )
          })}
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
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', maxWidth: '860px' },
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
    display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
    padding: '24px', borderRadius: '18px', marginBottom: '20px',
  },
  bigAvatar: {
    width: '64px', height: '64px', borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  bigAvatarText: {
    fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 600, color: '#fff',
  },
  profileInfo: { flex: 1, minWidth: 0 },
  profileNameRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' },
  profileName: {
    fontFamily: 'Fraunces, serif', fontSize: 'clamp(20px,2.5vw,28px)',
    fontWeight: 400, color: 'var(--text)', margin: 0,
  },
  profileEditForm: { display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' },
  profileEditRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  contactList: { display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '6px' },
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
    background: 'rgba(255,213,107,0.12)', border: '1px solid rgba(255,213,107,0.3)',
    borderRadius: '8px', padding: '5px 11px',
    fontSize: '12px', fontWeight: 500, color: '#FFD56B',
    cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
  },
  depositBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    background: 'rgba(99,91,255,0.1)', border: '1px solid rgba(99,91,255,0.25)',
    borderRadius: '8px', padding: '5px 11px',
    fontSize: '12px', fontWeight: 500, color: '#a29bfe',
    cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
  },

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
    fontFamily: 'Fraunces, serif', fontSize: '18px',
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
