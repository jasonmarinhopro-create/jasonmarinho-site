'use client'

import { useState, useTransition, useMemo } from 'react'
import { Eye, EyeSlash, Trash, GraduationCap, Users, ArrowCounterClockwise, MagnifyingGlass } from '@phosphor-icons/react'
import { toggleFormationPublished, deleteFormation, republishAllFormations } from './actions'

interface Formation {
  id: string
  title: string
  slug: string
  description: string
  level: string
  duration: string
  modules_count: number
  lessons_count: number
  is_published: boolean
  created_at: string
  enrolled_count?: number
}

const LEVEL_LABELS: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
}

const LEVEL_COLORS: Record<string, { bg: string; color: string }> = {
  debutant:     { bg: 'rgba(99,214,131,0.1)',  color: '#63D683' },
  intermediaire:{ bg: 'rgba(255,213,107,0.1)', color: 'var(--accent-text)' },
  avance:       { bg: 'rgba(239,68,68,0.1)',   color: '#f87171' },
}

type LevelFilter = 'all' | 'debutant' | 'intermediaire' | 'avance'
type StatusFilter = 'all' | 'published' | 'draft'

export default function FormationsAdmin({ formations: initialFormations }: { formations: Formation[] }) {
  const [formations, setFormations] = useState(initialFormations)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  function showFeedback(type: 'ok' | 'err', msg: string) {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const res = await toggleFormationPublished(id, !current)
      if (res.success) {
        setFormations(f => f.map(x => x.id === id ? { ...x, is_published: !current } : x))
        showFeedback('ok', !current ? 'Formation publiée ✓' : 'Formation passée en brouillon')
      } else {
        showFeedback('err', res.error ?? 'Erreur')
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Supprimer cette formation ? Cette action est irréversible.')) return
    startTransition(async () => {
      const res = await deleteFormation(id)
      if (res.success) {
        setFormations(f => f.filter(x => x.id !== id))
        showFeedback('ok', 'Formation supprimée')
      } else {
        showFeedback('err', res.error ?? 'Erreur')
      }
    })
  }

  function handleRepublishAll() {
    startTransition(async () => {
      const res = await republishAllFormations()
      if (res.success) {
        setFormations(f => f.map(x => ({ ...x, is_published: true })))
        showFeedback('ok', 'Toutes les formations ont été publiées ✓')
      } else {
        showFeedback('err', res.error ?? 'Erreur')
      }
    })
  }

  const published = formations.filter(f => f.is_published).length
  const drafts = formations.length - published

  const filtered = useMemo(() => {
    return formations.filter(f => {
      if (search && !f.title.toLowerCase().includes(search.toLowerCase())) return false
      if (levelFilter !== 'all' && f.level !== levelFilter) return false
      if (statusFilter === 'published' && !f.is_published) return false
      if (statusFilter === 'draft' && f.is_published) return false
      return true
    })
  }, [formations, search, levelFilter, statusFilter])

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 500, color: 'var(--text)', marginBottom: '12px' }}>
          Gestion des formations
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={styles.statChip}>
            <Eye size={13} />
            {published} publiée{published !== 1 ? 's' : ''}
          </span>
          <span style={{ ...styles.statChip, background: 'var(--surface)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
            <EyeSlash size={13} />
            {drafts} brouillon{drafts !== 1 ? 's' : ''}
          </span>
          {drafts > 0 && (
            <button
              onClick={handleRepublishAll}
              disabled={isPending}
              style={styles.republishBtn}
              title="Publier toutes les formations en brouillon"
            >
              <ArrowCounterClockwise size={13} />
              Tout republier
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersRow}>
        {/* Search */}
        <div style={styles.searchWrap}>
          <MagnifyingGlass size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Rechercher une formation…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* Level filter */}
        <div style={styles.filterGroup}>
          {(['all', 'debutant', 'intermediaire', 'avance'] as LevelFilter[]).map(v => (
            <button
              key={v}
              onClick={() => setLevelFilter(v)}
              style={{
                ...styles.filterBtn,
                ...(levelFilter === v ? styles.filterBtnActive : {}),
              }}
            >
              {v === 'all' ? 'Tous niveaux' : LEVEL_LABELS[v]}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div style={styles.filterGroup}>
          {([
            { v: 'all', label: 'Tous' },
            { v: 'published', label: 'Publiées' },
            { v: 'draft', label: 'Brouillons' },
          ] as { v: StatusFilter; label: string }[]).map(({ v, label }) => (
            <button
              key={v}
              onClick={() => setStatusFilter(v)}
              style={{
                ...styles.filterBtn,
                ...(statusFilter === v ? styles.filterBtnActive : {}),
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 14px', borderRadius: '10px', border: '1px solid',
          background: feedback.type === 'ok' ? 'rgba(99,214,131,0.12)' : 'rgba(239,68,68,0.12)',
          borderColor: feedback.type === 'ok' ? 'rgba(99,214,131,0.25)' : 'rgba(239,68,68,0.25)',
          color: feedback.type === 'ok' ? '#63D683' : '#f87171',
          fontSize: '13px', marginBottom: '16px',
        }}>
          {feedback.msg}
        </div>
      )}

      {/* Results count */}
      {(search || levelFilter !== 'all' || statusFilter !== 'all') && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''} sur {formations.length}
        </p>
      )}

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              {formations.length === 0
                ? 'Aucune formation en base de données.'
                : 'Aucune formation ne correspond aux filtres.'}
            </p>
          </div>
        )}
        {filtered.map(f => {
          const lvl = LEVEL_COLORS[f.level] ?? LEVEL_COLORS.debutant
          return (
            <div key={f.id} style={{ ...styles.card, opacity: f.is_published ? 1 : 0.65 }}>
              <div style={{ padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                {/* Icon */}
                <div style={{ ...styles.iconWrap, background: f.is_published ? 'rgba(99,214,131,0.1)' : 'var(--surface)' }}>
                  <GraduationCap size={18} color={f.is_published ? '#63D683' : 'var(--text-muted)'} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text)' }}>{f.title}</span>
                    <span style={{ ...styles.badge, background: lvl.bg, color: lvl.color }}>
                      {LEVEL_LABELS[f.level] ?? f.level}
                    </span>
                    {!f.is_published && (
                      <span style={{ ...styles.badge, background: 'var(--border)', color: 'var(--text-muted)' }}>
                        Brouillon
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '8px', lineHeight: 1.4 }}>
                    {f.description}
                  </p>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>{f.duration}</span>
                    <span>{f.modules_count} module{f.modules_count !== 1 ? 's' : ''}</span>
                    <span>{f.lessons_count} leçon{f.lessons_count !== 1 ? 's' : ''}</span>
                    {f.enrolled_count != null && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Users size={11} />
                        {f.enrolled_count} inscrit{f.enrolled_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleToggle(f.id, f.is_published)}
                    style={{ ...styles.actionBtn, color: f.is_published ? '#63D683' : 'var(--text-3)' }}
                    title={f.is_published ? 'Passer en brouillon' : 'Publier'}
                    disabled={isPending}
                  >
                    {f.is_published ? <Eye size={14} /> : <EyeSlash size={14} />}
                  </button>
                  <button
                    onClick={() => handleDelete(f.id)}
                    style={{ ...styles.actionBtn, color: 'rgba(239,68,68,0.6)' }}
                    title="Supprimer"
                    disabled={isPending}
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  statChip: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '4px 10px', borderRadius: '100px',
    background: 'rgba(99,214,131,0.1)', color: '#63D683',
    fontSize: '12px', fontWeight: 500,
  },
  republishBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '4px 12px', borderRadius: '100px',
    background: 'rgba(255,213,107,0.1)', color: 'var(--accent-text)',
    border: '1px solid rgba(255,213,107,0.2)',
    fontSize: '12px', fontWeight: 500, cursor: 'pointer',
  },
  filtersRow: {
    display: 'flex', flexWrap: 'wrap', gap: '10px',
    marginBottom: '16px', alignItems: 'center',
  },
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '9px', padding: '8px 12px',
    flex: '1', minWidth: '200px',
  },
  searchInput: {
    background: 'transparent', border: 'none', outline: 'none',
    color: 'var(--text)', fontSize: '13px', width: '100%',
  },
  filterGroup: {
    display: 'flex', gap: '4px', flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '6px 12px', borderRadius: '8px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-3)', fontSize: '12px', fontWeight: 400,
    cursor: 'pointer', transition: 'all 0.15s',
  },
  filterBtnActive: {
    background: 'rgba(255,213,107,0.12)', border: '1px solid rgba(255,213,107,0.25)',
    color: 'var(--accent-text)', fontWeight: 500,
  },
  card: {
    background: 'var(--surface)', border: '1px solid var(--surface-2)',
    borderRadius: '12px', overflow: 'hidden',
  },
  iconWrap: {
    width: '38px', height: '38px', flexShrink: 0, borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '100px',
  },
  actionBtn: {
    background: 'var(--border)', border: '1px solid var(--border)',
    borderRadius: '7px', width: '30px', height: '30px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
}
