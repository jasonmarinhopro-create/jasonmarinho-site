#!/usr/bin/env node
// Génère la marketplace de /partenaires (rangée de catégories, filtres en
// barre latérale, cartes offres + outils référencés) à partir de
// scripts/data/partenaires.mjs, entre les marqueurs MARKET:START/END de
// partenaires/index.html. Idempotent.
//
// Usage : node scripts/build-partenaires.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CATEGORIES, RACCOURCIS, OUTILS } from './data/partenaires.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FILE = path.join(ROOT, 'partenaires/index.html')

const BADGES = {
  affilie: ['Lien affilié', 'b-aff'],
  parrainage: ['Parrainage', 'b-aff'],
  membre: ['Réduction membre', 'b-mem'],
  fondateur: ['Co-fondé par Jason', 'b-fond'],
}
const amp = s => s.replace(/&(?!amp;)/g, '&amp;')
const catById = Object.fromEntries(CATEGORIES.map(c => [c.id, c]))
const count = id => OUTILS.filter(o => o.cats.includes(id)).length
const nbOffres = OUTILS.filter(o => o.badge).length

function lien(l, i) {
  const cls = i === 0 ? 'mk-l mk-l1' : 'mk-l'
  const arrow = l.sponsored || l.externe ? ' <i class="ph-bold ph-arrow-up-right"></i>' : ' <i class="ph-bold ph-arrow-right"></i>'
  if (l.sponsored) return `<a href="${amp(l.href)}" target="_blank" rel="sponsored noopener" class="${cls}">${l.label}${arrow}</a>`
  if (l.externe) {
    const rel = /driing\.co/.test(l.href) ? 'noopener' : 'nofollow noopener'
    return `<a href="${amp(l.href)}" target="_blank" rel="${rel}" class="${cls}">${l.label}${arrow}</a>`
  }
  return `<a href="${l.href}" class="${cls}">${l.label}${arrow}</a>`
}

// Toutes les cartes ont exactement la même structure (en-tête logo + nom +
// badge, 1 ligne d'accroche, 3 lignes de description, 1 rangée de liens en
// bas) pour que la grille reste équilibrée : texte coupé proprement au-delà,
// texte complet au survol (title).
function carte(o) {
  const chip = o.badge
    ? `<span class="mk-badge ${BADGES[o.badge][1]}">${BADGES[o.badge][0]}</span>`
    : '<span class="mk-badge b-ref">Référencé</span>'
  const accroche = o.offre || catById[o.cats[0]].label
  const liens = o.liens.slice(0, 2)
  return `      <article class="mk-card${o.badge ? ' is-offre' : ''}" data-cats="${o.cats.join(' ')}"${o.badge ? ' data-offre="1"' : ''}>
        <div class="mk-head-c">
          <div class="mk-logo" style="color:${o.couleur}" aria-hidden="true">${o.mono}</div>
          <div class="mk-id"><h3 class="mk-nom">${o.nom}</h3>${chip}</div>
        </div>
        <p class="mk-offre${o.offre ? '' : ' is-cat'}" title="${accroche}">${accroche}</p>
        <p class="mk-desc" title="${o.desc.replace(/"/g, '&quot;')}">${o.desc}</p>
        <div class="mk-liens">${liens.map(lien).join('')}</div>
      </article>`
}

