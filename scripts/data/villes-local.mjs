// Contenu local VÉRIFIÉ pour les pages ville ménage / photographe
// (menage-lcd-{slug}, photographe-lcd-{slug}), injecté par
// scripts/inject-local-villes.mjs. Relevé en septembre 2026 : la
// réglementation et la taxe de séjour changent souvent, revérifier (et
// mettre à jour `verifie`) avant toute modification. Pas de tiret cadratin.
//
// Pour ajouter une ville : copier un bloc, vérifier chaque fait par
// recherche web, citer les sources, puis `node scripts/inject-local-villes.mjs`.

const ENREGISTREMENT = {
  label: "Guide pratique 2025 de la réglementation des meublés de tourisme (ministère)",
  url: 'https://www.ecologie.gouv.fr/sites/default/files/documents/25113_GuidePratique2025MeubleTourisme.pdf',
}
const TARIFS = {
  label: 'Service-Public : tarifs de la taxe de séjour par commune',
  url: 'https://entreprendre.service-public.gouv.fr/vosdroits/R46583',
}
const REGLES = {
  label: 'economie.gouv.fr : règles de location d’une résidence principale en meublé de tourisme',
  url: 'https://www.economie.gouv.fr/particuliers/impots-et-fiscalite/gerer-mon-impot-sur-le-revenu/location-meublee-de-tourisme-quelles-sont-les-regles-respecter-pour-sa-residence',
}

// Faits communs à toutes les villes où aucune règle locale plus stricte n'a
// été confirmée : on n'affirme jamais 90 jours ni un taux précis sans source.
const REG_NUM = "<strong>Numéro d'enregistrement</strong> à afficher sur chaque annonce, via le téléservice national obligatoire au plus tard le 20 mai 2026."
const REG_USAGE_GEN = "<strong>Résidence secondaire ou logement dédié :</strong> demandez en mairie si une autorisation de changement d'usage est exigée. Depuis la loi Le Meur, toute commune peut instaurer ce régime."
const reg120 = v => `<strong>Résidence principale : 120 nuits par an maximum</strong> (plafond national). La loi Le Meur permet à la commune de l'abaisser à 90 nuits : vérifiez la délibération en vigueur à ${v}.`
const taxeGen = v => `Logement non classé : un taux voté localement, <strong>entre 1 % et 5 % du prix HT de la nuitée par personne</strong>, dans la limite d'un plafond, plus une éventuelle taxe additionnelle départementale. Le tarif exact appliqué à ${v} figure dans la base officielle des tarifs par commune.`
const faqTaxeGen = v => `Pour un meublé non classé, le taux est voté localement <strong>entre 1 % et 5 % du prix HT de la nuitée par personne</strong>, dans la limite d'un plafond, plus une éventuelle taxe additionnelle départementale. Airbnb la collecte en général pour vous ; en réservation directe, vous la collectez et la reversez à la collectivité de ${v}.`
const faqPlafondGen = (v, suite) => `Le plafond national est de <strong>120 nuits par an</strong> pour une résidence principale louée en meublé de tourisme, et la loi Le Meur permet à la commune de l'abaisser à 90 nuits par délibération : vérifiez la règle en vigueur à ${v} auprès de la mairie avant de louer. ${suite || "Pour un logement qui n'est pas votre résidence principale, renseignez-vous sur une éventuelle autorisation de changement d'usage."}`

function ville(o) {
  return {
    ville: o.ville,
    verifie: 'septembre 2026',
    reglementation: [o.plafond || reg120(o.ville), o.usage || REG_USAGE_GEN, REG_NUM],
    taxe: o.taxe || taxeGen(o.ville),
    pics: o.pics,
    menage: o.menage,
    photo: o.photo,
    faqPlafond: o.faqPlafond || faqPlafondGen(o.ville, o.faqSuite),
    faqTaxe: o.faqTaxe || faqTaxeGen(o.ville),
    sources: [...(o.sources && o.sources.length ? o.sources : [REGLES]), ENREGISTREMENT, TARIFS, ...(o.evSources || [])],
  }
}

