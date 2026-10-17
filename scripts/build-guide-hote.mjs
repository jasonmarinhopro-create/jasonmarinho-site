#!/usr/bin/env node
// Guide « Devenir hôte Airbnb à <ville> » (devenir-hote-airbnb-<slug>), 17/10/2026.
// Jason : « quand on crée une nouvelle ville, on la crée pour tout le monde » :
// photographe, ménage ET hôte. Les 60 premiers guides ont été écrits à la main ;
// les nouveaux sont générés ici, avec la même mise en page
// (scripts/lib/guide-hote-style.mjs), uniquement à partir de faits vérifiés :
//  - scripts/data/villes-local.mjs : réglementation, taxe, saisons, conseils
//    ménage et photo, sources (bloc obligatoire, vérifié par recherche web) ;
//  - footer.js (CITIES) : nom, description, annonces / prix / occupation, dont
//    la source est citée dans `marche` de villes-local.mjs ;
//  - scripts/lib/fiscal-params.mjs : micro-BIC 2026.
// Les encadrés communs (taxe de séjour, estimation, liens photographe et
// ménage) sont ajoutés ensuite par les scripts d'injection : lancer plutôt
// `node scripts/creer-ville.mjs <slug>`, qui fait tout dans l'ordre.
//
// Usage : node scripts/build-guide-hote.mjs <slug> [--force]
// Sans --force, refuse d'écraser un guide existant (les anciens sont écrits à la main).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { VILLES_LOCAL, aVille, deVille } from './data/villes-local.mjs'
import { FISCAL_PARAMS_2026 as F } from './lib/fiscal-params.mjs'
import { GUIDE_CSS, ORGANIZATION_JSONLD } from './lib/guide-hote-style.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const strip = s => String(s ?? '').replace(/<[^>]+>/g, '')
const eur = n => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`
const pct = r => `${Math.round(r * 100)} %`

export function loadCities() {
  const src = fs.readFileSync(path.join(ROOT, 'footer.js'), 'utf8')
  const open = src.indexOf('[', src.indexOf('var CITIES = ['))
  return new Function('return ' + src.slice(open, src.indexOf('];', open) + 1))()
}

export function buildGuideHote(c, L, today = new Date().toISOString().slice(0, 10)) {
  const v = c.name
  const a = aVille(v), de = deVille(v)
  const url = `https://jasonmarinho.com/devenir-hote-airbnb-${c.slug}`
  const title = [`Devenir hôte Airbnb ${a} : guide et règles 2026`, `Devenir hôte Airbnb ${a} : guide 2026`, `Devenir hôte Airbnb ${a}`].find(t => t.length <= 60)
  const desc = `Se lancer en location courte durée ${a} en 2026 : réglementation, taxe de séjour, saisons, fiscalité, photos et ménage. Faits vérifiés et sources.`
  const nc = F.microBic.nonClasse, cl = F.microBic.classe
  const reg = L.reglementation ?? []
  const marche = L.marche ?? {}
  const sources = [...(marche.sources ?? []), ...(L.sources ?? [])]
  const stat = (val, lbl) => val ? `<div class="hero-stat"><div class="hero-stat-val">${esc(val)}</div><div class="hero-stat-lbl">${lbl}</div></div>` : ''
  const annonces = (c.ann || '').replace(/\s*annonces?/, '')
  const adr = (c.adr || '').replace(/\s*\/\s*nuit/, '').replace('-', '–')
  const occ = (c.occ || '').match(/\d+\s*%/)?.[0]?.replace(/\s/, ' ')

  const faqs = [
    { q: `Combien de nuits peut-on louer sa résidence principale ${a} ?`, a: L.faqPlafond },
    { q: `Faut-il un numéro d'enregistrement pour louer ${a} ?`, a: `Oui. La loi Le Meur du 19 novembre 2024 généralise l'enregistrement de tous les meublés de tourisme, résidence principale comprise. Le numéro est à afficher sur chaque annonce, et un téléservice national est annoncé ; en attendant, renseignez-vous auprès de la mairie ou de l'intercommunalité ${de}.` },
    { q: `Combien peut rapporter une location courte durée ${a} ?`, a: `Cela dépend surtout de l'emplacement, de la taille du logement et de la saison. Notre estimateur gratuit calcule l'occupation, le prix par nuit et le revenu annuel ${a} en 30 secondes, à partir des données du marché local.` },
    { q: `Quel régime fiscal choisir ${a} ?`, a: `En micro-BIC, l'abattement est de ${pct(nc.abattement)} pour un meublé non classé (recettes jusqu'à ${eur(nc.plafond)}) et de ${pct(cl.abattement)} pour un meublé classé ou une chambre d'hôtes (jusqu'à ${eur(cl.plafond)}) sur les revenus 2026. Au régime réel, vous déduisez vos charges réelles et l'amortissement : souvent plus intéressant avec un crédit ou des travaux.` },
  ]

  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: title, description: desc, image: 'https://jasonmarinho.com/couverture-jason.webp',
      author: { '@type': 'Person', name: 'Jason Marinho', url: 'https://jasonmarinho.com/qui-suis-je' }, publisher: { '@type': 'Person', name: 'Jason Marinho' },
      datePublished: today, dateModified: today, mainEntityOfPage: { '@type': 'WebPage', '@id': url } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://jasonmarinho.com' },
      { '@type': 'ListItem', position: 2, name: 'Guides par ville', item: 'https://jasonmarinho.com/villes' },
      { '@type': 'ListItem', position: 3, name: `Devenir hôte ${a}`, item: url } ] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: strip(f.a) } })) },
  ].map(o => `<script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n</script>`).join('\n\n')

  const li = (items, icon) => items.map(t => `<div class="saison-item"><i class="ph ph-${icon}"></i><span>${t}</span></div>`).join('\n      ')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://jasonmarinho.com/couverture-jason.webp">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://jasonmarinho.com/couverture-jason.webp">
