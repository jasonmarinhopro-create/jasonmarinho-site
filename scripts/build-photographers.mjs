#!/usr/bin/env node
/**
 * Build script : génère l'annuaire public des photographes LCD et les
 * fiches individuelles SEO friendly. Idem pattern build-signalements.
 *
 * - /annuaires/photographes/index.html : liste filtrable (l'annuaire)
 * - /annuaires/photographes/[slug]/index.html : fiche individuelle
 * - /sitemap-photographes.xml : sitemap dédié
 *
 * Lance en no-op si env vars Supabase absentes.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { injectProsIntoVillePages, villeGuide } from './lib/inject-ville-pros.mjs'
import { proReseauxLinks, proReseauxHtml } from './lib/pro-reseaux.mjs'
import { adminOwnedIds } from './lib/admin-owned.mjs'
import { ANNUAIRES, cityCoverage, searchWords, prixDes, heroInnerHtml, emptyHtml, guideHtml, faqHtml, faqJsonLd, villesGuidesHtml, joinLineHtml, demandeBandHtml, proCardHtml, cardLieu, CARD_PHOTOS_MAX, ANNUAIRE_CSS, CITY_PICKS_JS } from './lib/annuaire-hote.mjs'
import { readMetier, metierLabel, readOptions, OPTIONS_VISUELLES, faitVideo } from './lib/pro-visuel.mjs'
import { vitrinePhotos, photoLimitFromViews, heroActionsHtml, heroCoverHtml, heroVideoHtml, videoLink, galleryHtml, formulesHtml, derouleHtml, villesHtml, stickyBarHtml, VITRINE_CSS, VITRINE_JS } from './lib/fiche-vitrine.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const FICHES_DIR = path.join(ROOT, 'annuaires', 'photographes')
// Sous-dossiers à PROTÉGER du cleanup (sous-pages statiques sous
// /annuaires/photographes/) : sinon le rm récursif les supprimerait.
// NB : 'annuaire' n'est plus réservé : l'ancienne URL /annuaires/photographes/annuaire
// redirige (301 vercel.json) vers /annuaires/photographes.
const RESERVED_DIRS = new Set(['inscription', 'exemple-fiche'])

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const HAS_SUPABASE = !!(SUPABASE_URL && SERVICE_KEY)
// Photos affichées par fiche : réduit à la photo principale si la sortie
// Supabase du mois risque de dépasser l'offre gratuite (photoLimitFromViews)
let PHOTO_LIMIT = 6

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('[build-photographers] START')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

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
  const url = `${SUPABASE_URL}/rest/v1/public_photographers_view?select=*&order=created_at.desc&limit=500`
  const res = await fetch(url, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Accept: 'application/json' },
  })
  if (!res.ok) {
    const txt = await res.text()
    console.warn(`[build-photographers] Supabase fetch failed (${res.status}): ${txt}`)
    return []
  }
  const data = await res.json()
  console.log(`[build-photographers] ${data.length} photographe(s) actif(s)`)
  return data
}

// Recommandations d'hôtes (badge « Recommandé par N hôtes »). Fail-safe :
// table absente ou fetch KO → Map vide, aucun badge.
async function fetchRecoCounts() {
  if (!HAS_SUPABASE) return new Map()
  try {
    const url = `${SUPABASE_URL}/rest/v1/pro_recommendations?pro_type=eq.photographer&select=pro_id&limit=10000`
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

function fmtTarif(p) {
  if (!p.tarif_min && !p.tarif_max) return null
  if (p.tarif_min && p.tarif_max) return `${p.tarif_min} – ${p.tarif_max} €`
  return p.tarif_min ? `dès ${p.tarif_min} €` : `jusqu'à ${p.tarif_max} €`
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
export function buildFichePage(p) {
  const displayName = p.pseudo || p.full_name
  // Photographe, vidéaste ou les deux (migration 136, scripts/lib/pro-visuel.mjs)
  const metier = readMetier(p.metier)
  const mLabel = metierLabel(metier)
  const mShort = metier === 'photo_video' ? 'Photographe & vidéaste' : mLabel
  const opts = readOptions(p.options).map(k => OPTIONS_VISUELLES.find(o => o.key === k))
  const title = `${displayName} · ${mShort} LCD ${p.ville} | Jason Marinho`
  const tarif = fmtTarif(p)
  const optsTxt = opts.length ? ` ${opts.map(o => o.label).join(', ')}.` : ''
  const desc = `${displayName}, ${mLabel.toLowerCase()} spécialisé location courte durée à ${p.ville}${p.zone_couverte ? ' et ' + p.zone_couverte : ''}.${p.specialite ? ' ' + p.specialite + '.' : ''}${optsTxt}${tarif ? ' Tarifs ' + tarif + '.' : ''}`
  const video = videoLink(p.video_url)
  const canonical = `https://jasonmarinho.com/annuaires/photographes/${p.slug}`
  // Page de sa ville (ou de sa zone) : même règle que l'injection des pros
  const g = villeGuide(ROOT, 'photographe-lcd', p.ville, p.zone_couverte)
  // Réseaux et fiche Google (Instagram a déjà son bouton plus haut)
  const reseaux = proReseauxLinks(p.reseaux, null)
  const guide = g?.href ?? null
  const depuis = memberSince(p.created_at)
  const firstName = displayName.split(' ')[0]
  const photos = p.__photos ?? vitrinePhotos(p.portfolio_photos, SUPABASE_URL, PHOTO_LIMIT)
  const external = p.portfolio_url ? { href: p.portfolio_url, label: 'Voir le portfolio', short: 'Portfolio', icon: 'ph-image-square', track: 'portfolio' } : null
  // NB breadcrumbs : l'annuaire vit désormais directement sur
  // /annuaires/photographes (plus de sous-niveau /annuaire).

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
.btn-p{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--y);color:var(--gd);font-weight:600;font-size:14.5px;padding:13px 22px;border-radius:10px;text-decoration:none;width:100%;transition:all .2s;border:none;cursor:pointer;font-family:'Outfit',sans-serif}
.btn-p:hover{background:#ffe08f}
.btn-ol{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:transparent;color:var(--g);border:1px solid rgba(0,76,63,.2);font-weight:500;font-size:14px;padding:12px 20px;border-radius:10px;text-decoration:none;width:100%;margin-top:10px}
.btn-ol:hover{background:var(--g);color:#fff;border-color:var(--g)}
.aside-row{display:flex;flex-direction:column;gap:6px;padding:10px 0;border-top:1px solid var(--bd)}
.aside-row:first-of-type{border-top:none;padding-top:0}
.aside-k{font-size:11px;color:var(--tl);text-transform:uppercase;letter-spacing:.5px;font-weight:600}
.aside-v{font-size:14px;color:var(--td);font-weight:500}
.contact-form input,.contact-form textarea{width:100%;padding:11px 13px;border:1px solid rgba(0,76,63,.18);border-radius:8px;background:#fff;font-family:'Outfit',sans-serif;font-size:14px;color:var(--td);margin-bottom:10px}
.contact-form input:focus,.contact-form textarea:focus{outline:none;border-color:var(--g);box-shadow:0 0 0 3px rgba(0,76,63,.1)}
.contact-form textarea{min-height:90px;resize:vertical}
.hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.disclaimer{max-width:1100px;margin:0 auto;padding:20px clamp(20px,5vw,48px) 50px;font-size:12.5px;color:var(--tl);line-height:1.7}
.disclaimer strong{color:var(--td)}
.ok-msg{padding:14px;background:rgba(0,200,100,.08);border:1px solid rgba(0,200,100,.25);border-radius:8px;color:#1e9d54;font-size:13.5px;text-align:center}
.err-msg{padding:12px 14px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.22);border-radius:8px;color:#dc2626;font-size:13px;margin-bottom:10px}
${VITRINE_CSS}
</style>
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: displayName,
  url: canonical,
  description: desc.slice(0, 200),
  address: { '@type': 'PostalAddress', addressLocality: p.ville, addressCountry: 'FR' },
  jobTitle: `${mLabel} spécialisé location courte durée`,
  knowsAbout: [metier !== 'video' ? 'Photographie immobilière' : null, faitVideo(metier) ? 'Vidéo immobilière' : null, 'Location courte durée', 'Airbnb', 'Booking', p.specialite, ...opts.map(o => o.label)].filter(Boolean),
  ...(photos.length ? { image: photos.map(ph => ph.full) } : {}),
  sameAs: [p.portfolio_url, p.video_url, p.instagram_handle ? `https://instagram.com/${p.instagram_handle}` : null, ...reseaux.map(l => l.url)].filter(Boolean),
})}
</script>
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://jasonmarinho.com/' },
    { '@type': 'ListItem', position: 2, name: 'Annuaire des photographes et vidéastes LCD', item: 'https://jasonmarinho.com/annuaires/photographes' },
    { '@type': 'ListItem', position: 3, name: displayName, item: canonical },
  ],
})}
</script>
<script defer src="/nav.js"></script>
</head>
<body>
<header class="hero">
  <div class="s-in hero-grid${photos.length || video?.embed ? ' has-cover' : ''}">
  <div>
    <div class="brd"><a href="/">Accueil</a> · <a href="/annuaires/photographes">Photographes et vidéastes LCD</a> · <span>${escHtml(displayName)}</span></div>
    <div class="tag-row">
      ${p.reco_count > 0 ? `<span class="tag" style="background:rgba(99,214,131,.15);color:#7be29a;border:1px solid rgba(99,214,131,.35)"><i class="ph-bold ph-heart" style="font-size:10px"></i>Recommandé par ${p.reco_count} hôte${p.reco_count > 1 ? 's' : ''}</span>` : ''}
      <span class="tag"><i class="ph-bold ph-${metier === 'video' ? 'video-camera' : metier === 'photo_video' ? 'film-strip' : 'camera'}" style="font-size:10px"></i>${escHtml(mLabel)}</span>
      ${p.specialite ? `<span class="tag">${escHtml(p.specialite)}</span>` : ''}
      ${opts.some(o => o.key === 'drone') ? '<span class="tag"><i class="ph-bold ph-drone" style="font-size:10px"></i>Drone</span>' : ''}
      <span class="tag"><i class="ph-bold ph-map-pin" style="font-size:10px"></i>${escHtml(p.ville)}</span>
    </div>
    <div class="hero-id">
      ${p.logo_url
        ? `<div class="hero-logo" style="background:url('${escHtml(p.logo_url)}') center/cover"></div>`
        : `<div class="hero-logo placeholder">${escHtml(displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase())}</div>`}
      <h1>${escHtml(displayName)}<br><em>${escHtml(mLabel.toLowerCase())} LCD</em></h1>
    </div>
    ${p.zone_couverte ? `<p class="subtitle">Zone d'intervention : ${escHtml(p.zone_couverte)}</p>` : ''}
    <div class="meta-row">
      ${tarif ? `<span><i class="ph-bold ph-currency-eur"></i>${escHtml(tarif)} la session</span>` : ''}
      <span><i class="ph-bold ph-handshake"></i>Contact direct, sans commission</span>
    </div>
    ${heroActionsHtml({ firstName, hasPhotos: photos.length > 0, external, video: video && !video.embed ? video : null })}
  </div>
  ${video?.embed ? heroVideoHtml(p.video_url, { name: displayName, poster: p.__videoPoster || photos[0]?.thumb, credit: p.__videoCredit }) : heroCoverHtml(photos, displayName)}
  </div>
</header>

<div class="body">
  <div>
    ${galleryHtml(photos, { name: displayName })}
    ${p.bio ? `<div class="card" style="margin-bottom:20px"><h2>Présentation</h2><div class="bio">${escHtml(p.bio)}</div></div>` : ''}
    ${opts.length ? `<div class="card vt-sec"><h2>Ce que ${escHtml(firstName)} propose</h2><div class="vt-opts"><span class="vt-opt"><i class="ph-bold ph-${metier === 'video' ? 'video-camera' : 'camera'}"></i>${metier === 'video' ? 'Vidéo du logement' : metier === 'photo_video' ? 'Photos et vidéo du logement' : 'Photos du logement'}</span>${opts.map(o => `<span class="vt-opt"><i class="ph-bold ph-${o.icon}"></i>${escHtml(o.label)}</span>`).join('')}</div></div>` : ''}
    ${formulesHtml(p.formules)}
    ${derouleHtml(p.deroule, 'photographe')}
    <div class="card vt-sec">
      <h2>Portfolio complet</h2>
      <p style="font-size:14px;color:var(--tm);line-height:1.7;margin-bottom:14px">Toutes les réalisations de ${escHtml(displayName)}, pour juger de son style et voir si son approche correspond à ton logement.</p>
      <a href="${escHtml(p.portfolio_url)}" target="_blank" rel="noopener noreferrer" class="btn-p" onclick="jmTrack('portfolio')"><i class="ph-bold ph-image-square"></i>Voir le portfolio</a>
      ${video ? `<a href="${escHtml(video.href)}" target="_blank" rel="noopener noreferrer" class="btn-ol"><i class="ph-bold ph-play-circle"></i>${escHtml(video.label)}</a>` : ''}
      ${p.instagram_handle ? `<a href="https://instagram.com/${escHtml(p.instagram_handle)}" target="_blank" rel="noopener" class="btn-ol" onclick="jmTrack('instagram')"><i class="ph-bold ph-instagram-logo"></i>@${escHtml(p.instagram_handle)}</a>` : ''}
    </div>
    ${villesHtml(p.villes_couvertes, { root: ROOT, prefix: 'photographe-lcd', ville: p.ville, metierLabel: 'Photographe' })}
  </div>

  <aside>
    <div class="card" id="contact">
      <h2>Contacter ${escHtml(displayName.split(' ')[0])}</h2>
      <form class="contact-form" id="contact-form" onsubmit="return contactSubmit(event)">
        <div id="contact-err" class="err-msg" style="display:none"></div>
        <input type="text" name="contactName" placeholder="Ton prénom + nom" required>
        <input type="email" name="contactEmail" placeholder="Ton email" required>
        <textarea name="message" placeholder="Présente brièvement ton logement, la ville, les dates qui t'intéressent." required></textarea>
        <div class="hp"><label>Site</label><input type="text" name="website" tabindex="-1" autocomplete="off"></div>
        <button type="submit" class="btn-p" id="contact-btn"><i class="ph-bold ph-paper-plane-tilt"></i>Envoyer ma demande</button>
        <p style="margin-top:10px;font-size:11.5px;color:var(--tl);line-height:1.6">Ton nom, ton e-mail et ton message sont transmis à ${escHtml(displayName.split(' ')[0])} seulement, pour te répondre, et supprimés au bout de 3 ans. <a href="/politique-de-confidentialite#annuaire" style="color:var(--g)">Confidentialité</a></p>
      </form>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--bd);font-size:11.5px;color:var(--tl);line-height:1.6">Pas de commission. Pas d'intermédiaire. Tu négocies et contractualises directement avec ${escHtml(displayName.split(' ')[0])}.</div>
      <div style="margin-top:12px;font-size:12px;color:var(--tm);line-height:1.6">Tu as déjà bossé avec ${escHtml(displayName.split(' ')[0])} ? <a href="https://app.jasonmarinho.com/dashboard/recommander?type=photographer&id=${escHtml(p.id)}" style="color:var(--g);font-weight:600">Recommande-le aux autres hôtes →</a></div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="aside-row"><span class="aside-k">Ville principale</span><span class="aside-v">${escHtml(p.ville)}</span></div>
      ${p.zone_couverte ? `<div class="aside-row"><span class="aside-k">Zone couverte</span><span class="aside-v">${escHtml(p.zone_couverte)}</span></div>` : ''}
      ${tarif ? `<div class="aside-row"><span class="aside-k">Tarifs indicatifs</span><span class="aside-v">${escHtml(tarif)}</span></div>` : ''}
      <div class="aside-row"><span class="aside-k">Métier</span><span class="aside-v">${escHtml(mLabel)}</span></div>
      ${p.specialite ? `<div class="aside-row"><span class="aside-k">Spécialité</span><span class="aside-v">${escHtml(p.specialite)}</span></div>` : ''}
      ${depuis ? `<div class="aside-row"><span class="aside-k">Membre de l'annuaire depuis</span><span class="aside-v">${depuis}</span></div>` : ''}
      ${proReseauxHtml(reseaux)}
    </div>

    ${guide ? `<div class="card" style="margin-top:16px">
      <h2>Les tarifs photo à ${escHtml(p.ville)}</h2>
      <p style="font-size:13.5px;color:var(--tm);line-height:1.7;margin-bottom:12px">Fourchettes constatées, checklist des photos indispensables et conseils pour bien briefer : consulte le guide local avant de demander un devis.</p>
      <a href="${guide}" class="btn-ol" style="margin-top:0"><i class="ph-bold ph-map-pin"></i>Guide photographe LCD ${escHtml(g?.label ?? p.ville)}</a>
    </div>` : ''}
  </aside>
</div>

<div style="max-width:1100px;margin:0 auto;padding:0 clamp(20px,5vw,48px);display:flex;gap:10px;flex-wrap:wrap">
  <a href="/annuaires/photographes" style="display:inline-flex;align-items:center;gap:7px;padding:10px 16px;background:#fff;border:1px solid rgba(0,76,63,.15);border-radius:10px;font-size:13px;font-weight:600;color:var(--g);text-decoration:none"><i class="ph-bold ph-arrow-left"></i>Tous les photographes et vidéastes</a>
  ${guide ? `<a href="${guide}" style="display:inline-flex;align-items:center;gap:7px;padding:10px 16px;background:#fff;border:1px solid rgba(0,76,63,.15);border-radius:10px;font-size:13px;font-weight:600;color:var(--g);text-decoration:none">Photographe LCD ${escHtml(g?.label ?? p.ville)} : le guide<i class="ph-bold ph-arrow-right"></i></a>` : ''}
</div>

<div class="disclaimer">
  <strong>Bon à savoir.</strong> Cette mise en relation est gratuite pour toi. Le devis, le contrat et le paiement de la prestation se font directement entre toi et ${escHtml(displayName)}, sans commission ni intermédiaire de notre part.
</div>

<script>
const __slug = "${escHtml(p.slug)}";
const __t0 = Date.now();
// Tracking vues + clics sortants → /api/photographer/track (sendBeacon :
// non bloquant, part meme si l'utilisateur quitte la page).
// Vue dedupliquee par session pour ne pas compter les reloads.
function jmTrack(ev) {
  try { navigator.sendBeacon('/api/photographer/track', JSON.stringify({ slug: __slug, event: ev })) } catch (e) {}
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
    message: f.message.value.trim(),
    website: f.website ? f.website.value : '',
    t: __t0,
  };
  try {
    const res = await fetch('/api/photographer/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      errBox.textContent = body.error || 'Erreur lors de l\\'envoi. Réessaye.';
      errBox.style.display = 'block';
      btn.disabled = false; btn.innerHTML = '<i class="ph-bold ph-paper-plane-tilt"></i>Envoyer ma demande';
      return false;
    }
    document.getElementById('contact-form').outerHTML = '<div class="ok-msg"><strong>Message envoyé ✓</strong><br>${escHtml(displayName.split(' ')[0])} te recontacte généralement sous 48h.</div>';
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
<script defer src="/footer.js"></script>
<script src="/cookie-banner.js" defer></script>
</body>
</html>
`
}

/**
 * Fenêtre « Filtres » de l'annuaire (17/10/2026, Jason : « tout dans le bouton
 * Filtres, avec plus de choix pour les hôtes ») : métier, options, ce que la
 * fiche montre, prix, tri. Le nombre de pros s'affiche à côté de chaque choix.
 */
