'use client'

// Configuration SIBA (Portugal) directement sur la fiche du logement.
// Avant, la config n'était accessible QUE via le modal d'une déclaration en
// attente — impossible de renseigner ses identifiants en amont (ou quand le
// widget est vide). Cette carte n'apparaît que pour les logements PT.

import { useState } from 'react'
import { PaperPlaneTilt, Check, CaretDown, CaretUp } from '@phosphor-icons/react/dist/ssr'
import { saveSibaConfig, type SibaConfigInput } from '@/lib/declarations/siba-actions'

interface Props {
  logementId: string
  initial: Partial<SibaConfigInput>
  configured: boolean
}

export default function SibaConfigCard({ logementId, initial, configured }: Props) {
  const [open, setOpen] = useState(!configured)
  const [config, setConfig] = useState<SibaConfigInput>({
    siba_unidade: initial.siba_unidade ?? '',
    siba_estabelecimento: initial.siba_estabelecimento ?? '00',
    siba_chave: initial.siba_chave ?? '',
    siba_abreviatura: initial.siba_abreviatura ?? '',
    siba_localidade: initial.siba_localidade ?? '',
    siba_codigo_postal: initial.siba_codigo_postal ?? '',
    siba_zona_postal: initial.siba_zona_postal ?? '',
    siba_telefone: initial.siba_telefone ?? '',
    siba_auto_envoi: initial.siba_auto_envoi ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setError('')
    setSaving(true)
    try {
      const res = await saveSibaConfig(logementId, config)
      if (res.error) { setError(res.error); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const set = (k: keyof SibaConfigInput, v: string | boolean) =>
    setConfig(c => ({ ...c, [k]: v }))

  return (
    <div style={s.card}>
      <button onClick={() => setOpen(v => !v)} style={s.head}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PaperPlaneTilt size={15} weight="fill" color="var(--accent-text)" />
          <span style={s.title}>Déclarations SIBA (Portugal)</span>
          {configured
            ? <span style={s.badgeOk}><Check size={11} weight="bold" /> Configuré</span>
            : <span style={s.badgeTodo}>À configurer</span>}
        </div>
        {open ? <CaretUp size={14} /> : <CaretDown size={14} />}
      </button>

      {open && (
        <div style={s.body}>
          <p style={s.hint}>
            Identifiants reçus après ton inscription SIBA (option « Web Service »).
            Une fois enregistrés, chaque check-in en ligne complété envoie
            automatiquement les boletins des voyageurs au SIBA.
          </p>
          <div style={s.grid} className="siba-grid">
            <Field label="NIPC / NIF (Unidade Hoteleira)" value={config.siba_unidade} onChange={v => set('siba_unidade', v)} placeholder="9 chiffres" />
            <Field label="N° établissement" value={config.siba_estabelecimento} onChange={v => set('siba_estabelecimento', v)} placeholder="0 ou 00" />
            <Field label="Chave de ativação" value={config.siba_chave} onChange={v => set('siba_chave', v)} placeholder="Reçue par email / courrier" />
            <Field label="Abréviation du nom (10 car. max)" value={config.siba_abreviatura} onChange={v => set('siba_abreviatura', v)} placeholder="CasaPedre" />
            <Field label="Localité" value={config.siba_localidade} onChange={v => set('siba_localidade', v)} placeholder="São Pedro do Sul" />
            <Field label="Code postal (4 chiffres)" value={config.siba_codigo_postal} onChange={v => set('siba_codigo_postal', v)} placeholder="3660" />
            <Field label="Zone postale (3 chiffres)" value={config.siba_zona_postal} onChange={v => set('siba_zona_postal', v)} placeholder="366" />
            <Field label="Téléphone" value={config.siba_telefone} onChange={v => set('siba_telefone', v)} placeholder="912345678" />
          </div>
          <label style={s.autoRow}>
            <input
              type="checkbox"
              checked={config.siba_auto_envoi ?? true}
              onChange={e => set('siba_auto_envoi', e.target.checked)}
              style={{ accentColor: 'var(--accent-text)' }}
            />
            <span style={s.autoText}>
              <strong>Envoi automatique</strong> : dès qu'un voyageur complète son
              check-in en ligne, son boletim part tout seul au SIBA (recommandé).
            </span>
          </label>
          {error && <p style={s.error}>{error}</p>}
          <button onClick={handleSave} disabled={saving} style={{ ...s.saveBtn, opacity: saving ? 0.6 : 1 }}>
            {saved ? <><Check size={14} weight="bold" /> Enregistré !</> : saving ? 'Enregistrement…' : 'Enregistrer la configuration SIBA'}
          </button>
        </div>
      )}
      <style>{`@media (max-width: 700px) { .siba-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: 0 }}>
      <label style={s.fieldLabel}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={s.input} />
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border-2)',
    borderRadius: '14px',
    margin: '0 var(--dash-page-px, 24px) 24px',
    overflow: 'hidden',
  },
  head: {
    width: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
    padding: '14px 18px',
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: 'var(--text-2)', fontFamily: 'var(--font-outfit), sans-serif',
  },
  title: { fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' },
  badgeOk: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '10.5px', fontWeight: 700, color: 'var(--success-1)',
    background: 'var(--success-bg, rgba(16,185,129,0.10))',
    border: '1px solid var(--success-border, rgba(16,185,129,0.3))',
    borderRadius: '999px', padding: '2px 8px',
  },
  badgeTodo: {
    fontSize: '10.5px', fontWeight: 700, color: 'var(--warning)',
    background: 'var(--warning-bg, rgba(245,158,11,0.10))',
    border: '1px solid rgba(245,158,11,0.3)',
    borderRadius: '999px', padding: '2px 8px',
  },
  body: {
    padding: '0 18px 18px',
    display: 'flex', flexDirection: 'column', gap: '14px',
  },
  hint: { fontSize: '12.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' },
  fieldLabel: { fontSize: '11.5px', fontWeight: 500, color: 'var(--text-3)' },
  input: {
    background: 'var(--bg)', border: '1px solid var(--border-2)', borderRadius: '9px',
    padding: '9px 12px', fontSize: '13.5px', color: 'var(--text)',
    fontFamily: 'var(--font-outfit), sans-serif', outline: 'none',
    width: '100%', boxSizing: 'border-box' as const,
  },
  autoRow: { display: 'flex', alignItems: 'flex-start', gap: '9px', cursor: 'pointer' },
  autoText: { fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.5 },
  error: { fontSize: '12.5px', color: 'var(--danger)', margin: 0 },
  saveBtn: {
    alignSelf: 'flex-start',
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    padding: '10px 18px', borderRadius: '10px',
    fontSize: '13px', fontWeight: 600,
    color: 'var(--accent-text)', background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)', cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif',
  },
}
