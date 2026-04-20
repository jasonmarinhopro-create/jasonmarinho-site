import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  GraduationCap, Handshake, FileText, UsersThree,
  ArrowRight, BookOpen, ShieldCheck, ArrowSquareOut,
  CalendarBlank, Warning, CurrencyEur,
} from '@phosphor-icons/react/dist/ssr'
import { DRIING_SERVICES } from '@/lib/constants/partners'

// ── greeting based on Paris time
function getGreeting() {
  const h = parseInt(new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', hour12: false, timeZone: 'Europe/Paris' }).format(new Date()))
  return h >= 18 || h < 5 ? 'Bonsoir' : 'Bonjour'
}

// ── date helpers (server-side, no timezone issues)
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

export default async function DashboardPage() {
  const profile = await getProfile()
  const supabase = await createClient()
  const userId = profile?.userId ?? ''

  const today = todayStr()
  const in7   = addDays(today, 7)

  const [
    { data: userFormations },
    { count: allFormationsCount },
    { count: partnersCount },
    { count: templatesCount },
    { count: groupsCount },
    { data: contracts },
  ] = await Promise.all([
    supabase.from('user_formations')
      .select('*, formation:formations(*)')
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false }),
    supabase.from('formations').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('partners').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('templates').select('*', { count: 'exact', head: true }),
    supabase.from('community_groups').select('*', { count: 'exact', head: true }),
    supabase
      .from('contracts')
      .select('id, logement_nom, date_arrivee, date_depart, statut, checklist_status, montant_loyer, stripe_payment_status, stripe_payment_enabled')
      .eq('user_id', userId)
      .neq('statut', 'annule')
      .order('date_arrivee'),
  ])

  const totalPartnerOffers = DRIING_SERVICES.length + (partnersCount ?? 0)
  const totalGroups        = groupsCount ?? 0
  const firstName          = profile?.full_name?.split(' ')[0] ?? ''
  const enrolled           = userFormations?.length ?? 0
  const inProgressFormations = (userFormations ?? []).filter(f => f.progress < 100).slice(0, 3)
  const pl = (n: number, s = 's') => n > 1 ? s : ''

  // ── operational data
  const allContracts = contracts ?? []

  const activeStays = allContracts.filter(c =>
    c.date_arrivee <= today && (!c.date_depart || c.date_depart >= today)
  )
  const weekArrivals = allContracts.filter(c =>
    c.date_arrivee > today && c.date_arrivee <= in7
  )
  const weekDepartures = allContracts.filter(c =>
    c.date_depart && c.date_depart >= today && c.date_depart <= in7 &&
    !activeStays.find(a => a.id === c.id) && !weekArrivals.find(a => a.id === c.id)
  )
  const unsignedContracts = allContracts.filter(c => {
    const cl = (c.checklist_status as Record<string, boolean>) ?? {}
    return !cl.contrat_signe && c.date_arrivee >= today
  })
  const pendingPayments = allContracts.filter(c =>
    c.stripe_payment_enabled && c.stripe_payment_status !== 'paid'
  )
  const actionsCount = unsignedContracts.length + pendingPayments.length

  const hasOpData =
    activeStays.length > 0 || weekArrivals.length > 0 || weekDepartures.length > 0 ||
    unsignedContracts.length > 0 || pendingPayments.length > 0

  const services = [
    {
      href: '/dashboard/formations', label: 'Formations', icon: GraduationCap,
      detail: 'Parcours complets pour optimiser ta LCD',
      stat: `${allFormationsCount ?? 0} formation${pl(allFormationsCount ?? 0)} disponible${pl(allFormationsCount ?? 0)}`,
      color: '#004C3F', iconColor: '#34D399',
    },
    {
      href: '/dashboard/guide', label: 'Guide LCD', icon: BookOpen,
      detail: 'Toutes les ressources pratiques pour gérer ta location',
      stat: 'Ressources & bonnes pratiques',
      color: '#1a3d6e', iconColor: '#60a5fa',
    },
    {
      href: '/dashboard/gabarits', label: 'Gabarits', icon: FileText,
      detail: 'Messages prêts à l\'emploi pour tes voyageurs',
      stat: `${templatesCount ?? 0} gabarit${pl(templatesCount ?? 0)} disponible${pl(templatesCount ?? 0)}`,
      color: '#2d5c40', iconColor: '#A7F3D0',
    },
    {
      href: '/dashboard/securite', label: 'Vérification voyageurs', icon: ShieldCheck,
      detail: 'Vérifie l\'identité de tes voyageurs en toute simplicité',
      stat: 'Sécurise tes locations',
      color: '#4a1d5c', iconColor: '#c084fc',
    },
    {
      href: '/dashboard/partenaires', label: 'Partenaires', icon: Handshake,
      detail: 'Outils et services négociés exclusivement pour toi',
      stat: `${totalPartnerOffers} offre${pl(totalPartnerOffers)} exclusive${pl(totalPartnerOffers)}`,
      color: '#0d6e56', iconColor: '#6EE7B7',
    },
    {
      href: '/dashboard/communaute', label: 'Communauté', icon: UsersThree,
      detail: 'Échange avec d\'autres hôtes LCD et progresse ensemble',
      stat: `${totalGroups} groupe${pl(totalGroups)} sélectionné${pl(totalGroups)}`,
      color: '#92400e', iconColor: '#FCD34D',
    },
  ]

  return (
    <>
      <Header title="Accueil" userName={profile?.full_name ?? undefined} />
      <div style={s.page} className="dash-page">

        {/* ── Welcome */}
        <section style={s.welcome} className="fade-up dash-welcome">
          <div>
            <p style={s.welcomeSub}>Bienvenue sur la plateforme</p>
            <h2 style={s.welcomeTitle}>
              {getGreeting()}{firstName ? `, ${firstName}` : ''}
            </h2>
            <p style={s.welcomeDesc}>
              {actionsCount > 0
                ? `${actionsCount} action${actionsCount > 1 ? 's' : ''} en attente${weekArrivals.length > 0 ? ` · ${weekArrivals.length} arrivée${pl(weekArrivals.length)} cette semaine` : ''}`
                : weekArrivals.length > 0
                ? `${weekArrivals.length} arrivée${pl(weekArrivals.length)} prévue${pl(weekArrivals.length)} cette semaine · Tout est en ordre`
                : activeStays.length > 0
                ? `${activeStays.length} séjour${pl(activeStays.length)} en cours · Tout est en ordre`
                : 'Aucun séjour cette semaine. Retrouve tes outils ci-dessous.'}
            </p>
          </div>
          <div style={s.statsRow} className="dash-stats-row">
            <div style={s.stat}>
              <span style={s.statVal}>{activeStays.length}</span>
              <span style={s.statLbl}>Séjour{activeStays.length > 1 ? 's' : ''} actif{activeStays.length > 1 ? 's' : ''}</span>
            </div>
            <div style={s.statDivider} />
            <div style={s.stat}>
              <span style={s.statVal}>{weekArrivals.length}</span>
              <span style={s.statLbl}>Arrivée{weekArrivals.length > 1 ? 's' : ''} J-7</span>
            </div>
            {actionsCount > 0 && <>
              <div style={s.statDivider} />
              <div style={s.stat}>
                <span style={{ ...s.statVal, color: '#ef4444' }}>{actionsCount}</span>
                <span style={s.statLbl}>Action{actionsCount > 1 ? 's' : ''} requise{actionsCount > 1 ? 's' : ''}</span>
              </div>
            </>}
          </div>
        </section>

        {/* ── Résumé opérationnel */}
        {hasOpData && (
          <section style={s.section} className="fade-up d1">
            <div style={s.opGrid}>

              {/* Séjours de la semaine */}
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
                          <span style={s.stayMeta}>
                            jusqu'au {fmtShort(c.date_depart ?? today)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {weekArrivals.map(c => {
                      const dta   = diffDays(today, c.date_arrivee)
                      const label = dta === 0 ? "Aujourd'hui" : dta === 1 ? 'Demain' : `Dans ${dta}j`
                      const color = dta === 0 ? '#10b981' : dta === 1 ? '#eab308' : '#60a5fa'
                      return (
                        <div key={c.id} style={s.stayRow}>
                          <span style={{ ...s.badge, background: color + '22', color }}>
                            Arrivée · {label}
                          </span>
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
                          <span style={{ ...s.badge, background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>
                            Départ · {label}
                          </span>
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

              {/* Actions requises */}
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

        {/* ── Services */}
        <section style={s.section} className="fade-up d2">
          <h3 style={s.sectionTitle}>Mes services</h3>
          <div style={s.servicesGrid} className="dash-services-grid">
            {services.map(({ href, label, icon: Icon, detail, stat, color, iconColor }) => (
              <Link key={href} href={href} style={s.serviceCard} className="glass-card">
                <div style={{ ...s.serviceIcon, background: color + '25', border: `1px solid ${color}55` }}>
                  <Icon size={26} color={iconColor} weight="fill" />
                </div>
                <div style={s.serviceBody}>
                  <div style={s.serviceLabel}>{label}</div>
                  <div style={s.serviceDetail}>{detail}</div>
                </div>
                <div style={s.serviceFooter}>
                  <span style={s.serviceStat}>{stat}</span>
                  <ArrowRight size={14} color="var(--text-muted)" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Formations en cours */}
        {inProgressFormations.length > 0 && (
          <section style={s.section} className="fade-up d3">
            <div style={s.sectionHead}>
              <h3 style={s.sectionTitle}>Formations en cours</h3>
              <Link href="/dashboard/formations" style={s.seeAll}>
                Voir tout <ArrowRight size={14} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {inProgressFormations.map(uf => (
                <Link key={uf.id} href={`/dashboard/formations/${uf.formation?.slug ?? ''}`} style={{ textDecoration: 'none' }}>
                  <div style={s.formationCard} className="glass-card">
                    <div style={s.formationIcon}>
                      <GraduationCap size={20} color="#FFD56B" weight="fill" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={s.formationTitle}>{uf.formation?.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{ width: `${uf.progress}%` }} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-3)', flexShrink: 0 }}>{uf.progress}%</span>
                      </div>
                    </div>
                    <ArrowSquareOut size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {enrolled > 0 && inProgressFormations.length === 0 && (
          <section style={s.section} className="fade-up d3">
            <div style={s.emptyState} className="glass-card">
              <GraduationCap size={40} color="#34D399" weight="fill" />
              <h3 style={s.emptyTitle}>Bravo, toutes tes formations sont terminées !</h3>
              <p style={s.emptyDesc}>Explore les autres formations disponibles pour continuer à progresser.</p>
              <Link href="/dashboard/formations" className="btn-primary">
                Voir les formations <ArrowRight size={16} weight="bold" />
              </Link>
            </div>
          </section>
        )}

        {(!userFormations || userFormations.length === 0) && (
          <section style={s.section} className="fade-up d3">
            <div style={s.emptyState} className="glass-card">
              <GraduationCap size={40} color="var(--text-muted)" weight="fill" />
              <h3 style={s.emptyTitle}>Commence ta première formation</h3>
              <p style={s.emptyDesc}>
                {allFormationsCount ?? 0} formation{pl(allFormationsCount ?? 0)} disponible{pl(allFormationsCount ?? 0)} pour optimiser ta location courte durée.
              </p>
              <Link href="/dashboard/formations" className="btn-primary">
                Voir les formations <ArrowRight size={16} weight="bold" />
              </Link>
            </div>
          </section>
        )}

      </div>
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:       { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  welcome: {
    background: 'linear-gradient(135deg, rgba(0,76,63,0.22) 0%, rgba(255,213,107,0.04) 100%)',
    border: '1px solid rgba(255,213,107,0.12)', borderRadius: '20px',
    padding: 'clamp(24px,3vw,40px) clamp(24px,4vw,48px)', marginBottom: '28px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px',
  },
  welcomeSub:   { fontSize: '13px', color: 'var(--text-3)', marginBottom: '6px' },
  welcomeTitle: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,2.5vw,36px)', fontWeight: 400, color: 'var(--text)', marginBottom: '10px' },
  welcomeDesc:  { fontSize: '14px', fontWeight: 300, color: 'var(--text-2)', maxWidth: '440px', lineHeight: 1.6 },
  statsRow:     { display: 'flex', alignItems: 'center', gap: '28px', flexShrink: 0 },
  stat:         { textAlign: 'center' },
  statVal:      { display: 'block', fontFamily: 'Fraunces, serif', fontSize: '40px', fontWeight: 400, color: 'var(--accent-text)', lineHeight: 1 },
  statLbl:      { display: 'block', fontSize: '11px', color: 'var(--text-3)', marginTop: '6px', letterSpacing: '0.3px' },
  statDivider:  { width: '1px', height: '44px', background: 'var(--border)' },
  section:      { marginBottom: '32px' },
  sectionHead:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 400, color: 'var(--text)', marginBottom: '16px' },
  seeAll:       { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 500 },

  // Operational summary
  opGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' },
  opCard:      { padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' },
  opCardHead:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  opCardTitle: { fontSize: '11px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.6px' },
  opLink:      { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 500 },
  countBadge:  { fontSize: '10px', fontWeight: 700, color: '#f97316', background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '10px', padding: '1px 7px' },

  stayRow:  { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' },
  badge:    { fontSize: '10px', fontWeight: 600, padding: '3px 7px', borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0 },
  stayInfo: { display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0, flex: 1 },
  stayName: { fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  stayMeta: { fontSize: '11px', color: 'var(--text-muted)' },

  actionRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'border-color 0.15s' },
  dot:       { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },

  // Services
  servicesGrid: { display: 'grid', gap: '14px' },
  serviceCard:  { display: 'flex', flexDirection: 'column', gap: '14px', padding: '22px 20px', textDecoration: 'none', borderRadius: '16px', transition: 'transform 0.2s' },
  serviceIcon:  { width: '48px', height: '48px', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  serviceBody:  { flex: 1 },
  serviceLabel: { fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' },
  serviceDetail:{ fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.55 },
  serviceFooter:{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '2px' },
  serviceStat:  { fontSize: '12px', color: 'var(--accent-text)', fontWeight: 500 },

  // Formations
  formationCard:  { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderRadius: '14px' },
  formationIcon:  { width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0, background: 'rgba(0,76,63,0.3)', border: '1px solid rgba(255,213,107,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  formationTitle: { fontSize: '14px', fontWeight: 400, color: 'var(--text)', marginBottom: '10px' },

  emptyState: { padding: '56px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', borderRadius: '18px' },
  emptyTitle: { fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 400, color: 'var(--text)' },
  emptyDesc:  { fontSize: '14px', color: 'var(--text-3)', maxWidth: '340px', lineHeight: 1.6 },
}
