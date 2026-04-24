#!/usr/bin/env node
// Injecte une section "Formations liées" sur chaque page de formation
// juste avant la <section class="cta-s"> finale.
// Rerunnable : si la section existe déjà, elle est remplacée.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FORMATIONS_DIR = path.join(__dirname, '..', 'services', 'formations');

// Métadonnées de chaque formation (titre court carte + description + icône phosphor)
const FORMATIONS = {
  'annonce-directe': {
    title: 'Annonce directe sans commission',
    short: 'Construire ton canal direct de A à Z pour te libérer d\'Airbnb.',
    icon: 'ph-storefront',
  },
  'creer-conciergerie-lcd': {
    title: 'Créer sa conciergerie LCD',
    short: 'De zéro à tes premiers mandats : statut, carte G, prospection, outils.',
    icon: 'ph-key',
  },
  'decorer-amenager-logement-lcd': {
    title: 'Décorer & aménager son logement',
    short: 'Un logement bien décoré génère 20 à 30 % de réservations en plus.',
    icon: 'ph-paint-brush',
  },
  'ecrire-avis-repondre-voyageurs': {
    title: 'Avis & réponses aux voyageurs',
    short: 'Collecter, rédiger, répondre aux avis pour booster tes réservations.',
    icon: 'ph-chat-circle-text',
  },
  'fiscalite-reglementation-lcd-france-2026': {
    title: 'Fiscalité & réglementation 2026',
    short: 'Loi Le Meur, micro-BIC, régime réel, DPE : en règle et optimisé.',
    icon: 'ph-scales',
  },
  'fiscalite-statut-conciergerie-tourisme': {
    title: 'Fiscalité & statut conciergerie',
    short: 'BIC ou BNC, micro ou réel, EURL ou SASU : choisir le bon statut.',
    icon: 'ph-briefcase',
  },
  'gerer-lcd-automatisation': {
    title: 'Gérer sa LCD par automatisation',
    short: 'Messages, accès, ménage, tarification : 12 h/semaine gagnées.',
    icon: 'ph-lightning',
  },
  'google-my-business-lcd': {
    title: 'Google My Business pour la LCD',
    short: 'Créer, optimiser ta fiche GMB et générer des réservations directes.',
    icon: 'ph-map-trifold',
  },
  'lcd-basse-saison': {
    title: 'Développer la LCD en basse saison',
    short: 'Tarification, cibles, partenariats locaux pour remplir hors saison.',
    icon: 'ph-snowflake',
  },
  'livret-accueil-digital': {
    title: 'Livret d\'accueil digital',
    short: 'Réduire de 80 % les questions voyageurs et améliorer tes avis.',
    icon: 'ph-book-open',
  },
  'mettre-le-bon-prix-lcd': {
    title: 'Mettre le bon prix en LCD',
    short: 'Prix minimum, base, saisonnalité : ne jamais laisser d\'argent sur la table.',
    icon: 'ph-tag',
  },
  'optimiser-annonce-airbnb': {
    title: 'Optimiser son annonce Airbnb',
    short: 'Remonter dans les résultats en 2026 sans changer ton logement.',
    icon: 'ph-trend-up',
  },
  'reseaux-sociaux-lcd': {
    title: 'Réseaux sociaux pour la LCD',
    short: 'Instagram & co : attirer et transformer tes abonnés en réservations directes.',
    icon: 'ph-instagram-logo',
  },
  'securiser-reservations-eviter-mauvais-voyageurs': {
    title: 'Sécuriser tes réservations',
    short: 'Vérification d\'identité, caution, fiche police, AirCover, règlement intérieur.',
    icon: 'ph-shield-check',
  },
  'tarification-dynamique': {
    title: 'Tarification dynamique',
    short: '45 % des hôtes perdent 15 à 25 % de revenus sur leur prix : corrige-le.',
    icon: 'ph-chart-line-up',
  },
};

// Relations sémantiques : chaque formation renvoie vers 3 formations complémentaires
const RELATIONS = {
  'annonce-directe':                          ['google-my-business-lcd', 'reseaux-sociaux-lcd', 'tarification-dynamique'],
  'creer-conciergerie-lcd':                   ['fiscalite-statut-conciergerie-tourisme', 'gerer-lcd-automatisation', 'mettre-le-bon-prix-lcd'],
  'decorer-amenager-logement-lcd':            ['optimiser-annonce-airbnb', 'livret-accueil-digital', 'ecrire-avis-repondre-voyageurs'],
  'ecrire-avis-repondre-voyageurs':           ['livret-accueil-digital', 'optimiser-annonce-airbnb', 'securiser-reservations-eviter-mauvais-voyageurs'],
  'fiscalite-reglementation-lcd-france-2026': ['fiscalite-statut-conciergerie-tourisme', 'creer-conciergerie-lcd', 'gerer-lcd-automatisation'],
  'fiscalite-statut-conciergerie-tourisme':   ['creer-conciergerie-lcd', 'fiscalite-reglementation-lcd-france-2026', 'gerer-lcd-automatisation'],
  'gerer-lcd-automatisation':                 ['tarification-dynamique', 'livret-accueil-digital', 'securiser-reservations-eviter-mauvais-voyageurs'],
  'google-my-business-lcd':                   ['annonce-directe', 'reseaux-sociaux-lcd', 'optimiser-annonce-airbnb'],
  'lcd-basse-saison':                         ['tarification-dynamique', 'mettre-le-bon-prix-lcd', 'annonce-directe'],
  'livret-accueil-digital':                   ['ecrire-avis-repondre-voyageurs', 'gerer-lcd-automatisation', 'decorer-amenager-logement-lcd'],
  'mettre-le-bon-prix-lcd':                   ['tarification-dynamique', 'lcd-basse-saison', 'gerer-lcd-automatisation'],
  'optimiser-annonce-airbnb':                 ['google-my-business-lcd', 'ecrire-avis-repondre-voyageurs', 'tarification-dynamique'],
  'reseaux-sociaux-lcd':                      ['annonce-directe', 'google-my-business-lcd', 'optimiser-annonce-airbnb'],
  'securiser-reservations-eviter-mauvais-voyageurs': ['ecrire-avis-repondre-voyageurs', 'gerer-lcd-automatisation', 'livret-accueil-digital'],
  'tarification-dynamique':                   ['mettre-le-bon-prix-lcd', 'lcd-basse-saison', 'gerer-lcd-automatisation'],
};

