#!/usr/bin/env node
// Page « Photographe hôtel et conciergerie haut de gamme » (24/10/2026, Jason :
// « être présent aussi sur les requêtes photographe hôtel, conciergerie haut de
// gamme »). Page à part, pas dans les pages photographe LCD (autre intention de
// recherche, titres déjà à 60 caractères) : hôtels et résidences, conciergeries
// haut de gamme, gîtes et chambres d'hôtes. Liens vers Trouver un pro
// (?metier=photographe&type=…) et l'annuaire (filtre « Travaille pour »).
// Aucun prix : pas de grille fiable trouvée pour la France (24/10/2026), on
// explique ce qui fait varier le devis. Jamais citer Gîtes de France.
// Usage : node scripts/build-photographe-hotel.mjs  (page statique, pas lancée au build)

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const URL = 'https://jasonmarinho.com/photographe-hotel'
const TITLE = 'Photographe hôtel et conciergerie haut de gamme'
const DESC = 'Trouve un photographe ou un vidéaste pour ton hôtel, ta résidence, ta conciergerie haut de gamme ou ton gîte : décris ton besoin, les pros de ta zone te répondent. Gratuit.'
const LEGIFRANCE_L131_3 = 'https://www.legifrance.gouv.fr/codes/id/LEGIARTI000006278959/2006-08-03'

const PUBLICS = [
  ['ph-buildings', 'hotel', 'Hôtels et résidences', 'Chaque catégorie de chambre, les espaces communs, le restaurant, la piscine ou le spa : des images pour ton site, Booking et Expedia.'],
  ['ph-key', 'conciergerie', 'Conciergeries haut de gamme', 'Des logements de propriétaires à présenter avec la même qualité et le même style, d’une annonce à l’autre.'],
  ['ph-tree', 'gite', 'Gîtes et chambres d’hôtes', 'Le charme du lieu, les extérieurs et les détails qui font choisir ton hébergement plutôt qu’un autre.'],
  ['ph-house-line', 'lcd', 'Logements Airbnb et Booking', 'Pour un ou plusieurs logements en location courte durée, l’annuaire des photographes LCD de ta ville.'],
]

const COUVRE = [
  'Chaque catégorie de chambre ou de suite, sous son meilleur angle',
  'Les espaces communs : réception, salon, bar, restaurant, petit-déjeuner',
  'Les extérieurs, la façade, le jardin, la terrasse, la piscine',
  'Les détails qui racontent le lieu : matières, décoration, vue',
  'Une vidéo de présentation ou des vidéos courtes pour les réseaux',
  'Des vues au drone, si le pro est en règle avec l’aviation civile (DGAC)',
]

const DEVIS = [
  ['Le nombre de catégories de chambres et d’espaces à couvrir', 'C’est ce qui fixe la durée : une demi-journée pour un petit établissement, davantage pour un hôtel avec restaurant, spa et extérieurs.'],
  ['Le nombre d’images livrées et la retouche', 'Demande combien de photos retouchées tu reçois, dans quels formats, et sous quel délai.'],
  ['La vidéo et le drone', 'Ce sont des prestations à part. Pour le drone, demande au pro s’il est en règle avec l’aviation civile.'],
  ['Le déplacement', 'Un pro proche de chez toi évite les frais de route : l’annuaire te montre d’abord ceux de ta zone.'],
  ['Les droits d’utilisation', 'Site, plateformes de réservation, réseaux, affichage, impression : plus l’usage est large et long, plus il doit être écrit dans le devis.'],
]

const FAQ = [
  ['Combien coûte un photographe pour un hôtel ?', 'Cela dépend du nombre de chambres et d’espaces, de la durée, de la retouche, de la vidéo et des droits d’utilisation. Décris ton établissement : les photographes de ta zone t’envoient un devis.'],
  ['À qui appartiennent les photos de mon hôtel ?', 'Le photographe reste l’auteur de ses images. Ce que tu peux en faire (site, plateformes, réseaux, impression), où et pendant combien de temps doit être écrit dans le contrat ou le devis.'],
  ['Le photographe peut-il aussi filmer et faire des vues au drone ?', 'Beaucoup de pros de l’annuaire font les deux. Choisis la prestation dans ta demande : elle part d’abord à ceux qui la proposent. Pour le drone, demande au pro s’il est en règle avec l’aviation civile.'],
  ['C’est payant de faire une demande ?', 'Non. Ta demande est gratuite et sans commission : le devis et le paiement se règlent directement avec le photographe.'],
  ['Je suis photographe d’hôtel, comment recevoir ces demandes ?', 'Crée ta fiche et coche « Hôtels et résidences » (ou conciergeries, gîtes) dans « Tu travailles pour » : les demandes de ces établissements dans ta zone arrivent d’abord chez toi.'],
]

