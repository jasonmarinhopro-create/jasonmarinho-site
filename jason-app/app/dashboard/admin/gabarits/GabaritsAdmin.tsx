'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash, PencilSimple, X, Check, Copy } from '@phosphor-icons/react'
import { addTemplate, deleteTemplate, updateTemplate } from './actions'

interface Template {
  id: string
  title: string
  content: string
  category: string
  copy_count: number
  created_at: string
}

const CATEGORIES = [
  { value: 'airbnb',   label: 'Airbnb' },
  { value: 'checkin',  label: 'Check-in' },
  { value: 'checkout', label: 'Check-out' },
  { value: 'avis',     label: 'Avis' },
  { value: 'bienvenue',label: 'Bienvenue' },
  { value: 'autre',    label: 'Autre' },
]

export default function GabaritsAdmin({ templates: initialTemplates }: { templates: Template[] }) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
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
      const res = await addTemplate(fd)
      if (res.success) {
        setShowAdd(false)
        showFeedback('ok', 'Gabarit ajouté')
        // Reload is triggered by revalidatePath in server action
      } else {
        showFeedback('err', res.error ?? 'Erreur')
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Supprimer ce gabarit ?')) return
    startTransition(async () => {
      const res = await deleteTemplate(id)
      if (res.success) {
        setTemplates(t => t.filter(x => x.id !== id))
        showFeedback('ok', 'Gabarit supprimé')
      } else {
        showFeedback('err', res.error ?? 'Erreur')
      }
    })
  }

  function handleEdit(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateTemplate(id, fd)
      if (res.success) {
        setEditingId(null)
        showFeedback('ok', 'Gabarit mis à jour')
      } else {
        showFeedback('err', res.error ?? 'Erreur')
      }
    })
  }

  const categoryLabel = (v: string) => CATEGORIES.find(c => c.value === v)?.label ?? v

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>
            Gabarits de messages
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
            {templates.length} gabarit{templates.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          style={styles.addBtn}
          disabled={isPending}
        >
          {showAdd ? <X size={15} /> : <Plus size={15} />}
          {showAdd ? 'Annuler' : 'Nouveau gabarit'}
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{
          ...styles.feedback,
          background: feedback.type === 'ok' ? 'rgba(99,214,131,0.12)' : 'rgba(239,68,68,0.12)',
          borderColor: feedback.type === 'ok' ? 'rgba(99,214,131,0.25)' : 'rgba(239,68,68,0.25)',
          color: feedback.type === 'ok' ? '#63D683' : '#f87171',
        }}>
          {feedback.type === 'ok' ? <Check size={14} /> : <X size={14} />}
          {feedback.msg}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} style={styles.formCard}>
          <h3 style={styles.formTitle}>Nouveau gabarit</h3>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Titre</label>
              <input name="title" required style={styles.input} placeholder="Ex: Bienvenue à votre arrivée" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Catégorie</label>
              <select name="category" required style={styles.input}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Contenu</label>
            <textarea name="content" required rows={6} style={{ ...styles.input, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Texte du gabarit..." />
          </div>
          <button type="submit" style={styles.submitBtn} disabled={isPending}>
            {isPending ? 'Enregistrement...' : 'Ajouter le gabarit'}
          </button>
        </form>
      )}

      {/* Templates list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {templates.length === 0 && (
          <div style={styles.empty}>Aucun gabarit pour l'instant.</div>
        )}
        {templates.map(t => (
          <div key={t.id} style={styles.card}>
            {editingId === t.id ? (
              <form onSubmit={e => handleEdit(e, t.id)} style={{ padding: '16px' }}>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Titre</label>
                    <input name="title" defaultValue={t.title} required style={styles.input} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Catégorie</label>
                    <select name="category" defaultValue={t.category} required style={styles.input}>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Contenu</label>
                  <textarea name="content" defaultValue={t.content} required rows={5} style={{ ...styles.input, resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" style={styles.submitBtn} disabled={isPending}>Enregistrer</button>
                  <button type="button" onClick={() => setEditingId(null)} style={styles.cancelBtn}>Annuler</button>
                </div>
              </form>
            ) : (
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={styles.catBadge}>{categoryLabel(t.category)}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <Copy size={12} />
                        {t.copy_count} copie{t.copy_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={styles.cardTitle}>{t.title}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => setEditingId(t.id)} style={styles.iconBtn} title="Modifier">
                      <PencilSimple size={14} />
                    </button>
                    <button onClick={() => handleDelete(t.id)} style={{ ...styles.iconBtn, color: 'rgba(239,68,68,0.6)' }} title="Supprimer">
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
                <p style={styles.contentPreview}>{t.content}</p>
              </div>
            )}
          </div>
        ))}
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
  feedback: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 14px', borderRadius: '10px',
    border: '1px solid', fontSize: '13px',
    marginBottom: '16px',
  },
  formCard: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '20px', marginBottom: '20px',
  },
  formTitle: {
    fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px',
  },
  formGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px',
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
  cancelBtn: {
    padding: '10px 20px', borderRadius: '10px',
    background: 'none', border: '1px solid var(--border)',
    color: 'var(--text-3)', fontSize: '14px', cursor: 'pointer',
  },
  card: {
    background: 'var(--surface)', border: '1px solid var(--surface-2)',
    borderRadius: '12px', overflow: 'hidden',
  },
  cardTitle: { fontSize: '15px', fontWeight: 500, color: 'var(--text)' },
  catBadge: {
    fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '100px',
    background: 'rgba(255,213,107,0.1)', color: '#FFD56B', border: '1px solid rgba(255,213,107,0.15)',
  },
  contentPreview: {
    fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.5,
    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  iconBtn: {
    background: 'var(--border)', border: '1px solid var(--border)',
    borderRadius: '7px', width: '30px', height: '30px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-2)',
  },
  empty: {
    textAlign: 'center', padding: '40px',
    color: 'var(--text-muted)', fontSize: '14px',
  },
}
