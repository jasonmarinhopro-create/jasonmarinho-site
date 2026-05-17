// Widgets simulateurs publics — vanilla JS, design 2026.
// Chaque fonction renvoie { html, script } à injecter dans une page statique.
// Layout commun : 2-col responsive (form gauche / résultats live droite).

import { FISCAL_PARAMS_2026, TAXE_SEJOUR } from './fiscal-params.mjs'

// ─── CSS partagé pour les 4 simulateurs ──────────────────────────────
export const SIMULATOR_CSS = `
.sim-widget{
  display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);
  gap:clamp(20px,3vw,32px);
  background:linear-gradient(160deg,#fff 0%,#FBFAF6 100%);
  border:1px solid rgba(0,76,63,.12);
  border-radius:20px;
  padding:clamp(22px,3vw,36px);
  margin:clamp(28px,4vw,40px) 0;
  box-shadow:0 1px 0 rgba(255,255,255,.6) inset, 0 18px 48px -24px rgba(0,76,63,.18);
  position:relative;overflow:hidden;
}
.sim-widget::before{
  content:"";position:absolute;inset:0;
  background:radial-gradient(ellipse 60% 70% at 100% 0%,rgba(255,213,107,.10),transparent 70%);
  pointer-events:none;
}
.sim-widget > *{position:relative;z-index:1}

@media (max-width:780px){
  .sim-widget{grid-template-columns:1fr;gap:24px}
}

.sim-head{
  display:flex;align-items:center;gap:10px;
  font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;
  color:var(--g);margin-bottom:6px;
}
.sim-head-pulse{
  width:8px;height:8px;border-radius:50%;background:var(--g);
  box-shadow:0 0 0 4px rgba(0,76,63,.12);
  animation:simPulse 2s ease-in-out infinite;
}
@keyframes simPulse{
  0%,100%{box-shadow:0 0 0 4px rgba(0,76,63,.12)}
  50%{box-shadow:0 0 0 8px rgba(0,76,63,.04)}
}

.sim-inputs{display:flex;flex-direction:column;gap:18px}
.sim-results{
  display:flex;flex-direction:column;gap:14px;
  background:linear-gradient(160deg,#001a11 0%,var(--gd) 60%,#00463a 100%);
  border-radius:14px;padding:clamp(20px,2.5vw,26px);
  color:#fff;position:relative;overflow:hidden;
}
.sim-results::before{
  content:"";position:absolute;inset:0;
  background:radial-gradient(ellipse 60% 70% at 100% 100%,rgba(255,213,107,.06),transparent 70%);
  pointer-events:none;
}
.sim-results > *{position:relative;z-index:1}

.sim-title{
  font-family:'Fraunces',serif;font-size:20px;line-height:1.2;font-weight:400;
  letter-spacing:-.01em;color:var(--td);margin:0 0 14px;
}
.sim-title em{color:var(--g);font-style:italic;font-weight:300}

.sim-field{display:flex;flex-direction:column;gap:10px}
.sim-label{
  display:flex;align-items:center;justify-content:space-between;
  font-size:11px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;
  color:rgba(0,76,63,.65);
}
.sim-label-val{
  font-family:'Fraunces',serif;font-size:16px;font-weight:500;
  color:var(--g);letter-spacing:-.01em;text-transform:none;
}

.sim-range{
  -webkit-appearance:none;appearance:none;
  width:100%;height:6px;border-radius:3px;
  background:linear-gradient(90deg,var(--g) 0%,var(--g) var(--pct,0%),rgba(0,76,63,.10) var(--pct,0%),rgba(0,76,63,.10) 100%);
  outline:none;cursor:pointer;
}
.sim-range::-webkit-slider-thumb{
  -webkit-appearance:none;width:22px;height:22px;border-radius:50%;
  background:var(--y);border:3px solid var(--g);cursor:pointer;
  box-shadow:0 4px 12px rgba(0,76,63,.25);
  transition:transform .15s;
}
.sim-range::-webkit-slider-thumb:hover{transform:scale(1.10)}
.sim-range::-moz-range-thumb{
  width:22px;height:22px;border-radius:50%;background:var(--y);
  border:3px solid var(--g);cursor:pointer;
  box-shadow:0 4px 12px rgba(0,76,63,.25);
}

.sim-chips{display:flex;gap:8px;flex-wrap:wrap}
.sim-chip{
  flex:1;min-width:0;padding:11px 14px;
  font-size:13px;font-weight:500;color:var(--tm);
  background:#fff;border:1px solid rgba(0,76,63,.12);border-radius:10px;
  cursor:pointer;text-align:center;
  transition:all .18s cubic-bezier(.4,0,.2,1);
  font-family:'Outfit',sans-serif;
}
.sim-chip:hover{border-color:var(--g);color:var(--g);background:rgba(0,76,63,.03)}
.sim-chip.on{
  background:linear-gradient(135deg,var(--g) 0%,var(--gm) 100%);color:#fff;
  border-color:var(--g);font-weight:600;
  box-shadow:0 4px 14px rgba(0,76,63,.22);
}

.sim-num{
  width:100%;padding:13px 14px;font-size:15px;font-weight:500;
  color:var(--td);background:#fff;
  border:1px solid rgba(0,76,63,.12);border-radius:10px;
  outline:none;font-family:'Outfit',sans-serif;
  transition:border-color .18s,box-shadow .18s;
}
.sim-num:focus{
  border-color:var(--g);
  box-shadow:0 0 0 3px rgba(0,76,63,.15);
}
.sim-num::-webkit-outer-spin-button,
.sim-num::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.sim-num[type=number]{-moz-appearance:textfield}

.sim-select{
  width:100%;padding:13px 38px 13px 14px;font-size:15px;font-weight:500;
  color:var(--td);background:#fff;
  border:1px solid rgba(0,76,63,.12);border-radius:10px;
  outline:none;cursor:pointer;font-family:'Outfit',sans-serif;
  appearance:none;-webkit-appearance:none;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23004C3F' stroke-width='2.5'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat:no-repeat;background-position:right 14px center;background-size:14px;
  transition:border-color .18s,box-shadow .18s;
}
.sim-select:focus{
  border-color:var(--g);
  box-shadow:0 0 0 3px rgba(0,76,63,.15);
}
.sim-select option{background:#fff;color:var(--td)}

.sim-out{
  display:flex;flex-direction:column;gap:4px;
  padding:16px 18px;
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,213,107,.12);
  border-radius:12px;
  transition:border-color .2s,background .2s;
}
.sim-out.primary{
  background:linear-gradient(135deg,rgba(255,213,107,.10) 0%,rgba(255,213,107,.03) 100%);
  border-color:rgba(255,213,107,.30);
}
.sim-out-label{
  font-size:10.5px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;
  color:rgba(255,213,107,.7);
}
.sim-out-value{
  font-family:'Fraunces',serif;font-size:clamp(22px,2.4vw,28px);font-weight:500;
  color:#fff;letter-spacing:-.01em;line-height:1.2;
}
.sim-out.primary .sim-out-value{color:var(--y)}
.sim-out-value.alert{color:#FCA5A5}
.sim-out-value.success{color:#A7F3B7}
.sim-out-sub{font-size:12px;color:rgba(255,255,255,.55);line-height:1.4}

.sim-cta-row{
  display:flex;gap:10px;margin-top:6px;flex-wrap:wrap;
}
.sim-cta-row a{
  flex:1;min-width:160px;
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  padding:12px 18px;border-radius:10px;
  font-size:13.5px;font-weight:600;
  text-decoration:none;
  transition:all .2s;
  font-family:'Outfit',sans-serif;
}
.sim-cta-primary{
  background:var(--y);color:var(--gd);
  box-shadow:0 4px 14px rgba(255,213,107,.22);
}
.sim-cta-primary:hover{
  background:#ffe08f;transform:translateY(-1px);
  box-shadow:0 8px 20px rgba(255,213,107,.30);
}
.sim-cta-ghost{
  background:transparent;color:rgba(255,255,255,.78);
  border:1px solid rgba(255,255,255,.18);
}
.sim-cta-ghost:hover{border-color:rgba(255,255,255,.4);color:#fff}

.sim-hint{
  font-size:12px;color:rgba(0,76,63,.55);line-height:1.5;
  padding:10px 12px;background:rgba(0,76,63,.04);
  border-left:2px solid var(--g);border-radius:0 8px 8px 0;
}
.sim-hint strong{color:var(--g)}
`

