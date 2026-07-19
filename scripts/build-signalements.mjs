#!/usr/bin/env node
/**
 * Build script : génère les pages publiques anonymisées des signalements
 * et le sitemap dédié. Lancé en prebuild Vercel via vercel.json.
 *
 * Si SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL ne sont pas
 * disponibles (build local sans .env), le script no-op proprement.
 * Pas d'erreur fatale : on ne casse jamais le build du site marketing.
 *
 * Lit la view `public_signalements_view` qui filtre strictement les
 * signalements approved + public_visible. Aucune fuite de PII possible
 * même si on commit le code par erreur.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'securite', 'signalements')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const HAS_SUPABASE = !!(SUPABASE_URL && SERVICE_KEY)

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('[build-signalements] DIAGNOSTIC START')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`[build-signalements] NEXT_PUBLIC_SUPABASE_URL : ${SUPABASE_URL ? '✓ posée (' + SUPABASE_URL.slice(0, 40) + '...)' : '✗ MANQUANTE : pose-la dans Vercel → projet site statique → Settings → Environment Variables'}`)
console.log(`[build-signalements] SUPABASE_SERVICE_ROLE_KEY : ${SERVICE_KEY ? '✓ posée (longueur ' + SERVICE_KEY.length + ')' : '✗ MANQUANTE : pose-la dans Vercel → projet site statique → Settings → Environment Variables'}`)

if (!HAS_SUPABASE) {
  console.log('[build-signalements] ⚠ Env vars Supabase absentes → liste publique générée vide.')
  console.log('[build-signalements] → Va dans Vercel, projet SITE STATIQUE (jasonmarinho.com), Settings → Environment Variables, pose les 2 vars ci-dessus, puis Redeploy ce projet (pas jason-app).')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

const MOIS_FR = ['', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

function escHtml(s) {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function fmtMonth(yyyyMm) {
  if (!yyyyMm) return ''
  const [y, m] = yyyyMm.split('-')
  const mi = parseInt(m, 10)
  if (!mi || mi < 1 || mi > 12) return ''
  return `${MOIS_FR[mi]} ${y}`
}

async function fetchSignalements() {
  if (!HAS_SUPABASE) return []
  const url = `${SUPABASE_URL}/rest/v1/public_signalements_view?select=*&order=created_at.desc&limit=2000`
  console.log(`[build-signalements] Fetch: ${url}`)
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Accept: 'application/json',
    },
  })
  console.log(`[build-signalements] Réponse Supabase status: ${res.status}`)
  if (!res.ok) {
    const text = await res.text()
    console.warn(`[build-signalements] ✗ Supabase fetch FAILED (${res.status}): ${text}`)
    console.warn('[build-signalements] → Causes probables :')
    console.warn('[build-signalements]   - migration 20260614_054 pas exécutée dans Supabase (la view public_signalements_view n\'existe pas)')
    console.warn('[build-signalements]   - SUPABASE_SERVICE_ROLE_KEY invalide ou expirée')
    console.warn('[build-signalements]   - URL Supabase incorrecte')
    return []
  }
  const data = await res.json()
  console.log(`[build-signalements] ✓ Reçu ${Array.isArray(data) ? data.length : 0} ligne(s) de la view public_signalements_view`)
  if (Array.isArray(data) && data.length > 0) {
    console.log(`[build-signalements] Premier slug: "${data[0].slug}" · ville: "${data[0].city}" · mois: "${data[0].month}"`)
  } else {
    console.log('[build-signalements] ⚠ La view retourne 0 ligne. Causes probables :')
    console.log('[build-signalements]   - Aucun signalement avec moderation_status=\'approved\' ET public_visible=true en DB')
    console.log('[build-signalements]   - Vérifie dans Supabase Studio : table reported_guests, filtre moderation_status=approved, public_visible=true')
    console.log('[build-signalements]   - Si tu as approuvé un signalement, va dans Supabase Studio table reported_guests et vérifie ces 2 colonnes sur la ligne')
  }
  return data
}

function buildFichePage(item) {
  const monthLabel = fmtMonth(item.month)
  // Fil conducteur orienté UTILITÉ HÔTE :
  //  1. Hero : Identifier l'incident (type + résumé en lead)
  //  2. Section "Le récit" : Ce qui s'est passé (le summary détaillé)
  //  3. Section "Les signaux d'alerte" : Comment reconnaître (universel)
  //  4. Section "Comment se protéger" : Quoi faire avant/après (universel)
  //  5. CTA : Drive vers inscription dashboard
  //  6. Footer : Disclaimer + contestation + métadonnées (date, source)
  //
  // La ville disparaît du titre/URL/breadcrumb : pas un signal utile pour
  // reconnaître un pattern. Elle apparaît juste en pied de page comme
  // métadonnée discrète pour les lecteurs curieux.
  const title = item.incident_type
  const desc = item.summary.slice(0, 155) + (item.summary.length > 155 ? '...' : '')
  const canonical = `https://jasonmarinho.com/securite/signalements/${item.slug}`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(title)} | Signalement voyageur LCD : Jason Marinho</title>
<meta name="description" content="${escHtml(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${escHtml(title)}">
<meta property="og:description" content="${escHtml(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="article">
<meta property="og:image" content="https://jasonmarinho.com/couverture-jason.webp">
<meta property="og:site_name" content="Jason Marinho">
<meta name="robots" content="index, follow">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="96x96" href="/icon-96.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#004C3F">
<link rel="stylesheet" href="/fonts/site-fonts.css">
<link rel="stylesheet" type="text/css" href="/fonts/phosphor-bold-subset.css">
<link rel="stylesheet" type="text/css" href="/fonts/phosphor-regular-subset.css">
<style>
:root{--g:#004C3F;--gd:#003329;--y:#FFD56B;--cr:#F7F5F0;--w:#FDFCF9;--td:#0F1A0D;--tm:#3D5038;--tl:#7A8C77;--bd:rgba(0,76,63,.09)}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;padding-top:64px;font-family:'Outfit',sans-serif;background:var(--w);color:var(--td)}
body::before{content:'';position:fixed;top:0;left:0;right:0;height:64px;background:var(--gd);z-index:100}
a{color:inherit}
.sec{padding:clamp(48px,7vw,80px) 0}
.sec.cr{background:var(--cr)}
.sec.dk{background:var(--gd)}
.s-in{max-width:1100px;margin:0 auto;padding:0 clamp(16px,5vw,60px)}
.s-in.narrow{max-width:820px}
.hero{background:linear-gradient(160deg,#001a11 0%,var(--gd) 55%,#00463a 100%);padding:clamp(56px,7vw,80px) 0;color:#fff}
.brd{font-size:13px;color:rgba(255,255,255,.4);margin-bottom:22px;line-height:1.6}
.brd a{color:rgba(255,255,255,.55);text-decoration:none}
.brd a:hover{color:#fff}
.lbl{display:inline-block;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,213,107,.7);margin-bottom:14px}
.lbl.dk{color:var(--g)}
.h1{font-family:'Fraunces',serif;font-size:clamp(1.7rem,3.8vw,2.8rem);line-height:1.15;letter-spacing:-.02em;color:#fff;margin:0 0 18px;font-weight:400}
.lead{font-size:clamp(15px,1.5vw,17px);font-weight:300;line-height:1.7;color:rgba(255,255,255,.72);margin:0;max-width:680px}
.hint-block{display:inline-flex;align-items:center;gap:12px;background:rgba(255,213,107,.08);border:1px solid rgba(255,213,107,.22);border-radius:10px;padding:10px 16px;margin:0 0 22px;flex-wrap:wrap}
.hint-lbl{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:rgba(255,213,107,.7)}
.hint-lbl i{font-size:13px}
.hint-val{font-family:'JetBrains Mono','SF Mono','Consolas',monospace;font-size:14.5px;font-weight:500;color:var(--y);letter-spacing:.5px}
.h2{font-family:'Fraunces',serif;font-size:clamp(1.4rem,2.5vw,1.9rem);font-weight:400;line-height:1.2;letter-spacing:-.02em;color:var(--td);margin:0 0 14px}
.h2 em{color:var(--g);font-style:italic;font-weight:300}
.h2.lt{color:#fff}.h2.lt em{color:var(--y)}
.p{font-size:15px;line-height:1.75;color:var(--tm);margin:0 0 14px;font-weight:400}
.recit{background:#fff;border:1px solid var(--bd);border-left:3px solid var(--g);border-radius:12px;padding:clamp(20px,3vw,28px);font-size:clamp(15px,1.4vw,17px);line-height:1.75;color:var(--td);font-weight:400}
.list-num{display:flex;flex-direction:column;gap:14px;margin:24px 0 0}
.list-num li{display:flex;gap:14px;align-items:flex-start;list-style:none}
.list-num .num{flex-shrink:0;width:28px;height:28px;border-radius:50%;background:var(--g);color:#fff;font-family:'Fraunces',serif;font-weight:600;font-size:13px;display:flex;align-items:center;justify-content:center;margin-top:2px}
.list-num .txt{font-size:14.5px;line-height:1.7;color:var(--tm)}
.list-num .txt strong{color:var(--td);font-weight:600}
.cta-box{background:linear-gradient(135deg,#001a11,var(--gd));border-radius:18px;padding:clamp(28px,4vw,40px);text-align:center;color:#fff;margin-top:8px}
.cta-box h2{font-family:'Fraunces',serif;font-size:clamp(1.3rem,2.3vw,1.7rem);margin:0 0 10px;font-weight:400;line-height:1.25;color:#fff}
.cta-box h2 em{color:var(--y);font-style:italic;font-weight:300}
.cta-box p{font-size:14.5px;color:rgba(255,255,255,.6);margin:0 0 22px;line-height:1.7;max-width:480px;margin-left:auto;margin-right:auto}
.btn-p{display:inline-flex;align-items:center;gap:8px;background:var(--y);color:var(--gd);font-weight:600;font-size:14.5px;padding:13px 24px;border-radius:10px;text-decoration:none;transition:all .2s}
.btn-p:hover{background:#ffe08f;transform:translateY(-1px);box-shadow:0 8px 24px rgba(255,213,107,.3)}
.btn-ol{display:inline-flex;align-items:center;gap:8px;background:transparent;color:rgba(255,255,255,.75);border:1px solid rgba(255,255,255,.22);font-weight:500;font-size:14px;padding:12px 22px;border-radius:10px;text-decoration:none;transition:all .2s}
.btn-ol:hover{color:#fff;border-color:rgba(255,255,255,.45)}
.foot{display:flex;flex-wrap:wrap;align-items:center;gap:14px;justify-content:space-between;padding-top:24px;border-top:1px solid var(--bd);margin-top:32px}
.foot-meta{display:flex;flex-wrap:wrap;gap:14px;font-size:12.5px;color:var(--tl)}
.foot-meta span{display:inline-flex;align-items:center;gap:5px}
.foot-meta i{font-size:13px;opacity:.7}
.contest-link{font-size:12.5px;color:var(--tl);text-align:right;line-height:1.5}
.contest-link a{color:var(--g);font-weight:500;text-decoration:underline;text-decoration-color:rgba(0,76,63,.25);text-underline-offset:2px}
.disclaimer{padding:clamp(16px,3vw,20px);background:#fff;border:1px solid var(--bd);border-radius:12px;font-size:13px;line-height:1.7;color:var(--tm);margin-top:20px}
.disclaimer strong{color:var(--td)}
@media(max-width:560px){.brd{font-size:12px;margin-bottom:18px}.cta-box{padding:24px 20px}.cta-box .btn-p{width:100%;justify-content:center;margin-bottom:8px}.foot{flex-direction:column;align-items:flex-start;gap:10px}.contest-link{text-align:left}}
</style>
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: title,
  description: desc,
  datePublished: item.created_at,
  inLanguage: 'fr-FR',
  isPartOf: { '@type': 'WebSite', name: 'Jason Marinho', url: 'https://jasonmarinho.com' },
  publisher: { '@type': 'Organization', name: 'Jason Marinho', url: 'https://jasonmarinho.com' },
  mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
})}
</script>
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://jasonmarinho.com/' },
    { '@type': 'ListItem', position: 2, name: 'Sécurité', item: 'https://jasonmarinho.com/services/securite' },
    { '@type': 'ListItem', position: 3, name: 'Signalements publics', item: 'https://jasonmarinho.com/securite/signalements' },
    { '@type': 'ListItem', position: 4, name: title, item: canonical },
  ],
})}
</script>
<script defer src="/nav.js"></script>
</head>
<body>

<!-- HERO : identifier l'incident -->
<header class="hero">
  <div class="s-in">
    <div class="brd"><a href="/">Accueil</a> · <a href="/services/securite">Sécurité</a> · <a href="/securite/signalements">Signalements publics</a> · <span>${escHtml(item.incident_type)}</span></div>
    <div class="lbl">Signalement anonymisé${monthLabel ? ' · ' + escHtml(monthLabel) : ''}</div>
    <h1 class="h1">${escHtml(item.incident_type)}</h1>
    ${item.identifier_hint ? `<div class="hint-block">
      <span class="hint-lbl"><i class="ph-bold ph-fingerprint"></i>Empreinte partielle</span>
      <span class="hint-val">${escHtml(item.identifier_hint)}</span>
    </div>` : ''}
    <p class="lead">${escHtml(item.summary)}</p>
  </div>
</header>

<!-- SECTION 1 : Comment reconnaître ce type de demande -->
<section class="sec">
  <div class="s-in narrow">
    <div class="lbl dk">Reconnaître</div>
    <h2 class="h2">Les signaux qui doivent <em>te faire reculer</em></h2>
    <p class="p">Quel que soit le type d'arnaque, ces marqueurs reviennent dans plus de 80 % des cas observés par la communauté Jason Marinho. Si tu en vois 2 ou plus cumulés sur une demande de réservation, vérifie-la immédiatement dans la base.</p>
    <ul class="list-num">
      <li><span class="num">1</span><span class="txt"><strong>Profil créé récemment</strong> (moins de 3 mois) avec zéro ou très peu d'avis vérifiables.</span></li>
      <li><span class="num">2</span><span class="txt"><strong>Photo de profil absente, floue ou trop parfaite</strong> : souvent une photo de stock ou générée par IA.</span></li>
      <li><span class="num">3</span><span class="txt"><strong>Insistance pour sortir de la plateforme</strong> dès les premiers échanges (WhatsApp, email perso, virement direct, lien Wero).</span></li>
      <li><span class="num">4</span><span class="txt"><strong>Demande de remise, dérogation ou tarif spécial</strong> qui semble "trop belle pour être vraie" : signal classique de bait.</span></li>
      <li><span class="num">5</span><span class="txt"><strong>Pression émotionnelle ou temporelle</strong> ("décide vite", "j'ai besoin maintenant", "ne dis pas à Airbnb"). Un voyageur légitime n'utilise jamais ce ton.</span></li>
    </ul>
  </div>
</section>

<!-- SECTION 2 : Comment se protéger -->
<section class="sec cr">
  <div class="s-in narrow">
    <div class="lbl dk">Se protéger</div>
    <h2 class="h2">Trois réflexes <em>qui te protègent</em></h2>
    <p class="p">Si tu reçois une demande qui ressemble à ce signalement, voici ce que tu fais avant toute chose. Ces 3 actions couvrent 90 % des cas réels.</p>
    <ul class="list-num">
      <li><span class="num">1</span><span class="txt"><strong>Tu vérifies dans la base communauté.</strong> Email, téléphone ou nom complet du voyageur passés au crible des signalements précédents. 30 secondes, gratuit, depuis ton dashboard hôte.</span></li>
      <li><span class="num">2</span><span class="txt"><strong>Tu n'acceptes que les paiements sécurisés et traçables.</strong> Encaissement Stripe ou la plateforme de réservation (Airbnb, Booking). Pour les réservations directes, exige un virement bancaire classique <strong>uniquement</strong> avec un contrat de location courte durée signé. <strong>Jamais Wero</strong>, jamais virement instantané sans trace, jamais d'espèces.</span></li>
      <li><span class="num">3</span><span class="txt"><strong>Tu gardes toujours une trace écrite.</strong> Sur les plateformes (Airbnb, Booking) : utilise la messagerie interne, jamais SMS/email perso avant le check-in. En réservation directe (via <a href="https://www.driing.co" style="color:var(--g)">Driing</a> ou par toi-même) : conserve emails datés, contrat signé, état des lieux photo horodaté. Sans trace écrite, aucun recours possible.</span></li>
    </ul>
  </div>
</section>

<!-- SECTION 3 : CTA inscription -->
<section class="sec">
  <div class="s-in narrow">
    <div class="cta-box">
      <div class="lbl" style="color:rgba(255,213,107,.7);margin-bottom:10px">Communauté hôtes</div>
      <h2>Vérifie ton voyageur<br><em>avant d'accepter</em></h2>
      <p>Crée ton compte hôte gratuit pour accéder à la base complète : nom, email, téléphone vérifiés, alertes croisées sur tes nouvelles demandes.</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <a href="https://app.jasonmarinho.com/auth/register" class="btn-p">Créer mon compte gratuit <i class="ph-bold ph-arrow-right"></i></a>
        <a href="/securite/signalements" class="btn-ol">Voir tous les signalements</a>
      </div>
    </div>

    <!-- Footer : métadonnées discrètes + contestation -->
    <div class="foot">
      <div class="foot-meta">
        <span><i class="ph ph-shield-check"></i>Source : hôte vérifié</span>
        ${monthLabel ? `<span><i class="ph ph-calendar"></i>${escHtml(monthLabel)}</span>` : ''}
      </div>
      <div class="contest-link">
        Concerné par ce signalement ?<br><a href="/securite/contester-signalement?slug=${encodeURIComponent(item.slug)}">Demander le retrait sous 48h</a>
      </div>
    </div>

    <!-- Disclaimer juridique -->
    <div class="disclaimer">
      <strong>Important.</strong> Ce signalement émane d'un hôte vérifié de la communauté Jason Marinho. Le profil est <strong>strictement anonymisé</strong> : aucun nom complet, email, téléphone ou adresse précise n'est diffusé. Il n'a aucune valeur de jugement et ne constitue pas une accusation formelle. Pour les vrais nom, email et téléphone, accès réservé aux hôtes inscrits via le dashboard sécurisé.
    </div>
  </div>
</section>

<script defer src="/footer.js"></script>
<script src="/cookie-banner.js" defer></script>
</body>
</html>
`
}

function buildListPage(items) {
  const itemsHtml = items.length === 0
    ? `<div class="empty-state">
        <div class="empty-ico"><i class="ph ph-shield-check"></i></div>
        <h2 class="empty-h">La base communautaire <em>démarre tout juste</em></h2>
        <p class="empty-p">Aucun signalement public à afficher pour le moment. Les hôtes de la communauté Jason Marinho commencent à alimenter cette base en signalant les voyageurs problématiques rencontrés. Reviens dans quelques jours, ou inscris-toi pour accéder à la base privée complète et contribuer.</p>
        <div class="empty-cta">
          <a href="https://app.jasonmarinho.com/auth/register" class="btn-p">Créer mon compte hôte gratuit <i class="ph-bold ph-arrow-right"></i></a>
          <a href="/services/securite" class="btn-ol">Comment ça marche</a>
        </div>
      </div>`
    : `<div class="grid">` + items.map(it => {
        const monthLabel = fmtMonth(it.month)
        // Hiérarchie : INCIDENT (h3 fraunces) → HINT identifiant partiel
        // (anti-récidive) → SUMMARY (le contenu) → mois en footer discret.
        // Ville retirée : pas un signal utile sur les patterns d'arnaque.
        return `<a href="/securite/signalements/${escHtml(it.slug)}" class="card">
  <h3 class="card-h">${escHtml(it.incident_type)}</h3>
  ${it.identifier_hint ? `<div class="card-hint"><i class="ph-bold ph-fingerprint"></i>${escHtml(it.identifier_hint)}</div>` : ''}
  <p class="card-sum">${escHtml(it.summary.slice(0, 240))}${it.summary.length > 240 ? '…' : ''}</p>
  ${monthLabel ? `<div class="card-meta"><span class="card-when"><i class="ph ph-calendar"></i>${escHtml(monthLabel)}</span></div>` : ''}
  <span class="card-cta">Lire le signalement <i class="ph-bold ph-arrow-right"></i></span>
</a>`
      }).join('\n') + `</div>`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Signalements voyageurs publics LCD · Base communauté | Jason Marinho</title>
<meta name="description" content="Base communautaire des signalements voyageurs Airbnb et Booking, anonymisés. ${items.length} signalements actifs partagés par les hôtes LCD pour alerter et protéger.">
<link rel="canonical" href="https://jasonmarinho.com/securite/signalements">
<meta property="og:title" content="Signalements voyageurs publics LCD · Base communauté">
<meta property="og:description" content="${items.length} signalements anonymisés partagés par les hôtes LCD.">
<meta property="og:url" content="https://jasonmarinho.com/securite/signalements">
<meta property="og:type" content="website">
<meta property="og:image" content="https://jasonmarinho.com/couverture-jason.webp">
<meta property="og:site_name" content="Jason Marinho">
<meta name="robots" content="index, follow">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="96x96" href="/icon-96.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#004C3F">
<link rel="stylesheet" href="/fonts/site-fonts.css">
<link rel="stylesheet" type="text/css" href="/fonts/phosphor-bold-subset.css">
<link rel="stylesheet" type="text/css" href="/fonts/phosphor-regular-subset.css">
<style>
:root{--g:#004C3F;--gd:#003329;--y:#FFD56B;--cr:#F7F5F0;--w:#FDFCF9;--td:#0F1A0D;--tm:#3D5038;--tl:#7A8C77}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;padding-top:64px;font-family:'Outfit',sans-serif;background:var(--cr);color:var(--td)}
body::before{content:'';position:fixed;top:0;left:0;right:0;height:64px;background:var(--gd);z-index:100}
a{color:inherit}
.hero{background:linear-gradient(160deg,#001a11 0%,var(--gd) 55%,#00463a 100%);padding:clamp(56px,7vw,80px) 0}
.hero-in{max-width:1100px;margin:0 auto;padding:0 clamp(16px,5vw,60px)}
.brd{font-size:13px;color:rgba(255,255,255,.4);margin-bottom:24px}
.brd a{color:rgba(255,255,255,.5);text-decoration:none}
.brd a:hover{color:#fff}
.lbl{display:inline-block;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,213,107,.7);margin-bottom:14px}
h1{font-family:'Fraunces',serif;font-size:clamp(2rem,4vw,2.8rem);line-height:1.15;color:#fff;margin:0 0 16px;font-weight:400}
h1 em{color:var(--y);font-style:italic;font-weight:300}
.lead{font-size:16px;line-height:1.7;color:rgba(255,255,255,.6);margin:0 0 14px;max-width:640px}
.count-pill{display:inline-flex;align-items:center;gap:8px;background:rgba(255,213,107,.1);border:1px solid rgba(255,213,107,.25);border-radius:100px;padding:7px 16px;font-size:13.5px;font-weight:600;color:#FFD56B;margin-top:8px}
.list{max-width:1100px;margin:0 auto;padding:clamp(48px,6vw,72px) clamp(16px,5vw,60px)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}
.card{display:flex;flex-direction:column;gap:10px;padding:24px;background:#fff;border:1px solid rgba(0,76,63,.08);border-radius:14px;text-decoration:none;color:inherit;transition:transform .2s,box-shadow .2s,border-color .2s}
.card:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(0,76,63,.08);border-color:rgba(0,76,63,.18)}
.card-h{font-family:'Fraunces',serif;font-size:18px;font-weight:400;color:var(--td);margin:0;line-height:1.3;letter-spacing:-.2px}
.card-hint{display:inline-flex;align-items:center;gap:6px;background:rgba(0,76,63,.06);border:1px solid rgba(0,76,63,.15);border-radius:7px;padding:4px 9px;font-family:'JetBrains Mono','SF Mono','Consolas',monospace;font-size:12.5px;font-weight:500;color:var(--g);letter-spacing:.3px;align-self:flex-start}
.card-hint i{font-size:11px;opacity:.7}
.card-sum{font-size:14px;line-height:1.65;color:var(--tm);margin:0;flex:1}
.card-meta{display:flex;gap:14px;align-items:center;font-size:11.5px;color:var(--tl);padding-top:8px;border-top:1px solid rgba(0,76,63,.06);margin-top:6px}
.card-meta span{display:inline-flex;align-items:center;gap:4px}
.card-meta i{font-size:12px;opacity:.6}
.card-cta{font-size:12.5px;font-weight:600;color:var(--g);display:inline-flex;align-items:center;gap:5px;margin-top:4px}
.disclaimer{max-width:1100px;margin:0 auto;padding:0 clamp(16px,5vw,60px) clamp(48px,6vw,72px);font-size:12.5px;color:var(--tl);line-height:1.7}
.disclaimer strong{color:var(--td)}
.empty-state{background:#fff;border:1px solid rgba(0,76,63,.1);border-radius:18px;padding:clamp(36px,6vw,60px) clamp(24px,5vw,52px);text-align:center;max-width:680px;margin:0 auto}
.empty-ico{width:64px;height:64px;border-radius:18px;background:rgba(0,76,63,.07);display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px}
.empty-ico i{font-size:30px;color:var(--g)}
.empty-h{font-family:'Fraunces',serif;font-size:clamp(22px,2.4vw,28px);font-weight:400;color:var(--td);margin:0 0 12px;letter-spacing:-.3px;line-height:1.25}
.empty-h em{color:var(--g);font-style:italic;font-weight:300}
.empty-p{font-size:15px;line-height:1.75;color:var(--tm);margin:0 0 24px;max-width:520px;margin-left:auto;margin-right:auto}
.empty-cta{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.btn-p{display:inline-flex;align-items:center;gap:7px;background:var(--y);color:var(--gd);font-weight:600;font-size:14.5px;padding:12px 22px;border-radius:10px;text-decoration:none;transition:all .2s}
.btn-p:hover{background:#ffe08f;transform:translateY(-1px);box-shadow:0 8px 24px rgba(255,213,107,.3)}
.btn-ol{display:inline-flex;align-items:center;gap:7px;background:transparent;color:var(--g);border:1px solid rgba(0,76,63,.2);font-weight:500;font-size:14px;padding:11px 20px;border-radius:10px;text-decoration:none;transition:all .2s}
.btn-ol:hover{background:var(--g);color:#fff;border-color:var(--g)}
</style>
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Signalements voyageurs publics LCD',
  url: 'https://jasonmarinho.com/securite/signalements',
  description: 'Base communautaire des signalements voyageurs anonymisés.',
  inLanguage: 'fr-FR',
})}
</script>
<script defer src="/nav.js"></script>
</head>
<body>
<header class="hero">
  <div class="hero-in">
    <div class="brd"><a href="/">Accueil</a> · <a href="/services/securite">Sécurité</a> · <span>Signalements publics</span></div>
    <span class="lbl">Base communautaire LCD</span>
    <h1>Signalements voyageurs <em>partagés par les hôtes</em></h1>
    <p class="lead">Cette page liste les signalements anonymisés que la communauté Jason Marinho a choisi de rendre publics. Aucun nom complet, email, téléphone ou adresse précise n'est diffusé. Pour la base complète avec contacts vérifiés, créez votre compte hôte gratuit.</p>
    <span class="count-pill"><i class="ph-bold ph-shield-check"></i>${items.length} signalements actifs</span>
  </div>
</header>
<main class="list">
${itemsHtml}
</main>
<div class="disclaimer">
  <strong>Avertissement.</strong> Les profils signalés sont strictement anonymisés (prénom + initiale, ville, mois). Aucune accusation formelle, aucune valeur de jugement. Toute personne se reconnaissant peut demander le retrait sous 48h via le formulaire de contestation.
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
    `  <url><loc>https://jasonmarinho.com/securite/signalements</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.7</priority></url>`,
    `  <url><loc>https://jasonmarinho.com/securite/contester-signalement</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.4</priority></url>`,
    ...items.map(it => {
      const lm = (it.created_at || today).slice(0, 10)
      return `  <url><loc>https://jasonmarinho.com/securite/signalements/${it.slug}</loc><lastmod>${lm}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>`
    }),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`
}

function injectCounter(approvedCount) {
  // Met à jour le compteur "X signalements" sur /services/securite/index.html
  // si le marqueur HTML existe. Pattern idempotent.
  const file = path.join(ROOT, 'services', 'securite', 'index.html')
  if (!fs.existsSync(file)) return
  const html = fs.readFileSync(file, 'utf8')
  const next = html.replace(
    /<!--SIGNALEMENTS_COUNT:START-->[\s\S]*?<!--SIGNALEMENTS_COUNT:END-->/g,
    `<!--SIGNALEMENTS_COUNT:START-->${approvedCount}<!--SIGNALEMENTS_COUNT:END-->`,
  )
  if (next !== html) {
    fs.writeFileSync(file, next, 'utf8')
    console.log(`[build-signalements] /services/securite/index.html → compteur mis à jour (${approvedCount})`)
  }
}

async function main() {
  const items = await fetchSignalements()
  console.log(`[build-signalements] ${items.length} signalement(s) publics récupérés.`)

  // Nettoyage des anciennes fiches : on supprime le dossier puis on regénère
  // (les `removed` n'apparaîtront plus dans la vue, donc plus dans /signalements/).
  // On garde la liste page et le sitemap même si 0 items.
  if (fs.existsSync(OUT_DIR)) {
    for (const entry of fs.readdirSync(OUT_DIR, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        fs.rmSync(path.join(OUT_DIR, entry.name), { recursive: true, force: true })
      }
    }
  } else {
    fs.mkdirSync(OUT_DIR, { recursive: true })
  }

  // Pages individuelles
  for (const item of items) {
    const dir = path.join(OUT_DIR, item.slug)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'index.html'), buildFichePage(item), 'utf8')
  }

  // Liste
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), buildListPage(items), 'utf8')

  // Sitemap dédié
  const sitemapPath = path.join(ROOT, 'sitemap-signalements.xml')
  fs.writeFileSync(sitemapPath, buildSitemap(items), 'utf8')

  // Compteur sur la page marketing
  injectCounter(items.length)

  console.log(`[build-signalements] ✓ ${items.length} fiches + liste + sitemap-signalements.xml générés.`)
}

main().catch(err => {
  console.error('[build-signalements] Erreur:', err)
  // Pas exit 1 : on ne bloque PAS le build du site marketing si le script foire.
  process.exit(0)
})
