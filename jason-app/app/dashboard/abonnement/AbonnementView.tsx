import { Check, Wrench, Star, CheckCircle, XCircle, ShieldStar, Crown, LockKey } from '@phosphor-icons/react/dist/ssr'
import HubHero, { HeroEm, heroCard } from '@/components/dashboard/HubHero'
import DriingRequestForm from './DriingRequestForm'
import SubscribeButton from './SubscribeButton'
import ManageButton from './ManageButton'
import SubscriptionDetails from './SubscriptionDetails'
import { STRIPE_PLANS } from '@/lib/constants/stripe-plans'
import { FOUNDER_TOTAL_SEATS } from '@/lib/constants/founder'
import { FORMATIONS_TOTAL } from '@/lib/constants/auto-counts'
import type { getSubscriptionDetails, listRecentInvoices } from '@/lib/stripe/subscription-info'

// Affichage de « Mon abonnement » (sept. 2026 : séparé du chargement des
// données dans page.tsx pour pouvoir le prévisualiser avec des données fictives).

// Mêmes listes que la page /tarifs du site (à garder synchronisées) :
// formules revues en sept. 2026 (planning ménage, déclarations, Questions &
// réponses avec 2 questions par mois en gratuit, audit Google ouvert à tous).
const DECOUVERTE_FEATURES = [
  'Logements et voyageurs illimités',
  'Calendrier, planning ménage + journal des revenus',
  'Déclarations voyageurs (fiche de police, SIBA)',
  'Questions & réponses : 2 questions par mois',
  'Simulateurs (rentabilité, fiscalité) + audit de ta fiche Google',
  'Guide LCD, actualités, modèles de messages (FR + EN)',
  'Sécurité voyageur (consulter + signaler)',
  '2 formations au choix',
]

const STANDARD_FEATURES = [
  'Contrats signés en ligne (FR, PT, EN) + paiement Stripe',
  'Caution par empreinte bancaire',
  'État des lieux digital',
  'Performances détaillées',
  `${FORMATIONS_TOTAL} formations complètes`,
  'Questions & réponses illimitées',
  'Support prioritaire',
]

const DRIING_FEATURES = [
  'Tout le plan Standard inclus',
  'Badge Membre Driing dans l\'app',
  'Support prioritaire + Q&A en direct',
  'Accès anticipé aux nouveautés',
]

export type AbonnementViewProps = {
  isAdmin: boolean
  isDriing: boolean
  isStandard: boolean
  isDecouverte: boolean
  subscriptionResult?: string
  founderRemaining: number
  userEmail: string
  driingStatus: 'none' | 'pending' | 'confirmed'
  subDetails: Awaited<ReturnType<typeof getSubscriptionDetails>>
  invoices: Awaited<ReturnType<typeof listRecentInvoices>>
}

