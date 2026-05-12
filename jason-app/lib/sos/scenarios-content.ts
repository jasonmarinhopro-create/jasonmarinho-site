// Types et données structurées des scénarios SOS Hôte.
// Le contenu est typé pour garantir la cohérence entre rendu et données.
// Multi-canal : Airbnb, Booking, Vrbo, Direct.

export type Channel = 'airbnb' | 'booking' | 'vrbo' | 'direct'

export interface DelayBox {
  /** 'urgent' = bandeau rouge, 'soft' = bandeau ambre */
  type: 'urgent' | 'soft'
  label: string
  body: string
}

export interface Step {
  /** Titre court de l'étape, ex: "NE NETTOIE RIEN avant d'avoir tout photographié" */
  title: string
  /** Détail de l'étape, peut contenir des passages mis en gras via **texte** */
  body: string
}

export interface Template {
  label: string
  subject?: string
  body: string
}

export interface ScenarioContent {
  reassurance: string
  delayBox: DelayBox
  steps: Step[]
  templates: Template[]
  doNotDo: string[]
  recourses: string[]
  prevention: string[]
  /** Date ISO YYYY-MM-DD de la dernière vérification éditoriale du contenu. */
  lastVerified?: string
}

/** Calcul du statut de fraîcheur à partir de lastVerified. */
export function getVerificationStatus(lastVerified?: string): {
  date: Date | null
  daysSince: number | null
  isStale: boolean
  label: string
} {
  if (!lastVerified) {
    return { date: null, daysSince: null, isStale: false, label: '' }
  }
  const date = new Date(lastVerified + 'T00:00:00Z')
  const daysSince = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  return {
    date,
    daysSince,
    isStale: daysSince > 90,
    label: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
  }
}

