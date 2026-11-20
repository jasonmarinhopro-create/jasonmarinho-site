// Quartiers et secteurs des villes, pour les pages photographe-lcd- et
// menage-lcd- (scripts/inject-quartiers-villes.mjs). Audit SEO, lot D,
// 19/11/2026 : donner à chaque page un contenu propre à sa ville.
// Par ville : `quartiers` (3 ou 4 [nom, logements et ambiance]), `photo`
// (ce que la ville change pour un shooting), `menage` (ce qu'elle change pour
// un turnover). Faits descriptifs seulement : aucun chiffre, aucune règle
// (les règles et la taxe sont dans villes-local.mjs, avec leurs sources).
// Ordre : villes des clients d'abord (19/11/2026), puis les autres.

export const QUARTIERS = {
  paris: {
    quartiers: [
      ['Le Marais et le centre', "Immeubles anciens, poutres et cours intérieures, beaucoup de studios et de deux-pièces, souvent sans ascenseur."],
      ['Rive gauche', "Saint-Germain, le Quartier latin, le 7e : appartements haussmanniens, moulures et parquet, vues possibles sur les toits ou la tour Eiffel."],
      ['Montmartre et le nord-est', "Rues en pente et escaliers, ateliers d'artistes et appartements plus simples, une clientèle de couples et de jeunes voyageurs."],
      ["L'ouest parisien", "15e, 16e et 17e : grands appartements familiaux dans des immeubles calmes, plus souvent avec ascenseur et balcon."],
    ],
    photo: "À Paris, les surfaces sont petites et la concurrence énorme : la photo doit vendre le cachet (moulures, parquet, poutres) et ce qu'on voit par la fenêtre. Une vue sur les toits ou un monument se met en couverture.",
    menage: "À Paris, le temps d'accès pèse autant que le ménage : étages sans ascenseur, stationnement rare, linge à porter. Une équipe qui regroupe ses logements par arrondissement tient mieux les horaires entre deux voyageurs.",
  },
  lyon: {
    quartiers: [
      ["Presqu'île", "Entre Rhône et Saône, immeubles haussmanniens et appartements de standing, au cœur des commerces et de Bellecour."],
      ['Vieux-Lyon', "Immeubles Renaissance, traboules, pierres apparentes et plafonds à la française au pied de Fourvière, dans des rues piétonnes."],
      ['Croix-Rousse', "Anciens ateliers de canuts : très hauts plafonds, grandes fenêtres et poutres. Les pentes sont raides et les escaliers nombreux."],
      ['Part-Dieu et Confluence', "Quartiers d'affaires et immeubles récents, près de la gare et des bureaux : la clientèle pro de la semaine."],
    ],
    photo: "À Lyon, chaque quartier a sa signature : la pierre du Vieux-Lyon, les plafonds des canuts, la vue sur Fourvière ou les quais. La mettre en couverture distingue l'annonce des appartements récents, nombreux autour de la Part-Dieu.",
    menage: "À Lyon, les turnovers se jouent dans des rues piétonnes (Vieux-Lyon), sur des pentes à escaliers (Croix-Rousse) et sur des séjours d'affaires en semaine (Part-Dieu). Regrouper les logements par quartier évite de traverser la ville entre deux créneaux.",
  },
  annecy: {
    quartiers: [
      ['Vieille ville', "Maisons anciennes le long du Thiou et des canaux, rues piétonnes, petits appartements au cachet fort."],
      ['Bords du lac', "Résidences avec balcon et vue sur l'eau ou les montagnes, les plus demandées de l'été."],
      ['Rive est du lac', "Veyrier-du-Lac, Talloires : maisons et appartements plus calmes, souvent avec un extérieur et une vue."],
      ['Annecy-le-Vieux et les hauteurs', "Quartiers résidentiels, logements plus grands avec parking, une clientèle de familles."],
    ],
    photo: "À Annecy, l'annonce se vend sur la vue et la distance au lac. Un appartement de la vieille ville joue le cachet des canaux, une maison des hauteurs joue l'espace, le jardin et la vue dégagée.",
    menage: "À Annecy, la vieille ville impose des accès à pied et des parkings payants, et les rives du lac des trajets plus longs l'été. Une équipe qui tourne sur un seul secteur le samedi tient mieux son planning.",
  },
  bordeaux: {
    quartiers: [
      ['Saint-Pierre et Saint-Michel', "Le vieux Bordeaux : immeubles en pierre blonde, appartements anciens, rues étroites et souvent piétonnes."],
      ['Les Chartrons', "Anciens chais et maisons de négociants, lofts et appartements rénovés, une ambiance de village près des quais."],
      ["Triangle d'or et Quinconces", "Immeubles classiques du XVIIIe siècle, grands appartements de standing en plein centre."],
      ['La Bastide et les Bassins à flot', "Rive droite et nouveaux quartiers : immeubles récents, balcons, vue sur la Garonne ou sur les bassins."],
    ],
    photo: "À Bordeaux, la pierre blonde, les parquets et les hauts plafonds font la marque des appartements du centre ; une vue sur les quais ou la Garonne se met en couverture. Les logements neufs des Bassins à flot se vendent sur la terrasse et la lumière.",
    menage: "À Bordeaux, le centre historique est en bonne partie piéton et le stationnement difficile : le temps d'accès et le transport du linge comptent dans le tarif. Les quartiers neufs, avec parking et ascenseur, se traitent plus vite.",
  },
  roanne: {
    quartiers: [
      ['Centre-ville', "Appartements en immeubles anciens autour de l'hôtel de ville et des rues commerçantes, à pied de la gare."],
      ['Le port et les bords de Loire', "Logements près du port de plaisance et des quais, au calme."],
      ['Riorges, Mably, Le Coteau', "Communes voisines : maisons avec jardin et appartements plus récents, avec parking."],
      ['La Côte Roannaise', "Villages et maisons au milieu des vignes, gîtes et grands logements pour les familles et les groupes."],
    ],
    photo: "À Roanne, la clientèle pro cherche le pratique, les familles l'espace : un appartement du centre se vend sur la gare à pied et le bureau, une maison de la Côte Roannaise sur le jardin, la terrasse et la vue sur les vignes.",
    menage: "À Roanne, les rotations de la semaine viennent des déplacements pros, en centre-ville et près de la gare. L'été, les maisons de la Côte Roannaise demandent plus de temps : extérieurs, linge des familles et route entre deux villages.",
  },
  'les-sables-d-olonne': {
    quartiers: [
      ['Le remblai et la Grande Plage', "Appartements face à la mer dans des résidences avec balcon : les plus demandés et les plus chers."],
      ['La Chaume', "L'ancien quartier des pêcheurs, face au port : petites maisons et ruelles."],
      ['Port Olona et le centre', "Appartements près du port de plaisance et des commerces, pratiques toute l'année."],
      ["Château-d'Olonne et Olonne-sur-Mer", "Maisons avec jardin, plus au calme, près des plages et de la forêt d'Olonne."],
    ],
    photo: "Aux Sables-d'Olonne, la vue et la distance à la plage font l'annonce : balcon face au remblai, vue sur le port depuis La Chaume. Pour une maison des Olonnes, montrer le jardin et le chemin jusqu'à la mer.",
    menage: "Aux Sables-d'Olonne, l'été se joue le samedi, entre les résidences du remblai (ascenseurs et parkings saturés) et les maisons des Olonnes (jardin, terrasse, plus de linge). Regrouper les logements par secteur limite la route ce jour-là.",
  },
  nantes: {
    quartiers: [
      ['Bouffay et le centre', "Le quartier médiéval et piéton autour du château des ducs de Bretagne : appartements anciens et petites surfaces."],
      ['Graslin et Commerce', "Immeubles des XVIIIe et XIXe siècles, appartements de standing, hauts plafonds et parquet."],
      ['Île de Nantes', "Un quartier en reconversion : immeubles neufs et lofts, près des Machines de l'île."],
      ['Quartier de la gare', "Appartements pratiques à pied du TGV, pour la clientèle pro et les séjours courts."],
    ],
    photo: "À Nantes, deux styles s'opposent : l'ancien du Bouffay et de Graslin (pierre, parquet, moulures) et le neuf de l'île de Nantes (lumière, balcon, vue sur la Loire). La photo de couverture doit dire tout de suite lequel.",
    menage: "À Nantes, le Bouffay est piéton et se traite à pied ; l'île de Nantes et le quartier de la gare, plus récents, vont plus vite. La clientèle pro crée des rotations en semaine, pas seulement le week-end.",
  },
  lille: {
    quartiers: [
      ['Vieux-Lille', "Maisons et immeubles flamands en brique, rues pavées, appartements de caractère, souvent en étage."],
      ["Centre et Grand'Place", "Immeubles anciens et appartements près des commerces, de l'opéra et de la Vieille Bourse."],
      ['Euralille et les gares', "Le quartier d'affaires entre Lille-Flandres et Lille-Europe : appartements récents pour la clientèle pro et les voyageurs de passage."],
      ['Wazemmes et Vauban', "Quartiers vivants, maisons de ville en brique et appartements, près du marché de Wazemmes et de la Citadelle."],
    ],
    photo: "À Lille, la brique, les poutres et les rues pavées du Vieux-Lille font des couvertures fortes. Les appartements près des gares se vendent sur l'accès en train vers Paris, Bruxelles et Londres, à écrire en légende.",
    menage: "À Lille, les turnovers suivent deux rythmes : la semaine pour la clientèle pro près des gares, les week-ends et la Braderie pour le tourisme. Le Vieux-Lille, pavé et dense, se fait à pied.",
  },
  'le-mans': {
    quartiers: [
      ['La Cité Plantagenêt', "La vieille ville médiévale : maisons à colombages, ruelles pavées, logements de caractère."],
      ['Centre et gare', "Appartements pratiques à pied de la gare, pour les voyageurs d'affaires et les séjours courts."],
      ['Le sud, vers le circuit', "Maisons et logements proches du circuit des 24 Heures, pris d'assaut pendant les courses."],
    ],
    photo: "Au Mans, la Cité Plantagenêt donne des photos à part : colombages, pierre et ruelles. Pour un logement proche du circuit, la distance aux 24 Heures et le parking se mettent en légende de la couverture.",
    menage: "Au Mans, l'année se joue sur quelques semaines : les 24 Heures et les grandes courses remplissent tout en même temps, avec des séjours de groupe et beaucoup de linge. L'équipe se réserve des mois à l'avance.",
  },
  toulouse: {
    quartiers: [
      ['Capitole et Carmes', "Le cœur historique en brique rose : appartements anciens, poutres, hauts plafonds, rues piétonnes."],
      ['Saint-Cyprien', "Sur la rive gauche, un quartier vivant face à la Garonne : appartements anciens et vue sur les quais."],
      ['Matabiau et Compans-Caffarelli', "Près de la gare et du quartier d'affaires : appartements récents pour la clientèle pro."],
      ["Blagnac et l'ouest", "Autour de l'aéroport et de l'aéronautique : logements récents avec parking, séjours de travail en semaine."],
    ],
    photo: "À Toulouse, la brique rose et les poutres du centre font les plus belles couvertures ; une vue sur la Garonne ou le Capitole se place en tête. Près de l'aéroport, la clientèle de l'aéronautique cherche le bureau, le parking et le calme.",
    menage: "À Toulouse, la clientèle pro de l'aéronautique crée des séjours en semaine, côté Blagnac et gare ; le centre, piéton et sans stationnement, demande plus de temps d'accès.",
  },
  tours: {
    quartiers: [
      ['Vieux-Tours et place Plumereau', "Maisons à pans de bois et ruelles, appartements anciens au cœur de la vie du soir."],
      ['La cathédrale et le centre', "Immeubles en tuffeau, appartements bourgeois, au calme près de la cathédrale Saint-Gatien."],
      ['La gare et les Prébendes', "Quartier résidentiel près de la gare et du jardin des Prébendes, pratique pour les séjours courts."],
      ['Les bords de Loire', "Appartements avec vue sur le fleuve, point de départ vers les châteaux."],
    ],
    photo: "À Tours, le tuffeau blanc, les pans de bois et la Loire font l'identité des logements. Beaucoup de voyageurs viennent pour les châteaux : la distance aux châteaux et à la gare se met en légende.",
    menage: "À Tours, le Vieux-Tours est piéton et animé tard : prévoir l'accès et le bruit de la place Plumereau dans les consignes. Les séjours courts des visiteurs des châteaux rapprochent les rotations au printemps et en été.",
  },
  cannes: {
    quartiers: [
      ['La Croisette', "Résidences et appartements face à la mer, entre le Palais des Festivals et la pointe, les plus demandés pendant les salons."],
      ['Le Suquet', "La vieille ville sur la colline : ruelles en pente, maisons anciennes et vue sur la baie."],
      ["Centre et rue d'Antibes", "Appartements bourgeois à quelques rues de la mer, à pied du Palais."],
      ['La Californie et Super-Cannes', "Les hauteurs : villas et grands appartements avec terrasse et vue dégagée sur la mer."],
    ],
    photo: "À Cannes, la clientèle des salons et du Festival veut voir un logement de standing et la distance au Palais ; celle de l'été veut la mer. Une terrasse avec vue sur la baie se met en couverture, la marche jusqu'au Palais en légende.",
    menage: "À Cannes, les salons enchaînent des séjours courts d'une clientèle pro très exigeante, avec des arrivées en milieu de semaine. Le centre et la Croisette sont saturés pendant les événements : prévoir l'accès et le stationnement dans le planning.",
  },
  strasbourg: {
    quartiers: [
      ['La Grande Île', "Le centre historique classé par l'Unesco, autour de la cathédrale : immeubles anciens, poutres, petites surfaces."],
      ['La Petite France', "Maisons à colombages au bord de l'Ill et ruelles pavées : les logements les plus photographiés."],
      ['La Neustadt', "Le quartier allemand de la fin du XIXe siècle : grands appartements, hauts plafonds, larges avenues."],
      ['Le quartier européen', "Près du Parlement européen et du Conseil de l'Europe : appartements récents pour la clientèle des institutions."],
    ],
    photo: "À Strasbourg, les colombages et la cathédrale font la couverture idéale. En décembre, les voyageurs du marché de Noël cherchent l'ambiance (poutres, plaid, lumières chaudes) et la distance à pied jusqu'aux marchés.",
    menage: "À Strasbourg, décembre concentre les rotations du marché de Noël, et les sessions du Parlement européen remplissent la semaine côté quartier européen. La Grande Île est piétonne : prévoir les accès et le portage du linge.",
  },
  nice: {
    quartiers: [
      ['Le Vieux-Nice', "Ruelles étroites, immeubles anciens aux façades colorées, appartements souvent en étage sans ascenseur."],
      ['La Promenade des Anglais', "Résidences face à la mer, balcons et vue sur la baie des Anges."],
      ['Le port', "Quartier vivant autour du port Lympia, immeubles à l'italienne et appartements rénovés."],
      ['Cimiez et les collines', "Hauteurs résidentielles : villas, grands appartements bourgeois et jardins, plus au calme."],
    ],
    photo: "À Nice, la mer et les façades colorées font la couverture. Un appartement du Vieux-Nice se vend sur le cachet et l'emplacement, une résidence de la Promenade sur le balcon et la vue sur la baie des Anges.",
    menage: "À Nice, le Vieux-Nice est piéton et souvent sans ascenseur, la Promenade et le port sont saturés l'été. Une équipe qui regroupe ses logements par quartier tient mieux les arrivées du samedi et les séjours courts du Carnaval.",
  },
  marseille: {
    quartiers: [
      ['Le Vieux-Port et le Panier', "Le cœur historique : immeubles anciens, ruelles en pente du Panier, vue sur le port."],
      ['La Corniche et les Catalans', "Appartements et maisons face à la mer, vue sur les îles du Frioul."],
      ['Endoume et le Roucas-Blanc', "Quartiers résidentiels sur les hauteurs : maisons, terrasses et vues sur la rade."],
      ['Les Goudes et les calanques', "Au sud, cabanons et maisons de pêcheurs au bord des calanques, isolés et très recherchés l'été."],
    ],
    photo: "À Marseille, la mer et la lumière font tout : une terrasse avec vue sur la rade ou sur le Vieux-Port se met en couverture. Un logement du Panier se vend sur son caractère et la marche jusqu'au port.",
    menage: "À Marseille, les distances sont longues entre le centre, la Corniche et les quartiers sud, et le stationnement difficile : regrouper les logements par secteur et compter le temps de route. L'été, les logements près de la mer demandent plus de soin aux sols et aux douches.",
  },
  montpellier: {
    quartiers: [
      ["L'Écusson", "Le centre historique piéton : hôtels particuliers, immeubles anciens, appartements aux hauts plafonds."],
      ['Antigone', "Immeubles néoclassiques des années 1980, appartements pratiques entre le centre et le Lez."],
      ['Port Marianne', "Quartier récent au bord du Lez : immeubles contemporains, balcons, parkings."],
      ['Les Beaux-Arts et Boutonnet', "Quartiers résidentiels près du centre, maisons de ville et appartements, prisés des familles et des étudiants."],
    ],
    photo: "À Montpellier, la pierre blonde de l'Écusson et l'architecture moderne de Port Marianne donnent deux annonces très différentes ; la proximité du tram et des plages se met en légende.",
    menage: "À Montpellier, l'Écusson est piéton et le stationnement rare : l'accès se fait à pied avec le linge. Port Marianne et Antigone, avec parking et ascenseur, se traitent plus vite. Hors été, la clientèle pro et étudiante remplit la semaine.",
  },
  rennes: {
    quartiers: [
      ['Le centre historique', "Maisons à pans de bois autour de la place Sainte-Anne et du Parlement de Bretagne, appartements de caractère."],
      ['Le Thabor et Saint-Hélier', "Quartiers résidentiels bourgeois près du parc du Thabor, grands appartements et maisons."],
      ['La gare et EuroRennes', "Le quartier d'affaires en renouvellement autour de la gare : appartements récents pour la clientèle pro."],
    ],
    photo: "À Rennes, les pans de bois du centre et le parc du Thabor donnent des photos à part. Près de la gare, la clientèle pro cherche le bureau, le wifi et l'accès au TGV, à écrire en légende.",
    menage: "À Rennes, la clientèle pro et étudiante remplit la semaine, et les grands événements comme les Transmusicales de décembre concentrent les rotations. Le centre historique est en grande partie piéton.",
  },
  bayonne: {
    quartiers: [
      ['Le Grand Bayonne', "Autour de la cathédrale : immeubles anciens à colombages et volets colorés, rues piétonnes."],
      ['Le Petit Bayonne', "Entre la Nive et l'Adour, le quartier animé des quais et du Musée basque, appartements anciens."],
      ['Saint-Esprit', "Sur la rive droite de l'Adour, autour de la gare : appartements pratiques, quartier en rénovation."],
    ],
    photo: "À Bayonne, les façades à colombages et les volets rouges ou verts au bord de la Nive font la couverture. Pendant les Fêtes de Bayonne, les voyageurs cherchent la proximité du centre : à écrire en légende.",
    menage: "À Bayonne, les Fêtes de juillet remplissent tout en même temps, avec des groupes et beaucoup de linge ; le reste de l'année, la clientèle va et vient vers la côte. Les deux quartiers historiques sont piétons par endroits.",
  },
  biarritz: {
    quartiers: [
      ['La Grande Plage et le centre', "Appartements de standing face à l'océan, près du casino et de l'hôtel du Palais."],
      ['Le Port des Pêcheurs', "Petites maisons et appartements au-dessus du port et du Rocher de la Vierge, vues sur l'océan."],
      ['La Côte des Basques', "Au pied des falaises, le spot de surf : appartements avec vue, clientèle sportive."],
      ['Les quartiers résidentiels', "Villas basques et maisons avec jardin, plus au calme, à quelques minutes des plages."],
    ],
    photo: "À Biarritz, l'océan fait la couverture : vue sur la Grande Plage, la Côte des Basques ou le Rocher de la Vierge. Une villa basque se vend sur son architecture (colombages, volets) et son jardin.",
    menage: "À Biarritz, l'été et les grands week-ends saturent le centre et le stationnement. Les surfeurs rapportent du sable et des combinaisons mouillées : prévoir les sols, les douches et un coin de séchage dans chaque prestation.",
  },
  arcachon: {
    quartiers: [
      ["La Ville d'Hiver", "Villas du XIXe siècle dans les pins, maisons de caractère avec jardin, sur les hauteurs."],
      ["La Ville d'Été", "Le front de mer et le centre : appartements près de la plage, de la jetée Thiers et des commerces."],
      ['Le Moulleau', "Quartier village au sud, près des plages et de la dune du Pilat : maisons et petites résidences."],
    ],
    photo: "À Arcachon, une villa de la Ville d'Hiver se vend sur son architecture et ses pins, un appartement de la Ville d'Été sur la plage à pied. La lumière du bassin en fin de journée fait de très belles photos extérieures.",
    menage: "À Arcachon, la saison est courte et dense, avec des arrivées le samedi en juillet et août. Les villas de la Ville d'Hiver demandent du temps (jardins, terrasses, grands volumes de linge), et le sable s'invite dans chaque logement l'été.",
  },
  'la-rochelle': {
    quartiers: [
      ['Le Vieux-Port et le centre', "Arcades, hôtels particuliers et immeubles anciens autour des tours du Vieux-Port, rues piétonnes."],
      ['Les Minimes', "Le quartier du port de plaisance et de l'université : résidences récentes, balcons, vue sur les bateaux."],
      ['Saint-Nicolas et le Gabut', "Quartier vivant près de la gare et de l'Aquarium : maisons de ville et logements colorés du Gabut."],
    ],
    photo: "À La Rochelle, les tours du Vieux-Port et les arcades font la couverture ; aux Minimes, c'est la vue sur le port de plaisance. La marche jusqu'au Vieux-Port et la proximité de l'île de Ré se mettent en légende.",
    menage: "À La Rochelle, l'été et les Francofolies concentrent les rotations. Le centre historique est en partie piéton et le stationnement difficile ; les résidences des Minimes, avec parking, se traitent plus vite.",
  },
  colmar: {
    quartiers: [
      ['La Petite Venise', "Maisons à colombages colorées au bord de la Lauch : le quartier le plus photographié."],
      ['La vieille ville', "Autour de la collégiale Saint-Martin et du quartier des Tanneurs : immeubles anciens, appartements de caractère."],
      ['Les villages de la route des vins', "Eguisheim, Kaysersberg, Riquewihr : gîtes et maisons pour les familles, à quelques kilomètres."],
    ],
    photo: "À Colmar, les colombages et les canaux de la Petite Venise font la couverture. En décembre, les voyageurs des marchés de Noël cherchent l'ambiance : poutres, lumières chaudes, vue sur les maisons illuminées.",
    menage: "À Colmar, décembre concentre la demande avec les marchés de Noël, puis l'été sur la route des vins. La vieille ville est piétonne et saturée en fin d'année : prévoir l'accès et le stationnement.",
  },
  menton: {
    quartiers: [
      ['La vieille ville', "Ruelles en escaliers et façades ocre autour de la basilique Saint-Michel, vue sur la mer."],
      ['Garavan', "Quartier résidentiel près de la frontière italienne : villas, jardins et vue sur la baie."],
      ['Le front de mer et le centre', "Résidences et appartements le long de la promenade du Soleil, près des plages."],
    ],
    photo: "À Menton, les façades ocre de la vieille ville et la mer font la couverture. La douceur de l'hiver attire une clientèle de séjours longs, qui regarde la terrasse, le soleil et le calme.",
    menage: "À Menton, la Fête du Citron de février concentre les rotations d'hiver, la plage celles de l'été. La vieille ville est en escaliers : prévoir le portage du linge et du matériel.",
  },
  avignon: {
    quartiers: [
      ['Intra-muros', "Dans les remparts : hôtels particuliers, maisons anciennes et appartements autour du palais des Papes, rues étroites."],
      ['La rue des Teinturiers', "Rue pavée au bord de la Sorgue, roues à aubes et platanes, logements de caractère."],
      ['Hors des remparts et Villeneuve', "Maisons avec jardin et parking hors des murs ; de l'autre côté du Rhône, Villeneuve-lès-Avignon offre la vue sur le palais."],
    ],
    photo: "À Avignon, la pierre, les poutres et une vue sur le palais des Papes ou les remparts font la couverture. Hors des remparts, le jardin et le temps de marche jusqu'au centre se mettent en légende.",
    menage: "À Avignon, le Festival de juillet remplit tout en même temps, souvent pour plusieurs nuits d'affilée. Intra-muros, les rues sont étroites et le stationnement presque impossible : l'accès se fait à pied avec le linge.",
  },
  'aix-en-provence': {
    quartiers: [
      ['Le centre historique', "Hôtels particuliers, fontaines et immeubles en pierre autour du cours Mirabeau, appartements aux plafonds hauts."],
      ['Le quartier Mazarin', "Rues droites du XVIIe siècle au sud du cours Mirabeau : appartements bourgeois, au calme."],
      ['Les environs et la campagne aixoise', "Mas, bastides et maisons avec piscine dans la campagne, vers la Sainte-Victoire."],
    ],
    photo: "À Aix-en-Provence, la pierre blonde, les volets et les fontaines du centre font la couverture ; un mas de la campagne se vend sur la piscine, le jardin et la vue sur la Sainte-Victoire.",
    menage: "À Aix-en-Provence, le centre est piéton et le stationnement difficile, la campagne demande de la route et l'entretien des extérieurs. Le Festival d'art lyrique de juillet concentre les rotations d'été.",
  },
  ajaccio: {
    quartiers: [
      ['La vieille ville', "Autour de la citadelle et de la maison Bonaparte : immeubles anciens aux façades colorées, appartements en étage."],
      ['Le centre et le cours Napoléon', "Appartements des immeubles du XIXe siècle, près du port et du marché."],
      ['La route des Sanguinaires', "Résidences et villas face à la mer jusqu'aux îles Sanguinaires, plages et couchers de soleil."],
    ],
    photo: "À Ajaccio, la mer fait la couverture : vue sur le golfe ou sur les îles Sanguinaires au coucher du soleil. En vieille ville, le cachet des façades et la proximité du port se mettent en légende.",
    menage: "À Ajaccio, la saison est courte et dense, avec des arrivées qui suivent les bateaux et les avions. La route des Sanguinaires est longue et chargée l'été : regrouper les logements par secteur.",
  },
  meaux: {
    quartiers: [
      ['La cité épiscopale et le centre', "Autour de la cathédrale Saint-Étienne et des remparts : appartements anciens, rues commerçantes, tout à pied."],
      ['Les bords de Marne et le Marché', "De part et d'autre de la Marne : immeubles et maisons de ville près des quais et du marché."],
      ['La gare', "Appartements récents et anciens autour de la gare, pratiques pour la clientèle qui travaille à Paris."],
      ['Les quartiers résidentiels', "Maisons avec jardin et parking sur les hauteurs et en périphérie, recherchées par les familles en route vers Disneyland Paris."],
    ],
    photo: "À Meaux, la cathédrale et la cité épiscopale font les plus belles couvertures. Pour une maison familiale, le jardin, les couchages et la route vers Disneyland Paris se mettent en avant.",
    menage: "À Meaux, les familles de Disneyland Paris remplissent les vacances scolaires et les week-ends, la clientèle pro la semaine. Les maisons de périphérie demandent plus de linge et l'entretien des extérieurs.",
  },
  amiens: {
    quartiers: [
      ['Saint-Leu', "Ancien quartier des teinturiers au bord de la Somme : maisons colorées, canaux, ambiance vivante."],
      ['La cathédrale et le centre', "Autour de la cathédrale Notre-Dame et des rues commerçantes : appartements anciens et rénovés."],
      ['Henriville', "Quartier résidentiel aux maisons bourgeoises en brique, près de la gare."],
    ],
    photo: "À Amiens, la cathédrale et les maisons colorées de Saint-Leu au bord de l'eau font les plus belles couvertures. Pour un logement près de la gare, l'accès à Paris en train se met en légende.",
    menage: "À Amiens, la clientèle pro et étudiante remplit la semaine, le marché de Noël et Chroma, le spectacle de lumière sur la cathédrale, attirent les visiteurs. Saint-Leu est en partie piéton.",
  },
  angers: {
    quartiers: [
      ['Le centre et la cathédrale', "Immeubles en tuffeau et ardoise autour de la cathédrale et du château, appartements anciens."],
      ['La Doutre', "Rive droite de la Maine : maisons à pans de bois et ruelles, le quartier de caractère."],
      ['La gare et Saint-Laud', "Quartier d'affaires en renouvellement autour de la gare : appartements récents pour la clientèle pro."],
    ],
    photo: "À Angers, le tuffeau, l'ardoise et les pans de bois de la Doutre donnent des photos à part ; une vue sur le château ou la Maine se met en couverture.",
    menage: "À Angers, la clientèle pro et étudiante remplit la semaine, et les grands rendez-vous comme les Accroche-Cœurs en septembre concentrent les rotations. Le centre ancien est en partie piéton.",
  },
  antibes: {
    quartiers: [
      ['La vieille ville', "Ruelles et maisons anciennes derrière les remparts, près du port Vauban et du musée Picasso."],
      ['Juan-les-Pins', "La station balnéaire : résidences près des plages et de la pinède, vie nocturne l'été."],
      ["Le cap d'Antibes", "Villas et propriétés dans la verdure, criques et vue sur la mer, au calme."],
    ],
    photo: "À Antibes, la mer, les remparts et le port Vauban font la couverture ; à Juan-les-Pins, c'est la plage et la terrasse. Une villa du cap se vend sur le jardin, la piscine et la vue.",
    menage: "À Antibes, l'été et Jazz à Juan saturent Juan-les-Pins, et les villas du cap demandent du temps (extérieurs, grands volumes de linge). La vieille ville se fait à pied.",
  },
  bastia: {
    quartiers: [
      ['Le Vieux-Port et Terra Vecchia', "Hautes façades colorées autour du Vieux-Port, appartements anciens souvent sans ascenseur."],
      ['La citadelle (Terra Nova)', "Au-dessus du port, ruelles et maisons anciennes, vue sur la mer."],
      ['Le Cap Corse et les environs', "Villages de pêcheurs et maisons face à la mer, au nord de la ville."],
    ],
    photo: "À Bastia, les façades colorées du Vieux-Port et la vue depuis la citadelle font la couverture. Pour une maison du Cap Corse, la mer et le village se montrent dès la première photo.",
    menage: "À Bastia, les arrivées suivent les ferries et les avions, l'été surtout. Les immeubles du Vieux-Port sont hauts et rarement équipés d'ascenseur : prévoir le portage du linge.",
  },
  beaune: {
    quartiers: [
      ['Le centre dans les remparts', "Autour des Hospices de Beaune : maisons anciennes, caves, appartements de caractère."],
      ['Les faubourgs', "Maisons de ville et logements avec parking, à quelques minutes à pied du centre."],
      ['Les villages viticoles', "Pommard, Meursault, Savigny-lès-Beaune : maisons de vignerons et gîtes au milieu des vignes."],
    ],
    photo: "À Beaune, les toits vernissés, la pierre et les caves voûtées font des photos à part ; une maison de village se vend sur la vue sur les vignes.",
    menage: "À Beaune, la vente des vins des Hospices en novembre et les vendanges concentrent les rotations, et la clientèle œnotouristique reste souvent peu de nuits. Les villages demandent de la route.",
  },
  brest: {
    quartiers: [
      ['Le centre et Siam', "Le centre reconstruit après la guerre : immeubles en pierre claire, appartements spacieux autour de la rue de Siam."],
      ['Recouvrance', "Rive droite de la Penfeld, face au château : le quartier historique, petites maisons et vue sur l'arsenal."],
      ['Le port de commerce et le Moulin Blanc', "Logements près des quais, du port de plaisance et d'Océanopolis."],
    ],
    photo: "À Brest, la mer et la rade font la couverture : vue sur le port, le château ou le pont de Recouvrance. Les appartements du centre se vendent sur l'espace et la lumière.",
    menage: "À Brest, la clientèle pro et militaire remplit la semaine, les grandes fêtes maritimes concentrent les rotations l'été où elles ont lieu. Le climat humide demande d'aérer et de bien sécher le linge.",
  },
  caen: {
    quartiers: [
      ['Le centre et le château', "Immeubles en pierre de Caen autour du château de Guillaume le Conquérant, appartements anciens et reconstruits."],
      ['Le Vaugueux', "Petit quartier ancien aux maisons à colombages et restaurants, au pied du château."],
      ['La presqu\'île et le port', "Quartier récent au bord du bassin : immeubles neufs, balcons, vue sur l'eau."],
    ],
    photo: "À Caen, la pierre claire et le château font la couverture ; pour les voyageurs des plages du Débarquement, la distance à la côte et au Mémorial se met en légende.",
    menage: "À Caen, la clientèle pro et étudiante remplit la semaine, les visiteurs des plages du Débarquement le printemps et l'été, avec un pic autour du 6 juin. Le centre est en partie piéton.",
  },
  carcassonne: {
    quartiers: [
      ['La Cité', "La cité médiévale dans ses remparts : maisons anciennes, ruelles, accès en voiture très limité."],
      ['La Bastide Saint-Louis', "La ville basse : immeubles anciens autour de la place Carnot, appartements pratiques près de la gare."],
      ['Les environs', "Maisons et gîtes dans les vignes et la campagne audoise, souvent avec piscine."],
    ],
    photo: "À Carcassonne, une vue sur la Cité, surtout illuminée le soir, se met en couverture. Dans la Bastide, la proximité de la gare et du canal du Midi se met en légende.",
    menage: "À Carcassonne, l'été et le 14 juillet concentrent les rotations. Dans la Cité, la circulation est très limitée : prévoir l'accès et le portage du linge.",
  },
  chambery: {
    quartiers: [
      ['La vieille ville', "Autour de la fontaine des Éléphants et du château des ducs de Savoie : immeubles anciens aux façades colorées, passages couverts."],
      ['Le centre et la gare', "Appartements pratiques pour la clientèle pro et les voyageurs vers les stations."],
      ['Les environs et le lac du Bourget', "Maisons avec vue sur les montagnes ou le lac, entre Chambéry et Aix-les-Bains."],
    ],
    photo: "À Chambéry, les façades colorées de la vieille ville et la vue sur les montagnes font la couverture. Pour les skieurs, la distance aux stations se met en légende ; l'été, celle du lac du Bourget.",
    menage: "À Chambéry, la clientèle pro remplit la semaine, et l'hiver amène des voyageurs de passage vers les stations, avec des arrivées le samedi. La vieille ville se fait à pied.",
  },
  chamonix: {
    quartiers: [
      ['Le centre', "Rues piétonnes, chalets et résidences près des commerces et de la gare du Montenvers."],
      ['Les Praz et Argentière', "Villages du haut de la vallée : chalets et appartements près des pistes et des Grands Montets."],
      ['Les Bossons et Les Houches', "Bas de la vallée : chalets avec vue sur le mont Blanc et le glacier des Bossons."],
    ],
    photo: "À Chamonix, le mont Blanc fait la couverture : une vue depuis le balcon passe avant tout. Un chalet se vend sur le bois, la cheminée et la distance aux remontées, à écrire en légende.",
    menage: "À Chamonix, hiver et été sont deux saisons pleines, avec des arrivées le samedi. Neige, chaussures de ski et matériel mouillé demandent un soin particulier des entrées et des casiers ; les chalets de la vallée demandent de la route.",
  },
  'clermont-ferrand': {
    quartiers: [
      ['Le centre ancien', "Autour de la cathédrale en pierre de Volvic : immeubles anciens et appartements de caractère."],
      ['Montferrand', "L'autre cœur historique : hôtels particuliers et maisons Renaissance, plus au calme."],
      ['Les Carmes et la gare', "Quartiers pratiques pour la clientèle pro, près de Michelin et de la gare."],
    ],
    photo: "À Clermont-Ferrand, la pierre noire de Volvic et la vue sur le puy de Dôme font des photos uniques ; pour la clientèle pro, le bureau et le parking se mettent en légende.",
    menage: "À Clermont-Ferrand, la clientèle pro remplit la semaine, et le festival du court métrage en février concentre les rotations. Le centre ancien est en pente et en partie piéton.",
  },
  deauville: {
    quartiers: [
      ['Le centre et les Planches', "Villas anglo-normandes, résidences et appartements près de la plage, du casino et des Planches."],
      ['Trouville', "De l'autre côté de la Touques : maisons de pêcheurs, port et plage, ambiance plus populaire."],
      ['Le Haras et Bénerville', "Quartiers résidentiels et villas au calme, près de l'hippodrome et du golf."],
    ],
    photo: "À Deauville, les colombages des villas anglo-normandes et la plage font la couverture ; la marche jusqu'aux Planches et au marché se met en légende.",
    menage: "À Deauville, les week-ends des Parisiens, les festivals et les ventes de chevaux remplissent l'agenda, avec beaucoup d'arrivées le vendredi soir. Les villas demandent du temps et le sable s'invite l'été.",
  },
  dijon: {
    quartiers: [
      ['Le centre historique', "Autour du palais des ducs et de la rue des Forges : hôtels particuliers, toits vernissés, appartements anciens."],
      ['Le quartier de la gare', "Appartements pratiques pour la clientèle pro et les voyageurs en route vers la Côte de Nuits."],
      ['Les Grésilles et la périphérie', "Logements plus récents avec parking, à quelques minutes du centre en tram."],
    ],
    photo: "À Dijon, les toits vernissés, les poutres et la pierre du centre font la couverture. Pour les amateurs de vin, la distance à la route des Grands Crus se met en légende.",
    menage: "À Dijon, la clientèle pro remplit la semaine, et la Foire gastronomique de novembre concentre les rotations. Le centre historique est en grande partie piéton.",
  },
  dinard: {
    quartiers: [
      ['La pointe du Moulinet et la plage de l\'Écluse', "Villas Belle Époque face à la mer, résidences près de la grande plage et du casino."],
      ['Le centre', "Appartements et maisons près du marché et des commerces, à quelques minutes des plages."],
      ['Saint-Énogat', "Quartier plus calme à l'ouest : maisons avec jardin, plage familiale."],
    ],
    photo: "À Dinard, les villas Belle Époque et la vue sur Saint-Malo depuis la côte font la couverture. La distance à pied jusqu'à la plage de l'Écluse se met en légende.",
    menage: "À Dinard, l'été et le Festival du film britannique, à l'automne, concentrent les rotations. Les villas demandent du temps (extérieurs, grands volumes) et le sable s'invite l'été.",
  },
  epernay: {
    quartiers: [
      ['L\'avenue de Champagne', "Maisons de champagne et demeures de prestige : les logements les plus recherchés."],
      ['Le centre', "Appartements et maisons de ville près des commerces et de la gare."],
      ['Les villages de la Côte des Blancs', "Maisons de vignerons et gîtes au milieu des vignes, Avize, Cramant, Le Mesnil-sur-Oger."],
    ],
    photo: "À Épernay, la vue sur les vignes et l'ambiance champenoise (caves, pierre, flûtes) font la couverture ; la marche jusqu'à l'avenue de Champagne se met en légende.",
    menage: "À Épernay, la clientèle œnotouristique reste souvent une ou deux nuits, les vendanges et Habits de Lumière, en décembre, concentrent les rotations. Les villages demandent de la route.",
  },
  etretat: {
    quartiers: [
      ['Le centre et le front de mer', "Maisons normandes à colombages et appartements près de la plage de galets et des falaises."],
      ['Les hauteurs', "Maisons avec jardin sur les coteaux, vue sur la mer ou sur la campagne."],
      ['Les villages voisins', "Bénouville, Le Tilleul, Bordeaux-Saint-Clair : gîtes et maisons au calme, à quelques minutes."],
    ],
    photo: "À Étretat, les falaises et l'arche font la couverture : une vue depuis le logement, même partielle, passe avant tout. Une maison normande se vend sur ses colombages et son jardin.",
    menage: "À Étretat, les week-ends et l'été sont très chargés, et le centre saturé de voitures : prévoir l'accès et le stationnement. Les galets et le vent marin salissent vite les entrées et les vitres.",
  },
  grenoble: {
    quartiers: [
      ['L\'hypercentre', "Autour de la place Grenette et de Notre-Dame : immeubles anciens, appartements avec vue sur les montagnes."],
      ['L\'île Verte et la Bastille', "Quartiers au bord de l'Isère, au pied de la Bastille, immeubles avec vue sur les massifs."],
      ['Europole et la gare', "Quartier d'affaires près de la gare : appartements récents pour la clientèle pro et scientifique."],
    ],
    photo: "À Grenoble, les montagnes sont dans toutes les fenêtres : une vue sur la Bastille, le Vercors ou la Chartreuse se met en couverture. Pour les skieurs, la distance aux stations se met en légende.",
    menage: "À Grenoble, la clientèle pro et scientifique remplit la semaine, les skieurs les week-ends d'hiver avec du matériel à ranger. Le centre se traite à pied ou en tram.",
  },
  honfleur: {
    quartiers: [
      ['Le Vieux Bassin', "Hautes maisons étroites aux façades d'ardoise et de bois autour du port : les logements les plus photographiés."],
      ['Le quartier Sainte-Catherine', "Autour de l'église en bois : ruelles pavées, maisons à colombages, appartements de caractère."],
      ['La côte de Grâce et les environs', "Maisons normandes avec jardin sur les hauteurs, vue sur l'estuaire."],
    ],
    photo: "À Honfleur, le Vieux Bassin et ses façades font la couverture : une vue sur le port vend l'annonce. Une maison des hauteurs se vend sur ses colombages, son jardin et la vue sur l'estuaire.",
    menage: "À Honfleur, les week-ends et l'été sont pleins, le centre est saturé et en partie piéton : prévoir l'accès et le portage du linge. Les maisons anciennes ont souvent des escaliers étroits.",
  },
  'la-baule': {
    quartiers: [
      ['Le front de mer', "Résidences face à la grande plage, balcons et vue sur la baie."],
      ['La Baule-les-Pins', "Villas balnéaires dans les pins, près du marché et de la plage."],
      ['Le Pouliguen et Pornichet', "Les communes voisines de la baie : maisons de pêcheurs, port et appartements près des plages."],
    ],
    photo: "À La Baule, la baie et la plage font la couverture : un balcon avec vue sur la mer passe avant tout. Une villa des Pins se vend sur son architecture, son jardin et la marche jusqu'à la plage.",
    menage: "À La Baule, la saison est courte et dense, avec des arrivées le samedi en juillet et août. Les résidences du front de mer ont des ascenseurs et des parkings saturés l'été, et le sable s'invite partout.",
  },
  'le-touquet': {
    quartiers: [
      ['Le centre et le front de mer', "Appartements et résidences près de la plage et de la rue Saint-Jean, cœur commerçant de la station."],
      ['La forêt', "Villas anglo-normandes dans les pins, grands jardins, au calme."],
      ['Stella-Plage et les environs', "Logements plus simples au sud, près des grandes plages."],
    ],
    photo: "Au Touquet, les villas dans les pins et la grande plage font la couverture ; la distance à la mer et à la rue Saint-Jean se met en légende.",
    menage: "Au Touquet, les week-ends et les vacances scolaires concentrent les rotations, avec une clientèle venue de Paris, de Lille et d'Angleterre. Les villas de la forêt demandent du temps et le sable s'invite partout.",
  },
  megeve: {
    quartiers: [
      ['Le village', "Le centre piéton autour de l'église : chalets anciens, appartements de standing, boutiques."],
      ['Le Mont d\'Arbois et Rochebrune', "Grands chalets près des pistes, vue sur le mont Blanc."],
      ['Demi-Quartier et Praz-sur-Arly', "Communes voisines : chalets et appartements plus accessibles, avec parking."],
    ],
    photo: "À Megève, le bois, la cheminée et une vue sur le mont Blanc font la couverture. Le ski aux pieds ou la distance aux remontées se met en légende.",
    menage: "À Megève, la clientèle haut de gamme attend un niveau hôtelier, avec des arrivées le samedi en hiver et en été. Neige, chaussures de ski et grands chalets demandent du temps ; le village est piéton.",
  },
  metz: {
    quartiers: [
      ['La colline Sainte-Croix et la cathédrale', "Le cœur historique en pierre de Jaumont : immeubles anciens et appartements de caractère."],
      ['Le quartier Impérial', "Autour de la gare : immeubles allemands du début du XXe siècle, grands appartements."],
      ['L\'Amphithéâtre et le Centre Pompidou', "Quartier récent près de Pompidou-Metz : immeubles neufs pour la clientèle pro."],
    ],
    photo: "À Metz, la pierre jaune de Jaumont et la cathédrale font la couverture. Près de la gare, l'accès au TGV et au Luxembourg se met en légende pour la clientèle pro.",
    menage: "À Metz, la clientèle pro et frontalière remplit la semaine, et le marché de Noël concentre les rotations de fin d'année. Le centre historique est en grande partie piéton.",
  },
  nancy: {
    quartiers: [
      ['La place Stanislas et la Vieille Ville', "Autour de la place classée par l'Unesco : hôtels particuliers, immeubles anciens, appartements de prestige."],
      ['La Ville Neuve', "Les rues commerçantes et l'architecture Art nouveau, grands appartements bourgeois."],
      ['La gare et Saurupt', "Quartiers pratiques près de la gare, villas Art nouveau à Saurupt."],
    ],
    photo: "À Nancy, une vue sur la place Stanislas ou une façade Art nouveau se met en couverture ; les hauts plafonds, les moulures et les vitraux font des photos à part.",
    menage: "À Nancy, la clientèle pro et étudiante remplit la semaine, et la Saint-Nicolas en décembre concentre les rotations. Le centre historique est en grande partie piéton.",
  },
  nimes: {
    quartiers: [
      ['L\'Écusson', "Le centre historique autour des Arènes et de la Maison Carrée : immeubles anciens, hôtels particuliers."],
      ['Les Jardins de la Fontaine', "Quartier bourgeois autour des jardins et de la tour Magne, au calme."],
      ['Les environs', "Mas et maisons avec piscine dans la garrigue, vers le pont du Gard et les Cévennes."],
    ],
    photo: "À Nîmes, la pierre, les Arènes et la Maison Carrée donnent le ton : une vue sur un monument ou une terrasse sur les toits se met en couverture. Un mas se vend sur sa piscine et son jardin.",
    menage: "À Nîmes, les ferias de Pentecôte et des Vendanges remplissent tout en même temps, avec des groupes et beaucoup de linge. L'Écusson est piéton et le stationnement difficile.",
  },
  pau: {
    quartiers: [
      ['Le centre et le château', "Autour du château et du quartier du Hédas : immeubles anciens, appartements de caractère."],
      ['Le boulevard des Pyrénées', "Immeubles bourgeois face à la chaîne des Pyrénées : la vue la plus recherchée."],
      ['Les quartiers anglais', "Villas du XIXe siècle et grands jardins, héritage de la clientèle anglaise d'hiver."],
    ],
    photo: "À Pau, la vue sur les Pyrénées depuis le boulevard se met en couverture. Les villas anglaises se vendent sur leur jardin et leurs volumes.",
    menage: "À Pau, la clientèle pro remplit la semaine, et le Grand Prix automobile de mai concentre les rotations. Le centre ancien est en partie piéton.",
  },
  perpignan: {
    quartiers: [
      ['Le centre historique', "Autour du Castillet et de la cathédrale : immeubles anciens aux façades colorées, appartements en étage."],
      ['Saint-Jean et la Loge', "Rues commerçantes et places animées, appartements près de tout."],
      ['Vers la côte', "Canet-en-Roussillon et les plages, à quelques minutes : résidences et maisons pour les vacances."],
    ],
    photo: "À Perpignan, les façades colorées et la lumière catalane font la couverture ; pour un logement en ville, la distance aux plages et à l'Espagne se met en légende.",
    menage: "À Perpignan, la clientèle de passage vers l'Espagne et la côte fait des séjours courts, Visa pour l'image en septembre concentre les rotations. Le centre historique est étroit et en partie piéton.",
  },
  poitiers: {
    quartiers: [
      ['Le centre historique', "Sur le plateau, autour de Notre-Dame-la-Grande : immeubles anciens, ruelles, appartements de caractère."],
      ['La gare et le bas de la ville', "Appartements pratiques pour la clientèle pro et étudiante, à pied du TGV."],
      ['Le Futuroscope', "Au nord, résidences et logements récents pour les familles qui visitent le parc."],
    ],
    photo: "À Poitiers, la pierre des églises romanes et les ruelles du centre font la couverture. Pour les familles, la distance au Futuroscope se met en légende.",
    menage: "À Poitiers, la clientèle pro et étudiante remplit la semaine, les familles du Futuroscope les vacances scolaires et les week-ends. Le centre, sur le plateau, est en pente et en partie piéton.",
  },
  quimper: {
    quartiers: [
      ['Le centre historique', "Autour de la cathédrale Saint-Corentin : maisons à pans de bois, ruelles, quais de l'Odet."],
      ['Locmaria', "Quartier des faïenceries au bord de l'Odet, maisons anciennes, au calme."],
      ['Vers la côte', "Bénodet, Fouesnant, la Forêt-Fouesnant : maisons de vacances près des plages."],
    ],
    photo: "À Quimper, les maisons à pans de bois, l'Odet et la cathédrale font la couverture ; pour un logement en ville, la distance aux plages de la côte se met en légende.",
    menage: "À Quimper, le Festival de Cornouaille en juillet concentre les rotations, la côte attire les familles l'été. Le centre historique est en grande partie piéton.",
  },
  reims: {
    quartiers: [
      ['La cathédrale et le centre', "Immeubles Art déco reconstruits après la Grande Guerre, appartements autour de la cathédrale et de la place d'Erlon."],
      ['Le quartier des maisons de champagne', "Autour de Saint-Remi et des crayères : demeures et appartements près des caves."],
      ['La gare et Clairmarais', "Quartier récent près de la gare : appartements pour la clientèle pro, à moins d'une heure de Paris en TGV."],
    ],
    photo: "À Reims, une vue sur la cathédrale et l'ambiance champenoise font la couverture ; la marche jusqu'aux maisons de champagne et à la gare se met en légende.",
    menage: "À Reims, la clientèle pro et les amateurs de champagne font des séjours courts, et le marché de Noël concentre les rotations de fin d'année. Le centre est en partie piéton.",
  },
  rouen: {
    quartiers: [
      ['Le Vieux-Rouen', "Rue du Gros-Horloge, place du Vieux-Marché : maisons à colombages, appartements de caractère, souvent en étage."],
      ['La cathédrale et Saint-Maclou', "Autour de la cathédrale peinte par Monet : immeubles anciens et ruelles."],
      ['La rive gauche et les quais', "Immeubles plus récents, appartements avec vue sur la Seine et la ville."],
    ],
    photo: "À Rouen, les colombages et la cathédrale font la couverture ; une vue sur les flèches ou sur la Seine distingue l'annonce.",
    menage: "À Rouen, la clientèle pro remplit la semaine, l'Armada concentre les rotations les années où elle a lieu. Le centre historique est piéton et les maisons à colombages ont des escaliers étroits.",
  },
  'saint-malo': {
    quartiers: [
      ['Intra-muros', "La ville close dans ses remparts : immeubles en granit d'armateurs, appartements avec vue sur la mer."],
      ['Saint-Servan', "Quartier village autour de la tour Solidor, ports et petites plages."],
      ['Paramé et le Sillon', "La grande plage et ses villas balnéaires, résidences face à la mer."],
    ],
    photo: "À Saint-Malo, le granit, les remparts et la mer font la couverture : une vue sur la plage du Sillon ou sur les îles vend l'annonce. Une villa de Paramé se vend sur la plage à pied.",
    menage: "À Saint-Malo, l'été, les Étonnants Voyageurs au printemps et la Route du Rhum certaines années concentrent les rotations. Intra-muros, l'accès en voiture est limité : prévoir le portage du linge.",
  },
  'saint-tropez': {
    quartiers: [
      ['Le port et le village', "Maisons colorées autour du port et de la Ponche : appartements de prestige, rues étroites."],
      ['Les Salins et la presqu\'île', "Villas avec piscine dans la verdure, près des plages, au calme."],
      ['Ramatuelle et Pampelonne', "Villas et maisons près de la plage de Pampelonne, la clientèle de l'été."],
    ],
    photo: "À Saint-Tropez, la mer, la piscine et la terrasse font la couverture : la clientèle compare des villas haut de gamme. Le soin du shooting et la mise en scène comptent plus qu'ailleurs.",
    menage: "À Saint-Tropez, la clientèle attend un niveau hôtelier, et la saison est courte et intense. Le village est saturé l'été et les villas demandent du temps : piscine, extérieurs, grands volumes de linge.",
  },
  sarlat: {
    quartiers: [
      ['La cité médiévale', "Maisons en pierre dorée et toits de lauzes, ruelles piétonnes : appartements et maisons de caractère."],
      ['Les abords du centre', "Maisons de ville et logements avec parking, à pied de la cité."],
      ['La vallée de la Dordogne', "Gîtes et maisons en pierre avec piscine, entre châteaux et villages perchés."],
    ],
    photo: "À Sarlat, la pierre dorée et les toits de lauzes font la couverture. Une maison du Périgord se vend sur sa piscine, sa terrasse et la vue sur la vallée.",
    menage: "À Sarlat, la saison est concentrée d'avril à octobre, avec des familles et des séjours d'une semaine en été. La cité est piétonne et les maisons de la vallée demandent de la route et l'entretien des piscines.",
  },
  sete: {
    quartiers: [
      ['Les canaux et le centre', "Immeubles colorés le long des canaux, appartements près des quais et des halles."],
      ['Le quartier haut et le mont Saint-Clair', "Rues en pente et maisons avec vue sur la mer et l'étang de Thau."],
      ['La Corniche et les plages', "Résidences et maisons près des grandes plages du Lido."],
    ],
    photo: "À Sète, les canaux, les bateaux colorés et la vue depuis le mont Saint-Clair font la couverture ; la distance aux plages se met en légende.",
    menage: "À Sète, l'été et la Saint-Louis, fin août, concentrent les rotations. Le quartier haut est en pente et le stationnement difficile au centre : prévoir l'accès.",
  },
  troyes: {
    quartiers: [
      ['Le bouchon de Champagne', "Le centre historique en forme de bouchon : maisons à pans de bois colorées, ruelles, appartements de caractère."],
      ['Le quartier de la gare', "Appartements pratiques pour la clientèle pro et les visiteurs des magasins d'usine."],
      ['Les environs', "Maisons avec jardin vers les lacs de la forêt d'Orient et la route du champagne."],
    ],
    photo: "À Troyes, les maisons à pans de bois colorées font la couverture. Pour un logement en dehors du centre, la distance aux lacs ou aux magasins d'usine se met en légende.",
    menage: "À Troyes, les voyageurs des magasins d'usine et des lacs font des séjours courts, surtout le week-end. Le bouchon de Champagne est en partie piéton.",
  },
  vannes: {
    quartiers: [
      ['La ville close', "Dans les remparts : maisons à pans de bois, ruelles pavées, appartements de caractère."],
      ['Le port', "Appartements près du port de plaisance et de la Rabine, ouverts sur le golfe."],
      ['Le golfe du Morbihan', "Arradon, Séné, la presqu'île de Rhuys : maisons avec vue sur le golfe et les îles."],
    ],
    photo: "À Vannes, les pans de bois de la ville close et le golfe font la couverture. Une maison du golfe se vend sur la vue sur l'eau et les îles.",
    menage: "À Vannes, l'été et les festivals autour du golfe concentrent les rotations. La ville close est piétonne : prévoir le portage du linge.",
  },
  versailles: {
    quartiers: [
      ['Notre-Dame', "Autour du marché Notre-Dame : immeubles anciens, appartements bourgeois, à pied du château."],
      ['Saint-Louis', "Le quartier de la cathédrale et du potager du Roi : hôtels particuliers et appartements de caractère."],
      ['Montreuil et les quartiers résidentiels', "Maisons et appartements plus récents, avec parking, à quelques minutes du château."],
    ],
    photo: "À Versailles, le cachet des immeubles anciens et la distance à pied jusqu'au château font l'annonce ; une vue sur les jardins ou le château, même lointaine, se met en couverture.",
    menage: "À Versailles, les visiteurs du château font des séjours courts toute l'année, avec une clientèle pro en semaine qui travaille à Paris. Le stationnement est difficile autour du château.",
  },
}
