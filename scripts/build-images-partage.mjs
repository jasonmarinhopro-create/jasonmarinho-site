#!/usr/bin/env node
// Images de partage (og:image) dans le style de l'accueil (24/11/2026, Jason :
// « change tous les visuels des liens avec le nouveau design de la page
// d'accueil, que chaque lien ait la bonne photo, il faut de la cohérence »).
//
// Une image 1200 x 630 par page indexable : fond vert de l'accueil, logo,
// rubrique, titre de la page (le H1, sa partie <em> en jaune italique) et,
// pour les pages de ville, la photo de la ville. Écrit img/partage/<clé>.jpg ;
// scripts/inject-images-partage.mjs (au build) branche chaque page sur son image.
// Les articles du blog gardent leur photo de couverture.
//
// Lancé à la main (Playwright requis, pas au build Vercel) après l'ajout de pages :
//   node scripts/build-images-partage.mjs            (images manquantes seulement)
//   node scripts/build-images-partage.mjs --tout     (tout refaire)
//   node scripts/build-images-partage.mjs --seul=services/index.html,index.html
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { pagesPartage, FAMILLES } from './lib/images-partage.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'img/partage')
const tout = process.argv.includes('--tout')
const seul = (process.argv.find(a => a.startsWith('--seul=')) || '').slice(7).split(',').filter(Boolean)

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const TYPES = { '.html': 'text/html', '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' })
  fs.createReadStream(f).pipe(res)
})
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`

const GABARIT = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:F;font-weight:300;font-style:normal;src:url(/fonts/gf/fraunces-normal-300-latin.woff2) format('woff2')}
@font-face{font-family:F;font-weight:300;font-style:normal;src:url(/fonts/gf/fraunces-normal-300-latin-ext.woff2) format('woff2');unicode-range:U+0100-024F,U+1E00-1EFF}
@font-face{font-family:F;font-weight:300;font-style:italic;src:url(/fonts/gf/fraunces-italic-300-latin.woff2) format('woff2')}
@font-face{font-family:F;font-weight:400;font-style:italic;src:url(/fonts/gf/fraunces-italic-400-latin.woff2) format('woff2')}
@font-face{font-family:F;font-weight:400;font-style:normal;src:url(/fonts/gf/fraunces-normal-400-latin.woff2) format('woff2')}
@font-face{font-family:O;font-weight:400;src:url(/fonts/gf/outfit-normal-400-latin.woff2) format('woff2')}
@font-face{font-family:O;font-weight:600;src:url(/fonts/gf/outfit-normal-600-latin.woff2) format('woff2')}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1200px;height:630px;overflow:hidden}
body{position:relative;background:radial-gradient(120% 90% at 85% 0%,#0B5A49 0%,#003A2F 45%,#002A22 100%);color:#fff;font-family:O,sans-serif}
body:after{content:"";position:absolute;inset:0;background:radial-gradient(60% 50% at 10% 100%,rgba(255,213,107,.08),transparent 70%);pointer-events:none}
.wrap{position:absolute;inset:0;display:flex;padding:56px 64px}
.txt{flex:1;min-width:0;display:flex;flex-direction:column}
.brand{display:flex;align-items:center;gap:14px;font-family:F;font-weight:400;font-size:30px;letter-spacing:-.3px}
.brand i{font-style:italic;color:#FFD56B;font-weight:300}
.mk{width:40px;height:40px;background:#fff;-webkit-mask:url(/logo-nav.webp) center/contain no-repeat;mask:url(/logo-nav.webp) center/contain no-repeat}
.lbl{align-self:flex-start;margin-top:42px;padding:9px 18px;border:1.5px solid rgba(255,213,107,.4);border-radius:99px;background:rgba(255,213,107,.08);color:#FFD56B;font-weight:600;font-size:19px;letter-spacing:1.6px;text-transform:uppercase}
h1{margin-top:26px;font-family:F;font-weight:300;line-height:1.06;letter-spacing:-1.5px;text-wrap:balance}
h1 em{font-style:italic;color:#FFD56B;font-weight:300}
.ft{margin-top:auto;display:flex;align-items:center;gap:12px;font-size:21px;color:rgba(255,255,255,.72)}
.ft b{font-weight:600;color:#fff}
.ft .d{width:6px;height:6px;border-radius:50%;background:#FFD56B}
.ph{display:none;width:400px;margin:-4px -12px -4px 48px;border-radius:28px;overflow:hidden;box-shadow:0 30px 60px -20px rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.12)}
.ph img{width:100%;height:100%;object-fit:cover;display:block}
body.avec .ph{display:block}
</style></head><body><div class="wrap"><div class="txt">
<div class="brand"><span class="mk"></span><span>Jason <i>Marinho</i></span></div>
<span class="lbl" id="lbl"></span><h1 id="h1"></h1>
<div class="ft"><b>jasonmarinho.com</b><span class="d"></span><span id="ft"></span></div>
</div><div class="ph"><img id="img" alt=""></div></div></body></html>`
fs.writeFileSync(path.join(OUT, '_gabarit.html'), GABARIT)

const pages = pagesPartage(ROOT).filter(p => !seul.length || seul.includes(p.fichier))
const aFaire = [...FAMILLES.map(f => ({ ...f, famille: true })), ...pages].filter(p => tout || seul.length || !fs.existsSync(path.join(OUT, `${p.cle}.jpg`)))
console.log(`Images de partage : ${aFaire.length} à créer sur ${pages.length + FAMILLES.length}`)

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })).newPage()
await page.goto(`${base}/img/partage/_gabarit.html`, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
let n = 0
for (const p of aFaire) {
  await page.evaluate(async ({ titre, rubrique, pied, photo }) => {
    document.getElementById('lbl').textContent = rubrique
    document.getElementById('ft').textContent = pied
    const h1 = document.getElementById('h1')
    h1.innerHTML = titre
    document.body.classList.toggle('avec', !!photo)
    if (photo) { const im = document.getElementById('img'); im.src = photo; await im.decode().catch(() => {}) }
    // Taille du titre : la plus grande qui tient dans la place disponible
    const max = document.querySelector('.ft').getBoundingClientRect().top - h1.getBoundingClientRect().top - 24
    for (let s = photo ? 64 : 78; s >= 34; s -= 2) { h1.style.fontSize = s + 'px'; if (h1.scrollHeight <= max && h1.scrollWidth <= h1.clientWidth + 1) break }
  }, { titre: p.titre, rubrique: p.rubrique, pied: p.pied, photo: p.photo ? `${base}/${p.photo}` : '' })
  await page.screenshot({ path: path.join(OUT, `${p.cle}.jpg`), type: 'jpeg', quality: 76 })
  if (++n % 100 === 0) console.log(`  ${n}/${aFaire.length}`)
}
await browser.close()
server.close()
fs.unlinkSync(path.join(OUT, '_gabarit.html'))
console.log(`Images de partage : ${n} écrite(s) dans img/partage`)
