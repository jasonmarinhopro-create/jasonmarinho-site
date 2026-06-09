'use client'

import { useState, useTransition } from 'react'
import {
  ArrowSquareOut, House, BookOpen, Bell, GlobeHemisphereWest, Storefront,
  PencilSimple, Plus, X, Trash, FloppyDisk, Link as LinkIcon, MapPin,
} from '@phosphor-icons/react/dist/ssr'
import { savePlatformLinks, type PlatformLinksInput } from './profil/actions'

export type PlatformLinksData = {
  inbox_airbnb_url: string | null
  inbox_booking_url: string | null
  inbox_vrbo_url: string | null
  inbox_abritel_url: string | null
  inbox_driing_url: string | null
  inbox_gmb_url: string | null
  custom_platform_links: Array<{ label: string; url: string; color?: string }>
}

type BuiltInKey = 'airbnb' | 'booking' | 'vrbo' | 'abritel' | 'driing' | 'gmb'

type BuiltIn = {
  key: BuiltInKey
  label: string
  color: string
  bg: string
  /** Icône à afficher (Phosphor name). */
  icon: React.ReactNode
  /** Suggestion d'URL inbox par défaut (montrée dans le placeholder). */
  placeholder: string
}

const BUILTIN: BuiltIn[] = [
  { key: 'airbnb',  label: 'Airbnb',  color: '#FF5A5F', bg: 'rgba(255,90,95,0.13)',  icon: <House size={18} weight="duotone" />,              placeholder: 'https://www.airbnb.fr/hosting/reservations' },
  { key: 'booking', label: 'Booking', color: '#003580', bg: 'rgba(0,53,128,0.18)',   icon: <BookOpen size={18} weight="duotone" />,           placeholder: 'https://admin.booking.com/extranet_ng/manage/messaging' },
  { key: 'driing',  label: 'Driing',  color: 'var(--accent-text)', bg: 'var(--accent-bg)', icon: <Bell size={18} weight="duotone" />,         placeholder: 'https://driing.com/hote/messages' },
  { key: 'vrbo',    label: 'Vrbo',    color: '#4ade80', bg: 'rgba(74,222,128,0.13)', icon: <GlobeHemisphereWest size={18} weight="duotone" />, placeholder: 'https://www.vrbo.com/hosting' },
  { key: 'abritel', label: 'Abritel', color: '#fbbf24', bg: 'rgba(251,191,36,0.13)', icon: <Storefront size={18} weight="duotone" />,         placeholder: 'https://admin.abritel.fr' },
  { key: 'gmb',     label: 'Google My Business', color: '#4285F4', bg: 'rgba(66,133,244,0.13)', icon: <MapPin size={18} weight="duotone" />,   placeholder: 'https://business.google.com/dashboard' },
]

function urlForKey(data: PlatformLinksData, key: BuiltInKey): string | null {
  switch (key) {
    case 'airbnb':  return data.inbox_airbnb_url
    case 'booking': return data.inbox_booking_url
    case 'vrbo':    return data.inbox_vrbo_url
    case 'abritel': return data.inbox_abritel_url
    case 'driing':  return data.inbox_driing_url
    case 'gmb':     return data.inbox_gmb_url
  }
}

export default function MesPlateformesWidget({ initialData }: { initialData: PlatformLinksData }) {
  const [data, setData] = useState<PlatformLinksData>(initialData)
  const [editOpen, setEditOpen] = useState(false)

  // Tuiles à afficher : built-in avec URL configurée + custom
  const activeBuiltIn = BUILTIN.filter(b => urlForKey(data, b.key))
  const customs = data.custom_platform_links ?? []
  const total = activeBuiltIn.length + customs.length

  return (
    <section style={s.card} data-tour="plateformes">
      <header style={s.head}>
        <div style={s.titleWrap}>
          <span style={s.titleIcon}><LinkIcon size={15} weight="duotone" /></span>
          <h3 style={s.title}>Mes plateformes</h3>
        </div>
        <button
          onClick={() => setEditOpen(true)}
          style={s.editBtn}
          aria-label="Configurer mes liens plateformes"
        >
          <PencilSimple size={12} weight="bold" />
          {total === 0 ? <span>Configurer</span> : null}
        </button>
      </header>

      {total === 0 ? (
        <button onClick={() => setEditOpen(true)} style={s.empty}>
          <Plus size={14} weight="bold" />
          <span>Ajoute tes liens Airbnb, Booking, etc. pour y accéder en 1 clic.</span>
        </button>
      ) : (
        <div style={s.grid} className="plateformes-grid">
          {activeBuiltIn.map(b => {
            const href = urlForKey(data, b.key)!
            return (
              <a
                key={b.key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...s.tile, borderColor: `${b.color}40`, background: b.bg }}
                title={`Ouvrir ${b.label}`}
              >
                <span style={{ color: b.color }}>{b.icon}</span>
                <span style={s.tileLabel}>{b.label}</span>
                <ArrowSquareOut size={11} weight="bold" style={s.tileExt} />
              </a>
            )
          })}
          {customs.map((c, i) => (
            <a
              key={`custom-${i}`}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...s.tile,
                borderColor: c.color ? `${c.color}40` : 'var(--border)',
                background: c.color ? `${c.color}15` : 'var(--surface-2)',
              }}
              title={`Ouvrir ${c.label}`}
            >
              <span style={{ color: c.color ?? 'var(--text-2)' }}>
                <Storefront size={18} weight="duotone" />
              </span>
              <span style={s.tileLabel}>{c.label}</span>
              <ArrowSquareOut size={11} weight="bold" style={s.tileExt} />
            </a>
          ))}
        </div>
      )}

      {editOpen && (
        <EditPlatformsModal
          initial={data}
          onClose={() => setEditOpen(false)}
          onSaved={(newData) => { setData(newData); setEditOpen(false) }}
        />
      )}

      {/* Responsive grid : 2 col mobile / 3 col tablet / 4-5 col desktop */}
      <style>{`
        .plateformes-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        @media (min-width: 640px) {
          .plateformes-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (min-width: 980px) {
          .plateformes-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }
        @media (min-width: 1280px) {
          .plateformes-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
        }
      `}</style>
    </section>
  )
}

