// Données de la marketplace /partenaires (offres + outils référencés),
// rendues en HTML statique par scripts/build-partenaires.mjs.
//
// Pour ajouter un partenaire : une entrée dans OUTILS avec `offre` (texte
// court en gras) et `badge` ('affilie' | 'parrainage' | 'membre' | 'fondateur'),
// puis `node scripts/build-partenaires.mjs`. Tout lien rémunéré porte
// `sponsored: true` (rel="sponsored noopener" + suivi des clics via nav.js).
// Pas de tiret cadratin dans les textes.

export const CATEGORIES = [
  { id: 'gestion', label: 'Gestion & channel manager', icon: 'squares-four' },
  { id: 'messagerie', label: 'Messagerie & automatisation', icon: 'chats-circle' },
  { id: 'direct', label: 'Réservation directe', icon: 'globe' },
  { id: 'banque', label: 'Banque & paiement', icon: 'credit-card' },
  { id: 'prix', label: 'Tarification dynamique', icon: 'chart-line-up' },
  { id: 'acces', label: 'Accès & sécurité', icon: 'lock-key' },
  { id: 'compta', label: 'Comptabilité & fiscalité', icon: 'calculator' },
  { id: 'menage', label: 'Ménage & opérations', icon: 'sparkle' },
  { id: 'photo', label: 'Photo & visite virtuelle', icon: 'camera' },
  { id: 'marche', label: 'Étude de marché', icon: 'chart-bar' },
  { id: 'marketing', label: 'Marketing & email', icon: 'megaphone' },
]

// Catégories mises en avant dans la rangée d'icônes (desktop)
export const RACCOURCIS = ['gestion', 'messagerie', 'direct', 'banque', 'acces', 'compta']

const LODGIFY_DEMO = 'https://app.lodgify.com/signup/book-demo/fr/?afmc=uhv'
const HOSPITABLE = 'https://hospitable.com/partners/refer?utm_source=affiliates&utm_medium=blog&utm_campaign=BASWTYN7'
const SHINE = 'https://app.shine.fr/register?referral=WYDP4644'

