'use client'

import { useState } from 'react'
import { QrCode, Printer, Sparkle } from '@phosphor-icons/react/dist/ssr'
import QrSimpleTab from './QrSimpleTab'
import AfficheTab from './AfficheTab'
import OutilsSwitcher from '@/components/dashboard/OutilsSwitcher'

interface Logement {
  id: string
  nom: string
  adresse?: string
  wifi_nom?: string
  wifi_mdp?: string
}

interface Props {
  plan: string
  logements: Logement[]
}

export default function OutilsImpressionView({ plan, logements }: Props) {
  const [tab, setTab] = useState<'qr' | 'affiche'>('qr')

  return (
    <div style={s.page}>
      <OutilsSwitcher current="impression" />
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerBadge}>
          <Sparkle size={11} weight="fill" />
          Outils Impression
        </div>
        <h1 style={s.title}>QR Codes & Affiches</h1>
        <p style={s.subtitle}>
          Génère ton QR code WiFi ou de lien, ou crée une affiche A4 prête à imprimer pour ton logement.
        </p>
      </div>

      {/* Tabs */}
      <div style={s.tabBar}>
        <button
          onClick={() => setTab('qr')}
          style={{ ...s.tab, ...(tab === 'qr' ? s.tabActive : {}) }}
        >
          <QrCode size={16} weight={tab === 'qr' ? 'fill' : 'regular'} />
          QR Code Simple
        </button>
        <button
          onClick={() => setTab('affiche')}
          style={{ ...s.tab, ...(tab === 'affiche' ? s.tabActive : {}) }}
        >
          <Printer size={16} weight={tab === 'affiche' ? 'fill' : 'regular'} />
          Affiche A4
        </button>
      </div>

      {/* Content */}
      <div style={s.content}>
        {tab === 'qr' && <QrSimpleTab plan={plan} logements={logements} />}
        {tab === 'affiche' && <AfficheTab plan={plan} logements={logements} />}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    width: '100%',
    padding: 'clamp(16px, 2.5vw, 32px) clamp(20px, 3vw, 40px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  headerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--s-2)',
    fontSize: 'var(--t-xs)',
    fontWeight: 700,
    letterSpacing: '0.6px',
    textTransform: 'uppercase' as const,
    color: 'var(--accent-text)',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: 'var(--r-pill)',
    padding: '4px 12px',
    width: 'fit-content',
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(26px, 3vw, 34px)',
    fontWeight: 400,
    color: 'var(--text)',
    margin: 0,
    lineHeight: 'var(--lh-tight)',
    letterSpacing: 'var(--ls-tight)',
  },
  subtitle: {
    fontSize: 'var(--t-base)',
    color: 'var(--text-2)',
    margin: 0,
    lineHeight: 'var(--lh-relax)',
    maxWidth: '560px',
  },
  tabBar: {
    display: 'flex',
    gap: 'var(--s-2)',
    flexWrap: 'wrap' as const,
  },
  tab: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--s-2)',
    padding: '10px 18px',
    borderRadius: 'var(--r-md)',
    fontSize: 'var(--t-sm)',
    fontWeight: 600,
    color: 'var(--text-2)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    transition: 'background var(--d-base) var(--ease-smooth), border-color var(--d-base) var(--ease-smooth), color var(--d-base) var(--ease-smooth)',
    fontFamily: 'var(--font-outfit), sans-serif',
  },
  tabActive: {
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)',
    fontWeight: 600,
  },
  content: {
    width: '100%',
  },
}