// ─── Modal d'édition ───────────────────────────────────────────────────

function EditPlatformsModal({
  initial, onClose, onSaved,
}: {
  initial: PlatformLinksData
  onClose: () => void
  onSaved: (data: PlatformLinksData) => void
}) {
  const [form, setForm] = useState<PlatformLinksData>(initial)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function setField(key: BuiltInKey, value: string) {
    const fieldKey = `inbox_${key}_url` as keyof PlatformLinksData
    setForm(f => ({ ...f, [fieldKey]: value || null }))
  }

  function addCustom() {
    setForm(f => ({
      ...f,
      custom_platform_links: [...(f.custom_platform_links ?? []), { label: '', url: '' }],
    }))
  }
  function updateCustom(i: number, patch: Partial<{ label: string; url: string }>) {
    setForm(f => ({
      ...f,
      custom_platform_links: (f.custom_platform_links ?? []).map((c, idx) => idx === i ? { ...c, ...patch } : c),
    }))
  }
  function removeCustom(i: number) {
    setForm(f => ({
      ...f,
      custom_platform_links: (f.custom_platform_links ?? []).filter((_, idx) => idx !== i),
    }))
  }

  function save() {
    setError(null)
    const payload: PlatformLinksInput = {
      inbox_airbnb_url: form.inbox_airbnb_url,
      inbox_booking_url: form.inbox_booking_url,
      inbox_vrbo_url: form.inbox_vrbo_url,
      inbox_abritel_url: form.inbox_abritel_url,
      inbox_driing_url: form.inbox_driing_url,
      inbox_gmb_url: form.inbox_gmb_url,
      custom_platform_links: form.custom_platform_links ?? [],
    }
    startTransition(async () => {
      const r = await savePlatformLinks(payload)
      if (r.error) setError(r.error)
      else onSaved(form)
    })
  }

  return (
    <>
      <div onClick={onClose} style={s.backdrop} />
      <div style={s.modal} role="dialog" aria-label="Configurer mes plateformes">
        <header style={s.modalHead}>
          <div style={s.titleWrap}>
            <span style={s.titleIcon}><LinkIcon size={15} weight="duotone" /></span>
            <h2 style={s.modalTitle}>Mes plateformes</h2>
          </div>
          <button onClick={onClose} aria-label="Fermer" style={s.closeBtn}>
            <X size={16} weight="bold" />
          </button>
        </header>
        <div style={s.modalBody}>
          <p style={s.help}>
            Colle ici les liens vers les inbox/dashboards de tes plateformes pour y accéder en 1 clic depuis ton tableau de bord.
          </p>

          {BUILTIN.map(b => {
            const value = urlForKey(form, b.key) ?? ''
            return (
              <label key={b.key} style={s.field}>
                <span style={{ ...s.fieldLabel, color: b.color }}>
                  {b.icon}
                  <span>{b.label}</span>
                </span>
                <input
                  type="url"
                  inputMode="url"
                  value={value}
                  onChange={e => setField(b.key, e.target.value)}
                  placeholder={b.placeholder}
                  style={s.input}
                />
              </label>
            )
          })}

          {/* Plateformes custom */}
          <div style={s.customBlock}>
            <div style={s.customHead}>
              <span style={s.customHeadLabel}>Autres plateformes</span>
              <button onClick={addCustom} style={s.btnGhost} type="button">
                <Plus size={11} weight="bold" /> Ajouter
              </button>
            </div>
            {(form.custom_platform_links ?? []).map((c, i) => (
              <div key={i} style={s.customRow}>
                <input
                  type="text"
                  placeholder="Nom (ex: Hospitable)"
                  value={c.label}
                  onChange={e => updateCustom(i, { label: e.target.value })}
                  style={{ ...s.input, flex: '0 1 200px' }}
                />
                <input
                  type="url"
                  inputMode="url"
                  placeholder="https://…"
                  value={c.url}
                  onChange={e => updateCustom(i, { url: e.target.value })}
                  style={{ ...s.input, flex: 1 }}
                />
                <button
                  onClick={() => removeCustom(i)}
                  aria-label="Supprimer cette plateforme"
                  style={s.removeBtn}
                  type="button"
                >
                  <Trash size={12} weight="bold" />
                </button>
              </div>
            ))}
            {(form.custom_platform_links ?? []).length === 0 && (
              <p style={s.customEmpty}>Aucune plateforme custom — utile pour Hospitable, Smoobu, ton site direct…</p>
            )}
          </div>

          {error && <div style={s.error}>{error}</div>}
        </div>
        <footer style={s.modalFoot}>
          <button onClick={onClose} disabled={pending} style={s.btnGhost} type="button">Annuler</button>
          <button onClick={save} disabled={pending} style={s.btnPrimary} type="button">
            <FloppyDisk size={12} weight="bold" />
            {pending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </footer>
      </div>
    </>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: 'clamp(14px, 2vw, 20px)',
    marginBottom: 'clamp(18px, 2.5vw, 26px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
  },
  titleWrap: { display: 'flex', alignItems: 'center', gap: '8px' },
  titleIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26, height: 26,
    borderRadius: 7,
    background: 'var(--accent-bg)',
    color: 'var(--accent-text)',
  },
  title: {
    margin: 0,
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '16px',
    fontWeight: 400,
    color: 'var(--text)',
  },
  editBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 10px',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '7px',
    color: 'var(--text-2)',
    fontSize: '11.5px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // Empty state
  empty: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 16px',
    width: '100%',
    border: '1px dashed var(--border-2)',
    background: 'var(--bg)',
    borderRadius: '10px',
    color: 'var(--text-2)',
    fontSize: '12.5px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    textAlign: 'left',
    lineHeight: 1.5,
  },

  // Grid + tile
  grid: {
    display: 'grid',
    gap: '8px',
  },
  tile: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    border: '1px solid',
    borderRadius: '10px',
    textDecoration: 'none',
    color: 'var(--text)',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'transform .15s ease, background .15s ease',
    minHeight: 44, // a11y tap target
  },
  tileLabel: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  tileExt: { color: 'var(--text-muted)', flexShrink: 0 },

  // Modal
  backdrop: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(3px)',
    zIndex: 200,
  },
  modal: {
    position: 'fixed',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(560px, calc(100vw - 28px))',
    maxHeight: 'calc(100vh - 56px)',
    background: 'var(--floating-surface)',
    border: '1px solid var(--floating-border)',
    borderRadius: '14px',
    zIndex: 201,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 30px 60px -10px rgba(0,0,0,0.5)',
  },
  modalHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 18px',
    borderBottom: '1px solid var(--border)',
  },
  modalTitle: { margin: 0, fontFamily: 'var(--font-fraunces), serif', fontSize: '17px', fontWeight: 400, color: 'var(--text)' },
  closeBtn: {
    width: 28, height: 28, borderRadius: 7,
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  },
  modalBody: {
    padding: '16px 18px',
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  modalFoot: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
    padding: '12px 18px',
    borderTop: '1px solid var(--border)',
  },
  help: {
    margin: 0,
    fontSize: '12.5px',
    color: 'var(--text-2)',
    lineHeight: 1.5,
    paddingBottom: '4px',
  },

  // Field
  field: { display: 'flex', flexDirection: 'column', gap: '5px' },
  fieldLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.2px',
  },
  input: {
    padding: '9px 11px',
    fontSize: '16px', // iOS no-zoom
    color: 'var(--text)',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    fontFamily: 'inherit',
    width: '100%',
    minWidth: 0,
  },

  // Custom platforms
  customBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingTop: '10px',
    marginTop: '6px',
    borderTop: '1px dashed var(--border)',
  },
  customHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  customHeadLabel: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
  },
  customRow: {
    display: 'flex',
    gap: '6px',
    alignItems: 'stretch',
    flexWrap: 'wrap',
  },
  removeBtn: {
    width: 36, height: 36,
    flexShrink: 0,
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--warning)',
    borderRadius: '8px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  },
  customEmpty: {
    margin: 0,
    fontSize: '11.5px',
    fontStyle: 'italic',
    color: 'var(--text-muted)',
    padding: '6px 0',
  },

  // Error
  error: {
    fontSize: '12.5px',
    color: 'var(--warning)',
    background: 'var(--warning-bg)',
    border: '1px solid var(--warning-border)',
    padding: '8px 10px',
    borderRadius: '7px',
  },

  // Buttons
  btnGhost: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '8px 12px',
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-2)',
    fontSize: '12.5px',
    borderRadius: '7px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '8px 14px',
    background: 'var(--accent-text)',
    border: '1px solid var(--accent-text)',
    color: 'var(--bg)',
    fontSize: '13px',
    fontWeight: 600,
    borderRadius: '7px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
}
