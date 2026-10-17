// Onglet « Groupes » de Provenance (12/10/2026, Jason : « la même chose que
// dans mon CRM Driing ») : on colle un message copié dans un groupe Facebook
// d'hôtes, l'outil le lit (qui écrit, de quoi il parle, quelle ville), trouve
// nos pages qui y répondent (articles, guides de ville, simulateurs, fiches
// de l'annuaire) et prépare un prompt à coller dans Claude pour écrire le
// commentaire. Liens suivis : utm_source=facebook, utm_medium=groupe,
// utm_campaign=<code du message> (clics et inscriptions dans Provenance).
// Pur et testé : groupes.test.ts. Le message lui-même n'est jamais gardé.

import { CITY_PAGE_SLUGS, cityLabel, slugifyCity } from '@/lib/visibility/city-page'

export const SITE = 'https://jasonmarinho.com'
export const REGISTER_URL = 'https://app.jasonmarinho.com/auth/register'
export const DRIING_URL = 'https://www.driing.co'

// ── Nettoyage du texte copié dans Facebook ──

const NOISE = /^(facebook|j[’']aime|repondre|répondre|commenter|partager|envoyer|suivre|voir plus|voir la traduction|voir l[’']original|plus pertinents|tous les commentaires|membre anonyme|participant anonyme|administrateur|admin|moderateur|modérateur|top contributeur|contributeur|nouveau membre|auteur|modifié|·|…|\.\.\.)$/i

// Mots d'un nom de groupe (« Hôtes Airbnb Annecy », « Location vacances en station de ski »)
const GROUP_WORDS = /\b(airbnb|booking|lcd|location|locations|hote|hotes|conciergerie|conciergeries|gite|gites|chambres? d hotes|groupe|proprietaires?|saisonniere?s?|vacances|meubles? de tourisme|entraide|abritel)\b/
const isGroupLike = (l: string) => GROUP_WORDS.test(normText(l))
const NAME_LINE = /^[A-ZÀ-Ý][a-zà-ÿ'’-]+( [A-ZÀ-Ý][a-zà-ÿ'’-]+){1,2}$/

/** Retire le bruit d'un copier-coller Facebook (« Facebook » répété, lettres isolées, codes), repère l'auteur et le groupe */
export function cleanFacebookText(raw: string): { text: string; author: string | null; group: string | null } {
  const lines = raw.replace(/\r/g, '').split('\n').map(l => l.replace(/\s+/g, ' ').trim())
  const kept: string[] = []
  for (const l of lines) {
    if (!l || l.length <= 2 || NOISE.test(l)) continue
    if (/^\d+\s*(s|min|h|j|sem|an|ans|semaines?|jours?|heures?)$/i.test(l)) continue
    if (/^\d+$/.test(l)) continue
    // Codes de suivi de Facebook : un seul « mot » mêlant lettres et chiffres
    if (!/\s/.test(l) && l.length <= 14 && /\d/.test(l) && /[a-z]/i.test(l)) continue
    if (kept[kept.length - 1] !== l) kept.push(l)
  }
  // En-tête : les lignes courtes avant le premier vrai paragraphe
  let firstLong = kept.findIndex(l => l.length > 60 || /[.?!]$/.test(l))
  // Message court : la dernière ligne est le message
  if (firstLong < 0) firstLong = Math.max(0, kept.length - 1)
  const head = kept.slice(0, firstLong)
  let author: string | null = null
  let group: string | null = null
  const drop = new Set<number>()
  for (let i = head.length - 1; i >= 0; i--) {
    const l = head[i]
    if (!author && NAME_LINE.test(l) && !isGroupLike(l)) { author = l.split(' ')[0]; drop.add(i); continue }
    if (!group && l.length <= 80 && isGroupLike(l)) { group = l; drop.add(i) }
  }
  return { text: kept.filter((_, i) => !drop.has(i)).join('\n').trim(), author, group }
}

// ── Lecture ──

export type GroupProfile = 'hote' | 'pro' | 'investisseur' | 'voyageur'
export const PROFILE_LABEL: Record<GroupProfile, string> = {
  hote: 'Hôte', pro: 'Pro (ménage, photo)', investisseur: 'Investisseur', voyageur: 'Voyageur',
}

export type TopicKey =
  | 'taxe' | 'fiscal' | 'reglementation' | 'police' | 'contrat' | 'menage' | 'photo'
  | 'direct' | 'plateformes' | 'prix' | 'avis' | 'securite' | 'calendrier' | 'investir'

interface TopicDef {
  key: TopicKey
  label: string
  /** Débuts de mots ou expressions, sans accents */
  words: string[]
  /** Indices faibles (comptent pour moitié) */
  weak?: string[]
  /** Morceaux d'adresse des articles du sujet */
  slugHints: string[]
  service?: { url: string; title: string }
  facts: string[]
}

const AIRBNB_FEES = "Airbnb passe à des frais d'hôte uniques de 15,5 % dans l'Espace économique européen à partir du 13 octobre 2026 (18,6 % avec la TVA sur la commission)."

