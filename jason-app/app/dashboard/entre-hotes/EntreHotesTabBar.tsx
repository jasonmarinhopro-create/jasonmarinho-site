'use client'

import { usePathname } from 'next/navigation'
import { ChatsCircle, Handshake } from '@phosphor-icons/react/dist/ssr'
import HubTabBar from '@/components/layout/HubTabBar'

/**
 * Barre d'onglets pour /dashboard/entre-hotes/*.
 * Les sous-routes du forum (/chez-nous/[postId], /chez-nous/membre/[id], etc.)
 * restent à leur URL d'origine : la barre n'est visible que sur la home
 * du forum (/entre-hotes/forum), pas sur les vues détail.
 * 18/11/2026 : l'entrée du menu s'appelle « Partenaires » et ouvre cet
 * onglet en premier ; Questions & réponses passe en second.
 * Style commun des onglets (HubTabBar, 23/11/2026).
 */
export default function EntreHotesTabBar() {
  const pathname = usePathname() ?? ''
  const on = (href: string) => pathname === href || pathname.startsWith(href + '/')
  return (
    <HubTabBar
      label="Onglets Partenaires"
      tabs={[
        { href: '/dashboard/entre-hotes/ecosysteme', label: 'Partenaires & outils', hint: 'Outils et offres pour les hôtes', Icon: Handshake, active: on('/dashboard/entre-hotes/ecosysteme') },
        { href: '/dashboard/entre-hotes/forum', label: 'Questions & réponses', hint: "L'entraide entre hôtes", Icon: ChatsCircle, active: on('/dashboard/entre-hotes/forum') },
      ]}
    />
  )
}
