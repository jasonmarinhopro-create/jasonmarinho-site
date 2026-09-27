'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FacebookLogo, GoogleLogo } from '@phosphor-icons/react/dist/ssr'

// Hub « Trouver des voyageurs » (sept. 2026) : les leviers pour remplir le
// calendrier en direct, sans commission. Avant, les groupes Facebook étaient
// rangés dans « Entre Hôtes » (communauté d'hôtes) et l'audit Google dans
// « Outils & calculs », alors que les deux servent à attirer des voyageurs.
export default function VisibiliteTabBar() {
  const pathname = usePathname() ?? ''
  const tabs = [
    { href: '/dashboard/visibilite/facebook', label: 'Groupes Facebook', Icon: FacebookLogo },
    { href: '/dashboard/visibilite/google',   label: 'Fiche Google',     Icon: GoogleLogo },
  ]
  return (
    <nav style={s.bar} aria-label="Onglets Trouver des voyageurs">
      {tabs.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link key={href} href={href} style={{ ...s.tab, ...(active ? s.tabActive : {}) }} aria-current={active ? 'page' : undefined}>
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
    padding: '0 var(--dash-page-px)',
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
  },
  tabActive: {
    color: 'var(--accent-text)',
    borderBottomColor: 'var(--accent-text)',
    fontWeight: 600,
  },
}
