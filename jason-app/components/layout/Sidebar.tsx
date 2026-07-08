'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  HouseSimple, GraduationCap, FileText,
  UsersThree, SignOut, X, Gear, ShieldCheck, Users, BookOpen, Newspaper, ListChecks,
  FacebookLogo, CaretDown, ChartBar, CalendarBlank, Heart,
  ChatsCircle, Calculator, Camera, Sparkle, Tray, AddressBook,
  CaretDoubleLeft, CaretDoubleRight, UserCircle, CreditCard, Question, ArrowUpRight, Star,
  ChartLineUp, HouseLine,
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
      // Mes reservations : page dediee avec KPIs, filtres, cartes/tableau,
      // drawer detail voyageur + alertes contextuelles. Detachee du Calendrier
      // (qui redevient purement vue chronologique Mois).
      { href: '/dashboard/reservations', label: 'Mes réservations', icon: ListChecks },
      { href: '/dashboard/voyageurs',   label: 'Mes voyageurs',     icon: Users },
      { href: '/dashboard/gabarits',    label: 'Messages',          icon: FileText },
      // Mes finances : Étape 4 — fusion à onglets Revenus / Encaissements
      // / Performances. Le lien pointe vers la racine /dashboard/finances
      // qui redirige sur l'onglet Revenus par défaut.
      // PERF : pointe directement sur l'onglet par defaut (revenus) au lieu
      // de /dashboard/finances qui redirige serveur → 2 loads visible. Meme
      // trick pour Apprendre + Entre Hotes ci-dessous.
      { href: '/dashboard/finances/revenus', label: 'Mes finances',      icon: ChartBar },
      { href: '/dashboard/actualites',  label: 'Actualités',        icon: Newspaper, pulseIf: 'hasNewActualites' },
      { href: '/dashboard/securite',    label: 'Sécurité voyageur', icon: ShieldCheck },
    ],
  },
  {
    label: 'Faire grandir mon activité',
    items: [
      // Outils & calculs (Étape 5) : hub avec 4 cartes vers les outils
      // utilitaires (Simulateurs, Calculateurs, Audit GBP, QR & Affiches).
      // Les URLs individuelles restent accessibles directement.
      { href: '/dashboard/outils', label: 'Outils & calculs', icon: Calculator },
      // Apprendre (Étape 6) : fusion à onglets Formations + Guide LCD.
      { href: '/dashboard/apprendre/formations', label: 'Apprendre',   icon: GraduationCap },
      // Entre Hôtes (Étape 6) : fusion à onglets Forum + Groupes FB + Écosystème.
      { href: '/dashboard/entre-hotes/forum', label: 'Entre Hôtes',   icon: ChatsCircle },
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
  /** Nom complet, pour affichage dans la carte user en bas de sidebar. */
  userName?: string
  /** Label du plan (Découverte / Standard / Membre Driing / Administrateur). */
  userPlanLabel?: string
  /** userId : pour le lien vers /chez-nous/membre/[id] depuis le menu user. */
  userId?: string
  /** Espaces multi-rôles (Hôte + Photographe + Ménage) — permet de switcher
   *  entre ses fiches pro depuis le menu user en bas-gauche. */
  spaces?: Array<{ key: 'host' | 'photographer' | 'cleaner' | 'investor'; label: string; href: string; subtitle?: string | null; active: boolean }>
}

export default function Sidebar({ mobileOpen, onClose, isAdmin, isContributor, lastSeenActualitesAt, hasNewActualites: initialHasNewActualites = false, hasStripeAccount = false, allProperties, activePropertyId, userName, userPlanLabel, userId, spaces = [] }: SidebarProps) {
  const pathname = usePathname()
  // Le rôle pro est dérivé du pathname côté client : le layout (server) est
  // mémorisé par le router cache entre routes sœurs, donc une prop calculée
  // depuis `headers()` reste figée après un client-nav. usePathname() lui
  // change à chaque navigation, ce qui garantit que la sidebar suit l'espace.
  const proRole: 'photographer' | 'cleaner' | null =
    pathname?.startsWith('/dashboard/ma-fiche-photographe') ? 'photographer'
    : pathname?.startsWith('/dashboard/ma-fiche-menage') ? 'cleaner'
    : null
  // Espace investisseur : nav dédiée et DÉTACHÉE des opérations hôte
  // (pas de Calendrier/Réservations/Voyageurs). Pour les comptes qui ne
  // viennent que pour investir, on ne mélange pas les deux univers.
  const investorMode = pathname?.startsWith('/dashboard/investir') ?? false
  const router = useRouter()
  const supabase = createClient()
  const [adminContentOpen, setAdminContentOpen] = useState(
    adminContent.some(item => pathname.startsWith(item.href))
  )
  const [hasNewActualites, setHasNewActualites] = useState(initialHasNewActualites)

  // ── Collapse sidebar (mode icônes seulement) ──
  // Persisté en localStorage. Update la CSS var --sidebar-w globale pour
  // que Header + main content s'ajustent automatiquement.
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('sidebar-collapsed') : null
    setCollapsed(stored === 'true')
  }, [])
  useEffect(() => {
    if (typeof window === 'undefined') return
    document.documentElement.style.setProperty('--sidebar-w', collapsed ? '68px' : '252px')
  }, [collapsed])
  function toggleCollapsed() {
    setCollapsed(v => {
      const next = !v
      try { localStorage.setItem('sidebar-collapsed', String(next)) } catch {}
      return next
    })
  }

  // ── Mode Admin toggle ──
  // Quand actif (admin uniquement), remplace la sidebar hôte par une
  // sidebar admin dédiée. Persisté en localStorage. Toggle depuis menu user.
  const [adminMode, setAdminMode] = useState(false)
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('admin-mode') : null
    setAdminMode(stored === 'true' && !!isAdmin)
  }, [isAdmin])
  function toggleAdminMode() {
    setAdminMode(v => {
      const next = !v
      try { localStorage.setItem('admin-mode', String(next)) } catch {}
      // Navigation auto vers la page pertinente : entrer en mode admin
      // ouvre la Vue d'ensemble admin ; en sortir revient a l'Accueil hote.
      // Sinon Jason restait sur la derniere page consultee dans l'autre mode,
      // ce qui etait deroutant (ex : reste sur /admin/photographes en mode
      // hote alors que le user n'a plus le contexte admin).
      router.push(next ? '/dashboard/admin' : '/dashboard')
      return next
    })
  }

  // ── Menu user (bas de sidebar, s'ouvre vers le haut) ──
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!userMenuOpen) return
    function handler(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [userMenuOpen])

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
    // Redirection DURE (pas router.push) : force le rechargement complet pour
    // purger la session côté serveur + le router cache. Un router.push laissait
    // le layout authentifié en cache → il fallait cliquer plusieurs fois.
    window.location.assign('/auth/login')
  }

  const searchParams = useSearchParams()

  // Collecte tous les hrefs de la sidebar (nav principale + admin) pour la
  // resolution de l'active state. Regle : le href avec le match le plus
  // profond gagne — sinon `/dashboard/admin` (Vue d'ensemble) serait actif
  // en meme temps que `/dashboard/admin/photographes` quand on est sur la
  // sous-page (les 2 sont prefixes valides du pathname).
  const allHrefs = useMemo(() => [
    ...navGroups.flatMap(g => g.items.map(i => i.href)),
    ...adminMain.map(i => i.href),
    ...adminContent.map(i => i.href),
    // Espaces pros : necessaires au "match le plus profond gagne", sinon
    // "Ma fiche" reste active sur /demandes (les 2 items allumes).
    '/dashboard/ma-fiche-photographe',
    '/dashboard/ma-fiche-photographe/demandes',
    '/dashboard/ma-fiche-photographe/clients',
    '/dashboard/ma-fiche-menage',
    '/dashboard/ma-fiche-menage/demandes',
    '/dashboard/ma-fiche-menage/clients',
    // Espace investisseur : idem, sinon "Accueil" reste actif sur /estimateur.
    '/dashboard/investir',
    '/dashboard/investir/estimateur',
    '/dashboard/investir/comparateur',
    '/dashboard/investir/simulateurs',
  ], [])

  function NavItem({ href, label, Icon, adminColor, notifDot }: { href: string; label: string; Icon: React.ElementType; adminColor?: boolean; notifDot?: boolean }) {
    // Active state :
    // - /dashboard exact (sinon toutes les pages seraient "active")
    // - Si href contient une querystring (ex Mes reservations = /calendrier?view=list),
    //   on compare pathname + querystring
    // - Sinon match exact OU match prefix avec regle "match le plus profond gagne"
    let active: boolean
    if (href === '/dashboard') {
      active = pathname === '/dashboard'
    } else if (href.includes('?')) {
      const [hrefPath, hrefQs] = href.split('?')
      const wanted = new URLSearchParams(hrefQs)
      let qsMatch = true
      wanted.forEach((val, key) => { if (searchParams?.get(key) !== val) qsMatch = false })
      active = pathname === hrefPath && qsMatch
    } else {
      // Cas special : sur /calendrier?view=list, "Calendrier" ne doit pas
      // etre actif (c'est "Mes reservations" qui l'est via matching qs).
      const onCalendrierList = pathname === '/dashboard/calendrier' && searchParams?.get('view') === 'list'
      if (href === '/dashboard/calendrier' && onCalendrierList) {
        active = false
      } else if (pathname === href) {
        // Match exact : toujours actif
        active = true
      } else if (pathname.startsWith(href + '/')) {
        // Match prefix : actif SEULEMENT si aucun autre href de la sidebar
        // ne fait un match plus profond. Ex : sur /dashboard/admin/photographes,
        // /dashboard/admin fait un prefix match mais /dashboard/admin/photographes
        // fait un match exact plus profond → /dashboard/admin n'est PAS actif.
        const hasDeeperMatch = allHrefs.some(other =>
          other !== href
          && other.startsWith(href + '/')
          && (pathname === other || pathname.startsWith(other + '/')),
        )
        active = !hasDeeperMatch
      } else {
        active = false
      }
    }
    return (
      <Link
        href={href}
        onClick={onClose}
        className={active ? 'jm-nav-item jm-nav-item--active' : 'jm-nav-item'}
        title={collapsed ? label : undefined}
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
        {!collapsed && <span>{label}</span>}
        {active && !collapsed && <div style={styles.activeDot} />}
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
        className={`dash-sidebar${mobileOpen ? ' open' : ''}${collapsed ? ' collapsed' : ''}`}
        data-collapsed={collapsed ? 'true' : 'false'}
        style={styles.sidebar}
      >
        {/* Logo + bouton collapse. Layout adaptatif :
            - Étendu : logo à gauche + bouton chevron à droite
            - Réduit : logo centré en haut + bouton chevron centré en-dessous
            Ça garantit que le bouton reste TOUJOURS visible pour permettre
            de ré-étendre la sidebar. */}
        <div style={{ ...styles.logoWrap, ...(collapsed ? { flexDirection: 'column' as const, gap: '8px', padding: '14px 8px 12px' } : {}) }}>
          {collapsed ? (
            // Mode réduit : juste l'icône du logo, pas de texte, centré
            <a href="https://jasonmarinho.com" title="Jason Marinho" style={{ display: 'flex', textDecoration: 'none' }}>
              <div style={styles.logoIcon}>
                <JmLogo size={20} />
              </div>
            </a>
          ) : (
            <a href="https://jasonmarinho.com" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flex: 1, minWidth: 0 }}>
              <div style={styles.logoIcon}>
                <JmLogo size={20} />
              </div>
              <span style={styles.logoText}>
                Jason <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>Marinho</em>
              </span>
            </a>
          )}
          {/* Bouton collapse (desktop uniquement — mobile utilise le close X) */}
          {!onClose && (
            <button
              onClick={toggleCollapsed}
              style={styles.collapseBtn}
              title={collapsed ? 'Étendre le menu' : 'Réduire le menu'}
              aria-label={collapsed ? 'Étendre la sidebar' : 'Réduire la sidebar'}
            >
              {collapsed ? <CaretDoubleRight size={15} weight="bold" /> : <CaretDoubleLeft size={15} weight="bold" />}
            </button>
          )}
          {onClose && (
            <button onClick={onClose} style={styles.closeBtn} className="dash-close-btn">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav style={styles.nav}>
          {investorMode ? (
            /* Sidebar dédiée à l'espace investisseur — détachée de l'hôte.
               Volontairement minimale (on l'enrichira) : le cœur du parcours
               pré-achat (estimer → prévisionnel PDF → projets) reste ici. */
            <div>
              <div style={styles.sectionLabel}>Mon espace investisseur</div>
              <div style={styles.navSection}>
                <NavItem href="/dashboard/investir" label="Accueil" Icon={HouseLine} />
                <NavItem href="/dashboard/investir/estimateur" label="Estimer un bien + PDF" Icon={ChartLineUp} />
                <NavItem href="/dashboard/investir/comparateur" label="Comparer les villes" Icon={ChartBar} />
                <NavItem href="/dashboard/investir/simulateurs" label="Rentabilité & fiscalité" Icon={Calculator} />
              </div>
            </div>
          ) : proRole ? (
            /* Sidebar minimale pour les pros annuaire (photographe / ménage) */
            <div>
              <div style={styles.sectionLabel}>Mon annuaire</div>
              <div style={styles.navSection}>
                <NavItem
                  href={proRole === 'photographer' ? '/dashboard/ma-fiche-photographe' : '/dashboard/ma-fiche-menage'}
                  label="Ma fiche"
                  Icon={proRole === 'photographer' ? Camera : Sparkle}
                />
                <NavItem
                  href={proRole === 'photographer' ? '/dashboard/ma-fiche-photographe/demandes' : '/dashboard/ma-fiche-menage/demandes'}
                  label="Demandes reçues"
                  Icon={Tray}
                />
                <NavItem
                  href={proRole === 'photographer' ? '/dashboard/ma-fiche-photographe/clients' : '/dashboard/ma-fiche-menage/clients'}
                  label="Mes clients"
                  Icon={AddressBook}
                />
              </div>
            </div>
          ) : adminMode && isAdmin ? (
            /* Mode admin dedicated : sidebar remplacée par Admin uniquement.
               Header "Mode admin" + bouton retour hote dans la DA (jaune accent). */
            <>
              {!collapsed && (
                <div style={styles.adminModeHeader}>
                  <div style={styles.adminBadge}>
                    <span style={styles.adminBadgeDot} />
                    <span style={styles.adminBadgeLabel}>Mode admin</span>
                  </div>
                  <div style={styles.adminHelper}>Tu vois la sidebar admin. Repasse en mode hôte pour retrouver ton dashboard.</div>
                </div>
              )}
              <button
                onClick={toggleAdminMode}
                className="jm-nav-item"
                title={collapsed ? 'Retour mode hôte' : undefined}
                style={{
                  ...styles.navItem,
                  ...styles.backToHostBtn,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
              >
                <div style={styles.backToHostIco}>
                  <CaretDoubleLeft size={13} weight="bold" />
                </div>
                {!collapsed && (
                  <span style={styles.backToHostLabel}>Retour mode hôte</span>
                )}
              </button>
            </>
          ) : (
            <>
              {navGroups.map((group, i) => (
                <div key={i}>
                  {group.label && !collapsed && (
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
            </>
          )}

          {/* Section admin, visible UNIQUEMENT quand adminMode est actif
              (bascule via le menu user en bas-gauche). Avant l'Étape 3, elle
              était toujours affichée pour les admins — trop de bruit visuel
              pour l'usage quotidien hôte. */}
          {isAdmin && adminMode && (
            <>
              {/* Divider "Admin" retire quand on est deja en mode admin :
                  le header "Mode admin" au-dessus + le bouton retour hote
                  suffisent a signaler le contexte. Pas la peine de dupliquer.
                  En mode reduit on garde juste une fine ligne pour separer. */}
              {collapsed && <div style={{ height: '1px', background: 'var(--nav-border)', margin: '4px 8px 10px' }} />}

              <div style={styles.navSection}>
                {adminMain.map(({ href, label, Icon }) => (
                  <NavItem key={href} href={href} label={label} Icon={Icon} adminColor />
                ))}

                {/* Contenu sub-menu toggle — en mode réduit devient une icône
                    cliquable sans texte ni caret (comportement identique). */}
                <button
                  onClick={() => setAdminContentOpen(v => !v)}
                  className="jm-nav-item"
                  title={collapsed ? 'Contenu' : undefined}
                  style={{
                    ...styles.navItem,
                    background: 'none', border: 'none', cursor: 'pointer',
                    width: '100%', textAlign: 'left',
                    color: 'var(--nav-admin-color)',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                  }}
                >
                  <Gear size={18} weight="regular" style={{ opacity: 0.5, flexShrink: 0 }} />
                  {!collapsed && (
                    <>
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
                    </>
                  )}
                </button>

                {adminContentOpen && (
                  <div style={collapsed ? styles.navSection : styles.subMenu}>
                    {adminContent.map(({ href, label, Icon }) => (
                      <NavItem key={href} href={href} label={label} Icon={Icon} adminColor />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </nav>

        {/* Sélecteur de logement (bas de sidebar, dropdown vers le haut).
            Masqué en espace investisseur : un investisseur pré-achat n'a
            pas de logement à sélectionner. */}
        {!proRole && !investorMode && allProperties && (
          <PropertySelector allProperties={allProperties} currentId={activePropertyId ?? 'all'} collapsed={collapsed} />
        )}

        {/* Carte user cliquable — ouvre le menu vers le HAUT (Étape 3/7) */}
        <div ref={userMenuRef} style={styles.userWrap}>
          {userMenuOpen && (
            <div style={{
              ...styles.userMenu,
              // Quand sidebar est reduite (68px), le menu doit s'ouvrir a
              // COTE (a droite) au lieu de dessus la carte user, sinon il
              // se retrouve compresse a ~48px avec le texte qui explose.
              ...(collapsed ? {
                left: 'calc(100% + 6px)',
                right: 'auto',
                bottom: 0,
                width: '260px',
              } : {}),
            }} role="menu">
              {/* Section identité */}
              <div style={styles.userMenuHead}>
                <div style={styles.userMenuAvatar}>
                  {(userName || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.userMenuName}>{userName || 'Mon compte'}</div>
                  <div style={styles.userMenuPlan}>{userPlanLabel || 'Découverte'}</div>
                </div>
              </div>
              <div style={styles.userMenuDivider} />

              {/* Navigation */}
              <Link href="/dashboard/profil" onClick={() => setUserMenuOpen(false)} style={styles.userMenuItem}>
                <UserCircle size={15} />Mon compte
              </Link>
              {userId && (
                <Link href={`/dashboard/chez-nous/membre/${userId}`} onClick={() => setUserMenuOpen(false)} style={styles.userMenuItem}>
                  <UserCircle size={15} weight="duotone" />Profil forum
                </Link>
              )}
              <Link href="/dashboard/abonnement" onClick={() => setUserMenuOpen(false)} style={styles.userMenuItem}>
                <CreditCard size={15} />Mon abonnement
              </Link>
              <Link href="/dashboard/contributeurs" onClick={() => setUserMenuOpen(false)} style={styles.userMenuItem}>
                <Heart size={15} weight={isContributor ? 'fill' : 'regular'} style={{ color: isContributor ? 'var(--accent-text)' : undefined }} />
                Contributeurs
                {!isContributor && <span style={styles.userMenuBadge}>Rejoindre</span>}
              </Link>
              <Link href="/dashboard/aide" onClick={() => setUserMenuOpen(false)} style={styles.userMenuItem}>
                <Question size={15} />Centre d&apos;aide
              </Link>

              {/* Mes espaces multi-rôles : bascule Hôte / Photographe / Ménage */}
              {spaces.length > 0 && (
                <>
                  <div style={styles.userMenuDivider} />
                  <div style={{ padding: '10px 12px 4px', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-3)' }}>
                    Mes espaces
                  </div>
                  {spaces.filter(s => s.active).map(s => {
                    // Détection espace courant via pathname (client-side)
                    const isCurrent =
                      s.key === 'photographer' ? (pathname?.startsWith('/dashboard/ma-fiche-photographe') ?? false)
                      : s.key === 'cleaner'    ? (pathname?.startsWith('/dashboard/ma-fiche-menage') ?? false)
                      : s.key === 'investor'   ? (pathname?.startsWith('/dashboard/investir') ?? false)
                      : !pathname?.startsWith('/dashboard/ma-fiche-') && !pathname?.startsWith('/dashboard/investir')
                    return (
                      <Link
                        key={s.key}
                        href={s.href}
                        onClick={() => setUserMenuOpen(false)}
                        style={{
                          ...styles.userMenuItem,
                          background: isCurrent ? 'rgba(255,213,107,0.08)' : 'transparent',
                          color: isCurrent ? 'var(--accent-text)' : 'var(--text-2)',
                          fontWeight: isCurrent ? 600 : 400,
                        }}
                      >
                        <span style={{ width: 15, textAlign: 'center' as const, color: isCurrent ? 'var(--accent-text)' : 'var(--text-3)' }}>{isCurrent ? '✓' : '·'}</span>
                        <span style={{ flex: 1, display: 'flex', flexDirection: 'column' as const }}>
                          <span>{s.label}</span>
                          {s.subtitle && <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 400 }}>{s.subtitle}</span>}
                        </span>
                      </Link>
                    )
                  })}
                  {/* CTAs pour créer les fiches pro manquantes (in-app, sans ressaisir email + mdp) */}
                  {!spaces.find(s => s.key === 'photographer')?.active && (
                    <Link href="/dashboard/creer-fiche-photographe" onClick={() => setUserMenuOpen(false)} style={{ ...styles.userMenuItem, color: 'var(--text-3)' }}>
                      <span style={{ width: 15, textAlign: 'center' as const, color: 'var(--accent-text)', fontWeight: 700 }}>+</span>
                      Créer ma fiche photographe
                    </Link>
                  )}
                  {!spaces.find(s => s.key === 'cleaner')?.active && (
                    <Link href="/dashboard/creer-fiche-menage" onClick={() => setUserMenuOpen(false)} style={{ ...styles.userMenuItem, color: 'var(--text-3)' }}>
                      <span style={{ width: 15, textAlign: 'center' as const, color: 'var(--accent-text)', fontWeight: 700 }}>+</span>
                      Créer ma fiche équipe ménage
                    </Link>
                  )}
                  {/* Pont hôte → investisseur : analyser un nouveau bien à acheter.
                      La 1re sauvegarde de projet active l'espace investisseur. */}
                  {!spaces.find(s => s.key === 'investor')?.active && (
                    <Link href="/dashboard/investir" onClick={() => setUserMenuOpen(false)} style={{ ...styles.userMenuItem, color: 'var(--text-3)' }}>
                      <span style={{ width: 15, textAlign: 'center' as const, color: 'var(--accent-text)', fontWeight: 700 }}>+</span>
                      Analyser un investissement
                    </Link>
                  )}
                </>
              )}

              <div style={styles.userMenuDivider} />
              <a href="https://jasonmarinho.com" target="_blank" rel="noopener noreferrer" onClick={() => setUserMenuOpen(false)} style={styles.userMenuItem}>
                <ArrowUpRight size={15} />jasonmarinho.com
              </a>
              <a href="https://g.page/r/CcLzE7IbhS5_EAE/review" target="_blank" rel="noopener noreferrer" onClick={() => setUserMenuOpen(false)} style={{ ...styles.userMenuItem, color: 'var(--accent-text)' }}>
                <Star size={15} weight="fill" />Laisser un avis Google
              </a>

              {/* Toggle Mode admin — visible uniquement pour les admins.
                  Style aligne sur la DA (accent-text jaune) + petit chip
                  icon pour un vrai look bouton, plus d'aplat purple hors DA. */}
              {isAdmin && (
                <>
                  <div style={styles.userMenuDivider} />
                  <button
                    onClick={() => { setUserMenuOpen(false); toggleAdminMode() }}
                    style={{
                      ...styles.userMenuItem,
                      width: '100%',
                      background: adminMode ? 'var(--accent-bg)' : 'rgba(255,213,107,0.04)',
                      border: '1px solid var(--accent-border)',
                      cursor: 'pointer', textAlign: 'left',
                      color: 'var(--accent-text)',
                      fontWeight: 500,
                    }}
                    title={adminMode ? 'Repasser en mode hôte' : 'Basculer sur la sidebar admin dédiée'}
                  >
                    <span style={{
                      width: 22, height: 22, flexShrink: 0,
                      background: 'rgba(255,213,107,0.15)',
                      border: '1px solid var(--accent-border)',
                      borderRadius: 6,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--accent-text)',
                    }}>
                      <Gear size={13} weight={adminMode ? 'fill' : 'regular'} />
                    </span>
                    {adminMode ? 'Repasser en mode hôte' : 'Mode admin'}
                  </button>
                </>
              )}

              <div style={styles.userMenuDivider} />
              <button onClick={() => { setUserMenuOpen(false); handleSignOut() }} style={{ ...styles.userMenuItem, width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--text-3)' }}>
                <SignOut size={15} />Se déconnecter
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setUserMenuOpen(v => !v)}
            style={{ ...styles.userCard, justifyContent: collapsed ? 'center' : 'flex-start' }}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            title={collapsed ? `${userName || 'Mon compte'} · ${userPlanLabel || 'Découverte'}` : undefined}
          >
            <div style={styles.userAvatar}>
              {userName ? (userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)) : <UserCircle size={18} />}
            </div>
            {!collapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' as const }}>
                  <div style={styles.userCardName}>{userName || 'Mon compte'}</div>
                  <div style={styles.userCardPlan}>{userPlanLabel || 'Découverte'}</div>
                </div>
                <CaretDown size={11} style={{ color: 'var(--text-3)', transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }} />
              </>
            )}
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
  notifDot: {
    position: 'absolute',
    top: '-3px', right: '-3px',
    width: '7px', height: '7px',
    background: '#EF4444',
    borderRadius: '50%',
    border: '1.5px solid var(--nav-bg)',
  },
  // ── Mode admin : header + bouton "Retour mode hôte" ──
  // Aligne sur la DA : accent-text (jaune) au lieu de purple, badge subtle,
  // helper text pour rappeler le contexte, button avec chip icon type
  // "back button" moderne.
  adminModeHeader: {
    padding: '10px 12px 14px',
    marginBottom: 6,
    borderBottom: '1px solid var(--nav-border)',
    display: 'flex', flexDirection: 'column' as const, gap: 8,
  },
  adminBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '4px 9px',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: 999,
    width: 'fit-content',
    color: 'var(--accent-text)',
    fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  adminBadgeDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: 'var(--accent-text)',
    boxShadow: '0 0 0 3px rgba(255,213,107,0.20)',
  },
  adminBadgeLabel: { lineHeight: 1 },
  adminHelper: {
    fontSize: 11, color: 'var(--nav-text-muted)',
    lineHeight: 1.5,
  },
  backToHostBtn: {
    cursor: 'pointer',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)',
    marginBottom: 10,
    width: '100%', textAlign: 'left' as const,
    fontFamily: 'inherit',
    transition: 'background 0.15s, transform 0.15s',
  },
  backToHostIco: {
    width: 22, height: 22, flexShrink: 0,
    background: 'rgba(255,213,107,0.15)',
    border: '1px solid var(--accent-border)',
    borderRadius: 6,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--accent-text)',
  },
  backToHostLabel: {
    fontWeight: 600, fontSize: 13,
    color: 'var(--accent-text)',
  },
  collapseBtn: {
    // Bouton chevron collapse — visible et cliquable comme un vrai
    // bouton, pas juste une icône fantôme. Fond + border accent.
    background: 'rgba(255,213,107,0.10)',
    border: '1px solid var(--accent-border)',
    cursor: 'pointer',
    color: 'var(--accent-text)',
    padding: '6px', borderRadius: '7px',
    width: '28px', height: '28px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.15s, transform 0.15s',
  },
  // Carte user cliquable en bas-gauche (remplace l'ancien footer)
  userWrap: {
    position: 'relative',
    padding: '10px 12px',
    paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
    borderTop: '1px solid var(--nav-border)',
    flexShrink: 0,
    marginTop: 4,
  },
  userCard: {
    display: 'flex', alignItems: 'center', gap: '10px',
    width: '100%', padding: '6px 8px',
    background: 'none', border: '1px solid transparent',
    borderRadius: 'var(--r-md)',
    cursor: 'pointer', color: 'var(--text)',
    fontFamily: 'inherit',
    transition: 'background 0.15s, border-color 0.15s',
  },
  userAvatar: {
    width: '32px', height: '32px', flexShrink: 0,
    background: 'rgba(0,76,63,0.5)',
    border: '1px solid var(--accent-border)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--accent-text)', fontWeight: 600, fontSize: '12px',
    fontFamily: 'var(--font-fraunces), serif',
  },
  userCardName: {
    fontSize: '13px', fontWeight: 500, color: 'var(--text)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  userCardPlan: {
    fontSize: '10.5px', color: 'var(--text-muted)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  userMenu: {
    position: 'absolute',
    bottom: 'calc(100% - 4px)', left: '10px', right: '10px',
    background: 'var(--bg-2)',
    border: '1px solid var(--border-2)',
    borderRadius: '12px',
    padding: '4px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
    zIndex: 50,
  },
  userMenuHead: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 12px',
  },
  userMenuAvatar: {
    width: '36px', height: '36px', flexShrink: 0,
    background: 'rgba(0,76,63,0.5)',
    border: '1.5px solid var(--accent-border)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--accent-text)', fontWeight: 600, fontSize: '13px',
    fontFamily: 'var(--font-fraunces), serif',
  },
  userMenuName: { fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' },
  userMenuPlan: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' },
  userMenuDivider: { height: '1px', background: 'var(--border)', margin: '4px 0' },
  userMenuItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '8px 12px', borderRadius: '7px',
    fontSize: '13px', color: 'var(--text-2)',
    textDecoration: 'none', cursor: 'pointer',
    transition: 'background 0.12s, color 0.12s',
  },
  userMenuBadge: {
    marginLeft: 'auto',
    fontSize: '9px', fontWeight: 700, letterSpacing: '0.4px',
    color: 'var(--accent-text)',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: '999px', padding: '2px 7px',
  },
}
