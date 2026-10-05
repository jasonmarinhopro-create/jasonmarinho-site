'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChartBar, ListBullets, ChartLineUp, Scales } from '@phosphor-icons/react/dist/ssr'

/**
 * Onglets de /dashboard/finances/*. La période (?periode=) suit l'utilisateur
 * entre Revenus, Journal et Performances.
 */
const TABS = [
  { href: '/dashboard/finances/revenus',       label: 'Revenus',            Icon: ChartBar,    periode: true },
  { href: '/dashboard/finances/journal',       label: 'Journal',            Icon: ListBullets, periode: true },
  { href: '/dashboard/finances/performances',  label: 'Performances',       Icon: ChartLineUp, periode: true },
  { href: '/dashboard/finances/fiscalite',     label: 'Fiscalité',          Icon: Scales,      periode: false },
]

export default function FinancesTabBar() {
  const pathname = usePathname() ?? ''
  const periode = useSearchParams()?.get('periode')

  return (
    <nav style={s.bar} aria-label="Onglets Mes finances">
      {TABS.map(({ href, label, Icon, periode: keep }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={keep && periode ? `${href}?periode=${periode}` : href}
            style={{ ...s.tab, ...(active ? s.tabActive : {}) }}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={15} weight={active ? 'fill' : 'regular'} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

const s: Record<string, React.CSSProperties> = {
  bar: {
    display: 'flex',
    gap: 4,
    borderBottom: '1px solid var(--border)',
    padding: '0 var(--dash-page-px)',
    marginBottom: 0,
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  tab: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '12px 14px',
    fontSize: 13.5, fontWeight: 500,
    color: 'var(--text-3)',
    textDecoration: 'none',
    borderBottom: '2px solid transparent',
    marginBottom: -1,
    whiteSpace: 'nowrap',
    transition: 'color 0.15s, border-color 0.15s',
  },
  tabActive: {
    color: 'var(--accent-text)',
    borderBottomColor: 'var(--accent-text)',
    fontWeight: 600,
  },
}
