'use client'

// Copie de la page d'arrivée posée sur l'écran au logo (lib/launch-snapshot.ts).
// Vide s'il n'y a pas de copie valable : l'écran au logo reste visible.
// Deux façons de la remplir :
// - page servie par le serveur : le script en ligne juste après le conteneur
//   la remplit avant le premier affichage (React n'est pas encore là) ;
// - navigation interne (depuis /ouverture) : lue au rendu.
// suppressHydrationWarning : le serveur envoie un conteneur vide, le
// navigateur l'a déjà rempli ; React garde le contenu en place.
import { useState } from 'react'
import { readLaunchSnapshot, SNAP_FILL_INLINE } from '@/lib/launch-snapshot'

function readNow(): string {
  if (typeof window === 'undefined') return ''
  try { return readLaunchSnapshot(document.cookie, window.localStorage, window.innerWidth, Date.now(), window.location.pathname) } catch { return '' }
}

export default function SnapLayer() {
  const [html] = useState(readNow)
  return (
    <>
      <div className="jm-snap" aria-hidden="true" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />
      <script dangerouslySetInnerHTML={{ __html: SNAP_FILL_INLINE }} />
    </>
  )
}
