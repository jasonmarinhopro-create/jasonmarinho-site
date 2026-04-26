// Catalogue des questions pour l'audit Google Business Profile (GBP)
// spécifique à la location courte durée.
// Ne pas modifier les `id` après mise en production : ils sont stockés en BDD.

export type PillarId = 'identite' | 'photos' | 'avis' | 'posts' | 'qa' | 'attributs'

export interface Pillar {
  id: PillarId
  label: string
  description: string
  weight: number   // Poids dans le score global
  icon: string     // Nom de l'icône Phosphor (ex: 'IdentificationCard')
  color: string    // Couleur d'accent
}

export const PILLARS: Pillar[] = [
  { id: 'identite',  label: 'Identité',   description: 'Nom, catégorie, adresse, description', weight: 1.2, icon: 'IdentificationCard', color: '#60a5fa' },
  { id: 'photos',    label: 'Photos',     description: 'Quantité, qualité, fraîcheur',          weight: 1.5, icon: 'Camera',             color: '#a78bfa' },
  { id: 'avis',      label: 'Avis',       description: 'Volume, note, taux de réponse',         weight: 1.5, icon: 'Star',               color: '#FFD56B' },
  { id: 'posts',     label: 'Posts',      description: 'Fréquence et qualité des publications', weight: 1.0, icon: 'Megaphone',          color: '#34d399' },
  { id: 'qa',        label: 'Q&A',        description: 'Questions/réponses et messagerie',      weight: 0.8, icon: 'ChatCircleDots',     color: '#fb923c' },
  { id: 'attributs', label: 'Attributs',  description: 'Services, équipements, horaires',       weight: 0.8, icon: 'Sparkle',            color: '#f472b6' },
]

export type AnswerValue = string | number | boolean

interface ChoiceOption { value: string; label: string; score: number }

export interface Question {
  id: string
  pillar: PillarId
  label: string
  help?: string
  type: 'choice' | 'boolean' | 'number_bucket'
  weight: number  // Poids relatif au sein du pilier (1-5)
  options?: ChoiceOption[]
  buckets?: { min: number; max: number; score: number; label: string }[]
  maxScore: number  // Score maximum pour cette question
  actionIfMissing: string  // Conseil affiché si réponse non optimale
}

