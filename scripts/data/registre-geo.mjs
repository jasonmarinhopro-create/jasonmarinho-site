// Registre géographique unique (étape 2 de la feuille de route « géographie,
// pied de page et fil d'Ariane », validée par Jason le 09/11/2026).
//
// Une ligne par ville qui a au moins une page sur le site. En France, le code
// commune INSEE suffit : département et région s'en déduisent avec les données
// IGN de scripts/data/geo (scripts/lib/registre-geo.mjs). Hors de France, le
// pays (et la province quand elle compte, comme Québec) est écrit à la main.
//
// Pages d'une ville : photographe (/photographe-lcd-<slug>), menage
// (/menage-lcd-<slug>), depannage (/depannage-lcd-<slug>), hote
// (/devenir-hote-airbnb-<slug>), revenus (/services/simulateurs/revenus-lcd/<revenus>).
// Règle de Jason : une ville française du réseau a ses 4 pages (LES_4).
//
// Ajouter une ville : une ligne ici (code INSEE vérifié dans
// scripts/data/geo/communes/<département>.json, où l'IGN écrit les noms sans
// article : « Rochelle », « Mans »), puis node scripts/build-registre-geo.mjs.
// Contrôle : le job « villes » du workflow Site statique.

export const PAYS = {
  FR: 'France',
  CA: 'Canada',
  PT: 'Portugal',
  ES: 'Espagne',
  IT: 'Italie',
  BE: 'Belgique',
  NL: 'Pays-Bas',
  DE: 'Allemagne',
  AT: 'Autriche',
}

export const LES_4 = ['photographe', 'menage', 'depannage', 'hote']

/**
 * slug, nom affiché, code INSEE (France) ou pays (+ province), pages,
 * revenus = dossier de l'étude de revenus sous /services/simulateurs quand elle existe.
 */
