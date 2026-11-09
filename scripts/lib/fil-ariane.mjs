// Fil d'Ariane des pages de ville (étape 5 de la feuille de route
// « géographie, pied de page et fil d'Ariane », 09/11/2026).
// Une seule fonction donne le chemin d'une page ; le fil visible et le fil
// balisé (JSON-LD BreadcrumbList) en sont tirés, ils ne peuvent plus diverger.
// Règle : un niveau (région, plus tard département) n'apparaît que s'il a une
// vraie page ; le fil s'allonge tout seul quand une page région est créée.
// Aucune adresse ne change.
import { villesRegistre } from './registre-geo.mjs'
import { cheminRegion } from './footer-html.mjs'

export const SITE = 'https://jasonmarinho.com'

/** Page mère de chaque type de page de ville */
export const MERES = {
  photographe: { nom: 'Photographes et vidéastes LCD', url: '/annuaires/photographes' },
  menage: { nom: 'Équipes de ménage LCD', url: '/annuaires/menage' },
  depannage: { nom: 'Dépannage et maintenance', url: '/annuaires/depannage' },
  hote: { nom: 'Guides hôte par ville', url: '/villes' },
  revenus: { nom: 'Calculateurs', url: '/calculateurs' },
}

/** Chemin d'une page de ville : [{ nom, url }], de l'accueil à la page */
export function cheminVille(kind, slug) {
  const v = villesRegistre().find(x => x.slug === slug)
  if (!v?.pages[kind]) return null
  const out = [{ nom: 'Accueil', url: '/' }, MERES[kind]]
  if (v.region && kind !== 'revenus') {
    const r = cheminRegion(kind, v.region.nom)
    if (r) out.push({ nom: v.region.nom, url: r })
  }
  out.push({ nom: v.nom, url: v.pages[kind] })
  return out
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** JSON-LD BreadcrumbList (le dernier élément garde son adresse : la page elle-même) */
export function jsonLd(chemin) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: chemin.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.nom, item: c.url === '/' ? `${SITE}/` : SITE + c.url })),
  })
}

/**
 * Fil visible, dans le style de chaque gabarit :
 * - pros : <nav class="brd">, séparateur « · »
 * - guide : <nav class="breadcrumb">, flèches Phosphor
 * - calcul : <nav class="breadcrumb lt">, séparateur « / »
 */
export function visible(chemin, style) {
  const items = chemin.map((c, i) => (i === chemin.length - 1 ? `<span>${esc(c.nom)}</span>` : `<a href="${c.url}">${esc(c.nom)}</a>`))
  const aria = 'aria-label="Fil d\'Ariane"'
  if (style === 'pros') return `<nav class="brd" ${aria}>${items.join(' · ')}</nav>`
  if (style === 'guide') return `<nav class="breadcrumb" ${aria}>\n      ${items.join('\n      <i class="ph ph-caret-right"></i>\n      ')}\n    </nav>`
  if (style === 'calcul') return `<nav class="breadcrumb lt" ${aria}>\n      ${items.join(' /\n      ')}\n    </nav>`
  throw new Error(`Style de fil inconnu : ${style}`)
}

/** Fil balisé d'une page mère (annuaires) : Accueil › page */
export function jsonLdMere(kind) {
  return jsonLd([{ nom: 'Accueil', url: '/' }, MERES[kind]])
}
