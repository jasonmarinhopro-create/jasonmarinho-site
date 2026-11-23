'use client'

import { usePathname } from 'next/navigation'
import { FacebookLogo, GoogleLogo } from '@phosphor-icons/react/dist/ssr'
import HubTabBar from '@/components/layout/HubTabBar'

// Hub « Trouver des voyageurs » (sept. 2026) : les leviers pour remplir le
// calendrier en direct, sans commission. Avant, les groupes Facebook étaient
// rangés dans « Entre Hôtes » (communauté d'hôtes) et l'audit Google dans
// « Outils & calculs », alors que les deux servent à attirer des voyageurs.
// Style commun des onglets (HubTabBar, 23/11/2026).
export default function VisibiliteTabBar() {
  const pathname = usePathname() ?? ''
  const on = (href: string) => pathname === href || pathname.startsWith(href + '/')
  return (
    <HubTabBar
      label="Onglets Trouver des voyageurs"
      tabs={[
        { href: '/dashboard/visibilite/facebook', label: 'Groupes Facebook', hint: 'Publier là où les voyageurs cherchent', Icon: FacebookLogo, active: on('/dashboard/visibilite/facebook') },
        { href: '/dashboard/visibilite/google', label: 'Fiche Google', hint: 'Être trouvé sur Google et Maps', Icon: GoogleLogo, active: on('/dashboard/visibilite/google') },
      ]}
    />
  )
}