export const QUESTIONS: Question[] = [
  // ─── PILIER 1 : IDENTITÉ ───
  {
    id: 'category_main',
    pillar: 'identite',
    label: 'Quelle est ta catégorie principale sur Google Business Profile ?',
    help: 'Tu la trouves en haut de ta fiche dans la console GBP.',
    type: 'choice',
    weight: 5,
    maxScore: 5,
    options: [
      { value: 'location_vacances', label: 'Location de vacances', score: 5 },
      { value: 'logement_vacances', label: 'Logement de vacances', score: 5 },
      { value: 'maison_campagne',   label: 'Maison de campagne',   score: 4 },
      { value: 'gite',              label: 'Gîte',                 score: 4 },
      { value: 'appart_hotel',      label: 'Appart-hôtel',         score: 3 },
      { value: 'hotel',             label: 'Hôtel',                score: 2 },
      { value: 'autre',             label: 'Autre / je ne sais pas', score: 0 },
    ],
    actionIfMissing: 'Change ta catégorie principale en "Location de vacances" — c\'est le critère le plus fort pour apparaître dans les bonnes recherches voyageurs.',
  },
  {
    id: 'category_secondary_count',
    pillar: 'identite',
    label: 'Combien de catégories secondaires as-tu ajoutées ?',
    type: 'number_bucket',
    weight: 3,
    maxScore: 3,
    buckets: [
      { min: 0, max: 0, score: 0, label: 'Aucune' },
      { min: 1, max: 1, score: 1, label: '1' },
      { min: 2, max: 3, score: 3, label: '2 ou 3' },
      { min: 4, max: 99, score: 3, label: '4 ou plus' },
    ],
    actionIfMissing: 'Ajoute 2 à 3 catégories secondaires pertinentes (Logement de vacances, Gîte, Maison de campagne) pour élargir ta visibilité.',
  },
  {
    id: 'description_filled',
    pillar: 'identite',
    label: 'Ta description fait-elle au moins 500 caractères et inclut-elle 3 mots-clés (ville, type de bien, équipements) ?',
    type: 'boolean',
    weight: 4,
    maxScore: 4,
    actionIfMissing: 'Rédige une description de 500-750 caractères avec ville, type de bien, équipements clés et public cible. C\'est ton seul espace texte libre.',
  },
  {
    id: 'address_complete',
    pillar: 'identite',
    label: 'Ton adresse postale est-elle renseignée et vérifiée ?',
    help: 'Vérifiée = tu as reçu et entré le code de la carte postale Google.',
    type: 'boolean',
    weight: 5,
    maxScore: 5,
    actionIfMissing: 'Vérifie ton adresse via la carte postale Google. Sans ça, ta fiche n\'apparaît pas sur Google Maps.',
  },
  {
    id: 'phone_website',
    pillar: 'identite',
    label: 'As-tu renseigné un numéro de téléphone ET un site web (ou page de réservation directe) ?',
    type: 'boolean',
    weight: 3,
    maxScore: 3,
    actionIfMissing: 'Ajoute un téléphone et un lien web (driing.co, ton site, ou une page de contact). Sans ces deux éléments, le voyageur passe par un concurrent.',
  },

  // ─── PILIER 2 : PHOTOS ───
  {
    id: 'photos_count',
    pillar: 'photos',
    label: 'Combien de photos as-tu publiées au total sur ta fiche ?',
    type: 'number_bucket',
    weight: 5,
    maxScore: 5,
    buckets: [
      { min: 0,  max: 9,   score: 0, label: 'Moins de 10' },
      { min: 10, max: 19,  score: 2, label: '10 à 19' },
      { min: 20, max: 39,  score: 4, label: '20 à 39' },
      { min: 40, max: 999, score: 5, label: '40 ou plus' },
    ],
    actionIfMissing: 'Vise 40+ photos : 1 par pièce, plusieurs angles du salon, vue extérieure, environnement (plage, commerces, sites touristiques à 5 min).',
  },
  {
    id: 'cover_photo',
    pillar: 'photos',
    label: 'As-tu défini une photo de couverture grand-angle qui montre l\'ambiance du logement ?',
    type: 'boolean',
    weight: 3,
    maxScore: 3,
    actionIfMissing: 'Choisis une photo de couverture lumineuse, prise au grand-angle (idéalement le salon ou la vue extérieure). C\'est la première chose que le voyageur voit.',
  },
  {
    id: 'logo_present',
    pillar: 'photos',
    label: 'As-tu ajouté un logo carré (ou photo de profil reconnaissable) ?',
    type: 'boolean',
    weight: 2,
    maxScore: 2,
    actionIfMissing: 'Ajoute un logo carré (256×256px min) — soit ton logo si tu en as un, soit une photo représentative cohérente avec ton branding.',
  },
  {
    id: 'photos_freshness',
    pillar: 'photos',
    label: 'Quand as-tu publié ta dernière photo ?',
    type: 'choice',
    weight: 4,
    maxScore: 4,
    options: [
      { value: 'less_30',  label: 'Il y a moins de 30 jours',         score: 4 },
      { value: '30_90',    label: 'Il y a 30 à 90 jours',             score: 2 },
      { value: 'over_90',  label: 'Il y a plus de 3 mois',            score: 1 },
      { value: 'never',    label: 'Jamais ou je ne sais pas',         score: 0 },
    ],
    actionIfMissing: 'Publie au moins 1 nouvelle photo par mois — Google booste les fiches actives. Profite des saisons pour varier (jardin l\'été, feu de cheminée l\'hiver).',
  },
  {
    id: 'photos_renamed',
    pillar: 'photos',
    label: 'Tes fichiers photos sont-ils renommés avec des mots-clés avant import (ex: "location-vacances-cassis-piscine.jpg") ?',
    type: 'boolean',
    weight: 2,
    maxScore: 2,
    actionIfMissing: 'Renomme tes fichiers avant import : "type-bien-ville-feature.jpg". Google lit ces noms et ça aide au référencement.',
  },

  // ─── PILIER 3 : AVIS ───
  {
    id: 'reviews_count',
    pillar: 'avis',
    label: 'Combien d\'avis as-tu sur ta fiche Google ?',
    type: 'number_bucket',
    weight: 5,
    maxScore: 5,
    buckets: [
      { min: 0,   max: 4,    score: 0, label: '0 à 4' },
      { min: 5,   max: 9,    score: 2, label: '5 à 9' },
      { min: 10,  max: 24,   score: 4, label: '10 à 24' },
      { min: 25,  max: 9999, score: 5, label: '25 ou plus' },
    ],
    actionIfMissing: 'Vise au minimum 10 avis pour passer le seuil "fiche crédible". Mets en place un QR code dans le livret d\'accueil + un email post-séjour automatique.',
  },
  {
    id: 'reviews_average',
    pillar: 'avis',
    label: 'Quelle est ta note moyenne ?',
    type: 'choice',
    weight: 4,
    maxScore: 4,
    options: [
      { value: 'over_47',  label: '4,7 ou plus',         score: 4 },
      { value: '45_47',    label: 'Entre 4,5 et 4,7',    score: 3 },
      { value: '40_45',    label: 'Entre 4,0 et 4,5',    score: 2 },
      { value: 'under_40', label: 'Moins de 4,0',        score: 0 },
    ],
    actionIfMissing: 'Vise une note > 4,7. Concentre-toi sur les fondamentaux (propreté, communication, équipements promis) et n\'hésite pas à demander à modifier les avis injustes.',
  },
  {
    id: 'reviews_response_rate',
    pillar: 'avis',
    label: 'Réponds-tu aux avis (positifs ET négatifs) ?',
    type: 'choice',
    weight: 5,
    maxScore: 5,
    options: [
      { value: 'all',     label: 'Oui, à 100% des avis',          score: 5 },
      { value: 'most',    label: 'Aux principaux uniquement',     score: 3 },
      { value: 'negative',label: 'Seulement aux avis négatifs',   score: 2 },
      { value: 'none',    label: 'Non, je ne réponds pas',        score: 0 },
    ],
    actionIfMissing: 'Réponds à 100% des avis. Google mesure ce taux et le prend en compte dans le classement. Réponse personnalisée pour chaque, pas de copier-coller.',
  },
  {
    id: 'reviews_recency',
    pillar: 'avis',
    label: 'Combien d\'avis as-tu reçus dans les 90 derniers jours ?',
    type: 'number_bucket',
    weight: 3,
    maxScore: 3,
    buckets: [
      { min: 0, max: 0, score: 0, label: 'Aucun' },
      { min: 1, max: 2, score: 1, label: '1 ou 2' },
      { min: 3, max: 5, score: 2, label: '3 à 5' },
      { min: 6, max: 99,score: 3, label: '6 ou plus' },
    ],
    actionIfMissing: 'Sollicite systématiquement un avis Google après chaque séjour réussi. Un email post-séjour avec un lien direct convertit 25-40% des voyageurs satisfaits.',
  },

  // ─── PILIER 4 : POSTS ───
  {
    id: 'posts_frequency',
    pillar: 'posts',
    label: 'À quelle fréquence publies-tu des posts Google (mises à jour, événements, offres) ?',
    type: 'choice',
    weight: 4,
    maxScore: 4,
    options: [
      { value: 'weekly',   label: 'Au moins 1 fois par semaine',  score: 4 },
      { value: 'monthly',  label: 'Au moins 1 fois par mois',     score: 3 },
      { value: 'occasion', label: 'Occasionnellement',            score: 1 },
      { value: 'never',    label: 'Jamais',                       score: 0 },
    ],
    actionIfMissing: 'Publie 1 post/semaine. Idées LCD : disponibilités du mois, événement local, nouveau équipement, recette de saison, conseil voyageur.',
  },
  {
    id: 'posts_with_cta',
    pillar: 'posts',
    label: 'Tes posts contiennent-ils un appel à l\'action (bouton "Réserver", "En savoir plus") ?',
    type: 'boolean',
    weight: 3,
    maxScore: 3,
    actionIfMissing: 'Ajoute un CTA à chaque post. Le bouton "Réserver" ou "En savoir plus" pointe vers ta réservation directe (driing.co, site propre).',
  },
  {
    id: 'posts_recent',
    pillar: 'posts',
    label: 'Ton dernier post date-t-il de moins de 30 jours ?',
    type: 'boolean',
    weight: 3,
    maxScore: 3,
    actionIfMissing: 'Les posts expirent visuellement après 7 jours. Programme un rappel mensuel pour publier — sinon ta fiche paraît inactive.',
  },

  // ─── PILIER 5 : Q&A ───
  {
    id: 'qa_preanswered',
    pillar: 'qa',
    label: 'As-tu pré-rempli des questions/réponses fréquentes (animaux, parking, check-in, plage) ?',
    type: 'choice',
    weight: 4,
    maxScore: 4,
    options: [
      { value: 'over_5',  label: 'Oui, 5 ou plus',         score: 4 },
      { value: '3_5',     label: '3 à 5 questions',        score: 3 },
      { value: '1_2',     label: '1 ou 2 questions',       score: 1 },
      { value: 'none',    label: 'Aucune',                 score: 0 },
    ],
    actionIfMissing: 'Pose-toi 5-10 questions à toi-même (depuis un autre compte Google) et réponds-y. C\'est 100% légal et ça enrichit massivement ta fiche.',
  },
  {
    id: 'messaging_active',
    pillar: 'qa',
    label: 'La messagerie GBP est-elle activée et tu réponds en moins de 24h ?',
    type: 'choice',
    weight: 4,
    maxScore: 4,
    options: [
      { value: 'fast',    label: 'Activée + réponse < 24h',     score: 4 },
      { value: 'slow',    label: 'Activée mais réponse > 24h',  score: 2 },
      { value: 'inactive',label: 'Activée mais je ne regarde pas', score: 1 },
      { value: 'off',     label: 'Désactivée',                  score: 0 },
    ],
    actionIfMissing: 'Active la messagerie et configure les notifs sur ton téléphone. Google pénalise les fiches qui ne répondent pas en moins de 24h — ou désactive complètement si tu ne peux pas suivre.',
  },

  // ─── PILIER 6 : ATTRIBUTS ───
  {
    id: 'attributes_filled',
    pillar: 'attributs',
    label: 'As-tu coché tous les attributs pertinents (Wi-Fi, parking, animaux, climatisation, accessibilité) ?',
    type: 'choice',
    weight: 4,
    maxScore: 4,
    options: [
      { value: 'all',     label: 'Tous (15+)',         score: 4 },
      { value: 'most',    label: 'La plupart (8-14)',  score: 3 },
      { value: 'few',     label: 'Quelques-uns (1-7)', score: 1 },
      { value: 'none',    label: 'Aucun',              score: 0 },
    ],
    actionIfMissing: 'Coche tous les attributs disponibles : ce sont des filtres que les voyageurs utilisent pour trouver ton bien. Plus tu en coches, plus tu apparais dans des recherches précises.',
  },
  {
    id: 'services_listed',
    pillar: 'attributs',
    label: 'As-tu listé tes services (ménage inclus, linge fourni, check-in autonome, accueil personnalisé) ?',
    type: 'boolean',
    weight: 3,
    maxScore: 3,
    actionIfMissing: 'Ajoute la section "Services" : ménage, linge, check-in autonome, accueil. Cela rassure le voyageur et te démarque des autres locations.',
  },
  {
    id: 'opening_hours',
    pillar: 'attributs',
    label: 'Tes horaires d\'ouverture sont-ils définis (idéalement 24/7 pour une LCD) ?',
    type: 'boolean',
    weight: 2,
    maxScore: 2,
    actionIfMissing: 'Définis tes horaires en 24/7 (le logement est disponible en continu) sauf si tu fais de la conciergerie avec accueil physique limité.',
  },
  {
    id: 'languages',
    pillar: 'attributs',
    label: 'As-tu indiqué les langues parlées (français + anglais minimum) ?',
    type: 'boolean',
    weight: 2,
    maxScore: 2,
    actionIfMissing: 'Indique au moins français + anglais dans ta description. Cela rassure les voyageurs internationaux et améliore ton classement sur les recherches étrangères.',
  },
  {
    id: 'booking_link',
    pillar: 'attributs',
    label: 'As-tu ajouté un lien de réservation directe (driing.co, ton site, autre) ?',
    type: 'boolean',
    weight: 4,
    maxScore: 4,
    actionIfMissing: 'Ajoute un lien de réservation directe sur ta fiche : c\'est ce qui transforme une visite Google Maps en réservation sans commission.',
  },
]

