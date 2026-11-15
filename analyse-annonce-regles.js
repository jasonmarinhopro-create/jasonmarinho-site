/* Analyse d'une annonce Airbnb par règles (15/11/2026, demande de Jason).
   Calcul pur, sans réseau : utilisé par /services/analyse-annonce-airbnb et
   testé par jason-app/lib/site/analyse-annonce.test.ts.

   Le barème est le nôtre. Il s'appuie sur des repères publics (titre limité à
   50 caractères, 32 visibles sur mobile, Coups de cœur voyageurs : 4,9 de
   moyenne et 5 avis) et sur les bonnes pratiques d'une annonce complète.
   L'algorithme d'Airbnb n'est pas public : ne jamais écrire le contraire. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AnalyseAnnonce = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var TITRE_MAX = 50;
  var TITRE_MOBILE = 32;

  var EQUIPEMENTS = [
    { id: 'wifi', label: 'Wifi' },
    { id: 'cuisine', label: 'Cuisine équipée' },
    { id: 'autonome', label: 'Arrivée autonome' },
    { id: 'lave-linge', label: 'Lave-linge' },
    { id: 'travail', label: 'Espace de travail' },
    { id: 'parking', label: 'Parking' },
    { id: 'temperature', label: 'Climatisation ou chauffage' },
    { id: 'tv', label: 'Télévision' },
    { id: 'linge', label: 'Draps et serviettes fournis' },
    { id: 'fumee', label: 'Détecteur de fumée' }
  ];

  var TYPES = /\b(appartement|appart|studio|maison|villa|loft|chalet|g[iî]te|duplex|triplex|t[1-5]|f[1-5]|chambre|suite|cabane|mas|bastide|longère|penthouse|maisonnette|pavillon|tiny house|péniche|roulotte)\b/i;
  var ATOUTS = /\b(vue|terrasse|balcon|jardin|piscine|parking|garage|clim|climatis[ée]e?|jacuzzi|spa|sauna|centre|hypercentre|plage|mer|océan|lac|gare|m[ée]tro|tram|wifi|fibre|calme|chemin[ée]e|montagne|ski|pistes|port|vieille ville|rooftop|patio|cour)\b/i;
  var VIDES = /\b(magnifique|superbe|incroyable|exceptionnel(le)?|sublime|top|g[ée]nial|parfait|merveilleux|splendide)\b/i;
  var EMOJI = /[☀-➿\uD83C-\uDBFF⭐✨]/;

  var THEMES = [
    { id: 'couchage', label: 'le couchage', re: /\b(lits?|chambres?|canap[ée]|couchages?|matelas|literie)\b/i, aide: 'Précise le nombre de lits, leur taille et où ils se trouvent.' },
    { id: 'cuisine', label: 'la cuisine', re: /\b(cuisine|kitchenette|four|plaques|lave-vaisselle|cafeti[èe]re|frigo|r[ée]frig[ée]rateur)\b/i, aide: 'Dis ce qu\'on peut y préparer : plaques, four, cafetière, lave-vaisselle.' },
    { id: 'quartier', label: 'l\'emplacement', re: /\b(quartier|proche|proximit[ée]|à \d+ ?(min|minutes|m|km)|commerces|centre|plage|gare|m[ée]tro|tram|bus|à pied|restaurants)\b/i, aide: 'Donne des distances concrètes : « à 5 min à pied de la gare », « plage à 300 m ».' },
    { id: 'arrivee', label: 'l\'arrivée', re: /\b(arriv[ée]e|check-?in|cl[ée]s?|bo[iî]te à cl[ée]s|autonome|accueil|digicode|serrure)\b/i, aide: 'Explique comment on entre : boîte à clés, serrure connectée ou accueil en personne.' },
    { id: 'public', label: 'à qui le logement convient', re: /\b(couples?|familles?|enfants?|t[ée]l[ée]travail|professionnels?|amis|voyageurs? d'affaires|déplacement|b[ée]b[ée])\b/i, aide: 'Écris pour qui le logement est fait : couple, famille, déplacement professionnel.' }
  ];

  function txt(v) { return typeof v === 'string' ? v.trim() : ''; }
  function nombre(v) {
    if (v === null || v === undefined || v === '') return null;
    var n = Number(String(v).replace(',', '.'));
    return isFinite(n) ? n : null;
  }

  function analyserTitre(titre, conseils, forts) {
    var max = 20, pts = 0, n = titre.length;
    if (!n) {
      conseils.push({ section: 'titre', perte: 20, titre: 'Ajoute ton titre', texte: 'Sans titre, l\'analyse ne peut pas juger la première chose que voit un voyageur.' });
      return { id: 'titre', label: 'Titre', score: 0, max: max };
    }
    if (n > TITRE_MAX) {
      pts += 2;
      conseils.push({ section: 'titre', perte: 4, titre: 'Raccourcis ton titre à 50 caractères', texte: 'Ton titre fait ' + n + ' caractères. Airbnb limite le titre à 50 caractères, espaces compris : la fin sera coupée.' });
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
    var max = 25, pts = 0, n = desc.length;
    if (!n) {
      conseils.push({ section: 'description', perte: 25, titre: 'Ajoute ta description', texte: 'Colle le texte de ton annonce pour que l\'analyse puisse le lire.' });
      return { id: 'description', label: 'Description', score: 0, max: max };
    }
    if (n < 150) {
      pts += 2;
      conseils.push({ section: 'description', perte: 8, titre: 'Ta description est trop courte', texte: 'Elle fait ' + n + ' caractères. Vise au moins 400 caractères : le logement, le quartier, l\'arrivée.' });
    } else if (n < 400) {
      pts += 6;
      conseils.push({ section: 'description', perte: 4, titre: 'Étoffe ta description', texte: 'Elle fait ' + n + ' caractères. Entre 400 et 1 500 caractères, tu réponds aux questions avant qu\'on te les pose.' });
    } else if (n <= 1500) {
      pts += 10;
      forts.push('Ta description a une bonne longueur.');
    } else {
      pts += 8;
      conseils.push({ section: 'description', perte: 2, titre: 'Resserre ta description', texte: 'Elle fait ' + n + ' caractères. Garde l\'essentiel en haut et déplace le détail (règles, accès) dans les rubriques prévues par Airbnb.' });
    }

    if ((desc.match(/\n/g) || []).length >= 2) pts += 3;
    else conseils.push({ section: 'description', perte: 3, titre: 'Découpe ta description en paragraphes', texte: 'Un bloc de texte ne se lit pas sur un téléphone. Fais des paragraphes courts : le logement, le quartier, l\'arrivée.' });

    var manquants = [];
    THEMES.forEach(function (t) {
      if (t.re.test(desc)) pts += 2;
      else manquants.push(t);
    });
    manquants.forEach(function (t) {
      conseils.push({ section: 'description', perte: 2, titre: 'Parle de ' + t.label, texte: t.aide });
    });
    if (!manquants.length) forts.push('Ta description couvre le logement, le quartier, l\'arrivée et le public visé.');

    if (ATOUTS.test(desc.slice(0, 150))) pts += 2;
    else conseils.push({ section: 'description', perte: 2, titre: 'Commence par ton meilleur atout', texte: 'Seul le début de la description s\'affiche avant « Afficher plus ». Ouvre sur ce qui distingue ton logement.' });

    return { id: 'description', label: 'Description', score: Math.min(pts, max), max: max };
  }

  function analyserPhotos(input, conseils, forts) {
    var max = 20, pts = 0, n = nombre(input.photos);
    if (n === null || n <= 0) {
      conseils.push({ section: 'photos', perte: 14, titre: 'Indique ton nombre de photos', texte: 'Les photos sont ce que le voyageur regarde en premier. Compte celles de ton annonce.' });
    } else if (n < 5) {
      pts += 3;
      conseils.push({ section: 'photos', perte: 11, titre: 'Ajoute des photos', texte: 'Tu as ' + n + ' photos. Vise au moins 15, avec chaque pièce et l\'extérieur.', lien: { href: '/trouver-un-pro', label: 'Trouver un photographe près de chez toi' } });
    } else if (n < 10) {
      pts += 6;
      conseils.push({ section: 'photos', perte: 8, titre: 'Ajoute des photos', texte: 'Tu as ' + n + ' photos. Vise au moins 15 : chaque pièce sous deux angles, la salle de bain, l\'extérieur, les détails.', lien: { href: '/trouver-un-pro', label: 'Trouver un photographe près de chez toi' } });
    } else if (n < 15) {
      pts += 10;
      conseils.push({ section: 'photos', perte: 4, titre: 'Complète ta galerie', texte: 'Tu as ' + n + ' photos. Quelques vues de plus (extérieur, quartier, détails) rassurent avant de réserver.' });
    } else if (n < 20) {
      pts += 12;
    } else {
      pts += 14;
      forts.push('Ta galerie est fournie (' + n + ' photos).');
    }
    if (input.photosToutesPieces) pts += 3;
    else conseils.push({ section: 'photos', perte: 3, titre: 'Montre chaque pièce', texte: 'Une pièce sans photo fait douter. Chambre, salon, cuisine, salle de bain et WC doivent chacun apparaître.' });
    if (input.photosLegendes) pts += 3;
    else conseils.push({ section: 'photos', perte: 3, titre: 'Ajoute une légende à tes photos', texte: 'Une légende courte (« lit 160 cm », « vue depuis le balcon ») répond à une question sans que le voyageur ait à te l\'écrire.' });
    return { id: 'photos', label: 'Photos', score: Math.min(pts, max), max: max };
  }

  function analyserEquipements(input, conseils, forts) {
    var max = 20, coches = Array.isArray(input.equipements) ? input.equipements : [];
    var manquants = EQUIPEMENTS.filter(function (e) { return coches.indexOf(e.id) === -1; });
    var pts = (EQUIPEMENTS.length - manquants.length) * 2;
    if (manquants.length) {
      conseils.push({
        section: 'equipements', perte: manquants.length * 2,
        titre: 'Vérifie ces équipements : ' + manquants.map(function (e) { return e.label.toLowerCase(); }).join(', '),
        texte: 'Les voyageurs filtrent leur recherche par équipement : un équipement que tu as mais que tu n\'as pas coché te fait disparaître de ces recherches. Si tu ne l\'as pas, regarde s\'il vaut l\'achat.'
      });
    } else {
      forts.push('Tous les équipements de base sont cochés.');
    }
    return { id: 'equipements', label: 'Équipements', score: pts, max: max };
  }

  function analyserConfiance(input, conseils, forts) {
    var max = 15, pts = 0, note = nombre(input.note), avis = nombre(input.avis);
    if (avis === null || avis <= 0 || note === null) {
      pts += 3;
      conseils.push({ section: 'confiance', perte: 7, titre: 'Obtiens tes premiers avis', texte: 'Sans avis, le voyageur hésite. Un prix d\'appel sur les premières réservations et un message après le départ aident à en obtenir.' });
    } else {
      if (note >= 4.9) { pts += 7; forts.push('Ta note atteint le niveau des Coups de cœur voyageurs (4,9).'); }
      else if (note >= 4.8) { pts += 6; conseils.push({ section: 'confiance', perte: 1, titre: 'Tu es proche des Coups de cœur voyageurs', texte: 'Airbnb annonce une moyenne de 4,9 pour cette sélection. Regarde ta sous-note la plus basse (propreté, exactitude, arrivée) et travaille celle-là.' }); }
      else if (note >= 4.5) { pts += 4; conseils.push({ section: 'confiance', perte: 3, titre: 'Remonte ta note', texte: 'Ta note est de ' + String(note).replace('.', ',') + '. Relis tes derniers avis : le même reproche revient souvent, et c\'est lui qu\'il faut corriger.' }); }
      else { pts += 1; conseils.push({ section: 'confiance', perte: 6, titre: 'Ta note freine les réservations', texte: 'Ta note est de ' + String(note).replace('.', ',') + '. Corrige d\'abord ce que les avis reprochent (souvent propreté ou annonce inexacte) avant de toucher au reste.' }); }
      if (avis >= 5) pts += 3;
      else { pts += 1; conseils.push({ section: 'confiance', perte: 2, titre: 'Dépasse les 5 avis', texte: 'Tu as ' + avis + ' avis. Les Coups de cœur voyageurs demandent au moins 5 avis sur les deux dernières années.' }); }
    }
    if (input.reservationInstantanee) pts += 3;
    else conseils.push({ section: 'confiance', perte: 3, titre: 'Pense à la réservation instantanée', texte: 'Elle évite au voyageur d\'attendre ta réponse, et un filtre de recherche lui est réservé. À activer si ton calendrier est à jour.' });
    if (input.reductionSejourLong) pts += 2;
    else conseils.push({ section: 'confiance', perte: 2, titre: 'Propose une réduction à la semaine', texte: 'Une réduction pour 7 nuits ou plus s\'affiche dans les résultats et remplit les creux du calendrier.' });
    return { id: 'confiance', label: 'Avis et réservation', score: Math.min(pts, max), max: max };
  }

  function verdict(score) {
    if (score >= 85) return 'Annonce solide';
    if (score >= 65) return 'Bonne base, quelques réglages';
    if (score >= 40) return 'Du potentiel à aller chercher';
    return 'Annonce à retravailler';
  }

  function analyser(input) {
    input = input || {};
    var conseils = [], forts = [];
    var sections = [
      analyserTitre(txt(input.titre), conseils, forts),
      analyserDescription(txt(input.description), conseils, forts),
      analyserPhotos(input, conseils, forts),
      analyserEquipements(input, conseils, forts),
      analyserConfiance(input, conseils, forts)
    ];
    var score = sections.reduce(function (s, x) { return s + x.score; }, 0);
    conseils.sort(function (a, b) { return b.perte - a.perte; });
    return { score: score, verdict: verdict(score), sections: sections, conseils: conseils, forts: forts };
  }

  return { analyser: analyser, EQUIPEMENTS: EQUIPEMENTS, TITRE_MAX: TITRE_MAX, verdict: verdict };
}));
