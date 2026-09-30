'use client'

// État des notifications sur l'appareil utilisé (navigateur seulement).
// Partagé par le réglage de la page Notifications et le bandeau de la cloche.

export type PushDeviceState = 'unsupported' | 'ios-install' | 'ios-old' | 'denied' | 'off' | 'on'

export function isIos(): boolean {
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export async function pushDeviceState(): Promise<PushDeviceState> {
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  if (!supported) return isIos() && !isStandalone() ? 'ios-install' : isIos() ? 'ios-old' : 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  try {
    const reg = await navigator.serviceWorker.getRegistration('/')
    const sub = reg ? await reg.pushManager.getSubscription() : null
    return sub ? 'on' : 'off'
  } catch {
    return 'off'
  }
}
