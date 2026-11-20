// Page de lancement de l'app installée (manifest start_url, 30/09/2026 :
// « l'écran blanc est toujours présent »). Statique, servie tout de suite par
// le CDN sans passer par le middleware ni la base : l'écran de chargement
// s'affiche avant toute vérification de session, puis la page part vers
// le dashboard.
//
// 20/11/2026 (Jason : « le logo, une seconde la page devient blanche, le logo
// revient ») : le départ était un rechargement complet (location.replace),
// d'où le blanc entre les deux documents. Il passe maintenant par la
// navigation interne de Next (OuvertureGo) : un seul document, l'écran au
// logo reste à l'écran jusqu'à celui du dashboard.
import type { Metadata } from 'next'
import ShellFallback from '@/components/layout/ShellFallback'
import OuvertureGo from './OuvertureGo'
import { LAUNCH_MESSAGE } from '@/components/layout/launch-message'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Jason Marinho',
  robots: { index: false, follow: false },
}

// Secours : si le JavaScript de Next n'a pas pris la main au bout de 5 s
// (réseau très lent, script bloqué), rechargement complet comme avant.
const FALLBACK = `setTimeout(function(){if(window.__jmGo)return;window.__jmGo=true;document.cookie='jm-launch=1; Path=/; Max-Age=20; SameSite=Lax; Secure';location.replace(/(^|; )jm-admin-mode=1(;|$)/.test(document.cookie)?'/dashboard/admin':'/dashboard'+location.search)},5000)`

export default function Ouverture() {
  return (
    <>
      <ShellFallback message={LAUNCH_MESSAGE} />
      <OuvertureGo />
      <script dangerouslySetInnerHTML={{ __html: FALLBACK }} />
    </>
  )
}
