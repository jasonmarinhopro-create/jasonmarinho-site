// Zone des pros dans l'atelier de Ma fiche (étape 2, 27/10/2026) : une ville,
// un rayon et des villes en plus, au lieu de trois champs à écrire à la main.
// Le texte `zone_couverte` garde la forme que lit la carte des fiches
// (scripts/lib/secteur.mjs : « Lyon + 30 km, Villeurbanne, Rhône »). Testé.

export interface ZoneParts { km: number | null; autre: string }

export const RAYONS = [10, 20, 30, 50] as const
export const RAYON_MAX = 150

const KM_RE = /(?:\+|rayon\s+de|à)?\s*(\d{1,3})\s?(?:km|kms|kilom[eè]tres?)\b/i

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()

/** « Paris + 30 kms » → 30 km, rien d'autre ; « Lyon + 30 km, Villeurbanne, Rhône » → 30 km + « Villeurbanne, Rhône » */
export function parseZone(zone: string, ville: string): ZoneParts {
  const raw = (zone || '').trim()
  const m = KM_RE.exec(raw)
  const km = m ? Math.min(RAYON_MAX, Number(m[1])) || null : null
  let rest = m ? raw.replace(m[0], ' ') : raw
  // La ville principale répétée en tête ne compte pas comme « autre zone »
  const parts = rest.split(/[,;\n]|\s\+\s|\s-\s/).map(s => s.replace(/^[\s+\-–]+|[\s+\-–]+$/g, '').trim()).filter(Boolean)
  const v = norm(ville)
  rest = parts.filter(p => norm(p) !== v && !/^(et|autour|environs?|alentours?)$/i.test(p)).join(', ')
  return { km, autre: rest.slice(0, 160) }
}

/** Texte enregistré : « Paris + 30 km, Rhône » (vide s'il n'y a ni rayon ni autre zone) */
export function composeZone(ville: string, km: number | null, autre: string): string {
  const head = km ? `${ville.trim() ? `${ville.trim()} ` : ''}+ ${km} km` : ''
  return [head, autre.trim()].filter(Boolean).join(', ').slice(0, 200)
}

/** Phrase montrée au pro : ce que dira sa fiche */
export function zonePhrase(ville: string, km: number | null, villes: string[], autre: string): string {
  const v = ville.trim()
  if (!v) return 'Indique ta ville principale.'
  let s = km ? `${v} et ${km} km autour` : v
  if (autre.trim()) s += `, ${autre.trim()}`
  if (villes.length) {
    const list = villes.length === 1 ? villes[0] : `${villes.slice(0, -1).join(', ')} et ${villes[villes.length - 1]}`
    s += `, avec ${list}`
  }
  return `${s}.`
}

/** Distance à vol d'oiseau en km */
export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371
  const rad = (x: number) => (x * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Réponse au test « un logement à … ? » (mêmes paliers que la carte des fiches) */
export function zoneVerdict(d: number, km: number | null): 'oui' | 'proche' | 'loin' {
  const r = km ?? 10
  if (d <= r) return 'oui'
  if (d <= r + 15) return 'proche'
  return 'loin'
}
