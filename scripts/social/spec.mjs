// Fichier de publication déposé par la routine (data/social-queue/*.json) :
// vérification, légendes Facebook / Instagram et créneau de publication
// (24/10/2026). Règles pures, testées par jason-app/lib/social/spec.test.ts.

export const FORMATS = ['reel', 'carrousel', 'photo']
export const SLIDE_TYPES = ['couverture', 'point', 'liste', 'chiffre', 'astuce', 'fin']
// Heure de publication : 17 h UTC (18 h à Paris en hiver, 19 h en été)
export const PUBLISH_HOUR_UTC = 17

const EMOJI = /\p{Extended_Pictographic}/u

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
 * Créneau : le prochain 17 h UTC à au moins 2 h d'ici, sur un jour sans autre
 * post programmé (les dates déjà prises sont au format AAAA-MM-JJ).
 */
export function nextSlot(now, takenDays = []) {
  const taken = new Set(takenDays)
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), PUBLISH_HOUR_UTC))
  if (d.getTime() - now.getTime() < 2 * 3600_000) d.setUTCDate(d.getUTCDate() + 1)
  while (taken.has(d.toISOString().slice(0, 10))) d.setUTCDate(d.getUTCDate() + 1)
  return d
}
