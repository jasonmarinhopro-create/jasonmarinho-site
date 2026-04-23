export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import { Check, Wrench, Star, ArrowRight, CheckCircle, XCircle, ShieldStar, Crown } from '@phosphor-icons/react/dist/ssr'
import DriingRequestForm from './DriingRequestForm'
import SubscribeButton from './SubscribeButton'
import ManageButton from './ManageButton'
import { STRIPE_PLANS } from '@/lib/constants/stripe-plans'

const ADMIN_EMAIL = 'djason.marinho@gmail.com'

const DECOUVERTE_FEATURES = [
  'Guide LCD, actualités & gabarits (FR + EN)',
  'Guide fiscalité 2026',
  'Sécurité voyageur (consultation + signalement)',
  '2 formations d\'introduction',
  'Calendrier + journal des revenus',
  '1 logement — voyageurs illimités',
  'Communauté (noms des groupes) + partenaires',
]

const STANDARD_FEATURES = [
  'Logements illimités',
  'Contrats illimités + PDF + paiement Stripe',
  '14 formations complètes',
  'Communauté complète + partenaires exclusifs',
  'Support prioritaire',
]

const DRIING_FEATURES = [
  'Tout le plan Standard inclus',
  'Badge Membre Driing dans l\'app',
  'Support prioritaire + Q&A en direct',
  'Accès anticipé aux nouveautés',
]

