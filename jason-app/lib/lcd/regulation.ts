// Réglementation location courte durée par ville, affichée à côté des
// estimations de revenus (estimateur hôte + espace investisseur).
//
// Pourquoi : l'estimateur donnait un revenu « marché » sans dire que dans
// certaines villes il est devenu impossible (Barcelone, Palma, Málaga…) ou
// très encadré (compensation à Paris, 90 nuits à Marseille…) d'exploiter un
// nouveau logement. Pour un investisseur, c'est le premier risque.
//
// Règles de maintenance :
// - Uniquement des faits vérifiés et sourcés (relevés de septembre 2026).
//   Une ville absente = pas de règle locale confirmée → note générique du pays.
// - `plafondRP` : nuits/an autorisées pour une résidence principale, seulement
//   quand le chiffre est confirmé.
// - Revérifier au moins une fois par an (les règles changent vite).
// - Pas de tiret cadratin (texte affiché aux utilisateurs).
// - Côté site statique, les mêmes faits FR existent dans
//   scripts/data/villes-local.mjs : garder les deux cohérents.

export type RegulationLevel = 'bloquant' | 'restrictif' | 'encadre'

export interface CityRegulation {
  ville: string
  pays: string
  niveau: RegulationLevel
  /** Résumé en une phrase, pensé pour un investisseur. */
  resume: string
  points: string[]
  plafondRP?: number
  source: { label: string; url: string }
}

export const REGULATION_VERIFIED_AT = 'septembre 2026'

export const LEVEL_LABELS: Record<RegulationLevel, string> = {
  bloquant: 'Très difficile pour un nouvel investissement',
  restrictif: 'Fortement encadré',
  encadre: 'Encadré, démarches à prévoir',
}

