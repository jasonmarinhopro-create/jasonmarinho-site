'use client'

// Écran au logo posé par-dessus la page à l'arrivée dans l'app : il reste
// affiché tant que la page montre son squelette, puis s'efface en fondu
// (règles CSS dans ShellFallback). Une fois effacé, il est retiré du
// document : le layout reste monté pendant toute la visite, et sans ce
// retrait le squelette d'une navigation suivante le ferait réapparaître.
import { useEffect, useRef, useState } from 'react'
import ShellFallback from './ShellFallback'

export default function LaunchSplashOut() {
  const [gone, setGone] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (gone) return
    // L'animation a pu finir avant l'hydratation : on regarde aussi l'état réel
    const check = () => {
      const el = ref.current?.firstElementChild
      if (!el || getComputedStyle(el).visibility === 'hidden') setGone(true)
    }
    const t = window.setInterval(check, 400)
    return () => window.clearInterval(t)
  }, [gone])

  if (gone) return null
  return (
    <div ref={ref} style={{ display: 'contents' }} onAnimationEnd={e => {
      if (e.animationName === 'jmVanish' || e.animationName === 'jmHold') setGone(true)
    }}>
      <ShellFallback variant="out" message="Ouverture de ton espace…" />
    </div>
  )
}
