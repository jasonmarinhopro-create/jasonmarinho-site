'use client'

import { useEffect } from 'react'
import { ArrowCounterClockwise } from '@phosphor-icons/react'

export default function CommunauteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Communauté] Error:', error)
  }, [error])

  return (
    <div style={s.wrap}>
      <div style={s.box}>
        <p style={s.title}>Impossible de charger la communauté</p>
        <p style={s.sub}>Une erreur s'est produite. Réessayez ou rafraîchissez la page.</p>
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
  title: { fontSize: '16px', fontWeight: 600, color: 'var(--text)' },
  sub:   { fontSize: '14px', color: 'var(--text-3)', maxWidth: '300px', lineHeight: 1.6 },
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 18px', borderRadius: '10px', cursor: 'pointer',
    background: 'rgba(255,213,107,0.08)', border: '1px solid rgba(255,213,107,0.2)',
    color: 'var(--accent-text)', fontSize: '13px', fontWeight: 500,
    marginTop: '4px',
  },
}
