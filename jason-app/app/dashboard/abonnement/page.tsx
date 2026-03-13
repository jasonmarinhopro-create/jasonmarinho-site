import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import { Check, X as XIcon, ArrowUpRight, Star } from '@phosphor-icons/react/dist/ssr'

const PLANS = [
  {
    id: 'decouverte',
    name: 'Découverte',
    price: 0,
    period: 'gratuit',
    description: 'Pour découvrir la plateforme et la communauté.',
    cta: 'Offre actuelle',
    ctaDisabled: true,
    highlighted: false,
  },
  {
    id: 'hote',
    name: 'Hôte',
    price: 39,
    period: '/mois HT',
    description: 'Tous les outils pour piloter et développer votre activité.',
    cta: 'Choisir Hôte',
    ctaDisabled: false,
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 89,
    period: '/mois HT',
    description: 'Accompagnement personnalisé pour passer au niveau supérieur.',
    cta: 'Choisir Pro',
    ctaDisabled: false,
    highlighted: true,
  },
  {
    id: 'agence',
    name: 'Agence',
    price: 199,
    period: '/mois HT',
    description: 'Pour les conciergeries multi-propriétés avec une équipe.',
    cta: 'Nous contacter',
    ctaDisabled: false,
    highlighted: false,
  },
]

const FEATURES: { label: string; plans: ('decouverte' | 'hote' | 'pro' | 'agence')[] }[] = [
  { label: 'Accès à la communauté', plans: ['decouverte', 'hote', 'pro', 'agence'] },
  { label: 'Formations de base', plans: ['decouverte', 'hote', 'pro', 'agence'] },
  { label: 'Toutes les formations', plans: ['hote', 'pro', 'agence'] },
  { label: 'Gabarits professionnels', plans: ['hote', 'pro', 'agence'] },
  { label: 'Offres partenaires exclusifs (Driing…)', plans: ['hote', 'pro', 'agence'] },
  { label: 'Groupe privé membres', plans: ['pro', 'agence'] },
  { label: '1 session coaching / mois (1h)', plans: ['pro', 'agence'] },
  { label: 'Suivi de progression personnalisé', plans: ['pro', 'agence'] },
  { label: 'Audit Google My Business', plans: ['pro', 'agence'] },
  { label: 'Accès multi-utilisateurs (équipe)', plans: ['agence'] },
  { label: 'Accompagnement dédié conciergerie', plans: ['agence'] },
]

