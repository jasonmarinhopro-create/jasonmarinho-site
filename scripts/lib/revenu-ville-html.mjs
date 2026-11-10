// Page « Louer en courte durée à <ville> en 2026 » (étude de revenus), format
// « rapport de ta ville » validé par Jason le 10/11/2026 (proposition C).
// Gabarit seul : données dans scripts/generate-city-revenue-articles.mjs,
// chiffres du marché lus dans calculateurs/engine.js (mêmes nombres que
// l'estimateur /calculateurs/revenus-lcd).
//
// Repères laissés aux scripts d'injection (à relancer après génération) :
//   <header class="hero">              photo de la ville (inject-photos-villes)
//   <nav class="breadcrumb lt">         fil d'Ariane (inject-fil-ariane)
//   <h2 ...>Questions fréquentes        chiffres Insee juste avant (inject-chiffres-villes)
//   <section style="background:var(--g);color:#fff   pros de la ville juste avant (inject-pros-links)

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const eur = n => `${Math.round(n).toLocaleString('fr-FR').replace(/[  ]/g, ' ')} €`
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

/** Mêmes tailles que l'estimateur (type et chambres du moteur) */
export const TYPES = [
  { key: 'studio', label: 'Studio', engine: ['studio', 0] },
  { key: 't2', label: 'T2', engine: ['t2', 1] },
  { key: 't3', label: 'T3', engine: ['t3', 2] },
  { key: 't4', label: 'T4 ou plus', engine: ['t3', 3] },
  { key: 'maison', label: 'Maison', engine: ['maison', 3] },
]

/** Fil des saisons en texte : « avril à juin, septembre à novembre » */
function saisonText(months) {
  const sorted = [...new Set(months)].sort((a, b) => a - b)
  if (!sorted.length) return ''
  // Plages consécutives, décembre-janvier relié
  const runs = []
  for (const m of sorted) {
    const last = runs[runs.length - 1]
    if (last && m === last[1] + 1) last[1] = m
    else runs.push([m, m])
  }
  if (runs.length > 1 && runs[0][0] === 1 && runs[runs.length - 1][1] === 12) {
    const first = runs.shift()
    runs[runs.length - 1][1] = first[1] + 12
  }
  const name = m => MONTHS[(m - 1) % 12].toLowerCase()
  return runs.map(([a, b]) => (a === b ? name(a) : `${name(a)} à ${name(b)}`)).join(', ')
}

