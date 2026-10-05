'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { markStepIfNotYet } from '@/lib/onboarding/client'
import { canPromptInstall, promptInstall, onInstallChange } from '@/lib/pwa/install-client'

/* Install widget pour le dashboard.
   Version React du widget vanilla qui était sur le site marketing.
   Différences :
   - Détection plus stricte du standalone (skip auto + marque l'onboarding done).
   - Marque la step 'install_app' via markStepIfNotYet quand on détecte
     une installation réussie (event 'appinstalled' OU standalone détecté).
   - Délai d'apparition plus long (8s) pour ne pas casser le first paint
     du dashboard chargé.
   - 30/09/2026 : le bouton ouvre la fenêtre d'installation du navigateur
     quand il en propose une (Android, Chrome, Edge), sinon la page guidée
     /installer (étapes iPhone illustrées, QR code depuis un ordinateur). */

const STORAGE_KEY = 'jm-install-widget'
const DISMISS_DAYS = 7

export default function InstallAppWidget() {
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Skip si déjà installé (standalone)
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true

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

    // Quand l'app est effectivement installée (événement relayé par le
    // script du layout racine, qui garde aussi la proposition d'installation)
    const off = onInstallChange(() => {
      if (!window.__jmInstalled) return
      try { localStorage.setItem(STORAGE_KEY, String(Date.now() + 365 * 86400 * 1000)) } catch {}
      void markStepIfNotYet('install_app')
      setVisible(false)
    })

    // Affichage après un délai (immédiat si ?install=1)
    const timer = setTimeout(() => setVisible(true), forceShow ? 0 : 8000)

    return () => {
      clearTimeout(timer)
      off()
    }
  }, [])

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch {}
    setVisible(false)
  }

  async function handleInstallClick() {
    // Android, Chrome, Edge : la fenêtre d'installation du navigateur, en un tap
    if (canPromptInstall()) {
      const outcome = await promptInstall()
      if (outcome === 'accepted') { void markStepIfNotYet('install_app'); setVisible(false) }
      if (outcome !== 'unavailable') return
    }
    // Ailleurs (iPhone, Firefox…) : la page guidée, adaptée à l'appareil
    router.push('/installer')
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
        [data-theme=dark] .jm-iw-root {
          background: #0F1A0D; color: #F0F4FF;
          border-color: rgba(255,213,107,.18);
          box-shadow: 0 12px 32px rgba(0,0,0,.5);
        }
        .jm-iw-desc { color: rgba(15,26,13,.66); }
        [data-theme=dark] .jm-iw-desc { color: rgba(240,244,255,.62); }
        .jm-iw-close { color: rgba(15,26,13,.4); }
        [data-theme=dark] .jm-iw-close { color: rgba(240,244,255,.4); }
        .jm-iw-close:hover { background: rgba(15,26,13,.06); color: rgba(15,26,13,.7); }
        [data-theme=dark] .jm-iw-close:hover { background: rgba(255,255,255,.08); color: rgba(240,244,255,.7); }
        @media (max-width: 480px) {
          .jm-iw-root { right: 8px; bottom: 8px; left: 8px; width: auto; }
        }
      `}</style>

      <div className="jm-iw-root" role="dialog" aria-label="Installer l'app">
        <div style={s.head}>
          <div style={s.icon}>
            {/* eslint-disable-next-line @next/next/no-img-element -- icône locale 36 px */}
            <img src="/icon-192.png" alt="" width={36} height={36} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={s.title}>Garde Jason à portée de tap</p>
            <p className="jm-iw-desc" style={s.desc}>Installe ton espace comme une app pour le retrouver en un tap sur ton écran d&apos;accueil.</p>
          </div>
          <button onClick={dismiss} className="jm-iw-close" style={s.close} aria-label="Fermer">×</button>
        </div>
        <button onClick={handleInstallClick} style={s.cta}>
          Installer l&apos;app
        </button>
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

}
