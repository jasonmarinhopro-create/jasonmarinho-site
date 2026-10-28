// Diagnostic d'un lien court jasonmarinho.com/l/<code> dans plusieurs navigateurs
// (28/10/2026, « le lien ne marche pas sur téléphone »). Journal : temps et codes seulement.
import { chromium, webkit, firefox, devices } from 'playwright'
const URL = process.argv[2] || 'https://jasonmarinho.com/l/mp-photo-instagram'
const IG = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 345.0.0.32.97 (iPhone14,5; iOS 17_5; fr_FR; fr; scale=3.00; 1170x2532; 634108168)'
const IG_ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.6668.100 Mobile Safari/537.36 Instagram 345.0.0.48.95 Android (34/14; 480dpi; 1080x2340; samsung; SM-S918B; dm3q; qcom; fr_FR; 634108329)'
const CASES = [
  ['Safari iPhone', webkit, devices['iPhone 13']],
  ['Instagram iPhone', webkit, { ...devices['iPhone 13'], userAgent: IG }],
  ['Chrome Android', chromium, devices['Pixel 7']],
  ['Instagram Android', chromium, { ...devices['Pixel 7'], userAgent: IG_ANDROID }],
  ['Firefox ordinateur', firefox, { viewport: { width: 1280, height: 800 } }],
  ['Chrome ordinateur', chromium, { viewport: { width: 1280, height: 800 } }],
]
for (const [label, type, ctxOpts] of CASES) {
  for (const essai of [1, 2]) {
    const b = await type.launch()
    const ctx = await b.newContext({ ...ctxOpts })
    const p = await ctx.newPage()
    const hops = []
    p.on('response', r => { if (r.request().isNavigationRequest()) hops.push(`${r.status()} ${new URL(r.url()).host}${new URL(r.url()).pathname}`) })
    const t0 = Date.now()
    let err = ''
    try { await p.goto(URL, { waitUntil: 'load', timeout: 45000 }) } catch (e) { err = e.message.split('\n')[0].slice(0, 120) }
    const tLoad = Date.now() - t0
    const final = p.url()
    const lcp = await p.evaluate(() => new Promise(r => { let v = 0; try { new PerformanceObserver(l => { for (const e of l.getEntries()) v = e.startTime }).observe({ type: 'largest-contentful-paint', buffered: true }) } catch {} setTimeout(() => r(Math.round(v)), 500) })).catch(() => 0)
    const nav = await p.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return n ? { ttfb: Math.round(n.responseStart), dom: Math.round(n.domContentLoadedEventEnd), redirect: Math.round(n.redirectEnd - n.redirectStart) } : null }).catch(() => null)
    const titre = await p.title().catch(() => '')
    console.log(`${err ? 'KO' : 'OK'} | ${label} essai ${essai} | chargé en ${tLoad} ms | ttfb page ${nav?.ttfb ?? '?'} ms | LCP ${lcp} ms | arrivée ${new URL(final).pathname} | « ${titre.slice(0, 50)} » | ${hops.join(' -> ')}${err ? ' | ' + err : ''}`)
    await b.close()
  }
}
