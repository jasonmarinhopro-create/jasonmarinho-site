'use client'

import { usePathname } from 'next/navigation'
import VeilleTabBar from '@/components/actualites/VeilleTabBar'

/**
 * Onglets de /dashboard/apprendre/*.
 * 18/11/2026 : le Guide LCD rejoint les Actualités (entrée de menu
 * « Actualités & guide ») et Formations a sa propre entrée. Sur le guide,
 * on affiche donc les onglets Actualités / Guide LCD ; sur les formations,
 * aucun onglet.
 */
export default function ApprendreTabBar() {
  const pathname = usePathname() ?? ''
  if (pathname.startsWith('/dashboard/apprendre/guide')) return <VeilleTabBar />
  return null
}
