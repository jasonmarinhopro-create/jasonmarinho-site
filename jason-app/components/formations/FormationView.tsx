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
  Coins, CalendarBlank, Camera, GoogleLogo, Star, ChatsCircle, FileText, Scales, Calculator,
  ShieldCheck, House, Broom, InstagramLogo, ChartLineUp, Wrench, Key, UsersThree, Lightbulb,
  Warning, PencilSimpleLine, Crosshair, MapPin, Wallet, Play,
} from '@phosphor-icons/react/dist/ssr'
import { stepTheme, type Theme } from '@/lib/formations/illustration'
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
          cover={cover}
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
  const curModule = p.resume && started ? f.modules.find(m => m.lessons.some(l => l.id === p.resume!.lessonId))?.id : null

  // Ce que contient la formation (questions, actions par module, aperçu de la 1re leçon)
  const info = useMemo(() => {
    let quiz = 0
    const moduleAction: Record<number, string> = {}
    let bref: string[] = []
    let firstQuiz: { question: string; options: string[] } | null = null
    f.modules.forEach((m, mi) => m.lessons.forEach((l, li) => {
      const bs = parseLesson(l.content)
      for (const x of bs) {
        if (x.type === 'quiz') {
          quiz++
          if (!firstQuiz && mi === 0 && li === 0) firstQuiz = { question: x.question, options: [x.options.find(o => o.correct)!.text, ...x.options.filter(o => !o.correct).map(o => o.text)].slice(0, 2) }
        }
        if (x.type === 'action') moduleAction[m.id] = x.title
        if (x.type === 'bref' && mi === 0 && li === 0) bref = x.items.slice(0, 3)
      }
    }))
    return { quiz, moduleAction, bref, firstQuiz: firstQuiz as { question: string; options: string[] } | null }
  }, [f])
  const first = f.modules[0]?.lessons[0]

  const start = () => (p.finished ? p.onLesson(f.modules[0].lessons[0].id) : p.onStart())
  const cta = (
    <button type="button" className="fv-btn" onClick={start}>
      {ctaLabel}{nextDur && !p.finished ? ` · ${nextDur}` : ''}
    </button>
  )
  const strip = (t: string) => t.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')

  return (
    <div className="fv-fiche fx">
      <InlineStyle css={FX_CSS} />
      <section className="fx-hero" style={{ background: p.cover }}>
        <div className="fx-hero-shade" aria-hidden="true" />
        <div className="fx-hero-in">
          <div className="fx-hero-l">
            <div className="fv-cover-nav">
              <Link href="/dashboard/formations" className="fv-round" aria-label="Toutes les formations"><ArrowLeft size={17} weight="bold" /></Link>
              <button type="button" className={`fv-round fx-mob-only${p.favorite ? ' on' : ''}`} onClick={p.onFav} aria-label={p.favorite ? 'Retirer des favoris' : 'Garder en favori'} aria-pressed={p.favorite}>
                <BookmarkSimple size={17} weight={p.favorite ? 'fill' : 'bold'} />
              </button>
            </div>
            <span className="fv-cover-tag">{objectifLabel(p.slug)} · {f.level}</span>
            <h1 className="fx-title">{f.title}</h1>
            <p className="fx-lead">{f.description}</p>
            <div className="fx-chips">
              <span><Clock size={14} weight="bold" /> {f.duration}</span>
              <span><BookOpen size={14} weight="bold" /> {p.total} leçons</span>
              {info.quiz > 0 && <span><Target size={14} weight="bold" /> {info.quiz} questions</span>}
              {p.actionsTotal > 0 && <span><Lightning size={14} weight="fill" /> {p.actionsTotal} actions</span>}
              <span><Certificate size={14} weight="fill" /> Attestation</span>
            </div>
            <div className="fx-cta">
              <button type="button" className="fx-ybtn" onClick={start}>
                {started && !p.finished ? <ArrowRight size={17} weight="bold" /> : <Play size={16} weight="fill" />}
                {ctaLabel}{nextDur && !p.finished ? ` · ${nextDur}` : ''}
              </button>
              <a href="#programme" className="fx-ghost">Voir le programme</a>
            </div>
            {started && (
              <div className="fx-prog">
                <span className="fx-prog-bar"><i style={{ width: `${p.progress}%` }} /></span>
                <b>{p.progress} %</b>
              </div>
            )}
          </div>

          {first && (
            <div className="fx-preview" aria-hidden="true">
              <div className="fx-pv-top"><i className="d" /><i className="n" /><i /><i /><i /></div>
              <span className="fx-pv-k">Leçon 1 · {first.duration}</span>
              <b className="fx-pv-t">{first.title}</b>
              {info.bref.length > 0 && (
                <div className="fx-pv-bref">
                  <span>En bref</span>
                  <ol>{info.bref.map((x, i) => <li key={i}>{strip(x)}</li>)}</ol>
                </div>
              )}
              {info.firstQuiz && (
                <div className="fx-pv-quiz">
                  <span><Target size={11} weight="fill" /> Vérifie</span>
                  <b>{info.firstQuiz.question}</b>
                  {info.firstQuiz.options.map((o, i) => <em key={i} className={i === 0 ? 'on' : ''}>{o}</em>)}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="fx-grid">
        <div className="fx-main">
          <h1 className="fv-mobile-t">{f.title}</h1>

          {p.finished && (
            <button type="button" className="fv-done-banner" onClick={p.onFin}>
              <span className="fv-medal-s"><Trophy size={18} weight="fill" /></span>
              <span><b>Formation terminée</b><small>{p.score.total > 0 ? `${p.score.good}/${p.score.total} bonnes réponses · ` : ''}Voir le bilan et l&apos;attestation</small></span>
              <ArrowRight size={16} weight="bold" />
            </button>
          )}

          <section>
            <h2 className="fx-h">Ce que tu sauras faire</h2>
            <div className="fx-can">
              {f.objectifs.map((o, i) => (
                <div key={i} className="fx-can-i" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className="fx-can-n"><CheckCircle size={20} weight="fill" /></span>
                  <span>{o}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="fx-h">Comment tu vas apprendre</h2>
            <div className="fx-how">
              <div><span className="fx-how-ic"><BookOpen size={20} weight="duotone" /></span><b>Lire l&apos;essentiel</b><small>Des leçons courtes qui commencent par « En bref »</small></div>
              <div><span className="fx-how-ic"><Target size={20} weight="duotone" /></span><b>Vérifier</b><small>{info.quiz > 0 ? `${info.quiz} questions pour ancrer ce que tu lis` : 'Des questions pour ancrer ce que tu lis'}</small></div>
              <div><span className="fx-how-ic"><Lightning size={20} weight="duotone" /></span><b>Passer à l&apos;action</b><small>{p.actionsTotal > 0 ? `${p.actionsTotal} actions à faire dans l'app` : 'Une action concrète à chaque étape'}</small></div>
              <div><span className="fx-how-ic"><Certificate size={20} weight="duotone" /></span><b>Ton attestation</b><small>À ton nom, à ajouter à ton profil LinkedIn</small></div>
            </div>
          </section>

          <section id="programme" className="fx-anchor">
            <h2 className="fx-h">Programme <small>{f.modules.length} modules · {p.total} leçons</small></h2>
            <div className="fx-tl">
              {f.modules.map(m => {
                const doneN = m.lessons.filter(l => p.completed.includes(l.id)).length
                const allDone = doneN === m.lessons.length
                const isCur = m.id === curModule && !p.finished
                const isOpen = open === m.id || (open === null && (isCur || (!started && m.id === f.modules[0].id)))
                const act = info.moduleAction[m.id]
                return (
                  <div key={m.id} className={`fx-mod${isCur ? ' cur' : ''}${allDone ? ' done' : ''}`}>
                    <span className="fx-mod-n">{allDone ? <Check size={16} weight="bold" /> : m.id}</span>
                    <div className="fx-mod-card">
                      <button type="button" className="fx-mod-h" onClick={() => setOpen(isOpen ? -1 : m.id)} aria-expanded={isOpen}>
                        <span className="fx-mod-m">
                          <small className="fx-mod-k">Module {m.id}{isCur ? ' · en cours' : allDone ? ' · terminé' : ''}</small>
                          <b>{m.title}</b>
                          <small>{m.lessons.length} leçon{m.lessons.length > 1 ? 's' : ''} · {m.duration}{doneN > 0 && !allDone ? ` · ${doneN} faite${doneN > 1 ? 's' : ''}` : ''}</small>
                        </span>
                        <span className="fx-mod-bar" aria-hidden="true"><i style={{ width: `${Math.round((doneN / m.lessons.length) * 100)}%` }} /></span>
                        <CaretDown size={15} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }} />
                      </button>
                      {isOpen && (
                        <div className="fx-mod-l">
                          {m.lessons.map(l => {
                            const d = p.completed.includes(l.id)
                            return (
                              <button key={l.id} type="button" onClick={() => p.onLesson(l.id)} className={`fx-les${d ? ' d' : ''}`}>
                                <span className="fx-les-ic">{d ? <Check size={11} weight="bold" /> : <Play size={10} weight="fill" />}</span>
                                <span style={{ flex: 1, minWidth: 0 }}>{l.title}</span>
                                <small>{l.duration}</small>
                              </button>
                            )
                          })}
                        </div>
                      )}
                      {act && (
                        <div className={`fx-mod-act${p.actions[m.id]?.when === 'done' ? ' d' : ''}`}>
                          <Lightning size={14} weight="fill" />
                          <span><b>{p.actions[m.id]?.when === 'done' ? 'Action faite' : 'Action du module'}</b> · {act}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {p.recommendedNext.length > 0 && (
            <section>
              <h2 className="fx-h">{p.finished ? 'Pour aller plus loin' : 'Va bien avec'}</h2>
              <div className="fx-next">
                {p.recommendedNext.slice(0, 3).map(r => (
                  <Link key={r.slug} href={`/dashboard/formations/${r.slug}`} className="fx-next-c">
                    <span className="fx-next-cov" style={{ background: coverBackground(r.slug, 0.6) }} />
                    <span className="fx-next-b"><small>{objectifLabel(r.slug)}</small><b>{r.title}</b>{r.reason && <em>{r.reason}</em>}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="fx-side">
          <div className="fx-panel">
            <div className="fx-ring" style={{ ['--p' as string]: `${p.progress}` }}>
              <b>{p.progress} %</b><small>{p.finished ? 'terminée' : started ? 'fait' : 'à découvrir'}</small>
            </div>
            {p.objectif && <div className="fx-obj"><Target size={14} weight="fill" /> {p.objectif}</div>}
            {cta}
            {ctaSub && <small className="fv-muted" style={{ textAlign: 'center' }}>{ctaSub}</small>}
            <div className="fx-side-stats">
              <span><b>{p.completed.length}/{p.total}</b><small>leçons</small></span>
              <span><b>{p.actionsDone}/{p.actionsTotal}</b><small>actions</small></span>
              <span><b>{p.score.total > 0 ? `${Math.round((p.score.good / p.score.total) * 100)} %` : '-'}</b><small>réussite</small></span>
            </div>
            <button type="button" className={`fx-fav${p.favorite ? ' on' : ''}`} onClick={p.onFav} aria-pressed={p.favorite}>
              <BookmarkSimple size={15} weight={p.favorite ? 'fill' : 'regular'} /> {p.favorite ? 'Dans tes favoris' : 'Garder en favori'}
            </button>
          </div>
          <div className="fx-cert" aria-hidden="true">
            <span className="fx-cert-k">Attestation de suivi</span>
            <b>{f.title}</b>
            <small>Délivrée à ton nom quand tu termines la formation</small>
            <span className="fx-cert-seal"><Certificate size={20} weight="fill" /></span>
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

const FX_CSS = `
.fx { gap: 26px; }
@media (max-width: 767px) { .fx { gap: 0; } }
.fx-hero { position: relative; border-radius: 28px; overflow: hidden; min-height: 400px; display: flex; }
.fx-hero-shade { position: absolute; inset: 0; background: linear-gradient(100deg, rgba(0,30,24,.78) 0%, rgba(0,30,24,.55) 45%, rgba(0,30,24,.10) 100%); }
.fx-hero-in { position: relative; flex: 1; display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(280px, .75fr); gap: 32px; align-items: center; padding: 22px clamp(22px, 3vw, 40px) clamp(26px, 3vw, 40px); }
.fx-hero-l { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.fx-hero-l .fv-cover-nav { margin-bottom: 4px; }
.fx-title { font-family: var(--font-fraunces), serif; font-weight: 400; font-size: clamp(32px, 3.6vw, 52px); line-height: 1.05; letter-spacing: -.5px; color: #fff; margin: 0; max-width: 20ch; }
.fx-lead { margin: 0; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,.88); max-width: 58ch; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.fx-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.fx-chips span { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: rgba(255,255,255,.14); color: #fff; font-size: 12.5px; font-weight: 600; box-shadow: inset 0 0 0 1px rgba(255,255,255,.18); }
.fx-cta { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 6px; }
.fx-ybtn { display: inline-flex; align-items: center; gap: 9px; padding: 15px 26px; border-radius: 16px; border: 0; background: #FFD56B; color: #2A2100; font: inherit; font-weight: 700; font-size: 15.5px; cursor: pointer; box-shadow: 0 14px 30px -14px rgba(255,213,107,.8); transition: transform .15s, box-shadow .15s; }
.fx-ybtn:hover { transform: translateY(-2px); box-shadow: 0 18px 36px -14px rgba(255,213,107,.9); }
.fx-ghost { display: inline-flex; align-items: center; padding: 14px 20px; border-radius: 16px; color: #fff; font-weight: 600; font-size: 14.5px; text-decoration: none; box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.45); }
.fx-ghost:hover { background: rgba(255,255,255,.1); }
.fx-prog { display: flex; align-items: center; gap: 12px; max-width: 420px; }
.fx-prog-bar { flex: 1; height: 8px; border-radius: 99px; background: rgba(255,255,255,.22); overflow: hidden; }
.fx-prog-bar i { display: block; height: 100%; background: #FFD56B; border-radius: 99px; }
.fx-prog b { color: #fff; font-size: 14px; }
.fx-preview { justify-self: end; width: 100%; max-width: 340px; border-radius: 22px; padding: 16px; background: var(--bg); color: var(--text); box-shadow: 0 30px 60px -28px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.12); transform: rotate(2deg); animation: fxFloat 6s ease-in-out infinite; display: flex; flex-direction: column; gap: 10px; }
@keyframes fxFloat { 0%, 100% { transform: rotate(2deg) translateY(0); } 50% { transform: rotate(2deg) translateY(-8px); } }
.fx-pv-top { display: flex; gap: 4px; }
.fx-pv-top i { flex: 1; height: 5px; border-radius: 99px; background: var(--surface-2); }
.fx-pv-top i.d { background: var(--accent-text); }
.fx-pv-top i.n { background: linear-gradient(90deg, var(--accent-text) 50%, var(--surface-2) 50%); }
.fx-pv-k { font-size: 10.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-text); }
.fx-pv-t { font-family: var(--font-fraunces), serif; font-weight: 400; font-size: 19px; line-height: 1.2; }
.fx-pv-bref { border-radius: 14px; padding: 11px 13px; background: var(--accent-bg); border: 1px solid var(--accent-border); }
.fx-pv-bref span { display: block; font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-text); margin-bottom: 6px; }
.fx-pv-bref ol { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; line-height: 1.45; color: var(--text); }
.fx-pv-quiz { display: flex; flex-direction: column; gap: 6px; border-radius: 14px; padding: 11px 13px; border: 1.5px solid var(--accent-border); }
.fx-pv-quiz span { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-text); }
.fx-pv-quiz b { font-size: 13px; line-height: 1.35; }
.fx-pv-quiz em { font-style: normal; font-size: 12px; padding: 7px 10px; border-radius: 10px; background: var(--surface); border: 1px solid var(--border); color: var(--text-2); }
.fx-pv-quiz em.on { border: 1.5px solid var(--success-1); background: var(--success-bg); color: var(--text); }
.fx-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 32px; align-items: start; }
.fx-main { display: flex; flex-direction: column; gap: 34px; min-width: 0; }
.fx-main section { display: flex; flex-direction: column; gap: 14px; }
.fx-h { margin: 0; font-family: var(--font-fraunces), serif; font-weight: 400; font-size: clamp(22px, 2vw, 28px); color: var(--text); display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.fx-h small { font-family: inherit; font-size: 13px; color: var(--text-3); font-weight: 500; }
.fx-anchor { scroll-margin-top: calc(var(--header-h) + 16px); }
.fx-can { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 10px; }
.fx-can-i { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: 16px; background: var(--surface); border: 1px solid var(--border); font-size: 14.5px; line-height: 1.5; color: var(--text); animation: fxIn .4s ease both; }
.fx-can-n { color: var(--success-1); flex-shrink: 0; margin-top: 1px; }
@keyframes fxIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.fx-how { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; counter-reset: h; }
.fx-how div { position: relative; display: flex; flex-direction: column; gap: 6px; padding: 16px; border-radius: 18px; background: linear-gradient(160deg, var(--surface), var(--bg)); border: 1px solid var(--border); }
.fx-how div::after { counter-increment: h; content: counter(h); position: absolute; top: 12px; right: 14px; font-family: var(--font-fraunces), serif; font-size: 28px; line-height: 1; color: var(--border); }
.fx-how-ic { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; background: var(--accent-bg); color: var(--accent-text); margin-bottom: 4px; }
.fx-how b { font-size: 14.5px; color: var(--text); }
.fx-how small { font-size: 12.5px; color: var(--text-3); line-height: 1.45; }
.fx-tl { display: flex; flex-direction: column; }
.fx-mod { position: relative; display: flex; gap: 16px; padding-bottom: 14px; }
.fx-mod::before { content: ""; position: absolute; left: 21px; top: 46px; bottom: 0; width: 2px; background: var(--border); }
.fx-mod:last-child::before { display: none; }
.fx-mod.done::before { background: var(--accent-text); }
.fx-mod-n { width: 44px; height: 44px; border-radius: 14px; flex-shrink: 0; display: grid; place-items: center; font-family: var(--font-fraunces), serif; font-size: 19px; background: var(--surface); border: 1px solid var(--border); color: var(--text-2); }
.fx-mod.done .fx-mod-n { background: var(--accent-text); border: 1px solid var(--accent-text); color: var(--bg); }
.fx-mod.cur .fx-mod-n { background: #FFD56B; border: 1px solid #FFD56B; color: #2A2100; box-shadow: 0 0 0 5px rgba(255,213,107,.22); }
.fx-mod-card { flex: 1; min-width: 0; border-radius: 18px; background: var(--surface); border: 1px solid var(--border); overflow: hidden; transition: border .15s, box-shadow .15s; }
.fx-mod-card:hover { border: 1px solid var(--accent-border); }
.fx-mod.cur .fx-mod-card { border: 1px solid var(--accent-border); box-shadow: 0 18px 36px -28px rgba(0,60,45,.8); }
.fx-mod-h { width: 100%; display: flex; align-items: center; gap: 14px; padding: 14px 16px; border: 0; background: none; font: inherit; color: var(--text-2); text-align: left; cursor: pointer; }
.fx-mod-m { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.fx-mod-k { font-size: 10.5px !important; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-text) !important; }
.fx-mod-m b { font-size: 15.5px; color: var(--text); line-height: 1.3; }
.fx-mod-m small { font-size: 12.5px; color: var(--text-3); }
.fx-mod-bar { width: 90px; height: 6px; border-radius: 99px; background: var(--surface-2); overflow: hidden; flex-shrink: 0; }
.fx-mod-bar i { display: block; height: 100%; background: var(--accent-text); }
.fx-mod-l { display: flex; flex-direction: column; padding: 0 12px 10px; border-top: 1px solid var(--border); }
.fx-les { display: flex; gap: 12px; align-items: center; padding: 10px 6px; border: 0; background: none; font: inherit; font-size: 14px; color: var(--text-2); text-align: left; cursor: pointer; border-radius: 10px; }
.fx-les:hover { background: var(--accent-bg); color: var(--text); }
.fx-les small { font-size: 12px; color: var(--text-muted); white-space: nowrap; }
.fx-les-ic { width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0; display: grid; place-items: center; background: var(--surface-2); color: var(--text-3); }
.fx-les.d .fx-les-ic { background: var(--accent-text); color: var(--bg); }
.fx-mod-act { display: flex; align-items: flex-start; gap: 8px; padding: 10px 16px; font-size: 13px; line-height: 1.45; color: var(--text-2); background: rgba(255,213,107,.10); border-top: 1px dashed rgba(229,181,63,.45); }
.fx-mod-act svg { color: #E5B53F; flex-shrink: 0; margin-top: 2px; }
.fx-mod-act b { color: var(--text); }
.fx-mod-act.d { background: var(--success-bg); }
.fx-mod-act.d svg { color: var(--success-1); }
.fx-next { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 12px; }
.fx-next-c { display: flex; flex-direction: column; border-radius: 18px; overflow: hidden; background: var(--surface); border: 1px solid var(--border); text-decoration: none; transition: transform .2s, box-shadow .2s; }
.fx-next-c:hover { transform: translateY(-3px); box-shadow: 0 18px 36px -24px rgba(0,0,0,.45); }
.fx-next-cov { display: block; height: 96px; }
.fx-next-b { display: flex; flex-direction: column; gap: 3px; padding: 12px 14px 14px; }
.fx-next-b small { font-size: 10.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--accent-text); }
.fx-next-b b { font-size: 14px; color: var(--text); line-height: 1.3; }
.fx-next-b em { font-style: normal; font-size: 12px; color: var(--text-3); }
.fx-side { position: sticky; top: calc(var(--header-h) + 16px); display: flex; flex-direction: column; gap: 14px; }
.fx-panel { display: flex; flex-direction: column; align-items: stretch; gap: 12px; padding: 20px; border-radius: 22px; background: var(--surface); border: 1px solid var(--border); box-shadow: 0 24px 48px -36px rgba(0,0,0,.5); }
.fx-ring { --p: 0; position: relative; align-self: center; width: 118px; height: 118px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.fx-ring::before { content: ""; position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(var(--accent-text) calc(var(--p) * 1%), var(--surface-2) 0); -webkit-mask: radial-gradient(closest-side, transparent 80%, #000 81%); mask: radial-gradient(closest-side, transparent 80%, #000 81%); }
.fx-ring b { font-family: var(--font-fraunces), serif; font-weight: 500; font-size: 26px; color: var(--text); line-height: 1; }
.fx-ring small { font-size: 11.5px; color: var(--text-3); margin-top: 3px; }
.fx-obj { display: flex; gap: 7px; align-items: flex-start; font-size: 13px; line-height: 1.4; color: var(--text-2); padding: 9px 11px; border-radius: 12px; background: var(--accent-bg); }
.fx-obj svg { color: var(--accent-text); flex-shrink: 0; margin-top: 2px; }
.fx-side-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
.fx-side-stats span { display: flex; flex-direction: column; align-items: center; padding: 9px 4px; border-radius: 12px; background: var(--surface-2); }
.fx-side-stats b { font-size: 15px; color: var(--text); }
.fx-side-stats small { font-size: 11px; color: var(--text-3); }
.fx-fav { display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 10px; border-radius: 12px; border: 1px solid var(--border); background: none; font: inherit; font-size: 13.5px; font-weight: 600; color: var(--text-2); cursor: pointer; }
.fx-fav.on { color: var(--accent-text); border: 1px solid var(--accent-border); background: var(--accent-bg); }
.fx-cert { position: relative; display: flex; flex-direction: column; gap: 6px; padding: 18px 18px 20px; border-radius: 10px; background: #FBFAF6; color: #14201C; box-shadow: inset 0 0 0 2px #004C3F, inset 0 0 0 7px #FBFAF6, inset 0 0 0 8px rgba(0,76,63,.35), 0 20px 40px -30px rgba(0,0,0,.6); transform: rotate(-1.2deg); }
.fx-cert-k { font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase; font-weight: 700; color: #8A6A10; }
.fx-cert b { font-family: var(--font-fraunces), serif; font-weight: 500; font-size: 17px; line-height: 1.2; padding-right: 34px; }
.fx-cert small { font-size: 11.5px; color: #4A5A54; }
.fx-cert-seal { position: absolute; right: 14px; bottom: 14px; width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; color: #3A2A00; background: radial-gradient(circle at 35% 30%, #FFF1C4, #FFD56B 55%, #E5B53F); }
.fx-mob-only { display: none; }
@media (max-width: 1180px) { .fx-hero-in { grid-template-columns: minmax(0, 1fr); } .fx-preview { display: none; } .fx-how { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 1000px) { .fx-grid { grid-template-columns: minmax(0, 1fr); } .fx-side { position: static; } }
@media (max-width: 767px) {
  .fx-hero { border-radius: 0; min-height: 0; }
  .fx-hero-in { padding: 14px 16px 26px; }
  .fx-hero-shade { background: rgba(0,30,24,.62); }
  .fx-title, .fx-cta, .fx-prog { display: none; }
  .fx-lead { font-size: 14px; -webkit-line-clamp: 2; }
  .fx-mob-only { display: grid; }
  .fx-grid { margin-top: -20px; position: relative; background: var(--bg); border-radius: 22px 22px 0 0; padding: 18px 16px 0; gap: 24px; }
  .fx-main { gap: 26px; }
  .fx-side { display: none; }
  .fx-how { grid-template-columns: minmax(0, 1fr); }
  .fx-mod-bar { display: none; }
  .fx-mod { gap: 10px; }
  .fx-mod-n { width: 36px; height: 36px; font-size: 16px; }
  .fx-mod::before { left: 17px; top: 38px; }
}
@media (prefers-reduced-motion: reduce) { .fx-preview, .fx-can-i { animation: none; } .fx-ybtn, .fx-next-c { transition: none; } }
`

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

// Illustration de l'étape (24/11/2026) : icône du thème sur la couverture de la formation
const THEME_ICON: Record<Theme, typeof Coins> = {
  prix: Coins, calendrier: CalendarBlank, photo: Camera, google: GoogleLogo, avis: Star, message: ChatsCircle,
  contrat: FileText, loi: Scales, fiscal: Calculator, securite: ShieldCheck, maison: House, menage: Broom,
  reseaux: InstagramLogo, stats: ChartLineUp, outil: Wrench, cle: Key, equipe: UsersThree, idee: Lightbulb,
  alerte: Warning, exercice: PencilSimpleLine, cible: Crosshair, livre: BookOpen, carte: MapPin, argent: Wallet,
}

function StepArt({ theme, bg }: { theme: Theme; bg: string }) {
  const Icon = THEME_ICON[theme]
  return <span className="fv-art" style={{ background: bg }} aria-hidden="true"><span className="fv-art-ic"><Icon size={30} weight="duotone" /></span></span>
}

function LessonPlayer(p: {
  formationTitle: string; entry: { lesson: Lesson; module: Module }; steps: Step[]; step: number; setStep: (s: number) => void
  lessonIndex: number; totalLessons: number; done: boolean; quizCount: number; quiz: QuizState
  onAnswer: (i: number, picked: number, correct: boolean) => void; action: ActionState | null
  onAction: (title: string, href: string | null, when: ActionWhen) => void; logementId: string | null
  onComplete: () => void; onClose: () => void; onNext: () => void; objectif: string | null; niveau: string | null
  notes: Record<string, string>; bookmarked: boolean; vote: 1 | -1 | null; formationId: string | null; formationSlug: string
  relatedArticles: Array<{ label: string; slug: string }>; currentUserId: string | null; currentUserName: string | null
  cover: string
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

  // Nouvelle étape : tout remonter en haut, y compris le conteneur qui défile
  // (sinon le début de l'étape restait caché sous la barre de progression
  // collée en haut, 23/11/2026).
  useEffect(() => {
    let el: HTMLElement | null = stageRef.current
    while (el) { if (el.scrollTop > 0) el.scrollTop = 0; el = el.parentElement }
    window.scrollTo({ top: 0 })
  }, [p.step])

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
                <StepArt theme={stepTheme(p.step === 0 ? null : s.title, lesson.title)} bg={p.cover} />
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
                  returnLabel={`${p.formationTitle} · ${lesson.title}`}
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
.fv-art { position: relative; display: grid; place-items: center; width: 100%; height: 112px; border-radius: 20px; overflow: hidden; box-shadow: inset 0 0 0 1px rgba(255,255,255,.08); animation: fvArt .45s ease both; }
.fv-art-ic { width: 64px; height: 64px; border-radius: 20px; display: grid; place-items: center; color: #fff; background: rgba(0,0,0,.22); box-shadow: 0 10px 24px -12px rgba(0,0,0,.6); }
@keyframes fvArt { from { opacity: 0; transform: scale(.98); } to { opacity: 1; transform: none; } }
.fv-stage { flex: 1; display: flex; justify-content: center; padding: 44px 0 24px; }
.fv-full > .fv-stage { padding: 44px clamp(16px, 3vw, 32px) 24px; }
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
  .fv-full > .fv-stage { padding: 24px 20px 24px; }
  .fv-stage { padding: 24px 0 24px; }
  .fv-foot { margin-top: auto; }
  .fv-sheet { margin-top: auto; }
}
@media (prefers-reduced-motion: reduce) {
  .fv-stage-in, .fv-sheet, .fv-medal, .fv-art { animation: none; }
  .fv-burst { display: none; }
}
`
