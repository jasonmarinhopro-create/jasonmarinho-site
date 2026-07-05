'use client'

import { useState, useTransition } from 'react'
import {
  AddressBook, Plus, X, Phone, Envelope, MapPin, House,
  CaretDown, CaretUp, Trash, Check, NotePencil,
} from '@phosphor-icons/react/dist/ssr'

export interface ProClient {
  id: string
  nom: string
  email: string | null
  telephone: string | null
  ville: string | null
  logement: string | null
  statut: 'prospect' | 'client' | 'fidele' | string
  notes: string | null
  created_at: string
}

export interface ProClientInput {
  nom: string
  email?: string
  telephone?: string
  ville?: string
  logement?: string
  statut?: string
  notes?: string
}

const STATUT_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  prospect: { label: 'Prospect',       color: '#60a5fa', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.30)' },
  client:   { label: 'Client',         color: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.30)' },
  fidele:   { label: 'Client fidèle',  color: '#FFD56B', bg: 'rgba(255,213,107,0.10)', border: 'rgba(255,213,107,0.30)' },
}
const STATUT_ORDER = ['prospect', 'client', 'fidele'] as const

const EMPTY_FORM: ProClientInput = { nom: '', email: '', telephone: '', ville: '', logement: '', statut: 'prospect', notes: '' }

interface Props {
  clients: ProClient[]
  onCreate: (data: ProClientInput) => Promise<{ id?: string; error?: string }>
  onUpdate: (clientId: string, data: ProClientInput) => Promise<{ error?: string }>
  onDelete: (clientId: string) => Promise<{ error?: string }>
  /** "photographe" | "équipe" — pour les libellés */
  metier: string
}

