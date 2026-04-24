#!/usr/bin/env node
// Injecte une section "Ressources liées" sur les pages services/outils
// et /pour-qui/*, juste avant le CTA final (section avec class="sec dk" ou "cta-s").
// Rerunnable : remplace la section existante si présente.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Bibliothèque des cibles disponibles avec metadata
const TARGETS = {
  // Formations
  'formation:annonce-directe':                          { href: '/services/formations/annonce-directe',                          label: 'Annonce directe sans commission',        desc: 'Construire ton canal direct pour te libérer d\'Airbnb.',       icon: 'ph-storefront',         kind: 'Formation' },
  'formation:creer-conciergerie-lcd':                   { href: '/services/formations/creer-conciergerie-lcd',                   label: 'Créer sa conciergerie LCD',              desc: 'De zéro à tes premiers mandats : statut, carte G, prospection.', icon: 'ph-key',              kind: 'Formation' },
  'formation:decorer-amenager-logement-lcd':            { href: '/services/formations/decorer-amenager-logement-lcd',            label: 'Décorer & aménager son logement',        desc: 'Un logement bien décoré = 20 à 30 % de réservations en plus.',  icon: 'ph-paint-brush',      kind: 'Formation' },
  'formation:ecrire-avis-repondre-voyageurs':           { href: '/services/formations/ecrire-avis-repondre-voyageurs',           label: 'Avis & réponses aux voyageurs',          desc: 'Collecter, rédiger, répondre pour booster tes réservations.',   icon: 'ph-chat-circle-text', kind: 'Formation' },
  'formation:fiscalite-reglementation-lcd-france-2026': { href: '/services/formations/fiscalite-reglementation-lcd-france-2026', label: 'Fiscalité & réglementation 2026',        desc: 'Loi Le Meur, micro-BIC, régime réel, DPE : en règle et optimisé.', icon: 'ph-scales',         kind: 'Formation' },
  'formation:fiscalite-statut-conciergerie-tourisme':   { href: '/services/formations/fiscalite-statut-conciergerie-tourisme',   label: 'Fiscalité & statut conciergerie',        desc: 'BIC ou BNC, micro ou réel, EURL ou SASU : choisir le bon statut.', icon: 'ph-briefcase',      kind: 'Formation' },
  'formation:gerer-lcd-automatisation':                 { href: '/services/formations/gerer-lcd-automatisation',                 label: 'Automatiser sa LCD',                     desc: 'Messages, accès, ménage : 12 h/semaine gagnées.',               icon: 'ph-lightning',        kind: 'Formation' },
  'formation:google-my-business-lcd':                   { href: '/services/formations/google-my-business-lcd',                   label: 'Google My Business pour la LCD',         desc: 'Créer, optimiser ta fiche GMB et générer des réservations directes.', icon: 'ph-map-trifold',   kind: 'Formation' },
  'formation:lcd-basse-saison':                         { href: '/services/formations/lcd-basse-saison',                         label: 'Développer la LCD en basse saison',      desc: 'Tarification, cibles, partenariats pour remplir hors saison.',  icon: 'ph-snowflake',        kind: 'Formation' },
  'formation:livret-accueil-digital':                   { href: '/services/formations/livret-accueil-digital',                   label: 'Livret d\'accueil digital',              desc: 'Réduire de 80 % les questions voyageurs et améliorer tes avis.', icon: 'ph-book-open',       kind: 'Formation' },
  'formation:mettre-le-bon-prix-lcd':                   { href: '/services/formations/mettre-le-bon-prix-lcd',                   label: 'Mettre le bon prix en LCD',              desc: 'Prix min, base, saisonnalité : ne laisser aucun euro sur la table.', icon: 'ph-tag',         kind: 'Formation' },
  'formation:optimiser-annonce-airbnb':                 { href: '/services/formations/optimiser-annonce-airbnb',                 label: 'Optimiser son annonce Airbnb',           desc: 'Remonter dans les résultats en 2026 sans changer ton logement.', icon: 'ph-trend-up',        kind: 'Formation' },
  'formation:reseaux-sociaux-lcd':                      { href: '/services/formations/reseaux-sociaux-lcd',                      label: 'Réseaux sociaux pour la LCD',            desc: 'Instagram & co : transformer tes abonnés en réservations directes.', icon: 'ph-instagram-logo', kind: 'Formation' },
  'formation:securiser-reservations-eviter-mauvais-voyageurs': { href: '/services/formations/securiser-reservations-eviter-mauvais-voyageurs', label: 'Sécuriser tes réservations', desc: 'Vérif d\'identité, caution, fiche police, AirCover, règlement.', icon: 'ph-shield-check',  kind: 'Formation' },
  'formation:tarification-dynamique':                   { href: '/services/formations/tarification-dynamique',                   label: 'Tarification dynamique',                 desc: '45 % des hôtes perdent 15 à 25 % de revenus sur leur prix.',    icon: 'ph-chart-line-up',    kind: 'Formation' },

  // Outils
  'outil:calendrier':     { href: '/services/calendrier',     label: 'Calendrier & check-list',    desc: 'Synchronise tes flux iCal et suis tes séjours sans rien oublier.', icon: 'ph-calendar-check', kind: 'Outil' },
  'outil:revenus':        { href: '/services/revenus',        label: 'Suivi des revenus',          desc: 'Pilote tes revenus LCD plateforme par plateforme, mois après mois.', icon: 'ph-chart-line-up',  kind: 'Outil' },
  'outil:securite':       { href: '/services/securite',       label: 'Vérification voyageurs',     desc: 'Base communautaire pour détecter les voyageurs problématiques.', icon: 'ph-shield-check',   kind: 'Outil' },
  'outil:gabarits':       { href: '/ressources/gabarits-messages', label: 'Gabarits messages',     desc: 'Modèles de messages Airbnb et Booking prêts à copier-coller.',  icon: 'ph-chat-text',      kind: 'Outil' },

  // Ressources
  'res:blog':             { href: '/blog',                    label: 'Blog LCD',                   desc: '60+ articles gratuits sur l\'optimisation, la fiscalité et la visibilité.', icon: 'ph-newspaper',   kind: 'Ressource' },
  'res:actualites':       { href: '/services/actualites',     label: 'Actualités LCD',             desc: 'Les dernières nouvelles du secteur : lois, plateformes, tendances.', icon: 'ph-megaphone',       kind: 'Ressource' },
  'res:guides':           { href: '/services/guides-lcd',     label: 'Guides LCD',                 desc: 'Guides complets pour chaque thématique LCD importante.',        icon: 'ph-books',            kind: 'Ressource' },
  'res:communaute':       { href: '/services/communaute',     label: 'Communauté LCD',             desc: 'Groupes Facebook privés pour échanger entre hôtes.',           icon: 'ph-users-four',       kind: 'Ressource' },
  'res:partenaires':      { href: '/services/partenaires',    label: 'Partenaires exclusifs',      desc: 'Outils et assurances avec conditions négociées pour les membres.', icon: 'ph-handshake',     kind: 'Ressource' },
  'res:formations':       { href: '/services/formations',     label: 'Toutes les formations',      desc: '16 formations pour développer ton activité LCD.',               icon: 'ph-graduation-cap',   kind: 'Ressource' },
};

