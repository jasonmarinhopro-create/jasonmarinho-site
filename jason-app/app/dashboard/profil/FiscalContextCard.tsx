'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Scales, Check, Info, Compass } from '@phosphor-icons/react/dist/ssr'
import { saveAutresRevenusPro } from './actions'

interface Props {
  initialValue: number | null
}

export default function FiscalContextCard({ initialValue }: Props) {
  const [value, setValue] = useState<string>(initialValue !== null ? String(initialValue) : '')
  const [savedValue, setSavedValue] = useState<number | null>(initialValue)
  const [saving, startTransition] = useTransition()
  const [error, setError] = useState<string>('')
  const [savedFlash, setSavedFlash] = useState(false)

  const dirty = value !== (savedValue !== null ? String(savedValue) : '')

  function handleSave() {
    setError('')
    const num = value.trim() === '' ? null : Number(value.replace(/\s/g, ''))
    if (num !== null && (!Number.isFinite(num) || num < 0 || num > 10_000_000)) {
      setError('Montant invalide (0 à 10 000 000 €)')
      return
    }
    startTransition(async () => {
      const res = await saveAutresRevenusPro(num)
      if (res.error) {
        setError(res.error)
        return
      }
      setSavedValue(num)
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 2000)
    })
  }

  return (
    <div style={s.card}>
      <div style={s.head}>
        <div style={s.iconWrap}><Scales size={20} weight="duotone" /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={s.title}>Profil fiscal</h3>
          <p style={s.desc}>Tes revenus pro hors LCD (salaires, BNC, autres BIC) pour détecter exactement LMNP vs LMP.</p>
        </div>
      </div>

      <div style={s.fieldWrap}>
        <label htmlFor="autres-revenus" style={s.label}>
          Revenus pro du foyer hors LCD (annuels)
        </label>
        <div style={s.inputRow}>
          <div style={s.inputBox}>
            <input
              id="autres-revenus"
              type="text"
              inputMode="numeric"
              value={value}
              onChange={e => { setValue(e.target.value); setError('') }}
              placeholder="ex : 45 000"
              style={s.input}
            />
            <span style={s.suffix}>€</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            style={{ ...s.btn, ...(dirty && !saving ? s.btnActive : s.btnDisabled) }}
          >
            {saving ? '...' : savedFlash ? <><Check size={14} weight="bold" /> Enregistré</> : 'Enregistrer'}
          </button>
        </div>
        {error && <div style={s.error}>{error}</div>}
        <div style={s.hint}>
          <Info size={12} weight="regular" style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Information privée, jamais partagée. Utilisée uniquement pour affiner ton statut LMNP/LMP côté simulateurs et activity overview.</span>
        </div>
      </div>

      <Link href="/dashboard?tour=1" style={s.tourLink}>
        <Compass size={13} weight="duotone" />
        Refaire la visite guidée du dashboard
      </Link>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: {
    padding: 'clamp(18px, 2.5vw, 26px)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '18px',
  },
  iconWrap: {
    width: '40px',
    height: '40px',
    borderRadius: '11px',
    background: 'linear-gradient(135deg, rgba(99,214,131,0.15), rgba(99,214,131,0.04))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#5DC077',
    flexShrink: 0,
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '17px',
    fontWeight: 500,
    color: 'var(--text)',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  desc: {
    fontSize: '13px',
    color: 'var(--text-2)',
    margin: '4px 0 0',
    lineHeight: 1.45,
  },
  fieldWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    color: 'var(--text-3)',
  },
  inputRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'stretch',
    flexWrap: 'wrap',
  },
  inputBox: {
    position: 'relative',
    flex: '1 1 220px',
    minWidth: '180px',
  },
  input: {
    width: '100%',
    padding: '12px 36px 12px 14px',
    fontSize: '15px',
    fontWeight: 500,
    color: 'var(--text)',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color .18s, box-shadow .18s',
  },
  suffix: {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '13px',
    color: 'var(--text-3)',
    pointerEvents: 'none',
  },
  btn: {
    padding: '11px 18px',
    border: '1px solid transparent',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all .18s cubic-bezier(.4,0,.2,1)',
  },
  btnActive: {
    background: 'var(--accent-text)',
    color: 'var(--bg)',
    boxShadow: '0 4px 12px rgba(255,213,107,0.22)',
  },
  btnDisabled: {
    background: 'var(--bg-2)',
    color: 'var(--text-muted)',
    cursor: 'not-allowed',
    border: '1px solid var(--border)',
  },
  error: {
    fontSize: '12px',
    color: '#fb7185',
    padding: '6px 10px',
    background: 'rgba(251,113,133,0.06)',
    border: '1px solid rgba(251,113,133,0.18)',
    borderRadius: '7px',
  },
  hint: {
    display: 'flex',
    gap: '7px',
    alignItems: 'flex-start',
    fontSize: '12px',
    color: 'var(--text-muted)',
    lineHeight: 1.45,
    marginTop: '4px',
  },
  tourLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    marginTop: '18px',
    paddingTop: '16px',
    borderTop: '1px dashed var(--border)',
    fontSize: '12.5px',
    fontWeight: 500,
    color: 'var(--accent-text)',
    textDecoration: 'none',
    transition: 'color .15s',
  },
}
