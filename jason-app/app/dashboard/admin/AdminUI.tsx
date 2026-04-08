'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Users, Lightning, Warning, CheckCircle, XCircle, Trash,
  Check, X, ArrowClockwise, TrendUp, FileText, GraduationCap,
  UsersThree, ArrowRight, Bell, UsersFour, CalendarBlank, Trophy,
} from '@phosphor-icons/react'
import {
  confirmDriingMember, rejectDriingMember,
  validateReport, deleteReport, deleteSuggestion,
} from './actions'

interface PendingUser {
  id: string; email: string; full_name: string | null; created_at: string; driing_status: string
}
interface Report {
  id: string; identifier: string; identifier_type: string; name: string | null
  incident_type: string; description: string | null; reporter_city: string | null
  reported_at: string; is_validated: boolean
}
interface Suggestion {
  id: string; type: 'formation' | 'partner'; message: string; user_email: string | null; created_at: string
}
interface Stats {
  totalUsers: number; driingMembers: number; newThisMonth: number
  pendingDriing: number; pendingReports: number; suggestions: number
  templatesCount: number; formationsCount: number; groupsCount: number
  totalVoyageurs: number; totalSejours: number
  topFormation: { title: string; count: number } | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminUI({ pendingDriing, reports, suggestions, stats }: {
  pendingDriing: PendingUser[]; reports: Report[]; suggestions: Suggestion[]; stats: Stats
}) {
  const [tab, setTab] = useState<'driing' | 'reports' | 'suggestions'>('driing')
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

  const pendingReportsCount = reports.filter(r => !r.is_validated).length
  const totalAlerts = stats.pendingDriing + pendingReportsCount

  const tabs = [
    { key: 'driing' as const,      label: 'Membres Driing', count: stats.pendingDriing },
    { key: 'reports' as const,     label: 'Signalements',   count: pendingReportsCount },
    { key: 'suggestions' as const, label: 'Suggestions',    count: stats.suggestions },
  ]

  return (
    <div style={s.wrap}>

      {/* ── Titre ── */}
      <div style={s.pageIntro} className="fade-up">
        <h2 style={s.pageTitle}>
          Administration
        </h2>
        <p style={s.pageDesc}>Gère les membres, le contenu et les demandes en attente.</p>
      </div>

      {/* ── Stats ── */}
      <div style={s.statsGrid} className="fade-up">
        <div style={s.statCard}>
          <div style={{ ...s.statIcon, color: '#93C5FD', background: 'rgba(147,197,253,0.12)' }}>
            <TrendUp size={18} />
          </div>
          <div>
            <div style={{ ...s.statValue, color: '#93C5FD' }}>+{stats.newThisMonth}</div>
            <div style={s.statLabel}>ce mois</div>
          </div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statIcon, color: 'var(--text-2)', background: 'var(--border)' }}>
            <Users size={18} />
          </div>
          <div>
            <div style={s.statValue}>{stats.totalUsers}</div>
            <div style={s.statLabel}>membres total</div>
          </div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statIcon, color: 'var(--accent-text)', background: 'rgba(255,213,107,0.12)' }}>
            <Lightning size={18} />
          </div>
          <div>
            <div style={{ ...s.statValue, color: 'var(--accent-text)' }}>{stats.driingMembers}</div>
            <div style={s.statLabel}>membres Driing</div>
          </div>
        </div>
        {totalAlerts > 0 && (
          <div style={{ ...s.statCard, borderColor: 'rgba(251,146,60,0.25)' }}>
            <div style={{ ...s.statIcon, color: '#fb923c', background: 'rgba(251,146,60,0.12)' }}>
              <Bell size={18} />
            </div>
            <div>
              <div style={{ ...s.statValue, color: '#fb923c' }}>{totalAlerts}</div>
              <div style={s.statLabel}>action{totalAlerts > 1 ? 's' : ''} requise{totalAlerts > 1 ? 's' : ''}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Insights plateforme ── */}
      <div className="fade-up">
        <div style={s.sectionLabel}>Activité globale</div>
        <div style={s.insightsGrid}>
          <div style={s.insightCard}>
            <div style={{ ...s.insightIcon, color: '#93C5FD', background: 'rgba(147,197,253,0.12)' }}>
              <UsersFour size={18} />
            </div>
            <div style={s.insightBody}>
              <div style={{ ...s.insightValue, color: '#93C5FD' }}>{stats.totalVoyageurs}</div>
              <div style={s.insightLabel}>voyageurs enregistrés</div>
            </div>
          </div>
          <div style={s.insightCard}>
            <div style={{ ...s.insightIcon, color: '#34D399', background: 'rgba(52,211,153,0.12)' }}>
              <CalendarBlank size={18} />
            </div>
            <div style={s.insightBody}>
              <div style={{ ...s.insightValue, color: '#34D399' }}>{stats.totalSejours}</div>
              <div style={s.insightLabel}>séjours au total</div>
            </div>
          </div>
          {stats.topFormation && (
            <div style={{ ...s.insightCard, flex: '2 1 280px' }}>
              <div style={{ ...s.insightIcon, color: 'var(--accent-text)', background: 'rgba(255,213,107,0.12)' }}>
                <Trophy size={18} />
              </div>
              <div style={s.insightBody}>
                <div style={s.insightTopLabel}>Formation la plus commencée</div>
                <div style={s.insightTopTitle}>{stats.topFormation.title}</div>
                <div style={s.insightLabel}>{stats.topFormation.count} inscrit{stats.topFormation.count > 1 ? 's' : ''}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Gestion du contenu ── */}
      <div className="fade-up">
        <div style={s.sectionLabel}>Gestion du contenu</div>
        <div style={s.contentGrid}>
          <Link href="/dashboard/admin/membres" style={s.contentCard}>
            <div style={{ ...s.contentCardIcon, color: 'var(--text-2)', background: 'var(--border)' }}>
              <UsersThree size={22} />
            </div>
            <div style={s.contentCardBody}>
              <div style={s.contentCardTitle}>Membres</div>
              <div style={s.contentCardDesc}>{stats.totalUsers} inscrits · {stats.driingMembers} Driing</div>
            </div>
            <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </Link>

          <Link href="/dashboard/admin/gabarits" style={s.contentCard}>
            <div style={{ ...s.contentCardIcon, color: 'var(--accent-text)', background: 'rgba(255,213,107,0.1)' }}>
              <FileText size={22} />
            </div>
            <div style={s.contentCardBody}>
              <div style={s.contentCardTitle}>Gabarits</div>
              <div style={s.contentCardDesc}>{stats.templatesCount} gabarit{stats.templatesCount > 1 ? 's' : ''} publiés</div>
            </div>
            <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </Link>

          <Link href="/dashboard/admin/formations" style={s.contentCard}>
            <div style={{ ...s.contentCardIcon, color: '#34D399', background: 'rgba(52,211,153,0.1)' }}>
              <GraduationCap size={22} />
            </div>
            <div style={s.contentCardBody}>
              <div style={s.contentCardTitle}>Formations</div>
              <div style={s.contentCardDesc}>{stats.formationsCount} formation{stats.formationsCount > 1 ? 's' : ''} publiée{stats.formationsCount > 1 ? 's' : ''}</div>
            </div>
            <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </Link>

          <Link href="/dashboard/admin/communaute" style={s.contentCard}>
            <div style={{ ...s.contentCardIcon, color: '#93C5FD', background: 'rgba(147,197,253,0.1)' }}>
              <UsersThree size={22} />
            </div>
            <div style={s.contentCardBody}>
              <div style={s.contentCardTitle}>Communauté</div>
              <div style={s.contentCardDesc}>{stats.groupsCount} groupe{stats.groupsCount > 1 ? 's' : ''} en base</div>
            </div>
            <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </Link>
        </div>
      </div>

      {/* ── Actions en attente ── */}
      <div className="fade-up">
        <div style={s.sectionLabel}>
          Actions en attente
          {totalAlerts > 0 && <span style={s.alertDot}>{totalAlerts}</span>}
        </div>
        <div style={s.tabBar}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ ...s.tab, ...(tab === t.key ? s.tabActive : {}) }}>
              {t.label}
              {t.count > 0 && (
                <span style={{ ...s.tabBadge, ...(tab === t.key ? s.tabBadgeActive : {}) }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Driing */}
        {tab === 'driing' && (
          <Section title="Demandes membres Driing" empty={pendingDriing.length === 0} emptyMsg="Aucune demande en attente.">
            {pendingDriing.map(u => (
              <div key={u.id} className="admin-item">
                <div className="admin-item-head">
                  <div>
                    <div style={s.cellPrimary}>{u.full_name || '—'}</div>
                    <div style={s.cellSub}>{u.email}</div>
                  </div>
                  <span style={{ ...s.badge, background: 'rgba(251,146,60,.12)', color: '#fb923c' }}>En attente</span>
                </div>
                <div style={s.cellSub}>Inscrit le {formatDate(u.created_at)}</div>
                <div className="admin-item-foot">
                  {feedback?.id === u.id
                    ? <FeedbackPill type={feedback.type} msg={feedback.msg} />
                    : (
                      <>
                        <ActionBtn label="Confirmer" icon={<Check size={13} weight="bold" />} color="#34D399" loading={isPending}
                          onClick={() => action(u.id, () => confirmDriingMember(u.id), 'Membre Driing confirmé ✓')} />
                        <ActionBtn label="Rejeter" icon={<X size={13} weight="bold" />} color="#f87171" loading={isPending}
                          onClick={() => action(u.id, () => rejectDriingMember(u.id), 'Demande rejetée')} />
                      </>
                    )}
                </div>
              </div>
            ))}
          </Section>
        )}

        {/* Reports */}
        {tab === 'reports' && (
          <Section title={`${reports.length} signalement${reports.length > 1 ? 's' : ''}`} empty={reports.length === 0} emptyMsg="Aucun signalement.">
            {reports.map(r => (
              <div key={r.id} className="admin-item">
                <div className="admin-item-head">
                  <div>
                    <div style={s.cellPrimary}>{r.name || r.identifier}</div>
                    <div style={s.cellSub}>{r.identifier_type} · {r.identifier}</div>
                  </div>
                  <div className="admin-item-badges">
                    <span style={{ ...s.badge, background: 'rgba(248,113,113,.1)', color: '#f87171' }}>{r.incident_type}</span>
                    <span style={{ ...s.badge, ...(r.is_validated ? { background: 'rgba(52,211,153,.1)', color: '#34D399' } : { background: 'rgba(251,146,60,.1)', color: '#fb923c' }) }}>
                      {r.is_validated ? 'Validé' : 'En attente'}
                    </span>
                  </div>
                </div>
                <div style={s.cellSub}>{r.reporter_city || '—'} · {formatDate(r.reported_at)}</div>
                {r.description && <div style={s.description}>{r.description}</div>}
                <div className="admin-item-foot">
                  {feedback?.id === r.id
                    ? <FeedbackPill type={feedback.type} msg={feedback.msg} />
                    : (
                      <>
                        {!r.is_validated && (
                          <ActionBtn label="Valider" icon={<CheckCircle size={13} weight="bold" />} color="#34D399" loading={isPending}
                            onClick={() => action(r.id, () => validateReport(r.id), 'Signalement validé')} />
                        )}
                        <ActionBtn label="Supprimer" icon={<Trash size={13} weight="bold" />} color="#f87171" loading={isPending}
                          onClick={() => action(r.id, () => deleteReport(r.id), 'Supprimé')} />
                      </>
                    )}
                </div>
              </div>
            ))}
          </Section>
        )}

        {/* Suggestions */}
        {tab === 'suggestions' && (
          <Section title="Suggestions utilisateurs" empty={suggestions.length === 0} emptyMsg="Aucune suggestion.">
            {suggestions.map(sg => (
              <div key={sg.id} className="admin-item">
                <div className="admin-item-head">
                  <span style={{ ...s.badge, ...(sg.type === 'formation' ? { background: 'rgba(255,213,107,.1)', color: 'var(--accent-text)' } : { background: 'rgba(147,197,253,.1)', color: '#93C5FD' }) }}>
                    {sg.type === 'formation' ? 'Formation' : 'Partenaire'}
                  </span>
                  <div style={{ ...s.cellSub, whiteSpace: 'normal', overflow: 'visible', textOverflow: 'unset' }}>{sg.user_email || '—'} · {formatDate(sg.created_at)}</div>
                </div>
                <div style={{ ...s.cellPrimary, whiteSpace: 'normal', overflow: 'visible', textOverflow: 'unset' }}>{sg.message}</div>
                <div className="admin-item-foot">
                  {feedback?.id === sg.id
                    ? <FeedbackPill type={feedback.type} msg={feedback.msg} />
                    : <ActionBtn label="Supprimer" icon={<Trash size={13} weight="bold" />} color="#f87171" loading={isPending}
                        onClick={() => action(sg.id, () => deleteSuggestion(sg.id), 'Supprimée')} />}
                </div>
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────
function Section({ title, children, empty, emptyMsg }: { title: string; children: React.ReactNode; empty: boolean; emptyMsg: string }) {
  return (
    <div style={s.section}>
      <div style={s.sectionSubTitle}>{title}</div>
      {empty ? <div style={s.empty}>{emptyMsg}</div> : <div style={s.table}>{children}</div>}
    </div>
  )
}
function ActionBtn({ label, icon, color, loading, onClick }: { label: string; icon: React.ReactNode; color: string; loading: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 500,
      cursor: loading ? 'not-allowed' : 'pointer',
      background: `${color}14`, color, border: `1px solid ${color}30`,
      opacity: loading ? 0.5 : 1, fontFamily: 'Outfit, sans-serif',
    }}>
      {loading ? <ArrowClockwise size={12} style={{ animation: 'spin 1s linear infinite' }} /> : icon}
      {label}
    </button>
  )
}
function FeedbackPill({ type, msg }: { type: 'ok' | 'err'; msg: string }) {
  const color = type === 'ok' ? '#34D399' : '#f87171'
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, color, background: `${color}14`, border: `1px solid ${color}30` }}>
      {type === 'ok' ? <CheckCircle size={13} weight="fill" /> : <XCircle size={13} weight="fill" />}
      {msg}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '32px' },

  pageIntro: { marginBottom: '-8px' },
  pageTitle: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: 'var(--text)', marginBottom: '8px' },
  pageDesc: { fontSize: '15px', fontWeight: 300, color: 'var(--text-3)' },

  statsGrid: { display: 'flex', gap: '14px', flexWrap: 'wrap' },
  statCard: {
    display: 'flex', alignItems: 'center', gap: '14px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '16px 20px', flex: '1 1 160px',
  },
  statIcon: { width: '36px', height: '36px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statValue: { fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 400, color: 'var(--text)', lineHeight: 1.1 },
  statLabel: { fontSize: '12px', color: 'var(--text-3)', marginTop: '3px' },

  sectionLabel: {
    display: 'flex', alignItems: 'center', gap: '10px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const,
    color: 'var(--text-muted)', marginBottom: '14px',
  },
  alertDot: {
    background: 'rgba(251,146,60,0.15)', color: '#fb923c',
    border: '1px solid rgba(251,146,60,0.25)',
    borderRadius: '100px', padding: '1px 8px',
    fontSize: '11px', fontWeight: 700,
  },

  contentGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' },
  contentCard: {
    display: 'flex', alignItems: 'center', gap: '14px',
    background: 'var(--surface)', border: '1px solid var(--surface-2)',
    borderRadius: '14px', padding: '18px 20px',
    textDecoration: 'none', transition: 'border-color 0.18s, background 0.18s',
  },
  contentCardIcon: { width: '42px', height: '42px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  contentCardBody: { flex: 1, minWidth: 0 },
  contentCardTitle: { fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '3px' },
  contentCardDesc: { fontSize: '12px', color: 'var(--text-3)' },

  tabBar: { display: 'flex', gap: '4px', background: 'var(--surface)', border: '1px solid var(--surface-2)', borderRadius: '12px', padding: '4px', marginBottom: '16px', overflowX: 'auto' as const },
  tab: { display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', borderRadius: '9px', fontSize: '13px', fontWeight: 500, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' },
  tabActive: { background: 'var(--surface-2)', color: 'var(--text)' },
  tabBadge: { fontSize: '11px', fontWeight: 700, background: 'var(--border)', color: 'var(--text-3)', padding: '1px 7px', borderRadius: '100px' },
  tabBadgeActive: { background: 'rgba(255,213,107,0.15)', color: 'var(--accent-text)' },

  section: { display: 'flex', flexDirection: 'column', gap: '0' },
  sectionSubTitle: { fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, color: 'var(--text-muted)', padding: '0 0 10px' },
  table: { background: 'var(--surface)', border: '1px solid var(--surface-2)', borderRadius: '14px', overflow: 'hidden' },
  empty: { background: 'var(--surface)', border: '1px solid var(--surface-2)', borderRadius: '14px', padding: '40px', textAlign: 'center' as const, fontSize: '14px', color: 'var(--text-muted)' },
  cellPrimary: { fontSize: '14px', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  cellSub: { fontSize: '12px', color: 'var(--text-3)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  description: { fontSize: '13px', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, marginTop: '2px' },
  badge: { display: 'inline-block', fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '100px', letterSpacing: '0.3px', whiteSpace: 'nowrap' as const },

  insightsGrid: { display: 'flex', gap: '14px', flexWrap: 'wrap' as const },
  insightCard: {
    display: 'flex', alignItems: 'center', gap: '14px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '16px 20px', flex: '1 1 160px',
  },
  insightIcon: { width: '36px', height: '36px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  insightBody: { flex: 1, minWidth: 0 },
  insightValue: { fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 400, color: 'var(--text)', lineHeight: 1.1 },
  insightLabel: { fontSize: '12px', color: 'var(--text-3)', marginTop: '3px' },
  insightTopLabel: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: '4px' },
  insightTopTitle: { fontSize: '14px', fontWeight: 600, color: 'var(--accent-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
}
