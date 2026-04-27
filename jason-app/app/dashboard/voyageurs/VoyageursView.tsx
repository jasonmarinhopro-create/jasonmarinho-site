'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, MagnifyingGlass, Warning, CaretRight,
  X, User, Envelope, Phone, Note,
  Users, ShieldCheck, CurrencyEur, Star, SquaresFour, Rows, ProhibitInset,
} from '@phosphor-icons/react'
import { addVoyageur, updateVoyageur, deleteVoyageur, checkVoyageurSignale, type VoyageurData } from './actions'

type Sejour = { id: string; date_arrivee: string; date_depart: string; montant: number | null }
type Voyageur = {
  id: string; prenom: string; nom: string
  email: string | null; telephone: string | null; notes: string | null
  tags: string[] | null; source: string | null; bloque: boolean | null
  id_verifie: boolean | null; note_privee: number | null
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
  const [signaleAlert, setSignaleAlert] = useState<{ count: number; motifs?: string[] } | null>(null)
  const [allowDespiteSignal, setAllowDespiteSignal] = useState(false)

  // Filtres + tri + vue
  const [filter, setFilter] = useState<'all' | 'recurrents' | 'a-venir' | 'signales' | 'bloques'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'sejours' | 'ca'>('recent')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(voyageurs.length >= 10 ? 'table' : 'cards')

  const todayISO = new Date().toISOString().slice(0, 10)

  // Helper : CA d'un voyageur
  const caOf = (v: Voyageur) => v.sejours.reduce((sum, s) => sum + (s.montant ?? 0), 0)
  const hasUpcoming = (v: Voyageur) => v.sejours.some(s => s.date_arrivee >= todayISO)
  const isRecurrent = (v: Voyageur) => v.sejours.length >= 2

  // ─── Stats globales ─────────────────────────────────────────────
  const globalStats = useMemo(() => {
    const total = voyageurs.length
    const recurrents = voyageurs.filter(isRecurrent).length
    const signales = voyageurs.filter(v => v.is_flagged || v.bloque === true).length
    const caTotal = voyageurs.reduce((sum, v) => sum + caOf(v), 0)
    return { total, recurrents, signales, caTotal }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voyageurs])

  // ─── Filtrage + tri ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let list = voyageurs.filter(v => {
      // Filtre par catégorie
      if (filter === 'recurrents' && !isRecurrent(v)) return false
      if (filter === 'a-venir' && !hasUpcoming(v)) return false
      if (filter === 'signales' && !v.is_flagged) return false
      if (filter === 'bloques' && !v.bloque) return false

      // Recherche
      if (q) {
        const haystack = [v.prenom, v.nom, v.email ?? '', v.telephone ?? '', (v.tags ?? []).join(' ')].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    // Tri
    list = [...list].sort((a, b) => {
      if (sortBy === 'name') return `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`)
      if (sortBy === 'sejours') return b.sejours.length - a.sejours.length
      if (sortBy === 'ca') return caOf(b) - caOf(a)
      // recent (default) : par updated_at
      return b.updated_at.localeCompare(a.updated_at)
    })
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voyageurs, search, filter, sortBy, todayISO])

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

  function closeModal() {
    setModal(null); setEditTarget(null)
    setSignaleAlert(null); setAllowDespiteSignal(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.prenom.trim() || !form.nom.trim()) {
      setFormError('Prénom et nom sont obligatoires.')
      return
    }
    setFormError('')

    startTransition(async () => {
      // Phase 7 — sécurité : si création, vérifier que email/tel ne sont pas signalés
      if (modal === 'add' && !allowDespiteSignal && (form.email?.trim() || form.telephone?.trim())) {
        const check = await checkVoyageurSignale({ email: form.email, telephone: form.telephone })
        if (check.signale) {
          setSignaleAlert({ count: check.count ?? 0, motifs: check.motifs })
          return
        }
      }

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

      {/* Stats globales */}
      {tableReady && voyageurs.length > 0 && (
        <div style={s.statsGrid} className="fade-up">
          <div style={s.statCard}>
            <span style={{ ...s.statIcon, background: 'var(--accent-bg)' }}>
              <Users size={14} weight="fill" color="var(--accent-text)" />
            </span>
            <div>
              <div style={s.globalStatValue}>{globalStats.total}</div>
              <div style={s.globalStatLabel}>Voyageur{globalStats.total > 1 ? 's' : ''}</div>
            </div>
          </div>
          <div style={s.statCard}>
            <span style={{ ...s.statIcon, background: 'rgba(96,165,250,0.10)' }}>
              <Star size={14} weight="fill" color="#60a5fa" />
            </span>
            <div>
              <div style={s.globalStatValue}>{globalStats.recurrents}</div>
              <div style={s.globalStatLabel}>Récurrent{globalStats.recurrents > 1 ? 's' : ''} (≥2 séjours)</div>
            </div>
          </div>
          <div style={s.statCard}>
            <span style={{ ...s.statIcon, background: 'rgba(16,185,129,0.10)' }}>
              <CurrencyEur size={14} weight="fill" color="#10b981" />
            </span>
            <div>
              <div style={s.globalStatValue}>{globalStats.caTotal.toLocaleString('fr-FR')} €</div>
              <div style={s.globalStatLabel}>CA cumulé</div>
            </div>
          </div>
          <div style={s.statCard}>
            <span style={{ ...s.statIcon, background: globalStats.signales > 0 ? 'rgba(239,68,68,0.10)' : 'var(--surface-2)' }}>
              <ShieldCheck size={14} weight="fill" color={globalStats.signales > 0 ? '#ef4444' : 'var(--text-muted)'} />
            </span>
            <div>
              <div style={{ ...s.globalStatValue, color: globalStats.signales > 0 ? '#ef4444' : 'var(--text)' }}>{globalStats.signales}</div>
              <div style={s.globalStatLabel}>Signalé{globalStats.signales > 1 ? 's' : ''} / bloqué{globalStats.signales > 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
      )}

      {/* Table not ready */}
      {!tableReady && (
        <div style={s.setupBanner} className="fade-up">
          <Warning size={18} color="#FFD56B" />
          <span>La table <code>voyageurs</code> n&apos;existe pas encore. Lance la migration <code>supabase-voyageurs-migration.sql</code> dans Supabase.</span>
        </div>
      )}

      {tableReady && (
        <>
          {/* Filtres + recherche + tri + toggle vue */}
          {voyageurs.length > 0 && (
            <>
              <div style={s.filterBar} className="fade-up">
                <div style={s.filterChips}>
                  <button onClick={() => setFilter('all')} style={{ ...s.filterChip, ...(filter === 'all' ? s.filterChipActive : {}) }}>
                    Tous <span style={s.chipCount}>{voyageurs.length}</span>
                  </button>
                  {globalStats.recurrents > 0 && (
                    <button onClick={() => setFilter('recurrents')} style={{ ...s.filterChip, ...(filter === 'recurrents' ? s.filterChipActive : {}) }}>
                      Récurrents <span style={s.chipCount}>{globalStats.recurrents}</span>
                    </button>
                  )}
                  {voyageurs.some(hasUpcoming) && (
                    <button onClick={() => setFilter('a-venir')} style={{ ...s.filterChip, ...(filter === 'a-venir' ? s.filterChipActive : {}) }}>
                      À venir <span style={s.chipCount}>{voyageurs.filter(hasUpcoming).length}</span>
                    </button>
                  )}
                  {voyageurs.some(v => v.is_flagged) && (
                    <button onClick={() => setFilter('signales')} style={{ ...s.filterChip, ...(filter === 'signales' ? s.filterChipActive : {}) }}>
                      Signalés <span style={s.chipCount}>{voyageurs.filter(v => v.is_flagged).length}</span>
                    </button>
                  )}
                  {voyageurs.some(v => v.bloque) && (
                    <button onClick={() => setFilter('bloques')} style={{ ...s.filterChip, ...(filter === 'bloques' ? s.filterChipActive : {}) }}>
                      Bloqués <span style={s.chipCount}>{voyageurs.filter(v => v.bloque).length}</span>
                    </button>
                  )}
                </div>
                <div style={s.filterRight}>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} style={s.sortSelect}>
                    <option value="recent">Plus récents</option>
                    <option value="name">Nom (A–Z)</option>
                    <option value="sejours">Plus de séjours</option>
                    <option value="ca">CA décroissant</option>
                  </select>
                  <div style={s.viewToggle}>
                    <button onClick={() => setViewMode('cards')} style={{ ...s.viewBtn, ...(viewMode === 'cards' ? s.viewBtnActive : {}) }} title="Vue cards">
                      <SquaresFour size={13} weight="fill" />
                    </button>
                    <button onClick={() => setViewMode('table')} style={{ ...s.viewBtn, ...(viewMode === 'table' ? s.viewBtnActive : {}) }} title="Vue tableau">
                      <Rows size={13} weight="bold" />
                    </button>
                  </div>
                </div>
              </div>
              <div style={s.searchWrap} className="fade-up">
                <MagnifyingGlass size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email, téléphone, tag…"
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
            </>
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

          {/* List — vue Cards */}
          {filtered.length > 0 && viewMode === 'cards' && (
            <div style={s.list} className="fade-up">
              {filtered.map(v => {
                const initials = `${v.prenom[0]}${v.nom[0]}`.toUpperCase()
                const color = avatarColor(v.prenom + v.nom)
                const last = lastStay(v.sejours)
                const ca = caOf(v)
                return (
                  <div
                    key={v.id}
                    onClick={() => router.push(`/dashboard/voyageurs/${v.id}`)}
                    style={{ ...s.row, opacity: v.bloque ? 0.6 : 1 }}
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
                        {v.bloque && (
                          <span style={{ ...s.flagBadge, background: 'rgba(148,163,184,0.12)', borderColor: 'rgba(148,163,184,0.30)', color: 'var(--text-muted)' }}>
                            <ProhibitInset size={11} weight="fill" />
                            Bloqué
                          </span>
                        )}
                        {v.tags && v.tags.slice(0, 2).map(t => (
                          <span key={t} style={s.tagChip}>{t}</span>
                        ))}
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
                    {ca > 0 && (
                      <div style={s.stats}>
                        <div style={{ ...s.statVal, color: '#10b981' }}>{ca.toLocaleString('fr-FR')} €</div>
                        <div style={s.statLabel}>CA</div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={s.rowActions} onClick={e => e.stopPropagation()}>
                      <button onClick={e => openEdit(v, e)} style={s.actionBtn} title="Modifier">
                        <Note size={15} />
                      </button>
                      <button onClick={e => handleDelete(v.id, e)} style={s.actionBtn} title="Supprimer">
                        <X size={15} />
                      </button>
                    </div>

                    <CaretRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  </div>
                )
              })}
            </div>
          )}

          {/* List — vue Tableau */}
          {filtered.length > 0 && viewMode === 'table' && (
            <div style={s.tableWrap} className="fade-up">
              <table style={s.tableEl}>
                <thead>
                  <tr>
                    <th style={s.tableTh}>Nom</th>
                    <th style={s.tableTh}>Contact</th>
                    <th style={s.tableThNum}>Séjours</th>
                    <th style={s.tableThNum}>CA</th>
                    <th style={s.tableTh}>Tags</th>
                    <th style={s.tableTh}>Statut</th>
                    <th style={s.tableTh}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(v => {
                    const initials = `${v.prenom[0]}${v.nom[0]}`.toUpperCase()
                    const color = avatarColor(v.prenom + v.nom)
                    const ca = caOf(v)
                    return (
                      <tr key={v.id} onClick={() => router.push(`/dashboard/voyageurs/${v.id}`)} style={{ ...s.tableRow, opacity: v.bloque ? 0.6 : 1 }}>
                        <td style={s.tableTd}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ ...s.tableAvatar, background: color }}>{initials}</div>
                            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v.prenom} {v.nom}</span>
                          </div>
                        </td>
                        <td style={{ ...s.tableTd, color: 'var(--text-2)' }}>
                          {v.email || v.telephone || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td style={s.tableTdNum}>{v.sejours.length}</td>
                        <td style={s.tableTdNum}>{ca > 0 ? `${ca.toLocaleString('fr-FR')} €` : '—'}</td>
                        <td style={s.tableTd}>
                          {v.tags && v.tags.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px' }}>
                              {v.tags.slice(0, 3).map(t => (
                                <span key={t} style={s.tagChip}>{t}</span>
                              ))}
                            </div>
                          ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td style={s.tableTd}>
                          {v.is_flagged ? (
                            <span style={{ ...s.flagBadge, marginTop: 0 }}>
                              <Warning size={11} weight="fill" />
                              Signalé
                            </span>
                          ) : v.bloque ? (
                            <span style={{ ...s.flagBadge, background: 'rgba(148,163,184,0.12)', borderColor: 'rgba(148,163,184,0.30)', color: 'var(--text-muted)' }}>
                              <ProhibitInset size={11} weight="fill" />
                              Bloqué
                            </span>
                          ) : v.sejours.length >= 4 ? (
                            <span style={{ ...s.flagBadge, background: 'rgba(16,185,129,0.10)', borderColor: 'rgba(16,185,129,0.30)', color: '#10b981' }}>
                              Fidèle
                            </span>
                          ) : v.sejours.length >= 2 ? (
                            <span style={{ ...s.flagBadge, background: 'rgba(96,165,250,0.10)', borderColor: 'rgba(96,165,250,0.30)', color: '#60a5fa' }}>
                              Récurrent
                            </span>
                          ) : <span style={{ color: 'var(--text-muted)' }}>Nouveau</span>}
                        </td>
                        <td style={s.tableTd} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                            <button onClick={e => openEdit(v, e)} style={s.actionBtn} title="Modifier">
                              <Note size={14} />
                            </button>
                            <button onClick={e => handleDelete(v.id, e)} style={s.actionBtn} title="Supprimer">
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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

              {/* Phase 7 — alerte si email/tel signalé par la communauté */}
              {signaleAlert && (
                <div style={{
                  padding: '14px 16px',
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '11px',
                  display: 'flex', flexDirection: 'column' as const, gap: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <Warning size={18} weight="fill" color="#ef4444" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444', marginBottom: '4px' }}>
                        ⚠️ Voyageur signalé par la communauté
                      </div>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
                        Cet email ou ce téléphone a été signalé <strong>{signaleAlert.count} fois</strong>.
                        {signaleAlert.motifs && signaleAlert.motifs.length > 0 && (
                          <> Motifs : <strong>{signaleAlert.motifs.join(', ')}</strong>.</>
                        )} Vérifie soigneusement avant d&apos;accepter une réservation.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setSignaleAlert(null)}
                      style={{ padding: '6px 12px', fontSize: '12px', background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAllowDespiteSignal(true); setSignaleAlert(null); document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })) }}
                      style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600, background: 'rgba(239,68,68,0.10)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.30)', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Ajouter quand même
                    </button>
                  </div>
                </div>
              )}

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

  // ─── Phase 2 — stats globales, filtres, vue tableau ─────────────
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',
    marginBottom: '16px',
  },
  statCard: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 16px',
    background: 'var(--surface)',
    border: '1px solid var(--border-2)',
    borderRadius: '12px',
  },
  statIcon: {
    width: '32px', height: '32px', borderRadius: '9px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  globalStatValue: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '18px', fontWeight: 500,
    color: 'var(--text)',
    lineHeight: 1.1,
  },
  globalStatLabel: {
    fontSize: '11px', fontWeight: 500,
    color: 'var(--text-muted)',
    marginTop: '2px',
  },

  filterBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    gap: '12px', flexWrap: 'wrap' as const,
    marginBottom: '10px',
  },
  filterChips: {
    display: 'flex', flexWrap: 'wrap' as const, gap: '6px',
  },
  filterChip: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '7px 14px',
    fontSize: '12.5px', fontWeight: 500,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '100px',
    color: 'var(--text-2)',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  filterChipActive: {
    background: 'var(--accent-bg)',
    borderColor: 'var(--accent-border)',
    color: 'var(--accent-text)',
  },
  chipCount: {
    fontSize: '11px', fontWeight: 700,
    opacity: 0.7,
  },
  filterRight: {
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  sortSelect: {
    padding: '7px 12px',
    fontSize: '12.5px',
    fontFamily: 'inherit',
    color: 'var(--text-2)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '9px',
    cursor: 'pointer',
  },
  viewToggle: {
    display: 'inline-flex', gap: '2px',
    padding: '3px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '9px',
  },
  viewBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '28px', height: '28px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  viewBtnActive: {
    background: 'var(--accent-bg)',
    color: 'var(--accent-text)',
  },

  // Tag chip dans la liste
  tagChip: {
    display: 'inline-block',
    fontSize: '10px', fontWeight: 600,
    padding: '2px 8px',
    background: 'var(--accent-bg)',
    color: 'var(--accent-text)',
    border: '1px solid var(--accent-border)',
    borderRadius: '100px',
  },

  // Tableau
  tableWrap: {
    overflowX: 'auto' as const,
    background: 'var(--surface)',
    border: '1px solid var(--border-2)',
    borderRadius: '14px',
  },
  tableEl: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '13px',
  },
  tableTh: {
    padding: '12px 14px',
    textAlign: 'left' as const,
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.4px',
    textTransform: 'uppercase' as const,
    color: 'var(--text-muted)',
    background: 'var(--bg-2)',
    borderBottom: '1px solid var(--border-2)',
  },
  tableThNum: {
    padding: '12px 14px',
    textAlign: 'right' as const,
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.4px',
    textTransform: 'uppercase' as const,
    color: 'var(--text-muted)',
    background: 'var(--bg-2)',
    borderBottom: '1px solid var(--border-2)',
  },
  tableRow: {
    cursor: 'pointer',
    borderBottom: '1px solid var(--border)',
    transition: 'background 0.12s',
  },
  tableTd: {
    padding: '12px 14px',
    color: 'var(--text-2)',
    fontWeight: 400,
  },
  tableTdNum: {
    padding: '12px 14px',
    textAlign: 'right' as const,
    color: 'var(--text)',
    fontWeight: 500,
  },
  tableAvatar: {
    width: '32px', height: '32px',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    color: '#fff',
    fontSize: '11px', fontWeight: 700,
    fontFamily: 'var(--font-fraunces), serif',
  },
}