// Faits vérifiés (voir CLAUDE.md, relevés de septembre et octobre 2026) : le
// prompt interdit à Claude tout chiffre qui n'est pas ici.
export const TOPICS: TopicDef[] = [
  {
    key: 'taxe', label: 'Taxe de séjour',
    words: ['taxe de sejour', 'taxe sejour', 'taxe additionnelle'],
    slugHints: ['taxe-sejour', 'taxe'],
    service: { url: '/services/simulateurs/taxe-de-sejour', title: 'Simulateur de taxe de séjour 2026' },
    facts: [
      "Taxe de séjour 2026 : chaque commune vote son tarif dans des plafonds nationaux, jusqu'à 1,00 € en 1 et 2 étoiles et en chambres d'hôtes, 1,70 € en 3 étoiles, 2,60 € en 4 étoiles, 3,60 € en 5 étoiles et 4,90 € pour un palace, par personne et par nuit.",
      "Meublé non classé : 1 % à 5 % du prix HT de la nuitée par personne, plafonné au tarif le plus élevé voté par la commune, plus le plus souvent 10 % de taxe additionnelle départementale. Les mineurs sont exonérés.",
      "Airbnb collecte et reverse la taxe dans la plupart des communes ; en réservation directe, c'est à l'hôte de la collecter et de la déclarer.",
      "Île-de-France : s'ajoutent 15 % de taxe régionale et une taxe additionnelle de 200 % au profit d'Île-de-France Mobilités.",
    ],
  },
  {
    key: 'fiscal', label: 'Fiscalité',
    words: ['lmnp', 'lmp', 'micro bic', 'microbic', 'impot', 'fiscal', 'declarer mes revenus', 'declaration de revenus', 'declaration d impot', 'regime reel', 'reel simplifie', 'amortissement', 'urssaf', 'cotisation', 'tva', 'cfe', '2042', 'expert comptable', 'comptab', 'abattement', 'plus value'],
    slugHints: ['lmnp', 'micro-bic', 'fiscal', 'impot', 'regime-reel', 'tva', 'lmp', 'cloture', 'declarer-lmnp'],
    service: { url: '/services/simulateurs', title: 'Simulateurs : micro-BIC ou réel, rentabilité' },
    facts: [
      "Micro-BIC 2026 : meublé de tourisme non classé, abattement de 30 % et plafond de 15 000 € de recettes ; meublé classé et chambres d'hôtes, abattement de 50 % et plafond de 83 600 €.",
      "Dépasser le plafond une seule année ne fait pas sortir du micro-BIC : il faut le dépasser deux années de suite.",
      "Prélèvements sociaux sur les revenus LMNP : 18,6 % depuis les revenus 2025.",
      "Au-delà de 23 000 € de recettes par an en location courte durée, des cotisations sociales Urssaf sont dues, même en LMNP, à la place des prélèvements sociaux.",
      "Location meublée sans services : exonérée de TVA, sans seuil. Avec au moins 3 des 4 services de la para-hôtellerie (petit-déjeuner, ménage pendant le séjour, linge, réception), TVA à 10 % au-delà de 85 000 € de recettes.",
    ],
  },
  {
    key: 'reglementation', label: 'Réglementation',
    words: ['numero d enregistrement', 'enregistrement', 'mairie', 'cerfa', '120 jours', '120 nuits', '90 jours', '90 nuits', 'changement d usage', 'residence secondaire', 'residence principale', 'copro', 'syndic', 'dpe', 'loi le meur', 'le meur', 'quota', 'meuble de tourisme', 'classement', 'autorisation', 'legal', 'interdit'],
    slugHints: ['reglementation', 'numero-enregistrement', 'dpe', 'declarer-activite', 'erp-classement', 'bail-mobilite'],
    service: { url: '/services/actualites', title: 'Actualités de la location courte durée' },
    facts: [
      "Numéro d'enregistrement : généralisé à toute la France par la loi Le Meur (20 mai 2026) ; téléservice national annoncé au 4e trimestre 2026, c'est la mairie qui gère en attendant. Amende jusqu'à 10 000 €.",
      "Résidence principale : 120 nuits par an au plus, 90 si la commune l'a voté. Dépassement : jusqu'à 15 000 € d'amende.",
      "Résidence secondaire ou logement dédié : autorisation de changement d'usage quand la commune l'impose ; sans elle, jusqu'à 100 000 € d'amende.",
      "DPE des meublés de tourisme : classe F au moins depuis 2025 puis E en 2028 pour les nouveaux logements soumis à changement d'usage, A à D pour tous en 2034.",
      "Copropriété : le règlement peut interdire la location de courte durée à la majorité des deux tiers.",
    ],
  },
  {
    key: 'police', label: 'Fiche de police',
    words: ['fiche de police', 'fiches de police', 'fiche police', 'voyageurs etrangers', 'voyageur etranger', 'clients etrangers', 'siba', 'passeport'],
    slugHints: ['fiche-police', 'police'],
    service: { url: '/services/declarations-voyageurs', title: 'Fiche de police préparée par l\'app' },
    facts: [
      "Fiche de police : obligatoire pour chaque voyageur étranger hébergé (CESEDA, articles R814-1 à R814-3), à conserver 6 mois.",
      "Au Portugal, les voyageurs étrangers se déclarent sur le SIBA.",
    ],
  },
  {
    key: 'contrat', label: 'Contrat et caution',
    words: ['contrat', 'caution', 'depot de garantie', 'acompte', 'arrhes', 'empreinte bancaire', 'annulation', 'rembourse'],
    slugHints: ['contrat', 'caution', 'annulation', 'arrhes', 'securiser-paiement'],
    service: { url: '/services/contrats', title: 'Contrats signés en ligne, loyer et caution' },
    facts: [
      "Location directe : contrat écrit avec le prix et un état descriptif des lieux (Code du tourisme, art. L324-2).",
      "Sans précision dans le contrat, les sommes versées à la réservation sont des arrhes (Code de la consommation, art. L214-1) : le voyageur qui annule les perd, l'hôte qui annule rend le double.",
      "Pas de droit de rétractation pour une location de vacances (Code de la consommation, art. L221-28).",
      "Caution par carte : un blocage ne tient qu'environ 7 jours ; pour un long séjour, la bloquer peu avant l'arrivée ou demander un virement.",
    ],
  },
  {
    key: 'menage', label: 'Ménage',
    words: ['menage', 'femme de menage', 'aide menagere', 'nettoyage', 'linge', 'draps', 'blanchisserie', 'turnover', 'conciergerie', 'concierge', 'check out', 'checkout', 'prestataire'],
    slugHints: ['menage', 'conciergerie', 'linge', 'turnover'],
    service: { url: '/services/planning-menage', title: 'Planning ménage calculé depuis Airbnb et Booking' },
    facts: [
      "L'app de Jason calcule le planning des ménages d'après les réservations Airbnb, Booking et directes, et l'envoie à l'équipe par un lien d'agenda (gratuit).",
    ],
  },
  {
    key: 'photo', label: 'Photos',
    words: ['photographe', 'photos', 'photo ', 'shooting', 'reportage photo'],
    slugHints: ['photo'],
    service: { url: '/annuaires/photographes', title: 'Annuaire des photographes spécialisés location courte durée' },
    facts: [],
  },
  {
    key: 'direct', label: 'Réservation directe',
    words: ['reservation directe', 'reservations directes', 'sans commission', 'site internet', 'mon propre site', 'fiche google', 'google my business', 'google business', 'instagram', 'fideliser', 'clients fideles'],
    weak: ['en direct'],
    slugHints: ['reservation-directe', 'direct', 'google', 'site-reservation'],
    service: { url: '/services/annonce-directe', title: 'Réservation directe, zéro commission' },
    facts: [
      "Airbnb interdit de proposer une réservation hors plateforme dans sa messagerie.",
    ],
  },
  {
    key: 'plateformes', label: 'Frais des plateformes',
    words: ['commission', 'frais airbnb', 'frais d hote', 'frais de service', '15 5', '15 5 %'],
    slugHints: ['commission', 'airbnb-vs-booking', 'frais'],
    facts: [AIRBNB_FEES],
  },
  {
    key: 'prix', label: 'Prix et remplissage',
    words: ['prix', 'tarif', 'taux d occupation', 'occupation', 'remplir', 'basse saison', 'pas de reservation', 'aucune reservation', 'peu de reservation', 'rentab', 'revenu', 'chiffre d affaires', 'pricelabs', 'prix dynamique', 'calendrier vide'],
    slugHints: ['prix', 'tarif', 'basse-saison', 'occupation', 'revenu'],
    service: { url: '/calculateurs/revenus-lcd', title: 'Estimateur de revenus en location courte durée' },
    facts: [AIRBNB_FEES],
  },
  {
    key: 'avis', label: 'Avis et messages',
    words: ['mauvais avis', 'avis negatif', 'avis voyageur', 'avis 5', 'obtenir des avis', 'laisser un avis', 'repondre a un avis', 'commentaire negatif', 'mauvais commentaire', 'messages automatiques', 'message de bienvenue', 'modele de message', 'livret d accueil', 'check in', 'arrivee autonome', 'boite a cle'],
    slugHints: ['avis', 'message', 'livret', 'check-in'],
    service: { url: '/services/gabarits-messages', title: 'Modèles de messages voyageurs' },
    facts: [],
  },
  {
    key: 'securite', label: 'Voyageur à problème',
    words: ['arnaque', 'escroqu', 'fraude', 'suspect', 'degat', 'casse', 'fete', 'squat', 'plainte', 'litige', 'mauvais voyageur', 'voyageur problematique', 'impaye'],
    slugHints: ['arnaque', 'voyageurs-difficiles', 'degat', 'securiser', 'verification-voyageurs', 'reclamation'],
    service: { url: '/services/securite', title: 'Vérification des voyageurs signalés par les hôtes' },
    facts: [
      "Arnaques souvent signalées par les hôtes : faux messages imitant Airbnb ou Booking, demande de remboursement d'un « trop-perçu », réservation directe sans contrat.",
      "Airbnb interdit de proposer une réservation hors plateforme dans sa messagerie.",
    ],
  },
  {
    key: 'calendrier', label: 'Calendrier et synchronisation',
    words: ['ical', 'synchronis', 'double reservation', 'calendrier', 'channel manager', 'overbooking', 'surbooking'],
    slugHints: ['ical', 'synchronisation', 'calendrier', 'channel'],
    service: { url: '/services/calendrier', title: 'Calendrier qui réunit Airbnb, Booking et Vrbo' },
    facts: [
      "Les calendriers iCal d'Airbnb et de Booking ne se synchronisent pas en temps réel : il y a un délai, d'où le risque de double réservation sur deux réservations très rapprochées.",
    ],
  },
  {
    key: 'investir', label: 'Investissement',
    words: ['investir', 'investissement', 'acheter un', 'achat d un', 'projet d achat', 'emprunt', 'rendement'],
    slugHints: ['acheter', 'rentabilite', 'point-mort', 'investir'],
    service: { url: '/calculateurs/revenus-lcd', title: 'Estimateur de revenus en location courte durée' },
    facts: [],
  },
]
export const TOPIC_LABEL = Object.fromEntries(TOPICS.map(t => [t.key, t.label])) as Record<TopicKey, string>
const topicDef = (k: TopicKey) => TOPICS.find(t => t.key === k)!

