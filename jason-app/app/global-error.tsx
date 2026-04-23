'use client'

import { useEffect } from 'react'
import { ArrowCounterClockwise } from '@phosphor-icons/react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error.digest ?? '', error.message)
  }, [error])

  return (
    <html lang="fr" data-theme="dark">
      <body style={{ background: '#0a0f0d', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '32px' }}>
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#f0f4ff', margin: 0 }}>Une erreur critique est survenue</p>
          <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.45)', margin: 0, maxWidth: '320px', lineHeight: 1.6 }}>
            Veuillez rafraîchir la page. Si le problème persiste, contactez le support.
            {error.digest && <span style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', marginTop: '6px', opacity: 0.5 }}>{error.digest}</span>}
          </p>
          <button
            onClick={reset}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 22px', borderRadius: '10px', cursor: 'pointer', background: 'rgba(255,213,107,0.1)', border: '1px solid rgba(255,213,107,0.2)', color: '#FFD56B', fontSize: '13px', fontWeight: 500 }}
          >
            <ArrowCounterClockwise size={14} />
            Réessayer
          </button>
        </div>
      </body>
    </html>
  )
}
