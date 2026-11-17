#!/usr/bin/env node
// Page d'accueil, section « L'annuaire des pros LCD » (17/11/2026, maquette 1
// validée par Jason) : carte « Décris ton besoin » (vers /trouver-un-pro) puis
// les villes en photo, qui défilent avec les flèches (au doigt sur téléphone).
// Aucun nombre de pros affiché (peu de fiches pour l'instant, décision du
// 17/11/2026) : chaque ville montre les métiers proposés, chacun vers sa page.
// Villes : celles qui ont leurs 3 pages (photographe-lcd-, menage-lcd-,
// depannage-lcd-) et une photo (img/villes/<slug>.webp). Écrit entre les
// marqueurs ANNUAIRE-ACCUEIL de index.html. Lancé au build (build-site.sh).
//   node scripts/build-accueil-annuaire.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { villeLabel } from './lib/inject-ville-pros.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FILE = path.join(ROOT, 'index.html')
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Les grandes villes touristiques d'abord, puis l'ordre alphabétique
const D_ABORD = ['paris', 'lyon', 'marseille', 'nice', 'bordeaux', 'toulouse', 'montpellier', 'nantes', 'lille', 'annecy', 'strasbourg', 'rennes', 'la-rochelle', 'biarritz', 'cannes', 'aix-en-provence']
const CHIPS = ['bordeaux', 'nice', 'annecy', 'lille', 'nantes', 'montpellier']

const has = (prefix, slug) => fs.existsSync(path.join(ROOT, `${prefix}-${slug}`, 'index.html'))
const slugs = fs.readdirSync(ROOT)
  .filter(d => d.startsWith('photographe-lcd-'))
  .map(d => d.slice('photographe-lcd-'.length))
  .filter(s => has('menage-lcd', s) && has('depannage-lcd', s) && fs.existsSync(path.join(ROOT, 'img/villes', `${s}.webp`)))
  .sort((a, b) => {
    const ia = D_ABORD.indexOf(a), ib = D_ABORD.indexOf(b)
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    return villeLabel(a).localeCompare(villeLabel(b), 'fr')
  })

const card = (s, i) => `<div class="aa-city"><img src="/img/villes/${s}.webp" alt="" width="600" height="800" loading="lazy" decoding="async"><a class="aa-go" href="/photographe-lcd-${s}" aria-label="Les pros LCD à ${esc(villeLabel(s))}"><i class="ph-bold ph-arrow-right" aria-hidden="true"></i></a><b>${esc(villeLabel(s))}</b><div class="aa-tr"><a href="/photographe-lcd-${s}"><i class="ph-bold ph-camera" aria-hidden="true"></i>Photo</a><a href="/menage-lcd-${s}"><i class="ph-bold ph-sparkle" aria-hidden="true"></i>Ménage</a><a href="/depannage-lcd-${s}"><i class="ph-bold ph-wrench" aria-hidden="true"></i>Dépannage</a></div></div>`

const chips = CHIPS.filter(s => slugs.includes(s)).map(s => `<a href="/photographe-lcd-${s}">${esc(villeLabel(s))}</a>`).join('')

