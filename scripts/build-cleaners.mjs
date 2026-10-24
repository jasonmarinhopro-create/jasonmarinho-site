#!/usr/bin/env node
/**
 * Build script : génère l'annuaire public des équipes de ménage LCD et
 * les fiches individuelles SEO friendly. Réplique du pattern
 * build-photographers.mjs.
 *
 * - /annuaires/menage/index.html : liste filtrable (l'annuaire)
 * - /annuaires/menage/[slug]/index.html : fiche individuelle
 * - /sitemap-menages.xml : sitemap dédié
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { injectProsIntoVillePages, villeGuide } from './lib/inject-ville-pros.mjs'
import { proReseauxLinks, proReseauxHtml } from './lib/pro-reseaux.mjs'
import { adminOwnedIds } from './lib/admin-owned.mjs'
import { ANNUAIRES, cityCoverage, searchWords, prixDes, heroInnerHtml, emptyHtml, guideHtml, faqHtml, faqJsonLd, villesGuidesHtml, joinLineHtml, demandeBandHtml, proCardHtml, cardLieu, CARD_PHOTOS_MAX, ANNUAIRE_CSS, CITY_PICKS_JS } from './lib/annuaire-hote.mjs'
import { vitrinePhotos, photoLimitFromViews, heroActionsHtml, heroCoverHtml, galleryHtml, formulesHtml, derouleHtml, stickyBarHtml, VITRINE_CSS, VITRINE_JS, telHtml, clientelesHtml } from './lib/fiche-vitrine.mjs'
import { secteurHtml, SECTEUR_CSS, SECTEUR_JS } from './lib/secteur.mjs'
import { nomAffiche, initiales, aVille, deVille, prixDepuis, zoneFact, trustFact, briefHtml, zoneCardHtml, workLinksHtml, contactFormHtml, CONTACT_JS, SIGNATURE_CSS } from './lib/fiche-signature.mjs'

// Taille de l'équipe en version courte pour « En bref »
const EQUIPE_COURTE = { solo: ['Solo', 'une seule personne'], duo: ['Duo', 'deux personnes'], equipe_3_5: ['3 à 5', 'personnes dans l’équipe'], equipe_6_plus: ['6 et plus', 'personnes dans l’équipe'] }

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const FICHES_DIR = path.join(ROOT, 'annuaires', 'menage')
// Sous-dossiers à PROTÉGER du cleanup (sous-pages statiques sous
// /annuaires/menage/) : sinon le rm récursif les supprimerait.
// NB : 'annuaire' n'est plus réservé : l'ancienne URL /annuaires/menage/annuaire
// redirige (301 vercel.json) vers /annuaires/menage.
const RESERVED_DIRS = new Set(['inscription', 'exemple-fiche'])

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const HAS_SUPABASE = !!(SUPABASE_URL && SERVICE_KEY)
// Photos affichées par fiche : réduit à la photo principale si la sortie
// Supabase du mois risque de dépasser l'offre gratuite (photoLimitFromViews)
let PHOTO_LIMIT = 6

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('[build-cleaners] START')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

const PRESTATIONS_LABELS = {
  menage_standard: 'Ménage standard',
  gestion_linge: 'Gestion du linge',
  repassage: 'Repassage',
  reapprovisionnement: 'Réappro consommables',
  etat_des_lieux_photo: 'État des lieux photo',
  petite_maintenance: 'Petite maintenance',
  nettoyage_exterieur: 'Nettoyage extérieur',
  gestion_dechets: 'Gestion des déchets',
}
const EQUIPE_LABELS = {
  solo: 'Solo',
  duo: 'Duo',
  equipe_3_5: 'Équipe de 3 à 5 personnes',
  equipe_6_plus: 'Équipe de 6 personnes ou +',
}
const DELAI_LABELS = {
  jour_meme: 'Disponible jour même',
  '24h': 'Réservation 24h à l\'avance',
  '48h': 'Réservation 48h à l\'avance',
  '72h': 'Réservation 72h à l\'avance',
}

function escHtml(s) {
  if (s == null) return ''
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// Texte de recherche insensible aux accents/casse, précalculé au build pour
// que le filtre côté client (annuaire) n'ait qu'à normaliser la saisie.
function normalizeSearch(s) {
  if (!s) return ''
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

async function fetchActive() {
  if (!HAS_SUPABASE) return []
  const url = `${SUPABASE_URL}/rest/v1/public_cleaners_view?select=*&order=created_at.desc&limit=500`
  const res = await fetch(url, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Accept: 'application/json' },
  })
  if (!res.ok) {
    const txt = await res.text()
    console.warn(`[build-cleaners] Supabase fetch failed (${res.status}): ${txt}`)
    return []
  }
  const data = await res.json()
  console.log(`[build-cleaners] ${data.length} équipe(s) active(s)`)
  return data
}

// Recommandations d'hôtes (badge « Recommandé par N hôtes »). Fail-safe :
// table absente ou fetch KO → Map vide, aucun badge.
async function fetchRecoCounts() {
  if (!HAS_SUPABASE) return new Map()
  try {
    const url = `${SUPABASE_URL}/rest/v1/pro_recommendations?pro_type=eq.cleaner&select=pro_id&limit=10000`
    const res = await fetch(url, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Accept: 'application/json' },
    })
    if (!res.ok) return new Map()
    const rows = await res.json()
    const map = new Map()
    for (const r of rows) map.set(r.pro_id, (map.get(r.pro_id) ?? 0) + 1)
    return map
  } catch {
    return new Map()
  }
}

// Vues des fiches pros du mois (toutes) : sert à protéger la sortie gratuite
// de Supabase (photos des fiches servies depuis le stockage).
async function fetchMonthViews() {
  if (!HAS_SUPABASE) return 0
  try {
    const d = new Date()
    const first = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pro_fiche_views_daily?day=gte.${first}&select=views&limit=20000`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Accept: 'application/json' },
    })
    if (!res.ok) return 0
    return (await res.json()).reduce((n, r) => n + (r.views || 0), 0)
  } catch {
    return 0
  }
}

function fmtForfait(c) {
  if (!c.tarif_forfait_min && !c.tarif_forfait_max) return null
  if (c.tarif_forfait_min && c.tarif_forfait_max) return `${c.tarif_forfait_min} – ${c.tarif_forfait_max} €`
  return c.tarif_forfait_min ? `dès ${c.tarif_forfait_min} €` : `jusqu'à ${c.tarif_forfait_max} €`
}



// "Membre depuis juin 2026" : signal d'anciennete/confiance sur la fiche
const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
function memberSince(createdAt) {
  if (!createdAt) return null
  const d = new Date(createdAt)
  if (isNaN(d.getTime())) return null
  return `${MOIS_FR[d.getMonth()]} ${d.getFullYear()}`
}

// Exportée pour les fiches d'exemple (scripts/build-exemples-fiches.mjs)
export function buildFichePage(c) {
  const displayName = nomAffiche(c.pseudo || c.full_name)
  const title = `${displayName} · Équipe ménage LCD ${c.ville} | Jason Marinho`
  const forfait = fmtForfait(c)
  const heure = c.tarif_heure ? `${c.tarif_heure} €/h` : null
  const desc = `${displayName}, équipe de ménage spécialisée location courte durée à ${c.ville}${c.zone_couverte ? ' et ' + c.zone_couverte : ''}.${forfait ? ' Forfait turnover ' + forfait + '.' : ''}${heure ? ' Tarif horaire ' + heure + '.' : ''}`
  const canonical = `https://jasonmarinho.com/annuaires/menage/${c.slug}`
  // Page de sa ville (ou de sa zone) : même règle que l'injection des pros
  const g = villeGuide(ROOT, 'menage-lcd', c.ville, c.zone_couverte)
  // Réseaux et fiche Google (Instagram a déjà son bouton plus haut)
  const reseaux = proReseauxLinks(c.reseaux, null)
  const guide = g?.href ?? null
  const depuis = memberSince(c.created_at)
  const firstName = nomAffiche(c.full_name || displayName).split(' ')[0]
  const photos = c.__photos ?? vitrinePhotos(c.portfolio_photos, SUPABASE_URL, PHOTO_LIMIT)
  const external = c.site_url ? { href: c.site_url, label: 'Voir le site', short: 'Site', icon: 'ph-globe', track: 'site' } : null

  const prestations = (c.prestations || []).map(p => PRESTATIONS_LABELS[p] || p)
  const equipeLabel = c.equipe_type ? EQUIPE_LABELS[c.equipe_type] : null
  const delaiLabel = c.delai_reservation ? DELAI_LABELS[c.delai_reservation] : null
  const langues = (c.langues || []).map(l => l.toUpperCase()).join(', ')
  const eq = EQUIPE_COURTE[c.equipe_type]
  const facts = [
    (pr => pr ? { v: pr, l: 'dès, le ménage' } : null)(prixDepuis(c.formules, c.tarif_forfait_min)),
    zoneFact(c.ville, c.zone_couverte),
    eq ? { v: eq[0], l: eq[1] } : (c.prestations || []).includes('gestion_linge') ? { v: 'Linge', l: 'géré par l’équipe' } : null,
    c.reco_count > 0 ? trustFact(c.reco_count, null, { feminin: true }) : c.assurance_rc_pro ? { v: 'RC pro', l: 'assurance professionnelle' } : trustFact(0, c.created_at),
  ]
  const besoins = ['Des ménages entre deux voyageurs', 'Un grand ménage', ...((c.prestations || []).includes('gestion_linge') ? ['Le linge'] : [])]

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(title)}</title>
<meta name="description" content="${escHtml(desc.slice(0, 160))}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${escHtml(title)}">
<meta property="og:description" content="${escHtml(desc.slice(0, 200))}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="profile">
<meta property="og:image" content="https://jasonmarinho.com/couverture-jason.webp">
<meta property="og:site_name" content="Jason Marinho">
<meta name="robots" content="index, follow">
<link rel="shortcut icon" href="/favicon.ico">
<link rel="icon" href="/favicon.ico?v=2026-06" sizes="any">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2026-06">
<link rel="manifest" href="/manifest.json?v=2026-06">
<meta name="theme-color" content="#004C3F">
<link rel="stylesheet" href="/fonts/site-fonts.css?v=0e07aaf42e">
<link rel="stylesheet" type="text/css" href="/fonts/phosphor-bold-subset.css?v=29999e9550">
<style>
:root{--g:#004C3F;--gd:#003329;--y:#FFD56B;--cr:#F7F5F0;--w:#FDFCF9;--td:#0F1A0D;--tm:#3D5038;--tl:#7A8C77;--bd:rgba(0,76,63,.09)}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Outfit',sans-serif;background:var(--cr);color:var(--td);padding-top:64px}
body::before{content:'';position:fixed;top:0;left:0;right:0;height:64px;background:var(--gd);z-index:100}
a{color:inherit}
.hero{background:linear-gradient(160deg,#001a11 0%,var(--gd) 55%,#00463a 100%);padding:48px 0 56px;color:#fff}
.s-in{max-width:1100px;margin:0 auto;padding:0 clamp(20px,5vw,48px)}
.brd{font-size:13px;color:rgba(255,255,255,.4);margin-bottom:22px}
.brd a{color:rgba(255,255,255,.55);text-decoration:none}
.tag-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.tag{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.08);color:rgba(255,255,255,.7)}
.tag.gold{background:rgba(255,213,107,.15);color:#FFD56B;border:1px solid rgba(255,213,107,.35)}
.tag.green{background:rgba(99,214,131,.15);color:#63D683;border:1px solid rgba(99,214,131,.3)}
h1{font-family:'Fraunces',serif;font-size:clamp(28px,4vw,46px);font-weight:400;line-height:1.1;letter-spacing:-.5px;margin:0 0 14px;flex:1;min-width:0}
.hero-id{display:flex;align-items:center;gap:20px;flex-wrap:wrap}
.hero-logo{width:96px;height:96px;border-radius:18px;flex-shrink:0;border:1px solid rgba(255,255,255,.15);overflow:hidden;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.25)}
.hero-logo.placeholder{background:rgba(255,213,107,.10);color:var(--y);font-family:'Fraunces',serif;font-size:36px;font-weight:400}
h1 em{color:var(--y);font-style:italic;font-weight:300}
.subtitle{font-size:16px;color:rgba(255,255,255,.65);line-height:1.7;max-width:640px;margin:0}
.meta-row{display:flex;flex-wrap:wrap;gap:18px;margin-top:24px;font-size:13.5px;color:rgba(255,255,255,.7)}
.meta-row span{display:inline-flex;align-items:center;gap:6px}
.body{max-width:1100px;margin:0 auto;padding:48px clamp(20px,5vw,48px) 28px;display:grid;grid-template-columns:1fr 360px;gap:34px}
@media(max-width:840px){.body{grid-template-columns:1fr}}
.card{background:#fff;border:1px solid var(--bd);border-radius:14px;padding:24px}
.card h2{font-family:'Fraunces',serif;font-size:18px;font-weight:400;color:var(--td);margin:0 0 12px}
.bio{font-size:15px;line-height:1.75;color:var(--tm);white-space:pre-wrap}
.prestations-grid{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.prestation-chip{display:inline-flex;align-items:center;gap:6px;background:rgba(0,76,63,.05);border:1px solid rgba(0,76,63,.1);border-radius:999px;padding:6px 13px;font-size:13px;color:var(--g);font-weight:500}
.btn-p{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--y);color:var(--gd);font-weight:600;font-size:14.5px;padding:13px 22px;border-radius:10px;text-decoration:none;width:100%;transition:all .2s;border:none;cursor:pointer;font-family:'Outfit',sans-serif}
.btn-p:hover{background:#ffe08f}
.btn-ol{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:transparent;color:var(--g);border:1px solid rgba(0,76,63,.2);font-weight:500;font-size:14px;padding:12px 20px;border-radius:10px;text-decoration:none;width:100%;margin-top:10px}
.btn-ol:hover{background:var(--g);color:#fff;border-color:var(--g)}
.aside-row{display:flex;flex-direction:column;gap:6px;padding:10px 0;border-top:1px solid var(--bd)}
.aside-row:first-of-type{border-top:none;padding-top:0}
.aside-k{font-size:11px;color:var(--tl);text-transform:uppercase;letter-spacing:.5px;font-weight:600}
.aside-v{font-size:14px;color:var(--td);font-weight:500}
.aside-v.green{color:#1e9d54}
.contact-form input,.contact-form textarea{width:100%;padding:11px 13px;border:1px solid rgba(0,76,63,.18);border-radius:8px;background:#fff;font-family:'Outfit',sans-serif;font-size:14px;color:var(--td);margin-bottom:10px}
.contact-form input:focus,.contact-form textarea:focus{outline:none;border-color:var(--g);box-shadow:0 0 0 3px rgba(0,76,63,.1)}
.contact-form textarea{min-height:90px;resize:vertical}
.hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.disclaimer{max-width:1100px;margin:0 auto;padding:20px clamp(20px,5vw,48px) 50px;font-size:12.5px;color:var(--tl);line-height:1.7}
.disclaimer strong{color:var(--td)}
.ok-msg{padding:14px;background:rgba(0,200,100,.08);border:1px solid rgba(0,200,100,.25);border-radius:8px;color:#1e9d54;font-size:13.5px;text-align:center}
.err-msg{padding:12px 14px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.22);border-radius:8px;color:#dc2626;font-size:13px;margin-bottom:10px}
.trust-row{display:flex;align-items:center;gap:8px;padding:9px 12px;background:rgba(99,214,131,.08);border:1px solid rgba(99,214,131,.2);border-radius:8px;margin-top:12px;font-size:13px;color:#1e9d54;font-weight:500}
${VITRINE_CSS}
${SIGNATURE_CSS}
${SECTEUR_CSS}
</style>
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': canonical,
  name: displayName,
  url: canonical,
  description: desc.slice(0, 200),
  address: { '@type': 'PostalAddress', addressLocality: c.ville, addressCountry: 'FR' },
  areaServed: c.zone_couverte || c.ville,
  serviceType: 'Service de ménage pour location courte durée',
  ...(photos.length ? { image: photos.map(ph => ph.full) } : {}),
  knowsAbout: ['Ménage Airbnb', 'Turnover LCD', 'Gestion du linge', ...prestations].slice(0, 12),
  telephone: c.telephone || undefined,
  email: undefined,
  sameAs: [c.site_url, c.instagram_handle ? `https://instagram.com/${c.instagram_handle}` : null, ...reseaux.map(l => l.url)].filter(Boolean),
  ...(c.tarif_forfait_min ? {
    priceRange: c.tarif_forfait_max ? `${c.tarif_forfait_min}€-${c.tarif_forfait_max}€` : `dès ${c.tarif_forfait_min}€`,
  } : {}),
})}
</script>
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://jasonmarinho.com/' },
    { '@type': 'ListItem', position: 2, name: 'Annuaire des équipes de ménage LCD', item: 'https://jasonmarinho.com/annuaires/menage' },
    { '@type': 'ListItem', position: 3, name: displayName, item: canonical },
  ],
})}
</script>
<script defer src="/nav.js"></script>
</head>
<body>
<header class="hero">
  <div class="s-in hero-grid has-cover">
  <div>
    <div class="brd"><a href="/">Accueil</a> · <a href="/annuaires/menage">Annuaire ménage LCD</a> · <span>${escHtml(displayName)}</span></div>
    <div class="tag-row">
      ${c.reco_count > 0 ? `<span class="tag" style="background:rgba(99,214,131,.15);color:#7be29a;border:1px solid rgba(99,214,131,.35)"><i class="ph-bold ph-heart" style="font-size:10px"></i>Recommandé par ${c.reco_count} hôte${c.reco_count > 1 ? 's' : ''}</span>` : ''}
      ${c.assurance_rc_pro ? '<span class="tag green"><i class="ph-bold ph-shield-check" style="font-size:10px"></i>RC Pro</span>' : ''}
      ${equipeLabel ? `<span class="tag">${escHtml(equipeLabel)}</span>` : ''}
    </div>
    <div class="hero-id">
      ${c.logo_url
        ? `<div class="hero-logo" style="background:url('${escHtml(c.logo_url)}') center/cover"></div>`
        : `<div class="hero-logo placeholder">${escHtml(initiales(displayName))}</div>`}
      <h1>${escHtml(displayName)}<br><em>équipe de ménage pour locations courte durée ${escHtml(aVille(c.ville))}</em></h1>
    </div>
    <div class="meta-row">
      <span><i class="ph-bold ph-handshake"></i>Contact direct, sans commission</span>
      ${delaiLabel ? `<span><i class="ph-bold ph-lightning"></i>${escHtml(delaiLabel)}</span>` : ''}
      ${heure ? `<span><i class="ph-bold ph-clock"></i>${escHtml(heure)}</span>` : ''}
    </div>
    ${heroActionsHtml({ firstName, hasPhotos: photos.length > 0, external })}
  </div>
  ${photos.length ? heroCoverHtml(photos, displayName) : briefHtml(facts)}
  </div>
</header>

<div class="body">
  <div>
    ${photos.length ? briefHtml(facts, { variant: 'strip' }) : ''}
    ${galleryHtml(photos, { name: displayName, title: 'En images' })}
    ${c.bio ? `<div class="card" style="margin-bottom:20px"><h2>Présentation</h2><div class="bio">${escHtml(c.bio)}</div></div>` : ''}
    ${formulesHtml(c.formules)}
    ${prestations.length > 0 ? `<div class="card" style="margin-bottom:20px"><h2>Prestations</h2><div class="prestations-grid">${prestations.map(p => `<span class="prestation-chip"><i class="ph-bold ph-check"></i>${escHtml(p)}</span>`).join('')}</div></div>` : ''}
    ${clientelesHtml(c.clienteles, firstName)}
    ${equipeLabel || c.logements_geres || delaiLabel || langues || c.assurance_rc_pro || c.siret ? `<div class="card vt-sec">
      <h2>Capacité & disponibilité</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-top:6px">
        ${equipeLabel ? `<div><div style="font-size:11px;color:var(--tl);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:4px">Taille équipe</div><div style="font-size:14px;color:var(--td);font-weight:500">${escHtml(equipeLabel)}</div></div>` : ''}
        ${c.logements_geres ? `<div><div style="font-size:11px;color:var(--tl);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:4px">Logements gérés</div><div style="font-size:14px;color:var(--td);font-weight:500">${c.logements_geres} en parc actuel</div></div>` : ''}
        ${delaiLabel ? `<div><div style="font-size:11px;color:var(--tl);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:4px">Réactivité</div><div style="font-size:14px;color:var(--td);font-weight:500">${escHtml(delaiLabel)}</div></div>` : ''}
        ${langues ? `<div><div style="font-size:11px;color:var(--tl);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:4px">Langues</div><div style="font-size:14px;color:var(--td);font-weight:500">${escHtml(langues)}</div></div>` : ''}
      </div>
      ${c.assurance_rc_pro ? `<div class="trust-row"><i class="ph-bold ph-shield-check" style="font-size:15px"></i>Couvert par une assurance Responsabilité Civile Professionnelle</div>` : ''}
      ${c.siret ? `<div style="margin-top:10px;font-size:12px;color:var(--tl)">SIRET déclaré : <strong style="color:var(--td);font-variant-numeric:tabular-nums">${escHtml(c.siret)}</strong></div>` : ''}
    </div>` : ''}
    ${derouleHtml(c.deroule, 'menage')}
    ${secteurHtml({ ville: c.ville, zone: c.zone_couverte, villes: c.villes_couvertes, prenom: firstName, metier: 'menage' }) ?? zoneCardHtml({ ville: c.ville, zone: c.zone_couverte, villes: c.villes_couvertes, root: ROOT, prefix: 'menage-lcd', metierLabel: 'Ménage' })}
  </div>

  <aside>
    <div class="card" id="contact">
      <h2>Contacter ${escHtml(firstName)}</h2>
      ${contactFormHtml({ firstName, besoins, placeholder: 'Un détail à ajouter ? Nombre de logements, rythme des réservations (facultatif)' })}
        <p style="margin-top:10px;font-size:11.5px;color:var(--tl);line-height:1.6">Ton nom, ton e-mail et ton message sont transmis à ${escHtml(firstName)} seulement, pour te répondre, et supprimés au bout de 3 ans. <a href="/politique-de-confidentialite#annuaire" style="color:var(--g)">Confidentialité</a></p>
      </form>
      ${telHtml(c.telephone, firstName)}
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--bd);font-size:11.5px;color:var(--tl);line-height:1.6">Pas de commission. Pas d'intermédiaire. Tu négocies et contractualises directement avec l'équipe.</div>
      <div style="margin-top:12px;font-size:12px;color:var(--tm);line-height:1.6">Tu as déjà bossé avec cette équipe ? <a href="https://app.jasonmarinho.com/dashboard/recommander?type=cleaner&id=${escHtml(c.id)}" style="color:var(--g);font-weight:600">Recommande-la aux autres hôtes →</a></div>
    </div>

    ${workLinksHtml([
      c.site_url ? { href: c.site_url, label: 'Le site', icon: 'ph-globe', track: 'site' } : null,
      c.instagram_handle ? { href: `https://instagram.com/${c.instagram_handle}`, label: `@${c.instagram_handle}`, icon: 'ph-instagram-logo', track: 'instagram', rel: 'noopener' } : null,
    ], proReseauxHtml(reseaux), { title: 'L’équipe en ligne' })}

    ${guide ? `<div class="card" style="margin-top:16px">
      <h2>Les tarifs ménage ${escHtml(aVille(g?.label ?? c.ville))}</h2>
      <p style="font-size:13.5px;color:var(--tm);line-height:1.7;margin-bottom:12px">Fourchettes turnover constatées, checklist complète et questions à poser : consulte le guide local avant de demander un devis.</p>
      <a href="${guide}" class="btn-ol" style="margin-top:0"><i class="ph-bold ph-map-pin"></i>Le guide ménage ${escHtml(deVille(g?.label ?? c.ville))}</a>
    </div>` : ''}
  </aside>
</div>

<div style="max-width:1100px;margin:0 auto;padding:0 clamp(20px,5vw,48px);display:flex;gap:10px;flex-wrap:wrap">
  <a href="/annuaires/menage" style="display:inline-flex;align-items:center;gap:7px;padding:10px 16px;background:#fff;border:1px solid rgba(0,76,63,.15);border-radius:10px;font-size:13px;font-weight:600;color:var(--g);text-decoration:none"><i class="ph-bold ph-arrow-left"></i>Toutes les équipes ménage LCD</a>
  ${guide ? `<a href="${guide}" style="display:inline-flex;align-items:center;gap:7px;padding:10px 16px;background:#fff;border:1px solid rgba(0,76,63,.15);border-radius:10px;font-size:13px;font-weight:600;color:var(--g);text-decoration:none">Le guide ménage ${escHtml(deVille(g?.label ?? c.ville))}<i class="ph-bold ph-arrow-right"></i></a>` : ''}
</div>

<div class="disclaimer">
  <strong>Bon à savoir.</strong> Cette mise en relation est gratuite pour toi. Le devis, le contrat et le paiement de la prestation se font directement entre toi et ${escHtml(displayName)}, sans commission ni intermédiaire de notre part.
</div>

<script>
const __slug = "${escHtml(c.slug)}";
const __t0 = Date.now();
// Tracking vues + clics sortants → /api/cleaner/track (voir fiche photographe)
function jmTrack(ev) {
  try { navigator.sendBeacon('/api/cleaner/track', JSON.stringify({ slug: __slug, event: ev })) } catch (e) {}
}
try {
  var __vk = 'jm_v_' + __slug;
  if (!sessionStorage.getItem(__vk)) { sessionStorage.setItem(__vk, '1'); jmTrack('view'); }
} catch (e) { jmTrack('view'); }
async function contactSubmit(e) {
  e.preventDefault();
  const errBox = document.getElementById('contact-err');
  const btn = document.getElementById('contact-btn');
  errBox.style.display = 'none';
  btn.disabled = true; btn.innerHTML = '<i class="ph-bold ph-spinner"></i> Envoi…';
  const f = e.target;
  const data = {
    slug: __slug,
    contactName: f.contactName.value.trim(),
    contactEmail: f.contactEmail.value.trim(),
    message: window.jmContactMessage ? jmContactMessage(f) : f.message.value.trim(),
    website: f.website ? f.website.value : '',
    t: __t0,
  };
  if (data.message.length < 20) {
    errBox.textContent = 'Dis-moi ce qu\\'il te faut et ton logement, ou écris quelques mots.';
    errBox.style.display = 'block';
    btn.disabled = false; btn.innerHTML = '<i class="ph-bold ph-paper-plane-tilt"></i>Envoyer à ${escHtml(firstName)}';
    return false;
  }
  try {
    const res = await fetch('/api/cleaner/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      errBox.textContent = body.error || 'Erreur lors de l\\'envoi. Réessaye.';
      errBox.style.display = 'block';
      btn.disabled = false; btn.innerHTML = '<i class="ph-bold ph-paper-plane-tilt"></i>Envoyer à ${escHtml(firstName)}';
      return false;
    }
    document.getElementById('contact-form').outerHTML = '<div class="ok-msg"><strong>Message envoyé ✓</strong><br>${escHtml(firstName)} te recontacte généralement sous 48h.</div>';
  } catch (err) {
    errBox.textContent = 'Réseau indisponible.';
    errBox.style.display = 'block';
    btn.disabled = false;
  }
  return false;
}
</script>
${stickyBarHtml({ firstName, hasPhotos: photos.length > 0, external })}
${VITRINE_JS}
${CONTACT_JS}
${SECTEUR_JS}
<script defer src="/calendrier.js"></script>
<script defer src="/footer.js"></script>
<script src="/cookie-banner.js" defer></script>
</body>
</html>
`
}

export function buildAnnuaireListPage(items) {
  const cfg = ANNUAIRES.menage
  const { byPro, counts } = cityCoverage(ROOT, cfg.prefix, items)
  const itemsHtml = items.length === 0
    ? emptyHtml(cfg)
    : `<div class="grid">${items.map(c => {
        const displayName = nomAffiche(c.pseudo || c.full_name)
        const forfait = fmtForfait(c)
        const heure = c.tarif_heure ? `${c.tarif_heure} €/h` : null
        const des = prixDes(c.formules, c.tarif_forfait_min)
        const tarifLine = des ?? [forfait, heure].filter(Boolean).join(' · ')
        const equipeLabel = c.equipe_type ? EQUIPE_LABELS[c.equipe_type] : null
        const searchBlob = normalizeSearch([searchWords(c, byPro.get(c.id)), equipeLabel].filter(Boolean).join(' '))
        const photos = vitrinePhotos(c.portfolio_photos, SUPABASE_URL, Math.min(PHOTO_LIMIT, CARD_PHOTOS_MAX))
        const villes = (Array.isArray(c.villes_couvertes) ? c.villes_couvertes : []).filter(v => v && v !== c.ville)
        const prestationsBlob = (c.prestations || []).join(' ')
        const extra = [equipeLabel, c.assurance_rc_pro ? 'assurance RC pro' : null, c.reco_count > 0 ? `recommandée par ${c.reco_count} hôte${c.reco_count > 1 ? 's' : ''}` : null].filter(Boolean).join(' · ')
        return proCardHtml({
          href: `/annuaires/menage/${c.slug}`,
          attrs: `data-search="${escHtml(searchBlob)}" data-equipe="${escHtml(c.equipe_type || '')}" data-delai="${escHtml(c.delai_reservation || '')}" data-assurance="${c.assurance_rc_pro ? '1' : '0'}" data-prestations="${escHtml(prestationsBlob)}" data-tarif-min="${c.tarif_forfait_min ?? ''}" data-tarif-max="${c.tarif_forfait_max ?? ''}"`,
          name: displayName, metier: 'Équipe de ménage', ville: c.ville,
          lieu: cardLieu(villes, c.zone_couverte, 'aussi à'),
          extra: extra ? extra.charAt(0).toUpperCase() + extra.slice(1) : '',
          tarif: tarifLine,
          photos, logoUrl: c.logo_url, alt: `Photo de ${displayName}`,
        })
      }).join('')}</div>`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(cfg.title)}</title>
<meta name="description" content="${escHtml(cfg.desc)}">
<link rel="canonical" href="https://jasonmarinho.com/annuaires/menage">
<meta property="og:title" content="${escHtml(cfg.title)}">
<meta property="og:description" content="${escHtml(cfg.desc)}">
<meta property="og:url" content="https://jasonmarinho.com/annuaires/menage">
<meta property="og:type" content="website">
<meta property="og:image" content="https://jasonmarinho.com/couverture-jason.webp">
<meta name="robots" content="index, follow">
<link rel="shortcut icon" href="/favicon.ico">
<link rel="icon" href="/favicon.ico?v=2026-06" sizes="any">
<link rel="manifest" href="/manifest.json?v=2026-06">
<link rel="stylesheet" href="/fonts/site-fonts.css?v=0e07aaf42e">
<link rel="stylesheet" type="text/css" href="/fonts/phosphor-bold-subset.css?v=29999e9550">
<style>
:root{--g:#004C3F;--gd:#003329;--y:#FFD56B;--cr:#F7F5F0;--w:#FDFCF9;--td:#0F1A0D;--tm:#3D5038;--tl:#7A8C77;--bd:rgba(0,76,63,.09)}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Outfit',sans-serif;background:var(--cr);color:var(--td);padding-top:64px}
body::before{content:'';position:fixed;top:0;left:0;right:0;height:64px;background:var(--gd);z-index:100}
a{color:inherit}
.hero{background:linear-gradient(160deg,#001a11 0%,var(--gd) 55%,#00463a 100%);padding:48px 0;color:#fff}
.s-in{max-width:1100px;margin:0 auto;padding:0 clamp(16px,5vw,40px)}
.brd{font-size:13px;color:rgba(255,255,255,.4);margin-bottom:18px}
.brd a{color:rgba(255,255,255,.55);text-decoration:none}
.lbl{display:inline-block;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,213,107,.7);margin-bottom:14px}
h1{font-family:'Fraunces',serif;font-size:clamp(28px,4vw,42px);font-weight:400;line-height:1.15;letter-spacing:-.4px;margin:0 0 12px}
h1 em{color:var(--y);font-style:italic;font-weight:300}
.lead{font-size:15.5px;color:rgba(255,255,255,.7);line-height:1.7;max-width:640px}
.count-pill{display:inline-flex;align-items:center;gap:8px;background:rgba(255,213,107,.1);border:1px solid rgba(255,213,107,.25);border-radius:100px;padding:7px 16px;font-size:13px;font-weight:600;color:#FFD56B;margin-top:14px}
.tools-row{max-width:820px;margin:-30px auto 0;padding:0 clamp(16px,5vw,40px);position:relative;z-index:5;display:flex;gap:10px;align-items:stretch;flex-wrap:wrap}
.search-bar{flex:1;min-width:220px;display:flex;align-items:center;gap:12px;background:#fff;border:1px solid var(--bd);border-radius:16px;padding:6px 8px 6px 22px;box-shadow:0 14px 36px rgba(0,30,20,.16)}
.search-ico{color:var(--g);font-size:17px;flex-shrink:0}
.search-bar input{flex:1;min-width:0;border:none;outline:none;font-family:'Outfit',sans-serif;font-size:15px;color:var(--td);padding:15px 0;background:transparent}
.search-bar input::placeholder{color:var(--tl)}
.search-clear{display:none;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;border:none;background:rgba(0,76,63,.06);color:var(--tm);cursor:pointer;flex-shrink:0;font-size:13px}
.search-clear:hover{background:rgba(0,76,63,.12)}
.search-count{font-size:12px;font-weight:600;color:var(--tl);white-space:nowrap;padding:0 6px 0 2px;flex-shrink:0}
.filters-btn{display:inline-flex;align-items:center;gap:9px;background:#fff;border:1px solid var(--bd);border-radius:16px;padding:0 20px;box-shadow:0 14px 36px rgba(0,30,20,.16);font-size:14px;font-weight:600;color:var(--td);cursor:pointer;font-family:'Outfit',sans-serif;white-space:nowrap}
.filters-btn:hover{border-color:rgba(0,76,63,.3)}
.filters-badge{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;border-radius:999px;background:var(--g);color:#fff;font-size:10.5px;font-weight:700;padding:0 5px}
.main{max-width:1100px;margin:0 auto;padding:50px clamp(16px,5vw,40px) 40px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}
.search-empty{display:none;padding:44px 20px;text-align:center;background:#fff;border:1px solid var(--bd);border-radius:16px;max-width:560px;margin:0 auto}
.search-empty-ico{display:inline-flex;width:64px;height:64px;border-radius:16px;background:rgba(0,76,63,.06);align-items:center;justify-content:center;margin-bottom:14px;color:var(--g);font-size:26px}
.search-empty h3{font-family:'Fraunces',serif;font-size:18px;font-weight:400;color:var(--td);margin:0 0 8px;line-height:1.3}
.search-empty p{font-size:13px;line-height:1.65;color:var(--tm);margin:0 0 16px}
.search-empty a{color:var(--g);font-weight:600;text-decoration:underline}
.search-empty button{display:inline-flex;align-items:center;gap:7px;background:transparent;border:1px solid rgba(0,76,63,.2);color:var(--g);font-weight:500;font-size:13px;padding:10px 18px;border-radius:10px;cursor:pointer;font-family:'Outfit',sans-serif}
.search-empty button:hover{background:var(--g);color:#fff;border-color:var(--g)}
@media(max-width:480px){
  .search-empty{padding:30px 16px}
  .search-empty-ico{width:52px;height:52px;font-size:21px;margin-bottom:11px}
  .search-empty h3{font-size:16px}
  .search-empty p{font-size:12.5px}
}
.filters-backdrop{display:none;position:fixed;inset:0;background:rgba(0,20,14,.45);z-index:200;align-items:center;justify-content:center;padding:20px}
.filters-backdrop.open{display:flex}
.filters-modal{background:#fff;border-radius:18px;width:100%;max-width:460px;max-height:min(680px,86vh);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 80px rgba(0,20,14,.35)}
.filters-head{display:flex;align-items:center;justify-content:center;position:relative;padding:18px 20px;border-bottom:1px solid var(--bd);flex-shrink:0}
.filters-title{font-family:'Fraunces',serif;font-size:17px;font-weight:500;color:var(--td)}
.filters-close{position:absolute;right:14px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;border:none;background:transparent;color:var(--td);font-size:17px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.filters-close:hover{background:rgba(0,76,63,.06)}
.filters-body{padding:22px clamp(16px,4vw,22px) 6px;overflow-y:auto;flex:1}
.filters-section{padding-bottom:22px;margin-bottom:22px;border-bottom:1px solid var(--bd)}
.filters-section:last-child{border-bottom:none;margin-bottom:0}
.filters-section h3{font-family:'Fraunces',serif;font-size:15.5px;font-weight:500;color:var(--td);margin:0 0 14px}
.filters-options{display:flex;flex-wrap:wrap;gap:8px}
.filters-opt{font-size:13px;padding:9px 16px;border-radius:10px;border:1px solid var(--bd);background:#fff;color:var(--tm);cursor:pointer;font-family:'Outfit',sans-serif;transition:all .15s}
.filters-opt:hover{border-color:rgba(0,76,63,.3)}
.filters-opt.active{background:var(--td);border-color:var(--td);color:#fff}
.filters-toggle-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
.filters-toggle-label{font-size:13.5px;color:var(--td);font-weight:500}
.filters-toggle-sub{font-size:11.5px;color:var(--tl);margin-top:2px}
.filters-toggle{position:relative;width:42px;height:24px;border-radius:999px;background:var(--bd);border:none;cursor:pointer;flex-shrink:0}
.filters-toggle::after{content:'';position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .15s;box-shadow:0 1px 3px rgba(0,0,0,.25)}
.filters-toggle.active{background:var(--g)}
.filters-toggle.active::after{transform:translateX(18px)}
.filters-price{display:flex;gap:14px}
.filters-price-field{flex:1;min-width:0}
.filters-price-field label{display:block;font-size:11px;font-weight:600;color:var(--tl);text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px}
.filters-price-field .fx{display:flex;align-items:center;border:1px solid var(--bd);border-radius:10px;padding:0 12px}
.filters-price-field .fx span{color:var(--tl);font-size:13px}
.filters-price-field input{border:none;outline:none;padding:11px 6px;font-size:14px;width:100%;min-width:0;font-family:'Outfit',sans-serif;color:var(--td)}
.filters-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px;border-top:1px solid var(--bd);flex-shrink:0}
.filters-clear{background:transparent;border:none;font-size:14px;font-weight:600;color:var(--td);text-decoration:underline;cursor:pointer;font-family:'Outfit',sans-serif;padding:6px 0}
.filters-apply{background:var(--g);color:#fff;border:none;border-radius:10px;padding:13px 20px;font-size:13.5px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;white-space:nowrap}
.filters-apply:hover{background:#00382e}
.card{display:flex;flex-direction:column;gap:12px;padding:24px;background:#fff;border:1px solid var(--bd);border-radius:16px;text-decoration:none;color:inherit;transition:transform .2s,box-shadow .2s}
.card:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(0,76,63,.1)}
.card-head{display:flex;align-items:flex-start;gap:14px}
.card-head-txt{flex:1;min-width:0}
.card-tag{display:inline-flex;align-items:center;gap:5px;font-size:9.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:3px 9px;border-radius:999px;background:#eee;color:#666;flex-shrink:0;margin-top:2px}
.card-tag.gold{background:rgba(255,213,107,.15);color:#b8860b;border:1px solid rgba(255,213,107,.4)}
.card-name{font-family:'Fraunces',serif;font-size:18px;font-weight:400;color:var(--td);margin:0 0 5px;letter-spacing:-.2px;line-height:1.25}
.card-logo{width:52px;height:52px;border-radius:13px;flex-shrink:0;border:1px solid var(--bd);overflow:hidden;display:flex;align-items:center;justify-content:center}
.card-logo.placeholder{background:rgba(0,76,63,.06);color:var(--g);font-family:'Fraunces',serif;font-size:19px;font-weight:500}
.card-ville{font-size:13px;color:var(--tm);font-weight:600;display:flex;align-items:center;gap:5px}
.card-ville i{color:var(--g);font-size:13px}
.card-zone{font-size:12.5px;color:var(--tl);line-height:1.55;padding:8px 12px;background:rgba(0,76,63,.035);border-radius:9px}
.card-zone strong{color:var(--tm);font-weight:600}
.card-chips{display:flex;flex-wrap:wrap;gap:6px}
.card-spe{font-size:12px;font-weight:500;color:var(--g);background:rgba(0,76,63,.06);padding:4px 10px;border-radius:999px}
.card-rc{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:#1e9d54;background:rgba(99,214,131,.10);border:1px solid rgba(99,214,131,.28);padding:4px 10px;border-radius:999px}
.card-foot{margin-top:auto;padding-top:14px;border-top:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.card-tarif{font-size:14.5px;color:var(--td);font-weight:600;font-family:'Fraunces',serif}
.card-tarif span{font-family:'Outfit',sans-serif;font-size:11.5px;font-weight:400;color:var(--tl)}
.card-cta{font-size:12.5px;font-weight:600;color:var(--g);display:inline-flex;align-items:center;gap:5px}
.empty{padding:60px 20px;text-align:center;background:#fff;border:1px solid var(--bd);border-radius:16px;max-width:640px;margin:0 auto}
.empty-ico{display:inline-flex;width:80px;height:80px;border-radius:18px;background:rgba(0,76,63,.06);align-items:center;justify-content:center;margin-bottom:18px}
.empty h2{font-family:'Fraunces',serif;font-size:22px;color:var(--td);margin:0 0 12px;font-weight:400}
.empty p{font-size:14px;line-height:1.7;color:var(--tm);margin:0 0 20px}
.btn-p{display:inline-flex;align-items:center;gap:8px;background:var(--y);color:var(--gd);font-weight:600;padding:12px 22px;border-radius:10px;text-decoration:none}
.villes-section{max-width:1100px;margin:34px auto 0;padding:0 clamp(16px,5vw,40px)}
.villes-in{padding:28px;background:#fff;border:1px solid var(--bd);border-radius:16px}
.villes-h{font-family:'Fraunces',serif;font-size:20px;font-weight:400;color:var(--td);margin:0 0 8px;letter-spacing:-.2px}
.villes-h em{color:var(--g);font-style:italic;font-weight:300}
.villes-p{font-size:13.5px;color:var(--tm);margin:0 0 16px;line-height:1.6}
.villes-chips{display:flex;flex-wrap:wrap;gap:7px}
.villes-chips a{font-size:12.5px;padding:6px 12px;border-radius:8px;background:rgba(0,76,63,.04);color:var(--tm);text-decoration:none;border:1px solid transparent;transition:all .18s;white-space:nowrap}
.villes-chips a:hover{color:var(--g);border-color:rgba(0,76,63,.2);background:rgba(0,76,63,.07)}
.disclaimer{max-width:1100px;margin:30px auto 0;padding:0 clamp(16px,5vw,40px) 50px;font-size:12.5px;color:var(--tl);line-height:1.7}
.preview-section{max-width:1100px;margin:30px auto 0;padding:0 clamp(16px,5vw,40px)}
.preview-card{display:flex;gap:24px;padding:28px;background:#fff;border:1px solid var(--bd);border-radius:16px;align-items:center;flex-wrap:wrap}
.preview-card-text{flex:1;min-width:240px}
.preview-lbl{display:inline-block;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--g);background:rgba(0,76,63,.06);border:1px solid rgba(0,76,63,.15);border-radius:100px;padding:4px 11px;margin-bottom:12px}
.preview-h{font-family:'Fraunces',serif;font-size:22px;font-weight:400;color:var(--td);margin:0 0 10px;letter-spacing:-.2px;line-height:1.25}
.preview-h em{color:var(--g);font-style:italic;font-weight:300}
.preview-p{font-size:14px;color:var(--tm);line-height:1.7;margin:0 0 14px}
.preview-cta{display:inline-flex;align-items:center;gap:7px;background:var(--g);color:#fff;font-weight:600;font-size:13.5px;padding:11px 20px;border-radius:10px;text-decoration:none}
.preview-cta:hover{background:#005a4a}
.preview-thumb{flex-shrink:0;width:170px;height:170px;border-radius:14px;background:linear-gradient(160deg,#001a11,var(--gd) 60%,#00463a);display:flex;align-items:center;justify-content:center;color:var(--y);font-size:54px}
@media(max-width:640px){.preview-thumb{width:100%;height:140px}}
${ANNUAIRE_CSS}
</style>
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Annuaire des équipes de ménage Airbnb et location courte durée',
  description: cfg.desc,
  url: 'https://jasonmarinho.com/annuaires/menage',
})}
</script>
<script type="application/ld+json">
${faqJsonLd(cfg)}
</script>
<script defer src="/nav.js"></script>
</head>
<body>
<header class="hero">
  <div class="s-in">
    ${heroInnerHtml(cfg, '<a href="/">Accueil</a> · <span>Ménage Airbnb</span>')}
  </div>
</header>

${items.length > 0 ? `<div class="tools-row">
  <div class="search-bar">
    <i class="ph-bold ph-map-pin search-ico" aria-hidden="true"></i>
    <input type="text" id="pro-search" placeholder="Où est ton logement ? Lyon, Annecy, Biarritz…" autocomplete="off" aria-label="Rechercher une équipe de ménage par ville">
    <span class="search-count" id="search-count"></span>
    <button type="button" class="search-clear" id="search-clear" aria-label="Effacer la recherche"><i class="ph-bold ph-x"></i></button>
  </div>
  <button type="button" class="filters-btn" id="filters-open">
    <i class="ph-bold ph-sliders-horizontal"></i> Filtres
    <span class="filters-badge" id="filters-badge" style="display:none">0</span>
  </button>
</div>
${demandeBandHtml(cfg)}

<div class="filters-backdrop" id="filters-backdrop">
  <div class="filters-modal" role="dialog" aria-modal="true" aria-label="Filtres">
    <div class="filters-head">
      <span class="filters-title">Filtres</span>
      <button type="button" class="filters-close" id="filters-close" aria-label="Fermer"><i class="ph-bold ph-x"></i></button>
    </div>
    <div class="filters-body">
      <div class="filters-section">
        <h3>Type d'équipe</h3>
        <div class="filters-options" id="f-equipe">
          ${Object.entries(EQUIPE_LABELS).map(([slug, label]) => `<button type="button" class="filters-opt" data-value="${escHtml(slug)}">${escHtml(label)}</button>`).join('')}
        </div>
      </div>
      <div class="filters-section">
        <h3>Prestations</h3>
        <div class="filters-options" id="f-prestations">
          ${Object.entries(PRESTATIONS_LABELS).map(([slug, label]) => `<button type="button" class="filters-opt" data-value="${escHtml(slug)}">${escHtml(label)}</button>`).join('')}
        </div>
      </div>
      <div class="filters-section">
        <h3>Garanties</h3>
        <div class="filters-toggle-row">
          <div>
            <div class="filters-toggle-label">Assurance RC pro uniquement</div>
            <div class="filters-toggle-sub">Couverture en cas de dommage pendant l'intervention</div>
          </div>
          <button type="button" class="filters-toggle" id="f-assurance" aria-pressed="false"></button>
        </div>
      </div>
      <div class="filters-section">
        <h3>Délai de réservation</h3>
        <div class="filters-options" id="f-delai">
          ${Object.entries(DELAI_LABELS).map(([slug, label]) => `<button type="button" class="filters-opt" data-value="${escHtml(slug)}">${escHtml(label)}</button>`).join('')}
        </div>
      </div>
      <div class="filters-section">
        <h3>Fourchette de tarif</h3>
        <div class="filters-price">
          <div class="filters-price-field">
            <label for="f-min">Minimum</label>
            <div class="fx"><span>€</span><input type="number" id="f-min" inputmode="numeric" placeholder="0" min="0"></div>
          </div>
          <div class="filters-price-field">
            <label for="f-max">Maximum</label>
            <div class="fx"><span>€</span><input type="number" id="f-max" inputmode="numeric" placeholder="500+" min="0"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="filters-foot">
      <button type="button" class="filters-clear" id="filters-clear">Tout effacer</button>
      <button type="button" class="filters-apply" id="filters-apply">Afficher <span id="filters-count">${items.length}</span> <span id="filters-count-word">équipe${items.length > 1 ? 's' : ''}</span></button>
    </div>
  </div>
</div>` : ''}

<main class="main">
${itemsHtml}
${items.length > 0 ? `<div class="search-empty" id="search-empty">
  <div class="search-empty-ico"><i class="ph-bold ph-map-trifold"></i></div>
  <h3>Pas encore d'équipe à «<span id="search-empty-q"></span>»</h3>
  <p>L’annuaire grandit chaque semaine. Décris ton besoin : ta demande partira aux pros de ta zone. Le <a href="#villes">guide de ta ville</a> te donne aussi les tarifs constatés.</p>
  <p><a href="/trouver-un-pro?metier=menage" id="search-demande" style="display:inline-flex;align-items:center;gap:7px;padding:10px 16px;border-radius:10px;background:var(--g);color:#fff;font-weight:600;text-decoration:none"><i class="ph-bold ph-paper-plane-tilt"></i>Décrire mon besoin</a></p>
  <button type="button" id="search-reset"><i class="ph-bold ph-arrow-counter-clockwise"></i>Voir toutes les équipes</button>
</div>` : ''}
<section style="margin:40px auto 0;max-width:1100px;padding:26px clamp(18px,4vw,30px);border-radius:18px;background:#F2F8F4;border:1px solid rgba(0,76,63,.14);display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between">
  <div style="flex:1 1 320px;min-width:0">
    <div style="font-size:10.5px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#004C3F;margin-bottom:8px"><i class="ph-bold ph-house-line"></i> Tu es hôte ?</div>
    <h2 style="font-family:'Fraunces',serif;font-weight:500;font-size:clamp(20px,2.6vw,26px);line-height:1.25;color:#0F1A0D;margin:0 0 8px">Ton planning ménage, rempli tout seul</h2>
    <p style="margin:0;font-size:14.5px;line-height:1.65;color:#3D5038">Connecte ton calendrier Airbnb ou Booking : les ménages se calculent tout seuls et ton équipe reçoit son planning, puis t'envoie ses photos. Gratuit, sans carte bancaire.</p>
  </div>
  <a href="https://app.jasonmarinho.com/auth/register" style="flex:0 1 auto;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 22px;border-radius:10px;background:#004C3F;color:#fff;font-weight:600;font-size:15px;text-decoration:none">Créer mon compte gratuit <i class="ph-bold ph-arrow-right"></i></a>
</section>
</main>

${items.length > 0 ? `<script>
(function(){
  function norm(s){ return (s || '').toString().toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim() }
  var input      = document.getElementById('pro-search')
  var clear      = document.getElementById('search-clear')
  var reset      = document.getElementById('search-reset')
  var countEl    = document.getElementById('search-count')
  var emptyEl    = document.getElementById('search-empty')
  var emptyQ     = document.getElementById('search-empty-q')
  var grid       = document.querySelector('.grid')
  var cards      = grid ? Array.prototype.slice.call(grid.querySelectorAll('.card')) : []
  if (!input || !cards.length) return

  // ── Modal Filtres ──────────────────────────────────────────────────
  var backdrop     = document.getElementById('filters-backdrop')
  var openBtn      = document.getElementById('filters-open')
  var closeBtn     = document.getElementById('filters-close')
  var applyBtn     = document.getElementById('filters-apply')
  var clearBtn     = document.getElementById('filters-clear')
  var badge        = document.getElementById('filters-badge')
  var countPreview = document.getElementById('filters-count')
  var countWord    = document.getElementById('filters-count-word')
  var equipeOpts   = Array.prototype.slice.call(document.querySelectorAll('#f-equipe .filters-opt'))
  var prestaOpts   = Array.prototype.slice.call(document.querySelectorAll('#f-prestations .filters-opt'))
  var delaiOpts    = Array.prototype.slice.call(document.querySelectorAll('#f-delai .filters-opt'))
  var assuranceBtn = document.getElementById('f-assurance')
  var minInput     = document.getElementById('f-min')
  var maxInput     = document.getElementById('f-max')

  var state = { equipe: null, delai: null, assurance: false, prestations: [], min: null, max: null }

  function openModal(){ backdrop.classList.add('open'); previewCount() }
  function closeModal(){ backdrop.classList.remove('open') }
  openBtn.addEventListener('click', openModal)
  closeBtn.addEventListener('click', closeModal)
  backdrop.addEventListener('click', function(e){ if (e.target === backdrop) closeModal() })

  // Sélection unique (équipe, délai) : reclique = désélectionne
  function wireSingleSelect(opts, onChange){
    opts.forEach(function(opt){
      opt.addEventListener('click', function(){
        var val = opt.getAttribute('data-value')
        var next = opt.classList.contains('active') ? null : val
        opts.forEach(function(o){ o.classList.remove('active') })
        if (next) opt.classList.add('active')
        onChange(next)
        previewCount()
      })
    })
  }
  wireSingleSelect(equipeOpts, function(v){ state.equipe = v })
  wireSingleSelect(delaiOpts, function(v){ state.delai = v })

  // Sélection multiple (prestations)
  prestaOpts.forEach(function(opt){
    opt.addEventListener('click', function(){
      var val = opt.getAttribute('data-value')
      var idx = state.prestations.indexOf(val)
      if (idx === -1) { state.prestations.push(val); opt.classList.add('active') }
      else { state.prestations.splice(idx, 1); opt.classList.remove('active') }
      previewCount()
    })
  })

  assuranceBtn.addEventListener('click', function(){
    state.assurance = !state.assurance
    assuranceBtn.classList.toggle('active', state.assurance)
    assuranceBtn.setAttribute('aria-pressed', String(state.assurance))
    previewCount()
  })
  minInput.addEventListener('input', function(){ state.min = minInput.value ? Number(minInput.value) : null; previewCount() })
  maxInput.addEventListener('input', function(){ state.max = maxInput.value ? Number(maxInput.value) : null; previewCount() })

  function matchesFilters(c){
    if (state.equipe && c.getAttribute('data-equipe') !== state.equipe) return false
    if (state.delai && c.getAttribute('data-delai') !== state.delai) return false
    if (state.assurance && c.getAttribute('data-assurance') !== '1') return false
    if (state.prestations.length) {
      var have = (c.getAttribute('data-prestations') || '').split(' ')
      for (var i = 0; i < state.prestations.length; i++) {
        if (have.indexOf(state.prestations[i]) === -1) return false
      }
    }
    var tMin = c.getAttribute('data-tarif-min'), tMax = c.getAttribute('data-tarif-max')
    tMin = tMin ? Number(tMin) : null
    tMax = tMax ? Number(tMax) : null
    // Chevauchement de fourchette. Pas de tarif renseigné = jamais exclu.
    if (state.min != null && tMax != null && tMax < state.min) return false
    if (state.max != null && tMin != null && tMin > state.max) return false
    return true
  }

  function activeFilterGroups(){
    return (state.equipe ? 1 : 0) + (state.delai ? 1 : 0) + (state.assurance ? 1 : 0) +
      (state.prestations.length ? 1 : 0) + (state.min != null || state.max != null ? 1 : 0)
  }

  function previewCount(){
    var n = 0
    cards.forEach(function(c){ if (matchesFilters(c)) n++ })
    countPreview.textContent = n
    countWord.textContent = n > 1 ? 'équipes' : 'équipe'
    applyBtn.disabled = n === 0
    var activeCount = activeFilterGroups()
    if (activeCount > 0) { badge.style.display = 'inline-flex'; badge.textContent = activeCount } else { badge.style.display = 'none' }
    clearBtn.style.color = activeCount > 0 ? 'var(--td)' : 'var(--tl)'
  }

  function clearFilters(){
    state = { equipe: null, delai: null, assurance: false, prestations: [], min: null, max: null }
    equipeOpts.concat(prestaOpts, delaiOpts).forEach(function(o){ o.classList.remove('active') })
    assuranceBtn.classList.remove('active'); assuranceBtn.setAttribute('aria-pressed', 'false')
    minInput.value = ''; maxInput.value = ''
    previewCount()
  }
  clearBtn.addEventListener('click', clearFilters)
  applyBtn.addEventListener('click', function(){ closeModal(); apply() })

  // ── Recherche + filtres combinés ────────────────────────────────────
  function apply(){
    var q = norm(input.value)
    var shown = 0
    cards.forEach(function(c){
      var searchOk = !q || (c.getAttribute('data-search') || '').indexOf(q) !== -1
      if (searchOk && matchesFilters(c)) shown++
    })
    var noResults = shown === 0
    cards.forEach(function(c){
      var searchOk = !q || (c.getAttribute('data-search') || '').indexOf(q) !== -1
      var match = searchOk && matchesFilters(c)
      c.style.display = match ? '' : 'none'
    })
    countEl.textContent = q ? (noResults ? '' : shown + ' résultat' + (shown > 1 ? 's' : '')) : ''
    clear.style.display = q ? 'inline-flex' : 'none'
    if (emptyEl) emptyEl.style.display = noResults ? 'block' : 'none'
    if (emptyQ) emptyQ.textContent = input.value.trim() || 'ces filtres'
    if (grid) grid.style.display = noResults ? 'none' : ''
  }
  input.addEventListener('input', apply)
  clear.addEventListener('click', function(){ input.value = ''; apply(); input.focus() })
  if (reset) reset.addEventListener('click', function(){ input.value = ''; clearFilters(); apply(); input.focus() })
  apply()
})()
</script>` : ''}

${guideHtml(cfg)}

${faqHtml(cfg)}

${villesGuidesHtml(cfg, loadCities(), counts)}

<div class="disclaimer">
  <strong>Comment ça marche.</strong> Tu cliques sur une équipe, tu regardes ses formules et ses prestations, et tu lui envoies une demande depuis sa fiche. Aucune commission, aucun intermédiaire : le devis, les passages et le paiement se règlent directement entre vous.
</div>
${joinLineHtml(cfg)}
${items.length > 0 ? CITY_PICKS_JS : ''}

<script defer src="/footer.js"></script>
<script src="/cookie-banner.js" defer></script>
</body>
</html>
`
}


// ── Villes depuis footer.js (source unique) pour la section "Guides par ville"
function loadCities() {
  const src = fs.readFileSync(path.join(ROOT, 'footer.js'), 'utf8')
  const start = src.indexOf('var CITIES = [')
  if (start === -1) return []
  const open = src.indexOf('[', start)
  const end = src.indexOf('];', open)
  if (end === -1) return []
  try { return new Function('return ' + src.slice(open, end + 1))() } catch { return [] }
}

function villesSectionHtml(prefix, label) {
  const cities = loadCities()
  if (!cities.length) return ''
  const chips = cities.map(c =>
    `<a href="/${prefix}-${c.slug}">${escHtml(c.name)}</a>`
  ).join('')
  return `<section class="villes-section" id="villes">
  <div class="villes-in">
    <h2 class="villes-h">Guides ${label} <em>par ville</em></h2>
    <p class="villes-p">Tarifs locaux constatés, checklists et conseils pour choisir ton prestataire, ville par ville.</p>
    <div class="villes-chips">${chips}</div>
  </div>
</section>`
}

function buildSitemap(items) {
  const today = new Date().toISOString().slice(0, 10)
  const urls = [
    `  <url><loc>https://jasonmarinho.com/annuaires/menage</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.85</priority></url>`,
    `  <url><loc>https://jasonmarinho.com/devenir-prestataire-menage-lcd</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    `  <url><loc>https://jasonmarinho.com/annuaires/menage/inscription</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`,
    ...items.map(c => {
      return `  <url><loc>https://jasonmarinho.com/annuaires/menage/${c.slug}</loc><lastmod>${(c.created_at || today).slice(0, 10)}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`
    }),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`
}

async function main() {
  // Fiches d'un compte admin (démonstration) : jamais publiées
  const demo = await adminOwnedIds({ supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY, table: 'cleaners' })
  const items = (await fetchActive()).filter(p => !demo.has(p.id))
  if (demo.size) console.log(`[build-cleaners] ${demo.size} fiche(s) de compte admin écartée(s)`)
  const recoCounts = await fetchRecoCounts()
  for (const c of items) c.reco_count = recoCounts.get(c.id) ?? 0
  PHOTO_LIMIT = photoLimitFromViews(await fetchMonthViews())
  if (PHOTO_LIMIT < 6) console.log('[build-cleaners] Vues du mois élevées : photo principale seulement (offre gratuite Supabase)')

  // Clean menage dir : on supprime UNIQUEMENT les sous-dossiers de fiches
  // (slugs). Hub + annuaire + inscription + exemple-fiche (RESERVED_DIRS)
  // sont intouchables : sinon le rm casse tout le hub /annuaires/menage/.
  if (fs.existsSync(FICHES_DIR)) {
    for (const entry of fs.readdirSync(FICHES_DIR, { withFileTypes: true })) {
      if (entry.isDirectory() && !RESERVED_DIRS.has(entry.name)) {
        fs.rmSync(path.join(FICHES_DIR, entry.name), { recursive: true, force: true })
      }
    }
  } else {
    fs.mkdirSync(FICHES_DIR, { recursive: true })
  }

  for (const c of items) {
    const dir = path.join(FICHES_DIR, c.slug)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'index.html'), buildFichePage(c), 'utf8')
  }

  // Génère l'annuaire directement sur /annuaires/menage (index du hub).
  // L'ancienne URL /annuaires/menage/annuaire redirige en 301 (vercel.json).
  fs.writeFileSync(path.join(FICHES_DIR, 'index.html'), buildAnnuaireListPage(items), 'utf8')

  fs.writeFileSync(path.join(ROOT, 'sitemap-menages.xml'), buildSitemap(items), 'utf8')

  // Injecte les équipes actives dans leurs pages ville SEO (/menage-lcd-{ville})
  const villesEnrichies = injectProsIntoVillePages({
    root: ROOT,
    prefix: 'menage-lcd',
    metier: 'équipe ménage LCD',
    pros: items.map(c => ({
      ville: c.ville,
      zone: c.zone_couverte,
      url: `/annuaires/menage/${c.slug}`,
      name: nomAffiche(c.pseudo || c.full_name),
      sub: fmtForfait(c) ? `Forfait ${fmtForfait(c)}` : null,
    })),
  })
  console.log(`[build-cleaners] ${villesEnrichies} page(s) ville enrichie(s)`)


  console.log(`[build-cleaners] ✓ ${items.length} fiches + annuaire + sitemap`)
}


// Lancé directement (build) : génère tout. Importé (fiches d'exemple) : rien.
function isEntryPoint() {
  try { return fs.realpathSync(process.argv[1] ?? '') === fs.realpathSync(fileURLToPath(import.meta.url)) } catch { return import.meta.url === pathToFileURL(process.argv[1] ?? '').href }
}
if (isEntryPoint()) main().catch(err => {
  console.error('[build-cleaners] Erreur:', err)
  process.exit(0)
})