const CSS = `
:root{--g:#004C3F;--gd:#003329;--y:#FFD56B;--cr:#F7F5F0;--td:#0F1A0D;--tm:#3D5038;--tl:#6E7F6B;--bd:rgba(0,76,63,.11);--gs:#EEF4F1}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{font-family:'Outfit',sans-serif;background:var(--cr);color:var(--td);padding-top:64px}
body::before{content:'';position:fixed;top:0;left:0;right:0;height:64px;background:var(--gd);z-index:100}
.s-in{max-width:1120px;margin:0 auto;padding:0 clamp(16px,5vw,40px)}
.hero{background:radial-gradient(ellipse 60% 70% at 85% 10%,rgba(255,213,107,.10),transparent 70%),linear-gradient(160deg,#001a11 0%,var(--gd) 55%,#00463a 100%);color:#fff;padding:clamp(40px,6vw,72px) 0 clamp(48px,7vw,80px)}
.hero-grid{display:grid;gap:30px;align-items:center}
@media(min-width:960px){.hero-grid{grid-template-columns:minmax(0,1fr) 420px}}
.brd{font-size:13px;color:rgba(255,255,255,.45);margin-bottom:18px}.brd a{color:rgba(255,255,255,.65);text-decoration:none}
.eye{display:inline-block;font-size:11px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;color:rgba(255,213,107,.85);margin-bottom:12px}
h1{font-family:'Fraunces',serif;font-size:clamp(30px,4.6vw,50px);font-weight:400;line-height:1.08;letter-spacing:-.6px}
h1 em{color:var(--y);font-style:italic;font-weight:300}
.lead{font-size:16.5px;color:rgba(255,255,255,.78);line-height:1.7;max-width:620px;margin-top:16px}
.acts{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:50px;padding:0 22px;border-radius:12px;background:var(--y);color:var(--gd);font-weight:700;font-size:15.5px;text-decoration:none}
.btn:hover{background:#ffe08f}
.btn-o{display:inline-flex;align-items:center;gap:8px;min-height:50px;padding:0 20px;border-radius:12px;border:1px solid rgba(255,255,255,.3);color:#fff;font-weight:600;font-size:15px;text-decoration:none;background:rgba(255,255,255,.06)}
.btn-o:hover{border-color:rgba(255,255,255,.6)}
.ticks{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:20px;font-size:14px;color:rgba(255,255,255,.85)}
.ticks span{display:inline-flex;align-items:center;gap:7px}.ticks i{color:var(--y)}
.cover{border-radius:20px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.35);aspect-ratio:4/3;background:#00261e center/cover no-repeat}
@media(max-width:959px){.cover{display:none}}
section.blk{padding:clamp(40px,6vw,64px) 0}
section.blk+section.blk{padding-top:0}
h2{font-family:'Fraunces',serif;font-size:clamp(24px,3vw,32px);font-weight:400;line-height:1.2;margin-bottom:10px}
.sub{font-size:15.5px;color:var(--tm);line-height:1.65;max-width:70ch;margin-bottom:22px}
.grid4{display:grid;gap:14px}
@media(min-width:720px){.grid4{grid-template-columns:1fr 1fr}}
@media(min-width:1040px){.grid4{grid-template-columns:repeat(4,1fr)}}
.pc{background:#fff;border:1px solid var(--bd);border-radius:18px;padding:20px;display:flex;flex-direction:column;gap:10px;text-decoration:none;color:inherit;transition:border-color .15s}
.pc:hover{border-color:rgba(0,76,63,.35)}
.pc i.ic{width:42px;height:42px;border-radius:12px;background:var(--gs);color:var(--g);display:grid;place-items:center;font-size:21px}
.pc b{font-size:16px}
.pc span{font-size:14px;color:var(--tm);line-height:1.55;flex:1}
.pc em{font-style:normal;font-weight:600;color:var(--g);font-size:14px}
.two{display:grid;gap:22px}
@media(min-width:900px){.two{grid-template-columns:1fr 1fr;align-items:start}}
.card{background:#fff;border:1px solid var(--bd);border-radius:18px;padding:clamp(20px,3vw,28px)}
.list{list-style:none;display:grid;gap:11px}
.list li{display:flex;gap:10px;font-size:15px;color:var(--tm);line-height:1.55}
.list li i{color:#2F7D52;font-size:18px;flex-shrink:0;margin-top:2px}
.rows{display:grid;gap:14px}
.rows div b{display:block;font-size:15px;margin-bottom:3px}
.rows div span{font-size:14.5px;color:var(--tm);line-height:1.6}
.note{margin-top:16px;padding:14px 16px;border-radius:14px;background:var(--gs);font-size:14px;color:var(--gd);line-height:1.6}
.note a{color:var(--g);font-weight:600}
.steps{display:grid;gap:14px;counter-reset:s}
@media(min-width:820px){.steps{grid-template-columns:repeat(3,1fr)}}
.steps div{background:#fff;border:1px solid var(--bd);border-radius:18px;padding:20px;position:relative}
.steps div::before{counter-increment:s;content:counter(s);display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:var(--g);color:var(--y);font-family:'Fraunces',serif;margin-bottom:10px}
.steps b{display:block;margin-bottom:4px}
.steps span{font-size:14.5px;color:var(--tm);line-height:1.6}
.pro{background:linear-gradient(160deg,#001a11,var(--gd));color:#fff;border-radius:22px;padding:clamp(24px,4vw,40px);display:grid;gap:16px}
@media(min-width:860px){.pro{grid-template-columns:1fr auto;align-items:center}}
.pro h2{color:#fff}
.pro p{color:rgba(255,255,255,.78);line-height:1.65;font-size:15.5px}
.faq{display:grid;gap:12px}
@media(min-width:760px){.faq{grid-template-columns:1fr 1fr}}
.faq div{background:#fff;border:1px solid var(--bd);border-radius:14px;padding:18px 20px}
.faq h3{font-size:15.5px;font-weight:600;margin-bottom:6px}
.faq p{font-size:14.5px;color:var(--tm);line-height:1.6}
.menage{font-size:14.5px;color:var(--tm);line-height:1.6;margin-top:18px}
.menage a{color:var(--g);font-weight:600}
`

