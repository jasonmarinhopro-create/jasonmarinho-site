import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import { Check, Wrench, Star } from '@phosphor-icons/react/dist/ssr'
import DriingRequestForm from './DriingRequestForm'

const DECOUVERTE_FEATURES = [
  'Accès à la communauté & groupes Facebook',
  'Formations de base (Google My Business...)',
  'Conseils sécurité voyageurs',
  'Accès aux ressources publiques',
]

const DRIING_FEATURES = [
  'Toutes les formations incluses',
  'Communauté privée Driing',
  'Accès prioritaire aux nouveaux contenus',
  'Offres partenaires exclusives',
  'Support dédié',
]

const CONSTRUCTION_PLANS = [
  { id: 'hote',   name: 'Hôte',   description: 'Tous les outils pour piloter et développer votre activité en location directe.' },
  { id: 'pro',    name: 'Pro',    description: 'Accompagnement personnalisé pour passer au niveau supérieur.', highlighted: true },
  { id: 'agence', name: 'Agence', description: 'Pour les conciergeries multi-propriétés avec une équipe.' },
]

export default async function AbonnementPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const userEmail = session?.user?.email ?? ''

  const profile = await getProfile()
  const plan = profile?.plan ?? 'decouverte'
  const isDriing = plan === 'driing'
  const driingStatus = profile?.driing_status ?? 'none'

  return (
    <>
      <Header title="Abonnement" userName={profile?.full_name ?? undefined} />

      <div style={styles.page}>
        <div style={styles.intro} className="fade-up">
          <h2 style={styles.pageTitle}>
            Votre <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>abonnement</em>
          </h2>
          <p style={styles.pageDesc}>
            Des offres adaptées à chaque étape de votre activité.
          </p>
        </div>

        <div style={styles.mainGrid}>
          {/* LEFT — plan actuel */}
          <div style={styles.leftCol}>
            {isDriing ? (
              <div style={styles.driingBanner} className="glass-card fade-up">
                <div style={styles.driingGlow} />
                <div style={{ ...styles.currentPlan, color: '#FFD56B' }}>
                  <div style={{ ...styles.currentDot, background: '#FFD56B' }} />
                  Plan actuel
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ ...styles.currentName, color: '#FFD56B' }}>Membre Driing</div>
                  <Star size={20} color="#FFD56B" weight="fill" />
                </div>
                <p style={styles.currentDesc}>
                  Accès complet à la plateforme, aux formations exclusives et à la communauté privée Driing.
                </p>
                <div style={styles.featureList}>
                  {DRIING_FEATURES.map(f => (
                    <div key={f} style={styles.featureItem}>
                      <Check size={13} color="#FFD56B" weight="bold" />
                      {f}
                    </div>
                  ))}
                </div>
                <button disabled style={styles.ctaDriing}>Offre actuelle</button>
              </div>
            ) : (
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
            )}
          </div>

          {/* RIGHT */}
          <div style={styles.rightCol}>

            {/* Membre Driing — visible seulement si l'utilisateur est en Découverte */}
            {!isDriing && (
              <>
                <div style={styles.upgradeLabel} className="fade-up">
                  <Star size={13} weight="fill" />
                  Passez au niveau supérieur
                </div>
                <div style={styles.driingRow} className="fade-up d1">
                  <div style={styles.driingRowGlow} />
                  <div style={styles.driingRowName}>Membre Driing</div>
                  <p style={styles.planDesc}>
                    Accès complet aux formations, à la communauté privée et aux contenus exclusifs.
                  </p>
                  <div style={styles.perks}>
                    {DRIING_FEATURES.map(p => (
                      <span key={p} style={styles.perk}>
                        <Check size={10} color="#FFD56B" weight="bold" />
                        {p}
                      </span>
                    ))}
                  </div>
                  <DriingRequestForm
                    userEmail={userEmail}
                    driingStatus={driingStatus}
                    needsFix={driingStatus === 'confirmed'}
                  />
                </div>
              </>
            )}

            <div style={{ ...styles.comingLabel, marginTop: isDriing ? 0 : '8px' }} className="fade-up">
              <Wrench size={13} />
              Prochaines offres — en construction
            </div>

            <div style={styles.plansList}>
              {CONSTRUCTION_PLANS.map((p, i) => (
                <div
                  key={p.id}
                  style={{ ...styles.planRow, ...(p.highlighted ? styles.planRowHighlighted : {}) }}
                  className={`fade-up d${i + 1}`}
                >
                  <div style={styles.planRowLeft}>
                    <div style={styles.planName}>{p.name}</div>
                    <span style={styles.planDesc}>{p.description}</span>
                  </div>
                  <div style={styles.planRowRight}>
                    <div style={styles.ctaLocked}>
                      <Wrench size={12} />
                      En construction
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
  pageTitle: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: '#f0f4ff', marginBottom: '10px' },
  pageDesc: { fontSize: '15px', fontWeight: 300, color: 'rgba(240,244,255,0.5)', maxWidth: '560px', lineHeight: 1.6 },
  mainGrid: { display: 'grid', gridTemplateColumns: 'minmax(280px, 380px) 1fr', gap: '28px', alignItems: 'start' },
  leftCol: {},
  rightCol: { display: 'flex', flexDirection: 'column', gap: '16px' },

  /* Découverte */
  currentBanner: {
    padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px',
    background: 'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(52,211,153,0.03) 100%)',
    border: '1px solid rgba(52,211,153,0.2)', borderRadius: '20px',
  },
  currentPlan: { display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase' as const, color: '#34D399' },
  currentDot: { width: '7px', height: '7px', borderRadius: '50%', background: '#34D399' },
  currentName: { fontFamily: 'Fraunces, serif', fontSize: '32px', fontWeight: 400, color: '#f0f4ff' },
  currentDesc: { fontSize: '14px', fontWeight: 300, color: 'rgba(240,244,255,0.45)', lineHeight: 1.6 },
  featureList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  featureItem: { display: 'flex', alignItems: 'center', gap: '9px', fontSize: '13px', fontWeight: 300, color: 'rgba(240,244,255,0.65)' },
  ctaCurrent: { padding: '11px 16px', borderRadius: '10px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)', color: 'rgba(52,211,153,0.5)', fontSize: '14px', fontWeight: 500, cursor: 'not-allowed', textAlign: 'center' as const, marginTop: '4px' },

  /* Driing plan actuel */
  driingBanner: {
    position: 'relative', overflow: 'hidden', padding: '32px',
    display: 'flex', flexDirection: 'column', gap: '16px',
    background: 'linear-gradient(135deg, rgba(255,213,107,0.10) 0%, rgba(255,213,107,0.03) 100%)',
    border: '1px solid rgba(255,213,107,0.3)', borderRadius: '20px',
  },
  driingGlow: { position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,213,107,0.15) 0%, transparent 70%)', pointerEvents: 'none' },
  ctaDriing: { padding: '11px 16px', borderRadius: '10px', background: 'rgba(255,213,107,0.08)', border: '1px solid rgba(255,213,107,0.2)', color: 'rgba(255,213,107,0.6)', fontSize: '14px', fontWeight: 500, cursor: 'not-allowed', textAlign: 'center' as const, marginTop: '4px' },

  /* Upgrade Driing row */
  upgradeLabel: { display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase' as const, color: 'rgba(255,213,107,0.6)' },
  driingRow: {
    position: 'relative', overflow: 'hidden',
    display: 'flex', flexDirection: 'column', gap: '14px',
    background: 'rgba(255,213,107,0.04)', border: '1px solid rgba(255,213,107,0.15)',
    borderRadius: '16px', padding: '24px',
  },
  driingRowGlow: { position: 'absolute', top: '-40px', right: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,213,107,0.08) 0%, transparent 70%)', pointerEvents: 'none' },
  driingRowName: { fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 400, color: '#FFD56B' },
  planDesc: { fontSize: '13px', fontWeight: 300, color: 'rgba(240,244,255,0.45)', lineHeight: 1.5, margin: 0 },
  perks: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px' },
  perk: { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'rgba(240,244,255,0.5)' },

  /* En construction */
  comingLabel: { display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase' as const, color: 'rgba(240,244,255,0.3)' },
  plansList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  planRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '22px 24px', opacity: 0.55 },
  planRowHighlighted: { border: '1px dashed rgba(255,213,107,0.12)' },
  planRowLeft: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  planName: { fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 400, color: 'rgba(240,244,255,0.6)' },
  planRowRight: { flexShrink: 0 },
  ctaLocked: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: 'rgba(240,244,255,0.2)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px 14px', whiteSpace: 'nowrap' as const },

  note: { fontSize: '12px', fontWeight: 300, color: 'rgba(240,244,255,0.25)', lineHeight: 1.7 },
}
