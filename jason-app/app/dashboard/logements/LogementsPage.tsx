'use client'

import { useState, useTransition } from 'react'
import { Plus, X, House, PencilSimple, Trash, Warning, Check } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import { createLogement, updateLogement, deleteLogement, type LogementData } from './actions'

const DEFAULT_ANNULATION =
  `En cas d'annulation par le locataire plus de 30 jours avant l'arrivée, l'acompte versé est remboursé intégralement. En cas d'annulation moins de 30 jours avant l'arrivée, l'acompte reste acquis au bailleur.`
const DEFAULT_REGLEMENT =
  `- Respecter le calme et la tranquillité du voisinage.\n- Interdiction de fumer à l'intérieur du logement.\n- Les animaux de compagnie ne sont pas admis sauf accord préalable du bailleur.\n- Toute fête ou rassemblement est interdit sans autorisation écrite du bailleur.\n- Le locataire s'engage à laisser le logement dans l'état dans lequel il l'a trouvé.`

type Logement = {
  id: string
  nom: string
  adresse: string
  telephone: string | null
  description: string | null
  capacite_max: number
  reglement_interieur: string | null
  conditions_annulation: string | null
  animaux_acceptes: boolean
  fumeur_accepte: boolean
  methodes_paiement: string | null
}

interface Props {
  logements: Logement[]
}

function emptyForm(): LogementData {
  return {
    nom: '',
    adresse: '',
    telephone: '',
    description: '',
    capacite_max: 1,
    reglement_interieur: DEFAULT_REGLEMENT,
    conditions_annulation: DEFAULT_ANNULATION,
    animaux_acceptes: false,
    fumeur_accepte: false,
    methodes_paiement: 'virement',
  }
}