// ─── 1. Simulateur Fiscalité micro-BIC ───────────────────────────────
export function widgetFiscalite() {
  const p = FISCAL_PARAMS_2026
  const html = `
<div class="sim-widget" id="sim-fisc">
  <div class="sim-inputs">
    <div class="sim-head"><span class="sim-head-pulse"></span>Simulateur en direct</div>
    <h3 class="sim-title">Calcule ton <em>impôt micro-BIC</em></h3>

    <div class="sim-field">
      <div class="sim-label">Chiffre d'affaires LCD <span class="sim-label-val" id="fsc-ca-v">30 000 €</span></div>
      <input type="range" class="sim-range" id="fsc-ca" min="0" max="120000" step="500" value="30000">
    </div>

    <div class="sim-field">
      <div class="sim-label">Régime du meublé</div>
      <div class="sim-chips" id="fsc-reg">
        <button type="button" class="sim-chip on" data-v="nonClasse">Non classé</button>
        <button type="button" class="sim-chip" data-v="classe">Classé Atout France</button>
        <button type="button" class="sim-chip" data-v="cdh">Chambres d'hôtes</button>
      </div>
    </div>

    <div class="sim-field">
      <div class="sim-label">Tranche d'imposition (TMI)</div>
      <div class="sim-chips" id="fsc-tmi">
        <button type="button" class="sim-chip" data-v="11">11 %</button>
        <button type="button" class="sim-chip on" data-v="30">30 %</button>
        <button type="button" class="sim-chip" data-v="41">41 %</button>
      </div>
    </div>

    <div class="sim-hint" id="fsc-hint">
      Les valeurs reposent sur la <strong>loi Le Meur (2025+)</strong> : abattement 30 % / 50 %, plafonds 15 000 € / 77 700 €.
    </div>
  </div>

  <div class="sim-results">
    <div class="sim-out primary">
      <div class="sim-out-label">Base imposable</div>
      <div class="sim-out-value" id="fsc-out-base">21 000 €</div>
      <div class="sim-out-sub" id="fsc-out-base-sub">Abattement 30 % sur 30 000 €</div>
    </div>
    <div class="sim-out">
      <div class="sim-out-label">Impôt sur le revenu estimé</div>
      <div class="sim-out-value" id="fsc-out-ir">6 300 €</div>
      <div class="sim-out-sub">à ton TMI sélectionné</div>
    </div>
    <div class="sim-out">
      <div class="sim-out-label">Statut plafond</div>
      <div class="sim-out-value" id="fsc-out-plafond">À surveiller</div>
      <div class="sim-out-sub" id="fsc-out-plafond-sub">CA / plafond du régime choisi</div>
    </div>
    <div class="sim-cta-row">
      <a href="https://app.jasonmarinho.com/dashboard/simulateurs#fiscal" class="sim-cta-primary">Préfile avec mes logements <i class="ph-bold ph-arrow-right" style="font-size:12px"></i></a>
      <a href="#explication" class="sim-cta-ghost">Comprendre le calcul</a>
    </div>
  </div>
</div>`
  const script = `
(function(){
  var P = ${JSON.stringify(p.microBic)};
  var regime = 'nonClasse', tmi = 0.30;
  var $ca = document.getElementById('fsc-ca');
  var $caV = document.getElementById('fsc-ca-v');
  var $base = document.getElementById('fsc-out-base');
  var $baseSub = document.getElementById('fsc-out-base-sub');
  var $ir = document.getElementById('fsc-out-ir');
  var $pla = document.getElementById('fsc-out-plafond');
  var $plaSub = document.getElementById('fsc-out-plafond-sub');
  function fmt(n){return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Math.round(n));}
  function pct(n){return Math.round(n*100)+' %';}
  function update(){
    var ca = +$ca.value;
    var r = P[regime];
    var abat = r.abattement;
    var base = Math.max(0, ca * (1 - abat));
    var ir = base * tmi;
    var sousPlafond = ca <= r.plafond;
    $caV.textContent = fmt(ca);
    $ca.style.setProperty('--pct', (ca/120000*100)+'%');
    $base.textContent = fmt(base);
    $baseSub.textContent = 'Abattement ' + pct(abat) + ' sur ' + fmt(ca);
    $ir.textContent = fmt(ir);
    $pla.textContent = sousPlafond ? 'Sous plafond' : 'Plafond dépassé';
    $pla.className = 'sim-out-value ' + (sousPlafond ? 'success' : 'alert');
    $plaSub.textContent = sousPlafond
      ? 'CA ≤ ' + fmt(r.plafond) + ' (' + r.label + ')'
      : 'CA > ' + fmt(r.plafond) + ' → bascule régime réel obligatoire';
  }
  $ca.addEventListener('input', update);
  document.querySelectorAll('#fsc-reg .sim-chip').forEach(function(c){
    c.addEventListener('click', function(){
      document.querySelectorAll('#fsc-reg .sim-chip').forEach(function(x){x.classList.remove('on')});
      c.classList.add('on'); regime = c.dataset.v; update();
    });
  });
  document.querySelectorAll('#fsc-tmi .sim-chip').forEach(function(c){
    c.addEventListener('click', function(){
      document.querySelectorAll('#fsc-tmi .sim-chip').forEach(function(x){x.classList.remove('on')});
      c.classList.add('on'); tmi = +c.dataset.v / 100; update();
    });
  });
  update();
})();`
  return { html, script }
}

