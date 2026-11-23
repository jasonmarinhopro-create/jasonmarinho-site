'use client'

// Lecteur de formation (refonte du 23/11/2026, docs/claude/formations.md).
// - Chaque leçon a son adresse (?lecon=<id>) : actualiser ou partager garde la leçon.
// - Une leçon avec questions se termine en y répondant ; sans question
//   (format d'avant), le bouton « Marquer comme terminé » reste.
// - Fin de module : action dans l'app, faite ou prévue avec rappel.
// - Fin de formation : bilan, score, attestation, formation suivante.
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Clock, BookOpen, CheckCircle, GraduationCap,
  CaretDown, CaretRight, Check, List, X, BookmarkSimple, ArrowSquareOut,
  Certificate, Trophy, ArrowCounterClockwise, NotePencil, Target,
} from '@phosphor-icons/react/dist/ssr'
import {
  enrollInFormation, updateFormationProgress, saveLessonNote, toggleLessonBookmark,
  voteLesson, answerLessonQuestion, planModuleAction, saveFormationBilan,
} from '@/app/dashboard/formations/actions'
import LessonComments from './LessonComments'
import LessonContent, { type QuizState, type ActionWhen } from './LessonContent'
import { parseLesson, type Block } from '@/lib/formations/blocks'
import { flatLessons, firstIncomplete, lessonFromParam, percent, quizScore } from '@/lib/formations/progress'

interface Lesson { id: number; title: string; duration: string; content: string }
interface Module { id: number; title: string; duration: string; lessons: Lesson[] }
interface Formation {
  title: string
  description: string
  duration: string
  level: string
  objectifs: string[]
  modules: Module[]
}

export interface InitialAnswer { lesson_id: number; question: number; correct: boolean }
export interface InitialAction { module_id: number; done_at: string | null; due_at: string | null }

const WHEN_TEXT: Record<Exclude<ActionWhen, 'done'>, string> = { 'ce-soir': 'ce soir', demain: 'demain', 'week-end': 'ce week-end' }

