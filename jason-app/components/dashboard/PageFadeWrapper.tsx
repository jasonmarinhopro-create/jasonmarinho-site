'use client'

import { usePathname } from 'next/navigation'

// Wrapper qui masque la transition skeleton → contenu reel via un fade-in
// tres court (80ms). Avant : 200ms creait un flash percu comme un
// "double chargement" (skeleton visible → fade lent → contenu). Reduit
// donne une sensation d'app native beaucoup plus reactive.
export default function PageFadeWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} style={{ width: '100%', minHeight: '100%', animation: 'fadeIn 80ms ease-out both' }}>
      {children}
    </div>
  )
}
