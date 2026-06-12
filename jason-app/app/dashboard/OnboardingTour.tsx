'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, X, Sparkle } from '@phosphor-icons/react/dist/ssr'
import { markOnboardingStep } from '@/lib/onboarding/actions'

export type TourStep = {
  id: string
  targetSelector: string | null  // null = popover centré
  title: string
  body: string
  cta?: { label: string; href: string }
}

// Tour par défaut pour le dashboard home.
// Chemin d'apprentissage : on commence par les ressources (Apprendre →
// Formations / Guide / Actualités), puis le pilotage quotidien (Calendrier),
// puis l'action concrète (la checklist). Volontairement on NE pousse PAS
// directement vers les simulateurs — ils sont une option, pas la priorité.
export const DASHBOARD_HOME_STEPS: TourStep[] = [
  {
    id: 'welcome',
    targetSelector: null,
    title: "Bienvenue dans ton espace LCD",
    body: "60 secondes pour découvrir ton dashboard et savoir où trouver quoi. Tu peux skipper à tout moment.",
  },
  {
    id: 'formations',
    targetSelector: 'a[href="/dashboard/formations"]',
    title: "Apprendre : les Formations",
    body: "18 formations pour devenir un hôte qui maîtrise vraiment la LCD : juridique, fiscal, Booking, Airbnb, automatisation… Commence par là.",
  },
  {
    id: 'guide',
    targetSelector: 'a[href="/dashboard/guide"]',
    title: "Le Guide LCD",
    body: "Le manuel concret pour les vraies situations : un voyageur qui annule, un mauvais commentaire, un litige de caution… On a tout couvert.",
  },
  {
    id: 'actualites',
    targetSelector: 'a[href="/dashboard/actualites"]',
    title: "Reste informé : Actualités",
    body: "Changements de loi, nouvelles obligations fiscales, actualité Airbnb/Booking. Curé par Jason, pas du bruit de presse — uniquement ce qui te concerne.",
  },
  {
    id: 'calendrier',
    targetSelector: 'a[href="/dashboard/calendrier"]',
    title: "Piloter au quotidien : Calendrier",
    body: "Toutes tes arrivées, départs, séjours sans contrat. Synchronisé avec Airbnb et Booking via iCal. Le hub central de ton activité.",
  },
  {
    id: 'setup',
    targetSelector: '[data-tour="setup-checklist"]',
    title: "Tes prochaines étapes concrètes",
    body: "Cette checklist t'accompagne d'un compte vide à une utilisation pleine. Elle disparaît automatiquement quand tu as fini.",
  },
  {
    id: 'done',
    targetSelector: null,
    title: "Tu as la carte. Bonne route ✨",
    body: "Tout le reste se découvre en cliquant. Une visite guidée se relance à ta première visite des pages importantes (Logements, Calendrier, Simulateurs), ou via le bouton « Comment ça marche ? » en haut de chaque page.",
  },
]

// Tour pour la page simulateurs
export const SIMULATEURS_STEPS: TourStep[] = [
  {
    id: 'activity',
    targetSelector: '[data-tour="activity-overview"]',
    title: "Mon activité, en un coup d'œil",
    body: "5 tuiles qui résument ton CA 12 mois, tes logements, ton ADR moyen, ton régime fiscal estimé et ton statut LMNP/LMP. Chacune te donne le prochain pas à faire.",
  },
  {
    id: 'tabs',
    targetSelector: '[role="tablist"]',
    title: "5 outils, tous préfilés",
    body: "Tes vraies données alimentent automatiquement chaque simulateur. Tu peux toujours modifier les valeurs pour tester un scénario.",
  },
  {
    id: 'done',
    targetSelector: null,
    title: "Tu es prêt à piloter",
    body: "Explore librement. Si tu veux revoir cette visite, c'est dans ton profil.",
  },
]