function dueLabel(iso: string | null): string | undefined {
  if (!iso) return undefined
  return new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
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
  formationSlug,
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
  /** Objectif posé au bilan de départ (null = pas encore). */
  initialObjectif?: string | null
  formationSlug?: string
  relatedArticles?: Array<{ label: string; slug: string }>
  recommendedNext?: Array<{ slug: string; title: string; reason?: string }>
  currentUserId?: string | null
  currentUserName?: string | null
}) {
  const all = useMemo(() => flatLessons(formation.modules), [formation.modules])
  const totalLessons = all.length
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
  const quizCount = useCallback((id: number) => (blocksById.get(id) ?? []).filter(b => b.type === 'quiz').length, [blocksById])

  const [activeId, setActiveId] = useState<number | null>(null)
  const [openModules, setOpenModules] = useState<number[]>([formation.modules[0]?.id ?? 1])
  const [isMobile, setIsMobile] = useState(false)
  const [isMidScreen, setIsMidScreen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [completed, setCompleted] = useState<number[]>(initialCompletedLessons)
  const [justFinished, setJustFinished] = useState(false)
  const [objectif, setObjectif] = useState<string | null>(initialObjectif)
  const [niveau, setNiveau] = useState<string | null>(null)

  // Réponses : { lessonId: { questionIndex: { picked, correct } } }
  const [answers, setAnswers] = useState<Record<number, QuizState>>(() => {
    const out: Record<number, QuizState> = {}
    for (const a of initialAnswers) {
      const blocks = blocksById.get(a.lesson_id) ?? []
      const q = blocks.find(b => b.type === 'quiz' && b.index === a.question)
      const correctIdx = q && q.type === 'quiz' ? q.options.findIndex(o => o.correct) : -1
      out[a.lesson_id] = { ...(out[a.lesson_id] ?? {}), [a.question]: { picked: a.correct ? correctIdx : -1, correct: a.correct } }
    }
    return out
  })
  const [actions, setActions] = useState<Record<number, { when: ActionWhen; dueLabel?: string }>>(() => {
    const out: Record<number, { when: ActionWhen; dueLabel?: string }> = {}
    for (const a of initialActions) {
      out[a.module_id] = a.done_at ? { when: 'done' } : { when: 'demain', dueLabel: dueLabel(a.due_at) }
    }
    return out
  })

  // ─── Adresse de la leçon ──────────────────────────────────────────
  useEffect(() => {
    const read = () => {
      const ref = lessonFromParam(all, new URLSearchParams(window.location.search).get('lecon'))
      setActiveId(ref?.lessonId ?? null)
      if (ref) setOpenModules(prev => prev.includes(ref.moduleId) ? prev : [...prev, ref.moduleId])
    }
    read()
    window.addEventListener('popstate', read)
    return () => window.removeEventListener('popstate', read)
  }, [all])

  useEffect(() => {
    const check = () => { setIsMobile(window.innerWidth < 768); setIsMidScreen(window.innerWidth < 1100) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const mainRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
    window.scrollTo({ top: 0 })
  }, [activeId])

  function go(lessonId: number | null) {
    const url = new URL(window.location.href)
    if (lessonId === null) url.searchParams.delete('lecon')
    else url.searchParams.set('lecon', String(lessonId))
    window.history.pushState({}, '', url.pathname + url.search)
    setActiveId(lessonId)
    if (lessonId !== null) {
      const mod = lessonById.get(lessonId)?.module.id
      if (mod) setOpenModules(prev => prev.includes(mod) ? prev : [...prev, mod])
    }
    if (isMobile) setNavOpen(false)
  }

  const progress = percent(completed, totalLessons)
  const resume = firstIncomplete(all, completed)
  const current = activeId !== null ? lessonById.get(activeId) ?? null : null
  const idx = activeId !== null ? all.findIndex(l => l.lessonId === activeId) : -1
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null
  const prev = idx > 0 ? all[idx - 1] : null

  function markComplete(lessonId: number) {
    if (completed.includes(lessonId)) return
    const updated = [...completed, lessonId]
    setCompleted(updated)
    const pct = percent(updated, totalLessons)
    if (pct === 100) setJustFinished(true)
    if (formationId) updateFormationProgress(formationId, pct, updated, lessonId)
  }

  function onAnswer(lessonId: number, index: number, picked: number, correct: boolean) {
    const nextState = { ...(answers[lessonId] ?? {}), [index]: { picked, correct } }
    setAnswers(prev => ({ ...prev, [lessonId]: nextState }))
    if (formationId) answerLessonQuestion({ formationId, lessonId, question: index, correct }).catch(() => null)
    if (Object.keys(nextState).length >= quizCount(lessonId)) markComplete(lessonId)
  }

  function onAction(moduleId: number, title: string, href: string | null, when: ActionWhen) {
    setActions(prev => ({ ...prev, [moduleId]: when === 'done' ? { when } : { when, dueLabel: WHEN_TEXT[when] } }))
    if (formationId) {
      planModuleAction({ formationId, moduleId, title, href, when }).then(r => {
        if (r?.dueAt) setActions(prev => ({ ...prev, [moduleId]: { when, dueLabel: dueLabel(r.dueAt!) } }))
      }).catch(() => null)
    }
  }

  // ─── Notes, favoris, avis ─────────────────────────────────────────
  const [notes, setNotes] = useState<Record<string, string>>(initialNotes)
  const [noteSaved, setNoteSaved] = useState(false)
  const noteTimer = useRef<NodeJS.Timeout | null>(null)
  function updateNote(lessonId: number, moduleId: number, content: string) {
    setNotes(p => ({ ...p, [String(lessonId)]: content }))
    setNoteSaved(false)
    if (noteTimer.current) clearTimeout(noteTimer.current)
    if (!formationId) return
    noteTimer.current = setTimeout(async () => {
      await saveLessonNote({ formationId, moduleId, lessonId, content })
      setNoteSaved(true)
      setTimeout(() => setNoteSaved(false), 1600)
    }, 700)
  }
  const [bookmarks, setBookmarks] = useState<number[]>(initialBookmarks)
  function toggleBookmark(lessonId: number, moduleId: number, lessonTitle: string) {
    const add = !bookmarks.includes(lessonId)
    setBookmarks(p => add ? [...p, lessonId] : p.filter(x => x !== lessonId))
    if (!formationId || !formationSlug) return
    toggleLessonBookmark({ formationId, formationSlug, formationTitle: formation.title, moduleId, lessonId, lessonTitle, add })
      .catch(() => setBookmarks(p => add ? p.filter(x => x !== lessonId) : [...p, lessonId]))
  }
  const [votes, setVotes] = useState<Record<string, 1 | -1>>(initialVotes)
  function vote(lessonId: number, value: 1 | -1) {
    const nextVote: 1 | -1 | 0 = votes[String(lessonId)] === value ? 0 : value
    setVotes(p => { const o = { ...p }; if (nextVote === 0) delete o[String(lessonId)]; else o[String(lessonId)] = nextVote; return o })
    if (formationId) voteLesson({ formationId, lessonId, vote: nextVote }).catch(() => null)
  }

  // ─── Bilan de fin ────────────────────────────────────────────────
  const allAnswers = Object.values(answers).flatMap(q => Object.values(q))
  const score = quizScore(allAnswers)
  const actionsDone = Object.values(actions).filter(a => a.when === 'done').length
  const actionsTotal = useMemo(() => {
    let n = 0
    blocksById.forEach(bs => { n += bs.filter(b => b.type === 'action').length })
    return n
  }, [blocksById])

  const toc = (current ? blocksById.get(current.lesson.id) ?? [] : [])
    .filter((b): b is Extract<Block, { type: 'h2' | 'h3' }> => b.type === 'h2' || b.type === 'h3')

  function toggleModule(id: number) {
    setOpenModules(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  // ─── Sommaire (barre de gauche et tiroir mobile) ─────────────────
  const NavContent = () => (
    <>
      <div style={st.navHeader}>
        {!isMobile && (
          <Link href="/dashboard/formations" style={st.backLink}><ArrowLeft size={15} /> Toutes les formations</Link>
        )}
        <button type="button" onClick={() => go(null)} style={st.navTitleBtn}>{formation.title}</button>
        <div style={st.navStats}>
          <span style={st.inline}><Clock size={12} /> {formation.duration}</span>
          <span style={st.inline}><BookOpen size={12} /> {totalLessons} leçons</span>
        </div>
        <ModuleBar modules={formation.modules} completed={completed} activeId={activeId} />
        <div style={st.navPct}><span>{completed.length} / {totalLessons} leçons</span><strong>{progress} %</strong></div>
      </div>
      <nav style={st.navModules} aria-label="Sommaire de la formation">
        {formation.modules.map(mod => {
          const isOpen = openModules.includes(mod.id)
          const doneCount = mod.lessons.filter(l => completed.includes(l.id)).length
          const allDone = doneCount === mod.lessons.length
          return (
            <div key={mod.id}>
              <button type="button" onClick={() => toggleModule(mod.id)} style={st.moduleBtn} aria-expanded={isOpen}>
                <span style={st.moduleLeft}>
                  {allDone
                    ? <CheckCircle size={18} weight="fill" color="var(--success-1)" style={{ flexShrink: 0 }} />
                    : <span style={st.moduleNum}>{mod.id}</span>}
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
                    <span style={st.moduleLabel}>{mod.title}</span>
                    <span style={st.moduleMeta}>{doneCount}/{mod.lessons.length} · {mod.duration}</span>
                  </span>
                </span>
                {isOpen ? <CaretDown size={14} /> : <CaretRight size={14} />}
              </button>
              {isOpen && (
                <div style={st.lessonList}>
                  {mod.lessons.map(l => {
                    const active = activeId === l.id
                    const done = completed.includes(l.id)
                    return (
                      <button key={l.id} type="button" onClick={() => go(l.id)} style={{ ...st.lessonBtn, ...(active ? st.lessonBtnActive : {}) }} aria-current={active ? 'page' : undefined}>
                        <span style={{ ...st.lessonDot, ...(done ? st.lessonDotDone : active ? st.lessonDotActive : {}) }}>
                          {done && <Check size={9} weight="bold" color="var(--bg)" />}
                        </span>
                        <span style={{ flex: 1, textAlign: 'left' }}>{l.title}</span>
                        <span style={st.lessonDur}>{l.duration}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </>
  )

  const finished = progress === 100
  const finishPanel = finished ? (
    <FinishPanel
      celebrate={justFinished}
      objectif={objectif}
      title={formation.title}
      objectifs={formation.objectifs}
      score={score}
      actionsDone={actionsDone}
      actionsTotal={actionsTotal}
      next={recommendedNext[0] ?? null}
      attestationHref={formationSlug ? `/dashboard/formations/attestation/${formationSlug}` : null}
    />
  ) : null

  return (
    <div style={{ ...st.root, flexDirection: isMobile ? 'column' : 'row' }} className="dash-page fv">
      <style>{`
        .fv-in { animation: fvIn .35s ease both; }
        @keyframes fvIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .fv-in { animation: none; } }
        .fv button:focus-visible, .fv a:focus-visible { outline: 2px solid var(--accent-text); outline-offset: 2px; }
      `}</style>

      {isMobile && (
        <>
          <div style={st.mobileBar}>
            <Link href="/dashboard/formations" style={st.mobileBack} aria-label="Toutes les formations"><ArrowLeft size={18} /></Link>
            <div style={st.mobileBarCenter}>
              <span style={st.mobileBarTitle}>{formation.title}</span>
              <ModuleBar modules={formation.modules} completed={completed} activeId={activeId} compact />
            </div>
            <button type="button" onClick={() => setNavOpen(v => !v)} style={st.mobileNavToggle} aria-label="Sommaire" aria-expanded={navOpen}>
              {navOpen ? <X size={20} color="var(--text)" /> : <List size={20} color="var(--text)" />}
            </button>
          </div>
          <div style={st.mobileBarSpacer} />
        </>
      )}
      {isMobile && navOpen && <div style={st.mobileDrawer}><NavContent /></div>}
      {!isMobile && <aside style={st.navPanel}><NavContent /></aside>}

      <main ref={mainRef} style={{ ...st.main, ...(isMobile ? { overflowY: 'visible' } : {}) }}>
        {!current ? (
          <div style={{ ...st.overview, ...(isMobile ? st.overviewMobile : {}) }} className="fv-in" key="overview">
            {finishPanel}
            <span style={st.levelBadge}><GraduationCap size={13} weight="fill" /> {formation.level}</span>
            <h1 style={st.overviewTitle}>{formation.title}</h1>
            <p style={st.overviewDesc}>{formation.description}</p>

            <div style={{ ...st.metaRow, ...(isMobile ? st.metaRowMobile : {}) }}>
              <Meta icon={<Clock size={16} />} value={formation.duration} label="durée totale" />
              <Meta icon={<BookOpen size={16} />} value={`${formation.modules.length} modules`} label={`${totalLessons} leçons`} />
              <Meta icon={<Target size={16} />} value={progress > 0 ? `${progress} %` : 'À toi de jouer'} label={progress > 0 ? 'déjà fait' : 'questions et actions dans chaque module'} />
            </div>

            {objectif ? (
              <div style={st.goalSet}>
                <CheckCircle size={18} weight="fill" color="var(--success-1)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <span style={st.goalLbl}>Ton objectif</span>
                  <span style={{ color: 'var(--text)' }}>{objectif}</span>
                  {niveau === 'bien' && <span style={st.goalTip}>Tu connais déjà le sujet : ouvre dans le sommaire les leçons qui t&apos;intéressent et réponds aux questions pour vérifier ce que tu sais.</span>}
                </span>
              </div>
            ) : !finished && (
              <BilanDepart
                onSave={(obj, lvl) => {
                  setObjectif(obj)
                  setNiveau(lvl)
                  if (formationId) saveFormationBilan({ formationId, objectif: obj, bilan: { niveau: lvl } }).catch(() => null)
                }}
              />
            )}

            <div style={st.objBox}>
              <div style={st.objTitle}>Ce que tu sauras faire</div>
              <ul style={st.objList}>
                {formation.objectifs.map((o, i) => (
                  <li key={i} style={st.objItem}>
                    <CheckCircle size={17} weight="fill" color="var(--success-1)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              {resume && progress > 0 ? (
                <>
                  <button type="button" className="btn-primary" onClick={() => go(resume.lessonId)} style={{ ...st.bigBtn, width: isMobile ? '100%' : 'auto' }}>
                    Reprendre : {resume.title} <ArrowRight size={16} />
                  </button>
                  <button type="button" onClick={() => go(all[0].lessonId)} style={st.ghostBtn}><ArrowCounterClockwise size={14} /> Revoir depuis le début</button>
                </>
              ) : !finished ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => { if (formationId) enrollInFormation(formationId); go(all[0]?.lessonId ?? null) }}
                  style={{ ...st.bigBtn, width: isMobile ? '100%' : 'auto' }}
                >
                  Commencer la formation <ArrowRight size={16} />
                </button>
              ) : (
                <button type="button" onClick={() => go(all[0].lessonId)} style={st.ghostBtn}><ArrowCounterClockwise size={14} /> Revoir les leçons</button>
              )}
            </div>

            {recommendedNext.length > 0 && !finished && (
              <div style={st.recoBlock}>
                <h3 style={st.recoTitle}>Pour aller plus loin</h3>
                <div style={st.recoList}>
                  {recommendedNext.map(r => (
                    <Link key={r.slug} href={`/dashboard/formations/${r.slug}`} style={st.recoCard}>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={st.recoCardTitle}>{r.title}</span>
                        {r.reason && <span style={st.recoCardReason}>{r.reason}</span>}
                      </span>
                      <ArrowRight size={14} weight="bold" color="var(--accent-text)" style={{ flexShrink: 0 }} />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <article style={{ ...st.lesson, ...(isMobile ? st.lessonMobile : {}) }} className="fv-in" key={current.lesson.id}>
            <div style={st.crumb}>
              <span>Module {current.module.id} · {current.module.title}</span>
            </div>
            <LessonSteps module={current.module} completed={completed} activeId={current.lesson.id} onPick={go} />
            <h1 style={st.lessonTitle}>{current.lesson.title}</h1>
            <div style={st.lessonMeta}>
              <span style={st.inline}><Clock size={13} /> {current.lesson.duration}</span>
              {quizCount(current.lesson.id) > 0 && (
                <span style={st.inline}><Target size={13} /> {quizCount(current.lesson.id)} question{quizCount(current.lesson.id) > 1 ? 's' : ''} à la fin</span>
              )}
            </div>

            <LessonContent
              blocks={blocksById.get(current.lesson.id) ?? []}
              quiz={answers[current.lesson.id] ?? {}}
              onAnswer={(i, picked, correct) => onAnswer(current.lesson.id, i, picked, correct)}
              action={actions[current.module.id] ?? null}
              onAction={(title, href, when) => onAction(current.module.id, title, href, when)}
            />

            <div style={st.endBar}>
              {completed.includes(current.lesson.id) ? (
                <span style={st.doneMsg}><CheckCircle size={18} weight="fill" /> Leçon terminée</span>
              ) : quizCount(current.lesson.id) > 0 ? (
                <span style={st.todoMsg}><Target size={16} /> Réponds aux questions pour terminer la leçon</span>
              ) : (
                <button type="button" className="btn-primary" onClick={() => markComplete(current.lesson.id)} style={st.midBtn}>
                  <Check size={16} weight="bold" /> Marquer comme terminé
                </button>
              )}
              <span style={{ flex: 1 }} />
              {prev && (
                <button type="button" onClick={() => go(prev.lessonId)} style={st.ghostBtn}><ArrowLeft size={14} /> Précédente</button>
              )}
              {next && (
                <button
                  type="button"
                  className={completed.includes(current.lesson.id) ? 'btn-primary' : undefined}
                  onClick={() => go(next.lessonId)}
                  style={completed.includes(current.lesson.id) ? st.midBtn : st.ghostBtn}
                >
                  Leçon suivante <ArrowRight size={14} />
                </button>
              )}
            </div>

            {!next && finishPanel}

            <div style={st.clear}>
              <span>Cette leçon était claire ?</span>
              <button type="button" onClick={() => vote(current.lesson.id, 1)} style={{ ...st.chip, ...(votes[String(current.lesson.id)] === 1 ? st.chipOn : {}) }}>Oui</button>
              <button type="button" onClick={() => vote(current.lesson.id, -1)} style={{ ...st.chip, ...(votes[String(current.lesson.id)] === -1 ? st.chipOn : {}) }}>Pas assez</button>
              <button type="button" onClick={() => toggleBookmark(current.lesson.id, current.module.id, current.lesson.title)} style={{ ...st.chip, ...(bookmarks.includes(current.lesson.id) ? st.chipOn : {}) }}>
                <BookmarkSimple size={13} weight={bookmarks.includes(current.lesson.id) ? 'fill' : 'regular'} /> {bookmarks.includes(current.lesson.id) ? 'Dans mes favoris' : 'Garder en favori'}
              </button>
            </div>

            <details style={st.notes} open={!!notes[String(current.lesson.id)]}>
              <summary style={st.notesSum}><NotePencil size={15} /> Mes notes sur cette leçon {noteSaved && <span style={st.saved}><Check size={12} weight="bold" /> Enregistré</span>}</summary>
              <textarea
                id={`note-${current.lesson.id}`}
                placeholder="Une idée à retenir, une chose à faire pour ton logement..."
                value={notes[String(current.lesson.id)] ?? ''}
                onChange={e => updateNote(current.lesson.id, current.module.id, e.target.value)}
                rows={4}
                style={st.noteArea}
              />
            </details>

            {formationId && (
              <LessonComments
                formationId={formationId}
                lessonId={current.lesson.id}
                currentUserId={currentUserId ?? null}
                defaultDisplayName={currentUserName ?? undefined}
              />
            )}
          </article>
        )}
      </main>

      {!isMobile && !isMidScreen && (
        <aside style={st.rail}>
          <div style={st.railSection}>
            <div style={st.railLabel}>Ta progression</div>
            {formation.modules.map(mod => {
              const d = mod.lessons.filter(l => completed.includes(l.id)).length
              return (
                <div key={mod.id} style={st.railMod}>
                  <span style={st.railModT}>{mod.id}. {mod.title}</span>
                  <span style={st.railBar}><span style={{ ...st.railFill, width: `${Math.round((d / mod.lessons.length) * 100)}%` }} /></span>
                </div>
              )
            })}
            {score.total > 0 && <div style={st.railNote}>{score.good} bonne{score.good > 1 ? 's' : ''} réponse{score.good > 1 ? 's' : ''} sur {score.total}</div>}
            {actionsTotal > 0 && <div style={st.railNote}>{actionsDone} action{actionsDone > 1 ? 's' : ''} faite{actionsDone > 1 ? 's' : ''} sur {actionsTotal}</div>}
          </div>

          {toc.length > 0 && (
            <div style={st.railSection}>
              <div style={st.railLabel}>Sur cette page</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {toc.map(t => (
                  <a
                    key={t.id}
                    href={`#${t.id}`}
                    onClick={e => {
                      e.preventDefault()
                      const el = document.getElementById(t.id)
                      const main = mainRef.current
                      if (el && main) {
                        const top = main.scrollTop + (el.getBoundingClientRect().top - main.getBoundingClientRect().top) - 24
                        main.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
                      }
                    }}
                    style={{ ...st.tocLink, paddingLeft: t.type === 'h3' ? '18px' : '8px' }}
                  >
                    {t.text}
                  </a>
                ))}
              </div>
            </div>
          )}

          {relatedArticles.length > 0 && (
            <div style={{ ...st.railSection, borderBottom: 'none' }}>
              <div style={st.railLabel}>Approfondir</div>
              {relatedArticles.map(a => (
                <a key={a.slug} href={`https://jasonmarinho.com/blog/${a.slug}`} target="_blank" rel="noopener noreferrer" style={{ ...st.tocLink, display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ flex: 1 }}>{a.label}</span><ArrowSquareOut size={11} />
                </a>
              ))}
            </div>
          )}
        </aside>
      )}
    </div>
  )
}

function Meta({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div style={st.metaChip}>
      <span style={{ color: 'var(--accent-text)', display: 'flex' }}>{icon}</span>
      <span><span style={st.metaVal}>{value}</span><span style={st.metaLbl}>{label}</span></span>
    </div>
  )
}

/** Barre découpée par module : on voit la fin du module approcher. */
function ModuleBar({ modules, completed, activeId, compact = false }: { modules: Module[]; completed: number[]; activeId: number | null; compact?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '3px', margin: compact ? 0 : '12px 0 6px' }} aria-hidden="true">
      {modules.map(m => {
        const d = m.lessons.filter(l => completed.includes(l.id)).length
        const pct = Math.round((d / Math.max(1, m.lessons.length)) * 100)
        const here = m.lessons.some(l => l.id === activeId)
        return (
          <span key={m.id} style={{ flex: m.lessons.length, height: compact ? '5px' : '6px', borderRadius: '99px', background: 'var(--surface-2)', overflow: 'hidden', outline: here ? '1px solid var(--accent-border)' : 'none' }}>
            <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: 'var(--accent-text)', borderRadius: '99px', transition: 'width .4s' }} />
          </span>
        )
      })}
    </div>
  )
}

/** Leçons du module en pastilles, en haut de la leçon. */
function LessonSteps({ module, completed, activeId, onPick }: { module: Module; completed: number[]; activeId: number; onPick: (id: number) => void }) {
  const pos = module.lessons.findIndex(l => l.id === activeId) + 1
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0 18px', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: '4px', flex: '1 1 160px', maxWidth: '320px' }}>
        {module.lessons.map(l => {
          const done = completed.includes(l.id)
          const here = l.id === activeId
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => onPick(l.id)}
              title={l.title}
              aria-label={l.title}
              style={{ flex: 1, height: '7px', borderRadius: '99px', border: 0, padding: 0, cursor: 'pointer', background: done ? 'var(--accent-text)' : here ? 'var(--accent-border)' : 'var(--surface-2)' }}
            />
          )
        })}
      </div>
      <span style={{ fontSize: '12.5px', color: 'var(--text-3)' }}>Leçon {pos} sur {module.lessons.length}</span>
    </div>
  )
}

const BUTS = ['Démarrer sur de bonnes bases', 'Gagner plus avec ce que j\'ai déjà', 'Régler un problème précis']
const NIVEAUX: Array<[string, string]> = [['debut', 'Pas du tout'], ['un-peu', 'Un peu'], ['bien', 'Bien']]

/** Bilan de départ (1 minute) : dire ce qu'on veut réussir aide à aller au bout. */
function BilanDepart({ onSave }: { onSave: (objectif: string, niveau: string) => void }) {
  const [but, setBut] = useState<string | null>(null)
  const [libre, setLibre] = useState('')
  const [lvl, setLvl] = useState<string | null>(null)
  const obj = libre.trim() || but
  return (
    <section style={st.bilan} aria-label="Bilan de départ">
      <span style={st.goalLbl}>Avant de commencer · 1 minute</span>
      <div style={st.bilanQ}>Qu&apos;est-ce que tu veux réussir avec cette formation ?</div>
      <div style={st.chips}>
        {BUTS.map(b => (
          <button key={b} type="button" onClick={() => { setBut(b); setLibre('') }} style={{ ...st.chip, ...(but === b && !libre.trim() ? st.chipOn : {}) }}>{b}</button>
        ))}
      </div>
      <input
        id="bilan-objectif"
        value={libre}
        onChange={e => setLibre(e.target.value)}
        placeholder="Ou écris-le en une phrase"
        maxLength={200}
        style={st.bilanInput}
      />
      <div style={st.bilanQ}>Tu connais déjà ce sujet ?</div>
      <div style={st.chips}>
        {NIVEAUX.map(([k, l]) => (
          <button key={k} type="button" onClick={() => setLvl(k)} style={{ ...st.chip, ...(lvl === k ? st.chipOn : {}) }}>{l}</button>
        ))}
      </div>
      <button type="button" className="btn-primary" disabled={!obj || !lvl} onClick={() => obj && lvl && onSave(obj, lvl)} style={{ ...st.midBtn, alignSelf: 'flex-start', opacity: !obj || !lvl ? 0.5 : 1 }}>
        <Target size={15} weight="fill" /> Poser mon objectif
      </button>
    </section>
  )
}

function FinishPanel({ celebrate, objectif, title, objectifs, score, actionsDone, actionsTotal, next, attestationHref }: {
  celebrate: boolean
  objectif: string | null
  title: string
  objectifs: string[]
  score: { good: number; total: number }
  actionsDone: number
  actionsTotal: number
  next: { slug: string; title: string } | null
  attestationHref: string | null
}) {
  return (
    <section style={st.finish} className={celebrate ? 'fv-finish fv-celebrate' : 'fv-finish'} aria-label="Formation terminée">
      <style>{`
        .fv-finish { position: relative; overflow: hidden; }
        .fv-medal { animation: fvMedal .7s cubic-bezier(.2,1.4,.4,1) both; }
        .fv-celebrate .fv-spark { position: absolute; width: 8px; height: 8px; border-radius: 2px; opacity: 0; animation: fvSpark 1.4s ease-out both; }
        @keyframes fvMedal { from { transform: scale(.4) rotate(-12deg); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes fvSpark { 0% { opacity: 1; transform: translate(0,0) rotate(0); } 100% { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(220deg); } }
        @media (prefers-reduced-motion: reduce) { .fv-medal, .fv-celebrate .fv-spark { animation: none; } .fv-celebrate .fv-spark { display: none; } }
      `}</style>
      {celebrate && Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="fv-spark"
          style={{
            left: '62px', top: '58px',
            background: i % 3 === 0 ? '#FFD56B' : i % 3 === 1 ? 'var(--accent-text)' : 'var(--success-1)',
            animationDelay: `${(i % 6) * 40}ms`,
            ['--dx' as string]: `${Math.round(Math.cos((i / 18) * Math.PI * 2) * (90 + (i % 4) * 30))}px`,
            ['--dy' as string]: `${Math.round(Math.sin((i / 18) * Math.PI * 2) * (70 + (i % 3) * 25))}px`,
          } as React.CSSProperties}
        />
      ))}
      <div style={{ display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="fv-medal" style={st.medal}><Trophy size={34} weight="fill" /></span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0, flex: '1 1 220px' }}>
          <span style={st.finishEyebrow}>Formation terminée</span>
          <span style={st.finishTitle}>Bravo, tu as terminé « {title} »</span>
        </span>
      </div>
      {objectif && <div style={{ fontSize: '14px', color: 'var(--text-2)' }}>Tu voulais : <b style={{ color: 'var(--text)' }}>{objectif}</b>. Les outils sont maintenant entre tes mains.</div>}
      <div style={st.finishStats}>
        {score.total > 0 && <span style={st.finishStat}><strong>{score.good}/{score.total}</strong> bonnes réponses</span>}
        {actionsTotal > 0 && <span style={st.finishStat}><strong>{actionsDone}/{actionsTotal}</strong> actions faites</span>}
      </div>
      <div>
        <div style={st.objTitle}>Ce que tu sais faire maintenant</div>
        <ul style={st.objList}>
          {objectifs.map((o, i) => (
            <li key={i} style={st.objItem}><CheckCircle size={17} weight="fill" color="var(--success-1)" style={{ flexShrink: 0, marginTop: '2px' }} /><span>{o}</span></li>
          ))}
        </ul>
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {attestationHref && (
          <Link prefetch={false} href={attestationHref} className="btn-primary" style={st.midBtn}><Certificate size={16} weight="fill" /> Mon attestation</Link>
        )}
        {next && (
          <Link href={`/dashboard/formations/${next.slug}`} style={st.ghostBtn}>Formation suivante : {next.title} <ArrowRight size={14} /></Link>
        )}
      </div>
    </section>
  )
}

const st: Record<string, React.CSSProperties> = {
  root: { display: 'flex', minHeight: 'calc(100svh - var(--header-h))', padding: 0 },
  inline: { display: 'inline-flex', alignItems: 'center', gap: '5px' },

  mobileBar: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', position: 'fixed', top: 'var(--header-h)', left: 0, right: 0, zIndex: 20 },
  mobileBarSpacer: { height: '60px', flexShrink: 0 },
  mobileBack: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', flexShrink: 0 },
  mobileBarCenter: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' },
  mobileBarTitle: { fontSize: '13px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  mobileNavToggle: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer' },
  mobileDrawer: { position: 'fixed', top: 'calc(var(--header-h) + 60px)', left: 0, right: 0, zIndex: 19, borderBottom: '1px solid var(--border)', background: 'var(--bg)', maxHeight: '65svh', overflowY: 'auto' },

  navPanel: { width: '290px', flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 'var(--header-h)', height: 'calc(100svh - var(--header-h))', overflowY: 'auto' },
  navHeader: { padding: '20px 16px 14px', borderBottom: '1px solid var(--border)' },
  backLink: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-3)', textDecoration: 'none', marginBottom: '14px' },
  navTitleBtn: { display: 'block', textAlign: 'left', background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'var(--font-fraunces), serif', fontSize: '17px', color: 'var(--text)', lineHeight: 1.3, marginBottom: '8px' },
  navStats: { display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-3)' },
  navPct: { display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-3)' },
  navModules: { flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px' },
  moduleBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '10px', minHeight: '48px', borderRadius: '10px', background: 'none', border: 0, cursor: 'pointer', color: 'var(--text-2)', textAlign: 'left', fontFamily: 'inherit' },
  moduleLeft: { display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 },
  moduleNum: { width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', fontSize: '10.5px', fontWeight: 700, color: 'var(--text-2)' },
  moduleLabel: { fontSize: '13px', fontWeight: 600, lineHeight: 1.3, color: 'var(--text)' },
  moduleMeta: { fontSize: '11px', color: 'var(--text-muted)' },
  lessonList: { paddingLeft: '8px', paddingBottom: '4px', display: 'flex', flexDirection: 'column', gap: '1px' },
  lessonBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', minHeight: '44px', borderRadius: '9px', background: 'none', border: 0, cursor: 'pointer', fontSize: '12.5px', color: 'var(--text-3)', textAlign: 'left', fontFamily: 'inherit', lineHeight: 1.35 },
  lessonBtnActive: { background: 'var(--accent-bg)', color: 'var(--accent-text)', fontWeight: 600 },
  lessonDot: { width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center' },
  lessonDotDone: { background: 'var(--success-1)', border: '1px solid var(--success-1)' },
  lessonDotActive: { background: 'var(--accent-text)', border: '1px solid var(--accent-text)' },
  lessonDur: { fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 },

  main: { flex: 1, overflowY: 'auto', minWidth: 0 },

  overview: { padding: 'clamp(28px,4vw,52px)', maxWidth: '860px', display: 'flex', flexDirection: 'column', gap: '22px' },
  overviewMobile: { padding: '20px 16px' },
  levelBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start', fontSize: '12px', fontWeight: 700, padding: '4px 11px', borderRadius: '99px', background: 'rgba(255,213,107,0.14)', color: 'var(--accent-text)', border: '1px solid rgba(255,213,107,0.3)' },
  overviewTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px,3.2vw,42px)', fontWeight: 400, color: 'var(--text)', lineHeight: 1.15, margin: 0 },
  overviewDesc: { fontSize: '16px', color: 'var(--text-2)', lineHeight: 1.7, margin: 0, maxWidth: '68ch' },
  metaRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  metaRowMobile: { display: 'grid', gridTemplateColumns: '1fr', gap: '8px' },
  metaChip: { display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '13px 16px', flex: '1 1 180px' },
  metaVal: { display: 'block', fontSize: '14.5px', fontWeight: 600, color: 'var(--text)' },
  metaLbl: { display: 'block', fontSize: '12px', color: 'var(--text-3)', marginTop: '1px' },
  objBox: { background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: '16px', padding: '18px 20px' },
  objTitle: { fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-text)', marginBottom: '12px' },
  objList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px' },
  objItem: { display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '15px', color: 'var(--text-2)', lineHeight: 1.5 },
  bigBtn: { fontSize: '15px', padding: '13px 24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  midBtn: { fontSize: '14px', padding: '11px 20px', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' },
  ghostBtn: { display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', textDecoration: 'none', fontFamily: 'inherit' },
  recoBlock: { padding: '18px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  recoTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', fontWeight: 500, color: 'var(--text)', margin: 0 },
  recoList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  recoCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', textDecoration: 'none' },
  recoCardTitle: { display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text)' },
  recoCardReason: { display: 'block', fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' },

  lesson: { padding: 'clamp(24px,4vw,52px)', maxWidth: '780px', margin: '0 auto' },
  lessonMobile: { padding: '18px 16px 40px' },
  crumb: { fontSize: '12.5px', color: 'var(--text-muted)' },
  lessonTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px,3vw,36px)', fontWeight: 400, color: 'var(--text)', lineHeight: 1.15, margin: '0 0 10px' },
  lessonMeta: { display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12.5px', color: 'var(--text-3)', marginBottom: '26px' },
  endBar: { marginTop: '36px', paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  doneMsg: { display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14.5px', color: 'var(--success-1)', fontWeight: 600 },
  todoMsg: { display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-3)' },
  clear: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '26px', fontSize: '13.5px', color: 'var(--text-3)' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 13px', borderRadius: '99px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
  chipOn: { border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)', fontWeight: 600 },
  notes: { marginTop: '18px', border: '1px solid var(--border)', borderRadius: '14px', padding: '12px 16px', background: 'var(--surface)' },
  notesSum: { cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-2)' },
  saved: { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--success-1)', fontWeight: 600 },
  noteArea: { width: '100%', boxSizing: 'border-box', marginTop: '10px', padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit', color: 'var(--text)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', outline: 'none', resize: 'vertical', lineHeight: 1.55 },

  goalSet: { display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '14px 16px', borderRadius: '14px', border: '1px solid var(--success-border)', background: 'var(--success-bg)', fontSize: '15px', lineHeight: 1.5 },
  goalLbl: { display: 'block', fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-text)', marginBottom: '2px' },
  goalTip: { display: 'block', fontSize: '13.5px', color: 'var(--text-2)', marginTop: '6px' },
  bilan: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '18px 20px', borderRadius: '16px', border: '1.5px dashed var(--accent-border)', background: 'var(--surface)' },
  bilanQ: { fontSize: '15px', fontWeight: 600, color: 'var(--text)' },
  bilanInput: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit' },
  chips: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  finish: { border: '1px solid var(--accent-border)', borderRadius: '20px', padding: '22px 24px', background: 'linear-gradient(160deg, var(--accent-bg), var(--surface))', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '26px' },
  medal: { width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', color: '#3A2A00', background: 'radial-gradient(circle at 35% 30%, #FFF1C4, #FFD56B 55%, #E5B53F)', boxShadow: '0 10px 30px -12px rgba(255,213,107,0.8)' },
  finishEyebrow: { fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-text)' },
  finishTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(20px,2.4vw,26px)', color: 'var(--text)', lineHeight: 1.25 },
  finishStats: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  finishStat: { padding: '10px 14px', borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--border)', fontSize: '13.5px', color: 'var(--text-2)', display: 'inline-flex', alignItems: 'baseline', gap: '6px' },

  rail: { width: '290px', flexShrink: 0, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 'var(--header-h)', height: 'calc(100svh - var(--header-h))', overflowY: 'auto', padding: '24px 18px', gap: '22px', background: 'var(--bg)' },
  railSection: { display: 'flex', flexDirection: 'column', gap: '9px', paddingBottom: '18px', borderBottom: '1px solid var(--border)' },
  railLabel: { fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)' },
  railMod: { display: 'flex', flexDirection: 'column', gap: '4px' },
  railModT: { fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.35 },
  railBar: { display: 'block', height: '5px', borderRadius: '99px', background: 'var(--surface-2)', overflow: 'hidden' },
  railFill: { display: 'block', height: '100%', background: 'var(--accent-text)', borderRadius: '99px', transition: 'width .4s' },
  railNote: { fontSize: '12.5px', color: 'var(--text-2)' },
  tocLink: { padding: '5px 8px', fontSize: '12.5px', color: 'var(--text-2)', textDecoration: 'none', borderRadius: '7px', lineHeight: 1.4 },
}
