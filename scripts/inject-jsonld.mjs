#!/usr/bin/env node
// Injecte WebPage + BreadcrumbList (+ Service pour les outils) dans les pages
// qui n'ont pas encore de JSON-LD. Rerunnable : skip si déjà présent.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const MARKER_START = '<!-- JSONLD-AUTO:START -->';
const MARKER_END   = '<!-- JSONLD-AUTO:END -->';

// path relatif → { name, url, crumbs: [{name,item}], serviceType? }
const PAGES = {
  'blog/index.html': {
    type: 'Blog',
    name: 'Blog LCD — Jason Marinho',
    url: 'https://jasonmarinho.com/blog',
    description: 'Articles, conseils et ressources gratuites sur la location courte durée.',
    crumbs: [
      { name: 'Accueil', item: 'https://jasonmarinho.com/' },
      { name: 'Blog',    item: 'https://jasonmarinho.com/blog' },
    ],
  },
  'services/formations/index.html': {
    type: 'CollectionPage',
    name: 'Formations LCD — Jason Marinho',
    url: 'https://jasonmarinho.com/services/formations',
    description: '15 formations pratiques pour hôtes Airbnb et conciergeries en location courte durée.',
    crumbs: [
      { name: 'Accueil',     item: 'https://jasonmarinho.com/' },
      { name: 'Services',    item: 'https://jasonmarinho.com/services' },
      { name: 'Formations',  item: 'https://jasonmarinho.com/services/formations' },
    ],
  },
  'services/calendrier/index.html': {
    type: 'Service',
    name: 'Calendrier & check-list par séjour',
    url: 'https://jasonmarinho.com/services/calendrier',
    description: 'Calendrier pour hôtes LCD avec check-list par séjour et synchronisation iCal.',
    serviceType: 'Outil LCD gratuit',
    crumbs: [
      { name: 'Accueil',    item: 'https://jasonmarinho.com/' },
      { name: 'Services',   item: 'https://jasonmarinho.com/services' },
      { name: 'Calendrier', item: 'https://jasonmarinho.com/services/calendrier' },
    ],
  },
  'services/revenus/index.html': {
    type: 'Service',
    name: 'Suivi des revenus & paiements',
    url: 'https://jasonmarinho.com/services/revenus',
    description: 'Journal centralisé des revenus LCD : virements, espèces, chèques et paiements en ligne.',
    serviceType: 'Outil LCD gratuit',
    crumbs: [
      { name: 'Accueil',  item: 'https://jasonmarinho.com/' },
      { name: 'Services', item: 'https://jasonmarinho.com/services' },
      { name: 'Revenus',  item: 'https://jasonmarinho.com/services/revenus' },
    ],
  },
  'services/securite/index.html': {
    type: 'Service',
    name: 'Vérification voyageurs',
    url: 'https://jasonmarinho.com/services/securite',
    description: 'Base communautaire pour vérifier les voyageurs avant d\'accepter une réservation LCD.',
    serviceType: 'Outil LCD gratuit',
    crumbs: [
      { name: 'Accueil',    item: 'https://jasonmarinho.com/' },
      { name: 'Services',   item: 'https://jasonmarinho.com/services' },
      { name: 'Vérification voyageurs', item: 'https://jasonmarinho.com/services/securite' },
    ],
  },
  'services/actualites/index.html': {
    type: 'WebPage',
    name: 'Actualités LCD — Jason Marinho',
    url: 'https://jasonmarinho.com/services/actualites',
    description: 'Actualités de la location courte durée : loi Le Meur, fiscalité 2026, plateformes OTA.',
    crumbs: [
      { name: 'Accueil',    item: 'https://jasonmarinho.com/' },
      { name: 'Services',   item: 'https://jasonmarinho.com/services' },
      { name: 'Actualités', item: 'https://jasonmarinho.com/services/actualites' },
    ],
  },
  'services/guides-lcd/index.html': {
    type: 'WebPage',
    name: 'Guides LCD — Jason Marinho',
    url: 'https://jasonmarinho.com/services/guides-lcd',
    description: 'Guides LCD complets par profil d\'hôte : gîtes, chambres d\'hôtes, conciergeries, réservation directe.',
    crumbs: [
      { name: 'Accueil',    item: 'https://jasonmarinho.com/' },
      { name: 'Services',   item: 'https://jasonmarinho.com/services' },
      { name: 'Guides LCD', item: 'https://jasonmarinho.com/services/guides-lcd' },
    ],
  },
  'services/communaute/index.html': {
    type: 'WebPage',
    name: 'Communauté LCD — Jason Marinho',
    url: 'https://jasonmarinho.com/services/communaute',
    description: 'Groupes Facebook d\'hôtes LCD : entraide, visibilité locale, bonnes pratiques.',
    crumbs: [
      { name: 'Accueil',    item: 'https://jasonmarinho.com/' },
      { name: 'Services',   item: 'https://jasonmarinho.com/services' },
      { name: 'Communauté', item: 'https://jasonmarinho.com/services/communaute' },
    ],
  },
  'services/partenaires/index.html': {
    type: 'WebPage',
    name: 'Partenaires LCD — Jason Marinho',
    url: 'https://jasonmarinho.com/services/partenaires',
    description: 'Partenaires LCD Jason Marinho : Driing (réservation directe), PMS, assurances et outils négociés.',
    crumbs: [
      { name: 'Accueil',     item: 'https://jasonmarinho.com/' },
      { name: 'Services',    item: 'https://jasonmarinho.com/services' },
      { name: 'Partenaires', item: 'https://jasonmarinho.com/services/partenaires' },
    ],
  },
  'pour-qui/membres-driing/index.html': {
    type: 'WebPage',
    name: 'Membres Driing — Jason Marinho',
    url: 'https://jasonmarinho.com/pour-qui/membres-driing',
    description: 'Avantages exclusifs pour les membres Driing : formations prioritaires, partenaires négociés, support direct.',
    crumbs: [
      { name: 'Accueil',       item: 'https://jasonmarinho.com/' },
      { name: 'Pour qui',      item: 'https://jasonmarinho.com/pour-qui' },
      { name: 'Membres Driing', item: 'https://jasonmarinho.com/pour-qui/membres-driing' },
    ],
  },
  'tarifs/index.html': {
    type: 'WebPage',
    name: 'Tarifs — Jason Marinho',
    url: 'https://jasonmarinho.com/tarifs',
    description: 'Tarifs des formations et accompagnements LCD proposés par Jason Marinho.',
    crumbs: [
      { name: 'Accueil', item: 'https://jasonmarinho.com/' },
      { name: 'Tarifs',  item: 'https://jasonmarinho.com/tarifs' },
    ],
  },
  'contact/index.html': {
    type: 'ContactPage',
    name: 'Contact — Jason Marinho',
    url: 'https://jasonmarinho.com/contact',
    description: 'Contacter Jason Marinho pour toute question sur la location courte durée, les formations ou les outils.',
    crumbs: [
      { name: 'Accueil', item: 'https://jasonmarinho.com/' },
      { name: 'Contact', item: 'https://jasonmarinho.com/contact' },
    ],
  },
};