const CSS = `.aa{padding:clamp(40px,6vw,64px) 0}
.aa-head{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px 24px}
.aa-head p{margin:10px 0 0;color:var(--tm);font-size:16px;max-width:560px;line-height:1.55}
.aa-head h2 em{font-style:italic;font-weight:300;color:var(--g)}
.aa-nav{display:flex;align-items:center;gap:10px}
.aa-nav span{font-size:13px;color:var(--tl);margin-right:4px;font-variant-numeric:tabular-nums}
.aa-nav button{width:42px;height:42px;border-radius:50%;border:1px solid var(--bd);background:#fff;display:grid;place-items:center;font-size:16px;color:var(--td);cursor:pointer;transition:opacity .15s,border-color .15s}
.aa-nav button:hover{border:1px solid rgba(0,76,63,.4)}
.aa-nav button:disabled{opacity:.4;cursor:default}
.aa-row{display:grid;grid-template-columns:minmax(300px,1.15fr) 3fr;gap:14px;margin-top:26px}
.aa-ask{border-radius:20px;padding:24px;background:linear-gradient(155deg,#002a21,#004C3F 60%,#0b5c4b);color:#fff;display:flex;flex-direction:column;gap:14px;min-height:380px;position:relative;overflow:hidden}
.aa-ask::after{content:"";position:absolute;right:-60px;top:-60px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(255,213,107,.28),transparent 70%);pointer-events:none}
.aa-k{font-size:11.5px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:#FFD56B}
.aa-ask h3{font-family:'Fraunces','Fraunces Fallback',serif;font-weight:400;font-size:26px;line-height:1.15;margin:0;color:#fff}
.aa-ask h3 em{color:#FFD56B;font-weight:300}
.aa-ask ol{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:9px}
.aa-ask li{display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.45;color:rgba(255,255,255,.82)}
.aa-ask li b{flex:none;width:22px;height:22px;border-radius:50%;background:rgba(255,213,107,.18);color:#FFD56B;font-size:12px;display:grid;place-items:center}
.aa-trades{display:flex;gap:6px;flex-wrap:wrap}
.aa-trades span{font-size:12.5px;font-weight:600;padding:6px 10px;border-radius:99px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);display:inline-flex;gap:6px;align-items:center}
.aa-trades i{color:#FFD56B}
.aa-cta{margin-top:auto;display:flex;align-items:center;justify-content:center;gap:9px;min-height:52px;border-radius:13px;background:#FFD56B;color:#003329;font-weight:700;font-size:15.5px;text-decoration:none;position:relative;z-index:1;transition:background .15s}
.aa-cta:hover{background:#ffe08f}
.aa-ask small{font-size:12px;color:rgba(255,255,255,.6);text-align:center}
.aa-track{display:grid;grid-auto-flow:column;grid-auto-columns:calc((100% - 28px) / 3);gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;scroll-behavior:smooth}
.aa-track::-webkit-scrollbar{display:none}
.aa-city{position:relative;border-radius:20px;overflow:hidden;min-height:380px;background:#334;display:flex;flex-direction:column;justify-content:flex-end;padding:20px;color:#fff;scroll-snap-align:start}
.aa-city img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .5s}
.aa-city:hover img{transform:scale(1.04)}
.aa-city::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,20,14,.82));z-index:1}
.aa-city>b,.aa-city .aa-tr{position:relative;z-index:2}
.aa-city>b{font-size:24px;font-weight:600}
.aa-go{position:absolute;inset:0;z-index:2;display:flex;justify-content:flex-end;align-items:flex-start;padding:16px;color:var(--gd);text-decoration:none}
.aa-go i{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.92);display:grid;place-items:center;font-size:15px}
.aa-tr{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;z-index:3!important}
.aa-tr a{font-size:12px;font-weight:600;padding:5px 9px;border-radius:99px;background:rgba(255,255,255,.16);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);display:inline-flex;gap:5px;align-items:center;color:#fff;text-decoration:none;transition:background .15s}
.aa-tr a:hover{background:rgba(255,255,255,.3)}
.aa-chips{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:26px;padding-top:22px;border-top:1px solid var(--bd)}
.aa-chips .t{font-size:12px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:var(--tl);margin-right:6px}
.aa-chips a{font-size:14.5px;padding:10px 16px;border-radius:99px;border:1px solid var(--bd);background:#fff;color:var(--td);text-decoration:none;transition:border-color .15s}
.aa-chips a:hover{border:1px solid rgba(0,76,63,.4)}
.aa-chips .all{margin-left:auto;font-size:14px;color:var(--tl)}
.aa-chips .all a{font-weight:600;color:var(--g);border:0;background:none;padding:0;text-decoration:underline;text-underline-offset:4px}
@media(max-width:900px){.aa-row{grid-template-columns:1fr}.aa-ask{min-height:0}.aa-track{grid-auto-columns:calc((100% - 14px) / 2)}.aa-city{min-height:300px}}
@media(max-width:560px){.aa-nav{display:none}.aa-track{grid-auto-columns:78%;margin:0 -16px;padding:0 16px;scroll-padding:0 16px}.aa-chips .all{margin-left:0}}
@media(prefers-reduced-motion:reduce){.aa-track{scroll-behavior:auto}.aa-city img{transition:none}}`

