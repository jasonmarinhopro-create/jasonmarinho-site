// Page « Photographe & vidéaste Airbnb à Québec » (17/10/2026). Première page
// hors de France, demandée plusieurs fois depuis /chiffres ; Jason : « juste
// la page photographe / vidéaste Québec ». Contenu propre au Québec (aucune
// règle française : CITQ, Ville de Québec, Transports Canada), sans prix
// inventé. Mise en page reprise d'une page photographe française (en-tête et
// styles de photographe-lcd-roanne). Hors de CITIES (footer.js) : pas de page
// ménage ni de guide hôte, ville déclarée dans scripts/data/villes-international.mjs.
// Les blocs DEMANDE-HERO, DEMANDE, CHIFFRES et annuaire-live sont ajoutés par
// les injections habituelles. Ne pas relancer sur une page modifiée à la main.
//   node scripts/build-photographe-quebec.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const ROOT = new URL('..', import.meta.url).pathname
const src = readFileSync(`${ROOT}photographe-lcd-roanne/index.html`, 'utf8')
const style = src.slice(src.indexOf('<link rel="shortcut icon"'), src.indexOf('<script type="application/ld+json">'))

const URL_ = 'https://jasonmarinho.com/photographe-lcd-quebec'
const TITLE = 'Photographe &amp; vidéaste Airbnb à Québec'
const DESC = "Trouver un photographe ou un vidéaste pour votre location Airbnb à Québec : enregistrement CITQ, photos d'hiver et d'été, drone et Transports Canada, annuaire sans commission."

const FAQ = [
  ["Faut-il un numéro d'enregistrement pour louer en courte durée à Québec ?",
    "Oui. Au Québec, toute location de 31 jours ou moins contre rémunération demande un enregistrement d'hébergement touristique (Loi sur l'hébergement touristique). Le numéro doit figurer sur chaque annonce et sur chaque plateforme, et le certificat doit être affiché à l'entrée. À Québec, la Ville demande en plus un certificat d'autorisation, renouvelé chaque année, pour louer sa résidence principale, et l'hébergement commercial n'est permis que dans certaines zones : vérifiez votre adresse auprès de la Ville avant de faire faire vos photos."],
  ['Quand faire les photos de son logement à Québec ?',
    "Idéalement deux fois : une séance en été ou à l'automne, une en hiver. Les voyageurs du Carnaval ou du temps des fêtes veulent voir le logement sous la neige, le stationnement déneigé et l'entrée praticable ; ceux de l'été cherchent la terrasse et le quartier. En décembre, les journées sont courtes : calez la séance en milieu de journée pour profiter de la lumière naturelle."],
  ['Combien coûte un photographe Airbnb à Québec ?',
    "Chaque photographe fixe ses tarifs et les affiche sur sa fiche, sans commission de notre part. Avant de choisir, comparez ce qui est inclus : nombre de photos livrées, retouches, photos d'extérieur en hiver et en été, et droit d'utiliser les photos sur toutes vos plateformes, votre site de réservation directe et vos réseaux."],
  ['Une vidéo ou des vues au drone, ça vaut le coup à Québec ?',
    "Les photos restent la base de l'annonce. Une vidéo sert surtout à votre site de réservation directe et à vos réseaux. Pour le drone, les règles sont celles de Transports Canada : un drone de 250 g à 25 kg doit être immatriculé et son pilote doit détenir un certificat de pilote de drone, avec des limites près des aéroports et des événements. Demandez au pro s'il est en règle et si le vol est permis à votre adresse. Dans l'annuaire, filtrez par photographe, vidéaste ou drone."],
  ["Faut-il un photographe spécialisé en location courte durée plutôt qu'un photographe immobilier ?",
    "La nuance compte : le photographe immobilier vend des mètres carrés, le photographe de location courte durée vend une expérience de séjour. Angles pensés pour les vignettes Airbnb et Booking, lumière chaleureuse, mise en scène voyageur (table dressée, plaid, guide ouvert). Demandez à voir des annonces déjà photographiées par le pro."],
  ['Combien de photos faut-il pour une annonce ?',
    "Visez 25 à 35 photos : la photo de couverture (la plus travaillée, elle fait le taux de clic), chaque pièce sous 2 ou 3 angles, les détails qui différencient (vue sur le fleuve, foyer, spa) et 2 ou 3 photos du quartier."],
]
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${TITLE} : guide 2026</title>
<meta name="description" content="${DESC}">
<link rel="canonical" href="${URL_}">
<meta property="og:title" content="${TITLE} : guide 2026">
<meta property="og:description" content="${DESC}">
<meta property="og:url" content="${URL_}">
<meta property="og:type" content="website">
<meta property="og:image" content="https://jasonmarinho.com/couverture-jason.webp">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://jasonmarinho.com/couverture-jason.webp">
<meta property="og:site_name" content="Jason Marinho">
<meta name="robots" content="index, follow">
${style}<script type="application/ld+json">
${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Service', name: 'Photographe et vidéaste location courte durée à Québec', url: URL_, description: DESC, inLanguage: 'fr', provider: { '@type': 'Person', name: 'Jason Marinho', url: 'https://jasonmarinho.com' }, areaServed: { '@type': 'City', name: 'Québec', containedInPlace: { '@type': 'Country', name: 'Canada' } } })}
</script>
<script type="application/ld+json">
${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) })}
</script>
<script type="application/ld+json">
${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
  { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://jasonmarinho.com/' },
  { '@type': 'ListItem', position: 2, name: 'Annuaire des photographes et vidéastes LCD', item: 'https://jasonmarinho.com/annuaires/photographes' },
  { '@type': 'ListItem', position: 3, name: 'Photographe & vidéaste LCD à Québec', item: URL_ }] })}
