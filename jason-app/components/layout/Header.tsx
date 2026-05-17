'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  List, Bell, UserCircle, SignOut, CreditCard,
  Question, CaretDown, ArrowUpRight, Sun, Moon, MoonStars, Star, MapTrifold, Lifebuoy,
} from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import Sidebar from './Sidebar'
import NotificationPanel from './NotificationPanel'
import SOSModal from '@/components/sos/SOSModal'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from '@/components/ThemeProvider'
import { CHANGELOG } from '@/lib/constants/changelog'
import { subscribeDashboardTitle } from '@/lib/dashboard-title-store'

// Mapping pathname → titre du header (routes statiques)
const PATH_TITLES: Record<string, string> = {
  '/dashboard': 'Accueil',
  '/dashboard/audit-gbp': 'Audit GBP',
  '/dashboard/audit-gbp/import-url': 'Import URL',
  '/dashboard/audit-gbp/import-csv': 'Audit Express',
  '/dashboard/simulateurs': 'Simulateurs fiscaux',
  '/dashboard/calculateurs': 'Calculateurs marché',
  '/dashboard/voyageurs': 'Mes Voyageurs',
  '/dashboard/communaute': 'Groupes Facebook',
  '/dashboard/securite': 'Sécurité',
  '/dashboard/gabarits': 'Gabarits',
  '/dashboard/aide': "Centre d'aide",
  '/dashboard/revenus': 'Revenus',
  '/dashboard/encaissements': 'Encaissements',
  '/dashboard/profil': 'Mon compte',
  '/dashboard/abonnement': 'Abonnement',
  '/dashboard/actualites': 'Actualités',
  '/dashboard/actualites/favoris': 'Mes favoris',
  '/dashboard/nouveautes': 'Nouveautés',
  '/dashboard/chez-nous': 'Chez Nous',
  '/dashboard/chez-nous/notifications': 'Notifications',
  '/dashboard/notifications': 'Mes alertes',
  '/dashboard/logements': 'Mes Logements',
  '/dashboard/calendrier': 'Calendrier',
  '/dashboard/formations': 'Formations',
  '/dashboard/formations/profil-apprenant': 'Mon profil apprenant',
  '/dashboard/formations/favoris': 'Mes favoris',
  '/dashboard/formations/parcours': "Parcours d'apprentissage",
  '/dashboard/ecosysteme': 'Écosystème LCD',
  '/dashboard/contributeurs': 'Contributeurs',
  '/dashboard/guide': 'Guide LCD',
  '/dashboard/admin': 'Administration',
  '/dashboard/admin/membres': 'Membres',
  '/dashboard/admin/communaute': 'Communauté',
  '/dashboard/admin/gabarits': 'Gabarits',
  '/dashboard/admin/actualites': 'Actualités',
  '/dashboard/admin/formations': 'Formations',
  '/dashboard/admin/guides': 'Guide LCD',
}

// Routes dynamiques : titre par défaut tant que TitleSetter n'a pas envoyé le titre spécifique
const PATH_TITLE_PATTERNS: Array<[RegExp, string]> = [
  [/^\/dashboard\/voyageurs\/[^/]+$/,                'Voyageur'],
  [/^\/dashboard\/logements\/[^/]+$/,                'Logement'],
  [/^\/dashboard\/formations\/parcours\/[^/]+$/,     'Parcours'],
  [/^\/dashboard\/admin\/formations\/[^/]+$/,        'Édition formation'],
  [/^\/dashboard\/admin\/membres\/[^/]+$/,           'Fiche membre'],
  [/^\/dashboard\/audit-gbp\/resultats\/[^/]+$/,     'Audit GBP'],
  [/^\/dashboard\/chez-nous\/membre\/[^/]+$/,        'Profil membre'],
  [/^\/dashboard\/chez-nous\/[^/]+$/,                'Chez Nous'],
]

function resolveTitle(pathname: string): string {
  if (PATH_TITLES[pathname]) return PATH_TITLES[pathname]
  for (const [rx, label] of PATH_TITLE_PATTERNS) {
    if (rx.test(pathname)) return label
  }
  return 'Mon espace'
}

const PLAN_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  'Découverte':    { bg: 'var(--border)', color: 'var(--text-3)',  dot: '#6b7280' },
  'Standard':      { bg: 'var(--success-bg)',  color: 'var(--success-1)',       dot: 'var(--success-1)' },
  'Membre Driing': { bg: 'var(--accent-bg-2)',    color: 'var(--accent-text)', dot: 'var(--accent-text)' },
  'Administrateur':{ bg: 'rgba(192,132,252,0.12)', color: '#C084FC',       dot: '#C084FC' },
}

