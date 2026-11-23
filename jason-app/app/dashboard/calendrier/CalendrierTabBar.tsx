'use client'

import { usePathname } from 'next/navigation'
import { CalendarBlank, Broom } from '@phosphor-icons/react/dist/ssr'
import HubTabBar from '@/components/layout/HubTabBar'

// Onglets Calendrier / Ménage (sept. 2026). Le planning ménage était caché
// derrière l'icône balai de la barre d'outils du calendrier : c'est pourtant
// une tâche quotidienne (Hospitable et Superhote en font un écran à part).
// Style commun des onglets (HubTabBar, 23/11/2026).
export default function CalendrierTabBar() {
  const pathname = usePathname() ?? ''
  return (
    <HubTabBar
      label="Onglets Calendrier"
      tabs={[
        { href: '/dashboard/calendrier', label: 'Calendrier', hint: 'Séjours, ménages et rendez-vous', Icon: CalendarBlank, active: pathname === '/dashboard/calendrier' },
        { href: '/dashboard/calendrier/menage', label: 'Ménage', hint: 'Le planning de tes ménages', Icon: Broom, active: pathname.startsWith('/dashboard/calendrier/menage') },
      ]}
    />
  )
}
