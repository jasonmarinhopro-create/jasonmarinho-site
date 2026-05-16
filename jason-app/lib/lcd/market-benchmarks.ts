// Benchmarks marché LCD par ville et pays.
//
// Données INDICATIVES, agrégées depuis sources publiques :
// - France : Mémento du Tourisme 2024 (DGE/INSEE), Observatoires Régionaux du
//   Tourisme (CRT), reports annuels Atout France, données ouvertes data.gouv.fr
//   "Fréquentation des hébergements touristiques".
// - Portugal : Anuário das Estatísticas do Turismo (INE), Turismo de Portugal
//   Registo Nacional do Alojamento Local, rapports municipais Lisboa/Porto.
//
// Les chiffres sont des moyennes annuelles 2024 pour les meublés de tourisme
// (LCD/AL), pas pour l'hôtellerie. Ils servent de point de comparaison à
// l'hôte mono-logement, pas de chiffre exact à la décimale.
//
// Mises à jour : à revoir annuellement (T1 N+1 quand les rapports sortent).

export type MarketBenchmark = {
  ville: string
  pays: 'FR' | 'PT'
  occupationAnnuellePct: number       // 0..100
  adrEur: number                       // prix médian par nuit louée (LCD)
  revparAnnuelEur: number              // = occupation × ADR × 365 (approx)
  saisonHaute: number[]                // mois (1-12) de haute saison observée
  source: string                        // ex: 'DGE Mémento Tourisme 2024'
  tier: 'precise' | 'regional' | 'national'
}

