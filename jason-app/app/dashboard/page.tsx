import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  GraduationCap, Handshake, FileText, UsersThree,
  ArrowRight, TrendUp, Star, BookOpen
} from '@phosphor-icons/react/dist/ssr'

export default async function DashboardPage() {
  const profile = await getProfile()
  const supabase = await createClient()

  const userId = profile?.userId ?? ''

  const [{ data: userFormations }, { data: allFormations }] = await Promise.all([
    supabase.from('user_formations')
      .select('*, formation:formations(*)')
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false })
      .limit(3),
    supabase.from('formations').select('id').eq('is_published', true),
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? ''
  const enrolled = userFormations?.length ?? 0
  const completed = userFormations?.filter(f => f.progress === 100).length ?? 0

  const quickLinks = [
    { href: '/dashboard/formations',  label: 'Formations',  icon: GraduationCap, desc: `${allFormations?.length ?? 3} disponibles`, color: '#004C3F', iconColor: '#34D399' },
    { href: '/dashboard/partenaires', label: 'Partenaires', icon: Handshake,      desc: '5 offres exclusives',   color: '#0d6e56', iconColor: '#6EE7B7' },
    { href: '/dashboard/gabarits',    label: 'Gabarits',    icon: FileText,        desc: 'Copie en 1 clic',       color: '#2d5c40', iconColor: '#A7F3D0' },
    { href: '/dashboard/communaute',  label: 'Communauté',  icon: UsersThree,     desc: '3 groupes sélectionnés', color: '#92400e', iconColor: '#FCD34D' },
  ]

  return (
    <>
      <Header title="Accueil" userName={profile?.full_name ?? undefined} />

      <div style={styles.page} className="dash-page">
        {/* Welcome */}
        <section style={styles.welcome} className="fade-up dash-welcome">
          <div>
            <p style={styles.welcomeSub}>Bonjour,</p>
            <h2 style={styles.welcomeTitle}>Bienvenue{firstName ? ', ' : ''}<em style={{ color: '#FFD56B', fontStyle: 'italic' }}>{firstName}</em></h2>
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

        {/* Quick links */}
        <section style={styles.section} className="fade-up d1">
          <h3 style={styles.sectionTitle}>Accès rapide</h3>
          <div style={styles.quickGrid} className="dash-quick-grid">
            {quickLinks.map(({ href, label, icon: Icon, desc, color, iconColor }) => (
              <Link key={href} href={href} style={styles.quickCard} className="glass-card">
                <div style={{ ...styles.quickIcon, background: color + '33', border: `1px solid ${color}55` }}>
                  <Icon size={22} color={iconColor} weight="fill" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={styles.quickLabel}>{label}</div>
                  <div style={styles.quickDesc}>{desc}</div>
                </div>
                <ArrowRight size={16} color="rgba(240,244,255,0.25)" />
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
              {userFormations.map((uf) => (
                <div key={uf.id} style={styles.formationCard} className="glass-card">
                  <div style={styles.formationIcon}>
                    <BookOpen size={20} color="#FFD56B" weight="fill" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.formationTitle}>{uf.formation?.title}</div>
                    <div style={styles.progressWrap}>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${uf.progress}%` }} />
                      </div>
                      <span style={styles.progressPct}>{uf.progress}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pas encore inscrit */}
        {(!userFormations || userFormations.length === 0) && (
          <section style={styles.section} className="fade-up d2">
            <div style={styles.emptyState} className="glass-card">
              <GraduationCap size={40} color="rgba(240,244,255,0.2)" weight="fill" />
              <h3 style={styles.emptyTitle}>Commence ta première formation</h3>
              <p style={styles.emptyDesc}>3 formations disponibles pour optimiser ta location courte durée.</p>
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
  welcomeSub: { fontSize: '13px', color: 'rgba(240,244,255,0.4)', marginBottom: '6px' },
  welcomeTitle: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,2.5vw,36px)', fontWeight: 400, color: '#f0f4ff', marginBottom: '10px' },
  welcomeDesc: { fontSize: '14px', fontWeight: 300, color: 'rgba(240,244,255,0.5)', maxWidth: '440px', lineHeight: 1.6 },
  statsRow: { display: 'flex', alignItems: 'center', gap: '28px', flexShrink: 0 },
  stat: { textAlign: 'center' },
  statVal: { display: 'block', fontFamily: 'Fraunces, serif', fontSize: '40px', fontWeight: 400, color: '#FFD56B', lineHeight: 1 },
  statLbl: { display: 'block', fontSize: '11px', color: 'rgba(240,244,255,0.4)', marginTop: '6px', letterSpacing: '0.3px' },
  statDivider: { width: '1px', height: '44px', background: 'rgba(255,255,255,0.1)' },
  section: { marginBottom: '32px' },
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 400, color: '#f0f4ff', marginBottom: '16px' },
  seeAll: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#FFD56B', textDecoration: 'none', fontWeight: 500 },
  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' },
  quickCard: {
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '20px 18px', textDecoration: 'none', borderRadius: '14px',
    transition: 'transform 0.2s',
  },
  quickIcon: { width: '42px', height: '42px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  quickLabel: { fontSize: '14px', fontWeight: 500, color: '#f0f4ff', marginBottom: '3px' },
  quickDesc: { fontSize: '12px', color: 'rgba(240,244,255,0.4)' },
  formationsGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  formationCard: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderRadius: '14px' },
  formationIcon: {
    width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
    background: 'rgba(0,76,63,0.3)', border: '1px solid rgba(255,213,107,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  formationTitle: { fontSize: '14px', fontWeight: 400, color: '#f0f4ff', marginBottom: '10px' },
  progressWrap: { display: 'flex', alignItems: 'center', gap: '10px' },
  progressPct: { fontSize: '12px', color: 'rgba(240,244,255,0.4)', flexShrink: 0 },
  emptyState: {
    padding: '56px 32px', textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', borderRadius: '18px',
  },
  emptyTitle: { fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 400, color: '#f0f4ff' },
  emptyDesc: { fontSize: '14px', color: 'rgba(240,244,255,0.4)', maxWidth: '340px', lineHeight: 1.6 },
}
