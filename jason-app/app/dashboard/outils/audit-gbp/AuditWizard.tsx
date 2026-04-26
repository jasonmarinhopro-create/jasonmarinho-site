'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, CheckCircle, Sparkle } from '@phosphor-icons/react'
import { PILLARS, QUESTIONS, type AnswerValue, type PillarId } from '@/lib/audit-gbp/questions'
import { startAuditSession, updateAuditMeta, saveAuditAnswers, completeAudit } from './actions'

interface Props {
  userId: string | null
}

export default function AuditWizard({ userId }: Props) {
  const router = useRouter()
  const [started, setStarted] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [city, setCity] = useState('')
  const [pillarIdx, setPillarIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const currentPillar = PILLARS[pillarIdx]
  const pillarQuestions = QUESTIONS.filter(q => q.pillar === currentPillar?.id)
  const totalQuestions = QUESTIONS.length
  const answered = Object.keys(answers).length
  const progress = Math.round((answered / totalQuestions) * 100)
  const allAnswered = pillarQuestions.every(q => answers[q.id] !== undefined)
  const isLastPillar = pillarIdx === PILLARS.length - 1

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
      {/* Barre de progression */}
      <div style={s.progressBar}>
        <div style={{ ...s.progressFill, width: `${progress}%` }} />
      </div>

      <div style={s.progressMeta}>
        <span style={s.progressStep}>
          Étape {pillarIdx + 1}/{PILLARS.length} · {currentPillar?.label}
        </span>
        <span style={s.progressPct}>{answered}/{totalQuestions} questions</span>
      </div>

      {/* En-tête du pilier */}
      <div style={s.pillarHeader}>
        <div style={{ ...s.pillarIcon, background: `${currentPillar?.color}18`, color: currentPillar?.color }}>
          <Sparkle size={20} weight="fill" />
        </div>
        <div>
          <h3 style={s.pillarTitle}>{currentPillar?.label}</h3>
          <p style={s.pillarDesc}>{currentPillar?.description}</p>
        </div>
      </div>

      {/* Questions */}
      <div style={s.questions}>
        {pillarQuestions.map(q => {
          const value = answers[q.id]
          return (
            <div key={q.id} style={s.qBlock}>
              <div style={s.qLabel}>{q.label}</div>
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
                const res = await saveAuditAnswers(sessionId, answers)
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
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
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

  btnStart: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    background: '#60a5fa', color: '#0a1628',
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
  },
  progressStep: { color: 'var(--text-2)' },
  progressPct: {},

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

  questions: {
    display: 'flex', flexDirection: 'column' as const, gap: '20px',
  },
  qBlock: {
    paddingBottom: '18px',
    borderBottom: '1px solid var(--border)',
  },
  qLabel: {
    fontSize: '14px', fontWeight: 500, color: 'var(--text)',
    lineHeight: 1.5, marginBottom: '4px',
  },
  qHelp: {
    fontSize: '12px', color: 'var(--text-3)',
    lineHeight: 1.5, marginBottom: '10px',
    fontStyle: 'italic' as const,
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
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '9px 14px',
    background: 'transparent', color: 'var(--text-2)',
    border: '1px solid var(--border)', borderRadius: '9px',
    fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
  },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    background: '#60a5fa', color: '#0a1628',
    fontWeight: 700, fontSize: '14px',
    padding: '10px 18px', borderRadius: '9px',
    border: 'none', cursor: 'pointer',
    transition: 'opacity 0.15s',
    fontFamily: 'inherit',
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