function buildBlocks(cfg) {
  const main = {
    '@context': 'https://schema.org',
    '@type': cfg.type,
    name: cfg.name,
    url: cfg.url,
    description: cfg.description,
    inLanguage: 'fr-FR',
    isPartOf: { '@type': 'WebSite', name: 'Jason Marinho', url: 'https://jasonmarinho.com' },
  };
  if (cfg.serviceType) {
    main.provider = { '@type': 'Person', name: 'Jason Marinho', url: 'https://jasonmarinho.com' };
    main.serviceType = cfg.serviceType;
    main.areaServed = 'France';
  }
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: cfg.crumbs.map((c, i) => ({
      '@type': 'ListItem', position: i + 1, name: c.name, item: c.item,
    })),
  };
  return `${MARKER_START}\n<script type="application/ld+json">\n${JSON.stringify(main, null, 2)}\n</script>\n<script type="application/ld+json">\n${JSON.stringify(breadcrumb, null, 2)}\n</script>\n${MARKER_END}\n`;
}

function processFile(relPath, cfg) {
  const filePath = path.join(ROOT, relPath);
  if (!fs.existsSync(filePath)) { console.warn(`  ⚠  skip (missing): ${relPath}`); return; }
  let html = fs.readFileSync(filePath, 'utf8');

  // Rerunnable : supprime la section existante si elle vient de ce script
  const existingRe = new RegExp(
    MARKER_START.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') +
    '[\\s\\S]*?' +
    MARKER_END.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') +
    '\\n?'
  );
  html = html.replace(existingRe, '');

  const block = buildBlocks(cfg);
  // Insérer juste avant </head>
  const headEnd = html.indexOf('</head>');
  if (headEnd === -1) { console.warn(`  ⚠  no </head> in ${relPath}`); return; }
  html = html.slice(0, headEnd) + block + html.slice(headEnd);
  fs.writeFileSync(filePath, html);
  console.log(`  ✓ ${relPath}`);
}

console.log('Injection JSON-LD (WebPage + BreadcrumbList)…');
for (const [rel, cfg] of Object.entries(PAGES)) {
  processFile(rel, cfg);
}
console.log(`\n🎉 ${Object.keys(PAGES).length} pages traitées.`);
