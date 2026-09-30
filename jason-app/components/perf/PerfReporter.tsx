'use client'

// Chronomètre côté téléphone (30/09/2026, Jason : « 10 s de page blanche à
// l'ouverture », « 8 s pour passer en mode admin »). Enregistre, au-delà de
// 3 s, l'ouverture de l'app (premier octet reçu, page affichée, page
// utilisable) et chaque changement de page (du toucher à l'affichage).
// Envoyé à /api/errors (route « perf ») : visible dans « Erreurs de l'app »
// de l'admin et lu par le workflow « Lenteurs ». Chemins et durées seulement.
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { slowMessage } from '@/lib/perf/format'

const SLOW_MS = 3000
let sent = 0

function send(message: string, path: string) {
  if (sent >= 5) return
  sent++
  try {
    const body = JSON.stringify({ message, route: 'perf', path })
    if (navigator.sendBeacon) navigator.sendBeacon('/api/errors', new Blob([body], { type: 'application/json' }))
    else void fetch('/api/errors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
  } catch { /* jamais bloquant */ }
}

function appMode(): string {
  try { return window.matchMedia('(display-mode: standalone)').matches ? 'app installée' : 'navigateur' } catch { return 'navigateur' }
}

export default function PerfReporter() {
  const pathname = usePathname()
  const lastTap = useRef<{ at: number; from: string } | null>(null)
  const first = useRef(true)

  // Ouverture : mesurée une fois, au montage (page déjà hydratée)
  useEffect(() => {
    const readyAt = performance.now()
    if (document.visibilityState !== 'visible') return
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (readyAt < SLOW_MS) return
    const steps: Array<[string, number]> = []
    if (nav) {
      steps.push(['premier octet', nav.responseStart])
      steps.push(['page affichée', nav.domContentLoadedEventEnd])
    }
    steps.push(['utilisable', readyAt])
    send(slowMessage(`Ouverture lente (${appMode()})`, location.pathname, readyAt, steps), location.pathname)
  }, [])

  // Toucher ou clic : point de départ d'un changement de page
  useEffect(() => {
    const onTap = () => { lastTap.current = { at: performance.now(), from: location.pathname } }
    document.addEventListener('click', onTap, true)
    return () => document.removeEventListener('click', onTap, true)
  }, [])

  // Nouvelle page affichée : durée depuis le dernier toucher
  useEffect(() => {
    if (first.current) { first.current = false; return }
    const tap = lastTap.current
    lastTap.current = null
    if (!tap || document.visibilityState !== 'visible') return
    requestAnimationFrame(() => {
      const ms = performance.now() - tap.at
      if (ms < SLOW_MS || ms > 60_000) return
      send(slowMessage('Navigation lente', `${tap.from} -> ${pathname}`, ms, []), pathname)
    })
  }, [pathname])

  return null
}
