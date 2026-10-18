#!/usr/bin/env node
// Fiches d'exemple (photographe et équipe de ménage), générées par le MÊME
// gabarit que les vraies fiches (buildFichePage de build-photographers.mjs et
// build-cleaners.mjs), avec des données fictives : elles restent identiques
// aux vraies fiches quand le gabarit change. Ajouts propres à l'exemple :
// bandeau « exemple », étiquettes jaunes sur chaque bloc, formulaire inactif,
// exemple de « Mes statistiques », appel à créer sa fiche, noindex.
// Photos : img/exemple-fiches/ (libres de droits, licence Unsplash, déposées
// par le workflow « Photos des fiches d'exemple »), servies par le site.
// Usage : node scripts/build-exemples-fiches.mjs (aussi lancé au build).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildFichePage as buildPhotographe } from './build-photographers.mjs'
import { buildFichePage as buildMenage } from './build-cleaners.mjs'
import { statsDemoHtml } from './lib/stats-demo.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
// Vidéo libre de droits (Wikimedia Commons, déposée par le workflow « Vidéo de
// la fiche d'exemple ») : lue sur place, avec son crédit (licence CC).
function videoExemple() {
  const dir = path.join(ROOT, 'img', 'exemple-fiches')
  if (!fs.existsSync(path.join(dir, 'video-camille.mp4'))) return {}
  let c = {}
  try { c = JSON.parse(fs.readFileSync(path.join(dir, 'video-camille.json'), 'utf8')) } catch {}
  const e = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
  return {
    video_url: 'https://jasonmarinho.com/img/exemple-fiches/video-camille.mp4',
    __videoPoster: '/img/exemple-fiches/video-camille.jpg',
    __videoCredit: c.lien ? `Vidéo d’illustration : ${e(c.auteur || c.titre)}, <a href="${e(c.lien)}" target="_blank" rel="noopener">${e(c.licence)}, Wikimedia Commons</a>` : '',
  }
}
const photos = names => names.map(n => ({ full: `/img/exemple-fiches/${n}.jpg`, thumb: `/img/exemple-fiches/${n}-t.jpg` }))

const CAMILLE = {
  id: '00000000-0000-0000-0000-000000000000',
  slug: 'exemple-fiche',
  full_name: 'Camille Sénéchal',
  ville: 'Lyon',
  zone_couverte: 'Lyon + 60 km · Rhône, Beaujolais, vallée du Rhône',
  specialite: 'Intérieurs + drone extérieur',
  metier: 'photo_video',
  options: ['drone', 'reels', 'crepuscule'],
  tarif_min: 350,
  tarif_max: 700,
  portfolio_url: 'https://portfolio.example',
  instagram_handle: 'camille.studio.lyon',
  reseaux: { google: 'https://www.google.com/maps', facebook: 'https://www.facebook.com/', linkedin: 'https://www.linkedin.com/' },
  bio: 'Photographe spécialisée location courte durée depuis 4 ans à Lyon, je shoot exclusivement pour des hôtes Airbnb et des conciergeries du Rhône. Mon truc : les intérieurs lumineux qui font envie dès la première photo, avec parfois un complément drone pour valoriser un jardin ou une vue. Je travaille rapide (la séance type dure 2h) et je livre sous 5 jours, retouches comprises. Chaque shoot est livré en 2 formats : pleine résolution pour ton site / dossier presse, et carré 1:1 optimisé pour le thumbnail Airbnb.',
  formules: [
    { nom: 'Essentielle', prix: 350, detail: 'Studio ou T2 : 20 photos retouchées, livrées sous 5 jours.' },
    { nom: 'Complète', prix: 520, detail: 'Jusqu’au T4 : 35 photos, carré 1:1 pour Airbnb, visite en vidéo courte.' },
    { nom: 'Prestige', prix: 700, detail: 'Maison avec extérieur : 45 photos + vues drone du jardin et du quartier.' },
  ],
  villes_couvertes: ['Villeurbanne', 'Annecy', 'Vienne', 'Villefranche-sur-Saône', 'Bourgoin-Jallieu'],
  deroule: [],
  __photos: photos(['photo-interieur-1', 'photo-salon-5', 'photo-chambre-4', 'photo-cuisine-2', 'photo-sdb-2', 'photo-maison-2']),
  ...videoExemple(),
}

