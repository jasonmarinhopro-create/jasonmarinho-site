// Réserve un appel Google Places avant de le faire (06/10/2026) : compteur
// mensuel en base (migration 124, google_places_take). Refus par défaut :
// sans compteur lisible, aucun appel n'est fait, pour ne jamais payer.
import 'server-only'
import { getServiceClient } from '@/lib/supabase/service'
import { PLACES_BUDGET, PLACES_BUDGET_MESSAGE, placesMonth, type PlacesSku } from './places-budget-rules'

export class PlacesBudgetError extends Error {}

export async function takePlacesCall(sku: PlacesSku): Promise<void> {
  const { data, error } = await getServiceClient().rpc('google_places_take', { p_month: placesMonth(), p_sku: sku, p_limit: PLACES_BUDGET[sku].cap })
  if (error) {
    throw new PlacesBudgetError(/google_places_take|does not exist|PGRST202/.test(`${error.code} ${error.message}`)
      ? "Compteur Google absent : colle la migration 20261006_124_google_places_usage.sql dans Supabase (aucun appel Google n'est fait sans lui)."
      : `Compteur Google indisponible (${error.code ?? 'erreur'}) : aucun appel fait, par prudence.`)
  }
  if (data !== true) throw new PlacesBudgetError(PLACES_BUDGET_MESSAGE)
}

/** Appels du mois par SKU, pour l'état de la prospection et l'admin */
export async function placesUsage(): Promise<{ month: string; items: Array<{ sku: PlacesSku; label: string; used: number; cap: number; free: number }>; error: string | null }> {
  const month = placesMonth()
  const { data, error } = await getServiceClient().from('google_places_usage').select('sku, count').eq('month', month)
  const used = new Map((data ?? []).map(r => [r.sku as string, Number(r.count) || 0]))
  return {
    month,
    items: (Object.keys(PLACES_BUDGET) as PlacesSku[]).map(sku => ({ sku, label: PLACES_BUDGET[sku].label, used: used.get(sku) ?? 0, cap: PLACES_BUDGET[sku].cap, free: PLACES_BUDGET[sku].free })),
    error: error ? error.message.slice(0, 120) : null,
  }
}
