(function () {
  'use strict';

  // ── SOURCE UNIQUE DE VÉRITÉ ───────────────────────────────────────────────
  // Pour ajouter une ville : ajouter un objet ici.
  // Footer, page /villes et compteur homepage se mettent à jour automatiquement.
  var CITIES = [
    { slug: 'lyon',            name: 'Lyon',            adr: '75-130 €/nuit',  occ: "68 % d'occupation", ann: '~6 200 annonces', desc: "Capitale gastronomique française, zone tendue avec règle de compensation stricte. Marchés Eurexpo, Fête des Lumières, fort tourisme d'affaires." },
    { slug: 'bordeaux',        name: 'Bordeaux',        adr: '75-125 €/nuit',  occ: "65 % d'occupation", ann: '~5 100 annonces', desc: "Ville UNESCO, marché LCD en croissance, clientèle œnotouristique et affaires. Zone tendue avec des procédures de changement d'usage de plus en plus strictes." },
    { slug: 'annecy',          name: 'Annecy',          adr: '90-150 €/nuit',  occ: "64 % d'occupation", ann: '~3 800 annonces', desc: "La Venise des Alpes. Marché LCD ultra-saisonnier avec un été exceptionnel. Lac, vieille ville, VTT, randonnée, une clientèle familiale et outdoor premium." },
    { slug: 'nice',            name: 'Nice',            adr: '95-160 €/nuit',  occ: "72 % d'occupation", ann: '~8 500 annonces', desc: "Côte d'Azur, marché premium avec l'un des meilleurs RevPAR de France hors Paris. Carnaval en février, haute saison estivale exceptionnelle, clientèle internationale." },
    { slug: 'strasbourg',      name: 'Strasbourg',      adr: '80-140 €/nuit',  occ: "68 % d'occupation", ann: '~4 200 annonces', desc: "Unique en France : marchés de Noël (2M visiteurs) + Parlement européen (12 sessions/an). Marché bipolaire tourisme/institutionnel avec un potentiel exceptionnel." },
    { slug: 'biarritz',        name: 'Biarritz',        adr: '110-200 €/nuit', occ: "63 % d'occupation", ann: '~3 100 annonces', desc: "Surf, luxe, Pays Basque. Marché fortement saisonnier (été + Ironman + festivals surf) avec des ADR parmi les plus élevés du Sud-Ouest. Clientèle espagnole à ne pas négliger." },
    { slug: 'la-rochelle',     name: 'La Rochelle',     adr: '80-140 €/nuit',  occ: "65 % d'occupation", ann: '~2 800 annonces', desc: "Vieux-Port, tourisme nautique, Francofolies et Route du Rhum tous les 4 ans. Marché moins saturé que les grandes métropoles avec des prix d'achat encore accessibles." },
    { slug: 'marseille',       name: 'Marseille',       adr: '70-130 €/nuit',  occ: "68 % d'occupation", ann: '~7 800 annonces', desc: "Vieux-Port, MuCEM, calanques, Cours Julien, un marché LCD en pleine croissance. Réglementation zone tendue stricte mais demande touristique forte et prix d'achat encore raisonnables." },
    { slug: 'toulouse',        name: 'Toulouse',        adr: '65-110 €/nuit',  occ: "70 % d'occupation", ann: '~5 600 annonces', desc: "Capitale aérospatiale (Airbus), 100k étudiants, rugby (Stade Toulousain). Marché 3-en-1 avec demande continue toute l'année grâce à la clientèle business." },
    { slug: 'montpellier',     name: 'Montpellier',     adr: '70-115 €/nuit',  occ: "69 % d'occupation", ann: '~4 700 annonces', desc: "Ville étudiante (70 000 étudiants), climat doux, plages méditerranéennes à 10 min. Demande continue avec saisonnalité estivale forte et workation hivernale." },
    { slug: 'nantes',          name: 'Nantes',          adr: '70-110 €/nuit',  occ: "71 % d'occupation", ann: '~3 900 annonces', desc: "Voyage à Nantes (700k visiteurs), Hellfest à 30 min (200k festivaliers), hub tech en croissance. Mix tourisme culturel + business + événementiel." },
    { slug: 'lille',           name: 'Lille',           adr: '75-120 €/nuit',  occ: "69 % d'occupation", ann: '~3 600 annonces', desc: "Braderie (2,5M visiteurs en 48h !), Eurostar Londres/Bruxelles, marchés de Noël. Marché LCD international et événementiel unique en France." },
    { slug: 'aix-en-provence', name: 'Aix-en-Provence', adr: '100-160 €/nuit', occ: "73 % d'occupation", ann: '~2 400 annonces', desc: "Cours Mirabeau, Festival d'Aix (opéra), Cézanne, Sainte-Victoire. L'un des marchés les plus premium de France avec une clientèle internationale aisée." },
    { slug: 'cannes',          name: 'Cannes',          adr: '130-280 €/nuit', occ: "74 % d'occupation", ann: '~3 200 annonces', desc: "Festival du Film, MIPIM, Cannes Lions, Croisette, plages, l'un des RevPAR les plus élevés de France. Modèle économique unique 5 événements pros + été." },
    { slug: 'avignon',         name: 'Avignon',         adr: '80-140 €/nuit',  occ: "68 % d'occupation", ann: '~2 100 annonces', desc: "Festival d'Avignon (1M de spectateurs), Palais des Papes, Pont d'Avignon, Provence. Pic saisonnier juillet spectaculaire avec ADR ×2,5 à ×4." },
    { slug: 'chamonix',        name: 'Chamonix',        adr: '90-280 €/nuit',  occ: "65 % d'occupation", ann: '~2 800 annonces', desc: "Capitale mondiale de l'alpinisme, ski (Vallée Blanche), UTMB (10k coureurs). Deux saisons hautes intenses avec un RevPAR exceptionnel." },
    { slug: 'saint-malo',      name: 'Saint-Malo',      adr: '90-160 €/nuit',  occ: "68 % d'occupation", ann: '~2 600 annonces', desc: "Cité corsaire fortifiée, ferries vers l'Angleterre, Étonnants Voyageurs, Route du Rhum. Marché unique entre patrimoine et clientèle internationale britannique." },
    { slug: 'rennes',          name: 'Rennes',          adr: '65-110 €/nuit',  occ: "58 % d'occupation", ann: '~1 800 annonces', desc: "Capitale bretonne, 2e ville étudiante de France (70 000 étudiants), Transmusicales, TGV Paris 1h25. Marché LCD régulier et polyvalent 12 mois sur 12." },
    { slug: 'colmar',          name: 'Colmar',          adr: '80-300 €/nuit',  occ: "70 % d'occupation", ann: '~1 400 annonces', desc: "Joyau médiéval alsacien, 2 millions de visiteurs pour les marchés de Noël, Petite Venise, Route des Vins. L'un des meilleurs ADR de France rapporté au stock d'annonces." },
    { slug: 'dijon',           name: 'Dijon',           adr: '70-120 €/nuit',  occ: "58 % d'occupation", ann: '~1 600 annonces', desc: "Capitale de la Bourgogne, Route des Grands Crus UNESCO, gastronomie, ville universitaire (30 000 étudiants), TGV Paris 1h35. Marché LCD stable et régulier." },
    { slug: 'arcachon',        name: 'Arcachon',        adr: '100-900 €/nuit', occ: "62 % d'occupation", ann: '~2 200 annonces', desc: "Station balnéaire premium, Bassin d'Arcachon, Dune du Pilat, huîtres, forêt de pins. Saisonnalité estivale intense, RevPAR juillet-août parmi les meilleurs du Sud-Ouest." },
    { slug: 'deauville',       name: 'Deauville',       adr: '90-400 €/nuit',  occ: "58 % d'occupation", ann: '~1 200 annonces', desc: "Station normande de prestige, Festival du Cinéma Américain, Les Planches, hippodrome, clientèle parisienne (2h de Paris). Villas Belle Époque et marché LCD premium." },
    { slug: 'reims',           name: 'Reims',           adr: '70-130 €/nuit',  occ: "60 % d'occupation", ann: '~1 500 annonces', desc: "Capitale du champagne, cathédrale UNESCO (sacres des rois), 100 000 étudiants, TGV Paris 45min. Œnotourisme premium et clientèle affaires dynamique." },
    { slug: 'tours',           name: 'Tours',           adr: '65-120 €/nuit',  occ: "60 % d'occupation", ann: '~1 900 annonces', desc: "Porte d'entrée des Châteaux de la Loire UNESCO, Vieux-Tours médiéval, 50 000 étudiants, TGV Paris 55min. Marché LCD porté par le tourisme patrimonial international." },
    { slug: 'metz',            name: 'Metz',            adr: '65-115 €/nuit',  occ: "55 % d'occupation", ann: '~1 200 annonces', desc: "Centre Pompidou-Metz (1M visiteurs/an), cathédrale aux vitraux de Chagall, carrefour France-Allemagne-Luxembourg. Clientèle transfrontalière à fort pouvoir d'achat." },
    { slug: 'rouen',           name: 'Rouen',           adr: '65-120 €/nuit',  occ: "57 % d'occupation", ann: '~1 800 annonces', desc: "Capitale normande, cathédrale de Monet, Gros-Horloge, Armada (8 millions de visiteurs tous les 4 ans), Jeanne d'Arc, 2h de Paris. Rendements LCD attractifs." },
    { slug: 'perpignan',       name: 'Perpignan',       adr: '65-130 €/nuit',  occ: "62 % d'occupation", ann: '~2 500 annonces', desc: "Capitale catalane française, 300 jours de soleil, à 20min des plages, 30min de Gérone et 1h30 de Barcelone. Prix d'achat très attractifs, excellent potentiel de rendement LCD." },
    { slug: 'grenoble',        name: 'Grenoble',        adr: '65-110 €/nuit',  occ: "62 % d'occupation", ann: '~3 200 annonces', desc: "Capitale des Alpes françaises, ski (Chamrousse, Belledonne), 60 000 étudiants, hub tech (STMicro, Schneider). Marché LCD mixte tourisme montagne et clientèle affaires." },
    { slug: 'bayonne',         name: 'Bayonne',         adr: '90-170 €/nuit',  occ: "65 % d'occupation", ann: '~1 800 annonces', desc: "Fêtes de Bayonne (1 million de visiteurs en 5 jours), Pays Basque intérieur, jambon, chocolat, proximité plages. Pic estival exceptionnel, prix d'achat encore accessibles." },
    { slug: 'caen',            name: 'Caen',            adr: '70-120 €/nuit',  occ: "60 % d'occupation", ann: '~1 900 annonces', desc: "Mémorial de Caen (2M visiteurs/an), plages du Débarquement à 15min, abbaye aux Hommes, cidre normand. Tourisme de mémoire unique en France, clientèle internationale forte." },
    { slug: 'vannes',          name: 'Vannes',          adr: '75-160 €/nuit',  occ: "65 % d'occupation", ann: '~2 200 annonces', desc: "Joyau médiéval breton, Golfe du Morbihan (îles, voile, kayak), clientèle famille et nautisme premium. Marché LCD parmi les plus rentables de Bretagne." },
    { slug: 'angers',          name: 'Angers',          adr: '65-110 €/nuit',  occ: "60 % d'occupation", ann: '~2 100 annonces', desc: "Château d'Angers (Tapisserie de l'Apocalypse), Val de Loire UNESCO, 40 000 étudiants, TGV Paris 1h30. Marché LCD stable et diversifié toute l'année." },
    { slug: 'la-baule',        name: 'La Baule',        adr: '100-500 €/nuit', occ: "55 % d'occupation", ann: '~1 800 annonces', desc: "L'une des plus belles baies d'Europe, villas Belle Époque, clientèle parisienne premium. Saisonnalité estivale intense avec juillet-août parmi les meilleurs de l'Atlantique." },
    { slug: 'chambery',        name: 'Chambéry',        adr: '70-130 €/nuit',  occ: "62 % d'occupation", ann: '~1 500 annonces', desc: "Capitale historique de Savoie, Lac du Bourget (plus grand lac naturel de France), ski à 30min (Bauges, Chartreuse). Position stratégique entre Lyon, Grenoble et Genève." },
    { slug: 'sete',            name: 'Sète',            adr: '80-200 €/nuit',  occ: "65 % d'occupation", ann: '~2 000 annonces', desc: "Singulière île entre mer et étang, ville de Brassens et Paul Valéry, huîtres de l'étang de Thau, Canal du Midi. Méditerranée authentique loin des prix parisiens du littoral." },
    { slug: 'brest',           name: 'Brest',           adr: '65-110 €/nuit',  occ: "55 % d'occupation", ann: '~1 600 annonces', desc: "Rade de Brest exceptionnelle, Océanopolis (1er aquarium d'Europe), SPI Ouest-France (régates), 25 000 étudiants. Ville en forte transformation, marché LCD encore peu concurrentiel." },
    { slug: 'pau',             name: 'Pau',             adr: '65-115 €/nuit',  occ: "60 % d'occupation", ann: '~1 400 annonces', desc: "Boulevard des Pyrénées, Grand Prix de Pau, thermalisme, Lourdes à 30min, clientèle espagnole et basque. Prix d'achat très attractifs pour des rendements solides." },
    { slug: 'saint-tropez',    name: 'Saint-Tropez',    adr: '250-1500 €/nuit',occ: "55 % d'occupation", ann: '~2 400 annonces', desc: "Marché LCD le plus premium de France, yachting de luxe, plages mythiques de Pampelonne, clientèle internationale fortunée. Saison concentrée juin-septembre mais tarifs nuit jusqu'à 3 000 €." },
    { slug: 'honfleur',        name: 'Honfleur',        adr: '90-220 €/nuit',  occ: "65 % d'occupation", ann: '~1 100 annonces', desc: "Vieux Bassin classé, port impressionniste (Boudin, Monet), maisons à colombages. Clientèle parisienne week-end (2h de Paris), saison étendue avec marché de Noël fort." },
    { slug: 'le-touquet',      name: 'Le Touquet',      adr: '100-280 €/nuit', occ: "60 % d'occupation", ann: '~1 600 annonces', desc: "Station balnéaire premium du Nord, Côte d'Opale, Enduropale (200k visiteurs en février), villas Belle Époque, clientèle UK/belge/parisienne, saison hivernale active." },
    { slug: 'carcassonne',     name: 'Carcassonne',     adr: '75-180 €/nuit',  occ: "65 % d'occupation", ann: '~2 200 annonces', desc: "Cité médiévale UNESCO, 4 millions de visiteurs/an, Festival de Carcassonne en juillet, aéroport Ryanair. Clientèle ultra-internationale (UK, Allemagne, Pays-Bas)." },
    { slug: 'ajaccio',         name: 'Ajaccio',         adr: '90-220 €/nuit',  occ: "65 % d'occupation", ann: '~3 200 annonces', desc: "Capitale Corse-du-Sud, ville natale de Napoléon, plages méditerranéennes, golfe d'Ajaccio. Saison estivale intense + clientèle affaires (siège CTC) toute l'année." },
    { slug: 'antibes',         name: 'Antibes',         adr: '100-260 €/nuit', occ: "70 % d'occupation", ann: '~3 800 annonces', desc: "Côte d'Azur entre Cannes et Nice, Juan-les-Pins, Jazz à Juan, Cap d'Antibes, Port Vauban (plus grand port de plaisance d'Europe). Saison la plus longue de France (avril-octobre)." },
    { slug: 'sarlat',          name: 'Sarlat',          adr: '80-180 €/nuit',  occ: "60 % d'occupation", ann: '~1 700 annonces', desc: "Perle du Périgord noir, ville médiévale en secteur sauvegardé, gastronomie (foie gras, truffe), châteaux de la Dordogne, grottes de Lascaux. Clientèle internationale forte." },
    { slug: 'nimes',           name: 'Nîmes',           adr: '65-130 €/nuit',  occ: "65 % d'occupation", ann: '~2 800 annonces', desc: "Patrimoine romain (Arènes, Maison Carrée), Férias de Pentecôte (1 million de visiteurs sur 6 jours), proximité Camargue et Pont du Gard. Prix d'achat encore très accessibles." },
    { slug: 'le-mans',         name: 'Le Mans',         adr: '75-220 €/nuit',  occ: "58 % d'occupation", ann: '~1 400 annonces', desc: "24 Heures du Mans (250k spectateurs, ADR x4-x8 sur 8 jours), Cité Plantagenêt médiévale, marché Renault/MMA, TGV Paris 1h. Prix d'achat parmi les plus accessibles." },
    { slug: 'versailles',      name: 'Versailles',      adr: '90-180 €/nuit',  occ: "70 % d'occupation", ann: '~1 800 annonces', desc: "Château le plus visité de France (8M visiteurs/an), zone tendue Île-de-France (90 nuits/an max résidence principale). Clientèle ultra-internationale, marché très contraint mais très rentable." },
    { slug: 'paris',           name: 'Paris',           adr: '110-220 €/nuit', occ: "80 % d'occupation", ann: '~50 000 annonces', desc: "Le marché LCD le plus rentable et le plus encadré de France. Plafond 120 nuits/an pour la résidence principale, compensation 2:1 pour les autres. Fashion Weeks, Roland-Garros et effet post-JO 2024." },
    { slug: 'megeve',          name: 'Megève',          adr: '150-600 €/nuit', occ: "63 % d'occupation", ann: '~1 500 annonces', desc: "Capitale du chalet de luxe alpin, vue Mont Blanc, double saison ski-été. Mont d'Arbois et Rochebrune ski-in/ski-out, clientèle internationale fortunée (UK, Belgique, Pays-Bas, Moyen-Orient)." },
    { slug: 'beaune',          name: 'Beaune',          adr: '90-180 €/nuit',  occ: "65 % d'occupation", ann: '~900 annonces', desc: "Capitale des vins de Bourgogne, Hospices, Climats UNESCO. Vente des vins (3e weekend novembre, 30k visiteurs, ADR ×3) et tourisme international œnotouristique premium." },
    { slug: 'epernay',         name: 'Épernay',         adr: '100-220 €/nuit', occ: "60 % d'occupation", ann: '~600 annonces', desc: "Capitale du champagne, Avenue de Champagne UNESCO (110 km de caves), Habits de Lumière (70k visiteurs en décembre), vendanges. Marché émergent à fort potentiel international." },
    { slug: 'etretat',         name: 'Étretat',         adr: '100-280 €/nuit', occ: "60 % d'occupation", ann: '~700 annonces', desc: "Falaises mythiques, Aiguille creuse, effet Lupin (Netflix) qui a multiplié le tourisme par 2,5 en 4 ans. 1,5 million de visiteurs/an, marché LCD émergent en forte croissance." },
    { slug: 'menton',          name: 'Menton',          adr: '90-180 €/nuit',  occ: "70 % d'occupation", ann: '~1 800 annonces', desc: "Microclimat le plus chaud de France métropolitaine, 300 jours de soleil, Fête du Citron (350k visiteurs), frontière italienne à 5 min. Alternative premium et moins saturée que Nice et Cannes." },
    { slug: 'dinard',          name: 'Dinard',          adr: '110-280 €/nuit', occ: "60 % d'occupation", ann: '~1 100 annonces', desc: "La 'station des Anglais' depuis le 19e siècle, villas Belle Époque, Festival du Film Britannique (octobre), clientèle UK fidèle. Complémentaire de Saint-Malo avec ADR supérieurs." },
    { slug: 'quimper',         name: 'Quimper',         adr: '65-115 €/nuit',  occ: "55 % d'occupation", ann: '~900 annonces', desc: "Capitale culturelle de la Cornouaille, Festival de Cornouaille (250k spectateurs en juillet), faïenceries, base idéale pour découvrir le Finistère. Marché sous-exploité avec prix d'achat très accessibles." },
    { slug: 'nancy',           name: 'Nancy',           adr: '65-110 €/nuit',  occ: "65 % d'occupation", ann: '~1 400 annonces', desc: "Place Stanislas UNESCO, Art Nouveau (Daum, Gallé), 50 000 étudiants, Saint-Nicolas (200k visiteurs). TGV Paris 1h30, marché stable et prix d'achat parmi les plus accessibles des préfectures." },
    { slug: 'troyes',          name: 'Troyes',          adr: '70-130 €/nuit',  occ: "60 % d'occupation", ann: '~800 annonces', desc: "Centre médiéval en bouchon de champagne, capitale historique, McArthurGlen + Marques Avenue (3 millions de visiteurs shopping/an). Week-ends parisiens à 1h30 en train, demande shopping continue." },
    { slug: 'bastia',          name: 'Bastia',          adr: '80-160 €/nuit',  occ: "60 % d'occupation", ann: '~1 500 annonces', desc: "Capitale de la Haute-Corse, principal port pour les ferries d'Italie (Livourne, Savone, Gênes), porte du Cap Corse. Alternative 25 % moins chère qu'Ajaccio à qualité équivalente." },
    { slug: 'clermont-ferrand', name: 'Clermont-Ferrand', adr: '60-105 €/nuit', occ: "60 % d'occupation", ann: '~1 300 annonces', desc: "Capitale auvergnate, siège mondial Michelin, Volcans UNESCO et Festival International du Court Métrage (200k spectateurs en février). Triple pilier tourisme + business + culturel." },
    { slug: 'poitiers',        name: 'Poitiers',        adr: '60-105 €/nuit',  occ: "58 % d'occupation", ann: '~1 200 annonces', desc: "'Ville aux cent clochers', 28 000 étudiants, Futuroscope (1,9M visiteurs/an) à 8 km, TGV Paris 1h35. Triple demande tourisme + parc d'attractions + universitaire, prix d'achat très accessibles." }
  ];

  // ── Génère les liens footer depuis CITIES ────────────────────────────────
  var cityLinksHtml = CITIES.map(function (c) {
    return '<a href="/devenir-hote-airbnb-' + c.slug + '">Devenir hôte à ' + c.name + '</a>';
  }).join('');

  // ── Génère une carte ville pour /villes ──────────────────────────────────
  function cityCardHtml(c) {
    return '<a class="city-card" href="/devenir-hote-airbnb-' + c.slug + '">'
      + '<div class="city-card-body">'
      + '<span class="city-tag"><i class="ph ph-map-pin"></i> ' + c.name + '</span>'
      + '<div class="city-name">Devenir hôte <em>à ' + c.name + '</em></div>'
      + '<p class="city-desc">' + c.desc + '</p>'
      + '<div class="city-stats">'
      + '<span class="city-stat"><i class="ph ph-currency-eur"></i> ' + c.adr + '</span>'
      + '<span class="city-stat"><i class="ph ph-chart-bar"></i> ' + c.occ + '</span>'
      + '<span class="city-stat"><i class="ph ph-buildings"></i> ' + c.ann + '</span>'
      + '</div>'
      + '<div class="city-cta">Lire le guide <i class="ph ph-arrow-right"></i></div>'
      + '</div>'
      + '</a>';
  }

  if (!document.getElementById('footer-styles')) {
    var style = document.createElement('style');
    style.id = 'footer-styles';
    style.textContent = [
      'footer{background:#001a11;padding:clamp(48px,6vw,72px) clamp(16px,5vw,60px) clamp(24px,4vw,40px);border-top:1px solid rgba(255,255,255,.05)}',
      '.ft-in{max-width:1240px;margin:0 auto}',
      '.ft-g{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:36px;margin-bottom:36px}',
      '.ft-col-brand{min-width:0}',
      '.ft-desc{font-size:14px;color:rgba(255,255,255,.35);line-height:1.75;max-width:300px;margin-top:14px;font-family:\'Outfit\',sans-serif}',
      '.ft-ct{font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,213,107,.4);margin-bottom:14px;font-family:\'Outfit\',sans-serif}',
      '.ft-ls{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:2px}',
      '.ft-ls a{color:rgba(255,255,255,.4);text-decoration:none;font-size:14px;font-family:\'Outfit\',sans-serif;display:flex;align-items:center;gap:8px;padding:5px 0;transition:color .2s;line-height:1.3}',
      '.ft-ls a:hover{color:rgba(255,255,255,.85)}',
      '.ft-ls a i{font-size:14px;color:rgba(255,213,107,.35);flex-shrink:0;width:14px;text-align:center}',
      '.ft-ls a .ft-ext{font-size:10px;color:rgba(255,213,107,.35);margin-left:2px}',
      '.ft-seo{border-top:1px solid rgba(255,255,255,.05);padding-top:8px;margin-bottom:28px}',
      '.ft-seo-block{border-bottom:1px solid rgba(255,255,255,.04)}',
      '.ft-seo-block:last-child{border-bottom:none}',
      '.ft-seo-block summary{list-style:none;cursor:pointer;padding:16px 4px;display:flex;align-items:center;justify-content:space-between;font-family:\'Outfit\',sans-serif;font-size:13px;font-weight:500;color:rgba(255,255,255,.55);transition:color .2s;-webkit-tap-highlight-color:transparent}',
      '.ft-seo-block summary::-webkit-details-marker{display:none}',
      '.ft-seo-block summary:hover{color:rgba(255,255,255,.9)}',
      '.ft-seo-block summary .ft-seo-label{display:flex;align-items:center;gap:10px}',
      '.ft-seo-block summary .ft-seo-label i{font-size:14px;color:rgba(255,213,107,.5)}',
      '.ft-seo-block summary .ft-seo-caret{font-size:12px;color:rgba(255,255,255,.3);transition:transform .25s}',
      '.ft-seo-block[open] summary .ft-seo-caret{transform:rotate(180deg)}',
      '.ft-seo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:6px 24px;padding:4px 4px 16px}',
      '.ft-seo-grid a{color:rgba(255,255,255,.38);text-decoration:none;font-size:13px;font-family:\'Outfit\',sans-serif;padding:5px 0;transition:color .2s;line-height:1.4}',
      '.ft-seo-grid a:hover{color:rgba(255,255,255,.85)}',
      '.ft-see-all{display:inline-flex;align-items:center;gap:6px;margin:4px 4px 32px;font-size:12px;font-weight:600;color:#63D683;text-decoration:none;letter-spacing:.2px;transition:opacity .2s}',
      '.ft-see-all:hover{opacity:.75}',
      '.ft-bot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;padding-top:28px;border-top:1px solid rgba(255,255,255,.05)}',
      '.ft-bot-l{display:flex;align-items:center;flex-wrap:wrap;gap:8px 16px;font-family:\'Outfit\',sans-serif}',
      '.ft-cp{font-size:12px;color:rgba(255,255,255,.2)}',
      '.ft-legal{display:flex;align-items:center;flex-wrap:wrap;gap:4px 12px}',
      '.ft-legal a{font-size:12px;color:rgba(255,255,255,.28);text-decoration:none;transition:color .2s}',
      '.ft-legal a:hover{color:rgba(255,255,255,.7)}',
      '.ft-legal-sep{color:rgba(255,255,255,.15);font-size:11px}',
      '.socs{display:flex;gap:8px}',
      '.soc{width:40px;height:40px;border-radius:8px;border:1px solid rgba(255,255,255,.09);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.3);text-decoration:none;font-size:15px;transition:all .2s}',
      '.soc:hover{border-color:rgba(255,255,255,.3);color:#fff}',
      '@media(max-width:960px){.ft-g{grid-template-columns:repeat(3,1fr);gap:28px}.ft-col-brand{grid-column:1 / -1;max-width:520px}.ft-desc{max-width:none}}',
      '@media(max-width:640px){.ft-g{grid-template-columns:1fr 1fr;gap:24px}.ft-bot{flex-direction:column;align-items:flex-start}.ft-legal{margin-top:-4px}.ft-seo-grid{grid-template-columns:1fr 1fr;gap:4px 16px}}',
      '@media(max-width:420px){.ft-g{grid-template-columns:1fr;gap:22px}.ft-seo-grid{grid-template-columns:1fr}}'
    ].join('');
    document.head.appendChild(style);
  }

  var FOOTER_HTML = '<footer>'
    + '<div class="ft-in">'
      + '<div class="ft-g">'
        + '<div class="ft-col-brand">'
          + '<a href="/" class="n-logo" style="text-decoration:none">'
            + '<img src="/logo.webp" alt="Jason Marinho" class="nav-logo-img" width="34" height="34" loading="lazy">'
            + '<div class="n-brand">Jason <em>Marinho</em></div>'
          + '</a>'
          + '<p class="ft-desc">Expert LCD et co-fondateur de Driing. J\'accompagne les hôtes et conciergeries à développer leur activité, honnêtement et efficacement.</p>'
        + '</div>'
        + '<div>'
          + '<div class="ft-ct">Outils</div>'
          + '<ul class="ft-ls">'
            + '<li><a href="/services/simulateurs"><i class="ph ph-calculator"></i>Simulateurs fiscaux</a></li>'
            + '<li><a href="/services/audit-gbp"><i class="ph ph-magnifying-glass"></i>Audit Google Business</a></li>'
            + '<li><a href="/services/calendrier"><i class="ph ph-calendar-check"></i>Calendrier & check-list</a></li>'
            + '<li><a href="/services/revenus"><i class="ph ph-chart-line-up"></i>Suivi des revenus</a></li>'
            + '<li><a href="/services/performances"><i class="ph ph-chart-bar"></i>Performances LCD</a></li>'
            + '<li><a href="/services/securite"><i class="ph ph-shield-check"></i>Vérification voyageurs</a></li>'
            + '<li><a href="/services/gabarits-messages"><i class="ph ph-chat-text"></i>Gabarits messages</a></li>'
            + '<li><a href="/services/qr-affiches"><i class="ph ph-squares-four"></i>QR & Affiches WiFi</a></li>'
          + '</ul>'
        + '</div>'
        + '<div>'
          + '<div class="ft-ct">Calculateurs</div>'
          + '<ul class="ft-ls">'
            + '<li><a href="/calculateurs/revenus-lcd"><i class="ph ph-trend-up"></i>Estimateur revenus</a></li>'
            + '<li><a href="/calculateurs/prix-lcd"><i class="ph ph-currency-eur"></i>Calculateur prix</a></li>'
            + '<li><a href="/calculateurs/comparer-villes"><i class="ph ph-scales"></i>Comparateur villes</a></li>'
            + '<li><a href="/calculateurs"><i class="ph ph-rows"></i>Voir tous les calculateurs</a></li>'
          + '</ul>'
        + '</div>'
        + '<div>'
          + '<div class="ft-ct">Ressources</div>'
          + '<ul class="ft-ls">'
            + '<li><a href="/blog"><i class="ph ph-newspaper"></i>Blog LCD</a></li>'
            + '<li><a href="/lexique-lcd"><i class="ph ph-book-open"></i>Lexique LCD</a></li>'
            + '<li><a href="/services/actualites"><i class="ph ph-megaphone"></i>Actualités LCD</a></li>'
            + '<li><a href="/services/formations"><i class="ph ph-graduation-cap"></i>Formations</a></li>'
            + '<li><a href="/services/guides-lcd"><i class="ph ph-books"></i>Guides LCD</a></li>'
            + '<li><a href="/sos-hote"><i class="ph ph-lifebuoy"></i>SOS Hôte (urgences)</a></li>'
            + '<li><a href="/services/chez-nous"><i class="ph ph-house"></i>Chez Nous (forum)</a></li>'
            + '<li><a href="/services/communaute"><i class="ph ph-users-four"></i>Groupes Facebook</a></li>'
            + '<li><a href="/services/ecosysteme"><i class="ph ph-globe"></i>Écosystème LCD</a></li>'
          + '</ul>'
        + '</div>'
        + '<div>'
          + '<div class="ft-ct">Pour qui</div>'
          + '<ul class="ft-ls">'
            + '<li><a href="/pour-qui/chambres-dhotes"><i class="ph ph-house-line"></i>Chambres d\'hôtes</a></li>'
            + '<li><a href="/pour-qui/gites"><i class="ph ph-tree-evergreen"></i>Gîtes</a></li>'
            + '<li><a href="/pour-qui/conciergeries"><i class="ph ph-buildings"></i>Conciergeries</a></li>'
            + '<li><a href="/pour-qui/membres-driing"><i class="ph ph-lightning"></i>Membres Driing</a></li>'
          + '</ul>'
        + '</div>'
        + '<div>'
          + '<div class="ft-ct">À propos</div>'
          + '<ul class="ft-ls">'
            + '<li><a href="/qui-suis-je"><i class="ph ph-user-circle"></i>Qui suis-je</a></li>'
            + '<li><a href="/tarifs"><i class="ph ph-tag"></i>Tarifs</a></li>'
            + '<li><a href="/contact"><i class="ph ph-envelope"></i>Contact</a></li>'
            + '<li><a href="https://app.jasonmarinho.com"><i class="ph ph-layout"></i>Espace membre</a></li>'
            + '<li><a href="https://driing.co" target="_blank" rel="noopener"><i class="ph ph-arrow-square-out"></i>Driing<span class="ft-ext"><i class="ph ph-arrow-up-right"></i></span></a></li>'
          + '</ul>'
        + '</div>'
      + '</div>'
      + '<div class="ft-seo">'
        + '<details class="ft-seo-block">'
          + '<summary>'
            + '<span class="ft-seo-label"><i class="ph ph-map-pin"></i>Devenir hôte par ville</span>'
            + '<i class="ph ph-caret-down ft-seo-caret"></i>'
          + '</summary>'
          + '<div class="ft-seo-grid">' + cityLinksHtml + '</div>'
          + '<a href="/villes" class="ft-see-all">Voir les guides pour les ' + CITIES.length + ' villes <i class="ph-bold ph-arrow-right" style="font-size:11px"></i></a>'
        + '</details>'
        + '<details class="ft-seo-block">'
          + '<summary>'
            + '<span class="ft-seo-label"><i class="ph ph-trend-up"></i>Études de revenus par ville (22)</span>'
            + '<i class="ph ph-caret-down ft-seo-caret"></i>'
          + '</summary>'
          + '<div class="ft-seo-grid">'
            + '<a href="/calculateurs/revenu-airbnb-paris">🇫🇷 Paris</a>'
            + '<a href="/calculateurs/revenu-lcd-lyon">🇫🇷 Lyon</a>'
            + '<a href="/calculateurs/revenu-lcd-bordeaux">🇫🇷 Bordeaux</a>'
            + '<a href="/calculateurs/revenu-lcd-marseille">🇫🇷 Marseille</a>'
            + '<a href="/calculateurs/revenu-lcd-nice">🇫🇷 Nice</a>'
            + '<a href="/calculateurs/revenu-lcd-annecy">🇫🇷 Annecy</a>'
            + '<a href="/calculateurs/revenu-lcd-strasbourg">🇫🇷 Strasbourg</a>'
            + '<a href="/calculateurs/revenu-lcd-honfleur">🇫🇷 Honfleur</a>'
            + '<a href="/calculateurs/revenu-lcd-lisbonne">🇵🇹 Lisbonne</a>'
            + '<a href="/calculateurs/revenu-lcd-porto">🇵🇹 Porto</a>'
            + '<a href="/calculateurs/revenu-lcd-funchal">🇵🇹 Funchal</a>'
            + '<a href="/calculateurs/revenu-lcd-barcelona">🇪🇸 Barcelona</a>'
            + '<a href="/calculateurs/revenu-lcd-madrid">🇪🇸 Madrid</a>'
            + '<a href="/calculateurs/revenu-lcd-sevilla">🇪🇸 Sevilla</a>'
            + '<a href="/calculateurs/revenu-lcd-valencia">🇪🇸 Valencia</a>'
            + '<a href="/calculateurs/revenu-lcd-rome">🇮🇹 Roma</a>'
            + '<a href="/calculateurs/revenu-lcd-firenze">🇮🇹 Firenze</a>'
            + '<a href="/calculateurs/revenu-lcd-bruxelles">🇧🇪 Bruxelles</a>'
            + '<a href="/calculateurs/revenu-lcd-amsterdam">🇳🇱 Amsterdam</a>'
            + '<a href="/calculateurs/revenu-lcd-berlin">🇩🇪 Berlin</a>'
            + '<a href="/calculateurs/revenu-lcd-munich">🇩🇪 München</a>'
            + '<a href="/calculateurs/revenu-lcd-wien">🇦🇹 Wien</a>'
          + '</div>'
          + '<a href="/calculateurs" class="ft-see-all">Voir tous les calculateurs (3 outils + 22 villes) <i class="ph-bold ph-arrow-right" style="font-size:11px"></i></a>'
        + '</details>'
        + '<details class="ft-seo-block">'
          + '<summary>'
            + '<span class="ft-seo-label"><i class="ph ph-scales"></i>Comparatifs outils LCD</span>'
            + '<i class="ph ph-caret-down ft-seo-caret"></i>'
          + '</summary>'
          + '<div class="ft-seo-grid">'
            + '<a href="/comparatif-airdna-mashvisor">AirDNA vs Mashvisor</a>'
            + '<a href="/comparatif-driing-airbnb-booking">Driing vs Airbnb vs Booking.com</a>'
            + '<a href="/comparatif-hostfully-guesty">Hostfully vs Guesty</a>'
            + '<a href="/comparatif-hostfully-guidebook-driing-touchstay">Hostfully Guidebook vs Driing vs Touch Stay</a>'
            + '<a href="/comparatif-igloohome-ttlock">igloohome vs TTLock</a>'
            + '<a href="/comparatif-indy-tiime-henrri">Indy vs Tiime vs Henrri</a>'
            + '<a href="/comparatif-lodgify-smoobu">Lodgify vs Smoobu</a>'
            + '<a href="/comparatif-matterport-cubicasa">Matterport vs CubiCasa</a>'
            + '<a href="/comparatif-pricelabs-beyond-wheelhouse">PriceLabs vs Beyond vs Wheelhouse</a>'
            + '<a href="/comparatif-ring-eufy-reolink">Ring vs Eufy vs Reolink</a>'
            + '<a href="/comparatif-smoobu-hospitable">Smoobu vs Hospitable</a>'
            + '<a href="/comparatif-superhote-welkeys">Superhote vs Welkeys</a>'
            + '<a href="/comparatif-turnoverbnb-properly">Turno vs Properly</a>'
            + '<a href="/comparatif-welkeys-guestready">Welkeys vs GuestReady</a>'
          + '</div>'
        + '</details>'
      + '</div>'
      + '<div class="ft-bot">'
        + '<div class="ft-bot-l">'
          + '<div class="ft-cp">© 2026 Jason Marinho · Fait avec soin à Paris</div>'
          + '<div class="ft-legal">'
            + '<span class="ft-legal-sep">·</span>'
            + '<a href="/mentions-legales">Mentions légales</a>'
            + '<span class="ft-legal-sep">·</span>'
            + '<a href="/politique-de-confidentialite">Confidentialité</a>'
            + '<span class="ft-legal-sep">·</span>'
            + '<a href="/cgvu">CGV / CGU</a>'
            + '<span class="ft-legal-sep">·</span>'
            + '<a href="#" onclick="if(window.openCookieSettings){openCookieSettings();}return false;">Gérer les cookies</a>'
          + '</div>'
        + '</div>'
        + '<div class="socs">'
          + '<a href="https://instagram.com/jason_marinho" target="_blank" rel="noopener" class="soc" aria-label="Instagram"><i class="ph-bold ph-instagram-logo"></i></a>'
          + '<a href="https://www.facebook.com/jasonmarinholcd" target="_blank" rel="noopener" class="soc" aria-label="Facebook"><i class="ph-bold ph-facebook-logo"></i></a>'
          + '<a href="https://www.linkedin.com/in/jason-driing-location-sanscommission/" target="_blank" rel="noopener" class="soc" aria-label="LinkedIn"><i class="ph-bold ph-linkedin-logo"></i></a>'
          + '<a href="https://wa.me/33630212592" target="_blank" rel="noopener" class="soc" aria-label="WhatsApp"><i class="ph-bold ph-whatsapp-logo"></i></a>'
        + '</div>'
      + '</div>'
    + '</div>'
  + '</footer>';

  var tmp = document.createElement('div');
  tmp.innerHTML = FOOTER_HTML;
  var frag = document.createDocumentFragment();
  while (tmp.firstChild) frag.appendChild(tmp.firstChild);
  if (document.body) {
    document.body.appendChild(frag);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.appendChild(frag);
    });
  }

  // ── Mises à jour dynamiques post-insertion ───────────────────────────────

  // Compteur de villes sur toutes les pages (.villes-count)
  var countEls = document.querySelectorAll('.villes-count');
  for (var i = 0; i < countEls.length; i++) {
    countEls[i].textContent = CITIES.length;
  }

  // Grille /villes : remplissage auto depuis CITIES
  var grid = document.getElementById('cities-grid');
  if (grid) {
    grid.innerHTML = CITIES.map(cityCardHtml).join('');
  }

  // Lead /villes : mise à jour du compteur dans le hero
  var villesLead = document.getElementById('villes-lead-count');
  if (villesLead) {
    villesLead.textContent = CITIES.length;
  }
}());
