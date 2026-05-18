'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, MagnifyingGlass, CheckCircle, Trash, PencilSimple,
  X, Check, Warning, Phone, EnvelopeSimple, Funnel, Sparkle,
} from '@phosphor-icons/react/dist/ssr'
import { validateReport, deleteReport, updateReport, normalizeAllReportIdentifiers } from '../actions'

interface Report {
  id: string
  identifier: string
  identifier_type: string
  name: string | null
  incident_type: string | null
  is_validated: boolean
  reporter_city: string | null
  reporter_id: string | null
  reported_at: string
  description: string | null
  created_at: string | null
}

const INCIDENT_TYPES = [
  'Tentative d\'arnaque / fraude',
  'Voyageur problématique',
  'Dégâts / vol',
  'Faux profil',
  'Fête non autorisée',
  'Autre',
]

const IDENTIFIER_TYPES: Array<{ value: 'phone' | 'email' | 'other'; label: string }> = [
  { value: 'phone', label: 'Téléphone' },
  { value: 'email', label: 'Email' },
  { value: 'other', label: 'Autre' },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function SignalementsAdmin({
  initialReports,
  diagnostic = null,
}: {
  initialReports: Report[]
  diagnostic?: { kind: 'env' | 'query' | 'empty'; msg: string } | null
}) {
  const [reports, setReports] = useState(initialReports)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'validated'>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [normalizeMsg, setNormalizeMsg] = useState<string | null>(null)
  const [isPending, startT] = useTransition()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return reports.filter(r => {
      if (filter === 'pending' && r.is_validated) return false
      if (filter === 'validated' && !r.is_validated) return false
      if (!q) return true
      return (
        (r.identifier ?? '').toLowerCase().includes(q) ||
        (r.name ?? '').toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q) ||
        (r.incident_type ?? '').toLowerCase().includes(q)
      )
    })
  }, [reports, search, filter])

  const stats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter(r => !r.is_validated).length,
    validated: reports.filter(r => r.is_validated).length,
    suspiciousIdentifiers: reports.filter(r => /[.\s]$/.test(r.identifier ?? '')).length,
  }), [reports])

  function handleValidate(id: string) {
    setReports(prev => prev.map(r => r.id === id ? { ...r, is_validated: true } : r))
    startT(async () => { await validateReport(id) })
  }
  function handleDelete(id: string) {
    if (!confirm('Supprimer ce signalement ? Action irréversible.')) return
    setReports(prev => prev.filter(r => r.id !== id))
    startT(async () => { await deleteReport(id) })
  }
  function handleSaveEdit(id: string, patch: Partial<Report>) {
    setReports(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
    setEditingId(null)
    startT(async () => {
      const res = await updateReport(id, patch as Parameters<typeof updateReport>[1])
      if (res?.error) {
        // Rollback en cas d'échec : refetch côté serveur via revalidation
        setNormalizeMsg(`Erreur : ${res.error}`)
      } else {
        // Récupère la valeur normalisée côté serveur (au cas où patch.identifier
        // a été transformé) — pour l'affichage immédiat, on note l'intention,
        // la prochaine navigation rafraîchira depuis la DB.
      }
    })
  }
  function handleBatchNormalize() {
    if (!confirm('Lancer la normalisation de tous les identifiants ?\nLes numéros avec un point/espace en fin seront corrigés, les FR sans préfixe deviendront +33...')) return
    setNormalizeMsg('Normalisation en cours…')
    startT(async () => {
      const res = await normalizeAllReportIdentifiers()
      if (res?.error) setNormalizeMsg(`Erreur : ${res.error}`)
      else setNormalizeMsg(`${res.updated ?? 0} identifiant(s) normalisé(s). Recharge la page pour voir les changements.`)
    })
  }

  return (
    <div style={s.root}>
      <header style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const }}>
          <Link href="/dashboard/admin" style={s.backLink}>
            <ArrowLeft size={13} weight="bold" />
            Admin
          </Link>
          <h1 style={s.title}>Signalements</h1>
        </div>
        <button
          onClick={handleBatchNormalize}
          disabled={isPending}
          style={s.normalizeBtn}
          title="Réécrit tous les identifiants au format propre (vire les . en fin, ajoute +33 aux FR sans préfixe…)"
        >
          <Sparkle size={13} weight="fill" />
          Normaliser tous les identifiants
        </button>
      </header>

      {normalizeMsg && (
        <div style={s.normalizeMsg}>
          <Check size={14} weight="bold" /> {normalizeMsg}
        </div>
      )}

      {/* Diagnostic visible : env var manquante, erreur SQL, ou table vide.
          Évite le mystère "tout à 0 sans explication". */}
      {diagnostic && (
        <div style={{
          padding: '14px 16px',
          marginBottom: '14px',
          background: diagnostic.kind === 'empty' ? 'rgba(96,165,250,0.10)' : 'rgba(248,113,113,0.10)',
          border: `1px solid ${diagnostic.kind === 'empty' ? 'rgba(96,165,250,0.30)' : 'rgba(248,113,113,0.30)'}`,
          borderRadius: '12px',
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          fontSize: '13px', color: 'var(--text)', lineHeight: 1.55,
        }}>
          <Warning size={18} weight="fill" style={{
            color: diagnostic.kind === 'empty' ? '#60a5fa' : '#f87171',
            flexShrink: 0, marginTop: '1px',
          }} />
          <div>
            <strong style={{ display: 'block', marginBottom: '4px' }}>
              {diagnostic.kind === 'env' && 'Configuration manquante'}
              {diagnostic.kind === 'query' && 'Erreur de query Supabase'}
              {diagnostic.kind === 'empty' && 'Aucun signalement en base'}
            </strong>
            <span style={{ color: 'var(--text-2)' }}>{diagnostic.msg}</span>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div style={s.kpiRow}>
        <Kpi label="Total" value={stats.total} color="var(--text)" />
        <Kpi label="En attente" value={stats.pending} color="#fb923c" />
        <Kpi label="Validés" value={stats.validated} color="var(--success-1)" />
        <Kpi label="Identifiants suspects" value={stats.suspiciousIdentifiers} color={stats.suspiciousIdentifiers > 0 ? 'var(--danger)' : 'var(--text-muted)'}
          hint={stats.suspiciousIdentifiers > 0 ? 'point/espace en fin de chaîne — clique sur Normaliser' : 'aucun'}
        />
      </div>

      {/* Filtres + recherche */}
      <div style={s.toolbar}>
        <div style={s.filterRow}>
          <FilterChip active={filter === 'all'}        onClick={() => setFilter('all')}        label="Tout"        count={stats.total} />
          <FilterChip active={filter === 'pending'}    onClick={() => setFilter('pending')}    label="En attente"  count={stats.pending} color="#fb923c" />
          <FilterChip active={filter === 'validated'}  onClick={() => setFilter('validated')}  label="Validés"     count={stats.validated} color="var(--success-1)" />
        </div>
        <div style={s.searchWrap}>
          <MagnifyingGlass size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Numéro, email, nom, description…"
            style={s.searchInput}
          />
        </div>
      </div>

      {/* Liste */}
      <div style={s.list}>
        {filtered.length === 0 ? (
          <div style={s.empty}>
            <Funnel size={26} weight="duotone" style={{ color: 'var(--text-muted)' }} />
            <p style={{ margin: 0 }}>Aucun signalement ne correspond à ce filtre.</p>
          </div>
        ) : filtered.map(r => (
          <ReportRow
            key={r.id}
            report={r}
            editing={editingId === r.id}
            onEdit={() => setEditingId(r.id)}
            onCancel={() => setEditingId(null)}
            onSave={patch => handleSaveEdit(r.id, patch)}
            onValidate={() => handleValidate(r.id)}
            onDelete={() => handleDelete(r.id)}
            disabled={isPending}
          />
        ))}
      </div>
    </div>
  )
}