export const OUTILS = [
  // ── Offres (toujours en tête) ──
  {
    nom: 'Driing', mono: 'D', couleur: '#004C3F', cats: ['direct', 'messagerie'],
    badge: 'fondateur', offre: 'Réservation directe à 0 % de commission',
    desc: "Plateforme de réservation directe, livret d'accueil digital et annuaire de conciergeries. Co-fondée par Jason, pas de commission pour lui.",
    liens: [{ label: 'Découvrir Driing', href: 'https://driing.co', externe: true }],
  },
  {
    nom: 'Lodgify', mono: 'L', couleur: '#2E5BFF', cats: ['gestion', 'direct'],
    badge: 'affilie', offre: 'Essai 7 jours + démo gratuite',
    desc: 'Site de réservation directe et channel manager (Airbnb, Booking.com, Vrbo). Le bon choix pour avoir ton propre site sans coder.',
    liens: [
      { label: 'Démo gratuite', href: LODGIFY_DEMO, sponsored: true },
      { label: 'Mon avis', href: '/lodgify-avis' },
      { label: 'Les prix', href: '/lodgify-prix' },
    ],
  },
  {
    nom: 'Hospitable', mono: 'H', couleur: '#E0245E', cats: ['messagerie', 'gestion'],
    badge: 'affilie', offre: '-25 % pendant 3 mois + 14 jours d’essai',
    desc: 'Messagerie unifiée et automatisée, réponses par IA, codes de serrure et tâches de ménage générés à chaque réservation. Idéal si tu es surtout sur Airbnb.',
    liens: [
      { label: 'Essai gratuit', href: HOSPITABLE, sponsored: true },
      { label: 'Mon avis', href: '/hospitable-avis' },
    ],
  },
  {
    nom: 'Shine', mono: 'S', couleur: '#1F2937', cats: ['banque'],
    badge: 'parrainage', offre: '1 mois d’abonnement offert',
    desc: "Néobanque pro française : compte séparé pour tes revenus LCD, facturation, export pour ton comptable. Mois offert selon les conditions de parrainage en vigueur.",
    liens: [
      { label: 'Ouvrir un compte', href: SHINE, sponsored: true },
      { label: 'Pourquoi un compte pro ?', href: '/blog/compte-bancaire-pro-hote-lcd-6-raisons-choisir-2026' },
    ],
  },
  {
    nom: 'Krossbooking', mono: 'K', couleur: '#0E7490', cats: ['gestion'],
    badge: 'membre', offre: 'Réduction négociée pour les membres',
    desc: 'Channel manager italien complet : PMS, synchronisation des plateformes et moteur de réservation.',
    liens: [],
  },

  // ── Outils référencés (aucune rémunération) ──
  { nom: 'Smoobu', mono: 'S', couleur: '#0F766E', cats: ['gestion', 'direct'], desc: 'Channel manager simple et rapide à prendre en main, interface en français, site de réservation inclus.', liens: [{ label: 'Lodgify vs Smoobu', href: '/comparatif-lodgify-smoobu' }, { label: 'Smoobu vs Hospitable', href: '/comparatif-smoobu-hospitable' }] },
  { nom: 'Superhote', mono: 'S', couleur: '#7C3AED', cats: ['gestion', 'messagerie'], desc: 'Logiciel français de gestion et de messages automatiques, avec un support en français.', liens: [{ label: 'Superhote vs Welkeys', href: '/comparatif-superhote-welkeys' }] },
  { nom: 'Beds24', mono: 'B', couleur: '#334155', cats: ['gestion'], desc: 'Channel manager très complet et paramétrable, pour les profils à l’aise avec la technique.', liens: [{ label: 'Site officiel', href: 'https://beds24.com', externe: true }] },
  { nom: 'Hostfully', mono: 'H', couleur: '#EA580C', cats: ['gestion', 'messagerie'], desc: 'PMS pour conciergeries multi-biens, avec livret d’accueil digital.', liens: [{ label: 'Hostfully vs Guesty', href: '/comparatif-hostfully-guesty' }] },
  { nom: 'Guesty', mono: 'G', couleur: '#1D4ED8', cats: ['gestion'], desc: 'PMS pensé pour les grandes conciergeries qui gèrent des dizaines de logements.', liens: [{ label: 'Hostfully vs Guesty', href: '/comparatif-hostfully-guesty' }] },
  { nom: 'Stripe', mono: 'S', couleur: '#635BFF', cats: ['banque', 'direct'], desc: 'Paiement en ligne par carte sur ton site de réservation directe.', liens: [{ label: 'Site officiel', href: 'https://stripe.com/fr', externe: true }] },
  { nom: 'Qonto', mono: 'Q', couleur: '#111827', cats: ['banque'], desc: 'Néobanque pro très répandue chez les indépendants et les petites sociétés.', liens: [{ label: 'Site officiel', href: 'https://qonto.com/fr', externe: true }] },
  { nom: 'PriceLabs', mono: 'P', couleur: '#2563EB', cats: ['prix'], desc: 'Tarification dynamique très paramétrable, basée sur la demande du marché local.', liens: [{ label: 'Comparatif pricing', href: '/comparatif-pricelabs-beyond-wheelhouse' }] },
  { nom: 'Beyond', mono: 'B', couleur: '#0891B2', cats: ['prix'], desc: 'Tarification dynamique automatisée, pensée pour être simple à laisser tourner.', liens: [{ label: 'Comparatif pricing', href: '/comparatif-pricelabs-beyond-wheelhouse' }] },
  { nom: 'Wheelhouse', mono: 'W', couleur: '#4F46E5', cats: ['prix'], desc: 'Tarification dynamique avec des recommandations détaillées et transparentes.', liens: [{ label: 'Comparatif pricing', href: '/comparatif-pricelabs-beyond-wheelhouse' }] },
  { nom: 'Igloohome', mono: 'I', couleur: '#0F172A', cats: ['acces'], desc: 'Serrures et boîtes à clés à codes temporaires, qui fonctionnent sans wifi.', liens: [{ label: 'igloohome vs TTLock', href: '/comparatif-igloohome-ttlock' }] },
  { nom: 'TTLock', mono: 'T', couleur: '#16A34A', cats: ['acces'], desc: 'Écosystème de serrures à code et Bluetooth, souvent à petit prix.', liens: [{ label: 'igloohome vs TTLock', href: '/comparatif-igloohome-ttlock' }] },
  { nom: 'Nuki', mono: 'N', couleur: '#F59E0B', cats: ['acces'], desc: 'Serrure connectée qui se monte sur la serrure existante, côté intérieur.', liens: [{ label: 'Site officiel', href: 'https://nuki.io/fr', externe: true }] },
  { nom: 'Ring', mono: 'R', couleur: '#0284C7', cats: ['acces'], desc: 'Sonnettes vidéo et caméras extérieures, historique vidéo sur abonnement.', liens: [{ label: 'Ring vs Eufy vs Reolink', href: '/comparatif-ring-eufy-reolink' }] },
  { nom: 'Eufy', mono: 'E', couleur: '#0369A1', cats: ['acces'], desc: 'Caméras et sonnettes avec stockage local, sans abonnement obligatoire.', liens: [{ label: 'Ring vs Eufy vs Reolink', href: '/comparatif-ring-eufy-reolink' }] },
  { nom: 'Reolink', mono: 'R', couleur: '#1E40AF', cats: ['acces'], desc: 'Caméras de surveillance wifi ou filaires, avec stockage local.', liens: [{ label: 'Ring vs Eufy vs Reolink', href: '/comparatif-ring-eufy-reolink' }] },
  { nom: 'Indy', mono: 'I', couleur: '#10B981', cats: ['compta'], desc: 'Comptabilité en ligne automatisée pour les indépendants.', liens: [{ label: 'Indy vs Tiime vs Henrri', href: '/comparatif-indy-tiime-henrri' }] },
  { nom: 'Tiime', mono: 'T', couleur: '#0EA5E9', cats: ['compta'], desc: 'Comptabilité et facturation en ligne, avec une offre gratuite.', liens: [{ label: 'Indy vs Tiime vs Henrri', href: '/comparatif-indy-tiime-henrri' }] },
  { nom: 'Henrri', mono: 'H', couleur: '#DB2777', cats: ['compta'], desc: 'Logiciel de facturation en ligne gratuit.', liens: [{ label: 'Indy vs Tiime vs Henrri', href: '/comparatif-indy-tiime-henrri' }] },
  { nom: 'Jedeclaremonmeuble', mono: 'J', couleur: '#B45309', cats: ['compta'], desc: 'Comptabilité et déclaration LMNP en ligne, avec accompagnement.', liens: [{ label: 'Site officiel', href: 'https://www.jedeclaremonmeuble.com', externe: true }] },
  { nom: 'Turno', mono: 'T', couleur: '#059669', cats: ['menage'], desc: 'Planification automatique des ménages et place de marché de prestataires.', liens: [{ label: 'Turno vs Properly', href: '/comparatif-turnoverbnb-properly' }] },
  { nom: 'Properly', mono: 'P', couleur: '#7C2D12', cats: ['menage'], desc: 'Checklists de ménage et contrôle qualité en photos.', liens: [{ label: 'Turno vs Properly', href: '/comparatif-turnoverbnb-properly' }] },
  { nom: 'Matterport', mono: 'M', couleur: '#111827', cats: ['photo'], desc: 'Visite virtuelle 3D du logement, intégrable à ton annonce ou ton site.', liens: [{ label: 'Matterport vs CubiCasa', href: '/comparatif-matterport-cubicasa' }] },
  { nom: 'CubiCasa', mono: 'C', couleur: '#0D9488', cats: ['photo'], desc: 'Plan du logement généré en le scannant avec un smartphone.', liens: [{ label: 'Matterport vs CubiCasa', href: '/comparatif-matterport-cubicasa' }] },
  { nom: 'AirDNA', mono: 'A', couleur: '#E11D48', cats: ['marche'], desc: 'Données du marché LCD : taux d’occupation, prix moyens, saisonnalité par ville.', liens: [{ label: 'AirDNA vs Mashvisor', href: '/comparatif-airdna-mashvisor' }] },
  { nom: 'Mashvisor', mono: 'M', couleur: '#6D28D9', cats: ['marche'], desc: 'Analyse de rentabilité immobilière, surtout sur le marché américain.', liens: [{ label: 'AirDNA vs Mashvisor', href: '/comparatif-airdna-mashvisor' }] },
  { nom: 'Brevo', mono: 'B', couleur: '#0B996E', cats: ['marketing'], desc: 'Emailing et SMS, solution française, pour fidéliser tes anciens voyageurs.', liens: [{ label: 'Site officiel', href: 'https://www.brevo.com/fr/', externe: true }] },
  { nom: 'Mailchimp', mono: 'M', couleur: '#CA8A04', cats: ['marketing'], desc: 'Emailing et automatisations, très répandu.', liens: [{ label: 'Site officiel', href: 'https://mailchimp.com/fr/', externe: true }] },
]
