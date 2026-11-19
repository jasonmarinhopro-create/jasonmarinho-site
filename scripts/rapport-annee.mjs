#!/usr/bin/env node
// Rapport du passage d'année (préparé le 19/11/2026 pour 2027) : liste les
// pages indexables dont le titre, la description ou le H1 citent une année,
// rangées par famille, pour décider page par page (docs/claude/passage-2027.md).
// Lecture seule, n'écrit rien.
//   node scripts/rapport-annee.mjs [année]   (2026 par défaut)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const AN = process.argv[2] || '2026'
const SKIP = new Set(['jason-app', 'node_modules', '.git', '_drafts', 'docs', 'scripts', 'data'])

function* pages(dir = ROOT) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP.has(e.name) || dir !== ROOT) yield* pages(path.join(dir, e.name)) }
    else if (e.name.endsWith('.html')) yield path.join(dir, e.name)
  }
}

const MONTANTS = /(micro-?bic|tva|lmnp|lmp|fiscal|imp[oô]t|taxe|r[ée]gime r[ée]el|abattement|cotisation|urssaf|indy|tiime|d[ée]clar|classement|maprimerenov|travaux|compte bancaire|soci[ée]t[ée]|cl[oô]ture|prix|tarif|frais|budget|assurance|caution|piscine|ancv|rgpd|enregistrement|r[ée]glementation|incendie|code promo|comparatif|avis|vs )/i
const MOMENT = /(toussaint|no[eë]l|vacances scolaires|bilan saison|fin d.[ée]t[ée]|black friday|20 mai)/i

const familles = new Map()
const add = (k, v) => { if (!familles.has(k)) familles.set(k, []); familles.get(k).push(v) }
for (const f of pages()) {
  const html = fs.readFileSync(f, 'utf8')
  if (/<meta name="robots" content="[^"]*noindex/.test(html)) continue
  const titre = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? ''
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? ''
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '').replace(/<[^>]+>/g, '')
  if (![titre, desc, h1].some(t => t.includes(AN))) continue
  let url = '/' + path.relative(ROOT, f).replace(/\.html$/, '').replace(/(^|\/)index$/, '')
  url = url.replace(/\/$/, '') || '/'
  const ou = [titre.includes(AN) && 'titre', desc.includes(AN) && 'description', h1.includes(AN) && 'H1'].filter(Boolean).join(', ')
  const k = /^\/devenir-hote-airbnb-/.test(url) ? 'Guides hôte de ville'
    : /^\/services\/simulateurs\/revenus-lcd\//.test(url) ? 'Études de revenus par ville'
    : /^\/(photographe|menage|depannage)-lcd-/.test(url) ? 'Pages pros de ville'
    : /^\/services\//.test(url) ? 'Simulateurs, formations et services'
    : MOMENT.test(titre + url) ? 'Liés à un moment précis (ne pas renommer)'
    : MONTANTS.test(titre + url) ? 'Montants, prix ou règles à revérifier'
    : "L'année comme simple repère"
  add(k, `${url} | ${ou} | ${titre}`)
}
let total = 0
for (const [k, v] of familles) {
  total += v.length
  console.log(`\n## ${k} (${v.length})`)
  for (const l of v.sort()) console.log(`- ${l}`)
}
console.log(`\nTotal : ${total} pages citent ${AN} dans leur titre, leur description ou leur H1.`)
