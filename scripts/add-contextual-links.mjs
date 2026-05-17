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

  // ─── Vague d'expansion 2026 ────────────────────────────────────────
  // Maillage thématique sur les articles à fort trafic vers les contenus
  // 2026 récents, pour distribuer le jus SEO.

  // creer-conciergerie-airbnb-2025 → conciergerie-airbnb-faire-appel
  { file: 'blog/creer-conciergerie-airbnb-2025/index.html',
    phrase: 'conciergerie',
    newSlug: 'conciergerie-airbnb-faire-appel-choisir',
    xrefId: 'conc-choisir' },

  // location-courte-duree-impots-france → reglementation-lcd-france-2026
  { file: 'blog/location-courte-duree-impots-france/index.html',
    phrase: 'loi',
    newSlug: 'reglementation-lcd-france-2026',
    xrefId: 'regl-2026' },

  // obtenir-avis-5-etoiles-airbnb → gerer-mauvais-avis
  { file: 'blog/obtenir-avis-5-etoiles-airbnb/index.html',
    phrase: 'mauvais avis',
    newSlug: 'gerer-mauvais-avis-airbnb-reponse-hote',
    xrefId: 'mauvais-avis' },

  // tarification-dynamique-lcd → tarification-dynamique-pricelabs comparatif
  { file: 'blog/tarification-dynamique-lcd/index.html',
    phrase: 'PriceLabs',
    newSlug: 'tarification-dynamique-pricelabs-wheelhouse-beyond-comparatif',
    xrefId: 'pl-wh-by' },

  // outils-gerer → tarification-dynamique-pricelabs comparatif
  { file: 'blog/outils-gerer-location-courte-duree-2025/index.html',
    phrase: 'tarification dynamique',
    newSlug: 'tarification-dynamique-pricelabs-wheelhouse-beyond-comparatif',
    xrefId: 'pl-wh-by-tools' },

  // livret-accueil-digital-hotes-lcd → livret-accueil-digital-creer (article récent)
  { file: 'blog/livret-accueil-digital-hotes-lcd/index.html',
    phrase: 'livret d\'accueil',
    newSlug: 'livret-accueil-digital-creer-location-courte-duree',
    xrefId: 'livret-creer' },

  // reservation-directe-sans-commission → premieres-reservations-directes
  { file: 'blog/reservation-directe-sans-commission/index.html',
    phrase: 'réservations directes',
    newSlug: 'premieres-reservations-directes-sans-audience-site-web',
    xrefId: 'prem-directes' },

  // reservation-directe-sans-commission → location-directe-pourquoi
  { file: 'blog/reservation-directe-sans-commission/index.html',
    phrase: 'plateformes',
    newSlug: 'location-directe-pourquoi-saffranchir-plateformes',
    xrefId: 'loc-directe-pq' },

  // airbnb-vs-booking-com → photographier-logement smartphone
  { file: 'blog/airbnb-vs-booking-com-location-courte-duree/index.html',
    phrase: 'photos',
    newSlug: 'photographier-logement-location-courte-duree-smartphone',
    xrefId: 'photos-smartphone' },

  // optimiser-annonce-airbnb → fixer-prix-minimum
  { file: 'blog/optimiser-annonce-airbnb/index.html',
    phrase: 'prix',
    newSlug: 'fixer-prix-minimum-airbnb-lcd',
    xrefId: 'prix-minimum' },

  // creer-conciergerie-airbnb-2025 → erreurs debutant
  { file: 'blog/creer-conciergerie-airbnb-2025/index.html',
    phrase: 'débutant',
    newSlug: 'erreurs-debutant-location-courte-duree-premier-logement',
    xrefId: 'erreurs-deb' },

  // messages-airbnb-automatiser → gabarits-messages-lcd-hotes-templates
  { file: 'blog/messages-airbnb-automatiser/index.html',
    phrase: 'gabarits',
    newSlug: 'gabarits-messages-lcd-hotes-templates',
    xrefId: 'gabarits' },

  // google-my-business-hotes-lcd → algorithme Airbnb 2026 (croissance visibilité)
  { file: 'blog/google-my-business-hotes-lcd/index.html',
    phrase: 'visibilité',
    newSlug: 'algorithme-airbnb-2026-criteres-classement',
    xrefId: 'algo-gmb' },

  // attirer-teletravailleur → wifi-location-courte-duree
  { file: 'blog/attirer-teletravailleur-nomade-digital-location-courte-duree/index.html',
    phrase: 'WiFi',
    newSlug: 'wifi-location-courte-duree-debit-equipement-avis',
    xrefId: 'wifi-tt' },

  // accueillir-famille-enfants → welcome-bag idées
  { file: 'blog/accueillir-famille-enfants-airbnb-equipement/index.html',
    phrase: 'accueil',
    newSlug: 'welcome-bag-lcd-12-idees-marquantes-budget',
    xrefId: 'welcome-fam' },

  // gerer-voyageurs-difficiles → verification voyageurs
  { file: 'blog/gerer-voyageurs-difficiles-location-courte-duree/index.html',
    phrase: 'vérifier',
    newSlug: 'verification-voyageurs-avant-accepter-reservation-lcd',
    xrefId: 'verif-vyg' },

  // declarer-activite → bail mobilite (différences)
  { file: 'blog/declarer-activite-location-courte-duree-france-demarches/index.html',
    phrase: 'bail',
    newSlug: 'bail-mobilite-vs-courte-duree-differences',
    xrefId: 'bail-mob' },

  // assurance-location-courte-duree → assurance-lcd 2026
  { file: 'blog/assurance-location-courte-duree-airbnb-couverture/index.html',
    phrase: 'garanties',
    newSlug: 'assurance-lcd-5-garanties-indispensables-2026',
    xrefId: 'ass-2026' },

  // accepter-animaux-lcd → banque-objets
  { file: 'blog/accepter-animaux-lcd-7-regles-pet-friendly/index.html',
    phrase: 'équipement',
    newSlug: 'banque-objets-utiles-laisser-voyageur-lcd',
    xrefId: 'banque-obj' },

  // basse-saison → workation (séjours longs)
  { file: 'blog/basse-saison-location-courte-duree-strategies-reservations/index.html',
    phrase: 'workation',
    newSlug: 'workation-lcd-logement-equiper-louer-cher-hors-saison',
    xrefId: 'workation-bs' },

  // amenager-logement-petit-budget → decorer-amenager-logement (formation)
  // ⚠ on évite les self-refs : amenager… pointerait vers lui-même → drop

  // ─── Sprint 3 : maillage vers les calculateurs publics ───────────────
  // Liens contextuels depuis les articles à forte intention 'prix' ou
  // 'revenus' vers les calculateurs gratuits correspondants. Phrases
  // simples (1 mot) qu'on sait être présentes dans les corps d'article.

  // fixer-prix-minimum-airbnb-lcd → calculateur de prix
  { file: 'blog/fixer-prix-minimum-airbnb-lcd/index.html',
    phrase: 'rentabilité',
    newSlug: '/calculateurs/prix-lcd',
    xrefId: 'calc-prix-min' },

  // tarification-dynamique-lcd → calculateur prix
  { file: 'blog/tarification-dynamique-lcd/index.html',
    phrase: 'saison',
    newSlug: '/calculateurs/prix-lcd',
    xrefId: 'calc-prix-dyn' },

  // tarification-dynamique-pricelabs-wheelhouse-beyond-comparatif → calc prix
  { file: 'blog/tarification-dynamique-pricelabs-wheelhouse-beyond-comparatif/index.html',
    phrase: 'recommandation',
    newSlug: '/calculateurs/prix-lcd',
    xrefId: 'calc-prix-comparatif' },

  // erreurs-debutant → estimateur revenus
  { file: 'blog/erreurs-debutant-location-courte-duree-premier-logement/index.html',
    phrase: 'revenu',
    newSlug: '/calculateurs/revenus-lcd',
    xrefId: 'calc-revenus-erreurs' },

  // reservation-directe-sans-commission → calc prix (déjà fait via 'commission')

  // location-courte-duree-impots-france → estimateur revenus
  { file: 'blog/location-courte-duree-impots-france/index.html',
    phrase: 'CA',
    newSlug: '/calculateurs/revenus-lcd',
    xrefId: 'calc-revenus-impots' },

  // creer-conciergerie-airbnb-2025 → estimateur revenus (pour ses prospects)
  { file: 'blog/creer-conciergerie-airbnb-2025/index.html',
    phrase: 'estimation',
    newSlug: '/calculateurs/revenus-lcd',
    xrefId: 'calc-revenus-conc' },

  // optimiser-annonce-airbnb → calc prix
  { file: 'blog/optimiser-annonce-airbnb/index.html',
    phrase: 'saison',
    newSlug: '/calculateurs/prix-lcd',
    xrefId: 'calc-prix-saison' },

  // basse-saison-strategies → calc prix
  { file: 'blog/basse-saison-location-courte-duree-strategies-reservations/index.html',
    phrase: 'tarif',
    newSlug: '/calculateurs/prix-lcd',
    xrefId: 'calc-prix-bs' },

  // location-directe-pourquoi-saffranchir-plateformes → calc prix direct (déjà fait via 'prix')

  // photographier-logement-smartphone → estimateur revenus (vérifier ROI avant invest photos)
  { file: 'blog/photographier-logement-location-courte-duree-smartphone/index.html',
    phrase: 'revenus',
    newSlug: '/calculateurs/revenus-lcd',
    xrefId: 'calc-revenus-photo' },
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

  // Si newSlug commence par '/' c'est déjà une URL absolue (vers /calculateurs/...
  // ou /services/...), sinon on préfixe /blog/ pour le comportement historique.
  const href = ins.newSlug.startsWith('/') ? ins.newSlug : `/blog/${ins.newSlug}`;
  const wrapped = `<a href="${href}" data-xref="${ins.xrefId}" style="color:var(--g);text-decoration:underline;text-decoration-color:rgba(0,76,63,.25);text-underline-offset:2px">${match[2]}</a>`;
  const newHtml = html.slice(0, match.index) + before + wrapped + match[3] + html.slice(match.index + match[0].length);
  fs.writeFileSync(p, newHtml);
  console.log(`  ✓ ${ins.file} : "${ins.phrase}" → ${href}`);
  totalInserted++;
}

console.log(`\n🎉 ${totalInserted} liens contextuels inline ajoutés.`);
