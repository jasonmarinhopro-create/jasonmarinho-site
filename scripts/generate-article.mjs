#!/usr/bin/env node
// Usage: node scripts/generate-article.mjs scripts/articles/mon-article.mjs
//
// Le script :
//   1. Lit la config de l'article (fichier .mjs passé en argument)
//   2. Crée blog/[slug]/index.html (HTML complet, SEO-ready)
//   3. Insère la carte dans blog/index.html entre <!-- BLOG:CARDS:START --> et <!-- BLOG:CARDS:END -->
//   4. Met à jour les compteurs de filtres dans blog/index.html
//   5. Ajoute l'URL dans sitemap.xml
//   6. Ajoute l'entrée dans blog/articles-data.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ─── Couleurs et labels par catégorie ────────────────────────────────────────

const CATEGORIES = {
  revenus:        { label: 'Revenus',        section: 'Revenus',             barColor: '#E8A020',   catColor: '#B06010'   },
  visibilite:     { label: 'Visibilité',     section: 'Visibilité',          barColor: 'var(--g)',  catColor: 'var(--g)'  },
  experience:     { label: 'Expérience',     section: 'Expérience voyageur', barColor: '#D97706',   catColor: '#92400E'   },
  ressources:     { label: 'Ressources',     section: 'Ressources',          barColor: '#8B5CF6',   catColor: '#6D28D9'   },
  automatisation: { label: 'Automatisation', section: 'Automatisation',      barColor: '#3B82F6',   catColor: '#2563EB'   },
  reglementation: { label: 'Réglementation', section: 'Réglementation',      barColor: '#DC2626',   catColor: '#991B1B'   },
  conciergerie:   { label: 'Conciergerie',   section: 'Conciergerie',        barColor: 'var(--gd)', catColor: 'var(--gd)' },
  fiscalite:      { label: 'Fiscalité',      section: 'Fiscalité',           barColor: 'var(--ol)', catColor: 'var(--ol)' },
  driing:         { label: 'Driing',         section: 'Driing',              barColor: '#FFD56B',   catColor: 'var(--gd)' },
}

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function frenchDate(iso) {
  const [year, month] = iso.split('-')
  return `${MONTHS_FR[parseInt(month, 10) - 1]} ${year}`
}

