'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Robot, Trash, ArrowClockwise, CheckCircle, XCircle, MagnifyingGlass,
  GraduationCap, Lightning, Users, X,
  House, BookmarkSimple, PencilSimple, Flag, Lightbulb,
  CalendarBlank, SpinnerGap, UsersFour, ArrowSquareOut,
} from '@phosphor-icons/react'
import { changeUserPlan, deleteUser, deleteAllBots, getMemberDetails } from '../actions'

// ── Types ──────────────────────────────────────────────────────────────────
interface UserFormation {
  id: string
  progress: number
  enrolled_at: string
  formation: { id: string; title: string; slug: string } | null
}

interface Member {
  id: string
  email: string
  full_name: string | null
  role: string
  driing_status: string
  plan: string
  created_at: string
  user_formations: UserFormation[]
}

interface MemberDetails {
  voyageurs: number
  favorites: number
  customizations: number
  signalements: number
  suggestions: number
  sejours: number
}

const PLANS = [
  { value: 'decouverte', label: 'Découverte',    color: 'var(--text-3)', bg: 'var(--border)' },
  { value: 'driing',     label: 'Membre Driing', color: 'var(--accent-text)', bg: 'rgba(255,213,107,0.10)' },
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

// ── Main component ──────────────────────────────────────────────────────────
export default function MembresUI({ members }: { members: Member[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState<string>('all')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ id: string; type: 'ok' | 'err'; msg: string } | null>(null)
  const [botsFeedback, setBotsFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  // Member detail panel
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  // Close panel on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelectedMember(null)
    }
    if (selectedMember) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selectedMember])

  async function openPanel(member: Member) {
    setSelectedMember(member)
    setMemberDetails(null)
    setDetailsLoading(true)
    const result = await getMemberDetails(member.id)
    if (!('error' in result)) setMemberDetails(result as MemberDetails)
    setDetailsLoading(false)
  }

  function notify(id: string, type: 'ok' | 'err', msg: string) {
    setFeedback({ id, type, msg })
    setTimeout(() => setFeedback(null), 3000)
  }

  function handleDeleteAllBots() {
    if (!confirm(`Supprimer définitivement ${totalBots} bot(s) suspect(s) ?`)) return
    startTransition(async () => {
      const res = await deleteAllBots()
      if (res?.error) {
        setBotsFeedback({ type: 'err', msg: String(res.error) })
      } else {
        setBotsFeedback({ type: 'ok', msg: `${(res as { deleted: number }).deleted} bot(s) supprimé(s)` })
      }
      setTimeout(() => setBotsFeedback(null), 3000)
    })
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
          <Users size={18} style={{ color: 'var(--text-3)' }} />
          <span style={s.statNum}>{members.length}</span>
          <span style={s.statLabel}>membres</span>
        </div>
        <div style={s.statDiv} />
        <div style={s.stat}>
          <Lightning size={18} style={{ color: 'var(--accent-text)' }} />
          <span style={{ ...s.statNum, color: 'var(--accent-text)' }}>{totalDriing}</span>
          <span style={s.statLabel}>Driing</span>
        </div>
        <div style={s.statDiv} />
        <div style={s.stat}>
          <Robot size={18} style={{ color: totalBots > 0 ? '#f87171' : 'var(--text-muted)' }} />
          <span style={{ ...s.statNum, color: totalBots > 0 ? '#f87171' : 'var(--text-3)' }}>{totalBots}</span>
          <span style={s.statLabel}>bots suspects</span>
          {totalBots > 0 && (
            botsFeedback ? (
              <FeedbackPill type={botsFeedback.type} msg={botsFeedback.msg} />
            ) : (
              <button
                disabled={isPending}
                onClick={handleDeleteAllBots}
                style={s.deleteAllBotsBtn}
                title="Supprimer tous les bots suspects"
              >
                {isPending
                  ? <ArrowClockwise size={12} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Trash size={12} />
                }
                Delete AllBots
              </button>
            )
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={s.filtersRow}>
        <div style={s.searchWrap}>
          <MagnifyingGlass size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
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
            { value: 'all',        label: 'Tous' },
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
        <div style={s.tableHead} className="mem-table-head">
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
            const formations = m.user_formations?.length ?? 0
            const planCfg = PLANS.find(p => p.value === (m.plan || 'decouverte')) ?? PLANS[0]
            const initials = m.full_name
              ? m.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
              : m.email[0].toUpperCase()

            return (
              <div key={m.id} className={`mem-row${suspect ? ' mem-row-suspect' : ''}`}>

                {/* Avatar + nom — cliquable pour ouvrir le profil */}
                <div
                  className="mem-c-main"
                  onClick={() => openPanel(m)}
                  style={{ cursor: 'pointer' }}
                  title="Voir le profil"
                >
                  <div style={{ ...s.avatar, ...(suspect ? { borderColor: 'rgba(248,113,113,0.3)' } : {}) }}>
                    <span style={s.avatarText}>{initials}</span>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={s.name}>{m.full_name || m.email.split('@')[0]}</span>
                      {suspect && <Robot size={13} style={{ color: '#f87171', flexShrink: 0 }} />}
                      {m.role === 'admin' && (
                        <span style={{ ...s.badge, background: 'rgba(192,132,252,0.12)', color: '#C084FC' }}>Admin</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Plan selector */}
                <div className="mem-c-plan">
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
                        background: planCfg.bg, color: planCfg.color,
                        border: `1px solid ${planCfg.color}30`,
                        borderRadius: '8px', padding: '6px 10px',
                        fontSize: '12px', fontWeight: 600,
                        cursor: (isPending || m.role === 'admin') ? 'not-allowed' : 'pointer',
                        outline: 'none', fontFamily: 'Outfit, sans-serif',
                        opacity: m.role === 'admin' ? 0.4 : 1,
                      }}
                    >
                      {PLANS.map(p => (
                        <option key={p.value} value={p.value} style={{ background: '#040d0b', color: 'var(--text)' }}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Formations count badge */}
                <div className="mem-c-form">
                  {formations > 0 ? (
                    <button
                      onClick={() => openPanel(m)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        color: '#34D399', fontSize: '13px', fontWeight: 500,
                        background: 'rgba(52,211,153,0.06)',
                        border: '1px solid rgba(52,211,153,0.2)',
                        borderRadius: '7px', padding: '4px 10px', cursor: 'pointer',
                      }}
                      title="Voir le profil"
                    >
                      <GraduationCap size={13} />
                      {formations}
                    </button>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
                  )}
                </div>

                {/* Date */}
                <div className="mem-c-date">{formatDate(m.created_at)}</div>

                {/* Delete */}
                <div className="mem-c-del">
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

      {/* ── Member Detail Panel ── */}
      <MemberDetailPanel
        member={selectedMember}
        details={memberDetails}
        loading={detailsLoading}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  )
}

// ── Member Detail Panel ──────────────────────────────────────────────────────
interface MemberDetailPanelProps {
  member: Member | null
  details: MemberDetails | null
  loading: boolean
  onClose: () => void
}

function MemberDetailPanel({ member, details, loading, onClose }: MemberDetailPanelProps) {
  const open = !!member

  const planDisplay: Record<string, { label: string; color: string; bg: string }> = {
    driing:     { label: 'Membre Driing', color: '#FFD56B', bg: 'rgba(255,213,107,0.12)' },
    decouverte: { label: 'Découverte',    color: 'var(--text-3)', bg: 'var(--border)' },
  }
  const planCfg = planDisplay[member?.plan ?? 'decouverte'] ?? planDisplay.decouverte

  const initials = member?.full_name
    ? member.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : member?.email?.[0]?.toUpperCase() ?? '?'

  const statTiles = details ? [
    { icon: <UsersFour size={15} />, value: details.voyageurs,      label: 'Voyageurs',          color: '#93C5FD' },
    { icon: <CalendarBlank size={15} />, value: details.sejours,    label: 'Séjours',             color: '#34D399' },
    { icon: <BookmarkSimple size={15} />, value: details.favorites, label: 'Gabarits favoris',    color: '#FFD56B' },
    { icon: <PencilSimple size={15} />, value: details.customizations, label: 'Gabarits perso.',  color: '#C084FC' },
    { icon: <Flag size={15} />, value: details.signalements,        label: 'Signalements',        color: '#f87171' },
    { icon: <Lightbulb size={15} />, value: details.suggestions,    label: 'Suggestions',         color: '#FB923C' },
  ] : []

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(2px)',
          zIndex: 150,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Profil du membre"
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: 'min(400px, 94vw)',
          background: 'var(--bg-2)',
          borderLeft: '1px solid var(--border-2)',
          boxShadow: '-24px 0 64px rgba(0,0,0,0.4)',
          zIndex: 160,
          display: 'flex',
          flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32,0,0.15,1)',
          overflowY: 'hidden',
        }}
      >
        {/* Header */}
        <div style={ps.header}>
          <div style={ps.headerRow}>
            <span style={ps.headerTitle}>Profil membre</span>
            <button onClick={onClose} style={ps.closeBtn} aria-label="Fermer">
              <X size={18} weight="bold" />
            </button>
          </div>
          {member && (
            <a
              href={`/dashboard/admin/membres/${member.id}`}
              style={ps.viewFullBtn}
              title="Ouvrir la fiche complète"
            >
              <ArrowSquareOut size={13} />
              Voir la fiche complète
            </a>
          )}
        </div>

        {/* Divider */}
        <div style={ps.divider} />

        {/* Scrollable content */}
        <div style={ps.body}>
          {member && (
            <>
              {/* Member identity */}
              <div style={ps.identityBlock}>
                <div style={ps.bigAvatar}>
                  <span style={ps.bigAvatarText}>{initials}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={ps.memberName}>{member.full_name || '—'}</div>
                  <div style={ps.memberEmail}>{member.email}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <span style={{ ...ps.planPill, background: planCfg.bg, color: planCfg.color }}>
                      {planCfg.label}
                    </span>
                    {member.role === 'admin' && (
                      <span style={{ ...ps.planPill, background: 'rgba(192,132,252,0.12)', color: '#C084FC' }}>Admin</span>
                    )}
                  </div>
                  <div style={ps.memberSince}>
                    Membre depuis le {formatDate(member.created_at)}
                  </div>
                </div>
              </div>

              <div style={ps.divider} />

              {/* Activity stats */}
              <div style={ps.section}>
                <div style={ps.sectionLabel}>Activité sur la plateforme</div>

                {loading ? (
                  <div style={ps.loadingWrap}>
                    <SpinnerGap size={20} style={{ color: 'var(--accent-text)', animation: 'spin 0.8s linear infinite' }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>Chargement…</span>
                  </div>
                ) : details ? (
                  <div style={ps.statsGrid}>
                    {statTiles.map(tile => (
                      <div key={tile.label} style={{ ...ps.statTile, borderColor: `${tile.color}25`, background: `${tile.color}08` }}>
                        <span style={{ color: tile.color, lineHeight: 1 }}>{tile.icon}</span>
                        <span style={{ ...ps.statTileNum, color: tile.value > 0 ? 'var(--text)' : 'var(--text-muted)' }}>
                          {tile.value}
                        </span>
                        <span style={ps.statTileLabel}>{tile.label}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '12px 0' }}>
                    Impossible de charger les données.
                  </div>
                )}
              </div>

              {/* Formations */}
              {member.user_formations?.length > 0 && (
                <>
                  <div style={ps.divider} />
                  <div style={ps.section}>
                    <div style={ps.sectionLabel}>Formations ({member.user_formations.length})</div>
                    <div style={ps.formationsList}>
                      {member.user_formations.map(uf => (
                        <div key={uf.id} style={ps.formationItem}>
                          <GraduationCap size={14} style={{ color: '#34D399', flexShrink: 0, marginTop: '2px' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={ps.formationTitle}>{uf.formation?.title ?? 'Formation inconnue'}</div>
                            <div style={ps.formationMeta}>
                              Inscrit le {formatDate(uf.enrolled_at)}
                              {uf.progress === 100 && (
                                <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: 600,
                                  color: '#34D399', background: 'rgba(52,211,153,0.12)',
                                  padding: '2px 6px', borderRadius: '100px' }}>
                                  Terminée
                                </span>
                              )}
                            </div>
                            <div style={ps.progressWrap}>
                              <div style={ps.progressBar}>
                                <div style={{
                                  height: '100%', borderRadius: '100px',
                                  width: `${uf.progress}%`,
                                  background: uf.progress === 100 ? '#34D399' : 'var(--accent-text)',
                                  transition: 'width 0.3s',
                                }} />
                              </div>
                              <span style={ps.progressPct}>{uf.progress}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* No formations */}
              {member.user_formations?.length === 0 && (
                <>
                  <div style={ps.divider} />
                  <div style={{ ...ps.section, padding: '20px 24px' }}>
                    <div style={ps.sectionLabel}>Formations</div>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      Aucune formation commencée.
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
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
    display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap',
    background: 'var(--surface)',
    border: '1px solid var(--surface-2)',
    borderRadius: '14px', padding: '16px 24px',
  },
  stat: { display: 'flex', alignItems: 'center', gap: '8px' },
  statNum: { fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 400, color: 'var(--text)' },
  statLabel: { fontSize: '12px', color: 'var(--text-3)' },
  statDiv: { width: '1px', height: '28px', background: 'var(--border)' },

  filtersRow: {
    display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
  },
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px', padding: '8px 14px',
    flex: '1 1 180px', minWidth: 0,
  },
  searchInput: {
    background: 'none', border: 'none', outline: 'none',
    fontSize: '13px', color: 'var(--text)', width: '100%',
  },
  filterBtns: { display: 'flex', gap: '4px' },
  filterBtn: {
    padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
    background: 'none', border: '1px solid var(--border)',
    color: 'var(--text-3)', cursor: 'pointer', transition: 'all 0.15s',
  },
  filterBtnActive: {
    background: 'rgba(255,213,107,0.08)',
    border: '1px solid rgba(255,213,107,0.2)',
    color: 'var(--accent-text)',
  },
  resultCount: { fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' },

  table: {
    background: 'var(--surface)',
    border: '1px solid var(--surface-2)',
    borderRadius: '14px', overflow: 'hidden',
  },
  tableHead: {
    display: 'flex', alignItems: 'center', gap: '16px',
    padding: '10px 20px',
    fontSize: '10px', fontWeight: 600, letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    color: 'var(--text-muted)',
    borderBottom: '1px solid var(--border)',
  },
  empty: {
    padding: '48px', textAlign: 'center' as const,
    fontSize: '14px', color: 'var(--text-muted)',
  },

  avatar: {
    width: '36px', height: '36px', flexShrink: 0,
    background: 'rgba(0,76,63,0.5)',
    border: '1px solid rgba(255,213,107,0.15)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Fraunces, serif', fontSize: '13px', fontWeight: 600, color: 'var(--accent-text)',
  },
  name: {
    fontSize: '14px', fontWeight: 500, color: 'var(--text)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  email: {
    fontSize: '12px', color: 'var(--text-3)', marginTop: '1px',
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
  deleteAllBotsBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    background: 'rgba(248,113,113,0.08)',
    border: '1px solid rgba(248,113,113,0.25)',
    borderRadius: '8px', padding: '5px 10px',
    color: '#f87171', cursor: 'pointer',
    fontSize: '11px', fontWeight: 600,
    fontFamily: 'Outfit, sans-serif',
    transition: 'all 0.15s', marginLeft: '8px',
  },
}

// Panel-specific styles
const ps: Record<string, React.CSSProperties> = {
  header: { padding: '20px 24px 18px', flexShrink: 0 },
  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' },
  headerTitle: {
    fontFamily: 'Fraunces, serif', fontSize: '18px',
    fontWeight: 400, color: 'var(--text)', letterSpacing: '-0.3px',
  },
  closeBtn: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '8px', width: '32px', height: '32px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-3)',
  },
  viewFullBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'rgba(255,213,107,0.08)', border: '1px solid rgba(255,213,107,0.2)',
    borderRadius: '8px', padding: '7px 12px',
    fontSize: '12px', fontWeight: 600, color: 'var(--accent-text)',
    textDecoration: 'none', cursor: 'pointer',
    transition: 'all 0.15s', width: '100%', justifyContent: 'center' as const,
    boxSizing: 'border-box' as const,
  },
  divider: { height: '1px', background: 'var(--border)', flexShrink: 0 },
  body: {
    flex: 1, overflowY: 'auto',
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--border) transparent',
  } as React.CSSProperties,

  identityBlock: {
    padding: '20px 24px',
    display: 'flex', alignItems: 'flex-start', gap: '14px',
  },
  bigAvatar: {
    width: '52px', height: '52px', flexShrink: 0,
    background: 'rgba(0,76,63,0.5)',
    border: '1.5px solid rgba(255,213,107,0.25)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  bigAvatarText: {
    fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 600, color: 'var(--accent-text)',
  },
  memberName: {
    fontSize: '16px', fontWeight: 600, color: 'var(--text)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  memberEmail: {
    fontSize: '12px', color: 'var(--text-3)', marginTop: '2px',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  memberSince: {
    fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic',
  },
  planPill: {
    fontSize: '11px', fontWeight: 600,
    padding: '3px 9px', borderRadius: '100px',
  },

  section: { padding: '18px 24px' },
  sectionLabel: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    color: 'var(--text-muted)', marginBottom: '14px',
  },

  loadingWrap: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '16px 0',
  },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px',
  },
  statTile: {
    display: 'flex', flexDirection: 'column', gap: '4px',
    padding: '12px',
    border: '1px solid',
    borderRadius: '10px',
  },
  statTileNum: {
    fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 400, lineHeight: 1,
  },
  statTileLabel: {
    fontSize: '10px', color: 'var(--text-3)', lineHeight: '1.3',
  },

  formationsList: { display: 'flex', flexDirection: 'column', gap: '14px' },
  formationItem: { display: 'flex', alignItems: 'flex-start', gap: '10px' },
  formationTitle: {
    fontSize: '13px', fontWeight: 500, color: 'var(--text)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
    marginBottom: '2px',
  },
  formationMeta: {
    fontSize: '11px', color: 'var(--text-3)',
    display: 'flex', alignItems: 'center', marginBottom: '6px',
  },
  progressWrap: { display: 'flex', alignItems: 'center', gap: '8px' },
  progressBar: {
    flex: 1, height: '4px', background: 'var(--border)',
    borderRadius: '100px', overflow: 'hidden',
  },
  progressPct: { fontSize: '11px', color: 'var(--text-3)', width: '30px', textAlign: 'right' as const },
}
