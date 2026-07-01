'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HouseSimple, GraduationCap, Handshake, FileText,
  UsersThree, SignOut, X, Gear, ShieldCheck, Users, BookOpen, Newspaper,
  FacebookLogo, CaretDown, House, ChartBar, CalendarBlank, Heart,
  MagnifyingGlass, ChatsCircle, Globe, Calculator, ChartLineUp, Printer, Bank,
  Camera, Sparkle,
} from '@phosphor-icons/react/dist/ssr'
import JmLogo from '@/components/JmLogo'
import PropertySelector from '@/components/layout/PropertySelector'
import type { PropertyLite } from '@/lib/queries/active-property'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// Sidebar refondue (Étape 2/7 du refactor — cf. docs/REFACTOR-DASHBOARD.md).
// De 20 items à 10 : bloc quotidien (7) + bloc "Faire grandir" (3).
// Les items retirés (Mes Logements, Guide LCD, Encaissements, Performances,
// Prix & Marché, Audit GBP, QR & Affiches, Groupes FB, Écosystème LCD)
// restent accessibles via leur URL directe — ils sont officiellement fusionnés
// aux étapes 4-6. Les libellés "Mes finances", "Outils & calculs", "Apprendre",
// "Entre Hôtes" pointent temporairement vers la page principale du groupe
// (fusion réelle à venir).
//
// À NE PAS PERDRE : cette structure doit toujours servir le mono-bien actif
// avec des libellés en français humain (pas de jargon hôtelier).
type NavItemDef = {
  href: string
  label: string
  icon: React.ElementType
  // Affiche un point pulsant rouge (utilisé pour Actualités quand il y a du neuf)
  pulseIf?: 'hasNewActualites'
}
const navGroups: Array<{ label: string | null; items: NavItemDef[] }> = [
  {
    label: null,
    items: [
      { href: '/dashboard',             label: 'Accueil',           icon: HouseSimple },
      { href: '/dashboard/calendrier',  label: 'Calendrier',        icon: CalendarBlank },
      { href: '/dashboard/voyageurs',   label: 'Mes voyageurs',     icon: Users },
      { href: '/dashboard/gabarits',    label: 'Messages',          icon: FileText },
      // Mes finances → pointera vers /dashboard/finances à l'Étape 4.
      // En attendant, on cible /dashboard/revenus (page existante) pour ne
      // rien casser. Encaissements + Performances restent accessibles via
      // leur URL directe.
      { href: '/dashboard/revenus',     label: 'Mes finances',      icon: ChartBar },
      { href: '/dashboard/actualites',  label: 'Actualités',        icon: Newspaper, pulseIf: 'hasNewActualites' },
      { href: '/dashboard/securite',    label: 'Sécurité voyageur', icon: ShieldCheck },
    ],
  },
  {
    label: 'Faire grandir mon activité',
    items: [
      // Outils & calculs → pointera vers /dashboard/outils (hub) à l'Étape 5.
      // En attendant, /dashboard/simulateurs.
      { href: '/dashboard/simulateurs', label: 'Outils & calculs', icon: Calculator },
      // Apprendre → onglets Formations + Guide LCD à l'Étape 6.
      { href: '/dashboard/formations',  label: 'Apprendre',        icon: GraduationCap },
      // Entre Hôtes → onglets Forum + Groupes FB + Écosystème à l'Étape 6.
      { href: '/dashboard/chez-nous',   label: 'Entre Hôtes',      icon: ChatsCircle },
    ],
  },
]

const adminMain = [
  { href: '/dashboard/admin',             label: 'Vue d\'ensemble', Icon: Gear },
  { href: '/dashboard/admin/membres',     label: 'Membres',         Icon: UsersThree },
  // QG : fusion de Membres Driing + Signalements + Suggestions en une
  // seule page avec 3 tabs. Évite la dispersion sur 3 entrées sidebar.
  { href: '/dashboard/admin/qg',          label: 'QG demandes',     Icon: ShieldCheck },
  { href: '/dashboard/admin/photographes', label: 'Photographes',   Icon: Camera },
  { href: '/dashboard/admin/menage',       label: 'Ménage',          Icon: Sparkle },
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
  /** Date de dernière visite de la page Actualités (DB, suit le compte). */
  lastSeenActualitesAt?: string | null
  /** Pré-calculé côté serveur dans le layout : évite une requête DB à chaque navigation. */
  hasNewActualites?: boolean
  /** Affiche l'entrée "Encaissements" seulement si l'hôte utilise Stripe Connect.
   *  Évite le clutter pour les hôtes qui n'encaissent que via Airbnb/Booking. */
  hasStripeAccount?: boolean
  /** Liste des logements de l'utilisateur — alimente le sélecteur en bas. */
  allProperties?: PropertyLite[]
  /** UUID du logement actif (cookie) ou 'all' pour la vue agrégée. */
  activePropertyId?: string
}

