'use client'

import { useState, useTransition } from 'react'
import {
  Robot, Trash, ArrowClockwise, CheckCircle, XCircle, MagnifyingGlass,
  GraduationCap, Lightning, Users,
} from '@phosphor-icons/react'
import { changeUserPlan, deleteUser } from '../actions'

// ── Types ──────────────────────────────────────────────────────────────────
interface Member {
  id: string
  email: string
  full_name: string | null
  role: string
  driing_status: string
  plan: string
  created_at: string
  user_formations: { count: number }[]
}

const PLANS = [
  { value: 'decouverte', label: 'Découverte',    color: 'rgba(240,244,255,0.45)', bg: 'rgba(255,255,255,0.06)' },
  { value: 'driing',     label: 'Membre Driing', color: '#FFD56B',                bg: 'rgba(255,213,107,0.10)' },
] as const

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function isBotLike(name: string | null, email: string): boolean {
  if (name && name.length > 8 && !name.includes(' ') && /[A-Z]/.test(name) && /[a-z]/.test(name)) return true
  const local = email.split('@')[0]
  const parts = local.split('.')
  if (parts.length >= 4 && parts.every(p => p.length <= 3)) return true
  return false
}

function getFormationsCount(member: Member): number {
  return member.user_formations?.[0]?.count ?? 0
}

