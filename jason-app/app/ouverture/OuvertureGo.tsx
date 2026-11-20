'use client'

// Départ de /ouverture vers le dashboard par la navigation interne de Next
// (lib/launch.ts, 20/11/2026) : même document, l'écran au logo reste affiché
// jusqu'à ce que celui du dashboard prenne le relais, sans page blanche.
// window.__jmGo signale au script de secours (page.tsx) que le départ a eu
// lieu : il ne recharge alors rien.
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { goToApp } from '@/lib/launch'

export default function OuvertureGo() {
  const router = useRouter()
  useEffect(() => {
    const w = window as unknown as { __jmGo?: boolean }
    if (w.__jmGo) return
    w.__jmGo = true
    goToApp(router, window.location.search)
  }, [router])
  return null
}
