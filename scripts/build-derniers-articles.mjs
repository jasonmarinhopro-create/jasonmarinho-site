#!/usr/bin/env node
// Les 4 derniers articles du blog pour le menu Ressources de nav.js
// (13/10/2026, proposition D validée par Jason). Lus dans rss.xml (tenu à
// jour par rebuild-blog.mjs à chaque article) et écrits dans
// derniers-articles.json, que nav.js ne charge qu'à l'ouverture du menu.
// Étape de scripts/build-site.sh : le fichier suit chaque déploiement.
// Depuis le 31/10/2026 (accueil D) : écrit aussi les 3 derniers articles dans
// index.html, entre <!-- DERNIERS-ARTICLES --> et <!-- /DERNIERS-ARTICLES -->
// (un grand bloc « À la une » et deux cartes).
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

function decode(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .trim()
}

function tag(item, name) {
  const m = item.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))
  return m ? decode(m[1]) : ''
}

const rss = readFileSync(join(ROOT, 'rss.xml'), 'utf8')
const items = [...rss.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => m[1])

const articles = []
for (const it of items) {
  const title = tag(it, 'title')
  const link = tag(it, 'link')
  const date = new Date(tag(it, 'pubDate'))
  if (!title || !link.startsWith('https://jasonmarinho.com/blog/') || isNaN(date)) continue
  articles.push({
    t: title,
    u: link.replace('https://jasonmarinho.com', ''),
    d: `${date.getUTCDate()} ${MOIS[date.getUTCMonth()]}`,
    ts: date.getTime(),
    desc: tag(it, 'description'),
    cat: tag(it, 'category') || 'Guide',
  })
}
articles.sort((a, b) => b.ts - a.ts)
const out = articles.slice(0, 4).map(({ t, u, d }) => ({ t, u, d }))
if (!out.length) {
  console.warn('build-derniers-articles : aucun article trouvé dans rss.xml, fichier inchangé')
  process.exit(0)
}
writeFileSync(join(ROOT, 'derniers-articles.json'), JSON.stringify(out) + '\n')
console.log(`build-derniers-articles : ${out.length} articles (dernier : ${out[0].d})`)

// ── Accueil : les 3 derniers articles ──
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
function lecture(u) {
  const f = join(ROOT, u.replace(/^\//, ''), 'index.html')
  if (!existsSync(f)) return null
  const m = readFileSync(f, 'utf8').match(/(\d+) min de lecture/)
  return m ? Number(m[1]) : null
}
const trois = articles.slice(0, 3)
if (trois.length === 3) {
  const [une, ...suite] = trois
  const min = a => { const n = lecture(a.u); return n ? `${n} min de lecture` : a.d }
  const bloc = `<!-- DERNIERS-ARTICLES -->
<div class="bl">
<a href="${une.u}" class="bl-une"><span class="c-eyb">À la une · ${esc(une.cat)}</span><span class="c-h">${esc(une.t)}</span><p>${esc(une.desc)}</p><span class="bl-f"><span>${min(une)}</span><b>Lire l’article →</b></span></a>
<div class="col">
${suite.map(a => `<a href="${a.u}" class="bl-c"><span class="c-eyb">${esc(a.cat)}</span><span class="c-h">${esc(a.t)}</span><span class="bl-m"><span>${min(a)}</span><b>Lire →</b></span></a>`).join('\n')}
</div>
</div>
<!-- /DERNIERS-ARTICLES -->`
  const idx = join(ROOT, 'index.html')
  const html = readFileSync(idx, 'utf8')
  const re = /<!-- DERNIERS-ARTICLES -->[\s\S]*?<!-- \/DERNIERS-ARTICLES -->/
  if (re.test(html)) {
    writeFileSync(idx, html.replace(re, bloc))
    console.log(`build-derniers-articles : accueil à jour (${une.u})`)
  } else {
    console.warn('build-derniers-articles : repères absents de index.html, accueil inchangé')
  }
}
