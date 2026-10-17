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

const ROOT = new URL('..', import.meta.url).pathname
const footer = readFileSync(new URL('../footer.js', import.meta.url), 'utf8')
const NAMES = Object.fromEntries([...footer.matchAll(/slug: '([^']+)',\s*name: '([^']+)'/g)].map(m => [m[1], m[2]]))
NAMES['les-sables-d-olonne'] ??= "Les Sables-d'Olonne"

export const REGIONS = {
  'Auvergne-Rhône-Alpes': ['lyon', 'annecy', 'chamonix', 'megeve', 'grenoble', 'chambery', 'clermont-ferrand', 'roanne'],
  'Nouvelle-Aquitaine': ['bordeaux', 'arcachon', 'biarritz', 'bayonne', 'pau', 'la-rochelle', 'poitiers', 'sarlat'],
  "Provence-Alpes-Côte d'Azur": ['marseille', 'aix-en-provence', 'avignon', 'nice', 'cannes', 'antibes', 'menton', 'saint-tropez'],
  Occitanie: ['toulouse', 'montpellier', 'nimes', 'sete', 'perpignan', 'carcassonne'],
  Bretagne: ['rennes', 'saint-malo', 'dinard', 'vannes', 'brest', 'quimper'],
  'Pays de la Loire et Val de Loire': ['nantes', 'la-baule', 'angers', 'le-mans', 'les-sables-d-olonne', 'tours'],
  'Grand Est': ['strasbourg', 'colmar', 'metz', 'nancy', 'reims', 'epernay', 'troyes'],
  'Normandie et Hauts-de-France': ['rouen', 'caen', 'deauville', 'honfleur', 'etretat', 'lille', 'le-touquet'],
  'Bourgogne': ['dijon', 'beaune'],
  'Île-de-France': ['paris', 'versailles'],
  Corse: ['ajaccio', 'bastia'],
}
const regionOf = slug => Object.entries(REGIONS).find(([, v]) => v.includes(slug))

const KINDS = [
  { prefix: 'photographe-lcd-', label: v => `Photographe Airbnb ${aVille(v)}`, titre: 'Photographes dans la région' },
  { prefix: 'menage-lcd-', label: v => `Ménage Airbnb ${aVille(v)}`, titre: 'Ménage Airbnb dans la région' },
  { prefix: 'devenir-hote-airbnb-', label: v => `Louer sur Airbnb ${aVille(v)}`, titre: 'Les guides des villes voisines' },
]

const chip = (href, text) => `<a href="${href}" style="display:block;padding:8px 11px;border-radius:10px;background:#fff;border:1px solid rgba(0,76,63,.16);color:#004C3F;font-size:13.5px;font-weight:500;line-height:1.35;text-decoration:none">${text}</a>`

function block(k, region, others) {
  const chips = others.map(s => chip(`/${k.prefix}${s}`, k.label(NAMES[s]))).join('\n      ')
  const inner = `<div style="background:#F7F5F0;border:1px solid rgba(0,76,63,.09);border-radius:18px;padding:clamp(20px,3vw,28px)">
      <p style="font-family:'Fraunces',serif;font-size:clamp(18px,2.1vw,22px);color:#0F1A0D;margin:0 0 4px">${k.titre}</p>
      <p style="font-size:13.5px;color:#3D5038;margin:0 0 14px;line-height:1.6">${region}</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px">
      ${chips}
      </div>
    </div>`
  return `<!-- VOISINES:START -->
<section style="max-width:1100px;margin:0 auto;padding:clamp(24px,4vw,40px) clamp(16px,5vw,60px) 0">
    ${inner}
</section>
<!-- VOISINES:END -->
`
}

let done = 0
const skipped = []
for (const [region, slugs] of Object.entries(REGIONS)) {
  for (const slug of slugs) {
    for (const k of KINDS) {
      const file = `${ROOT}${k.prefix}${slug}/index.html`
      if (!existsSync(file)) { skipped.push(`${k.prefix}${slug} (absente)`); continue }
      const others = slugs.filter(s => s !== slug && NAMES[s] && existsSync(`${ROOT}${k.prefix}${s}/index.html`))
      if (!others.length) continue
      let html = readFileSync(file, 'utf8').replace(/<!-- VOISINES:START -->[\s\S]*?<!-- VOISINES:END -->\n?/, '')
      // Pages pros : avant « Pour aller plus loin » ; guides : après les liens vers les pros
      let at = -1
      if (k.prefix === 'devenir-hote-airbnb-') {
        const e = html.indexOf('<!-- PROS_VILLE_LINKS_END -->')
        if (e >= 0) at = e + '<!-- PROS_VILLE_LINKS_END -->'.length + 1
      } else {
        const p = html.indexOf('Pour aller plus loin</span>')
        if (p >= 0) at = html.lastIndexOf('<section', p)
      }
      if (at < 0) { skipped.push(`${k.prefix}${slug} (emplacement)`); continue }
      html = html.slice(0, at) + block(k, region, others) + html.slice(at)
      writeFileSync(file, html)
      done++
    }
  }
}
const all = Object.values(REGIONS).flat()
const sansRegion = Object.keys(NAMES).filter(s => !all.includes(s))
console.log(`Villes voisines : ${done} pages`)
if (skipped.length) console.log('Ignorées :', skipped.join(', '))
if (sansRegion.length) { console.log('Villes sans région :', sansRegion.join(', ')); process.exitCode = 1 }
