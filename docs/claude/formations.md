# Formations du dashboard

Ouvert le 23/11/2026 : refonte de l'apprentissage validée par Jason (« Oui tu peux tout faire c'est génial ! ») après l'audit du même jour. Lire ce fichier avant de toucher aux formations ou d'en écrire une nouvelle. La check-list « Nouvelle formation » (page du site, Services, compteurs, annonce) reste dans `conventions.md`.

## Pourquoi la refonte

Mesuré en base le 23/11/2026 (membres, hors admins) : 15 membres sur 63 avaient ouvert une formation ; 15 des 23 formations « terminées » l'avaient été à moins d'une minute par leçon (bouton « Marquer comme terminé » cliqué sans lire) ; 0 note, 1 commentaire, 1 vote. Le pourcentage terminé ne mesurait pas l'apprentissage.

Principes retenus (sources dans la page de propositions publiée le 23/11) : se tester plutôt que relire (Rowland 2014, d ≈ 0,50), espacer les révisions (Cepeda 2006 ; méta-analyse 2025, d = 0,54), une idée par leçon et l'essentiel signalé (Mayer : cohérence 0,86, segmentation 0,77, signalement 0,70), dire quand on agira (Gollwitzer et Sheeran 2006, d = 0,65), progression déjà engagée (Nunes et Drèze 2006), séries de jours utiles mais culpabilisantes (on a choisi un objectif de la semaine).

## Ce qui existe (code)

- **Format du contenu** : `lib/formations/blocks.ts` (testé) découpe le texte d'une leçon en blocs. Markdown simple (`## `, `### `, `- `, `1. `, `✅ ` / `❌ `, `→ `, `> Source : …`, tableaux avec la ligne `| --- |`, ligne en MAJUSCULES = intertitre). Les lignes consécutives forment UN paragraphe : plus de texte haché ligne à ligne. Blocs riches ouverts par `:::nom` et fermés par `:::` :
  - `:::bref` 2 à 4 points (« En bref », toujours en tête)
  - `:::retenir`, `:::erreur`, `:::exemple`, `:::astuce` (encadrés)
  - `:::chiffres` lignes `valeur | libellé` (chiffres clés en grand)
  - `:::quiz` `? question`, `- mauvaise`, `* bonne`, `= explication` (une question par bloc)
  - `:::action` `titre:`, `texte:`, `lien:` (adresse `/dashboard/...`), `bouton:`
