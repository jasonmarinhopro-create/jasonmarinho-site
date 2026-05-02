'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  Warning, X, Trash, CheckCircle, ArrowsClockwise,
  Plus, CurrencyEur, Camera,
} from '@phosphor-icons/react/dist/ssr'
import {
  listIncidentsBySejours,
  createIncident,
  updateIncident,
  deleteIncident,
  type SejourIncident,
  type IncidentType,
  type IncidentStatut,
} from '../incident-actions'

const TYPE_OPTIONS: { value: IncidentType; label: string; emoji: string; color: string }[] = [
  { value: 'linge_tache',         label: 'Linge tache',         emoji: '🛏️', color: '#F87171' },
  { value: 'casse',               label: 'Casse / objet brise', emoji: '💥', color: '#F59E0B' },
  { value: 'salete',              label: 'Salete',              emoji: '🧹', color: '#A78BFA' },
  { value: 'degradation',         label: 'Degradation',         emoji: '⚠️', color: '#F43F5E' },
  { value: 'vol',                 label: 'Vol',                 emoji: '🚨', color: '#DC2626' },
  { value: 'retard_restitution',  label: 'Retard restitution',  emoji: '⏰', color: '#FB923C' },
  { value: 'plainte_voisin',      label: 'Plainte voisin',      emoji: '🔇', color: '#FBBF24' },
  { value: 'autre',               label: 'Autre',               emoji: '📝', color: '#94A3B8' },
]

