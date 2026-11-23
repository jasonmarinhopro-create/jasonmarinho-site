'use client'

import { usePathname } from 'next/navigation'
import { Newspaper, BookOpen } from '@phosphor-icons/react/dist/ssr'
import HubTabBar from '@/components/layout/HubTabBar'

/**
 * Onglets « Actualités » / « Guide LCD » de l'espace hôte (18/11/2026).
 * Jason : le Guide LCD était trop caché et doit évoluer comme les
 * actualités. Les deux vivent sous une seule entrée du menu
 * (« S'informer ») : l'actualité qui change, et les bonnes
 * pratiques qui restent. Les adresses ne changent pas
 * (/dashboard/actualites et /dashboard/apprendre/guide).
 * Modèle des onglets de tout le dashboard (HubTabBar, 23/11/2026).
 */
const TABS = [
  { href: '/dashboard/actualites', match: ['/dashboard/actualites'], label: 'Actualités', hint: 'Ce qui change pour les hôtes', Icon: Newspaper },
  { href: '/dashboard/apprendre/guide', match: ['/dashboard/apprendre/guide', '/dashboard/guide'], label: 'Guide LCD', hint: 'Les bonnes pratiques, fiche par fiche', Icon: BookOpen },
]

export default function VeilleTabBar() {
  const pathname = usePathname() ?? ''
  return (
    <HubTabBar
      label="Actualités et guide"
      tabs={TABS.map(({ match, ...t }) => ({ ...t, active: match.some(m => pathname === m || pathname.startsWith(m + '/')) }))}
    />
  )
}
