'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Trash, PencilSimple, X, Check, Copy,
  MagnifyingGlass, CaretDown, CaretUp, Globe,
} from '@phosphor-icons/react'
import { addTemplate, deleteTemplate, updateTemplate } from './actions'

interface Template {
  id: string
  title: string
  content: string
  category: string
  timing?: string | null
  variante?: string | null
  corps_en?: string | null
  tags?: string[] | null
  copy_count: number
  created_at: string
}

// ─── Timing buckets ─────────────────────────────────────────────────────────

type TimingBucket = 'avant-arrivee' | 'pendant-sejour' | 'apres-depart'

const CATEGORY_TO_TIMING: Record<string, TimingBucket> = {
  confirmation: 'avant-arrivee',
  checkin:      'avant-arrivee',
  bienvenue:    'avant-arrivee',
  securite:     'avant-arrivee',
  upsell:       'avant-arrivee',
  probleme:     'pendant-sejour',
  extra:        'pendant-sejour',
  conciergerie: 'pendant-sejour',
  checkout:     'apres-depart',
  avis:         'apres-depart',
}

const TIMING_BUCKETS: { value: TimingBucket | 'all'; label: string; color: string; bg: string }[] = [
  { value: 'avant-arrivee',  label: "Avant l'arrivée",   color: '#FFD56B', bg: 'rgba(255,213,107,0.12)' },
  { value: 'pendant-sejour', label: 'Pendant le séjour', color: '#60BEFF', bg: 'rgba(96,190,255,0.1)'   },
  { value: 'apres-depart',   label: 'Après le départ',   color: '#F97583', bg: 'rgba(249,117,131,0.1)'  },
]