const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
/** Minuscules, sans accents, mots séparés par un espace, bordé d'espaces */
export const normText = (s: string) => ` ${strip(s.toLowerCase()).replace(/[’']/g, ' ').replace(/[^a-z0-9%€]+/g, ' ').trim()} `
const has = (n: string, w: string) => n.includes(` ${w.trim()}`)

// Noms de villes qui sont aussi des mots courants : il faut une majuscule
const AMBIGUOUS = new Set(['tours', 'nice', 'vannes', 'cannes', 'nancy', 'pau', 'paris', 'menton', 'rennes', 'sete', 'bayonne', 'dijon'])

/** Ville d'une de nos 62 pages citée dans le texte (la plus longue l'emporte) */
export function findCity(text: string): string | null {
  const plain = strip(text)
  const lower = plain.toLowerCase()
  const hits: string[] = []
  for (const slug of CITY_PAGE_SLUGS) {
    const label = strip(cityLabel(slug))
    const parts = label.split(/[\s'’-]+/).map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const body = parts.join("[\\s'’-]+")
    const re = new RegExp(`(^|[^A-Za-z])${body}($|[^A-Za-z])`, AMBIGUOUS.has(slug) ? '' : 'i')
    // Article minuscule accepté (« le Mans », « la Rochelle »)
    const reLower = /^(Le|La|Les)\s/.test(label) ? new RegExp(`(^|[^A-Za-z])${body.replace(/^(Le|La|Les)/, m => `[${m[0]}${m[0].toLowerCase()}]${m.slice(1)}`)}($|[^A-Za-z])`) : null
    if (re.test(plain) || (reLower && reLower.test(plain)) || (AMBIGUOUS.has(slug) && new RegExp(`(^|[^A-Z])${label.toUpperCase()}($|[^A-Z])`).test(plain))) hits.push(slug)
  }
  // « Sables d'Olonne » sans « Les »
  if (!hits.length && /sables[\s'’-]+d[\s'’-]*olonne/.test(lower)) hits.push('les-sables-d-olonne')
  return hits.sort((a, b) => b.length - a.length)[0] ?? null
}

const PROFILE_WORDS: Record<GroupProfile, string[]> = {
  voyageur: ['je cherche un logement', 'cherche une location', 'cherche un appartement', 'cherche une maison', 'cherchons', 'recherche une location', 'recherche un logement', 'nous sommes', 'pour 2 personnes', 'pour 4 personnes', 'pour 6 personnes', 'vacances en famille', 'dispo du', 'disponible du', 'disponibilite du'],
  pro: ['je suis photographe', 'photographe professionnel', 'je propose', 'nous proposons', 'je propose mes services', 'mes services', 'devis gratuit', 'je recherche des clients', 'recherche des clients', 'notre conciergerie', 'ma conciergerie', 'je suis concierge', 'je suis femme de menage', 'disponible pour vos menages', 'auto entrepreneur', 'micro entrepreneur'],
  investisseur: ['investir', 'investissement', 'acheter un', 'achat d un', 'projet d achat', 'je compte acheter', 'rentabilite d un', 'emprunt'],
  hote: ['mon logement', 'mes logements', 'mon appartement', 'ma maison', 'mon gite', 'mes voyageurs', 'mes locataires', 'ma location', 'mon annonce', 'mes annonces', 'hote', 'proprietaire', 'superhost', 'mes reservations', 'mes clients'],
}

export interface GroupReading {
  profile: GroupProfile
  profileSure: boolean
  topics: TopicKey[]
  city: string | null
  /** Cherche un prestataire (ménage, photo) */
  seeksPro: boolean
  /** « nette » : sujet et contexte clairs ; sinon « à vérifier » */
  clear: boolean
  vague: boolean
  usesVous: boolean
}

export function readMessage(text: string): GroupReading {
  const n = normText(text)
  const scores = (Object.keys(PROFILE_WORDS) as GroupProfile[]).map(p => ({ p, s: PROFILE_WORDS[p].filter(w => has(n, w)).length }))
  scores.sort((a, b) => b.s - a.s)
  // Hôte par défaut : ces groupes sont des groupes d'hôtes
  const profile = scores[0].s > 0 ? scores[0].p : 'hote'
  const profileSure = scores[0].s === 0 || scores[0].s > scores[1].s

  const topics = TOPICS
    .map(t => {
      const hit = t.words.map(w => w.trim()).filter(w => has(n, w))
      const weak = (t.weak ?? []).filter(w => has(n, w))
      // « femme de menage » et « menage » ne comptent qu'une fois
      const distinct = hit.filter(w => !hit.some(o => o !== w && o.includes(w)))
      const first = Math.min(...[...hit, ...weak].map(w => n.indexOf(` ${w}`)))
      return { k: t.key, s: distinct.length + weak.length / 2, first }
    })
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s || a.first - b.first)
    .map(x => x.k)
    .slice(0, 3)
  const city = findCity(text)
  const seeksPro = profile === 'hote' && (topics.includes('menage') || topics.includes('photo'))
    && ['cherche', 'recherche', 'quelqu un', 'conseil', 'recommand', 'connaissez', 'connait', 'besoin d', 'qui peut'].some(w => has(n, w))
  const isQuestion = text.includes('?') || ['comment', 'combien', 'quel', 'quelle', 'est ce', 'savez vous', 'sais tu', 'besoin', 'conseil', 'aide'].some(w => has(n, w))
  const vague = topics.length === 0 && !city
  // « vous » s'adresse souvent à tout le groupe : seul un message formel appelle le vouvoiement
  const usesVous = /cordialement|je vous remercie|bien à vous|madame|monsieur/i.test(text)
  return { profile, profileSure, topics, city, seeksPro, clear: topics.length > 0 && (isQuestion || !!city) && (profileSure || profile === 'hote'), vague, usesVous }
}