// Tour pour la page Mes Logements — explique que c'est la SOURCE de tout
// (préfilage simulateurs, contrats, iCal, Stripe).
export const LOGEMENTS_STEPS: TourStep[] = [
  {
    id: 'intro',
    targetSelector: null,
    title: "Tes logements = ta source de vérité",
    body: "Tout part d'ici. Tes biens alimentent automatiquement tes contrats (nom, adresse, équipements), tes simulateurs fiscaux, ton calendrier (sync iCal), tes performances et tes calculs marché.",
  },
  {
    id: 'create',
    targetSelector: '[data-tour=\"logement-create\"]',
    title: "Comment ajouter un bien",
    body: "4 champs essentiels : nom, adresse, type, tarif moyen/nuit. Tu peux ajouter d'autres infos plus tard (équipements WiFi/parking, capacité, etc.). Compte 2 minutes par bien.",
  },
  {
    id: 'card',
    targetSelector: '[data-tour=\"logement-list\"]',
    title: "Sur chaque fiche, 4 mécaniques clés",
    body: "1) iCal Airbnb + Booking pour synchro auto du calendrier. 2) Paiement Stripe pour encaisser en direct. 3) Classement Atout France pour ton régime fiscal. 4) Pause si tu retires temporairement le bien du marché.",
  },
  {
    id: 'multi',
    targetSelector: null,
    title: "Multi-biens et multi-pays",
    body: "Pas de limite. France, Portugal, Espagne, Italie, Belgique, Allemagne, Pays-Bas, Autriche, Suisse. Le dashboard agrège tout et affiche chaque bien dans sa devise locale + sa réglementation pays.",
  },
  {
    id: 'done',
    targetSelector: null,
    title: "Une fois tes biens créés...",
    body: "L'app travaille pour toi : les simulateurs deviennent préfilés, les contrats se génèrent en 1 clic, les revenus se ventilent par logement, les benchmarks deviennent comparables à ton marché.",
    cta: { label: 'Voir mes simulateurs', href: '/dashboard/simulateurs' },
  },
]

// Tour pour la page Calculateurs marché — outils de pricing/estimation.
export const CALCULATEURS_STEPS: TourStep[] = [
  {
    id: 'intro',
    targetSelector: null,
    title: "3 calculateurs marché, préfilés",
    body: "Estime tes revenus annuels, trouve le bon prix par nuit, compare tes villes. Tous se chargent automatiquement avec tes vraies données.",
  },
  {
    id: 'tabs',
    targetSelector: '[role="tablist"]',
    title: "Bascule entre les 3 outils",
    body: "Estimateur de revenus / Calculateur de prix / Compareur de villes. À chaque fois, tu peux soit garder ton bien sélectionné, soit simuler un autre projet.",
  },
  {
    id: 'data',
    targetSelector: '[data-tour="activity-overview"]',
    title: "Tes vraies données vs marché",
    body: "L'app croise tes données réelles (12 derniers mois encaissés) avec les benchmarks 83 villes européennes. Tu sais si tu sur- ou sous-performes.",
  },
]

// Tour pour la page Mes Voyageurs — carnet de contacts central + sécurité.
export const VOYAGEURS_STEPS: TourStep[] = [
  {
    id: 'intro',
    targetSelector: null,
    title: "Bienvenue dans ton carnet de voyageurs",
    body: "C'est ton CRM LCD : tous les voyageurs qui ont (ou vont) séjourner chez toi, leurs contacts, l'historique de leurs séjours et tes notes privées sur chacun. Plus tu remplis, plus l'app pré-remplit pour toi.",
  },
  {
    id: 'add',
    targetSelector: '[data-tour=\"voyageur-create\"]',
    title: "Comment ajouter un voyageur",
    body: "Le bouton « Ajouter » te demande prénom, nom, email, téléphone. Tous les champs sont optionnels sauf le prénom. Tu peux toujours compléter plus tard quand tu as l'info.",
  },
  {
    id: 'sejours',
    targetSelector: null,
    title: "Chaque voyageur garde son historique",
    body: "Sur la fiche d'un voyageur, tu vois tous ses séjours passés et à venir avec montants et logements. Pratique pour identifier tes voyageurs fidèles ou comprendre une demande \"je suis déjà venu en juin\".",
  },
  {
    id: 'notes',
    targetSelector: null,
    title: "Notes privées : ton mémo perso",
    body: "Tu peux ajouter une note privée sur chaque voyageur (ex: « Vegan, allergie chat, préfère le café noir »). Ces notes ne sont JAMAIS partagées et te servent à personnaliser ton accueil au prochain séjour.",
  },
  {
    id: 'safety',
    targetSelector: null,
    title: "Sécurité : signaler & vérifier",
    body: "Si un voyageur t'a posé problème (dégradation, litige caution, faux profil), tu peux le signaler. Les autres hôtes verront le signalement quand ils chercheront l'identifiant. Inversement, AVANT d'accepter, tu peux vérifier qu'un téléphone/email n'est pas dans la base communautaire.",
    cta: { label: 'Aller à la Sécurité Voyageur', href: '/dashboard/securite' },
  },
]

