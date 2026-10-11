'use client'

import { useEffect } from 'react'

// Note la visite du membre (dernière visite dans Membres de l'admin) au plus
// toutes les 6 heures par appareil, sans rien afficher.
const KEY = 'jm-last-seen-ping'
const EVERY_MS = 6 * 60 * 60 * 1000

export default function LastSeenPing() {
  useEffect(() => {
    try {
      const last = Number(localStorage.getItem(KEY) || 0)
      if (Date.now() - last < EVERY_MS) return
      localStorage.setItem(KEY, String(Date.now()))
    } catch { /* stockage bloqué : on note quand même */ }
    fetch('/api/me/seen', { method: 'POST', keepalive: true }).catch(() => undefined)
  }, [])
  return null
}