// ─── 2. Simulateur EI vs SASU ────────────────────────────────────────
export function widgetEiSasu() {
  const p = FISCAL_PARAMS_2026
  const html = `
<div class="sim-widget" id="sim-ei">
  <div class="sim-inputs">
    <div class="sim-head"><span class="sim-head-pulse"></span>Simulateur en direct</div>
    <h3 class="sim-title">Compare <em>EI vs SASU</em></h3>

    <div class="sim-field">
      <div class="sim-label">Bénéfice annuel LCD <span class="sim-label-val" id="ei-b-v">40 000 €</span></div>
      <input type="range" class="sim-range" id="ei-b" min="10000" max="150000" step="1000" value="40000">
    </div>

    <div class="sim-field">
      <div class="sim-label">Ta tranche d'imposition (TMI)</div>
      <div class="sim-chips" id="ei-tmi">
        <button type="button" class="sim-chip" data-v="11">11 %</button>
        <button type="button" class="sim-chip on" data-v="30">30 %</button>
        <button type="button" class="sim-chip" data-v="41">41 %</button>
      </div>
    </div>

    <div class="sim-hint">
      <strong>EI au réel</strong> : cotisations TNS ~42 % + IR sur le restant.
      <strong>SASU 100 % dividendes</strong> : IS (15/25 %) + flat tax 30 %.
    </div>
  </div>

  <div class="sim-results">
    <div class="sim-out primary">
      <div class="sim-out-label">Net en poche EI</div>
      <div class="sim-out-value" id="ei-out-ei">16 240 €</div>
      <div class="sim-out-sub">après TNS + IR au TMI sélectionné</div>
    </div>
    <div class="sim-out">
      <div class="sim-out-label">Net en poche SASU (100 % dividendes)</div>
      <div class="sim-out-value" id="ei-out-sasu">23 800 €</div>
      <div class="sim-out-sub">après IS + flat tax 30 %</div>
    </div>
    <div class="sim-out">
      <div class="sim-out-label">Écart en faveur de</div>
      <div class="sim-out-value" id="ei-out-verdict">SASU + 7 560 €</div>
      <div class="sim-out-sub" id="ei-out-verdict-sub">Attention : SASU = zéro cotisation retraite</div>
    </div>
    <div class="sim-cta-row">
      <a href="https://app.jasonmarinho.com/dashboard/simulateurs#statut" class="sim-cta-primary">Préfile avec mes chiffres <i class="ph-bold ph-arrow-right" style="font-size:12px"></i></a>
      <a href="#explication" class="sim-cta-ghost">Voir les détails</a>
    </div>
  </div>
</div>`
  const script = `
(function(){
  var tmi = 0.30;
  var IS_RED = ${p.societe.is.tauxReduit}, IS_NOR = ${p.societe.is.tauxNormal}, IS_SEUIL = ${p.societe.is.seuilTauxReduit};
  var FLAT = ${p.societe.flatTax}, COTIS_EI = ${p.ei.tauxCotisationsTns};
  var $b = document.getElementById('ei-b'), $bV = document.getElementById('ei-b-v');
  var $ei = document.getElementById('ei-out-ei'), $sasu = document.getElementById('ei-out-sasu');
  var $v = document.getElementById('ei-out-verdict'), $vSub = document.getElementById('ei-out-verdict-sub');
  function fmt(n){return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Math.round(n));}
  function update(){
    var b = +$b.value;
    // EI
    var cotis = b * COTIS_EI;
    var imp = b - cotis;
    var ir = imp * tmi;
    var netEi = imp - ir;
    // SASU 100% dividendes
    var is = b <= IS_SEUIL ? b * IS_RED : (IS_SEUIL * IS_RED + (b - IS_SEUIL) * IS_NOR);
    var resteApresIs = b - is;
    var ft = resteApresIs * FLAT;
    var netSasu = resteApresIs - ft;
    var diff = netSasu - netEi;
    $bV.textContent = fmt(b);
    $b.style.setProperty('--pct', ((b-10000)/(150000-10000)*100)+'%');
    $ei.textContent = fmt(netEi);
    $sasu.textContent = fmt(netSasu);
    if (Math.abs(diff) < 200) {
      $v.textContent = 'Quasi équivalent';
      $v.className = 'sim-out-value';
      $vSub.textContent = "Choix selon ta protection sociale";
    } else if (diff > 0) {
      $v.textContent = 'SASU + ' + fmt(diff);
      $v.className = 'sim-out-value success';
      $vSub.textContent = 'Attention : SASU = zéro cotisation retraite';
    } else {
      $v.textContent = 'EI + ' + fmt(-diff);
      $v.className = 'sim-out-value success';
      $vSub.textContent = 'EI = couverture sociale incluse';
    }
  }
  $b.addEventListener('input', update);
  document.querySelectorAll('#ei-tmi .sim-chip').forEach(function(c){
    c.addEventListener('click', function(){
      document.querySelectorAll('#ei-tmi .sim-chip').forEach(function(x){x.classList.remove('on')});
      c.classList.add('on'); tmi = +c.dataset.v / 100; update();
    });
  });
  update();
})();`
  return { html, script }
}

