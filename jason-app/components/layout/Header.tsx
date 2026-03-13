'use client'

import { useState } from 'react'
import { List, Bell, UserCircle } from '@phosphor-icons/react'
import Link from 'next/link'
import Sidebar from './Sidebar'

interface HeaderProps {
  title: string
  userName?: string
}

export default function Header({ title, userName }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

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
          <button style={styles.iconBtn} aria-label="Notifications">
            <Bell size={18} weight="regular" />
          </button>
          <Link href="/dashboard/profil" style={{ ...styles.avatar, textDecoration: 'none' }} title="Mon profil">
            {userName ? (
              <span style={styles.avatarInitial}>
                {userName.charAt(0).toUpperCase()}
              </span>
            ) : (
              <UserCircle size={28} weight="fill" color="rgba(240,244,255,0.4)" />
            )}
          </Link>
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
  avatar: {
    width: '34px', height: '34px',
    background: 'rgba(0,76,63,0.4)',
    border: '1px solid rgba(255,213,107,0.2)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'Fraunces, serif', fontSize: '14px',
    fontWeight: 600, color: '#FFD56B',
  },
}
