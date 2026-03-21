'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Warning, Plus, X, Pencil, Check,
  Envelope, Phone, Note, CalendarBlank, House,
  CurrencyEur, Seal, Link as LinkIcon,
} from '@phosphor-icons/react'
import { updateVoyageur, addSejour, updateSejour, deleteSejour, type VoyageurData, type SejourData } from '../actions'

type Voyageur = {
  id: string; prenom: string; nom: string
  email: string | null; telephone: string | null
  notes: string | null; created_at: string
}

type Sejour = {
  id: string; voyageur_id: string; logement: string | null
  date_arrivee: string; date_depart: string
  montant: number | null
  contrat_statut: 'signe' | 'en_attente' | 'non_requis'
  contrat_date_signature: string | null; contrat_lien: string | null
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
}

const EMPTY_SEJOUR: Omit<SejourData, 'voyageur_id'> = {
  logement: '', date_arrivee: '', date_depart: '',
  montant: null, contrat_statut: 'non_requis',
  contrat_date_signature: null, contrat_lien: null,
}

interface Props {
  voyageur: Voyageur
  sejours: Sejour[]
  isFlagged: boolean
}

export default function VoyageurDetail({ voyageur, sejours, isFlagged }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Notes inline edit
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState(voyageur.notes ?? '')

  // Séjour modal
  const [sejourModal, setSejourModal] = useState<'add' | 'edit' | null>(null)
  const [editSejour, setEditSejour] = useState<Sejour | null>(null)
  const [sejourForm, setSejourForm] = useState<Omit<SejourData, 'voyageur_id'>>(EMPTY_SEJOUR)
  const [sejourError, setSejourError] = useState('')

  const initials = `${voyageur.prenom[0]}${voyageur.nom[0]}`.toUpperCase()
  const color = avatarColor(voyageur.prenom + voyageur.nom)

  function saveNotes() {
    startTransition(async () => {
      const data: VoyageurData = {
        prenom: voyageur.prenom, nom: voyageur.nom,
        email: voyageur.email ?? undefined,
        telephone: voyageur.telephone ?? undefined,
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
    setSejourModal('add')
  }

  function openEditSejour(s: Sejour) {
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

  return (
    <div style={s.page}>
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
          <h2 style={s.profileName}>{voyageur.prenom} {voyageur.nom}</h2>
          <div style={s.contactList}>
            {voyageur.email && (
              <a href={`mailto:${voyageur.email}`} style={s.contactItem}>
                <Envelope size={14} color="var(--text-muted)" />
                {voyageur.email}
              </a>
            )}
            {voyageur.telephone && (
              <a href={`tel:${voyageur.telephone}`} style={s.contactItem}>
                <Phone size={14} color="var(--text-muted)" />
                {voyageur.telephone}
              </a>
            )}
          </div>
          <div style={s.since}>Ajouté le {formatDate(voyageur.created_at)}</div>
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
              <div key={sj.id} style={s.sejourRow}>
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
                    {sj.contrat_lien && (
                      <a href={sj.contrat_lien} target="_blank" rel="noopener noreferrer" style={{ ...s.metaChip, ...s.linkChip }}>
                        <LinkIcon size={12} />
                        Contrat
                      </a>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
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
                <div style={s.inputWrap}>
                  <House size={15} color="var(--text-muted)" />
                  <input style={s.input} value={sejourForm.logement ?? ''} onChange={e => setSejourForm(f => ({ ...f, logement: e.target.value }))} placeholder="Studio Paris 11e" />
                </div>
              </div>
              <div style={s.formRow}>
                <div style={s.field}>
                  <label style={s.label}>Arrivée *</label>
                  <div style={s.inputWrap}>
                    <CalendarBlank size={15} color="var(--text-muted)" />
                    <input style={s.input} type="date" value={sejourForm.date_arrivee} onChange={e => setSejourForm(f => ({ ...f, date_arrivee: e.target.value }))} />
                  </div>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Départ *</label>
                  <div style={s.inputWrap}>
                    <CalendarBlank size={15} color="var(--text-muted)" />
                    <input style={s.input} type="date" value={sejourForm.date_depart} onChange={e => setSejourForm(f => ({ ...f, date_depart: e.target.value }))} />
                  </div>
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
                  <option value="signe">Signé</option>
                  <option value="en_attente">En attente</option>
                  <option value="non_requis">Non requis</option>
                </select>
              </div>
              {sejourForm.contrat_statut === 'signe' && (
                <div style={s.formRow}>
                  <div style={s.field}>
                    <label style={s.label}>Date de signature</label>
                    <div style={s.inputWrap}>
                      <CalendarBlank size={15} color="var(--text-muted)" />
                      <input style={s.input} type="date" value={sejourForm.contrat_date_signature ?? ''} onChange={e => setSejourForm(f => ({ ...f, contrat_date_signature: e.target.value || null }))} />
                    </div>
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
  profileName: {
    fontFamily: 'Fraunces, serif', fontSize: 'clamp(20px,2.5vw,28px)',
    fontWeight: 400, color: 'var(--text)', marginBottom: '8px',
  },
  contactList: { display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '6px' },
  contactItem: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', color: 'var(--text-2)', textDecoration: 'none',
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
  linkChip: { textDecoration: 'none', color: 'var(--accent-text)' },
  sejourActionBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', padding: '5px', borderRadius: '7px',
    transition: 'all 0.15s',
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
