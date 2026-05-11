'use client'

import { useEffect, useState, useRef } from 'react'
import { markStepIfNotYet } from '@/lib/onboarding/client'

/* Install widget pour le dashboard.
   Version React du widget vanilla qui était sur le site marketing.
   Différences :
   - Détection plus stricte du standalone (skip auto + marque l'onboarding done).
   - Marque la step 'install_app' via markStepIfNotYet quand on détecte
     une installation réussie (event 'appinstalled' OU standalone détecté).
   - Délai d'apparition plus long (8s) pour ne pas casser le first paint
     du dashboard chargé. */

const STORAGE_KEY = 'jm-install-widget'
const DISMISS_DAYS = 7

declare global {
  interface Window {
    MSStream?: unknown
  }
  interface Navigator {
    standalone?: boolean
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallAppWidget() {
  const [visible, setVisible] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [bookmarkHint, setBookmarkHint] = useState<string | null>(null)
  const beforeInstallEventRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [, setTick] = useState(0)

  // Détection navigateur (UA sniffing minimal)
  const isClient = typeof window !== 'undefined'
  const ua = isClient ? navigator.userAgent : ''
  const isIOS = /iPhone|iPad|iPod/.test(ua) && !window.MSStream
  const isAndroid = /Android/.test(ua)
  const isFirefox = /Firefox|FxiOS/.test(ua)

  useEffect(() => {
    if (!isClient) return

    // Skip si déjà installé (standalone)
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    if (isStandalone) {
      // App déjà installée → marquer l'onboarding done une fois pour toutes
      void markStepIfNotYet('install_app')
      return
    }

    // Skip si dismissed récemment (sauf ?install=1 dans l'URL)
    const forceShow = /[?&]install=1/.test(window.location.search)
    if (!forceShow) {
      try {
        const dismissed = localStorage.getItem(STORAGE_KEY)
        if (dismissed) {
          const t = parseInt(dismissed, 10)
          if (!isNaN(t) && Date.now() - t < DISMISS_DAYS * 86400 * 1000) return
        }
      } catch {}
    }

    // Capture le prompt natif d'installation
    function onBeforeInstall(e: Event) {
      e.preventDefault()
      beforeInstallEventRef.current = e as BeforeInstallPromptEvent
      setTick(t => t + 1)
    }

    // Quand l'app est effectivement installée
    function onAppInstalled() {
      try { localStorage.setItem(STORAGE_KEY, String(Date.now() + 365 * 86400 * 1000)) } catch {}
      void markStepIfNotYet('install_app')
      setVisible(false)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onAppInstalled)

    // Affichage après un délai (immédiat si ?install=1)
    const timer = setTimeout(() => setVisible(true), forceShow ? 0 : 8000)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [isClient])

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch {}
    setVisible(false)
  }

  async function handleInstallClick() {
    // CAS 1 : prompt natif disponible (Chrome / Edge / Android)
    const evt = beforeInstallEventRef.current
    if (evt) {
      evt.prompt()
      try {
        const { outcome } = await evt.userChoice
        if (outcome === 'accepted') {
          void markStepIfNotYet('install_app')
          setVisible(false)
        }
      } catch {}
      beforeInstallEventRef.current = null
      return
    }

    // CAS 2 : iOS Safari → overlay visuel
    if (isIOS) {
      setShowIOSGuide(true)
      return
    }

    // CAS 3 : Mobile sans support natif (Firefox Android) → partage natif
    if (typeof navigator !== 'undefined' && navigator.share && (isAndroid || isFirefox)) {
      try {
        await navigator.share({
          title: document.title,
          text: 'Jason Marinho — mon espace LCD',
          url: window.location.href,
        })
        return
      } catch {}
    }

    // CAS 4 : Desktop sans support → bookmark hint
    const isMac = /Mac/.test(navigator.platform)
    setBookmarkHint(`${isMac ? '⌘' : 'Ctrl'} + D pour ajouter aux favoris`)
    setTimeout(() => setBookmarkHint(null), 5000)
  }

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes jm-iw-slide-in {
          from { transform: translateY(140%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes jm-ios-bounce {
          0%, 100% { transform: translateY(0); opacity: .5; }
          50%      { transform: translateY(6px); opacity: 1; }
        }
        /* Widget — fond opaque dédié (les vars --surface du dashboard sont
           translucides par design, ce qui rendrait le widget illisible) */
        .jm-iw-root {
          position: fixed; bottom: 16px; right: 16px; left: auto; z-index: 9998;
          width: min(360px, calc(100vw - 32px));
          background: #FDFCF9; color: #0F1A0D;
          border: 1px solid rgba(0,76,63,.16); border-radius: 14px;
          box-shadow: 0 12px 32px rgba(0,0,0,.25);
          padding: 14px 16px 12px;
          animation: jm-iw-slide-in .35s cubic-bezier(.22,.61,.36,1) forwards;
        }
        [data-theme="dark"] .jm-iw-root {
          background: #0F1A0D; color: #F0F4FF;
          border-color: rgba(255,213,107,.18);
          box-shadow: 0 12px 32px rgba(0,0,0,.5);
        }
        .jm-iw-desc { color: rgba(15,26,13,.66); }
        [data-theme="dark"] .jm-iw-desc { color: rgba(240,244,255,.62); }
        .jm-iw-close { color: rgba(15,26,13,.4); }
        [data-theme="dark"] .jm-iw-close { color: rgba(240,244,255,.4); }
        .jm-iw-close:hover { background: rgba(15,26,13,.06); color: rgba(15,26,13,.7); }
        [data-theme="dark"] .jm-iw-close:hover { background: rgba(255,255,255,.08); color: rgba(240,244,255,.7); }
        @media (max-width: 480px) {
          .jm-iw-root { right: 8px; bottom: 8px; left: 8px; width: auto; }
        }
      `}</style>

      <div className="jm-iw-root" role="dialog" aria-label="Installer l'app">
        <div style={s.head}>
          <div style={s.icon}>
            <img src="/icon-192.png" alt="" width={36} height={36} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={s.title}>Garde Jason à portée de tap</p>
            <p className="jm-iw-desc" style={s.desc}>Installe ton espace comme une app pour le retrouver en un tap sur ton écran d&apos;accueil.</p>
          </div>
          <button onClick={dismiss} className="jm-iw-close" style={s.close} aria-label="Fermer">×</button>
        </div>
        <button onClick={handleInstallClick} style={s.cta} disabled={!!bookmarkHint}>
          {bookmarkHint ?? "Installer l'app"}
        </button>
      </div>

      {showIOSGuide && (
        <IOSGuideOverlay onClose={() => setShowIOSGuide(false)} />
      )}
    </>
  )
}

function IOSGuideOverlay({ onClose }: { onClose: () => void }) {
  return (
    <>
      <style>{`
        @keyframes jm-ios-overlay-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes jm-ios-card-in {
          from { transform: translateY(20px); }
          to   { transform: translateY(0); }
        }
      `}</style>
      <div onClick={onClose} style={s.iosOverlay}>
        <div onClick={e => e.stopPropagation()} style={s.iosCard}>
          <div style={s.iosHead}>
            <h3 style={s.iosTitle}>Ajoute Jason à ton écran d&apos;accueil</h3>
            <button onClick={onClose} style={s.iosClose} aria-label="Fermer">×</button>
          </div>
          <div style={s.iosStep}>
            <div style={s.iosStepNum}>1</div>
            <div style={s.iosStepText}>
              Touche l&apos;icône <strong style={s.iosStrong}>Partager</strong>{' '}
              <span style={s.pictogram} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1L4 5h2.5v6h3V5H12L8 1zm6 12H2v-2H1v3a1 1 0 001 1h12a1 1 0 001-1v-3h-1v2z"/></svg>
              </span>
              en bas de l&apos;écran.
            </div>
          </div>
          <div style={s.iosStep}>
            <div style={s.iosStepNum}>2</div>
            <div style={s.iosStepText}>
              Fais défiler la liste, puis touche <strong style={s.iosStrong}>« Sur l&apos;écran d&apos;accueil »</strong>{' '}
              <span style={s.pictogram} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a1 1 0 011 1v6h6a1 1 0 010 2H9v6a1 1 0 01-2 0V9H1a1 1 0 010-2h6V1a1 1 0 011-1z"/></svg>
              </span>
              <div style={s.iosHint}>
                Tu ne la vois pas&nbsp;? Touche <strong style={s.iosStrong}>« En voir plus »</strong> en bas de la feuille, l&apos;option se trouve dans la liste complète.
              </div>
            </div>
          </div>
          <div style={s.iosStep}>
            <div style={s.iosStepNum}>3</div>
            <div style={s.iosStepText}>
              Touche <strong style={s.iosStrong}>Ajouter</strong> en haut à droite. C&apos;est fait&nbsp;!
            </div>
          </div>
          <div style={s.iosArrow} aria-hidden="true">↓</div>
        </div>
      </div>
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  head: { display: 'flex', alignItems: 'flex-start', gap: '10px' },
  icon: {
    width: '36px', height: '36px', flexShrink: 0, borderRadius: '9px', overflow: 'hidden',
    background: '#004C3F',
  },
  title: { fontSize: '14px', fontWeight: 600, margin: '0 0 2px', letterSpacing: '-.1px' },
  desc: { fontSize: '12.5px', margin: 0, lineHeight: 1.45 },
  close: {
    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
    fontSize: '18px', lineHeight: 1, marginLeft: 'auto',
    width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '6px', flexShrink: 0,
  },
  cta: {
    width: '100%', marginTop: '12px', padding: '10px 14px', borderRadius: '10px',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none',
    background: '#004C3F', color: '#FFD56B', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '7px',
  },

  iosOverlay: {
    position: 'fixed', inset: 0, zIndex: 99999,
    background: 'rgba(0,15,10,.86)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    animation: 'jm-ios-overlay-in .25s forwards',
  },
  iosCard: {
    background: '#FDFCF9', color: '#0F1A0D', width: '100%', maxWidth: '480px',
    borderRadius: '20px 20px 0 0', padding: '24px 20px 32px',
    animation: 'jm-ios-card-in .3s cubic-bezier(.22,.61,.36,1) forwards',
  },
  iosHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' },
  iosTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '22px', fontWeight: 400, margin: 0, letterSpacing: '-.3px' },
  iosClose: {
    background: 'rgba(15,26,13,.06)', border: 'none', cursor: 'pointer',
    width: '32px', height: '32px', borderRadius: '50%', fontSize: '20px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(15,26,13,.55)',
  },
  iosStep: { display: 'flex', gap: '14px', padding: '12px 0', borderTop: '1px solid rgba(0,76,63,.08)' },
  iosStepNum: {
    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
    background: '#004C3F', color: '#FFD56B', fontSize: '13px', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  iosStepText: { fontSize: '14px', lineHeight: 1.55, paddingTop: '3px', flex: 1, color: '#0F1A0D' },
  iosStrong: { color: '#004C3F', fontWeight: 600 },
  iosHint: {
    marginTop: '8px', fontSize: '12.5px', color: 'rgba(15,26,13,.55)',
    background: 'rgba(0,76,63,.05)', borderRadius: '8px', padding: '8px 10px',
  },
  pictogram: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '24px', height: '24px', verticalAlign: 'middle', margin: '0 2px',
    background: 'rgba(0,76,63,.08)', borderRadius: '6px', color: '#004C3F',
  },
  iosArrow: {
    display: 'block', textAlign: 'center', fontSize: '26px',
    color: 'rgba(0,76,63,.4)', margin: '14px 0 6px',
    animation: 'jm-ios-bounce 1.4s infinite',
  },
}
