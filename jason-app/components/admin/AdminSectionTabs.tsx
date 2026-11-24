'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UsersThree, Briefcase, Binoculars, LinkSimple, MagnifyingGlass, PaperPlaneTilt, EnvelopeSimple } from '@phosphor-icons/react/dist/ssr'

/**
 * Onglets des pages admin regroupées (18/11/2026, maquette validée par Jason) :
 * une entrée du menu = un sujet, les pages du sujet en onglets. Affichés
 * seulement sur les pages d'entrée (pas sur une fiche membre ou une fiche pro).
 * Pros : une seule page à onglets par métier (/dashboard/admin/pros, 24/11/2026).
 */
type Tab = { href: string; label: string; Icon: React.ElementType }
const SECTIONS: Array<{ label: string; tabs: Tab[] }> = [
  {
    label: 'Hôtes',
    tabs: [
      { href: '/dashboard/admin/membres', label: 'Hôtes', Icon: UsersThree },
      { href: '/dashboard/admin/investisseurs', label: 'Investisseurs', Icon: Briefcase },
    ],
  },
  {
    label: 'Trafic & SEO',
    tabs: [
      { href: '/dashboard/admin/visibilite', label: 'Visibilité', Icon: Binoculars },
      { href: '/dashboard/admin/provenance', label: 'Provenance', Icon: LinkSimple },
      { href: '/dashboard/admin/indexation', label: 'Référencement', Icon: MagnifyingGlass },
    ],
  },
  {
    label: 'Prospection',
    tabs: [
      { href: '/dashboard/admin/prospection', label: 'Ma prospection', Icon: PaperPlaneTilt },
      { href: '/dashboard/admin/prospection/emails', label: 'E-mails de la plateforme', Icon: EnvelopeSimple },
    ],
  },
]

export default function AdminSectionTabs() {
  const pathname = usePathname() ?? ''
  const section = SECTIONS.find(s => s.tabs.some(t => t.href === pathname))
  if (!section) return null
  return (
    <nav style={s.wrap} aria-label={section.label}>
      <div style={s.bar}>
        {section.tabs.map(({ href, label, Icon }) => {
          const active = href === pathname
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              style={{
                ...s.tab,
                border: active ? '1px solid var(--border)' : '1px solid transparent',
                background: active ? 'var(--surface)' : 'transparent',
                color: active ? 'var(--text)' : 'var(--text-2)',
                boxShadow: active ? 'var(--card-shadow)' : 'none',
                fontWeight: active ? 600 : 500,
              }}
            >
              <Icon size={15} weight={active ? 'fill' : 'regular'} style={{ color: active ? 'var(--accent-text)' : 'var(--text-3)' }} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { padding: '20px var(--dash-page-px) 0' },
  bar: {
    display: 'inline-flex', gap: 4, padding: 4, maxWidth: '100%', overflowX: 'auto',
    background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12,
  },
  tab: {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 9,
    fontSize: 13.5, textDecoration: 'none', whiteSpace: 'nowrap',
    transition: 'background 0.15s, box-shadow 0.15s, border 0.15s',
  },
}
