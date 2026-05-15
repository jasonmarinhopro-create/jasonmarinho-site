import Link from 'next/link'
import { Warning, CurrencyEur, CheckCircle, ArrowRight } from '@phosphor-icons/react/dist/ssr'

interface Contract {
  id: string
  logement_nom: string | null
  date_arrivee: string
  montant_loyer: number | null
  checklist_status: unknown
  stripe_payment_enabled: boolean | null
  stripe_payment_status: string | null
  locataire_prenom?: string | null
  locataire_nom?: string | null
}

interface Props {
  unsignedContracts: Contract[]
  pendingPayments: Contract[]
  today: string
}

function diffDays(from: string, to: string) {
  return Math.round((new Date(to + 'T12:00').getTime() - new Date(from + 'T12:00').getTime()) / 86400000)
}

function fmtShort(d: string) {
  const MONTHS = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']
  const [, m, day] = d.split('-')
  return `${parseInt(day)} ${MONTHS[parseInt(m) - 1]}`
}

export default function ActionUrgente({ unsignedContracts, pendingPayments, today }: Props) {
  // Cascade: contrat expirant dans ≤5j > paiement en attente > tout va bien
  const criticalUnsigned = unsignedContracts.filter(c => diffDays(today, c.date_arrivee) <= 5)
  const firstCritical    = criticalUnsigned[0] ?? unsignedContracts[0] ?? null
  const firstPayment     = pendingPayments[0] ?? null

  // Tout va bien
  if (!firstCritical && !firstPayment) {
    return (
      <div style={s.cardGreen} className="glass-card">
        <CheckCircle size={22} color="#10b981" weight="fill" style={{ flexShrink: 0 }} />
        <div>
          <p style={s.greenTitle}>Tout est à jour, beau travail ! 🌿</p>
          <p style={s.greenSub}>Aucun contrat en attente, aucun paiement à relancer.</p>
        </div>
      </div>
    )
  }

  // Contrat non signé (priorité 1)
  if (firstCritical) {
    const days   = diffDays(today, firstCritical.date_arrivee)
    const who    = [firstCritical.locataire_prenom, firstCritical.locataire_nom].filter(Boolean).join(' ')
    const urgent = days <= 2
    const color  = urgent ? 'var(--danger)' : '#f97316'
    const others = unsignedContracts.length - 1

    return (
      <Link href="/dashboard/calendrier" style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{ ...s.card, borderLeftColor: color, borderLeftWidth: '3px' }} className="glass-card action-urgent-hover">
          <div style={{ ...s.iconWrap, background: color + '15', color }}>
            <Warning size={20} weight="fill" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <span style={{ ...s.badge, background: color + '18', color }}>
                {urgent ? 'Urgent' : 'À traiter'}
              </span>
              <span style={s.cardTitle}>Contrat non signé</span>
            </div>
            <p style={s.cardText}>
              {who ? <><strong style={{ color: 'var(--text-2)' }}>{who}</strong> n&apos;a pas encore signé. </> : ''}
              Logement&nbsp;: <strong style={{ color: 'var(--text-2)' }}>{firstCritical.logement_nom ?? 'inconnu'}</strong>
              {' · '}Arrivée le <strong style={{ color }}>
                {days === 0 ? "aujourd'hui" : days === 1 ? 'demain' : `${fmtShort(firstCritical.date_arrivee)} (dans ${days}j)`}
              </strong>.
            </p>
            {others > 0 && (
              <p style={s.cardMore}>+ {others} autre{others > 1 ? 's' : ''} contrat{others > 1 ? 's' : ''} en attente</p>
            )}
          </div>
          <ArrowRight size={16} color={color} style={{ flexShrink: 0, alignSelf: 'center' }} />
        </div>
      </Link>
    )
  }

  // Paiement en attente (priorité 2)
  const others = pendingPayments.length - 1
  return (
    <Link href="/dashboard/revenus" style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ ...s.card, borderLeftColor: '#3b82f6', borderLeftWidth: '3px' }} className="glass-card action-urgent-hover">
        <div style={{ ...s.iconWrap, background: '#3b82f615', color: '#3b82f6' }}>
          <CurrencyEur size={20} weight="fill" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ ...s.badge, background: '#3b82f618', color: '#3b82f6' }}>Paiement</span>
            <span style={s.cardTitle}>En attente de règlement</span>
          </div>
          <p style={s.cardText}>
            Logement&nbsp;: <strong style={{ color: 'var(--text-2)' }}>{firstPayment.logement_nom ?? 'inconnu'}</strong>
            {firstPayment.montant_loyer ? <> · <strong style={{ color: '#3b82f6' }}>{firstPayment.montant_loyer}&nbsp;€</strong> non encaissé</> : ' · Paiement Stripe en attente'}.
          </p>
          {others > 0 && (
            <p style={s.cardMore}>+ {others} autre{others > 1 ? 's' : ''} paiement{others > 1 ? 's' : ''} en attente</p>
          )}
        </div>
        <ArrowRight size={16} color="#3b82f6" style={{ flexShrink: 0, alignSelf: 'center' }} />
      </div>
    </Link>
  )
}

const s: Record<string, React.CSSProperties> = {
  cardGreen: {
    display: 'flex', alignItems: 'center', gap: 'var(--s-4)',
    padding: 'var(--s-4) var(--s-5)', borderRadius: 'var(--r-lg)',
    border: '1px solid var(--success-border)',
    background: 'var(--success-bg)',
  },
  greenTitle: { margin: 0, fontSize: 'var(--t-base)', fontWeight: 600, color: 'var(--success-1)' },
  greenSub:   { margin: 'var(--s-1) 0 0', fontSize: 'var(--t-xs)', color: 'var(--text-muted)' },

  card: {
    display: 'flex', alignItems: 'flex-start', gap: 'var(--s-4)',
    padding: 'var(--s-5) var(--s-5)', borderRadius: 'var(--r-lg)',
    border: '1px solid var(--border)', borderLeft: '3px solid',
    background: 'var(--surface)',
    transition: 'transform var(--d-base) var(--ease-smooth), border-color var(--d-base) var(--ease-smooth), box-shadow var(--d-base) var(--ease-smooth)',
  },
  iconWrap: {
    width: '42px', height: '42px', borderRadius: 'var(--r-md)', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform var(--d-base) var(--ease-spring)',
  },
  badge: {
    fontSize: 'var(--t-xs)', fontWeight: 700, letterSpacing: '0.4px',
    textTransform: 'uppercase' as const, padding: '3px 9px', borderRadius: 'var(--r-pill)',
  },
  cardTitle: { fontSize: 'var(--t-base)', fontWeight: 600, color: 'var(--text)' },
  cardText:  { margin: 0, fontSize: 'var(--t-sm)', color: 'var(--text-2)', lineHeight: 'var(--lh-base)' },
  cardMore:  {
    margin: 'var(--s-2) 0 0', fontSize: 'var(--t-xs)',
    color: 'var(--text-3)', fontStyle: 'italic' as const,
  },
}
