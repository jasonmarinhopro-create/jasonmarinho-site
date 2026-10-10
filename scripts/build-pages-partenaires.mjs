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
  body{font-family:'Outfit',sans-serif;background:var(--bg);color:var(--td);-webkit-font-smoothing:antialiased}
  a{color:var(--gd);text-decoration:none}
  a:hover{text-decoration:underline}
  .hero{background:linear-gradient(135deg,#001a11 0%,var(--gd) 100%);padding:clamp(96px,10vw,128px) 16px clamp(48px,6vw,80px)}
  .hero-in{max-width:1120px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:clamp(28px,5vw,64px);align-items:center}
  .breadcrumb{display:flex;align-items:center;flex-wrap:wrap;gap:8px;font-size:13px;color:rgba(255,255,255,.5);margin-bottom:20px}
  .breadcrumb a{color:rgba(255,255,255,.55)}
  .breadcrumb a:hover{color:#fff;text-decoration:none}
  .breadcrumb i{font-size:10px}
  .duo{display:flex;align-items:center;gap:12px;margin-bottom:18px}
  .duo .lg{width:48px;height:48px;border-radius:13px;background:#fff;display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-size:24px;font-weight:600}
  .duo .x{color:rgba(255,255,255,.4);font-size:18px}
  .duo .jm{width:48px;height:48px;border-radius:13px;background:var(--y);color:var(--gd);display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-size:19px;font-weight:600}
  .lbl{display:inline-block;background:rgba(255,213,107,.12);border:1px solid rgba(255,213,107,.25);color:var(--y);font-size:12px;letter-spacing:.6px;text-transform:uppercase;font-weight:500;padding:5px 12px;border-radius:20px;margin-bottom:14px}
  .h1{font-family:'Fraunces',serif;font-size:clamp(1.9rem,4vw,3rem);line-height:1.1;letter-spacing:-.02em;color:#fff;margin:0 0 18px;font-weight:300}
  .h1 em{color:var(--y);font-style:italic;font-weight:300}
  .lead{font-size:clamp(15px,1.5vw,17px);color:rgba(255,255,255,.68);line-height:1.7;margin:0}
  .offer{background:#fff;border-radius:20px;padding:clamp(22px,3vw,30px);box-shadow:0 24px 60px rgba(0,0,0,.25)}
  .offer .tag{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#7a5a00;background:rgba(255,213,107,.35);padding:4px 9px;border-radius:6px;margin-bottom:14px}
  .offer .big{font-family:'Fraunces',serif;font-size:clamp(1.6rem,3vw,2.2rem);font-weight:400;letter-spacing:-.02em;color:var(--td);line-height:1.1;margin:0 0 4px}
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
  h2{font-family:'Fraunces',serif;font-size:clamp(1.5rem,2.6vw,2.1rem);font-weight:400;letter-spacing:-.5px;margin:0 0 20px;color:var(--td)}
  h2 em{font-style:italic;color:var(--gd);font-weight:300}
  p{color:var(--tm);font-size:15.5px;line-height:1.7;margin:0 0 14px}
  .disc{font-size:13.5px;color:var(--tl);background:#fff;border:1px dashed var(--bd);border-radius:10px;padding:12px 16px;margin:0 0 clamp(36px,5vw,52px)}
  .disc strong{color:var(--tm)}
  .why{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
  .why div{background:#fff;border:1px solid var(--bd);border-radius:16px;padding:24px}
  .why i{display:flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:12px;background:var(--cr);color:var(--gd);font-size:22px;margin-bottom:14px}
  .why h3{font-family:'Fraunces',serif;font-size:1.15rem;font-weight:500;margin:0 0 8px;color:var(--td)}
  .why p{font-size:14.5px;margin:0}
  .feat{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--bd);border:1px solid var(--bd);border-radius:16px;overflow:hidden}
  .feat div{background:#fff;padding:22px;display:flex;flex-direction:column;gap:6px}
  .feat i{color:var(--gd);font-size:22px}
  .feat strong{font-size:15.5px;color:var(--td)}
  .feat span{font-size:14px;color:var(--tl);line-height:1.55}
  .feat a{font-size:13.5px;font-weight:600;margin-top:4px}
  .steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;counter-reset:st;list-style:none}
  .steps li{counter-increment:st;background:#fff;border:1px solid var(--bd);border-radius:16px;padding:24px;font-size:14.5px;color:var(--tm);line-height:1.6}
  .steps li::before{content:counter(st);display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:var(--gd);color:var(--y);font-family:'Fraunces',serif;font-weight:600;margin-bottom:14px}
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
    .hero-in{grid-template-columns:1fr}
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
<link rel="stylesheet" href="/fonts/site-fonts.css?v=0e07aaf42e">
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

for (const p of PAGES) {
  if (p.title.length > 60) throw new Error(`Titre trop long (${p.title.length}) : ${p.title}`)
  const all = JSON.stringify(p)
  if (all.includes('—')) throw new Error(`Tiret cadratin dans la page ${p.slug}`)
  const dir = path.join(ROOT, 'partenaires', p.slug)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), page(p))
  console.log(`[build-pages-partenaires] partenaires/${p.slug}/index.html (${plain(p.h1)})`)
}
