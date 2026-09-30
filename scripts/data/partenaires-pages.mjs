// Pages dédiées aux partenaires (façon « shine.fr/partenaire/<nom> »), rendues
// par scripts/build-pages-partenaires.mjs dans partenaires/<slug>/index.html.
//
// Règle (décision du 30/09/2026) : une page seulement pour un partenariat réel
// avec un avantage ou un accompagnement pour l'hôte (Indy, LegalPlace). Pas de
// page pour un outil simplement référencé, ni pour Lodgify et Hospitable (leurs
// pages « avis » jouent déjà ce rôle), ni pour Shine (2 parrainages par an).
//
// Faits repris des articles partenaires (sources citées dans chaque page).
// Prix : relevés de septembre 2026, à revérifier avant toute mise à jour.
// Pas de tiret cadratin dans les textes. Tout lien rémunéré : sponsored: true.

// ── Indy (affilié, numéro 1994, lien « spécial immobilier » urlr.me) ──
const INDY = 'https://urlr.me/FEqNfy'
const INDY_AE = 'utm_source=1994&utm_medium=affiliate&utm_campaign=affilae&promocode=PREMIERMOIS&ae=1994'
const INDY_FE = `https://www.indy.fr/facturation-electronique/?${INDY_AE}&utm_content=facturation`
const INDY_CREATION = `https://www.indy.fr/creation-lmnp/?${INDY_AE}&utm_content=creation-lmnp`

// ── LegalPlace (affilié via Affilae, numéro 1773) ──
const LP = 'utm_source=affilae&utm_medium=partner&utm_campaign=Jason%20Marinho&ae=1773'
const LP_SOCIETE = `https://creation.legalplace.fr/creation-entreprise-2?${LP}`
const LP_MICRO = `https://www.legalplace.fr/contrats/creation-micro-entreprise/?${LP}`
const LP_DOMICILIATION = `https://landing.legalplace.fr/domiciliation?${LP}`

