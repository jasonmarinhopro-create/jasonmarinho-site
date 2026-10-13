#!/usr/bin/env node
// Les 3 derniers articles du blog pour le menu Ressources de nav.js
// (13/10/2026, proposition D validée par Jason). Lus dans rss.xml (tenu à
// jour par rebuild-blog.mjs à chaque article) et écrits dans
// derniers-articles.json, que nav.js ne charge qu'à l'ouverture du menu.
// Étape de scripts/build-site.sh : le fichier suit chaque déploiement.
import { readFileSync, writeFileSync } from 'node:fs'
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
  })
}
articles.sort((a, b) => b.ts - a.ts)
const out = articles.slice(0, 3).map(({ t, u, d }) => ({ t, u, d }))
if (!out.length) {
  console.warn('build-derniers-articles : aucun article trouvé dans rss.xml, fichier inchangé')
  process.exit(0)
}
writeFileSync(join(ROOT, 'derniers-articles.json'), JSON.stringify(out) + '\n')
console.log(`build-derniers-articles : ${out.length} articles (dernier : ${out[0].d})`)