export const VILLES = [
  // ── France : villes du réseau (4 pages) ────────────────────────────
  { slug: 'aix-en-provence', nom: 'Aix-en-Provence', insee: '13001', pages: LES_4, revenus: 'aix-en-provence' },
  { slug: 'ajaccio', nom: 'Ajaccio', insee: '2A004', pages: LES_4 },
  { slug: 'angers', nom: 'Angers', insee: '49007', pages: LES_4 },
  { slug: 'annecy', nom: 'Annecy', insee: '74010', pages: LES_4, revenus: 'annecy' },
  { slug: 'antibes', nom: 'Antibes', insee: '06004', pages: LES_4 },
  { slug: 'arcachon', nom: 'Arcachon', insee: '33009', pages: LES_4 },
  { slug: 'avignon', nom: 'Avignon', insee: '84007', pages: LES_4, revenus: 'avignon' },
  { slug: 'bastia', nom: 'Bastia', insee: '2B033', pages: LES_4 },
  { slug: 'bayonne', nom: 'Bayonne', insee: '64102', pages: LES_4 },
  { slug: 'beaune', nom: 'Beaune', insee: '21054', pages: LES_4 },
  { slug: 'biarritz', nom: 'Biarritz', insee: '64122', pages: LES_4, revenus: 'biarritz' },
  { slug: 'bordeaux', nom: 'Bordeaux', insee: '33063', pages: LES_4, revenus: 'bordeaux' },
  { slug: 'brest', nom: 'Brest', insee: '29019', pages: LES_4 },
  { slug: 'caen', nom: 'Caen', insee: '14118', pages: LES_4 },
  { slug: 'cannes', nom: 'Cannes', insee: '06029', pages: LES_4, revenus: 'cannes' },
  { slug: 'carcassonne', nom: 'Carcassonne', insee: '11069', pages: LES_4, revenus: 'carcassonne' },
  { slug: 'chambery', nom: 'Chambéry', insee: '73065', pages: LES_4 },
  { slug: 'chamonix', nom: 'Chamonix', insee: '74056', pages: LES_4, revenus: 'chamonix' },
  { slug: 'clermont-ferrand', nom: 'Clermont-Ferrand', insee: '63113', pages: LES_4 },
  { slug: 'colmar', nom: 'Colmar', insee: '68066', pages: LES_4 },
  { slug: 'deauville', nom: 'Deauville', insee: '14220', pages: LES_4, revenus: 'deauville' },
  { slug: 'dijon', nom: 'Dijon', insee: '21231', pages: LES_4 },
  { slug: 'dinard', nom: 'Dinard', insee: '35093', pages: LES_4 },
  { slug: 'epernay', nom: 'Épernay', insee: '51230', pages: LES_4 },
  { slug: 'etretat', nom: 'Étretat', insee: '76254', pages: LES_4 },
  { slug: 'grenoble', nom: 'Grenoble', insee: '38185', pages: LES_4 },
  { slug: 'honfleur', nom: 'Honfleur', insee: '14333', pages: LES_4, revenus: 'honfleur' },
  { slug: 'la-baule', nom: 'La Baule', insee: '44055', pages: LES_4, revenus: 'la-baule' },
  { slug: 'la-rochelle', nom: 'La Rochelle', insee: '17300', pages: LES_4, revenus: 'la-rochelle' },
  { slug: 'le-mans', nom: 'Le Mans', insee: '72181', pages: LES_4 },
  { slug: 'le-touquet', nom: 'Le Touquet', insee: '62826', pages: LES_4, revenus: 'le-touquet' },
  { slug: 'les-sables-d-olonne', nom: "Les Sables-d'Olonne", insee: '85194', pages: LES_4 },
  { slug: 'lille', nom: 'Lille', insee: '59350', pages: LES_4 },
  { slug: 'lyon', nom: 'Lyon', insee: '69123', pages: LES_4, revenus: 'lyon' },
  { slug: 'marseille', nom: 'Marseille', insee: '13055', pages: LES_4, revenus: 'marseille' },
  { slug: 'megeve', nom: 'Megève', insee: '74173', pages: LES_4, revenus: 'megeve' },
  { slug: 'menton', nom: 'Menton', insee: '06083', pages: LES_4 },
  { slug: 'metz', nom: 'Metz', insee: '57463', pages: LES_4 },
  { slug: 'montpellier', nom: 'Montpellier', insee: '34172', pages: LES_4, revenus: 'montpellier' },
  { slug: 'nancy', nom: 'Nancy', insee: '54395', pages: LES_4 },
  { slug: 'nantes', nom: 'Nantes', insee: '44109', pages: LES_4 },
  { slug: 'nice', nom: 'Nice', insee: '06088', pages: LES_4, revenus: 'nice' },
  { slug: 'nimes', nom: 'Nîmes', insee: '30189', pages: LES_4 },
  { slug: 'paris', nom: 'Paris', insee: '75056', pages: LES_4, revenus: 'paris' },
  { slug: 'pau', nom: 'Pau', insee: '64445', pages: LES_4 },
  { slug: 'perpignan', nom: 'Perpignan', insee: '66136', pages: LES_4 },
  { slug: 'poitiers', nom: 'Poitiers', insee: '86194', pages: LES_4 },
  { slug: 'quimper', nom: 'Quimper', insee: '29232', pages: LES_4 },
  { slug: 'reims', nom: 'Reims', insee: '51454', pages: LES_4 },
  { slug: 'rennes', nom: 'Rennes', insee: '35238', pages: LES_4 },
  { slug: 'roanne', nom: 'Roanne', insee: '42187', pages: LES_4 },
  { slug: 'rouen', nom: 'Rouen', insee: '76540', pages: LES_4 },
  { slug: 'saint-malo', nom: 'Saint-Malo', insee: '35288', pages: LES_4, revenus: 'saint-malo' },
  { slug: 'saint-tropez', nom: 'Saint-Tropez', insee: '83119', pages: LES_4, revenus: 'saint-tropez' },
  { slug: 'sarlat', nom: 'Sarlat', insee: '24520', pages: LES_4 },
  { slug: 'sete', nom: 'Sète', insee: '34301', pages: LES_4 },
  { slug: 'strasbourg', nom: 'Strasbourg', insee: '67482', pages: LES_4, revenus: 'strasbourg' },
  { slug: 'toulouse', nom: 'Toulouse', insee: '31555', pages: LES_4, revenus: 'toulouse' },
  { slug: 'tours', nom: 'Tours', insee: '37261', pages: LES_4 },
  { slug: 'troyes', nom: 'Troyes', insee: '10387', pages: LES_4 },
  { slug: 'vannes', nom: 'Vannes', insee: '56260', pages: LES_4 },
  { slug: 'versailles', nom: 'Versailles', insee: '78646', pages: LES_4 },

  // ── France : étude de revenus seulement ───────────────────────────
  { slug: 'cassis', nom: 'Cassis', insee: '13022', pages: [], revenus: 'cassis' },
  { slug: 'courchevel', nom: 'Courchevel', insee: '73227', pages: [], revenus: 'courchevel' },
  { slug: 'val-d-isere', nom: "Val-d'Isère", insee: '73304', pages: [], revenus: 'val-d-isere' },

  // ── Hors de France ─────────────────────────────────────────────────
  { slug: 'quebec', nom: 'Québec', pays: 'CA', province: 'Québec', pages: ['photographe'] },
  { slug: 'lisbonne', nom: 'Lisbonne', pays: 'PT', pages: [], revenus: 'lisbonne' },
  { slug: 'porto', nom: 'Porto', pays: 'PT', pages: [], revenus: 'porto' },
  { slug: 'funchal', nom: 'Funchal', pays: 'PT', province: 'Madère', pages: [], revenus: 'funchal' },
  { slug: 'barcelone', nom: 'Barcelone', pays: 'ES', pages: [], revenus: 'barcelona' },
  { slug: 'madrid', nom: 'Madrid', pays: 'ES', pages: [], revenus: 'madrid' },
  { slug: 'seville', nom: 'Séville', pays: 'ES', pages: [], revenus: 'sevilla' },
  { slug: 'valence', nom: 'Valence', pays: 'ES', pages: [], revenus: 'valencia' },
  { slug: 'rome', nom: 'Rome', pays: 'IT', pages: [], revenus: 'rome' },
  { slug: 'florence', nom: 'Florence', pays: 'IT', pages: [], revenus: 'firenze' },
  { slug: 'bruxelles', nom: 'Bruxelles', pays: 'BE', pages: [], revenus: 'bruxelles' },
  { slug: 'amsterdam', nom: 'Amsterdam', pays: 'NL', pages: [], revenus: 'amsterdam' },
  { slug: 'berlin', nom: 'Berlin', pays: 'DE', pages: [], revenus: 'berlin' },
  { slug: 'munich', nom: 'Munich', pays: 'DE', pages: [], revenus: 'munich' },
  { slug: 'vienne', nom: 'Vienne', pays: 'AT', pages: [], revenus: 'wien' },
]
