'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, GraduationCap, UsersFour, CalendarBlank,
  BookmarkSimple, PencilSimple, Flag, Lightbulb, Lightning,
  Pencil, Check, X, Note, SpinnerGap, EnvelopeSimple,
  ArrowClockwise,
} from '@phosphor-icons/react'
import { updateAdminNotes, changeUserPlan } from '../../actions'

// ── Types ──────────────────────────────────────────────────────────────────
interface MemberProfile {
  id: string
  email: string
  full_name: string | null
  role: string
  driing_status: string
  plan: string
  created_at: string
  admin_notes: string | null
}

interface UserFormation {
  id: string
  progress: number
  enrolled_at: string
  completed_at: string | null
  formation: {
    id: string
    title: string
    slug: string
    duration: string | null
    level: string | null
  } | null
}

interface MemberStats {
  voyageurs: number
  sejours: number
  favorites: number
  customizations: number
  signalements: number
  suggestions: number
}

interface Props {
  profile: MemberProfile
  formations: UserFormation[]
  stats: MemberStats
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const PLAN_CFG: Record<string, { label: string; color: string; bg: string }> = {
  driing:     { label: 'Membre Driing', color: '#FFD56B', bg: 'rgba(255,213,107,0.12)' },
  decouverte: { label: 'Découverte',    color: 'var(--text-3)', bg: 'var(--surface-2)' },
}

// ── Main component ──────────────────────────────────────────────────────────
export default function MembreDetailUI({ profile, formations, stats }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Coaching notes
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState(profile.admin_notes ?? '')
  const [notesSaved, setNotesSaved] = useState(false)
  const [notesError, setNotesError] = useState('')

  // Plan change feedback
  const [planFeedback, setPlanFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  const planCfg = PLAN_CFG[profile.plan ?? 'decouverte'] ?? PLAN_CFG.decouverte

  const initials = profile.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : profile.email[0].toUpperCase()

  function saveNotes() {
    setNotesError('')
    startTransition(async () => {
      const res = await updateAdminNotes(profile.id, notes)
      if (res.error) {
        setNotesError(String(res.error))
        return
      }
      setEditingNotes(false)
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 3000)
    })
  }

  function cancelNotes() {
    setNotes(profile.admin_notes ?? '')
    setEditingNotes(false)
    setNotesError('')
  }

  function handlePlanChange(newPlan: string) {
    startTransition(async () => {
      const res = await changeUserPlan(profile.id, newPlan)
      if (res.error) {
        setPlanFeedback({ type: 'err', msg: String(res.error) })
      } else {
        setPlanFeedback({ type: 'ok', msg: 'Plan mis à jour' })
        router.refresh()
      }
      setTimeout(() => setPlanFeedback(null), 3000)
    })
  }

  const completedFormations = formations.filter(f => f.progress === 100)
  const inProgressFormations = formations.filter(f => f.progress > 0 && f.progress < 100)
  const notStartedFormations = formations.filter(f => f.progress === 0)

  const statTiles = [
    { icon: <UsersFour size={16} />, value: stats.voyageurs,      label: 'Voyageurs',       color: '#93C5FD' },
    { icon: <CalendarBlank size={16} />, value: stats.sejours,    label: 'Séjours',          color: '#34D399' },
    { icon: <BookmarkSimple size={16} />, value: stats.favorites,  label: 'Gabarits favoris', color: '#FFD56B' },
    { icon: <PencilSimple size={16} />, value: stats.customizations, label: 'Gabarits perso.', color: '#C084FC' },
    { icon: <Flag size={16} />, value: stats.signalements,        label: 'Signalements',     color: '#f87171' },
    { icon: <Lightbulb size={16} />, value: stats.suggestions,    label: 'Suggestions',      color: '#FB923C' },
  ]

  return (
    <div style={s.page}>

      {/* ── Back button ── */}
      <button onClick={() => router.push('/dashboard/admin/membres')} style={s.backBtn}>
        <ArrowLeft size={16} />
        Membres
      </button>

      {/* ── Profile card ── */}
      <div style={s.profileCard} className="glass-card fade-up">
        <div style={s.bigAvatar}>
          <span style={s.bigAvatarText}>{initials}</span>
        </div>
        <div style={s.profileInfo}>
          <div style={s.profileNameRow}>
            <h1 style={s.profileName}>{profile.full_name || '—'}</h1>
            {profile.role === 'admin' && (
              <span style={{ ...s.pill, background: 'rgba(192,132,252,0.12)', color: '#C084FC' }}>Admin</span>
            )}
          </div>
          <a href={`mailto:${profile.email}`} style={s.emailLink}>
            <EnvelopeSimple size={13} />
            {profile.email}
          </a>
          <div style={s.profileMeta}>
            <span style={{ ...s.pill, background: planCfg.bg, color: planCfg.color }}>
              <Lightning size={11} weight="fill" />
              {planCfg.label}
            </span>
            <span style={s.memberSince}>Membre depuis le {formatDate(profile.created_at)}</span>
          </div>
        </div>

        {/* Plan selector */}
        <div style={s.planSelector}>
          {planFeedback ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
              color: planFeedback.type === 'ok' ? '#34D399' : '#f87171',
              background: planFeedback.type === 'ok' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
            }}>
              {planFeedback.msg}
            </div>
          ) : (
            <select
              value={profile.plan || 'decouverte'}
              disabled={isPending || profile.role === 'admin'}
              onChange={e => handlePlanChange(e.target.value)}
              style={{
                background: planCfg.bg, color: planCfg.color,
                border: `1px solid ${planCfg.color}30`,
                borderRadius: '10px', padding: '8px 12px',
                fontSize: '13px', fontWeight: 600,
                cursor: (isPending || profile.role === 'admin') ? 'not-allowed' : 'pointer',
                outline: 'none', fontFamily: 'var(--font-outfit), sans-serif',
                opacity: profile.role === 'admin' ? 0.4 : 1,
              }}
            >
              <option value="decouverte" style={{ background: '#040d0b', color: '#f0f4ff' }}>Découverte</option>
              <option value="driing" style={{ background: '#040d0b', color: '#FFD56B' }}>Membre Driing</option>
            </select>
          )}
        </div>
      </div>

      {/* ── Coaching notes ── */}
      <div style={s.section} className="fade-up">
        <div style={s.sectionHeader}>
          <div style={s.sectionTitle}>
            <Note size={16} color="var(--accent-text)" />
            Notes de coaching
            <span style={s.sectionSubtitle}>Privé — visible uniquement par toi</span>
          </div>
          {!editingNotes && (
            <button onClick={() => setEditingNotes(true)} style={s.editBtn}>
              <Pencil size={13} />
              Modifier
            </button>
          )}
        </div>

        {editingNotes ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={s.notesTextarea}
              rows={6}
              placeholder={`Objectifs de ${profile.full_name || 'ce membre'}, points de suivi, prochaines étapes, conseils personnalisés…`}
              autoFocus
            />
            {notesError && <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{notesError}</p>}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={cancelNotes} style={s.ghostBtn} disabled={isPending}>
                <X size={13} />
                Annuler
              </button>
              <button onClick={saveNotes} style={s.primaryBtn} disabled={isPending}>
                {isPending
                  ? <><ArrowClockwise size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Enregistrement…</>
                  : <><Check size={13} /> Sauvegarder</>
                }
              </button>
            </div>
          </div>
        ) : (
          <div>
            {notesSaved && (
              <div style={s.savedBanner}>
                <Check size={13} weight="bold" />
                Notes sauvegardées
              </div>
            )}
            {notes ? (
              <p style={s.notesText}>{notes}</p>
            ) : (
              <button onClick={() => setEditingNotes(true)} style={s.emptyNotesBtn}>
                <Pencil size={14} />
                Ajouter des notes sur {profile.full_name || 'ce membre'}…
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Activité stats ── */}
      <div style={s.section} className="fade-up">
        <div style={s.sectionHeader}>
          <div style={s.sectionTitle}>
            <UsersFour size={16} color="var(--text-3)" />
            Activité sur la plateforme
          </div>
        </div>
        <div style={s.statsGrid}>
          {statTiles.map(tile => (
            <div key={tile.label} style={{ ...s.statTile, borderColor: `${tile.color}25`, background: `${tile.color}08` }}>
              <span style={{ color: tile.color }}>{tile.icon}</span>
              <span style={{
                fontFamily: 'var(--font-fraunces), serif', fontSize: '26px', fontWeight: 400,
                color: tile.value > 0 ? 'var(--text)' : 'var(--text-muted)', lineHeight: 1,
              }}>
                {tile.value}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: '1.3' }}>{tile.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Formations ── */}
      <div style={s.section} className="fade-up">
        <div style={s.sectionHeader}>
          <div style={s.sectionTitle}>
            <GraduationCap size={16} color="var(--text-3)" />
            Formations ({formations.length})
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {completedFormations.length > 0 && (
              <span style={{ ...s.pill, background: 'rgba(52,211,153,0.1)', color: '#34D399' }}>
                {completedFormations.length} terminée{completedFormations.length > 1 ? 's' : ''}
              </span>
            )}
            {inProgressFormations.length > 0 && (
              <span style={{ ...s.pill, background: 'rgba(255,213,107,0.1)', color: '#FFD56B' }}>
                {inProgressFormations.length} en cours
              </span>
            )}
          </div>
        </div>

        {formations.length === 0 ? (
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
            Aucune formation commencée.
          </p>
        ) : (
          <div style={s.formationsList}>
            {formations.map(uf => (
              <div key={uf.id} style={s.formationItem}>
                <div style={{
                  width: '36px', height: '36px', flexShrink: 0, borderRadius: '10px',
                  background: uf.progress === 100 ? 'rgba(52,211,153,0.12)' : 'rgba(255,213,107,0.08)',
                  border: `1px solid ${uf.progress === 100 ? 'rgba(52,211,153,0.2)' : 'rgba(255,213,107,0.15)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {uf.progress === 100
                    ? <Check size={16} color="#34D399" weight="bold" />
                    : <GraduationCap size={16} color="var(--accent-text)" />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.formationTitle}>{uf.formation?.title ?? 'Formation inconnue'}</div>
                  <div style={s.formationMeta}>
                    <span>Inscrit le {formatDateShort(uf.enrolled_at)}</span>
                    {uf.formation?.level && (
                      <span style={s.levelBadge}>{uf.formation.level}</span>
                    )}
                    {uf.formation?.duration && (
                      <span style={{ color: 'var(--text-muted)' }}>{uf.formation.duration}</span>
                    )}
                  </div>
                  <div style={s.progressWrap}>
                    <div style={s.progressBar}>
                      <div style={{
                        height: '100%', borderRadius: '100px',
                        width: `${uf.progress}%`,
                        background: uf.progress === 100
                          ? 'linear-gradient(90deg, #34D399, #10B981)'
                          : 'linear-gradient(90deg, var(--accent-text), #FFB347)',
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                    <span style={{
                      fontSize: '12px', fontWeight: 600, minWidth: '36px', textAlign: 'right',
                      color: uf.progress === 100 ? '#34D399' : 'var(--accent-text)',
                    }}>
                      {uf.progress}%
                    </span>
                    {uf.progress === 100 && (
                      <span style={{ ...s.pill, background: 'rgba(52,211,153,0.12)', color: '#34D399', fontSize: '10px', padding: '2px 7px' }}>
                        Terminée
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: '16px' },

  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '13px', color: 'var(--text-3)', padding: '4px 0',
    transition: 'color 0.15s', fontFamily: 'var(--font-outfit), sans-serif',
  },

  profileCard: {
    display: 'flex', alignItems: 'flex-start', gap: '20px',
    padding: '24px', borderRadius: '20px', flexWrap: 'wrap',
  },
  bigAvatar: {
    width: '64px', height: '64px', flexShrink: 0, borderRadius: '50%',
    background: 'rgba(0,76,63,0.6)',
    border: '2px solid rgba(255,213,107,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  bigAvatarText: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '22px', fontWeight: 600, color: 'var(--accent-text)',
  },
  profileInfo: { flex: 1, minWidth: 0 },
  profileNameRow: {
    display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px',
  },
  profileName: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(20px,2.5vw,28px)',
    fontWeight: 400, color: 'var(--text)', margin: 0,
  },
  emailLink: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', color: 'var(--text-3)', textDecoration: 'none',
    marginBottom: '10px',
  },
  profileMeta: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  memberSince: { fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' },
  planSelector: { display: 'flex', alignItems: 'flex-start', flexShrink: 0 },

  pill: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '11px', fontWeight: 600,
    padding: '3px 9px', borderRadius: '100px',
    whiteSpace: 'nowrap' as const,
  },

  section: {
    background: 'var(--surface)', border: '1px solid var(--surface-2)',
    borderRadius: '18px', padding: '22px',
  },
  sectionHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '18px', flexWrap: 'wrap', gap: '8px',
  },
  sectionTitle: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '14px', fontWeight: 500, color: 'var(--text-2)',
  },
  sectionSubtitle: {
    fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400, fontStyle: 'italic',
  },
  editBtn: {
    display: 'flex', alignItems: 'center', gap: '5px',
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-outfit), sans-serif',
    transition: 'color 0.15s',
  },

  notesTextarea: {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '14px 16px',
    fontSize: '14px', color: 'var(--text)', lineHeight: '1.7',
    fontFamily: 'var(--font-outfit), sans-serif', resize: 'vertical',
    outline: 'none',
  } as React.CSSProperties,
  notesText: {
    fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.8', margin: 0,
    whiteSpace: 'pre-wrap' as const,
  },
  emptyNotesBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    background: 'none',
    border: '1px dashed var(--border)',
    borderRadius: '10px', padding: '10px 16px',
    fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif', transition: 'all 0.15s',
  },
  savedBanner: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', color: '#34D399', marginBottom: '12px',
  },

  primaryBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'rgba(255,213,107,0.12)', border: '1px solid rgba(255,213,107,0.25)',
    borderRadius: '10px', padding: '8px 16px',
    fontSize: '13px', fontWeight: 600, color: 'var(--accent-text)',
    cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif', transition: 'all 0.15s',
  },
  ghostBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'none', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '8px 14px',
    fontSize: '13px', color: 'var(--text-3)', cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif', transition: 'all 0.15s',
  },

  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
  },
  statTile: {
    display: 'flex', flexDirection: 'column', gap: '5px',
    padding: '14px 12px', border: '1px solid',
    borderRadius: '12px',
  },

  formationsList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formationItem: { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  formationTitle: {
    fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  formationMeta: {
    display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
    fontSize: '12px', color: 'var(--text-3)', marginBottom: '8px',
  },
  levelBadge: {
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: '100px', padding: '1px 7px',
    fontSize: '11px', color: 'var(--text-muted)',
  },
  progressWrap: {
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  progressBar: {
    flex: 1, height: '5px', background: 'var(--border)',
    borderRadius: '100px', overflow: 'hidden',
  },
}
