'use client'

import { useState, useTransition } from 'react'
import {
  Users, Lightning, Warning, Lightbulb, CheckCircle,
  XCircle, Trash, Check, X, ArrowClockwise,
} from '@phosphor-icons/react'
import {
  confirmDriingMember, rejectDriingMember,
  validateReport, deleteReport, deleteSuggestion,
} from './actions'

// ── Types ──────────────────────────────────────────────────────────────────
interface PendingUser {
  id: string
  email: string
  full_name: string | null
  created_at: string
  driing_status: string
}

interface Report {
  id: string
  identifier: string
  identifier_type: string
  name: string | null
  incident_type: string
  description: string | null
  reporter_city: string | null
  reported_at: string
}

interface Suggestion {
  id: string
  type: 'formation' | 'partner'
  message: string
  user_email: string | null
  created_at: string
}

interface Stats {
  totalUsers: number
  driingMembers: number
  pendingDriing: number
  pendingReports: number
  suggestions: number
}

interface Member {
  id: string
  email: string
  full_name: string | null
  role: string
  driing_status: string
  created_at: string
}

interface AdminUIProps {
  pendingDriing: PendingUser[]
  reports: Report[]
  suggestions: Suggestion[]
  allMembers: Member[]
  stats: Stats
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ── Main component ─────────────────────────────────────────────────────────
export default function AdminUI({ pendingDriing, reports, suggestions, allMembers, stats }: AdminUIProps) {
  const [tab, setTab] = useState<'driing' | 'members' | 'reports' | 'suggestions'>('driing')
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ id: string; type: 'ok' | 'err'; msg: string } | null>(null)

  function notify(id: string, type: 'ok' | 'err', msg: string) {
    setFeedback({ id, type, msg })
    setTimeout(() => setFeedback(null), 3000)
  }

  function action<T>(
    id: string,
    fn: () => Promise<{ error?: string | null; success?: boolean }>,
    successMsg: string,
  ) {
    startTransition(async () => {
      const res = await fn()
      if (res?.error) notify(id, 'err', String(res.error))
      else notify(id, 'ok', successMsg)
    })
  }