const R: CityRegulation[] = [
  // ─── France ───────────────────────────────────────────────────────────
  {
    ville: 'Paris', pays: 'FR', niveau: 'bloquant', plafondRP: 90,
    resume: "Un logement acheté pour la location courte durée exige une autorisation de changement d'usage avec compensation, hors de portée de la plupart des particuliers.",
    points: [
      "Résidence principale : 90 nuits par an maximum.",
      "Résidence secondaire ou investissement : changement d'usage avec compensation obligatoire, amende jusqu'à 100 000 € sans autorisation.",
    ],
    source: { label: 'Chambre des notaires de Paris', url: 'https://paris.notaires.fr/fr/actualites/location-meublee-touristique-de-nouvelles-regles-administratives-et-fiscales-apprehender' },
  },
  {
    ville: 'Lyon', pays: 'FR', niveau: 'restrictif', plafondRP: 90,
    resume: "Résidence principale limitée à 90 jours depuis 2026 ; un logement d'investissement exige une autorisation de changement d'usage préalable.",
    points: [
      "Résidence principale : 90 jours par an maximum depuis 2026 (contre 120 avant).",
      "Autre logement : autorisation de changement d'usage préalable.",
    ],
    source: { label: 'Ville de Lyon', url: 'https://www.lyon.fr/demarche/logement-habitat/declarer-un-meuble-de-tourisme' },
  },
  {
    ville: 'Bordeaux', pays: 'FR', niveau: 'restrictif', plafondRP: 90,
    resume: "Résidence principale limitée à 90 jours depuis le 1er janvier 2026 ; un logement d'investissement exige un changement d'usage avec compensation.",
    points: [
      "Résidence principale : 90 jours par an maximum depuis le 1er janvier 2026.",
      "Autre logement : changement d'usage avec compensation (un logement équivalent remis sur le marché).",
    ],
    source: { label: 'Ville de Bordeaux', url: 'https://www.bordeaux.fr/location-touristique-bordeaux--guide-proprietaires' },
  },
  {
    ville: 'Marseille', pays: 'FR', niveau: 'restrictif', plafondRP: 90,
    resume: "Résidence principale limitée à 90 jours ; un logement d'investissement exige un changement d'usage avec compensation, rarement accordé.",
    points: [
      "Résidence principale : 90 jours par an maximum depuis le 1er janvier 2026 (amende jusqu'à 15 000 € en cas de dépassement).",
      "Autre logement : changement d'usage avec compensation obligatoire ; peu de demandes sont acceptées.",
    ],
    source: { label: 'France Bleu', url: 'https://www.francebleu.fr/infos/economie-social/airbnb-90-jours-de-location-de-residence-principale-marseille-serre-la-vis-sur-les-meubles-touristiques-9173181' },
  },
  {
    ville: 'Nice', pays: 'FR', niveau: 'restrictif', plafondRP: 90,
    resume: "Résidence principale limitée à 90 nuits ; un logement d'investissement exige un changement d'usage avec compensation « un pour un ».",
    points: [
      "Résidence principale : 90 nuits par an maximum depuis le 1er janvier 2026.",
      "Autre logement : changement d'usage avec compensation obligatoire.",
    ],
    source: { label: "Métropole Nice Côte d'Azur", url: 'https://www.nicecotedazur.org/services/logement/autorisations-de-changements-dusage/logements-en-meubles-touristiques/' },
  },
  {
    ville: 'Montpellier', pays: 'FR', niveau: 'restrictif', plafondRP: 90,
    resume: "Résidence principale limitée à 90 jours ; quota de meublés atteint dans l'Écusson, autorisations limitées à 4 ans.",
    points: [
      "Résidence principale : 90 jours par an maximum depuis le 1er janvier 2026.",
      "Écusson (centre historique) : quota de 770 meublés déjà atteint, pas de nouvelle autorisation.",
      "Autorisations de changement d'usage limitées à 4 ans, sans renouvellement automatique.",
    ],
    source: { label: 'Plan Immobilier', url: 'https://www.plan-immobilier.fr/actualites-immobilieres/locations-touristiques-la-reglementation-a-montpellier' },
  },
  {
    ville: 'Annecy', pays: 'FR', niveau: 'restrictif',
    resume: "Dans le Grand Annecy, un logement d'investissement exige un changement d'usage avec compensation, très coûteux pour un particulier.",
    points: [
      "Autre logement que la résidence principale : changement d'usage avec compensation dans le même secteur.",
      "Résidence principale : plafond national de 120 nuits (la commune peut l'abaisser à 90).",
    ],
    source: { label: "Ville d'Annecy", url: 'https://www.annecy.fr/annuaires/catalogue-des-demarches/detail/declaration-prealable-dhebergement-meubles-de-tourisme' },
  },
  {
    ville: 'Biarritz', pays: 'FR', niveau: 'restrictif',
    resume: "Au Pays basque, un logement d'investissement exige un changement d'usage avec compensation (24 communes en zone tendue).",
    points: [
      "Autre logement que la résidence principale : compensation obligatoire (créer un logement au moins équivalent).",
      "Résidence principale louée dans la limite du plafond : pas de compensation.",
    ],
    source: { label: 'Communauté Pays Basque', url: 'https://www.communaute-paysbasque.fr/logement-et-urbanisme/la-location-dun-meuble-de-tourisme-au-pays-basque' },
  },
  {
    ville: 'La Rochelle', pays: 'FR', niveau: 'restrictif',
    resume: "Compensation obligatoire dans les quartiers les plus demandés et 3 autorisations maximum par propriétaire.",
    points: [
      "Compensation obligatoire aux Minimes, en centre-ville et au Gabut.",
      "3 autorisations temporaires maximum par propriétaire dans les communes en zone tendue de l'agglomération.",
    ],
    source: { label: 'Agglo La Rochelle', url: 'https://www.agglo-larochelle.fr/meubles-de-tourisme' },
  },
  {
    ville: 'Saint-Malo', pays: 'FR', niveau: 'restrictif',
    resume: "Autorisations soumises à des quotas par secteur, une seule par propriétaire ; l'intra-muros est déjà au quota.",
    points: [
      "Quotas d'autorisations de changement d'usage par secteur.",
      "Une autorisation par propriétaire ; le quota de l'intra-muros a été atteint dès son ouverture.",
    ],
    source: { label: 'Ville de Saint-Malo', url: 'https://www.saint-malo.fr/accueil/vivre/meubles-de-tourisme/' },
  },
  {
    ville: 'Chamonix', pays: 'FR', niveau: 'restrictif',
    resume: "Tout meublé de tourisme hors résidence principale exige une autorisation de changement d'usage, limitée à une par personne.",
    points: [
      "Autorisation de changement d'usage obligatoire dans la vallée (Chamonix, Les Houches, Servoz, Vallorcine).",
      "Une autorisation par personne à Chamonix.",
    ],
    source: { label: 'Ville de Chamonix', url: 'https://www.chamonix.fr/demarches/logement-jhabitat-cham/meubles-de-tourisme-2/' },
  },
  {
    ville: 'Toulouse', pays: 'FR', niveau: 'encadre',
    resume: "Changement d'usage obligatoire hors résidence principale, sans compensation jusqu'à 2 autorisations par particulier.",
    points: [
      "Autre logement : autorisation de changement d'usage, avec compensation au-delà de 2 autorisations par particulier.",
    ],
    source: { label: 'Toulouse Métropole', url: 'https://metropole.toulouse.fr/demarches/louer-un-local-meuble-pour-du-tourisme-ou-de-courtes-durees' },
  },
  {
    ville: 'Nantes', pays: 'FR', niveau: 'encadre', plafondRP: 120,
    resume: "Résidence principale à 120 nuits ; un logement d'investissement exige une autorisation de changement d'usage préalable.",
    points: [
      "Résidence principale : 120 nuits par an (plafond non abaissé à ce jour).",
      "Résidence secondaire : autorisation de changement d'usage préalable.",
    ],
    source: { label: 'Nantes Métropole', url: 'https://metropole.nantes.fr/mes-services-mon-quotidien/connaitre-les-demarches-relatives-au-changement-d-usage-d-un-logement' },
  },
  {
    ville: 'Strasbourg', pays: 'FR', niveau: 'encadre', plafondRP: 120,
    resume: "Résidence principale à 120 nuits ; un logement d'investissement exige une autorisation de changement d'usage.",
    points: [
      "Résidence principale : 120 nuits par an (non abaissé à notre dernière vérification).",
      "Autre logement : autorisation de changement d'usage.",
    ],
    source: { label: 'Strasbourg.eu', url: 'https://www.strasbourg.eu/activite-pro-ou-meuble-de-tourisme' },
  },
  {
    ville: 'Rennes', pays: 'FR', niveau: 'encadre',
    resume: "Un logement d'investissement exige une autorisation de changement d'usage.",
    points: ["Résidence secondaire : autorisation de changement d'usage à demander à la Ville."],
    source: { label: 'Rennes Métropole', url: 'https://economie.metropole.rennes.fr/collecter-la-taxe-de-sejour-et-declarer-un-meuble-de-tourisme-ou-une-chambre-dhotes/' },
  },
  {
    ville: 'Aix-en-Provence', pays: 'FR', niveau: 'encadre',
    resume: "Un logement d'investissement exige une autorisation de changement d'usage avant la déclaration du meublé.",
    points: ["Autre logement : autorisation de changement d'usage, puis déclaration du meublé."],
    source: { label: 'Paul Duvaux', url: 'https://www.paulduvaux.com/documentations/location-meublee-et-parahotellerie/item/611-changement-d-usage-et-numero-d-enregistrement-des-meubles-de-tourisme' },
  },
  {
    ville: 'Saint-Tropez', pays: 'FR', niveau: 'encadre',
    resume: "Une résidence secondaire exige une autorisation de changement d'usage.",
    points: ["Résidence secondaire : autorisation de changement d'usage obligatoire."],
    source: { label: 'Saint-Tropez', url: 'https://sainttropez.taxesejour.fr/' },
  },

  // ─── Espagne ──────────────────────────────────────────────────────────
  {
    ville: 'Barcelona', pays: 'ES', niveau: 'bloquant',
    resume: "Aucune nouvelle licence, et les quelque 10 000 licences existantes expirent en novembre 2028 sans renouvellement.",
    points: [
      "Aucune nouvelle licence de logement touristique (HUT) délivrée.",
      "Les licences existantes expirent en novembre 2028 et ne seront pas renouvelées : un achat pour la location touristique n'a pas d'avenir.",
    ],
    source: { label: 'Minut : règles de Barcelone', url: 'https://www.minut.com/blog/barcelona-short-term-rental-laws' },
  },
  {
    ville: 'Palma', pays: 'ES', niveau: 'bloquant',
    resume: "Toute la commune est déclarée inapte aux nouvelles licences touristiques depuis mai 2026.",
    points: ["Aucune nouvelle licence sur la commune, y compris pour les maisons individuelles."],
    source: { label: 'Chekin : pisos turísticos 2026', url: 'https://chekin.com/blog/ley-pisos-turisticos/' },
  },
  {
    ville: 'Málaga', pays: 'ES', niveau: 'bloquant',
    resume: "Nouvelles licences suspendues sur toute la commune depuis août 2025, au moins jusqu'en 2028.",
    points: ["Suspension des nouvelles licences de logements touristiques sur toute la commune pour trois ans (août 2025)."],
    source: { label: 'VITUR', url: 'https://vitursummit.com/en/malaga-congela-su-crecimiento-turistico-moratoria-de-tres-anos-para-nuevas-licencias-de-hoteles-y-apartamentos/' },
  },
  {
    ville: 'Madrid', pays: 'ES', niveau: 'restrictif',
    resume: "Plan Reside : logements touristiques dispersés interdits dans le centre ; ailleurs, seulement avec un accès indépendant sur rue.",
    points: ["Centre : pas de logement touristique isolé dans un immeuble résidentiel.", "Hors centre : uniquement avec un accès indépendant."],
    source: { label: 'Chekin : pisos turísticos 2026', url: 'https://chekin.com/blog/ley-pisos-turisticos/' },
  },
  {
    ville: 'Valencia', pays: 'ES', niveau: 'restrictif',
    resume: "Plafond de 2 % du parc de logements par quartier depuis mars 2026, et moratoire à Ciutat Vella.",
    points: ["Un quartier se ferme aux nouvelles licences dès que 2 % de ses logements sont touristiques.", "Moratoire sur les nouvelles licences à Ciutat Vella."],
    source: { label: 'RadarVUT : moratorias 2026', url: 'https://www.radarvut.com/blog/moratorias-vivienda-turistica-2026' },
  },

  // ─── Portugal ─────────────────────────────────────────────────────────
  {
    ville: 'Lisboa', pays: 'PT', niveau: 'restrictif',
    resume: "Nouveaux Alojamento Local suspendus dans les zones de contention absolue, qui couvrent le centre historique.",
    points: [
      "Contention absolue (dont Santa Maria Maior, Misericórdia, Santo António) : pas de nouveau registre.",
      "Contention relative (dont Arroios, Estrela) : nouveaux registres seulement par exception.",
    ],
    source: { label: 'ECO : contention à Lisbonne', url: 'https://eco.sapo.pt/2026/04/06/lisboa-ajusta-niveis-de-contencao-do-alojamento-local-apos-limpeza-de-registos/' },
  },

  // ─── Italie ───────────────────────────────────────────────────────────
  {
    ville: 'Firenze', pays: 'IT', niveau: 'bloquant',
    resume: "Nouvelles locations touristiques interdites dans le centre UNESCO et, jusqu'en 2028, dans les quartiers voisins.",
    points: [
      "Centre historique UNESCO : plus de nouvelle location courte durée.",
      "Blocage étendu en 2026 à des zones voisines (504 rues) jusqu'en 2028, confirmé par le tribunal administratif.",
    ],
    source: { label: 'Comune di Firenze', url: 'https://www.comune.firenze.it/novita/area-stampa/comunicati-stampa/affitti-turistici-brevi-inserita-nel-piano-operativo-la-norma' },
  },

  // ─── Pays-Bas, Allemagne, Autriche ────────────────────────────────────
  {
    ville: 'Amsterdam', pays: 'NL', niveau: 'bloquant', plafondRP: 30,
    resume: "Location touristique réservée à la résidence principale, 30 nuits par an (15 dans huit quartiers du centre) : pas de modèle investisseur.",
    points: [
      "Uniquement sa résidence principale, avec permis et numéro d'enregistrement.",
      "30 nuits par an, 15 dans huit quartiers du centre depuis avril 2026, 4 personnes maximum.",
    ],
    source: { label: 'City of Amsterdam', url: 'https://www.amsterdam.nl/en/housing/holiday-rentals/applying-permit/' },
  },
  {
    ville: 'Berlin', pays: 'DE', niveau: 'restrictif',
    resume: "Autorisation du district obligatoire ; une résidence secondaire est limitée à 90 jours par an.",
    points: ["Autorisation préalable du district (interdiction de détournement du logement).", "Résidence secondaire : 90 jours par an maximum."],
    source: { label: 'Berlin.de', url: 'https://www.berlin.de/sen/wohnen/rechtliches/zweckentfremdungsverbot/' },
  },
  {
    ville: 'Wien', pays: 'AT', niveau: 'restrictif', plafondRP: 90,
    resume: "90 jours par an maximum hors zones résidentielles, interdit dans les zones résidentielles.",
    points: ["90 jours par an sans changement d'affectation, au-delà une dérogation est nécessaire.", "Interdit dans les « Wohnzonen »."],
    source: { label: 'Stadt Wien', url: 'https://www.wien.gv.at/wohnen/ausnahmebewilligung-kurzzeitvermietung' },
  },
]

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const INDEX = new Map(R.map(r => [`${r.pays}:${norm(r.ville)}`, r]))

