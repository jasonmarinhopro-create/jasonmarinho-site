'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Trash, FloppyDisk, DownloadSimple,
  PencilSimple, BookOpen, GraduationCap, Warning, Check,
  CaretDown, CaretRight, Eye
} from '@phosphor-icons/react'
import {
  updateFormationMeta, upsertModule, upsertLesson,
  deleteModule, deleteLesson, importStaticContent,
} from './actions'

interface DbLesson {
  id: string
  lesson_number: number
  title: string
  duration: string
  content: string
}

interface DbModule {
  id: string
  module_number: number
  title: string
  duration: string
  lessons: DbLesson[]
}

interface Formation {
  id: string
  slug: string
  title: string
  description: string
  duration: string
  level: string
  objectifs?: string[] | null
  is_published: boolean
}

interface StaticLesson { id: number; title: string; duration: string; content: string }
interface StaticModule { id: number; title: string; duration: string; lessons: StaticLesson[] }
interface StaticContent { title: string; description: string; duration: string; level: string; objectifs: string[]; modules: StaticModule[] }

interface Props {
  formation: Formation
  dbModules: DbModule[]
  staticContent: StaticContent | null
  slug: string
}

type Tab = 'infos' | 'contenu'
type Feedback = { type: 'ok' | 'err'; msg: string } | null

const LEVEL_OPTIONS = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
]

