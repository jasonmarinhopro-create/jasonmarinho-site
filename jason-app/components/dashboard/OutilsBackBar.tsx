'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'

/**
 * Barre "Retour aux outils & calculs" affichee uniquement sur les 4 sous-pages
 * du hub /dashboard/outils :
 *  - /dashboard/simulateurs
 *  - /dashboard/calculateurs
 *  - /dashboard/audit-gbp
 *  - /dashboard/outils-impression
 *
 * Signale par Jason : sur ces pages, aucun moyen visible de remonter au hub.
 * Cette barre discrete en haut de la zone contenu donne ce chemin sans
 * pourrir les vues internes des outils.
 */
const TOOL_PATHS = [
  '/dashboard/simulateurs',
  '/dashboard/calculateurs',
  '/dashboard/audit-gbp',
  '/dashboard/outils-impression',
]

export default function OutilsBackBar() {
  const pathname = usePathname() ?? ''
  const isToolPage = TOOL_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (!isToolPage) return null

  return (
    <div style={s.wrap}>
      <Link href="/dashboard/outils" style={s.link} prefetch className="jm-back-link">
        <span style={s.ico}><ArrowLeft size={13} weight="bold" /></span>
        <span>Retour aux outils &amp; calculs</span>
      </Link>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    padding: 'var(--dash-page-px) var(--dash-page-px) 0',
    marginBottom: -4,
    maxWidth: 1600, marginLeft: 'auto', marginRight: 'auto',
    width: '100%',
  },
  link: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '6px 12px 6px 10px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 999,
    color: 'var(--text-2)',
    fontSize: 12.5, fontWeight: 500,
    textDecoration: 'none',
    transition: 'background 0.15s, border-color 0.15s, color 0.15s',
  },
  ico: {
    width: 20, height: 20, borderRadius: 5,
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
}
