#!/usr/bin/env node
// Page /trouver-un-pro : la demande inversée (12/10/2026, idée de Jason).
// L'hôte décrit son besoin (photographe ou équipe de ménage) ; la demande part
// toute seule aux 3 pros les plus proches de l'annuaire (app :
// POST https://app.jasonmarinho.com/api/demandes, lib/demandes/*). Liste des
// villes lue dans footer.js (même source que les annuaires).
// Usage : node scripts/build-trouver-un-pro.mjs (aussi lancé au build du site).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function loadCities() {
  const src = fs.readFileSync(path.join(ROOT, 'footer.js'), 'utf8')
  const start = src.indexOf('var CITIES = [')
  if (start === -1) return []
  const open = src.indexOf('[', start)
  const end = src.indexOf('];', open)
  try { return new Function('return ' + src.slice(open, end + 1))() } catch { return [] }
}

const LOGEMENTS = ['Studio ou T1', 'T2 ou T3', 'T4 et plus', 'Maison', 'Plusieurs logements']
const QUAND = ['Au plus vite', 'Dans le mois', 'Dans 1 à 3 mois', 'Je me renseigne']
const FREQUENCES = ['Des ménages réguliers entre deux voyageurs', 'Un ménage ponctuel (remise en état, fin de saison)']
// Même liste que PRESTATIONS_PHOTO (jason-app/lib/demandes/rules.ts)
const PRESTATIONS_PHOTO = ['Des photos', 'Une vidéo', 'Des photos et une vidéo', 'Des photos avec vues au drone', 'Une vidéo avec vues au drone']