<link rel="shortcut icon" href="/favicon.ico">
<link rel="icon" href="/favicon.ico?v=2026-06" sizes="any">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2026-06">
<link rel="manifest" href="/manifest.json?v=2026-06">
<meta name="theme-color" content="#004C3F">
<link rel="stylesheet" href="/fonts/site-fonts.css?v=0e07aaf42e">
<link rel="stylesheet" type="text/css" href="/fonts/phosphor-bold-subset.css?v=29999e9550">
<link rel="stylesheet" type="text/css" href="/fonts/phosphor-regular-subset.css?v=868073a0d4">

${jsonld}
<style>${GUIDE_CSS}</style>
<script defer src="/nav.js"></script>
${ORGANIZATION_JSONLD}
</head>
<body>
<div id="nav-mount"></div>

<section class="hero">
  <div class="hero-in">
    <nav class="breadcrumb" aria-label="Fil d'ariane">
      <a href="/">Accueil</a>
      <i class="ph ph-caret-right"></i>
      <a href="/villes">Guides par ville</a>
      <i class="ph ph-caret-right"></i>
      <span>Devenir hôte ${esc(a)}</span>
    </nav>
    <span class="lbl"><i class="ph ph-map-pin"></i> Guide LCD 2026</span>
    <h1>Devenir hôte Airbnb <em>${esc(a)}</em></h1>
    <p style="color:rgba(255,255,255,.65);font-size:clamp(15px,1.5vw,17px);line-height:1.7;max-width:680px;margin:0">${esc(c.desc)}</p>
    <div class="hero-stats">
      ${stat(annonces, 'annonces actives')}
      ${stat(adr, 'prix moyen / nuit')}
      ${stat(occ, "taux d'occupation")}
    </div>
    ${marche.releve ? `<p style="color:rgba(255,255,255,.45);font-size:12.5px;margin:14px 0 0">Estimations du marché relevées en ${esc(marche.releve)}, sources en bas de page.</p>` : ''}
  </div>
</section>