// Tour pour la page Revenus — saisir, agréger, suivre.
export const REVENUS_STEPS: TourStep[] = [
  {
    id: 'intro',
    targetSelector: null,
    title: "Ta source de vérité revenus",
    body: "Tout l'argent qui entre (et qui sort) de ton activité LCD : loyer, caution, ménage, taxe de séjour, commissions Airbnb/Booking, charges. Une seule page, une seule vérité, alimentée automatiquement par tes séjours.",
  },
  {
    id: 'add',
    targetSelector: '[data-tour=\"revenus-create\"]',
    title: "Ajouter manuellement vs importer",
    body: "Tu peux saisir une entrée à la main (1 minute) ou importer un CSV depuis Airbnb/Booking si tu as un historique. L'app détecte les doublons et associe chaque ligne au bon séjour.",
  },
  {
    id: 'aggregation',
    targetSelector: null,
    title: "Vue par logement + par canal",
    body: "L'app agrège automatiquement ton CA par logement (qui rapporte le plus) et par canal de réservation (direct vs Booking vs Airbnb). Tu vois en un clin d'œil où tes marges sont les meilleures.",
  },
  {
    id: 'charges',
    targetSelector: null,
    title: "N'oublie pas les charges",
    body: "Onglet « Charges » : loyer/crédit immo, énergie, abos, ménage, assurance, taxe foncière. Plus tu remplis, plus ta marge nette est précise et plus ton simulateur fiscal est utile.",
  },
  {
    id: 'fiscal',
    targetSelector: null,
    title: "Lien direct avec ta fiscalité",
    body: "Ton CA cumulé ici alimente directement les simulateurs fiscaux : approche du plafond micro-BIC, choix régime, taxe de séjour. Une saisie ici = pas besoin de recommencer ailleurs.",
    cta: { label: 'Voir mes simulateurs', href: '/dashboard/simulateurs' },
  },
]

// Tour pour la page Encaissements (uniquement utile si Stripe Connect activé).
export const ENCAISSEMENTS_STEPS: TourStep[] = [
  {
    id: 'intro',
    targetSelector: null,
    title: "Stripe en temps réel, sans quitter l'app",
    body: "Tout ce que tu encaisses via Stripe (loyer, caution, paiements en lien) apparaît ici en quasi-temps réel. Plus besoin d'ouvrir le dashboard Stripe pour avoir tes chiffres du jour.",
  },
  {
    id: 'stats',
    targetSelector: null,
    title: "4 chiffres clés en haut de page",
    body: "Solde disponible (ce qui sera viré au prochain payout), prochain virement (date + montant), encaissé ce mois (CA brut Stripe), paiements à relancer. Aperçu en 3 secondes.",
  },
  {
    id: 'payouts',
    targetSelector: null,
    title: "Virements récents avec statut",
    body: "Stripe paie tous les jours ouvrés (compte standard EU, délai 2-3 jours). Tu vois chaque payout : Versé / En transit / En attente / Échec — avec la raison si échec. Si tu vois plusieurs « Échec », c'est qu'il y a un problème avec ton RIB Stripe.",
  },
  {
    id: 'impayes',
    targetSelector: null,
    title: "Relance en 1 clic les impayés",
    body: "Si un voyageur n'a pas payé et que son arrivée approche (J-7 ou passé), la section « À relancer » l'affiche en rouge. Bouton « Rappel paiement » → email pré-rempli pour lui renvoyer le lien Stripe.",
  },
  {
    id: 'failed',
    targetSelector: null,
    title: "Échecs de paiement des 30 derniers jours",
    body: "Section dédiée pour les CB refusées (fonds insuffisants, 3D-Secure échoué, carte expirée). Tu vois le voyageur + la raison + le montant — utile pour rappeler avant que le séjour soit annulé par sécurité.",
  },
]

