'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Check, ArrowRight, X, Sparkle, CaretDown, CaretRight, Lock,
  CheckCircle,
} from '@phosphor-icons/react/dist/ssr'
import { ONBOARDING_TRACKS, getTrack } from '@/lib/onboarding/tracks'
import {
  startOnboarding, pinOnboardingTrack, markOnboardingStep,
  dismissOnboarding, restoreOnboarding,
} from '@/lib/onboarding/actions'

interface Props {
  /** Currently pinned track key (shown in the collapsed pill). */
  pinnedTrack: string
  /** Manually completed step keys (auto-detected steps come via doneByTrack). */
  completedSteps: string[]
  /** Done step keys per track (computed server-side). */
  doneByTrack: Record<string, string[]>
  /** Profile dismissed the checklist before. */
  dismissed: boolean
  /** Onboarding is fully completed (all done). */
  completed: boolean
  /** persisted onboarding_step (for welcome detection). */
  persistedStep: number
  /** User's plan — used to lock contract step. */
  plan: 'decouverte' | 'standard' | 'driing'
}

type View = 'closed' | 'pill' | 'track' | 'all'

export function OnboardingTracks({
  pinnedTrack: initialPinned,
  doneByTrack,
  dismissed,
  completed,
  persistedStep,
  plan,
}: Props) {
  const [pinnedKey, setPinnedKey] = useState<string>(initialPinned)
  const [isDismissed, setIsDismissed] = useState(dismissed)
  const [view, setView] = useState<View>(dismissed || completed ? 'pill' : 'track')
  const [isMobile, setIsMobile] = useState(false)
  const [, startTransition] = useTransition()
  const pathname = usePathname()
  // Le montage de ce widget dépend de `showOnboarding`, calculé côté serveur
  // dans dashboard/layout.tsx à partir du pathname de la requête — ce layout
  // est partagé par tous les espaces (hôte/photographe/ménage/investisseur)
  // et mémorisé par le router cache entre routes sœurs, donc cette valeur
  // reste figée après une navigation client vers un autre espace (même bug
  // que le bouton "Parcours" du Header). On regate donc ici aussi côté
  // client sur le pathname réel, qui lui suit chaque navigation.
  const isOnProOrInvestorSpace =
    pathname?.startsWith('/dashboard/ma-fiche-photographe') ||
    pathname?.startsWith('/dashboard/ma-fiche-menage') ||
    pathname?.startsWith('/dashboard/investir')

  // Format mobile : la carte étendue devient une bottom sheet pleine largeur
  // (au lieu d'une carte 420px collée bas-droite) avec liste scrollable.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Listen for the custom event dispatched by the Header "Parcours" button.
  // Restores from a dismissed state and opens the panel directly.
  useEffect(() => {
    function onOpen() {
      setIsDismissed(false)
      setView('track')
      startTransition(async () => { await restoreOnboarding() })
    }
    window.addEventListener('open-onboarding', onOpen)
    return () => window.removeEventListener('open-onboarding', onOpen)
  }, [])

  if (completed || isDismissed || isOnProOrInvestorSpace) return null

  const pinnedTrack = getTrack(pinnedKey) ?? ONBOARDING_TRACKS[0]
  const isFirstTime = persistedStep < 2

  function pinTrack(key: string) {
    setPinnedKey(key)
    setView('track')
    startTransition(async () => { await pinOnboardingTrack(key) })
  }

  function dismissAll() {
    setIsDismissed(true)
    startTransition(async () => { await dismissOnboarding() })
  }

  function handleStartWelcome() {
    startTransition(async () => { await startOnboarding() })
  }

  function toggleStep(stepKey: string, done: boolean) {
    startTransition(async () => { await markOnboardingStep(stepKey, !done) })
  }

  const totalDone = ONBOARDING_TRACKS.reduce((sum, t) =>
    sum + (doneByTrack[t.key]?.length ?? 0), 0)
  const totalSteps = ONBOARDING_TRACKS.reduce((sum, t) => sum + t.steps.length, 0)
  const overallPct = Math.round((totalDone / totalSteps) * 100)

  const pinnedDoneCount = doneByTrack[pinnedTrack.key]?.length ?? 0
  const pinnedPct = Math.round((pinnedDoneCount / pinnedTrack.steps.length) * 100)

  // Styles responsive : bottom sheet mobile / carte flottante desktop.
  const wrapStyle: React.CSSProperties = isMobile
    ? { ...s.wrap, left: '10px', right: '10px', bottom: '10px', maxWidth: 'none' }
    : s.wrap
  const cardStyle: React.CSSProperties = isMobile
    ? {
        ...s.card, width: '100%', maxWidth: 'none',
        maxHeight: 'min(78dvh, 620px)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        // Marge de sécurité pour la barre de navigation OS (iOS safe area)
        paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
      }
    : s.card
  const listStyle: React.CSSProperties = isMobile
    ? { ...s.list, overflowY: 'auto', minHeight: 0, flex: 1, WebkitOverflowScrolling: 'touch' as const }
    : s.list
  const trackListStyle: React.CSSProperties = isMobile
    ? { ...s.trackList, overflowY: 'auto', minHeight: 0, flex: 1, WebkitOverflowScrolling: 'touch' as const }
    : s.trackList

  // ─── Pill (collapsed)
  if (view === 'pill') {
    return (
      <div style={s.wrap}>
        <button onClick={() => setView('track')} style={s.pill} className="onboarding-pill">
          <span style={s.pillIcon}>{pinnedTrack.icon}</span>
          <span style={s.pillText}>
            <span style={s.pillTitle}>{pinnedTrack.title} · {pinnedDoneCount}/{pinnedTrack.steps.length}</span>
            <span style={s.pillBar}>
              <span style={{ ...s.pillBarFill, width: `${pinnedPct}%` }} />
            </span>
          </span>
          <CaretDown size={12} weight="bold" style={{ color: 'var(--text-3)', flexShrink: 0, transform: 'rotate(180deg)' }} />
        </button>
      </div>
    )
  }

  // ─── Single track view (default expanded state)
  if (view === 'track') {
    const doneSet = new Set(doneByTrack[pinnedTrack.key] ?? [])
    return (
      <div style={wrapStyle}>
        <div style={cardStyle} className="glass-card">
          {/* Header */}
          <div style={s.cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
              <div style={{ ...s.trackBadge, background: pinnedTrack.color, color: 'var(--bg)' }}>
                {pinnedTrack.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.cardTitle}>{pinnedTrack.title}</div>
                <div style={s.cardSub}>{pinnedDoneCount}/{pinnedTrack.steps.length} étapes · {pinnedPct}%</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button
                onClick={() => setView('all')}
                style={s.iconBtn}
                aria-label="Voir tous les parcours"
                title="Voir tous les parcours"
              >
                <Sparkle size={13} weight="fill" />
              </button>
              <button
                onClick={() => setView('pill')}
                style={s.iconBtn}
                aria-label="Réduire"
                title="Réduire"
              >
                <CaretDown size={14} weight="bold" />
              </button>
              <button
                onClick={dismissAll}
                style={s.iconBtn}
                aria-label="Masquer"
                title="Masquer (rouvrable depuis l'en-tête)"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          </div>

          <div style={s.bar}>
            <div style={{ ...s.barFill, width: `${pinnedPct}%`, background: pinnedTrack.color }} />
          </div>

          {/* Steps list */}
          <div style={listStyle}>
            {pinnedTrack.steps.map((step, idx) => {
              const isDone = doneSet.has(step.key)
              const isLocked = !!step.requiresPlan && plan === 'decouverte'
              const isWelcome = step.key === 'welcome'
              const isCurrent = !isDone && !isLocked && (
                idx === 0 ||
                pinnedTrack.steps.slice(0, idx).every(s2 => doneSet.has(s2.key))
              )

              return (
                <div
                  key={step.key}
                  style={{
                    ...s.item,
                    ...(isCurrent ? s.itemCurrent : {}),
                    ...(isDone ? s.itemDone : {}),
                    ...(isLocked ? s.itemLocked : {}),
                  }}
                >
                  <div style={s.itemRow}>
                    <button
                      onClick={() => {
                        if (step.detect === 'manual' && !isLocked) toggleStep(step.key, isDone)
                      }}
                      disabled={step.detect === 'auto' || isLocked}
                      style={{
                        ...s.checkbox,
                        ...(isDone ? { background: pinnedTrack.color, borderColor: pinnedTrack.color, color: 'var(--bg)' } : {}),
                        ...(isCurrent ? { borderColor: pinnedTrack.color, color: pinnedTrack.color } : {}),
                        cursor: step.detect === 'manual' && !isLocked ? 'pointer' : 'default',
                      }}
                      aria-label={isDone ? 'Marquer comme non fait' : 'Marquer comme fait'}
                      title={
                        step.detect === 'auto'
                          ? (isDone ? 'Détecté automatiquement' : 'Sera coché automatiquement')
                          : (isDone ? 'Cliquer pour décocher' : 'Cliquer pour cocher')
                      }
                    >
                      {isDone ? <Check size={13} weight="bold" /> : isLocked ? <Lock size={11} weight="bold" /> : idx + 1}
                    </button>
                    <div style={{ ...s.itemTitle, ...(isDone ? s.itemTitleDone : {}) }}>
                      {step.title}
                      {step.requiresPlan && (
                        <span style={s.planBadge}>
                          {step.requiresPlan === 'standard' ? 'Standard+' : 'Driing'}
                        </span>
                      )}
                    </div>
                  </div>

                  {isCurrent && !isLocked && (
                    <>
                      <div style={s.itemDesc}>{step.description}</div>
                      {isWelcome && isFirstTime ? (
                        <button
                          onClick={handleStartWelcome}
                          style={{ ...s.itemAction, background: pinnedTrack.color, color: 'var(--bg)' }}
                        >
                          {step.ctaLabel}
                          <ArrowRight size={12} weight="bold" />
                        </button>
                      ) : (
                        <Link
                          href={step.ctaHref}
                          style={{ ...s.itemAction, background: pinnedTrack.color, color: 'var(--bg)' }}
                        >
                          {step.ctaLabel}
                          <ArrowRight size={12} weight="bold" />
                        </Link>
                      )}
                    </>
                  )}

                  {isLocked && (
                    <>
                      <div style={s.itemDesc}>{step.description}</div>
                      <Link
                        href="/dashboard/abonnement"
                        style={{ ...s.itemAction, background: 'var(--surface-2)', color: 'var(--text)' }}
                      >
                        Passer Standard
                        <ArrowRight size={12} weight="bold" />
                      </Link>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer : link to all tracks */}
          <button onClick={() => setView('all')} style={s.allTracksLink}>
            <Sparkle size={11} weight="fill" />
            Voir les 4 parcours · {totalDone}/{totalSteps} étapes
            <CaretRight size={11} weight="bold" />
          </button>
        </div>
      </div>
    )
  }

  // ─── All tracks view
  return (
    <div style={wrapStyle}>
      <div style={{ ...cardStyle, ...(isMobile ? {} : { width: '420px' }) }} className="glass-card">
        <div style={s.cardHeader}>
          <div style={{ flex: 1 }}>
            <div style={s.cardTitle}>Mes parcours</div>
            <div style={s.cardSub}>{totalDone}/{totalSteps} étapes · {overallPct}%</div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={() => setView('track')}
              style={s.iconBtn}
              aria-label="Retour"
              title="Retour au parcours épinglé"
            >
              <CaretRight size={14} weight="bold" style={{ transform: 'rotate(180deg)' }} />
            </button>
            <button
              onClick={() => setView('pill')}
              style={s.iconBtn}
              aria-label="Réduire"
              title="Réduire"
            >
              <CaretDown size={14} weight="bold" />
            </button>
            <button
              onClick={dismissAll}
              style={s.iconBtn}
              aria-label="Masquer"
              title="Masquer (rouvrable depuis l'en-tête)"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        </div>

        <div style={s.bar}>
          <div style={{ ...s.barFill, width: `${overallPct}%` }} />
        </div>

        <div style={s.tipBox}>
          <span style={s.tipIcon} aria-hidden="true">
            <Sparkle size={11} weight="fill" />
          </span>
          <span style={s.tipText}>
            Une <strong>visite guidée</strong> se lance à ta première visite des pages clés (Mes réservations, Calendrier, Logements…). Tu peux la relancer via le bouton <em>« Comment ça marche ? »</em> en haut de chaque page.
          </span>
        </div>

        <div style={trackListStyle}>
          {ONBOARDING_TRACKS.map(track => {
            const done = doneByTrack[track.key]?.length ?? 0
            const total = track.steps.length
            const pct = Math.round((done / total) * 100)
            const isPinned = track.key === pinnedKey
            const isComplete = done === total
            return (
              <button
                key={track.key}
                onClick={() => pinTrack(track.key)}
                style={{
                  ...s.trackCard,
                  borderColor: isPinned ? track.color : 'var(--border)',
                  background: isPinned ? `${track.color}10` : 'var(--surface)',
                }}
              >
                <div style={{ ...s.trackBadge, background: track.color, color: 'var(--bg)', fontSize: '17px' }}>
                  {track.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' as const }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={s.trackCardTitle}>{track.title}</span>
                    {isComplete && <CheckCircle size={13} weight="fill" style={{ color: track.color }} />}
                  </div>
                  <div style={s.trackCardDesc}>{track.description}</div>
                  <div style={s.trackCardProgress}>
                    <div style={s.trackBar}>
                      <div style={{ ...s.trackBarFill, width: `${pct}%`, background: track.color }} />
                    </div>
                    <span style={s.trackCardCount}>{done}/{total}</span>
                  </div>
                </div>
                {isPinned && (
                  <span style={{ ...s.pinnedTag, color: track.color, borderColor: track.color }}>
                    Épinglé
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
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

  /* Pill */
  pill: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 14px 10px 12px',
    background: 'var(--surface)',
    border: '1px solid var(--accent-border)',
    borderRadius: '100px',
    color: 'var(--text)', fontFamily: 'inherit',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    transition: 'transform 0.18s, box-shadow 0.18s',
  },
  pillIcon: {
    width: '24px', height: '24px', borderRadius: '50%',
    background: 'var(--accent-bg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, fontSize: '13px',
  },
  pillText: {
    display: 'flex', flexDirection: 'column' as const, gap: '4px',
    minWidth: '140px',
  },
  pillTitle: { fontSize: '12px', fontWeight: 500, color: 'var(--text)', lineHeight: 1 },
  pillBar: {
    width: '100%', height: '3px',
    background: 'var(--surface-2)', borderRadius: '100px', overflow: 'hidden',
  },
  pillBarFill: {
    height: '100%', background: 'var(--accent-text)',
    transition: 'width 0.4s',
  },

  /* Card */
  card: {
    width: '420px',
    maxWidth: 'calc(100vw - 40px)',
    background: 'var(--surface)',
    border: '1px solid var(--accent-border)',
    borderRadius: '18px',
    padding: '20px 22px 18px',
    boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
  },
  cardHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '12px', gap: '10px',
  },
  cardTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '17px', fontWeight: 400,
    color: 'var(--text)', lineHeight: 1.2,
  },
  cardSub: { fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' },
  trackBadge: {
    width: '34px', height: '34px', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '16px', flexShrink: 0,
  },
  iconBtn: {
    width: '30px', height: '30px', borderRadius: '8px',
    border: 'none', background: 'transparent',
    color: 'var(--text-3)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s, color 0.15s',
    flexShrink: 0,
  },
  bar: {
    width: '100%', height: '4px',
    background: 'var(--surface-2)', borderRadius: '100px', overflow: 'hidden',
    marginBottom: '14px',
  },
  barFill: {
    height: '100%',
    background: 'linear-gradient(90deg, rgba(255,213,107,0.8), var(--accent-text))',
    transition: 'width 0.5s',
  },

  /* Step items */
  list: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  item: {
    display: 'flex', flexDirection: 'column' as const, gap: '8px',
    padding: '12px 14px', borderRadius: '12px',
    transition: 'background 0.15s',
  },
  itemRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  itemCurrent: { background: 'var(--accent-bg)', padding: '14px' },
  itemDone: { opacity: 0.6 },
  itemLocked: { opacity: 0.7 },
  checkbox: {
    width: '26px', height: '26px', borderRadius: '50%',
    background: 'var(--surface-2)', color: 'var(--text-3)',
    border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, fontSize: '12px', fontWeight: 600,
    fontFamily: 'inherit', padding: 0,
  },
  itemTitle: {
    flex: 1, minWidth: 0,
    fontSize: '13.5px', fontWeight: 500,
    color: 'var(--text)', lineHeight: 1.35,
    display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const,
  },
  itemTitleDone: {
    textDecoration: 'line-through',
    color: 'var(--text-3)', fontWeight: 400,
  },
  itemDesc: {
    fontSize: '12.5px', fontWeight: 300,
    color: 'var(--text-2)', lineHeight: 1.55,
    paddingLeft: '38px',
  },
  itemAction: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '12.5px', fontWeight: 500,
    padding: '8px 13px', borderRadius: '8px',
    border: 'none', cursor: 'pointer',
    fontFamily: 'inherit',
    marginLeft: '38px',
    alignSelf: 'flex-start' as const,
    textDecoration: 'none',
  },
  planBadge: {
    fontSize: '10px', fontWeight: 600,
    padding: '2px 7px', borderRadius: '100px',
    background: 'var(--surface-2)', color: 'var(--text-3)',
    letterSpacing: '0.3px', textTransform: 'uppercase' as const,
  },

  /* Track list (all tracks view) */
  trackList: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },

  tipBox: {
    display: 'flex', alignItems: 'flex-start', gap: '8px',
    padding: '10px 12px', marginBottom: '14px',
    background: 'rgba(255,213,107,0.05)',
    border: '1px solid rgba(255,213,107,0.18)',
    borderRadius: '10px',
    fontSize: '11.5px', lineHeight: 1.55, color: 'var(--text-2)',
  },
  tipIcon: {
    width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
    background: 'rgba(255,213,107,0.12)', color: 'var(--accent-text)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  tipText: { flex: 1 },

  trackCard: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 14px', borderRadius: '12px',
    border: '1px solid var(--border)',
    background: 'var(--surface)', cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s, background 0.15s',
  },
  trackCardTitle: { fontSize: '13.5px', fontWeight: 500, color: 'var(--text)' },
  trackCardDesc: {
    fontSize: '11.5px', fontWeight: 300,
    color: 'var(--text-2)', lineHeight: 1.4,
    marginTop: '2px',
  },
  trackCardProgress: {
    display: 'flex', alignItems: 'center', gap: '8px',
    marginTop: '6px',
  },
  trackBar: {
    flex: 1, height: '3px',
    background: 'var(--surface-2)',
    borderRadius: '100px', overflow: 'hidden',
  },
  trackBarFill: { height: '100%', transition: 'width 0.5s' },
  trackCardCount: { fontSize: '11px', color: 'var(--text-3)', fontWeight: 500 },
  pinnedTag: {
    fontSize: '10px', fontWeight: 600,
    padding: '3px 8px', borderRadius: '100px',
    border: '1px solid', flexShrink: 0,
    letterSpacing: '0.3px', textTransform: 'uppercase' as const,
  },

  /* Footer */
  allTracksLink: {
    width: '100%', marginTop: '12px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: '6px',
    padding: '10px',
    background: 'transparent',
    border: '1px dashed var(--border)',
    borderRadius: '10px',
    fontFamily: 'inherit', fontSize: '12px', fontWeight: 500,
    color: 'var(--text-2)', cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
  },
}