export function findRegulation(ville: string | null | undefined, pays: string): CityRegulation | null {
  if (!ville) return null
  return INDEX.get(`${pays}:${norm(ville)}`) ?? null
}

/** Règle générale du pays quand aucune règle locale n'est confirmée. */
export const COUNTRY_NOTES: Record<string, string> = {
  FR: "Résidence principale : 120 nuits par an maximum (la commune peut abaisser à 90). Numéro d'enregistrement obligatoire depuis mai 2026, et toute commune peut exiger un changement d'usage pour un logement d'investissement : vérifie auprès de la mairie avant d'acheter.",
  PT: "Registre Alojamento Local obligatoire, et chaque câmara peut créer des zones de contention où les nouveaux registres sont suspendus : vérifie auprès de la mairie avant d'acheter.",
  ES: "Règles régionales et municipales, et de nombreuses villes gèlent les nouvelles licences : vérifie la situation de la commune avant d'acheter.",
  IT: "Code d'identification national (CIN) obligatoire, et plusieurs villes restreignent les nouvelles locations dans leur centre : vérifie auprès de la commune.",
  DE: "Beaucoup de grandes villes exigent une autorisation (interdiction de détournement du logement) : vérifie auprès de la ville.",
  NL: "Permis, enregistrement et plafond de nuits fixés par chaque commune : vérifie auprès de la commune.",
  AT: "Règles fixées par chaque Land et chaque ville : vérifie auprès de la commune.",
  BE: "Règles régionales (Bruxelles, Flandre, Wallonie) et autorisations communales : vérifie auprès de la commune.",
  CH: "Règles cantonales et communales, parfois restrictives dans les grandes villes : vérifie auprès de la commune.",
}
