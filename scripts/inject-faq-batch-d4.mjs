import { readFileSync, writeFileSync } from 'fs'

const BASE = '/home/user/jasonmarinho-site/blog'

const articles = [
  {
    slug: 'signaletique-interieure-lcd-reduit-questions',
    faq: [
      { q: 'Quels panneaux de signalétique sont indispensables dans un logement LCD ?', a: 'Les essentiels : instructions WiFi, règles de la maison, consignes tri sélectif, guide pour les appareils (four, lave-linge), contacts d\'urgence et informations sortie. Ces panneaux réduisent les messages des voyageurs de 30 à 50 %.' },
      { q: 'Quelle signalétique réduit le plus les questions des voyageurs ?', a: 'Le code WiFi affiché de façon visible (porte du frigo ou TV), les instructions pour les équipements complexes (machine à café, jacuzzi, volets roulants) et les horaires check-in/check-out sont les panneaux qui éliminent le plus de messages.' },
      { q: 'Dois-je mettre la signalétique en plusieurs langues ?', a: 'Pour un logement accueillant des étrangers, l\'anglais est recommandé en plus du français. Des pictogrammes universels complètent la signalétique et rendent les panneaux compréhensibles sans traduction.' },
      { q: 'Comment rendre ma signalétique LCD esthétique sans ressembler à un hôtel ?', a: 'Choisissez une police cohérente avec votre décor, utilisez des cadres assortis, limitez la taille des panneaux. Des stickers élégants ou des ardoises magnétiques s\'intègrent mieux qu\'un simple papier plastifié.' },
    ]
  },
  {
    slug: 'site-reservation-directe-location-courte-duree',
    faq: [
      { q: 'Pourquoi créer un site de réservation directe pour la location courte durée ?', a: 'Un site direct élimine les commissions Airbnb (3 % hôte + 14 % voyageur), vous donne accès aux données clients pour le remarketing, et vous protège des déréférencements de plateformes. Sur 10 000 € de revenus mensuels, l\'économie peut dépasser 1 500 € par an.' },
      { q: 'Quels outils utiliser pour créer un site de réservation directe LCD ?', a: 'Les solutions les plus utilisées : Lodgify, Hostfully, OwnerRez et Smoobu. Elles incluent un moteur de réservation, la synchronisation des calendriers et les paiements. Pour des sites plus personnalisés, WordPress + un plugin réservation comme Checkfront reste une option viable.' },
      { q: 'Comment attirer des réservations directes sans publicité payante ?', a: 'SEO local (page ville + type de logement), emailing post-séjour avec un code promo retour, partenariats locaux (restaurants, activités), profil Google Business optimisé, et présence sur des annuaires spécialisés comme Gîtes de France ou Clévacances.' },
      { q: 'Un site de réservation directe est-il rentable pour un seul logement ?', a: 'Oui dès 2-3 réservations directes par mois. Le coût d\'un outil comme Lodgify (15-30 € / mois) est amorti en une seule réservation sans commission. L\'investissement temps pour le référencement prend 6 à 12 mois pour porter ses fruits.' },
    ]
  },
  {
    slug: 'sortir-mauvais-client-conciergerie-procedure',
    faq: [
      { q: 'Comment gérer un voyageur problématique dans un logement LCD ?', a: 'Commencez par une communication écrite documentée sur la messagerie Airbnb ou VRBO. Si le problème persiste (tapage nocturne, nuisances, dégradations), contactez le support de la plateforme pour déclencher une résolution. L\'expulsion physique nécessite l\'intervention des forces de l\'ordre.' },
      { q: 'Un hôte LCD peut-il expulser un voyageur avant la fin de son séjour ?', a: 'Techniquement oui en cas de violation grave des règles (nuisances importantes, dégradations, comportement menaçant), mais cela doit passer par la plateforme qui contactera le voyageur. En cas de danger immédiat, appelez le 17. L\'expulsion unilatérale sans appui plateforme expose à des litiges.' },
      { q: 'Comment documenter un incident avec un mauvais voyageur en LCD ?', a: 'Envoyez tous les messages via la messagerie officielle de la plateforme (trace écrite), photographiez les dégâts dès que possible, consignez les horaires des incidents, et signalez immédiatement à Airbnb/Booking via leur formulaire dédié aux litiges séjour.' },
      { q: 'Quelle procédure suivre pour récupérer une caution après dégâts LCD ?', a: 'Sur Airbnb, déclenchez AirCover dans les 14 jours suivant le départ, avec photos et devis. Sur d\'autres plateformes, utilisez le processus dommages intégré. En cas d\'échec, les assurances professionnelles LCD (Hiscox, Luko Pro) couvrent les sinistres non remboursés par la plateforme.' },
    ]
  },
  {
    slug: 'statistiques-annonce-airbnb-4-kpis-essentiels',
    faq: [
      { q: 'Quels sont les 4 KPIs essentiels pour analyser une annonce Airbnb ?', a: 'Le taux de conversion (vues → réservations), le taux d\'occupation, le RevPAR (revenu par nuit disponible) et le taux d\'annulation. Ces 4 indicateurs suffisent pour diagnostiquer les problèmes de visibilité, de prix ou de qualité d\'annonce.' },
      { q: 'Comment accéder aux statistiques de son annonce Airbnb ?', a: 'Dans l\'app hôte Airbnb ou sur airbnb.com : Tableau de bord → Performances. Vous y trouvez les vues, les taux de conversion, le revenu moyen par nuit et la comparaison avec les logements similaires de votre zone.' },
      { q: 'Quel taux de conversion Airbnb est considéré comme bon ?', a: 'Un taux de conversion de 1 à 2 % (1-2 réservations pour 100 vues) est dans la moyenne. Au-dessus de 3 %, votre prix est probablement trop bas. En dessous de 0,5 %, il faut retravailler les photos, le titre ou la description.' },
      { q: 'Comment améliorer ses statistiques Airbnb rapidement ?', a: 'Trois leviers rapides : mettre à jour les photos (les 3 premières images comptent le plus), activer la tarification dynamique, et répondre aux messages en moins de 1 heure pour booster le badge Superhost. Ces actions améliorent le classement algorithmique sous 2-4 semaines.' },
    ]
  },
  {
    slug: 'stripe-paiement-direct-lcd-mise-en-place',
    faq: [
      { q: 'Comment accepter des paiements directs par carte pour la location courte durée avec Stripe ?', a: 'Créez un compte Stripe, intégrez-le à votre site de réservation directe (Lodgify, Hostfully ou via l\'API Stripe). Stripe gère la 3DS, les remboursements et les litiges. Vérifiez que votre activité LCD est bien déclarée en MK (meublé de tourisme) dans votre profil Stripe pour éviter les blocages.' },
      { q: 'Quels sont les frais Stripe pour la location saisonnière ?', a: 'Stripe prélève 1,5 % + 0,25 € par transaction pour les cartes européennes, et 2,5 % + 0,25 € pour les cartes hors UE. Sans frais mensuels fixes. Comparez à la commission Airbnb (14-17 % côté voyageur + 3 % hôte) : Stripe reste bien moins cher sur les réservations directes.' },
      { q: 'Stripe est-il sécurisé pour recevoir des paiements de voyageurs LCD ?', a: 'Oui. Stripe est certifié PCI DSS niveau 1, le plus haut niveau de sécurité pour les paiements en ligne. Ils gèrent la 3D Secure, la détection de fraude et la protection contre les chargebacks. C\'est la solution utilisée par la majorité des plateformes de réservation directe.' },
      { q: 'Peut-on bloquer une caution avec Stripe en LCD ?', a: 'Oui via les PaymentIntents avec capture_method: manual. Vous autorisez le montant (caution) sans le débiter immédiatement, puis capturez ou libérez après le séjour. Cette fonctionnalité est disponible via l\'API Stripe ou certains outils LCD comme OwnerRez.' },
    ]
  },
  {
    slug: 'tarif-conciergerie-lcd-grille-marche-2026',
    faq: [
      { q: 'Quel pourcentage prend une conciergerie LCD en 2026 ?', a: 'En 2026, les conciergeries LCD facturent en moyenne 18 à 25 % du revenu brut en gestion complète (annonce + ménage + linge + accueil). Les formules légères (ménage seul) vont de 8 à 12 %. Les conciergeries premium en zones urbaines peuvent aller jusqu\'à 30 %.' },
      { q: 'Comment comparer les tarifs de conciergerie LCD sur son marché ?', a: 'Demandez des devis à 3-5 conciergeries locales, comparez les services inclus (linge, consommables, gestion sinistres, tarification dynamique). Le tarif seul ne suffit pas : une conciergerie à 20 % qui optimise les prix peut rapporter plus qu\'une à 15 % qui pratique des tarifs fixes.' },
      { q: 'Quels services sont inclus dans les frais de conciergerie LCD ?', a: 'Cela varie selon la formule. La gestion complète inclut généralement : création/optimisation annonce, communication voyageurs, check-in, ménage, linge, gestion des avis. Vérifiez si la tarification dynamique, les photos professionnelles et la gestion des sinistres sont incluses ou facturées en plus.' },
      { q: 'Vaut-il mieux payer une conciergerie au pourcentage ou à la nuitée ?', a: 'Le pourcentage aligne les intérêts : la conciergerie est motivée à maximiser vos revenus. Le forfait à la nuitée peut être plus prévisible mais elle ne bénéficie pas de l\'optimisation des prix. Pour un hôte débutant, le pourcentage est généralement plus sûr.' },
    ]
  },
  {
    slug: 'tarif-hebdomadaire-vs-nuitee-quand-preferer',
    faq: [
      { q: 'Quand proposer un tarif hebdomadaire plutôt qu\'une nuitée en LCD ?', a: 'Le tarif hebdomadaire (avec réduction 15-25 %) est avantageux en basse saison pour remplir le calendrier, pour les logements de type maison entière avec coûts ménage élevés, et dans les zones où les voyageurs cherchent des séjours de 7+ nuits (montagne, campagne, workation).' },
      { q: 'Quelle réduction hebdomadaire appliquer sur Airbnb pour rester compétitif ?', a: 'Une réduction de 15 à 20 % pour 7 nuits est dans la norme du marché. En dessous de 10 %, les voyageurs cherchant une semaine préféreront une autre annonce. Au-dessus de 25 %, vous diminuez trop votre RevPAR. Analysez les offres hebdomadaires de vos concurrents locaux.' },
      { q: 'Un séjour d\'une semaine coûte-t-il vraiment moins cher à gérer en LCD ?', a: 'Oui : un seul ménage au lieu de 7, un seul check-in/check-out, moins d\'usure du linge et des équipements, moins de communication voyageur. Pour un appartement en ville, le coût réel par nuit est bien inférieur en séjour 7 nuits vs 7 séjours d\'une nuit.' },
      { q: 'Comment comparer tarif nuitée et tarif hebdomadaire pour mon logement LCD ?', a: 'Calculez votre seuil de rentabilité : (coût ménage + linge + consommables) ÷ nombre de nuits du séjour = coût par nuit. Un séjour d\'une semaine avec réduction de 20 % doit rester au-dessus de ce seuil. Utilisez un tableau de bord LCD ou PriceLabs pour modéliser les scénarios.' },
    ]
  },
  {
    slug: 'titre-annonce-airbnb-optimiser-clics-visibilite',
    faq: [
      { q: 'Comment rédiger un bon titre d\'annonce Airbnb qui génère des clics ?', a: 'Un titre efficace combine : un bénéfice concret (vue mer, proche centre), un équipement clé (jacuzzi, terrasse) et le type de logement. Exemples : "Studio design · Vue panoramique · 5 min Vieux-Port" ou "Maison calme · Jardin privatif · Wifi fibre". Évitez les adjectifs génériques (beau, cosy, charmant).' },
      { q: 'Quelle est la longueur idéale d\'un titre d\'annonce Airbnb ?', a: 'Airbnb autorise 50 caractères. En pratique, les 30-35 premiers caractères sont visibles dans les résultats de recherche mobile. Mettez les informations les plus importantes au début. Testez différentes versions et observez l\'évolution du taux de clics dans les statistiques hôte.' },
      { q: 'Les mots-clés dans le titre Airbnb améliorent-ils le référencement ?', a: 'Oui. Airbnb analyse le titre pour catégoriser votre annonce dans les recherches. Mentionner le quartier, le type de logement (loft, mas, studio) et des équipements recherchés (piscine, parking, balcon) améliore votre classement dans les recherches filtrées.' },
      { q: 'Doit-on mettre des emojis dans le titre d\'une annonce Airbnb ?', a: 'Les emojis captent l\'attention visuellement mais doivent rester pertinents (🏖️ pour vue mer, 🏔️ pour montagne). Un ou deux maximum. Airbnb les autorise mais les filtres de recherche n\'en tiennent pas compte. L\'essentiel reste le contenu textuel du titre.' },
    ]
  },
  {
    slug: 'top-7-erreurs-nouveaux-hotes-lcd-eviter',
    faq: [
      { q: 'Quelles sont les erreurs les plus fréquentes des nouveaux hôtes Airbnb ?', a: 'Les 7 erreurs classiques : prix trop élevé au lancement (sans avis), photos de mauvaise qualité, minimum de nuits trop élevé, non-réponse rapide aux messages, règles de maison trop strictes, absence de tarification dynamique, et négliger les avis en ne répondant pas aux commentaires.' },
      { q: 'Comment éviter les mauvais avis lors de ses premières réservations LCD ?', a: 'Sur-communicer avant l\'arrivée (instructions claires, accès WiFi, check-in expliqué), configurer un guide de bienvenue digital, laisser des petites attentions (café, eau), et contacter le voyageur le premier soir pour s\'assurer que tout va bien. Les 5 premiers avis sont décisifs.' },
      { q: 'Quel tarif fixer pour un nouveau logement LCD sans avis ?', a: 'Lancez à -15 à -20 % sous le prix du marché local pour obtenir rapidement les premiers avis. Cette stratégie de lancement sacrifice un peu de revenu mais remplit le calendrier et déboque le classement Airbnb. Augmentez les prix dès 5-10 avis positifs.' },
      { q: 'Un nouveau hôte LCD doit-il activer la réservation instantanée ?', a: 'Oui, fortement recommandé au lancement. La réservation instantanée booste la visibilité dans l\'algorithme Airbnb et supprime la friction pour les voyageurs. Configurez des règles de filtrage (vérification d\'identité, avis positifs requis) pour garder le contrôle sans perdre en attractivité.' },
    ]
  },
  {
    slug: 'travaux-energetiques-lcd-aides-maprimerenov-2026',
    faq: [
      { q: 'Un logement LCD peut-il bénéficier de MaPrimeRénov\' en 2026 ?', a: 'Oui, sous conditions. Le logement doit être la résidence principale du propriétaire (donc pas un investissement LCD pur), avec un DPE avant travaux D, E, F ou G. Les travaux éligibles incluent isolation, pompe à chaleur, ventilation. Les logements uniquement en location courte durée sont en général exclus.' },
      { q: 'Quelles aides existent pour rénover un logement LCD énergivore ?', a: 'Pour les propriétaires bailleurs LCD : CEE (Certificats d\'Économies d\'Énergie) via les fournisseurs d\'énergie, éco-PTZ (prêt à taux zéro pour rénovation), et TVA réduite à 5,5 % sur les travaux d\'amélioration énergétique. MaPrimeRénov\' est plutôt réservée aux résidences principales.' },
      { q: 'Pourquoi rénover énergétiquement un logement LCD est rentable ?', a: 'Un DPE A ou B permet d\'augmenter le tarif nuitée (les voyageurs valorisent le confort thermique et les faibles charges), d\'éviter les futures restrictions légales sur les logements F/G, et de réduire les charges si le propriétaire supporte certains coûts. Le retour sur investissement est souvent inférieur à 5 ans.' },
      { q: 'Le DPE s\'applique-t-il aux locations de courte durée en 2026 ?', a: 'La réglementation sur les passoires thermiques (interdiction de location des logements G puis F) concerne principalement la location longue durée. En 2026, les meublés de tourisme ne sont pas encore soumis à la même obligation, mais certaines collectivités locales anticipent des restrictions.' },
    ]
  },
  {
    slug: 'trousse-premier-secours-lcd-equipement-obligatoire',
    faq: [
      { q: 'La trousse de premiers secours est-elle obligatoire dans un logement LCD ?', a: 'Il n\'existe pas d\'obligation légale explicite pour les meublés de tourisme en France, mais c\'est fortement recommandé et certaines plateformes (Airbnb, Booking) incluent ce critère dans leurs standards de sécurité. Son absence peut être mentionnée négativement dans les avis voyageurs.' },
      { q: 'Que doit contenir une trousse de premiers secours pour un logement LCD ?', a: 'Minimum recommandé : pansements variés, compresses stériles, bande de gaze, désinfectant (Biseptine ou Bétadine), ciseaux, pince à épiler, thermomètre, gel brûlure. En option pour logements avec piscine ou activités outdoor : garrot tourniquets, couverture de survie.' },
      { q: 'Où placer la trousse de premiers secours dans un meublé de tourisme ?', a: 'Dans la salle de bain ou la cuisine, accessible et visible. Signalez son emplacement dans le guide de bienvenue et avec un pictogramme. Une petite croix rouge sur la porte du placard suffit. Les voyageurs ne doivent pas avoir à chercher en cas d\'urgence.' },
      { q: 'Faut-il renouveler le contenu de la trousse de premiers secours régulièrement ?', a: 'Vérifiez les dates de péremption tous les 6 à 12 mois. Après chaque séjour avec incident signalé, rechargez les consommables utilisés. Certains hôtes incluent le contrôle de la trousse dans leur check-list de ménage entre chaque séjour.' },
    ]
  },
  {
    slug: 'tva-location-courte-duree-2026',
    faq: [
      { q: 'La TVA s\'applique-t-elle à la location courte durée en 2026 ?', a: 'Les meublés de tourisme sont en principe exonérés de TVA sous le régime LMNP. La TVA (10 % ou 20 %) s\'applique uniquement si vous fournissez des services para-hôteliers (petit-déjeuner, ménage quotidien, réception, linge changé quotidiennement) et dépassez le seuil de 91 900 € de CA.' },
      { q: 'Quel est le seuil de TVA pour la location courte durée en 2026 ?', a: 'Le seuil de franchise en base de TVA est de 91 900 € pour les activités de prestation de services (dont LCD avec services para-hôteliers). En dessous de ce seuil, pas de TVA à collecter ni à reverser. Au-dessus, assujettissement obligatoire à 10 % pour l\'hébergement.' },
      { q: 'Les conciergeries LCD doivent-elles facturer la TVA ?', a: 'Oui, les conciergeries (prestataires de services) sont soumises à TVA dès le premier euro si elles dépassent le seuil d\'auto-entrepreneur (77 700 € en 2026). Elles facturent 20 % sur leurs honoraires de gestion. L\'hôte peut déduire cette TVA s\'il est lui-même assujetti.' },
      { q: 'Comment déclarer la TVA pour un meublé de tourisme avec services ?', a: 'Si vous êtes assujetti à la TVA (para-hôtellerie + CA > seuil), vous déclarez via le formulaire CA3 (mensuel ou trimestriel). Vous collectez 10 % sur vos recettes d\'hébergement et pouvez déduire la TVA payée sur vos achats (ménage, équipements, travaux). Consultez un comptable pour votre cas précis.' },
    ]
  },
  {
    slug: 'tva-petit-dejeuner-lcd-seuil-37500-2026-detail',
    faq: [
      { q: 'Quel est le seuil TVA pour proposer le petit-déjeuner en LCD en 2026 ?', a: 'Proposer un petit-déjeuner qualifie votre activité en para-hôtellerie, ce qui peut entraîner l\'assujettissement à la TVA. Le seuil de franchise est de 91 900 € de CA annuel (révision 2026). Sous ce seuil, pas de TVA à collecter même avec petit-déjeuner.' },
      { q: 'Le petit-déjeuner en LCD est-il considéré comme un service para-hôtelier ?', a: 'Oui selon l\'administration fiscale, le petit-déjeuner est l\'un des 4 critères para-hôteliers (avec ménage quotidien, fourniture de linge et réception permanente). Proposer au moins 3 de ces 4 services fait basculer votre activité en para-hôtellerie, avec des implications fiscales et TVA.' },
      { q: 'Doit-on facturer la TVA sur le petit-déjeuner dans un meublé de tourisme ?', a: 'Si vous êtes assujetti à la TVA (para-hôtellerie + dépassement de seuil), le petit-déjeuner est taxé à 10 % (taux restauration). Si vous êtes en franchise de TVA (sous le seuil), vous n\'avez pas à le facturer mais devez mentionner "TVA non applicable - art. 293B CGI" sur vos factures.' },
      { q: 'Comment éviter l\'assujettissement à la TVA en proposant quand même des services en LCD ?', a: 'Limitez-vous à moins de 3 services para-hôteliers sur les 4 critères (petit-déjeuner, ménage quotidien, linge quotidien, réception permanente). Un ménage hebdomadaire ou en fin de séjour, et un panier de bienvenue ne sont pas considérés comme para-hôteliers. Consultez votre expert-comptable.' },
    ]
  },
  {
    slug: 'welcome-bag-lcd-12-idees-marquantes-budget',
    faq: [
      { q: 'Qu\'est-ce qu\'un welcome bag et pourquoi en mettre un dans son LCD ?', a: 'Un welcome bag est un panier ou sachet de bienvenue laissé pour les voyageurs à leur arrivée. Il crée une première impression positive, différencie votre logement de la concurrence et incite aux avis 5 étoiles. Un welcome bag bien pensé à 5-10 € peut générer des dizaines d\'avis enthousiastes.' },
      { q: 'Quelles sont les meilleures idées de welcome bag pour un logement LCD ?', a: 'Les classiques qui font toujours effet : café/thé local, eau plate et pétillante, biscuits ou chocolat, guide des bonnes adresses du quartier, gel douche/shampoing de qualité, et une petite carte personnalisée. Adaptez au profil voyageur : couple (verre de vin local), famille (bonbons, cahier de coloriages).' },
      { q: 'Quel budget prévoir pour un welcome bag LCD professionnel ?', a: 'De 5 à 15 € par séjour selon le standing. Pour un séjour moyen de 3 nuits à 80 €/nuit, un welcome bag à 8 € représente 3,3 % du revenu — largement rentabilisé par l\'impact sur les avis et le taux de rebook. Les hôtes Superhost plafonnent généralement à 10-12 € par accueil.' },
      { q: 'Un welcome bag améliore-t-il vraiment la note Airbnb ?', a: 'Les hôtes qui pratiquent le welcome bag rapportent régulièrement des mentions spécifiques dans leurs avis ("panier de bienvenue adorable", "attention aux détails"). Airbnb récompense les logements avec des avis positifs constants par une meilleure visibilité. L\'impact indirect sur le classement est réel.' },
    ]
  },
  {
    slug: 'workation-lcd-logement-equiper-louer-cher-hors-saison',
    faq: [
      { q: 'Qu\'est-ce que la workation et comment en profiter en LCD ?', a: 'La workation (work + vacation) désigne le télétravail depuis un logement de vacances. Cette tendance post-Covid génère des séjours de 7 à 30 nuits hors saison. Pour l\'attirer, votre logement doit avoir un bureau ergonomique, un wifi fibre rapide et des prises en nombre suffisant.' },
      { q: 'Comment équiper son logement LCD pour attirer les voyageurs en workation ?', a: 'Essentiels workation : bureau avec siège ergonomique, WiFi fibre (testez la vitesse et affichez-la), multiple prises et multiprises, bon éclairage naturel et artificiel, écran externe en option. Ces équipements se rentabilisent en 2-3 séjours workation supplémentaires par an.' },
      { q: 'Peut-on louer plus cher son logement LCD pour la workation ?', a: 'Oui. Les tarifs hebdomadaires workation peuvent être 10 à 20 % supérieurs aux tarifs classiques longue durée, grâce à la valeur perçue des équipements. Proposez des formules dédiées : "Forfait 7 nuits télétravail" avec early check-in et départ tardif inclus.' },
      { q: 'Quand la workation remplace-t-elle avantageusement les séjours classiques en LCD ?', a: 'En basse saison (novembre-mars hors vacances scolaires) et dans les villes universitaires ou de congrès. Un séjour workation de 2 semaines peut valoir 3× une semaine classique en termes de revenus nets (un seul ménage, moins de turnover, moins d\'usure). Ciblez les mois creux avec des offres workation.' },
    ]
  },
]

let injected = 0

for (const { slug, faq } of articles) {
  const path = `${BASE}/${slug}/index.html`
  let html
  try {
    html = readFileSync(path, 'utf8')
  } catch {
    console.warn(`NOT FOUND: ${slug}`)
    continue
  }

  if (html.includes('"@type":"FAQPage"') || html.includes('"@type": "FAQPage"')) {
    console.log(`SKIP (already has FAQPage): ${slug}`)
    continue
  }

  const mainEntity = faq.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  }))

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  }

  const scriptTag = `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`

  const updated = html.replace('</head>', `${scriptTag}\n</head>`)
  if (updated === html) {
    console.warn(`NO </head> FOUND: ${slug}`)
    continue
  }

  writeFileSync(path, updated, 'utf8')
  console.log(`OK: ${slug}`)
  injected++
}

console.log(`\nDone: ${injected} articles updated`)
