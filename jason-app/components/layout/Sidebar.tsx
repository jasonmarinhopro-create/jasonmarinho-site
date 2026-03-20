'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HouseSimple, GraduationCap, Handshake, FileText,
  UsersThree, SignOut, X, UserCircle, Question, CreditCard, ShieldCheck, Gear,
  FacebookLogo,
} from '@phosphor-icons/react'
import JmLogo from '@/components/JmLogo'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const mainNav = [
  { href: '/dashboard',             label: 'Accueil',     icon: HouseSimple },
  { href: '/dashboard/formations',  label: 'Formations',  icon: GraduationCap },
  { href: '/dashboard/gabarits',    label: 'Gabarits',    icon: FileText },
  { href: '/dashboard/partenaires', label: 'Partenaires', icon: Handshake },
  { href: '/dashboard/communaute',  label: 'Communauté',  icon: UsersThree },
]

const accountNav = [
  { href: '/dashboard/securite',    label: 'Sécurité',      icon: ShieldCheck },
  { href: '/dashboard/abonnement',  label: 'Abonnement',    icon: CreditCard },
  { href: '/dashboard/profil',      label: 'Mon profil',    icon: UserCircle },
  { href: '/dashboard/aide',        label: "Centre d'aide", icon: Question },
]

interface SidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
  isAdmin?: boolean
}

export default function Sidebar({ mobileOpen, onClose, isAdmin }: SidebarProps) {
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
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
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
          <a href="https://jasonmarinho.com" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flex: 1 }}>
            <div style={styles.logoIcon}>
              <JmLogo size={20} />
            </div>
            <span style={styles.logoText}>
              Jason <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>Marinho</em>
            </span>
          </a>
          {onClose && (
            <button onClick={onClose} style={styles.closeBtn} className="dash-close-btn">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav style={styles.nav}>
          {/* Section principale */}
          <div style={styles.navSection}>
            {mainNav.map(({ href, label, icon: Icon }) => {
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
          </div>

          {/* Séparateur Compte */}
          <div style={styles.navDivider}>
            <div style={styles.navDividerLine} />
            <span style={styles.navDividerLabel}>Compte</span>
            <div style={styles.navDividerLine} />
          </div>

          {/* Section compte */}
          <div style={styles.navSection}>
            {accountNav.map(({ href, label, icon: Icon }) => {
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
          </div>

          {/* Section admin — visible uniquement pour Jason */}
          {isAdmin && (
            <>
              <div style={styles.navDivider}>
                <div style={styles.navDividerLine} />
                <span style={{ ...styles.navDividerLabel, color: 'var(--nav-admin-color)' }}>Admin</span>
                <div style={styles.navDividerLine} />
              </div>
              <div style={styles.navSection}>
                {[
                  { href: '/dashboard/admin',              label: 'Administration', Icon: Gear },
                  { href: '/dashboard/admin/membres',      label: 'Membres',        Icon: UsersThree },
                  { href: '/dashboard/admin/gabarits',     label: 'Gabarits',       Icon: FileText },
                  { href: '/dashboard/admin/formations',   label: 'Formations',     Icon: GraduationCap },
                  { href: '/dashboard/admin/communaute',   label: 'Communauté',     Icon: FacebookLogo },
                ].map(({ href, label, Icon }) => {
                  const active = pathname === href
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onClose}
                      style={{
                        ...styles.navItem,
                        ...(active ? styles.navItemActive : {}),
                        ...(!active ? { color: 'var(--nav-admin-color)' } : {}),
                      }}
                    >
                      <Icon size={18} weight={active ? 'fill' : 'regular'} />
                      <span>{label}</span>
                      {active && <div style={styles.activeDot} />}
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </nav>

        {/* Footer */}
        <div style={styles.sideFooter}>
          <div style={styles.footerDivider} />
          <a
            href="https://jasonmarinho.com"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.footerLink}
          >
            <JmLogo size={14} color="var(--nav-item)" />
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
    background: 'var(--nav-bg)',
    borderRight: '1px solid var(--nav-border)',
    display: 'flex', flexDirection: 'column',
    zIndex: 99,
    backdropFilter: 'blur(20px)',
    transition: 'background 0.25s ease, border-color 0.25s ease',
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '20px 20px 16px',
    borderBottom: '1px solid var(--nav-border)',
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
    fontWeight: 600, color: 'var(--text)', flex: 1,
  },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-3)', padding: '4px',
    alignItems: 'center', justifyContent: 'center',
  },
  nav: {
    flex: 1, padding: '12px 12px',
    display: 'flex', flexDirection: 'column', gap: '0',
    overflowY: 'auto',
  },
  navSection: {
    display: 'flex', flexDirection: 'column', gap: '2px',
  },
  navDivider: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '14px 4px 10px',
  },
  navDividerLine: {
    flex: 1, height: '1px', background: 'var(--nav-border)',
  },
  navDividerLabel: {
    fontSize: '10px', fontWeight: 600, letterSpacing: '0.9px',
    textTransform: 'uppercase', color: 'var(--text-muted)',
    whiteSpace: 'nowrap', flexShrink: 0,
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '11px',
    padding: '10px 12px', borderRadius: '10px',
    fontSize: '14px', fontWeight: 400,
    color: 'var(--nav-item)',
    textDecoration: 'none',
    transition: 'all 0.18s',
    position: 'relative',
  },
  navItemActive: {
    background: 'var(--nav-active-bg)',
    color: 'var(--nav-active-color)',
    fontWeight: 500,
    border: '1px solid var(--nav-active-border)',
  },
  activeDot: {
    position: 'absolute', right: '12px',
    width: '5px', height: '5px',
    background: 'var(--nav-active-color)', borderRadius: '50%',
  },
  sideFooter: {
    padding: '12px',
    display: 'flex', flexDirection: 'column', gap: '4px',
  },
  footerDivider: {
    height: '1px', background: 'var(--nav-border)', margin: '0 0 4px',
  },
  footerLink: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '9px 12px', borderRadius: '9px',
    fontSize: '12px', color: 'var(--text-muted)',
    textDecoration: 'none',
    transition: 'color 0.18s',
  },
  signOut: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '9px 12px', borderRadius: '9px',
    fontSize: '13px', fontWeight: 400,
    color: 'var(--text-3)',
    background: 'none', border: 'none', cursor: 'pointer',
    width: '100%', textAlign: 'left',
    transition: 'all 0.18s',
  },
}
