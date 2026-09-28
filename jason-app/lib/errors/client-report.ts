// Remontée des erreurs navigateur vers /api/errors (table app_errors).
// Best-effort : ne doit JAMAIS faire planter la page elle-même.
// Plafonné à 5 envois par chargement de page et dédupliqué par message pour
// éviter qu'une boucle de rendu n'inonde la table.

const sent = new Set<string>()
let count = 0

// Bruit connu sans valeur (extensions, redimensionnement, scripts tiers).
const IGNORE = [/ResizeObserver loop/i, /^Script error\.?$/i, /chrome-extension:|moz-extension:/i, /NEXT_REDIRECT/, /NEXT_NOT_FOUND/]

// Coupure réseau (Chrome, Safari, Firefox) : sans intérêt quand le navigateur
// est hors ligne ou l'onglet en arrière-plan (mobile en veille, changement
// d'app), cas de loin le plus fréquent. Remontée seulement onglet visible et en ligne.
const NETWORK = /^(TypeError: )?(Failed to fetch|Load failed|NetworkError when attempting to fetch resource\.?)$/i
function isBenignNetworkError(message: string): boolean {
  if (!NETWORK.test(message)) return false
  return navigator.onLine === false || document.visibilityState === 'hidden'
}

export function reportClientError(err: unknown, extra?: { digest?: string; route?: string }) {
  try {
    if (typeof window === 'undefined') return
    const e = err as { message?: string; stack?: string; digest?: string } | null
    const message = String(e?.message ?? err ?? 'Erreur inconnue').slice(0, 500)
    if (!message || IGNORE.some(r => r.test(message) || r.test(e?.stack ?? ''))) return
    if (isBenignNetworkError(message)) return
    const key = message + (extra?.digest ?? e?.digest ?? '')
    if (sent.has(key) || count >= 5) return
    sent.add(key); count++
    const body = JSON.stringify({
      message,
      stack: (e?.stack ?? '').slice(0, 4000),
      digest: extra?.digest ?? e?.digest ?? null,
      path: window.location.pathname,
      route: extra?.route ?? null,
    })
    const blob = new Blob([body], { type: 'application/json' })
    if (!navigator.sendBeacon?.('/api/errors', blob)) {
      fetch('/api/errors', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {})
    }
  } catch { /* jamais bloquant */ }
}
