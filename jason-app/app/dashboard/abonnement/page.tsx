import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import { Check, Lock, Wrench } from '@phosphor-icons/react/dist/ssr'

const PLANS = [
  {
    id: 'decouverte',
    name: 'Découverte',
    price: 0,
    period: 'gratuit',
    description: 'Pour découvrir la plateforme, les formations et la communauté.',
    available: true,
    current: true,
  },
  {
    id: 'hote',
    name: 'Hôte',
    price: 39,
    period: '/mois HT',
    description: 'Tous les outils pour piloter et développer votre activité.',
    available: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 89,
    period: '/mois HT',
    description: 'Accompagnement personnalisé pour passer au niveau supérieur.',
    available: false,
    highlighted: true,
  },
  {
    id: 'agence',
    name: 'Agence',
    price: 199,
    period: '/mois HT',
    description: 'Pour les conciergeries multi-propriétés avec une équipe.',
    available: false,
  },
]

// Fonctionnalités incluses dans Découverte
const DECOUVERTE_FEATURES = [
  'Accès à la communauté',
  'Formations de base',
  'Groupes Facebook partenaires',
  'Conseils sécurité voyageurs',
]

export default async function AbonnementPage() {
  const profile = await getProfile()

  return (
    <>
      <Header title="Abonnement" userName={profile?.full_name ?? undefined} />

      <div style={styles.page}>
        <div style={styles.intro} className="fade-up">
          <h2 style={styles.pageTitle}>
            Votre <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>abonnement</em>
          </h2>
          <p style={styles.pageDesc}>
            Des plans adaptés à chaque étape de votre activité — de l'hôte qui démarre à la conciergerie en pleine croissance.
          </p>
        </div>

        {/* Current plan banner */}
        <div style={styles.currentBanner} className="fade-up">
          <div style={styles.currentLeft}>
            <div style={styles.currentPlan}>
              <div style={styles.currentDot} />
              Plan actuel
            </div>
            <div style={styles.currentName}>Découverte</div>
            <p style={styles.currentDesc}>Accès gratuit à la plateforme et à la communauté.</p>
          </div>
          <div style={styles.currentFeatures}>
            {DECOUVERTE_FEATURES.map(f => (
              <div key={f} style={styles.featureItem}>
                <Check size={13} color="#34D399" weight="bold" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Plans grid */}
        <div style={styles.sectionTitle} className="fade-up">
          Prochaines offres
        </div>
        <div style={styles.plansGrid} className="fade-up">
          {PLANS.filter(p => !p.current).map(plan => (
            <div
              key={plan.id}
              style={{
                ...styles.planCard,
                ...(plan.highlighted ? styles.planCardHighlighted : {}),
              }}
            >
              {plan.highlighted && (
                <div style={styles.wipBadge}>
                  <Wrench size={11} weight="fill" />
                  En construction
                </div>
              )}
              {!plan.highlighted && (
                <div style={styles.wipBadge}>
                  <Wrench size={11} weight="fill" />
                  En construction
                </div>
              )}

              <div style={styles.planName}>{plan.name}</div>
              <p style={styles.planDesc}>{plan.description}</p>

              <div style={styles.planPrice}>
                <span style={styles.planAmount}>{plan.price} €</span>
                <span style={styles.planPeriod}>{plan.period}</span>
              </div>

              <div style={styles.ctaLocked}>
                <Lock size={13} />
                Bientôt disponible
              </div>
            </div>
          ))}
        </div>

        <p style={styles.note} className="fade-up">
          Les offres payantes seront lancées progressivement. Tu seras notifié dès qu'une nouvelle offre est disponible.
        </p>
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', maxWidth: '900px' },
  intro: { marginBottom: '32px' },
  pageTitle: {
    fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400, color: '#f0f4ff', marginBottom: '10px',
  },
  pageDesc: {
    fontSize: '15px', fontWeight: 300,
    color: 'rgba(240,244,255,0.5)', maxWidth: '560px', lineHeight: 1.6,
  },

  /* Current plan */
  currentBanner: {
    display: 'flex', alignItems: 'flex-start', gap: '32px', flexWrap: 'wrap',
    background: 'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(52,211,153,0.03) 100%)',
    border: '1px solid rgba(52,211,153,0.2)',
    borderRadius: '18px', padding: '28px 32px',
    marginBottom: '40px',
  },
  currentLeft: { flex: 1, minWidth: '200px' },
  currentPlan: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.6px',
    textTransform: 'uppercase', color: '#34D399',
    marginBottom: '10px',
  },
  currentDot: {
    width: '7px', height: '7px', borderRadius: '50%',
    background: '#34D399',
  },
  currentName: {
    fontFamily: 'Fraunces, serif', fontSize: '28px',
    fontWeight: 400, color: '#f0f4ff', marginBottom: '6px',
  },
  currentDesc: { fontSize: '14px', fontWeight: 300, color: 'rgba(240,244,255,0.45)' },
  currentFeatures: {
    display: 'flex', flexDirection: 'column', gap: '10px',
    justifyContent: 'center',
  },
  featureItem: {
    display: 'flex', alignItems: 'center', gap: '9px',
    fontSize: '13px', fontWeight: 300, color: 'rgba(240,244,255,0.65)',
  },

  /* Plans coming soon */
  sectionTitle: {
    fontSize: '12px', fontWeight: 600, letterSpacing: '0.7px',
    textTransform: 'uppercase', color: 'rgba(240,244,255,0.35)',
    marginBottom: '16px',
  },
  plansGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  planCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '18px',
    padding: '24px 22px',
    display: 'flex', flexDirection: 'column', gap: '12px',
    opacity: 0.6,
  },
  planCardHighlighted: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px dashed rgba(255,213,107,0.15)',
  },
  wipBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px',
    textTransform: 'uppercase',
    color: 'rgba(240,244,255,0.3)',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '999px', padding: '4px 10px',
    alignSelf: 'flex-start',
  },
  planName: {
    fontFamily: 'Fraunces, serif', fontSize: '20px',
    fontWeight: 400, color: 'rgba(240,244,255,0.5)',
  },
  planDesc: {
    fontSize: '13px', fontWeight: 300,
    color: 'rgba(240,244,255,0.3)', lineHeight: 1.55,
  },
  planPrice: { display: 'flex', alignItems: 'baseline', gap: '6px' },
  planAmount: {
    fontFamily: 'Fraunces, serif', fontSize: '28px',
    fontWeight: 400, color: 'rgba(240,244,255,0.35)',
  },
  planPeriod: { fontSize: '12px', color: 'rgba(240,244,255,0.25)' },
  ctaLocked: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '13px', fontWeight: 400, color: 'rgba(240,244,255,0.25)',
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '8px', padding: '9px 14px',
  },

  note: {
    fontSize: '12px', fontWeight: 300,
    color: 'rgba(240,244,255,0.28)', lineHeight: 1.7,
    maxWidth: '520px',
  },
}
