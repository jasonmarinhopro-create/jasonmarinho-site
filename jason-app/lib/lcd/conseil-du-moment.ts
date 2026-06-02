/**
 * Moteur "Conseil du moment" — sélectionne UN ou PLUSIEURS conseils
 * contextuels à afficher sur la home dashboard.
 *
 * - `selectConseils()` retourne TOUS les conseils applicables, dans l'ordre
 *   de priorité. Le client filtre les conseils dismissés (localStorage) et
 *   affiche le premier restant. Ça permet à l'utilisateur de "passer" un
 *   conseil sans pour autant désactiver tout le bloc.
 * - `selectConseil()` reste exporté pour rétrocompatibilité (1er élément).
 *
 * Pour ajouter une règle :
 *   1. Définir un id unique
 *   2. Pousser dans le tableau si la condition match
 *   3. Position dans le tableau = priorité (top = priorité absolue)
 */

import { FISCAL_PARAMS_2026 } from './fiscal-params'

export type ConseilTone = 'opportunity' | 'warning' | 'neutral' | 'celebration'

export type Conseil = {
  id: string
  icon: string                // nom Phosphor (rocket, currency-eur, calendar-x, etc.)
  title: string               // Phrase courte, accroche
  body: string                // 1-2 lignes d'explication
  ctaLabel: string
  ctaHref: string
  tone: ConseilTone
}

export type ConseilContext = {
  hasLogement: boolean
  hasContract: boolean
  hasObjectif: boolean
  hasFormationStarted: boolean
  caTotal12m: number
  monthIndex: number          // 0=jan, 11=dec
  daysSinceLastContract: number | null
  upcomingArrivalsCount: number
}