const FILTRES_FICHE = [
  ['photos', 'Avec des photos sur la fiche', 'ph-images', p => (Array.isArray(p.portfolio_photos) ? p.portfolio_photos.length : 0) > 0],
  ['video', 'Avec une vidéo à regarder', 'ph-play-circle', p => !!p.video_url],
  ['prix', 'Prix ou formules affichés', 'ph-tag', p => prixNum(p) != null],
  ['reco', 'Recommandé par des hôtes', 'ph-heart', p => (p.reco_count ?? 0) > 0],
]
function prixNum(p) {
  const prices = (Array.isArray(p.formules) ? p.formules : []).map(f => Number(f?.prix)).filter(n => Number.isFinite(n) && n > 0)
  const n = prices.length ? Math.min(...prices) : Number(p.tarif_min)
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null
}
/** « Les plus complets » : photos, vidéo, prix, recommandations, bio */
function completude(p) {
  return FILTRES_FICHE.filter(([, , , f]) => f(p)).length * 2 + (p.bio ? 1 : 0) + Math.min(3, p.reco_count ?? 0)
}
function filtersSectionsHtml(items) {
  const n = f => items.filter(f).length
  const cnt = k => `<span class="fc-n">${k}</span>`
  const metiers = [['', 'Tous', 'squares-four', () => true], ['photo', 'Photographe', 'camera', p => readMetier(p.metier) !== 'video'], ['video', 'Vidéaste', 'video-camera', p => readMetier(p.metier) !== 'photo'], ['photo_video', 'Photographe et vidéaste', 'film-strip', p => readMetier(p.metier) === 'photo_video']]
  return `
      <div class="filters-section">
        <h3>Ce que tu cherches</h3>
        <div class="fc-grid" role="radiogroup" aria-label="Ce que tu cherches">${metiers.map(([k, l, ic, f]) => `<button type="button" class="fc-m" data-f-metier="${k}" role="radio" aria-checked="${k ? 'false' : 'true'}"><i class="ph-bold ph-${ic}"></i><span>${l}</span>${cnt(n(f))}</button>`).join('')}</div>
        <p class="fc-hint">« Photographe » montre aussi ceux qui font les deux.</p>
      </div>
      <div class="filters-section">
        <h3>Options</h3>
        <div class="fc-list">${OPTIONS_VISUELLES.map(o => { const c = n(p => readOptions(p.options).includes(o.key)); return `<button type="button" class="fc-c" data-f-option="${o.key}" aria-pressed="false"${c ? '' : ' disabled'}><i class="ph-bold ph-${o.icon}"></i><span>${escHtml(o.label)}</span>${cnt(c)}</button>` }).join('')}</div>
      </div>
      <div class="filters-section">
        <h3>Sur la fiche</h3>
        <div class="fc-list">${FILTRES_FICHE.map(([k, l, ic, f]) => { const c = n(f); return `<button type="button" class="fc-c" data-f-fiche="${k}" aria-pressed="false"${c ? '' : ' disabled'}><i class="ph-bold ${ic}"></i><span>${l}</span>${cnt(c)}</button>` }).join('')}</div>
      </div>
      <div class="filters-section">
        <h3>Prix de départ</h3>
        <div class="filters-price">
          <div class="filters-price-field">
            <label for="f-min">Minimum</label>
            <div class="fx"><span>€</span><input type="number" id="f-min" inputmode="numeric" placeholder="0" min="0"></div>
          </div>
          <div class="filters-price-field">
            <label for="f-max">Maximum</label>
            <div class="fx"><span>€</span><input type="number" id="f-max" inputmode="numeric" placeholder="2000+" min="0"></div>
          </div>
        </div>
        <p class="fc-hint">Les pros sans prix affiché restent visibles.</p>
      </div>
      <div class="filters-section">
        <h3>Trier par</h3>
        <div class="fc-grid fc-sort" role="radiogroup" aria-label="Trier par">${[['', 'Les plus complets'], ['prix-asc', 'Prix le plus bas'], ['prix-desc', 'Prix le plus haut'], ['recent', 'Les plus récents']].map(([k, l]) => `<button type="button" class="fc-m" data-f-sort="${k}" role="radio" aria-checked="${k ? 'false' : 'true'}"><span>${l}</span></button>`).join('')}</div>
      </div>`
}

