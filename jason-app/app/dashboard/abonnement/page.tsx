export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { Check, Wrench, Star, ArrowRight, CheckCircle, XCircle, ShieldStar, Crown, LockKey } from '@phosphor-icons/react/dist/ssr'
import DriingRequestForm from './DriingRequestForm'
import SubscribeButton from './SubscribeButton'
import ManageButton from './ManageButton'
import SubscriptionDetails from './SubscriptionDetails'
import { STRIPE_PLANS } from '@/lib/constants/stripe-plans'
import { FOUNDER_TOTAL_SEATS } from '@/lib/constants/founder'
import { FORMATIONS_TOTAL } from '@/lib/constants/auto-counts'
import { getSubscriptionDetails, listRecentInvoices } from '@/lib/stripe/subscription-info'

const ADMIN_EMAIL = 'djason.marinho@gmail.com'

const DECOUVERTE_FEATURES = [
  'Guide LCD, actualités & gabarits (FR + EN)',
  'Guide fiscalité 2026',
  'Sécurité voyageur (consultation + signalement)',
  '2 formations au choix',
  'Calendrier + journal des revenus',
  '1 logement, voyageurs illimités',
  'Simulateurs (rentabilité, fiscalité)',
  'Entre Hôtes (lecture du forum hôtes)',
  'Roadmap publique + suggestions',
  'Communauté + partenaires exclusifs',
]

