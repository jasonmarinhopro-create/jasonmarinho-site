import Link from 'next/link'
import { CreditCard, CalendarBlank, ArrowRight, CheckCircle, WarningCircle, Crown, Star } from '@phosphor-icons/react/dist/ssr'
import type { SubscriptionDetails } from '@/lib/stripe/subscription-info'

type PlanLabel = 'Découverte' | 'Standard' | 'Membre Driing' | 'Administrateur'

type Props = {
  planLabel: PlanLabel
  subscription: SubscriptionDetails | null
}

function fmtDate(unix: number | null | undefined): string {
  if (!unix) return '—'
  try {
    return new Date(unix * 1000).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch { return '—' }
}

function fmtMoney(cents: number | null, currency: string | null): string {
  if (cents == null || !currency) return ''
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100)
  } catch { return `${(cents / 100).toFixed(2)} €` }
}

export default function AbonnementCard({ planLabel, subscription }: Props) {
  const isAdmin = planLabel === 'Administrateur'
  const isFree = planLabel === 'Découverte'
  const sub = subscription

  // Couleurs par plan
  const accent =
    isAdmin            ? '#c084fc'
    : planLabel === 'Membre Driing' ? 'var(--accent-text)'
    : planLabel === 'Standard'      ? '#34D399'
    : 'var(--text-3)'

  return (
    <section style={s.card}>
      <header style={s.head}>
        <span style={s.icon}><CreditCard size={16} weight="duotone" /></span>
        <h3 style={s.title}>Mon abonnement</h3>
      </header>

      <div style={s.row}>
        <div style={{ ...s.planChip, color: accent, borderColor: accent, background: `color-mix(in srgb, ${accent} 12%, transparent)` }}>
          {isAdmin && <Crown size={12} weight="fill" />}
          {planLabel === 'Membre Driing' && <Star size={12} weight="fill" />}
          {planLabel}
        </div>
        {sub?.amount != null && sub.currency && (
          <span style={s.price}>
            {fmtMoney(sub.amount, sub.currency)}
            <span style={s.priceSuffix}> / {sub.interval === 'year' ? 'an' : 'mois'}</span>
          </span>
        )}
      </div>

      {/* État + renouvellement */}
      {sub && (
        <div style={s.metaList}>
          {sub.status === 'past_due' ? (
            <div style={{ ...s.meta, color: 'var(--warning)' }}>
              <WarningCircle size={13} weight="fill" /> Paiement en échec — action requise
            </div>
          ) : sub.cancelAtPeriodEnd ? (
            <div style={{ ...s.meta, color: 'var(--warning)' }}>
              <WarningCircle size={13} weight="fill" /> Résiliation programmée le {fmtDate(sub.cancelAt ?? sub.currentPeriodEnd)}
            </div>
          ) : (
            <>
              <div style={s.meta}>
                <CheckCircle size={13} weight="fill" style={{ color: '#34D399' }} /> Abonnement actif
              </div>
              {sub.currentPeriodEnd && (
                <div style={s.meta}>
                  <CalendarBlank size={13} weight="duotone" /> Prochain renouvellement : {fmtDate(sub.currentPeriodEnd)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {isAdmin && (
        <p style={s.note}>
          Accès administrateur sans abonnement requis.
        </p>
      )}

      {isFree && (
        <p style={s.note}>
          Tu es en plan gratuit Découverte. Passe en Standard pour débloquer logements illimités, contrats Stripe et toutes les formations.
        </p>
      )}

      <Link href="/dashboard/abonnement" style={s.cta}>
        {isFree ? "Voir les offres" : "Gérer mon abonnement"}
        <ArrowRight size={12} weight="bold" />
      </Link>
    </section>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  head: { display: 'flex', alignItems: 'center', gap: '10px' },
  icon: {
    width: 30, height: 30, borderRadius: 8,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--accent-bg)',
    color: 'var(--accent-text)',
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '17px', fontWeight: 400,
    color: 'var(--text)',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: '10px',
    flexWrap: 'wrap',
  },
  planChip: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.3px',
    padding: '4px 10px', borderRadius: '999px',
    border: '1px solid',
  },
  price: {
    fontSize: '14px', fontWeight: 600, color: 'var(--text)',
    fontFamily: 'var(--font-fraunces), serif',
  },
  priceSuffix: {
    fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)',
    fontFamily: 'inherit',
  },
  metaList: {
    display: 'flex', flexDirection: 'column', gap: '6px',
    paddingTop: '4px',
  },
  meta: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '12.5px', color: 'var(--text-2)',
  },
  note: {
    fontSize: '12.5px', color: 'var(--text-muted)',
    lineHeight: 1.5, margin: 0,
  },
  cta: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: '6px',
    padding: '9px 14px',
    borderRadius: '10px',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)',
    fontSize: '12.5px', fontWeight: 600,
    textDecoration: 'none',
    marginTop: '2px',
    transition: 'all .15s ease',
  },
}
