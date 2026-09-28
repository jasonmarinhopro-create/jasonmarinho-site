'use client'

// Période commune à Revenus, Journal et Performances (?periode= dans l'URL,
// conservée d'un onglet à l'autre par la barre d'onglets).
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { PeriodKey } from '@/lib/finances/engine'

export default function PeriodPicker({ current, options }: { current: PeriodKey; options: Array<{ key: PeriodKey; short: string }> }) {
  const pathname = usePathname() ?? ''
  return (
    <div style={s.bar} role="tablist" aria-label="Période">
      {options.map(o => {
        const active = o.key === current
        return (
          <Link
            key={o.key}
            href={o.key === 'annee' ? pathname : `${pathname}?periode=${o.key}`}
            role="tab"
            aria-selected={active}
            scroll={false}
            style={{ ...s.item, ...(active ? s.itemActive : {}) }}
          >
            {o.short}
          </Link>
        )
      })}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  bar: { display: 'inline-flex', gap: 2, padding: 3, borderRadius: 12, background: 'var(--bg-2)', border: '1px solid var(--border)', overflowX: 'auto', maxWidth: '100%' },
  item: { padding: '6px 12px', borderRadius: 9, fontSize: 13, fontWeight: 500, color: 'var(--text-3)', textDecoration: 'none', whiteSpace: 'nowrap' },
  itemActive: { background: 'var(--surface)', color: 'var(--accent-text)', fontWeight: 600, boxShadow: 'var(--shadow-sm)' },
}