export function buildAnnuaireListPage(items) {
  const cfg = ANNUAIRES.photographe
  const { byPro, counts } = cityCoverage(ROOT, cfg.prefix, items)
  const itemsHtml = items.length === 0
    ? emptyHtml(cfg)
    : `<div class="grid">${[...items].sort((a, b) => completude(b) - completude(a)).map(p => {
        const displayName = p.pseudo || p.full_name
        const des = prixDes(p.formules, p.tarif_min)
        const tarif = des ?? fmtTarif(p)
        const metier = readMetier(p.metier)
        const opts = readOptions(p.options)
        const searchBlob = normalizeSearch([searchWords(p, byPro.get(p.id)), p.specialite].filter(Boolean).join(' '))
        const photos = vitrinePhotos(p.portfolio_photos, SUPABASE_URL, Math.min(PHOTO_LIMIT, CARD_PHOTOS_MAX))
        const villes = (Array.isArray(p.villes_couvertes) ? p.villes_couvertes : []).filter(v => v && v !== p.ville)
        const extra = [metierLabel(metier), opts.includes('drone') ? 'drone' : null, p.specialite, p.reco_count > 0 ? `recommandé par ${p.reco_count} hôte${p.reco_count > 1 ? 's' : ''}` : null].filter(Boolean).join(' · ')
        return proCardHtml({
          href: `/annuaires/photographes/${p.slug}`,
          attrs: `data-search="${escHtml(searchBlob)}" data-metier="${metier}" data-options="${opts.join(' ')}" data-fiche="${FILTRES_FICHE.filter(([, , , f]) => f(p)).map(([k]) => k).join(' ')}" data-prix="${prixNum(p) ?? ''}" data-created="${escHtml(p.created_at || '')}" data-tier="${escHtml(p.tier || '')}" data-tarif-min="${prixNum(p) ?? p.tarif_min ?? ''}" data-tarif-max="${p.tarif_max ?? prixNum(p) ?? ''}"`,
          name: displayName, metier: metierLabel(metier), ville: p.ville,
          lieu: cardLieu(villes, p.zone_couverte, 'aussi à'),
          extra: extra ? extra.charAt(0).toUpperCase() + extra.slice(1) : '',
          tarif, tarifSuffix: des ? '' : 'la séance',
          photos, logoUrl: p.logo_url, alt: `Logement ${metier === 'video' ? 'filmé' : 'photographié'} par ${displayName}`,
        })
      }).join('')}</div>`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(cfg.title)}</title>
