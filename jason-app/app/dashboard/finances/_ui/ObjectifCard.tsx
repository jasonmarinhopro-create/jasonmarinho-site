'use client'

// Objectif de chiffre d'affaires de l'année, par logement (ou global en vue
// « tous »). Réalisé = séjours arrivés ; réservé = déjà réservé d'ici la fin
// de l'année.
import { useState, useTransition } from 'react'
import { Target, PencilSimple } from '@phosphor-icons/react/dist/ssr'
import { setObjectif } from '../actions'
import { Card, CardHead, eur, pct, ui } from './ui'

interface Props {
  year: number
  objectif: number | null
  realise: number
  reserve: number
  logementId: string | null
  /** Vue « tous » avec plusieurs logements : l'objectif se fixe par logement */
  editable: boolean
  editHint?: string
}

export default function ObjectifCard({ year, objectif, realise, reserve, logementId, editable, editHint }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(objectif ? String(Math.round(objectif)) : '')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function save() {
    const n = Number(value.replace(/\s/g, '').replace(',', '.'))
    setError(null)
    start(async () => {
      const res = await setObjectif(logementId, Number.isFinite(n) && n > 0 ? n : null)
      if (res?.error) setError(res.error)
      else setEditing(false)
    })
  }

  const total = realise + reserve
  const ratio = objectif ? total / objectif : 0

  return (
    <Card>
      <CardHead
        title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Target size={18} weight="duotone" color="var(--accent-text)" />Objectif {year}</span>}
        right={editable && !editing ? (
          <button type="button" onClick={() => setEditing(true)} style={ui.btnGhost}>
            <PencilSimple size={14} /> {objectif ? 'Modifier' : 'Fixer'}
          </button>
        ) : undefined}
      />

      {editing ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            inputMode="numeric"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="ex. 30000"
            aria-label={`Objectif de chiffre d'affaires ${year} en euros`}
            style={{ flex: '1 1 140px', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit' }}
          />
          <button type="button" onClick={save} disabled={pending} style={ui.btn}>{pending ? 'Enregistrement…' : 'Enregistrer'}</button>
          <button type="button" onClick={() => setEditing(false)} style={ui.btnGhost}>Annuler</button>
          {error && <p style={{ width: '100%', margin: 0, fontSize: 12.5, color: '#C2410C' }}>{error}</p>}
        </div>
      ) : objectif ? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 26, color: 'var(--text)' }}>{eur(total)}</span>
            <span style={{ fontSize: 13.5, color: 'var(--text-3)' }}>sur {eur(objectif)} · {pct(ratio)}</span>
          </div>
          <div style={{ height: 10, borderRadius: 999, background: 'var(--bg-3)', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${Math.min(100, (realise / objectif) * 100)}%`, background: 'var(--accent-text)' }} />
            <div style={{ width: `${Math.min(100 - Math.min(100, (realise / objectif) * 100), (reserve / objectif) * 100)}%`, background: 'rgba(47,158,91,0.35)' }} />
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>
            {eur(realise)} déjà gagnés{reserve > 0 ? ` + ${eur(reserve)} de séjours réservés` : ''}.{' '}
            {total >= objectif
              ? <strong style={{ color: 'var(--accent-text)' }}>Objectif atteint.</strong>
              : <>Il manque <strong>{eur(objectif - total)}</strong> d&apos;ici le 31 décembre.</>}
          </p>
        </>
      ) : (
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.55 }}>
          {editable
            ? `Fixe un chiffre d'affaires à atteindre en ${year} : tu verras chaque mois où tu en es, séjours déjà réservés compris.`
            : editHint}
        </p>
      )}
    </Card>
  )
}
