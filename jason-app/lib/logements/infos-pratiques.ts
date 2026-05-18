// Infos pratiques par logement : source de vérité pour auto-fill des
// gabarits voyageur. Stocké en JSONB sur la table logements (migration
// 048). Format libre côté DB, typé ici pour cohérence UI.
//
// Quand on ajoute un nouveau champ : enrichir InfosPratiques + le mapping
// dans infosPratiquesToFillMap. Aucune migration nécessaire (JSONB).

export interface RestaurantReco {
  nom: string
  type?: string         // "Portugais", "Pizzeria", "Brunch"…
  prix?: string         // "€", "€€", "€€€"
  distance?: string     // "5 min à pied", "2 km"
  note?: string         // libre
}

export interface InfosPratiques {
  // WiFi
  wifi_nom?: string
  wifi_password?: string

  // Accès logement
  acces_code?: string             // code digicode / lockbox
  acces_instructions?: string     // "Entrée porte verte, monter au 2e..."

  // Vie pratique
  poubelles_localisation?: string
  parking_info?: string
  chauffage_climatisation?: string
  electromenager_notes?: string   // "Lave-vaisselle pastilles dans tiroir gauche"

  // Recommandations locales (3 max suffisent)
  restaurants?: RestaurantReco[]
  transports?: string             // "Métro Marquês 5 min, Uber le soir, gare à 1km"
  supermarche?: string

  // Sécurité / urgences
  urgences?: string               // pompiers, mon n° perso, hôpital le plus proche

  // Catch-all
  notes?: string
}

/**
 * Convertit les infos pratiques d'un logement en map de variables
 * `[placeholder] → valeur` pour auto-fill dans les gabarits. Les clés
 * sont en minuscules — le mécanisme d'auto-fill (lib/gabarits/applyAutoFill)
 * matche case-insensitive.
 *
 * On gère plusieurs aliases par champ pour couvrir les variantes utilisées
 * dans les templates communautaires : « [Nom Réseau] », « [Wifi] », « [SSID] »…
 */
export function infosPratiquesToFillMap(infos: InfosPratiques | null | undefined): Record<string, string> {
  if (!infos) return {}
  const out: Record<string, string> = {}

  // WiFi
  if (infos.wifi_nom) {
    out['[nom réseau]']     = infos.wifi_nom
    out['[nom du réseau]']  = infos.wifi_nom
    out['[wifi]']           = infos.wifi_nom
    out['[wifi name]']      = infos.wifi_nom
    out['[network name]']   = infos.wifi_nom
    out['[ssid]']           = infos.wifi_nom
  }
  if (infos.wifi_password) {
    out['[mot de passe]']        = infos.wifi_password
    out['[mot de passe wifi]']   = infos.wifi_password
    out['[password]']            = infos.wifi_password
    out['[wifi password]']       = infos.wifi_password
  }

  // Accès
  if (infos.acces_code) {
    out['[code]']            = infos.acces_code
    out['[code accès]']      = infos.acces_code
    out['[code acces]']      = infos.acces_code
    out['[code porte]']      = infos.acces_code
    out['[door code]']       = infos.acces_code
    out['[access code]']     = infos.acces_code
  }
  if (infos.acces_instructions) {
    out['[instructions courtes]']             = infos.acces_instructions
    out['[instructions accès]']               = infos.acces_instructions
    out['[instructions acces]']               = infos.acces_instructions
    out['[localisation + instructions]']      = infos.acces_instructions
    out['[access instructions]']              = infos.acces_instructions
    out['[check-in instructions]']            = infos.acces_instructions
  }

  // Pratique
  if (infos.poubelles_localisation) {
    out['[localisation des poubelles]']  = infos.poubelles_localisation
    out['[poubelles]']                    = infos.poubelles_localisation
    out['[trash]']                        = infos.poubelles_localisation
    out['[recyclage]']                    = infos.poubelles_localisation
  }
  if (infos.parking_info) {
    out['[parking]']        = infos.parking_info
    out['[stationnement]']  = infos.parking_info
  }
  if (infos.chauffage_climatisation) {
    out['[chauffage]']       = infos.chauffage_climatisation
    out['[climatisation]']   = infos.chauffage_climatisation
    out['[temperature]']     = infos.chauffage_climatisation
  }
  if (infos.electromenager_notes) {
    out['[électroménager]']     = infos.electromenager_notes
    out['[electromenager]']     = infos.electromenager_notes
    out['[appliances]']         = infos.electromenager_notes
  }

  // Recommandations
  const restaurants = infos.restaurants ?? []
  restaurants.forEach((r, idx) => {
    if (!r?.nom) return
    const n = idx + 1
    out[`[restaurant ${n}]`] = r.nom
    out[`[resto ${n}]`]      = r.nom
    if (idx === 0) {
      out['[restaurant]'] = r.nom
      out['[resto]']      = r.nom
    }
    const cuisinePrix = [r.type, r.prix].filter(Boolean).join(' · ')
    if (cuisinePrix) {
      out[`[type cuisine, prix]`] = cuisinePrix
      out[`[type cuisine prix]`]  = cuisinePrix
      out[`[cuisine ${n}]`]       = cuisinePrix
    }
    if (r.distance) out[`[distance ${n}]`] = r.distance
    if (r.note)     out[`[note ${n}]`]     = r.note
  })

  if (infos.transports) {
    out['[transports]']  = infos.transports
    out['[transport]']   = infos.transports
    out['[transport public]'] = infos.transports
  }
  if (infos.supermarche) {
    out['[supermarché]']  = infos.supermarche
    out['[supermarche]']  = infos.supermarche
    out['[supermarket]']  = infos.supermarche
  }

  // Sécurité
  if (infos.urgences) {
    out['[urgences]']        = infos.urgences
    out['[urgence]']         = infos.urgences
    out['[emergency]']       = infos.urgences
    out['[numéro urgence]']  = infos.urgences
  }

  if (infos.notes) {
    out['[notes]']             = infos.notes
    out['[notes additionnelles]'] = infos.notes
  }

  return out
}

/** Compte les champs renseignés (pour afficher "8/12 champs remplis"). */
export function countFilled(infos: InfosPratiques | null | undefined): number {
  if (!infos) return 0
  let n = 0
  const keys: Array<keyof InfosPratiques> = [
    'wifi_nom', 'wifi_password', 'acces_code', 'acces_instructions',
    'poubelles_localisation', 'parking_info', 'chauffage_climatisation',
    'electromenager_notes', 'transports', 'supermarche', 'urgences', 'notes',
  ]
  for (const k of keys) {
    if (typeof infos[k] === 'string' && (infos[k] as string).trim()) n++
  }
  if (infos.restaurants && infos.restaurants.length > 0) {
    n += infos.restaurants.filter(r => r?.nom?.trim()).length
  }
  return n
}
