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
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    background: 'var(--surface)',
    border: '1px dashed var(--border)',
    borderRadius: '16px',
    margin: '8px 0',
  },
  iconWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--accent-bg)',
    color: 'var(--accent-text)',
    borderRadius: '50%',
    marginBottom: '18px',
  },
  title: {
    fontFamily: 'var(--font-fraunces), Georgia, serif',
    fontSize: '18px',
    fontWeight: 400,
    color: 'var(--text)',
    margin: '0 0 8px',
    lineHeight: 1.3,
  },
  description: {
    fontSize: '13.5px',
    fontWeight: 300,
    color: 'var(--text-2)',
    margin: '0 0 22px',
    lineHeight: 1.6,
    maxWidth: '420px',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primary: {
    fontSize: '13px',
    padding: '10px 18px',
  },
  helpLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12.5px',
    fontWeight: 400,
    color: 'var(--text-2)',
    textDecoration: 'none',
    padding: '8px 12px',
    borderRadius: '8px',
    transition: 'color 0.15s',
  },
}