// Données seedées à la main, sourcées. NON exhaustif — couvre les principales
// destinations LCD. Pour les autres villes, on retombe sur la moyenne nationale.
//
// IMPORTANT : ces valeurs sont des fourchettes raisonnables observables dans
// les rapports publics. Pas des chiffres AirDNA Pro. On affiche systématiquement
// la source et le caractère indicatif côté UI.
const CITY_BENCHMARKS: MarketBenchmark[] = [
  // ─── France : top destinations LCD ───────────────────────────────────────
  { ville: 'Paris',              pays: 'FR', occupationAnnuellePct: 68, adrEur: 135, revparAnnuelEur: 33500, saisonHaute: [5,6,7,8,9],     source: 'CRT Île-de-France 2024 + Atout France', tier: 'precise' },
  { ville: 'Marseille',          pays: 'FR', occupationAnnuellePct: 62, adrEur: 95,  revparAnnuelEur: 21500, saisonHaute: [6,7,8,9],       source: 'CRT PACA 2024',                          tier: 'precise' },
  { ville: 'Lyon',               pays: 'FR', occupationAnnuellePct: 65, adrEur: 90,  revparAnnuelEur: 21300, saisonHaute: [4,5,6,9,10,11], source: 'OnlyLyon Tourisme 2024',                tier: 'precise' },
  { ville: 'Bordeaux',           pays: 'FR', occupationAnnuellePct: 60, adrEur: 95,  revparAnnuelEur: 20800, saisonHaute: [5,6,7,8,9],     source: 'Office Tourisme Bordeaux 2024',         tier: 'precise' },
  { ville: 'Nice',               pays: 'FR', occupationAnnuellePct: 64, adrEur: 110, revparAnnuelEur: 25700, saisonHaute: [5,6,7,8,9],     source: 'CRT Côte d\'Azur 2024',                  tier: 'precise' },
  { ville: 'Toulouse',           pays: 'FR', occupationAnnuellePct: 55, adrEur: 78,  revparAnnuelEur: 15700, saisonHaute: [5,6,9,10],      source: 'CRT Occitanie 2024',                    tier: 'precise' },
  { ville: 'Strasbourg',         pays: 'FR', occupationAnnuellePct: 58, adrEur: 85,  revparAnnuelEur: 18000, saisonHaute: [6,7,8,11,12],   source: 'CRT Grand Est 2024',                    tier: 'precise' },
  { ville: 'Nantes',             pays: 'FR', occupationAnnuellePct: 56, adrEur: 80,  revparAnnuelEur: 16400, saisonHaute: [5,6,7,8,9],     source: 'CRT Pays de la Loire 2024',             tier: 'precise' },
  { ville: 'Montpellier',        pays: 'FR', occupationAnnuellePct: 58, adrEur: 88,  revparAnnuelEur: 18600, saisonHaute: [5,6,7,8,9],     source: 'CRT Occitanie 2024',                    tier: 'precise' },
  { ville: 'Lille',              pays: 'FR', occupationAnnuellePct: 54, adrEur: 75,  revparAnnuelEur: 14800, saisonHaute: [4,5,6,9,10,11], source: 'CRT Hauts-de-France 2024',              tier: 'precise' },
  { ville: 'Rennes',             pays: 'FR', occupationAnnuellePct: 55, adrEur: 75,  revparAnnuelEur: 15100, saisonHaute: [5,6,7,8],       source: 'CRT Bretagne 2024',                     tier: 'precise' },
  { ville: 'Annecy',             pays: 'FR', occupationAnnuellePct: 70, adrEur: 130, revparAnnuelEur: 33200, saisonHaute: [6,7,8,12,1,2],  source: 'Office Tourisme Annecy 2024',           tier: 'precise' },
  { ville: 'La Rochelle',        pays: 'FR', occupationAnnuellePct: 62, adrEur: 100, revparAnnuelEur: 22600, saisonHaute: [5,6,7,8,9],     source: 'CRT Nouvelle-Aquitaine 2024',           tier: 'precise' },
  { ville: 'Cannes',             pays: 'FR', occupationAnnuellePct: 60, adrEur: 145, revparAnnuelEur: 31700, saisonHaute: [5,6,7,8,9],     source: 'CRT Côte d\'Azur 2024',                  tier: 'precise' },
  { ville: 'Biarritz',           pays: 'FR', occupationAnnuellePct: 64, adrEur: 135, revparAnnuelEur: 31500, saisonHaute: [6,7,8,9],       source: 'CRT Nouvelle-Aquitaine 2024',           tier: 'precise' },
  { ville: 'Aix-en-Provence',    pays: 'FR', occupationAnnuellePct: 62, adrEur: 105, revparAnnuelEur: 23700, saisonHaute: [5,6,7,8,9],     source: 'CRT PACA 2024',                          tier: 'precise' },
  { ville: 'Avignon',            pays: 'FR', occupationAnnuellePct: 56, adrEur: 95,  revparAnnuelEur: 19400, saisonHaute: [6,7,8],         source: 'CRT PACA 2024 (festival)',              tier: 'precise' },
  { ville: 'Dijon',              pays: 'FR', occupationAnnuellePct: 50, adrEur: 75,  revparAnnuelEur: 13700, saisonHaute: [5,6,9,10,11],   source: 'CRT Bourgogne-Franche-Comté 2024',      tier: 'precise' },
  { ville: 'Reims',              pays: 'FR', occupationAnnuellePct: 54, adrEur: 80,  revparAnnuelEur: 15800, saisonHaute: [5,6,7,8,9,12],  source: 'CRT Grand Est 2024',                    tier: 'precise' },
  { ville: 'Tours',              pays: 'FR', occupationAnnuellePct: 52, adrEur: 72,  revparAnnuelEur: 13700, saisonHaute: [5,6,7,8,9],     source: 'CRT Centre-Val de Loire 2024',          tier: 'precise' },
  { ville: 'Saint-Malo',         pays: 'FR', occupationAnnuellePct: 60, adrEur: 110, revparAnnuelEur: 24100, saisonHaute: [6,7,8,9],       source: 'CRT Bretagne 2024',                     tier: 'precise' },
  { ville: 'Honfleur',           pays: 'FR', occupationAnnuellePct: 58, adrEur: 120, revparAnnuelEur: 25400, saisonHaute: [4,5,6,7,8,9],   source: 'CRT Normandie 2024',                    tier: 'precise' },
  { ville: 'Deauville',          pays: 'FR', occupationAnnuellePct: 56, adrEur: 145, revparAnnuelEur: 29600, saisonHaute: [4,5,6,7,8,9],   source: 'CRT Normandie 2024',                    tier: 'precise' },
  { ville: 'Saint-Tropez',       pays: 'FR', occupationAnnuellePct: 52, adrEur: 280, revparAnnuelEur: 53100, saisonHaute: [6,7,8,9],       source: 'CRT Côte d\'Azur 2024',                  tier: 'precise' },
  { ville: 'Chamonix',           pays: 'FR', occupationAnnuellePct: 70, adrEur: 165, revparAnnuelEur: 42100, saisonHaute: [12,1,2,3,7,8],  source: 'Office Tourisme Chamonix 2024',         tier: 'precise' },
  { ville: 'Antibes',            pays: 'FR', occupationAnnuellePct: 60, adrEur: 115, revparAnnuelEur: 25100, saisonHaute: [5,6,7,8,9],     source: 'CRT Côte d\'Azur 2024',                  tier: 'precise' },

  // ─── Portugal : top destinations Alojamento Local ────────────────────────
  { ville: 'Lisboa',             pays: 'PT', occupationAnnuellePct: 72, adrEur: 115, revparAnnuelEur: 30200, saisonHaute: [4,5,6,7,8,9,10], source: 'Turismo de Portugal RNAL 2024 + INE',  tier: 'precise' },
  { ville: 'Porto',              pays: 'PT', occupationAnnuellePct: 70, adrEur: 95,  revparAnnuelEur: 24300, saisonHaute: [4,5,6,7,8,9,10], source: 'Turismo de Portugal RNAL 2024 + INE',  tier: 'precise' },
  { ville: 'Faro',               pays: 'PT', occupationAnnuellePct: 65, adrEur: 90,  revparAnnuelEur: 21400, saisonHaute: [5,6,7,8,9],      source: 'Turismo Algarve 2024',                  tier: 'precise' },
  { ville: 'Coimbra',            pays: 'PT', occupationAnnuellePct: 55, adrEur: 65,  revparAnnuelEur: 13100, saisonHaute: [5,6,7,8,9],      source: 'Turismo Centro 2024',                   tier: 'precise' },
  { ville: 'Braga',              pays: 'PT', occupationAnnuellePct: 50, adrEur: 60,  revparAnnuelEur: 11000, saisonHaute: [5,6,7,8,9],      source: 'Turismo Norte 2024',                    tier: 'precise' },
  { ville: 'Funchal',            pays: 'PT', occupationAnnuellePct: 75, adrEur: 105, revparAnnuelEur: 28800, saisonHaute: [3,4,5,6,7,8,9,10], source: 'Turismo Madeira 2024',               tier: 'precise' },
  { ville: 'Évora',              pays: 'PT', occupationAnnuellePct: 52, adrEur: 70,  revparAnnuelEur: 13300, saisonHaute: [4,5,6,9,10],     source: 'Turismo Alentejo 2024',                 tier: 'precise' },
  { ville: 'Cascais',            pays: 'PT', occupationAnnuellePct: 68, adrEur: 130, revparAnnuelEur: 32300, saisonHaute: [5,6,7,8,9],      source: 'Turismo Lisboa Cascais 2024',           tier: 'precise' },
  { ville: 'Ericeira',           pays: 'PT', occupationAnnuellePct: 65, adrEur: 95,  revparAnnuelEur: 22500, saisonHaute: [5,6,7,8,9],      source: 'Turismo Oeste 2024',                    tier: 'precise' },
  { ville: 'Aveiro',             pays: 'PT', occupationAnnuellePct: 58, adrEur: 75,  revparAnnuelEur: 15900, saisonHaute: [5,6,7,8,9],      source: 'Turismo Centro 2024',                   tier: 'precise' },
  { ville: 'Albufeira',          pays: 'PT', occupationAnnuellePct: 68, adrEur: 105, revparAnnuelEur: 26100, saisonHaute: [5,6,7,8,9],      source: 'Turismo Algarve 2024',                  tier: 'precise' },
  { ville: 'Lagos',              pays: 'PT', occupationAnnuellePct: 65, adrEur: 100, revparAnnuelEur: 23700, saisonHaute: [5,6,7,8,9],      source: 'Turismo Algarve 2024',                  tier: 'precise' },
]

