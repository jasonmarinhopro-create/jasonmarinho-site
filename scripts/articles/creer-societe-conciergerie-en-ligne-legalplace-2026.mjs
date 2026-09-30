// Article partenaire LegalPlace (partenariat Affilae du 30/09/2026, numéro
// d'affilié 1773). Liens rémunérés : rel="sponsored noopener" + mention
// visible. Prix LegalPlace relevés en septembre 2026, à revérifier.

const LP = 'utm_source=affilae&utm_medium=partner&utm_campaign=Jason%20Marinho&ae=1773'
const LP_SOCIETE = `https://creation.legalplace.fr/creation-entreprise-2?${LP}`
const LP_MICRO = `https://www.legalplace.fr/contrats/creation-micro-entreprise/?${LP}`
const LP_DOMICILIATION = `https://landing.legalplace.fr/domiciliation?${LP}`
const L = (href, label) => `<a href="${href}" style="color:var(--g);font-weight:500">${label}</a>`
const EXT = (href, label) => `<a href="${href}" rel="nofollow noopener" target="_blank" style="color:var(--g)">${label}</a>`

const btn = (href, label) => `<a href="${href}" target="_blank" rel="sponsored noopener" style="display:inline-flex;align-items:center;gap:6px;font-weight:600;font-size:14px;padding:10px 16px;border-radius:9px;text-decoration:none;background:#004c3f;color:#fff">${label}</a>`
const box = (intro, buttons) => `<div style="margin:18px 0 22px;padding:16px 18px;border:1px solid rgba(0,76,63,.18);border-radius:12px;background:rgba(0,76,63,.04)">
<p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#111827">${intro}</p>
<div style="display:flex;flex-wrap:wrap;gap:8px">${buttons}</div>
<p style="margin:10px 0 0;font-size:12.5px;line-height:1.5;color:#6B7280">Lien affilié : si tu passes par ce lien, LegalPlace me verse une commission, sans aucun surcoût pour toi. Tu peux aussi tout faire toi-même sur le guichet unique de l'INPI si tu es à l'aise avec les formalités.</p>
</div>`

