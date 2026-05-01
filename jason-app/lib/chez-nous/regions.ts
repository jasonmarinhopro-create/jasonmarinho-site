/**
 * Map a free-text address to a French region tag.
 * Used in Chez Nous to show where the community is located.
 */

export const REGION_KEYWORDS: Record<string, string[]> = {
  'Île-de-France':   ['paris', 'île-de-france', 'ile-de-france', 'idf', ' 75', ' 77', ' 78', ' 91', ' 92', ' 93', ' 94', ' 95'],
  'PACA':            ['paca', 'provence', 'marseille', 'nice', 'aix-en-provence', 'cannes', 'avignon', 'toulon', 'antibes', ' 13', ' 83', ' 84', ' 04', ' 05', ' 06'],
  'Bretagne':        ['bretagne', 'rennes', 'brest', 'quimper', 'lorient', 'vannes', 'saint-malo', 'dinard', ' 22', ' 29', ' 35', ' 56'],
  'Normandie':       ['normandie', 'rouen', 'caen', 'le havre', 'cherbourg', 'évreux', 'deauville', 'honfleur', ' 14', ' 27', ' 50', ' 61', ' 76'],
  'Occitanie':       ['occitanie', 'toulouse', 'montpellier', 'nîmes', 'nimes', 'perpignan', 'narbonne', 'sète', ' 31', ' 34', ' 11', ' 66', ' 30'],
  'Hauts-de-France': ['hauts-de-france', 'lille', 'amiens', 'roubaix', 'tourcoing', 'arras', 'calais', ' 59', ' 62', ' 60', ' 02', ' 80'],
  'Auvergne-Rhône':  ['auvergne', 'rhône', 'rhone', 'lyon', 'clermont-ferrand', 'clermont', 'vichy', 'grenoble', 'annecy', 'savoie', 'chamonix', 'megève', 'megeve', ' 63', ' 15', ' 43', ' 03', ' 69', ' 73', ' 74', ' 38', ' 26', ' 07', ' 42', ' 01'],
  'Bourgogne-FC':    ['bourgogne', 'franche-comté', 'franche-comte', 'dijon', 'beaune', 'nevers', 'mâcon', 'macon', 'auxerre', 'besançon', 'besancon', ' 21', ' 58', ' 71', ' 89', ' 25', ' 39', ' 70', ' 90'],
  'Nouvelle-Aquit.': ['aquitaine', 'bordeaux', 'biarritz', 'pau', 'la rochelle', 'limoges', 'poitiers', 'tarbes', 'lourdes', ' 33', ' 64', ' 17', ' 16', ' 24', ' 47', ' 40', ' 87', ' 19', ' 23', ' 86', ' 79', ' 65'],
  'Pays-de-la-Loire':['pays de la loire', 'nantes', 'angers', 'le mans', 'la roche-sur-yon', ' 44', ' 49', ' 53', ' 72', ' 85'],
  'Centre-Val-Loire':['centre-val', 'tours', 'orléans', 'orleans', 'blois', 'bourges', 'chartres', ' 37', ' 45', ' 41', ' 18', ' 28', ' 36'],
  'Grand Est':       ['grand est', 'strasbourg', 'metz', 'nancy', 'reims', 'mulhouse', 'colmar', ' 67', ' 68', ' 57', ' 54', ' 88', ' 51', ' 52', ' 10', ' 55', ' 08'],
  'Corse':           ['corse', 'ajaccio', 'bastia', 'porto-vecchio', 'calvi', 'bonifacio', ' 20', ' 2a', ' 2b'],
  'Outre-mer':       ['réunion', 'reunion', 'saint-denis', 'martinique', 'guadeloupe', 'guyane', 'mayotte', ' 974', ' 972', ' 971', ' 973', ' 976'],
}

export function detectRegion(address: string | null | undefined): string | null {
  if (!address) return null
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
