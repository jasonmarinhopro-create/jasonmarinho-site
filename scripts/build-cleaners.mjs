#!/usr/bin/env node
/**
 * Build script — génère l'annuaire public des équipes de ménage LCD et
 * les fiches individuelles SEO friendly. Réplique du pattern
 * build-photographers.mjs.
 *
 * - /services/menage-lcd/annuaire/index.html : liste filtrable
 * - /menage/[slug]/index.html : fiche individuelle
 * - /sitemap-menages.xml : sitemap dédié
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ANNUAIRE_DIR = path.join(ROOT, 'services', 'menage-lcd', 'annuaire')
const FICHES_DIR = path.join(ROOT, 'menage')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const HAS_SUPABASE = !!(SUPABASE_URL && SERVICE_KEY)

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

function fmtForfait(c) {
  if (!c.tarif_forfait_min && !c.tarif_forfait_max) return null
  if (c.tarif_forfait_min && c.tarif_forfait_max) return `${c.tarif_forfait_min} – ${c.tarif_forfait_max} €`
  return c.tarif_forfait_min ? `dès ${c.tarif_forfait_min} €` : `jusqu'à ${c.tarif_forfait_max} €`
}

function buildFichePage(c) {
  const displayName = c.pseudo || c.full_name
  const title = `${displayName} · Équipe ménage LCD ${c.ville} | Jason Marinho`
  const forfait = fmtForfait(c)
  const heure = c.tarif_heure ? `${c.tarif_heure} €/h` : null
  const desc = `${displayName}, équipe de ménage spécialisée location courte durée à ${c.ville}${c.zone_couverte ? ' et ' + c.zone_couverte : ''}.${forfait ? ' Forfait turnover ' + forfait + '.' : ''}${heure ? ' Tarif horaire ' + heure + '.' : ''}`
  const canonical = `https://jasonmarinho.com/menage/${c.slug}`
  const isFondateur = c.tier === 'fondateur'

  const prestations = (c.prestations || []).map(p => PRESTATIONS_LABELS[p] || p)
  const equipeLabel = c.equipe_type ? EQUIPE_LABELS[c.equipe_type] : null
  const delaiLabel = c.delai_reservation ? DELAI_LABELS[c.delai_reservation] : null
  const langues = (c.langues || []).map(l => l.toUpperCase()).join(', ')

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
.s-in{max-width:1000px;margin:0 auto;padding:0 clamp(16px,5vw,40px)}
.brd{font-size:13px;color:rgba(255,255,255,.4);margin-bottom:22px}
.brd a{color:rgba(255,255,255,.55);text-decoration:none}
.tag-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.tag{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.08);color:rgba(255,255,255,.7)}
.tag.gold{background:rgba(255,213,107,.15);color:#FFD56B;border:1px solid rgba(255,213,107,.35)}
.tag.green{background:rgba(99,214,131,.15);color:#63D683;border:1px solid rgba(99,214,131,.3)}
h1{font-family:'Fraunces',serif;font-size:clamp(28px,4vw,46px);font-weight:400;line-height:1.1;letter-spacing:-.5px;margin:0 0 14px}
h1 em{color:var(--y);font-style:italic;font-weight:300}
.subtitle{font-size:16px;color:rgba(255,255,255,.65);line-height:1.7;max-width:640px;margin:0}
.meta-row{display:flex;flex-wrap:wrap;gap:18px;margin-top:24px;font-size:13.5px;color:rgba(255,255,255,.7)}
.meta-row span{display:inline-flex;align-items:center;gap:6px}
.body{max-width:1000px;margin:0 auto;padding:48px clamp(16px,5vw,40px) 28px;display:grid;grid-template-columns:1fr 360px;gap:34px}
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
.disclaimer{max-width:1000px;margin:0 auto;padding:20px clamp(16px,5vw,40px) 50px;font-size:12.5px;color:var(--tl);line-height:1.7}
.disclaimer strong{color:var(--td)}
.ok-msg{padding:14px;background:rgba(0,200,100,.08);border:1px solid rgba(0,200,100,.25);border-radius:8px;color:#1e9d54;font-size:13.5px;text-align:center}
.err-msg{padding:12px 14px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.22);border-radius:8px;color:#dc2626;font-size:13px;margin-bottom:10px}
.trust-row{display:flex;align-items:center;gap:8px;padding:9px 12px;background:rgba(99,214,131,.08);border:1px solid rgba(99,214,131,.2);border-radius:8px;margin-top:12px;font-size:13px;color:#1e9d54;font-weight:500}
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
  knowsAbout: ['Ménage Airbnb', 'Turnover LCD', 'Gestion du linge', ...prestations].slice(0, 12),
  telephone: c.telephone || undefined,
  email: undefined,
  sameAs: [c.site_url, c.instagram_handle ? `https://instagram.com/${c.instagram_handle}` : null].filter(Boolean),
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
    { '@type': 'ListItem', position: 2, name: 'Ménage LCD', item: 'https://jasonmarinho.com/services/menage-lcd' },
    { '@type': 'ListItem', position: 3, name: 'Annuaire', item: 'https://jasonmarinho.com/services/menage-lcd/annuaire' },
    { '@type': 'ListItem', position: 4, name: displayName, item: canonical },
  ],
})}
</script>
<script defer src="/nav.js"></script>
</head>
<body>
<header class="hero">
  <div class="s-in">
    <div class="brd"><a href="/">Accueil</a> · <a href="/services/menage-lcd">Ménage LCD</a> · <a href="/services/menage-lcd/annuaire">Annuaire</a> · <span>${escHtml(displayName)}</span></div>
    <div class="tag-row">
      ${isFondateur ? '<span class="tag gold"><i class="ph-bold ph-star" style="font-size:10px"></i>Fondateur</span>' : ''}
      ${c.assurance_rc_pro ? '<span class="tag green"><i class="ph-bold ph-shield-check" style="font-size:10px"></i>RC Pro</span>' : ''}
      ${equipeLabel ? `<span class="tag">${escHtml(equipeLabel)}</span>` : ''}
      <span class="tag"><i class="ph-bold ph-map-pin" style="font-size:10px"></i>${escHtml(c.ville)}</span>
    </div>
    <h1>${escHtml(displayName)}<br><em>équipe ménage LCD</em></h1>
    ${c.zone_couverte ? `<p class="subtitle">Zone d'intervention : ${escHtml(c.zone_couverte)}</p>` : ''}
    <div class="meta-row">
      ${forfait ? `<span><i class="ph-bold ph-currency-eur"></i>Forfait turnover ${escHtml(forfait)}</span>` : ''}
      ${heure ? `<span><i class="ph-bold ph-clock"></i>${escHtml(heure)}</span>` : ''}
      ${delaiLabel ? `<span><i class="ph-bold ph-lightning"></i>${escHtml(delaiLabel)}</span>` : ''}
      <span><i class="ph-bold ph-shield-check"></i>Vérifié par Jason Marinho</span>
    </div>
  </div>
</header>

<div class="body">
  <div>
    ${c.bio ? `<div class="card" style="margin-bottom:20px"><h2>Présentation</h2><div class="bio">${escHtml(c.bio)}</div></div>` : ''}
    ${prestations.length > 0 ? `<div class="card" style="margin-bottom:20px"><h2>Prestations</h2><div class="prestations-grid">${prestations.map(p => `<span class="prestation-chip"><i class="ph-bold ph-check"></i>${escHtml(p)}</span>`).join('')}</div></div>` : ''}
    <div class="card">
      <h2>Capacité & disponibilité</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-top:6px">
        ${equipeLabel ? `<div><div style="font-size:11px;color:var(--tl);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:4px">Taille équipe</div><div style="font-size:14px;color:var(--td);font-weight:500">${escHtml(equipeLabel)}</div></div>` : ''}
        ${c.logements_geres ? `<div><div style="font-size:11px;color:var(--tl);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:4px">Logements gérés</div><div style="font-size:14px;color:var(--td);font-weight:500">${c.logements_geres} en parc actuel</div></div>` : ''}
        ${delaiLabel ? `<div><div style="font-size:11px;color:var(--tl);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:4px">Réactivité</div><div style="font-size:14px;color:var(--td);font-weight:500">${escHtml(delaiLabel)}</div></div>` : ''}
        ${langues ? `<div><div style="font-size:11px;color:var(--tl);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:4px">Langues</div><div style="font-size:14px;color:var(--td);font-weight:500">${escHtml(langues)}</div></div>` : ''}
      </div>
      ${c.assurance_rc_pro ? `<div class="trust-row"><i class="ph-bold ph-shield-check" style="font-size:15px"></i>Couvert par une assurance Responsabilité Civile Professionnelle</div>` : ''}
      ${c.siret ? `<div style="margin-top:10px;font-size:12px;color:var(--tl)">SIRET déclaré : <strong style="color:var(--td);font-variant-numeric:tabular-nums">${escHtml(c.siret)}</strong></div>` : ''}
    </div>
  </div>

  <aside>
    <div class="card">
      <h2>Contacter ${escHtml((c.full_name || displayName).split(' ')[0])}</h2>
      <form class="contact-form" id="contact-form" onsubmit="return contactSubmit(event)">
        <div id="contact-err" class="err-msg" style="display:none"></div>
        <input type="text" name="contactName" placeholder="Ton prénom + nom" required>
        <input type="email" name="contactEmail" placeholder="Ton email" required>
        <textarea name="message" placeholder="Décris ton ou tes logements (ville, capacité, fréquence des turnovers, prestations souhaitées)." required></textarea>
        <div class="hp"><label>Site</label><input type="text" name="website" tabindex="-1" autocomplete="off"></div>
        <button type="submit" class="btn-p" id="contact-btn"><i class="ph-bold ph-paper-plane-tilt"></i>Envoyer ma demande</button>
      </form>
      ${c.site_url ? `<a href="${escHtml(c.site_url)}" target="_blank" rel="noopener noreferrer" class="btn-ol"><i class="ph-bold ph-globe"></i>Voir le site</a>` : ''}
      ${c.instagram_handle ? `<a href="https://instagram.com/${escHtml(c.instagram_handle)}" target="_blank" rel="noopener" class="btn-ol"><i class="ph-bold ph-instagram-logo"></i>@${escHtml(c.instagram_handle)}</a>` : ''}
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--bd);font-size:11.5px;color:var(--tl);line-height:1.6">Pas de commission. Pas d'intermédiaire. Tu négocies et contractualises directement avec l'équipe.</div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="aside-row"><span class="aside-k">Ville principale</span><span class="aside-v">${escHtml(c.ville)}</span></div>
      ${c.zone_couverte ? `<div class="aside-row"><span class="aside-k">Zone couverte</span><span class="aside-v">${escHtml(c.zone_couverte)}</span></div>` : ''}
      ${forfait ? `<div class="aside-row"><span class="aside-k">Forfait turnover</span><span class="aside-v">${escHtml(forfait)}</span></div>` : ''}
      ${heure ? `<div class="aside-row"><span class="aside-k">Tarif horaire</span><span class="aside-v">${escHtml(heure)}</span></div>` : ''}
      ${c.assurance_rc_pro ? '<div class="aside-row"><span class="aside-k">Assurance</span><span class="aside-v green">✓ RC pro</span></div>' : ''}
      ${isFondateur ? '<div class="aside-row"><span class="aside-k">Statut</span><span class="aside-v" style="color:#b8860b">🌟 Équipe fondatrice</span></div>' : ''}
    </div>
  </aside>
</div>

<div class="disclaimer">
  <strong>Important.</strong> Jason Marinho recommande ${escHtml(displayName)} après vérification du dossier (références LCD, capacité, sérieux). Cette mise en relation est gratuite pour toi. Le devis, le contrat et le paiement de la prestation se font directement entre toi et l'équipe de ménage, sans commission ni intermédiation de notre part.
</div>

<script>
const __slug = "${escHtml(c.slug)}";
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
    const res = await fetch('/api/cleaner/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      errBox.textContent = body.error || 'Erreur lors de l\\'envoi. Réessaye.';
      errBox.style.display = 'block';
      btn.disabled = false; btn.innerHTML = '<i class="ph-bold ph-paper-plane-tilt"></i>Envoyer ma demande';
      return false;
    }
    document.getElementById('contact-form').outerHTML = '<div class="ok-msg"><strong>Message envoyé ✓</strong><br>${escHtml((c.full_name || displayName).split(' ')[0])} te recontacte généralement sous 48h.</div>';
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
    ? `<div class="empty"><div class="empty-ico"><i class="ph-bold ph-sparkle" style="font-size:32px;color:var(--g)"></i></div><h2>L'annuaire se construit</h2><p>Aucune équipe active pour le moment. Reviens dans quelques semaines, ou postule si tu gères une équipe de ménage LCD.</p><a href="/services/menage-lcd/inscription" class="btn-p">Postuler comme équipe de ménage →</a></div>`
    : `<div class="grid">${items.map(c => {
        const displayName = c.pseudo || c.full_name
        const forfait = fmtForfait(c)
        const heure = c.tarif_heure ? `${c.tarif_heure} €/h` : null
        const tarifLine = [forfait, heure].filter(Boolean).join(' · ')
        const equipeLabel = c.equipe_type ? EQUIPE_LABELS[c.equipe_type] : null
        return `<a href="/menage/${escHtml(c.slug)}" class="card">
  ${c.tier === 'fondateur' ? '<span class="card-tag gold"><i class="ph-bold ph-star"></i>Fondateur</span>' : ''}
  <h3 class="card-name">${escHtml(displayName)}</h3>
  <div class="card-ville"><i class="ph ph-map-pin"></i>${escHtml(c.ville)}${c.zone_couverte ? ` <span style="color:var(--tl);font-weight:400">· ${escHtml(c.zone_couverte)}</span>` : ''}</div>
  ${equipeLabel ? `<div class="card-spe">${escHtml(equipeLabel)}</div>` : ''}
  ${tarifLine ? `<div class="card-tarif">${escHtml(tarifLine)}</div>` : ''}
  ${c.assurance_rc_pro ? '<div class="card-rc"><i class="ph-bold ph-shield-check"></i>RC pro</div>' : ''}
  <span class="card-cta">Voir le profil <i class="ph-bold ph-arrow-right"></i></span>
</a>`
      }).join('')}</div>`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Annuaire des équipes de ménage LCD · ${items.length} pros sélectionnés | Jason Marinho</title>
<meta name="description" content="${items.length} équipes de ménage spécialisées en location courte durée, sélectionnées par Jason Marinho. Recherche par ville, prestations, capacité.">
<link rel="canonical" href="https://jasonmarinho.com/services/menage-lcd/annuaire">
<meta property="og:title" content="Annuaire des équipes de ménage LCD · ${items.length} pros sélectionnés">
<meta property="og:description" content="${items.length} équipes de ménage spécialisées location courte durée, sélectionnées et vérifiées.">
<meta property="og:url" content="https://jasonmarinho.com/services/menage-lcd/annuaire">
<meta property="og:type" content="website">
<meta property="og:image" content="https://jasonmarinho.com/couverture-jason.webp">
<meta name="robots" content="index, follow">
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
.card-name{font-family:'Fraunces',serif;font-size:18px;font-weight:400;color:var(--td);margin:0;letter-spacing:-.2px}
.card-ville{font-size:13px;color:var(--tm);font-weight:500;display:flex;align-items:center;gap:5px}
.card-ville i{color:var(--g);font-size:13px}
.card-spe{font-size:12.5px;color:var(--g);background:rgba(0,76,63,.06);padding:3px 9px;border-radius:6px;align-self:flex-start}
.card-tarif{font-size:13.5px;color:var(--td);font-weight:600;font-family:'Fraunces',serif}
.card-rc{font-size:11.5px;color:#1e9d54;display:inline-flex;align-items:center;gap:4px;font-weight:600}
.card-cta{font-size:12.5px;font-weight:600;color:var(--g);display:inline-flex;align-items:center;gap:5px;margin-top:8px}
.empty{padding:60px 20px;text-align:center;background:#fff;border:1px solid var(--bd);border-radius:16px;max-width:640px;margin:0 auto}
.empty-ico{display:inline-flex;width:80px;height:80px;border-radius:18px;background:rgba(0,76,63,.06);align-items:center;justify-content:center;margin-bottom:18px}
.empty h2{font-family:'Fraunces',serif;font-size:22px;color:var(--td);margin:0 0 12px;font-weight:400}
.empty p{font-size:14px;line-height:1.7;color:var(--tm);margin:0 0 20px}
.btn-p{display:inline-flex;align-items:center;gap:8px;background:var(--y);color:var(--gd);font-weight:600;padding:12px 22px;border-radius:10px;text-decoration:none}
.disclaimer{max-width:1100px;margin:30px auto 0;padding:0 clamp(16px,5vw,40px) 50px;font-size:12.5px;color:var(--tl);line-height:1.7}
</style>
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: `Annuaire des équipes de ménage LCD (${items.length} pros)`,
  description: 'Annuaire curé des équipes de ménage spécialisées location courte durée.',
  url: 'https://jasonmarinho.com/services/menage-lcd/annuaire',
})}
</script>
<script defer src="/nav.js"></script>
</head>
<body>
<header class="hero">
  <div class="s-in">
    <div class="brd"><a href="/">Accueil</a> · <a href="/services/menage-lcd">Ménage LCD</a> · <span>Annuaire</span></div>
    <span class="lbl">Annuaire vérifié · curé manuellement</span>
    <h1>${items.length} équipe${items.length > 1 ? 's' : ''} de ménage <em>LCD sélectionnée${items.length > 1 ? 's' : ''}</em></h1>
    <p class="lead">Toutes les équipes ci-dessous ont été vérifiées manuellement par Jason Marinho : références LCD réelles (turnover Airbnb/Booking), capacité confirmée, prestations cohérentes. Pas d'intermédiation : tu contactes directement.</p>
    ${items.length > 0 ? `<span class="count-pill"><i class="ph-bold ph-sparkle"></i>${items.length} équipes actives</span>` : ''}
  </div>
</header>

<main class="main">
${itemsHtml}
</main>

<div class="disclaimer">
  <strong>Comment ça marche.</strong> Tu cliques sur une équipe, tu consultes ses prestations et tu lui envoies une demande via le formulaire de sa fiche. Aucune commission, aucune intermédiation Jason Marinho. La transaction (devis, contrat, paiement) se fait directement entre toi et l'équipe.
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
    `  <url><loc>https://jasonmarinho.com/services/menage-lcd</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.85</priority></url>`,
    `  <url><loc>https://jasonmarinho.com/services/menage-lcd/annuaire</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`,
    `  <url><loc>https://jasonmarinho.com/services/menage-lcd/inscription</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`,
    ...items.map(c => {
      return `  <url><loc>https://jasonmarinho.com/menage/${c.slug}</loc><lastmod>${(c.created_at || today).slice(0, 10)}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`
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

  // Clean menage dir
  if (fs.existsSync(FICHES_DIR)) {
    for (const entry of fs.readdirSync(FICHES_DIR, { withFileTypes: true })) {
      if (entry.isDirectory()) fs.rmSync(path.join(FICHES_DIR, entry.name), { recursive: true, force: true })
    }
  } else {
    fs.mkdirSync(FICHES_DIR, { recursive: true })
  }

  for (const c of items) {
    const dir = path.join(FICHES_DIR, c.slug)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'index.html'), buildFichePage(c), 'utf8')
  }

  fs.mkdirSync(ANNUAIRE_DIR, { recursive: true })
  fs.writeFileSync(path.join(ANNUAIRE_DIR, 'index.html'), buildAnnuaireListPage(items), 'utf8')

  fs.writeFileSync(path.join(ROOT, 'sitemap-menages.xml'), buildSitemap(items), 'utf8')

  console.log(`[build-cleaners] ✓ ${items.length} fiches + annuaire + sitemap générés`)
}

main().catch(err => {
  console.error('[build-cleaners] Erreur:', err)
  process.exit(0)
})