const ECLAT = {
  id: '00000000-0000-0000-0000-000000000000',
  slug: 'exemple-fiche',
  full_name: 'Éclat Ménage Bordeaux',
  ville: 'Bordeaux',
  zone_couverte: 'Bordeaux + Médoc + Bassin d’Arcachon',
  tarif_forfait_min: 70,
  tarif_forfait_max: 130,
  tarif_heure: 25,
  prestations: ['menage_standard', 'gestion_linge', 'repassage', 'reapprovisionnement', 'etat_des_lieux_photo', 'petite_maintenance', 'gestion_dechets'],
  equipe_type: 'equipe_3_5',
  logements_geres: 18,
  delai_reservation: '24h',
  langues: ['fr', 'en', 'es'],
  assurance_rc_pro: true,
  siret: '12345678901234',
  site_url: 'https://site.example',
  instagram_handle: 'eclat.menage.bordeaux',
  reseaux: { google: 'https://www.google.com/maps', facebook: 'https://www.facebook.com/' },
  bio: 'Équipe de ménage spécialisée location courte durée depuis 6 ans à Bordeaux. On gère actuellement 18 logements pour des hôtes Airbnb et Booking sur Bordeaux et le Médoc. Notre marque de fabrique : un turnover livré en moins de 4h avec photo finale envoyée par WhatsApp, gestion complète du linge (stock tournant inclus dans le forfait), et un réappro consommables ajusté à chaque saison. Trois ménagères formées en interne, une équipe stable depuis 2 ans, déclarée et assurée. Notre objectif : que tu ne touches plus à rien entre 2 voyageurs.',
  formules: [
    { nom: 'Studio, T1', prix: 70, detail: 'Ménage complet, lit refait, salle de bain et cuisine, sous 3 h.' },
    { nom: 'T2, T3', prix: 95, detail: 'Linge fourni et lavé, réassort des consommables, photo de fin de ménage.' },
    { nom: 'Maison', prix: 130, detail: 'Jusqu’à 4 chambres, terrasse balayée, poubelles sorties.' },
  ],
  villes_couvertes: ['Mérignac', 'Pessac', 'Talence', 'Arcachon', 'Lacanau'],
  deroule: [],
  __photos: photos(['menage-1', 'photo-chambre-3', 'photo-sdb-1', 'photo-salon-4', 'photo-salon-3', 'photo-salon-2']),
}

const annot = label => `<span class="annot-tag"><i class="ph-bold ph-info" style="font-size:11px"></i>${label}</span>`

const DEMO_CSS = `
.card{position:relative}
.annot-tag{position:absolute;top:-9px;right:14px;background:#FFD56B;color:#003329;font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;padding:3px 9px;border-radius:6px;box-shadow:0 4px 10px rgba(255,213,107,.4);display:inline-flex;align-items:center;gap:4px;z-index:2}
.demo-banner{background:linear-gradient(135deg,#FFD56B 0%,#FFB84D 100%);color:#0F1A0D;padding:14px clamp(20px,5vw,48px);text-align:center;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}
.demo-banner a{color:#003329;text-decoration:underline;font-weight:700}
.cta-bottom{background:linear-gradient(135deg,#001a11,var(--gd));border-radius:20px;padding:48px clamp(20px,4vw,40px);text-align:center;color:#fff;max-width:920px;margin:30px auto 70px}
.cta-bottom .lbl{display:inline-block;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,213,107,.7);margin-bottom:14px}
.cta-bottom h2{font-family:'Fraunces',serif;font-size:clamp(1.5rem,2.8vw,2rem);margin:0 0 12px;font-weight:400;line-height:1.2;color:#fff}
.cta-bottom h2 em{color:var(--y);font-style:italic;font-weight:300}
.cta-bottom p{font-size:15px;color:rgba(255,255,255,.7);margin:0 auto 24px;line-height:1.65;max-width:560px}
.cta-bottom .btn-main{display:inline-flex;align-items:center;gap:8px;background:var(--y);color:var(--gd);font-weight:600;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none}
.cta-bottom .btn-main:hover{background:#ffe08f}
.disclaimer{color:var(--tm)}
`

