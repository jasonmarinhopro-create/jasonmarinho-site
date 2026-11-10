#!/usr/bin/env node
// Génère 7 articles SEO "Combien rapporte une LCD à [ville]" calqués sur
// le pilote /services/simulateurs/revenus-lcd/paris/. Pattern uniforme, données
// ville-spécifiques (quartiers, événements, réglementation locale).
//
// Idempotent : ré-exécutable, écrase à chaque run. Source de vérité = ce
// fichier, jamais éditer le HTML généré à la main.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { buildRevenuVille } from './lib/revenu-ville-html.mjs'
import { villesRegistre } from './lib/registre-geo.mjs'
import { aPhoto } from './data/photos-villes.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ─── Données par ville (sourcées) ───────────────────────────────────────
// Tous les chiffres alignés sur services/simulateurs/engine.js (benchmark central).
export const CITIES = [
  {
    slug: 'revenu-lcd-paris', urlSegment: 'revenu-lcd-paris',
    ville: 'Paris', pays: 'FR', flag: '',
    source: 'CRT Île-de-France 2024',
    saisonDetails: [
      { period: 'Mai-juin', note: 'Printemps et congrès : la demande monte, les prix aussi.' },
      { period: 'Juillet-août', note: 'Tourisme international, une demande soutenue tout l\'été.' },
      { period: 'Septembre', note: 'Fashion Week et rentrée des affaires : souvent le pic de l\'année.' },
      { period: 'Décembre', note: 'Fêtes de fin d\'année, une belle demande avant les vacances.' },
      { period: 'Janvier-février', note: 'Le creux de l\'année : prix plus doux, séjours plus longs.' },
    ],
    quartiers: [
      { nom: 'Marais (3e, 4e)', adr: '160-180 €', occ: '75 %', note: 'Le plus demandé, touristes du monde entier' },
      { nom: 'Saint-Germain-des-Prés (6e)', adr: '170-200 €', occ: '70 %', note: 'Très demandé, clientèle haut de gamme' },
      { nom: 'Champs-Élysées (8e)', adr: '150-220 €', occ: '68 %', note: 'Voyageurs d\'affaires' },
      { nom: 'Montmartre (18e)', adr: '130-160 €', occ: '72 %', note: 'Vue et charme, très touristique' },
      { nom: 'Bastille (11e)', adr: '110-140 €', occ: '70 %', note: 'Vie nocturne, clientèle jeune' },
      { nom: '12e, 13e, 19e, 20e', adr: '90-110 €', occ: '65 %', note: 'Bon rapport entre prix d\'achat et demande' },
    ],
    legalNote: '120 nuits par an au plus pour une résidence principale meublée. Pour une résidence secondaire ou au-delà de 120 nuits, il faut un changement d\'usage, soumis à compensation à Paris (transformer un local commercial en logement), ce qui coûte très cher. Numéro d\'enregistrement obligatoire sur chaque annonce. À 120 nuits, le revenu d\'une résidence principale est donc plafonné bien en dessous des chiffres ci-dessus.',
  },

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
    legalNote: 'Inscription obligatoire au RNAL (Registo Nacional do Alojamento Local) avant toute location. Régime fiscal : Categoria B simplifié (coef. 0.35) jusqu\'à 200 000 € de CA, IVA 6 % au-delà de 15 000 € (continental). Moratoire sur les nouvelles licences AL à Lisboa depuis 2018 dans plusieurs freguesias (paroisses) : vérifier la disponibilité avant achat.',
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
    legalNote: 'Licence HUTB obligatoire (Habitatge d\'Ús Turístic de Barcelona). Moratoire total sur les nouvelles licences depuis 2017. Le marché AL est en numerus clausus : il faut acheter un bien AVEC sa licence existante (prime de 30-80 k€ sur le prix). Plan municipal 2024 : suppression de toutes les licences AL prévue d\'ici 2028. Anticipe le risque réglementaire.',
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
    legalNote: 'CIN (Codice Identificativo Nazionale) obligatoire depuis 2024 : sans CIN, pas de droit de louer. Roma Capitale applique aussi un code régional Lazio + imposta di soggiorno (4 à 7 €/personne/nuit selon catégorie). Cedolare secca 21 % pour <30 jours.',
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
    legalNote: 'Restriction TRÈS stricte : maximum 30 nuits par an pour un particulier louant sa résidence principale (depuis 2019). Au-delà : licence professionnelle (Hotelvergunning) obligatoire et très contrôlée. Plan municipal de limiter encore davantage les locations courtes pour 2026. Ce marché est plus accessible aux exploitants pros qu\'aux particuliers.',
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
      { period: 'Mi-septembre à début octobre', note: 'Oktoberfest : pic absolu mondial. Occupation 95 %, ADR ×2-3 sur 2 semaines.' },
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
    legalNote: 'Comme Berlin : Zweckentfremdungsverbot (interdiction de transformer un logement résidentiel en LCD sans permis). Maximum 8 semaines/an pour résidence principale sans permis. Genehmigung très difficile à obtenir. Amendes jusqu\'à 500 000 €. Régime fiscal Allemagne : barème impôt revenu + USt 7 %.',
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
    legalNote: 'RNAL obligatoire avant location. Moratoire AL strict dans le centre historique (freguesias União das Freguesias do Centro Histórico, Vitória, Miragaia, São Nicolau, Sé) depuis 2018 : aucune nouvelle licence délivrée. Pour acheter en LCD à Porto, vise les bordures ou achète un bien AVEC licence existante. Catégoria B coef. 0.35.',
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
      { period: 'Fin novembre - 24 décembre', note: 'Marché de Noël (Christkindelsmärik, le plus ancien d\'Europe, 1570). Pic : occupation 92 %, ADR ×2,5 sur 5 semaines.' },
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
    legalNote: 'Zweckentfremdungsverbot : interdiction de transformer un logement en location courte durée sans permis. Le permis (Genehmigung) est extrêmement difficile à obtenir à Berlin. Maximum 90 nuits par an pour résidence secondaire sans permis. Amendes jusqu\'à 500 000 €. Régime fiscal Allemagne : barème impôt revenu + USt (TVA) 7 % si applicable.',
    annoncesEstim: '~20 000 listings actifs à Berlin (en chute libre depuis le permis 2018)',
    scenarios: { studio: 15100, t1: 17900, t2: 22500, t3: 25900, maison: 29300 },
  },

  // ─── Vague 2 : 18 villes touristiques FR (mai 2026) ────────────────────

  {
    slug: 'revenu-lcd-saint-tropez', urlSegment: 'revenu-lcd-saint-tropez',
    ville: 'Saint-Tropez', pays: 'FR', flag: '🇫🇷',
    occ: 55, adr: 280, revpar: 56200,
    source: 'Office Tourisme Saint-Tropez + CRT Côte d\'Azur 2024',
    saisonHaute: 'mai-septembre (concentré sur 4 mois)',
    saisonDetails: [
      { period: 'Mai-juin', note: 'Festival de Cannes + Régates des Voiliers d\'Époque. Occupation 70 %, ADR ×1,3.' },
      { period: 'Juillet-août', note: 'Pic absolu : tourisme international ultra-premium, jet-set. Occupation 85 %, ADR ×2 (500-1500 €/nuit pour villas).' },
      { period: 'Septembre', note: 'Voiles de Saint-Tropez (fin sept-début oct). Occupation 70 %, ADR +20 %.' },
      { period: 'Novembre-mars', note: 'Quasi mort. Occupation 25-30 %, beaucoup d\'établissements ferment.' },
    ],
    quartiers: [
      { nom: 'Centre-ville / Vieux Port', adr: '300-500 €', occ: '75 %', note: 'Ultra-premium, vue port' },
      { nom: 'Pampelonne (plages)', adr: '350-600 €', occ: '70 %', note: 'Plages mythiques, villas' },
      { nom: 'Les Salins', adr: '220-350 €', occ: '60 %', note: 'Plus calme, accès plage' },
      { nom: 'Gassin / Ramatuelle (proches)', adr: '180-280 €', occ: '55 %', note: 'Authentique, vue mer' },
      { nom: 'La Ponche', adr: '280-420 €', occ: '70 %', note: 'Pittoresque, restaurants étoilés' },
    ],
    legalNote: '120 jours résidence principale. Saint-Tropez applique strictement l\'enregistrement (la commune a mis en place une équipe de contrôle dédiée). Numéro de déclaration obligatoire. Taxe de séjour très élevée (5 €/personne/nuit en palace).',
    annoncesEstim: '~3 500 annonces LCD actives, marché ultra-saisonnier et premium',
    scenarios: { studio: 37700, t1: 44400, t2: 56200, t3: 64600, maison: 73100 },
  },

  {
    slug: 'revenu-lcd-cassis', urlSegment: 'revenu-lcd-cassis',
    ville: 'Cassis', pays: 'FR', flag: '🇫🇷',
    occ: 60, adr: 145, revpar: 31800,
    source: 'Office Tourisme Cassis + CRT PACA 2024',
    saisonHaute: 'avril-octobre',
    saisonDetails: [
      { period: 'Avril-juin', note: 'Saison calanques + escalade. Occupation 70 %, ADR +18 %.' },
      { period: 'Juillet-août', note: 'Pic absolu : tourisme international + Parc des Calanques. Occupation 85 %, ADR +30 %.' },
      { period: 'Septembre-octobre', note: 'Vendanges Cassis AOC + arrière-saison. Occupation 70 %, ADR +12 %.' },
      { period: 'Décembre-mars', note: 'Creux. Occupation 35-45 %, ADR -20 %.' },
    ],
    quartiers: [
      { nom: 'Port de Cassis', adr: '160-220 €', occ: '75 %', note: 'Vue port, restaurants, central' },
      { nom: 'Plage de Bestouan', adr: '150-200 €', occ: '70 %', note: 'Plage accessible à pied, calme' },
      { nom: 'Cap Canaille', adr: '180-260 €', occ: '65 %', note: 'Vue mer + falaises, premium' },
      { nom: 'Centre-village / Arène', adr: '130-180 €', occ: '68 %', note: 'Pittoresque, marché' },
      { nom: 'La Couronne', adr: '120-160 €', occ: '60 %', note: 'Résidentiel, accès calanques' },
    ],
    legalNote: '120 jours résidence principale. Cassis exige la déclaration en mairie + numéro d\'enregistrement (commune touristique strict). Taxe de séjour majorée pour les meublés non classés (jusqu\'à 5 % du tarif/nuit).',
    annoncesEstim: '~1 200 annonces LCD actives, ultra-saisonnier estival',
    scenarios: { studio: 21300, t1: 25100, t2: 31800, t3: 36600, maison: 41300 },
  },

  {
    slug: 'revenu-lcd-carcassonne', urlSegment: 'revenu-lcd-carcassonne',
    ville: 'Carcassonne', pays: 'FR', flag: '🇫🇷',
    occ: 58, adr: 78, revpar: 16500,
    source: 'Office Tourisme Carcassonne Agglo + CRT Occitanie 2024',
    saisonHaute: 'mai-septembre',
    saisonDetails: [
      { period: 'Avril-juin', note: 'Tourisme culturel UNESCO + printemps. Occupation 65 %, ADR +15 %.' },
      { period: 'Juillet', note: 'Festival de Carcassonne (concerts dans la Cité). Pic absolu : occupation 80 %, ADR +25 %.' },
      { period: 'Août', note: 'Tourisme international. Occupation 75 %, ADR +20 %. Embrasement de la Cité le 14 juillet (référence).' },
      { period: 'Novembre-février', note: 'Creux. Occupation 35-40 %, ADR -25 %.' },
    ],
    quartiers: [
      { nom: 'La Cité (intra-muros)', adr: '120-180 €', occ: '75 %', note: 'UNESCO, hôtels de charme, premium' },
      { nom: 'Bastide Saint-Louis', adr: '70-95 €', occ: '60 %', note: 'Ville basse, marchés, restaurants' },
      { nom: 'Quartier de la Trivalle', adr: '75-100 €', occ: '62 %', note: 'Au pied de la Cité, accès à pied' },
      { nom: 'Bords du Canal du Midi', adr: '80-110 €', occ: '58 %', note: 'Plaisanciers, vélo' },
      { nom: 'Faubourg Barbacane', adr: '65-85 €', occ: '52 %', note: 'Résidentiel, prix d\'achat bas' },
    ],
    legalNote: '120 jours résidence principale. Carcassonne exige la déclaration en mairie. Pas de quota strict, mais zone classée UNESCO impose contraintes architecturales (autorisation préalable pour travaux visibles).',
    annoncesEstim: '~1 800 annonces LCD actives, tourisme estival concentré',
    scenarios: { studio: 11100, t1: 13000, t2: 16500, t3: 19000, maison: 21500 },
  },

  {
    slug: 'revenu-lcd-la-baule', urlSegment: 'revenu-lcd-la-baule',
    ville: 'La Baule', pays: 'FR', flag: '🇫🇷',
    occ: 55, adr: 135, revpar: 27100,
    source: 'Office Tourisme La Baule Presqu\'île de Guérande + CRT Pays de la Loire 2024',
    saisonHaute: 'juin-septembre + ponts',
    saisonDetails: [
      { period: 'Avril-mai', note: 'Vacances de Pâques + ponts. Occupation 55 %, ADR +10 %.' },
      { period: 'Juin', note: 'Début saison, Open de tennis La Baule. Occupation 68 %, ADR +20 %.' },
      { period: 'Juillet-août', note: 'Pic absolu : famille + plage 9 km. Occupation 85 %, ADR +35 %.' },
      { period: 'Septembre', note: 'Arrière-saison douce. Occupation 60 %, ADR +12 %.' },
    ],
    quartiers: [
      { nom: 'Front de Mer / Remblai', adr: '180-280 €', occ: '70 %', note: 'Vue mer directe, premium' },
      { nom: 'Centre / Avenue de Gaulle', adr: '130-180 €', occ: '65 %', note: 'Commerces, marché, central' },
      { nom: 'La Baule-les-Pins', adr: '120-170 €', occ: '60 %', note: 'Villas Belle Époque, calme' },
      { nom: 'Pornichet (proche)', adr: '110-150 €', occ: '58 %', note: 'Alternative famille, prix bas' },
      { nom: 'Le Pouliguen (port)', adr: '120-160 €', occ: '60 %', note: 'Port pittoresque, restaurants' },
    ],
    legalNote: '120 jours résidence principale. La Baule applique la déclaration en mairie + numéro d\'enregistrement (commune touristique). Taxe de séjour majorée saison haute. Zone protégée pour certaines villas Belle Époque.',
    annoncesEstim: '~2 500 annonces LCD actives sur La Baule + Pornichet + Le Pouliguen',
    scenarios: { studio: 18200, t1: 21400, t2: 27100, t3: 31200, maison: 35200 },
  },

  {
    slug: 'revenu-lcd-le-touquet', urlSegment: 'revenu-lcd-le-touquet',
    ville: 'Le Touquet', pays: 'FR', flag: '🇫🇷',
    occ: 58, adr: 145, revpar: 30700,
    source: 'Office Tourisme Le Touquet-Paris-Plage + CRT Hauts-de-France 2024',
    saisonHaute: 'avril-octobre (weekends parisiens toute l\'année)',
    saisonDetails: [
      { period: 'Avril-juin', note: 'Enduropale (avril), ponts. Occupation 65 %, ADR +18 %.' },
      { period: 'Juillet-août', note: 'Pic touristique : familles, voile, golf. Occupation 78 %, ADR +30 %.' },
      { period: 'Septembre-octobre', note: 'Arrière-saison golf + Maremne Adour. Occupation 62 %, ADR +12 %.' },
      { period: 'Novembre-mars', note: 'Weekends parisiens uniquement. Occupation 40-45 % (concentrée ven-dim).' },
    ],
    quartiers: [
      { nom: 'Front de Mer / Digue', adr: '190-280 €', occ: '70 %', note: 'Vue mer, premium' },
      { nom: 'Centre / Rue Saint-Jean', adr: '140-200 €', occ: '65 %', note: 'Commerces de luxe, restaurants' },
      { nom: 'Quartier de la Forêt', adr: '160-230 €', occ: '60 %', note: 'Villas, calme, golf' },
      { nom: 'Cucq / Stella-Plage (proches)', adr: '100-140 €', occ: '55 %', note: 'Alternative famille, prix bas' },
      { nom: 'Etaples-sur-Mer (proche)', adr: '90-120 €', occ: '52 %', note: 'Port pêche, authentique' },
    ],
    legalNote: '120 jours résidence principale. Le Touquet applique strictement la déclaration en mairie + numéro d\'enregistrement (commune classée touristique). Taxe de séjour parmi les plus élevées de la côte (4-5 €/nuit en saison).',
    annoncesEstim: '~2 000 annonces LCD actives, fort poids du marché secondaire parisien',
    scenarios: { studio: 20600, t1: 24200, t2: 30700, t3: 35300, maison: 39900 },
  },

  {
    slug: 'revenu-lcd-megeve', urlSegment: 'revenu-lcd-megeve',
    ville: 'Megève', pays: 'FR', flag: '🇫🇷',
    occ: 60, adr: 230, revpar: 50400,
    source: 'Office Tourisme Megève + Savoie Mont Blanc 2024',
    saisonHaute: 'déc-mars (ski) + juillet-août (rando)',
    saisonDetails: [
      { period: 'Décembre-janvier', note: 'Pic ski + Réveillon. Occupation 85 %, ADR ×2 (400-800 €/nuit chalets). Semaine de Noël référence.' },
      { period: 'Février-mars', note: 'Vacances scolaires européennes (3 zones). Occupation 80 %, ADR +50 %.' },
      { period: 'Juillet-août', note: 'Saison été : rando, golf, Jazz festival. Occupation 70 %, ADR +20 %.' },
      { period: 'Avril-juin + sept-nov', note: 'Inter-saisons creuses. Occupation 30-40 %, beaucoup ferment.' },
    ],
    quartiers: [
      { nom: 'Centre-village (place Église)', adr: '280-450 €', occ: '78 %', note: 'Charme, restaurants étoilés' },
      { nom: 'Mont d\'Arbois / Rochebrune', adr: '350-600 €', occ: '75 %', note: 'Ski-in/ski-out, chalets premium' },
      { nom: 'Le Jaillet', adr: '200-300 €', occ: '65 %', note: 'Familles, accès ski + village' },
      { nom: 'Demi-Quartier', adr: '180-260 €', occ: '60 %', note: 'Plus calme, ski navette' },
      { nom: 'Combloux (proche)', adr: '160-230 €', occ: '58 %', note: 'Vue Mont-Blanc, prix bas' },
    ],
    legalNote: '120 jours résidence principale. Megève applique strictement l\'enregistrement (commune classée touristique). Taxe de séjour parmi les plus élevées de France en saison (jusqu\'à 5,20 €/nuit en palace). Numéro Atout France obligatoire pour le classement.',
    annoncesEstim: '~3 000 annonces LCD actives, ultra-saisonnier hiver + été',
    scenarios: { studio: 33800, t1: 39800, t2: 50400, t3: 58000, maison: 65500 },
  },

  {
    slug: 'revenu-lcd-courchevel', urlSegment: 'revenu-lcd-courchevel',
    ville: 'Courchevel', pays: 'FR', flag: '🇫🇷',
    occ: 50, adr: 380, revpar: 69400,
    source: 'Office Tourisme Courchevel + Les 3 Vallées 2024',
    saisonHaute: 'décembre-avril (ski uniquement)',
    saisonDetails: [
      { period: 'Décembre', note: 'Ouverture saison + Réveillon. Occupation 75 %, ADR ×1,8 (chalets 1000-3000 €/nuit).' },
      { period: 'Janvier', note: 'Russes/Britanniques + clientèle internationale ultra-premium. Occupation 80 %, ADR +60 %.' },
      { period: 'Février-mars', note: 'Pic absolu : vacances scolaires européennes. Occupation 90 %, ADR ×2.' },
      { period: 'Mai-novembre', note: 'Quasi mort. Occupation 15-25 %, la plupart des établissements ferment.' },
    ],
    quartiers: [
      { nom: 'Courchevel 1850', adr: '500-1200 €', occ: '75 %', note: 'Ultra-luxe, palaces, chalets jet-set' },
      { nom: 'Courchevel 1650 (Moriond)', adr: '300-500 €', occ: '70 %', note: 'Familial premium, ski-in/out' },
      { nom: 'Courchevel 1550', adr: '220-350 €', occ: '65 %', note: 'Bon rapport, accès rapide 1850' },
      { nom: 'Le Praz (1300)', adr: '180-280 €', occ: '60 %', note: 'Village authentique, prix bas' },
      { nom: 'Saint-Bon (1100)', adr: '150-220 €', occ: '55 %', note: 'Pied station, navettes' },
    ],
    legalNote: '120 jours résidence principale. Courchevel (commune de Saint-Bon-Tarentaise) applique strictement l\'enregistrement. Taxe de séjour très élevée saison (jusqu\'à 5,20 €/nuit). Classement Atout France recommandé pour clients premium (avantage TVA + crédibilité internationale).',
    annoncesEstim: '~2 500 annonces LCD actives, marché ultra-premium et saisonnier',
    scenarios: { studio: 46500, t1: 54800, t2: 69400, t3: 79800, maison: 90200 },
  },

  {
    slug: 'revenu-lcd-val-d-isere', urlSegment: 'revenu-lcd-val-d-isere',
    ville: 'Val d\'Isère', pays: 'FR', flag: '🇫🇷',
    occ: 55, adr: 270, revpar: 54200,
    source: 'Office Tourisme Val d\'Isère + Savoie Mont Blanc 2024',
    saisonHaute: 'décembre-avril (ski) + juillet-août (rando glacier)',
    saisonDetails: [
      { period: 'Décembre', note: 'Coupe du Monde de ski (Critérium de la Première Neige). Pic : occupation 80 %, ADR ×1,8.' },
      { period: 'Janvier-mars', note: 'Pic saison ski : clientèle internationale (UK, Scandinaves, Russes). Occupation 85 %, ADR ×1,8.' },
      { period: 'Avril', note: 'Fin saison ski + soleil printanier. Occupation 70 %, ADR +30 %.' },
      { period: 'Juillet-août', note: 'Ski d\'été glacier + rando. Occupation 50 %, ADR -10 % vs hiver.' },
    ],
    quartiers: [
      { nom: 'Centre-village (La Daille proche)', adr: '320-500 €', occ: '80 %', note: 'Ski-in/ski-out, vie nocturne' },
      { nom: 'Le Fornet', adr: '250-380 €', occ: '70 %', note: 'Authentique, calme, accès Solaise' },
      { nom: 'Le Joseray', adr: '230-340 €', occ: '68 %', note: 'Résidentiel chic, vue glacier' },
      { nom: 'La Daille', adr: '200-300 €', occ: '65 %', note: 'Pieds de pistes, parking' },
      { nom: 'Le Châtelard', adr: '210-310 €', occ: '65 %', note: 'Familial, près centre' },
    ],
    legalNote: '120 jours résidence principale. Val d\'Isère applique l\'enregistrement obligatoire. Taxe de séjour élevée saison (jusqu\'à 5 €/nuit). Classement Atout France très recommandé pour clientèle internationale (anglo-saxons + Russes).',
    annoncesEstim: '~2 200 annonces LCD actives, marché 7 mois/an concentré',
    scenarios: { studio: 36300, t1: 42800, t2: 54200, t3: 62300, maison: 70500 },
  },

  {
    slug: 'revenu-lcd-la-rochelle', urlSegment: 'revenu-lcd-la-rochelle',
    ville: 'La Rochelle', pays: 'FR', flag: '🇫🇷',
    occ: 62, adr: 110, revpar: 24900,
    source: 'Office Tourisme La Rochelle + CRT Nouvelle-Aquitaine 2024',
    saisonHaute: 'avril-septembre',
    saisonDetails: [
      { period: 'Avril-juin', note: 'Pâques + Grand Pavois (avr/biennale), Festival des Francofolies (juillet). Occupation 70 %, ADR +15 %.' },
      { period: 'Juillet-août', note: 'Pic absolu : Francofolies (mi-juil) + plages Île de Ré proche. Occupation 82 %, ADR +25 %.' },
      { period: 'Septembre', note: 'Grand Pavois (sept impair) + arrière-saison. Occupation 68 %, ADR +12 %.' },
      { period: 'Novembre-février', note: 'Creux. Occupation 40 %, ADR -20 %.' },
    ],
    quartiers: [
      { nom: 'Vieux Port', adr: '130-180 €', occ: '75 %', note: 'Tours médiévales, restaurants, central' },
      { nom: 'Centre-ville historique', adr: '110-150 €', occ: '70 %', note: 'Arcades, marché, à pied du port' },
      { nom: 'Les Minimes', adr: '95-125 €', occ: '62 %', note: 'Port de plaisance, université, plage' },
      { nom: 'La Pallice', adr: '85-110 €', occ: '55 %', note: 'Plus excentré, prix bas' },
      { nom: 'Île de Ré (Saint-Martin)', adr: '180-280 €', occ: '60 %', note: 'Premium, voiture/vélo, ultra-saisonnier' },
    ],
    legalNote: '120 jours résidence principale. La Rochelle applique l\'enregistrement obligatoire + numéro de déclaration. Île de Ré : moratoire sur les meublés touristiques dans certaines communes (Saint-Martin, La Couarde) : vérifier avant achat.',
    annoncesEstim: '~3 500 annonces LCD actives sur La Rochelle + Île de Ré',
    scenarios: { studio: 16700, t1: 19700, t2: 24900, t3: 28600, maison: 32400 },
  },

  {
    slug: 'revenu-lcd-saint-malo', urlSegment: 'revenu-lcd-saint-malo',
    ville: 'Saint-Malo', pays: 'FR', flag: '🇫🇷',
    occ: 62, adr: 105, revpar: 23800,
    source: 'Office Tourisme Saint-Malo Baie du Mont Saint-Michel + CRT Bretagne 2024',
    saisonHaute: 'avril-septembre',
    saisonDetails: [
      { period: 'Avril-juin', note: 'Étonnants Voyageurs (mai), Route du Rock (août), Festival International du Livre. Occupation 68 %, ADR +15 %.' },
      { period: 'Juillet-août', note: 'Pic absolu : tourisme international + Mont-Saint-Michel. Occupation 85 %, ADR +28 %.' },
      { period: 'Septembre-octobre', note: 'Route du Rock, marées d\'équinoxe (spectaculaires). Occupation 65 %, ADR +12 %.' },
      { period: 'Novembre-février', note: 'Creux relatif (croisières + week-ends bretons). Occupation 42 %, ADR -15 %.' },
    ],
    quartiers: [
      { nom: 'Intra-Muros (cité corsaire)', adr: '130-180 €', occ: '78 %', note: 'Remparts, premium touristique' },
      { nom: 'Saint-Servan', adr: '95-125 €', occ: '60 %', note: 'Plus calme, ferries Cézembre' },
      { nom: 'Paramé / Rochebonne', adr: '105-140 €', occ: '65 %', note: 'Plages, villas Belle Époque' },
      { nom: 'Rotheneuf', adr: '90-115 €', occ: '58 %', note: 'Familial, plages calmes' },
      { nom: 'La Découverte', adr: '85-110 €', occ: '55 %', note: 'Résidentiel, transports' },
    ],
    legalNote: '120 jours résidence principale. Saint-Malo applique strictement l\'enregistrement (commune touristique) + procédure de changement d\'usage dans l\'intra-muros (zone tendue). Atout France recommandé pour clientèle internationale.',
    annoncesEstim: '~2 800 annonces LCD actives, forte concentration intra-muros',
    scenarios: { studio: 16000, t1: 18800, t2: 23800, t3: 27400, maison: 30900 },
  },

  {
    slug: 'revenu-lcd-deauville', urlSegment: 'revenu-lcd-deauville',
    ville: 'Deauville', pays: 'FR', flag: '🇫🇷',
    occ: 55, adr: 155, revpar: 31100,
    source: 'Office Tourisme Deauville + CRT Normandie 2024',
    saisonHaute: 'avril-octobre (weekends parisiens toute l\'année)',
    saisonDetails: [
      { period: 'Avril-juin', note: 'Asian Film Festival (mars), Pâques. Occupation 60 %, ADR +18 %.' },
      { period: 'Juillet-août', note: 'Pic touristique + courses hippiques. Occupation 78 %, ADR +28 %.' },
      { period: 'Septembre', note: 'Festival du Cinéma Américain de Deauville. Pic local : occupation 85 %, ADR +35 % sur 10 jours.' },
      { period: 'Novembre-mars', note: 'Weekends parisiens. Occupation 42 % (concentrée ven-dim), ADR -15 %.' },
    ],
    quartiers: [
      { nom: 'Front de Mer / Planches', adr: '200-300 €', occ: '70 %', note: 'Vue mer, parasols mythiques, premium' },
      { nom: 'Centre / Rue Eugène Colas', adr: '150-210 €', occ: '65 %', note: 'Boutiques luxe, restaurants' },
      { nom: 'Quartier des Villas', adr: '170-240 €', occ: '60 %', note: 'Villas Belle Époque, calme' },
      { nom: 'Trouville-sur-Mer (proche)', adr: '110-150 €', occ: '60 %', note: 'Alternative authentique, marché aux poissons' },
      { nom: 'Touques (proche)', adr: '85-115 €', occ: '55 %', note: 'Prix d\'achat 30 % moins cher' },
    ],
    legalNote: '120 jours résidence principale. Deauville applique l\'enregistrement obligatoire + numéro de déclaration (commune classée touristique). Taxe de séjour parmi les plus élevées de Normandie en saison.',
    annoncesEstim: '~2 200 annonces LCD actives sur Deauville + Trouville + Touques',
    scenarios: { studio: 20800, t1: 24600, t2: 31100, t3: 35800, maison: 40400 },
  },

  {
    slug: 'revenu-lcd-biarritz', urlSegment: 'revenu-lcd-biarritz',
    ville: 'Biarritz', pays: 'FR', flag: '🇫🇷',
    occ: 65, adr: 135, revpar: 32000,
    source: 'Office Tourisme Biarritz + CRT Nouvelle-Aquitaine 2024',
    saisonHaute: 'mai-octobre',
    saisonDetails: [
      { period: 'Mai-juin', note: 'Surf de Pâques + Biarritz Maïder Arosteguy. Occupation 70 %, ADR +18 %.' },
      { period: 'Juillet-août', note: 'Pic absolu : tourisme international + surf + golf. Occupation 85 %, ADR +28 %.' },
      { period: 'Septembre', note: 'Quiksilver Pro France + arrière-saison douce. Occupation 78 %, ADR +20 %.' },
      { period: 'Novembre-mars', note: 'Creux relatif (talasso, surf hivernal). Occupation 45 %, ADR -15 %.' },
    ],
    quartiers: [
      { nom: 'Grande Plage / Casino', adr: '180-260 €', occ: '78 %', note: 'Vue mer, centre, ultra-premium' },
      { nom: 'Port Vieux', adr: '160-220 €', occ: '72 %', note: 'Pittoresque, restaurants, plage' },
      { nom: 'Plage de la Côte des Basques', adr: '170-230 €', occ: '70 %', note: 'Spot surf mythique, premium' },
      { nom: 'Beaurivage / Milady', adr: '130-180 €', occ: '62 %', note: 'Familial, plages au sud' },
      { nom: 'Anglet (proche)', adr: '110-150 €', occ: '60 %', note: 'Plages + golf, prix plus bas' },
    ],
    legalNote: '120 jours résidence principale. Biarritz applique strictement la procédure de changement d\'usage avec compensation depuis 2020 (zone tendue) + numéro d\'enregistrement obligatoire. Quotas existants dans le centre.',
    annoncesEstim: '~4 500 annonces LCD actives, marché premium ultra-saisonnier',
    scenarios: { studio: 21400, t1: 25300, t2: 32000, t3: 36800, maison: 41600 },
  },

  {
    slug: 'revenu-lcd-aix-en-provence', urlSegment: 'revenu-lcd-aix-en-provence',
    ville: 'Aix-en-Provence', pays: 'FR', flag: '🇫🇷',
    occ: 65, adr: 105, revpar: 24900,
    source: 'Office Tourisme Aix-en-Provence + CRT PACA 2024',
    saisonHaute: 'avril-septembre',
    saisonDetails: [
      { period: 'Avril-juin', note: 'Printemps idéal + congrès universitaires. Occupation 70 %, ADR +15 %.' },
      { period: 'Juillet', note: 'Festival d\'art lyrique d\'Aix (juillet). Pic absolu : occupation 85 %, ADR +30 %.' },
      { period: 'Août', note: 'Tourisme international + Provence. Occupation 75 %, ADR +20 %.' },
      { period: 'Décembre-février', note: 'Creux. Occupation 50 %, ADR -15 %.' },
    ],
    quartiers: [
      { nom: 'Mazarin (centre historique)', adr: '130-180 €', occ: '78 %', note: 'Hôtels particuliers, premium' },
      { nom: 'Cours Mirabeau', adr: '120-160 €', occ: '75 %', note: 'Cœur d\'Aix, restaurants, à pied' },
      { nom: 'Quartier des Cardeurs', adr: '105-135 €', occ: '70 %', note: 'Vie nocturne, place animée' },
      { nom: 'Quartier de la Cathédrale', adr: '95-125 €', occ: '65 %', note: 'Calme, monuments' },
      { nom: 'Jas-de-Bouffan / Encagnane', adr: '75-95 €', occ: '55 %', note: 'Plus excentré, prix bas' },
    ],
    legalNote: '120 jours résidence principale. Aix-en-Provence applique l\'enregistrement obligatoire + procédure de changement d\'usage dans le centre ancien (zone tendue) depuis 2022. Plafond LCD strict dans l\'hyper-centre.',
    annoncesEstim: '~3 200 annonces LCD actives, forte concentration centre historique',
    scenarios: { studio: 16700, t1: 19700, t2: 24900, t3: 28600, maison: 32400 },
  },

  {
    slug: 'revenu-lcd-avignon', urlSegment: 'revenu-lcd-avignon',
    ville: 'Avignon', pays: 'FR', flag: '🇫🇷',
    occ: 60, adr: 92, revpar: 20100,
    source: 'Office Tourisme Avignon + CRT PACA 2024',
    saisonHaute: 'avril-septembre + juillet (Festival)',
    saisonDetails: [
      { period: 'Avril-juin', note: 'Printemps doux + tourisme culturel UNESCO. Occupation 65 %, ADR +12 %.' },
      { period: 'Juillet', note: 'Festival d\'Avignon (3 semaines). Pic absolu : occupation 95 %, ADR +60 % (tarifs doublent sur certains logements).' },
      { period: 'Août', note: 'Tourisme international. Occupation 75 %, ADR +18 %.' },
      { period: 'Novembre-février', note: 'Creux. Occupation 42 %, ADR -20 %.' },
    ],
    quartiers: [
      { nom: 'Intra-Muros (centre historique)', adr: '110-160 €', occ: '78 %', note: 'UNESCO, Palais des Papes, premium' },
      { nom: 'Quartier de la Banasterie', adr: '95-130 €', occ: '72 %', note: 'Hôtels particuliers, calme' },
      { nom: 'Rue des Teinturiers', adr: '90-115 €', occ: '68 %', note: 'Bohème, théâtres, restaurants' },
      { nom: 'Île de la Barthelasse', adr: '95-125 €', occ: '60 %', note: 'Vue Palais, ferry navette, calme' },
      { nom: 'Villeneuve-lez-Avignon (proche)', adr: '85-110 €', occ: '55 %', note: 'Alternative authentique' },
    ],
    legalNote: '120 jours résidence principale. Avignon applique strictement l\'enregistrement + procédure de changement d\'usage dans l\'intra-muros (zone tendue + UNESCO). Pendant le Festival, locations très réglementées.',
    annoncesEstim: '~2 800 annonces LCD actives, pic massif en juillet',
    scenarios: { studio: 13500, t1: 15900, t2: 20100, t3: 23100, maison: 26100 },
  },

  {
    slug: 'revenu-lcd-cannes', urlSegment: 'revenu-lcd-cannes',
    ville: 'Cannes', pays: 'FR', flag: '🇫🇷',
    occ: 65, adr: 155, revpar: 36800,
    source: 'Office Tourisme Cannes + CRT Côte d\'Azur 2024',
    saisonHaute: 'mai-octobre + congrès (MIPIM mars, MIPCOM oct)',
    saisonDetails: [
      { period: 'Mars', note: 'MIPIM (immobilier international). Pic local : occupation 95 %, ADR ×2,5 sur 4 jours.' },
      { period: 'Mai', note: 'Festival de Cannes (12 jours). Pic absolu : occupation 98 %, ADR ×3 (locations à 800-3000 €/nuit).' },
      { period: 'Juillet-août', note: 'Tourisme international + plage. Occupation 80 %, ADR +25 %.' },
      { period: 'Octobre', note: 'MIPCOM (TV) + arrière-saison. Occupation 75 %, ADR +20 %.' },
    ],
    quartiers: [
      { nom: 'Croisette / Front de Mer', adr: '220-380 €', occ: '78 %', note: 'Vue mer, palaces, ultra-premium' },
      { nom: 'Suquet (vieille ville)', adr: '160-220 €', occ: '72 %', note: 'Charme, vue baie, restaurants' },
      { nom: 'Carré d\'Or (centre)', adr: '180-260 €', occ: '75 %', note: 'Shopping luxe, Palais Festivals' },
      { nom: 'Rue Meynadier / Forville', adr: '130-180 €', occ: '68 %', note: 'Marché Forville, à pied tout' },
      { nom: 'La Bocca / Cannes Ouest', adr: '95-130 €', occ: '60 %', note: 'Familial, plages, prix bas' },
    ],
    legalNote: '120 jours résidence principale. Cannes applique strictement l\'enregistrement + procédure de changement d\'usage (zone tendue + équipe de contrôle dédiée). Pendant le Festival, encadrement renforcé des prix abusifs.',
    annoncesEstim: '~5 000 annonces LCD actives, pic massif pendant Festival + congrès',
    scenarios: { studio: 24700, t1: 29100, t2: 36800, t3: 42300, maison: 47800 },
  },

  {
    slug: 'revenu-lcd-chamonix', urlSegment: 'revenu-lcd-chamonix',
    ville: 'Chamonix', pays: 'FR', flag: '🇫🇷',
    occ: 65, adr: 155, revpar: 36800,
    source: 'Office Tourisme Chamonix-Mont-Blanc + Savoie Mont Blanc 2024',
    saisonHaute: 'déc-mars (ski) + juin-septembre (alpinisme/rando)',
    saisonDetails: [
      { period: 'Décembre-janvier', note: 'Pic ski + Réveillon. Occupation 80 %, ADR +50 %.' },
      { period: 'Février-mars', note: 'Vacances scolaires européennes. Occupation 85 %, ADR +60 %.' },
      { period: 'Juin-août', note: 'Saison été : alpinisme, UTMB (fin août). Occupation 78 %, ADR +35 %.' },
      { period: 'Septembre', note: 'Trail UTMB Mont-Blanc (mythique). Pic local : occupation 90 %, ADR +40 %.' },
    ],
    quartiers: [
      { nom: 'Centre-ville / Aiguille du Midi', adr: '180-260 €', occ: '78 %', note: 'Téléphérique, restaurants, premium' },
      { nom: 'Les Pèlerins / Les Bossons', adr: '140-200 €', occ: '68 %', note: 'Calme, pied glacier' },
      { nom: 'Les Praz-de-Chamonix', adr: '170-240 €', occ: '72 %', note: 'Vue Mont-Blanc, accès Flégère' },
      { nom: 'Argentière', adr: '160-220 €', occ: '70 %', note: 'Authentique, accès Grands Montets' },
      { nom: 'Servoz (proche, prix bas)', adr: '100-140 €', occ: '58 %', note: 'Vallée, train Mont-Blanc' },
    ],
    legalNote: '120 jours résidence principale. Chamonix applique strictement l\'enregistrement (commune classée touristique + zone tendue depuis 2024). Taxe de séjour parmi les plus élevées de France en haute saison. Atout France recommandé pour clientèle alpinisme internationale.',
    annoncesEstim: '~4 000 annonces LCD actives dans la vallée Chamonix-Mont-Blanc',
    scenarios: { studio: 24700, t1: 29100, t2: 36800, t3: 42300, maison: 47800 },
  },

  {
    slug: 'revenu-lcd-toulouse', urlSegment: 'revenu-lcd-toulouse',
    ville: 'Toulouse', pays: 'FR', flag: '🇫🇷',
    occ: 62, adr: 82, revpar: 18600,
    source: 'Office Tourisme Toulouse + CRT Occitanie 2024',
    saisonHaute: 'mai-juin + septembre-octobre (congrès + meetings aéro)',
    saisonDetails: [
      { period: 'Avril-juin', note: 'Salon du Bourget (biennale juin), congrès aéro Airbus + ThalesAleniaSpace. Occupation 70 %, ADR +18 %.' },
      { period: 'Juillet-août', note: 'Tourisme + Cité de l\'Espace. Occupation 65 %, ADR +10 %.' },
      { period: 'Septembre-octobre', note: 'Rentrée business + Toulouse Game Show. Occupation 72 %, ADR +15 %.' },
      { period: 'Décembre-février', note: 'Marchés de Noël (déc) + creux. Occupation 50 %, ADR -10 %.' },
    ],
    quartiers: [
      { nom: 'Capitole / Centre historique', adr: '100-135 €', occ: '75 %', note: 'Place du Capitole, restaurants, ultra-central' },
      { nom: 'Saint-Cyprien (rive gauche)', adr: '85-110 €', occ: '68 %', note: 'Bohème, marché, à pied du centre' },
      { nom: 'Carmes / Saint-Étienne', adr: '90-115 €', occ: '70 %', note: 'Hôtels particuliers, calme' },
      { nom: 'Compans-Caffarelli (business)', adr: '85-105 €', occ: '65 %', note: 'Salons, congrès, hôtels d\'affaires' },
      { nom: 'Rangueil / Université', adr: '70-90 €', occ: '58 %', note: 'Étudiants, prix bas' },
    ],
    legalNote: '120 jours résidence principale. Toulouse applique l\'enregistrement obligatoire + procédure de changement d\'usage dans l\'hyper-centre (zone tendue depuis 2023). Plafond LCD strict dans le centre historique.',
    annoncesEstim: '~6 000 annonces LCD actives, forte base business + tourisme spatial',
    scenarios: { studio: 12500, t1: 14700, t2: 18600, t3: 21400, maison: 24200 },
  },

  {
    slug: 'revenu-lcd-montpellier', urlSegment: 'revenu-lcd-montpellier',
    ville: 'Montpellier', pays: 'FR', flag: '🇫🇷',
    occ: 63, adr: 88, revpar: 20300,
    source: 'Office Tourisme Montpellier Méditerranée Métropole + CRT Occitanie 2024',
    saisonHaute: 'mai-septembre',
    saisonDetails: [
      { period: 'Avril-juin', note: 'Printemps doux + Festival Montpellier Danse (juin). Occupation 70 %, ADR +15 %.' },
      { period: 'Juillet-août', note: 'Pic absolu : Festival Radio France (juillet) + plages Palavas/La Grande-Motte. Occupation 80 %, ADR +25 %.' },
      { period: 'Septembre-octobre', note: 'Comédie du Livre + arrière-saison douce. Occupation 68 %, ADR +12 %.' },
      { period: 'Décembre-février', note: 'Creux. Occupation 48 %, ADR -15 %.' },
    ],
    quartiers: [
      { nom: 'Écusson (centre historique)', adr: '105-140 €', occ: '78 %', note: 'Place de la Comédie, premium' },
      { nom: 'Antigone', adr: '90-115 €', occ: '70 %', note: 'Architecture Bofill, calme' },
      { nom: 'Beaux-Arts / Boutonnet', adr: '85-110 €', occ: '68 %', note: 'Bohème, restaurants, à pied' },
      { nom: 'Port Marianne', adr: '95-125 €', occ: '65 %', note: 'Moderne, tramway, bord du Lez' },
      { nom: 'Pierres Vives / Mosson', adr: '70-90 €', occ: '55 %', note: 'Plus excentré, prix bas' },
    ],
    legalNote: '120 jours résidence principale. Montpellier applique l\'enregistrement obligatoire + procédure de changement d\'usage dans l\'Écusson (zone tendue depuis 2022). Restrictions renforcées dans le centre historique.',
    annoncesEstim: '~4 500 annonces LCD actives, forte concentration centre + littoral proche',
    scenarios: { studio: 13600, t1: 16000, t2: 20300, t3: 23300, maison: 26400 },
  },
]

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