export default function AbonnementView({ isAdmin, isDriing, isStandard, isDecouverte, subscriptionResult, founderRemaining, userEmail, driingStatus, subDetails, invoices }: AbonnementViewProps) {
  const founderExhausted = founderRemaining === 0
  const founderUrgent    = !founderExhausted && founderRemaining < 10
  const founderPct       = Math.round(((FOUNDER_TOTAL_SEATS - founderRemaining) / FOUNDER_TOTAL_SEATS) * 100)

  return (
    <>

      <div style={styles.page}>
        {/* En-tête (DA 28/09/2026) : bandeau vert HubHero ; à droite, l'offre
            Fondateur (formule gratuite) ou le prochain renouvellement. */}
        <HubHero
          eyebrowIcon={<Star size={14} weight="fill" />}
          eyebrow="Mon abonnement"
          title={isAdmin ? <>Accès <HeroEm>administrateur</HeroEm></> : <>Formule <HeroEm>{isDriing ? 'Membre Driing' : isStandard ? 'Standard' : 'Découverte'}</HeroEm></>}
          desc={isAdmin
            ? 'Tout est ouvert, sans abonnement.'
            : isDriing
              ? 'Toute la plateforme est incluse avec ton abonnement Driing, sans paiement séparé.'
              : isStandard
                ? 'Merci de soutenir l’app. Ici, ton renouvellement, tes factures et la gestion de ton abonnement.'
                : 'Le quotidien de ta location est gratuit. Standard ajoute les contrats signés en ligne avec paiement et caution, et toutes les formations.'}
          aside={isDecouverte ? (
            <div style={{ ...heroCard, width: '100%' }}>
              <div style={styles.asideTitle}>{founderExhausted ? 'Formule Standard' : 'Offre Fondateur'}</div>
              {founderExhausted ? (
                <div style={styles.asidePrice}>38,98 € <span style={styles.priceLabel}>/ an TTC</span></div>
              ) : (
                <>
                  <div style={styles.asidePrice}>19,98 € <span style={styles.priceLabel}>/ an TTC, à vie</span> <span style={styles.priceStrike}>38,98 €</span></div>
                  <span style={styles.seatBar}><span style={{ ...styles.seatFill, width: `${founderPct}%` }} /></span>
                  <div style={{ fontSize: 12.5, color: founderUrgent ? '#B7791F' : 'var(--text-2)', fontWeight: founderUrgent ? 700 : 500 }}>
                    Plus que {founderRemaining} place{founderRemaining > 1 ? 's' : ''} sur {FOUNDER_TOTAL_SEATS}
                  </div>
                </>
              )}
              <a href="#offre-standard" style={styles.asideLink}>Voir ce que tu débloques</a>
            </div>
          ) : (isStandard || isDriing) && subDetails?.currentPeriodEnd ? (
            <div style={{ ...heroCard, width: '100%' }}>
              <div style={styles.asideTitle}>{subDetails.cancelAtPeriodEnd ? 'Se termine le' : 'Prochain renouvellement'}</div>
              <div style={styles.asidePrice}>
                {new Date(subDetails.currentPeriodEnd * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })}
              </div>
              {subDetails.amount != null && !subDetails.cancelAtPeriodEnd && (
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                  {(subDetails.amount / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € / {subDetails.interval === 'month' ? 'mois' : 'an'} TTC
                  {subDetails.isFounding && <> · tarif Fondateur</>}
                </div>
              )}
            </div>
          ) : undefined}
        />

        {subscriptionResult === 'success' && (
          <div style={styles.alertSuccess} className="fade-up">
            <CheckCircle size={18} color="var(--accent-text)" weight="fill" />
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
                <div style={{ ...styles.planLabel, color: 'var(--accent-text)' }}>
                  <div style={{ ...styles.dot, background: 'var(--accent-text)' }} />
                  Plan actuel
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ ...styles.planName, color: 'var(--accent-text)' }}>Administrateur</div>
                  <Crown size={20} color="var(--accent-text)" weight="fill" />
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
                      <ShieldStar size={13} color="var(--accent-text)" weight="fill" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isDriing && (
              <div style={styles.driingBanner} className="glass-card fade-up">
                <div style={{ ...styles.planLabel, color: 'var(--accent-text)' }}>
                  <div style={{ ...styles.dot, background: 'var(--accent-text)' }} />
                  Plan actuel
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ ...styles.planName, color: 'var(--accent-text)' }}>Membre Driing</div>
                  <Star size={18} color="#B7791F" weight="fill" />
                </div>
                <p style={styles.planDesc}>Accès complet à la plateforme, aux formations et à la communauté privée Driing.</p>
                <div style={styles.featureList}>
                  {DRIING_FEATURES.map(f => (
                    <div key={f} style={styles.featureItem}>
                      <Check size={13} color="var(--accent-text)" weight="bold" />
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
                  {subDetails?.isFounding && <div style={styles.fmPill}><span style={styles.fmDot} />Membre Fondateur</div>}
                </div>
                {subDetails?.amount != null && (
                  <div style={styles.priceRow}>
                    <span style={styles.price}>{(subDetails.amount / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                    <span style={styles.priceLabel}> / {subDetails.interval === 'month' ? 'mois' : 'an'} TTC</span>
                  </div>
                )}
                <p style={styles.planDesc}>Tous les outils pour piloter ton activité LCD.</p>
                <div style={styles.featureList}>
                  {STANDARD_FEATURES.map(f => (
                    <div key={f} style={styles.featureItem}>
                      <Check size={13} color="var(--accent-text)" weight="bold" />
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
                      <Check size={13} color="var(--accent-text)" weight="bold" />
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
                <div id="offre-standard" style={styles.upgradeCard} className="fade-up d1">
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
                        ? 'rgba(255,213,107,0.18)'
                        : 'var(--accent-bg)',
                    border: `1px solid ${founderExhausted ? 'var(--border)' : founderUrgent ? 'rgba(255,213,107,0.45)' : 'var(--accent-border)'}`,
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
                      color: founderExhausted ? 'var(--text-2)' : founderUrgent ? '#8A5A12' : 'var(--accent-text)',
                    }}>
                      <LockKey size={14} weight="fill" />
                      {founderExhausted ? (
                        <span>Offre Fondateur épuisée : tarif Standard à <strong>38,98 €/an</strong></span>
                      ) : (
                        <span>Offre Fondateur : plus que <strong>{founderRemaining}</strong> places sur {FOUNDER_TOTAL_SEATS}</span>
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
                          ? 'var(--text-muted)'
                          : founderUrgent
                            ? '#B7791F'
                            : 'var(--accent-text)',
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
                        <span style={styles.priceLabel}> / an TTC</span>
                      </>
                    ) : (
                      <>
                        <span style={styles.price}>19,98 €</span>
                        <span style={styles.priceLabel}> / an TTC</span>
                        <span style={styles.priceStrike}>38,98 €</span>
                      </>
                    )}
                  </div>
                  <p style={styles.planDesc}>Contrats, paiement en ligne et formations complètes.</p>
                  <div style={styles.featureList}>
                    {STANDARD_FEATURES.map(f => (
                      <div key={f} style={styles.featureItem}>
                        <Check size={13} color="var(--accent-text)" weight="bold" />
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
                      : 'Prix bloqué à vie tant que l’abonnement est actif. Facturation annuelle. Résiliable à tout moment.'}
                    {' '}TVA non applicable, art. 293 B du CGI : le prix affiché est le prix payé.
                  </p>
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

            {/* Driing, visible si non Driing */}
            {!isDriing && (
              <>
                <div style={{ ...styles.sectionLabel, marginTop: '8px' }} className="fade-up">
                  <Star size={12} color="#B7791F" weight="fill" />
                  Inclus avec Driing
                </div>
                <div style={styles.driingRow} className="fade-up d2">
                  <div style={{ ...styles.upgradeName, color: 'var(--accent-text)' }}>Membre Driing</div>
                  <p style={styles.planDesc}>Tu es client Driing ? Toute la plateforme est incluse sans surcoût, aucun paiement séparé.</p>
                  <div style={styles.perks} className="abo-perks">
                    {DRIING_FEATURES.map(p => (
                      <span key={p} style={styles.perk}>
                        <Check size={10} color="var(--accent-text)" weight="bold" />
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
  page: { padding: '20px var(--dash-page-px) 48px', width: '100%' },
  asideTitle: { fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  asidePrice: { fontFamily: 'var(--font-fraunces), serif', fontSize: 24, fontWeight: 500, color: 'var(--text)', lineHeight: 1.15 },
  asideLink: { fontSize: 13, fontWeight: 700, color: 'var(--accent-text)', textDecoration: 'underline', textUnderlineOffset: 3 },
  seatBar: { display: 'block', height: 7, borderRadius: 6, background: 'var(--surface-2)', overflow: 'hidden' },
  seatFill: { display: 'block', height: '100%', borderRadius: 6, background: 'var(--accent-text)' },
  mainGrid: { gap: 'var(--s-6)' },
  leftCol: {},
  rightCol: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--s-4)' },

  planLabel: {
    display: 'inline-flex', alignItems: 'center', gap: 'var(--s-2)',
    fontSize: 'var(--t-xs)', fontWeight: 700, letterSpacing: '0.6px',
    textTransform: 'uppercase' as const, color: 'var(--accent-text)',
  },
  dot: { width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-text)' },
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

  fmPill: { display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(255,213,107,0.1)', border: '1px solid rgba(255,213,107,0.25)', color: '#8A5A12', fontSize: '10px', fontWeight: 700, letterSpacing: '0.3px', padding: '3px 9px', borderRadius: '100px' },
  fmDot: { width: '4px', height: '4px', borderRadius: '50%', background: '#B7791F', flexShrink: 0 },

  /* Admin banner */
  adminBanner: {
    position: 'relative', overflow: 'hidden', padding: '32px',
    display: 'flex', flexDirection: 'column', gap: '16px',
    background: 'linear-gradient(135deg, var(--accent-bg) 0%, rgba(255,213,107,0.10) 100%)',
    border: '1px solid var(--accent-border)', borderRadius: '20px',
  },

  /* Current plan cards : mesh gradient + halo accent 2026 */
  currentBanner: {
    position: 'relative' as const, overflow: 'hidden' as const,
    padding: 'var(--s-8)', display: 'flex', flexDirection: 'column' as const, gap: 'var(--s-4)',
    background: 'var(--surface)',
    border: '1px solid var(--accent-border)',
    borderRadius: 'var(--r-xl, 18px)',
  },
  standardBanner: {
    position: 'relative' as const, overflow: 'hidden' as const,
    padding: 'var(--s-8)', display: 'flex', flexDirection: 'column' as const, gap: 'var(--s-4)',
    background: 'var(--surface)',
    border: '1px solid var(--accent-border)',
    borderRadius: 'var(--r-xl, 18px)',
  },
  driingBanner: {
    position: 'relative' as const, overflow: 'hidden' as const,
    padding: 'var(--s-8)',
    display: 'flex', flexDirection: 'column' as const, gap: 'var(--s-4)',
    background: 'var(--surface)',
    border: '1px solid var(--accent-border)',
    borderRadius: 'var(--r-xl, 18px)',
  },

  /* Right column */
  sectionLabel: { display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--text-muted)' },

  upgradeCard: {
    position: 'relative', overflow: 'hidden',
    display: 'flex', flexDirection: 'column', gap: '14px',
    background: 'var(--surface)',
    border: '1px solid var(--accent-border)', borderRadius: 'var(--r-xl, 18px)', padding: 'clamp(18px, 2.4vw, 26px)',
  },
  upgradeName: { fontFamily: 'var(--font-fraunces), serif', fontSize: '22px', fontWeight: 400, color: 'var(--text)' },
  ctaStandard: { display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'var(--success-bg)', border: '1px solid rgba(52,211,153,0.25)', color: 'var(--accent-text)', fontSize: '13px', fontWeight: 600, padding: '11px 18px', borderRadius: '10px', textDecoration: 'none', transition: 'all .2s', marginTop: '4px' },

  driingRow: {
    position: 'relative', overflow: 'hidden',
    display: 'flex', flexDirection: 'column', gap: '14px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-xl, 18px)', padding: 'clamp(18px, 2.4vw, 26px)',
  },
  perks: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  perk: { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-2)' },

  manageCard: {
    display: 'flex', flexDirection: 'column', gap: '14px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-xl, 18px)', padding: 'clamp(18px, 2.4vw, 26px)',
  },
  ctaManage: { display: 'inline-flex', alignItems: 'center', gap: '7px', color: 'var(--text-2)', fontSize: '13px', fontWeight: 500, textDecoration: 'none' },

  alertSuccess: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 500, color: 'var(--accent-text)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px' },
  alertInfo: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 400, color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px' },

  kofi: { display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' as const, marginTop: '40px', padding: '20px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px' },
  kofiTitle: { fontSize: '14px', fontWeight: 500, color: 'var(--text)', margin: '0 0 2px' },
  kofiDesc: { fontSize: '12px', fontWeight: 300, color: 'var(--text-muted)', margin: 0 },
  kofiBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--primary)', color: '#002820', fontSize: '13px', fontWeight: 600, padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', whiteSpace: 'nowrap' as const, flexShrink: 0 },
}
