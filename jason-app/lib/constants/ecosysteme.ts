// Catalogue des outils & services de la LCD (Location Courte Durée)
// Liste informative, Jason peut négocier des partenariats sur ces outils
// et l'indique via le champ partnership.

export type Partnership = 'none' | 'discount' | 'featured'

export interface EcosystemeTool {
  slug: string
  name: string
  description: string
  url: string
  category: string
  // 'featured' = Driing (produit phare)
  // 'discount' = partenariat négocié avec réduction
  // 'none' = pas de partenariat (informatif)
  partnership: Partnership
  partnershipText?: string
}

export const ECOSYSTEME_CATEGORIES: Array<{ id: string; label: string; emoji: string; desc: string }> = [
  { id: 'channel-managers', label: 'Channel managers',     emoji: '🏠', desc: 'Synchroniser tes annonces et calendriers entre Airbnb, Booking, etc.' },
  { id: 'serrures',         label: 'Serrures connectées',   emoji: '🔐', desc: 'Check-in autonome 24/7 sans clé physique' },
  { id: 'assurances',       label: 'Assurances',            emoji: '🛡️', desc: 'Couverture du logement, des voyageurs et de l\'activité' },
  { id: 'comptabilite',     label: 'Comptabilité & juridique', emoji: '📊', desc: 'Tenir tes comptes, déclarer tes revenus en LMNP/LMP' },
  { id: 'menage',           label: 'Ménage & maintenance',  emoji: '🧹', desc: 'Externaliser le ménage entre deux séjours' },
  { id: 'photographe',      label: 'Photographe',           emoji: '📸', desc: 'Photos pro pour booster ta conversion d\'annonce' },
  { id: 'site-direct',      label: 'Site de réservation directe', emoji: '🌍', desc: 'Construire ton site de réservation directe (0% commission)' },
  { id: 'paiement',         label: 'Paiement',              emoji: '💳', desc: 'Encaisser cautions et loyers en ligne' },
  { id: 'marketing',        label: 'Marketing & email',     emoji: '📧', desc: 'Newsletter, automatisations, fidélisation' },
]