// Gabarit : scripts/lib/revenu-ville-html.mjs (format « rapport de ta ville »,
// 10/11/2026). Les chiffres viennent de services/simulateurs/engine.js, comme
// l'estimateur, pour ne jamais contredire /services/simulateurs/revenus-lcd.
function loadEngine () {
  globalThis.window = globalThis.window || {}
  const src = fs.readFileSync(path.join(ROOT, 'services', 'simulateurs', 'engine.js'), 'utf8')
  new Function(src)()
  return globalThis.window.JMCalc
}

/** Adresse d'une étude : /services/simulateurs/revenus-lcd/<ville> (10/11/2026) */
export const etudeUrl = c => `/services/simulateurs/revenus-lcd/${c.urlSegment.replace(/^revenu-lcd-/, '')}`

function buildHtml (city, J, reg) {
  const me = reg.find(v => v.pages.revenus === etudeUrl(city))
  const t2 = c => J.estimateRevenue({ pays: c.pays, ville: c.ville, typeLogement: 't2', nbChambres: 1, mode: 'toute-annee' }).revenuAnnuel
  const others = CITIES.filter(c => c !== city).map(c => {
    const r = reg.find(v => v.pages.revenus === etudeUrl(c))
    const b = J.findCity(c.ville, c.pays)
    let d = Infinity
    if (me?.centre && r?.centre) d = Math.hypot(me.centre[0] - r.centre[0], (me.centre[1] - r.centre[1]) * 1.4)
    else if (c.pays === city.pays) d = 1e6
    return { ville: c.ville, url: etudeUrl(c), occ: b.occ, adr: b.adr, t2: t2(c), d }
  }).filter(n => Number.isFinite(n.d)).sort((x, y) => x.d - y.d).slice(0, 4)
  return buildRevenuVille(city, { url: etudeUrl(city), J, photo: aPhoto(me?.slug ?? '') ? me.slug : null, neighbours: others })
}

// ─── Génération ───────────────────────────────────────────────────────────
// Seulement quand le script est lancé directement (CITIES est aussi importé)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
let count = 0
const J = loadEngine()
const reg = villesRegistre()
for (const city of CITIES) {
  const dir = path.join(ROOT, etudeUrl(city).slice(1))
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const html = buildHtml(city, J, reg)
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8')
  console.log(`  ok ${city.urlSegment}/index.html (${city.ville})`)
  count++
}

console.log(`\n🎉 ${count} articles SEO ville générés dans /services/simulateurs/revenus-lcd/`)
console.log('   Sitemap à mettre à jour ensuite.\n')
}
