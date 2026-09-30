// Quel appareil, quel navigateur : décide quelle méthode d'installation de
// l'app montrer (30/09/2026, demande de Jason : « ce n'est pas facile pour
// beaucoup de monde »). Pur, testé : lib/pwa/platform.test.ts.

export type InstallOs = 'ios' | 'android' | 'desktop'
export type InstallBrowser = 'safari' | 'chrome' | 'edge' | 'samsung' | 'firefox' | 'inapp' | 'other'

export interface InstallPlatform {
  os: InstallOs
  browser: InstallBrowser
  /** Nom lisible de l'app qui a ouvert la page (Facebook, Instagram…) */
  inAppName: string | null
}

const IN_APP: Array<[RegExp, string]> = [
  [/FBAN|FBAV|FB_IAB|FBIOS/, 'Facebook'],
  [/Instagram/, 'Instagram'],
  [/LinkedInApp/, 'LinkedIn'],
  [/Snapchat/, 'Snapchat'],
  [/musical_ly|TikTok|BytedanceWebview/, 'TikTok'],
  [/Line\//, 'Line'],
  [/GSA\//, 'Google'],
  [/Twitter/, 'X'],
]

export function detectInstallPlatform(ua: string, maxTouchPoints = 0): InstallPlatform {
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1)
  const android = !ios && /Android/.test(ua)
  const os: InstallOs = ios ? 'ios' : android ? 'android' : 'desktop'

  const inApp = IN_APP.find(([re]) => re.test(ua))
  if (inApp) return { os, browser: 'inapp', inAppName: inApp[1] }
  // Android : vue web intégrée à une autre app (« ; wv) »)
  if (android && /; wv\)/.test(ua)) return { os, browser: 'inapp', inAppName: null }

  let browser: InstallBrowser = 'other'
  if (/SamsungBrowser/.test(ua)) browser = 'samsung'
  else if (/EdgA|EdgiOS|Edg\//.test(ua)) browser = 'edge'
  else if (/Firefox|FxiOS/.test(ua)) browser = 'firefox'
  else if (/CriOS|Chrome\//.test(ua) && !/OPR\/|OPiOS/.test(ua)) browser = 'chrome'
  else if (/Safari\//.test(ua) && /Version\//.test(ua)) browser = 'safari'
  return { os, browser, inAppName: null }
}

/** Sur iPhone, seul Safari installe l'app de façon sûre : sinon, ouvrir la page dans Safari. */
export function iosNeedsSafari(p: InstallPlatform): boolean {
  return p.os === 'ios' && p.browser !== 'safari'
}

/** Sur Android, une app qui a ouvert la page (Facebook, Gmail…) ne sait pas installer. */
export function androidNeedsBrowser(p: InstallPlatform): boolean {
  return p.os === 'android' && p.browser === 'inapp'
}
