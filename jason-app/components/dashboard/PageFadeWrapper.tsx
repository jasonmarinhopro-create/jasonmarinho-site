'use client'

import { usePathname } from 'next/navigation'

// Wrapper qui force un fade-in subtil à chaque navigation dans le dashboard.
// On utilise le pathname comme key : à chaque changement de route, React
// remount le wrapper et l'animation CSS .anim-fade-in re-trigger.
//
// Combiné avec les loading.tsx (skeleton) :
//   1. Skeleton apparaît instantanément (pas de blank)
//   2. Au moment du switch skeleton → contenu réel, le contenu fade-in 200ms
// → sensation d'app native fluide
export default function PageFadeWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="anim-fade-in" style={{ width: '100%', minHeight: '100%' }}>
      {children}
    </div>
  )
}
