#!/usr/bin/env node
// Audit responsive automatique (20/11/2026, docs/claude/responsive.md).
// Ouvre les pages dans Chromium à plusieurs largeurs et liste : page qui
// défile de côté, éléments hors écran, textes coupés, textes qui se
// chevauchent. Pour toute nouvelle page ou tout nouveau composant : le lancer
// avant de pousser, viser zéro défaut.
//
// Site vitrine (public) :
//   node scripts/audit-responsive.mjs --site [--base http://localhost:8088] [--only blog,services] [--widths 320,375,768,1024,1280,1920]
//   (serveur local : python3 -m http.server 8088 à la racine du dépôt)
//
// Dashboard (pages connectées), workflow « Audit responsive » seulement :
//   node scripts/audit-responsive.mjs --app [--only admin,finances]
//   Variables : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (SUPABASE_ANON_KEY facultative),
//   AUDIT_EMAIL (compte à utiliser, sinon le compte administrateur de Jason).
//   Session ouverte sans e-mail (lien magique généré puis vérifié côté
//   serveur), LECTURE SEULE : toute requête autre que GET est bloquée dans le
//   navigateur (aucun bouton, aucune action serveur, aucun « vu »). Résultat
//   sans aucun texte de la page (comptes réels) : sélecteurs et adresses avec
//   les identifiants remplacés par [id].
//
// Sortie : tableau Markdown (stdout et résumé du workflow) + JSON (--out).
// Playwright requis (préinstallé dans l'environnement de Claude ; workflow :
// installé à la volée).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { detect } from './lib/audit-responsive-detect.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const args = process.argv.slice(2)
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d }
const MODE = args.includes('--app') ? 'app' : 'site'
const WIDTHS = (opt('--widths', MODE === 'app' ? '1920,1280,768,390,320' : '320,375,768,1024,1280,1920')).split(',').map(Number)
const ONLY = (opt('--only', '') || '').split(',').filter(Boolean)
const OUT = opt('--out', '')
const CONC = Number(opt('--conc', MODE === 'app' ? '2' : '6'))
const ADMIN_EMAIL = 'djason.marinho@gmail.com' // même constante que jason-app/lib/queries/profile.ts

// Faux positifs connus, jamais signalés
const IGNORE = [/form#hpf/] // piège à robots de /trouver-un-pro, volontairement hors écran

// ── Pages à ouvrir ──────────────────────────────────────────────────────────
function sitePages(base) {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8')
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace('https://jasonmarinho.com', base))
    .filter(u => !ONLY.length || ONLY.some(o => u.includes('/' + o)))
}

function appStaticRoutes() {
  const dir = path.join(ROOT, 'jason-app/app/dashboard')
  const routes = []
  const walk = d => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name === 'page.tsx') {
        const r = '/dashboard' + path.relative(dir, d).split(path.sep).filter(s => !/^\(.*\)$/.test(s)).map(s => '/' + s).join('')
        routes.push(r === '/dashboard/' ? '/dashboard' : r.replace(/\/$/, ''))
      }
    }
  }
  walk(dir)
  return routes.filter(r => !ONLY.length || ONLY.some(o => r.includes(o)))
}

// Mode app : un texte n'est cité que s'il figure déjà dans le code public de
// l'app (libellé d'interface). Un nom, un montant ou une adresse d'un compte
// n'y figure jamais : il n'apparaît pas dans le rapport.
let APP_SOURCE = null
function publicText(t) {
  if (!t) return ''
  if (MODE === 'site') return t
  if (APP_SOURCE === null) {
    const parts = []
    const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== '.next') walk(p) } else if (/\.(tsx?|md)$/.test(e.name)) parts.push(fs.readFileSync(p, 'utf8')) } }
    for (const d of ['jason-app/app', 'jason-app/components', 'jason-app/lib', 'jason-app/content']) if (fs.existsSync(path.join(ROOT, d))) walk(path.join(ROOT, d))
    APP_SOURCE = parts.join('\n')
  }
  const probe = t.slice(0, 24).trim()
  return probe.length >= 4 && APP_SOURCE.includes(probe) ? t : ''
}

// Adresse sans identifiant (rien de personnel dans le rapport)
const pattern = u => new URL(u).pathname.replace(/\/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, '/[id]').replace(/\/\d{2,}(?=\/|$)/g, '/[n]')

