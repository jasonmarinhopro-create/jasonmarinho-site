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
  { id: 'juridique', label: 'Création & juridique', icon: 'scales' },
  { id: 'menage', label: 'Ménage & opérations', icon: 'sparkle' },
  { id: 'photo', label: 'Photo & visite virtuelle', icon: 'camera' },
  { id: 'marche', label: 'Étude de marché', icon: 'chart-bar' },
  { id: 'marketing', label: 'Marketing & email', icon: 'megaphone' },
]

// Catégories mises en avant dans la rangée d'icônes (desktop)
export const RACCOURCIS = ['gestion', 'messagerie', 'direct', 'banque', 'acces', 'compta', 'juridique', 'marketing']

const LODGIFY_DEMO = 'https://app.lodgify.com/signup/book-demo/fr/?afmc=uhv'
const HOSPITABLE = 'https://hospitable.com/partners/refer?utm_source=affiliates&utm_medium=blog&utm_campaign=BASWTYN7'
const SHINE = 'https://app.shine.fr/register?referral=WYDP4644'
// Indy (partenariat validé le 30/09/2026) : lien « spécial immobilier » fourni par Indy
const INDY = 'https://urlr.me/FEqNfy'
// LegalPlace (partenariat Affilae du 30/09/2026, numéro d'affilié 1773) : les
// paramètres du lien traqué généré par Jason, ajoutés à chaque page du kit
export const LEGALPLACE_AE = 'utm_source=affilae&utm_medium=partner&utm_campaign=Jason%20Marinho&ae=1773'
const LEGALPLACE_SOCIETE = `https://creation.legalplace.fr/creation-entreprise-2?${LEGALPLACE_AE}`
// Tiime (partenariat Affilae accepté le 01/10/2026, numéro d'affilié 1127)
// Brevo (partenariat PartnerStack du 06/10/2026) : lien « plateforme » fourni par Brevo
const BREVO = 'https://get.brevo.com/3mftm80uaemx-m7y3c'
const TIIME = 'https://lb.affilae.com/r/?p=651c0d1e40e2d575f87b3b27&af=1127&lp=https%3A%2F%2Fwww.tiime.fr%2Ffacturation-electronique-2026%3Futm_source%3Dother%26utm_medium%3Daffiliation%26utm_campaign%3DJason%2520Marinho%26ae%3D1127%26program_id%3D651c0d1e40e2d575f87b3b27%26program_name%3DTiime'

