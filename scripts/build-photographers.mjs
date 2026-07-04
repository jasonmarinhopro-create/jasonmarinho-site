#!/usr/bin/env node
/**
 * Build script — génère l'annuaire public des photographes LCD et les
 * fiches individuelles SEO friendly. Idem pattern build-signalements.
 *
 * - /annuaires/photographes/index.html : liste filtrable (l'annuaire)
 * - /annuaires/photographes/[slug]/index.html : fiche individuelle
 * - /devenir-photographe-lcd/index.html : page pitch (injection de la liste)
 * - /sitemap-photographes.xml : sitemap dédié
 *
 * Lance en no-op si env vars Supabase absentes.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const FICHES_DIR = path.join(ROOT, 'annuaires', 'photographes')
const DEVENIR_PAGE = path.join(ROOT, 'devenir-photographe-lcd', 'index.html')
// Sous-dossiers à PROTÉGER du cleanup (sous-pages statiques sous
// /annuaires/photographes/) — sinon le rm récursif les supprimerait.
// NB : 'annuaire' n'est plus réservé — l'ancienne URL /annuaires/photographes/annuaire
// redirige (301 vercel.json) vers /annuaires/photographes.
const RESERVED_DIRS = new Set(['inscription', 'exemple-fiche'])

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const HAS_SUPABASE = !!(SUPABASE_URL && SERVICE_KEY)

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('[build-photographers] START')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

function escHtml(s) {
  if (s == null) return ''
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
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

function fmtTarif(p) {
  if (!p.tarif_min && !p.tarif_max) return null
  if (p.tarif_min && p.tarif_max) return `${p.tarif_min} – ${p.tarif_max} €`
  return p.tarif_min ? `dès ${p.tarif_min} €` : `jusqu'à ${p.tarif_max} €`
}

function buildFichePage(p) {
  const displayName = p.pseudo || p.full_name
  const title = `${displayName} · Photographe LCD ${p.ville} | Jason Marinho`
  const tarif = fmtTarif(p)
  const desc = `${displayName}, photographe spécialisé location courte durée à ${p.ville}${p.zone_couverte ? ' et ' + p.zone_couverte : ''}.${p.specialite ? ' ' + p.specialite + '.' : ''}${tarif ? ' Tarifs ' + tarif + '.' : ''}`
  const canonical = `https://jasonmarinho.com/annuaires/photographes/${p.slug}`
  const isFondateur = p.tier === 'fondateur'
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,300;1,9..144,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<link rel="stylesheet" type="text/css" href="/fonts/phosphor-bold-subset.css">
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
</style>
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: displayName,
  url: canonical,
  description: desc.slice(0, 200),
  address: { '@type': 'PostalAddress', addressLocality: p.ville, addressCountry: 'FR' },
  jobTitle: 'Photographe spécialisé location courte durée',
  knowsAbout: ['Photographie immobilière', 'Location courte durée', 'Airbnb', 'Booking', p.specialite].filter(Boolean),
  sameAs: [p.portfolio_url, p.instagram_handle ? `https://instagram.com/${p.instagram_handle}` : null].filter(Boolean),
})}
</script>
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://jasonmarinho.com/' },
    { '@type': 'ListItem', position: 2, name: 'Annuaire des photographes LCD', item: 'https://jasonmarinho.com/annuaires/photographes' },
    { '@type': 'ListItem', position: 3, name: displayName, item: canonical },
  ],
})}
</script>
<script defer src="/nav.js"></script>
</head>
<body>
<header class="hero">
  <div class="s-in">
    <div class="brd"><a href="/">Accueil</a> · <a href="/annuaires/photographes">Annuaire photographes LCD</a> · <span>${escHtml(displayName)}</span></div>
    <div class="tag-row">
      ${isFondateur ? '<span class="tag gold"><i class="ph-bold ph-star" style="font-size:10px"></i>Fondateur</span>' : ''}
      ${p.specialite ? `<span class="tag">${escHtml(p.specialite)}</span>` : ''}
      <span class="tag"><i class="ph-bold ph-map-pin" style="font-size:10px"></i>${escHtml(p.ville)}</span>
    </div>
    <div class="hero-id">
      ${p.logo_url
        ? `<div class="hero-logo" style="background:url('${escHtml(p.logo_url)}') center/cover"></div>`
        : `<div class="hero-logo placeholder">${escHtml(displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase())}</div>`}
      <h1>${escHtml(displayName)}<br><em>photographe LCD</em></h1>
    </div>
    ${p.zone_couverte ? `<p class="subtitle">Zone d'intervention : ${escHtml(p.zone_couverte)}</p>` : ''}
    <div class="meta-row">
      ${tarif ? `<span><i class="ph-bold ph-currency-eur"></i>${escHtml(tarif)} la session</span>` : ''}
      <span><i class="ph-bold ph-shield-check"></i>Vérifié par Jason Marinho</span>
    </div>
  </div>
</header>

<div class="body">
  <div>
    ${p.bio ? `<div class="card" style="margin-bottom:20px"><h2>Présentation</h2><div class="bio">${escHtml(p.bio)}</div></div>` : ''}
    <div class="card">
      <h2>Portfolio</h2>
      <p style="font-size:14px;color:var(--tm);line-height:1.7;margin-bottom:14px">Consulte le portfolio complet de ${escHtml(displayName)} pour découvrir son style, ses réalisations LCD et choisir si son approche correspond à ton logement.</p>
      <a href="${escHtml(p.portfolio_url)}" target="_blank" rel="noopener noreferrer" class="btn-p"><i class="ph-bold ph-image-square"></i>Voir le portfolio</a>
      ${p.instagram_handle ? `<a href="https://instagram.com/${escHtml(p.instagram_handle)}" target="_blank" rel="noopener" class="btn-ol"><i class="ph-bold ph-instagram-logo"></i>@${escHtml(p.instagram_handle)}</a>` : ''}
    </div>
  </div>

  <aside>
    <div class="card">
      <h2>Contacter ${escHtml(displayName.split(' ')[0])}</h2>
      <form class="contact-form" id="contact-form" onsubmit="return contactSubmit(event)">
        <div id="contact-err" class="err-msg" style="display:none"></div>
        <input type="text" name="contactName" placeholder="Ton prénom + nom" required>
        <input type="email" name="contactEmail" placeholder="Ton email" required>
        <textarea name="message" placeholder="Présente brièvement ton logement, la ville, les dates qui t'intéressent." required></textarea>
        <div class="hp"><label>Site</label><input type="text" name="website" tabindex="-1" autocomplete="off"></div>
        <button type="submit" class="btn-p" id="contact-btn"><i class="ph-bold ph-paper-plane-tilt"></i>Envoyer ma demande</button>
      </form>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--bd);font-size:11.5px;color:var(--tl);line-height:1.6">Pas de commission. Pas d'intermédiaire. Tu négocies et contractualises directement avec ${escHtml(displayName.split(' ')[0])}.</div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="aside-row"><span class="aside-k">Ville principale</span><span class="aside-v">${escHtml(p.ville)}</span></div>
      ${p.zone_couverte ? `<div class="aside-row"><span class="aside-k">Zone couverte</span><span class="aside-v">${escHtml(p.zone_couverte)}</span></div>` : ''}
      ${tarif ? `<div class="aside-row"><span class="aside-k">Tarifs indicatifs</span><span class="aside-v">${escHtml(tarif)}</span></div>` : ''}
      ${p.specialite ? `<div class="aside-row"><span class="aside-k">Spécialité</span><span class="aside-v">${escHtml(p.specialite)}</span></div>` : ''}
      ${isFondateur ? '<div class="aside-row"><span class="aside-k">Statut</span><span class="aside-v" style="color:#b8860b">🌟 Photographe fondateur</span></div>' : ''}
    </div>
  </aside>
</div>

<div class="disclaimer">
  <strong>Important.</strong> Jason Marinho recommande ${escHtml(displayName)} après vérification de son portfolio et de son expérience LCD. Cette mise en relation est gratuite pour toi. Le contrat et le paiement de la prestation se font directement entre toi et le photographe, sans commission ni intermédiation de notre part.
</div>

<script>
const __slug = "${escHtml(p.slug)}";
const __t0 = Date.now();
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
<script defer src="/footer.js"></script>
<script src="/cookie-banner.js" defer></script>
</body>
</html>
`
}

function buildAnnuaireListPage(items) {
  const itemsHtml = items.length === 0
    ? `<div class="empty"><div class="empty-ico"><i class="ph-bold ph-camera" style="font-size:32px;color:var(--g)"></i></div><h2>L'annuaire se construit</h2><p>Aucun photographe actif pour le moment. Reviens dans quelques semaines, ou postule si tu es photographe LCD.</p><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><a href="/annuaires/photographes/inscription" class="btn-p">Postuler comme photographe →</a><a href="/devenir-photographe-lcd" class="btn-p" style="background:transparent;border:1px solid rgba(0,76,63,.25);color:var(--g)">Pourquoi rejoindre l'annuaire ?</a></div></div>`
    : `<div class="grid">${items.map(p => {
        const displayName = p.pseudo || p.full_name
        const tarif = fmtTarif(p)
        const initials = displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        return `<a href="/annuaires/photographes/${escHtml(p.slug)}" class="card">
  ${p.tier === 'fondateur' ? '<span class="card-tag gold"><i class="ph-bold ph-star"></i>Fondateur</span>' : ''}
  <div class="card-logo-row">
    ${p.logo_url
      ? `<div class="card-logo" style="background:url('${escHtml(p.logo_url)}') center/cover"></div>`
      : `<div class="card-logo placeholder">${escHtml(initials)}</div>`}
    <h3 class="card-name">${escHtml(displayName)}</h3>
  </div>
  <div class="card-ville"><i class="ph ph-map-pin"></i>${escHtml(p.ville)}${p.zone_couverte ? ` <span style="color:var(--tl);font-weight:400">· ${escHtml(p.zone_couverte)}</span>` : ''}</div>
  ${p.specialite ? `<div class="card-spe">${escHtml(p.specialite)}</div>` : ''}
  ${tarif ? `<div class="card-tarif">${escHtml(tarif)}</div>` : ''}
  <span class="card-cta">Voir le profil <i class="ph-bold ph-arrow-right"></i></span>
</a>`
      }).join('')}</div>`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Annuaire des photographes LCD · ${items.length} pros sélectionnés | Jason Marinho</title>
<meta name="description" content="${items.length} photographes professionnels spécialisés en location courte durée, sélectionnés par Jason Marinho. Recherche par ville, tarif, spécialité.">
<link rel="canonical" href="https://jasonmarinho.com/annuaires/photographes">
<meta property="og:title" content="Annuaire des photographes LCD · ${items.length} pros sélectionnés">
<meta property="og:description" content="${items.length} photographes spécialisés location courte durée, sélectionnés et vérifiés.">
<meta property="og:url" content="https://jasonmarinho.com/annuaires/photographes">
<meta property="og:type" content="website">
<meta property="og:image" content="https://jasonmarinho.com/couverture-jason.webp">
<meta name="robots" content="index, follow">
<link rel="shortcut icon" href="/favicon.ico">
<link rel="icon" href="/favicon.ico?v=2026-06" sizes="any">
<link rel="manifest" href="/manifest.json?v=2026-06">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,300;1,9..144,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<link rel="stylesheet" type="text/css" href="/fonts/phosphor-bold-subset.css">
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
.main{max-width:1100px;margin:0 auto;padding:40px clamp(16px,5vw,40px)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px}
.card{display:flex;flex-direction:column;gap:8px;padding:22px;background:#fff;border:1px solid var(--bd);border-radius:14px;text-decoration:none;color:inherit;transition:transform .2s,box-shadow .2s;position:relative}
.card:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(0,76,63,.1)}
.card-tag{position:absolute;top:18px;right:18px;display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:3px 9px;border-radius:999px;background:#eee;color:#666}
.card-tag.gold{background:rgba(255,213,107,.15);color:#b8860b;border:1px solid rgba(255,213,107,.4)}
.card-name{font-family:'Fraunces',serif;font-size:18px;font-weight:400;color:var(--td);margin:0;letter-spacing:-.2px;flex:1;min-width:0}
.card-logo-row{display:flex;align-items:center;gap:12px}
.card-logo{width:48px;height:48px;border-radius:12px;flex-shrink:0;border:1px solid var(--bd);overflow:hidden;display:flex;align-items:center;justify-content:center}
.card-logo.placeholder{background:rgba(0,76,63,.06);color:var(--g);font-family:'Fraunces',serif;font-size:18px;font-weight:500}
.card-ville{font-size:13px;color:var(--tm);font-weight:500;display:flex;align-items:center;gap:5px}
.card-ville i{color:var(--g);font-size:13px}
.card-spe{font-size:12.5px;color:var(--g);background:rgba(0,76,63,.06);padding:3px 9px;border-radius:6px;align-self:flex-start}
.card-tarif{font-size:13.5px;color:var(--td);font-weight:600;font-family:'Fraunces',serif}
.card-cta{font-size:12.5px;font-weight:600;color:var(--g);display:inline-flex;align-items:center;gap:5px;margin-top:8px}
.empty{padding:60px 20px;text-align:center;background:#fff;border:1px solid var(--bd);border-radius:16px;max-width:640px;margin:0 auto}
.empty-ico{display:inline-flex;width:80px;height:80px;border-radius:18px;background:rgba(0,76,63,.06);align-items:center;justify-content:center;margin-bottom:18px}
.empty h2{font-family:'Fraunces',serif;font-size:22px;color:var(--td);margin:0 0 12px;font-weight:400}
.empty p{font-size:14px;line-height:1.7;color:var(--tm);margin:0 0 20px}
.btn-p{display:inline-flex;align-items:center;gap:8px;background:var(--y);color:var(--gd);font-weight:600;padding:12px 22px;border-radius:10px;text-decoration:none}
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
</style>
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: `Annuaire des photographes LCD (${items.length} pros)`,
  description: 'Annuaire curé des photographes spécialisés location courte durée.',
  url: 'https://jasonmarinho.com/annuaires/photographes',
})}
</script>
<script defer src="/nav.js"></script>
</head>
<body>
<header class="hero">
  <div class="s-in">
    <div class="brd"><a href="/">Accueil</a> · <a href="/devenir-photographe-lcd">Photographes LCD</a> · <span>Annuaire</span></div>
    <span class="lbl">Annuaire vérifié · curé manuellement</span>
    <h1>${items.length} photographe${items.length > 1 ? 's' : ''} <em>LCD sélectionné${items.length > 1 ? 's' : ''}</em></h1>
    <p class="lead">Tous les photographes ci-dessous ont été vérifiés manuellement par Jason Marinho : portfolio réel en LCD, expérience confirmée, tarifs cohérents marché. Pas d'intermédiation : tu contactes directement.</p>
    ${items.length > 0 ? `<span class="count-pill"><i class="ph-bold ph-camera"></i>${items.length} pros actifs</span>` : ''}
  </div>
</header>

<main class="main">
${itemsHtml}
</main>

<section class="preview-section">
  <div class="preview-card">
    <div class="preview-thumb"><i class="ph-bold ph-camera"></i></div>
    <div class="preview-card-text">
      <span class="preview-lbl">Voir un exemple</span>
      <h3 class="preview-h">À quoi ressemble une fiche <em>photographe LCD</em> ?</h3>
      <p class="preview-p">Découvre le mini-site qu'un photographe obtient en s'inscrivant : présentation, portfolio, spécialité, tarifs, zone d'intervention et formulaire de contact direct. Aperçu fidèle hébergé sur jasonmarinho.com.</p>
      <a href="/annuaires/photographes/exemple-fiche" class="preview-cta"><i class="ph-bold ph-eye"></i> Voir l'exemple de fiche</a>
    </div>
  </div>
</section>

<div class="disclaimer">
  <strong>Comment ça marche.</strong> Tu cliques sur un photographe, tu consultes son portfolio et tu lui envoies une demande via le formulaire de sa fiche. Aucune commission, aucune intermédiation Jason Marinho. La transaction (devis, contrat, paiement) se fait directement entre toi et le photographe.
</div>

<script defer src="/footer.js"></script>
<script src="/cookie-banner.js" defer></script>
</body>
</html>
`
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
  const items = await fetchActive()

  // Clean photographes dir (regen all)
  if (fs.existsSync(FICHES_DIR)) {
    // Cleanup : on supprime UNIQUEMENT les sous-dossiers de fiches (slugs).
    // Hub + annuaire + inscription + exemple-fiche (RESERVED_DIRS) sont
    // intouchables — sinon le rm casse tout le hub /annuaires/photographes/.
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

  // Injecte la liste dans la page pitch /devenir-photographe-lcd pour que
  // les photographes voient les pros actifs immédiatement sans clic.
  injectListIntoHub(items)

  console.log(`[build-photographers] ✓ ${items.length} fiches + annuaire + sitemap + devenir injecté`)
}

/**
 * Construit le bloc HTML inséré dans le hub :
 * - Si >=1 pro actif → grille de fiches + lien "voir tous"
 * - Si 0 pro → aperçu de fiche exemple (fallback marketing)
 */