export default async function AbonnementPage() {
  const profile = await getProfile()

  return (
    <>
      <Header title="Abonnement" userName={profile?.full_name ?? undefined} />

      <div style={styles.page}>
        <div style={styles.intro} className="fade-up">
          <h2 style={styles.pageTitle}>
            Choisir votre <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>offre</em>
          </h2>
          <p style={styles.pageDesc}>
            Des plans adaptés à chaque étape de votre activité — de l'hôte qui démarre à la conciergerie en pleine croissance.
          </p>
        </div>

        {/* Plans cards */}
        <div style={styles.plansGrid} className="fade-up">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              style={{
                ...styles.planCard,
                ...(plan.highlighted ? styles.planCardHighlighted : {}),
              }}
            >
              {plan.highlighted && (
                <div style={styles.popularBadge}>
                  <Star size={11} weight="fill" color="#004C3F" />
                  Recommandé
                </div>
              )}

              <div style={styles.planName}>{plan.name}</div>
              <p style={styles.planDesc}>{plan.description}</p>

              <div style={styles.planPrice}>
                <span style={styles.planAmount}>
                  {plan.price === 0 ? '0 €' : `${plan.price} €`}
                </span>
                <span style={styles.planPeriod}>{plan.period}</span>
              </div>

              {plan.ctaDisabled ? (
                <button disabled style={styles.ctaDisabled}>{plan.cta}</button>
              ) : (
                <a
                  href="https://wa.me/33630212592"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={plan.highlighted ? 'btn-primary' : 'btn-ghost'}
                  style={{ textAlign: 'center', display: 'block' }}
                >
                  {plan.cta} <ArrowUpRight size={14} />
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Feature comparison table */}
        <div style={styles.comparisonWrap} className="fade-up">
          <div style={styles.comparisonTitle}>Comparaison des fonctionnalités</div>

          <div style={styles.tableWrap}>
            {/* Header */}
            <div style={styles.tableHeader}>
              <div style={styles.featureCol} />
              {PLANS.map(p => (
                <div
                  key={p.id}
                  style={{
                    ...styles.planCol,
                    ...(p.highlighted ? { color: '#FFD56B' } : {}),
                  }}
                >
                  {p.name}
                </div>
              ))}
            </div>

            {/* Rows */}
            {FEATURES.map((feat, i) => (
              <div
                key={i}
                style={{
                  ...styles.tableRow,
                  ...(i % 2 === 0 ? { background: 'rgba(255,255,255,0.02)' } : {}),
                }}
              >
                <div style={styles.featureCol}>{feat.label}</div>
                {PLANS.map(p => (
                  <div key={p.id} style={styles.planCol}>
                    {feat.plans.includes(p.id as any)
                      ? <Check size={16} color="#34D399" weight="bold" />
                      : <XIcon size={14} color="rgba(240,244,255,0.18)" weight="bold" />
                    }
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <p style={styles.note} className="fade-up">
          Les prix sont indicatifs. Contactez Jason sur WhatsApp pour personnaliser votre offre ou obtenir un devis pour votre conciergerie.
        </p>
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', maxWidth: '1100px' },
  intro: { marginBottom: '36px' },
  pageTitle: {
    fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400, color: '#f0f4ff', marginBottom: '10px',
  },
  pageDesc: {
    fontSize: '15px', fontWeight: 300,
    color: 'rgba(240,244,255,0.5)', maxWidth: '560px', lineHeight: 1.6,
  },

  /* Plans grid */
  plansGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '48px',
  },
  planCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '18px',
    padding: '28px 24px',
    display: 'flex', flexDirection: 'column', gap: '14px',
    position: 'relative',
  },
  planCardHighlighted: {
    background: 'linear-gradient(145deg, rgba(0,76,63,0.55) 0%, rgba(0,51,42,0.4) 100%)',
    border: '1.5px solid rgba(255,213,107,0.28)',
  },
  popularBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    background: '#FFD56B', color: '#004C3F',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px',
    padding: '4px 10px', borderRadius: '999px',
    alignSelf: 'flex-start',
  },
  planName: {
    fontFamily: 'Fraunces, serif', fontSize: '22px',
    fontWeight: 400, color: '#f0f4ff',
  },
  planDesc: {
    fontSize: '13px', fontWeight: 300,
    color: 'rgba(240,244,255,0.45)', lineHeight: 1.55,
  },
  planPrice: { display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' },
  planAmount: {
    fontFamily: 'Fraunces, serif', fontSize: '34px',
    fontWeight: 400, color: '#f0f4ff',
  },
  planPeriod: { fontSize: '13px', color: 'rgba(240,244,255,0.38)' },
  ctaDisabled: {
    padding: '11px 16px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.07)',
    color: 'rgba(240,244,255,0.3)',
    fontSize: '14px', fontWeight: 500,
    cursor: 'not-allowed', textAlign: 'center',
  },

  /* Comparison */
  comparisonWrap: { marginBottom: '32px' },
  comparisonTitle: {
    fontSize: '13px', fontWeight: 500,
    color: 'rgba(240,244,255,0.4)',
    letterSpacing: '0.4px', textTransform: 'uppercase',
    marginBottom: '16px',
  },
  tableWrap: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '14px', overflow: 'hidden',
  },
  tableHeader: {
    display: 'grid', gridTemplateColumns: '1fr repeat(4, 90px)',
    padding: '14px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    fontSize: '13px', fontWeight: 600, color: 'rgba(240,244,255,0.55)',
  },
  tableRow: {
    display: 'grid', gridTemplateColumns: '1fr repeat(4, 90px)',
    padding: '13px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  featureCol: {
    fontSize: '13px', fontWeight: 300,
    color: 'rgba(240,244,255,0.6)',
  },
  planCol: {
    display: 'flex', justifyContent: 'center',
    fontSize: '12px', fontWeight: 500,
    color: 'rgba(240,244,255,0.5)',
  },

  note: {
    fontSize: '12px', fontWeight: 300,
    color: 'rgba(240,244,255,0.3)', lineHeight: 1.7,
    maxWidth: '560px',
  },
}
