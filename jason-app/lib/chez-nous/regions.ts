/**
 * Map a free-text address to a French region tag.
 * Used in Entre Hôtes to show where the community is located.
 */

// Mots-clés texte (villes/noms de région) — utilisés seulement en repli quand
// aucun code postal n'est détectable dans l'adresse. Les anciens préfixes
// numériques bruts (ex: ' 69', ' 75') ont été retirés : ils matchaient
// n'importe quel nombre à 2 chiffres présent dans l'adresse (numéro de rue,
// d'appartement...), pas seulement un vrai département — cf. detectRegion().
export const REGION_KEYWORDS: Record<string, string[]> = {
  'Île-de-France':   ['paris', 'île-de-france', 'ile-de-france', 'idf'],
  'PACA':            ['paca', 'provence', 'marseille', 'nice', 'aix-en-provence', 'cannes', 'avignon', 'toulon', 'antibes'],
  'Bretagne':        ['bretagne', 'rennes', 'brest', 'quimper', 'lorient', 'vannes', 'saint-malo', 'dinard'],
  'Normandie':       ['normandie', 'rouen', 'caen', 'le havre', 'cherbourg', 'évreux', 'deauville', 'honfleur'],
  'Occitanie':       ['occitanie', 'toulouse', 'montpellier', 'nîmes', 'nimes', 'perpignan', 'narbonne', 'sète'],
  'Hauts-de-France': ['hauts-de-france', 'lille', 'amiens', 'roubaix', 'tourcoing', 'arras', 'calais'],
  'Auvergne-Rhône':  ['auvergne', 'rhône', 'rhone', 'lyon', 'clermont-ferrand', 'clermont', 'vichy', 'grenoble', 'annecy', 'savoie', 'chamonix', 'megève', 'megeve'],
  'Bourgogne-FC':    ['bourgogne', 'franche-comté', 'franche-comte', 'dijon', 'beaune', 'nevers', 'mâcon', 'macon', 'auxerre', 'besançon', 'besancon'],
  'Nouvelle-Aquit.': ['aquitaine', 'bordeaux', 'biarritz', 'pau', 'la rochelle', 'limoges', 'poitiers', 'tarbes', 'lourdes'],
  'Pays-de-la-Loire':['pays de la loire', 'nantes', 'angers', 'le mans', 'la roche-sur-yon'],
  'Centre-Val-Loire':['centre-val', 'tours', 'orléans', 'orleans', 'blois', 'bourges', 'chartres'],
  'Grand Est':       ['grand est', 'strasbourg', 'metz', 'nancy', 'reims', 'mulhouse', 'colmar'],
  'Corse':           ['corse', 'ajaccio', 'bastia', 'porto-vecchio', 'calvi', 'bonifacio'],
  'Outre-mer':       ['réunion', 'reunion', 'saint-denis', 'martinique', 'guadeloupe', 'guyane', 'mayotte'],
}