// Tour pour la page Calendrier — focus sur la navigation + sync iCal + saisie
// rapide (les 3 mécaniques que les hôtes mettent souvent du temps à découvrir).
export const CALENDRIER_STEPS: TourStep[] = [
  {
    id: 'intro',
    targetSelector: null,
    title: "Ton calendrier centralise tout",
    body: "Arrivées, départs, ménages, séjours sans contrat, événements iCal. Tout est ici, tu n'as plus à jongler entre Airbnb, Booking et tes notes.",
  },
  {
    id: 'nav',
    targetSelector: '[data-tour="calendrier-monthnav"]',
    title: "Navigue par mois",
    body: "Flèches gauche / droite pour bouger dans le temps. Clique sur un jour pour saisir un événement directement.",
  },
  {
    id: 'view',
    targetSelector: '[data-tour="calendrier-views"]',
    title: "Vue mois ou vue liste",
    body: "La vue mois donne le panorama. La vue liste te donne tous les événements à venir, scrollable, parfait sur mobile.",
  },
  {
    id: 'sync',
    targetSelector: '[data-tour="calendrier-ical"]',
    title: "Branche Airbnb + Booking en 30 secondes",
    body: "Colle l'URL iCal de chaque plateforme dans tes fiches logement. Les réservations apparaissent ici en temps quasi-réel, codées par couleur.",
  },
  {
    id: 'done',
    targetSelector: null,
    title: "Pro tip : la saisie rapide",
    body: "L'éclair en haut à droite te permet d'écrire \"Ménage demain 10h chez Belleville\" et l'événement se crée. Plus rapide qu'un formulaire.",
  },
]

// Largeur du popover : 380px en desktop, sinon clamp à la viewport - margins.
// Calculée dynamiquement au runtime pour gérer les rotations mobile.
function getPopoverW(): number {
  if (typeof window === 'undefined') return 380
  return Math.min(380, window.innerWidth - 32)
}
const POPOVER_H_EST = 260
const MARGIN = 14
const MOBILE_BREAKPOINT = 768

/** Détecte si un élément est réellement VISIBLE à l'écran (pas hidden,
 *  pas offscreen, pas display:none). Sur mobile, les liens du sidebar
 *  desktop existent toujours dans le DOM mais sont cachés — leur rect
 *  est dégénéré (width 0 ou complètement hors viewport). */
function isElementVisible(el: HTMLElement): boolean {
  if (!el) return false
  const style = window.getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
    return false
  }
  const rect = el.getBoundingClientRect()
  if (rect.width < 4 || rect.height < 4) return false
  // Si l'élément est COMPLÈTEMENT en dehors du viewport (à gauche/droite),
  // c'est probablement un drawer fermé.
  if (rect.right < 0 || rect.left > window.innerWidth) return false
  return true
}

