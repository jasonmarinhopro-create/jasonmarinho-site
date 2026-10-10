'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users, Warning, FileText, GraduationCap,
  UsersThree, ArrowRight, UsersFour, CalendarBlank, Trophy,
  BookOpen, Newspaper, ShieldStar, ShieldCheck, TrendUp, Lightning,
  Sparkle, CurrencyEur, ChartLineUp, Percent, CheckCircle,
  UserPlus, Globe, Broadcast, Handshake, Bug, ShareNetwork, MagnifyingGlass,
  Crown, Lifebuoy, Camera, Broom,
} from '@phosphor-icons/react/dist/ssr'
import { resolveAppErrorGroup } from './actions'
import type { AffilaeOverview } from '@/lib/affiliation/affilae'
import type { PartnerStackOverview } from '@/lib/affiliation/partnerstack'
import HubHero, { HeroEm, heroCard, heroCta, heroLink } from '@/components/dashboard/HubHero'

interface RecentSignup {
  id: string; email: string; full_name: string | null; plan: string; created_at: string
  /** Fiches pros du compte (photographe, ménage) */
  pros?: Array<{ kind: 'photographe' | 'menage'; tier: string | null; paid: boolean; status: string | null }>
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
interface AppErrors {
  total: number
  groups: Array<{ key: string; message: string; source: 'client' | 'server'; count: number; users: number; lastAt: string; path: string | null }>
}
interface Stats {
  totalUsers: number; driingMembers: number; standardMembers: number; newThisMonth: number
  pendingDriing: number; pendingReports: number; suggestions: number
  templatesCount: number; formationsCount: number; groupsCount: number
  totalVoyageurs: number; totalSejours: number
  topFormation: { title: string; count: number } | null
  mrr: number
  revenue: {
    annual: number; monthly: number; hostAnnual: number; photoAnnual: number; cleanAnnual: number
    paidPhotographers: number; paidCleaners: number; subscriptions: number
  }
  photographersCount: number
  cleanersCount: number
  completedFormations: number
}

// Couleurs de la marque (pas de bleu ni de violet, cf. CLAUDE.md)
const AMBER = '#B7791F'
const PINK = '#B83A7C'
const BROWN = '#6E5446'
const tint = (c: string, pct = 12) => `color-mix(in srgb, ${c} ${pct}%, transparent)`

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
  if (days <= 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} j`
  if (days < 30) return `il y a ${Math.floor(days / 7)} sem.`
  if (days < 365) return `il y a ${Math.floor(days / 30)} mois`
  return `il y a ${Math.floor(days / 365)} an${days >= 730 ? 's' : ''}`
}
// Dépend de l'heure courante : le navigateur garde sa valeur (cf. RelativeTime)
function Ago({ iso }: { iso: string }) {
  return <time dateTime={iso} suppressHydrationWarning>{relativeDate(iso)}</time>
}
const plural = (n: number, word: string, many?: string) => `${n} ${n > 1 ? (many ?? `${word}s`) : word}`

export default function AdminUI({
  todayLabel,
  stats,
  recentSignups, monthlySignupsChart,
  liveVisitors, channelBreakdown, topPages, affiliateClicks, appErrors, affilaeSlot, acquisitionSlot,
}: {
  todayLabel: string
  stats: Stats
  recentSignups: RecentSignup[]
  monthlySignupsChart: MonthlySignup[]
  liveVisitors: number
  channelBreakdown: ChannelStat[]
  topPages: TopPage[]
  affiliateClicks: AffiliateClicks
  appErrors: AppErrors
  /** Carte Affilae, chargée à part (appel externe) pour ne pas retarder la page */
  affilaeSlot?: React.ReactNode
  /** Provenance des visiteurs, aujourd'hui / 7 jours (diffusée à part : Google Search Console) */
  acquisitionSlot?: React.ReactNode
}) {
  const decouverte = Math.max(0, stats.totalUsers - stats.standardMembers - stats.driingMembers)
  // Payants : Standard des hôtes + fiches photographes et ménage payées
  // (Driing = offert aux clients Driing)
  const rv = stats.revenue
  const paidPros = rv.paidPhotographers + rv.paidCleaners
  const payingUsers = rv.subscriptions
  const conversionRate = stats.totalUsers > 0 ? (payingUsers / stats.totalUsers) * 100 : 0
  const arpu = payingUsers > 0 ? stats.mrr / payingUsers : 0
  const arr = rv.annual
  const revenueSub = [
    `${plural(stats.standardMembers, 'Standard', 'Standard')}`,
    rv.paidPhotographers > 0 ? plural(rv.paidPhotographers, 'photographe') : '',
    rv.paidCleaners > 0 ? plural(rv.paidCleaners, 'équipe ménage', 'équipes ménage') : '',
  ].filter(Boolean).join(' + ')
  const pct = (n: number) => stats.totalUsers > 0 ? Math.round((n / stats.totalUsers) * 100) : 0

  const todo = [
    { n: stats.pendingDriing, label: 'demande Driing à valider', labelN: 'demandes Driing à valider', href: '/dashboard/admin/qg', icon: Crown },
    { n: stats.pendingReports, label: 'signalement à valider', labelN: 'signalements à valider', href: '/dashboard/admin/qg', icon: ShieldCheck },
    { n: stats.suggestions, label: 'suggestion reçue', labelN: 'suggestions reçues', href: '/dashboard/admin/qg', icon: Sparkle },
    { n: appErrors.groups.length, label: "erreur de l'app à regarder", labelN: "erreurs de l'app à regarder", href: '#erreurs', icon: Bug },
  ]
  const todoCount = todo.reduce((n, t) => n + t.n, 0)

  const kpis = [
    { label: 'Revenu mensuel', value: formatEuro(stats.mrr), sub: `${revenueSub}, annuel ÷ 12`, icon: CurrencyEur, color: 'var(--accent-text)' },
    { label: 'Revenu annuel', value: formatEuro(arr, 2), sub: `hôtes ${formatEuro(rv.hostAnnual, 2)} · pros ${formatEuro(rv.photoAnnual + rv.cleanAnnual, 2)}`, icon: ChartLineUp, color: AMBER },
    { label: 'Conversion', value: `${conversionRate.toFixed(1).replace('.', ',')} %`, sub: `${payingUsers} abonnement${payingUsers > 1 ? 's' : ''} payant${payingUsers > 1 ? 's' : ''} sur ${stats.totalUsers} comptes`, icon: Percent, color: 'var(--accent-text)' },
    { label: 'Par abonné', value: formatEuro(arpu), sub: 'par mois', icon: UserPlus, color: BROWN },
  ]

  const plans = [
    { name: 'Découverte', note: 'gratuit', count: decouverte, color: 'var(--text-muted)' },
    { name: 'Standard', note: '19,98 €/an', count: stats.standardMembers, color: 'var(--accent-text)' },
    { name: 'Driing', note: 'offert', count: stats.driingMembers, color: AMBER },
    { name: 'Photographes', note: `${rv.paidPhotographers} payée${rv.paidPhotographers > 1 ? 's' : ''}`, count: stats.photographersCount, color: PINK },
    { name: 'Équipes ménage', note: `${rv.paidCleaners} payée${rv.paidCleaners > 1 ? 's' : ''}`, count: stats.cleanersCount, color: BROWN },
  ]

  const content = [
    { href: '/dashboard/admin/membres', icon: UsersThree, color: 'var(--accent-text)', title: 'Membres', desc: `${stats.totalUsers} inscrits, ${stats.driingMembers} Driing` },
    { href: '/dashboard/admin/qg', icon: ShieldCheck, color: 'var(--danger-text)', title: 'QG demandes', desc: todoCount - appErrors.groups.length > 0 ? `${todoCount - appErrors.groups.length} en attente` : 'Rien en attente' },
    { href: '/dashboard/admin/formations', icon: GraduationCap, color: 'var(--accent-text)', title: 'Formations', desc: plural(stats.formationsCount, 'publiée') },
    { href: '/dashboard/admin/gabarits', icon: FileText, color: AMBER, title: 'Modèles de messages', desc: plural(stats.templatesCount, 'modèle') },
    { href: '/dashboard/admin/actualites', icon: Newspaper, color: PINK, title: 'Actualités', desc: 'Fil de la veille LCD' },
    { href: '/dashboard/admin/social', icon: ShareNetwork, color: PINK, title: 'Réseaux sociaux', desc: 'Posts Facebook et Instagram' },
    { href: '/dashboard/admin/communaute', icon: UsersFour, color: BROWN, title: 'Groupes Facebook', desc: plural(stats.groupsCount, 'groupe') },
    { href: '/dashboard/admin/guides', icon: BookOpen, color: AMBER, title: 'Guide LCD', desc: 'Profils et fiches' },
    { href: '/dashboard/admin/indexation', icon: MagnifyingGlass, color: BROWN, title: 'Indexation Google', desc: 'Pages à soumettre' },
    { href: '/dashboard/admin/sos-feedback', icon: Lifebuoy, color: 'var(--danger-text)', title: 'Retours SOS', desc: 'Signalements et témoignages' },
  ]

  return (
    <div style={s.wrap}>
      <HubHero
        eyebrowIcon={<ShieldStar size={14} weight="fill" />}
        eyebrow={`Administration · ${todayLabel}`}
        title={<>Ta plateforme, <HeroEm>en un coup d&apos;œil</HeroEm></>}
        desc={<>{stats.totalUsers} comptes (le tien compris) : {stats.standardMembers} en Standard, {stats.driingMembers} Driing{paidPros > 0 ? `, ${plural(paidPros, 'fiche pro payée', 'fiches pros payées')}` : ''}{stats.newThisMonth > 0 ? `, +${stats.newThisMonth} ce mois-ci` : ''}. {liveVisitors > 0 ? `${plural(liveVisitors, 'visiteur')} sur le site en ce moment.` : 'Personne sur le site en ce moment.'}</>}
        aside={
          <div style={{ ...heroCard, flex: '1 1 100%', minWidth: 0 }}>
            <div style={s.asideTitle}>À traiter</div>
            {todoCount === 0 ? (
              <div style={s.asideEmpty}><CheckCircle size={18} weight="fill" color="var(--accent-text)" /> Rien en attente, tout est à jour.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {todo.filter(t => t.n > 0).map(t => (
                  <Link key={t.label} href={t.href} style={s.asideRow}>
                    <t.icon size={16} weight="duotone" style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0 }}><strong style={{ color: 'var(--text)' }}>{t.n}</strong> {t.n > 1 ? t.labelN : t.label}</span>
                    <ArrowRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        }
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 18px' }}>
          <Link href="/dashboard/admin/qg" style={heroCta}><ShieldCheck size={17} weight="bold" /> Ouvrir le QG demandes</Link>
          <Link href="/dashboard/admin/membres" style={heroLink}>Membres</Link>
          <Link href="/dashboard/admin/social" style={heroLink}>Réseaux sociaux</Link>
        </div>
      </HubHero>

      <div style={s.kpiBar}>
        {kpis.map(k => (
          <div key={k.label} style={s.kpiCard}>
            <div style={{ ...s.kpiIcon, background: tint(k.color), color: k.color }}>
              <k.icon size={18} weight="duotone" />
            </div>
            <div style={s.kpiBody}>
              <div style={s.kpiLabel}>{k.label}</div>
              <div style={s.kpiValue}>{k.value}</div>
              <div style={s.kpiSub}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={s.cols}>
        <div style={s.colMain}>
          <LiveTraffic initialLive={liveVisitors} initialChannels={channelBreakdown} topPages={topPages} />

          {acquisitionSlot}

          <SignupsSparkline data={monthlySignupsChart} />

          <section className="fade-up">
            <div style={s.sectionLabel}><TrendUp size={14} /> Comptes par formule et par espace</div>
            <div style={s.plansGrid}>
              {plans.map(p => (
                <div key={p.name} style={s.planCard}>
                  <div style={s.planTop}>
                    <span style={{ ...s.planDot, background: p.color }} />
                    <span style={s.planName}>{p.name} <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{p.note}</span></span>
                    <span style={s.planCount}>{p.count}</span>
                  </div>
                  <div style={s.planBar}>
                    <div style={{ ...s.planFill, width: `${pct(p.count)}%`, background: p.color }} />
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>{pct(p.count)} % des comptes</div>
                </div>
              ))}
            </div>
          </section>

          <section className="fade-up">
            <div style={s.sectionLabel}><Lightning size={14} /> Activité des hôtes</div>
            <div style={s.activityRow}>
              {[
                { v: stats.totalVoyageurs, l: 'voyageurs enregistrés', icon: Users, color: BROWN },
                { v: stats.totalSejours, l: 'séjours saisis', icon: CalendarBlank, color: 'var(--accent-text)' },
                { v: stats.completedFormations, l: 'formations terminées', icon: GraduationCap, color: AMBER },
              ].map(a => (
                <div key={a.l} style={s.actCard}>
                  <div style={{ ...s.actIcon, color: a.color, background: tint(a.color) }}><a.icon size={20} weight="duotone" /></div>
                  <div>
                    <div style={s.actVal}>{a.v}</div>
                    <div style={s.actLbl}>{a.l}</div>
                  </div>
                </div>
              ))}
              {stats.topFormation && (
                <div style={{ ...s.actCard, flex: '2 1 260px' }}>
                  <div style={{ ...s.actIcon, color: 'var(--accent-text)', background: 'var(--accent-bg)' }}><Trophy size={20} weight="duotone" /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.miniLabel}>Formation la plus commencée</div>
                    <div style={s.perfTitle} title={stats.topFormation.title}>{stats.topFormation.title}</div>
                    <div style={s.actLbl}>{plural(stats.topFormation.count, 'inscription')}</div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <AffiliateClicksCard data={affiliateClicks} />
          {affilaeSlot}
        </div>

        <div style={s.colSide}>
          <AppErrorsCard data={appErrors} />

          <section className="fade-up">
            <div style={s.sectionLabel}><FileText size={14} /> Gérer le contenu</div>
            <div style={s.contentList}>
              {content.map(({ href, icon: Icon, color, title, desc }) => (
                <Link key={href} href={href} style={s.contentRow}>
                  <div style={{ ...s.contentIcon, color, background: tint(color) }}><Icon size={18} weight="duotone" /></div>
                  <div style={s.contentBody}>
                    <div style={s.contentTitle}>{title}</div>
                    <div style={s.contentDesc}>{desc}</div>
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </section>

          {recentSignups.length > 0 && (
            <section className="fade-up">
              <div style={s.sectionLabel}>
                <UserPlus size={14} /> Derniers inscrits
                <Link href="/dashboard/admin/membres" style={s.sectionLink}>Tous les membres <ArrowRight size={11} weight="bold" /></Link>
              </div>
              <div style={s.recentList}>
                {recentSignups.map(u => {
                  // Un compte pro garde la formule hôte « Découverte » : on
                  // affiche alors sa fiche pro, pas « Découverte »
                  const pros = u.pros ?? []
                  const planCfg = u.plan === 'driing'
                    ? { label: 'Driing', color: AMBER }
                    : u.plan === 'standard'
                    ? { label: 'Standard', color: 'var(--accent-text)' }
                    : pros.length > 0 ? null
                    : { label: 'Découverte', color: 'var(--text-3)' }
                  const initial = (u.full_name || u.email).slice(0, 1).toUpperCase()
                  return (
                    <Link key={u.id} href={`/dashboard/admin/membres/${u.id}`} style={s.recentItem}>
                      <div style={s.recentAvatar}>{initial}</div>
                      <div style={s.recentBody}>
                        <div style={s.recentName}>{u.full_name || u.email.split('@')[0]}</div>
                        <div style={s.recentEmail}>{u.email}</div>
                      </div>
                      <div style={s.recentRight}>
                        <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {pros.map(p => {
                            const c = p.kind === 'photographe' ? PINK : BROWN
                            const Icon = p.kind === 'photographe' ? Camera : Broom
                            return (
                              <span key={p.kind} style={{ ...s.recentPlan, color: c, background: tint(c), display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Icon size={11} weight="bold" />{p.kind === 'photographe' ? 'Photographe' : 'Ménage'}{p.paid ? (p.tier === 'fondateur' ? ' · fondateur' : ' · payé') : ' · à payer'}
                              </span>
                            )
                          })}
                          {planCfg && <span style={{ ...s.recentPlan, color: planCfg.color, background: tint(planCfg.color) }}>{planCfg.label}</span>}
                        </span>
                        <span style={s.recentDate}><Ago iso={u.created_at} /></span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sous-composants ────────────────────────────────────────────────────────
const CHANNEL_COLORS: Record<string, string> = {
  direct: 'var(--text-muted)',
  recherche: 'var(--accent-text)',
  social: PINK,
  referral: AMBER,
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
    // Toutes les 60 s, seulement onglet visible : chaque relecture coûte de la
    // lecture disque à la base (budget Disk IO de l'offre gratuite, 05/10/2026)
    const tick = () => { if (document.visibilityState === 'visible') poll() }
    const interval = setInterval(tick, 60_000)
    return () => clearInterval(interval)
  }, [])

  const totalSessions = channels.reduce((sum, c) => sum + c.count, 0)

  return (
    <section className="fade-up">
      <div style={s.sectionLabel}><Globe size={14} /> Trafic du site en direct</div>
      <div style={s.trafficGrid}>
        <div style={s.card}>
          <div style={s.liveTop}>
            <span style={{ ...s.liveDot, animation: live > 0 ? 'pulse 2s ease-in-out infinite' : undefined }} />
            <span style={s.liveLabel}>En ce moment</span>
          </div>
          <div style={s.liveValue}>{live}</div>
          <div style={s.liveSub}>visiteur{live !== 1 ? 's' : ''} actif{live !== 1 ? 's' : ''} (5 min)</div>
        </div>

        <div style={s.card}>
          <div style={s.liveTop}>
            <Broadcast size={14} weight="duotone" style={{ color: 'var(--text-2)' }} />
            <span style={s.liveLabel}>D&apos;où ils viennent · 24 h</span>
          </div>
          {channels.length === 0 || totalSessions === 0 ? (
            <div style={s.empty}>Pas encore de visite enregistrée aujourd&apos;hui.</div>
          ) : (
            <div style={s.channelList}>
              {channels.map(c => (
                <div key={c.channel} style={s.channelRow}>
                  <span style={{ ...s.planDot, background: CHANNEL_COLORS[c.channel] || 'var(--text-muted)' }} />
                  <span style={s.channelName}>{c.label}</span>
                  <span style={s.channelPct}>{c.pct} %</span>
                  <span style={s.channelCount}>{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={s.card}>
          <div style={s.liveTop}>
            <Trophy size={14} weight="duotone" style={{ color: 'var(--text-2)' }} />
            <span style={s.liveLabel}>Pages les plus vues · 7 jours</span>
          </div>
          {topPages.length === 0 ? (
            <div style={s.empty}>Pas encore de données sur cette période.</div>
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
    </section>
  )
}

function AffiliateClicksCard({ data }: { data: AffiliateClicks }) {
  return (
    <section className="fade-up">
      <div style={s.sectionLabel}><Handshake size={14} /> Clics vers les partenaires · 30 jours</div>
      <div style={s.trafficGrid}>
        <div style={s.card}>
          <div style={s.liveTop}><span style={s.liveLabel}>Clics sur les liens affiliés</span></div>
          <div style={{ ...s.liveValue, color: 'var(--text)' }}>{data.total}</div>
          <div style={s.liveSub}>vers les sites partenaires (un clic n&apos;est pas une vente)</div>
        </div>
        <div style={s.card}>
          <div style={s.liveTop}><span style={s.liveLabel}>Par partenaire</span></div>
          {data.byPartner.length === 0 ? (
            <div style={s.empty}>Aucun clic pour l&apos;instant.</div>
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
        <div style={s.card}>
          <div style={s.liveTop}><span style={s.liveLabel}>Pages qui envoient des clics</span></div>
          {data.byPage.length === 0 ? (
            <div style={s.empty}>Aucun clic pour l&apos;instant.</div>
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
    </section>
  )
}

// Affiliation (06/10/2026, Jason : « ne parle que d'Affilae », « une liste
// aussi longue qu'une liste de courses ») : ventes des deux réseaux suivis
// (Affilae : Indy, LegalPlace, Tiime ; PartnerStack : Brevo), partenariats
// actifs seulement, candidatures en attente repliées. Relu toutes les 10 min.
const euros = (cents: number) => (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

type NetRow = { key: string; name: string; net: 'Affilae' | 'PartnerStack'; detail: string; cents: number }

export function AffiliationCard({ af, ps }: { af: AffilaeOverview; ps: PartnerStackOverview }) {
  const afOk = af.state === 'ok' ? af : null
  const psOk = ps.state === 'ok' ? ps : null
  const issues = [
    af.state === 'erreur' ? `Affilae : ${af.message}` : af.state === 'absent' ? 'Affilae : clé AFFILAE_API_KEY absente dans Vercel' : null,
    ps.state === 'erreur' ? `PartnerStack : ${ps.message}` : ps.state === 'absent' ? 'PartnerStack : clé PARTNERSTACK_API_KEY absente dans Vercel' : null,
    afOk && afOk.missing.length ? `Affilae a été lent (${afOk.missing.join(', ')} manquants), recharge dans quelques minutes` : null,
    psOk && psOk.missing.length ? `PartnerStack a été lent (${psOk.missing.join(', ')} manquants), recharge dans quelques minutes` : null,
  ].filter((x): x is string => !!x)

  // Partenariats actifs (ceux qui peuvent rapporter)
  const active: NetRow[] = [
    ...(afOk?.summary.programs.filter(p => p.status === 'actif').map(p => ({
      key: `af-${p.id}`, name: p.name, net: 'Affilae' as const, cents: p.commissionCents,
      detail: [p.clicks != null ? plural(p.clicks, 'clic') : null, plural(p.conversions, 'vente')].filter(Boolean).join(' · '),
    })) ?? []),
    ...(psOk?.summary.programs.map(p => ({
      key: `ps-${p.name}`, name: p.name, net: 'PartnerStack' as const, cents: p.commissionCents,
      detail: [plural(p.customers, 'inscription'), plural(p.rewards, 'commission')].join(' · '),
    })) ?? []),
  ].sort((a, b) => b.cents - a.cents || a.name.localeCompare(b.name))
  // Brevo pas encore remonté par PartnerStack (aucune inscription) : visible quand même
  if (psOk && !active.some(r => r.net === 'PartnerStack')) active.push({ key: 'ps-brevo', name: 'Brevo', net: 'PartnerStack', cents: 0, detail: 'aucune inscription pour l\'instant' })
  const pending = afOk?.summary.programs.filter(p => p.status === 'en_attente') ?? []
  const others = afOk?.summary.programs.filter(p => p.status === 'refuse' || p.status === 'autre') ?? []

  const totalCents = (afOk?.summary.totals.commissionCents ?? 0) + (psOk?.summary.totals.commissionCents ?? 0)
  const pendingCents = (afOk?.summary.totals.byStatus.en_attente ?? 0) + (psOk?.summary.totals.byStatus.en_attente ?? 0)
  const sales = (afOk?.summary.totals.conversions ?? 0) + (psOk?.summary.totals.rewards ?? 0)
  const recent = [
    ...(afOk?.summary.recent.map(r => ({ ...r, net: 'Affilae' })) ?? []),
    ...(psOk?.summary.recent.map(r => ({ ...r, net: 'PartnerStack' })) ?? []),
  ].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')).slice(0, 5)
  const afClicks = afOk?.summary.totals.clicks ?? null
  const psSignups = psOk?.summary.totals.customers ?? null

  return (
    <section className="fade-up">
      <div style={s.sectionLabel}><Handshake size={14} /> Affiliation · ventes suivies (Affilae, PartnerStack)</div>
      {issues.length > 0 && <div style={{ ...s.empty, marginBottom: 10 }}>{issues.join('. ')}.</div>}
      <div style={s.trafficGrid}>
        <div style={s.card}>
          <div style={s.liveTop}><span style={s.liveLabel}>Commissions (depuis le début)</span></div>
          <div style={{ ...s.liveValue, color: 'var(--text)' }}>{euros(totalCents)}</div>
          <div style={s.liveSub}>
            {plural(sales, 'vente')}{pendingCents > 0 ? ` · ${euros(pendingCents)} en attente` : ''}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            <span style={chip}>{afOk ? `Affilae · ${euros(afOk.summary.totals.commissionCents)}` : 'Affilae indisponible'}</span>
            <span style={chip}>{psOk ? `PartnerStack · ${euros(psOk.summary.totals.commissionCents)}` : 'PartnerStack indisponible'}</span>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.liveTop}><span style={s.liveLabel}>Partenariats actifs</span></div>
          {active.length === 0 ? (
            <div style={s.empty}>Aucun partenariat actif pour l&apos;instant.</div>
          ) : (
            <div style={s.channelList}>
              {active.map(p => (
                <div key={p.key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={s.channelRow}>
                    <span style={{ ...s.channelName, fontWeight: 600, color: 'var(--text)' }}>{p.name}</span>
                    <span style={s.channelPct}>{euros(p.cents)}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{p.net} · {p.detail}</div>
                </div>
              ))}
            </div>
          )}
          {(pending.length > 0 || others.length > 0) && (
            <details style={{ marginTop: 12 }}>
              <summary style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer' }}>
                {pending.length > 0 ? `${plural(pending.length, 'candidature')} en attente sur Affilae` : ''}
                {pending.length > 0 && others.length > 0 ? ' · ' : ''}
                {others.length > 0 ? `${plural(others.length, 'autre programme')}` : ''}
              </summary>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {[...pending, ...others].map(p => <span key={p.id} style={chip} title={p.status === 'en_attente' ? 'Candidature en attente' : 'Autre statut'}>{p.name.split(' - ')[0]}</span>)}
              </div>
            </details>
          )}
        </div>

        <div style={s.card}>
          <div style={s.liveTop}><span style={s.liveLabel}>Dernières ventes</span></div>
          {recent.length === 0 ? (
            <div style={s.empty}>
              Pas encore de vente.
              {afClicks != null ? ` Clics comptés par Affilae : ${afClicks}.` : ''}
              {psSignups != null ? ` Inscriptions Brevo : ${psSignups}.` : ''}
            </div>
          ) : (
            <div style={s.channelList}>
              {recent.map((r, i) => (
                <div key={i} style={s.channelRow}>
                  <span style={s.channelName}>{r.program}{r.date ? ` · ${new Date(r.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' })}` : ''}</span>
                  <span style={s.channelPct}>{euros(r.commissionCents)}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 10 }}>
            <a href="https://affilae.com" target="_blank" rel="noopener noreferrer" style={extLink}>Ouvrir Affilae</a>
            <a href="https://dash.partnerstack.com" target="_blank" rel="noopener noreferrer" style={extLink}>Ouvrir PartnerStack</a>
            <Link href="/dashboard/admin/visibilite?onglet=partenaires" style={extLink}>Détail par partenaire</Link>
          </div>
        </div>
      </div>
    </section>
  )
}

