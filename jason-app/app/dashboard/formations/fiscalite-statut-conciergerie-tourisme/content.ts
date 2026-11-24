export const FISCALITE_CONCIERGERIE_FORMATION = {
  slug: 'fiscalite-statut-conciergerie-tourisme',
  title: 'Fiscalité et meilleur statut pour une conciergerie',
  description: `BIC ou BNC, micro ou réel, EURL ou SASU : tout ce qu'un gérant de conciergerie doit savoir pour choisir le bon statut, payer le bon impôt, déduire les bonnes charges, et ne pas laisser d'argent sur la table.`,
  duration: '2h30',
  level: 'Intermédiaire',
  objectifs: [
    `Comprendre pourquoi la conciergerie relève des BIC (et pas des BNC)`,
    'Maîtriser les seuils TVA 2025-2026 et savoir quand facturer la TVA',
    'Comparer micro-BIC, EI réel, EURL et SASU avec de vrais chiffres',
    'Calculer le vrai coût des cotisations sociales selon chaque statut',
    'Choisir entre IS et IR selon ton niveau de bénéfices',
    'Identifier toutes les charges déductibles spécifiques à la conciergerie',
    'Anticiper les impacts de la loi Le Meur sur ton activité',
  ],
  modules: [
    {
      id: 1,
      title: 'La nature fiscale de la conciergerie',
      duration: '30 min',
      lessons: [
        {
          id: 1,
          title: 'BIC ou BNC ? La réalité fiscale d\'une conciergerie',
          duration: '15 min',
          content: `:::bref
- Une conciergerie de tourisme relève des bénéfices industriels et commerciaux (BIC), article 34 du CGI.
- Ce n'est pas une profession libérale, donc pas des BNC.
- Le code APE est attribué par l'Insee à la création.
:::

## La réponse directe : BIC

Une conciergerie de tourisme relève des **Bénéfices Industriels et Commerciaux (BIC)**, conformément à l'**article 34 du CGI**.

### Pourquoi BIC et pas BNC ?

- La conciergerie vend des **prestations de services** à caractère commercial.
- Elle ne requiert **pas de qualification intellectuelle réglementée**.
- Elle n'est pas une **profession libérale**.

### Ce qui distingue BIC et BNC

- **BIC** → activité commerciale, artisanale, industrielle
- **BNC** → professions libérales *(médecin, avocat, expert-comptable)*

> **Une conciergerie = BIC. Sans exception.**

:::erreur
Se déclarer en BNC parce que la conciergerie « vend du service ». L'administration la classe en BIC : un mauvais choix fausse ton abattement et tes cotisations.
:::

## Les codes APE/NAF de la conciergerie

Lors de ta création d'activité, l'INSEE t'attribue un **code APE**. Pour une conciergerie :

### 9609Z, Autres services personnels

- Le **plus courant** pour une conciergerie multi-services.
- Ménage, check-in/out, coordination logistique.

### 7990Z, Autres services de réservation

- Pour les conciergeries orientées **gestion d'expériences**.
- Réservations, activités touristiques.

### 8299Z, Activités de soutien aux entreprises

- Pour les conciergeries **B2B** ou corporate.

> Attention : le code APE n'a **pas d'impact fiscal direct**, mais il conditionne certaines **aides** et certaines **conventions collectives**.

> La nouvelle nomenclature **NAF 2025** entrera en vigueur au 1er janvier **2027**.

## Ce que ça change concrètement pour toi

La conciergerie facture **ses services** aux propriétaires. *Ce ne sont pas des revenus locatifs.*

- Tu n'es **pas soumis** aux règles des LMNP.
- Tu n'es **pas concerné** par les abattements des locations meublées (50 % en meublé classé, 30 % en non classé).
- Tu n'es **pas impacté** par la baisse d'abattement micro-BIC pour les meublés non classés *(30 %)*.

> Ces règles concernent les **propriétaires**. Toi tu es un **prestataire de service**.

### Tes paramètres micro-BIC

- **Abattement micro-BIC :** 50 % *(services BIC)*
- **Plafond micro :** 77 700 € en 2025, **83 600 €** en 2026-2028

> C'est un **avantage** par rapport aux propriétaires qui voient leur abattement baisser à 30 %.

## Résumé

| Critère | Propriétaire LCD | Conciergerie |
|---|---|---|
| **Catégorie** | BIC *(loyers)* | BIC *(services)* |
| **Abattement micro 2026** | 30 % *(non classé)* / 50 % *(classé)* | **50 %** |
| **Plafond micro 2026** | 15 000 € / 83 600 € | **83 600 €** |
| **Impacté loi Le Meur fiscalement** | Oui | **Non directement** |

:::retenir
Conciergerie = BIC, que tu sois en micro-entreprise ou en société. Le code APE choisi à l'immatriculation décrit ton activité, il ne change pas cette règle.
:::

## Exercice pratique

> Va sur ton **avis URSSAF** ou ton **extrait Kbis** et vérifie ton **code APE**.

S'il n'est pas adapté à ton activité réelle de conciergerie, tu peux demander sa modification via le **guichet unique** *(inpi.fr)*.

> Un mauvais code APE peut te priver **d'aides sectorielles**.

:::quiz
? Dans quelle catégorie fiscale entre une conciergerie ?
- Les BNC
- Les revenus fonciers
* Les BIC
= Elle vend des prestations commerciales sans qualification réglementée.
:::

:::quiz
? Qui attribue le code APE ?
* L'Insee, à la création de l'activité
- Airbnb
- Le propriétaire
= Il décrit ton activité principale.
:::`,
        },
        {
          id: 2,
          title: 'TVA conciergerie, taux, seuils et obligations 2025-2026',
          duration: '15 min',
          content: `:::bref
- Les services d'une conciergerie au propriétaire sont soumis à la TVA à 20 %.
- Sous le seuil de franchise (37 500 € en 2025 pour les services), tu ne factures pas de TVA.
- Une fois assujetti : facturer, déclarer et reverser la TVA, et récupérer celle de tes achats.
:::

## Le taux applicable : 20 %

Les prestations d'une conciergerie sont soumises au **taux normal de TVA : 20 %**.

### Pourquoi 20 % et pas 10 % ?

- Le taux de **10 %** s'applique aux services **para-hôteliers** rendus **directement aux voyageurs** *(petit-déjeuner, nettoyage régulier, réception…)*.
- La conciergerie facture ses services **au propriétaire** = prestations de services commerciaux = **20 %**.

> **Attention à la confusion fréquente.** Si tu fournis **toi-même** des services para-hôteliers directement aux voyageurs *(dans le cadre d'un contrat de sous-location ou colocation touristique)*, le taux de **10 %** peut s'appliquer. Dans ce cas spécifique, consulte un expert-comptable.

*Source : BOFiP mise à jour 26/03/2025*

## Les seuils de franchise en base TVA *(2025)*

Tant que ton CA reste sous ces seuils, tu **n'es pas obligé** de facturer la TVA :

| Seuil | Montant |
|---|---|
| **Seuil principal** | 37 500 € de CA HT/an |
| **Seuil de tolérance** | 41 250 € |

### Règles selon ton CA

- **En dessous de 37 500 €** → franchise en base. Tu mentionnes *« TVA non applicable - art. 293 B du CGI »*.
- **Entre 37 500 € et 41 250 €** → franchise maintenue si c'est un **premier dépassement**.
- **Au-dessus de 41 250 €** → TVA obligatoire dès le **1er jour du mois de dépassement**.

:::exemple
Chiffre d'affaires de 32 000 € : tu restes en franchise, tu factures sans TVA.
Chiffre d'affaires de 45 000 € : seuil de 37 500 € dépassé, tu factures 20 % de TVA en plus de tes honoraires à partir de la date prévue par la règle de dépassement.
:::

### Réforme TVA à 25 000 € : SUSPENDUE

> L'article 32 de la LFI 2025 prévoyait d'abaisser le seuil à 25 000 € au 1er mars 2025. **Cette réforme a été officiellement suspendue le 30 avril 2025** par le Ministère de l'Économie.

*Les seuils actuels (37 500 €) restent valables : la loi de finances pour 2026 ne les a pas modifiés.*

> Source : CCI Lyon Métropole, « Micro-entreprises : le projet de loi de finances 2026 relance la réforme du seuil de franchise » ; seuils de franchise inchangés en 2026

## Une fois assujetti à la TVA : tes obligations

### Facturer la TVA

- Tes factures aux propriétaires incluent **20 % de TVA**.
- **Mention obligatoire** : taux, montant HT, montant TVA, TTC.

### Déclarer et reverser la TVA

- **Déclaration CA3** mensuelle ou trimestrielle selon ton CA.
- Tu reverses la **TVA collectée** moins la **TVA déductible** sur tes achats professionnels.

### Récupérer la TVA sur tes achats

- Logiciels, téléphone pro, véhicule pro, fournitures…
- C'est un **avantage réel** : tu récupères la TVA sur toutes tes dépenses professionnelles.

## Franchise ou TVA : qu'est-ce qui est préférable ?

### Avec la franchise *(CA < 37 500 €)*

- ✓ Pas de paperasse TVA
- ✓ Prix compétitifs *(car pas de TVA en sus)*
- ✗ Pas de récupération de TVA sur tes achats

### Avec la TVA *(CA > 37 500 €)*

- ✓ Tu récupères la TVA sur **tous** tes achats pro
- ✓ Crédibilité auprès des propriétaires pro
- ✗ Obligations déclaratives supplémentaires
- ✗ Prix de 20 % plus élevés *(si clientèle non-assujettie)*

> Pour une conciergerie dont les propriétaires sont souvent **non-assujettis à la TVA**, la franchise est souvent préférable tant qu'elle s'applique.

:::astuce
Note ton chiffre d'affaires cumulé chaque mois dans un tableau. Tu verras venir le seuil de TVA des mois à l'avance, au lieu de le découvrir en fin d'année.
:::

## Exercice pratique

1. **Calcule ton CA HT** des 12 derniers mois.
2. Es-tu en **franchise** ?
3. Vas-tu **dépasser 37 500 €** cette année ?

> Si tu approches du seuil, **anticipe** avec ton comptable le passage à la TVA, la transition est à **planifier**, pas à subir.

:::quiz
? Quel taux de TVA sur les services facturés au propriétaire ?
- 5,5 %
* 20 %
- 10 %
= Ce sont des prestations de services commerciales au taux normal.
:::

:::quiz
? Sous le seuil de franchise, que se passe-t-il ?
- Tu factures 20 % quand même
- Tu paies une amende
* Tu ne factures pas de TVA
= La franchise en base dispense de facturer la TVA.
:::

:::action
titre: Note ton chiffre d'affaires de l'année
texte: Suis tes encaissements pour savoir quand tu approches du seuil de TVA.
lien: /dashboard/finances/encaissements
bouton: Voir mes encaissements
:::`,
        },
      ],
    },
    {
      id: 2,
      title: 'Choisir son statut, le comparatif complet',
      duration: '40 min',
      lessons: [
        {
          id: 11,
          title: 'Auto-entrepreneur / micro-BIC, pour qui, jusqu\'où ?',
          duration: '20 min',
          content: `:::bref
- En micro, l'administration applique un abattement forfaitaire de 50 % sur ton chiffre d'affaires de services.
- Plafond de 83 600 € pour 2026 à 2028 (77 700 € en 2025).
- Limites : pas de déduction des charges réelles, plafond bloquant.
:::

## Ce que le régime micro-BIC offre vraiment

Le micro-BIC est le **régime par défaut** quand tu crées en auto-entrepreneur.

### L'abattement forfaitaire

L'administration fiscale applique **automatiquement** un abattement de **50 %** sur ton CA. *Tu es imposé sur la moitié de ce que tu gagnes.*

> **Exemple :**
> - CA annuel : **60 000 €**
> - Base imposable : 60 000 × 50 % = **30 000 €**
>
> *(sans avoir à justifier une seule facture)*

:::exemple
Chiffre d'affaires de 40 000 € en micro-BIC (prestations de services) : abattement de 50 %, soit 20 000 € de revenu imposable, quelles que soient tes vraies charges.
:::

### Les plafonds 2025-2026

- **2025** : **77 700 €** de CA annuel maximum
- **2026-2028** : **83 600 €** *(nouveaux seuils confirmés)*

> Si tu dépasses **2 années consécutives**, sortie automatique du micro, passage au **réel**.

## Les cotisations sociales en micro-BIC *(2025)*

En auto-entrepreneur, tu paies sur ton **CA**, pas sur ton **bénéfice** :

| Poste | Taux 2026 |
|---|---|
| **Cotisations sociales** *(services BIC)* | 21,2 % |
| **CFP** *(formation professionnelle)* | 0,1 à 0,3 % selon l'activité |
| **Total global** | **environ 21,5 % du CA** |

### ACRE *(1ère année)*

- Depuis le **1er juillet 2026**, l'ACRE réduit les cotisations de **25 %** (contre 50 % auparavant).
- Demande à faire à la création sur *net-entreprises.fr*.

### Évolution 2026

> Le taux des prestations de services **BIC reste à 21,2 %** en 2026. *La hausse d'un point au 1er janvier 2026 concerne les activités libérales (BNC), pas la conciergerie.*
>
> Source : economie.gouv.fr, « Micro-entreprises : quel est le montant de vos cotisations sociales ? » (mars 2026)

## Le versement libératoire de l'IR

Option disponible si ton **revenu fiscal de référence** de l'année N-2 est inférieur à **27 478 €** *(1 part, 2025)*.

### Avec le versement libératoire

- Tu paies l'impôt en même temps que les cotisations.
- **Taux fixe** : 1,7 % du CA pour les services BIC.
- Simple mais potentiellement **moins avantageux** si tu as peu d'autres revenus.

### Sans versement libératoire

- Bénéfice imposable *(CA × 50 %)* intégré dans la déclaration de revenus du foyer fiscal.
- **Barème progressif** : 0 %, 11 %, 30 %, 41 %, 45 %.

## Quand le micro-BIC est optimal

- ✓ **CA inférieur à 55 000 €/an**
- ✓ **Charges réelles inférieures à 50 % du CA** *(si charges > 50 %, le réel devient plus avantageux)*
- ✓ **Activité en démarrage** : tester sans formalisme
- ✓ **Pas de besoin de protection** du patrimoine *(pas de séparation biens pro/perso)*
- ✓ **Pas d'investissements lourds** à amortir

## Les limites à connaître

### Pas de déduction des charges réelles

Si tu achètes un véhicule, du matériel, tu sous-traites… *tu ne peux rien déduire individuellement.*

:::erreur
Rester en micro avec beaucoup de frais (véhicule, sous-traitance du ménage, logiciels). Si tes charges dépassent la moitié de ton chiffre d'affaires, le régime réel peut te faire payer moins.
:::

### Plafond bloquant

Si ton activité décolle à **90 000 €**, tu **dois** sortir du micro.

### Responsabilité personnelle

Ton patrimoine personnel n'est **pas séparé** de ton patrimoine professionnel *(sauf domicile principal)*.

### Retraite plus faible

Cotisations calculées sur le **CA**, pas sur le **bénéfice réel** → droits à la retraite proportionnellement plus bas.

## Exercice pratique

1. **Calcule tes charges professionnelles réelles** annuelles *(déplacements, logiciels, téléphone, sous-traitance ménage, assurance RC Pro…)*.
2. **Divise ce total par ton CA.**
3. Si le résultat **dépasse 50 %**, le régime réel te permettrait de payer **moins d'impôts**.

> Note ce ratio, il guidera ta décision de statut.

:::quiz
? 60 000 € de chiffre d'affaires en micro : quelle base imposable ?
- 60 000 €
- 18 000 €
* 30 000 €
= Abattement de 50 % : 60 000 × 50 % = 30 000 €.
:::

:::quiz
? Quelle est la limite principale du micro ?
- Tu dois avoir un associé
* Tu ne déduis pas tes charges réelles
- Tu ne peux pas avoir de clients
= Avec beaucoup de charges, le réel peut devenir plus avantageux.
:::`,
        },
        {
          id: 12,
          title: 'EI réel, EURL, SASU, quand franchir le cap ?',
          duration: '20 min',
          content: `:::bref
- Entreprise individuelle au réel : charges réelles déduites, patrimoine protégé depuis 2022.
- EURL : société simple pour un gérant seul.
- SASU : salaire minimal et dividendes, à étudier avec un comptable.
:::

## L'Entreprise Individuelle au régime réel *(EI réel)*

### Ce que c'est

Même statut solo qu'en micro, mais avec **déduction des charges réelles** au lieu de l'abattement forfaitaire.

### Quand c'est pertinent

- Tes **charges réelles dépassent 50 %** du CA.
- Tu as des **investissements à amortir**.
- Tu veux rester simple sans créer de société.

### Protection du patrimoine depuis 2022

> La réforme de 2022 a intégré l'EIRL dans l'EI. Ton patrimoine professionnel est **automatiquement séparé** de ton patrimoine personnel. *Avancée majeure.*

:::retenir
Depuis 2022, l'entrepreneur individuel a un patrimoine professionnel séparé de son patrimoine personnel par défaut : la société n'est plus le seul moyen de protéger ta maison.
:::

### Cotisations sociales *(TNS)*

- **~40 à 45 %** de ta rémunération nette.
- Cotisations **minimales** : ~1 200 €/an *(même sans revenu)*.

## L'EURL, La société unipersonnelle classique

### Ce que c'est

Une **SARL à associé unique**. Tu es gérant majoritaire = **TNS**.

### Avantages

- ✓ **Séparation complète** patrimoine pro/perso
- ✓ Déduction de **toutes** les charges
- ✓ **Option IS** possible *(voir module 3)*
- ✓ Structure **crédible** pour les propriétaires professionnels

### Cotisations

- **TNS** : ~40-45 % de ta rémunération nette
- Cotisations sur **dividendes** au-delà de 10 % du capital social
- Cotisations **minimales** : ~1 200 €/an

### Coûts de création et gestion

- **Création** : 500 à 1 500 €
- **Expert-comptable** : 800 à 1 500 €/an *(quasi-obligatoire)*

> **Recommandé pour : CA 60 000, 100 000 €/an.**

## La SASU, La société par actions simplifiée unipersonnelle

### Ce que c'est

Une **SAS à associé unique**. Tu es président = **assimilé salarié**.

### L'avantage clé : les dividendes sans charges sociales

- Les dividendes versés par une SASU **ne supportent pas** de cotisations sociales.
- Seule la **flat tax de 31,4 %** s'applique *(12,8 % IR + 18,6 % prélèvements sociaux, sur les dividendes versés depuis 2026)*.

> Optimisation **puissante** quand les bénéfices sont élevés.

### Cotisations si tu te verses un salaire

- **Charges patronales** : ~54 % du salaire brut
- **Charges salariales** : ~28 % du salaire brut
- **Total** : environ 82 % du salaire net

> **MAIS :** si tu ne te verses pas de salaire = **0 €** de cotisations.

### La stratégie SASU

> **Salaire minimal** pour les droits sociaux de base **+ dividendes** pour le reste = optimisation maximale.

**Recommandé pour : CA > 100 000 € avec bons bénéfices.**

## Le tableau de décision rapide

| Profil | Statut recommandé |
|---|---|
| Débute, CA < 30 000 € | **Auto-entrepreneur / micro-BIC** |
| Activité établie, charges < 50 % CA | **Micro-BIC** maintenu |
| Charges > 50 % CA, CA < 83 600 € | **EI au réel** |
| CA 60 000, 100 000 €, croissance | **EURL / IS** |
| CA > 100 000 €, bénéfices solides | **SASU / IS** |
| S'associer prévu | **SAS** *(pluripersonnel)* |

:::exemple
**Début d'activité, 25 000 € de CA :** micro-entreprise, simple et peu coûteuse.
**80 000 € de CA avec un salarié en vue :** une société (EURL ou SASU) se discute avec un expert-comptable.
:::

## Les coûts comparés sur 1 an

| Statut | Création | Gestion annuelle |
|---|---|---|
| **Auto-entrepreneur** | Gratuit | ~0 € *(déclarations en ligne)* |
| **EI au réel** | Gratuit | ~500-800 € *(comptable)* |
| **EURL** | 500-1 500 € | 1 200-2 000 € *(comptable)* |
| **SASU** | 500-1 500 € | 1 500-2 500 € *(comptable)* |

> La différence de coût se justifie **rapidement** dès que l'optimisation fiscale dépasse ces montants.

## Exercice pratique

1. **Situe-toi** dans le tableau de décision.
2. Quel est ton CA actuel ou projeté à **12 mois** ?
3. Quelles sont tes **charges réelles** ?
4. Le statut actuel est-il encore **optimal** ?

> Si tu identifies un écart, note les **2 prochaines étapes concrètes** *(ex : « consulter un expert-comptable » + « simuler EURL vs micro »)*.

:::quiz
? Quand le régime réel devient-il intéressant ?
* Quand tes charges dépassent 50 % de ton chiffre d'affaires
- Dès le premier euro
- Jamais
= L'abattement forfaitaire du micro devient alors moins avantageux.
:::

:::quiz
? Que protège l'entreprise individuelle depuis 2022 ?
* Ton patrimoine personnel, séparé du patrimoine professionnel
- Rien
- Tes clients
= La réforme a intégré la protection de l'ancienne EIRL.
:::

:::action
titre: Calcule ton ratio charges sur chiffre d'affaires
texte: Ajoute tes charges et recettes dans ton journal pour voir si le réel te serait plus favorable.
lien: /dashboard/finances/journal
bouton: Ouvrir mon journal
:::`,
        },
      ],
    },
    {
      id: 3,
      title: 'Cotisations sociales et imposition',
      duration: '40 min',
      lessons: [
        {
          id: 21,
          title: 'Cotisations TNS vs assimilé salarié, le vrai coût',
          duration: '20 min',
          content: `:::bref
- En travailleur non salarié (EI, EURL), les cotisations tournent autour de 40 à 45 % de la rémunération.
- Des cotisations minimales restent dues, environ 1 200 € par an.
- En SASU, salaire minimal et dividendes sont une stratégie courante.
:::

## Le régime TNS *(Travailleur Non Salarié)*

> **Concerne** : EI réel, EURL *(gérant majoritaire)*.

Les cotisations TNS sont calculées sur la **rémunération nette** *(après charges mais avant IR)*.

| Poste | Taux approximatif |
|---|---|
| Maladie-maternité | 6,5, 8,5 % |
| Retraite de base | 17,75 % |
| Retraite complémentaire | 7 % |
| Invalidité-décès | 1,3 % |
| Allocations familiales | 0, 3,1 % |
| CSG/CRDS | 9,7 % |
| **TOTAL** | **~40 à 45 %** |

> **Cotisations minimales : ~1 200 €/an.** Même si tu ne te verses aucune rémunération, ces cotisations minimales sont dues.

## Le régime assimilé salarié *(SASU)*

> **Concerne** : SASU *(président)*.

Les cotisations sont calculées sur le **salaire brut**.

| Poste | Taux |
|---|---|
| Charges patronales | ~54 % du net |
| Charges salariales | ~28 % du net |
| **Total global** | **~82 % du net** |

> **Exemple :** pour te verser **3 000 €** net/mois, la SASU paie **~5 460 €** *(salaire + charges)*.

> **Mais si tu te verses 0 € de salaire : 0 € de charges.** C'est là que la SASU devient intéressante pour les conciergeries très rentables.

## La stratégie salaire + dividendes SASU

Si la SASU génère **80 000 € de bénéfice** :

### Option 1 à éviter : tout en salaire

- Charges sociales très élevées.
- Non rentable au-delà d'un certain seuil.

### Option 2 conseillée : salaire minimal et dividendes

- **Salaire** : 1 500 €/mois brut *(sécurité sociale de base)*.
- **Dividendes** : reste des bénéfices après IS.
- Dividendes SASU : **flat tax 31,4 %** seulement.
- **Pas de cotisations sociales** sur les dividendes.

### Exemple concret *(bénéfice IS 60 000 €)*

| Étape | Montant |
|---|---|
| IS 15 % sur 42 500 € | 6 375 € |
| IS 25 % sur 17 500 € | 4 375 € |
| **Total IS** | **10 750 €** |
| Bénéfice net après IS | 49 250 € |
| Flat tax 31,4 % sur dividendes | 15 465 € |
| **Net en poche** | **33 785 €** |

## Comparatif TNS vs assimilé salarié

| Critère | TNS *(EURL)* | Assimilé salarié *(SASU)* |
|---|---|---|
| **Cotisations** | 40-45 % du net | 82 % du net *(si salaire)* |
| **Protection chômage** | Non | Non *(président)* |
| **Retraite** | Moins bonne | Meilleure si salaire élevé |
| **Dividendes** | Cotisés si > 10 % capital | Non cotisés |
| **Zéro cotisation possible** | Non *(min. 1 200 €/an)* | **Oui** |
| **Conseil si bénéfices élevés** | Non | **Oui** |

:::retenir
TNS : cotisations moins chères, protection sociale plus faible. Assimilé salarié : cotisations plus chères, protection proche d'un salarié (sauf le chômage). Le bon choix dépend de ce que tu veux protéger.
:::

## Exercice pratique

1. **Estime ta rémunération nette** souhaitée pour l'année.
2. **Multiplie** par 40 % pour le coût TNS, ou par 82 % pour le coût SASU-salaire.
3. **Compare** les deux scénarios.

> Si tes bénéfices dépassent largement ta rémunération désirée, le modèle **SASU avec dividendes** devient souvent gagnant.

:::quiz
? Que se passe-t-il si tu ne te verses rien en EURL ?
* Des cotisations minimales restent dues
- Tu ne paies rien
- Tu perds ton entreprise
= Environ 1 200 € par an selon le contenu de cette leçon.
:::

:::quiz
? Quelle stratégie est souvent conseillée en SASU ?
- Tout en salaire
- Aucune rémunération
* Un salaire minimal et des dividendes
= Elle optimise les cotisations, à valider avec un expert-comptable.
:::`,
        },
        {
          id: 22,
          title: "IS ou IR, choisir son régime d'imposition",
          duration: '20 min',
          content: `:::bref
- Par défaut, l'impôt sur le revenu s'applique au barème progressif.
- Avec l'impôt sur les sociétés : 15 % jusqu'à 42 500 € de bénéfice, puis 25 %.
- Le choix dépend de tes autres revenus et de ce que tu laisses dans la société.
:::

## L'Impôt sur le Revenu *(IR)*, le régime par défaut

> **Applicable en** : micro-BIC, EI réel, EURL sans option IS.

### Le barème progressif 2026 *(revenus 2025)*

| Tranche (par part) | Taux |
|---|---|
| Jusqu'à 11 600 € | 0 % |
| De 11 601 à 29 579 € | 11 % |
| De 29 580 à 84 577 € | 30 % |
| De 84 578 à 181 917 € | 41 % |
| Au-delà de 181 917 € | 45 % |

> Source : loi de finances pour 2026 (loi n° 2026-103 du 19 février 2026), tranches revalorisées de 0,9 %

> Les bénéfices de ton entreprise **s'ajoutent** à tes autres revenus du foyer fiscal.

### Avantages IR

- Déficits **imputables** sur le revenu global.
- Simple, **pas de double imposition**.

### Inconvénients IR

- Taux marginal monte vite dès **29 580 €** *(barème 2026)*.
- Impôt payé **même si tu réinvestis** dans la société.

## L'Impôt sur les Sociétés *(IS)*, l'option société

> **Applicable en** : EURL avec option IS, SASU *(automatique)*.

### Les taux 2025

- **15 %** sur les premiers 42 500 € de bénéfice
- **25 %** au-delà

> La loi de finances pour 2026 (19 février 2026) a **maintenu** le taux réduit de 15 % jusqu'à **42 500 €** de bénéfice *(CGI, art. 219-I-b)*.

### Avantages IS

- Taux **faibles** sur les premiers 42 500 €.
- Dividendes SASU : **flat tax 31,4 %** *(pas de charges sociales)*.
- Possibilité de **conserver des bénéfices** en société sans les distribuer *(renforcement des capitaux propres)*.

### Inconvénients IS

- **Double imposition** si tout est distribué *(IS + flat tax)*.
- Formalisme comptable renforcé.
- Moins avantageux si tu distribues l'intégralité du bénéfice.

:::chiffres
15 % | IS jusqu'à 42 500 € de bénéfice (taux réduit, sous conditions)
25 % | IS au-delà
:::

## Comparatif chiffré, bénéfice 60 000 €

### Scénario 1, EURL à l'IR *(célibataire sans autre revenu)*

| Étape | Montant |
|---|---|
| Bénéfice net | 60 000 € |
| Cotisations TNS *(~43 %)* | 25 800 € |
| Revenu imposable | 34 200 € |
| IR barème | ~5 000 € |
| **Charge totale** | **~30 800 €** |
| **Net en poche** | **~29 200 €** |

### Scénario 2, SASU à l'IS *(salaire 18 000 € net + dividendes)*

| Étape | Montant |
|---|---|
| Bénéfice avant IS | 60 000 € |
| Salaire chargé *(18 000 € net)* | ~32 760 € |
| Bénéfice IS après salaire | 27 240 € |
| IS 15 % | 4 086 € |
| Bénéfice distribuable | 23 154 € |
| Flat tax 31,4 % | 7 270 € |
| **Net total en poche** *(18 000 € + 15 884 €)* | **33 884 €** |

> La SASU/IS est **gagnante** ici grâce au taux IS 15 % et à la flat tax 31,4 %.

## Quand choisir IS vs IR

### Choisir IR si

- Bénéfices **inférieurs à 30 000 €/an**.
- Tu as des **déficits à imputer** sur le revenu global.
- Tu veux la **simplicité maximale**.

### Choisir IS si

- Bénéfices dépassent **40 000 €/an** régulièrement.
- Tu veux **conserver des bénéfices** en société.
- Tu utilises la stratégie **SASU + dividendes**.
- Ton **taux marginal IR dépasse 30 %**.

:::astuce
Si tu laisses une partie du bénéfice dans la société pour investir, l'IS est souvent intéressant. Si tu prends tout pour vivre, compare les deux avec un professionnel.
:::

## Exercice pratique

1. **Prends ton dernier bénéfice annuel** *(ou estimation à 12 mois)*.
2. **Calcule l'impôt dû en IR** avec le barème progressif.
3. **Simule le même montant en IS** *(15 % jusqu'à 42 500 €, 25 % au-delà)*.

> La différence te donne l'**économie annuelle potentielle** de l'option IS.

:::quiz
? Quel taux réduit d'impôt sur les sociétés s'applique aux premiers bénéfices ?
* 15 % jusqu'à 42 500 €
- 5 % sur tout
- 45 % dès le premier euro
= Au-delà, le taux normal de 25 % s'applique.
:::

:::quiz
? Quand l'impôt sur le revenu est-il souvent préférable ?
- Jamais
* Avec un bénéfice modeste et peu d'autres revenus
- Avec un très gros bénéfice
= Le barème progressif reste léger sur les premières tranches.
:::

:::action
titre: Prépare tes questions pour un expert-comptable
texte: Note ton chiffre d'affaires, tes charges et ton projet pour choisir le bon régime.
lien: /dashboard/finances/fiscalite
bouton: Ouvrir la fiscalité
:::`,
        },
      ],
    },
    {
      id: 4,
      title: 'Optimiser ses charges et ses obligations',
      duration: '30 min',
      lessons: [
        {
          id: 31,
          title: "Toutes les charges déductibles d'une conciergerie",
          duration: '15 min',
          content: `:::bref
- En micro, aucune charge ne se déduit : l'abattement de 50 % les remplace.
- Au réel : déplacements, logiciels, téléphone, assurances, sous-traitance, linge.
- Garde tous tes justificatifs.
:::

## Principe : charges réelles vs abattement micro

### En micro-BIC

Tu ne déduis **rien individuellement**. L'administration applique **50 % forfaitaire**. *Pratique, mais potentiellement sous-optimal.*

### En régime réel *(EI/EURL/SASU)*

Tu déduis **toutes** tes charges professionnelles réelles.

> Si tes charges dépassent **50 % du CA** → le réel est **gagnant**.

## Liste complète des charges déductibles

### Déplacements professionnels

- **Carburant, péages** *(justifiés par un journal de bord)*
- **Indemnités kilométriques** *(barème 2025 : 0,529 €/km jusqu'à 5 000 km)*
- Transports en commun, parking pro
- **Véhicule** : amortissement ou location si usage professionnel

### Logiciels et outils

- **PMS** *(Lodgify, Smoobu, Hostify, Guesty…)*
- **Channel manager** *(Rentals United, Beds24…)*
- **Logiciels comptabilité** *(Pennylane, Indy, QuickBooks…)*
- Suite bureautique, outils de communication *(Notion, Slack…)*

### Téléphonie et internet

- **Forfait téléphone** professionnel *(ou quote-part si usage mixte)*
- **Abonnement internet** bureau ou co-working
- **Équipements amortissables** : téléphone, ordinateur, tablette *(sur 3 à 5 ans selon usage)*

### Assurances

- **RC Professionnelle** *(fortement recommandée)*
- **Multirisque** local professionnel
- **Protection juridique**

### Sous-traitance

- Équipes **ménage** *(factures ou contrats CESU)*
- Prestataires de **maintenance** et petits travaux
- Auto-entrepreneurs sous-traitants
- Photographes, community managers, assistants

### Frais bancaires et financiers

- **Frais de compte** bancaire professionnel
- **Commissions des plateformes** *(Airbnb, Booking…)* si refacturées HT
- **Intérêts d'emprunt** professionnel

### Frais de bureau

- **Loyer bureau** ou espace de co-working
- **Quote-part du domicile** *(surface dédiée × loyer ou valeur locative)*
- Fournitures de bureau

### Formation et documentation

- **Cette formation** et toutes formations professionnelles
- Livres, abonnements spécialisés *(presse professionnelle)*
- Salons professionnels, congrès

### Linge et consommables

- Si tu achètes et fournis linge aux logements *(serviettes, draps, produits d'accueil)* : **100 % déductible**.
- **Consommables de ménage** achetés pour les logements.

### Équipements spécifiques

- **Serrures connectées**, boîtiers à clé, interphones.
- Déductibles ou **amortissables** selon valeur unitaire *(seuil d'immobilisation : 500 € HT)*.

## La règle d'or des charges déductibles

Pour être déductible, une charge doit être :

1. **Exposée dans l'intérêt** de l'entreprise.
2. **Justifiée** par une facture ou pièce comptable.
3. **Comptabilisée** dans l'exercice correspondant.

### Bonnes pratiques

- **Garde toutes tes factures** *(délai légal : 10 ans)*.
- **Utilise un compte bancaire pro** distinct dès le départ.
- **Ne mélange jamais** dépenses perso et pro.

:::exemple
Logiciel de gestion à 40 € par mois : 480 € par an déductibles au réel, avec la facture. Le même logiciel sans facture : rien à déduire en cas de contrôle.
:::

:::astuce
Un compte bancaire dédié à la conciergerie, et chaque facture photographiée le jour même. Ta comptabilité se fait presque toute seule.
:::

## Exercice pratique

1. **Liste tes 5 principales dépenses** professionnelles des 3 derniers mois.
2. **Vérifie** si chacune est justifiée par facture.
3. **Calcule leur total annuel projeté.**

> Si ce total dépasse **50 % de ton CA**, le passage au régime réel te permettrait de payer **moins**, note-le comme priorité.

:::quiz
? Au réel, quelle dépense est déductible ?
- Tes courses de la semaine
* Ton logiciel de gestion des réservations
- Tes vacances personnelles
= Seules les dépenses liées à l'activité sont déductibles.
:::

:::quiz
? Quelle est la règle d'or des charges déductibles ?
* Une dépense professionnelle, justifiée par une facture
- Toute dépense, même sans facture
- Uniquement le loyer
= Sans justificatif, la charge peut être rejetée en cas de contrôle.
:::`,
        },
        {
          id: 32,
          title: 'CFE, provisions fiscales et agenda fiscal',
          duration: '15 min',
          content: `:::bref
- La CFE est due par toute entreprise, exonérée la première année.
- L'échéance principale est le 15 décembre.
- Mets de côté chaque mois tes impôts et cotisations.
:::

## La Cotisation Foncière des Entreprises *(CFE)*

La CFE est un impôt local dû par toute entreprise disposant d'un lieu d'activité **fixe** en France.

### Montant

- **200 à 2 000 €/an** selon la commune et le CA.
- Calculé sur la **valeur locative** du local professionnel.
- Les communes fixent une **base minimum**.

### Exonérations

- **1ère année d'activité** : totalement exonéré.
- CA < 5 000 €/an : exonéré.
- Zones **ZFU, ZRR, BUD** : exonérations partielles possibles.

:::astuce
La première année d'activité, la CFE n'est pas due : note la date d'immatriculation pour savoir quand arrivera le premier avis.
:::

### Où et quand la payer

- **Avis d'imposition** sur *impots.gouv.fr* *(espace pro)*.
- **Échéance principale** : 15 décembre de chaque année.
- **Mensualisation possible** *(option à activer en janvier)*.

> Attention : si tu travailles depuis ton **domicile** sans local commercial distinct, la CFE est calculée sur la **base minimum** de ta commune. Anticipe ce montant dès la 2ème année d'activité.

## Provisions fiscales mensuelles, une habitude de gérant

> Ne pas provisionner ses impôts = **mauvaise surprise** en fin d'année.

### En micro-BIC

- **Mets de côté 25-30 %** de chaque encaissement.
- Couvre : cotisations URSSAF *(~22 %)* + IR estimé *(~5-8 %)*.

### En EI réel / EURL IS

- **Provisionne chaque mois** : IS estimé + CFE/12.
- Utilise un **compte épargne pro dédié** *(Livret pro ou compte à terme)*.

### En SASU IS

- **Acomptes IS trimestriels** : 4 versements *(mars, juin, sept, déc)*.
- Base de calcul : bénéfice N-1 × taux IS applicable.

> La trésorerie IS reste en **société**, ne la confonds pas avec tes liquidités.

:::exemple
Tu encaisses 4 000 € d'honoraires ce mois-ci. Mets tout de suite de côté la part estimée des cotisations et de l'impôt sur un compte à part : tu ne la dépenses pas, et l'échéance n'est plus une mauvaise surprise.
:::

## Agenda fiscal annuel d'une conciergerie

| Période | Action |
|---|---|
| **Janvier** | Clôture comptable N-1 avec le comptable. Préparation de la liasse fiscale. |
| **Mars** | 1er acompte IS *(si SASU/EURL IS)*. |
| **Avril, Mai** | Déclaration annuelle de revenus *(formulaire 2042)*. Auto-entrepreneur : déclaration CA. |
| **Juin** | 2ème acompte IS. |
| **Septembre** | 3ème acompte IS. |
| **Décembre** | 4ème acompte IS. **CFE à payer avant le 15 décembre.** |

### En continu

- **TVA** : mensuelle ou trimestrielle si assujetti *(CA3)*.
- **URSSAF auto-entrepreneur** : mensuelle ou trimestrielle.

## Les outils recommandés

- **Indy**, comptabilité automatisée pour indépendants
- **Pennylane**, idéal EURL/SASU avec un expert-comptable
- **Impots.gouv.fr**, agenda fiscal personnalisé dans l'espace pro
- **Net-entreprises.fr**, cotisations et déclarations URSSAF

## Exercice pratique

1. **Ouvre ton application bancaire** et crée un virement automatique mensuel vers un **compte épargne pro**.
2. **Montant** :
   - **Micro-BIC** → 28 % de ton CA mensuel moyen
   - **Société IS** → IS annuel estimé / 12

> Cette seule habitude évite **l'essentiel des surprises** de trésorerie en fin d'exercice.

:::quiz
? Quand la CFE est-elle exonérée ?
- Toujours
- Jamais
* La première année d'activité
= Elle devient due à partir de la deuxième année.
:::

:::quiz
? Pourquoi provisionner chaque mois ?
- Pour dépenser plus
- C'est obligatoire légalement
* Pour ne pas être surpris par les impôts et cotisations à payer
= Une réserve mensuelle évite les difficultés de trésorerie.
:::

:::action
titre: Ajoute la CFE à ton calendrier
texte: Note l'échéance du 15 décembre et ta provision mensuelle.
lien: /dashboard/calendrier
bouton: Ouvrir mon calendrier
:::`,
        },
      ],
    },
    {
      id: 5,
      title: "Loi Le Meur, récapitulatif et plan d'action",
      duration: '30 min',
      lessons: [
        {
          id: 41,
          title: 'La loi Le Meur, ce qui change pour les conciergeries',
          duration: '15 min',
          content: `:::bref
- La loi Le Meur (19 novembre 2024) vise surtout les propriétaires, mais touche les conciergeries.
- Vérifie le numéro d'enregistrement de chaque logement géré.
- DPE, plafond de jours et pouvoirs des communes changent le conseil que tu donnes.
:::

## La loi Le Meur en bref

Promulguée le **19 novembre 2024** *(n° 2024-1039)*, la loi Le Meur **encadre davantage** les locations de courte durée en France.

> Elle vise principalement les **propriétaires**, mais les **conciergeries** sont indirectement impactées.

## Mesure 1, Numéro d'enregistrement obligatoire

### Pour les propriétaires

Toute location de courte durée devra être enregistrée auprès de la **commune**.

> **Date d'entrée en vigueur : 20 mai 2026.**

### Impact conciergerie

- **Vérifie** que chaque logement géré dispose de son numéro d'enregistrement avant cette date.
- **Sans numéro** = risque de suspension sur Airbnb/Booking.
- **Anticipe** dès maintenant avec tes propriétaires clients.
- Certaines communes déploient **déjà** le dispositif.

:::astuce
Ajoute à ta liste d'accueil de chaque nouveau propriétaire : numéro d'enregistrement, DPE, accord de copropriété. Tu évites de gérer un logement qui ne peut pas légalement être loué.
:::

## Mesure 2, DPE progressif obligatoire

### Pour les propriétaires

| Classe DPE | Interdit en LCD dès |
|---|---|
| **G** | 2025 *(certaines zones)* |
| **F** | 2028 |
| **E** | 2034 |

### Impact conciergerie

- **Audite le DPE** de ton portefeuille maintenant.
- Les logements **G et F** vont sortir du marché progressivement.
- **Opportunité** : accompagner tes propriétaires dans la rénovation ou la transition vers d'autres usages.

## Mesure 3, Limitation à 90 jours *(résidences principales)*

### Pour les propriétaires

La location d'une **résidence principale** reste limitée à **90 nuits/an** *(règle renforcée)*.

### Impact conciergerie

- Peu d'impact si tu gères des **résidences secondaires**.
- Si ton portefeuille inclut des **RP** : surveille le compteur ou réoriente vers des résidences secondaires.

## Mesure 4, Pouvoirs renforcés des communes

Les communes peuvent désormais :

- **Fixer des quotas** de LCD sur leur territoire.
- **Créer des zones** à accès restreint.
- **Exiger des études d'impact** avant toute autorisation.

### Impact conciergerie

- **Surveille les délibérations** municipales de tes communes d'intervention.
- La **diversification géographique** protège contre les restrictions locales.

## Ce que la loi Le Meur NE change PAS fiscalement

- ✓ Ton **abattement micro-BIC** reste à 50 %.
- ✓ Ton **plafond micro** reste à 83 600 € pour les services *(seuil fixé pour 2026 à 2028)*.
- ✓ Tes **cotisations TNS** ne changent pas.
- ✓ Ton **régime IS/IR** n'est pas modifié.

> La loi Le Meur est une loi d'**urbanisme et de régulation**. Elle ne modifie **pas** la fiscalité des prestataires de services.

:::retenir
La loi Le Meur change surtout la fiscalité des propriétaires (abattements, plafonds). Ta conciergerie reste imposée sur ses honoraires, en BIC.
:::

## Exercice pratique

1. **Dresse la liste** de tes logements gérés avec leur classe DPE et leur statut *(résidence principale ou secondaire)*.
2. Pour chaque logement **G ou F**, contacte le propriétaire pour anticiper la trajectoire.
3. **Combien de logements** risquent d'être impactés avant 2028 ?

> C'est ton **risque portefeuille** à gérer dès maintenant.

:::quiz
? Que vérifier pour chaque logement que tu gères ?
- Le nombre de tableaux
* Qu'il a son numéro d'enregistrement
- La couleur des murs
= Sans numéro, l'annonce peut être suspendue.
:::

:::quiz
? Qui la loi Le Meur vise-t-elle principalement ?
- Les voyageurs
- Les plateformes uniquement
* Les propriétaires
= Les conciergeries sont touchées indirectement à travers leurs clients.
:::`,
        },
        {
          id: 42,
          title: "Guide de décision, 5 profils et plan d'action",
          duration: '15 min',
          content: `:::bref
- Cinq profils selon le chiffre d'affaires, du micro à la société à l'impôt sur les sociétés.
- Erreurs fréquentes : ne pas provisionner, rester en micro trop longtemps, oublier la CFE.
- Plan : diagnostiquer, décider, structurer.
:::

## Les 5 profils type d'une conciergerie

### Profil 1, Démarrage *(CA < 30 000 €/an)*

> **Statut optimal :** Auto-entrepreneur / micro-BIC.

- **Simplicité maximale**, zéro formalisme.
- Cotisations **~22 % du CA**, pas de TVA.
- Focus sur le développement commercial.

### Profil 2, En croissance *(CA 30 000, 55 000 €/an)*

> **Statut optimal :** Micro-BIC si charges < 50 % CA. **Ou EI au réel** si charges > 50 % CA.

- Vérifie ton ratio **charges/CA** chaque trimestre.
- Commence à travailler avec un comptable.

### Profil 3, Établi *(CA 55 000, 83 600 €/an)*

> **Statut optimal :** EURL à l'IS.

- IS **15 %** sur les premiers 42 500 € = économie réelle.
- Protection du patrimoine pro/perso.
- Comptable **rentabilisé** dès la 1ère année.

### Profil 4, Fort CA *(CA 83 600, 150 000 €/an)*

> **Statut optimal :** EURL ou SASU à l'IS.

- Au-delà du plafond micro : la **société est nécessaire**.
- **SASU** si stratégie dividendes souhaitée.
- **EURL** si gestion plus simple privilégiée.

### Profil 5, Croissance forte *(CA > 150 000 €/an)*

> **Statut optimal :** SASU à l'IS + stratégie dividendes.

- **Salaire président minimal** pour droits sociaux de base.
- Bénéfices **conservés ou distribués** en flat tax 31,4 %.
- **Expert-comptable spécialisé** : investissement non négociable.

## Les 5 erreurs fiscales les plus fréquentes

### Erreur 1, Confondre abattement propriétaire et abattement conciergerie

- Tu n'es **pas concerné** par les 30 % des meublés non classés.
- Ton abattement reste **50 %** *(services BIC)*.

:::exemple
Le propriétaire d'un meublé non classé a 30 % d'abattement en micro-BIC. Ta conciergerie, elle, a l'abattement des prestations de services sur ses honoraires. Deux activités, deux calculs.
:::

### Erreur 2, Ne pas provisionner les cotisations URSSAF

- En auto-entrepreneur, les cotisations **arrivent dans l'année**.
- **Réserve 25-28 %** de chaque encaissement dès le premier jour.

### Erreur 3, Rester en micro quand le réel est plus avantageux

- Si charges réelles > 50 % du CA, tu paies **trop d'impôts**.
- **Recalcule ce ratio** chaque année.

### Erreur 4, Oublier la CFE la 2ème année

- La 1ère année est **exonérée**, la 2ème **non**.
- **Anticipe 200-2 000 €** selon ta commune.

### Erreur 5, Passer en SASU trop tôt

- Les frais comptables et la complexité ne se justifient qu'à partir d'environ **60 000 € de bénéfice annuel**.

## Plan d'action en 3 étapes

### Étape 1, Diagnostiquer *(cette semaine)*

- Calcule ton **CA des 12 derniers mois**.
- Calcule tes **charges réelles totales**.
- Calcule ton **ratio charges/CA**.
- Situe-toi dans les **5 profils** ci-dessus.
- Vérifie ton **code APE** sur inpi.fr.

### Étape 2, Décider *(dans le mois)*

- Compare ton impôt actuel vs le statut optimal identifié.
- Si l'écart dépasse **2 000 €/an** : consulte un expert-comptable.
- Prends une décision **IS vs IR** pour l'exercice en cours.
- Vérifie la **date de clôture** pour optimiser le timing fiscal.

### Étape 3, Structurer *(dans les 3 mois)*

- Mets en place les **provisions fiscales mensuelles**.
- Ouvre un **compte bancaire pro** dédié si ce n'est pas fait.
- Classe toutes tes **factures** dans un outil numérique.
- Vérifie le **numéro d'enregistrement** de chaque logement *(avant 20/05/2026)*.
- **Audite le DPE** de ton portefeuille.
- Planifie ton **rendez-vous comptable annuel**.

## Ressources officielles

- **bofip.impots.gouv.fr**, doctrine fiscale officielle française
- **urssaf.fr**, cotisations, simulateurs, déclarations
- **impots.gouv.fr**, simulateur IR/IS et espace professionnel
- **inpi.fr**, guichet unique de création d'entreprise
- **service-public.fr**, textes officiels loi Le Meur

## Félicitations

Tu as terminé la formation **Fiscalité et meilleur statut pour une conciergerie de tourisme**.

> Bien choisir son régime peut représenter **plusieurs milliers d'euros par an** pour une conciergerie qui grandit : fais le calcul avec tes chiffres.

> Ce n'est pas de l'argent gagné en travaillant plus. *C'est de l'argent récupéré sur ce que tu paies déjà.*

:::quiz
? Quelle erreur fiscale est très fréquente ?
* Ne pas mettre de côté les cotisations sociales
- Garder ses factures
- Déclarer son chiffre d'affaires
= Les cotisations arrivent plus tard et surprennent sans provision.
:::

:::quiz
? Par quoi commence le plan d'action ?
* Diagnostiquer ta situation actuelle
- Créer une SASU tout de suite
- Changer de banque
= On ne choisit un statut qu'une fois sa situation chiffrée.
:::

:::action
titre: Vérifie les numéros d'enregistrement de tes logements
texte: Contrôle dans chaque fiche logement que le numéro est renseigné.
lien: /dashboard/logements
bouton: Ouvrir mes logements
:::`,
        },
      ],
    },
  ],
}