// ── Ressources ──

/** « de Lyon », « d'Annecy », « du Mans », « des Sables-d'Olonne » */
export const deCity = (label: string) => /^Les\s/.test(label) ? `des ${label.slice(4)}` : /^Le\s/.test(label) ? `du ${label.slice(3)}` : /^[AEIOUYÉÈÂÎH]/i.test(strip(label)) ? `d'${label}` : `de ${label}`

export interface CatalogArticle { slug: string; title: string; description: string; categorySlug?: string }
export interface CatalogPro { kind: 'photographe' | 'menage'; slug: string; name: string; city: string | null }
export interface GroupResource {
  kind: 'guide' | 'service' | 'article' | 'pro' | 'annuaire'
  title: string
  /** Adresse sans suivi (chemin du site, ou adresse complète) */
  url: string
  why: string
  quality: 'bonne' | 'possible'
}
export interface GroupOverrides {
  profile?: GroupProfile
  city?: string | null
  topics?: TopicKey[]
  group?: string
}

const STOP = new Set(['avec', 'pour', 'dans', 'mais', 'sont', 'nous', 'vous', 'elle', 'elles', 'ils', 'leur', 'leurs', 'cette', 'votre', 'notre', 'plus', 'tout', 'tous', 'toutes', 'bien', 'fait', 'faire', 'avoir', 'etre', 'comme', 'quand', 'quel', 'quelle', 'quels', 'est', 'une', 'des', 'les', 'qui', 'que', 'quoi', 'sur', 'par', 'pas', 'aux', 'ces', 'ses', 'mes', 'tes', 'mon', 'ton', 'son', 'merci', 'bonjour', 'svp', 'location', 'courte', 'duree', 'airbnb', 'logement', 'hote', 'hotes', 'lcd', 'aussi', 'encore', 'deja', 'depuis', 'chez', 'apres', 'avant', 'alors', 'donc', 'sans', 'sous', 'entre', 'vers', 'comment', 'savoir', 'besoin', 'question', 'conseil', 'conseils', 'avez', 'peut', 'faut', 'quelqu'])
const tokens = (s: string) => new Set(normText(s).trim().split(' ').filter(w => w.length >= 4 && !STOP.has(w)))