// Une entrée du changelog est considérée comme "lue" si sa date est antérieure
// ou égale au dernier passage de l'utilisateur dans le panneau Nouveautés
// (timestamp stocké en DB, donc partagé entre tous ses navigateurs).
function computeReadIds(lastSeenAt: string | null | undefined): Set<string> {
  if (!lastSeenAt) return new Set()
  return new Set(CHANGELOG.filter(e => e.date <= lastSeenAt).map(e => e.id))
}

interface HeaderProps {
  /** Optionnel : titre forcé. Si absent, dérivé du pathname (+ override via TitleSetter pour les routes dynamiques). */
  title?: string
  userName?: string
  currentPlan?: string
  /** Passé depuis le layout. Évite un useEffect qui refait 2 queries Supabase à chaque navigation. */
  isAdmin?: boolean
  /** Pour le lien "Profil forum" dans le dropdown */
  userId?: string
  /** Date de dernière ouverture du panneau Nouveautés (DB, suit le compte). */
  lastSeenNouveautesAt?: string | null
  /** Date de dernière visite Actualités, transmise au Sidebar mobile. */
  lastSeenActualitesAt?: string | null
  /** Badge Actualités pré-calculé côté serveur, transmis au Sidebar mobile. */
  hasNewActualites?: boolean
  /** Affiche le bouton Parcours (onboarding non terminé). */
  showOnboardingBtn?: boolean
}