  const filteredMembers = allMembers.filter(m =>
    !search ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    (m.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const tabs = [
    { key: 'driing',       label: 'Driing en attente', count: stats.pendingDriing  },
    { key: 'members',      label: 'Membres',            count: stats.totalUsers     },
    { key: 'reports',      label: 'Signalements',       count: stats.pendingReports },
    { key: 'suggestions',  label: 'Suggestions',        count: stats.suggestions    },
  ] as const

  return (
    <div style={s.wrap}>

      {/* ── Stats ── */}
      <div style={s.statsGrid}>
        <StatCard icon={<Users size={20} />}    label="Utilisateurs"    value={stats.totalUsers}    color="#6b7280" />
        <StatCard icon={<Lightning size={20} />} label="Membres Driing"  value={stats.driingMembers} color="#FFD56B" />
        <StatCard icon={<Warning size={20} />}   label="Driing en attente" value={stats.pendingDriing}  color="#fb923c" alert={stats.pendingDriing > 0} />
        <StatCard icon={<Warning size={20} />}   label="Signalements"    value={stats.pendingReports} color="#f87171" alert={stats.pendingReports > 0} />
      </div>

      {/* ── Tabs ── */}
      <div style={s.tabBar}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{ ...s.tab, ...(tab === t.key ? s.tabActive : {}) }}
          >
            {t.label}
            {t.count > 0 && (
              <span style={{ ...s.tabBadge, ...(tab === t.key ? s.tabBadgeActive : {}) }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Driing tab ── */}
      {tab === 'driing' && (
        <Section title="Demandes membres Driing" empty={pendingDriing.length === 0} emptyMsg="Aucune demande en attente.">
          {pendingDriing.map(u => (
            <Row key={u.id}>
              <Cell flex={2}>
                <div style={s.cellPrimary}>{u.full_name || '—'}</div>
                <div style={s.cellSub}>{u.email}</div>
              </Cell>
              <Cell>
                <div style={s.cellSub}>Inscrit le {formatDate(u.created_at)}</div>
              </Cell>
              <Cell>
                <span style={{ ...s.badge, background: 'rgba(251,146,60,.12)', color: '#fb923c' }}>
                  En attente
                </span>
              </Cell>
              <Cell align="right">
                <div style={s.actions}>
                  {feedback?.id === u.id ? (
                    <FeedbackPill type={feedback.type} msg={feedback.msg} />
                  ) : (
                    <>
                      <ActionBtn
                        label="Confirmer"
                        icon={<Check size={13} weight="bold" />}
                        color="#34D399"
                        loading={isPending}
                        onClick={() => action(u.id, () => confirmDriingMember(u.id), 'Membre Driing confirmé')}
                      />
                      <ActionBtn
                        label="Rejeter"
                        icon={<X size={13} weight="bold" />}
                        color="#f87171"
                        loading={isPending}
                        onClick={() => action(u.id, () => rejectDriingMember(u.id), 'Demande rejetée')}
                      />
                    </>
                  )}
                </div>
              </Cell>
            </Row>
          ))}
        </Section>
      )}

      {/* ── Members tab ── */}
      {tab === 'members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="search"
            placeholder="Rechercher par nom ou email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={s.searchInput}
          />
          <Section title={`${filteredMembers.length} utilisateur${filteredMembers.length > 1 ? 's' : ''}`} empty={filteredMembers.length === 0} emptyMsg="Aucun résultat.">
            {filteredMembers.map(m => (
              <Row key={m.id}>
                <Cell flex={2}>
                  <div style={s.cellPrimary}>{m.full_name || '—'}</div>
                  <div style={s.cellSub}>{m.email}</div>
                </Cell>
                <Cell>
                  <RoleBadge role={m.role} />
                </Cell>
                <Cell>
                  {m.driing_status !== 'none' && <DriingBadge status={m.driing_status} />}
                </Cell>
                <Cell>
                  <div style={s.cellSub}>Inscrit le {formatDate(m.created_at)}</div>
                </Cell>
              </Row>
            ))}
          </Section>
        </div>
      )}

      {/* ── Reports tab ── */}
      {tab === 'reports' && (
        <Section title="Signalements à valider" empty={reports.length === 0} emptyMsg="Aucun signalement en attente.">
          {reports.map(r => (
            <Row key={r.id}>
              <Cell flex={2}>
                <div style={s.cellPrimary}>{r.name || r.identifier}</div>
                <div style={s.cellSub}>{r.identifier_type} · {r.identifier}</div>
              </Cell>
              <Cell>
                <span style={{ ...s.badge, background: 'rgba(248,113,113,.1)', color: '#f87171' }}>
                  {r.incident_type}
                </span>
              </Cell>
              <Cell>
                <div style={s.cellSub}>{r.reporter_city || '—'}</div>
                <div style={s.cellSub}>{formatDate(r.reported_at)}</div>
              </Cell>
              {r.description && (
                <Cell flex={2}>
                  <div style={s.description}>{r.description}</div>
                </Cell>
              )}
              <Cell align="right">
                <div style={s.actions}>
                  {feedback?.id === r.id ? (
                    <FeedbackPill type={feedback.type} msg={feedback.msg} />
                  ) : (
                    <>
                      <ActionBtn
                        label="Valider"
                        icon={<CheckCircle size={13} weight="bold" />}
                        color="#34D399"
                        loading={isPending}
                        onClick={() => action(r.id, () => validateReport(r.id), 'Signalement validé')}
                      />
                      <ActionBtn
                        label="Supprimer"
                        icon={<Trash size={13} weight="bold" />}
                        color="#f87171"
                        loading={isPending}
                        onClick={() => action(r.id, () => deleteReport(r.id), 'Signalement supprimé')}
                      />
                    </>
                  )}
                </div>
              </Cell>
            </Row>
          ))}
        </Section>
      )}

      {/* ── Suggestions tab ── */}
      {tab === 'suggestions' && (
        <Section title="Suggestions utilisateurs" empty={suggestions.length === 0} emptyMsg="Aucune suggestion.">
          {suggestions.map(sg => (
            <Row key={sg.id}>
              <Cell>
                <span style={{
                  ...s.badge,
                  ...(sg.type === 'formation'
                    ? { background: 'rgba(255,213,107,.1)', color: '#FFD56B' }
                    : { background: 'rgba(147,197,253,.1)', color: '#93C5FD' }),
                }}>
                  {sg.type === 'formation' ? 'Formation' : 'Partenaire'}
                </span>
              </Cell>
              <Cell flex={3}>
                <div style={s.cellPrimary}>{sg.message}</div>
                <div style={s.cellSub}>{sg.user_email || '—'} · {formatDate(sg.created_at)}</div>
              </Cell>
              <Cell align="right">
                {feedback?.id === sg.id ? (
                  <FeedbackPill type={feedback.type} msg={feedback.msg} />
                ) : (
                  <ActionBtn
                    label="Supprimer"
                    icon={<Trash size={13} weight="bold" />}
                    color="#f87171"
                    loading={isPending}
                    onClick={() => action(sg.id, () => deleteSuggestion(sg.id), 'Suggestion supprimée')}
                  />
                )}
              </Cell>
            </Row>
          ))}
        </Section>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, alert }: {
  icon: React.ReactNode; label: string; value: number; color: string; alert?: boolean
}) {
  return (
    <div style={{
      ...s.statCard,
      ...(alert ? { borderColor: `${color}33` } : {}),
    }}>
      <div style={{ ...s.statIcon, color, background: `${color}18` }}>{icon}</div>
      <div>
        <div style={{ ...s.statValue, ...(alert ? { color } : {}) }}>{value}</div>
        <div style={s.statLabel}>{label}</div>
      </div>
    </div>
  )
}

function Section({ title, children, empty, emptyMsg }: {
  title: string; children: React.ReactNode; empty: boolean; emptyMsg: string
}) {
  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>{title}</div>
      {empty ? (
        <div style={s.empty}>{emptyMsg}</div>
      ) : (
        <div style={s.table}>{children}</div>
      )}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={s.row}>{children}</div>
}

function Cell({ children, flex, align }: {
  children?: React.ReactNode; flex?: number; align?: 'right'
}) {
  return (
    <div style={{
      flex: flex ?? 1,
      minWidth: 0,
      textAlign: align,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}>
      {children}
    </div>
  )
}

function ActionBtn({ label, icon, color, loading, onClick }: {
  label: string; icon: React.ReactNode; color: string; loading: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '6px 12px', borderRadius: '7px',
        fontSize: '12px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
        background: `${color}14`, color, border: `1px solid ${color}30`,
        opacity: loading ? 0.5 : 1, transition: 'all 0.15s',
      }}
    >
      {loading ? <ArrowClockwise size={12} style={{ animation: 'spin 1s linear infinite' }} /> : icon}
      {label}
    </button>
  )
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    admin:  { label: 'Admin',       bg: 'rgba(192,132,252,.12)', color: '#C084FC' },
    driing: { label: 'Driing',      bg: 'rgba(255,213,107,.12)', color: '#FFD56B' },
    user:   { label: 'Utilisateur', bg: 'rgba(255,255,255,.06)', color: 'rgba(240,244,255,.4)' },
  }
  const { label, bg, color } = map[role] ?? map.user
  return <span style={{ ...s.badge, background: bg, color }}>{label}</span>
}

function DriingBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    pending:   { label: 'En attente',  bg: 'rgba(251,146,60,.12)', color: '#fb923c' },
    confirmed: { label: 'Confirmé',    bg: 'rgba(52,211,153,.12)', color: '#34D399' },
  }
  const cfg = map[status]
  if (!cfg) return null
  return <span style={{ ...s.badge, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
}

function FeedbackPill({ type, msg }: { type: 'ok' | 'err'; msg: string }) {
  const color = type === 'ok' ? '#34D399' : '#f87171'
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '6px 12px', borderRadius: '7px',
      fontSize: '12px', fontWeight: 500, color,
      background: `${color}14`, border: `1px solid ${color}30`,
    }}>
      {type === 'ok' ? <CheckCircle size={13} weight="fill" /> : <XCircle size={13} weight="fill" />}
      {msg}
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '24px' },

  // Stats
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px' },
  statCard: {
    display: 'flex', alignItems: 'center', gap: '14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px', padding: '18px 20px',
  },
  statIcon: {
    width: '40px', height: '40px', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  statValue: {
    fontFamily: 'Fraunces, serif', fontSize: '26px', fontWeight: 400,
    color: '#f0f4ff', lineHeight: 1.1, letterSpacing: '-0.5px',
  },
  statLabel: { fontSize: '12px', color: 'rgba(240,244,255,0.4)', marginTop: '3px' },

  // Tabs
  tabBar: {
    display: 'flex', gap: '4px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '12px', padding: '4px',
  },
  tab: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '9px 18px', borderRadius: '9px',
    fontSize: '13px', fontWeight: 500,
    color: 'rgba(240,244,255,0.45)',
    background: 'none', border: 'none', cursor: 'pointer',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: 'rgba(255,255,255,0.07)',
    color: '#f0f4ff',
  },
  tabBadge: {
    fontSize: '11px', fontWeight: 700,
    background: 'rgba(255,255,255,0.08)',
    color: 'rgba(240,244,255,0.4)',
    padding: '1px 7px', borderRadius: '100px',
  },
  tabBadgeActive: {
    background: 'rgba(255,213,107,0.15)',
    color: '#FFD56B',
  },

  // Section
  section: { display: 'flex', flexDirection: 'column', gap: '0' },
  sectionTitle: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px',
    textTransform: 'uppercase', color: 'rgba(240,244,255,0.3)',
    padding: '0 0 12px',
  },
  table: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '14px', overflow: 'hidden',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: '16px',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    flexWrap: 'wrap',
  },
  empty: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '14px',
    padding: '40px', textAlign: 'center',
    fontSize: '14px', color: 'rgba(240,244,255,0.3)',
  },

  // Cell content
  cellPrimary: {
    fontSize: '14px', fontWeight: 500, color: '#f0f4ff',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  cellSub: {
    fontSize: '12px', color: 'rgba(240,244,255,0.4)', marginTop: '2px',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  description: {
    fontSize: '13px', color: 'rgba(240,244,255,0.55)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  badge: {
    display: 'inline-block', fontSize: '11px', fontWeight: 600,
    padding: '3px 9px', borderRadius: '100px',
    letterSpacing: '0.3px', whiteSpace: 'nowrap',
  },
  actions: { display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' },
  searchInput: {
    width: '100%', maxWidth: '360px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', padding: '10px 16px',
    fontSize: '14px', color: '#f0f4ff',
    outline: 'none',
  },
}