function scoreArticle(a: CatalogArticle, msg: Set<string>, topics: TopicKey[]): number {
  let s = 0
  for (const w of tokens(a.title)) if (msg.has(w)) s += 3
  for (const w of tokens(a.description)) if (msg.has(w)) s += 1
  for (const k of topics) if (topicDef(k).slugHints.some(h => a.slug.includes(h))) s += k === topics[0] ? 5 : 3
  return s
}

/** Ressources rangées de la plus utile à la moins utile (5 au plus) */
export function pickResources(input: {
  text: string; reading: GroupReading; articles: CatalogArticle[]; pros: CatalogPro[]
}): GroupResource[] {
  const { reading: r } = input
  const out: GroupResource[] = []
  const add = (res: GroupResource) => { if (!out.some(o => o.url === res.url)) out.push(res) }
  const city = r.city
  const label = city ? cityLabel(city) : null
  const hasGuide = !!city

  if (r.profile === 'voyageur') return []

  if (r.profile === 'pro') {
    const metier: 'photographe' | 'menage' = r.topics.includes('photo') ? 'photographe' : 'menage'
    if (city) add({ kind: 'guide', title: metier === 'photographe' ? `Photographe à ${label} : la page où les hôtes cherchent` : `Équipe de ménage à ${label} : la page où les hôtes cherchent`, url: `/${metier === 'photographe' ? 'photographe' : 'menage'}-lcd-${city}`, why: `page ${deCity(label!)}`, quality: 'bonne' })
    add({ kind: 'annuaire', title: metier === 'photographe' ? 'Rejoindre l\'annuaire des photographes' : 'Rejoindre l\'annuaire des équipes de ménage', url: metier === 'photographe' ? '/devenir-photographe-lcd' : '/devenir-prestataire-menage-lcd', why: 'fiche visible des hôtes, sans commission', quality: 'bonne' })
  }

  // Une liste par sujet, puis on alterne : un message à deux questions a un lien pour chacune en tête
  const buckets = new Map<TopicKey, GroupResource[]>(r.topics.map(k => [k, []]))
  const push = (k: TopicKey, res: GroupResource) => buckets.get(k)?.push(res)

  for (const k of r.topics) {
    if (k === 'menage' || k === 'photo') {
      const kind = k === 'photo' ? 'photographe' : 'menage'
      const local = city ? input.pros.filter(p => p.kind === kind && p.city === city) : []
      if (r.profile === 'hote' || r.profile === 'investisseur') {
        for (const p of local.slice(0, 2)) push(k, { kind: 'pro', title: `${p.name}, ${kind === 'photographe' ? 'photographe' : 'ménage'} à ${label}`, url: `/annuaires/${kind === 'photographe' ? 'photographes' : 'menage'}/${p.slug}`, why: `fiche de l'annuaire à ${label}`, quality: 'bonne' })
        if (city) push(k, { kind: 'guide', title: kind === 'photographe' ? `Photographe à ${label}` : `Équipe de ménage à ${label}`, url: `/${kind === 'photographe' ? 'photographe' : 'menage'}-lcd-${city}`, why: `page ${deCity(label!)}`, quality: local.length ? 'possible' : 'bonne' })
        else if (r.seeksPro) push(k, { kind: 'annuaire', title: kind === 'photographe' ? 'Annuaire des photographes' : 'Annuaire des équipes de ménage', url: kind === 'photographe' ? '/annuaires/photographes' : '/annuaires/menage', why: 'toute la France', quality: 'possible' })
      }
    }
    // Guide de la ville pour les règles locales
    if (hasGuide && (k === 'taxe' || k === 'reglementation' || k === 'fiscal')) {
      push(k, { kind: 'guide', title: `Guide pour louer à ${label} : règles, taxe de séjour, fiscalité`, url: `/devenir-hote-airbnb-${city}`, why: `règles ${deCity(label!)}`, quality: 'bonne' })
    }
  }

  // Articles du blog, rangés sous le sujet qu'ils traitent
  const msg = tokens(input.text)
  const scored = input.articles
    .map(a => ({ a, s: scoreArticle(a, msg, r.topics) }))
    .filter(x => x.s >= 5)
    .sort((x, y) => y.s - x.s)
    .slice(0, 2)
  for (const { a, s } of scored) {
    const k = r.topics.find(t => topicDef(t).slugHints.some(h => a.slug.includes(h))) ?? r.topics[0]
    const res: GroupResource = { kind: 'article', title: a.title, url: `/blog/${a.slug}`, why: 'article du blog', quality: s >= 9 ? 'bonne' : 'possible' }
    if (k) push(k, res); else add(res)
  }

  // Outil ou page service de chaque sujet
  for (const k of r.topics.slice(0, 2)) {
    const svc = topicDef(k).service
    if (!svc) continue
    const url = (k === 'prix' || k === 'investir') && label ? `${svc.url}?ville=${encodeURIComponent(label)}` : svc.url
    push(k, { kind: 'service', title: svc.title, url, why: k === 'prix' && label ? `estimation à ${label}` : TOPIC_LABEL[k].toLowerCase(), quality: k === r.topics[0] ? 'bonne' : 'possible' })
  }

  const lists = [...buckets.values()]
  for (let i = 0; lists.some(l => l[i]); i++) for (const l of lists) if (l[i]) add(l[i])
  return out.slice(0, 5)
}

