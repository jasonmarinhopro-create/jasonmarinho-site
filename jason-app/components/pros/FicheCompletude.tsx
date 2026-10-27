'use client'

// Jauge « Ta fiche est complète à X % » de Ma fiche (photographes et ménage).
// Calcul dans lib/pros/completude.ts, sur ce qui est saisi à l'écran.
import { useState } from 'react'
import { CheckCircle, Circle, ArrowRight, CaretDown } from '@phosphor-icons/react/dist/ssr'
import { completude, type CompletudeInput } from '@/lib/pros/completude'
import type { ProMetier } from '@/lib/pros/fiche-vitrine'

export default function FicheCompletude({ input, metier, onGo }: { input: CompletudeInput; metier: ProMetier; /** Atelier : ouvre la partie au lieu de défiler */ onGo?: (anchor: string) => void }) {
  const { pct, points, next } = completude(input, metier)
  const [open, setOpen] = useState(false)
  const r = 26
  const c = 2 * Math.PI * r
  const go = (anchor: string) => onGo ? onGo(anchor) : document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div style={s.card}>
      <div style={s.head}>
        <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true" style={{ flexShrink: 0 }}>
          <circle cx="32" cy="32" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle cx="32" cy="32" r={r} fill="none" stroke={pct === 100 ? 'var(--accent-text)' : '#FFD56B'} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${(c * pct) / 100} ${c}`} transform="rotate(-90 32 32)" />
          <text x="32" y="37" textAnchor="middle" style={{ font: '600 15px var(--font-fraunces, Georgia), serif', fill: 'var(--text)' }}>{pct}%</text>
        </svg>
        <div style={{ minWidth: 0 }}>
          <div style={s.title}>{pct === 100 ? 'Ta fiche est complète' : `Ta fiche est complète à ${pct} %`}</div>
          <p style={s.sub}>{pct === 100 ? 'Tout ce que les hôtes regardent est là. Pense à la mettre à jour avec tes nouvelles réalisations.' : 'Plus elle est complète, plus les hôtes t’écrivent.'}</p>
        </div>
      </div>

      {next && (
        <button type="button" onClick={() => go(next.anchor)} style={s.next}>
          <span style={{ minWidth: 0 }}>
            <span style={s.nextL}>À faire ensuite</span>
            <span style={s.nextT}>{next.label}</span>
            <span style={s.nextH}>{next.hint}</span>
          </span>
          <ArrowRight size={16} weight="bold" style={{ flexShrink: 0 }} />
        </button>
      )}

      <button type="button" onClick={() => setOpen(o => !o)} style={s.toggle} aria-expanded={open}>
        {points.filter(p => p.done).length} sur {points.length} points faits
        <CaretDown size={12} weight="bold" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>
      {open && (
        <ul style={s.list}>
          {points.map(p => (
            <li key={p.key}>
              <button type="button" onClick={() => go(p.anchor)} style={s.item}>
                {p.done
                  ? <CheckCircle size={16} weight="fill" color="var(--accent-text)" />
                  : <Circle size={16} weight="regular" color="var(--text-3)" />}
                <span style={{ flex: 1, textAlign: 'left', color: p.done ? 'var(--text-2)' : 'var(--text)' }}>{p.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 },
  head: { display: 'flex', alignItems: 'center', gap: 14 },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 18, color: 'var(--text)', lineHeight: 1.25 },
  sub: { margin: '4px 0 0', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 },
  next: { display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent-text)', cursor: 'pointer', fontFamily: 'inherit' },
  nextL: { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' },
  nextT: { display: 'block', fontSize: 14.5, fontWeight: 600, color: 'var(--text)', marginTop: 2 },
  nextH: { display: 'block', fontSize: 12.5, color: 'var(--text-2)', marginTop: 2, lineHeight: 1.45 },
  toggle: { display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, fontSize: 12.5, color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' },
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 },
  item: { display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '7px 4px', background: 'none', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13.5, fontFamily: 'inherit' },
}