const MARKER_START = '<!-- RELATED-FORMATIONS:START -->';
const MARKER_END   = '<!-- RELATED-FORMATIONS:END -->';

function buildSection(currentSlug) {
  const related = RELATIONS[currentSlug];
  if (!related) return '';

  const cards = related.map(slug => {
    const f = FORMATIONS[slug];
    if (!f) return '';
    return `      <a href="/services/formations/${slug}" class="rel-card">
        <div class="rel-ico"><i class="ph-light ${f.icon}"></i></div>
        <div class="rel-body">
          <div class="rel-title">${f.title}</div>
          <div class="rel-desc">${f.short}</div>
          <div class="rel-cta">Voir la formation <i class="ph-bold ph-arrow-right"></i></div>
        </div>
      </a>`;
  }).join('\n');

  return `${MARKER_START}
<section class="sec cr rel-sec">
  <style>
    .rel-sec .rel-head{text-align:center;margin-bottom:36px}
    .rel-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;max-width:1100px;margin:0 auto}
    .rel-card{display:flex;flex-direction:column;gap:14px;background:var(--w);border:1px solid var(--bd);border-radius:14px;padding:22px;text-decoration:none;color:inherit;transition:transform .22s,box-shadow .22s,border-color .22s}
    .rel-card:hover{transform:translateY(-3px);box-shadow:0 10px 28px rgba(0,76,63,.08);border-color:rgba(0,76,63,.18)}
    .rel-ico{width:42px;height:42px;border-radius:10px;background:var(--cr);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .rel-ico i{font-size:20px;color:var(--g)}
    .rel-card:hover .rel-ico{background:var(--g)}
    .rel-card:hover .rel-ico i{color:var(--y)}
    .rel-body{display:flex;flex-direction:column;gap:8px;flex:1}
    .rel-title{font-family:'Fraunces',serif;font-size:17px;font-weight:400;color:var(--td);line-height:1.3;letter-spacing:-.2px}
    .rel-desc{font-size:13px;font-weight:300;color:var(--tm);line-height:1.55;flex:1}
    .rel-cta{font-size:13px;font-weight:600;color:var(--g);display:flex;align-items:center;gap:6px;margin-top:4px}
    .rel-cta i{font-size:12px}
    @media(max-width:900px){.rel-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:560px){.rel-grid{grid-template-columns:1fr}}
  </style>
  <div class="s-in">
    <div class="rel-head rv">
      <div class="lbl">Formations liées</div>
      <h2 class="h2" style="margin-bottom:0">Continue avec <em>ces formations</em></h2>
    </div>
    <div class="rel-grid rv">
${cards}
    </div>
  </div>
</section>
${MARKER_END}
`;
}

function processFile(slug) {
  const filePath = path.join(FORMATIONS_DIR, slug, 'index.html');
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠  skip (file missing): ${filePath}`);
    return;
  }
  let html = fs.readFileSync(filePath, 'utf8');

  // Enlever la section existante si déjà présente (rerunnable)
  const existingRe = new RegExp(
    MARKER_START.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') +
    '[\\s\\S]*?' +
    MARKER_END.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') +
    '\\n?'
  );
  html = html.replace(existingRe, '');

  const section = buildSection(slug);
  if (!section) {
    console.warn(`  ⚠  no relations defined for ${slug}`);
    return;
  }

  // Insérer juste avant la première <section class="cta-s">
  const ctaIdx = html.indexOf('<section class="cta-s"');
  if (ctaIdx === -1) {
    console.warn(`  ⚠  no cta-s section found in ${slug}, skipping`);
    return;
  }
  html = html.slice(0, ctaIdx) + section + '\n' + html.slice(ctaIdx);

  fs.writeFileSync(filePath, html);
  console.log(`  ✓ ${slug}`);
}

console.log('Injection "Formations liées" sur les pages de formations…');
for (const slug of Object.keys(RELATIONS)) {
  processFile(slug);
}
console.log(`\n🎉 ${Object.keys(RELATIONS).length} formations mises à jour.`);