export default function ClientsCrm({ clients: initial, onCreate, onUpdate, onDelete, metier }: Props) {
  const [clients, setClients] = useState(initial)
  const [openId, setOpenId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<ProClientInput>(EMPTY_FORM)
  const [editForm, setEditForm] = useState<ProClientInput>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [savedId, setSavedId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const counts = {
    prospect: clients.filter(c => c.statut === 'prospect').length,
    client: clients.filter(c => c.statut === 'client').length,
    fidele: clients.filter(c => c.statut === 'fidele').length,
  }

  function submitAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom?.trim()) { setFormError('Le nom est obligatoire.'); return }
    setFormError('')
    startTransition(async () => {
      const res = await onCreate({ ...form, nom: form.nom.trim() })
      if (res?.error) { setFormError(res.error); return }
      // Insertion optimiste en tete de liste avec l'id retourne
      setClients(cs => [{
        id: res.id ?? `tmp-${cs.length}`,
        nom: form.nom.trim(),
        email: form.email || null,
        telephone: form.telephone || null,
        ville: form.ville || null,
        logement: form.logement || null,
        statut: form.statut || 'prospect',
        notes: form.notes || null,
        created_at: new Date().toISOString(),
      }, ...cs])
      setForm(EMPTY_FORM)
      setShowAdd(false)
    })
  }

  function openEdit(c: ProClient) {
    setOpenId(openId === c.id ? null : c.id)
    setEditForm({
      nom: c.nom, email: c.email ?? '', telephone: c.telephone ?? '',
      ville: c.ville ?? '', logement: c.logement ?? '',
      statut: c.statut, notes: c.notes ?? '',
    })
  }

  function submitEdit(id: string) {
    if (!editForm.nom?.trim()) return
    startTransition(async () => {
      const res = await onUpdate(id, { ...editForm, nom: editForm.nom.trim() })
      if (!res?.error) {
        setClients(cs => cs.map(c => (c.id === id ? {
          ...c,
          nom: editForm.nom.trim(),
          email: editForm.email || null,
          telephone: editForm.telephone || null,
          ville: editForm.ville || null,
          logement: editForm.logement || null,
          statut: editForm.statut || c.statut,
          notes: editForm.notes || null,
        } : c)))
        setSavedId(id)
        setTimeout(() => setSavedId(s => (s === id ? null : s)), 2000)
      }
    })
  }

  function remove(id: string) {
    if (!confirm('Supprimer ce client de ton carnet ? (les demandes reçues ne sont pas touchées)')) return
    const prev = clients
    setClients(cs => cs.filter(c => c.id !== id))
    setOpenId(null)
    startTransition(async () => {
      const res = await onDelete(id)
      if (res?.error) setClients(prev)
    })
  }

  return (
    <section>
      {/* En-tete */}
      <div style={s.head} className="fade-up">
        <div>
          <h2 style={s.title}>
            Mes <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>clients</em>
          </h2>
          <p style={s.sub}>
            Ton carnet d&apos;hôtes : coordonnées complètes, logement concerné, statut et notes. Ajoute un client à la main ou convertis une demande reçue en un clic.
          </p>
        </div>
        <button onClick={() => { setShowAdd(v => !v); setFormError('') }} className="btn-primary" style={{ flexShrink: 0 }}>
          {showAdd ? <X size={15} weight="bold" /> : <Plus size={15} weight="bold" />}
          {showAdd ? 'Fermer' : 'Ajouter un client'}
        </button>
      </div>

      {/* Compteurs par statut */}
      {clients.length > 0 && (
        <div style={s.statsRow} className="fade-up">
          {STATUT_ORDER.map(st => {
            const m = STATUT_META[st]
            return (
              <div key={st} style={s.statCard}>
                <span style={{ ...s.statVal, color: m.color }}>{counts[st]}</span>
                <span style={s.statLbl}>{m.label}{counts[st] > 1 ? 's' : ''}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Formulaire d'ajout */}
      {showAdd && (
        <form onSubmit={submitAdd} style={s.addCard} className="fade-up">
          <div style={s.formGrid}>
            <div style={s.field}>
              <label style={s.label}>Nom / société *</label>
              <input className="input-field" style={s.input} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Marie Dupont" autoFocus />
            </div>
            <div style={s.field}>
              <label style={s.label}>Téléphone</label>
              <input className="input-field" style={s.input} type="tel" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder="+33 6 12 34 56 78" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Email</label>
              <input className="input-field" style={s.input} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="marie@email.com" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Ville</label>
              <input className="input-field" style={s.input} value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} placeholder="Lyon" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Logement concerné</label>
              <input className="input-field" style={s.input} value={form.logement} onChange={e => setForm(f => ({ ...f, logement: e.target.value }))} placeholder="T2 Croix-Rousse, Villa du Port…" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Statut</label>
              <div style={s.statutGroup}>
                {STATUT_ORDER.map(st => {
                  const m = STATUT_META[st]
                  const active = form.statut === st
                  return (
                    <button type="button" key={st} onClick={() => setForm(f => ({ ...f, statut: st }))}
                      style={{ ...s.statutBtn, ...(active ? { color: m.color, background: m.bg, borderColor: m.border, fontWeight: 700 } : {}) }}>
                      {m.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div style={s.field}>
            <label style={s.label}>Notes (préférences, historique, tarifs convenus…)</label>
            <textarea className="input-field" style={{ ...s.input, resize: 'vertical' as const }} rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={`Ex : shooting prévu en septembre, ${metier === 'équipe' ? 'turnover chaque samedi' : 'préfère la lumière du matin'}…`} />
          </div>
          {formError && <p style={s.error}>{formError}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? 'Enregistrement…' : 'Ajouter à mon carnet'}
            </button>
          </div>
        </form>
      )}

      {/* Liste */}
      {clients.length === 0 && !showAdd ? (
        <div style={s.empty} className="fade-up">
          <AddressBook size={30} color="var(--text-muted)" />
          <p style={s.emptyTitle}>Ton carnet est vide</p>
          <p style={s.emptyDesc}>
            Ajoute tes premiers clients à la main, ou ouvre une demande reçue et clique « Ajouter à mes clients » pour la convertir avec ses coordonnées.
          </p>
          <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ marginTop: 6 }}>
            <Plus size={15} weight="bold" />
            Ajouter mon premier client
          </button>
        </div>
      ) : (
        <div style={s.list} className="fade-up">
          {clients.map(c => {
            const m = STATUT_META[c.statut] ?? STATUT_META.prospect
            const open = openId === c.id
            return (
              <div key={c.id} style={s.row}>
                <button onClick={() => openEdit(c)} style={s.rowHead}>
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' as const }}>
                    <div style={s.rowName}>
                      {c.nom}
                      <span style={{ ...s.statutPill, color: m.color, background: m.bg, borderColor: m.border }}>{m.label}</span>
                    </div>
                    <div style={s.rowMeta}>
                      {c.telephone && <span style={s.metaItem}><Phone size={12} weight="bold" />{c.telephone}</span>}
                      {c.email && <span style={s.metaItem}><Envelope size={12} weight="bold" />{c.email}</span>}
                      {c.ville && <span style={s.metaItem}><MapPin size={12} weight="bold" />{c.ville}</span>}
                      {c.logement && <span style={s.metaItem}><House size={12} weight="bold" />{c.logement}</span>}
                    </div>
                  </div>
                  {open ? <CaretUp size={15} color="var(--text-muted)" /> : <CaretDown size={15} color="var(--text-muted)" />}
                </button>

                {open && (
                  <div style={s.rowBody}>
                    <div style={s.formGrid}>
                      <div style={s.field}>
                        <label style={s.label}>Nom / société *</label>
                        <input className="input-field" style={s.input} value={editForm.nom} onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))} />
                      </div>
                      <div style={s.field}>
                        <label style={s.label}>Téléphone</label>
                        <input className="input-field" style={s.input} type="tel" value={editForm.telephone} onChange={e => setEditForm(f => ({ ...f, telephone: e.target.value }))} placeholder="+33 6…" />
                      </div>
                      <div style={s.field}>
                        <label style={s.label}>Email</label>
                        <input className="input-field" style={s.input} type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                      </div>
                      <div style={s.field}>
                        <label style={s.label}>Ville</label>
                        <input className="input-field" style={s.input} value={editForm.ville} onChange={e => setEditForm(f => ({ ...f, ville: e.target.value }))} />
                      </div>
                      <div style={s.field}>
                        <label style={s.label}>Logement concerné</label>
                        <input className="input-field" style={s.input} value={editForm.logement} onChange={e => setEditForm(f => ({ ...f, logement: e.target.value }))} />
                      </div>
                      <div style={s.field}>
                        <label style={s.label}>Statut</label>
                        <div style={s.statutGroup}>
                          {STATUT_ORDER.map(st => {
                            const mm = STATUT_META[st]
                            const active = editForm.statut === st
                            return (
                              <button type="button" key={st} onClick={() => setEditForm(f => ({ ...f, statut: st }))}
                                style={{ ...s.statutBtn, ...(active ? { color: mm.color, background: mm.bg, borderColor: mm.border, fontWeight: 700 } : {}) }}>
                                {mm.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                    <div style={s.field}>
                      <label style={s.label}><NotePencil size={12} weight="bold" style={{ verticalAlign: -2, marginRight: 4 }} />Notes</label>
                      <textarea className="input-field" style={{ ...s.input, resize: 'vertical' as const }} rows={2} value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                    <div style={s.rowActions}>
                      <button onClick={() => remove(c.id)} style={s.deleteBtn}>
                        <Trash size={13} weight="bold" />
                        Supprimer
                      </button>
                      <button onClick={() => submitEdit(c.id)} className="btn-primary" disabled={pending}>
                        {savedId === c.id ? <><Check size={14} weight="bold" /> Enregistré</> : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

const s: Record<string, React.CSSProperties> = {
  head: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: 14, flexWrap: 'wrap' as const, marginBottom: 18,
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400, color: 'var(--text)', marginBottom: 4,
  },
  sub: { fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 560 },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 10, marginBottom: 16, maxWidth: 520,
  },
  statCard: {
    display: 'flex', flexDirection: 'column' as const, gap: 2,
    padding: '12px 16px', background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: 12,
  },
  statVal: { fontFamily: 'var(--font-fraunces), serif', fontSize: 20, fontWeight: 500, lineHeight: 1.1 },
  statLbl: { fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' },
  addCard: {
    padding: 18, background: 'var(--surface)',
    border: '1px solid var(--accent-border)', borderRadius: 14,
    display: 'flex', flexDirection: 'column' as const, gap: 14, marginBottom: 16,
  },
  formGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
  },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text-2)' },
  input: {
    width: '100%', padding: '9px 12px', borderRadius: 9,
    background: 'var(--bg-2)', border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: 13.5, fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  statutGroup: {
    display: 'inline-flex', flexWrap: 'wrap' as const, gap: 4,
    padding: 4, background: 'var(--bg-2)',
    border: '1px solid var(--border)', borderRadius: 10,
    alignSelf: 'flex-start',
  },
  statutBtn: {
    padding: '6px 11px', borderRadius: 7,
    background: 'transparent', border: '1px solid transparent',
    color: 'var(--text-3)', fontSize: 12, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  error: { fontSize: 13, color: 'var(--danger)', margin: 0 },
  empty: {
    padding: '40px 24px', textAlign: 'center' as const,
    background: 'var(--surface)', border: '1px dashed var(--border-2)',
    borderRadius: 14, display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', gap: 8,
  },
  emptyTitle: { fontSize: 14.5, fontWeight: 600, color: 'var(--text-2)' },
  emptyDesc: { fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.65, maxWidth: 460 },
  list: { display: 'flex', flexDirection: 'column' as const, gap: 10 },
  row: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 13, overflow: 'hidden',
  },
  rowHead: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px', background: 'transparent', border: 'none',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  rowName: {
    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const,
    fontSize: 14, fontWeight: 600, color: 'var(--text)',
  },
  statutPill: {
    padding: '2px 9px', borderRadius: 999, border: '1px solid',
    fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3,
  },
  rowMeta: {
    display: 'flex', flexWrap: 'wrap' as const, gap: '4px 14px',
    fontSize: 12, color: 'var(--text-3)', marginTop: 5,
  },
  metaItem: { display: 'inline-flex', alignItems: 'center', gap: 5 },
  rowBody: {
    padding: '4px 16px 16px',
    display: 'flex', flexDirection: 'column' as const, gap: 12,
    borderTop: '1px solid var(--border)', paddingTop: 14,
  },
  rowActions: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    gap: 10, flexWrap: 'wrap' as const,
  },
  deleteBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 13px', borderRadius: 8,
    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)',
    color: 'var(--danger)', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
}
