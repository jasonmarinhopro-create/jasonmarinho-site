'use client'

// Clientèles du pro (24/10/2026) : locations courte durée, hôtels, conciergeries
// haut de gamme, gîtes. Filtre de l'annuaire et priorité quand un hôtel, une
// conciergerie ou un gîte fait une demande. Liste : lib/pros/clienteles.ts.

import { HouseLine, Buildings, Key, Tree, Check } from '@phosphor-icons/react/dist/ssr'
import { CLIENTELES, type Clientele } from '@/lib/pros/clienteles'

const ICON = { lcd: HouseLine, hotel: Buildings, conciergerie: Key, gite: Tree } as const

export default function ClientelesFields({ value, onChange }: { value: Clientele[]; onChange: (v: Clientele[]) => void }) {
  const toggle = (k: Clientele) => onChange(value.includes(k) ? value.filter(x => x !== k) : [...value, k])
  return (
    <div style={s.field}>
      <span style={s.lbl}>Tu travailles pour</span>
      <div style={s.choices}>
        {CLIENTELES.map(c => {
          const Icon = ICON[c.key]
          const on = value.includes(c.key)
          return (
            <button key={c.key} type="button" aria-pressed={on} onClick={() => toggle(c.key)} style={{ ...s.chip, ...(on ? s.on : {}) }}>
              {on ? <Check size={14} weight="bold" /> : <Icon size={15} />}{c.pro}
            </button>
          )
        })}
      </div>
      <span style={s.hint}>Quand un hôtel, une conciergerie ou un gîte fait une demande dans ta zone, elle arrive d’abord chez les pros qui l’ont coché. Les hôtes filtrent aussi l’annuaire avec.</span>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  lbl: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  hint: { fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 },
  choices: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  on: { border: '1px solid var(--accent-text)', background: 'var(--accent-bg)', color: 'var(--accent-text)' },
}
