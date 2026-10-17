// Vidéo de la fiche d'exemple (17/10/2026, Jason : « pour Camille, mets une
// vidéo libre de droit »). L'environnement de Claude ne joint pas les banques
// de vidéos : ce script tourne dans le workflow « Vidéo de la fiche d'exemple ».
//   node scripts/video-exemple.mjs chercher <mots>   → candidats Wikimedia Commons
//      (licences libres seulement : CC0, domaine public, CC BY, CC BY-SA), en annotations
//   node scripts/video-exemple.mjs prendre "<File:…>" → télécharge l'original dans /tmp/source
//      et écrit img/exemple-fiches/video-camille.json (titre, auteur, licence, lien)
import fs from 'node:fs'

const API = 'https://commons.wikimedia.org/w/api.php'
const UA = { 'User-Agent': 'jasonmarinho-site/1.0 (contact@jasonmarinho.com)' }
const strip = s => String(s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
const LIBRE = /^(cc0|public domain|pd|cc by(-sa)? [\d.]+|cc by(-sa)?)$/i

async function info(params) {
  const u = new URL(API)
  for (const [k, v] of Object.entries({ format: 'json', action: 'query', prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', ...params })) u.searchParams.set(k, v)
  const r = await fetch(u, { headers: UA })
  if (!r.ok) throw new Error(`Commons ${r.status}`)
  return Object.values((await r.json()).query?.pages ?? {})
}

const [mode, ...rest] = process.argv.slice(2)
if (mode === 'chercher') {
  const pages = await info({ generator: 'search', gsrsearch: `filetype:video ${rest.join(' ')}`, gsrnamespace: '6', gsrlimit: '40' })
  // Une seule annotation par recherche (GitHub n'en garde que 10 par étape)
  const lines = []
  for (const p of pages) {
    const ii = p.imageinfo?.[0]; if (!ii) continue
    const m = ii.extmetadata ?? {}
    const lic = strip(m.LicenseShortName?.value)
    if (!LIBRE.test(lic) || (ii.width ?? 0) < 1280) continue
    lines.push(`${p.title} (${lic}, ${Math.round(ii.duration ?? 0)} s, ${ii.width}x${ii.height}, ${Math.round(ii.size / 1e6)} Mo)`)
  }
  console.log(`::notice title=${rest.join(' ')}::${lines.slice(0, 12).join(' %0A ') || 'aucune'}`)
} else if (mode === 'prendre') {
  const title = rest.join(' ')
  const [p] = await info({ titles: title })
  const ii = p?.imageinfo?.[0]
  if (!ii) throw new Error(`introuvable : ${title}`)
  const m = ii.extmetadata ?? {}
  const lic = strip(m.LicenseShortName?.value)
  if (!LIBRE.test(lic)) throw new Error(`licence non libre : ${lic}`)
  const r = await fetch(ii.url, { headers: UA })
  if (!r.ok) throw new Error(`téléchargement ${r.status}`)
  fs.writeFileSync('/tmp/source', Buffer.from(await r.arrayBuffer()))
  fs.mkdirSync('img/exemple-fiches', { recursive: true })
  const credit = { titre: title.replace(/^File:/, ''), auteur: strip(m.Artist?.value), licence: lic, lien: ii.descriptionurl }
  fs.writeFileSync('img/exemple-fiches/video-camille.json', JSON.stringify(credit, null, 2) + '\n')
  console.log(`::notice title=Source::${lic} | ${credit.auteur} | ${Math.round(ii.size / 1e6)} Mo`)
} else {
  throw new Error('mode : chercher ou prendre')
}
