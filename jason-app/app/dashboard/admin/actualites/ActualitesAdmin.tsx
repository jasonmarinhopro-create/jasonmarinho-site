'use client'

import { useState, useTransition } from 'react'
import {
  Plus, Trash, PencilSimple, X, Check, ArrowClockwise,
  Eye, EyeSlash, CheckCircle, XCircle, Globe,
} from '@phosphor-icons/react'
import { addActualite, updateActualite, deleteActualite, togglePublish } from './actions'

interface Actualite {
  id: string
  title: string
  summary: string
  source_url: string | null
  category: string
  is_published: boolean
  published_at: string | null
  created_at: string
}

const CATEGORIES = [
  { value: 'reglementation',      label: 'Réglementation',    color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  { value: 'fiscalite',           label: 'Fiscalité',         color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  { value: 'gites',               label: 'Gîtes & Meublés',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { value: 'chambres-hotes',      label: "Chambres d'hôtes",  color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  { value: 'conciergerie',        label: 'Conciergeries',     color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { value: 'reservation-directe', label: 'Réserv. directe',  color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { value: 'marche',              label: 'Marché',            color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  { value: 'communes',            label: 'Communes & Villes', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  { value: 'plateformes',         label: 'Plateformes OTA',   color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  { value: 'outils',              label: 'Outils & Tech',     color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  { value: 'general',             label: 'Général',           color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
]

function getCat(value: string) {
  return CATEGORIES.find(c => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function FeedbackPill({ type, msg }: { type: 'ok' | 'err'; msg: string }) {
  const color = type === 'ok' ? '#34D399' : '#f87171'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 500, color, background: `${color}14`, border: `1px solid ${color}30`, padding: '4px 10px', borderRadius: '8px' }}>
      {type === 'ok' ? <CheckCircle size={13} weight="fill" /> : <XCircle size={13} weight="fill" />}
      {msg}
    </span>
  )
}

function ActualiteForm({
  defaultValues,
  onSubmit,
  onCancel,
  isPending,
  isEdit = false,
}: {
  defaultValues?: Partial<Actualite>
  onSubmit: (fd: FormData) => void
  onCancel?: () => void
  isPending: boolean
  isEdit?: boolean
}) {
  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit(new FormData(e.currentTarget)) }}
      style={s.form}
    >
      {!isEdit && (
        <p style={s.formTitle}>Nouvel article</p>
      )}

      {/* Titre */}
      <div style={s.group}>
        <label style={s.label}>Titre *</label>
        <input
          name="title" required
          defaultValue={defaultValues?.title ?? ''}
          style={s.input}
          placeholder="Ex: Loi Le Meur 2025 — Ce qui change pour les hôtes"
        />
      </div>

      {/* Catégorie */}
      <div style={s.group}>
        <label style={s.label}>Catégorie *</label>
        <select name="category" required defaultValue={defaultValues?.category ?? 'general'} style={{ ...s.input, cursor: 'pointer' }}>
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Résumé */}
      <div style={s.group}>
        <label style={s.label}>Résumé *</label>
        <textarea
          name="summary" required rows={4}
          defaultValue={defaultValues?.summary ?? ''}
          style={{ ...s.input, resize: 'vertical' as const, fontFamily: 'inherit', lineHeight: 1.55 }}
          placeholder="Résumé de l'actualité en 2–4 phrases..."
        />
      </div>

      {/* Source URL */}
      <div style={s.group}>
        <label style={s.label}>Lien source <span style={s.opt}>(optionnel)</span></label>
        <div style={{ position: 'relative' as const }}>
          <Globe size={15} style={{ position: 'absolute' as const, left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' as const }} />
          <input
            name="source_url" type="url"
            defaultValue={defaultValues?.source_url ?? ''}
            style={{ ...s.input, paddingLeft: '34px' }}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Publié */}
      <div style={s.publishRow}>
        <label style={s.publishLabel}>
          <input
            type="checkbox"
            name="is_published"
            value="true"
            defaultChecked={defaultValues?.is_published ?? false}
            style={{ accentColor: '#34d399', width: '15px', height: '15px', cursor: 'pointer' }}
          />
          Publier immédiatement
        </label>
      </div>

      {/* Actions */}
      <div style={s.formActions}>
        {onCancel && (
          <button type="button" onClick={onCancel} style={s.cancelBtn}>
            <X size={13} weight="bold" /> Annuler
          </button>
        )}
        <button type="submit" disabled={isPending} style={s.submitBtn}>
          {isPending
            ? <ArrowClockwise size={13} style={{ animation: 'spin 1s linear infinite' }} />
            : <Check size={13} weight="bold" />}
          {isEdit ? 'Enregistrer' : 'Créer l\'article'}
        </button>
      </div>
    </form>
  )
}

export default function ActualitesAdmin({ articles }: { articles: Actualite[] }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ id: string; type: 'ok' | 'err'; msg: string } | null>(null)
  const [filterCat, setFilterCat] = useState('all')

  function notify(id: string, type: 'ok' | 'err', msg: string) {
    setFeedback({ id, type, msg })
    setTimeout(() => setFeedback(null), 3000)
  }

  function handleAdd(fd: FormData) {
    startTransition(async () => {
      const res = await addActualite(fd)
      if (res.success) { setShowForm(false); notify('add', 'ok', 'Article créé') }
      else notify('add', 'err', String(res.error))
    })
  }

  function handleUpdate(id: string, fd: FormData) {
    startTransition(async () => {
      const res = await updateActualite(id, fd)
      if (res.success) { setEditingId(null); notify(id, 'ok', 'Modifié') }
      else notify(id, 'err', String(res.error))
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteActualite(id)
      if (res.success) notify(id, 'ok', 'Supprimé')
      else notify(id, 'err', String(res.error))
    })
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const res = await togglePublish(id, current)
      if (res.success) notify(id, 'ok', current ? 'Dépublié' : 'Publié')
      else notify(id, 'err', String(res.error))
    })
  }

  const filtered = filterCat === 'all' ? articles : articles.filter(a => a.category === filterCat)
  const publishedCount = articles.filter(a => a.is_published).length

  return (
    <div style={s.wrap}>

      {/* Header */}
      <div style={s.pageIntro} className="fade-up">
        <h2 style={s.pageTitle}>Actualités LCD</h2>
        <p style={s.pageDesc}>Gérez le fil d&apos;actualités visible par les membres.</p>
      </div>

      {/* Stats bar */}
      <div style={s.statsBar} className="fade-up">
        <div style={s.statChip}>
          <span style={{ ...s.statNum, color: 'var(--text)' }}>{articles.length}</span>
          <span style={s.statLbl}>article{articles.length > 1 ? 's' : ''} au total</span>
        </div>
        <div style={s.statChip}>
          <span style={{ ...s.statNum, color: '#34d399' }}>{publishedCount}</span>
          <span style={s.statLbl}>publiés</span>
        </div>
        <div style={s.statChip}>
          <span style={{ ...s.statNum, color: '#fb923c' }}>{articles.length - publishedCount}</span>
          <span style={s.statLbl}>brouillons</span>
        </div>

        <button
          onClick={() => { setShowForm(v => !v); setEditingId(null) }}
          style={s.addBtn}
        >
          {showForm ? <X size={14} weight="bold" /> : <Plus size={14} weight="bold" />}
          {showForm ? 'Annuler' : 'Nouvel article'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={s.formWrap} className="glass-card fade-up">
          <ActualiteForm
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
            isPending={isPending}
          />
          {feedback?.id === 'add' && <div style={{ marginTop: '12px' }}><FeedbackPill type={feedback.type} msg={feedback.msg} /></div>}
        </div>
      )}

      {/* Category filter */}
      {articles.length > 0 && (
        <div style={s.filterRow} className="fade-up">
          {['all', ...CATEGORIES.map(c => c.value)].map(val => {
            const cat = val === 'all' ? null : getCat(val)
            const count = val === 'all' ? articles.length : articles.filter(a => a.category === val).length
            if (count === 0 && val !== 'all') return null
            return (
              <button
                key={val}
                onClick={() => setFilterCat(val)}
                style={{
                  ...s.filterBtn,
                  ...(filterCat === val
                    ? { background: cat ? cat.bg : 'var(--border)', color: cat ? cat.color : 'var(--text)', borderColor: cat ? `${cat.color}30` : 'var(--border-2)' }
                    : {}),
                }}
              >
                {val === 'all' ? 'Tout' : cat?.label} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Articles list */}
      {articles.length === 0 ? (
        <div style={s.empty} className="glass-card fade-up">
          Aucun article pour le moment. Créez le premier avec le bouton ci-dessus.
        </div>
      ) : (
        <div style={s.list} className="fade-up">
          {filtered.map(article => {
            const cat = getCat(article.category)
            const isEditing = editingId === article.id

            return (
              <div key={article.id} style={s.item} className="glass-card">
                {isEditing ? (
                  <>
                    <ActualiteForm
                      defaultValues={article}
                      onSubmit={fd => handleUpdate(article.id, fd)}
                      onCancel={() => setEditingId(null)}
                      isPending={isPending}
                      isEdit
                    />
                    {feedback?.id === article.id && <div style={{ marginTop: '12px' }}><FeedbackPill type={feedback.type} msg={feedback.msg} /></div>}
                  </>
                ) : (
                  <>
                    <div style={s.itemHead}>
                      <div style={s.itemMeta}>
                        <span style={{ ...s.catBadge, color: cat.color, background: cat.bg, borderColor: `${cat.color}25` }}>
                          {cat.label}
                        </span>
                        <span style={{ ...s.statusBadge, ...(article.is_published ? s.statusPublished : s.statusDraft) }}>
                          {article.is_published ? 'Publié' : 'Brouillon'}
                        </span>
                        <span style={s.dateText}>{formatDate(article.created_at)}</span>
                      </div>

                      <div style={s.itemActions}>
                        {feedback?.id === article.id
                          ? <FeedbackPill type={feedback.type} msg={feedback.msg} />
                          : (
                            <>
                              <button
                                onClick={() => handleToggle(article.id, article.is_published)}
                                disabled={isPending}
                                title={article.is_published ? 'Dépublier' : 'Publier'}
                                style={{ ...s.iconBtn, color: article.is_published ? '#fb923c' : '#34d399' }}
                              >
                                {article.is_published ? <EyeSlash size={15} /> : <Eye size={15} />}
                              </button>
                              <button
                                onClick={() => setEditingId(article.id)}
                                style={{ ...s.iconBtn, color: '#60a5fa' }}
                                title="Modifier"
                              >
                                <PencilSimple size={15} />
                              </button>
                              <button
                                onClick={() => handleDelete(article.id)}
                                disabled={isPending}
                                style={{ ...s.iconBtn, color: '#f87171' }}
                                title="Supprimer"
                              >
                                <Trash size={15} />
                              </button>
                            </>
                          )}
                      </div>
                    </div>

                    <h3 style={s.itemTitle}>{article.title}</h3>
                    <p style={s.itemSummary}>{article.summary}</p>
                    {article.source_url && (
                      <a href={article.source_url} target="_blank" rel="noopener noreferrer" style={s.itemSource}>
                        <Globe size={11} /> {article.source_url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                      </a>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '24px' },

  pageIntro: {},
  pageTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 400, color: 'var(--text)', marginBottom: '6px' },
  pageDesc: { fontSize: '14px', fontWeight: 300, color: 'var(--text-3)' },

  statsBar: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const },
  statChip: { display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 14px' },
  statNum: { fontFamily: 'var(--font-fraunces), serif', fontSize: '20px', fontWeight: 400, lineHeight: 1 },
  statLbl: { fontSize: '12px', color: 'var(--text-3)' },
  addBtn: { marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, background: 'var(--yellow)', color: 'var(--green-deep)', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' as const },

  formWrap: { padding: '24px', borderRadius: '16px' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  formTitle: { fontSize: '13px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase' as const, letterSpacing: '0.6px', marginBottom: '4px' },
  group: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: 500, color: 'var(--text-2)' },
  opt: { fontWeight: 300, color: 'var(--text-muted)' },
  input: { background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: 'var(--text)', fontFamily: 'var(--font-outfit), sans-serif', outline: 'none', width: '100%' },
  publishRow: { display: 'flex', alignItems: 'center' },
  publishLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 400, color: 'var(--text-2)', cursor: 'pointer' },
  formActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' },
  cancelBtn: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, background: 'rgba(255,255,255,0.06)', color: 'var(--text-3)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer' },
  submitBtn: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: 'var(--yellow)', color: 'var(--green-deep)', border: 'none', cursor: 'pointer' },

  filterRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' as const },
  filterBtn: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 500, color: 'var(--text-3)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', transition: 'all 0.15s' },

  empty: { padding: '40px 24px', textAlign: 'center' as const, fontSize: '14px', color: 'var(--text-muted)', borderRadius: '16px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },

  item: { padding: '20px 22px', borderRadius: '16px' },
  itemHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' as const },
  itemMeta: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const },
  catBadge: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' as const, padding: '3px 8px', borderRadius: '100px', border: '1px solid' },
  statusBadge: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' as const, padding: '3px 8px', borderRadius: '100px', border: '1px solid' },
  statusPublished: { color: '#34d399', background: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.25)' },
  statusDraft: { color: '#94a3b8', background: 'rgba(148,163,184,0.1)', borderColor: 'rgba(148,163,184,0.2)' },
  dateText: { fontSize: '11px', color: 'var(--text-muted)', fontWeight: 300 },

  itemActions: { display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 },
  iconBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' },

  itemTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '16px', fontWeight: 400, color: 'var(--text)', margin: '0 0 8px', lineHeight: 1.4 },
  itemSummary: { fontSize: '13px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 10px' },
  itemSource: { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none' },
}
