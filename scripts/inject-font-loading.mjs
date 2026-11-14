// Ouverture des pages sans « double chargement ni petit zoom » (26/10/2026,
// Jason, d'abord sur l'accueil puis « fais-le sur tout le site »). Avant :
// la page s'affichait dans la police de secours, puis Fraunces / Outfit
// arrivaient et le texte se redessinait. Maintenant : font-display: block
// dans /fonts/site-fonts.css (le texte attend sa police, fonds et images
// visibles tout de suite) et, ici, préchargement des 3 polices du premier
// écran dans chaque page qui charge site-fonts.css. Le menu apparaît en fondu
// (nav.js). Masquer toute la page en attendant a été essayé puis écarté :
// flash d'un fond beige avant les en-têtes vert foncé. L'accueil a en plus son
// propre réglage (entrée du hero retenue, index.html). Idempotent (marqueurs
// FONTLOAD) ; lancé par scripts/build-site.sh après les générateurs de pages.
//   node scripts/inject-font-loading.mjs
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const START = '<!-- FONTLOAD:START -->'
const END = '<!-- FONTLOAD:END -->'
const SKIP_DIRS = new Set(['node_modules', 'jason-app', '.git', '.vercel', 'fonts', 'scripts', 'data', 'docs'])
const SKIP_FILES = new Set(['index.html']) // accueil : réglage propre

export const BLOCK = `${START}
<link rel="preload" as="font" type="font/woff2" href="/fonts/gf/fraunces-normal-300-latin.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/fonts/gf/fraunces-italic-300-latin.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/fonts/gf/outfit-normal-300-latin.woff2" crossorigin>
${END}`

const LINK = /<link[^>]*href="\/fonts\/site-fonts\.css[^"]*"[^>]*>/

// Entrée du hero (keyframes fu) : départ à opacity .01 au lieu de 0 (27/10/2026,
// PageSpeed mobile). Chrome ne retient pas comme « plus grand élément » (LCP)
// un texte peint à opacity 0 : le titre du hero était ignoré et le LCP tombait
// sur le bandeau cookies, affiché plus tard (3,2 s au lieu de 0,1 s). Même
// rendu à l'œil. Appliqué à chaque build, accueil compris : une page générée
// ou recopiée avec l'ancienne règle est corrigée d'office.
export const FADE_FROM = /@keyframes fu\{from\{opacity:0;/g
export const FADE_TO = '@keyframes fu{from{opacity:.01;'

function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || name.startsWith('.')) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) yield* htmlFiles(p)
    else if (name.endsWith('.html')) yield p
  }
}

// Bandeau du haut prolongé avant la première image (14/11/2026, Jason : « saut de
// page » à l'ouverture après une longue absence). nav.js remonte le premier
// bandeau coloré jusqu'en haut de la page (fillTop) ; quand nav.js arrive tard
// (cache vide, réseau lent : 3 à 4 s mesurées), on voyait d'abord une bande
// claire de 64 px puis le bandeau sauter. Même calcul, ici en ligne à la fin de
// la page : fait avant le premier affichage. nav.js le refait sans effet (écart 0).
const FT_START = '<!-- FILLTOP:START -->'
const FT_END = '<!-- FILLTOP:END -->'
export const FILLTOP = `${FT_START}<script>(function(){var el=document.body;for(var d=0;d<5&&el;d++){var nx=null,k=el.children;for(var i=0;i<k.length;i++){var c=k[i];if(c.id==='nav'||c.id==='mob'||/^(SCRIPT|STYLE|LINK|NOSCRIPT|TEMPLATE)$/.test(c.tagName))continue;var s=getComputedStyle(c);if(s.position==='fixed'||s.position==='absolute'||s.display==='none'||c.getBoundingClientRect().height<1)continue;nx=c;break}if(!nx)return;var cs=getComputedStyle(nx),r=nx.getBoundingClientRect(),m=/rgba?\\(([^)]+)\\)/.exec(cs.backgroundColor),a=m?m[1].split(',').map(parseFloat):[],bg=(a.length>3?a[3]:a.length?1:0)>=.5||(cs.backgroundImage&&cs.backgroundImage!=='none');if(bg&&r.width>=innerWidth*.97){var g=Math.round(r.top+(scrollY||0));if(g>=1&&g<=140){nx.style.marginTop=(parseFloat(cs.marginTop)-g)+'px';nx.style.paddingTop=(parseFloat(cs.paddingTop)+g)+'px'}return}el=nx}})()</script>${FT_END}`

let n = 0
let fades = 0
let tops = 0
for (const file of htmlFiles(ROOT)) {
  const rel = relative(ROOT, file)
  const raw = readFileSync(file, 'utf8')
  const html = raw.replace(FADE_FROM, FADE_TO)
  if (html !== raw) { writeFileSync(file, html); fades++ }
  if (SKIP_FILES.has(rel)) continue
  if (!LINK.test(html) || !html.includes('/nav.js')) continue
  let out
  if (html.includes(START)) out = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), BLOCK)
  else out = html.replace(LINK, m => `${m}\n${BLOCK}`)
  if (out !== html) { writeFileSync(file, out); n++ }
}
for (const file of htmlFiles(ROOT)) {
  const html = readFileSync(file, 'utf8')
  if (!html.includes('/nav.js') || !html.includes('</body>')) continue
  const clean = html.replace(new RegExp(`${FT_START}[\\s\\S]*?${FT_END}\\n?`), '')
  const at = clean.lastIndexOf('</body>')
  const out = clean.slice(0, at) + FILLTOP + '\n' + clean.slice(at)
  if (out !== html) { writeFileSync(file, out); tops++ }
}
console.log(`[font-loading] ${n} page(s) mises à jour, entrée du hero corrigée dans ${fades}, bandeau du haut posé dans ${tops}`)
