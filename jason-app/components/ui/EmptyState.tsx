import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight, Question } from '@phosphor-icons/react/dist/ssr'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  primaryAction?: {
    label: string
    href?: string
    onClick?: () => void
  }
  helpLink?: {
    label?: string
    href: string
  }
  size?: 'sm' | 'md' | 'lg'
}

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  helpLink,
  size = 'md',
}: EmptyStateProps) {
  const padding = size === 'sm' ? '32px 20px' : size === 'lg' ? '72px 24px' : '52px 24px'
  const iconSize = size === 'sm' ? 48 : size === 'lg' ? 80 : 64

  return (
    <div style={{ ...styles.wrap, padding }}>
      <div style={{ ...styles.iconWrap, width: iconSize, height: iconSize }}>
        {icon}
      </div>

      <h3 style={styles.title}>{title}</h3>
      <p style={styles.description}>{description}</p>

      {(primaryAction || helpLink) && (
        <div style={styles.actions}>
          {primaryAction && (
            primaryAction.href ? (
              <Link href={primaryAction.href} className="btn-primary" style={styles.primary}>
                {primaryAction.label}
                <ArrowRight size={14} weight="bold" />
              </Link>
            ) : (
              <button onClick={primaryAction.onClick} className="btn-primary" style={styles.primary}>
                {primaryAction.label}
                <ArrowRight size={14} weight="bold" />
              </button>
            )
          )}

          {helpLink && (
            <Link href={helpLink.href} style={styles.helpLink}>
              <Question size={13} weight="regular" />
              {helpLink.label ?? 'Comment ça marche ?'}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
    // Mesh gradient subtil pour donner de la profondeur sans surcharger
    background: 'radial-gradient(ellipse 80% 100% at 50% 0%, var(--accent-bg), transparent 60%), var(--surface)',
    border: '1px dashed var(--border-2)',
    borderRadius: 'var(--r-xl)',
    margin: 'var(--s-2) 0',
    animation: 'fadeUp var(--d-slow) var(--ease-out) both',
  },
  iconWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--accent-bg-2)',
    color: 'var(--accent-text)',
    borderRadius: '50%',
    marginBottom: 'var(--s-5)',
    // Halo doux autour de l'icône (effet 'spot light' 2026)
    boxShadow: '0 0 0 8px var(--accent-bg)',
  },
  title: {
    fontFamily: 'var(--font-fraunces), Georgia, serif',
    fontSize: 'var(--t-lg)',
    fontWeight: 400,
    color: 'var(--text)',
    margin: '0 0 var(--s-2)',
    lineHeight: 'var(--lh-tight)',
    letterSpacing: 'var(--ls-snug)',
  },
  description: {
    fontSize: 'var(--t-sm)',
    fontWeight: 400,
    color: 'var(--text-2)',
    margin: '0 0 var(--s-6)',
    lineHeight: 'var(--lh-relax)',
    maxWidth: '420px',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--s-4)',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },
  primary: {
    fontSize: 'var(--t-sm)',
    padding: '11px 20px',
  },
  helpLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--s-1)',
    fontSize: 'var(--t-xs)',
    fontWeight: 500,
    color: 'var(--text-2)',
    textDecoration: 'none',
    padding: '8px 14px',
    borderRadius: 'var(--r-sm)',
    transition: 'color var(--d-base) var(--ease-smooth), background var(--d-base) var(--ease-smooth)',
  },
}
