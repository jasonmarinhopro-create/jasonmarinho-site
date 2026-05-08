'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Check, ArrowRight, X, Sparkle, CaretDown, Trophy,
} from '@phosphor-icons/react/dist/ssr'
import { ONBOARDING_STEPS } from '@/lib/onboarding/steps'
import { dismissOnboarding, startOnboarding } from '@/lib/onboarding/actions'

interface Props {
  /** Étape courante détectée (1..5), ou 6 si terminé */
  currentStep: number
  /** Profil a déjà cliqué "X" → ne pas afficher */
  dismissed: boolean
  /** Tâche terminée → afficher l'écran de fin une fois, puis disparaître */
  completed: boolean
  /** Step persistée en DB (sert pour savoir si l'utilisateur a cliqué "Commencer") */
  persistedStep: number
}

export function OnboardingChecklist({ currentStep, dismissed, completed, persistedStep }: Props) {
  const [open, setOpen] = useState(!dismissed && !completed)
  const [hidden, setHidden] = useState(false)
  const [, startTransition] = useTransition()

  if (hidden) return null

  const totalSteps = ONBOARDING_STEPS.length
  const doneCount = Math.min(currentStep - 1, totalSteps)
  const percent = Math.round((doneCount / totalSteps) * 100)
  const isFirstTime = persistedStep < 2

  function handleDismiss() {
    setHidden(true)
    startTransition(async () => {
      await dismissOnboarding()
    })
  }

  function handleStart() {
    startTransition(async () => {
      await startOnboarding()
    })
  }

  // Écran "tout est fait"
  if (currentStep > totalSteps) {
    return (
      <div style={s.wrap}>
        <div style={s.completedCard}>
          <button onClick={handleDismiss} style={s.completedClose} aria-label="Fermer">
            <X size={14} weight="bold" />
          </button>
          <div style={s.completedIconWrap}>
            <Trophy size={28} weight="fill" style={{ color: 'var(--accent-text)' }} />
          </div>
          <div style={s.completedTitle}>Bravo, tu es opérationnel ✨</div>
          <div style={s.completedDesc}>Tu as complété toutes les étapes. Bienvenue dans l'aventure LCD !</div>
        </div>
      </div>
    )
  }

  return (
    <div style={s.wrap}>
      {/* Pill replié */}
      {!open && (
        <button onClick={() => setOpen(true)} style={s.pill} className="onboarding-pill">
          <span style={s.pillIcon}>
            <Sparkle size={14} weight="fill" />
          </span>
          <span style={s.pillText}>
            <span style={s.pillTitle}>Démarrer · {doneCount}/{totalSteps}</span>
            <span style={s.pillBar}>
              <span style={{ ...s.pillBarFill, width: `${percent}%` }} />
            </span>
          </span>
          <CaretDown size={12} weight="bold" style={{ color: 'var(--text-3)', flexShrink: 0 }} />
        </button>
      )}

      {/* Carte dépliée */}
      {open && (
        <div style={s.card} className="glass-card">
          <div style={s.cardHeader}>
            <div>
              <div style={s.cardTitle}>Démarrer en 5 étapes</div>
              <div style={s.cardSub}>{doneCount} sur {totalSteps} · {percent}%</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setOpen(false)} style={s.iconBtn} aria-label="Réduire" title="Réduire">
                <CaretDown size={14} weight="bold" />
              </button>
            </div>
          </div>

          <div style={s.bar}>
            <div style={{ ...s.barFill, width: `${percent}%` }} />
          </div>

          <div style={s.list}>
            {ONBOARDING_STEPS.map(step => {
              const isDone = step.id < currentStep
              const isCurrent = step.id === currentStep
              const isWelcome = step.key === 'welcome'

              return (
                <div
                  key={step.id}
                  style={{
                    ...s.item,
                    ...(isCurrent ? s.itemCurrent : {}),
                    ...(isDone ? s.itemDone : {}),
                  }}
                >
                  <div style={s.itemRow}>
                    <div style={{
                      ...s.checkbox,
                      ...(isDone ? s.checkboxDone : {}),
                      ...(isCurrent ? s.checkboxCurrent : {}),
                    }}>
                      {isDone ? <Check size={13} weight="bold" /> : step.id}
                    </div>

                    <div style={{ ...s.itemTitle, ...(isDone ? s.itemTitleDone : {}) }}>
                      {step.title}
                    </div>
                  </div>

                  {isCurrent && (
                    <>
                      <div style={s.itemDesc}>{step.description}</div>
                      {isWelcome && isFirstTime ? (
                        <button onClick={handleStart} style={s.itemAction} className="btn-primary">
                          {step.ctaLabel}
                          <ArrowRight size={12} weight="bold" />
                        </button>
                      ) : (
                        <Link href={step.ctaHref} style={s.itemAction} className="btn-primary">
                          {step.ctaLabel}
                          <ArrowRight size={12} weight="bold" />
                        </Link>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 100,
    maxWidth: 'calc(100vw - 40px)',
  },

  /* Pill replié */
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px 10px 12px',
    background: 'var(--surface)',
    border: '1px solid var(--accent-border)',
    borderRadius: '100px',
    color: 'var(--text)',
    fontFamily: 'inherit',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    transition: 'transform 0.18s, box-shadow 0.18s',
  },
  pillIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'var(--accent-bg)',
    color: 'var(--accent-text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pillText: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    minWidth: '120px',
  },
  pillTitle: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text)',
    lineHeight: 1,
  },
  pillBar: {
    width: '100%',
    height: '3px',
    background: 'var(--surface-2)',
    borderRadius: '100px',
    overflow: 'hidden',
  },
  pillBarFill: {
    height: '100%',
    background: 'var(--accent-text)',
    transition: 'width 0.4s',
  },

  /* Carte dépliée */
  card: {
    width: '400px',
    maxWidth: 'calc(100vw - 40px)',
    background: 'var(--surface)',
    border: '1px solid var(--accent-border)',
    borderRadius: '18px',
    padding: '22px',
    boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '14px',
    gap: '10px',
  },
  cardTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '18px',
    fontWeight: 400,
    color: 'var(--text)',
    lineHeight: 1.2,
  },
  cardSub: {
    fontSize: '12.5px',
    color: 'var(--text-3)',
    marginTop: '4px',
  },
  iconBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-3)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s, color 0.15s',
    flexShrink: 0,
  },
  bar: {
    width: '100%',
    height: '4px',
    background: 'var(--surface-2)',
    borderRadius: '100px',
    overflow: 'hidden',
    marginBottom: '14px',
  },
  barFill: {
    height: '100%',
    background: 'linear-gradient(90deg, rgba(255,213,107,0.8), var(--accent-text))',
    transition: 'width 0.5s',
  },

  /* Items */
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  item: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    padding: '12px 14px',
    borderRadius: '12px',
    transition: 'background 0.15s',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  itemCurrent: {
    background: 'var(--accent-bg)',
    padding: '14px',
  },
  itemDone: {
    opacity: 0.55,
  },
  checkbox: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    background: 'var(--surface-2)',
    color: 'var(--text-3)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '12px',
    fontWeight: 600,
  },
  checkboxDone: {
    background: 'var(--accent-text)',
    color: 'var(--gd, #003329)',
    borderColor: 'var(--accent-text)',
  },
  checkboxCurrent: {
    background: 'transparent',
    color: 'var(--accent-text)',
    borderColor: 'var(--accent-text)',
  },
  itemTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text)',
    lineHeight: 1.35,
  },
  itemTitleDone: {
    textDecoration: 'line-through',
    color: 'var(--text-3)',
    fontWeight: 400,
  },
  itemDesc: {
    fontSize: '12.5px',
    fontWeight: 300,
    color: 'var(--text-2)',
    lineHeight: 1.55,
    paddingLeft: '38px',
  },
  itemAction: {
    fontSize: '12.5px',
    padding: '9px 14px',
    marginLeft: '38px',
    alignSelf: 'flex-start' as const,
  },

  /* Completed card */
  completedCard: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '10px',
    padding: '22px 20px 18px',
    background: 'var(--surface)',
    border: '1px solid var(--accent-border)',
    borderRadius: '18px',
    boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
    width: '260px',
    maxWidth: 'calc(100vw - 40px)',
    textAlign: 'center' as const,
  },
  completedIconWrap: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '4px',
  },
  completedTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text)',
    lineHeight: 1.3,
  },
  completedDesc: {
    fontSize: '12px',
    fontWeight: 300,
    color: 'var(--text-2)',
    lineHeight: 1.5,
    marginTop: '-2px',
  },
  completedClose: {
    position: 'absolute' as const,
    top: '10px',
    right: '10px',
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-3)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.15s',
  },
}
