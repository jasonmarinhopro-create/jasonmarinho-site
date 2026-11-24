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
// --repeat N (24/11/2026) : chaque page ouverte N fois, pour distinguer une
// lenteur réelle d'un premier chargement à froid (1re ouverture vs suivantes).
const REPEAT = Math.max(1, Number(opt('--repeat', '1')) || 1)
// Relevé des requêtes de pages (RSC) faites par la page affichée (24/11/2026) :
// quelles autres pages elle fait calculer au serveur (préchargements des liens).
const NET = process.argv.includes('--net')
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
  // --only : morceau d'adresse, ou « =/dashboard » pour une adresse exacte
  return routes.filter(r => !ONLY.length || ONLY.some(o => (o.startsWith('=') ? r === o.slice(1) : r.includes(o))))
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
// Les écrans choisis par l'adresse (onglet, leçon, étape, fin) gardent ces paramètres
const SCREEN_KEYS = ['onglet', 'lecon', 'etape', 'fin', 'view']
const pattern = u => {
  const x = new URL(u)
  const q = [...x.searchParams].filter(([k]) => SCREEN_KEYS.includes(k)).map(([k, v]) => `${k}=${v}`).join('&')
  return x.pathname.replace(/\/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, '/[id]').replace(/\/\d{2,}(?=\/|$)/g, '/[n]') + (q ? `?${q}` : '')
}

// Écrans du dashboard qui ne sont pas des pages à part (24/11/2026) : onglets
// de l'espace Formations, étapes d'une leçon, écran de fin. Ajoutés quand le
// filtre --only les vise. Lecture seule comme le reste.
const EXTRA_APP_SCREENS = [
  '/dashboard/formations?onglet=parcours',
  '/dashboard/formations?onglet=catalogue',
  '/dashboard/formations?onglet=moi',
  '/dashboard/formations/mettre-le-bon-prix-lcd?lecon=1&etape=0',
  '/dashboard/formations/mettre-le-bon-prix-lcd?lecon=1&etape=2',
  '/dashboard/formations/google-my-business-lcd?lecon=5&etape=1',
  '/dashboard/formations/annonce-directe?lecon=5&etape=1',
  '/dashboard/formations/mettre-le-bon-prix-lcd?fin=1',
]

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
    const extras = EXTRA_APP_SCREENS.filter(r => ONLY.length && ONLY.some(o => (o.startsWith('=') ? r === o.slice(1) : r.includes(o))))
    jobs.push(...extras.map(r => 'https://app.jasonmarinho.com' + r))
    if (REPEAT > 1) { const once = [...jobs]; for (let k = 1; k < REPEAT; k++) jobs.push(...once) }
  }
  const seenPass = new Map()
  const netLog = []
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
      const pass = (seenPass.get(u) ?? 0) + 1
      seenPass.set(u, pass)
      const t0 = Date.now()
      // Page neuve à chaque adresse : une redirection côté navigateur de la
      // page précédente ne peut plus interrompre la suivante (1er audit du 20/11)
      const page = await ctx.newPage()
      const rsc = []
      if (NET && MODE === 'app') {
        page.on('request', req => {
          const h = req.headers()
          if (!h['rsc'] && !h['next-router-prefetch']) return
          rsc.push(`${pattern(req.url())}${h['next-router-prefetch'] ? ' (préchargement)' : ''}`)
        })
      }
      try {
        await page.setViewportSize({ width: WIDTHS[0], height: 900 })
        let resp = await page.goto(u, { waitUntil: 'load', timeout: 60_000 }).catch(async e => {
          if (!/interrupted by another navigation/.test(String(e))) throw e
          await page.waitForLoadState('load', { timeout: 60_000 }); return null
        })
        const ttfb = await page.evaluate(() => Math.round(performance.getEntriesByType('navigation')[0]?.responseStart ?? 0)).catch(() => 0)
        let readyMs = 0
        if (MODE === 'app') {
          // Temps d'affichage réel : jusqu'à la fin des squelettes (pages lentes quand la base l'est)
          const ready = await page.waitForFunction(() => document.body && !document.querySelector('[data-page-skel], [aria-busy="true"]') && !document.querySelector('.jm-splash:not(.jm-splash--out)'), null, { timeout: 45_000 }).then(() => true).catch(() => false)
          readyMs = Date.now() - t0
          if (!ready) stuck.add(pattern(u))
        }
        // Redirection côté navigateur juste après le chargement : attendre qu'elle se termine
        // (non compté dans le temps d'affichage : certaines pages interrogent le serveur en continu)
        await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {})
        if (MODE === 'app') {
          await page.waitForFunction(() => document.body && !document.querySelector('[data-page-skel], [aria-busy="true"]'), null, { timeout: 20_000 }).catch(() => {})
          if (new URL(page.url()).pathname.startsWith('/auth')) throw new Error('session refusée par le dashboard')
        }
        await page.evaluate(() => document.fonts.ready)
        await page.waitForTimeout(500)
        const loadMs = readyMs || (Date.now() - t0)
        // Pages de détail : une seule par modèle d'adresse, prise dans la liste
        if (MODE === 'app' && !dynamicFrom.has(u) && !ONLY.every(o => o.startsWith('='))) {
          dynamicFrom.add(u)
          const links = await page.evaluate(() => [...document.querySelectorAll('a[href^="/dashboard/"]')].map(a => a.getAttribute('href')).filter(h => /\/[0-9a-f]{8}-[0-9a-f-]{27,}|\/\d{2,}(\/|$)/i.test(h) && !h.includes('?')))
          for (const h of links) { const full = 'https://app.jasonmarinho.com' + h; const k = pattern(full); if (!dynamicSeen.has(k)) { dynamicSeen.add(k); jobs.push(full) } }
        }
        // Ouvertures suivantes : seul le temps compte (les défauts sont déjà relevés)
        if (pass > 1) { results.push({ u: MODE === 'app' ? pattern(page.url()) : page.url(), w: 0, pass, status: resp?.status(), ttfb, loadMs, timing: true }); await page.close().catch(() => {}); continue }
        if (NET && MODE === 'app') netLog.push({ u: pattern(u), rsc: [...rsc] })
        for (const w of WIDTHS) {
          if (w !== WIDTHS[0]) { await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(450) }
          const r = await page.evaluate(`(${detect.toString()})(true)`)
          for (const c of [...r.cut, ...r.clipped]) c.text = publicText(c.text)
          for (const o of r.overlap) { o.ta = publicText(o.ta); o.tb = publicText(o.tb) }
          r.overflow = r.overflow.filter(o => !IGNORE.some(re => re.test(o.el)))
          results.push({ u: MODE === 'app' ? pattern(page.url()) : page.url(), w, pass, status: resp?.status(), ttfb, loadMs, ...r })
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
  // Ouvertures répétées : un seul navigateur, pour que la 2e ouverture suive vraiment la 1re
  await Promise.all(Array.from({ length: REPEAT > 1 ? 1 : CONC }, worker))
  await browser.close()
  await closeSession()
  report(results, stuck)
  if (NET) {
    const lines = ['### Requêtes de pages faites par chaque page (--net)', '']
    for (const n of netLog) lines.push(`- ${n.u} : ${n.rsc.length ? n.rsc.join(', ') : 'aucune'}`)
    console.log(lines.join('\n'))
  }
}

