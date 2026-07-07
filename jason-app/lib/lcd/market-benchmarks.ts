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
  pays: 'FR' | 'PT' | 'ES' | 'IT' | 'BE' | 'DE' | 'NL' | 'AT' | 'CH'
  occupationAnnuellePct: number       // 0..100
  adrEur: number                       // prix médian par nuit louée (LCD) — en EUR pour homogénéité
  revparAnnuelEur: number              // = occupation × ADR × 365 (approx)
  saisonHaute: number[]                // mois (1-12) de haute saison observée
  source: string                        // ex: 'DGE Mémento Tourisme 2024'
  tier: 'precise' | 'regional' | 'national'
  /** Pour CH : ADR converti depuis CHF (taux indicatif). Devise locale = CHF */
  currencyNote?: string
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
  // Carcassonne : Cité médiévale UNESCO (2,2M visiteurs/an), forte
  // saisonnalité estivale. ADR ~98€, occupation ~49% (EstimOpti/Cocoonr).
  // RevPAR théorique ADR×occ×365 ≈ 17,5k€ ; l'observé moyen tous types est
  // ~15,5k€ (appart ~13,4k€, maison ~22,5k€) — fourchette conservatrice.
  { ville: 'Carcassonne',        pays: 'FR', occupationAnnuellePct: 49, adrEur: 98,  revparAnnuelEur: 17500, saisonHaute: [5,6,7,8,9],     source: 'ADT Aude 2024 + EstimOpti/Cocoonr',     tier: 'precise' },
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

  // ─── Espagne : top destinations apartamentos turísticos ─────────────────
  { ville: 'Madrid',             pays: 'ES', occupationAnnuellePct: 68, adrEur: 110, revparAnnuelEur: 27300, saisonHaute: [3,4,5,9,10,11],     source: 'INE EOAT + Turismo Madrid 2024',          tier: 'precise' },
  { ville: 'Barcelona',          pays: 'ES', occupationAnnuellePct: 72, adrEur: 120, revparAnnuelEur: 31500, saisonHaute: [4,5,6,7,8,9,10],   source: 'INE + Turisme Barcelona 2024',           tier: 'precise' },
  { ville: 'Sevilla',            pays: 'ES', occupationAnnuellePct: 62, adrEur: 85,  revparAnnuelEur: 19200, saisonHaute: [3,4,5,10,11,12],   source: 'Turismo Andalucía 2024',                 tier: 'precise' },
  { ville: 'Valencia',           pays: 'ES', occupationAnnuellePct: 60, adrEur: 80,  revparAnnuelEur: 17500, saisonHaute: [3,4,5,6,7,8,9],    source: 'GVA Turisme Comunitat Valenciana 2024',  tier: 'precise' },
  { ville: 'Málaga',             pays: 'ES', occupationAnnuellePct: 65, adrEur: 95,  revparAnnuelEur: 22500, saisonHaute: [4,5,6,7,8,9,10],   source: 'Turismo Costa del Sol 2024',             tier: 'precise' },
  { ville: 'Bilbao',             pays: 'ES', occupationAnnuellePct: 58, adrEur: 85,  revparAnnuelEur: 18000, saisonHaute: [5,6,7,8,9],         source: 'Turismo Bizkaia 2024',                   tier: 'precise' },
  { ville: 'Granada',            pays: 'ES', occupationAnnuellePct: 58, adrEur: 75,  revparAnnuelEur: 15900, saisonHaute: [3,4,5,10,11],       source: 'Turismo Andalucía 2024',                 tier: 'precise' },
  { ville: 'Palma',              pays: 'ES', occupationAnnuellePct: 70, adrEur: 130, revparAnnuelEur: 33200, saisonHaute: [4,5,6,7,8,9,10],   source: 'AETIB Turismo Illes Balears 2024',       tier: 'precise' },
  { ville: 'Ibiza',              pays: 'ES', occupationAnnuellePct: 62, adrEur: 210, revparAnnuelEur: 47500, saisonHaute: [5,6,7,8,9],         source: 'AETIB Turismo Illes Balears 2024',       tier: 'precise' },
  { ville: 'San Sebastián',      pays: 'ES', occupationAnnuellePct: 64, adrEur: 125, revparAnnuelEur: 29200, saisonHaute: [6,7,8,9],            source: 'Turismo Euskadi 2024',                   tier: 'precise' },

  // ─── Italie : top destinations CAV (Case e Appartamenti Vacanze) ────────
  { ville: 'Roma',               pays: 'IT', occupationAnnuellePct: 70, adrEur: 120, revparAnnuelEur: 30600, saisonHaute: [3,4,5,6,9,10,11],   source: 'ENIT + Roma Capitale Tourism 2024',      tier: 'precise' },
  { ville: 'Milano',             pays: 'IT', occupationAnnuellePct: 68, adrEur: 135, revparAnnuelEur: 33500, saisonHaute: [3,4,5,6,9,10,11],   source: 'ENIT + Comune Milano 2024',              tier: 'precise' },
  { ville: 'Firenze',            pays: 'IT', occupationAnnuellePct: 72, adrEur: 140, revparAnnuelEur: 36800, saisonHaute: [4,5,6,9,10],         source: 'Toscana Promozione Turistica 2024',      tier: 'precise' },
  { ville: 'Venezia',            pays: 'IT', occupationAnnuellePct: 75, adrEur: 170, revparAnnuelEur: 46500, saisonHaute: [3,4,5,6,7,9,10],     source: 'Regione Veneto Turismo + APT Venezia 2024', tier: 'precise' },
  { ville: 'Napoli',             pays: 'IT', occupationAnnuellePct: 62, adrEur: 80,  revparAnnuelEur: 18100, saisonHaute: [4,5,6,9,10],         source: 'Regione Campania Turismo 2024',          tier: 'precise' },
  { ville: 'Torino',             pays: 'IT', occupationAnnuellePct: 58, adrEur: 85,  revparAnnuelEur: 18000, saisonHaute: [4,5,9,10,11,12,1],   source: 'Turismo Torino 2024',                    tier: 'precise' },
  { ville: 'Bologna',            pays: 'IT', occupationAnnuellePct: 64, adrEur: 95,  revparAnnuelEur: 22200, saisonHaute: [3,4,5,9,10,11],      source: "APT Servizi Emilia-Romagna 2024",        tier: 'precise' },
  { ville: 'Verona',             pays: 'IT', occupationAnnuellePct: 62, adrEur: 100, revparAnnuelEur: 22600, saisonHaute: [4,5,6,7,9,10],       source: 'Verona Garda OGD 2024',                  tier: 'precise' },
  { ville: 'Cagliari',           pays: 'IT', occupationAnnuellePct: 60, adrEur: 90,  revparAnnuelEur: 19700, saisonHaute: [5,6,7,8,9],          source: 'ENIT Sardegna 2024',                     tier: 'precise' },
  { ville: 'Palermo',            pays: 'IT', occupationAnnuellePct: 58, adrEur: 75,  revparAnnuelEur: 15900, saisonHaute: [4,5,6,9,10],         source: 'Regione Siciliana Turismo 2024',         tier: 'precise' },

  // ─── Belgique : top destinations meublés de tourisme ────────────────────
  { ville: 'Bruxelles',          pays: 'BE', occupationAnnuellePct: 62, adrEur: 95,  revparAnnuelEur: 21500, saisonHaute: [4,5,6,7,9,10,12],    source: 'Visit Brussels + Statbel 2024',          tier: 'precise' },
  { ville: 'Brugge',             pays: 'BE', occupationAnnuellePct: 70, adrEur: 130, revparAnnuelEur: 33200, saisonHaute: [4,5,6,7,8,9,12],     source: 'Westtoer + Statbel 2024',                tier: 'precise' },
  { ville: 'Gent',               pays: 'BE', occupationAnnuellePct: 65, adrEur: 95,  revparAnnuelEur: 22500, saisonHaute: [4,5,6,7,8,9],         source: 'Visit Gent + Toerisme Vlaanderen 2024',  tier: 'precise' },
  { ville: 'Antwerpen',          pays: 'BE', occupationAnnuellePct: 60, adrEur: 95,  revparAnnuelEur: 20800, saisonHaute: [4,5,6,7,8,9,12],     source: 'Toerisme Vlaanderen 2024',               tier: 'precise' },
  { ville: 'Liège',              pays: 'BE', occupationAnnuellePct: 55, adrEur: 70,  revparAnnuelEur: 14100, saisonHaute: [5,6,7,8,12],          source: 'Visit Wallonia 2024',                    tier: 'precise' },

  // ─── Allemagne : top destinations Ferienwohnungen ───────────────────────
  { ville: 'Berlin',             pays: 'DE', occupationAnnuellePct: 65, adrEur: 95,  revparAnnuelEur: 22500, saisonHaute: [4,5,6,7,8,9,12],     source: 'visitBerlin + DZT 2024',                 tier: 'precise' },
  { ville: 'München',            pays: 'DE', occupationAnnuellePct: 70, adrEur: 120, revparAnnuelEur: 30700, saisonHaute: [4,5,6,7,8,9,10,12],  source: 'München Tourismus + DZT 2024',           tier: 'precise' },
  { ville: 'Hamburg',            pays: 'DE', occupationAnnuellePct: 62, adrEur: 95,  revparAnnuelEur: 21500, saisonHaute: [5,6,7,8,9,12],        source: 'Hamburg Tourismus + DZT 2024',           tier: 'precise' },
  { ville: 'Köln',               pays: 'DE', occupationAnnuellePct: 58, adrEur: 85,  revparAnnuelEur: 18000, saisonHaute: [4,5,6,7,8,9,12],     source: 'KölnTourismus + DZT 2024',               tier: 'precise' },
  { ville: 'Frankfurt am Main',  pays: 'DE', occupationAnnuellePct: 62, adrEur: 115, revparAnnuelEur: 26000, saisonHaute: [3,4,5,9,10,11],       source: 'Tourismus+Congress Frankfurt + DZT 2024', tier: 'precise' },

  // ─── Pays-Bas : top destinations vakantiewoningen ───────────────────────
  // Amsterdam : très restrictif (max 30 nuits/an par particulier) → l'occupation
  // marché reflète les pros opérant en CIN/licence pas les locations privées.
  { ville: 'Amsterdam',          pays: 'NL', occupationAnnuellePct: 72, adrEur: 145, revparAnnuelEur: 38100, saisonHaute: [4,5,6,7,8,9,12],     source: 'NBTC Holland Marketing + CBS 2024',      tier: 'precise' },
  { ville: 'Rotterdam',          pays: 'NL', occupationAnnuellePct: 62, adrEur: 95,  revparAnnuelEur: 21500, saisonHaute: [5,6,7,8,9],            source: 'Rotterdam Partners + CBS 2024',          tier: 'precise' },
  { ville: 'Den Haag',           pays: 'NL', occupationAnnuellePct: 58, adrEur: 85,  revparAnnuelEur: 18000, saisonHaute: [5,6,7,8,9],            source: 'The Hague Convention Bureau + CBS 2024', tier: 'precise' },
  { ville: 'Utrecht',            pays: 'NL', occupationAnnuellePct: 60, adrEur: 90,  revparAnnuelEur: 19700, saisonHaute: [4,5,6,7,8,9],          source: 'Utrecht Marketing + CBS 2024',           tier: 'precise' },
  { ville: 'Eindhoven',          pays: 'NL', occupationAnnuellePct: 55, adrEur: 75,  revparAnnuelEur: 15100, saisonHaute: [4,5,6,9,10],            source: 'Eindhoven Tourism + CBS 2024',           tier: 'precise' },

  // ─── Autriche : top destinations Ferienwohnungen ────────────────────────
  { ville: 'Wien',               pays: 'AT', occupationAnnuellePct: 68, adrEur: 95,  revparAnnuelEur: 23600, saisonHaute: [4,5,6,7,8,9,12],     source: 'WienTourismus + Statistik Austria 2024', tier: 'precise' },
  { ville: 'Salzburg',           pays: 'AT', occupationAnnuellePct: 70, adrEur: 125, revparAnnuelEur: 31900, saisonHaute: [6,7,8,12,1,2],         source: 'SalzburgerLand + Statistik Austria 2024', tier: 'precise' },
  { ville: 'Innsbruck',          pays: 'AT', occupationAnnuellePct: 65, adrEur: 105, revparAnnuelEur: 24900, saisonHaute: [12,1,2,3,7,8],          source: 'Innsbruck Tourismus + Statistik Austria 2024', tier: 'precise' },
  { ville: 'Graz',               pays: 'AT', occupationAnnuellePct: 58, adrEur: 75,  revparAnnuelEur: 15900, saisonHaute: [5,6,7,8,9],            source: 'Graz Tourismus + Statistik Austria 2024', tier: 'precise' },
  { ville: 'Hallstatt',          pays: 'AT', occupationAnnuellePct: 72, adrEur: 145, revparAnnuelEur: 38100, saisonHaute: [5,6,7,8,9,12],         source: 'Salzkammergut Tourismus 2024',           tier: 'precise' },

  // ─── Suisse : top destinations Ferienwohnungen ──────────────────────────
  // ADR converti CHF → EUR à taux moyen 2024 ~0,95 EUR/CHF, indicatif.
  { ville: 'Zürich',             pays: 'CH', occupationAnnuellePct: 65, adrEur: 175, revparAnnuelEur: 41500, saisonHaute: [5,6,7,8,9,12],         source: 'Zürich Tourismus + OFS 2024',            tier: 'precise', currencyNote: '≈ 185 CHF' },
  { ville: 'Genève',             pays: 'CH', occupationAnnuellePct: 68, adrEur: 195, revparAnnuelEur: 48400, saisonHaute: [4,5,6,7,8,9,10],       source: 'Genève Tourisme + OFS 2024',             tier: 'precise', currencyNote: '≈ 205 CHF' },
  { ville: 'Bern',               pays: 'CH', occupationAnnuellePct: 58, adrEur: 145, revparAnnuelEur: 30700, saisonHaute: [5,6,7,8,9],             source: 'Bern Welcome + OFS 2024',                tier: 'precise', currencyNote: '≈ 153 CHF' },
  { ville: 'Lausanne',           pays: 'CH', occupationAnnuellePct: 62, adrEur: 160, revparAnnuelEur: 36200, saisonHaute: [5,6,7,8,9],             source: 'Lausanne Tourisme + OFS 2024',           tier: 'precise', currencyNote: '≈ 168 CHF' },
  { ville: 'Interlaken',         pays: 'CH', occupationAnnuellePct: 70, adrEur: 170, revparAnnuelEur: 43400, saisonHaute: [6,7,8,12,1,2,3],         source: 'Interlaken Tourismus + OFS 2024',        tier: 'precise', currencyNote: '≈ 179 CHF' },
]