// Indexation : scenarios[slug][channel] = ScenarioContent
// Si une combinaison n'existe pas → page affiche le placeholder.
export const SCENARIOS_CONTENT: Record<string, Partial<Record<Channel, ScenarioContent>>> = {

  // ─── SCÉNARIO 1 : Mon voyageur a dégradé mon logement ──────────────────

  'degradation-logement': {

    // ── Airbnb ────────────────────────────────────────────────────────────
    airbnb: {
      reassurance: "Respire. Tu vas y arriver. Ce qui suit fonctionne, à condition de bouger vite et de suivre l'ordre. Pas d'improvisation, pas d'émotion : juste des actions documentées.",
      delayBox: {
        type: 'urgent',
        label: 'Délai critique · AirCover',
        body: 'Tu as 14 jours maximum après le départ du voyageur pour ouvrir une demande via AirCover. Mais agis dans les 24-48 h pour maximiser tes chances : Airbnb favorise les dossiers réactifs et bien documentés.',
      },
      steps: [
        {
          title: 'NE NETTOIE RIEN avant d\'avoir tout photographié',
          body: 'Photos horodatées de chaque dégât, sous plusieurs angles, avec un objet de référence pour l\'échelle quand c\'est possible (pièce de monnaie, règle). Une bonne photo vaut mille mots devant un agent Airbnb qui n\'a pas vu ton logement.',
        },
        {
          title: 'Rassemble les preuves financières',
          body: 'Factures d\'achat des objets endommagés (ou recherche en ligne du modèle + prix actuel si tu n\'as plus la facture), devis officiel de réparation/remplacement d\'une entreprise avec **SIRET et TVA**. Pas un prix au pif, pas un devis WhatsApp d\'un copain.',
        },
        {
          title: 'Contacte le voyageur EN PREMIER, via la messagerie Airbnb uniquement',
          body: 'Pas par téléphone, pas par SMS. Il faut une **trace écrite sur Airbnb**. Reste factuel, sans insulte ni menace. Tu cherches un règlement à l\'amiable avant d\'escalader.',
        },
        {
          title: 'Ouvre le Centre de résolution sous 24-72 h',
          body: 'Si pas de réponse ou refus du voyageur : Centre de résolution Airbnb → onglet **Demander de l\'argent** → sélectionne **Demander un remboursement pour des dommages**. Joins toutes tes preuves (photos, factures, devis, échanges).',
        },
        {
          title: 'Demande à Airbnb d\'intervenir si le voyageur ne répond pas sous 72 h',
          body: 'Bouton **Demander à Airbnb d\'intervenir** dans le Centre de résolution. À ce stade, l\'équipe AirCover prend le relais et tranche sur base de tes preuves.',
        },
        {
          title: 'Suivi du dossier',
          body: 'Airbnb tranche sous quelques jours. L\'indemnisation passe par la garantie Dommages d\'AirCover (plafond global élevé, mais évaluation au cas par cas). Tu reçois la décision dans ta messagerie Airbnb.',
        },
      ],
      templates: [
        {
          label: 'Premier message au voyageur (à l\'amiable)',
          body: `Bonjour [Prénom],

J'ai constaté à votre départ les dégâts suivants dans le logement :
[liste précise des éléments endommagés]

Je vous joins les photos prises à votre départ.

Le coût total de réparation/remplacement s'élève à [montant] € (devis ci-joint).

Je vous propose de régler ce montant via le Centre de résolution Airbnb sous 24 h pour clôturer la situation à l'amiable.

Cordialement,
[Prénom]`,
        },
        {
          label: 'Demande d\'intervention Airbnb (si le voyageur refuse)',
          body: `Bonjour,

Le voyageur [Prénom] n'a pas répondu à ma demande amiable sous 72 h concernant des dégâts constatés dans mon logement après son séjour (réservation HM[numéro]).

Je sollicite l'intervention d'AirCover. Je joins :
- Photos horodatées des dégâts
- Devis de réparation/remplacement (montant : [X] €)
- Factures d'achat des objets endommagés
- L'échange complet avec le voyageur

Merci pour votre prise en charge.

Cordialement,
[Prénom]`,
        },
      ],
      doNotDo: [
        'Nettoyer ou jeter quoi que ce soit avant d\'avoir tout photographié',
        'Régler par message hors Airbnb (Venmo, PayPal direct, virement) : tu perds la garantie AirCover',
        'Insulter, menacer ou employer un ton émotionnel : ça décrédibilise ta demande',
        'Laisser passer les 14 jours sans agir',
        'Accepter une compensation partielle "à l\'amiable" si elle est très inférieure au préjudice : tu fermes la porte à AirCover',
      ],
      recourses: [
        'Recours interne Airbnb si refus : tu peux demander une nouvelle revue par un autre agent dans les 60 jours',
        'Signalement à ton assurance habitation (extension villégiature ou multirisque saisonnière)',
        'Médiation de la consommation européenne (ODR) si Airbnb maintient son refus',
        'Action en justice : tribunal judiciaire si le préjudice dépasse 5 000 €',
      ],
      prevention: [
        'Active la caution dommages Airbnb sur ton annonce',
        'État des lieux photo systématique avant chaque arrivée (sauvegarde-le dans le drawer du séjour)',
        'Règlement intérieur signé numériquement avant le check-in',
        'Demande au voyageur de signaler tout dégât préexistant dans les 2 h après son arrivée',
      ],
      lastVerified: '2026-05-12',
    },

    // ── Booking.com ───────────────────────────────────────────────────────
    booking: {
      reassurance: "Booking ne propose pas d'AirCover. C'est ton contrat, ta caution et ton assurance qui te protègent. Le pas-à-pas est plus court côté Booking, mais les leviers existent.",
      delayBox: {
        type: 'soft',
        label: 'Délai recommandé',
        body: 'Agis dans les 24-72 h. Pas de délai officiel Booking comme AirCover, mais plus tu attends, plus c\'est dur de prouver la causalité avec ce séjour précis.',
      },
      steps: [
        {
          title: 'Photographie tout, immédiatement',
          body: 'Mêmes règles que pour Airbnb : photos horodatées, angles multiples, objet de référence pour l\'échelle. Avant tout nettoyage.',
        },
        {
          title: 'Encaisse la caution (si tu en as une)',
          body: 'Si tu as bloqué une caution Stripe ou pris un chèque de caution, tu as le droit de la prélever pour couvrir les dégâts constatés. Documente le motif par écrit.',
        },
        {
          title: 'Contacte le voyageur via Booking',
          body: 'Messagerie Booking uniquement, pour garder une trace. Liste les dégâts, joins les photos, demande un règlement amiable du complément si la caution est insuffisante.',
        },
        {
          title: 'Ouvre un ticket dans l\'extranet Booking',
          body: 'Extranet → **Boîte de réception** → **Demandes spéciales** → sélectionne **Réclamation voyageur**. Booking n\'a pas de garantie type AirCover mais peut faire de la médiation et bloquer le compte du voyageur si grave.',
        },
        {
          title: 'Active ton assurance PNO ou MRH',
          body: 'Ton assurance Propriétaire Non Occupant ou Multirisque Habitation avec extension location saisonnière peut couvrir les dégâts au-delà de la caution. Déclare le sinistre dans les 5 jours.',
        },
        {
          title: 'Recommandé avec AR au voyageur si refus',
          body: 'Si le voyageur refuse de régler le complément, envoie un courrier recommandé avec AR listant les dégâts et le montant, en demandant un règlement sous 15 jours. C\'est le préalable obligatoire avant toute action judiciaire.',
        },
      ],
      templates: [
        {
          label: 'Message au voyageur via Booking',
          body: `Bonjour [Prénom],

À votre départ, j'ai constaté les dégâts suivants dans le logement :
[liste précise]

Les photos sont en pièce jointe.

Le coût total de réparation/remplacement s'élève à [montant] €. J'ai prélevé la caution de [Y] €. Le complément à régler est de [X-Y] €.

Merci de régler ce complément sous 7 jours via virement (RIB ci-joint). Sans réponse, je serai contraint d'engager les recours juridiques nécessaires.

Cordialement,
[Prénom]`,
        },
        {
          label: 'Modèle de courrier recommandé AR',
          body: `[Tes coordonnées complètes]
[Coordonnées du voyageur]

Objet : Demande de règlement amiable pour dommages locatifs
Lettre recommandée avec accusé de réception

Madame, Monsieur [Nom],

Suite à votre séjour du [date] au [date] dans le logement situé [adresse], j'ai constaté les dégradations suivantes :
[liste précise]

Photos et devis de réparation à l'appui (joints à la présente), le coût total de remise en état s'élève à [montant] €.

La caution de [Y] € a été prélevée. Je vous demande de régler le complément de [X-Y] € sous 15 jours à compter de la réception de cette lettre.

À défaut de règlement dans ce délai, je me réserve le droit de saisir les juridictions compétentes (conciliateur de justice pour les litiges inférieurs à 5 000 €, tribunal judiciaire au-delà).

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

[Prénom Nom]
[Date]
[Signature]`,
        },
      ],
      doNotDo: [
        'Encaisser la caution sans avoir documenté les dégâts par écrit et photos',
        'Régler tout par téléphone : il faut des traces écrites',
        'Menacer ou insulter le voyageur dans tes messages : ça peut se retourner contre toi en justice',
        'Oublier la déclaration à ton assurance dans les 5 jours',
      ],
      recourses: [
        'Conciliateur de justice (gratuit, démarche obligatoire pour litiges < 5 000 €)',
        'Tribunal judiciaire du lieu du logement pour litiges plus importants',
        'Assurance PNO ou MRH avec extension location saisonnière',
        'Signalement Booking pour bloquer le compte du voyageur en cas de récidive',
      ],
      prevention: [
        'Contrat de location saisonnière écrit, obligatoire (article L324-2 du Code du tourisme)',
        'État des lieux photo d\'entrée et de sortie, idéalement contradictoire',
        'Caution suffisante (15-30 % du séjour minimum) en virement bloqué ou empreinte Stripe',
        'Assurance PNO ou MRH avec extension saisonnière vérifiée',
      ],
      lastVerified: '2026-05-12',
    },

    // ── Vrbo / Abritel ────────────────────────────────────────────────────
    vrbo: {
      reassurance: "Vrbo propose une assurance hôte (CarePlus / Liability Insurance) avec des plafonds plus modestes qu'AirCover. Documente comme pour Airbnb, le process est similaire.",
      delayBox: {
        type: 'urgent',
        label: 'Délai critique · Vrbo',
        body: 'Tu as 14 jours après la fin du séjour pour soumettre une réclamation de dommages via le centre d\'aide Vrbo. Plus tu agis vite, mieux c\'est.',
      },
      steps: [
        {
          title: 'Photographie sans nettoyer',
          body: 'Mêmes règles : horodaté, multi-angles, objet de référence pour l\'échelle.',
        },
        {
          title: 'Devis et factures à jour',
          body: 'Devis officiel avec SIRET, factures d\'achat ou prix de remplacement neuf documentés.',
        },
        {
          title: 'Contacte le voyageur via Vrbo',
          body: 'Messagerie Vrbo. Liste factuelle des dégâts, photos, montant total. Demande un règlement amiable sous 48 h.',
        },
        {
          title: 'Soumets une réclamation de dommages',
          body: 'Centre d\'aide Vrbo → **Mes séjours** → sélectionne la réservation → **Demander un remboursement pour dommages**. Joins toutes les preuves.',
        },
        {
          title: 'Active la couverture Vrbo si le voyageur ne paie pas',
          body: 'Si tu es éligible à la **Vrbo Liability Insurance** ou similaire (selon ton pays/abonnement), elle peut couvrir une partie des dommages au-delà de la caution.',
        },
        {
          title: 'Recours assurance PNO si plafonds dépassés',
          body: 'Comme pour Booking, ton assurance propriétaire avec extension villégiature peut prendre le relais pour les gros sinistres.',
        },
      ],
      templates: [
        {
          label: 'Message au voyageur via Vrbo',
          body: `Bonjour [Prénom],

À votre départ, j'ai constaté les dégâts suivants dans le logement :
[liste précise]

Photos jointes.

Le coût total de réparation/remplacement s'élève à [montant] € (devis joint).

Je vous propose de régler ce montant sous 48 h pour clôturer à l'amiable. À défaut, je soumettrai une réclamation de dommages auprès de Vrbo.

Cordialement,
[Prénom]`,
        },
      ],
      doNotDo: [
        'Nettoyer avant les photos',
        'Régler hors plateforme : tu perds la couverture Vrbo Liability',
        'Attendre plus de 14 jours pour ouvrir le dossier',
      ],
      recourses: [
        'Vrbo Liability Insurance (selon éligibilité et pays)',
        'Assurance PNO / MRH avec extension saisonnière',
        'Conciliateur de justice pour les litiges sous 5 000 €',
        'Tribunal judiciaire pour les montants importants',
      ],
      prevention: [
        'Active la caution dommages Vrbo (Damage Deposit)',
        'État des lieux photo systématique',
        'Règlement intérieur signé numériquement',
      ],
      lastVerified: '2026-05-12',
    },

    // ── Direct (location directe sans plateforme) ─────────────────────────
    direct: {
      reassurance: "En direct, c'est le **Code civil** qui pilote (articles 1708 et suivants, louage de choses). Pas de plateforme entre toi et le voyageur, mais pas non plus de plateforme qui prend ta marge. Les leviers existent, ils sont juste plus à toi de les actionner.",
      delayBox: {
        type: 'soft',
        label: 'Délai recommandé',
        body: 'Agis dans les 24-72 h. Le Code civil ne fixe pas de délai impératif côté hôte, mais plus tu attends, plus la causalité avec ce séjour précis devient difficile à prouver.',
      },
      steps: [
        {
          title: 'Photographie tout, immédiatement',
          body: 'Horodaté, multi-angles, objet de référence. **Ces photos sont ta preuve principale en cas de litige.**',
        },
        {
          title: 'Vérifie ton contrat et l\'état des lieux d\'entrée',
          body: 'Le contrat de location saisonnière est **obligatoire** (article L324-2 du Code du tourisme). S\'il y a un état des lieux d\'entrée écrit/photo, parfait. **Sans état des lieux écrit**, les principes d\'analogie avec l\'article 1731 du Code civil te restent favorables : c\'est au locataire de prouver qu\'il a reçu le bien dégradé, pas à toi de prouver qu\'il l\'a reçu en bon état.',
        },
        {
          title: 'Encaisse la caution immédiatement',
          body: 'Tu as le droit d\'encaisser le chèque, de déclencher le prélèvement Stripe, ou de capturer l\'empreinte bancaire. Documente le motif par écrit (email + justificatifs).',
        },
        {
          title: 'Envoie un message factuel au voyageur',
          body: 'Email avec photos, devis, et le décompte : caution prélevée, complément demandé. Propose un règlement amiable sous 15 jours.',
        },
        {
          title: 'Recommandé avec AR si refus',
          body: 'Lettre recommandée avec AR listant les dégâts, le montant, le délai (15 jours). Mentionne explicitement les recours envisagés en cas de non-paiement. Garde une copie + l\'accusé de réception.',
        },
        {
          title: 'Active ton assurance PNO ou MRH',
          body: 'Déclare le sinistre dans les 5 jours suivant le constat. Extension villégiature ou multirisque saisonnière obligatoire pour la LCD.',
        },
        {
          title: 'Conciliateur de justice si toujours pas de règlement',
          body: 'Saisine **gratuite et obligatoire** pour les litiges inférieurs à 5 000 €. Démarche en ligne sur conciliateurs.fr. Sans conciliation préalable, le tribunal refusera ton dossier.',
        },
        {
          title: 'Tribunal judiciaire au-delà',
          body: 'Pour les litiges supérieurs à 5 000 € ou si la conciliation échoue. Avocat conseillé mais pas obligatoire en première instance.',
        },
      ],
      templates: [
        {
          label: 'Email au voyageur (1er contact)',
          body: `Bonjour [Prénom],

Suite à votre séjour du [date] au [date], j'ai constaté les dégâts suivants dans le logement :
[liste précise]

Photos prises à votre départ en pièce jointe.

Le coût total de remise en état s'élève à [montant] € (devis joint).

J'ai prélevé la caution de [Y] € à ce titre. Le complément à régler est de [X-Y] €.

Merci de régler ce montant sous 15 jours par virement (RIB ci-joint), pour une résolution amiable.

À défaut, je serai contraint d'engager les recours nécessaires (conciliateur de justice, tribunal).

Cordialement,
[Prénom Nom]
[Téléphone]`,
        },
        {
          label: 'Modèle de courrier recommandé AR',
          body: `[Tes coordonnées complètes]
[Coordonnées du voyageur]

Objet : Mise en demeure de régler les dégradations locatives
Lettre recommandée avec accusé de réception
[Ville], le [date]

Madame, Monsieur [Nom],

Vous avez séjourné du [date] au [date] dans le logement meublé de tourisme situé [adresse], dans le cadre du contrat de location saisonnière signé le [date].

À votre départ, j'ai constaté les dégradations suivantes :
[liste précise]

Les photos prises à votre départ et le devis de remise en état (joints à la présente) établissent un coût total de [montant] €.

La caution de [Y] € a été prélevée. Le complément à régler s'élève à [X-Y] €.

Je vous mets formellement en demeure de régler cette somme sous 15 jours à compter de la réception de la présente, par virement sur le compte dont les coordonnées figurent ci-dessous.

À défaut de règlement dans ce délai, je saisirai le conciliateur de justice (litiges < 5 000 €) ou le tribunal judiciaire compétent (au-delà), avec demande de remboursement des frais de procédure.

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

[Prénom Nom]
RIB : [IBAN]
[Signature manuscrite]`,
        },
      ],
      doNotDo: [
        'Ne pas avoir de contrat écrit (obligatoire art. L324-2 Code du tourisme, t\'expose à une amende administrative)',
        'Encaisser la caution sans documenter par écrit le motif',
        'Insulter ou menacer le voyageur dans tes messages : ça peut se retourner contre toi',
        'Sauter l\'étape conciliateur pour aller direct au tribunal : ton dossier sera irrecevable',
      ],
      recourses: [
        'Conciliateur de justice (gratuit, obligatoire pour litiges < 5 000 €)',
        'Tribunal judiciaire pour les montants importants',
        'Médiateur du tourisme et du voyage (MTV) — vérifier sa compétence selon ton statut',
        'Assurance PNO ou MRH avec extension saisonnière',
      ],
      prevention: [
        'Contrat de location saisonnière écrit systématique (obligatoire)',
        'État des lieux d\'entrée ET de sortie, photo + écrit, idéalement contradictoire',
        'Caution suffisante (15-30 % du séjour minimum) sécurisée par empreinte Stripe ou virement bloqué',
        'Règlement intérieur signé numériquement avec mention des sanctions en cas de dégradation',
        'Assurance PNO / MRH avec extension saisonnière vérifiée chaque année',
        'Pour passer en réservation directe sereinement : la plateforme Driing automatise contrat + caution + signature',
      ],
      lastVerified: '2026-05-12',
    },

  },

  // ─── SCÉNARIO 2 : J'ai reçu un avis négatif injuste ────────────────────

  'avis-injuste': {

    // ── Airbnb ────────────────────────────────────────────────────────────
    airbnb: {
      reassurance: "Un avis injuste, ça pique. Mais c'est rarement la fin du monde. Airbnb ne supprime PAS un avis 'juste parce qu'il est sévère' — il faut identifier la violation précise de la politique de contenu. C'est cette précision qui fait gagner le dossier.",
      delayBox: {
        type: 'soft',
        label: 'Délai · Airbnb examine sous 24-72 h',
        body: 'Agis dans les 7 jours suivant la publication. Plus tard, Airbnb peut considérer que tu as accepté l\'avis. Et prépare ta réponse publique en parallèle : elle sera visible quoi qu\'il arrive.',
      },
      steps: [
        {
          title: 'Identifie le motif PRÉCIS parmi les 5 valides',
          body: 'Airbnb supprime uniquement si l\'avis viole sa politique : **(1) Contenu interdit** (insultes, propos haineux, diffamation, menaces), **(2) Hors-sujet** (politique, religion, quartier, séjour passé, pas le logement réel), **(3) Informations confidentielles divulguées** (adresse complète, nom de famille, téléphone), **(4) Avis de rétorsion** (le voyageur menace de mauvais avis pour obtenir compensation, ou avis publié après que tu lui aies demandé de payer des dégâts), **(5) Avis biaisé** (auteur n\'a pas séjourné, concurrent, employé). Sans motif = pas de suppression.',
        },
        {
          title: 'Rassemble les preuves',
          body: 'Captures d\'écran horodatées de l\'avis, de tous les messages échangés sur la plateforme, de tout élément qui prouve le motif (ex: la menace explicite si rétorsion).',
        },
        {
          title: 'Signale l\'avis',
          body: 'Depuis ton profil hôte → ouvre l\'avis → bouton **Signaler** → sélectionne le motif → joins les preuves → envoie.',
        },
        {
          title: 'Prépare TA réponse publique en parallèle',
          body: 'Ta réponse sera visible que l\'avis soit supprimé ou non. Elle doit être **courte (3-5 lignes max), factuelle, professionnelle, sans agressivité ni majuscules ni sarcasme**. Un futur voyageur lira ta réponse autant que l\'avis.',
        },
        {
          title: 'Attends 24-72 h la décision Airbnb',
          body: 'Si l\'agent refuse mais que tu es certain du motif, tu peux demander une **nouvelle revue par un autre agent**. Argumente précisément, cite la politique. Persévère poliment.',
        },
        {
          title: 'Si l\'avis reste, noie-le',
          body: 'Ta réponse publique devient ta meilleure arme. Et collecte activement **5-10 nouveaux avis positifs rapidement** : ton score remonte, l\'avis problématique descend dans la liste, son impact baisse.',
        },
      ],
      templates: [
        {
          label: 'Signalement Airbnb · avis hors-sujet',
          body: `Bonjour,

Je signale l'avis du voyageur [Prénom] pour motif **Hors-sujet** selon votre politique de contenu.

L'avis ne concerne pas l'hébergement ni l'expérience de séjour, mais [précise : sujet politique / religieux / quartier / autre séjour / etc.].

Captures d'écran jointes.

Merci de bien vouloir procéder à sa suppression.

Cordialement,
[Prénom]`,
        },
        {
          label: 'Signalement Airbnb · avis de rétorsion',
          body: `Bonjour,

Je signale l'avis du voyageur [Prénom] pour motif **Avis de rétorsion**.

Contexte : le voyageur a explicitement menacé de laisser un mauvais avis [si je ne lui rembourse pas X / si je signale ses dégâts / autre]. Les échanges sont en pièce jointe (captures horodatées).

Cet avis a été publié [date] après mon refus de céder à sa demande.

Merci d'examiner mon dossier et de procéder à la suppression de l'avis.

Cordialement,
[Prénom]`,
        },
        {
          label: 'Ta réponse publique · avis injuste qui ne sera pas supprimé',
          body: `Bonjour [Prénom],

Merci pour votre retour. Nous regrettons que votre séjour n'ait pas répondu à vos attentes.

Nous tenons à préciser que [un élément factuel qui contredit l'avis, en une phrase neutre — ex : "le logement avait été nettoyé en profondeur la veille de votre arrivée et photographié pour preuve"].

Nous restons à l'écoute pour améliorer en permanence l'expérience de nos voyageurs.

— [Ton prénom]`,
        },
      ],
      doNotDo: [
        'Répondre publiquement de manière agressive ou émotionnelle (ça décrédibilise plus que l\'avis lui-même)',
        'Demander la suppression "parce que c\'est injuste" sans citer le motif précis de la politique',
        'Proposer une compensation au voyageur en échange d\'une modification (interdit par Airbnb, t\'expose à une suspension)',
        'Utiliser des MAJUSCULES, des points d\'exclamation, du sarcasme dans ta réponse publique',
        'Laisser passer les 7 jours sans signaler',
      ],
      recourses: [
        'Demander une nouvelle revue par un autre agent Airbnb si le premier refuse (insiste poliment avec arguments)',
        'Twitter / X @AirbnbHelp est souvent plus rapide que le téléphone pour escalader un cas bloqué',
        'Médiation interne via customer.protection@airbnb.com pour les cas complexes',
        'Stratégie "noyer l\'avis" : 5-10 nouveaux avis positifs rapidement, l\'algorithme fait son travail',
      ],
      prevention: [
        'Avant chaque check-out, demande au voyageur s\'il a passé un bon séjour et s\'il y a quoi que ce soit à signaler — traite les problèmes AVANT le départ',
        'Optimise le timing de demande d\'avis (message automatique le jour du départ, pas 3 jours après)',
        'Réponds à TOUS les avis, même les bons (signal d\'hôte engagé)',
        'Garde un dossier d\'éléments factuels (photos d\'entretien, état des lieux) prêts à dégainer en cas de litige',
      ],
      lastVerified: '2026-05-12',
    },

    // ── Booking.com ───────────────────────────────────────────────────────
    booking: {
      reassurance: "Booking applique sa propre politique de contenu. C'est moins strict qu'Airbnb mais les leviers existent : signalement via l'extranet partenaire, et surtout une réponse publique soignée. Sur Booking, la note moyenne pèse moins que la qualité des derniers avis affichés en haut.",
      delayBox: {
        type: 'soft',
        label: 'Délai · pas de plafond officiel',
        body: 'Agis dans les 7 à 14 jours. Booking n\'a pas de délai impératif mais examine plus rapidement les dossiers récents.',
      },
      steps: [
        {
          title: 'Identifie un motif de violation',
          body: 'Booking supprime si l\'avis contient : **propos diffamatoires ou haineux, informations personnelles divulguées, mentions commerciales (publicité concurrente), avis frauduleux** (auteur fictif ou n\'ayant pas séjourné), **contenu obscène**. C\'est plus restrictif qu\'Airbnb.',
        },
        {
          title: 'Rassemble les preuves',
          body: 'Captures d\'écran horodatées, échanges messagerie, tout élément qui démontre la violation.',
        },
        {
          title: 'Signale via l\'extranet Booking',
          body: 'Extranet Booking → **Boîte de réception** → **Demandes spéciales** → **Contester un avis**. Choisis le motif, joins les preuves.',
        },
        {
          title: 'Publie ta réponse publique en parallèle',
          body: 'Depuis l\'extranet → **Avis voyageurs** → réponds à l\'avis problématique. Sur Booking, la réponse hôte est très lue car affichée juste sous l\'avis.',
        },
        {
          title: 'Demande une revue manager si refus',
          body: 'Si Booking refuse, demande explicitement une **revue par un manager** ou contacte ton **Account Manager** si tu en as un (téléphone partenaire : 0805 088 074 selon ton pays).',
        },
        {
          title: 'Stratégie nouveaux avis',
          body: 'Comme sur Airbnb : collecte rapidement de nouveaux avis positifs. Sur Booking, l\'algorithme affiche prioritairement les 6 derniers avis, l\'avis problématique sort vite si tu tournes bien.',
        },
      ],
      templates: [
        {
          label: 'Signalement Booking · avis diffamatoire',
          body: `Bonjour,

Je conteste l'avis du voyageur [Prénom] pour le motif **Propos diffamatoires** au regard de votre politique de contenu.

L'avis contient : [cite le passage précis qui pose problème].

Capture d'écran horodatée jointe.

Merci de procéder à son examen et à sa suppression si la violation est confirmée.

Cordialement,
[Prénom Nom]
Identifiant partenaire : [numéro]`,
        },
        {
          label: 'Ta réponse publique sur Booking',
          body: `Cher(e) [Prénom],

Merci d'avoir pris le temps de partager votre expérience. Nous regrettons que votre séjour n'ait pas répondu à vos attentes.

Nous tenons à préciser que [élément factuel qui contredit l'avis, en une phrase courte et neutre].

Nous restons à l'écoute pour continuer à améliorer l'accueil de nos voyageurs.

Cordialement,
[Prénom]`,
        },
      ],
      doNotDo: [
        'Répondre publiquement avec agressivité, sarcasme, majuscules',
        'Contacter directement le voyageur hors plateforme pour le pousser à modifier (interdit)',
        'Demander la suppression sans motif précis de violation',
        'Multiplier les tickets sur le même sujet (Booking ferme le dossier comme "non recevable" si harcèlement)',
      ],
      recourses: [
        'Account Manager Booking si tu en as un (canal prioritaire)',
        'Téléphone partenaire Booking pour escalade : 0805 088 074',
        'Médiateur du tourisme et du voyage (MTV) — vérifier si Booking est adhérent',
        'Stratégie volume : collecter rapidement de nouveaux avis positifs',
      ],
      prevention: [
        'Demande explicitement un retour au voyageur au check-out (anticipation des problèmes)',
        'Réponds à TOUS les avis sur ta fiche, signal d\'hôte engagé',
        'Maintiens une note > 8/10 : sur Booking, c\'est le seuil psychologique des voyageurs',
        'Soigne la communication AVANT séjour (instructions claires, attentes alignées)',
      ],
      lastVerified: '2026-05-12',
    },

    // ── Vrbo / Abritel ────────────────────────────────────────────────────
    vrbo: {
      reassurance: "La politique d'avis Vrbo est proche d'Airbnb : suppression si violation précise (contenu interdit, hors-sujet, infos confidentielles, biais manifeste). Identique sur le fond, processus très similaire.",
      delayBox: {
        type: 'soft',
        label: 'Délai · agis sous 7 jours',
        body: 'Vrbo examine plus rapidement les avis récents. Ne traîne pas, même si le délai n\'est pas strictement impératif.',
      },
      steps: [
        {
          title: 'Identifie le motif de violation Vrbo',
          body: 'Catégories similaires à Airbnb : **propos haineux/insultants, hors-sujet, infos personnelles divulguées, fausses informations, avis biaisé ou frauduleux**.',
        },
        {
          title: 'Rassemble les preuves',
          body: 'Captures d\'écran horodatées de l\'avis et des échanges sur la plateforme.',
        },
        {
          title: 'Signale l\'avis depuis ton compte propriétaire',
          body: 'Tableau de bord Vrbo → **Avis** → ouvre l\'avis → bouton **Signaler ce commentaire**. Précise le motif, joins les preuves.',
        },
        {
          title: 'Réponse publique en parallèle',
          body: 'Vrbo affiche la réponse propriétaire juste sous l\'avis. Soigne-la : courte, factuelle, sans émotion.',
        },
        {
          title: 'Escalade si refus initial',
          body: 'Si la suppression est refusée, contacte le support propriétaire Vrbo via le centre d\'aide et demande une revue par un superviseur.',
        },
        {
          title: 'Noyer l\'avis avec du volume positif',
          body: 'Comme sur Airbnb et Booking, l\'algorithme valorise les avis récents. Collecte activement des avis positifs après ce séjour.',
        },
      ],
      templates: [
        {
          label: 'Signalement Vrbo',
          body: `Bonjour,

Je signale l'avis du voyageur [Prénom] pour motif **[Hors-sujet / Propos diffamatoires / Informations personnelles / Avis frauduleux]** selon votre politique de contenu.

[Contexte précis en 2-3 lignes + capture d'écran jointe.]

Merci de bien vouloir examiner ce signalement et procéder à la suppression si la violation est confirmée.

Cordialement,
[Prénom Nom]
ID propriétaire : [numéro]`,
        },
        {
          label: 'Réponse publique Vrbo',
          body: `Bonjour [Prénom],

Merci pour votre retour. Nous regrettons que votre séjour n'ait pas répondu à vos attentes.

[Élément factuel neutre qui contredit l'avis, en une phrase.]

Nous restons attachés à offrir une expérience de qualité à tous nos voyageurs.

Cordialement,
[Prénom]`,
        },
      ],
      doNotDo: [
        'Demander la suppression sans citer un motif précis de la politique Vrbo',
        'Répondre publiquement avec agressivité ou émotion',
        'Contacter le voyageur hors plateforme pour pression',
        'Laisser passer plus de 30 jours sans signaler',
      ],
      recourses: [
        'Support propriétaire Vrbo via centre d\'aide',
        'Demande de revue par un superviseur si refus initial',
        'Stratégie volume : nouveaux avis positifs',
      ],
      prevention: [
        'Demande de feedback explicite au check-out',
        'Réponse systématique à tous les avis',
        'Communication pré-séjour claire et complète',
      ],
      lastVerified: '2026-05-12',
    },

    // Note : pas applicable en location directe (pas d'avis publics)
    // L'UI affiche déjà l'encart "Pas applicable sur ce canal"

  },

  // ─── SCÉNARIO 3 : Voyageur fait la fête / nuisance / dépassement ───────

  'voyageur-fete-nuisance': {

    // ── Airbnb ────────────────────────────────────────────────────────────
    airbnb: {
      reassurance: "Agir vite, calmement, par écrit. Tu n'as pas à te déplacer seul(e) ni à t'exposer physiquement. Airbnb a une cellule sécurité 24h/24, utilise-la.",
      delayBox: {
        type: 'urgent',
        label: 'Délai critique · en temps réel',
        body: 'Plus tu attends, plus le problème grossit. Documente puis agis dans l\'heure qui suit l\'alerte. Si situation grave : police d\'abord (17), Airbnb ensuite.',
      },
      steps: [
        {
          title: 'Documente immédiatement',
          body: 'Capteur de bruit (Minut, NoiseAware) → exporte les rapports horodatés. Sinon : demande aux voisins de confirmer par écrit ou SMS le bruit + les horaires. Photos discrètes du nombre de personnes si dépassement de capacité, ou demande à un voisin de confirmer.',
        },
        {
          title: 'Contacte le voyageur PAR ÉCRIT via la messagerie Airbnb',
          body: 'Ton ferme mais correct. Rappelle le règlement intérieur signé. Demande l\'arrêt **immédiat** des nuisances ou la réduction au nombre de personnes annoncé. **Garde la trace écrite.**',
        },
        {
          title: 'Si pas d\'amélioration sous 1-2 h, signale à Airbnb',
          body: 'Centre d\'aide Airbnb → **Signaler ce voyageur** → **Comportement perturbateur**. Joins captures d\'écran et preuves. Airbnb peut intervenir directement auprès du voyageur ou bloquer le compte.',
        },
        {
          title: 'AirCover assistance sécurité 24h/24 si tu te sens en danger',
          body: 'Ligne d\'urgence Airbnb disponible 24h/24 pour les hôtes en situation critique. Numéro accessible depuis l\'application Airbnb → **Aide** → **Urgence sécurité**.',
        },
        {
          title: 'Police (17) si nuisances graves ou tapage nocturne (après 22 h)',
          body: 'N\'hésite pas. Tapage nocturne après 22 h est une infraction. La police peut intervenir et établir un PV qui te servira ensuite auprès d\'Airbnb. **Ne te rends pas seul(e) sur place pour confronter physiquement le voyageur.**',
        },
        {
          title: 'Après le départ : réclamation Airbnb',
          body: 'Ouvre une réclamation pour **Violation du règlement intérieur**. Demande remboursement : dégâts éventuels, frais de ménage supplémentaires, indemnité pour la gêne aux voisins, voire amende pour syndic si copropriété.',
        },
      ],
      templates: [
        {
          label: 'Message ferme au voyageur (1er contact)',
          body: `Bonjour [Prénom],

Je viens d'être alerté(e) par les voisins d'un niveau sonore élevé dans le logement.

Je vous rappelle que le règlement intérieur que vous avez signé interdit :
- les fêtes
- les nuisances sonores après 22 h
- le dépassement de la capacité maximale annoncée ([X] personnes)

Merci de baisser immédiatement le son et de respecter ces règles.

Sans amélioration sous 1 h, je serai contraint(e) de signaler la situation à Airbnb et aux autorités. Cela peut entraîner la suspension de votre compte Airbnb et des poursuites.

Cordialement,
[Prénom]`,
        },
        {
          label: 'Signalement Airbnb · comportement perturbateur',
          body: `Bonjour,

Je signale le voyageur [Prénom] (réservation HM[numéro]) pour **Comportement perturbateur**.

Faits constatés :
- [date / heure] : nuisances sonores signalées par les voisins ([noms / témoignages écrits joints])
- [Dépassement de capacité : X personnes constatées au lieu de Y annoncées]
- [Rapports capteur bruit Minut/NoiseAware joints]

J'ai contacté le voyageur via la messagerie Airbnb (échange joint) sans amélioration.

Merci pour votre intervention rapide.

Cordialement,
[Prénom]`,
        },
      ],
      doNotDo: [
        'Te rendre seul(e) sur place pour confronter physiquement le voyageur (danger personnel + voie de fait potentielle)',
        'Couper l\'eau, l\'électricité ou changer la serrure (voie de fait, illégal, tu deviens fautif)',
        'Insulter ou menacer le voyageur dans tes messages',
        'Attendre le lendemain matin "pour voir si ça passe" : la situation s\'aggrave généralement',
      ],
      recourses: [
        'Police (17) pour tapage nocturne, qui établit un PV utilisable ensuite',
        'AirCover assistance sécurité 24h/24 en cas de danger',
        'Signalement Airbnb pour suspension du compte voyageur',
        'Action en justice si dommages graves (tribunal judiciaire)',
        'Syndic de copropriété si la nuisance affecte d\'autres résidents',
      ],
      prevention: [
        'Règlement intérieur signé numériquement AVANT l\'arrivée avec mention explicite "pas de fêtes" + capacité max',
        'Capteur de bruit (Minut, NoiseAware) — alerte automatique et preuve horodatée',
        'Caméra extérieure si déclarée à la CNIL (interdit en intérieur)',
        'Mention claire "pas de fêtes" + capacité réelle dans l\'annonce',
        'Vérification du profil voyageur avant acceptation (avis, vérification d\'identité Airbnb)',
      ],
      lastVerified: '2026-05-12',
    },

    // ── Booking.com ───────────────────────────────────────────────────────
    booking: {
      reassurance: "Pas d'AirCover sur Booking, mais la police et tes assurances restent tes meilleurs alliés. Documente, contacte par écrit via la messagerie Booking, escalade si besoin.",
      delayBox: {
        type: 'urgent',
        label: 'Délai critique · en temps réel',
        body: 'Réagis dans l\'heure. Plus tu attends, plus tu perds ta capacité à prouver la causalité.',
      },
      steps: [
        {
          title: 'Documente : capteur de bruit, témoignages voisins, photos',
          body: 'Mêmes règles que sur Airbnb. Le capteur de bruit Minut/NoiseAware est ton meilleur ami pour les preuves horodatées.',
        },
        {
          title: 'Contacte le voyageur via la messagerie Booking',
          body: 'Garde la trace écrite. Ton ferme, rappel du règlement, demande d\'arrêt immédiat.',
        },
        {
          title: 'Signale dans l\'extranet Booking',
          body: 'Extranet → **Boîte de réception** → **Comportement de l\'invité** → décris la situation, joins captures et preuves. Booking peut intervenir et bloquer le compte.',
        },
        {
          title: 'Police (17) si tapage nocturne ou danger',
          body: 'Tapage nocturne après 22 h = infraction. PV de police = preuve indiscutable pour la suite.',
        },
        {
          title: 'Réclamation post-séjour via extranet',
          body: 'Demande indemnisation des dégâts, frais de ménage supplémentaires, gêne aux voisins. Booking peut t\'aider à récupérer auprès du voyageur.',
        },
      ],
      templates: [
        {
          label: 'Message ferme au voyageur via Booking',
          body: `Bonjour [Prénom],

Je viens d'être alerté(e) par les voisins de nuisances sonores dans le logement.

Le règlement intérieur que vous avez accepté interdit :
- les fêtes
- les nuisances sonores après 22 h
- le dépassement de la capacité ([X] personnes max)

Merci de respecter ces règles immédiatement.

Sans amélioration sous 1 h, je serai contraint(e) de contacter les autorités et de signaler la situation à Booking, ce qui peut entraîner la suspension de votre compte et des poursuites pour les frais engagés.

Cordialement,
[Prénom]`,
        },
      ],
      doNotDo: [
        'Confronter physiquement seul(e) le voyageur',
        'Couper les fluides ou changer la serrure',
        'Attendre le lendemain matin',
      ],
      recourses: [
        'Police (17) pour tapage nocturne',
        'Signalement Booking via extranet',
        'Assurance PNO ou MRH si dégâts',
        'Syndic de copropriété si applicable',
      ],
      prevention: [
        'Règlement intérieur signé en pré-arrivée',
        'Capteur de bruit (Minut, NoiseAware)',
        'Caméra extérieure CNIL-compliant',
        'Annonce avec capacité max claire et règles de vie',
      ],
      lastVerified: '2026-05-12',
    },

    // ── Vrbo / Abritel ────────────────────────────────────────────────────
    vrbo: {
      reassurance: "Vrbo propose une ligne d'assistance hôte 24h/24 pour les urgences. Documente, contacte le voyageur par écrit, escalade.",
      delayBox: {
        type: 'urgent',
        label: 'Délai critique · en temps réel',
        body: 'Réagis dans l\'heure. La documentation horodatée est ton meilleur atout.',
      },
      steps: [
        {
          title: 'Documente immédiatement',
          body: 'Capteur de bruit, témoignages voisins, photos discrètes. Tout horodaté.',
        },
        {
          title: 'Contacte le voyageur via la messagerie Vrbo',
          body: 'Ton ferme et correct, rappel du règlement intérieur, demande d\'arrêt immédiat.',
        },
        {
          title: 'Signale au support Vrbo',
          body: 'Centre d\'aide propriétaire Vrbo → **Signaler un comportement** → décris la situation et joins les preuves. Le support peut intervenir.',
        },
        {
          title: 'Police (17) si nécessaire',
          body: 'Tapage nocturne après 22 h, situation dangereuse : appelle. Ne te déplace pas seul(e).',
        },
        {
          title: 'Réclamation post-séjour',
          body: 'Demande remboursement des frais supplémentaires (ménage, dégâts, gêne voisins). Vrbo médie entre toi et le voyageur.',
        },
      ],
      templates: [
        {
          label: 'Message ferme au voyageur via Vrbo',
          body: `Bonjour [Prénom],

Les voisins m'ont alerté(e) de nuisances sonores dans le logement.

Le règlement que vous avez accepté interdit les fêtes, les nuisances après 22 h, et le dépassement de la capacité de [X] personnes.

Merci de respecter ces règles immédiatement, à défaut je devrai contacter les autorités et signaler à Vrbo.

Cordialement,
[Prénom]`,
        },
      ],
      doNotDo: [
        'Confrontation physique seul(e)',
        'Coupure de fluides ou changement de serrure',
        'Reporter au lendemain',
      ],
      recourses: [
        'Police (17) pour tapage nocturne',
        'Support Vrbo pour signalement',
        'Assurance PNO ou MRH',
      ],
      prevention: [
        'Règlement intérieur signé',
        'Capteur de bruit',
        'Annonce avec capacité max claire',
      ],
      lastVerified: '2026-05-12',
    },

    // ── Direct ────────────────────────────────────────────────────────────
    direct: {
      reassurance: "En direct, tu es entièrement responsable de la gestion. C'est aussi toi qui as choisi tes voyageurs : tu peux exiger fermement le respect du contrat signé. Les recours sont le contrat, le règlement intérieur, et le Code pénal en cas de tapage.",
      delayBox: {
        type: 'urgent',
        label: 'Délai critique · en temps réel',
        body: 'Pas de plateforme pour médier, mais tes outils restent solides : contrat, règlement, police, assurance.',
      },
      steps: [
        {
          title: 'Documente immédiatement',
          body: 'Capteur de bruit, témoignages écrits/SMS des voisins, photos. Tout horodaté.',
        },
        {
          title: 'Contacte le voyageur par écrit (email + SMS)',
          body: 'Ton ferme, rappel des clauses du contrat signé (capacité, règlement intérieur, sanctions). Demande l\'arrêt immédiat. Capture les échanges.',
        },
        {
          title: 'Police (17) si tapage nocturne ou danger',
          body: 'Tapage nocturne après 22 h = infraction (article R623-2 Code pénal). Demande un PV qui te servira pour la suite.',
        },
        {
          title: 'Constat huissier si situation prolongée',
          body: 'Pour les nuisances graves ou répétées, un constat d\'huissier (~150-300 €) est une preuve irréfutable, utilisable en justice.',
        },
        {
          title: 'Réclamation au voyageur après séjour',
          body: 'Email ou recommandé AR listant les violations du contrat (capacité dépassée, nuisances, dégâts), avec demande d\'indemnisation. Active la caution et demande le complément.',
        },
        {
          title: 'Recours juridiques si refus',
          body: 'Conciliateur de justice (gratuit, obligatoire < 5 000 €), tribunal judiciaire au-delà. Le contrat signé + le PV de police + les témoignages constituent un dossier solide.',
        },
      ],
      templates: [
        {
          label: 'Message ferme au voyageur',
          body: `Bonjour [Prénom],

Les voisins m'ont alerté(e) à plusieurs reprises de nuisances sonores graves dans le logement.

Je vous rappelle les clauses du contrat de location saisonnière que vous avez signé :
- Capacité maximale : [X] personnes (article [N] du contrat)
- Respect du règlement intérieur, incluant l'interdiction des fêtes et le silence après 22 h
- Sanctions prévues en cas de violation : conservation de la caution, indemnisation des préjudices

Merci de respecter immédiatement ces règles. À défaut, je vais contacter la police pour tapage nocturne et engager les recours prévus au contrat.

Cordialement,
[Prénom Nom]
[Téléphone]`,
        },
        {
          label: 'Email récapitulatif post-séjour avec demande d\'indemnisation',
          body: `Bonjour [Prénom],

Suite à votre séjour du [date] au [date], je constate plusieurs violations du contrat de location saisonnière que vous avez signé :

- [Capacité dépassée : X personnes constatées au lieu de Y]
- [Nuisances sonores signalées par les voisins le [date / heure], PV de police N° [numéro] joint]
- [Dégâts constatés : liste précise + photos]

Conformément au contrat (article [N]), j'ai prélevé la caution de [Y] €.

Le préjudice total s'élève à [X] € (devis et factures joints). Le complément à régler est de [X-Y] €.

Merci de régler ce montant sous 15 jours par virement. À défaut, je saisirai le conciliateur de justice puis le tribunal compétent.

Cordialement,
[Prénom Nom]`,
        },
      ],
      doNotDo: [
        'Confrontation physique seul(e)',
        'Couper l\'eau, l\'électricité ou changer la serrure (voie de fait, illégal)',
        'Renoncer faute de "preuves suffisantes" sans avoir appelé la police',
        'Attendre plusieurs jours en espérant que ça passe',
      ],
      recourses: [
        'Police (17) pour tapage nocturne, PV utilisable en justice',
        'Constat d\'huissier (~150-300 €) pour cas graves',
        'Conciliateur de justice (gratuit, obligatoire < 5 000 €)',
        'Tribunal judiciaire au-delà',
        'Assurance PNO ou MRH avec extension saisonnière',
      ],
      prevention: [
        'Contrat de location saisonnière complet avec clauses de sanctions (obligatoire art. L324-2)',
        'Règlement intérieur signé numériquement avant arrivée',
        'Capteur de bruit (Minut, NoiseAware) — alerte + preuve',
        'Caméra extérieure CNIL-compliant',
        'Caution suffisante (15-30 % du séjour minimum)',
        'Filtrage des réservations en direct via Driing (avis communautaires)',
      ],
      lastVerified: '2026-05-12',
    },

  },

  // ─── SCÉNARIO 4 : Mon voyageur refuse de partir ─────────────────────────

  'voyageur-refuse-partir': {

    // ── Airbnb ────────────────────────────────────────────────────────────
    airbnb: {
      reassurance: "Situation rare mais stressante. Un voyageur qui refuse de quitter un meublé de tourisme est en occupation sans droit ni titre. La trêve hivernale et les procédures longues d'expulsion classique ne s'appliquent pas de la même façon. Tu as des leviers rapides.",
      delayBox: {
        type: 'urgent',
        label: 'Délai critique · le jour même',
        body: 'Agis dès la date de départ prévue. Chaque journée d\'attente complique la résolution et menace les réservations suivantes.',
      },
      steps: [
        {
          title: 'Contacte le voyageur par écrit, immédiatement',
          body: 'Messagerie Airbnb (et email/SMS en parallèle pour multiplier les traces). Rappel de la date de fin de séjour, demande de départ **immédiat**, ton ferme mais correct.',
        },
        {
          title: 'Signale à Airbnb dans la foulée',
          body: 'Centre d\'aide Airbnb → **Le voyageur refuse de quitter le logement**. Airbnb peut intervenir directement auprès du voyageur, voire activer l\'assistance sécurité 24h/24.',
        },
        {
          title: 'Si refus persistant, appelle la police (17) ou la gendarmerie',
          body: 'Présente le contrat de location (= ta réservation Airbnb avec dates), l\'annonce, les échanges écrits. Ils peuvent constater l\'**occupation sans droit ni titre** et faire pression sur le voyageur pour qu\'il parte. Souvent suffisant.',
        },
        {
          title: 'Constat d\'huissier en parallèle',
          body: 'Pour les cas qui s\'enkystent, un constat d\'huissier (~150-300 €) établit officiellement l\'occupation sans droit. Pièce maîtresse pour la suite.',
        },
        {
          title: 'Si la situation perdure : avocat + référé',
          body: 'Avocat spécialisé en droit immobilier. **Procédure d\'expulsion en référé** devant le tribunal judiciaire (procédure rapide, ~2-4 semaines). Pour un meublé de tourisme, le juge tranche vite car ce n\'est pas un bail d\'habitation classique.',
        },
        {
          title: 'Réclamation Airbnb post-résolution',
          body: 'Demande remboursement des nuits non disponibles pour les voyageurs suivants (que tu as dû annuler) + indemnité pour préjudice. AirCover peut couvrir une partie selon ton dossier.',
        },
      ],
      templates: [
        {
          label: 'Premier message au voyageur',
          body: `Bonjour [Prénom],

Votre réservation prend fin aujourd'hui [date] à [heure].

Conformément aux conditions de la réservation Airbnb [HM/numéro], merci de quitter le logement immédiatement.

D'autres voyageurs sont attendus aujourd'hui. Sans départ sous [délai raisonnable, ex: 2 h], je serai contraint(e) de :
- Signaler la situation à Airbnb
- Contacter les autorités pour occupation sans droit ni titre
- Engager une procédure d'expulsion en référé avec demande d'indemnisation

Cordialement,
[Prénom]`,
        },
        {
          label: 'Signalement Airbnb',
          body: `Bonjour,

Le voyageur [Prénom] avait réservé jusqu'au [date] à [heure] (réservation HM[numéro]).

À ce jour [date du jour], il refuse de quitter le logement malgré mes demandes répétées (échanges en pièce jointe).

Je sollicite votre intervention immédiate pour faire respecter la date de fin de séjour.

Sans solution sous 24 h, je devrai annuler les réservations suivantes (préjudice direct) et engager une procédure d'expulsion en référé.

Merci de votre aide urgente.

Cordialement,
[Prénom]
Téléphone : [numéro pour rappel]`,
        },
      ],
      doNotDo: [
        'Entrer de force, changer la serrure ou couper les fluides (eau, électricité) : c\'est une voie de fait, tu deviens fautif et le juge te sanctionnera plus durement que le voyageur',
        'Te confronter physiquement seul(e)',
        'Attendre plusieurs jours en espérant que ça se règle tout seul : ça ne se règle jamais tout seul',
        'Régler le problème "à l\'amiable" en versant de l\'argent au voyageur pour qu\'il parte : ouvre la porte à du chantage',
      ],
      recourses: [
        'Police ou gendarmerie pour constat d\'occupation sans droit (souvent suffisant pour faire partir)',
        'Constat d\'huissier (~150-300 €) pour les cas qui s\'enkystent',
        'Avocat spécialisé en droit immobilier + référé devant le tribunal judiciaire',
        'Réclamation Airbnb pour perte des nuits suivantes + préjudice',
      ],
      prevention: [
        'Règlement intérieur signé avec **date et heure précises de check-out** explicites',
        'Caution suffisante pour décourager les abus',
        'Vérification du profil voyageur (avis antérieurs, vérification d\'identité Airbnb)',
        'Pour les séjours longs (> 1 mois), méfie-toi : risque légal augmenté, à encadrer par contrat solide',
      ],
      lastVerified: '2026-05-12',
    },

    // ── Booking.com ───────────────────────────────────────────────────────
    booking: {
      reassurance: "Booking peut t'aider à médier mais le levier principal reste la police et la justice. Documente, contacte, escalade vite.",
      delayBox: {
        type: 'urgent',
        label: 'Délai critique · le jour même',
        body: 'Réagis dès la date de départ. Pas d\'attente.',
      },
      steps: [
        {
          title: 'Contact écrit immédiat',
          body: 'Messagerie Booking + email + SMS. Rappel des dates, demande de départ immédiat, mention des recours en cas de refus.',
        },
        {
          title: 'Signale dans l\'extranet Booking',
          body: 'Extranet → **Boîte de réception** → **Demande spéciale** → décris la situation et joins l\'échange. Booking peut intervenir.',
        },
        {
          title: 'Police ou gendarmerie',
          body: 'Comme pour Airbnb : présente la confirmation Booking avec les dates, l\'échange écrit. Constat d\'occupation sans droit, pression sur le voyageur.',
        },
        {
          title: 'Constat d\'huissier si situation prolongée',
          body: 'Pièce officielle pour la procédure judiciaire ultérieure.',
        },
        {
          title: 'Référé devant le tribunal judiciaire',
          body: 'Avocat + procédure rapide pour expulsion d\'un meublé de tourisme.',
        },
        {
          title: 'Réclamation Booking post-résolution',
          body: 'Demande indemnisation des préjudices, en particulier les annulations forcées des réservations suivantes.',
        },
      ],
      templates: [
        {
          label: 'Message au voyageur via Booking',
          body: `Bonjour [Prénom],

Votre réservation [numéro] prend fin aujourd'hui [date] à [heure].

Merci de quitter le logement immédiatement. D'autres voyageurs sont attendus.

Sans départ sous 2 h, je signalerai la situation à Booking, contacterai les autorités pour occupation sans droit ni titre, et engagerai une procédure d'expulsion en référé.

Cordialement,
[Prénom]`,
        },
      ],
      doNotDo: [
        'Voie de fait (changement de serrure, coupure de fluides)',
        'Confrontation physique seul(e)',
        'Verser de l\'argent pour faire partir le voyageur (chantage)',
        'Attendre plusieurs jours',
      ],
      recourses: [
        'Police ou gendarmerie',
        'Constat d\'huissier',
        'Avocat + référé tribunal judiciaire',
        'Réclamation Booking pour préjudice',
      ],
      prevention: [
        'Confirmation écrite avec heure de check-out explicite',
        'Caution suffisante',
        'Profil voyageur vérifié (Genius, avis antérieurs)',
      ],
      lastVerified: '2026-05-12',
    },

    // ── Vrbo / Abritel ────────────────────────────────────────────────────
    vrbo: {
      reassurance: "Process similaire à Airbnb. Vrbo a une ligne d'assistance hôte qui peut intervenir.",
      delayBox: {
        type: 'urgent',
        label: 'Délai critique · le jour même',
        body: 'Réagis dès la date de départ.',
      },
      steps: [
        {
          title: 'Contact écrit immédiat (Vrbo + email)',
          body: 'Messagerie Vrbo, ton ferme, rappel des dates, demande de départ immédiat.',
        },
        {
          title: 'Signale au support Vrbo',
          body: 'Centre d\'aide propriétaire → urgence → intervention possible.',
        },
        {
          title: 'Police pour occupation sans droit',
          body: 'Présente la confirmation Vrbo, l\'échange écrit, demande constat.',
        },
        {
          title: 'Constat d\'huissier puis référé',
          body: 'Si la situation s\'enkyste : huissier puis avocat + référé.',
        },
        {
          title: 'Réclamation Vrbo pour préjudice',
          body: 'Demande remboursement des annulations forcées.',
        },
      ],
      templates: [
        {
          label: 'Message au voyageur via Vrbo',
          body: `Bonjour [Prénom],

Votre séjour prend fin aujourd'hui [date] à [heure].

Merci de quitter le logement immédiatement.

Sans départ sous 2 h, je signalerai à Vrbo, contacterai les autorités pour occupation sans droit ni titre, et engagerai une procédure judiciaire avec demande d'indemnisation.

Cordialement,
[Prénom]`,
        },
      ],
      doNotDo: [
        'Voie de fait (serrure, fluides)',
        'Confrontation physique seul(e)',
        'Chantage par paiement',
        'Attente passive',
      ],
      recourses: [
        'Police ou gendarmerie',
        'Constat huissier',
        'Avocat + référé',
        'Réclamation Vrbo',
      ],
      prevention: [
        'Heure de check-out explicite',
        'Caution suffisante',
        'Vérification profil voyageur',
      ],
      lastVerified: '2026-05-12',
    },

    // ── Direct ────────────────────────────────────────────────────────────
    direct: {
      reassurance: "En direct, tu as l'avantage d'un contrat de location saisonnière complet. Utilise-le, c'est ton arme principale. Le voyageur ne peut pas plaider l'ignorance, il a signé.",
      delayBox: {
        type: 'urgent',
        label: 'Délai critique · le jour même',
        body: 'Réagis dès la date de fin de séjour prévue au contrat.',
      },
      steps: [
        {
          title: 'Email + SMS immédiat au voyageur',
          body: 'Rappel des dates du contrat, demande de départ immédiat, mention explicite des sanctions prévues au contrat et des recours.',
        },
        {
          title: 'Appelle la police ou la gendarmerie',
          body: 'Présente le contrat de location saisonnière signé, l\'état des lieux d\'entrée, les échanges écrits. **Occupation sans droit ni titre** est constituée dès la fin du contrat. La police intervient souvent.',
        },
        {
          title: 'Constat d\'huissier dans la foulée',
          body: 'Si la police seule ne suffit pas, fais venir un huissier (~150-300 €) qui dresse un constat officiel d\'occupation sans droit. Pièce maîtresse.',
        },
        {
          title: 'Mise en demeure recommandée AR',
          body: 'Lettre recommandée AR au voyageur listant la violation du contrat, les sanctions, les recours envisagés. Délai 48 h pour partir.',
        },
        {
          title: 'Référé devant le tribunal judiciaire',
          body: 'Avocat spécialisé. Pour un meublé de tourisme avec contrat clair, le juge tranche en référé sous 2-4 semaines. Demande aussi des dommages et intérêts pour les nuits perdues.',
        },
        {
          title: 'Active la caution + assurance PNO',
          body: 'Caution retenue pour couvrir les nuits indues. Assurance PNO si frais juridiques importants (extension protection juridique souvent incluse).',
        },
      ],
      templates: [
        {
          label: 'Email + SMS au voyageur',
          body: `Bonjour [Prénom],

Votre séjour, encadré par le contrat de location saisonnière signé le [date], prend fin aujourd'hui [date] à [heure].

Conformément à l'article [N] du contrat, vous êtes tenu(e) de quitter le logement à cette date et heure précises.

À défaut de départ sous 2 h, j'engagerai sans délai :
- L'intervention de la police pour occupation sans droit ni titre
- Un constat d'huissier
- Une procédure d'expulsion en référé devant le tribunal judiciaire
- Une demande d'indemnisation pour les nuits suivantes que je dois annuler

Cordialement,
[Prénom Nom]
[Téléphone]`,
        },
        {
          label: 'Mise en demeure recommandée AR',
          body: `[Tes coordonnées complètes]
[Coordonnées du voyageur]

Objet : Mise en demeure de quitter les lieux sans délai
Lettre recommandée avec accusé de réception
[Ville], le [date]

Madame, Monsieur [Nom],

Aux termes du contrat de location saisonnière signé le [date], votre séjour dans le logement meublé de tourisme situé [adresse] devait prendre fin le [date] à [heure].

À la date de la présente, vous occupez toujours les lieux sans droit ni titre.

Je vous mets formellement en demeure de quitter les lieux sous 48 h à compter de la réception de cette lettre.

À défaut, j'engagerai sans nouvelle mise en demeure :
- Un constat d'huissier
- Une procédure d'expulsion en référé devant le tribunal judiciaire compétent
- Une demande d'indemnisation pour la totalité du préjudice subi (nuits perdues, frais d'huissier, frais d'avocat, dommages et intérêts)

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

[Prénom Nom]
[Signature manuscrite]`,
        },
      ],
      doNotDo: [
        'Voie de fait absolument interdite : changement de serrure, coupure d\'eau/électricité, retrait des affaires du voyageur. Tu deviens fautif et le juge te sanctionnera plus que le voyageur',
        'Confrontation physique seul(e)',
        'Verser de l\'argent pour faire partir',
        'Attendre que ça passe : ça ne passe jamais',
      ],
      recourses: [
        'Police ou gendarmerie (souvent suffisant)',
        'Constat d\'huissier (~150-300 €)',
        'Avocat + référé tribunal judiciaire',
        'Assurance PNO / MRH avec protection juridique',
      ],
      prevention: [
        'Contrat de location saisonnière clair avec date et heure de check-out précises (article L324-2 Code du tourisme)',
        'Caution suffisante (15-30 % du séjour minimum)',
        'Filtrage des réservations directes via Driing (avis communautaires, vérifications)',
        'Pour les séjours longs (> 1 mois), encadrer par contrat solide + caution renforcée',
      ],
      lastVerified: '2026-05-12',
    },

  },

  // ─── SCÉNARIO 5 : Litige avec Airbnb / Booking / Vrbo ───────────────────

  'litige-plateforme': {

    // ── Airbnb ────────────────────────────────────────────────────────────
    airbnb: {
      reassurance: "Les litiges avec Airbnb peuvent être longs mais ils se résolvent. Garde tes nerfs, documente, escalade méthodiquement. Les recours externes (médiateur, DGCCRF) marchent quand tu épuises l'interne.",
      delayBox: {
        type: 'soft',
        label: 'Délai · pas de plafond impératif',
        body: 'Plus tu attends, plus c\'est dur de reconstituer le dossier. Agis dans les 7-30 jours selon la nature du litige.',
      },
      steps: [
        {
          title: 'Centre d\'aide Airbnb : ouvre un ticket précis',
          body: 'Centre d\'aide → ton problème spécifique. Décris factuellement : dates, montants, numéro de réservation, captures d\'écran. **Pas d\'émotion**, juste les faits.',
        },
        {
          title: 'Téléphone si pas de réponse sous 48 h',
          body: 'Numéro Airbnb hôtes en France (à vérifier sur la page officielle Aide Airbnb). Note le **nom de l\'agent**, l\'**heure d\'appel**, le **résumé** de la conversation, le **numéro de ticket**. Demande un email récapitulatif.',
        },
        {
          title: 'Escalade : superviseur ou Twitter/X',
          body: 'Si pas de résolution sous 5 jours : demande explicitement un **superviseur** ou écris à **@AirbnbHelp** sur Twitter/X (souvent plus rapide que les canaux classiques).',
        },
        {
          title: 'Recours formel par email',
          body: 'Email à l\'adresse customer.protection@airbnb.com (à confirmer sur leur site) avec récap complet : tous les numéros de ticket, l\'historique, ta demande précise, le délai (15 jours).',
        },
        {
          title: 'Médiation externe',
          body: '**Médiateur de la consommation européen (ODR)** pour les transactions transfrontalières (Airbnb est basé en Irlande). Saisine en ligne sur ec.europa.eu/odr. Gratuit. Le médiateur du tourisme et du voyage (MTV) n\'est compétent que pour ses adhérents (Airbnb ne l\'est pas, à vérifier régulièrement).',
        },
        {
          title: 'DGCCRF',
          body: 'Signalement sur signal.conso.gouv.fr pour pratique commerciale abusive. Pas une procédure individuelle de réparation, mais ça met la pression et alimente les statistiques utilisables ensuite.',
        },
        {
          title: 'Action en justice',
          body: 'Tribunal judiciaire du lieu du logement, conciliateur préalable si < 5 000 €. Avocat conseillé pour les montants importants.',
        },
      ],
      templates: [
        {
          label: 'Recours formel email Airbnb',
          body: `Objet : Recours formel · Réservation HM[numéro]

Madame, Monsieur,

Je suis hôte sur Airbnb depuis [date] (identifiant [pseudo]).

Concernant la réservation HM[numéro] de [Prénom voyageur], j'ai rencontré le problème suivant :
[Exposé factuel des faits, en quelques phrases, sans émotion]

J'ai contacté votre service client le [date] (référence ticket #[numéro]), sans réponse satisfaisante à ce jour, malgré [X] relances.

Je sollicite formellement [demande précise : remboursement / suppression d'avis / déblocage de compte / restitution du paiement bloqué / etc.].

Sans réponse de votre part sous 15 jours à compter de cet email, je saisirai :
- Le Médiateur de la consommation européen (ODR)
- La DGCCRF via signal.conso.gouv.fr
- Le tribunal judiciaire compétent

Cordialement,
[Prénom Nom]
[Email] / [Téléphone]`,
        },
      ],
      doNotDo: [
        'Insulter les agents (ça ferme tout)',
        'Multiplier les tickets sur le même sujet (ça brouille ton dossier)',
        'Menacer publiquement sur les réseaux sociaux avant d\'avoir épuisé les recours internes (le juge te le reprochera)',
        'Régler à la baisse à la première proposition Airbnb si tu es certain de ton bon droit',
      ],
      recourses: [
        'Superviseur Airbnb (demande explicitement)',
        'Twitter / X @AirbnbHelp pour escalade rapide',
        'Médiateur de la consommation européen (ODR), gratuit',
        'DGCCRF via signal.conso.gouv.fr',
        'Tribunal judiciaire (conciliateur obligatoire < 5 000 €)',
        'Associations de consommateurs (UFC-Que Choisir, CLCV)',
      ],
      prevention: [
        'Garde TOUS les échanges en sauvegarde (PDF, captures) au-delà de la plateforme',
        'Documente chaque incident hôte/voyageur dès qu\'il survient (date, montant, contexte)',
        'Sauvegarde régulièrement tes données Airbnb (export RGPD à demander de temps en temps)',
        'Diversifie tes canaux : ne mets jamais 100 % de tes revenus sur une seule plateforme',
      ],
      lastVerified: '2026-05-12',
    },

    // ── Booking.com ───────────────────────────────────────────────────────
    booking: {
      reassurance: "Booking a un support partenaire dédié et des Account Managers pour les hôtes actifs. Utilise ces canaux avant les recours externes.",
      delayBox: {
        type: 'soft',
        label: 'Délai · agis dans les 7-30 jours',
        body: 'Pas de délai impératif Booking, mais les dossiers anciens sont traités moins prioritairement.',
      },
      steps: [
        {
          title: 'Extranet partenaire : section Réclamations',
          body: 'Extranet → **Réclamations** ou **Demandes spéciales** selon la nature. Ouvre un dossier avec description factuelle, captures d\'écran, références.',
        },
        {
          title: 'Téléphone partenaire Booking',
          body: 'Numéro partenaire selon ton pays (vérifier sur l\'extranet, souvent 0805 088 074 en France). Note le nom de l\'agent, le numéro de ticket, demande un email récapitulatif.',
        },
        {
          title: 'Account Manager si disponible',
          body: 'Si tu as un Account Manager dédié (hôtes à fort volume), contacte-le directement par email. C\'est le canal le plus efficace.',
        },
        {
          title: 'Recours formel email',
          body: 'Email partner@booking.com (à confirmer) avec récap complet et délai de réponse demandé.',
        },
        {
          title: 'Médiation et juridique',
          body: 'Médiateur de la consommation européen (ODR), DGCCRF, tribunal judiciaire.',
        },
      ],
      templates: [
        {
          label: 'Recours formel email Booking',
          body: `Objet : Recours formel · Réservation [numéro Booking]

Madame, Monsieur,

Identifiant partenaire : [numéro]
Établissement : [Nom]

Je rencontre le problème suivant concernant la réservation [numéro] :
[Exposé factuel]

J'ai ouvert le ticket [numéro] le [date] et appelé votre service partenaire le [date] (agent : [nom]), sans réponse satisfaisante.

Je sollicite formellement [demande précise].

Sans réponse sous 15 jours, je saisirai le Médiateur de la consommation européen, la DGCCRF et le tribunal compétent.

Cordialement,
[Prénom Nom]`,
        },
      ],
      doNotDo: [
        'Insulter les agents',
        'Multiplier les tickets parallèles',
        'Menacer publiquement avant d\'avoir épuisé l\'interne',
      ],
      recourses: [
        'Account Manager (canal prioritaire)',
        'Téléphone partenaire Booking',
        'Médiateur de la consommation européen (ODR)',
        'DGCCRF via signal.conso.gouv.fr',
        'Tribunal judiciaire',
      ],
      prevention: [
        'Sauvegarde régulière des échanges et données',
        'Diversification des canaux de réservation',
        'Documentation systématique des incidents',
      ],
      lastVerified: '2026-05-12',
    },

    // ── Vrbo / Abritel ────────────────────────────────────────────────────
    vrbo: {
      reassurance: "Vrbo a un support propriétaire et des escalades possibles. Process similaire.",
      delayBox: {
        type: 'soft',
        label: 'Délai · agis dans les 7-30 jours',
        body: 'Pas de délai strict mais les dossiers récents sont traités plus vite.',
      },
      steps: [
        {
          title: 'Centre d\'aide propriétaire Vrbo',
          body: 'Ouvre un ticket précis, factuel, avec captures d\'écran et numéro de réservation.',
        },
        {
          title: 'Téléphone propriétaire Vrbo',
          body: 'Numéro hôte selon ton pays (vérifier sur le centre d\'aide). Note nom, ticket, heure.',
        },
        {
          title: 'Demande de superviseur si nécessaire',
          body: 'Insiste poliment pour une escalade interne si la première réponse n\'est pas satisfaisante.',
        },
        {
          title: 'Recours médiation',
          body: 'Médiateur de la consommation européen (ODR), DGCCRF si pratique commerciale abusive.',
        },
        {
          title: 'Tribunal en dernier ressort',
          body: 'Conciliateur préalable < 5 000 €, tribunal judiciaire au-delà.',
        },
      ],
      templates: [
        {
          label: 'Recours formel Vrbo',
          body: `Objet : Recours formel · Réservation [numéro]

Madame, Monsieur,

ID propriétaire : [numéro]

Je rencontre le problème suivant : [exposé factuel].

Ticket ouvert le [date] (référence [numéro]), sans réponse satisfaisante après [X] relances.

Je sollicite [demande précise].

Sans réponse sous 15 jours, je saisirai le Médiateur de la consommation européen et la DGCCRF.

Cordialement,
[Prénom Nom]`,
        },
      ],
      doNotDo: [
        'Insultes ou menaces',
        'Tickets multiples parallèles',
        'Communication publique prématurée',
      ],
      recourses: [
        'Superviseur Vrbo',
        'Médiateur de la consommation européen (ODR)',
        'DGCCRF',
        'Tribunal judiciaire',
      ],
      prevention: [
        'Documentation systématique',
        'Sauvegarde des échanges',
        'Diversification des canaux',
      ],
      lastVerified: '2026-05-12',
    },

    // Direct : pas de plateforme = pas de litige plateforme.
    // L'UI affiche "Pas applicable sur ce canal"

  },

}
