// Composant serveur, toutes les cards du Guide LCD sont rendues côté serveur.
// Permet de retirer ~30 icônes Phosphor et ~700 lignes de JSX du bundle client.
// Le filtre/recherche est géré côté client (GuideUI) via DOM data-attributes.

import {
  HouseLine, Coffee, Buildings, Handshake, Sparkle,
  Scales, CurrencyEur, ClipboardText, Globe, Briefcase, FileText, Megaphone, ShieldCheck, Gavel,
  Warning, Info, CheckCircle, BookOpen, ArrowUpRight,
  Leaf, IdentificationBadge, UsersThree, Calculator, ForkKnife, Wheelchair,
  UserGear, Target, ChartLineUp, MapPin, EnvelopeSimple, Star,
  Lock, Stack, Receipt, ChatCircleText, Wrench, GraduationCap, ArrowRight,
} from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

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
  /** Sources des faits réglementaires et fiscaux (vérifiées le 28/09/2026) */
  sources?: { label: string; url: string }[]
}

const PROFILE_DEFS: Record<Exclude<ProfileFilter, 'all'>, {
  label: string
  icon: React.ReactNode
  color: string
  bg: string
}> = {
  commun:       { label: 'Essentiels · pour tous', icon: <Sparkle   size={13} weight="fill" />, color: 'var(--accent-text)', bg: 'var(--accent-bg)' },
  gites:        { label: 'Gîtes · EI ou SASU',     icon: <HouseLine size={13} weight="fill" />, color: '#8A5A12', bg: 'rgba(255,213,107,0.20)' },
  chambres:     { label: "Chambres d'hôtes",       icon: <Coffee    size={13} weight="fill" />, color: '#B83A7C', bg: 'rgba(244,114,182,0.14)' },
  conciergerie: { label: 'Conciergeries',          icon: <Buildings size={13} weight="fill" />, color: '#6E5446', bg: 'rgba(139,109,94,0.14)' },
  direct:       { label: 'Réservation directe',    icon: <Handshake size={13} weight="fill" />, color: '#2F7D52', bg: 'rgba(47,158,91,0.12)' },
}

