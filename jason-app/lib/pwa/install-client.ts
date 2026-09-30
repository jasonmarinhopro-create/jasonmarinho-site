'use client'

// Installation de l'app (navigateur seulement). La proposition d'installation
// de Chrome / Edge / Samsung (« beforeinstallprompt ») arrive souvent avant
// que React soit prêt : un petit script du layout racine la met de côté dans
// window.__jmInstallEvt et prévient par l'événement « jm-install-available ».

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    __jmInstallEvt?: BeforeInstallPromptEvent | null
    __jmInstalled?: boolean
  }
}

export function canPromptInstall(): boolean {
  return typeof window !== 'undefined' && !!window.__jmInstallEvt
}

export function isAppStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

/** Ouvre la fenêtre d'installation du navigateur, quand il en propose une */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const evt = typeof window !== 'undefined' ? window.__jmInstallEvt : null
  if (!evt) return 'unavailable'
  try {
    await evt.prompt()
    const { outcome } = await evt.userChoice
    // Une proposition ne sert qu'une fois
    window.__jmInstallEvt = null
    return outcome
  } catch {
    return 'unavailable'
  }
}

/** Réagit quand une proposition d'installation arrive, ou quand l'app vient d'être installée */
export function onInstallChange(cb: () => void): () => void {
  window.addEventListener('jm-install-available', cb)
  window.addEventListener('jm-app-installed', cb)
  return () => {
    window.removeEventListener('jm-install-available', cb)
    window.removeEventListener('jm-app-installed', cb)
  }
}