// ─── HELPERS DE SCORING ───

export function getQuestionScore(question: Question, value: AnswerValue): number {
  if (question.type === 'boolean') {
    return value === true ? question.maxScore : 0
  }
  if (question.type === 'choice' && question.options) {
    const opt = question.options.find(o => o.value === value)
    return opt ? opt.score : 0
  }
  if (question.type === 'number_bucket' && question.buckets) {
    const num = typeof value === 'number' ? value : parseInt(String(value), 10) || 0
    const bucket = question.buckets.find(b => num >= b.min && num <= b.max)
    return bucket ? bucket.score : 0
  }
  return 0
}

export function isQuestionWeak(question: Question, value: AnswerValue): boolean {
  // Considérée "faible" si score < 60% du max
  const score = getQuestionScore(question, value)
  return score < question.maxScore * 0.6
}

export function computePillarScore(pillarId: PillarId, answers: Record<string, AnswerValue>): { score: number; max: number; pct: number } {
  const pillarQuestions = QUESTIONS.filter(q => q.pillar === pillarId)
  let total = 0
  let max = 0
  for (const q of pillarQuestions) {
    const value = answers[q.id]
    if (value === undefined) continue
    total += getQuestionScore(q, value) * q.weight
    max += q.maxScore * q.weight
  }
  return {
    score: total,
    max,
    pct: max > 0 ? Math.round((total / max) * 100) : 0,
  }
}

export function computeGlobalScore(answers: Record<string, AnswerValue>): { score: number; pillars: Record<PillarId, { pct: number; score: number; max: number }> } {
  const pillars = {} as Record<PillarId, { pct: number; score: number; max: number }>
  let weightedSum = 0
  let weightTotal = 0
  for (const p of PILLARS) {
    const r = computePillarScore(p.id, answers)
    pillars[p.id] = r
    weightedSum += r.pct * p.weight
    weightTotal += p.weight
  }
  return {
    score: weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 0,
    pillars,
  }
}

export function getTopActions(answers: Record<string, AnswerValue>, limit = 5): Array<{ question: Question; impact: number; pillar: Pillar }> {
  const items: Array<{ question: Question; impact: number; pillar: Pillar }> = []
  for (const q of QUESTIONS) {
    const value = answers[q.id]
    if (value === undefined) continue
    const score = getQuestionScore(q, value)
    if (score >= q.maxScore) continue  // déjà au max
    const gap = q.maxScore - score
    const pillar = PILLARS.find(p => p.id === q.pillar)!
    const impact = gap * q.weight * pillar.weight
    items.push({ question: q, impact, pillar })
  }
  items.sort((a, b) => b.impact - a.impact)
  return items.slice(0, limit)
}
