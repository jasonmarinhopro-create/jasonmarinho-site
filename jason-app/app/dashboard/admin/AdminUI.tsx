'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import {
  Users, Warning, CheckCircle, XCircle, Trash,
  Check, X, ArrowClockwise, FileText, GraduationCap,
  UsersThree, ArrowRight, UsersFour, CalendarBlank, Trophy,
  BookOpen, Newspaper, Crown, ShieldStar, TrendUp, Lightning,
  Sparkle, Circle, CurrencyEur, ChartLineUp, Percent,
  UserPlus, Star,
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
interface RecentSignup {
  id: string; email: string; full_name: string | null; plan: string; created_at: string
}
interface MonthlySignup {
  month: string; total: number; paid: number
}
interface Stats {
  totalUsers: number; driingMembers: number; standardMembers: number; newThisMonth: number
  pendingDriing: number; pendingReports: number; suggestions: number
  templatesCount: number; formationsCount: number; groupsCount: number
  totalVoyageurs: number; totalSejours: number
  topFormation: { title: string; count: number } | null
  mrr: number
  completedFormations: number
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatDateLong() {
  return new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function formatEuro(amount: number, decimals = 2) {
  return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}
function formatMonthShort(yearMonth: string) {
  const [y, m] = yearMonth.split('-').map(Number)
  return new Date(y, m - 1).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')
}
function relativeDate(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / 86_400_000)
  if (days === 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days}j`
  if (days < 30) return `il y a ${Math.floor(days / 7)}sem`
  if (days < 365) return `il y a ${Math.floor(days / 30)}mois`
  return `il y a ${Math.floor(days / 365)}an${days >= 730 ? 's' : ''}`
}

export default function AdminUI({
  pendingDriing, reports, suggestions, stats,
  recentSignups, monthlySignupsChart,
}: {
  pendingDriing: PendingUser[]
  reports: Report[]
  suggestions: Suggestion[]
  stats: Stats
  recentSignups: RecentSignup[]
  monthlySignupsChart: MonthlySignup[]
}) {
  const [tab, setTab] = useState<'driing' | 'reports' | 'suggestions'>('driing')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ id: string; type: 'ok' | 'err'; msg: string } | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1100)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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
  const paidUsers = stats.standardMembers + stats.driingMembers
  const conversionRate = stats.totalUsers > 0 ? (paidUsers / stats.totalUsers) * 100 : 0
  const arpu = paidUsers > 0 ? stats.mrr / paidUsers : 0
  const arr = stats.mrr * 12

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

      {/* ── Bandeau KPIs financiers ── */}
      <div style={s.kpiBar}>
        <div style={s.kpiCard}>
          <div style={{ ...s.kpiIcon, background: 'rgba(52,211,153,0.12)', color: '#34D399' }}>
            <CurrencyEur size={18} weight="duotone" />
          </div>
          <div style={s.kpiBody}>
            <div style={s.kpiLabel}>MRR estimé</div>
            <div style={{ ...s.kpiValue, color: '#34D399' }}>{formatEuro(stats.mrr)}</div>
            <div style={s.kpiSub}>{paidUsers} membre{paidUsers > 1 ? 's' : ''} payant{paidUsers > 1 ? 's' : ''}</div>
          </div>
        </div>

        <div style={s.kpiCard}>
          <div style={{ ...s.kpiIcon, background: 'rgba(167,139,250,0.12)', color: '#a78bfa' }}>
            <ChartLineUp size={18} weight="duotone" />
          </div>
          <div style={s.kpiBody}>
            <div style={s.kpiLabel}>ARR projeté</div>
            <div style={{ ...s.kpiValue, color: '#a78bfa' }}>{formatEuro(arr, 0)}</div>
            <div style={s.kpiSub}>MRR × 12 mois</div>
          </div>
        </div>

        <div style={s.kpiCard}>
          <div style={{ ...s.kpiIcon, background: 'rgba(255,213,107,0.12)', color: 'var(--accent-text)' }}>
            <Percent size={18} weight="duotone" />
          </div>
          <div style={s.kpiBody}>
            <div style={s.kpiLabel}>Conversion</div>
            <div style={{ ...s.kpiValue, color: 'var(--accent-text)' }}>{conversionRate.toFixed(1)}%</div>
            <div style={s.kpiSub}>{paidUsers}/{stats.totalUsers} payants</div>
          </div>
        </div>

        <div style={s.kpiCard}>
          <div style={{ ...s.kpiIcon, background: 'rgba(96,190,255,0.12)', color: '#60BEFF' }}>
            <UserPlus size={18} weight="duotone" />
          </div>
          <div style={s.kpiBody}>
            <div style={s.kpiLabel}>ARPU</div>
            <div style={{ ...s.kpiValue, color: '#60BEFF' }}>{formatEuro(arpu)}</div>
            <div style={s.kpiSub}>par membre payant / mois</div>
          </div>
        </div>
      </div>

      {/* ── Sparkline 12 mois ── */}
      <SignupsSparkline data={monthlySignupsChart} />

      {/* ── Layout 2 colonnes desktop / stack mobile ── */}
      <div style={isDesktop ? s.mainGrid : s.mainStack}>
        <div style={s.leftCol}>

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
              <div style={{ ...s.actIcon, color: 'var(--accent-text)', background: 'var(--accent-bg-2)' }}>
                <Trophy size={20} weight="duotone" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  Formation la plus commencée
                </div>
                <div style={{
                  fontSize: '14px', fontWeight: 600, color: 'var(--accent-text)', lineHeight: 1.3,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical' as const,
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                }} title={stats.topFormation.title}>
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

      {/* ── Quick actions ── */}
      <div className="fade-up">
        <div style={s.sectionLabel}>
          <Lightning size={13} />
          Actions rapides
        </div>
        <div style={s.quickGrid}>
          <Link href="/dashboard/admin/formations" style={s.quickCard}>
            <GraduationCap size={16} weight="duotone" color="#34D399" />
            <span style={s.quickLabel}>Nouvelle formation</span>
          </Link>
          <Link href="/dashboard/admin/gabarits" style={s.quickCard}>
            <FileText size={16} weight="duotone" color="var(--accent-text)" />
            <span style={s.quickLabel}>Nouveau gabarit</span>
          </Link>
          <Link href="/dashboard/admin/actualites" style={s.quickCard}>
            <Newspaper size={16} weight="duotone" color="#f472b6" />
            <span style={s.quickLabel}>Publier actualité</span>
          </Link>
          <Link href="/dashboard/admin/membres" style={s.quickCard}>
            <UsersThree size={16} weight="duotone" color="#a78bfa" />
            <span style={s.quickLabel}>Gérer membres</span>
          </Link>
        </div>
      </div>

      {/* ── Performance formations ── */}
      {stats.formationsCount > 0 && (
        <div className="fade-up">
          <div style={s.sectionLabel}>
            <Star size={13} />
            Performance formations
          </div>
          <div style={s.perfRow}>
            <div style={s.perfCard}>
              <div style={s.perfNum}>{stats.completedFormations}</div>
              <div style={s.perfLbl}>complétions totales</div>
            </div>
            {stats.topFormation && (
              <div style={{ ...s.perfCard, flex: '2 1 240px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Top formation
                </div>
                <div style={s.perfTitle} title={stats.topFormation.title}>{stats.topFormation.title}</div>
                <div style={s.perfLbl}>{stats.topFormation.count} inscription{stats.topFormation.count > 1 ? 's' : ''}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Fil d'activité récente ── */}
      {recentSignups.length > 0 && (
        <div className="fade-up">
          <div style={s.sectionLabel}>
            <UserPlus size={13} />
            Derniers inscrits
            <Link href="/dashboard/admin/membres" style={s.sectionLink}>
              Voir tous <ArrowRight size={11} weight="bold" />
            </Link>
          </div>
          <div style={s.recentList}>
            {recentSignups.map(u => {
              const planCfg = u.plan === 'driing'
                ? { label: 'Driing', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' }
                : u.plan === 'standard'
                ? { label: 'Standard', color: 'var(--accent-text)', bg: 'var(--accent-bg)' }
                : { label: 'Découverte', color: 'var(--text-3)', bg: 'var(--border)' }
              const initial = (u.full_name || u.email).slice(0, 1).toUpperCase()
              return (
                <Link key={u.id} href={`/dashboard/admin/membres/${u.id}`} style={s.recentItem}>
                  <div style={s.recentAvatar}>{initial}</div>
                  <div style={s.recentBody}>
                    <div style={s.recentName}>{u.full_name || u.email.split('@')[0]}</div>
                    <div style={s.recentEmail}>{u.email}</div>
                  </div>
                  <div style={s.recentRight}>
                    <span style={{ ...s.recentPlan, color: planCfg.color, background: planCfg.bg }}>
                      {planCfg.label}
                    </span>
                    <span style={s.recentDate}>{relativeDate(u.created_at)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

        </div>
        {/* ── Right column : actions en attente (sticky desktop) ── */}
        <aside style={isDesktop ? s.rightColSticky : s.rightCol}>

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
                  <span style={{ ...s.badge, ...(sg.type === 'formation' ? { background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' } : { background: 'rgba(147,197,253,.1)', color: '#93C5FD', border: '1px solid rgba(147,197,253,.2)' }) }}>
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

        </aside>
      </div>

    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────
function SignupsSparkline({ data }: { data: MonthlySignup[] }) {
  if (!data || data.length === 0) return null
  const maxVal = Math.max(1, ...data.map(d => d.total))
  const totalSignups = data.reduce((sum, d) => sum + d.total, 0)
  const totalPaid = data.reduce((sum, d) => sum + d.paid, 0)
  const lastMonth = data[data.length - 1]
  const prevMonth = data[data.length - 2]
  const trendPct = prevMonth && prevMonth.total > 0
    ? Math.round(((lastMonth.total - prevMonth.total) / prevMonth.total) * 100)
    : null

  return (
    <div style={s.sparkWrap}>
      <div style={s.sparkHeader}>
        <div>
          <div style={s.sparkLabel}>
            <ChartLineUp size={12} />
            Inscriptions sur 12 mois
          </div>
          <div style={s.sparkTitle}>
            {totalSignups} <span style={s.sparkTitleSub}>nouveaux membres</span>
          </div>
          <div style={s.sparkSub}>
            dont <strong style={{ color: '#34D399' }}>{totalPaid}</strong> payants ·
            {trendPct !== null && (
              <span style={{ color: trendPct >= 0 ? '#34D399' : '#f87171', marginLeft: '6px', fontWeight: 600 }}>
                {trendPct >= 0 ? '↑' : '↓'} {Math.abs(trendPct)}% vs mois dernier
              </span>
            )}
          </div>
        </div>
        <div style={s.sparkLegend}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--accent-text)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Total</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#34D399' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Payants</span>
          </span>
        </div>
      </div>

      <div style={s.sparkBars}>
        {data.map((d, i) => {
          const totalH = (d.total / maxVal) * 100
          const paidH = d.total > 0 ? (d.paid / d.total) * totalH : 0
          return (
            <div key={d.month} style={s.sparkBarCol} title={`${formatMonthShort(d.month)} : ${d.total} inscrits${d.paid > 0 ? ` (dont ${d.paid} payants)` : ''}`}>
              <div style={s.sparkBarStack}>
                <div style={{ ...s.sparkBarTotal, height: `${totalH}%`, opacity: i === data.length - 1 ? 1 : 0.85 }}>
                  <div style={{ ...s.sparkBarPaid, height: `${paidH}%` }} />
                </div>
              </div>
              <div style={s.sparkLabel2}>{formatMonthShort(d.month)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

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
  wrap: { display: 'flex', flexDirection: 'column', gap: '32px' },

  // ── Main 2-column layout ──────────────────────────────────────────────────
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 380px',
    gap: '32px',
    alignItems: 'start',
  },
  mainStack: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '32px',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '32px',
    minWidth: 0,
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  rightColSticky: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    position: 'sticky' as const,
    top: '24px',
    maxHeight: 'calc(100vh - 48px)',
    overflowY: 'auto' as const,
  },

  // ── KPI Bar ───────────────────────────────────────────────────────────────
  kpiBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px',
  },
  kpiCard: {
    display: 'flex', alignItems: 'center', gap: '14px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '16px 18px',
  },
  kpiIcon: {
    width: '40px', height: '40px', borderRadius: '11px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  kpiBody: { flex: 1, minWidth: 0 },
  kpiLabel: { fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.6px', marginBottom: '4px' },
  kpiValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: '24px', fontWeight: 400, lineHeight: 1.1, marginBottom: '3px' },
  kpiSub: { fontSize: '11.5px', color: 'var(--text-3)' },

  // ── Quick actions ─────────────────────────────────────────────────────────
  quickGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '8px',
  },
  quickCard: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 14px', borderRadius: '11px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    textDecoration: 'none' as const, color: 'var(--text-2)',
    transition: 'border-color 0.15s, background 0.15s',
    fontSize: '12.5px', fontWeight: 500,
  },
  quickLabel: { flex: 1 },

  // ── Performance formations ────────────────────────────────────────────────
  perfRow: { display: 'flex', gap: '10px', flexWrap: 'wrap' as const },
  perfCard: {
    flex: '1 1 140px',
    padding: '14px 18px', borderRadius: '14px',
    background: 'var(--surface)', border: '1px solid var(--border)',
  },
  perfNum: { fontFamily: 'var(--font-fraunces), serif', fontSize: '24px', fontWeight: 400, color: 'var(--accent-text)', lineHeight: 1.1 },
  perfLbl: { fontSize: '11.5px', color: 'var(--text-3)', marginTop: '3px' },
  perfTitle: {
    fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.3,
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden', wordBreak: 'break-word' as const,
  },

  // ── Fil d'activité récente ────────────────────────────────────────────────
  sectionLink: {
    marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '3px',
    fontSize: '11px', fontWeight: 600, color: 'var(--accent-text)',
    textDecoration: 'none' as const, textTransform: 'none' as const, letterSpacing: 0,
  },
  recentList: {
    display: 'flex', flexDirection: 'column' as const, gap: '6px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '8px',
  },
  recentItem: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '10px 12px', borderRadius: '10px',
    textDecoration: 'none' as const, color: 'inherit',
    transition: 'background 0.15s',
  },
  recentAvatar: {
    width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
    background: 'var(--accent-bg-2)', color: 'var(--accent-text)',
    border: '1px solid var(--accent-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-fraunces), serif', fontSize: '13px', fontWeight: 600,
  },
  recentBody: { flex: 1, minWidth: 0 },
  recentName: { fontSize: '13px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  recentEmail: { fontSize: '11.5px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, marginTop: '1px' },
  recentRight: { display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: '4px', flexShrink: 0 },
  recentPlan: { fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', letterSpacing: '0.3px' },
  recentDate: { fontSize: '10.5px', color: 'var(--text-muted)' },

  // ── Sparkline 12 mois ─────────────────────────────────────────────────────
  sparkWrap: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '20px 22px',
  },
  sparkHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' as const, marginBottom: '14px' },
  sparkLabel: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase' as const,
    color: 'var(--text-muted)', marginBottom: '6px',
  },
  sparkTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '22px', fontWeight: 400, color: 'var(--text)', lineHeight: 1.1 },
  sparkTitleSub: { fontSize: '14px', color: 'var(--text-3)', fontFamily: 'var(--font-outfit), sans-serif' },
  sparkSub: { fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' },
  sparkLegend: { display: 'flex', gap: '12px', alignItems: 'center' },

  sparkBars: {
    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
    gap: '4px', height: '90px', marginTop: '8px',
  },
  sparkBarCol: { flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '6px', minWidth: 0 },
  sparkBarStack: { width: '100%', height: '70px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  sparkBarTotal: {
    width: '100%', maxWidth: '24px',
    background: 'var(--accent-bg-2)', borderTop: '2px solid var(--accent-text)',
    borderRadius: '4px 4px 0 0',
    position: 'relative' as const,
    transition: 'height 0.4s ease',
    minHeight: '2px',
  },
  sparkBarPaid: {
    position: 'absolute' as const, bottom: 0, left: 0, right: 0,
    background: '#34D399', borderRadius: '0 0 0 0',
  },
  sparkLabel2: { fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' as const },

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
  tabActive: { background: 'var(--border-2)', color: 'var(--text)' },
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
