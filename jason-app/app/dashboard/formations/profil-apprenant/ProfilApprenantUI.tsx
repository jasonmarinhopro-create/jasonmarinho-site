'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, GraduationCap, Trophy, Flame, Clock, BookOpen, ArrowRight, Star } from '@phosphor-icons/react'

interface Formation {
  id: string
  slug: string
  title: string
  description: string | null
  duration: string | null
  level: string | null
  lessons_count: number
}

interface UserFormation {
  formation_id: string
  progress: number
  completed_lessons: number[] | null
}

interface Niveau {
  label: string
  color: string
  bg: string
  desc: string
}

interface Badge {
  id: string
  emoji: string
  label: string
  desc: string
  unlocked: boolean
}

interface Props {
  formations: Formation[]
  enrolled: UserFormation[]
  completed: UserFormation[]
  inProgress: UserFormation[]
  totalLessonsDone: number
  totalHours: number
  remainingMin: number
  streak: number
  niveau: Niveau
  badges: Badge[]
}

export default function ProfilApprenantUI(props: Props) {
  const { formations, completed, inProgress, totalLessonsDone, totalHours, remainingMin, streak, niveau, badges } = props
  const formationsById = Object.fromEntries(formations.map(f => [f.id, f]))
  const badgesUnlocked = badges.filter(b => b.unlocked)

  // Desktop detection for 2-column layout
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1100)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div style={s.page}>
      <Link href="/dashboard/formations" style={s.backLink}>
        <ArrowLeft size={14} weight="bold" />
        Toutes les formations
      </Link>

      <div style={s.intro}>
        <h1 style={s.title}>
          Mon <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>profil apprenant</em>
        </h1>
        <p style={s.desc}>Ton activité, tes badges et tes formations en cours.</p>
      </div>

      {/* Niveau hero */}
      <div style={{ ...s.niveauCard, background: niveau.bg, borderColor: `${niveau.color}40` }}>
        <div>
          <div style={s.niveauLabel}>Niveau</div>
          <div style={{ ...s.niveauValue, color: niveau.color }}>{niveau.label}</div>
          <div style={s.niveauDesc}>{niveau.desc}</div>
        </div>
        <Trophy size={48} weight="duotone" color={niveau.color} />
      </div>

      {/* Stats grid full-width */}
      <div style={s.statsGrid}>
        <div style={s.statCard}>
          <span style={{ ...s.statIcon, background: 'rgba(96,165,250,0.14)' }}>
            <BookOpen size={18} weight="fill" color="#60a5fa" />
          </span>
          <div>
            <div style={s.statValue}>{totalLessonsDone}</div>
            <div style={s.statLabel}>Leçons terminées</div>
          </div>
        </div>
        <div style={s.statCard}>
          <span style={{ ...s.statIcon, background: 'rgba(52,211,153,0.14)' }}>
            <GraduationCap size={18} weight="fill" color="#15803d" />
          </span>
          <div>
            <div style={s.statValue}>{completed.length} / {formations.length}</div>
            <div style={s.statLabel}>Formations finies</div>
          </div>
        </div>
        <div style={s.statCard}>
          <span style={{ ...s.statIcon, background: 'rgba(245,158,11,0.14)' }}>
            <Clock size={18} weight="fill" color="#d97706" />
          </span>
          <div>
            <div style={s.statValue}>{totalHours}h{remainingMin > 0 ? String(remainingMin).padStart(2, '0') : ''}</div>
            <div style={s.statLabel}>Temps estimé</div>
          </div>
        </div>
        <div style={s.statCard}>
          <span style={{ ...s.statIcon, background: streak > 0 ? 'rgba(239,68,68,0.14)' : 'var(--surface-2)' }}>
            <Flame size={18} weight="fill" color={streak > 0 ? '#dc2626' : 'var(--text-muted)'} />
          </span>
          <div>
            <div style={{ ...s.statValue, color: streak > 0 ? '#dc2626' : 'var(--text)' }}>
              {streak} {streak > 0 ? 'jours' : ''}
            </div>
            <div style={s.statLabel}>Streak actuel</div>
          </div>
        </div>
      </div>

      {/* 2-column desktop layout */}
      <div style={isDesktop ? s.mainGrid : s.mainStack}>
        <div style={s.leftCol}>
          {/* Formations en cours */}
          {inProgress.length > 0 && (
            <section style={s.section}>
              <h2 style={s.sectionTitle}>
                <BookOpen size={16} weight="fill" color="var(--accent-text)" />
                Formations en cours <span style={s.sectionCount}>{inProgress.length}</span>
              </h2>
              <div style={s.formationsList}>
                {inProgress.map(uf => {
                  const f = formationsById[uf.formation_id]
                  if (!f) return null
                  return (
                    <Link key={uf.formation_id} href={`/dashboard/formations/${f.slug}`} style={s.formationRow}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={s.formationTitle}>{f.title}</div>
                        <div style={s.formationProgressBar}>
                          <div style={{ ...s.formationProgressFill, width: `${uf.progress}%` }} />
                        </div>
                        <div style={s.formationMeta}>
                          {uf.progress}% · {(uf.completed_lessons ?? []).length} / {f.lessons_count} leçons
                        </div>
                      </div>
                      <ArrowRight size={14} weight="bold" color="var(--text-muted)" />
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Formations terminées */}
          {completed.length > 0 && (
            <section style={s.section}>
              <h2 style={s.sectionTitle}>
                <Trophy size={16} weight="fill" color="#15803d" />
                Formations terminées <span style={s.sectionCount}>{completed.length}</span>
              </h2>
              <div style={s.formationsList}>
                {completed.map(uf => {
                  const f = formationsById[uf.formation_id]
                  if (!f) return null
                  return (
                    <Link
                      key={uf.formation_id}
                      href={`/dashboard/formations/${f.slug}`}
                      style={{ ...s.formationRow, borderLeft: '3px solid #15803d' }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={s.formationTitle}>{f.title}</div>
                        <div style={{ ...s.formationMeta, color: '#15803d', fontWeight: 600 }}>
                          ✓ Terminée à 100%
                        </div>
                      </div>
                      <ArrowRight size={14} weight="bold" color="var(--text-muted)" />
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {inProgress.length === 0 && completed.length === 0 && (
            <div style={s.emptyState}>
              <BookOpen size={32} weight="duotone" color="var(--text-muted)" />
              <h3 style={s.emptyTitle}>Aucune formation commencée</h3>
              <p style={s.emptyDesc}>Lance ta première leçon pour débloquer tes badges et progresser.</p>
              <Link href="/dashboard/formations" style={s.emptyCta}>
                Découvrir les formations <ArrowRight size={13} weight="bold" />
              </Link>
            </div>
          )}
        </div>

        {/* Right column : badges */}
        <aside style={isDesktop ? s.rightColSticky : s.rightCol}>
          <section style={s.section}>
            <h2 style={s.sectionTitle}>
              <Star size={16} weight="fill" color="var(--accent-text)" />
              Badges <span style={s.sectionCount}>{badgesUnlocked.length} / {badges.length}</span>
            </h2>
            <div style={s.badgesList}>
              {badges.map(b => (
                <div
                  key={b.id}
                  style={{
                    ...s.badgeCard,
                    opacity: b.unlocked ? 1 : 0.45,
                    borderColor: b.unlocked ? 'var(--accent-border)' : 'var(--border)',
                    background: b.unlocked ? 'var(--accent-bg)' : 'var(--surface)',
                  }}
                >
                  <span style={s.badgeEmoji}>{b.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.badgeLabel}>{b.label}</div>
                    <div style={s.badgeDesc}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  backLink: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--text-2)', textDecoration: 'none', marginBottom: '20px' },
  intro: { marginBottom: '24px' },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(24px,3vw,38px)', fontWeight: 400, color: 'var(--text)', marginBottom: '8px' },
  desc: { fontSize: '14px', color: 'var(--text-2)', maxWidth: '520px', lineHeight: 1.6 },

  niveauCard: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
    padding: 'clamp(20px,3vw,28px) clamp(20px,3vw,32px)',
    border: '1px solid', borderRadius: '18px', marginBottom: '16px',
  },
  niveauLabel: { fontSize: '11px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase', color: 'var(--text-2)' },
  niveauValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(24px,3vw,32px)', fontWeight: 500, lineHeight: 1.1, marginTop: '4px' },
  niveauDesc: { fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px', marginBottom: '24px',
  },
  statCard: {
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '16px 20px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px',
  },
  statIcon: { width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: '22px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.1 },
  statLabel: { fontSize: '12px', fontWeight: 500, color: 'var(--text-2)', marginTop: '3px' },

  // 2-column desktop
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 360px',
    gap: '24px',
    alignItems: 'start',
  },
  mainStack: {
    display: 'flex', flexDirection: 'column' as const, gap: '24px',
  },
  leftCol: { display: 'flex', flexDirection: 'column' as const, gap: '24px', minWidth: 0 },
  rightCol: { display: 'flex', flexDirection: 'column' as const, gap: '20px' },
  rightColSticky: {
    display: 'flex', flexDirection: 'column' as const, gap: '20px',
    position: 'sticky' as const, top: '20px',
  },

  section: {},
  sectionTitle: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontFamily: 'var(--font-fraunces), serif', fontSize: '17px', fontWeight: 500,
    color: 'var(--text)', margin: '0 0 14px',
  },
  sectionCount: { fontSize: '12px', fontWeight: 500, color: 'var(--text-2)', marginLeft: '4px' },

  // Badges
  badgesList: {
    display: 'flex', flexDirection: 'column' as const, gap: '8px',
  },
  badgeCard: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 14px', border: '1px solid', borderRadius: '12px',
    transition: 'opacity 0.15s',
  },
  badgeEmoji: { fontSize: '26px', flexShrink: 0, lineHeight: 1 },
  badgeLabel: { fontSize: '13px', fontWeight: 600, color: 'var(--text)' },
  badgeDesc: { fontSize: '11.5px', fontWeight: 400, color: 'var(--text-2)', marginTop: '2px', lineHeight: 1.4 },

  // Formations
  formationsList: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  formationRow: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 16px',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px',
    textDecoration: 'none' as const, color: 'var(--text-2)',
  },
  formationTitle: { fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' },
  formationProgressBar: {
    height: '6px', background: 'var(--surface-2)', borderRadius: '3px',
    overflow: 'hidden' as const, marginBottom: '6px',
  },
  formationProgressFill: {
    height: '100%', background: 'linear-gradient(90deg, var(--accent-text), #15803d)', borderRadius: '3px',
  },
  formationMeta: { fontSize: '11.5px', color: 'var(--text-2)', fontWeight: 500 },

  // Empty state
  emptyState: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
    gap: '12px', padding: '48px 24px',
    background: 'var(--surface)', border: '1px dashed var(--border-2)', borderRadius: '16px',
    textAlign: 'center' as const,
  },
  emptyTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', fontWeight: 500, color: 'var(--text)', margin: 0 },
  emptyDesc: { fontSize: '13.5px', color: 'var(--text-2)', margin: 0, maxWidth: '380px', lineHeight: 1.5 },
  emptyCta: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '10px 16px', borderRadius: '10px',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' as const,
  },
}
