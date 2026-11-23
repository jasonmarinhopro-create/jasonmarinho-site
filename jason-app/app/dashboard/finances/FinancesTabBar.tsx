'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { ChartBar, ListBullets, ChartLineUp, Scales } from '@phosphor-icons/react/dist/ssr'
import HubTabBar from '@/components/layout/HubTabBar'

/**
 * Onglets de /dashboard/finances/*. La période (?periode=) suit l'utilisateur
 * entre Revenus, Journal et Performances. Style commun (HubTabBar, 23/11/2026).
 */
const TABS = [
  { href: '/dashboard/finances/revenus',      label: 'Revenus',      hint: 'Ce que tes séjours rapportent', Icon: ChartBar,    periode: true },
  { href: '/dashboard/finances/journal',      label: 'Journal',      hint: 'Recettes et dépenses',          Icon: ListBullets, periode: true },
  { href: '/dashboard/finances/performances', label: 'Performances', hint: 'Occupation, prix, canaux',      Icon: ChartLineUp, periode: true },
  { href: '/dashboard/finances/fiscalite',    label: 'Fiscalité',    hint: 'Ton régime et tes impôts',      Icon: Scales,      periode: false },
]

export default function FinancesTabBar() {
  const pathname = usePathname() ?? ''
  const periode = useSearchParams()?.get('periode')
  return (
    <HubTabBar
      label="Onglets Mes finances"
      tabs={TABS.map(({ href, periode: keep, ...t }) => ({
        ...t,
        href: keep && periode ? `${href}?periode=${periode}` : href,
        prefetch: false,
        active: pathname === href || pathname.startsWith(href + '/'),
      }))}
    />
  )
}
