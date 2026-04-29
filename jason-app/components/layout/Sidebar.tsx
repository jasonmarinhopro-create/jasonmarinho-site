'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HouseSimple, GraduationCap, Handshake, FileText,
  UsersThree, SignOut, X, Gear, ShieldCheck, Users, BookOpen, Newspaper,
  FacebookLogo, CaretDown, House, ChartBar, CalendarBlank, Heart,
  MagnifyingGlass, ChatsCircle, Globe, Calculator,
} from '@phosphor-icons/react'
import JmLogo from '@/components/JmLogo'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navGroups = [
  {
    label: null,
    items: [
      { href: '/dashboard', label: 'Accueil', icon: HouseSimple },
    ],
  },
  {
    label: 'Apprendre',
    items: [
      { href: '/dashboard/formations',  label: 'Formations',  icon: GraduationCap },
      { href: '/dashboard/guide',        label: 'Guide LCD',   icon: BookOpen },
      { href: '/dashboard/actualites',   label: 'Actualités',  icon: Newspaper },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { href: '/dashboard/logements',   label: 'Mes Logements',     icon: House },
      { href: '/dashboard/voyageurs',   label: 'Mes Voyageurs',     icon: Users },
      { href: '/dashboard/revenus',     label: 'Revenus',           icon: ChartBar },
      { href: '/dashboard/calendrier',  label: 'Calendrier',        icon: CalendarBlank },
    ],
  },
  {
    label: 'Outils',
    items: [
      { href: '/dashboard/simulateurs',       label: 'Simulateurs',       icon: Calculator },
      { href: '/dashboard/outils/audit-gbp',  label: 'Audit GBP',         icon: MagnifyingGlass },
      { href: '/dashboard/gabarits',          label: 'Gabarits',          icon: FileText },
      { href: '/dashboard/securite',          label: 'Sécurité Voyageur', icon: ShieldCheck },
    ],
  },
  {
    label: 'Communauté',
    items: [
      { href: '/dashboard/chez-nous',   label: 'Chez Nous',   icon: ChatsCircle },
      { href: '/dashboard/communaute',  label: 'Groupes FB',  icon: UsersThree },
      { href: '/dashboard/partenaires', label: 'Écosystème', icon: Globe },
    ],
  },
]

const adminMain = [
  { href: '/dashboard/admin',         label: 'Vue d\'ensemble', Icon: Gear },
  { href: '/dashboard/admin/membres', label: 'Membres',         Icon: UsersThree },
]

const adminContent = [
  { href: '/dashboard/admin/formations', label: 'Formations', Icon: GraduationCap },
  { href: '/dashboard/admin/gabarits',   label: 'Gabarits',   Icon: FileText },
  { href: '/dashboard/admin/actualites', label: 'Actualités', Icon: Newspaper },
  { href: '/dashboard/admin/communaute', label: 'Communauté', Icon: FacebookLogo },
  { href: '/dashboard/admin/guides',     label: 'Guide LCD',  Icon: BookOpen },
]

interface SidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
  isAdmin?: boolean
  isContributor?: boolean
}

