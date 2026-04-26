'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, MagnifyingGlass, Warning, CaretRight,
  X, User, Envelope, Phone, Note,
} from '@phosphor-icons/react'
import { addVoyageur, updateVoyageur, deleteVoyageur, type VoyageurData } from './actions'

type Sejour = { id: string; date_arrivee: string; date_depart: string }
type Voyageur = {
  id: string; prenom: string; nom: string
  email: string | null; telephone: string | null; notes: string | null
  created_at: string; updated_at: string
  sejours: Sejour[]; is_flagged: boolean
}

function avatarColor(name: string) {
  const palette = ['#2D9A7B', '#4F7DB8', '#9B5E8C', '#D4875A', '#6B8E6B', '#8B6D5E']
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return palette[Math.abs(h) % palette.length]
}

function lastStay(sejours: Sejour[]): string | null {
  if (!sejours.length) return null
  const sorted = [...sejours].sort((a, b) => b.date_arrivee.localeCompare(a.date_arrivee))
  const d = new Date(sorted[0].date_arrivee)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const EMPTY_FORM: VoyageurData = { prenom: '', nom: '', email: '', telephone: '', notes: '' }

interface Props {
  voyageurs: Voyageur[]
  tableReady: boolean
}

export default function VoyageursView({ voyageurs, tableReady }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editTarget, setEditTarget] = useState<Voyageur | null>(null)
  const [form, setForm] = useState<VoyageurData>(EMPTY_FORM)
  const [formError, setFormError] = useState('')

  const filtered = voyageurs.filter(v => {
    const q = search.toLowerCase()
    return (
      v.prenom.toLowerCase().includes(q) ||
      v.nom.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q) ||
      v.telephone?.includes(q)
    )
  })

  function openAdd() {
    setForm(EMPTY_FORM)
    setFormError('')
    setEditTarget(null)
    setModal('add')
  }

  function openEdit(v: Voyageur, e: React.MouseEvent) {
    e.stopPropagation()
    setForm({ prenom: v.prenom, nom: v.nom, email: v.email ?? '', telephone: v.telephone ?? '', notes: v.notes ?? '' })
    setFormError('')
    setEditTarget(v)
    setModal('edit')
  }

  function closeModal() { setModal(null); setEditTarget(null) }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.prenom.trim() || !form.nom.trim()) {
      setFormError('Prénom et nom sont obligatoires.')
      return
    }
    setFormError('')
    startTransition(async () => {
      const data: VoyageurData = {
        prenom: form.prenom.trim(),
        nom: form.nom.trim(),
        email: form.email?.trim() || undefined,
        telephone: form.telephone?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      }
      const res = modal === 'edit' && editTarget
        ? await updateVoyageur(editTarget.id, data)
        : await addVoyageur(data)

      if (res.error) { setFormError(res.error); return }
      closeModal()
      router.refresh()
    })
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Supprimer ce voyageur et tous ses séjours ?')) return
    startTransition(async () => {
      await deleteVoyageur(id)
      router.refresh()
    })
  }

  return (
    <div style={s.page}>
      {/* Header toolbar */}
      <div style={s.toolbar} className="fade-up">
        <div>
          <h2 style={s.pageTitle}>
            Mes <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>Voyageurs</em>
          </h2>
          <p style={s.pageDesc}>
            {voyageurs.length === 0
              ? 'Aucun voyageur enregistré'
              : `${voyageurs.length} voyageur${voyageurs.length > 1 ? 's' : ''}`}
          </p>
        </div>
        {tableReady && (
          <button onClick={openAdd} className="btn-primary" style={s.addBtn}>
            <Plus size={16} weight="bold" />
            Ajouter
          </button>
        )}
      </div>

      {/* Table not ready */}
      {!tableReady && (
        <div style={s.setupBanner} className="fade-up">
          <Warning size={18} color="#FFD56B" />
          <span>La table <code>voyageurs</code> n&apos;existe pas encore. Lance la migration <code>supabase-voyageurs-migration.sql</code> dans Supabase.</span>
        </div>
      )}

      {tableReady && (
        <>
          {/* Search */}
          {voyageurs.length > 0 && (
            <div style={s.searchWrap} className="fade-up">
              <MagnifyingGlass size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Rechercher par nom, email ou téléphone…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={s.searchInput}
              />
              {search && (
                <button onClick={() => setSearch('')} style={s.clearBtn}>
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {/* Empty state */}
          {voyageurs.length === 0 && (
            <div style={s.emptyState} className="fade-up glass-card">
              <User size={40} color="var(--text-muted)" />
              <p style={s.emptyTitle}>Aucun voyageur pour l&apos;instant</p>
              <p style={s.emptyDesc}>Ajoutez vos premiers voyageurs pour suivre leurs coordonnées et leurs séjours.</p>
              <button onClick={openAdd} className="btn-primary">
                <Plus size={15} weight="bold" />
                Ajouter un voyageur
              </button>
            </div>
          )}

          {/* No search results */}
          {voyageurs.length > 0 && filtered.length === 0 && (
            <div style={s.emptyState} className="fade-up">
              <p style={s.emptyTitle}>Aucun résultat pour &laquo; {search} &raquo;</p>
            </div>
          )}

          {/* List */}
          {filtered.length > 0 && (
            <div style={s.list} className="fade-up">
              {filtered.map(v => {
                const initials = `${v.prenom[0]}${v.nom[0]}`.toUpperCase()
                const color = avatarColor(v.prenom + v.nom)
                const last = lastStay(v.sejours)
                return (
                  <div
                    key={v.id}
                    onClick={() => router.push(`/dashboard/voyageurs/${v.id}`)}
                    style={s.row}
                    className="dash-help-row"
                  >
                    {/* Avatar */}
                    <div style={{ ...s.avatar, background: color }}>
                      <span style={s.avatarText}>{initials}</span>
                    </div>

                    {/* Info */}
                    <div style={s.info}>
                      <div style={s.rowName}>
                        {v.prenom} {v.nom}
                        {v.is_flagged && (
                          <span style={s.flagBadge}>
                            <Warning size={11} weight="fill" />
                            Signalé
                          </span>
                        )}
                      </div>
                      <div style={s.rowMeta}>
                        {v.email && <span>{v.email}</span>}
                        {v.email && v.telephone && <span style={s.dot}>·</span>}
                        {v.telephone && <span>{v.telephone}</span>}
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={s.stats}>
                      <div style={s.statVal}>{v.sejours.length}</div>
                      <div style={s.statLabel}>séjour{v.sejours.length !== 1 ? 's' : ''}</div>
                    </div>
                    {last && (
                      <div style={{ ...s.stats, display: 'none' }} className="dash-stat-date">
                        <div style={s.statVal}>{last}</div>
                        <div style={s.statLabel}>dernier séjour</div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={s.rowActions} onClick={e => e.stopPropagation()}>
                      <button onClick={e => openEdit(v, e)} style={s.actionBtn} title="Modifier">
                        <Note size={15} />
                      </button>
                      <button onClick={e => handleDelete(v.id, e)} style={{ ...s.actionBtn, color: '#ef4444' }} title="Supprimer">
                        <X size={15} />
                      </button>
                    </div>

                    <CaretRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Modal Add / Edit */}
      {modal && (
        <div style={s.overlay} onClick={closeModal}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>{modal === 'edit' ? 'Modifier le voyageur' : 'Nouveau voyageur'}</h3>
              <button onClick={closeModal} style={s.modalClose}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.formRow}>
                <div style={s.field}>
                  <label style={s.label}>Prénom *</label>
                  <div style={s.inputWrap}>
                    <User size={15} color="var(--text-muted)" />
                    <input
                      style={s.input}
                      value={form.prenom}
                      onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                      placeholder="Jean"
                      autoFocus
                    />
                  </div>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Nom *</label>
                  <div style={s.inputWrap}>
                    <User size={15} color="var(--text-muted)" />
                    <input
                      style={s.input}
                      value={form.nom}
                      onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                      placeholder="Dupont"
                    />
                  </div>
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Email</label>
                <div style={s.inputWrap}>
                  <Envelope size={15} color="var(--text-muted)" />
                  <input
                    style={s.input}
                    type="email"
                    value={form.email ?? ''}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="jean.dupont@email.com"
                  />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Téléphone</label>
                <div style={s.inputWrap}>
                  <Phone size={15} color="var(--text-muted)" />
                  <input
                    style={s.input}
                    type="tel"
                    value={form.telephone ?? ''}
                    onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Notes privées</label>
                <textarea
                  style={{ ...s.input, ...s.textarea }}
                  value={form.notes ?? ''}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Préférences, informations utiles…"
                  rows={3}
                />
              </div>

              {formError && <p style={s.error}>{formError}</p>}

              <div style={s.formActions}>
                <button type="button" onClick={closeModal} className="btn-ghost">Annuler</button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? 'Enregistrement…' : modal === 'edit' ? 'Enregistrer' : 'Ajouter'}
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
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  toolbar: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: '16px', flexWrap: 'wrap', marginBottom: '28px',
  },
  pageTitle: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400, color: 'var(--text)', marginBottom: '4px',
  },
  pageDesc: { fontSize: '14px', fontWeight: 300, color: 'var(--text-3)' },
  addBtn: { flexShrink: 0, marginTop: '6px' },

  setupBanner: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'rgba(255,213,107,0.08)', border: '1px solid rgba(255,213,107,0.2)',
    borderRadius: '12px', padding: '14px 18px',
    fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6,
  },

  searchWrap: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '10px 14px',
    marginBottom: '16px',
  },
  searchInput: {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    fontSize: '14px', color: 'var(--text)',
  },
  clearBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', padding: '2px',
  },

  emptyState: {
    padding: '56px 32px', borderRadius: '18px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '12px', textAlign: 'center',
  },
  emptyTitle: { fontSize: '16px', fontWeight: 500, color: 'var(--text-2)' },
  emptyDesc: {
    fontSize: '14px', fontWeight: 300, color: 'var(--text-3)',
    maxWidth: '380px', lineHeight: 1.65,
  },

  list: {
    background: 'var(--surface)', border: '1px solid var(--surface-2)',
    borderRadius: '16px', overflow: 'hidden',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '14px 18px', borderBottom: '1px solid var(--border)',
    cursor: 'pointer', transition: 'background 0.15s',
  },
  avatar: {
    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '14px',
    fontWeight: 600, color: '#fff',
  },
  info: { flex: 1, minWidth: 0 },
  rowName: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '14px', fontWeight: 500, color: 'var(--text)',
    marginBottom: '3px',
  },
  flagBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    background: 'rgba(239,68,68,0.12)', color: '#ef4444',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: '100px', padding: '2px 7px',
    fontSize: '11px', fontWeight: 600,
  },
  rowMeta: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', color: 'var(--text-3)', flexWrap: 'wrap',
  },
  dot: { opacity: 0.4 },
  stats: { textAlign: 'center', flexShrink: 0 },
  statVal: { fontSize: '15px', fontWeight: 600, color: 'var(--text)' },
  statLabel: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' },
  rowActions: { display: 'flex', gap: '4px' },
  actionBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', padding: '6px', borderRadius: '7px',
    transition: 'all 0.15s',
  },

  /* Modal */
  overlay: {
    position: 'fixed', inset: 0, zIndex: 300,
    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px',
  },
  modalBox: {
    background: 'var(--bg-2)', border: '1px solid var(--border-2)',
    borderRadius: '20px', width: '100%', maxWidth: '520px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
    animation: 'fadeIn 0.18s ease',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px 16px',
    borderBottom: '1px solid var(--border)',
  },
  modalTitle: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '18px',
    fontWeight: 400, color: 'var(--text)',
  },
  modalClose: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-3)', padding: '4px',
  },
  form: { padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  formRow: { display: 'flex', gap: '14px', flexWrap: 'wrap' },
  field: { flex: 1, minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: 500, color: 'var(--text-2)' },
  inputWrap: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '10px 12px',
  },
  input: {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    fontSize: '14px', color: 'var(--text)',
  },
  textarea: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '10px 12px',
    resize: 'vertical', fontFamily: 'inherit',
    flex: 'unset', width: '100%', boxSizing: 'border-box',
  },
  error: { fontSize: '13px', color: '#ef4444', margin: 0 },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' },
}
