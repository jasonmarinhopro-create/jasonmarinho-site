import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import { Check, Lock, Wrench, ArrowRight } from '@phosphor-icons/react/dist/ssr'

const COMING_PLANS = [
  {
    id: 'hote',
    name: 'Hôte',
    description: 'Tous les outils pour piloter et développer votre activité en location directe.',
    perks: ['Toutes les formations', 'Gabarits professionnels', 'Offres partenaires', 'Support prioritaire'],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Accompagnement personnalisé pour passer au niveau supérieur.',
    perks: ['Tout Hôte inclus', 'Session coaching mensuelle (1h)', 'Suivi de progression', 'Audit Google My Business'],
    highlighted: true,
  },
  {
    id: 'agence',
    name: 'Agence',
    description: 'Pour les conciergeries multi-propriétés avec une équipe.',
    perks: ['Tout Pro inclus', 'Multi-utilisateurs', 'Accompagnement dédié conciergerie'],
  },
]

const DECOUVERTE_FEATURES = [
  'Accès à la communauté & groupes Facebook',
  'Formations de base (Google My Business...)',
  'Conseils sécurité voyageurs',
  'Accès aux ressources publiques',
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
            Des offres adaptées à chaque étape de votre activité — de l'hôte qui démarre à la conciergerie professionnelle.
          </p>
        </div>

        <div style={styles.mainGrid}>
          {/* LEFT — current plan */}
          <div style={styles.leftCol}>
            <div style={styles.currentBanner} className="glass-card fade-up">
              <div style={styles.currentPlan}>
                <div style={styles.currentDot} />
                Plan actuel
              </div>
              <div style={styles.currentName}>Découverte</div>
              <p style={styles.currentDesc}>
                Accès gratuit à la plateforme et à la communauté. Commence ici, monte en gamme quand tu es prêt.
              </p>
              <div style={styles.featureList}>
                {DECOUVERTE_FEATURES.map(f => (
                  <div key={f} style={styles.featureItem}>
                    <Check size={13} color="#34D399" weight="bold" />
                    {f}
                  </div>
                ))}
              </div>
              <button disabled style={styles.ctaCurrent}>Offre actuelle</button>
            </div>
          </div>

          {/* RIGHT — coming plans */}
          <div style={styles.rightCol}>
            <div style={styles.comingLabel} className="fade-up">
              <Wrench size={13} />
              Prochaines offres — bientôt disponibles
            </div>

            <div style={styles.plansList}>
              {COMING_PLANS.map((plan, i) => (
                <div
                  key={plan.id}
                  style={{
                    ...styles.planRow,
                    ...(plan.highlighted ? styles.planRowHighlighted : {}),
                  }}
                  className={`fade-up d${i + 1}`}
                >
                  <div style={styles.planRowLeft}>
                    <div style={styles.planName}>{plan.name}</div>
                    <p style={styles.planDesc}>{plan.description}</p>
                    <div style={styles.perks}>
                      {plan.perks.map(p => (
                        <span key={p} style={styles.perk}>
                          <ArrowRight size={10} />
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={styles.planRowRight}>
                    <div style={styles.ctaLocked}>
                      <Lock size={12} />
                      Bientôt
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p style={styles.note} className="fade-up">
              Tu seras notifié dès qu'une nouvelle offre est disponible. Les tarifs seront communiqués au lancement.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  intro: { marginBottom: '36px' },
  pageTitle: {
    fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400, color: '#f0f4ff', marginBottom: '10px',
  },
  pageDesc: {
    fontSize: '15px', fontWeight: 300,
    color: 'rgba(240,244,255,0.5)', maxWidth: '560px', lineHeight: 1.6,
  },

  /* 2-column large screen layout */
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(280px, 380px) 1fr',
    gap: '28px',
    alignItems: 'start',
  },
  leftCol: {},
  rightCol: { display: 'flex', flexDirection: 'column', gap: '16px' },

  /* Current plan */
  currentBanner: {
    padding: '32px',
    display: 'flex', flexDirection: 'column', gap: '16px',
    background: 'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(52,211,153,0.03) 100%)',
    border: '1px solid rgba(52,211,153,0.2)',
    borderRadius: '20px',
  },
  currentPlan: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.6px',
    textTransform: 'uppercase' as const, color: '#34D399',
  },
  currentDot: {
    width: '7px', height: '7px', borderRadius: '50%', background: '#34D399',
  },
  currentName: {
    fontFamily: 'Fraunces, serif', fontSize: '32px',
    fontWeight: 400, color: '#f0f4ff',
  },
  currentDesc: { fontSize: '14px', fontWeight: 300, color: 'rgba(240,244,255,0.45)', lineHeight: 1.6 },
  featureList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  featureItem: {
    display: 'flex', alignItems: 'center', gap: '9px',
    fontSize: '13px', fontWeight: 300, color: 'rgba(240,244,255,0.65)',
  },
  ctaCurrent: {
    padding: '11px 16px', borderRadius: '10px',
    background: 'rgba(52,211,153,0.06)',
    border: '1px solid rgba(52,211,153,0.15)',
    color: 'rgba(52,211,153,0.5)',
    fontSize: '14px', fontWeight: 500,
    cursor: 'not-allowed', textAlign: 'center' as const,
    marginTop: '4px',
  },

  /* Coming plans */
  comingLabel: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.6px',
    textTransform: 'uppercase' as const, color: 'rgba(240,244,255,0.3)',
  },
  plansList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  planRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px', padding: '22px 24px',
    opacity: 0.65,
  },
  planRowHighlighted: {
    border: '1px dashed rgba(255,213,107,0.15)',
  },
  planRowLeft: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  planName: {
    fontFamily: 'Fraunces, serif', fontSize: '20px',
    fontWeight: 400, color: 'rgba(240,244,255,0.6)',
  },
  planDesc: {
    fontSize: '13px', fontWeight: 300,
    color: 'rgba(240,244,255,0.35)', lineHeight: 1.5,
  },
  perks: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px', marginTop: '4px' },
  perk: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '11px', color: 'rgba(240,244,255,0.3)',
  },
  planRowRight: { flexShrink: 0 },
  ctaLocked: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', fontWeight: 500, color: 'rgba(240,244,255,0.25)',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '8px', padding: '8px 14px', whiteSpace: 'nowrap' as const,
  },

  note: {
    fontSize: '12px', fontWeight: 300,
    color: 'rgba(240,244,255,0.25)', lineHeight: 1.7,
  },
}
