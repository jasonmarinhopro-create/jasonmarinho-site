// Illustration d'une étape de leçon (24/11/2026, Jason : « remettre de la vie,
// des illustrations »). Un thème par mots-clés du titre de l'étape (puis de
// la leçon), affiché par FormationView avec une icône et un motif aux
// couleurs de l'objectif. Calcul pur (test à côté).

export type Theme =
  | 'prix' | 'calendrier' | 'photo' | 'google' | 'avis' | 'message' | 'contrat' | 'loi'
  | 'fiscal' | 'securite' | 'maison' | 'menage' | 'reseaux' | 'stats' | 'outil' | 'cle'
  | 'equipe' | 'idee' | 'alerte' | 'exercice' | 'cible' | 'livre' | 'carte' | 'argent'

const RULES: Array<[Theme, RegExp]> = [
  ['exercice', /\b(exercice|a toi de jouer|mise en pratique|plan d.action)\b/],
  ['alerte', /\b(erreur|piege|danger|eviter|incident|litige|degat|plainte|probleme|risque|arnaque|fraude)/],
  ['fiscal', /\b(fiscal|impot|lmnp|lmp|micro|bic|tva|urssaf|cfe|declar|liasse|amortis|regime|plus-value|comptab|siret|statut)/],
  ['loi', /\b(loi|regle|legal|juridique|mairie|enregistrement|autorisation|reglement|conformite|cnil|rgpd|obligation)/],
  ['contrat', /\b(contrat|caution|signature|etat des lieux|edl|clause|cgv|conditions)/],
  ['prix', /\b(prix|tarif|remise|promo|revenu moyen|adr|revpar|tarification|nuit[ée]e?s?)\b/],
  ['argent', /\b(argent|rentab|chiffre d.affaires|benefice|marge|cout|depense|budget|economie|commission|frais|paiement|encaiss)/],
  ['calendrier', /\b(calendrier|saison|planning|date|semaine|mois|delai|minimum de nuits|sejour minimum|disponibilit)/],
  ['photo', /\b(photo|lumiere|cadrage|angle|smartphone|retouche|couverture|image|staging)/],
  ['google', /\b(google|gbp|fiche|seo|referencement|recherche|maps)/],
  ['avis', /\b(avis|note|etoile|commentaire|review|reputation|superhote|genius)/],
  ['message', /\b(message|repondre|communication|voyageur|accueil|bienvenue|livret|check-?in|arrivee)/],
  ['reseaux', /\b(instagram|facebook|reseau|post|reel|abonne|contenu|tiktok|groupe)/],
  ['securite', /\b(securi|verif|identite|protection|assurance|aircover|serrure|fete)/],
  ['menage', /\b(menage|linge|nettoy|proprete|entretien)/],
  ['maison', /\b(logement|deco|amenag|meubl|piece|chambre|cuisine|salle de bain|equipement)/],
  ['stats', /\b(statistique|algorithme|classement|visibilite|taux|occupation|performance|mesur|indicateur|test a\/b|ab test)/],
  ['outil', /\b(outil|automat|logiciel|channel manager|pricelabs|serrure connectee|application|app|site web|site)/],
  ['equipe', /\b(conciergerie|equipe|client|proprietaire|prestataire|recrut|associe)/],
  ['carte', /\b(ville|quartier|zone|region|local|destination|tourisme)/],
  ['cible', /\b(objectif|cible|strategie|plan|methode|positionnement)/],
  ['idee', /\b(astuce|conseil|idee|secret|bonne pratique)/],
  ['livre', /\b(definition|vocabulaire|comprendre|pourquoi|bases|introduction|en bref)/],
]

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Thème d'une étape : titre de l'étape d'abord, sinon titre de la leçon. */
export function stepTheme(stepTitle: string | null, lessonTitle: string): Theme {
  for (const t of [stepTitle, lessonTitle]) {
    if (!t) continue
    const n = norm(t)
    for (const [theme, re] of RULES) if (re.test(n)) return theme
  }
  return 'livre'
}
