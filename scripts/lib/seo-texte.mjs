// Titres et descriptions de page qui tiennent dans les limites de Google
// (24/11/2026, Jason : « toutes les pages bien optimisées, titre et
// description au bon nombre de caractères »). Titre : 60 caractères au plus
// (CLAUDE.md). Description : 155 au plus.

export const TITRE_MAX = 60
export const DESC_MAX = 155

/** Première formulation qui tient, de la plus complète à la plus courte ; sinon la dernière coupée au mot */
export function titreSeo(formulations, max = TITRE_MAX) {
  const ok = formulations.find(t => t && t.length <= max)
  if (ok) return ok
  const t = formulations.filter(Boolean).pop() || ''
  return couper(t, max)
}

/** « début : a, b, c, fin. » en retirant des éléments de la liste tant que c'est trop long */
export function descSeo(debut, elements, fin, max = DESC_MAX) {
  for (let k = elements.length; k >= 0; k--) {
    const liste = [...elements.slice(0, k), fin].filter(Boolean).join(', ')
    const d = `${debut} : ${liste}.`
    if (d.length <= max) return d
  }
  return couper(`${debut}.`, max)
}

export function couper(t, max) {
  if (t.length <= max) return t
  const i = t.lastIndexOf(' ', max - 1)
  return t.slice(0, i > max / 2 ? i : max - 1).replace(/[\s,;:·|-]+$/, '') + '…'
}
