import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  CalendarBlank, Warning, CurrencyEur, House, UsersThree,
  ArrowRight, BookOpen, FileText, Handshake,
} from '@phosphor-icons/react/dist/ssr'

function getGreeting() {
  const h = parseInt(new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', hour12: false, timeZone: 'Europe/Paris' }).format(new Date()))
  return h >= 18 || h < 5 ? 'Bonsoir' : 'Bonjour'
}

function todayStr() {
  const t = new Date()
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}
function addDays(date: string, n: number) {
  const d = new Date(date + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function diffDays(from: string, to: string) {
  return Math.round((new Date(to + 'T12:00').getTime() - new Date(from + 'T12:00').getTime()) / 86400000)
}
function fmtShort(d: string) {
  const MONTHS = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']
  const [, m, day] = d.split('-')
  return `${parseInt(day)} ${MONTHS[parseInt(m) - 1]}`
}
function fmtEur(n: number) {
  if (n === 0) return '0 €'
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 < 100 ? 1 : 0)} k€`
  return `${n} €`
}

export default async function DashboardPage() {
  const profile  = await getProfile()
  const supabase = await createClient()
  const userId   = profile?.userId ?? ''
  const now      = new Date()
  const today    = todayStr()
  const in7      = addDays(today, 7)
  const monthPfx = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const yearPfx  = String(now.getFullYear())

  const [
    { data: contracts },
    { count: logCount },
  ] = await Promise.all([
    supabase
      .from('contracts')
      .select('id, logement_nom, date_arrivee, date_depart, statut, checklist_status, montant_loyer, stripe_payment_status, stripe_payment_enabled')
      .eq('user_id', userId)
      .neq('statut', 'annule')
      .order('date_arrivee'),
    supabase
      .from('logements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
  ])

  const firstName  = profile?.full_name?.split(/\s+/)[0] ?? ''
  const allC       = contracts ?? []
  const logements  = logCount ?? 0
  const pl         = (n: number, s = 's') => n !== 1 ? s : ''

  // ── Séjours
  const activeStays = allC.filter(c =>
    c.date_arrivee <= today && (!c.date_depart || c.date_depart >= today)
  )
  const weekArrivals = allC.filter(c =>
    c.date_arrivee > today && c.date_arrivee <= in7
  )
  const weekDepartures = allC.filter(c =>
    c.date_depart && c.date_depart >= today && c.date_depart <= in7 &&
    !activeStays.find(a => a.id === c.id) && !weekArrivals.find(a => a.id === c.id)
  )

  // ── Actions
  const unsignedContracts = allC.filter(c => {
    const cl = (c.checklist_status as Record<string, boolean>) ?? {}
    return !cl.contrat_signe && c.date_arrivee >= today
  })
  const pendingPayments = allC.filter(c =>
    c.stripe_payment_enabled && c.stripe_payment_status !== 'paid'
  )
  const actionsCount = unsignedContracts.length + pendingPayments.length

  // ── KPIs financiers
  const isPaid = (c: typeof allC[0]) =>
    c.stripe_payment_status === 'paid' || (!c.stripe_payment_enabled && c.statut === 'signe')

  const revenusThisMonth = allC
    .filter(c => c.date_arrivee?.startsWith(monthPfx) && isPaid(c))
    .reduce((acc, c) => acc + (c.montant_loyer ?? 0), 0)

  const enAttente = allC
    .filter(c => (c.montant_loyer ?? 0) > 0 && !isPaid(c))
    .reduce((acc, c) => acc + (c.montant_loyer ?? 0), 0)

  const voyageursAnnee = allC.filter(c => c.date_arrivee?.startsWith(yearPfx)).length

  const hasOpData =
    activeStays.length > 0 || weekArrivals.length > 0 || weekDepartures.length > 0 ||
    unsignedContracts.length > 0 || pendingPayments.length > 0

  const planLabel = profile?.role === 'admin' ? 'Administrateur'
    : profile?.plan === 'driing' ? 'Membre Driing'
    : profile?.plan === 'standard' ? 'Standard'
    : 'Découverte'

  return (
    <>
      <Header title="Accueil" userName={profile?.full_name ?? undefined} currentPlan={planLabel} />
      <div style={s.page} className="dash-page">

        {/* ── Welcome ─────────────────────────────────────────────────── */}
        <section style={s.welcome} className="fade-up dash-welcome">
          <div>
            <p style={s.welcomeSub}>Bienvenue sur la plateforme</p>
            <h2 style={s.welcomeTitle}>
              {getGreeting()}{firstName ? `, ${firstName}` : ''}
            </h2>
            <p style={s.welcomeDesc}>
              {actionsCount > 0
                ? `${actionsCount} action${pl(actionsCount)} en attente${weekArrivals.length > 0 ? ` · ${weekArrivals.length} arrivée${pl(weekArrivals.length)} cette semaine` : ''}`
                : weekArrivals.length > 0
                ? `${weekArrivals.length} arrivée${pl(weekArrivals.length)} prévue${pl(weekArrivals.length)} cette semaine · Tout est en ordre`
                : activeStays.length > 0
                ? `${activeStays.length} séjour${pl(activeStays.length)} en cours · Tout est en ordre`
                : 'Tableau de bord de ta location courte durée.'}
            </p>
          </div>
          <div style={s.statsRow} className="dash-stats-row">
            <div style={s.stat}>
              <span style={s.statVal}>{activeStays.length}</span>
              <span style={s.statLbl}>Séjour{pl(activeStays.length)} actif{pl(activeStays.length, 's')}</span>
            </div>
            <div style={s.statDivider} />
            <div style={s.stat}>
              <span style={s.statVal}>{weekArrivals.length}</span>
              <span style={s.statLbl}>Arrivée{pl(weekArrivals.length)} J-7</span>
            </div>
            {actionsCount > 0 && (
              <>
                <div style={s.statDivider} />
                <div style={s.stat}>
                  <span style={{ ...s.statVal, color: '#ef4444' }}>{actionsCount}</span>
                  <span style={s.statLbl}>Action{pl(actionsCount)} requise{pl(actionsCount, 's')}</span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── KPI strip ───────────────────────────────────────────────── */}
        <section style={s.section} className="fade-up d1">
          <div style={s.kpiStrip}>
            <KpiCard
              href="/dashboard/revenus"
              icon={<CurrencyEur size={18} weight="fill" />}
              color="#10b981" label="Revenus ce mois"
              value={fmtEur(revenusThisMonth)} sub="encaissés"
            />
            <KpiCard
              href="/dashboard/revenus"
              icon={<CurrencyEur size={18} weight="fill" />}
              color="#f59e0b" label="En attente"
              value={fmtEur(enAttente)} sub="paiements"
            />
            <KpiCard
              href="/dashboard/logements"
              icon={<House size={18} weight="fill" />}
              color="#60a5fa" label="Logements"
              value={String(logements)} sub={logements !== 1 ? 'actifs' : 'actif'}
            />
            <KpiCard
              href="/dashboard/calendrier"
              icon={<UsersThree size={18} weight="fill" />}
              color="#a78bfa" label="Voyageurs"
              value={String(voyageursAnnee)} sub={`en ${yearPfx}`}
            />
          </div>
        </section>

        {/* ── Résumé opérationnel ──────────────────────────────────────── */}
        {hasOpData && (
          <section style={s.section} className="fade-up d2">
            <div style={s.opGrid}>

              {(activeStays.length > 0 || weekArrivals.length > 0 || weekDepartures.length > 0) && (
                <div style={s.opCard} className="glass-card">
                  <div style={s.opCardHead}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CalendarBlank size={16} color="#10b981" weight="fill" />
                      <span style={s.opCardTitle}>Cette semaine</span>
                    </div>
                    <Link href="/dashboard/calendrier" style={s.opLink}>
                      Calendrier <ArrowRight size={12} />
                    </Link>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {activeStays.map(c => (
                      <div key={c.id} style={s.stayRow}>
                        <span style={{ ...s.badge, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>En cours</span>
                        <div style={s.stayInfo}>
                          <span style={s.stayName}>{c.logement_nom ?? 'Logement'}</span>
                          <span style={s.stayMeta}>jusqu&apos;au {fmtShort(c.date_depart ?? today)}</span>
                        </div>
                      </div>
                    ))}
                    {weekArrivals.map(c => {
                      const dta   = diffDays(today, c.date_arrivee)
                      const label = dta === 0 ? "Aujourd'hui" : dta === 1 ? 'Demain' : `Dans ${dta}j`
                      const color = dta === 0 ? '#10b981' : dta === 1 ? '#eab308' : '#60a5fa'
                      return (
                        <div key={c.id} style={s.stayRow}>
                          <span style={{ ...s.badge, background: color + '22', color }}>Arrivée · {label}</span>
                          <div style={s.stayInfo}>
                            <span style={s.stayName}>{c.logement_nom ?? 'Logement'}</span>
                            <span style={s.stayMeta}>
                              {fmtShort(c.date_arrivee)}{c.date_depart ? ` → ${fmtShort(c.date_depart)}` : ''}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    {weekDepartures.map(c => {
                      const dtd   = diffDays(today, c.date_depart!)
                      const label = dtd === 0 ? "Aujourd'hui" : dtd === 1 ? 'Demain' : `Dans ${dtd}j`
                      return (
                        <div key={c.id} style={s.stayRow}>
                          <span style={{ ...s.badge, background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>Départ · {label}</span>
                          <div style={s.stayInfo}>
                            <span style={s.stayName}>{c.logement_nom ?? 'Logement'}</span>
                            <span style={s.stayMeta}>{fmtShort(c.date_depart!)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {(unsignedContracts.length > 0 || pendingPayments.length > 0) && (
                <div style={s.opCard} className="glass-card">
                  <div style={s.opCardHead}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Warning size={16} color="#f97316" weight="fill" />
                      <span style={s.opCardTitle}>Actions requises</span>
                      <span style={s.countBadge}>{actionsCount}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {unsignedContracts.slice(0, 4).map(c => {
                      const dta     = diffDays(today, c.date_arrivee)
                      const urgency = dta <= 2 ? '#ef4444' : dta <= 7 ? '#f97316' : '#eab308'
                      return (
                        <Link key={c.id} href="/dashboard/calendrier" style={{ textDecoration: 'none' }}>
                          <div style={s.actionRow}>
                            <div style={{ ...s.dot, background: urgency }} />
                            <div style={s.stayInfo}>
                              <span style={s.stayName}>{c.logement_nom ?? 'Logement'}</span>
                              <span style={s.stayMeta}>Contrat non signé · Arrivée {fmtShort(c.date_arrivee)}</span>
                            </div>
                            <ArrowRight size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                          </div>
                        </Link>
                      )
                    })}
                    {pendingPayments.slice(0, 3).map(c => (
                      <Link key={c.id + '_p'} href="/dashboard/revenus" style={{ textDecoration: 'none' }}>
                        <div style={s.actionRow}>
                          <div style={{ ...s.dot, background: '#3b82f6' }} />
                          <div style={s.stayInfo}>
                            <span style={s.stayName}>{c.logement_nom ?? 'Logement'}</span>
                            <span style={s.stayMeta}>
                              Paiement en attente{c.montant_loyer ? ` · ${c.montant_loyer} €` : ''}
                            </span>
                          </div>
                          <CurrencyEur size={13} color="#3b82f6" style={{ flexShrink: 0 }} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Accès rapides ────────────────────────────────────────────── */}
        <section style={s.section} className="fade-up d3">
          <h3 style={s.sectionTitle}>Accès rapides</h3>
          <div style={s.quickGrid}>
            <QuickLink
              href="/dashboard/logements"
              icon={<House size={20} weight="fill" color="#60a5fa" />}
              label="Mes logements"
              stat={logements > 0 ? `${logements} logement${pl(logements)} enregistré${pl(logements)}` : 'Ajouter un logement'}
              accent="#60a5fa"
            />
            <QuickLink
              href="/dashboard/calendrier"
              icon={<CalendarBlank size={20} weight="fill" color="#34d399" />}
              label="Calendrier"
              stat={weekArrivals.length > 0 ? `${weekArrivals.length} arrivée${pl(weekArrivals.length)} dans les 7 jours` : activeStays.length > 0 ? `${activeStays.length} séjour${pl(activeStays.length)} en cours` : 'Aucun séjour actif'}
              accent="#34d399"
            />
            <QuickLink
              href="/dashboard/voyageurs"
              icon={<UsersThree size={20} weight="fill" color="#a78bfa" />}
              label="Mes voyageurs"
              stat={voyageursAnnee > 0 ? `${voyageursAnnee} séjour${pl(voyageursAnnee)} en ${yearPfx}` : 'Aucun séjour enregistré'}
              accent="#a78bfa"
            />
            <QuickLink
              href="/dashboard/revenus"
              icon={<CurrencyEur size={20} weight="fill" color="#FFD56B" />}
              label="Revenus"
              stat={revenusThisMonth > 0 ? `${fmtEur(revenusThisMonth)} encaissés ce mois` : 'Suivi financier'}
              accent="#FFD56B"
            />
            <QuickLink
              href="/dashboard/gabarits"
              icon={<FileText size={20} weight="fill" color="#f97316" />}
              label="Gabarits"
              stat="Messages prêts à l'emploi"
              accent="#f97316"
            />
            <QuickLink
              href="/dashboard/partenaires"
              icon={<Handshake size={20} weight="fill" color="#6EE7B7" />}
              label="Partenaires"
              stat="Offres exclusives négociées"
              accent="#6EE7B7"
            />
            <QuickLink
              href="/dashboard/guide"
              icon={<BookOpen size={20} weight="fill" color="#94a3b8" />}
              label="Guide LCD"
              stat="Ressources & bonnes pratiques"
              accent="#94a3b8"
            />
          </div>
        </section>

      </div>
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ href, icon, color, label, value, sub }: {
  href: string; icon: React.ReactNode; color: string
  label: string; value: string; sub: string
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={s.kpiCard} className="kpi-hover">
        <div style={{ ...s.kpiIcon, color, background: color + '18', border: `1px solid ${color}35` }}>
          {icon}
        </div>
        <div style={s.kpiBody}>
          <span style={s.kpiLabel}>{label}</span>
          <span style={{ ...s.kpiValue, color }}>{value}</span>
          <span style={s.kpiSub}>{sub}</span>
        </div>
      </div>
    </Link>
  )
}

function QuickLink({ href, icon, label, stat, accent }: {
  href: string; icon: React.ReactNode; label: string; stat: string; accent: string
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{ ...s.quickCard, borderColor: accent + '22' }} className="glass-card">
        <div style={s.quickLeft}>
          <div style={{ ...s.quickIcon, background: accent + '15', border: `1px solid ${accent}25` }}>
            {icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={s.quickLabel}>{label}</div>
            <div style={s.quickStat}>{stat}</div>
          </div>
        </div>
        <ArrowRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
      </div>
    </Link>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },

  welcome: {
    background: 'linear-gradient(135deg, rgba(0,76,63,0.22) 0%, rgba(255,213,107,0.04) 100%)',
    border: '1px solid rgba(255,213,107,0.12)', borderRadius: '20px',
    padding: 'clamp(24px,3vw,40px) clamp(24px,4vw,48px)', marginBottom: '24px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap',
  },
  welcomeSub:   { fontSize: '13px', color: 'var(--text-3)', marginBottom: '6px' },
  welcomeTitle: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,2.5vw,36px)', fontWeight: 400, color: 'var(--text)', marginBottom: '10px' },
  welcomeDesc:  { fontSize: '14px', fontWeight: 300, color: 'var(--text-2)', maxWidth: '440px', lineHeight: 1.6 },
  statsRow:     { display: 'flex', alignItems: 'center', gap: '28px', flexShrink: 0 },
  stat:         { textAlign: 'center' },
  statVal:      { display: 'block', fontFamily: 'Fraunces, serif', fontSize: '40px', fontWeight: 400, color: 'var(--accent-text)', lineHeight: 1 },
  statLbl:      { display: 'block', fontSize: '11px', color: 'var(--text-3)', marginTop: '6px', letterSpacing: '0.3px' },
  statDivider:  { width: '1px', height: '44px', background: 'var(--border)' },

  section:      { marginBottom: '28px' },
  sectionTitle: { fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 400, color: 'var(--text)', marginBottom: '14px' },

  // KPI strip
  kpiStrip: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' },
  kpiCard: {
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '18px 20px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', transition: 'border-color 0.15s, transform 0.15s',
    height: '100%',
  },
  kpiIcon: {
    width: '40px', height: '40px', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  kpiBody:  { display: 'flex', flexDirection: 'column', gap: '1px' },
  kpiLabel: { fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.2px' },
  kpiValue: { fontSize: '22px', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.5px' },
  kpiSub:   { fontSize: '11px', color: 'var(--text-3)' },

  // Operational
  opGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' },
  opCard:      { padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' },
  opCardHead:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  opCardTitle: { fontSize: '11px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.6px' },
  opLink:      { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 500 },
  countBadge:  { fontSize: '10px', fontWeight: 700, color: '#f97316', background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '10px', padding: '1px 7px' },
  stayRow:     { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' },
  badge:       { fontSize: '10px', fontWeight: 600, padding: '3px 7px', borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0 },
  stayInfo:    { display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0, flex: 1 },
  stayName:    { fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  stayMeta:    { fontSize: '11px', color: 'var(--text-muted)' },
  actionRow:   { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer' },
  dot:         { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },

  // Quick links
  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' },
  quickCard: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
    padding: '14px 16px', borderRadius: '14px',
    border: '1px solid', transition: 'transform 0.15s, box-shadow 0.15s',
  },
  quickLeft:  { display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 },
  quickIcon:  { width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  quickLabel: { fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' },
  quickStat:  { fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
}
