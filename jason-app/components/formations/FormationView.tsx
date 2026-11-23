'use client'

// Lecteur de formation (refonte du 23/11/2026, maquettes validées par Jason,
// docs/claude/formations.md). Trois écrans :
// - la fiche (sans ?lecon) : couverture, promesse, programme, bouton collé en bas ;
// - la leçon (?lecon=<id>&etape=<n>) : étapes plein écran, « Continuer » au pouce,
//   questions avec panneau vert ou rouge, action de fin de module ;
// - la fin (?fin=1) : médaille, score, actions, attestation, suite.
// Une leçon avec questions se termine en y répondant ; sans question (ancien
// format), le bouton de la dernière étape la termine.
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, X, Clock, BookOpen, Target, Check, CheckCircle, XCircle,
  BookmarkSimple, NotePencil, ChatCircle, Certificate, CaretDown, Lightning, Trophy,
} from '@phosphor-icons/react/dist/ssr'
import {
  enrollInFormation, updateFormationProgress, saveLessonNote, toggleLessonBookmark,
  voteLesson, answerLessonQuestion, planModuleAction, saveFormationBilan, toggleFormationFavorite,
} from '@/app/dashboard/formations/actions'
import LessonComments from './LessonComments'
import LessonContent, { formatInline, type ActionWhen } from './LessonContent'
import InlineStyle from '@/components/ui/InlineStyle'
import { parseLesson, type Block } from '@/lib/formations/blocks'
import { lessonSteps, stepLabel, type Step } from '@/lib/formations/steps'
import { flatLessons, firstIncomplete, lessonFromParam, percent, quizScore } from '@/lib/formations/progress'
import { coverBackground, objectifLabel } from '@/lib/formations/objectifs'

interface Lesson { id: number; title: string; duration: string; content: string }
interface Module { id: number; title: string; duration: string; lessons: Lesson[] }
interface Formation { title: string; description: string; duration: string; level: string; objectifs: string[]; modules: Module[] }

export interface InitialAnswer { lesson_id: number; question: number; correct: boolean }
export interface InitialAction { module_id: number; done_at: string | null; due_at: string | null }

type QuizState = Record<number, { picked: number; correct: boolean }>
type ActionState = { when: ActionWhen; dueLabel?: string }
type View = { kind: 'fiche' } | { kind: 'lesson'; id: number; step: number } | { kind: 'fin' } | { kind: 'bilan'; step: 0 | 1 }

const WHEN_TEXT: Record<Exclude<ActionWhen, 'done'>, string> = { 'ce-soir': 'ce soir', demain: 'demain', 'week-end': 'ce week-end' }
const BUTS = ['Démarrer sur de bonnes bases', 'Gagner plus avec ce que j\'ai déjà', 'Régler un problème précis']
const NIVEAUX: Array<[string, string]> = [['debut', 'Pas du tout, je découvre'], ['un-peu', 'Un peu'], ['bien', 'Bien, je veux aller plus loin']]