function esc(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function buildBodyContent(sections) {
  return sections.map(s => {
    const parts = [`<h2 class="art-h2">${s.h2}</h2>`]
    for (const b of s.content) {
      if (b.type === 'p') {
        parts.push(`<p class="art-p">${b.text}</p>`)
      } else if (b.type === 'ul') {
        parts.push(`<ul class="art-ul">${b.items.map(i => `<li>${i}</li>`).join('')}</ul>`)
      } else if (b.type === 'tip') {
        parts.push(`<div class="art-tip"><i class="ph ph-lightbulb"></i> <span>${b.text}</span></div>`)
      } else if (b.type === 'cta') {
        parts.push(`<div class="art-cta-box"><p>${b.text}</p><a href="${b.href}" class="btn-p">${b.button} <i class="ph-bold ph-arrow-right"></i></a></div>`)
      }
    }
    return parts.join('\n')
  }).join('\n')
}

function buildRelated(related) {
  return related.map(r =>
    `<a href="/blog/${r.slug}" class="rel-card">` +
    `<div style="height:6px;background:var(--ol);border-radius:6px 6px 0 0"></div>` +
    `<div style="padding:16px">` +
    `<div style="font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--ol);margin-bottom:6px">${r.categoryLabel}</div>` +
    `<p style="font-family:'Fraunces',serif;font-size:15px;font-weight:400;color:var(--td);line-height:1.35;margin:0">${r.label}</p>` +
    `</div></a>`
  ).join('')
}

// ─── CSS partagé (identique sur tous les articles) ───────────────────────────

const SHARED_CSS = `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --g:#004C3F;--gd:#003329;--gm:#005A4A;
  --ol:#556B2F;--y:#FFD56B;--yw:#FFF8E1;
  --cr:#F7F5F0;--w:#FDFCF9;
  --td:#0F1A0D;--tm:#3D5038;--tl:#7A8C77;
  --bd:rgba(0,76,63,.09);
}
html{scroll-behavior:smooth}
body{font-family:'Outfit',sans-serif;background:var(--w);color:var(--td);overflow-x:hidden;-webkit-font-smoothing:antialiased}
.nav-logo-img{width:36px;height:36px;object-fit:contain;filter:brightness(0) invert(1);opacity:.9;flex-shrink:0}
nav{position:fixed;top:0;left:0;right:0;z-index:200;height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(16px,5vw,60px);background:rgba(0,51,41,.97);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,213,107,.07);transition:box-shadow .3s}
nav.sc{box-shadow:0 4px 32px rgba(0,0,0,.3)}
.n-logo{display:flex;align-items:center;gap:10px;text-decoration:none;flex-shrink:0}
.n-logo svg{width:34px;height:34px;flex-shrink:0}
.n-brand{font-family:'Fraunces',serif;font-size:16px;font-weight:600;color:#fff;letter-spacing:-.2px;white-space:nowrap}
.n-brand em{color:var(--y);font-style:italic;font-weight:300}
.n-links{display:flex;align-items:center;gap:28px;list-style:none}
.n-links a{color:rgba(255,255,255,.5);text-decoration:none;font-size:14px;transition:color .2s}
.n-links a:hover{color:#fff}
.n-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
.nb-o{font-family:'Outfit',sans-serif;font-size:13px;font-weight:500;color:rgba(255,255,255,.65);border:1px solid rgba(255,255,255,.18);background:transparent;padding:8px 15px;border-radius:8px;text-decoration:none;display:flex;align-items:center;gap:5px;transition:all .2s;white-space:nowrap}
.nb-o:hover{border-color:rgba(255,255,255,.42);color:#fff}
.nb-c{font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;color:var(--gd);background:var(--y);padding:8px 16px;border-radius:8px;text-decoration:none;display:flex;align-items:center;gap:5px;transition:all .2s;white-space:nowrap}
.nb-c:hover{background:#ffe08f;transform:translateY(-1px)}
.hbg{display:none;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:4px}
.hbg span{display:block;height:2px;background:rgba(255,255,255,.8);border-radius:2px;transition:.3s}
.hbg span:nth-child(1){width:22px}
.hbg span:nth-child(2){width:16px}
.hbg span:nth-child(3){width:20px}
.mob-menu{display:none;position:fixed;top:64px;left:0;right:0;background:var(--gd);border-bottom:1px solid rgba(255,213,107,.08);padding:16px clamp(16px,5vw,60px) 20px;z-index:199;flex-direction:column}
.mob-menu.open{display:flex}
.mob-menu a{font-size:15px;color:rgba(255,255,255,.55);text-decoration:none;padding:13px 0;border-bottom:1px solid rgba(255,255,255,.04);display:flex;align-items:center;gap:10px;transition:color .2s}
.mob-menu a:hover{color:#fff}
.mob-menu a:last-of-type{border-bottom:none}
.mob-ctas{display:flex;gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,.05)}
.mob-ctas a{flex:1;justify-content:center;font-size:14px;font-weight:500;text-decoration:none;padding:12px 0;border-radius:9px;display:flex;align-items:center;gap:5px}
.mc-o{background:rgba(255,255,255,.05);color:rgba(255,255,255,.65);border:1px solid rgba(255,255,255,.12)}
.mc-c{background:var(--y);color:var(--gd)!important;font-weight:600}
.btn-p{background:var(--y);color:var(--gd);font-family:'Outfit',sans-serif;font-size:15px;font-weight:600;padding:14px 26px;border-radius:10px;border:none;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:7px;transition:all .2s}
.btn-p:hover{background:#ffe08f;transform:translateY(-2px);box-shadow:0 8px 28px rgba(255,213,107,.28)}
.lbl{font-size:10.5px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:var(--ol);margin-bottom:12px;display:flex;align-items:center;gap:8px}
.lbl.lt{color:rgba(255,213,107,.5)}
.lbl.ct{justify-content:center}
.lbl::before{content:'';width:18px;height:2px;background:currentColor;border-radius:2px}
.h2{font-family:'Fraunces',serif;font-size:clamp(30px,3.8vw,50px);font-weight:300;line-height:1.1;letter-spacing:-1.5px;color:var(--td);margin-bottom:14px}
.h2 em{font-style:italic;color:var(--g)}
.h2.lt{color:#fff}.h2.lt em{color:var(--y)}
.h2.ct{text-align:center}
.sub{font-size:16px;font-weight:300;color:var(--tm);line-height:1.72;max-width:440px;margin-bottom:48px}
.sub.lt{color:rgba(255,255,255,.38)}
.sub.ct{text-align:center;margin-left:auto;margin-right:auto}
.cta-s{background:var(--g);padding:clamp(64px,8vw,88px) clamp(16px,5vw,60px);text-align:center;position:relative;overflow:hidden}
.cta-gw{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:640px;height:300px;background:radial-gradient(ellipse,rgba(255,213,107,.06) 0%,transparent 65%);pointer-events:none}
.cta-in{max-width:520px;margin:0 auto;position:relative;z-index:2}
.cta-fm{display:flex;gap:10px;margin:28px auto 0;max-width:420px}
.cta-i{flex:1;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:13px 16px;font-size:14.5px;font-weight:300;color:#fff;font-family:'Outfit',sans-serif;outline:none;transition:border-color .2s;min-width:0}
.cta-i::placeholder{color:rgba(255,255,255,.28)}
.cta-i:focus{border-color:rgba(255,213,107,.45)}
.cta-n{font-size:11.5px;color:rgba(255,255,255,.22);margin-top:12px;font-weight:300;display:flex;align-items:center;justify-content:center;gap:5px}
.cta-n i{font-size:12px}
footer{background:var(--gd);padding:clamp(48px,7vw,72px) clamp(16px,5vw,60px) 28px;border-top:1px solid rgba(255,213,107,.05)}
.ft-in{max-width:1200px;margin:0 auto}
.ft-g{display:grid;grid-template-columns:1.7fr 1fr 1fr 1fr;gap:clamp(28px,4vw,48px);margin-bottom:48px}
.ft-desc{font-size:13px;font-weight:300;color:rgba(255,255,255,.26);line-height:1.7;margin-top:14px;max-width:230px}
.ft-ct{font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:rgba(255,213,107,.28);margin-bottom:15px}
.ft-ls{list-style:none;display:flex;flex-direction:column;gap:10px}
.ft-ls a{font-size:13px;font-weight:300;color:rgba(255,255,255,.26);text-decoration:none;display:flex;align-items:center;gap:6px;transition:color .2s}
.ft-ls a i{font-size:13px;opacity:.6}
.ft-ls a:hover{color:rgba(255,255,255,.65)}
.ft-bot{display:flex;justify-content:space-between;align-items:center;padding-top:22px;border-top:1px solid rgba(255,255,255,.04);flex-wrap:wrap;gap:12px}
.ft-cp{font-size:12px;color:rgba(255,255,255,.16);font-weight:300}
.socs{display:flex;gap:7px}
.soc{width:32px;height:32px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:7px;display:flex;align-items:center;justify-content:center;text-decoration:none;color:rgba(255,255,255,.3);transition:all .2s}
.soc i{font-size:15px}
.soc:hover{background:rgba(255,255,255,.09);color:#fff}
@keyframes fu{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.rv{opacity:0;transform:translateY(22px);transition:opacity .6s ease,transform .6s ease}
.rv.in{opacity:1;transform:translateY(0)}
.d1{transition-delay:.1s}.d2{transition-delay:.2s}.d3{transition-delay:.3s}
@media(max-width:1024px){
  .n-links,.n-right{display:none}
  .hbg{display:flex}
  .ft-g{grid-template-columns:1fr 1fr;gap:32px}
}
@media(max-width:640px){
  .cta-fm{flex-direction:column}
  .cta-fm .btn-p{justify-content:center}
  .ft-g{grid-template-columns:1fr;gap:28px}
  .ft-desc{max-width:100%}
  .ft-bot{flex-direction:column;align-items:flex-start}
}`

const ARTICLE_CSS = `.art-hero{background:var(--gd);padding:clamp(100px,14vw,130px) clamp(16px,5vw,60px) clamp(48px,6vw,64px);position:relative;overflow:hidden}
.art-hero .ah-g{position:absolute;top:-15%;right:-10%;width:480px;height:480px;background:radial-gradient(circle,rgba(0,107,88,.28) 0%,transparent 65%);border-radius:50%;pointer-events:none}
.art-hero .ah-g2{position:absolute;bottom:-15%;left:-8%;width:340px;height:340px;background:radial-gradient(circle,rgba(85,107,47,.15) 0%,transparent 65%);border-radius:50%;pointer-events:none}
.art-hero-in{position:relative;z-index:2;max-width:760px;margin:0 auto}
.art-cat{font-size:11px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:var(--y);margin-bottom:14px;display:flex;align-items:center;gap:8px}
.art-cat::before{content:"";display:inline-block;width:22px;height:2px;background:var(--g);border-radius:2px}
.art-title{font-family:'Fraunces',serif;font-size:clamp(28px,4.2vw,52px);font-weight:300;line-height:1.1;letter-spacing:-1.5px;color:#fff;margin-bottom:20px}
.art-title em{font-style:italic;color:var(--y)}
.art-meta{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.art-meta span{font-size:12px;color:rgba(255,255,255,.42);display:flex;align-items:center;gap:5px}
.art-body{max-width:760px;margin:0 auto;padding:clamp(40px,6vw,64px) clamp(16px,5vw,60px)}
.art-lead{font-size:clamp(16px,1.5vw,18px);font-weight:300;color:var(--tm);line-height:1.8;margin-bottom:28px;border-left:3px solid var(--g);padding-left:18px}
.art-h2{font-family:'Fraunces',serif;font-size:clamp(20px,2.2vw,26px);font-weight:400;color:var(--td);letter-spacing:-.3px;margin:36px 0 12px}
.art-p{font-size:15px;font-weight:300;color:var(--tm);line-height:1.8;margin-bottom:16px}
.art-ul{padding-left:0;margin:0 0 20px;list-style:none}
.art-ul li{font-size:15px;font-weight:300;color:var(--tm);line-height:1.7;padding:6px 0 6px 24px;position:relative;border-bottom:1px solid var(--bd)}
.art-ul li:last-child{border-bottom:none}
.art-ul li::before{content:"";position:absolute;left:0;top:14px;width:8px;height:8px;background:var(--g);border-radius:50%;opacity:.7}
.art-tip{background:rgba(0,76,63,.06);border:1px solid rgba(0,76,63,.12);border-left:3px solid var(--g);border-radius:10px;padding:16px 18px;margin:20px 0;display:flex;align-items:flex-start;gap:10px;font-size:14px;font-weight:300;color:var(--tm);line-height:1.65}
.art-tip i{color:var(--g);font-size:18px;flex-shrink:0;margin-top:1px}
.art-cta-box{background:var(--gd);border-radius:14px;padding:clamp(24px,3vw,32px);margin:32px 0;text-align:center}
.art-cta-box p{font-size:15px;font-weight:300;color:rgba(255,255,255,.65);line-height:1.7;margin-bottom:18px}
.related-sec{background:var(--cr);padding:clamp(40px,6vw,64px) clamp(16px,5vw,60px)}
.related-in{max-width:760px;margin:0 auto}
.rel-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:20px}
.rel-card{background:var(--w);border:1px solid var(--bd);border-radius:12px;overflow:hidden;text-decoration:none;transition:transform .2s,box-shadow .2s;display:block}
.rel-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,76,63,.08)}
@media(max-width:640px){.rel-grid{grid-template-columns:1fr!important}}`

// ─── Génération du HTML article ──────────────────────────────────────────────

function generateArticleHTML(art) {
  const cat = CATEGORIES[art.categorySlug]
  if (!cat) throw new Error(`Catégorie inconnue : ${art.categorySlug}`)

  const url = `https://jasonmarinho.com/blog/${art.slug}`
  const dateDisplay = frenchDate(art.date)
  const jsonLd = JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://jasonmarinho.com' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://jasonmarinho.com/blog' },
        { '@type': 'ListItem', position: 3, name: art.title, item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: art.title,
      description: art.description,
      author: { '@type': 'Person', name: 'Jason Marinho', url: 'https://jasonmarinho.com' },
      publisher: { '@type': 'Organization', name: 'Jason Marinho', url: 'https://jasonmarinho.com' },
      datePublished: art.date,
      dateModified: art.date,
      url,
      articleSection: cat.section,
      keywords: art.keywords,
      inLanguage: 'fr-FR',
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    },
  ], null, 2)

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<link rel="icon" type="image/webp" href="/favicon-jason.webp">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(art.title)} | Jason Marinho</title>
<meta name="description" content="${esc(art.description)}">
<meta name="keywords" content="${esc(art.keywords)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(art.title)} | Jason Marinho">
<meta property="og:description" content="${esc(art.description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://jasonmarinho.com/couverture-jason.webp">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="article:published_time" content="${art.date}">
<meta property="article:author" content="Jason Marinho">
<meta property="article:section" content="${cat.section}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://jasonmarinho.com/couverture-jason.webp">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,300;1,9..144,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" type="text/css" href="/fonts/phosphor-bold.css">
<link rel="stylesheet" type="text/css" href="/fonts/phosphor-regular.css">
<style>
${SHARED_CSS}
</style>
<style>
${ARTICLE_CSS}
</style>
<script type="application/ld+json">
${jsonLd}
</script>
<script defer src="https://va.vercel-scripts.com/v1/script.js"></script>
<script defer src="https://va.vercel-scripts.com/v1/speed-insights/script.js"></script>
</head>
<body>
<script src="/nav.js"></script>
<section class="art-hero">
  <div class="ah-g"></div>
  <div class="ah-g2"></div>
  <div class="art-hero-in">
    <a href="/blog" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:rgba(255,255,255,.4);text-decoration:none;margin-bottom:20px;transition:color .2s" onmouseover="this.style.color='rgba(255,255,255,.8)'" onmouseout="this.style.color='rgba(255,255,255,.4)'">
      <i class="ph ph-arrow-left"></i> Retour au blog
    </a>
    <div class="art-cat">${cat.label}</div>
    <h1 class="art-title">${art.title}</h1>
    <div class="art-meta">
      <span><i class="ph ph-clock"></i> ${art.readTime} min de lecture</span>
      <span><i class="ph ph-calendar"></i> ${dateDisplay}</span>
      <span><i class="ph ph-user"></i> Jason Marinho</span>
    </div>
  </div>
