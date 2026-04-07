'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  List, Bell, UserCircle, SignOut, CreditCard,
  Question, CaretDown, ArrowUpRight, Sun, Moon
} from '@phosphor-icons/react'
import Link from 'next/link'
import Sidebar from './Sidebar'
import NotificationPanel from './NotificationPanel'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeProvider'
import { CHANGELOG } from '@/lib/constants/changelog'

const STORAGE_KEY = 'jm_notif_read'

function getReadIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveReadIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)))
}

interface HeaderProps {
  title: string
  userName?: string
  currentPlan?: string
}

export default function Header({ title, userName: initialUserName, currentPlan = 'Découverte' }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [userName, setUserName] = useState(initialUserName ?? '')
  const [resolvedPlan, setResolvedPlan] = useState(currentPlan)
  const [isAdmin, setIsAdmin] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  // Load read IDs from localStorage — lazy init prevents badge flash on navigation
  useEffect(() => {
    setReadIds(getReadIds())
  }, [])

  // Suppress badge until hydration is complete (avoids "+9" flash)
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => { setHydrated(true) }, [])

  const unreadCount = CHANGELOG.filter(e => !readIds.has(e.id)).length

  const handleOpenNotif = useCallback(() => {
    setNotifOpen(true)
    setDropdownOpen(false)
    // Mark all as read when panel opens
    const all = new Set(CHANGELOG.map(e => e.id))
    setReadIds(all)
    saveReadIds(all)
  }, [])

  const handleMarkAllRead = useCallback(() => {
    const all = new Set(CHANGELOG.map(e => e.id))
    setReadIds(all)
    saveReadIds(all)
  }, [])

  // Fetch profile client-side — garantit nom + rôle à jour sur toutes les pages
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      supabase
        .from('profiles')
        .select('full_name, role, plan')
        .eq('id', session.user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.full_name) setUserName(data.full_name)
          if (data?.role === 'admin') {
            setResolvedPlan('Administrateur')
            setIsAdmin(true)
          } else if (data?.plan === 'driing') {
            setResolvedPlan('Membre Driing')
          } else {
            setResolvedPlan('Découverte')
          }
        })
    })
  }, [])

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

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const planColors: Record<string, { bg: string; color: string; dot: string }> = {
    'Découverte':    { bg: 'rgba(255,255,255,0.08)', color: 'var(--text-3)', dot: '#6b7280' },
    'Membre Driing': { bg: 'rgba(255,213,107,0.14)', color: '#FFD56B', dot: '#FFD56B' },
    'Hôte':          { bg: 'rgba(99,214,131,0.12)',  color: '#34D399', dot: '#34D399' },
    'Pro':           { bg: 'rgba(255,213,107,0.12)', color: '#FFD56B', dot: '#FFD56B' },
    'Agence':        { bg: 'rgba(147,197,253,0.12)', color: '#93C5FD', dot: '#93C5FD' },
    'Administrateur':{ bg: 'rgba(192,132,252,0.12)', color: '#C084FC', dot: '#C084FC' },
  }
  const plan = planColors[resolvedPlan] ?? planColors['Découverte']

  return (
    <>
      <div className="dash-mobile-sidebar-wrap">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} isAdmin={isAdmin} />
      </div>

      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        readIds={readIds}
        onMarkAllRead={handleMarkAllRead}
      />

      <header style={styles.header} className="dash-header">
        <div style={styles.left}>
          <button
            onClick={() => setMobileOpen(true)}
            style={styles.menuBtn}
            className="dash-menu-btn"
            aria-label="Menu"
          >
            <List size={22} />
          </button>
          <h1 style={styles.title}>{title}</h1>
        </div>

        <div style={styles.right}>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          >
            {theme === 'dark'
              ? <Sun size={17} weight="regular" />
              : <Moon size={17} weight="regular" />
            }
          </button>

          {/* Notifications */}
          <button
            style={styles.iconBtn}
            aria-label={`Notifications${hydrated && unreadCount > 0 ? ` — ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : ''}`}
            onClick={handleOpenNotif}
          >
            <Bell size={18} weight={hydrated && unreadCount > 0 ? 'fill' : 'regular'} />
            {hydrated && unreadCount > 0 && (
              <span style={styles.notifBadge}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Profile dropdown */}
          <div ref={dropdownRef} style={styles.dropdownWrap}>
            <button
              onClick={() => setDropdownOpen(v => !v)}
              style={styles.profileBtn}
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
                    Mon profil
                  </Link>
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 clamp(16px,3vw,32px)',
    zIndex: 90,
    transition: 'background 0.25s ease, border-color 0.25s ease',
  },
  left: { display: 'flex', alignItems: 'center', gap: '14px' },
  menuBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--nav-item)', padding: '6px',
    borderRadius: '8px',
  },
  title: {
    fontFamily: 'Fraunces, serif', fontSize: '18px',
    fontWeight: 400, color: 'var(--text)', letterSpacing: '-0.3px',
  },
  right: { display: 'flex', alignItems: 'center', gap: '8px' },
  iconBtn: {
    position: 'relative',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '9px',
    width: '36px', height: '36px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-2)',
  },
  notifBadge: {
    position: 'absolute',
    top: '-5px', right: '-5px',
    minWidth: '17px', height: '17px',
    background: '#63D683',
    color: '#001a14',
    fontSize: '10px', fontWeight: 700,
    borderRadius: '100px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 4px',
    lineHeight: 1,
    boxShadow: '0 0 0 2px var(--bg)',
    pointerEvents: 'none',
  },

  /* Profile button (avatar + name + caret) */
  dropdownWrap: { position: 'relative' },
  profileBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '100px',
    padding: '4px 10px 4px 4px',
    cursor: 'pointer',
    transition: 'background 0.18s',
  },
  avatar: {
    width: '28px', height: '28px', flexShrink: 0,
    background: 'rgba(0,76,63,0.5)',
    border: '1px solid rgba(255,213,107,0.25)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'Fraunces, serif', fontSize: '12px',
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
    border: '1.5px solid rgba(255,213,107,0.25)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dropAvatarText: {
    fontFamily: 'Fraunces, serif', fontSize: '15px',
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
}
