'use client'

import { useEffect } from 'react'
import { setDashboardTitle } from '@/lib/dashboard-title-store'

// Composant invisible à insérer dans les pages avec un titre dynamique
// (voyageur, logement, formation [slug]…). Met à jour le Header sans re-mount.
export default function TitleSetter({ title }: { title: string }) {
  useEffect(() => {
    setDashboardTitle(title)
    return () => setDashboardTitle(null)
  }, [title])
  return null
}