const ld = [
  { '@context': 'https://schema.org', '@type': 'WebPage', name: TITLE, url: URL, description: DESC, inLanguage: 'fr-FR' },
  { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://jasonmarinho.com' },
    { '@type': 'ListItem', position: 2, name: 'Photographes et vidéastes', item: 'https://jasonmarinho.com/annuaires/photographes' },
    { '@type': 'ListItem', position: 3, name: 'Photographe hôtel', item: URL },
  ] },
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
]

const demande = type => `/trouver-un-pro?metier=photographe&type=${type}`

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(TITLE)}</title>
<meta name="description" content="${esc(DESC)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${URL}">
<meta property="og:title" content="${esc(TITLE)}">
<meta property="og:description" content="${esc(DESC)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${URL}">
<meta property="og:image" content="https://jasonmarinho.com/img/exemple-fiches/photo-salon-4.jpg">
<link rel="shortcut icon" href="/favicon.ico">
<link rel="icon" href="/favicon.ico?v=2026-06" sizes="any">
<link rel="icon" type="image/png" sizes="96x96" href="/icon-96.png?v=2026-06">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2026-06">
<link rel="manifest" href="/manifest.json?v=2026-06">
<meta name="theme-color" content="#004C3F">
<link rel="stylesheet" href="/fonts/site-fonts.css?v=ce727d0a60">
<link rel="stylesheet" type="text/css" href="/fonts/phosphor-bold-subset.css?v=29999e9550">
<style>${CSS}</style>
${ld.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
<script defer src="/nav.js"></script>
</head>
<body>
<header class="hero">
  <div class="s-in hero-grid">
    <div>
      <div class="brd"><a href="/">Accueil</a> · <a href="/annuaires/photographes">Photographes et vidéastes</a> · <span>Hôtels</span></div>
      <span class="eye">Hôtels · résidences · conciergeries haut de gamme · gîtes</span>
      <h1>Un photographe pour ton hôtel, <em>sans chercher des heures</em></h1>
      <p class="lead">Des images qui donnent envie de réserver, sur ton site comme sur Booking et Expedia. Décris ton établissement en une minute : la demande part aux photographes et vidéastes de ta zone, d’abord à ceux qui travaillent déjà pour des hôtels.</p>
      <div class="acts">
        <a class="btn" href="${demande('hotel')}"><i class="ph-bold ph-paper-plane-tilt"></i>Décrire mon besoin</a>
        <a class="btn-o" href="/annuaires/photographes"><i class="ph-bold ph-camera"></i>Voir les photographes</a>
      </div>
      <div class="ticks"><span><i class="ph-bold ph-check"></i>Gratuit</span><span><i class="ph-bold ph-check"></i>Sans commission</span><span><i class="ph-bold ph-check"></i>Réponse directe du pro</span></div>
    </div>
    <div class="cover" style="background-image:url(/img/exemple-fiches/photo-salon-4.jpg)" role="img" aria-label="Salon photographié pour une annonce"></div>
  </div>
</header>

<main>
  <section class="blk"><div class="s-in">
    <h2>Pour quel établissement ?</h2>
    <p class="sub">Choisis ton type d’hébergement : la demande est adaptée (nombre de chambres, de logements) et part d’abord aux pros qui connaissent ce métier.</p>
    <div class="grid4">
      ${PUBLICS.map(([ic, k, t, d]) => `<a class="pc" href="${k === 'lcd' ? '/annuaires/photographes' : demande(k)}"><i class="ph-bold ${ic} ic"></i><b>${esc(t)}</b><span>${esc(d)}</span><em>${k === 'lcd' ? 'Voir l’annuaire' : 'Décrire mon besoin'} <i class="ph-bold ph-arrow-right"></i></em></a>`).join('\n      ')}
    </div>
  </div></section>

  <section class="blk"><div class="s-in two">
    <div class="card">
      <h2>Ce qu’un shooting d’hôtel couvre</h2>
      <ul class="list">${COUVRE.map(t => `<li><i class="ph-bold ph-check-circle"></i><span>${esc(t)}</span></li>`).join('')}</ul>
    </div>
    <div class="card">
      <h2>Ce qui fait varier le devis</h2>
      <div class="rows">${DEVIS.map(([t, d]) => `<div><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join('')}</div>
    </div>
  </div></section>

  <section class="blk"><div class="s-in">
    <div class="card">
      <h2>Les droits d’utilisation, à écrire dans le devis</h2>
      <p class="sub" style="margin-bottom:0">Le photographe reste l’auteur de ses images. Le Code de la propriété intellectuelle prévoit que chaque droit cédé soit mentionné et délimité : ce que tu fais des photos (site, plateformes de réservation, réseaux, impression), où, et pendant combien de temps. Fais-le préciser noir sur blanc avant la séance, surtout si les images serviront aussi à une chaîne, une agence ou de l’affichage.</p>
      <p class="note">Source : <a href="${LEGIFRANCE_L131_3}" target="_blank" rel="noopener">article L131-3 du Code de la propriété intellectuelle (Légifrance)</a>. En cas de doute sur un contrat, demande conseil à un juriste.</p>
    </div>
  </div></section>

  <section class="blk"><div class="s-in">
    <h2>Comment ça marche</h2>
    <div class="steps">
      <div><b>Tu décris ton établissement</b><span>Type, nombre de chambres, ville, ce qu’il te faut (photos, vidéo, drone), pour quand.</span></div>
      <div><b>La demande part aux pros de ta zone</b><span>3 au plus, d’abord ceux qui travaillent pour des hôtels et qui proposent ce que tu demandes.</span></div>
      <div><b>Ils te répondent directement</b><span>Devis, séance et paiement se règlent entre vous, sans commission. Sans réponse sous 48 h, d’autres pros prennent le relais.</span></div>
    </div>
    <p class="menage">Une conciergerie qui cherche aussi une équipe de ménage pour ses logements ? <a href="/trouver-un-pro?metier=menage&type=conciergerie">Décris ton besoin de ménage</a>.</p>
  </div></section>

  <section class="blk"><div class="s-in">
    <div class="pro">
      <div>
        <h2>Tu es photographe ou vidéaste pour l’hôtellerie ?</h2>
        <p>Crée ta fiche et coche « Hôtels et résidences » dans « Tu travailles pour » : les demandes des hôtels, des conciergeries et des gîtes de ta zone arrivent d’abord chez toi. Ta fiche sert aussi de site vitrine sur Google, sans commission sur tes séances.</p>
      </div>
      <a class="btn" href="/annuaires/photographes/inscription"><i class="ph-bold ph-user-plus"></i>Créer ma fiche</a>
    </div>
  </div></section>

  <section class="blk"><div class="s-in">
    <h2>Questions fréquentes</h2>
    <div class="faq">${FAQ.map(([q, a]) => `<div><h3>${esc(q)}</h3><p>${esc(a)}</p></div>`).join('')}</div>
  </div></section>
</main>
<script defer src="/footer.js"></script>
<script src="/cookie-banner.js" defer></script>
</body>
</html>
`

if (TITLE.length > 60) throw new Error('Titre trop long')
if (html.includes('—')) throw new Error('Tiret cadratin')
if (/g[iî]tes de france/i.test(html)) throw new Error('Gîtes de France ne doit pas être cité')
fs.mkdirSync(path.join(ROOT, 'photographe-hotel'), { recursive: true })
fs.writeFileSync(path.join(ROOT, 'photographe-hotel', 'index.html'), html, 'utf8')
console.log('[photographe-hotel] /photographe-hotel')
