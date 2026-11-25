#!/usr/bin/env node
// Génère une page par partenaire (façon shine.fr/partenaire/<nom>) dans
// partenaires/<slug>/index.html, à partir de scripts/data/partenaires-pages.mjs.
// Pages entièrement générées : modifier les données puis relancer, ne pas
// éditer le HTML à la main. Liens rémunérés : rel="sponsored noopener" et
// mention « Lien affilié » visible (clics comptés par nav.js).
//
// Usage : node scripts/build-pages-partenaires.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PAGES } from './data/partenaires-pages.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://jasonmarinho.com'
const TODAY = '2026-09-30'

const amp = s => s.replace(/&(?!amp;|#|[a-z]+;)/g, '&amp;')
const attr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
const plain = s => s.replace(/<[^>]+>/g, '')
const sponsored = (href, cls, inner) => `<a href="${amp(href)}" target="_blank" rel="sponsored noopener" class="${cls}">${inner}</a>`

// ?v= réécrits en hash du contenu par build-phosphor-subset.mjs au déploiement
function phosphorLinks() {
  const ref = fs.readFileSync(path.join(ROOT, 'hospitable-avis/index.html'), 'utf8')
  return ref.match(/<link rel="stylesheet" type="text\/css" href="\/fonts\/phosphor-[^>]+>/g).join('\n')
}

function jsonLd(p) {
  const url = `${SITE}/partenaires/${p.slug}`
  const graph = [
    {
      '@context': 'https://schema.org', '@type': 'WebPage',
      name: p.title, description: p.description, url,
      inLanguage: 'fr-FR', dateModified: TODAY,
      author: { '@type': 'Person', name: 'Jason Marinho', url: `${SITE}/qui-suis-je` },
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'Partenaires', item: `${SITE}/partenaires` },
        { '@type': 'ListItem', position: 3, name: p.nom, item: url },
      ],
    },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: p.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ]
  return graph.map(g => `<script type="application/ld+json">\n${JSON.stringify(g, null, 2)}\n</script>`).join('\n')
}

const CSS = `
  :root{--gd:#004c3f;--g:#63D683;--y:#FFD56B;--td:#111827;--tm:#374151;--tl:#6B7280;--bd:#E5E7EB;--bg:#F9FAFB;--cr:#F0FDF4}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Outfit','Outfit Fallback',sans-serif;background:var(--bg);color:var(--td);-webkit-font-smoothing:antialiased}
  a{color:var(--gd);text-decoration:none}
  a:hover{text-decoration:underline}
  p a:not([class]),.faq-body a:not([class]){text-decoration:underline;text-underline-offset:2px}
  .hero{background:linear-gradient(135deg,#001a11 0%,var(--gd) 100%);padding:clamp(96px,10vw,128px) 16px clamp(48px,6vw,80px)}
  .hero-in{max-width:1120px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:clamp(28px,5vw,64px);align-items:center}
  .breadcrumb{display:flex;align-items:center;flex-wrap:wrap;gap:8px;font-size:13px;color:rgba(255,255,255,.5);margin-bottom:20px}
  .breadcrumb a{color:rgba(255,255,255,.55)}
  .breadcrumb a:hover{color:#fff;text-decoration:none}
  .breadcrumb i{font-size:10px}
  .duo{display:flex;align-items:center;gap:12px;margin-bottom:18px}
  .duo .lg{width:48px;height:48px;border-radius:13px;background:#fff;display:flex;align-items:center;justify-content:center;font-family:'Fraunces','Fraunces Fallback',serif;font-size:24px;font-weight:600}
  .duo .x{color:rgba(255,255,255,.4);font-size:18px}
  .duo .jm{width:48px;height:48px;border-radius:13px;background:var(--y);color:var(--gd);display:flex;align-items:center;justify-content:center;font-family:'Fraunces','Fraunces Fallback',serif;font-size:19px;font-weight:600}
  .lbl{display:inline-block;background:rgba(255,213,107,.12);border:1px solid rgba(255,213,107,.25);color:var(--y);font-size:12px;letter-spacing:.6px;text-transform:uppercase;font-weight:500;padding:5px 12px;border-radius:20px;margin-bottom:14px}
  .h1{font-family:'Fraunces','Fraunces Fallback',serif;font-size:clamp(1.9rem,4vw,3rem);line-height:1.1;letter-spacing:-.02em;color:#fff;margin:0 0 18px;font-weight:300}
  .h1 em{color:var(--y);font-style:italic;font-weight:300}
  .lead{font-size:clamp(15px,1.5vw,17px);color:rgba(255,255,255,.68);line-height:1.7;margin:0}
  .offer{background:#fff;border-radius:20px;padding:clamp(22px,3vw,30px);box-shadow:0 24px 60px rgba(0,0,0,.25)}
  .offer .tag{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#7a5a00;background:rgba(255,213,107,.35);padding:4px 9px;border-radius:6px;margin-bottom:14px}
  .offer .big{font-family:'Fraunces','Fraunces Fallback',serif;font-size:clamp(1.6rem,3vw,2.2rem);font-weight:400;letter-spacing:-.02em;color:var(--td);line-height:1.1;margin:0 0 4px}
  .offer .sous{font-size:14.5px;color:var(--tl);margin:0 0 18px}
  .offer ul{list-style:none;margin:0 0 20px;display:flex;flex-direction:column;gap:9px}
  .offer li{display:flex;gap:10px;align-items:flex-start;font-size:14.5px;color:var(--tm);line-height:1.5}
  .offer li i{color:var(--gd);font-size:17px;margin-top:1px;flex-shrink:0}
  .b1{display:flex;align-items:center;justify-content:center;gap:8px;background:var(--gd);color:#fff;font-weight:600;font-size:15px;padding:14px 18px;border-radius:11px;text-decoration:none}
  .b1:hover{background:#00382e;text-decoration:none}
  .b2{display:flex;align-items:center;justify-content:center;gap:8px;border:1px solid rgba(0,76,63,.25);color:var(--gd);font-weight:600;font-size:14px;padding:12px 16px;border-radius:11px;margin-top:10px;text-decoration:none}
  .b2:hover{background:rgba(0,76,63,.05);text-decoration:none}
  .offer small{display:block;margin-top:12px;font-size:12px;color:var(--tl);line-height:1.5}
  main{max-width:1120px;margin:0 auto;padding:clamp(32px,4vw,48px) 16px clamp(48px,6vw,72px)}
  section{margin-bottom:clamp(44px,6vw,64px);scroll-margin-top:90px}
  h2{font-family:'Fraunces','Fraunces Fallback',serif;font-size:clamp(1.5rem,2.6vw,2.1rem);font-weight:400;letter-spacing:-.5px;margin:0 0 20px;color:var(--td)}
  h2 em{font-style:italic;color:var(--gd);font-weight:300}
  p{color:var(--tm);font-size:15.5px;line-height:1.7;margin:0 0 14px}
  .disc{font-size:13.5px;color:var(--tl);background:#fff;border:1px dashed var(--bd);border-radius:10px;padding:12px 16px;margin:0 0 clamp(36px,5vw,52px)}
  .disc strong{color:var(--tm)}
  .why{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
  .why div{background:#fff;border:1px solid var(--bd);border-radius:16px;padding:24px}
  .why i{display:flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:12px;background:var(--cr);color:var(--gd);font-size:22px;margin-bottom:14px}
  .why h3{font-family:'Fraunces','Fraunces Fallback',serif;font-size:1.15rem;font-weight:500;margin:0 0 8px;color:var(--td)}
  .why p{font-size:14.5px;margin:0}
  .feat{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--bd);border:1px solid var(--bd);border-radius:16px;overflow:hidden}
  .feat div{background:#fff;padding:22px;display:flex;flex-direction:column;gap:6px}
  .feat i{color:var(--gd);font-size:22px}
  .feat strong{font-size:15.5px;color:var(--td)}
  .feat span{font-size:14px;color:var(--tl);line-height:1.55}
  .feat a{font-size:13.5px;font-weight:600;margin-top:4px}
  .steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;counter-reset:st;list-style:none}
  .steps li{counter-increment:st;background:#fff;border:1px solid var(--bd);border-radius:16px;padding:24px;font-size:14.5px;color:var(--tm);line-height:1.6}
  .steps li::before{content:counter(st);display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:var(--gd);color:var(--y);font-family:'Fraunces','Fraunces Fallback',serif;font-weight:600;margin-bottom:14px}
  .steps strong{display:block;color:var(--td);font-size:15.5px;margin-bottom:4px}
  .tbw{overflow-x:auto;border-radius:14px;border:1px solid var(--bd)}
  table.tb{width:100%;border-collapse:collapse;font-size:14.5px;background:#fff}
  table.tb th{background:var(--gd);color:#fff;text-align:left;padding:13px 16px;font-weight:600;font-size:13px}
  table.tb td{padding:14px 16px;border-top:1px solid var(--bd);color:var(--tm);vertical-align:top;line-height:1.6}
  table.tb td:first-child{color:var(--td);font-weight:500;width:45%}
  .yes{color:#047857;font-weight:600}
  .partial{color:#B45309;font-weight:600}
  .note{font-size:13.5px;color:var(--tl);margin-top:12px}
  .lim{list-style:none;display:flex;flex-direction:column;gap:12px}
  .lim li{display:flex;gap:12px;background:#FFFBEB;border:1px solid rgba(255,213,107,.6);border-radius:12px;padding:16px 18px;font-size:14.5px;color:#78350F;line-height:1.6}
  .lim i{color:#B45309;font-size:18px;margin-top:2px;flex-shrink:0}
  .more{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
  .more a{display:flex;flex-direction:column;gap:4px;background:#fff;border:1px solid var(--bd);border-radius:14px;padding:18px 20px;text-decoration:none;transition:border-color .15s,transform .15s}
  .more a:hover{border-color:rgba(0,76,63,.35);transform:translateY(-1px);text-decoration:none}
  .more strong{font-size:15.5px;color:var(--td);display:flex;align-items:center;gap:6px}
  .more span{font-size:14px;color:var(--tl)}
  .faq-i{border:1px solid var(--bd);border-radius:12px;margin-bottom:10px;overflow:hidden;background:#fff}
  .faq-q{padding:17px 20px;font-weight:600;font-size:15px;color:var(--td);cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;list-style:none}
  .faq-q::-webkit-details-marker{display:none}
  .faq-q i{transition:transform .2s;color:var(--tl);font-size:14px;flex-shrink:0}
  .faq-i[open] .faq-q i{transform:rotate(180deg)}
  .faq-a{padding:0 20px 18px;font-size:14.5px;line-height:1.75;color:var(--tm)}
  .src{font-size:13px;color:var(--tl);line-height:1.7}
  .src a{color:var(--tl);text-decoration:underline}
  .cta-banner{background:linear-gradient(135deg,#001a11,var(--gd));border-radius:20px;padding:clamp(28px,4vw,48px);text-align:center;margin-top:clamp(40px,6vw,64px)}
  .cta-banner h2{color:#fff;margin:0 0 10px}
  .cta-banner h2 em{color:var(--y)}
  .cta-banner p{color:rgba(255,255,255,.65);max-width:560px;margin:0 auto 22px}
  .cta-banner a{display:inline-flex;align-items:center;gap:8px;background:var(--y);color:var(--gd);font-weight:600;font-size:14.5px;padding:13px 22px;border-radius:10px;text-decoration:none}
  .cta-banner a:hover{background:#ffe08f;text-decoration:none}
  @media(max-width:900px){
    .hero-in{grid-template-columns:minmax(0,1fr)}
    .why,.steps{grid-template-columns:1fr}
    .feat{grid-template-columns:repeat(2,minmax(0,1fr))}
    .more{grid-template-columns:1fr}
  }
  @media(max-width:560px){
    .feat{grid-template-columns:1fr}
    table.tb{font-size:13.5px}
    table.tb th,table.tb td{padding:11px 12px}
  }
`

function page(p) {
  const url = `${SITE}/partenaires/${p.slug}`
  const o = p.offre
  const desc = attr(p.description)
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${p.title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${attr(p.title)}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/couverture-jason.webp">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/couverture-jason.webp">
<link rel="shortcut icon" href="/favicon.ico">
<link rel="icon" href="/favicon.ico?v=2026-06" sizes="any">
<link rel="icon" type="image/png" sizes="96x96" href="/icon-96.png?v=2026-06">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png?v=2026-06">
<link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png?v=2026-06">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2026-06">
<link rel="manifest" href="/manifest.json?v=2026-06">
<meta name="theme-color" content="#004C3F">
<link rel="stylesheet" href="/fonts/site-fonts.css?v=0e0c369807">
${phosphorLinks()}
${jsonLd(p)}
<!-- Généré par scripts/build-pages-partenaires.mjs depuis scripts/data/partenaires-pages.mjs : ne pas éditer à la main -->
<style>${CSS}</style>
</head>
<body>
<div id="nav-mount"></div>

<section class="hero">
  <div class="hero-in">
    <div>
      <nav class="breadcrumb" aria-label="Fil d'ariane">
        <a href="/">Accueil</a><i class="ph ph-caret-right"></i>
        <a href="/partenaires">Partenaires</a><i class="ph ph-caret-right"></i>
        <span>${p.nom}</span>
      </nav>
      <div class="duo" aria-hidden="true"><span class="lg" style="color:${p.couleur}">${p.mono}</span><span class="x">×</span><span class="jm">JM</span></div>
      <span class="lbl">${p.eyebrow}</span>
      <h1 class="h1">${p.h1}</h1>
      <p class="lead">${p.lead}</p>
    </div>
    <aside class="offer" aria-label="Offre ${p.nom}">
      <span class="tag"><i class="ph-bold ph-gift"></i> Offre partenaire</span>
      <p class="big">${o.titre}</p>
      <p class="sous">${o.sous}</p>
      <ul>
${o.points.map(t => `        <li><i class="ph-bold ph-check-circle"></i><span>${t}</span></li>`).join('\n')}
      </ul>
      ${sponsored(o.cta.href, 'b1', `${o.cta.label} <i class="ph-bold ph-arrow-up-right"></i>`)}
      ${o.cta2 ? sponsored(o.cta2.href, 'b2', o.cta2.label) : ''}
      <small>${o.note}</small>
    </aside>
  </div>
</section>

<main>
<p class="disc"><strong>Transparence :</strong> je suis partenaire de ${p.nom}. Les liens marqués affiliés me rapportent une commission, sans aucun surcoût pour toi. Mon avis reste indépendant, limites comprises.</p>

<section id="pourquoi">
  <h2>${p.pourquoi.titre}</h2>
  <div class="why">
${p.pourquoi.items.map(i => `    <div><i class="ph ph-${i.icon}"></i><h3>${i.t}</h3><p>${i.d}</p></div>`).join('\n')}
  </div>
</section>

<section id="fonctionnalites">
  <h2>${p.fonctions.titre}</h2>
  <div class="feat">
${p.fonctions.items.map(i => `    <div><i class="ph ph-${i.icon}"></i><strong>${i.t}</strong><span>${i.d}</span>${i.href ? sponsored(i.href, '', `${i.lien} <i class="ph-bold ph-arrow-up-right"></i>`) + ' <span style="font-size:12px">(lien affilié)</span>' : ''}</div>`).join('\n')}
  </div>
</section>

<section id="offre">
  <h2>Profiter de l'offre <em>en 3 étapes</em></h2>
  <ol class="steps">
${p.etapes.map(e => `    <li><strong>${e.t}</strong>${e.d}</li>`).join('\n')}
  </ol>
</section>

<section id="choisir">
  <h2>${p.tableau.titre}</h2>
  <div class="tbw"><table class="tb">
    <tr>${p.tableau.entete.map(h => `<th>${h}</th>`).join('')}</tr>
${p.tableau.lignes.map(l => `    <tr>${l.map(c => `<td>${c}</td>`).join('')}</tr>`).join('\n')}
  </table></div>
  <p class="note">${p.tableau.note}</p>
</section>
${p.cout ? `
<section id="cout">
  <h2>${p.cout.titre}</h2>
${p.cout.paras.map(t => `  <p>${t}</p>`).join('\n')}
</section>
` : ''}
<section id="limites">
  <h2>Les <em>limites</em>, honnêtement</h2>
  <ul class="lim">
${p.limites.map(t => `    <li><i class="ph-bold ph-warning-circle"></i><span>${t}</span></li>`).join('\n')}
  </ul>
</section>

<section id="aller-plus-loin">
  <h2>Pour aller <em>plus loin</em></h2>
  <div class="more">
${p.liens.map(l => `    <a href="${l.href}"><strong>${l.t} <i class="ph-bold ph-arrow-right"></i></strong><span>${l.d}</span></a>`).join('\n')}
  </div>
</section>

<section id="faq">
  <h2><em>Questions fréquentes</em> sur ${p.nom}</h2>
${p.faq.map(f => `  <details class="faq-i">
    <summary class="faq-q">${f.q} <i class="ph ph-caret-down"></i></summary>
    <div class="faq-a">${f.a}</div>
  </details>`).join('\n')}
</section>

<p class="src">Sources consultées en ${p.releve ?? 'septembre 2026'} : ${p.sources.map(([t, h]) => `<a href="${h}" rel="nofollow noopener" target="_blank">${t}</a>`).join(', ')}. Prix relevés en ${p.releve ?? 'septembre 2026'}, à vérifier sur la grille officielle de ${p.nom}.</p>

<aside class="cta-banner">
  <h2>${p.cta.titre}</h2>
  <p>${p.cta.texte}</p>
  <a href="${p.cta.btn.href}"><i class="ph-bold ph-rocket"></i> ${p.cta.btn.label}</a>
</aside>
</main>

<div id="footer-mount"></div>
<script src="/nav.js" defer></script>
<script src="/footer.js" defer></script>
<script src="/cookie-banner.js" defer></script>
</body>
</html>
`
}


// ── Mise en page v2 (14/11/2026, Jason : « fais la même chose » que
// /code-promo-lodgify et /lodgify-avis) : activée par `v2: true` dans les
// données. Mêmes données que la v1, plus `offre.code` (coupon avec bouton
// copier), `faits` (4 cartes sous l'en-tête), `cout.chiffres` (prix avec le
// code) et `bf` (ligne d'offre temporaire, affichée entre deux dates).
const CSS2 = `
  :root{--g:#004C3F;--gd:#003329;--gx:#001a11;--y:#FFD56B;--yl:#FFF4D2;--td:#0F1A0D;--tm:#3D5038;--tl:#6B7D68;--bd:rgba(0,76,63,.10);--bg:#FDFCF9;--cr:#F7F5F0;--ok:#1F7A4D;--ko:#B4462F}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Outfit','Outfit Fallback',sans-serif;background:var(--bg);color:var(--td);-webkit-font-smoothing:antialiased}
  a{color:var(--g)}
  p a:not([class]),li a:not([class]),.faq-a a{text-decoration:underline;text-underline-offset:2px}

  /* En-tête : le code tout de suite */
  .hero{background:radial-gradient(1200px 500px at 85% 0%,rgba(255,213,107,.10),transparent 60%),linear-gradient(140deg,var(--gx) 0%,var(--g) 100%);color:#fff;padding:clamp(96px,10vw,128px) 16px clamp(88px,9vw,120px)}
  .hero-in{max-width:1120px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:clamp(28px,5vw,64px);align-items:center}
  @media(max-width:900px){.hero-in{grid-template-columns:minmax(0,1fr)}}
  .breadcrumb{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:13px;color:rgba(255,255,255,.55);margin-bottom:22px}
  .breadcrumb a{color:rgba(255,255,255,.6);text-decoration:none}
  .breadcrumb a:hover{color:#fff}
  .breadcrumb i{font-size:10px}
  .lbl{display:inline-flex;align-items:center;gap:7px;background:rgba(255,213,107,.12);border:1px solid rgba(255,213,107,.28);color:var(--y);font-size:12px;letter-spacing:.8px;text-transform:uppercase;font-weight:600;padding:6px 12px;border-radius:99px;margin-bottom:16px}
  .h1{font-family:'Fraunces','Fraunces Fallback',serif;font-size:clamp(2rem,4.4vw,3.4rem);line-height:1.06;letter-spacing:-.025em;font-weight:300;margin:0 0 18px}
  .h1 em{color:var(--y);font-style:italic}
  .lead{font-size:clamp(15.5px,1.6vw,17.5px);color:rgba(255,255,255,.72);line-height:1.7;max-width:560px}
  .trust{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:22px;font-size:13.5px;color:rgba(255,255,255,.7)}
  .trust span{display:inline-flex;align-items:center;gap:7px}
  .trust i{color:var(--y);font-size:16px}

  /* Coupons */
  .coupons{display:flex;flex-direction:column;gap:14px}
  .cp{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:stretch;border-radius:22px;overflow:hidden;background:#fff;color:var(--td);box-shadow:0 30px 60px -30px rgba(0,0,0,.55)}
  .cp-l{padding:20px 22px;min-width:0}
  .cp-tag{display:inline-block;font-size:11.5px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--tl);margin-bottom:8px}
  .cp-code{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .cp-code strong{font-family:'Fraunces','Fraunces Fallback',serif;font-size:clamp(1.8rem,3.6vw,2.4rem);letter-spacing:3px;font-weight:500;color:var(--g)}
  .copy{display:inline-flex;align-items:center;gap:6px;border:none;cursor:pointer;background:var(--g);color:#fff;font:600 13.5px 'Outfit','Outfit Fallback',sans-serif;padding:9px 14px;border-radius:10px;transition:background .2s}
  .copy:hover{background:var(--gd)}
  .copy.ok{background:var(--ok)}
  .cp-sub{font-size:13.5px;color:var(--tm);margin-top:8px;line-height:1.5}
  .cp-r{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px 22px;background:var(--cr);border-left:2px dashed rgba(0,76,63,.22);min-width:132px;text-align:center}
  .cp-pct{font-family:'Fraunces','Fraunces Fallback',serif;font-size:clamp(2.2rem,4vw,2.8rem);line-height:1;color:var(--g)}
  .cp-r small{font-size:12px;color:var(--tl);margin-top:6px}
  [data-bf][hidden],[data-nbf][hidden]{display:none!important}
  .vcard.ofc-bf{background:var(--yl)}
  .vcard.ofc-bf .k{color:#6B5300}
  .cp.bf{background:var(--yl)}
  .cp.bf .cp-r{background:var(--y);border-left-color:rgba(61,46,0,.25)}
  .cp.bf .cp-pct{color:var(--gd)}
  .cp.bf .cp-tag{color:#6B5300}
  .cp-go{display:inline-flex;align-items:center;gap:6px;margin-top:12px;font-weight:600;font-size:14px;color:var(--gd);text-decoration:none}
  .cp-go:hover{text-decoration:underline}
  .cp-aff{font-size:11.5px;color:#7A6A3A;margin-left:8px}
  @media(max-width:520px){.cp{grid-template-columns:1fr}.cp-r{border-left:none;border-top:2px dashed rgba(0,76,63,.22);flex-direction:row;gap:10px;justify-content:flex-start;padding:14px 22px}}
  .cta-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:4px}
  .b1{display:inline-flex;align-items:center;gap:8px;background:var(--y);color:var(--gd);font-weight:600;font-size:14.5px;padding:13px 20px;border-radius:12px;text-decoration:none;transition:transform .2s,box-shadow .2s}
  .b1:hover{transform:translateY(-1px);box-shadow:0 10px 26px rgba(255,213,107,.3)}
  .b2{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.28);color:#fff;font-weight:600;font-size:14.5px;padding:12px 18px;border-radius:12px;text-decoration:none}
  .b2:hover{border-color:rgba(255,255,255,.6)}
  .aff-n{font-size:12.5px;color:rgba(255,255,255,.55);margin-top:10px}

  /* Corps */
  main{max-width:1000px;margin:0 auto;padding:0 16px clamp(36px,5vw,64px)}
  section{margin-bottom:clamp(48px,6vw,72px);scroll-margin-top:90px}
  .eye{font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:var(--g);margin-bottom:8px}
  h2{font-family:'Fraunces','Fraunces Fallback',serif;font-size:clamp(1.6rem,3vw,2.3rem);font-weight:400;letter-spacing:-.02em;line-height:1.15;margin:0 0 14px;color:var(--td)}
  h2 em{font-style:italic;color:var(--g)}
  p{color:var(--tm);font-size:16px;line-height:1.7;margin:0 0 14px}
  .facts{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:-52px 0 clamp(48px,6vw,72px)}
  @media(max-width:760px){.facts{grid-template-columns:1fr 1fr}}
  .fact{background:#fff;border:1px solid var(--bd);border-radius:16px;padding:16px 18px;box-shadow:0 18px 40px -26px rgba(0,51,41,.45)}
  .fact i{display:inline-flex;width:34px;height:34px;align-items:center;justify-content:center;border-radius:10px;background:rgba(0,76,63,.07);color:var(--g);font-size:17px;margin-bottom:10px}
  .fact span{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.6px;color:var(--tl);margin-bottom:3px}
  .fact b{font-size:15.5px;color:var(--td);font-weight:600;line-height:1.35}
  .fact.no i{background:rgba(180,70,47,.08);color:var(--ko)}

  .steps{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:22px;counter-reset:st;list-style:none}
  @media(max-width:860px){.steps{grid-template-columns:1fr 1fr}}
  @media(max-width:520px){.steps{grid-template-columns:1fr}}
  .steps li{counter-increment:st;position:relative;background:#fff;border:1px solid var(--bd);border-radius:18px;padding:20px 18px 18px;font-size:14.5px;color:var(--tm);line-height:1.6}
  .steps li::before{content:counter(st);display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:var(--g);color:var(--y);font-family:'Fraunces','Fraunces Fallback',serif;font-size:17px;margin-bottom:12px}
  .steps li strong{display:block;color:var(--td);font-size:15.5px;margin-bottom:4px}

  .calc{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0;background:#fff;border:1px solid var(--bd);border-radius:22px;overflow:hidden;margin-top:22px}
  @media(max-width:760px){.calc{grid-template-columns:1fr}}
  .calc-in{padding:clamp(20px,3vw,28px);display:grid;gap:14px}
  .calc label{font-size:13px;font-weight:600;color:var(--tm)}
  .calc input,.calc select{display:block;width:100%;margin-top:6px;padding:12px 14px;border:1.5px solid rgba(0,76,63,.16);border-radius:12px;font:500 15px 'Outfit','Outfit Fallback',sans-serif;background:#fff;color:var(--td);outline:none}
  .calc input:focus,.calc select:focus{border-color:var(--g)}
  .calc-out{background:linear-gradient(150deg,var(--gx),var(--g));color:#fff;padding:clamp(20px,3vw,28px);display:flex;flex-direction:column;justify-content:center;gap:14px}
  .co-k{font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--y)}
  .co-big{font-family:'Fraunces','Fraunces Fallback',serif;font-size:clamp(2.6rem,5vw,3.6rem);line-height:1;color:var(--y)}
  .co-rows{display:grid;gap:8px;font-size:14.5px;color:rgba(255,255,255,.8)}
  .co-rows div{display:flex;justify-content:space-between;gap:12px;border-top:1px solid rgba(255,255,255,.12);padding-top:8px}
  .co-rows b{color:#fff;font-weight:600}
  .note{display:flex;gap:12px;align-items:flex-start;background:var(--yl);border:1px solid #F2E2A8;border-radius:16px;padding:16px 18px;margin-top:14px;font-size:14.5px;color:#5C4A16;line-height:1.6}
  .note i{color:#8A6A00;font-size:18px;margin-top:2px}
  .note a{color:#5C4A16}

  .yn{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:22px}
  @media(max-width:700px){.yn{grid-template-columns:1fr}}
  .yn-c{background:#fff;border:1px solid var(--bd);border-radius:20px;padding:20px 22px}
  .yn-c h3{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:700;margin-bottom:12px}
  .yn-c.ok h3{color:var(--ok)}.yn-c.ko h3{color:var(--ko)}
  .yn-c ul{list-style:none;display:grid;gap:10px}
  .yn-c li{display:flex;gap:10px;align-items:flex-start;font-size:15px;color:var(--tm);line-height:1.5}
  .yn-c li i{flex-shrink:0;margin-top:3px}
  .yn-c.ok li i{color:var(--ok)}.yn-c.ko li i{color:var(--ko)}

  .links{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,170px),1fr));gap:10px;margin-top:20px}
  .lk{display:flex;flex-direction:column;gap:4px;background:#fff;border:1px solid var(--bd);border-radius:16px;padding:16px 18px;text-decoration:none;color:var(--td);transition:border-color .2s,transform .2s}
  .lk:hover{border-color:var(--g);transform:translateY(-2px)}
  .lk b{font-size:15px;display:flex;align-items:center;justify-content:space-between;gap:8px}
  .lk span{font-size:13.5px;color:var(--tl);line-height:1.5}

  .faq{display:grid;gap:10px;margin-top:18px}
  .faq-i{background:#fff;border:1px solid var(--bd);border-radius:16px;overflow:hidden}
  .faq-q{padding:18px 20px;font-weight:600;font-size:15.5px;color:var(--td);cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;list-style:none}
  .faq-q::-webkit-details-marker{display:none}
  .faq-q i{transition:transform .2s;color:var(--g);font-size:15px;flex-shrink:0}
  .faq-i[open] .faq-q i{transform:rotate(180deg)}
  .faq-a{padding:0 20px 18px;font-size:15px;line-height:1.75;color:var(--tm)}

  .disc{font-size:13.5px;color:var(--tl);line-height:1.6;border-top:1px solid var(--bd);padding-top:18px;margin-top:8px}
  .disc strong{color:var(--tm)}

  .cta-banner{background:radial-gradient(800px 300px at 90% 0%,rgba(255,213,107,.12),transparent 60%),linear-gradient(140deg,var(--gx),var(--g));border-radius:26px;padding:clamp(28px,5vw,52px);text-align:center;margin-top:12px}
  .cta-banner h2{color:#fff}
  .cta-banner h2 em{color:var(--y)}
  .cta-banner p{color:rgba(255,255,255,.72);max-width:520px;margin:0 auto 22px}
  .cta-banner .btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}

  /* Avis */
  @media(min-width:901px){.hero-in{grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr)}}
  .vcard{background:#fff;color:var(--td);border-radius:24px;padding:clamp(20px,3vw,28px);box-shadow:0 30px 60px -30px rgba(0,0,0,.55)}
  .vcard .k{font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--g);display:flex;align-items:center;gap:7px}
  .vcard h2{font-size:clamp(1.3rem,2.2vw,1.6rem);margin:8px 0 14px}
  .vrow{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px solid var(--bd);font-size:14.5px;color:var(--tm);line-height:1.55}
  .vrow i{flex-shrink:0;width:26px;height:26px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:14px;margin-top:1px}
  .vrow.ok i{background:rgba(31,122,77,.1);color:var(--ok)}.vrow.ko i{background:rgba(180,70,47,.08);color:var(--ko)}
  .vrow b{color:var(--td)}
  .notes{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
  .notes div{background:var(--cr);border-radius:14px;padding:10px 12px}
  .notes b{font-family:'Fraunces','Fraunces Fallback',serif;font-weight:400;font-size:24px;color:var(--g);line-height:1.1;display:block}
  .notes span{font-size:12px;color:var(--tl)}
  .vcard .cta-row{margin-top:16px}
  .vcard .b2{color:var(--g);border-color:rgba(0,76,63,.25)}
  .vcard .b2:hover{border-color:var(--g)}
  .vcard .aff-n{color:var(--tl);margin-top:8px}
  .feat{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:22px}
  @media(max-width:700px){.feat{grid-template-columns:1fr}}
  .ft{background:#fff;border:1px solid var(--bd);border-radius:20px;padding:22px}
  .ft .ic{display:inline-flex;width:42px;height:42px;align-items:center;justify-content:center;border-radius:12px;background:var(--g);color:var(--y);font-size:20px;margin-bottom:12px}
  .ft h3{font-family:'Fraunces','Fraunces Fallback',serif;font-weight:400;font-size:20px;margin-bottom:6px;color:var(--td)}
  .ft p{font-size:15px;margin:0}
  .yn-c li b{color:var(--td)}
  .rate{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:22px 0 16px}
  @media(max-width:560px){.rate{grid-template-columns:1fr}}
  .rt{background:linear-gradient(150deg,var(--gx),var(--g));color:#fff;border-radius:20px;padding:22px 24px;display:flex;align-items:center;gap:16px}
  .rt b{font-family:'Fraunces','Fraunces Fallback',serif;font-weight:400;font-size:clamp(2.4rem,4.5vw,3.2rem);color:var(--y);line-height:1}
  .rt b small{font-size:.45em;color:rgba(255,255,255,.7)}
  .rt span{font-size:14.5px;color:rgba(255,255,255,.8);line-height:1.5}
  .rt span strong{color:#fff;display:block;font-size:16px}
  .pros-cons{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:6px}
  @media(max-width:700px){.pros-cons{grid-template-columns:1fr}}
  .pc{background:#fff;border:1px solid var(--bd);border-radius:16px;padding:16px 18px;font-size:14.5px;color:var(--tm);line-height:1.6}
  .pc h4{font-size:13px;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px}
  .pc.ok h4{color:var(--ok)}.pc.ko h4{color:var(--ko)}
  .src{font-size:13px;color:var(--tl);line-height:1.6;margin-top:14px}
  .src a{color:var(--tl)}
  .who{display:grid;gap:10px;margin-top:22px}
  .wh{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;background:#fff;border:1px solid var(--bd);border-radius:18px;padding:16px 20px}
  @media(max-width:620px){.wh{grid-template-columns:1fr}.wh .r{justify-self:start}}
  .wh p{margin:0;font-size:15px;color:var(--td)}
  .wh .r{display:inline-flex;align-items:center;gap:7px;font-weight:600;font-size:13.5px;padding:7px 12px;border-radius:99px;white-space:normal}
  .wh .r a{color:inherit}
  .r.yes{background:rgba(31,122,77,.1);color:var(--ok)}
  .r.mid{background:#FFF4D2;color:#7A5A00}
  .r.no{background:rgba(180,70,47,.08);color:var(--ko)}
  .go{background:linear-gradient(150deg,var(--gx),var(--g));color:#fff;border-radius:24px;padding:clamp(22px,3.5vw,32px);margin-top:20px}
  .go h3{font-family:'Fraunces','Fraunces Fallback',serif;font-weight:400;font-size:clamp(1.3rem,2.4vw,1.7rem);margin-bottom:6px}
  .go p{color:rgba(255,255,255,.75);margin:0 0 16px;font-size:15px}
  .go .code{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;background:rgba(255,255,255,.07);border:1px dashed rgba(255,213,107,.4);border-radius:16px;padding:12px 14px;margin-top:16px;font-size:14.5px;color:rgba(255,255,255,.85)}
  .go .code strong{font-family:'Fraunces','Fraunces Fallback',serif;font-size:22px;letter-spacing:2px;color:var(--y);font-weight:500}
  .go .code a{color:#fff}
  .go .bfl{margin-top:10px;font-size:14px;color:var(--y)}
  .go .bfl a{color:var(--y)}

  /* Prix */
  .plans{display:grid;gap:10px;margin-top:14px}
  .pl{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;background:var(--cr);border-radius:16px;padding:14px 16px}
  .pl b{display:block;font-size:15.5px;color:var(--td)}
  .pl small{font-size:12.5px;color:var(--tl)}
  .pl .pr{text-align:right;font-family:'Fraunces','Fraunces Fallback',serif;font-size:28px;color:var(--g);line-height:1}
  .pl .pr small{display:block;font-family:'Outfit','Outfit Fallback',sans-serif;font-size:11.5px;color:var(--tl);margin-top:3px}
  .pl.hot{background:var(--g);color:#fff}
  .pl.hot b{color:#fff}.pl.hot small{color:rgba(255,255,255,.7)}.pl.hot .pr{color:var(--y)}.pl.hot .pr small{color:rgba(255,255,255,.7)}
  .pl .tag{display:inline-block;margin-left:6px;font-size:10.5px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;background:var(--y);color:var(--gd);padding:2px 7px;border-radius:99px;vertical-align:middle}
  .tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22px;align-items:stretch}
  @media(max-width:760px){.tiers{grid-template-columns:1fr}}
  .ti{background:#fff;border:1px solid var(--bd);border-radius:22px;padding:24px 22px;display:flex;flex-direction:column;gap:10px}
  .ti h3{font-family:'Fraunces','Fraunces Fallback',serif;font-weight:400;font-size:22px;color:var(--td)}
  .ti .amt{font-family:'Fraunces','Fraunces Fallback',serif;font-size:clamp(2.4rem,4.5vw,3rem);line-height:1;color:var(--g)}
  .ti .amt small{font-family:'Outfit','Outfit Fallback',sans-serif;font-size:13px;color:var(--tl);margin-left:4px}
  .ti p{font-size:14.5px;margin:0}
  .ti .code{margin-top:auto;font-size:13.5px;font-weight:600;color:var(--ok);background:rgba(31,122,77,.08);border-radius:10px;padding:8px 10px}
  .ti .code.no{color:var(--tl);background:var(--cr);font-weight:500}
  .ti.hot{background:linear-gradient(160deg,var(--gx),var(--g));border-color:transparent;color:#fff;transform:translateY(-6px);box-shadow:0 26px 50px -28px rgba(0,51,41,.7)}
  @media(max-width:760px){.ti.hot{transform:none}}
  .ti.hot h3{color:#fff}.ti.hot .amt{color:var(--y)}.ti.hot .amt small{color:rgba(255,255,255,.65)}.ti.hot p{color:rgba(255,255,255,.78)}
  .ti.hot .code{color:var(--gd);background:var(--y)}
  .ti .pop{align-self:flex-start;font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;background:var(--y);color:var(--gd);padding:4px 9px;border-radius:99px}
  .vs2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:22px 0 16px}
  @media(max-width:640px){.vs2{grid-template-columns:1fr}}
  .vs2 div{border-radius:20px;padding:22px}
  .vs2 .m{background:#fff;border:1px solid var(--bd)}
  .vs2 .a{background:linear-gradient(150deg,var(--gx),var(--g));color:#fff}
  .vs2 span{font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--tl)}
  .vs2 .a span{color:var(--y)}
  .vs2 b{display:block;font-family:'Fraunces','Fraunces Fallback',serif;font-weight:400;font-size:clamp(1.6rem,3vw,2.1rem);margin:6px 0 4px;color:var(--td)}
  .vs2 .a b{color:#fff}
  .vs2 p{font-size:14.5px;margin:0}
  .vs2 .a p{color:rgba(255,255,255,.78)}
  .fee{display:flex;flex-wrap:wrap;align-items:center;gap:14px 22px;background:#fff;border:1px solid var(--bd);border-radius:22px;padding:22px 24px;margin:22px 0 16px}
  .fee .old{font-family:'Fraunces','Fraunces Fallback',serif;font-size:clamp(2.2rem,4vw,2.8rem);color:var(--tl);text-decoration:line-through;text-decoration-color:var(--ko);text-decoration-thickness:3px}
  .fee .arrow{color:var(--g);font-size:26px}
  .fee .new{font-family:'Fraunces','Fraunces Fallback',serif;font-size:clamp(2.6rem,5vw,3.4rem);color:var(--g)}
  .fee p{flex:1 1 260px;margin:0;font-size:15px}
  .costs{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22px}
  @media(max-width:760px){.costs{grid-template-columns:1fr}}
  .co-res small{display:block;font-size:13px;color:rgba(255,255,255,.75);margin-top:6px}

  /* Comparatif */
  .vsc{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
  .vsc>div{border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:8px}
  .vsc .lo{background:var(--g);color:#fff}
  .vsc .sm{background:var(--cr)}
  .vsc h3{font-family:'Fraunces','Fraunces Fallback',serif;font-weight:400;font-size:22px}
  .vsc .lo h3{color:var(--y)}
  .vsc .k2{font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;opacity:.7}
  .vsc b{font-size:14.5px;line-height:1.4}
  .vsc .pz{font-family:'Fraunces','Fraunces Fallback',serif;font-size:26px;line-height:1}
  .vsc .lo .pz{color:var(--y)}.vsc .sm .pz{color:var(--g)}
  .vsc small{font-size:12px;opacity:.75;line-height:1.4}
  .vsep{display:flex;align-items:center;justify-content:center;margin:-4px 0}
  .two{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:22px}
  @media(max-width:760px){.two{grid-template-columns:1fr}}
  .card{background:#fff;border:1px solid var(--bd);border-radius:22px;padding:24px}
  .card.dk{background:linear-gradient(160deg,var(--gx),var(--g));border-color:transparent;color:#fff}
  .card .tg{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--g);margin-bottom:8px}
  .card.dk .tg{color:var(--y)}
  .card h3{font-family:'Fraunces','Fraunces Fallback',serif;font-weight:400;font-size:clamp(1.3rem,2.3vw,1.6rem);margin-bottom:8px;color:var(--td);line-height:1.2}
  .card.dk h3{color:#fff}
  .card p{font-size:15px;margin:0}
  .card.dk p{color:rgba(255,255,255,.8)}
  .card ul{list-style:none;display:grid;gap:10px;margin:14px 0 0}
  .card li{display:flex;gap:10px;align-items:flex-start;font-size:15px;color:var(--tm);line-height:1.55}
  .card.dk li{color:rgba(255,255,255,.85)}
  .card li i{flex-shrink:0;margin-top:3px;color:var(--ok)}
  .card.dk li i{color:var(--y)}
  .card li strong{color:var(--td)}.card.dk li strong{color:#fff}
  .card .plus{margin-top:16px;padding-top:14px;border-top:1px solid var(--bd);font-size:14.5px;color:var(--tm);line-height:1.6}
  .card.dk .plus{border-color:rgba(255,255,255,.15);color:rgba(255,255,255,.8)}
  .card .plus b{color:var(--td)}.card.dk .plus b{color:var(--y)}
  .card.dk a{color:#fff}
  .cmp{margin-top:22px;background:#fff;border:1px solid var(--bd);border-radius:22px;overflow:hidden}
  .cmp-r{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.05fr) minmax(0,1.05fr);border-top:1px solid var(--bd)}
  .cmp-r:first-child{border-top:none}
  .cmp-r>div{padding:14px 18px;font-size:14.5px;color:var(--tm);line-height:1.5}
  .cmp-r>div:first-child{font-weight:600;color:var(--td)}
  .cmp-r>div:nth-child(2){background:rgba(0,76,63,.035)}
  .cmp-h>div{font-size:12px!important;font-weight:700!important;letter-spacing:1px;text-transform:uppercase;padding:14px 18px;color:var(--tl)!important}
  .cmp-h>div:nth-child(2){background:var(--g)!important;color:var(--y)!important}
  .cmp-h>div:nth-child(3){background:var(--cr)!important;color:var(--g)!important}
  .bd{display:inline-block;font-size:12.5px;font-weight:700;padding:2px 9px;border-radius:99px;margin-right:4px}
  .bd.y{background:rgba(31,122,77,.1);color:var(--ok)}
  .bd.p{background:#FFF4D2;color:#7A5A00}
  .bd.n{background:rgba(180,70,47,.08);color:var(--ko)}
  @media(max-width:700px){
    .cmp-h{display:none}
    .cmp-r{grid-template-columns:1fr 1fr}
    .cmp-r>div:first-child{grid-column:1/-1;background:var(--cr);padding:10px 16px;font-size:13.5px}
    .cmp-r>div:nth-child(2)::before{content:'Lodgify';display:block;font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--g);margin-bottom:4px}
    .cmp-r>div:nth-child(3)::before{content:'Smoobu';display:block;font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--tl);margin-bottom:4px}
    .cmp-r>div{padding:12px 16px}
  }
  .src2{font-size:13.5px;color:var(--tl);margin-top:12px;line-height:1.6}
  .src2 a{color:var(--tl)}

  /* Page partenaire v2 */
  .nofacts{height:clamp(40px,5vw,64px)}
  .cout2.solo{grid-template-columns:1fr}
  .cp-code strong.long{font-size:clamp(1.25rem,2.3vw,1.6rem);letter-spacing:1.5px}
  .cp-code strong{overflow-wrap:anywhere}
  .ofc .ofc-t{font-family:'Fraunces','Fraunces Fallback',serif;font-weight:400;font-size:clamp(1.7rem,3.2vw,2.3rem);line-height:1.1;letter-spacing:-.02em;color:var(--g);margin:8px 0 6px}
  .ofc .ofc-s{font-size:14.5px;color:var(--tm);line-height:1.55;margin:0}
  @media(min-width:861px){.steps.n3{grid-template-columns:repeat(3,1fr)}}
  .duo{display:flex;align-items:center;gap:12px;margin-bottom:18px}
  .duo .lg{width:48px;height:48px;border-radius:13px;background:#fff;display:flex;align-items:center;justify-content:center;font-family:'Fraunces','Fraunces Fallback',serif;font-size:24px;font-weight:600;color:var(--g)}
  .duo .x{color:rgba(255,255,255,.4);font-size:18px}
  .duo .jm{width:48px;height:48px;border-radius:13px;background:var(--y);color:var(--gd);display:flex;align-items:center;justify-content:center;font-family:'Fraunces','Fraunces Fallback',serif;font-size:19px;font-weight:600}
  .offer2{display:flex;flex-direction:column;gap:12px}
  .offer2 .pts{list-style:none;display:grid;gap:8px;margin:2px 0 4px}
  .offer2 .pts li{display:flex;gap:9px;align-items:flex-start;font-size:14px;color:rgba(255,255,255,.82);line-height:1.5}
  .offer2 .pts i{color:var(--y);font-size:16px;margin-top:2px}
  .offer2 .note2{font-size:12.5px;color:rgba(255,255,255,.55);line-height:1.5}
  .offer2 .note2 a{color:rgba(255,255,255,.75)}
  .why2{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22px}
  @media(max-width:860px){.why2{grid-template-columns:1fr}}
  .why2 .card:first-child{background:linear-gradient(160deg,var(--gx),var(--g));border-color:transparent;color:#fff}
  .why2 .card:first-child h3{color:#fff}.why2 .card:first-child p{color:rgba(255,255,255,.8)}.why2 .card:first-child .ic{background:var(--y);color:var(--gd)}
  .why2 .ic{display:inline-flex;width:44px;height:44px;align-items:center;justify-content:center;border-radius:12px;background:rgba(0,76,63,.07);color:var(--g);font-size:21px;margin-bottom:12px}
  .feat3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22px}
  @media(max-width:860px){.feat3{grid-template-columns:1fr 1fr}}
  @media(max-width:520px){.feat3{grid-template-columns:1fr}}
  .feat3 .ft h3{font-size:18px}
  .feat3 .ft p{font-size:14.5px}
  .feat3 .ft a{display:inline-flex;align-items:center;gap:5px;margin-top:8px;font-size:13.5px;font-weight:600}
  .wh .r.plain{background:var(--cr);color:var(--tm);font-weight:500}
  .wh .r .yes{color:inherit}.wh .r .partial{color:inherit}
  .cout2{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:16px;margin-top:22px;align-items:start}
  @media(max-width:860px){.cout2{grid-template-columns:1fr}}
  .cout2 .card p{font-size:15px;margin:0 0 12px}.cout2 .card p:last-child{margin:0}
  .prices{display:grid;gap:10px}
  .lim2{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:12px;margin-top:22px}
  .lim2 .er b{font-weight:500;font-size:14.5px;color:var(--tm);line-height:1.6;display:flex;gap:10px;align-items:flex-start;margin:0}
  .src{font-size:13px;color:var(--tl);line-height:1.7;margin-top:18px}
  .src a{color:var(--tl);text-decoration:underline}
`

function pageV2(p) {
  const v1 = page(p)
  const headPart = v1.slice(0, v1.indexOf('<style>'))
  const o = p.offre
  const badge = c => {
    const yes = /class="yes"/.test(c), part = /class="partial"/.test(c)
    const cls = yes ? 'yes' : part ? 'mid' : 'plain'
    const ic = yes ? 'check' : part ? 'minus' : 'info'
    return `<span class="r ${cls}"><i class="ph-bold ph-${ic}"></i><span>${c}</span></span>`
  }
  // Offre temporaire (Black Friday) : si p.bf.code, le coupon, le titre, l'accroche,
  // la carte « Code promo » et l'encadré du bas passent au code temporaire entre
  // p.bf.du et p.bf.au, puis reviennent seuls au code habituel (script en bas de
  // page). La page est écrite dans l'état du jour de la génération, le script corrige.
  const bfNow = Date.now()
  const bfOn = !!(p.bf && bfNow >= Date.parse(p.bf.du) && bfNow < Date.parse(p.bf.au))
  const bfAttr = (promo) => promo ? `data-bf${bfOn ? '' : ' hidden'}` : `data-nbf${bfOn ? ' hidden' : ''}`
  // Offre temporaire complète : avec un code (Lodgify JASON65) ou sans code, avec
  // un titre d'offre (JD2M Black Week, 2e année offerte).
  const bfPlein = !!(p.bf && (p.bf.code || p.bf.titre))
  const bfSwap = (normal, promo, tag = 'span') => (bfPlein && promo) ? `<${tag} ${bfAttr(false)}>${normal}</${tag}><${tag} ${bfAttr(true)}>${promo}</${tag}>` : normal
  const bfLine = p.bf && !bfPlein ? `<p class="bfl" data-bf data-bf-from="${p.bf.du}" data-bf-to="${p.bf.au}" hidden>${p.bf.texte}</p>` : ''
  const bfScript = p.bf ? `<script>
(function(){
  try {
    var now = Date.now(), on = now >= Date.parse('${p.bf.du}') && now < Date.parse('${p.bf.au}');
    document.querySelectorAll('[data-bf]').forEach(function(el){ el.hidden = !on; });
    document.querySelectorAll('[data-nbf]').forEach(function(el){ el.hidden = on; });
  } catch (e) {}
})();
</script>` : ''
  const copyScript = o.code ? `<script>
document.addEventListener('click', function(e){
  var b = e.target.closest('[data-copy]'); if (!b) return;
  var sp = b.querySelector('span');
  var done = function(){ b.classList.add('ok'); sp.textContent = 'Copié'; setTimeout(function(){ b.classList.remove('ok'); sp.textContent = 'Copier'; }, 2000); };
  if (navigator.clipboard) navigator.clipboard.writeText(b.getAttribute('data-copy')).then(done, function(){});
});
</script>` : ''
  return `${headPart}<style>${CSS2}</style>
</head>
<body>
<div id="nav-mount"></div>

<section class="hero bf-skip">
  <div class="hero-in">
    <div>
      <nav class="breadcrumb" aria-label="Fil d'ariane">
        <a href="/">Accueil</a><i class="ph ph-caret-right"></i>
        <a href="/partenaires">Partenaires</a><i class="ph ph-caret-right"></i>
        <span>${p.nom}</span>
      </nav>
      <div class="duo" aria-hidden="true"><span class="lg">${p.mono}</span><span class="x">×</span><span class="jm">JM</span></div>
      <span class="lbl"><i class="ph-bold ph-handshake"></i>${p.eyebrow}</span>
      <h1 class="h1">${bfSwap(p.h1, p.bf && p.bf.h1)}</h1>
      <p class="lead">${bfSwap(p.lead, p.bf && p.bf.lead)}</p>
    </div>
    <aside class="offer2" aria-label="Offre ${p.nom}">
      ${p.bf && p.bf.code ? `<div class="cp bf" ${bfAttr(true)}>
        <div class="cp-l">
          <span class="cp-tag"><i class="ph-bold ph-timer"></i> ${p.bf.tag}</span>
          <div class="cp-code"><strong>${p.bf.code}</strong><button type="button" class="copy" data-copy="${p.bf.code}"><i class="ph ph-copy"></i><span>Copier</span></button></div>
          <p class="cp-sub">${p.bf.sous}</p>
        </div>
        <div class="cp-r"><div class="cp-pct">${p.bf.pct}</div><small>${p.bf.pctSous}</small></div>
      </div>` : ''}
      ${p.bf && !p.bf.code && p.bf.titre ? `<div class="vcard ofc ofc-bf" ${bfAttr(true)}><div class="k"><i class="ph-bold ph-timer"></i>${p.bf.tag}</div><p class="ofc-t">${p.bf.titre}</p><p class="ofc-s">${p.bf.sous}</p></div>` : ''}
      ${o.code ? `<div class="cp" id="code"${p.bf && p.bf.code ? ` ${bfAttr(false)}` : ''}>
        <div class="cp-l">
          <span class="cp-tag"><i class="ph-bold ph-gift"></i> Offre partenaire</span>
          <div class="cp-code"><strong${o.code.length > 9 ? ' class="long"' : ''}>${o.code}</strong><button type="button" class="copy" data-copy="${o.code}"><i class="ph ph-copy"></i><span>Copier</span></button></div>
          <p class="cp-sub">${o.sous}</p>
        </div>
        <div class="cp-r">${o.pct ? `<div class="cp-pct">${o.pct}</div>` : '<div class="cp-pct"><i class="ph-bold ph-tag"></i></div>'}<small>${o.pctSous}</small></div>
      </div>` : `<div class="vcard ofc"${bfPlein ? ` ${bfAttr(false)}` : ''}><div class="k"><i class="ph-bold ph-gift"></i>Offre partenaire</div><p class="ofc-t">${o.titre}</p><p class="ofc-s">${o.sous}</p></div>`}
      <ul class="pts">
${o.points.map((t, i) => `        <li><i class="ph-bold ph-check-circle"></i><span>${bfSwap(t, p.bf && p.bf.points && p.bf.points[i])}</span></li>`).join('\n')}
      </ul>
      ${p.bf && p.bf.cta ? `<div class="cta-row" ${bfAttr(true)}>${sponsored(p.bf.cta.href, 'b1', `<i class="ph-bold ph-rocket"></i>${p.bf.cta.label}`)}${o.cta2 ? sponsored(o.cta2.href, 'b2', `<i class="ph-bold ph-${o.cta2.icon || 'video-camera'}"></i>${o.cta2.label}`) : ''}</div>` : ''}
      <div class="cta-row"${p.bf && p.bf.cta ? ` ${bfAttr(false)}` : ''}>${sponsored(o.cta.href, 'b1', `<i class="ph-bold ph-rocket"></i>${o.cta.label}`)}${o.cta2 ? sponsored(o.cta2.href, 'b2', `<i class="ph-bold ph-${o.cta2.icon || 'video-camera'}"></i>${o.cta2.label}`) : ''}</div>
      <p class="note2">${o.note}</p>
    </aside>
  </div>
</section>

<main class="bf-skip">
${p.faits ? `
<div class="facts">
${p.faits.map(f => `  <div class="fact"><i class="ph-bold ph-${f.icon}"></i><span>${f.k}</span><b>${f.href ? `<a href="${f.href}">${bfSwap(f.v, f.vBf)}</a>` : bfSwap(f.v, f.vBf)}</b></div>`).join('\n')}
</div>
` : '<div class="nofacts"></div>'}
<section id="pourquoi">
  <div class="eye">Pourquoi</div>
  <h2>${p.pourquoi.titre}</h2>
  <div class="why2">
${p.pourquoi.items.map(i => `    <div class="card"><span class="ic"><i class="ph-bold ph-${i.icon}"></i></span><h3>${i.t}</h3><p>${i.d}</p></div>`).join('\n')}
  </div>
</section>

<section id="fonctionnalites">
  <div class="eye">Fonctionnalités</div>
  <h2>${p.fonctions.titre}</h2>
  <div class="feat3">
${p.fonctions.items.map(i => `    <div class="ft"><span class="ic"><i class="ph-bold ph-${i.icon}"></i></span><h3>${i.t}</h3><p>${i.d}</p>${i.href ? sponsored(i.href, '', `${i.lien} <i class="ph-bold ph-arrow-up-right"></i>`) + ' <span style="font-size:12px;color:var(--tl)">(lien affilié)</span>' : ''}</div>`).join('\n')}
  </div>
</section>

<section id="offre">
  <div class="eye">Mode d'emploi</div>
  <h2>Profiter de l'offre <em>en ${p.etapes.length} étapes</em></h2>
  <ol class="steps n${p.etapes.length}">
${p.etapes.map(e => `    <li><strong>${e.t}</strong>${e.d}</li>`).join('\n')}
  </ol>
</section>

<section id="choisir">
  <div class="eye">Pour qui</div>
  <h2>${p.tableau.titre}</h2>
  <div class="who">
${p.tableau.lignes.map(l => `    <div class="wh"><p>${l[0]}</p>${badge(l[1])}</div>`).join('\n')}
  </div>
  <p class="src" style="margin-top:12px">${p.tableau.note}</p>
</section>
${p.cout ? `
<section id="cout">
  <div class="eye">Budget</div>
  <h2>${p.cout.titre}</h2>
  <div class="cout2${p.cout.chiffres ? '' : ' solo'}">
    <div class="card">${p.cout.paras.map(t => `<p>${t}</p>`).join('')}</div>
    ${p.cout.chiffres ? `<div class="prices">${p.cout.chiffres.map(c => `<div class="pl${c.hot ? ' hot' : ''}"><div><b>${c.k}${c.hot ? '<span class="tag">Le plus courant</span>' : ''}</b><small>${c.s}</small></div><div class="pr">${c.v}<small>${c.vs}</small></div></div>`).join('')}</div>` : ''}
  </div>
</section>
` : ''}
<section id="limites">
  <div class="eye">Honnêtement</div>
  <h2>Les <em>limites</em>, honnêtement</h2>
  <div class="lim2">
${p.limites.map(t => `    <div class="er"><b><i class="ph-bold ph-warning-circle"></i><span>${t}</span></b></div>`).join('\n')}
  </div>
</section>

<section id="essayer">
  <div class="go">
    <h3>${bfSwap(o.titre, p.bf && (p.bf.code ? `${p.bf.pct} avec ${p.bf.code}` : p.bf.titre))}</h3>
    <p>${bfSwap(`${o.sous}.`, p.bf && p.bf.sous)}</p>
    ${p.bf && p.bf.cta ? `<div class="cta-row" ${bfAttr(true)}>${sponsored(p.bf.cta.href, 'b1', `<i class="ph-bold ph-rocket"></i>${p.bf.cta.label}`)}${o.cta2 ? sponsored(o.cta2.href, 'b2', `<i class="ph-bold ph-${o.cta2.icon || 'video-camera'}"></i>${o.cta2.label}`) : ''}</div>` : ''}
    <div class="cta-row"${p.bf && p.bf.cta ? ` ${bfAttr(false)}` : ''}>${sponsored(o.cta.href, 'b1', `<i class="ph-bold ph-rocket"></i>${o.cta.label}`)}${o.cta2 ? sponsored(o.cta2.href, 'b2', `<i class="ph-bold ph-${o.cta2.icon || 'video-camera'}"></i>${o.cta2.label}`) : ''}</div>
    ${p.bf && p.bf.code ? `<div class="code" ${bfAttr(true)}><strong>${p.bf.code}</strong><span>${p.bf.texte}</span></div>` : ''}
    ${o.code ? `<div class="code"${p.bf && p.bf.code ? ` ${bfAttr(false)}` : ''}><strong>${o.code}</strong><span>${o.codeTexte}</span></div>` : ''}
    ${bfLine}${p.bf && !p.bf.code && p.bf.titre ? `<p class="bfl" ${bfAttr(true)}>${p.bf.texte}</p>` : ''}
    <p class="aff-n">${o.note}</p>
  </div>
</section>

<section id="aller-plus-loin">
  <div class="eye">Aller plus loin</div>
  <h2>Pour aller <em>plus loin</em></h2>
  <div class="links">
${p.liens.map(l => `    <a class="lk" href="${l.href}"><b>${l.t}<i class="ph-bold ph-arrow-right"></i></b><span>${l.d}</span></a>`).join('\n')}
  </div>
</section>

<section id="faq">
  <div class="eye">FAQ</div>
  <h2><em>Questions fréquentes</em> sur ${p.nom}</h2>
  <div class="faq">
${p.faq.map(f => `    <details class="faq-i"><summary class="faq-q">${f.q} <i class="ph ph-caret-down"></i></summary><div class="faq-a">${f.a}</div></details>`).join('\n')}
  </div>
  <p class="src">Sources consultées en ${p.releve ?? 'septembre 2026'} : ${p.sources.map(([t, h]) => `<a href="${h}" rel="nofollow noopener" target="_blank">${t}</a>`).join(', ')}. Prix relevés en ${p.releve ?? 'septembre 2026'}, à vérifier sur la grille officielle avant de souscrire.</p>
</section>

<aside class="cta-banner">
  <h2>${p.cta.titre}</h2>
  <p>${p.cta.texte}</p>
  <div class="btns"><a href="${p.cta.btn.href}" class="b1"><i class="ph-bold ph-rocket"></i>${p.cta.btn.label}</a></div>
</aside>

<p class="disc"><strong>Transparence :</strong> je suis partenaire de ${p.nom}. Les liens marqués affiliés me rapportent une commission, sans aucun surcoût pour toi. Mon avis reste indépendant, limites comprises.</p>
</main>

<div id="footer-mount"></div>
${copyScript}
${bfScript}
<script src="/nav.js" defer></script>
<script src="/footer.js" defer></script>
<script src="/cookie-banner.js" defer></script>
</body>
</html>
`
}

for (const p of PAGES) {
  if (p.title.length > 60) throw new Error(`Titre trop long (${p.title.length}) : ${p.title}`)
  const all = JSON.stringify(p)
  if (all.includes('—')) throw new Error(`Tiret cadratin dans la page ${p.slug}`)
  const dir = path.join(ROOT, 'partenaires', p.slug)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), p.v2 === false ? page(p) : pageV2(p))
  console.log(`[build-pages-partenaires] partenaires/${p.slug}/index.html (${plain(p.h1)})`)
}
