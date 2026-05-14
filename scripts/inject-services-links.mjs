#!/usr/bin/env node
// Audit + injection automatique de liens internes vers /services/*
// dans les articles de blog qui n'en ont pas (exigence CLAUDE.md :
// ≥ 1 lien contextuel par article).
//
// Stratégie : matching par mots-clés du slug → 1-2 services pertinents.
// Insertion d'un bloc "Aller plus loin" juste avant <section class="related-sec">.

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const BLOG = path.join(ROOT, 'blog')

// ─── Mapping slug → services pertinents ────────────────────────────────
const SERVICES = {
  gmb:         { url: '/services/gmb',                       title: 'Service Google My Business pour hôtes',     desc: 'Optimisation complète de ta fiche Google Business Profile pour attirer des voyageurs en direct.' },
  direct:      { url: '/services/annonce-directe',           title: 'Service Annonce directe',                    desc: 'Construire ton canal de réservation directe de A à Z, sans commission.' },
  acquisition: { url: '/services/acquisition-voyageurs',     title: 'Service Acquisition de voyageurs',           desc: 'Stratégies pour attirer plus de voyageurs sans dépendre des plateformes.' },
  securite:    { url: '/services/securite',                  title: 'Service Sécurité et protection',             desc: 'Vérifier tes voyageurs, signaler les profils à risque, sécuriser tes séjours.' },
  audit:       { url: '/services/audit-gbp',                 title: 'Audit Google Business Profile',              desc: 'Outil d\'audit GBP intégré : analyse ta fiche en 30 secondes et obtiens les actions à prendre.' },
  chez_nous:   { url: '/services/chez-nous',                 title: 'Forum Chez Nous',                            desc: 'Le forum privé des hôtes LCD pour s\'entraider entre pros.' },
  formations:  { url: '/services/formations',                title: 'Catalogue des formations LCD',               desc: 'Toutes les formations pensées pour les hôtes et conciergeries.' },
  partenaires: { url: '/services/partenaires',               title: 'Partenaires validés',                        desc: 'Les outils LCD que Jason utilise et recommande, avec offres négociées.' },
  form_gmb:    { url: '/services/formations/google-my-business-lcd', title: 'Formation Google My Business LCD',   desc: 'Maîtriser sa fiche Google Business Profile en 2h30 (7 modules).' },
  form_tarif:  { url: '/services/formations/tarification-dynamique', title: 'Formation Tarification dynamique',  desc: 'Comprendre et appliquer la tarification dynamique pour maximiser tes revenus.' },
  form_anno:   { url: '/services/formations/optimiser-annonce-airbnb', title: 'Formation Optimiser son annonce', desc: 'Remonter dans les résultats et convertir chaque visite en réservation.' },
  form_secu:   { url: '/services/formations/securiser-reservations-eviter-mauvais-voyageurs', title: 'Formation Sécuriser ses réservations', desc: 'Identifier, filtrer et gérer les voyageurs problématiques.' },
  form_msg:    { url: '/services/formations/messages-automatiques', title: 'Formation Messages automatiques',     desc: 'Automatiser tes 5 messages Airbnb essentiels (templates inclus).' },
  form_livret: { url: '/services/formations/livret-accueil-digital', title: 'Formation Livret d\'accueil digital', desc: 'Créer un livret qui réduit les questions et améliore les avis.' },
  form_conc:   { url: '/services/formations/creer-conciergerie-lcd', title: 'Formation Créer sa conciergerie',   desc: 'Lancer, structurer et développer une conciergerie LCD rentable.' },
  form_fisc:   { url: '/services/formations/fiscalite-reglementation-lcd-france-2026', title: 'Formation Fiscalité et réglementation 2026', desc: 'Tout savoir pour exercer sereinement en France en 2026.' },
  form_avis:   { url: '/services/formations/ecrire-avis-repondre-voyageurs', title: 'Formation Avis et réponses voyageurs', desc: 'Collecter, rédiger et répondre aux avis pour booster ton classement.' },
  form_basse:  { url: '/services/formations/lcd-basse-saison',     title: 'Formation Basse saison LCD',           desc: 'Stratégies concrètes pour remplir ton calendrier hors saison.' },
  form_auto:   { url: '/services/formations/gerer-lcd-automatisation', title: 'Formation Gérer sa LCD comme un pro', desc: 'Automatisation, channel manager, checklists pour reprendre du temps.' },
  form_reseau: { url: '/services/formations/reseaux-sociaux-lcd', title: 'Formation Réseaux sociaux LCD',          desc: 'Instagram, Facebook, TikTok pour attirer des voyageurs.' },
  form_deco:   { url: '/services/formations/decorer-amenager-logement-lcd', title: 'Formation Décorer et aménager', desc: 'Créer un espace qui séduit sur les photos et améliore les notes.' },
  form_prix:   { url: '/services/formations/mettre-le-bon-prix-lcd', title: 'Formation Mettre le bon prix',       desc: 'Fixer un prix qui remplit ton calendrier et maximise tes revenus.' },
  form_direct: { url: '/services/formations/annonce-directe',      title: 'Formation Annonce directe',           desc: 'Génère des réservations directes sans commission, de A à Z.' },
}

