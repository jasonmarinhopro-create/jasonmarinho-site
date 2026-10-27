// Pages dédiées aux partenaires (façon « shine.fr/partenaire/<nom> »), rendues
// par scripts/build-pages-partenaires.mjs dans partenaires/<slug>/index.html.
//
// Règle (décision du 30/09/2026) : une page seulement pour un partenariat réel
// avec un avantage ou un accompagnement pour l'hôte (Indy, LegalPlace, et
// Lodgify depuis son code JASON15 du 01/10/2026, demande de Jason). Pas de page
// pour un outil simplement référencé, ni pour Hospitable (sa page « avis » joue
// déjà ce rôle). Brevo (PartnerStack, 06/10/2026) : page voulue par Jason,
// avantage = l'offre gratuite. AirDNA (affilié, 10/10/2026, 15 % récurrent, pas
// de code promo : avantage = données gratuites pour démarrer) et Shine (Affilae,
// 10/10/2026 : compte pro + Shine Facture, qui remplace l'ancien lien de
// parrainage limité à 2 par an) : pages demandées par Jason.
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

// ── Lodgify (affilié, code JASON15 négocié le 01/10/2026) ──
const LODGIFY_TRIAL = 'https://app.lodgify.com/signup/fr/?afmc=ui1'
const LODGIFY_DEMO = 'https://app.lodgify.com/signup/book-demo/fr/?afmc=uhv'
const LODGIFY_ONBOARDING = 'https://www.lodgify.com/fr/onboarding-gratuit/?afmc=uid'

// ── Brevo (affilié PartnerStack, 06/10/2026) : 3 liens fournis par Brevo ──
// Qonto (Affilae, affilié 3386, 12/10/2026)
const QONTO = 'https://lb.affilae.com/r/?p=5ce4f2a2b6302009e29d84f3&af=3386&lp=https%3A%2F%2Fqonto.com%2Ffr%3Futm_medium%3Daffilaefr%26utm_source%3Daffiliate%26utm_campaign%3Djason-marinho'
const BREVO_EMAIL = 'https://get.brevo.com/ui6inugm9ub6'
const BREVO_PLATFORM = 'https://get.brevo.com/3mftm80uaemx-m7y3c'
const BREVO_CRM = 'https://get.brevo.com/z0u697ij3brq-5bwioc'

// ── AirDNA (affilié, 10/10/2026) : lien d'invitation fourni par AirDNA ──
const AIRDNA = 'https://eur-invite.airdna.co/Jason-Marinho'

// ── Shine (Affilae, 10/10/2026) : compte pro (2249) et Shine Facture (2226) ──
const SHINE_PRO = 'https://www.shine.fr/?utm_source=affiliation&utm_medium=affilae&utm_campaign=jason-marinho&ae=2249'
const SHINE_FACTURE = 'https://www.shine.fr/lp/outil-facturation-gratuit/?utm_source=affilae&utm_medium=affiliation&utm_campaign=jason-marinho&utm_content=2226&ae=2226'

// ── JD2M (Affilae, numéro d'affilié 244, 17/10/2026) ──
const JD2M = 'https://www.jedeclaremonmeuble.com/offres-comptabilite-lmnp/?utm_source=affilae&utm_campaign=partenariat&utm_content=244&ae=244'

// ── Keobiz (Affilae, numéro d'affilié 936, 27/10/2026) ──
// Commission : 110 € par lead transformé (lettre de mission signée et payée),
// dernier clic, 30 jours. Aucun prix ni chiffre de taille affiché : les
// sources relevées le 27/10/2026 se contredisent (packs « dès 49 € HT/mois
// + 10 € par bien » ou 89 / 109 € HT/mois ; 17 000 ou 18 000 clients).
const KEOBIZ = 'https://www.keobiz.fr/programme-affiliation-keobiz-2/?utm_campaign=affilie936&utm_medium=lp&utm_source=affilie&ae=936'