export const OUTILS = [
  // ── Offres (toujours en tête) ──
  {
    nom: 'Driing', mono: 'D', couleur: '#004C3F', cats: ['direct', 'messagerie'],
    badge: 'fondateur', offre: '0 % de commission',
    desc: "Réservation directe, livret d'accueil digital et annuaire de conciergeries. Co-fondée par Jason, non rémunéré.",
    liens: [{ label: 'Découvrir Driing', href: 'https://driing.co', externe: true }],
  },
  {
    nom: 'Lodgify', mono: 'L', couleur: '#2E5BFF', cats: ['gestion', 'direct'],
    // Code JASON15 (01/10/2026) : -15 % sur Professional et Ultimate, annuel ou
    // 2 ans, jusqu'au 1er octobre 2027 (conditions sur /code-promo-lodgify)
    badge: 'affilie', offre: '-15 % avec JASON15',
    desc: 'Ton propre site de réservation directe, relié à Airbnb, Booking.com et Vrbo, sans coder.',
    liens: [
      { label: 'Démo gratuite', href: LODGIFY_DEMO, sponsored: true },
      { label: "Voir l'offre", href: '/partenaires/lodgify' },
    ],
  },
  {
    nom: 'Hospitable', mono: 'H', couleur: '#E0245E', cats: ['messagerie', 'gestion'],
    badge: 'affilie', offre: '-25 % pendant 3 mois',
    desc: 'Messages automatiques et IA, codes de serrure et ménage gérés à chaque réservation. 14 jours d’essai gratuit.',
    liens: [
      { label: 'Essai gratuit', href: HOSPITABLE, sponsored: true },
      { label: 'Mon avis', href: '/hospitable-avis' },
    ],
  },
  {
    nom: 'Shine', mono: 'S', couleur: '#1F2937', cats: ['banque'],
    badge: 'parrainage', offre: '1 mois offert',
    desc: "Néobanque pro : un compte séparé pour tes revenus LCD. Mois offert selon les conditions de parrainage Shine.",
    liens: [
      { label: 'Ouvrir un compte', href: SHINE, sponsored: true },
      { label: 'Pourquoi ?', href: '/blog/compte-bancaire-pro-hote-lcd-6-raisons-choisir-2026' },
    ],
  },
  {
    nom: 'Indy', mono: 'I', couleur: '#10B981', cats: ['compta'],
    badge: 'affilie', offre: '1er mois offert',
    desc: 'Compta LMNP, liasse fiscale 2031 et facture électronique (plateforme agréée) pour ta location meublée.',
    liens: [
      { label: 'Essayer Indy', href: INDY, sponsored: true },
      { label: "Voir l'offre", href: '/partenaires/indy' },
    ],
  },
  {
    nom: 'LegalPlace', mono: 'L', couleur: '#1D3557', cats: ['juridique'],
    badge: 'affilie', offre: 'Statuts en ligne',
    desc: 'Création de SCI, SASU ou micro-entreprise, modification de statuts et domiciliation, en ligne.',
    liens: [
      { label: 'Créer ma société', href: LEGALPLACE_SOCIETE, sponsored: true },
      { label: "Voir l'offre", href: '/partenaires/legalplace' },
    ],
  },
  {
    nom: 'Tiime', mono: 'T', couleur: '#0EA5E9', cats: ['compta'],
    badge: 'affilie', offre: 'Facturation gratuite',
    desc: 'Devis, factures illimitées et facture électronique (plateforme agréée) gratuits. Compte pro en option.',
    liens: [
      { label: 'Essayer Tiime', href: TIIME, sponsored: true },
      { label: 'Comparatif', href: '/comparatif-indy-tiime-henrri' },
    ],
  },
  {
    nom: 'Brevo', mono: 'B', couleur: '#0B996E', cats: ['marketing'],
    // Partenariat PartnerStack du 06/10/2026 (lien « plateforme »)
    badge: 'affilie', offre: '300 e-mails/jour gratuits',
    desc: 'Newsletter à tes voyageurs directs et CRM gratuit. Solution française, données en Europe.',
    liens: [
      { label: 'Créer un compte', href: BREVO, sponsored: true },
      { label: "Voir l'offre", href: '/partenaires/brevo' },
    ],
  },
  {
    nom: 'Krossbooking', mono: 'K', couleur: '#0E7490', cats: ['gestion'],
    badge: 'membre', offre: 'Tarif négocié membres',
    desc: 'Channel manager italien avec PMS et moteur de réservation. Réduction réservée aux membres.',
    liens: [{ label: 'Devenir membre', href: 'https://app.jasonmarinho.com/auth/register' }],
    // Dans le dashboard, l'hôte est déjà membre : lien vers le site à la place.
    liensApp: [{ label: 'Site officiel', href: 'https://www.krossbooking.com/', externe: true }],
  },

  // ── Outils référencés (aucune rémunération) ──
  { nom: 'Smoobu', mono: 'S', couleur: '#0F766E', cats: ['gestion', 'direct'], desc: 'Channel manager simple et rapide à prendre en main, interface en français, site de réservation inclus.', liens: [{ label: 'Voir le comparatif', href: '/comparatif-lodgify-smoobu' }] },
  { nom: 'Superhote', mono: 'S', couleur: '#7C3AED', cats: ['gestion', 'messagerie'], desc: 'Logiciel français de gestion et de messages automatiques, avec un support en français.', liens: [{ label: 'Voir le comparatif', href: '/comparatif-superhote-welkeys' }] },
  { nom: 'Beds24', mono: 'B', couleur: '#334155', cats: ['gestion'], desc: 'Channel manager très complet et paramétrable, pour les profils à l’aise avec la technique.', liens: [{ label: 'Site officiel', href: 'https://beds24.com', externe: true }] },
  { nom: 'Hostfully', mono: 'H', couleur: '#EA580C', cats: ['gestion', 'messagerie'], desc: 'PMS pour conciergeries multi-biens, avec livret d’accueil digital.', liens: [{ label: 'Voir le comparatif', href: '/comparatif-hostfully-guesty' }] },
  { nom: 'Guesty', mono: 'G', couleur: '#1D4ED8', cats: ['gestion'], desc: 'PMS pensé pour les grandes conciergeries qui gèrent des dizaines de logements.', liens: [{ label: 'Voir le comparatif', href: '/comparatif-hostfully-guesty' }] },
  { nom: 'Stripe', mono: 'S', couleur: '#635BFF', cats: ['banque', 'direct'], desc: 'Paiement en ligne par carte sur ton site de réservation directe.', liens: [{ label: 'Site officiel', href: 'https://stripe.com/fr', externe: true }] },
  { nom: 'Qonto', mono: 'Q', couleur: '#111827', cats: ['banque'], desc: 'Néobanque pro très répandue chez les indépendants et les petites sociétés.', liens: [{ label: 'Site officiel', href: 'https://qonto.com/fr', externe: true }] },
  { nom: 'PriceLabs', mono: 'P', couleur: '#2563EB', cats: ['prix'], desc: 'Tarification dynamique très paramétrable, basée sur la demande du marché local.', liens: [{ label: 'Voir le comparatif', href: '/comparatif-pricelabs-beyond-wheelhouse' }] },
  { nom: 'Beyond', mono: 'B', couleur: '#0891B2', cats: ['prix'], desc: 'Tarification dynamique automatisée, pensée pour être simple à laisser tourner.', liens: [{ label: 'Voir le comparatif', href: '/comparatif-pricelabs-beyond-wheelhouse' }] },
  { nom: 'Wheelhouse', mono: 'W', couleur: '#4F46E5', cats: ['prix'], desc: 'Tarification dynamique avec des recommandations détaillées et transparentes.', liens: [{ label: 'Voir le comparatif', href: '/comparatif-pricelabs-beyond-wheelhouse' }] },
  { nom: 'Igloohome', mono: 'I', couleur: '#0F172A', cats: ['acces'], desc: 'Serrures et boîtes à clés à codes temporaires, qui fonctionnent sans wifi.', liens: [{ label: 'Voir le comparatif', href: '/comparatif-igloohome-ttlock' }] },
  { nom: 'TTLock', mono: 'T', couleur: '#16A34A', cats: ['acces'], desc: 'Écosystème de serrures à code et Bluetooth, souvent à petit prix.', liens: [{ label: 'Voir le comparatif', href: '/comparatif-igloohome-ttlock' }] },
  { nom: 'Nuki', mono: 'N', couleur: '#F59E0B', cats: ['acces'], desc: 'Serrure connectée qui se monte sur la serrure existante, côté intérieur.', liens: [{ label: 'Site officiel', href: 'https://nuki.io/fr', externe: true }] },
  { nom: 'Ring', mono: 'R', couleur: '#0284C7', cats: ['acces'], desc: 'Sonnettes vidéo et caméras extérieures, historique vidéo sur abonnement.', liens: [{ label: 'Voir le comparatif', href: '/comparatif-ring-eufy-reolink' }] },
  { nom: 'Eufy', mono: 'E', couleur: '#0369A1', cats: ['acces'], desc: 'Caméras et sonnettes avec stockage local, sans abonnement obligatoire.', liens: [{ label: 'Voir le comparatif', href: '/comparatif-ring-eufy-reolink' }] },
  { nom: 'Reolink', mono: 'R', couleur: '#1E40AF', cats: ['acces'], desc: 'Caméras de surveillance wifi ou filaires, avec stockage local.', liens: [{ label: 'Voir le comparatif', href: '/comparatif-ring-eufy-reolink' }] },
  { nom: 'Henrri', mono: 'H', couleur: '#DB2777', cats: ['compta'], desc: 'Logiciel de facturation en ligne gratuit.', liens: [{ label: 'Voir le comparatif', href: '/comparatif-indy-tiime-henrri' }] },
  { nom: 'Jedeclaremonmeuble', mono: 'J', couleur: '#B45309', cats: ['compta'], desc: 'Comptabilité et déclaration LMNP en ligne, avec accompagnement.', liens: [{ label: 'Site officiel', href: 'https://www.jedeclaremonmeuble.com', externe: true }] },
  { nom: 'Turno', mono: 'T', couleur: '#059669', cats: ['menage'], desc: 'Planification automatique des ménages et place de marché de prestataires.', liens: [{ label: 'Voir le comparatif', href: '/comparatif-turnoverbnb-properly' }] },
  { nom: 'Properly', mono: 'P', couleur: '#7C2D12', cats: ['menage'], desc: 'Checklists de ménage et contrôle qualité en photos.', liens: [{ label: 'Voir le comparatif', href: '/comparatif-turnoverbnb-properly' }] },
  { nom: 'Matterport', mono: 'M', couleur: '#111827', cats: ['photo'], desc: 'Visite virtuelle 3D du logement, intégrable à ton annonce ou ton site.', liens: [{ label: 'Voir le comparatif', href: '/comparatif-matterport-cubicasa' }] },
  { nom: 'CubiCasa', mono: 'C', couleur: '#0D9488', cats: ['photo'], desc: 'Plan du logement généré en le scannant avec un smartphone.', liens: [{ label: 'Voir le comparatif', href: '/comparatif-matterport-cubicasa' }] },
  { nom: 'AirDNA', mono: 'A', couleur: '#E11D48', cats: ['marche'], desc: 'Données du marché LCD : taux d’occupation, prix moyens, saisonnalité par ville.', liens: [{ label: 'Voir le comparatif', href: '/comparatif-airdna-mashvisor' }] },
  { nom: 'Mashvisor', mono: 'M', couleur: '#6D28D9', cats: ['marche'], desc: 'Analyse de rentabilité immobilière, surtout sur le marché américain.', liens: [{ label: 'Voir le comparatif', href: '/comparatif-airdna-mashvisor' }] },
  { nom: 'Mailchimp', mono: 'M', couleur: '#CA8A04', cats: ['marketing'], desc: 'Emailing et automatisations, très répandu.', liens: [{ label: 'Site officiel', href: 'https://mailchimp.com/fr/', externe: true }] },
]
