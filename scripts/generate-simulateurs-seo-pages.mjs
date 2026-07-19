#!/usr/bin/env node
// Génère 4 sous-pages SEO de /services/simulateurs/ :
//  - fiscalite-micro-bic/                  (Simulateur fiscalité micro-BIC LCD)
//  - choisir-statut-ei-sasu/                (Simulateur EI vs SASU pour la LCD)
//  - rentabilite-location-courte-duree/     (Simulateur rentabilité LCD)
//  - taxe-de-sejour/                        (Simulateur taxe de séjour par ville)
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
    metaDesc: 'Calcule ton imposition micro-BIC selon ton CA LCD et le classement de ton meublé. Abattement 30 % (non classé) vs 50 % (classé Atout France), plafonds 15 k€ et 77,7 k€, économie potentielle. Gratuit.',
    canonical: 'https://jasonmarinho.com/services/simulateurs/fiscalite-micro-bic',
    appPath: '/dashboard/simulateurs?tab=fiscal',
    heroLabel: 'Outil gratuit · Fiscalité LCD',
    heroH1Top: 'Simulateur fiscalité',
    heroH1Em: 'micro-BIC pour la LCD',
    heroSub: "Calcule ta base imposable en quelques secondes selon ton chiffre d'affaires et le classement Atout France. Identifie l'économie réelle d'un classement (abattement 50 % au lieu de 30 %), vérifie que tu restes sous le plafond du micro et compare avec le régime réel simplifié.",
    metaBadges: [
      { icon: 'currency-eur', text: 'CA jusqu\'à 100 k€' },
      { icon: 'gauge', text: 'Plafonds 15 k€ / 77,7 k€' },
      { icon: 'percent', text: 'Abattement 30 % / 50 %' },
      { icon: 'check-circle', text: 'Conforme 2026' },
    ],
    intro: {
      lbl: 'Pourquoi cet outil',
      h2Top: 'La fiscalité LCD',
      h2Em: "n'est pas qu'une question d'abattement",
      paras: [
        "Sous le régime micro-BIC, ton bénéfice imposable est calculé en appliquant un abattement forfaitaire à ton chiffre d'affaires. Cet abattement vaut 30 % par défaut, 50 % si ton meublé est classé Atout France (1 à 5 étoiles) ou labellisé tourisme. La différence est massive : sur 40 000 € de CA, le bénéfice passe de 28 000 € à 11 600 €, soit 16 400 € de base en moins.",
        "Mais ce n'est pas la seule variable. Tu as deux plafonds à surveiller (15 000 € pour les meublés non classés depuis 2025, 77 700 € pour les meublés classés et chambres d'hôtes), une option pour le versement libératoire (sous condition de RFR), et le choix de basculer vers le régime réel simplifié si tes charges réelles dépassent l'abattement.",
        "Ce simulateur fait tous ces calculs d'un coup et te dit : ton bénéfice imposable, ton impôt sur le revenu approximatif, ton économie en cas de classement, et si tu devrais envisager le réel.",
      ],
      checklist: [
        "Calcul automatique selon classement Atout France",
        "Détection des dépassements de plafonds (15 k€ / 77,7 k€)",
        "Comparaison micro-BIC vs réel simplifié",
        "Suggestion versement libératoire si RFR éligible",
      ],
    },
    formules: {
      lbl: 'Comment ça se calcule',
      h2Top: 'Formules officielles',
      h2Em: 'utilisées par le simulateur',
      items: [
        {
          h: 'Base imposable',
          desc: "Base = CA × (1 − abattement). L'abattement est de 30 % pour un meublé non classé, 50 % pour un meublé classé Atout France ou labellisé tourisme. Minimum 305 € d'abattement, sinon CA entier imposé.",
        },
        {
          h: 'Plafond micro-BIC',
          desc: "Tu dois rester sous 15 000 € de CA pour un meublé non classé (depuis 2025, loi de finances), 77 700 € pour un meublé classé et chambres d'hôtes. Au-dessus, bascule automatique au réel.",
        },
        {
          h: 'Impôt sur le revenu',
          desc: "IR = Base × TMI. Le TMI dépend de ton revenu imposable global et de ton quotient familial. Les tranches 2026 retenues : 0 %, 11 %, 30 %, 41 %, 45 %.",
        },
        {
          h: 'Versement libératoire',
          desc: "Option ouverte si RFR du foyer ≤ 27 478 € (1 part), 54 956 € (2 parts), 82 434 € (3 parts). Taux fixe 1 % du CA en LCD classé, qui solde IR + cotisations forfaitaires.",
        },
        {
          h: 'Régime réel simplifié',
          desc: "Si tes charges déductibles (intérêts, amortissements, eau, assurance, copro, ménage) dépassent l'abattement micro, le réel est plus avantageux. Le simulateur fait la bascule automatique.",
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
            'Base imposable : 14 000 × 29 % = 4 060 €',
            "TMI 30 % → IR estimé : 1 218 €",
            'Sans classement (abattement 30 %) : IR aurait été 2 940 €',
            "Gain net du classement : 1 722 €/an, sur ~250 € de frais de classement (rentabilisé en 2 mois)",
          ],
        },
        {
          titre: 'T2 non classé à 22 000 € de CA',
          steps: [
            'CA annuel : 22 000 €',
            'Meublé non classé → plafond micro 15 000 € dépassé',
            'Bascule automatique au régime réel simplifié',
            "Charges réelles déductibles estimées : 9 500 € (intérêts crédit, copro, eau, ménage, amortissement mobilier)",
            'Bénéfice réel : 12 500 €',
            'IR (TMI 30 %) : 3 750 €',
            "Avec classement 50 % et passage en chambre d'hôtes ou meublé classé : base aurait été 6 380 €, IR 1 914 €",
            "Conseil simulateur : envisager le classement pour rester en micro avec plafond 77,7 k€",
          ],
        },
        {
          titre: 'Maison classée 4★ à 65 000 € de CA',
          steps: [
            'CA annuel : 65 000 €',
            "Classement Atout France 4★ → abattement 50 %",
            'Base imposable : 65 000 × 29 % = 18 850 €',
            "TMI 30 % → IR estimé : 5 655 €",
            'Cotisations sociales TNS (URSSAF) : ~22 % du bénéfice si dépassement seuil 23 000 €',
            "Avec versement libératoire 1 % (RFR foyer < 54 956 € pour 2 parts) : 650 € de plus à payer mais solde IR + cotisations forfaitaires",
            "Conseil simulateur : si TMI 30 %+ et RFR éligible, le versement libératoire est presque toujours gagnant",
          ],
        },
      ],
    },
    faq: [
      {
        q: 'Quel abattement micro-BIC en 2026 pour la location courte durée ?',
        a: "30 % pour un meublé de tourisme non classé (avec plafond 15 000 € de CA depuis la loi de finances 2025), 50 % pour un meublé classé Atout France 1 à 5 étoiles ou labellisé tourisme (avec plafond 77 700 €). Les chambres d'hôtes sont passées à 50 % (décision CE du 16/09/2025) avec plafond 77 700 €.",
      },
      {
        q: "Comment se faire classer Atout France pour bénéficier de l'abattement 50 % ?",
        a: "Tu mandates un organisme agréé (Cofrac), il fait l'inspection sur place (15 critères qualité), tu reçois ton classement officiel valable 5 ans. Coût moyen : 200 à 400 € selon la taille du logement. Le classement s'active immédiatement, l'abattement 50 % s'applique sur le CA de l'année.",
      },
      {
        q: "Le micro-BIC est-il toujours plus avantageux que le réel simplifié ?",
        a: "Non. Si tes charges déductibles réelles (intérêts d'emprunt, amortissement du mobilier, copropriété, eau, assurance, frais de ménage, abonnements iCal) dépassent l'abattement forfaitaire, le réel est plus avantageux. C'est souvent le cas pour les hôtes avec crédit immobilier en cours.",
      },
      {
        q: "Qu'est-ce que le versement libératoire et qui peut en profiter ?",
        a: "C'est une option qui te permet de payer ton IR au fil de l'eau avec un taux fixe (1 % du CA en LCD classé, 1,7 % en non classé). Tu y as droit si le RFR du foyer fiscal de l'avant-dernière année est sous 27 478 € (1 part), 54 956 € (2 parts) ou 82 434 € (3 parts). Avantage : c'est définitif, pas de régularisation en mai.",
      },
      {
        q: "Que se passe-t-il si je dépasse le plafond du micro-BIC en cours d'année ?",
        a: "Tu bascules automatiquement au régime réel simplifié dès l'année suivante (ou immédiatement si dépassement du plafond majoré sur 2 ans consécutifs). Plus de bénéfice de l'abattement forfaitaire, mais tu déduis toutes tes charges réelles, ce qui peut être beaucoup plus avantageux selon ton profil.",
      },
      {
        q: "Faut-il déclarer ses revenus LCD même en dessous de 15 000 € ?",
        a: "Oui. Tout revenu LCD doit être déclaré, peu importe le montant. La case 5ND (BIC pro non pros) ou 5NP (BIC pros) de ta 2042-C-PRO selon ton statut LMNP / LMP. L'oubli déclenche des redressements URSSAF + DGFiP avec intérêts de retard.",
      },
    ],
  },

  {
    slug: 'choisir-statut-ei-sasu',
    title: 'Simulateur EI vs SASU pour la LCD : net en poche, cotisations, dividendes',
    metaDesc: 'Compare net en poche entre EI au réel (cotisations TNS + IR) et SASU 100 % dividendes (IS + flat tax 30 %). Inclut protection sociale, retraite, charges déductibles. Pour hôtes LCD jusqu\'à 150 k€ de bénéfice.',
    canonical: 'https://jasonmarinho.com/services/simulateurs/choisir-statut-ei-sasu',
    appPath: '/dashboard/simulateurs?tab=statut',
    heroLabel: 'Outil gratuit · Statut juridique',
    heroH1Top: 'Simulateur',
    heroH1Em: 'EI vs SASU pour la LCD',
    heroSub: "Quel statut juridique te laisse le plus à la fin ? EI au régime réel (cotisations TNS + impôt sur le revenu) versus SASU 100 % dividendes (impôt sur les sociétés + flat tax 30 %). Le simulateur compare le net en poche, la protection sociale, et la retraite.",
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
        "Calcul SASU 100 % dividendes : bénéfice − IS − flat tax 30 %",
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
          desc: "Bénéfice − cotisations TNS (~30 à 45 % selon URSSAF, CIPAV ou SSI) − IR au TMI. Tu cotises pour la retraite et la maladie, mais tes charges sociales sont élevées.",
        },
        {
          h: 'SASU 100 % dividendes',
          desc: "Bénéfice − impôt sur les sociétés (15 % jusqu'à 42 500 €, 25 % au-delà) − flat tax 30 % (PFU = 12,8 % IR + 17,2 % prélèvements sociaux) sur les dividendes versés. Aucune cotisation sociale (zéro trimestre retraite acquis).",
        },
        {
          h: 'SASU avec salaire (option C)',
          desc: "Tu te verses un salaire de président → cotisations assimilé salarié (~80 %) → tu acquiers des droits retraite régime général. Le reste du bénéfice peut sortir en dividendes (flat tax 30 %).",
        },
        {
          h: 'Quand bascule EI → SASU',
          desc: "Le point de bascule théorique se situe entre 60 000 € et 80 000 € de bénéfice annuel selon ton TMI et ton besoin de protection sociale. En dessous, l'EI au réel est généralement plus simple et meilleur en net.",
        },
        {
          h: 'CFE, impôt forfaitaire, taxe foncière',
          desc: "Le simulateur intègre la CFE (cotisation foncière des entreprises, ~250 à 1 200 € selon ville) et signale les autres frais fixes (compte bancaire pro, comptable, expert-comptable obligatoire en SASU à partir d'un certain seuil).",
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
            "SASU 100 % dividendes : 30 000 € − IS 15 % : 4 500 € − flat tax 30 % sur 25 500 € : 7 650 €",
            "Net en poche SASU : ~17 850 € (− 840 € vs EI)",
            "Verdict : EI gagnant, plus simple, protection sociale acquise",
          ],
        },
        {
          titre: 'Bénéfice 70 000 € : verdict : à arbitrer',
          steps: [
            "EI au réel : 70 000 € − cotisations TNS ~22 400 € − IR TMI 30 % : 14 280 €",
            "Net en poche EI : ~33 320 €",
            "SASU 100 % dividendes : 70 000 € − IS 15 %/25 % : ~14 250 € − flat tax 30 % sur 55 750 € : 16 725 €",
            "Net en poche SASU : ~39 025 € (+ 5 705 € vs EI)",
            "Verdict : SASU gagne en net, mais zéro cotisation retraite. Si tu n'as pas d'autre activité salariée, choix risqué",
          ],
        },
        {
          titre: 'Bénéfice 120 000 € : verdict : SASU',
          steps: [
            "EI au réel : 120 000 € − cotisations TNS ~42 000 € − IR TMI 41 % : 31 980 €",
            "Net en poche EI : ~46 020 €",
            "SASU 100 % dividendes : 120 000 € − IS 15 %/25 % : ~28 750 € − flat tax 30 % sur 91 250 € : 27 375 €",
            "Net en poche SASU : ~63 875 € (+ 17 855 € vs EI)",
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
        a: "Oui. La SASU permet au président de ne pas se verser de salaire. Tu paies l'IS sur le bénéfice, puis tu distribues des dividendes à toi-même (actionnaire unique) avec la flat tax de 30 %. Aucun salaire = aucune cotisation = aucun droit retraite acquis sur cette activité. C'est légal mais à compenser par un PER ou une autre activité salariée.",
      },
      {
        q: "Quels sont les frais fixes de la SASU pour la LCD ?",
        a: "CFE (~250 à 1 200 €), compte bancaire pro (~50 €/an), expert-comptable (~1 200 à 2 500 € selon volume), CFE de chambre de commerce sur première année. Total à prévoir : 2 000 à 4 000 €/an de frais fixes incompressibles. Cela explique pourquoi la SASU n'est rentable qu'à partir d'un certain bénéfice.",
      },
      {
        q: "Peut-on passer d'EI à SASU sans tout perdre ?",
        a: "Oui. Tu crées la SASU, tu apportes ton ancienne activité (apport en nature avec valeur d'expert si besoin), tu radies l'EI. Les biens immobiliers ne peuvent généralement pas être apportés à la SASU (ce serait une SCI), c'est l'activité de gestion et le matériel mobilier qui sont transférés.",
      },
      {
        q: "Y a-t-il un seuil de bénéfice où la SASU devient automatiquement plus rentable ?",
        a: "Pas de seuil universel, mais un point de bascule moyen vers 60 000 à 80 000 € de bénéfice annuel, à condition d'avoir un TMI à 30 % ou plus et de pouvoir compenser la perte de protection sociale (PER, autre activité salariée, conjoint salarié).",
      },
      {
        q: "Le simulateur prend-il en compte la CSG-CRDS et les prélèvements sociaux ?",
        a: "Oui. La flat tax SASU de 30 % inclut 17,2 % de prélèvements sociaux (CSG + CRDS + prélèvement de solidarité). Côté EI, les cotisations TNS incluent maladie, retraite, allocations familiales, CSG-CRDS, et la cotisation à la CIPAV pour les libérales (ou SSI pour les commerciaux).",
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
    heroSub: "Mode opérationnel : ton revenu net mensuel selon prix par nuit, occupation, commission, charges. Mode investissement : cash-flow après crédit, rentabilité brute, rentabilité nette nette. Pour décider si ton bien LCD vaut le coup, sans illusions de chiffres bruts.",
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
        "Bonus : le simulateur signale les ratios qui indiquent une rentabilité fragile (taux d'effort > 40 %, rentabilité nette < 4 %) et compare ton bien à des standards du marché.",
      ],
      checklist: [
        "Mode opérationnel : revenu net mensuel post-charges",
        "Mode investissement : cash-flow + rentabilité brute + nette",
        "Commissions plateforme paramétrables",
        "Alertes ratios fragiles (taux d'effort, ROI)",
      ],
    },
    formules: {
      lbl: 'Comment ça se calcule',
      h2Top: 'Les 4 ratios',
      h2Em: 'qui comptent vraiment',
      items: [
        {
          h: "Revenu brut LCD",
          desc: "Revenu brut = ADR × nb_nuits_louées × (1 − commission_plateforme). L'ADR moyen et le taux d'occupation sont les deux variables critiques. Une variation de 10 % d'occupation change ton revenu brut de 10 %.",
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
            "Cash-flow mensuel : (16 425 × 0,85 / 12) − 542 − (3 200 / 12) = 90 €",
            "Rentabilité nette nette : (10 761 − impôt micro-BIC ~1 800 €) / 145 000 € (achat + frais) = 6,2 %",
            "Verdict : bon dossier, cash-flow légèrement positif, rentabilité nette nette honorable",
          ],
        },
        {
          titre: "T2 Lyon 35 m², achat 240 000 €",
          steps: [
            "Apport 50 000 € + prêt 190 000 € sur 25 ans à 3,8 % → mensualité 982 €",
            "ADR moyen 95 €, occupation 65 % → 22 526 € CA brut/an",
            "Commission OTAs 15 %, charges courantes 4 500 €/an",
            "Revenu net annuel : 22 526 × 0,85 − 4 500 = 14 647 €",
            "Cash-flow mensuel : (22 526 × 0,85 / 12) − 982 − (4 500 / 12) = 238 €",
            "Rentabilité nette nette : (14 647 − impôt ~2 800 €) / 263 000 € = 4,5 %",
            "Verdict : cash-flow correct mais rentabilité nette nette serrée, vise classement Atout France pour économiser sur l'impôt",
          ],
        },
        {
          titre: 'Maison Honfleur 80 m², achat 380 000 €',
          steps: [
            'Apport 80 000 € + prêt 300 000 € sur 25 ans à 3,8 % → mensualité 1 549 €',
            'ADR moyen 165 €, occupation 58 % → 34 925 € CA brut/an',
            "Commission OTAs 12 % (mix réservations directes via Driing), charges courantes 6 800 €/an",
            "Revenu net annuel : 34 925 × 0,88 − 6 800 = 23 934 €",
            "Cash-flow mensuel : (34 925 × 0,88 / 12) − 1 549 − (6 800 / 12) = 414 €",
            "Rentabilité nette nette : (23 934 − impôt classé 50 % ~2 100 €) / 415 000 € = 5,3 %",
            "Verdict : excellent dossier, cash-flow solide, classement Atout France indispensable pour optimiser",
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
        a: "Oui. Tu paramètres charges courantes (eau, énergie, ménage, internet, assurance), charges fixes (copropriété, taxe foncière, CFE), et provision impôt/cotisations. Le simulateur affiche un net mensuel honnête, pas un brut trompeur.",
      },
    ],
  },

  {
    slug: 'taxe-de-sejour',
    title: 'Simulateur taxe de séjour LCD : barème par ville, classement, durée',
    metaDesc: 'Calcule la taxe de séjour à collecter sur tes voyageurs selon la ville (top 30 France), le classement de ton meublé, le nombre d\'adultes et la durée. Barèmes 2026 officiels, exemptions, taxe départementale + 10 %.',
    canonical: 'https://jasonmarinho.com/services/simulateurs/taxe-de-sejour',
    appPath: '/dashboard/simulateurs?tab=taxe',
    heroLabel: 'Outil gratuit · Taxe de séjour',
    heroH1Top: 'Simulateur',
    heroH1Em: 'taxe de séjour par ville',
    heroSub: "La taxe de séjour est une obligation légale, et son calcul varie par ville, par classement et par nuit. Le simulateur applique les barèmes 2026 des 30 plus grandes villes françaises, gère la taxe additionnelle départementale et signale les exemptions (mineurs, séjour > 30 nuits).",
    metaBadges: [
      { icon: 'map-pin', text: '30 villes FR' },
      { icon: 'star', text: 'Non classé / 1-2★ / 3★ / 4-5★' },
      { icon: 'plus', text: 'Taxe départementale + 10 %' },
      { icon: 'users', text: 'Exemptions mineurs' },
    ],
    intro: {
      lbl: 'Pourquoi cet outil',
      h2Top: 'La taxe de séjour est',
      h2Em: 'collectée par tes soins',
      paras: [
        "Que tu loues via Airbnb, Booking, Vrbo, ton site direct ou Driing, la taxe de séjour est dûe à la commune par voyageur et par nuit. Elle est collectée soit par toi directement (réservations directes, certaines OTAs comme Vrbo selon les villes), soit par la plateforme et reversée à la commune (Airbnb dans les villes où l'accord existe).",
        "Le piège : les barèmes varient à la fois par ville et par catégorie de meublé. Un T2 à Paris non classé : 1,55 €/nuit/adulte. Le même classé 4★ : 6,33 €/nuit/adulte. Et la taxe additionnelle départementale (10 %) s'ajoute encore.",
        "Le simulateur applique le bon barème automatiquement et te donne le montant total à collecter pour un séjour donné. Pratique pour facturer correctement, et pour préparer les versements semestriels à la mairie.",
      ],
      checklist: [
        "Barèmes 2026 des 30 plus grandes villes françaises",
        "Distinction non classé / classé 1-2★ / 3★ / 4-5★",
        "Taxe additionnelle départementale +10 % automatique",
        "Exemptions mineurs et séjours longue durée",
      ],
    },
    formules: {
      lbl: 'Comment ça se calcule',
      h2Top: 'La formule officielle',
      h2Em: 'taxe de séjour 2026',
      items: [
        {
          h: 'Taxe communale par nuit',
          desc: "Tarif fixé par délibération communale, par catégorie de meublé. Plafonnée par la loi (de 0,22 €/nuit pour un terrain de camping à 4,30 €/nuit pour un palace en zone tendue, hors taxe départementale).",
        },
        {
          h: 'Taxe additionnelle départementale',
          desc: "Égale à 10 % de la taxe communale, fixée par le conseil départemental. S'ajoute systématiquement dans les départements qui l'ont votée (la majorité).",
        },
        {
          h: 'Taxe additionnelle régionale Île-de-France',
          desc: "Spécifique IDF : 15 % supplémentaires sur la taxe communale, depuis la loi Grand Paris. Le simulateur applique automatiquement pour Paris, Boulogne-Billancourt, Versailles, etc.",
        },
        {
          h: 'Exemptions légales',
          desc: "Les mineurs (< 18 ans) sont exemptés totalement. Les bénéficiaires d'un hébergement d'urgence ou temporaire (loi DALO) aussi. Les séjours > 30 nuits consécutives pour un même voyageur ne sont pas soumis à la taxe (résidence assimilée).",
        },
        {
          h: 'Cas Airbnb',
          desc: "Airbnb collecte et reverse directement à la majorité des communes françaises (accord national). Tu n'as rien à faire côté Airbnb, mais tu restes responsable pour Booking (mixte selon la ville), Vrbo (à toi de collecter), et tes réservations directes.",
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
            "Tarif Paris non classé : 1,55 €/nuit/adulte",
            "Taxe additionnelle départementale (Paris) : 10 %",
            "Taxe additionnelle régionale (IDF) : 15 %",
            "Taxe par adulte par nuit : 1,55 × 1,25 = 1,94 €",
            "Taxe totale : 1,94 × 2 adultes × 4 nuits = 15,52 €",
            "Tu peux la facturer en supplément sur ton tarif final voyageur",
          ],
        },
        {
          titre: 'T2 à Lyon classé 3★, 3 adultes, 5 nuits',
          steps: [
            "Tarif Lyon classé 3★ : 1,53 €/nuit/adulte",
            "Taxe additionnelle départementale (Rhône) : 10 %",
            "Taxe par adulte par nuit : 1,53 × 1,10 = 1,68 €",
            "Taxe totale : 1,68 × 3 adultes × 5 nuits = 25,20 €",
            "Si Airbnb gère la collecte automatique (Lyon est dans l'accord), rien à faire de ton côté",
          ],
        },
        {
          titre: 'Maison à Bordeaux classée 4★, 4 adultes + 1 enfant, 7 nuits',
          steps: [
            "Tarif Bordeaux classé 4★ : 2,42 €/nuit/adulte",
            "Taxe additionnelle départementale (Gironde) : 10 %",
            "Taxe par adulte par nuit : 2,42 × 1,10 = 2,66 €",
            "L'enfant (< 18 ans) est exempté",
            "Taxe totale : 2,66 × 4 adultes × 7 nuits = 74,48 €",
            "À reverser à la mairie semestriellement ou via la plateforme",
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
        a: "Oui, dans la quasi-totalité des communes françaises depuis 2019 (accord national). Tu retrouves le montant collecté dans tes relevés Airbnb. Booking, Vrbo et autres OTAs ont des accords variables selon la ville, vérifie systématiquement. Pour tes réservations directes (site, Driing), c'est à toi de collecter.",
      },
      {
        q: "Comment connaître le barème exact de ma commune ?",
        a: "Trois sources fiables : ton compte personnel sur taxesejour.fr (portail officiel), la délibération du conseil municipal (disponible en mairie ou sur le site de la ville), et le simulateur que je propose qui regroupe les 30 plus grandes villes françaises avec les barèmes 2026.",
      },
      {
        q: "Quelles sont les exemptions à la taxe de séjour ?",
        a: "Mineurs (< 18 ans) totalement exemptés. Bénéficiaires d'un hébergement d'urgence ou temporaire (loi DALO). Saisonniers titulaires d'un contrat de travail. Séjours dépassant 30 nuits consécutives pour un même voyageur (assimilation résidence). Le simulateur applique automatiquement l'exemption mineurs.",
      },
      {
        q: "Que se passe-t-il si je ne collecte pas la taxe de séjour ?",
        a: "Tu deviens redevable à la place du voyageur. Amende possible jusqu'à 2 500 €. En cas de contrôle (DGFiP, communes touristiques), la mairie peut te réclamer plusieurs années de taxe non collectée plus intérêts. Aucun intérêt à ne pas collecter, c'est neutre pour ton compte de résultat.",
      },
      {
        q: "Comment reverser la taxe de séjour à la mairie ?",
        a: "La majorité des communes utilisent taxesejour.fr (portail dédié), où tu déclares chaque trimestre ou semestre le nombre de nuitées et la taxe collectée. Tu reçois ensuite un avis et paies par virement. Si Airbnb collecte automatiquement, la part Airbnb est reversée directement par la plateforme, tu n'as à déclarer que ta part Booking/directe.",
      },
    ],
  },

  {
    slug: 'franchise-tva-lcd',
    title: 'Simulateur franchise TVA LCD : seuils 2026, services para-hôteliers',
    metaDesc: "Vérifie ta franchise en base de TVA selon ton CA LCD et tes services. Seuils 2026 (37 500 € / 41 250 €), distinction location simple vs LCD para-hôtelière, alerte automatique. Gratuit.",
    canonical: 'https://jasonmarinho.com/services/simulateurs/franchise-tva-lcd',
    appPath: '/dashboard/simulateurs#tva',
    heroLabel: 'Outil gratuit · Franchise TVA',
    heroH1Top: 'Simulateur',
    heroH1Em: 'franchise TVA pour la LCD',
    heroSub: "Suis-je en franchise de TVA ? Quel seuil pour la LCD avec services para-hôteliers ? Le simulateur applique les barèmes 2026 et signale si tu dois facturer la TVA ou rester en dispense. Cas particulier des services hôteliers traité explicitement.",
    metaBadges: [
      { icon: 'currency-eur', text: 'Seuils 37,5 k€ / 41,25 k€' },
      { icon: 'check-circle', text: 'LCD avec ou sans services' },
      { icon: 'percent', text: 'TVA 10 % LCD hôtelier' },
      { icon: 'warning-octagon', text: 'Alerte dépassement' },
    ],
    intro: {
      lbl: 'Pourquoi cet outil',
      h2Top: 'La TVA en LCD',
      h2Em: "n'est pas systématique mais sensible",
      paras: [
        "La franchise en base de TVA dispense de facturer la TVA à tes voyageurs tant que ton CA reste sous un seuil annuel. Pour la LCD avec services para-hôteliers (petit-déjeuner, ménage en cours de séjour, fourniture du linge, accueil), le seuil 2026 est de 37 500 €, avec une zone de tolérance jusqu'à 41 250 €.",
        "Si tu loues simplement un meublé sans aucun service additionnel (location nue saisonnière), tu es hors champ TVA : aucun seuil à surveiller, jamais de TVA à facturer.",
        "Le simulateur te dit en un coup d'œil : tu es en franchise, en zone de tolérance, ou tu dois facturer la TVA dès le mois suivant. Avec la TVA qui aurait été collectée, pour anticiper l'impact si tu basculais.",
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
          desc: "Si tu fournis au moins 3 services parmi petit-déjeuner quotidien, ménage en cours de séjour, fourniture du linge, accueil personnalisé : tu es en régime hôtelier. Franchise applicable jusqu'à 37 500 € de CA annuel.",
        },
        {
          h: 'LCD sans services (location simple)',
          desc: "Location meublée nue saisonnière sans services additionnels : hors champ TVA. Aucun seuil à surveiller. Tu factures et déclares uniquement en BIC (micro ou réel).",
        },
        {
          h: 'Zone de tolérance',
          desc: "Entre 37 500 € et 41 250 €, tu peux rester en franchise une année supplémentaire si tu redescends. Au-delà de 41 250 €, sortie immédiate de la franchise dès le mois suivant le dépassement.",
        },
        {
          h: 'Taux applicable',
          desc: 'Hors franchise, la LCD avec services para-hôteliers est soumise à la TVA au taux réduit de 10 % (régime des prestations hôtelières), pas 20 %.',
        },
        {
          h: 'Réforme proposée 25 000 €',
          desc: 'La loi de finances 2025 a proposé un seuil unifié à 25 000 € pour tous les BIC. Sa mise en œuvre a été suspendue. À ce jour, le seuil 37 500 € reste applicable. Vérifie le BOFiP avant toute décision.',
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
            'Seuil franchise BIC services : 37 500 €',
            'Verdict : franchise applicable',
            'Marge restante avant seuil : 19 500 €',
            'Tu ne factures pas la TVA, aucune déclaration TVA à faire',
          ],
        },
        {
          titre: 'T2 à 40 000 € de CA, services para-hôteliers',
          steps: [
            'CA annuel : 40 000 €',
            'Au-dessus du seuil 37 500 € mais dans la tolérance (≤ 41 250 €)',
            'Verdict : zone de tolérance',
            'Si tu redescends sous 37 500 € l\'année prochaine, tu restes en franchise',
            'Si tu dépasses 41 250 € en N+1, sortie immédiate dès le mois suivant',
            'Surveille de près tes chiffres mensuels en fin d\'année',
          ],
        },
        {
          titre: 'Maison à 50 000 € de CA, location simple sans services',
          steps: [
            'CA annuel : 50 000 €',
            'Services para-hôteliers : NON (location meublée nue saisonnière)',
            'Régime applicable : hors champ TVA',
            'Verdict : aucune TVA à facturer, aucun seuil à surveiller',
            'Tu déclares uniquement en BIC (micro ou réel selon ton choix)',
            'Important : si tu commences à proposer le linge + le ménage en cours, tu bascules en régime hôtelier et le seuil 37 500 € s\'applique',
          ],
        },
      ],
    },
    faq: [
      {
        q: 'Quels services rendent une LCD soumise à la TVA ?',
        a: "L'administration considère qu'au moins 3 services parmi les 4 suivants caractérisent la para-hôtellerie : petit-déjeuner quotidien, nettoyage régulier des locaux pendant le séjour, fourniture du linge de maison, accueil personnalisé de la clientèle. Sous ce seuil, tu es en location meublée hors champ TVA.",
      },
      {
        q: 'Quel est le seuil de franchise TVA en 2026 pour la LCD ?',
        a: "37 500 € de CA annuel pour la LCD avec services para-hôteliers, avec une zone de tolérance jusqu'à 41 250 € qui permet de rester en franchise une année supplémentaire si tu redescends. Au-dessus de 41 250 €, sortie immédiate dès le mois suivant le dépassement.",
      },
      {
        q: 'La réforme 25 000 € est-elle applicable ?',
        a: "La loi de finances 2025 a voté un seuil unifié à 25 000 € pour tous les BIC, mais sa mise en œuvre a été suspendue suite à des recours. À ce jour (2026), le seuil 37 500 € reste applicable. Vérifie le BOFiP ou demande à ton comptable avant toute décision impactante.",
      },
      {
        q: 'Que se passe-t-il si je sors de la franchise TVA ?',
        a: "Tu demandes un numéro de TVA intracommunautaire à ton SIE. Tu factures la TVA à 10 % à tes voyageurs (LCD para-hôtelière), tu déclares mensuellement ou trimestriellement, tu peux récupérer la TVA sur tes dépenses pro (commissions OTAs, eau, électricité, mobilier, etc.).",
      },
      {
        q: 'Suis-je redevable de la TVA si je n\'ai aucun service ?',
        a: "Non. Une location meublée nue saisonnière sans aucun service additionnel est hors champ TVA : aucune TVA à facturer, aucun seuil à surveiller, peu importe le CA. Tu restes uniquement en BIC pour l'impôt sur le revenu.",
      },
      {
        q: 'Airbnb collecte-t-il la TVA pour moi ?',
        a: "Airbnb ne collecte pas la TVA française pour l'hôte (contrairement à la taxe de séjour). Si tu es redevable, c'est à toi de la facturer et déclarer. Airbnb facture sa propre TVA sur sa commission, qui est récupérable si tu es au régime réel TVA.",
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
  <link rel="stylesheet" type="text/css" href="/fonts/phosphor-bold-subset.css">
  <link rel="stylesheet" type="text/css" href="/fonts/phosphor-regular-subset.css">
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
