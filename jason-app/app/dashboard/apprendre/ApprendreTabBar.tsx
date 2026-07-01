'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GraduationCap, BookOpen } from '@phosphor-icons/react/dist/ssr'

/**
 * Barre d'onglets pour /dashboard/apprendre/*.
 * Actualités reste en item de sidebar séparé (Option A+B du plan) — pas
 * dans Apprendre, pour donner un accès direct aux nouveautés produit.
 */
export default function ApprendreTabBar() {
  const pathname = usePathname() ?? ''
  const tabs = [
    { href: '/dashboard/apprendre/formations', label: 'Formations', Icon: GraduationCap },
    { href: '/dashboard/apprendre/guide',      label: 'Guide LCD',  Icon: BookOpen },
  ]
  return (
    <nav style={s.bar} aria-label="Onglets Apprendre">
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
    display: 'flex', gap: 4,
    borderBottom: '1px solid var(--border)',
    padding: '0 clamp(20px, 3vw, 44px)',
    overflowX: 'auto', WebkitOverflowScrolling: 'touch',
  },
  tab: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '12px 16px',
    fontSize: 13.5, fontWeight: 500,
    color: 'var(--text-3)',
    textDecoration: 'none',
    borderBottom: '2px solid transparent',
    marginBottom: -1, whiteSpace: 'nowrap',
    transition: 'color 0.15s, border-color 0.15s',
  },
  tabActive: {
    color: 'var(--accent-text)',
    borderBottomColor: 'var(--accent-text)',
    fontWeight: 600,
  },
}