export default function Header({ title: titleOverrideProp, userName: initialUserName, currentPlan = 'Découverte', isAdmin: isAdminProp = false, userId, lastSeenNouveautesAt = null, lastSeenActualitesAt = null, hasNewActualites = false, showOnboardingBtn = false }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [sosOpen, setSosOpen] = useState(false)
  // Mapping du label plan vers la valeur technique attendue par SOSModal.
  // Admin a accès complet aux scénarios (équivalent Driing).
  const sosPlan: 'decouverte' | 'standard' | 'driing' =
    currentPlan === 'Membre Driing' || currentPlan === 'Administrateur' ? 'driing'
    : currentPlan === 'Standard' ? 'standard'
    : 'decouverte'

  const [chezNousUnread, setChezNousUnread] = useState(0)
  // Compteur des notifications contextuelles (table `notifications`, générées
  // par le rules-engine). Récupéré au mount et mis à jour quand l'utilisateur
  // visite /dashboard/notifications.
  const [appNotifUnread, setAppNotifUnread] = useState(0)
  const [readIds, setReadIds] = useState<Set<string>>(() => computeReadIds(lastSeenNouveautesAt))
  const [userName] = useState(initialUserName ?? '')
  const [titleFromStore, setTitleFromStore] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const isAdmin = isAdminProp

  // Cloche unifiée : on récupère les compteurs (Chez Nous + Alertes app) côté
  // client au mount pour pouvoir les sommer au unreadCount produit (badge agrégé)
  // et les afficher dans les onglets du NotificationPanel.
  // Défensif : try/catch + Promise.allSettled — si une des deux tables est
  // momentanément indispo, l'autre compteur s'affiche quand même.
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    const supabase = createClient()
    Promise.allSettled([
      supabase
        .from('chez_nous_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .is('read_at', null),
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .is('read_at', null),
    ]).then(([cnResult, notifResult]) => {
      if (cancelled) return
      if (cnResult.status === 'fulfilled') setChezNousUnread(cnResult.value.count ?? 0)
      if (notifResult.status === 'fulfilled') setAppNotifUnread(notifResult.value.count ?? 0)
    }).catch(err => console.warn('[Header notif counts]', err))
    return () => { cancelled = true }
  }, [userId])

  // Quand l'utilisateur visite la page concernée, le badge correspondant se vide.
  useEffect(() => {
    if (pathname === '/dashboard/chez-nous/notifications') setChezNousUnread(0)
    if (pathname === '/dashboard/notifications') setAppNotifUnread(0)
  }, [pathname])

  // Synchro reactive : si l'utilisateur marque ses alertes lues depuis la page
  // notifications (ou via le panel cloche), le badge se met à jour SANS attendre
  // un changement de pathname. Émis par NotificationsView via window.dispatchEvent.
  useEffect(() => {
    function onCountChange(e: Event) {
      const detail = (e as CustomEvent<{ appNotifUnread?: number; chezNousUnread?: number }>).detail
      if (typeof detail?.appNotifUnread === 'number') setAppNotifUnread(detail.appNotifUnread)
      if (typeof detail?.chezNousUnread === 'number') setChezNousUnread(detail.chezNousUnread)
    }
    window.addEventListener('notif-count-changed', onCountChange as EventListener)
    return () => window.removeEventListener('notif-count-changed', onCountChange as EventListener)
  }, [])

  // Titre final : prop forcée > store (TitleSetter) > mapping pathname
  const title = titleOverrideProp ?? titleFromStore ?? resolveTitle(pathname ?? '')

  // Plan affiché : si admin, toujours "Administrateur", sinon ce que la layout passe
  const resolvedPlan = isAdmin ? 'Administrateur' : currentPlan

  // Quand on change de page, on remet le store à null pour éviter d'afficher
  // le titre dynamique de la page précédente le temps que la nouvelle page le set.
  useEffect(() => { setTitleFromStore(null) }, [pathname])

  // Subscribe au store de titre (utilisé par TitleSetter sur les pages dynamiques)
  useEffect(() => {
    const unsub = subscribeDashboardTitle((t) => setTitleFromStore(t))
    return unsub
  }, [])

  // Resync si la prop change (rare : nouveau profil chargé après mutation)
  useEffect(() => {
    setReadIds(computeReadIds(lastSeenNouveautesAt))
  }, [lastSeenNouveautesAt])

  const unreadCount = CHANGELOG.filter(e => !readIds.has(e.id)).length

  const markAllReadOnServer = useCallback(() => {
    fetch('/api/me/mark-seen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'nouveautes' }),
    }).catch(() => { /* best-effort, sera retenté au prochain mount */ })
  }, [])

  const handleOpenNotif = useCallback(() => {
    setNotifOpen(true)
    setDropdownOpen(false)
    setReadIds(new Set(CHANGELOG.map(e => e.id)))
    markAllReadOnServer()
  }, [markAllReadOnServer])

  const handleMarkAllRead = useCallback(() => {
    setReadIds(new Set(CHANGELOG.map(e => e.id)))
    markAllReadOnServer()
  }, [markAllReadOnServer])

  // Close dropdown on outside click
  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [dropdownOpen])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const initials = useMemo(
    () => userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?',
    [userName]
  )

  const plan = PLAN_COLORS[resolvedPlan] ?? PLAN_COLORS['Découverte']

  return (
    <>
      <div className="dash-mobile-sidebar-wrap">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} isAdmin={isAdmin} lastSeenActualitesAt={lastSeenActualitesAt} hasNewActualites={hasNewActualites} />
      </div>

      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        readIds={readIds}
        onMarkAllRead={handleMarkAllRead}
        chezNousUnread={chezNousUnread}
        appNotifUnread={appNotifUnread}
      />

      <SOSModal
        open={sosOpen}
        onClose={() => setSosOpen(false)}
        plan={sosPlan}
      />

      <header style={styles.header} className="dash-header">
        <div style={styles.left} className="dash-header-left">
          <button
            onClick={() => setMobileOpen(true)}
            style={styles.menuBtn}
            className="dash-menu-btn"
            aria-label="Menu"
          >
            <List size={22} />
          </button>
          <h1 style={styles.title} className="dash-header-title">{title}</h1>
        </div>

        <div style={styles.right}>
          {/* Onboarding parcours button */}
          {showOnboardingBtn && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-onboarding'))}
              className="theme-toggle"
              aria-label="Mes parcours d'onboarding"
              title="Mes parcours"
            >
              <MapTrifold size={17} weight="regular" />
            </button>
          )}

          {/* Theme toggle — cycle dark → light → amoled → dark */}
          {(() => {
            const nextLabel =
              theme === 'dark'   ? 'Passer en mode clair' :
              theme === 'light'  ? 'Passer en mode AMOLED (noir profond)' :
                                   'Passer en mode sombre'
            const icon =
              theme === 'dark'   ? <Sun size={17} weight="regular" /> :
              theme === 'light'  ? <Moon size={17} weight="regular" /> :
                                   <MoonStars size={17} weight="fill" />
            return (
              <button
                onClick={toggleTheme}
                className="theme-toggle"
                aria-label={nextLabel}
                title={nextLabel}
              >
                {icon}
              </button>
            )
          })()}

          {/* SOS Hôte — accessible depuis n'importe quelle page du dashboard */}
          <button
            style={styles.sosBtn}
            className="dash-sos-btn"
            aria-label="SOS Hôte — En cas de problème"
            title="SOS Hôte — En cas de problème"
            onClick={() => setSosOpen(true)}
          >
            <Lifebuoy size={18} weight="regular" />
          </button>

          {/* Notifications — cloche unifiée (Alertes app + Nouveautés produit + Forum Chez Nous) */}
          {(() => {
            const totalUnread = unreadCount + chezNousUnread + appNotifUnread
            return (
              <button
                style={styles.iconBtn}
                className="dash-icon-btn"
                aria-label={`Notifications${totalUnread > 0 ? `, ${totalUnread} non lue${totalUnread > 1 ? 's' : ''}` : ''}`}
                onClick={handleOpenNotif}
              >
                <Bell size={18} weight="regular" />
                {totalUnread > 0 && (
                  <span style={styles.notifBadge} className="anim-pulse-soft">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </button>
            )
          })()}

          {/* Profile dropdown */}
          <div ref={dropdownRef} style={styles.dropdownWrap}>
            <button
              onClick={() => setDropdownOpen(v => !v)}
              style={styles.profileBtn}
              className="dash-profile-btn"
              aria-expanded={dropdownOpen}
            >
              <div style={styles.avatar}>
                {userName ? (
                  <span style={styles.avatarInitial}>{initials}</span>
                ) : (
                  <UserCircle size={22} weight="fill" color="var(--text-3)" />
                )}
              </div>
              {userName && (
                <span style={styles.profileName} className="dash-profile-name">
                  {userName.split(' ')[0]}
                </span>
              )}
              <CaretDown
                size={12}
                style={{
                  color: 'var(--text-3)',
                  transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              />
            </button>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <div style={styles.dropdown} className="dash-dropdown">
                {/* User card */}
                <div style={styles.dropUserCard}>
                  <div style={styles.dropAvatar}>
                    <span style={styles.dropAvatarText}>{initials}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.dropName}>{userName || 'Mon compte'}</div>
                    <div
                      style={{
                        ...styles.dropPlan,
                        background: plan.bg,
                        color: plan.color,
                      }}
                    >
                      <span style={{ ...styles.planDot, background: plan.dot }} />
                      {resolvedPlan}
                    </div>
                  </div>
                </div>

                <div style={styles.dropDivider} />

                {/* Navigation */}
                <nav style={styles.dropNav}>
                  <Link href="/dashboard/profil" style={styles.dropItem} onClick={() => setDropdownOpen(false)}>
                    <UserCircle size={15} />
                    Mon compte
                  </Link>
                  {userId && (
                    <Link href={`/dashboard/chez-nous/membre/${userId}`} style={styles.dropItem} onClick={() => setDropdownOpen(false)}>
                      <UserCircle size={15} weight="duotone" />
                      Profil forum
                    </Link>
                  )}
                  <Link href="/dashboard/abonnement" style={styles.dropItem} onClick={() => setDropdownOpen(false)}>
                    <CreditCard size={15} />
                    Mon abonnement
                  </Link>
                  <Link href="/dashboard/aide" style={styles.dropItem} onClick={() => setDropdownOpen(false)}>
                    <Question size={15} />
                    Centre d&apos;aide
                  </Link>
                </nav>

                <div style={styles.dropDivider} />

                <nav style={styles.dropNav}>
                  <a
                    href="https://jasonmarinho.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.dropItem}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <ArrowUpRight size={15} />
                    jasonmarinho.com
                  </a>
                </nav>

                <div style={styles.dropDivider} />

                {/* Google Review CTA */}
                <div style={{ padding: '6px' }}>
                  <a
                    href="https://g.page/r/CcLzE7IbhS5_EAE/review"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setDropdownOpen(false)}
                    style={styles.dropReviewBtn}
                  >
                    <Star size={14} weight="fill" style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
                    Laisser un avis Google
                    <ArrowUpRight size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
                  </a>
                </div>

                <div style={styles.dropDivider} />

                <button
                  onClick={() => { setDropdownOpen(false); handleSignOut() }}
                  style={styles.dropSignOut}
                >
                  <SignOut size={15} />
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: 'fixed',
    top: 0,
    left: 'var(--sidebar-w)',
    right: 0,
    height: 'var(--header-h)',
    background: 'var(--nav-bg)',
    borderBottom: '1px solid var(--nav-border)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 clamp(16px,3vw,32px)',
    zIndex: 90,
    transition: 'background var(--d-slow) var(--ease-smooth), border-color var(--d-slow) var(--ease-smooth)',
  },
  left: { display: 'flex', alignItems: 'center', gap: 'var(--s-3)' },
  menuBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--nav-item)', padding: 'var(--s-2)',
    borderRadius: 'var(--r-sm)',
    transition: 'background var(--d-base) var(--ease-smooth), color var(--d-base) var(--ease-smooth)',
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: 'var(--t-lg)',
    fontWeight: 400, color: 'var(--text)', letterSpacing: 'var(--ls-tight)',
  },
  right: { display: 'flex', alignItems: 'center', gap: 'var(--s-2)' },
  iconBtn: {
    position: 'relative',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-sm)',
    width: '38px', height: '38px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-2)',
    transition: 'background var(--d-base) var(--ease-smooth), border-color var(--d-base) var(--ease-smooth), color var(--d-base) var(--ease-smooth), transform var(--d-base) var(--ease-spring)',
  },
  sosBtn: {
    position: 'relative',
    background: 'var(--danger-bg)',
    border: '1px solid var(--danger-border)',
    borderRadius: 'var(--r-sm)',
    width: '38px', height: '38px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--danger)',
    transition: 'background var(--d-base) var(--ease-smooth), border-color var(--d-base) var(--ease-smooth), transform var(--d-base) var(--ease-spring)',
  },
  notifBadge: {
    position: 'absolute',
    top: '-5px', right: '-5px',
    minWidth: '18px', height: '18px',
    background: 'var(--success-1)',
    color: '#001a14',
    fontSize: '10px', fontWeight: 700,
    borderRadius: 'var(--r-pill)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 5px',
    lineHeight: 1,
    boxShadow: '0 0 0 2px var(--bg)',
    pointerEvents: 'none' as const,
  },

  /* Profile button (avatar + name + caret) */
  dropdownWrap: { position: 'relative' },
  profileBtn: {
    display: 'flex', alignItems: 'center', gap: 'var(--s-2)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-pill)',
    padding: '4px 12px 4px 4px',
    cursor: 'pointer',
    transition: 'background var(--d-base) var(--ease-smooth), border-color var(--d-base) var(--ease-smooth), transform var(--d-base) var(--ease-spring)',
  },
  avatar: {
    width: '28px', height: '28px', flexShrink: 0,
    background: 'rgba(0,76,63,0.5)',
    border: '1px solid var(--accent-border-2)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '12px',
    fontWeight: 600, color: 'var(--nav-active-color)',
  },
  profileName: {
    fontSize: '13px', fontWeight: 500,
    color: 'var(--text-2)', maxWidth: '90px',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },

  /* Dropdown panel */
  dropdown: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    width: '240px',
    background: 'var(--bg-2)',
    border: '1px solid var(--border-2)',
    borderRadius: '14px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    backdropFilter: 'blur(20px)',
    zIndex: 200,
    overflow: 'hidden',
    animation: 'fadeIn 0.15s ease',
  },
  dropUserCard: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '16px',
  },
  dropAvatar: {
    width: '40px', height: '40px', flexShrink: 0,
    background: 'rgba(0,76,63,0.5)',
    border: '1.5px solid var(--accent-border-2)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dropAvatarText: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '15px',
    fontWeight: 600, color: 'var(--nav-active-color)',
  },
  dropName: {
    fontSize: '14px', fontWeight: 600, color: 'var(--text)',
    marginBottom: '5px',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  dropPlan: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '11px', fontWeight: 600,
    padding: '3px 9px', borderRadius: '100px',
    letterSpacing: '0.3px',
  },
  planDot: {
    width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
  },
  dropDivider: {
    height: '1px', background: 'var(--border)',
    margin: '0',
  },
  dropNav: {
    padding: '6px',
    display: 'flex', flexDirection: 'column', gap: '2px',
  },
  dropItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '9px 12px', borderRadius: '8px',
    fontSize: '13px', fontWeight: 400,
    color: 'var(--text-2)',
    textDecoration: 'none',
    transition: 'background 0.15s',
    background: 'none', border: 'none', cursor: 'pointer', width: '100%',
    textAlign: 'left',
  },
  dropSignOut: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '9px 18px', margin: '6px',
    borderRadius: '8px',
    fontSize: '13px', fontWeight: 400,
    color: 'var(--text-3)',
    background: 'none', border: 'none', cursor: 'pointer',
    width: 'calc(100% - 12px)', textAlign: 'left',
    transition: 'background 0.15s',
  },
  dropReviewBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '9px 12px', borderRadius: '8px',
    fontSize: '13px', fontWeight: 500,
    color: 'var(--accent-text)',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    textDecoration: 'none',
    width: '100%',
    transition: 'background 0.15s',
  },
}
