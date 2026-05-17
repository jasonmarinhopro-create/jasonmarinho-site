'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, X, Sparkle } from '@phosphor-icons/react/dist/ssr'

export type TourStep = {
  id: string
  targetSelector: string | null  // null = popover centré
  title: string
  body: string
  cta?: { label: string; href: string }
}

// Tour par défaut pour le dashboard home
export const DASHBOARD_HOME_STEPS: TourStep[] = [
  {
    id: 'welcome',
    targetSelector: null,
    title: "Bienvenue dans ton dashboard",
    body: "On parcourt ensemble les trucs qui valent ton inscription. 45 secondes, tu peux skipper à tout moment.",
  },
  {
    id: 'setup',
    targetSelector: '[data-tour="setup-checklist"]',
    title: "Ta route en 5 étapes",
    body: "Cette checklist t'amène d'un compte vide à un dashboard pleinement opérationnel. Elle disparaît automatiquement quand tu as fini.",
  },
  {
    id: 'conseil',
    targetSelector: '[data-tour="conseil"]',
    title: "Le Conseil du moment",
    body: "Une recommandation personnalisée à chaque visite, basée sur tes vraies données. Tu sais toujours quoi faire ensuite.",
  },
  {
    id: 'stats',
    targetSelector: '[data-tour="dashboard-stats"]',
    title: "Tes chiffres en direct",
    body: "Arrivées du jour, revenus du mois, objectif annuel. Les KPI sont calculés en temps réel sur tes vrais séjours.",
  },
  {
    id: 'simulateurs',
    targetSelector: null,
    title: "Tes simulateurs sont déjà préfilés",
    body: "CA réel, ADR moyen, régime fiscal estimé. Les 5 simulateurs (Fiscalité, EI vs SASU, Rentabilité, Taxe séjour, Franchise TVA) s'ouvrent avec tes données, pas des valeurs génériques. Vois par toi-même.",
    cta: { label: 'Découvrir les simulateurs', href: '/dashboard/simulateurs?tour=1' },
  },
]

// Tour pour la page simulateurs
export const SIMULATEURS_STEPS: TourStep[] = [
  {
    id: 'activity',
    targetSelector: '[data-tour="activity-overview"]',
    title: "Mon activité, en un coup d'œil",
    body: "5 tuiles qui résument ton CA 12 mois, tes logements, ton ADR moyen, ton régime fiscal estimé et ton statut LMNP/LMP. Chacune te donne le prochain pas à faire.",
  },
  {
    id: 'tabs',
    targetSelector: '[role="tablist"]',
    title: "5 outils, tous préfilés",
    body: "Tes vraies données alimentent automatiquement chaque simulateur. Tu peux toujours modifier les valeurs pour tester un scénario.",
  },
  {
    id: 'done',
    targetSelector: null,
    title: "Tu es prêt à piloter",
    body: "Explore librement. Si tu veux revoir cette visite, c'est dans ton profil.",
  },
]

// Largeur du popover : 380px en desktop, sinon clamp à la viewport - margins.
// Calculée dynamiquement au runtime pour gérer les rotations mobile.
function getPopoverW(): number {
  if (typeof window === 'undefined') return 380
  return Math.min(380, window.innerWidth - 32)
}
const POPOVER_H_EST = 260
const MARGIN = 14