// ─── 3. Simulateur rentabilité LCD ───────────────────────────────────
export function widgetRentabilite() {
  const html = `
<div class="sim-widget" id="sim-r">
  <div class="sim-inputs">
    <div class="sim-head"><span class="sim-head-pulse"></span>Simulateur en direct</div>
    <h3 class="sim-title">Calcule ta <em>rentabilité</em></h3>

    <div class="sim-field">
      <div class="sim-label">Prix par nuit <span class="sim-label-val" id="r-p-v">100 €</span></div>
      <input type="range" class="sim-range" id="r-p" min="40" max="400" step="5" value="100">
    </div>

    <div class="sim-field">
      <div class="sim-label">Taux d'occupation <span class="sim-label-val" id="r-o-v">65 %</span></div>
      <input type="range" class="sim-range" id="r-o" min="20" max="95" step="1" value="65">
    </div>

    <div class="sim-field">
      <div class="sim-label">Commission OTA <span class="sim-label-val" id="r-c-v">17 %</span></div>
      <input type="range" class="sim-range" id="r-c" min="0" max="25" step="1" value="17">
    </div>

    <div class="sim-field">
      <div class="sim-label">Charges mensuelles <span class="sim-label-val" id="r-ch-v">800 €</span></div>
      <input type="range" class="sim-range" id="r-ch" min="0" max="3000" step="50" value="800">
    </div>

    <div class="sim-hint">
      Charges = copropriété, eau, électricité, internet, ménage, assurance PNO, abonnements.
    </div>
  </div>

  <div class="sim-results">
    <div class="sim-out primary">
      <div class="sim-out-label">Revenu net mensuel</div>
      <div class="sim-out-value" id="r-out-mens">1 350 €</div>
      <div class="sim-out-sub" id="r-out-mens-sub">après commission + charges</div>
    </div>
    <div class="sim-out">
      <div class="sim-out-label">CA brut annuel</div>
      <div class="sim-out-value" id="r-out-ca">23 700 €</div>
      <div class="sim-out-sub" id="r-out-ca-sub">~237 nuits vendues</div>
    </div>
    <div class="sim-out">
      <div class="sim-out-label">Total commission OTA</div>
      <div class="sim-out-value" id="r-out-com">4 030 €</div>
      <div class="sim-out-sub">économie si réservations directes (Driing)</div>
    </div>
    <div class="sim-cta-row">
      <a href="https://app.jasonmarinho.com/dashboard/simulateurs#rentabilite" class="sim-cta-primary">Préfile avec mon ADR réel <i class="ph-bold ph-arrow-right" style="font-size:12px"></i></a>
      <a href="#explication" class="sim-cta-ghost">Mode investissement</a>
    </div>
  </div>
</div>`
  const script = `
(function(){
  var $p = document.getElementById('r-p'), $pV = document.getElementById('r-p-v');
  var $o = document.getElementById('r-o'), $oV = document.getElementById('r-o-v');
  var $c = document.getElementById('r-c'), $cV = document.getElementById('r-c-v');
  var $ch = document.getElementById('r-ch'), $chV = document.getElementById('r-ch-v');
  var $mens = document.getElementById('r-out-mens'), $mSub = document.getElementById('r-out-mens-sub');
  var $ca = document.getElementById('r-out-ca'), $caSub = document.getElementById('r-out-ca-sub');
  var $com = document.getElementById('r-out-com');
  function fmt(n){return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Math.round(n));}
  function update(){
    var prix = +$p.value, occ = +$o.value / 100, com = +$c.value / 100, ch = +$ch.value;
    var nuits = Math.round(occ * 365);
    var caBrut = prix * nuits;
    var caNet = caBrut * (1 - com);
    var chargesAnnuel = ch * 12;
    var netAnnuel = caNet - chargesAnnuel;
    var netMensuel = netAnnuel / 12;
    var commTotal = caBrut * com;
    $pV.textContent = fmt(prix); $p.style.setProperty('--pct', ((prix-40)/(400-40)*100)+'%');
    $oV.textContent = occ*100 + ' %'; $o.style.setProperty('--pct', ((+$o.value-20)/(95-20)*100)+'%');
    $cV.textContent = (+$c.value)+' %'; $c.style.setProperty('--pct', ($c.value/25*100)+'%');
    $chV.textContent = fmt(ch); $ch.style.setProperty('--pct', ($ch.value/3000*100)+'%');
    $mens.textContent = fmt(netMensuel);
    $mens.className = 'sim-out-value' + (netMensuel < 0 ? ' alert' : '');
    $mSub.textContent = netMensuel < 0
      ? 'Cash-flow négatif : revois prix ou charges'
      : 'soit ' + fmt(netAnnuel) + ' net annuel';
    $ca.textContent = fmt(caBrut);
    $caSub.textContent = '~' + nuits + ' nuits vendues';
    $com.textContent = fmt(commTotal);
  }
  [$p, $o, $c, $ch].forEach(function(el){ el.addEventListener('input', update); });
  update();
})();`
  return { html, script }
}

