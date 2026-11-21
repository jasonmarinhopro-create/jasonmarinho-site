'use client'

// Prend la copie de la page d'arrivée (lib/launch-snapshot.ts) : 2,5 s après
// son affichage complet (plus de squelette), puis à chaque sortie de l'app
// (onglet caché, app mise en arrière-plan), au plus toutes les 20 s.
// Page d'arrivée : la première page affichée après une ouverture de l'app
// (cookie jm-launch), par mode (hôte ou pro / admin).
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { buildSnapshot, snapHome, snapMode, SNAP_HOME_PREFIX, SNAP_PREFIX } from '@/lib/launch-snapshot'

// Squelettes encore à l'écran (page entière ou carte d'une section)
const BUSY = '[data-page-skel], [aria-busy="true"]'
// Rien d'interactif ni de passager dans la copie
const STRIP = '.jm-splash, script, noscript, iframe, video, audio, [data-snap-skip], [role="dialog"], [aria-modal="true"]'

export default function LaunchSnapshotRecorder({ userId, launch }: { userId: string; launch: boolean }) {
  const pathname = usePathname()
  const first = useRef(true)

  useEffect(() => {
    let ls: Storage
    try { ls = window.localStorage } catch { return }
    const mode = snapMode(document.cookie)
    if (launch && first.current) {
      try { ls.setItem(SNAP_HOME_PREFIX + mode, pathname) } catch { /* ignore */ }
    }
    first.current = false
    if (pathname !== snapHome(ls, mode)) return

    let last = 0
    const take = () => {
      if (Date.now() - last < 20_000) return true
      if (snapMode(document.cookie) !== mode) return true
      const root = document.querySelector('.dash-layout')
      const main = root?.querySelector('.dash-main')
      // Page pas encore remplie (squelette de page ou carte encore en
      // chargement, aria-busy) : pas de copie, sinon elle garde des cases
      // vides (Vue d'ensemble admin, 21/11/2026)
      if (!root || !main || main.querySelector(BUSY)) return false
      const clone = root.cloneNode(true) as HTMLElement
      clone.querySelectorAll(STRIP).forEach(n => n.remove())
      clone.querySelectorAll('.dash-sidebar.open').forEach(n => n.classList.remove('open'))
      const snap = buildSnapshot(userId, pathname, window.innerWidth, Date.now(), clone.outerHTML)
      if (!snap) return true
      try { ls.setItem(SNAP_PREFIX + mode, JSON.stringify(snap)); last = Date.now() } catch { /* stockage plein ou bloqué */ }
      return true
    }
    // Première copie dès que la page est complète : essai à 2,5 s puis toutes
    // les 2 s pendant 30 s au plus (les cartes arrivent les unes après les autres)
    let tries = 0
    let timer = 0
    const attempt = () => { if (take() === false && ++tries < 15) timer = window.setTimeout(attempt, 2000) }
    timer = window.setTimeout(attempt, 2500)
    const onHide = () => { if (document.visibilityState === 'hidden') take() }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', take)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', take)
    }
  }, [pathname, userId, launch])

  return null
}