export default function Sidebar({ mobileOpen, onClose, isAdmin, isContributor }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [adminContentOpen, setAdminContentOpen] = useState(
    adminContent.some(item => pathname.startsWith(item.href))
  )

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  function NavItem({ href, label, Icon, adminColor }: { href: string; label: string; Icon: React.ElementType; adminColor?: boolean }) {
    const active = pathname === href
    return (
      <Link
        href={href}
        onClick={onClose}
        style={{
          ...styles.navItem,
          ...(active ? styles.navItemActive : {}),
          ...(!active && adminColor ? { color: 'var(--nav-admin-color)' } : {}),
        }}
      >
        <Icon size={18} weight={active ? 'fill' : 'regular'} />
        <span>{label}</span>
        {active && <div style={styles.activeDot} />}
      </Link>
    )
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
              Jason <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>Marinho</em>
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
          {navGroups.map((group, i) => (
            <div key={i}>
              {group.label && (
                <div style={styles.sectionLabel}>{group.label}</div>
              )}
              <div style={{ ...styles.navSection, ...(i === 0 ? { marginBottom: '4px' } : {}) }}>
                {group.items.map(({ href, label, icon: Icon }) => (
                  <NavItem key={href} href={href} label={label} Icon={Icon} />
                ))}
              </div>
            </div>
          ))}

          {/* Lien Contributeurs — visible pour tous, badge selon statut */}
          <Link
            href="/dashboard/contributeurs"
            onClick={onClose}
            style={{
              ...styles.navItem,
              ...(pathname === '/dashboard/contributeurs' ? styles.navItemActive : {}),
              marginTop: '2px',
            }}
          >
            <Heart size={18} weight={isContributor ? 'fill' : 'regular'} style={{ color: isContributor ? 'var(--accent-text)' : undefined }} />
            <span style={{ flex: 1 }}>Contributeurs</span>
            {pathname !== '/dashboard/contributeurs' && (
              isContributor
                ? <span style={styles.contributeurBadge}>✦</span>
                : <span style={styles.contributeurLock}>Rejoindre</span>
            )}
            {pathname === '/dashboard/contributeurs' && <div style={styles.activeDot} />}
          </Link>

          {/* Section admin — visible uniquement pour Jason */}
          {isAdmin && (
            <>
              <div style={styles.navDivider}>
                <div style={styles.navDividerLine} />
                <span style={{ ...styles.navDividerLabel, color: 'var(--nav-admin-color)' }}>Admin</span>
                <div style={styles.navDividerLine} />
              </div>

              <div style={styles.navSection}>
                {adminMain.map(({ href, label, Icon }) => (
                  <NavItem key={href} href={href} label={label} Icon={Icon} adminColor />
                ))}

                {/* Contenu sub-menu toggle */}
                <button
                  onClick={() => setAdminContentOpen(v => !v)}
                  style={{
                    ...styles.navItem,
                    background: 'none', border: 'none', cursor: 'pointer',
                    width: '100%', textAlign: 'left',
                    color: 'var(--nav-admin-color)',
                  }}
                >
                  <Gear size={18} weight="regular" style={{ opacity: 0.5 }} />
                  <span style={{ flex: 1 }}>Contenu</span>
                  <CaretDown
                    size={12}
                    style={{
                      color: 'var(--nav-admin-color)',
                      transform: adminContentOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                      opacity: 0.6,
                    }}
                  />
                </button>

                {adminContentOpen && (
                  <div style={styles.subMenu}>
                    {adminContent.map(({ href, label, Icon }) => (
                      <NavItem key={href} href={href} label={label} Icon={Icon} adminColor />
                    ))}
                  </div>
                )}
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
    // Sur iOS Safari, 100vh inclut la barre d'URL même quand elle masque le contenu.
    // 100dvh (dynamic viewport height) s'ajuste correctement.
    height: '100dvh',
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
    fontFamily: 'var(--font-fraunces), serif', fontSize: '15px',
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
  sectionLabel: {
    fontSize: '10px', fontWeight: 600, letterSpacing: '0.9px',
    textTransform: 'uppercase', color: 'var(--text-muted)',
    padding: '14px 8px 6px',
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
  subMenu: {
    marginLeft: '12px',
    paddingLeft: '12px',
    borderLeft: '1px solid var(--nav-border)',
    display: 'flex', flexDirection: 'column', gap: '2px',
    marginBottom: '4px',
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
  contributeurBadge: {
    fontSize: '10px', color: 'var(--accent-text)', fontWeight: 700,
  },
  contributeurLock: {
    fontSize: '9px', fontWeight: 600, letterSpacing: '0.4px',
    color: 'var(--accent-text)',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: '999px', padding: '2px 7px',
    opacity: 0.8,
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