export const PAGES = [
  {
    slug: 'lodgify',
    nom: 'Lodgify',
    mono: 'L',
    couleur: '#2E5BFF',
    title: 'Lodgify : -15 % avec le code JASON15',
    description: "Lodgify avec Jason Marinho : ton site de réservation directe relié à Airbnb, Booking.com et Vrbo, et 15 % de réduction avec le code JASON15 jusqu'au 1er octobre 2027.",
    eyebrow: 'Partenaire · Site de réservation directe',
    h1: 'Lodgify : ton site de réservation directe, <em>15 % moins cher</em>',
    lead: "Lodgify te donne ton propre site de réservation, relié à Airbnb, Booking.com et Vrbo, sans rien coder. C'est l'outil que je conseille aux hôtes qui veulent moins dépendre des plateformes, et Lodgify a créé pour toi le code JASON15.",
    offre: {
      titre: '-15 % avec JASON15',
      sous: 'sur Professional et Ultimate, en paiement annuel ou tous les 2 ans',
      points: [
        'Code valable jusqu\'au 1er octobre 2027',
        'Essai gratuit de 7 jours pour tester avant de payer',
        'Démo gratuite avec un conseiller qui applique le code',
      ],
      cta: { label: 'Essai gratuit 7 jours', href: LODGIFY_TRIAL },
      cta2: { label: 'Réserver une démo gratuite', href: LODGIFY_DEMO },
      note: 'Lien affilié : Lodgify me verse une commission si tu t\'abonnes, sans aucun surcoût pour toi. <a href="/code-promo-lodgify" style="color:inherit;text-decoration:underline">Conditions du code</a>.',
    },
    pourquoi: {
      titre: 'Pourquoi je recommande <em>Lodgify</em>',
      items: [
        { icon: 'globe', t: 'Ton site, sans coder', d: 'Un modèle, tes photos, tes tarifs : tu obtiens un site à ton nom avec moteur de réservation et paiement en ligne. C\'est ce que Lodgify fait mieux que la plupart des outils à ce prix.' },
        { icon: 'arrows-left-right', t: 'Un vrai channel manager', d: 'Connexion par API à Airbnb, Booking.com, Vrbo et Expedia : une réservation sur un canal bloque les dates partout. Tes logements peuvent aussi apparaître sur Google Vacation Rentals.' },
        { icon: 'hand-heart', t: 'Un démarrage accompagné', d: 'L\'accompagnement à la mise en place est le point le mieux noté par les utilisateurs, et Lodgify propose un onboarding gratuit.' },
      ],
    },
    fonctions: {
      titre: 'Ce que Lodgify fait pour <em>ta location</em>',
      items: [
        { icon: 'browser', t: 'Site de réservation directe', d: 'Pages logement, à propos, contact, en plusieurs langues.' },
        { icon: 'credit-card', t: 'Paiement en ligne', d: 'Stripe, PayPal ou le module de paiement Lodgify.' },
        { icon: 'calendar-check', t: 'Calendrier synchronisé', d: 'Airbnb, Booking.com, Vrbo et Expedia, sans double réservation.' },
        { icon: 'google-logo', t: 'Google Vacation Rentals', d: 'Tes logements visibles dans Google Search, Maps et Travel.' },
        { icon: 'chats', t: 'Messagerie et automatisations', d: 'Messages des plateformes regroupés, envois automatiques.' },
        { icon: 'rocket', t: 'Onboarding gratuit', d: 'Lodgify t\'accompagne pour la mise en place.', href: LODGIFY_ONBOARDING, lien: 'Demander l\'onboarding' },
      ],
    },
    etapes: [
      { t: 'Teste Lodgify', d: 'avec l\'essai gratuit de 7 jours, ou la démo gratuite si tu veux qu\'un conseiller te montre l\'outil sur ton logement.' },
      { t: 'Construis ton site et connecte tes plateformes', d: 'puis vérifie calendrier, tarifs et frais de ménage sur chaque plateforme juste après la connexion.' },
      { t: 'Souscris en annuel ou pour 2 ans avec JASON15', d: 'sur Professional ou Ultimate : 15 % de moins sur tout ton abonnement.' },
    ],
    tableau: {
      titre: 'Lodgify est-il fait <em>pour toi</em> ?',
      entete: ['Ta situation', 'Mon conseil'],
      lignes: [
        ['1 à 5 logements, tu veux ton propre site et moins dépendre d\'Airbnb et Booking', '<span class="yes">Oui, c\'est le cœur de cible</span> : Professional avec JASON15'],
        ['Gîte, chambre d\'hôtes, petite conciergerie qui veut une vraie présence web', '<span class="yes">Oui</span>'],
        ['Tu veux seulement synchroniser Airbnb et Booking, sans site', '<span class="partial">Possible</span>, mais Smoobu est plus simple (<a href="/comparatif-lodgify-smoobu">comparatif</a>)'],
        ['Tu veux surtout automatiser messages et avis', 'Hospitable va plus loin sur ce point (<a href="/hospitable-avis">mon avis</a>)'],
        ['Petit budget, tu démarres', 'Starter coûte moins cher, mais le code ne s\'y applique pas'],
      ],
      note: 'Pour décider entre les formules, voir <a href="/lodgify-prix">le détail des prix Lodgify</a> et son calculateur de rentabilité.',
    },
    cout: {
      titre: 'Ce que ça coûte <em>avec le code</em>',
      paras: [
        'Lodgify facture par logement. D\'après les prix relevés en août 2026 en facturation annuelle : environ 13 € par logement et par mois pour Starter, 33 € pour Professional et 49 € pour Ultimate. Avec JASON15, Professional revient à environ 28 € et Ultimate à environ 42 € par logement et par mois.',
        'Exemple : 2 logements en Professional, payés à l\'année, coûtent environ 792 € par an. Avec le code, tu économises environ 119 € et paies environ 673 €. Le calcul pour ton cas est sur <a href="/code-promo-lodgify">la page du code promo</a>.',
        'Le paiement mensuel coûte environ 15 à 30 % de plus que l\'annuel et n\'ouvre pas droit au code. La grille Lodgify change souvent : le prix exact est celui affiché au moment de souscrire.',
      ],
    },
    limites: [
      'Le prix est par logement : raisonnable pour 1 à 3 logements, beaucoup plus lourd au-delà de 10.',
      'Le support après le démarrage est le reproche qui revient le plus dans les avis : très bien noté pendant l\'onboarding, plus inégal ensuite.',
      'Des erreurs de correspondance sont signalées après la connexion d\'une nouvelle plateforme : vérifie calendriers et tarifs juste après chaque connexion.',
      'Un site ne fait pas venir de voyageurs tout seul : sans action de ta part (anciens voyageurs, Google, réseaux sociaux), il restera vide.',
    ],
    liens: [
      { href: '/code-promo-lodgify', t: 'Le code JASON15 en détail', d: 'Conditions, mode d\'emploi et calcul de ton économie.' },
      { href: '/lodgify-avis', t: 'Mon avis complet sur Lodgify', d: 'Points forts, limites et avis d\'utilisateurs.' },
      { href: '/lodgify-prix', t: 'Les prix Lodgify', d: 'Formules, frais et calculateur de rentabilité.' },
      { href: '/tutoriel-lodgify-site-reservation-directe', t: 'Créer ton site avec Lodgify', d: 'Le tutoriel en 9 étapes.' },
    ],
    faq: [
      { q: 'Existe-t-il un code promo Lodgify ?', a: 'Oui : le code JASON15 donne 15 % de réduction sur les formules Professional et Ultimate, en paiement annuel ou tous les 2 ans, jusqu\'au 1er octobre 2027. Il ne s\'applique ni au paiement mensuel ni à la formule Starter.' },
      { q: 'Où saisir le code JASON15 ?', a: 'Au moment de souscrire ton abonnement annuel ou de 2 ans. Si tu ne trouves pas où le saisir, donne-le au conseiller pendant la démo gratuite : il peut l\'appliquer à ta souscription.' },
      { q: 'Lodgify est-il gratuit à l\'essai ?', a: 'Oui, Lodgify propose un essai gratuit de 7 jours et une démo gratuite avec un conseiller. Prépare tes photos, descriptions et tarifs avant de lancer l\'essai pour en profiter vraiment.' },
      { q: 'Lodgify ou Smoobu ?', a: 'Lodgify si tu veux ton propre site de réservation directe et construire ta marque. Smoobu si tu veux surtout synchroniser plusieurs plateformes simplement, pour moins cher.' },
      { q: 'Lodgify fait-il venir des voyageurs sur mon site ?', a: 'Lodgify diffuse tes logements sur Google Vacation Rentals, mais le site ne se remplit pas tout seul : il faut y amener tes anciens voyageurs, du trafic Google et tes réseaux sociaux. C\'est l\'objet de la formation Réservation directe.' },
    ],
    cta: {
      titre: 'Ton site direct, <em>tes contrats signés</em>',
      texte: 'Lodgify t\'apporte le site. L\'app Jason Marinho ajoute le contrat signé en ligne, la caution par empreinte de carte, le planning ménage et les déclarations voyageurs.',
      btn: { label: 'Créer mon compte gratuit', href: 'https://app.jasonmarinho.com/auth/register' },
    },
    sources: [
      ['Grille tarifaire Lodgify', 'https://www.lodgify.com/fr/tarifs/'],
      ['Avis Lodgify sur Capterra', 'https://www.capterra.com/p/131924/Lodgify/reviews/'],
      ['Avis Lodgify sur Trustpilot', 'https://fr.trustpilot.com/review/lodgify.com'],
    ],
  },

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
      titre: 'Réduction avec JASON15',
      sous: 'sur ta création en ligne : micro-entreprise, SASU, EURL, SAS ou SARL',
      points: [
        'Code JASON15 à saisir au moment du paiement',
        'Statuts générés à partir d\'un questionnaire',
        'Dossier déposé sur le guichet unique jusqu\'au Kbis',
        'Domiciliation possible pour protéger ton adresse',
      ],
      cta: { label: 'Créer ma société', href: LP_SOCIETE },
      cta2: { label: 'Créer ma micro-entreprise', href: LP_MICRO },
      note: 'Lien affilié : LegalPlace me verse une commission si tu passes par ce lien, sans aucun surcoût pour toi. Le montant de la réduction s\'affiche au paiement.',
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
      { t: 'Remplis le questionnaire', d: 'nom, activité, capital, siège : LegalPlace génère tes statuts et prépare le dossier. Saisis le code JASON15 au paiement.' },
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
      { q: 'Existe-t-il un code promo LegalPlace ?', a: 'Oui : le code JASON15, créé par LegalPlace pour les lecteurs du site, donne une réduction sur ta création en ligne. Saisis-le au moment du paiement : le montant de la réduction s\'affiche avant que tu valides.' },
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
  {
    slug: 'brevo',
    releve: 'octobre 2026',
    nom: 'Brevo',
    mono: 'B',
    couleur: '#0B996E',
    title: 'Brevo : newsletter et CRM gratuits pour ta LCD',
    description: "Brevo avec Jason Marinho : la newsletter à tes voyageurs en direct et le CRM de ta conciergerie, gratuits pour démarrer. Ce qui est permis, ce que ça coûte, les limites.",
    eyebrow: 'Partenaire · E-mailing & CRM',
    h1: 'Brevo : écris à tes voyageurs en direct, <em>gratuitement</em>',
    lead: "Brevo (ex-Sendinblue) est la plateforme française d'e-mailing et de CRM. J'y envoie ma propre newsletter, et c'est l'outil que je conseille pour garder le lien avec tes voyageurs venus en direct ou suivre les propriétaires de ta conciergerie : l'offre gratuite suffit pour démarrer.",
    offre: {
      titre: 'Gratuit pour démarrer',
      sous: '300 e-mails par jour, contacts illimités, sans carte bancaire',
      points: [
        'Newsletter, formulaire d\'inscription et statistiques inclus',
        'CRM gratuit pour suivre tes prospects et tes clients',
        'Entreprise française, données hébergées en Europe',
      ],
      cta: { label: 'Créer mon compte gratuit', href: BREVO_PLATFORM },
      cta2: { label: 'Essayer le CRM gratuit', href: BREVO_CRM },
      note: 'Lien affilié : Brevo me verse une commission si tu t\'inscris via ces liens, sans aucun surcoût pour toi.',
    },
    pourquoi: {
      titre: 'Pourquoi je recommande <em>Brevo</em>',
      items: [
        { icon: 'envelope-simple', t: 'Je l\'utilise moi-même', d: 'La newsletter de jasonmarinho.com passe par Brevo : inscriptions, envois, désinscriptions gérées toutes seules.' },
        { icon: 'shield-check', t: 'Français et hébergé en Europe', d: 'Tes listes de voyageurs restent dans l\'Union européenne, avec un contrat de traitement des données conforme au RGPD.' },
        { icon: 'piggy-bank', t: 'Une vraie offre gratuite', d: '300 e-mails par jour et des contacts illimités : de quoi envoyer une lettre par saison à des centaines de voyageurs sans payer.' },
      ],
    },
    fonctions: {
      titre: 'Ce que Brevo fait pour <em>ton activité</em>',
      items: [
        { icon: 'newspaper', t: 'Newsletter', d: 'Éditeur glisser-déposer, modèles, envoi programmé.', href: BREVO_EMAIL, lien: 'Commencer ma newsletter' },
        { icon: 'clipboard-text', t: 'Formulaire d\'inscription', d: 'À mettre sur ton site direct ou ton livret d\'accueil, avec double confirmation.' },
        { icon: 'chart-bar', t: 'Statistiques', d: 'Ouvertures, clics, désinscriptions de chaque envoi.' },
        { icon: 'kanban', t: 'CRM gratuit', d: 'Pipeline de prospects, tâches et rappels, jusqu\'à 50 opportunités ouvertes.', href: BREVO_CRM, lien: 'Essayer le CRM' },
        { icon: 'lightning', t: 'Automatisations', d: 'Un e-mail de bienvenue dès qu\'un voyageur s\'inscrit, selon la formule.' },
        { icon: 'device-mobile', t: 'SMS et WhatsApp', d: 'En option, payés à l\'envoi, pour une offre de dernière minute.' },
      ],
    },
    etapes: [
      { t: 'Crée ton compte gratuit', d: 'et envoie depuis une adresse à ton nom (idéalement ton propre domaine, que Brevo t\'aide à authentifier pour arriver en boîte de réception).' },
      { t: 'Construis ta liste avec tes voyageurs directs', d: 'ceux qui ont réservé chez toi (site, Driing, contrat signé en ligne) et ont pu refuser, plus un formulaire d\'inscription sur ton site et dans ton livret.' },
      { t: 'Envoie une lettre par saison', d: 'dates encore libres, nouveautés du logement, tarif fidélité en direct : simple et régulier, puis regarde ce qui fait cliquer.' },
    ],
    tableau: {
      titre: 'Brevo est-il fait <em>pour toi</em> ?',
      entete: ['Ta situation', 'Mon conseil'],
      lignes: [
        ['Tu as des voyageurs en direct (site, Driing, contrats) et tu veux qu\'ils reviennent', '<span class="yes">Oui</span> : l\'offre gratuite suffit largement'],
        ['Conciergerie qui prospecte et suit des propriétaires', '<span class="yes">Oui</span> : CRM gratuit et lettre aux propriétaires dans le même outil'],
        ['Photographe ou équipe de ménage qui veut écrire à ses hôtes clients', '<span class="yes">Oui</span>, avec un lien de désinscription dans chaque e-mail (fait par Brevo)'],
        ['Tes voyageurs viennent tous d\'Airbnb ou de Booking.com', '<span class="partial">Pas encore</span> : les plateformes interdisent de leur écrire hors messagerie. Commence par la <a href="/blog/location-directe-pourquoi-saffranchir-plateformes">réservation directe</a>'],
        ['Gros volume, automatisations poussées, plusieurs utilisateurs', 'Formule payante : compare avec la grille officielle'],
      ],
      note: 'Rappel : une adresse collectée sur Airbnb ou Booking.com ne doit jamais entrer dans ta liste, même si le voyageur était ravi.',
    },
    cout: {
      titre: 'Ce que ça <em>coûte</em>',
      paras: [
        'L\'offre gratuite permet 300 e-mails par jour, avec des contacts illimités et sans carte bancaire. Pour une newsletter mensuelle à quelques centaines de voyageurs, tu n\'as pas besoin de plus : il suffit d\'étaler l\'envoi sur deux jours si ta liste dépasse 300 adresses.',
        'Les offres payantes se paient selon le nombre d\'e-mails envoyés par mois, pas selon le nombre de contacts. Elles démarrent à moins de 10 € par mois d\'après les relevés d\'octobre 2026 et retirent notamment le logo Brevo des e-mails. Le CRM a son offre gratuite (un utilisateur, un pipeline) et des offres payantes à part.',
        'La grille change régulièrement : le prix exact est celui affiché par Brevo au moment de souscrire.',
      ],
    },
    limites: [
      'En gratuit, le logo Brevo apparaît en bas de tes e-mails et l\'envoi est plafonné à 300 par jour.',
      'Sans domaine authentifié (SPF, DKIM), une partie des e-mails peut finir en indésirables : prends 15 minutes pour le configurer.',
      'Brevo ne crée pas ta liste : sans réservations directes, tu n\'auras personne à qui écrire légalement.',
      'L\'outil fait beaucoup de choses (marketing, CRM, conversations, SMS) : l\'interface peut dérouter au début, commence par la newsletter seule.',
    ],
    liens: [
      { href: '/blog/email-marketing-newsletter-hote-lcd', t: 'Ta newsletter en 1 heure', d: 'Ce qui est permis, la structure qui marche, les chiffres à suivre.' },
      { href: '/blog/base-voyageurs-fideles-location-directe-durable', t: 'Une base de voyageurs fidèles', d: 'Collecter les contacts légalement et faire revenir tes voyageurs.' },
      { href: '/blog/prospection-conciergerie-trouver-premier-mandat', t: 'Trouver tes premiers mandats', d: 'Les canaux de prospection d\'une conciergerie.' },
      { href: '/services/contrats', t: 'Tes réservations directes signées', d: 'Contrat en ligne, paiement et caution dans l\'app.' },
    ],
    faq: [
      { q: 'Brevo est-il vraiment gratuit ?', a: 'Oui : l\'offre gratuite permet d\'envoyer 300 e-mails par jour à un nombre illimité de contacts, sans carte bancaire et sans limite de durée. Le logo Brevo apparaît en bas des e-mails. Les offres payantes ajoutent du volume et retirent ce logo.' },
      { q: 'Puis-je envoyer ma newsletter aux voyageurs Airbnb ou Booking ?', a: 'Non. Airbnb et Booking.com interdisent d\'utiliser les coordonnées de leurs voyageurs pour du marketing (l\'adresse est d\'ailleurs masquée), sous peine de suspension du compte. Ta liste se construit avec tes voyageurs en direct et un formulaire d\'inscription sur ton site ou dans ton livret d\'accueil.' },
      { q: 'Ai-je besoin du consentement de mes voyageurs directs ?', a: 'Pour un voyageur qui a déjà réservé chez toi en direct, tu peux lui proposer un nouveau séjour si tu lui as donné la possibilité de refuser au moment de la réservation, puis dans chaque e-mail (article L34-5 du Code des postes et des communications électroniques). Pour tous les autres, il faut une inscription volontaire. Ne partage jamais ta liste avec un partenaire.' },
      { q: 'Brevo, c\'est Sendinblue ?', a: 'Oui, Sendinblue est devenu Brevo en 2023. C\'est une entreprise française, basée à Paris, qui héberge les données de ses clients dans l\'Union européenne.' },
      { q: 'Brevo ou Mailchimp ?', a: 'Pour un hôte en France, Brevo : interface en français, données en Europe et offre gratuite calculée sur les envois plutôt que sur le nombre de contacts. Mailchimp reste très complet mais son offre gratuite est plafonnée en contacts.' },
    ],
    cta: {
      titre: 'Des voyageurs en direct, <em>une liste qui grandit</em>',
      texte: 'L\'app Jason Marinho gère tes réservations directes : contrat signé en ligne, paiement, caution par empreinte, carnet de voyageurs. Brevo s\'occupe de les faire revenir.',
      btn: { label: 'Créer mon compte gratuit', href: 'https://app.jasonmarinho.com/auth/register' },
    },
    sources: [
      ['Grille tarifaire Brevo', 'https://www.brevo.com/fr/pricing/'],
      ['Le CRM de Brevo', 'https://www.brevo.com/fr/crm-en-ligne/'],
      ['CNIL : la prospection commerciale par courrier électronique', 'https://www.cnil.fr/fr/la-prospection-commerciale-par-courrier-electronique'],
      ['Booking.com : adresses e-mail des voyageurs masquées', 'https://partner.booking.com/en-us/help/reservations/communicate-guests/why-does-guests-email-address-end-guestbookingcom'],
    ],
  },
  {
    slug: 'airdna',
    releve: 'octobre 2026',
    nom: 'AirDNA',
    mono: 'A',
    couleur: '#E11D48',
    title: 'AirDNA : les vrais chiffres de ton marché LCD',
    description: "AirDNA avec Jason Marinho : occupation, prix moyen et revenus des locations de courte durée de ta ville avant d'acheter ou de fixer tes prix. Ce que ça coûte, les limites.",
    eyebrow: 'Partenaire · Étude de marché',
    h1: 'AirDNA : regarde <em>les vrais chiffres</em> avant de te lancer',
    lead: "AirDNA suit les annonces Airbnb et Vrbo dans le monde entier et en tire l'occupation, le prix moyen par nuit et les revenus de chaque marché. C'est l'outil que je conseille avant d'acheter un bien, de signer un mandat de conciergerie ou de fixer tes prix : tu peux commencer gratuitement.",
    offre: {
      titre: 'Gratuit pour démarrer',
      sous: 'Explore les chiffres de ta ville sans carte bancaire',
      points: [
        'Occupation, prix moyen et revenus par ville et par quartier',
        'Estimation des revenus d\'une adresse précise (Rentalizer)',
        'Formules payantes seulement si tu veux aller plus loin',
      ],
      cta: { label: 'Créer mon compte AirDNA', href: AIRDNA },
      note: 'Lien affilié : AirDNA me verse une commission si tu prends une formule payante via ce lien, sans aucun surcoût pour toi.',
    },
    pourquoi: {
      titre: 'Pourquoi je recommande <em>AirDNA</em>',
      items: [
        { icon: 'globe-hemisphere-west', t: 'La référence du marché', d: 'AirDNA annonce suivre plus de 10 millions d\'annonces dans 120 000 marchés : la France y est bien couverte, petites villes comprises.' },
        { icon: 'magnifying-glass', t: 'Des chiffres avant la décision', d: 'Acheter un bien, reprendre une location ou signer un mandat : tu vérifies le potentiel réel du quartier au lieu de croire une annonce d\'agence.' },
        { icon: 'piggy-bank', t: 'Une offre gratuite utile', d: 'Pour un premier logement, l\'offre gratuite suffit souvent à situer ton prix et ta saison haute.' },
      ],
    },
    fonctions: {
      titre: 'Ce qu\'AirDNA fait pour <em>ton activité</em>',
      items: [
        { icon: 'chart-line-up', t: 'Données de marché', d: 'Occupation, prix moyen par nuit (ADR), revenu par logement (RevPAR), mois par mois.', href: AIRDNA, lien: 'Voir ma ville' },
        { icon: 'calculator', t: 'Rentalizer', d: 'Tape une adresse et un type de logement : revenu annuel, occupation et prix estimés, avec les annonces comparables autour.' },
        { icon: 'calendar-dots', t: 'Saisonnalité', d: 'Les mois forts et les creux de ton marché pour placer tes prix et tes séjours minimum.' },
        { icon: 'users-three', t: 'Concurrence', d: 'Les annonces comparables à la tienne : prix, occupation, équipements, notes.' },
        { icon: 'buildings', t: 'Comparer des villes', d: 'Pour un investisseur qui hésite entre plusieurs villes ou quartiers.' },
        { icon: 'file-text', t: 'Rapports à partager', d: 'Un rapport chiffré à montrer à ta banque ou à un propriétaire que tu veux convaincre.' },
      ],
    },
    etapes: [
      { t: 'Crée ton compte gratuit', d: 'puis cherche ta ville ou ton quartier : tu vois tout de suite l\'occupation et le prix moyen du marché.' },
      { t: 'Teste ton adresse dans le Rentalizer', d: 'avec le bon nombre de chambres et de voyageurs. Compare l\'estimation à tes propres chiffres ou au loyer d\'une location classique.' },
      { t: 'Recoupe avec nos outils gratuits', d: 'le <a href="/calculateurs/revenus-lcd">simulateur de revenus</a> et la <a href="/services/actualites">réglementation de ta ville</a> (90 jours, changement d\'usage) avant toute décision.' },
    ],
    tableau: {
      titre: 'AirDNA est-il fait <em>pour toi</em> ?',
      entete: ['Ta situation', 'Mon conseil'],
      lignes: [
        ['Tu veux acheter un bien pour le louer en courte durée', '<span class="yes">Oui</span> : c\'est là qu\'AirDNA rapporte le plus, une erreur d\'achat coûte des années'],
        ['Conciergerie qui démarche des propriétaires', '<span class="yes">Oui</span> : un rapport chiffré crédibilise ton estimation de revenus'],
        ['Hôte avec un logement qui veut situer son prix', '<span class="partial">L\'offre gratuite suffit</span> : regarde le prix moyen et la saisonnalité de ton quartier'],
        ['Tu loues surtout sur Booking.com', '<span class="partial">À nuancer</span> : AirDNA s\'appuie sur Airbnb et Vrbo, ton marché réel peut différer'],
        ['Tu veux une tarification automatique au quotidien', 'Un outil de prix dynamique (PriceLabs, Beyond) est plus adapté'],
      ],
      note: 'Les chiffres d\'AirDNA sont des estimations : ils donnent un ordre de grandeur fiable, pas une promesse de revenus.',
    },
    cout: {
      titre: 'Ce que ça <em>coûte</em>',
      paras: [
        'L\'offre gratuite permet d\'explorer les chiffres des marchés et de tester des adresses, avec des limites (historique et nombre d\'estimations). Pour un premier logement ou une vérification ponctuelle, c\'est souvent assez.',
        'Les formules payantes sont facturées en dollars, beaucoup moins chères à l\'année qu\'au mois : d\'après les relevés d\'octobre 2026, environ 34 $ par mois à l\'année (400 $) ou 125 $ au mois pour l\'étude de marché, environ 50 $ par mois à l\'année (600 $) ou 150 $ au mois pour la formule hôte. Les sources divergent : le prix exact est celui affiché par AirDNA au moment de souscrire.',
        'Mon conseil : pour un achat, un mois payant au bon moment suffit souvent. Pense à résilier ensuite si tu n\'en as plus besoin.',
      ],
    },
    limites: [
      'Les chiffres sont estimés à partir des annonces publiques : comptez une marge d\'erreur, surtout dans les petits marchés avec peu d\'annonces.',
      'Booking.com n\'est pas dans les données : un marché très Booking peut être mal représenté.',
      'AirDNA ne connaît pas la réglementation de ta ville : un bon chiffre ne vaut rien si la location y est plafonnée ou soumise à compensation.',
      'Interface et prix en anglais et en dollars pour une bonne partie du site.',
    ],
    liens: [
      { href: '/blog/airdna-mode-emploi-hote-lcd-debutant', t: 'AirDNA, mode d\'emploi', d: 'Fixer ton prix de départ avec les données du marché.' },
      { href: '/comparatif-airdna-mashvisor', t: 'AirDNA ou Mashvisor ?', d: 'Le comparatif complet des deux outils d\'étude de marché.' },
      { href: '/blog/acheter-appartement-lcd-7-criteres-rentabilite-avant-signer', t: 'Acheter pour la courte durée', d: 'Les 7 critères à vérifier avant de signer.' },
      { href: '/calculateurs/revenus-lcd', t: 'Simulateur de revenus', d: 'Une première estimation gratuite, ville par ville.' },
    ],
    faq: [
      { q: 'AirDNA est-il gratuit ?', a: 'Oui pour démarrer : l\'offre gratuite permet d\'explorer les chiffres des marchés et de tester des adresses, avec des limites. Les formules payantes ajoutent l\'historique complet, plus d\'estimations et les analyses détaillées.' },
      { q: 'Les chiffres d\'AirDNA sont-ils fiables ?', a: 'Ce sont des estimations calculées à partir des annonces publiques Airbnb et Vrbo. Elles donnent un bon ordre de grandeur, surtout dans les marchés où il y a beaucoup d\'annonces, mais pas un chiffre garanti. Recoupe toujours avec les annonces voisines et ta propre expérience.' },
      { q: 'AirDNA marche-t-il en France ?', a: 'Oui. La France est bien couverte, des grandes villes aux zones touristiques. Certaines fonctions (biens à vendre, par exemple) ne concernent que les États-Unis.' },
      { q: 'Y a-t-il un code promo AirDNA ?', a: 'Non, je n\'ai pas de code promo. Mon lien ne te coûte rien de plus et me permet d\'être rémunéré si tu prends une formule payante.' },
      { q: 'AirDNA ou PriceLabs ?', a: 'Ils ne font pas la même chose. AirDNA sert à étudier un marché (avant d\'acheter, de signer un mandat ou de fixer un prix de départ). PriceLabs ajuste tes prix tous les jours, logement par logement. Beaucoup d\'hôtes utilisent les deux.' },
    ],
    cta: {
      titre: 'Des chiffres du marché <em>à ta gestion au quotidien</em>',
      texte: 'Une fois ton logement lancé, l\'app Jason Marinho suit tes revenus réels, ton occupation et ta fiscalité, logement par logement, et l\'espace investisseur compare tes projets.',
      btn: { label: 'Créer mon compte gratuit', href: 'https://app.jasonmarinho.com/auth/register' },
    },
    sources: [
      ['Grille tarifaire AirDNA', 'https://www.airdna.co/pricing'],
      ['AirDNA Rentalizer', 'https://www.airdna.co/vacation-rental-income-estimator'],
      ['Méthodologie des données AirDNA', 'https://www.airdna.co/airdna-data-methodology'],
    ],
  },
  {
    slug: 'shine',
    releve: 'octobre 2026',
    nom: 'Shine',
    mono: 'S',
    couleur: '#1F2937',
    title: 'Shine : compte pro et factures gratuites pour ta LCD',
    description: "Shine avec Jason Marinho : un compte pro pour séparer tes revenus de location, et Shine Facture, l'outil gratuit de devis et factures. Offres, prix, limites.",
    eyebrow: 'Partenaire · Banque & facturation',
    h1: 'Shine : un compte pro et <em>des factures gratuites</em>',
    lead: "Shine est une néobanque pro française, filiale de la Société Générale, utilisée par plus de 120 000 entreprises. Je la conseille pour séparer tes revenus de location de ton compte perso, et Shine Facture pour les conciergeries, équipes de ménage et photographes qui font des devis et des factures.",
    offre: {
      titre: 'Compte pro dès 0 €',
      sous: 'Ouverture en ligne en quelques minutes, sans engagement',
      points: [
        'Carte Mastercard Business et IBAN français',
        'Shine Facture : devis et factures gratuits',
        'Service client 7 jours sur 7',
      ],
      cta: { label: 'Ouvrir mon compte Shine', href: SHINE_PRO },
      cta2: { label: 'Essayer Shine Facture', href: SHINE_FACTURE },
      note: 'Lien affilié : Shine me verse une commission si tu ouvres un compte ou utilises Shine Facture via ces liens, sans aucun surcoût pour toi.',
    },
    pourquoi: {
      titre: 'Pourquoi je recommande <em>Shine</em>',
      items: [
        { icon: 'split-horizontal', t: 'Tes revenus enfin séparés', d: 'Virements Airbnb, Booking.com et paiements directs arrivent sur un seul compte : ta déclaration et ton suivi par logement deviennent simples.' },
        { icon: 'bank', t: 'Une banque solide', d: 'Filiale de la Société Générale, IBAN français, fonds protégés selon les règles des établissements de paiement.' },
        { icon: 'receipt', t: 'La facturation incluse', d: 'Devis, factures et relances depuis Shine Facture, gratuitement : utile dès que tu factures des clients (conciergerie, ménage, photo).' },
      ],
    },
    fonctions: {
      titre: 'Ce que Shine fait pour <em>ton activité</em>',
      items: [
        { icon: 'credit-card', t: 'Compte et carte pro', d: 'IBAN français, carte Mastercard Business, paiements et retraits.', href: SHINE_PRO, lien: 'Voir les offres' },
        { icon: 'file-text', t: 'Shine Facture', d: 'Devis et factures, envoi par e-mail, relances automatiques, suivi des paiements.', href: SHINE_FACTURE, lien: 'Essayer gratuitement' },
        { icon: 'arrows-left-right', t: 'Virements', d: 'Virements SEPA, groupés selon l\'offre, pour payer ton équipe de ménage ou tes prestataires.' },
        { icon: 'money', t: 'Chèques et espèces', d: 'Encaissement de chèques et dépôt d\'espèces, utiles pour une caution ou une taxe de séjour réglée sur place.' },
        { icon: 'calculator', t: 'Compta simplifiée', d: 'Justificatifs photographiés, catégories, accès pour ton comptable.' },
        { icon: 'storefront', t: 'Création d\'entreprise', d: 'Accompagnement à la création (micro, SASU, SARL) et dépôt du capital en ligne.' },
      ],
    },
    etapes: [
      { t: 'Ouvre ton compte en ligne', d: 'avec ta pièce d\'identité et ton numéro SIREN (micro-entreprise, LMNP immatriculé ou société).' },
      { t: 'Change ton IBAN sur tes plateformes', d: 'Airbnb, Booking.com, Stripe pour tes contrats directs : tous tes encaissements arrivent au même endroit.' },
      { t: 'Facture depuis Shine Facture si tu as des clients', d: 'propriétaires de ta conciergerie, hôtes de ton équipe de ménage ou de photo : devis, facture, relance.' },
    ],
    tableau: {
      titre: 'Shine est-il fait <em>pour toi</em> ?',
      entete: ['Ta situation', 'Mon conseil'],
      lignes: [
        ['Hôte en LMNP qui mélange revenus de location et dépenses perso', '<span class="yes">Oui</span> : un compte dédié simplifie ta déclaration, même s\'il n\'est pas obligatoire en nom propre'],
        ['Micro-entrepreneur (conciergerie, ménage, photo)', '<span class="yes">Oui</span> : un compte dédié à ton activité devient obligatoire au-delà de 10 000 € de chiffre d\'affaires deux années civiles de suite'],
        ['Tu crées une société (SASU, SARL, SCI)', '<span class="yes">Oui</span> : dépôt du capital et compte de la société au même endroit'],
        ['Tu as besoin d\'un crédit immobilier ou d\'un découvert', '<span class="partial">Pas ici</span> : une néobanque ne fait pas de prêt, garde ta banque pour ton financement'],
        ['Tu factures avec TVA ou tu dois émettre des factures électroniques en 2027', 'Vérifie que l\'outil choisi est plateforme agréée, ou compare avec <a href="/partenaires/indy">Indy</a>'],
      ],
      note: 'Les règles du compte dédié pour les micro-entrepreneurs : article L613-10 du Code de la sécurité sociale.',
    },
    cout: {
      titre: 'Ce que ça <em>coûte</em>',
      paras: [
        'Shine propose une offre Free à 0 €, puis des offres payantes (Start, Plus, Business) facturées au mois ou à l\'année, avec plus de virements, de cartes et de services. D\'après les relevés d\'octobre 2026, elles vont d\'environ 9 € à 80 € HT par mois selon l\'offre et la durée d\'engagement, et un essai gratuit est proposé.',
        'Shine Facture est gratuit pour les devis et les factures ; des formules payantes ajoutent des options à partir d\'environ 9 € par mois.',
        'Les grilles ont changé plusieurs fois en 2026 : le prix exact est celui affiché par Shine au moment de souscrire.',
      ],
    },
    limites: [
      'Pas de prêt immobilier ni de découvert : garde une banque traditionnelle si tu finances un achat.',
      'Les offres d\'entrée limitent le nombre de virements et de dépôts gratuits : regarde ton volume réel avant de choisir.',
      'Néobanque = pas d\'agence : tout se fait dans l\'application (le service client répond 7 jours sur 7).',
      'Shine n\'est pas la seule option : Qonto, Blank ou Indy (compte pro) répondent au même besoin, compare selon tes usages.',
    ],
    liens: [
      { href: '/blog/compte-bancaire-pro-hote-lcd-6-raisons-choisir-2026', t: 'Pourquoi un compte pro ?', d: 'Les 6 raisons de séparer tes revenus de location.' },
      { href: '/partenaires/qonto', t: 'Qonto, l\'autre compte pro', d: 'Pour une société ou plusieurs utilisateurs.' },
      { href: '/blog/creer-societe-conciergerie-en-ligne-legalplace-2026', t: 'Créer ta conciergerie', d: 'Micro-entreprise ou société : le bon statut.' },
      { href: '/services/contrats', t: 'Tes réservations directes payées', d: 'Contrat en ligne, loyer et caution versés sur ton compte.' },
    ],
    faq: [
      { q: 'Un compte pro est-il obligatoire pour louer en LMNP ?', a: 'Non, pas en nom propre : la loi n\'oblige pas un loueur en meublé non professionnel à ouvrir un compte pro. C\'est fortement conseillé pour séparer tes revenus et tes dépenses de location. En revanche, un micro-entrepreneur doit avoir un compte dédié à son activité au-delà de 10 000 € de chiffre d\'affaires deux années de suite.' },
      { q: 'Shine est-elle une vraie banque ?', a: 'Shine est un établissement de paiement, filiale de la Société Générale. Ton compte a un IBAN français et ton argent est cantonné, c\'est-à-dire tenu à part des fonds propres de Shine, comme l\'exige la règle des établissements de paiement. Shine ne fait pas de crédit.' },
      { q: 'Shine Facture est-il vraiment gratuit ?', a: 'Oui pour l\'essentiel : devis et factures, envoi par e-mail, relances et suivi des paiements. Des formules payantes ajoutent des options. Vérifie les limites de l\'offre gratuite au moment de t\'inscrire.' },
      { q: 'Puis-je recevoir mes virements Airbnb et Booking sur Shine ?', a: 'Oui : il suffit de renseigner l\'IBAN Shine comme moyen de versement dans Airbnb, Booking.com et Stripe. Les virements arrivent comme sur n\'importe quel compte.' },
      { q: 'Shine ou Qonto ?', a: 'Les deux répondent au même besoin. Shine a une offre gratuite et un outil de facturation gratuit, Qonto vise davantage les sociétés avec plusieurs utilisateurs. Compare selon ton volume de virements et tes besoins de cartes.' },
    ],
    cta: {
      titre: 'Un compte pro, <em>des chiffres clairs</em>',
      texte: 'L\'app Jason Marinho suit tes revenus logement par logement, prépare tes contrats directs avec paiement en ligne et t\'aide à déclarer tes revenus.',
      btn: { label: 'Créer mon compte gratuit', href: 'https://app.jasonmarinho.com/auth/register' },
    },
    sources: [
      ['Tarifs Shine', 'https://www.shine.fr/tarifs/'],
      ['Shine Facture', 'https://www.shine.fr/lp/outil-facturation-gratuit/'],
      ['Service-Public.fr : compte bancaire du micro-entrepreneur (article L613-10 du Code de la sécurité sociale)', 'https://entreprendre.service-public.gouv.fr/vosdroits/F35991'],
    ],
  },
  {
    slug: 'qonto',
    releve: 'octobre 2026',
    nom: 'Qonto',
    mono: 'Q',
    couleur: '#111827',
    title: 'Qonto : compte pro et facturation pour ta LCD',
    description: "Qonto avec Jason Marinho : compte pro en ligne, cartes, facturation électronique et lien avec ton comptable pour ta location courte durée. Prix, avantages, limites.",
    eyebrow: 'Partenaire · Banque & facturation',
    h1: 'Qonto : ton compte pro <em>et ta gestion financière</em> au même endroit',
    lead: "Qonto est un compte pro en ligne lancé en France en 2017 et utilisé, d'après les relevés de 2026, par environ 600 000 entreprises en Europe. Je le conseille aux conciergeries, aux hôtes en société et à ceux qui veulent tout réunir dans une seule application : compte, cartes, factures, justificatifs et accès pour le comptable.",
    offre: {
      titre: 'Compte pro dès 9 € HT/mois',
      sous: "Formule Basic à l'année, ouverture en ligne (relevé d'octobre 2026)",
      points: [
        'IBAN français et carte Mastercard physique et virtuelle',
        'Facturation intégrée, plateforme agréée pour la facture électronique',
        'Service client 7 jours sur 7, selon Qonto',
      ],
      cta: { label: 'Ouvrir mon compte Qonto', href: QONTO },
      note: "Lien affilié : Qonto me verse une commission si tu ouvres un compte via ce lien, sans aucun surcoût pour toi.",
    },
    pourquoi: {
      titre: 'Pourquoi je recommande <em>Qonto</em>',
      items: [
        { icon: 'split-horizontal', t: 'Tes revenus enfin séparés', d: 'Virements Airbnb, Booking.com, Stripe et paiements directs arrivent sur un compte dédié : ton suivi par logement et ta déclaration deviennent simples.' },
        { icon: 'receipt', t: 'Prêt pour la facture électronique', d: "Qonto figure parmi les plateformes agréées par l'administration : utile si tu factures (conciergerie, ménage, photo) ou si tu dois recevoir des factures électroniques." },
        { icon: 'users-three', t: 'Pensé pour les équipes', d: "Cartes par personne, plafonds, notes de frais et accès pour ton comptable : pratique dès que tu gères plusieurs logements ou une équipe." },
      ],
    },
    fonctions: {
      titre: 'Ce que Qonto fait pour <em>ton activité</em>',
      items: [
        { icon: 'credit-card', t: 'Compte et cartes pro', d: 'IBAN français, carte Mastercard physique, cartes virtuelles pour tes abonnements en ligne.', href: QONTO, lien: 'Voir les offres' },
        { icon: 'file-text', t: 'Facturation', d: 'Devis et factures depuis le compte, suivi des paiements, factures électroniques reçues et émises.' },
        { icon: 'arrows-left-right', t: 'Virements', d: 'Virements SEPA, dont instantanés, pour payer ton équipe de ménage ou tes prestataires.' },
        { icon: 'calculator', t: 'Compta simplifiée', d: 'Justificatifs photographiés et rattachés à chaque dépense, catégories, accès pour ton comptable.' },
        { icon: 'users', t: 'Dépenses d\'équipe', d: 'Cartes par personne avec plafonds, selon la formule : utile pour une conciergerie ou une équipe de ménage.' },
        { icon: 'storefront', t: 'Création d\'entreprise', d: 'Dépôt du capital en ligne pour créer ta société (SASU, SARL, SCI).' },
      ],
    },
    etapes: [
      { t: 'Ouvre ton compte en ligne', d: "avec ta pièce d'identité et les documents de ton entreprise (micro-entreprise, LMNP immatriculé ou société) ; Qonto annonce une ouverture en une dizaine de minutes." },
      { t: 'Change ton IBAN sur tes plateformes', d: 'Airbnb, Booking.com, Stripe pour tes contrats directs : tous tes encaissements arrivent au même endroit.' },
      { t: 'Invite ton comptable et ton équipe', d: 'accès comptable, cartes pour ton équipe de ménage, justificatifs au fil de l\'eau : ta clôture de fin d\'année devient plus rapide.' },
    ],
    tableau: {
      titre: 'Qonto est-il fait <em>pour toi</em> ?',
      entete: ['Ta situation', 'Mon conseil'],
      lignes: [
        ['Conciergerie ou hôte en société (SASU, SARL, SCI)', '<span class="yes">Oui</span> : compte, cartes d\'équipe, factures et accès comptable au même endroit'],
        ['Micro-entrepreneur (conciergerie, ménage, photo)', '<span class="yes">Oui</span> : un compte dédié devient obligatoire au-delà de 10 000 € de chiffre d\'affaires deux années civiles de suite'],
        ['Hôte en LMNP avec un ou deux logements', '<span class="partial">Possible</span> : un compte dédié simplifie tout, mais une offre à 0 € comme <a href="/partenaires/shine">Shine</a> peut suffire'],
        ['Tu dois émettre ou recevoir des factures électroniques', '<span class="yes">Oui</span> : Qonto est plateforme agréée, vérifie la formule qui inclut ce dont tu as besoin'],
        ['Tu as besoin d\'un crédit immobilier', '<span class="partial">Pas ici</span> : Qonto ne finance pas un achat immobilier, garde ta banque pour ton prêt'],
      ],
      note: 'Les règles du compte dédié pour les micro-entrepreneurs : article L613-10 du Code de la sécurité sociale.',
    },
    cout: {
      titre: 'Ce que ça <em>coûte</em>',
      paras: [
        "D'après les relevés d'octobre 2026, les formules pour indépendants vont de Basic (environ 9 € HT par mois à l'année, 11 € HT sans engagement, 30 virements SEPA par mois, un seul utilisateur) à Smart (environ 19 € HT) et Premium (environ 39 € HT). Les formules pour équipes commencent autour de 49 € HT par mois.",
        "Il n'y a pas d'offre gratuite à vie : si tu veux un compte à 0 €, regarde Shine. Une période d'essai gratuite a été proposée aux nouveaux clients : vérifie les conditions au moment de t'inscrire.",
        'Le prix exact, les quotas de virements et de retraits sont ceux affichés par Qonto au moment de souscrire.',
      ],
    },
    limites: [
      'Pas d\'offre gratuite : la première formule est payante, compare avec ton volume réel de virements.',
      "Qonto est un établissement de paiement agréé, pas encore une banque : pas de prêt immobilier ni d'épargne (une demande de licence bancaire a été déposée en 2025).",
      'La formule Basic limite le nombre de virements, de cartes virtuelles et de retraits : regarde ton usage avant de choisir.',
      'Pas d\'agence : tout se fait dans l\'application et avec le service client en ligne.',
    ],
    liens: [
      { href: '/blog/compte-bancaire-pro-hote-lcd-6-raisons-choisir-2026', t: 'Pourquoi un compte pro ?', d: 'Les 6 raisons de séparer tes revenus de location.' },
      { href: '/partenaires/shine', t: 'Shine', d: 'Le compte pro dès 0 € et Shine Facture.' },
      { href: '/blog/creer-societe-conciergerie-en-ligne-legalplace-2026', t: 'Créer ta conciergerie', d: 'Micro-entreprise ou société : le bon statut.' },
      { href: '/services/contrats', t: 'Tes réservations directes payées', d: 'Contrat en ligne, loyer et caution versés sur ton compte.' },
    ],
    faq: [
      { q: 'Qonto est-elle une vraie banque ?', a: "Qonto est un établissement de paiement agréé par l'ACPR. Ton compte a un IBAN français et ton argent est cantonné, c'est-à-dire tenu à part des fonds propres de Qonto, comme l'exige la règle des établissements de paiement. Qonto a déposé une demande de licence bancaire en 2025 ; en attendant, elle ne fait pas de prêt immobilier." },
      { q: 'Combien coûte Qonto pour une location courte durée ?', a: "D'après les relevés d'octobre 2026, la formule Basic coûte environ 9 € HT par mois avec un engagement annuel, ou 11 € HT par mois sans engagement, avec 30 virements SEPA par mois. Les formules Smart et Premium coûtent environ 19 € et 39 € HT par mois. Vérifie la grille officielle avant de souscrire." },
      { q: 'Qonto gère-t-elle la facture électronique ?', a: "Oui : Qonto figure parmi les plateformes agréées par l'administration pour la facture électronique. La réception devient obligatoire pour toutes les entreprises au 1er septembre 2026, l'émission au 1er septembre 2027 pour les petites entreprises concernées." },
      { q: 'Puis-je recevoir mes virements Airbnb et Booking sur Qonto ?', a: "Oui : il suffit de renseigner l'IBAN Qonto comme moyen de versement dans Airbnb, Booking.com et Stripe. Les virements arrivent comme sur n'importe quel compte." },
      { q: 'Qonto ou Shine ?', a: "Les deux répondent au même besoin. Shine a une offre gratuite et un outil de facturation gratuit, Qonto n'a pas d'offre gratuite mais va plus loin pour les sociétés et les équipes (cartes par personne, notes de frais, accès comptable). Pour un ou deux logements en LMNP, Shine peut suffire ; pour une conciergerie ou une société, Qonto est souvent plus confortable." },
    ],
    cta: {
      titre: 'Un compte pro, <em>des chiffres clairs</em>',
      texte: "L'app Jason Marinho suit tes revenus logement par logement, prépare tes contrats directs avec paiement en ligne et t'aide à déclarer tes revenus.",
      btn: { label: 'Créer mon compte gratuit', href: 'https://app.jasonmarinho.com/auth/register' },
    },
    sources: [
      ['Programme d\'affiliation et présentation de Qonto', 'https://qonto.com/fr/affiliate'],
      ['Tarifs Qonto (grille officielle)', 'https://qonto.com/fr/pricing'],
      ['MoneyVox : Qonto agréée plateforme de facturation électronique', 'https://www.moneyvox.fr/banque-pro/actualites/107100/compte-pro-qonto-officiellement-agreee-comme-plateforme-de-facturation-electronique'],
      ['Journal du Net : Qonto dépose une demande de licence bancaire', 'https://www.journaldunet.com/fintech/1542843-qonto-depose-une-demande-de-licence-bancaire/'],
      ['Service-Public.fr : compte bancaire du micro-entrepreneur (article L613-10 du Code de la sécurité sociale)', 'https://entreprendre.service-public.gouv.fr/vosdroits/F35991'],
    ],
  },
  {
    // JD2M (Jedeclaremonmeuble.com, Affilae, numéro d'affilié 244, 17/10/2026).
    // Les prix « après réduction d'impôt » du kit reposaient sur la réduction
    // pour frais de comptabilité (2/3, 915 € max), supprimée par la loi de
    // finances pour 2025 : jamais repris ici.
    slug: 'jd2m',
    releve: 'octobre 2026',
    nom: 'JD2M',
    mono: 'J',
    couleur: '#1F4E8C',
    title: 'JD2M (Je déclare mon meublé) : compta LMNP au réel',
    description: "JD2M (Jedeclaremonmeuble.com) avec Jason Marinho : ta liasse LMNP au régime réel faite avec un spécialiste, ou entièrement par un expert-comptable. Prix, offres, limites.",
    eyebrow: 'Partenaire · Comptabilité LMNP',
    h1: 'JD2M : ta déclaration LMNP au réel, <em>avec un spécialiste à côté de toi</em>',
    lead: "JD2M (Jedeclaremonmeuble.com) accompagne les loueurs en meublé depuis 2012 et ne fait que ça : la comptabilité LMNP au régime réel. Je le conseille aux hôtes qui veulent passer au réel sans tout faire seuls, ou qui préfèrent confier leur dossier à un expert-comptable du début à la fin.",
    offre: {
      titre: 'Offre Essentielle dès 299 € TTC/an',
      sous: "Une liasse fiscale par an, relevé d'octobre 2026",
      points: [
        'Logiciel guidé et conseillers spécialisés LMNP',
        'Offre Intégrale : un expert-comptable fait tout pour toi',
        'Frais de comptabilité déductibles de tes recettes au réel',
      ],
      cta: { label: 'Voir les offres JD2M', href: JD2M },
      note: "Lien affilié : JD2M me verse une commission si tu souscris via ce lien, sans aucun surcoût pour toi.",
    },
    pourquoi: {
      titre: 'Pourquoi je recommande <em>JD2M</em>',
      items: [
        { icon: 'certificate', t: 'Spécialiste du LMNP', d: "Pas un cabinet généraliste : amortissements, liasse 2031, résidence de tourisme, revente du bien, JD2M ne traite que la location meublée." },
        { icon: 'users', t: 'Tu n\'es pas seul', d: "L'offre Essentielle te guide avec des conseillers ; l'offre Intégrale confie ton dossier à un expert-comptable, qui établit et télédéclare ta liasse." },
        { icon: 'calculator', t: 'Le réel rentable', d: "Au régime réel, amortir le bien et le mobilier efface souvent l'impôt sur tes loyers pendant des années : c'est là que l'accompagnement se rembourse." },
      ],
    },
    fonctions: {
      titre: 'Ce que JD2M fait pour <em>ta location</em>',
      items: [
        { icon: 'chart-line-up', t: 'Amortissements', d: 'Bien découpé par composants, mobilier et travaux amortis sur les bonnes durées.' },
        { icon: 'file-text', t: 'Liasse 2031 et annexes', d: 'Préparées puis télédéclarées aux impôts, au régime réel.' },
        { icon: 'identification-card', t: 'Début d\'activité', d: "Aide pour déclarer ton activité de loueur en meublé et choisir le réel." },
        { icon: 'receipt', t: 'Facture électronique', d: 'JD2M informe ses clients sur la réception obligatoire depuis le 1er septembre 2026.' },
        { icon: 'book-open', t: 'Plus de 200 articles', d: 'Guides gratuits sur la fiscalité du meublé, utiles même sans abonnement.' },
        { icon: 'chat-circle', t: 'Support réactif', d: 'Questions posées à des spécialistes du LMNP, pas à un service client généraliste.' },
      ],
    },
    etapes: [
      { t: 'Choisis ton offre', d: "Essentielle si tu veux faire avec un logiciel guidé et de l'aide, Intégrale si tu veux tout déléguer à un expert-comptable." },
      { t: 'Transmets tes chiffres', d: "recettes brutes (avant commission Airbnb ou Booking), dépenses, prix d'achat du bien et du mobilier, emprunt." },
      { t: 'Ta liasse est télédéclarée', d: "dans les délais de la déclaration de revenus, puis reporte le résultat sur ta déclaration 2042 C PRO." },
    ],
    tableau: {
      titre: 'JD2M, Indy ou micro-BIC : <em>selon ta situation</em>',
      entete: ['Ta situation', 'Mon conseil'],
      lignes: [
        ['Tu restes au micro-BIC', '<span class="partial">Pas besoin</span> : pas de liasse à faire, l\'abattement s\'applique tout seul'],
        ['Premier passage au réel, tu veux être accompagné', '<span class="yes">JD2M Essentielle</span> : logiciel guidé et conseillers spécialisés'],
        ['Tu ne veux rien faire toi-même', '<span class="yes">JD2M Intégrale</span> : un expert-comptable établit et télédéclare ta liasse'],
        ['Tu es à l\'aise et veux le moins cher', '<span class="partial">Indy</span> : outil autonome, voir <a href="/partenaires/indy">l\'offre Indy</a>'],
        ['Société à l\'IS, LMP ou dossier complexe', '<span class="partial">Demande un devis</span> : vérifie que l\'offre couvre ta situation avant de souscrire'],
      ],
      note: 'Le choix entre micro-BIC et réel : voir le simulateur micro-BIC et mon article sur la décision en 2026.',
    },
    cout: {
      titre: 'Ce que ça <em>coûte</em>',
      paras: [
        "D'après les relevés d'octobre 2026, l'offre Essentielle commence à 299 € TTC par an et par liasse fiscale, et l'offre Intégrale (expert-comptable) à 629 € TTC par an, avec un supplément selon le nombre de logements. Vérifie la grille officielle au moment de souscrire.",
        "JD2M affiche aussi des prix « après déduction fiscale », plus bas : ils supposent une tranche d'impôt à 30 % et les prélèvements sociaux. Au réel, les frais de comptabilité sont une charge déductible de tes recettes, ce n'est pas une réduction du prix payé.",
        "Attention aux anciens calculs : la réduction d'impôt de deux tiers des frais de comptabilité (915 € au plus), liée aux centres de gestion agréés, a été supprimée par la loi de finances pour 2025. Elle ne s'applique plus aux revenus 2025, déclarés en 2026.",
      ],
    },
    limites: [
      "Plus cher qu'un outil autonome comme Indy : tu paies l'accompagnement.",
      "Inutile au micro-BIC : le service sert au régime réel.",
      "Ce n'est pas un logiciel de gestion locative : pas de calendrier, pas de lien avec Airbnb ou Booking. Tes recettes à déclarer sont les montants bruts, avant commission.",
      "Au-delà de 23 000 € de recettes en courte durée, des cotisations sociales sont dues même en LMNP : pose la question à ton conseiller avant de choisir.",
    ],
    liens: [
      { href: '/blog/regime-reel-vs-micro-bic-decision-2026', t: 'Micro-BIC ou réel ?', d: 'Comment décider en 2026, chiffres à l\'appui.' },
      { href: '/services/simulateurs/fiscalite-micro-bic', t: 'Simulateur micro-BIC', d: 'Ton impôt estimé selon ton type de meublé.' },
      { href: '/partenaires/indy', t: 'Indy', d: 'La compta LMNP en autonomie, premier mois offert.' },
      { href: '/blog/declarer-lmnp-sans-expert-comptable-decla-fr', t: 'Déclarer sans expert-comptable', d: 'Ce que tu peux faire seul, et ses limites.' },
    ],
    faq: [
      { q: 'Combien coûte JD2M pour un LMNP ?', a: "D'après les relevés d'octobre 2026, l'offre Essentielle commence à 299 € TTC par an et l'offre Intégrale, où un expert-comptable fait tout, à 629 € TTC par an, avec un supplément selon le nombre de logements. Ces frais sont déductibles de tes recettes au régime réel. Vérifie la grille officielle avant de souscrire." },
      { q: 'La réduction d\'impôt pour frais de comptabilité existe-t-elle encore ?', a: "Non. La réduction de deux tiers des frais de comptabilité, plafonnée à 915 €, réservée aux adhérents d'un centre de gestion agréé, a été supprimée par la loi de finances pour 2025 (loi du 14 février 2025). Les frais de comptabilité restent une charge déductible au régime réel." },
      { q: 'JD2M ou Indy ?', a: "Indy est un outil autonome, moins cher : tu fais ta comptabilité toi-même, guidé pas à pas. JD2M est un service spécialisé LMNP avec des conseillers, et une offre où un expert-comptable fait tout. Si tu passes au réel pour la première fois ou si ton dossier est chargé, l'accompagnement de JD2M rassure ; si tu es à l'aise, Indy suffit." },
      { q: 'Ai-je besoin de JD2M au micro-BIC ?', a: "Non. Au micro-BIC, tu reportes tes recettes sur ta déclaration et l'abattement s'applique tout seul. JD2M sert au régime réel, où il faut une comptabilité, des amortissements et une liasse fiscale 2031." },
      { q: 'Quelles recettes déclarer pour mes réservations Airbnb ?', a: "Les montants bruts payés par les voyageurs, pas les virements nets que tu reçois. La commission de la plateforme est une charge. Mes finances, dans l'app Jason Marinho, sépare le brut et la commission de chaque séjour, logement par logement." },
    ],
    cta: {
      titre: 'Ta liasse confiée, <em>tes séjours suivis</em>',
      texte: "JD2M s'occupe de ta déclaration. L'app Jason Marinho suit tes séjours, tes contrats et tes revenus bruts par logement, pour lui transmettre des chiffres justes.",
      btn: { label: 'Créer mon compte gratuit', href: 'https://app.jasonmarinho.com/auth/register' },
    },
    sources: [
      ['Offres de comptabilité LMNP de JD2M', 'https://www.jedeclaremonmeuble.com/offres-comptabilite-lmnp/'],
      ['JD2M : suppression de l\'avantage fiscal des OGA', 'https://www.jedeclaremonmeuble.com/suppression-avantage-fiscal-oga/'],
      ['Meilleurtaux : fin de la réduction pour frais de comptabilité', 'https://placement.meilleurtaux.com/placement-financier/actualites/2026-mai/impots-2025-fin-de-la-reduction-comptabilite-oga.html'],
      ['Régimes d\'imposition', 'https://www.impots.gouv.fr/particulier/les-regimes-dimposition'],
    ],
  },
  {
    // Keobiz (cabinet d'expertise comptable, Affilae, numéro d'affilié 936, 27/10/2026).
    // Place : l'expert-comptable complet, pour les hôtes au réel qui ont aussi
    // une société (conciergerie, SCI à l'IS, SASU) ; JD2M reste le spécialiste
    // LMNP, Indy l'outil autonome.
    slug: 'keobiz',
    releve: 'octobre 2026',
    nom: 'Keobiz',
    mono: 'K',
    couleur: '#0B3B5C',
    title: 'Keobiz : expert-comptable LMNP, conciergerie et SCI',
    description: "Keobiz avec Jason Marinho : un cabinet d'expertise comptable pour ta location meublée au réel, ta conciergerie ou ta société. Pour qui, ce que ça change, limites.",
    eyebrow: 'Partenaire · Expert-comptable',
    h1: 'Keobiz : un expert-comptable <em>pour ta location et ta société</em>',
    lead: "Keobiz est un cabinet d'expertise comptable pour les entrepreneurs, avec une offre dédiée aux loueurs en meublé. Je le conseille aux hôtes qui veulent tout confier à un expert-comptable, surtout quand la location meublée n'est pas leur seule activité : conciergerie, société, SCI.",
    offre: {
      titre: 'Un expert-comptable pour ton dossier',
      sous: 'Devis selon ton activité et ton nombre de logements',
      points: [
        'Offre dédiée aux loueurs en meublé (LMNP au réel)',
        'Comptabilité des sociétés : conciergerie, SASU, SCI',
        'Honoraires déductibles de tes recettes au régime réel',
      ],
      cta: { label: 'Demander un devis Keobiz', href: KEOBIZ },
      note: "Lien affilié : Keobiz me verse une commission si tu deviens client via ce lien, sans aucun surcoût pour toi.",
    },
    pourquoi: {
      titre: 'Pourquoi je recommande <em>Keobiz</em>',
      items: [
        { icon: 'certificate', t: 'Un vrai cabinet', d: "Un expert-comptable s'occupe de ton dossier : ce n'est pas un logiciel où tu fais tout seul." },
        { icon: 'buildings', t: 'Plusieurs activités', d: "Location meublée, conciergerie, société ou SCI : un seul interlocuteur pour l'ensemble, utile quand tes activités se croisent." },
        { icon: 'calculator', t: 'Le réel bien fait', d: "Amortissements, liasse fiscale, déficit reporté : au réel, une erreur coûte vite plus cher que les honoraires." },
      ],
    },
    fonctions: {
      titre: 'Ce que Keobiz fait pour <em>ton activité</em>',
      items: [
        { icon: 'chart-line-up', t: 'Amortissements', d: 'Bien, mobilier et travaux amortis sur les bonnes durées, au régime réel.' },
        { icon: 'file-text', t: 'Déclarations fiscales', d: 'Liasse et déclarations préparées et transmises par le cabinet.' },
        { icon: 'briefcase', t: 'Comptabilité de société', d: "Pour une conciergerie ou une société d'exploitation : bilan, TVA si tu y es soumis." },
        { icon: 'house-line', t: 'SCI et patrimoine', d: 'Comptabilité de SCI, à l\'IR ou à l\'IS, à côté de ta location meublée.' },
        { icon: 'chat-circle', t: 'Un interlocuteur', d: 'Tes questions vont à un expert-comptable, pas à un support généraliste.' },
        { icon: 'book-open', t: 'Guides gratuits', d: 'Le magazine Keobiz explique la fiscalité du meublé, même sans être client.' },
      ],
    },
    etapes: [
      { t: 'Demande un devis', d: "via le lien : décris ton activité (location meublée, conciergerie, société), ton régime et ton nombre de logements." },
      { t: 'Échange avec le cabinet', d: "qui te propose une lettre de mission adaptée : ce qu'il fait, ce que tu fournis, le prix." },
      { t: 'Transmets tes chiffres', d: "recettes brutes (avant commission Airbnb ou Booking), dépenses, prix d'achat du bien et du mobilier, emprunt." },
    ],
    tableau: {
      titre: 'Keobiz, JD2M ou Indy : <em>selon ta situation</em>',
      entete: ['Ta situation', 'Mon conseil'],
      lignes: [
        ['Tu restes au micro-BIC', '<span class="partial">Pas besoin</span> : pas de liasse à faire, l\'abattement s\'applique tout seul'],
        ['LMNP au réel, tu es à l\'aise et veux le moins cher', '<span class="partial">Indy</span> : outil autonome, voir <a href="/partenaires/indy">l\'offre Indy</a>'],
        ['LMNP au réel, accompagné par un spécialiste du meublé', '<span class="partial">JD2M</span> : voir <a href="/partenaires/jd2m">l\'offre JD2M</a>'],
        ['Location meublée et conciergerie ou société', '<span class="yes">Keobiz</span> : un seul expert-comptable pour tes activités'],
        ['SCI à l\'IS, LMP ou dossier chargé', '<span class="yes">Keobiz</span> : demande un devis et vérifie que la lettre de mission couvre ta situation'],
      ],
      note: 'Le choix entre micro-BIC et réel : voir le simulateur micro-BIC et mon article sur la décision en 2026.',
    },
    cout: {
      titre: 'Ce que ça <em>coûte</em>',
      paras: [
        "Keobiz travaille sur devis, avec un abonnement mensuel qui dépend de ton activité, de ton régime et de ton nombre de logements. Les prix trouvés en ligne en octobre 2026 se contredisent : je n'en affiche aucun, demande le tien avant de t'engager.",
        "Un expert-comptable coûte plus cher qu'un outil où tu fais tout toi-même. Il se justifie quand ton dossier est chargé : plusieurs logements, une société, une SCI, ou peu de temps à y consacrer.",
        "Au régime réel, les honoraires de comptabilité sont une charge déductible de tes recettes. La réduction d'impôt de deux tiers des frais de comptabilité (915 € au plus), liée aux centres de gestion agréés, a été supprimée par la loi de finances pour 2025 : ne la compte plus dans ton calcul.",
      ],
    },
    limites: [
      "Plus cher qu'un outil autonome comme Indy : tu paies le travail d'un expert-comptable.",
      "Inutile si tu restes au micro-BIC avec un seul logement.",
      "Pas de prix public fiable : compare le devis avec JD2M ou un cabinet près de chez toi.",
      "Ce n'est pas un logiciel de gestion locative : pas de calendrier ni de lien avec Airbnb ou Booking. Tes recettes à déclarer sont les montants bruts, avant commission.",
    ],
    liens: [
      { href: '/blog/regime-reel-vs-micro-bic-decision-2026', t: 'Micro-BIC ou réel ?', d: 'Comment décider en 2026, chiffres à l\'appui.' },
      { href: '/services/simulateurs/fiscalite-micro-bic', t: 'Simulateur micro-BIC', d: 'Ton impôt estimé selon ton type de meublé.' },
      { href: '/partenaires/jd2m', t: 'JD2M', d: 'Le spécialiste de la compta LMNP au réel.' },
      { href: '/blog/creer-societe-conciergerie-en-ligne-legalplace-2026', t: 'Créer sa société de conciergerie', d: 'Statut, démarches et frais, avec LegalPlace.' },
    ],
    faq: [
      { q: 'Combien coûte Keobiz pour un LMNP ?', a: "Keobiz travaille sur devis, avec un abonnement mensuel selon ton activité et ton nombre de logements. Les prix trouvés en ligne en octobre 2026 se contredisent, je n'en cite donc aucun : demande un devis. Au régime réel, les honoraires sont déductibles de tes recettes." },
      { q: 'Keobiz, JD2M ou Indy ?', a: "Indy est un outil autonome, le moins cher : tu fais ta comptabilité toi-même. JD2M est spécialisé dans le LMNP, avec des conseillers et une offre où un expert-comptable fait tout. Keobiz est un cabinet d'expertise comptable généraliste : il prend tout en charge, location meublée, conciergerie, société ou SCI. Plus ton dossier mélange d'activités, plus Keobiz a du sens." },
      { q: 'Ai-je besoin d\'un expert-comptable au micro-BIC ?', a: "Non. Au micro-BIC, tu reportes tes recettes sur ta déclaration et l'abattement s'applique tout seul. Un expert-comptable sert au régime réel, où il faut une comptabilité, des amortissements et une liasse fiscale, ou dès que tu as une société." },
      { q: 'La réduction d\'impôt pour frais de comptabilité existe-t-elle encore ?', a: "Non. La réduction de deux tiers des frais de comptabilité, plafonnée à 915 €, réservée aux adhérents d'un centre de gestion agréé, a été supprimée par la loi de finances pour 2025. Les honoraires restent une charge déductible au régime réel." },
      { q: 'Quelles recettes déclarer pour mes réservations Airbnb ?', a: "Les montants bruts payés par les voyageurs, pas les virements nets que tu reçois. La commission de la plateforme est une charge. Mes finances, dans l'app Jason Marinho, sépare le brut et la commission de chaque séjour, logement par logement." },
    ],
    cta: {
      titre: 'Ta compta confiée, <em>tes séjours suivis</em>',
      texte: "Keobiz s'occupe de ta comptabilité. L'app Jason Marinho suit tes séjours, tes contrats et tes revenus bruts par logement, pour transmettre des chiffres justes à ton expert-comptable.",
      btn: { label: 'Créer mon compte gratuit', href: 'https://app.jasonmarinho.com/auth/register' },
    },
    sources: [
      ['Keobiz : expert-comptable LMNP', 'https://www.keobiz.fr/metier/immobilier/lmnp/'],
      ['Keobiz : LMNP et comptabilité en 2026', 'https://www.keobiz.fr/le-mag/lmnp-comptabilite/'],
      ['Meilleurtaux : fin de la réduction pour frais de comptabilité', 'https://placement.meilleurtaux.com/placement-financier/actualites/2026-mai/impots-2025-fin-de-la-reduction-comptabilite-oga.html'],
      ['Régimes d\'imposition', 'https://www.impots.gouv.fr/particulier/les-regimes-dimposition'],
    ],
  },
]