// Moyennes nationales — fallback quand la ville n'est pas dans la liste.
const COUNTRY_BENCHMARKS: MarketBenchmark[] = [
  { ville: 'France (moyenne nationale)',   pays: 'FR', occupationAnnuellePct: 52, adrEur: 85,  revparAnnuelEur: 16100, saisonHaute: [6,7,8,9],          source: 'DGE Mémento Tourisme 2024 + INSEE',                      tier: 'national' },
  { ville: 'Portugal (moyenne nationale)', pays: 'PT', occupationAnnuellePct: 60, adrEur: 80,  revparAnnuelEur: 17500, saisonHaute: [5,6,7,8,9,10],     source: 'INE + Turismo de Portugal 2024',                         tier: 'national' },
  { ville: 'Espagne (moyenne nationale)',  pays: 'ES', occupationAnnuellePct: 60, adrEur: 90,  revparAnnuelEur: 19700, saisonHaute: [5,6,7,8,9],         source: 'INE Encuesta de Ocupación Apartamentos Turísticos 2024', tier: 'national' },
  { ville: 'Italie (moyenne nationale)',   pays: 'IT', occupationAnnuellePct: 58, adrEur: 95,  revparAnnuelEur: 20100, saisonHaute: [4,5,6,7,8,9,10],   source: 'ISTAT + ENIT 2024',                                      tier: 'national' },
  { ville: 'Belgique (moyenne nationale)', pays: 'BE', occupationAnnuellePct: 55, adrEur: 85,  revparAnnuelEur: 17100, saisonHaute: [5,6,7,8,9],         source: 'Statbel + offices régionaux 2024',                       tier: 'national' },
  { ville: 'Allemagne (moyenne nationale)', pays: 'DE', occupationAnnuellePct: 58, adrEur: 90, revparAnnuelEur: 19100, saisonHaute: [5,6,7,8,9,12],     source: 'DZT + Statistisches Bundesamt 2024',                     tier: 'national' },
  { ville: 'Pays-Bas (moyenne nationale)', pays: 'NL', occupationAnnuellePct: 60, adrEur: 100, revparAnnuelEur: 21900, saisonHaute: [5,6,7,8,9],         source: 'CBS Statistics Netherlands + NBTC 2024',                tier: 'national' },
  { ville: 'Autriche (moyenne nationale)', pays: 'AT', occupationAnnuellePct: 62, adrEur: 95,  revparAnnuelEur: 21500, saisonHaute: [6,7,8,12,1,2],      source: 'Statistik Austria + Österreich Werbung 2024',           tier: 'national' },
  { ville: 'Suisse (moyenne nationale)',   pays: 'CH', occupationAnnuellePct: 60, adrEur: 165, revparAnnuelEur: 36100, saisonHaute: [6,7,8,12,1,2],      source: 'OFS Office fédéral statistique + Suisse Tourisme 2024',  tier: 'national', currencyNote: '≈ 174 CHF' },
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
  const isCountry = /^(france|portugal|espa[ñn]a|spain|italia|italy|belgi[qe][uo]e|belgium|switzerland|suisse|schweiz|deutschland|germany|allemagne|nederland|netherlands|pays[\s-]?bas|österreich|austria|autriche)$/i.test(last)
  const candidate = isCountry && parts.length >= 2 ? parts[parts.length - 2] : last
  // On vire les chiffres en début (code postal nu)
  return candidate.replace(/^\d+\s*/, '').trim() || null
}