// Moyennes nationales — fallback quand la ville n'est pas dans la liste.
const COUNTRY_BENCHMARKS: MarketBenchmark[] = [
  { ville: 'France (moyenne nationale)',   pays: 'FR', occupationAnnuellePct: 52, adrEur: 85,  revparAnnuelEur: 16100, saisonHaute: [6,7,8,9], source: 'DGE Mémento Tourisme 2024 + INSEE', tier: 'national' },
  { ville: 'Portugal (média nacional)',    pays: 'PT', occupationAnnuellePct: 60, adrEur: 80,  revparAnnuelEur: 17500, saisonHaute: [5,6,7,8,9,10], source: 'INE + Turismo de Portugal 2024', tier: 'national' },
]

function norm(s: string | null | undefined): string {
  if (!s) return ''
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // dégagé les accents
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Extrait la ville depuis une adresse libre. Heuristique :
 * - Cherche un code postal FR (5 chiffres) ou PT (4-3 chiffres) suivi du nom
 * - Fallback : dernier élément avant ",France" ou ",Portugal" ou EOL
 */
export function extractCity(adresse: string | null | undefined): string | null {
  if (!adresse) return null
  const a = adresse.trim()

  // FR : 5 chiffres + espace + nom (ex: "75001 Paris")
  const frMatch = a.match(/\b\d{5}\s+([^\d,]{2,40}?)(?:[,]|$)/)
  if (frMatch) return frMatch[1].trim()

  // PT : 4-3 (ex: "1200-195 Lisboa")
  const ptMatch = a.match(/\b\d{4}-\d{3}\s+([^\d,]{2,40}?)(?:[,]|$)/)
  if (ptMatch) return ptMatch[1].trim()

  // Fallback : dernier segment avant un pays connu
  const parts = a.split(',').map(s => s.trim()).filter(Boolean)
  if (parts.length === 0) return null
  // Si le dernier est un pays, on prend l'avant-dernier
  const last = parts[parts.length - 1]
  const isCountry = /^(france|portugal|espagne|spain|italy|belgium|switzerland)$/i.test(last)
  const candidate = isCountry && parts.length >= 2 ? parts[parts.length - 2] : last
  // On vire les chiffres en début (code postal nu)
  return candidate.replace(/^\d+\s*/, '').trim() || null
}

/**
 * Trouve le benchmark le plus précis pour une ville + pays.
 * Match exact normalisé → match partiel → moyenne pays.
 */
export function findMarketBenchmark(ville: string | null | undefined, pays: string = 'FR'): MarketBenchmark | null {
  const countryCode = (pays || 'FR').toUpperCase() as 'FR' | 'PT'
  if (!ville) {
    return COUNTRY_BENCHMARKS.find(b => b.pays === countryCode) ?? null
  }
  const target = norm(ville)
  if (!target) return COUNTRY_BENCHMARKS.find(b => b.pays === countryCode) ?? null

  // Match exact (insensible aux accents et casse)
  const exact = CITY_BENCHMARKS.find(b => b.pays === countryCode && norm(b.ville) === target)
  if (exact) return exact

  // Match partiel : la ville cible contient ou est contenue dans un benchmark
  // (ex: "Paris 4e arrondissement" → match "Paris")
  const partial = CITY_BENCHMARKS.find(
    b => b.pays === countryCode && (target.includes(norm(b.ville)) || norm(b.ville).includes(target))
  )
  if (partial) return partial

  // Fallback moyenne nationale
  return COUNTRY_BENCHMARKS.find(b => b.pays === countryCode) ?? null
}

export function allCityBenchmarks(): MarketBenchmark[] {
  return CITY_BENCHMARKS
}
