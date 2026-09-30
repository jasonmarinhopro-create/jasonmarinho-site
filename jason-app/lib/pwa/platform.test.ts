import { describe, it, expect } from 'vitest'
import { detectInstallPlatform, iosNeedsSafari, androidNeedsBrowser } from './platform'

const UA = {
  iphoneSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0.6668.46 Mobile/15E148 Safari/604.1',
  iphoneFacebook: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22F76 [FBAN/FBIOS;FBAV/480.0.0.40.108;FBBV/123]',
  iphoneInstagram: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0.0',
  ipadDesktopMode: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
  androidChrome: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
  androidSamsung: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
  androidFirefox: 'Mozilla/5.0 (Android 14; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0',
  androidWebview: 'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.0.0 Mobile Safari/537.36',
  macChrome: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  winEdge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
}

describe('detectInstallPlatform', () => {
  it('iPhone', () => {
    expect(detectInstallPlatform(UA.iphoneSafari)).toEqual({ os: 'ios', browser: 'safari', inAppName: null })
    expect(detectInstallPlatform(UA.iphoneChrome).browser).toBe('chrome')
    expect(detectInstallPlatform(UA.iphoneFacebook)).toEqual({ os: 'ios', browser: 'inapp', inAppName: 'Facebook' })
    expect(detectInstallPlatform(UA.iphoneInstagram).inAppName).toBe('Instagram')
  })
  it('iPad en mode ordinateur (écran tactile)', () => {
    expect(detectInstallPlatform(UA.ipadDesktopMode, 5).os).toBe('ios')
    expect(detectInstallPlatform(UA.macSafari, 0)).toEqual({ os: 'desktop', browser: 'safari', inAppName: null })
  })
  it('Android', () => {
    expect(detectInstallPlatform(UA.androidChrome)).toEqual({ os: 'android', browser: 'chrome', inAppName: null })
    expect(detectInstallPlatform(UA.androidSamsung).browser).toBe('samsung')
    expect(detectInstallPlatform(UA.androidFirefox).browser).toBe('firefox')
    expect(detectInstallPlatform(UA.androidWebview).browser).toBe('inapp')
  })
  it('ordinateur', () => {
    expect(detectInstallPlatform(UA.macChrome)).toEqual({ os: 'desktop', browser: 'chrome', inAppName: null })
    expect(detectInstallPlatform(UA.winEdge).browser).toBe('edge')
  })
  it('navigateur à changer', () => {
    expect(iosNeedsSafari(detectInstallPlatform(UA.iphoneSafari))).toBe(false)
    expect(iosNeedsSafari(detectInstallPlatform(UA.iphoneChrome))).toBe(true)
    expect(iosNeedsSafari(detectInstallPlatform(UA.iphoneFacebook))).toBe(true)
    expect(androidNeedsBrowser(detectInstallPlatform(UA.androidWebview))).toBe(true)
    expect(androidNeedsBrowser(detectInstallPlatform(UA.androidSamsung))).toBe(false)
  })
})
