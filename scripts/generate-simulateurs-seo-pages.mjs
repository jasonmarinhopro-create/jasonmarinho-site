#!/usr/bin/env node
// Génère 4 sous-pages SEO de /services/simulateurs/ :
//  - fiscalite-micro-bic/                  (Simulateur fiscalité micro-BIC LCD)
//  - choisir-statut-ei-sasu/                (Simulateur EI vs SASU pour la LCD)
//  - rentabilite-location-courte-duree/     (Simulateur rentabilité LCD)
//  - taxe-de-sejour/                        (Simulateur taxe de séjour 2026)
//
// Chaque page : hero 2026, explication formules, 3 cas pratiques, FAQ, schema
// JSON-LD (WebApplication + BreadcrumbList + FAQPage), CTA vers le simulateur
// dans l'app. Sans trailing slash (vercel.json), OG image couverture-jason.webp.
//
// Idempotent : ré-exécutable, écrase à chaque run.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SIMULATOR_CSS, SIMULATOR_MAP, SIMULATOR_VS_CSS, SIMULATOR_VS_TYPE, simulatorVsBlock } from './lib/simulator-widgets.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ─── Données par simulateur ─────────────────────────────────────────────
const PAGES = [
  {
    slug: 'fiscalite-micro-bic',
    title: 'Simulateur fiscalité micro-BIC LCD : abattement 30 % ou 50 %, plafonds 2026',
    metaDesc: 'Calcule ton imposition micro-BIC selon ton CA LCD et le classement de ton meublé. Abattement 30 % (non classé) vs 50 % (classé Atout France), plafonds 15 k€ et 83,6 k€, économie potentielle. Gratuit.',
    canonical: 'https://jasonmarinho.com/services/simulateurs/fiscalite-micro-bic',
    appPath: '/dashboard/simulateurs?tab=fiscal',
    heroLabel: 'Outil gratuit · Fiscalité LCD',
    heroH1Top: 'Simulateur fiscalité',
    heroH1Em: 'micro-BIC pour la LCD',
    heroSub: "Calcule ta base imposable en quelques secondes selon tes recettes et le classement de ton meublé. Identifie l'économie réelle d'un classement (abattement 50 % au lieu de 30 %) et vérifie que tu restes sous le plafond du micro.",
    metaBadges: [
      { icon: 'currency-eur', text: 'CA jusqu\'à 100 k€' },
      { icon: 'gauge', text: 'Plafonds 15 k€ / 83,6 k€' },
      { icon: 'percent', text: 'Abattement 30 % / 50 %' },
      { icon: 'check-circle', text: 'Conforme 2026' },
    ],
    intro: {
      lbl: 'Pourquoi cet outil',
      h2Top: 'La fiscalité LCD',
      h2Em: "n'est pas qu'une question d'abattement",
      paras: [
        "Sous le régime micro-BIC, ton bénéfice imposable est calculé en appliquant un abattement forfaitaire à ton chiffre d'affaires. Cet abattement vaut 30 % par défaut, 50 % si ton meublé est classé meublé de tourisme (1 à 5 étoiles) ou si tu fais des chambres d'hôtes. La différence est nette : sur 14 000 € de recettes, la base imposable passe de 9 800 € à 7 000 €, soit 2 800 € de moins, imposés à ta tranche et à 18,6 % de prélèvements sociaux.",
        "Mais ce n'est pas la seule variable. Tu as deux plafonds à surveiller (15 000 € pour les meublés non classés depuis 2025, loi Le Meur, 83 600 € pour les meublés classés et chambres d'hôtes en 2026), une option pour le versement libératoire (sous condition de RFR), et le choix de basculer vers le régime réel simplifié si tes charges réelles dépassent l'abattement.",
        "Ce simulateur fait tous ces calculs d'un coup et te dit : ton bénéfice imposable, ton impôt sur le revenu et tes prélèvements sociaux approximatifs, et si tu restes sous le plafond du micro.",
      ],
      checklist: [
        "Calcul automatique selon classement Atout France",
        "Détection des dépassements de plafonds (15 k€ / 83,6 k€)",
        "Impôt et prélèvements sociaux estimés",
        "Économie d'un classement en un coup d'œil",
      ],
    },
    formules: {
      lbl: 'Comment ça se calcule',
      h2Top: 'Formules officielles',
      h2Em: 'utilisées par le simulateur',
      items: [
        {
          h: 'Base imposable',
          desc: "Base = CA × (1 − abattement). L'abattement est de 30 % pour un meublé non classé, 50 % pour un meublé de tourisme classé ou des chambres d'hôtes. L'abattement ne peut pas être inférieur à 305 €.",
        },
        {
          h: 'Plafond micro-BIC',
          desc: "Tu dois rester sous 15 000 € de recettes pour un meublé non classé (depuis 2025, loi Le Meur), 83 600 € pour un meublé classé et les chambres d'hôtes (revenus 2026). Un premier dépassement ne change rien l'année suivante ; si tu dépasses 2 années de suite, tu passes au régime réel.",
        },
        {
          h: 'Impôt sur le revenu',
          desc: "IR supplémentaire ≈ Base × TMI, plus 18,6 % de prélèvements sociaux sur la base (location meublée non professionnelle). La TMI dépend de ton revenu imposable global et de ton quotient familial. Barème 2026 (revenus 2025) : 0 % jusqu'à 11 600 €, 11 % jusqu'à 29 579 €, 30 % jusqu'à 84 577 €, 41 % jusqu'à 181 917 €, 45 % au-delà, par part.",
        },
        {
          h: 'Versement libératoire',
          desc: "Réservé aux micro-entrepreneurs. En 2026, RFR 2024 du foyer ≤ 29 315 € par part (58 630 € pour 2 parts, 87 945 € pour 3). Taux : 1 % des recettes en meublé classé ou chambres d'hôtes, 1,7 % en non classé. Il remplace l'impôt sur le revenu de cette activité, pas les cotisations sociales.",
        },
        {
          h: 'Régime réel simplifié',
          desc: "Si tes charges déductibles (intérêts, amortissements, eau, assurance, copro, ménage) dépassent l'abattement micro, le réel est plus avantageux. Compare avec ton comptable ou dans l'onglet Fiscalité de ton espace.",
        },
      ],
    },
    cas: {
      lbl: 'Cas pratiques',
      h2Top: '3 scénarios',
      h2Em: 'avec chiffres concrets',
      examples: [
        {
          titre: 'Studio classé 3★ à 14 000 € de CA',
          steps: [
            'CA annuel : 14 000 €',
            "Classement Atout France 3★ → abattement 50 %",
            'Base imposable : 14 000 × 50 % = 7 000 €',
            "TMI 30 % → IR estimé : 2 100 €, plus 1 302 € de prélèvements sociaux (18,6 %)",
            'Sans classement (abattement 30 %) : base 9 800 €, IR 2 940 € et prélèvements 1 823 €',
            "Gain du classement : environ 1 360 €/an, pour 200 à 400 € de frais de classement valables 5 ans",
          ],
        },
        {
          titre: 'T2 non classé à 22 000 € de CA',
          steps: [
            'CA annuel : 22 000 €',
            'Meublé non classé → plafond micro de 15 000 € dépassé',
            'Régime réel si le dépassement se répète 2 années de suite',
            "Charges réelles déductibles estimées : 9 500 € (intérêts crédit, copro, eau, ménage, amortissement mobilier)",
            'Bénéfice réel : 12 500 €',
            'IR (TMI 30 %) : 3 750 €, plus 2 325 € de prélèvements sociaux',
            "Avec un classement (50 %) : micro-BIC possible, base 11 000 €, IR 3 300 € et prélèvements 2 046 €",
            "Conseil : le classement permet de rester au micro (plafond 83,6 k€) ; le réel reste intéressant si tes charges augmentent",
          ],
        },
        {
          titre: 'Maison classée 4★ à 65 000 € de CA',
          steps: [
            'CA annuel : 65 000 €',
            "Classement Atout France 4★ → abattement 50 %",
            'Base imposable : 65 000 × 50 % = 32 500 €',
            "TMI 30 % → IR estimé : 9 750 €",
            'Recettes au-delà de 23 000 € en courte durée : cotisations sociales obligatoires (Urssaf), à la place des 18,6 % de prélèvements sociaux',
            "En micro-entrepreneur avec versement libératoire (RFR 2024 ≤ 58 630 € pour 2 parts) : 650 € d'impôt (1 %) au lieu de 9 750 €, cotisations sociales en plus",
            "Conseil : si ta tranche est à 30 % ou plus et ton RFR éligible, le versement libératoire est souvent gagnant ; estime tes cotisations sur le simulateur de l'Urssaf",
          ],
        },
      ],
    },
    faq: [
      {
        q: 'Quel abattement micro-BIC en 2026 pour la location courte durée ?',
        a: "30 % pour un meublé de tourisme non classé (avec plafond de 15 000 € de recettes depuis 2025, loi Le Meur), 50 % pour un meublé de tourisme classé de 1 à 5 étoiles (avec plafond de 83 600 € sur les revenus 2026). Les chambres d'hôtes sont passées à 50 % (décision CE du 16/09/2025) avec le même plafond.",
      },
      {
        q: "Comment se faire classer Atout France pour bénéficier de l'abattement 50 % ?",
        a: "Tu fais appel à un organisme de contrôle accrédité, qui visite le logement et le note selon la grille officielle des meublés de tourisme ; le classement est valable 5 ans. Coût courant : 200 à 400 € selon la taille du logement.",
      },
      {
        q: "Le micro-BIC est-il toujours plus avantageux que le réel simplifié ?",
        a: "Non. Si tes charges déductibles réelles (intérêts d'emprunt, amortissement du mobilier, copropriété, eau, assurance, frais de ménage, abonnements iCal) dépassent l'abattement forfaitaire, le réel est plus avantageux. C'est souvent le cas pour les hôtes avec crédit immobilier en cours.",
      },
      {
        q: "Qu'est-ce que le versement libératoire et qui peut en profiter ?",
        a: "C'est une option des micro-entrepreneurs qui te fait payer l'impôt de cette activité au fil de l'eau, à taux fixe (1 % des recettes en meublé classé ou chambres d'hôtes, 1,7 % en non classé). En 2026, il faut un RFR 2024 du foyer sous 29 315 € par part (58 630 € pour 2 parts, 87 945 € pour 3). Avantage : l'impôt est soldé, pas de régularisation en mai.",
      },
      {
        q: "Que se passe-t-il si je dépasse le plafond du micro-BIC en cours d'année ?",
        a: "Un premier dépassement ne te fait pas quitter le micro : tu y restes tant que les recettes de l'une des 2 années précédentes sont sous le plafond. Si tu dépasses 2 années de suite, tu passes au régime réel l'année suivante : plus d'abattement forfaitaire, mais tu déduis tes charges réelles, ce qui peut être plus avantageux.",
      },
      {
        q: "Faut-il déclarer ses revenus LCD même en dessous de 15 000 € ?",
        a: "Oui. Toutes tes recettes de location doivent être déclarées, quel que soit le montant, sur la déclaration 2042-C-PRO (rubrique des locations meublées, non professionnelles ou professionnelles selon ton statut). Un oubli expose à un redressement avec intérêts de retard et majorations.",
      },
    ],
  },

  {
    slug: 'choisir-statut-ei-sasu',
    title: 'Simulateur EI vs SASU pour la LCD : net en poche, cotisations, dividendes',
    metaDesc: 'Compare net en poche entre EI au réel (cotisations TNS + IR) et SASU 100 % dividendes (IS + flat tax 31,4 %). Avec les points de vigilance sur la protection sociale et la retraite. Pour hôtes LCD jusqu\'à 150 k€ de bénéfice.',
    canonical: 'https://jasonmarinho.com/services/simulateurs/choisir-statut-ei-sasu',
    appPath: '/dashboard/simulateurs?tab=statut',
    heroLabel: 'Outil gratuit · Statut juridique',
    heroH1Top: 'Simulateur',
    heroH1Em: 'EI vs SASU pour la LCD',
    heroSub: "Quel statut juridique te laisse le plus à la fin ? EI au régime réel (cotisations TNS + impôt sur le revenu) versus SASU 100 % dividendes (impôt sur les sociétés + flat tax 31,4 %). Le simulateur compare le net en poche, la protection sociale, et la retraite.",
    metaBadges: [
      { icon: 'scales', text: 'Comparaison réelle' },
      { icon: 'currency-eur', text: 'Bénéfice jusqu\'à 150 k€' },
      { icon: 'chart-bar', text: '3 tranches IR (11/30/41 %)' },
      { icon: 'shield-check', text: 'Protection sociale incluse' },
    ],
    intro: {
      lbl: 'Pourquoi cet outil',
      h2Top: 'EI ou SASU,',
      h2Em: 'la décision la plus structurante',
      paras: [
        "Le choix du statut juridique détermine ton net en poche, ta protection sociale, ta retraite, et ta capacité à transmettre ton activité. La plupart des hôtes LCD démarrent en entreprise individuelle (EI) au régime micro-BIC, puis hésitent à passer en SASU quand le CA augmente.",
        "La vérité : il n'y a pas de réponse universelle. Tout dépend de ton bénéfice, de ton TMI, de ton besoin de protection sociale, et de ta stratégie de rémunération (tout en dividendes pour optimiser, ou salaire pour cotiser à la retraite générale).",
        "Ce simulateur fait les deux calculs en parallèle et te montre l'écart net réel, sans approximation marketing. Tu vois aussi ce que tu sacrifies en SASU pure dividendes (zéro cotisation = zéro trimestre retraite).",
      ],
      checklist: [
        "Calcul EI au réel : bénéfice − cotisations TNS − IR au TMI",
        "Calcul SASU 100 % dividendes : bénéfice − IS − flat tax 31,4 %",
        "Comparaison net en poche sur le même CA",
        "Alerte protection sociale (zéro cotisation = zéro retraite)",
      ],
    },
    formules: {
      lbl: 'Comment ça se calcule',
      h2Top: 'Les 2 modèles',
      h2Em: 'côte à côte',
      items: [
        {
          h: 'EI au régime réel',
          desc: "Bénéfice − cotisations sociales des indépendants (SSI, environ 30 à 35 % du bénéfice, soit ~45 % du revenu net) − IR au TMI. Tu cotises pour la retraite et la maladie, mais tes charges sociales sont élevées.",
        },
        {
          h: 'SASU 100 % dividendes',
          desc: "Bénéfice − impôt sur les sociétés (15 % jusqu'à 42 500 €, 25 % au-delà) − flat tax 31,4 % (PFU = 12,8 % IR + 18,6 % prélèvements sociaux depuis 2026) sur les dividendes versés. Aucune cotisation sociale (zéro trimestre retraite acquis).",
        },
        {
          h: 'SASU avec salaire (option C)',
          desc: "Tu te verses un salaire de président → cotisations d'assimilé salarié (environ 75 à 80 % du salaire net) → tu acquiers des droits retraite au régime général. Le reste du bénéfice peut sortir en dividendes (flat tax 31,4 %).",
        },
        {
          h: 'Quand bascule EI → SASU',
          desc: "Le point de bascule théorique se situe entre 60 000 € et 80 000 € de bénéfice annuel selon ton TMI et ton besoin de protection sociale. En dessous, l'EI au réel est généralement plus simple et meilleur en net.",
        },
        {
          h: 'CFE, impôt forfaitaire, taxe foncière',
          desc: "Le simulateur ne les intègre pas : prévois la CFE (exonérée l'année de création, puis fixée par ta commune), le compte bancaire pro et l'expert-comptable, quasi indispensable en SASU.",
        },
      ],
    },
    cas: {
      lbl: 'Cas pratiques',
      h2Top: '3 niveaux de bénéfice',
      h2Em: 'EI vs SASU comparés',
      examples: [
        {
          titre: 'Bénéfice 30 000 € : verdict : EI',
          steps: [
            "EI au réel : 30 000 € − cotisations TNS ~9 000 € − IR TMI 11 % : 2 310 €",
            "Net en poche EI : ~18 690 €",
            "SASU 100 % dividendes : 30 000 € − IS 15 % : 4 500 € − flat tax 31,4 % sur 25 500 € : 8 007 €",
            "Net en poche SASU : ~17 493 € (− 1 197 € vs EI)",
            "Verdict : EI gagnant, plus simple, protection sociale acquise",
          ],
        },
        {
          titre: 'Bénéfice 70 000 € : verdict : à arbitrer',
          steps: [
            "EI au réel : 70 000 € − cotisations TNS ~22 400 € − IR TMI 30 % : 14 280 €",
            "Net en poche EI : ~33 320 €",
            "SASU 100 % dividendes : 70 000 € − IS 15 %/25 % : ~13 250 € − flat tax 31,4 % sur 56 750 € : 17 820 €",
            "Net en poche SASU : ~38 930 € (+ 5 610 € vs EI)",
            "Verdict : SASU gagne en net, mais zéro cotisation retraite. Si tu n'as pas d'autre activité salariée, choix risqué",
          ],
        },
        {
          titre: 'Bénéfice 120 000 € : verdict : SASU',
          steps: [
            "EI au réel : 120 000 € − cotisations TNS ~42 000 € − IR TMI 41 % : 31 980 €",
            "Net en poche EI : ~46 020 €",
            "SASU 100 % dividendes : 120 000 € − IS 15 %/25 % : ~25 750 € − flat tax 31,4 % sur 94 250 € : 29 595 €",
            "Net en poche SASU : ~64 655 € (+ 18 635 € vs EI)",
            "Verdict : SASU largement gagnante, mais prévoir une rémunération minimale ou un PER pour conserver de la retraite",
          ],
        },
      ],
    },
    faq: [
      {
        q: 'EI ou SASU pour faire de la location courte durée, lequel est mieux ?',
        a: "Ça dépend de ton bénéfice. En dessous de 40 000 €, l'EI au régime réel est presque toujours plus avantageux (simplicité, cotisations qui ouvrent droit à la retraite). Au-dessus de 80 000 € avec un TMI 30 %+, la SASU 100 % dividendes peut faire gagner 10 à 20 % de net. Entre les deux, l'arbitrage dépend de tes besoins en protection sociale.",
      },
      {
        q: "La SASU 100 % dividendes, c'est légal pour la LCD ?",
        a: "Oui. La SASU permet au président de ne pas se verser de salaire. Tu paies l'IS sur le bénéfice, puis tu distribues des dividendes à toi-même (actionnaire unique) avec la flat tax de 31,4 %. Aucun salaire = aucune cotisation = aucun droit retraite acquis sur cette activité. C'est légal mais à compenser par un PER ou une autre activité salariée.",
      },
      {
        q: "Quels sont les frais fixes de la SASU pour la LCD ?",
        a: "CFE (exonérée l'année de création, puis quelques centaines d'euros selon la commune), compte bancaire pro (~50 à 150 €/an), expert-comptable (~1 200 à 2 500 € selon le volume). Total à prévoir : 2 000 à 4 000 €/an de frais fixes. Cela explique pourquoi la SASU n'est rentable qu'à partir d'un certain bénéfice.",
      },
      {
        q: "Peut-on passer d'EI à SASU sans tout perdre ?",
        a: "Oui. Tu crées la SASU, tu apportes ton activité et ton mobilier (apport en nature, évalué si besoin), puis tu cesses l'EI. Apporter le logement lui-même est possible mais déclenche en général l'imposition de la plus-value et des droits d'enregistrement : à étudier avec un notaire ou un expert-comptable.",
      },
      {
        q: "Y a-t-il un seuil de bénéfice où la SASU devient automatiquement plus rentable ?",
        a: "Pas de seuil universel, mais un point de bascule moyen vers 60 000 à 80 000 € de bénéfice annuel, à condition d'avoir un TMI à 30 % ou plus et de pouvoir compenser la perte de protection sociale (PER, autre activité salariée, conjoint salarié).",
      },
      {
        q: "Le simulateur prend-il en compte la CSG-CRDS et les prélèvements sociaux ?",
        a: "Oui. La flat tax SASU de 31,4 % inclut 18,6 % de prélèvements sociaux (CSG + CRDS + prélèvement de solidarité). Côté EI, les cotisations des indépendants (SSI) incluent maladie, retraite, allocations familiales et CSG-CRDS.",
      },
    ],
  },

  {
    slug: 'rentabilite-location-courte-duree',
    title: 'Simulateur rentabilité LCD : cash-flow, rentabilité brute et nette',
    metaDesc: "Calcule la rentabilité d'un logement en location courte durée : revenu net mensuel, cash-flow après crédit, rentabilité brute et nette. Mode opérationnel ou investissement, avec commission plateforme et charges incluses.",
    canonical: 'https://jasonmarinho.com/services/simulateurs/rentabilite-location-courte-duree',
    appPath: '/dashboard/simulateurs?tab=rentabilite',
    heroLabel: 'Outil gratuit · Rentabilité LCD',
    heroH1Top: 'Simulateur',
    heroH1Em: 'rentabilité LCD',
    heroSub: "Mode opérationnel : ton revenu net mensuel selon prix par nuit, occupation, commission, charges. Mode investissement (dans ton espace) : cash-flow après crédit, rentabilité brute et nette avant impôt. Pour décider si ton bien LCD vaut le coup, sans illusions de chiffres bruts.",
    metaBadges: [
      { icon: 'chart-line-up', text: 'Mode opérationnel' },
      { icon: 'house', text: 'Mode investissement' },
      { icon: 'percent', text: 'Rentabilité brute + nette' },
      { icon: 'wallet', text: 'Cash-flow + ROI' },
    ],
    intro: {
      lbl: 'Pourquoi cet outil',
      h2Top: "Trop d'hôtes pilotent",
      h2Em: 'au revenu brut',
      paras: [
        "Le piège classique : un logement qui sort 28 000 € de CA par an sur Airbnb, ça semble énorme. Sauf qu'entre la commission plateforme (15 %), le ménage facturé en commission (à déduire si tu ne le refactures pas), l'eau, l'électricité, internet, l'assurance, la copropriété, la taxe foncière, le crédit, et le mobilier qui s'use, le net réel peut tomber à 8 000 €.",
        "Le simulateur de rentabilité fait deux choses : il calcule ton net mensuel en mode opérationnel (logement déjà acquis), et il calcule ton cash-flow + rentabilité brute + rentabilité nette nette en mode investissement (achat à crédit). C'est l'outil de décision avant achat, et le tableau de bord après acquisition.",
        "Le calcul rapide ci-dessus donne le net mensuel avant impôt. Dans ton espace, le mode investissement ajoute le crédit, le cash-flow et la rentabilité brute et nette.",
      ],
      checklist: [
        "Mode opérationnel : revenu net mensuel post-charges",
        "Mode investissement : cash-flow + rentabilité brute + nette",
        "Commissions plateforme paramétrables",
        "Net avant impôt, sans chiffres gonflés",
      ],
    },
    formules: {
      lbl: 'Comment ça se calcule',
      h2Top: 'Les 4 ratios',
      h2Em: 'qui comptent vraiment',
      items: [
        {
          h: "Revenu brut LCD",
          desc: "Revenu après commission = ADR × nb_nuits_louées × (1 − commission_plateforme). L'ADR moyen et le taux d'occupation sont les deux variables critiques. Une variation de 10 % d'occupation change ton revenu brut de 10 %.",
        },
        {
          h: 'Revenu net mensuel',
          desc: "Net mensuel = (Revenu brut annuel − charges variables et fixes) / 12. Charges incluses : eau, électricité, gaz, internet, ménage, assurance PNO, copropriété, taxe foncière, abonnements, petits travaux d'entretien.",
        },
        {
          h: 'Rentabilité brute',
          desc: "Rentabilité brute = (Revenu brut annuel / Prix d'achat tout compris) × 100. Indicateur d'entrée de gamme. Un bien LCD classique vise 7 à 10 % brut, un bien premium 5 à 7 %.",
        },
        {
          h: 'Rentabilité nette nette',
          desc: "Rentabilité nette nette = (Revenu net annuel − impôts − cotisations) / (Prix d'achat + frais de notaire + travaux). C'est le seul indicateur fiable pour comparer un LCD à un livret A, un PEA, un autre investissement immobilier. Vise 4 à 6 % minimum.",
        },
        {
          h: 'Cash-flow mensuel',
          desc: "Cash-flow = Revenu brut mensuel − mensualité crédit − charges courantes − provision impôts/cotisations. Positif = le bien s'autofinance et te dégage du cash. Négatif = tu mets de l'argent tous les mois (déficit foncier acceptable si rentabilité nette nette positive).",
        },
      ],
    },
    cas: {
      lbl: 'Cas pratiques',
      h2Top: '3 stratégies',
      h2Em: 'comparées en chiffres',
      examples: [
        {
          titre: "Studio Bordeaux 18 m², achat 130 000 €",
          steps: [
            "Apport 25 000 € + prêt 105 000 € sur 25 ans à 3,8 % → mensualité 542 €",
            "ADR moyen 75 €, occupation 60 % → 16 425 € CA brut/an",
            "Commission OTAs 15 %, charges courantes 3 200 €/an",
            "Revenu net annuel : 16 425 × 0,85 − 3 200 = 10 761 €",
            "Cash-flow mensuel avant impôt : (16 425 × 0,85 / 12) − 542 − (3 200 / 12) = 355 €",
            "Rentabilité nette nette : (10 761 − impôt et prélèvements ~1 800 €) / 145 000 € (achat + frais) = 6,2 %",
            "Verdict : bon dossier, cash-flow positif, rentabilité nette nette honorable",
          ],
        },
        {
          titre: "T2 Lyon 35 m², achat 240 000 €",
          steps: [
            "Apport 50 000 € + prêt 190 000 € sur 25 ans à 3,8 % → mensualité 982 €",
            "ADR moyen 95 €, occupation 65 % → 22 539 € CA brut/an",
            "Commission OTAs 15 %, charges courantes 4 500 €/an",
            "Revenu net annuel : 22 539 × 0,85 − 4 500 = 14 658 €",
            "Cash-flow mensuel avant impôt : (22 539 × 0,85 / 12) − 982 − (4 500 / 12) = 239 €",
            "Rentabilité nette nette : (14 658 − impôt et prélèvements ~2 800 €) / 263 000 € = 4,5 %",
            "Verdict : cash-flow correct mais rentabilité nette nette serrée, vise le classement en meublé de tourisme pour économiser sur l'impôt",
          ],
        },
        {
          titre: 'Maison Honfleur 80 m², achat 380 000 €',
          steps: [
            'Apport 80 000 € + prêt 300 000 € sur 25 ans à 3,8 % → mensualité 1 551 €',
            'ADR moyen 165 €, occupation 58 % → 34 931 € CA brut/an',
            "Commission OTAs 12 % (mix réservations directes via Driing), charges courantes 6 800 €/an",
            "Revenu net annuel : 34 931 × 0,88 − 6 800 = 23 939 €",
            "Cash-flow mensuel avant impôt : (34 931 × 0,88 / 12) − 1 551 − (6 800 / 12) = 444 €",
            "Recettes au-delà de 23 000 € : cotisations sociales dues en plus de l'impôt (environ 4 000 à 6 000 € au total selon ton régime)",
            "Rentabilité nette nette : environ 4,3 à 4,8 % sur 415 000 €. Verdict : bon dossier, cash-flow solide, classement indispensable pour optimiser",
          ],
        },
      ],
    },
    faq: [
      {
        q: "Comment calculer la rentabilité d'une location courte durée ?",
        a: "Deux niveaux. Rentabilité brute = revenu brut annuel / prix d'achat × 100 (vise 7-10 %). Rentabilité nette nette = (revenu net − impôt − cotisations) / coût total (achat + frais + travaux). C'est la nette nette qui compte vraiment, parce qu'elle se compare à n'importe quel autre placement.",
      },
      {
        q: "Quel taux d'occupation moyen pour une LCD rentable ?",
        a: "Le seuil de rentabilité varie selon la ville et l'ADR. En grande ville (Paris, Lyon, Bordeaux), il faut viser au moins 60 % d'occupation annuelle. Dans une ville secondaire ou rurale, ça peut tomber à 45-50 % si l'ADR est élevé (maison atypique, vue mer, etc.). Le simulateur te montre la sensibilité de ton bien à l'occupation.",
      },
      {
        q: "Faut-il acheter à crédit pour faire de la LCD ?",
        a: "Le crédit fait levier sur la rentabilité nette nette, à condition que le taux d'intérêt soit inférieur à la rentabilité brute. Avec un crédit à 3,8 % et une rentabilité brute à 8 %, le levier est positif. Avec un crédit à 4,5 % et une brute à 6 %, le levier est marginal et tu prends beaucoup de risque.",
      },
      {
        q: "La commission Airbnb / Booking est-elle déductible ?",
        a: "Oui. Toute commission OTAs (Airbnb, Booking, Vrbo, Expedia, et autres) est déductible en régime réel. Au micro-BIC, elle est intégrée dans l'abattement forfaitaire (30 ou 50 %). Le simulateur permet de paramétrer une commission moyenne pour modéliser ton mix OTAs vs réservations directes (via Driing par exemple).",
      },
      {
        q: "Quel cash-flow minimum pour qu'un bien LCD soit viable ?",
        a: "Idéalement positif (le bien s'autofinance). Acceptable s'il est légèrement négatif les premières années si la rentabilité nette nette est solide et le bien capitalise (zone à forte plus-value). Inacceptable si le cash-flow négatif persiste et la rentabilité nette nette tombe sous 4 %.",
      },
      {
        q: "Le simulateur prend-il en compte les charges de copropriété et la taxe foncière ?",
        a: "Oui, dans le champ Charges mensuelles : additionne eau, énergie, ménage, internet, assurance, copropriété, taxe foncière et CFE, ramenées au mois. L'impôt et les cotisations ne sont pas inclus : le net affiché est avant impôt.",
      },
    ],
  },

  {
    slug: 'taxe-de-sejour',
    title: 'Simulateur taxe de séjour LCD : barème 2026, classement, durée',
    metaDesc: 'Calcule la taxe de séjour à collecter sur tes voyageurs selon le tarif de ta commune, le classement de ton meublé, le nombre d\'adultes et la durée. Plafonds 2026 officiels, mineurs exonérés, taxes additionnelles départementale et Île-de-France.',
    canonical: 'https://jasonmarinho.com/services/simulateurs/taxe-de-sejour',
    appPath: '/dashboard/simulateurs?tab=taxe',
    heroLabel: 'Outil gratuit · Taxe de séjour',
    heroH1Top: 'Simulateur',
    heroH1Em: 'taxe de séjour 2026',
    heroSub: "La taxe de séjour est une obligation légale, et son calcul dépend de ta commune, du classement du logement et du nombre de voyageurs. Le simulateur applique les plafonds 2026, le tarif voté par ta commune, les taxes additionnelles (départementale, Île-de-France) et l'exonération des mineurs.",
    metaBadges: [
      { icon: 'map-pin', text: 'Tarif de ta commune' },
      { icon: 'star', text: 'Non classé à palace' },
      { icon: 'plus', text: 'Taxes additionnelles' },
      { icon: 'users', text: 'Exemptions mineurs' },
    ],
    intro: {
      lbl: 'Pourquoi cet outil',
      h2Top: 'La taxe de séjour est',
      h2Em: 'collectée par tes soins',
      paras: [
        "Que tu loues via Airbnb, Booking, Vrbo, ton site direct ou Driing, la taxe de séjour est dûe à la commune par voyageur et par nuit. Si tu loues en non professionnel, la plateforme qui encaisse le paiement (Airbnb, Booking quand il encaisse) la collecte et la reverse à ta place. Pour tes réservations directes, c'est à toi de la collecter et de la reverser.",
        "Le piège : chaque commune vote ses tarifs dans des plafonds nationaux, et des taxes additionnelles s'ajoutent. À Paris, un meublé non classé paie 5 % du prix de la nuit par personne, jusqu'à 15,93 € par adulte et par nuit en 2026 une fois ajoutées les taxes départementale (10 %), régionale (15 %) et Île-de-France Mobilités (200 %).",
        "Tu saisis le tarif de ta commune, le simulateur te donne le montant total à collecter pour un séjour. Pratique pour tes réservations directes et pour préparer tes reversements à la mairie.",
      ],
      checklist: [
        "Plafonds nationaux 2026 par catégorie",
        "Non classé au pourcentage, classé au tarif fixe",
        "Taxes additionnelles départementale et Île-de-France",
        "Mineurs exonérés",
      ],
    },
    formules: {
      lbl: 'Comment ça se calcule',
      h2Top: 'La formule officielle',
      h2Em: 'taxe de séjour 2026',
      items: [
        {
          h: 'Taxe communale par nuit',
          desc: "Tarif fixé par délibération de la commune, par catégorie, dans les limites nationales : en 2026, de 0,20 € (campings) à 4,90 € (palaces), 3,60 € pour un 5★, 2,60 € pour un 4★, 1,70 € pour un 3★, jusqu'à 1,00 € pour un 1★, un 2★ ou des chambres d'hôtes. Non classé : 1 à 5 % du prix HT de la nuit par personne, plafonné au tarif le plus élevé voté par la commune.",
        },
        {
          h: 'Taxe additionnelle départementale',
          desc: "Égale à 10 % de la taxe communale, dans les départements qui l'ont votée (la plupart).",
        },
        {
          h: 'Taxe additionnelle régionale Île-de-France',
          desc: "En Île-de-France s'ajoutent une taxe régionale de 15 % et, depuis 2024, une taxe de 200 % au profit d'Île-de-France Mobilités, calculées sur la taxe communale. Active l'option Île-de-France dans le simulateur.",
        },
        {
          h: 'Exemptions légales',
          desc: "Sont exonérés : les mineurs, les titulaires d'un contrat de travail saisonnier employés dans la commune, les personnes en hébergement d'urgence ou en relogement temporaire, et celles dont le loyer est sous un montant fixé par la commune.",
        },
        {
          h: 'Cas Airbnb',
          desc: "Depuis 2019, les plateformes qui encaissent le paiement pour un loueur non professionnel doivent collecter la taxe et la reverser : c'est le cas d'Airbnb. Pour une plateforme qui n'encaisse pas le paiement, et pour tes réservations directes, c'est à toi de la collecter.",
        },
      ],
    },
    cas: {
      lbl: 'Cas pratiques',
      h2Top: '3 séjours typiques',
      h2Em: 'avec calcul détaillé',
      examples: [
        {
          titre: 'T1 à Paris non classé, 2 adultes, 4 nuits',
          steps: [
            "Nuit à 200 €, 2 adultes : 5 % × 200 / 2 = 5,00 €, plafonné à 4,90 €",
            "Taxes additionnelles : départementale 10 %, régionale 15 %, Île-de-France Mobilités 200 %",
            "Coefficient total : 1 + 0,10 + 0,15 + 2,00 = 3,25",
            "Taxe par adulte et par nuit : 4,90 × 3,25 = 15,93 €",
            "Taxe totale : 15,93 × 2 adultes × 4 nuits = 127,44 €",
            "Si la réservation passe par Airbnb, la plateforme la collecte pour toi",
          ],
        },
        {
          titre: 'Appartement classé 3★, 3 adultes, 5 nuits',
          steps: [
            "Tarif voté pour un 3★ (exemple) : 1,50 € par adulte et par nuit, sous le plafond national de 1,70 €",
            "Taxe additionnelle départementale (Rhône) : 10 %",
            "Taxe par adulte et par nuit : 1,50 × 1,10 = 1,65 €",
            "Taxe totale : 1,65 × 3 adultes × 5 nuits = 24,75 €",
            "Vérifie le tarif exact dans la délibération de ta commune",
          ],
        },
        {
          titre: 'Maison classée 4★, 4 adultes + 1 enfant, 7 nuits',
          steps: [
            "Tarif voté pour un 4★ (exemple) : 2,40 € par adulte et par nuit, sous le plafond national de 2,60 €",
            "Taxe additionnelle départementale (Gironde) : 10 %",
            "Taxe par adulte et par nuit : 2,40 × 1,10 = 2,64 €",
            "L'enfant (< 18 ans) est exempté",
            "Taxe totale : 2,64 × 4 adultes × 7 nuits = 73,92 €",
            "À reverser à la mairie aux échéances qu'elle fixe, sauf si la plateforme l'a collectée",
          ],
        },
      ],
    },
    faq: [
      {
        q: "Qui doit payer la taxe de séjour : l'hôte ou le voyageur ?",
        a: "Le voyageur paie, l'hôte (ou la plateforme) collecte et reverse à la commune. Tu peux soit inclure la taxe dans ton tarif annoncé, soit la facturer en supplément à la fin du séjour. La plupart des hôtes la font figurer en ligne séparée sur la facture pour la transparence.",
      },
      {
        q: "Airbnb collecte-t-il la taxe de séjour automatiquement en France ?",
        a: "Oui : depuis 2019, les plateformes qui encaissent le paiement pour un loueur non professionnel doivent collecter la taxe de séjour et la reverser à la commune. Tu retrouves le montant dans tes relevés Airbnb. Pour une plateforme qui n'encaisse pas le paiement, et pour tes réservations directes (site, Driing), c'est à toi de la collecter.",
      },
      {
        q: "Comment connaître le barème exact de ma commune ?",
        a: "La délibération de ta commune (ou de ton intercommunalité) fixe les tarifs : demande-la en mairie ou à l'office de tourisme, beaucoup la publient sur leur portail de déclaration en ligne. Reporte ensuite ton tarif dans le simulateur.",
      },
      {
        q: "Quelles sont les exemptions à la taxe de séjour ?",
        a: "Les mineurs, les titulaires d'un contrat de travail saisonnier employés dans la commune, les personnes en hébergement d'urgence ou en relogement temporaire, et celles dont le loyer est sous un montant fixé par la commune. Le simulateur applique l'exonération des mineurs.",
      },
      {
        q: "Que se passe-t-il si je ne collecte pas la taxe de séjour ?",
        a: "La commune peut te réclamer la taxe que tu aurais dû collecter, avec des pénalités en cas de défaut de déclaration ou de reversement. Aucun intérêt à ne pas la collecter : c'est le voyageur qui la paie, elle est neutre pour tes revenus.",
      },
      {
        q: "Comment reverser la taxe de séjour à la mairie ?",
        a: "La plupart des communes ont un portail de déclaration en ligne, où tu déclares aux échéances qu'elles fixent le nombre de nuitées et la taxe collectée, puis tu la reverses. La part collectée par une plateforme est reversée par la plateforme : tu ne déclares que tes réservations directes et celles des plateformes qui n'encaissent pas.",
      },
    ],
  },

  {
    slug: 'franchise-tva-lcd',
    title: 'Simulateur franchise TVA LCD : seuils 2026, services para-hôteliers',
    metaDesc: "Vérifie ta franchise en base de TVA selon ton CA LCD et tes services. Seuils 2026 (85 000 € / 93 500 €), distinction location meublée exonérée vs LCD para-hôtelière, alerte automatique. Gratuit.",
    canonical: 'https://jasonmarinho.com/services/simulateurs/franchise-tva-lcd',
    appPath: '/dashboard/simulateurs#tva',
    heroLabel: 'Outil gratuit · Franchise TVA',
    heroH1Top: 'Simulateur',
    heroH1Em: 'franchise TVA pour la LCD',
    heroSub: "Suis-je en franchise de TVA ? Quel seuil pour la LCD avec services para-hôteliers ? Le simulateur applique les barèmes 2026 et signale si tu dois facturer la TVA ou rester en dispense. Cas particulier des services hôteliers traité explicitement.",
    metaBadges: [
      { icon: 'currency-eur', text: 'Seuils 85 k€ / 93,5 k€' },
      { icon: 'check-circle', text: 'LCD avec ou sans services' },
      { icon: 'percent', text: 'TVA 10 % LCD hôtelier' },
      { icon: 'warning-octagon', text: 'Alerte dépassement' },
    ],
    intro: {
      lbl: 'Pourquoi cet outil',
      h2Top: 'La TVA en LCD',
      h2Em: "n'est pas systématique mais sensible",
      paras: [
        "La franchise en base de TVA dispense de facturer la TVA à tes voyageurs tant que ton CA reste sous un seuil annuel. Pour la LCD avec services para-hôteliers (petit-déjeuner, ménage en cours de séjour, fourniture du linge, accueil), le seuil 2026 est de 85 000 €, avec un seuil majoré de 93 500 €. Le seuil de 37 500 € que tu as peut-être lu concerne les prestations de services (une conciergerie, par exemple), pas l'hébergement.",
        "Si tu loues simplement un meublé sans services para-hôteliers, ta location est exonérée de TVA (article 261 D 4° du CGI) : aucun seuil à surveiller, jamais de TVA à facturer.",
        "Le simulateur te dit en un coup d'œil : tu es en franchise, en zone de tolérance, ou tu dois facturer la TVA. Avec la TVA qui aurait été collectée, pour anticiper l'impact si tu basculais.",
      ],
      checklist: [
        "Distinction LCD para-hôtelière vs location simple",
        "Calcul de la marge restante sous le seuil",
        "Alerte zone tolérance et sortie immédiate",
        "Estimation de la TVA collectée au taux 10 % LCD",
      ],
    },
    formules: {
      lbl: 'Comment ça se calcule',
      h2Top: 'Les 2 régimes',
      h2Em: 'à connaître pour la LCD',
      items: [
        {
          h: 'LCD avec services (para-hôtelière)',
          desc: "Si tu fournis au moins 3 services parmi petit-déjeuner, ménage régulier pendant le séjour, fourniture du linge, réception (même non personnalisée), pour des séjours de 30 nuits maximum : tu es en para-hôtellerie. Franchise applicable jusqu'à 85 000 € de CA annuel.",
        },
        {
          h: 'LCD sans services (location meublée)',
          desc: "Location meublée saisonnière sans services para-hôteliers : exonérée de TVA (article 261 D 4° du CGI). Aucun seuil à surveiller. Tu factures et déclares uniquement en BIC (micro ou réel).",
        },
        {
          h: 'Zone de tolérance',
          desc: "Entre 85 000 € et 93 500 €, un premier dépassement ne te fait pas perdre la franchise tout de suite : tu la perds si tu restes au-dessus de 85 000 € l'année suivante. Au-delà de 93 500 €, tu es redevable de la TVA dès le jour du dépassement.",
        },
        {
          h: 'Taux applicable',
          desc: 'Hors franchise, la LCD avec services para-hôteliers est soumise à la TVA au taux réduit de 10 % (régime des prestations hôtelières), pas 20 %.',
        },
        {
          h: 'Seuil de 25 000 € abandonné',
          desc: 'La loi de finances 2025 prévoyait un seuil unique de 25 000 €. Il a été suspendu puis abandonné par la loi du 3 novembre 2025 : les seuils de 85 000 € (hébergement) et 37 500 € (autres services, comme une conciergerie) restent applicables en 2026.',
        },
      ],
    },
    cas: {
      lbl: 'Cas pratiques',
      h2Top: '3 situations',
      h2Em: 'avec verdict TVA',
      examples: [
        {
          titre: 'Studio à 18 000 € de CA, ménage + linge + petit-déjeuner',
          steps: [
            'CA annuel : 18 000 €',
            'Services para-hôteliers : OUI (3 critères remplis)',
            'Seuil de franchise hébergement : 85 000 €',
            'Verdict : franchise applicable',
            'Marge restante avant seuil : 67 000 €',
            'Tu ne factures pas la TVA, aucune déclaration TVA à faire',
          ],
        },
        {
          titre: 'Chambres d\'hôtes à 90 000 € de CA',
          steps: [
            'CA annuel : 90 000 €',
            'Au-dessus du seuil de 85 000 € mais sous le seuil majoré de 93 500 €',
            'Verdict : zone de tolérance',
            'Premier dépassement : tu restes en franchise cette année',
            'Si tu restes au-dessus de 85 000 € l\'an prochain, tu perds la franchise ; au-delà de 93 500 €, TVA due dès le jour du dépassement',
            'Surveille de près tes chiffres mensuels en fin d\'année',
          ],
        },
        {
          titre: 'Maison à 50 000 € de CA, location simple sans services',
          steps: [
            'CA annuel : 50 000 €',
            'Services para-hôteliers : NON (location meublée saisonnière)',
            'Régime applicable : exonérée de TVA (art. 261 D 4° du CGI)',
            'Verdict : aucune TVA à facturer, aucun seuil à surveiller',
            'Tu déclares uniquement en BIC (micro ou réel selon ton choix)',
            'Important : si tu proposes 3 services sur 4 (par exemple linge, ménage pendant le séjour et petit-déjeuner), tu bascules en para-hôtellerie et la franchise de 85 000 € s\'applique',
          ],
        },
      ],
    },
    faq: [
      {
        q: 'Quels services rendent une LCD soumise à la TVA ?',
        a: "L'administration considère qu'au moins 3 services parmi les 4 suivants caractérisent la para-hôtellerie : petit-déjeuner, nettoyage régulier des locaux pendant le séjour, fourniture du linge de maison, réception de la clientèle (même non personnalisée), pour des séjours de 30 nuits maximum. Il suffit que ces services soient proposés. En dessous de 3 services, ta location meublée est exonérée de TVA.",
      },
      {
        q: 'Quel est le seuil de franchise TVA en 2026 pour la LCD ?',
        a: "85 000 € de CA annuel pour la LCD avec services para-hôteliers (c'est une prestation d'hébergement), avec un seuil majoré de 93 500 € : un premier dépassement ne fait pas perdre la franchise tout de suite, mais au-delà de 93 500 € la TVA est due dès le jour du dépassement. Le seuil de 37 500 € concerne les autres prestations de services, comme une conciergerie.",
      },
      {
        q: 'La réforme 25 000 € est-elle applicable ?',
        a: "Non. La loi de finances 2025 prévoyait un seuil unique de 25 000 €, suspendu puis abandonné par la loi du 3 novembre 2025. En 2026, les seuils restent de 85 000 € pour l'hébergement et de 37 500 € pour les autres prestations de services.",
      },
      {
        q: 'Que se passe-t-il si je sors de la franchise TVA ?',
        a: "Tu demandes un numéro de TVA intracommunautaire à ton SIE. Tu factures la TVA à 10 % à tes voyageurs (LCD para-hôtelière), tu déclares la TVA (régime simplifié CA12 jusqu'en 2026, puis déclaration CA3 mensuelle ou trimestrielle à partir de 2027) et tu récupères la TVA sur tes dépenses pro (mobilier, travaux, énergie, etc.).",
      },
      {
        q: 'Suis-je redevable de la TVA si je n\'ai aucun service ?',
        a: "Non. Une location meublée saisonnière sans services para-hôteliers est exonérée de TVA (article 261 D 4° du CGI) : aucune TVA à facturer, aucun seuil à surveiller, peu importe le CA. Tu restes uniquement en BIC pour l'impôt sur le revenu.",
      },
      {
        q: 'Airbnb collecte-t-il la TVA pour moi ?',
        a: "Airbnb ne collecte pas la TVA française pour l'hôte (contrairement à la taxe de séjour). Si tu es redevable, c'est à toi de la facturer et déclarer. Airbnb facture sa propre TVA sur sa commission, récupérable si tu es toi-même redevable de la TVA.",
      },
    ],
  },
]

