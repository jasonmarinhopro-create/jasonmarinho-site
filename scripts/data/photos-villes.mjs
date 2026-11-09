// Photos des villes (Pexels, licence gratuite : https://www.pexels.com/license/), 09/11/2026.
// Fichier : /img/villes/<slug>.webp (560 x 700). Une ville absente n'a pas encore de photo vérifiée.
export const PHOTOS_VILLES = {
  'aix-en-provence': 31990451,
  'ajaccio': 19466911,
  'annecy': 29406500,
  'antibes': 15009981,
  'arcachon': 9750550,
  'avignon': 30037003,
  'bayonne': 12069411,
  'biarritz': 11843489,
  'bordeaux': 17356595,
  'brest': 8013898,
  'caen': 17276266,
  'cannes': 38606077,
  'carcassonne': 21937147,
  'chamonix': 30052814,
  'clermont-ferrand': 31040756,
  'colmar': 32406265,
  'deauville': 13598487,
  'dijon': 30763567,
  'etretat': 4708637,
  'lille': 12040634,
  'lyon': 5773238,
  'marseille': 15878303,
  'megeve': 19727171,
  'menton': 29942554,
  'montpellier': 7143883,
  'nantes': 29477010,
  'nice': 18071382,
  'nimes': 18688863,
  'paris': 165804,
  'quebec': 14339477,
  'reims': 17444784,
  'rennes': 30504816,
  'rouen': 34803488,
  'saint-malo': 29944728,
  'saint-tropez': 29851528,
  'sarlat': 7929678,
  'strasbourg': 12336578,
  'toulouse': 30753301,
  'vannes': 32574447,
  'versailles': 15546889,
}
export const pexelsUrl = id => `https://www.pexels.com/photo/${id}/`

// Photos Wikimedia Commons (10/11/2026) pour les villes sans photo Pexels :
// licence libre avec attribution, auteur et licence affichés sous la photo.
// Relevées par le workflow « Photos Commons » (scripts/photos-commons.mjs).
export const PHOTOS_COMMONS = {}

/** La ville a-t-elle une photo (Pexels ou Commons) ? */
export const aPhoto = slug => !!(PHOTOS_VILLES[slug] || PHOTOS_COMMONS[slug])

const escC = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
function licenceUrl(l) {
  const m = String(l).match(/^CC (BY(?:-SA)?) ([0-9.]+)/i)
  if (m) return `https://creativecommons.org/licenses/${m[1].toLowerCase()}/${m[2]}/`
  if (/^CC0/i.test(l)) return 'https://creativecommons.org/publicdomain/zero/1.0/'
  return null
}
/** Crédit HTML d'une photo : « Pexels » ou « Auteur, CC BY-SA 4.0, Wikimedia Commons » */
export function creditPhoto(slug) {
  if (PHOTOS_VILLES[slug]) return `<a href="https://www.pexels.com/photo/${PHOTOS_VILLES[slug]}/" target="_blank" rel="noopener">Pexels</a>`
  const c = PHOTOS_COMMONS[slug]
  if (!c) return ''
  const lu = licenceUrl(c.licence)
  return `${c.auteur ? `${escC(c.auteur)}, ` : ''}${lu ? `<a href="${lu}" target="_blank" rel="noopener">${escC(c.licence)}</a>` : escC(c.licence)}, <a href="${escC(c.page)}" target="_blank" rel="noopener">Wikimedia Commons</a>`
}