// ── Session du dashboard (mode app) ─────────────────────────────────────────
let closeSession = async () => {}
async function appSessionCookies() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '')
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  // Clé publique facultative : la clé de service est acceptée aussi par /verify
  const anon = process.env.SUPABASE_ANON_KEY || service
  if (!url || !service) throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis')
  const email = process.env.AUDIT_EMAIL || ADMIN_EMAIL
  // Lien magique généré côté serveur : aucun e-mail envoyé
  const gl = await fetch(`${url}/auth/v1/admin/generate_link`, {
    method: 'POST', headers: { apikey: service, Authorization: `Bearer ${service}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'magiclink', email }),
  })
  const link = await gl.json()
  const hashed = link?.hashed_token ?? link?.properties?.hashed_token
  if (!gl.ok || !hashed) throw new Error(`lien de session refusé (HTTP ${gl.status})`)
  const vr = await fetch(`${url}/auth/v1/verify`, {
    method: 'POST', headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'magiclink', token_hash: hashed }),
  })
  const session = await vr.json()
  if (!vr.ok || !session?.access_token) throw new Error(`session refusée (HTTP ${vr.status})`)
  session.expires_at ??= Math.floor(Date.now() / 1000) + (session.expires_in ?? 3600)
  closeSession = async () => {
    // Session de l'audit fermée à la fin (jamais laissée ouverte)
    await fetch(`${url}/auth/v1/logout?scope=local`, { method: 'POST', headers: { apikey: anon, Authorization: `Bearer ${session.access_token}` } }).catch(() => {})
  }
  // Même découpage que @supabase/ssr 0.3 (morceaux de 3 180 caractères encodés)
  const ref = new URL(url).hostname.split('.')[0]
  const name = `sb-${ref}-auth-token`
  let enc = encodeURIComponent(JSON.stringify(session))
  const parts = []
  while (enc.length) {
    let head = enc.slice(0, 3180)
    const esc = head.lastIndexOf('%')
    if (esc > 3180 - 3) head = head.slice(0, esc)
    parts.push(head); enc = enc.slice(head.length)
  }
  const base = { domain: 'app.jasonmarinho.com', path: '/', secure: true, sameSite: 'Lax' }
  return parts.length === 1 ? [{ name, value: parts[0], ...base }] : parts.map((v, i) => ({ name: `${name}.${i}`, value: v, ...base }))
}

// ── Audit ──────────────────────────────────────────────────────────────────
async function main() {
  const browser = await chromium.launch()
  const results = []
  let jobs
  let ctxOpts = {}
  let cookies = []
  if (MODE === 'site') {
    jobs = sitePages(opt('--base', 'https://jasonmarinho.com'))
  } else {
    cookies = await appSessionCookies()
    jobs = appStaticRoutes().filter(r => !r.includes('[')).map(r => 'https://app.jasonmarinho.com' + r)
  }
  const dynamicSeen = new Set()
  const dynamicFrom = new Set()

  async function worker() {
    const ctx = await browser.newContext(ctxOpts)
    if (cookies.length) await ctx.addCookies(cookies)
    await ctx.addInitScript(() => { try { localStorage.setItem('cookie_consent_v2', JSON.stringify({ essential: true, analytics: false, t: Date.now() })); localStorage.setItem('jm-last-seen-ping', String(Date.now())) } catch { /* ignore */ } })
    if (MODE === 'app') {
      // Lecture seule : rien d'autre que des lectures ne part du navigateur
      await ctx.route('**/*', route => (route.request().method() === 'GET' ? route.continue() : route.abort()))
    }
    while (jobs.length) {
      const u = jobs.shift()
      const t0 = Date.now()
      // Page neuve à chaque adresse : une redirection côté navigateur de la
      // page précédente ne peut plus interrompre la suivante (1er audit du 20/11)
      const page = await ctx.newPage()
      try {
        await page.setViewportSize({ width: WIDTHS[0], height: 900 })
        let resp = await page.goto(u, { waitUntil: 'load', timeout: 60_000 }).catch(async e => {
          if (!/interrupted by another navigation/.test(String(e))) throw e
          await page.waitForLoadState('load', { timeout: 60_000 }); return null
        })
        // Redirection côté navigateur juste après le chargement : attendre qu'elle se termine
        await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
        const ttfb = await page.evaluate(() => Math.round(performance.getEntriesByType('navigation')[0]?.responseStart ?? 0))
        if (MODE === 'app') {
          // Attendre la fin des squelettes (pages lentes quand la base l'est)
          const ready = await page.waitForFunction(() => document.body && !document.querySelector('[data-page-skel]') && !document.querySelector('.jm-splash:not(.jm-splash--out)'), null, { timeout: 45_000 }).then(() => true).catch(() => false)
          if (!ready) stuck.add(pattern(u))
          if (new URL(page.url()).pathname.startsWith('/auth')) throw new Error('session refusée par le dashboard')
        }
        await page.evaluate(() => document.fonts.ready)
        await page.waitForTimeout(500)
        const loadMs = Date.now() - t0
        // Pages de détail : une seule par modèle d'adresse, prise dans la liste
        if (MODE === 'app' && !dynamicFrom.has(u)) {
          dynamicFrom.add(u)
          const links = await page.evaluate(() => [...document.querySelectorAll('a[href^="/dashboard/"]')].map(a => a.getAttribute('href')).filter(h => /\/[0-9a-f]{8}-[0-9a-f-]{27,}|\/\d{2,}(\/|$)/i.test(h) && !h.includes('?')))
          for (const h of links) { const full = 'https://app.jasonmarinho.com' + h; const k = pattern(full); if (!dynamicSeen.has(k)) { dynamicSeen.add(k); jobs.push(full) } }
        }
        for (const w of WIDTHS) {
          if (w !== WIDTHS[0]) { await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(450) }
          const r = await page.evaluate(`(${detect.toString()})(true)`)
          for (const c of [...r.cut, ...r.clipped]) c.text = publicText(c.text)
          for (const o of r.overlap) { o.ta = publicText(o.ta); o.tb = publicText(o.tb) }
          r.overflow = r.overflow.filter(o => !IGNORE.some(re => re.test(o.el)))
          results.push({ u: MODE === 'app' ? pattern(page.url()) : page.url(), w, status: resp?.status(), ttfb, loadMs, ...r })
        }
      } catch (e) {
        results.push({ u: MODE === 'app' ? pattern(u) : u, w: 0, error: String(e.message || e).split('\n')[0].slice(0, 140) })
        if (String(e).includes('session refusée')) { jobs.length = 0 }
      }
      await page.close().catch(() => {})
      if (results.length % 60 === 0) process.stderr.write(`${results.length} contrôles\n`)
    }
    await ctx.close()
  }
  const stuck = new Set()
  await Promise.all(Array.from({ length: CONC }, worker))
  await browser.close()
  await closeSession()
  report(results, stuck)
}

function report(results, stuck = new Set()) {
  if (OUT) fs.writeFileSync(OUT, JSON.stringify(results, null, 1))
  const lines = []
  const ok = results.filter(r => !r.error)
  const bad = ok.filter(r => r.docOverflow || r.overflow.length || r.cut.length || r.overlap.length || r.clipped.some(c => c.how === 'coupé' || c.how === 'coupé-bas'))
  lines.push(`## Audit responsive (${MODE === 'app' ? 'dashboard' : 'site'})`, '')
  lines.push(`${new Set(ok.map(r => r.u)).size} pages, ${ok.length} contrôles (largeurs ${WIDTHS.join(', ')} px), ${bad.length} avec défaut, ${results.filter(r => r.error).length} erreur(s).`, '')
  if (MODE === 'app') {
    const times = [...new Map(ok.map(r => [r.u, r])).values()].sort((a, b) => b.loadMs - a.loadMs)
    lines.push('### Pages les plus lentes à s’afficher (chargement complet)', '', '| Page | 1er octet | Affichée |', '|---|---|---|')
    for (const r of times.slice(0, 12)) lines.push(`| ${r.u} | ${(r.ttfb / 1000).toFixed(1)} s | ${(r.loadMs / 1000).toFixed(1)} s |`)
    lines.push('')
    if (stuck.size) lines.push(`Squelette encore affiché après 45 s (page bloquée ou squelette jamais retiré) : ${[...stuck].join(', ')}`, '')
  }
  if (bad.length) {
    lines.push('### Défauts', '', '| Page | Largeur | Type | Où |', '|---|---|---|---|')
    for (const r of bad) {
      const items = []
      if (r.docOverflow) items.push(['défile de côté', `+${r.docOverflow} px`])
      for (const o of r.overflow.slice(0, 3)) items.push(['hors écran', `${o.el} (bord droit ${o.right} px)`])
      for (const c of r.cut.slice(0, 3)) items.push(['texte coupé', `${c.el} dans ${c.box} (cadre ${c.boxW} px, dépasse de ${c.dep} px)${c.text ? ` « ${c.text} »` : ''}`])
      for (const c of r.clipped.filter(c => c.how === 'coupé' || c.how === 'coupé-bas').slice(0, 3)) items.push(['texte masqué', `${c.el}${c.text ? ` « ${c.text} »` : ''}`])
      for (const o of r.overlap.slice(0, 3)) items.push(['chevauchement', `${o.a} / ${o.b}${o.ta ? ` « ${o.ta} » / « ${o.tb} »` : ''}`])
      for (const [t, w] of items) lines.push(`| ${r.u} | ${r.w} | ${t} | ${String(w).replace(/\|/g, '/')} |`)
    }
  }
  const errs = results.filter(r => r.error)
  if (errs.length) { lines.push('', '### Erreurs', ''); for (const e of errs.slice(0, 20)) lines.push(`- ${e.u} : ${e.error}`) }
  const md = lines.join('\n')
  console.log(md)
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n')
}

main().catch(e => { console.error('Audit impossible :', e.message); process.exit(1) })
