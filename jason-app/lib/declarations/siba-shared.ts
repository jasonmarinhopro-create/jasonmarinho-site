// Client-safe — constantes SIBA partagées entre le modal (client) et le
// générateur XML (serveur). Ne rien importer de serveur ici.

/** Types de document acceptés par SIBA (Tipo_Documento). */
export const SIBA_DOC_TYPES = [
  { code: 'P', label: 'Passeport' },
  { code: 'B', label: "Carte d'identité" },
  { code: 'O', label: 'Autre document' },
] as const

export type SibaDocType = typeof SIBA_DOC_TYPES[number]['code']

/** Mappe l'id_type de la fiche voyageur (cni/passeport/permis/autre) vers SIBA. */
export function idTypeToDocType(t: string | null | undefined): SibaDocType {
  if (t === 'passeport') return 'P'
  if (t === 'cni') return 'B'
  return t ? 'O' : 'P'
}
