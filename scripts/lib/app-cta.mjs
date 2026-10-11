// Encadré « Fais-le dans l'app » en fin d'article (11/10/2026, Jason : finir
// chaque article sur l'app plutôt que sur les formations). L'outil proposé
// dépend du sujet (adresse + titre). Utilisé par generate-article.mjs (nouvel
// article) et inject-app-cta.mjs (articles existants). Marqueurs APPCTA.
// Règle : ne décrire que ce que l'app fait vraiment (voir CLAUDE.md) ; les
// contrats en ligne sont réservés au Standard, le reste est dans le gratuit.

export const REGISTER = 'https://app.jasonmarinho.com/auth/register'

// Débuts de mots : « -fiscal » trouve « fiscalite » mais pas « ete » dans « complete »
const w = (...words) => new RegExp('-(?:' + words.join('|') + ')')

const TOOLS = [
  {
    id: 'declarations',
    match: w('fiche-police', 'formulaire-fiche-police', 'siba', 'declaration-voyageur'),
    icon: 'identification-card',
    title: 'Ta fiche de police, préparée à chaque séjour',
    text: 'Dès qu’un voyageur étranger est ajouté à un séjour, l’app prépare sa fiche de police à faire remplir à l’arrivée et la garde à portée de main. Gratuit.',
    href: '/services/declarations-voyageurs',
  },
  {
    id: 'menage',
    match: w('menage', 'linge', 'lave-linge', 'turnover', 'check-out', 'checkout', 'conciergerie', 'contrat-mandat', 'prestataire', 'co-hote', 'gerer-lcd-distance'),
    icon: 'broom',
    title: 'Ton planning ménage, calculé tout seul',
    text: 'Les ménages se placent d’après tes réservations Airbnb, Booking et directes. Ton équipe reçoit un lien d’agenda et envoie ses photos de fin de ménage. Gratuit.',
    href: '/services/planning-menage',
  },
  {
    id: 'contrats',
    match: w('contrat', 'caution', 'reservation-directe', 'reservations-directes', 'location-directe', 'direct', 'stripe', 'paiement', 'arrhes', 'acompte', 'cheques-vacances'),
    icon: 'file-text',
    title: 'Tes réservations directes, signées et payées',
    text: 'Contrat signé en ligne en français, anglais ou portugais, loyer payé par carte sur ton compte et caution par empreinte. Contrats inclus dans la formule Standard, dès 19,98 € par an.',
    href: '/services/contrats',
  },
  {
    id: 'securite',
    match: w('arnaque', 'fraude', 'securiser-compte', 'signaler', 'signalement', 'verification-voyageur', 'verifier-voyageur', 'voyageurs-difficiles', 'refacturer', 'degat', 'reclamation', 'surnumeraire', 'phishing', 'squat'),
    icon: 'shield-check',
    title: 'Vérifie un voyageur avant de dire oui',
    text: 'Cherche un e-mail, un téléphone ou un nom dans les signalements des hôtes de la communauté, et signale à ton tour un séjour qui s’est mal passé.',
    href: '/services/securite',
  },
  {
    id: 'regles',
    match: w('reglementation', 'numero-enregistrement', 'declarer-activite', 'dpe', 'erp-classement', 'classement-meuble', 'rgpd', 'bail-mobilite', 'chambres-hotes-vs', 'videosurveillance', 'travaux-energetiques', 'loi-'),
    icon: 'scales',
    title: 'Les règles qui changent, expliquées sans jargon',
    text: 'Enregistrement, DPE, taxe de séjour, fiscalité : chaque changement arrive dans ton fil d’actualités, avec un Guide LCD par profil (meublé, gîte, chambres d’hôtes). Gratuit.',
    href: '/services/actualites',
  },
  {
    id: 'fiscal',
    match: w('fiscal', 'lmnp', 'lmp', 'micro-bic', 'impot', 'tva', 'cfe', 'comptab', 'cloture', 'declarer', 'declaration', 'amortissement', 'taxe-de-sejour', 'taxe-sejour', 'urssaf', 'cotisation', 'regime-reel', 'compte-bancaire'),
    icon: 'calculator',
    title: 'Tes chiffres et ton régime fiscal, sans tableur',
    text: 'Revenus par logement, micro-BIC ou réel comparé sur tes vrais montants, taxe de séjour et simulateurs à jour des règles 2026. Gratuit pour commencer.',
    href: '/services/simulateurs',
  },
  {
    id: 'calendrier',
    match: w('ical', 'synchronis', 'integration-calendrier', 'double-reservation', 'channel', 'surbooking', 'checklist-preparation', 'inventaire', 'consommables', 'objets-oublies', 'panne'),
    icon: 'calendar-check',
    title: 'Toutes tes réservations dans un seul calendrier',
    text: 'Connecte tes calendriers Airbnb, Booking et Vrbo : arrivées, départs et ménages du jour réunis, avec une check-list par séjour. Gratuit.',
    href: '/services/calendrier',
  },
  {
    id: 'messages',
    match: w('message', 'messagerie', 'mauvais-avis', 'avis-5', 'obtenir-avis', 'repondre', 'commentaire', 'communication', 'communiquer', 'check-in', 'early-check-in', 'livret', 'email', 'e-mail', 'bienvenue', 'welcome'),
    icon: 'chat-circle-text',
    title: 'Tes messages voyageurs, prêts à copier',
    text: 'Une séquence de messages par logement (avant l’arrivée, pendant, après le départ), remplie avec ton adresse, ton Wi-Fi et tes horaires. Gratuit.',
    href: '/services/gabarits-messages',
  },
  {
    id: 'google',
    match: w('google', 'gmb', 'seo-local', 'instagram', 'blog-hote'),
    icon: 'google-logo',
    title: 'Ta fiche Google auditée en 30 secondes',
    text: 'Colle le lien de ta fiche Google Maps : l’app te donne un score et la liste de ce qu’il faut corriger pour être trouvé en direct, sans commission. Gratuit.',
    href: '/services/audit-gbp',
  },
  {
    id: 'photos',
    match: w('photo', 'photos', 'photographe', 'photographier', 'video-annonce', 'home-staging'),
    icon: 'camera',
    title: 'Un photographe spécialisé location courte durée près de chez toi',
    text: 'L’annuaire réunit des photographes habitués aux annonces Airbnb et Booking, avec leurs tarifs et leur portfolio. Tu les contactes directement, sans commission.',
    href: '/annuaires/photographes',
    eyebrow: 'Annuaire Jason Marinho',
    // L'annuaire est public : il passe en premier, le compte en second
    primary: { href: '/annuaires/photographes', label: 'Voir les photographes' },
    secondary: { href: REGISTER, label: 'Créer mon compte gratuit' },
  },
  {
    id: 'revenus',
    match: w('prix', 'revenu', 'rentab', 'occupation', 'saison', 'basse-saison', 'noel', 'toussaint', 'upsell', 'ventes-additionnelles', 'tarif', 'kpi', 'performance', 'remplir', 'reporting', 'marge', 'budget-annuel', 'point-mort', 'last-minute', 'duree-minimum', 'statistiques', 'sejours-longs', 'workation', 'diversifier'),
    icon: 'chart-line-up',
    title: 'Suis ce que rapporte chaque logement',
    text: 'Revenus, commissions et bénéfice par logement, objectif de l’année et ce qui est déjà réservé, au même endroit. Gratuit pour commencer.',
    href: '/services/revenus',
  },
]

