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
import { CATEGORIES, RACCOURCIS, OUTILS, MOTS } from './data/partenaires.mjs'

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
// Texte de recherche d'une carte : nom, accroche, description, catégories et leurs mots
const norm = t => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, ' ')
const texteRecherche = o => norm([o.nom, o.offre || '', o.desc, ...o.cats.map(c => catById[c].label), ...o.cats.flatMap(c => MOTS[c] || [])].join(' ')).replace(/"/g, '')
// Catégories proposées par la recherche (libellé + mots), pour le script de la page
const SUGG = CATEGORIES.filter(c => count(c.id) > 0).map(c => ({ id: c.id, l: c.label, i: c.icon, n: count(c.id), k: norm([c.label, ...(MOTS[c.id] || [])].join('|')) }))
const SUGG_OUTILS = OUTILS.map(o => ({ n: o.nom, k: norm(o.nom), c: catById[o.cats[0]].label }))

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
  return `      <article class="mk-card${o.badge ? ' is-offre' : ''}" data-cats="${o.cats.join(' ')}" data-q="${texteRecherche(o)}" data-nom="${norm(o.nom)}"${o.badge ? ' data-offre="1"' : ''}>
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
    .mk-head p{font-size:clamp(16px,1.6vw,19px);color:var(--tm);line-height:1.6;margin:0;font-family:'Fraunces','Fraunces Fallback',serif;font-weight:300}
    .mk-tiles{display:grid;grid-template-columns:repeat(7,1fr);gap:8px 12px;max-width:940px;margin:0 auto 60px}
    .mk-tile{display:flex;flex-direction:column;align-items:center;gap:14px;background:none;border:0;cursor:pointer;padding:14px 8px;border-radius:14px;font-family:'Outfit','Outfit Fallback',sans-serif;font-size:14.5px;color:var(--td);line-height:1.4;transition:background .15s}
    .mk-tile i{display:flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:14px;background:var(--cr);font-size:24px;color:var(--g);transition:background .15s,color .15s}
    .mk-tile:hover{background:rgba(0,76,63,.03)}
    .mk-tile:hover i,.mk-tile.on i{background:var(--g);color:var(--y)}
    .mk-search{position:relative;max-width:720px;margin:0 auto 44px}
    .mk-search label{display:flex;align-items:center;gap:12px;height:60px;padding:0 20px;background:#fff;border:1px solid rgba(0,76,63,.18);border-radius:16px;box-shadow:0 8px 26px rgba(0,76,63,.07);cursor:text}
    .mk-search label:focus-within{border:1px solid var(--g);box-shadow:0 8px 26px rgba(0,76,63,.12),0 0 0 3px rgba(0,76,63,.08)}
    .mk-search i.ph-magnifying-glass{font-size:20px;color:var(--g)}
    .mk-search input{flex:1;min-width:0;border:0;outline:0;background:none;font:400 16px 'Outfit','Outfit Fallback',sans-serif;color:var(--td)}
    .mk-search input::placeholder{color:#8a9887}
    .mk-clear{border:0;background:var(--cr);width:30px;height:30px;border-radius:50%;cursor:pointer;color:var(--tm);display:grid;place-items:center}
    .mk-clear[hidden]{display:none}
    .mk-help{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;margin-top:12px;font-size:13px;color:var(--tl)}
    .mk-help button{border:1px solid rgba(0,76,63,.15);background:#fff;border-radius:99px;padding:6px 12px;font:500 13px 'Outfit','Outfit Fallback',sans-serif;color:var(--tm);cursor:pointer}
    .mk-help button:hover{border:1px solid var(--g);color:var(--g)}
    .mk-sug{position:absolute;left:0;right:0;top:66px;z-index:20;background:#fff;border:1px solid rgba(0,76,63,.14);border-radius:14px;box-shadow:0 18px 40px rgba(0,26,17,.14);padding:8px;max-height:360px;overflow:auto}
    .mk-sug[hidden]{display:none}
    .mk-sug-t{font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--tl);padding:8px 10px 4px}
    .mk-sug button{display:flex;align-items:center;gap:10px;width:100%;border:0;background:none;border-radius:10px;padding:10px;font:500 14.5px 'Outfit','Outfit Fallback',sans-serif;color:var(--td);cursor:pointer;text-align:left}
    .mk-sug button i{font-size:17px;color:var(--g)}
    .mk-sug button small{margin-left:auto;font-size:12px;color:var(--tl)}
    .mk-sug button:hover,.mk-sug button.on{background:var(--cr)}
    .mk-empty{display:none;text-align:center;padding:36px 20px;border:1px dashed rgba(0,76,63,.25);border-radius:16px;color:var(--tm);font-size:15px;line-height:1.6}
    .mk-empty a{color:var(--g);font-weight:600}
    .mk-layout{display:grid;grid-template-columns:230px 1fr;gap:clamp(28px,4vw,56px);align-items:start}
    .mk-side{position:sticky;top:90px;display:flex;flex-direction:column;gap:2px}
    .mk-f{display:flex;align-items:center;justify-content:space-between;gap:8px;background:none;border:0;cursor:pointer;text-align:left;padding:11px 0;font-family:'Outfit','Outfit Fallback',sans-serif;font-size:15px;color:var(--tm);position:relative}
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
    .mk-logo{flex:0 0 52px;width:52px;height:52px;border-radius:13px;background:#fff;border:1px solid rgba(0,76,63,.12);box-shadow:0 1px 2px rgba(0,0,0,.03);display:flex;align-items:center;justify-content:center;font-family:'Fraunces','Fraunces Fallback',serif;font-size:24px;font-weight:600;line-height:1}
    .mk-id{min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:5px}
    .mk-nom{font-family:'Fraunces','Fraunces Fallback',serif;font-size:1.3rem;font-weight:400;color:var(--td);margin:0;letter-spacing:-.02em;line-height:1.15;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
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

    <div class="mk-search">
      <label for="mk-q"><i class="ph ph-magnifying-glass" aria-hidden="true"></i><input id="mk-q" type="text" enterkeyhint="search" autocomplete="off" spellcheck="false" placeholder="Que cherches-tu ? Un comptable, une serrure connectée, des prix dynamiques…" aria-label="Rechercher un outil ou un besoin" aria-controls="mk-sug" aria-expanded="false"><button type="button" class="mk-clear" id="mk-clear" aria-label="Effacer la recherche" hidden><i class="ph ph-x"></i></button></label>
      <div class="mk-sug" id="mk-sug" role="listbox" hidden></div>
      <div class="mk-help"><span>Idées :</span><button type="button" data-q="comptable LMNP">comptable LMNP</button><button type="button" data-q="serrure connectée">serrure connectée</button><button type="button" data-q="prix dynamique">prix dynamique</button><button type="button" data-q="créer une société">créer une société</button><button type="button" data-q="étude de marché">étude de marché</button></div>
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
        <p class="mk-count" aria-live="polite"><span id="mk-n">${OUTILS.length}</span> <span id="mk-w">outils</span></p>
        <div class="mk-grid">
${OUTILS.map(carte).join('\n')}
        </div>
        <p class="mk-empty" id="mk-empty">Aucun outil pour « <span id="mk-qv"></span> ». Essaie un autre mot (comptable, ménage, serrure…) ou <a href="/contact">demande-moi conseil</a> : je te réponds.</p>
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
      var w=document.getElementById('mk-w');if(w)w.textContent=shown>1?'outils':'outil';
      if(scroll){var g=sec.querySelector('.mk-layout');var y=g.getBoundingClientRect().top+window.pageYOffset-90;if(Math.abs(window.pageYOffset-y)>200)window.scrollTo({top:y,behavior:'smooth'})}
      try{history.replaceState(null,'',f==='all'?location.pathname:'#'+f)}catch(e){}
    }
    btns.forEach(function(b){b.addEventListener('click',function(){apply(b.getAttribute('data-f'),b.classList.contains('mk-tile'))})});
    var h=location.hash.slice(1);
    if(h&&sec.querySelector('[data-f="'+h+'"]'))apply(h,false);
    // Recherche avec suggestions (17/11/2026)
    var S=${JSON.stringify(SUGG)},T=${JSON.stringify(SUGG_OUTILS)};
    var q=document.getElementById('mk-q'),sug=document.getElementById('mk-sug'),clr=document.getElementById('mk-clear'),empty=document.getElementById('mk-empty'),qv=document.getElementById('mk-qv'),act=-1;
    if(!q)return;
    function nm(t){return String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\u2019']/g,' ').trim()}
    function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
    function filtre(v){
      var w=nm(v).split(/ +/).filter(function(x){return x.length>1}),shown=0;
      if(!w.length){apply('all',false);empty.style.display='none';return}
      btns.forEach(function(b){b.classList.remove('on')});
      cards.forEach(function(c){var t=c.getAttribute('data-q'),ok=w.every(function(x){return t.indexOf(x)>-1});c.hidden=!ok;if(ok)shown++});
      if(n)n.textContent=shown;var ww=document.getElementById('mk-w');if(ww)ww.textContent=shown>1?'outils':'outil';
      qv.textContent=v;empty.style.display=shown?'none':'block';
    }
    function ouvre(v){
      var x=nm(v);act=-1;
      if(x.length<2){sug.hidden=true;q.setAttribute('aria-expanded','false');return}
      var cs=S.filter(function(c){return c.k.indexOf(x)>-1||x.split(/ +/).every(function(m){return m.length<2||c.k.indexOf(m)>-1})}).slice(0,4);
      var ts=T.filter(function(t){return t.k.indexOf(x)>-1}).slice(0,5);
      var h='';
      if(cs.length)h+='<div class="mk-sug-t">Catégories</div>'+cs.map(function(c){return '<button type="button" role="option" data-cat="'+c.id+'"><i class="ph ph-'+c.i+'"></i>'+esc(c.l)+'<small>'+c.n+' outil'+(c.n>1?'s':'')+'</small></button>'}).join('');
      if(ts.length)h+='<div class="mk-sug-t">Outils</div>'+ts.map(function(t){return '<button type="button" role="option" data-outil="'+esc(t.n)+'"><i class="ph ph-buildings"></i>'+esc(t.n)+'<small>'+esc(t.c)+'</small></button>'}).join('');
      sug.innerHTML=h;sug.hidden=!h;q.setAttribute('aria-expanded',h?'true':'false');
    }
    function choisir(b){
      sug.hidden=true;q.setAttribute('aria-expanded','false');
      if(b.hasAttribute('data-cat')){q.value='';clr.hidden=true;empty.style.display='none';apply(b.getAttribute('data-cat'),true);return}
      q.value=b.getAttribute('data-outil');clr.hidden=false;filtre(q.value);
      var g=sec.querySelector('.mk-layout');window.scrollTo({top:g.getBoundingClientRect().top+window.pageYOffset-90,behavior:'smooth'});
    }
    q.addEventListener('input',function(){clr.hidden=!q.value;filtre(q.value);ouvre(q.value)});
    q.addEventListener('focus',function(){if(q.value)ouvre(q.value)});
    q.addEventListener('keydown',function(e){
      var it=sug.querySelectorAll('button');
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){if(!it.length)return;e.preventDefault();act=(act+(e.key==='ArrowDown'?1:-1)+it.length)%it.length;it.forEach(function(b,i){b.classList.toggle('on',i===act)})}
      else if(e.key==='Enter'){e.preventDefault();if(act>-1&&it[act])choisir(it[act]);else{sug.hidden=true;var g=sec.querySelector('.mk-layout');window.scrollTo({top:g.getBoundingClientRect().top+window.pageYOffset-90,behavior:'smooth'})}}
      else if(e.key==='Escape'){sug.hidden=true}
    });
    sug.addEventListener('mousedown',function(e){e.preventDefault()});
    sug.addEventListener('click',function(e){var b=e.target.closest('button');if(b)choisir(b)});
    document.addEventListener('click',function(e){if(!e.target.closest('.mk-search'))sug.hidden=true});
    clr.addEventListener('click',function(){q.value='';clr.hidden=true;sug.hidden=true;filtre('');q.focus()});
    sec.querySelectorAll('.mk-help button').forEach(function(b){b.addEventListener('click',function(){q.value=b.getAttribute('data-q');clr.hidden=false;filtre(q.value);ouvre(q.value);q.focus()})});
    btns.forEach(function(b){b.addEventListener('click',function(){q.value='';clr.hidden=true;empty.style.display='none'})});
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
