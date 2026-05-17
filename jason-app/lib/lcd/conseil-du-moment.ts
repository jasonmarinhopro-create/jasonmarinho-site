/**
 * Moteur "Conseil du moment" — sélectionne UNE recommandation contextuelle
 * à afficher sur la home dashboard. Règles évaluées dans l'ordre de priorité,
 * première règle qui matche gagne.
 *
 * Pour ajouter une règle :
 *   1. Définir un id unique
 *   2. Implémenter la condition dans selectConseil()
 *   3. Insérer à la bonne position de priorité
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

export function selectConseil(ctx: ConseilContext): Conseil | null {
  const { microBic, tva } = FISCAL_PARAMS_2026

  // ─── R1 : aucun logement (priorité absolue, setup) ─────────────────
  if (!ctx.hasLogement) {
    return {
      id: 'no-logement',
      icon: 'house',
      title: 'Commence par ajouter ton premier logement',
      body: "Sans logement, tous les outils restent génériques. 3 minutes pour débloquer le pilotage personnalisé.",
      ctaLabel: 'Ajouter un logement',
      ctaHref: '/dashboard/logements',
      tone: 'opportunity',
    }
  }

  // ─── R2 : aucune réservation (essentiel pour mesurer) ──────────────
  if (!ctx.hasContract) {
    return {
      id: 'no-contract',
      icon: 'calendar-plus',
      title: 'Saisis ta première réservation',
      body: "Une fois tes premières réservations entrées, ton dashboard affiche CA, ADR, occupation et te prescrit les bonnes actions fiscales.",
      ctaLabel: 'Ouvrir le calendrier',
      ctaHref: '/dashboard/calendrier',
      tone: 'opportunity',
    }
  }

  // ─── R3 : approche du plafond micro non classé (alerte fiscale) ────
  if (ctx.caTotal12m >= microBic.nonClasse.plafond * 0.80
      && ctx.caTotal12m < microBic.nonClasse.plafond) {
    const reste = Math.round(microBic.nonClasse.plafond - ctx.caTotal12m)
    return {
      id: 'plafond-non-classe',
      icon: 'warning-octagon',
      title: `Plus que ${reste.toLocaleString('fr-FR')} € avant ton plafond`,
      body: `Tu approches du plafond ${microBic.nonClasse.plafond.toLocaleString('fr-FR')} € micro-BIC non classé. Vérifie l'intérêt de te classer Atout France pour passer à 77 700 €.`,
      ctaLabel: 'Simuler avec classement',
      ctaHref: '/dashboard/simulateurs#fiscal',
      tone: 'warning',
    }
  }

  // ─── R4 : approche du seuil TVA franchise hôtelier ────────────────
  if (ctx.caTotal12m >= tva.seuilFranchise * 0.85
      && ctx.caTotal12m < tva.seuilFranchise) {
    return {
      id: 'tva-approach',
      icon: 'percent',
      title: 'Tu approches du seuil de TVA',
      body: `Si ton CA passe ${tva.seuilFranchise.toLocaleString('fr-FR')} € en LCD avec services para-hôteliers, tu sors de la franchise. Vérifie ta position.`,
      ctaLabel: 'Vérifier ma franchise TVA',
      ctaHref: '/dashboard/simulateurs#tva',
      tone: 'warning',
    }
  }

  // ─── R5 : dépassé seuil TVA mais utilisateur sans doute pas au courant ─
  if (ctx.caTotal12m > tva.seuilFranchise) {
    return {
      id: 'tva-over',
      icon: 'warning-octagon',
      title: 'Vérifie ton assujettissement à la TVA',
      body: `Ton CA dépasse ${tva.seuilFranchise.toLocaleString('fr-FR')} €. Si tu proposes des services para-hôteliers (linge, ménage en cours, petit-déj), tu pourrais devoir facturer la TVA.`,
      ctaLabel: 'Vérifier maintenant',
      ctaHref: '/dashboard/simulateurs#tva',
      tone: 'warning',
    }
  }

  // ─── R6 : fin d'année fiscale (novembre/décembre) ──────────────────
  if (ctx.monthIndex >= 10) {
    return {
      id: 'fin-annee',
      icon: 'calendar-check',
      title: "Boucle ton année fiscale sereinement",
      body: "Vérifie ton CA, anticipe une éventuelle bascule de régime, prépare ta déclaration. Le simulateur fiscalité te donne une projection nette en 30 secondes.",
      ctaLabel: 'Lancer le simulateur fiscal',
      ctaHref: '/dashboard/simulateurs#fiscal',
      tone: 'neutral',
    }
  }

  // ─── R7 : pas d'objectif annuel défini ────────────────────────────
  if (!ctx.hasObjectif) {
    return {
      id: 'no-objectif',
      icon: 'target',
      title: "Définis ton objectif annuel",
      body: "Pour mesurer ta performance, fixe-toi un objectif de CA. Le dashboard te montre l'écart en temps réel.",
      ctaLabel: 'Définir mon objectif',
      ctaHref: '/dashboard/revenus',
      tone: 'opportunity',
    }
  }

  // ─── R8 : aucune réservation à venir (creux activité) ─────────────
  if (ctx.upcomingArrivalsCount === 0 && ctx.hasContract) {
    return {
      id: 'no-upcoming',
      icon: 'calendar-x',
      title: 'Aucune réservation à venir cette semaine',
      body: 'Période creuse à venir. Ajuste tes prix ou active une promo last-minute pour booster ton occupation.',
      ctaLabel: 'Ajuster mes prix',
      ctaHref: '/dashboard/calculateurs#prix',
      tone: 'opportunity',
    }
  }

  // ─── R9 : pas de formation entamée ────────────────────────────────
  if (!ctx.hasFormationStarted) {
    return {
      id: 'no-formation',
      icon: 'graduation-cap',
      title: "Décolle avec les formations LCD",
      body: "Fiscalité, automatisation, gestion voyageurs : les formations te font gagner des semaines de tâtonnement.",
      ctaLabel: 'Explorer les formations',
      ctaHref: '/dashboard/formations',
      tone: 'neutral',
    }
  }

  // ─── R10 : "tout est OK" — célébration légère ─────────────────────
  if (ctx.caTotal12m > 0 && ctx.hasObjectif && ctx.hasFormationStarted) {
    return {
      id: 'all-good',
      icon: 'trophy',
      title: "Tu es bien armé",
      body: "Logements configurés, objectif fixé, formations entamées. Vérifie tes performances vs marché pour rester au top.",
      ctaLabel: 'Voir mes performances',
      ctaHref: '/dashboard/performances',
      tone: 'celebration',
    }
  }

  return null
}
