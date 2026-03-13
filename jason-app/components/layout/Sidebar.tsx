'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HouseSimple, GraduationCap, Handshake, FileText,
  UsersThree, SignOut, X, UserCircle
} from '@phosphor-icons/react'
import JmLogo from '@/components/JmLogo'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard',             label: 'Accueil',     icon: HouseSimple },
  { href: '/dashboard/formations',  label: 'Formations',  icon: GraduationCap },
  { href: '/dashboard/gabarits',    label: 'Gabarits',    icon: FileText },
  { href: '/dashboard/partenaires', label: 'Partenaires', icon: Handshake },
  { href: '/dashboard/communaute',  label: 'Communauté',  icon: UsersThree },
]

interface SidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 98, backdropFilter: 'blur(4px)',
          }}
        />
      )}

      <aside
        className={`dash-sidebar${mobileOpen ? ' open' : ''}`}
        style={styles.sidebar}
      >
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>
            <JmLogo size={20} />
          </div>
          <span style={styles.logoText}>
            Jason <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>Marinho</em>
          </span>
          {onClose && (
            <button onClick={onClose} style={styles.closeBtn} className="dash-close-btn">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav style={styles.nav}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}
              >
                <Icon size={18} weight={active ? 'fill' : 'regular'} />
                <span>{label}</span>
                {active && <div style={styles.activeDot} />}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={styles.sideFooter}>
          <Link
            href="/dashboard/profil"
            onClick={onClose}
            style={{
              ...styles.navItem,
              ...(pathname === '/dashboard/profil' ? styles.navItemActive : {}),
            }}
          >
            <UserCircle size={18} weight={pathname === '/dashboard/profil' ? 'fill' : 'regular'} />
            <span>Mon profil</span>
            {pathname === '/dashboard/profil' && <div style={styles.activeDot} />}
          </Link>

          <div style={styles.footerDivider} />

          <a
            href="https://jasonmarinho.com"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.footerLink}
          >
            <JmLogo size={14} color="rgba(240,244,255,0.4)" />
            jasonmarinho.com
          </a>
          <button onClick={handleSignOut} style={styles.signOut}>
            <SignOut size={16} />
            Se déconnecter
          </button>
        </div>
      </aside>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    position: 'fixed', top: 0, left: 0, bottom: 0,
    width: 'var(--sidebar-w)',
    background: 'rgba(0,51,42,0.98)',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', flexDirection: 'column',
    zIndex: 99,
    backdropFilter: 'blur(20px)',
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '20px 20px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  logoIcon: {
    width: '34px', height: '34px', flexShrink: 0,
    background: 'rgba(0,76,63,0.5)',
    border: '1px solid rgba(255,213,107,0.18)',
    borderRadius: '9px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'Fraunces, serif', fontSize: '15px',
    fontWeight: 600, color: '#f0f4ff', flex: 1,
  },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'rgba(240,244,255,0.4)', padding: '4px',
    alignItems: 'center', justifyContent: 'center',
  },
  nav: {
    flex: 1, padding: '16px 12px',
    display: 'flex', flexDirection: 'column', gap: '4px',
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '11px',
    padding: '10px 12px', borderRadius: '10px',
    fontSize: '14px', fontWeight: 400,
    color: 'rgba(240,244,255,0.5)',
    textDecoration: 'none',
    transition: 'all 0.18s',
    position: 'relative',
  },
  navItemActive: {
    background: 'rgba(255,213,107,0.08)',
    color: '#FFD56B',
    fontWeight: 500,
    border: '1px solid rgba(255,213,107,0.12)',
  },
  activeDot: {
    position: 'absolute', right: '12px',
    width: '5px', height: '5px',
    background: '#FFD56B', borderRadius: '50%',
  },
  sideFooter: {
    padding: '12px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    display: 'flex', flexDirection: 'column', gap: '4px',
  },
  footerDivider: {
    height: '1px', background: 'rgba(255,255,255,0.05)', margin: '6px 0',
  },
  footerLink: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '9px 12px', borderRadius: '9px',
    fontSize: '12px', color: 'rgba(240,244,255,0.3)',
    textDecoration: 'none',
    transition: 'color 0.18s',
  },
  signOut: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '9px 12px', borderRadius: '9px',
    fontSize: '13px', fontWeight: 400,
    color: 'rgba(240,244,255,0.4)',
    background: 'none', border: 'none', cursor: 'pointer',
    width: '100%', textAlign: 'left',
    transition: 'all 0.18s',
  },
}
