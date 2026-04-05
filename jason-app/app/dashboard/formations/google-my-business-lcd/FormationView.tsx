'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Clock, BookOpen, CheckCircle, GraduationCap,
  CaretDown, CaretRight, Star, Check, List, X,
} from '@phosphor-icons/react'
import { enrollInFormation, updateFormationProgress } from '../actions'

interface Lesson {
  id: number
  title: string
  duration: string
  content: string
}

interface Module {
  id: number
  title: string
  duration: string
  lessons: Lesson[]
}

interface Formation {
  title: string
  description: string
  duration: string
  level: string
  objectifs: string[]
  modules: Module[]
}

export default function FormationView({
  formation,
  formationId,
  initialProgress,
}: {
  formation: Formation
  formationId?: string | null
  initialProgress?: number | null
}) {
  const totalLessons = formation.modules.reduce((a, m) => a + m.lessons.length, 0)
  const [activeLesson, setActiveLesson] = useState<{ moduleId: number; lessonId: number } | null>(null)
  const [openModules, setOpenModules] = useState<number[]>([1])
  const [isMobile, setIsMobile] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Restore completed lessons from saved progress (approximate: first N lessons)
  const restoredLessons = (() => {
    if (!initialProgress || initialProgress <= 0) return []
    const count = Math.round((initialProgress / 100) * totalLessons)
    return formation.modules.flatMap(m => m.lessons.map(l => l.id)).slice(0, count)
  })()
  const [completedLessons, setCompletedLessons] = useState<number[]>(restoredLessons)

  const currentLesson = activeLesson
    ? formation.modules
        .find(m => m.id === activeLesson.moduleId)
        ?.lessons.find(l => l.id === activeLesson.lessonId)
    : null

  const currentModule = activeLesson
    ? formation.modules.find(m => m.id === activeLesson.moduleId)
    : null

  function toggleModule(id: number) {
    setOpenModules(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function selectLesson(moduleId: number, lessonId: number) {
    setActiveLesson({ moduleId, lessonId })
    if (isMobile) setNavOpen(false)
  }

  function markComplete(lessonId: number) {
    const updated = completedLessons.includes(lessonId)
      ? completedLessons
      : [...completedLessons, lessonId]
    setCompletedLessons(updated)

    if (formationId) {
      const newProgress = Math.round((updated.length / totalLessons) * 100)
      updateFormationProgress(formationId, newProgress)
    }

    // Auto-advance to next lesson
    const allLessons = formation.modules.flatMap(m =>
      m.lessons.map(l => ({ moduleId: m.id, lessonId: l.id }))
    )
    const curr = allLessons.findIndex(l => l.lessonId === lessonId)
    if (curr !== -1 && curr < allLessons.length - 1) {
      const next = allLessons[curr + 1]
      setActiveLesson(next)
      setOpenModules(prev => prev.includes(next.moduleId) ? prev : [...prev, next.moduleId])
    }
  }

  const progress = Math.round((completedLessons.length / totalLessons) * 100)

  // Render markdown-like content
  function renderContent(content: string) {
    const lines = content.split('\n')
    const elements: React.ReactNode[] = []
    let i = 0
    let key = 0

    while (i < lines.length) {
      const line = lines[i]

      if (line.startsWith('## ')) {
        elements.push(<h2 key={key++} style={s.h2}>{line.slice(3)}</h2>)
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={key++} style={s.h3}>{line.slice(4)}</h3>)
      } else if (line.startsWith('**') && line.endsWith('**') && line.includes('—')) {
        elements.push(<p key={key++} style={s.boldLine} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />)
      } else if (line.startsWith('| ')) {
        const tableLines: string[] = []
        while (i < lines.length && lines[i].startsWith('|')) {
          tableLines.push(lines[i])
          i++
        }
        const [header, , ...rows] = tableLines
        const headers = header.split('|').filter(Boolean).map(h => h.trim())
        const tableRows = rows.map(r => r.split('|').filter(Boolean).map(c => c.trim()))
        elements.push(
          <div key={key++} style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>{headers.map((h, j) => <th key={j} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {tableRows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => <td key={ci} style={s.td}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        continue
      } else if (line.startsWith('```')) {
        const codeLines: string[] = []
        i++
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i])
          i++
        }
        elements.push(
          <pre key={key++} style={s.pre}>{codeLines.join('\n')}</pre>
        )
      } else if (line.startsWith('- ') || line.startsWith('✅ ') || line.startsWith('❌ ')) {
        const items: string[] = []
        while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('✅ ') || lines[i].startsWith('❌ '))) {
          items.push(lines[i])
          i++
        }
        elements.push(
          <ul key={key++} style={s.ul}>
            {items.map((item, j) => {
              const isGood = item.startsWith('✅')
              const isBad = item.startsWith('❌')
              const text = item.replace(/^[-✅❌]\s/, '')
              return (
                <li key={j} style={{ ...s.li, color: isGood ? '#34D399' : isBad ? '#F87171' : 'var(--text-2)' }}>
                  <span style={s.bullet}>{isGood ? '✅' : isBad ? '❌' : '•'}</span>
                  <span dangerouslySetInnerHTML={{ __html: formatInline(text) }} />
                </li>
              )
            })}
          </ul>
        )
        continue
      } else if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={key++} style={s.blockquote}>
            <span dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />
          </blockquote>
        )
      } else if (line.trim() === '') {
        // skip empty lines
      } else {
        elements.push(
          <p key={key++} style={s.p} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
        )
      }
      i++
    }
    return elements
  }

  function formatInline(text: string): string {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:var(--text);font-weight:600">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em style="color:#FFD56B;font-style:italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:var(--border);padding:2px 7px;border-radius:5px;font-size:13px;font-family:monospace;color:#FFD56B">$1</code>')
  }

  // ── Sidebar nav content (shared between desktop sidebar and mobile drawer)
  const NavContent = () => (
    <>
      <div style={styles.navHeader}>
        {!isMobile && (
          <Link href="/dashboard/formations" style={styles.backLink}>
            <ArrowLeft size={15} />
            Retour
          </Link>
        )}
        <div style={styles.formationMeta}>
          <div style={styles.formationTitle}>{formation.title}</div>
          <div style={styles.formationStats}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> {formation.duration}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <BookOpen size={12} /> {totalLessons} leçons
            </span>
          </div>
        </div>
        <div style={styles.progressWrap}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={styles.progressLabel}>Progression</span>
            <span style={styles.progressPct}>{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <nav style={styles.navModules}>
        {formation.modules.map(module => {
          const isOpen = openModules.includes(module.id)
          const allDone = module.lessons.every(l => completedLessons.includes(l.id))
          return (
            <div key={module.id} style={styles.moduleGroup}>
              <button onClick={() => toggleModule(module.id)} style={styles.moduleBtn}>
                <div style={styles.moduleBtnLeft}>
                  {allDone
                    ? <CheckCircle size={16} color="#34D399" weight="fill" />
                    : <div style={styles.moduleNum}>{module.id}</div>
                  }
                  <span style={styles.moduleLabel}>{module.title}</span>
                </div>
                {isOpen ? <CaretDown size={14} /> : <CaretRight size={14} />}
              </button>
              {isOpen && (
                <div style={styles.lessonList}>
                  {module.lessons.map(lesson => {
                    const isActive = activeLesson?.lessonId === lesson.id
                    const isDone = completedLessons.includes(lesson.id)
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => selectLesson(module.id, lesson.id)}
                        style={{
                          ...styles.lessonBtn,
                          ...(isActive ? styles.lessonBtnActive : {}),
                        }}
                      >
                        <div style={{ ...styles.lessonDot, ...(isDone ? { background: '#34D399' } : isActive ? { background: 'var(--accent-text)' } : {}) }}>
                          {isDone && <Check size={9} color="#000" weight="bold" />}
                        </div>
                        <span style={{ flex: 1, textAlign: 'left' }}>{lesson.title}</span>
                        <span style={styles.lessonDur}>{lesson.duration}</span>
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

  return (
    <div style={{ ...styles.root, flexDirection: isMobile ? 'column' : 'row' }} className="dash-page">

      {/* ── MOBILE: barre sticky en haut ── */}
      {isMobile && (
        <div style={styles.mobileBar}>
          <Link href="/dashboard/formations" style={styles.mobileBack}>
            <ArrowLeft size={18} />
          </Link>
          <div style={styles.mobileBarCenter}>
            <span style={styles.mobileBarTitle}>{formation.title}</span>
            <div style={styles.mobileBarProgress}>
              <div style={styles.mobileBarProgressFill} className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span style={styles.mobileBarPct}>{progress}%</span>
            </div>
          </div>
          <button onClick={() => setNavOpen(v => !v)} style={styles.mobileNavToggle} aria-label="Sommaire">
            {navOpen ? <X size={20} color="var(--text)" /> : <List size={20} color="var(--text)" />}
          </button>
        </div>
      )}

      {/* ── MOBILE: drawer sommaire ── */}
      {isMobile && navOpen && (
        <div style={styles.mobileDrawer}>
          <NavContent />
        </div>
      )}

      {/* ── DESKTOP: sidebar fixe ── */}
      {!isMobile && (
        <aside style={styles.navPanel}>
          <NavContent />
        </aside>
      )}

      {/* ── CONTENU PRINCIPAL ── */}
      <main style={{ ...styles.main, ...(isMobile ? styles.mainMobile : {}) }}>
        {!activeLesson ? (
          /* Overview */
          <div style={{ ...styles.overview, ...(isMobile ? styles.overviewMobile : {}) }}>
            <div style={styles.overviewBadge} className="badge badge-yellow">
              <GraduationCap size={12} weight="fill" />
              {formation.level}
            </div>
            <h1 style={styles.overviewTitle}>{formation.title}</h1>
            <p style={styles.overviewDesc}>{formation.description}</p>

            <div style={{ ...styles.overviewMeta, ...(isMobile ? styles.overviewMetaMobile : {}) }}>
              <div style={styles.metaChip}>
                <Clock size={16} color="#FFD56B" />
                <div>
                  <div style={styles.metaVal}>{formation.duration}</div>
                  <div style={styles.metaLbl}>durée totale</div>
                </div>
              </div>
              <div style={styles.metaChip}>
                <BookOpen size={16} color="#FFD56B" />
                <div>
                  <div style={styles.metaVal}>{formation.modules.length} modules</div>
                  <div style={styles.metaLbl}>{totalLessons} leçons</div>
                </div>
              </div>
              <div style={styles.metaChip}>
                <Star size={16} color="#FFD56B" weight="fill" />
                <div>
                  <div style={styles.metaVal}>{formation.level}</div>
                  <div style={styles.metaLbl}>niveau</div>
                </div>
              </div>
            </div>

            <div style={styles.objectifBox}>
              <div style={styles.objectifTitle}>Ce que tu vas apprendre</div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {formation.objectifs.map((obj, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <CheckCircle size={16} color="#34D399" weight="fill" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.5 }}>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              className="btn-primary"
              onClick={() => {
                if (formationId) enrollInFormation(formationId)
                setActiveLesson({ moduleId: 1, lessonId: 1 })
                setOpenModules([1])
              }}
              style={{ fontSize: '15px', padding: '13px 26px', width: isMobile ? '100%' : 'auto' }}
            >
              Commencer la formation <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </div>
        ) : (
          /* Lesson content */
          <div style={{ ...styles.lessonContent, ...(isMobile ? styles.lessonContentMobile : {}) }}>
            <div style={styles.lessonBreadcrumb}>
              <span style={styles.breadcrumbModule}>Module {currentModule?.id} — {currentModule?.title}</span>
              <span style={styles.breadcrumbSep}>›</span>
              <span style={styles.breadcrumbLesson}>{currentLesson?.title}</span>
            </div>

            <div style={styles.lessonMeta}>
              <span style={styles.lessonMetaItem}>
                <Clock size={13} />
                {currentLesson?.duration}
              </span>
            </div>

            <div style={styles.lessonBody}>
              {currentLesson && renderContent(currentLesson.content)}
            </div>

            <div style={styles.lessonActions}>
              {completedLessons.includes(currentLesson!.id) ? (
                <div style={styles.doneMsg}>
                  <CheckCircle size={18} color="#34D399" weight="fill" />
                  Leçon terminée
                </div>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => markComplete(currentLesson!.id)}
                  style={{ fontSize: '14px', padding: '12px 24px', width: isMobile ? '100%' : 'auto' }}
                >
                  <Check size={16} weight="bold" />
                  Marquer comme terminé
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    minHeight: 'calc(100svh - var(--header-h))',
    padding: 0,
  },

  // ── Mobile bar ──
  mobileBar: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg)',
    position: 'sticky', top: 'var(--header-h)', zIndex: 20,
  },
  mobileBack: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '36px', height: '36px', borderRadius: '10px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-2)', flexShrink: 0,
  },
  mobileBarCenter: {
    flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '5px',
  },
  mobileBarTitle: {
    fontSize: '13px', fontWeight: 600, color: 'var(--text)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  mobileBarProgress: {
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  mobileBarProgressFill: {
    flex: 1,
  },
  mobileBarPct: {
    fontSize: '11px', color: 'var(--accent-text)', fontWeight: 600, flexShrink: 0,
  },
  mobileNavToggle: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
    background: 'var(--surface)', border: '1px solid var(--border)',
    cursor: 'pointer',
  },

  // ── Mobile drawer ──
  mobileDrawer: {
    width: '100%',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg)',
    maxHeight: '60svh',
    overflowY: 'auto',
  },

  // ── Desktop sidebar ──
  navPanel: {
    width: '280px', flexShrink: 0,
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    position: 'sticky', top: 'var(--header-h)',
    height: 'calc(100svh - var(--header-h))',
    overflowY: 'auto',
  },
  navHeader: {
    padding: '20px 16px',
    borderBottom: '1px solid var(--border)',
  },
  backLink: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', color: 'var(--text-3)',
    textDecoration: 'none', marginBottom: '16px',
    transition: 'color 0.18s',
  },
  formationTitle: {
    fontSize: '14px', fontWeight: 600, color: 'var(--text)',
    lineHeight: 1.3, marginBottom: '8px',
  },
  formationMeta: { marginBottom: '14px' },
  formationStats: {
    display: 'flex', gap: '12px',
    fontSize: '12px', color: 'var(--text-3)',
  },
  progressWrap: {},
  progressLabel: { fontSize: '11px', color: 'var(--text-3)' },
  progressPct: { fontSize: '11px', color: 'var(--accent-text)' },
  navModules: {
    flex: 1, padding: '8px 8px',
    display: 'flex', flexDirection: 'column', gap: '2px',
  },
  moduleGroup: {},
  moduleBtn: {
    width: '100%', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '8px',
    padding: '10px 10px', minHeight: '44px',
    borderRadius: '9px',
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-2)',
    transition: 'background 0.18s',
    textAlign: 'left',
  },
  moduleBtnLeft: { display: 'flex', alignItems: 'center', gap: '10px', flex: 1 },
  moduleNum: {
    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
    background: 'var(--border)', border: '1px solid var(--border-2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '10px', fontWeight: 700, color: 'var(--text-2)',
  },
  moduleLabel: { fontSize: '13px', fontWeight: 500, lineHeight: 1.3 },
  lessonList: {
    paddingLeft: '8px', paddingBottom: '4px',
    display: 'flex', flexDirection: 'column', gap: '1px',
  },
  lessonBtn: {
    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 10px', minHeight: '44px', borderRadius: '8px',
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '12px', color: 'var(--text-3)',
    transition: 'background 0.15s, color 0.15s',
    textAlign: 'left',
  },
  lessonBtnActive: {
    background: 'rgba(255,213,107,0.08)',
    color: 'var(--accent-text)',
  },
  lessonDot: {
    width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
    background: 'var(--border)', border: '1px solid var(--border-2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  lessonDur: {
    fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0,
  },

  // ── Main area ──
  main: { flex: 1, overflowY: 'auto' },
  mainMobile: { overflowY: 'visible' },

  // Overview
  overview: {
    padding: 'clamp(28px,4vw,52px)',
    maxWidth: '720px',
  },
  overviewMobile: {
    padding: '20px 16px',
    maxWidth: '100%',
  },
  overviewBadge: { marginBottom: '20px' },
  overviewTitle: {
    fontFamily: 'Fraunces, serif', fontSize: 'clamp(24px,3vw,42px)',
    fontWeight: 400, color: 'var(--text)', lineHeight: 1.15,
    marginBottom: '16px',
  },
  overviewDesc: {
    fontSize: '15px', fontWeight: 300, color: 'var(--text-2)',
    lineHeight: 1.7, marginBottom: '28px',
  },
  overviewMeta: {
    display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px',
  },
  overviewMetaMobile: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
  },
  metaChip: {
    display: 'flex', alignItems: 'center', gap: '12px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '14px 16px',
    flex: '1 1 auto',
  },
  metaVal: { fontSize: '14px', fontWeight: 600, color: 'var(--text)' },
  metaLbl: { fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' },
  objectifBox: {
    background: 'rgba(0,76,63,0.15)', border: '1px solid rgba(52,211,153,0.12)',
    borderRadius: '16px', padding: '20px',
    marginBottom: '28px',
  },
  objectifTitle: {
    fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px',
    textTransform: 'uppercase', color: 'var(--text-3)',
    marginBottom: '16px',
  },

  // Lesson content
  lessonContent: {
    padding: 'clamp(24px,4vw,52px)',
    maxWidth: '780px',
  },
  lessonContentMobile: {
    padding: '20px 16px',
    maxWidth: '100%',
  },
  lessonBreadcrumb: {
    display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px',
    marginBottom: '20px',
  },
  breadcrumbModule: { fontSize: '12px', color: 'var(--text-muted)' },
  breadcrumbSep: { fontSize: '12px', color: 'var(--text-muted)' },
  breadcrumbLesson: { fontSize: '12px', color: 'var(--text-2)', fontWeight: 500 },
  lessonMeta: {
    display: 'flex', gap: '16px', marginBottom: '28px',
  },
  lessonMetaItem: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', color: 'var(--text-3)',
  },
  lessonBody: {
    fontSize: '15px', lineHeight: 1.75, color: 'var(--text-2)',
  },
  lessonActions: {
    marginTop: '40px', paddingTop: '20px',
    borderTop: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: '16px',
    flexWrap: 'wrap',
  },
  doneMsg: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '14px', color: '#34D399', fontWeight: 500,
  },
}

// Lesson content styles
const s: Record<string, React.CSSProperties> = {
  h2: {
    fontFamily: 'Fraunces, serif', fontSize: 'clamp(20px,2.5vw,30px)',
    fontWeight: 400, color: 'var(--text)', marginBottom: '20px', marginTop: '8px',
    lineHeight: 1.2,
  },
  h3: {
    fontSize: '16px', fontWeight: 600, color: 'var(--text)',
    marginBottom: '12px', marginTop: '28px',
  },
  p: {
    marginBottom: '14px', fontSize: '15px',
    color: 'var(--text-2)', lineHeight: 1.75,
  },
  boldLine: {
    marginBottom: '10px', fontSize: '15px',
    color: 'var(--text)', lineHeight: 1.65, fontWeight: 500,
  },
  ul: { listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  li: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    fontSize: '14px', lineHeight: 1.6,
  },
  bullet: { flexShrink: 0, marginTop: '1px' },
  blockquote: {
    background: 'rgba(255,213,107,0.06)',
    border: '1px solid rgba(255,213,107,0.15)',
    borderLeft: '3px solid #FFD56B',
    borderRadius: '8px', padding: '12px 16px',
    fontSize: '14px', color: 'var(--text-2)',
    marginBottom: '16px', lineHeight: 1.6,
  },
  pre: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px', padding: '16px',
    fontSize: '13px', lineHeight: 1.65,
    color: 'var(--text-2)',
    fontFamily: 'monospace', whiteSpace: 'pre-wrap',
    overflowX: 'auto', marginBottom: '16px',
  },
  tableWrap: { overflowX: 'auto', marginBottom: '20px', borderRadius: '10px', border: '1px solid var(--border)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '10px 14px', textAlign: 'left',
    fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px',
    textTransform: 'uppercase', color: 'var(--text-3)',
    background: 'var(--surface)', borderBottom: '1px solid var(--border)',
  },
  td: {
    padding: '10px 14px', fontSize: '14px',
    color: 'var(--text-2)',
    borderBottom: '1px solid var(--surface)',
  },
}