export const ECOSYSTEME_TOOLS: EcosystemeTool[] = [
  // ── Channel managers ────────────────────────────────────────────────────
  {
    slug: 'krossbooking',
    name: 'Krossbooking',
    description: 'Channel manager italien complet (PMS + sync OTA + booking engine). Solide pour multi-logements.',
    url: 'https://www.krossbooking.com/',
    category: 'channel-managers',
    partnership: 'discount',
    partnershipText: 'Réduction négociée pour les membres',
  },
  {
    slug: 'smoobu',
    name: 'Smoobu',
    description: 'Channel manager allemand abordable, idéal pour démarrer. Sync, calendrier unifié, messagerie centralisée.',
    url: 'https://www.smoobu.com/',
    category: 'channel-managers',
    partnership: 'none',
  },
  {
    slug: 'lodgify',
    name: 'Lodgify',
    description: 'PMS + builder de site direct intégré. Bon compromis pour propriétaires indépendants.',
    url: 'https://www.lodgify.com/',
    category: 'channel-managers',
    partnership: 'none',
  },
  {
    slug: 'hospitable',
    name: 'Hospitable',
    description: 'Anciennement Smartbnb. Très orienté automatisation messagerie + tarification dynamique.',
    url: 'https://hospitable.com/',
    category: 'channel-managers',
    partnership: 'none',
  },
  {
    slug: 'beds24',
    name: 'Beds24',
    description: 'Channel manager + PMS très puissant et personnalisable. Courbe d\'apprentissage, mais très complet.',
    url: 'https://www.beds24.com/',
    category: 'channel-managers',
    partnership: 'none',
  },
  {
    slug: 'avantio',
    name: 'Avantio',
    description: 'PMS espagnol pour conciergeries et grosses opérations. Spécialisé multi-propriétés.',
    url: 'https://www.avantio.com/',
    category: 'channel-managers',
    partnership: 'none',
  },
  {
    slug: 'bookingsync',
    name: 'BookingSync',
    description: 'PMS français reconnu, bien intégré aux principales OTA. Bon support FR.',
    url: 'https://www.bookingsync.com/',
    category: 'channel-managers',
    partnership: 'none',
  },

  // ── Serrures connectées ─────────────────────────────────────────────────
  {
    slug: 'igloohome',
    name: 'Igloohome',
    description: 'Serrures connectées avec codes temporaires Bluetooth. Pas de wifi requis, robuste.',
    url: 'https://www.igloohome.co/',
    category: 'serrures',
    partnership: 'none',
  },
  {
    slug: 'nuki',
    name: 'Nuki',
    description: 'Serrure connectée se posant sur ton cylindre existant. Codes voyageurs, intégrations riches.',
    url: 'https://nuki.io/',
    category: 'serrures',
    partnership: 'none',
  },
  {
    slug: 'tedee',
    name: 'Tedee',
    description: 'Alternative à Nuki, design plus discret. Compatible avec la plupart des cylindres européens.',
    url: 'https://tedee.com/',
    category: 'serrures',
    partnership: 'none',
  },
  {
    slug: 'yale-linus',
    name: 'Yale Linus',
    description: 'Serrure connectée Yale, fiable et bien documentée. Bon support en France.',
    url: 'https://www.yalehome.fr/',
    category: 'serrures',
    partnership: 'none',
  },

  // ── Assurances ──────────────────────────────────────────────────────────
  {
    slug: 'luko',
    name: 'Luko',
    description: 'Assurance habitation 100% en ligne, options spécifiques pour LCD/Airbnb.',
    url: 'https://www.luko.eu/',
    category: 'assurances',
    partnership: 'none',
  },
  {
    slug: 'sma-bnb',
    name: 'SMA BTP, Garantie LCD',
    description: 'Assurance multirisque dédiée à la location saisonnière (vol, dégâts, RC).',
    url: 'https://www.groupe-sma.fr/',
    category: 'assurances',
    partnership: 'none',
  },
  {
    slug: 'aircover',
    name: 'AIR Cover (Airbnb)',
    description: 'Couverture incluse pour les hôtes Airbnb : dommages, responsabilité civile.',
    url: 'https://www.airbnb.fr/aircover-for-hosts',
    category: 'assurances',
    partnership: 'none',
  },

  // ── Comptabilité & juridique ────────────────────────────────────────────
  {
    slug: 'ouicompta',
    name: 'Ouicompta',
    description: 'Comptabilité LMNP en ligne, déclaration 2031 simplifiée. Spécialisé location meublée.',
    url: 'https://www.ouicompta.fr/',
    category: 'comptabilite',
    partnership: 'none',
  },
  {
    slug: 'dougs',
    name: 'Dougs',
    description: 'Cabinet comptable en ligne. Accompagnement LMNP, LMP, SCI. Plus haut de gamme.',
    url: 'https://www.dougs.fr/',
    category: 'comptabilite',
    partnership: 'none',
  },
  {
    slug: 'indy',
    name: 'Indy',
    description: 'Comptabilité automatisée pour indépendants. Bonne option si activité simple.',
    url: 'https://www.indy.fr/',
    category: 'comptabilite',
    partnership: 'none',
  },
  {
    slug: 'jedeclaremonmeuble',
    name: 'Jedeclaremonmeuble',
    description: 'Service en ligne dédié à la déclaration LMNP. Tarif compétitif.',
    url: 'https://www.jedeclaremonmeuble.com/',
    category: 'comptabilite',
    partnership: 'none',
  },

  // ── Ménage & maintenance ────────────────────────────────────────────────
  {
    slug: 'olalo',
    name: 'Olalo',
    description: 'Plateforme de mise en relation avec des équipes de ménage pour LCD.',
    url: 'https://www.olalo.fr/',
    category: 'menage',
    partnership: 'none',
  },
  {
    slug: 'properly',
    name: 'Properly',
    description: 'Outil de checklists ménage avec photos pour standardiser tes turnovers.',
    url: 'https://www.getproperly.com/',
    category: 'menage',
    partnership: 'none',
  },

  // ── Photographe ─────────────────────────────────────────────────────────
  {
    slug: 'hote-photo',
    name: 'Hôte-Photo',
    description: 'Photographes spécialisés en location saisonnière partout en France.',
    url: 'https://hote-photo.fr/',
    category: 'photographe',
    partnership: 'none',
  },
  {
    slug: 'pix4stay',
    name: 'Pix4Stay',
    description: 'Service photo + visite virtuelle 360° dédié aux hébergements touristiques.',
    url: 'https://pix4stay.com/',
    category: 'photographe',
    partnership: 'none',
  },

  // ── Site de réservation directe ─────────────────────────────────────────
  {
    slug: 'driing-site',
    name: 'Driing, Plateforme de réservation',
    description: 'Plateforme propre de réservation directe sans commission. Inclus avec ton compte Driing.',
    url: 'https://www.driing.co/',
    category: 'site-direct',
    partnership: 'featured',
    partnershipText: 'Inclus pour les membres Driing',
  },
  {
    slug: 'hostfully',
    name: 'Hostfully',
    description: 'Builder de site direct + livret d\'accueil digital. Solide pour réservations directes.',
    url: 'https://www.hostfully.com/',
    category: 'site-direct',
    partnership: 'none',
  },
  {
    slug: 'lodgify-direct',
    name: 'Lodgify Direct Booking',
    description: 'Module site direct de Lodgify. Idéal si tu utilises déjà leur PMS.',
    url: 'https://www.lodgify.com/website-builder/',
    category: 'site-direct',
    partnership: 'none',
  },

  // ── Paiement ────────────────────────────────────────────────────────────
  {
    slug: 'stripe',
    name: 'Stripe',
    description: 'Standard du paiement en ligne. Cautions, loyers, paiements internationaux.',
    url: 'https://stripe.com/fr',
    category: 'paiement',
    partnership: 'none',
  },
  {
    slug: 'gocardless',
    name: 'GoCardless',
    description: 'Spécialisé prélèvements SEPA récurrents. Pratique pour cautions et paiements en plusieurs fois.',
    url: 'https://gocardless.com/fr-fr/',
    category: 'paiement',
    partnership: 'none',
  },

  // ── Marketing & email ───────────────────────────────────────────────────
  {
    slug: 'brevo',
    name: 'Brevo (ex-Sendinblue)',
    description: 'Plateforme française d\'emailing et automatisations. Plan gratuit généreux.',
    url: 'https://www.brevo.com/fr/',
    category: 'marketing',
    partnership: 'none',
  },
  {
    slug: 'mailchimp',
    name: 'Mailchimp',
    description: 'Standard mondial de l\'emailing. Templates pros, mais en anglais.',
    url: 'https://mailchimp.com/',
    category: 'marketing',
    partnership: 'none',
  },
]
