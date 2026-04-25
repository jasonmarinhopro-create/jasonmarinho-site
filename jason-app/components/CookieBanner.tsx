'use client'

import { useEffect, useState } from 'react'

const CONSENT_KEY = 'cookie_consent'

type Consent = 'accepted' | 'refused'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (!stored) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'accepted')
    setVisible(false)
  }

  function refuse() {
    localStorage.setItem(CONSENT_KEY, 'refused')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={styles.overlay}>
      <div style={styles.banner}>
        <div style={styles.content}>
          <p style={styles.title}>Cookies & confidentialité</p>
          <p style={styles.text}>
            Ce site utilise des cookies essentiels au fonctionnement de ton espace membre (session, sécurité).
            Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé.{' '}
            <a href="https://jasonmarinho.com/confidentialite" target="_blank" rel="noopener noreferrer" style={styles.link}>
              Politique de confidentialité
            </a>
          </p>
        </div>
        <div style={styles.actions}>
          <button onClick={refuse} style={styles.btnRefuse}>Refuser</button>
          <button onClick={accept} style={styles.btnAccept}>Accepter</button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 40px)',
    maxWidth: '720px',
    zIndex: 9999,
  },
  banner: {
    background: 'rgba(14, 22, 19, 0.95)',
    border: '1px solid var(--border-2)',
    borderRadius: '16px',
    padding: '20px 24px',
    backdropFilter: 'blur(24px)',
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap',
  },
  content: {
    flex: 1,
    minWidth: '200px',
  },
  title: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#f0f4ff',
    marginBottom: '4px',
  },
  text: {
    fontSize: '13px',
    fontWeight: 300,
    color: 'rgba(240,244,255,0.55)',
    lineHeight: 1.5,
    margin: 0,
  },
  link: {
    color: 'rgba(255,213,107,0.7)',
    textDecoration: 'underline',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    flexShrink: 0,
  },
  btnRefuse: {
    padding: '9px 18px',
    borderRadius: '10px',
    border: '1px solid var(--border-2)',
    background: 'transparent',
    color: 'rgba(240,244,255,0.55)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  btnAccept: {
    padding: '9px 18px',
    borderRadius: '10px',
    border: '1px solid rgba(0,76,63,0.6)',
    background: 'rgba(0,76,63,0.4)',
    color: '#f0f4ff',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
}
