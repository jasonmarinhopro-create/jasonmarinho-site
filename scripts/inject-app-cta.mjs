// Encadré « Dans l'app Jason Marinho » en fin de chaque article du blog
// (scripts/lib/app-cta.mjs). Idempotent : relancer après une régénération.
//   node scripts/inject-app-cta.mjs
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { injectAppCta, pickTool } from './lib/app-cta.mjs'

const BLOG = new URL('../blog', import.meta.url).pathname
let done = 0
const skipped = []
const byTool = {}
for (const slug of readdirSync(BLOG)) {
  const file = join(BLOG, slug, 'index.html')
  if (slug === 'categorie' || !existsSync(file)) continue
  const html = readFileSync(file, 'utf8')
  const title = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]?.replace(/<[^>]+>/g, '') || ''
  const out = injectAppCta(html, slug, title)
  if (!out) { skipped.push(slug); continue }
  if (out !== html) writeFileSync(file, out)
  const id = pickTool(slug, title).id
  byTool[id] = (byTool[id] || 0) + 1
  done++
}
console.log(`Encadré app : ${done} articles`, byTool)
if (skipped.length) console.log('Sans emplacement :', skipped.join(', '))