function report(results, stuck = new Set()) {
  if (OUT) fs.writeFileSync(OUT, JSON.stringify(results, null, 1))
  const lines = []
  const timings = results.filter(r => r.timing)
  const ok = results.filter(r => !r.error && !r.timing)
  const bad = ok.filter(r => r.docOverflow || r.overflow.length || r.cut.length || r.overlap.length || r.clipped.some(c => c.how === 'coupé' || c.how === 'coupé-bas'))
  lines.push(`## Audit responsive (${MODE === 'app' ? 'dashboard' : 'site'})`, '')
  lines.push(`${new Set(ok.map(r => r.u)).size} pages, ${ok.length} contrôles (largeurs ${WIDTHS.join(', ')} px), ${bad.length} avec défaut, ${results.filter(r => r.error).length} erreur(s).`, '')
  if (MODE === 'app') {
    const times = [...new Map(ok.map(r => [r.u, r])).values()].sort((a, b) => b.loadMs - a.loadMs)
    lines.push('### Pages les plus lentes à s’afficher (chargement complet)', '', '| Page | 1er octet | Affichée |', '|---|---|---|')
    for (const r of times.slice(0, 12)) lines.push(`| ${r.u} | ${(r.ttfb / 1000).toFixed(1)} s | ${(r.loadMs / 1000).toFixed(1)} s |`)
    lines.push('')
    if (REPEAT > 1) {
      const firstByU = new Map(ok.map(r => [r.u, r]))
      lines.push(`### Ouvertures successives (--repeat ${REPEAT})`, '', `| Page | 1re ouverture | ${Array.from({ length: REPEAT - 1 }, (_, k) => `${k + 2}e ouverture`).join(' | ')} |`, `|---|---|${'---|'.repeat(REPEAT - 1)}`)
      for (const [u, f] of firstByU) {
        const next = Array.from({ length: REPEAT - 1 }, (_, k) => timings.find(t => t.u === u && t.pass === k + 2))
        lines.push(`| ${u} | ${(f.loadMs / 1000).toFixed(1)} s (1er octet ${(f.ttfb / 1000).toFixed(1)} s) | ${next.map(t => t ? `${(t.loadMs / 1000).toFixed(1)} s (1er octet ${(t.ttfb / 1000).toFixed(1)} s)` : '-').join(' | ')} |`)
      }
      lines.push('')
    }
    if (stuck.size) lines.push(`Squelette encore affiché après 45 s (page bloquée ou squelette jamais retiré) : ${[...stuck].join(', ')}`, '')
  }
  if (bad.length) {
    lines.push('### Défauts', '', '| Page | Largeur | Type | Où |', '|---|---|---|---|')
    for (const r of bad) {
      const items = []
      if (r.docOverflow) items.push(['défile de côté', `+${r.docOverflow} px`])
      for (const o of r.overflow.slice(0, 3)) items.push(['hors écran', `${o.el} (bord droit ${o.right} px)`])
      for (const c of r.cut.slice(0, 3)) items.push(['texte coupé', `${c.el} dans ${c.box} (cadre ${c.boxW} px, dépasse de ${c.dep} px)${c.text ? ` « ${c.text} »` : ''}${c.hint ? ` [${c.hint}]` : ''}`])
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