</section>

<div class="art-body">
<p class="art-lead">${art.lead}</p>
${buildBodyContent(art.sections)}
</div>

<section class="related-sec">
  <div class="related-in">
    <div class="lbl rv">Continuer la lecture</div>
    <h2 style="font-family:'Fraunces',serif;font-size:clamp(20px,2.2vw,24px);font-weight:400;color:var(--td);margin-bottom:0;letter-spacing:-.2px">Articles similaires</h2>
    <div class="rel-grid">
      ${buildRelated(art.related)}
    </div>
  </div>
</section>

<section class="cta-s" id="contact">
  <div class="cta-gw"></div>
  <div class="cta-in">
    <div class="lbl lt ct rv" style="justify-content:center">Newsletter</div>
    <h2 class="h2 lt ct rv">Rejoins la communauté<br><em>des hôtes qui progressent</em></h2>
    <p class="sub lt ct rv" style="margin-bottom:0;max-width:380px">Conseils LCD, ressources et outils pratiques dans ta boîte mail chaque semaine.</p>
    <div class="cta-fm rv" id="brevo-form">
      <input type="email" id="brevo-email" class="cta-i" placeholder="ton@email.com" aria-label="Email" autocomplete="email">
      <button class="btn-p" id="brevo-submit" onclick="subscriberBrevo(event)">S'inscrire <i class="ph-bold ph-arrow-right"></i></button>
    </div>
    <p id="brevo-msg" style="display:none;font-size:13px;margin-top:10px;color:var(--y)"></p>
    <p class="cta-n"><i class="ph ph-lock"></i> Aucun spam. Désinscription en un clic.</p>
  </div>
