// Compresse les scripts chargés sur toutes les pages du site (menu, pied de
// page, bandeau cookies) au moment du déploiement Vercel. Les fichiers du dépôt
// restent lisibles : seule la copie construite par Vercel est réduite.
// Avant (05/10/2026) : nav.js 64 Ko + footer.js 40 Ko envoyés tels quels.
//
// Tourne en dernier dans le buildCommand (après build-phosphor-subset.mjs, qui
// réécrit les `?v=` de nav.js). Hors Vercel, ne fait rien sauf avec --force
// (pour ne pas réduire les fichiers de travail par erreur). En cas d'échec,
// le fichier d'origine est gardé : le déploiement ne casse jamais pour ça.
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'

const FILES = ['nav.js', 'footer.js', 'cookie-banner.js']
const force = process.argv.includes('--force')
const dryRun = process.argv.includes('--dry-run')

if (!process.env.VERCEL && !force && !dryRun) {
  console.log('minify-assets : hors Vercel, rien à faire (--dry-run pour mesurer).')
  process.exit(0)
}

let esbuild
try {
  esbuild = await import('esbuild')
} catch {
  console.warn('minify-assets : esbuild absent, fichiers laissés tels quels.')
  process.exit(0)
}

for (const file of FILES) {
  try {
    const src = await readFile(file, 'utf8')
    const { code } = await esbuild.transform(src, {
      loader: 'js',
      minify: true,
      legalComments: 'none',
      charset: 'utf8',
    })
    // Contrôle : le résultat doit rester du JavaScript valide.
    new Function(code)
    const pct = Math.round((1 - code.length / src.length) * 100)
    console.log(`minify-assets : ${file} ${(src.length / 1024).toFixed(0)} Ko → ${(code.length / 1024).toFixed(0)} Ko (-${pct} %)`)
    if (!dryRun) await writeFile(file, code)
  } catch (err) {
    console.warn(`minify-assets : ${file} laissé tel quel (${err.message})`)
  }
}

// Cache d'un an pour ces 3 scripts (27/10/2026, PageSpeed : « durées de mise
// en cache efficaces », 31 Ko re-téléchargés toutes les heures). Chaque page
// les appelle avec ?v=<empreinte du contenu> ; vercel.json sert une URL qui
// porte ?v= en « immutable, 1 an ». Un script modifié change d'empreinte, donc
// d'URL : personne ne garde l'ancien. Sans ?v= (anciennes pages en cache),
// la règle d'une heure s'applique toujours.
if (!dryRun) {
  const version = {}
  for (const file of FILES) {
    try { version[file] = createHash('sha256').update(await readFile(file)).digest('hex').slice(0, 10) } catch {}
  }
  const SKIP = new Set(['node_modules', 'jason-app', '.git', '.vercel', 'scripts', 'data', 'docs', 'fonts'])
  async function* pages(dir) {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.') || SKIP.has(e.name)) continue
      const p = join(dir, e.name)
      if (e.isDirectory()) yield* pages(p)
      else if (e.name.endsWith('.html')) yield p
    }
  }
  const REF = /src="\/(nav|footer|cookie-banner)\.js(?:\?v=[A-Za-z0-9]+)?"/g
  let n = 0
  for await (const page of pages('.')) {
    const html = await readFile(page, 'utf8')
    const out = html.replace(REF, (m, name) => version[`${name}.js`] ? `src="/${name}.js?v=${version[`${name}.js`]}"` : m)
    if (out !== html) { await writeFile(page, out); n++ }
  }
  console.log(`minify-assets : scripts versionnés (${Object.entries(version).map(([f, v]) => `${f}=${v}`).join(', ')}) dans ${n} page(s)`)
}
