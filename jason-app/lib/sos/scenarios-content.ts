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
    },

  },

  // Les 4 autres scénarios arrivent dans les commits suivants.
  // Structure identique : 'slug': { airbnb: {...}, booking: {...}, vrbo: {...}, direct: {...} }
}
