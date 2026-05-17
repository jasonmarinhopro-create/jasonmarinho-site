#!/usr/bin/env node
// Génère 7 articles SEO "Combien rapporte une LCD à [ville]" calqués sur
// le pilote /calculateurs/revenu-airbnb-paris/. Pattern uniforme, données
// ville-spécifiques (quartiers, événements, réglementation locale).
//
// Idempotent : ré-exécutable, écrase à chaque run. Source de vérité = ce
// fichier, jamais éditer le HTML généré à la main.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ─── Données par ville (sourcées) ───────────────────────────────────────
// Tous les chiffres alignés sur calculateurs/engine.js (benchmark central).
const CITIES = [
  {
    slug: 'revenu-lcd-lyon', urlSegment: 'revenu-lcd-lyon',
    ville: 'Lyon', pays: 'FR', flag: '🇫🇷',
    occ: 65, adr: 90, revpar: 21300,
    source: 'OnlyLyon Tourisme + CRT Auvergne-Rhône-Alpes 2024',
    saisonHaute: 'avr-juin, sep-nov',
    saisonDetails: [
      { period: 'Avril-juin', note: 'Festivals Quais du Polar, Nuits Sonores. Occupation 70-75 %, ADR +12 %.' },
      { period: 'Septembre-octobre', note: 'Congrès business + Festival Lumière. Occupation 75 %, ADR +15 %.' },
      { period: 'Novembre-décembre', note: 'Fête des Lumières (8-11 déc). Pic absolu : occupation 85 %, ADR +30 % sur 4 jours.' },
      { period: 'Juillet-août', note: 'Plus calme (lyonnais en vacances). Occupation 55-60 %, ADR -10 %.' },
    ],
    quartiers: [
      { nom: 'Vieux Lyon (5e)', adr: '110-140 €', occ: '72 %', note: 'UNESCO, touristes' },
      { nom: 'Presqu\'île (1er-2e)', adr: '100-130 €', occ: '70 %', note: 'Shopping, restaurants, gares' },
      { nom: 'Croix-Rousse (4e)', adr: '85-105 €', occ: '65 %', note: 'Bohème, vue, calme' },
      { nom: 'Confluence (2e)', adr: '95-115 €', occ: '62 %', note: 'Moderne, musée, business' },
      { nom: 'Part-Dieu (3e)', adr: '85-100 €', occ: '68 %', note: 'Gare TGV, voyageurs business' },
    ],
    legalNote: '120 jours par an pour une résidence principale meublée (loi ALUR). Lyon applique strictement la déclaration en mairie + numéro d\'enregistrement (depuis fin 2018). Pas de quota strict de changement d\'usage comme à Paris, mais procédure obligatoire pour louer plus de 120 jours.',
    annoncesEstim: '~40 000 annonces LCD actives toutes plateformes confondues',
    scenarios: { studio: 14400, t1: 17000, t2: 21300, t3: 24500, maison: 27700 },
  },

  {
    slug: 'revenu-lcd-bordeaux', urlSegment: 'revenu-lcd-bordeaux',
    ville: 'Bordeaux', pays: 'FR', flag: '🇫🇷',
    occ: 60, adr: 95, revpar: 20800,
    source: 'Office Tourisme Bordeaux Métropole + CRT Nouvelle-Aquitaine 2024',
    saisonHaute: 'mai-septembre',
    saisonDetails: [
      { period: 'Mai-juin', note: 'Bordeaux Fête le Vin (biennale, juin pair), Open de tennis. Occupation 72 %, ADR +18 %.' },
      { period: 'Juillet-août', note: 'Tourisme international + Arcachon proche. Occupation 75 %, ADR +12 %.' },
      { period: 'Septembre', note: 'Vendanges + Festival des Arcades. Occupation 70 %, ADR +10 %.' },
      { period: 'Janvier-février', note: 'Creux annuel. Occupation 45-50 %, ADR -20 %.' },
    ],
    quartiers: [
      { nom: 'Chartrons (1er-7e)', adr: '110-140 €', occ: '65 %', note: 'Antiquaires, bobo, calme' },
      { nom: 'Saint-Pierre / Centre', adr: '105-130 €', occ: '68 %', note: 'Cœur historique, miroir d\'eau' },
      { nom: 'Bassins à Flot', adr: '95-115 €', occ: '62 %', note: 'Moderne, MECA, Cité du Vin' },
      { nom: 'Bastide (rive droite)', adr: '85-100 €', occ: '58 %', note: 'Prix d\'achat plus bas' },
      { nom: 'Saint-Michel', adr: '85-105 €', occ: '60 %', note: 'Marché, ambiance villageoise' },
    ],
    legalNote: '120 jours résidence principale. Bordeaux applique la procédure de changement d\'usage avec compensation depuis 2017 dans le centre-ville (similaire à Paris en plus souple). Numéro d\'enregistrement obligatoire.',
    annoncesEstim: '~15 000 annonces LCD actives, fort impact des restrictions 2023-2024',
    scenarios: { studio: 14000, t1: 16600, t2: 20800, t3: 23900, maison: 27000 },
  },

  {
    slug: 'revenu-lcd-marseille', urlSegment: 'revenu-lcd-marseille',
    ville: 'Marseille', pays: 'FR', flag: '🇫🇷',
    occ: 62, adr: 95, revpar: 21500,
    source: 'Office Tourisme Marseille + CRT PACA 2024',
    saisonHaute: 'juin-septembre',
    saisonDetails: [
      { period: 'Juin', note: 'Festival d\'art lyrique d\'Aix proche. Occupation 70 %, ADR +15 %.' },
      { period: 'Juillet-août', note: 'Pic absolu : tourisme international + calanques. Occupation 80 %, ADR +20 %.' },
      { period: 'Septembre', note: 'Septembre indien + JoyaParade. Occupation 70 %, ADR +10 %.' },
      { period: 'Janvier-mars', note: 'Creux. Occupation 45-50 %, ADR -15 %.' },
    ],
    quartiers: [
      { nom: 'Vieux-Port / Le Panier', adr: '100-130 €', occ: '72 %', note: 'Touristes, vue mer' },
      { nom: 'Notre-Dame du Mont (6e)', adr: '90-110 €', occ: '65 %', note: 'Bobo, restaurants' },
      { nom: 'Joliette / Euromed', adr: '85-105 €', occ: '60 %', note: 'Business + croisières' },
      { nom: 'Endoume / Bompard (7e)', adr: '100-130 €', occ: '68 %', note: 'Calanques proches, premium' },
      { nom: 'Castellane / Préfecture', adr: '85-100 €', occ: '60 %', note: 'Central, accessible' },
    ],
    legalNote: '120 jours résidence principale. Marseille n\'a pas (encore) de procédure de changement d\'usage stricte comme Paris/Bordeaux, mais l\'enregistrement en mairie est obligatoire depuis 2019. Quotas envisagés en 2026.',
    annoncesEstim: '~30 000 annonces LCD actives toutes plateformes',
    scenarios: { studio: 14500, t1: 17200, t2: 21500, t3: 24700, maison: 28000 },
  },

  {
    slug: 'revenu-lcd-nice', urlSegment: 'revenu-lcd-nice',
    ville: 'Nice', pays: 'FR', flag: '🇫🇷',
    occ: 64, adr: 110, revpar: 25700,
    source: 'Office Tourisme Métropolitain Nice Côte d\'Azur + CRT Côte d\'Azur 2024',
    saisonHaute: 'mai-septembre',
    saisonDetails: [
      { period: 'Février', note: 'Carnaval (2 semaines). Pic local : occupation 80 %, ADR +25 %.' },
      { period: 'Mai', note: 'Festival de Cannes proche + Monaco GP. Occupation 75 %, ADR +30 %.' },
      { period: 'Juillet-août', note: 'Pic absolu Côte d\'Azur. Occupation 85 %, ADR +25 %, locations premium 250-400 €/nuit.' },
      { period: 'Novembre-mars', note: 'Hors saison. Occupation 50 %, ADR -25 %.' },
    ],
    quartiers: [
      { nom: 'Vieux Nice', adr: '130-170 €', occ: '75 %', note: 'Touristes, marché aux fleurs' },
      { nom: 'Promenade des Anglais', adr: '150-220 €', occ: '72 %', note: 'Vue mer, premium' },
      { nom: 'Cimiez', adr: '110-140 €', occ: '60 %', note: 'Résidentiel chic, musées' },
      { nom: 'Riquier / Port', adr: '100-125 €', occ: '65 %', note: 'Authentique, restaurants' },
      { nom: 'Carré d\'Or', adr: '130-170 €', occ: '70 %', note: 'Shopping luxe, centre' },
    ],
    legalNote: '120 jours résidence principale. Nice applique strictement le contrôle (équipe dédiée mairie). Numéro d\'enregistrement obligatoire. Changement d\'usage obligatoire au-delà.',
    annoncesEstim: '~25 000 annonces LCD actives, marché premium dominant',
    scenarios: { studio: 17000, t1: 20000, t2: 25700, t3: 29500, maison: 33500 },
  },

  {
    slug: 'revenu-lcd-lisbonne', urlSegment: 'revenu-lcd-lisbonne',
    ville: 'Lisboa', pays: 'PT', flag: '🇵🇹',
    occ: 72, adr: 115, revpar: 30200,
    source: 'Turismo de Portugal (RNAL) + INE Anuário das Estatísticas do Turismo 2024',
    saisonHaute: 'avril-octobre (saison étendue)',
    saisonDetails: [
      { period: 'Avril-mai', note: 'Printemps idéal + congrès. Occupation 78 %, ADR +12 %.' },
      { period: 'Juin-août', note: 'Pic touristique. Occupation 85 %, ADR +18 %. Festas de Lisboa en juin.' },
      { period: 'Septembre-octobre', note: 'Web Summit (nov), été indien. Occupation 80 %, ADR +15 %.' },
      { period: 'Décembre-février', note: 'Calme. Occupation 60 %, ADR -10 %. Mais bonne nouvelle : températures douces, séjours longs digital nomades.' },
    ],
    quartiers: [
      { nom: 'Alfama', adr: '120-160 €', occ: '78 %', note: 'Quartier historique, touristes #1' },
      { nom: 'Bairro Alto / Chiado', adr: '130-170 €', occ: '76 %', note: 'Vie nocturne, restaurants' },
      { nom: 'Príncipe Real', adr: '125-160 €', occ: '72 %', note: 'Chic, design, jardins' },
      { nom: 'Belém', adr: '100-130 €', occ: '70 %', note: 'Monuments, plus calme' },
      { nom: 'Mouraria / Graça', adr: '95-115 €', occ: '70 %', note: 'Authentique, prix plus bas' },
    ],
    legalNote: 'Inscription obligatoire au RNAL (Registo Nacional do Alojamento Local) avant toute location. Régime fiscal : Categoria B simplifié (coef. 0.35) jusqu\'à 200 000 € de CA, IVA 6 % au-delà de 15 000 € (continental). Moratoire sur les nouvelles licences AL à Lisboa depuis 2018 dans plusieurs freguesias (paroisses) — vérifier la disponibilité avant achat.',
    annoncesEstim: '~25 000 AL actifs à Lisboa (RNAL)',
    scenarios: { studio: 20400, t1: 24000, t2: 30200, t3: 34700, maison: 39300 },
  },

  {
    slug: 'revenu-lcd-barcelona', urlSegment: 'revenu-lcd-barcelona',
    ville: 'Barcelona', pays: 'ES', flag: '🇪🇸',
    occ: 72, adr: 120, revpar: 31500,
    source: 'Turisme Barcelona + INE Encuesta de Ocupación Apartamentos Turísticos 2024',
    saisonHaute: 'avril-octobre',
    saisonDetails: [
      { period: 'Février-mars', note: 'Mobile World Congress (fév). Pic absolu : occupation 95 %, ADR ×2,5 sur 4 jours.' },
      { period: 'Avril-juin', note: 'Sant Jordi, Sónar (juin). Occupation 80 %, ADR +20 %.' },
      { period: 'Juillet-août', note: 'Tourisme international + plage. Occupation 85 %, ADR +25 %.' },
      { period: 'Septembre-octobre', note: 'Smart City Expo (nov), Festes de la Mercè (sept). Occupation 80 %, ADR +15 %.' },
    ],
    quartiers: [
      { nom: 'Eixample', adr: '130-170 €', occ: '78 %', note: 'Modernisme, central, premium' },
      { nom: 'Barrio Gótico', adr: '125-165 €', occ: '80 %', note: 'Touristes #1, animation' },
      { nom: 'El Born', adr: '130-160 €', occ: '76 %', note: 'Bobo chic, design' },
      { nom: 'Gràcia', adr: '105-130 €', occ: '72 %', note: 'Authentique, prix plus doux' },
      { nom: 'Barceloneta', adr: '120-150 €', occ: '82 %', note: 'Plage, ultra-demandé été' },
    ],
    legalNote: '⚠️ Licence HUTB obligatoire (Habitatge d\'Ús Turístic de Barcelona). Moratoire total sur les nouvelles licences depuis 2017. Le marché AL est en numerus clausus : il faut acheter un bien AVEC sa licence existante (prime de 30-80 k€ sur le prix). Plan municipal 2024 : suppression de toutes les licences AL prévue d\'ici 2028. Anticipe le risque réglementaire.',
    annoncesEstim: '~20 000 HUTB actifs (numerus clausus)',
    scenarios: { studio: 21300, t1: 25100, t2: 31500, t3: 36200, maison: 41000 },
  },

  {
    slug: 'revenu-lcd-bruxelles', urlSegment: 'revenu-lcd-bruxelles',
    ville: 'Bruxelles', pays: 'BE', flag: '🇧🇪',
    occ: 62, adr: 95, revpar: 21500,
    source: 'Visit Brussels + Statbel 2024',
    saisonHaute: 'avril-octobre + décembre',
    saisonDetails: [
      { period: 'Avril-juin', note: 'Floralies, sommets UE, congrès. Occupation 70 %, ADR +15 %.' },
      { period: 'Juillet-août', note: 'Bruxelles Summer Festival, Plaisirs d\'Été. Occupation 68 %, ADR +10 %.' },
      { period: 'Septembre-octobre', note: 'Reprise business, congrès. Occupation 72 %, ADR +12 %.' },
      { period: 'Décembre', note: 'Marché de Noël (3 semaines). Pic : occupation 78 %, ADR +20 %.' },
    ],
    quartiers: [
      { nom: 'Centre / Grand-Place', adr: '110-140 €', occ: '72 %', note: 'Touristes, animation' },
      { nom: 'Sablon', adr: '120-150 €', occ: '68 %', note: 'Antiquaires, chic' },
      { nom: 'Ixelles / Etterbeek', adr: '100-125 €', occ: '65 %', note: 'EU, business, jeunes' },
      { nom: 'Saint-Gilles', adr: '90-115 €', occ: '62 %', note: 'Multi-culturel, art déco' },
      { nom: 'Schaerbeek', adr: '80-100 €', occ: '58 %', note: 'Prix plus abordables' },
    ],
    legalNote: 'Enregistrement obligatoire auprès de Visit Brussels (depuis 2014). 3 régimes fiscaux différents selon les régions (Bruxelles/Flandres/Wallonie). Taxe de séjour communale Bruxelles : ~4,24 € par unité/nuit. TVA réduite 6 % sur l\'hébergement touristique si applicable.',
    annoncesEstim: '~10 000 annonces LCD actives à Bruxelles',
    scenarios: { studio: 14400, t1: 17000, t2: 21500, t3: 24700, maison: 28000 },
  },

  // ─── Sprint 7 : 7 villes supplémentaires ────────────────────────────
  {
    slug: 'revenu-lcd-madrid', urlSegment: 'revenu-lcd-madrid',
    ville: 'Madrid', pays: 'ES', flag: '🇪🇸',
    occ: 68, adr: 110, revpar: 27300,
    source: 'INE Encuesta de Ocupación Apartamentos Turísticos + Turismo Madrid 2024',
    saisonHaute: 'mars-mai, septembre-novembre',
    saisonDetails: [
      { period: 'Mars-mai', note: 'Printemps idéal, ARCO (foire d\'art), Madrid Fashion Week. Occupation 78 %, ADR +18 %.' },
      { period: 'Septembre-novembre', note: 'Reprise business + automne doux. Occupation 80 %, ADR +20 %.' },
      { period: 'Juillet-août', note: 'Chaleur intense, Madrilènes en vacances. Occupation 55 %, ADR -15 %. Cible workation et air conditionné.' },
      { period: 'Décembre', note: 'Pic Noël + Reyes (3-5 janvier). Occupation 75 %, ADR +15 %.' },
    ],
    quartiers: [
      { nom: 'Centro / Sol', adr: '120-150 €', occ: '78 %', note: 'Touristes, animation continue' },
      { nom: 'Malasaña / Chueca', adr: '110-140 €', occ: '74 %', note: 'Vie nocturne, bobo, design' },
      { nom: 'Salamanca', adr: '130-180 €', occ: '70 %', note: 'Luxe, shopping, ambassades' },
      { nom: 'La Latina', adr: '105-135 €', occ: '72 %', note: 'Tapas, jeune, dimanche brunch' },
      { nom: 'Chamberí', adr: '100-130 €', occ: '68 %', note: 'Résidentiel chic, abordable' },
    ],
    legalNote: 'Enregistrement obligatoire (Vivienda de Uso Turístico). À Madrid, la mairie applique un plafond strict de jours/an dans le centro depuis le Plan Especial 2019. Régime fiscal : Estimación objetiva (módulos) ou directa selon volume. IVA 10 % si services hôteliers.',
    annoncesEstim: '~18 000 annonces LCD actives à Madrid',
    scenarios: { studio: 18400, t1: 21700, t2: 27300, t3: 31400, maison: 35500 },
  },

  {
    slug: 'revenu-lcd-rome', urlSegment: 'revenu-lcd-rome',
    ville: 'Roma', pays: 'IT', flag: '🇮🇹',
    occ: 70, adr: 120, revpar: 30600,
    source: 'ENIT + Roma Capitale Turismo 2024',
    saisonHaute: 'mars-juin, septembre-novembre',
    saisonDetails: [
      { period: 'Mars-mai', note: 'Printemps romain, Pâques (pèlerinages). Occupation 80 %, ADR +20 %.' },
      { period: 'Juin', note: 'Pré-été doux. Occupation 78 %, ADR +18 %.' },
      { period: 'Septembre-octobre', note: 'Reprise + Festival du Cinéma. Occupation 80 %, ADR +20 %.' },
      { period: 'Juillet-août', note: 'Chaleur intense. Occupation 65 %, ADR -5 %. Cible workation climatisée.' },
    ],
    quartiers: [
      { nom: 'Centro Storico (Pantheon)', adr: '140-180 €', occ: '80 %', note: 'Cœur touristique #1' },
      { nom: 'Trastevere', adr: '120-160 €', occ: '78 %', note: 'Bohème, restaurants' },
      { nom: 'Monti / Esquilino', adr: '110-140 €', occ: '74 %', note: 'Boutiques, jeune' },
      { nom: 'Prati (Vatican)', adr: '115-145 €', occ: '76 %', note: 'Calme, près Vatican' },
      { nom: 'Testaccio', adr: '100-125 €', occ: '70 %', note: 'Authentique, marchés' },
    ],
    legalNote: '⚠️ CIN (Codice Identificativo Nazionale) obligatoire depuis 2024 — sans CIN, pas de droit de louer. Roma Capitale applique aussi un code régional Lazio + imposta di soggiorno (4 à 7 €/personne/nuit selon catégorie). Cedolare secca 21 % pour <30 jours.',
    annoncesEstim: '~30 000 annonces CAV actives à Roma',
    scenarios: { studio: 20600, t1: 24300, t2: 30600, t3: 35200, maison: 39800 },
  },

  {
    slug: 'revenu-lcd-firenze', urlSegment: 'revenu-lcd-firenze',
    ville: 'Firenze', pays: 'IT', flag: '🇮🇹',
    occ: 72, adr: 140, revpar: 36800,
    source: 'Toscana Promozione Turistica + ENIT 2024',
    saisonHaute: 'avril-juin, septembre-octobre',
    saisonDetails: [
      { period: 'Avril-juin', note: 'Pic touristique. Occupation 82 %, ADR +22 %.' },
      { period: 'Septembre-octobre', note: 'Vendanges Chianti + automne. Occupation 80 %, ADR +20 %.' },
      { period: 'Juillet-août', note: 'Chaleur, Firenze se vide. Occupation 65 %, ADR -5 %.' },
      { period: 'Décembre-février', note: 'Calme. Occupation 58 %, ADR -15 %. Marché de Noël en Piazza Santa Croce booste fin déc.' },
    ],
    quartiers: [
      { nom: 'Centro Storico (Duomo)', adr: '160-220 €', occ: '82 %', note: 'UNESCO, touristes #1' },
      { nom: 'Oltrarno', adr: '140-180 €', occ: '76 %', note: 'Artisans, Piazza Pitti' },
      { nom: 'San Frediano', adr: '120-150 €', occ: '72 %', note: 'Bobo, jeunes, vie nocturne' },
      { nom: 'Santa Croce', adr: '140-180 €', occ: '78 %', note: 'Centre, restaurants' },
      { nom: 'Campo di Marte', adr: '110-135 €', occ: '65 %', note: 'Résidentiel, stadio' },
    ],
    legalNote: 'CIN obligatoire (national). Firenze applique en plus des règles régionales strictes (Regione Toscana). Imposta di soggiorno élevée : ~5 €/personne/nuit. Pas de moratoire pour l\'instant mais débat actif sur les limitations.',
    annoncesEstim: '~14 000 annonces CAV actives à Firenze',
    scenarios: { studio: 24800, t1: 29300, t2: 36800, t3: 42300, maison: 47800 },
  },

  {
    slug: 'revenu-lcd-funchal', urlSegment: 'revenu-lcd-funchal',
    ville: 'Funchal', pays: 'PT', flag: '🇵🇹',
    occ: 75, adr: 105, revpar: 28800,
    source: 'Turismo da Madeira + INE 2024',
    saisonHaute: 'mars-octobre (saison très étendue)',
    saisonDetails: [
      { period: 'Mars-mai', note: 'Festa da Flor (avril), printemps idéal. Occupation 80 %, ADR +15 %.' },
      { period: 'Juin-août', note: 'Tourisme international fort. Occupation 85 %, ADR +18 %.' },
      { period: 'Septembre-octobre', note: 'Été indien, Madeira Wine Festival. Occupation 82 %, ADR +15 %.' },
      { period: 'Décembre-janvier', note: 'Marché de Noël et feux d\'artifice mondialement connus. Pic : occupation 88 %, ADR +25 %.' },
    ],
    quartiers: [
      { nom: 'Centro / Sé', adr: '110-140 €', occ: '78 %', note: 'Touristes, vieille ville' },
      { nom: 'Lido', adr: '115-145 €', occ: '78 %', note: 'Hôtels, piscines naturelles' },
      { nom: 'Funchal Old Town', adr: '105-130 €', occ: '76 %', note: 'Restaurants, animation' },
      { nom: 'São Martinho', adr: '95-120 €', occ: '72 %', note: 'Résidentiel, mer' },
      { nom: 'Monte (téléphérique)', adr: '95-115 €', occ: '70 %', note: 'Vue panoramique, calme' },
    ],
    legalNote: 'Inscription RNAL obligatoire (Turismo de Portugal). Régime fiscal national PT : Categoria B simplifié (coef. 0.35) jusqu\'à 200 000 €. IVA réduit à 5 % en Madère (vs 6 % continental). Pas de moratoire AL à Funchal contrairement à Lisboa/Porto.',
    annoncesEstim: '~7 000 AL actifs à Funchal',
    scenarios: { studio: 19400, t1: 22900, t2: 28800, t3: 33100, maison: 37400 },
  },

  {
    slug: 'revenu-lcd-annecy', urlSegment: 'revenu-lcd-annecy',
    ville: 'Annecy', pays: 'FR', flag: '🇫🇷',
    occ: 70, adr: 130, revpar: 33200,
    source: 'Office Tourisme Annecy + CRT Auvergne-Rhône-Alpes 2024',
    saisonHaute: 'juin-août + décembre-février',
    saisonDetails: [
      { period: 'Juin-août', note: 'Pic absolu : lac, randonnées, Festival du Cinéma d\'Animation. Occupation 88 %, ADR +30 %.' },
      { period: 'Décembre-février', note: 'Ski (stations à 30 min), Carnaval Vénitien. Occupation 80 %, ADR +25 %.' },
      { period: 'Mars-mai', note: 'Saison neutre. Occupation 60 %, ADR ±0.' },
      { period: 'Septembre-novembre', note: 'Mi-saison, Salon du livre. Occupation 65 %, ADR +5 %.' },
    ],
    quartiers: [
      { nom: 'Vieille Ville', adr: '160-220 €', occ: '85 %', note: 'Touristes, lac proche, premium' },
      { nom: 'Bord du Lac (Paquier)', adr: '180-260 €', occ: '82 %', note: 'Vue lac, top du marché' },
      { nom: 'Centre / Gare', adr: '130-170 €', occ: '75 %', note: 'Accessible, business' },
      { nom: 'Annecy-le-Vieux', adr: '120-160 €', occ: '70 %', note: 'Résidentiel, proche lac' },
      { nom: 'Cran-Gevrier', adr: '105-135 €', occ: '65 %', note: 'Plus abordable, calme' },
    ],
    legalNote: '120 jours résidence principale (loi ALUR). Annecy applique un contrôle strict + enregistrement obligatoire. Le lac et la station alpine génèrent une double saisonnalité unique en France. Taxe de séjour élevée (jusqu\'à 4 €/nuit/personne en haute saison).',
    annoncesEstim: '~6 000 annonces LCD actives à Annecy + agglo',
    scenarios: { studio: 22300, t1: 26300, t2: 33200, t3: 38200, maison: 43200 },
  },

  {
    slug: 'revenu-lcd-amsterdam', urlSegment: 'revenu-lcd-amsterdam',
    ville: 'Amsterdam', pays: 'NL', flag: '🇳🇱',
    occ: 72, adr: 145, revpar: 38100,
    source: 'NBTC Holland Marketing + CBS Statistics Netherlands 2024',
    saisonHaute: 'avril-octobre + décembre',
    saisonDetails: [
      { period: 'Avril-juin', note: 'Pic tulipes (Keukenhof), King\'s Day (avril). Occupation 82 %, ADR +25 %.' },
      { period: 'Juillet-août', note: 'Tourisme international. Occupation 85 %, ADR +30 %.' },
      { period: 'Septembre-octobre', note: 'Mi-saison agréable. Occupation 76 %, ADR +15 %.' },
      { period: 'Décembre', note: 'Marchés de Noël et illuminations (Light Festival). Occupation 78 %, ADR +20 %.' },
    ],
    quartiers: [
      { nom: 'Canal Ring (Jordaan, Centrum)', adr: '160-220 €', occ: '85 %', note: 'UNESCO, touristes #1' },
      { nom: 'De Pijp', adr: '140-180 €', occ: '78 %', note: 'Bobo, marché Albert Cuyp' },
      { nom: 'Oud-West', adr: '135-170 €', occ: '76 %', note: 'Vondelpark, jeune' },
      { nom: 'Oost', adr: '120-150 €', occ: '72 %', note: 'Émergent, prix plus doux' },
      { nom: 'Noord', adr: '115-140 €', occ: '68 %', note: 'Industriel reconverti, art' },
    ],
    legalNote: '⚠️ Restriction TRÈS stricte : maximum 30 nuits par an pour un particulier louant sa résidence principale (depuis 2019). Au-delà : licence professionnelle (Hotelvergunning) obligatoire et très contrôlée. Plan municipal de limiter encore davantage les locations courtes pour 2026. Ce marché est plus accessible aux exploitants pros qu\'aux particuliers.',
    annoncesEstim: '~15 000 listings dont ~3 000 avec licence pro',
    scenarios: { studio: 25700, t1: 30300, t2: 38100, t3: 43800, maison: 49500 },
  },

  // ─── Sprint 8 : 7 villes supplémentaires ────────────────────────────
  {
    slug: 'revenu-lcd-wien', urlSegment: 'revenu-lcd-wien',
    ville: 'Wien', pays: 'AT', flag: '🇦🇹',
    occ: 68, adr: 95, revpar: 23600,
    source: 'WienTourismus + Statistik Austria 2024',
    saisonHaute: 'avril-octobre + décembre',
    saisonDetails: [
      { period: 'Avril-juin', note: 'Vienna City Marathon, Donauinselfest, congrès. Occupation 74 %, ADR +15 %.' },
      { period: 'Juillet-août', note: 'Tourisme international, Wiener Festwochen. Occupation 78 %, ADR +18 %.' },
      { period: 'Septembre-octobre', note: 'Rentrée business, ViennaArtWeek. Occupation 75 %, ADR +15 %.' },
      { period: 'Décembre', note: 'Marchés de Noël viennois (les plus célèbres au monde). Pic : occupation 82 %, ADR +25 %.' },
    ],
    quartiers: [
      { nom: 'Innere Stadt (1er)', adr: '120-160 €', occ: '80 %', note: 'UNESCO, touristes #1, opéra' },
      { nom: 'Neubau (7e)', adr: '100-130 €', occ: '72 %', note: 'Bobo, MQ, design' },
      { nom: 'Mariahilf (6e)', adr: '95-120 €', occ: '70 %', note: 'Shopping, Naschmarkt' },
      { nom: 'Leopoldstadt (2e)', adr: '90-115 €', occ: '68 %', note: 'Prater, jeune, prix doux' },
      { nom: 'Wieden / Karlsplatz', adr: '100-130 €', occ: '72 %', note: 'Central, musées' },
    ],
    legalNote: 'Inscription obligatoire (Ortstaxe, Wien-Tourismusgesetz). Taxe de séjour ~3,02 % du prix net. Régime fiscal Autriche : impôt revenu progressif + USt (TVA) 10 % si applicable. Pas de plafond de jours strict comme Paris, mais déclaration obligatoire.',
    annoncesEstim: '~12 000 annonces LCD actives à Wien',
    scenarios: { studio: 15900, t1: 18800, t2: 23600, t3: 27200, maison: 30700 },
  },

  {
    slug: 'revenu-lcd-munich', urlSegment: 'revenu-lcd-munich',
    ville: 'München', pays: 'DE', flag: '🇩🇪',
    occ: 70, adr: 120, revpar: 30700,
    source: 'München Tourismus + DZT (Deutsche Zentrale für Tourismus) 2024',
    saisonHaute: 'avril-octobre + décembre + Oktoberfest',
    saisonDetails: [
      { period: 'Avril-août', note: 'Tourisme régulier + Tollwood Festival. Occupation 72 %, ADR +12 %.' },
      { period: 'Mi-septembre à début octobre', note: '🍺 Oktoberfest : pic absolu mondial. Occupation 95 %, ADR ×2-3 sur 2 semaines.' },
      { period: 'Novembre', note: 'Calme. Occupation 60 %, ADR -10 %.' },
      { period: 'Décembre', note: 'Christkindlmarkt + sports d\'hiver (Alpes proches). Occupation 75 %, ADR +18 %.' },
    ],
    quartiers: [
      { nom: 'Altstadt-Lehel', adr: '140-180 €', occ: '78 %', note: 'Centre historique, premium' },
      { nom: 'Schwabing-West', adr: '120-150 €', occ: '72 %', note: 'Étudiants, bobo, parc' },
      { nom: 'Maxvorstadt', adr: '120-150 €', occ: '70 %', note: 'Musées, universités' },
      { nom: 'Haidhausen', adr: '110-140 €', occ: '68 %', note: 'Bavarois authentique' },
      { nom: 'Au-Haidhausen (Oktoberfest)', adr: '130-160 €', occ: '78 %', note: 'Proche Theresienwiese' },
    ],
    legalNote: '⚠️ Comme Berlin : Zweckentfremdungsverbot (interdiction de transformer un logement résidentiel en LCD sans permis). Maximum 8 semaines/an pour résidence principale sans permis. Genehmigung très difficile à obtenir. Amendes jusqu\'à 500 000 €. Régime fiscal Allemagne : barème impôt revenu + USt 7 %.',
    annoncesEstim: '~10 000 listings à München (en chute depuis 2018)',
    scenarios: { studio: 20600, t1: 24400, t2: 30700, t3: 35300, maison: 39900 },
  },

  {
    slug: 'revenu-lcd-porto', urlSegment: 'revenu-lcd-porto',
    ville: 'Porto', pays: 'PT', flag: '🇵🇹',
    occ: 70, adr: 95, revpar: 24300,
    source: 'Turismo de Portugal RNAL + INE 2024',
    saisonHaute: 'avril-octobre (saison étendue)',
    saisonDetails: [
      { period: 'Avril-mai', note: 'Printemps + Festival de cinéma Fantasporto. Occupation 75 %, ADR +12 %.' },
      { period: 'Juin-août', note: 'Pic touristique + São João (24 juin). Occupation 82 %, ADR +18 %.' },
      { period: 'Septembre-octobre', note: 'Vendanges Douro, croisières fluviales. Occupation 78 %, ADR +15 %.' },
      { period: 'Décembre-février', note: 'Calme. Occupation 60 %, ADR -10 %. Marché de Noël ajoute un pic mi-déc.' },
    ],
    quartiers: [
      { nom: 'Ribeira', adr: '110-150 €', occ: '80 %', note: 'UNESCO, vue Douro, #1' },
      { nom: 'Cedofeita / Aliados', adr: '95-125 €', occ: '74 %', note: 'Centre, design, jeune' },
      { nom: 'Foz do Douro', adr: '110-145 €', occ: '70 %', note: 'Bord de mer, chic' },
      { nom: 'Vila Nova de Gaia', adr: '95-125 €', occ: '76 %', note: 'Caves de porto, autre rive' },
      { nom: 'Bonfim', adr: '80-105 €', occ: '70 %', note: 'Authentique, prix doux' },
    ],
    legalNote: 'RNAL obligatoire avant location. Moratoire AL strict dans le centre historique (freguesias União das Freguesias do Centro Histórico, Vitória, Miragaia, São Nicolau, Sé) depuis 2018 — aucune nouvelle licence délivrée. Pour acheter en LCD à Porto, vise les bordures ou achète un bien AVEC licence existante. Catégoria B coef. 0.35.',
    annoncesEstim: '~12 000 AL actifs à Porto',
    scenarios: { studio: 16400, t1: 19300, t2: 24300, t3: 27900, maison: 31600 },
  },

  {
    slug: 'revenu-lcd-sevilla', urlSegment: 'revenu-lcd-sevilla',
    ville: 'Sevilla', pays: 'ES', flag: '🇪🇸',
    occ: 62, adr: 85, revpar: 19200,
    source: 'Turismo Andalucía + Ayuntamiento de Sevilla 2024',
    saisonHaute: 'mars-mai + octobre-décembre',
    saisonDetails: [
      { period: 'Mars-avril', note: 'Semaine Sainte (Semana Santa) + Feria de Abril. Pic absolu : occupation 95 %, ADR ×2.' },
      { period: 'Mai', note: 'Printemps doux, festivals. Occupation 78 %, ADR +20 %.' },
      { period: 'Juillet-août', note: 'Chaleur extrême (45°C). Occupation 50 %, ADR -25 %. Cible air conditionné + piscine.' },
      { period: 'Octobre-décembre', note: 'Reprise + Bienal de Flamenco. Occupation 70 %, ADR +10 %.' },
    ],
    quartiers: [
      { nom: 'Santa Cruz', adr: '100-130 €', occ: '78 %', note: 'Touristes, charme, Alcázar' },
      { nom: 'Triana', adr: '85-110 €', occ: '72 %', note: 'Authentique, flamenco' },
      { nom: 'Alameda / Macarena', adr: '80-100 €', occ: '68 %', note: 'Jeune, bobo' },
      { nom: 'El Arenal', adr: '90-115 €', occ: '74 %', note: 'Plaza de toros, central' },
      { nom: 'Nervión', adr: '75-95 €', occ: '62 %', note: 'Business, prix doux' },
    ],
    legalNote: 'Vivienda de Uso Turístico (VUT) obligatoire à enregistrer auprès du Registro de Turismo de Andalucía. Sevilla applique des restrictions sur le centre historique depuis 2024. Régime fiscal : Estimación objetiva ou directa. IVA 10 % si services hôteliers.',
    annoncesEstim: '~10 000 VUT actifs à Sevilla',
    scenarios: { studio: 13000, t1: 15300, t2: 19200, t3: 22100, maison: 25000 },
  },

  {
    slug: 'revenu-lcd-valencia', urlSegment: 'revenu-lcd-valencia',
    ville: 'Valencia', pays: 'ES', flag: '🇪🇸',
    occ: 60, adr: 80, revpar: 17500,
    source: 'GVA Turisme Comunitat Valenciana + Visit Valencia 2024',
    saisonHaute: 'mars-octobre',
    saisonDetails: [
      { period: 'Mars', note: 'Las Fallas (15-19 mars). Pic absolu : occupation 90 %, ADR ×2 sur 1 semaine.' },
      { period: 'Avril-juin', note: 'Printemps doux + plage. Occupation 72 %, ADR +15 %.' },
      { period: 'Juillet-août', note: 'Tourisme balnéaire. Occupation 78 %, ADR +20 %.' },
      { period: 'Septembre-octobre', note: 'Climat parfait, congrès. Occupation 70 %, ADR +12 %.' },
    ],
    quartiers: [
      { nom: 'Ciutat Vella (Centre)', adr: '90-115 €', occ: '75 %', note: 'Touristes, monuments' },
      { nom: 'Ruzafa', adr: '80-100 €', occ: '72 %', note: 'Hipster, bars, marché' },
      { nom: 'Cabanyal (plage)', adr: '85-110 €', occ: '76 %', note: 'Plage, authentique' },
      { nom: 'Eixample', adr: '85-105 €', occ: '68 %', note: 'Bourgeois, calme' },
      { nom: 'El Carmen', adr: '90-115 €', occ: '74 %', note: 'Bohème, vie nocturne' },
    ],
    legalNote: 'Vivienda Turística (VT) à enregistrer auprès de Turisme Comunitat Valenciana. Valencia applique un nouveau plan urbanistique 2024 limitant les locations dans Ciutat Vella. Régime fiscal espagnol classique. Note : Valencia est la 1ère ville UE à imposer une taxe touristique régionale spécifique (depuis 2024, 0,50 à 2 €/nuit).',
    annoncesEstim: '~12 000 VT actifs à Valencia',
    scenarios: { studio: 11800, t1: 13900, t2: 17500, t3: 20100, maison: 22800 },
  },

  {
    slug: 'revenu-lcd-strasbourg', urlSegment: 'revenu-lcd-strasbourg',
    ville: 'Strasbourg', pays: 'FR', flag: '🇫🇷',
    occ: 58, adr: 85, revpar: 18000,
    source: 'Office Tourisme Strasbourg + CRT Grand Est 2024',
    saisonHaute: 'juin-août + novembre-décembre',
    saisonDetails: [
      { period: 'Juin-août', note: 'Tourisme régulier. Occupation 68 %, ADR +12 %.' },
      { period: 'Novembre', note: 'Pré-Noël, congrès UE. Occupation 65 %, ADR +10 %.' },
      { period: 'Fin novembre - 24 décembre', note: '🎄 Marché de Noël (Christkindelsmärik, le plus ancien d\'Europe, 1570). Pic : occupation 92 %, ADR ×2,5 sur 5 semaines.' },
      { period: 'Janvier-mars', note: 'Creux. Occupation 45 %, ADR -20 %.' },
    ],
    quartiers: [
      { nom: 'Petite France', adr: '110-150 €', occ: '78 %', note: 'UNESCO, touristes' },
      { nom: 'Centre / Cathédrale', adr: '100-130 €', occ: '72 %', note: 'Marchés, animation' },
      { nom: 'Krutenau', adr: '85-110 €', occ: '65 %', note: 'Bohème, universitaire' },
      { nom: 'Neudorf', adr: '75-95 €', occ: '58 %', note: 'Résidentiel, prix doux' },
      { nom: 'Robertsau (proche UE)', adr: '85-105 €', occ: '60 %', note: 'Business, Parlement EU' },
    ],
    legalNote: '120 jours résidence principale (loi ALUR). Strasbourg applique strictement depuis 2019, enregistrement obligatoire. Spécificité : pic Noël concentre 30-40 % du CA annuel sur 5 semaines, anticipe les prix début septembre.',
    annoncesEstim: '~8 000 annonces LCD actives à Strasbourg',
    scenarios: { studio: 12100, t1: 14300, t2: 18000, t3: 20700, maison: 23400 },
  },

  {
    slug: 'revenu-lcd-honfleur', urlSegment: 'revenu-lcd-honfleur',
    ville: 'Honfleur', pays: 'FR', flag: '🇫🇷',
    occ: 58, adr: 120, revpar: 25400,
    source: 'Office Tourisme Honfleur + CRT Normandie 2024',
    saisonHaute: 'avril-septembre',
    saisonDetails: [
      { period: 'Avril-juin', note: 'Printemps doux, weekends parisiens. Occupation 65 %, ADR +15 %.' },
      { period: 'Juillet-août', note: 'Pic touristique. Occupation 78 %, ADR +25 %.' },
      { period: 'Septembre', note: 'Mi-saison agréable, congrès. Occupation 68 %, ADR +15 %.' },
      { period: 'Décembre', note: 'Marché de Noël (week-ends). Occupation 62 %, ADR +10 %.' },
    ],
    quartiers: [
      { nom: 'Vieux Bassin', adr: '150-220 €', occ: '70 %', note: 'Cœur historique, vue port' },
      { nom: 'Sainte-Catherine', adr: '130-180 €', occ: '68 %', note: 'Église bois, touristes' },
      { nom: 'Plateau de Grâce', adr: '110-140 €', occ: '62 %', note: 'Calme, vues' },
      { nom: 'Côte de Grâce', adr: '120-160 €', occ: '60 %', note: 'Résidentiel chic' },
      { nom: 'Périphérie (Equemauville)', adr: '95-120 €', occ: '55 %', note: 'Prix plus abordables' },
    ],
    legalNote: '120 jours résidence principale (loi ALUR). Honfleur a un parc important de résidences secondaires (>40 %). Procédure stricte de changement d\'usage si tu loues plus de 120 jours sans résider. Taxe de séjour ~3 €/nuit/personne en saison.',
    annoncesEstim: '~3 500 annonces LCD actives à Honfleur',
    scenarios: { studio: 17100, t1: 20200, t2: 25400, t3: 29200, maison: 33000 },
  },

  {
    slug: 'revenu-lcd-berlin', urlSegment: 'revenu-lcd-berlin',
    ville: 'Berlin', pays: 'DE', flag: '🇩🇪',
    occ: 65, adr: 95, revpar: 22500,
    source: 'visitBerlin + DZT (Deutsche Zentrale für Tourismus) 2024',
    saisonHaute: 'avril-septembre + décembre',
    saisonDetails: [
      { period: 'Avril-juin', note: 'Berlinale (février), Karneval der Kulturen (mai). Occupation 70 %, ADR +12 %.' },
      { period: 'Juillet-août', note: 'Pic touristique. Occupation 78 %, ADR +18 %.' },
      { period: 'Septembre', note: 'Berlin Marathon, vibrante rentrée. Occupation 72 %, ADR +15 %.' },
      { period: 'Décembre', note: 'Marchés de Noël (les plus nombreux d\'Europe). Occupation 68 %, ADR +12 %.' },
    ],
    quartiers: [
      { nom: 'Mitte', adr: '110-140 €', occ: '75 %', note: 'Touristes, monuments' },
      { nom: 'Kreuzberg', adr: '95-120 €', occ: '70 %', note: 'Multi-culturel, jeune, vie nocturne' },
      { nom: 'Prenzlauer Berg', adr: '105-135 €', occ: '68 %', note: 'Bobo, familles, café' },
      { nom: 'Friedrichshain', adr: '90-115 €', occ: '65 %', note: 'Techno, alternatif' },
      { nom: 'Charlottenburg', adr: '100-130 €', occ: '60 %', note: 'Bourgeois, shopping Ku\'damm' },
    ],
    legalNote: '⚠️ Zweckentfremdungsverbot : interdiction de transformer un logement en location courte durée sans permis. Le permis (Genehmigung) est extrêmement difficile à obtenir à Berlin. Maximum 90 nuits par an pour résidence secondaire sans permis. Amendes jusqu\'à 500 000 €. Régime fiscal Allemagne : barème impôt revenu + USt (TVA) 7 % si applicable.',
    annoncesEstim: '~20 000 listings actifs à Berlin (en chute libre depuis le permis 2018)',
    scenarios: { studio: 15100, t1: 17900, t2: 22500, t3: 25900, maison: 29300 },
  },
]

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function buildHtml (city) {
  const canonicalUrl = `https://jasonmarinho.com/calculateurs/${city.slug}`
  const title = `Combien rapporte une location courte durée à ${city.ville} en 2026 ? Calcul gratuit | Jason Marinho`
  const description = `Estime gratuitement les revenus d'une location courte durée (Airbnb, Booking, en direct) à ${city.ville} en 2026. Données ${city.source.split(' + ')[0]} : ${city.occ} % d'occupation, ${city.adr} €/nuit. Calculateur préfilé par type de bien.`

  const scenariosHtml = [
    { name: 'Studio (15-25 m²)', value: city.scenarios.studio, adr: Math.round(city.adr * 0.75) },
    { name: 'T1 (1 chambre)', value: city.scenarios.t1, adr: Math.round(city.adr * 0.85) },
    { name: 'T2 (2 pièces)', value: city.scenarios.t2, adr: city.adr, highlight: true },
    { name: 'T3 (3 pièces)', value: city.scenarios.t3, adr: Math.round(city.adr * 1.15) },
    { name: 'Maison/loft', value: city.scenarios.maison, adr: Math.round(city.adr * 1.30) },
  ].map(s => `
    <div class="scenario-card${s.highlight ? '' : ''}"${s.highlight ? ' style="border-color:var(--g);background:linear-gradient(135deg,#fff 0%,rgba(0,76,63,.04) 100%)"' : ''}>
      <div class="name">${s.name}${s.highlight ? ' <span style="font-size:10px;background:var(--y);color:var(--gd);padding:2px 6px;border-radius:8px;font-weight:700;vertical-align:middle">le plus courant</span>' : ''}</div>
      <div class="revenue">${s.value.toLocaleString('fr-FR')} €/an</div>
      <div class="meta">±20 % · ADR ~${s.adr} €</div>
    </div>
  `).join('')

  const saisonHtml = city.saisonDetails.map(p => `
    <li><strong>${p.period} :</strong> ${p.note}</li>
  `).join('')

  const quartiersHtml = city.quartiers.map(q => `
    <li><strong>${q.nom} :</strong> ADR ${q.adr}, occupation ${q.occ}. ${q.note}.</li>
  `).join('')

  // Préfill URL params (passés au calculateur)
  const calcPrefillUrl = `/calculateurs/revenus-lcd?pays=${city.pays}&ville=${encodeURIComponent(city.ville)}`
  const priceCalcUrl = `/calculateurs/prix-lcd?pays=${city.pays}&ville=${encodeURIComponent(city.ville)}`

  const faqQuestions = [
    {
      q: `Combien rapporte une location courte durée à ${city.ville} en moyenne ?`,
      a: `En moyenne marché 2024 (${city.source}) : ${city.occ} % d'occupation à ${city.adr} € la nuit, tous canaux confondus (Airbnb, Booking, Vrbo, en direct), soit environ ${city.revpar.toLocaleString('fr-FR')} € de RevPAR annuel. Un studio rapporte ~${city.scenarios.studio.toLocaleString('fr-FR')} €/an, un T2 ~${city.scenarios.t2.toLocaleString('fr-FR')} €, un T3 ~${city.scenarios.t3.toLocaleString('fr-FR')} €. Ces chiffres supposent un bien bien équipé et bien positionné.`,
    },
    {
      q: `Quels sont les quartiers les plus rentables à ${city.ville} ?`,
      a: `Les quartiers premium à ${city.ville} : ${city.quartiers.slice(0, 3).map(q => `${q.nom} (ADR ${q.adr})`).join(', ')}. Pour un meilleur rapport prix d'achat / revenus, regarde aussi les quartiers émergents listés dans l'article.`,
    },
    {
      q: `Faut-il être déclaré pour louer en LCD à ${city.ville} ?`,
      a: `Oui, dès la première nuit. ${city.legalNote.split('.')[0]}. Consulte les simulateurs fiscaux Jason Marinho pour estimer ton imposition exacte.`,
    },
  ]
  const faqSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqQuestions.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  })
  const articleSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Combien rapporte une location courte durée à ${city.ville} en 2026 ? Calcul gratuit + chiffres marché`,
    description,
    datePublished: '2026-05-17',
    dateModified: '2026-05-17',
    author: { '@type': 'Person', name: 'Jason Marinho', url: 'https://jasonmarinho.com' },
    publisher: { '@type': 'Organization', name: 'Jason Marinho', logo: { '@type': 'ImageObject', url: 'https://jasonmarinho.com/logo.webp' } },
    image: 'https://jasonmarinho.com/couverture-jason.webp',
    mainEntityOfPage: canonicalUrl,
  })
  const bcSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://jasonmarinho.com/' },
      { '@type': 'ListItem', position: 2, name: 'Calculateurs', item: 'https://jasonmarinho.com/calculateurs' },
      { '@type': 'ListItem', position: 3, name: `Revenu LCD ${city.ville}`, item: canonicalUrl },
    ],
  })

  const faqHtml = faqQuestions.map(f => `
  <details class="faq-item">
    <summary>${f.q}</summary>
    <p>${f.a}</p>
  </details>`).join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:title" content="Combien rapporte une location courte durée à ${city.ville} en 2026 ?">
  <meta property="og:description" content="Calculateur gratuit + chiffres marché 2024 (${city.source.split(' + ')[0]}). Tous canaux : Airbnb, Booking, direct.">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="https://jasonmarinho.com/couverture-jason.webp">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Jason Marinho">
  <meta name="robots" content="index, follow">
  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600&family=Outfit:wght@300;400;500;600&display=swap" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600&family=Outfit:wght@300;400;500;600&display=swap"></noscript>
  <link rel="stylesheet" href="/fonts/phosphor-regular-subset.css">
  <link rel="stylesheet" href="/fonts/phosphor-bold-subset.css">
  <style>
    :root{--g:#004C3F;--gd:#003329;--y:#FFD56B;--yd:#FFC845;--cr:#F7F5F0;--w:#FDFCF9;--td:#0F1A0D;--tm:#3D5038;--tl:#7A8C77;--bd:rgba(0,76,63,0.10);--ok:#34D399}
    *{box-sizing:border-box}
    body{margin:0;padding-top:64px;font-family:'Outfit',sans-serif;background:var(--w);color:var(--td);line-height:1.7}
    .h1{font-family:'Fraunces',serif;font-size:clamp(2rem,4vw,3rem);line-height:1.15;letter-spacing:-.02em;margin:0 0 18px;font-weight:400;color:#fff}
    .h2{font-family:'Fraunces',serif;font-size:clamp(1.5rem,2.6vw,2.1rem);line-height:1.2;margin:0 0 14px;font-weight:400;color:var(--td);letter-spacing:-.015em}
    .h3{font-family:'Fraunces',serif;font-size:clamp(1.2rem,1.8vw,1.4rem);font-weight:500;margin:24px 0 10px;color:var(--td)}
    .lbl{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--g);margin-bottom:12px}
    .lbl.lt{color:rgba(255,255,255,.7)}
    .breadcrumb{font-size:12.5px;color:var(--tl);margin-bottom:14px;display:flex;gap:8px;flex-wrap:wrap}
    .breadcrumb a{color:var(--g);text-decoration:none;font-weight:500}
    .breadcrumb.lt a,.breadcrumb.lt{color:rgba(255,255,255,.7)}

    .hero{background:linear-gradient(160deg,#001a11 0%,var(--gd) 55%,#00463a 100%);color:#fff;padding:clamp(48px,7vw,80px) clamp(16px,5vw,60px) clamp(40px,6vw,72px);position:relative;overflow:hidden}
    .hero::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 60% 70% at 78% 50%,rgba(255,213,107,.06),transparent 70%);pointer-events:none}
    .hero::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 50% 60% at 20% 100%,rgba(0,76,63,.5),transparent 70%);pointer-events:none}
    .hero-in,.hero > *{position:relative;z-index:1}
    .hero-in{max-width:920px;margin:0 auto}
    .hero p.sub{font-size:clamp(1rem,1.4vw,1.15rem);font-weight:300;color:rgba(255,255,255,.85);max-width:740px;margin:0;line-height:1.65}

    .stats-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;max-width:920px;margin:0 auto;padding:0 16px 0;position:relative;z-index:2}
    @media(max-width:680px){.stats-strip{grid-template-columns:repeat(2,1fr)}}
    .stat-card{background:#fff;border:1px solid var(--bd);border-radius:14px;padding:18px 20px;box-shadow:0 8px 24px rgba(0,76,63,.06)}
    .stat-card .sc-label{font-size:10.5px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--tl);margin-bottom:6px}
    .stat-card .sc-value{font-family:'Fraunces',serif;font-size:26px;font-weight:400;color:var(--g);letter-spacing:-.01em}
    .stat-card .sc-sub{font-size:11.5px;color:var(--tm);margin-top:2px;font-weight:300}

    .section{padding:clamp(40px,6vw,72px) clamp(16px,5vw,60px);max-width:920px;margin:0 auto}
    .section p{font-size:15.5px;font-weight:300;color:var(--tm);line-height:1.75;margin:0 0 14px}
    .section ul{padding-left:24px;font-size:15px;font-weight:300;color:var(--tm);line-height:1.8;margin:0 0 14px}
    .section ul li{margin-bottom:6px}
    .section strong{font-weight:600;color:var(--td)}
    .section a{color:var(--g);font-weight:500}
    .section.cr{background:var(--cr);max-width:none}
    .section.cr .in{max-width:920px;margin:0 auto}

    .scenarios-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin:18px 0 22px}
    .scenario-card{background:#fff;border:1px solid var(--bd);border-radius:12px;padding:18px 20px;text-align:center}
    .scenario-card .name{font-family:'Fraunces',serif;font-size:16px;font-weight:500;color:var(--td);margin-bottom:8px}
    .scenario-card .revenue{font-family:'Fraunces',serif;font-size:24px;font-weight:400;color:var(--g);letter-spacing:-.01em}
    .scenario-card .meta{font-size:11.5px;color:var(--tl);margin-top:6px;font-weight:300}

    .source-box{background:#fff;border-left:3px solid var(--y);padding:14px 18px;border-radius:8px;font-size:13.5px;color:var(--tm);line-height:1.7;margin:18px 0}
    .source-box strong{color:var(--g)}

    .cta-embed{background:linear-gradient(135deg,var(--g) 0%,var(--gd) 100%);color:#fff;border-radius:18px;padding:28px 32px;margin:24px 0;text-align:center}
    .cta-embed h3{color:#fff;font-family:'Fraunces',serif;font-size:22px;font-weight:400;margin:0 0 8px}
    .cta-embed p{color:rgba(255,255,255,.85);font-size:14px;font-weight:300;margin:0 0 18px}
    .btn-p{display:inline-flex;align-items:center;gap:8px;background:var(--y);color:var(--gd);font-weight:600;font-size:14px;padding:13px 24px;border-radius:10px;text-decoration:none;border:none;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .2s cubic-bezier(.4,0,.2,1)}
    .btn-p:hover{background:var(--yd);transform:translateY(-2px);box-shadow:0 12px 28px rgba(255,213,107,.32)}

    .faq-item{background:#fff;border:1px solid var(--bd);border-radius:12px;padding:16px 22px;margin-bottom:10px}
    .faq-item summary{font-family:'Fraunces',serif;font-size:16px;font-weight:400;color:var(--td);cursor:pointer;list-style:none;position:relative;padding-right:24px}
    .faq-item summary::-webkit-details-marker{display:none}
    .faq-item summary::after{content:'+';position:absolute;right:0;top:50%;transform:translateY(-50%);font-size:22px;color:var(--g);font-weight:300}
    .faq-item[open] summary::after{content:'−'}
    .faq-item p{margin:12px 0 0;font-size:14px;color:var(--tm);line-height:1.7;font-weight:300}

    .related-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-top:22px}
    .related-row a{background:#fff;border:1px solid var(--bd);border-radius:12px;padding:16px 18px;text-decoration:none;color:inherit;transition:transform .2s,border-color .2s}
    .related-row a:hover{transform:translateY(-2px);border-color:var(--g)}
    .related-row .rt{font-family:'Fraunces',serif;font-size:15px;color:var(--td);font-weight:500;margin-bottom:4px}
    .related-row .rs{font-size:12.5px;color:var(--tl);font-weight:300}
    /* ─── Design refresh 2026 : accent vert + gradients subtils ─────── */
    body{background:linear-gradient(180deg,#fff 0%,var(--cr) 100%)}
    .scenario-card,.stat-card,.faq-item,.related-row a{border-top:2px solid transparent;transition:border-color .25s,box-shadow .3s,transform .25s}
    .scenario-card:hover,.stat-card:hover,.faq-item:hover,.related-row a:hover{border-top-color:var(--g)}
    .btn-p{background:linear-gradient(135deg,var(--y) 0%,#FFE08A 50%,var(--y) 100%);background-size:200% 100%;transition:background-position .35s,transform .2s,box-shadow .2s}
    .btn-p:hover{background-position:100% 0}
    .lbl{position:relative;padding-left:18px}
    .lbl::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:10px;height:2px;background:currentColor;border-radius:2px;opacity:.65}
  </style>
  <script type="application/ld+json">${articleSchema}</script>
  <script type="application/ld+json" data-schema-bc>${bcSchema}</script>
  <script type="application/ld+json">${faqSchema}</script>
  <script defer src="/nav.js"></script>
</head>
<body>
<header class="hero">
  <div class="hero-in">
    <div class="breadcrumb lt">
      <a href="/">Accueil</a> /
      <a href="/calculateurs">Calculateurs</a> /
      <span>Revenu LCD ${city.ville}</span>
    </div>
    <div class="lbl lt"><i class="ph ph-chart-line-up"></i> Calculateur gratuit ${city.flag} ${city.ville}</div>
    <h1 class="h1">Combien rapporte une <em style="color:var(--y)">location courte durée</em> à ${city.ville} en 2026 ?</h1>
    <p class="sub">Calcul gratuit, sans inscription, basé sur les chiffres marché 2024 (${city.source}). Tous canaux confondus : Airbnb, Booking, Vrbo, en direct. Estimation par type de bien et fourchette ±20 %.</p>
  </div>
</header>

<div style="max-width:920px;margin:-26px auto 28px;padding:0 16px;position:relative;z-index:5">
  <a href="https://app.jasonmarinho.com/dashboard/simulateurs" style="display:flex;align-items:center;gap:14px;padding:16px 20px;background:#fff;border:1px solid rgba(255,213,107,.50);border-radius:16px;box-shadow:0 14px 40px rgba(0,76,63,.12),0 2px 6px rgba(0,0,0,.04);text-decoration:none;color:inherit;transition:transform .2s,box-shadow .2s">
    <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--y) 0%,var(--yd) 100%);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--gd);font-size:18px"><i class="ph-bold ph-house"></i></div>
    <div style="flex:1">
      <div style="font-family:'Fraunces',serif;font-size:15px;color:var(--td);font-weight:500;line-height:1.3">💡 Tu loues déjà à ${city.ville} ?</div>
      <div style="font-size:12.5px;color:var(--tm);font-weight:300;margin-top:2px;line-height:1.4">Dans ton espace membre, l&apos;estimateur compare <strong style="color:var(--g);font-weight:600">ton ADR et ton occupation réels</strong> à ces chiffres marché. Compte gratuit.</div>
    </div>
    <div style="font-size:13px;font-weight:600;color:var(--g);white-space:nowrap;flex-shrink:0">Ouvrir →</div>
  </a>
</div>

<div class="stats-strip">
  <div class="stat-card">
    <div class="sc-label">Occupation moyenne</div>
    <div class="sc-value">${city.occ} %</div>
    <div class="sc-sub">soit ~${Math.round(365 * city.occ / 100)} nuits/an</div>
  </div>
  <div class="stat-card">
    <div class="sc-label">Prix moyen / nuit (ADR)</div>
    <div class="sc-value">${city.adr} €</div>
    <div class="sc-sub">médian LCD ${city.ville}</div>
  </div>
  <div class="stat-card">
    <div class="sc-label">RevPAR annuel</div>
    <div class="sc-value">~${city.revpar.toLocaleString('fr-FR')} €</div>
    <div class="sc-sub">par bien moyen</div>
  </div>
  <div class="stat-card">
    <div class="sc-label">Haute saison</div>
    <div class="sc-value" style="font-size:18px">${city.saisonHaute}</div>
    <div class="sc-sub">saison locale</div>
  </div>
</div>

<section class="section">
  <h2 class="h2">Les revenus moyens par type de bien à ${city.ville}</h2>
  <p>
    Voici les estimations indicatives pour ${city.ville} en 2026, calculées à partir des données 2024 (${city.source}).
    Ces chiffres reflètent un bien <strong>correctement équipé, classé, avec photos pro et 50+ avis</strong>. Un bien moins bien positionné peut être 30 à 40 % en dessous.
  </p>

  <div class="scenarios-grid">${scenariosHtml}</div>

  <div class="source-box">
    <strong>📊 Source méthodologie :</strong> ${city.source}. Agrégation et mise à jour annuelle dès publication des rapports T1 N+1.
  </div>

  <h3 class="h3">Affine ton estimation avec le calculateur</h3>
  <p>Le calculateur ci-dessous prend en compte ton type de bien, le nombre de chambres et ton mode d'exploitation pour te donner une estimation personnalisée.</p>

  <div class="cta-embed">
    <h3>Calcule ton revenu exact pour ton bien à ${city.ville}</h3>
    <p>Préfilé sur ${city.ville}. Modifie le type de bien et le mode d'exploitation pour ta situation.</p>
    <a href="${calcPrefillUrl}" class="btn-p">Lancer le calculateur <i class="ph-bold ph-arrow-right"></i></a>
  </div>
</section>

<section class="section cr">
  <div class="in">
    <h2 class="h2">Le marché LCD à ${city.ville} en détail</h2>

    <h3 class="h3">Saisonnalité : les vrais pics</h3>
    <p>${city.ville} n'a pas une seule haute saison, mais <strong>plusieurs pics</strong> :</p>
    <ul>${saisonHtml}</ul>

    <h3 class="h3">Quartiers : où ça rapporte le plus</h3>
    <ul>${quartiersHtml}</ul>

    <h3 class="h3">Cadre légal et réglementation</h3>
    <p>${city.legalNote}</p>

    <h3 class="h3">Concurrence et positionnement</h3>
    <p>${city.annoncesEstim}. La compétition est forte. Pour sortir du lot :</p>
    <ul>
      <li>Photos professionnelles (différentiel +20 % de clics)</li>
      <li>Classement / certification du bien (abattement fiscal favorable selon pays)</li>
      <li>Pricing dynamique (gain 15-25 % de RevPAR vs prix fixe)</li>
      <li>Réservations en direct (gagner 15-20 % sur les commissions OTAs)</li>
    </ul>
  </div>
</section>

<section class="section">
  <h2 class="h2">Questions fréquentes</h2>
${faqHtml}
</section>

<section class="section cr">
  <div class="in">
    <h2 class="h2">Outils complémentaires</h2>
    <p>Plus loin que la simple estimation de revenus :</p>
    <div class="related-row">
      <a href="${priceCalcUrl}">
        <div class="rt">Calculateur de prix à ${city.ville}</div>
        <div class="rs">Combien afficher par nuit selon le mois et le canal</div>
      </a>
      <a href="${calcPrefillUrl}">
        <div class="rt">Estimateur personnalisé</div>
        <div class="rs">Ajuste avec ton type de bien et ton mode d'exploitation</div>
      </a>
      <a href="/calculateurs/comparer-villes">
        <div class="rt">Comparer ${city.ville} avec d'autres villes</div>
        <div class="rs">Mets ${city.ville} face à 3 autres villes en 1 clic</div>
      </a>
      <a href="/services/simulateurs">
        <div class="rt">Simulateurs fiscaux</div>
        <div class="rs">Impôts, statut, rentabilité d'investissement</div>
      </a>
    </div>
  </div>
</section>

<section style="background:var(--g);color:#fff;padding:clamp(50px,7vw,90px) clamp(16px,5vw,60px);text-align:center">
  <h2 class="h2" style="color:#fff">Tu loues déjà à ${city.ville} ? <em style="color:var(--y)">Va plus loin</em></h2>
  <p style="color:rgba(255,255,255,.85);font-size:15px;font-weight:300;max-width:520px;margin:0 auto 22px">
    Avec un compte gratuit, suis ton calendrier, tes revenus réels, ton occupation. Compare ta vraie activité au marché ${city.ville.toLowerCase()} en un coup d'œil.
  </p>
  <a href="https://app.jasonmarinho.com/auth/register" class="btn-p">Créer mon compte gratuit <i class="ph-bold ph-arrow-right"></i></a>
</section>

<script src="/footer.js"></script>
</body>
</html>
`
}

// ─── Génération ───────────────────────────────────────────────────────────
let count = 0
for (const city of CITIES) {
  const dir = path.join(ROOT, 'calculateurs', city.urlSegment)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const html = buildHtml(city)
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8')
  console.log(`  ✓ ${city.urlSegment}/index.html (${city.ville} ${city.flag})`)
  count++
}

console.log(`\n🎉 ${count} articles SEO ville générés dans /calculateurs/`)
console.log('   Sitemap à mettre à jour ensuite.\n')