export default function Sidebar({ mobileOpen, onClose, isAdmin, isContributor, lastSeenActualitesAt, hasNewActualites: initialHasNewActualites = false, hasStripeAccount = false, allProperties, activePropertyId }: SidebarProps) {
  const pathname = usePathname()
  // Le rôle pro est dérivé du pathname côté client : le layout (server) est
  // mémorisé par le router cache entre routes sœurs, donc une prop calculée
  // depuis `headers()` reste figée après un client-nav. usePathname() lui
  // change à chaque navigation, ce qui garantit que la sidebar suit l'espace.
  const proRole: 'photographer' | 'cleaner' | null =
    pathname?.startsWith('/dashboard/ma-fiche-photographe') ? 'photographer'
    : pathname?.startsWith('/dashboard/ma-fiche-menage') ? 'cleaner'
    : null
  const router = useRouter()
  const supabase = createClient()
  const [adminContentOpen, setAdminContentOpen] = useState(
    adminContent.some(item => pathname.startsWith(item.href))
  )
  const [hasNewActualites, setHasNewActualites] = useState(initialHasNewActualites)

  useEffect(() => {
    if (pathname !== '/dashboard/actualites') return
    // L'utilisateur visite la page : on efface le badge immédiatement côté client.
    setHasNewActualites(false)
    fetch('/api/me/mark-seen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'actualites' }),
    }).catch(() => {})
  }, [pathname])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  function NavItem({ href, label, Icon, adminColor, notifDot }: { href: string; label: string; Icon: React.ElementType; adminColor?: boolean; notifDot?: boolean }) {
    const active = pathname === href
    return (
      <Link
        href={href}
        onClick={onClose}
        className={active ? 'jm-nav-item jm-nav-item--active' : 'jm-nav-item'}
        style={{
          ...styles.navItem,
          ...(active ? styles.navItemActive : {}),
          ...(!active && adminColor ? { color: 'var(--nav-admin-color)' } : {}),
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0, display: 'flex' }}>
          <Icon size={18} weight={active ? 'fill' : 'regular'} />
          {notifDot && !active && <span style={styles.notifDot} />}
        </div>
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
          {proRole ? (
            /* Sidebar minimale pour les pros annuaire (photographe / ménage) */
            <div>
              <div style={styles.sectionLabel}>Mon annuaire</div>
              <div style={styles.navSection}>
                <NavItem
                  href={proRole === 'photographer' ? '/dashboard/ma-fiche-photographe' : '/dashboard/ma-fiche-menage'}
                  label="Ma fiche"
                  Icon={proRole === 'photographer' ? Camera : Sparkle}
                />
              </div>
            </div>
          ) : (
            <>
              {navGroups.map((group, i) => (
                <div key={i}>
                  {group.label && (
                    <div style={styles.sectionLabel}>{group.label}</div>
                  )}
                  <div style={{ ...styles.navSection, ...(i === 0 ? { marginBottom: '4px' } : {}) }}>
                    {group.items.map(({ href, label, icon: Icon, pulseIf }) => (
                      <NavItem
                        key={href}
                        href={href}
                        label={label}
                        Icon={Icon}
                        notifDot={pulseIf === 'hasNewActualites' && hasNewActualites}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {/* Note : "Contributeurs" a été déplacé dans le dropdown user
                  du header (accessible via /dashboard/contributeurs).
                  Sera intégré au menu user complet à l'Étape 3. */}
            </>
          )}

          {/* Section admin, visible uniquement pour Jason */}
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

        {/* Sélecteur de logement (bas de sidebar, dropdown vers le haut) */}
        {!proRole && allProperties && (
          <PropertySelector allProperties={allProperties} currentId={activePropertyId ?? 'all'} />
        )}

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
    position: 'fixed', top: 0, left: 0,
    width: 'var(--sidebar-w)',
    background: 'var(--nav-bg)',
    borderRight: '1px solid var(--nav-border)',
    display: 'flex', flexDirection: 'column',
    zIndex: 99,
    // backdrop-filter retiré : --nav-bg est >=95% opaque sur les 3 thèmes
    // donc le blur ne flouterait rien de visible (pur cargo cult "frosted
    // glass"), mais déclenchait un bug Chrome de ghosting/streaks dans le
    // canvas main quand on hover les nav items (repaint compositor leak).
    transition: 'background 0.25s ease, border-color 0.25s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overscrollBehavior: 'contain',
    // height géré dans globals.css avec fallbacks (100vh / -webkit-fill-available / 100dvh)
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '20px 20px 16px',
    borderBottom: '1px solid var(--nav-border)',
  },
  logoIcon: {
    width: '34px', height: '34px', flexShrink: 0,
    background: 'rgba(0,76,63,0.5)',
    border: '1px solid var(--accent-border)',
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
    flex: '1 1 0',
    padding: '12px 12px',
    display: 'flex', flexDirection: 'column', gap: '0',
    overflowY: 'auto',
    minHeight: 0,
    WebkitOverflowScrolling: 'touch',
    overscrollBehavior: 'contain',
    // hauteur explicite en fallback iOS via la classe CSS
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
    padding: '9px 12px', borderRadius: 'var(--r-md)',
    fontSize: 'var(--t-base)', fontWeight: 400,
    color: 'var(--nav-item)',
    textDecoration: 'none',
    transition: 'background var(--d-base) var(--ease-smooth), color var(--d-base) var(--ease-smooth)',
    position: 'relative',
  },
  navItemActive: {
    background: 'var(--nav-active-bg)',
    color: 'var(--nav-active-color)',
    fontWeight: 600,
    // Indicateur vertical à gauche, style 2026 (Linear/Vercel pattern)
    boxShadow: 'inset 3px 0 0 var(--nav-active-color)',
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
    paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
    display: 'flex', flexDirection: 'column', gap: '4px',
    flexShrink: 0,
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
  notifDot: {
    position: 'absolute',
    top: '-3px', right: '-3px',
    width: '7px', height: '7px',
    background: '#EF4444',
    borderRadius: '50%',
    border: '1.5px solid var(--nav-bg)',
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