</script>
<script defer src="/nav.js"></script>
</head>
<body>

<header class="hero">
  <div class="s-in">
    <div class="brd"><a href="/">Accueil</a> · <a href="/annuaires/photographes">Photographes et vidéastes LCD</a> · <span>Québec</span></div>
    <span class="lbl">Photographe &amp; vidéaste · Airbnb, Booking &amp; réservation directe · Canada</span>
    <h1>Photographe &amp; vidéaste Airbnb <em>à Québec</em></h1>
    <p class="lead">Vieux-Québec, bord du fleuve, chalets autour de la ville : à Québec, l'annonce se joue sur deux saisons. Ce qu'il faut savoir avant la séance (enregistrement, hiver, drone) et l'annuaire pour trouver un photographe ou un vidéaste, en contact direct et sans commission.</p>
    <div class="hero-ctas"></div>
    <div class="stats">
      <div><div class="stat-n">31 jours</div><div class="stat-l">ou moins : enregistrement obligatoire au Québec</div></div>
      <div><div class="stat-n">2 saisons</div><div class="stat-l">à montrer : l'été et l'hiver sous la neige</div></div>
      <div><div class="stat-n">0 %</div><div class="stat-l">de commission sur les prestations</div></div>
    </div>
  </div>
</header>

<section class="sec">
  <div class="s-in">
    <span class="lbl dk">Le marché local</span>
    <h2>Pourquoi les photos comptent <em>autant à Québec</em></h2>
    <p>L'arrondissement historique du Vieux-Québec est inscrit au patrimoine mondial de l'UNESCO depuis 1985 : c'est lui qui attire, et c'est lui que les voyageurs veulent reconnaître sur la photo de couverture (rue pavée, fenêtre sur les toits, vue sur le fleuve). Autour, Limoilou, Saint-Roch ou Sainte-Foy accueillent une clientèle plus longue (travail, études, hôpitaux) qui regarde d'abord la cuisine, le bureau et le stationnement.</p>
    <p>La particularité : une même annonce doit séduire en juillet et en février. Des photos uniquement estivales déçoivent les voyageurs d'hiver, et l'inverse. Un bon photographe local sait montrer l'entrée déneigée, le foyer allumé et la lumière chaude d'un salon en plein après-midi de décembre.</p>
    <div class="note"><strong>Le réflexe anti-dépendance :</strong> les mêmes photos servent à votre fiche Google, à vos réseaux et à votre site de réservation directe, là où vous ne payez aucune commission. Vérifiez qu'elles vous sont cédées pour tous ces usages.</div>
  </div>
</section>

