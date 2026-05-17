'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle, Circle, ArrowRight, X } from '@phosphor-icons/react/dist/ssr'

export type SetupStep = {
  key: string
  label: string
  desc: string
  done: boolean
  ctaLabel: string
  ctaHref: string
  durationLabel?: string
}

interface Props {
  userId: string
  steps: SetupStep[]
}

export default function SetupChecklist({ userId, steps }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const storageKey = `dash-setup-dismissed-${userId}`

  // Hydrate dismissed state from localStorage to avoid SSR flash
  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) === '1') setDismissed(true)
    } catch {}
  }, [storageKey])

  const doneCount = steps.filter(s => s.done).length
  const total = steps.length
  const progress = Math.round((doneCount / total) * 100)
  const allDone = doneCount === total

  // Si tout est fait OU explicitement dismissé, on n'affiche rien
  if (allDone || dismissed) return null

  const handleDismiss = () => {
    try { localStorage.setItem(storageKey, '1') } catch {}
    setDismissed(true)
  }

  // Le prochain step actionnable (non fait)
  const nextStep = steps.find(s => !s.done)

  return (
    <div style={s.wrap} data-tour="setup-checklist">
      <div style={s.head}>
        <div style={s.headLeft}>
          <div style={s.headTitle}>
            Mets ton dashboard en route, <em style={s.headEm}>{doneCount}/{total}</em>
          </div>
          <div style={s.headSub}>
            {nextStep
              ? `Prochaine étape : ${nextStep.label}${nextStep.durationLabel ? ` · ${nextStep.durationLabel}` : ''}`
              : `Bravo, ta configuration est complète !`}
          </div>
        </div>
        <button onClick={handleDismiss} aria-label="Masquer la checklist" style={s.closeBtn}>
          <X size={14} weight="bold" />
        </button>
      </div>

      <div style={s.progressBar} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div style={{ ...s.progressFill, width: `${progress}%` }} />
      </div>

      <div style={s.steps}>
        {steps.map(step => (
          <div key={step.key} style={{ ...s.step, ...(step.done ? s.stepDone : {}) }}>
            <div style={s.stepIcon}>
              {step.done
                ? <CheckCircle size={20} weight="fill" color="#5DC077" />
                : <Circle size={20} weight="regular" color="var(--text-muted)" />
              }
            </div>
            <div style={s.stepBody}>
              <div style={{ ...s.stepLabel, ...(step.done ? s.stepLabelDone : {}) }}>{step.label}</div>
              <div style={s.stepDesc}>{step.desc}</div>
            </div>
            {!step.done && (
              <Link href={step.ctaHref} style={s.stepCta}>
                {step.ctaLabel}
                <ArrowRight size={11} weight="bold" />
              </Link>
            )}
            {step.done && step.durationLabel && (
              <span style={s.stepDoneLabel}>Fait</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    padding: 'clamp(18px, 2.5vw, 26px)',
    background: 'linear-gradient(135deg, var(--surface) 0%, rgba(99,214,131,0.04) 100%)',
    border: '1px solid var(--accent-border)',
    borderRadius: '16px',
    marginBottom: 'clamp(18px, 2.5vw, 28px)',
    position: 'relative',
  },
  head: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '14px',
    marginBottom: '14px',
  },
  headLeft: {
    flex: 1,
    minWidth: 0,
  },
  headTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(17px, 2.2vw, 22px)',
    fontWeight: 400,
    color: 'var(--text)',
    letterSpacing: '-0.01em',
    lineHeight: 1.2,
  },
  headEm: {
    color: 'var(--accent-text)',
    fontStyle: 'italic',
    fontWeight: 300,
  },
  headSub: {
    fontSize: '13px',
    color: 'var(--text-2)',
    marginTop: '5px',
    lineHeight: 1.5,
  },
  closeBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    width: '28px',
    height: '28px',
    borderRadius: '7px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  progressBar: {
    height: '6px',
    background: 'var(--bg-2)',
    borderRadius: '999px',
    overflow: 'hidden',
    marginBottom: '18px',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #5DC077 0%, var(--accent-text) 100%)',
    borderRadius: '999px',
    transition: 'width .5s cubic-bezier(.4,0,.2,1)',
  },
  steps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '11px 14px',
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    transition: 'background .18s',
  },
  stepDone: {
    background: 'rgba(99,214,131,0.04)',
    borderColor: 'rgba(99,214,131,0.16)',
  },
  stepIcon: {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
  },
  stepBody: {
    flex: 1,
    minWidth: 0,
  },
  stepLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text)',
    lineHeight: 1.3,
  },
  stepLabelDone: {
    color: 'var(--text-2)',
    textDecoration: 'line-through',
    textDecorationThickness: '1px',
    textDecorationColor: 'var(--text-muted)',
  },
  stepDesc: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '2px',
    lineHeight: 1.4,
  },
  stepCta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '7px 12px',
    fontSize: '12.5px',
    fontWeight: 600,
    color: 'var(--accent-text)',
    background: 'rgba(255,213,107,0.10)',
    border: '1px solid rgba(255,213,107,0.22)',
    borderRadius: '8px',
    textDecoration: 'none',
    flexShrink: 0,
    transition: 'all .18s',
    whiteSpace: 'nowrap',
  },
  stepDoneLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#5DC077',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    flexShrink: 0,
  },
}