export default function LogementsPage({ logements: initial }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [logements, setLogements] = useState<Logement[]>(initial)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Logement | null>(null)
  const [form, setForm] = useState<LogementData>(emptyForm())
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function set(field: string, value: string | number | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function openCreate() {
    setForm(emptyForm())
    setEditing(null)
    setError('')
    setModal('create')
  }

  function openEdit(l: Logement) {
    setForm({
      nom: l.nom,
      adresse: l.adresse,
      telephone: l.telephone ?? '',
      description: l.description ?? '',
      capacite_max: l.capacite_max,
      reglement_interieur: l.reglement_interieur ?? DEFAULT_REGLEMENT,
      conditions_annulation: l.conditions_annulation ?? DEFAULT_ANNULATION,
      animaux_acceptes: l.animaux_acceptes,
      fumeur_accepte: l.fumeur_accepte,
      methodes_paiement: l.methodes_paiement ?? 'virement',
    })
    setEditing(l)
    setError('')
    setModal('edit')
  }

  function closeModal() {
    setModal(null)
    setEditing(null)
    setError('')
  }

  function validate(): string {
    if (!form.nom.trim()) return 'Le nom du logement est requis.'
    if (!form.adresse.trim()) return "L'adresse est requise."
    if (form.capacite_max < 1) return 'La capacité doit être au moins 1.'
    return ''
  }

  function handleSave() {
    const err = validate()
    if (err) { setError(err); return }
    setError('')

    startTransition(async () => {
      if (modal === 'create') {
        const res = await createLogement(form)
        if (res.error) { setError(res.error); return }
        // Mise à jour immédiate de l'état local sans attendre router.refresh()
        const newLogement: Logement = {
          id: res.id!,
          nom: form.nom,
          adresse: form.adresse,
          telephone: form.telephone ?? null,
          description: form.description ?? null,
          capacite_max: form.capacite_max,
          reglement_interieur: form.reglement_interieur ?? null,
          conditions_annulation: form.conditions_annulation ?? null,
          animaux_acceptes: form.animaux_acceptes,
          fumeur_accepte: form.fumeur_accepte,
          methodes_paiement: form.methodes_paiement ?? 'virement',
        }
        setLogements(prev => [newLogement, ...prev])
        setSuccess('Logement créé !')
      } else if (modal === 'edit' && editing) {
        const res = await updateLogement(editing.id, form)
        if (res.error) { setError(res.error); return }
        // Mise à jour immédiate de la fiche modifiée dans la liste
        setLogements(prev => prev.map(l => l.id === editing.id ? {
          ...l,
          nom: form.nom,
          adresse: form.adresse,
          telephone: form.telephone ?? null,
          description: form.description ?? null,
          capacite_max: form.capacite_max,
          reglement_interieur: form.reglement_interieur ?? null,
          conditions_annulation: form.conditions_annulation ?? null,
          animaux_acceptes: form.animaux_acceptes,
          fumeur_accepte: form.fumeur_accepte,
          methodes_paiement: form.methodes_paiement ?? 'virement',
        } : l))
        setSuccess('Modifications enregistrées !')
      }
      closeModal()
      setTimeout(() => setSuccess(''), 3000)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteLogement(id)
      if (res.error) { setError(res.error); return }
      setLogements(prev => prev.filter(l => l.id !== id))
      setDeleteConfirm(null)
    })
  }

  return (
    <div style={page}>
      <div style={container}>
        {/* Header */}
        <div style={headerRow}>
          <div>
            <h1 style={pageTitle}>
              Mes <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>logements</em>
            </h1>
            <p style={pageSubtitle}>
              Créez des fiches pour chacun de vos biens — elles pré-rempliront automatiquement les contrats.
            </p>
          </div>
          <button onClick={openCreate} style={addBtn}>
            <Plus size={16} weight="bold" />
            Nouveau logement
          </button>
        </div>

        {success && (
          <div style={successBanner}>
            <Check size={14} weight="bold" />
            {success}
          </div>
        )}

        {/* Empty state */}
        {logements.length === 0 && (
          <div style={emptyState}>
            <div style={emptyIcon}><House size={32} color="#34D399" weight="thin" /></div>
            <p style={emptyTitle}>Aucun logement enregistré</p>
            <p style={emptyText}>
              Créez votre première fiche logement pour gagner du temps lors de la création de vos contrats.
            </p>
            <button onClick={openCreate} style={addBtnAlt}>
              <Plus size={15} weight="bold" />
              Créer un logement
            </button>
          </div>
        )}

        {/* Grid */}
        {logements.length > 0 && (
          <div style={grid}>
            {logements.map(l => (
              <div key={l.id} style={card}>
                <div style={cardTop}>
                  <div style={cardIcon}><House size={18} color="#34D399" /></div>
                  <div style={cardActions}>
                    <button onClick={() => openEdit(l)} style={iconBtn} title="Modifier">
                      <PencilSimple size={14} />
                    </button>
                    <button onClick={() => setDeleteConfirm(l.id)} style={{ ...iconBtn, color: '#ef4444' }} title="Supprimer">
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
                <h3 style={cardName}>{l.nom}</h3>
                <p style={cardAddress}>{l.adresse}</p>
                <div style={cardMeta}>
                  <span style={chip}>{l.capacite_max} pers.</span>
                  {l.animaux_acceptes && <span style={chip}>Animaux ✓</span>}
                  {l.fumeur_accepte && <span style={chip}>Fumeur ✓</span>}
                  <span style={{ ...chip, background: 'rgba(162,155,254,0.08)', border: '1px solid rgba(162,155,254,0.2)', color: '#a29bfe' }}>
                    {(() => {
                      const m = l.methodes_paiement ?? 'virement'
                      const parts = m.split(',').map(s => s.trim())
                      const icons: Record<string, string> = { virement: '🏦', stripe: '💳', especes: '💵', cheque: '📄', paypal: '🅿️', airbnb: '🏠', carte: '💳' }
                      return parts.map(p => icons[p] ?? p).join(' ')
                    })()}
                  </span>
                </div>
                {l.description && (
                  <p style={cardDesc}>{l.description.slice(0, 80)}{l.description.length > 80 ? '…' : ''}</p>
                )}

                {/* Delete confirm */}
                {deleteConfirm === l.id && (
                  <div style={deleteBox}>
                    <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--text-2)' }}>
                      Supprimer ce logement ? Cette action est irréversible.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleDelete(l.id)} disabled={isPending} style={deleteConfirmBtn}>
                        {isPending ? 'Suppression…' : 'Supprimer'}
                      </button>
                      <button onClick={() => setDeleteConfirm(null)} style={cancelBtn}>
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <div style={overlay} onClick={closeModal}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <div>
                <p style={modalTag}>{modal === 'create' ? 'Nouveau logement' : 'Modifier le logement'}</p>
                <h3 style={modalTitle}>{modal === 'create' ? 'Créer une fiche logement' : form.nom || 'Modifier'}</h3>
              </div>
              <button onClick={closeModal} style={closeBtn}><X size={18} /></button>
            </div>

            <div style={modalBody}>
              <div style={fieldRow}>
                <Field label="Nom du logement *" value={form.nom} onChange={v => set('nom', v)} placeholder="Villa les Pins, Appartement Paris 11…" />
              </div>
              <div style={fieldRow}>
                <Field label="Adresse complète *" value={form.adresse} onChange={v => set('adresse', v)} placeholder="12 rue de la Paix, 75001 Paris" />
              </div>
              <div style={fieldRow}>
                <Field label="Téléphone du logement" value={form.telephone ?? ''} onChange={v => set('telephone', v)} placeholder="+33 6 12 34 56 78" type="tel" />
              </div>
              <div style={fieldRow}>
                <Field label="Description (type, superficie, équipements)" value={form.description ?? ''} onChange={v => set('description', v)} placeholder="Studio de 25m², cuisine équipée, Wi-Fi, vue mer…" />
              </div>
              <div style={fieldRow}>
                <label style={label}>Capacité maximale (personnes) *</label>
                <input
                  style={input}
                  type="number" min={1} max={30}
                  value={form.capacite_max}
                  onChange={e => set('capacite_max', parseInt(e.target.value) || 1)}
                />
              </div>
              <div style={fieldRow}>
                <label style={label}>Conditions d&apos;annulation</label>
                <textarea
                  style={{ ...input, height: '80px', resize: 'vertical' as const, fontFamily: 'inherit' }}
                  value={form.conditions_annulation ?? ''}
                  onChange={e => set('conditions_annulation', e.target.value)}
                />
              </div>
              <div style={fieldRow}>
                <label style={label}>Règlement intérieur</label>
                <textarea
                  style={{ ...input, height: '100px', resize: 'vertical' as const, fontFamily: 'inherit' }}
                  value={form.reglement_interieur ?? ''}
                  onChange={e => set('reglement_interieur', e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' as const }}>
                <Toggle label="Animaux admis" value={form.animaux_acceptes} onChange={v => set('animaux_acceptes', v)} />
                <Toggle label="Tabac autorisé" value={form.fumeur_accepte} onChange={v => set('fumeur_accepte', v)} />
              </div>
              <div style={fieldRow}>
                <label style={label}>Méthodes de paiement acceptées</label>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
                  {([
                    { value: 'virement', label: '🏦 Virement bancaire' },
                    { value: 'stripe',   label: '💳 Paiement Stripe (en ligne)' },
                    { value: 'especes',  label: '💵 Espèces' },
                    { value: 'cheque',   label: '📄 Chèque' },
                    { value: 'paypal',   label: '🅿️ PayPal' },
                    { value: 'airbnb',   label: '🏠 Airbnb / Booking' },
                    { value: 'carte',    label: '💳 Carte bancaire (TPE)' },
                  ] as { value: string; label: string }[]).map(opt => {
                    const selected = (form.methodes_paiement ?? 'virement').split(',').map(s => s.trim())
                    const checked = selected.includes(opt.value)
                    const toggle = () => {
                      const next = checked ? selected.filter(v => v !== opt.value) : [...selected, opt.value]
                      set('methodes_paiement', next.length ? next.join(',') : 'virement')
                    }
                    return (
                      <label key={opt.value} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '7px',
                        padding: '7px 12px', borderRadius: '10px', cursor: 'pointer',
                        background: checked ? 'rgba(52,211,153,0.1)' : 'var(--surface)',
                        border: `1px solid ${checked ? 'rgba(52,211,153,0.35)' : 'var(--border)'}`,
                        fontSize: '13px', fontWeight: checked ? 600 : 400,
                        color: checked ? '#34D399' : 'var(--text-2)',
                        transition: 'all 0.15s', userSelect: 'none' as const,
                      }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={toggle}
                          style={{ display: 'none' }}
                        />
                        {opt.label}
                      </label>
                    )
                  })}
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--text-3)' }}>
                  Sélectionnez tous les modes acceptés — ils seront proposés dans le contrat.
                </p>
              </div>
              {error && (
                <div style={errorBox}>
                  <Warning size={13} />
                  {error}
                </div>
              )}
            </div>

            <div style={modalFooter}>
              <button onClick={closeModal} style={ghostBtn}>Annuler</button>
              <button onClick={handleSave} disabled={isPending} style={saveBtn}>
                {isPending ? 'Enregistrement…' : modal === 'create' ? (
                  <><Plus size={14} /> Créer le logement</>
                ) : (
                  <><Check size={14} /> Enregistrer</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function Field({ label: lbl, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={label}>{lbl}</label>
      <input style={input} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

function Toggle({ label: lbl, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
      <input
        type="checkbox" checked={value} onChange={e => onChange(e.target.checked)}
        style={{ width: '16px', height: '16px', accentColor: '#34D399' }}
      />
      <span style={{ fontSize: '14px', color: 'var(--text-2)' }}>{lbl}</span>
    </label>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const page: React.CSSProperties = {
  padding: 'clamp(20px,3vw,44px)', maxWidth: '960px',
}

const container: React.CSSProperties = {}

const headerRow: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
  flexWrap: 'wrap' as const, gap: '16px', marginBottom: '28px',
}

const pageTitle: React.CSSProperties = {
  fontFamily: 'Fraunces, serif',
  fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: 'var(--text)', margin: '0 0 6px',
}

const pageSubtitle: React.CSSProperties = {
  fontSize: '14px', color: 'var(--text-2)', margin: 0, lineHeight: 1.6,
}

const addBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '7px',
  background: 'linear-gradient(135deg, #FFD56B 0%, #f59e0b 100%)', color: '#1a1a0e',
  border: 'none', borderRadius: '12px',
  padding: '10px 18px', fontSize: '14px', fontWeight: 600,
  cursor: 'pointer', flexShrink: 0,
}

const addBtnAlt: React.CSSProperties = {
  ...addBtn,
  background: 'rgba(255,213,107,0.10)',
  border: '1px solid rgba(255,213,107,0.25)',
  color: '#FFD56B',
}

const successBanner: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
  borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
  fontSize: '13px', color: '#34D399', fontWeight: 500,
}

const emptyState: React.CSSProperties = {
  textAlign: 'center' as const,
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '20px', padding: '60px 40px',
}

const emptyIcon: React.CSSProperties = {
  width: '64px', height: '64px',
  background: 'rgba(52,211,153,0.08)',
  border: '1px solid rgba(52,211,153,0.15)',
  borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  margin: '0 auto 20px',
}

const emptyTitle: React.CSSProperties = {
  fontFamily: 'Fraunces, Georgia, serif',
  fontSize: '20px', fontWeight: 400, color: 'var(--text)', margin: '0 0 8px',
}

const emptyText: React.CSSProperties = {
  fontSize: '14px', color: 'var(--text-2)', margin: '0 0 24px', lineHeight: 1.6,
  maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto',
}

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '16px',
}

const card: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '16px', padding: '20px',
  display: 'flex', flexDirection: 'column', gap: '8px',
}

const cardTop: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  marginBottom: '4px',
}

const cardIcon: React.CSSProperties = {
  width: '36px', height: '36px',
  background: 'rgba(52,211,153,0.08)',
  border: '1px solid rgba(52,211,153,0.15)',
  borderRadius: '10px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const cardActions: React.CSSProperties = {
  display: 'flex', gap: '6px',
}

const iconBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '30px', height: '30px',
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: '8px', cursor: 'pointer',
  color: 'var(--text-2)', transition: 'all 0.15s',
}

const cardName: React.CSSProperties = {
  fontFamily: 'Fraunces, Georgia, serif',
  fontSize: '17px', fontWeight: 400, color: 'var(--text)', margin: 0,
}

const cardAddress: React.CSSProperties = {
  fontSize: '13px', color: 'var(--text-2)', margin: 0, lineHeight: 1.5,
}

const cardMeta: React.CSSProperties = {
  display: 'flex', gap: '6px', flexWrap: 'wrap' as const,
}

const chip: React.CSSProperties = {
  display: 'inline-block',
  background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)',
  borderRadius: '6px', padding: '3px 8px',
  fontSize: '11px', color: '#34D399', fontWeight: 500,
}

const cardDesc: React.CSSProperties = {
  fontSize: '12px', color: 'var(--text-3)', margin: 0, lineHeight: 1.5,
}

const deleteBox: React.CSSProperties = {
  marginTop: '8px', padding: '14px',
  background: 'rgba(239,68,68,0.06)',
  border: '1px solid rgba(239,68,68,0.15)',
  borderRadius: '10px',
}

const deleteConfirmBtn: React.CSSProperties = {
  padding: '6px 14px', borderRadius: '8px',
  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
  color: '#ef4444', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
}

const cancelBtn: React.CSSProperties = {
  padding: '6px 14px', borderRadius: '8px',
  background: 'none', border: '1px solid var(--border)',
  color: 'var(--text-2)', fontSize: '13px', cursor: 'pointer',
}

// Modal
const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 400,
  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
}

const modalBox: React.CSSProperties = {
  background: 'var(--bg-2, #0f2018)',
  border: '1px solid var(--border-2, #1e3d2f)',
  borderRadius: '22px',
  width: '100%', maxWidth: '560px',
  maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 32px 100px rgba(0,0,0,0.5)',
}

const modalHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
  padding: '22px 24px 16px',
  borderBottom: '1px solid var(--border, #1e3d2f)',
}

const modalTag: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, letterSpacing: '1.2px',
  textTransform: 'uppercase', color: '#34D399', margin: '0 0 4px',
}

const modalTitle: React.CSSProperties = {
  fontFamily: 'Fraunces, Georgia, serif',
  fontSize: '20px', fontWeight: 400, color: 'var(--text)', margin: 0,
}

const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--text-3)', padding: '4px',
}

const modalBody: React.CSSProperties = {
  padding: '20px 24px',
  display: 'flex', flexDirection: 'column', gap: '14px',
}

const modalFooter: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '16px 24px 20px',
  borderTop: '1px solid var(--border, #1e3d2f)',
}

const fieldRow: React.CSSProperties = {
  display: 'flex', flexDirection: 'column',
}

const label: React.CSSProperties = {
  display: 'block',
  fontSize: '12px', fontWeight: 500,
  color: 'var(--text-2)',
  marginBottom: '6px',
}

const input: React.CSSProperties = {
  display: 'block', width: '100%', boxSizing: 'border-box' as const,
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '10px', padding: '10px 12px',
  fontSize: '14px', color: 'var(--text)',
  outline: 'none',
}

const errorBox: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  fontSize: '13px', color: '#ef4444',
  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
  borderRadius: '8px', padding: '10px 14px',
}

const ghostBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: '14px', color: 'var(--text-2)', padding: '8px 0',
}

const saveBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  background: '#34D399', color: '#0a1a14',
  border: 'none', borderRadius: '12px',
  padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
}
