'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ComparisonTable from './ComparisonTable'
import Resources from './Resources'
import {
  HouseLine, Coffee, Buildings, Handshake, Sparkle,
  Scales, CurrencyEur, ClipboardText, Globe, Briefcase, FileText, Megaphone, ShieldCheck, Gavel,
  Warning, Info, CheckCircle, ArrowRight, BookOpen, ArrowUpRight,
  Leaf, IdentificationBadge, UsersThree, Calculator, ForkKnife, Wheelchair,
  UserGear, Target, ChartLineUp, MapPin, EnvelopeSimple, Star, Confetti,
  Lock, Stack, MagnifyingGlass, Receipt, ChatCircleText,
} from '@phosphor-icons/react'

const BLOG_BASE = 'https://jasonmarinho.com/blog/'

type ProfileFilter = 'all' | 'commun' | 'gites' | 'chambres' | 'conciergerie' | 'direct'
type RuleType = 'info' | 'ok' | 'warn'

interface Rule {
  type: RuleType
  text: React.ReactNode
}

interface RelatedArticle {
  label: string
  slug: string
}

interface GuideCard {
  id: string
  profile: Exclude<ProfileFilter, 'all'>
  iconColor: string
  iconBg: string
  icon: React.ReactNode
  title: string
  subtitle: string
  rules: Rule[]
  articles?: RelatedArticle[]
  /** keywords additionnels pour la recherche (acronymes, synonymes) */
  keywords?: string
}

const PROFILE_DEFS: Record<Exclude<ProfileFilter, 'all'>, {
  label: string
  icon: React.ReactNode
  color: string
  bg: string
}> = {
  commun:       { label: 'Essentiels · pour tous', icon: <Sparkle   size={13} weight="fill" />, color: '#0d9488', bg: 'rgba(13,148,136,0.12)' },
  gites:        { label: 'Gîtes · EI ou SASU',     icon: <HouseLine size={13} weight="fill" />, color: '#d97706', bg: 'rgba(245,158,11,0.12)' },
  chambres:     { label: "Chambres d'hôtes",       icon: <Coffee    size={13} weight="fill" />, color: '#db2777', bg: 'rgba(236,72,153,0.12)' },
  conciergerie: { label: 'Conciergeries',          icon: <Buildings size={13} weight="fill" />, color: '#7c3aed', bg: 'rgba(139,92,246,0.12)' },
  direct:       { label: 'Réservation directe',    icon: <Handshake size={13} weight="fill" />, color: '#059669', bg: 'rgba(16,185,129,0.12)' },
}