// ─── Template HTML ─────────────────────────────────────────────────────
function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;') }

function metaBadgeIcon(name) { return `<i class="ph ph-${name}"></i>` }

function buildPage(p) {
  const url = p.canonical
  const ldFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: p.faq.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
  const ldBc = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://jasonmarinho.com/' },
      { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://jasonmarinho.com/services' },
      { '@type': 'ListItem', position: 3, name: 'Simulateurs LCD', item: 'https://jasonmarinho.com/services/simulateurs' },
      { '@type': 'ListItem', position: 4, name: p.heroH1Top + ' ' + p.heroH1Em, item: url },
    ],
  }
  const ldApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: p.heroH1Top + ' ' + p.heroH1Em,
    description: p.metaDesc,
    url,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    creator: { '@type': 'Person', name: 'Jason Marinho', url: 'https://jasonmarinho.com' },
  }

  // Widget simulateur interactif spécifique à la page
  const widget = SIMULATOR_MAP[p.slug] ? SIMULATOR_MAP[p.slug]() : { html: '', script: '' }
  // Bloc conversion "Sans/Avec compte" sous le widget
  const vsType = SIMULATOR_VS_TYPE[p.slug] || 'fiscalite'
  const vsHtml = simulatorVsBlock(vsType)

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(p.title)} | Jason Marinho</title>
  <meta name="description" content="${escHtml(p.metaDesc)}">
  <link rel="canonical" href="${url}">
  <meta property="og:title" content="${escHtml(p.title)}">
  <meta property="og:description" content="${escHtml(p.metaDesc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="https://jasonmarinho.com/couverture-jason.webp">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://jasonmarinho.com/couverture-jason.webp">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Jason Marinho">
  <meta name="robots" content="index, follow">
  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="icon" type="image/png" sizes="32x32" href="/icon-192.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <meta name="theme-color" content="#004C3F">

  <link rel="stylesheet" href="/fonts/site-fonts.css">
  <link rel="stylesheet" href="/fonts/site-fonts.css">
  <noscript><link rel="stylesheet" href="/fonts/site-fonts.css"></noscript>
  <link rel="preload" as="font" type="font/woff2" href="/fonts/Phosphor.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2" href="/fonts/Phosphor-Bold.woff2" crossorigin>
  <link rel="stylesheet" type="text/css" href="/fonts/phosphor-bold-subset.css?v=a872f92e5a">
  <link rel="stylesheet" type="text/css" href="/fonts/phosphor-regular-subset.css?v=811eafe0e6">
  <style>
    :root{--g:#004C3F;--gd:#003329;--gm:#005A4A;--y:#FFD56B;--cr:#F7F5F0;--w:#FDFCF9;--td:#0F1A0D;--tm:#3D5038;--tl:#7A8C77;--bd:rgba(0,76,63,.10)}
    *,*::before,*::after{box-sizing:border-box} html{scroll-behavior:smooth}
    body{margin:0;padding-top:64px;font-family:'Outfit',sans-serif;background:var(--w);color:var(--td)}
    body::before{content:'';position:fixed;top:0;left:0;right:0;height:64px;background:var(--gd);z-index:100}
    img{max-width:100%;height:auto} a{color:inherit}
    .s-in{max-width:1100px;margin:0 auto;padding:0 clamp(16px,5vw,60px)}
    .sec{padding:clamp(56px,7vw,96px) 0} .sec.cr{background:var(--cr)} .sec.dk{background:var(--gd)}
    .lbl{display:inline-block;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,213,107,.7);margin-bottom:16px}
    .lbl.dk{color:var(--g)}
    .h1{font-family:'Fraunces',serif;font-size:clamp(2rem,4.5vw,3.5rem);line-height:1.12;letter-spacing:-.02em;color:#fff;margin:0 0 20px;font-weight:400}
    .h1 em{color:var(--y);font-style:italic;font-weight:300}
    .h2{font-family:'Fraunces',serif;font-size:clamp(1.6rem,3vw,2.4rem);line-height:1.15;letter-spacing:-.02em;margin:0 0 16px;font-weight:400;color:var(--td)}
    .h2.lt{color:#fff} .h2 em{color:var(--g);font-style:italic;font-weight:300} .h2.lt em{color:var(--y)}
    .h3{font-family:'Fraunces',serif;font-size:1.3rem;font-weight:500;color:var(--td);margin:0 0 10px;letter-spacing:-.01em}
    .sub{font-size:clamp(15px,1.5vw,17px);line-height:1.75;color:rgba(255,255,255,.65);margin:0 0 32px;max-width:680px}
    .sub.dk{color:var(--tm)} .sub.mx{max-width:760px}
    .btn-p{display:inline-flex;align-items:center;gap:8px;background:var(--y);color:var(--gd);font-weight:600;font-size:15px;padding:14px 26px;border-radius:10px;text-decoration:none;transition:background .2s,transform .2s,box-shadow .2s}
    .btn-p:hover{background:#ffe08f;transform:translateY(-2px);box-shadow:0 12px 32px rgba(255,213,107,.32)}
    .btn-ol{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.22);color:rgba(255,255,255,.78);font-weight:500;font-size:14px;padding:12px 22px;border-radius:10px;text-decoration:none;transition:all .2s}
    .btn-ol:hover{border-color:rgba(255,255,255,.55);color:#fff}
    .btn-g{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(0,76,63,.22);color:var(--g);font-weight:500;font-size:14px;padding:12px 22px;border-radius:10px;text-decoration:none;transition:all .2s}
    .btn-g:hover{background:var(--g);color:#fff;border-color:var(--g)}
    .chk{width:20px;height:20px;border-radius:50%;background:rgba(0,76,63,.10);display:flex;align-items:center;justify-content:center;color:var(--g);font-size:11px;flex-shrink:0}
    .hero{background:linear-gradient(160deg,#001a11 0%,var(--gd) 55%,#00463a 100%);padding:clamp(72px,10vw,120px) 0 clamp(56px,7vw,90px);position:relative;overflow:hidden}
    .hero::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 60% 70% at 78% 50%,rgba(255,213,107,.06),transparent 70%);pointer-events:none}
    .hero::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 50% 60% at 20% 100%,rgba(0,76,63,.5),transparent 70%);pointer-events:none}
    .hero-in{max-width:1100px;margin:0 auto;padding:0 clamp(16px,5vw,60px);position:relative;z-index:1}
    .hero-brd{display:flex;align-items:center;gap:6px;font-size:13px;color:rgba(255,255,255,.38);margin-bottom:32px;flex-wrap:wrap}
    .hero-brd a{color:rgba(255,255,255,.5);text-decoration:none;transition:color .2s} .hero-brd a:hover{color:#fff} .hero-brd span{font-size:11px}
    .meta-row{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}
    .meta-bd{display:flex;align-items:center;gap:6px;font-size:13px;color:rgba(255,255,255,.55);background:rgba(255,255,255,.06);border-radius:7px;padding:6px 12px}
    .meta-bd i{color:rgba(255,213,107,.55)}
    .two-col{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:start}
    @media(max-width:768px){.two-col{grid-template-columns:1fr;gap:36px}}
    .ck-list{list-style:none;padding:0;margin:20px 0;display:flex;flex-direction:column;gap:10px}
    .ck-list li{display:flex;align-items:flex-start;gap:12px;font-size:15px;line-height:1.5;color:var(--tm)}
    .ck-list li .chk{margin-top:2px}
    .item-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;margin-top:28px}
    .item-card{background:#fff;border:1px solid var(--bd);border-radius:16px;padding:24px;transition:box-shadow .2s,transform .2s}
    .item-card:hover{box-shadow:0 12px 32px rgba(0,76,63,.08);transform:translateY(-2px)}
    .item-card p{font-size:14px;line-height:1.65;color:var(--tm);margin:0}
    .case-list{display:flex;flex-direction:column;gap:22px;margin-top:28px}
    .case{background:#fff;border:1px solid var(--bd);border-radius:18px;padding:28px}
    .case-t{font-family:'Fraunces',serif;font-size:1.15rem;font-weight:500;color:var(--g);margin:0 0 14px;letter-spacing:-.01em}
    .case ol{margin:0;padding:0 0 0 22px;color:var(--tm);font-size:14.5px;line-height:1.7}
    .case ol li{margin-bottom:5px}
    .faq-list{display:flex;flex-direction:column;gap:14px;margin-top:28px}
    .faq-it{background:#fff;border:1px solid var(--bd);border-radius:14px;padding:22px 26px}
    .faq-it summary{font-family:'Fraunces',serif;font-size:1.05rem;font-weight:500;color:var(--td);cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:14px}
    .faq-it summary::-webkit-details-marker{display:none}
    .faq-it summary::after{content:'+';font-family:'Outfit',sans-serif;font-size:1.4rem;font-weight:300;color:var(--g);transition:transform .2s}
    .faq-it[open] summary::after{transform:rotate(45deg)}
    .faq-it p{margin:14px 0 0;font-size:14.5px;line-height:1.7;color:var(--tm)}
    .cta-ban{background:linear-gradient(135deg,#001a11,var(--gd));border-radius:22px;padding:clamp(36px,5vw,56px);text-align:center;color:#fff}
    .rel-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;max-width:1000px;margin:24px auto 0}
    .rel-card{display:flex;flex-direction:column;gap:8px;background:var(--w);border:1px solid var(--bd);border-radius:14px;padding:20px;text-decoration:none;color:inherit;transition:all .2s}
    .rel-card:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(0,76,63,.08);border-color:rgba(0,76,63,.18)}
    .rel-ic{width:38px;height:38px;border-radius:10px;background:var(--cr);display:flex;align-items:center;justify-content:center;color:var(--g);font-size:18px;flex-shrink:0}
    .rel-card:hover .rel-ic{background:var(--g);color:var(--y)}
    .rel-k{font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--tl);margin-top:6px}
    .rel-t{font-family:'Fraunces',serif;font-size:15.5px;font-weight:500;color:var(--td);line-height:1.3}
    .rel-d{font-size:13px;color:var(--tm);line-height:1.5}
${SIMULATOR_CSS}
${SIMULATOR_VS_CSS}
  </style>
  <script type="application/ld+json">${JSON.stringify(ldApp)}</script>
  <script type="application/ld+json" data-schema-bc>${JSON.stringify(ldBc)}</script>
  <script type="application/ld+json" data-schema-faq>${JSON.stringify(ldFaq)}</script>
  <script defer src="/nav.js"></script>
</head>
<body>

<header class="hero">
  <div class="hero-in">
    <div class="hero-brd" aria-label="Fil d'Ariane">
      <a href="/">Accueil</a><span>›</span><a href="/services">Services</a><span>›</span><a href="/services/simulateurs">Simulateurs LCD</a><span>›</span><span>${escHtml(p.heroH1Top + ' ' + p.heroH1Em)}</span>
    </div>
    <div class="lbl">${escHtml(p.heroLabel)}</div>
    <h1 class="h1">${escHtml(p.heroH1Top)}<br><em>${escHtml(p.heroH1Em)}</em></h1>
    <p class="sub">${escHtml(p.heroSub)}</p>
    <div class="meta-row">
      ${p.metaBadges.map(b => `<div class="meta-bd">${metaBadgeIcon(b.icon)} ${escHtml(b.text)}</div>`).join('\n      ')}
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:28px">
      <a href="https://app.jasonmarinho.com${p.appPath}" class="btn-p">Lancer le simulateur <i class="ph-bold ph-arrow-right"></i></a>
      <a href="https://app.jasonmarinho.com/auth/register" class="btn-ol">Créer un compte gratuit</a>
    </div>
  </div>
</header>

<section class="sec" style="padding-top:clamp(32px,4vw,48px);padding-bottom:0">
  <div class="s-in">
    ${widget.html}
    ${vsHtml}
  </div>
</section>

<section class="sec" id="explication">
  <div class="s-in">
    <div class="two-col">
      <div>
        <div class="lbl dk">${escHtml(p.intro.lbl)}</div>
        <h2 class="h2">${escHtml(p.intro.h2Top)}<br><em>${escHtml(p.intro.h2Em)}</em></h2>
        ${p.intro.paras.map(t => `<p style="font-size:16px;line-height:1.8;color:var(--tm);margin:0 0 16px">${escHtml(t)}</p>`).join('\n        ')}
      </div>
      <div>
        <div class="lbl dk">Ce que tu obtiens</div>
        <h2 class="h2">Un résultat <em>clair, instantané, gratuit</em></h2>
        <ul class="ck-list">
          ${p.intro.checklist.map(c => `<li><div class="chk"><i class="ph-bold ph-check"></i></div>${escHtml(c)}</li>`).join('\n          ')}
        </ul>
        <a href="https://app.jasonmarinho.com${p.appPath}" class="btn-g" style="margin-top:18px">Lancer le simulateur <i class="ph-bold ph-arrow-right"></i></a>
      </div>
    </div>
  </div>
</section>

<section class="sec cr">
  <div class="s-in">
    <div class="lbl dk">${escHtml(p.formules.lbl)}</div>
    <h2 class="h2">${escHtml(p.formules.h2Top)} <em>${escHtml(p.formules.h2Em)}</em></h2>
    <div class="item-grid">
      ${p.formules.items.map(it => `<div class="item-card"><h3 class="h3">${escHtml(it.h)}</h3><p>${escHtml(it.desc)}</p></div>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="sec">
  <div class="s-in">
    <div class="lbl dk">${escHtml(p.cas.lbl)}</div>
    <h2 class="h2">${escHtml(p.cas.h2Top)} <em>${escHtml(p.cas.h2Em)}</em></h2>
    <div class="case-list">
      ${p.cas.examples.map(c => `<article class="case"><h3 class="case-t">${escHtml(c.titre)}</h3><ol>${c.steps.map(s => `<li>${escHtml(s)}</li>`).join('')}</ol></article>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="sec cr">
  <div class="s-in">
    <div class="lbl dk">Questions fréquentes</div>
    <h2 class="h2">FAQ <em>simulateur</em></h2>
    <div class="faq-list">
      ${p.faq.map(f => `<details class="faq-it"><summary>${escHtml(f.q)}</summary><p>${escHtml(f.a)}</p></details>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="sec">
  <div class="s-in">
    <div class="cta-ban">
      <h2 class="h2 lt" style="margin:0 auto 14px;max-width:600px;text-align:center">Prêt à <em>chiffrer ta décision</em> en 30 secondes ?</h2>
      <p style="font-size:15px;line-height:1.7;color:rgba(255,255,255,.7);margin:0 auto 28px;max-width:540px;text-align:center">Crée un compte gratuit et accède au simulateur complet, préfilé avec tes vrais logements et tes vrais chiffres.</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">
        <a href="https://app.jasonmarinho.com/auth/register" class="btn-p">Créer mon compte gratuit <i class="ph-bold ph-arrow-right"></i></a>
        <a href="https://app.jasonmarinho.com${p.appPath}" class="btn-ol">Voir le simulateur</a>
      </div>
    </div>
  </div>
</section>

<section class="sec cr">
  <div class="s-in">
    <div style="text-align:center;margin-bottom:8px">
      <div class="lbl dk">Aller plus loin</div>
      <h2 class="h2">Les autres <em>simulateurs LCD</em></h2>
    </div>
    <div class="rel-grid">
      <a href="/services/simulateurs" class="rel-card">
        <div class="rel-ic"><i class="ph ph-calculator"></i></div>
        <div class="rel-k">Catalogue</div>
        <div class="rel-t">Les 4 simulateurs</div>
        <div class="rel-d">Vue d'ensemble des outils fiscaux et de pilotage gratuits pour hôtes LCD.</div>
      </a>
      <a href="/services/guides-lcd" class="rel-card">
        <div class="rel-ic"><i class="ph ph-books"></i></div>
        <div class="rel-k">Ressources</div>
        <div class="rel-t">Guides LCD</div>
        <div class="rel-d">Fiscalité, réglementation, tarification : tous les guides pour comprendre.</div>
      </a>
      <a href="/services/formations" class="rel-card">
        <div class="rel-ic"><i class="ph ph-graduation-cap"></i></div>
        <div class="rel-k">Formation</div>
        <div class="rel-t">Formations LCD</div>
        <div class="rel-d">Va plus loin avec les formations dédiées hôtes débutants et confirmés.</div>
      </a>
      <a href="/calculateurs" class="rel-card">
        <div class="rel-ic"><i class="ph ph-chart-line-up"></i></div>
        <div class="rel-k">Marché</div>
        <div class="rel-t">Calculateurs marché</div>
        <div class="rel-d">Estime tes revenus, trouve le bon prix, compare 83 villes européennes.</div>
      </a>
    </div>
  </div>
</section>

<script defer src="/footer.js"></script>
<script>${widget.script}</script>
</body>
</html>
`
}

// ─── Écriture ──────────────────────────────────────────────────────────
let written = 0
for (const p of PAGES) {
  const dir = path.join(ROOT, 'services', 'simulateurs', p.slug)
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, 'index.html')
  fs.writeFileSync(file, buildPage(p))
  console.log(`  ✓ services/simulateurs/${p.slug}/index.html`)
  written++
}
console.log(`\n${written} sous-pages générées.`)
