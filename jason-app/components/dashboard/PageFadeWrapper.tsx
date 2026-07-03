'use client'

// Passthrough. Historique : ce wrapper faisait un fadeIn 200ms puis 80ms
// pour lisser la transition skeleton→contenu. Meme a 80ms, l'opacity 0→1
// creait un flash visible ("clignote" reporte sur /reservations, /revenus).
// La transition Suspense → real content est deja assez fluide sans anim.
// On garde le wrapper (avec key pathname) pour un unmount propre lors des
// nav, mais sans animation.
import { usePathname } from 'next/navigation'

export default function PageFadeWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} style={{ width: '100%', minHeight: '100%' }}>
      {children}
    </div>
  )
}