const GUIDE_CARDS: GuideCard[] = [
  // ── ESSENTIELS · POUR TOUS ──
  {
    id: 'commun-taxe-sejour',
    profile: 'commun',
    iconColor: '#0d9488', iconBg: 'rgba(13,148,136,0.12)',
    icon: <Receipt size={22} weight="fill" />,
    title: 'Taxe de séjour : qui, combien, comment',
    subtitle: 'L\'obligation que tout le monde a',
    rules: [
      { type: 'info', text: <>Tarif fixé par chaque commune : généralement <strong>0,20 €–5 € par nuit / personne</strong> selon classement et type d&apos;hébergement</> },
      { type: 'ok',   text: <>Si tu loues sur Airbnb/Booking : <strong>la plateforme collecte et reverse</strong> automatiquement (à vérifier dans les paramètres)</> },
      { type: 'warn', text: <>En réservation directe ou Driing : <strong>tu collectes toi-même</strong> et reverses à la mairie chaque trimestre/semestre</> },
      { type: 'info', text: <>Exonérations possibles : enfants &lt; 18 ans, saisonniers, urgence relogement — vérifier le règlement local</> },
    ],
    articles: [
      { label: 'Taxe de séjour : comment collecter', slug: 'taxe-sejour-lcd-comment-collecter' },
    ],
  },
  {
    id: 'commun-fiche-police',
    profile: 'commun',
    iconColor: '#3b82f6', iconBg: 'rgba(59,130,246,0.12)',
    icon: <ClipboardText size={22} weight="fill" />,
    title: 'Fiche police & registre voyageurs',
    subtitle: 'Souvent ignoré, parfois sanctionné',
    rules: [
      { type: 'warn', text: <><strong>Obligation légale</strong> pour tout hébergement touristique d&apos;établir une fiche d&apos;identité par voyageur étranger</> },
      { type: 'info', text: <>Données : nom, prénom, date et lieu de naissance, nationalité, adresse, dates de séjour</> },
      { type: 'warn', text: <>Conservation <strong>6 mois</strong> minimum, transmission à la police nationale ou gendarmerie sur demande — amende jusqu&apos;à <strong>1 500 €</strong></> },
      { type: 'ok',   text: <>Le livret d&apos;accueil digital (Driing, Hospitable) peut collecter ces infos automatiquement à l&apos;arrivée</> },
    ],
    articles: [
      { label: 'Formulaire fiche police obligatoire', slug: 'formulaire-fiche-police-lcd-obligatoire' },
    ],
  },
  {
    id: 'commun-rgpd',
    profile: 'commun',
    iconColor: '#6366f1', iconBg: 'rgba(99,102,241,0.12)',
    icon: <Lock size={22} weight="fill" />,
    title: 'RGPD : données voyageurs',
    subtitle: 'Ce que tu peux stocker, comment, combien de temps',
    rules: [
      { type: 'info', text: <>Bases légales : <strong>contrat</strong> (réservation), <strong>obligation légale</strong> (fiche police), <strong>consentement</strong> (newsletter)</> },
      { type: 'ok',   text: <>Données autorisées sans consentement : nom, mail, téléphone (résa) — <strong>pas de carte d&apos;identité ni passeport</strong> sauf obligation légale</> },
      { type: 'warn', text: <>Durée de conservation à respecter : <strong>3 ans après le dernier séjour</strong> pour le marketing, 10 ans pour les justificatifs comptables</> },
      { type: 'info', text: <>Mentions obligatoires : <strong>politique de confidentialité</strong> sur le site, droit d&apos;accès / suppression / portabilité</> },
    ],
    articles: [
      { label: 'RGPD données voyageurs Airbnb', slug: 'rgpd-donnees-voyageurs-airbnb-conformite' },
    ],
  },
  {
    id: 'commun-pricing',
    profile: 'commun',
    iconColor: '#22c55e', iconBg: 'rgba(34,197,94,0.12)',
    icon: <ChartLineUp size={22} weight="fill" />,
    title: 'Pricing & saisonnalité',
    subtitle: 'Le levier de revenu n°1, souvent négligé',
    rules: [
      { type: 'info', text: <><strong>Pricing dynamique</strong> = ajustement quotidien selon demande, jours de la semaine, événements locaux, météo</> },
      { type: 'ok',   text: <>Outils payants recommandés : <strong>PriceLabs, Beyond, Wheelhouse</strong> (~1 % du CA) — fonctionnent sur Airbnb, Booking, Driing et site propre</> },
      { type: 'warn', text: <>Définir un <strong>prix plancher</strong> (point mort) et un <strong>prix plafond</strong> (haute demande) pour cadrer les algos</> },
      { type: 'info', text: <>La saisonnalité varie énormément par région : station de ski, littoral, ville, campagne — benchmarks via AirDNA indispensable</> },
    ],
    articles: [
      { label: 'Tarification dynamique LCD', slug: 'tarification-dynamique-lcd' },
      { label: 'Saisonnalité par région 2026', slug: 'saisonnalite-tarif-region-france-lcd-2026' },
      { label: 'Prix min/max : fourchette tarifaire', slug: 'prix-min-max-airbnb-fourchette-tarifaire' },
      { label: 'Fixer son prix minimum', slug: 'fixer-prix-minimum-airbnb-lcd' },
    ],
  },
  {
    id: 'commun-channel-managers',
    profile: 'commun',
    iconColor: '#a855f7', iconBg: 'rgba(168,85,247,0.12)',
    icon: <Stack size={22} weight="fill" />,
    title: 'Channel managers & outils',
    subtitle: 'Mutualiser calendriers, prix, messages',
    rules: [
      { type: 'info', text: <>Un <strong>channel manager</strong> centralise les annonces multi-plateformes (Airbnb, Booking, Vrbo, Driing, site propre)</> },
      { type: 'ok',   text: <>Top du marché : <strong>Smoobu</strong> (entrée de gamme, ~25 €/mois), <strong>Lodgify</strong>, <strong>Hospitable</strong> (ex-Smartbnb), <strong>Beds24</strong>, <strong>Hostaway</strong></> },
      { type: 'warn', text: <>Sans channel manager au-delà de 3 biens : risque de double-réservation et burnout administratif assuré</> },
      { type: 'info', text: <>Synchronisation iCal : solution gratuite mais lente (15–60 min) — réservé aux petits volumes</> },
    ],
    articles: [
      { label: 'Logiciels conciergerie : comparatif 2026', slug: 'logiciels-conciergerie-comparatif-2026' },
      { label: 'Outils gratuits indispensables', slug: 'outils-gratuits-indispensables-demarrer-lcd-2026' },
      { label: 'Synchronisation calendrier perso', slug: 'integration-calendrier-perso-airbnb-google' },
    ],
  },
  {
    id: 'commun-avis',
    profile: 'commun',
    iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.12)',
    icon: <Star size={22} weight="fill" />,
    title: 'Avis & e-réputation',
    subtitle: 'La clé de ta crédibilité, toutes plateformes confondues',
    rules: [
      { type: 'ok',   text: <>Objectif réaliste : <strong>4,8/5 minimum</strong> sur les plateformes (Airbnb, Booking, Google) — en dessous, ranking en chute libre et taux de conversion qui s&apos;effondre</> },
      { type: 'info', text: <>Les 5 critères universels : propreté, communication, arrivée, exactitude, emplacement — soigner les 4 premiers, tu maîtrises tout</> },
      { type: 'warn', text: <>Mauvais avis : répondre <strong>publiquement, calmement, factuellement</strong> dans les 48h — un mauvais avis bien géré peut renforcer la confiance</> },
      { type: 'ok',   text: <>Demander un avis <strong>au moment du check-out</strong> avec un message court : taux de retour x2 vs sans relance — vaut aussi pour les voyageurs directs</> },
    ],
    articles: [
      { label: 'Obtenir des avis 5 étoiles', slug: 'obtenir-avis-5-etoiles-airbnb' },
      { label: 'Gérer un mauvais avis', slug: 'gerer-mauvais-avis-airbnb-reponse-hote' },
      { label: 'Récupérer après un mauvais avis', slug: 'recuperer-mauvais-avis-airbnb-methode-5-etapes' },
    ],
  },
  {
    id: 'commun-litiges',
    profile: 'commun',
    iconColor: '#ef4444', iconBg: 'rgba(239,68,68,0.12)',
    icon: <Warning size={22} weight="fill" />,
    title: 'Litiges, dégâts & dépôt de garantie',
    subtitle: 'Anticiper et documenter, toujours',
    rules: [
      { type: 'ok',   text: <><strong>Vérifier les voyageurs</strong> avant d&apos;accepter : profil complet, avis antérieurs, motif du séjour</> },
      { type: 'warn', text: <>En cas de dégât : photos avant/après, devis professionnel sous 14 jours — si plateforme : dossier Aircover (Airbnb) ou procédure Booking. En direct : contacter ton assureur LCD immédiatement</> },
      { type: 'info', text: <>Dépôt de garantie en direct : <strong>Swikly</strong> (digital, sans pré-débit) ou virement — montant 200–800 € selon valeur du bien</> },
      { type: 'warn', text: <>Garder traces écrites : messages plateforme, emails, photos horodatées — sans preuves, pas de dédommagement</> },
    ],
    articles: [
      { label: 'Vérifier un voyageur avant d\'accepter', slug: 'verification-voyageurs-avant-accepter-reservation-lcd' },
      { label: 'Refacturer un dégât voyageur', slug: 'refacturer-degat-voyageur-airbnb-procedure' },
      { label: 'Sortir un mauvais client (concierge)', slug: 'sortir-mauvais-client-conciergerie-procedure' },
    ],
  },

  // ── GÎTES ──
  {
    id: 'gites-statut',
    profile: 'gites',
    iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.12)',
    icon: <Scales size={22} weight="fill" />,
    title: 'Statut juridique : EI ou SASU ?',
    subtitle: 'Choisir la bonne structure selon ton projet',
    rules: [
      { type: 'info', text: <><strong>EI (Entreprise Individuelle)</strong> : création gratuite, régime TNS, cotisations ~40 % du bénéfice, responsabilité illimitée sur patrimoine personnel</> },
      { type: 'info', text: <><strong>SASU</strong> : assimilé-salarié, responsabilité limitée au capital, optimisation salaire + dividendes possible — plus de charges fixes</> },
      { type: 'ok',   text: <>EI conseillée pour <strong>1–2 biens</strong>, SASU pertinente dès que les revenus dépassent 30–40 k€/an ou pour protéger son patrimoine</> },
    ],
    articles: [
      { label: 'Guide fiscal débutant 2026', slug: 'guide-fiscal-debutant-hote-airbnb-2026' },
      { label: 'Réglementation LCD France 2026', slug: 'reglementation-lcd-france-2026' },
    ],
  },
  {
    id: 'gites-fiscalite',
    profile: 'gites',
    iconColor: '#34d399', iconBg: 'rgba(52,211,153,0.12)',
    icon: <CurrencyEur size={22} weight="fill" />,
    title: 'Classement & impact fiscal (loi Le Meur 2025)',
    subtitle: "L'abattement varie selon le classement",
    rules: [
      { type: 'ok',   text: <><strong>Classé Atout France (1–5★)</strong> : micro-BIC abattement <strong>71 %</strong>, plafond 77 700 €/an</> },
      { type: 'warn', text: <><strong>Non classé depuis 2025</strong> : abattement tombé à <strong>30 %</strong>, plafond 15 000 €/an — fort impact si tu n&apos;es pas classé</> },
      { type: 'info', text: <>Régime <strong>réel simplifié</strong> : déduction charges réelles (amortissement, travaux, intérêts) — souvent plus avantageux au-delà de 30 k€</> },
    ],
    articles: [
      { label: 'Micro-BIC abattement 2026', slug: 'micro-bic-abattement-2026-airbnb' },
      { label: 'Réglementation LCD 2026', slug: 'reglementation-lcd-france-2026' },
    ],
  },
  {
    id: 'gites-obligations',
    profile: 'gites',
    iconColor: '#60a5fa', iconBg: 'rgba(96,165,250,0.12)',
    icon: <ClipboardText size={22} weight="fill" />,
    title: 'Obligations légales du gîte',
    subtitle: "Ce que la loi impose avant d'accueillir",
    rules: [
      { type: 'warn', text: <><strong>Déclaration en mairie obligatoire</strong> (Cerfa 14004*04) avant la 1ère location</> },
      { type: 'warn', text: <><strong>Numéro d&apos;enregistrement</strong> obligatoire dans les communes &gt; 200 000 hab. et communes touristiques — amende jusqu&apos;à 5 000 €</> },
      { type: 'info', text: <><strong>Résidence principale</strong> : 120 nuits/an max · <strong>Résidence secondaire ou dédiée</strong> : pas de plafond de nuits</> },
      { type: 'ok',   text: <>Taxe de séjour à collecter et reverser à la mairie si la plateforme ne le fait pas</> },
    ],
    articles: [
      { label: 'Numéro d\'enregistrement : démarches', slug: 'numero-enregistrement-lcd-obtenir-etapes-pratiques' },
      { label: 'Numéro d\'enregistrement 20 mai 2026', slug: 'numero-enregistrement-lcd-20-mai-2026-demarches' },
      { label: 'Taxe de séjour : comment collecter', slug: 'taxe-sejour-lcd-comment-collecter' },
    ],
  },
  {
    id: 'gites-dpe',
    profile: 'gites',
    iconColor: '#22c55e', iconBg: 'rgba(34,197,94,0.12)',
    icon: <Leaf size={22} weight="fill" />,
    title: 'DPE & loi Climat — calendrier',
    subtitle: 'Les passoires thermiques deviennent illouables',
    rules: [
      { type: 'warn', text: <><strong>2025</strong> : interdiction de louer les logements classés <strong>G</strong> (consommation &gt; 450 kWh/m²/an)</> },
      { type: 'warn', text: <><strong>2028</strong> : interdiction des classés <strong>F</strong> · <strong>2034</strong> : interdiction des classés <strong>E</strong></> },
      { type: 'info', text: <>La LCD est concernée comme la LLD — un DPE valide est <strong>obligatoire dès la mise en location</strong> et l&apos;étiquette doit figurer sur l&apos;annonce</> },
      { type: 'ok',   text: <>Travaux éligibles à <strong>MaPrimeRénov&apos;</strong> et aux CEE — isolation, fenêtres, pompe à chaleur — bien avant les deadlines</> },
    ],
    articles: [
      { label: 'Travaux énergétiques & MaPrimeRénov', slug: 'travaux-energetiques-lcd-aides-maprimerenov-2026' },
    ],
  },
  {
    id: 'gites-permis',
    profile: 'gites',
    iconColor: '#f97316', iconBg: 'rgba(249,115,22,0.12)',
    icon: <IdentificationBadge size={22} weight="fill" />,
    title: 'Permis de louer & changement d\'usage',
    subtitle: 'Les pièges des grandes villes et zones tendues',
    rules: [
      { type: 'warn', text: <><strong>Paris, Lyon, Bordeaux, Annecy, Nice</strong>… : autorisation de changement d&apos;usage obligatoire pour les résidences secondaires — sinon amende jusqu&apos;à <strong>50 000 €</strong></> },
      { type: 'warn', text: <><strong>Compensation</strong> exigée à Paris : transformer un local commercial en habitation pour pouvoir louer en LCD</> },
      { type: 'info', text: <><strong>120 nuits/an</strong> max pour une résidence principale dans toute la France — quota suivi par les plateformes via le numéro d&apos;enregistrement</> },
      { type: 'ok',   text: <>Vérifier auprès de la mairie avant l&apos;achat ou la mise en location — règles très variables d&apos;une commune à l&apos;autre</> },
    ],
    articles: [
      { label: 'Réglementation LCD France 2026', slug: 'reglementation-lcd-france-2026' },
    ],
  },
  {
    id: 'gites-copropriete',
    profile: 'gites',
    iconColor: '#0ea5e9', iconBg: 'rgba(14,165,233,0.12)',
    icon: <UsersThree size={22} weight="fill" />,
    title: 'Copropriété, voisinage & règlement',
    subtitle: 'Anticiper les conflits avant qu\'ils explosent',
    rules: [
      { type: 'warn', text: <>Le <strong>règlement de copropriété</strong> peut interdire la LCD (clause d&apos;habitation bourgeoise stricte) — vérifier avant l&apos;achat</> },
      { type: 'info', text: <>Une majorité de copropriétaires peut interdire la LCD <strong>par vote en AG</strong> dans certaines conditions (loi ALUR + jurisprudences récentes)</> },
      { type: 'ok',   text: <>Règlement intérieur clair (bruit, parties communes, horaires d&apos;arrivée) + concertation avec les voisins = la meilleure prévention</> },
    ],
    articles: [
      { label: 'Droits voisins & litiges copropriété', slug: 'droits-voisins-lcd-copropriete-litiges' },
      { label: 'Bruit & règlement intérieur efficace', slug: 'bruit-reglement-interieur-lcd-efficace' },
    ],
  },
  {
    id: 'gites-rentabilite',
    profile: 'gites',
    iconColor: '#a78bfa', iconBg: 'rgba(167,139,250,0.12)',
    icon: <Calculator size={22} weight="fill" />,
    title: 'Calculer la rentabilité d\'un bien',
    subtitle: 'Avant d\'acheter, mesurer le cash-flow réel',
    rules: [
      { type: 'info', text: <><strong>Revenu théorique</strong> = nuitée moyenne × taux d&apos;occupation × 365 — varier selon saisonnalité de la zone</> },
      { type: 'warn', text: <>Coûts à intégrer : commissions plateformes (15 %), ménage, linge, énergie, abonnements, taxe foncière, assurance, mensualité crédit, provision travaux</> },
      { type: 'ok',   text: <><strong>Point mort</strong> = nb de nuitées/an pour couvrir les charges fixes — au-delà, tout est marge</> },
      { type: 'info', text: <>Outils utiles : <strong>AirDNA</strong> pour les benchmarks de zone, simulateur Driing pour le yield</> },
    ],
    articles: [
      { label: 'Point mort LCD : calcul rentabilité', slug: 'point-mort-lcd-calcul-rentabilite-hote' },
      { label: 'Budget annuel hôte : grille de coûts', slug: 'budget-annuel-hote-lcd-grille-couts' },
      { label: 'AirDNA mode d\'emploi', slug: 'airdna-mode-emploi-hote-lcd-debutant' },
    ],
  },

  // ── CHAMBRES D'HÔTES ──
  {
    id: 'chambres-regles',
    profile: 'chambres',
    iconColor: '#fb7185', iconBg: 'rgba(251,113,133,0.12)',
    icon: <Gavel size={22} weight="fill" />,
    title: 'Les règles légales strictes (loi 2006)',
    subtitle: 'Les obligations que beaucoup ignorent',
    rules: [
      { type: 'warn', text: <><strong>Maximum 5 chambres</strong> et <strong>15 personnes simultanément</strong> — au-delà, c&apos;est un autre régime juridique</> },
      { type: 'warn', text: <><strong>Petit-déjeuner obligatoire</strong> (légalement) — il doit être proposé, inclus ou en option payante</> },
      { type: 'warn', text: <><strong>Propriétaire présent sur place</strong> obligatoirement — contrairement au gîte où tu peux être absent</> },
      { type: 'info', text: <>Ne pas appeler &ldquo;gîte&rdquo; une chambre d&apos;hôtes — la terminologie est encadrée par la loi</> },
    ],
    articles: [
      { label: 'TVA petit-déjeuner : seuil 37 500 €', slug: 'tva-petit-dejeuner-lcd-seuil-37500-2026-detail' },
      { label: 'Réglementation LCD 2026', slug: 'reglementation-lcd-france-2026' },
    ],
  },
  {
    id: 'chambres-fiscalite',
    profile: 'chambres',
    iconColor: '#a78bfa', iconBg: 'rgba(167,139,250,0.12)',
    icon: <CurrencyEur size={22} weight="fill" />,
    title: "Fiscalité spécifique chambres d'hôtes",
    subtitle: 'Différente du meublé de tourisme classique',
    rules: [
      { type: 'ok',   text: <>Si revenus &lt; <strong>760 €/an</strong> : exonération fiscale totale possible</> },
      { type: 'info', text: <>Micro-BIC <strong>71 % abattement</strong> si classées Gîtes de France ou Clévacances — <strong>50 %</strong> si non classées</> },
      { type: 'warn', text: <>Classement <strong>Atout France (meublé de tourisme) interdit</strong> pour les chambres d&apos;hôtes — régime différent</> },
      { type: 'ok',   text: <>Labels possibles : <strong>Gîtes de France</strong> (épis) et <strong>Clévacances</strong> (clés) — recommandés pour le référencement et la fiscalité</> },
    ],
    articles: [
      { label: 'Guide fiscal débutant 2026', slug: 'guide-fiscal-debutant-hote-airbnb-2026' },
      { label: 'TVA petit-déjeuner détail', slug: 'tva-petit-dejeuner-lcd-seuil-37500-2026-detail' },
    ],
  },
  {
    id: 'chambres-plateformes',
    profile: 'chambres',
    iconColor: '#2dd4bf', iconBg: 'rgba(45,212,191,0.12)',
    icon: <Globe size={22} weight="fill" />,
    title: 'Canaux de réservation adaptés',
    subtitle: "Airbnb n'est pas ton seul levier",
    rules: [
      { type: 'ok',   text: <>Airbnb, Booking.com, Abritel/Vrbo : compatibles avec les chambres d&apos;hôtes</> },
      { type: 'ok',   text: <><strong>Réseau Gîtes de France</strong> : spécialisé chambres d&apos;hôtes, clientèle qualifiée — recommandé</> },
      { type: 'ok',   text: <><strong>Driing</strong> et site propre : réservation directe sans commission — fort potentiel pour fidéliser les voyageurs récurrents</> },
      { type: 'info', text: <><strong>Google My Business</strong> : levier visibilité locale essentiel pour les chambres d&apos;hôtes en zone rurale ou touristique</> },
    ],
    articles: [
      { label: 'Airbnb vs Booking : comparatif', slug: 'airbnb-vs-booking-com-location-courte-duree' },
      { label: 'GMB pour réservations directes', slug: 'google-my-business-reservations-directes-hotes-lcd' },
    ],
  },
  {
    id: 'chambres-haccp',
    profile: 'chambres',
    iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.12)',
    icon: <ForkKnife size={22} weight="fill" />,
    title: 'HACCP & hygiène alimentaire (petit-déj)',
    subtitle: 'Servir un petit-déjeuner = obligations sanitaires',
    rules: [
      { type: 'warn', text: <><strong>Déclaration auprès de la DDPP</strong> (CERFA 13984*06) obligatoire dès qu&apos;on sert des denrées</> },
      { type: 'info', text: <>Application des principes <strong>HACCP</strong> : traçabilité des produits, chaîne du froid, dates de péremption, plan de nettoyage</> },
      { type: 'ok',   text: <>Formation hygiène alimentaire <strong>conseillée</strong> — non obligatoire pour les chambres d&apos;hôtes mais recommandée pour limiter les risques</> },
      { type: 'warn', text: <>Au-delà de <strong>37 500 € de CA petit-déj</strong> : <strong>TVA 10 %</strong> obligatoire — souvent ignoré</> },
    ],
    articles: [
      { label: 'TVA petit-déjeuner détail', slug: 'tva-petit-dejeuner-lcd-seuil-37500-2026-detail' },
    ],
  },
  {
    id: 'chambres-erp-pmr',
    profile: 'chambres',
    iconColor: '#06b6d4', iconBg: 'rgba(6,182,212,0.12)',
    icon: <Wheelchair size={22} weight="fill" />,
    title: 'ERP & accessibilité PMR',
    subtitle: 'Quand le logement devient un établissement',
    rules: [
      { type: 'warn', text: <>À partir de <strong>5 chambres</strong> ou <strong>15 personnes</strong>, l&apos;activité bascule en <strong>ERP de type O</strong> — règles de sécurité incendie strictes</> },
      { type: 'info', text: <>ERP = visite de la commission sécurité, registre de sécurité, alarme, BAES, plan d&apos;évacuation</> },
      { type: 'warn', text: <><strong>Accessibilité PMR</strong> obligatoire pour tout ERP : au moins 1 chambre adaptée + cheminement, sanitaires accessibles</> },
      { type: 'ok',   text: <>Si tu es sous le seuil (4 chambres / &lt;15 pers.) : tu n&apos;es pas ERP, mais l&apos;accessibilité reste un argument commercial fort</> },
    ],
    articles: [
      { label: 'ERP & classement meublé tourisme', slug: 'erp-classement-meuble-tourisme-lcd' },
    ],
  },

  // ── CONCIERGERIES ──
  {
    id: 'conciergerie-hoguet',
    profile: 'conciergerie',
    iconColor: '#818cf8', iconBg: 'rgba(129,140,248,0.12)',
    icon: <Scales size={22} weight="fill" />,
    title: "Loi Hoguet : quand s'applique-t-elle ?",
    subtitle: 'La question que toute conciergerie doit se poser',
    rules: [
      { type: 'warn', text: <><strong>Tu encaisses les loyers pour le propriétaire</strong> → Loi Hoguet s&apos;applique → carte professionnelle obligatoire + garantie financière</> },
      { type: 'ok',   text: <><strong>Le propriétaire encaisse directement</strong> (via Airbnb, Booking, virement) → Prestation de services classique → pas de carte pro requise</> },
      { type: 'info', text: <>La plupart des conciergeries évitent la loi Hoguet en structurant correctement le flux de paiement dès le départ</> },
    ],
    articles: [
      { label: 'Créer une conciergerie LCD en 2025', slug: 'creer-conciergerie-airbnb-2025' },
      { label: 'Contrat de mandat conciergerie', slug: 'contrat-mandat-conciergerie-lcd-modele-clauses' },
    ],
  },
  {
    id: 'conciergerie-statut',
    profile: 'conciergerie',
    iconColor: '#a78bfa', iconBg: 'rgba(167,139,250,0.12)',
    icon: <Briefcase size={22} weight="fill" />,
    title: 'Statuts recommandés & TVA',
    subtitle: 'Choisir la bonne structure pour scaler',
    rules: [
      { type: 'ok',   text: <><strong>Micro-entreprise</strong> : pour démarrer, plafond 77 700 €/an (prestations de services), franchise TVA jusqu&apos;à 36 800 €</> },
      { type: 'ok',   text: <><strong>SASU/SAS</strong> : pour aller au-delà, protéger son patrimoine, avoir des associés ou employés</> },
      { type: 'warn', text: <><strong>TVA 20 %</strong> obligatoire dès 36 800 € de CA — à intégrer dans ta tarification dès le départ</> },
      { type: 'info', text: <><strong>RC Pro obligatoire</strong> dans tous les cas — couvre les dommages causés lors des prestations</> },
    ],
    articles: [
      { label: 'Créer une conciergerie LCD 2025', slug: 'creer-conciergerie-airbnb-2025' },
      { label: 'Tarif conciergerie : grille marché', slug: 'tarif-conciergerie-lcd-grille-marche-2026' },
    ],
  },
  {
    id: 'conciergerie-contrats',
    profile: 'conciergerie',
    iconColor: '#2dd4bf', iconBg: 'rgba(45,212,191,0.12)',
    icon: <FileText size={22} weight="fill" />,
    title: 'Contrats & tarification',
    subtitle: 'Les bases contractuelles indispensables',
    rules: [
      { type: 'warn', text: <><strong>Contrat de mandat de gestion</strong> obligatoire avec chaque propriétaire — définit honoraires, périmètre, durée et conditions de résiliation</> },
      { type: 'info', text: <>Honoraires usuels : <strong>15–30 % des revenus bruts</strong> selon les services inclus (ménage, accueil, gestion messages, etc.)</> },
      { type: 'ok',   text: <>Distinguer les prestations incluses dans les honoraires et celles facturées en supplément (ménage, linge, réparations)</> },
    ],
    articles: [
      { label: 'Modèle contrat mandat conciergerie', slug: 'contrat-mandat-conciergerie-lcd-modele-clauses' },
      { label: 'Tarif conciergerie 2026', slug: 'tarif-conciergerie-lcd-grille-marche-2026' },
    ],
  },
  {
    id: 'conciergerie-equipe',
    profile: 'conciergerie',
    iconColor: '#ec4899', iconBg: 'rgba(236,72,153,0.12)',
    icon: <UserGear size={22} weight="fill" />,
    title: 'URSSAF, équipe ménage & sous-traitance',
    subtitle: 'Recruter et déclarer correctement',
    rules: [
      { type: 'warn', text: <><strong>Salariat</strong> : contrat CDD/CDI, charges patronales (~42 %), gestion des congés et arrêts — sécurité juridique mais coût élevé</> },
      { type: 'info', text: <><strong>Sous-traitance</strong> (auto-entrepreneur, micro) : facturation à la prestation, pas de lien de subordination — attention au risque de requalification</> },
      { type: 'warn', text: <>Le risque de <strong>requalification en salariat déguisé</strong> est réel : éviter d&apos;imposer horaires fixes, exclusivité, matériel</> },
      { type: 'ok',   text: <>Solution hybride : <strong>équipe noyau salariée</strong> (qualité, fidélité) + <strong>renforts indépendants</strong> en haute saison</> },
    ],
    articles: [
      { label: 'Recruter et fidéliser une équipe ménage', slug: 'equipe-menage-conciergerie-recruter-fideliser' },
    ],
  },
  {
    id: 'conciergerie-prospection',
    profile: 'conciergerie',
    iconColor: '#10b981', iconBg: 'rgba(16,185,129,0.12)',
    icon: <Target size={22} weight="fill" />,
    title: 'Trouver son premier mandat',
    subtitle: 'Décrocher la confiance avant la facture',
    rules: [
      { type: 'info', text: <>Cibler d&apos;abord les <strong>propriétaires en sous-performance</strong> sur Airbnb (annonces non optimisées, peu d&apos;avis, photos médiocres)</> },
      { type: 'ok',   text: <>Outils d&apos;analyse marché : <strong>AirDNA</strong> (données revenus / occupation), <strong>Inside Airbnb</strong> (open data) — identifier les biens sous-performants dans ta zone</> },
      { type: 'ok',   text: <>Approche : <strong>audit gratuit</strong> du bien (photos, annonce, prix) + démonstration chiffrée du gain potentiel</> },
      { type: 'info', text: <>Réseaux pro : agences immo locales, gestionnaires de patrimoine, notaires — souvent prescripteurs de propriétaires investisseurs</> },
    ],
    articles: [
      { label: 'Prospection : trouver le 1er mandat', slug: 'prospection-conciergerie-trouver-premier-mandat' },
    ],
  },
  {
    id: 'conciergerie-scaler',
    profile: 'conciergerie',
    iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.12)',
    icon: <ChartLineUp size={22} weight="fill" />,
    title: 'Scaler de 5 à 30 mandats',
    subtitle: 'Industrialiser sans casser la qualité',
    rules: [
      { type: 'warn', text: <>Goulot n°1 : la <strong>communication client</strong> — automatiser dès 10 mandats avec gabarits + scénarios (Make/Zapier)</> },
      { type: 'ok',   text: <><strong>Channel manager</strong> indispensable : Smoobu, Lodgify, Hospitable, Beds24 — mutualise calendriers, prix, messages multi-plateformes</> },
      { type: 'info', text: <><strong>Reporting mensuel automatisé</strong> par propriétaire : nuitées, CA, occupation, photos — c&apos;est ton meilleur argument de fidélisation</> },
      { type: 'ok',   text: <>Onboarding standardisé : checklist d&apos;audit du bien, photos pro, mise en ligne, livret d&apos;accueil — 7 à 10 jours pour un nouveau bien</> },
    ],
    articles: [
      { label: 'Scaler de 5 à 30 mandats', slug: 'scaler-conciergerie-5-30-mandats-process' },
      { label: 'Logiciels conciergerie : comparatif', slug: 'logiciels-conciergerie-comparatif-2026' },
      { label: 'Automatiser avec Make/Zapier', slug: 'make-zapier-workflow-airbnb-no-code-debutant' },
    ],
  },

  // ── RÉSERVATION DIRECTE ──
  {
    id: 'direct-contrat',
    profile: 'direct',
    iconColor: '#34d399', iconBg: 'rgba(52,211,153,0.12)',
    icon: <FileText size={22} weight="fill" />,
    title: 'Contrat obligatoire sans plateforme',
    subtitle: 'Ce que tu dois avoir avant le premier séjour',
    rules: [
      { type: 'warn', text: <><strong>Contrat de location saisonnière obligatoire</strong> — mentions légales : identité des parties, durée, prix, descriptif du logement, conditions d&apos;annulation</> },
      { type: 'info', text: <>État des lieux <strong>recommandé</strong> (non obligatoire pour LCD &lt; 30 jours, mais utile en cas de litige)</> },
      { type: 'ok',   text: <><strong>Taxe de séjour à collecter toi-même</strong> et reverser à la mairie — montant selon commune et catégorie du logement</> },
    ],
    articles: [
      { label: 'Sécuriser le paiement réservation directe', slug: 'securiser-paiement-reservation-directe-sans-airbnb' },
      { label: 'Stripe pour la résa directe', slug: 'stripe-paiement-direct-lcd-mise-en-place' },
      { label: 'Taxe de séjour : collecter', slug: 'taxe-sejour-lcd-comment-collecter' },
    ],
  },
  {
    id: 'direct-assurance',
    profile: 'direct',
    iconColor: '#fb7185', iconBg: 'rgba(251,113,133,0.12)',
    icon: <ShieldCheck size={22} weight="fill" />,
    title: "Assurance : pas d'AirCover hors Airbnb",
    subtitle: 'La protection que tu dois assurer toi-même',
    rules: [
      { type: 'warn', text: <><strong>Assurance habitation classique insuffisante</strong> pour la LCD — vérifie et informe obligatoirement ton assureur</> },
      { type: 'ok',   text: <>Contrats adaptés : <strong>MAIF, MMA, Hiscox, AXA Pro</strong> — extension LCD ou contrat dédié couvrant dommages, vol, RC voyageur</> },
      { type: 'ok',   text: <>Caution/dépôt de garantie : <strong>Swikly</strong> (digitale), virement, ou chèque — délai de restitution à préciser dans le contrat (usage : 7 jours)</> },
      { type: 'info', text: <>Assurance annulation voyageur : tu peux proposer Chapka, AXA Assistance — ça rassure et évite les litiges d&apos;annulation</> },
    ],
    articles: [
      { label: 'Assurance LCD : 5 garanties indispensables', slug: 'assurance-lcd-5-garanties-indispensables-2026' },
      { label: 'Assurance location courte durée : couverture', slug: 'assurance-location-courte-duree-airbnb-couverture' },
    ],
  },
  {
    id: 'direct-visibilite',
    profile: 'direct',
    iconColor: '#fbbf24', iconBg: 'rgba(251,191,36,0.12)',
    icon: <Megaphone size={22} weight="fill" />,
    title: 'Se rendre visible sans Airbnb',
    subtitle: 'Les canaux pour remplir ton calendrier en direct',
    rules: [
      { type: 'ok',   text: <><strong>Google My Business</strong> : fiche gratuite, apparaît dans les recherches locales — indispensable pour gîtes et chambres d&apos;hôtes</> },
      { type: 'ok',   text: <><strong>Driing</strong> : annonce directe sans commission, comparateur de prix intégré, voyageurs qualifiés</> },
      { type: 'ok',   text: <>Paiements : <strong>Stripe, SumUp, Driing ou virement bancaire</strong> — prévoir une solution sécurisée avant le premier séjour direct</> },
      { type: 'info', text: <>Construire une <strong>base de voyageurs fidèles</strong> (email, Instagram) : la réservation directe se développe sur le temps long</> },
    ],
    articles: [
      { label: 'SEO local hôte LCD', slug: 'seo-local-hote-lcd-google-maps-visibilite' },
      { label: 'GMB pour réservations directes', slug: 'google-my-business-reservations-directes-hotes-lcd' },
      { label: 'Email marketing hôte LCD', slug: 'email-marketing-newsletter-hote-lcd' },
      { label: 'Instagram pour hôtes LCD', slug: 'instagram-hotes-lcd-attirer-voyageurs-reservations-directes' },
    ],
  },
  {
    id: 'direct-seo-local',
    profile: 'direct',
    iconColor: '#0ea5e9', iconBg: 'rgba(14,165,233,0.12)',
    icon: <MapPin size={22} weight="fill" />,
    title: 'SEO local & Google Business Profile',
    subtitle: 'Apparaître quand on cherche "gîte + ta ville"',
    rules: [
      { type: 'ok',   text: <><strong>Fiche Google Business</strong> bien remplie : photos, horaires, description, posts hebdomadaires — c&apos;est le canal n°1 pour le local</> },
      { type: 'info', text: <><strong>Avis Google</strong> : objectif 4,7+/5 avec 30+ avis pour ranker dans les résultats locaux — solliciter chaque voyageur après le séjour</> },
      { type: 'ok',   text: <>Mots-clés à cibler : "gîte + ville", "chambre d&apos;hôtes + région", "location vacances + lac/montagne/mer"</> },
      { type: 'info', text: <>Site web propre + page dédiée par bien + balisage <strong>schema.org LocalBusiness</strong> pour amplifier la visibilité Google</> },
    ],
    articles: [
      { label: 'SEO local : Google Maps visibilité', slug: 'seo-local-hote-lcd-google-maps-visibilite' },
      { label: 'GMB : questions/réponses', slug: 'gmb-questions-reponses-hotes-lcd-optimiser' },
      { label: 'GMB : formation contenu', slug: 'formation-google-my-business-lcd-contenu' },
    ],
  },
  {
    id: 'direct-site-propre',
    profile: 'direct',
    iconColor: '#0ea5e9', iconBg: 'rgba(14,165,233,0.12)',
    icon: <Globe size={22} weight="fill" />,
    title: 'Site web & page de réservation propre',
    subtitle: 'Ton QG digital sans commission, sans dépendance',
    rules: [
      { type: 'ok',   text: <><strong>Driing</strong> : page de réservation directe prête en 30 min, 0 % commission, paiements intégrés — idéal pour démarrer</> },
      { type: 'ok',   text: <>Site complet : <strong>Lodgify, Hostfully, Beds24</strong> — widget de réservation, calendrier, paiement, tout en un (~25–40 €/mois)</> },
      { type: 'info', text: <>Site WordPress + plugin (WP Booking System, Beds24 iframe) : flexibilité maximale mais setup plus long — pertinent pour les profils tech</> },
      { type: 'warn', text: <>Contenu indispensable sur ta page : <strong>photos haute résolution, tarifs clairs, calendrier dispo, conditions d&apos;annulation et formulaire de contact</strong></> },
      { type: 'ok',   text: <>Ajouter un bouton "Réserver en direct" depuis ton profil Airbnb dans ta bio / livret d&apos;accueil — sans violer les CGU</> },
    ],
    articles: [
      { label: 'Driing : réservation sans commission', slug: 'driing-plateforme-vacances-sans-commissions' },
      { label: 'Créer sa page réservation directe', slug: 'creer-page-reservation-directe-hote-lcd' },
    ],
    keywords: 'site web page driing lodgify wordpress widget',
  },
  {
    id: 'direct-paiement',
    profile: 'direct',
    iconColor: '#10b981', iconBg: 'rgba(16,185,129,0.12)',
    icon: <CurrencyEur size={22} weight="fill" />,
    title: 'Paiement sécurisé sans plateforme',
    subtitle: 'Encaisser sans Airbnb, sans risque',
    rules: [
      { type: 'ok',   text: <><strong>Stripe</strong> : solution professionnelle, lien de paiement ou formulaire intégrable — frais ~1,5 % + 0,25 € en Europe</> },
      { type: 'ok',   text: <><strong>Driing</strong> : paiement inclus dans la plateforme, virement sous 48h — la solution la plus simple pour les hôtes qui débutent en direct</> },
      { type: 'info', text: <><strong>SumUp</strong> : idéal si accueil physique (terminal carte), aussi avec lien de paiement en ligne</> },
      { type: 'warn', text: <>Virement bancaire : gratuit mais risque de non-paiement — toujours exiger <strong>100 % à la réservation</strong> ou acompte 30 % + solde 30j avant arrivée</> },
      { type: 'warn', text: <>Éviter PayPal pour les pros : protection acheteur trop favorable au voyageur, risques de remboursements forcés</> },
    ],
    articles: [
      { label: 'Sécuriser le paiement réservation directe', slug: 'securiser-paiement-reservation-directe-sans-airbnb' },
      { label: 'Stripe pour la réservation directe', slug: 'stripe-paiement-direct-lcd-mise-en-place' },
    ],
    keywords: 'stripe sumup paiement virement encaisser securite',
  },
  {
    id: 'direct-conversion',
    profile: 'direct',
    iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.12)',
    icon: <ChatCircleText size={22} weight="fill" />,
    title: 'Convertir tes voyageurs plateforme → direct',
    subtitle: 'La stratégie pour s\'affranchir des commissions',
    rules: [
      { type: 'ok',   text: <><strong>Livret d&apos;accueil digital</strong> : y intégrer discrètement ton lien Driing / site propre et l&apos;offre "prochaine réservation en direct — 5 % offerts"</> },
      { type: 'info', text: <>Carte de visite dans le logement : QR code vers ta page de réservation + votre Wi-Fi = touché par 100 % des voyageurs</> },
      { type: 'ok',   text: <>Message post-séjour : remercier + donner le lien direct pour "revenir sans passer par la plateforme" — rester dans les règles (pas de sollicitation pendant le séjour)</> },
      { type: 'warn', text: <>Règles Airbnb/Booking : pas de coordonnées personnelles pendant le séjour — attendre le <strong>check-out</strong> pour proposer la résa directe</> },
      { type: 'info', text: <>Construire son fichier email voyageurs au fil des séjours : c&apos;est l&apos;actif le plus précieux de ton activité en direct</> },
    ],
    articles: [
      { label: 'Convertir voyageurs Airbnb en direct', slug: 'convertir-voyageurs-airbnb-reservation-directe' },
      { label: 'Email marketing & newsletter hôte', slug: 'email-marketing-newsletter-hote-lcd' },
    ],
    keywords: 'conversion direct fidélisation livret accueil qr code',
  },
  {
    id: 'direct-fidelisation',
    profile: 'direct',
    iconColor: '#a78bfa', iconBg: 'rgba(167,139,250,0.12)',
    icon: <EnvelopeSimple size={22} weight="fill" />,
    title: 'Fidéliser : email, parrainage, séjours longs',
    subtitle: 'La résa directe se construit sur le temps long',
    rules: [
      { type: 'ok',   text: <><strong>Newsletter saisonnière</strong> : 4–6 envois/an aux anciens voyageurs — taux d&apos;ouverture moyen LCD = 35–45 %</> },
      { type: 'info', text: <>Programme de <strong>parrainage</strong> : 5–10 % de réduction au parrain et au filleul — ROI très élevé sur fichier qualifié</> },
      { type: 'ok',   text: <><strong>Diversifier les revenus</strong> : workation longue durée hors saison, séjours pros, événements privés — taux d&apos;occupation année lissé</> },
      { type: 'info', text: <>Conserver les <strong>emails voyageurs</strong> dès la première résa (RGPD compliant) : c&apos;est ton actif le plus précieux pour la résa directe</> },
    ],
    articles: [
      { label: 'Email marketing & newsletter', slug: 'email-marketing-newsletter-hote-lcd' },
      { label: 'Programme parrainage voyageurs', slug: 'programme-parrainage-voyageurs-fidelisation-lcd' },
      { label: 'Séjours longs hors saison', slug: 'sejours-longs-lcd-strategie-revenus-basse-saison' },
      { label: 'Workation : louer cher hors saison', slug: 'workation-lcd-logement-equiper-louer-cher-hors-saison' },
    ],
  },
]