export function buildRevenuVille(city, ctx) {
  const { J, photo, neighbours } = ctx
  const canonicalUrl = `https://jasonmarinho.com/calculateurs/${city.slug}`
  const bench = J.findCity(city.ville, city.pays)
  const rows = TYPES.map(t => {
    const r = J.estimateRevenue({ pays: city.pays, ville: city.ville, typeLogement: t.engine[0], nbChambres: t.engine[1], mode: 'toute-annee' })
    return { ...t, revenu: r.revenuAnnuel, low: r.revenuLow, high: r.revenuHigh, adr: r.adr }
  })
  const t2 = rows.find(r => r.key === 't2')
  const base = J.estimateRevenue({ pays: city.pays, ville: city.ville, typeLogement: 't2', nbChambres: 1, mode: 'toute-annee' })
  const nights = Math.round(365 * bench.occ / 100)
  const saison = saisonText(bench.saisonHaute)
  const source = bench.source
  const calcUrl = `/calculateurs/revenus-lcd?pays=${city.pays}&ville=${encodeURIComponent(city.ville)}`
  const title = `Louer en courte durée à ${city.ville} : revenus 2026`
  const description = `${city.ville} : ${bench.occ} % d'occupation, ${bench.adr} € la nuit en moyenne (${source}). Revenus par type de logement, saisons, règles locales et tendances 2026.`
  const max = Math.max(...base.monthly.map(m => m.revenu))
  const months = base.monthly.map((m, i) => `<span class="${m.isHigh ? 'h' : ''}" style="height:${Math.max(6, Math.round(m.revenu / max * 100))}%" title="${MONTHS[i]} : ${eur(m.revenu)}"></span>`).join('')

  const faq = [
    {
      q: `Combien rapporte une location courte durée à ${city.ville} ?`,
      a: `Avec les chiffres de marché (${source}) : ${bench.occ} % d'occupation et ${bench.adr} € la nuit en moyenne. Un T2 loué toute l'année rapporte environ ${eur(t2.revenu)} de revenus bruts, entre ${eur(t2.low)} et ${eur(t2.high)} selon l'annonce. L'estimateur gratuit calcule aussi le net après frais et impôts.`,
    },
    {
      q: `Quand est la haute saison à ${city.ville} ?`,
      a: saison ? `Les mois les plus demandés à ${city.ville} vont de ${saison}. ${city.saisonDetails?.[0] ? `${city.saisonDetails[0].period} : ${city.saisonDetails[0].note}` : ''}`.trim() : `La demande est assez régulière sur l'année à ${city.ville}.`,
    },
    {
      q: `Faut-il déclarer sa location courte durée à ${city.ville} ?`,
      a: `Oui. ${city.legalNote.split('. ')[0].replace(/\.$/, '')}. Les règles détaillées sont dans la section « Les règles à ${city.ville} ».`,
    },
    city.pays !== 'FR' ? {
      q: 'Qu\'est-ce qui change en 2026 pour les hôtes ?',
      a: 'Airbnb prélève 15,5 % à l\'hôte depuis le 13 octobre 2026 en Europe : les frais voyageur disparaissent et le prix affiché est le prix payé. Si tu es résident fiscal français, tes revenus de location à l\'étranger se déclarent aussi en France.',
    } : {
      q: 'Qu\'est-ce qui change en 2026 pour les hôtes ?',
      a: 'Airbnb prélève 15,5 % à l\'hôte depuis le 13 octobre 2026 en Europe (les frais voyageur disparaissent). En micro-BIC, un meublé de tourisme non classé a 30 % d\'abattement jusqu\'à 15 000 € de recettes, un meublé classé 50 % jusqu\'à 83 600 € (revenus 2026). Les prélèvements sociaux sur la location meublée passent à 18,6 %.',
    },
  ]

  const nb = neighbours.length ? `
<section class="sec">
  <div class="wrap">
    <div class="tag">Comparer</div>
    <h2>${esc(city.ville)} face aux <em>villes proches</em></h2>
    <div class="tbl-wrap"><table>
      <thead><tr><th>Ville</th><th>Occupation</th><th>Prix par nuit</th><th>Revenu d'un T2</th></tr></thead>
      <tbody>
        <tr class="me"><td>${esc(city.ville)}</td><td>${bench.occ} %</td><td>${bench.adr} €</td><td>${eur(t2.revenu)}</td></tr>
${neighbours.map(n => `        <tr><td><a href="${n.url}">${esc(n.ville)}</a></td><td>${n.occ} %</td><td>${n.adr} €</td><td>${eur(n.t2)}</td></tr>`).join('\n')}
      </tbody>
    </table></div>
    <p class="src">Mêmes calculs pour chaque ville : T2 loué toute l'année, annonce correcte. Sources de chaque ville sur sa page.</p>
  </div>
</section>` : ''

  const faqSchema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) })
  const articleSchema = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Article',
    headline: `Louer en courte durée à ${city.ville} en 2026 : revenus, saisons et règles`,
    description, datePublished: '2026-05-17', dateModified: '2026-11-10',
    author: { '@type': 'Person', name: 'Jason Marinho', url: 'https://jasonmarinho.com' },
    publisher: { '@type': 'Organization', name: 'Jason Marinho', logo: { '@type': 'ImageObject', url: 'https://jasonmarinho.com/logo.webp' } },
    image: photo ? `https://jasonmarinho.com/img/villes/large/${photo}.webp` : 'https://jasonmarinho.com/couverture-jason.webp',
    mainEntityOfPage: canonicalUrl,
  })
  const bcSchema = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://jasonmarinho.com/' },
      { '@type': 'ListItem', position: 2, name: 'Calculateurs', item: 'https://jasonmarinho.com/calculateurs' },
      { '@type': 'ListItem', position: 3, name: `Revenu LCD ${city.ville}`, item: canonicalUrl },
    ],
  })

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:title" content="${esc(`Louer en courte durée à ${city.ville} en 2026`)}">
  <meta property="og:description" content="${esc(`Revenus par type de logement, saisons, règles locales et tendances 2026 à ${city.ville}.`)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${photo ? `https://jasonmarinho.com/img/villes/large/${photo}.webp` : 'https://jasonmarinho.com/couverture-jason.webp'}">
  <meta name="twitter:card" content="summary_large_image">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Jason Marinho">
  <meta name="robots" content="index, follow">
  <link rel="shortcut icon" href="/favicon.ico">
  <link rel="icon" href="/favicon.ico?v=2026-06" sizes="any">
  <link rel="icon" type="image/png" sizes="96x96" href="/icon-96.png?v=2026-06">
  <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png?v=2026-06">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2026-06">
  <link rel="manifest" href="/manifest.json?v=2026-06">
  <meta name="theme-color" content="#004C3F">
  <link rel="stylesheet" href="/fonts/site-fonts.css?v=ce727d0a60">
  <link rel="stylesheet" href="/fonts/phosphor-regular-subset.css?v=868073a0d4">
  <link rel="stylesheet" href="/fonts/phosphor-bold-subset.css?v=29999e9550">
  <style>
    :root{--g:#004C3F;--gd:#003329;--y:#FFD56B;--yd:#FFC845;--cr:#F7F5F0;--w:#FDFCF9;--td:#0F1A0D;--tm:#3D5038;--tl:#5F6F5C;--bd:rgba(0,76,63,.10);--bd2:rgba(0,76,63,.18)}
    *{box-sizing:border-box}
    html{scroll-behavior:smooth}
    body{margin:0;padding-top:76px;font-family:'Outfit',sans-serif;background:var(--w);color:var(--td);line-height:1.65;-webkit-font-smoothing:antialiased}
    em{font-style:italic;color:var(--g)}
    .wrap{max-width:900px;margin:0 auto;padding:0 16px}
    @media(min-width:760px){.wrap{padding:0 24px}}
    .tag{display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:var(--g)}
    .hero{max-width:1100px;margin:8px auto 0;border-radius:28px;background:linear-gradient(160deg,#001a11 0%,var(--gd) 55%,#00463a 100%);color:#fff;padding:clamp(28px,4vw,48px) clamp(20px,4vw,48px) clamp(84px,9vw,110px)}
    @media(max-width:1130px){.hero{margin:8px 12px 0}}
    .breadcrumb{font-size:12.5px;display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}
    .breadcrumb.lt,.breadcrumb.lt a{color:rgba(255,255,255,.72);text-decoration:none}
    .hero .tag{color:var(--y)}
    .hero h1{font-family:'Fraunces',serif;font-weight:300;letter-spacing:-.03em;font-size:clamp(34px,5.2vw,58px);line-height:1.04;margin:12px 0 14px;max-width:820px}
    .hero h1 em{color:var(--y)}
    .hero .lede{font-size:clamp(15px,1.4vw,17px);font-weight:300;color:rgba(255,255,255,.85);max-width:640px;margin:0}
    .est{margin-top:28px}
    .est .k{font-size:12px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.7);font-weight:600}
    .est .big{font-family:'Fraunces',serif;font-weight:300;font-size:clamp(44px,7vw,78px);letter-spacing:-.04em;line-height:1;margin-top:6px;font-variant-numeric:tabular-nums}
    .est .big small{font-family:'Outfit',sans-serif;font-size:16px;letter-spacing:0;color:rgba(255,255,255,.7);margin-left:8px}
    .est .r{font-size:14px;color:rgba(255,255,255,.78);margin-top:8px}
    .facts{position:relative;z-index:2;max-width:1000px;margin:-58px auto 0;display:grid;grid-template-columns:repeat(4,1fr);background:#fff;border-radius:22px;box-shadow:0 22px 60px rgba(0,40,30,.12);border:1px solid var(--bd)}
    @media(max-width:1030px){.facts{margin:-58px 16px 0}}
    .facts>div{padding:20px 22px}
    .facts>div+div{border-left:1px solid var(--bd)}
    .facts .v{font-family:'Fraunces',serif;font-weight:300;font-size:clamp(24px,2.8vw,32px);font-variant-numeric:tabular-nums;line-height:1.1}
    .facts .l{font-size:12.5px;color:var(--tl);margin-top:4px}
    .src{font-size:12.5px;color:var(--tl);line-height:1.6}
    .src a{color:var(--g);text-decoration:none;border-bottom:1px solid rgba(0,76,63,.25)}
    .facts-src{max-width:1000px;margin:12px auto 0;padding:0 24px;text-align:center}
    .sec{padding:clamp(48px,7vw,80px) 0 0}
    .sec h2{font-family:'Fraunces',serif;font-weight:300;letter-spacing:-.025em;font-size:clamp(26px,3.4vw,38px);line-height:1.12;margin:10px 0 14px}
    .sec p{color:var(--tm);font-weight:300;font-size:16px;line-height:1.75;margin:0 0 14px}
    .types{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:6px}
    .types a{display:block;background:#fff;border:1px solid var(--bd);border-radius:18px;padding:16px;text-decoration:none;color:inherit;transition:border-color .2s,transform .2s}
    .types a:hover{border-color:var(--g);transform:translateY(-2px)}
    .types a.hl{border-color:var(--g);box-shadow:0 10px 30px rgba(0,76,63,.08)}
    .types .n{font-size:13px;color:var(--tl);font-weight:500}
    .types .v{font-family:'Fraunces',serif;font-weight:300;font-size:24px;margin-top:4px;font-variant-numeric:tabular-nums}
    .types .s{font-size:12px;color:var(--tl)}
    .months{display:grid;grid-template-columns:repeat(12,1fr);gap:6px;align-items:end;height:90px;margin-top:22px}
    .months span{display:block;border-radius:7px 7px 3px 3px;background:#DCE9E0;min-height:4px}
    .months span.h{background:var(--g)}
    .ml{display:grid;grid-template-columns:repeat(12,1fr);gap:6px;font-size:11px;color:var(--tl);text-align:center;margin-top:6px}
    .seasons{list-style:none;padding:0;margin:20px 0 0;display:grid;gap:10px}
    .seasons li{background:#fff;border:1px solid var(--bd);border-radius:16px;padding:14px 18px;font-size:15px;color:var(--tm);line-height:1.6}
    .seasons li b{color:var(--td);font-weight:600;display:block;margin-bottom:2px}
    .cite{border-left:3px solid var(--y);padding:4px 0 4px 18px;margin:18px 0}
    .cite .t{font-family:'Fraunces',serif;font-weight:300;font-size:clamp(21px,2.4vw,26px);line-height:1.25}
    .changes{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px}
    .card{background:#fff;border:1px solid var(--bd);border-radius:18px;padding:18px 20px}
    .card .t{font-family:'Fraunces',serif;font-weight:300;font-size:20px;line-height:1.25;margin:6px 0 8px}
    .tbl-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
    table{width:100%;border-collapse:collapse;font-size:14.5px;min-width:520px}
    th,td{padding:12px 10px;border-bottom:1px solid var(--bd);text-align:left;font-variant-numeric:tabular-nums}
    th{font-size:11.5px;text-transform:uppercase;letter-spacing:.8px;color:var(--tl);font-weight:600}
    td:last-child,th:last-child{text-align:right}
    tr.me td{background:#F1F7F3;font-weight:600}
    td a{color:var(--g);text-decoration:none;font-weight:500}
    .quartiers{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:10px;margin-top:6px}
    .quartiers .card b{font-weight:600;display:block}
    .quartiers .card span{font-size:13.5px;color:var(--tm);line-height:1.55;display:block;margin-top:4px}
    .actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}
    .btn{display:inline-flex;align-items:center;gap:8px;background:var(--y);color:var(--gd);font-weight:600;font-size:14.5px;padding:13px 20px;border-radius:12px;text-decoration:none;border:0;font-family:inherit;cursor:pointer;transition:transform .2s,box-shadow .2s}
    .btn:hover{transform:translateY(-1px);box-shadow:0 10px 24px rgba(255,200,69,.35)}
    .btn.o{background:#fff;border:1px solid var(--bd2);color:var(--g)}
    .faq details{background:#fff;border:1px solid var(--bd);border-radius:14px;padding:16px 22px;margin-bottom:10px}
    .faq summary{font-family:'Fraunces',serif;font-size:17px;font-weight:400;cursor:pointer;list-style:none;position:relative;padding-right:28px}
    .faq summary::-webkit-details-marker{display:none}
    .faq summary::after{content:'+';position:absolute;right:0;top:50%;transform:translateY(-50%);font-size:22px;color:var(--g);font-weight:300}
    .faq details[open] summary::after{content:'\\2212'}
    .faq p{margin:10px 0 0;font-size:14.5px}
    @media(max-width:860px){.facts{grid-template-columns:repeat(2,1fr)}.facts>div:nth-child(3){border-left:0}.facts>div:nth-child(n+3){border-top:1px solid var(--bd)}.types{grid-template-columns:repeat(2,1fr)}.changes{grid-template-columns:1fr}}
    @media(max-width:640px){.months{gap:4px;height:72px}.ml{gap:4px}}
    @media print{#nav,nav#nav,.actions,footer,#footer-mount{display:none!important}body{padding-top:0}}
  </style>
  <script type="application/ld+json">${articleSchema}</script>
  <script type="application/ld+json" data-schema-bc>${bcSchema}</script>
  <script type="application/ld+json">${faqSchema}</script>
  <script defer src="/nav.js"></script>
</head>
<body>
<header class="hero">
  <nav class="breadcrumb lt" aria-label="Fil d'Ariane"><a href="/">Accueil</a><span>/</span><a href="/calculateurs">Calculateurs</a><span>/</span><span>${esc(city.ville)}</span></nav>
  <div class="tag">Étude de revenus 2026</div>
  <h1>Louer en courte durée à <em>${esc(city.ville)}</em> en 2026</h1>
  <p class="lede">Ce que rapporte un logement, mois par mois et par taille, ce qui a changé cette année et les règles à connaître avant de te lancer.</p>
  <div class="est">
    <div class="k">Un T2 loué toute l'année</div>
    <div class="big">${eur(t2.revenu)}<small>de revenus bruts par an</small></div>
    <div class="r">Entre ${eur(t2.low)} et ${eur(t2.high)} selon ton annonce, tes photos et tes prix</div>
  </div>
</header>
<div class="facts">
  <div><div class="v">${bench.occ} %</div><div class="l">d'occupation sur 12 mois</div></div>
  <div><div class="v">${bench.adr} €</div><div class="l">par nuit en moyenne</div></div>
  <div><div class="v">${nights}</div><div class="l">nuits louées par an</div></div>
  <div><div class="v">${(bench.saisonHaute.length)} mois</div><div class="l">de haute saison</div></div>
</div>
<p class="src facts-src">Chiffres du marché : ${esc(source)}. Moyennes tous canaux (Airbnb, Booking, en direct).</p>

<section class="sec">
  <div class="wrap">
    <div class="tag">Par taille de logement</div>
    <h2>Ce que rapporte <em>ton logement</em></h2>
    <p>Revenus bruts sur 12 mois, loué toute l'année avec une annonce correcte. Touche une taille pour calculer ton net après frais et impôts.</p>
    <div class="types">
${rows.map(r => `      <a href="${calcUrl}&amp;type=${r.key}"${r.key === 't2' ? ' class="hl"' : ''}><div class="n">${r.label}</div><div class="v">${eur(r.revenu)}</div><div class="s">${r.adr} € la nuit</div></a>`).join('\n')}
    </div>
    <div class="months" aria-hidden="true">${months}</div>
    <div class="ml"><span>J</span><span>F</span><span>M</span><span>A</span><span>M</span><span>J</span><span>J</span><span>A</span><span>S</span><span>O</span><span>N</span><span>D</span></div>
    <p class="src" style="margin-top:10px">Revenus d'un T2 par mois. En vert foncé, la haute saison${saison ? ` : ${saison}` : ''}.</p>
    <div class="actions">
      <a class="btn" href="${calcUrl}">Calculer mon revenu net <i class="ph-bold ph-arrow-right"></i></a>
      <a class="btn o" href="/calculateurs/prix-lcd?pays=${city.pays}&amp;ville=${encodeURIComponent(city.ville)}">Quel prix afficher par nuit</a>
    </div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="tag">Fin 2026</div>
    <h2>Ce qui a <em>changé cette année</em></h2>
    <div class="cite"><div class="t">Les prix montent, l'occupation recule</div>
      <p class="src" style="margin:6px 0 0">En Europe en août 2026, le prix moyen par nuit a progressé de 7,5 % et l'occupation a perdu 2,1 points. En France, le revenu par logement disponible a gagné 5,1 %. Source : <a href="https://www.airdna.co/blog/european-review-august-2026" target="_blank" rel="noopener">AirDNA, revue européenne d'août 2026</a>.</p></div>
    <p>Pour toi, ça veut dire moins de nuits mais mieux payées. Les hôtes qui gardent leur occupation sont ceux qui ajustent leurs prix chaque semaine et soignent leurs photos.</p>
    <div class="changes"${city.pays === 'FR' ? '' : ' style="grid-template-columns:1fr"'}>
      <div class="card"><div class="tag">Airbnb</div><div class="t">15,5 % de frais pour l'hôte</div><p class="src" style="margin:0">Depuis le 13/10/2026 en Europe, plus de frais voyageur : le prix affiché est le prix payé. <a href="https://www.moneyvox.fr/immobilier/actualites/110230/airbnb-et-impots-ce-qui-change-des-le-13-octobre-pour-la-location-meublee-de-courte-duree" target="_blank" rel="noopener">MoneyVox</a></p></div>
${city.pays === 'FR' ? `      <div class="card"><div class="tag">Impôts</div><div class="t">30 % ou 50 % d'abattement</div><p class="src" style="margin:0">Non classé : 30 % jusqu'à 15 000 € de recettes. Classé : 50 % jusqu'à 83 600 € (revenus 2026). <a href="/blog/micro-bic-abattement-2026-airbnb">Le guide micro-BIC</a></p></div>
      <div class="card"><div class="tag">Prélèvements sociaux</div><div class="t">18,6 % sur le meublé</div><p class="src" style="margin:0">Contre 17,2 % avant, la location vide reste à 17,2 % (loi de financement de la Sécurité sociale 2026). <a href="/blog/guide-fiscal-debutant-hote-airbnb-2026">Le guide fiscal</a></p></div>
` : ''}    </div>
  </div>
</section>

${city.saisonDetails?.length ? `<section class="sec">
  <div class="wrap">
    <div class="tag">Saisons</div>
    <h2>Les temps forts <em>à ${esc(city.ville)}</em></h2>
    <ul class="seasons">
${city.saisonDetails.map(p => `      <li><b>${esc(p.period)}</b>${esc(p.note)}</li>`).join('\n')}
    </ul>
  </div>
</section>` : ''}

${city.quartiers?.length ? `<section class="sec">
  <div class="wrap">
    <div class="tag">Quartiers</div>
    <h2>Où ça <em>rapporte le plus</em></h2>
    <div class="quartiers">
${city.quartiers.map(q => `      <div class="card"><b>${esc(q.nom)}</b><span>${esc(q.adr)} la nuit, ${esc(q.occ)} d'occupation. ${esc(q.note)}.</span></div>`).join('\n')}
    </div>
  </div>
</section>` : ''}

<section class="sec">
  <div class="wrap">
    <div class="tag">Réglementation</div>
    <h2>Les règles <em>à ${esc(city.ville)}</em></h2>
    <p>${esc(city.legalNote)}</p>
    ${city.pays === 'FR' ? `<p class="src">Depuis le 20 mai 2026, toute location meublée de tourisme doit avoir un numéro d'enregistrement en France. Vérifie les règles auprès de ta mairie avant de publier ton annonce.</p>` : `<p class="src">Les règles changent souvent : vérifie-les auprès de la ville avant de publier ton annonce.</p>`}
  </div>
</section>
${nb}

<section class="sec">
  <div class="wrap faq">
    <h2 class="faq-h">Questions fréquentes</h2>
${faq.map(f => `    <details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n')}
    <div class="actions">
      <button class="btn o" type="button" onclick="window.print()">Enregistrer en PDF</button>
      <button class="btn o" type="button" id="share">Partager cette page</button>
    </div>
  </div>
</section>

<section style="background:var(--g);color:#fff;padding:clamp(48px,7vw,84px) 16px;text-align:center;margin-top:clamp(48px,7vw,80px)">
  <h2 style="font-family:'Fraunces',serif;font-weight:300;font-size:clamp(26px,3.4vw,38px);letter-spacing:-.02em;margin:0 auto 12px;max-width:620px;line-height:1.15">Tu loues déjà à ${esc(city.ville)} ? <em style="color:var(--y)">Compare tes vrais chiffres</em></h2>
  <p style="color:rgba(255,255,255,.8);max-width:540px;margin:0 auto 22px;font-weight:300">Avec un compte gratuit, tu suis tes réservations, ton occupation et tes revenus réels face au marché de ${esc(city.ville)}.</p>
  <a class="btn" href="https://app.jasonmarinho.com/auth/register">Créer mon compte gratuit <i class="ph-bold ph-arrow-right"></i></a>
</section>

<script src="/footer.js"></script>
<script>
(function () {
  var b = document.getElementById('share')
  if (!b) return
  b.addEventListener('click', function () {
    var data = { title: document.title, url: location.href }
    if (navigator.share) { navigator.share(data).catch(function () {}); return }
    try { navigator.clipboard.writeText(location.href); b.textContent = 'Lien copié' } catch (e) {}
  })
})()
</script>
</body>
</html>
`
}