const STANDARD_FEATURES = [
  'Logements illimités',
  'Contrats illimités + PDF + paiement Stripe',
  'État des lieux + livret d\'accueil digital',
  'Performances détaillées + simulateurs',
  'Audit Google Business Profile',
  `${FORMATIONS_TOTAL} formations complètes`,
  'Entre Hôtes (forum hôtes) + communauté complète',
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

  // getUser() valide le token auprès de Supabase Auth, jamais de données stales
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/auth/login')

  // Requête directe, sans passer par React.cache() ni getProfile()
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

  // ── Compteur places fondateur (server-side, lecture directe Supabase) ──
  // Same source de vérité que /api/founder-seats : on évite un round-trip HTTP.
  let founderRemaining = FOUNDER_TOTAL_SEATS
  try {
    const adminDb = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const foundingPriceIds = [
      STRIPE_PLANS.STANDARD_FOUNDING_MONTHLY,
      STRIPE_PLANS.STANDARD_FOUNDING_YEARLY,
    ].filter(Boolean) as string[]
    const { count } = await adminDb
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .in('stripe_price_id', foundingPriceIds)
      .in('stripe_subscription_status', ['active', 'trialing'])
    founderRemaining = Math.max(0, FOUNDER_TOTAL_SEATS - (count ?? 0))
  } catch {
    // Fallback safe : on garde 50/50 plutôt que de bloquer le rendu
  }
  const founderExhausted = founderRemaining === 0
  const founderUrgent    = !founderExhausted && founderRemaining < 10
  const founderPct       = Math.round(((FOUNDER_TOTAL_SEATS - founderRemaining) / FOUNDER_TOTAL_SEATS) * 100)

  // ── Détails abonnement Stripe (date renouvellement, factures) ──────────
  // Uniquement pour les vrais abonnés Stripe (Standard et Driing payant).
  // L'admin n'a pas d'abonnement, le Découverte non plus.
  const hasStripeSub = !!profileData?.stripe_subscription_id && !!profileData?.stripe_customer_id && !isAdmin
  const [subDetails, invoices] = hasStripeSub
    ? await Promise.all([
        getSubscriptionDetails(profileData!.stripe_subscription_id),
        listRecentInvoices(profileData!.stripe_customer_id),
      ])
    : [null, [] as Awaited<ReturnType<typeof listRecentInvoices>>]

  return (
    <>

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
            Abonnement activé, bienvenue dans le plan Standard !
          </div>
        )}
        {subscriptionResult === 'cancel' && (
          <div style={styles.alertInfo} className="fade-up">
            <XCircle size={18} color="var(--text-muted)" weight="fill" />
            Paiement annulé. Tu peux réessayer à tout moment.
          </div>
        )}

        <div style={styles.mainGrid} className="abo-grid">

          {/* LEFT, plan actuel */}
          <div style={styles.leftCol}>

            {/* ── Plan Administrateur, visible uniquement pour Jason ── */}
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
                    'Panel admin, membres, contenu, stats',
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
                  <span style={styles.price}>19,98 €</span>
                  <span style={styles.priceLabel}> / an HT</span>
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

          {/* RIGHT, upgrades (masqué pour l'admin) */}
          <div style={styles.rightCol}>
          {!isAdmin && (<>

            {/* Standard upgrade, visible seulement en Découverte */}
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
                    {!founderExhausted && (
                      <div style={styles.fmPill}><span style={styles.fmDot} />Membre Fondateur</div>
                    )}
                  </div>

                  {/* Compteur places fondateur (SSR, source: DB Supabase) */}
                  <div style={{
                    margin: '4px 0 6px',
                    background: founderExhausted
                      ? 'var(--surface-2)'
                      : founderUrgent
                        ? 'rgba(255,140,80,.10)'
                        : 'var(--accent-bg)',
                    border: `1px solid ${founderExhausted ? 'var(--border)' : founderUrgent ? 'rgba(255,90,30,.35)' : 'var(--accent-border)'}`,
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    gap: '9px',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      lineHeight: 1.4,
                      color: founderExhausted ? 'var(--text-2)' : founderUrgent ? '#ff7a3d' : 'var(--accent-text)',
                    }}>
                      <LockKey size={14} weight="fill" />
                      {founderExhausted ? (
                        <span>Offre Fondateur épuisée — Tarif Standard <strong>38,98 €/an</strong></span>
                      ) : (
                        <span>Offre Fondateur — Plus que <strong>{founderRemaining}</strong> places sur {FOUNDER_TOTAL_SEATS}</span>
                      )}
                    </div>
                    <div style={{
                      height: '6px',
                      background: 'var(--border-2)',
                      borderRadius: '100px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${founderPct}%`,
                        background: founderExhausted
                          ? 'rgba(255,255,255,.2)'
                          : founderUrgent
                            ? 'linear-gradient(90deg,#ff7a3d,#ff5722)'
                            : 'linear-gradient(90deg,#d4a400,#ffc94d)',
                        borderRadius: '100px',
                        transition: 'width .7s cubic-bezier(.4,0,.2,1)',
                      }} />
                    </div>
                    {!founderExhausted && (
                      <p style={{ fontSize: '11.5px', color: 'var(--text-2)', lineHeight: 1.55, margin: 0 }}>
                        Chaque place fondateur garantit le tarif de <strong style={{ color: 'var(--accent-text)' }}>19,98 €/an à vie</strong>.
                      </p>
                    )}
                  </div>

                  <div style={styles.priceRow}>
                    {founderExhausted ? (
                      <>
                        <span style={styles.price}>38,98 €</span>
                        <span style={styles.priceLabel}> / an HT</span>
                      </>
                    ) : (
                      <>
                        <span style={styles.price}>19,98 €</span>
                        <span style={styles.priceLabel}> / an HT</span>
                        <span style={styles.priceStrike}>38,98 €</span>
                      </>
                    )}
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
                  {founderExhausted ? (
                    <SubscribeButton priceId={STRIPE_PLANS.STANDARD_PUBLIC_YEARLY} label="Passer en Standard, 38,98 €/an" />
                  ) : (
                    <SubscribeButton priceId={STRIPE_PLANS.STANDARD_FOUNDING_YEARLY} label="Passer en Standard, 19,98 €/an" />
                  )}
                  <p style={styles.smallNote}>
                    {founderExhausted
                      ? 'Facturation annuelle uniquement. Résiliable à tout moment depuis ton espace.'
                      : 'Prix HT bloqué à vie tant que l’abonnement est actif. Facturation annuelle. Résiliable à tout moment.'}
                  </p>
                </div>
              </>
            )}

            {/* Driing, visible si non Driing */}
            {!isDriing && (
              <>
                <div style={{ ...styles.sectionLabel, marginTop: isDecouverte ? '8px' : 0 }} className="fade-up">
                  <Star size={12} color="#FFD56B" weight="fill" />
                  Inclus avec Driing
                </div>
                <div style={styles.driingRow} className="fade-up d2">
                  <div style={styles.driingRowGlow} />
                  <div style={{ ...styles.upgradeName, color: 'var(--accent-text)' }}>Membre Driing</div>
                  <p style={styles.planDesc}>Tu es client Driing ? Toute la plateforme est incluse sans surcoût, aucun paiement séparé.</p>
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

            {/* Gérer abonnement, Standard actif */}
            {isStandard && (
              <>
                <div style={styles.sectionLabel} className="fade-up">
                  <Wrench size={12} />
                  Mon abonnement
                </div>
                <div style={styles.manageCard} className="fade-up d1">
                  {subDetails ? (
                    <SubscriptionDetails details={subDetails} invoices={invoices} />
                  ) : (
                    <>
                      <p style={styles.planDesc}>Modifie, mets en pause ou résilie ton abonnement depuis le portail Stripe.</p>
                      <ManageButton />
                    </>
                  )}
                </div>
              </>
            )}

            {/* Driing payant : détails abonnement Stripe ───────────────── */}
            {isDriing && subDetails && (
              <>
                <div style={styles.sectionLabel} className="fade-up">
                  <Wrench size={12} />
                  Mon abonnement Driing
                </div>
                <div style={styles.manageCard} className="fade-up d1">
                  <SubscriptionDetails details={subDetails} invoices={invoices} />
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
  intro: { marginBottom: 'var(--s-8)' },
  pageTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(28px,3vw,40px)', fontWeight: 400,
    color: 'var(--text)', marginBottom: 'var(--s-3)',
    letterSpacing: 'var(--ls-tight)',
  },
  pageDesc: {
    fontSize: 'var(--t-md)', fontWeight: 400, color: 'var(--text-2)',
    maxWidth: '560px', lineHeight: 'var(--lh-relax)',
  },
  mainGrid: { gap: 'var(--s-7)' },
  leftCol: {},
  rightCol: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--s-4)' },

  planLabel: {
    display: 'inline-flex', alignItems: 'center', gap: 'var(--s-2)',
    fontSize: 'var(--t-xs)', fontWeight: 700, letterSpacing: '0.6px',
    textTransform: 'uppercase' as const, color: 'var(--success-1)',
  },
  dot: { width: '7px', height: '7px', borderRadius: '50%', background: 'var(--success-1)' },
  planName: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'var(--t-3xl)', fontWeight: 400, color: 'var(--text)',
    letterSpacing: 'var(--ls-tight)',
  },
  planDesc: {
    fontSize: 'var(--t-sm)', fontWeight: 400, color: 'var(--text-3)',
    lineHeight: 'var(--lh-relax)', margin: 0,
  },
  featureList: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--s-3)' },
  featureItem: {
    display: 'flex', alignItems: 'center', gap: 'var(--s-2)',
    fontSize: 'var(--t-sm)', fontWeight: 400, color: 'var(--text-2)',
  },
  smallNote: {
    fontSize: 'var(--t-xs)', fontWeight: 400, color: 'var(--text-muted)',
    lineHeight: 'var(--lh-relax)', borderTop: '1px solid var(--border)',
    paddingTop: 'var(--s-3)', marginTop: 'var(--s-1)',
  },

  priceRow: { display: 'flex', alignItems: 'baseline', gap: 'var(--s-1)', flexWrap: 'wrap' as const },
  price: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'var(--t-2xl)', fontWeight: 600, color: 'var(--text)',
    letterSpacing: 'var(--ls-tight)',
  },
  priceLabel: { fontSize: 'var(--t-sm)', color: 'var(--text-muted)' },
  priceStrike: { fontSize: 'var(--t-xs)', color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: 'var(--s-1)' },

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

  /* Current plan cards : mesh gradient + halo accent 2026 */
  currentBanner: {
    position: 'relative' as const, overflow: 'hidden' as const,
    padding: 'var(--s-8)', display: 'flex', flexDirection: 'column' as const, gap: 'var(--s-4)',
    background: 'radial-gradient(ellipse 80% 60% at 100% 0%, var(--success-bg), transparent 60%), var(--surface)',
    border: '1px solid var(--success-border)',
    borderRadius: 'var(--r-xl)',
    boxShadow: 'var(--shadow-md)',
  },
  standardBanner: {
    position: 'relative' as const, overflow: 'hidden' as const,
    padding: 'var(--s-8)', display: 'flex', flexDirection: 'column' as const, gap: 'var(--s-4)',
    background: 'radial-gradient(ellipse 80% 60% at 100% 0%, var(--accent-bg-2), transparent 60%), linear-gradient(135deg, rgba(0,76,63,0.10) 0%, transparent 70%)',
    border: '1px solid var(--accent-border)',
    borderRadius: 'var(--r-xl)',
    boxShadow: 'var(--shadow-md)',
  },
  driingBanner: {
    position: 'relative' as const, overflow: 'hidden' as const,
    padding: 'var(--s-8)',
    display: 'flex', flexDirection: 'column' as const, gap: 'var(--s-4)',
    background: 'radial-gradient(ellipse 80% 60% at 100% 0%, var(--accent-bg-2), transparent 60%), var(--surface)',
    border: '1px solid var(--accent-border-2)',
    borderRadius: 'var(--r-xl)',
    boxShadow: 'var(--shadow-md)',
  },
  driingGlow: {
    position: 'absolute' as const, top: '-60px', right: '-60px',
    width: '200px', height: '200px', borderRadius: '50%',
    background: 'radial-gradient(circle, var(--accent-bg-2) 0%, transparent 70%)',
    pointerEvents: 'none' as const,
  },

  /* Right column */
  sectionLabel: { display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--text-muted)' },

  upgradeCard: {
    position: 'relative', overflow: 'hidden',
    display: 'flex', flexDirection: 'column', gap: '14px',
    background: 'linear-gradient(135deg, rgba(0,76,63,0.1) 0%, rgba(0,76,63,0.04) 100%)',
    border: '1px solid rgba(0,76,63,0.2)', borderRadius: '16px', padding: '24px',
  },
  upgradeGlow: { position: 'absolute', top: '-40px', right: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)', pointerEvents: 'none' },
  upgradeName: { fontFamily: 'var(--font-fraunces), serif', fontSize: '22px', fontWeight: 400, color: 'var(--text)' },
  ctaStandard: { display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'var(--success-bg)', border: '1px solid rgba(52,211,153,0.25)', color: 'var(--success-1)', fontSize: '13px', fontWeight: 600, padding: '11px 18px', borderRadius: '10px', textDecoration: 'none', transition: 'all .2s', marginTop: '4px' },

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

  alertSuccess: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 500, color: 'var(--success-1)', background: 'var(--success-bg)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px' },
  alertInfo: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 400, color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px' },

  kofi: { display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' as const, marginTop: '40px', padding: '20px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px' },
  kofiTitle: { fontSize: '14px', fontWeight: 500, color: 'var(--text)', margin: '0 0 2px' },
  kofiDesc: { fontSize: '12px', fontWeight: 300, color: 'var(--text-muted)', margin: 0 },
  kofiBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--primary)', color: '#002820', fontSize: '13px', fontWeight: 600, padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', whiteSpace: 'nowrap' as const, flexShrink: 0 },
}
