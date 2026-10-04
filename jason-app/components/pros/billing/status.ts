import { STATUS_LABEL, type DisplayStatus } from '@/lib/pros/billing'

// Couleurs des statuts, aux couleurs de la marque (vert, ambre, brun, rouille)
const GREEN = 'var(--accent-text)'
const AMBER = '#B7791F'
const BROWN = '#6E5446'
const RUST = '#B4462F'
const MUTED = 'var(--text-muted)'

const COLOR: Record<DisplayStatus, string> = {
  brouillon: MUTED, en_attente: AMBER, expire: BROWN, accepte: GREEN, refuse: BROWN,
  a_encaisser: AMBER, en_retard: RUST, paye: GREEN, annule: MUTED, avoir: BROWN,
}

export function statusStyle(st: DisplayStatus): React.CSSProperties {
  const c = COLOR[st]
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999,
    fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
    color: c, background: `color-mix(in srgb, ${c} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${c} 30%, transparent)`,
  }
}

export const statusLabel = (st: DisplayStatus) => STATUS_LABEL[st]