function dueLabel(iso: string | null): string | undefined {
  if (!iso) return undefined
  return new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

function readView(all: ReturnType<typeof flatLessons>): View {
  const sp = new URLSearchParams(window.location.search)
  if (sp.get('fin') === '1') return { kind: 'fin' }
  const ref = lessonFromParam(all, sp.get('lecon'))
  if (ref) return { kind: 'lesson', id: ref.lessonId, step: Math.max(0, Number(sp.get('etape') ?? '1') - 1) || 0 }
  return { kind: 'fiche' }
}

export default function FormationView({
  formation,
  formationId,
  initialCompletedLessons = [],
  initialNotes = {},
  initialBookmarks = [],
  initialVotes = {},
  initialAnswers = [],
  initialActions = [],
  initialObjectif = null,
  initialFavorite = false,
  firstLogementId = null,
  formationSlug = '',
  relatedArticles = [],
  recommendedNext = [],
  currentUserId,
  currentUserName,
}: {
  formation: Formation
  formationId?: string | null
  initialProgress?: number | null
  initialCompletedLessons?: number[]
  initialNotes?: Record<string, string>
  initialBookmarks?: number[]
  initialVotes?: Record<string, 1 | -1>
  initialAnswers?: InitialAnswer[]
  initialActions?: InitialAction[]
  initialObjectif?: string | null
  initialFavorite?: boolean
  firstLogementId?: string | null
  formationSlug?: string
  relatedArticles?: Array<{ label: string; slug: string }>
  recommendedNext?: Array<{ slug: string; title: string; reason?: string }>
  currentUserId?: string | null
  currentUserName?: string | null
}) {
  const all = useMemo(() => flatLessons(formation.modules), [formation.modules])
  const total = all.length
  const lessonById = useMemo(() => {
    const m = new Map<number, { lesson: Lesson; module: Module }>()
    formation.modules.forEach(mod => mod.lessons.forEach(l => m.set(l.id, { lesson: l, module: mod })))
    return m
  }, [formation.modules])
  const blocksById = useMemo(() => {
    const m = new Map<number, Block[]>()
    formation.modules.forEach(mod => mod.lessons.forEach(l => m.set(l.id, parseLesson(l.content))))
    return m
  }, [formation.modules])
  const stepsById = useMemo(() => {
    const m = new Map<number, Step[]>()
    blocksById.forEach((b, id) => m.set(id, lessonSteps(b)))
    return m
  }, [blocksById])
  const quizCount = useCallback((id: number) => (blocksById.get(id) ?? []).filter(b => b.type === 'quiz').length, [blocksById])
  const actionsTotal = useMemo(() => {
    let n = 0
    blocksById.forEach(bs => { n += bs.filter(b => b.type === 'action').length })
    return n
  }, [blocksById])

  const [view, setView] = useState<View>({ kind: 'fiche' })
  const [completed, setCompleted] = useState<number[]>(initialCompletedLessons)
  const [justFinished, setJustFinished] = useState(false)
  const [objectif, setObjectif] = useState<string | null>(initialObjectif)
  const [niveau, setNiveau] = useState<string | null>(null)
  const [favorite, setFavorite] = useState(initialFavorite)
  const [answers, setAnswers] = useState<Record<number, QuizState>>(() => {
    const out: Record<number, QuizState> = {}
    for (const a of initialAnswers) {
      const q = (blocksById.get(a.lesson_id) ?? []).find(b => b.type === 'quiz' && b.index === a.question)
      const correctIdx = q && q.type === 'quiz' ? q.options.findIndex(o => o.correct) : -1
      out[a.lesson_id] = { ...(out[a.lesson_id] ?? {}), [a.question]: { picked: a.correct ? correctIdx : -1, correct: a.correct } }
    }
    return out
  })
  const [actions, setActions] = useState<Record<number, ActionState>>(() => {
    const out: Record<number, ActionState> = {}
    for (const a of initialActions) out[a.module_id] = a.done_at ? { when: 'done' } : { when: 'demain', dueLabel: dueLabel(a.due_at) }
    return out
  })

  // ─── Adresse ──────────────────────────────────────────────────────
  useEffect(() => {
    const read = () => setView(readView(all))
    read()
    window.addEventListener('popstate', read)
    return () => window.removeEventListener('popstate', read)
  }, [all])

  const go = useCallback((v: View, replace = false) => {
    const url = new URL(window.location.href)
    url.searchParams.delete('lecon'); url.searchParams.delete('etape'); url.searchParams.delete('fin')
    if (v.kind === 'lesson') {
      url.searchParams.set('lecon', String(v.id))
      if (v.step > 0) url.searchParams.set('etape', String(v.step + 1))
    }
    if (v.kind === 'fin') url.searchParams.set('fin', '1')
    const href = url.pathname + url.search
    if (replace) window.history.replaceState({}, '', href)
    else window.history.pushState({}, '', href)
    setView(v)
    window.scrollTo({ top: 0 })
  }, [])

  const progress = percent(completed, total)
  const finished = progress === 100
  const resume = firstIncomplete(all, completed)

  function markComplete(lessonId: number) {
    if (completed.includes(lessonId)) return
    const updated = [...completed, lessonId]
    setCompleted(updated)
    const pct = percent(updated, total)
    if (pct === 100) setJustFinished(true)
    if (formationId) updateFormationProgress(formationId, pct, updated, lessonId)
  }

  function onAnswer(lessonId: number, index: number, picked: number, correct: boolean) {
    if (answers[lessonId]?.[index]) return
    const next = { ...(answers[lessonId] ?? {}), [index]: { picked, correct } }
    setAnswers(prev => ({ ...prev, [lessonId]: next }))
    if (formationId) answerLessonQuestion({ formationId, lessonId, question: index, correct }).catch(() => null)
    if (Object.keys(next).length >= quizCount(lessonId)) markComplete(lessonId)
  }

  function onAction(moduleId: number, title: string, href: string | null, when: ActionWhen) {
    setActions(prev => ({ ...prev, [moduleId]: when === 'done' ? { when } : { when, dueLabel: WHEN_TEXT[when] } }))
    if (formationId) {
      planModuleAction({ formationId, moduleId, title, href, when })
        .then(r => { if (r?.dueAt) setActions(prev => ({ ...prev, [moduleId]: { when, dueLabel: dueLabel(r.dueAt!) } })) })
        .catch(() => null)
    }
  }

  function startOrResume() {
    if (formationId && completed.length === 0) enrollInFormation(formationId)
    if (!objectif && completed.length === 0) { go({ kind: 'bilan', step: 0 }); return }
    const target = resume ?? all[0]
    if (target) go({ kind: 'lesson', id: target.lessonId, step: 0 })
  }

  function toggleFav() {
    const add = !favorite
    setFavorite(add)
    if (formationId) toggleFormationFavorite({ formationId, formationSlug, formationTitle: formation.title, add }).catch(() => setFavorite(!add))
  }

  const score = quizScore(Object.values(answers).flatMap(q => Object.values(q)))
  const actionsDone = Object.values(actions).filter(a => a.when === 'done').length
  const cover = coverBackground(formationSlug)

  return (
    <div className="fv">
      <InlineStyle css={CSS} />
      {view.kind === 'fiche' && (
        <Fiche
          formation={formation} slug={formationSlug} cover={cover} completed={completed} progress={progress} finished={finished}
          objectif={objectif} favorite={favorite} onFav={toggleFav} resume={resume} total={total} actionsTotal={actionsTotal}
          actionsDone={actionsDone} score={score} actions={actions} onStart={startOrResume}
          onLesson={id => go({ kind: 'lesson', id, step: 0 })} onFin={() => go({ kind: 'fin' })}
          recommendedNext={recommendedNext}
        />
      )}
      {view.kind === 'bilan' && (
        <Bilan
          step={view.step}
          onClose={() => go({ kind: 'fiche' })}
          onDone={(obj, lvl) => {
            setObjectif(obj); setNiveau(lvl)
            if (formationId) saveFormationBilan({ formationId, objectif: obj, bilan: { niveau: lvl } }).catch(() => null)
            if (all[0]) go({ kind: 'lesson', id: all[0].lessonId, step: 0 }, true)
          }}
          onSkip={() => all[0] && go({ kind: 'lesson', id: all[0].lessonId, step: 0 }, true)}
        />
      )}
      {view.kind === 'lesson' && lessonById.get(view.id) && (
        <LessonPlayer
          key={view.id}
          formationTitle={formation.title}
          entry={lessonById.get(view.id)!}
          steps={stepsById.get(view.id) ?? []}
          step={Math.min(view.step, Math.max(0, (stepsById.get(view.id) ?? []).length - 1))}
          setStep={s => go({ kind: 'lesson', id: view.id, step: s }, true)}
          lessonIndex={all.findIndex(l => l.lessonId === view.id)}
          totalLessons={total}
          done={completed.includes(view.id)}
          quizCount={quizCount(view.id)}
          quiz={answers[view.id] ?? {}}
          onAnswer={(i, p, c) => onAnswer(view.id, i, p, c)}
          action={actions[lessonById.get(view.id)!.module.id] ?? null}
          onAction={(t, h, w) => onAction(lessonById.get(view.id)!.module.id, t, h, w)}
          logementId={firstLogementId}
          onComplete={() => markComplete(view.id)}
          onClose={() => go({ kind: 'fiche' })}
          onNext={() => {
            // La leçon courante compte comme faite (le bouton ou la dernière réponse vient de la terminer)
            const doneNow = completed.includes(view.id) ? completed : [...completed, view.id]
            if (percent(doneNow, total) === 100) { go({ kind: 'fin' }); return }
            const after = all.slice(all.findIndex(l => l.lessonId === view.id) + 1).find(l => !doneNow.includes(l.lessonId))
              ?? all.find(l => !doneNow.includes(l.lessonId))
            if (after) go({ kind: 'lesson', id: after.lessonId, step: 0 })
            else go({ kind: 'fiche' })
          }}
          objectif={objectif}
          niveau={niveau}
          notes={initialNotes}
          bookmarked={initialBookmarks.includes(view.id)}
          vote={initialVotes[String(view.id)] ?? null}
          formationId={formationId ?? null}
          formationSlug={formationSlug}
          relatedArticles={relatedArticles}
          currentUserId={currentUserId ?? null}
          currentUserName={currentUserName ?? null}
        />
      )}
      {view.kind === 'fin' && (
        <Fin
          title={formation.title} objectifs={formation.objectifs} objectif={objectif} celebrate={justFinished}
          score={score} actionsDone={actionsDone} actionsTotal={actionsTotal} finished={finished}
          attestationHref={formationSlug ? `/dashboard/formations/attestation/${formationSlug}` : null}
          next={recommendedNext[0] ?? null} onClose={() => go({ kind: 'fiche' })}
        />
      )}
    </div>
  )
}

/* ─────────────────────────── Fiche ─────────────────────────── */

function Fiche(p: {
  formation: Formation; slug: string; cover: string; completed: number[]; progress: number; finished: boolean
  objectif: string | null; favorite: boolean; onFav: () => void; resume: ReturnType<typeof firstIncomplete>
  total: number; actionsTotal: number; actionsDone: number; score: { good: number; total: number }
  actions: Record<number, ActionState>; onStart: () => void; onLesson: (id: number) => void; onFin: () => void
  recommendedNext: Array<{ slug: string; title: string; reason?: string }>
}) {
  const { formation: f } = p
  const [open, setOpen] = useState<number | null>(null)
  const started = p.completed.length > 0
  const ctaLabel = p.finished ? 'Revoir les leçons' : started ? 'Reprendre' : 'Commencer'
  const ctaSub = p.finished ? null : p.resume ? (started ? p.resume.title : `Première leçon : ${p.resume.title}`) : null
  const nextDur = p.resume ? f.modules.flatMap(m => m.lessons).find(l => l.id === p.resume!.lessonId)?.duration : null
  const curModule = p.resume ? f.modules.find(m => m.lessons.some(l => l.id === p.resume!.lessonId))?.id : null

  const cta = (
    <button type="button" className="fv-btn" onClick={() => (p.finished ? p.onLesson(f.modules[0].lessons[0].id) : p.onStart())}>
      {ctaLabel}{nextDur && !p.finished ? ` · ${nextDur}` : ''}
    </button>
  )

  return (
    <div className="fv-fiche">
      <div className="fv-cover" style={{ background: p.cover }}>
        <div className="fv-cover-nav">
          <Link href="/dashboard/formations" className="fv-round" aria-label="Toutes les formations"><ArrowLeft size={17} weight="bold" /></Link>
          <button type="button" className={`fv-round${p.favorite ? ' on' : ''}`} onClick={p.onFav} aria-label={p.favorite ? 'Retirer des favoris' : 'Garder en favori'} aria-pressed={p.favorite}>
            <BookmarkSimple size={17} weight={p.favorite ? 'fill' : 'bold'} />
          </button>
        </div>
        <span className="fv-cover-tag">{objectifLabel(p.slug)} · {f.level}</span>
        <h1 className="fv-cover-t">{f.title}</h1>
      </div>

      <div className="fv-fiche-grid">
        <div className="fv-fiche-main">
          <h1 className="fv-mobile-t">{f.title}</h1>
          <div className="fv-metas">
            <span><Clock size={14} /> {f.duration}</span>
            <span><BookOpen size={14} /> {p.total} leçons</span>
            {p.actionsTotal > 0 && <span><Target size={14} /> {p.actionsTotal} actions</span>}
          </div>
          <p className="fv-promise">{f.description}</p>

          {p.finished && (
            <button type="button" className="fv-done-banner" onClick={p.onFin}>
              <span className="fv-medal-s"><Trophy size={18} weight="fill" /></span>
              <span><b>Formation terminée</b><small>{p.score.total > 0 ? `${p.score.good}/${p.score.total} bonnes réponses · ` : ''}Voir le bilan et l&apos;attestation</small></span>
              <ArrowRight size={16} weight="bold" />
            </button>
          )}

          {started && !p.finished && (
            <div className="fv-goalcard">
              <div className="fv-goalrow"><span>{p.objectif ? `Ton objectif : ${p.objectif}` : 'Ta progression'}</span><b>{p.progress} %</b></div>
              <span className="fv-mini"><i style={{ width: `${p.progress}%` }} /></span>
            </div>
          )}

          <span className="fv-sec">Tu sauras</span>
          <ul className="fv-can">{f.objectifs.map((o, i) => <li key={i}><CheckCircle size={19} weight="fill" />{o}</li>)}</ul>

          <span className="fv-sec">Programme · {f.modules.length} modules</span>
          <div className="fv-mods">
            {f.modules.map(m => {
              const doneN = m.lessons.filter(l => p.completed.includes(l.id)).length
              const allDone = doneN === m.lessons.length
              const isCur = m.id === curModule && !p.finished
              const isOpen = open === m.id
              return (
                <div key={m.id} className={`fv-mod${isCur ? ' cur' : ''}`}>
                  <button type="button" className="fv-mod-h" onClick={() => setOpen(isOpen ? null : m.id)} aria-expanded={isOpen}>
                    <span className={`fv-nd${allDone ? ' d' : isCur ? ' n' : ''}`}>{allDone ? <Check size={13} weight="bold" /> : m.id}</span>
                    <span className="fv-mod-m">
                      <b>{m.title}</b>
                      <small>
                        {allDone ? `${m.lessons.length} sur ${m.lessons.length}` : isCur ? `Leçon ${doneN + 1} sur ${m.lessons.length} · en cours` : `${m.lessons.length} leçon${m.lessons.length > 1 ? 's' : ''} · ${m.duration}`}
                        {p.actions[m.id]?.when === 'done' ? ' · action faite' : ''}
                      </small>
                    </span>
                    <CaretDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }} />
                  </button>
                  {isOpen && (
                    <div className="fv-mod-l">
                      {m.lessons.map(l => (
                        <button key={l.id} type="button" onClick={() => p.onLesson(l.id)} className="fv-mod-lesson">
                          <span className={`fv-dot${p.completed.includes(l.id) ? ' d' : ''}`}>{p.completed.includes(l.id) && <Check size={9} weight="bold" />}</span>
                          <span style={{ flex: 1 }}>{l.title}</span>
                          <small>{l.duration}</small>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {p.finished && p.recommendedNext.length > 0 && (
            <>
              <span className="fv-sec">Pour aller plus loin</span>
              <div className="fv-mods">
                {p.recommendedNext.map(r => (
                  <Link key={r.slug} href={`/dashboard/formations/${r.slug}`} className="fv-mod-h" style={{ textDecoration: 'none' }}>
                    <span className="fv-cov" style={{ background: coverBackground(r.slug, 0.22) }} />
                    <span className="fv-mod-m"><b>{r.title}</b>{r.reason && <small>{r.reason}</small>}</span>
                    <ArrowRight size={15} />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="fv-fiche-side">
          <div className="fv-panel">
            {started && <div className="fv-goalrow"><span>{p.objectif ? `Objectif : ${p.objectif}` : 'Progression'}</span><b>{p.progress} %</b></div>}
            {started && <span className="fv-mini"><i style={{ width: `${p.progress}%` }} /></span>}
            {cta}
            {ctaSub && <small className="fv-muted" style={{ textAlign: 'center' }}>{ctaSub}</small>}
            <div className="fv-metas small">
              {p.actionsTotal > 0 && <span><Target size={13} /> {p.actionsDone} action{p.actionsDone > 1 ? 's' : ''} sur {p.actionsTotal}</span>}
              {p.score.total > 0 && <span><Check size={13} /> {p.score.good} bonne{p.score.good > 1 ? 's' : ''} réponse{p.score.good > 1 ? 's' : ''} sur {p.score.total}</span>}
            </div>
          </div>
        </aside>
      </div>

      <div className="fv-sticky">
        {cta}
        {ctaSub && <small>{ctaSub}</small>}
      </div>
    </div>
  )
}

/* ─────────────────────────── Bilan de départ ─────────────────────────── */

function Bilan({ step, onClose, onDone, onSkip }: { step: 0 | 1; onClose: () => void; onDone: (o: string, n: string) => void; onSkip: () => void }) {
  const [s, setS] = useState<0 | 1>(step)
  const [but, setBut] = useState<string | null>(null)
  const [libre, setLibre] = useState('')
  const [autre, setAutre] = useState(false)
  const [lvl, setLvl] = useState<string | null>(null)
  const obj = autre ? libre.trim() : but
  return (
    <div className="fv-full">
      <div className="fv-top">
        <button type="button" className="fv-x" onClick={onClose} aria-label="Fermer"><X size={20} /></button>
        <span className="fv-prog"><i className="d" /><i className={s === 1 ? 'd' : ''} /></span>
        <span className="fv-count">{s + 1}/2</span>
      </div>
      <div className="fv-stage">
        <div className="fv-stage-in">
          <span className="fv-k">Avant de commencer</span>
          {s === 0 ? (
            <>
              <h2 className="fv-h">Qu&apos;est-ce que tu veux réussir avec cette formation ?</h2>
              <div className="fv-opts">
                {BUTS.map(b => (
                  <button key={b} type="button" className={`fv-opt${!autre && but === b ? ' sel' : ''}`} onClick={() => { setBut(b); setAutre(false) }}>{b}</button>
                ))}
                <button type="button" className={`fv-opt${autre ? ' sel' : ''}`} onClick={() => setAutre(true)}>Autre, je l&apos;écris</button>
                {autre && <input id="bilan-libre" className="fv-input" autoFocus value={libre} maxLength={200} onChange={e => setLibre(e.target.value)} placeholder="En une phrase" />}
              </div>
              <p className="fv-muted">Ton objectif s&apos;affichera sur la fiche et à la fin, pour mesurer le chemin parcouru.</p>
            </>
          ) : (
            <>
              <h2 className="fv-h">Tu connais déjà ce sujet ?</h2>
              <div className="fv-opts">
                {NIVEAUX.map(([k, l]) => <button key={k} type="button" className={`fv-opt${lvl === k ? ' sel' : ''}`} onClick={() => setLvl(k)}>{l}</button>)}
              </div>
              {lvl === 'bien' && <p className="fv-muted">Tu pourras ouvrir directement les leçons qui t&apos;intéressent depuis le programme : les questions te diront ce que tu sais déjà.</p>}
            </>
          )}
        </div>
      </div>
      <div className="fv-foot">
        <div className="fv-foot-in">
          <button type="button" className="fv-ghost" onClick={onSkip}>Passer</button>
          {s === 0
            ? <button type="button" className="fv-btn" disabled={!obj} onClick={() => setS(1)}>Continuer</button>
            : <button type="button" className="fv-btn" disabled={!lvl} onClick={() => obj && lvl && onDone(obj, lvl)}>C&apos;est parti</button>}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────── Leçon en étapes ─────────────────────────── */

function LessonPlayer(p: {
  formationTitle: string; entry: { lesson: Lesson; module: Module }; steps: Step[]; step: number; setStep: (s: number) => void
  lessonIndex: number; totalLessons: number; done: boolean; quizCount: number; quiz: QuizState
  onAnswer: (i: number, picked: number, correct: boolean) => void; action: ActionState | null
  onAction: (title: string, href: string | null, when: ActionWhen) => void; logementId: string | null
  onComplete: () => void; onClose: () => void; onNext: () => void; objectif: string | null; niveau: string | null
  notes: Record<string, string>; bookmarked: boolean; vote: 1 | -1 | null; formationId: string | null; formationSlug: string
  relatedArticles: Array<{ label: string; slug: string }>; currentUserId: string | null; currentUserName: string | null
}) {
  const { lesson, module } = p.entry
  const steps = p.steps.length ? p.steps : [{ kind: 'content', title: null, blocks: [] } as Step]
  const s = steps[p.step]
  const last = p.step === steps.length - 1
  const [tools, setTools] = useState<null | 'notes' | 'question'>(null)
  const [note, setNote] = useState(p.notes[String(lesson.id)] ?? '')
  const [saved, setSaved] = useState(false)
  const [bm, setBm] = useState(p.bookmarked)
  const [vote, setVote] = useState<1 | -1 | null>(p.vote)
  const timer = useRef<NodeJS.Timeout | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => { stageRef.current?.scrollTo({ top: 0 }); window.scrollTo({ top: 0 }) }, [p.step])

  // Lien d'action vers Mes prix : le logement de l'hôte déjà choisi
  const actionHref = (href: string | null) => {
    if (!href || !p.logementId || !href.startsWith('/dashboard/calculateurs')) return href
    const [path, hash] = href.split('#')
    return `${path}${path.includes('?') ? '&' : '?'}logement=${p.logementId}${hash ? `#${hash}` : ''}`
  }

  function updateNote(v: string) {
    setNote(v); setSaved(false)
    if (timer.current) clearTimeout(timer.current)
    if (!p.formationId) return
    timer.current = setTimeout(async () => {
      await saveLessonNote({ formationId: p.formationId!, moduleId: module.id, lessonId: lesson.id, content: v })
      setSaved(true)
    }, 700)
  }
  function toggleBm() {
    const add = !bm
    setBm(add)
    if (p.formationId) toggleLessonBookmark({ formationId: p.formationId, formationSlug: p.formationSlug, formationTitle: p.formationTitle, moduleId: module.id, lessonId: lesson.id, lessonTitle: lesson.title, add }).catch(() => setBm(!add))
  }
  function setV(v: 1 | -1) {
    const next = vote === v ? null : v
    setVote(next)
    if (p.formationId) voteLesson({ formationId: p.formationId, lessonId: lesson.id, vote: next ?? 0 }).catch(() => null)
  }

  const answered = s.kind === 'quiz' ? p.quiz[s.quiz.index] : undefined
  const canContinue = s.kind !== 'quiz' || !!answered

  function next() {
    if (!last) { p.setStep(p.step + 1); return }
    if (p.quizCount === 0) p.onComplete()
    p.onNext()
  }

  const nextLabel = last ? (p.lessonIndex + 1 >= p.totalLessons ? 'Terminer la formation' : 'Leçon suivante') : 'Continuer'

  return (
    <div className="fv-full fv-lesson">
      <div className="fv-top">
        <button type="button" className="fv-x" onClick={p.onClose} aria-label="Fermer la leçon"><X size={20} /></button>
        <span className="fv-prog" aria-label={`Étape ${p.step + 1} sur ${steps.length}`}>
          {steps.map((_, i) => <i key={i} className={i < p.step ? 'd' : i === p.step ? 'n' : ''} />)}
        </span>
        <span className="fv-count">{p.step + 1}/{steps.length}</span>
        <button type="button" className={`fv-x${bm ? ' on' : ''}`} onClick={toggleBm} aria-label={bm ? 'Retirer des favoris' : 'Garder en favori'} aria-pressed={bm}>
          <BookmarkSimple size={19} weight={bm ? 'fill' : 'regular'} />
        </button>
      </div>

      <div className="fv-lesson-grid">
        <div className="fv-stage" ref={stageRef}>
          <div className="fv-stage-in" key={p.step}>
            {s.kind === 'content' && (
              <>
                <span className="fv-k">{p.step === 0 ? `Module ${module.id} · Leçon ${p.lessonIndex + 1} sur ${p.totalLessons}` : lesson.title}</span>
                <h2 className="fv-h">{p.step === 0 ? lesson.title : (s.title ?? lesson.title)}</h2>
                {p.step === 0 && <span className="fv-meta"><Clock size={13} /> {lesson.duration} · {steps.length} étapes{p.quizCount > 0 ? ` · ${p.quizCount} questions` : ''}</span>}
                <LessonContent blocks={s.blocks} quiz={{}} onAnswer={() => {}} action={null} onAction={() => {}} />
              </>
            )}

            {s.kind === 'quiz' && (
              <>
                <span className="fv-k"><Target size={13} weight="fill" /> Vérifie</span>
                <h2 className="fv-h fv-h-q">{s.quiz.question}</h2>
                <div className="fv-opts">
                  {s.quiz.options.map((o, j) => {
                    const cls = !answered ? '' : o.correct ? ' good' : answered.picked === j ? ' bad' : ' dim'
                    return (
                      <button key={j} type="button" className={`fv-opt${cls}`} disabled={!!answered} onClick={() => p.onAnswer(s.quiz.index, j, o.correct)}>
                        {answered && o.correct && <CheckCircle size={20} weight="fill" className="fv-mk g" />}
                        {answered && !o.correct && answered.picked === j && <XCircle size={20} weight="fill" className="fv-mk b" />}
                        <span>{o.text}</span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {s.kind === 'action' && (
              <>
                <span className="fv-act-ic"><Lightning size={26} weight="fill" /></span>
                <LessonContent
                  blocks={[{ ...s.action, href: actionHref(s.action.href) }]}
                  quiz={{}} onAnswer={() => {}}
                  action={p.action}
                  onAction={(t, h, w) => p.onAction(t, h, w)}
                />
              </>
            )}

            {last && (
              <div className="fv-tools">
                {p.done && <span className="fv-done"><CheckCircle size={18} weight="fill" /> Leçon terminée</span>}
                <div className="fv-tools-row">
                  <span className="fv-muted">Cette leçon était claire ?</span>
                  <button type="button" className={`fv-chip${vote === 1 ? ' on' : ''}`} onClick={() => setV(1)}>Oui</button>
                  <button type="button" className={`fv-chip${vote === -1 ? ' on' : ''}`} onClick={() => setV(-1)}>Pas assez</button>
                </div>
                <div className="fv-tools-row">
                  <button type="button" className={`fv-chip${tools === 'notes' ? ' on' : ''}`} onClick={() => setTools(tools === 'notes' ? null : 'notes')}><NotePencil size={14} /> Mes notes</button>
                  <button type="button" className={`fv-chip${tools === 'question' ? ' on' : ''}`} onClick={() => setTools(tools === 'question' ? null : 'question')}><ChatCircle size={14} /> Poser une question</button>
                </div>
                {tools === 'notes' && (
                  <div className="fv-notes">
                    <textarea id={`note-${lesson.id}`} value={note} onChange={e => updateNote(e.target.value)} rows={4} placeholder="Une idée à retenir, une chose à faire pour ton logement…" />
                    {saved && <small className="fv-saved"><Check size={12} weight="bold" /> Enregistré</small>}
                  </div>
                )}
                {tools === 'question' && p.formationId && (
                  <LessonComments formationId={p.formationId} lessonId={lesson.id} currentUserId={p.currentUserId} defaultDisplayName={p.currentUserName ?? undefined} />
                )}
              </div>
            )}
          </div>
        </div>

        <aside className="fv-rail">
          <span className="fv-sec">Cette leçon</span>
          {steps.map((st, i) => (
            <button key={i} type="button" className={`fv-rail-i${i === p.step ? ' on' : ''}${i < p.step ? ' d' : ''}`} onClick={() => p.setStep(i)}>
              <i />{stepLabel(st)}
            </button>
          ))}
          {p.objectif && <><span className="fv-sec" style={{ marginTop: '14px' }}>Ton objectif</span><span className="fv-rail-goal">{p.objectif}</span></>}
          {p.relatedArticles.length > 0 && (
            <>
              <span className="fv-sec" style={{ marginTop: '14px' }}>Approfondir</span>
              {p.relatedArticles.map(a => <a key={a.slug} href={`https://jasonmarinho.com/blog/${a.slug}`} target="_blank" rel="noopener noreferrer" className="fv-rail-i">{a.label}</a>)}
            </>
          )}
        </aside>
      </div>

      {s.kind === 'quiz' && answered ? (
        <div className={`fv-sheet ${answered.correct ? 'ok' : 'ko'}`} role="status" aria-live="polite">
          <div className="fv-sheet-in">
            <span className="fv-sheet-t">{answered.correct ? <><CheckCircle size={24} weight="fill" /> Exact !</> : <><XCircle size={24} weight="fill" /> Pas tout à fait</>}</span>
            {s.quiz.explanation && <p dangerouslySetInnerHTML={{ __html: formatInline(s.quiz.explanation) }} />}
            {!answered.correct && <small>Cette question reviendra dans ta révision, dans 7 jours.</small>}
            <button type="button" className="fv-btn" onClick={next}>{answered.correct ? nextLabel === 'Continuer' ? 'Continuer' : nextLabel : 'J\'ai compris'}</button>
          </div>
        </div>
      ) : (
        <div className="fv-foot">
          <div className="fv-foot-in">
            {p.step > 0 && <button type="button" className="fv-ghost fv-prev" onClick={() => p.setStep(p.step - 1)} aria-label="Étape précédente"><ArrowLeft size={18} /></button>}
            <button type="button" className="fv-btn" disabled={!canContinue} onClick={next}>
              {s.kind === 'quiz' ? 'Choisis une réponse' : nextLabel} {canContinue && <ArrowRight size={17} weight="bold" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────── Fin ─────────────────────────── */

function Fin(p: {
  title: string; objectifs: string[]; objectif: string | null; celebrate: boolean; finished: boolean
  score: { good: number; total: number }; actionsDone: number; actionsTotal: number
  attestationHref: string | null; next: { slug: string; title: string } | null; onClose: () => void
}) {
  if (!p.finished) {
    return (
      <div className="fv-full">
        <div className="fv-top"><button type="button" className="fv-x" onClick={p.onClose} aria-label="Fermer"><X size={20} /></button></div>
        <div className="fv-stage"><div className="fv-stage-in"><h2 className="fv-h">Termine toutes les leçons pour voir ton bilan.</h2></div></div>
      </div>
    )
  }
  return (
    <div className="fv-full fv-fin">
      <div className="fv-top"><button type="button" className="fv-x" onClick={p.onClose} aria-label="Fermer"><X size={20} /></button></div>
      <div className="fv-stage">
        <div className="fv-stage-in fv-fin-in">
          <div className={`fv-burst${p.celebrate ? ' go' : ''}`} aria-hidden="true">
            {Array.from({ length: 22 }).map((_, i) => (
              <i key={i} style={{
                background: i % 3 === 0 ? '#FFD56B' : i % 3 === 1 ? 'var(--accent-text)' : 'var(--success-1)',
                ['--dx' as string]: `${Math.round(Math.cos((i / 22) * Math.PI * 2) * (110 + (i % 4) * 34))}px`,
                ['--dy' as string]: `${Math.round(Math.sin((i / 22) * Math.PI * 2) * (90 + (i % 3) * 30))}px`,
                animationDelay: `${(i % 6) * 45}ms`,
              } as React.CSSProperties} />
            ))}
          </div>
          <span className="fv-medal"><Trophy size={42} weight="fill" /></span>
          <span className="fv-k" style={{ justifyContent: 'center' }}>Formation terminée</span>
          <h2 className="fv-h" style={{ textAlign: 'center' }}>Bravo, tu as terminé « {p.title} »</h2>
          <div className="fv-score">
            {p.score.total > 0 && <div><b>{p.score.good}/{p.score.total}</b><small>bonnes réponses</small></div>}
            {p.actionsTotal > 0 && <div><b>{p.actionsDone}/{p.actionsTotal}</b><small>actions faites</small></div>}
          </div>
          {p.objectif && <p className="fv-fin-goal">Tu voulais : <b>{p.objectif}</b>. Les outils sont maintenant entre tes mains.</p>}
          <span className="fv-sec">Ce que tu sais faire maintenant</span>
          <ul className="fv-can">{p.objectifs.map((o, i) => <li key={i}><CheckCircle size={19} weight="fill" />{o}</li>)}</ul>
        </div>
      </div>
      <div className="fv-foot">
        <div className="fv-foot-in col">
          {p.attestationHref && <Link prefetch={false} href={p.attestationHref} className="fv-btn"><Certificate size={18} weight="fill" /> Voir mon attestation</Link>}
          {p.next && <Link href={`/dashboard/formations/${p.next.slug}`} className="fv-ghost wide">Suite : {p.next.title} <ArrowRight size={15} /></Link>}
        </div>
      </div>
    </div>
  )
}

const CSS = `
.fv { min-height: calc(100svh - var(--header-h)); }
.fv-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px 20px; border-radius: 15px; border: 0; background: var(--accent-text); color: var(--bg); font: inherit; font-size: 15.5px; font-weight: 700; cursor: pointer; text-decoration: none; transition: transform .12s, opacity .15s; }
.fv-btn:active { transform: scale(.98); }
.fv-btn:disabled { opacity: .45; cursor: default; }
.fv-ghost { display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 13px 16px; border-radius: 15px; border: 1px solid var(--border); background: var(--surface); color: var(--text-2); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; }
.fv-ghost.wide { width: 100%; }
.fv-muted { font-size: 13px; color: var(--text-3); line-height: 1.5; margin: 0; }
.fv-sec { display: block; font-size: 11px; letter-spacing: .09em; text-transform: uppercase; font-weight: 700; color: var(--text-muted); }
.fv-mini { display: block; height: 7px; border-radius: 99px; background: var(--surface-2); overflow: hidden; }
.fv-mini i { display: block; height: 100%; border-radius: 99px; background: var(--accent-text); transition: width .4s; }
.fv a:focus-visible, .fv button:focus-visible, .fv input:focus-visible, .fv textarea:focus-visible { outline: 2px solid var(--accent-text); outline-offset: 2px; }

/* Fiche */
.fv-fiche { padding: clamp(16px, 3vw, 28px); display: flex; flex-direction: column; gap: 20px; }
.fv-cover { position: relative; border-radius: 26px; min-height: 230px; padding: 18px 26px 26px; display: flex; flex-direction: column; justify-content: space-between; gap: 14px; overflow: hidden; }
.fv-cover-nav { display: flex; justify-content: space-between; }
.fv-round { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.92); color: #13201B; border: 0; cursor: pointer; text-decoration: none; }
.fv-round.on { background: #FFD56B; }
.fv-cover-tag { align-self: flex-start; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #fff; background: rgba(0,0,0,.24); padding: 5px 11px; border-radius: 99px; }
.fv-cover-t { font-family: var(--font-fraunces), serif; font-weight: 400; font-size: clamp(30px, 3.6vw, 42px); line-height: 1.08; color: #fff; margin: 0; max-width: 18ch; text-shadow: 0 2px 18px rgba(0,0,0,.18); }
.fv-mobile-t { display: none; }
.fv-fiche-grid { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 24px; align-items: start; }
.fv-fiche-main { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.fv-fiche-side { position: sticky; top: calc(var(--header-h) + 16px); }
.fv-panel { display: flex; flex-direction: column; gap: 12px; padding: 18px; border-radius: 20px; background: var(--surface); border: 1px solid var(--border); }
.fv-metas { display: flex; gap: 14px; flex-wrap: wrap; font-size: 13px; color: var(--text-3); }
.fv-metas span { display: inline-flex; align-items: center; gap: 5px; }
.fv-metas.small { font-size: 12px; gap: 10px; }
.fv-promise { font-size: 16.5px; line-height: 1.6; color: var(--text-2); margin: 0; max-width: 62ch; }
.fv-goalcard { display: flex; flex-direction: column; gap: 8px; padding: 14px 16px; border-radius: 16px; background: var(--surface); border: 1px solid var(--border); }
.fv-goalrow { display: flex; justify-content: space-between; gap: 10px; font-size: 13.5px; color: var(--text-2); }
.fv-goalrow b { color: var(--text); }
.fv-done-banner { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 18px; border: 1px solid var(--accent-border); background: var(--accent-bg); color: var(--text); font: inherit; text-align: left; cursor: pointer; }
.fv-done-banner b { display: block; font-size: 15px; }
.fv-done-banner small { display: block; font-size: 12.5px; color: var(--text-2); }
.fv-done-banner > span:nth-child(2) { flex: 1; }
.fv-medal-s { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; flex-shrink: 0; color: #3A2A00; background: radial-gradient(circle at 35% 30%, #FFF1C4, #FFD56B 55%, #E5B53F); }
.fv-can { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 9px; }
.fv-can li { display: flex; gap: 10px; align-items: flex-start; font-size: 15px; color: var(--text-2); line-height: 1.45; }
.fv-can li svg { flex-shrink: 0; margin-top: 1px; color: var(--success-1); }
.fv-mods { display: flex; flex-direction: column; border-radius: 18px; background: var(--surface); border: 1px solid var(--border); overflow: hidden; }
.fv-mod { border-bottom: 1px solid var(--border); }
.fv-mod:last-child { border-bottom: 0; }
.fv-mod.cur { background: var(--accent-bg); }
.fv-mod-h { width: 100%; display: flex; align-items: center; gap: 12px; padding: 13px 14px; border: 0; background: none; font: inherit; color: var(--text-2); text-align: left; cursor: pointer; }
.fv-mod-m { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.fv-mod-m b { font-size: 14.5px; color: var(--text); line-height: 1.3; }
.fv-mod-m small { font-size: 12px; color: var(--text-3); }
.fv-nd { width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0; display: grid; place-items: center; font-weight: 700; font-size: 12.5px; color: var(--text-3); box-shadow: inset 0 0 0 2px var(--border); }
.fv-nd.d { background: var(--accent-text); color: var(--bg); box-shadow: none; }
.fv-nd.n { color: var(--accent-text); box-shadow: inset 0 0 0 2px var(--accent-text); }
.fv-mod-l { display: flex; flex-direction: column; padding: 0 12px 10px 54px; }
.fv-mod-lesson { display: flex; gap: 10px; align-items: center; padding: 9px 4px; border: 0; background: none; font: inherit; font-size: 13.5px; color: var(--text-2); text-align: left; cursor: pointer; border-radius: 9px; }
.fv-mod-lesson small { font-size: 11.5px; color: var(--text-muted); }
.fv-dot { width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; display: grid; place-items: center; box-shadow: inset 0 0 0 1.5px var(--border); color: var(--bg); }
.fv-dot.d { background: var(--success-1); box-shadow: none; }
.fv-cov { width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0; }
.fv-sticky { display: none; }

/* Plein écran (bilan, leçon, fin) */
.fv-full { display: flex; flex-direction: column; min-height: calc(100svh - var(--header-h)); background: var(--bg); }
.fv-top { position: sticky; top: var(--header-h); z-index: 5; display: flex; align-items: center; gap: 12px; padding: 12px clamp(16px, 3vw, 32px); background: var(--bg); border-bottom: 1px solid var(--border); }
.fv-x { width: 38px; height: 38px; flex-shrink: 0; border-radius: 50%; display: grid; place-items: center; border: 0; background: none; color: var(--text-2); cursor: pointer; }
.fv-x.on { color: var(--accent-text); }
.fv-prog { flex: 1; display: flex; gap: 4px; max-width: 620px; }
.fv-prog i { flex: 1; height: 7px; border-radius: 99px; background: var(--surface-2); transition: background .3s; }
.fv-prog i.d { background: var(--accent-text); }
.fv-prog i.n { background: linear-gradient(90deg, var(--accent-text) 50%, var(--surface-2) 50%); }
.fv-count { font-size: 12.5px; font-weight: 700; color: var(--text-3); font-variant-numeric: tabular-nums; }
.fv-lesson-grid { flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) 250px; gap: 24px; padding: 0 clamp(16px, 3vw, 32px); }
.fv-stage { flex: 1; display: flex; justify-content: center; padding: 32px 0 24px; }
.fv-full > .fv-stage { padding: 32px clamp(16px, 3vw, 32px) 24px; }
.fv-stage-in { width: 100%; max-width: 660px; display: flex; flex-direction: column; gap: 16px; animation: fvStep .3s ease both; }
@keyframes fvStep { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: none; } }
.fv-k { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; letter-spacing: .09em; text-transform: uppercase; font-weight: 700; color: var(--accent-text); }
.fv-h { font-family: var(--font-fraunces), serif; font-weight: 400; font-size: clamp(26px, 3.2vw, 36px); line-height: 1.15; color: var(--text); margin: 0; }
.fv-h-q { font-size: clamp(22px, 2.6vw, 28px); }
.fv-meta { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-3); }
.fv-opts { display: flex; flex-direction: column; gap: 10px; }
.fv-opt { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 15px 16px; border-radius: 16px; border: 1.5px solid var(--border); background: var(--surface); color: var(--text); font: inherit; font-size: 15.5px; line-height: 1.4; cursor: pointer; transition: border .15s, background .15s, transform .12s; }
.fv-opt:hover:not(:disabled) { border: 1.5px solid var(--accent-border); }
.fv-opt:active:not(:disabled) { transform: scale(.99); }
.fv-opt.sel { border: 2px solid var(--accent-text); background: var(--accent-bg); font-weight: 600; }
.fv-opt.good { border: 2px solid var(--success-1); background: var(--success-bg); font-weight: 600; }
.fv-opt.bad { border: 2px solid var(--danger); background: var(--danger-bg); }
.fv-opt.dim { opacity: .45; }
.fv-opt:disabled { cursor: default; }
.fv-mk { flex-shrink: 0; }
.fv-mk.g { color: var(--success-1); }
.fv-mk.b { color: var(--danger); }
.fv-input { width: 100%; padding: 14px 16px; border-radius: 14px; border: 1.5px solid var(--border); background: var(--surface); color: var(--text); font: inherit; font-size: 15px; }
.fv-act-ic { width: 54px; height: 54px; border-radius: 17px; display: grid; place-items: center; background: rgba(255,213,107,.18); color: #FFD56B; }
[data-theme=light] .fv-act-ic { color: #8A6A10; }
.fv-foot { position: sticky; bottom: 0; z-index: 5; padding: 14px clamp(16px, 3vw, 32px) calc(14px + env(safe-area-inset-bottom)); background: linear-gradient(180deg, transparent, var(--bg) 26%); }
.fv-foot-in { max-width: 660px; margin: 0 auto; display: flex; gap: 10px; }
.fv-foot-in.col { flex-direction: column; }
.fv-prev { width: 52px; flex-shrink: 0; padding: 0; }
.fv-sheet { position: sticky; bottom: 0; z-index: 6; border-radius: 26px 26px 0 0; padding: 20px clamp(16px, 3vw, 32px) calc(18px + env(safe-area-inset-bottom)); animation: fvSheet .28s cubic-bezier(.2,.9,.3,1) both; }
.fv-sheet.ok { background: var(--success-bg); border-top: 2px solid var(--success-border); }
.fv-sheet.ko { background: var(--danger-bg); border-top: 2px solid var(--danger-border); }
.fv-sheet-in { max-width: 660px; margin: 0 auto; display: flex; flex-direction: column; gap: 10px; }
.fv-sheet-t { display: flex; align-items: center; gap: 9px; font-family: var(--font-fraunces), serif; font-size: 22px; }
.fv-sheet.ok .fv-sheet-t { color: var(--success-1); }
.fv-sheet.ko .fv-sheet-t { color: var(--danger); }
.fv-sheet p { margin: 0; font-size: 15px; line-height: 1.55; color: var(--text); }
.fv-sheet small { font-size: 12.5px; color: var(--text-2); }
.fv-sheet.ok .fv-btn { background: var(--success-1); }
.fv-sheet.ko .fv-btn { background: var(--danger); }
@keyframes fvSheet { from { transform: translateY(100%); } to { transform: none; } }
.fv-tools { margin-top: 12px; padding-top: 16px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 10px; }
.fv-tools-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.fv-done { display: inline-flex; align-items: center; gap: 7px; font-size: 14px; font-weight: 600; color: var(--success-1); }
.fv-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 13px; border-radius: 99px; border: 1px solid var(--border); background: var(--surface); color: var(--text-2); font: inherit; font-size: 13px; cursor: pointer; }
.fv-chip.on { border: 1px solid var(--accent-border); background: var(--accent-bg); color: var(--accent-text); font-weight: 600; }
.fv-notes { display: flex; flex-direction: column; gap: 6px; }
.fv-notes textarea { width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 14px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font: inherit; font-size: 14px; line-height: 1.55; resize: vertical; }
.fv-saved { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--success-1); font-weight: 600; }
.fv-rail { display: flex; flex-direction: column; gap: 4px; padding: 32px 0 24px 20px; border-left: 1px solid var(--border); align-self: start; position: sticky; top: calc(var(--header-h) + 64px); }
.fv-rail .fv-sec { margin-bottom: 6px; }
.fv-rail-i { display: flex; align-items: center; gap: 9px; padding: 7px 10px; border-radius: 10px; border: 0; background: none; font: inherit; font-size: 13px; color: var(--text-2); text-align: left; cursor: pointer; text-decoration: none; }
.fv-rail-i i { width: 8px; height: 8px; border-radius: 50%; background: var(--border); flex-shrink: 0; }
.fv-rail-i.d i { background: var(--accent-text); }
.fv-rail-i.on { background: var(--accent-bg); color: var(--accent-text); font-weight: 600; }
.fv-rail-i.on i { background: var(--accent-text); }
.fv-rail-goal { font-size: 13px; color: var(--text); padding: 0 10px; }

/* Fin */
.fv-fin-in { align-items: center; text-align: center; position: relative; }
.fv-fin-in .fv-can { align-self: stretch; text-align: left; }
.fv-fin-in .fv-sec { align-self: stretch; text-align: left; margin-top: 6px; }
.fv-medal { width: 104px; height: 104px; border-radius: 50%; display: grid; place-items: center; color: #3A2A00; background: radial-gradient(circle at 35% 30%, #FFF4CF, #FFD56B 55%, #E2AE36); box-shadow: 0 14px 34px -12px rgba(226,174,54,.8), 0 0 0 12px rgba(255,213,107,.16); animation: fvMedal .75s cubic-bezier(.2,1.4,.4,1) both; }
@keyframes fvMedal { from { transform: scale(.35) rotate(-14deg); opacity: 0; } to { transform: none; opacity: 1; } }
.fv-burst { position: absolute; left: 50%; top: 52px; width: 0; height: 0; pointer-events: none; }
.fv-burst i { position: absolute; width: 8px; height: 12px; border-radius: 2px; opacity: 0; }
.fv-burst.go i { animation: fvBurst 1.5s ease-out both; }
@keyframes fvBurst { 0% { opacity: 1; transform: translate(0, 0) rotate(0); } 100% { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(260deg); } }
.fv-score { display: flex; gap: 10px; justify-content: center; width: 100%; }
.fv-score div { flex: 1; max-width: 200px; padding: 14px; border-radius: 16px; background: var(--surface); border: 1px solid var(--border); }
.fv-score b { display: block; font-family: var(--font-fraunces), serif; font-weight: 500; font-size: 28px; color: var(--text); }
.fv-score small { font-size: 12px; color: var(--text-3); }
.fv-fin-goal { margin: 0; font-size: 15px; color: var(--text-2); }
.fv-fin-goal b { color: var(--text); }

@media (max-width: 1000px) {
  .fv-fiche-grid { grid-template-columns: minmax(0, 1fr); }
  .fv-lesson-grid { grid-template-columns: minmax(0, 1fr); }
  .fv-rail { display: none; }
}
@media (max-width: 767px) {
  .fv-fiche { padding: 0 0 calc(110px + env(safe-area-inset-bottom)); gap: 0; }
  .fv-cover { border-radius: 0; min-height: 200px; padding: 14px 16px 34px; }
  .fv-cover-t { display: none; }
  .fv-fiche-grid { display: block; margin-top: -20px; position: relative; background: var(--bg); border-radius: 22px 22px 0 0; padding: 18px 16px 0; }
  .fv-mobile-t { display: block; font-family: var(--font-fraunces), serif; font-weight: 400; font-size: 27px; line-height: 1.12; color: var(--text); margin: 0; }
  .fv-fiche-side { display: none; }
  .fv-sticky { display: flex; flex-direction: column; gap: 6px; position: fixed; left: 0; right: 0; bottom: 0; z-index: 30; padding: 14px 16px calc(14px + env(safe-area-inset-bottom)); background: linear-gradient(180deg, transparent, var(--bg) 30%); }
  .fv-sticky small { text-align: center; font-size: 12px; color: var(--text-3); }
  .fv-full { position: fixed; inset: 0; z-index: 120; min-height: 0; overflow-y: auto; }
  .fv-top { top: 0; padding-top: calc(10px + env(safe-area-inset-top)); border-bottom: 0; }
  .fv-lesson-grid { padding: 0 20px; }
  .fv-full > .fv-stage { padding: 12px 20px 24px; }
  .fv-stage { padding: 12px 0 24px; }
  .fv-foot { margin-top: auto; }
  .fv-sheet { margin-top: auto; }
}
@media (prefers-reduced-motion: reduce) {
  .fv-stage-in, .fv-sheet, .fv-medal { animation: none; }
  .fv-burst { display: none; }
}
`