export const PAGES = [
  {
    slug: 'indy',
    nom: 'Indy',
    mono: 'I',
    couleur: '#10B981',
    title: 'Offre Indy : 1er mois offert pour ta compta LMNP',
    description: "Indy avec Jason Marinho : compta LMNP, liasse 2031 et facture électronique pour ta location courte durée. Inscription gratuite, premier mois offert sur les offres payantes.",
    eyebrow: 'Partenaire · Comptabilité LMNP',
    h1: 'Indy : ta compta LMNP et ta facture électronique, <em>premier mois offert</em>',
    lead: "Indy tient la comptabilité de ta location meublée, prépare ta déclaration et te met en règle avec la facture électronique. C'est l'outil que je conseille le plus souvent aux hôtes qui veulent gérer leur LMNP eux-mêmes, alors j'ai négocié ton premier mois.",
    offre: {
      titre: '1er mois offert',
      sous: 'sur les offres payantes, sans engagement',
      points: [
        'Inscription gratuite, sans carte bancaire',
        'Facture électronique incluse dans l\'offre gratuite',
        'Code PREMIERMOIS appliqué automatiquement par le lien',
      ],
      cta: { label: 'Profiter de l\'offre', href: INDY },
      cta2: { label: 'Recevoir mes factures électroniques', href: INDY_FE },
      note: 'Lien affilié : Indy me verse une commission si tu t\'inscris, sans aucun surcoût pour toi.',
    },
    pourquoi: {
      titre: 'Pourquoi je recommande <em>Indy</em>',
      items: [
        { icon: 'calculator', t: 'Le réel sans y passer tes soirées', d: 'Amortissements par composants, comptabilité et liasse fiscale 2031 générés à partir de ta banque, puis télétransmis aux impôts depuis l\'outil.' },
        { icon: 'receipt', t: 'La facture électronique réglée', d: 'Indy est plateforme agréée depuis le 9 janvier 2026. Recevoir tes factures fournisseurs, obligatoire depuis le 1er septembre 2026, est compris dans l\'offre gratuite.' },
        { icon: 'hand-heart', t: 'Tu gardes le choix', d: 'Tu fais toi-même, guidé pas à pas, ou tu confies ton dossier à un cabinet d\'expertise comptable partenaire, sans changer d\'outil.' },
      ],
    },
    fonctions: {
      titre: 'Ce qu\'Indy fait pour <em>ta location</em>',
      items: [
        { icon: 'bank', t: 'Banque synchronisée', d: 'Recettes et dépenses classées automatiquement, au même endroit.' },
        { icon: 'chart-line-up', t: 'Amortissements', d: 'Bien et mobilier amortis par composants, sur les bonnes durées.' },
        { icon: 'file-text', t: 'Liasse 2031 et annexes', d: 'Générées puis envoyées aux impôts, au régime réel.' },
        { icon: 'receipt', t: 'Facture électronique', d: 'Réception et émission via une plateforme agréée.' },
        { icon: 'identification-card', t: 'Création de ton LMNP', d: 'Début d\'activité et numéro SIRET, sans frais.', href: INDY_CREATION, lien: 'Créer mon LMNP' },
        { icon: 'credit-card', t: 'Compte pro', d: 'Gratuit, pour séparer tes revenus LCD de tes dépenses perso.' },
      ],
    },
    etapes: [
      { t: 'Crée ton compte Indy', d: 'par le lien de cette page : inscription gratuite, le premier mois offert est appliqué tout seul.' },
      { t: 'Relie ton compte bancaire', d: 'et choisis Indy comme plateforme de réception de tes factures électroniques.' },
      { t: 'Passe à l\'offre LMNP quand tu en as besoin', d: 'au moment de ta déclaration au réel, sans engagement.' },
    ],
    tableau: {
      titre: 'Gratuit ou payant : <em>selon ta situation</em>',
      entete: ['Ta situation', 'Ce qu\'il te faut chez Indy'],
      lignes: [
        ['Micro-BIC, tu veux suivre tes chiffres et recevoir tes factures électroniques', '<span class="yes">L\'offre gratuite suffit</span>'],
        ['Régime réel, un ou deux logements en nom propre', 'L\'offre LMNP : 24 € HT par mois en annuel (288 € HT, soit 345,60 € TTC par an), environ 32 € HT au mois'],
        ['Dossier complexe (indivision, LMP, SCI à l\'IS, cession) ou tu préfères déléguer', 'L\'option expert-comptable avec un cabinet partenaire'],
      ],
      note: 'Prix relevés en septembre 2026 : vérifie la grille officielle d\'Indy avant de t\'abonner. Pour repère, un cabinet spécialisé LMNP facture en général 400 à 900 € par an.',
    },
    limites: [
      'Ce n\'est pas un logiciel de gestion locative : pas de calendrier, pas de messages voyageurs, pas de lien avec Airbnb ou Booking.',
      'Airbnb et Booking te versent un montant net de commission : tes recettes à déclarer sont les montants bruts. Indy lit ta banque, pas ton compte Airbnb, donc saisis le brut et la commission à partir des relevés des plateformes.',
      'Au-delà de 23 000 € de recettes en courte durée, des cotisations sociales sont dues même en LMNP : le choix du statut mérite un vrai conseil.',
    ],
    liens: [
      { href: '/blog/indy-lmnp-location-courte-duree-avis-2026', t: 'Mon avis complet sur Indy', d: 'Ce qui est gratuit, le réel, la facture électronique et les limites.' },
      { href: '/blog/regime-reel-vs-micro-bic-decision-2026', t: 'Micro-BIC ou réel ?', d: 'Comment décider en 2026, chiffres à l\'appui.' },
      { href: '/services/simulateurs/fiscalite-micro-bic', t: 'Simulateur micro-BIC', d: 'Ton impôt estimé selon ton type de meublé.' },
      { href: '/comparatif-indy-tiime-henrri', t: 'Indy, Tiime ou Henrri', d: 'Le comparatif des outils de compta.' },
    ],
    faq: [
      { q: 'Comment avoir le premier mois offert chez Indy ?', a: 'Inscris-toi par le lien de cette page : le code PREMIERMOIS est appliqué automatiquement. L\'offre gratuite reste gratuite, et le premier mois est offert sur les offres payantes, sans engagement.' },
      { q: 'Indy est-il gratuit pour un loueur en meublé ?', a: 'Oui pour l\'essentiel : l\'offre gratuite couvre le suivi des recettes et des dépenses, la synchronisation bancaire et la facture électronique. L\'offre LMNP payante sert au régime réel (amortissements, liasse 2031). D\'après les relevés de septembre 2026, elle coûte 24 € HT par mois en paiement annuel.' },
      { q: 'Dois-je recevoir mes factures en format électronique en tant que LMNP ?', a: 'Oui. Depuis le 1er septembre 2026, toutes les entreprises assujetties à la TVA doivent pouvoir recevoir leurs factures électroniques via une plateforme agréée, y compris un loueur en meublé exonéré. Indy est plateforme agréée depuis le 9 janvier 2026 et la réception est comprise dans l\'offre gratuite.' },
      { q: 'Indy remplace-t-il un expert-comptable ?', a: 'Indy n\'est pas un cabinet comptable : c\'est un outil qui te guide pour tenir ta comptabilité et faire ta déclaration toi-même. Si tu préfères déléguer, Indy propose une option avec un cabinet d\'expertise comptable partenaire.' },
      { q: 'Indy gère-t-il mes réservations Airbnb ?', a: 'Non, Indy ne se connecte pas à Airbnb ou Booking. Pour suivre tes séjours, le montant brut et la commission de chaque réservation, logement par logement, utilise Mes finances dans l\'app Jason Marinho.' },
    ],
    cta: {
      titre: 'Ta compta réglée, <em>tes séjours suivis</em>',
      texte: 'Indy s\'occupe de la compta. L\'app Jason Marinho suit tes séjours, tes contrats et tes revenus bruts par logement, pour une déclaration juste.',
      btn: { label: 'Créer mon compte gratuit', href: 'https://app.jasonmarinho.com/auth/register' },
    },
    sources: [
      ['Indy, offre LMNP', 'https://www.indy.fr/lmnp/'],
      ['Indy, plateforme agréée', 'https://www.indy.fr/blog/indy-pdp/'],
      ['Facturation électronique des LMNP', 'https://www.jedeclaremonmeuble.com/facturation-electronique-lmnp-obligations/'],
      ['Régimes d\'imposition', 'https://www.impots.gouv.fr/particulier/les-regimes-dimposition'],
    ],
  },

  {
    slug: 'legalplace',
    nom: 'LegalPlace',
    mono: 'L',
    couleur: '#1D3557',
    title: 'LegalPlace : créer ta conciergerie ou ta micro-entreprise',
    description: "LegalPlace avec Jason Marinho : créer ta micro-entreprise, ta SASU ou ton EURL de conciergerie en ligne, domicilier ton entreprise. Le vrai coût en 2026 et les pièges à éviter.",
    eyebrow: 'Partenaire · Création & juridique',
    h1: 'LegalPlace : crée ta conciergerie ou ton activité <em>en ligne</em>',
    lead: "Conciergerie, équipe de ménage, photographe ou hôte qui se structure : LegalPlace crée ta micro-entreprise ou ta société en ligne et peut domicilier ton entreprise. Je te dis quel statut choisir, ce que ça coûte vraiment, et quand faire toi-même.",
    offre: {
      titre: 'Création en ligne accompagnée',
      sous: 'micro-entreprise, SASU, EURL, SAS ou SARL',
      points: [
        'Statuts générés à partir d\'un questionnaire',
        'Dossier déposé sur le guichet unique jusqu\'au Kbis',
        'Domiciliation possible pour protéger ton adresse',
      ],
      cta: { label: 'Créer ma société', href: LP_SOCIETE },
      cta2: { label: 'Créer ma micro-entreprise', href: LP_MICRO },
      note: 'Lien affilié : LegalPlace me verse une commission si tu passes par ce lien, sans aucun surcoût pour toi.',
    },
    pourquoi: {
      titre: 'Pourquoi je recommande <em>LegalPlace</em>',
      items: [
        { icon: 'clock', t: 'Du temps gagné', d: 'Un questionnaire au lieu de rédiger tes statuts et de remplir le guichet unique seul. Utile quand tu as déjà tes premiers propriétaires qui attendent.' },
        { icon: 'shield-check', t: 'Moins d\'erreurs coûteuses', d: 'L\'objet social et la répartition du capital sont les deux points qu\'on regrette le plus souvent. Selon la formule, tes statuts sont relus avant signature.' },
        { icon: 'map-pin', t: 'Ton adresse perso protégée', d: 'La domiciliation évite d\'afficher ton domicile sur tes factures, sur le Kbis et dans les annuaires d\'entreprises.' },
      ],
    },
    fonctions: {
      titre: 'Ce que LegalPlace fait <em>pour toi</em>',
      items: [
        { icon: 'user', t: 'Micro-entreprise', d: 'Pour tester une conciergerie, le ménage ou la photo sans risque.' },
        { icon: 'buildings', t: 'SASU ou EURL', d: 'Quand l\'activité se confirme et que tu veux séparer ton patrimoine.' },
        { icon: 'users-three', t: 'SAS ou SARL', d: 'Pour t\'associer, dès le départ ou plus tard.' },
        { icon: 'map-pin', t: 'Domiciliation', d: 'Une adresse pour ton siège, hors de chez toi.', href: LP_DOMICILIATION, lien: 'Domicilier mon entreprise' },
        { icon: 'pencil-simple', t: 'Modifications', d: 'Changement d\'adresse, d\'activité ou de dirigeant.' },
        { icon: 'calculator', t: 'Comptabilité', d: 'Un accompagnement comptable proposé en option.' },
      ],
    },
    etapes: [
      { t: 'Choisis ta forme', d: 'micro-entreprise pour démarrer, SASU ou EURL pour grandir (le tableau ci-dessous t\'aide).' },
      { t: 'Remplis le questionnaire', d: 'nom, activité, capital, siège : LegalPlace génère tes statuts et prépare le dossier.' },
      { t: 'Dépose ton capital et reçois ton Kbis', d: 'l\'annonce légale et l\'immatriculation sont faites, ta conciergerie peut facturer.' },
    ],
    tableau: {
      titre: 'Quelle structure <em>pour ton activité</em> ?',
      entete: ['Ton activité', 'Ce que je te conseille'],
      lignes: [
        ['Tu démarres une conciergerie, une équipe de ménage ou la photo LCD', '<span class="yes">Micro-entreprise</span> : 21,2 % de cotisations sur ton chiffre d\'affaires en 2026, jusqu\'à 83 600 € par an, sans TVA sous 37 500 €'],
        ['Plus de 8 à 10 mandats, des salariés ou des sous-traitants', '<span class="yes">SASU ou EURL</span> : charges déductibles et responsabilité limitée à tes apports'],
        ['Tu veux t\'associer', 'SAS ou SARL, avec un pacte entre associés'],
        ['Tu veux mettre un logement meublé en société', '<span class="partial">À valider avec un comptable avant tout</span> : une SCI à l\'IR qui loue en meublé de façon habituelle risque de passer à l\'impôt sur les sociétés'],
      ],
      note: 'Pour chiffrer micro-entreprise, EI ou SASU selon ce que tu veux te verser, utilise mon simulateur EI ou SASU.',
    },
    cout: {
      titre: 'Ce que ça coûte <em>vraiment</em> en 2026',
      paras: [
        'Quelle que soit la façon dont tu crées ta SASU, environ 195 € de frais sont obligatoires en 2026 d\'après LegalPlace : l\'annonce légale (142 € HT en métropole), l\'immatriculation (33,83 €) et la déclaration des bénéficiaires effectifs (19,33 €). Le dépôt du capital reste à toi.',
        'Côté accompagnement, d\'après les relevés de septembre 2026, la rédaction des statuts d\'une SASU commence autour de 99 € HT hors frais obligatoires, et une création complète revient en général entre 350 et 400 € tout compris. Les formules évoluent souvent : vérifie la grille officielle avant de choisir.',
        'La création d\'une micro-entreprise est gratuite sur le guichet unique de l\'INPI : l\'accompagnement payant se justifie seulement si tu veux être guidé ou domicilié.',
      ],
    },
    limites: [
      'Le statut ne dit pas tout : si ta conciergerie encaisse les loyers pour le compte des propriétaires, il te faut une carte G (loi Hoguet), avec une garantie financière. Si tu publies les annonces à ton nom pour louer les logements, la carte T peut être exigée. Fais valider ton modèle par un juriste.',
      'Faire toi-même reste possible et moins cher : les statuts types et le guichet unique suffisent pour une SASU simple.',
      'LegalPlace crée ta structure, il ne remplace ni un expert-comptable pour la suite, ni un conseil sur ta rémunération.',
    ],
    liens: [
      { href: '/blog/creer-societe-conciergerie-en-ligne-legalplace-2026', t: 'Créer la structure de ta conciergerie', d: 'Micro, SASU ou EURL, carte G, coûts : le guide complet.' },
      { href: '/services/simulateurs/choisir-statut-ei-sasu', t: 'Simulateur EI ou SASU', d: 'Ce qui te reste selon le statut et ta rémunération.' },
      { href: '/blog/contrat-mandat-conciergerie-lcd-modele-clauses', t: 'Le contrat de mandat', d: 'Les clauses indispensables avec chaque propriétaire.' },
      { href: '/blog/devenir-prestataire-menage-airbnb-se-lancer', t: 'Devenir prestataire ménage', d: 'Statut, tarifs et premiers clients.' },
    ],
    faq: [
      { q: 'Quel statut choisir pour une conciergerie Airbnb ?', a: 'Pour tester, la micro-entreprise : 21,2 % de cotisations sur ton chiffre d\'affaires en 2026, jusqu\'à 83 600 € par an, sans TVA tant que tu restes sous 37 500 € (seuil majoré de 41 250 €). Quand l\'activité se confirme (plus de 8 à 10 mandats, des salariés), une SASU ou une EURL permet de déduire tes charges réelles et de limiter ta responsabilité.' },
      { q: 'Combien coûte la création d\'une SASU en 2026 ?', a: 'Environ 195 € de frais obligatoires d\'après LegalPlace (annonce légale, immatriculation, déclaration des bénéficiaires effectifs), plus l\'accompagnement si tu en prends un : à partir d\'environ 99 € HT pour les statuts, souvent 350 à 400 € tout compris pour une création complète (relevés de septembre 2026).' },
      { q: 'Une conciergerie a-t-elle besoin d\'une carte professionnelle ?', a: 'Ça dépend de ton organisation, pas du statut. Si tu encaisses les loyers pour les propriétaires, il te faut une carte G (gestion immobilière). Si les voyageurs paient directement le propriétaire et que tu factures tes prestations (ménage, accueil, calendrier), tu fais de la prestation de services, sans carte.' },
      { q: 'Peut-on créer sa micro-entreprise gratuitement ?', a: 'Oui, la déclaration est gratuite sur le guichet unique de l\'INPI. LegalPlace est utile si tu veux être guidé, ou domicilier ton entreprise pour ne pas afficher ton adresse personnelle.' },
      { q: 'Faut-il une plateforme de facture électronique après la création ?', a: 'Oui, recevoir ses factures fournisseurs au format électronique via une plateforme agréée est obligatoire depuis le 1er septembre 2026. Indy le fait gratuitement.' },
    ],
    cta: {
      titre: 'Ta structure créée, <em>tes premiers mandats</em> ensuite',
      texte: 'Contrats signés en ligne, planning ménage partagé avec ton équipe, déclarations voyageurs : l\'app Jason Marinho gère le quotidien de tes logements.',
      btn: { label: 'Créer mon compte gratuit', href: 'https://app.jasonmarinho.com/auth/register' },
    },
    sources: [
      ['Cotisations et seuils de la micro-entreprise', 'https://www.economie.gouv.fr/entreprises/gerer-sa-micro-entreprise/micro-entreprises-quel-est-le-montant-de-vos-cotisations-sociales'],
      ['Coût de création d\'une SASU en 2026 (LegalPlace)', 'https://www.legalplace.fr/guides/cout-creation-sasu/'],
      ['Conciergerie et carte professionnelle', 'https://efisio.fr/conciergerie-airbnb-sans-carte-professionnelle-t-g-etes-vous-dans-lillegalite/'],
    ],
  },
]
