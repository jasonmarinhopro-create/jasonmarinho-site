import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  GraduationCap, Handshake, FileText, UsersThree,
  ArrowRight, BookOpen, ShieldCheck, ArrowSquareOut,
} from '@phosphor-icons/react/dist/ssr'
import { DRIING_SERVICES } from '@/lib/constants/partners'
import { JASON_GROUPS, EXTRA_GROUPS } from '@/lib/constants/community'

export default async function DashboardPage() {
  const profile = await getProfile()
  const supabase = await createClient()

  const userId = profile?.userId ?? ''

  const [
    { data: userFormations },
    { count: allFormationsCount },
    { count: partnersCount },
    { count: templatesCount },
    { count: groupsCount },
  ] = await Promise.all([
    supabase.from('user_formations')
      .select('*, formation:formations(*)')
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false })
      .limit(3),
    supabase.from('formations').select('*', { count: 'exact', head: true }).eq('is_published', true),
    // Partenaires DB = partenaires additionnels hors Driing (actifs)
    supabase.from('partners').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('templates').select('*', { count: 'exact', head: true }),
    supabase.from('community_groups').select('*', { count: 'exact', head: true }),
  ])

  // Nombre total d'offres partenaires : services Driing + partenaires additionnels DB
  const totalPartnerOffers = DRIING_SERVICES.length + (partnersCount ?? 0)

  // Nombre total de groupes : groupes Jason/Driing + groupes extra + groupes DB
  const totalGroups = JASON_GROUPS.length + EXTRA_GROUPS.length + (groupsCount ?? 0)

  const firstName = profile?.full_name?.split(' ')[0] ?? ''
  const enrolled = userFormations?.length ?? 0
  const completed = userFormations?.filter(f => f.progress === 100).length ?? 0

  const pl = (n: number, s = 's') => n > 1 ? s : ''

  const services = [
    {
      href: '/dashboard/formations',
      label: 'Formations',
      icon: GraduationCap,
      detail: 'Parcours complets pour optimiser ta LCD',
      stat: `${allFormationsCount ?? 0} formation${pl(allFormationsCount ?? 0)} disponible${pl(allFormationsCount ?? 0)}`,
      color: '#004C3F',
      iconColor: '#34D399',
    },
    {
      href: '/dashboard/guide',
      label: 'Guide LCD',
      icon: BookOpen,
      detail: 'Toutes les ressources pratiques pour gérer ta location',
      stat: 'Ressources & bonnes pratiques',
      color: '#1a3d6e',
      iconColor: '#60a5fa',
    },
    {
      href: '/dashboard/gabarits',
      label: 'Gabarits',
      icon: FileText,
      detail: 'Messages prêts à l\'emploi pour tes voyageurs',
      stat: `${templatesCount ?? 0} gabarit${pl(templatesCount ?? 0)} disponible${pl(templatesCount ?? 0)}`,
      color: '#2d5c40',
      iconColor: '#A7F3D0',
    },
    {
      href: '/dashboard/securite',
      label: 'Vérification voyageurs',
      icon: ShieldCheck,
      detail: 'Vérifie l\'identité de tes voyageurs en toute simplicité',
      stat: 'Sécurise tes locations',
      color: '#4a1d5c',
      iconColor: '#c084fc',
    },
    {
      href: '/dashboard/partenaires',
      label: 'Partenaires',
      icon: Handshake,
      detail: 'Outils et services négociés exclusivement pour toi',
      stat: `${totalPartnerOffers} offre${pl(totalPartnerOffers)} exclusive${pl(totalPartnerOffers)}`,
      color: '#0d6e56',
      iconColor: '#6EE7B7',
    },
    {
      href: '/dashboard/communaute',
      label: 'Communauté',
      icon: UsersThree,
      detail: 'Échange avec d\'autres hôtes LCD et progresse ensemble',
      stat: `${totalGroups} groupe${pl(totalGroups)} sélectionné${pl(totalGroups)}`,
      color: '#92400e',
      iconColor: '#FCD34D',
    },
  ]

  return (
    <>
      <Header title="Accueil" userName={profile?.full_name ?? undefined} />

      <div style={styles.page} className="dash-page">
        {/* Welcome */}
        <section style={styles.welcome} className="fade-up dash-welcome">
          <div>
            <p style={styles.welcomeSub}>Bonjour,</p>
            <h2 style={styles.welcomeTitle}>Bienvenue{firstName ? ', ' : ''}<em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>{firstName}</em></h2>
            <p style={styles.welcomeDesc}>Retrouve tes formations, gabarits et ressources pour développer ton activité LCD.</p>
          </div>
          <div style={styles.statsRow} className="dash-stats-row">
            <div style={styles.stat}>
              <span style={styles.statVal}>{enrolled}</span>
              <span style={styles.statLbl}>Formation{enrolled > 1 ? 's' : ''} suivie{enrolled > 1 ? 's' : ''}</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.stat}>
              <span style={styles.statVal}>{completed}</span>
              <span style={styles.statLbl}>Terminée{completed > 1 ? 's' : ''}</span>
            </div>
          </div>
        </section>

        {/* Services grid */}
        <section style={styles.section} className="fade-up d1">
          <h3 style={styles.sectionTitle}>Mes services</h3>
          <div style={styles.servicesGrid} className="dash-services-grid">
            {services.map(({ href, label, icon: Icon, detail, stat, color, iconColor }) => (
              <Link key={href} href={href} style={styles.serviceCard} className="glass-card">
                <div style={{ ...styles.serviceIconWrap, background: color + '25', border: `1px solid ${color}55` }}>
                  <Icon size={26} color={iconColor} weight="fill" />
                </div>
                <div style={styles.serviceBody}>
                  <div style={styles.serviceLabel}>{label}</div>
                  <div style={styles.serviceDetail}>{detail}</div>
                </div>
                <div style={styles.serviceFooter}>
                  <span style={styles.serviceStat}>{stat}</span>
                  <ArrowRight size={14} color="var(--text-muted)" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Formations en cours */}
        {userFormations && userFormations.length > 0 && (
          <section style={styles.section} className="fade-up d2">
            <div style={styles.sectionHead}>
              <h3 style={styles.sectionTitle}>Formations en cours</h3>
              <Link href="/dashboard/formations" style={styles.seeAll}>
                Voir tout <ArrowRight size={14} />
              </Link>
            </div>
            <div style={styles.formationsGrid}>
              {userFormations.slice(0, 3).map((uf) => (
                <Link
                  key={uf.id}
                  href={`/dashboard/formations/${uf.formation?.slug ?? ''}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={styles.formationCard} className="glass-card">
                    <div style={styles.formationIcon}>
                      <GraduationCap size={20} color="#FFD56B" weight="fill" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.formationTitle}>{uf.formation?.title}</div>
                      <div style={styles.progressWrap}>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{ width: `${uf.progress}%` }} />
                        </div>
                        <span style={styles.progressPct}>{uf.progress}%</span>
                      </div>
                    </div>
                    <ArrowSquareOut size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Pas encore inscrit */}
        {(!userFormations || userFormations.length === 0) && (
          <section style={styles.section} className="fade-up d2">
            <div style={styles.emptyState} className="glass-card">
              <GraduationCap size={40} color="var(--text-muted)" weight="fill" />
              <h3 style={styles.emptyTitle}>Commence ta première formation</h3>
              <p style={styles.emptyDesc}>{allFormationsCount ?? 0} formation{pl(allFormationsCount ?? 0)} disponible{pl(allFormationsCount ?? 0)} pour optimiser ta location courte durée.</p>
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

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  welcome: {
    background: 'linear-gradient(135deg, rgba(0,76,63,0.22) 0%, rgba(255,213,107,0.04) 100%)',
    border: '1px solid rgba(255,213,107,0.12)',
    borderRadius: '20px',
    padding: 'clamp(24px,3vw,40px) clamp(24px,4vw,48px)',
    marginBottom: '28px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    gap: '24px',
  },
  welcomeSub: { fontSize: '13px', color: 'var(--text-3)', marginBottom: '6px' },
  welcomeTitle: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,2.5vw,36px)', fontWeight: 400, color: 'var(--text)', marginBottom: '10px' },
  welcomeDesc: { fontSize: '14px', fontWeight: 300, color: 'var(--text-2)', maxWidth: '440px', lineHeight: 1.6 },
  statsRow: { display: 'flex', alignItems: 'center', gap: '28px', flexShrink: 0 },
  stat: { textAlign: 'center' },
  statVal: { display: 'block', fontFamily: 'Fraunces, serif', fontSize: '40px', fontWeight: 400, color: 'var(--accent-text)', lineHeight: 1 },
  statLbl: { display: 'block', fontSize: '11px', color: 'var(--text-3)', marginTop: '6px', letterSpacing: '0.3px' },
  statDivider: { width: '1px', height: '44px', background: 'var(--border)' },
  section: { marginBottom: '32px' },
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 400, color: 'var(--text)', marginBottom: '16px' },
  seeAll: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 500 },

  /* Services grid */
  servicesGrid: { display: 'grid', gap: '14px' },
  serviceCard: {
    display: 'flex', flexDirection: 'column', gap: '14px',
    padding: '22px 20px', textDecoration: 'none', borderRadius: '16px',
    transition: 'transform 0.2s',
  },
  serviceIconWrap: {
    width: '48px', height: '48px', borderRadius: '13px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  serviceBody: { flex: 1 },
  serviceLabel: { fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' },
  serviceDetail: { fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.55 },
  serviceFooter: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '2px',
  },
  serviceStat: { fontSize: '12px', color: 'var(--accent-text)', fontWeight: 500 },

  formationsGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  formationCard: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderRadius: '14px' },
  formationIcon: {
    width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
    background: 'rgba(0,76,63,0.3)', border: '1px solid rgba(255,213,107,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  formationTitle: { fontSize: '14px', fontWeight: 400, color: 'var(--text)', marginBottom: '10px' },
  progressWrap: { display: 'flex', alignItems: 'center', gap: '10px' },
  progressPct: { fontSize: '12px', color: 'var(--text-3)', flexShrink: 0 },
  emptyState: {
    padding: '56px 32px', textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', borderRadius: '18px',
  },
  emptyTitle: { fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 400, color: 'var(--text)' },
  emptyDesc: { fontSize: '14px', color: 'var(--text-3)', maxWidth: '340px', lineHeight: 1.6 },
}
