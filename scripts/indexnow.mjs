#!/usr/bin/env node
// IndexNow (23/11/2026, Jason : « lance IndexNow ») : prévient Bing, Yandex,
// Naver, Seznam, Yep (et les moteurs qui partagent le protocole) des pages
// nouvelles ou modifiées. Google ne participe pas à IndexNow.
// Clé publique : fichier /865bcb5953fc837fdc237ea257a83fb9.txt à la racine du site (elle n'a rien de
// secret, le protocole demande qu'elle soit lisible par les moteurs).
//
// Passage quotidien (workflow « IndexNow ») sans état :
//  - pages modifiées dans les commits de main des 26 dernières heures
//    (couvre aussi les publications des robots, qui ne déclenchent pas de
//    workflow au push) ;
//  - adresses des sitemaps en ligne dont lastmod date d'hier ou d'aujourd'hui
//    (fiches des pros, générées au déploiement, hors du dépôt).
// Seules les adresses présentes dans un sitemap en ligne sont envoyées
// (pages indexables, adresse canonique).
//   node scripts/indexnow.mjs [--tout] [--a-blanc]
//   --tout : toutes les adresses des sitemaps (premier envoi)
//   --a-blanc : compte sans rien envoyer
// Journal en nombres seulement (dépôt public).
import { execSync } from 'node:child_process'

const HOST = 'jasonmarinho.com'
const KEY = '865bcb5953fc837fdc237ea257a83fb9'
const SITEMAPS = ['sitemap.xml', 'sitemap-photographes.xml', 'sitemap-menages.xml', 'sitemap-depannage.xml', 'sitemap-signalements.xml']
const TOUT = process.argv.includes('--tout')
const A_BLANC = process.argv.includes('--a-blanc')
const pause = ms => new Promise(r => setTimeout(r, ms))

async function lire(url, essais = 4) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(20_000) })
      if (res.ok) return await res.text()
      if (res.status < 500 || i >= essais) throw new Error(`HTTP ${res.status}`)
    } catch (e) {
      if (i >= essais) throw e
    }
    await pause(2_000 * i)
  }
}

/** Adresses des sitemaps en ligne avec leur lastmod. Échoue plutôt que d'envoyer une liste vide. */
async function sitemaps() {
  const map = new Map()
  for (const s of SITEMAPS) {
    const xml = await lire(`https://${HOST}/${s}`)
    for (const m of xml.matchAll(/<url>[\s\S]*?<loc>([^<]+)<\/loc>(?:[\s\S]*?<lastmod>([^<]+)<\/lastmod>)?[\s\S]*?<\/url>/g)) map.set(m[1].trim(), (m[2] || '').slice(0, 10))
    await pause(300)
  }
  if (map.size < 100) throw new Error(`Sitemaps incomplets (${map.size} adresses) : rien envoyé`)
  return map
}

/** Fichier HTML du dépôt vers adresse publique (cleanUrls, sans barre finale) */
export function fichierVersUrl(f) {
  if (!f.endsWith('.html')) return null
  let p = '/' + f.replace(/\.html$/, '').replace(/(^|\/)index$/, '')
  p = p.replace(/\/$/, '') || '/'
  return p === '/' ? `https://${HOST}/` : `https://${HOST}${p}`
}

function changementsGit() {
  try {
    const out = execSync('git log --since="26 hours ago" --name-only --pretty=format: -- "*.html"', { encoding: 'utf8' })
    return new Set(out.split('\n').map(s => s.trim()).filter(Boolean).map(fichierVersUrl).filter(Boolean))
  } catch { return new Set() }
}

async function main() {
  const plan = await sitemaps()
  let urls
  if (TOUT) urls = [...plan.keys()]
  else {
    const jour = d => new Date(Date.now() - d * 86400_000).toISOString().slice(0, 10)
    const recents = new Set([jour(0), jour(1)])
    const set = new Set([...changementsGit()].filter(u => plan.has(u)))
    for (const [u, lm] of plan) if (recents.has(lm)) set.add(u)
    urls = [...set]
  }
  console.log(`Sitemaps : ${plan.size} adresses ; à envoyer : ${urls.length}${TOUT ? ' (toutes)' : ''}`)
  if (!urls.length || A_BLANC) return

  for (let i = 0; i < urls.length; i += 10_000) {
    const lot = urls.slice(i, i + 10_000)
    let res
    for (let essai = 1; essai <= 4; essai++) {
      try {
        res = await fetch('https://api.indexnow.org/indexnow', {
          method: 'POST', cache: 'no-store',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: lot }),
          signal: AbortSignal.timeout(30_000),
        })
        if (res.status < 500) break
      } catch (e) { if (essai === 4) throw e }
      await pause(3_000 * essai)
    }
    if (res.status === 200 || res.status === 202) console.log(`IndexNow : ${lot.length} adresses acceptées (HTTP ${res.status})`)
    else if (res.status === 429) console.log(`::warning::IndexNow : trop de demandes (HTTP 429), nouvel essai au prochain passage`)
    else throw new Error(`IndexNow a refusé l'envoi (HTTP ${res.status}) : vérifier le fichier de clé`)
  }
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  main().catch(e => { console.error(`Échec : ${e.message}`); process.exit(1) })
}