// Pages à enrichir : slug local → { title, subtitle, related[], beforeSelector }
// beforeSelector: portion de HTML avant laquelle insérer la section
const PAGES = {
  // --- Outils ---
  'services/calendrier': {
    title: 'Pour aller plus loin',
    subtitle: 'Complète ton calendrier avec <em>ces ressources</em>',
    related: ['formation:gerer-lcd-automatisation', 'formation:livret-accueil-digital', 'outil:securite'],
  },
  'services/revenus': {
    title: 'Pour aller plus loin',
    subtitle: 'Maximise tes revenus avec <em>ces formations</em>',
    related: ['formation:tarification-dynamique', 'formation:mettre-le-bon-prix-lcd', 'formation:lcd-basse-saison'],
  },
  'services/securite': {
    title: 'Pour aller plus loin',
    subtitle: 'Protège ton activité avec <em>ces formations</em>',
    related: ['formation:securiser-reservations-eviter-mauvais-voyageurs', 'formation:ecrire-avis-repondre-voyageurs', 'formation:gerer-lcd-automatisation'],
  },
  'services/actualites': {
    title: 'Pour aller plus loin',
    subtitle: 'Approfondis ta veille avec <em>ces ressources</em>',
    related: ['res:blog', 'res:guides', 'res:communaute'],
  },
  'services/guides-lcd': {
    title: 'Pour aller plus loin',
    subtitle: 'Complète ta lecture avec <em>ces ressources</em>',
    related: ['res:formations', 'res:blog', 'res:actualites'],
  },
  'services/partenaires': {
    title: 'Pour aller plus loin',
    subtitle: 'Découvre aussi <em>ces ressources</em>',
    related: ['res:communaute', 'res:formations', 'outil:gabarits'],
  },
  'services/communaute': {
    title: 'Pour aller plus loin',
    subtitle: 'Prolonge l\'échange avec <em>ces ressources</em>',
    related: ['res:partenaires', 'res:blog', 'res:formations'],
  },

  // --- Pour qui ---
  'pour-qui/chambres-dhotes': {
    title: 'Pour toi',
    subtitle: 'Les ressources les plus utiles pour <em>ton profil</em>',
    related: ['formation:optimiser-annonce-airbnb', 'formation:ecrire-avis-repondre-voyageurs', 'outil:calendrier'],
  },
  'pour-qui/gites': {
    title: 'Pour toi',
    subtitle: 'Les ressources les plus utiles pour <em>les gîtes</em>',
    related: ['formation:lcd-basse-saison', 'formation:annonce-directe', 'outil:revenus'],
  },
  'pour-qui/conciergeries': {
    title: 'Pour toi',
    subtitle: 'Les ressources les plus utiles pour <em>les conciergeries</em>',
    related: ['formation:creer-conciergerie-lcd', 'formation:fiscalite-statut-conciergerie-tourisme', 'formation:gerer-lcd-automatisation'],
  },
  'pour-qui/membres-driing': {
    title: 'Pour toi',
    subtitle: 'Profite pleinement de <em>ton espace membre</em>',
    related: ['outil:calendrier', 'outil:revenus', 'res:partenaires'],
  },
};

