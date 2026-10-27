'use server'

// Positions des communes pour la zone de Ma fiche (atelier, étape 2,
// 27/10/2026) : « ces villes sont déjà dans ton rayon », petite carte et test
// « un logement à … ? ». Source : API Découpage administratif de l'État
// (geo.api.gouv.fr, gratuite, sans clé). Appelée côté serveur : le navigateur
// n'a pas à joindre un autre site (politique de sécurité de l'app). Les noms
// des communes ne sont pas des données personnelles.
import { getAuthIdentity } from '@/lib/supabase/auth-user'
import { distanceKm } from '@/lib/pros/zone'

export interface CommunePos { q: string; nom: string; lat: number; lon: number; dep: string }

type ApiCommune = { nom: string; codeDepartement?: string; population?: number; centre?: { coordinates?: [number, number] } }

async function lookup(name: string): Promise<CommunePos[]> {
  const url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(name)}&fields=nom,centre,codeDepartement,population&boost=population&limit=6`
  try {
    // Les communes ne changent pas : réponse gardée une journée
    const res = await fetch(url, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(4000) })
    if (!res.ok) return []
    const rows = (await res.json()) as ApiCommune[]
    return rows
      .filter(r => r.centre?.coordinates?.length === 2)
      .map(r => ({ q: name, nom: r.nom, lon: r.centre!.coordinates![0], lat: r.centre!.coordinates![1], dep: r.codeDepartement ?? '' }))
  } catch {
    return []
  }
}

/**
 * Position de la ville principale (la plus peuplée de ce nom) puis des autres
 * noms (l'homonyme le plus proche de la ville principale, comme la carte des fiches).
 */
export async function locateCommunes(ville: string, names: string[]): Promise<{ ville: CommunePos | null; others: CommunePos[] }> {
  const user = await getAuthIdentity()
  if (!user) return { ville: null, others: [] }
  const clean = (s: string) => String(s ?? '').trim().slice(0, 60)
  const v = clean(ville)
  const list = Array.from(new Set(names.map(clean).filter(Boolean))).slice(0, 12)
  const [main] = await Promise.all([v ? lookup(v) : Promise.resolve([])])
  const center = main[0] ?? null
  const others = await Promise.all(list.map(async n => {
    const found = await lookup(n)
    if (!found.length) return null
    if (!center) return found[0]
    return found.reduce((best, c) => (distanceKm(center, c) < distanceKm(center, best) ? c : best), found[0])
  }))
  return { ville: center ? { ...center, q: v } : null, others: others.filter((x): x is CommunePos => !!x) }
}
