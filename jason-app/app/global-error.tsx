'use client'

// Fallback ULTIME : ce composant ne s'affiche que si le layout root lui-même
// crashe. Doit donc fournir son propre <html>/<body> et ne PAS dépendre de
// composants applicatifs (CSS globals, contexts, etc.) qui pourraient eux
// aussi être en erreur. Styles 100 % inline.

import { useEffect } from 'react'
import { ArrowCounterClockwise, ArrowsClockwise, EnvelopeSimple } from '@phosphor-icons/react/dist/ssr'

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

  const supportHref =
    `mailto:contact@jasonmarinho.com?subject=${encodeURIComponent('Bug critique app')}` +
    `&body=${encodeURIComponent(
      `Bonjour Jason,\n\nL'app a planté complètement. Voici ce que je faisais :\n[Décris ici]\n\n` +
      `Code erreur : ${error.digest ?? '(absent)'}\n` +
      `Message : ${error.message ?? '(vide)'}\n\n` +
      `URL : ${typeof window !== 'undefined' ? window.location.href : ''}\n` +
      `Navigateur : ${typeof navigator !== 'undefined' ? navigator.userAgent : ''}`
    )}`

  return (
    <html lang="fr" data-theme="dark">
      <body style={{ background: '#0a0f0d', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '32px', maxWidth: '440px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
          </div>
          <p style={{ fontSize: '18px', fontWeight: 600, color: '#f0f4ff', margin: 0 }}>L'app a rencontré une erreur critique</p>
          <p style={{ fontSize: '13.5px', color: 'rgba(240,244,255,0.6)', margin: 0, lineHeight: 1.6 }}>
            Essaie d'abord de réessayer ou recharger la page. Si le problème persiste, contacte le support en mentionnant le code ci-dessous, ça aide à diagnostiquer.
          </p>
          {error.digest && (
            <p style={{ fontSize: '11px', color: 'rgba(240,244,255,0.5)', margin: 0 }}>
              Code : <span style={{ fontFamily: 'monospace', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>{error.digest}</span>
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
            <button
              onClick={reset}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', background: 'rgba(255,213,107,0.12)', border: '1px solid rgba(255,213,107,0.28)', color: '#FFD56B', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}
            >
              <ArrowCounterClockwise size={14} />
              Réessayer
            </button>
            <button
              onClick={() => location.reload()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(240,244,255,0.75)', fontSize: '13px', fontWeight: 500, fontFamily: 'inherit' }}
            >
              <ArrowsClockwise size={14} />
              Recharger
            </button>
            <a
              href={supportHref}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(240,244,255,0.75)', fontSize: '13px', fontWeight: 500, fontFamily: 'inherit' }}
            >
              <EnvelopeSimple size={14} />
              Contacter le support
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
