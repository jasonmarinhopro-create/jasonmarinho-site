#!/usr/bin/env node
// Ajoute des liens contextuels inline dans les anciens articles populaires
// vers les articles récents (2026) pour renforcer le maillage interne.
// Utilise un marqueur data-xref pour éviter les doublons à la réexécution.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Liste d'insertions : { file, phrase (exact, sensible à la casse), newSlug, xrefId }
// La première occurrence de `phrase` dans un <p> sera remplacée par un <a>.
// xrefId sert de marqueur idempotent.
const INSERTIONS = [
  // optimiser-annonce-airbnb (populaire, ~2 backlinks)
  { file: 'blog/optimiser-annonce-airbnb/index.html',
    phrase: 'algorithme Airbnb',
    newSlug: 'algorithme-airbnb-2026-criteres-classement',
    xrefId: 'algo2026' },
  { file: 'blog/optimiser-annonce-airbnb/index.html',
    phrase: 'photos',
    newSlug: 'photos-airbnb-computer-vision-ia-optimiser',
    xrefId: 'photoscv' },

  // tarification-dynamique-lcd (populaire)
  { file: 'blog/tarification-dynamique-lcd/index.html',
    phrase: 'tarification dynamique',
    newSlug: 'hospitable-tarification-dynamique-incluse-pms-fin-outils-seuls',
    xrefId: 'hospitable' },

  // attirer-teletravailleur-nomade-digital (beau contexte workation)
  { file: 'blog/attirer-teletravailleur-nomade-digital-location-courte-duree/index.html',
    phrase: 'télétravailleur',
    newSlug: 'workation-lcd-logement-equiper-louer-cher-hors-saison',
    xrefId: 'workation' },

  // basse-saison-strategies (séjours longs)
  { file: 'blog/basse-saison-location-courte-duree-strategies-reservations/index.html',
    phrase: 'basse saison',
    newSlug: 'sejours-longs-lcd-strategie-revenus-basse-saison',
    xrefId: 'sejourslongs' },

  // outils-gerer-location-courte-duree-2025 (PMS, Hospitable, Cybevasion)
  { file: 'blog/outils-gerer-location-courte-duree-2025/index.html',
    phrase: 'PMS',
    newSlug: 'hospitable-tarification-dynamique-incluse-pms-fin-outils-seuls',
    xrefId: 'hospitable-pms' },

  // location-courte-duree-impots-france (TVA 2026)
  { file: 'blog/location-courte-duree-impots-france/index.html',
    phrase: 'seuil',
    newSlug: 'tva-location-courte-duree-2026',
    xrefId: 'tva2026' },

  // airbnb-vs-booking-com (ChatGPT Booking)
  { file: 'blog/airbnb-vs-booking-com-location-courte-duree/index.html',
    phrase: 'Booking',
    newSlug: 'chatgpt-booking-com-impact-hotes-lcd',
    xrefId: 'chatgpt-booking' },

  // outils-gerer (cybevasion/holidu)
  { file: 'blog/outils-gerer-location-courte-duree-2025/index.html',
    phrase: 'Airbnb',
    newSlug: 'cybevasion-rachetee-holidu-impact-hotes-alternatives',
    xrefId: 'cybevasion-holidu' },
];

function escapeRe(s) {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

let totalInserted = 0;
for (const ins of INSERTIONS) {
  const p = path.join(ROOT, ins.file);
  if (!fs.existsSync(p)) { console.warn(`  ⚠  skip (missing): ${ins.file}`); continue; }
  let html = fs.readFileSync(p, 'utf8');

  // Skip si déjà injecté (marqueur unique)
  if (html.includes(`data-xref="${ins.xrefId}"`)) {
    console.log(`  ↻ ${ins.file} (${ins.xrefId}) déjà présent, skip`);
    continue;
  }

  // Cherche la 1ère occurrence de la phrase à l'intérieur d'une balise <p>
  // (on évite les <a>, <title>, <meta>, <h1>, <h2>…)
  const pattern = new RegExp(
    `(<p[^>]*>(?:(?!</p>)[\\s\\S])*?)` +
    `(${escapeRe(ins.phrase)})` +
    `((?:(?!</p>)[\\s\\S])*?</p>)`,
    'i'
  );
  const match = pattern.exec(html);
  if (!match) {
    console.warn(`  ⚠  phrase "${ins.phrase}" introuvable dans ${ins.file}`);
    continue;
  }

  // Vérifier qu'on ne tombe pas dans un <a> déjà existant
  const before = match[1];
  const openAs = (before.match(/<a\b/g) || []).length;
  const closeAs = (before.match(/<\/a>/g) || []).length;
  if (openAs > closeAs) {
    console.warn(`  ⚠  phrase dans un <a> existant dans ${ins.file}, skip`);
    continue;
  }

  const href = `/blog/${ins.newSlug}`;
  const wrapped = `<a href="${href}" data-xref="${ins.xrefId}" style="color:var(--g);text-decoration:underline;text-decoration-color:rgba(0,76,63,.25);text-underline-offset:2px">${match[2]}</a>`;
  const newHtml = html.slice(0, match.index) + before + wrapped + match[3] + html.slice(match.index + match[0].length);
  fs.writeFileSync(p, newHtml);
  console.log(`  ✓ ${ins.file} : "${ins.phrase}" → /blog/${ins.newSlug}`);
  totalInserted++;
}

console.log(`\n🎉 ${totalInserted} liens contextuels inline ajoutés.`);
