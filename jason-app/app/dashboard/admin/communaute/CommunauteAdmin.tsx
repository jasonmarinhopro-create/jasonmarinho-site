'use client'

import { useState, useTransition } from 'react'
import {
  Plus, Trash, X, FacebookLogo, WhatsappLogo,
  Users, PencilSimple, Check, FolderSimple, Tag,
} from '@phosphor-icons/react/dist/ssr'
import { addGroup, updateGroup, deleteGroup, updateGroupMembersCount } from './actions'

interface Group {
  id: string
  name: string
  description: string
  platform: 'facebook' | 'whatsapp'
  members_count: number
  url: string
  category: string
  tag: string | null
  sort_order: number
}

interface GroupFormProps {
  initial?: Partial<Group>
  existingCategories: string[]
  onSubmit: (fd: FormData) => Promise<void>
  onCancel: () => void
  submitLabel: string
  isPending: boolean
}

function GroupForm({ initial, existingCategories, onSubmit, onCancel, submitLabel, isPending }: GroupFormProps) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    await onSubmit(new FormData(e.currentTarget))
  }

  return (
    <form onSubmit={handleSubmit} style={s.formCard}>
      <div style={s.formGrid}>
        <div style={s.formGroup}>
          <label style={s.label}>Nom du groupe *</label>
          <input name="name" required defaultValue={initial?.name ?? ''} style={s.input} placeholder="Ex: Groupe hôtes Bretagne" />
        </div>
        <div style={s.formGroup}>
          <label style={s.label}>Plateforme *</label>
          <select name="platform" required defaultValue={initial?.platform ?? 'facebook'} style={s.input}>
            <option value="facebook">Facebook</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
      </div>

      <div style={s.formGroup}>
        <label style={s.label}>Description</label>
        <input name="description" defaultValue={initial?.description ?? ''} style={s.input} placeholder="Courte description du groupe" />
      </div>

      <div style={s.formGrid}>
        <div style={s.formGroup}>
          <label style={s.label}>
            Catégorie *
            <span style={{ fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none', marginLeft: '6px' }}>
              (libre, ex: Groupes régionaux, Ski…)
            </span>
          </label>
          <input
            name="category"
            list="category-suggestions"
            defaultValue={initial?.category ?? ''}
            required
            style={s.input}
            placeholder="Ex: Groupes régionaux"
          />
          <datalist id="category-suggestions">
            {existingCategories.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div style={s.formGroup}>
          <label style={s.label}>
            Tags / Secteurs
            <span style={{ fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none', marginLeft: '6px' }}>(séparés par virgule)</span>
          </label>
          <input name="tag" defaultValue={initial?.tag ?? ''} style={s.input} placeholder="Ex: Bretagne, Normandie, ou: Ski, Montagne" />
        </div>
      </div>

      <div style={s.formGrid}>
        <div style={s.formGroup}>
          <label style={s.label}>Lien d'invitation *</label>
          <input name="url" required type="url" defaultValue={initial?.url ?? ''} style={s.input} placeholder="https://..." />
        </div>
        <div style={{ ...s.formGrid, gridTemplateColumns: '1fr 1fr' }}>
          <div style={s.formGroup}>
            <label style={s.label}>Membres</label>
            <input name="members_count" type="number" min="0" defaultValue={initial?.members_count ?? 0} style={s.input} />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Ordre d'affichage</label>
            <input name="sort_order" type="number" min="0" defaultValue={initial?.sort_order ?? 0} style={s.input} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={s.cancelBtn}>Annuler</button>
        <button type="submit" style={s.submitBtn} disabled={isPending}>
          {isPending ? '…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

export default function CommunauteAdmin({ groups: initialGroups }: { groups: Group[] }) {
  const [groups, setGroups]           = useState(initialGroups)
  const [showAdd, setShowAdd]         = useState(false)
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [editingCount, setEditingCount] = useState<{ id: string; val: string } | null>(null)
  const [isPending, startTransition]  = useTransition()
  const [feedback, setFeedback]       = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  function showFeedback(type: 'ok' | 'err', msg: string) {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 3000)
  }

  // Catégories distinctes pour le datalist
  const existingCategories = [...new Set(groups.map(g => g.category).filter(Boolean))]

  // Groupes par catégorie pour l'affichage
  const grouped: Record<string, Group[]> = {}
  groups.forEach(g => {
    const cat = g.category || 'Général'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(g)
  })
  // Tri des groupes dans chaque catégorie par sort_order
  Object.values(grouped).forEach(arr => arr.sort((a, b) => a.sort_order - b.sort_order))

  async function handleAdd(fd: FormData) {
    startTransition(async () => {
      const res = await addGroup(fd)
      if (res.success) {
        setShowAdd(false)
        showFeedback('ok', 'Groupe ajouté')
        // Refresh simple : reload data via optimistic state
        window.location.reload()
      } else {
        showFeedback('err', res.error ?? 'Erreur')
      }
    })
  }

  async function handleUpdate(id: string, fd: FormData) {
    startTransition(async () => {
      const res = await updateGroup(id, fd)
      if (res.success) {
        setEditingId(null)
        showFeedback('ok', 'Groupe mis à jour')
        window.location.reload()
      } else {
        showFeedback('err', res.error ?? 'Erreur')
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Supprimer ce groupe ?')) return
    startTransition(async () => {
      const res = await deleteGroup(id)
      if (res.success) {
        setGroups(g => g.filter(x => x.id !== id))
        showFeedback('ok', 'Groupe supprimé')
      } else {
        showFeedback('err', res.error ?? 'Erreur')
      }
    })
  }

  function handleSaveCount(id: string) {
    const count = parseInt(editingCount?.val ?? '0') || 0
    startTransition(async () => {
      const res = await updateGroupMembersCount(id, count)
      if (res.success) {
        setGroups(g => g.map(x => x.id === id ? { ...x, members_count: count } : x))
        setEditingCount(null)
        showFeedback('ok', 'Mis à jour')
      } else {
        showFeedback('err', res.error ?? 'Erreur')
      }
    })
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '20px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>
            Groupes communautaires
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
            {groups.length} groupe{groups.length !== 1 ? 's' : ''}
            {existingCategories.length > 0 && (
              <span style={{ marginLeft: '10px', color: 'var(--text-muted)' }}>
                · {existingCategories.length} catégorie{existingCategories.length > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <button onClick={() => { setShowAdd(v => !v); setEditingId(null) }} style={s.addBtn} disabled={isPending}>
          {showAdd ? <X size={15} /> : <Plus size={15} />}
          {showAdd ? 'Annuler' : 'Nouveau groupe'}
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 14px', borderRadius: '10px', border: '1px solid',
          background: feedback.type === 'ok' ? 'rgba(99,214,131,0.12)' : 'rgba(239,68,68,0.12)',
          borderColor: feedback.type === 'ok' ? 'rgba(99,214,131,0.25)' : 'rgba(239,68,68,0.25)',
          color: feedback.type === 'ok' ? '#63D683' : '#f87171',
          fontSize: '13px', marginBottom: '16px',
        }}>
          {feedback.msg}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <GroupForm
          existingCategories={existingCategories}
          onSubmit={handleAdd}
          onCancel={() => setShowAdd(false)}
          submitLabel="Ajouter le groupe"
          isPending={isPending}
        />
      )}

      {/* Groups by category */}
      {groups.length === 0 && !showAdd && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>
          Aucun groupe pour l'instant. Crée le premier avec le bouton ci-dessus.
        </div>
      )}

      {Object.entries(grouped).map(([category, catGroups]) => (
        <div key={category} style={s.categoryBlock}>
          {/* Category header */}
          <div style={s.categoryHeader}>
            <FolderSimple size={14} color="var(--text-muted)" weight="fill" />
            <span style={s.categoryLabel}>{category}</span>
            <span style={s.categoryCount}>{catGroups.length}</span>
          </div>

          {/* Groups */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {catGroups.map(g => {
              const isFb = g.platform === 'facebook'
              const isEditing = editingId === g.id

              if (isEditing) {
                return (
                  <GroupForm
                    key={g.id}
                    initial={g}
                    existingCategories={existingCategories}
                    onSubmit={(fd) => handleUpdate(g.id, fd)}
                    onCancel={() => setEditingId(null)}
                    submitLabel="Enregistrer"
                    isPending={isPending}
                  />
                )
              }

              return (
                <div key={g.id} style={s.card}>
                  <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    {/* Platform icon */}
                    <div style={{
                      width: '36px', height: '36px', flexShrink: 0, borderRadius: '9px',
                      background: isFb ? 'rgba(59,130,246,0.1)' : 'rgba(37,211,102,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isFb
                        ? <FacebookLogo size={18} color="#3B82F6" />
                        : <WhatsappLogo size={18} color="#25D366" />}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>{g.name}</span>
                        {g.tag && (
                          <span style={s.tagPill}>
                            <Tag size={9} />
                            {g.tag}
                          </span>
                        )}
                      </div>
                      {g.description && (
                        <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                          {g.description}
                        </div>
                      )}
                      <a href={g.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: 'rgba(255,213,107,0.5)', textDecoration: 'none' }}>
                        {g.url.length > 55 ? g.url.slice(0, 55) + '…' : g.url}
                      </a>
                    </div>

                    {/* Members count (inline edit) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                      {editingCount?.id === g.id ? (
                        <>
                          <input
                            type="number"
                            value={editingCount.val}
                            onChange={e => setEditingCount({ id: g.id, val: e.target.value })}
                            style={{ ...s.input, width: '80px', padding: '5px 8px', fontSize: '13px' }}
                            autoFocus
                          />
                          <button onClick={() => handleSaveCount(g.id)} style={s.iconBtn} disabled={isPending}>
                            <Check size={13} color="#63D683" />
                          </button>
                          <button onClick={() => setEditingCount(null)} style={s.iconBtn}>
                            <X size={13} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setEditingCount({ id: g.id, val: String(g.members_count) })}
                          style={{ ...s.iconBtn, gap: '5px', paddingLeft: '10px', paddingRight: '10px', width: 'auto' }}
                          title="Modifier le nombre de membres"
                        >
                          <Users size={13} />
                          <span style={{ fontSize: '12px' }}>{g.members_count.toLocaleString('fr-FR')}</span>
                          <PencilSimple size={10} />
                        </button>
                      )}
                    </div>

                    {/* Edit button */}
                    <button
                      onClick={() => { setEditingId(g.id); setShowAdd(false) }}
                      style={s.iconBtn}
                      title="Modifier"
                      disabled={isPending}
                    >
                      <PencilSimple size={14} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(g.id)}
                      style={{ ...s.iconBtn, color: 'rgba(239,68,68,0.6)' }}
                      disabled={isPending}
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  addBtn: {
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '9px 16px', borderRadius: '10px',
    background: 'rgba(255,213,107,0.1)', border: '1px solid rgba(255,213,107,0.2)',
    color: 'var(--accent-text)', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
  },
  formCard: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '20px', marginBottom: '20px',
  },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' },
  label: { fontSize: '11px', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center' },
  input: {
    background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)',
    borderRadius: '9px', padding: '9px 12px', color: 'var(--text)', fontSize: '13px',
    outline: 'none', width: '100%', boxSizing: 'border-box',
    fontFamily: 'var(--font-outfit), sans-serif',
  } as React.CSSProperties,
  submitBtn: {
    padding: '10px 20px', borderRadius: '10px',
    background: 'rgba(255,213,107,0.15)', border: '1px solid rgba(255,213,107,0.3)',
    color: 'var(--accent-text)', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
  },
  cancelBtn: {
    padding: '10px 16px', borderRadius: '10px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-2)', fontSize: '13px', cursor: 'pointer',
  },
  categoryBlock: { marginBottom: '28px' },
  categoryHeader: {
    display: 'flex', alignItems: 'center', gap: '7px',
    marginBottom: '10px', paddingBottom: '8px',
    borderBottom: '1px solid var(--border)',
  },
  categoryLabel: { fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.5px' },
  categoryCount: {
    fontSize: '10px', fontWeight: 600,
    background: 'var(--surface)', color: 'var(--text-muted)',
    borderRadius: '100px', padding: '1px 7px',
  },
  tagPill: {
    display: 'inline-flex', alignItems: 'center', gap: '3px',
    fontSize: '10px', fontWeight: 500,
    padding: '2px 7px', borderRadius: '100px',
    background: 'rgba(255,213,107,0.08)', border: '1px solid rgba(255,213,107,0.2)',
    color: 'rgba(255,213,107,0.7)',
  },
  card: {
    background: 'var(--surface)', border: '1px solid var(--surface-2)',
    borderRadius: '10px', overflow: 'hidden',
  },
  iconBtn: {
    background: 'var(--border)', border: '1px solid var(--border)',
    borderRadius: '7px', width: '30px', height: '30px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-2)', flexShrink: 0,
  },
}