const html = `<!-- MARKET:START -->
<!-- Généré par scripts/build-partenaires.mjs depuis scripts/data/partenaires.mjs : ne pas éditer à la main -->
<section class="sec mk-sec" id="offres">
  <style>
    .mk-sec{background:#fff}
    .mk-sec .s-in{max-width:1320px}
    .mk-head{text-align:center;max-width:760px;margin:0 auto 44px}
    .mk-head .h2{font-size:clamp(1.9rem,3.6vw,2.9rem);margin-bottom:14px}
    .mk-head p{font-size:clamp(16px,1.6vw,19px);color:var(--tm);line-height:1.6;margin:0;font-family:'Fraunces',serif;font-weight:300}
    .mk-tiles{display:grid;grid-template-columns:repeat(${RACCOURCIS.length},1fr);gap:12px;max-width:1000px;margin:0 auto 64px}
    .mk-tile{display:flex;flex-direction:column;align-items:center;gap:14px;background:none;border:0;cursor:pointer;padding:14px 8px;border-radius:14px;font-family:'Outfit',sans-serif;font-size:14.5px;color:var(--td);line-height:1.4;transition:background .15s}
    .mk-tile i{display:flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:14px;background:var(--cr);font-size:24px;color:var(--g);transition:background .15s,color .15s}
    .mk-tile:hover{background:rgba(0,76,63,.03)}
    .mk-tile:hover i,.mk-tile.on i{background:var(--g);color:var(--y)}
    .mk-layout{display:grid;grid-template-columns:230px 1fr;gap:clamp(28px,4vw,56px);align-items:start}
    .mk-side{position:sticky;top:90px;display:flex;flex-direction:column;gap:2px}
    .mk-f{display:flex;align-items:center;justify-content:space-between;gap:8px;background:none;border:0;cursor:pointer;text-align:left;padding:11px 0;font-family:'Outfit',sans-serif;font-size:15px;color:var(--tm);position:relative}
    .mk-f span{font-size:12px;color:var(--tl);font-variant-numeric:tabular-nums}
    .mk-f:hover{color:var(--g)}
    .mk-f.on{color:var(--g);font-weight:600}
    .mk-f.on::after{content:"";position:absolute;left:0;bottom:4px;width:40px;height:2px;border-radius:2px;background:var(--g)}
    .mk-f.star{color:#7a5a00}
    .mk-f.star.on{color:#7a5a00}
    .mk-f.star.on::after{background:var(--y)}
    .mk-sep{height:1px;background:rgba(0,76,63,.1);margin:8px 0}
    .mk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;align-items:stretch}
    .mk-card{display:flex;flex-direction:column;background:#fff;border:1px solid rgba(0,76,63,.1);border-radius:16px;padding:22px;min-width:0;transition:border-color .15s,box-shadow .15s,transform .15s}
    .mk-card:hover{border-color:rgba(0,76,63,.22);box-shadow:0 10px 28px rgba(0,76,63,.07);transform:translateY(-2px)}
    .mk-card.is-offre{border-color:rgba(255,213,107,.7);background:linear-gradient(180deg,rgba(255,213,107,.07),#fff 60%)}
    .mk-card[hidden]{display:none}
    .mk-head-c{display:flex;align-items:center;gap:14px;margin-bottom:16px}
    .mk-logo{flex:0 0 52px;width:52px;height:52px;border-radius:13px;background:#fff;border:1px solid rgba(0,76,63,.12);box-shadow:0 1px 2px rgba(0,0,0,.03);display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-size:24px;font-weight:600;line-height:1}
    .mk-id{min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:5px}
    .mk-nom{font-family:'Fraunces',serif;font-size:1.3rem;font-weight:400;color:var(--td);margin:0;letter-spacing:-.02em;line-height:1.15;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .mk-badge{font-size:10px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;padding:3px 7px;border-radius:5px;white-space:nowrap;line-height:1.4}
    .b-aff{background:rgba(255,213,107,.3);color:#7a5a00}
    .b-mem{background:rgba(21,128,61,.1);color:#15803d}
    .b-fond{background:rgba(0,76,63,.08);color:var(--g)}
    .b-ref{background:rgba(0,0,0,.04);color:var(--tl)}
    .mk-offre{font-size:14.5px;font-weight:600;color:var(--td);margin:0 0 6px;line-height:1.45;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .mk-offre.is-cat{color:var(--tm);font-weight:500}
    .mk-desc{font-size:14px;line-height:1.6;color:var(--tl);margin:0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;height:calc(1.6em * 3)}
    .mk-liens{display:flex;align-items:center;flex-wrap:wrap;gap:10px 12px;margin-top:auto;padding-top:18px}
    .mk-l{white-space:nowrap}
    .mk-l{font-size:13px;font-weight:600;color:var(--g);text-decoration:none;display:inline-flex;align-items:center;gap:5px}
    .mk-l i{font-size:11px}
    .mk-l:hover{text-decoration:underline}
    .mk-l1{background:var(--g);color:#fff;padding:9px 12px;border-radius:8px}
    .mk-l1:hover{background:var(--gd);text-decoration:none}
    .mk-note{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;line-height:1.6;color:var(--tl);background:var(--cr);border-radius:12px;padding:14px 16px;margin:0 0 36px}
    .mk-note i{font-size:17px;color:var(--g);margin-top:1px}
    .mk-count{font-size:13px;color:var(--tl);margin:0 0 20px}
    @media(max-width:860px){
      .mk-tiles{display:none}
      .mk-layout{grid-template-columns:1fr}
      .mk-side{position:static;flex-direction:row;overflow-x:auto;gap:8px;padding-bottom:6px;margin:0 -16px;padding-left:16px;padding-right:16px;scrollbar-width:none}
      .mk-side::-webkit-scrollbar{display:none}
      .mk-sep{display:none}
      .mk-f{flex:0 0 auto;padding:9px 14px;border:1px solid rgba(0,76,63,.15);border-radius:100px;font-size:14px;white-space:nowrap}
      .mk-f.on{background:var(--g);color:#fff;border-color:var(--g)}
      .mk-f.on span{color:rgba(255,255,255,.7)}
      .mk-f.on::after{display:none}
      .mk-f.star.on{background:var(--y);color:var(--gd);border-color:var(--y)}
      .mk-grid{grid-template-columns:1fr;gap:14px}
    }
  </style>
  <div class="s-in">
    <div class="mk-head">
      <div class="lbl dk">Offres &amp; outils</div>
      <h2 class="h2">Tire plus de ta <em>location courte durée</em></h2>
      <p>Les outils que je recommande, les offres négociées pour les membres et le catalogue des outils LCD, par catégorie.</p>
    </div>

    <div class="mk-tiles" role="group" aria-label="Catégories principales">
${RACCOURCIS.map(id => `      <button type="button" class="mk-tile" data-f="${id}"><i class="ph ph-${catById[id].icon}"></i>${catById[id].label}</button>`).join('\n')}
    </div>

    <div class="mk-layout">
      <nav class="mk-side" aria-label="Filtrer par catégorie">
        <button type="button" class="mk-f on" data-f="all">Toutes les catégories <span>${OUTILS.length}</span></button>
        <button type="button" class="mk-f star" data-f="offres">★ Offres partenaires <span>${nbOffres}</span></button>
        <div class="mk-sep"></div>
${CATEGORIES.map(c => `        <button type="button" class="mk-f" data-f="${c.id}">${c.label} <span>${count(c.id)}</span></button>`).join('\n')}
      </nav>

      <div>
        <p class="mk-note"><i class="ph ph-info"></i><span>Les outils marqués <strong>Lien affilié</strong> ou <strong>Parrainage</strong> me rapportent une commission si tu t'abonnes via mon lien, sans aucun surcoût pour toi. Tous les autres sont référencés sans aucune rémunération.</span></p>
        <p class="mk-count" aria-live="polite"><span id="mk-n">${OUTILS.length}</span> outils</p>
        <div class="mk-grid">
${OUTILS.map(carte).join('\n')}
        </div>
      </div>
    </div>
  </div>
  <script>
  (function(){
    var sec=document.getElementById('offres');if(!sec)return;
    var cards=sec.querySelectorAll('.mk-card'),btns=sec.querySelectorAll('[data-f]'),n=document.getElementById('mk-n');
    function apply(f,scroll){
      var shown=0;
      cards.forEach(function(c){
        var ok=f==='all'||(f==='offres'?c.hasAttribute('data-offre'):(' '+c.getAttribute('data-cats')+' ').indexOf(' '+f+' ')>-1);
        c.hidden=!ok;if(ok)shown++;
      });
      btns.forEach(function(b){b.classList.toggle('on',b.getAttribute('data-f')===f)});
      if(n)n.textContent=shown;
      if(scroll){var g=sec.querySelector('.mk-layout');var y=g.getBoundingClientRect().top+window.pageYOffset-90;if(Math.abs(window.pageYOffset-y)>200)window.scrollTo({top:y,behavior:'smooth'})}
      try{history.replaceState(null,'',f==='all'?location.pathname:'#'+f)}catch(e){}
    }
    btns.forEach(function(b){b.addEventListener('click',function(){apply(b.getAttribute('data-f'),b.classList.contains('mk-tile'))})});
    var h=location.hash.slice(1);
    if(h&&sec.querySelector('[data-f="'+h+'"]'))apply(h,false);
  })();
  </script>
</section>
<!-- MARKET:END -->`

