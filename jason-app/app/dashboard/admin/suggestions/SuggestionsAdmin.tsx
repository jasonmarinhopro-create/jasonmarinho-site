'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, MagnifyingGlass, Trash, X, Check, Funnel,
  Lightbulb, GraduationCap, Handshake, EnvelopeSimple,
} from '@phosphor-icons/react/dist/ssr'
import { deleteSuggestion } from '../actions'

interface Suggestion {
  id: string
  type: 'formation' | 'partenaire' | string
  message: string
  user_email: string | null
  user_id: string | null
  created_at: string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function SuggestionsAdmin({ initialSuggestions }: { initialSuggestions: Suggestion[] }) {
  const [items, setItems] = useState(initialSuggestions)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'formation' | 'partenaire'>('all')
  const [feedback, setFeedback] = useState<{ id: string; type: 'ok' | 'err'; msg: string } | null>(null)
  const [isPending, startT] = useTransition()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter(it => {
      if (filter !== 'all' && it.type !== filter) return false
      if (!q) return true
      return (
        (it.message ?? '').toLowerCase().includes(q) ||
        (it.user_email ?? '').toLowerCase().includes(q)
      )
    })
  }, [items, search, filter])

  const stats = useMemo(() => ({
    total: items.length,
    formations: items.filter(i => i.type === 'formation').length,
    partenaires: items.filter(i => i.type === 'partenaire').length,
    last7days: items.filter(i => Date.now() - new Date(i.created_at).getTime() < 7 * 24 * 3600 * 1000).length,
  }), [items])

  function notify(id: string, type: 'ok' | 'err', msg: string) {
    setFeedback({ id, type, msg })
    setTimeout(() => setFeedback(null), 2400)
  }

  function handleDelete(id: string) {
    if (!confirm('Supprimer cette suggestion ? Action irréversible.')) return
    const snapshot = items
    setItems(prev => prev.filter(it => it.id !== id))
    startT(async () => {
      const res = await deleteSuggestion(id)
      if (res?.error) {
        setItems(snapshot)
        notify(id, 'err', `Erreur : ${res.error}`)
      } else {
        notify(id, 'ok', 'Suggestion supprimée')
      }
    })
  }

  return (
    <div style={s.root}>
      <header style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const }}>
          <Link href="/dashboard/admin" style={s.backLink}>
            <ArrowLeft size={13} weight="bold" />
            Admin
          </Link>
          <h1 style={s.title}>Suggestions utilisateurs</h1>
        </div>
      </header>

      {/* KPIs */}
      <div style={s.kpiRow}>
        <Kpi label="Total" value={stats.total} color="var(--text)" icon={<Lightbulb size={16} weight="duotone" />} />
        <Kpi label="Formations" value={stats.formations} color="var(--accent-text)" icon={<GraduationCap size={16} weight="duotone" />} />
        <Kpi label="Partenaires" value={stats.partenaires} color="#93C5FD" icon={<Handshake size={16} weight="duotone" />} />
        <Kpi label="7 derniers jours" value={stats.last7days} color="var(--success-1)" icon={<Lightbulb size={16} weight="duotone" />}
          hint={stats.last7days > 0 ? `${stats.last7days} récent${stats.last7days > 1 ? 'es' : 'e'}` : 'rien de récent'}
        />
      </div>

      {/* Filtres + recherche */}
      <div style={s.toolbar}>
        <div style={s.filterRow}>
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="Toutes" count={stats.total} />
          <FilterChip active={filter === 'formation'} onClick={() => setFilter('formation')} label="Formations" count={stats.formations} color="var(--accent-text)" />
          <FilterChip active={filter === 'partenaire'} onClick={() => setFilter('partenaire')} label="Partenaires" count={stats.partenaires} color="#93C5FD" />
        </div>
        <div style={s.searchWrap}>
          <MagnifyingGlass size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Message, email…"
            style={s.searchInput}
          />
        </div>
      </div>

      {/* Liste */}
      <div style={s.list}>
        {filtered.length === 0 ? (
          <div style={s.empty}>
            <Funnel size={26} weight="duotone" style={{ color: 'var(--text-muted)' }} />
            <p style={{ margin: 0 }}>Aucune suggestion dans ce filtre.</p>
          </div>
        ) : filtered.map(it => {
          const fbItem = feedback?.id === it.id ? feedback : null
          const isFormation = it.type === 'formation'
          return (
            <div key={it.id} style={s.row}>
              <div style={s.rowHead}>
                <span style={{ ...s.typeTag, ...(isFormation ? s.typeFormation : s.typePartenaire) }}>
                  {isFormation ? <GraduationCap size={11} weight="fill" /> : <Handshake size={11} weight="fill" />}
                  {isFormation ? 'Formation' : 'Partenaire'}
                </span>
                <div style={s.metaCol}>
                  {it.user_email && (
                    <span style={s.metaItem}>
                      <EnvelopeSimple size={11} weight="fill" />
                      {it.user_email}
                    </span>
                  )}
                  <span style={s.metaDate}>{fmtDate(it.created_at)}</span>
                </div>
              </div>
              <p style={s.message}>{it.message}</p>
              <div style={s.rowActions}>
                {fbItem ? (
                  <span style={{ ...s.feedback, color: fbItem.type === 'ok' ? 'var(--success-1)' : '#f87171' }}>
                    {fbItem.type === 'ok' ? <Check size={13} weight="bold" /> : <X size={13} weight="bold" />}
                    {fbItem.msg}
                  </span>
                ) : (
                  <button onClick={() => handleDelete(it.id)} disabled={isPending} style={{ ...s.actionBtn, ...s.actionDelete }}>
                    <Trash size={13} weight="bold" /> Supprimer
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Kpi({ label, value, color, hint, icon }: { label: string; value: number; color: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div style={s.kpiCard}>
      <div style={s.kpiHead}>
        <span style={s.kpiLabel}>{label}</span>
        {icon && <span aria-hidden="true" style={{ color, opacity: 0.8 }}>{icon}</span>}
      </div>
      <div style={{ ...s.kpiValue, color }}>{value}</div>
      {hint && <div style={s.kpiHint}>{hint}</div>}
    </div>
  )
}

function FilterChip({ active, onClick, label, count, color }: { active: boolean; onClick: () => void; label: string; count: number; color?: string }) {
  return (
    <button onClick={onClick} style={{
      ...s.filterChip,
      ...(active ? s.filterChipActive : {}),
      ...(active && color ? { borderColor: color, color } : {}),
    }}>
      {label}
      <span style={s.filterChipCount}>{count}</span>
    </button>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: { width: '100%', padding: 'clamp(16px, 3vw, 44px)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' as const, gap: '12px' },
  backLink: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', textDecoration: 'none', fontSize: '12.5px', fontWeight: 500 },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 400, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' },

  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' },
  kpiCard: { padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' },
  kpiHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  kpiLabel: { fontSize: '11px', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' as const, color: 'var(--text-3)' },
  kpiValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: '26px', fontWeight: 400, lineHeight: 1 },
  kpiHint: { fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' },

  toolbar: { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' as const },
  filterRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' as const },
  filterChip: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  filterChipActive: { background: 'var(--accent-bg)', borderColor: 'var(--accent-text)', color: 'var(--accent-text)', fontWeight: 600 },
  filterChipCount: { fontSize: '10.5px', fontWeight: 700, padding: '1px 7px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)' },

  searchWrap: { position: 'relative', flex: '1 1 240px', maxWidth: '400px' },
  searchInput: { width: '100%', padding: '8px 12px 8px 34px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', outline: 'none' },

  list: { display: 'flex', flexDirection: 'column' as const, gap: '10px' },
  empty: { padding: '40px 20px', textAlign: 'center' as const, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' },

  row: { display: 'flex', flexDirection: 'column' as const, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', gap: '8px' },
  rowHead: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' as const, justifyContent: 'space-between' },
  typeTag: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '999px', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase' as const, border: '1px solid' },
  typeFormation: { background: 'var(--accent-bg)', color: 'var(--accent-text)', borderColor: 'var(--accent-border)' },
  typePartenaire: { background: 'rgba(147,197,253,.10)', color: '#93C5FD', borderColor: 'rgba(147,197,253,.22)' },
  metaCol: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const, marginLeft: 'auto' },
  metaItem: { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--text-2)' },
  metaDate: { fontSize: '11.5px', color: 'var(--text-3)' },
  message: { fontSize: '13.5px', color: 'var(--text)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' as const, wordBreak: 'break-word' as const },

  rowActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
  actionBtn: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', border: '1px solid', fontFamily: 'inherit' },
  actionDelete: { background: 'transparent', borderColor: 'rgba(248,113,113,0.4)', color: '#f87171' },

  feedback: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, background: 'var(--bg-2)', border: '1px solid var(--border)' },
}
