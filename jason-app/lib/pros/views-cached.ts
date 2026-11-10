// « Vues du mois » de l'espace pro gardées 10 min (10/11/2026) : la page
// principale des fiches lisait la fiche, puis ses vues, l'une après l'autre,
// à chaque ouverture (5 à 6 s en médiane sur 14 jours). Les vues bougent
// au rythme des visiteurs du site, 10 min de décalage ne changent rien.
// Appelé après vérification de l'accès (propriétaire de la fiche ou admin).
import 'server-only'
import { unstable_cache } from 'next/cache'
import { getServiceClient } from '@/lib/supabase/service'
import { getViewsTrend, type ViewsTrend } from './views'
import type { ProKind } from './metiers'

export function getViewsTrendCached(kind: ProKind, proId: string): Promise<ViewsTrend> {
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' })
  return unstable_cache(
    async () => {
      const t = await getViewsTrend(getServiceClient(), kind, proId)
      // Table absente ou erreur : pas gardé
      if (!t.available) throw new Error('vues indisponibles')
      return t
    },
    ['pro-views-trend-v1', kind, proId, today],
    { revalidate: 600, tags: [`pro-views:${proId}`] },
  )().catch(() => getViewsTrend(getServiceClient(), kind, proId))
}
