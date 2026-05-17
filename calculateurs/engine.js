// Engine partagé pour les calculateurs publics LCD.
// Données alignées sur jason-app/lib/lcd/market-benchmarks.ts (sources publiques :
// DGE Mémento Tourisme 2024, INSEE, CRT régionaux pour FR ; INE + Turismo de
// Portugal 2024 pour PT). Synchroniser lors d'une mise à jour annuelle.

(function (root) {
  'use strict'

  // ─── Benchmarks marché : 25 villes FR + 12 villes PT ─────────────────────
  var CITY_BENCHMARKS = [
    // France
    { ville: 'Paris',           pays: 'FR', occ: 68, adr: 135, revpar: 33500, saisonHaute: [5,6,7,8,9],     source: "CRT Île-de-France 2024" },
    { ville: 'Marseille',       pays: 'FR', occ: 62, adr: 95,  revpar: 21500, saisonHaute: [6,7,8,9],       source: 'CRT PACA 2024' },
    { ville: 'Lyon',            pays: 'FR', occ: 65, adr: 90,  revpar: 21300, saisonHaute: [4,5,6,9,10,11], source: 'OnlyLyon Tourisme 2024' },
    { ville: 'Bordeaux',        pays: 'FR', occ: 60, adr: 95,  revpar: 20800, saisonHaute: [5,6,7,8,9],     source: 'Office Tourisme Bordeaux 2024' },
    { ville: 'Nice',            pays: 'FR', occ: 64, adr: 110, revpar: 25700, saisonHaute: [5,6,7,8,9],     source: "CRT Côte d'Azur 2024" },
    { ville: 'Toulouse',        pays: 'FR', occ: 55, adr: 78,  revpar: 15700, saisonHaute: [5,6,9,10],      source: 'CRT Occitanie 2024' },
    { ville: 'Strasbourg',      pays: 'FR', occ: 58, adr: 85,  revpar: 18000, saisonHaute: [6,7,8,11,12],   source: 'CRT Grand Est 2024' },
    { ville: 'Nantes',          pays: 'FR', occ: 56, adr: 80,  revpar: 16400, saisonHaute: [5,6,7,8,9],     source: 'CRT Pays de la Loire 2024' },
    { ville: 'Montpellier',     pays: 'FR', occ: 58, adr: 88,  revpar: 18600, saisonHaute: [5,6,7,8,9],     source: 'CRT Occitanie 2024' },
    { ville: 'Lille',           pays: 'FR', occ: 54, adr: 75,  revpar: 14800, saisonHaute: [4,5,6,9,10,11], source: 'CRT Hauts-de-France 2024' },
    { ville: 'Rennes',          pays: 'FR', occ: 55, adr: 75,  revpar: 15100, saisonHaute: [5,6,7,8],       source: 'CRT Bretagne 2024' },
    { ville: 'Annecy',          pays: 'FR', occ: 70, adr: 130, revpar: 33200, saisonHaute: [6,7,8,12,1,2],  source: 'Office Tourisme Annecy 2024' },
    { ville: 'La Rochelle',     pays: 'FR', occ: 62, adr: 100, revpar: 22600, saisonHaute: [5,6,7,8,9],     source: 'CRT Nouvelle-Aquitaine 2024' },
    { ville: 'Cannes',          pays: 'FR', occ: 60, adr: 145, revpar: 31700, saisonHaute: [5,6,7,8,9],     source: "CRT Côte d'Azur 2024" },
    { ville: 'Biarritz',        pays: 'FR', occ: 64, adr: 135, revpar: 31500, saisonHaute: [6,7,8,9],       source: 'CRT Nouvelle-Aquitaine 2024' },
    { ville: 'Aix-en-Provence', pays: 'FR', occ: 62, adr: 105, revpar: 23700, saisonHaute: [5,6,7,8,9],     source: 'CRT PACA 2024' },
    { ville: 'Avignon',         pays: 'FR', occ: 56, adr: 95,  revpar: 19400, saisonHaute: [6,7,8],         source: 'CRT PACA 2024 (festival)' },
    { ville: 'Dijon',           pays: 'FR', occ: 50, adr: 75,  revpar: 13700, saisonHaute: [5,6,9,10,11],   source: 'CRT Bourgogne-Franche-Comté 2024' },
    { ville: 'Reims',           pays: 'FR', occ: 54, adr: 80,  revpar: 15800, saisonHaute: [5,6,7,8,9,12],  source: 'CRT Grand Est 2024' },
    { ville: 'Tours',           pays: 'FR', occ: 52, adr: 72,  revpar: 13700, saisonHaute: [5,6,7,8,9],     source: 'CRT Centre-Val de Loire 2024' },
    { ville: 'Saint-Malo',      pays: 'FR', occ: 60, adr: 110, revpar: 24100, saisonHaute: [6,7,8,9],       source: 'CRT Bretagne 2024' },
    { ville: 'Honfleur',        pays: 'FR', occ: 58, adr: 120, revpar: 25400, saisonHaute: [4,5,6,7,8,9],   source: 'CRT Normandie 2024' },
    { ville: 'Deauville',       pays: 'FR', occ: 56, adr: 145, revpar: 29600, saisonHaute: [4,5,6,7,8,9],   source: 'CRT Normandie 2024' },
    { ville: 'Saint-Tropez',    pays: 'FR', occ: 52, adr: 280, revpar: 53100, saisonHaute: [6,7,8,9],       source: "CRT Côte d'Azur 2024" },
    { ville: 'Chamonix',        pays: 'FR', occ: 70, adr: 165, revpar: 42100, saisonHaute: [12,1,2,3,7,8],  source: 'Office Tourisme Chamonix 2024' },
    { ville: 'Antibes',         pays: 'FR', occ: 60, adr: 115, revpar: 25100, saisonHaute: [5,6,7,8,9],     source: "CRT Côte d'Azur 2024" },
    // Portugal
    { ville: 'Lisboa',          pays: 'PT', occ: 72, adr: 115, revpar: 30200, saisonHaute: [4,5,6,7,8,9,10],    source: 'Turismo de Portugal RNAL 2024' },
    { ville: 'Porto',           pays: 'PT', occ: 70, adr: 95,  revpar: 24300, saisonHaute: [4,5,6,7,8,9,10],    source: 'Turismo de Portugal RNAL 2024' },
    { ville: 'Faro',            pays: 'PT', occ: 65, adr: 90,  revpar: 21400, saisonHaute: [5,6,7,8,9],         source: 'Turismo Algarve 2024' },
    { ville: 'Coimbra',         pays: 'PT', occ: 55, adr: 65,  revpar: 13100, saisonHaute: [5,6,7,8,9],         source: 'Turismo Centro 2024' },
    { ville: 'Braga',           pays: 'PT', occ: 50, adr: 60,  revpar: 11000, saisonHaute: [5,6,7,8,9],         source: 'Turismo Norte 2024' },
    { ville: 'Funchal',         pays: 'PT', occ: 75, adr: 105, revpar: 28800, saisonHaute: [3,4,5,6,7,8,9,10],  source: 'Turismo Madeira 2024' },
    { ville: 'Évora',           pays: 'PT', occ: 52, adr: 70,  revpar: 13300, saisonHaute: [4,5,6,9,10],        source: 'Turismo Alentejo 2024' },
    { ville: 'Cascais',         pays: 'PT', occ: 68, adr: 130, revpar: 32300, saisonHaute: [5,6,7,8,9],         source: 'Turismo Lisboa Cascais 2024' },
    { ville: 'Ericeira',        pays: 'PT', occ: 65, adr: 95,  revpar: 22500, saisonHaute: [5,6,7,8,9],         source: 'Turismo Oeste 2024' },
    { ville: 'Aveiro',          pays: 'PT', occ: 58, adr: 75,  revpar: 15900, saisonHaute: [5,6,7,8,9],         source: 'Turismo Centro 2024' },
    { ville: 'Albufeira',       pays: 'PT', occ: 68, adr: 105, revpar: 26100, saisonHaute: [5,6,7,8,9],         source: 'Turismo Algarve 2024' },
    { ville: 'Lagos',           pays: 'PT', occ: 65, adr: 100, revpar: 23700, saisonHaute: [5,6,7,8,9],         source: 'Turismo Algarve 2024' },
  ]

  var COUNTRY_AVG = {
    FR: { occ: 52, adr: 85, source: 'DGE Mémento Tourisme 2024 + INSEE' },
    PT: { occ: 60, adr: 80, source: 'INE + Turismo de Portugal 2024' },
  }

  // ─── Multipliers pour ajustement par caractéristiques bien ────────────────
  // Indicatifs, alignés sur les observations marché LCD (différentiel typique
  // observé sur Airbnb/Booking entre studio et T3+ dans une même ville).
  var TYPE_MULT = { studio: 0.75, t1: 0.85, t2: 1.00, t3: 1.15, maison: 1.30 }
  var CHAMBRES_MULT = { 0: 0.85, 1: 0.90, 2: 1.00, 3: 1.15, 4: 1.30 }

  // Mode d'exploitation : impact sur occupation annuelle
  // Toute l'année = full ; saisonnier été/hiver = 3 mois forts ; weekends = ~30%
  var MODE_MULT = {
    'toute-annee': 1.00,
    'saisonnier-ete': 0.45,
    'saisonnier-hiver': 0.45,
    'weekends': 0.30,
  }

  // Coefficient saisonnier mensuel (haute / neutre / basse)
  var SEASON_COEF = { high: 1.25, neutral: 1.00, low: 0.85 }

  // Ajustement par canal de réservation (impact net sur le PRIX AFFICHÉ
  // recommandé, pour compenser ou capturer la commission)
  // Airbnb prélève ~3% côté hôte (host-only). Booking ~15%. Direct = 0%.
  var CHANNEL_ADJ = {
    airbnb: 1.03,   // affiche +3% pour neutraliser la commission hôte
    booking: 1.18,  // affiche +18% pour neutraliser la commission Booking
    direct: 0.95,   // -5% : tu peux te permettre légèrement moins cher (pas de commission)
    mix: 1.05,
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function norm(s) {
    if (!s) return ''
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
  }

  function findCity(ville, pays) {
    pays = (pays || 'FR').toUpperCase()
    if (!ville) return null
    var t = norm(ville)
    var exact = CITY_BENCHMARKS.filter(function (b) { return b.pays === pays && norm(b.ville) === t })[0]
    if (exact) return exact
    var partial = CITY_BENCHMARKS.filter(function (b) {
      return b.pays === pays && (t.indexOf(norm(b.ville)) !== -1 || norm(b.ville).indexOf(t) !== -1)
    })[0]
    return partial || null
  }

  function citiesByCountry(pays) {
    return CITY_BENCHMARKS.filter(function (b) { return b.pays === pays }).sort(function (a, b) {
      return a.ville.localeCompare(b.ville, 'fr')
    })
  }

  // ─── Estimateur de revenus ────────────────────────────────────────────────
  function estimateRevenue(input) {
    // input = { pays, ville, typeLogement, nbChambres, mode }
    var bench = findCity(input.ville, input.pays)
    var baseOcc, baseAdr, sourceLabel
    if (bench) {
      baseOcc = bench.occ / 100
      baseAdr = bench.adr
      sourceLabel = bench.source
    } else {
      var avg = COUNTRY_AVG[input.pays] || COUNTRY_AVG.FR
      baseOcc = avg.occ / 100
      baseAdr = avg.adr
      sourceLabel = avg.source + ' (moyenne pays — ville non listée)'
    }

    var typeMult = TYPE_MULT[input.typeLogement] || 1.00
    var chambresMult = CHAMBRES_MULT[Math.min(4, Math.max(0, input.nbChambres || 0))] || 1.00
    var modeMult = MODE_MULT[input.mode] || 1.00

    var adjustedAdr = baseAdr * typeMult * chambresMult
    var adjustedOcc = Math.min(0.95, baseOcc * modeMult)
    var revenuAnnuel = Math.round(adjustedAdr * 365 * adjustedOcc)

    // Fourchette : ±20% pour refléter l'incertitude (météo, événements,
    // qualité du bien, photos, prix concurrent, etc.)
    var revLow = Math.round(revenuAnnuel * 0.80)
    var revHigh = Math.round(revenuAnnuel * 1.20)

    // Breakdown mensuel
    var monthly = []
    var totalUnitWeight = 0
    var unitWeights = []
    for (var m = 1; m <= 12; m++) {
      var w = (bench && bench.saisonHaute.indexOf(m) !== -1) ? 1.3
            : (Math.abs(6.5 - m) > 4.5 ? 0.7 : 1.0)
      unitWeights.push(w)
      totalUnitWeight += w
    }
    for (var i = 0; i < 12; i++) {
      var revMonth = Math.round(revenuAnnuel * (unitWeights[i] / totalUnitWeight))
      monthly.push({ month: i + 1, revenu: revMonth, isHigh: bench && bench.saisonHaute.indexOf(i + 1) !== -1 })
    }

    return {
      bench: bench,
      city: bench ? bench.ville : (input.ville || 'Ville inconnue'),
      adr: Math.round(adjustedAdr),
      occupation: Math.round(adjustedOcc * 100),
      revenuAnnuel: revenuAnnuel,
      revenuLow: revLow,
      revenuHigh: revHigh,
      monthly: monthly,
      source: sourceLabel,
      // RevPAR théorique
      revpar: Math.round(adjustedAdr * adjustedOcc),
    }
  }

  // ─── Calculateur de prix ──────────────────────────────────────────────────
  function calculatePrice(input) {
    // input = { pays, ville, typeLogement, nbChambres, month (1-12), channel }
    var bench = findCity(input.ville, input.pays)
    var baseAdr, sourceLabel, saisonHaute
    if (bench) {
      baseAdr = bench.adr
      sourceLabel = bench.source
      saisonHaute = bench.saisonHaute
    } else {
      var avg = COUNTRY_AVG[input.pays] || COUNTRY_AVG.FR
      baseAdr = avg.adr
      sourceLabel = avg.source + ' (moyenne pays)'
      saisonHaute = [6, 7, 8, 9]
    }

    var typeMult = TYPE_MULT[input.typeLogement] || 1.00
    var chambresMult = CHAMBRES_MULT[Math.min(4, Math.max(0, input.nbChambres || 0))] || 1.00
    var adjustedAdr = baseAdr * typeMult * chambresMult

    var monthCoef = saisonHaute.indexOf(input.month) !== -1 ? SEASON_COEF.high
                  : Math.abs(6.5 - input.month) > 4.5 ? SEASON_COEF.low
                  : SEASON_COEF.neutral
    var channelMult = CHANNEL_ADJ[input.channel] || 1.00

    var basePrice = Math.round(adjustedAdr * monthCoef * channelMult)
    var weekPrice = Math.round(basePrice * 0.92)
    var weekendPrice = Math.round(basePrice * 1.20)
    var minPrice = Math.round(basePrice * 0.75)
    var maxPrice = Math.round(basePrice * 1.45)

    // Prix par mois sur l'année entière
    var yearPricing = []
    for (var m = 1; m <= 12; m++) {
      var c = saisonHaute.indexOf(m) !== -1 ? SEASON_COEF.high
            : Math.abs(6.5 - m) > 4.5 ? SEASON_COEF.low
            : SEASON_COEF.neutral
      yearPricing.push({
        month: m,
        price: Math.round(adjustedAdr * c * channelMult),
        weekend: Math.round(adjustedAdr * c * channelMult * 1.20),
        isHigh: saisonHaute.indexOf(m) !== -1,
      })
    }

    return {
      bench: bench,
      city: bench ? bench.ville : (input.ville || 'Ville inconnue'),
      basePrice: basePrice,
      weekPrice: weekPrice,
      weekendPrice: weekendPrice,
      minPrice: minPrice,
      maxPrice: maxPrice,
      marketAdr: Math.round(baseAdr),
      adjustedAdr: Math.round(adjustedAdr),
      yearPricing: yearPricing,
      source: sourceLabel,
    }
  }

  // Exposer en global
  root.JMCalc = {
    CITIES: CITY_BENCHMARKS,
    COUNTRY_AVG: COUNTRY_AVG,
    findCity: findCity,
    citiesByCountry: citiesByCountry,
    estimateRevenue: estimateRevenue,
    calculatePrice: calculatePrice,
    MONTHS: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
    MONTHS_SHORT: ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'],
  }
})(window);