function replaceOnce(html, a, b) {
  const i = html.indexOf(a)
  if (i < 0) throw new Error(`Fiche d'exemple : repère introuvable « ${a.slice(0, 60)} »`)
  return html.slice(0, i) + b + html.slice(i + a.length)
}

function toDemo(html, m) {
  let h = html
  // En-tête : titre, description, noindex, pas de données structurées (personne fictive)
  h = h.replace(/<title>[^<]*<\/title>/, `<title>${m.title}</title>`)
  h = h.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${m.desc}">`)
  h = h.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${m.title}">`)
  h = h.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${m.desc}">`)
  h = h.replace(/<meta property="og:type" content="[^"]*">/, '<meta property="og:type" content="website">')
  h = h.replace('<meta name="robots" content="index, follow">', '<meta name="robots" content="noindex, follow">')
  h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n/g, '')
  h = replaceOnce(h, '</style>', `${DEMO_CSS}</style>`)
  h = replaceOnce(h, '<body>\n', `<body>\n<div class="demo-banner"><i class="ph-bold ph-eye"></i><span>Ceci est un <strong>exemple</strong> de fiche ${m.metier} (${m.who} n’existe pas). <a href="${m.inscription}">Crée la tienne maintenant →</a></span></div>\n`)
  h = h.replace(/<div class="brd">[\s\S]*?<\/div>/, `<div class="brd"><a href="/">Accueil</a> · <a href="${m.devenir}">${m.devenirLabel}</a> · <span>Exemple de fiche</span></div>`)
  // Étiquettes jaunes : ce que le pro remplit
  for (const [h2, label] of m.annots) h = replaceOnce(h, h2, annot(label) + h2)
  h = h.replace(/<div class="vt-strip n(\d)" style="position:relative">/, m0 => m0 + annot('Calculé depuis ta fiche'))
  // Pas de mesure ni d'envoi réel
  h = replaceOnce(h, 'function jmTrack(ev) {', 'function jmTrack(ev) { return;')
  h = replaceOnce(h, 'e.preventDefault();\n', `e.preventDefault();\n  document.getElementById('contact-form').outerHTML = '<div class="ok-msg"><strong>Exemple</strong><br>Sur une vraie fiche, ta demande part directement dans la boîte mail du pro.</div>';\n  return false;\n`)
  h = h.replace(/<div style="margin-top:12px;font-size:12px;color:var\(--tm\);line-height:1\.6">Tu as déjà bossé avec[\s\S]*?<\/div>\n/, '')
  // Liens fictifs : vers les photos de la page
  h = h.replace(/href="https:\/\/(portfolio|site)\.example" target="_blank" rel="noopener noreferrer"/g, 'href="#photos"')
  h = h.replace(/href="https:\/\/instagram\.com\/[\w.]+" target="_blank" rel="noopener"/g, 'href="#photos"')
  // À propos de la page, exemple de statistiques, appel à créer sa fiche
  h = h.replace(/<div class="disclaimer">[\s\S]*?<\/div>/, `<div class="disclaimer">
  <strong>À propos de cette page.</strong> Ceci est un aperçu fidèle de la fiche que tu obtiens dans l’annuaire. Le contenu (nom, textes, tarifs, ville${m.metier === 'équipe de ménage' ? ', SIRET' : ''}) est fictif et sert à montrer la mise en page. Photos d’illustration : Unsplash. Lors de ton inscription, tu remplis tes vraies infos et tu ajoutes tes propres photos depuis ton espace pro.
</div>`)
  h = replaceOnce(h, '\n<script>\nconst __slug', `
<!-- STATSDEMO:START -->
<section id="exemple-stats" style="background:#fff;padding:clamp(48px,7vw,80px) 0;scroll-margin-top:72px">
${statsDemoHtml(m.statsMetier)}
</section>
<!-- STATSDEMO:END -->

<div class="cta-bottom">
  <div class="lbl">${m.ctaLbl}</div>
  <h2>${m.ctaH2}</h2>
  <p>Remplis le formulaire, paye en direct via Stripe, et ta fiche est en ligne sous quelques minutes. À partir de 39,98 € TTC par an pour les 20 premiers.</p>
  <a href="${m.inscription}" class="btn-main"><i class="ph-bold ph-arrow-right"></i> Créer ma fiche maintenant</a>
</div>

<script>
const __slug`)
  return h
}

