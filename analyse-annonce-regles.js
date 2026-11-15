/* Analyse d'une annonce Airbnb par règles (15/11/2026, demande de Jason).
   Calcul pur, sans réseau ni IA : reçoit les faits lus sur la page publique de
   l'annonce (scripts/api-analyse/lire-annonce.cjs) et rend une note sur 100
   avec des conseils classés. Utilisé par /services/analyse-annonce-airbnb,
   testé par jason-app/lib/site/analyse-annonce.test.ts.

   Le barème est le nôtre. Il s'appuie sur des repères publics (titre limité à
   50 caractères, 32 visibles sur mobile, Coups de cœur voyageurs : 4,9 de
   moyenne et 5 avis) et sur ce qui fait une annonce complète et claire.
   L'algorithme d'Airbnb n'est pas public : ne jamais écrire le contraire. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AnalyseAnnonce = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var TITRE_MAX = 50;
  var TITRE_MOBILE = 32;

  /* Dix équipements de base, reconnus dans les libellés de la page Airbnb. */
  var EQUIPEMENTS = [
    { id: 'wifi', label: 'Wifi', re: /wi-?fi/i },
    { id: 'cuisine', label: 'Cuisine', re: /^cuisine|kitchenette/i },
    { id: 'autonome', label: 'Arrivée autonome', re: /arriv[ée]e autonome|bo[iî]te à cl[ée]s|serrure/i },
    { id: 'lave-linge', label: 'Lave-linge', re: /lave-linge/i },
    { id: 'travail', label: 'Espace de travail', re: /espace de travail/i },
    { id: 'parking', label: 'Parking', re: /parking|stationnement/i },
    { id: 'temperature', label: 'Climatisation ou chauffage', re: /climatisation|chauffage/i },
    { id: 'tv', label: 'Télévision', re: /t[ée]l[ée]vision|^tv\b/i },
    { id: 'linge', label: 'Draps et serviettes', re: /draps|linge de lit|serviettes|[ée]quipements de base/i },
    { id: 'fumee', label: 'Détecteur de fumée', re: /d[ée]tecteur de fum[ée]e/i }
  ];

  var TYPES = /\b(appartement|appart|studio|maison|villa|loft|chalet|g[iî]te|duplex|triplex|t[1-5]|f[1-5]|chambre|suite|cabane|mas|bastide|longère|penthouse|maisonnette|pavillon|tiny house|péniche|roulotte)\b/i;
  var ATOUTS = /\b(vue|terrasse|balcon|jardin|piscine|parking|garage|clim|climatis[ée]e?|jacuzzi|spa|sauna|thermes|centre|hypercentre|plage|mer|océan|lac|gare|m[ée]tro|tram|wifi|fibre|calme|chemin[ée]e|montagne|ski|pistes|port|vieille ville|rooftop|patio|cour)\b/i;
  var VIDES = /\b(magnifique|superbe|incroyable|exceptionnel(le)?|sublime|top|g[ée]nial|parfait|merveilleux|splendide)\b/i;
  var EMOJI = /[☀-➿\uD83C-\uDBFF⭐✨]/;

  var THEMES = [
    { label: 'du couchage', re: /\b(lits?|chambres?|canap[ée]|couchages?|matelas|literie)\b/i, aide: 'Précise le nombre de lits, leur taille et où ils se trouvent.' },
    { label: 'de la cuisine', re: /\b(cuisine|kitchenette|four|plaques|lave-vaisselle|cafeti[èe]re|frigo|r[ée]frig[ée]rateur)\b/i, aide: 'Dis ce qu\'on peut y préparer : plaques, four, cafetière, lave-vaisselle.' },
    { label: 'de l\'emplacement', re: /\b(quartier|village|proche|près|proximit[ée]|à \d+ ?(min|minutes|m|km)|commerces|centre|plage|gare|m[ée]tro|tram|bus|à pied|restaurants)\b/i, aide: 'Donne des distances concrètes : « à 5 min à pied de la gare », « plage à 300 m ».' },
    { label: 'de l\'arrivée', re: /\b(arriv[ée]e|check-?in|cl[ée]s?|bo[iî]te à cl[ée]s|autonome|accueil|digicode|serrure)\b/i, aide: 'Explique comment on entre : boîte à clés, serrure connectée ou accueil en personne.' },
    { label: 'du public visé', re: /\b(couples?|familles?|familiale?|enfants?|t[ée]l[ée]travail|professionnels?|amis|voyageurs? d'affaires|déplacement|b[ée]b[ée])\b/i, aide: 'Écris pour qui le logement est fait : couple, famille, déplacement professionnel.' }
  ];

  var SOUS_NOTES = { proprete: 'la propreté', exactitude: 'l\'exactitude de l\'annonce', arrivee: 'l\'arrivée', communication: 'la communication', emplacement: 'l\'emplacement', qualitePrix: 'le rapport qualité-prix' };

  function txt(v) { return typeof v === 'string' ? v.trim() : ''; }
  function nb(v) { return typeof v === 'number' && isFinite(v) ? v : null; }
  function fr(n) { return String(n).replace('.', ','); }

  function analyserTitre(titre, conseils, forts) {
    var max = 20, pts = 0, n = titre.length;
    if (!n) {
      conseils.push({ section: 'titre', perte: 20, titre: 'Ton annonce n\'a pas de titre lisible', texte: 'La page n\'a pas livré de titre : vérifie que l\'annonce est bien publiée.' });
      return { id: 'titre', label: 'Titre', score: 0, max: max };
    }
    if (n > TITRE_MAX) {
      pts += 2;
      conseils.push({ section: 'titre', perte: 4, titre: 'Raccourcis ton titre à 50 caractères', texte: 'Ton titre fait ' + n + ' caractères. Airbnb limite le titre à 50 caractères, espaces compris.' });
    } else if (n < 15) {
      pts += 2;
      conseils.push({ section: 'titre', perte: 4, titre: 'Ton titre est trop court', texte: 'Tu utilises ' + n + ' caractères sur 50. Ajoute le type de logement et ton meilleur atout.' });
    } else if (n < 25) {
      pts += 4;
      conseils.push({ section: 'titre', perte: 2, titre: 'Utilise mieux la place du titre', texte: 'Tu utilises ' + n + ' caractères sur 50. Il reste de la place pour un atout concret (vue, terrasse, parking).' });
    } else {
      pts += 6;
      forts.push('Ton titre a une bonne longueur (' + n + ' caractères sur 50).');
    }

    var debut = titre.slice(0, TITRE_MOBILE);
    if (ATOUTS.test(debut) || TYPES.test(debut)) pts += 4;
    else conseils.push({ section: 'titre', perte: 4, titre: 'Mets l\'essentiel au début du titre', texte: 'Sur mobile, environ 32 caractères du titre sont visibles dans les résultats. Place le type de logement ou ton meilleur atout dans cette partie.' });

    if (TYPES.test(titre)) pts += 3;
    else conseils.push({ section: 'titre', perte: 3, titre: 'Indique le type de logement', texte: 'Studio, appartement, maison, chalet : le voyageur doit savoir ce qu\'il réserve dès le titre.' });

    if (ATOUTS.test(titre)) { pts += 4; forts.push('Ton titre cite un atout concret.'); }
    else conseils.push({ section: 'titre', perte: 4, titre: 'Ajoute un atout concret au titre', texte: 'Un titre qui cite une vue, une terrasse, un parking ou la proximité d\'un lieu connu donne une raison de cliquer.' });

    var lettres = titre.replace(/[^A-Za-zÀ-ÿ]/g, '');
    var majuscules = lettres.replace(/[^A-ZÀ-Þ]/g, '');
    var criard = (lettres.length >= 10 && majuscules.length / lettres.length > 0.5) || /!{2,}/.test(titre) || EMOJI.test(titre);
    var vide = VIDES.test(titre);
    if (!criard && !vide) pts += 3;
    if (criard) conseils.push({ section: 'titre', perte: 2, titre: 'Retire les majuscules, les « !!! » et les émojis du titre', texte: 'Ils prennent de la place sans rien apprendre au voyageur et donnent un air de publicité.' });
    if (vide) conseils.push({ section: 'titre', perte: 1, titre: 'Remplace les adjectifs vagues par un fait', texte: '« Magnifique » ou « superbe » ne disent rien. « Vue mer », « terrasse 20 m² » ou « à 5 min de la gare » se vérifient.' });

    return { id: 'titre', label: 'Titre', score: Math.min(pts, max), max: max };
  }

  function analyserDescription(desc, conseils, forts) {
    var max = 20, pts = 0, n = desc.length;
    if (!n) {
      conseils.push({ section: 'description', perte: 20, titre: 'Ton annonce n\'a pas de description', texte: 'Écris au moins 400 caractères : le logement, le quartier, l\'arrivée.' });
      return { id: 'description', label: 'Description', score: 0, max: max };
    }
    if (n < 150) {
      pts += 2;
      conseils.push({ section: 'description', perte: 6, titre: 'Ta description est trop courte', texte: 'Elle fait ' + n + ' caractères. Vise au moins 400 caractères : le logement, le quartier, l\'arrivée.' });
    } else if (n < 400) {
      pts += 5;
      conseils.push({ section: 'description', perte: 3, titre: 'Étoffe ta description', texte: 'Elle fait ' + n + ' caractères. Entre 400 et 1 500 caractères, tu réponds aux questions avant qu\'on te les pose.' });
    } else if (n <= 1500) {
      pts += 8;
      forts.push('Ta description a une bonne longueur (' + n + ' caractères).');
    } else {
      pts += 6;
      conseils.push({ section: 'description', perte: 2, titre: 'Resserre ta description', texte: 'Elle fait ' + n + ' caractères. Garde l\'essentiel en haut et déplace le détail (règles, accès) dans les rubriques prévues par Airbnb.' });
    }

    if ((desc.match(/\n/g) || []).length >= 2) pts += 2;
    else conseils.push({ section: 'description', perte: 2, titre: 'Découpe ta description en paragraphes', texte: 'Un bloc de texte ne se lit pas sur un téléphone. Fais des paragraphes courts : le logement, le quartier, l\'arrivée.' });

    var manque = 0;
    THEMES.forEach(function (t) {
      if (t.re.test(desc)) pts += 2;
      else { manque++; conseils.push({ section: 'description', perte: 2, titre: 'Parle ' + t.label, texte: t.aide }); }
    });
    if (!manque) forts.push('Ta description couvre le logement, l\'emplacement, l\'arrivée et le public visé.');

    return { id: 'description', label: 'Description', score: Math.min(pts, max), max: max };
  }

  function analyserPhotos(p, conseils, forts) {
    var max = 25, pts = 0, n = p.total;
    var photographe = { href: '/trouver-un-pro', label: 'Trouver un photographe près de chez toi' };
    if (n < 5) { pts += 2; conseils.push({ section: 'photos', perte: 10, titre: 'Ajoute des photos', texte: 'Ton annonce a ' + n + ' photo' + (n > 1 ? 's' : '') + '. Vise au moins 20, avec chaque pièce et l\'extérieur.', lien: photographe }); }
    else if (n < 10) { pts += 5; conseils.push({ section: 'photos', perte: 7, titre: 'Ajoute des photos', texte: 'Ton annonce a ' + n + ' photos. Vise au moins 20 : chaque pièce sous deux angles, la salle de bain, l\'extérieur.', lien: photographe }); }
    else if (n < 15) { pts += 8; conseils.push({ section: 'photos', perte: 4, titre: 'Complète ta galerie', texte: 'Ton annonce a ' + n + ' photos. Quelques vues de plus (extérieur, quartier, détails) rassurent avant de réserver.' }); }
    else if (n < 20) { pts += 10; conseils.push({ section: 'photos', perte: 2, titre: 'Encore quelques photos', texte: 'Ton annonce a ' + n + ' photos. À partir de 20, chaque pièce peut être montrée sous deux angles.' }); }
    else { pts += 12; forts.push('Ta galerie est fournie (' + n + ' photos).'); }

    var part = n ? p.paysage / n : 0, verticales = n - p.paysage;
    if (part >= 0.7) { pts += 5; forts.push('La plupart de tes photos sont au format paysage.'); }
    else if (part >= 0.4) { pts += 3; conseils.push({ section: 'photos', perte: 2, titre: 'Reprends tes photos verticales en paysage', texte: verticales + ' de tes ' + n + ' photos sont verticales. Les résultats de recherche et la galerie d\'Airbnb sont au format paysage : une photo verticale y est recadrée.' }); }
    else if (n) { pts += 1; conseils.push({ section: 'photos', perte: 4, titre: 'Refais tes photos au format paysage', texte: verticales + ' de tes ' + n + ' photos sont verticales. Les résultats de recherche et la galerie d\'Airbnb sont au format paysage : une photo verticale y est recadrée et montre moins la pièce. Tiens ton téléphone à l\'horizontale.', lien: photographe }); }

    var partLegendes = n ? p.legendes / n : 0;
    if (partLegendes >= 0.5) { pts += 4; forts.push('Tes photos ont une légende.'); }
    else if (p.legendes > 0) { pts += 2; conseils.push({ section: 'photos', perte: 2, titre: 'Ajoute une légende aux autres photos', texte: p.legendes + ' photos sur ' + n + ' ont une légende. Une légende courte (« lit 160 cm », « vue depuis le balcon ») répond à une question sans qu\'on ait à te l\'écrire.' }); }
    else if (n) conseils.push({ section: 'photos', perte: 4, titre: 'Ajoute une légende à tes photos', texte: 'Aucune de tes ' + n + ' photos n\'a de légende. Une légende courte (« lit 160 cm », « vue depuis le balcon ») répond à une question sans qu\'on ait à te l\'écrire.' });

    var pieces = (p.pieces || []).length;
    if (pieces >= 4) { pts += 4; forts.push('Tes photos sont rangées par pièce (' + pieces + ' espaces).'); }
    else if (n) conseils.push({ section: 'photos', perte: 4, titre: 'Range tes photos par pièce', texte: 'La visite photo d\'Airbnb regroupe les photos par pièce (chambre, salon, cuisine, salle de bain). Le voyageur comprend le logement d\'un coup d\'œil.' });

    return { id: 'photos', label: 'Photos', score: Math.min(pts, max), max: max };
  }

  function analyserEquipements(e, conseils, forts) {
    var max = 20, presents = e.presents || [], absents = e.absents || [];
    var manquants = [], declaresAbsents = [];
    EQUIPEMENTS.forEach(function (q) {
      if (presents.some(function (t) { return q.re.test(t); })) return;
      if (absents.some(function (t) { return q.re.test(t); })) declaresAbsents.push(q.label.toLowerCase());
      else manquants.push(q.label.toLowerCase());
    });
    var pts = (EQUIPEMENTS.length - manquants.length - declaresAbsents.length) * 2;
    if (manquants.length) conseils.push({ section: 'equipements', perte: manquants.length * 2, titre: 'Équipements non cochés : ' + manquants.join(', '), texte: 'Les voyageurs filtrent leur recherche par équipement : un équipement que tu as mais que tu n\'as pas coché te fait disparaître de ces recherches. Si tu ne l\'as pas, regarde s\'il vaut l\'achat.' });
    if (declaresAbsents.length) conseils.push({ section: 'equipements', perte: declaresAbsents.length * 2, titre: 'Équipements affichés comme absents : ' + declaresAbsents.join(', '), texte: 'Ton annonce les montre barrés aux voyageurs. Si tu peux en ajouter un, c\'est un filtre de recherche de plus où tu apparais.' });
    if (!manquants.length && !declaresAbsents.length) forts.push('Tous les équipements de base sont cochés.');
    else if (presents.length >= 25) forts.push('Ta liste d\'équipements est détaillée (' + presents.length + ' cochés).');
    return { id: 'equipements', label: 'Équipements', score: pts, max: max };
  }

  function analyserConfiance(a, conseils, forts) {
    var max = 15, pts = 0, note = nb(a.note), avis = nb(a.avis);
    if (!avis || note === null) {
      pts += 2;
      conseils.push({ section: 'confiance', perte: 7, titre: 'Obtiens tes premiers avis', texte: 'Sans avis, le voyageur hésite. Un prix d\'appel sur les premières réservations et un message après le départ aident à en obtenir.' });
    } else {
      if (note >= 4.9) { pts += 6; forts.push('Ta note (' + fr(note) + ') atteint le niveau des Coups de cœur voyageurs.'); }
      else if (note >= 4.8) { pts += 5; conseils.push({ section: 'confiance', perte: 1, titre: 'Tu es proche des Coups de cœur voyageurs', texte: 'Ta note est de ' + fr(note) + '. Airbnb annonce une moyenne de 4,9 pour cette sélection.' }); }
      else if (note >= 4.5) { pts += 3; conseils.push({ section: 'confiance', perte: 3, titre: 'Remonte ta note', texte: 'Ta note est de ' + fr(note) + '. Relis tes derniers avis : le même reproche revient souvent, et c\'est lui qu\'il faut corriger.' }); }
      else { pts += 1; conseils.push({ section: 'confiance', perte: 5, titre: 'Ta note freine les réservations', texte: 'Ta note est de ' + fr(note) + '. Corrige d\'abord ce que les avis reprochent avant de toucher au reste.' }); }
      if (avis >= 5) pts += 3;
      else { pts += 1; conseils.push({ section: 'confiance', perte: 2, titre: 'Dépasse les 5 avis', texte: 'Tu as ' + avis + ' avis. Les Coups de cœur voyageurs demandent au moins 5 avis sur les deux dernières années : pense à relancer chaque voyageur après son départ.' }); }

      var basse = null;
      Object.keys(SOUS_NOTES).forEach(function (k) {
        var v = nb((a.sousNotes || {})[k]);
        if (v !== null && v < 4.8 && (basse === null || v < basse.v)) basse = { k: k, v: v };
      });
      if (basse) conseils.push({ section: 'confiance', perte: 2, titre: 'Ta sous-note la plus basse : ' + SOUS_NOTES[basse.k] + ' (' + fr(basse.v) + ')', texte: 'C\'est le point que tes voyageurs notent le moins bien. Le corriger est le moyen le plus direct de remonter ta moyenne.' });
    }

    var taux = nb(a.tauxReponse);
    if (taux === null) pts += 2;
    else if (taux >= 90) { pts += 3; forts.push('Ton taux de réponse est de ' + taux + ' %.'); }
    else { pts += 1; conseils.push({ section: 'confiance', perte: 2, titre: 'Réponds à tous les messages', texte: 'Ton taux de réponse affiché est de ' + taux + ' %. Il est visible sur ton profil et fait partie des critères du statut Superhôte.' }); }

    if (a.superhote === true) { pts += 3; forts.push('Tu as le statut Superhôte.'); }
    else if (a.superhote === false) conseils.push({ section: 'confiance', perte: 3, titre: 'Vise le statut Superhôte', texte: 'Le badge Superhôte s\'affiche sur ton annonce et dispose de son propre filtre de recherche. Les critères sont dans ton tableau de bord Airbnb, réévalués chaque trimestre.' });
    else pts += 1;

    if (a.coupDeCoeur === true) forts.push('Ton annonce fait partie des Coups de cœur voyageurs.');
    return { id: 'confiance', label: 'Avis et hôte', score: Math.min(pts, max), max: max };
  }

  function verdict(score) {
    if (score >= 85) return 'Annonce solide';
    if (score >= 65) return 'Bonne base, quelques réglages';
    if (score >= 40) return 'Du potentiel à aller chercher';
    return 'Annonce à retravailler';
  }

  /** a : faits rendus par extraireAnnonce(). Sans les données fines (a.complet
      faux), les photos et les équipements ne sont pas notés et la note est
      ramenée sur 100. */
  function analyser(a) {
    a = a || {};
    var conseils = [], forts = [];
    var sections = [
      analyserTitre(txt(a.titre), conseils, forts),
      analyserDescription(txt(a.description), conseils, forts)
    ];
    if (a.complet) {
      sections.push(analyserPhotos(a.photos || { total: 0, paysage: 0, legendes: 0, pieces: [] }, conseils, forts));
      sections.push(analyserEquipements(a.equipements || {}, conseils, forts));
    }
    sections.push(analyserConfiance(a, conseils, forts));
    var pts = 0, max = 0;
    sections.forEach(function (s) { pts += s.score; max += s.max; });
    var score = Math.round(pts / max * 100);
    conseils.sort(function (x, y) { return y.perte - x.perte; });
    return { score: score, verdict: verdict(score), partiel: !a.complet, sections: sections, conseils: conseils, forts: forts };
  }

  return { analyser: analyser, EQUIPEMENTS: EQUIPEMENTS, TITRE_MAX: TITRE_MAX, verdict: verdict };
}));