<main>

  <section id="reglementation">
    <h2>Réglementation LCD <em>${esc(a)}</em></h2>
    <div class="info-cards">
      ${reg[0] ? `<div class="info-card">
        <h3><i class="ph ph-house" style="color:var(--g)"></i> Résidence principale</h3>
        <p>${reg[0]}</p>
      </div>` : ''}
      ${reg[1] ? `<div class="info-card">
        <h3><i class="ph ph-buildings" style="color:var(--g)"></i> Résidence secondaire ou logement dédié</h3>
        <p>${reg[1]}</p>
      </div>` : ''}
      <div class="info-card">
        <h3><i class="ph ph-file-text" style="color:var(--g)"></i> Enregistrement</h3>
        <p>${reg[2] ?? `Le numéro d'enregistrement est à afficher sur chaque annonce.`}</p>
      </div>
      <div class="info-card" style="grid-column:1/-1">
        <h3><i class="ph ph-receipt" style="color:var(--g)"></i> Taxe de séjour</h3>
        <!-- TAXE:START --><p>${L.taxe}</p><!-- TAXE:END -->
      </div>
    </div>
  </section>

  <section id="saisons">
    <h2>Quand les voyageurs viennent <em>${esc(a)}</em></h2>
    <div class="saison-list">
      ${li(L.pics ?? [], 'calendar-blank')}
    </div>
  </section>

  <section id="preparer">
    <h2>Préparer son logement <em>${esc(a)}</em></h2>
    <h3 style="margin-bottom:12px;font-size:1rem;color:var(--tl);text-transform:uppercase;letter-spacing:.6px;font-weight:600">Les photos de l'annonce</h3>
    <div class="saison-list">
      ${li(L.photo ?? [], 'camera')}
    </div>
    <h3 style="margin:22px 0 12px;font-size:1rem;color:var(--tl);text-transform:uppercase;letter-spacing:.6px;font-weight:600">Le ménage entre deux voyageurs</h3>
    <div class="saison-list">
      ${li(L.menage ?? [], 'sparkle')}
    </div>
  </section>

  <section id="fiscalite">
    <h2>Fiscalité LCD <em>${esc(a)}</em></h2>
    <div class="info-cards">
      <div class="info-card">
        <h3>Micro-BIC</h3>
        <p>Abattement de ${pct(nc.abattement)} pour un meublé non classé (recettes jusqu'à ${eur(nc.plafond)}), ${pct(cl.abattement)} pour un meublé classé ou une chambre d'hôtes (jusqu'à ${eur(cl.plafond)} sur les revenus 2026). Simple, adapté si vos charges réelles restent sous ce pourcentage. <a href="/services/simulateurs/fiscalite-micro-bic">Simuler mon micro-BIC</a></p>
      </div>
      <div class="info-card">
        <h3>Régime réel</h3>
        <p>Vous déduisez vos charges réelles (intérêts d'emprunt, travaux, assurance, taxe foncière) et l'amortissement du logement et du mobilier. Souvent plus intéressant avec un crédit ou des travaux.</p>
      </div>
      <div class="info-card">
        <h3>Cotisations sociales</h3>
        <p>Au-delà de ${eur(F.ei.seuilLmp)} de recettes par an en location courte durée, des cotisations sociales sont dues à l'Urssaf, même en LMNP, à la place des prélèvements sociaux.</p>
      </div>
    </div>
  </section>

  <section id="faq" class="faq">
    <h2>Questions fréquentes <em>${esc(a)}</em></h2>
    ${faqs.map(f => `<details>
      <summary>${f.q}</summary>
      <div class="faq-body">${f.a}</div>
    </details>`).join('\n    ')}
  </section>

  <section id="sources">
    <h2>Sources <em>vérifiées</em></h2>
    <p style="font-size:14px">Règles, taxe et chiffres vérifiés en ${esc(L.verifie || 'octobre 2026')}. La réglementation change souvent : vérifiez auprès de la mairie ${de} avant de louer.</p>
    <ul style="font-size:13.5px;line-height:1.8;padding-left:18px">
      ${sources.map(s => `<li><a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.label)}</a></li>`).join('\n      ')}
    </ul>
  </section>

  <p style="text-align:center;margin:0 0 -16px;font-size:13px"><a href="/villes" style="color:var(--gd);text-decoration:none;display:inline-flex;align-items:center;gap:5px"><i class="ph ph-map-pin" style="font-size:13px"></i> Voir les guides des autres villes</a></p>
  <aside class="cta-banner">
    <h2>Démarre ton activité <em>LCD ${esc(a)}</em> du bon pied</h2>
    <p>Compte gratuit : planning ménage automatique, déclarations voyageurs, simulateurs fiscaux, formations pratiques et réponse à tes questions sous 48 h.</p>
    <div class="btns">
      <a href="https://app.jasonmarinho.com/auth/register" class="btn-p"><i class="ph ph-rocket"></i> Créer mon compte gratuit</a>
      <a href="/services" class="btn-ol"><i class="ph ph-arrow-right"></i> Voir tous les services</a>
    </div>
  </aside>

</main>

<div id="footer-mount"></div>
<script src="/footer.js" defer></script>
<script src="/cookie-banner.js" defer></script>
</body>
</html>
`
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [slug, flag] = process.argv.slice(2)
  if (!slug) throw new Error('Usage : node scripts/build-guide-hote.mjs <slug> [--force]')
  const c = loadCities().find(x => x.slug === slug)
  if (!c) throw new Error(`${slug} : absente de CITIES (footer.js)`)
  const L = VILLES_LOCAL[slug]
  if (!L || !L.pics?.length || !L.menage?.length || !L.photo?.length) throw new Error(`${slug} : bloc incomplet dans scripts/data/villes-local.mjs (pics, menage, photo, sources vérifiées)`)
  const file = path.join(ROOT, `devenir-hote-airbnb-${slug}`, 'index.html')
  if (fs.existsSync(file) && flag !== '--force') { console.log(`[guide-hote] ${slug} : guide déjà présent, gardé (--force pour le régénérer)`); process.exit(0) }
  const html = buildGuideHote(c, L)
  if (/—/.test(html.replace(/<style>[\s\S]*?<\/style>/, ''))) throw new Error('tiret cadratin dans le guide')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, html)
  console.log(`[guide-hote] devenir-hote-airbnb-${slug} écrit`)
}
