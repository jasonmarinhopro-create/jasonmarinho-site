'use client'

import { useEffect, useRef, useState } from 'react'

const PREFIX = 'cn-draft:'
const DEBOUNCE_MS = 600
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14 // 14 jours

type Draft<T> = { v: T; t: number }

function safeRead<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Draft<T>
    if (Date.now() - parsed.t > MAX_AGE_MS) {
      localStorage.removeItem(PREFIX + key)
      return null
    }
    return parsed.v
  } catch {
    return null
  }
}

function safeWrite<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ v: value, t: Date.now() }))
  } catch {
    // quota dépassé ou storage indisponible : on ignore silencieusement
  }
}

function safeClear(key: string) {
  try { localStorage.removeItem(PREFIX + key) } catch {}
}

// Hook léger : auto-save dans localStorage, restaure au montage.
// Retourne (draft initial restauré ou null, clearDraft).
// L'usage : le composant gère son propre useState, hydrate avec le retour,
// puis appelle setDraft(value) à chaque change. clearDraft() après submit.
export function useDraftAutosave<T>(key: string, value: T, opts?: { skipIfEmpty?: (v: T) => boolean }) {
  const [restored, setRestored] = useState<T | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // restauration au montage
  useEffect(() => {
    setRestored(safeRead<T>(key))
    setHydrated(true)
  }, [key])

  // auto-save debounced sur value
  useEffect(() => {
    if (!hydrated) return
    if (opts?.skipIfEmpty?.(value)) {
      safeClear(key)
      return
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => safeWrite(key, value), DEBOUNCE_MS)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [key, value, hydrated, opts])

  return {
    restored,
    hydrated,
    clearDraft: () => safeClear(key),
  }
}