const GUIDE_CARDS: GuideCard[] = [
  // ── ESSENTIELS · POUR TOUS ──
  {
    id: 'commun-taxe-sejour',
    profile: 'commun',
    iconColor: 'var(--accent-text)', iconBg: 'var(--accent-bg)',
    icon: <Receipt size={22} weight="fill" />,
    title: 'Taxe de séjour : qui, combien, comment',
    subtitle: 'L\'obligation que tout le monde a',
    rules: [
      { type: 'info', text: <>Tarif voté par chaque commune, par nuit et par personne : de <strong>0,20 € à 4,90 €</strong> selon le classement en 2026. Meublé <strong>non classé</strong> : <strong>1 à 5 % du prix de la nuitée</strong> par personne</> },
      { type: 'ok',   text: <>Sur Airbnb, Booking ou Abritel : <strong>la plateforme collecte et reverse</strong> la taxe elle-même (obligatoire quand elle encaisse le paiement)</> },
      { type: 'warn', text: <>En réservation directe : <strong>tu collectes toi-même</strong> et reverses à la commune selon le calendrier qu&apos;elle fixe (souvent trimestriel)</> },
      { type: 'info', text: <>Exonérés : mineurs, titulaires d&apos;un contrat de travail saisonnier dans la commune, personnes en hébergement d&apos;urgence ou relogées temporairement. Vérifie la délibération de ta commune</> },
    ],
    sources: [
      { label: 'Barème 2026 (collectivites-locales.gouv.fr)', url: 'https://www.collectivites-locales.gouv.fr/files/files/2.%20G%C3%A9rer%20les%20finances%20publiques%20locales/3.%20La%20fiscalit%C3%A9%20locale/Fiscalit%C3%A9%20indirecte%20locale/Taxe%20de%20s%C3%A9jour/TS_TarifsMax2026-1.pdf' },
    ],
    articles: [
      { label: 'Taxe de séjour : comment collecter', slug: 'taxe-sejour-lcd-comment-collecter' },
    ],
  },
  {
    id: 'commun-fiche-police',
    profile: 'commun',
    iconColor: 'var(--accent-text)', iconBg: 'var(--accent-bg)',
    icon: <ClipboardText size={22} weight="fill" />,
    title: 'Fiche police & registre voyageurs',
    subtitle: 'Souvent ignoré, parfois sanctionné',
    rules: [
      { type: 'warn', text: <><strong>Obligation légale</strong> pour les meublés de tourisme et les chambres d&apos;hôtes : chaque voyageur étranger remplit et signe une fiche individuelle de police à son arrivée</> },
      { type: 'info', text: <>Données : nom, prénom, date et lieu de naissance, nationalité, domicile habituel, date d&apos;arrivée et de départ prévue. Les enfants de moins de 15 ans peuvent figurer sur la fiche d&apos;un adulte</> },
      { type: 'warn', text: <>Conservation <strong>6 mois</strong>, à remettre à la police ou à la gendarmerie sur demande. La fiche peut être tenue sous forme numérique</> },
      { type: 'ok',   text: <>Dans ton espace, la fiche est <strong>préremplie automatiquement</strong> pour chaque voyageur étranger (et signée s&apos;il a fait son check-in en ligne) : Mes voyageurs → Déclarations</> },
    ],
    articles: [
      { label: 'Formulaire fiche police obligatoire', slug: 'formulaire-fiche-police-lcd-obligatoire' },
    ],
    sources: [
      { label: 'Articles R814-1 à R814-3 du CESEDA (Légifrance)', url: 'https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006070158/LEGISCTA000042803266/' },
    ],
  },
  {
    id: 'commun-rgpd',
    profile: 'commun',
    iconColor: 'var(--accent-text)', iconBg: 'var(--accent-bg)',
    icon: <Lock size={22} weight="fill" />,
    title: 'RGPD : données voyageurs',
    subtitle: 'Ce que tu peux stocker, comment, combien de temps',
    rules: [
      { type: 'info', text: <>Bases légales : <strong>contrat</strong> (réservation), <strong>obligation légale</strong> (fiche police), <strong>consentement</strong> (newsletter)</> },
      { type: 'ok',   text: <>Données autorisées sans consentement : nom, mail, téléphone (résa), <strong>pas de carte d&apos;identité ni passeport</strong> sauf obligation légale</> },
      { type: 'warn', text: <>Durée de conservation : <strong>3 ans après le dernier contact</strong> pour la prospection, 10 ans pour les pièces comptables, 6 mois pour les fiches de police</> },
      { type: 'info', text: <>Mentions obligatoires : <strong>politique de confidentialité</strong> sur le site, droit d&apos;accès / suppression / portabilité</> },
    ],
    articles: [
      { label: 'RGPD données voyageurs Airbnb', slug: 'rgpd-donnees-voyageurs-airbnb-conformite' },
    ],
  },
  {
    id: 'commun-pricing',
    profile: 'commun',
    iconColor: 'var(--accent-text)', iconBg: 'var(--accent-bg)',
    icon: <ChartLineUp size={22} weight="fill" />,
    title: 'Pricing & saisonnalité',
    subtitle: 'Le levier de revenu n°1, souvent négligé',
    rules: [
      { type: 'info', text: <><strong>Pricing dynamique</strong> = ajustement quotidien selon demande, jours de la semaine, événements locaux, météo</> },
      { type: 'ok',   text: <>Outils payants recommandés : <strong>PriceLabs, Beyond, Wheelhouse</strong> (~1 % du CA), fonctionnent sur Airbnb, Booking, Driing et site propre</> },
      { type: 'warn', text: <>Définir un <strong>prix plancher</strong> (point mort) et un <strong>prix plafond</strong> (haute demande) pour cadrer les algos</> },
      { type: 'info', text: <>La saisonnalité varie énormément par région : station de ski, littoral, ville, campagne, benchmarks via AirDNA indispensable</> },
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
    iconColor: '#6E5446', iconBg: 'rgba(139,109,94,0.14)',
    icon: <Stack size={22} weight="fill" />,
    title: 'Channel managers & outils',
    subtitle: 'Mutualiser calendriers, prix, messages',
    rules: [
      { type: 'info', text: <>Un <strong>channel manager</strong> centralise les annonces multi-plateformes (Airbnb, Booking, Vrbo, Driing, site propre)</> },
      { type: 'ok',   text: <>Les plus connus : <strong>Smoobu</strong>, <strong>Lodgify</strong>, <strong>Hospitable</strong> (ex-Smartbnb), <strong>Beds24</strong>, <strong>Hostaway</strong>. Prix par logement et par mois, à vérifier sur leur grille (ils changent souvent)</> },
      { type: 'warn', text: <>Au-delà de 3 logements sur plusieurs plateformes, sans channel manager, le risque de double réservation devient réel</> },
      { type: 'info', text: <>Synchronisation <strong>iCal</strong> : gratuite mais lente (de 1 h à plusieurs heures selon la plateforme), suffisante pour 1 ou 2 logements. C&apos;est elle qu&apos;utilise ton calendrier dans l&apos;app</> },
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
    iconColor: '#B7791F', iconBg: 'rgba(255,213,107,0.20)',
    icon: <Star size={22} weight="fill" />,
    title: 'Avis & e-réputation',
    subtitle: 'La clé de ta crédibilité, toutes plateformes confondues',
    rules: [
      { type: 'ok',   text: <>Objectif : <strong>4,8/5 ou plus</strong> sur Airbnb (9/10 sur Booking). En dessous, l&apos;annonce recule dans les résultats et convertit moins</> },
      { type: 'info', text: <>Airbnb note <strong>6 critères</strong> : propreté, exactitude, arrivée, communication, emplacement, qualité-prix. Les 4 premiers dépendent entièrement de toi</> },
      { type: 'warn', text: <>Mauvais avis : répondre <strong>publiquement, calmement, factuellement</strong> dans les 48h, un mauvais avis bien géré peut renforcer la confiance</> },
      { type: 'ok',   text: <>Demande un avis <strong>au moment du départ</strong> avec un message court (modèle dans Outils &amp; calculs → Modèles de messages), y compris aux voyageurs en direct</> },
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
    iconColor: '#C2344A', iconBg: 'rgba(224,71,91,0.10)',
    icon: <Warning size={22} weight="fill" />,
    title: 'Litiges, dégâts & dépôt de garantie',
    subtitle: 'Anticiper et documenter, toujours',
    rules: [
      { type: 'ok',   text: <><strong>Vérifier les voyageurs</strong> avant d&apos;accepter : profil complet, avis antérieurs, motif du séjour</> },
      { type: 'warn', text: <>En cas de dégât : photos avant/après et devis. Sur Airbnb, la demande AirCover se fait <strong>dans les 14 jours après le départ</strong> ; sur Booking, via la procédure dommages. En direct : ton assureur et la caution</> },
      { type: 'info', text: <>Caution en direct : <strong>empreinte bancaire</strong> depuis ton contrat dans l&apos;app (formule Standard), Swikly ou virement. Montant courant : 200 à 800 € selon le logement</> },
      { type: 'warn', text: <>Garder traces écrites : messages plateforme, emails, photos horodatées, sans preuves, pas de dédommagement</> },
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
    iconColor: '#B7791F', iconBg: 'rgba(255,213,107,0.20)',
    icon: <Scales size={22} weight="fill" />,
    title: 'Statut juridique : EI ou SASU ?',
    subtitle: 'Choisir la bonne structure selon ton projet',
    rules: [
      { type: 'info', text: <><strong>En nom propre (LMNP)</strong> : le cas le plus courant pour 1 ou 2 logements. Pas de société, pas de cotisations sociales tant que tu restes non professionnel : 18,6 % de prélèvements sociaux sur le bénéfice</> },
      { type: 'warn', text: <><strong>LMP</strong> si tes recettes dépassent 23 000 €/an <strong>et</strong> tes autres revenus d&apos;activité du foyer : cotisations sociales (SSI) sur le bénéfice, autre fiscalité des plus-values</> },
      { type: 'info', text: <><strong>Société à l&apos;IS (SAS, SARL)</strong> : patrimoine protégé, amortissements, mais comptabilité obligatoire, pas de micro-BIC et imposition à la revente. À étudier avec un expert-comptable</> },
    ],
    articles: [
      { label: 'Guide fiscal débutant 2026', slug: 'guide-fiscal-debutant-hote-airbnb-2026' },
      { label: 'Réglementation LCD France 2026', slug: 'reglementation-lcd-france-2026' },
    ],
  },
  {
    id: 'gites-fiscalite',
    profile: 'gites',
    iconColor: 'var(--accent-text)', iconBg: 'var(--accent-bg)',
    icon: <CurrencyEur size={22} weight="fill" />,
    title: 'Classement & impact fiscal (loi Le Meur 2025)',
    subtitle: "L'abattement varie selon le classement",
    rules: [
      { type: 'ok',   text: <><strong>Classé Atout France (1–5★)</strong> : micro-BIC abattement <strong>50 %</strong>, plafond 83 600 €/an (revenus 2026)</> },
      { type: 'warn', text: <><strong>Non classé depuis 2025</strong> : abattement tombé à <strong>30 %</strong>, plafond 15 000 €/an, fort impact si tu n&apos;es pas classé</> },
      { type: 'info', text: <>Régime <strong>réel simplifié</strong> : déduction charges réelles (amortissement, travaux, intérêts), souvent plus avantageux au-delà de 30 k€</> },
    ],
    articles: [
      { label: 'Micro-BIC abattement 2026', slug: 'micro-bic-abattement-2026-airbnb' },
      { label: 'Réglementation LCD 2026', slug: 'reglementation-lcd-france-2026' },
    ],
  },
  {
    id: 'gites-obligations',
    profile: 'gites',
    iconColor: 'var(--accent-text)', iconBg: 'var(--accent-bg)',
    icon: <ClipboardText size={22} weight="fill" />,
    title: 'Obligations légales du gîte',
    subtitle: "Ce que la loi impose avant d'accueillir",
    rules: [
      { type: 'warn', text: <><strong>Déclaration obligatoire avant de louer</strong>, avec un numéro d&apos;enregistrement à afficher sur toutes tes annonces : généralisée à toute la France par la loi Le Meur (20 mai 2026), résidence principale comprise</> },
      { type: 'info', text: <>Le téléservice national est annoncé pour le <strong>4e trimestre 2026</strong> : d&apos;ici là, déclare en mairie (en ligne ou Cerfa 14004). Amende jusqu&apos;à <strong>10 000 €</strong> sans déclaration</> },
      { type: 'info', text: <><strong>Résidence principale</strong> : 120 nuits/an max, <strong>90</strong> si ta commune l&apos;a décidé (Paris, Lyon, Bordeaux, Nice…). <strong>Résidence secondaire</strong> : pas de plafond, mais changement d&apos;usage possible en zone tendue</> },
      { type: 'ok',   text: <>Taxe de séjour à collecter et reverser à la mairie si la plateforme ne le fait pas</> },
    ],
    articles: [
      { label: 'Numéro d\'enregistrement : démarches', slug: 'numero-enregistrement-lcd-obtenir-etapes-pratiques' },
      { label: 'Enregistrement national : ce qui change', slug: 'numero-enregistrement-lcd-20-mai-2026-demarches' },
      { label: 'Taxe de séjour : comment collecter', slug: 'taxe-sejour-lcd-comment-collecter' },
    ],
    sources: [
      { label: 'Loi Le Meur : ce qui change (Actu-Juridique)', url: 'https://www.actu-juridique.fr/fiscalite/fiscal-finances/locations-touristiques-ce-que-change-la-loi-le-meur/' },
    ],
  },
  {
    id: 'gites-dpe',
    profile: 'gites',
    iconColor: 'var(--accent-text)', iconBg: 'var(--accent-bg)',
    icon: <Leaf size={22} weight="fill" />,
    title: 'DPE des meublés de tourisme (loi Le Meur)',
    subtitle: 'Un calendrier propre à la location de vacances',
    rules: [
      { type: 'warn', text: <>Nouveau meublé soumis à <strong>changement d&apos;usage</strong> (zones tendues) : DPE au moins <strong>F</strong> depuis 2025, au moins <strong>E</strong> à partir de 2028</> },
      { type: 'warn', text: <><strong>2034</strong> : <strong>tous</strong> les meublés de tourisme, anciens comme nouveaux, devront être classés entre <strong>A et D</strong></> },
      { type: 'info', text: <>Le maire peut te demander ton DPE : amende jusqu&apos;à <strong>5 000 €</strong> si le logement ne respecte pas le niveau exigé. Les règles de la location longue durée (G interdit depuis 2025) ne s&apos;appliquent pas telles quelles au meublé de tourisme</> },
      { type: 'ok',   text: <>Travaux éligibles à <strong>MaPrimeRénov&apos;</strong> et aux CEE, isolation, fenêtres, pompe à chaleur, bien avant les deadlines</> },
    ],
    articles: [
      { label: 'Travaux énergétiques & MaPrimeRénov', slug: 'travaux-energetiques-lcd-aides-maprimerenov-2026' },
    ],
    sources: [
      { label: 'DPE et meublés de tourisme (France DPE)', url: 'https://france-dpe.fr/articles/dpe-location-saisonniere-meubles-touristiques' },
    ],
  },
  {
    id: 'gites-permis',
    profile: 'gites',
    iconColor: '#B7791F', iconBg: 'rgba(255,213,107,0.20)',
    icon: <IdentificationBadge size={22} weight="fill" />,
    title: 'Permis de louer & changement d\'usage',
    subtitle: 'Les pièges des grandes villes et zones tendues',
    rules: [
      { type: 'warn', text: <><strong>Paris, Lyon, Bordeaux, Annecy, Nice</strong>… : autorisation de changement d&apos;usage pour louer une résidence secondaire, sinon amende civile jusqu&apos;à <strong>100 000 €</strong> par logement depuis la loi Le Meur</> },
      { type: 'warn', text: <><strong>Compensation</strong> à Paris et dans d&apos;autres villes : transformer en logement une surface équivalente (ou double) de locaux commerciaux pour obtenir l&apos;autorisation</> },
      { type: 'info', text: <>Résidence principale : <strong>120 nuits/an</strong>, abaissé à <strong>90</strong> dans les communes qui l&apos;ont voté. Dépassement : amende jusqu&apos;à <strong>15 000 €</strong>. Les plateformes suivent le compteur grâce au numéro d&apos;enregistrement</> },
      { type: 'ok',   text: <>Vérifier auprès de la mairie avant l&apos;achat ou la mise en location, règles très variables d&apos;une commune à l&apos;autre</> },
    ],
    articles: [
      { label: 'Réglementation LCD France 2026', slug: 'reglementation-lcd-france-2026' },
    ],
    sources: [
      { label: 'Amendes changement d\'usage (Cafpi)', url: 'https://www.cafpi.fr/credit-immobilier/reglementation-credit-immobilier/loi-le-meur-impact-sur-la-location-touristique' },
    ],
  },
  {
    id: 'gites-copropriete',
    profile: 'gites',
    iconColor: 'var(--accent-text)', iconBg: 'var(--accent-bg)',
    icon: <UsersThree size={22} weight="fill" />,
    title: 'Copropriété, voisinage & règlement',
    subtitle: 'Anticiper les conflits avant qu\'ils explosent',
    rules: [
      { type: 'warn', text: <>Le <strong>règlement de copropriété</strong> peut interdire la LCD (clause d&apos;habitation bourgeoise stricte), vérifier avant l&apos;achat</> },
      { type: 'info', text: <>Depuis la loi Le Meur, l&apos;AG peut interdire les meublés de tourisme dans les résidences secondaires <strong>à la majorité des deux tiers</strong>, si le règlement interdit déjà toute activité commerciale dans les lots (validé par le Conseil constitutionnel, mars 2026)</> },
      { type: 'ok',   text: <>Règlement intérieur clair (bruit, parties communes, horaires d&apos;arrivée) + concertation avec les voisins = la meilleure prévention</> },
    ],
    articles: [
      { label: 'Droits voisins & litiges copropriété', slug: 'droits-voisins-lcd-copropriete-litiges' },
      { label: 'Bruit & règlement intérieur efficace', slug: 'bruit-reglement-interieur-lcd-efficace' },
    ],
    sources: [
      { label: 'QPC 2025-1186 du 19 mars 2026 (21 Avocats)', url: 'https://www.21avocats.com/actualites/loi-le-meur-meubles-tourisme-copropriete-qpc-conseil-constitutionnel-2026/' },
    ],
  },
  {
    id: 'gites-rentabilite',
    profile: 'gites',
    iconColor: '#6E5446', iconBg: 'rgba(139,109,94,0.14)',
    icon: <Calculator size={22} weight="fill" />,
    title: 'Calculer la rentabilité d\'un bien',
    subtitle: 'Avant d\'acheter, mesurer le cash-flow réel',
    rules: [
      { type: 'info', text: <><strong>Revenu théorique</strong> = nuitée moyenne × taux d&apos;occupation × 365, varier selon saisonnalité de la zone</> },
      { type: 'warn', text: <>Coûts à intégrer : commissions des plateformes (15,5 % chez Airbnb, 15 à 18 % chez Booking), ménage, linge, énergie, abonnements, taxe foncière, assurance, mensualité crédit, provision travaux</> },
      { type: 'ok',   text: <><strong>Point mort</strong> = nb de nuitées/an pour couvrir les charges fixes, au-delà, tout est marge</> },
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
    iconColor: '#B83A7C', iconBg: 'rgba(244,114,182,0.14)',
    icon: <Gavel size={22} weight="fill" />,
    title: 'Les règles légales des chambres d\'hôtes',
    subtitle: 'Les obligations que beaucoup ignorent',
    rules: [
      { type: 'warn', text: <><strong>Maximum 5 chambres</strong> et <strong>15 personnes simultanément</strong>, au-delà, c&apos;est un autre régime juridique</> },
      { type: 'warn', text: <><strong>Nuitée et petit-déjeuner vendus ensemble</strong>, linge de maison fourni : c&apos;est ce qui définit la chambre d&apos;hôtes (Code du tourisme, art. D324-13)</> },
      { type: 'warn', text: <><strong>Accueil par l&apos;habitant</strong> : tu vis sur place, contrairement au gîte</> },
      { type: 'warn', text: <><strong>Déclaration en mairie</strong> avant d&apos;ouvrir (Cerfa 13566), amende jusqu&apos;à 450 € sinon. Les voyageurs étrangers remplissent aussi la fiche de police</> },
    ],
    articles: [
      { label: 'TVA et petit-déjeuner', slug: 'tva-petit-dejeuner-lcd-seuil-37500-2026-detail' },
      { label: 'Réglementation LCD 2026', slug: 'reglementation-lcd-france-2026' },
    ],
    sources: [
      { label: 'Déclaration de chambre d\'hôtes, Cerfa 13566 (service-public.fr)', url: 'https://www.formulaires.service-public.gouv.fr/gf/cerfa_13566.do' },
    ],
  },
  {
    id: 'chambres-fiscalite',
    profile: 'chambres',
    iconColor: '#6E5446', iconBg: 'rgba(139,109,94,0.14)',
    icon: <CurrencyEur size={22} weight="fill" />,
    title: "Fiscalité spécifique chambres d'hôtes",
    subtitle: 'Différente du meublé de tourisme classique',
    rules: [
      { type: 'ok',   text: <>Recettes de <strong>760 €/an</strong> ou moins, dans ta résidence principale : exonération d&apos;impôt sur le revenu (art. 35 bis du CGI), pour les locations faites <strong>jusqu&apos;au 31 décembre 2026</strong></> },
      { type: 'info', text: <>Micro-BIC : <strong>50 % d&apos;abattement</strong>, plafond 83 600 € pour les revenus 2026 (77 700 € pour 2025), comme les meublés classés (Conseil d&apos;État, 16/09/2025). L&apos;ancien taux de 71 % ne s&apos;applique plus</> },
      { type: 'warn', text: <>Le <strong>classement Atout France</strong> vise les meublés de tourisme : il ne concerne pas les chambres d&apos;hôtes</> },
      { type: 'ok',   text: <>Labels possibles : <strong>Gîtes de France</strong> (épis) et <strong>Clévacances</strong> (clés), utiles pour la visibilité (sans effet sur l&apos;abattement)</> },
    ],
    articles: [
      { label: 'Guide fiscal débutant 2026', slug: 'guide-fiscal-debutant-hote-airbnb-2026' },
      { label: 'TVA et petit-déjeuner', slug: 'tva-petit-dejeuner-lcd-seuil-37500-2026-detail' },
    ],
    sources: [
      { label: 'Chambres d\'hôtes et micro-BIC (AUREP)', url: 'https://www.aurep.com/publications-et-agenda/chambres-dhotes-et-regime-micro-bic-la-ligne-est-fixee/' },
      { label: 'Exonération 760 € (LégiFiscal)', url: 'https://www.legifiscal.fr/actualites-fiscales/4607-seuils-2026-exoneration-ir-location-residence-principale.html' },
    ],
  },
  {
    id: 'chambres-plateformes',
    profile: 'chambres',
    iconColor: 'var(--accent-text)', iconBg: 'var(--accent-bg)',
    icon: <Globe size={22} weight="fill" />,
    title: 'Canaux de réservation adaptés',
    subtitle: "Airbnb n'est pas ton seul levier",
    rules: [
      { type: 'ok',   text: <>Airbnb, Booking.com, Abritel/Vrbo : compatibles avec les chambres d&apos;hôtes</> },
      { type: 'ok',   text: <><strong>Réseau Gîtes de France</strong> : spécialisé chambres d&apos;hôtes, clientèle qualifiée, recommandé</> },
      { type: 'ok',   text: <><strong>Driing</strong> et site propre : réservation directe sans commission, fort potentiel pour fidéliser les voyageurs récurrents</> },
      { type: 'info', text: <><strong>Fiche Google</strong> (Google Business Profile) : levier de visibilité locale essentiel pour les chambres d&apos;hôtes en zone rurale ou touristique</> },
    ],
    articles: [
      { label: 'Airbnb vs Booking : comparatif', slug: 'airbnb-vs-booking-com-location-courte-duree' },
      { label: 'GMB pour réservations directes', slug: 'google-my-business-reservations-directes-hotes-lcd' },
    ],
  },
  {
    id: 'chambres-haccp',
    profile: 'chambres',
    iconColor: '#B7791F', iconBg: 'rgba(255,213,107,0.20)',
    icon: <ForkKnife size={22} weight="fill" />,
    title: 'HACCP & hygiène alimentaire (petit-déj)',
    subtitle: 'Servir un petit-déjeuner = obligations sanitaires',
    rules: [
      { type: 'warn', text: <><strong>Déclaration à la DDPP</strong> (Cerfa 13984) avant de servir des denrées d&apos;origine animale (lait, beurre, œufs, charcuterie…)</> },
      { type: 'info', text: <>Application des principes <strong>HACCP</strong> : traçabilité des produits, chaîne du froid, dates de péremption, plan de nettoyage</> },
      { type: 'ok',   text: <>Formation hygiène alimentaire <strong>non obligatoire</strong> pour un service de petit-déjeuner seul, mais conseillée</> },
      { type: 'warn', text: <>TVA : les chambres d&apos;hôtes sont de l&apos;<strong>hébergement</strong>, franchise jusqu&apos;à <strong>85 000 €</strong> de recettes (93 500 € majoré). Au-delà, <strong>TVA 10 %</strong> sur la nuitée et le petit-déjeuner</> },
    ],
    articles: [
      { label: 'TVA et petit-déjeuner', slug: 'tva-petit-dejeuner-lcd-seuil-37500-2026-detail' },
    ],
    sources: [
      { label: 'Cerfa 13984 (ministère de l\'Agriculture)', url: 'https://agriculture-portail.6tzen.fr/default/requests/cerfa13984/' },
      { label: 'Seuils de franchise TVA 2026 (Comptabook)', url: 'https://comptabook.fr/tva/seuil-franchise-tva-2026/' },
    ],
  },
  {
    id: 'chambres-erp-pmr',
    profile: 'chambres',
    iconColor: 'var(--accent-text)', iconBg: 'var(--accent-bg)',
    icon: <Wheelchair size={22} weight="fill" />,
    title: 'ERP & accessibilité PMR',
    subtitle: 'Quand le logement devient un établissement',
    rules: [
      { type: 'warn', text: <>Au-delà de <strong>15 personnes</strong> accueillies (gîte ou gîte de groupe), l&apos;hébergement devient un <strong>ERP de 5e catégorie</strong> avec locaux à sommeil : règles de sécurité incendie strictes</> },
      { type: 'info', text: <>ERP = visite de la commission sécurité, registre de sécurité, alarme, BAES, plan d&apos;évacuation</> },
      { type: 'warn', text: <><strong>Accessibilité PMR</strong> obligatoire pour tout ERP : au moins 1 chambre adaptée + cheminement, sanitaires accessibles</> },
      { type: 'ok',   text: <>Jusqu&apos;à 15 personnes (et donc toute chambre d&apos;hôtes, limitée à 5 chambres et 15 personnes), c&apos;est la réglementation de l&apos;habitation qui s&apos;applique : pas d&apos;ERP, mais détecteurs de fumée obligatoires</> },
    ],
    articles: [
      { label: 'ERP & classement meublé tourisme', slug: 'erp-classement-meuble-tourisme-lcd' },
    ],
    sources: [
      { label: 'Gîtes et chambres d\'hôtes : seuil de 15 personnes (Parlons Sécurité Incendie)', url: 'https://www.parlons-securite-incendie.fr/2015/06/02/les-gites-et-chambres-d-hotes-dont-l-effectif-est-inferieur-ou-egal-a-15-personnes-relevent-de-la-reglementation-habitation-qu-en-est-il-de-ces-memes-etablissements-dont-l-effectif-est-compris-entre-1/' },
    ],
  },

  // ── CONCIERGERIES ──
  {
    id: 'conciergerie-hoguet',
    profile: 'conciergerie',
    iconColor: '#6E5446', iconBg: 'rgba(139,109,94,0.14)',
    icon: <Scales size={22} weight="fill" />,
    title: "Loi Hoguet : quand s'applique-t-elle ?",
    subtitle: 'La question que toute conciergerie doit se poser',
    rules: [
      { type: 'warn', text: <><strong>Tu encaisses les loyers</strong> pour le propriétaire et les lui reverses : carte professionnelle <strong>G</strong> (gestion) + garantie financière</> },
      { type: 'warn', text: <><strong>Tu publies les annonces à ton nom</strong> et conclus les locations pour son compte : c&apos;est de l&apos;entremise, carte <strong>T</strong> requise</> },
      { type: 'ok',   text: <>Annonce au nom du propriétaire, paiements versés directement sur son compte, toi facturant ménage, accueil et gestion du calendrier : <strong>prestation de services</strong>, sans carte</> },
      { type: 'info', text: <>Sans carte alors qu&apos;elle est requise, le contrat peut être annulé et tes honoraires perdus (tribunal de Tours, janvier 2025)</> },
    ],
    articles: [
      { label: 'Créer une conciergerie LCD en 2025', slug: 'creer-conciergerie-airbnb-2025' },
      { label: 'Contrat de mandat conciergerie', slug: 'contrat-mandat-conciergerie-lcd-modele-clauses' },
    ],
    sources: [
      { label: 'Carte G et conciergerie (HostLegal)', url: 'https://www.hostlegal.fr/blog/carte-g-conciergerie-ou-cohost-airbnb' },
    ],
  },
  {
    id: 'conciergerie-statut',
    profile: 'conciergerie',
    iconColor: '#6E5446', iconBg: 'rgba(139,109,94,0.14)',
    icon: <Briefcase size={22} weight="fill" />,
    title: 'Statuts recommandés & TVA',
    subtitle: 'Choisir la bonne structure pour scaler',
    rules: [
      { type: 'ok',   text: <><strong>Micro-entreprise</strong> : pour démarrer, plafond 83 600 €/an (prestations de services, 2026), franchise TVA jusqu&apos;à 37 500 €</> },
      { type: 'ok',   text: <><strong>SASU/SAS</strong> : pour aller au-delà, protéger son patrimoine, avoir des associés ou employés</> },
      { type: 'warn', text: <><strong>TVA 20 %</strong> au-delà de 37 500 € de CA (dès que tu dépasses 41 250 € en cours d&apos;année), à intégrer dans ta tarification dès le départ</> },
      { type: 'info', text: <><strong>RC Pro</strong> : obligatoire avec une carte professionnelle, fortement conseillée dans tous les cas (dommages causés pendant tes prestations)</> },
    ],
    articles: [
      { label: 'Créer une conciergerie LCD 2025', slug: 'creer-conciergerie-airbnb-2025' },
      { label: 'Tarif conciergerie : grille marché', slug: 'tarif-conciergerie-lcd-grille-marche-2026' },
    ],
  },
  {
    id: 'conciergerie-contrats',
    profile: 'conciergerie',
    iconColor: 'var(--accent-text)', iconBg: 'var(--accent-bg)',
    icon: <FileText size={22} weight="fill" />,
    title: 'Contrats & tarification',
    subtitle: 'Les bases contractuelles indispensables',
    rules: [
      { type: 'warn', text: <><strong>Contrat de mandat de gestion</strong> obligatoire avec chaque propriétaire, définit honoraires, périmètre, durée et conditions de résiliation</> },
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
    iconColor: '#B83A7C', iconBg: 'rgba(244,114,182,0.14)',
    icon: <UserGear size={22} weight="fill" />,
    title: 'URSSAF, équipe ménage & sous-traitance',
    subtitle: 'Recruter et déclarer correctement',
    rules: [
      { type: 'warn', text: <><strong>Salariat</strong> : contrat CDD/CDI, charges patronales (~42 %), gestion des congés et arrêts, sécurité juridique mais coût élevé</> },
      { type: 'info', text: <><strong>Sous-traitance</strong> (auto-entrepreneur, micro) : facturation à la prestation, pas de lien de subordination, attention au risque de requalification</> },
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
    iconColor: 'var(--accent-text)', iconBg: 'var(--accent-bg)',
    icon: <Target size={22} weight="fill" />,
    title: 'Trouver son premier mandat',
    subtitle: 'Décrocher la confiance avant la facture',
    rules: [
      { type: 'info', text: <>Cibler d&apos;abord les <strong>propriétaires en sous-performance</strong> sur Airbnb (annonces non optimisées, peu d&apos;avis, photos médiocres)</> },
      { type: 'ok',   text: <>Outils d&apos;analyse marché : <strong>AirDNA</strong> (données revenus / occupation), <strong>Inside Airbnb</strong> (open data), identifier les biens sous-performants dans ta zone</> },
      { type: 'ok',   text: <>Approche : <strong>audit gratuit</strong> du bien (photos, annonce, prix) + démonstration chiffrée du gain potentiel</> },
      { type: 'info', text: <>Réseaux pro : agences immo locales, gestionnaires de patrimoine, notaires, souvent prescripteurs de propriétaires investisseurs</> },
    ],
    articles: [
      { label: 'Prospection : trouver le 1er mandat', slug: 'prospection-conciergerie-trouver-premier-mandat' },
    ],
  },
  {
    id: 'conciergerie-scaler',
    profile: 'conciergerie',
    iconColor: '#B7791F', iconBg: 'rgba(255,213,107,0.20)',
    icon: <ChartLineUp size={22} weight="fill" />,
    title: 'Scaler de 5 à 30 mandats',
    subtitle: 'Industrialiser sans casser la qualité',
    rules: [
      { type: 'warn', text: <>Goulot n°1 : la <strong>communication client</strong>, automatiser dès 10 mandats avec gabarits + scénarios (Make/Zapier)</> },
      { type: 'ok',   text: <><strong>Channel manager</strong> indispensable : Smoobu, Lodgify, Hospitable, Beds24, mutualise calendriers, prix, messages multi-plateformes</> },
      { type: 'info', text: <><strong>Reporting mensuel automatisé</strong> par propriétaire : nuitées, CA, occupation, photos, c&apos;est ton meilleur argument de fidélisation</> },
      { type: 'ok',   text: <>Onboarding standardisé : checklist d&apos;audit du bien, photos pro, mise en ligne, livret d&apos;accueil, 7 à 10 jours pour un nouveau bien</> },
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
    iconColor: 'var(--accent-text)', iconBg: 'var(--accent-bg)',
    icon: <FileText size={22} weight="fill" />,
    title: 'Contrat obligatoire sans plateforme',
    subtitle: 'Ce que tu dois avoir avant le premier séjour',
    rules: [
      { type: 'warn', text: <><strong>Contrat écrit obligatoire</strong> (Code du tourisme, art. L324-2) : prix, dates, état descriptif du logement. Ajoute identités, caution et conditions d&apos;annulation. Ton contrat se fait en ligne dans Contrats &amp; paiements</> },
      { type: 'info', text: <>État des lieux <strong>recommandé</strong> (non obligatoire pour LCD &lt; 30 jours, mais utile en cas de litige)</> },
      { type: 'ok',   text: <><strong>Taxe de séjour à collecter toi-même</strong> et reverser à la mairie, montant selon commune et catégorie du logement</> },
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
    iconColor: '#B83A7C', iconBg: 'rgba(244,114,182,0.14)',
    icon: <ShieldCheck size={22} weight="fill" />,
    title: "Assurance : pas d'AirCover hors Airbnb",
    subtitle: 'La protection que tu dois assurer toi-même',
    rules: [
      { type: 'warn', text: <><strong>Assurance habitation classique insuffisante</strong> pour la LCD, vérifie et informe obligatoirement ton assureur</> },
      { type: 'ok',   text: <>Demande une <strong>extension location saisonnière</strong> ou un contrat dédié (propriétaire non occupant pour une résidence secondaire) couvrant dommages, vol et responsabilité civile</> },
      { type: 'ok',   text: <>Caution : <strong>empreinte bancaire</strong> depuis ton contrat dans l&apos;app, Swikly ou virement. Précise dans le contrat le délai de restitution (usage : 7 jours)</> },
      { type: 'info', text: <>Assurance annulation voyageur : tu peux proposer Chapka, AXA Assistance, ça rassure et évite les litiges d&apos;annulation</> },
    ],
    articles: [
      { label: 'Assurance LCD : 5 garanties indispensables', slug: 'assurance-lcd-5-garanties-indispensables-2026' },
      { label: 'Assurance location courte durée : couverture', slug: 'assurance-location-courte-duree-airbnb-couverture' },
    ],
  },
  {
    id: 'direct-visibilite',
    profile: 'direct',
    iconColor: '#B7791F', iconBg: 'rgba(255,213,107,0.20)',
    icon: <Megaphone size={22} weight="fill" />,
    title: 'Se rendre visible sans Airbnb',
    subtitle: 'Les canaux pour remplir ton calendrier en direct',
    rules: [
      { type: 'ok',   text: <><strong>Fiche Google</strong> (Google Business Profile) : gratuite, apparaît dans les recherches locales, indispensable pour gîtes et chambres d&apos;hôtes. Fais son audit dans Trouver des voyageurs</> },
      { type: 'ok',   text: <><strong>Driing</strong> : annonce directe sans commission, comparateur de prix intégré, voyageurs qualifiés</> },
      { type: 'ok',   text: <>Paiements : <strong>Stripe</strong> (intégré à tes contrats dans l&apos;app), SumUp, Driing ou virement, à prévoir avant le premier séjour en direct</> },
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
    iconColor: 'var(--accent-text)', iconBg: 'var(--accent-bg)',
    icon: <MapPin size={22} weight="fill" />,
    title: 'SEO local & Google Business Profile',
    subtitle: 'Apparaître quand on cherche "gîte + ta ville"',
    rules: [
      { type: 'ok',   text: <><strong>Fiche Google</strong> bien remplie : photos, description, catégorie, avis récents, publications régulières : c&apos;est le premier canal local</> },
      { type: 'info', text: <><strong>Avis Google</strong> : objectif 4,7+/5 avec 30+ avis pour ranker dans les résultats locaux, solliciter chaque voyageur après le séjour</> },
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
    iconColor: 'var(--accent-text)', iconBg: 'var(--accent-bg)',
    icon: <Globe size={22} weight="fill" />,
    title: 'Site web & page de réservation propre',
    subtitle: 'Ton QG digital sans commission, sans dépendance',
    rules: [
      { type: 'ok',   text: <><strong>Driing</strong> : page de réservation directe prête en 30 min, 0 % commission, paiements intégrés, idéal pour démarrer</> },
      { type: 'ok',   text: <>Site complet : <strong>Lodgify, Hostfully, Beds24</strong>, widget de réservation, calendrier et paiement en un seul outil (abonnement mensuel, grilles qui changent souvent)</> },
      { type: 'info', text: <>Site WordPress + plugin (WP Booking System, Beds24 iframe) : flexibilité maximale mais setup plus long, pertinent pour les profils tech</> },
      { type: 'warn', text: <>Contenu indispensable sur ta page : <strong>photos haute résolution, tarifs clairs, calendrier dispo, conditions d&apos;annulation et formulaire de contact</strong></> },
      { type: 'ok',   text: <>Mets ton lien de réservation directe dans ton <strong>livret d&apos;accueil</strong> et sur un QR code dans le logement, <strong>jamais</strong> dans ton annonce ou ta messagerie Airbnb (interdit par leurs règles)</> },
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
    iconColor: 'var(--accent-text)', iconBg: 'var(--accent-bg)',
    icon: <CurrencyEur size={22} weight="fill" />,
    title: 'Paiement sécurisé sans plateforme',
    subtitle: 'Encaisser sans Airbnb, sans risque',
    rules: [
      { type: 'ok',   text: <><strong>Stripe</strong> : solution professionnelle, lien de paiement ou formulaire intégrable, frais ~1,5 % + 0,25 € en Europe</> },
      { type: 'ok',   text: <><strong>Driing</strong> : paiement inclus dans la plateforme, virement sous 48h, la solution la plus simple pour les hôtes qui débutent en direct</> },
      { type: 'info', text: <><strong>SumUp</strong> : idéal si accueil physique (terminal carte), aussi avec lien de paiement en ligne</> },
      { type: 'warn', text: <>Virement bancaire : gratuit mais sans garantie. Exige l&apos;<strong>acompte à la réservation</strong> (30 à 50 %) et le solde avant l&apos;arrivée. Ton contrat dans l&apos;app gère l&apos;acompte de 50 ou 100 %</> },
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
    iconColor: '#B7791F', iconBg: 'rgba(255,213,107,0.20)',
    icon: <ChatCircleText size={22} weight="fill" />,
    title: 'Convertir tes voyageurs plateforme → direct',
    subtitle: 'La stratégie pour s\'affranchir des commissions',
    rules: [
      { type: 'ok',   text: <><strong>Livret d&apos;accueil</strong> : ton lien de réservation directe et l&apos;offre « prochaine réservation en direct, 5 % offerts »</> },
      { type: 'info', text: <>Carte dans le logement : QR code vers ta page de réservation à côté du Wi-Fi, vu par tous les voyageurs</> },
      { type: 'warn', text: <>Règles Airbnb (renforcées en 2025) : <strong>interdit</strong> de proposer une réservation hors plateforme, de partager ses coordonnées ou de demander un paiement extérieur <strong>dans la messagerie</strong>. Compte suspendu en cas d&apos;abus</> },
      { type: 'ok',   text: <>Laisse le voyageur venir à toi : livret, QR code et fiche Google suffisent. N&apos;utilise pas les données Airbnb pour le démarcher</> },
      { type: 'info', text: <>Construire son fichier email voyageurs au fil des séjours : c&apos;est l&apos;actif le plus précieux de ton activité en direct</> },
    ],
    articles: [
      { label: 'Convertir voyageurs Airbnb en direct', slug: 'convertir-voyageurs-airbnb-reservation-directe' },
      { label: 'Email marketing & newsletter hôte', slug: 'email-marketing-newsletter-hote-lcd' },
    ],
    keywords: 'conversion direct fidélisation livret accueil qr code',
    sources: [
      { label: 'Politique hors plateforme d\'Airbnb (Smoobu)', url: 'https://www.smoobu.com/en/blog/airbnbs-off-platform-policy-explained/' },
    ],
  },
  {
    id: 'direct-fidelisation',
    profile: 'direct',
    iconColor: '#6E5446', iconBg: 'rgba(139,109,94,0.14)',
    icon: <EnvelopeSimple size={22} weight="fill" />,
    title: 'Fidéliser : email, parrainage, séjours longs',
    subtitle: 'La résa directe se construit sur le temps long',
    rules: [
      { type: 'ok',   text: <><strong>Newsletter saisonnière</strong> : 4 à 6 envois par an aux anciens voyageurs qui l&apos;ont acceptée, avec tes dates libres et une offre de retour</> },
      { type: 'info', text: <>Programme de <strong>parrainage</strong> : 5–10 % de réduction au parrain et au filleul, ROI très élevé sur fichier qualifié</> },
      { type: 'ok',   text: <><strong>Diversifier les revenus</strong> : workation longue durée hors saison, séjours pros, événements privés, taux d&apos;occupation année lissé</> },
      { type: 'info', text: <>Garde l&apos;e-mail des voyageurs en direct <strong>avec leur accord</strong> pour les recontacter : c&apos;est ton actif le plus précieux pour la réservation directe</> },
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
  // Point d'attention en ambre (avant : rouge, lu comme une alerte partout)
  warn: { color: '#B7791F', bg: 'rgba(255,213,107,0.16)' },
  ok:   { color: 'var(--accent-text)', bg: 'var(--accent-bg)' },
  info: { color: 'var(--text-2)', bg: 'var(--surface-2)' },
}

function RuleIcon({ type }: { type: RuleType }) {
  if (type === 'warn') return <Warning size={14} weight="fill" />
  if (type === 'ok')   return <CheckCircle size={14} weight="fill" />
  return <Info size={14} weight="fill" />
}

function GuideCardItem({ card }: { card: GuideCard }) {
  const profileDef = PROFILE_DEFS[card.profile]
  const searchText = [card.title, card.subtitle, card.keywords ?? ''].join(' ').toLowerCase()
  return (
    <div
      style={s.card}
      className="glass-card"
      data-guide-card=""
      data-profile={card.profile}
      data-search={searchText}
    >
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

      {APP_LINKS[card.id] && (
        <div style={s.appLinks}>
          {APP_LINKS[card.id].map(l => (
            <Link key={l.href + l.label} href={l.href} style={l.kind === 'outil' ? s.appLinkTool : s.appLinkFormation}>
              {l.kind === 'outil' ? <Wrench size={12} weight="fill" /> : <GraduationCap size={12} weight="fill" />}
              {l.label}
              <ArrowRight size={11} weight="bold" />
            </Link>
          ))}
        </div>
      )}

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

      {card.sources && card.sources.length > 0 && (
        <p style={s.sources}>
          Sources :{' '}
          {card.sources.map((src, i) => (
            <span key={src.url}>
              {i > 0 && ' · '}
              <a href={src.url} target="_blank" rel="noopener noreferrer nofollow" style={s.sourceLink}>{src.label}</a>
            </span>
          ))}
        </p>
      )}
    </div>
  )
}

// Passer de la règle à l'action (sept. 2026) : chaque fiche renvoie vers
// l'outil de l'app et la formation qui la mettent en pratique. Uniquement des
// URL internes existantes ; slugs de formations = ACTIVE_SLUGS de formations/page.tsx.
type AppLink = { label: string; href: string; kind: 'outil' | 'formation' }
const F = (slug: string, label: string): AppLink => ({ label, href: `/dashboard/formations/${slug}`, kind: 'formation' })
const O = (href: string, label: string): AppLink => ({ label, href, kind: 'outil' })
const APP_LINKS: Record<string, AppLink[]> = {
  'commun-taxe-sejour':      [O('/dashboard/simulateurs', 'Simulateur taxe de séjour')],
  'commun-fiche-police':     [O('/dashboard/voyageurs/declarations', 'Mes déclarations voyageurs')],
  'commun-pricing':          [O('/dashboard/calculateurs', 'Prix & marché'), F('mettre-le-bon-prix-lcd', 'Mettre le bon prix'), F('tarification-dynamique', 'Tarification dynamique')],
  'commun-channel-managers': [O('/dashboard/entre-hotes/ecosysteme', 'Comparer les outils'), F('gerer-lcd-automatisation', 'Automatiser sa gestion')],
  'commun-avis':             [O('/dashboard/gabarits', 'Modèles de messages'), F('ecrire-avis-repondre-voyageurs', 'Avis voyageurs')],
  'commun-litiges':          [O('/dashboard/contrats', 'Contrat + caution'), O('/dashboard/securite', 'Sécurité voyageur'), F('gerer-incidents-litiges-lcd', 'Gérer incidents et litiges')],
  'gites-statut':            [O('/dashboard/simulateurs', 'Simulateur EI ou SASU'), F('fiscalite-reglementation-lcd-france-2026', 'Fiscalité LCD 2026')],
  'gites-fiscalite':         [O('/dashboard/simulateurs', 'Simulateur micro-BIC'), F('declarer-lmnp-seul-decla-fr', 'Déclarer son LMNP seul')],
  'gites-rentabilite':       [O('/dashboard/simulateurs', 'Simulateur de rentabilité')],
  'conciergerie-hoguet':     [F('fiscalite-statut-conciergerie-tourisme', 'Statut de la conciergerie')],
  'conciergerie-statut':     [F('fiscalite-statut-conciergerie-tourisme', 'Statut de la conciergerie')],
  'conciergerie-contrats':   [F('creer-conciergerie-lcd', 'Créer sa conciergerie')],
  'conciergerie-prospection':[F('creer-conciergerie-lcd', 'Créer sa conciergerie')],
  'direct-contrat':          [O('/dashboard/contrats', 'Contrats & paiements')],
  'direct-paiement':         [O('/dashboard/contrats', 'Loyer et caution en ligne')],
  'direct-visibilite':       [O('/dashboard/visibilite/facebook', 'Publier dans les groupes Facebook'), F('annonce-directe', 'Réservation directe'), F('reseaux-sociaux-lcd', 'Réseaux sociaux')],
  'direct-seo-local':        [O('/dashboard/visibilite/google', 'Auditer ma fiche Google'), F('google-my-business-lcd', 'Google Business Profile')],
  'direct-site-propre':      [O('/dashboard/entre-hotes/ecosysteme', 'Outils de site direct'), F('annonce-directe', 'Réservation directe')],
  'direct-fidelisation':     [O('/dashboard/voyageurs', 'Mes voyageurs')],
}

export const GUIDE_CARD_COUNT = GUIDE_CARDS.length

function buildSearchText(card: GuideCard): string {
  return [card.title, card.subtitle, card.keywords ?? '']
    .join(' ')
    .toLowerCase()
}

export default function GuideCards() {
  return (
    <div
      className="dash-grid-2 fade-up d2 guide-cards-grid"
      style={{ marginBottom: '32px' }}
      data-guide-cards
    >
      {GUIDE_CARDS.map(card => (
        <GuideCardItem key={card.id} card={card} />
      ))}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: {
    padding: 'var(--s-6)',
    borderRadius: 'var(--r-xl)',
    display: 'flex', flexDirection: 'column' as const, gap: '0',
    position: 'relative' as const,
    transition: 'border-color var(--d-base) var(--ease-smooth), box-shadow var(--d-base) var(--ease-smooth), transform var(--d-base) var(--ease-smooth)',
  },
  profileBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 'var(--s-1)',
    fontSize: 'var(--t-xs)', fontWeight: 700, letterSpacing: '0.6px',
    textTransform: 'uppercase' as const, padding: '4px 10px',
    borderRadius: 'var(--r-pill)', border: '1px solid',
    marginBottom: 'var(--s-4)', alignSelf: 'flex-start' as const,
  },
  cardHead: { display: 'flex', alignItems: 'flex-start', gap: 'var(--s-4)', marginBottom: 'var(--s-4)' },
  iconBox: {
    width: '48px', height: '48px', borderRadius: 'var(--r-lg)',
    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform var(--d-base) var(--ease-spring)',
  },
  cardTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'var(--t-lg)', fontWeight: 400,
    color: 'var(--text)', margin: '0 0 var(--s-1)',
    letterSpacing: 'var(--ls-snug)',
  },
  cardSub: { fontSize: 'var(--t-xs)', fontWeight: 400, color: 'var(--text-2)', margin: 0 },
  rules: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--s-2)' },
  rule: {
    display: 'flex', alignItems: 'flex-start', gap: 'var(--s-3)',
    padding: 'var(--s-3) var(--s-3)', borderRadius: 'var(--r-md)',
  },
  ruleText: {
    fontSize: 'var(--t-sm)', fontWeight: 400, color: 'var(--text-2)',
    lineHeight: 'var(--lh-base)',
  },
  appLinks: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 'var(--s-4)' },
  appLinkTool: {
    display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 10px', borderRadius: '8px',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)',
    fontSize: '12px', fontWeight: 600, textDecoration: 'none',
  },
  appLinkFormation: {
    display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 10px', borderRadius: '8px',
    background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)',
    fontSize: '12px', fontWeight: 600, textDecoration: 'none',
  },
  articlesBlock: { marginTop: 'var(--s-4)', paddingTop: 'var(--s-4)', borderTop: '1px solid var(--border)' },
  sources: { margin: 0, fontSize: '11.5px', lineHeight: 1.5, color: 'var(--text-3)' },
  sourceLink: { color: 'var(--text-2)', textDecoration: 'underline', textUnderlineOffset: '2px' },
  articlesLabel: {
    display: 'inline-flex', alignItems: 'center', gap: 'var(--s-1)',
    fontSize: 'var(--t-xs)', fontWeight: 700, letterSpacing: '0.6px',
    textTransform: 'uppercase' as const, color: 'var(--text-3)', marginBottom: 'var(--s-2)',
  },
  articlesList: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--s-1)' },
  articleLink: {
    display: 'inline-flex', alignItems: 'center', gap: 'var(--s-2)',
    fontSize: 'var(--t-xs)', fontWeight: 500, color: 'var(--text-2)', textDecoration: 'none',
    padding: '6px 10px', borderRadius: 'var(--r-sm)',
    transition: 'background var(--d-base) var(--ease-smooth), color var(--d-base) var(--ease-smooth)',
    alignSelf: 'flex-start' as const, maxWidth: '100%',
  },
}
