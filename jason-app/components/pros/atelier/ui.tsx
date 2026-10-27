'use client'

// Briques visuelles de l'atelier de Ma fiche (champs, interrupteur, choix
// segmentés). Styles en ligne, couleurs de la marque (vert, touche de jaune).
import type { CSSProperties, ReactNode } from 'react'

export const atelierInput: CSSProperties = {
  padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)',
  color: 'var(--text)', fontSize: 15, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', minHeight: 46,
}

export function Field({ label, hint, req, children, group }: { label: string; hint?: ReactNode; req?: boolean; children: ReactNode; /** Pastilles, interrupteurs : pas un <label> */ group?: boolean }) {
  const body = (
    <>
      <span style={ui.label}>{label}{req && <span style={{ color: 'var(--danger-text)' }}> *</span>}</span>
      {children}
      {hint && <span style={ui.hint}>{hint}</span>}
    </>
  )
  // Un groupe (pastilles, interrupteur) n'est pas un <label> : un clic sur le titre ne doit rien cocher
  return !group
    ? <label style={ui.field}>{body}</label>
    : <div style={ui.field}>{body}</div>
}

export function Group({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={ui.groupTitle}>{title}</div>
        {aside}
      </div>
      {children}
    </div>
  )
}

export function Toggle({ checked, onChange, label, sub, icon }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string; icon?: ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} style={ui.toggleRow}>
      {icon && <span style={ui.toggleIcon}>{icon}</span>}
      <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
        {sub && <span style={{ display: 'block', fontSize: 12.5, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.45 }}>{sub}</span>}
      </span>
      <span aria-hidden="true" style={{ ...ui.switchTrack, background: checked ? 'var(--accent-text)' : 'var(--border)' }}>
        <span style={{ ...ui.switchKnob, left: checked ? 21 : 3, background: checked ? '#FFD56B' : 'var(--surface)' }} />
      </span>
    </button>
  )
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T | ''; onChange: (v: T | '') => void; options: Array<[T, string]>; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} style={{ ...ui.segment, gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(([k, l]) => {
        const on = value === k
        return (
          <button key={k} type="button" role="radio" aria-checked={on} onClick={() => onChange(on ? '' : k)}
            style={{ ...ui.segBtn, ...(on ? ui.segOn : {}) }}>{l}</button>
        )
      })}
    </div>
  )
}

export const ui: Record<string, CSSProperties> = {
  field: { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text-2)' },
  hint: { fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 },
  groupTitle: { fontSize: 13.5, fontWeight: 700, color: 'var(--text)' },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 },
  toggleRow: { display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '14px 16px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontFamily: 'inherit', minHeight: 56 },
  toggleIcon: { width: 38, height: 38, borderRadius: 11, background: 'var(--accent-text)', color: '#FFD56B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  switchTrack: { position: 'relative', width: 44, height: 26, borderRadius: 999, flexShrink: 0, transition: 'background .15s' },
  switchKnob: { position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%', transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' },
  segment: { display: 'grid', gap: 4, padding: 4, borderRadius: 12, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' },
  segBtn: { border: 'none', padding: '10px 6px', borderRadius: 9, background: 'transparent', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer', minHeight: 42 },
  segOn: { background: 'var(--surface)', color: 'var(--accent-text)', fontWeight: 700, boxShadow: '0 2px 8px rgba(0,26,17,.10)' },
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
}
