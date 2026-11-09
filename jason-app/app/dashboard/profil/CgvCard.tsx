'use client'

// Conditions générales de vente du bailleur (10/11/2026, demande d'une hôte :
// « intégrer mes CGV dans le contrat, la signature vaut acceptation »).
// Le texte est joint aux contrats au choix de l'hôte (assistant de contrat),
// reproduit dans un article du contrat et visé par la case de consentement
// que le voyageur coche avant de signer.

import { useState, useTransition } from 'react'
import { Scroll, Check, Info } from '@phosphor-icons/react/dist/ssr'
import { saveCgv } from './actions'

const MAX = 30000

export default function CgvCard({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue)
  const [saved, setSaved] = useState(initialValue)
  const [saving, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [flash, setFlash] = useState(false)
  const dirty = value.trim() !== saved.trim()

  function handleSave() {
    setError('')
    startTransition(async () => {
      const res = await saveCgv(value)
      if (res.error) { setError(res.error); return }
      setSaved(value.trim())
      setFlash(true)
      setTimeout(() => setFlash(false), 2000)
    })
  }

  return (
    <div id="cgv" style={s.card}>
      <div style={s.head}>
        <div style={s.iconWrap}><Scroll size={20} weight="duotone" /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={s.title}>Conditions générales de vente</h3>
          <p style={s.desc}>Jointes à tes contrats : le voyageur les reçoit avec le contrat et les accepte en signant.</p>
        </div>
      </div>
      <label htmlFor="cgv-texte" style={s.label}>Texte de tes CGV</label>
      <textarea
        id="cgv-texte"
        value={value}
        maxLength={MAX}
        onChange={e => { setValue(e.target.value); setError('') }}
        placeholder={'Colle ici le texte de tes conditions générales de vente.\nExemple : Article 1, Objet. Les présentes conditions régissent la location…'}
        style={s.textarea}
      />
      <div style={s.foot}>
        <span style={s.count}>{value.length.toLocaleString('fr-FR')} / {MAX.toLocaleString('fr-FR')} caractères</span>
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          style={{ ...s.btn, ...(dirty && !saving ? s.btnActive : s.btnDisabled) }}
        >
          {saving ? 'Enregistrement…' : flash ? <><Check size={14} weight="bold" /> Enregistré</> : 'Enregistrer'}
        </button>
      </div>
      {error && <div style={s.error}>{error}</div>}
      <div style={s.hint}>
        <Info size={12} weight="regular" style={{ flexShrink: 0, marginTop: 1 }} />
        <span>À chaque nouveau contrat, l&apos;assistant propose de les joindre. Elles sont reproduites dans un article du contrat (« la signature du contrat vaut acceptation des CGV ») et figées telles qu&apos;envoyées : modifier ce texte ne change pas un contrat déjà envoyé. En cas de contradiction, le contrat l&apos;emporte.</span>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: { padding: 'clamp(16px, 2.2vw, 22px)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl, 18px)', minWidth: 0, scrollMarginTop: '90px' },
  head: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' },
  iconWrap: { width: '36px', height: '36px', borderRadius: '11px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-text)', flexShrink: 0 },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', fontWeight: 500, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' },
  desc: { fontSize: '13px', color: 'var(--text-3)', margin: '2px 0 0', lineHeight: 1.45 },
  label: { display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '8px' },
  textarea: { width: '100%', minHeight: '180px', resize: 'vertical', padding: '12px 14px', fontSize: '14px', lineHeight: 1.55, color: 'var(--text)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  foot: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginTop: '10px' },
  count: { fontSize: '12px', color: 'var(--text-muted)' },
  btn: { padding: '11px 18px', border: '1px solid transparent', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '6px' },
  btnActive: { background: 'var(--accent-text)', color: 'var(--bg)' },
  btnDisabled: { background: 'var(--bg-2)', color: 'var(--text-muted)', cursor: 'not-allowed', border: '1px solid var(--border)' },
  error: { fontSize: '12px', color: 'var(--danger, #c0392b)', marginTop: '8px' },
  hint: { display: 'flex', gap: '6px', fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5, marginTop: '12px' },
}
