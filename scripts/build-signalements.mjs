#!/usr/bin/env node
/**
 * Build script — génère les pages publiques anonymisées des signalements
 * et le sitemap dédié. Lancé en prebuild Vercel via vercel.json.
 *
 * Si SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL ne sont pas
 * disponibles (build local sans .env), le script no-op proprement.
 * Pas d'erreur fatale : on ne casse jamais le build du site marketing.
 *
 * Lit la view `public_signalements_view` qui filtre strictement les
 * signalements approved + public_visible. Aucune fuite de PII possible
 * même si on commit le code par erreur.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'securite', 'signalements')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const HAS_SUPABASE = !!(SUPABASE_URL && SERVICE_KEY)

if (!HAS_SUPABASE) {
  console.log('[build-signalements] Env vars Supabase absentes — génération d\'un placeholder pour la liste publique uniquement.')
}

const MOIS_FR = ['', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

function escHtml(s) {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function fmtMonth(yyyyMm) {
  if (!yyyyMm) return ''
  const [y, m] = yyyyMm.split('-')
  const mi = parseInt(m, 10)
  if (!mi || mi < 1 || mi > 12) return ''
  return `${MOIS_FR[mi]} ${y}`
}

async function fetchSignalements() {
  if (!HAS_SUPABASE) return []
  const url = `${SUPABASE_URL}/rest/v1/public_signalements_view?select=*&order=created_at.desc&limit=2000`
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    console.warn(`[build-signalements] Supabase fetch failed (${res.status}): ${text}`)
    return []
  }
  return await res.json()
}

function buildFichePage(item) {
  const monthLabel = fmtMonth(item.month)
  const title = `${item.incident_type} · ${item.city ?? 'France'}${monthLabel ? ' · ' + monthLabel : ''}`
  const desc = `Signalement anonymisé : ${item.summary.slice(0, 150)}...`
  const canonical = `https://jasonmarinho.com/securite/signalements/${item.slug}`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(title)} | Signalement voyageur LCD — Jason Marinho</title>
<meta name="description" content="${escHtml(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${escHtml(title)}">
<meta property="og:description" content="${escHtml(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="article">
<meta property="og:image" content="https://jasonmarinho.com/couverture-jason.webp">
<meta property="og:site_name" content="Jason Marinho">
<meta name="robots" content="index, follow">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="96x96" href="/icon-96.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#004C3F">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,300;1,9..144,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<link rel="stylesheet" type="text/css" href="/fonts/phosphor-bold-subset.css">
<link rel="stylesheet" type="text/css" href="/fonts/phosphor-regular-subset.css">
<style>
:root{--g:#004C3F;--gd:#003329;--y:#FFD56B;--cr:#F7F5F0;--w:#FDFCF9;--td:#0F1A0D;--tm:#3D5038;--tl:#7A8C77}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;padding-top:64px;font-family:'Outfit',sans-serif;background:var(--w);color:var(--td)}
body::before{content:'';position:fixed;top:0;left:0;right:0;height:64px;background:var(--gd);z-index:100}
a{color:inherit}
.wrap{max-width:760px;margin:0 auto;padding:48px clamp(16px,5vw,40px)}
.brd{font-size:13px;color:var(--tl);margin-bottom:20px}
.brd a{color:var(--tm);text-decoration:none}
.brd a:hover{color:var(--g)}
.lbl{display:inline-block;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--g);background:rgba(0,76,63,.06);border:1px solid rgba(0,76,63,.15);border-radius:100px;padding:4px 12px;margin-bottom:14px}
h1{font-family:'Fraunces',serif;font-size:clamp(1.8rem,3.5vw,2.6rem);line-height:1.2;letter-spacing:-.02em;color:var(--td);margin:0 0 12px;font-weight:400}
.meta{display:flex;flex-wrap:wrap;gap:10px;font-size:13.5px;color:var(--tm);margin-bottom:32px}
.meta-it{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;background:#fff;border:1px solid rgba(0,76,63,.1);border-radius:100px}
.summary{background:#fff;border:1px solid rgba(0,76,63,.1);border-left:3px solid var(--g);border-radius:10px;padding:22px 24px;font-size:16px;line-height:1.75;color:var(--td);margin-bottom:32px}
.disclaimer{padding:16px 18px;background:rgba(0,76,63,.04);border:1px solid rgba(0,76,63,.12);border-radius:10px;font-size:13px;line-height:1.65;color:var(--tm);margin-bottom:36px}
.disclaimer strong{color:var(--td)}
.cta-box{background:linear-gradient(135deg,#001a11,var(--gd));border-radius:16px;padding:28px;text-align:center;color:#fff}
.cta-box h2{font-family:'Fraunces',serif;font-size:1.4rem;margin:0 0 8px;font-weight:400}
.cta-box em{color:var(--y);font-style:italic;font-weight:300}
.cta-box p{font-size:14px;color:rgba(255,255,255,.6);margin:0 0 18px;line-height:1.65}
.btn-p{display:inline-flex;align-items:center;gap:8px;background:var(--y);color:var(--gd);font-weight:600;font-size:14.5px;padding:12px 22px;border-radius:9px;text-decoration:none;transition:all .2s}
.btn-p:hover{background:#ffe08f}
.contest{margin-top:28px;text-align:center;font-size:13px;color:var(--tl)}
.contest a{color:var(--g);font-weight:500}
</style>
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: title,
  description: desc,
  datePublished: item.created_at,
  inLanguage: 'fr-FR',
  isPartOf: { '@type': 'WebSite', name: 'Jason Marinho', url: 'https://jasonmarinho.com' },
  publisher: { '@type': 'Organization', name: 'Jason Marinho', url: 'https://jasonmarinho.com' },
  mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
})}
</script>
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://jasonmarinho.com/' },
    { '@type': 'ListItem', position: 2, name: 'Sécurité', item: 'https://jasonmarinho.com/services/securite' },
    { '@type': 'ListItem', position: 3, name: 'Signalements publics', item: 'https://jasonmarinho.com/securite/signalements' },
    { '@type': 'ListItem', position: 4, name: title, item: canonical },
  ],
})}
</script>
<script defer src="/nav.js"></script>
</head>
<body>
<div class="wrap">
  <div class="brd"><a href="/">Accueil</a> · <a href="/services/securite">Sécurité</a> · <a href="/securite/signalements">Signalements publics</a> · <span>${escHtml(item.city ?? '')}</span></div>
  <span class="lbl">Signalement anonymisé</span>
  <h1>${escHtml(item.incident_type)}<br><em style="font-family:'Fraunces',serif;font-style:italic;font-weight:300;color:var(--g)">${escHtml(item.city ?? 'France')}${monthLabel ? ' · ' + monthLabel : ''}</em></h1>
  <div class="meta">
    <span class="meta-it"><i class="ph ph-map-pin"></i>${escHtml(item.city ?? 'France')}</span>
    ${monthLabel ? `<span class="meta-it"><i class="ph ph-calendar"></i>${escHtml(monthLabel)}</span>` : ''}
    <span class="meta-it"><i class="ph ph-shield-check"></i>Source : hôte vérifié</span>
  </div>
  <div class="summary">${escHtml(item.summary)}</div>
  <div class="disclaimer">
    <strong>Important.</strong> Ce signalement émane d'un hôte vérifié de la communauté Jason Marinho. Le profil est <strong>strictement anonymisé</strong> : aucun nom complet, email, téléphone ou adresse n'est diffusé. Ce signalement n'a aucune valeur de jugement et ne constitue pas une accusation formelle. Pour les vrais nom, email et téléphone, accès réservé aux hôtes inscrits via le dashboard sécurisé.
  </div>
  <div class="cta-box">
    <h2>Vérifie ton voyageur<br><em>avant d'accepter</em></h2>
    <p>Crée ton compte hôte gratuit pour accéder à la base complète avec contacts vérifiés et alertes croisées.</p>
    <a href="https://app.jasonmarinho.com/auth/register" class="btn-p">Créer mon compte gratuit <i class="ph-bold ph-arrow-right"></i></a>
  </div>
  <p class="contest">Vous êtes la personne concernée par ce signalement et contestez son contenu ? <a href="/securite/contester-signalement?slug=${encodeURIComponent(item.slug)}">Demander le retrait sous 48h</a>.</p>
</div>
<script defer src="/footer.js"></script>
<script src="/cookie-banner.js" defer></script>
</body>
</html>
`
}

function buildListPage(items) {
  const itemsHtml = items.length === 0
    ? `<div class="empty-state">
        <div class="empty-ico"><i class="ph ph-shield-check"></i></div>
        <h2 class="empty-h">La base communautaire <em>démarre tout juste</em></h2>
        <p class="empty-p">Aucun signalement public à afficher pour le moment. Les hôtes de la communauté Jason Marinho commencent à alimenter cette base en signalant les voyageurs problématiques rencontrés. Reviens dans quelques jours, ou inscris-toi pour accéder à la base privée complète et contribuer.</p>
        <div class="empty-cta">
          <a href="https://app.jasonmarinho.com/auth/register" class="btn-p">Créer mon compte hôte gratuit <i class="ph-bold ph-arrow-right"></i></a>
          <a href="/services/securite" class="btn-ol">Comment ça marche</a>
        </div>
      </div>`
    : `<div class="grid">` + items.map(it => {
        const monthLabel = fmtMonth(it.month)
        return `<a href="/securite/signalements/${escHtml(it.slug)}" class="card">
  <div class="card-head"><span class="card-type">${escHtml(it.incident_type)}</span>${monthLabel ? `<span class="card-when">${escHtml(monthLabel)}</span>` : ''}</div>
  <div class="card-city"><i class="ph ph-map-pin"></i>${escHtml(it.city ?? 'France')}</div>
  <p class="card-sum">${escHtml(it.summary.slice(0, 220))}${it.summary.length > 220 ? '…' : ''}</p>
  <span class="card-cta">Lire le signalement <i class="ph-bold ph-arrow-right"></i></span>
</a>`
      }).join('\n') + `</div>`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Signalements voyageurs publics LCD · Base communauté | Jason Marinho</title>
<meta name="description" content="Base communautaire des signalements voyageurs Airbnb et Booking, anonymisés. ${items.length} signalements actifs partagés par les hôtes LCD pour alerter et protéger.">
<link rel="canonical" href="https://jasonmarinho.com/securite/signalements">
<meta property="og:title" content="Signalements voyageurs publics LCD · Base communauté">
<meta property="og:description" content="${items.length} signalements anonymisés partagés par les hôtes LCD.">
<meta property="og:url" content="https://jasonmarinho.com/securite/signalements">
<meta property="og:type" content="website">
<meta property="og:image" content="https://jasonmarinho.com/couverture-jason.webp">
<meta property="og:site_name" content="Jason Marinho">
<meta name="robots" content="index, follow">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="96x96" href="/icon-96.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#004C3F">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,300;1,9..144,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<link rel="stylesheet" type="text/css" href="/fonts/phosphor-bold-subset.css">
<link rel="stylesheet" type="text/css" href="/fonts/phosphor-regular-subset.css">
<style>
:root{--g:#004C3F;--gd:#003329;--y:#FFD56B;--cr:#F7F5F0;--w:#FDFCF9;--td:#0F1A0D;--tm:#3D5038;--tl:#7A8C77}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;padding-top:64px;font-family:'Outfit',sans-serif;background:var(--cr);color:var(--td)}
body::before{content:'';position:fixed;top:0;left:0;right:0;height:64px;background:var(--gd);z-index:100}
a{color:inherit}
.hero{background:linear-gradient(160deg,#001a11 0%,var(--gd) 55%,#00463a 100%);padding:clamp(56px,7vw,80px) 0}
.hero-in{max-width:1100px;margin:0 auto;padding:0 clamp(16px,5vw,60px)}
.brd{font-size:13px;color:rgba(255,255,255,.4);margin-bottom:24px}
.brd a{color:rgba(255,255,255,.5);text-decoration:none}
.brd a:hover{color:#fff}
.lbl{display:inline-block;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,213,107,.7);margin-bottom:14px}
h1{font-family:'Fraunces',serif;font-size:clamp(2rem,4vw,2.8rem);line-height:1.15;color:#fff;margin:0 0 16px;font-weight:400}
h1 em{color:var(--y);font-style:italic;font-weight:300}
.lead{font-size:16px;line-height:1.7;color:rgba(255,255,255,.6);margin:0 0 14px;max-width:640px}
.count-pill{display:inline-flex;align-items:center;gap:8px;background:rgba(255,213,107,.1);border:1px solid rgba(255,213,107,.25);border-radius:100px;padding:7px 16px;font-size:13.5px;font-weight:600;color:#FFD56B;margin-top:8px}
.list{max-width:1100px;margin:0 auto;padding:clamp(48px,6vw,72px) clamp(16px,5vw,60px)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}
.card{display:flex;flex-direction:column;gap:10px;padding:22px;background:#fff;border:1px solid rgba(0,76,63,.08);border-radius:14px;text-decoration:none;color:inherit;transition:transform .2s,box-shadow .2s,border-color .2s}
.card:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(0,76,63,.08);border-color:rgba(0,76,63,.18)}
.card-head{display:flex;justify-content:space-between;align-items:center;gap:8px}
.card-type{font-size:11px;font-weight:600;color:var(--g);background:rgba(0,76,63,.07);padding:3px 9px;border-radius:6px;letter-spacing:.3px}
.card-when{font-size:11.5px;color:var(--tl)}
.card-city{font-size:14px;color:var(--tm);font-weight:500;display:flex;align-items:center;gap:5px}
.card-city i{color:var(--g);font-size:14px}
.card-sum{font-size:13.5px;line-height:1.6;color:var(--tm);margin:4px 0 6px;flex:1}
.card-cta{font-size:12.5px;font-weight:600;color:var(--g);display:inline-flex;align-items:center;gap:5px;margin-top:auto}
.disclaimer{max-width:1100px;margin:0 auto;padding:0 clamp(16px,5vw,60px) clamp(48px,6vw,72px);font-size:12.5px;color:var(--tl);line-height:1.7}
.disclaimer strong{color:var(--td)}
.empty-state{background:#fff;border:1px solid rgba(0,76,63,.1);border-radius:18px;padding:clamp(36px,6vw,60px) clamp(24px,5vw,52px);text-align:center;max-width:680px;margin:0 auto}
.empty-ico{width:64px;height:64px;border-radius:18px;background:rgba(0,76,63,.07);display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px}
.empty-ico i{font-size:30px;color:var(--g)}
.empty-h{font-family:'Fraunces',serif;font-size:clamp(22px,2.4vw,28px);font-weight:400;color:var(--td);margin:0 0 12px;letter-spacing:-.3px;line-height:1.25}
.empty-h em{color:var(--g);font-style:italic;font-weight:300}
.empty-p{font-size:15px;line-height:1.75;color:var(--tm);margin:0 0 24px;max-width:520px;margin-left:auto;margin-right:auto}
.empty-cta{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.btn-p{display:inline-flex;align-items:center;gap:7px;background:var(--y);color:var(--gd);font-weight:600;font-size:14.5px;padding:12px 22px;border-radius:10px;text-decoration:none;transition:all .2s}
.btn-p:hover{background:#ffe08f;transform:translateY(-1px);box-shadow:0 8px 24px rgba(255,213,107,.3)}
.btn-ol{display:inline-flex;align-items:center;gap:7px;background:transparent;color:var(--g);border:1px solid rgba(0,76,63,.2);font-weight:500;font-size:14px;padding:11px 20px;border-radius:10px;text-decoration:none;transition:all .2s}
.btn-ol:hover{background:var(--g);color:#fff;border-color:var(--g)}
</style>
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Signalements voyageurs publics LCD',
  url: 'https://jasonmarinho.com/securite/signalements',
  description: 'Base communautaire des signalements voyageurs anonymisés.',
  inLanguage: 'fr-FR',
})}
</script>
<script defer src="/nav.js"></script>
</head>
<body>
<header class="hero">
  <div class="hero-in">
    <div class="brd"><a href="/">Accueil</a> · <a href="/services/securite">Sécurité</a> · <span>Signalements publics</span></div>
    <span class="lbl">Base communautaire LCD</span>
    <h1>Signalements voyageurs <em>partagés par les hôtes</em></h1>
    <p class="lead">Cette page liste les signalements anonymisés que la communauté Jason Marinho a choisi de rendre publics. Aucun nom complet, email, téléphone ou adresse précise n'est diffusé. Pour la base complète avec contacts vérifiés, créez votre compte hôte gratuit.</p>
    <span class="count-pill"><i class="ph-bold ph-shield-check"></i>${items.length} signalements actifs</span>
  </div>
</header>
<main class="list">
${itemsHtml}
</main>
<div class="disclaimer">
  <strong>Avertissement.</strong> Les profils signalés sont strictement anonymisés (prénom + initiale, ville, mois). Aucune accusation formelle, aucune valeur de jugement. Toute personne se reconnaissant peut demander le retrait sous 48h via le formulaire de contestation.
</div>
<script defer src="/footer.js"></script>
<script src="/cookie-banner.js" defer></script>
</body>
</html>
`
}

function buildSitemap(items) {
  const today = new Date().toISOString().slice(0, 10)
  const urls = [
    `  <url><loc>https://jasonmarinho.com/securite/signalements</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.7</priority></url>`,
    `  <url><loc>https://jasonmarinho.com/securite/contester-signalement</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.4</priority></url>`,
    ...items.map(it => {
      const lm = (it.created_at || today).slice(0, 10)
      return `  <url><loc>https://jasonmarinho.com/securite/signalements/${it.slug}</loc><lastmod>${lm}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>`
    }),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`
}

function injectCounter(approvedCount) {
  // Met à jour le compteur "X signalements" sur /services/securite/index.html
  // si le marqueur HTML existe. Pattern idempotent.
  const file = path.join(ROOT, 'services', 'securite', 'index.html')
  if (!fs.existsSync(file)) return
  const html = fs.readFileSync(file, 'utf8')
  const next = html.replace(
    /<!--SIGNALEMENTS_COUNT:START-->[\s\S]*?<!--SIGNALEMENTS_COUNT:END-->/g,
    `<!--SIGNALEMENTS_COUNT:START-->${approvedCount}<!--SIGNALEMENTS_COUNT:END-->`,
  )
  if (next !== html) {
    fs.writeFileSync(file, next, 'utf8')
    console.log(`[build-signalements] /services/securite/index.html → compteur mis à jour (${approvedCount})`)
  }
}

async function main() {
  const items = await fetchSignalements()
  console.log(`[build-signalements] ${items.length} signalement(s) publics récupérés.`)

  // Nettoyage des anciennes fiches : on supprime le dossier puis on regénère
  // (les `removed` n'apparaîtront plus dans la vue, donc plus dans /signalements/).
  // On garde la liste page et le sitemap même si 0 items.
  if (fs.existsSync(OUT_DIR)) {
    for (const entry of fs.readdirSync(OUT_DIR, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        fs.rmSync(path.join(OUT_DIR, entry.name), { recursive: true, force: true })
      }
    }
  } else {
    fs.mkdirSync(OUT_DIR, { recursive: true })
  }

  // Pages individuelles
  for (const item of items) {
    const dir = path.join(OUT_DIR, item.slug)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'index.html'), buildFichePage(item), 'utf8')
  }

  // Liste
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), buildListPage(items), 'utf8')

  // Sitemap dédié
  const sitemapPath = path.join(ROOT, 'sitemap-signalements.xml')
  fs.writeFileSync(sitemapPath, buildSitemap(items), 'utf8')

  // Compteur sur la page marketing
  injectCounter(items.length)

  console.log(`[build-signalements] ✓ ${items.length} fiches + liste + sitemap-signalements.xml générés.`)
}

main().catch(err => {
  console.error('[build-signalements] Erreur:', err)
  // Pas exit 1 — on ne bloque PAS le build du site marketing si le script foire.
  process.exit(0)
})