export const VILLES_LOCAL = {
  paris: {
    ville: 'Paris',
    verifie: 'septembre 2026',
    reglementation: [
      "<strong>Résidence principale : 90 nuits par an maximum</strong> (plafond abaissé par la loi Le Meur de novembre 2024), après déclaration en ligne auprès de la Ville de Paris.",
      "<strong>Résidence secondaire ou logement dédié : autorisation de changement d'usage avec compensation obligatoire avant la première nuit.</strong> Sans elle, l'amende civile peut atteindre 100 000 € par logement.",
      "<strong>Numéro d'enregistrement</strong> à afficher sur chaque annonce, via le téléservice national obligatoire au plus tard le 20 mai 2026.",
    ],
    taxe: "Logement non classé : <strong>5 % du prix HT de la nuitée par personne</strong>, dans la limite d'un plafond. À Paris s'ajoutent une taxe additionnelle départementale et, depuis 2025, une <strong>taxe additionnelle de 200 % au profit d'Île-de-France Mobilités</strong> : la note grimpe vite pour un logement non classé.",
    pics: [
      "Salon de l'Agriculture : du 21 février au 1er mars 2026 (Paris Expo Porte de Versailles)",
      "Fashion Week femme : du 2 au 10 mars, puis du 28 septembre au 6 octobre 2026",
      "Roland-Garros : du 24 mai au 7 juin 2026",
    ],
    menage: [
      "<strong>Moins de rotations, plus concentrées :</strong> avec 90 nuits par an sur les résidences principales, beaucoup d'hôtes louent surtout pendant les pics. Réservez votre équipe plusieurs semaines avant les grandes dates.",
      "<strong>Logistique parisienne :</strong> stationnement rare et cher, immeubles anciens souvent sans ascenseur. Une équipe qui se déplace en transports et travaille avec une blanchisserie qui collecte et livre le linge gagne un temps précieux.",
      "<strong>Clients récurrents côté pros :</strong> les logements dédiés à la location avec changement d'usage (et les conciergeries qui les gèrent) tournent toute l'année. Ce sont les contrats les plus réguliers.",
    ],
    photo: [
      "<strong>La lumière est le vrai défi :</strong> étages bas, cours intérieures, rues étroites. Shootez au moment où la pièce principale reçoit le plus de jour, et gardez un éclairage chaud pour les pièces aveugles.",
      "<strong>Ce qui fait cliquer :</strong> une vue sur les toits ou un monument, un balcon, les moulures et le parquet d'un immeuble ancien. Si vous l'avez, c'est la photo de couverture.",
      "<strong>Timing :</strong> faites les photos avant les pics (printemps, Roland-Garros, Fashion Week) pour que l'annonce soit prête quand la demande monte.",
    ],
    faqPlafond: "À Paris, une résidence principale peut être louée en meublé de tourisme <strong>90 nuits par an maximum</strong>, après déclaration auprès de la Ville. Au-delà, ou pour un logement qui n'est pas votre résidence principale, il faut une autorisation de changement d'usage avec compensation, sous peine d'une amende civile pouvant atteindre 100 000 €.",
    faqTaxe: "Pour un meublé non classé, la taxe de séjour est de <strong>5 % du prix HT de la nuitée par personne</strong>, dans la limite d'un plafond, auxquels s'ajoutent à Paris une taxe additionnelle départementale et une taxe additionnelle de 200 % au profit d'Île-de-France Mobilités depuis 2025. Airbnb la collecte en général pour vous ; en réservation directe, c'est à vous de la collecter et de la reverser.",
    sources: [
      { label: 'Chambre des notaires de Paris : location meublée touristique', url: 'https://paris.notaires.fr/fr/actualites/location-meublee-touristique-de-nouvelles-regles-administratives-et-fiscales-apprehender' },
      { label: 'Service-Public : évolution en 2026 de la taxe de séjour à Paris', url: 'https://entreprendre.service-public.gouv.fr/actualites/A17929' },
      ENREGISTREMENT,
      { label: 'Paris je t’aime : grands événements', url: 'https://parisjetaime.com/eng/convention/article/top-events-paris-a1210' },
    ],
  },

  lyon: {
    ville: 'Lyon',
    verifie: 'septembre 2026',
    reglementation: [
      "<strong>Résidence principale : 90 jours par an maximum depuis 2026</strong> (la Ville de Lyon a abaissé le plafond de 120 à 90 jours en juin 2025), après déclaration en ligne.",
      "<strong>Logement qui n'est pas votre résidence principale : autorisation de changement d'usage préalable.</strong> Le numéro d'enregistrement ne vaut pas autorisation.",
      "<strong>Numéro d'enregistrement</strong> à afficher sur chaque annonce, via le téléservice national obligatoire au plus tard le 20 mai 2026.",
    ],
    taxe: "Logement non classé : <strong>5 % du prix HT de la nuitée par personne</strong>, dans la limite d'un plafond fixé par la Métropole de Lyon, à déclarer <strong>chaque trimestre</strong> sur le portail de la Métropole (au plus tard le 20 du mois qui suit le trimestre) quand vous la collectez vous-même.",
    pics: [
      "Fête des Lumières : du 5 au 8 décembre 2026, le pic de l'année",
      "Salons et congrès à Eurexpo et à la Cité Internationale, plus un fort tourisme d'affaires en semaine",
    ],
    menage: [
      "<strong>La Fête des Lumières se prépare tôt :</strong> quatre soirs, des check-in et check-out enchaînés, et toutes les équipes sollicitées en même temps. Bloquez vos créneaux dès l'automne.",
      "<strong>Rythme affaires :</strong> le tourisme d'affaires crée des séjours courts en semaine, donc des turnovers en milieu de semaine, pas seulement le dimanche.",
      "<strong>Avec 90 jours par an sur les résidences principales,</strong> la demande régulière vient surtout des logements dédiés à la location et des conciergeries qui les gèrent.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> une vue sur Fourvière, la Saône ou le Rhône, les pierres et plafonds à la française du Vieux-Lyon et des pentes de la Croix-Rousse.",
      "<strong>Pensez aux voyageurs d'affaires :</strong> montrez clairement le bureau, le wifi, la proximité des transports. C'est ce qu'ils cherchent en premier.",
      "<strong>Timing :</strong> mettez vos photos à jour avant l'automne pour que l'annonce soit prête pour la Fête des Lumières.",
    ],
    faqPlafond: "Depuis 2026, une résidence principale à Lyon peut être louée en meublé de tourisme <strong>90 jours par an maximum</strong> (contre 120 auparavant), après déclaration en ligne. Pour un logement qui n'est pas votre résidence principale, une autorisation de changement d'usage est nécessaire avant de louer.",
    faqTaxe: "Pour un meublé non classé, la taxe de séjour est de <strong>5 % du prix HT de la nuitée par personne</strong>, dans la limite d'un plafond fixé par la Métropole de Lyon. Airbnb la collecte en général pour vous ; en réservation directe, vous la collectez et la déclarez chaque trimestre sur le portail de la Métropole.",
    sources: [
      { label: 'Ville de Lyon : déclarer un meublé de tourisme', url: 'https://www.lyon.fr/demarche/logement-habitat/declarer-un-meuble-de-tourisme' },
      { label: 'Métropole de Lyon : portail de la taxe de séjour', url: 'https://taxe-sejour.grandlyon.com/' },
      ENREGISTREMENT,
      { label: 'Ville de Lyon : dates de la Fête des Lumières 2026', url: 'https://www.fetedeslumieres.lyon.fr/en/page/dates-and-opening-hours' },
    ],
  },

  bordeaux: {
    ville: 'Bordeaux',
    verifie: 'septembre 2026',
    reglementation: [
      "<strong>Résidence principale : 90 jours par an maximum depuis le 1er janvier 2026</strong> dans la commune de Bordeaux, en dessous du plafond national de 120 jours.",
      "<strong>Résidence secondaire ou logement dédié : autorisation de changement d'usage avec compensation</strong> (création d'un logement équivalent remis sur le marché).",
      "<strong>Numéro d'enregistrement</strong> à afficher sur chaque annonce, via le téléservice national obligatoire au plus tard le 20 mai 2026.",
    ],
    taxe: "Logement non classé : <strong>5 % du prix HT de la nuitée par personne</strong>, dans la limite d'un plafond fixé par Bordeaux Métropole, à déclarer sur le portail de la taxe de séjour de la Métropole quand vous la collectez vous-même.",
    pics: [
      "Week-end des Grands Crus et 10 ans de la Cité du Vin : début juin 2026",
      "Saison des vendanges en septembre et octobre, avec les visites de châteaux",
      "Bordeaux Fête le Vin fait une pause en 2026 et revient du 7 au 11 juillet 2027",
    ],
    menage: [
      "<strong>Une saison qui s'étire :</strong> printemps, été puis vendanges. Les équipes les plus demandées sont réservées dès mai : anticipez.",
      "<strong>Logements en pierre du XVIIIe :</strong> sols anciens, escaliers, parfois pas d'ascenseur. Prévoyez le temps et le matériel adaptés dans le devis.",
      "<strong>Avec 90 jours par an sur les résidences principales</strong> et la compensation exigée pour les autres, la demande régulière vient surtout des logements autorisés et des conciergeries.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> la pierre blonde des façades, les balcons en fer forgé, les parquets anciens, une vue sur les quais ou la Garonne.",
      "<strong>L'univers du vin :</strong> une photo d'ambiance (table dressée, verres, carte des vignobles proches) parle directement aux voyageurs qui viennent pour l'œnotourisme.",
      "<strong>Timing :</strong> faites les photos au printemps, avant la saison, avec la lumière chaude de fin de journée sur la pierre.",
    ],
    faqPlafond: "Depuis le 1er janvier 2026, une résidence principale à Bordeaux peut être louée en meublé de tourisme <strong>90 jours par an maximum</strong>. Pour une résidence secondaire ou un logement dédié, il faut une autorisation de changement d'usage avec compensation.",
    faqTaxe: "Pour un meublé non classé, la taxe de séjour est de <strong>5 % du prix HT de la nuitée par personne</strong>, dans la limite d'un plafond fixé par Bordeaux Métropole. Airbnb la collecte en général pour vous ; en réservation directe, vous la collectez et la déclarez sur le portail de la Métropole.",
    sources: [
      { label: 'Ville de Bordeaux : location touristique, le guide des propriétaires', url: 'https://www.bordeaux.fr/location-touristique-bordeaux--guide-proprietaires' },
      { label: 'Bordeaux Métropole : portail de la taxe de séjour', url: 'https://taxedesejour.bordeaux-metropole.fr/' },
      ENREGISTREMENT,
      { label: 'Bordeaux Fête le Vin : programme et prochaine édition', url: 'https://blog.ruedesvignerons.com/guide-des-destinations/bordeaux-fete-le-vin/' },
    ],
  },

  annecy: ville({
    ville: 'Annecy',
    usage: "<strong>Autre logement : changement d'usage avec compensation</strong> dans le Grand Annecy (création d'un logement équivalent dans le même secteur). La résidence principale louée dans la limite du plafond en est dispensée.",
    faqSuite: "Pour un autre logement, le Grand Annecy exige une autorisation de changement d'usage avec compensation, ce qui rend l'opération très coûteuse pour un particulier.",
    pics: [
      "Festival international du film d'animation, chaque année en juin",
      "Fête du Lac, début août : la soirée la plus demandée de l'été",
      "Hiver : voyageurs en route vers les stations des Aravis",
    ],
    menage: [
      "<strong>Un été très concentré :</strong> juillet et août autour du lac, avec des changements de voyageurs le samedi. Une équipe capable d'enchaîner plusieurs logements le même jour est précieuse.",
      "<strong>Deux jeux de linge par lit :</strong> en août, les blanchisseries du bassin sont très sollicitées. Un stock d'avance évite les retards entre deux séjours.",
      "<strong>Vieille ville :</strong> rues piétonnes et parkings payants le long du Thiou. Intégrez le temps d'accès dans le tarif.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> une vue sur le lac ou sur les montagnes (Tournette, Semnoz), un balcon, une terrasse. Si vous l'avez, c'est la photo de couverture.",
      "<strong>Le lac au petit matin :</strong> eau calme et lumière douce. Programmez la séance tôt pour les vues extérieures.",
      "<strong>Deux saisons :</strong> une photo d'été (baignade, vélo autour du lac) et une d'hiver (cheminée, proximité des pistes) pour vendre toute l'année.",
    ],
    sources: [
      { label: "Ville d'Annecy : déclaration des meublés de tourisme", url: 'https://www.annecy.fr/annuaires/catalogue-des-demarches/detail/declaration-prealable-dhebergement-meubles-de-tourisme' },
    ],
  }),

  nice: ville({
    ville: 'Nice',
    plafond: "<strong>Résidence principale : 90 nuits par an maximum depuis le 1er janvier 2026</strong> (délibération du conseil municipal du 23 mai 2025).",
    usage: "<strong>Résidence secondaire ou logement dédié : changement d'usage avec compensation obligatoire</strong> (règle du « un pour un » : un local transformé en logement pour chaque logement loué aux touristes).",
    faqPlafond: "Depuis le 1er janvier 2026, une résidence principale à Nice peut être louée en meublé de tourisme <strong>90 nuits par an maximum</strong>. Pour une résidence secondaire, il faut une autorisation de changement d'usage avec compensation obligatoire.",
    pics: [
      "Carnaval de Nice, chaque année en février",
      "Été : saison balnéaire de juin à septembre",
      "Congrès et salons au palais Acropolis toute l'année",
    ],
    menage: [
      "<strong>Clients réguliers :</strong> avec 90 nuits pour les résidences principales, la demande stable vient des logements autorisés avec compensation, souvent gérés par des conciergeries. Ce sont les contrats à viser.",
      "<strong>Sable et sel :</strong> serviettes de plage, sable dans les douches, sel sur les baies vitrées. Prévoyez vitres et terrasse à chaque passage en été.",
      "<strong>Vieux-Nice :</strong> ruelles piétonnes, immeubles sans ascenseur. Une équipe à pied avec chariot et un point de dépôt du linge gagne du temps.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> la mer depuis le balcon, la Promenade des Anglais, les façades ocre et les volets du Vieux-Nice.",
      "<strong>Lumière de la Côte :</strong> évitez midi en plein été, trop dur. La fin d'après-midi réchauffe les façades et la mer.",
      "<strong>Montrez la clim et l'extérieur :</strong> en été, c'est ce que les voyageurs filtrent en premier. Une photo claire répond à la question avant qu'on la pose.",
    ],
    sources: [
      { label: "Métropole Nice Côte d'Azur : logements en meublés touristiques", url: 'https://www.nicecotedazur.org/services/logement/autorisations-de-changements-dusage/logements-en-meubles-touristiques/' },
    ],
  }),

  strasbourg: ville({
    ville: 'Strasbourg',
    plafond: "<strong>Résidence principale : 120 nuits par an maximum</strong> (plafond national, que Strasbourg n'avait pas abaissé à 90 à notre dernière vérification : surveillez les annonces de la Ville).",
    usage: "<strong>Autre logement : autorisation de changement d'usage</strong> à demander à la Ville avant de louer.",
    pics: [
      "Marché de Noël, de fin novembre à fin décembre : le pic de l'année",
      "Sessions plénières du Parlement européen, environ une semaine par mois",
      "Été : visiteurs de la Petite France et de la Route des vins",
    ],
    menage: [
      "<strong>Décembre, le mois critique :</strong> le marché de Noël remplit la ville pendant des semaines. Réservez votre équipe dès septembre.",
      "<strong>Semaines de session :</strong> les pros du Parlement arrivent le lundi et repartent le jeudi. Prévoyez des turnovers en milieu de semaine.",
      "<strong>Grande-Île piétonne :</strong> le centre est largement fermé aux voitures. Prévoyez accès et stationnement dans le devis.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> les colombages de la Petite France, une vue sur la cathédrale, les poutres apparentes.",
      "<strong>Une photo d'hiver :</strong> une ambiance chaleureuse (lumières chaudes, plaid) aide à vendre décembre, le mois le plus cher.",
      "<strong>Voyageurs d'affaires :</strong> bureau, wifi et temps d'accès au tram et au quartier européen dans la légende.",
    ],
    sources: [
      { label: 'Strasbourg.eu : changement d’usage et meublé de tourisme', url: 'https://www.strasbourg.eu/activite-pro-ou-meuble-de-tourisme' },
      { label: 'Ville et Eurométropole de Strasbourg : taxe de séjour', url: 'https://taxedesejourems.strasbourg.eu/' },
    ],
  }),

  biarritz: ville({
    ville: 'Biarritz',
    usage: "<strong>Autre logement : changement d'usage avec compensation</strong>, comme dans les 24 communes en zone tendue de la Communauté Pays Basque (création d'un logement au moins équivalent). La résidence principale louée dans la limite du plafond en est dispensée.",
    faqSuite: "Pour un autre logement, la Communauté Pays Basque impose le principe de compensation : il faut remettre sur le marché un logement au moins équivalent.",
    pics: [
      "Été : plages et surf de juillet à fin août",
      "Printemps et automne : saison du surf et des séminaires",
      "Fêtes de Bayonne toutes proches, fin juillet",
    ],
    menage: [
      "<strong>Du sable partout :</strong> planches, combinaisons, serviettes. Un aspirateur puissant et un passage sur la douche extérieure à chaque rotation.",
      "<strong>Humidité océanique :</strong> aérez, contrôlez joints et moisissures des salles de bain à chaque passage en saison.",
      "<strong>Samedis d'août :</strong> les départs et arrivées sur la côte basque rallongent les trajets. Planifiez des créneaux larges entre deux logements.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> une vue sur l'océan, la Grande Plage, le phare ou le Rocher de la Vierge.",
      "<strong>Ciel changeant :</strong> la lumière atlantique varie vite. Gardez une séance souple et shootez dès qu'une éclaircie arrive.",
      "<strong>Le surf comme argument :</strong> rack à planches, douche extérieure, local : montrez-les, les surfeurs filtrent là-dessus.",
    ],
    sources: [
      { label: 'Communauté Pays Basque : louer un meublé de tourisme', url: 'https://www.communaute-paysbasque.fr/logement-et-urbanisme/la-location-dun-meuble-de-tourisme-au-pays-basque' },
      { label: 'Ville de Biarritz : règlement des locations saisonnières', url: 'https://www.biarritz.fr/mes-demarches-desmartxak/location-touristique/reglement-des-locations-saisonnieres' },
    ],
  }),

  'la-rochelle': ville({
    ville: 'La Rochelle',
    usage: "<strong>Autre logement : changement d'usage encadré par l'Agglo.</strong> Compensation obligatoire aux Minimes, en centre-ville et au Gabut, et 3 autorisations temporaires au maximum par propriétaire dans les communes en zone tendue.",
    faqSuite: "Pour un autre logement, l'Agglo exige une autorisation de changement d'usage, avec compensation obligatoire aux Minimes, en centre-ville et au Gabut.",
    pics: [
      "Francofolies, chaque année en juillet",
      "Grand Pavois, salon nautique à flot, en fin d'été",
      "Été : l'île de Ré et les plages à proximité",
    ],
    menage: [
      "<strong>Francofolies et été :</strong> plusieurs soirs d'affilée complets, avec des départs tôt. Calez vos créneaux de juillet dès le printemps.",
      "<strong>Vent et air marin :</strong> sel sur les vitres, sable rapporté de Ré. Vitres et sols dans chaque prestation d'été.",
      "<strong>Vieux-Port et centre :</strong> rues à arcades et stationnement limité. Intégrez la logistique dans le devis.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> les tours du Vieux-Port, les arcades, la pierre claire, une vue sur les bateaux.",
      "<strong>Fin de journée :</strong> la lumière atlantique dore la pierre de la ville. C'est le bon créneau.",
      "<strong>Montrez les vélos :</strong> La Rochelle se visite à vélo. Un local ou des vélos fournis méritent une photo.",
    ],
    sources: [
      { label: 'Agglo La Rochelle : meublés de tourisme', url: 'https://www.agglo-larochelle.fr/meubles-de-tourisme' },
    ],
  }),

  marseille: ville({
    ville: 'Marseille',
    plafond: "<strong>Résidence principale : 90 nuits par an maximum depuis le 1er janvier 2026</strong> (contre 120 auparavant). Dépassement : amende civile jusqu'à 15 000 €.",
    usage: "<strong>Autre logement : changement d'usage avec compensation obligatoire</strong>, selon le cadre local. Peu de demandes sont accordées.",
    faqPlafond: "Depuis le 1er janvier 2026, une résidence principale à Marseille peut être louée en meublé de tourisme <strong>90 nuits par an maximum</strong>, sous peine d'une amende civile pouvant atteindre 15 000 €. Pour un autre logement, il faut une autorisation de changement d'usage avec compensation.",
    pics: [
      "Été : saison balnéaire et calanques",
      "Escales de croisière au printemps et en été",
      "Concerts et matchs au stade Vélodrome",
    ],
    menage: [
      "<strong>Clients réguliers :</strong> avec 90 jours et la compensation, les contrats stables viennent des logements autorisés et des conciergeries qui les gèrent.",
      "<strong>Chaleur :</strong> en été, passez tôt, vérifiez la clim et les moustiquaires, fermez les volets au départ.",
      "<strong>Circulation :</strong> les trajets entre quartiers sont longs. Regroupez vos logements par secteur (Vieux-Port, Endoume, Joliette).",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> une vue sur le Vieux-Port, Notre-Dame de la Garde ou la mer, une terrasse sur les toits.",
      "<strong>Lumière méditerranéenne :</strong> intense à midi. Visez le matin ou la fin d'après-midi pour éviter les contrastes.",
      "<strong>Nommez le quartier :</strong> les voyageurs cherchent un secteur (Panier, Vallon des Auffes, Cours Julien). Montrez-le en photo et en légende.",
    ],
    sources: [
      { label: 'Ville de Marseille : changements d’usage', url: 'https://www.marseille.fr/logement-urbanisme/logement/changements-d-usage' },
      { label: 'France Bleu : Marseille limite à 90 jours', url: 'https://www.francebleu.fr/infos/economie-social/airbnb-90-jours-de-location-de-residence-principale-marseille-serre-la-vis-sur-les-meubles-touristiques-9173181' },
    ],
  }),

  toulouse: ville({
    ville: 'Toulouse',
    usage: "<strong>Autre logement : changement d'usage avec compensation</strong>, sauf dérogation : un particulier peut obtenir jusqu'à 2 autorisations sans compensation sur la commune.",
    faqSuite: "Pour un autre logement, il faut une autorisation de changement d'usage, avec compensation au-delà de 2 autorisations par particulier.",
    pics: [
      "Tourisme d'affaires toute l'année (aéronautique, spatial)",
      "Matchs du Stade Toulousain",
      "Congrès et salons au MEETT, le parc des expositions",
    ],
    menage: [
      "<strong>Rythme affaires :</strong> arrivées le lundi, départs le jeudi ou le vendredi. Les turnovers tombent en semaine plus que le week-end.",
      "<strong>Missions longues :</strong> les pros de l'aéronautique restent souvent plusieurs semaines. Proposez un ménage hebdomadaire en cours de séjour.",
      "<strong>Étés chauds :</strong> vérifiez clim et ventilateurs, aérez tôt le matin.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> la brique rose, une vue sur la Garonne, le Capitole ou les toits.",
      "<strong>Voyageurs pros :</strong> un bureau bien éclairé, le wifi, le temps d'accès au métro et à la zone aéroportuaire.",
      "<strong>Fin de journée :</strong> la brique prend une teinte orangée magnifique. Shootez les extérieurs à ce moment-là.",
    ],
    sources: [
      { label: 'Toulouse Métropole : louer en meublé de tourisme', url: 'https://metropole.toulouse.fr/demarches/louer-un-local-meuble-pour-du-tourisme-ou-de-courtes-durees' },
    ],
  }),

  montpellier: ville({
    ville: 'Montpellier',
    plafond: "<strong>Résidence principale : 90 nuits par an maximum depuis le 1er janvier 2026</strong> (délibération du conseil municipal d'octobre 2025).",
    usage: "<strong>Autre logement : changement d'usage limité à 4 ans</strong>, sans renouvellement automatique, et quota de 770 meublés dans l'Écusson, déjà atteint.",
    faqPlafond: "Depuis le 1er janvier 2026, une résidence principale à Montpellier peut être louée en meublé de tourisme <strong>90 nuits par an maximum</strong>. Pour un autre logement, il faut une autorisation de changement d'usage, et le quota de l'Écusson est atteint.",
    pics: [
      "Été : plages de Palavas et Carnon à une vingtaine de minutes",
      "Festival Montpellier Danse, en juin et juillet",
      "Rentrée universitaire en septembre : étudiants et parents",
    ],
    menage: [
      "<strong>Écusson sous quota :</strong> aucune nouvelle autorisation tant que le plafond est atteint. Les logements déjà autorisés sont les clients à fidéliser.",
      "<strong>Retour de plage :</strong> en été, beaucoup de voyageurs font l'aller-retour vers la mer. Sols et douches demandent plus de temps.",
      "<strong>Chaleur :</strong> passages tôt le matin, contrôle de la clim, volets fermés au départ pour garder le logement frais.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> les ruelles de l'Écusson, la place de la Comédie, une terrasse, une piscine en résidence.",
      "<strong>La mer en légende :</strong> dites combien de minutes jusqu'à la plage et comment y aller (tram, parking).",
      "<strong>Lumière :</strong> très forte à midi en été. Shootez le matin pour des blancs propres.",
    ],
    sources: [
      { label: 'Montpellier : changement d’usage des locaux d’habitation', url: 'https://www.montpellier.fr/en/daily-life/living-here/housing/change-dusage-of-dwelling-spaces' },
      { label: 'Plan Immobilier : la réglementation à Montpellier', url: 'https://www.plan-immobilier.fr/actualites-immobilieres/locations-touristiques-la-reglementation-a-montpellier' },
    ],
  }),

  nantes: ville({
    ville: 'Nantes',
    plafond: "<strong>Résidence principale : 120 nuits par an maximum</strong> : Nantes a choisi de ne pas abaisser le plafond à 90 à ce jour.",
    usage: "<strong>Résidence secondaire : autorisation de changement d'usage préalable</strong> auprès de Nantes Métropole.",
    faqPlafond: "À Nantes, une résidence principale peut être louée en meublé de tourisme <strong>120 nuits par an maximum</strong> : la Ville n'a pas abaissé ce plafond à 90 à ce jour. Pour une résidence secondaire, une autorisation de changement d'usage est nécessaire avant de louer.",
    pics: [
      "Le Voyage à Nantes, parcours d'art de juillet à fin août",
      "La Folle Journée, festival de musique classique fin janvier ou début février",
      "Congrès et salons toute l'année",
    ],
    menage: [
      "<strong>L'été du Voyage à Nantes :</strong> touristes à la semaine, changements le week-end. Réservez vos créneaux dès mai.",
      "<strong>Hiver affaires :</strong> hors saison, surtout des séjours pros en semaine. Proposez des créneaux en milieu de semaine.",
      "<strong>Tram et vélo :</strong> entre le centre et l'île de Nantes, ils vont souvent plus vite que la voiture d'un logement à l'autre.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> une vue sur la Loire, le château des ducs de Bretagne, le quartier Graslin, le tuffeau.",
      "<strong>Légende :</strong> citez la ligne verte du Voyage à Nantes ou les Machines de l'île si elles sont proches. C'est ce que cherchent les touristes.",
      "<strong>Ciel nantais :</strong> lumière souvent douce et grise. Allumez les lampes chaudes et exposez bien l'intérieur.",
    ],
    sources: [
      { label: 'Nantes Métropole : changement d’usage d’un logement', url: 'https://metropole.nantes.fr/mes-services-mon-quotidien/connaitre-les-demarches-relatives-au-changement-d-usage-d-un-logement' },
      { label: 'Nantes Métropole : enregistrer un meublé de tourisme', url: 'https://metropole.nantes.fr/mes-services-mon-quotidien/enregistrer-un-meuble-de-tourisme-ou-une-chambre-d-hote' },
    ],
  }),

  lille: ville({
    ville: 'Lille',
    plafond: "<strong>Résidence principale : 120 nuits par an maximum</strong> (plafond national, que Lille n'avait pas abaissé à 90 à notre dernière vérification).",
    usage: "<strong>Autre logement :</strong> une autorisation de changement d'usage peut être exigée. Les règles sont précisées par la Métropole européenne de Lille.",
    pics: [
      "Braderie de Lille, le premier week-end de septembre : le pic de l'année",
      "Marché de Noël, de fin novembre à fin décembre",
      "Voyageurs d'affaires venus de Paris, Londres et Bruxelles, salons à Lille Grand Palais",
    ],
    menage: [
      "<strong>La Braderie :</strong> tout se loue le même week-end, avec des départs le dimanche soir et le lundi. Bloquez vos équipes des mois à l'avance.",
      "<strong>Séjours éclairs :</strong> une ou deux nuits en semaine près des gares. Prévoyez des passages rapides et bien rodés.",
      "<strong>Vieux-Lille :</strong> pavés, rues étroites, stationnement cher. Organisez les passages à pied ou à vélo cargo.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> les briques et façades flamandes du Vieux-Lille, la Grand-Place, les poutres et cheminées.",
      "<strong>Lumière du Nord :</strong> ciel souvent couvert. Choisissez les heures les plus claires et gardez un éclairage chaud.",
      "<strong>Les gares en légende :</strong> indiquez le temps à pied jusqu'à Lille-Flandres ou Lille-Europe, argument clé pour les pros.",
    ],
    sources: [
      { label: 'Métropole européenne de Lille : meublés de tourisme', url: 'https://www.lillemetropole.fr/meubles-de-tourisme' },
    ],
  }),

  'aix-en-provence': ville({
    ville: 'Aix-en-Provence',
    usage: "<strong>Autre logement : autorisation de changement d'usage à obtenir avant de louer</strong>, puis déclaration du meublé.",
    faqSuite: "Pour un autre logement, Aix-en-Provence exige d'abord une autorisation de changement d'usage.",
    pics: [
      "Festival d'Aix (art lyrique), chaque année en juillet",
      "Printemps et été : Sainte-Victoire, marchés et villages de Provence",
      "Rentrée universitaire et tourisme d'affaires",
    ],
    menage: [
      "<strong>Juillet du festival :</strong> spectateurs sur plusieurs nuits, clientèle exigeante. Soignez le linge et la présentation.",
      "<strong>Mas et villas autour d'Aix :</strong> ajoutez l'entretien de la piscine et des extérieurs à votre offre.",
      "<strong>Centre ancien :</strong> ruelles piétonnes et stationnement limité. Comptez le temps d'accès.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> hôtels particuliers, fontaines, tomettes, une vue sur la Sainte-Victoire.",
      "<strong>L'extérieur d'abord :</strong> terrasse sous les platanes, piscine. En Provence, c'est souvent la photo de couverture.",
      "<strong>Lumière :</strong> la fin de journée sur la pierre dorée, et l'ombre des volets à l'intérieur pour l'ambiance.",
    ],
    sources: [
      { label: 'Paul Duvaux : changement d’usage, les règles ville par ville', url: 'https://www.paulduvaux.com/documentations/location-meublee-et-parahotellerie/item/611-changement-d-usage-et-numero-d-enregistrement-des-meubles-de-tourisme' },
      { label: "Aix-en-Provence : portail de la taxe de séjour", url: 'https://aixenprovence.taxesejour.fr/portail/homepage-declaloc' },
    ],
  }),

  cannes: ville({
    ville: 'Cannes',
    pics: [
      "Festival de Cannes, chaque année en mai",
      "Salons au Palais des Festivals : MIPIM en mars, Cannes Lions en juin, MIPCOM en octobre",
      "Été balnéaire",
    ],
    menage: [
      "<strong>Salons = séjours pros :</strong> quelques nuits, loués cher, avec un niveau de propreté attendu maximal.",
      "<strong>Rotations serrées :</strong> entre deux événements, un logement peut changer de voyageurs en quelques heures. Il faut une équipe disponible le jour même.",
      "<strong>Linge hôtelier :</strong> pour ces clientèles, linge de qualité et présentation soignée font la différence.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> la mer, la Croisette, le Suquet, une terrasse ou un toit-terrasse.",
      "<strong>Clientèle pro :</strong> montrez un espace de travail et la distance à pied jusqu'au Palais des Festivals.",
      "<strong>Timing :</strong> photos à jour avant mars, pour être prêt pour la saison des salons.",
    ],
  }),

  avignon: ville({
    ville: 'Avignon',
    pics: [
      "Festival d'Avignon (IN et OFF), chaque année en juillet : du 4 au 25 juillet en 2026",
      "Printemps : Palais des Papes, pont d'Avignon, Luberon",
      "Automne : vendanges des Côtes du Rhône",
    ],
    menage: [
      "<strong>Un mois décisif :</strong> juillet pèse lourd dans l'année, avec des troupes qui restent trois semaines. Proposez un ménage hebdomadaire en cours de séjour.",
      "<strong>Chaleur de juillet :</strong> ventilateurs, clim et linge léger à vérifier à chaque passage.",
      "<strong>Intra-muros :</strong> circulation difficile pendant le festival. Organisez-vous à pied.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> les remparts, le Palais des Papes, une cour intérieure, une terrasse ombragée.",
      "<strong>Pour les compagnies :</strong> montrez le nombre de couchages et un grand espace commun pour répéter ou se retrouver.",
      "<strong>Timing :</strong> photos prêtes dès l'hiver, les compagnies réservent tôt pour juillet.",
    ],
    evSources: [
      { label: "Festival d'Avignon : édition 2026", url: 'https://festival-avignon.com/fr/edition-2026/programmation/par-date' },
    ],
  }),

  chamonix: ville({
    ville: 'Chamonix',
    usage: "<strong>Autre logement : autorisation de changement d'usage obligatoire</strong> dans la vallée (Chamonix, Les Houches, Servoz, Vallorcine), limitée à 1 par personne à Chamonix.",
    faqSuite: "Pour un autre logement, la vallée de Chamonix exige une autorisation de changement d'usage, limitée à une par personne à Chamonix.",
    pics: [
      "Hiver : ski de décembre à avril",
      "Été : alpinisme et randonnée",
      "UTMB, fin août : le pic de l'été",
    ],
    menage: [
      "<strong>Deux saisons pleines :</strong> hiver et été, avec des intersaisons creuses. Recrutez avant décembre et avant juin.",
      "<strong>Neige et boue :</strong> chaussures de ski, vêtements mouillés. Entrées, sols et séchoirs à traiter à chaque passage.",
      "<strong>Semaine de l'UTMB :</strong> coureurs et accompagnants remplissent la vallée fin août. Bloquez vos créneaux dès le printemps.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> la vue sur le Mont-Blanc ou l'Aiguille du Midi, le bois, la cheminée, un balcon.",
      "<strong>Deux jeux de photos :</strong> hiver sous la neige, été au vert. Changez la photo de couverture selon la saison.",
      "<strong>Le local à skis :</strong> casier, sèche-chaussures, distance aux remontées. Montrez-le, c'est un critère de choix.",
    ],
    sources: [
      { label: 'Ville de Chamonix : meublés de tourisme et PLU', url: 'https://www.chamonix.fr/demarches/logement-jhabitat-cham/meubles-de-tourisme-2/' },
    ],
  }),

  'saint-malo': ville({
    ville: 'Saint-Malo',
    usage: "<strong>Autre logement : changement d'usage soumis à des quotas par secteur</strong>, avec une seule autorisation par propriétaire. Le quota de l'intra-muros a été atteint dès son ouverture.",
    faqSuite: "Pour un autre logement, Saint-Malo applique des quotas d'autorisations de changement d'usage par secteur, avec une autorisation par propriétaire.",
    pics: [
      "Route du Rhum : village ouvert dès le 20 octobre, départ le 1er novembre 2026",
      "Étonnants Voyageurs, festival du livre, au week-end de la Pentecôte",
      "La Route du Rock en août, et tout l'été sur la Côte d'Émeraude",
    ],
    menage: [
      "<strong>La Route du Rhum :</strong> deux semaines complètes en plein automne. Prévoyez vos équipes comme en été.",
      "<strong>Plages en pleine ville :</strong> sable rapporté dans les logements. Sols et douches à soigner à chaque passage.",
      "<strong>Ville close :</strong> accès en voiture limité intra-muros. Anticipez stationnement et transport du linge.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> les remparts, le granit, une vue sur le Grand Bé ou la plage du Sillon.",
      "<strong>Les marées :</strong> la vue change du tout au tout entre haute et basse mer. Shootez à marée haute pour les vues mer.",
      "<strong>Timing :</strong> annonce prête avant l'automne pour capter la demande de la Route du Rhum.",
    ],
    sources: [
      { label: 'Ville de Saint-Malo : meublés de tourisme', url: 'https://www.saint-malo.fr/accueil/vivre/meubles-de-tourisme/' },
    ],
    evSources: [
      { label: 'Ville de Saint-Malo : dates officielles de la Route du Rhum 2026', url: 'https://www.saint-malo.fr/actualites/route-du-rhum-destination-guadeloupe-2026-les-dates-officielles-annoncees/' },
    ],
  }),

  rennes: ville({
    ville: 'Rennes',
    usage: "<strong>Résidence secondaire : autorisation de changement d'usage</strong> à demander à la Ville de Rennes avant de louer.",
    faqSuite: "Pour une résidence secondaire, une autorisation de changement d'usage est nécessaire à Rennes.",
    pics: [
      "Trans Musicales, début décembre",
      "Rentrée universitaire en septembre",
      "Étape vers Saint-Malo et le Mont-Saint-Michel, tourisme d'affaires toute l'année",
    ],
    menage: [
      "<strong>Rythme étudiant et pro :</strong> séjours courts en semaine, parents à la rentrée. Des turnovers réguliers toute l'année.",
      "<strong>Trans Musicales :</strong> quelques soirs très demandés, départs tardifs. Prévoyez des créneaux l'après-midi.",
      "<strong>Pans de bois :</strong> escaliers étroits dans le centre ancien. Matériel léger et adapté.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> les maisons à pans de bois, la place des Lices, le parc du Thabor.",
      "<strong>Accès :</strong> Paris est à environ 1 h 30 en TGV. Mentionnez la gare et le métro dans la légende.",
      "<strong>Lumière bretonne :</strong> ciel variable. Éclairez bien l'intérieur et profitez des éclaircies pour l'extérieur.",
    ],
    sources: [
      { label: 'Rennes Métropole : taxe de séjour et déclaration des meublés', url: 'https://economie.metropole.rennes.fr/collecter-la-taxe-de-sejour-et-declarer-un-meuble-de-tourisme-ou-une-chambre-dhotes/' },
    ],
  }),

  colmar: ville({
    ville: 'Colmar',
    usage: "<strong>Autre logement : changement d'usage avec compensation dès le 2e logement</strong> (dès le 1er pour une société), à reconstituer près du centre pour les logements du périmètre central.",
    faqSuite: "Pour un autre logement, Colmar exige une autorisation de changement d'usage, avec compensation dès le deuxième logement (dès le premier pour une société).",
    pics: [
      "Marchés de Noël, de fin novembre à fin décembre : le pic de l'année",
      "Foire aux vins d'Alsace, fin juillet et début août",
      "Été : Route des vins et villages viticoles",
    ],
    menage: [
      "<strong>Décembre :</strong> week-ends complets et visiteurs venus de loin. Réservez vos équipes dès la rentrée.",
      "<strong>Petites surfaces, gros flux :</strong> studios et deux-pièces de la Petite Venise tournent vite. Des passages courts et bien rodés.",
      "<strong>Colombages :</strong> escaliers raides et parquets anciens. Produits adaptés au bois.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> la Petite Venise, les colombages colorés, une fenêtre sur les canaux.",
      "<strong>Une photo de Noël :</strong> une ambiance de décembre aide à vendre la période la plus chère.",
      "<strong>Villages viticoles :</strong> Eguisheim ou Riquewihr à quelques minutes, à mentionner en légende.",
    ],
    sources: [
      { label: 'Ville de Colmar : déclarer une location meublée touristique', url: 'https://www.colmar.fr/meuble-de-tourisme' },
      { label: 'Ville de Colmar : règlement du changement d’usage', url: 'https://www.colmar.fr/sites/colmar.fr/files/documents/reglement-et-plan-changement-usage-meubles-tourisme.pdf' },
    ],
  }),

  dijon: ville({
    ville: 'Dijon',
    pics: [
      "Foire internationale et gastronomique, fin octobre et début novembre",
      "Septembre et octobre : vendanges sur la route des Grands Crus",
      "Toute l'année : Cité internationale de la gastronomie et du vin, Climats de Bourgogne",
    ],
    menage: [
      "<strong>Ville étape :</strong> beaucoup de séjours d'une nuit sur la route du sud. Ménages rapides et fréquents, créneaux en fin de matinée.",
      "<strong>Automne gourmand :</strong> vendanges et foire gastronomique. Le pic va de septembre à novembre, pas seulement l'été.",
      "<strong>Secteur sauvegardé :</strong> immeubles anciens, parquets. Produits adaptés au bois.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> les toits de tuiles vernissées, le palais des ducs, les hôtels particuliers.",
      "<strong>Univers du vin :</strong> une photo d'ambiance autour des vins de Bourgogne parle aux œnotouristes.",
      "<strong>Accès :</strong> parking et distance à la gare en légende, les voyageurs en étape filtrent là-dessus.",
    ],
  }),

  arcachon: ville({
    ville: 'Arcachon',
    usage: "<strong>Autre logement : autorisation de changement d'usage</strong> à obtenir auprès de la mairie d'Arcachon.",
    faqSuite: "Pour un autre logement, Arcachon exige une autorisation de changement d'usage.",
    pics: [
      "Été : juillet et août, un pic très concentré",
      "Dune du Pilat et Cap Ferret à proximité",
      "Week-ends et vacances scolaires : clientèle bordelaise",
    ],
    menage: [
      "<strong>Samedis d'été :</strong> la plupart des locations changent le samedi. Une équipe renforcée en juillet et août.",
      "<strong>Sable et pins :</strong> sable de la dune, aiguilles de pin. Aspiration et sols à chaque passage.",
      "<strong>Villas de la Ville d'Hiver :</strong> grandes maisons anciennes. Un temps de ménage adapté à la surface.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> les villas de la Ville d'Hiver, le bassin, les cabanes ostréicoles, la dune.",
      "<strong>Les marées :</strong> la vue sur le bassin est plus belle à marée haute. Planifiez la séance en conséquence.",
      "<strong>Montrez l'extérieur :</strong> jardin, terrasse, vélos. À Arcachon, on vit dehors.",
    ],
    sources: [
      { label: "Mairie d'Arcachon : meublés de tourisme", url: 'https://www.ville-arcachon.fr/locations-et-hebergements-de-courte-duree-meuble-de-tourisme/' },
    ],
  }),

  deauville: ville({
    ville: 'Deauville',
    pics: [
      "Festival du cinéma américain, début septembre",
      "Août : courses hippiques et ventes de yearlings",
      "Week-ends toute l'année : Parisiens à environ 2 heures de train",
    ],
    menage: [
      "<strong>Rythme week-end :</strong> arrivées le vendredi soir, départs le dimanche. Les passages se concentrent le dimanche après-midi et le lundi.",
      "<strong>Clientèle exigeante :</strong> niveau hôtelier attendu, linge impeccable.",
      "<strong>Air marin :</strong> sel sur les vitres, humidité. Aération et contrôle des salles de bain.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> les villas normandes à colombages, les Planches, les parasols colorés.",
      "<strong>Ciel normand :</strong> changeant. Shootez par temps clair et éclairez bien l'intérieur.",
      "<strong>Timing :</strong> annonce prête avant l'été, pour la saison des courses et du festival.",
    ],
  }),

  reims: ville({
    ville: 'Reims',
    pics: [
      "Toute l'année : visites des maisons de Champagne",
      "Marché de Noël au pied de la cathédrale, de fin novembre à fin décembre",
      "Septembre : vendanges en Champagne",
    ],
    menage: [
      "<strong>Séjours courts :</strong> une ou deux nuits pour la Champagne. Turnovers fréquents, souvent en semaine.",
      "<strong>Arrivées en TGV :</strong> beaucoup de voyageurs arrivent en fin de matinée. Prévoyez des créneaux tôt.",
      "<strong>Verres et vaisselle :</strong> on déguste. Contrôlez systématiquement la verrerie.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> une vue sur la cathédrale, les façades Art déco, les coteaux champenois.",
      "<strong>Ambiance Champagne :</strong> verres et seau à champagne sur la table. Une photo d'ambiance vend l'expérience.",
      "<strong>Accès :</strong> distance à pied de la gare et des maisons de Champagne en légende.",
    ],
  }),

  tours: ville({
    ville: 'Tours',
    pics: [
      "Printemps et été : châteaux de la Loire (Chenonceau, Amboise, Villandry)",
      "La Loire à Vélo, d'avril à octobre",
      "Tourisme d'affaires et universitaire toute l'année",
    ],
    menage: [
      "<strong>Étape des châteaux :</strong> séjours de deux ou trois nuits. Rotations en semaine autant que le week-end.",
      "<strong>Cyclistes :</strong> vélos, sacoches, vêtements de pluie. Des sols faciles à entretenir et un espace pour le matériel.",
      "<strong>Tuffeau :</strong> maisons en pierre parfois humides. Aérez à chaque passage.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> le Vieux-Tours, la place Plumereau, les maisons à pans de bois, la Loire.",
      "<strong>Local vélo :</strong> garage ou local sécurisé. Les cyclistes de la Loire à Vélo le cherchent.",
      "<strong>Lumière :</strong> le tuffeau clair prend bien la lumière de fin de journée.",
    ],
  }),

  metz: ville({
    ville: 'Metz',
    pics: [
      "Fêtes de la Mirabelle, fin août",
      "Marchés de Noël, de fin novembre à fin décembre",
      "Centre Pompidou-Metz et tourisme d'affaires, avec le Luxembourg tout proche",
    ],
    menage: [
      "<strong>Pros et frontaliers :</strong> séjours en semaine liés au Luxembourg. Des turnovers réguliers du lundi au vendredi.",
      "<strong>Immeubles anciens :</strong> pierre de Jaumont, escaliers. Prévoyez le temps d'accès.",
      "<strong>Décembre :</strong> marchés de Noël et week-ends pleins. Réservez tôt.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> la pierre jaune de Jaumont, la cathédrale Saint-Étienne, la Moselle.",
      "<strong>Voyageurs pros :</strong> bureau, wifi, parking, temps de trajet vers la gare et vers Luxembourg.",
      "<strong>Lumière :</strong> la pierre jaune rayonne en fin de journée.",
    ],
  }),

  rouen: ville({
    ville: 'Rouen',
    pics: [
      "Armada de Rouen : prochaine édition du 17 au 27 juin 2027",
      "Fêtes Jeanne d'Arc, fin mai",
      "Week-ends depuis Paris et tourisme d'affaires",
    ],
    menage: [
      "<strong>L'Armada 2027 :</strong> dix jours où la ville est pleine. Préparez vos équipes bien à l'avance.",
      "<strong>Colombages :</strong> maisons anciennes, escaliers raides. Matériel léger et produits adaptés au bois.",
      "<strong>Week-ends parisiens :</strong> départs le dimanche. Concentrez les passages le dimanche après-midi et le lundi.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> la cathédrale, le Gros-Horloge, les colombages, les quais de Seine.",
      "<strong>Intérieurs anciens :</strong> poutres et tomettes. Lumière chaude et grand angle modéré pour ne pas déformer.",
      "<strong>Timing :</strong> annonce à jour bien avant l'Armada de juin 2027.",
    ],
    evSources: [
      { label: "France 3 : dates de la prochaine Armada de Rouen", url: 'https://france3-regions.franceinfo.fr/normandie/seine-maritime/rouen/decouvrez-les-dates-de-la-prochaine-edition-de-l-armada-de-rouen-2903372.html' },
    ],
  }),

  perpignan: ville({
    ville: 'Perpignan',
    pics: [
      "Visa pour l'Image, festival de photojournalisme, fin août et septembre",
      "Été : plages de Canet et Côte Vermeille",
      "Toute l'année : étape vers l'Espagne",
    ],
    menage: [
      "<strong>Été chaud :</strong> clim, moustiquaires, passages tôt le matin.",
      "<strong>Retour de plage :</strong> Canet est tout proche. Sols et douches prennent plus de temps en été.",
      "<strong>Saison prolongée :</strong> Visa pour l'Image fait durer la demande en septembre. Gardez l'équipe au-delà d'août.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> le Castillet, les façades colorées, les terrasses, les palmiers.",
      "<strong>Lumière catalane :</strong> dure à midi. Shootez tôt ou tard.",
      "<strong>Mer et montagne :</strong> Canigou et plages à proximité. Donnez les temps de trajet.",
    ],
  }),

  grenoble: ville({
    ville: 'Grenoble',
    pics: [
      "Hiver : ski dans les stations proches (Chamrousse, Les Sept Laux)",
      "Toute l'année : recherche, universités et industrie",
      "Été : randonnée en Chartreuse, Vercors et Belledonne",
    ],
    menage: [
      "<strong>Voyageurs d'affaires :</strong> séjours de plusieurs nuits en semaine. Proposez un ménage en cours de séjour.",
      "<strong>Skieurs :</strong> équipement mouillé et chaussures. Entrées et sols à soigner en hiver.",
      "<strong>Chercheurs et étudiants :</strong> séjours de moyenne durée à la rentrée, avec un ménage hebdomadaire à vendre.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> la vue sur les montagnes, la Bastille et ses « bulles », les toits.",
      "<strong>Accès :</strong> tram, parking, temps de route vers les stations dans la légende.",
      "<strong>Lumière :</strong> vallée encaissée, soleil bas l'hiver. Shootez en milieu de journée.",
    ],
  }),

  bayonne: ville({
    ville: 'Bayonne',
    usage: "<strong>Autre logement : changement d'usage avec compensation</strong>, comme dans les 24 communes en zone tendue de la Communauté Pays Basque. La résidence principale louée dans la limite du plafond en est dispensée.",
    faqSuite: "Pour un autre logement, la Communauté Pays Basque impose le principe de compensation : il faut remettre sur le marché un logement au moins équivalent.",
    pics: [
      "Fêtes de Bayonne, fin juillet : cinq jours, le pic de l'année",
      "Foire au jambon, au printemps",
      "Été : plages d'Anglet et de Biarritz à quelques minutes",
    ],
    menage: [
      "<strong>Après les Fêtes :</strong> logements très sollicités. Prévoyez un ménage renforcé à la sortie (sols, textiles, literie).",
      "<strong>Petit et Grand Bayonne :</strong> rues étroites, stationnement difficile. Comptez le temps d'accès.",
      "<strong>Humidité :</strong> climat océanique. Aération et surveillance des salles de bain.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> les maisons à colombages colorés sur la Nive, la cathédrale, les quais.",
      "<strong>Ambiance basque :</strong> linge basque, rouge et blanc, sans surcharger.",
      "<strong>Les plages en légende :</strong> Anglet et Biarritz sont à quelques minutes, dites-le.",
    ],
    sources: [
      { label: 'Communauté Pays Basque : louer un meublé de tourisme', url: 'https://www.communaute-paysbasque.fr/logement-et-urbanisme/la-location-dun-meuble-de-tourisme-au-pays-basque' },
    ],
  }),

  caen: ville({
    ville: 'Caen',
    pics: [
      "Commémorations du Débarquement, autour du 6 juin",
      "Toute l'année : Mémorial de Caen et plages du Débarquement",
      "Rentrée universitaire en septembre",
    ],
    menage: [
      "<strong>Début juin :</strong> commémorations et visiteurs du monde entier. Réservez vos équipes tôt.",
      "<strong>Séjours mémoriels :</strong> souvent deux ou trois nuits. Des rotations en semaine.",
      "<strong>Immeubles de la Reconstruction :</strong> souvent avec ascenseur, logistique simple. Un argument pour un tarif serré.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> l'abbaye aux Hommes, le château, le port de plaisance.",
      "<strong>Accès :</strong> temps de route vers les plages du Débarquement et le Mémorial dans la légende.",
      "<strong>Ciel normand :</strong> intérieurs bien éclairés, éclaircies pour l'extérieur.",
    ],
  }),

  vannes: ville({
    ville: 'Vannes',
    pics: [
      "Été : golfe du Morbihan et ses îles (île d'Arz, île aux Moines)",
      "Printemps et automne : voile et randonnée sur le sentier côtier",
      "Ponts de mai et vacances scolaires",
    ],
    menage: [
      "<strong>Samedis d'été :</strong> la plupart des changements tombent le samedi. Une équipe renforcée.",
      "<strong>Air marin :</strong> humidité, sel. Aérez et contrôlez les salles de bain.",
      "<strong>Intra-muros :</strong> maisons anciennes et accès en voiture limité. Comptez le temps d'accès.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> les remparts et leurs jardins, les lavoirs, les maisons à pans de bois, le port.",
      "<strong>Le golfe :</strong> une vue sur l'eau ou un bateau fait une photo de couverture idéale.",
      "<strong>Marées :</strong> shootez à marée haute pour les vues sur le golfe.",
    ],
  }),

  angers: ville({
    ville: 'Angers',
    pics: [
      "Festival Premiers Plans, en janvier",
      "Accroche-Cœurs, festival des arts de la rue, en septembre",
      "Printemps et été : châteaux, vignobles d'Anjou et Loire à Vélo",
    ],
    menage: [
      "<strong>Ville universitaire :</strong> séjours de rentrée et missions en semaine. Une demande régulière hors saison.",
      "<strong>Ardoise et tuffeau :</strong> maisons anciennes. Aération et produits adaptés.",
      "<strong>Cyclistes :</strong> sols faciles à entretenir et espace pour les vélos.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> le château et ses tours, la cathédrale, l'ardoise et le tuffeau.",
      "<strong>Ville verte :</strong> un jardin ou un balcon fleuri mérite sa photo.",
      "<strong>Accès :</strong> tram et gare en légende.",
    ],
  }),

  'la-baule': ville({
    ville: 'La Baule',
    pics: [
      "Été : une baie et une plage de près de 9 km",
      "Jumping international, en juin",
      "Week-ends et vacances : clientèle nantaise et parisienne",
    ],
    menage: [
      "<strong>Saison concentrée :</strong> juillet et août, changements le samedi. Une équipe renforcée ces deux mois.",
      "<strong>Sable :</strong> la plage à quelques pas. Aspiration et douches à chaque passage.",
      "<strong>Résidences balnéaires :</strong> parkings souterrains, badges d'accès. Récupérez-les avant la saison.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> la baie, les villas balnéaires, les pins.",
      "<strong>Vue mer :</strong> si vous l'avez, c'est la photo de couverture.",
      "<strong>Fin de journée :</strong> la lumière du soir sur la baie est le bon créneau pour les photos extérieures.",
    ],
  }),

  chambery: ville({
    ville: 'Chambéry',
    pics: [
      "Hiver : étape vers les stations de Savoie",
      "Été : lacs du Bourget et d'Aiguebelette",
      "Tourisme d'affaires et universitaire toute l'année",
    ],
    menage: [
      "<strong>Nuits d'étape :</strong> en hiver, beaucoup de voyageurs dorment une nuit avant de monter en station. Rotations le vendredi et le samedi.",
      "<strong>Skieurs :</strong> équipement mouillé. Entrées et sols à soigner.",
      "<strong>Vieille ville :</strong> escaliers et ruelles. Matériel léger.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> la fontaine des Éléphants, le château des ducs de Savoie, les montagnes.",
      "<strong>Accès :</strong> temps de route vers les stations et le lac du Bourget en légende.",
      "<strong>Deux saisons :</strong> changez la photo de couverture entre l'hiver et l'été.",
    ],
  }),

  sete: ville({
    ville: 'Sète',
    pics: [
      "Fête de la Saint-Louis et tournoi de joutes, fin août",
      "Été : plages du lido et festivals au théâtre de la Mer",
      "Toute l'année : étang de Thau et ports",
    ],
    menage: [
      "<strong>Retour de plage :</strong> sable et serviettes. Sols et douches à chaque passage.",
      "<strong>Canaux :</strong> stationnement difficile dans le centre. Comptez le temps d'accès.",
      "<strong>Mont Saint-Clair :</strong> maisons en pente et escaliers. Prévoyez le transport du linge.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> les canaux, les bateaux colorés, la vue du mont Saint-Clair sur la mer et l'étang de Thau.",
      "<strong>Couleurs :</strong> façades pastel et lumière méditerranéenne. Shootez le matin.",
      "<strong>Légende :</strong> citez la proximité des plages et des parcs à huîtres de l'étang.",
    ],
  }),

  brest: ville({
    ville: 'Brest',
    pics: [
      "Toute l'année : Marine nationale, recherche océanographique, missions pros",
      "Été : Océanopolis, départs vers Ouessant et Molène",
      "Rentrée universitaire en septembre",
    ],
    menage: [
      "<strong>Missions pros :</strong> séjours en semaine. Des turnovers réguliers hors saison.",
      "<strong>Pluie et vent :</strong> entrées et sols humides. Tapis et produits adaptés.",
      "<strong>Séchage du linge :</strong> plus long en hiver. Prévoyez deux jeux par lit.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> une vue sur la rade, le port, le pont de Recouvrance.",
      "<strong>Ciel breton :</strong> guettez les éclaircies pour l'extérieur, éclairez bien l'intérieur.",
      "<strong>Accès :</strong> tram et téléphérique urbain en légende.",
    ],
  }),

  pau: ville({
    ville: 'Pau',
    pics: [
      "Grand Prix de Pau, au printemps",
      "Hiver : stations des Pyrénées béarnaises",
      "Toute l'année : étape vers Lourdes, pros et étudiants",
    ],
    menage: [
      "<strong>Pros et étudiants :</strong> séjours en semaine. Une demande régulière hors saison.",
      "<strong>Skieurs :</strong> en hiver, équipement mouillé. Entrées et sols à soigner.",
      "<strong>Maisons béarnaises :</strong> grands volumes, parquets. Un temps de ménage adapté à la surface.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> le boulevard des Pyrénées et sa vue sur la chaîne, le château.",
      "<strong>Vue montagne :</strong> les sommets se voient mieux le matin par temps clair.",
      "<strong>Accès :</strong> funiculaire, gare et parking en légende.",
    ],
  }),

  'saint-tropez': ville({
    ville: 'Saint-Tropez',
    usage: "<strong>Résidence secondaire : autorisation de changement d'usage obligatoire</strong> avant de louer.",
    faqSuite: "Pour une résidence secondaire, une autorisation de changement d'usage est obligatoire à Saint-Tropez.",
    pics: [
      "Été : juillet et août, un pic extrême",
      "Les Voiles de Saint-Tropez, fin septembre et début octobre",
      "Mai, juin et septembre : des ailes de saison de plus en plus demandées",
    ],
    menage: [
      "<strong>Standard haut de gamme :</strong> linge hôtelier, finitions parfaites, produits d'accueil.",
      "<strong>Villas avec piscine :</strong> extérieurs, terrasse et piscine à inclure dans l'offre.",
      "<strong>Circulation estivale :</strong> la route de la presqu'île est saturée en été. Prévoyez de larges marges entre deux villas.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> le port, les façades pastel, la mer, la piscine.",
      "<strong>Concurrence pro :</strong> les villas voisines ont des photos de magazine. Un photographe professionnel est ici un minimum.",
      "<strong>Heure dorée :</strong> piscine et terrasse au coucher du soleil pour la photo de couverture.",
    ],
    sources: [
      { label: 'Saint-Tropez : plateforme de la taxe de séjour et des meublés', url: 'https://sainttropez.taxesejour.fr/' },
    ],
  }),

  honfleur: ville({
    ville: 'Honfleur',
    pics: [
      "Week-ends toute l'année : clientèle parisienne",
      "Fête des Marins, à la Pentecôte",
      "Printemps et été, vacances scolaires",
    ],
    menage: [
      "<strong>Rythme week-end :</strong> départs le dimanche. Les passages se concentrent le dimanche après-midi et le lundi.",
      "<strong>Maisons étroites :</strong> escaliers raides sur plusieurs étages. Matériel léger.",
      "<strong>Humidité :</strong> estuaire et air marin. Aérez et contrôlez les salles de bain.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> le Vieux Bassin, les maisons hautes à ardoises, l'église Sainte-Catherine en bois.",
      "<strong>La lumière des peintres :</strong> Honfleur a inspiré Boudin et les impressionnistes. Shootez tôt le matin sur le bassin.",
      "<strong>Intérieur :</strong> poutres et cheminée, avec un éclairage chaud.",
    ],
  }),

  'le-touquet': ville({
    ville: 'Le Touquet',
    pics: [
      "Enduropale, course de motos sur la plage, début février",
      "Été : plage et forêt",
      "Week-ends toute l'année : clientèle parisienne, du Nord et britannique",
    ],
    menage: [
      "<strong>Enduropale :</strong> un week-end d'hiver complet, avec sable et boue rapportés. Un ménage renforcé à prévoir.",
      "<strong>Rythme week-end :</strong> départs le dimanche. Concentrez les passages le dimanche et le lundi.",
      "<strong>Villas en forêt :</strong> aiguilles de pin et humidité. Entrées et terrasses à soigner.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> les villas anglo-normandes dans les pins, la plage immense, le front de mer.",
      "<strong>Clientèle britannique :</strong> une légende en anglais et le temps de route depuis Calais.",
      "<strong>Ciel du Nord :</strong> profitez des éclaircies, éclairez bien l'intérieur.",
    ],
  }),

  carcassonne: ville({
    ville: 'Carcassonne',
    pics: [
      "Embrasement de la Cité, le 14 juillet",
      "Festival de Carcassonne, en été",
      "Printemps et automne : la Cité et les châteaux cathares",
    ],
    menage: [
      "<strong>Séjours d'une ou deux nuits :</strong> les visiteurs de la Cité enchaînent. Des rotations fréquentes.",
      "<strong>Chaleur :</strong> en été, clim et volets fermés au départ.",
      "<strong>Accès :</strong> la Cité est largement piétonne. Préférez les logements de la Bastide pour une logistique simple.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> une vue sur les remparts de la Cité, surtout illuminés le soir.",
      "<strong>Heure bleue :</strong> la Cité éclairée au crépuscule fait une photo de couverture très forte.",
      "<strong>Accès :</strong> parking et distance à pied de la Cité en légende.",
    ],
  }),

  ajaccio: ville({
    ville: 'Ajaccio',
    usage: "<strong>Autre logement : autorisation préalable de changement d'usage</strong>, exigée par la Ville depuis le 1er mai 2025.",
    faqSuite: "Pour un autre logement, Ajaccio exige une autorisation préalable de changement d'usage depuis le 1er mai 2025.",
    pics: [
      "Été : juillet et août",
      "Fêtes napoléoniennes, autour du 15 août",
      "Printemps et automne : randonnée et golfe plus calme",
    ],
    menage: [
      "<strong>Horaires des ferries et des avions :</strong> arrivées tôt le matin ou tard le soir. Adaptez les créneaux.",
      "<strong>Chaleur et sable :</strong> clim, douches, sols à chaque passage en été.",
      "<strong>Linge :</strong> sur l'île, les blanchisseries sont très sollicitées en été. Un stock d'avance est indispensable.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> le golfe, la citadelle, une vue vers les îles Sanguinaires.",
      "<strong>Coucher de soleil :</strong> les Sanguinaires au soleil couchant, c'est la carte postale d'Ajaccio.",
      "<strong>Extérieur :</strong> terrasse et vue mer en couverture.",
    ],
    sources: [
      { label: "Mairie d'Ajaccio : régulation des meublés de tourisme", url: 'https://ajaccio.corsica/regulation-meubles-tourisme-ville-dajaccio-anticipe-mise-oeuvre-loi/' },
    ],
  }),

  antibes: ville({
    ville: 'Antibes',
    pics: [
      "Jazz à Juan, en juillet",
      "Été balnéaire à Juan-les-Pins et au Cap d'Antibes",
      "Port Vauban : équipages et visiteurs de grands yachts en saison",
    ],
    menage: [
      "<strong>Équipages :</strong> séjours de plusieurs semaines. Proposez un ménage hebdomadaire.",
      "<strong>Sable et sel :</strong> vitres et terrasses à chaque passage.",
      "<strong>Vieil Antibes :</strong> ruelles et stationnement difficile. Comptez le temps d'accès.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> les remparts, le Vieil Antibes, le fort Carré, Port Vauban.",
      "<strong>Vue mer ou port :</strong> photo de couverture si vous l'avez.",
      "<strong>Lumière :</strong> fin d'après-midi sur les remparts.",
    ],
  }),

  sarlat: ville({
    ville: 'Sarlat',
    pics: [
      "Été : châteaux et vallée de la Dordogne",
      "Festival des Jeux du Théâtre, en juillet et août",
      "Fête de la Truffe, en janvier",
    ],
    menage: [
      "<strong>Gîtes avec piscine :</strong> entretien de la piscine et des extérieurs à ajouter.",
      "<strong>Samedis d'été :</strong> changements à la semaine. Une équipe renforcée en juillet et août.",
      "<strong>Pierre et poutres :</strong> maisons anciennes, poussière de pierre. Produits adaptés.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> la pierre ocre, les toits de lauzes, les ruelles médiévales.",
      "<strong>Extérieur :</strong> piscine et vue sur la campagne en couverture.",
      "<strong>Lumière :</strong> la pierre dorée en fin de journée.",
    ],
  }),

  nimes: ville({
    ville: 'Nîmes',
    pics: [
      "Feria de Pentecôte",
      "Feria des Vendanges, en septembre",
      "Toute l'année : Arènes et Maison Carrée, inscrite à l'UNESCO en 2023",
    ],
    menage: [
      "<strong>Ferias :</strong> quelques jours très intenses, groupes nombreux. Un ménage renforcé à la sortie.",
      "<strong>Chaleur :</strong> clim et volets fermés au départ en été.",
      "<strong>Écusson :</strong> centre ancien piéton. Comptez le temps d'accès.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> les Arènes, la Maison Carrée, les jardins de la Fontaine.",
      "<strong>Groupes :</strong> pour les ferias, montrez le nombre de couchages et l'espace commun.",
      "<strong>Lumière :</strong> fin d'après-midi sur la pierre.",
    ],
  }),

  'le-mans': ville({
    ville: 'Le Mans',
    pics: [
      "24 Heures du Mans (automobile) : semaine de course en juin, du 10 au 14 juin en 2026",
      "24 Heures Motos, au printemps",
      "Toute l'année : Cité Plantagenêt et tourisme d'affaires",
    ],
    menage: [
      "<strong>Semaine des 24 Heures :</strong> la plus chère de l'année, avec des groupes. Un ménage renforcé à la sortie.",
      "<strong>Séjours de groupe :</strong> beaucoup de couchages. Prévoyez le linge en conséquence.",
      "<strong>Hors course :</strong> séjours pros en semaine.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> la Cité Plantagenêt, les maisons à pans de bois, la cathédrale.",
      "<strong>Pour les 24 Heures :</strong> montrez le nombre de couchages, le parking et le temps jusqu'au circuit.",
      "<strong>Timing :</strong> annonce prête dès l'hiver, les passionnés réservent tôt.",
    ],
    evSources: [
      { label: 'FIA WEC : 24 Heures du Mans 2026', url: 'https://www.fiawec.com/fr/race/24-heures-du-mans-2026' },
    ],
  }),

  versailles: ville({
    ville: 'Versailles',
    taxe: "Logement non classé : un taux voté localement, <strong>entre 1 % et 5 % du prix HT de la nuitée par personne</strong>, dans la limite d'un plafond, plus la taxe additionnelle départementale et, depuis 2025, une <strong>taxe additionnelle de 200 % au profit d'Île-de-France Mobilités</strong>, comme dans toute l'Île-de-France.",
    faqTaxe: "Pour un meublé non classé, le taux est voté localement entre 1 % et 5 % du prix HT de la nuitée par personne, dans la limite d'un plafond, auxquels s'ajoutent la taxe additionnelle départementale et, depuis 2025, <strong>une taxe additionnelle de 200 % au profit d'Île-de-France Mobilités</strong>. Airbnb la collecte en général pour vous ; en réservation directe, vous la collectez et la reversez à Versailles Grand Parc.",
    pics: [
      "Grandes Eaux musicales du château, d'avril à octobre",
      "Toute l'année : visiteurs du château, à 30 minutes de Paris",
      "Tourisme d'affaires dans les Yvelines",
    ],
    menage: [
      "<strong>Visiteurs du château :</strong> séjours de deux ou trois nuits. Rotations régulières d'avril à octobre.",
      "<strong>Clientèle internationale :</strong> niveau hôtelier attendu, linge impeccable.",
      "<strong>Stationnement :</strong> payant dans le centre. Intégrez-le au devis.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> les façades classiques, les parquets, une vue sur les jardins ou le château.",
      "<strong>Accès :</strong> distance à pied du château et des gares vers Paris en légende.",
      "<strong>Intérieurs classiques :</strong> moulures et cheminées, avec une lumière naturelle douce.",
    ],
    sources: [
      { label: 'Versailles Grand Parc : guide pratique 2026 de la taxe de séjour', url: 'https://www.versaillesgrandparc.fr/fileadmin/www.versaillesgrandparc.fr/MEDIA/Au_quotidien/Tourisme_-Destination_Versailles_Grand_Parc/Guide_pratique_Taxe_de_sejour_2026.pdf' },
      REGLES,
    ],
  }),

  megeve: ville({
    ville: 'Megève',
    pics: [
      "Hiver : ski de mi-décembre à avril, avec des pics à Noël et en février",
      "Été : randonnée, golf et villages de montagne",
      "Toute l'année : une clientèle haut de gamme",
    ],
    menage: [
      "<strong>Chalets haut de gamme :</strong> niveau hôtelier, linge premium, finitions parfaites.",
      "<strong>Neige :</strong> chaussures, skis, vêtements mouillés. Entrées et séchoirs à chaque passage.",
      "<strong>Samedis d'hiver :</strong> changements à la semaine. Une équipe renforcée en saison.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> le bois, la cheminée, la vue sur le Mont-Blanc, le village enneigé.",
      "<strong>Chalets de prestige :</strong> la concurrence a des photos de magazine. Un photographe professionnel s'impose.",
      "<strong>Deux saisons :</strong> couverture d'hiver et couverture d'été.",
    ],
  }),

  beaune: ville({
    ville: 'Beaune',
    pics: [
      "Vente des vins des Hospices de Beaune, le troisième dimanche de novembre",
      "Septembre : vendanges",
      "Printemps et été : route des Grands Crus et Hôtel-Dieu",
    ],
    menage: [
      "<strong>Week-end des Hospices :</strong> le pic de l'année. Réservez vos équipes dès septembre.",
      "<strong>Séjours courts :</strong> deux ou trois nuits pour les œnotouristes. Rotations fréquentes.",
      "<strong>Verrerie :</strong> on déguste. Contrôlez verres et vaisselle à chaque passage.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> les toits vernissés de l'Hôtel-Dieu, les caves, les vignes.",
      "<strong>Ambiance vin :</strong> une table dressée avec des verres parle aux œnotouristes.",
      "<strong>Automne :</strong> les vignes dorées d'octobre font une photo d'extérieur superbe.",
    ],
  }),

  epernay: ville({
    ville: 'Épernay',
    pics: [
      "Habits de Lumière, en décembre",
      "Toute l'année : avenue de Champagne et visites de caves",
      "Septembre : vendanges",
    ],
    menage: [
      "<strong>Séjours courts :</strong> une ou deux nuits pour les visites de caves. Rotations fréquentes.",
      "<strong>Verrerie :</strong> à contrôler systématiquement.",
      "<strong>Habits de Lumière :</strong> un week-end très demandé. Réservez tôt.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> l'avenue de Champagne, les coteaux, les vignes.",
      "<strong>Ambiance Champagne :</strong> seau et coupes sur la table pour la photo d'ambiance.",
      "<strong>Automne :</strong> vignes dorées en octobre.",
    ],
  }),

  etretat: ville({
    ville: 'Étretat',
    pics: [
      "Week-ends toute l'année : clientèle parisienne",
      "Été : falaises et plage de galets",
      "Printemps : randonnée sur le sentier des douaniers",
    ],
    menage: [
      "<strong>Rythme week-end :</strong> départs le dimanche. Concentrez les passages le dimanche après-midi et le lundi.",
      "<strong>Randonneurs :</strong> boue et galets rapportés. Entrées et sols à soigner.",
      "<strong>Petites maisons :</strong> escaliers et accès étroits. Matériel léger.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> les falaises, l'Aiguille, la porte d'Aval, la plage de galets.",
      "<strong>Coucher de soleil :</strong> les falaises au soleil couchant font une couverture forte.",
      "<strong>Accès :</strong> temps à pied jusqu'à la plage et parking en légende.",
    ],
  }),

  menton: ville({
    ville: 'Menton',
    pics: [
      "Fête du Citron, en février",
      "Hiver doux : longs séjours",
      "Été balnéaire",
    ],
    menage: [
      "<strong>Longs séjours d'hiver :</strong> ménage hebdomadaire à proposer.",
      "<strong>Sable et sel :</strong> vitres et terrasses en été.",
      "<strong>Vieille ville en pente :</strong> escaliers. Matériel léger.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> les façades colorées de la vieille ville, la basilique, la mer.",
      "<strong>Hiver ensoleillé :</strong> une photo de terrasse au soleil en février vend la douceur de l'hiver.",
      "<strong>Accès :</strong> distance à la gare et à la frontière italienne en légende.",
    ],
  }),

  dinard: ville({
    ville: 'Dinard',
    pics: [
      "Festival du film britannique, à l'automne",
      "Été : plages et villas Belle Époque",
      "Route du Rhum à Saint-Malo, juste en face, fin octobre et début novembre 2026",
    ],
    menage: [
      "<strong>Grandes villas :</strong> surfaces importantes. Un temps de ménage adapté.",
      "<strong>Sable et air marin :</strong> sols et vitres.",
      "<strong>Automne :</strong> festival et Route du Rhum prolongent la saison.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> les villas Belle Époque, la plage de l'Écluse, la vue sur Saint-Malo.",
      "<strong>Marées :</strong> shootez à marée haute pour les vues mer.",
      "<strong>Clientèle britannique :</strong> une légende en anglais aide.",
    ],
  }),

  quimper: ville({
    ville: 'Quimper',
    pics: [
      "Festival de Cornouaille, en juillet",
      "Été : plages du Finistère sud",
      "Toute l'année : cathédrale et faïenceries",
    ],
    menage: [
      "<strong>Festival de Cornouaille :</strong> une semaine très demandée. Réservez tôt.",
      "<strong>Pluie :</strong> entrées et sols humides. Tapis et produits adaptés.",
      "<strong>Maisons anciennes :</strong> escaliers. Matériel léger.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> la cathédrale Saint-Corentin, les maisons à pans de bois, l'Odet.",
      "<strong>Accès :</strong> temps de route vers les plages en légende.",
      "<strong>Ciel breton :</strong> éclaircies pour l'extérieur.",
    ],
  }),

  nancy: ville({
    ville: 'Nancy',
    pics: [
      "Fêtes de Saint-Nicolas, début décembre",
      "Le Livre sur la Place, en septembre",
      "Toute l'année : place Stanislas et tourisme d'affaires",
    ],
    menage: [
      "<strong>Saint-Nicolas :</strong> un week-end très demandé. Réservez tôt.",
      "<strong>Pros et étudiants :</strong> séjours en semaine.",
      "<strong>Immeubles anciens :</strong> parquets et escaliers.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> la place Stanislas, l'Art nouveau, les vitraux de l'École de Nancy.",
      "<strong>Détails Art nouveau :</strong> une ferronnerie ou un vitrail dans le logement mérite sa photo.",
      "<strong>Accès :</strong> distance à pied de la place et de la gare en légende.",
    ],
  }),

  troyes: ville({
    ville: 'Troyes',
    pics: [
      "Toute l'année : magasins d'usine, surtout le week-end",
      "Printemps et été : lacs de la forêt d'Orient et Champagne de la Côte des Bar",
      "Tourisme d'affaires",
    ],
    menage: [
      "<strong>Week-ends shopping :</strong> séjours d'une ou deux nuits. Rotations le dimanche.",
      "<strong>Pans de bois :</strong> maisons anciennes, escaliers.",
      "<strong>Pros :</strong> séjours en semaine.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> les maisons à pans de bois colorés, la ruelle des Chats, la cathédrale.",
      "<strong>Accès :</strong> parking et temps jusqu'aux magasins d'usine en légende.",
      "<strong>Couleurs :</strong> façades colorées, shootez par temps clair.",
    ],
  }),

  bastia: ville({
    ville: 'Bastia',
    pics: [
      "Été : juillet et août",
      "Arrivées en ferry depuis le continent et l'Italie",
      "Printemps et automne : Cap Corse et randonnée",
    ],
    menage: [
      "<strong>Horaires des ferries :</strong> arrivées tôt ou tard. Adaptez les créneaux.",
      "<strong>Chaleur :</strong> clim et volets en été.",
      "<strong>Linge :</strong> stock d'avance, les blanchisseries de l'île sont très sollicitées en été.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> le Vieux-Port, la citadelle, les façades colorées.",
      "<strong>Accès :</strong> distance au port et à l'aéroport en légende.",
      "<strong>Lumière :</strong> matin sur le Vieux-Port.",
    ],
  }),

  'clermont-ferrand': ville({
    ville: 'Clermont-Ferrand',
    pics: [
      "Festival du court métrage, fin janvier et début février",
      "Été : chaîne des Puys, Vulcania",
      "Toute l'année : ASM Clermont et tourisme d'affaires",
    ],
    menage: [
      "<strong>Festival du court métrage :</strong> dix jours très demandés en plein hiver. Réservez tôt.",
      "<strong>Pros :</strong> séjours en semaine.",
      "<strong>Pierre de Volvic :</strong> immeubles anciens sombres. Éclairage et aération.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> la cathédrale en pierre noire, la vue sur le puy de Dôme.",
      "<strong>Pierre sombre :</strong> éclairez bien l'intérieur.",
      "<strong>Accès :</strong> tram, gare, temps de route vers les volcans en légende.",
    ],
  }),

  poitiers: ville({
    ville: 'Poitiers',
    pics: [
      "Futuroscope, surtout pendant les vacances scolaires",
      "Rentrée universitaire en septembre",
      "Toute l'année : étape sur l'A10",
    ],
    menage: [
      "<strong>Familles du Futuroscope :</strong> séjours de une à trois nuits. Rotations fréquentes pendant les vacances.",
      "<strong>Étudiants :</strong> moyenne durée à la rentrée.",
      "<strong>Nuit d'étape :</strong> rotations rapides.",
    ],
    photo: [
      "<strong>Ce qui fait cliquer :</strong> Notre-Dame-la-Grande, le centre ancien.",
      "<strong>Familles :</strong> montrez les couchages enfants et le parking.",
      "<strong>Accès :</strong> temps jusqu'au Futuroscope en légende.",
    ],
  }),
}