export default function FormationEditor({ formation, dbModules: initialModules, staticContent, slug }: Props) {
  const [tab, setTab] = useState<Tab>('infos')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<Feedback>(null)

  // Metadata state
  const [title, setTitle] = useState(formation.title)
  const [description, setDescription] = useState(formation.description)
  const [duration, setDuration] = useState(formation.duration)
  const [level, setLevel] = useState(formation.level)
  const [objectifs, setObjectifs] = useState<string[]>(
    (formation.objectifs && formation.objectifs.length > 0)
      ? formation.objectifs
      : (staticContent?.objectifs ?? [''])
  )

  // Modules state
  const [modules, setModules] = useState<DbModule[]>(initialModules)

  // Selected lesson for editing
  const [selectedLesson, setSelectedLesson] = useState<{
    moduleId: string
    lessonId: string | null
    isNew: boolean
    moduleNumber: number
    lessonNumber: number
    title: string
    duration: string
    content: string
  } | null>(null)

  // Module expansion
  const [openModules, setOpenModules] = useState<string[]>(initialModules.map(m => m.id))

  // New module form
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [newModuleDuration, setNewModuleDuration] = useState('30 min')
  const [showNewModule, setShowNewModule] = useState(false)

  function fb(type: 'ok' | 'err', msg: string) {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  // ── Metadata save ────────────────────────────────────────────

  function handleSaveMeta() {
    startTransition(async () => {
      const filtered = objectifs.filter(o => o.trim())
      const res = await updateFormationMeta(formation.id, slug, {
        title, description, duration, level, objectifs: filtered,
      })
      if (res.success) fb('ok', 'Informations sauvegardées ✓')
      else fb('err', res.error ?? 'Erreur')
    })
  }

  // ── Import static content ────────────────────────────────────

  function handleImport() {
    if (!staticContent) return
    if (!confirm(`Importer le contenu statique dans la base de données ? Cela remplacera les modules et leçons existants pour cette formation.`)) return
    startTransition(async () => {
      const res = await importStaticContent(formation.id, slug, staticContent.modules)
      if (res.success) {
        // Rebuild modules from static content with temp IDs (page will reload on next action)
        const built: DbModule[] = staticContent.modules.map((m, mi) => ({
          id: `temp-${mi}`,
          module_number: m.id,
          title: m.title,
          duration: m.duration,
          lessons: m.lessons.map((l, li) => ({
            id: `temp-${mi}-${li}`,
            lesson_number: l.id,
            title: l.title,
            duration: l.duration,
            content: l.content,
          })),
        }))
        setModules(built)
        setOpenModules(built.map(m => m.id))
        fb('ok', `${staticContent.modules.length} modules importés ✓ — Rechargez la page pour éditer les leçons`)
      } else {
        fb('err', res.error ?? 'Erreur lors de l\'import')
      }
    })
  }

  // ── Add module ───────────────────────────────────────────────

  function handleAddModule() {
    if (!newModuleTitle.trim()) return
    const nextNumber = modules.length > 0 ? Math.max(...modules.map(m => m.module_number)) + 1 : 1
    startTransition(async () => {
      const res = await upsertModule(formation.id, slug, nextNumber, newModuleTitle.trim(), newModuleDuration)
      if (res.success && res.id) {
        const newMod: DbModule = {
          id: res.id,
          module_number: nextNumber,
          title: newModuleTitle.trim(),
          duration: newModuleDuration,
          lessons: [],
        }
        setModules(prev => [...prev, newMod])
        setOpenModules(prev => [...prev, res.id!])
        setNewModuleTitle('')
        setNewModuleDuration('30 min')
        setShowNewModule(false)
        fb('ok', 'Module créé ✓')
      } else {
        fb('err', res.error ?? 'Erreur')
      }
    })
  }

  // ── Save module ──────────────────────────────────────────────

  function handleSaveModule(mod: DbModule) {
    startTransition(async () => {
      const res = await upsertModule(formation.id, slug, mod.module_number, mod.title, mod.duration)
      if (res.success) fb('ok', 'Module sauvegardé ✓')
      else fb('err', res.error ?? 'Erreur')
    })
  }

  // ── Delete module ────────────────────────────────────────────

  function handleDeleteModule(moduleId: string) {
    if (!confirm('Supprimer ce module et toutes ses leçons ? Cette action est irréversible.')) return
    startTransition(async () => {
      const res = await deleteModule(moduleId, slug)
      if (res.success) {
        setModules(prev => prev.filter(m => m.id !== moduleId))
        if (selectedLesson?.moduleId === moduleId) setSelectedLesson(null)
        fb('ok', 'Module supprimé')
      } else {
        fb('err', res.error ?? 'Erreur')
      }
    })
  }

  // ── Select/open lesson for editing ───────────────────────────

  function openLesson(mod: DbModule, lesson: DbLesson) {
    setSelectedLesson({
      moduleId: mod.id,
      lessonId: lesson.id,
      isNew: false,
      moduleNumber: mod.module_number,
      lessonNumber: lesson.lesson_number,
      title: lesson.title,
      duration: lesson.duration,
      content: lesson.content,
    })
  }

  function openNewLesson(mod: DbModule) {
    const nextNumber = mod.lessons.length > 0 ? Math.max(...mod.lessons.map(l => l.lesson_number)) + 1 : 1
    setSelectedLesson({
      moduleId: mod.id,
      lessonId: null,
      isNew: true,
      moduleNumber: mod.module_number,
      lessonNumber: nextNumber,
      title: '',
      duration: '15 min',
      content: '',
    })
  }

  // ── Save lesson ──────────────────────────────────────────────

  function handleSaveLesson() {
    if (!selectedLesson) return
    startTransition(async () => {
      const res = await upsertLesson(
        selectedLesson.moduleId,
        slug,
        selectedLesson.lessonNumber,
        selectedLesson.title,
        selectedLesson.duration,
        selectedLesson.content,
      )
      if (res.success && res.id) {
        const saved: DbLesson = {
          id: res.id,
          lesson_number: selectedLesson.lessonNumber,
          title: selectedLesson.title,
          duration: selectedLesson.duration,
          content: selectedLesson.content,
        }
        setModules(prev => prev.map(m => {
          if (m.id !== selectedLesson.moduleId) return m
          const exists = m.lessons.find(l => l.lesson_number === selectedLesson.lessonNumber)
          const lessons = exists
            ? m.lessons.map(l => l.lesson_number === selectedLesson.lessonNumber ? saved : l)
            : [...m.lessons, saved].sort((a, b) => a.lesson_number - b.lesson_number)
          return { ...m, lessons }
        }))
        setSelectedLesson(prev => prev ? { ...prev, lessonId: res.id!, isNew: false } : null)
        fb('ok', 'Leçon sauvegardée ✓')
      } else {
        fb('err', res.error ?? 'Erreur')
      }
    })
  }

  // ── Delete lesson ────────────────────────────────────────────

  function handleDeleteLesson() {
    if (!selectedLesson?.lessonId) return
    if (!confirm('Supprimer cette leçon ? Cette action est irréversible.')) return
    startTransition(async () => {
      const res = await deleteLesson(selectedLesson.lessonId!, slug)
      if (res.success) {
        setModules(prev => prev.map(m => {
          if (m.id !== selectedLesson.moduleId) return m
          return { ...m, lessons: m.lessons.filter(l => l.lesson_number !== selectedLesson.lessonNumber) }
        }))
        setSelectedLesson(null)
        fb('ok', 'Leçon supprimée')
      } else {
        fb('err', res.error ?? 'Erreur')
      }
    })
  }

  // ── Objectifs helpers ────────────────────────────────────────

  function updateObjectif(i: number, val: string) {
    setObjectifs(prev => prev.map((o, j) => j === i ? val : o))
  }

  function addObjectif() {
    setObjectifs(prev => [...prev, ''])
  }

  function removeObjectif(i: number) {
    setObjectifs(prev => prev.filter((_, j) => j !== i))
  }

  // ────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────

  return (
    <div style={s.root}>
      {/* Top bar */}
      <div style={s.topBar}>
        <Link href="/dashboard/admin/formations" style={s.backLink}>
          <ArrowLeft size={15} />
          Formations
        </Link>
        <div style={s.topBarRight}>
          {modules.length > 0 && (
            <Link
              href={`/dashboard/formations/${slug}`}
              target="_blank"
              style={{ ...s.btn, background: 'var(--surface)', color: 'var(--text-3)', border: '1px solid var(--border)' }}
            >
              <Eye size={14} />
              Aperçu
            </Link>
          )}
          {staticContent && modules.length === 0 && (
            <button onClick={handleImport} disabled={isPending} style={{ ...s.btn, background: 'rgba(255,213,107,0.12)', color: 'var(--accent-text)', border: '1px solid rgba(255,213,107,0.25)' }}>
              <DownloadSimple size={14} />
              Importer le contenu existant
            </button>
          )}
          {staticContent && modules.length > 0 && (
            <button onClick={handleImport} disabled={isPending} style={{ ...s.btnSmall, color: 'var(--text-muted)' }}>
              <DownloadSimple size={13} />
              Réimporter depuis le fichier
            </button>
          )}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{
          margin: '0 clamp(16px,3vw,32px) 12px',
          padding: '10px 14px', borderRadius: '10px', border: '1px solid',
          background: feedback.type === 'ok' ? 'rgba(99,214,131,0.12)' : 'rgba(239,68,68,0.12)',
          borderColor: feedback.type === 'ok' ? 'rgba(99,214,131,0.25)' : 'rgba(239,68,68,0.25)',
          color: feedback.type === 'ok' ? '#63D683' : '#f87171',
          fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          {feedback.type === 'ok' ? <Check size={14} /> : <Warning size={14} />}
          {feedback.msg}
        </div>
      )}

      {/* Tabs */}
      <div style={s.tabBar}>
        {(['infos', 'contenu'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ ...s.tabBtn, ...(tab === t ? s.tabBtnActive : {}) }}
          >
            {t === 'infos' ? <><PencilSimple size={14} />Informations</> : <><BookOpen size={14} />Contenu</>}
          </button>
        ))}
      </div>

      {/* ── TAB: INFOS ── */}
      {tab === 'infos' && (
        <div style={s.section}>
          <div style={s.formGrid}>
            <div style={s.formGroup}>
              <label style={s.label}>Titre</label>
              <input
                style={s.input}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Titre de la formation"
              />
            </div>

            <div style={{ ...s.formGroup, gridColumn: '1 / -1' }}>
              <label style={s.label}>Description</label>
              <textarea
                style={{ ...s.input, minHeight: '90px', resize: 'vertical' }}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description courte visible sur la page formation"
              />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Durée totale</label>
              <input
                style={s.input}
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="ex : 2h30"
              />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Niveau</label>
              <select style={s.input} value={level} onChange={e => setLevel(e.target.value)}>
                {LEVEL_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div style={{ ...s.formGroup, gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ ...s.label, margin: 0 }}>Objectifs pédagogiques</label>
                <button onClick={addObjectif} style={s.btnSmall}>
                  <Plus size={12} />
                  Ajouter
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {objectifs.map((o, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      style={{ ...s.input, flex: 1 }}
                      value={o}
                      onChange={e => updateObjectif(i, e.target.value)}
                      placeholder={`Objectif ${i + 1}`}
                    />
                    <button
                      onClick={() => removeObjectif(i)}
                      style={{ ...s.iconBtn, color: 'rgba(239,68,68,0.6)' }}
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button onClick={handleSaveMeta} disabled={isPending} style={s.btnPrimary}>
              <FloppyDisk size={14} />
              Sauvegarder les informations
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: CONTENU ── */}
      {tab === 'contenu' && (
        <div style={s.contentLayout}>
          {/* Left: Module tree */}
          <div style={s.moduleTree}>
            <div style={s.treeHeader}>
              <span style={s.treeHeaderLabel}>
                <GraduationCap size={14} />
                Structure
              </span>
              <button onClick={() => setShowNewModule(v => !v)} style={s.btnSmall}>
                <Plus size={12} />
                Module
              </button>
            </div>

            {/* New module form */}
            {showNewModule && (
              <div style={s.newModuleForm}>
                <input
                  style={s.input}
                  value={newModuleTitle}
                  onChange={e => setNewModuleTitle(e.target.value)}
                  placeholder="Titre du module"
                  autoFocus
                />
                <input
                  style={s.input}
                  value={newModuleDuration}
                  onChange={e => setNewModuleDuration(e.target.value)}
                  placeholder="Durée (ex: 30 min)"
                />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={handleAddModule} disabled={isPending || !newModuleTitle.trim()} style={{ ...s.btnPrimary, flex: 1, justifyContent: 'center' }}>
                    Créer
                  </button>
                  <button onClick={() => setShowNewModule(false)} style={{ ...s.btn, color: 'var(--text-muted)' }}>
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {modules.length === 0 && !showNewModule && (
              <div style={s.emptyTree}>
                {staticContent ? (
                  <>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      Aucun contenu en base. Importez le contenu existant ou créez des modules.
                    </p>
                    <button onClick={handleImport} disabled={isPending} style={s.btnPrimary}>
                      <DownloadSimple size={14} />
                      Importer le contenu existant
                    </button>
                  </>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Aucun module. Créez le premier module ci-dessus.
                  </p>
                )}
              </div>
            )}

            {/* Module list */}
            {modules.map(mod => {
              const isOpen = openModules.includes(mod.id)
              return (
                <div key={mod.id} style={s.moduleItem}>
                  <div style={s.moduleRow}>
                    <button
                      onClick={() => setOpenModules(prev =>
                        prev.includes(mod.id) ? prev.filter(x => x !== mod.id) : [...prev, mod.id]
                      )}
                      style={s.moduleCaret}
                    >
                      {isOpen ? <CaretDown size={12} /> : <CaretRight size={12} />}
                    </button>

                    <div style={s.moduleInfo}>
                      {/* Inline edit for module */}
                      <ModuleEditRow
                        mod={mod}
                        onSave={handleSaveModule}
                        onDelete={() => handleDeleteModule(mod.id)}
                        isPending={isPending}
                      />
                    </div>
                  </div>

                  {isOpen && (
                    <div style={s.lessonList}>
                      {mod.lessons.map(lesson => {
                        const isActive = selectedLesson?.lessonId === lesson.id
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => openLesson(mod, lesson)}
                            style={{
                              ...s.lessonBtn,
                              ...(isActive ? s.lessonBtnActive : {}),
                            }}
                          >
                            <span style={s.lessonNum}>{lesson.lesson_number}</span>
                            <span style={{ flex: 1, textAlign: 'left', fontSize: '12px' }}>{lesson.title}</span>
                            <span style={s.lessonDur}>{lesson.duration}</span>
                          </button>
                        )
                      })}
                      <button
                        onClick={() => openNewLesson(mod)}
                        style={s.addLessonBtn}
                      >
                        <Plus size={11} />
                        Ajouter une leçon
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Right: Lesson editor */}
          <div style={s.lessonEditor}>
            {!selectedLesson ? (
              <div style={s.lessonPlaceholder}>
                <BookOpen size={32} color="var(--text-muted)" />
                <p>Sélectionnez une leçon pour l'éditer</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  ou créez-en une nouvelle depuis la liste des modules
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Titre de la leçon</label>
                    <input
                      style={s.input}
                      value={selectedLesson.title}
                      onChange={e => setSelectedLesson(prev => prev ? { ...prev, title: e.target.value } : null)}
                      placeholder="Titre"
                    />
                  </div>
                  <div style={{ width: '110px' }}>
                    <label style={s.label}>Durée</label>
                    <input
                      style={s.input}
                      value={selectedLesson.duration}
                      onChange={e => setSelectedLesson(prev => prev ? { ...prev, duration: e.target.value } : null)}
                      placeholder="15 min"
                    />
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label style={{ ...s.label, marginBottom: '6px' }}>
                    Contenu (Markdown)
                    <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '8px' }}>
                      — ## Titre, ### Sous-titre, **gras**, *italique*, - liste, &gt; citation
                    </span>
                  </label>
                  <textarea
                    style={{
                      ...s.input,
                      flex: 1,
                      minHeight: '400px',
                      resize: 'vertical',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      lineHeight: 1.6,
                    }}
                    value={selectedLesson.content}
                    onChange={e => setSelectedLesson(prev => prev ? { ...prev, content: e.target.value } : null)}
                    placeholder={`## Introduction\n\nÉcris le contenu de ta leçon ici...\n\n## Section 1\n\nContenu...\n\n- Point 1\n- Point 2\n\n> Citation importante`}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleSaveLesson}
                    disabled={isPending || !selectedLesson.title.trim()}
                    style={s.btnPrimary}
                  >
                    <FloppyDisk size={14} />
                    Sauvegarder la leçon
                  </button>
                  {selectedLesson.lessonId && (
                    <button
                      onClick={handleDeleteLesson}
                      disabled={isPending}
                      style={{ ...s.btn, color: 'rgba(239,68,68,0.7)', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      <Trash size={14} />
                      Supprimer
                    </button>
                  )}
                  <button onClick={() => setSelectedLesson(null)} style={{ ...s.btn, color: 'var(--text-muted)' }}>
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-component: inline module edit ────────────────────────

function ModuleEditRow({
  mod, onSave, onDelete, isPending
}: {
  mod: DbModule
  onSave: (mod: DbModule) => void
  onDelete: () => void
  isPending: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(mod.title)
  const [duration, setDuration] = useState(mod.duration)

  if (!editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', flex: 1 }}>
          <span style={{ color: 'var(--text-muted)', marginRight: '5px' }}>M{mod.module_number}</span>
          {mod.title}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{mod.duration}</span>
        <button onClick={() => setEditing(true)} style={s.iconBtnTiny}>
          <PencilSimple size={11} />
        </button>
        <button onClick={onDelete} disabled={isPending} style={{ ...s.iconBtnTiny, color: 'rgba(239,68,68,0.6)' }}>
          <Trash size={11} />
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
      <input
        style={{ ...s.input, fontSize: '12px', padding: '5px 8px' }}
        value={title}
        onChange={e => setTitle(e.target.value)}
        autoFocus
      />
      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          style={{ ...s.input, fontSize: '12px', padding: '5px 8px', width: '90px' }}
          value={duration}
          onChange={e => setDuration(e.target.value)}
        />
        <button
          onClick={() => { onSave({ ...mod, title, duration }); setEditing(false) }}
          disabled={isPending}
          style={{ ...s.btnPrimary, fontSize: '11px', padding: '4px 10px' }}
        >
          OK
        </button>
        <button onClick={() => setEditing(false)} style={{ ...s.btn, fontSize: '11px', padding: '4px 8px' }}>
          ✕
        </button>
      </div>
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 'calc(100vh - 60px)',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px clamp(16px,3vw,32px)',
    borderBottom: '1px solid var(--border)',
    flexWrap: 'wrap',
    gap: '10px',
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  backLink: {
    display: 'flex', alignItems: 'center', gap: '6px',
    color: 'var(--text-3)', textDecoration: 'none',
    fontSize: '13px', fontWeight: 500,
  },
  tabBar: {
    display: 'flex',
    gap: '4px',
    padding: '12px clamp(16px,3vw,32px) 0',
    borderBottom: '1px solid var(--border)',
  },
  tabBtn: {
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '8px 16px', borderRadius: '8px 8px 0 0',
    background: 'transparent', border: '1px solid transparent',
    borderBottom: 'none', color: 'var(--text-3)',
    fontSize: '13px', fontWeight: 400, cursor: 'pointer',
    marginBottom: '-1px',
  },
  tabBtnActive: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderBottom: '1px solid var(--surface)',
    color: 'var(--text)',
    fontWeight: 500,
  },
  section: {
    padding: 'clamp(16px,3vw,32px)',
    maxWidth: '800px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-3)',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    marginBottom: '4px',
  },
  input: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '9px',
    padding: '9px 12px',
    color: 'var(--text)',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
  },
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '7px 14px', borderRadius: '8px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-3)', fontSize: '13px', fontWeight: 400,
    cursor: 'pointer', textDecoration: 'none',
  },
  btnSmall: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '5px 10px', borderRadius: '7px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-3)', fontSize: '12px', cursor: 'pointer',
  },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    padding: '8px 18px', borderRadius: '9px',
    background: 'rgba(255,213,107,0.15)', border: '1px solid rgba(255,213,107,0.3)',
    color: 'var(--accent-text)', fontSize: '13px', fontWeight: 500,
    cursor: 'pointer',
  },
  iconBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '30px', height: '30px', borderRadius: '7px',
    background: 'var(--border)', border: '1px solid var(--border)',
    color: 'var(--text-3)', cursor: 'pointer', flexShrink: 0,
  },
  iconBtnTiny: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '22px', height: '22px', borderRadius: '5px',
    background: 'transparent', border: 'none',
    color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0,
  },
  // Content tab
  contentLayout: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    height: 'calc(100vh - 180px)',
  },
  moduleTree: {
    width: '300px',
    flexShrink: 0,
    borderRight: '1px solid var(--border)',
    overflowY: 'auto',
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  treeHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '12px',
  },
  treeHeaderLabel: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', fontWeight: 600, color: 'var(--text-3)',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  newModuleForm: {
    display: 'flex', flexDirection: 'column', gap: '8px',
    padding: '12px', background: 'var(--surface)',
    borderRadius: '10px', border: '1px solid var(--border)',
    marginBottom: '8px',
  },
  emptyTree: {
    padding: '24px 12px',
    textAlign: 'center',
    color: 'var(--text-muted)',
  },
  moduleItem: {
    borderRadius: '8px',
    overflow: 'hidden',
  },
  moduleRow: {
    display: 'flex', alignItems: 'flex-start', gap: '4px',
    padding: '6px 4px',
    background: 'var(--surface-2)',
    borderRadius: '7px',
  },
  moduleCaret: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', padding: '3px', flexShrink: 0,
    marginTop: '1px',
  },
  moduleInfo: {
    flex: 1, minWidth: 0,
  },
  lessonList: {
    paddingLeft: '20px',
    paddingTop: '4px',
    paddingBottom: '4px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  lessonBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '6px 10px', borderRadius: '7px',
    background: 'transparent', border: 'none',
    color: 'var(--text-3)', fontSize: '12px',
    cursor: 'pointer', width: '100%', textAlign: 'left',
  },
  lessonBtnActive: {
    background: 'rgba(255,213,107,0.1)',
    color: 'var(--accent-text)',
  },
  lessonNum: {
    width: '18px', height: '18px', borderRadius: '4px',
    background: 'var(--border)', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600,
  },
  lessonDur: {
    fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0,
  },
  addLessonBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '5px 10px', borderRadius: '6px',
    background: 'transparent', border: '1px dashed var(--border)',
    color: 'var(--text-muted)', fontSize: '11px',
    cursor: 'pointer', width: '100%',
    marginTop: '4px',
  },
  lessonEditor: {
    flex: 1,
    padding: '20px 24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  lessonPlaceholder: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    flex: 1, color: 'var(--text-3)', gap: '8px',
    textAlign: 'center', fontSize: '14px',
  },
}
