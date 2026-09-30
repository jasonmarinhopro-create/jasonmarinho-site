// Article partenaire Indy (partenariat validé le 30/09/2026). Lien affilié
// « spécial immobilier » fourni par Indy : toujours rel="sponsored noopener"
// + mention visible. Prix : relevés de septembre 2026, à revérifier avant
// toute mise à jour (grille officielle indy.fr).

const INDY = 'https://urlr.me/FEqNfy'
// Liens par thème (kit partenaire Indy) : numéro d'affilié 1994 (trackingId
// Affilae, confirmé par l'API le 30/09/2026), code PREMIERMOIS = 1er mois offert
const INDY_AE = 'utm_source=1994&utm_medium=affiliate&utm_campaign=affilae&promocode=PREMIERMOIS&ae=1994'
const INDY_FE = `https://www.indy.fr/facturation-electronique/?${INDY_AE}&utm_content=facturation`
const INDY_CREATION = `https://www.indy.fr/creation-lmnp/?${INDY_AE}&utm_content=creation-lmnp`
const S = (href, label) => `<a href="${href}" target="_blank" rel="sponsored noopener" style="color:var(--g);font-weight:600">${label}</a> <span style="font-size:12px;color:#6B7280">(lien affilié)</span>`
const L = (href, label) => `<a href="${href}" style="color:var(--g);font-weight:500">${label}</a>`

const box = (intro, cta, href = INDY) => `<div style="margin:18px 0 22px;padding:16px 18px;border:1px solid rgba(0,76,63,.18);border-radius:12px;background:rgba(0,76,63,.04)">
<p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#111827">${intro}</p>
<a href="${href}" target="_blank" rel="sponsored noopener" style="display:inline-flex;align-items:center;gap:6px;font-weight:600;font-size:14px;padding:10px 16px;border-radius:9px;text-decoration:none;background:#004c3f;color:#fff">${cta}</a>
<p style="margin:10px 0 0;font-size:12.5px;line-height:1.5;color:#6B7280">Lien affilié : si tu t'inscris via ce lien, Indy me verse une commission, sans aucun surcoût pour toi (tu as au contraire ton premier mois offert). Mon avis reste indépendant, limites comprises.</p>
</div>`

