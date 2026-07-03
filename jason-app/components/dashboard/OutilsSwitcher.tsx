'use client'

import Link from 'next/link'
import { Calculator, ChartLineUp, MagnifyingGlass, Printer } from '@phosphor-icons/react/dist/ssr'

/**
 * Barre de navigation entre les 4 outils du hub /dashboard/outils :
 *  - Simulateurs fiscaux
 *  - Prix & marché
 *  - Audit GBP
 *  - QR & Affiches
 *
 * Remplace la version 2-liens (fiscal/marché) + la flèche "retour aux outils"
 * qui vivait dans OutilsBackBar. Les 4 boutons donnent une nav directe entre
 * outils sans passer par le hub — plus utile pour l'exploration.
 */
type Current = 'fiscal' | 'marche' | 'audit' | 'impression'

const ITEMS: Array<{ key: Current; href: string; label: string; Icon: any }> = [
  { key: 'fiscal',     href: '/dashboard/simulateurs',       label: 'Simulateurs fiscaux', Icon: Calculator },
  { key: 'marche',     href: '/dashboard/calculateurs',      label: 'Prix & marché',       Icon: ChartLineUp },
  { key: 'audit',      href: '/dashboard/audit-gbp',         label: 'Audit GBP',           Icon: MagnifyingGlass },
  { key: 'impression', href: '/dashboard/outils-impression', label: 'QR & Affiches',       Icon: Printer },
]

export default function OutilsSwitcher({ current }: { current: Current }) {
  return (
    <div style={s.wrap} role="navigation" aria-label="Navigation entre outils">
      {ITEMS.map(({ key, href, label, Icon }) => {
        const active = key === current
        return (
          <Link
            key={key}
            href={href}
            prefetch
            aria-current={active ? 'page' : undefined}
            style={active ? { ...s.btn, ...s.btnActive } : s.btn}
          >
            <Icon size={13} weight="fill" />
            <span>{label}</span>
          </Link>
        )
      })}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'inline-flex', flexWrap: 'wrap' as const, gap: '4px', padding: '4px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', marginBottom: 'clamp(18px, 2.5vw, 26px)',
  },
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '7px 12px', borderRadius: '7px',
    fontSize: '12.5px', fontWeight: 500,
    color: 'var(--text-2)', background: 'transparent',
    textDecoration: 'none',
    transition: 'all .18s cubic-bezier(.4,0,.2,1)',
    whiteSpace: 'nowrap' as const,
  },
  btnActive: {
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
    fontWeight: 700,
  },
}