/**
 * Trouve le benchmark le plus précis pour une ville + pays.
 * Match exact normalisé → match partiel → moyenne pays.
 */
export function findMarketBenchmark(ville: string | null | undefined, pays: string = 'FR'): MarketBenchmark | null {
  const countryCode = (pays || 'FR').toUpperCase() as MarketBenchmark['pays']
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

export function citiesByCountry(pays: MarketBenchmark['pays']): MarketBenchmark[] {
  return CITY_BENCHMARKS.filter(b => b.pays === pays).sort((a, b) => a.ville.localeCompare(b.ville, 'fr'))
}

// Tous les pays couverts (utile pour les selects UI)
export const SUPPORTED_COUNTRIES: Array<{ code: MarketBenchmark['pays']; flag: string; label: string }> = [
  { code: 'FR', flag: '🇫🇷', label: 'France' },
  { code: 'PT', flag: '🇵🇹', label: 'Portugal' },
  { code: 'ES', flag: '🇪🇸', label: 'Espagne' },
  { code: 'IT', flag: '🇮🇹', label: 'Italie' },
  { code: 'BE', flag: '🇧🇪', label: 'Belgique' },
  { code: 'DE', flag: '🇩🇪', label: 'Allemagne' },
  { code: 'NL', flag: '🇳🇱', label: 'Pays-Bas' },
  { code: 'AT', flag: '🇦🇹', label: 'Autriche' },
  { code: 'CH', flag: '🇨🇭', label: 'Suisse' },
]

// ─── Multipliers (synchronisés avec /calculateurs/engine.js public) ─────────
const TYPE_MULT: Record<string, number> = { studio: 0.75, t1: 0.85, t2: 1.00, t3: 1.15, maison: 1.30 }
const CHAMBRES_MULT: Record<number, number> = { 0: 0.85, 1: 0.90, 2: 1.00, 3: 1.15, 4: 1.30 }
const MODE_MULT: Record<string, number> = {
  'toute-annee': 1.00, 'saisonnier-ete': 0.45, 'saisonnier-hiver': 0.45, 'weekends': 0.30,
}
const SEASON_COEF = { high: 1.25, neutral: 1.00, low: 0.85 } as const
const CHANNEL_ADJ: Record<string, number> = {
  airbnb: 1.03, booking: 1.18, direct: 0.95, mix: 1.05,
}

// ─── Estimation revenus annuels d'une LCD selon la ville + le bien ──────────
export type EstimateRevenueInput = {
  pays: MarketBenchmark['pays']
  ville?: string | null
  typeLogement: string                  // 'studio' | 't1' | 't2' | 't3' | 'maison'
  nbChambres: number                    // 0-4+
  mode: string                          // 'toute-annee' | 'saisonnier-ete' | 'saisonnier-hiver' | 'weekends'
  /** Override l'ADR base (utile pour préfilé avec le tarif réel du logement) */
  adrOverride?: number | null
}
export type EstimateRevenueResult = {
  bench: MarketBenchmark | null
  city: string
  adr: number
  occupation: number      // 0-100
  revenuAnnuel: number
  revenuLow: number       // -20 %
  revenuHigh: number      // +20 %
  revpar: number
  monthly: Array<{ month: number; revenu: number; isHigh: boolean }>
  source: string
}

export function estimateRevenue(input: EstimateRevenueInput): EstimateRevenueResult {
  const bench = findMarketBenchmark(input.ville, input.pays)
  const countryAvg = COUNTRY_BENCHMARKS.find(b => b.pays === input.pays) ?? COUNTRY_BENCHMARKS[0]
  const baseOcc = (bench?.occupationAnnuellePct ?? countryAvg.occupationAnnuellePct) / 100
  const baseAdr = input.adrOverride && input.adrOverride > 0
    ? input.adrOverride
    : (bench?.adrEur ?? countryAvg.adrEur)
  const sourceLabel = bench
    ? bench.source
    : `${countryAvg.source} (moyenne pays — ville non listée)`

  const typeMult = TYPE_MULT[input.typeLogement] ?? 1.00
  const chambresMult = CHAMBRES_MULT[Math.min(4, Math.max(0, input.nbChambres || 0))] ?? 1.00
  const modeMult = MODE_MULT[input.mode] ?? 1.00

  // adrOverride : on utilise tel quel (déjà calibré au bien réel), sinon on
  // ajuste avec type+chambres pour partir de l'ADR marché vers une estimation
  // adaptée au bien décrit.
  const adjustedAdr = input.adrOverride && input.adrOverride > 0
    ? baseAdr
    : baseAdr * typeMult * chambresMult
  const adjustedOcc = Math.min(0.95, baseOcc * modeMult)
  const revenuAnnuel = Math.round(adjustedAdr * 365 * adjustedOcc)

  // Répartition mensuelle (pondération haute/basse saison)
  const weights: number[] = []
  let totalW = 0
  for (let m = 1; m <= 12; m++) {
    const isHigh = bench ? bench.saisonHaute.includes(m) : [6, 7, 8, 9].includes(m)
    const w = isHigh ? 1.3 : Math.abs(6.5 - m) > 4.5 ? 0.7 : 1.0
    weights.push(w)
    totalW += w
  }
  const monthly = weights.map((w, i) => ({
    month: i + 1,
    revenu: Math.round(revenuAnnuel * (w / totalW)),
    isHigh: bench ? bench.saisonHaute.includes(i + 1) : [6, 7, 8, 9].includes(i + 1),
  }))

  return {
    bench,
    city: bench?.ville ?? input.ville ?? 'Ville inconnue',
    adr: Math.round(adjustedAdr),
    occupation: Math.round(adjustedOcc * 100),
    revenuAnnuel,
    revenuLow: Math.round(revenuAnnuel * 0.80),
    revenuHigh: Math.round(revenuAnnuel * 1.20),
    revpar: Math.round(adjustedAdr * adjustedOcc),
    monthly,
    source: sourceLabel,
  }
}

// ─── Calculateur prix par nuit selon ville + mois + canal ───────────────────
export type CalculatePriceInput = {
  pays: MarketBenchmark['pays']
  ville?: string | null
  typeLogement: string
  nbChambres: number
  month: number                         // 1-12
  channel: string                       // 'airbnb' | 'booking' | 'direct' | 'mix'
  /** Override l'ADR base (utile pour partir du tarif réel du logement) */
  adrOverride?: number | null
}
export type CalculatePriceResult = {
  bench: MarketBenchmark | null
  city: string
  basePrice: number
  weekPrice: number
  weekendPrice: number
  minPrice: number
  maxPrice: number
  marketAdr: number
  adjustedAdr: number
  yearPricing: Array<{ month: number; price: number; weekend: number; isHigh: boolean }>
  source: string
}

export function calculatePrice(input: CalculatePriceInput): CalculatePriceResult {
  const bench = findMarketBenchmark(input.ville, input.pays)
  const countryAvg = COUNTRY_BENCHMARKS.find(b => b.pays === input.pays) ?? COUNTRY_BENCHMARKS[0]
  const baseAdr = bench?.adrEur ?? countryAvg.adrEur
  const sourceLabel = bench ? bench.source : `${countryAvg.source} (moyenne pays)`
  const saisonHaute = bench?.saisonHaute ?? [6, 7, 8, 9]

  const typeMult = TYPE_MULT[input.typeLogement] ?? 1.00
  const chambresMult = CHAMBRES_MULT[Math.min(4, Math.max(0, input.nbChambres || 0))] ?? 1.00
  // adrOverride = ton vrai ADR observé → on l'utilise comme base sans réajuster
  const adjustedAdr = input.adrOverride && input.adrOverride > 0
    ? input.adrOverride
    : baseAdr * typeMult * chambresMult

  const channelMult = CHANNEL_ADJ[input.channel] ?? 1.00
  const monthCoef = saisonHaute.includes(input.month) ? SEASON_COEF.high
    : Math.abs(6.5 - input.month) > 4.5 ? SEASON_COEF.low
    : SEASON_COEF.neutral

  const basePrice = Math.round(adjustedAdr * monthCoef * channelMult)
  const weekPrice = Math.round(basePrice * 0.92)
  const weekendPrice = Math.round(basePrice * 1.20)
  const minPrice = Math.round(basePrice * 0.75)
  const maxPrice = Math.round(basePrice * 1.45)

  const yearPricing = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const c = saisonHaute.includes(m) ? SEASON_COEF.high
      : Math.abs(6.5 - m) > 4.5 ? SEASON_COEF.low
      : SEASON_COEF.neutral
    const price = Math.round(adjustedAdr * c * channelMult)
    return {
      month: m,
      price,
      weekend: Math.round(price * 1.20),
      isHigh: saisonHaute.includes(m),
    }
  })

  return {
    bench,
    city: bench?.ville ?? input.ville ?? 'Ville inconnue',
    basePrice, weekPrice, weekendPrice, minPrice, maxPrice,
    marketAdr: Math.round(baseAdr),
    adjustedAdr: Math.round(adjustedAdr),
    yearPricing,
    source: sourceLabel,
  }
}