/** Lien de fin : ce que la personne peut faire ensuite */
export function finalLink(profile: GroupProfile, topics: TopicKey[]): { url: string; instruction: string; label: string } {
  if (profile === 'voyageur') return { url: DRIING_URL, label: 'le site de Driing', instruction: 'le site de Driing, la plateforme sans commission que Jason a cofondée (le voyageur y réserve en direct avec le propriétaire)' }
  if (profile === 'pro') {
    return topics.includes('photo')
      ? { url: '/devenir-photographe-lcd', label: 'rejoindre l\'annuaire des photographes', instruction: 'la page pour rejoindre l\'annuaire des photographes (fiche vue par les hôtes de sa ville, sans commission)' }
      : { url: '/devenir-prestataire-menage-lcd', label: 'rejoindre l\'annuaire des équipes de ménage', instruction: 'la page pour rejoindre l\'annuaire des équipes de ménage (fiche vue par les hôtes de sa ville, sans commission)' }
  }
  if (profile === 'investisseur') return { url: '/calculateurs/revenus-lcd', label: 'l\'estimateur de revenus', instruction: 'l\'estimateur de revenus, pour chiffrer le projet avant d\'acheter' }
  return { url: REGISTER_URL, label: 'l\'app gratuite pour commencer', instruction: 'l\'app gratuite pour commencer (contrats signés en ligne, planning ménage calculé depuis Airbnb et Booking, fiches de police), seulement si elle règle son problème' }
}

