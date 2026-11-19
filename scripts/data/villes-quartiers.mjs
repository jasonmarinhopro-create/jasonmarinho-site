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
}
