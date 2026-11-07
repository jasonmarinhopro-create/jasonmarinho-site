// Page de lancement de l'app installée (manifest start_url, 30/09/2026 :
// « l'écran blanc est toujours présent »). Statique, servie tout de suite par
// le CDN sans passer par le middleware ni la base : l'écran de chargement
// s'affiche avant toute vérification de session, puis la page part vers
// /dashboard. Le navigateur garde cet écran affiché jusqu'à ce que le
// dashboard peigne le sien (même écran), donc plus de blanc entre les deux.
import type { Metadata } from 'next'
import ShellFallback from '@/components/layout/ShellFallback'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Jason Marinho',
  robots: { index: false, follow: false },
}

// Laisse le temps d'afficher l'écran (deux images) avant de partir
// Cookie court « jm-launch » : le dashboard enchaîne alors le même écran sans
// délai puis l'efface en fondu (app/dashboard/layout.tsx).
// Mode admin resté actif : directement vers la Vue d'ensemble (07/11/2026),
// sans le détour /dashboard puis redirection (un chargement de moins).
const GO = `document.cookie='jm-launch=1; Path=/; Max-Age=20; SameSite=Lax; Secure';var t=/(^|; )jm-admin-mode=1(;|$)/.test(document.cookie)?'/dashboard/admin':'/dashboard'+location.search;requestAnimationFrame(function(){setTimeout(function(){location.replace(t)},30)})`

export default function Ouverture() {
  return (
    <>
      <ShellFallback message="Ouverture de ton espace…" />
      <script dangerouslySetInnerHTML={{ __html: GO }} />
    </>
  )
}
