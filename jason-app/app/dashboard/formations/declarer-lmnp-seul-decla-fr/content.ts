export const DECLARER_LMNP_FORMATION = {
  slug: 'declarer-lmnp-seul-decla-fr',
  title: 'Déclarer sa LMNP seul avec décla.fr',
  description: `Régime réel, liasse fiscale 2031/2033, amortissements, réforme 2025 sur la plus-value : la méthode complète pour faire ta déclaration LMNP toi-même avec décla.fr, sans expert-comptable — et savoir exactement quand tu en as quand même besoin.`,
  duration: '2h50',
  level: 'Intermédiaire',
  objectifs: [
    'Savoir si tu es vraiment en LMNP (et pas en LMP) et quel régime fiscal te concerne',
    "Comprendre pourquoi le régime réel implique une liasse fiscale, et ce que ça change concrètement",
    "Connaître la réforme 2025 sur les amortissements et la plus-value à la revente, sans mauvaise surprise",
    "T'immatriculer et opter pour le régime réel dans les règles",
    'Suivre pas à pas le remplissage de ta liasse avec décla.fr',
    'Respecter le calendrier fiscal 2026 et éviter les erreurs les plus fréquentes',
    "Savoir précisément quand un outil en ligne ne suffit plus et qu'il te faut un vrai expert-comptable",
  ],
  modules: [
    {
      id: 1,
      title: 'Comprendre ce que tu dois déclarer avant de choisir un outil',
      duration: '45 min',
      lessons: [
        {
          id: 1,
          title: 'LMNP, micro-BIC, régime réel : le vocabulaire à maîtriser avant de commencer',
          duration: '15 min',
          content: `---

MODULE 1 · LEÇON 1
────────────────────────────────────
LMNP, micro-BIC, régime réel
Le vocabulaire avant l'outil
────────────────────────────────────

---

## Pourquoi commencer par le vocabulaire
Avant de parler de décla.fr, il faut être au clair
sur CE QUE tu déclares et à QUEL régime tu es soumis.

Beaucoup d'hôtes ouvrent un outil de déclaration
sans savoir répondre à ces 3 questions :
→ Suis-je LMNP ou LMP ?
→ Suis-je au micro-BIC ou au régime réel ?
→ Qu'est-ce que je dois transmettre, et à qui ?

Cette leçon répond aux 3.

---

## LMNP : Loueur en Meublé Non Professionnel
Tu es LMNP si tu loues un logement meublé
(donc y compris ta LCD) ET que tu remplis
les deux conditions suivantes :

→ Tes recettes locatives meublées annuelles
  sont inférieures à 23 000€

OU

→ Ces recettes représentent moins de 50%
  des revenus professionnels de ton foyer fiscal

Si tu dépasses les DEUX seuils à la fois,
tu bascules en LMP (Loueur Meublé Professionnel) :
cotisations sociales SSI, régime des plus-values
professionnelles, obligations différentes.

Si un seul des deux seuils est dépassé,
tu restes LMNP. C'est le cumul des deux
qui déclenche le changement de statut.

Source : Code général des impôts, art. 155 IV ; BOFiP BIC-CHAMP-40

---

## Micro-BIC : la déclaration simplifiée
Au micro-BIC, tu déclares ton chiffre d'affaires BRUT
sur ta déclaration de revenus (2042-C-PRO).

L'administration applique un ABATTEMENT FORFAITAIRE
qui est censé représenter tes charges. Tu ne prouves rien,
tu ne fournis aucun justificatif, tu ne remplis pas de liasse.

Barème 2026 (revenus 2025, déclarés au printemps 2026) :
→ Meublé de tourisme NON CLASSÉ : abattement 30%,
  plafond de recettes 15 000€/an
→ Meublé de tourisme CLASSÉ : abattement 50%,
  plafond de recettes 77 700€/an
→ Chambre d'hôtes : abattement 71%,
  plafond de recettes 77 700€/an

Pour les revenus 2026 (déclarés en 2027) :
le plafond "classé" est réévalué à 83 600€.
Le plafond "non classé" de 15 000€, lui,
est explicitement exclu de la revalorisation :
il reste figé à 15 000€.

Source : Loi n° 2024-1039 du 19 novembre 2024 (loi Le Meur) ;
CGI art. 50-0 ; BOFiP BIC-DECLA-10-10

---

## Régime réel : tu déclares tes charges vraies
Au régime réel, tu ne déclares plus un forfait.
Tu déclares tes RECETTES RÉELLES moins tes
CHARGES RÉELLES (ménage, intérêts d'emprunt,
copropriété, assurance, amortissements...).

Pour ça, tu dois produire chaque année
une LIASSE FISCALE : un mini-bilan comptable
qui détaille ton résultat, tes charges
et tes amortissements.

C'est cette liasse — pas la déclaration de revenus
elle-même — qui est le sujet central de cette formation,
et le cœur de ce que fait un outil comme décla.fr.

---

## Le point clé à retenir
Le micro-BIC ne nécessite AUCUN outil spécifique.
Une ligne, un chiffre, sur ta déclaration classique.

Le régime réel, lui, nécessite de produire
une liasse fiscale (formulaires 2031-SD et annexes 2033).
C'est cette obligation-là qu'un outil comme décla.fr
prend en charge — jamais le micro-BIC, qui n'en a pas besoin.

Si tu es au micro-BIC et que quelqu'un te vend
un outil de "déclaration LMNP" à 200€, pose-toi
la question : as-tu vraiment besoin d'une liasse ?

---

## Exercice
**Exercice pratique :** Note sur un papier tes recettes LCD brutes de l'an dernier, et regarde si tu es en dessous du plafond micro-BIC qui correspond à ton logement (classé ou non classé). Si oui, tu n'as peut-être même pas besoin d'aller plus loin dans cette formation — sauf si tu es DÉJÀ au régime réel ou si tu veux évaluer si basculer serait plus avantageux. La leçon suivante t'aide à trancher.

---`,
        },
        {
          id: 2,
          title: 'Micro-BIC ou régime réel : lequel choisir, concrètement',
          duration: '15 min',
          content: `---

MODULE 1 · LEÇON 2
────────────────────────────────────
Micro-BIC ou régime réel
Lequel choisir, concrètement
────────────────────────────────────

---

## Le principe de comparaison
La question n'est pas "lequel est le mieux" dans l'absolu.
C'est : lequel laisse le moins de bénéfice imposable
DANS TA SITUATION.

Deux manières de raisonner :

MICRO-BIC
→ Base imposable = recettes × (1 − abattement)
→ Aucun justificatif, aucune charge à prouver

RÉGIME RÉEL
→ Base imposable = recettes − charges réelles − amortissements
→ Justificatifs à conserver, liasse fiscale à produire

---

## Le seuil de bascule, en règle simple
Le régime réel devient intéressant quand tes charges
réelles + amortissements dépassent le pourcentage
d'abattement auquel tu aurais droit au micro-BIC.

→ Non classé (abattement 30%) : dès que tes charges
  réelles dépassent ~30% de tes recettes, le réel gagne.
  C'est très fréquent, surtout avec un crédit en cours.

→ Classé (abattement 50%) : il faut dépasser 50%
  de charges réelles. Moins systématique, mais un bien
  à crédit avec des travaux y arrive souvent aussi.

---

## Exemple chiffré
Appartement classé, à crédit :
→ Recettes brutes : 20 000€/an
→ Charges d'exploitation (ménage, assurance, plateforme) : 5 000€
→ Intérêts d'emprunt : 3 500€
→ Amortissement bien + mobilier : 6 000€
→ Total charges réelles : 14 500€ (72,5% des recettes)

MICRO-BIC (abattement 50%)
→ Base imposable : 10 000€

RÉGIME RÉEL
→ Base imposable : 20 000 − 14 500 = 5 500€

→ Sur une TMI à 30% + prélèvements sociaux 17,2% :
  micro-BIC ≈ 4 720€ d'impôt/prélèvements
  régime réel ≈ 2 596€ d'impôt/prélèvements
  Écart : environ 2 100€/an en faveur du réel

Ceci est un exemple pédagogique. Ta situation réelle
dépend de ton taux marginal d'imposition, de ton
apport, de ton crédit et de tes charges effectives —
fais toujours ta propre simulation avant de trancher.

---

## L'amortissement : pourquoi le réel écrase souvent le micro-BIC
L'amortissement, c'est la déduction comptable
de la perte de valeur théorique de ton bien
et de son mobilier, étalée sur plusieurs années.

→ Bien immobilier (hors terrain, non amortissable) :
  généralement amorti sur 25 à 35 ans
→ Mobilier et équipement : généralement 5 à 10 ans
→ Travaux : durée propre à chaque poste

C'est souvent la plus grosse charge déductible
au régime réel — bien plus que le ménage
ou l'assurance. D'où l'écart important
dans l'exemple ci-dessus.

⚠️ Important : depuis 2025, l'amortissement
n'est plus "gratuit" à long terme. La leçon suivante
t'explique pourquoi — c'est un point que beaucoup
de guides publiés avant 2025 ne mentionnent pas encore.

---

## Dans quels cas rester au micro-BIC
→ Logement payé comptant, peu de charges
→ Recettes modestes, sous le plafond
→ Tu privilégies la simplicité totale à l'optimisation
→ Tu n'as pas l'énergie de suivre une comptabilité,
  même simplifiée, chaque année

Il n'y a AUCUNE obligation de passer au réel.
C'est un choix, réversible sous conditions
(la leçon du module 2 détaille comment et quand).

---

## Exercice
**Exercice pratique :** Fais le total de tes charges réelles de l'an dernier (ménage, assurance, commissions plateformes, copropriété, taxe foncière, intérêts d'emprunt — hors capital remboursé). Compare ce total à l'abattement micro-BIC qui s'appliquerait à toi. Si tes charges réelles dépassent ce pourcentage, tu as un signal fort pour envisager le régime réel — et donc, potentiellement, un outil comme décla.fr.

---`,
        },
        {
          id: 3,
          title: "La réforme 2025 sur les amortissements et la plus-value : ce qu'il faut savoir avant de basculer",
          duration: '15 min',
          content: `---

MODULE 1 · LEÇON 3
────────────────────────────────────
La réforme 2025
Amortissements et plus-value à la revente
────────────────────────────────────

---

## Pourquoi cette leçon est essentielle
Historiquement, l'amortissement au régime réel
était présenté comme un double avantage :
→ il réduit ton impôt chaque année pendant la location
→ ET il ne comptait pas dans le calcul de la plus-value
  le jour où tu revends (donc "gratuit" à long terme)

La loi de finances pour 2025 a supprimé
ce deuxième avantage. C'est le changement le plus
important en fiscalité LMNP depuis la loi Le Meur,
et il concerne directement toute personne qui envisage
le régime réel aujourd'hui.

---

## Ce que dit la réforme, précisément
Article 84 de la loi de finances pour 2025 :
pour les loueurs en meublé non professionnels
au RÉGIME RÉEL, les amortissements déduits
sur le bien immobilier sont désormais réintégrés
dans le calcul de la plus-value lors de la revente.

Concrètement, le calcul devient :

Plus-value imposable
= Prix de vente
− (Prix d'acquisition − amortissements immobiliers déduits)

→ Plus tu as amorti pendant la location,
  plus ton "prix d'acquisition" est réduit
  dans le calcul, et plus la plus-value taxable
  est élevée à la revente.

Le mobilier n'est PAS concerné : son amortissement
reste hors du calcul de la plus-value.

Source : Loi n° 2025-127 du 14 février 2025 de finances
pour 2025, article 84 ; BOFiP mis à jour en 2025-2026

---

## Depuis quand, et pour quels amortissements
→ La réforme s'applique à toute cession réalisée
  à compter du 15 février 2025.

→ Elle vise TOUS les amortissements déduits,
  y compris ceux pratiqués AVANT 2025. Ce n'est pas
  rétroactif sur l'impôt déjà payé, mais le stock
  d'amortissements cumulés depuis le début
  de ton activité compte dans le calcul.

Ce point a été confirmé par l'administration
(réponse ministérielle Mette, question n°10097,
publiée le 24 mars 2026) : la réintégration ne se limite
pas aux amortissements pratiqués depuis 2025.

---

## Ce qui reste inchangé
→ Le régime de la plus-value LMNP reste celui
  des particuliers (CGI art. 150 U), pas celui
  des professionnels — les abattements pour durée
  de détention s'appliquent toujours :
  exonération totale d'impôt sur le revenu
  après 22 ans de détention, et des prélèvements
  sociaux après 30 ans.

→ Les résidences avec services sous statut particulier
  (résidences étudiantes, seniors, établissements
  médicalisés répondant aux critères légaux)
  bénéficient d'une exonération spécifique
  de cette réintégration.

→ Seul le régime réel est concerné.
  Si tu es resté au micro-BIC, tu n'as jamais pratiqué
  d'amortissement comptable : cette réforme
  ne te concerne pas.

---

## Ce que ça change pour ta décision
Ça ne rend pas le régime réel désavantageux —
l'économie d'impôt pendant les années de location
reste réelle et souvent significative. Mais le calcul
"le régime réel est gratuit sur toute la durée"
n'est plus vrai depuis février 2025.

La bonne question à te poser n'est plus
"le réel me fait-il économiser des impôts ?"
(quasi toujours oui) mais "l'économie annuelle
compense-t-elle le supplément de plus-value
que je paierai le jour où je revends ?"

C'est une question de projet patrimonial,
pas une question technique. Si tu comptes garder
le bien longtemps (au-delà de 22-30 ans)
ou ne jamais le revendre, l'impact de la réforme
est marginal pour toi. Si tu envisages une revente
à moyen terme, fais le calcul avant de basculer,
idéalement avec un professionnel pour cette
décision précise.

---

## Exercice
**Exercice pratique :** Si tu envisages de revendre ton bien LCD dans les 10 prochaines années, note l'estimation de tes amortissements immobiliers cumulés sur cette période (ordre de grandeur : prix du bien ÷ durée d'amortissement × nombre d'années). C'est approximativement le montant qui viendra augmenter ta plus-value taxable à la revente. Garde ce chiffre en tête pour la suite de la formation.

---`,
        },
      ],
    },
    {
      id: 2,
      title: "S'immatriculer et opter pour le régime réel",
      duration: '25 min',
      lessons: [
        {
          id: 11,
          title: "L'immatriculation LMNP : obtenir ton SIRET gratuitement",
          duration: '12 min',
          content: `---

MODULE 2 · LEÇON 1
────────────────────────────────────
L'immatriculation LMNP
Ton SIRET, gratuitement
────────────────────────────────────

---

## Pourquoi tu as besoin d'un SIRET
Même en LMNP, tu exerces une activité (BIC).
L'administration a besoin de t'identifier :
c'est le rôle du numéro SIRET.

Sans SIRET, tu ne peux ni déclarer au régime réel,
ni utiliser un outil comme décla.fr, ni recevoir
tes échéanciers fiscaux liés à cette activité.

---

## Où et comment t'immatriculer en 2026
Depuis le 1er janvier 2023, toutes les démarches
de création d'activité (y compris LMNP) passent
PAR UN SEUL PORTAIL : le Guichet unique,
géré par l'INPI.

→ Site : formalites.entreprises.gouv.fr
→ L'ancien formulaire papier P0i n'existe plus :
  tout se fait en ligne
→ Démarche 100% gratuite
→ Délai légal : à faire dans les 15 jours
  suivant le début de ton activité de location meublée
→ Réception du SIRET : généralement entre
  1 et 4 semaines après le dépôt

Source : formalites.entreprises.gouv.fr (INPI) ;
ordonnance n°2021-1189 du 15 septembre 2021

---

## Ce que tu dois renseigner
→ Ton identité et ton adresse
→ L'adresse du logement loué
→ La date de début d'activité
→ Le régime fiscal souhaité (voir leçon suivante :
  c'est ICI que tu peux directement cocher
  "régime réel" si tu sais déjà que c'est ton choix)

⚠️ Si tu loues plusieurs logements, un seul SIRET
suffit pour l'ensemble de ton activité LMNP,
sauf cas particuliers (montages spécifiques).

---

## Un piège fréquent
Beaucoup d'hôtes découvrent l'obligation d'immatriculation
seulement quand ils veulent basculer au régime réel —
alors qu'elle s'applique dès le premier euro de recettes
en LMNP, même au micro-BIC.

Si tu loues déjà depuis un moment sans être immatriculé,
régularise dès que possible : ce n'est pas sanctionné
comme une fraude si tu es de bonne foi et que tu régularises,
mais mieux vaut ne pas attendre un contrôle pour le faire.

---

## Exercice
**Exercice pratique :** Vérifie si tu as déjà un SIRET pour ton activité de location meublée (regarde tes précédents avis d'imposition professionnels, ou cherche ton nom sur societe.com/annuaire-entreprises.data.gouv.fr). Si tu n'en as pas, note dans ton agenda de faire la démarche sur formalites.entreprises.gouv.fr cette semaine — c'est un préalable obligatoire à tout le reste.

---`,
        },
        {
          id: 12,
          title: 'Opter pour le régime réel : les deux façons de le faire, et le piège du timing',
          duration: '13 min',
          content: `---

MODULE 2 · LEÇON 2
────────────────────────────────────
Opter pour le régime réel
Les deux méthodes, et le piège du timing
────────────────────────────────────

---

## Deux façons d'opter
MÉTHODE 1 — Au moment de l'immatriculation
Sur le Guichet unique (formalites.entreprises.gouv.fr),
tu coches directement l'option "régime réel"
lors de ta déclaration de début d'activité.
C'est la méthode la plus simple si tu sais déjà
que tu veux le réel dès le départ.

MÉTHODE 2 — En cours d'activité (tu es déjà au micro-BIC)
Tu envoies une lettre d'option au Service des Impôts
des Entreprises (SIE) dont tu dépends, de préférence
en RECOMMANDÉ AVEC ACCUSÉ DE RÉCEPTION, pour garder
une preuve datée. Certains SIE tolèrent une option
via la messagerie sécurisée d'impots.gouv.fr,
mais ce n'est pas la voie officiellement prévue :
privilégie toujours le courrier recommandé.

Source : BOFiP BIC-DECLA-10-10-20

---

## Le piège du timing
C'est le point qui coince le plus d'hôtes :
pour que l'option s'applique aux revenus
de l'année EN COURS, ta lettre doit être envoyée
avant la date limite de dépôt de la déclaration
de revenus de cette même année (généralement
mai-juin de l'année N pour les revenus N-1... mais
attention, ici la logique est inversée : pour opter
sur les revenus de l'année N, il faut agir avant
la date limite de déclaration des revenus N-1,
donc au printemps de l'année N elle-même).

En clair, si tu veux basculer au réel pour
tes revenus 2026, ta lettre doit être partie
avant la date limite de la déclaration des revenus
2025 — soit fin mai/début juin 2026.

Si tu envoies ta lettre après cette date,
ton option ne prend effet que sur les revenus
de l'année SUIVANTE. Il n'y a pas de rattrapage
rétroactif.

---

## Durée de l'option
→ L'option pour le régime réel est valable
  pour l'année en cours et reconduite tacitement
  chaque année (elle ne s'éteint pas automatiquement).

→ Pour revenir au micro-BIC ensuite, il faut
  notifier ta renonciation à l'administration,
  et cela reste soumis à des règles de délai
  similaires — ce n'est pas un aller-retour libre
  d'une année sur l'autre.

Ne bascule donc pas au réel "pour tester" :
prends la décision en connaissance de cause,
avec la simulation chiffrée du module précédent.

---

## Exercice
**Exercice pratique :** Si tu es actuellement au micro-BIC et que tu veux basculer au réel, note dans ton agenda la date limite de la prochaine déclaration de revenus (elle est staggered par département — voir module 4) et prévois d'envoyer ta lettre recommandée au moins 3 semaines avant, pour avoir une marge de sécurité postale.

---`,
        },
      ],
    },
    {
      id: 3,
      title: "décla.fr : l'outil, pour qui, et comment ça marche",
      duration: '55 min',
      lessons: [
        {
          id: 21,
          title: "Qu'est-ce que décla.fr, exactement",
          duration: '13 min',
          content: `---

MODULE 3 · LEÇON 1
────────────────────────────────────
décla.fr
Ce que c'est, ce que ça n'est pas
────────────────────────────────────

---

## Ce que décla.fr n'est PAS
Ce n'est pas un cabinet d'expertise comptable.
Ce n'est pas un logiciel de comptabilité au sens
classique (pas de suivi de trésorerie au fil de l'eau,
pas de facturation).

Ce n'est pas non plus un outil pour le micro-BIC —
inutile si tu es resté à ce régime (revoir module 1).

---

## Ce que décla.fr EST
Un outil de PRODUCTION FISCALE ANNUELLE, dédié
aux loueurs en meublé (LMNP et LMP) au régime réel.
Sa mission unique : générer chaque année ta liasse
fiscale (formulaire 2031-SD et annexes 2033-A à G),
calculer tes amortissements, et la télétransmettre
directement à la DGFiP.

→ Créé en 2017, adossé au cabinet Honoré Patrimoine
→ Partenaire EDI (échange de données informatisé)
  habilité par la DGFiP : la télétransmission
  de ta liasse se fait directement et de façon
  sécurisée, sans passer par un tiers déclarant classique
→ Se présente comme utilisé par plusieurs dizaines
  de milliers de loueurs (chiffre communiqué
  par l'éditeur, à prendre comme tel)

Source : decla.fr, page "qui sommes-nous" et blog éditeur, 2026

---

## Comment se déroule une déclaration
Le parcours se fait en une session de saisie
guidée, en environ 7 étapes :

01. Informations générales de ton activité
02. Recettes locatives de l'année
03. Charges d'exploitation (ménage, assurance,
    commissions, copropriété, taxe foncière...)
04. Charges financières (intérêts d'emprunt)
05. Immobilisations et amortissements
    (bien, mobilier, travaux — l'outil calcule
    et suit le tableau d'amortissement d'une année
    sur l'autre)
06. Contrôles de cohérence automatiques
07. Génération de la liasse + télétransmission

Des alertes automatiques signalent les incohérences
de saisie (montants aberrants, oublis probables)
avant l'envoi définitif.

---

## Ce que ça coûte en 2026
→ Formule simplifiée : 219€ TTC
→ Formule avec fichier FEC (fichier des écritures
  comptables, utile en cas de contrôle fiscal
  approfondi) : 249€ TTC
→ Pour une SCI à l'IS : 119€ TTC par déclaration

À comparer à un expert-comptable spécialisé LMNP :
compter entre 500€ et 800€ HT/an pour un lot simple,
et davantage pour plusieurs biens ou une structure
plus complexe.

Source : decla.fr, grille tarifaire publique 2026 ;
comparatifs indépendants (jedeclaremonmeuble.com,
lmnp.ai), 2026

Les tarifs évoluent d'une année sur l'autre :
vérifie toujours le prix affiché au moment
de ton inscription plutôt que de te fier
à ce chiffre dans un an ou deux.

---

## Exercice
**Exercice pratique :** Va sur decla.fr et regarde la page tarifs actuelle. Compare le prix affiché aujourd'hui à celui indiqué dans cette leçon — s'il a changé, tu sauras que tu dois toujours vérifier l'info à la source plutôt que de te fier à un guide, aussi récent soit-il.

---`,
        },
        {
          id: 22,
          title: 'décla.fr vs expert-comptable vs autres outils : le comparatif honnête',
          duration: '14 min',
          content: `---

MODULE 3 · LEÇON 2
────────────────────────────────────
décla.fr vs expert-comptable
vs autres outils
────────────────────────────────────

---

## Ce qui ressort des avis utilisateurs
Sans pouvoir garantir l'exhaustivité de chaque avis
en ligne, les retours consultés (comparatifs indépendants,
avis Google) convergent sur les mêmes points forts
et les mêmes limites.

POINTS FORTS RÉCURRENTS
→ Coût très inférieur à un cabinet comptable
→ Interface guidée, accessible sans vocabulaire
  comptable préalable
→ Assistance par chat avec de vraies personnes,
  disponible en semaine et le samedi (horaires
  affichés : 8h-20h du lundi au samedi)
→ Amortissements calculés et reportés automatiquement
  d'une année sur l'autre — évite l'erreur classique
  de recalculer soi-même un tableau d'amortissement

LIMITES RÉCURRENTES
→ Pas adapté aux montages complexes : démembrement
  de propriété, holding, SCI à l'IS avec plusieurs
  associés — l'outil n'a pas la capacité d'analyse
  qu'un professionnel humain a sur ces situations
→ Certains utilisateurs de longue date signalent
  une hausse du prix sur les renouvellements
→ decla.fr n'est pas un cabinet d'expertise comptable
  inscrit à l'Ordre : la responsabilité finale
  de l'exactitude de ta déclaration reste la tienne,
  comme pour tout auto-déclarant

Source : synthèse de comparatifs et avis publics
(jedeclaremonmeuble.com, lmnp.ai, immobilierloyer.com,
avis Google decla.fr), consultés en 2026

---

## La vraie question à se poser
Ce n'est pas "décla.fr est-il fiable" en général —
c'est "ma situation est-elle assez simple
pour qu'un outil standardisé la couvre bien ?"

TA SITUATION EST PROBABLEMENT ADAPTÉE si :
→ Tu détiens le bien en nom propre (pas de SCI complexe)
→ Un seul ou quelques logements
→ Pas de montage en démembrement de propriété
→ Pas d'opération exceptionnelle dans l'année
  (grosse revente, donation, changement de régime
  en cours d'année)

TA SITUATION MÉRITE UN EXPERT-COMPTABLE si :
→ Structure juridique complexe (SCI à l'IS,
  holding, indivision conflictuelle)
→ Plusieurs activités croisées (LMNP + LMP
  + autre BIC/BNC)
→ Revente ou donation prévue dans l'année
→ Tu n'es pas à l'aise avec le fait d'assumer
  seul la responsabilité de l'exactitude
  de ta déclaration

---

## Un point sur les CGA/OGA — une info qui a beaucoup changé
Si tu as lu des guides plus anciens, tu as peut-être
vu mentionné l'intérêt d'adhérer à un Centre de Gestion
Agréé (CGA) pour éviter une majoration de 25%
de ton bénéfice imposable, ou pour obtenir une réduction
d'impôt sur les frais de comptable.

Ces deux avantages n'existent plus :
→ La majoration de 25% pour les non-adhérents
  a été supprimée progressivement entre 2020 et 2023
→ Le cadre légal des CGA/OGA lui-même a été supprimé
  par la loi de finances 2025, à compter
  du 16 février 2025

Autrement dit, l'argument "il faut adhérer à un CGA"
pour optimiser ta fiscalité LMNP est aujourd'hui obsolète.
Si tu le lis encore quelque part, la source n'a pas
été mise à jour depuis 2025.

Source : loi n° 2020-1721 du 29 décembre 2020 (LF 2021) ;
loi n° 2025-127 du 14 février 2025 (LF 2025)

---

## Exercice
**Exercice pratique :** Reprends la liste "situation adaptée / situation qui mérite un expert" ci-dessus et coche ce qui te correspond. Si tu coches au moins un point de la deuxième liste, garde en tête la dernière leçon de cette formation avant de te décider définitivement pour un outil en ligne seul.

---`,
        },
        {
          id: 23,
          title: 'Les 7 étapes de la liasse sur décla.fr, expliquées une par une',
          duration: '15 min',
          content: `---

MODULE 3 · LEÇON 3
────────────────────────────────────
Les 7 étapes de la liasse
Expliquées une par une
────────────────────────────────────

---

## Avant de commencer : ce qu'il te faut sous la main
Prépare ces documents avant d'ouvrir l'outil,
ça t'évitera des allers-retours :

→ Ton avis d'imposition et numéro SIRET
→ Le relevé annuel de tes plateformes
  (Airbnb, Booking, Driing...) avec le détail
  des revenus bruts et des commissions prélevées
→ Tes factures de charges (ménage, assurance,
  abonnements, travaux)
→ Ton tableau d'amortissement de l'année précédente
  (ou l'acte d'achat + facture du mobilier
  si c'est ta première déclaration au réel)
→ Ton relevé de prêt immobilier (montant
  des intérêts payés dans l'année, hors capital)
→ Ton avis de taxe foncière

---

## Étape 1 — Informations générales
Identité, SIRET, adresse du ou des logements,
date de début d'activité, régime (réel simplifié).

## Étape 2 — Recettes locatives
Tu saisis le total de tes loyers/nuitées encaissés
sur l'année, généralement à partir du récapitulatif
annuel fourni par chaque plateforme. Vérifie que tu
saisis bien le montant BRUT, commissions plateformes
incluses (elles se déduisent ensuite en charge,
pas en soustraction directe des recettes).

## Étape 3 — Charges d'exploitation
Ménage, linge, commissions plateformes, assurance
habitation/LCD, abonnements (internet, PMS, outils
de gestion), frais de publicité, copropriété,
taxe foncière, frais de comptabilité le cas échéant.

## Étape 4 — Charges financières
Les intérêts d'emprunt de l'année — uniquement
la part intérêts, jamais le capital remboursé,
qui n'est pas une charge déductible.

## Étape 5 — Immobilisations et amortissements
La partie la plus technique : valeur du bien
(hors terrain, non amortissable), du mobilier,
des travaux, avec leurs durées d'amortissement
respectives. L'outil calcule la dotation
de l'année et la reporte automatiquement
l'année suivante — c'est l'un des principaux
intérêts de repasser par le même outil chaque année
plutôt que de recommencer à zéro.

## Étape 6 — Contrôles de cohérence
L'outil signale les anomalies probables :
montants qui semblent inversés, oublis fréquents,
incohérences entre les étapes. Prends le temps
de lire chaque alerte avant de continuer —
c'est le moment de rattraper une erreur de saisie.

## Étape 7 — Génération et télétransmission
La liasse (2031-SD + annexes 2033) est générée
et transmise directement à la DGFiP via le canal EDI.
Tu reçois normalement une confirmation de dépôt —
conserve-la précieusement, c'est ta preuve
de déclaration dans les délais.

---

## Ce qu'il te reste à faire APRÈS la liasse
La télétransmission de la liasse ne remplace PAS
ta déclaration de revenus personnelle. Il te reste
à reporter le résultat fiscal calculé sur ton
formulaire 2042-C-PRO, sur impots.gouv.fr,
au moment de ta déclaration de revenus classique.
La leçon suivante détaille ce point, qui est
une source fréquente de confusion.

---

## Exercice
**Exercice pratique :** Fais la liste des documents mentionnés en début de leçon et coche ceux que tu as déjà sous la main. Pour ceux qui manquent (typiquement le relevé annuel plateforme ou le tableau d'amortissement), va les récupérer avant ta prochaine session — ça te fera gagner un temps précieux le jour J.

---`,
        },
        {
          id: 24,
          title: 'Ce que décla.fr ne fait pas à ta place : le 2042-C-PRO et tes vérifications',
          duration: '13 min',
          content: `---

MODULE 3 · LEÇON 4
────────────────────────────────────
Ce que l'outil ne fait pas à ta place
2042-C-PRO et tes propres vérifications
────────────────────────────────────

---

## Deux déclarations, pas une seule
C'est le point de confusion le plus fréquent
chez les hôtes qui découvrent le régime réel :
il y a DEUX déclarations distinctes, pas une.

1. LA LIASSE FISCALE (2031-SD + annexes 2033)
   → Calcule ton résultat fiscal professionnel
   → C'est ce que décla.fr (ou un comptable)
     produit et télétransmet à la DGFiP

2. TA DÉCLARATION DE REVENUS PERSONNELLE
   (2042 + annexe 2042-C-PRO)
   → C'est TOI qui la remplis, sur impots.gouv.fr,
     au moment de la campagne annuelle de déclaration
   → Tu y reportes le résultat fiscal calculé
     par la liasse, dans les cases dédiées
     aux revenus BIC non professionnels

Un outil de production de liasse t'aide sur
la première. La seconde reste ta responsabilité,
même si les chiffres à y reporter viennent
directement de la liasse produite.

---

## Ce que tu dois vérifier toi-même, dans tous les cas
Même avec un outil fiable et des contrôles
automatiques, TU restes responsable de l'exactitude
de ta déclaration devant l'administration —
comme pour toute déclaration fiscale, avec
n'importe quel outil ou même un comptable.

Vérifie systématiquement :
→ Que le total des recettes saisies correspond
  bien à tes relevés plateformes (pas d'oubli
  d'un mois, pas de doublon)
→ Que les intérêts d'emprunt saisis correspondent
  au relevé annuel de ta banque, pas à une estimation
→ Que le résultat fiscal final reporté sur ton
  2042-C-PRO est bien celui calculé par la liasse —
  une erreur de recopie entre les deux documents
  est plus fréquente qu'on ne le pense
→ Que tu conserves tous tes justificatifs
  (factures, relevés) pendant au moins 6 ans,
  durée du délai de reprise de l'administration
  en cas de contrôle

---

## Ce qu'un outil ne peut pas décider à ta place
Un outil de production de liasse applique
les règles fiscales que TU lui indiques.
Il ne peut pas :
→ Juger de l'opportunité de basculer de régime
→ Évaluer l'impact d'une revente prévue
  sur ta stratégie d'amortissement
→ T'alerter sur une optimisation fiscale légale
  spécifique à ta situation patrimoniale globale
  (autres revenus, autres biens, projets futurs)

C'est le rôle d'un conseil humain — expert-comptable
ou conseiller en gestion de patrimoine — quand
ta situation le justifie. Ce n'est pas un défaut
de l'outil, c'est simplement en dehors de son périmètre.

---

## Exercice
**Exercice pratique :** La prochaine fois que tu déclares (ou en préparation de ta prochaine déclaration), prévois explicitement dans ton calendrier un créneau séparé, après la liasse, pour ta déclaration 2042-C-PRO — ne pars pas du principe que "c'est fait" une fois la liasse transmise.

---`,
        },
      ],
    },
    {
      id: 4,
      title: 'Le calendrier fiscal 2026 et les erreurs à éviter',
      duration: '45 min',
      lessons: [
        {
          id: 31,
          title: 'Le calendrier fiscal LMNP 2026, date par date',
          duration: '15 min',
          content: `---

MODULE 4 · LEÇON 1
────────────────────────────────────
Le calendrier fiscal LMNP 2026
Date par date
────────────────────────────────────

---

## Trois échéances à ne pas confondre
Beaucoup d'hôtes confondent trois obligations
qui n'ont rien à voir entre elles, alors que
certaines dates tombent la même semaine :

01. L'ENREGISTREMENT EN MAIRIE (loi Le Meur)
    → Numéro d'enregistrement du logement,
      obligatoire au plus tard le 20 mai 2026
    → Concerne TOUS les hôtes LCD, micro-BIC
      ou régime réel
    → N'a rien à voir avec les impôts —
      c'est une obligation municipale/plateforme

02. LA LIASSE FISCALE (régime réel uniquement)
    → Formulaire 2031-SD + annexes 2033
    → Date limite en dépôt papier : autour
      du 5 mai 2026
    → Date limite en télétransmission EDI-TDFC
      (le mode utilisé par décla.fr) : autour
      du 19-20 mai 2026
    → Ne concerne QUE les loueurs au régime réel

03. LA DÉCLARATION DE REVENUS (2042 + 2042-C-PRO)
    → Concerne TOUT LE MONDE, micro-BIC
      et régime réel
    → Date limite échelonnée par département :
      23 mai 2026 pour les départements n°1 à 19
      et les non-résidents
      30 mai 2026 pour les départements n°20 à 54
      6 juin 2026 pour les départements n°55 à 976
      (déclaration en ligne)

Ces dates concernent la campagne 2026 (revenus 2025).
Elles évoluent chaque année de quelques jours —
vérifie toujours le calendrier officiel
sur impots.gouv.fr avant de t'organiser.

Source : impots.gouv.fr, calendrier fiscal officiel 2026 ;
BOFiP BIC-DECLA-30

---

## Une coïncidence de dates qui prête à confusion
En 2026, la date limite d'enregistrement loi Le Meur
(20 mai) et la date limite de télétransmission
de la liasse (19-20 mai) tombent quasiment
au même moment. Ce n'est PAS la même obligation,
et rater l'une n'a aucun rapport avec l'autre —
mais ça explique pourquoi tant de contenus
en parlent en même temps sur les réseaux
au printemps. Ne mélange pas les deux dans ton suivi.

---

## Ton rétroplanning recommandé
Pour éviter le rush de mai, voici un enchaînement
réaliste sur l'année :

JANVIER-FÉVRIER
→ Rassemble les relevés annuels de tes plateformes
→ Vérifie que ton immatriculation SIRET
  et ton option de régime sont à jour

MARS-AVRIL
→ Rassemble factures et justificatifs de charges
→ Si tu utilises décla.fr (ou équivalent),
  ouvre ta session de saisie sans attendre
  la dernière semaine

DÉBUT MAI
→ Vérifie, corrige, valide ta liasse
→ Télétransmets avant la date limite EDI

MI-MAI À DÉBUT JUIN
→ Reporte ton résultat fiscal sur ta déclaration
  2042-C-PRO, selon la date limite de ton département

---

## Exercice
**Exercice pratique :** Ouvre ton agenda maintenant et pose 3 rappels espacés dans le temps (rassembler les documents, remplir la liasse, faire la déclaration de revenus) plutôt qu'un seul rappel la veille de la date limite. C'est la méthode la plus simple pour éviter l'erreur de saisie précipitée.

---`,
        },
        {
          id: 32,
          title: 'Les erreurs les plus fréquentes en déclaration LMNP seul',
          duration: '15 min',
          content: `---

MODULE 4 · LEÇON 2
────────────────────────────────────
Les erreurs les plus fréquentes
En déclaration LMNP seul
────────────────────────────────────

---

## Erreur n°1 — Confondre recettes brutes et nettes
Tu dois toujours déclarer le montant BRUT
de tes loyers/nuitées, avant déduction
des commissions de plateforme. Les commissions
se déduisent ENSUITE, en charge — jamais
en les soustrayant directement de tes recettes
avant saisie. C'est l'erreur la plus fréquente
en première année de régime réel.

## Erreur n°2 — Amortir le terrain
Le terrain sur lequel est construit ton bien
n'est jamais amortissable — seule la construction
l'est. Si tu (ou un outil mal renseigné) amortis
la valeur totale du bien sans exclure la quote-part
de terrain, ton amortissement est surévalué,
ce qui expose à un redressement.

## Erreur n°3 — Déduire le capital remboursé de l'emprunt
Seuls les INTÉRÊTS d'emprunt sont déductibles.
Le capital remboursé chaque mois n'est jamais
une charge déductible, à aucun régime.

## Erreur n°4 — Oublier de reporter sur le 2042-C-PRO
Comme vu dans la leçon précédente : produire
la liasse ne suffit pas. Il faut ensuite reporter
le résultat sur ta déclaration de revenus personnelle.
Un oubli ici peut entraîner une taxation d'office
sur une base erronée par l'administration.

## Erreur n°5 — Ne pas conserver les justificatifs
Le délai de reprise de l'administration fiscale
est de 3 ans en général (l'année en cours
plus les 3 précédentes), mais peut s'étendre
en cas d'anomalie déclarée tardivement. Conserve
factures, relevés bancaires et relevés plateformes
au minimum 6 ans par prudence.

## Erreur n°6 — Ignorer l'impact de la revente sur la stratégie d'amortissement
Comme vu au module 1 : depuis 2025, amortir
au maximum sans réfléchir à ton horizon de revente
peut alourdir ta plus-value future. Ce n'est plus
une décision purement technique, c'est aussi
une décision patrimoniale.

## Erreur n°7 — Basculer de régime au mauvais moment
Revoir le module 2 : l'option pour le régime réel
doit être envoyée avant la date limite de déclaration
de l'année en cours pour s'appliquer à cette même
année. Un envoi tardif décale l'application
d'un an entier.

---

## Le fil conducteur de ces erreurs
Aucune de ces erreurs n'est due à la négligence —
elles viennent toutes d'un manque de repères
sur ce qui est spécifique à la fiscalité LMNP,
par rapport à une fiscalité "classique". C'est
exactement pour ça que cette formation existe :
te donner ces repères AVANT de te lancer dans
la saisie, pas après un redressement.

---

## Exercice
**Exercice pratique :** Relis cette liste de 7 erreurs et identifie celle(s) que tu aurais pu commettre sans cette formation. Note-les quelque part que tu consulteras au moment de ta prochaine déclaration.

---`,
        },
        {
          id: 33,
          title: "Quand ce guide ne suffit plus : les situations où il te faut un vrai expert-comptable",
          duration: '15 min',
          content: `---

MODULE 4 · LEÇON 3
────────────────────────────────────
Quand ça ne suffit plus
Les situations qui exigent un expert
────────────────────────────────────

---

## L'honnêteté avant tout
Cette formation t'a donné les moyens de déclarer
seul ta LMNP dans une situation standard, avec
un outil comme décla.fr. Ce n'est pas la même chose
que dire que TOUT LE MONDE devrait déclarer seul.

Certaines situations méritent, sans discussion,
un expert-comptable spécialisé LMNP — même si
ça coûte plus cher qu'un outil en ligne.

---

## Les signaux qui doivent t'alerter
→ TU BASCULES EN LMP
  Régime social (cotisations SSI), régime
  des plus-values professionnelles : la mécanique
  change entièrement. Ce n'est plus le périmètre
  de cette formation ni d'un outil de liasse LMNP.

→ TU DÉTIENS LE BIEN EN SCI (surtout à l'IS)
  ou dans un montage en démembrement de propriété
  Ces structures ont des règles fiscales propres
  qu'un outil standardisé pour particuliers en LMNP
  ne couvre pas correctement.

→ TU PRÉVOIS UNE REVENTE DANS L'ANNÉE
  Le calcul de plus-value (avec la réintégration
  des amortissements vue au module 1) mérite
  une simulation précise et personnalisée avant
  de signer un compromis, pas après.

→ TU AS PLUSIEURS ACTIVITÉS BIC/BNC CROISÉES
  LMNP + para-hôtellerie + conciergerie enregistrée
  à ton nom, par exemple : les règles d'imputation
  des déficits et de cumul des régimes deviennent
  complexes.

→ TU AS DÉJÀ REÇU UN COURRIER DE L'ADMINISTRATION
  Toute demande de justificatif, mise en demeure
  ou proposition de rectification doit être traitée
  avec un professionnel, jamais seul avec un outil
  de déclaration standard.

→ TU N'ES SIMPLEMENT PAS À L'AISE
  Si après cette formation tu sens que tu n'es pas
  serein à l'idée d'assumer seul la responsabilité
  de ta déclaration, c'est un signal suffisant
  en soi. La sérénité a un prix, et ce n'est pas
  un mauvais calcul de le payer.

---

## Le vrai calcul à faire
Compare toujours :
→ Le coût d'un expert-comptable spécialisé LMNP
  (environ 500€ à 1 200€/an selon la complexité)
→ Le coût d'un outil comme décla.fr (autour
  de 220-250€/an en 2026)
→ Le risque financier d'une erreur dans TA situation
  spécifique (majoration, intérêts de retard,
  ou pire, un redressement sur une plus-value
  mal anticipée)

Pour une situation simple, l'écart de prix
entre les deux options est souvent largement
compensé par la tranquillité — mais pour
une situation complexe, l'écart de prix devient
dérisoire face au risque.

---

## Pour aller plus loin
Cette formation t'a donné le cadre. Pour la mise
en musique concrète dans TA situation (choix
définitif de régime, stratégie de revente,
structuration patrimoniale), rien ne remplace
un échange avec un professionnel qui voit
l'ensemble de ton patrimoine — pas seulement
ta LCD.

---

## Exercice
**Exercice pratique :** Relis la liste des signaux d'alerte. Si tu n'en coches aucun, tu es probablement dans une situation adaptée à un outil comme décla.fr, en gardant les bons réflexes vus dans cette formation. Si tu en coches un seul, prends au moins un premier avis auprès d'un expert-comptable spécialisé LMNP avant de basculer définitivement au régime réel seul.

---`,
        },
      ],
    },
  ],
}
