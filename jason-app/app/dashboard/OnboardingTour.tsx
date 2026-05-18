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

// Tour par défaut pour le dashboard home.
// Chemin d'apprentissage : on commence par les ressources (Apprendre →
// Formations / Guide / Actualités), puis le pilotage quotidien (Calendrier),
// puis l'action concrète (la checklist). Volontairement on NE pousse PAS
// directement vers les simulateurs — ils sont une option, pas la priorité.
export const DASHBOARD_HOME_STEPS: TourStep[] = [
  {
    id: 'welcome',
    targetSelector: null,
    title: "Bienvenue dans ton espace LCD",
    body: "60 secondes pour découvrir ton dashboard et savoir où trouver quoi. Tu peux skipper à tout moment.",
  },
  {
    id: 'formations',
    targetSelector: 'a[href="/dashboard/formations"]',
    title: "Apprendre : les Formations",
    body: "18 formations pour devenir un hôte qui maîtrise vraiment la LCD : juridique, fiscal, Booking, Airbnb, automatisation… Commence par là.",
  },
  {
    id: 'guide',
    targetSelector: 'a[href="/dashboard/guide"]',
    title: "Le Guide LCD",
    body: "Le manuel concret pour les vraies situations : un voyageur qui annule, un mauvais commentaire, un litige de caution… On a tout couvert.",
  },
  {
    id: 'actualites',
    targetSelector: 'a[href="/dashboard/actualites"]',
    title: "Reste informé : Actualités",
    body: "Changements de loi, nouvelles obligations fiscales, actualité Airbnb/Booking. Curé par Jason, pas du bruit de presse — uniquement ce qui te concerne.",
  },
  {
    id: 'calendrier',
    targetSelector: 'a[href="/dashboard/calendrier"]',
    title: "Piloter au quotidien : Calendrier",
    body: "Toutes tes arrivées, départs, séjours sans contrat. Synchronisé avec Airbnb et Booking via iCal. Le hub central de ton activité.",
  },
  {
    id: 'setup',
    targetSelector: '[data-tour="setup-checklist"]',
    title: "Tes prochaines étapes concrètes",
    body: "Cette checklist t'accompagne d'un compte vide à une utilisation pleine. Elle disparaît automatiquement quand tu as fini.",
  },
  {
    id: 'done',
    targetSelector: null,
    title: "Tu as la carte. Bonne route ✨",
    body: "Tout le reste se découvre en cliquant. Une visite guidée se relance à ta première visite des pages importantes (Logements, Calendrier, Simulateurs), ou via le bouton « Comment ça marche ? » en haut de chaque page.",
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

// Tour pour la page Mes Logements — explique que c'est la SOURCE de tout
// (préfilage simulateurs, contrats, iCal, Stripe). Volontairement court (4
// étapes) car les mécaniques détaillées se découvrent en cliquant.
export const LOGEMENTS_STEPS: TourStep[] = [
  {
    id: 'intro',
    targetSelector: null,
    title: "Tes logements = ta source de vérité",
    body: "Tout part d'ici. Une fois tes biens créés, ils alimentent automatiquement tes contrats, tes simulateurs, ton calendrier et tes calculs marché.",
  },
  {
    id: 'create',
    targetSelector: '[data-tour="logement-create"]',
    title: "Ajoute ton premier bien",
    body: "Nom, ville, type, tarif moyen. Plus tu remplis, plus le préfilage est précis. Tu peux compléter au fil de l'eau.",
  },
  {
    id: 'card',
    targetSelector: '[data-tour="logement-list"]',
    title: "Une fiche, plein d'options",
    body: "Sur chaque fiche tu peux brancher Airbnb/Booking via iCal, activer le paiement Stripe, renseigner ton classement Atout France, ou mettre le bien en pause.",
  },
  {
    id: 'done',
    targetSelector: null,
    title: "Tu peux gérer N logements depuis la même app",
    body: "Pas de limite. Le dashboard agrège tout. Si tu loues plusieurs biens, c'est ici qu'ils vivent.",
  },
]

// Tour pour la page Calendrier — focus sur la navigation + sync iCal + saisie
// rapide (les 3 mécaniques que les hôtes mettent souvent du temps à découvrir).
export const CALENDRIER_STEPS: TourStep[] = [
  {
    id: 'intro',
    targetSelector: null,
    title: "Ton calendrier centralise tout",
    body: "Arrivées, départs, ménages, séjours sans contrat, événements iCal. Tout est ici, tu n'as plus à jongler entre Airbnb, Booking et tes notes.",
  },
  {
    id: 'nav',
    targetSelector: '[data-tour="calendrier-monthnav"]',
    title: "Navigue par mois",
    body: "Flèches gauche / droite pour bouger dans le temps. Clique sur un jour pour saisir un événement directement.",
  },
  {
    id: 'view',
    targetSelector: '[data-tour="calendrier-views"]',
    title: "Vue mois ou vue liste",
    body: "La vue mois donne le panorama. La vue liste te donne tous les événements à venir, scrollable, parfait sur mobile.",
  },
  {
    id: 'sync',
    targetSelector: '[data-tour="calendrier-ical"]',
    title: "Branche Airbnb + Booking en 30 secondes",
    body: "Colle l'URL iCal de chaque plateforme dans tes fiches logement. Les réservations apparaissent ici en temps quasi-réel, codées par couleur.",
  },
  {
    id: 'done',
    targetSelector: null,
    title: "Pro tip : la saisie rapide",
    body: "L'éclair en haut à droite te permet d'écrire \"Ménage demain 10h chez Belleville\" et l'événement se crée. Plus rapide qu'un formulaire.",
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
  storageScope?: 'home' | 'simulateurs' | 'logements' | 'calendrier'
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