export default function OnboardingTour({
  userId,
  forceOpen = false,
  steps = DASHBOARD_HOME_STEPS,
  storageScope = 'home',
}: {
  userId: string
  forceOpen?: boolean
  steps?: TourStep[]
  storageScope?: 'home' | 'simulateurs'
}) {
  const STEPS = steps
  const [active, setActive] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; arrowSide?: 'top' | 'bottom' } | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const storageKey = `dash-onboarding-tour-${storageScope}-${userId}`

  // Démarrage : check si déjà fait OU param URL ?tour=1
  useEffect(() => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    const urlForce = params?.get('tour') === '1'
    if (forceOpen || urlForce) {
      setStepIdx(0)
      setActive(true)
      // Nettoie le param URL pour éviter qu'un refresh re-déclenche
      if (urlForce && typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('tour')
        window.history.replaceState({}, '', url.toString())
      }
      return
    }
    try {
      if (localStorage.getItem(storageKey) === 'done') return
    } catch {
      return
    }
    // Donner le temps aux composants de monter avant de chercher les targets
    const t = setTimeout(() => setActive(true), 700)
    return () => clearTimeout(t)
  }, [storageKey, forceOpen])

  // Calcul position popover + autoskip si target absent
  const updatePosition = useCallback(() => {
    const step = STEPS[stepIdx]
    if (!step) return

    const popoverW = getPopoverW()
    if (!step.targetSelector) {
      setTargetRect(null)
      // Centré viewport
      setPopoverPos({
        top: Math.max(MARGIN, (window.innerHeight - POPOVER_H_EST) / 2),
        left: Math.max(MARGIN, (window.innerWidth - popoverW) / 2),
      })
      return
    }

    const el = document.querySelector(step.targetSelector) as HTMLElement | null
    if (!el) {
      // Target absent → skip to next
      if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1)
      else finish()
      return
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // Laisse le scroll s'effectuer puis mesure
    setTimeout(() => {
      const rect = el.getBoundingClientRect()
      setTargetRect(rect)

      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      let top: number
      let arrowSide: 'top' | 'bottom'
      if (spaceBelow >= POPOVER_H_EST + MARGIN) {
        top = rect.bottom + MARGIN
        arrowSide = 'top'
      } else if (spaceAbove >= POPOVER_H_EST + MARGIN) {
        top = rect.top - POPOVER_H_EST - MARGIN
        arrowSide = 'bottom'
      } else {
        top = Math.max(MARGIN, (window.innerHeight - POPOVER_H_EST) / 2)
        arrowSide = 'top'
      }

      let left = rect.left + (rect.width - popoverW) / 2
      left = Math.max(MARGIN, Math.min(left, window.innerWidth - popoverW - MARGIN))

      setPopoverPos({ top, left, arrowSide })
    }, 380)
  }, [stepIdx, STEPS])

  useEffect(() => {
    if (!active) return
    updatePosition()
    const onResize = () => updatePosition()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, { passive: true })
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize)
    }
  }, [active, updatePosition])

  // Lock body scroll quand actif (sauf via le scroll programmatique)
  useEffect(() => {
    if (!active) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [active])

  function finish() {
    try { localStorage.setItem(storageKey, 'done') } catch {}
    setActive(false)
  }
  function next() {
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1)
    else finish()
  }
  function prev() {
    if (stepIdx > 0) setStepIdx(stepIdx - 1)
  }

  // Keyboard nav
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish()
      else if (e.key === 'ArrowRight' || e.key === 'Enter') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepIdx])

  if (!active) return null
  const step = STEPS[stepIdx]
  const progress = ((stepIdx + 1) / STEPS.length) * 100

  return (
    <div style={s.root} aria-modal="true" role="dialog" aria-labelledby="onboarding-title">
      {/* Backdrop avec cutout sur la target */}
      <Backdrop targetRect={targetRect} />

      {/* Popover */}
      {popoverPos && (
        <div
          ref={popoverRef}
          style={{
            ...s.popover,
            top: popoverPos.top,
            left: popoverPos.left,
            width: getPopoverW(),
          }}
        >
          {targetRect && popoverPos.arrowSide && (
            <div style={{
              ...s.arrow,
              ...(popoverPos.arrowSide === 'top'
                ? { top: -8, borderRight: '1px solid var(--accent-border)', borderTop: '1px solid var(--accent-border)' }
                : { bottom: -8, borderLeft: '1px solid var(--accent-border)', borderBottom: '1px solid var(--accent-border)' }),
              left: Math.min(
                Math.max(20, targetRect.left + targetRect.width / 2 - popoverPos.left - 6),
                getPopoverW() - 30
              ),
            }} />
          )}

          <div style={s.popHead}>
            <span style={s.popTag}>
              <Sparkle size={11} weight="fill" /> Visite guidée · {stepIdx + 1}/{STEPS.length}
            </span>
            <button onClick={finish} style={s.closeBtn} aria-label="Fermer">
              <X size={14} weight="bold" />
            </button>
          </div>

          <h3 id="onboarding-title" style={s.popTitle}>{step.title}</h3>
          <p style={s.popBody}>{step.body}</p>

          <div style={s.progressBar}>
            <div style={{ ...s.progressFill, width: `${progress}%` }} />
          </div>

          <div style={s.popFooter}>
            <button onClick={finish} style={s.skipBtn}>Passer</button>
            <div style={{ display: 'flex', gap: '8px' }}>
              {stepIdx > 0 && (
                <button onClick={prev} style={s.prevBtn} aria-label="Précédent">
                  <ArrowLeft size={13} weight="bold" />
                </button>
              )}
              {step.cta && stepIdx === STEPS.length - 1 ? (
                <Link href={step.cta.href} onClick={finish} style={s.ctaBtn}>
                  {step.cta.label}
                  <ArrowRight size={13} weight="bold" />
                </Link>
              ) : (
                <button onClick={next} style={s.nextBtn}>
                  {stepIdx === STEPS.length - 1 ? 'Terminer' : 'Suivant'}
                  <ArrowRight size={13} weight="bold" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Backdrop semi-transparent avec spotlight sur la target via box-shadow
function Backdrop({ targetRect }: { targetRect: DOMRect | null }) {
  if (!targetRect) {
    return <div style={s.backdrop} />
  }
  const pad = 12
  return (
    <div
      style={{
        position: 'fixed',
        top: targetRect.top - pad,
        left: targetRect.left - pad,
        width: targetRect.width + pad * 2,
        height: targetRect.height + pad * 2,
        borderRadius: '18px',
        boxShadow: '0 0 0 9999px rgba(0, 26, 17, 0.62), 0 0 0 2px rgba(255,213,107,0.55), 0 0 40px rgba(255,213,107,0.20)',
        pointerEvents: 'none',
        zIndex: 9998,
        transition: 'top .35s cubic-bezier(.4,0,.2,1), left .35s cubic-bezier(.4,0,.2,1), width .35s cubic-bezier(.4,0,.2,1), height .35s cubic-bezier(.4,0,.2,1)',
      }}
    />
  )
}

const s: Record<string, React.CSSProperties> = {
  root: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    fontFamily: 'var(--font-outfit), Outfit, sans-serif',
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 26, 17, 0.62)',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
    zIndex: 9998,
  },
  popover: {
    position: 'fixed',
    zIndex: 10000,
    background: 'var(--surface)',
    border: '1px solid var(--accent-border)',
    borderRadius: '16px',
    padding: '20px 22px 18px',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,213,107,0.10)',
    transition: 'top .35s cubic-bezier(.4,0,.2,1), left .35s cubic-bezier(.4,0,.2,1)',
  },
  arrow: {
    position: 'absolute',
    width: '14px',
    height: '14px',
    background: 'var(--surface)',
    transform: 'rotate(45deg)',
  },
  popHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px',
  },
  popTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: '999px',
    background: 'rgba(255,213,107,0.10)',
    color: 'var(--accent-text)',
    fontSize: '10.5px',
    fontWeight: 700,
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
    border: '1px solid rgba(255,213,107,0.20)',
  },
  closeBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    width: '26px',
    height: '26px',
    borderRadius: '7px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '22px',
    fontWeight: 400,
    color: 'var(--text)',
    letterSpacing: '-0.01em',
    lineHeight: 1.25,
    margin: '0 0 10px',
  },
  popBody: {
    fontSize: '14px',
    color: 'var(--text-2)',
    lineHeight: 1.6,
    margin: '0 0 16px',
  },
  progressBar: {
    height: '4px',
    background: 'var(--bg-2)',
    borderRadius: '999px',
    overflow: 'hidden',
    marginBottom: '14px',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--accent-text) 0%, #5DC077 100%)',
    borderRadius: '999px',
    transition: 'width .4s cubic-bezier(.4,0,.2,1)',
  },
  popFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  skipBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '12.5px',
    cursor: 'pointer',
    padding: '6px 10px',
    fontFamily: 'inherit',
  },
  prevBtn: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
    color: 'var(--text-2)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all .15s',
  },
  nextBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    background: 'var(--accent-text)',
    color: 'var(--bg)',
    border: 'none',
    borderRadius: '9px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 4px 12px rgba(255,213,107,0.25)',
  },
  ctaBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    background: 'var(--accent-text)',
    color: 'var(--bg)',
    borderRadius: '9px',
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'none',
    boxShadow: '0 4px 12px rgba(255,213,107,0.25)',
  },
}