/** Ajoute le suivi : utm_source=facebook, utm_medium=groupe, utm_campaign=<code> */
export function trackUrl(url: string, code: string): string {
  if (url.startsWith(DRIING_URL)) return url
  const abs = url.startsWith('http') ? url : `${SITE}${url}`
  const u = new URL(abs)
  u.searchParams.set('utm_source', 'facebook')
  u.searchParams.set('utm_medium', 'groupe')
  u.searchParams.set('utm_campaign', code)
  return u.toString()
}

/** Code court d'un message préparé (« g » + 6 caractères) */
export function makeGroupCode(rand: () => number = Math.random): string {
  const a = 'abcdefghijkmnpqrstuvwxyz23456789'
  let s = 'g'
  for (let i = 0; i < 6; i++) s += a[Math.floor(rand() * a.length)]
  return s
}

export function applyOverrides(r: GroupReading, o: GroupOverrides): GroupReading {
  return {
    ...r,
    profile: o.profile ?? r.profile,
    profileSure: o.profile ? true : r.profileSure,
    city: o.city !== undefined ? o.city : r.city,
    topics: o.topics ? o.topics.filter(k => TOPICS.some(t => t.key === k)).slice(0, 3) : r.topics,
    vague: (o.topics ? o.topics.length === 0 : r.topics.length === 0) && !(o.city !== undefined ? o.city : r.city),
  }
}

// ── Prompt ──

const PROFILE_PHRASE: Record<GroupProfile, string> = {
  hote: 'par un hôte de location courte durée',
  pro: 'par un professionnel (ménage, conciergerie ou photo) qui cherche des clients',
  investisseur: 'par quelqu\'un qui prépare un investissement en location courte durée',
  voyageur: 'par un voyageur qui cherche un logement',
}

export function buildPrompt(input: {
  message: string; author: string | null; reading: GroupReading; resources: GroupResource[]; code: string; group?: string
  short?: boolean
}): string {
  const { reading: r, code } = input
  const end = finalLink(r.profile, r.topics)
  const idf = !r.city || r.city === 'paris' || r.city === 'versailles'
  const facts = [...new Set(r.topics.flatMap(k => topicDef(k).facts))].filter(f => idf || !f.startsWith('Île-de-France'))
  const links = input.resources.map(x => `- ${x.title} (${x.why}) : ${trackUrl(x.url, code)}`)
  const ask = [
    r.topics.length ? `sujets ${r.topics.map(k => TOPIC_LABEL[k].toLowerCase()).join(', ')}` : 'sujet non précisé',
    r.city ? `ville ${cityLabel(r.city)}` : 'ville non précisée',
    r.seeksPro ? 'cherche un prestataire' : null,
  ].filter(Boolean).join(' · ')

  const data = [
    `QUI ÉCRIT : ${PROFILE_LABEL[r.profile].toLowerCase()}${input.author ? ` (prénom : ${input.author})` : ''}${r.profileSure ? '' : ' (lecture incertaine : vérifie en lisant le message)'}`,
    `CE QU'IL DEMANDE : ${ask}`,
    `REGISTRE : ${r.usesVous ? 'il vouvoie, vouvoie-le' : 'tutoiement'}`,
    `GROUPE OÙ IL A ÉCRIT : ${input.group?.trim() || 'non précisé'}`,
    '',
    'FAITS VÉRIFIÉS (octobre 2026), à utiliser seulement s\'ils répondent à sa question :',
    ...(facts.length ? facts.map(f => `- ${f}`) : ['- Aucun pour ce sujet : n\'avance aucun chiffre ni aucune règle.']),
    '',
    'LIENS À PROPOSER, du plus utile au moins utile :',
    ...(links.length ? links : ['- Aucun : réponds sans lien, ou avec le seul lien de fin s\'il sert.']),
    '',
    `LIEN DE FIN (facultatif) : ${end.instruction} : ${trackUrl(end.url, code)}`,
    '',
    'MESSAGE :',
    input.message.trim(),
  ]
  if (input.short) return [...data, '', 'Écris la réponse avec les mêmes règles que la précédente, et rien d\'autre.'].join('\n')

  return [
    `Tu écris, à la place de Jason Marinho, un commentaire en réponse à un message publié dans un groupe Facebook ${PROFILE_PHRASE[r.profile]}.`,
    '',
    'JASON MARINHO, en deux mots : il accompagne les hôtes de location courte durée en France (articles, formations, guides par ville, simulateurs) et propose une app gratuite pour commencer, pour le quotidien d\'une location : contrats signés en ligne, planning ménage calculé depuis Airbnb et Booking, fiches de police. Il tient aussi des annuaires de photographes et d\'équipes de ménage spécialisés, et il a cofondé Driing, une plateforme de location de vacances sans commission.',
    '',
    'CE QUI COMPTE PLUS QUE TOUT : ce commentaire sera lu par les membres du groupe et par ses administrateurs. Un message qui sent la publicité se fait supprimer, et bannir. Écris comme un hôte expérimenté qui rend service : la réponse doit être utile même si personne ne clique.',
    '',
    'RÈGLES',
    '- Tutoiement, comme c\'est l\'usage dans les groupes d\'hôtes, sauf si la personne vouvoie : vouvoie-la alors. Chaleureux, court : six lignes maximum, liens compris.',
    '- Commence par répondre à SA question, concrètement, en une à trois phrases. Reprends ses mots (sa ville, son cas) pour montrer que le message a été lu.',
    '- LES FAITS : n\'avance aucun chiffre, aucun seuil, aucune règle légale qui ne figure pas dans « FAITS VÉRIFIÉS ». S\'il faut une précision que tu n\'as pas (le tarif voté par sa commune, son cas fiscal exact), dis-le simplement et renvoie vers le lien, la mairie, les impôts ou un comptable. Une réponse prudente vaut mieux qu\'une erreur.',
    '- Cite UNIQUEMENT les liens fournis, tels quels. DEUX LIENS AU PLUS, pris en tête de liste (ils sont rangés du plus utile au moins utile), sauf si l\'un ne répond pas à sa question : prends alors le suivant. Un commentaire chargé de liens passe pour de la pub.',
    '- CHAQUE LIEN EST PRÉSENTÉ POUR CE QU\'IL EST : un article (« j\'ai écrit un article qui détaille… »), un guide de ville, un simulateur, la fiche d\'un pro de l\'annuaire. Ne promets rien que la page ne tient pas.',
    '- LE LIEN DE FIN est facultatif : donne-le seulement s\'il sert vraiment, en dernière ligne. Sinon, arrête-toi avant. Jamais plus de trois liens en tout.',
    '- QUAND IL CHERCHE UN PRESTATAIRE (ménage, photo) : cite les fiches fournies avec leur ville ; ne garantis ni disponibilité ni prix. S\'il n\'y en a pas, renvoie vers la page de l\'annuaire fournie.',
    '- SI LE MESSAGE EST VAGUE : n\'invente aucun détail et ne pose pas trois questions. Une réponse utile en deux lignes, un lien au plus.',
    '- Driing ne se cite que si la question porte sur les réservations directes ou les commissions des plateformes, en disant que Jason l\'a cofondée.',
    '- LES LIENS SE COLLENT TELS QUELS, avec tout ce qu\'ils portent après le « ? » : c\'est ce qui permet de savoir que ce commentaire a été utile. Ne les raccourcis pas, ni parenthèses ni guillemets, et aucune ponctuation collée à leur fin : Facebook l\'avalerait dans le lien.',
    '- UN LIEN PAR LIGNE, en fin de ligne : « Le guide de la taxe de séjour à Annecy : https://… ».',
    '- Pas de superlatif, un émoji au plus, pas de tiret long. Ne signe pas, pas de formule finale. Aucun markdown : du texte brut, prêt à coller dans Facebook.',
    '',
    ...data,
    '',
    'Écris maintenant la réponse, et rien d\'autre.',
  ].join('\n')
}