- **Affichage** : `components/formations/LessonContent.tsx` (blocs, questions, action) dans `FormationView.tsx` (lecteur). Chaque leçon a son adresse `?lecon=<id>` (actualiser ou partager garde la leçon, bouton « Reprendre : … »). Barre de progression découpée par module. Colonne de droite : progression par module, score, actions, sommaire de la page, articles. Notes, favori et « Cette leçon était claire ? » sous la leçon.
- **Fin de leçon** : une leçon avec questions se termine quand toutes ont une réponse (la 1re réponse compte pour le score, une erreur ne bloque pas). Sans question (ancien format), le bouton « Marquer comme terminé » reste.
- **Action de fin de module** : lien vers l'app (fait) ou « Ce soir / Demain / Ce week-end » (`lib/formations/schedule.ts`, heure de Paris, testé). Rappel posé dans la cloche par `jm_formation_reminders()`, appelée en tête de `app_jobs_ping()` (toutes les 15 min, SQL seul, aucun appel à l'app).
- **Fin de formation** : panneau animé (médaille, éclats, sans animation si mouvement réduit), objectif du membre, score, actions faites, « Ce que tu sais faire maintenant » (= objectifs), attestation, formation suivante (`relations.ts`).
- **Attestation** : `/dashboard/formations/attestation/<slug>`, au nom du membre, à 100 % seulement, imprimable (A4 paysage). Mention : attestation de suivi, pas un diplôme ni une certification.
- **Bilan de départ** : avant de commencer, « Qu'est-ce que tu veux réussir ? » et « Tu connais déjà ce sujet ? » (`user_formations.objectif`, `bilan`). L'objectif s'affiche en tête de la formation et à la fin.
- **Révision à 7 jours** : carte « Pour ne pas oublier » sur l'Accueil (`RevisionCard` + `RevisionQuiz`, `lib/formations/revision.ts` testé) : jusqu'à 3 questions répondues il y a 7 jours ou plus, une par leçon, les plus anciennes d'abord ; « Relire la leçon » si erreur.
- **Objectif de la semaine** : 2 leçons, dans la carte de droite du catalogue (journal `user_lesson_completion_log` depuis lundi 0 h à Paris).
- **Base** : migration `20261123_196_formations_apprentissage.sql` (`formation_answers`, `formation_action_plans`, `user_formations.objectif` / `bilan`, `jm_formation_reminders`, `app_jobs_ping` réécrite à l'identique plus les rappels). Code tolérant tant qu'elle manque.
- **Icônes** : plus d'émojis dans la partie Formations (`FormationIcon.tsx` pour les parcours et les badges du profil apprenant).

## Écrire une leçon (gabarit, vérifié par `lib/formations/gabarit.test.ts`)

- 5 à 8 minutes, une seule idée. Durée réaliste dans `duration`.
- Commence par `:::bref` (2 à 4 points).
- Au moins un exemple chiffré (`:::exemple` ou `:::chiffres`) quand le sujet s'y prête.
- 2 ou 3 `:::quiz` à la fin, avec une explication courte qui dit pourquoi. Questions d'application (un cas, un calcul), pas de piège ni de mémoire pure.
- Dernière leçon de chaque module : un `:::action` relié à l'app quand c'est possible (calculateurs `#mes-prix`, `/dashboard/calendrier`, `/dashboard/performances`, logements, fiche Google…). Vérifier que l'adresse existe.
- Module : 1 à 5 leçons. Formation : 3 objectifs au moins, rédigés comme « ce que tu sauras faire ».
- Identifiants de leçon uniques dans la formation ; **ne jamais changer l'identifiant d'une leçon existante** (progression et réponses des membres).
- Chiffres vérifiés par recherche web, sourcés (`> Source : …`) et datés ; aucun chiffre sans source. Pas de tiret cadratin, pas d'émoji, tutoiement. Driing présenté avec « je suis co-fondateur ».
- Après modification d'un `content.ts` : workflow « Publier le contenu des formations » (aperçu, puis « Écrire en base »), sinon l'app continue d'afficher la version en base. Le script publie aussi objectifs, description et durée totale (23/11/2026).

## Espace et lecteur refaits (23/11/2026, maquettes validées : « Je valide tout »)

Maquettes de référence : artefact « Formations, maquettes complètes » (téléphone d'abord).

- **Espace Formations** (`app/dashboard/formations/page.tsx` + `hub/FormationsHub.tsx`, données typées `hub/types.ts`) : une page, 4 onglets `?onglet=aujourdhui|parcours|catalogue|moi`. Téléphone : barre d'onglets fixe en bas ; ordinateur : onglets en haut. Changer d'onglet ne recharge pas (adresse mise à jour sur place).
  - **Aujourd'hui** : prochaine leçon (formation en cours la plus avancée, sinon la 1re recommandée), « Repéré dans ton activité » (`lib/formations/signals.ts`, testé : prix non renseignés, 30 prochains jours remplis à moins de 35 % ou à 90 % et plus, seulement si l'hôte a au moins 3 séjours dans l'app ; une seule à la fois, rien si la leçon est déjà faite), révision (`RevisionCard`), actions prévues, semaine, aperçu du parcours.
  - **Parcours** : les 5 parcours de `lib/formations/parcours.ts` deviennent des objectifs (puces), chemin vertical (fait, en cours avec la prochaine leçon, à venir, verrouillé). `?objectif=<slug>` choisit le parcours.
  - **Catalogue** : recherche, puces (Toutes, En cours, objectifs de `lib/formations/objectifs.ts`), « Pour toi », liste compacte avec couverture, état (terminée, %, nouveau, Standard), formulaire de suggestion.
  - **Moi** : leçons faites, actions faites, % de bonnes réponses ; réussites (actions faites, formations terminées) ; attestations ; enregistré (leçons en favori, formations en favori, notes).
  - Anciennes pages redirigées : `/formations/parcours` (et `/parcours/<slug>`), `/formations/profil-apprenant`, `/formations/favoris`. `FormationsGrid`, `FormationsHighlights`, `ProfilApprenantUI` supprimés.
- **Couvertures** : `coverBackground(slug, scale)` (motif CSS par objectif, tailles en pixels pour des bords nets ; 1 = grande couverture, 0,25 = vignette). Nouvelle formation : l'ajouter à `SLUG_OBJECTIF` (vérifié par `catalogue-sync.test.ts`).
- **Fiche d'une formation** (`FormationView`, sans `?lecon`) : couverture, objectif et niveau, durée, leçons, actions, promesse, progression et objectif du membre, « Tu sauras », programme dépliable par module (module en cours surligné, action faite signalée), bouton collé en bas sur téléphone (colonne de droite sur ordinateur), favori de la formation.
- **Bilan de départ** : 2 écrans plein écran (objectif, niveau) au 1er « Commencer », « Passer » possible.
- **Leçon en étapes** (`?lecon=<id>&etape=<n>`, `lib/formations/steps.ts` testé) : chaque `##` = une étape, « En bref » en 1re étape, questions puis action à la fin. Plein écran sur téléphone (au-dessus de l'en-tête de l'app), barre de progression des étapes, « Continuer » en bas, réponse en panneau vert ou rouge, sommaire des étapes à droite sur ordinateur. Dernière étape : « Leçon terminée », « Cette leçon était claire ? », notes, question (commentaires). Les actions qui mènent à Mes prix ouvrent le 1er logement de l'hôte (`?logement=`).
- **Fin** (`?fin=1`) : médaille et éclats (sans animation si mouvement réduit), score, actions, objectif, « Ce que tu sais faire », attestation, formation suivante. L'attestation propose « Ajouter à mon profil LinkedIn » (lien officiel « Licences et certifications »).

## Faits vérifiés le 23/11/2026 (à réutiliser dans les autres formations)

- **Airbnb** : frais uniques à la charge de l'hôte, 15,5 %, pour tous les hôtes de l'UE depuis le 13/10/2026 (plus de frais voyageur à part ; avant : environ 3 % hôte + frais voyageur). Sans numéro de TVA, la TVA de 20 % s'ajoute aux frais : 18,6 % ; 100 € affichés = 81,40 € reçus (84,50 € avec un numéro de TVA). Une autre session avait déjà corrigé les autres formations sur ce point le 23/11 (commit « commission Airbnb à jour »). Toute formation qui parle de « 3 % » ou « 4 % hôte » ou de « frais de service voyageur 14 % » est à corriger. Sources : Airbnb « Simplifying Airbnb service fees », Hostfully, Smoobu.
- **Booking** : commission selon l'accord d'hébergement, autour de 15 % pour un meublé en France (15 à 18 % selon les sources). La règle « prix Booking = prix Airbnb × 1,12 » est caduque.
- **Outils de prix** : PriceLabs environ 15 à 20 $ par logement et par mois ; Wheelhouse 19,99 $ par logement et par mois ou 1 % des réservations ; Beyond environ 1 % des revenus.

## État de la conversion

| Formation | Format |
|---|---|
| mettre-le-bon-prix-lcd | nouveau (pilote, 23/11/2026) |
| les 21 autres | ancien, listées dans `A_CONVERTIR` de `gabarit.test.ts` |

Ordre conseillé : les plus ouvertes d'abord, puis celles qui citent les frais Airbnb (tarification-dynamique, annonce-directe, optimiser-annonce-airbnb, maitriser-booking-com-algorithme-genius, louer-en-direct-securise, creer-conciergerie-lcd).
