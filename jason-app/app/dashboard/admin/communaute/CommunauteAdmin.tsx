'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash, X, FacebookLogo, WhatsappLogo, Users, PencilSimple, Check } from '@phosphor-icons/react'
import { addGroup, deleteGroup, updateGroupMembersCount } from './actions'

interface Group {
  id: string
  name: string
  description: string
  platform: 'facebook' | 'whatsapp'
  members_count: number
  url: string
}

export default function CommunauteAdmin({ groups: initialGroups }: { groups: Group[] }) {
  const [groups, setGroups] = useState(initialGroups)
  const [showAdd, setShowAdd] = useState(false)
  const [editingCount, setEditingCount] = useState<{ id: string; val: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  function showFeedback(type: 'ok' | 'err', msg: string) {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 3000)
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await addGroup(fd)
      if (res.success) {
        setShowAdd(false)
        showFeedback('ok', 'Groupe ajouté')
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>
            Groupes communautaires
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
            {groups.length} groupe{groups.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={styles.addBtn} disabled={isPending}>
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
        <form onSubmit={handleAdd} style={styles.formCard}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>Nouveau groupe</h3>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nom</label>
              <input name="name" required style={styles.input} placeholder="Ex: Groupe Airbnb France" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Plateforme</label>
              <select name="platform" required style={styles.input}>
                <option value="facebook">Facebook</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <input name="description" style={styles.input} placeholder="Courte description du groupe" />
          </div>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Lien d'invitation</label>
              <input name="url" required type="url" style={styles.input} placeholder="https://..." />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Membres actuels</label>
              <input name="members_count" type="number" min="0" defaultValue="0" style={styles.input} />
            </div>
          </div>
          <button type="submit" style={styles.submitBtn} disabled={isPending}>Ajouter le groupe</button>
        </form>
      )}

      {/* Groups list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {groups.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>
            Aucun groupe pour l'instant.
          </div>
        )}
        {groups.map(g => {
          const isFb = g.platform === 'facebook'
          return (
            <div key={g.id} style={styles.card}>
              <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Platform icon */}
                <div style={{
                  width: '40px', height: '40px', flexShrink: 0, borderRadius: '10px',
                  background: isFb ? 'rgba(59,130,246,0.1)' : 'rgba(37,211,102,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isFb
                    ? <FacebookLogo size={20} color="#3B82F6" />
                    : <WhatsappLogo size={20} color="#25D366" />
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>{g.name}</div>
                  {g.description && (
                    <div style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '4px' }}>{g.description}</div>
                  )}
                  <a href={g.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'rgba(255,213,107,0.6)', textDecoration: 'none' }}>
                    {g.url.length > 50 ? g.url.slice(0, 50) + '…' : g.url}
                  </a>
                </div>

                {/* Members count (editable) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {editingCount?.id === g.id ? (
                    <>
                      <input
                        type="number"
                        value={editingCount.val}
                        onChange={e => setEditingCount({ id: g.id, val: e.target.value })}
                        style={{ ...styles.input, width: '80px', padding: '5px 8px', fontSize: '13px' }}
                        autoFocus
                      />
                      <button onClick={() => handleSaveCount(g.id)} style={styles.iconBtn} disabled={isPending}>
                        <Check size={13} color="#63D683" />
                      </button>
                      <button onClick={() => setEditingCount(null)} style={styles.iconBtn}>
                        <X size={13} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditingCount({ id: g.id, val: String(g.members_count) })}
                      style={{ ...styles.iconBtn, gap: '5px', paddingLeft: '10px', paddingRight: '10px', width: 'auto' }}
                      title="Modifier le nombre de membres"
                    >
                      <Users size={13} />
                      <span style={{ fontSize: '13px' }}>{g.members_count}</span>
                      <PencilSimple size={11} />
                    </button>
                  )}
                </div>

                {/* Delete */}
                <button onClick={() => handleDelete(g.id)} style={{ ...styles.iconBtn, color: 'rgba(239,68,68,0.6)' }} disabled={isPending}>
                  <Trash size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  addBtn: {
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '9px 16px', borderRadius: '10px',
    background: 'rgba(255,213,107,0.1)', border: '1px solid rgba(255,213,107,0.2)',
    color: '#FFD56B', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
  },
  formCard: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '20px', marginBottom: '20px',
  },
  formGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
  },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' },
  label: { fontSize: '12px', fontWeight: 500, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: {
    background: 'var(--border)', border: '1px solid var(--border)',
    borderRadius: '9px', padding: '9px 12px', color: 'var(--text)', fontSize: '14px',
    outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  submitBtn: {
    padding: '10px 20px', borderRadius: '10px',
    background: 'rgba(255,213,107,0.15)', border: '1px solid rgba(255,213,107,0.3)',
    color: '#FFD56B', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
  },
  card: {
    background: 'var(--surface)', border: '1px solid var(--surface-2)',
    borderRadius: '12px', overflow: 'hidden',
  },
  iconBtn: {
    background: 'var(--border)', border: '1px solid var(--border)',
    borderRadius: '7px', width: '30px', height: '30px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-2)',
  },
}