/** Retourne TOUS les conseils applicables, en ordre de priorité. */
export function selectConseils(ctx: ConseilContext): Conseil[] {
  const { microBic, tva } = FISCAL_PARAMS_2026
  const out: Conseil[] = []

  // ─── Priorité absolue : setup ─────────────────────────────────────
  if (!ctx.hasLogement) {
    out.push({
      id: 'no-logement',
      icon: 'house',
      title: 'Commence par ajouter ton premier logement',
      body: "Sans logement, tous les outils restent génériques. 3 minutes pour débloquer le pilotage personnalisé.",
      ctaLabel: 'Ajouter un logement',
      ctaHref: '/dashboard/logements',
      tone: 'opportunity',
    })
  }

  if (!ctx.hasContract) {
    out.push({
      id: 'no-contract',
      icon: 'calendar-plus',
      title: 'Saisis ta première réservation',
      body: "Une fois tes premières réservations entrées, ton dashboard affiche CA, ADR, occupation et te prescrit les bonnes actions fiscales.",
      ctaLabel: 'Ouvrir le calendrier',
      ctaHref: '/dashboard/calendrier',
      tone: 'opportunity',
    })
  }

  // ─── Alertes fiscales (urgent) ────────────────────────────────────
  if (ctx.caTotal12m >= microBic.nonClasse.plafond * 0.80
      && ctx.caTotal12m < microBic.nonClasse.plafond) {
    const reste = Math.round(microBic.nonClasse.plafond - ctx.caTotal12m)
    out.push({
      id: 'plafond-non-classe',
      icon: 'warning-octagon',
      title: `Plus que ${reste.toLocaleString('fr-FR')} € avant ton plafond`,
      body: `Tu approches du plafond ${microBic.nonClasse.plafond.toLocaleString('fr-FR')} € micro-BIC non classé. Vérifie l'intérêt de te classer Atout France pour passer à 77 700 €.`,
      ctaLabel: 'Simuler avec classement',
      ctaHref: '/dashboard/simulateurs#fiscal',
      tone: 'warning',
    })
  }

  if (ctx.caTotal12m >= tva.seuilFranchise * 0.85
      && ctx.caTotal12m < tva.seuilFranchise) {
    out.push({
      id: 'tva-approach',
      icon: 'percent',
      title: 'Tu approches du seuil de TVA',
      body: `Si ton CA passe ${tva.seuilFranchise.toLocaleString('fr-FR')} € en LCD avec services para-hôteliers, tu sors de la franchise. Vérifie ta position.`,
      ctaLabel: 'Vérifier ma franchise TVA',
      ctaHref: '/dashboard/simulateurs#tva',
      tone: 'warning',
    })
  }

  if (ctx.caTotal12m > tva.seuilFranchise) {
    out.push({
      id: 'tva-over',
      icon: 'warning-octagon',
      title: 'Vérifie ton assujettissement à la TVA',
      body: `Ton CA dépasse ${tva.seuilFranchise.toLocaleString('fr-FR')} €. Si tu proposes des services para-hôteliers (linge, ménage en cours, petit-déj), tu pourrais devoir facturer la TVA.`,
      ctaLabel: 'Vérifier maintenant',
      ctaHref: '/dashboard/simulateurs#tva',
      tone: 'warning',
    })
  }

  // ─── Saisonnier (fin d'année fiscale) ─────────────────────────────
  if (ctx.monthIndex >= 10) {
    out.push({
      id: 'fin-annee',
      icon: 'calendar-check',
      title: "Boucle ton année fiscale sereinement",
      body: "Vérifie ton CA, anticipe une éventuelle bascule de régime, prépare ta déclaration. Le simulateur fiscalité te donne une projection nette en 30 secondes.",
      ctaLabel: 'Lancer le simulateur fiscal',
      ctaHref: '/dashboard/simulateurs#fiscal',
      tone: 'neutral',
    })
  }

  // ─── Pic de saison estivale (mai-août) : pricing dynamique ────────
  if (ctx.monthIndex >= 4 && ctx.monthIndex <= 7 && ctx.hasLogement) {
    out.push({
      id: 'pic-saison',
      icon: 'trend-up',
      title: 'Haute saison : optimise tes tarifs',
      body: "Mai-août = +30 à +60 % sur la majorité des destinations. Vérifie tes prix vs marché et ajuste tes minimums.",
      ctaLabel: 'Ouvrir le calculateur de prix',
      ctaHref: '/dashboard/calculateurs#prix',
      tone: 'opportunity',
    })
  }

  // ─── Setup non terminé : objectif annuel ──────────────────────────
  if (!ctx.hasObjectif && ctx.hasLogement) {
    out.push({
      id: 'no-objectif',
      icon: 'target',
      title: "Définis ton objectif annuel",
      body: "Pour mesurer ta performance, fixe-toi un objectif de CA. Le dashboard te montre l'écart en temps réel.",
      ctaLabel: 'Définir mon objectif',
      ctaHref: '/dashboard/revenus',
      tone: 'opportunity',
    })
  }

  // ─── Creux activité ───────────────────────────────────────────────
  if (ctx.upcomingArrivalsCount === 0 && ctx.hasContract) {
    out.push({
      id: 'no-upcoming',
      icon: 'calendar-x',
      title: 'Aucune réservation à venir cette semaine',
      body: 'Période creuse à venir. Ajuste tes prix ou active une promo last-minute pour booster ton occupation.',
      ctaLabel: 'Ajuster mes prix',
      ctaHref: '/dashboard/calculateurs#prix',
      tone: 'opportunity',
    })
  }

  // ─── Formation pas entamée ────────────────────────────────────────
  if (!ctx.hasFormationStarted) {
    out.push({
      id: 'no-formation',
      icon: 'graduation-cap',
      title: "Décolle avec les formations LCD",
      body: "Fiscalité, automatisation, gestion voyageurs : les formations te font gagner des semaines de tâtonnement.",
      ctaLabel: 'Explorer les formations',
      ctaHref: '/dashboard/formations',
      tone: 'neutral',
    })
  }

  // ─── Conseils evergreen : matchent quand le setup est OK ──────────
  // Ces conseils sont des "best practices" toujours pertinents. Le client
  // filtre les dismissés et fait tourner le reste — ça évite que l'utilisateur
  // voie toujours le même conseil "all-good" pendant des semaines.
  if (ctx.hasLogement && ctx.hasContract) {
    out.push({
      id: 'evergreen-classement',
      icon: 'medal',
      title: 'Classer ton meublé : +14 000 € de plafond',
      body: 'Le classement Atout France te passe à 77 700 € de plafond micro-BIC et 71 % d\'abattement (vs 30 % non classé). Simule l\'impact net pour toi.',
      ctaLabel: 'Simuler le classement',
      ctaHref: '/dashboard/simulateurs#fiscal',
      tone: 'opportunity',
    })

    out.push({
      id: 'evergreen-ical',
      icon: 'calendar-blank',
      title: 'Synchronise tes calendriers iCal',
      body: 'Évite les double-bookings entre Airbnb, Booking et Abritel : importe les flux iCal pour voir tous tes séjours en un seul calendrier.',
      ctaLabel: 'Configurer la sync',
      ctaHref: '/dashboard/calendrier',
      tone: 'neutral',
    })

    out.push({
      id: 'evergreen-signaler',
      icon: 'shield-check',
      title: 'Signale tes bons (et mauvais) voyageurs',
      body: "La communauté Driing partage des signalements pour éviter les profils à risque. Ton historique aide les autres hôtes — et l'inverse.",
      ctaLabel: 'Voir mes voyageurs',
      ctaHref: '/dashboard/voyageurs',
      tone: 'neutral',
    })

    out.push({
      id: 'evergreen-gabarits',
      icon: 'envelope-simple',
      title: 'Gagne 5 min par voyageur avec les gabarits',
      body: 'Messages d\'accueil, instructions d\'arrivée, rappels de check-out : les gabarits pré-remplissent tes communications en un clic.',
      ctaLabel: 'Voir mes gabarits',
      ctaHref: '/dashboard/gabarits',
      tone: 'neutral',
    })

    out.push({
      id: 'evergreen-perf',
      icon: 'chart-line-up',
      title: 'Compare-toi au marché local',
      body: "Tes performances vs la moyenne de ta zone : ADR, taux d'occupation, RevPAR. Identifie où tu peux gagner 10-20 % facilement.",
      ctaLabel: 'Voir mes performances',
      ctaHref: '/dashboard/performances',
      tone: 'neutral',
    })

    if (ctx.caTotal12m > 0) {
      out.push({
        id: 'evergreen-prix',
        icon: 'currency-eur',
        title: 'Pricing dynamique : +12 % en moyenne',
        body: 'Tarifs en pic week-end, tarifs basse saison, last-minute : ajuste tes prix selon la demande pour maximiser ton revenu sans effort.',
        ctaLabel: 'Ouvrir le calculateur',
        ctaHref: '/dashboard/calculateurs#prix',
        tone: 'opportunity',
      })
    }

    out.push({
      id: 'evergreen-cheznous',
      icon: 'users-three',
      title: 'Pose ta question à la communauté',
      body: "Bloqué sur un cas fiscal, une copropriété, une mairie ? L'espace Chez-nous regroupe les hôtes Driing pour échanger entre pairs.",
      ctaLabel: "Entrer dans l'espace",
      ctaHref: '/dashboard/chez-nous',
      tone: 'neutral',
    })
  }

  // ─── Filet de sécurité : célébration légère quand tout est nominal ─
  if (ctx.caTotal12m > 0 && ctx.hasObjectif && ctx.hasFormationStarted) {
    out.push({
      id: 'all-good',
      icon: 'trophy',
      title: "Tu es bien armé",
      body: "Logements configurés, objectif fixé, formations entamées. Vérifie tes performances vs marché pour rester au top.",
      ctaLabel: 'Voir mes performances',
      ctaHref: '/dashboard/performances',
      tone: 'celebration',
    })
  }

  return out
}

/** Rétrocompat : retourne le 1er conseil applicable, ou null. */
export function selectConseil(ctx: ConseilContext): Conseil | null {
  return selectConseils(ctx)[0] ?? null
}
