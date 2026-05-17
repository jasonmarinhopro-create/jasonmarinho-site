'use client'

import { useEffect, useMemo } from 'react'
import { ArrowCounterClockwise, Warning, EnvelopeSimple, ArrowsClockwise } from '@phosphor-icons/react/dist/ssr'
import { toFriendlyError, buildSupportMailto } from '@/lib/errors/friendly-message'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
  label?: string
}

export default function DashboardError({ error, reset, label }: Props) {
  useEffect(() => {
    console.error('[Dashboard error]', error.digest ?? '', error.message)
  }, [error])

  const friendly = useMemo(() => toFriendlyError(error), [error])
  const mailto = useMemo(() => buildSupportMailto(error), [error])
  const isWarning = friendly.severity === 'warning'
  const showDigest = !friendly.hideDigest && error.digest

  return (
    <div style={s.wrap}>
      <div style={s.box}>
        <div style={{ ...s.iconWrap, ...(isWarning ? s.iconWarning : {}) }}>
          <Warning size={22} color={isWarning ? '#FFD56B' : '#f87171'} weight="duotone" />
        </div>
        <p style={s.title}>{label ?? friendly.title}</p>
        <p style={s.sub}>
          {friendly.body}
          {friendly.hint && (
            <span style={s.hint}> · {friendly.hint}</span>
          )}
        </p>
        {showDigest && (
          <p style={s.digestLine}>
            Code : <span style={s.digest}>{error.digest}</span>
          </p>
        )}
        <div style={s.actions}>
          <button onClick={reset} style={s.btn}>
            <ArrowCounterClockwise size={14} />
            Réessayer
          </button>
          <button onClick={() => location.reload()} style={s.btnGhost}>
            <ArrowsClockwise size={14} />
            Recharger la page
          </button>
          {!isWarning && (
            <a href={mailto} style={s.btnGhost}>
              <EnvelopeSimple size={14} />
              Contacter le support
            </a>
          )}
        </div>
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
    alignItems: 'center', gap: '10px', maxWidth: '420px',
  },
  iconWrap: {
    width: '48px', height: '48px', borderRadius: '14px',
    background: 'var(--danger-bg)', border: '1px solid rgba(248,113,113,0.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '4px',
  },
  iconWarning: {
    background: 'rgba(255,213,107,0.08)', border: '1px solid rgba(255,213,107,0.2)',
  },
  title: { fontSize: '17px', fontWeight: 600, color: 'var(--text)', margin: 0 },
  sub:   { fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, margin: 0 },
  hint:  { color: 'var(--accent-text)', fontWeight: 500 },
  digestLine: {
    fontSize: '11px', color: 'var(--text-3)', margin: '4px 0 0',
  },
  digest: {
    fontFamily: 'monospace', fontSize: '11px',
    padding: '2px 6px', borderRadius: '4px',
    background: 'var(--bg-2)', border: '1px solid var(--border)',
    color: 'var(--text-2)',
  },
  actions: {
    display: 'flex', flexWrap: 'wrap' as const, justifyContent: 'center',
    gap: '8px', marginTop: '8px',
  },
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '9px 18px', borderRadius: '10px', cursor: 'pointer',
    background: 'rgba(255,213,107,0.10)', border: '1px solid rgba(255,213,107,0.24)',
    color: 'var(--accent-text)', fontSize: '13px', fontWeight: 600,
    fontFamily: 'inherit',
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '9px 16px', borderRadius: '10px', cursor: 'pointer',
    background: 'transparent', border: '1px solid var(--border)',
    color: 'var(--text-2)', fontSize: '13px', fontWeight: 500,
    textDecoration: 'none', fontFamily: 'inherit',
  },
}
