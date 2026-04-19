import Link from 'next/link'
import { Lock, ArrowRight, Star } from '@phosphor-icons/react/dist/ssr'

interface Props {
  title?: string
  description?: string
  feature?: 'formations' | 'revenus' | 'contrats' | 'partenaires' | 'actualites'
}

const COPY: Record<string, { title: string; description: string }> = {
  formations: {
    title: 'Tu as utilisé tes 2 accès gratuits',
    description: 'Passe en Standard pour débloquer les 14 formations complètes, à vie et à ton rythme.',
  },
  revenus: {
    title: 'Journal des revenus — Standard',
    description: 'Le suivi détaillé de tes revenus et contrats est réservé aux membres Standard et Driing.',
  },
  contrats: {
    title: 'Contrats & paiement — Standard',
    description: 'La création de contrats, les PDF et le paiement Stripe sont réservés aux membres Standard et Driing.',
  },
  partenaires: {
    title: 'Offre exclusive — Standard',
    description: 'Les codes promo et avantages exclusifs des partenaires sont réservés aux membres Standard et Driing.',
  },
  actualites: {
    title: 'Toutes les actualités — Standard',
    description: 'Accède à l\'intégralité des actualités LCD en passant en Standard.',
  },
}

export default function PlanGate({ title, description, feature = 'formations' }: Props) {
  const copy = COPY[feature]
  const displayTitle = title ?? copy.title
  const displayDesc = description ?? copy.description

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.iconWrap}>
          <Lock size={22} weight="duotone" color="#FFD56B" />
        </div>

        <div style={s.content}>
          <div style={s.badge}>
            <Star size={10} weight="fill" color="#FFD56B" />
            Standard
          </div>
          <h3 style={s.title}>{displayTitle}</h3>
          <p style={s.desc}>{displayDesc}</p>

          <div style={s.actions}>
            <Link href="/abonnement" style={s.cta}>
              Passer en Standard — 1,98 €/mois
              <ArrowRight size={14} weight="bold" />
            </Link>
            <Link href="/abonnement" style={s.secondary}>
              Voir les offres
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    padding: 'clamp(16px,3vw,44px)',
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
  },
  card: {
    display: 'flex',
    gap: '20px',
    padding: '28px 32px',
    background: 'var(--surface)',
    border: '1px solid rgba(255,213,107,0.2)',
    borderRadius: '18px',
    maxWidth: '560px',
    alignItems: 'flex-start',
  },
  iconWrap: {
    flexShrink: 0,
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'rgba(255,213,107,0.1)',
    border: '1px solid rgba(255,213,107,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { display: 'flex', flexDirection: 'column', gap: '10px' },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.6px',
    textTransform: 'uppercase' as const,
    color: '#FFD56B',
    background: 'rgba(255,213,107,0.1)',
    border: '1px solid rgba(255,213,107,0.2)',
    borderRadius: '999px',
    padding: '3px 10px',
    width: 'fit-content',
  },
  title: {
    fontFamily: 'Fraunces, serif',
    fontSize: '20px',
    fontWeight: 400,
    color: 'var(--text)',
    margin: 0,
    lineHeight: 1.3,
  },
  desc: {
    fontSize: '13px',
    color: 'var(--text-2)',
    lineHeight: 1.65,
    margin: 0,
  },
  actions: { display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' as const, marginTop: '4px' },
  cta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '10px 18px',
    background: 'var(--accent)',
    color: '#002820',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '13px',
    textDecoration: 'none',
    letterSpacing: '0.1px',
  },
  secondary: {
    fontSize: '13px',
    color: 'var(--text-2)',
    textDecoration: 'none',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '1px',
  },
}
