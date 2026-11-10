#!/usr/bin/env node
// Audit du fil d'Ariane et des liens de ville (étape 1 de la feuille de route
// « géographie, pied de page et fil d'Ariane », validée par Jason le 09/11/2026).
// Ne modifie aucune page : relit toutes les pages du site statique et note,
// pour chacune, son fil d'Ariane balisé (JSON-LD BreadcrumbList), son fil
// visible, et les liens du fil qui ne mènent à aucune page existante.
//
//   node scripts/audit-fil-ariane.mjs            → résumé
//   node scripts/audit-fil-ariane.mjs --write    → écrit aussi la référence
//     scripts/data/audit/fil-ariane.json, comparée après chaque étape
//   node scripts/audit-fil-ariane.mjs --diff     → écarts avec la référence
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const REF = path.join(ROOT, 'scripts', 'data', 'audit', 'fil-ariane.json')
const SKIP = new Set(['jason-app', 'node_modules', '.git', '.github', '.vercel', 'scripts', 'docs', 'data', 'api'])
const SITE = 'https://jasonmarinho.com'

function pages(dir = ROOT, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') && e.isDirectory()) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) { if (!(dir === ROOT && SKIP.has(e.name))) pages(p, out) }
    else if (e.name === 'index.html' || (dir === ROOT && e.name.endsWith('.html'))) out.push(p)
  }
  return out
}

/** /photographe-lcd-lyon/index.html → /photographe-lcd-lyon ; /index.html → / */
function urlOf(file) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/')
  if (rel === 'index.html') return '/'
  return '/' + rel.replace(/\/index\.html$/, '').replace(/\.html$/, '')
}

const decode = s => s.replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')

/** Fil balisé : la première BreadcrumbList trouvée dans les blocs JSON-LD */
export function jsonLdCrumbs(html) {
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    let data
    try { data = JSON.parse(m[1]) } catch { continue }
    const stack = [data]
    while (stack.length) {
      const x = stack.pop()
      if (!x || typeof x !== 'object') continue
      if (Array.isArray(x)) { stack.push(...x); continue }
      if (x['@type'] === 'BreadcrumbList' && Array.isArray(x.itemListElement)) {
        return x.itemListElement
          .slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map(i => ({ name: String(i.name ?? i.item?.name ?? ''), url: typeof i.item === 'string' ? i.item : (i.item?.['@id'] ?? null) }))
      }
      if (x['@graph']) stack.push(x['@graph'])
    }
  }
  return null
}

/** Fil visible : un <nav>, <div> ou <ol> marqué « breadcrumb » ou « fil d'Ariane » */
export function visibleCrumbs(html) {
  const m = html.match(/<(nav|div|ol)\b[^>]*(?:class="(?:[^"]*\s)?(?:breadcrumb|crumbs?|ariane|brd)[\s"]|aria-label="[^"]*(?:ariane|breadcrumb)[^"]*")[^>]*>([\s\S]*?)<\/\1>/i)
  if (!m) return null
  const parts = []
  for (const t of m[2].matchAll(/<(a|span)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const txt = decode(t[2].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()
    if (txt) parts.push(txt)
  }
  return parts
}

const toPath = u => {
  if (!u) return null
  const s = u.startsWith(SITE) ? u.slice(SITE.length) || '/' : u
  return s.replace(/[?#].*$/, '').replace(/\/$/, '') || '/'
}

export function audit() {
  const files = pages()
  const known = new Set(files.map(urlOf))
  const rows = []
  for (const f of files.sort()) {
    const html = fs.readFileSync(f, 'utf8')
    const url = urlOf(f)
    if (/<meta[^>]+name="robots"[^>]+noindex/i.test(html) && !/BreadcrumbList/.test(html)) {
      rows.push({ url, noindex: true }); continue
    }
    const ld = jsonLdCrumbs(html)
    const vis = visibleCrumbs(html)
    const broken = (ld ?? []).slice(0, -1).map(c => toPath(c.url)).filter(p => p && !known.has(p))
    rows.push({ url, ld: ld ? ld.map(c => c.name) : null, ldUrls: ld ? ld.map(c => toPath(c.url)) : null, visible: vis, broken })
  }
  return rows
}

function summary(rows) {
  const idx = rows.filter(r => !r.noindex)
  const kind = u => (u.match(/^\/(photographe-lcd|menage-lcd|depannage-lcd|devenir-hote-airbnb)-/) || [])[1]
    || (u.startsWith('/blog/') ? 'blog' : u.startsWith('/services/simulateurs/') ? 'simulateurs' : 'autres')
  const by = {}
  for (const r of idx) {
    const k = kind(r.url)
    by[k] ||= { pages: 0, sansBalise: 0, sansVisible: 0, liensMorts: 0, profondeurs: {} }
    const b = by[k]
    b.pages++
    if (!r.ld) b.sansBalise++
    if (!r.visible) b.sansVisible++
    if (r.broken.length) b.liensMorts++
    const d = r.ld ? r.ld.length : 0
    b.profondeurs[d] = (b.profondeurs[d] ?? 0) + 1
  }
  return { pages: rows.length, noindex: rows.length - idx.length, parType: by }
}

const args = new Set(process.argv.slice(2))
if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = audit()
  const s = summary(rows)
  console.log(`${s.pages} pages, dont ${s.noindex} en noindex sans fil`)
  for (const [k, b] of Object.entries(s.parType).sort((a, b) => b[1].pages - a[1].pages)) {
    const prof = Object.entries(b.profondeurs).map(([d, n]) => `${d} niv. : ${n}`).join(', ')
    console.log(`  ${k.padEnd(20)} ${String(b.pages).padStart(4)} pages | sans fil balisé ${b.sansBalise} | sans fil visible ${b.sansVisible} | liens morts ${b.liensMorts} | ${prof}`)
  }
  const dead = rows.filter(r => r.broken?.length)
  for (const r of dead.slice(0, 15)) console.log(`  lien mort dans ${r.url} : ${r.broken.join(', ')}`)
  if (args.has('--write')) {
    fs.mkdirSync(path.dirname(REF), { recursive: true })
    fs.writeFileSync(REF, JSON.stringify({ releve: new Date().toISOString().slice(0, 10), resume: s, pages: rows }, null, 1) + '\n')
    console.log(`Référence écrite : ${path.relative(ROOT, REF)}`)
  }
  if (args.has('--diff')) {
    const ref = JSON.parse(fs.readFileSync(REF, 'utf8'))
    const before = new Map(ref.pages.map(r => [r.url, r]))
    let n = 0
    for (const r of rows) {
      const b = before.get(r.url)
      const changed = !b ? 'nouvelle page' : JSON.stringify(b.ld) !== JSON.stringify(r.ld) ? `balisé : ${b.ld?.join(' › ')} → ${r.ld?.join(' › ')}`
        : JSON.stringify(b.visible) !== JSON.stringify(r.visible) ? `visible : ${b.visible?.join(' › ')} → ${r.visible?.join(' › ')}` : null
      if (changed) { n++; if (n <= 40) console.log(`  ${r.url} : ${changed}`) }
    }
    for (const u of before.keys()) if (!rows.some(r => r.url === u)) { n++; console.log(`  ${u} : page disparue`) }
    console.log(`${n} écart(s) avec la référence du ${ref.releve}`)
  }
}
