// « Dans la même région » : liens entre les pages de ville voisines
// (17/10/2026, pousser les pages de ville en place 4 à 20). Chaque page
// photographe, ménage et guide hôte renvoie vers les pages du même sujet des
// villes de sa région, avec l'ancre de la recherche visée (« Ménage Airbnb à
// Caen »). Avant : une page de ville ne recevait de liens que des deux autres
// pages de sa ville et des annuaires.
// Idempotent (marqueurs VOISINES:START/END) :
//   node scripts/inject-villes-voisines.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { aVille } from './data/villes-local.mjs'
import { villesRegistre } from './lib/registre-geo.mjs'
import { distKm } from './lib/secteur.mjs'

const ROOT = new URL('..', import.meta.url).pathname

// Régions officielles du registre géographique unique (09/11/2026, étape 3 de
// la feuille de route) : avant, 11 groupes maison (« Normandie et
// Hauts-de-France », « Pays de la Loire et Val de Loire »). Une ville qui a
// moins de MIN_VOISINES villes dans sa région est complétée par les villes les
// plus proches (Tours, seule ville du Centre-Val de Loire).
const MIN_VOISINES = 3
const REGISTRE = villesRegistre()
const villeDe = new Map(REGISTRE.map(v => [v.slug, v]))

/** Villes voisines d'une ville pour un type de page : sa région, triée par distance, complétée au besoin */
export function voisines(slug, kind) {
  const v = villeDe.get(slug)
  if (!v?.region) return null
  const avec = REGISTRE.filter(x => x.slug !== slug && x.pages[kind] && x.centre)
  const parDistance = xs => xs.slice().sort((a, b) => distKm(v.centre, a.centre) - distKm(v.centre, b.centre))
  const region = parDistance(avec.filter(x => x.region?.code === v.region.code))
  const proches = region.length >= MIN_VOISINES ? [] : parDistance(avec.filter(x => x.region?.code !== v.region.code)).slice(0, MIN_VOISINES - region.length)
  return {
    titre: proches.length ? (region.length ? `${v.region.nom} et villes proches` : 'Villes proches') : v.region.nom,
    slugs: [...region, ...proches].map(x => x.slug),
  }
}

const KINDS = [
  { kind: 'photographe', prefix: 'photographe-lcd-', label: v => `Photographe Airbnb ${aVille(v)}`, titre: 'Photographes dans la région' },
  { kind: 'menage', prefix: 'menage-lcd-', label: v => `Ménage Airbnb ${aVille(v)}`, titre: 'Ménage Airbnb dans la région' },
  { kind: 'depannage', prefix: 'depannage-lcd-', label: v => `Dépannage ${aVille(v)}`, titre: 'Dépannage dans la région' },
  { kind: 'hote', prefix: 'devenir-hote-airbnb-', label: v => `Louer sur Airbnb ${aVille(v)}`, titre: 'Les guides des villes voisines' },
]

const chip = (href, text) => `<a href="${href}" style="display:block;padding:8px 11px;border-radius:10px;background:#fff;border:1px solid rgba(0,76,63,.16);color:#004C3F;font-size:13.5px;font-weight:500;line-height:1.35;text-decoration:none">${text}</a>`

// Pages pros : même largeur et mêmes marges que les sections de la page
// (.s-in), espace égal au-dessus et en dessous (27/10/2026, Jason : bloc
// décalé, grand vide au-dessus et collé au bandeau crème en dessous).
// Guides hôte : placé dans leur <main>, qui a déjà ses marges.
const SECTION_STYLE = {
  pro: 'max-width:1100px;margin:0 auto;padding:0 clamp(20px,5vw,48px) clamp(44px,6vw,68px)',
  guide: 'max-width:1100px;margin:0 auto;padding:clamp(24px,4vw,40px) clamp(16px,5vw,60px) 0',
}

