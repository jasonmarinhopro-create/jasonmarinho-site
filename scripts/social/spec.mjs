// Fichier de publication déposé par la routine (data/social-queue/*.json) :
// vérification, légendes Facebook / Instagram et créneau de publication
// (24/10/2026). Règles pures, testées par jason-app/lib/social/spec.test.ts.

export const FORMATS = ['reel', 'carrousel', 'photo']
export const SLIDE_TYPES = ['couverture', 'point', 'liste', 'chiffre', 'astuce', 'question', 'fin']
// Heure de publication : 17 h UTC (18 h à Paris en hiver, 19 h en été)
export const PUBLISH_HOUR_UTC = 17
// Rythme (24/10/2026, bonnes pratiques : 3 à 5 posts par semaine sur
// Instagram, des stories tous les jours) : 4 posts par semaine, lundi,
// mercredi, vendredi et dimanche (getUTCDay), et une série de stories chaque
// jour, à 11 h UTC (midi à Paris en hiver) les jours sans post, avec le post
// à 17 h UTC les jours de post.
export const POST_DAYS = [1, 3, 5, 0]
export const STORY_HOUR_UTC = 11
export const STORY_TYPES = ['chiffre', 'astuce', 'question', 'point', 'liste', 'couverture']

const EMOJI = /\p{Extended_Pictographic}/u

/** Écrans de stories (types de STORY_TYPES, textes courts) */
function checkFrames(frames, max) {
  const errs = []
  if (!Array.isArray(frames) || frames.length < 1 || frames.length > max) return [`1 à ${max} écrans`]
  frames.forEach((f, i) => {
    if (!STORY_TYPES.includes(f?.type)) errs.push(`écran ${i + 1} : type inconnu (${STORY_TYPES.join(', ')})`)
    if (!(f?.titre || f?.valeur || f?.texte)) errs.push(`écran ${i + 1} : texte manquant`)
    if ((f?.titre ?? '').replace(/\*/g, '').length > 90) errs.push(`écran ${i + 1} : titre trop long (90 caractères)`)
    if (f?.type === 'liste' && !(Array.isArray(f.items) && f.items.length >= 2 && f.items.length <= 4)) errs.push(`écran ${i + 1} : une liste a 2 à 4 éléments`)
  })
  return errs
}

/** Série de stories d'un jour sans post (format « stories ») : vide = publiable. */
/** @param {any} spec @param {{ exists?: (p: string) => boolean }} [opts] */
export function checkStories(spec, { exists = (_p) => true } = {}) {
  const errs = []
  if (!spec || typeof spec !== 'object') return ['fichier illisible']
  if (!/^[a-z0-9-]{3,80}$/.test(spec.slug ?? '')) errs.push('slug manquant ou invalide (minuscules, chiffres, tirets)')
  if (spec.jour !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(spec.jour)) errs.push('jour : AAAA-MM-JJ')
  errs.push(...checkFrames(spec.frames, 4))
  const all = JSON.stringify(spec)
  if (all.includes('—')) errs.push('tiret cadratin interdit')
  if (EMOJI.test(all)) errs.push('emoji interdit')
  if (spec.photo && (!/^img\/[\w/.-]+\.(jpg|jpeg|png|webp)$/.test(spec.photo) || !exists(spec.photo))) errs.push('photo introuvable dans img/')
  return errs
}

/**
 * Créneau d'une série de stories : 11 h UTC du jour demandé (ou d'aujourd'hui),
 * à au moins 30 min d'ici, sur un jour sans autre série (dates AAAA-MM-JJ).
 */
/** @param {Date} now @param {string[]} [takenDays] @param {string | null} [jour] */
export function storySlot(now, takenDays = [], jour = null) {
  const taken = new Set(takenDays)
  const base = jour ? new Date(`${jour}T00:00:00Z`) : now
  const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), STORY_HOUR_UTC))
  while (d.getTime() - now.getTime() < 30 * 60_000 || taken.has(d.toISOString().slice(0, 10))) d.setUTCDate(d.getUTCDate() + 1)
  return d
}

