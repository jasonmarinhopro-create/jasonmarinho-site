'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, CheckCircle, Sparkle, Lightning, ArrowSquareOut, FloppyDisk } from '@phosphor-icons/react'
import { PILLARS, QUESTIONS, getOptimalAnswer, type AnswerValue, type PillarId } from '@/lib/audit-gbp/questions'
import { startAuditSession, updateAuditMeta, saveAuditAnswers, completeAudit } from './actions'

interface InitialSession {
  sessionId: string
  businessName: string
  city: string
  answers: Record<string, unknown>
}

interface Props {
  userId: string | null
  initialSession?: InitialSession
}

// Sépare les vraies réponses des meta-clés (commençant par __)
function splitAnswers(raw: Record<string, unknown>): {
  answers: Record<string, AnswerValue>
  prefilledKeys: Set<string>
  gbpUrl: string
} {
  const answers: Record<string, AnswerValue> = {}
  let prefilledKeys = new Set<string>()
  let gbpUrl = ''
  for (const [k, v] of Object.entries(raw)) {
    if (k === '__prefilled_keys' && Array.isArray(v)) {
      prefilledKeys = new Set(v as string[])
    } else if (k === '__gbp_url' && typeof v === 'string') {
      gbpUrl = v
    } else if (!k.startsWith('__') && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) {
      answers[k] = v as AnswerValue
    }
  }
  return { answers, prefilledKeys, gbpUrl }
}

