// Liste complète des villes d'un type de page, rangées par région (France)
// ou par pays, pour les pages « mères » : annuaires, /villes, /services/simulateurs
// (09/11/2026). Depuis que le pied de page ne montre plus qu'une sélection
// de villes (Jason : « pas scalable quand j'aurai des centaines de villes »),
// ce sont ces pages qui portent tous les liens. Registre géographique unique.
import { villesRegistre } from './registre-geo.mjs'

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const fr = (a, b) => a.localeCompare(b, 'fr')
export const slugRegion = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Groupes { nom, id, villes } : régions françaises (ordre alphabétique) puis pays */
export function groupesVilles(kind, { parPays = false } = {}) {
  const by = new Map()
  for (const v of villesRegistre().filter(x => x.pages[kind])) {
    const g = parPays ? v.paysNom : (v.region?.nom ?? v.paysNom)
    const france = v.pays === 'FR'
    if (!by.has(g)) by.set(g, { nom: g, id: slugRegion(g), france, villes: [] })
    by.get(g).villes.push(v)
  }
  return [...by.values()]
    .sort((a, b) => (a.france === b.france ? (a.nom === 'France' ? -1 : b.nom === 'France' ? 1 : fr(a.nom, b.nom)) : a.france ? -1 : 1))
    .map(g => ({ ...g, villes: g.villes.sort((a, b) => fr(a.nom, b.nom)) }))
}

/**
 * HTML des groupes : un intertitre par région ou pays (avec un id pour y
 * renvoyer), puis les liens. Le style vient de la page (classes passées).
 */
export function villesParRegionHtml(kind, { label = v => v.nom, parPays = false, groupClass = 'vh-group', titleClass = 'vh-group-t', chipsClass = 'villes-chips' } = {}) {
  return groupesVilles(kind, { parPays }).map(g =>
    `<div class="${groupClass}${g.villes.length > 12 ? ' vh-group-wide' : ''}" id="${g.id}"><h3 class="${titleClass}">${esc(g.nom)}</h3><div class="${chipsClass}">`
    + g.villes.map(v => `<a href="${v.pages[kind]}">${esc(label(v))}</a>`).join('')
    + '</div></div>',
  ).join('\n')
}

/** Style commun des groupes (à ajouter près de .villes-chips) */
export const VH_CSS = '.vh-groups{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:22px 32px;margin-top:6px}'
  + '.vh-group{min-width:0}.vh-group-wide{grid-column:1/-1}'
  + '.vh-group-t{font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--tl,#5A6B57);margin:0 0 9px}'