const RULE_STYLES: Record<RuleType, { color: string; bg: string }> = {
  warn: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  ok:   { color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
  info: { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
}

function RuleIcon({ type }: { type: RuleType }) {
  if (type === 'warn') return <Warning size={14} weight="fill" />
  if (type === 'ok')   return <CheckCircle size={14} weight="fill" />
  return <Info size={14} weight="fill" />
}

function GuideCardItem({ card }: { card: GuideCard }) {
  const profileDef = PROFILE_DEFS[card.profile]
  return (
    <div style={s.card} className="glass-card">
      <div style={{ ...s.profileBadge, color: profileDef.color, background: profileDef.bg, borderColor: `${profileDef.color}40` }}>
        {profileDef.icon}
        {profileDef.label}
      </div>
      <div style={s.cardHead}>
        <div style={{ ...s.iconBox, background: card.iconBg, color: card.iconColor }}>
          {card.icon}
        </div>
        <div>
          <h3 style={s.cardTitle}>{card.title}</h3>
          <p style={s.cardSub}>{card.subtitle}</p>
        </div>
      </div>
      <div style={s.rules}>
        {card.rules.map((rule, i) => {
          const rc = RULE_STYLES[rule.type]
          return (
            <div key={i} style={{ ...s.rule, background: rc.bg }}>
              <span style={{ color: rc.color, flexShrink: 0, marginTop: '1px', display: 'flex' }}>
                <RuleIcon type={rule.type} />
              </span>
              <span style={s.ruleText}>{rule.text}</span>
            </div>
          )
        })}
      </div>

      {card.articles && card.articles.length > 0 && (
        <div style={s.articlesBlock}>
          <div style={s.articlesLabel}>
            <BookOpen size={12} weight="fill" />
            Approfondir
          </div>
          <div style={s.articlesList}>
            {card.articles.map(a => (
              <a
                key={a.slug}
                href={`${BLOG_BASE}${a.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={s.articleLink}
              >
                <span>{a.label}</span>
                <ArrowUpRight size={11} weight="bold" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const FILTER_TABS: { id: ProfileFilter; label: string; Icon: React.ElementType | null }[] = [
  { id: 'all',          label: 'Tous les profils',    Icon: null },
  { id: 'commun',       label: 'Essentiels',          Icon: Sparkle },
  { id: 'gites',        label: 'Gîtes',               Icon: HouseLine },
  { id: 'chambres',     label: "Chambres d'hôtes",    Icon: Coffee },
  { id: 'conciergerie', label: 'Conciergeries',       Icon: Buildings },
  { id: 'direct',       label: 'Réservation directe', Icon: Handshake },
]

const GLOSSARY: { term: string; def: string }[] = [
  { term: 'LCD', def: 'Location de Courte Durée — location meublée touristique de moins de 30 jours.' },
  { term: 'LMNP', def: 'Loueur en Meublé Non Professionnel — statut fiscal pour la majorité des hôtes (revenus < 23 000 € OU < 50 % des revenus du foyer).' },
  { term: 'LMP', def: 'Loueur en Meublé Professionnel — au-delà de 23 000 € de recettes ET > 50 % des revenus du foyer ; régime social et fiscal différent.' },
  { term: 'EI', def: 'Entreprise Individuelle — création gratuite, régime travailleur non salarié, responsabilité illimitée par défaut.' },
  { term: 'SASU', def: 'Société par Actions Simplifiée Unipersonnelle — assimilé-salarié, responsabilité limitée au capital, optimisation salaire/dividendes.' },
  { term: 'Micro-BIC', def: 'Régime micro pour les Bénéfices Industriels et Commerciaux — abattement forfaitaire (30 %, 50 % ou 71 %) sans déduction réelle.' },
  { term: 'Régime réel', def: 'Régime fiscal qui permet de déduire toutes les charges réelles (amortissement, intérêts, travaux) — souvent plus avantageux > 30 k€/an.' },
  { term: 'Atout France', def: 'Organisme qui classe les meublés de tourisme de 1 à 5 étoiles ; classement valable 5 ans, donne accès à l\'abattement micro-BIC 71 %.' },
  { term: 'Loi Le Meur', def: 'Loi de 2024 qui a aligné la fiscalité des meublés de tourisme non classés sur celle des LLD (abattement 30 %, plafond 15 000 €).' },
  { term: 'Loi Hoguet', def: 'Loi de 1970 qui encadre les professionnels de l\'immobilier — s\'applique aux conciergeries qui encaissent les loyers pour le compte du propriétaire.' },
  { term: 'ERP', def: 'Établissement Recevant du Public — règles de sécurité incendie strictes ; bascule à partir de 5 chambres ou 15 personnes en chambres d\'hôtes.' },
  { term: 'RC Pro', def: 'Responsabilité Civile Professionnelle — couvre les dommages causés à un tiers dans l\'exercice de l\'activité ; obligatoire pour les conciergeries.' },
  { term: 'DPE', def: 'Diagnostic de Performance Énergétique — classe le logement de A à G ; les G sont interdits à la location depuis 2025, F en 2028, E en 2034.' },
  { term: 'HACCP', def: 'Hazard Analysis Critical Control Point — démarche d\'hygiène alimentaire applicable aux chambres d\'hôtes servant un petit-déjeuner.' },
  { term: 'PMR', def: 'Personne à Mobilité Réduite — l\'accessibilité PMR est obligatoire pour les ERP (chambres d\'hôtes > 5 chambres).' },
  { term: 'GMB', def: 'Google My Business (devenu Google Business Profile) — fiche gratuite indispensable pour la visibilité locale et la réservation directe.' },
  { term: 'Channel manager', def: 'Logiciel qui synchronise calendriers, prix et messages entre Airbnb, Booking, Vrbo, Driing et site propre (Smoobu, Lodgify, Hospitable…).' },
  { term: 'Aircover', def: 'Assurance dommages incluse par Airbnb pour les hôtes — couverture limitée, ne remplace pas une vraie assurance LCD.' },
  { term: 'Cerfa 14004*04', def: 'Formulaire de déclaration en mairie pour la mise en location d\'un meublé de tourisme — obligatoire avant la 1ère location.' },
]

function Glossaire() {
  const [open, setOpen] = useState(false)
  return (
    <div style={s.glossaireWrap} className="fade-up">
      <button
        onClick={() => setOpen(o => !o)}
        style={s.glossaireToggle}
        aria-expanded={open}
      >
        <span style={s.glossaireToggleLeft}>
          <BookOpen size={16} weight="fill" />
          <span>Glossaire — {GLOSSARY.length} termes essentiels</span>
        </span>
        <span style={{ ...s.glossaireChevron, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <ArrowRight size={14} weight="bold" />
        </span>
      </button>
      {open && (
        <div style={s.glossaireList}>
          {GLOSSARY.map(g => (
            <div key={g.term} style={s.glossaireItem}>
              <div style={s.glossaireTerm}>{g.term}</div>
              <div style={s.glossaireDef}>{g.def}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function GuideUI() {
  const [activeFilter, setActiveFilter] = useState<ProfileFilter>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('guide-filter') as ProfileFilter | null
    if (saved && ['all', 'commun', 'gites', 'chambres', 'conciergerie', 'direct'].includes(saved)) {
      setActiveFilter(saved)
    }
  }, [])

  function handleFilter(id: ProfileFilter) {
    setActiveFilter(id)
    localStorage.setItem('guide-filter', id)
  }

  const q = search.trim().toLowerCase()
  const visibleCards = GUIDE_CARDS.filter(c => {
    if (activeFilter !== 'all' && c.profile !== activeFilter) return false
    if (!q) return true
    const haystack = [c.title, c.subtitle, c.keywords || '']
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })

  return (
    <div style={s.page}>

      {/* Intro */}
      <div style={s.intro} className="fade-up">
        <div style={s.updatedBadge}>
          <span style={s.updatedDot} />
          Mis à jour avril 2026
        </div>
        <h2 style={s.pageTitle}>
          Guide <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>LCD</em>
        </h2>
        <p style={s.pageDesc}>
          Gîtes en EI ou SASU, chambres d&apos;hôtes, conciergeries, réservation directe — chaque activité a ses règles, sa fiscalité, ses obligations. Ici, on ne parle pas que d&apos;Airbnb.
        </p>
      </div>

      {/* Parcours guidés (visibles seulement si pas de recherche) */}
      {!q && activeFilter === 'all' && (
        <div style={s.parcoursWrap} className="fade-up d1">
          <div style={s.parcoursLabel}>Par où commencer ?</div>
          <div style={s.parcoursList}>
            <button onClick={() => handleFilter('gites')} style={s.parcoursCard}>
              <span style={{ ...s.parcoursIcon, background: 'rgba(245,158,11,0.14)', color: '#d97706' }}>
                <HouseLine size={18} weight="fill" />
              </span>
              <div>
                <div style={s.parcoursTitle}>Je débute en gîte</div>
                <div style={s.parcoursDesc}>Statut, fiscalité, obligations légales</div>
              </div>
            </button>
            <button onClick={() => handleFilter('direct')} style={s.parcoursCard}>
              <span style={{ ...s.parcoursIcon, background: 'rgba(16,185,129,0.14)', color: '#059669' }}>
                <Handshake size={18} weight="fill" />
              </span>
              <div>
                <div style={s.parcoursTitle}>Je passe à la résa directe</div>
                <div style={s.parcoursDesc}>Contrat, paiement, visibilité</div>
              </div>
            </button>
            <button onClick={() => handleFilter('conciergerie')} style={s.parcoursCard}>
              <span style={{ ...s.parcoursIcon, background: 'rgba(139,92,246,0.14)', color: '#7c3aed' }}>
                <Buildings size={18} weight="fill" />
              </span>
              <div>
                <div style={s.parcoursTitle}>Je structure ma conciergerie</div>
                <div style={s.parcoursDesc}>Hoguet, équipe, mandats, scaling</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Recherche */}
      <div style={s.searchWrap} className="fade-up d1">
        <span style={s.searchIconWrap}>
          <MagnifyingGlass size={15} weight="bold" />
        </span>
        <input
          type="text"
          placeholder="Rechercher dans le guide… (ex : DPE, Hoguet, RGPD)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={s.searchInput}
        />
        {search && (
          <button onClick={() => setSearch('')} style={s.searchClear} aria-label="Effacer">
            ×
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={s.filterWrap} className="fade-up d1">
        {FILTER_TABS.map(tab => {
          const Icon = tab.Icon
          const isActive = activeFilter === tab.id
          const def = tab.id !== 'all' ? PROFILE_DEFS[tab.id as Exclude<ProfileFilter, 'all'>] : null
          return (
            <button
              key={tab.id}
              onClick={() => handleFilter(tab.id)}
              style={{
                ...s.filterTab,
                ...(isActive ? {
                  background: def ? def.bg : 'rgba(0,76,63,0.15)',
                  borderColor: def ? `${def.color}70` : 'var(--accent-text)',
                  color: def ? def.color : 'var(--accent-text)',
                } : {}),
              }}
            >
              {Icon && <Icon size={13} weight="fill" />}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Cards */}
      {visibleCards.length > 0 ? (
        <div className="dash-grid-2 fade-up d2" style={{ marginBottom: '32px' }}>
          {visibleCards.map(card => (
            <GuideCardItem key={card.id} card={card} />
          ))}
        </div>
      ) : (
        <div style={s.emptyState} className="fade-up">
          <MagnifyingGlass size={28} color="var(--text-3)" weight="thin" />
          <div style={s.emptyTitle}>Aucun résultat pour « {search} »</div>
          <div style={s.emptyDesc}>Essaie un mot-clé plus court ou change de profil.</div>
          <button onClick={() => setSearch('')} style={s.emptyBtn}>Effacer la recherche</button>
        </div>
      )}

      {/* Tableau comparatif des 4 profils */}
      <ComparisonTable />

      {/* Teaser : les simulateurs ont leur propre page */}
      <Link href="/dashboard/outils/simulateurs" style={s.calcTeaser} className="fade-up glass-card">
        <div style={s.calcTeaserIcon}>
          <Calculator size={20} weight="fill" />
        </div>
        <div style={s.calcTeaserContent}>
          <div style={s.calcTeaserTitle}>Outils de simulation</div>
          <div style={s.calcTeaserDesc}>
            Calcule ta fiscalité (micro-BIC), compare EI vs SASU, estime ta rentabilité et la taxe de séjour applicable.
          </div>
        </div>
        <ArrowUpRight size={18} weight="bold" style={s.calcTeaserArrow} />
      </Link>

      {/* Ressources & téléchargements */}
      <Resources />

      {/* Glossaire */}
      <Glossaire />

      {/* Driing banner */}
      <div style={s.banner} className="fade-up glass-card">
        <div style={s.bannerIcon}>
          <HouseLine size={28} color="var(--accent-text)" weight="fill" />
        </div>
        <div style={s.bannerText}>
          <h3 style={s.bannerTitle}>Tu connais Driing ?</h3>
          <p style={s.bannerDesc}>
            La plateforme de réservation sans commissions pour hôtes LCD — alternative directe à Airbnb.
          </p>
        </div>
        <Link
          href="https://jasonmarinho.com/blog/driing-plateforme-vacances-sans-commissions"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{ fontSize: '13px', padding: '10px 18px', flexShrink: 0 }}
        >
          Découvrir <ArrowRight size={14} weight="bold" />
        </Link>
      </div>

    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },

  calcTeaser: {
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: 'clamp(16px, 2.5vw, 22px)',
    borderRadius: '14px',
    textDecoration: 'none', color: 'inherit',
    marginBottom: '28px',
    transition: 'transform 0.15s, border-color 0.15s',
  },
  calcTeaserIcon: {
    width: '44px', height: '44px', borderRadius: '12px',
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  calcTeaserContent: { flex: 1, minWidth: 0 },
  calcTeaserTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '16px', fontWeight: 400, color: 'var(--text)',
    marginBottom: '3px',
  },
  calcTeaserDesc: {
    fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.55,
  },
  calcTeaserArrow: {
    color: 'var(--accent-text)', flexShrink: 0,
  },

  intro: { marginBottom: '28px', maxWidth: '640px' },
  pageTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: 'var(--text)', marginBottom: '10px' },
  pageDesc: { fontSize: '15px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.7 },

  updatedBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 500,
    color: 'var(--text-2)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    padding: '4px 10px', borderRadius: '100px',
    marginBottom: '14px',
    letterSpacing: '0.2px',
  },
  updatedDot: {
    width: '6px', height: '6px', borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 0 3px rgba(16,185,129,0.18)',
  },

  filterWrap: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px', marginBottom: '28px' },
  filterTab: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', fontWeight: 500, padding: '8px 16px',
    borderRadius: '100px', border: '1.5px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text-2)',
    cursor: 'pointer', transition: 'all 0.18s', whiteSpace: 'nowrap' as const,
  },

  card: { padding: '22px', borderRadius: '20px', display: 'flex', flexDirection: 'column' as const, gap: '0', position: 'relative' as const },

  profileBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.6px',
    textTransform: 'uppercase' as const, padding: '4px 9px',
    borderRadius: '100px', border: '1px solid',
    marginBottom: '16px', alignSelf: 'flex-start' as const,
  },

  cardHead: { display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' },
  iconBox: { width: '46px', height: '46px', borderRadius: '13px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '16px', fontWeight: 400, color: 'var(--text)', margin: '0 0 3px' },
  cardSub: { fontSize: '12px', fontWeight: 300, color: 'var(--text-2)', margin: 0 },

  rules: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  rule: { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: '9px' },
  ruleText: { fontSize: '12.5px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.55 },

  articlesBlock: {
    marginTop: '16px', paddingTop: '14px',
    borderTop: '1px solid var(--border)',
  },
  articlesLabel: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '10px', fontWeight: 600, letterSpacing: '0.6px',
    textTransform: 'uppercase' as const,
    color: 'var(--text-3)',
    marginBottom: '8px',
  },
  articlesList: {
    display: 'flex', flexDirection: 'column' as const, gap: '4px',
  },
  articleLink: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', fontWeight: 400,
    color: 'var(--text-2)', textDecoration: 'none',
    padding: '5px 8px', borderRadius: '7px',
    transition: 'all 0.15s',
    alignSelf: 'flex-start' as const,
    maxWidth: '100%',
  },

  // Parcours guidés
  parcoursWrap: { marginBottom: '20px' },
  parcoursLabel: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.6px',
    textTransform: 'uppercase' as const,
    color: 'var(--text-3)',
    marginBottom: '10px',
  },
  parcoursList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '10px',
  },
  parcoursCard: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 16px', borderRadius: '14px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontFamily: 'inherit',
    transition: 'all 0.18s',
  },
  parcoursIcon: {
    width: '36px', height: '36px', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  parcoursTitle: {
    fontSize: '13px', fontWeight: 500,
    color: 'var(--text)',
    marginBottom: '2px',
  },
  parcoursDesc: {
    fontSize: '11px', fontWeight: 300,
    color: 'var(--text-3)',
    lineHeight: 1.4,
  },

  // Recherche
  searchWrap: {
    position: 'relative' as const,
    marginBottom: '14px',
    maxWidth: '520px',
  },
  searchIconWrap: {
    position: 'absolute' as const,
    left: '14px', top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-3)',
    display: 'flex',
    pointerEvents: 'none' as const,
  },
  searchInput: {
    width: '100%',
    padding: '11px 14px 11px 40px',
    fontSize: '13px',
    fontFamily: 'inherit',
    color: 'var(--text)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  searchClear: {
    position: 'absolute' as const,
    right: '8px', top: '50%',
    transform: 'translateY(-50%)',
    width: '24px', height: '24px',
    borderRadius: '50%',
    border: 'none',
    background: 'var(--border)',
    color: 'var(--text-2)',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    lineHeight: 1,
  },

  // Empty state
  emptyState: {
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', textAlign: 'center' as const,
    gap: '8px',
    padding: '60px 20px',
    marginBottom: '32px',
  },
  emptyTitle: {
    fontSize: '15px', fontWeight: 500,
    color: 'var(--text)',
    marginTop: '8px',
  },
  emptyDesc: {
    fontSize: '13px', fontWeight: 300,
    color: 'var(--text-3)',
  },
  emptyBtn: {
    marginTop: '12px',
    padding: '8px 16px',
    fontSize: '12px', fontWeight: 500,
    color: 'var(--accent-text)',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // Glossaire
  glossaireWrap: {
    marginBottom: '24px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    overflow: 'hidden' as const,
  },
  glossaireToggle: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    width: '100%',
    padding: '16px 20px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text)',
    fontFamily: 'inherit',
    fontSize: '14px', fontWeight: 500,
  },
  glossaireToggleLeft: {
    display: 'inline-flex', alignItems: 'center', gap: '10px',
    color: 'var(--text-2)',
  },
  glossaireChevron: {
    color: 'var(--text-3)',
    transition: 'transform 0.2s',
    display: 'flex',
  },
  glossaireList: {
    padding: '0 20px 18px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '14px 24px',
    borderTop: '1px solid var(--border)',
    paddingTop: '18px',
  },
  glossaireItem: { display: 'flex', flexDirection: 'column' as const, gap: '3px' },
  glossaireTerm: {
    fontSize: '12px', fontWeight: 600,
    color: 'var(--accent-text)',
    fontFamily: 'var(--font-fraunces), serif',
    letterSpacing: '0.2px',
  },
  glossaireDef: {
    fontSize: '12.5px', fontWeight: 300,
    color: 'var(--text-2)',
    lineHeight: 1.55,
  },

  banner: { display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' as const, padding: 'clamp(20px,3vw,32px)', borderRadius: '20px' },
  bannerIcon: { width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0, background: 'rgba(0,76,63,0.25)', border: '1px solid rgba(255,213,107,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  bannerText: { flex: 1, minWidth: '200px' },
  bannerTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '17px', fontWeight: 400, color: 'var(--text)', margin: '0 0 4px' },
  bannerDesc: { fontSize: '13px', fontWeight: 300, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 },
}