export default {
  slug: 'creer-societe-conciergerie-en-ligne-legalplace-2026',
  title: 'Créer la structure de ta conciergerie en ligne : micro-entreprise, SASU ou EURL, et comment faire avec LegalPlace (2026)',
  seoTitle: 'Créer sa société de conciergerie en ligne en 2026',
  description: 'Micro-entreprise, SASU ou EURL pour ta conciergerie LCD : le bon statut selon ton activité, la carte G, le vrai coût en 2026 et la création en ligne avec LegalPlace.',
  keywords: 'créer conciergerie Airbnb, statut conciergerie, SASU conciergerie, micro-entreprise conciergerie, LegalPlace avis, création société en ligne, carte G conciergerie, domiciliation',
  date: '2026-09-30',
  categorySlug: 'conciergerie',
  readTime: 8,
  lead: 'Tu gères déjà un ou deux logements pour des proches et tu veux en faire une vraie conciergerie ? Avant de chercher tes premiers mandats, il faut une structure : micro-entreprise pour tester, SASU ou EURL pour grandir. Je suis partenaire de LegalPlace, qui crée des sociétés en ligne, et je te dis ici comment choisir, ce que ça coûte vraiment en 2026, la question de la carte G que beaucoup oublient, et quand il vaut mieux faire les démarches toi-même.',
  sections: [
    {
      h2: '1. Avant les statuts : ce que fait vraiment ta conciergerie',
      content: [
        { type: 'p', text: 'Le statut juridique ne suffit pas : c\'est ton organisation qui dit si tu dois détenir une carte professionnelle (loi Hoguet). Si l\'annonce est au nom du propriétaire, que les voyageurs paient directement sur son compte et que tu factures le ménage, l\'accueil et la gestion du calendrier, tu fais de la prestation de services, sans carte. Si tu encaisses les loyers pour le compte des propriétaires, il te faut une carte G (gestion immobilière), avec une garantie financière. Si tu publies les annonces à ton nom de conciergerie pour louer les logements, la carte T (transaction) peut être exigée.' },
        { type: 'tip', text: 'Les contrôles se sont durcis et un tribunal a déjà annulé les factures d\'une conciergerie qui encaissait sans carte G. Fais valider ton modèle par un juriste avant de signer tes premiers mandats, et appuie-toi sur ' + L('/blog/contrat-mandat-conciergerie-lcd-modele-clauses', 'les clauses indispensables du contrat de mandat') + '.' },
      ],
    },
    {
      h2: '2. La micro-entreprise : pour tester sans risque',
      content: [
        { type: 'p', text: 'Pour démarrer, la micro-entreprise reste la solution la plus simple : une conciergerie relève des prestations de services commerciales (BIC). En 2026, tu paies 21,2 % de cotisations sociales sur ton chiffre d\'affaires, tu peux encaisser jusqu\'à 83 600 € par an, et pour l\'impôt, l\'administration applique un abattement forfaitaire de 50 %. Tu n\'as pas de TVA à facturer tant que tu restes sous la franchise des prestations de services : 37 500 € de chiffre d\'affaires (seuil majoré de 41 250 €).' },
        { type: 'ul', items: [
          'Création gratuite sur le guichet unique de l\'INPI, ou accompagnée si tu préfères être guidé',
          'ACRE : cotisations réduites la première année (depuis le 1er juillet 2026, tu paies 75 % du taux normal au lieu de 50 %)',
          'Limite : ta responsabilité n\'est pas séparée de ton patrimoine, et tes charges réelles (voiture, salariés, logiciels) ne sont pas déductibles',
        ] },
        { type: 'html', html: box('<strong>Créer ta micro-entreprise accompagné :</strong> LegalPlace s\'occupe de la déclaration en ligne et peut aussi domicilier ton entreprise, pour ne pas afficher ton adresse personnelle sur les factures et les annuaires.', btn(LP_MICRO, 'Créer ma micro-entreprise') + ' ' + btn(LP_DOMICILIATION, 'Domicilier mon entreprise')) },
      ],
    },
    {
      h2: '3. SASU ou EURL : quand passer en société',
      content: [
        { type: 'p', text: 'La société devient intéressante quand ton activité se confirme : plus de 8 à 10 mandats, l\'envie d\'embaucher ou de sous-traiter le ménage à grande échelle, des propriétaires plus exigeants (investisseurs, résidences) qui préfèrent traiter avec une société, ou un chiffre d\'affaires qui approche du plafond de la micro. Tes charges réelles deviennent déductibles et ta responsabilité est limitée à tes apports.' },
        { type: 'ul', items: [
          'SASU : tu es président, assimilé salarié. Protection sociale proche de celle d\'un salarié, cotisations plus élevées sur ta rémunération, mais aucune cotisation si tu ne te verses rien et te rémunères en dividendes. Souple pour faire entrer un associé plus tard (passage en SAS)',
          'EURL : tu es gérant, travailleur non salarié. Cotisations plus faibles à rémunération égale, protection sociale moins complète, cotisations minimales même sans rémunération',
          'Dans les deux cas : un expert-comptable ou un logiciel de comptabilité devient indispensable (bilan, liasse, TVA si tu dépasses la franchise)',
        ] },
        { type: 'p', text: 'Il n\'y a pas de bon choix universel : tout dépend de ce que tu veux te verser et de ta situation personnelle. Pour chiffrer, ' + L('/services/simulateurs/choisir-statut-ei-sasu', 'mon simulateur EI ou SASU') + ' compare les deux régimes, et ' + L('/blog/scaler-conciergerie-5-30-mandats-process', 'mon article pour passer de 5 à 30 mandats') + ' détaille le bon moment pour changer de structure.' },
      ],
    },
    {
      h2: '4. Ce que coûte vraiment une création de société en 2026',
      content: [
        { type: 'p', text: 'Quelle que soit la façon dont tu crées ta SASU, certains frais sont obligatoires : environ 195 € en 2026 d\'après LegalPlace, soit l\'annonce légale (142 € HT en métropole), l\'immatriculation (33,83 €) et la déclaration des bénéficiaires effectifs (19,33 €). À cela s\'ajoute le dépôt du capital social, qui reste à toi.' },
        { type: 'p', text: 'Côté accompagnement, LegalPlace propose des formules qui vont de la simple génération des statuts à la prise en charge complète du dossier : relevés de septembre 2026, la rédaction des statuts d\'une SASU commence autour de 99 € HT hors frais obligatoires, et une création complète revient en général entre 350 et 400 € tout compris. Vérifie la grille officielle avant de choisir, les formules évoluent souvent.' },
      ],
    },
    {
      h2: '5. Créer ta société avec LegalPlace, étape par étape',
      content: [
        { type: 'ul', items: [
          'Un questionnaire en ligne : forme (SASU, SAS, EURL, SARL), nom, activité, capital, siège',
          'Les statuts générés à partir de tes réponses, relus avant signature selon la formule choisie',
          'Le dépôt du capital sur un compte pro, puis l\'attestation de dépôt',
          'L\'annonce légale et le dossier d\'immatriculation déposés sur le guichet unique',
          'Le Kbis reçu à la fin : ta conciergerie peut facturer',
        ] },
        { type: 'html', html: box('<strong>Créer la société de ta conciergerie :</strong> SASU, SAS, EURL ou SARL, en ligne avec LegalPlace. La domiciliation est proposée aussi, pratique si tu travailles depuis chez toi.', btn(LP_SOCIETE, 'Créer ma société') + ' ' + btn(LP_DOMICILIATION, 'Domicilier ma société')) },
        { type: 'tip', text: 'Faire toi-même reste possible et moins cher : les statuts types et le guichet unique de l\'INPI suffisent pour une SASU simple. L\'accompagnement se justifie surtout si tu manques de temps ou si tu veux éviter une erreur dans l\'objet social ou la répartition du capital.' },
      ],
    },
    {
      h2: '6. Juste après la création',
      content: [
        { type: 'ul', items: [
          'Un compte pro séparé : obligatoire pour une société, et plus simple pour suivre ta rentabilité (voir ' + L('/blog/compte-bancaire-pro-hote-lcd-6-raisons-choisir-2026', 'les 6 raisons d\'ouvrir un compte pro') + ')',
          'Une assurance responsabilité civile professionnelle adaptée à la gestion de logements',
          'Une plateforme agréée pour recevoir tes factures électroniques : obligatoire depuis le 1er septembre 2026 (voir ' + L('/blog/indy-lmnp-location-courte-duree-avis-2026', 'mon article sur Indy, gratuit pour la réception') + ')',
          'Un contrat de mandat solide avec chaque propriétaire, et des contrats signés avec les voyageurs pour les réservations directes : ' + L('/services/contrats', 'l\'espace contrats de l\'app') + ' s\'en charge',
        ] },
        { type: 'p', text: 'Pour le reste du lancement (tarifs, premiers clients, outils), mon guide ' + L('/blog/creer-conciergerie-airbnb-2025', 'créer sa conciergerie Airbnb') + ' reprend chaque étape, et ' + L('/partenaires/legalplace', 'ma page partenaire LegalPlace') + ' résume l\'offre.' },
      ],
    },
    {
      h2: 'Sources',
      content: [
        { type: 'ul', items: [
          'Cotisations et seuils de la micro-entreprise : ' + EXT('https://www.economie.gouv.fr/entreprises/gerer-sa-micro-entreprise/micro-entreprises-quel-est-le-montant-de-vos-cotisations-sociales', 'economie.gouv.fr'),
          'ACRE à partir du 1er juillet 2026 : ' + EXT('https://www.portail-autoentrepreneur.fr/academie/statut-auto-entrepreneur/changements-2026-auto-entrepreneurs', 'portail-autoentrepreneur.fr'),
          'Coût de création d\'une SASU en 2026 : ' + EXT('https://www.legalplace.fr/guides/cout-creation-sasu/', 'legalplace.fr (guide)'),
          'Conciergerie et carte professionnelle : ' + EXT('https://efisio.fr/conciergerie-airbnb-sans-carte-professionnelle-t-g-etes-vous-dans-lillegalite/', 'efisio.fr'),
          'Prix LegalPlace relevés en septembre 2026, à vérifier sur la grille officielle',
        ] },
      ],
    },
  ],
  related: [
    { slug: 'creer-conciergerie-airbnb-2025', label: 'Créer sa conciergerie Airbnb : le guide', categoryLabel: 'Conciergerie' },
    { slug: 'contrat-mandat-conciergerie-lcd-modele-clauses', label: 'Contrat de mandat de conciergerie : les clauses clés', categoryLabel: 'Conciergerie' },
    { slug: 'scaler-conciergerie-5-30-mandats-process', label: 'Passer de 5 à 30 mandats : les process', categoryLabel: 'Conciergerie' },
  ],
}