<meta name="description" content="${escHtml(cfg.desc)}">
<link rel="canonical" href="https://jasonmarinho.com/annuaires/photographes">
<meta property="og:title" content="${escHtml(cfg.title)}">
<meta property="og:description" content="${escHtml(cfg.desc)}">
<meta property="og:url" content="https://jasonmarinho.com/annuaires/photographes">
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
.filters-modal{background:#fff;border-radius:18px;width:100%;max-width:440px;max-height:min(640px,86vh);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 80px rgba(0,20,14,.35)}
.filters-head{display:flex;align-items:center;justify-content:center;position:relative;padding:18px 20px;border-bottom:1px solid var(--bd);flex-shrink:0}
.filters-title{font-family:'Fraunces',serif;font-size:17px;font-weight:500;color:var(--td)}
.filters-close{position:absolute;right:14px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;border:none;background:transparent;color:var(--td);font-size:17px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.filters-close:hover{background:rgba(0,76,63,.06)}
.filters-body{padding:22px clamp(16px,4vw,22px) 6px;overflow-y:auto;flex:1}
.filters-section{padding-bottom:22px;margin-bottom:22px;border-bottom:1px solid var(--bd)}
.filters-section:last-child{border-bottom:none;margin-bottom:0}
.filters-section h3{font-family:'Fraunces',serif;font-size:15.5px;font-weight:500;color:var(--td);margin:0 0 14px}
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
.filters-modal{max-width:520px}
.fc-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.fc-list{display:flex;flex-direction:column;gap:6px}
.fc-m,.fc-c{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:1px solid var(--bd);background:#fff;border-radius:12px;font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;color:var(--td);cursor:pointer;transition:border-color .15s,background .15s}
.fc-m{padding:12px 13px}
.fc-c{padding:10px 13px;font-weight:500}
.fc-m i,.fc-c i{font-size:17px;color:var(--g);flex-shrink:0}
.fc-m span:first-of-type,.fc-c span:first-of-type{flex:1;min-width:0}
.fc-n{font-size:11.5px;font-weight:600;color:var(--tl);background:rgba(0,76,63,.06);border-radius:999px;padding:1px 8px;flex-shrink:0}
.fc-m:hover,.fc-c:hover{border-color:rgba(0,76,63,.35)}
.fc-m[aria-checked="true"],.fc-c[aria-pressed="true"]{border-color:var(--g);background:rgba(0,76,63,.06);box-shadow:inset 0 0 0 1px var(--g)}
.fc-c[aria-pressed="true"]::after{content:'';width:8px;height:8px;border-radius:50%;background:var(--g);flex-shrink:0}
.fc-c:disabled{opacity:.45;cursor:default}
.fc-sort .fc-m{justify-content:center;font-weight:500}
.fc-hint{font-size:11.5px;color:var(--tl);margin:10px 0 0;line-height:1.5}
@media(max-width:420px){.fc-grid{grid-template-columns:1fr}}
.f-active{max-width:820px;margin:14px auto 0;padding:0 clamp(16px,5vw,40px);display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.f-active[hidden]{display:none}
.f-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 10px 6px 12px;border-radius:999px;background:var(--g);color:#fff;border:none;font-family:'Outfit',sans-serif;font-size:12.5px;font-weight:600;cursor:pointer}
.f-chip i{font-size:11px;opacity:.8}
.f-clear{background:none;border:none;font-family:'Outfit',sans-serif;font-size:12.5px;font-weight:600;color:var(--tm);text-decoration:underline;cursor:pointer;padding:6px 4px}
</style>
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Annuaire des photographes et vidéastes Airbnb et location courte durée',
  description: cfg.desc,
  url: 'https://jasonmarinho.com/annuaires/photographes',
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
    ${heroInnerHtml(cfg, '<a href="/">Accueil</a> · <span>Photographes et vidéastes Airbnb</span>')}
  </div>
</header>

${items.length > 0 ? `<div class="tools-row">
  <div class="search-bar">
    <i class="ph-bold ph-map-pin search-ico" aria-hidden="true"></i>
    <input type="text" id="pro-search" placeholder="Où est ton logement ? Lyon, Annecy, Biarritz…" autocomplete="off" aria-label="Rechercher un photographe ou un vidéaste par ville">
    <span class="search-count" id="search-count"></span>
    <button type="button" class="search-clear" id="search-clear" aria-label="Effacer la recherche"><i class="ph-bold ph-x"></i></button>
  </div>
  <button type="button" class="filters-btn" id="filters-open">
    <i class="ph-bold ph-sliders-horizontal"></i> Filtres
    <span class="filters-badge" id="filters-badge" style="display:none">0</span>
  </button>
</div>
<div class="f-active" id="f-active" hidden></div>
${demandeBandHtml(cfg)}

<div class="filters-backdrop" id="filters-backdrop">
  <div class="filters-modal" role="dialog" aria-modal="true" aria-label="Filtres">
    <div class="filters-head">
      <span class="filters-title">Filtres</span>
      <button type="button" class="filters-close" id="filters-close" aria-label="Fermer"><i class="ph-bold ph-x"></i></button>
    </div>
    <div class="filters-body">${filtersSectionsHtml(items)}
    </div>
    <div class="filters-foot">
      <button type="button" class="filters-clear" id="filters-clear">Tout effacer</button>
      <button type="button" class="filters-apply" id="filters-apply">Afficher <span id="filters-count">${items.length}</span> <span id="filters-count-word">résultat${items.length > 1 ? 's' : ''}</span></button>
    </div>
  </div>
</div>` : ''}

<main class="main">
${itemsHtml}
${items.length > 0 ? `<div class="search-empty" id="search-empty">
  <div class="search-empty-ico"><i class="ph-bold ph-map-trifold"></i></div>
  <h3>Personne pour l’instant à «<span id="search-empty-q"></span>»</h3>
  <p>L’annuaire grandit chaque semaine. Décris ton besoin : ta demande partira aux pros de ta zone. Le <a href="#villes">guide de ta ville</a> te donne aussi les tarifs constatés.</p>
  <p><a href="/trouver-un-pro?metier=photographe" id="search-demande" style="display:inline-flex;align-items:center;gap:7px;padding:10px 16px;border-radius:10px;background:var(--g);color:#fff;font-weight:600;text-decoration:none"><i class="ph-bold ph-paper-plane-tilt"></i>Décrire mon besoin</a></p>
  <button type="button" id="search-reset"><i class="ph-bold ph-arrow-counter-clockwise"></i>Voir tous les photographes et vidéastes</button>
</div>` : ''}
<section style="margin:40px auto 0;max-width:1100px;padding:26px clamp(18px,4vw,30px);border-radius:18px;background:#F2F8F4;border:1px solid rgba(0,76,63,.14);display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between">
  <div style="flex:1 1 320px;min-width:0">
    <div style="font-size:10.5px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#004C3F;margin-bottom:8px"><i class="ph-bold ph-house-line"></i> Tu es hôte ?</div>
    <h2 style="font-family:'Fraunces',serif;font-weight:500;font-size:clamp(20px,2.6vw,26px);line-height:1.25;color:#0F1A0D;margin:0 0 8px">Tes réservations directes, signées et payées</h2>
    <p style="margin:0;font-size:14.5px;line-height:1.65;color:#3D5038">Une fois tes photos faites, l'app t'aide à louer en direct : contrat signé en ligne, loyer payé par carte, caution bloquée, fiche de police préparée. Gratuit pour commencer.</p>
  </div>
  <a href="https://app.jasonmarinho.com/auth/register" style="flex:0 1 auto;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 22px;border-radius:10px;background:#004C3F;color:#fff;font-weight:600;font-size:15px;text-decoration:none">Créer mon compte gratuit <i class="ph-bold ph-arrow-right"></i></a>
</section>
</main>

${items.length > 0 ? `<script>
(function(){
  function norm(s){ return (s || '').toString().toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim() }
  function $(id){ return document.getElementById(id) }
  function all(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)) }
  var input = $('pro-search'), clear = $('search-clear'), reset = $('search-reset'), countEl = $('search-count')
  var emptyEl = $('search-empty'), emptyQ = $('search-empty-q'), grid = document.querySelector('.grid')
  var cards = grid ? Array.prototype.slice.call(grid.querySelectorAll('.card')) : []
  if (!input || !cards.length) return
  cards.forEach(function(c, i){ c.setAttribute('data-i', i) })

  // ── État des filtres (appliqué) et brouillon (fenêtre ouverte) ──────
  // metier : '' | photo | video | photo_video ; options et fiche : listes ; tri : '' | prix-asc | prix-desc | recent
  function blank(){ return { metier: '', options: [], fiche: [], min: null, max: null, sort: '' } }
  function copy(o){ return { metier: o.metier, options: o.options.slice(), fiche: o.fiche.slice(), min: o.min, max: o.max, sort: o.sort } }
  var state = blank(), draft = blank()
  var LABELS = {}
  all('[data-f-metier],[data-f-option],[data-f-fiche],[data-f-sort]').forEach(function(b){
    var t = b.querySelector('span'); var k = ['metier', 'option', 'fiche', 'sort'].filter(function(x){ return b.hasAttribute('data-f-' + x) })[0]
    LABELS[k + ':' + b.getAttribute('data-f-' + k)] = t ? t.textContent : ''
  })

  function match(c, st){
    var m = c.getAttribute('data-metier') || 'photo'
    if (st.metier === 'photo' && m === 'video') return false
    if (st.metier === 'video' && m === 'photo') return false
    if (st.metier === 'photo_video' && m !== 'photo_video') return false
    var o = ' ' + (c.getAttribute('data-options') || '') + ' ', f = ' ' + (c.getAttribute('data-fiche') || '') + ' '
    for (var i = 0; i < st.options.length; i++) if (o.indexOf(' ' + st.options[i] + ' ') === -1) return false
    for (var k = 0; k < st.fiche.length; k++) if (f.indexOf(' ' + st.fiche[k] + ' ') === -1) return false
    var prix = c.getAttribute('data-prix'); prix = prix ? Number(prix) : null
    if (st.min != null && prix != null && prix < st.min) return false
    if (st.max != null && prix != null && prix > st.max) return false
    return true
  }
  function searchOk(c){ var q = norm(input.value); return !q || (c.getAttribute('data-search') || '').indexOf(q) !== -1 }
  function activeCount(st){ return (st.metier ? 1 : 0) + st.options.length + st.fiche.length + (st.min != null || st.max != null ? 1 : 0) + (st.sort ? 1 : 0) }

  // ── Fenêtre ──────────────────────────────────────────────────────────
  var backdrop = $('filters-backdrop'), applyBtn = $('filters-apply'), clearBtn = $('filters-clear')
  var minInput = $('f-min'), maxInput = $('f-max')
  function paint(){
    all('[data-f-metier]').forEach(function(b){ b.setAttribute('aria-checked', String(b.getAttribute('data-f-metier') === draft.metier)) })
    all('[data-f-sort]').forEach(function(b){ b.setAttribute('aria-checked', String(b.getAttribute('data-f-sort') === draft.sort)) })
    all('[data-f-option]').forEach(function(b){ b.setAttribute('aria-pressed', String(draft.options.indexOf(b.getAttribute('data-f-option')) !== -1)) })
    all('[data-f-fiche]').forEach(function(b){ b.setAttribute('aria-pressed', String(draft.fiche.indexOf(b.getAttribute('data-f-fiche')) !== -1)) })
    minInput.value = draft.min != null ? draft.min : ''; maxInput.value = draft.max != null ? draft.max : ''
    preview()
  }
  function preview(){
    var n = cards.filter(function(c){ return searchOk(c) && match(c, draft) }).length
    $('filters-count').textContent = n
    $('filters-count-word').textContent = n > 1 ? 'résultats' : 'résultat'
    applyBtn.disabled = n === 0
    clearBtn.style.color = activeCount(draft) ? 'var(--td)' : 'var(--tl)'
  }
  function toggle(list, v){ var i = list.indexOf(v); if (i === -1) list.push(v); else list.splice(i, 1) }
  backdrop.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('button')
    if (e.target === backdrop || (b && b.id === 'filters-close')) { backdrop.classList.remove('open'); return }
    if (!b || b.disabled) return
    if (b.hasAttribute('data-f-metier')) draft.metier = b.getAttribute('data-f-metier')
    else if (b.hasAttribute('data-f-sort')) draft.sort = b.getAttribute('data-f-sort')
    else if (b.hasAttribute('data-f-option')) toggle(draft.options, b.getAttribute('data-f-option'))
    else if (b.hasAttribute('data-f-fiche')) toggle(draft.fiche, b.getAttribute('data-f-fiche'))
    else return
    paint()
  })
  minInput.addEventListener('input', function(){ draft.min = minInput.value ? Number(minInput.value) : null; preview() })
  maxInput.addEventListener('input', function(){ draft.max = maxInput.value ? Number(maxInput.value) : null; preview() })
  $('filters-open').addEventListener('click', function(){ draft = copy(state); paint(); backdrop.classList.add('open') })
  clearBtn.addEventListener('click', function(){ draft = blank(); paint() })
  applyBtn.addEventListener('click', function(){ state = copy(draft); backdrop.classList.remove('open'); apply(true) })
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') backdrop.classList.remove('open') })

  // ── Puces des filtres actifs, sous la recherche ─────────────────────
  var chips = $('f-active'), badge = $('filters-badge')
  function chipsHtml(){
    var out = []
    if (state.metier) out.push(['metier', '', LABELS['metier:' + state.metier]])
    state.options.forEach(function(o){ out.push(['option', o, LABELS['option:' + o]]) })
    state.fiche.forEach(function(o){ out.push(['fiche', o, LABELS['fiche:' + o]]) })
    if (state.min != null || state.max != null) out.push(['prix', '', state.min != null && state.max != null ? state.min + ' à ' + state.max + ' €' : state.min != null ? 'dès ' + state.min + ' €' : 'jusqu’à ' + state.max + ' €'])
    if (state.sort) out.push(['sort', '', LABELS['sort:' + state.sort]])
    chips.innerHTML = out.map(function(x){ return '<button type="button" class="f-chip" data-k="' + x[0] + '" data-v="' + x[1] + '">' + x[2] + ' <i class="ph-bold ph-x"></i></button>' }).join('') + (out.length > 1 ? '<button type="button" class="f-clear" data-k="all">Tout effacer</button>' : '')
    chips.hidden = !out.length
    var n = activeCount(state)
    badge.style.display = n ? 'inline-flex' : 'none'; badge.textContent = n
  }
  chips.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('button'); if (!b) return
    var k = b.getAttribute('data-k'), v = b.getAttribute('data-v')
    if (k === 'all') state = blank()
    else if (k === 'metier') state.metier = ''
    else if (k === 'sort') state.sort = ''
    else if (k === 'prix') { state.min = null; state.max = null }
    else if (k === 'option') toggle(state.options, v)
    else if (k === 'fiche') toggle(state.fiche, v)
    apply(true)
  })

  // ── Adresse partageable : ?metier=video&options=drone&fiche=video&tri=prix-asc
  function toUrl(){
    try {
      var u = new URL(location.href), set = function(k, v){ if (v) u.searchParams.set(k, v); else u.searchParams.delete(k) }
      set('metier', state.metier); set('options', state.options.join(',')); set('fiche', state.fiche.join(','))
      set('min', state.min != null ? state.min : ''); set('max', state.max != null ? state.max : ''); set('tri', state.sort)
      history.replaceState(null, '', u.pathname + u.search + u.hash)
    } catch (e) {}
  }
  try {
    var qs = new URLSearchParams(location.search), ok = function(attr, v){ return v && document.querySelector('[' + attr + '="' + v + '"]') }
    if (ok('data-f-metier', qs.get('metier'))) state.metier = qs.get('metier')
    if (ok('data-f-sort', qs.get('tri'))) state.sort = qs.get('tri')
    state.options = (qs.get('options') || '').split(',').filter(function(v){ return ok('data-f-option', v) })
    state.fiche = (qs.get('fiche') || '').split(',').filter(function(v){ return ok('data-f-fiche', v) })
    if (qs.get('min')) state.min = Number(qs.get('min')) || null
    if (qs.get('max')) state.max = Number(qs.get('max')) || null
  } catch (e) {}

  // ── Recherche + filtres + tri ───────────────────────────────────────
  function sortCards(){
    var key = state.sort, val = function(c, k){ return c.getAttribute(k) || '' }
    var list = cards.slice().sort(function(a, b){
      if (key === 'prix-asc' || key === 'prix-desc') {
        var pa = val(a, 'data-prix'), pb = val(b, 'data-prix')
        if (!pa !== !pb) return pa ? -1 : 1
        if (pa && pb && pa !== pb) return key === 'prix-asc' ? pa - pb : pb - pa
      }
      if (key === 'recent' && val(a, 'data-created') !== val(b, 'data-created')) return val(a, 'data-created') < val(b, 'data-created') ? 1 : -1
      return a.getAttribute('data-i') - b.getAttribute('data-i')
    })
    list.forEach(function(c){ grid.appendChild(c) })
  }
  function apply(save){
    var q = norm(input.value), shown = 0
    cards.forEach(function(c){ var m = searchOk(c) && match(c, state); c.style.display = m ? '' : 'none'; if (m) shown++ })
    sortCards()
    var none = shown === 0
    countEl.textContent = (q || activeCount(state)) && !none ? shown + ' résultat' + (shown > 1 ? 's' : '') : ''
    clear.style.display = q ? 'inline-flex' : 'none'
    if (emptyEl) emptyEl.style.display = none ? 'block' : 'none'
    if (emptyQ) emptyQ.textContent = input.value.trim() || 'ces critères'
    if (grid) grid.style.display = none ? 'none' : ''
    chipsHtml()
    if (save) toUrl()
  }
  input.addEventListener('input', function(){ apply(false) })
  clear.addEventListener('click', function(){ input.value = ''; apply(false); input.focus() })
  if (reset) reset.addEventListener('click', function(){ input.value = ''; state = blank(); apply(true); input.focus() })
  apply(false)
})()
</script>` : ''}

${guideHtml(cfg)}

${faqHtml(cfg)}

${villesGuidesHtml(cfg, loadCities(), counts)}

<div class="disclaimer">
  <strong>Comment ça marche.</strong> Tu cliques sur un photographe, tu regardes ses photos et ses formules, et tu lui envoies une demande depuis sa fiche. Aucune commission, aucun intermédiaire : le devis, la séance et le paiement se règlent directement entre vous.
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
    `  <url><loc>https://jasonmarinho.com/annuaires/photographes</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.85</priority></url>`,
    `  <url><loc>https://jasonmarinho.com/devenir-photographe-lcd</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    `  <url><loc>https://jasonmarinho.com/annuaires/photographes/inscription</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`,
    ...items.map(p => {
      return `  <url><loc>https://jasonmarinho.com/annuaires/photographes/${p.slug}</loc><lastmod>${(p.created_at || today).slice(0, 10)}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`
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
  const demo = await adminOwnedIds({ supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY, table: 'photographers' })
  const items = (await fetchActive()).filter(p => !demo.has(p.id))
  if (demo.size) console.log(`[build-photographers] ${demo.size} fiche(s) de compte admin écartée(s)`)
  const recoCounts = await fetchRecoCounts()
  for (const p of items) p.reco_count = recoCounts.get(p.id) ?? 0
  PHOTO_LIMIT = photoLimitFromViews(await fetchMonthViews())
  if (PHOTO_LIMIT < 6) console.log('[build-photographers] Vues du mois élevées : photo principale seulement (offre gratuite Supabase)')

  // Clean photographes dir (regen all)
  if (fs.existsSync(FICHES_DIR)) {
    // Cleanup : on supprime UNIQUEMENT les sous-dossiers de fiches (slugs).
    // Hub + annuaire + inscription + exemple-fiche (RESERVED_DIRS) sont
    // intouchables : sinon le rm casse tout le hub /annuaires/photographes/.
    for (const entry of fs.readdirSync(FICHES_DIR, { withFileTypes: true })) {
      if (entry.isDirectory() && !RESERVED_DIRS.has(entry.name)) {
        fs.rmSync(path.join(FICHES_DIR, entry.name), { recursive: true, force: true })
      }
    }
  } else {
    fs.mkdirSync(FICHES_DIR, { recursive: true })
  }

  // Génère chaque fiche
  for (const p of items) {
    const dir = path.join(FICHES_DIR, p.slug)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'index.html'), buildFichePage(p), 'utf8')
  }

  // Génère l'annuaire directement sur /annuaires/photographes (index du hub).
  // L'ancienne URL /annuaires/photographes/annuaire redirige en 301 (vercel.json).
  fs.writeFileSync(path.join(FICHES_DIR, 'index.html'), buildAnnuaireListPage(items), 'utf8')

  // Sitemap dédié
  fs.writeFileSync(path.join(ROOT, 'sitemap-photographes.xml'), buildSitemap(items), 'utf8')

  // Injecte les pros actifs dans leurs pages ville SEO (/photographe-lcd-{ville})
  const villesEnrichies = injectProsIntoVillePages({
    root: ROOT,
    prefix: 'photographe-lcd',
    metier: 'photographe LCD',
    pros: items.map(p => ({
      ville: p.ville,
      zone: p.zone_couverte,
      url: `/annuaires/photographes/${p.slug}`,
      name: p.full_name,
      sub: [p.specialite, fmtTarif(p)].filter(Boolean).join(' · ') || null,
    })),
  })
  console.log(`[build-photographers] ${villesEnrichies} page(s) ville enrichie(s)`)

  console.log(`[build-photographers] ✓ ${items.length} fiches + annuaire + sitemap`)
}


// Lancé directement (build) : génère tout. Importé (fiches d'exemple) : rien.
function isEntryPoint() {
  try { return fs.realpathSync(process.argv[1] ?? '') === fs.realpathSync(fileURLToPath(import.meta.url)) } catch { return import.meta.url === pathToFileURL(process.argv[1] ?? '').href }
}
if (isEntryPoint()) main().catch(err => {
  console.error('[build-photographers] Erreur:', err)
  process.exit(0)
})