// ─── 4. Simulateur taxe de séjour ────────────────────────────────────
export function widgetTaxeSejour() {
  const cityOptions = Object.entries(TAXE_SEJOUR)
    .map(([id, c]) => `<option value="${id}">${c.nom}</option>`)
    .join('\n      ')
  const html = `
<div class="sim-widget" id="sim-t">
  <div class="sim-inputs">
    <div class="sim-head"><span class="sim-head-pulse"></span>Simulateur en direct</div>
    <h3 class="sim-title">Calcule la <em>taxe de séjour</em></h3>

    <div class="sim-field">
      <div class="sim-label">Ville</div>
      <select class="sim-select" id="t-city">
      ${cityOptions}
      </select>
    </div>

    <div class="sim-field">
      <div class="sim-label">Classement du meublé</div>
      <div class="sim-chips" id="t-cls">
        <button type="button" class="sim-chip on" data-v="nc">Non classé</button>
        <button type="button" class="sim-chip" data-v="et12">1–2★</button>
        <button type="button" class="sim-chip" data-v="et3">3★</button>
        <button type="button" class="sim-chip" data-v="et45">4–5★</button>
      </div>
    </div>

    <div class="sim-field">
      <div class="sim-label">Adultes <span class="sim-label-val" id="t-a-v">2</span></div>
      <input type="range" class="sim-range" id="t-a" min="1" max="10" step="1" value="2">
    </div>

    <div class="sim-field">
      <div class="sim-label">Nuits <span class="sim-label-val" id="t-n-v">3</span></div>
      <input type="range" class="sim-range" id="t-n" min="1" max="14" step="1" value="3">
    </div>

    <div class="sim-field">
      <div class="sim-label">Prix par nuit <span class="sim-label-val" id="t-p-v">120 €</span></div>
      <input type="range" class="sim-range" id="t-p" min="20" max="500" step="10" value="120">
    </div>

    <div class="sim-hint">
      Pour le non classé, taxe = 5 % du prix par nuit par personne, plafonné au cap palace de la ville.
    </div>
  </div>

  <div class="sim-results">
    <div class="sim-out primary">
      <div class="sim-out-label">Total à collecter</div>
      <div class="sim-out-value" id="t-out-total">14,90 €</div>
      <div class="sim-out-sub" id="t-out-detail">2 adultes × 3 nuits × 2,49 €/nuit/adulte</div>
    </div>
    <div class="sim-out">
      <div class="sim-out-label">Taxe communale</div>
      <div class="sim-out-value" id="t-out-com">13,55 €</div>
      <div class="sim-out-sub">barème de la ville sélectionnée</div>
    </div>
    <div class="sim-out">
      <div class="sim-out-label">Taxe additionnelle</div>
      <div class="sim-out-value" id="t-out-add">1,36 €</div>
      <div class="sim-out-sub" id="t-out-add-sub">départementale +10 %</div>
    </div>
    <div class="sim-cta-row">
      <a href="https://app.jasonmarinho.com/dashboard/simulateurs#taxe" class="sim-cta-primary">Top 30 villes dans l'app <i class="ph-bold ph-arrow-right" style="font-size:12px"></i></a>
      <a href="#explication" class="sim-cta-ghost">Comprendre la formule</a>
    </div>
  </div>
</div>`
  const script = `
(function(){
  var CITIES = ${JSON.stringify(TAXE_SEJOUR)};
  var $c = document.getElementById('t-city');
  var $a = document.getElementById('t-a'), $aV = document.getElementById('t-a-v');
  var $n = document.getElementById('t-n'), $nV = document.getElementById('t-n-v');
  var $p = document.getElementById('t-p'), $pV = document.getElementById('t-p-v');
  var $tot = document.getElementById('t-out-total'), $det = document.getElementById('t-out-detail');
  var $com = document.getElementById('t-out-com'), $add = document.getElementById('t-out-add');
  var $addSub = document.getElementById('t-out-add-sub');
  var cls = 'nc';
  function fmt(n){return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);}
  function update(){
    var city = CITIES[$c.value];
    var adultes = +$a.value, nuits = +$n.value, prix = +$p.value;
    var cap = city[cls];
    var tarifPersNuit;
    if (cls === 'nc') {
      var cinqPct = (prix * 0.05) / Math.max(1, adultes);
      tarifPersNuit = Math.min(cinqPct, cap);
    } else {
      tarifPersNuit = cap;
    }
    var taxeCom = tarifPersNuit * adultes * nuits;
    var taxeDpt = taxeCom * (city.dpt || 0);
    var taxeIdf = taxeCom * (city.idf || 0);
    var total = taxeCom + taxeDpt + taxeIdf;
    $aV.textContent = adultes; $a.style.setProperty('--pct', ((adultes-1)/9*100)+'%');
    $nV.textContent = nuits; $n.style.setProperty('--pct', ((nuits-1)/13*100)+'%');
    $pV.textContent = fmt(prix); $p.style.setProperty('--pct', ((prix-20)/(500-20)*100)+'%');
    $tot.textContent = fmt(total);
    $det.textContent = adultes + ' adulte' + (adultes>1?'s':'') + ' × ' + nuits + ' nuit' + (nuits>1?'s':'') + ' × ' + fmt(tarifPersNuit) + '/nuit/adulte';
    $com.textContent = fmt(taxeCom);
    var add = taxeDpt + taxeIdf;
    $add.textContent = fmt(add);
    $addSub.textContent = city.idf
      ? 'départementale +10 % + régionale IDF +15 %'
      : 'départementale +10 %';
  }
  $c.addEventListener('change', update);
  [$a, $n, $p].forEach(function(el){ el.addEventListener('input', update); });
  document.querySelectorAll('#t-cls .sim-chip').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('#t-cls .sim-chip').forEach(function(x){x.classList.remove('on')});
      b.classList.add('on'); cls = b.dataset.v; update();
    });
  });
  update();
})();`
  return { html, script }
}

export const SIMULATOR_MAP = {
  'fiscalite-micro-bic': widgetFiscalite,
  'choisir-statut-ei-sasu': widgetEiSasu,
  'rentabilite-location-courte-duree': widgetRentabilite,
  'taxe-de-sejour': widgetTaxeSejour,
}