export default function OnboardingTour({
  userId,
  forceOpen = false,
  steps = DASHBOARD_HOME_STEPS,
  storageScope = 'home',
  initiallyDone = false,
}: {
  userId: string
  forceOpen?: boolean
  steps?: TourStep[]
  storageScope?: 'home' | 'simulateurs' | 'logements' | 'calendrier' | 'voyageurs' | 'revenus' | 'encaissements' | 'calculateurs'
  /** Hydraté depuis profile.onboarding_completed_steps côté serveur : si true,
   *  le tour a déjà été fait sur un autre appareil → ne pas re-déclencher. */
  initiallyDone?: boolean
}) {
  const STEPS = steps
  const [active, setActive] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; arrowSide?: 'top' | 'bottom' } | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const storageKey = `dash-onboarding-tour-${storageScope}-${userId}`
  const stepDbKey = `tour:${storageScope}`

  // Démarrage : check si déjà fait (DB ou localStorage) OU param URL ?tour=1
  useEffect(() => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    const urlForce = params?.get('tour') === '1'
    if (forceOpen || urlForce) {
      setStepIdx(0)
      setActive(true)
      // Nettoie le param URL pour éviter qu'un refresh re-déclenche
      if (urlForce && typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('tour')
        window.history.replaceState({}, '', url.toString())
      }
      return
    }
    // Source de vérité serveur : si la DB dit "fait", on respecte sur tous
    // les appareils. Évite que les tours réapparaissent à chaque nouveau
    // login. On rafraîchit le cache localStorage au passage.
    if (initiallyDone) {
      try { localStorage.setItem(storageKey, 'done') } catch {}
      return
    }
    try {
      if (localStorage.getItem(storageKey) === 'done') return
    } catch {
      return
    }
    // Donner le temps aux composants de monter avant de chercher les targets
    const t = setTimeout(() => setActive(true), 700)
    return () => clearTimeout(t)
  }, [storageKey, forceOpen, initiallyDone])

  // Écoute le CustomEvent dispatché par TourTrigger pour relancer la visite
  // depuis la MÊME page (le param URL seul ne re-déclenche pas le useEffect).
  useEffect(() => {
    function onForceOpen() {
      setStepIdx(0)
      setActive(true)
    }
    window.addEventListener('jm-tour-open', onForceOpen)
    return () => window.removeEventListener('jm-tour-open', onForceOpen)
  }, [])

  // Calcul position popover + autoskip si target absent
  const updatePosition = useCallback(() => {
    const step = STEPS[stepIdx]
    if (!step) return

    const popoverW = getPopoverW()
    const isMobile = typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT

    // Helper : popover en bottom sheet (mobile) sans spotlight.
    // Pas de targetRect → backdrop full + popover ancré en bas avec marge sécurité
    // pour ne pas chevaucher la barre de nav OS (iOS safe area approx 60px).
    const bottomSheet = () => {
      setTargetRect(null)
      setPopoverPos({
        top: Math.max(MARGIN, window.innerHeight - POPOVER_H_EST - 80),
        left: MARGIN,
      })
    }

    // Helper : popover centré viewport (desktop sans target).
    const centered = () => {
      setTargetRect(null)
      setPopoverPos({
        top: Math.max(MARGIN, (window.innerHeight - POPOVER_H_EST) / 2),
        left: Math.max(MARGIN, (window.innerWidth - popoverW) / 2),
      })
    }

    // Pas de target défini : centrer (desktop) ou bottom sheet (mobile)
    if (!step.targetSelector) {
      if (isMobile) bottomSheet()
      else centered()
      return
    }

    const el = document.querySelector(step.targetSelector) as HTMLElement | null

    // Sur mobile, si l'élément n'est pas visible (sidebar desktop caché par
    // exemple), on N'AUTOSKIP PAS — au contraire on garde le step comme
    // information éducative, juste sans spotlight. C'est plus utile pour
    // l'utilisateur : il sait que "Formations" existe sans qu'on saute
    // le step parce que le sidebar mobile est fermé.
    if (!el || (isMobile && !isElementVisible(el))) {
      if (isMobile) {
        bottomSheet()
        return
      }
      // Desktop sans target trouvé → skip silencieux comme avant
      if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1)
      else finish()
      return
    }

    // À partir d'ici : élément visible, on peut scroll + positionner.
    el.scrollIntoView({ behavior: isMobile ? 'auto' : 'smooth', block: 'center' })

    // Laisse le scroll s'effectuer puis mesure (court sur mobile, normal desktop).
    setTimeout(() => {
      const rect = el.getBoundingClientRect()
      // Double-check : après scroll, si l'élément est toujours offscreen
      // ou collé au bord, on bascule en bottom sheet propre.
      if (isMobile && !isElementVisible(el)) {
        bottomSheet()
        return
      }
      setTargetRect(rect)

      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      let top: number
      let arrowSide: 'top' | 'bottom'
      if (spaceBelow >= POPOVER_H_EST + MARGIN) {
        top = rect.bottom + MARGIN
        arrowSide = 'top'
      } else if (spaceAbove >= POPOVER_H_EST + MARGIN) {
        top = rect.top - POPOVER_H_EST - MARGIN
        arrowSide = 'bottom'
      } else {
        top = Math.max(MARGIN, (window.innerHeight - POPOVER_H_EST) / 2)
        arrowSide = 'top'
      }

      let left = rect.left + (rect.width - popoverW) / 2
      left = Math.max(MARGIN, Math.min(left, window.innerWidth - popoverW - MARGIN))

      setPopoverPos({ top, left, arrowSide })
    }, isMobile ? 50 : 380)
  }, [stepIdx, STEPS])

  useEffect(() => {
    if (!active) return
    updatePosition()
    const onResize = () => updatePosition()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, { passive: true })
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize)
    }
  }, [active, updatePosition])

  // Lock body scroll quand actif (sauf via le scroll programmatique)
  useEffect(() => {
    if (!active) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [active])

  function finish() {
    try { localStorage.setItem(storageKey, 'done') } catch {}
    // Sync DB (best-effort, fire-and-forget) pour que le tour ne réapparaisse
    // pas sur un autre appareil. Si le réseau échoue, le localStorage suffit
    // pour cet appareil — le tour pourrait re-apparaître ailleurs mais c'est
    // acceptable comme dégradation.
    markOnboardingStep(stepDbKey, true).catch(() => {})
    setActive(false)
  }
  function next() {
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1)
    else finish()
  }
  function prev() {
    if (stepIdx > 0) setStepIdx(stepIdx - 1)
  }

  // Keyboard nav
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish()
      else if (e.key === 'ArrowRight' || e.key === 'Enter') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepIdx])

  if (!active) return null
  const step = STEPS[stepIdx]
  const progress = ((stepIdx + 1) / STEPS.length) * 100

  return (
    <div style={s.root} aria-modal="true" role="dialog" aria-labelledby="onboarding-title">
      {/* Backdrop avec cutout sur la target */}
      <Backdrop targetRect={targetRect} />

      {/* Popover */}
      {popoverPos && (
        <div
          ref={popoverRef}
          style={{
            ...s.popover,
            top: popoverPos.top,
            left: popoverPos.left,
            width: getPopoverW(),
            // Garde-fou : si le contenu dépasse (texte long, écran court),
            // on borne et on autorise le scroll interne plutôt que de
            // tronquer hors viewport. Réserve 16px de marge bas.
            maxHeight: `calc(100vh - ${popoverPos.top + 16}px)`,
            overflowY: 'auto',
          }}
        >
          {targetRect && popoverPos.arrowSide && (
            <div style={{
              ...s.arrow,
              ...(popoverPos.arrowSide === 'top'
                ? { top: -8, borderRight: '1px solid var(--accent-border)', borderTop: '1px solid var(--accent-border)' }
                : { bottom: -8, borderLeft: '1px solid var(--accent-border)', borderBottom: '1px solid var(--accent-border)' }),
              left: Math.min(
                Math.max(20, targetRect.left + targetRect.width / 2 - popoverPos.left - 6),
                getPopoverW() - 30
              ),
            }} />
          )}

          <div style={s.popHead}>
            <span style={s.popTag}>
              <Sparkle size={11} weight="fill" /> Visite guidée · {stepIdx + 1}/{STEPS.length}
            </span>
            <button onClick={finish} style={s.closeBtn} aria-label="Fermer">
              <X size={14} weight="bold" />
            </button>
          </div>

          <h3 id="onboarding-title" style={s.popTitle}>{step.title}</h3>
          <p style={s.popBody}>{step.body}</p>

          <div style={s.progressBar}>
            <div style={{ ...s.progressFill, width: `${progress}%` }} />
          </div>

          <div style={s.popFooter}>
            <button onClick={finish} style={s.skipBtn}>Passer</button>
            <div style={{ display: 'flex', gap: '8px' }}>
              {stepIdx > 0 && (
                <button onClick={prev} style={s.prevBtn} aria-label="Précédent">
                  <ArrowLeft size={13} weight="bold" />
                </button>
              )}
              {step.cta && stepIdx === STEPS.length - 1 ? (
                <Link href={step.cta.href} onClick={finish} style={s.ctaBtn}>
                  {step.cta.label}
                  <ArrowRight size={13} weight="bold" />
                </Link>
              ) : (
                <button onClick={next} style={s.nextBtn}>
                  {stepIdx === STEPS.length - 1 ? 'Terminer' : 'Suivant'}
                  <ArrowRight size={13} weight="bold" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Backdrop semi-transparent avec spotlight sur la target via box-shadow
function Backdrop({ targetRect }: { targetRect: DOMRect | null }) {
  if (!targetRect) {
    return <div style={s.backdrop} />
  }
  const pad = 12
  return (
    <div
      style={{
        position: 'fixed',
        top: targetRect.top - pad,
        left: targetRect.left - pad,
        width: targetRect.width + pad * 2,
        height: targetRect.height + pad * 2,
        borderRadius: '18px',
        boxShadow: '0 0 0 9999px rgba(0, 26, 17, 0.62), 0 0 0 2px rgba(255,213,107,0.55), 0 0 40px rgba(255,213,107,0.20)',
        pointerEvents: 'none',
        zIndex: 9998,
        transition: 'top .35s cubic-bezier(.4,0,.2,1), left .35s cubic-bezier(.4,0,.2,1), width .35s cubic-bezier(.4,0,.2,1), height .35s cubic-bezier(.4,0,.2,1)',
      }}
    />
  )
}

const s: Record<string, React.CSSProperties> = {
  root: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    fontFamily: 'var(--font-outfit), Outfit, sans-serif',
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 26, 17, 0.62)',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
    zIndex: 9998,
  },
  popover: {
    position: 'fixed',
    zIndex: 10000,
    background: 'var(--floating-surface)',
    border: '1px solid var(--accent-border)',
    borderRadius: '16px',
    padding: '20px 22px 18px',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,213,107,0.10)',
    transition: 'top .35s cubic-bezier(.4,0,.2,1), left .35s cubic-bezier(.4,0,.2,1)',
  },
  arrow: {
    position: 'absolute',
    width: '14px',
    height: '14px',
    background: 'var(--floating-surface)',
    transform: 'rotate(45deg)',
  },
  popHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px',
  },
  popTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: '999px',
    background: 'rgba(255,213,107,0.10)',
    color: 'var(--accent-text)',
    fontSize: '10.5px',
    fontWeight: 700,
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
    border: '1px solid rgba(255,213,107,0.20)',
  },
  closeBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    width: '26px',
    height: '26px',
    borderRadius: '7px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '22px',
    fontWeight: 400,
    color: 'var(--text)',
    letterSpacing: '-0.01em',
    lineHeight: 1.25,
    margin: '0 0 10px',
  },
  popBody: {
    fontSize: '14px',
    color: 'var(--text-2)',
    lineHeight: 1.6,
    margin: '0 0 16px',
  },
  progressBar: {
    height: '4px',
    background: 'var(--bg-2)',
    borderRadius: '999px',
    overflow: 'hidden',
    marginBottom: '14px',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--accent-text) 0%, #5DC077 100%)',
    borderRadius: '999px',
    transition: 'width .4s cubic-bezier(.4,0,.2,1)',
  },
  popFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  skipBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '12.5px',
    cursor: 'pointer',
    padding: '6px 10px',
    fontFamily: 'inherit',
  },
  prevBtn: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
    color: 'var(--text-2)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all .15s',
  },
  nextBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    background: 'var(--accent-text)',
    color: 'var(--bg)',
    border: 'none',
    borderRadius: '9px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 4px 12px rgba(255,213,107,0.25)',
  },
  ctaBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    background: 'var(--accent-text)',
    color: 'var(--bg)',
    borderRadius: '9px',
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'none',
    boxShadow: '0 4px 12px rgba(255,213,107,0.25)',
  },
}
