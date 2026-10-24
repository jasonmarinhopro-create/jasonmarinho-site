// Clientèles des pros et types d'hébergement des demandes (24/10/2026, Jason :
// « être présent sur les requêtes photographe hôtel, conciergerie haut de
// gamme »). Mêmes clés des deux côtés : un hôtel qui fait une demande est servi
// d'abord par les pros qui ont coché « Hôtels et résidences ».
// Même liste côté site : scripts/lib/pro-clienteles.mjs (test de synchro).

export const CLIENTELES = [
  { key: 'lcd', pro: 'Locations courte durée', demande: 'Logement Airbnb, Booking ou Abritel', icon: 'house-line' },
  { key: 'hotel', pro: 'Hôtels et résidences', demande: 'Hôtel ou résidence', icon: 'buildings' },
  { key: 'conciergerie', pro: 'Conciergeries haut de gamme', demande: 'Conciergerie (plusieurs logements)', icon: 'key' },
  { key: 'gite', pro: 'Gîtes et chambres d’hôtes', demande: 'Gîte ou chambre d’hôtes', icon: 'tree' },
] as const

export type Clientele = typeof CLIENTELES[number]['key']
export const CLIENTELE_KEYS = CLIENTELES.map(c => c.key) as readonly Clientele[]

export function readClienteles(raw: unknown): Clientele[] {
  const list = Array.isArray(raw) ? raw : []
  return CLIENTELE_KEYS.filter(k => list.includes(k))
}

export function readEtablissement(raw: unknown): Clientele | null {
  return typeof raw === 'string' && (CLIENTELE_KEYS as readonly string[]).includes(raw) ? raw as Clientele : null
}

export const clienteleLabel = (k: string | null | undefined) => CLIENTELES.find(c => c.key === k)?.pro ?? ''
export const etablissementLabel = (k: string | null | undefined) => CLIENTELES.find(c => c.key === k)?.demande ?? ''
