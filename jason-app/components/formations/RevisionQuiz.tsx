'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Brain, CheckCircle, XCircle, ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { reviewLessonQuestion } from '@/app/dashboard/formations/actions'
import type { RevisionQuestion } from '@/lib/formations/revision'

export default function RevisionQuiz({ questions }: { questions: RevisionQuestion[] }) {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [good, setGood] = useState(0)
  const done = i >= questions.length
  const q = questions[Math.min(i, questions.length - 1)]

  function answer(j: number) {
    if (picked !== null) return
    setPicked(j)
    const correct = q.options[j].correct
    if (correct) setGood(g => g + 1)
    reviewLessonQuestion({ formationId: q.formationId, lessonId: q.lessonId, question: q.question, correct }).catch(() => null)
  }

  return (
    <section style={s.card} aria-label="Révision de tes formations">
      <div style={s.head}>
        <span style={s.ico}><Brain size={18} weight="duotone" /></span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={s.title}>{done ? 'Révision terminée' : 'Pour ne pas oublier'}</span>
          <span style={s.sub}>{done ? `${good} bonne${good > 1 ? 's' : ''} réponse${good > 1 ? 's' : ''} sur ${questions.length}` : `Question ${i + 1} sur ${questions.length} · ${q.formationTitle}`}</span>
        </span>
      </div>
      {done ? (
        <p style={s.p}>Se reposer une question quelques jours plus tard est l&apos;un des moyens les plus sûrs de retenir. Prochaine révision quand tu auras avancé dans tes formations.</p>
      ) : (
        <>
          <div style={s.q}>{q.text}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {q.options.map((o, j) => {
              const show = picked !== null
              const style = !show ? s.opt : o.correct ? { ...s.opt, ...s.good } : picked === j ? { ...s.opt, ...s.bad } : { ...s.opt, opacity: 0.55 }
              return (
                <button key={j} type="button" onClick={() => answer(j)} disabled={show} style={style}>
                  {show && o.correct && <CheckCircle size={16} weight="fill" color="var(--success-1)" style={{ flexShrink: 0 }} />}
                  {show && !o.correct && picked === j && <XCircle size={16} weight="fill" color="var(--danger)" style={{ flexShrink: 0 }} />}
                  <span>{o.text}</span>
                </button>
              )
            })}
          </div>
          {picked !== null && (
            <div style={s.why} aria-live="polite">
              <b style={{ color: 'var(--text)' }}>{q.options[picked].correct ? 'Bien retenu.' : 'À revoir.'}</b> {q.explanation}
              <span style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button type="button" className="btn-primary" onClick={() => { setI(n => n + 1); setPicked(null) }} style={{ fontSize: '13px', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {i + 1 < questions.length ? 'Question suivante' : 'Terminer'} <ArrowRight size={13} />
                </button>
                {!q.options[picked].correct && (
                  <Link prefetch={false} href={`/dashboard/formations/${q.slug}?lecon=${q.lessonId}`} style={{ fontSize: '13px', color: 'var(--accent-text)', fontWeight: 600 }}>Relire la leçon</Link>
                )}
              </span>
            </div>
          )}
        </>
      )}
    </section>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: { background: 'var(--surface)', border: '1px solid var(--accent-border)', borderRadius: '18px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' },
  head: { display: 'flex', gap: '12px', alignItems: 'center' },
  ico: { width: '36px', height: '36px', borderRadius: '11px', background: 'var(--accent-bg)', color: 'var(--accent-text)', display: 'grid', placeItems: 'center', flexShrink: 0 },
  title: { display: 'block', fontFamily: 'var(--font-fraunces), serif', fontSize: '17px', color: 'var(--text)' },
  sub: { display: 'block', fontSize: '12.5px', color: 'var(--text-3)', marginTop: '1px' },
  q: { fontSize: '15px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.5 },
  opt: { display: 'flex', gap: '8px', alignItems: 'center', textAlign: 'left', width: '100%', padding: '9px 12px', borderRadius: '11px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-2)', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1.4 },
  good: { border: '1.5px solid var(--success-1)', background: 'var(--success-bg)', color: 'var(--text)' },
  bad: { border: '1.5px solid var(--danger)', background: 'var(--danger-bg)' },
  why: { fontSize: '13.5px', color: 'var(--text-2)', lineHeight: 1.55, background: 'var(--surface-2)', borderRadius: '11px', padding: '10px 12px' },
  p: { fontSize: '13.5px', color: 'var(--text-2)', lineHeight: 1.55, margin: 0 },
}