// Règles de matching (premier match = ajout du service)
const RULES = [
  // Tarification / prix
  { match: /tarification|prix-minimum|prix-reservation|fixer-prix|prix-min-max|saisonnalite-tarif|tarif-hebdomadaire|early-booking|last-minute/, picks: ['form_tarif', 'form_prix'] },
  // GMB / Google
  { match: /google-my-business|gmb-|seo-local|google-business/, picks: ['form_gmb', 'gmb'] },
  // Direct / réservation directe
  { match: /reservation-directe|location-directe|sans-commission|sans-airbnb|fideliser|programme-parrainage|email-marketing|newsletter|blog-hote|stripe-paiement|driing|description-logement|politique-annulation/, picks: ['form_direct', 'direct'] },
  // Conciergerie
  { match: /conciergerie|scaler|prospection|equipe-menage|sortir-mauvais-client|contrat-mandat/, picks: ['form_conc'] },
  // Fiscalité / réglementation
  { match: /micro-bic|lmnp|lmp|regime-reel|tva-|dpe-|numero-enregistrement|reglementation|declarer-activite|impots|taxe-sejour|fiche-police|bail-mobilite|chambres-hotes-vs|maprimerenov|erp-classement|rgpd/, picks: ['form_fisc'] },
  // Sécurité / litiges / voyageurs difficiles
  { match: /securit|verification-voyageurs|voyageurs-difficiles|refacturer-degat|bruit-reglement|droits-voisins|galeres-location/, picks: ['form_secu', 'securite'] },
  // Avis voyageurs
  { match: /avis-5-etoiles|mauvais-avis|recuperer-mauvais-avis|gerer-mauvais-avis/, picks: ['form_avis'] },
  // Assurance
  { match: /assurance-/, picks: ['form_secu', 'partenaires'] },
  // Annonce / optimisation / photos / titres / description
  { match: /optimiser-annonce|titre-annonce|description-airbnb|photos-airbnb|photo-couverture|profil-hote|mots-cles-titre|airdna|algorithme-airbnb|superhost|statistiques-annonce/, picks: ['form_anno'] },
  // Photos / aménagement
  { match: /photographier|photos-avant-apres|amenager-logement|decorer/, picks: ['form_deco'] },
  // Réseaux sociaux
  { match: /instagram|tiktok|reels|reseaux-sociaux/, picks: ['form_reseau'] },
  // Messages / automatisation / outils
  { match: /messages-airbnb|gabarits-messages|messagerie-unifiee|communiquer-voyageurs|scripts-check-out|automatiser-caution|capteurs-iot|outils-gerer|outils-gratuits|make-zapier|hospitable-|pms-logiciel/, picks: ['form_msg', 'form_auto'] },
  // Calendrier / iCal
  { match: /integration-calendrier/, picks: ['form_auto'] },
  // Livret d'accueil / welcome / signalétique
  { match: /livret-accueil|welcome-bag|signaletique|banque-objets|inventaire-logement|checklist-preparation|checklist-menage|wifi-location|trousse-premier-secours|partenariats-locaux/, picks: ['form_livret'] },
  // Check-in / serrure
  { match: /check-in|serrure-connectee/, picks: ['form_livret', 'form_auto'] },
  // Basse saison / diversifier
  { match: /basse-saison|sejours-longs|workation|diversifier-revenus/, picks: ['form_basse'] },
  // Conciergerie spécifique
  { match: /logiciels-conciergerie/, picks: ['form_conc', 'form_auto'] },
  // Accueil voyageurs ciblés
  { match: /accueillir-famille|accueillir-voyageur-business|accepter-animaux|attirer-teletravailleur/, picks: ['form_livret'] },
  // Comparatifs plateformes
  { match: /airbnb-vs-booking|booking-com-hotes|optimiser-annonce-booking|chatgpt-booking|cybevasion-rachetee|partenaires-lcd|recherches-voyageurs-airbnb/, picks: ['form_anno', 'partenaires'] },
  // Budget / rentabilité / KPIs
  { match: /budget-annuel|marge-nette|point-mort|frais-menage|mesurer-performance/, picks: ['form_tarif'] },
  // Erreurs / débutant
  { match: /erreurs-debutant|top-7-erreurs/, picks: ['formations'] },
  // Communauté
  { match: /communaute-lcd/, picks: ['chez_nous'] },
  // Plateforme / appel
  { match: /pourquoi-creer-compte|appel-decouverte/, picks: ['formations'] },
  // Formation directe (catalogues plateformes)
  { match: /formations-lcd-disponibles|chambres-hotes-plateforme|conciergeries-lcd-ressources/, picks: ['formations'] },
]

