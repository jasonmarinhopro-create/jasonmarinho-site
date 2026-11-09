#!/usr/bin/env node
// Photo de la ville en fond de l'en-tête (10/11/2026, Jason : « mettre l'image
// trouvée sur Pexels, ça ajoute de la joie et du contenu pour Google »).
// - pages de ville (photographe, ménage, dépannage, devenir hôte, étude de revenus) ;
// - pages région et département (annuaires, guides hôte) : la photo de la plus
//   grande ville de la zone qui en a une, nommée dans le texte alternatif.
// Une vraie balise <img> (lue par Google Images) sous un voile vert, le texte
// reste lisible. Idempotent (marqueurs PHOTO-VILLE) ; lancé au déploiement
// après les générateurs (build-site.sh) et à la main pour les pages du dépôt.
//   node scripts/inject-photos-villes.mjs [--check]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { villesRegistre } from './lib/registre-geo.mjs'
import { aPhoto, creditPhoto } from './data/photos-villes.mjs'
import { annonces } from './lib/footer-html.mjs'
import { slugRegion } from './lib/villes-hub.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const check = process.argv.includes('--check')
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const RE = /<!-- PHOTO-VILLE:START -->[\s\S]*?<!-- PHOTO-VILLE:END -->\n?/
const CSS = '.hero{position:relative;overflow:hidden;isolation:isolate}.hero-photo{position:absolute;inset:0;z-index:-1;margin:0}'
  + '.hero-photo img{width:100%;height:100%;object-fit:cover;display:block}'
  + '.hero-photo:after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,rgba(0,26,17,.94) 0%,rgba(0,40,32,.86) 45%,rgba(0,51,41,.55) 100%)}'
  + '.hero-photo figcaption{position:absolute;right:12px;bottom:8px;z-index:1;font-size:10.5px;color:rgba(255,255,255,.55)}.hero-photo figcaption a{color:inherit}'
  + '@media(max-width:720px){.hero-photo:after{background:linear-gradient(180deg,rgba(0,26,17,.9),rgba(0,40,32,.82))}}'

function bloc(slug, alt) {
  return `<!-- PHOTO-VILLE:START --><figure class="hero-photo"><img src="/img/villes/large/${slug}.webp" alt="${esc(alt)}" width="1440" height="576" decoding="async" fetchpriority="low">`
    + `<figcaption>Photo : ${creditPhoto(slug)}</figcaption></figure><style>${CSS}</style><!-- PHOTO-VILLE:END -->\n`
}

/** Ajoute (ou remplace) la photo juste après l'ouverture de l'en-tête */
function poser(rel, slug, alt) {
  const file = path.join(ROOT, rel, 'index.html')
  if (!fs.existsSync(file)) return 0
  const src = fs.readFileSync(file, 'utf8')
  const clean = src.replace(RE, '')
  const m = clean.match(/<(header|section) class="hero"[^>]*>\n?/)
  if (!m) return 0
  const next = slug ? clean.slice(0, m.index + m[0].length) + bloc(slug, alt) + clean.slice(m.index + m[0].length) : clean
  if (next === src) return 0
  if (!check) fs.writeFileSync(file, next)
  return 1
}

const villes = villesRegistre()
let n = 0, pages = 0
// Pages de ville
for (const v of villes) {
  const slug = aPhoto(v.slug) ? v.slug : null
  for (const url of Object.values(v.pages)) { pages++; n += poser(url.slice(1), slug, `${v.nom}${v.pays === 'FR' ? '' : `, ${v.paysNom}`}`) }
}
// Pages région et département : la plus grande ville de la zone qui a une photo
const parTaille = xs => [...xs].filter(v => aPhoto(v.slug)).sort((a, b) => annonces(b.slug) - annonces(a.slug))[0]
const fr = villes.filter(v => v.pays === 'FR' && v.region)
const regions = new Map(fr.map(v => [v.region.code, v.region.nom]))
for (const [code, nom] of regions) {
  const inReg = fr.filter(v => v.region.code === code)
  const best = parTaille(inReg)
  for (const base of ['annuaires/photographes', 'annuaires/menage', 'annuaires/depannage', 'villes']) {
    pages++; n += poser(`${base}/${slugRegion(nom)}`, best?.slug ?? null, best ? `${best.nom}, ${nom}` : '')
    if (base === 'villes') continue
    const dir = path.join(ROOT, base, slugRegion(nom))
    if (!fs.existsSync(dir)) continue
    for (const d of fs.readdirSync(dir, { withFileTypes: true }).filter(x => x.isDirectory())) {
      const inDep = inReg.filter(v => slugRegion(v.departement.nom) === d.name)
      const b = parTaille(inDep)
      pages++; n += poser(`${base}/${slugRegion(nom)}/${d.name}`, b?.slug ?? null, b ? `${b.nom}, ${b.departement.nom}` : '')
    }
  }
}
console.log(`Photos des villes : ${n} page(s) ${check ? 'à mettre à jour' : 'mises à jour'} sur ${pages}`)
if (check && n) process.exitCode = 1
