#!/usr/bin/env node
// Réécrit data/actualites-publiees.md depuis la base (23/10/2026) : toutes les actualités des
// 60 derniers jours, publiées ou masquées, quelle que soit leur origine (routine ou admin).
// Lancé par le workflow « Process actualités queue » après chaque publication et chaque matin
// avant la routine de veille. Titres et sources seulement (déjà publics sur le site).
//   ACTUALITES_INSERT_SECRET=… node scripts/actualites-historique.mjs
import fs from 'node:fs'

const SECRET = process.env.ACTUALITES_INSERT_SECRET
if (!SECRET) { console.error('Secret ACTUALITES_INSERT_SECRET absent'); process.exit(1) }
const res = await fetch('https://app.jasonmarinho.com/api/actualites/insert', { headers: { 'x-insert-token': SECRET } })
if (!res.ok) { console.error(`Lecture de l'historique impossible : HTTP ${res.status}`); process.exit(1) }
const { items } = await res.json()

const line = a => {
  const d = String(a.published_at || a.created_at).slice(0, 10)
  const aud = Array.isArray(a.audience) ? a.audience.filter(x => x !== 'hote') : []
  return `- ${d} · ${a.category} · ${a.title}${aud.length ? ` · pour ${aud.join(', ')}` : ''}${a.is_published ? '' : ' · masquée'}${a.source_url ? ` (${a.source_url})` : ''}`
}

const out = `# Actualités déjà publiées (dashboard > Actualités)

Historique lu par la routine de veille quotidienne AVANT de choisir ses
actualités : un sujet présent ici ne doit pas être republié, même reformulé ou
avec une autre source. Une vraie évolution (nouvelle date, décision publiée,
chiffre officiel qui change) peut l'être avec \`"is_update": true\` et un titre
qui dit ce qui change.

Réécrit automatiquement depuis la base par \`scripts/actualites-historique.mjs\`
(workflow « Process actualités queue », chaque matin et après chaque
publication) : les 60 derniers jours, actualités ajoutées par la routine ou
depuis l'admin, masquées comprises. Ne pas éditer à la main.

${items.map(line).join('\n')}
`
fs.writeFileSync(new URL('../data/actualites-publiees.md', import.meta.url), out)
console.log(`Historique : ${items.length} actualité(s) sur 60 jours`)