const chip: React.CSSProperties = { fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 999, padding: '3px 9px' }
const extLink: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--accent-text)' }

// Erreurs de l'app en production (table app_errors, 7 jours) : remplace un
// outil type Sentry. Une erreur qui revient souvent ou touche plusieurs
// membres est à traiter en priorité.
function AppErrorsCard({ data }: { data: AppErrors }) {
  // « Réglée » : masque le groupe tout de suite, le supprime en base, le
  // réaffiche si la suppression échoue
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [failMsg, setFailMsg] = useState<string | null>(null)
  const groups = data.groups.filter(g => !hidden.has(g.key))
  const total = data.total - data.groups.filter(g => hidden.has(g.key)).reduce((n, g) => n + g.count, 0)
  async function resolve(key: string) {
    setBusyKey(key)
    setFailMsg(null)
    setHidden(prev => new Set(prev).add(key))
    const res = await resolveAppErrorGroup(key).catch(() => ({ error: 'Réseau indisponible' }))
    if (res.error) {
      setHidden(prev => { const n = new Set(prev); n.delete(key); return n })
      setFailMsg(`Suppression impossible : ${res.error}`)
    }
    setBusyKey(null)
  }
  return (
    <section className="fade-up" id="erreurs" style={{ scrollMarginTop: '80px' }}>
      <div style={s.sectionLabel}><Bug size={14} /> Erreurs de l&apos;app · 7 jours</div>
      <div style={s.card}>
        <div style={s.liveTop}>
          {total <= 0
            ? <CheckCircle size={16} weight="fill" color="var(--accent-text)" />
            : <Warning size={16} weight="fill" color="var(--danger-text)" />}
          <span style={s.liveLabel}>{total <= 0 ? 'Aucune erreur enregistrée' : `${plural(total, 'erreur')} enregistrée${total > 1 ? 's' : ''}`}</span>
        </div>
        {failMsg && <div style={{ fontSize: '12px', color: 'var(--danger-text)', marginTop: '6px' }}>{failMsg}</div>}
        {groups.length === 0 ? (
          <div style={s.empty}>
            Rien à signaler. Les plantages (écran d&apos;erreur, bug JavaScript, erreur serveur) apparaîtront ici.
          </div>
        ) : (
          <div style={{ ...s.channelList, gap: '12px' }}>
            {groups.map(g => (
              <div key={g.key} style={{ ...s.channelRow, alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'block', fontSize: '13px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={g.message}>{g.message}</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>
                    {g.count}× · {g.source === 'server' ? 'Serveur' : 'Navigateur'}{g.path ? ` · ${g.path}` : ''} · {g.users > 0 ? `${plural(g.users, 'membre')} · ` : ''}dernière <Ago iso={g.lastAt} />
                  </span>
                </span>
                <button type="button" onClick={() => resolve(g.key)} disabled={busyKey === g.key}
                  title="Erreur traitée : la retirer de la liste (elle réapparaîtra si elle se reproduit)"
                  style={s.pillBtn}>
                  Réglée
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
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
    <section className="fade-up" style={s.card}>
      <div style={s.sparkHeader}>
        <div>
          <div style={s.miniLabel}>Inscriptions sur 12 mois</div>
          <div style={s.sparkTitle}>
            {totalSignups} <span style={s.sparkTitleSub}>nouveaux membres</span>
          </div>
          <div style={s.sparkSub}>
            dont <strong style={{ color: 'var(--text)' }}>{totalPaid}</strong> en Standard
            {trendPct !== null && (
              <span style={{ color: trendPct >= 0 ? 'var(--accent-text)' : 'var(--danger-text)', marginLeft: '8px', fontWeight: 600 }}>
                {trendPct >= 0 ? '+' : '−'}{Math.abs(trendPct)} % par rapport au mois dernier
              </span>
            )}
          </div>
        </div>
        <div style={s.sparkLegend}>
          <span style={s.legendItem}><span style={{ ...s.legendDot, background: 'var(--accent-bg)', border: '1px solid var(--accent-text)' }} />Inscrits</span>
          <span style={s.legendItem}><span style={{ ...s.legendDot, background: 'var(--accent-text)' }} />Standard</span>
        </div>
      </div>

      <div style={s.sparkBars}>
        {data.map(d => {
          const totalH = (d.total / maxVal) * 100
          const paidH = d.total > 0 ? (d.paid / d.total) * 100 : 0
          return (
            <div key={d.month} style={s.sparkBarCol} title={`${formatMonthShort(d.month)} : ${d.total} inscrits${d.paid > 0 ? ` (dont ${d.paid} en Standard)` : ''}`}>
              <div style={s.sparkCount}>{d.total > 0 ? d.total : ''}</div>
              <div style={s.sparkBarStack}>
                <div style={{ ...s.sparkBarTotal, height: `${totalH}%` }}>
                  <div style={{ ...s.sparkBarPaid, height: `${paidH}%` }} />
                </div>
              </div>
              <div style={s.sparkLabel2}>{formatMonthShort(d.month)}</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' },

  // Carte « À traiter » du bandeau
  asideTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', color: 'var(--text)' },
  asideEmpty: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: 'var(--text-2)' },
  asideRow: {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '10px',
    background: 'var(--bg)', border: '1px solid var(--border)', textDecoration: 'none',
    fontSize: '13px', color: 'var(--text-2)',
  },

  // 2 colonnes au-delà de ~1200 px (flex-wrap : une seule colonne en dessous)
  cols: { display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' },
  colMain: { flex: '999 1 620px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' },
  colSide: { flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' },

  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '16px 18px', minWidth: 0,
  },
  empty: { fontSize: '12.5px', color: 'var(--text-3)', marginTop: '6px', lineHeight: 1.5 },
  miniLabel: { fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '4px' },
  pillBtn: {
    flexShrink: 0, padding: '4px 10px', borderRadius: '999px', border: '1px solid var(--accent-border)',
    background: 'var(--accent-bg)', color: 'var(--accent-text)', fontSize: '11.5px', fontWeight: 600,
    fontFamily: 'inherit', cursor: 'pointer',
  },

  // Chiffres clés
  kpiBar: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px' },
  kpiCard: {
    display: 'flex', alignItems: 'center', gap: '14px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '16px 18px', minWidth: 0,
  },
  kpiIcon: { width: '40px', height: '40px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  kpiBody: { flex: 1, minWidth: 0 },
  kpiLabel: { fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '2px' },
  kpiValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: '26px', fontWeight: 500, lineHeight: 1.1, color: 'var(--text)' },
  kpiSub: { fontSize: '11.5px', color: 'var(--text-3)', marginTop: '2px' },

  sectionLabel: {
    display: 'flex', alignItems: 'center', gap: '7px',
    fontSize: '12px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase',
    color: 'var(--text-2)', marginBottom: '12px',
  },
  sectionLink: {
    marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '3px',
    fontSize: '12px', fontWeight: 600, color: 'var(--accent-text)',
    textDecoration: 'none', textTransform: 'none', letterSpacing: 0,
  },

  // Membres par formule
  plansGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '12px' },
  planCard: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px',
  },
  planTop: { display: 'flex', alignItems: 'center', gap: '8px' },
  planDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  planName: { fontSize: '13.5px', color: 'var(--text)', fontWeight: 600, flex: 1 },
  planCount: { fontFamily: 'var(--font-fraunces), serif', fontSize: '24px', fontWeight: 400, color: 'var(--text)', lineHeight: 1 },
  planBar: { height: '4px', borderRadius: '2px', background: 'var(--border)', overflow: 'hidden' },
  planFill: { height: '100%', borderRadius: '2px', transition: 'width 0.6s ease', minWidth: '4px' },

  // Trafic
  trafficGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px' },
  liveTop: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  liveDot: { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-text)', flexShrink: 0 },
  liveLabel: { fontSize: '12.5px', color: 'var(--text-2)', fontWeight: 600 },
  liveValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: '34px', fontWeight: 500, lineHeight: 1, color: 'var(--accent-text)' },
  liveSub: { fontSize: '11.5px', color: 'var(--text-3)', marginTop: '4px' },
  channelList: { display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '4px' },
  channelRow: { display: 'flex', alignItems: 'center', gap: '9px' },
  channelName: { fontSize: '12.5px', color: 'var(--text-2)', flex: 1 },
  channelPct: { fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', minWidth: '36px', textAlign: 'right' },
  channelCount: { fontSize: '11.5px', color: 'var(--text-3)', minWidth: '26px', textAlign: 'right' },
  topPageRank: { fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', width: '14px', flexShrink: 0 },
  topPagePath: { fontSize: '12.5px', color: 'var(--text-2)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

  // Activité
  activityRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  actCard: {
    display: 'flex', alignItems: 'center', gap: '14px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '16px 18px', flex: '1 1 170px', minWidth: 0,
  },
  actIcon: { width: '40px', height: '40px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  actVal: { fontFamily: 'var(--font-fraunces), serif', fontSize: '26px', fontWeight: 400, color: 'var(--text)', lineHeight: 1 },
  actLbl: { fontSize: '12px', color: 'var(--text-3)', marginTop: '3px' },
  perfTitle: {
    fontSize: '14px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.3,
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
    overflow: 'hidden', wordBreak: 'break-word',
  },

  // Gérer le contenu (liste compacte en colonne de droite)
  contentList: {
    display: 'flex', flexDirection: 'column', gap: '2px', padding: '6px',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px',
  },
  contentRow: {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '11px',
    textDecoration: 'none',
  },
  contentIcon: { width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  contentBody: { flex: 1, minWidth: 0 },
  contentTitle: { fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' },
  contentDesc: { fontSize: '12px', color: 'var(--text-3)', marginTop: '1px' },

  // Derniers inscrits
  recentList: {
    display: 'flex', flexDirection: 'column', gap: '2px',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '6px',
  },
  recentItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '11px', textDecoration: 'none', color: 'inherit' },
  recentAvatar: {
    width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
    background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-fraunces), serif', fontSize: '13px', fontWeight: 600,
  },
  recentBody: { flex: 1, minWidth: 0 },
  recentName: { fontSize: '13px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  recentEmail: { fontSize: '11.5px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' },
  recentRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 },
  recentPlan: { fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px' },
  recentDate: { fontSize: '11px', color: 'var(--text-3)' },

  // Inscriptions sur 12 mois
  sparkHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' },
  sparkTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '24px', fontWeight: 400, color: 'var(--text)', lineHeight: 1.1 },
  sparkTitleSub: { fontSize: '14px', color: 'var(--text-3)', fontFamily: 'var(--font-outfit), sans-serif' },
  sparkSub: { fontSize: '12.5px', color: 'var(--text-3)', marginTop: '4px' },
  sparkLegend: { display: 'flex', gap: '14px', alignItems: 'center' },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-3)' },
  legendDot: { width: '10px', height: '10px', borderRadius: '3px', boxSizing: 'border-box' },
  sparkBars: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px', marginTop: '8px' },
  sparkBarCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: 0 },
  sparkCount: { fontSize: '10.5px', color: 'var(--text-3)', height: '13px' },
  sparkBarStack: { width: '100%', height: '90px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  sparkBarTotal: {
    width: '100%', maxWidth: '30px', background: 'var(--accent-bg)', borderTop: '2px solid var(--accent-text)',
    borderRadius: '4px 4px 0 0', position: 'relative', overflow: 'hidden', transition: 'height 0.4s ease', minHeight: '2px',
  },
  sparkBarPaid: { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--accent-text)' },
  sparkLabel2: { fontSize: '10.5px', color: 'var(--text-3)', textTransform: 'capitalize' },
}
