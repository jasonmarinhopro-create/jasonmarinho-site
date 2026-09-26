'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users, Warning, FileText, GraduationCap,
  UsersThree, ArrowRight, UsersFour, CalendarBlank, Trophy,
  BookOpen, Newspaper, Crown, ShieldStar, ShieldCheck, TrendUp, Lightning,
  Sparkle, CurrencyEur, ChartLineUp, Percent,
  UserPlus, Star, Globe, Broadcast, Handshake,
} from '@phosphor-icons/react/dist/ssr'
import {
  validateReport, deleteReport,
} from './actions'

interface RecentSignup {
  id: string; email: string; full_name: string | null; plan: string; created_at: string
}
interface MonthlySignup {
  month: string; total: number; paid: number
}
interface ChannelStat {
  channel: string; label: string; count: number; pct: number
}
interface TopPage {
  path: string; views: number
}
interface AffiliateClicks {
  total: number
  byPartner: Array<{ partner: string; count: number }>
  byPage: Array<{ path: string; count: number }>
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
  stats,
  recentSignups, monthlySignupsChart,
  liveVisitors, channelBreakdown, topPages, affiliateClicks,
}: {
  stats: Stats
  recentSignups: RecentSignup[]
  monthlySignupsChart: MonthlySignup[]
  liveVisitors: number
  channelBreakdown: ChannelStat[]
  topPages: TopPage[]
  affiliateClicks: AffiliateClicks
}) {
  const totalAlerts = stats.pendingDriing + stats.pendingReports
  const decouverte = stats.totalUsers - stats.standardMembers - stats.driingMembers
  // Seul Standard est payant ; Driing = gratuit pour les clients Driing existants
  const payingUsers = stats.standardMembers
  const conversionRate = stats.totalUsers > 0 ? (payingUsers / stats.totalUsers) * 100 : 0
  const arpu = payingUsers > 0 ? stats.mrr / payingUsers : 0
  const arr = stats.mrr * 12

  return (
    <div style={s.wrap}>

      {/* ── Bannière admin ── */}
      <div style={s.hero}>
        <style>{`
          /* Mobile : position absolute → static pour éviter l'overlap avec
             le badge "ESPACE PRIVÉ" qui wrap sur 2 lignes. La couronne
             cachée pour gagner de la place visuelle. */
          @media (max-width: 640px) {
            .admin-hero-alert {
              position: static !important;
              display: inline-flex !important;
              margin-bottom: 10px !important;
            }
            .admin-hero-crown {
              display: none !important;
            }
          }
        `}</style>
        <div style={s.heroGlow} />
        <div style={s.heroContent}>
          {totalAlerts > 0 && (
            <Link href="/dashboard/admin/qg" className="admin-hero-alert" style={{ ...s.heroAlert, textDecoration: 'none' }}>
              <Warning size={14} weight="fill" />
              {totalAlerts} action{totalAlerts > 1 ? 's' : ''} en attente
            </Link>
          )}
          <div style={s.heroBadge}>
            <ShieldStar size={11} weight="fill" />
            Espace privé · Accès restreint
          </div>
          <h1 style={s.heroTitle}>Administration</h1>
          <p style={s.heroSub}>{formatDateLong()}</p>
        </div>
        <div className="admin-hero-crown" style={s.heroCrown}>
          <Crown size={42} weight="duotone" />
        </div>
      </div>

      {/* ── Bandeau KPIs financiers ── */}
      <div style={s.kpiBar}>
        <div style={{ ...s.kpiCard, borderColor: 'rgba(21,128,61,0.25)' }}>
          <div style={{ ...s.kpiIcon, background: 'rgba(21,128,61,0.14)', color: '#15803d', border: '1px solid rgba(21,128,61,0.25)' }}>
            <CurrencyEur size={18} weight="duotone" />
          </div>
          <div style={s.kpiBody}>
            <div style={s.kpiLabel}>MRR estimé</div>
            <div style={{ ...s.kpiValue, color: '#15803d' }}>{formatEuro(stats.mrr)}</div>
            <div style={s.kpiSub}>{payingUsers} Standard × 19,98 €/an</div>
          </div>
        </div>

        <div style={{ ...s.kpiCard, borderColor: 'rgba(124,58,237,0.25)' }}>
          <div style={{ ...s.kpiIcon, background: 'rgba(124,58,237,0.14)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.25)' }}>
            <ChartLineUp size={18} weight="duotone" />
          </div>
          <div style={s.kpiBody}>
            <div style={s.kpiLabel}>ARR projeté</div>
            <div style={{ ...s.kpiValue, color: '#7c3aed' }}>{formatEuro(arr, 0)}</div>
            <div style={s.kpiSub}>MRR × 12 mois</div>
          </div>
        </div>

        <div style={{ ...s.kpiCard, borderColor: 'var(--accent-border)' }}>
          <div style={{ ...s.kpiIcon, background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}>
            <Percent size={18} weight="duotone" />
          </div>
          <div style={s.kpiBody}>
            <div style={s.kpiLabel}>Conversion</div>
            <div style={{ ...s.kpiValue, color: 'var(--accent-text)' }}>{conversionRate.toFixed(1)}%</div>
            <div style={s.kpiSub}>{payingUsers}/{stats.totalUsers} en Standard</div>
          </div>
        </div>

        <div style={{ ...s.kpiCard, borderColor: 'rgba(3,105,161,0.25)' }}>
          <div style={{ ...s.kpiIcon, background: 'rgba(3,105,161,0.14)', color: '#0369a1', border: '1px solid rgba(3,105,161,0.25)' }}>
            <UserPlus size={18} weight="duotone" />
          </div>
          <div style={s.kpiBody}>
            <div style={s.kpiLabel}>ARPU</div>
            <div style={{ ...s.kpiValue, color: '#0369a1' }}>{formatEuro(arpu)}</div>
            <div style={s.kpiSub}>par Standard / mois</div>
          </div>
        </div>
      </div>

      {/* ── Trafic en direct ── */}
      <LiveTraffic initialLive={liveVisitors} initialChannels={channelBreakdown} topPages={topPages} />

      {/* ── Clics partenaires (liens affiliés) ── */}
      <AffiliateClicksCard data={affiliateClicks} />

      {/* ── Sparkline 12 mois ── */}
      <SignupsSparkline data={monthlySignupsChart} />

      <div style={s.mainStack}>

      {/* ── Répartition membres ── */}
      <div className="fade-up">
        <div style={s.sectionLabel}>
          <TrendUp size={13} />
          Membres · répartition par plan
        </div>
        <div style={s.plansGrid}>
          <div style={s.planCard}>
            <div style={s.planTop}>
              <span style={{ ...s.planDot, background: '#475569' }} />
              <span style={s.planName}>Découverte</span>
              <span style={s.planCount}>{decouverte < 0 ? 0 : decouverte}</span>
            </div>
            <div style={s.planBar}>
              <div style={{ ...s.planFill, width: `${stats.totalUsers > 0 ? Math.round((Math.max(0,decouverte) / stats.totalUsers) * 100) : 0}%`, background: '#475569' }} />
            </div>
          </div>
          <div style={{ ...s.planCard, borderColor: 'rgba(21,128,61,0.32)', background: 'rgba(21,128,61,0.04)' }}>
            <div style={s.planTop}>
              <span style={{ ...s.planDot, background: '#15803d' }} />
              <span style={s.planName}>Standard <span style={{ fontSize: '10px', color: '#15803d', fontWeight: 700 }}>19,98 €/an</span></span>
              <span style={{ ...s.planCount, color: '#15803d' }}>{stats.standardMembers}</span>
            </div>
            <div style={s.planBar}>
              <div style={{ ...s.planFill, width: `${stats.totalUsers > 0 ? Math.round((stats.standardMembers / stats.totalUsers) * 100) : 0}%`, background: '#15803d' }} />
            </div>
          </div>
          <div style={{ ...s.planCard, borderColor: 'rgba(124,58,237,0.32)', background: 'rgba(124,58,237,0.04)' }}>
            <div style={s.planTop}>
              <span style={{ ...s.planDot, background: '#7c3aed' }} />
              <span style={s.planName}>Driing <span style={{ fontSize: '10px', color: '#7c3aed', fontWeight: 700 }}>gratuit</span></span>
              <span style={{ ...s.planCount, color: '#7c3aed' }}>{stats.driingMembers}</span>
            </div>
            <div style={s.planBar}>
              <div style={{ ...s.planFill, width: `${stats.totalUsers > 0 ? Math.round((stats.driingMembers / stats.totalUsers) * 100) : 0}%`, background: '#7c3aed' }} />
            </div>
          </div>
          <div style={{ ...s.planCard, borderColor: 'rgba(244,114,182,0.32)', background: 'rgba(244,114,182,0.04)' }}>
            <div style={s.planTop}>
              <Sparkle size={12} color="#db2777" weight="fill" />
              <span style={s.planName}>Nouveaux ce mois</span>
              <span style={{ ...s.planCount, color: '#db2777' }}>+{stats.newThisMonth}</span>
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
            <div style={{ ...s.actIcon, color: 'var(--success-1)', background: 'var(--success-bg)' }}>
              <CalendarBlank size={20} weight="duotone" />
            </div>
            <div>
              <div style={{ ...s.actVal, color: 'var(--success-1)' }}>{stats.totalSejours}</div>
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
            { href: '/dashboard/admin/formations', icon: GraduationCap, color: 'var(--success-1)', bg: 'rgba(52,211,153,0.1)',  title: 'Formations',  desc: `${stats.formationsCount} publiée${stats.formationsCount !== 1 ? 's' : ''}` },
            { href: '/dashboard/admin/actualites', icon: Newspaper,     color: '#f472b6', bg: 'rgba(244,114,182,0.1)', title: 'Actualités',  desc: 'Fil LCD' },
            { href: '/dashboard/admin/communaute', icon: UsersThree,    color: '#93C5FD', bg: 'rgba(147,197,253,0.1)', title: 'Communauté',  desc: `${stats.groupsCount} groupe${stats.groupsCount !== 1 ? 's' : ''}` },
            { href: '/dashboard/admin/guides',     icon: BookOpen,      color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  title: 'Guide LCD',   desc: 'Profils & fiches' },
            { href: '/dashboard/admin/sos-feedback', icon: Warning,     color: 'var(--danger)', bg: 'rgba(220,38,38,0.1)',   title: 'SOS Feedback', desc: 'Signalements & témoignages' },
            { href: '/dashboard/admin/qg', icon: ShieldCheck, color: '#f87171', bg: 'rgba(248,113,113,0.1)', title: 'Signalements', desc: `${stats.pendingReports} à valider` },
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
                ? { label: 'Driing', color: '#7c3aed', bg: 'rgba(124,58,237,0.14)' }
                : u.plan === 'standard'
                ? { label: 'Standard', color: '#15803d', bg: 'rgba(21,128,61,0.14)' }
                : { label: 'Découverte', color: 'var(--text-2)', bg: 'var(--border)' }
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

    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────
const CHANNEL_COLORS: Record<string, string> = {
  direct: '#475569',
  recherche: '#15803d',
  social: '#db2777',
  referral: '#0369a1',
}

function pageLabel(path: string) {
  return path === '/' ? 'Accueil' : path
}

function LiveTraffic({ initialLive, initialChannels, topPages }: { initialLive: number; initialChannels: ChannelStat[]; topPages: TopPage[] }) {
  const [live, setLive] = useState(initialLive)
  const [channels, setChannels] = useState(initialChannels)

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/admin/live-traffic', { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json()
        if (typeof json.live === 'number') setLive(json.live)
        if (Array.isArray(json.channels)) setChannels(json.channels)
      } catch {
        // silencieux : on garde l'affichage précédent
      }
    }
    const interval = setInterval(poll, 25_000)
    return () => clearInterval(interval)
  }, [])

  const totalSessions = channels.reduce((sum, c) => sum + c.count, 0)

  return (
    <div className="fade-up">
      <div style={s.sectionLabel}>
        <Globe size={13} />
        Trafic du site · en direct
      </div>
      <style>{`
        @media (max-width: 900px) {
          .admin-traffic-grid { grid-template-columns: minmax(180px,260px) 1fr !important; }
          .admin-traffic-grid > *:last-child { grid-column: 1 / -1; }
        }
        @media (max-width: 560px) {
          .admin-traffic-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div className="admin-traffic-grid" style={s.trafficGrid}>
        <div style={s.liveCard}>
          <div style={s.liveTop}>
            <span style={{ ...s.liveDot, animation: live > 0 ? 'pulse 2s ease-in-out infinite' : undefined }} />
            <span style={s.liveLabel}>En ce moment</span>
          </div>
          <div style={s.liveValue}>{live}</div>
          <div style={s.liveSub}>visiteur{live !== 1 ? 's' : ''} actif{live !== 1 ? 's' : ''} (5 min)</div>
        </div>

        <div style={s.channelCard}>
          <div style={s.liveTop}>
            <Broadcast size={14} weight="duotone" style={{ color: 'var(--text-2)' }} />
            <span style={s.liveLabel}>Par canal · dernières 24h</span>
          </div>
          {channels.length === 0 || totalSessions === 0 ? (
            <div style={{ fontSize: '12.5px', color: 'var(--text-3)', marginTop: '6px' }}>
              Pas encore de visite enregistrée aujourd'hui.
            </div>
          ) : (
            <div style={s.channelList}>
              {channels.map(c => (
                <div key={c.channel} style={s.channelRow}>
                  <span style={{ ...s.planDot, background: CHANNEL_COLORS[c.channel] || '#475569' }} />
                  <span style={s.channelName}>{c.label}</span>
                  <span style={s.channelPct}>{c.pct}%</span>
                  <span style={s.channelCount}>{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={s.channelCard}>
          <div style={s.liveTop}>
            <Trophy size={14} weight="duotone" style={{ color: 'var(--text-2)' }} />
            <span style={s.liveLabel}>Pages les plus vues · 7 jours</span>
          </div>
          {topPages.length === 0 ? (
            <div style={{ fontSize: '12.5px', color: 'var(--text-3)', marginTop: '6px' }}>
              Pas encore de données sur cette période.
            </div>
          ) : (
            <div style={s.channelList}>
              {topPages.map((p, i) => (
                <div key={p.path} style={s.channelRow}>
                  <span style={s.topPageRank}>{i + 1}</span>
                  <span style={s.topPagePath} title={p.path}>{pageLabel(p.path)}</span>
                  <span style={s.channelCount}>{p.views}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AffiliateClicksCard({ data }: { data: AffiliateClicks }) {
  return (
    <div className="fade-up">
      <div style={s.sectionLabel}>
        <Handshake size={13} />
        Clics partenaires · 30 derniers jours
      </div>
      <div className="admin-traffic-grid" style={s.trafficGrid}>
        <div style={s.liveCard}>
          <div style={s.liveTop}>
            <span style={s.liveLabel}>Clics sur les liens affiliés</span>
          </div>
          <div style={{ ...s.liveValue, color: 'var(--text)' }}>{data.total}</div>
          <div style={s.liveSub}>vers les sites partenaires</div>
        </div>
        <div style={s.channelCard}>
          <div style={s.liveTop}>
            <span style={s.liveLabel}>Par partenaire</span>
          </div>
          {data.byPartner.length === 0 ? (
            <div style={{ fontSize: '12.5px', color: 'var(--text-3)', marginTop: '6px' }}>Aucun clic pour l&apos;instant.</div>
          ) : (
            <div style={s.channelList}>
              {data.byPartner.map(p => (
                <div key={p.partner} style={s.channelRow}>
                  <span style={{ ...s.channelName, textTransform: 'capitalize' }}>{p.partner}</span>
                  <span style={s.channelPct}>{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={s.channelCard}>
          <div style={s.liveTop}>
            <span style={s.liveLabel}>Pages qui envoient des clics</span>
          </div>
          {data.byPage.length === 0 ? (
            <div style={{ fontSize: '12.5px', color: 'var(--text-3)', marginTop: '6px' }}>Aucun clic pour l&apos;instant.</div>
          ) : (
            <div style={s.channelList}>
              {data.byPage.map(p => (
                <div key={p.path} style={s.channelRow}>
                  <span style={s.topPagePath} title={p.path}>{pageLabel(p.path)}</span>
                  <span style={s.channelCount}>{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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
            dont <strong style={{ color: 'var(--success-1)' }}>{totalPaid}</strong> payants ·
            {trendPct !== null && (
              <span style={{ color: trendPct >= 0 ? 'var(--success-1)' : 'var(--danger)', marginLeft: '6px', fontWeight: 600 }}>
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
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--success-1)' }} />
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

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '32px' },

  // ── Main layout (colonne unique) ────────────────────────────────────────
  mainStack: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '32px',
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
  kpiLabel: { fontSize: '11px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase' as const, letterSpacing: '0.7px', marginBottom: '4px' },
  kpiValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: '26px', fontWeight: 500, lineHeight: 1.1, marginBottom: '3px' },
  kpiSub: { fontSize: '11.5px', color: 'var(--text-2)', fontWeight: 500 },

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
    background: 'var(--success-1)', borderRadius: '0 0 0 0',
  },
  sparkLabel2: { fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' as const },

  // Admin hero banner avec mesh gradient 2026
  hero: {
    position: 'relative' as const,
    background: 'radial-gradient(ellipse 60% 80% at 100% 0%, rgba(124,58,237,0.22), transparent 60%), radial-gradient(ellipse 50% 60% at 0% 100%, rgba(255,213,107,0.10), transparent 60%), var(--surface)',
    border: '1px solid rgba(124,58,237,0.32)',
    borderRadius: 'var(--r-xl)',
    padding: 'clamp(28px,3vw,40px) clamp(28px,4vw,44px)',
    overflow: 'hidden' as const,
    boxShadow: 'var(--shadow-md)',
  },
  heroGlow: {
    position: 'absolute' as const, top: '-60px', right: '-60px',
    width: '240px', height: '240px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
    pointerEvents: 'none' as const,
  },
  heroContent: { position: 'relative' as const, zIndex: 1 },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 'var(--s-2)',
    fontSize: 'var(--t-xs)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' as const,
    color: '#7c3aed',
    background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.40)',
    borderRadius: 'var(--r-pill)', padding: '5px 14px', marginBottom: 'var(--s-4)',
    boxShadow: '0 0 0 4px rgba(124,58,237,0.06)',
  },
  heroTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(28px,3vw,42px)',
    fontWeight: 400,
    color: 'var(--text)',
    margin: '0 0 var(--s-2)',
    lineHeight: 'var(--lh-tight)',
    letterSpacing: 'var(--ls-tight)',
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
    color: 'rgba(124,58,237,0.35)',
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
    color: 'var(--text-2)', marginBottom: '14px',
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

  // Trafic en direct
  trafficGrid: {
    display: 'grid', gridTemplateColumns: 'minmax(180px,260px) 1fr 1fr', gap: '12px',
  },
  liveCard: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '16px 18px',
  },
  liveTop: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  liveDot: { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-1)', flexShrink: 0 },
  liveLabel: { fontSize: '12px', color: 'var(--text-2)', fontWeight: 600 },
  liveValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: '34px', fontWeight: 500, lineHeight: 1, color: 'var(--success-1)' },
  liveSub: { fontSize: '11.5px', color: 'var(--text-3)', marginTop: '4px' },
  channelCard: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '16px 18px',
  },
  channelList: { display: 'flex', flexDirection: 'column' as const, gap: '9px', marginTop: '4px' },
  channelRow: { display: 'flex', alignItems: 'center', gap: '9px' },
  channelName: { fontSize: '12.5px', color: 'var(--text-2)', flex: 1 },
  channelPct: { fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', minWidth: '32px', textAlign: 'right' as const },
  channelCount: { fontSize: '11px', color: 'var(--text-3)', minWidth: '26px', textAlign: 'right' as const },
  topPageRank: { fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', width: '14px', flexShrink: 0 },
  topPagePath: {
    fontSize: '12.5px', color: 'var(--text-2)', flex: 1, minWidth: 0,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },

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

}