/** Phrase de synthèse en tête de « Ce que l'outil a compris » */
export function readingTitle(r: GroupReading): string {
  if (r.profile === 'voyageur') return 'Message de voyageur : il se traite plutôt dans le CRM Driing'
  if (r.profile === 'pro') return 'Un pro qui cherche des clients'
  if (r.vague) return 'Message vague : réponse courte, un lien au plus'
  const what = r.topics.length ? TOPIC_LABEL[r.topics[0]].toLowerCase() : 'sujet à préciser'
  if (r.seeksPro) {
    const pro = r.topics.find(k => k === 'menage' || k === 'photo') ?? r.topics[0]
    const rest = r.topics.filter(k => k !== pro).map(k => TOPIC_LABEL[k].toLowerCase())
    return `Cherche un prestataire : ${TOPIC_LABEL[pro].toLowerCase()}${r.city ? ` à ${cityLabel(r.city)}` : ''}${rest.length ? `, et ${rest.join(', ')}` : ''}`
  }
  return `${r.profile === 'investisseur' ? 'Projet d\'investissement' : 'Question d\'hôte'} : ${what}${r.city ? ` à ${cityLabel(r.city)}` : ''}`
}

export const ALL_CITIES = CITY_PAGE_SLUGS.map(s => ({ slug: s as string, label: cityLabel(s) })).sort((a, b) => a.label.localeCompare(b.label, 'fr'))
export { slugifyCity }

/** Articles lus dans blog/articles-data.mjs du site (texte, jamais exécuté) */
export function parseArticlesData(src: string): CatalogArticle[] {
  const field = (line: string, name: string) => {
    const m = line.match(new RegExp(`\\b${name}: '((?:[^'\\\\]|\\\\.)*)'`))
    return m ? m[1].replace(/\\(.)/g, '$1') : ''
  }
  const out: CatalogArticle[] = []
  for (const line of src.split('\n')) {
    if (!/^\s*\{\s*slug:/.test(line)) continue
    const slug = field(line, 'slug')
    const title = field(line, 'title')
    if (!/^[a-z0-9-]+$/.test(slug) || !title) continue
    out.push({ slug, title, description: field(line, 'description'), categorySlug: field(line, 'categorySlug') || undefined })
  }
  return out
}
