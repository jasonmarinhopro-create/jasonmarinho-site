'use client'

// Enregistrement automatique de l'atelier de Ma fiche (27/10/2026) : chaque
// changement part en brouillon après un court silence (pas de bouton
// Enregistrer). Serveur indisponible (réseau coupé, migration 167 absente) :
// le brouillon est gardé dans le navigateur et repris au retour.
import { useEffect, useRef, useState } from 'react'
import { DRAFT_VERSION, readDraft, type DraftEnvelope, type DraftTouched } from '@/lib/pros/fiche-draft'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'local' | 'error'
type SaveFn = (draft: unknown) => Promise<{ ok?: boolean; reason?: string; error?: string }>

const DELAY_MS = 800

function storageGet(key: string): unknown {
  try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : null } catch { return null }
}
function storageSet(key: string, value: unknown) {
  try { if (value === null) window.localStorage.removeItem(key); else window.localStorage.setItem(key, JSON.stringify(value)) } catch { /* navigation privée */ }
}

/** Brouillon gardé dans ce navigateur (lu après l'affichage, jamais au rendu serveur) */
export function readLocalDraft<S>(key: string): DraftEnvelope<S> | null {
  return readDraft<S>(storageGet(key))
}

export function useFicheDraft<S>({ state, touched, hasChanges, save, storageKey }: {
  state: S
  touched: DraftTouched
  /** Quelque chose diffère de la fiche publique */
  hasChanges: boolean
  save: SaveFn
  storageKey: string
}) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const key = JSON.stringify([state, touched, hasChanges])
  // Rien n'a bougé depuis l'affichage (ou depuis le dernier envoi) : rien à envoyer
  const lastKey = useRef(key)
  const latest = useRef({ state, touched, hasChanges })
  latest.current = { state, touched, hasChanges }

  useEffect(() => {
    if (key === lastKey.current) return
    lastKey.current = key
    setStatus('saving')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      timer.current = null
      const cur = latest.current
      const env: DraftEnvelope<S> | null = cur.hasChanges
        ? { v: DRAFT_VERSION, savedAt: new Date().toISOString(), state: cur.state, touched: cur.touched }
        : null
      try {
        const res = await save(env)
        if (res.ok) {
          storageSet(storageKey, null)
          setStatus('saved'); setError(null); setSavedAt(new Date())
          return
        }
        if (res.reason === 'trop_long') { setStatus('error'); setError('Ce texte est trop long pour être gardé : raccourcis-le.'); return }
        storageSet(storageKey, env)
        setStatus('local'); setSavedAt(new Date())
      } catch {
        storageSet(storageKey, env)
        setStatus('local'); setSavedAt(new Date())
      }
    }, DELAY_MS)
    return () => { if (timer.current) clearTimeout(timer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Fermeture de l'onglet pendant l'enregistrement : le navigateur prévient
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (!timer.current) return
      storageSet(storageKey, latest.current.hasChanges
        ? { v: DRAFT_VERSION, savedAt: new Date().toISOString(), state: latest.current.state, touched: latest.current.touched }
        : null)
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onLeave)
    return () => window.removeEventListener('beforeunload', onLeave)
  }, [storageKey])

  return { status, savedAt, error }
}