<section class="sec" style="border-top:1px solid var(--bd)">
  <style>
    .loc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-top:22px;max-width:1000px}
    .loc-card{background:#fff;border:1px solid var(--bd);border-radius:14px;padding:18px 20px}
    .loc-card h3{font-size:15px;font-weight:600;color:var(--td);margin:0 0 10px;display:flex;align-items:center;gap:8px}
    .loc-card h3 i{color:var(--g)}
    .loc-card ul{margin:0;padding-left:18px}
    .loc-card li,.loc-card p{font-size:14px;line-height:1.65;color:var(--tm);margin:0 0 8px}
    .loc-src{font-size:12.5px!important;color:var(--tl)!important;margin-top:16px!important;line-height:1.7!important}
    .loc-src a{color:var(--tl);text-decoration:underline}
  </style>
  <div class="s-in">
    <span class="lbl dk">À savoir à Québec</span>
    <h2>Les règles et le calendrier <em>à Québec</em></h2>
    <p>Les règles du Québec, pas celles de la France. Vérifié en octobre 2026.</p>
    <div class="loc-grid">
      <div class="loc-card"><h3><i class="ph-bold ph-scales"></i> Enregistrement</h3><ul><li><strong>31 jours ou moins contre rémunération :</strong> enregistrement d'hébergement touristique obligatoire (Loi sur l'hébergement touristique).</li><li><strong>Numéro sur chaque annonce</strong> et sur chaque plateforme, certificat affiché à l'entrée du logement.</li><li><strong>Ville de Québec :</strong> certificat d'autorisation de la Ville, renouvelé chaque année, pour louer sa résidence principale ; hébergement commercial seulement dans les zones où le zonage le permet.</li></ul></div>
      <div class="loc-card"><h3><i class="ph-bold ph-drone"></i> Drone</h3><p>Règles de <strong>Transports Canada</strong> : de 250 g à 25 kg, drone immatriculé et pilote titulaire d'un certificat de pilote de drone ; vol limité près des aéroports, des héliports et des événements. Demandez au pro s'il est en règle pour votre adresse.</p></div>
      <div class="loc-card"><h3><i class="ph-bold ph-calendar-check"></i> Pics de demande</h3><ul><li>Février : Carnaval de Québec (du 5 au 14 février 2027)</li><li>Juillet : Festival d'été de Québec</li><li>Août : Fêtes de la Nouvelle-France</li><li>Automne : les couleurs, puis le temps des fêtes en décembre</li></ul></div>
    </div>
    <h3 style="font-size:17px;font-weight:600;color:var(--td);margin:30px 0 4px">Réussir ses photos à Québec</h3>
    <ul class="check-list"><li><i class="ph-bold ph-check-circle"></i><span><strong>Deux jeux de photos :</strong> été (terrasse, quartier, fleuve) et hiver (neige, foyer, entrée déneigée), à alterner selon la saison.</span></li><li><i class="ph-bold ph-check-circle"></i><span><strong>Le stationnement en hiver :</strong> une photo de la place de stationnement et de l'accès, c'est la question que posent les voyageurs.</span></li><li><i class="ph-bold ph-check-circle"></i><span><strong>Le numéro d'enregistrement</strong> se met dans l'annonce, pas sur les photos : prévoyez une photo du certificat affiché à l'entrée si la plateforme le demande.</span></li></ul>
    <p class="loc-src">Sources : <a href="https://www.quebec.ca/tourisme-loisirs-sport/hebergement-touristique/affichage" target="_blank" rel="nofollow noopener">Québec.ca : afficher le numéro et le certificat d'enregistrement</a> · <a href="https://citq.qc.ca/fr/foireauxquestions.php" target="_blank" rel="nofollow noopener">CITQ : foire aux questions</a> · <a href="https://www.legisquebec.gouv.qc.ca/fr/document/rc/H-1.01,%20r.%201%20/" target="_blank" rel="nofollow noopener">Règlement sur l'hébergement touristique (H-1.01, r. 1)</a> · <a href="https://www.ville.quebec.qc.ca/gens_affaires/reglements_permis/hebergement/index.aspx" target="_blank" rel="nofollow noopener">Ville de Québec : hébergement touristique</a> · <a href="https://reglements.ville.quebec.qc.ca/fr/pdf/ra/R.V.Q.2730.pdf" target="_blank" rel="nofollow noopener">Règlement R.V.Q. 2730</a> · <a href="https://tc.canada.ca/fr/aviation/securite-drones" target="_blank" rel="nofollow noopener">Transports Canada : sécurité des drones</a> · <a href="https://carnaval.qc.ca/" target="_blank" rel="nofollow noopener">Carnaval de Québec</a> · <a href="https://whc.unesco.org/fr/list/300/" target="_blank" rel="nofollow noopener">UNESCO : arrondissement historique du Vieux-Québec</a>. Les règles évoluent : vérifiez auprès de la CITQ et de la Ville avant de vous lancer.</p>
  </div>
</section>