const DEFAULT = {
  id: 'app',
  icon: 'house-line',
  title: 'Le quotidien de ta location, au même endroit',
  text: 'Calendrier Airbnb et Booking réuni, planning ménage automatique, fiches de police, messages voyageurs et suivi des revenus. Gratuit pour commencer, sans carte bancaire.',
  href: '/services',
}

const norm = s => '-' + String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')

export function pickTool(slug, title = '') {
  const s = norm(slug)
  // L'adresse d'abord (le sujet), puis le titre
  return TOOLS.find(t => t.match.test(s)) || TOOLS.find(t => t.match.test(norm(title))) || DEFAULT
}

export function appCtaBlock(slug, title) {
  const t = pickTool(slug, title)
  const primary = t.primary || { href: REGISTER, label: 'Créer mon compte gratuit' }
  const secondary = t.secondary || { href: t.href, label: 'Voir comment ça marche' }
  return `<!-- APPCTA:START -->
<div style="margin:36px 0 8px;padding:24px clamp(18px,3vw,28px);border-radius:16px;background:#F2F8F4;border:1px solid rgba(0,76,63,.16)" data-app-cta="${t.id}">
  <div style="font-size:10.5px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#004C3F;margin-bottom:10px;display:flex;align-items:center;gap:7px"><i class="ph-bold ph-${t.icon}" style="font-size:15px"></i> ${t.eyebrow || 'Dans l’app Jason Marinho'}</div>
  <p style="font-family:'Fraunces',serif;font-weight:500;font-size:clamp(19px,2.4vw,23px);line-height:1.25;color:#0F1A0D;margin:0 0 8px">${t.title}</p>
  <p style="font-size:14.5px;line-height:1.65;color:#3D5038;margin:0 0 16px">${t.text}</p>
  <div style="display:flex;flex-wrap:wrap;gap:10px">
    <a href="${primary.href}" style="display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 20px;border-radius:10px;background:#004C3F;color:#fff;font-weight:600;font-size:14.5px;text-decoration:none;flex:1 1 200px;max-width:280px">${primary.label} <i class="ph-bold ph-arrow-right"></i></a>
    <a href="${secondary.href}" style="display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 18px;border-radius:10px;border:1px solid rgba(0,76,63,.25);color:#004C3F;font-weight:600;font-size:14px;text-decoration:none;flex:1 1 180px;max-width:260px">${secondary.label}</a>
  </div>
</div>
<!-- APPCTA:END -->
`
}

/** Ajoute (ou remplace) l'encadré juste avant les articles similaires. null si l'emplacement manque. */
export function injectAppCta(html, slug, title) {
  const clean = html.replace(/<!-- APPCTA:START -->[\s\S]*?<!-- APPCTA:END -->\n?/, '')
  const anchor = '<section class="related-sec">'
  const i = clean.indexOf(anchor)
  if (i < 0) return null
  // Juste avant la fermeture du corps de l'article (le </div> qui précède la section)
  const bodyEnd = clean.lastIndexOf('</div>', i)
  const at = bodyEnd > 0 && clean.slice(bodyEnd, i).trim() === '</div>' ? bodyEnd : i
  return clean.slice(0, at) + appCtaBlock(slug, title) + clean.slice(at)
}