// ── Main component ──────────────────────────────────────────────────────────
export default function MembresUI({ members }: { members: Member[] }) {
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState<string>('all')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ id: string; type: 'ok' | 'err'; msg: string } | null>(null)

  function notify(id: string, type: 'ok' | 'err', msg: string) {
    setFeedback({ id, type, msg })
    setTimeout(() => setFeedback(null), 3000)
  }

  function action(id: string, fn: () => Promise<{ error?: string | null }>, successMsg: string) {
    startTransition(async () => {
      const res = await fn()
      if (res?.error) notify(id, 'err', String(res.error))
      else notify(id, 'ok', successMsg)
    })
  }

  const filtered = members.filter(m => {
    const matchSearch = !search ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.full_name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchPlan = filterPlan === 'all' || m.plan === filterPlan
    return matchSearch && matchPlan
  })

  const totalBots = members.filter(m => isBotLike(m.full_name, m.email)).length
  const totalDriing = members.filter(m => m.plan === 'driing').length

  return (
    <div style={s.wrap}>

      {/* ── Stats ── */}
      <div style={s.statsRow}>
        <div style={s.stat}>
          <Users size={18} style={{ color: 'rgba(240,244,255,0.4)' }} />
          <span style={s.statNum}>{members.length}</span>
          <span style={s.statLabel}>membres</span>
        </div>
        <div style={s.statDiv} />
        <div style={s.stat}>
          <Lightning size={18} style={{ color: '#FFD56B' }} />
          <span style={{ ...s.statNum, color: '#FFD56B' }}>{totalDriing}</span>
          <span style={s.statLabel}>Driing</span>
        </div>
        <div style={s.statDiv} />
        <div style={s.stat}>
          <Robot size={18} style={{ color: totalBots > 0 ? '#f87171' : 'rgba(240,244,255,0.25)' }} />
          <span style={{ ...s.statNum, color: totalBots > 0 ? '#f87171' : 'rgba(240,244,255,0.35)' }}>{totalBots}</span>
          <span style={s.statLabel}>bots suspects</span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={s.filtersRow}>
        <div style={s.searchWrap}>
          <MagnifyingGlass size={15} style={{ color: 'rgba(240,244,255,0.3)', flexShrink: 0 }} />
          <input
            type="search"
            placeholder="Nom ou email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={s.searchInput}
          />
        </div>
        <div style={s.filterBtns}>
          {[
            { value: 'all',       label: 'Tous' },
            { value: 'decouverte', label: 'Découverte' },
            { value: 'driing',     label: 'Membre Driing' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilterPlan(f.value)}
              style={{
                ...s.filterBtn,
                ...(filterPlan === f.value ? s.filterBtnActive : {}),
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span style={s.resultCount}>{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
      </div>

      {/* ── Table ── */}
      <div style={s.table}>
        {/* Header row */}
        <div style={s.tableHead}>
          <div style={{ flex: 3 }}>Membre</div>
          <div style={{ flex: 2 }}>Plan</div>
          <div style={{ flex: 1, textAlign: 'center' as const }}>Formations</div>
          <div style={{ flex: 2 }}>Inscrit le</div>
          <div style={{ flex: 1 }} />
        </div>

        {filtered.length === 0 ? (
          <div style={s.empty}>Aucun membre trouvé.</div>
        ) : (
          filtered.map(m => {
            const suspect = isBotLike(m.full_name, m.email)
            const formations = getFormationsCount(m)
            const planCfg = PLANS.find(p => p.value === (m.plan || 'decouverte')) ?? PLANS[0]
            const initials = m.full_name
              ? m.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
              : m.email[0].toUpperCase()

            return (
              <div key={m.id} style={{ ...s.row, ...(suspect ? s.rowSuspect : {}) }}>
                {/* Avatar + name + email */}
                <div style={{ flex: 3, display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{ ...s.avatar, ...(suspect ? { borderColor: 'rgba(248,113,113,0.3)' } : {}) }}>
                    <span style={s.avatarText}>{initials}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={s.name}>{m.full_name || '—'}</span>
                      {suspect && <Robot size={13} style={{ color: '#f87171', flexShrink: 0 }} title="Bot suspect" />}
                      {m.role === 'admin' && (
                        <span style={{ ...s.badge, background: 'rgba(192,132,252,0.12)', color: '#C084FC' }}>Admin</span>
                      )}
                    </div>
                    <div style={s.email}>{m.email}</div>
                  </div>
                </div>

                {/* Plan selector */}
                <div style={{ flex: 2 }}>
                  {feedback?.id === m.id && feedback.type === 'ok' ? (
                    <FeedbackPill type="ok" msg={feedback.msg} />
                  ) : feedback?.id === m.id && feedback.type === 'err' ? (
                    <FeedbackPill type="err" msg={feedback.msg} />
                  ) : (
                    <select
                      value={m.plan || 'decouverte'}
                      disabled={isPending || m.role === 'admin'}
                      onChange={e => action(m.id, () => changeUserPlan(m.id, e.target.value), 'Plan mis à jour')}
                      style={{
                        background: planCfg.bg,
                        color: planCfg.color,
                        border: `1px solid ${planCfg.color}30`,
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: (isPending || m.role === 'admin') ? 'not-allowed' : 'pointer',
                        outline: 'none',
                        fontFamily: 'Outfit, sans-serif',
                        opacity: m.role === 'admin' ? 0.4 : 1,
                      }}
                    >
                      {PLANS.map(p => (
                        <option key={p.value} value={p.value} style={{ background: '#040d0b', color: '#f0f4ff' }}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Formations count */}
                <div style={{ flex: 1, textAlign: 'center' as const }}>
                  {formations > 0 ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#34D399', fontSize: '13px', fontWeight: 500 }}>
                      <GraduationCap size={14} />
                      {formations}
                    </div>
                  ) : (
                    <span style={{ color: 'rgba(240,244,255,0.2)', fontSize: '13px' }}>—</span>
                  )}
                </div>

                {/* Date */}
                <div style={{ flex: 2, fontSize: '13px', color: 'rgba(240,244,255,0.35)' }}>
                  {formatDate(m.created_at)}
                </div>

                {/* Delete */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  {m.role !== 'admin' && (
                    <button
                      disabled={isPending}
                      onClick={() => {
                        if (!confirm(`Supprimer définitivement ${m.full_name || m.email} ?`)) return
                        action(m.id, () => deleteUser(m.id), 'Utilisateur supprimé')
                      }}
                      style={s.deleteBtn}
                      title="Supprimer"
                    >
                      {isPending
                        ? <ArrowClockwise size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        : <Trash size={14} />
                      }
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────
function FeedbackPill({ type, msg }: { type: 'ok' | 'err'; msg: string }) {
  const color = type === 'ok' ? '#34D399' : '#f87171'
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '5px 10px', borderRadius: '7px',
      fontSize: '12px', fontWeight: 500, color,
      background: `${color}14`, border: `1px solid ${color}30`,
    }}>
      {type === 'ok'
        ? <CheckCircle size={12} weight="fill" />
        : <XCircle size={12} weight="fill" />}
      {msg}
    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '20px' },

  statsRow: {
    display: 'flex', alignItems: 'center', gap: '24px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '14px', padding: '16px 24px',
  },
  stat: { display: 'flex', alignItems: 'center', gap: '8px' },
  statNum: { fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 400, color: '#f0f4ff' },
  statLabel: { fontSize: '12px', color: 'rgba(240,244,255,0.35)' },
  statDiv: { width: '1px', height: '28px', background: 'rgba(255,255,255,0.08)' },

  filtersRow: {
    display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
  },
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '10px', padding: '8px 14px',
    flex: '0 0 260px',
  },
  searchInput: {
    background: 'none', border: 'none', outline: 'none',
    fontSize: '13px', color: '#f0f4ff', width: '100%',
  },
  filterBtns: { display: 'flex', gap: '4px' },
  filterBtn: {
    padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
    background: 'none', border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(240,244,255,0.4)', cursor: 'pointer', transition: 'all 0.15s',
  },
  filterBtnActive: {
    background: 'rgba(255,213,107,0.08)',
    border: '1px solid rgba(255,213,107,0.2)',
    color: '#FFD56B',
  },
  resultCount: { fontSize: '12px', color: 'rgba(240,244,255,0.25)', marginLeft: 'auto' },

  table: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '14px', overflow: 'hidden',
  },
  tableHead: {
    display: 'flex', alignItems: 'center', gap: '16px',
    padding: '10px 20px',
    fontSize: '10px', fontWeight: 600, letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    color: 'rgba(240,244,255,0.25)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: '16px',
    padding: '14px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    transition: 'background 0.15s',
  },
  rowSuspect: {
    background: 'rgba(248,113,113,0.03)',
  },
  empty: {
    padding: '48px', textAlign: 'center' as const,
    fontSize: '14px', color: 'rgba(240,244,255,0.25)',
  },

  avatar: {
    width: '36px', height: '36px', flexShrink: 0,
    background: 'rgba(0,76,63,0.5)',
    border: '1px solid rgba(255,213,107,0.15)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Fraunces, serif', fontSize: '13px', fontWeight: 600, color: '#FFD56B',
  },
  name: {
    fontSize: '14px', fontWeight: 500, color: '#f0f4ff',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  email: {
    fontSize: '12px', color: 'rgba(240,244,255,0.35)', marginTop: '1px',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  badge: {
    fontSize: '10px', fontWeight: 600, padding: '2px 7px',
    borderRadius: '100px', whiteSpace: 'nowrap' as const, flexShrink: 0,
  },
  deleteBtn: {
    background: 'rgba(248,113,113,0.06)',
    border: '1px solid rgba(248,113,113,0.15)',
    borderRadius: '8px', padding: '7px',
    color: '#f87171', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
  },
}