// Département (2 chiffres, 3 pour l'outre-mer) → région. Signal fiable car
// basé sur un vrai code postal à 5 chiffres extrait de l'adresse, contrairement
// aux mots-clés texte ci-dessus.
const DEPT_TO_REGION: Record<string, string> = {
  '01': 'Auvergne-Rhône', '03': 'Auvergne-Rhône', '07': 'Auvergne-Rhône', '15': 'Auvergne-Rhône',
  '26': 'Auvergne-Rhône', '38': 'Auvergne-Rhône', '42': 'Auvergne-Rhône', '43': 'Auvergne-Rhône',
  '63': 'Auvergne-Rhône', '69': 'Auvergne-Rhône', '73': 'Auvergne-Rhône', '74': 'Auvergne-Rhône',
  '21': 'Bourgogne-FC', '25': 'Bourgogne-FC', '39': 'Bourgogne-FC', '58': 'Bourgogne-FC',
  '70': 'Bourgogne-FC', '71': 'Bourgogne-FC', '89': 'Bourgogne-FC', '90': 'Bourgogne-FC',
  '22': 'Bretagne', '29': 'Bretagne', '35': 'Bretagne', '56': 'Bretagne',
  '18': 'Centre-Val-Loire', '28': 'Centre-Val-Loire', '36': 'Centre-Val-Loire',
  '37': 'Centre-Val-Loire', '41': 'Centre-Val-Loire', '45': 'Centre-Val-Loire',
  '20': 'Corse',
  '08': 'Grand Est', '10': 'Grand Est', '51': 'Grand Est', '52': 'Grand Est', '54': 'Grand Est',
  '55': 'Grand Est', '57': 'Grand Est', '67': 'Grand Est', '68': 'Grand Est', '88': 'Grand Est',
  '02': 'Hauts-de-France', '59': 'Hauts-de-France', '60': 'Hauts-de-France', '62': 'Hauts-de-France', '80': 'Hauts-de-France',
  '75': 'Île-de-France', '77': 'Île-de-France', '78': 'Île-de-France', '91': 'Île-de-France',
  '92': 'Île-de-France', '93': 'Île-de-France', '94': 'Île-de-France', '95': 'Île-de-France',
  '14': 'Normandie', '27': 'Normandie', '50': 'Normandie', '61': 'Normandie', '76': 'Normandie',
  '16': 'Nouvelle-Aquit.', '17': 'Nouvelle-Aquit.', '19': 'Nouvelle-Aquit.', '23': 'Nouvelle-Aquit.',
  '24': 'Nouvelle-Aquit.', '33': 'Nouvelle-Aquit.', '40': 'Nouvelle-Aquit.', '47': 'Nouvelle-Aquit.',
  '64': 'Nouvelle-Aquit.', '79': 'Nouvelle-Aquit.', '86': 'Nouvelle-Aquit.', '87': 'Nouvelle-Aquit.',
  '09': 'Occitanie', '11': 'Occitanie', '12': 'Occitanie', '30': 'Occitanie', '31': 'Occitanie',
  '32': 'Occitanie', '34': 'Occitanie', '46': 'Occitanie', '48': 'Occitanie', '65': 'Occitanie',
  '66': 'Occitanie', '81': 'Occitanie', '82': 'Occitanie',
  '44': 'Pays-de-la-Loire', '49': 'Pays-de-la-Loire', '53': 'Pays-de-la-Loire', '72': 'Pays-de-la-Loire', '85': 'Pays-de-la-Loire',
  '04': 'PACA', '05': 'PACA', '06': 'PACA', '13': 'PACA', '83': 'PACA', '84': 'PACA',
  '971': 'Outre-mer', '972': 'Outre-mer', '973': 'Outre-mer', '974': 'Outre-mer', '975': 'Outre-mer', '976': 'Outre-mer',
}

export function detectRegion(address: string | null | undefined): string | null {
  if (!address) return null

  // 1) Code postal français (signal fiable) : 5 chiffres consécutifs, le
  //    département correspond aux 2 premiers chiffres (3 pour l'outre-mer,
  //    préfixe 97x). Prioritaire sur les mots-clés texte.
  const postalMatch = address.match(/\b(\d{5})\b/)
  if (postalMatch) {
    const code = postalMatch[1]
    const region = DEPT_TO_REGION[code.slice(0, 3)] ?? DEPT_TO_REGION[code.slice(0, 2)]
    if (region) return region
  }

  // 2) Repli : mots-clés villes/régions, seulement si aucun code postal
  //    exploitable n'a été trouvé (adresse incomplète, format non-FR...).
  const text = ' ' + address.toLowerCase() + ' '
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) return region
    }
  }
  return null
}

/**
 * Compute member count per region from a list of addresses.
 * One member per region max (so multiple logements in same region don't count multiple times).
 */
export function aggregateRegionsByMember(
  addressesByMember: Record<string, string[]>,
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const [, addresses] of Object.entries(addressesByMember)) {
    const memberRegions = new Set<string>()
    for (const addr of addresses) {
      const region = detectRegion(addr)
      if (region) memberRegions.add(region)
    }
    memberRegions.forEach(region => {
      counts[region] = (counts[region] ?? 0) + 1
    })
  }
  return counts
}

/** Approximative SVG positions (% of viewBox 100x110) for each region, used by the map */
export const REGION_POSITIONS: Record<string, { x: number; y: number }> = {
  'Île-de-France':    { x: 50, y: 30 },
  'PACA':             { x: 70, y: 80 },
  'Bretagne':         { x: 18, y: 35 },
  'Normandie':        { x: 35, y: 25 },
  'Occitanie':        { x: 48, y: 80 },
  'Hauts-de-France':  { x: 50, y: 13 },
  'Auvergne-Rhône':   { x: 60, y: 60 },
  'Bourgogne-FC':     { x: 62, y: 45 },
  'Nouvelle-Aquit.':  { x: 32, y: 65 },
  'Pays-de-la-Loire': { x: 28, y: 45 },
  'Centre-Val-Loire': { x: 45, y: 45 },
  'Grand Est':        { x: 72, y: 25 },
  'Corse':            { x: 90, y: 95 },
  'Outre-mer':        { x: 12, y: 95 },
}