/** Liste des problèmes du fichier (vide = publiable). */
/** @param {any} spec @param {{ exists?: (p: string) => boolean }} [opts] */
export function checkSpec(spec, { exists = (_p) => true } = {}) {
  const errs = []
  if (!spec || typeof spec !== 'object') return ['fichier illisible']
  if (!/^[a-z0-9-]{3,80}$/.test(spec.slug ?? '')) errs.push('slug manquant ou invalide (minuscules, chiffres, tirets)')
  if (!FORMATS.includes(spec.format)) errs.push(`format inconnu (${FORMATS.join(', ')})`)
  const slides = Array.isArray(spec.slides) ? spec.slides : []
  if (!slides.length) errs.push('aucune diapositive')
  if (slides[0] && slides[0].type !== 'couverture') errs.push('la première diapositive doit être une couverture')
  if (spec.format === 'carrousel' && (slides.length < 3 || slides.length > 9)) errs.push('carrousel : 3 à 9 diapositives (la fin est ajoutée)')
  if (spec.format === 'reel' && (slides.length < 3 || slides.length > 7)) errs.push('Reel : 3 à 7 scènes (la fin est ajoutée)')
  slides.forEach((s, i) => {
    if (!SLIDE_TYPES.includes(s?.type)) errs.push(`diapositive ${i + 1} : type inconnu`)
    if (s?.type === 'liste' && !(Array.isArray(s.items) && s.items.length >= 2 && s.items.length <= 5)) errs.push(`diapositive ${i + 1} : une liste a 2 à 5 éléments`)
    if (s?.type !== 'fin' && !(s?.titre || s?.valeur || s?.texte)) errs.push(`diapositive ${i + 1} : texte manquant`)
    if ((s?.titre ?? '').replace(/\*/g, '').length > 90) errs.push(`diapositive ${i + 1} : titre trop long (90 caractères)`)
  })
  if (spec.story !== undefined && spec.story !== false && !(spec.story && typeof spec.story === 'object' && (spec.story.texte === undefined || (typeof spec.story.texte === 'string' && spec.story.texte.replace(/\*/g, '').length <= 90)))) errs.push('story : false, ou { "texte": accroche de 90 caractères au plus }')
  if (spec.story && typeof spec.story === 'object' && spec.story.frames !== undefined) errs.push(...checkFrames(spec.story.frames, 3).map(e => `story : ${e}`))
  const legende = String(spec.legende ?? '')
  if (legende.length < 40) errs.push('légende trop courte')
  if (legende.length > 1800) errs.push('légende trop longue (1 800 caractères)')
  const all = JSON.stringify(spec)
  if (all.includes('—')) errs.push('tiret cadratin interdit')
  if (EMOJI.test(all)) errs.push('emoji interdit')
  if (spec.lien && !/^https:\/\/(app\.)?jasonmarinho\.com(\/|$)/.test(spec.lien)) errs.push('le lien doit pointer vers jasonmarinho.com')
  if (spec.photo && (!/^img\/[\w/.-]+\.(jpg|jpeg|png|webp)$/.test(spec.photo) || !exists(spec.photo))) errs.push('photo introuvable dans img/')
  const tags = spec.hashtags ?? []
  if (!Array.isArray(tags) || tags.length > 8 || tags.some(t => !/^#[\p{L}\p{N}_]{2,40}$/u.test(t))) errs.push('hashtags : 8 au plus, de la forme #mot')
  return errs
}

/** Lien du site avec les paramètres de suivi de la campagne. */
export function trackedLink(lien, slug, network) {
  if (!lien) return ''
  const u = new URL(lien)
  u.searchParams.set('utm_source', network)
  u.searchParams.set('utm_medium', 'social')
  u.searchParams.set('utm_campaign', slug)
  return u.toString()
}

/** Légendes : Facebook avec le lien cliquable, Instagram avec « lien en bio ». */
export function captions(spec) {
  const tags = (spec.hashtags ?? []).join(' ')
  const fbBase = String(spec.legende_facebook || spec.legende).trim()
  const igBase = String(spec.legende_instagram || spec.legende).trim()
  const fb = [fbBase, spec.lien ? trackedLink(spec.lien, spec.slug, 'facebook') : '', tags].filter(Boolean).join('\n\n')
  const ig = [igBase, spec.lien ? 'Le lien est dans la bio : jasonmarinho.com' : '', tags].filter(Boolean).join('\n\n')
  return { facebook: fb, instagram: ig }
}

/**
 * Créneau : le prochain 17 h UTC à au moins 2 h d'ici, un jour de post
 * (POST_DAYS), sans autre post programmé (dates déjà prises : AAAA-MM-JJ).
 */
export function nextSlot(now, takenDays = []) {
  const taken = new Set(takenDays)
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), PUBLISH_HOUR_UTC))
  if (d.getTime() - now.getTime() < 2 * 3600_000) d.setUTCDate(d.getUTCDate() + 1)
  while (taken.has(d.toISOString().slice(0, 10)) || !POST_DAYS.includes(d.getUTCDay())) d.setUTCDate(d.getUTCDate() + 1)
  return d
}