function block(k, region, others) {
  const chips = others.map(s => chip(`/${k.prefix}${s}`, k.label(villeDe.get(s).nom))).join('\n      ')
  const inner = `<div style="background:#F7F5F0;border:1px solid rgba(0,76,63,.09);border-radius:18px;padding:clamp(20px,3vw,28px)">
      <p style="font-family:'Fraunces','Fraunces Fallback',serif;font-size:clamp(18px,2.1vw,22px);color:#0F1A0D;margin:0 0 4px">${k.titre}</p>
      <p style="font-size:13.5px;color:#3D5038;margin:0 0 14px;line-height:1.6">${region}</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px">
      ${chips}
      </div>
    </div>`
  return `<!-- VOISINES:START -->
<section style="${SECTION_STYLE[k.prefix === 'devenir-hote-airbnb-' ? 'guide' : 'pro']}">
    ${inner}
</section>
<!-- VOISINES:END -->
`
}

let done = 0
const skipped = []
const sansRegion = []
for (const v of REGISTRE.filter(x => x.pays === 'FR')) {
  for (const k of KINDS) {
    if (!v.pages[k.kind]) continue
    const file = `${ROOT}${k.prefix}${v.slug}/index.html`
    if (!existsSync(file)) { skipped.push(`${k.prefix}${v.slug} (absente)`); continue }
    const vois = voisines(v.slug, k.kind)
    if (!vois) { sansRegion.push(v.slug); continue }
    const others = vois.slugs.filter(s => existsSync(`${ROOT}${k.prefix}${s}/index.html`))
    let html = readFileSync(file, 'utf8').replace(/<!-- VOISINES:START -->[\s\S]*?<!-- VOISINES:END -->\n?/, '')
    if (!others.length) { writeFileSync(file, html); continue }
    // Pages pros : avant « Pour aller plus loin » ; guides : après les liens vers les pros
    let at = -1
    if (k.prefix === 'devenir-hote-airbnb-') {
      const e = html.indexOf('<!-- PROS_VILLE_LINKS_END -->')
      if (e >= 0) at = e + '<!-- PROS_VILLE_LINKS_END -->'.length + 1
    } else {
      const p = html.indexOf('Pour aller plus loin</span>')
      if (p >= 0) at = html.lastIndexOf('<section', p)
    }
    if (at < 0) { skipped.push(`${k.prefix}${v.slug} (emplacement)`); continue }
    html = html.slice(0, at) + block(k, vois.titre, others) + html.slice(at)
    writeFileSync(file, html)
    done++
  }
}
console.log(`Villes voisines : ${done} pages`)
if (skipped.length) console.log('Ignorées :', skipped.join(', '))
if (sansRegion.length) { console.log('Villes sans région :', sansRegion.join(', ')); process.exitCode = 1 }

// Régions des villes pour la liste de suggestions (18/10/2026) : site
// (suggestions.js) et app (jason-app/lib/ui/suggest-regions.ts), même liste.
// Villes hors de France : leur pays.
// Villes hors de France : leur pays. Villes qui ont des pages seulement.
const regionMap = Object.fromEntries(REGISTRE
  .filter(v => Object.keys(v.pages).some(k => k !== 'revenus'))
  .map(v => [v.slug, v.region?.nom ?? v.paysNom])
  .sort(([a], [b]) => a.localeCompare(b)))
const json = JSON.stringify(regionMap)
for (const [file, re] of [
  [`${ROOT}suggestions.js`, /\/\*REGIONS:START\*\/[\s\S]*?\/\*REGIONS:END\*\//],
  [`${ROOT}jason-app/lib/ui/suggest-regions.ts`, /\/\*REGIONS:START\*\/[\s\S]*?\/\*REGIONS:END\*\//],
]) {
  if (!existsSync(file)) continue
  const src = readFileSync(file, 'utf8')
  const next = src.replace(re, `/*REGIONS:START*/${json}/*REGIONS:END*/`)
  if (next !== src) writeFileSync(file, next)
}
