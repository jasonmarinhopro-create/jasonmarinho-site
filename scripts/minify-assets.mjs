// Compresse les scripts chargés sur toutes les pages du site (menu, pied de
// page, bandeau cookies) au moment du déploiement Vercel. Les fichiers du dépôt
// restent lisibles : seule la copie construite par Vercel est réduite.
// Avant (05/10/2026) : nav.js 64 Ko + footer.js 40 Ko envoyés tels quels.
//
// Tourne en dernier dans le buildCommand (après build-phosphor-subset.mjs, qui
// réécrit les `?v=` de nav.js). Hors Vercel, ne fait rien sauf avec --force
// (pour ne pas réduire les fichiers de travail par erreur). En cas d'échec,
// le fichier d'origine est gardé : le déploiement ne casse jamais pour ça.
import { readFile, writeFile } from 'node:fs/promises'

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
