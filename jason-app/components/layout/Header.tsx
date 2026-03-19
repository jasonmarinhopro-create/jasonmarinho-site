'use client'

import { useState, useRef, useEffect } from 'react'
import {
  List, Bell, UserCircle, SignOut, CreditCard,
  ShieldCheck, CaretDown, ArrowUpRight
} from '@phosphor-icons/react'
import Link from 'next/link'
import Sidebar from './Sidebar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  title: string
  userName?: string
  currentPlan?: string
}

export default function Header({ title, userName: initialUserName, currentPlan = 'Découverte' }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [userName, setUserName] = useState(initialUserName ?? '')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Fetch profile client-side — garantit que le nom est toujours à jour
  // quelle que soit la page (même les pages client qui ne passent pas userName)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.full_name) setUserName(data.full_name)
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
    'Découverte':    { bg: 'rgba(255,255,255,0.08)', color: 'rgba(240,244,255,0.5)', dot: '#6b7280' },
    'Hôte':          { bg: 'rgba(99,214,131,0.12)',  color: '#63D683', dot: '#63D683' },
    'Pro':           { bg: 'rgba(255,213,107,0.12)', color: '#FFD56B', dot: '#FFD56B' },
    'Agence':        { bg: 'rgba(147,197,253,0.12)', color: '#93C5FD', dot: '#93C5FD' },
    'Administrateur':{ bg: 'rgba(192,132,252,0.12)', color: '#C084FC', dot: '#C084FC' },
  }
  const plan = planColors[currentPlan] ?? planColors['Découverte']

  return (
    <>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

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
          {/* Notifications */}
          <button style={styles.iconBtn} aria-label="Notifications">
            <Bell size={18} weight="regular" />
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
                  <UserCircle size={22} weight="fill" color="rgba(240,244,255,0.4)" />
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
                  color: 'rgba(240,244,255,0.4)',
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
                      {currentPlan}
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
                    <span style={styles.dropBadge}>{currentPlan}</span>
                  </Link>
                </nav>

                <div style={styles.dropDivider} />

                <nav style={styles.dropNav}>
                  <Link href="/dashboard/securite" style={styles.dropItem} onClick={() => setDropdownOpen(false)}>
                    <ShieldCheck size={15} />
                    Sécurité voyageurs
                  </Link>
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
    background: 'rgba(0,51,42,0.92)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    backdropFilter: 'blur(20px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 clamp(16px,3vw,32px)',
    zIndex: 90,
  },
  left: { display: 'flex', alignItems: 'center', gap: '14px' },
  menuBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'rgba(240,244,255,0.55)', padding: '6px',
    borderRadius: '8px',
  },
  title: {
    fontFamily: 'Fraunces, serif', fontSize: '18px',
    fontWeight: 400, color: '#f0f4ff', letterSpacing: '-0.3px',
  },
  right: { display: 'flex', alignItems: 'center', gap: '8px' },
  iconBtn: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '9px',
    width: '36px', height: '36px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'rgba(240,244,255,0.5)',
  },

  /* Profile button (avatar + name + caret) */
  dropdownWrap: { position: 'relative' },
  profileBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '100px',
    padding: '4px 10px 4px 4px',
    cursor: 'pointer',
    transition: 'background 0.18s',
  },
  avatar: {
    width: '28px', height: '28px', flexShrink: 0,
    background: 'rgba(0,76,63,0.6)',
    border: '1px solid rgba(255,213,107,0.25)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'Fraunces, serif', fontSize: '12px',
    fontWeight: 600, color: '#FFD56B',
  },
  profileName: {
    fontSize: '13px', fontWeight: 500,
    color: 'rgba(240,244,255,0.75)', maxWidth: '90px',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },

  /* Dropdown panel */
  dropdown: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    width: '240px',
    background: 'rgba(4,18,14,0.98)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
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
    background: 'rgba(0,76,63,0.6)',
    border: '1.5px solid rgba(255,213,107,0.25)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dropAvatarText: {
    fontFamily: 'Fraunces, serif', fontSize: '15px',
    fontWeight: 600, color: '#FFD56B',
  },
  dropName: {
    fontSize: '14px', fontWeight: 600, color: '#f0f4ff',
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
    height: '1px', background: 'rgba(255,255,255,0.06)',
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
    color: 'rgba(240,244,255,0.65)',
    textDecoration: 'none',
    transition: 'background 0.15s',
    background: 'none', border: 'none', cursor: 'pointer', width: '100%',
    textAlign: 'left',
  },
  dropBadge: {
    marginLeft: 'auto',
    fontSize: '10px', fontWeight: 600,
    color: 'rgba(240,244,255,0.3)',
    background: 'rgba(255,255,255,0.06)',
    padding: '2px 7px', borderRadius: '100px',
  },
  dropSignOut: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '9px 18px', margin: '6px',
    borderRadius: '8px',
    fontSize: '13px', fontWeight: 400,
    color: 'rgba(240,244,255,0.45)',
    background: 'none', border: 'none', cursor: 'pointer',
    width: 'calc(100% - 12px)', textAlign: 'left',
    transition: 'background 0.15s',
  },
}
