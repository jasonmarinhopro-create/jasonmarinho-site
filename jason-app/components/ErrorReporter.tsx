'use client'

// Écoute les exceptions JS non gérées et les promesses rejetées (ex : un
// clic qui plante sans passer par un écran d'erreur) et les remonte dans
// app_errors via /api/errors. Rien à l'écran.
import { useEffect } from 'react'
import { reportClientError } from '@/lib/errors/client-report'

export default function ErrorReporter() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      // Scripts d'autres domaines (extensions, tiers) : ignorés.
      if (e.filename && !e.filename.startsWith(window.location.origin)) return
      reportClientError(e.error ?? e.message)
    }
    const onRejection = (e: PromiseRejectionEvent) => reportClientError(e.reason)
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])
  return null
}