function pickServices(slug) {
  for (const rule of RULES) {
    if (rule.match.test(slug)) return rule.picks
  }
  // Fallback : catalogue formations
  return ['formations']
}

function buildBlock(picks) {
  const cards = picks.map(k => {
    const s = SERVICES[k]
    return `      <a href="${s.url}" class="al-card">
        <div class="al-kind">Service</div>
        <div class="al-title">${s.title}</div>
        <div class="al-desc">${s.desc}</div>
        <div class="al-cta">Découvrir <i class="ph-bold ph-arrow-right"></i></div>
      </a>`
  }).join('\n')

  return `
<section class="aller-plus-loin">
  <style>
    .aller-plus-loin{padding:48px 22px;background:linear-gradient(180deg,#fafaf7 0%,#fff 100%);border-top:1px solid rgba(0,76,63,.08);border-bottom:1px solid rgba(0,76,63,.08)}
    .apl-in{max-width:1100px;margin:0 auto}
    .apl-head{text-align:center;margin-bottom:28px}
    .apl-lbl{display:inline-block;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--ol,#556B2F);margin-bottom:10px}
    .apl-h{font-family:'Fraunces',serif;font-size:clamp(20px,2.4vw,28px);font-weight:400;color:var(--td,#1a1a1a);margin:0;letter-spacing:-.3px}
    .apl-grid{display:grid;grid-template-columns:repeat(${picks.length},1fr);gap:16px}
    @media(max-width:760px){.apl-grid{grid-template-columns:1fr}}
    .al-card{display:flex;flex-direction:column;gap:8px;background:#fff;border:1px solid rgba(0,76,63,.12);border-radius:14px;padding:22px;text-decoration:none;color:inherit;transition:transform .2s,box-shadow .2s,border-color .2s}
    .al-card:hover{transform:translateY(-3px);box-shadow:0 10px 26px rgba(0,76,63,.08);border-color:rgba(0,76,63,.22)}
    .al-kind{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--ol,#556B2F)}
    .al-title{font-family:'Fraunces',serif;font-size:17px;color:var(--td,#1a1a1a);line-height:1.3;letter-spacing:-.2px}
    .al-desc{font-size:13px;color:var(--tm,#555);line-height:1.55;flex:1}
    .al-cta{font-size:13px;font-weight:600;color:var(--g,#00604F);display:flex;align-items:center;gap:6px;margin-top:6px}
    .al-cta i{font-size:12px}
  </style>
  <div class="apl-in">
    <div class="apl-head">
      <div class="apl-lbl">Aller plus loin</div>
      <h2 class="apl-h">Les ressources pour passer à l'action</h2>
    </div>
    <div class="apl-grid">
${cards}
    </div>
  </div>
</section>
`
}

// ─── Exécution ─────────────────────────────────────────────────────────
const articles = fs.readdirSync(BLOG, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)

let updated = 0
let skipped = 0
let alreadyHas = 0

for (const slug of articles) {
  const file = path.join(BLOG, slug, 'index.html')
  if (!fs.existsSync(file)) continue
  let html = fs.readFileSync(file, 'utf8')

  // Skip si lien /services/ déjà présent
  if (/href="\/services\/|href="https:\/\/jasonmarinho\.com\/services\//.test(html)) {
    alreadyHas++
    continue
  }

  // Skip si pas de related-sec (article hors gabarit)
  if (!html.includes('<section class="related-sec">')) {
    skipped++
    continue
  }

  // Skip si bloc déjà injecté (idempotent)
  if (html.includes('aller-plus-loin')) {
    skipped++
    continue
  }

  const picks = pickServices(slug)
  const block = buildBlock(picks)

  html = html.replace(
    '<section class="related-sec">',
    block + '\n<section class="related-sec">'
  )

  fs.writeFileSync(file, html)
  updated++
}

console.log(`✓ Updated   : ${updated}`)
console.log(`= AlreadyOK : ${alreadyHas}`)
console.log(`- Skipped   : ${skipped}`)
console.log(`= Total     : ${articles.length}`)