</section>

<!-- FOOTER -->
<script src="/footer.js"></script>
<script>
const nav=document.getElementById('nav');
window.addEventListener('scroll',()=>nav.classList.toggle('sc',window.scrollY>20));
</script>
<script>
function subscriberBrevo(e) {
  e.preventDefault();
  var email = document.getElementById('brevo-email').value;
  var msg = document.getElementById('brevo-msg');
  var btn = document.getElementById('brevo-submit');
  if (!email || !email.includes('@')) {
    msg.textContent = 'Saisis une adresse email valide.';
    msg.style.color = '#FFD56B';
    msg.style.display = 'block';
    return;
  }
  btn.textContent = 'Envoi...';
  btn.disabled = true;
  fetch('/api/newsletter/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email})}).then(function(r){
    if(r.ok||r.status===204){
      msg.textContent='✓ Bienvenue ! Vérifie ta boîte mail.';
      msg.style.color='#FFD56B';
      msg.style.display='block';
      document.getElementById('brevo-email').value='';
    }else{
      msg.textContent='Déjà inscrit ou erreur — réessaie.';
      msg.style.color='rgba(255,255,255,.6)';
      msg.style.display='block';
    }
    btn.textContent="S'inscrire";
    btn.disabled=false;
  }).catch(function(){
    msg.textContent='Erreur réseau — réessaie.';
    msg.style.color='rgba(255,255,255,.6)';
    msg.style.display='block';
    btn.textContent="S'inscrire";
    btn.disabled=false;
  });
}
const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add("in")}),{threshold:.08,rootMargin:"0px 0px -28px 0px"});
document.querySelectorAll(".rv").forEach(el=>obs.observe(el));
</script>
<script src="/cookie-banner.js" defer></script>
</body>
</html>`
}

// ─── Carte blog (pour blog/index.html) ───────────────────────────────────────

function generateCard(art) {
  const cat = CATEGORIES[art.categorySlug]
  const cardTitle = art.cardTitle || art.title
  const desc = art.description
  return `      <article data-cat="${art.categorySlug}" data-title="${esc(cardTitle)}" data-desc="${esc(desc)}" class="blog-card rv">
        <div class="bc-bar" style="background:${cat.barColor}"></div>
        <div class="bc-body">
          <div class="bc-cat" style="color:${cat.catColor}"><span style="background:${cat.barColor}"></span>${cat.label}</div>
          <h2 class="bc-title">${cardTitle}</h2>
          <p class="bc-desc">${desc}</p>
          <div class="bc-foot">
            <span class="bc-time">${art.readTime} min de lecture</span>
            <a href="/blog/${art.slug}" class="bc-lk">Lire <i class="ph-bold ph-arrow-right"></i></a>
          </div>
        </div>
      </article>`
}

// ─── Mise à jour blog/index.html ─────────────────────────────────────────────

function updateBlogIndex(art) {
  const filePath = resolve(ROOT, 'blog/index.html')
  let html = readFileSync(filePath, 'utf8')

  // Insertion de la carte après <!-- BLOG:CARDS:START -->
  const START_MARKER = '<!-- BLOG:CARDS:START -->'
  const idx = html.indexOf(START_MARKER)
  if (idx === -1) throw new Error('Marqueur <!-- BLOG:CARDS:START --> introuvable dans blog/index.html')
  const insertPos = idx + START_MARKER.length
  html = html.slice(0, insertPos) + '\n' + generateCard(art) + '\n' + html.slice(insertPos)

  // Compteur total : "52 ressources gratuites" → "53 ressources gratuites"
  html = html.replace(
    /(<span id="articles-count"[^>]*>)(\d+)( ressource[s]? gratuite[s]?<\/span>)/,
    (_, before, n, after) => `${before}${parseInt(n, 10) + 1}${after}`
  )

  // Compteur "Tous" dans la barre de filtres
  html = html.replace(
    /(data-filter="all"[^>]*>.*?<span class="blog-cat-count">)(\d+)(<\/span>)/s,
    (_, before, n, after) => `${before}${parseInt(n, 10) + 1}${after}`
  )

  // Compteur de la catégorie concernée
  const catSlug = art.categorySlug
  const catRegex = new RegExp(
    `(data-filter="${catSlug}"[^>]*>[\\s\\S]*?<span class="blog-cat-count">)(\\d+)(<\\/span>)`
  )
  html = html.replace(catRegex, (_, before, n, after) => `${before}${parseInt(n, 10) + 1}${after}`)

  writeFileSync(filePath, html, 'utf8')
  console.log(`✓ blog/index.html mis à jour (carte + compteurs)`)
}

// ─── Mise à jour sitemap.xml ──────────────────────────────────────────────────

function updateSitemap(art) {
  const filePath = resolve(ROOT, 'sitemap.xml')
  let xml = readFileSync(filePath, 'utf8')
  const entry = `\n  <url>\n    <loc>https://jasonmarinho.com/blog/${art.slug}/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`
  xml = xml.replace('</urlset>', entry + '\n</urlset>')
  writeFileSync(filePath, xml, 'utf8')
  console.log(`✓ sitemap.xml mis à jour`)
}

