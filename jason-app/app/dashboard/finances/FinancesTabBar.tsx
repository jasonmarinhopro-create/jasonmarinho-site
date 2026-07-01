'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChartBar, Bank, ChartLineUp } from '@phosphor-icons/react/dist/ssr'

/**
 * Barre d'onglets pour /dashboard/finances/*.
 * L'onglet actif est déduit du pathname (client-side). Utilise <Link> :
 * chaque tab est une vraie URL indexable et bookmark-able.
 */
export default function FinancesTabBar() {
  const pathname = usePathname() ?? ''
  const tabs = [
    { href: '/dashboard/finances/revenus',       label: 'Revenus',       Icon: ChartBar },
    { href: '/dashboard/finances/encaissements', label: 'Encaissements', Icon: Bank },
    { href: '/dashboard/finances/performances',  label: 'Performances',  Icon: ChartLineUp },
  ]

  return (
    <nav style={s.bar} aria-label="Onglets Mes finances">
      {tabs.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
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
    padding: '12px 16px',
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
