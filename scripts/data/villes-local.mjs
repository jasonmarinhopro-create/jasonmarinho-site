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
}