export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: Promise<{ subscription?: string }>
}) {
  const supabase = await createClient()

  // getUser() valide le token auprès de Supabase Auth — jamais de données stales
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/auth/login')

  // Requête directe — sans passer par React.cache() ni getProfile()
  // Garantit une lecture fraîche à chaque chargement de cette page
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, plan, driing_status, stripe_subscription_id, stripe_subscription_status, stripe_customer_id')
    .eq('id', user.id)
    .single()

  const userEmail = user.email ?? ''
  const isAdmin   = user.email === ADMIN_EMAIL

  const plan        = profileData?.plan        ?? 'decouverte'
  const driingStatus = profileData?.driing_status ?? 'none'

  // Driing si le plan DB est 'driing' OU si driing_status est 'confirmed' (double sécurité)
  const isDriing    = !isAdmin && (plan === 'driing' || driingStatus === 'confirmed')
  const isStandard  = !isAdmin && !isDriing && plan === 'standard'
  const isDecouverte = !isAdmin && !isDriing && !isStandard

  const params = await searchParams
  const subscriptionResult = params.subscription

  const planLabel = isAdmin ? 'Administrateur' : isDriing ? 'Membre Driing' : isStandard ? 'Standard' : 'Découverte'
  const fullName  = profileData?.full_name ?? undefined

  return (
    <>
      <Header title="Abonnement" userName={fullName} currentPlan={planLabel} />

      <div style={styles.page}>
        <div style={styles.intro} className="fade-up">
          <h2 style={styles.pageTitle}>
            Votre <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>abonnement</em>
          </h2>
          <p style={styles.pageDesc}>Des offres adaptées à chaque étape de votre activité.</p>
        </div>

        {subscriptionResult === 'success' && (
          <div style={styles.alertSuccess} className="fade-up">
            <CheckCircle size={18} color="#34D399" weight="fill" />
            Abonnement activé — bienvenue dans le plan Standard !
          </div>
        )}
        {subscriptionResult === 'cancel' && (
          <div style={styles.alertInfo} className="fade-up">
            <XCircle size={18} color="var(--text-muted)" weight="fill" />
            Paiement annulé. Tu peux réessayer à tout moment.
          </div>
        )}

        <div style={styles.mainGrid} className="abo-grid">

          {/* LEFT — plan actuel */}
          <div style={styles.leftCol}>

            {/* ── Plan Administrateur — visible uniquement pour Jason ── */}
            {isAdmin && (
              <div style={styles.adminBanner} className="glass-card fade-up">
                <div style={styles.adminGlow} />
                <div style={{ ...styles.planLabel, color: '#c084fc' }}>
                  <div style={{ ...styles.dot, background: '#c084fc' }} />
                  Plan actuel
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ ...styles.planName, color: '#c084fc' }}>Administrateur</div>
                  <Crown size={20} color="#c084fc" weight="fill" />
                </div>
                <p style={styles.planDesc}>Accès complet à la plateforme, à toutes les fonctionnalités membres et au panneau d&apos;administration.</p>
                <div style={styles.featureList}>
                  {[
                    'Accès illimité à tout le contenu',
                    'Panel admin — membres, contenu, stats',
                    'Accès anticipé à toutes les nouveautés',
                    'Aucun abonnement requis',
                  ].map(f => (
                    <div key={f} style={styles.featureItem}>
                      <ShieldStar size={13} color="#c084fc" weight="fill" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isDriing && (
              <div style={styles.driingBanner} className="glass-card fade-up">
                <div style={styles.driingGlow} />
                <div style={{ ...styles.planLabel, color: 'var(--accent-text)' }}>
                  <div style={{ ...styles.dot, background: 'var(--accent-text)' }} />
                  Plan actuel
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ ...styles.planName, color: 'var(--accent-text)' }}>Membre Driing</div>
                  <Star size={18} color="#FFD56B" weight="fill" />
                </div>
                <p style={styles.planDesc}>Accès complet à la plateforme, aux formations et à la communauté privée Driing.</p>
                <div style={styles.featureList}>
                  {DRIING_FEATURES.map(f => (
                    <div key={f} style={styles.featureItem}>
                      <Check size={13} color="#FFD56B" weight="bold" />
                      {f}
                    </div>
                  ))}
                </div>
                <p style={styles.smallNote}>
                  Si tu résilies Driing, ton accès revient automatiquement sur le plan Découverte.
                </p>
              </div>
            )}

            {isStandard && (
              <div style={styles.standardBanner} className="glass-card fade-up">
                <div style={styles.planLabel}>
                  <div style={styles.dot} />
                  Plan actuel
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' as const }}>
                  <div style={styles.planName}>Standard</div>
                  <div style={styles.fmPill}><span style={styles.fmDot} />Membre Fondateur</div>
                </div>
                <div style={styles.priceRow}>
                  <span style={styles.price}>1,98 €</span>
                  <span style={styles.priceLabel}> / mois HT</span>
                </div>
                <p style={styles.planDesc}>Tous les outils pour piloter ton activité LCD.</p>
                <div style={styles.featureList}>
                  {STANDARD_FEATURES.map(f => (
                    <div key={f} style={styles.featureItem}>
                      <Check size={13} color="#34D399" weight="bold" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isDecouverte && (
              <div style={styles.currentBanner} className="glass-card fade-up">
                <div style={styles.planLabel}>
                  <div style={styles.dot} />
                  Plan actuel
                </div>
                <div style={styles.planName}>Découverte</div>
                <p style={styles.planDesc}>Accès gratuit à la plateforme et à la communauté. Monte en gamme quand tu es prêt.</p>
                <div style={styles.featureList}>
                  {DECOUVERTE_FEATURES.map(f => (
                    <div key={f} style={styles.featureItem}>
                      <Check size={13} color="#34D399" weight="bold" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — upgrades (masqué pour l'admin) */}
          <div style={styles.rightCol}>
          {!isAdmin && (<>

            {/* Standard upgrade — visible seulement en Découverte */}
            {isDecouverte && (
              <>
                <div style={styles.sectionLabel} className="fade-up">
                  <Star size={12} weight="fill" />
                  Passer en Standard
                </div>
                <div style={styles.upgradeCard} className="fade-up d1">
                  <div style={styles.upgradeGlow} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' as const }}>
                    <div style={styles.upgradeName}>Standard</div>
                    <div style={styles.fmPill}><span style={styles.fmDot} />Membre Fondateur</div>
                  </div>
                  <div style={styles.priceRow}>
                    <span style={styles.price}>1,98 €</span>
                    <span style={styles.priceLabel}> / mois HT</span>
                    <span style={styles.priceStrike}>3,98 €</span>
                  </div>
                  <p style={styles.planDesc}>Logements illimités, contrats, paiement en ligne et formations complètes.</p>
                  <div style={styles.featureList}>
                    {STANDARD_FEATURES.map(f => (
                      <div key={f} style={styles.featureItem}>
                        <Check size={13} color="#34D399" weight="bold" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <SubscribeButton priceId={STRIPE_PLANS.STANDARD_FOUNDING_MONTHLY} label="Passer en Standard — 1,98 €/mois" />
                  <p style={styles.smallNote}>Prix HT bloqué à vie tant que l&apos;abonnement est actif. Résiliable à tout moment.</p>
                </div>
              </>
            )}

            {/* Driing — visible si non Driing */}
            {!isDriing && (
              <>
                <div style={{ ...styles.sectionLabel, marginTop: isDecouverte ? '8px' : 0 }} className="fade-up">
                  <Star size={12} color="#FFD56B" weight="fill" />
                  Inclus avec Driing
                </div>
                <div style={styles.driingRow} className="fade-up d2">
                  <div style={styles.driingRowGlow} />
                  <div style={{ ...styles.upgradeName, color: 'var(--accent-text)' }}>Membre Driing</div>
                  <p style={styles.planDesc}>Tu es client Driing ? Toute la plateforme est incluse sans surcoût — aucun paiement séparé.</p>
                  <div style={styles.perks} className="abo-perks">
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

            {/* Gérer abonnement — Standard actif */}
            {isStandard && (
              <>
                <div style={styles.sectionLabel} className="fade-up">
                  <Wrench size={12} />
                  Gérer mon abonnement
                </div>
                <div style={styles.manageCard} className="fade-up d1">
                  <p style={styles.planDesc}>Modifie, mets en pause ou résilie ton abonnement depuis le portail Stripe.</p>
                  <ManageButton />
                </div>
              </>
            )}
          </>)}</div>
        </div>

      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  intro: { marginBottom: '36px' },
  pageTitle: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: 'var(--text)', marginBottom: '10px' },
  pageDesc: { fontSize: '15px', fontWeight: 300, color: 'var(--text-2)', maxWidth: '560px', lineHeight: 1.6 },
  mainGrid: { gap: '28px' },
  leftCol: {},
  rightCol: { display: 'flex', flexDirection: 'column', gap: '16px' },

  planLabel: { display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#34D399' },
  dot: { width: '7px', height: '7px', borderRadius: '50%', background: '#34D399' },
  planName: { fontFamily: 'Fraunces, serif', fontSize: '32px', fontWeight: 400, color: 'var(--text)' },
  planDesc: { fontSize: '13px', fontWeight: 300, color: 'var(--text-3)', lineHeight: 1.6, margin: 0 },
  featureList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  featureItem: { display: 'flex', alignItems: 'center', gap: '9px', fontSize: '13px', fontWeight: 300, color: 'var(--text-2)' },
  smallNote: { fontSize: '12px', fontWeight: 300, color: 'var(--text-muted)', lineHeight: 1.65, borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' },

  priceRow: { display: 'flex', alignItems: 'baseline', gap: '4px', flexWrap: 'wrap' },
  price: { fontFamily: 'Fraunces, serif', fontSize: '28px', fontWeight: 600, color: 'var(--text)' },
  priceLabel: { fontSize: '13px', color: 'var(--text-muted)' },
  priceStrike: { fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: '4px' },

  fmPill: { display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(255,213,107,0.1)', border: '1px solid rgba(255,213,107,0.25)', color: '#a07500', fontSize: '10px', fontWeight: 700, letterSpacing: '0.3px', padding: '3px 9px', borderRadius: '100px' },
  fmDot: { width: '4px', height: '4px', borderRadius: '50%', background: '#d4a400', flexShrink: 0 },

  /* Admin banner */
  adminBanner: {
    position: 'relative', overflow: 'hidden', padding: '32px',
    display: 'flex', flexDirection: 'column', gap: '16px',
    background: 'linear-gradient(135deg, rgba(192,132,252,0.10) 0%, rgba(192,132,252,0.03) 100%)',
    border: '1px solid rgba(192,132,252,0.3)', borderRadius: '20px',
  },
  adminGlow: {
    position: 'absolute', top: '-60px', right: '-60px',
    width: '220px', height: '220px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(192,132,252,0.18) 0%, transparent 70%)',
    pointerEvents: 'none',
  },

  /* Current plan cards */
  currentBanner: {
    padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px',
    background: 'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(52,211,153,0.03) 100%)',
    border: '1px solid rgba(52,211,153,0.2)', borderRadius: '20px',
  },
  standardBanner: {
    padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px',
    background: 'linear-gradient(135deg, rgba(0,76,63,0.12) 0%, rgba(0,76,63,0.04) 100%)',
    border: '1px solid rgba(0,76,63,0.25)', borderRadius: '20px',
  },
  driingBanner: {
    position: 'relative', overflow: 'hidden', padding: '32px',
    display: 'flex', flexDirection: 'column', gap: '16px',
    background: 'linear-gradient(135deg, rgba(255,213,107,0.10) 0%, rgba(255,213,107,0.03) 100%)',
    border: '1px solid rgba(255,213,107,0.3)', borderRadius: '20px',
  },
  driingGlow: { position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,213,107,0.15) 0%, transparent 70%)', pointerEvents: 'none' },

  /* Right column */
  sectionLabel: { display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--text-muted)' },

  upgradeCard: {
    position: 'relative', overflow: 'hidden',
    display: 'flex', flexDirection: 'column', gap: '14px',
    background: 'linear-gradient(135deg, rgba(0,76,63,0.1) 0%, rgba(0,76,63,0.04) 100%)',
    border: '1px solid rgba(0,76,63,0.2)', borderRadius: '16px', padding: '24px',
  },
  upgradeGlow: { position: 'absolute', top: '-40px', right: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)', pointerEvents: 'none' },
  upgradeName: { fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 400, color: 'var(--text)' },
  ctaStandard: { display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', color: '#34D399', fontSize: '13px', fontWeight: 600, padding: '11px 18px', borderRadius: '10px', textDecoration: 'none', transition: 'all .2s', marginTop: '4px' },

  driingRow: {
    position: 'relative', overflow: 'hidden',
    display: 'flex', flexDirection: 'column', gap: '14px',
    background: 'rgba(255,213,107,0.04)', border: '1px solid rgba(255,213,107,0.15)',
    borderRadius: '16px', padding: '24px',
  },
  driingRowGlow: { position: 'absolute', top: '-40px', right: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,213,107,0.08) 0%, transparent 70%)', pointerEvents: 'none' },
  perks: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  perk: { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-2)' },

  manageCard: {
    display: 'flex', flexDirection: 'column', gap: '14px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '24px',
  },
  ctaManage: { display: 'inline-flex', alignItems: 'center', gap: '7px', color: 'var(--text-2)', fontSize: '13px', fontWeight: 500, textDecoration: 'none' },

  alertSuccess: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 500, color: '#34D399', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px' },
  alertInfo: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 400, color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px' },

  kofi: { display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' as const, marginTop: '40px', padding: '20px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px' },
  kofiTitle: { fontSize: '14px', fontWeight: 500, color: 'var(--text)', margin: '0 0 2px' },
  kofiDesc: { fontSize: '12px', fontWeight: 300, color: 'var(--text-muted)', margin: 0 },
  kofiBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--primary)', color: '#002820', fontSize: '13px', fontWeight: 600, padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', whiteSpace: 'nowrap' as const, flexShrink: 0 },
}