const MARKER_START = '<!-- RELATED-LINKS:START -->';
const MARKER_END   = '<!-- RELATED-LINKS:END -->';

function buildSection(page) {
  const cards = page.related.map(key => {
    const t = TARGETS[key];
    if (!t) { console.warn(`    ⚠  unknown target ${key}`); return ''; }
    return `      <a href="${t.href}" class="rel-card">
        <div class="rel-ico"><i class="ph ${t.icon}"></i></div>
        <div class="rel-body">
          <div class="rel-kind">${t.kind}</div>
          <div class="rel-title">${t.label}</div>
          <div class="rel-desc">${t.desc}</div>
          <div class="rel-cta">Découvrir <i class="ph-bold ph-arrow-right"></i></div>
        </div>
      </a>`;
  }).filter(Boolean).join('\n');

  return `${MARKER_START}
<section class="sec cr rel-sec">
  <style>
    .rel-sec .rel-head{text-align:center;margin-bottom:36px}
    .rel-sec .rel-head .lbl{color:var(--ol,#556B2F)!important}
    .rel-sec .rel-head .h2{color:var(--td)}
    .rel-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;max-width:1100px;margin:0 auto}
    .rel-card{display:flex;flex-direction:column;gap:12px;background:var(--w);border:1px solid var(--bd);border-radius:14px;padding:22px;text-decoration:none;color:inherit;transition:transform .22s,box-shadow .22s,border-color .22s}
    .rel-card:hover{transform:translateY(-3px);box-shadow:0 10px 28px rgba(0,76,63,.08);border-color:rgba(0,76,63,.18)}
    .rel-ico{width:42px;height:42px;border-radius:10px;background:var(--cr);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .rel-ico i{font-size:22px;color:var(--g);line-height:1}
    .rel-card:hover .rel-ico{background:var(--g)}
    .rel-card:hover .rel-ico i{color:var(--y)}
    .rel-body{display:flex;flex-direction:column;gap:6px;flex:1}
    .rel-kind{font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--ol,#556B2F)}
    .rel-title{font-family:'Fraunces',serif;font-size:17px;font-weight:400;color:var(--td);line-height:1.3;letter-spacing:-.2px}
    .rel-desc{font-size:13px;font-weight:300;color:var(--tm);line-height:1.55;flex:1}
    .rel-cta{font-size:13px;font-weight:600;color:var(--g);display:flex;align-items:center;gap:6px;margin-top:4px}
    .rel-cta i{font-size:12px}
    @media(max-width:900px){.rel-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:560px){.rel-grid{grid-template-columns:1fr}}
  </style>
  <div class="s-in">
    <div class="rel-head rv">
      <div class="lbl">${page.title}</div>
      <h2 class="h2" style="margin-bottom:0">${page.subtitle}</h2>
    </div>
    <div class="rel-grid rv">
${cards}
    </div>
  </div>
</section>
${MARKER_END}
`;
}

// Injecte avant la première section CTA finale trouvée (cta-s OU sec dk)
function injectBeforeCTA(html, section) {
  const ctaS   = html.indexOf('<section class="cta-s"');
  const secDk  = html.indexOf('<section class="sec dk"');
  let idx = -1;
  if (ctaS !== -1 && secDk !== -1) idx = Math.min(ctaS, secDk);
  else idx = ctaS !== -1 ? ctaS : secDk;

  if (idx === -1) return null;
  return html.slice(0, idx) + section + '\n' + html.slice(idx);
}

function processPage(slug, page) {
  const filePath = path.join(ROOT, slug, 'index.html');
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠  skip (file missing): ${slug}`);
    return;
  }
  let html = fs.readFileSync(filePath, 'utf8');

  // Supprime la section existante si présente
  const existingRe = new RegExp(
    MARKER_START.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') +
    '[\\s\\S]*?' +
    MARKER_END.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') +
    '\\n?'
  );
  html = html.replace(existingRe, '');

  const section = buildSection(page);
  const injected = injectBeforeCTA(html, section);
  if (!injected) {
    console.warn(`  ⚠  no CTA section found in ${slug}, skipping`);
    return;
  }

  fs.writeFileSync(filePath, injected);
  console.log(`  ✓ ${slug}`);
}

console.log('Injection "Ressources liées" sur pages outils + pour-qui…');
for (const [slug, page] of Object.entries(PAGES)) {
  processPage(slug, page);
}
console.log(`\n🎉 ${Object.keys(PAGES).length} pages mises à jour.`);