const CATEGORIES = [
  { value: 'confirmation', label: 'Confirmation',   color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
  { value: 'checkin',      label: 'Check-in',       color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
  { value: 'checkout',     label: 'Check-out',      color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
  { value: 'bienvenue',    label: 'Bienvenue',      color: '#fcd34d', bg: 'rgba(252,211,77,0.12)'  },
  { value: 'avis',         label: 'Avis',           color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
  { value: 'probleme',     label: 'Problème',       color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  { value: 'extra',        label: 'Extra',          color: '#2dd4bf', bg: 'rgba(45,212,191,0.12)'  },
  { value: 'upsell',       label: 'Upsell',         color: '#ffd56b', bg: 'rgba(255,213,107,0.12)' },
  { value: 'securite',     label: 'Sécurité',       color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  { value: 'conciergerie', label: 'Conciergerie',   color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  { value: 'saisonnier',   label: 'Saisonnier',     color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  { value: 'airbnb',       label: 'Airbnb',         color: '#ff6b72', bg: 'rgba(255,107,114,0.12)' },
  { value: 'facebook',     label: 'Groupe Facebook', color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
  { value: 'autre',        label: 'Autre',          color: '#64748b', bg: 'rgba(100,116,139,0.1)'  },
]

function getCat(value: string) {
  return CATEGORIES.find(c => c.value === value) ?? { color: '#64748b', bg: 'rgba(100,116,139,0.1)', label: value }
}

// ─── Shared form ────────────────────────────────────────────────────────────

function TemplateForm({
  defaultValues,
  onSubmit,
  isPending,
  onCancel,
  isEdit = false,
}: {
  defaultValues?: Template
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isPending: boolean
  onCancel?: () => void
  isEdit?: boolean
}) {
  const [showEN, setShowEN] = useState(!!defaultValues?.corps_en)

  return (
    <form onSubmit={onSubmit}>
      {!isEdit && (
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          Nouveau gabarit
        </p>
      )}

      {/* Titre + Catégorie */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '12px' }}>
        <div style={s.group}>
          <label style={s.label}>Titre *</label>
          <input name="title" required defaultValue={defaultValues?.title ?? ''} style={s.input} placeholder="Ex: Bienvenue à votre arrivée" />
        </div>
        <div style={s.group}>
          <label style={s.label}>Catégorie *</label>
          <select name="category" required defaultValue={defaultValues?.category ?? 'confirmation'} style={{ ...s.input, minWidth: '160px' }}>
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timing + Variante */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div style={s.group}>
          <label style={s.label}>Timing <span style={s.opt}>(optionnel)</span></label>
          <input name="timing" defaultValue={defaultValues?.timing ?? ''} style={s.input} placeholder="Ex: À la confirmation de réservation" />
        </div>
        <div style={s.group}>
          <label style={s.label}>Variante <span style={s.opt}>(optionnel)</span></label>
          <input name="variante" defaultValue={defaultValues?.variante ?? ''} style={s.input} placeholder="Ex: Standard, Airbnb, Booking..." />
        </div>
      </div>

      {/* Contenu FR */}
      <div style={{ ...s.group, marginBottom: '10px' }}>
        <label style={s.label}>Contenu — Français *</label>
        <textarea
          name="content"
          required
          rows={7}
          defaultValue={defaultValues?.content ?? ''}
          style={{ ...s.input, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.55 }}
          placeholder="Texte du gabarit en français..."
        />
      </div>

      {/* Contenu EN (collapsible) */}
      <div style={{ marginBottom: '12px' }}>
        <button type="button" onClick={() => setShowEN(v => !v)} style={s.toggleBtn}>
          <Globe size={13} />
          {showEN ? 'Masquer la traduction EN' : 'Ajouter une traduction EN'}
          {showEN ? <CaretUp size={11} /> : <CaretDown size={11} />}
        </button>
        {showEN && (
          <textarea
            name="corps_en"
            rows={6}
            defaultValue={defaultValues?.corps_en ?? ''}
            style={{ ...s.input, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.55, marginTop: '8px' }}
            placeholder="Template text in English..."
          />
        )}
        {!showEN && <input type="hidden" name="corps_en" value="" />}
      </div>

      {/* Tags */}
      <div style={{ ...s.group, marginBottom: '18px' }}>
        <label style={s.label}>Tags <span style={s.opt}>(séparés par des virgules)</span></label>
        <input name="tags" defaultValue={defaultValues?.tags?.join(', ') ?? ''} style={s.input} placeholder="Ex: confirmation, airbnb, débutant" />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="submit" style={s.submitBtn} disabled={isPending}>
          {isPending ? 'Enregistrement...' : isEdit ? 'Enregistrer les modifications' : 'Ajouter le gabarit'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} style={s.cancelBtn}>Annuler</button>
        )}
      </div>
    </form>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function GabaritsAdmin({ templates: initialTemplates }: { templates: Template[] }) {
  const router = useRouter()
  const [templates, setTemplates] = useState(initialTemplates)
  const [showAdd, setShowAdd]       = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch]           = useState('')
  const [filterCat, setFilterCat]     = useState('all')
  const [filterTiming, setFilterTiming] = useState<TimingBucket | 'all'>('all')
  const [isPending, startTransition]  = useTransition()
  const [feedback, setFeedback]     = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  function flash(type: 'ok' | 'err', msg: string) {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 3000)
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await addTemplate(fd)
      if (res.success) {
        setShowAdd(false)
        flash('ok', 'Gabarit ajouté')
        router.refresh()
      } else {
        flash('err', res.error ?? 'Erreur')
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Supprimer ce gabarit ?')) return
    startTransition(async () => {
      const res = await deleteTemplate(id)
      if (res.success) {
        setTemplates(ts => ts.filter(x => x.id !== id))
        flash('ok', 'Gabarit supprimé')
      } else {
        flash('err', res.error ?? 'Erreur')
      }
    })
  }

  function handleEdit(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateTemplate(id, fd)
      if (res.success) {
        const tagsRaw = (fd.get('tags') as string)?.trim()
        setTemplates(ts => ts.map(x => x.id !== id ? x : {
          ...x,
          title:    (fd.get('title') as string)?.trim() ?? x.title,
          content:  (fd.get('content') as string)?.trim() ?? x.content,
          category: (fd.get('category') as string) ?? x.category,
          timing:   (fd.get('timing') as string)?.trim() || null,
          variante: (fd.get('variante') as string)?.trim() || null,
          corps_en: (fd.get('corps_en') as string)?.trim() || null,
          tags:     tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : null,
        }))
        setEditingId(null)
        flash('ok', 'Gabarit mis à jour')
      } else {
        flash('err', res.error ?? 'Erreur')
      }
    })
  }

  // Filtered list
  const filtered = useMemo(() => templates.filter(t => {
    if (filterTiming !== 'all') {
      const bucket = CATEGORY_TO_TIMING[t.category] ?? null
      if (bucket !== filterTiming) return false
    }
    if (filterCat !== 'all' && t.category !== filterCat) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.title.toLowerCase().includes(q) ||
      t.content.toLowerCase().includes(q) ||
      (t.tags ?? []).some(tag => tag.toLowerCase().includes(q)) ||
      (t.timing ?? '').toLowerCase().includes(q)
    )
  }), [templates, search, filterCat, filterTiming])

  // Category counts
  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    templates.forEach(t => { c[t.category] = (c[t.category] ?? 0) + 1 })
    return c
  }, [templates])

  // Only show category pills relevant to the selected timing bucket
  const usedCats = CATEGORIES.filter(c => {
    if (!counts[c.value]) return false
    if (filterTiming === 'all') return true
    return CATEGORY_TO_TIMING[c.value] === filterTiming
  })

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '22px', fontWeight: 500, color: 'var(--text)', marginBottom: '5px' }}>
            Gabarits de messages
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
            {templates.length} gabarit{templates.length !== 1 ? 's' : ''} · {usedCats.length} catégorie{usedCats.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(v => !v); setEditingId(null) }}
          disabled={isPending}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '9px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            background:   showAdd ? 'rgba(248,113,113,0.08)' : 'rgba(255,213,107,0.1)',
            border:       showAdd ? '1px solid rgba(248,113,113,0.25)' : '1px solid rgba(255,213,107,0.2)',
            color:        showAdd ? '#f87171' : 'var(--accent-text)',
          }}
        >
          {showAdd ? <X size={14} /> : <Plus size={14} />}
          {showAdd ? 'Annuler' : 'Nouveau gabarit'}
        </button>
      </div>

      {/* ── Toast ── */}
      {feedback && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 14px', borderRadius: '10px', border: '1px solid',
          fontSize: '13px', marginBottom: '16px',
          background:   feedback.type === 'ok' ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
          borderColor:  feedback.type === 'ok' ? 'rgba(74,222,128,0.3)'  : 'rgba(248,113,113,0.3)',
          color:        feedback.type === 'ok' ? '#4ade80' : '#f87171',
        }}>
          {feedback.type === 'ok' ? <Check size={14} /> : <X size={14} />}
          {feedback.msg}
        </div>
      )}

      {/* ── Add form ── */}
      {showAdd && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px', marginBottom: '24px' }}>
          <TemplateForm onSubmit={handleAdd} isPending={isPending} onCancel={() => setShowAdd(false)} />
        </div>
      )}

      {/* ── Search + filter (hors mode add) ── */}
      {!showAdd && (
        <div style={{ marginBottom: '20px' }}>
          {/* Timing bucket filters */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <button
              onClick={() => { setFilterTiming('all'); setFilterCat('all') }}
              style={{
                padding: '5px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                background:   filterTiming === 'all' ? 'var(--surface-2)' : 'transparent',
                border:       filterTiming === 'all' ? '1px solid var(--border-2)' : '1px solid var(--border)',
                color:        filterTiming === 'all' ? 'var(--text)' : 'var(--text-3)',
              }}
            >
              Tous les moments
            </button>
            {TIMING_BUCKETS.map(b => (
              <button
                key={b.value}
                onClick={() => { setFilterTiming(b.value as TimingBucket); setFilterCat('all') }}
                style={{
                  padding: '5px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                  background:   filterTiming === b.value ? b.bg : 'transparent',
                  border:       filterTiming === b.value ? `1px solid ${b.color}40` : '1px solid var(--border)',
                  color:        filterTiming === b.value ? b.color : 'var(--text-3)',
                }}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <MagnifyingGlass size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par titre, contenu, tag..."
              style={{
                width: '100%', boxSizing: 'border-box',
                paddingLeft: '38px', paddingRight: search ? '36px' : '12px',
                paddingTop: '9px', paddingBottom: '9px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '10px', color: 'var(--text)', fontSize: '14px', outline: 'none',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: '2px' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterCat('all')}
              style={{
                padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                background:   filterCat === 'all' ? 'rgba(255,213,107,0.15)' : 'transparent',
                border:       filterCat === 'all' ? '1px solid rgba(255,213,107,0.3)' : '1px solid var(--border)',
                color:        filterCat === 'all' ? 'var(--accent-text)' : 'var(--text-3)',
              }}
            >
              Tous ({templates.length})
            </button>
            {usedCats.map(cat => (
              <button
                key={cat.value}
                onClick={() => setFilterCat(filterCat === cat.value ? 'all' : cat.value)}
                style={{
                  padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                  background:   filterCat === cat.value ? cat.bg : 'transparent',
                  border:       filterCat === cat.value ? `1px solid ${cat.color}50` : '1px solid var(--border)',
                  color:        filterCat === cat.value ? cat.color : 'var(--text-3)',
                }}
              >
                {cat.label} ({counts[cat.value]})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Résultats */}
      {(search || filterCat !== 'all') && !showAdd && (
        <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '12px' }}>
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
          {filterCat !== 'all' && ` dans "${getCat(filterCat).label}"`}
        </p>
      )}

      {/* ── Liste ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '52px 20px', color: 'var(--text-3)', fontSize: '14px' }}>
            {search || filterCat !== 'all' ? 'Aucun résultat pour cette recherche.' : 'Aucun gabarit pour l\'instant.'}
          </div>
        )}

        {filtered.map(t => {
          const cat        = getCat(t.category)
          const isEditing  = editingId === t.id
          const isExpanded = expandedId === t.id

          return (
            <div
              key={t.id}
              style={{
                background: 'var(--surface)',
                border: isEditing ? `1px solid ${cat.color}40` : '1px solid var(--surface-2)',
                borderRadius: '12px', overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
            >
              {isEditing ? (
                /* ── Edit form ── */
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: cat.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Modification
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-3)', marginLeft: '4px' }}>{t.title}</span>
                  </div>
                  <TemplateForm
                    defaultValues={t}
                    onSubmit={e => handleEdit(e, t.id)}
                    isPending={isPending}
                    onCancel={() => setEditingId(null)}
                    isEdit
                  />
                </div>
              ) : (
                /* ── Card view ── */
                <div style={{ display: 'flex', gap: '0' }}>
                  {/* Color bar */}
                  <div style={{ width: '3px', background: cat.color, flexShrink: 0 }} />

                  <div style={{ flex: 1, padding: '14px 16px', minWidth: 0 }}>
                    {/* Top row: badges + actions */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '100px',
                            background: cat.bg, color: cat.color, border: `1px solid ${cat.color}30`,
                          }}>
                            {cat.label}
                          </span>
                          {t.variante && (
                            <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '100px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-3)' }}>
                              {t.variante}
                            </span>
                          )}
                          {t.corps_en && (
                            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(129,140,248,0.08)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.2)' }}>
                              EN
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: t.timing ? '4px' : '0' }}>
                          {t.title}
                        </div>

                        {/* Timing */}
                        {t.timing && (
                          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '0' }}>
                            {t.timing}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : t.id)}
                            style={s.iconBtn}
                            title={isExpanded ? 'Réduire' : 'Lire le contenu'}
                          >
                            {isExpanded ? <CaretUp size={13} /> : <CaretDown size={13} />}
                          </button>
                          <button
                            onClick={() => { setEditingId(t.id); setExpandedId(null) }}
                            style={s.iconBtn}
                            title="Modifier"
                          >
                            <PencilSimple size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            style={{ ...s.iconBtn, color: 'rgba(248,113,113,0.55)' }}
                            title="Supprimer"
                          >
                            <Trash size={13} />
                          </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <Copy size={10} />
                          {t.copy_count}
                        </div>
                      </div>
                    </div>

                    {/* Content (collapsed = 2 lines, expanded = full) */}
                    <div style={{ marginTop: '10px' }}>
                      {isExpanded ? (
                        <pre style={{
                          fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6,
                          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                          fontFamily: 'inherit', margin: 0,
                          padding: '12px 14px', background: 'var(--surface-2)', borderRadius: '8px',
                        }}>
                          {t.content}
                        </pre>
                      ) : (
                        <p style={{
                          fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.5, margin: 0,
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {t.content}
                        </p>
                      )}
                    </div>

                    {/* Tags */}
                    {t.tags && t.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '10px' }}>
                        {t.tags.map(tag => (
                          <span key={tag} style={{
                            fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                            background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)',
                          }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  group: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  opt:   { fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-muted)' },
  input: {
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: '9px', padding: '9px 12px',
    color: 'var(--text)', fontSize: '14px',
    outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  submitBtn: {
    padding: '10px 20px', borderRadius: '10px',
    background: 'rgba(255,213,107,0.15)', border: '1px solid rgba(255,213,107,0.3)',
    color: 'var(--accent-text)', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
  },
  cancelBtn: {
    padding: '10px 18px', borderRadius: '10px',
    background: 'var(--surface)', border: '1px solid var(--border-2)',
    color: 'var(--text-3)', fontSize: '14px', cursor: 'pointer',
  },
  toggleBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
    background: 'var(--surface)', border: '1px solid var(--border-2)', color: 'var(--text-3)',
  },
  iconBtn: {
    background: 'var(--border)', border: '1px solid var(--border-2)',
    borderRadius: '7px', width: '28px', height: '28px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-2)',
  },
}
