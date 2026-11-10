// Photos libres des villes sans photo Pexels (10/11/2026), via Wikimedia Commons
// (licences CC BY, CC BY-SA, CC0 ou domaine public ; auteur et licence cités sous la photo).
// Lancé par le workflow « Photos Commons » : l'environnement de Claude est limité par Commons.
//   node scripts/photos-commons.mjs chercher "slug|Nom,slug|Nom…"   → planches de 4 candidates par ville
//   node scripts/photos-commons.mjs chercher "slug|Nom|requête;requête,…" → 8 candidates sur ces requêtes
//   node scripts/photos-commons.mjs prendre "slug|Fichier.jpg,…"     → télécharge en 1600 px + crédits
// Sortie : .github/photos-commons/ (planches à regarder, puis photos retenues et credits.json).
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const UA = 'jasonmarinho.com city photos (https://jasonmarinho.com/contact)'
const OUT = '.github/photos-commons'
const [mode, liste = ''] = process.argv.slice(2)
fs.mkdirSync(OUT, { recursive: true })
const wait = ms => new Promise(r => setTimeout(r, ms))
const strip = s => String(s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

async function api(params) {
  for (let i = 0; i < 5; i++) {
    const r = await fetch('https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ format: 'json', ...params }), { headers: { 'user-agent': UA } })
    if (r.status === 429 || r.status >= 500) { await wait(5000 * (i + 1)); continue }
    return r.json()
  }
  throw new Error('Commons indisponible')
}
async function download(url, file) {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { headers: { 'user-agent': UA } })
    if (r.ok) { fs.writeFileSync(file, Buffer.from(await r.arrayBuffer())); return true }
    await wait(3000 * (i + 1))
  }
  return false
}
const LIBRE = /^(CC BY(-SA)? [0-9.]+|CC0|Public domain|PD)/i
const info = p => {
  const i = p.imageinfo?.[0], m = i?.extmetadata ?? {}
  return i && { titre: p.title, url: i.thumburl, page: i.descriptionurl, w: i.width, h: i.height, licence: strip(m.LicenseShortName?.value), auteur: strip(m.Artist?.value).slice(0, 80) }
}

if (mode === 'chercher') {
  for (const item of liste.split(',').filter(Boolean)) {
    // « slug|Nom » ou « slug|Nom|requête 1;requête 2 » (requêtes précises : monuments, vues)
    const [slug, nom, propres] = item.split('|')
    const max = propres ? 8 : 4
    const recherches = propres ? propres.split(';') : [`incategory:"Quality images of ${nom}"`, `"${nom}" panorama filew:>2000`, `"${nom}" ville vue filew:>2000`]
    const vus = new Map()
    for (const q of recherches) {
      const j = await api({ action: 'query', generator: 'search', gsrnamespace: '6', gsrlimit: '15', gsrsearch: q, prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: '480' })
      for (const p of Object.values(j.query?.pages ?? {}).sort((a, b) => a.index - b.index)) {
        const x = info(p)
        if (!x || vus.has(x.titre) || x.w < 1600 || x.w < x.h * 1.2 || !LIBRE.test(x.licence) || !/\.jpe?g$/i.test(x.titre)) continue
        vus.set(x.titre, x)
      }
      if (vus.size >= max) break
      await wait(1500)
    }
    const c = [...vus.values()].slice(0, max)
    console.log(`${slug} : ${c.length} candidate(s)`)
    const files = []
    for (const [k, x] of c.entries()) {
      const f = `${OUT}/${slug}-${k + 1}.jpg`
      if (await download(x.url, f)) { files.push(f); console.log(`  ${k + 1}. ${x.titre} | ${x.licence} | ${x.auteur}`) }
      await wait(800)
    }
    if (files.length) execFileSync('montage', [...files.flatMap(f => ['-label', f.split('/').pop(), f]), '-geometry', '420x260+4+4', '-tile', '4x', '-pointsize', '16', `${OUT}/planche-${slug}.jpg`])
    for (const f of files) fs.unlinkSync(f)
    fs.writeFileSync(`${OUT}/candidats-${slug}.json`, JSON.stringify(c, null, 1))
    await wait(1500)
  }
}

if (mode === 'prendre') {
  const credits = fs.existsSync(`${OUT}/credits.json`) ? JSON.parse(fs.readFileSync(`${OUT}/credits.json`, 'utf8')) : {}
  for (const item of liste.split(',').filter(Boolean)) {
    const [slug, n] = item.split('|')
    const x = JSON.parse(fs.readFileSync(`${OUT}/candidats-${slug}.json`, 'utf8'))[Number(n) - 1]
    const j = await api({ action: 'query', titles: x.titre, prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1600' })
    const p = Object.values(j.query.pages)[0]
    const y = info(p)
    if (await download(y.url, `${OUT}/${slug}.jpg`)) { credits[slug] = { titre: y.titre, page: y.page, licence: y.licence, auteur: y.auteur }; console.log(`${slug} : ${y.titre} | ${y.licence} | ${y.auteur}`) }
    await wait(1500)
  }
  fs.writeFileSync(`${OUT}/credits.json`, JSON.stringify(credits, null, 1))
}