export default function AuditWizard({ userId, initialSession }: Props) {
  const router = useRouter()

  // Si un brouillon est passé, on saute l'intro et on positionne sur le 1er pilier non complet.
  const { answers: initAnswers, prefilledKeys: initPrefilledKeys, gbpUrl: initGbpUrl } = splitAnswers(initialSession?.answers ?? {})

  const initPillarIdx = initialSession
    ? (() => {
        for (let i = 0; i < PILLARS.length; i++) {
          const qs = QUESTIONS.filter(q => q.pillar === PILLARS[i].id)
          if (qs.some(q => initAnswers[q.id] === undefined)) return i
        }
        return PILLARS.length - 1
      })()
    : 0

  const [started, setStarted] = useState(!!initialSession)
  const [sessionId, setSessionId] = useState<string | null>(initialSession?.sessionId ?? null)
  const [businessName, setBusinessName] = useState(initialSession?.businessName ?? '')
  const [city, setCity] = useState(initialSession?.city ?? '')
  const [gbpUrl, setGbpUrl] = useState(initGbpUrl)
  const [pillarIdx, setPillarIdx] = useState(initPillarIdx)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(initAnswers)
  const [prefilledKeys] = useState<Set<string>>(initPrefilledKeys)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const isFirstRender = useRef(true)

  const currentPillar = PILLARS[pillarIdx]
  const pillarQuestions = QUESTIONS.filter(q => q.pillar === currentPillar?.id)
  const totalQuestions = QUESTIONS.length
  const answered = Object.keys(answers).filter(k => !k.startsWith('__')).length
  const progress = Math.round((answered / totalQuestions) * 100)
  const hasCsvImport = prefilledKeys.size > 0
  const allAnswered = pillarQuestions.every(q => answers[q.id] !== undefined)
  const isLastPillar = pillarIdx === PILLARS.length - 1

  // ─── Auto-save (débouncé 1s) ───
  // Sauvegarde silencieuse à chaque modification d'une réponse pour éviter
  // toute perte de travail si l'utilisateur quitte sans cliquer "Suivant".
  useEffect(() => {
    if (!sessionId || !started) return
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setAutoSaveStatus('saving')
    const timeoutId = setTimeout(async () => {
      const payload: Record<string, AnswerValue | string[] | string> = { ...answers }
      if (hasCsvImport) payload.__prefilled_keys = Array.from(prefilledKeys)
      if (gbpUrl) payload.__gbp_url = gbpUrl
      const res = await saveAuditAnswers(sessionId, payload)
      if (!res.error) setAutoSaveStatus('saved')
      else setAutoSaveStatus('idle')
    }, 800)

    return () => clearTimeout(timeoutId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, gbpUrl])

  if (!userId) {
    return (
      <div style={s.gate}>
        <p style={s.gateText}>Connecte-toi pour commencer ton audit.</p>
      </div>
    )
  }

  // ─── Écran d'intro ───
  if (!started) {
    return (
      <div style={s.startBlock}>
        <h2 style={s.startTitle}>Avant de commencer</h2>
        <p style={s.startDesc}>
          Donne-nous le nom de ta fiche pour suivre tes progrès dans le temps.
          Optionnel — tu peux laisser vide.
        </p>

        <div style={s.formRow}>
          <label style={s.label}>
            <span style={s.labelText}>Nom du logement</span>
            <input
              type="text"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="Ex: Le Refuge des Pins"
              style={s.input}
            />
          </label>

          <label style={s.label}>
            <span style={s.labelText}>Ville</span>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Ex: Cassis"
              style={s.input}
            />
          </label>
        </div>

        <label style={{ ...s.label, marginTop: '12px' }}>
          <span style={s.labelText}>URL Google Maps de ta fiche (optionnel — pour les raccourcis)</span>
          <input
            type="url"
            value={gbpUrl}
            onChange={e => setGbpUrl(e.target.value)}
            placeholder="https://www.google.com/maps/place/Ton-Logement/..."
            style={s.input}
          />
          <span style={s.labelHint}>
            Si tu colles ton URL ici, on te proposera un bouton pour ouvrir directement
            ta fiche à chaque pilier — pratique pour vérifier en un clic.
          </span>
        </label>

        {error && <p style={s.error}>{error}</p>}

        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setError(null)
            startTransition(async () => {
              // Si une session existe déjà (l'utilisateur est revenu en arrière), on update.
              // Sinon, on crée une nouvelle session.
              if (sessionId) {
                const res = await updateAuditMeta(sessionId, {
                  businessName: businessName.trim() || undefined,
                  city: city.trim() || undefined,
                })
                if (res.error) {
                  setError(res.error)
                  return
                }
                setStarted(true)
                return
              }
              const res = await startAuditSession({
                businessName: businessName.trim() || undefined,
                city: city.trim() || undefined,
              })
              if (res.error || !res.ok) {
                setError(res.error ?? 'Erreur')
                return
              }
              setSessionId(res.ok.sessionId)
              setStarted(true)
            })
          }}
          style={s.btnStart}
        >
          {isPending ? 'Préparation…' : (sessionId ? 'Reprendre l\'audit' : 'Démarrer l\'audit')}
          <ArrowRight size={15} weight="bold" />
        </button>
      </div>
    )
  }

  // ─── Wizard principal ───
  return (
    <div style={s.wizard}>
      {/* Bandeau "Audit Express importé" */}
      {hasCsvImport && (
        <div style={s.csvBanner}>
          <Lightning size={16} color="var(--accent-text)" weight="fill" />
          <div>
            <strong style={{ color: 'var(--text)' }}>{prefilledKeys.size} réponse{prefilledKeys.size > 1 ? 's' : ''} pré-remplie{prefilledKeys.size > 1 ? 's' : ''} depuis ton CSV.</strong> Les
            questions concernées sont marquées <span style={s.csvBadgeMini}>Auto</span> — vérifie qu'elles sont correctes.
          </div>
        </div>
      )}

      {/* Barre de progression */}
      <div style={s.progressBar}>
        <div style={{ ...s.progressFill, width: `${progress}%` }} />
      </div>

      <div style={s.progressMeta}>
        <span style={s.progressStep}>
          Étape {pillarIdx + 1}/{PILLARS.length} · {currentPillar?.label}
        </span>
        <span style={s.progressRight}>
          {autoSaveStatus !== 'idle' && (
            <span style={{
              ...s.autoSave,
              color: autoSaveStatus === 'saving' ? 'var(--text-muted)' : '#34d399',
            }}>
              <FloppyDisk size={11} weight={autoSaveStatus === 'saved' ? 'fill' : 'regular'} />
              {autoSaveStatus === 'saving' ? 'Enregistrement…' : 'Sauvegardé'}
            </span>
          )}
          <span style={s.progressPct}>{answered}/{totalQuestions} questions</span>
        </span>
      </div>

      {/* En-tête du pilier */}
      <div style={s.pillarHeader}>
        <div style={{ ...s.pillarIcon, background: `${currentPillar?.color}18`, color: currentPillar?.color }}>
          <Sparkle size={20} weight="fill" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={s.pillarTitle}>{currentPillar?.label}</h3>
          <p style={s.pillarDesc}>{currentPillar?.description}</p>
        </div>
      </div>

      {/* Boutons d'aide rapide */}
      <div style={s.quickActions}>
        <a
          href={gbpUrl || 'https://business.google.com/dashboard'}
          target="_blank"
          rel="noopener noreferrer"
          style={s.quickActionLink}
        >
          <ArrowSquareOut size={13} weight="bold" />
          Ouvrir ma fiche pour vérifier
        </a>
        <button
          type="button"
          onClick={() => {
            // Pré-remplit toutes les questions non répondues du pilier courant avec la valeur optimale
            setAnswers(prev => {
              const next = { ...prev }
              for (const q of pillarQuestions) {
                if (next[q.id] === undefined) {
                  const optimal = getOptimalAnswer(q)
                  if (optimal !== null) next[q.id] = optimal
                }
              }
              return next
            })
          }}
          style={s.quickActionBtn}
        >
          <Lightning size={13} weight="fill" />
          Pré-cocher au max
        </button>
      </div>

      {/* Questions */}
      <div style={s.questions}>
        {pillarQuestions.map(q => {
          const value = answers[q.id]
          const isPrefilled = prefilledKeys.has(q.id)
          return (
            <div key={q.id} style={s.qBlock}>
              <div style={s.qLabelRow}>
                <div style={s.qLabel}>{q.label}</div>
                {isPrefilled && (
                  <span style={s.qBadgePrefilled}>
                    <Lightning size={10} weight="fill" /> Auto
                  </span>
                )}
              </div>
              {q.help && <div style={s.qHelp}>{q.help}</div>}

              {q.type === 'boolean' && (
                <div style={s.choiceRow}>
                  {[
                    { v: true,  label: 'Oui' },
                    { v: false, label: 'Non' },
                  ].map(opt => (
                    <button
                      key={String(opt.v)}
                      type="button"
                      onClick={() => setAnswers(a => ({ ...a, [q.id]: opt.v }))}
                      style={{
                        ...s.choiceBtn,
                        ...(value === opt.v ? s.choiceBtnActive : {}),
                      }}
                    >
                      {value === opt.v && <CheckCircle size={13} weight="fill" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'choice' && q.options && (
                <div style={s.choiceCol}>
                  {q.options.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAnswers(a => ({ ...a, [q.id]: opt.value }))}
                      style={{
                        ...s.choiceBtn,
                        ...(value === opt.value ? s.choiceBtnActive : {}),
                      }}
                    >
                      {value === opt.value && <CheckCircle size={13} weight="fill" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'number_bucket' && q.buckets && (
                <div style={s.choiceCol}>
                  {q.buckets.map(b => {
                    const bucketValue = b.min  // on stocke le min de la tranche
                    return (
                      <button
                        key={`${b.min}-${b.max}`}
                        type="button"
                        onClick={() => setAnswers(a => ({ ...a, [q.id]: bucketValue }))}
                        style={{
                          ...s.choiceBtn,
                          ...(value === bucketValue ? s.choiceBtnActive : {}),
                        }}
                      >
                        {value === bucketValue && <CheckCircle size={13} weight="fill" />}
                        {b.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {error && <p style={s.error}>{error}</p>}

      {/* Navigation */}
      <div style={s.nav}>
        <button
          type="button"
          onClick={() => {
            // À l'étape 1 → retour à l'écran intro (modifier nom/ville)
            // Sinon → pilier précédent
            if (pillarIdx === 0) {
              setStarted(false)
              window.scrollTo({ top: 0, behavior: 'smooth' })
              return
            }
            setPillarIdx(i => Math.max(0, i - 1))
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          disabled={isPending}
          style={s.btnGhost}
        >
          <ArrowLeft size={14} weight="bold" />
          {pillarIdx === 0 ? 'Modifier le nom' : 'Précédent'}
        </button>

        <button
          type="button"
          disabled={!allAnswered || isPending}
          onClick={() => {
            setError(null)
            if (!sessionId) return

            // Sauvegarde intermédiaire
            startTransition(async () => {
              if (!isLastPillar) {
                // On réinjecte les meta-clés pour qu'elles survivent à la navigation
                const payload: Record<string, AnswerValue | string[] | string> = { ...answers }
                if (hasCsvImport) payload.__prefilled_keys = Array.from(prefilledKeys)
                if (gbpUrl) payload.__gbp_url = gbpUrl
                const res = await saveAuditAnswers(sessionId, payload)
                if (res.error) {
                  setError(res.error)
                  return
                }
                setPillarIdx(i => i + 1)
                window.scrollTo({ top: 0, behavior: 'smooth' })
                return
              }
              // Dernier pilier → on complète
              const res = await completeAudit(sessionId, answers)
              if (res.error || !res.ok) {
                setError(res.error ?? 'Erreur')
                return
              }
              router.push(`/dashboard/outils/audit-gbp/resultats/${res.ok.sessionId}`)
            })
          }}
          style={{
            ...s.btnPrimary,
            ...(allAnswered ? {} : s.btnDisabled),
          }}
        >
          {isLastPillar ? (isPending ? 'Calcul du score…' : 'Voir mon score') : (isPending ? 'Sauvegarde…' : 'Suivant')}
          <ArrowRight size={14} weight="bold" />
        </button>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  gate: { padding: '40px', textAlign: 'center' as const },
  gateText: { color: 'var(--text-2)', fontSize: '14px' },

  /* Start screen */
  startBlock: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '24px',
  },
  startTitle: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', fontWeight: 500,
    color: 'var(--text)', margin: '0 0 6px',
  },
  startDesc: { fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 18px' },

  formRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px',
    marginBottom: '16px',
  },
  label: { display: 'flex', flexDirection: 'column' as const, gap: '5px' },
  labelText: {
    fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const,
    letterSpacing: '0.6px', color: 'var(--text-3)',
  },
  input: {
    background: 'var(--bg-2, rgba(255,255,255,0.02))',
    border: '1px solid var(--border)',
    borderRadius: '8px', padding: '10px 12px',
    fontSize: '14px', color: 'var(--text)',
    fontFamily: 'inherit',
  },
  labelHint: {
    fontSize: '11.5px', color: 'var(--text-3)',
    lineHeight: 1.5, marginTop: '4px',
    fontStyle: 'italic' as const,
  },

  btnStart: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    background: 'var(--accent-text)', color: 'var(--bg)',
    fontWeight: 700, fontSize: '14px',
    padding: '11px 20px', borderRadius: '10px',
    border: 'none', cursor: 'pointer',
    transition: 'background 0.15s, transform 0.15s',
  },

  /* Wizard */
  wizard: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '24px',
  },
  progressBar: {
    width: '100%', height: '4px',
    background: 'var(--border)', borderRadius: '999px',
    overflow: 'hidden', marginBottom: '8px',
  },
  progressFill: {
    height: '100%', background: '#60a5fa',
    transition: 'width 0.3s',
  },
  progressMeta: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: '11px', color: 'var(--text-3)',
    marginBottom: '20px', textTransform: 'uppercase' as const,
    letterSpacing: '0.5px', fontWeight: 500,
    flexWrap: 'wrap' as const, gap: '8px',
  },
  progressStep: { color: 'var(--text-2)' },
  progressPct: {},
  progressRight: {
    display: 'inline-flex', alignItems: 'center', gap: '12px',
  },
  autoSave: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '10px', fontWeight: 500,
    textTransform: 'none' as const, letterSpacing: 0,
    transition: 'color 0.15s, opacity 0.3s',
  },

  pillarHeader: {
    display: 'flex', alignItems: 'center', gap: '14px',
    paddingBottom: '20px', borderBottom: '1px solid var(--border)',
    marginBottom: '20px',
  },
  pillarIcon: {
    width: '40px', height: '40px', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  pillarTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '17px', fontWeight: 500,
    color: 'var(--text)', margin: 0,
  },
  pillarDesc: {
    fontSize: '12px', color: 'var(--text-3)', margin: '2px 0 0',
  },

  /* Quick actions par pilier */
  quickActions: {
    display: 'flex', gap: '8px',
    marginBottom: '18px', flexWrap: 'wrap' as const,
  },
  quickActionLink: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', fontWeight: 500,
    color: 'var(--text-2)',
    background: 'var(--bg-2, rgba(255,255,255,0.02))',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '7px 12px',
    textDecoration: 'none',
    transition: 'border-color 0.15s, color 0.15s',
  },
  quickActionBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', fontWeight: 600,
    color: 'var(--accent-text)',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: '8px',
    padding: '7px 12px',
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'background 0.15s',
  },

  questions: {
    display: 'flex', flexDirection: 'column' as const, gap: '20px',
  },
  qBlock: {
    paddingBottom: '18px',
    borderBottom: '1px solid var(--border)',
  },
  qLabelRow: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    marginBottom: '4px',
  },
  qLabel: {
    flex: 1, fontSize: '14px', fontWeight: 500, color: 'var(--text)',
    lineHeight: 1.5,
  },
  qBadgePrefilled: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '10px', fontWeight: 700,
    letterSpacing: '0.5px', textTransform: 'uppercase' as const,
    color: 'var(--accent-text)',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: '6px',
    padding: '3px 7px',
    flexShrink: 0,
    marginTop: '1px',
  },
  qHelp: {
    fontSize: '12px', color: 'var(--text-3)',
    lineHeight: 1.5, marginBottom: '10px',
    fontStyle: 'italic' as const,
  },

  /* Bannière CSV import */
  csvBanner: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    padding: '12px 14px',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: '10px',
    fontSize: '12.5px', color: 'var(--text-2)',
    lineHeight: 1.6, marginBottom: '16px',
  },
  csvBadgeMini: {
    display: 'inline-block',
    fontSize: '9.5px', fontWeight: 700,
    color: 'var(--accent-text)',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: '4px',
    padding: '1px 5px',
    margin: '0 2px',
    letterSpacing: '0.4px',
  },

  choiceRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' as const, marginTop: '8px' },
  choiceCol: { display: 'flex', flexDirection: 'column' as const, gap: '6px', marginTop: '8px' },
  choiceBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    padding: '9px 14px',
    background: 'var(--bg-2, rgba(255,255,255,0.02))',
    border: '1px solid var(--border)',
    borderRadius: '9px',
    fontSize: '13px', color: 'var(--text-2)',
    cursor: 'pointer', textAlign: 'left' as const,
    transition: 'all 0.15s',
    fontFamily: 'inherit',
  },
  choiceBtnActive: {
    borderColor: '#60a5fa',
    background: 'rgba(96,165,250,0.1)',
    color: '#60a5fa',
    fontWeight: 600,
  },

  /* Nav */
  nav: {
    display: 'flex', justifyContent: 'space-between',
    marginTop: '24px', paddingTop: '20px',
    borderTop: '1px solid var(--border)',
    flexWrap: 'wrap' as const, gap: '10px',
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    padding: '10px 14px',
    background: 'transparent', color: 'var(--text-2)',
    border: '1px solid var(--border)', borderRadius: '9px',
    fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
    flex: '1 1 130px', minWidth: 0,
  },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
    background: '#60a5fa', color: '#0a1628',
    fontWeight: 700, fontSize: '14px',
    padding: '11px 18px', borderRadius: '9px',
    border: 'none', cursor: 'pointer',
    transition: 'opacity 0.15s',
    fontFamily: 'inherit',
    flex: '1 1 160px', minWidth: 0,
  },
  btnDisabled: {
    opacity: 0.4, cursor: 'not-allowed',
  },

  error: {
    color: '#ef4444', fontSize: '13px',
    margin: '12px 0 0', padding: '10px 12px',
    background: 'rgba(239,68,68,0.08)',
    borderRadius: '8px',
  },
}