function Kpi({ label, value, color, hint }: { label: string; value: number; color: string; hint?: string }) {
  return (
    <div style={s.kpiCard}>
      <div style={s.kpiLabel}>{label}</div>
      <div style={{ ...s.kpiValue, color }}>{value}</div>
      {hint && <div style={s.kpiHint}>{hint}</div>}
    </div>
  )
}

function FilterChip({ active, onClick, label, count, color }: { active: boolean; onClick: () => void; label: string; count: number; color?: string }) {
  return (
    <button onClick={onClick} style={{
      ...s.filterChip,
      ...(active ? s.filterChipActive : {}),
      ...(active && color ? { borderColor: color, color } : {}),
    }}>
      {label}
      <span style={s.filterChipCount}>{count}</span>
    </button>
  )
}

function ReportRow({
  report: r, editing, onEdit, onCancel, onSave, onValidate, onDelete, disabled,
}: {
  report: Report
  editing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (patch: Partial<Report>) => void
  onValidate: () => void
  onDelete: () => void
  disabled: boolean
}) {
  const [fIdent, setFIdent] = useState(r.identifier)
  const [fType, setFType] = useState<string>(r.identifier_type ?? 'phone')
  const [fName, setFName] = useState(r.name ?? '')
  const [fIncident, setFIncident] = useState(r.incident_type ?? 'Tentative d\'arnaque / fraude')
  const [fCity, setFCity] = useState(r.reporter_city ?? '')
  const [fDesc, setFDesc] = useState(r.description ?? '')

  const isSuspect = /[.\s]$/.test(r.identifier ?? '')
  const Icon = r.identifier_type === 'email' ? EnvelopeSimple : Phone

  if (editing) {
    return (
      <div style={{ ...s.card, borderColor: 'var(--accent-text)' }}>
        <div style={s.editGrid}>
          <Field label="Type">
            <select value={fType} onChange={e => setFType(e.target.value)} style={s.input}>
              {IDENTIFIER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Identifiant" hint={isSuspect ? '⚠️ point/espace en fin' : undefined}>
            <input value={fIdent} onChange={e => setFIdent(e.target.value)} style={s.input} placeholder="+33612345678 ou email@..." />
          </Field>
          <Field label="Nom (optionnel)">
            <input value={fName} onChange={e => setFName(e.target.value)} style={s.input} placeholder="Nom partiel ou complet" />
          </Field>
          <Field label="Type d'incident">
            <select value={fIncident} onChange={e => setFIncident(e.target.value)} style={s.input}>
              {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Ville">
            <input value={fCity} onChange={e => setFCity(e.target.value)} style={s.input} placeholder="Ville" />
          </Field>
        </div>
        <Field label="Description">
          <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} rows={3} style={{ ...s.input, fontFamily: 'inherit' }} />
        </Field>
        <div style={s.editActions}>
          <button onClick={onCancel} style={s.btnGhost} disabled={disabled}>
            <X size={13} /> Annuler
          </button>
          <button
            onClick={() => onSave({
              identifier: fIdent,
              identifier_type: fType,
              name: fName,
              incident_type: fIncident,
              reporter_city: fCity,
              description: fDesc,
            })}
            style={s.btnPrimary}
            disabled={disabled}
          >
            <Check size={13} weight="bold" /> Enregistrer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={s.card}>
      <div style={s.cardHead}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <div style={s.iconWrap}>
            <Icon size={14} weight="fill" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.cardTitle}>{r.name || r.identifier}</div>
            <div style={s.cardSub}>
              <span style={{ ...s.identifier, ...(isSuspect ? { color: 'var(--danger)' } : {}) }}>
                {r.identifier}
                {isSuspect && <span title="Identifiant terminé par un . ou espace"> ⚠️</span>}
              </span>
              <span style={{ color: 'var(--text-muted)' }}> · {r.identifier_type ?? 'phone'}</span>
            </div>
          </div>
        </div>
        <div style={s.badgeRow}>
          <span style={{ ...s.badge, background: 'rgba(248,113,113,.1)', color: 'var(--danger)', borderColor: 'rgba(248,113,113,.2)' }}>
            {r.incident_type ?? 'Non précisé'}
          </span>
          <span style={{
            ...s.badge,
            ...(r.is_validated
              ? { background: 'rgba(52,211,153,.1)', color: 'var(--success-1)', borderColor: 'rgba(52,211,153,.2)' }
              : { background: 'rgba(251,146,60,.1)', color: '#fb923c', borderColor: 'rgba(251,146,60,.2)' }),
          }}>
            {r.is_validated ? 'Validé' : 'En attente'}
          </span>
        </div>
      </div>
      <div style={s.cardMeta}>
        {r.reporter_city && <span>{r.reporter_city}</span>}
        {r.reporter_city && <span>·</span>}
        <span>{fmtDate(r.reported_at)}</span>
      </div>
      {r.description && <p style={s.description}>{r.description}</p>}
      <div style={s.cardActions}>
        <button onClick={onEdit} style={s.btnGhost} disabled={disabled}>
          <PencilSimple size={13} weight="bold" /> Modifier
        </button>
        {!r.is_validated && (
          <button onClick={onValidate} style={s.btnSuccess} disabled={disabled}>
            <CheckCircle size={13} weight="bold" /> Valider
          </button>
        )}
        <button onClick={onDelete} style={s.btnDanger} disabled={disabled}>
          <Trash size={13} weight="bold" /> Supprimer
        </button>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={s.field}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={s.fieldLabel}>{label}</span>
        {hint && <span style={s.fieldHint}>{hint}</span>}
      </div>
      {children}
    </label>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: { width: '100%', padding: 'clamp(16px, 3vw, 44px)' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: '14px', marginBottom: '20px',
  },
  backLink: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '6px 12px', borderRadius: '8px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    fontSize: '12.5px', color: 'var(--text-2)', textDecoration: 'none',
    transition: 'background var(--d-base, .2s) var(--ease-smooth, ease)',
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '28px', fontWeight: 400, color: 'var(--text)', margin: 0,
  },
  normalizeBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '9px 16px', borderRadius: '10px',
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
    border: '1px solid var(--accent-border)',
    fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
    cursor: 'pointer',
  },
  normalizeMsg: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 14px', borderRadius: '10px',
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
    border: '1px solid var(--accent-border)',
    fontSize: '13px', marginBottom: '16px',
  },
  kpiRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px', marginBottom: '20px',
  },
  kpiCard: {
    padding: '14px 16px', borderRadius: '12px',
    background: 'var(--surface)', border: '1px solid var(--border)',
  },
  kpiLabel: { fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' },
  kpiValue: { fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif' },
  kpiHint: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' },

  toolbar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: '12px', marginBottom: '16px',
  },
  filterRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  filterChip: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '7px 13px', borderRadius: '100px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    fontSize: '12.5px', color: 'var(--text-2)', fontFamily: 'inherit',
    cursor: 'pointer',
  },
  filterChipActive: {
    background: 'var(--accent-bg)', borderColor: 'var(--accent-text)',
    color: 'var(--accent-text)', fontWeight: 600,
  },
  filterChipCount: {
    fontSize: '11px', fontWeight: 600,
    padding: '1px 7px', borderRadius: '999px',
    background: 'var(--surface-2)', color: 'var(--text-muted)',
  },
  searchWrap: { position: 'relative', flex: 1, minWidth: '240px', maxWidth: '420px' },
  searchInput: {
    width: '100%', padding: '9px 12px 9px 32px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', fontSize: '13px', color: 'var(--text)', fontFamily: 'inherit',
  },

  list: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  empty: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
    gap: '10px', padding: '40px 20px', textAlign: 'center' as const,
    background: 'var(--surface)', borderRadius: '12px', border: '1px dashed var(--border)',
    color: 'var(--text-muted)', fontSize: '13px',
  },

  card: {
    padding: '16px 18px', borderRadius: '14px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    transition: 'border-color var(--d-base, .2s) var(--ease-smooth, ease)',
  },
  cardHead: { display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' },
  iconWrap: {
    width: '32px', height: '32px', borderRadius: '8px',
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardTitle: {
    fontSize: '14px', fontWeight: 600, color: 'var(--text)',
    fontFamily: 'var(--font-fraunces), serif',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  cardSub: { fontSize: '12px', color: 'var(--text-2)', marginTop: '2px' },
  identifier: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', color: 'var(--text-2)' },
  badgeRow: { display: 'flex', gap: '6px', flexWrap: 'wrap', flexShrink: 0 },
  badge: {
    fontSize: '11px', fontWeight: 600,
    padding: '3px 9px', borderRadius: '999px',
    border: '1px solid', lineHeight: 1.4, whiteSpace: 'nowrap' as const,
  },
  cardMeta: {
    display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap',
    fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px',
  },
  description: {
    fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.55,
    margin: '4px 0 12px', whiteSpace: 'pre-wrap' as const, wordBreak: 'break-word' as const,
  },
  cardActions: { display: 'flex', gap: '6px', flexWrap: 'wrap' },

  editGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px 12px', marginBottom: '10px',
  },
  field: { display: 'flex', flexDirection: 'column' as const, gap: '4px', marginBottom: '8px' },
  fieldLabel: { fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 },
  fieldHint: { fontSize: '11px', color: 'var(--danger)' },
  input: {
    width: '100%', padding: '8px 11px',
    background: 'var(--bg-2)', border: '1px solid var(--border)',
    borderRadius: '8px', fontSize: '13px', color: 'var(--text)',
    fontFamily: 'inherit',
  },
  editActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' },

  btnGhost: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '6px 12px', borderRadius: '8px',
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    color: 'var(--text-2)', fontSize: '12px', fontFamily: 'inherit', cursor: 'pointer',
  },
  btnSuccess: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '6px 12px', borderRadius: '8px',
    background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.30)',
    color: 'var(--success-1)', fontSize: '12px', fontWeight: 600,
    fontFamily: 'inherit', cursor: 'pointer',
  },
  btnDanger: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '6px 12px', borderRadius: '8px',
    background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.25)',
    color: 'var(--danger)', fontSize: '12px', fontWeight: 600,
    fontFamily: 'inherit', cursor: 'pointer',
  },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '7px 14px', borderRadius: '8px',
    background: 'var(--accent-text)', color: 'var(--bg)',
    border: 'none', fontSize: '12.5px', fontWeight: 700,
    fontFamily: 'inherit', cursor: 'pointer',
  },
}