function buildHubInjection(items) {
  if (items.length === 0) {
    // Fallback : aperçu fiche exemple (Camille Sénéchal)
    return `<section class="sec cr" id="annuaire">
  <div class="s-in">
    <div style="text-align:center;max-width:680px;margin:0 auto 32px">
      <div class="lbl dk">Aperçu d'une fiche</div>
      <h2 class="h2">À quoi ressemble <em>une fiche photographe</em> ?</h2>
      <p style="font-size:15.5px;color:var(--tm);line-height:1.75;margin:14px 0 0">Voilà concrètement ce que tu obtiens : un mini-site pro hébergé sur jasonmarinho.com avec ton logo, ta bio, ta zone, tes tarifs et un formulaire de contact direct. Aperçu fidèle ci-dessous, à toi de cliquer pour voir la version complète.</p>
    </div>
    <a href="/annuaires/photographes/exemple-fiche" style="display:block;max-width:760px;margin:0 auto;padding:28px;background:#fff;border:1px solid var(--bd);border-radius:18px;text-decoration:none;color:inherit;position:relative">
      <span style="position:absolute;top:18px;right:18px;display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:4px 10px;border-radius:999px;background:rgba(255,213,107,.18);color:#b8860b;border:1px solid rgba(255,213,107,.4)"><i class="ph-bold ph-eye" style="font-size:10px"></i>Exemple</span>
      <div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
        <div style="width:96px;height:96px;border-radius:18px;flex-shrink:0;background:linear-gradient(160deg,#001a11,var(--gd) 60%,#00463a);color:var(--y);display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-size:36px;font-weight:400">CS</div>
        <div style="flex:1;min-width:200px">
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"><span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:3px 8px;border-radius:999px;background:rgba(255,213,107,.18);color:#b8860b;border:1px solid rgba(255,213,107,.35)"><i class="ph-bold ph-star" style="font-size:9px"></i>Fondateur</span><span style="display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:600;color:var(--g);background:rgba(0,76,63,.06);padding:3px 8px;border-radius:6px">Intérieurs + drone</span></div>
          <h3 style="font-family:'Fraunces',serif;font-size:22px;font-weight:400;color:var(--td);margin:0 0 4px">Camille Sénéchal</h3>
          <div style="font-size:13.5px;color:var(--tm);margin-bottom:6px"><i class="ph ph-map-pin" style="color:var(--g);font-size:13px;margin-right:3px"></i>Lyon <span style="color:var(--tl)">· Lyon + 60 km</span></div>
          <div style="font-size:14px;color:var(--td);font-weight:600;font-family:'Fraunces',serif">350 – 700 € la session</div>
        </div>
      </div>
      <div style="margin-top:18px;padding-top:18px;border-top:1px solid var(--bd);display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap"><span style="font-size:13px;color:var(--tl)">Portfolio · contact direct hôte · pas de commission</span><span style="font-size:13px;font-weight:600;color:var(--g)">Voir la fiche complète <i class="ph-bold ph-arrow-right" style="font-size:12px"></i></span></div>
    </a>
  </div>
</section>`
  }

  // ≥1 pro : grille de fiches actives + lien voir tous
  const cardsHtml = items.slice(0, 12).map(p => {
    const displayName = p.pseudo || p.full_name
    const tarif = fmtTarif(p)
    const initials = displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    return `<a href="/annuaires/photographes/${escHtml(p.slug)}" style="display:flex;flex-direction:column;gap:8px;padding:22px;background:#fff;border:1px solid var(--bd);border-radius:14px;text-decoration:none;color:inherit;transition:transform .2s,box-shadow .2s;position:relative">
  ${p.tier === 'fondateur' ? '<span style="position:absolute;top:18px;right:18px;display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:3px 9px;border-radius:999px;background:rgba(255,213,107,.15);color:#b8860b;border:1px solid rgba(255,213,107,.4)"><i class="ph-bold ph-star"></i>Fondateur</span>' : ''}
  <div style="display:flex;align-items:center;gap:12px">
    ${p.logo_url
      ? `<div style="width:48px;height:48px;border-radius:12px;flex-shrink:0;border:1px solid var(--bd);background:url('${escHtml(p.logo_url)}') center/cover"></div>`
      : `<div style="width:48px;height:48px;border-radius:12px;flex-shrink:0;background:rgba(0,76,63,.06);color:var(--g);font-family:'Fraunces',serif;font-size:18px;font-weight:500;display:flex;align-items:center;justify-content:center;border:1px solid var(--bd)">${escHtml(initials)}</div>`}
    <h3 style="font-family:'Fraunces',serif;font-size:18px;font-weight:400;color:var(--td);margin:0;letter-spacing:-.2px">${escHtml(displayName)}</h3>
  </div>
  <div style="font-size:13px;color:var(--tm);font-weight:500;display:flex;align-items:center;gap:5px"><i class="ph ph-map-pin" style="color:var(--g);font-size:13px"></i>${escHtml(p.ville)}${p.zone_couverte ? ` <span style="color:var(--tl);font-weight:400">· ${escHtml(p.zone_couverte)}</span>` : ''}</div>
  ${p.specialite ? `<div style="font-size:12.5px;color:var(--g);background:rgba(0,76,63,.06);padding:3px 9px;border-radius:6px;align-self:flex-start">${escHtml(p.specialite)}</div>` : ''}
  ${tarif ? `<div style="font-size:13.5px;color:var(--td);font-weight:600;font-family:'Fraunces',serif">${escHtml(tarif)}</div>` : ''}
  <span style="font-size:12.5px;font-weight:600;color:var(--g);display:inline-flex;align-items:center;gap:5px;margin-top:8px">Voir le profil <i class="ph-bold ph-arrow-right"></i></span>
</a>`
  }).join('')
  const seeMoreLink = items.length > 12
    ? `<div style="text-align:center;margin-top:24px"><a href="/annuaires/photographes" style="display:inline-flex;align-items:center;gap:7px;font-size:14px;font-weight:600;color:var(--g);text-decoration:none">Voir les ${items.length} photographes actifs <i class="ph-bold ph-arrow-right" style="font-size:12px"></i></a></div>`
    : ''
  return `<section class="sec cr" id="annuaire">
  <div class="s-in">
    <div style="text-align:center;max-width:680px;margin:0 auto 32px">
      <span class="lbl dk">${items.length} photographe${items.length > 1 ? 's' : ''} actif${items.length > 1 ? 's' : ''}</span>
      <h2 class="h2">L'annuaire <em>en direct</em></h2>
      <p style="font-size:15.5px;color:var(--tm);line-height:1.75;margin:14px 0 0">Tous les photographes ci-dessous ont été vérifiés manuellement par Jason Marinho. Clique sur une fiche pour voir le portfolio et contacter directement, sans commission ni intermédiation.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px;max-width:1100px;margin:0 auto">${cardsHtml}</div>
    ${seeMoreLink}
  </div>
</section>`
}

function injectListIntoHub(items) {
  const hubPath = DEVENIR_PAGE
  if (!fs.existsSync(hubPath)) {
    console.warn('[build-photographers] page devenir introuvable, skip injection')
    return
  }
  let hubHtml = fs.readFileSync(hubPath, 'utf8')
  const startMarker = '<!-- ANNUAIRE_LIST_START -->'
  const endMarker = '<!-- ANNUAIRE_LIST_END -->'
  const startIdx = hubHtml.indexOf(startMarker)
  const endIdx = hubHtml.indexOf(endMarker)
  if (startIdx === -1 || endIdx === -1) {
    console.warn('[build-photographers] markers ANNUAIRE_LIST_* absents du hub, skip injection')
    return
  }
  const before = hubHtml.slice(0, startIdx + startMarker.length)
  const after = hubHtml.slice(endIdx)
  const newSection = '\n' + buildHubInjection(items) + '\n'
  fs.writeFileSync(hubPath, before + newSection + after, 'utf8')
}

main().catch(err => {
  console.error('[build-photographers] Erreur:', err)
  process.exit(0)
})