// ─── Mise à jour articles-data.mjs ───────────────────────────────────────────

function updateArticlesData(art) {
  const filePath = resolve(ROOT, 'blog/articles-data.mjs')
  let src = readFileSync(filePath, 'utf8')
  const entry = `  { slug: '${art.slug}', categorySlug: '${art.categorySlug}', date: '${art.date}', readTime: ${art.readTime}, title: '${art.title.replace(/'/g, "\\'")}' },`
  // Insérer avant la dernière ligne du tableau (avant le ']')
  src = src.replace(/(\n]\s*\nexport const CATEGORIES)/, `\n${entry}$1`)
  writeFileSync(filePath, src, 'utf8')
  console.log(`✓ blog/articles-data.mjs mis à jour`)
}

// ─── Point d'entrée ───────────────────────────────────────────────────────────

const configPath = process.argv[2]
if (!configPath) {
  console.error('Usage: node scripts/generate-article.mjs scripts/articles/mon-article.mjs')
  process.exit(1)
}

const absConfigPath = resolve(process.cwd(), configPath)
if (!existsSync(absConfigPath)) {
  console.error(`Fichier introuvable : ${absConfigPath}`)
  process.exit(1)
}

const { default: art } = await import(pathToFileURL(absConfigPath).href)

// Validation minimale
const required = ['slug', 'title', 'description', 'categorySlug', 'date', 'readTime', 'keywords', 'lead', 'sections', 'related']
for (const field of required) {
  if (art[field] === undefined) throw new Error(`Champ manquant dans la config : ${field}`)
}
if (!CATEGORIES[art.categorySlug]) {
  throw new Error(`categorySlug invalide "${art.categorySlug}". Valeurs acceptées : ${Object.keys(CATEGORIES).join(', ')}`)
}

const outDir = resolve(ROOT, 'blog', art.slug)
if (existsSync(outDir)) {
  console.error(`Erreur : blog/${art.slug}/ existe déjà. Supprime-le d'abord si tu veux le régénérer.`)
  process.exit(1)
}

mkdirSync(outDir, { recursive: true })
const html = generateArticleHTML(art)
writeFileSync(resolve(outDir, 'index.html'), html, 'utf8')
console.log(`✓ blog/${art.slug}/index.html créé (${html.length} octets)`)

updateBlogIndex(art)
updateSitemap(art)
updateArticlesData(art)

console.log(`\n🎉 Article "${art.title}" publié avec succès !`)
console.log(`   → https://jasonmarinho.com/blog/${art.slug}/`)