let src = fs.readFileSync(FILE, 'utf8')
if (src.includes('<!-- MARKET:START -->')) {
  src = src.replace(/<!-- MARKET:START -->[\s\S]*?<!-- MARKET:END -->/, html)
} else {
  // Première génération : remplace les anciennes sections « partenaires du moment » + catalogue
  const a = src.indexOf('<!-- PARTENARIATS NÉGOCIÉS -->')
  const b = src.indexOf('<!-- COMPARATIFS -->')
  if (a === -1 || b === -1) throw new Error('Sections à remplacer introuvables')
  src = src.slice(0, a) + html + '\n\n' + src.slice(b)
}
fs.writeFileSync(FILE, src)

// Même catalogue pour le dashboard (Entre Hôtes → Partenaires) : copie JSON
// dans jason-app (projet Vercel séparé, qui ne voit pas scripts/). Liens
// relatifs rendus absolus, Hospitable suivi en utm_medium=other (canal app).
// Garde-fou : jason-app/lib/ecosysteme/partenaires-sync.test.ts.
const APP_JSON = path.join(ROOT, 'jason-app/lib/ecosysteme/partenaires-data.json')
const absolu = href => (href.startsWith('/') ? 'https://jasonmarinho.com' + href : href)
const appOutils = OUTILS.map(({ liensApp, ...o }) => ({
  ...o,
  // liensApp : liens propres au dashboard (ex. « Devenir membre » inutile pour un membre)
  liens: (liensApp ?? o.liens).map(l => ({ ...l, href: absolu(l.href).replace('utm_medium=blog', 'utm_medium=other') })),
}))
fs.mkdirSync(path.dirname(APP_JSON), { recursive: true })
fs.writeFileSync(APP_JSON, JSON.stringify({ categories: CATEGORIES, outils: appOutils }, null, 2) + '\n')

console.log(`[build-partenaires] ${OUTILS.length} outils, ${nbOffres} offres, ${CATEGORIES.length} catégories`)
