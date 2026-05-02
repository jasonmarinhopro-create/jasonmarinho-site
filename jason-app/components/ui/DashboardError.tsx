'use client'

import { useEffect } from 'react'
import { ArrowCounterClockwise, Warning } from '@phosphor-icons/react/dist/ssr'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
  label?: string
}

export default function DashboardError({ error, reset, label }: Props) {
  useEffect(() => {
    console.error('[Dashboard error]', error.digest ?? '', error.message)
  }, [error])

  return (
    <div style={s.wrap}>
      <div style={s.box}>
        <div style={s.iconWrap}>
          <Warning size={22} color="#f87171" weight="duotone" />
        </div>
        <p style={s.title}>{label ?? 'Une erreur s\'est produite'}</p>
        <p style={s.sub}>
          Réessayez ou rafraîchissez la page.
          {error.digest && (
            <span style={s.digest}> · {error.digest}</span>
          )}
        </p>
        <button onClick={reset} style={s.btn}>
          <ArrowCounterClockwise size={14} />
          Réessayer
        </button>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 'clamp(20px,3vw,44px)', minHeight: '60vh',
  },
  box: {
    textAlign: 'center', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '12px',
  },
  iconWrap: {
    width: '48px', height: '48px', borderRadius: '14px',
    background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '4px',
  },
  title: { fontSize: '16px', fontWeight: 600, color: 'var(--text)', margin: 0 },
  sub:   { fontSize: '13px', color: 'var(--text-3)', maxWidth: '300px', lineHeight: 1.6, margin: 0 },
  digest: { fontFamily: 'monospace', fontSize: '11px', opacity: 0.6 },
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 18px', borderRadius: '10px', cursor: 'pointer',
    background: 'rgba(255,213,107,0.08)', border: '1px solid rgba(255,213,107,0.2)',
    color: 'var(--accent-text)', fontSize: '13px', fontWeight: 500,
    marginTop: '4px',
  },
}