<section class="sec cr">
  <div class="s-in">
    <span class="lbl dk">Budget</span>
    <h2>Ce qui fait le prix <em>d'une séance</em></h2>
    <ul class="check-list">
      <li><i class="ph-bold ph-check-circle"></i><span><strong>Le nombre de photos livrées</strong> et la taille du logement (studio, condo, chalet)</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>Les retouches</strong> : redressement, lumière, ciel, fenêtres équilibrées</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>Les extras</strong> : drone, photos au crépuscule, vidéo courte pour les réseaux, deuxième séance l'hiver</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>Les droits d'utilisation</strong> : toutes les plateformes, votre site et vos réseaux, sans limite de durée</span></li>
    </ul>
    <p style="margin-top:16px;font-size:13px;color:var(--tl)">Chaque photographe fixe librement ses tarifs et les affiche sur sa fiche. Nous ne publions pas de fourchette pour Québec tant que nous n'avons pas de relevé fiable.</p>
  </div>
</section>

<section class="sec">
  <div class="s-in">
    <span class="lbl dk">Checklist</span>
    <h2>Les photos <em>indispensables</em></h2>
    <ul class="check-list">
      <li><i class="ph-bold ph-check-circle"></i><span><strong>La couverture</strong> : la pièce ou la vue la plus forte, lumière naturelle, angle large mais honnête</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>Chaque chambre</strong> : lit fait comme à l'hôtel, 2 angles minimum</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>La salle de bain</strong> : serviettes pliées, aucun objet personnel</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>La cuisine équipée</strong> : plan de travail dégagé, équipements visibles</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>Le salon mis en scène</strong> : foyer, plaid, lumières chaudes</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>Extérieurs</strong> : terrasse l'été, entrée et stationnement l'hiver</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>Les détails qui différencient</strong> : vue sur le fleuve, spa, mur de pierre, laveuse et sécheuse</span></li>
      <li><i class="ph-bold ph-check-circle"></i><span><strong>Le quartier</strong> : 2 ou 3 photos qui vendent l'emplacement</span></li>
    </ul>
  </div>
</section>

<section class="sec cr">
  <div class="s-in">
    <span class="lbl dk">FAQ</span>
    <h2>Questions fréquentes <em>des hôtes à Québec</em></h2>
    <div class="faq">
${FAQ.map(([q, a]) => `<details>
  <summary>${esc(q)}</summary>
  <div class="faq-a">${esc(a)}</div>
</details>`).join('\n')}
</div>
  </div>
</section>

<section class="sec">
  <div class="s-in">
    <div class="pro-band">
      <div class="pro-band-txt">
        <span class="lbl">Vous êtes photographe ou vidéaste à Québec ?</span>
        <h2>Rejoignez l'annuaire <em>des photographes et vidéastes LCD</em></h2>
        <p>Une fiche pro hébergée sur jasonmarinho.com, présentée sur cette page, contact direct et aucune commission sur vos prestations. Votre fiche se voit sur Google comme un site vitrine, avec un lien vers votre site ou portfolio et vos statistiques chaque mois. L'abonnement annuel se règle en euros par carte bancaire.</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <a href="/devenir-photographe-lcd" class="btn-p"><i class="ph-bold ph-camera"></i> Découvrir le programme</a>
        <a href="/annuaires/photographes/inscription" class="btn-ol">Créer ma fiche</a>
      </div>
    </div>
  </div>
</section>

<section class="sec cr">
  <div class="s-in">
    <span class="lbl dk">Pour aller plus loin</span>
    <h2>Ressources <em>pour votre annonce</em></h2>
    <div class="links-row"><a class="link-card" href="/annuaires/photographes"><span class="lc-t">Annuaire</span><span class="lc-h">Tous les photographes et vidéastes</span><span class="lc-a">Voir l'annuaire <i class="ph-bold ph-arrow-right"></i></span></a><a class="link-card" href="/blog/photographe-airbnb-tarifs-comment-choisir"><span class="lc-t">Article</span><span class="lc-h">Bien choisir son photographe Airbnb</span><span class="lc-a">Lire l'article <i class="ph-bold ph-arrow-right"></i></span></a><a class="link-card" href="/blog/photo-couverture-airbnb-7-criteres-algo-computer-vision"><span class="lc-t">Article</span><span class="lc-h">La photo de couverture qui fait cliquer</span><span class="lc-a">Lire l'article <i class="ph-bold ph-arrow-right"></i></span></a></div>
  </div>
</section>

<script defer src="/footer.js"></script>
<script src="/cookie-banner.js" defer></script>
</body>
</html>
`
mkdirSync(`${ROOT}photographe-lcd-quebec`, { recursive: true })
writeFileSync(`${ROOT}photographe-lcd-quebec/index.html`, html)
console.log('photographe-lcd-quebec écrite')