const cities = loadCities().map(c => c.name).filter(Boolean).sort((a, b) => a.localeCompare(b, 'fr'))
const title = 'Trouver un photographe, vidéaste ou ménage Airbnb'
const desc = 'Décris ton besoin en 1 minute : ta demande part aux 3 photographes, vidéastes ou équipes de ménage les plus proches de ton logement. Gratuit, sans commission.'
const opt = list => list.map(v => `<option>${esc(v)}</option>`).join('')

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://jasonmarinho.com/trouver-un-pro">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="https://jasonmarinho.com/trouver-un-pro">
<meta property="og:image" content="https://jasonmarinho.com/couverture-jason.webp">
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
.hero{background:linear-gradient(160deg,#001a11 0%,var(--gd) 55%,#00463a 100%);color:#fff;padding:clamp(40px,7vw,72px) 0 clamp(90px,12vw,120px)}
.s-in{max-width:1100px;margin:0 auto;padding:0 clamp(16px,5vw,40px)}
.brd{font-size:13px;color:rgba(255,255,255,.45);margin-bottom:18px}.brd a{color:rgba(255,255,255,.6);text-decoration:none}
.lbl{display:inline-block;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,213,107,.8);margin-bottom:12px}
h1{font-family:'Fraunces',serif;font-size:clamp(28px,4.4vw,46px);font-weight:400;line-height:1.12;letter-spacing:-.5px;max-width:760px}
h1 em{color:var(--y);font-style:italic;font-weight:300}
.lead{font-size:16px;color:rgba(255,255,255,.75);line-height:1.7;max-width:640px;margin-top:14px}
.steps{display:grid;gap:12px;margin-top:26px;max-width:880px}
@media(min-width:760px){.steps{grid-template-columns:repeat(3,1fr)}}
.step{display:flex;gap:12px;align-items:flex-start;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:14px 16px}
.step b{flex-shrink:0;width:28px;height:28px;border-radius:50%;background:var(--y);color:var(--gd);display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-weight:500}
.step span{font-size:14px;line-height:1.5;color:rgba(255,255,255,.85)}
.wrap{max-width:1100px;margin:-70px auto 60px;padding:0 clamp(16px,5vw,40px);display:grid;gap:20px;position:relative}
@media(min-width:960px){.wrap{grid-template-columns:minmax(0,1fr) 340px;align-items:start}}
.card{background:#fff;border:1px solid var(--bd);border-radius:18px;padding:clamp(20px,3vw,30px);box-shadow:0 18px 50px rgba(0,30,20,.10)}
.card h2{font-family:'Fraunces',serif;font-size:21px;font-weight:400;margin-bottom:16px}
.seg{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px}
.seg label{position:relative;cursor:pointer}
.seg input{position:absolute;opacity:0;pointer-events:none}
.seg span{display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 10px;border:1px solid rgba(0,76,63,.18);border-radius:12px;font-weight:600;font-size:15px;color:var(--g);background:#fff;text-align:center}
.seg input:checked+span{background:var(--g);color:#fff;border-color:var(--g)}
.seg input:focus-visible+span{outline:3px solid rgba(255,213,107,.7);outline-offset:2px}
.grid2{display:grid;gap:12px}
@media(min-width:640px){.grid2{grid-template-columns:1fr 1fr}}
.f{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}
.f label{font-size:13px;font-weight:600;color:var(--tm)}
.f label small{font-weight:400;color:var(--tl)}
.f input,.f select,.f textarea{width:100%;padding:12px 13px;border:1px solid rgba(0,76,63,.18);border-radius:10px;background:#fff;font-family:'Outfit',sans-serif;font-size:15px;color:var(--td)}
.f textarea{min-height:110px;resize:vertical}
.f input:focus,.f select:focus,.f textarea:focus{outline:none;border-color:var(--g);box-shadow:0 0 0 3px rgba(0,76,63,.1)}
.consent{display:flex;gap:10px;align-items:flex-start;font-size:13px;color:var(--tm);line-height:1.55;margin:6px 0 16px}
.consent input{margin-top:3px;width:17px;height:17px;flex-shrink:0;accent-color:var(--g)}
.consent a{color:var(--g)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:15px 22px;border:none;border-radius:12px;background:var(--y);color:var(--gd);font-family:'Outfit',sans-serif;font-weight:700;font-size:16px;cursor:pointer}
.btn:hover{background:#ffe08f}.btn:disabled{opacity:.6;cursor:wait}
.hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.err{display:none;padding:12px 14px;background:rgba(220,38,38,.07);border:1px solid rgba(220,38,38,.2);border-radius:10px;color:#b91c1c;font-size:13.5px;margin-bottom:12px}
.ok{display:none;text-align:center;padding:10px 0}
.ok i{font-size:42px;color:#1e9d54}
.ok h2{margin:10px 0 8px}
.ok p{font-size:15px;color:var(--tm);line-height:1.7;max-width:520px;margin:0 auto 10px}
.side{display:flex;flex-direction:column;gap:16px}
.side .card{box-shadow:none;padding:22px}
.side h3{font-family:'Fraunces',serif;font-size:18px;font-weight:400;margin-bottom:10px}
.side ul{list-style:none;display:flex;flex-direction:column;gap:10px}
.side li{display:flex;gap:9px;font-size:14px;color:var(--tm);line-height:1.5}
.side li i{color:#1e9d54;font-size:17px;flex-shrink:0;margin-top:1px}
.side a{color:var(--g);font-weight:600}
.only-menage{display:none}
form[data-metier="menage"] .only-menage{display:flex}
form[data-metier="menage"] .only-photo{display:none}
</style>
<script defer src="/nav.js"></script>
</head>
<body>
<header class="hero">
  <div class="s-in">
    <div class="brd"><a href="/">Accueil</a> · <span>Trouver un pro</span></div>
    <span class="lbl">Gratuit · sans commission</span>
    <h1>Décris ton besoin, <em>les pros viennent à toi</em></h1>
    <p class="lead">Un photographe ou un vidéaste pour ton annonce, ou une équipe de ménage entre deux voyageurs : en une minute, ta demande part aux pros les plus proches de ton logement. Plus besoin de chercher ni d’écrire à chacun.</p>
    <div class="steps">
      <div class="step"><b>1</b><span>Tu décris ton logement et ce qu’il te faut.</span></div>
      <div class="step"><b>2</b><span>Les 3 pros les plus proches reçoivent ta demande.</span></div>
      <div class="step"><b>3</b><span>Ils te répondent directement. Sans réponse sous 48 h, d’autres pros prennent le relais.</span></div>
    </div>
  </div>
</header>

<main class="wrap">
  <div class="card">
    <form id="demande" data-metier="photographe" novalidate>
      <h2>Ta demande</h2>
      <div class="seg" role="radiogroup" aria-label="Ce que tu cherches">
        <label><input type="radio" name="metier" value="photographe" checked><span><i class="ph-bold ph-camera"></i>Un photographe ou vidéaste</span></label>
        <label><input type="radio" name="metier" value="menage"><span><i class="ph-bold ph-sparkle"></i>Une équipe de ménage</span></label>
      </div>
      <div class="grid2">
        <div class="f"><label for="ville">Ville du logement</label><input id="ville" name="ville" list="villes" autocomplete="address-level2" placeholder="Ex. Lyon" required></div>
        <div class="f"><label for="logement">Ton logement</label><select id="logement" name="logement"><option value="">Choisir</option>${opt(LOGEMENTS)}</select></div>
      </div>
      <datalist id="villes">${cities.map(c => `<option value="${esc(c)}">`).join('')}</datalist>
      <div class="f only-menage"><label for="frequence">Ton besoin</label><select id="frequence" name="frequence"><option value="">Choisir</option>${opt(FREQUENCES)}</select></div>
      <div class="f only-photo"><label for="prestation">Ce qu’il te faut</label><select id="prestation" name="prestation"><option value="">Choisir</option>${opt(PRESTATIONS_PHOTO)}</select></div>
      <div class="grid2">
        <div class="f"><label for="quand">Quand ?</label><select id="quand" name="quand"><option value="">Choisir</option>${opt(QUAND)}</select></div>
        <div class="f"><label for="budget">Budget <small>(facultatif)</small></label><input id="budget" name="budget" maxlength="60" placeholder="Ex. 300 € ou 80 € le ménage"></div>
      </div>
      <div class="f"><label for="message">Ton message <small>(facultatif)</small></label><textarea id="message" name="message" maxlength="1500" placeholder="Surface, nombre de chambres, extérieur, dates, ce qui compte pour toi…"></textarea></div>
      <div class="grid2">
        <div class="f"><label for="nom">Prénom et nom</label><input id="nom" name="nom" autocomplete="name" required maxlength="80"></div>
        <div class="f"><label for="email">E-mail</label><input id="email" name="email" type="email" autocomplete="email" required maxlength="160"></div>
      </div>
      <div class="f"><label for="telephone">Téléphone <small>(facultatif, transmis aux pros)</small></label><input id="telephone" name="telephone" type="tel" autocomplete="tel" maxlength="30"></div>
      <div class="hp" aria-hidden="true"><label>Site<input name="website" tabindex="-1" autocomplete="off"></label></div>
      <label class="consent"><input type="checkbox" id="consent" required><span>J’accepte que ma demande et mes coordonnées soient transmises à 3 professionnels au plus de ma zone, inscrits à l’annuaire (puis à d’autres pros de l’annuaire s’ils ne répondent pas sous 48 h), pour qu’ils me répondent. Mon besoin peut être présenté à d’autres pros, sans mes coordonnées. <a href="/politique-de-confidentialite#demandes">Confidentialité</a></span></label>
      <div class="err" id="err" role="alert"></div>
      <button type="submit" class="btn" id="btn"><i class="ph-bold ph-paper-plane-tilt"></i>Envoyer ma demande</button>
    </form>
    <div class="ok" id="ok" role="status">
      <i class="ph-bold ph-check-circle"></i>
      <h2>Ta demande est partie</h2>
      <p id="ok-p"></p>
      <p>Un e-mail de confirmation vient de partir à ton adresse.</p>
    </div>
  </div>
  <aside class="side">
    <div class="card">
      <h3>Pourquoi passer par ici</h3>
      <ul>
        <li><i class="ph-bold ph-check-circle"></i><span>Des pros qui connaissent la location courte durée</span></li>
        <li><i class="ph-bold ph-check-circle"></i><span>Gratuit, sans commission : le devis et le paiement se règlent entre toi et le pro</span></li>
        <li><i class="ph-bold ph-check-circle"></i><span>3 pros au plus : des réponses utiles, pas une avalanche d’appels</span></li>
        <li><i class="ph-bold ph-check-circle"></i><span>Tes coordonnées ne vont qu’aux pros qui reçoivent ta demande</span></li>
      </ul>
    </div>
    <div class="card">
      <h3>Tu préfères choisir toi-même ?</h3>
      <p style="font-size:14px;color:var(--tm);line-height:1.6;margin-bottom:10px">Regarde les fiches, les photos et les formules des pros :</p>
      <p style="display:flex;flex-direction:column;gap:6px;font-size:14px"><a href="/annuaires/photographes">Annuaire des photographes →</a><a href="/annuaires/menage">Annuaire des équipes de ménage →</a></p>
    </div>
  </aside>
</main>

<script>
(function(){
  var API = 'https://app.jasonmarinho.com/api/demandes';
  var f = document.getElementById('demande'), err = document.getElementById('err'), btn = document.getElementById('btn');
  var t0 = Date.now();
  function setMetier(m){ f.setAttribute('data-metier', m); }
  [].forEach.call(f.querySelectorAll('input[name=metier]'), function(r){ r.addEventListener('change', function(){ setMetier(r.value) }) });
  try {
    var q = new URLSearchParams(location.search);
    if (q.get('metier') === 'menage') { f.querySelector('input[value=menage]').checked = true; setMetier('menage'); }
    if (q.get('ville')) f.ville.value = q.get('ville').slice(0, 80);
  } catch (e) {}
  function acq(){ try { return JSON.parse(sessionStorage.getItem('jm_acq') || 'null') } catch (e) { return null } }
  f.addEventListener('submit', async function(e){
    e.preventDefault();
    err.style.display = 'none';
    if (!f.ville.value.trim() || !f.nom.value.trim() || !f.email.value.trim()) { err.textContent = 'Indique la ville, ton nom et ton e-mail.'; err.style.display = 'block'; return; }
    if (!document.getElementById('consent').checked) { err.textContent = 'Coche la case pour que ta demande puisse être transmise aux pros.'; err.style.display = 'block'; return; }
    btn.disabled = true; btn.innerHTML = 'Envoi en cours…';
    var metier = f.querySelector('input[name=metier]:checked').value;
    var data = { metier: metier, ville: f.ville.value, logement: f.logement.value, quand: f.quand.value, frequence: metier === 'menage' ? f.frequence.value : f.prestation.value, budget: f.budget.value, message: f.message.value, nom: f.nom.value, email: f.email.value, telephone: f.telephone.value, consent: true, website: f.website.value, t: t0, source: document.referrer ? document.referrer.slice(0, 200) : location.href, acq: acq() };
    try {
      var res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      var body = await res.json().catch(function(){ return {} });
      if (!res.ok) throw new Error(body.error || 'Envoi impossible pour le moment. Réessaie dans quelques minutes.');
      var who = metier === 'menage' ? 'équipe' : 'pro';
      document.getElementById('ok-p').textContent = body.envoyes > 0
        ? 'Elle a été envoyée ' + (body.envoyes > 1 ? 'aux ' + body.envoyes + ' ' + who + 's les plus proches' : 'au ' + who + ' le plus proche') + ' de ton logement. Ils te répondent directement par e-mail.'
        : 'Il n’y a pas encore de pro inscrit près de ' + f.ville.value.trim() + ' : on garde ta demande et on te prévient dès qu’un pro de ta zone rejoint l’annuaire.';
      f.style.display = 'none';
      document.getElementById('ok').style.display = 'block';
      window.scrollTo({ top: document.querySelector('.wrap').offsetTop - 80, behavior: 'smooth' });
    } catch (x) {
      err.textContent = x.message; err.style.display = 'block';
      btn.disabled = false; btn.innerHTML = '<i class="ph-bold ph-paper-plane-tilt"></i>Envoyer ma demande';
    }
  });
})();
</script>
<script defer src="/footer.js"></script>
<script src="/cookie-banner.js" defer></script>
</body>
</html>
`

fs.mkdirSync(path.join(ROOT, 'trouver-un-pro'), { recursive: true })
fs.writeFileSync(path.join(ROOT, 'trouver-un-pro', 'index.html'), html, 'utf8')
console.log(`[trouver-un-pro] page écrite (${cities.length} villes proposées)`)
