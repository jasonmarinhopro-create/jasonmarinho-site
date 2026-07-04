#!/usr/bin/env node
/**
 * Build script — génère les pages SEO ville × métier pros LCD :
 *
 *   /photographe-lcd-{ville}/index.html   (15 villes)
 *   /menage-lcd-{ville}/index.html        (15 villes)
 *
 * Double cible par page :
 *   - HÔTES qui cherchent "photographe airbnb lyon" / "ménage airbnb lyon"
 *     → guide local (tarifs, checklist, FAQ) + CTA annuaire
 *   - PROS qui étudient leur marché local
 *     → bandeau "Rejoins l'annuaire" → /devenir-photographe-lcd | /devenir-prestataire-menage-lcd
 *
 * Choix de nommage : "lcd" dans l'URL (cohérent marque + pages revenu-lcd-*),
 * "Airbnb" travaillé dans title/meta/contenu pour capter le volume de recherche.
 *
 * Script déterministe (aucune dépendance réseau) — lancer :
 *   node scripts/build-pages-pros-villes.mjs
 * puis committer l'output. Les données marché sont celles du footer (CITIES).
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ── Données marché par ville (source : CITIES du footer.js) ────────────────
// adrMin/adrMax en €/nuit. `revenu` : path de l'étude de revenus si publiée.
const VILLES = [
  { slug: 'paris',            name: 'Paris',            pre: 'à Paris',            adrMin: 110, adrMax: 220, occ: 80, annonces: '50 000', desc: "Le marché LCD le plus rentable et le plus encadré de France : plafond 120 nuits/an en résidence principale, compensation stricte ailleurs. Fashion Weeks, Roland-Garros, clientèle internationale exigeante." , revenu: '/calculateurs/revenu-airbnb-paris' },
  { slug: 'lyon',             name: 'Lyon',             pre: 'à Lyon',             adrMin: 75,  adrMax: 130, occ: 68, annonces: '6 200',  desc: "Capitale gastronomique, zone tendue avec règle de compensation stricte. Eurexpo, Fête des Lumières et un tourisme d'affaires soutenu toute l'année.", revenu: '/calculateurs/revenu-lcd-lyon' },
  { slug: 'bordeaux',         name: 'Bordeaux',         pre: 'à Bordeaux',         adrMin: 75,  adrMax: 125, occ: 65, annonces: '5 100',  desc: "Ville UNESCO, clientèle œnotouristique et affaires, marché en croissance avec des procédures de changement d'usage de plus en plus strictes.", revenu: '/calculateurs/revenu-lcd-bordeaux' },
  { slug: 'marseille',        name: 'Marseille',        pre: 'à Marseille',        adrMin: 70,  adrMax: 130, occ: 68, annonces: '7 800',  desc: "Vieux-Port, MuCEM, calanques : un marché LCD en pleine croissance, réglementation zone tendue stricte mais demande touristique forte.", revenu: '/calculateurs/revenu-lcd-marseille' },
  { slug: 'nice',             name: 'Nice',             pre: 'à Nice',             adrMin: 95,  adrMax: 160, occ: 72, annonces: '8 500',  desc: "Côte d'Azur, marché premium avec l'un des meilleurs RevPAR de France hors Paris. Carnaval, haute saison estivale, clientèle internationale.", revenu: '/calculateurs/revenu-lcd-nice' },
  { slug: 'annecy',           name: 'Annecy',           pre: 'à Annecy',           adrMin: 90,  adrMax: 150, occ: 64, annonces: '3 800',  desc: "La Venise des Alpes : lac, vieille ville, clientèle familiale et outdoor premium, avec un été exceptionnel et une saisonnalité marquée.", revenu: '/calculateurs/revenu-lcd-annecy' },
  { slug: 'strasbourg',       name: 'Strasbourg',       pre: 'à Strasbourg',       adrMin: 80,  adrMax: 140, occ: 68, annonces: '4 200',  desc: "Marchés de Noël (2M de visiteurs) + Parlement européen (12 sessions/an) : un marché bipolaire tourisme/institutionnel unique en France.", revenu: '/calculateurs/revenu-lcd-strasbourg' },
  { slug: 'lille',            name: 'Lille',            pre: 'à Lille',            adrMin: 75,  adrMax: 120, occ: 69, annonces: '3 600',  desc: "Braderie (2,5M de visiteurs en 48h), Eurostar Londres/Bruxelles, marchés de Noël : un marché LCD international et événementiel.", revenu: null },
  { slug: 'nantes',           name: 'Nantes',           pre: 'à Nantes',           adrMin: 70,  adrMax: 110, occ: 71, annonces: '3 900',  desc: "Voyage à Nantes (700k visiteurs), Hellfest à 30 min, hub tech en croissance : mix tourisme culturel + business + événementiel.", revenu: null },
  { slug: 'toulouse',         name: 'Toulouse',         pre: 'à Toulouse',         adrMin: 65,  adrMax: 110, occ: 70, annonces: '5 600',  desc: "Capitale aérospatiale (Airbus), 100k étudiants, rugby : un marché 3-en-1 avec demande business continue toute l'année.", revenu: '/calculateurs/revenu-lcd-toulouse' },
  { slug: 'montpellier',      name: 'Montpellier',      pre: 'à Montpellier',      adrMin: 70,  adrMax: 115, occ: 69, annonces: '4 700',  desc: "70 000 étudiants, climat doux, plages à 10 min : demande continue, saisonnalité estivale forte et workation hivernale.", revenu: '/calculateurs/revenu-lcd-montpellier' },
  { slug: 'biarritz',         name: 'Biarritz',         pre: 'à Biarritz',         adrMin: 110, adrMax: 200, occ: 63, annonces: '3 100',  desc: "Surf, luxe, Pays Basque : ADR parmi les plus élevés du Sud-Ouest, marché fortement saisonnier, clientèle espagnole importante.", revenu: '/calculateurs/revenu-lcd-biarritz' },
  { slug: 'cannes',           name: 'Cannes',           pre: 'à Cannes',           adrMin: 130, adrMax: 280, occ: 74, annonces: '3 200',  desc: "Festival du Film, MIPIM, Cannes Lions, Croisette : l'un des RevPAR les plus élevés de France, 5 événements pros + été.", revenu: '/calculateurs/revenu-lcd-cannes' },
  { slug: 'aix-en-provence',  name: 'Aix-en-Provence',  pre: "à Aix-en-Provence",  adrMin: 100, adrMax: 160, occ: 73, annonces: '2 400',  desc: "Cours Mirabeau, Festival d'Aix, Cézanne : l'un des marchés les plus premium de France, clientèle internationale aisée.", revenu: '/calculateurs/revenu-lcd-aix-en-provence' },
  { slug: 'la-rochelle',      name: 'La Rochelle',      pre: 'à La Rochelle',      adrMin: 80,  adrMax: 140, occ: 65, annonces: '2 800',  desc: "Vieux-Port, tourisme nautique, Francofolies : un marché moins saturé que les grandes métropoles, clientèle famille et nautisme.", revenu: '/calculateurs/revenu-lcd-la-rochelle' },
]

function escHtml(s) {
  if (s == null) return ''
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// Marché "premium" (ADR élevé) → fourchettes prestataires plus hautes
const isPremium = v => v.adrMin >= 95

// ── Squelette HTML commun ───────────────────────────────────────────────────
function pageShell({ title, desc, canonical, jsonLd, body }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(title)}</title>
<meta name="description" content="${escHtml(desc.slice(0, 160))}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${escHtml(title)}">
<meta property="og:description" content="${escHtml(desc.slice(0, 200))}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website">
<meta property="og:image" content="https://jasonmarinho.com/couverture-jason.webp">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://jasonmarinho.com/couverture-jason.webp">
<meta property="og:site_name" content="Jason Marinho">
<meta name="robots" content="index, follow">
<link rel="shortcut icon" href="/favicon.ico">
<link rel="icon" href="/favicon.ico?v=2026-06" sizes="any">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2026-06">
<link rel="manifest" href="/manifest.json?v=2026-06">
<meta name="theme-color" content="#004C3F">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,300;1,9..144,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<link rel="stylesheet" type="text/css" href="/fonts/phosphor-bold-subset.css">
<style>
:root{--g:#004C3F;--gd:#003329;--y:#FFD56B;--cr:#F7F5F0;--w:#FDFCF9;--td:#0F1A0D;--tm:#3D5038;--tl:#7A8C77;--bd:rgba(0,76,63,.09)}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Outfit',sans-serif;background:var(--w);color:var(--td);padding-top:64px}
body::before{content:'';position:fixed;top:0;left:0;right:0;height:64px;background:var(--gd);z-index:100}
a{color:inherit}
.hero{background:linear-gradient(160deg,#001a11 0%,var(--gd) 55%,#00463a 100%);padding:clamp(48px,7vw,80px) 0 clamp(44px,6vw,64px);color:#fff;position:relative;overflow:hidden}
.hero::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 60% 70% at 75% 40%,rgba(255,213,107,.05),transparent 70%);pointer-events:none}
.s-in{max-width:1100px;margin:0 auto;padding:0 clamp(20px,5vw,48px);position:relative}
.brd{font-size:13px;color:rgba(255,255,255,.4);margin-bottom:22px}
.brd a{color:rgba(255,255,255,.55);text-decoration:none}
.lbl{display:inline-block;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,213,107,.7);margin-bottom:14px}
.lbl.dk{color:var(--g)}
h1{font-family:'Fraunces',serif;font-size:clamp(30px,4.5vw,48px);font-weight:400;line-height:1.1;letter-spacing:-.5px;margin:0 0 16px}
h1 em{color:var(--y);font-style:italic;font-weight:300}
.lead{font-size:clamp(15px,1.5vw,16.5px);color:rgba(255,255,255,.68);line-height:1.75;max-width:660px;margin:0 0 26px}
.lead strong{color:#fff;font-weight:600}
.hero-ctas{display:flex;gap:12px;flex-wrap:wrap}
.btn-p{display:inline-flex;align-items:center;gap:8px;background:var(--y);color:var(--gd);font-weight:600;font-size:14.5px;padding:13px 24px;border-radius:10px;text-decoration:none;transition:all .2s}
.btn-p:hover{background:#ffe08f;transform:translateY(-1px)}
.btn-ol{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.25);color:rgba(255,255,255,.8);font-weight:500;font-size:14px;padding:12px 20px;border-radius:10px;text-decoration:none;transition:all .2s}
.btn-ol:hover{border-color:rgba(255,255,255,.55);color:#fff}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:34px;padding-top:26px;border-top:1px solid rgba(255,255,255,.09);max-width:660px}
.stat-n{font-family:'Fraunces',serif;font-size:clamp(22px,2.6vw,30px);color:var(--y);font-weight:400;line-height:1.1}
.stat-l{font-size:12px;color:rgba(255,255,255,.5);margin-top:5px;line-height:1.45}
@media(max-width:560px){.stats{grid-template-columns:1fr 1fr}}
.sec{padding:clamp(44px,6vw,68px) 0}
.sec.cr{background:var(--cr)}
h2{font-family:'Fraunces',serif;font-size:clamp(22px,2.8vw,30px);font-weight:400;color:var(--td);letter-spacing:-.3px;line-height:1.2;margin:0 0 14px}
h2 em{color:var(--g);font-style:italic;font-weight:300}
.sec p{font-size:15px;line-height:1.8;color:var(--tm);max-width:760px}
.sec p+p{margin-top:12px}
.sec p strong{color:var(--td)}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:28px}
@media(max-width:760px){.grid-2{grid-template-columns:1fr}}
.card{background:#fff;border:1px solid var(--bd);border-radius:14px;padding:24px}
.cr .card{background:#fff}
.card h3{font-family:'Fraunces',serif;font-size:17px;font-weight:400;color:var(--td);margin:0 0 10px}
.card p,.card li{font-size:14px;line-height:1.75;color:var(--tm)}
.tarif-table{width:100%;border-collapse:collapse;margin-top:24px;background:#fff;border:1px solid var(--bd);border-radius:14px;overflow:hidden;font-size:14px}
.tarif-table th{background:rgba(0,76,63,.05);text-align:left;padding:13px 16px;font-size:11.5px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--g);border-bottom:1px solid var(--bd)}
.tarif-table td{padding:14px 16px;border-bottom:1px solid var(--bd);color:var(--tm);line-height:1.6;vertical-align:top}
.tarif-table tr:last-child td{border-bottom:none}
.tarif-table td:first-child{font-weight:600;color:var(--td);white-space:nowrap}
.tarif-table .prix{font-family:'Fraunces',serif;font-weight:600;color:var(--g);white-space:nowrap}
.check-list{list-style:none;margin-top:22px;display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;max-width:760px}
@media(max-width:640px){.check-list{grid-template-columns:1fr}}
.check-list li{display:flex;align-items:flex-start;gap:10px;font-size:14.5px;line-height:1.6;color:var(--tm);padding:4px 0}
.check-list li i{color:var(--g);flex-shrink:0;margin-top:3px}
.note{margin-top:22px;padding:16px 20px;background:rgba(255,213,107,.09);border:1px solid rgba(255,213,107,.3);border-radius:12px;font-size:13.5px;line-height:1.7;color:var(--tm);max-width:760px}
.note strong{color:var(--td)}
.faq{max-width:820px}
.faq details{background:#fff;border:1px solid var(--bd);border-radius:12px;margin-top:10px;overflow:hidden}
.faq summary{padding:16px 20px;font-size:15px;font-weight:600;color:var(--td);cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:12px}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:'+';font-family:'Fraunces',serif;font-size:20px;color:var(--g);flex-shrink:0}
.faq details[open] summary::after{content:'–'}
.faq .faq-a{padding:0 20px 18px;font-size:14px;line-height:1.75;color:var(--tm)}
.pro-band{background:linear-gradient(160deg,#001a11 0%,var(--gd) 60%,#00463a 100%);border-radius:18px;padding:clamp(28px,4vw,44px);color:#fff;display:flex;align-items:center;gap:28px;flex-wrap:wrap;margin-top:8px}
.pro-band-txt{flex:1;min-width:260px}
.pro-band h2{color:#fff;margin-bottom:10px}
.pro-band h2 em{color:var(--y)}
.pro-band p{color:rgba(255,255,255,.65);font-size:14.5px;line-height:1.7;max-width:560px}
.links-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;margin-top:26px}
.link-card{display:flex;flex-direction:column;gap:6px;padding:18px 20px;background:#fff;border:1px solid var(--bd);border-radius:13px;text-decoration:none;transition:transform .18s,box-shadow .18s}
.link-card:hover{transform:translateY(-2px);box-shadow:0 10px 26px rgba(0,76,63,.10)}
.link-card .lc-t{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--g)}
.link-card .lc-h{font-family:'Fraunces',serif;font-size:16px;color:var(--td);line-height:1.3}
.link-card .lc-a{font-size:12.5px;font-weight:600;color:var(--g);margin-top:4px;display:inline-flex;align-items:center;gap:5px}
</style>
${jsonLd}
<script defer src="/nav.js"></script>
</head>
<body>
${body}
<script defer src="/footer.js"></script>
<script src="/cookie-banner.js" defer></script>
</body>
</html>
`
}

function faqJsonLd(faqs) {
  return `<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') },
  })),
})}
</script>`
}

function breadcrumbJsonLd(items) {
  return `<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.item })),
})}
</script>`
}

function serviceJsonLd({ name, url, desc, ville }) {
  return `<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name,
  url,
  description: desc,
  inLanguage: 'fr-FR',
  provider: { '@type': 'Person', name: 'Jason Marinho', url: 'https://jasonmarinho.com' },
  areaServed: { '@type': 'City', name: ville, containedInPlace: { '@type': 'Country', name: 'France' } },
})}
</script>`
}

function faqHtml(faqs) {
  return `<div class="faq">${faqs.map(f => `
<details>
  <summary>${f.q}</summary>
  <div class="faq-a">${f.a}</div>
</details>`).join('')}
</div>`
}

function linksRow(v, metier) {
  const cards = []
  cards.push(`<a class="link-card" href="/devenir-hote-airbnb-${v.slug}"><span class="lc-t">Guide local</span><span class="lc-h">Devenir hôte ${escHtml(v.pre)}</span><span class="lc-a">Lire le guide <i class="ph-bold ph-arrow-right"></i></span></a>`)
  if (v.revenu) cards.push(`<a class="link-card" href="${v.revenu}"><span class="lc-t">Étude de revenus</span><span class="lc-h">Combien rapporte la LCD ${escHtml(v.pre)} ?</span><span class="lc-a">Voir les chiffres <i class="ph-bold ph-arrow-right"></i></span></a>`)
  if (metier === 'photographe') {
    cards.push(`<a class="link-card" href="/menage-lcd-${v.slug}"><span class="lc-t">Autre prestataire</span><span class="lc-h">Équipe de ménage LCD ${escHtml(v.pre)}</span><span class="lc-a">Voir le guide <i class="ph-bold ph-arrow-right"></i></span></a>`)
    cards.push(`<a class="link-card" href="/annuaires/photographes"><span class="lc-t">Annuaire vérifié</span><span class="lc-h">Tous les photographes LCD</span><span class="lc-a">Voir l'annuaire <i class="ph-bold ph-arrow-right"></i></span></a>`)
  } else {
    cards.push(`<a class="link-card" href="/photographe-lcd-${v.slug}"><span class="lc-t">Autre prestataire</span><span class="lc-h">Photographe LCD ${escHtml(v.pre)}</span><span class="lc-a">Voir le guide <i class="ph-bold ph-arrow-right"></i></span></a>`)
    cards.push(`<a class="link-card" href="/annuaires/menage"><span class="lc-t">Annuaire vérifié</span><span class="lc-h">Toutes les équipes ménage LCD</span><span class="lc-a">Voir l'annuaire <i class="ph-bold ph-arrow-right"></i></span></a>`)
  }
  return `<div class="links-row">${cards.join('')}</div>`
}

// ── PAGE PHOTOGRAPHE ────────────────────────────────────────────────────────
function buildPhotographePage(v) {
  const url = `https://jasonmarinho.com/photographe-lcd-${v.slug}`
  const title = `Photographe Airbnb ${v.pre} : tarifs & annuaire LCD | Jason Marinho`
  const desc = `Trouver un photographe spécialisé Airbnb et location courte durée ${v.pre} : tarifs constatés, les photos indispensables, comment briefer, annuaire vérifié. ${v.annonces} annonces sur le marché, des photos pro rentabilisées en quelques nuits.`
  const amortNuits = Math.max(2, Math.ceil(300 / v.adrMin))
  const premium = isPremium(v)
  const t1 = premium ? '200 – 300 €' : '150 – 250 €'
  const t2 = premium ? '300 – 500 €' : '250 – 400 €'
  const t3 = premium ? '500 € et +' : '400 € et +'

  const faqs = [
    { q: `Combien coûte un photographe Airbnb ${v.pre} ?`,
      a: `Comptez <strong>${t1}</strong> pour une session essentielle (15-20 photos HDR d'un studio ou T2), <strong>${t2}</strong> pour une session standard (25-35 photos, mise en scène, retouches poussées) et <strong>${t3}</strong> pour du premium avec drone, crépuscule ou vidéo. ${premium ? `Sur un marché premium comme ${v.name}, les tarifs sont un cran au-dessus de la moyenne nationale — cohérent avec des nuitées à ${v.adrMin}-${v.adrMax} €.` : `À ${v.name}, ces fourchettes correspondent au marché constaté auprès des hôtes.`}` },
    { q: `En combien de temps un shooting pro est-il rentabilisé ${v.pre} ?`,
      a: `Avec un tarif moyen de <strong>${v.adrMin} à ${v.adrMax} € la nuit</strong> ${v.pre}, une session standard à ~300 € est amortie en <strong>${amortNuits} nuit${amortNuits > 1 ? 's' : ''} vendue${amortNuits > 1 ? 's' : ''}</strong>. Or de meilleures photos augmentent le taux de clic sur votre annonce et permettent souvent de monter le prix de 5 à 15 % : le shooting se rembourse généralement sur le premier mois.` },
    { q: `Combien de photos faut-il pour une annonce ${v.pre} ?`,
      a: `Visez <strong>25 à 35 photos</strong> : la photo de couverture (la plus travaillée, elle fait le taux de clic), chaque pièce sous 2-3 angles, les détails qui différencient (vue, baignoire, terrasse) et 2-3 photos du quartier. Sur un marché à ${v.annonces} annonces comme ${v.name}, la couverture fait la différence dans les résultats de recherche Airbnb et Booking.` },
    { q: `Faut-il un photographe spécialisé LCD plutôt qu'un photographe immobilier classique ?`,
      a: `Oui, et la nuance compte : le photographe immobilier vend des mètres carrés, le photographe LCD vend <strong>une expérience de séjour</strong>. Angles pensés pour les vignettes Airbnb/Booking, lumière chaleureuse, mise en scène voyageur (table dressée, plaid, guide ouvert)… C'est exactement ce que vérifie Jason avant d'accepter un photographe dans l'annuaire.` },
  ]

  const jsonLd = [
    serviceJsonLd({ name: `Photographe location courte durée ${v.pre}`, url, desc: desc.slice(0, 200), ville: v.name }),
    faqJsonLd(faqs),
    breadcrumbJsonLd([
      { name: 'Accueil', item: 'https://jasonmarinho.com/' },
      { name: 'Annuaire des photographes LCD', item: 'https://jasonmarinho.com/annuaires/photographes' },
      { name: `Photographe LCD ${v.pre}`, item: url },
    ]),
  ].join('\n')

  const body = `
<header class="hero">
  <div class="s-in">
    <div class="brd"><a href="/">Accueil</a> · <a href="/annuaires/photographes">Photographes LCD</a> · <span>${escHtml(v.name)}</span></div>
    <span class="lbl">Photographe · Airbnb, Booking &amp; réservation directe</span>
    <h1>Photographe LCD <em>${escHtml(v.pre)}</em></h1>
    <p class="lead">Sur les <strong>${v.annonces} annonces</strong> que compte ${escHtml(v.name)}, celles qui sortent du lot ont un point commun : des photos professionnelles. Tarifs locaux constatés, checklist des photos indispensables, questions à poser — et l'annuaire vérifié pour trouver le bon photographe.</p>
    <div class="hero-ctas">
      <a href="/annuaires/photographes" class="btn-p"><i class="ph-bold ph-magnifying-glass"></i> Trouver un photographe vérifié</a>
      <a href="/devenir-photographe-lcd" class="btn-ol"><i class="ph-bold ph-camera"></i> Je suis photographe ${escHtml(v.pre)}</a>
    </div>
    <div class="stats">
      <div><div class="stat-n">${v.adrMin}–${v.adrMax} €</div><div class="stat-l">tarif moyen par nuit ${escHtml(v.pre)}</div></div>
      <div><div class="stat-n">${v.occ} %</div><div class="stat-l">taux d'occupation moyen</div></div>
      <div><div class="stat-n">~${v.annonces}</div><div class="stat-l">annonces actives sur le marché</div></div>
    </div>
  </div>
</header>

<section class="sec">
  <div class="s-in">
    <span class="lbl dk">Le marché local</span>
    <h2>Pourquoi les photos pro comptent <em>autant ${escHtml(v.pre)}</em></h2>
    <p>${escHtml(v.desc)}</p>
    <p>Concrètement : avec des nuitées à <strong>${v.adrMin}-${v.adrMax} €</strong> et ~${v.annonces} annonces en concurrence directe, votre photo de couverture est votre premier levier de taux de clic. Les études des plateformes convergent : des photos professionnelles génèrent <strong>jusqu'à +40 % de réservations</strong> et permettent de positionner son prix dans le haut de la fourchette. Une session standard à ~300 € est amortie en <strong>${amortNuits} nuit${amortNuits > 1 ? 's' : ''} vendue${amortNuits > 1 ? 's' : ''}</strong>.</p>
    <div class="note"><strong>Le réflexe anti-dépendance :</strong> de bonnes photos ne servent pas qu'Airbnb et Booking. Ce sont les mêmes visuels qui font vivre votre fiche Google Business, vos réseaux et votre canal de réservation directe — là où vous ne payez aucune commission.</div>
  </div>
</section>

<section class="sec cr">
  <div class="s-in">
    <span class="lbl dk">Budget</span>
    <h2>Tarifs constatés <em>${escHtml(v.pre)}</em></h2>
    <table class="tarif-table">
      <tr><th>Formule</th><th>Tarif indicatif</th><th>Ce que ça couvre</th></tr>
      <tr><td>Essentiel</td><td class="prix">${t1}</td><td>15-20 photos HDR, studio ou T2, retouches de base. Suffisant pour démarrer proprement.</td></tr>
      <tr><td>Standard</td><td class="prix">${t2}</td><td>25-35 photos, mise en scène voyageur, retouches poussées, formats optimisés vignettes plateformes. Le meilleur rapport qualité/prix pour la plupart des logements.</td></tr>
      <tr><td>Premium</td><td class="prix">${t3}</td><td>Grande maison ou villa, drone, photos crépuscule (twilight), vidéo courte pour les réseaux.</td></tr>
    </table>
    <p style="margin-top:16px;font-size:13px;color:var(--tl)">Fourchettes constatées sur le marché ${escHtml(v.pre)} — chaque photographe fixe librement ses tarifs, affichés en transparence sur sa fiche annuaire.</p>
  </div>
</section>

<section class="sec">
  <div class="s-in">
    <span class="lbl dk">Checklist</span>
    <h2>Les photos <em>indispensables</em></h2>
    <ul class="check-list">
      <li><i class="ph-bold ph-check-circle"></i><span><strong>La couverture</strong> : la pièce la plus « waouh », lumière naturelle, angle large mais honnête</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>Chaque chambre</strong> : lit fait hôtelier, 2 angles minimum</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>La salle de bain</strong> : serviettes pliées, zéro objet personnel</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>La cuisine équipée</strong> : plan de travail dégagé, équipements visibles</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>L'espace de vie mis en scène</strong> : table dressée, plaid, lumières chaudes</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>Extérieurs et vue</strong> : terrasse, balcon, jardin — souvent décisifs ${escHtml(v.pre)}</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>Les détails différenciants</strong> : cheminée, baignoire, machine à café, déco signature</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>Le quartier</strong> : 2-3 photos qui vendent l'emplacement et l'ambiance locale</span></li>
    </ul>
    <div class="note"><strong>Avant le shooting :</strong> logement rangé comme pour un voyageur exigeant, ampoules toutes identiques (blanc chaud), rideaux ouverts, shooting calé en fin de matinée ou début d'après-midi selon l'orientation. Un bon photographe LCD vous enverra sa propre checklist de préparation — c'est bon signe.</div>
  </div>
</section>

<section class="sec cr">
  <div class="s-in">
    <span class="lbl dk">FAQ</span>
    <h2>Questions fréquentes <em>des hôtes ${escHtml(v.pre)}</em></h2>
    ${faqHtml(faqs)}
  </div>
</section>

<section class="sec">
  <div class="s-in">
    <div class="pro-band">
      <div class="pro-band-txt">
        <span class="lbl">Vous êtes photographe ${escHtml(v.pre)} ?</span>
        <h2>Rejoignez l'annuaire <em>des photographes LCD</em></h2>
        <p>Une fiche pro hébergée sur jasonmarinho.com, des demandes d'hôtes qualifiés ${escHtml(v.pre)} et dans votre zone, contact direct, zéro commission sur vos prestations. Sélection curée : portfolio LCD réel exigé.</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <a href="/devenir-photographe-lcd" class="btn-p"><i class="ph-bold ph-camera"></i> Découvrir le programme</a>
        <a href="/annuaires/photographes/inscription" class="btn-ol">Postuler directement</a>
      </div>
    </div>
  </div>
</section>

<section class="sec cr">
  <div class="s-in">
    <span class="lbl dk">Pour aller plus loin</span>
    <h2>Ressources LCD <em>${escHtml(v.pre)}</em></h2>
    ${linksRow(v, 'photographe')}
  </div>
</section>
`
  return pageShell({ title, desc, canonical: url, jsonLd, body })
}

// ── PAGE MÉNAGE ─────────────────────────────────────────────────────────────
function buildMenagePage(v) {
  const url = `https://jasonmarinho.com/menage-lcd-${v.slug}`
  const title = `Ménage Airbnb ${v.pre} : tarifs turnover & annuaire LCD | Jason Marinho`
  const desc = `Trouver une équipe de ménage spécialisée Airbnb et location courte durée ${v.pre} : tarifs turnover constatés, checklist complète, gestion du linge, questions à poser, annuaire vérifié.`
  const premium = isPremium(v)
  const m1 = premium ? '50 – 70 €' : '40 – 60 €'
  const m2 = premium ? '70 – 110 €' : '60 – 90 €'
  const m3 = premium ? '110 – 180 €' : '90 – 150 €'
  // Rotations/mois estimées par logement : occ% × 30 jours / séjour moyen 3 nuits
  const rotations = Math.round((v.occ / 100) * 30 / 3)

  const faqs = [
    { q: `Combien coûte un ménage Airbnb ${v.pre} ?`,
      a: `Pour un turnover complet (ménage + lits faits + contrôle), comptez <strong>${m1}</strong> pour un studio/T1, <strong>${m2}</strong> pour un T2/T3 et <strong>${m3}</strong> pour une grande maison. La gestion du linge (location + blanchisserie) s'ajoute souvent : 8 à 15 € par personne. ${premium ? `${v.name} étant un marché premium, les fourchettes sont un cran au-dessus de la moyenne nationale.` : ''}` },
    { q: `Qui paie le ménage : l'hôte ou le voyageur ?`,
      a: `Le voyageur, via les <strong>frais de ménage</strong> ajoutés au prix du séjour sur Airbnb et Booking. Bien calibrés, ils couvrent intégralement votre prestataire. Attention : des frais trop élevés plombent le classement de l'annonce et le taux de conversion — visez le coût réel de votre équipe, pas une marge cachée.` },
    { q: `Que doit inclure un vrai ménage de turnover ?`,
      a: `Bien plus qu'un ménage classique : nettoyage complet, <strong>lits faits qualité hôtelière</strong>, réassort des consommables (papier, savon, café), contrôle des équipements, signalement des dégâts photos à l'appui, parfois check du lave-vaisselle/lave-linge laissés par les voyageurs. Avec ${v.occ} % d'occupation ${v.pre}, un logement tourne environ <strong>${rotations} fois par mois</strong> — la régularité et la fiabilité comptent autant que la qualité.` },
    { q: `Comment trouver une équipe de ménage fiable ${v.pre} ?`,
      a: `Quatre critères non négociables : une <strong>RC pro</strong> à jour, une vraie expérience du turnover LCD (pas seulement du ménage de bureaux), la disponibilité week-ends et jours fériés (c'est là que tout se joue), et un plan B en cas d'absence. L'annuaire vérifié de Jason Marinho ne référence que des équipes contrôlées sur ces points, avec contact direct et zéro commission.` },
  ]

  const jsonLd = [
    serviceJsonLd({ name: `Ménage location courte durée ${v.pre}`, url, desc: desc.slice(0, 200), ville: v.name }),
    faqJsonLd(faqs),
    breadcrumbJsonLd([
      { name: 'Accueil', item: 'https://jasonmarinho.com/' },
      { name: 'Annuaire des équipes de ménage LCD', item: 'https://jasonmarinho.com/annuaires/menage' },
      { name: `Ménage LCD ${v.pre}`, item: url },
    ]),
  ].join('\n')

  const body = `
<header class="hero">
  <div class="s-in">
    <div class="brd"><a href="/">Accueil</a> · <a href="/annuaires/menage">Ménage LCD</a> · <span>${escHtml(v.name)}</span></div>
    <span class="lbl">Ménage turnover · Airbnb, Booking &amp; réservation directe</span>
    <h1>Équipe de ménage LCD <em>${escHtml(v.pre)}</em></h1>
    <p class="lead">Avec <strong>${v.occ} % d'occupation moyenne</strong>, un logement ${escHtml(v.pre)} tourne environ ${rotations} fois par mois. Le ménage est le maillon qui fait ou défait vos avis 5 étoiles. Tarifs locaux, checklist turnover, questions à poser — et l'annuaire vérifié pour trouver la bonne équipe.</p>
    <div class="hero-ctas">
      <a href="/annuaires/menage" class="btn-p"><i class="ph-bold ph-magnifying-glass"></i> Trouver une équipe vérifiée</a>
      <a href="/devenir-prestataire-menage-lcd" class="btn-ol"><i class="ph-bold ph-sparkle"></i> Je fais du ménage LCD ${escHtml(v.pre)}</a>
    </div>
    <div class="stats">
      <div><div class="stat-n">~${rotations}/mois</div><div class="stat-l">turnovers par logement en moyenne</div></div>
      <div><div class="stat-n">${v.occ} %</div><div class="stat-l">taux d'occupation moyen ${escHtml(v.pre)}</div></div>
      <div><div class="stat-n">~${v.annonces}</div><div class="stat-l">annonces actives sur le marché</div></div>
    </div>
  </div>
</header>

<section class="sec">
  <div class="s-in">
    <span class="lbl dk">Le marché local</span>
    <h2>Le ménage LCD ${escHtml(v.pre)}, <em>un vrai métier</em></h2>
    <p>${escHtml(v.desc)}</p>
    <p>Résultat : ~${v.annonces} annonces qui tournent, des check-out à 11h enchaînés sur des check-in à 15-16h, et zéro droit à l'erreur — la propreté est le critère n°1 des avis négatifs sur Airbnb et Booking. Une équipe spécialisée turnover, ce n'est pas « une femme de ménage » : c'est un partenaire qui connaît les standards hôteliers, gère le linge et vous alerte photos à l'appui au moindre souci.</p>
    <div class="note"><strong>Le calcul honnête :</strong> les frais de ménage payés par le voyageur couvrent la prestation. Un turnover à ${premium ? '70' : '60'} € sur un séjour moyen de 3 nuits à ${v.adrMin}-${v.adrMax} €/nuit, c'est moins de ${Math.max(5, Math.round(((premium ? 70 : 60) / (3 * v.adrMin)) * 100))} % du panier — et c'est ce qui protège vos 5 étoiles.</div>
  </div>
</section>

<section class="sec cr">
  <div class="s-in">
    <span class="lbl dk">Budget</span>
    <h2>Tarifs turnover constatés <em>${escHtml(v.pre)}</em></h2>
    <table class="tarif-table">
      <tr><th>Logement</th><th>Tarif indicatif</th><th>Ce que ça couvre</th></tr>
      <tr><td>Studio / T1</td><td class="prix">${m1}</td><td>Turnover complet : ménage, lit fait, salle de bain, réassort consommables, contrôle.</td></tr>
      <tr><td>T2 / T3</td><td class="prix">${m2}</td><td>Idem avec 2-3 couchages, cuisine complète, souvent 2 personnes pour tenir le créneau 11h-15h.</td></tr>
      <tr><td>Maison / villa</td><td class="prix">${m3}</td><td>Grands volumes, extérieurs, parfois piscine — équipe et durée dimensionnées en conséquence.</td></tr>
      <tr><td>Gestion du linge</td><td class="prix">8 – 15 € / pers.</td><td>Location de linge hôtelier + blanchisserie, ou lavage sur place facturé au forfait.</td></tr>
    </table>
    <p style="margin-top:16px;font-size:13px;color:var(--tl)">Fourchettes constatées sur le marché ${escHtml(v.pre)} — chaque équipe fixe librement ses tarifs, affichés en transparence sur sa fiche annuaire.</p>
  </div>
</section>

<section class="sec">
  <div class="s-in">
    <span class="lbl dk">Checklist</span>
    <h2>La checklist turnover <em>complète</em></h2>
    <ul class="check-list">
      <li><i class="ph-bold ph-check-circle"></i><span><strong>Lits refaits qualité hôtelière</strong> : linge frais, coins carrés, plaid dressé</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>Salle de bain impeccable</strong> : calcaire, joints, serviettes pliées, miroirs</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>Cuisine à blanc</strong> : vaisselle rangée, frigo vidé et essuyé, plaques dégraissées</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>Réassort consommables</strong> : papier, savon, éponge neuve, café/thé d'accueil</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>Contrôle équipements</strong> : wifi, TV, chauffage/clim, ampoules, piles télécommandes</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>Poubelles sorties</strong> et tri selon les consignes de la copropriété</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>Signalement photos</strong> : dégâts, objets oubliés, stocks bas — avant le prochain check-in</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>Mise en scène finale</strong> : rideaux, coussins, petit mot d'accueil — prêt pour les photos des voyageurs</span></li>
    </ul>
    <div class="note"><strong>Les 4 questions à poser avant d'engager :</strong> avez-vous une RC pro à jour ? Travaillez-vous les week-ends et jours fériés ? Quel est votre délai de réservation d'un créneau ? Qui me remplace en cas d'absence ? Une équipe pro répond aux quatre sans hésiter.</div>
  </div>
</section>

<section class="sec cr">
  <div class="s-in">
    <span class="lbl dk">FAQ</span>
    <h2>Questions fréquentes <em>des hôtes ${escHtml(v.pre)}</em></h2>
    ${faqHtml(faqs)}
  </div>
</section>

<section class="sec">
  <div class="s-in">
    <div class="pro-band">
      <div class="pro-band-txt">
        <span class="lbl">Vous faites du ménage ${escHtml(v.pre)} ?</span>
        <h2>Rejoignez l'annuaire <em>des équipes ménage LCD</em></h2>
        <p>Une fiche pro hébergée sur jasonmarinho.com, des demandes d'hôtes qualifiés ${escHtml(v.pre)} et dans votre zone, contact direct, zéro commission sur vos prestations. Sélection curée : expérience turnover et RC pro exigées.</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <a href="/devenir-prestataire-menage-lcd" class="btn-p"><i class="ph-bold ph-sparkle"></i> Découvrir le programme</a>
        <a href="/annuaires/menage/inscription" class="btn-ol">Postuler directement</a>
      </div>
    </div>
  </div>
</section>

<section class="sec cr">
  <div class="s-in">
    <span class="lbl dk">Pour aller plus loin</span>
    <h2>Ressources LCD <em>${escHtml(v.pre)}</em></h2>
    ${linksRow(v, 'menage')}
  </div>
</section>
`
  return pageShell({ title, desc, canonical: url, jsonLd, body })
}

// ── MAIN ────────────────────────────────────────────────────────────────────
let count = 0
for (const v of VILLES) {
  const dirP = path.join(ROOT, `photographe-lcd-${v.slug}`)
  fs.mkdirSync(dirP, { recursive: true })
  fs.writeFileSync(path.join(dirP, 'index.html'), buildPhotographePage(v), 'utf8')
  count++

  const dirM = path.join(ROOT, `menage-lcd-${v.slug}`)
  fs.mkdirSync(dirM, { recursive: true })
  fs.writeFileSync(path.join(dirM, 'index.html'), buildMenagePage(v), 'utf8')
  count++
}
console.log(`[build-pages-pros-villes] ✓ ${count} pages générées (${VILLES.length} villes × 2 métiers)`)
console.log('[build-pages-pros-villes] Penser à : footer.js (onglets), sitemap.xml (URLs)')
