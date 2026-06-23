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
      'footer{background:var(--gd,#003329);padding:clamp(56px,7vw,80px) clamp(16px,5vw,60px) clamp(24px,3vw,32px);border-top:1px solid rgba(255,255,255,.05);position:relative;overflow:hidden;color:#fff;font-family:\'Outfit\',sans-serif}',
      'footer::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 70% 70% at 100% 0%,rgba(255,213,107,.04),transparent 70%);pointer-events:none}',
      '.ft-in{max-width:1280px;margin:0 auto;position:relative;z-index:1}',

      /* Hero : brand + 3 colonnes */
      '.ft-hero{display:grid;grid-template-columns:1fr 3.2fr;gap:clamp(36px,5vw,64px);padding-bottom:clamp(36px,4vw,48px);border-bottom:1px solid rgba(255,255,255,.07)}',
      '.ft-brand{display:flex;flex-direction:column;gap:18px}',
      '.ft-brand-logo{display:flex;align-items:center;gap:11px;text-decoration:none;color:#fff}',
      '.ft-brand-logo img{width:36px;height:36px;border-radius:8px;filter:brightness(0) invert(1);opacity:.9}',
      '.ft-brand-name{font-family:\'Fraunces\',serif;font-size:21px;font-weight:400;letter-spacing:-.01em}',
      '.ft-brand-name em{color:#FFD56B;font-style:italic;font-weight:300}',
      '.ft-brand-desc{font-size:14.5px;color:rgba(255,255,255,.6);line-height:1.7;margin:0;max-width:340px}',
      '.ft-socs{display:flex;gap:8px;margin-top:4px}',
      '.ft-soc{width:38px;height:38px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.7);text-decoration:none;font-size:16px;transition:all .2s}',
      '.ft-soc:hover{background:rgba(255,213,107,.10);border-color:rgba(255,213,107,.22);color:#FFD56B;transform:translateY(-1px)}',

      '.ft-cols{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(24px,3vw,40px)}',
      '.ft-cat{display:flex;flex-direction:column;gap:13px}',
      '.ft-cat-t{font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:rgba(255,213,107,.78);margin:0 0 4px}',
      '.ft-cat a{color:rgba(255,255,255,.78);text-decoration:none;font-size:14.5px;line-height:1.55;width:fit-content;position:relative;transition:color .2s}',
      '.ft-cat a::after{content:"";position:absolute;left:0;bottom:-2px;width:0;height:1px;background:#FFD56B;transition:width .22s}',
      '.ft-cat a:hover{color:#fff}',
      '.ft-cat a:hover::after{width:100%}',
      '.ft-cat a .ft-ext{font-size:10px;color:rgba(255,213,107,.55);margin-left:5px;display:inline-flex;align-items:center;vertical-align:1px}',
      '.ft-cat a.ft-cat-more{margin-top:6px;font-size:13px;color:rgba(255,213,107,.7);font-weight:500}',
      '.ft-cat a.ft-cat-more:hover{color:#FFD56B}',

      /* Bloc Explorer : onglets + panneaux (tous les liens en HTML, SEO préservé) */
      '.ft-explore{padding:clamp(28px,3.5vw,40px) 0;border-bottom:1px solid rgba(255,255,255,.07)}',
      '.ft-explore-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:20px;flex-wrap:wrap}',
      '.ft-explore-h{display:flex;align-items:center;gap:12px;font-family:\'Fraunces\',serif;font-size:17px;font-weight:400;color:#fff;letter-spacing:-.01em;margin:0}',
      '.ft-explore-h i{color:#FFD56B;font-size:18px}',
      '.ft-explore-h em{color:#FFD56B;font-style:italic;font-weight:300}',
      '.ft-explore-tabs{display:flex;gap:6px;flex-wrap:wrap}',
      '.ft-tab{font-size:12.5px;padding:7px 14px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.75);cursor:pointer;font-family:\'Outfit\',sans-serif;font-weight:500;transition:all .2s}',
      '.ft-tab:hover{background:rgba(255,255,255,.08);color:#fff}',
      '.ft-tab.on{background:rgba(255,213,107,.12);border-color:rgba(255,213,107,.30);color:#FFD56B;font-weight:600}',
      '.ft-panels{margin-top:6px}',
      '.ft-panel{display:none;flex-direction:column;gap:10px}',
      '.ft-panel.on{display:flex}',
      '.ft-panel-hint{font-size:12.5px;color:rgba(255,255,255,.55);line-height:1.5;max-width:720px}',
      '.ft-chips{display:flex;flex-wrap:wrap;gap:7px}',
      '.ft-chips a{font-size:12.5px;padding:6px 12px;border-radius:8px;background:rgba(255,255,255,.035);color:rgba(255,255,255,.65);text-decoration:none;border:1px solid transparent;transition:all .18s;line-height:1.3;white-space:nowrap}',
      '.ft-chips a:hover{color:#FFD56B;border-color:rgba(255,213,107,.20);background:rgba(255,213,107,.06)}',
      '.ft-panel .ft-see-all{margin:2px 4px 0;font-size:12px;font-weight:600;color:#63D683;text-decoration:none;display:inline-flex;align-items:center;gap:5px;padding:0;background:transparent;border:none;align-self:flex-start}',
      '.ft-panel .ft-see-all:hover{color:#7ce29a;background:transparent}',

      /* Baseline */
      '.ft-baseline{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;padding-top:28px;color:rgba(255,255,255,.45);font-size:12.5px}',
      '.ft-baseline-l{display:flex;align-items:center;gap:16px;flex-wrap:wrap}',
      '.ft-cp{font-size:12.5px;color:rgba(255,255,255,.4)}',
      '.ft-legal{display:flex;align-items:center;flex-wrap:wrap;gap:0 16px}',
      '.ft-legal a{font-size:12.5px;color:rgba(255,255,255,.55);text-decoration:none;transition:color .2s}',
      '.ft-legal a:hover{color:#fff}',

      /* Responsive */
      '@media(max-width:1100px){.ft-cols{grid-template-columns:repeat(2,1fr);gap:32px}}',
      '@media(max-width:960px){.ft-hero{grid-template-columns:1fr;gap:36px}.ft-brand-desc{max-width:none}}',
      '@media(max-width:640px){.ft-explore-head{flex-direction:column;align-items:flex-start}.ft-baseline{flex-direction:column;align-items:flex-start}.ft-chips a{font-size:12px;padding:5px 10px}.ft-panel-hint{font-size:12px}}',
      '@media(max-width:480px){.ft-cols{grid-template-columns:1fr;gap:22px}}'
    ].join('');
    document.head.appendChild(style);
  }

  // Études de revenus par ville (22 pages publiées)
  var REVENU_LINKS = [
    { href: '/calculateurs/revenu-airbnb-paris', name: 'Paris' },
    { href: '/calculateurs/revenu-lcd-lyon', name: 'Lyon' },
    { href: '/calculateurs/revenu-lcd-bordeaux', name: 'Bordeaux' },
    { href: '/calculateurs/revenu-lcd-marseille', name: 'Marseille' },
    { href: '/calculateurs/revenu-lcd-nice', name: 'Nice' },
    { href: '/calculateurs/revenu-lcd-annecy', name: 'Annecy' },
    { href: '/calculateurs/revenu-lcd-strasbourg', name: 'Strasbourg' },
    { href: '/calculateurs/revenu-lcd-honfleur', name: 'Honfleur' },
    { href: '/calculateurs/revenu-lcd-lisbonne', name: 'Lisbonne' },
    { href: '/calculateurs/revenu-lcd-porto', name: 'Porto' },
    { href: '/calculateurs/revenu-lcd-funchal', name: 'Funchal' },
    { href: '/calculateurs/revenu-lcd-barcelona', name: 'Barcelone' },
    { href: '/calculateurs/revenu-lcd-madrid', name: 'Madrid' },
    { href: '/calculateurs/revenu-lcd-sevilla', name: 'Séville' },
    { href: '/calculateurs/revenu-lcd-valencia', name: 'Valence' },
    { href: '/calculateurs/revenu-lcd-rome', name: 'Rome' },
    { href: '/calculateurs/revenu-lcd-firenze', name: 'Florence' },
    { href: '/calculateurs/revenu-lcd-bruxelles', name: 'Bruxelles' },
    { href: '/calculateurs/revenu-lcd-amsterdam', name: 'Amsterdam' },
    { href: '/calculateurs/revenu-lcd-berlin', name: 'Berlin' },
    { href: '/calculateurs/revenu-lcd-munich', name: 'Munich' },
    { href: '/calculateurs/revenu-lcd-wien', name: 'Vienne' }
  ];
  var COMPARATIF_LINKS = [
    { href: '/comparatif-airdna-mashvisor', name: 'AirDNA vs Mashvisor' },
    { href: '/comparatif-driing-airbnb-booking', name: 'Driing vs Airbnb vs Booking' },
    { href: '/comparatif-hostfully-guesty', name: 'Hostfully vs Guesty' },
    { href: '/comparatif-hostfully-guidebook-driing-touchstay', name: 'Guidebook vs Driing vs Touch Stay' },
    { href: '/comparatif-igloohome-ttlock', name: 'igloohome vs TTLock' },
    { href: '/comparatif-indy-tiime-henrri', name: 'Indy vs Tiime vs Henrri' },
    { href: '/comparatif-lodgify-smoobu', name: 'Lodgify vs Smoobu' },
    { href: '/comparatif-matterport-cubicasa', name: 'Matterport vs CubiCasa' },
    { href: '/comparatif-pricelabs-beyond-wheelhouse', name: 'PriceLabs vs Beyond vs Wheelhouse' },
    { href: '/comparatif-ring-eufy-reolink', name: 'Ring vs Eufy vs Reolink' },
    { href: '/comparatif-smoobu-hospitable', name: 'Smoobu vs Hospitable' },
    { href: '/comparatif-superhote-welkeys', name: 'Superhote vs Welkeys' },
    { href: '/comparatif-turnoverbnb-properly', name: 'Turno vs Properly' },
    { href: '/comparatif-welkeys-guestready', name: 'Welkeys vs GuestReady' }
  ];

  function panelHtml(items) {
    return items.map(function (i) {
      return '<a href="' + i.href + '">' + i.name + '</a>';
    }).join('');
  }

  var hostPanel = CITIES.map(function (c) {
    return '<a href="/devenir-hote-airbnb-' + c.slug + '">' + c.name + '</a>';
  }).join('');

  var FOOTER_HTML = '<footer>'
    + '<div class="ft-in">'

      /* ── Brand + 3 colonnes ── */
      + '<div class="ft-hero">'
        + '<div class="ft-brand">'
          + '<a class="ft-brand-logo" href="/">'
            + '<img src="/logo.webp" alt="Jason Marinho" width="36" height="36" loading="lazy">'
            + '<span class="ft-brand-name">Jason <em>Marinho</em></span>'
          + '</a>'
          + '<p class="ft-brand-desc">Expert LCD et co-fondateur de Driing. J\'aide les hôtes et conciergeries à piloter leur activité avec des chiffres clairs, honnêtement et efficacement.</p>'
          + '<div class="ft-socs">'
            + '<a href="https://www.linkedin.com/in/jason-driing-location-sanscommission/" target="_blank" rel="noopener" class="ft-soc" aria-label="LinkedIn"><i class="ph ph-linkedin-logo"></i></a>'
            + '<a href="https://instagram.com/jason_marinho" target="_blank" rel="noopener" class="ft-soc" aria-label="Instagram"><i class="ph ph-instagram-logo"></i></a>'
            + '<a href="https://www.facebook.com/jasonmarinholcd" target="_blank" rel="noopener" class="ft-soc" aria-label="Facebook"><i class="ph ph-facebook-logo"></i></a>'
            + '<a href="https://wa.me/33630212592" target="_blank" rel="noopener" class="ft-soc" aria-label="WhatsApp"><i class="ph ph-whatsapp-logo"></i></a>'
          + '</div>'
        + '</div>'

        + '<div class="ft-cols">'
          + '<div class="ft-cat">'
            + '<h4 class="ft-cat-t">Plateforme hôte</h4>'
            + '<a href="/services/calendrier">Calendrier &amp; check-list</a>'
            + '<a href="/services/performances">Performances LCD</a>'
            + '<a href="/services/carnet-voyageurs">Carnet voyageurs</a>'
            + '<a href="/services/securite">Vérification voyageurs</a>'
            + '<a href="/services/simulateurs">Simulateurs &amp; calculateurs</a>'
            + '<a href="/services" class="ft-cat-more">Tous les services →</a>'
          + '</div>'
          + '<div class="ft-cat">'
            + '<h4 class="ft-cat-t">Annuaires pros</h4>'
            + '<a href="/annuaires/photographes">Photographes LCD</a>'
            + '<a href="/annuaires/photographes/exemple-fiche">Exemple fiche photo</a>'
            + '<a href="/annuaires/menage">Équipes de ménage</a>'
            + '<a href="/annuaires/menage/exemple-fiche">Exemple fiche ménage</a>'
            + '<a href="/mon-compte" class="ft-cat-more">Mon espace pro →</a>'
          + '</div>'
          + '<div class="ft-cat">'
            + '<h4 class="ft-cat-t">Ressources</h4>'
            + '<a href="/blog">Blog LCD</a>'
            + '<a href="/services/guides-lcd">Guides LCD</a>'
            + '<a href="/services/formations">Formations</a>'
            + '<a href="/services/actualites">Actualités LCD</a>'
            + '<a href="/lexique-lcd">Lexique LCD</a>'
            + '<a href="/sos-hote">SOS Hôte (urgences)</a>'
          + '</div>'
          + '<div class="ft-cat">'
            + '<h4 class="ft-cat-t">Entreprise</h4>'
            + '<a href="/qui-suis-je">Qui suis-je</a>'
            + '<a href="/tarifs">Tarifs</a>'
            + '<a href="/contact">Contact</a>'
            + '<a href="https://driing.co" target="_blank" rel="noopener">Driing<span class="ft-ext"><i class="ph ph-arrow-up-right"></i></span></a>'
            + '<a href="https://app.jasonmarinho.com">Espace membre</a>'
          + '</div>'
        + '</div>'
      + '</div>'

      /* ── Bloc Explorer : 3 onglets, tous les liens en HTML ── */
      + '<div class="ft-explore">'
        + '<div class="ft-explore-head">'
          + '<h3 class="ft-explore-h"><i class="ph ph-compass"></i><span class="ft-explore-h-text">Explorer par <em>ville</em></span></h3>'
          + '<div class="ft-explore-tabs" role="tablist">'
            + '<button class="ft-tab on" data-panel="revenus" role="tab" aria-selected="true">Études de revenus</button>'
            + '<button class="ft-tab" data-panel="hote" role="tab" aria-selected="false">Devenir hôte</button>'
            + '<button class="ft-tab" data-panel="outils" role="tab" aria-selected="false">Comparatifs outils</button>'
          + '</div>'
        + '</div>'
        + '<div class="ft-panels">'
          + '<div class="ft-panel on" data-panel="revenus" role="tabpanel">'
            + '<div class="ft-panel-hint">Combien rapporte la LCD dans ces villes ? Tarif moyen, occupation, revenu net.</div>'
            + '<div class="ft-chips">' + panelHtml(REVENU_LINKS) + '</div>'
            + '<a href="/calculateurs" class="ft-see-all">Voir tous les calculateurs <i class="ph-bold ph-arrow-right" style="font-size:11px"></i></a>'
          + '</div>'
          + '<div class="ft-panel" data-panel="hote" role="tabpanel">'
            + '<div class="ft-panel-hint">Guides locaux pour démarrer ton activité de loueur dans la ville.</div>'
            + '<div class="ft-chips">' + hostPanel + '</div>'
            + '<a href="/villes" class="ft-see-all">Voir tous les guides hôte <i class="ph-bold ph-arrow-right" style="font-size:11px"></i></a>'
          + '</div>'
          + '<div class="ft-panel" data-panel="outils" role="tabpanel">'
            + '<div class="ft-panel-hint">Quel outil ou logiciel choisir ? Comparatifs honnêtes avec prix, forces, limites.</div>'
            + '<div class="ft-chips">' + panelHtml(COMPARATIF_LINKS) + '</div>'
          + '</div>'
        + '</div>'
      + '</div>'

      /* ── Baseline ── */
      + '<div class="ft-baseline">'
        + '<div class="ft-cp">© 2026 Jason Marinho · Fait avec soin à Paris</div>'
        + '<div class="ft-legal">'
          + '<a href="/mentions-legales">Mentions légales</a>'
          + '<a href="/politique-de-confidentialite">Confidentialité</a>'
          + '<a href="/cgvu">CGV / CGU</a>'
          + '<a href="#" onclick="if(window.openCookieSettings){openCookieSettings();}return false;">Cookies</a>'
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

  // ── Onglets footer "Explorer" (visuel seulement, liens déjà en HTML) ─────
  // Délégation pour fonctionner même si footer injecté plus tard.
  var HEADING_BY_PANEL = {
    revenus: 'Explorer par <em>ville</em>',
    hote:    'Explorer par <em>ville</em>',
    outils:  'Explorer les <em>outils</em>'
  };
  document.addEventListener('click', function (e) {
    var tab = e.target.closest && e.target.closest('.ft-tab');
    if (!tab) return;
    var panelName = tab.getAttribute('data-panel');
    var tabs = document.querySelectorAll('.ft-tab');
    var panels = document.querySelectorAll('.ft-panel');
    for (var t = 0; t < tabs.length; t++) {
      var on = tabs[t].getAttribute('data-panel') === panelName;
      tabs[t].classList.toggle('on', on);
      tabs[t].setAttribute('aria-selected', on ? 'true' : 'false');
    }
    for (var p = 0; p < panels.length; p++) {
      panels[p].classList.toggle('on', panels[p].getAttribute('data-panel') === panelName);
    }
    // Titre dynamique : reflète l'onglet actif pour rendre le switch
    // plus parlant ("Explorer par ville" vs "Explorer les outils").
    var hText = document.querySelector('.ft-explore-h-text');
    if (hText && HEADING_BY_PANEL[panelName]) {
      hText.innerHTML = HEADING_BY_PANEL[panelName];
    }
  });
}());