export default {
  slug: 'indy-lmnp-location-courte-duree-avis-2026',
  title: 'Indy pour ta location courte durée : compta LMNP, déclaration et facture électronique (mon avis 2026)',
  seoTitle: 'Indy LMNP : mon avis pour ta location courte durée',
  description: 'Indy pour un hôte LMNP en 2026 : ce qui est gratuit, la liasse 2031 au réel, la facture électronique obligatoire depuis septembre, le vrai prix et ses limites.',
  keywords: 'Indy LMNP, Indy avis, comptabilité LMNP, liasse 2031 LMNP, facture électronique LMNP, plateforme agréée, location meublée de tourisme, déclaration LMNP 2026',
  date: '2026-09-30',
  categorySlug: 'fiscalite',
  readTime: 8,
  lead: 'Bonne nouvelle : je suis désormais partenaire d\'Indy, et tu as ton premier mois offert en passant par mon lien. Je te dis tout de suite pourquoi j\'ai dit oui : c\'est l\'outil que je conseille le plus souvent aux hôtes qui me demandent comment tenir leur compta LMNP et faire leur déclaration eux-mêmes, et depuis le 1er septembre 2026 il règle aussi la question de la facture électronique. Voici ce qu\'Indy fait vraiment pour une location courte durée, ce qui est gratuit, ce qui est payant, et les cas où je te conseille autre chose.',
  sections: [
    {
      h2: '1. Pourquoi Indy parle autant aux hôtes LMNP',
      content: [
        { type: 'p', text: 'Quand tu loues un meublé de tourisme, tes recettes relèvent des BIC, en location meublée non professionnelle (LMNP) dans la grande majorité des cas. Au micro-BIC, c\'est simple : tu déclares tes recettes et l\'administration applique l\'abattement (30 % pour un meublé non classé, 50 % pour un meublé classé ou une chambre d\'hôtes en 2026). Au régime réel, c\'est là que ça se complique : il faut tenir une comptabilité, calculer les amortissements du bien et du mobilier, puis produire et télétransmettre la liasse fiscale 2031 avec ses annexes 2033.' },
        { type: 'p', text: 'C\'est exactement ce travail qu\'Indy automatise : tu relies ton compte bancaire, les opérations sont classées, les amortissements sont calculés par composants et la liasse est générée puis envoyée aux impôts depuis l\'outil. Un expert-comptable spécialisé LMNP facture en général entre 400 et 900 € par an pour ce dossier. Si ton dossier est simple (un ou deux logements en nom propre), tu peux tout faire toi-même, guidé pas à pas. Et si tu préfères déléguer, Indy propose aussi une option avec un cabinet d\'expertise comptable partenaire : tu choisis, sans changer d\'outil. Indy compte plus de 500 000 utilisateurs et une note de 4,8/5 sur <a href="https://fr.trustpilot.com/review/indy.fr" rel="nofollow noopener" target="_blank" style="color:var(--g);font-weight:500">Trustpilot</a> (plus de 14 000 avis, chiffres communiqués par Indy en août 2026). Pour voir l\'outil en vrai, regarde <a href="https://www.youtube.com/watch?v=JKRKL88BaIA" rel="nofollow noopener" target="_blank" style="color:var(--g);font-weight:500">la démo d\'Indy pour les LMNP en 5 minutes</a>. Pour savoir quel régime te convient, commence par ' + L('/blog/regime-reel-vs-micro-bic-decision-2026', 'mon comparatif micro-BIC ou régime réel') + ' et fais le calcul avec ' + L('/services/simulateurs', 'les simulateurs fiscaux gratuits') + '.' },
        { type: 'html', html: box('<strong>Essayer Indy :</strong> inscription gratuite, puis <strong>premier mois offert sans engagement</strong> sur les offres payantes en passant par ce lien.', 'Essayer Indy gratuitement') },
      ],
    },
    {
      h2: '2. Ce qui est gratuit (et suffit souvent au micro-BIC)',
      content: [
        { type: 'p', text: 'Indy a une offre gratuite à vie, sans carte bancaire. Pour un hôte au micro-BIC, elle couvre l\'essentiel : suivre tes recettes et tes dépenses au même endroit, synchroniser ta banque, et surtout recevoir et émettre tes factures électroniques via une plateforme agréée, ce qui est devenu une obligation (voir la partie suivante).' },
        { type: 'ul', items: [
          'Suivi des recettes et des dépenses, relié à ton compte bancaire',
          'Facturation et facture électronique (réception et émission) sans frais',
          'Compte pro Indy gratuit, si tu veux séparer tes revenus LCD de tes dépenses perso',
          'Création de ton activité LMNP (formalité de début d\'activité et numéro SIRET) sans frais : ' + S(INDY_CREATION, 'créer mon LMNP avec Indy'),
        ] },
        { type: 'tip', text: 'Au micro-BIC, tu n\'as pas de liasse fiscale à produire : tes recettes brutes vont directement sur ta déclaration de revenus (2042-C-PRO). Garde tout de même un suivi propre, il te servira le jour où tu voudras comparer avec le réel.' },
      ],
    },
    {
      h2: '3. La facture électronique : ce qui a changé le 1er septembre 2026',
      content: [
        { type: 'p', text: 'Depuis le 1er septembre 2026, toutes les entreprises assujetties à la TVA doivent pouvoir recevoir leurs factures fournisseurs au format électronique, via une plateforme agréée. Un loueur en meublé est concerné même s\'il est exonéré de TVA ou en franchise : il est assujetti, simplement exonéré. Concrètement, tes factures de ménage, de conciergerie, de linge ou de travaux arriveront de plus en plus par ce canal. Au 1er septembre 2027 viendront l\'émission des factures électroniques et la transmission des données de vente (e-reporting), mais seulement pour les entreprises qui ne sont pas exonérées de TVA : un loueur en meublé exonéré reste concerné par la seule réception.' },
        { type: 'p', text: 'Indy est immatriculée comme plateforme agréée par l\'administration fiscale depuis le 9 janvier 2026, et cette fonction est comprise dans l\'offre gratuite. Pour un hôte qui n\'avait aucun outil, c\'est la façon la plus simple de se mettre en règle sans rien payer : tu crées ton compte, tu choisis Indy comme plateforme, et tes fournisseurs peuvent t\'adresser leurs factures. Indy montre l\'inscription pas à pas dans <a href="https://www.youtube.com/watch?v=eyymdeQWxLo" rel="nofollow noopener" target="_blank" style="color:var(--g);font-weight:500">une vidéo de 2 minutes</a>.' },
        { type: 'html', html: box('<strong>Te mettre en règle gratuitement :</strong> crée ton compte Indy et choisis-le comme plateforme agréée pour recevoir tes factures électroniques. Gratuit et illimité, premier mois offert sur les offres payantes.', 'Recevoir mes factures électroniques avec Indy', INDY_FE) },
        { type: 'tip', text: 'Ne confonds pas la facture électronique entre professionnels et le reçu que tu remets à tes voyageurs. Pour tes réservations directes, l\'' + L('/services/contrats', 'espace contrats de l\'app Jason Marinho') + ' génère le contrat signé en ligne, encaisse le loyer et produit la facture du séjour.' },
      ],
    },
    {
      h2: '4. Au régime réel : ce que fait l\'offre LMNP payante',
      content: [
        { type: 'p', text: 'L\'offre dédiée aux loueurs en meublé (LMNP et SCI) ajoute tout ce qui est propre au réel : le calcul des amortissements par composants (gros œuvre, toiture, équipements, mobilier sur des durées différentes), la tenue de la comptabilité complète, la génération de la liasse 2031 et des annexes 2033-A à 2033-G, puis leur télétransmission aux impôts. L\'offre LMNP d\'Indy existe depuis septembre 2025 et couvre aussi le micro-BIC.' },
        { type: 'ul', items: [
          'Prix relevé en septembre 2026 : 24 € HT par mois en paiement annuel, soit 288 € HT (345,60 € TTC) par an, ou environ 32 € HT en paiement mensuel',
          'Premier mois offert et sans engagement avec le lien partenaire',
          'Option expert-comptable : un cabinet partenaire agréé tient ta comptabilité à ta place, si tu préfères déléguer',
          'Pour repère, un cabinet spécialisé LMNP facture en général 400 à 900 € par an',
        ] },
        { type: 'p', text: 'Les prix d\'Indy changent régulièrement : vérifie toujours la grille officielle avant de t\'abonner. L\'abonnement est une charge déductible au réel, comme les frais de plateforme, le ménage ou l\'assurance.' },
      ],
    },
    {
      h2: '5. Le piège Airbnb et Booking à connaître avant de te lancer',
      content: [
        { type: 'p', text: 'Airbnb et Booking te versent un montant net : la commission est déjà retirée. Or tes recettes à déclarer sont les montants bruts payés par le voyageur, et la commission est une charge. Si tu te contentes des virements reçus sur ton compte, tu sous-déclares tes recettes au micro-BIC (l\'abattement ne s\'applique pas sur le bon montant) et tu fausses ta comptabilité au réel. Le bon réflexe : chaque mois, télécharge le relevé des versements de chaque plateforme et saisis le brut d\'un côté, la commission de l\'autre.' },
        { type: 'p', text: 'C\'est un point à régler quel que soit l\'outil, et Indy ne le fait pas à ta place puisqu\'il lit ta banque, pas ton compte Airbnb. Dans l\'app Jason Marinho, Mes finances te permet de noter chaque séjour avec son montant brut et sa commission, logement par logement, et fait les totaux de l\'année pour toi.' },
      ],
    },
    {
      h2: '6. Les limites d\'Indy (pour quand ce n\'est pas le bon choix)',
      content: [
        { type: 'ul', items: [
          'Ce n\'est pas un logiciel de gestion locative : pas de calendrier, pas de messages voyageurs, pas de synchronisation avec Airbnb ou Booking',
          'Situations complexes (indivision, passage en LMP, plusieurs biens dont une SCI à l\'impôt sur les sociétés, cession avec plus-value) : prends l\'option expert-comptable d\'Indy ou un cabinet',
          'Au-delà de 23 000 € de recettes en courte durée, des cotisations sociales sont dues même en LMNP : Indy fait ta compta, mais le choix du statut mérite un vrai conseil',
          'Tu restes responsable de ce que tu déclares : l\'outil guide, il ne remplace pas une relecture',
        ] },
        { type: 'p', text: 'Si tu cherches une alternative focalisée sur la seule déclaration annuelle, je compare aussi ' + L('/blog/declarer-lmnp-sans-expert-comptable-decla-fr', 'la déclaration LMNP sans expert-comptable avec decla.fr') + ', et ' + L('/comparatif-indy-tiime-henrri', 'Indy face à Tiime et Henrri') + '.' },
      ],
    },
    {
      h2: '7. Mon avis',
      content: [
        { type: 'p', text: 'Pour un hôte au micro-BIC, Indy gratuit est une évidence depuis septembre : tu te mets en règle avec la facture électronique et tu suis tes chiffres sans rien payer. Pour un hôte au réel avec un dossier simple, l\'offre LMNP te permet de faire ta déclaration toi-même, guidé pas à pas, et de garder la main sur tes chiffres toute l\'année. Pour un dossier complexe, ou si tu préfères déléguer, l\'option expert-comptable d\'Indy te laisse le choix sans changer d\'outil. C\'est aussi simple que ça, et c\'est pour ça que j\'ai accepté ce partenariat. L\'offre en résumé est aussi sur ' + L('/partenaires/indy', 'ma page partenaire Indy') + '.' },
        { type: 'html', html: box('<strong>Ton premier mois offert :</strong> crée ton compte Indy gratuitement, puis passe à l\'offre LMNP quand tu en as besoin, sans engagement.', 'Créer mon compte Indy') },
      ],
    },
    {
      h2: 'Sources',
      content: [
        { type: 'ul', items: [
          'Indy, offre LMNP : <a href="https://www.indy.fr/lmnp/" rel="nofollow noopener" target="_blank" style="color:var(--g)">indy.fr/lmnp</a>',
          'Indy, immatriculation comme plateforme agréée : <a href="https://www.indy.fr/blog/indy-pdp/" rel="nofollow noopener" target="_blank" style="color:var(--g)">indy.fr/blog/indy-pdp</a>',
          'Facturation électronique des LMNP, obligations et échéances : <a href="https://www.jedeclaremonmeuble.com/facturation-electronique-lmnp-obligations/" rel="nofollow noopener" target="_blank" style="color:var(--g)">jedeclaremonmeuble.com</a>',
          'Régimes d\'imposition (micro et réel) : <a href="https://www.impots.gouv.fr/particulier/les-regimes-dimposition" rel="nofollow noopener" target="_blank" style="color:var(--g)">impots.gouv.fr</a>',
          'Prix relevés en septembre 2026, à vérifier sur la grille officielle d\'Indy avant de t\'abonner',
        ] },
      ],
    },
  ],
  related: [
    { slug: 'regime-reel-vs-micro-bic-decision-2026', label: 'Micro-BIC ou régime réel : comment décider en 2026', categoryLabel: 'Fiscalité' },
    { slug: 'declarer-lmnp-sans-expert-comptable-decla-fr', label: 'Déclarer son LMNP sans expert-comptable', categoryLabel: 'Fiscalité' },
    { slug: 'compte-bancaire-pro-hote-lcd-6-raisons-choisir-2026', label: 'Compte bancaire pro : 6 raisons d\'en ouvrir un', categoryLabel: 'Ressources' },
  ],
}