const JS = `(function(){var t=document.getElementById('aa-track');if(!t)return;var p=document.getElementById('aa-prev'),n=document.getElementById('aa-next'),c=document.getElementById('aa-count'),k=t.children.length;function per(){var f=t.children[0];return f?Math.max(1,Math.round(t.clientWidth/(f.getBoundingClientRect().width+14))):1}function upd(){var w=t.children[0]?t.children[0].getBoundingClientRect().width+14:1,i=Math.round(t.scrollLeft/w),q=per();if(c)c.textContent=(i+1)+'-'+Math.min(k,i+q)+' sur '+k+' villes';if(p)p.disabled=t.scrollLeft<4;if(n)n.disabled=t.scrollLeft+t.clientWidth>=t.scrollWidth-4}function go(d){t.scrollBy({left:d*t.clientWidth,behavior:'smooth'})}if(p)p.addEventListener('click',function(){go(-1)});if(n)n.addEventListener('click',function(){go(1)});t.addEventListener('scroll',function(){window.requestAnimationFrame(upd)},{passive:true});window.addEventListener('resize',upd);upd()})()`

const html = `<!-- ANNUAIRE-ACCUEIL:START -->
<!-- Généré par scripts/build-accueil-annuaire.mjs : ne pas éditer à la main -->
<section class="aa" aria-labelledby="aa-t">
<style>${CSS}</style>
<div class="wrap">
<div class="aa-head">
<div><span class="eyb">L’annuaire des pros LCD</span>
<h2 class="h2" id="aa-t">Des pros près de chez toi, <em>qui viennent à toi.</em></h2>
<p>Photographes, équipes de ménage, dépannage : décris ton besoin une fois, les pros les plus proches te répondent directement. Gratuit et sans commission.</p></div>
<div class="aa-nav"><span id="aa-count">1-3 sur ${slugs.length} villes</span><button type="button" id="aa-prev" aria-label="Villes précédentes" disabled><i class="ph-bold ph-caret-left" aria-hidden="true"></i></button><button type="button" id="aa-next" aria-label="Villes suivantes"><i class="ph-bold ph-caret-right" aria-hidden="true"></i></button></div>
</div>
<div class="aa-row">
<div class="aa-ask">
<span class="aa-k">Le plus rapide</span>
<h3>Décris ton besoin, <em>reçois des réponses.</em></h3>
<ol><li><b>1</b>Ton logement et ta ville, en une minute</li><li><b>2</b>On l’envoie aux pros les plus proches</li><li><b>3</b>Ils te répondent directement</li></ol>
<div class="aa-trades"><span><i class="ph-bold ph-camera" aria-hidden="true"></i>Photo</span><span><i class="ph-bold ph-sparkle" aria-hidden="true"></i>Ménage</span><span><i class="ph-bold ph-wrench" aria-hidden="true"></i>Dépannage</span></div>
<a class="aa-cta" href="/trouver-un-pro"><i class="ph-bold ph-paper-plane-tilt" aria-hidden="true"></i>Décrire mon besoin</a>
<small>Gratuit pour toi · aucune commission</small>
</div>
<div class="aa-track" id="aa-track">${slugs.map(card).join('')}</div>
</div>
<div class="aa-chips"><span class="t">Autres villes</span>${chips}<span class="all">Les annuaires : <a href="/annuaires/photographes">Photographes</a> · <a href="/annuaires/menage">Ménage</a> · <a href="/annuaires/depannage">Dépannage</a></span></div>
</div>
<script>${JS}</script>
</section>
<!-- ANNUAIRE-ACCUEIL:END -->`

let src = fs.readFileSync(FILE, 'utf8')
if (src.includes('<!-- ANNUAIRE-ACCUEIL:START -->')) {
  src = src.replace(/<!-- ANNUAIRE-ACCUEIL:START -->[\s\S]*?<!-- ANNUAIRE-ACCUEIL:END -->/, html)
} else {
  if (!src.includes('<!-- PARTENAIRES -->')) throw new Error('index.html : repère <!-- PARTENAIRES --> introuvable')
  src = src.replace('<!-- PARTENAIRES -->', `${html}\n\n<!-- PARTENAIRES -->`)
}
fs.writeFileSync(FILE, src)
console.log(`[accueil-annuaire] ${slugs.length} villes`)
