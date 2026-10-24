// Clientèles des pros et types d'hébergement des demandes (24/10/2026).
// Même liste que jason-app/lib/pros/clienteles.ts (test de synchro).
// Icônes écrites en entier pour le découpage des polices :
// ph-house-line ph-buildings ph-key ph-tree

export const CLIENTELES = [
  { key: 'lcd', pro: 'Locations courte durée', demande: 'Logement Airbnb, Booking ou Abritel', icon: 'house-line' },
  { key: 'hotel', pro: 'Hôtels et résidences', demande: 'Hôtel ou résidence', icon: 'buildings' },
  { key: 'conciergerie', pro: 'Conciergeries haut de gamme', demande: 'Conciergerie (plusieurs logements)', icon: 'key' },
  { key: 'gite', pro: 'Gîtes et chambres d’hôtes', demande: 'Gîte ou chambre d’hôtes', icon: 'tree' },
]

export function readClienteles(raw) {
  const list = Array.isArray(raw) ? raw : []
  return CLIENTELES.map(c => c.key).filter(k => list.includes(k))
}
