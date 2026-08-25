export const DECLARER_LMNP_FORMATION = {
  slug: 'declarer-lmnp-seul-decla-fr',
  title: 'Déclarer sa LMNP seul avec décla.fr',
  description: `Régime réel, liasse fiscale 2031/2033, amortissements, réforme 2025 sur la plus-value : la méthode complète pour faire ta déclaration LMNP toi-même avec décla.fr, sans expert-comptable : et savoir exactement quand tu en as quand même besoin.`,
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
          content: `## Pourquoi commencer par le vocabulaire

Avant de parler de décla.fr, il faut être au clair sur ce que tu déclares et à quel régime tu es soumis.

Beaucoup d'hôtes ouvrent un outil de déclaration sans savoir répondre à ces 3 questions :

- Suis-je LMNP ou LMP ?
- Suis-je au micro-BIC ou au régime réel ?
- Qu'est-ce que je dois transmettre, et à qui ?

Cette leçon répond aux trois.

## LMNP : Loueur en Meublé Non Professionnel

Tu es LMNP si tu loues un logement meublé (donc y compris ta LCD) et que tu remplis au moins une de ces deux conditions :

- Tes recettes locatives meublées annuelles sont inférieures à 23 000€
- Ces recettes représentent moins de 50% des revenus professionnels de ton foyer fiscal

Si tu dépasses **les deux seuils à la fois**, tu bascules en LMP (Loueur Meublé Professionnel) : cotisations sociales SSI, régime des plus-values professionnelles, obligations différentes. Si un seul des deux seuils est dépassé, tu restes LMNP : c'est le cumul des deux qui déclenche le changement de statut.


> Source : Code général des impôts, art. 155 IV ; BOFiP BIC-CHAMP-40

## Micro-BIC : la déclaration simplifiée

Au micro-BIC, tu déclares ton chiffre d'affaires brut sur ta déclaration de revenus (2042-C-PRO). L'administration applique un abattement forfaitaire censé représenter tes charges : tu ne prouves rien, tu ne fournis aucun justificatif, tu ne remplis pas de liasse.

**Barème 2026 (revenus 2025, déclarés au printemps 2026) :**

| Type de location | Abattement | Plafond de recettes |
| --- | --- | --- |
| Meublé de tourisme non classé | 30% | 15 000€/an |
| Meublé de tourisme classé | 50% | 77 700€/an |
| Chambre d'hôtes | 71% | 77 700€/an |

Pour les revenus 2026 (déclarés en 2027), le plafond "classé" est réévalué à 83 600€. Le plafond "non classé" de 15 000€, lui, est explicitement exclu de la revalorisation : il reste figé.


> Source : Loi n° 2024-1039 du 19 novembre 2024 (loi Le Meur) ; CGI art. 50-0 ; BOFiP BIC-DECLA-10-10

## Régime réel : tu déclares tes charges vraies

Au régime réel, tu ne déclares plus un forfait. Tu déclares tes recettes réelles moins tes charges réelles (ménage, intérêts d'emprunt, copropriété, assurance, amortissements...).

Pour ça, tu dois produire chaque année une **liasse fiscale** : un mini-bilan comptable qui détaille ton résultat, tes charges et tes amortissements. C'est cette liasse (pas la déclaration de revenus elle-même) qui est le sujet central de cette formation, et le cœur de ce que fait un outil comme décla.fr.

## Ce qu'il faut retenir

✅ Le micro-BIC ne nécessite aucun outil spécifique : une ligne, un chiffre, sur ta déclaration classique
✅ Le régime réel nécessite de produire une liasse fiscale (formulaires 2031-SD et annexes 2033)
❌ Un outil de "déclaration LMNP" ne sert à rien si tu es au micro-BIC : tu n'as pas de liasse à produire

**Exercice pratique :** Note tes recettes LCD brutes de l'an dernier, et regarde si tu es en dessous du plafond micro-BIC qui correspond à ton logement (classé ou non classé). Si oui, tu n'as peut-être même pas besoin d'aller plus loin dans cette formation : sauf si tu es déjà au régime réel ou si tu veux évaluer si basculer serait plus avantageux. La leçon suivante t'aide à trancher.`,
        },
        {
          id: 2,
          title: 'Micro-BIC ou régime réel : lequel choisir, concrètement',
          duration: '15 min',
          content: `## Le principe de comparaison

La question n'est pas "lequel est le mieux" dans l'absolu. C'est : lequel laisse le moins de bénéfice imposable dans ta situation.

- **Micro-BIC** : base imposable = recettes × (1 − abattement). Aucun justificatif, aucune charge à prouver.
- **Régime réel** : base imposable = recettes − charges réelles − amortissements. Justificatifs à conserver, liasse fiscale à produire.

## Le seuil de bascule, en règle simple

Le régime réel devient intéressant quand tes charges réelles + amortissements dépassent le pourcentage d'abattement auquel tu aurais droit au micro-BIC.

- **Non classé (abattement 30%)** : dès que tes charges réelles dépassent ~30% de tes recettes, le réel gagne. C'est très fréquent, surtout avec un crédit en cours.
- **Classé (abattement 50%)** : il faut dépasser 50% de charges réelles. Moins systématique, mais un bien à crédit avec des travaux y arrive souvent aussi.

## Exemple chiffré

Appartement classé, à crédit :

| Poste | Montant |
| --- | --- |
| Recettes brutes | 20 000€/an |
| Charges d'exploitation (ménage, assurance, plateforme) | 5 000€ |
| Intérêts d'emprunt | 3 500€ |
| Amortissement bien + mobilier | 6 000€ |
| Total charges réelles | 14 500€ (72,5% des recettes) |

- Micro-BIC (abattement 50%) → base imposable : 10 000€
- Régime réel → base imposable : 20 000 − 14 500 = **5 500€**

Sur une TMI à 30% + prélèvements sociaux 17,2% : micro-BIC ≈ 4 720€ d'impôt/prélèvements, régime réel ≈ 2 596€. Écart : environ **2 100€/an** en faveur du réel.

> Cet exemple est pédagogique. Ta situation réelle dépend de ton taux marginal d'imposition, de ton apport, de ton crédit et de tes charges effectives : fais toujours ta propre simulation avant de trancher.

## L'amortissement : pourquoi le réel écrase souvent le micro-BIC

L'amortissement, c'est la déduction comptable de la perte de valeur théorique de ton bien et de son mobilier, étalée sur plusieurs années.

- Bien immobilier (hors terrain, non amortissable) : généralement amorti sur 25 à 35 ans
- Mobilier et équipement : généralement 5 à 10 ans
- Travaux : durée propre à chaque poste

C'est souvent la plus grosse charge déductible au régime réel : bien plus que le ménage ou l'assurance. D'où l'écart important dans l'exemple ci-dessus.

⚠️ Depuis 2025, l'amortissement n'est plus "gratuit" à long terme. La leçon suivante t'explique pourquoi : un point que beaucoup de guides publiés avant 2025 ne mentionnent pas encore.

## Dans quels cas rester au micro-BIC

- Logement payé comptant, peu de charges
- Recettes modestes, sous le plafond
- Tu privilégies la simplicité totale à l'optimisation
- Tu n'as pas l'énergie de suivre une comptabilité, même simplifiée, chaque année

Il n'y a aucune obligation de passer au réel. C'est un choix, réversible sous conditions (la leçon du module 2 détaille comment et quand).

**Exercice pratique :** Fais le total de tes charges réelles de l'an dernier (ménage, assurance, commissions plateformes, copropriété, taxe foncière, intérêts d'emprunt : hors capital remboursé). Compare ce total à l'abattement micro-BIC qui s'appliquerait à toi. Si tes charges réelles dépassent ce pourcentage, tu as un signal fort pour envisager le régime réel : et donc, potentiellement, un outil comme décla.fr.`,
        },
        {
          id: 3,
          title: "La réforme 2025 sur les amortissements et la plus-value : ce qu'il faut savoir avant de basculer",
          duration: '15 min',
          content: `## Pourquoi cette leçon est essentielle

Historiquement, l'amortissement au régime réel était présenté comme un double avantage :

- Il réduit ton impôt chaque année pendant la location
- Et il ne comptait pas dans le calcul de la plus-value le jour où tu revends (donc "gratuit" à long terme)

La loi de finances pour 2025 a supprimé ce deuxième avantage. C'est le changement le plus important en fiscalité LMNP depuis la loi Le Meur, et il concerne directement toute personne qui envisage le régime réel aujourd'hui.

## Ce que dit la réforme, précisément

**Article 84 de la loi de finances pour 2025** : pour les loueurs en meublé non professionnels au régime réel, les amortissements déduits sur le bien immobilier sont désormais réintégrés dans le calcul de la plus-value lors de la revente.

Concrètement, le calcul devient :

> Plus-value imposable = Prix de vente − (Prix d'acquisition − amortissements immobiliers déduits)

Plus tu as amorti pendant la location, plus ton "prix d'acquisition" est réduit dans le calcul, et plus la plus-value taxable est élevée à la revente. Le mobilier n'est **pas** concerné : son amortissement reste hors du calcul de la plus-value.


> Source : Loi n° 2025-127 du 14 février 2025 de finances pour 2025, article 84 ; BOFiP, mis à jour en 2025-2026

## Depuis quand, et pour quels amortissements

- La réforme s'applique à toute cession réalisée **à compter du 15 février 2025**
- Elle vise tous les amortissements déduits, y compris ceux pratiqués **avant 2025**. Ce n'est pas rétroactif sur l'impôt déjà payé, mais le stock d'amortissements cumulés depuis le début de ton activité compte dans le calcul

Ce point a été confirmé par l'administration (réponse ministérielle Mette, question n°10097, publiée le 24 mars 2026) : la réintégration ne se limite pas aux amortissements pratiqués depuis 2025.

## Ce qui reste inchangé

- Le régime de la plus-value LMNP reste celui des particuliers (CGI art. 150 U), pas celui des professionnels : les abattements pour durée de détention s'appliquent toujours : exonération totale d'impôt sur le revenu après 22 ans de détention, et des prélèvements sociaux après 30 ans
- Les résidences avec services sous statut particulier (résidences étudiantes, seniors, établissements médicalisés répondant aux critères légaux) bénéficient d'une exonération spécifique de cette réintégration
- Seul le régime réel est concerné. Si tu es resté au micro-BIC, tu n'as jamais pratiqué d'amortissement comptable : cette réforme ne te concerne pas

## Ce que ça change pour ta décision

Ça ne rend pas le régime réel désavantageux : l'économie d'impôt pendant les années de location reste réelle et souvent significative. Mais le calcul "le régime réel est gratuit sur toute la durée" n'est plus vrai depuis février 2025.

La bonne question à te poser n'est plus "le réel me fait-il économiser des impôts ?" (quasi toujours oui) mais "l'économie annuelle compense-t-elle le supplément de plus-value que je paierai le jour où je revends ?"

C'est une question de projet patrimonial, pas une question technique. Si tu comptes garder le bien longtemps (au-delà de 22-30 ans) ou ne jamais le revendre, l'impact de la réforme est marginal pour toi. Si tu envisages une revente à moyen terme, fais le calcul avant de basculer, idéalement avec un professionnel pour cette décision précise.

**Exercice pratique :** Si tu envisages de revendre ton bien LCD dans les 10 prochaines années, estime tes amortissements immobiliers cumulés sur cette période (prix du bien ÷ durée d'amortissement × nombre d'années). C'est approximativement le montant qui viendra augmenter ta plus-value taxable à la revente. Garde ce chiffre en tête pour la suite de la formation.`,
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
          content: `## Pourquoi tu as besoin d'un SIRET

Même en LMNP, tu exerces une activité (BIC). L'administration a besoin de t'identifier : c'est le rôle du numéro SIRET.

Sans SIRET, tu ne peux ni déclarer au régime réel, ni utiliser un outil comme décla.fr, ni recevoir tes échéanciers fiscaux liés à cette activité.

## Où et comment t'immatriculer en 2026

Depuis le 1er janvier 2023, toutes les démarches de création d'activité (y compris LMNP) passent par un seul portail : le **Guichet unique**, géré par l'INPI.

- Site : formalites.entreprises.gouv.fr
- L'ancien formulaire papier P0i n'existe plus : tout se fait en ligne
- Démarche 100% gratuite
- Délai légal : à faire dans les 15 jours suivant le début de ton activité de location meublée
- Réception du SIRET : généralement entre 1 et 4 semaines après le dépôt


> Source : formalites.entreprises.gouv.fr (INPI) ; ordonnance n°2021-1189 du 15 septembre 2021

## Ce que tu dois renseigner

- Ton identité et ton adresse
- L'adresse du logement loué
- La date de début d'activité
- Le régime fiscal souhaité : c'est ici que tu peux directement cocher "régime réel" si tu sais déjà que c'est ton choix (voir leçon suivante)

⚠️ Si tu loues plusieurs logements, un seul SIRET suffit pour l'ensemble de ton activité LMNP, sauf cas particuliers (montages spécifiques).

## Un piège fréquent

Beaucoup d'hôtes découvrent l'obligation d'immatriculation seulement quand ils veulent basculer au régime réel : alors qu'elle s'applique dès le premier euro de recettes en LMNP, même au micro-BIC.

Si tu loues déjà depuis un moment sans être immatriculé, régularise dès que possible : ce n'est pas sanctionné comme une fraude si tu es de bonne foi et que tu régularises, mais mieux vaut ne pas attendre un contrôle pour le faire.

**Exercice pratique :** Vérifie si tu as déjà un SIRET pour ton activité de location meublée (regarde tes précédents avis d'imposition professionnels, ou cherche ton nom sur annuaire-entreprises.data.gouv.fr). Si tu n'en as pas, note dans ton agenda de faire la démarche sur formalites.entreprises.gouv.fr cette semaine : c'est un préalable obligatoire à tout le reste.`,
        },
        {
          id: 12,
          title: 'Opter pour le régime réel : les deux façons de le faire, et le piège du timing',
          duration: '13 min',
          content: `## Deux façons d'opter

**Méthode 1 : Au moment de l'immatriculation.** Sur le Guichet unique (formalites.entreprises.gouv.fr), tu coches directement l'option "régime réel" lors de ta déclaration de début d'activité. C'est la méthode la plus simple si tu sais déjà que tu veux le réel dès le départ.

**Méthode 2 : En cours d'activité** (tu es déjà au micro-BIC). Tu envoies une lettre d'option au Service des Impôts des Entreprises (SIE) dont tu dépends, de préférence en recommandé avec accusé de réception, pour garder une preuve datée. Certains SIE tolèrent une option via la messagerie sécurisée d'impots.gouv.fr, mais ce n'est pas la voie officiellement prévue : privilégie toujours le courrier recommandé.


> Source : BOFiP BIC-DECLA-10-10-20

## Le piège du timing

C'est le point qui coince le plus d'hôtes : pour que l'option s'applique aux revenus de l'année en cours, ta lettre doit être envoyée avant la date limite de dépôt de la déclaration de revenus de cette même année.

En clair : si tu veux basculer au réel pour tes revenus 2026, ta lettre doit être partie avant la date limite de la déclaration des revenus 2025 : soit fin mai/début juin 2026.

⚠️ Si tu envoies ta lettre après cette date, ton option ne prend effet que sur les revenus de l'année suivante. Il n'y a pas de rattrapage rétroactif.

## Durée de l'option

- L'option pour le régime réel est valable pour l'année en cours et reconduite tacitement chaque année (elle ne s'éteint pas automatiquement)
- Pour revenir au micro-BIC ensuite, il faut notifier ta renonciation à l'administration, et cela reste soumis à des règles de délai similaires : ce n'est pas un aller-retour libre d'une année sur l'autre

Ne bascule donc pas au réel "pour tester" : prends la décision en connaissance de cause, avec la simulation chiffrée du module précédent.

**Exercice pratique :** Si tu es actuellement au micro-BIC et que tu veux basculer au réel, note dans ton agenda la date limite de la prochaine déclaration de revenus (elle est échelonnée par département : voir module 4) et prévois d'envoyer ta lettre recommandée au moins 3 semaines avant, pour avoir une marge de sécurité postale.`,
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
          content: `## Ce que décla.fr n'est pas

Ce n'est pas un cabinet d'expertise comptable. Ce n'est pas un logiciel de comptabilité au sens classique (pas de suivi de trésorerie au fil de l'eau, pas de facturation).

Ce n'est pas non plus un outil pour le micro-BIC : inutile si tu es resté à ce régime (revoir module 1).

## Ce que décla.fr est

Un outil de **production fiscale annuelle**, dédié aux loueurs en meublé (LMNP et LMP) au régime réel. Sa mission unique : générer chaque année ta liasse fiscale (formulaire 2031-SD et annexes 2033-A à G), calculer tes amortissements, et la télétransmettre directement à la DGFiP.

- Créé en 2017, adossé au cabinet Honoré Patrimoine
- Partenaire EDI (échange de données informatisé) habilité par la DGFiP : la télétransmission de ta liasse se fait directement et de façon sécurisée, sans passer par un tiers déclarant classique
- Se présente comme utilisé par plusieurs dizaines de milliers de loueurs (chiffre communiqué par l'éditeur, à prendre comme tel)


> Source : decla.fr, page "qui sommes-nous" et blog éditeur, 2026

## Comment se déroule une déclaration

Le parcours se fait en une session de saisie guidée, en environ 7 étapes :

1. Informations générales de ton activité
2. Recettes locatives de l'année
3. Charges d'exploitation (ménage, assurance, commissions, copropriété, taxe foncière...)
4. Charges financières (intérêts d'emprunt)
5. Immobilisations et amortissements (bien, mobilier, travaux : l'outil calcule et suit le tableau d'amortissement d'une année sur l'autre)
6. Contrôles de cohérence automatiques
7. Génération de la liasse + télétransmission

Des alertes automatiques signalent les incohérences de saisie (montants aberrants, oublis probables) avant l'envoi définitif.

## Ce que ça coûte en 2026

| Formule | Prix 2026 |
| --- | --- |
| Simplifiée | 219€ TTC |
| Avec fichier FEC (utile en cas de contrôle approfondi) | 249€ TTC |
| SCI à l'IS | 119€ TTC / déclaration |

À comparer à un expert-comptable spécialisé LMNP : compter entre 500€ et 800€ HT/an pour un lot simple, et davantage pour plusieurs biens ou une structure plus complexe.


> Source : decla.fr, grille tarifaire publique 2026 ; comparatifs indépendants (jedeclaremonmeuble.com, lmnp.ai), 2026

⚠️ Les tarifs évoluent d'une année sur l'autre : vérifie toujours le prix affiché au moment de ton inscription plutôt que de te fier à ce chiffre dans un an ou deux.

**Exercice pratique :** Va sur decla.fr et regarde la page tarifs actuelle. Compare le prix affiché aujourd'hui à celui indiqué dans cette leçon : s'il a changé, tu sauras que tu dois toujours vérifier l'info à la source plutôt que de te fier à un guide, aussi récent soit-il.`,
        },
        {
          id: 22,
          title: 'décla.fr vs expert-comptable vs autres outils : le comparatif honnête',
          duration: '14 min',
          content: `## Ce qui ressort des avis utilisateurs

Sans pouvoir garantir l'exhaustivité de chaque avis en ligne, les retours consultés (comparatifs indépendants, avis Google) convergent sur les mêmes points forts et les mêmes limites.

**Points forts récurrents :**

✅ Coût très inférieur à un cabinet comptable
✅ Interface guidée, accessible sans vocabulaire comptable préalable
✅ Assistance par chat avec de vraies personnes, disponible en semaine et le samedi (horaires affichés : 8h-20h du lundi au samedi)
✅ Amortissements calculés et reportés automatiquement d'une année sur l'autre : évite l'erreur classique de recalculer soi-même un tableau d'amortissement

**Limites récurrentes :**

❌ Pas adapté aux montages complexes : démembrement de propriété, holding, SCI à l'IS avec plusieurs associés : l'outil n'a pas la capacité d'analyse qu'un professionnel humain a sur ces situations
❌ Certains utilisateurs de longue date signalent une hausse du prix sur les renouvellements
❌ decla.fr n'est pas un cabinet d'expertise comptable inscrit à l'Ordre : la responsabilité finale de l'exactitude de ta déclaration reste la tienne, comme pour tout auto-déclarant


> Source : synthèse de comparatifs et avis publics (jedeclaremonmeuble.com, lmnp.ai, immobilierloyer.com, avis Google decla.fr), consultés en 2026

## La vraie question à se poser

Ce n'est pas "décla.fr est-il fiable" en général : c'est "ma situation est-elle assez simple pour qu'un outil standardisé la couvre bien ?"

| Ta situation est probablement adaptée si | Ta situation mérite un expert-comptable si |
| --- | --- |
| Bien détenu en nom propre (pas de SCI complexe) | Structure juridique complexe (SCI à l'IS, holding, indivision conflictuelle) |
| Un seul ou quelques logements | Plusieurs activités croisées (LMNP + LMP + autre BIC/BNC) |
| Pas de montage en démembrement de propriété | Revente ou donation prévue dans l'année |
| Pas d'opération exceptionnelle dans l'année | Tu n'es pas à l'aise à l'idée d'assumer seul la responsabilité de ta déclaration |

## Un point sur les CGA/OGA : une info qui a beaucoup changé

Si tu as lu des guides plus anciens, tu as peut-être vu mentionné l'intérêt d'adhérer à un Centre de Gestion Agréé (CGA) pour éviter une majoration de 25% de ton bénéfice imposable, ou pour obtenir une réduction d'impôt sur les frais de comptable.

Ces deux avantages n'existent plus :

- La majoration de 25% pour les non-adhérents a été supprimée progressivement entre 2020 et 2023
- Le cadre légal des CGA/OGA lui-même a été supprimé par la loi de finances 2025, à compter du 16 février 2025

Autrement dit, l'argument "il faut adhérer à un CGA" pour optimiser ta fiscalité LMNP est aujourd'hui obsolète. Si tu le lis encore quelque part, la source n'a pas été mise à jour depuis 2025.


> Source : loi n° 2020-1721 du 29 décembre 2020 (LF 2021) ; loi n° 2025-127 du 14 février 2025 (LF 2025)

**Exercice pratique :** Reprends le tableau ci-dessus et coche ce qui te correspond dans chaque colonne. Si tu coches au moins une case de la colonne de droite, garde en tête la dernière leçon de cette formation avant de te décider définitivement pour un outil en ligne seul.`,
        },
        {
          id: 23,
          title: 'Les 7 étapes de la liasse sur décla.fr, expliquées une par une',
          duration: '15 min',
          content: `## Avant de commencer : ce qu'il te faut sous la main

Prépare ces documents avant d'ouvrir l'outil, ça t'évitera des allers-retours :

- Ton avis d'imposition et numéro SIRET
- Le relevé annuel de tes plateformes (Airbnb, Booking, Driing...) avec le détail des revenus bruts et des commissions prélevées
- Tes factures de charges (ménage, assurance, abonnements, travaux)
- Ton tableau d'amortissement de l'année précédente (ou l'acte d'achat + facture du mobilier si c'est ta première déclaration au réel)
- Ton relevé de prêt immobilier (montant des intérêts payés dans l'année, hors capital)
- Ton avis de taxe foncière

## Les 7 étapes, une par une

1. **Informations générales** : Identité, SIRET, adresse du ou des logements, date de début d'activité, régime (réel simplifié).
2. **Recettes locatives** : Le total de tes loyers/nuitées encaissés sur l'année, à partir du récapitulatif annuel de chaque plateforme. Saisis bien le montant **brut**, commissions plateformes incluses (elles se déduisent ensuite en charge, pas en soustraction directe des recettes).
3. **Charges d'exploitation** : Ménage, linge, commissions plateformes, assurance habitation/LCD, abonnements (internet, PMS, outils de gestion), frais de publicité, copropriété, taxe foncière, frais de comptabilité le cas échéant.
4. **Charges financières** : Les intérêts d'emprunt de l'année, uniquement la part intérêts, jamais le capital remboursé, qui n'est pas une charge déductible.
5. **Immobilisations et amortissements** : La partie la plus technique : valeur du bien (hors terrain, non amortissable), du mobilier, des travaux, avec leurs durées d'amortissement respectives. L'outil calcule la dotation de l'année et la reporte automatiquement l'année suivante.
6. **Contrôles de cohérence** : L'outil signale les anomalies probables : montants qui semblent inversés, oublis fréquents, incohérences entre les étapes. Prends le temps de lire chaque alerte avant de continuer.
7. **Génération et télétransmission** : La liasse (2031-SD + annexes 2033) est générée et transmise directement à la DGFiP via le canal EDI. Tu reçois normalement une confirmation de dépôt : conserve-la précieusement, c'est ta preuve de déclaration dans les délais.

## Ce qu'il te reste à faire après la liasse

⚠️ La télétransmission de la liasse ne remplace **pas** ta déclaration de revenus personnelle. Il te reste à reporter le résultat fiscal calculé sur ton formulaire 2042-C-PRO, sur impots.gouv.fr, au moment de ta déclaration de revenus classique. La leçon suivante détaille ce point, qui est une source fréquente de confusion.

**Exercice pratique :** Fais la liste des documents mentionnés en début de leçon et coche ceux que tu as déjà sous la main. Pour ceux qui manquent (typiquement le relevé annuel plateforme ou le tableau d'amortissement), va les récupérer avant ta prochaine session : ça te fera gagner un temps précieux le jour J.`,
        },
        {
          id: 24,
          title: 'Ce que décla.fr ne fait pas à ta place : le 2042-C-PRO et tes vérifications',
          duration: '13 min',
          content: `## Deux déclarations, pas une seule

C'est le point de confusion le plus fréquent chez les hôtes qui découvrent le régime réel : il y a deux déclarations distinctes, pas une.

1. **La liasse fiscale** (2031-SD + annexes 2033) : calcule ton résultat fiscal professionnel. C'est ce que décla.fr (ou un comptable) produit et télétransmet à la DGFiP.
2. **Ta déclaration de revenus personnelle** (2042 + annexe 2042-C-PRO) : c'est toi qui la remplis, sur impots.gouv.fr, au moment de la campagne annuelle de déclaration. Tu y reportes le résultat fiscal calculé par la liasse, dans les cases dédiées aux revenus BIC non professionnels.

Un outil de production de liasse t'aide sur la première. La seconde reste ta responsabilité, même si les chiffres à y reporter viennent directement de la liasse produite.

## Ce que tu dois vérifier toi-même, dans tous les cas

Même avec un outil fiable et des contrôles automatiques, tu restes responsable de l'exactitude de ta déclaration devant l'administration : comme pour toute déclaration fiscale, avec n'importe quel outil ou même un comptable.

Vérifie systématiquement :

- Que le total des recettes saisies correspond bien à tes relevés plateformes (pas d'oubli d'un mois, pas de doublon)
- Que les intérêts d'emprunt saisis correspondent au relevé annuel de ta banque, pas à une estimation
- Que le résultat fiscal final reporté sur ton 2042-C-PRO est bien celui calculé par la liasse : une erreur de recopie entre les deux documents est plus fréquente qu'on ne le pense
- Que tu conserves tous tes justificatifs (factures, relevés) pendant au moins 6 ans, durée du délai de reprise de l'administration en cas de contrôle

## Ce qu'un outil ne peut pas décider à ta place

Un outil de production de liasse applique les règles fiscales que tu lui indiques. Il ne peut pas :

- Juger de l'opportunité de basculer de régime
- Évaluer l'impact d'une revente prévue sur ta stratégie d'amortissement
- T'alerter sur une optimisation fiscale légale spécifique à ta situation patrimoniale globale (autres revenus, autres biens, projets futurs)

C'est le rôle d'un conseil humain (expert-comptable ou conseiller en gestion de patrimoine) quand ta situation le justifie. Ce n'est pas un défaut de l'outil, c'est simplement en dehors de son périmètre.

**Exercice pratique :** La prochaine fois que tu déclares (ou en préparation de ta prochaine déclaration), prévois explicitement dans ton calendrier un créneau séparé, après la liasse, pour ta déclaration 2042-C-PRO : ne pars pas du principe que "c'est fait" une fois la liasse transmise.`,
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
          content: `## Trois échéances à ne pas confondre

Beaucoup d'hôtes confondent trois obligations qui n'ont rien à voir entre elles, alors que certaines dates tombent la même semaine.

| Échéance | Concerne | Date 2026 |
| --- | --- | --- |
| Enregistrement en mairie (loi Le Meur) | Tous les hôtes LCD, micro-BIC ou régime réel | Au plus tard le 20 mai 2026 |
| Liasse fiscale (2031-SD + annexes 2033) | Régime réel uniquement, télétransmission EDI (décla.fr) | Autour du 19-20 mai 2026 |
| Déclaration de revenus (2042 + 2042-C-PRO) | Tout le monde | 23 mai (dépts 1-19 + non-résidents), 30 mai (dépts 20-54), 6 juin (dépts 55-976) |

Ces dates concernent la campagne 2026 (revenus 2025). Elles évoluent chaque année de quelques jours : vérifie toujours le calendrier officiel sur impots.gouv.fr avant de t'organiser.


> Source : impots.gouv.fr, calendrier fiscal officiel 2026 ; BOFiP BIC-DECLA-30

## Une coïncidence de dates qui prête à confusion

⚠️ En 2026, la date limite d'enregistrement loi Le Meur (20 mai) et la date limite de télétransmission de la liasse (19-20 mai) tombent quasiment au même moment. Ce n'est **pas** la même obligation, et rater l'une n'a aucun rapport avec l'autre : mais ça explique pourquoi tant de contenus en parlent en même temps sur les réseaux au printemps. Ne mélange pas les deux dans ton suivi.

## Ton rétroplanning recommandé

Pour éviter le rush de mai, voici un enchaînement réaliste sur l'année :

- **Janvier-février** : Rassemble les relevés annuels de tes plateformes. Vérifie que ton immatriculation SIRET et ton option de régime sont à jour.
- **Mars-avril** : Rassemble factures et justificatifs de charges. Si tu utilises décla.fr (ou équivalent), ouvre ta session de saisie sans attendre la dernière semaine.
- **Début mai** : Vérifie, corrige, valide ta liasse. Télétransmets avant la date limite EDI.
- **Mi-mai à début juin** : Reporte ton résultat fiscal sur ta déclaration 2042-C-PRO, selon la date limite de ton département.

**Exercice pratique :** Ouvre ton agenda maintenant et pose 3 rappels espacés dans le temps (rassembler les documents, remplir la liasse, faire la déclaration de revenus) plutôt qu'un seul rappel la veille de la date limite. C'est la méthode la plus simple pour éviter l'erreur de saisie précipitée.`,
        },
        {
          id: 32,
          title: 'Les erreurs les plus fréquentes en déclaration LMNP seul',
          duration: '15 min',
          content: `## 7 erreurs classiques, et comment les éviter

- **Confondre recettes brutes et nettes.** Tu dois toujours déclarer le montant brut de tes loyers/nuitées, avant déduction des commissions de plateforme. Les commissions se déduisent ensuite, en charge : jamais en les soustrayant directement de tes recettes avant saisie. C'est l'erreur la plus fréquente en première année de régime réel.
- **Amortir le terrain.** Le terrain sur lequel est construit ton bien n'est jamais amortissable : seule la construction l'est. Si tu (ou un outil mal renseigné) amortis la valeur totale du bien sans exclure la quote-part de terrain, ton amortissement est surévalué, ce qui expose à un redressement.
- **Déduire le capital remboursé de l'emprunt.** Seuls les intérêts d'emprunt sont déductibles. Le capital remboursé chaque mois n'est jamais une charge déductible, à aucun régime.
- **Oublier de reporter sur le 2042-C-PRO.** Produire la liasse ne suffit pas. Un oubli ici peut entraîner une taxation d'office sur une base erronée par l'administration.
- **Ne pas conserver les justificatifs.** Le délai de reprise de l'administration fiscale est de 3 ans en général (l'année en cours plus les 3 précédentes), mais peut s'étendre en cas d'anomalie déclarée tardivement. Conserve factures, relevés bancaires et relevés plateformes au minimum 6 ans par prudence.
- **Ignorer l'impact de la revente sur la stratégie d'amortissement.** Depuis 2025, amortir au maximum sans réfléchir à ton horizon de revente peut alourdir ta plus-value future. Ce n'est plus une décision purement technique, c'est aussi une décision patrimoniale.
- **Basculer de régime au mauvais moment.** L'option pour le régime réel doit être envoyée avant la date limite de déclaration de l'année en cours pour s'appliquer à cette même année. Un envoi tardif décale l'application d'un an entier.

## Le fil conducteur de ces erreurs

Aucune de ces erreurs n'est due à la négligence : elles viennent toutes d'un manque de repères sur ce qui est spécifique à la fiscalité LMNP, par rapport à une fiscalité "classique". C'est exactement pour ça que cette formation existe : te donner ces repères avant de te lancer dans la saisie, pas après un redressement.

**Exercice pratique :** Relis cette liste de 7 erreurs et identifie celle(s) que tu aurais pu commettre sans cette formation. Note-les quelque part que tu consulteras au moment de ta prochaine déclaration.`,
        },
        {
          id: 33,
          title: "Quand ce guide ne suffit plus : les situations où il te faut un vrai expert-comptable",
          duration: '15 min',
          content: `## L'honnêteté avant tout

Cette formation t'a donné les moyens de déclarer seul ta LMNP dans une situation standard, avec un outil comme décla.fr. Ce n'est pas la même chose que dire que tout le monde devrait déclarer seul.

Certaines situations méritent, sans discussion, un expert-comptable spécialisé LMNP : même si ça coûte plus cher qu'un outil en ligne.

## Les signaux qui doivent t'alerter

- **Tu bascules en LMP.** Régime social (cotisations SSI), régime des plus-values professionnelles : la mécanique change entièrement. Ce n'est plus le périmètre de cette formation ni d'un outil de liasse LMNP.
- **Tu détiens le bien en SCI** (surtout à l'IS) ou dans un montage en démembrement de propriété. Ces structures ont des règles fiscales propres qu'un outil standardisé pour particuliers en LMNP ne couvre pas correctement.
- **Tu prévois une revente dans l'année.** Le calcul de plus-value (avec la réintégration des amortissements vue au module 1) mérite une simulation précise et personnalisée avant de signer un compromis, pas après.
- **Tu as plusieurs activités BIC/BNC croisées.** LMNP + para-hôtellerie + conciergerie enregistrée à ton nom, par exemple : les règles d'imputation des déficits et de cumul des régimes deviennent complexes.
- **Tu as déjà reçu un courrier de l'administration.** Toute demande de justificatif, mise en demeure ou proposition de rectification doit être traitée avec un professionnel, jamais seul avec un outil de déclaration standard.
- **Tu n'es simplement pas à l'aise.** Si après cette formation tu sens que tu n'es pas serein à l'idée d'assumer seul la responsabilité de ta déclaration, c'est un signal suffisant en soi. La sérénité a un prix, et ce n'est pas un mauvais calcul de le payer.

## Le vrai calcul à faire

Compare toujours :

- Le coût d'un expert-comptable spécialisé LMNP (environ 500€ à 1 200€/an selon la complexité)
- Le coût d'un outil comme décla.fr (autour de 220-250€/an en 2026)
- Le risque financier d'une erreur dans ta situation spécifique (majoration, intérêts de retard, ou pire, un redressement sur une plus-value mal anticipée)

Pour une situation simple, l'écart de prix entre les deux options est souvent largement compensé par la tranquillité : mais pour une situation complexe, l'écart de prix devient dérisoire face au risque.

## Pour aller plus loin

Cette formation t'a donné le cadre. Pour la mise en musique concrète dans ta situation (choix définitif de régime, stratégie de revente, structuration patrimoniale), rien ne remplace un échange avec un professionnel qui voit l'ensemble de ton patrimoine : pas seulement ta LCD.

**Exercice pratique :** Relis la liste des signaux d'alerte. Si tu n'en coches aucun, tu es probablement dans une situation adaptée à un outil comme décla.fr, en gardant les bons réflexes vus dans cette formation. Si tu en coches un seul, prends au moins un premier avis auprès d'un expert-comptable spécialisé LMNP avant de basculer définitivement au régime réel seul.`,
        },
      ],
    },
  ],
}
