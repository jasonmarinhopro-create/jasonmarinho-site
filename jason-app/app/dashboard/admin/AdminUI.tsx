'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Users, Warning, CheckCircle, XCircle, Trash,
  Check, X, ArrowClockwise, FileText, GraduationCap,
  UsersThree, ArrowRight, UsersFour, CalendarBlank, Trophy,
  BookOpen, Newspaper, Crown, ShieldStar, TrendUp, Lightning,
  Sparkle, Circle,
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
  totalUsers: number; driingMembers: number; standardMembers: number; newThisMonth: number
  pendingDriing: number; pendingReports: number; suggestions: number
  templatesCount: number; formationsCount: number; groupsCount: number
  totalVoyageurs: number; totalSejours: number
  topFormation: { title: string; count: number } | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatDateLong() {
  return new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
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
  const decouverte = stats.totalUsers - stats.standardMembers - stats.driingMembers

  const tabs = [
    { key: 'driing' as const,      label: 'Membres Driing', count: stats.pendingDriing },
    { key: 'reports' as const,     label: 'Signalements',   count: pendingReportsCount },
    { key: 'suggestions' as const, label: 'Suggestions',    count: stats.suggestions },
  ]

  return (
    <div style={s.wrap}>

      {/* ── Bannière admin ── */}
      <div style={s.hero}>
        <div style={s.heroGlow} />
        <div style={s.heroContent}>
          <div style={s.heroBadge}>
            <ShieldStar size={11} weight="fill" />
            Espace privé · Accès restreint
          </div>
          <h1 style={s.heroTitle}>Administration</h1>
          <p style={s.heroSub}>{formatDateLong()}</p>
        </div>
        <div style={s.heroCrown}>
          <Crown size={40} weight="duotone" style={{ color: 'rgba(167,139,250,0.25)' }} />
        </div>
        {totalAlerts > 0 && (
          <div style={s.heroAlert}>
            <Warning size={14} weight="fill" />
            {totalAlerts} action{totalAlerts > 1 ? 's' : ''} en attente
          </div>
        )}
      </div>

      {/* ── Répartition membres ── */}
      <div className="fade-up">
        <div style={s.sectionLabel}>
          <TrendUp size={13} />
          Membres · répartition par plan
        </div>
        <div style={s.plansGrid}>
          <div style={s.planCard}>
            <div style={s.planTop}>
              <span style={{ ...s.planDot, background: '#6b7280' }} />
              <span style={s.planName}>Découverte</span>
              <span style={s.planCount}>{decouverte < 0 ? 0 : decouverte}</span>
            </div>
            <div style={s.planBar}>
              <div style={{ ...s.planFill, width: `${stats.totalUsers > 0 ? Math.round((Math.max(0,decouverte) / stats.totalUsers) * 100) : 0}%`, background: '#6b7280' }} />
            </div>
          </div>
          <div style={{ ...s.planCard, borderColor: 'rgba(255,213,107,0.25)' }}>
            <div style={s.planTop}>
              <span style={{ ...s.planDot, background: '#FFD56B' }} />
              <span style={s.planName}>Standard</span>
              <span style={{ ...s.planCount, color: '#FFD56B' }}>{stats.standardMembers}</span>
            </div>
            <div style={s.planBar}>
              <div style={{ ...s.planFill, width: `${stats.totalUsers > 0 ? Math.round((stats.standardMembers / stats.totalUsers) * 100) : 0}%`, background: '#FFD56B' }} />
            </div>
          </div>
          <div style={{ ...s.planCard, borderColor: 'rgba(167,139,250,0.25)' }}>
            <div style={s.planTop}>
              <span style={{ ...s.planDot, background: '#a78bfa' }} />
              <span style={s.planName}>Driing</span>
              <span style={{ ...s.planCount, color: '#a78bfa' }}>{stats.driingMembers}</span>
            </div>
            <div style={s.planBar}>
              <div style={{ ...s.planFill, width: `${stats.totalUsers > 0 ? Math.round((stats.driingMembers / stats.totalUsers) * 100) : 0}%`, background: '#a78bfa' }} />
            </div>
          </div>
          <div style={{ ...s.planCard, borderColor: 'rgba(99,214,131,0.2)' }}>
            <div style={s.planTop}>
              <Sparkle size={12} color="#63D683" weight="fill" />
              <span style={s.planName}>Nouveaux ce mois</span>
              <span style={{ ...s.planCount, color: '#63D683' }}>+{stats.newThisMonth}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {stats.totalUsers} membres au total
            </div>
          </div>
        </div>
      </div>

      {/* ── Activité plateforme ── */}
      <div className="fade-up">
        <div style={s.sectionLabel}>
          <Lightning size={13} />
          Activité plateforme
        </div>
        <div style={s.activityRow}>
          <div style={s.actCard}>
            <div style={{ ...s.actIcon, color: '#93C5FD', background: 'rgba(147,197,253,0.12)' }}>
              <UsersFour size={20} weight="duotone" />
            </div>
            <div>
              <div style={{ ...s.actVal, color: '#93C5FD' }}>{stats.totalVoyageurs}</div>
              <div style={s.actLbl}>voyageurs</div>
            </div>
          </div>
          <div style={s.actCard}>
            <div style={{ ...s.actIcon, color: '#34D399', background: 'rgba(52,211,153,0.12)' }}>
              <CalendarBlank size={20} weight="duotone" />
            </div>
            <div>
              <div style={{ ...s.actVal, color: '#34D399' }}>{stats.totalSejours}</div>
              <div style={s.actLbl}>séjours</div>
            </div>
          </div>
          {stats.topFormation && (
            <div style={{ ...s.actCard, flex: '2 1 220px' }}>
              <div style={{ ...s.actIcon, color: '#FFD56B', background: 'rgba(255,213,107,0.12)' }}>
                <Trophy size={20} weight="duotone" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  Formation la plus commencée
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFD56B', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {stats.topFormation.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
                  {stats.topFormation.count} inscription{stats.topFormation.count > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Gestion du contenu ── */}
      <div className="fade-up">
        <div style={s.sectionLabel}>
          <FileText size={13} />
          Gestion du contenu
        </div>
        <div style={s.contentGrid}>
          {[
            { href: '/dashboard/admin/membres',    icon: UsersThree,    color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  title: 'Membres',     desc: `${stats.totalUsers} inscrits · ${stats.driingMembers} Driing` },
            { href: '/dashboard/admin/gabarits',   icon: FileText,      color: '#FFD56B', bg: 'rgba(255,213,107,0.1)', title: 'Gabarits',    desc: `${stats.templatesCount} gabarit${stats.templatesCount !== 1 ? 's' : ''}` },
            { href: '/dashboard/admin/formations', icon: GraduationCap, color: '#34D399', bg: 'rgba(52,211,153,0.1)',  title: 'Formations',  desc: `${stats.formationsCount} publiée${stats.formationsCount !== 1 ? 's' : ''}` },
            { href: '/dashboard/admin/actualites', icon: Newspaper,     color: '#f472b6', bg: 'rgba(244,114,182,0.1)', title: 'Actualités',  desc: 'Fil LCD' },
            { href: '/dashboard/admin/communaute', icon: UsersThree,    color: '#93C5FD', bg: 'rgba(147,197,253,0.1)', title: 'Communauté',  desc: `${stats.groupsCount} groupe${stats.groupsCount !== 1 ? 's' : ''}` },
            { href: '/dashboard/admin/guides',     icon: BookOpen,      color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  title: 'Guide LCD',   desc: 'Profils & fiches' },
          ].map(({ href, icon: Icon, color, bg, title, desc }) => (
            <Link key={href} href={href} style={s.contentCard} className="admin-content-card">
              <div style={{ ...s.contentIcon, color, background: bg, border: `1px solid ${color}20` }}>
                <Icon size={22} weight="duotone" />
              </div>
              <div style={s.contentBody}>
                <div style={s.contentTitle}>{title}</div>
                <div style={s.contentDesc}>{desc}</div>
              </div>
              <ArrowRight size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Actions en attente ── */}
      <div className="fade-up">
        <div style={s.sectionLabel}>
          <Warning size={13} style={{ color: totalAlerts > 0 ? '#fb923c' : 'var(--text-muted)' }} />
          Actions en attente
          {totalAlerts > 0 && (
            <span style={s.alertBadge}>{totalAlerts}</span>
          )}
        </div>

        <div style={s.tabBar}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ ...s.tab, ...(tab === t.key ? s.tabActive : {}) }}>
              {t.count > 0 && <Circle size={7} weight="fill" style={{ color: '#fb923c', flexShrink: 0 }} />}
              {t.label}
              {t.count > 0 && (
                <span style={{ ...s.tabBadge, ...(tab === t.key ? s.tabBadgeActive : {}) }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Driing */}
        {tab === 'driing' && (
          <Section title="Demandes Membre Driing" empty={pendingDriing.length === 0} emptyMsg="Aucune demande en attente.">
            {pendingDriing.map(u => (
              <div key={u.id} className="admin-item">
                <div className="admin-item-head">
                  <div style={s.itemAvatar}>{(u.full_name || u.email).slice(0, 1).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.cellPrimary}>{u.full_name || '—'}</div>
                    <div style={s.cellSub}>{u.email} · {formatDate(u.created_at)}</div>
                  </div>
                  <span style={{ ...s.badge, background: 'rgba(251,146,60,.12)', color: '#fb923c', border: '1px solid rgba(251,146,60,.2)' }}>En attente</span>
                </div>
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
          <Section title={`${reports.length} signalement${reports.length !== 1 ? 's' : ''}`} empty={reports.length === 0} emptyMsg="Aucun signalement.">
            {reports.map(r => (
              <div key={r.id} className="admin-item">
                <div className="admin-item-head">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.cellPrimary}>{r.name || r.identifier}</div>
                    <div style={s.cellSub}>{r.identifier_type} · {r.identifier}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span style={{ ...s.badge, background: 'rgba(248,113,113,.1)', color: '#f87171', border: '1px solid rgba(248,113,113,.2)' }}>{r.incident_type}</span>
                    <span style={{ ...s.badge, ...(r.is_validated ? { background: 'rgba(52,211,153,.1)', color: '#34D399', border: '1px solid rgba(52,211,153,.2)' } : { background: 'rgba(251,146,60,.1)', color: '#fb923c', border: '1px solid rgba(251,146,60,.2)' }) }}>
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
                  <span style={{ ...s.badge, ...(sg.type === 'formation' ? { background: 'rgba(255,213,107,.1)', color: '#FFD56B', border: '1px solid rgba(255,213,107,.2)' } : { background: 'rgba(147,197,253,.1)', color: '#93C5FD', border: '1px solid rgba(147,197,253,.2)' }) }}>
                    {sg.type === 'formation' ? 'Formation' : 'Partenaire'}
                  </span>
                  <div style={{ ...s.cellSub, marginLeft: 'auto' }}>{sg.user_email || '—'} · {formatDate(sg.created_at)}</div>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.55, marginTop: '4px' }}>{sg.message}</div>
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
      {empty
        ? <div style={s.empty}>{emptyMsg}</div>
        : <div style={s.table}>{children}</div>
      }
    </div>
  )
}
function ActionBtn({ label, icon, color, loading, onClick }: { label: string; icon: React.ReactNode; color: string; loading: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
      cursor: loading ? 'not-allowed' : 'pointer',
      background: `${color}14`, color, border: `1px solid ${color}25`,
      opacity: loading ? 0.5 : 1, fontFamily: 'var(--font-outfit), sans-serif',
      transition: 'all 0.15s',
    }}>
      {loading ? <ArrowClockwise size={12} style={{ animation: 'spin 1s linear infinite' }} /> : icon}
      {label}
    </button>
  )
}
function FeedbackPill({ type, msg }: { type: 'ok' | 'err'; msg: string }) {
  const color = type === 'ok' ? '#34D399' : '#f87171'
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, color, background: `${color}14`, border: `1px solid ${color}25` }}>
      {type === 'ok' ? <CheckCircle size={13} weight="fill" /> : <XCircle size={13} weight="fill" />}
      {msg}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '36px' },

  // Admin hero banner
  hero: {
    position: 'relative',
    background: 'linear-gradient(135deg, rgba(167,139,250,0.1) 0%, rgba(255,213,107,0.04) 60%, rgba(167,139,250,0.06) 100%)',
    border: '1px solid rgba(167,139,250,0.2)',
    borderRadius: '20px',
    padding: 'clamp(24px,3vw,36px) clamp(24px,4vw,40px)',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute', top: '-60px', right: '-60px',
    width: '220px', height: '220px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroContent: { position: 'relative', zIndex: 1 },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' as const,
    color: '#a78bfa',
    background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)',
    borderRadius: '999px', padding: '4px 12px', marginBottom: '14px',
  },
  heroTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(28px,3vw,42px)',
    fontWeight: 400,
    color: 'var(--text)',
    margin: '0 0 8px',
    lineHeight: 1.1,
  },
  heroSub: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    margin: 0,
    textTransform: 'capitalize' as const,
  },
  heroCrown: {
    position: 'absolute', right: 'clamp(20px,4vw,44px)', top: '50%',
    transform: 'translateY(-50%)', pointerEvents: 'none',
  },
  heroAlert: {
    position: 'absolute', top: '16px', right: '16px',
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '11px', fontWeight: 700,
    color: '#fb923c',
    background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.25)',
    borderRadius: '999px', padding: '4px 10px',
  },

  // Plan distribution
  sectionLabel: {
    display: 'flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.9px', textTransform: 'uppercase' as const,
    color: 'var(--text-muted)', marginBottom: '14px',
  },
  plansGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: '12px',
  },
  planCard: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '16px 18px',
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  planTop: { display: 'flex', alignItems: 'center', gap: '8px' },
  planDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  planName: { fontSize: '13px', color: 'var(--text-2)', flex: 1 },
  planCount: { fontFamily: 'var(--font-fraunces), serif', fontSize: '22px', fontWeight: 400, color: 'var(--text)', lineHeight: 1 },
  planBar: { height: '3px', borderRadius: '2px', background: 'var(--border)', overflow: 'hidden' },
  planFill: { height: '100%', borderRadius: '2px', transition: 'width 0.6s ease', minWidth: '4px' },

  // Activity row
  activityRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' as const },
  actCard: {
    display: 'flex', alignItems: 'center', gap: '14px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '16px 20px', flex: '1 1 140px',
  },
  actIcon: {
    width: '40px', height: '40px', borderRadius: '11px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  actVal: { fontFamily: 'var(--font-fraunces), serif', fontSize: '26px', fontWeight: 400, color: 'var(--text)', lineHeight: 1 },
  actLbl: { fontSize: '12px', color: 'var(--text-3)', marginTop: '3px' },

  // Content grid
  contentGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: '10px',
  },
  contentCard: {
    display: 'flex', alignItems: 'center', gap: '14px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '16px 18px',
    textDecoration: 'none', transition: 'border-color 0.18s, background 0.18s',
  },
  contentIcon: {
    width: '42px', height: '42px', borderRadius: '11px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  contentBody: { flex: 1, minWidth: 0 },
  contentTitle: { fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '3px' },
  contentDesc: { fontSize: '12px', color: 'var(--text-3)' },

  // Tabs
  alertBadge: {
    background: 'rgba(251,146,60,0.15)', color: '#fb923c',
    border: '1px solid rgba(251,146,60,0.25)',
    borderRadius: '100px', padding: '1px 8px',
    fontSize: '11px', fontWeight: 700,
  },
  tabBar: {
    display: 'flex', gap: '4px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '4px', marginBottom: '16px', overflowX: 'auto' as const,
  },
  tab: {
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '9px 18px', borderRadius: '9px',
    fontSize: '13px', fontWeight: 500, color: 'var(--text-3)',
    background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' as const,
  },
  tabActive: { background: 'rgba(255,255,255,0.12)', color: 'var(--text)' },
  tabBadge: {
    fontSize: '11px', fontWeight: 700,
    background: 'var(--border)', color: 'var(--text-3)',
    padding: '1px 7px', borderRadius: '100px',
  },
  tabBadgeActive: { background: 'rgba(251,146,60,0.15)', color: '#fb923c' },

  // Items
  section: { display: 'flex', flexDirection: 'column', gap: '0' },
  sectionSubTitle: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const,
    color: 'var(--text-muted)', padding: '0 0 10px',
  },
  table: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', overflow: 'hidden',
  },
  empty: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '40px',
    textAlign: 'center' as const, fontSize: '14px', color: 'var(--text-muted)',
  },
  itemAvatar: {
    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
    background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: 700, color: '#a78bfa', fontFamily: 'var(--font-fraunces), serif',
  },
  cellPrimary: {
    fontSize: '14px', fontWeight: 500, color: 'var(--text)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  cellSub: {
    fontSize: '12px', color: 'var(--text-3)', marginTop: '2px',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  description: {
    fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5, marginTop: '4px',
  },
  badge: {
    display: 'inline-block', fontSize: '11px', fontWeight: 600,
    padding: '3px 10px', borderRadius: '100px', letterSpacing: '0.3px',
    whiteSpace: 'nowrap' as const,
  },
}