const pages = [
  {
    file: 'annuaires/photographes/exemple-fiche/index.html',
    html: buildPhotographe(CAMILLE),
    meta: {
      title: 'Exemple de fiche photographe et vidéaste · Aperçu',
      desc: 'Aperçu de la fiche que tu obtiens dans l’annuaire des photographes et vidéastes LCD de Jason Marinho : photos, vidéo, formules, déroulé, villes couvertes, contact direct.',
      metier: 'photographe', who: 'Camille', statsMetier: 'photographe',
      inscription: '/annuaires/photographes/inscription', devenir: '/devenir-photographe-lcd', devenirLabel: 'Photographes et vidéastes LCD',
      ctaLbl: 'Tu veux la même fiche pour toi ?', ctaH2: 'Crée ta fiche photographe ou vidéaste <em>en 2 minutes</em>',
      annots: [
        ['<div class="vt-h"><h2>Photos</h2>', 'Jusqu’à 6 photos'],
        ['<h2>Présentation</h2>', 'Bio que tu rédiges'],
        ['<h2>Formules</h2>', 'Tes formules'],
        ['<h2>Comment ça se passe</h2>', 'Ton déroulé'],
        ['<h2>Son travail en ligne</h2>', 'Tes liens'],
        ['<h2>Où j’interviens</h2>', 'Tes villes'],
        ['<h2>Contacter ', 'Formulaire de contact'],
      ],
    },
  },
  {
    file: 'annuaires/menage/exemple-fiche/index.html',
    html: buildMenage(ECLAT),
    meta: {
      title: 'Exemple de fiche équipe de ménage LCD · Aperçu',
      desc: 'Aperçu de la fiche que tu obtiens dans l’annuaire des équipes de ménage LCD de Jason Marinho : photos, formules, prestations, villes couvertes, contact direct.',
      metier: 'équipe de ménage', who: 'Éclat Ménage', statsMetier: 'menage',
      inscription: '/annuaires/menage/inscription', devenir: '/devenir-prestataire-menage-lcd', devenirLabel: 'Équipes ménage LCD',
      ctaLbl: 'Tu veux la même fiche pour ton équipe ?', ctaH2: 'Crée ta fiche équipe ménage <em>en 2 minutes</em>',
      annots: [
        ['<div class="vt-h"><h2>En images</h2>', 'Jusqu’à 6 photos'],
        ['<h2>Présentation</h2>', 'Bio que tu rédiges'],
        ['<h2>Formules</h2>', 'Tes formules'],
        ['<h2>Prestations</h2>', 'Prestations cochées'],
        ['<h2>Capacité', 'Capacité affichée'],
        ['<h2>L’équipe en ligne</h2>', 'Tes liens'],
        ['<h2>Comment ça se passe</h2>', 'Ton déroulé'],
        ['<h2>Où j’interviens</h2>', 'Tes villes'],
        ['<h2>Contacter ', 'Formulaire de contact'],
      ],
    },
  },
]

for (const pg of pages) {
  fs.writeFileSync(path.join(ROOT, pg.file), toDemo(pg.html, pg.meta), 'utf8')
  console.log(`[exemples-fiches] ${pg.file}`)
}
