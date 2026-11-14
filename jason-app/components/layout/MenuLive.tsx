'use client'

// Compteurs du menu en différé (14/11/2026, Jason : 9 s pour ouvrir l'app).
// Le layout affichait la barre latérale, l'en-tête ET la page seulement après
// la lecture du menu (cloche, contrats, demandes des pros, parcours) : 6,4 s
// sur 8,6 lors d'un ralenti de la base gratuite. Désormais le cadre et la page
// partent dès le profil lu ; ces compteurs arrivent juste après (Suspense dans
// app/dashboard/layout.tsx) et sont relayés ici à Sidebar et Header.
import { useEffect, useSyncExternalStore } from 'react'
import type { ProNav } from './Sidebar'

export type MenuLiveValue = {
  proNav?: ProNav
  contratsTodo: number
  appNotifUnread: number
  chezNousUnread: number
  showOnboarding: boolean
}

let current: MenuLiveValue | null = null
const listeners = new Set<() => void>()

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

/** Valeur arrivée du serveur, ou null tant qu'elle n'est pas là */
export function useMenuLive(): MenuLiveValue | null {
  return useSyncExternalStore(subscribe, () => current, () => null)
}

/** Posé par le layout une fois les compteurs lus */
export default function MenuLivePush({ value }: { value: MenuLiveValue }) {
  useEffect(() => {
    current = value
    listeners.forEach(fn => fn())
  }, [value])
  return null
}
