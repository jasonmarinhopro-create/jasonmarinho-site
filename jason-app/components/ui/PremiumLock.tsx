import Link from 'next/link'
import { Lock, ArrowRight, Sparkle } from '@phosphor-icons/react/dist/ssr'

interface Props {
  /** Titre du teaser, ex: "Heatmap jour de semaine" */
  title: string
  /** Description courte expliquant la valeur */
  description: string
  /** Liste de bullet points (3-4 max) qui décrivent ce qu'on débloque */
  bullets?: string[]
  /** Si fourni, une vue "preview" floutée s'affiche en arrière-plan */
  preview?: React.ReactNode
  /** Hauteur min, utile pour homogénéiser la grille */
  minHeight?: number | string
  /** Variante : 'inline' (card autonome) ou 'overlay' (par-dessus le preview) */
  variant?: 'inline' | 'overlay'
}

// Lock inline pour gater une section sans masquer le contexte. Variant overlay
// = on rend la vraie section en arrière-plan floutée + un teaser par-dessus.
// Variant inline = juste une carte sobre.
export default function PremiumLock({
  title, description, bullets, preview, minHeight, variant = 'inline',
}: Props) {
  return (
    <div style={{ position: 'relative' as const, minHeight }}>
      {variant === 'overlay' && preview && (
        <div
          aria-hidden
          style={{
            filter: 'blur(7px) saturate(0.5)',
            opacity: 0.4,
            pointerEvents: 'none' as const,
            userSelect: 'none' as const,
          }}
        >
          {preview}
        </div>
      )}
      <div style={{
        ...(variant === 'overlay' ? {
          position: 'absolute' as const,
          inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        } : {}),
      }}>
        <div style={{
          width: '100%',
          padding: '20px 24px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, var(--accent-bg) 0%, var(--surface) 100%)',
          border: '1px solid var(--accent-border)',
          display: 'flex', flexDirection: 'column' as const, gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '3px 10px', borderRadius: '999px',
              background: 'rgba(255,213,107,0.18)', color: '#FFD56B',
              border: '1px solid rgba(255,213,107,0.35)',
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.3px',
            }}>
              <Lock size={10} weight="fill" />
              Standard
            </div>
            <h4 style={{
              fontFamily: 'var(--font-fraunces), serif',
              fontSize: '16px', fontWeight: 500,
              color: 'var(--text)', margin: 0,
            }}>{title}</h4>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.55, margin: 0 }}>
            {description}
          </p>
          {bullets && bullets.length > 0 && (
            <ul style={{ margin: 0, padding: '0 0 0 4px', listStyle: 'none', display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
              {bullets.map((b, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.5 }}>
                  <Sparkle size={12} weight="fill" style={{ color: 'var(--accent-text)', flexShrink: 0, marginTop: '3px' }} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/dashboard/abonnement"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '9px 16px', borderRadius: '10px',
              background: 'var(--accent-text)', color: 'var(--bg)',
              fontSize: '13px', fontWeight: 700,
              textDecoration: 'none', alignSelf: 'flex-start',
              fontFamily: 'inherit',
            }}
          >
            Passer Standard <ArrowRight size={13} weight="bold" />
          </Link>
        </div>
      </div>
    </div>
  )
}