const STATUT_OPTIONS: { value: IncidentStatut; label: string; color: string; bg: string }[] = [
  { value: 'ouvert',     label: 'Ouvert',         color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
  { value: 'resolu',     label: 'Resolu',         color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  { value: 'rembourse',  label: 'Rembourse',      color: '#7EB8F7', bg: 'rgba(126,184,247,0.12)' },
  { value: 'annule',     label: 'Annule',         color: 'var(--text-3)', bg: 'var(--surface-2)' },
]

function getType(t: IncidentType) {
  return TYPE_OPTIONS.find(o => o.value === t) ?? TYPE_OPTIONS[TYPE_OPTIONS.length - 1]
}
function getStatut(s: IncidentStatut) {
  return STATUT_OPTIONS.find(o => o.value === s) ?? STATUT_OPTIONS[0]
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

type Props = {
  sejourId: string
  voyageurId: string
  open: boolean
  onCountChange?: (openCount: number, total: number) => void
}

export default function IncidentsPanel({ sejourId, voyageurId, open, onCountChange }: Props) {
  const [items, setItems] = useState<SejourIncident[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [pending, startTransition] = useTransition()

  // Load on open
  useEffect(() => {
    if (!open || items !== null) return
    setLoading(true)
    listIncidentsBySejours([sejourId])
      .then(rows => {
        setItems(rows)
        const openCount = rows.filter(r => r.statut === 'ouvert').length
        onCountChange?.(openCount, rows.length)
      })
      .finally(() => setLoading(false))
  }, [open, sejourId, items, onCountChange])

  if (!open) return null

  function refresh() {
    listIncidentsBySejours([sejourId]).then(rows => {
      setItems(rows)
      const openCount = rows.filter(r => r.statut === 'ouvert').length
      onCountChange?.(openCount, rows.length)
    })
  }

  function handleStatutChange(id: string, statut: IncidentStatut) {
    startTransition(async () => {
      await updateIncident(id, voyageurId, { statut })
      refresh()
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Supprimer cet incident ?')) return
    startTransition(async () => {
      await deleteIncident(id, voyageurId)
      refresh()
    })
  }

  return (
    <div style={s.panel}>
      <div style={s.head}>
        <div style={s.headLabel}>
          <Warning size={16} weight="duotone" color="var(--accent-text)" />
          <span>Incidents du sejour</span>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={s.addBtn}>
            <Plus size={14} weight="bold" />
            Ajouter
          </button>
        )}
      </div>

      {showForm && (
        <CreateForm
          sejourId={sejourId}
          voyageurId={voyageurId}
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); refresh() }}
        />
      )}

      {loading && !items && (
        <div style={s.loading}>Chargement...</div>
      )}

      {items && items.length === 0 && !showForm && (
        <p style={s.empty}>Aucun incident pour ce sejour. Tout va bien.</p>
      )}

      {items && items.length > 0 && (
        <div style={s.list}>
          {items.map(it => {
            const typeInfo = getType(it.type)
            const statutInfo = getStatut(it.statut)
            return (
              <div key={it.id} style={{
                ...s.item,
                opacity: it.statut === 'annule' ? 0.55 : 1,
              }}>
                <div style={s.itemHead}>
                  <span style={s.itemEmoji}>{typeInfo.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.itemType}>{typeInfo.label}</div>
                    <div style={s.itemDate}>{fmtDate(it.created_at)}</div>
                  </div>
                  <select
                    value={it.statut}
                    disabled={pending}
                    onChange={e => handleStatutChange(it.id, e.target.value as IncidentStatut)}
                    style={{
                      ...s.statutSelect,
                      color: statutInfo.color,
                      background: statutInfo.bg,
                      borderColor: statutInfo.color + '40',
                    }}
                  >
                    {STATUT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <button onClick={() => handleDelete(it.id)} style={s.delBtn} title="Supprimer">
                    <Trash size={14} />
                  </button>
                </div>
                {it.description && <p style={s.itemDesc}>{it.description}</p>}
                {(it.caution_montant != null && it.caution_montant > 0) && (
                  <div style={s.cautionRow}>
                    <CurrencyEur size={12} weight="bold" />
                    <span>Caution : {it.caution_montant.toLocaleString('fr-FR')} €</span>
                  </div>
                )}
                {it.photo_url && (
                  <a href={it.photo_url} target="_blank" rel="noreferrer" style={s.photoLink}>
                    <Camera size={12} />
                    Voir la photo
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Formulaire de creation ────────────────────────────────────────────────
function CreateForm({ sejourId, voyageurId, onClose, onCreated }: {
  sejourId: string
  voyageurId: string
  onClose: () => void
  onCreated: () => void
}) {
  const [type, setType] = useState<IncidentType>('linge_tache')
  const [description, setDescription] = useState('')
  const [caution, setCaution] = useState<string>('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function submit() {
    setError('')
    startTransition(async () => {
      const res = await createIncident(voyageurId, {
        sejour_id: sejourId,
        type,
        description: description.trim() || null,
        photo_url: photoUrl.trim() || null,
        caution_montant: caution ? parseFloat(caution) : null,
      })
      if (res.error) {
        setError(res.error)
        return
      }
      onCreated()
    })
  }

  return (
    <div style={s.form}>
      <div style={s.formHead}>
        <span style={s.formTitle}>Nouvel incident</span>
        <button onClick={onClose} style={s.closeBtn}><X size={14} /></button>
      </div>

      <div style={s.field}>
        <label style={s.label}>Type</label>
        <div style={s.typeChips}>
          {TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              style={{
                ...s.typeChip,
                ...(type === opt.value ? {
                  background: opt.color + '20',
                  borderColor: opt.color,
                  color: opt.color,
                  fontWeight: 600,
                } : {}),
              }}
            >
              <span>{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={s.field}>
        <label style={s.label}>Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Decrire l'incident, les degats constates, les actions entreprises..."
          rows={3}
          style={s.textarea}
        />
      </div>

      <div style={s.row2}>
        <div style={s.field}>
          <label style={s.label}>Caution a appliquer (€)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={caution}
            onChange={e => setCaution(e.target.value)}
            placeholder="0"
            style={s.input}
          />
        </div>
        <div style={s.field}>
          <label style={s.label}>URL photo (optionnel)</label>
          <input
            type="url"
            value={photoUrl}
            onChange={e => setPhotoUrl(e.target.value)}
            placeholder="https://..."
            style={s.input}
          />
        </div>
      </div>

      {error && <div style={s.error}>{error}</div>}

      <div style={s.formActions}>
        <button onClick={onClose} disabled={pending} style={s.btnGhost}>Annuler</button>
        <button onClick={submit} disabled={pending} style={s.btnPrimary}>
          {pending ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

// ─── styles ───────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  panel: {
    marginTop: 14,
    padding: '14px 16px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
  },
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headLabel: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 12, fontWeight: 600,
    color: 'var(--text-2)',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  addBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '5px 10px', borderRadius: 999,
    background: 'var(--accent-bg-2)',
    border: '1px solid var(--accent-border-2)',
    color: 'var(--accent-text)',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  loading: { fontSize: 13, color: 'var(--text-3)', padding: '8px 0' },
  empty:   { fontSize: 13, color: 'var(--text-3)', margin: '8px 0 0', fontStyle: 'italic' },

  list: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 },
  item: {
    background: 'var(--bg-2, var(--surface-2))',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '10px 12px',
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  itemHead: { display: 'flex', alignItems: 'center', gap: 10 },
  itemEmoji: { fontSize: 18, lineHeight: 1 },
  itemType: { fontSize: 13.5, fontWeight: 600, color: 'var(--text)' },
  itemDate: { fontSize: 11, color: 'var(--text-3)', marginTop: 1 },
  statutSelect: {
    padding: '4px 8px', borderRadius: 6,
    border: '1px solid', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
    appearance: 'none',
  },
  delBtn: {
    width: 26, height: 26, borderRadius: 6,
    background: 'transparent', border: '1px solid var(--border)',
    color: 'var(--text-3)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  itemDesc: { fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 },
  cautionRow: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 12, color: 'var(--accent-text)', fontWeight: 600,
  },
  photoLink: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 11, color: 'var(--text-2)',
    textDecoration: 'underline',
  },

  // form
  form: {
    marginTop: 6, marginBottom: 10,
    padding: 12,
    background: 'var(--bg-2, var(--surface-2))',
    border: '1px solid var(--border-2)',
    borderRadius: 10,
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  formHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  formTitle: { fontSize: 12, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  closeBtn: {
    width: 24, height: 24, borderRadius: 6,
    background: 'transparent', border: '1px solid var(--border)',
    color: 'var(--text-2)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  typeChips: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  typeChip: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '5px 10px', borderRadius: 999,
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-2)', fontSize: 12, cursor: 'pointer',
    transition: 'all .15s',
  },
  textarea: {
    padding: '8px 10px', borderRadius: 8,
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: 13, fontFamily: 'inherit',
    resize: 'vertical',
  },
  input: {
    padding: '8px 10px', borderRadius: 8,
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: 13, fontFamily: 'inherit',
  },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  error: { padding: '6px 10px', background: 'rgba(248,113,113,0.1)', color: '#F87171', borderRadius: 6, fontSize: 12 },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  btnGhost: {
    padding: '7px 14px', borderRadius: 8,
    background: 'transparent', border: '1px solid var(--border)',
    color: 'var(--text-2)', fontSize: 13, cursor: 'pointer',
  },
  btnPrimary: {
    padding: '7px 14px', borderRadius: 8,
    background: 'var(--accent-text)', border: '1px solid var(--accent-text)',
    color: 'var(--bg)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
}
