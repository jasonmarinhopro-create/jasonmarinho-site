import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import { Users, Clock } from '@phosphor-icons/react/dist/ssr'

export default async function VoyageursPage() {
  const profile = await getProfile()

  return (
    <>
      <Header title="Mes Voyageurs" userName={profile?.full_name ?? undefined} />

      <div style={styles.page}>
        <div style={styles.intro} className="fade-up">
          <h2 style={styles.pageTitle}>
            Mes <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>Voyageurs</em>
          </h2>
          <p style={styles.pageDesc}>
            Gérez vos voyageurs, leurs coordonnées et votre historique d&apos;hôtes.
          </p>
        </div>

        <div style={styles.comingSoon} className="fade-up glass-card">
          <div style={styles.iconWrap}>
            <Users size={32} color="var(--text-3)" />
          </div>
          <div style={styles.comingLabel}>
            <Clock size={14} color="var(--text-muted)" />
            Bientôt disponible
          </div>
          <p style={styles.comingDesc}>
            Votre annuaire de voyageurs arrive prochainement. Vous pourrez y stocker les
            coordonnées de vos hôtes, noter les incidents, et retrouver facilement chaque
            profil pour vos futures réservations.
          </p>
        </div>
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', maxWidth: '860px' },
  intro: { marginBottom: '32px' },
  pageTitle: {
    fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400, color: 'var(--text)', marginBottom: '8px',
  },
  pageDesc: { fontSize: '15px', fontWeight: 300, color: 'var(--text-3)' },
  comingSoon: {
    padding: '48px 32px', borderRadius: '18px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '16px', textAlign: 'center',
  },
  iconWrap: {
    width: '64px', height: '64px',
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: '16px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  comingLabel: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.8px',
  },
  comingDesc: {
    fontSize: '14px', fontWeight: 300, color: 'var(--text-3)',
    lineHeight: 1.7, maxWidth: '480px',
  },
}
