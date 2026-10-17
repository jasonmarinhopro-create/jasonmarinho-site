// Fiches des pros façon site vitrine (12/10/2026) : morceaux de page partagés
// par build-photographers.mjs, build-cleaners.mjs et les fiches d'exemple
// (inject-exemples-fiches.mjs) : bandeau d'action, galerie avec visionneuse,
// formules, déroulé en 3 étapes, villes couvertes, barre de contact fixée en
// bas sur téléphone. Les règles côté app sont dans
// jason-app/lib/pros/fiche-vitrine.ts (étapes par défaut vérifiées identiques
// par un test).

import { villeGuide } from './inject-ville-pros.mjs'
import { videoEmbed, videoHostLabel } from './pro-visuel.mjs'

export const PHOTOS_MAX = 6

export const DEFAULT_DEROULE = {
  photographe: [
    { titre: 'Tu m’envoies ta demande', texte: 'Ton logement, la ville et tes dates : je te réponds avec un devis.' },
    { titre: 'Le shooting', texte: 'Je photographie le logement préparé, à la meilleure lumière.' },
    { titre: 'La livraison', texte: 'Tu reçois tes photos retouchées, prêtes pour Airbnb et Booking.' },
  ],
  menage: [
    { titre: 'Tu m’envoies ta demande', texte: 'Ton logement, sa taille et le rythme des réservations : je te propose un tarif.' },
    { titre: 'Le premier passage', texte: 'On fait le point sur les clés, le linge et tes consignes.' },
    { titre: 'Les ménages entre deux voyageurs', texte: 'Je suis ton planning Airbnb et Booking et je te préviens quand c’est prêt.' },
  ],
}

const esc = s => s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const V2_RE = new RegExp(`^${UUID}/v2-${UUID}\\.jpg$`, 'i')

/**
 * Photos affichables (nouvelle forme seulement : grande image + vignette).
 * @returns {Array<{full: string, thumb: string}>}
 */
export function vitrinePhotos(paths, supabaseUrl, max = PHOTOS_MAX) {
  if (!Array.isArray(paths) || !supabaseUrl) return []
  const base = `${supabaseUrl}/storage/v1/object/public/pro-portfolio/`
  return paths.filter(p => typeof p === 'string' && V2_RE.test(p)).slice(0, max)
    .map(p => ({ full: base + p, thumb: base + p.replace(/\.jpg$/i, '-t.jpg') }))
}

/**
 * Sortie Supabase gratuite : 5 Go par mois. Les photos des fiches ont droit à
 * 2 Go. Au-delà (estimation : vues du mois × 6 vignettes de ~70 Ko), le build
 * n'affiche plus que la photo principale.
 */
export function photoLimitFromViews(monthViews, budget = 2 * 1024 ** 3) {
  return monthViews * PHOTOS_MAX * 70_000 > budget ? 1 : PHOTOS_MAX
}

function formatEuros(n) {
  return `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`
}

export function cleanSiteFormules(raw) {
  if (!Array.isArray(raw)) return []
  return raw.filter(f => f && typeof f.nom === 'string' && f.nom.trim()).slice(0, 3)
}

export function siteDeroule(raw, metier) {
  const ok = Array.isArray(raw) && raw.length === 3 && raw.every(e => e && typeof e.titre === 'string' && e.titre.trim())
  return ok ? raw : DEFAULT_DEROULE[metier]
}

// ── Morceaux de page ────────────────────────────────────────────────

/** Boutons du bandeau : contacter + photos (ou lien externe) */
export function heroActionsHtml({ firstName, hasPhotos, external, video }) {
  const third = video ? `<a href="${esc(video.href)}" target="_blank" rel="noopener noreferrer" class="vt-btn-o"><i class="ph-bold ${video.icon}"></i>${esc(video.label)}</a>` : ''
  const second = hasPhotos
    ? '<a href="#photos" class="vt-btn-o"><i class="ph-bold ph-images"></i>Voir les photos</a>'
    : external
      ? `<a href="${esc(external.href)}" target="_blank" rel="noopener noreferrer" class="vt-btn-o"${external.track ? ` onclick="jmTrack('${external.track}')"` : ''}><i class="ph-bold ${external.icon || 'ph-arrow-square-out'}"></i>${esc(external.label)}</a>`
      : ''
  return `<div class="vt-actions"><a href="#contact" class="vt-btn-y" data-vt-contact><i class="ph-bold ph-paper-plane-tilt"></i>Contacter ${esc(firstName)}</a>${second}${third}</div>`
}

/** Photo principale à droite du bandeau (ordinateur seulement) */
export function heroCoverHtml(photos, name) {
  if (!photos.length) return ''
  return `<button type="button" class="vt-cover" data-vt-open="0" aria-label="Agrandir la photo principale"><img src="${esc(photos[0].thumb)}" alt="Logement photographié par ${esc(name)}" width="640" height="480" fetchpriority="high"></button>`
}

/**
 * Vidéo du pro en haut à droite du bandeau (17/10/2026, demande de Jason) :
 * YouTube ou Vimeo se lit sur place, mais seulement après le clic (rien
 * n'est chargé chez YouTube avant : pas de cookie ni de requête tierce à
 * l'ouverture de la fiche). Affiche : la photo principale si elle existe.
 * Autre lien (chaîne, Instagram, TikTok) : pas de lecteur, un bouton.
 */
export function heroVideoHtml(videoUrl, { name, poster, credit } = {}) {
  const e = videoEmbed(videoUrl)
  if (!e) return ''
  const note = credit || (e.kind === 'file' ? '' : `Lecture sur ${e.kind === 'youtube' ? 'YouTube' : 'Vimeo'} au clic`)
  return `<div class="vt-video"><button type="button" class="vt-video-btn" data-vt-video="${esc(e.src)}"${e.kind === 'file' ? ' data-vt-file' : ''} aria-label="Lire la vidéo de ${esc(name)}"${poster ? ` style="background-image:url('${esc(poster)}')"` : ''}><span class="vt-play"><i class="ph-bold ph-play"></i></span><span class="vt-video-l">Voir la vidéo</span></button>${note ? `<p class="vt-video-n">${note}</p>` : ''}</div>`
}

/** Bouton « Voir mes vidéos » (lien qui ne se lit pas sur place) */
export function videoLink(videoUrl) {
  if (!videoUrl) return null
  const host = videoHostLabel(videoUrl)
  return { href: videoUrl, label: host ? `Voir les vidéos sur ${host}` : 'Voir les vidéos', short: 'Vidéos', icon: 'ph-play-circle', embed: !!videoEmbed(videoUrl) }
}

/** Galerie en mosaïque + visionneuse */
export function galleryHtml(photos, { name, title = 'Photos', annot = '' } = {}) {
  if (!photos.length) return ''
  const n = photos.length
  const shown = Math.min(n, 5)
  const tiles = photos.map((p, i) => {
    const more = i === 4 && n > 5 ? `<span class="vt-more">+${n - 5}</span>` : ''
    const hidden = i >= 5 ? ' hidden' : ''
    return `<button type="button" class="vt-ph" data-vt-open="${i}" data-vt-full="${esc(p.full)}"${hidden} aria-label="Agrandir la photo ${i + 1} sur ${n}"><img src="${esc(p.thumb)}" alt="Photo ${i + 1} sur ${n}, par ${esc(name)}" width="640" height="480"${i === 0 ? '' : ' loading="lazy"'}>${more}</button>`
  }).join('')
  return `<section class="card vt-sec" id="photos" style="position:relative">${annot}
  <div class="vt-h"><h2>${esc(title)}</h2><span class="vt-count">${n} photo${n > 1 ? 's' : ''}</span></div>
  <div class="vt-gal n${shown}">${tiles}</div>
</section>
<dialog class="vt-lb" id="vt-lb" aria-label="Photos en grand">
  <button type="button" class="vt-lb-x" data-vt-close aria-label="Fermer"><i class="ph-bold ph-x"></i></button>
  <button type="button" class="vt-lb-nav prev" data-vt-prev aria-label="Photo précédente"><i class="ph-bold ph-caret-left"></i></button>
  <img alt="">
  <button type="button" class="vt-lb-nav next" data-vt-next aria-label="Photo suivante"><i class="ph-bold ph-caret-right"></i></button>
  <div class="vt-lb-n"></div>
</dialog>`
}

/** Formules (3 au plus) */
export function formulesHtml(formules, { annot = '' } = {}) {
  const list = cleanSiteFormules(formules)
  if (!list.length) return ''
  return `<section class="card vt-sec" id="formules" style="position:relative">${annot}
  <h2>Formules</h2>
  <div class="vt-forms n${list.length}">${list.map((f, i) => `<div class="vt-form${i === 0 && list.length > 1 ? ' first' : ''}">
    <div class="vt-form-n">${esc(f.nom)}</div>
    <div class="vt-form-p">${typeof f.prix === 'number' && f.prix > 0 ? formatEuros(f.prix) : 'Sur devis'}</div>
    ${f.detail ? `<p>${esc(f.detail)}</p>` : ''}
  </div>`).join('')}</div>
  <p class="vt-note">Prix indicatifs : le devis final dépend de ton logement.</p>
</section>`
}

/** Comment ça se passe, en 3 étapes */
export function derouleHtml(deroule, metier, { annot = '' } = {}) {
  const steps = siteDeroule(deroule, metier)
  return `<section class="card vt-sec" style="position:relative">${annot}
  <h2>Comment ça se passe</h2>
  <ol class="vt-steps">${steps.map((s, i) => `<li><span class="vt-step-n">${i + 1}</span><div><strong>${esc(s.titre)}</strong>${s.texte ? `<p>${esc(s.texte)}</p>` : ''}</div></li>`).join('')}</ol>
</section>`
}

/** Villes couvertes : la ville principale d'abord, lien vers la page de la ville quand elle existe */
export function villesHtml(villes, { root, prefix, ville, metierLabel, annot = '' }) {
  const list = []
  const seen = new Set()
  for (const v of [ville, ...(Array.isArray(villes) ? villes : [])]) {
    const name = typeof v === 'string' ? v.trim() : ''
    const key = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (!name || seen.has(key)) continue
    seen.add(key)
    list.push(name)
  }
  if (list.length < 2) return ''
  const chips = list.slice(0, 11).map(name => {
    const g = root ? villeGuide(root, prefix, name) : null
    return g
      ? `<a class="vt-ville" href="${g.href}" title="${esc(metierLabel)} à ${esc(g.label)} : le guide"><i class="ph-bold ph-map-pin"></i>${esc(name)}</a>`
      : `<span class="vt-ville"><i class="ph-bold ph-map-pin"></i>${esc(name)}</span>`
  }).join('')
  return `<section class="card vt-sec" style="position:relative">${annot}
  <h2>Où j’interviens</h2>
  <div class="vt-villes">${chips}</div>
</section>`
}

/** Barre de contact fixée en bas de l'écran sur téléphone */
export function stickyBarHtml({ firstName, hasPhotos, external }) {
  const second = hasPhotos
    ? '<a href="#photos" class="vt-bar-s"><i class="ph-bold ph-images"></i>Photos</a>'
    : external
      ? `<a href="${esc(external.href)}" target="_blank" rel="noopener noreferrer" class="vt-bar-s"${external.track ? ` onclick="jmTrack('${external.track}')"` : ''}><i class="ph-bold ${external.icon || 'ph-arrow-square-out'}"></i>${esc(external.short || external.label)}</a>`
      : ''
  return `<div class="vt-bar" id="vt-bar" aria-hidden="true"><a href="#contact" class="vt-bar-p" data-vt-contact tabindex="-1"><i class="ph-bold ph-paper-plane-tilt"></i>Contacter ${esc(firstName)}</a>${second.replace('<a ', '<a tabindex="-1" ')}</div>`
}

export const VITRINE_CSS = `
.hero-grid{display:grid;grid-template-columns:1fr;gap:32px;align-items:center}
@media(min-width:900px){.hero-grid.has-cover{grid-template-columns:minmax(0,1fr) 400px}}
.vt-video{width:100%}
.vt-video-btn,.vt-video iframe,.vt-video video{position:relative;display:flex;align-items:center;justify-content:center;width:100%;aspect-ratio:16/9;border:0;border-radius:18px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.35);background:#00261e center/cover no-repeat;cursor:pointer;padding:0}
.vt-video-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,20,14,.15),rgba(0,20,14,.55))}
.vt-play{position:relative;width:68px;height:68px;border-radius:50%;background:#FFD56B;color:#003329;display:flex;align-items:center;justify-content:center;font-size:26px;box-shadow:0 8px 24px rgba(0,0,0,.35);transition:transform .2s}
.vt-video-btn:hover .vt-play{transform:scale(1.07)}
.vt-video-l{position:absolute;left:16px;bottom:14px;color:#fff;font-family:'Outfit',sans-serif;font-weight:600;font-size:14px;letter-spacing:.2px}
.vt-video-n{margin:8px 2px 0;font-size:11.5px;color:rgba(255,255,255,.5)}
.vt-video-n a{color:inherit}
.vt-video video{object-fit:cover;cursor:auto}
.vt-opts{display:flex;flex-wrap:wrap;gap:8px}
.vt-opt{display:inline-flex;align-items:center;gap:7px;padding:8px 13px;border-radius:999px;background:#F2F6F3;border:1px solid rgba(0,76,63,.12);color:var(--g);font-size:13px;font-weight:600}
.vt-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px}
.vt-btn-y,.vt-btn-o{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:'Outfit',sans-serif;font-weight:600;font-size:15px;padding:13px 22px;border-radius:10px;text-decoration:none;transition:background .15s,border-color .15s}
.vt-btn-y{background:#FFD56B;color:#003329}
@media(max-width:640px){.vt-actions a{flex:1 1 100%}}
.vt-btn-y:hover{background:#ffe08f}
.vt-btn-o{border:1px solid rgba(255,255,255,.3);color:#fff;background:rgba(255,255,255,.06)}
.vt-btn-o:hover{border-color:rgba(255,255,255,.6);background:rgba(255,255,255,.12)}
.vt-cover{display:none;padding:0;border:0;background:none;cursor:zoom-in;border-radius:18px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.35);aspect-ratio:4/3;width:100%}
.vt-cover img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s}
.vt-cover:hover img{transform:scale(1.03)}
@media(min-width:900px){.vt-cover{display:block}}
.vt-sec{margin-bottom:20px;scroll-margin-top:84px}
.vt-h{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.vt-count{font-size:12.5px;color:var(--tl)}
.vt-gal{display:grid;gap:8px;margin-top:4px}
.vt-ph{position:relative;padding:0;border:0;background:#EEF3EF;border-radius:12px;overflow:hidden;cursor:zoom-in;min-height:0}
.vt-ph[hidden]{display:none}
.vt-ph img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .35s}
.vt-ph:hover img{transform:scale(1.04)}
.vt-gal.n1{grid-template-columns:1fr}.vt-gal.n1 .vt-ph{aspect-ratio:16/9}
.vt-gal.n2{grid-template-columns:1fr 1fr}.vt-gal.n2 .vt-ph{aspect-ratio:4/3}
.vt-gal.n3,.vt-gal.n4,.vt-gal.n5{grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(2,minmax(0,150px))}
.vt-gal.n3 .vt-ph:first-child,.vt-gal.n4 .vt-ph:first-child,.vt-gal.n5 .vt-ph:first-child{grid-column:span 2;grid-row:span 2}
.vt-gal.n3 .vt-ph:not(:first-child){grid-column:span 2}
.vt-gal.n4 .vt-ph:nth-child(2){grid-column:span 2}
.vt-more{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,26,17,.55);color:#fff;font-family:'Fraunces',serif;font-size:26px}
@media(max-width:640px){
  .vt-gal.n2,.vt-gal.n3,.vt-gal.n4,.vt-gal.n5{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;grid-template-rows:none;margin:4px -24px 0;padding:0 24px 4px;scrollbar-width:none}
  .vt-gal::-webkit-scrollbar{display:none}
  .vt-gal.n2 .vt-ph,.vt-gal.n3 .vt-ph,.vt-gal.n4 .vt-ph,.vt-gal.n5 .vt-ph{flex:0 0 84%;aspect-ratio:4/3;scroll-snap-align:center}
  .vt-gal .vt-ph[hidden]{display:block}
  .vt-more{display:none}
}
.vt-lb{border:0;padding:0;background:transparent;max-width:100vw;max-height:100vh;width:100vw;height:100vh;margin:0}
.vt-lb::backdrop{background:rgba(0,12,8,.92)}
.vt-lb[open]{display:flex;align-items:center;justify-content:center}
.vt-lb img{max-width:min(92vw,1600px);max-height:84vh;object-fit:contain;border-radius:8px;display:block}
.vt-lb button{position:absolute;width:46px;height:46px;border-radius:50%;border:0;background:rgba(255,255,255,.12);color:#fff;font-size:20px;display:flex;align-items:center;justify-content:center;cursor:pointer}
.vt-lb button:hover{background:rgba(255,255,255,.24)}
.vt-lb-x{top:16px;right:16px}
.vt-lb-nav.prev{left:16px;top:50%;transform:translateY(-50%)}
.vt-lb-nav.next{right:16px;top:50%;transform:translateY(-50%)}
.vt-lb-n{position:absolute;bottom:18px;left:0;right:0;text-align:center;color:rgba(255,255,255,.75);font-size:13px}
.vt-forms{display:grid;gap:12px;margin-top:4px}
@media(min-width:640px){.vt-forms.n2{grid-template-columns:1fr 1fr}.vt-forms.n3{grid-template-columns:repeat(3,1fr)}}
.vt-form{border:1px solid var(--bd);border-radius:12px;padding:16px;background:#FCFBF8}
.vt-form.first{border:1px solid rgba(0,76,63,.28);background:rgba(0,76,63,.035)}
.vt-form-n{font-size:12px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--g)}
.vt-form-p{font-family:'Fraunces',serif;font-size:26px;color:var(--td);margin:4px 0 6px;line-height:1.1}
.vt-form p{font-size:13.5px;color:var(--tm);line-height:1.6;margin:0}
.vt-note{font-size:12px;color:var(--tl);margin-top:12px}
.vt-steps{list-style:none;display:grid;gap:14px;margin-top:6px}
@media(min-width:700px){.vt-steps{grid-template-columns:repeat(3,1fr)}}
.vt-steps li{display:flex;gap:12px;align-items:flex-start}
.vt-step-n{flex-shrink:0;width:30px;height:30px;border-radius:50%;background:var(--g);color:#FFD56B;font-family:'Fraunces',serif;font-size:15px;display:flex;align-items:center;justify-content:center}
.vt-steps strong{display:block;font-size:14.5px;color:var(--td);margin-top:4px}
.vt-steps p{font-size:13.5px;color:var(--tm);line-height:1.6;margin-top:4px}
.vt-villes{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
.vt-ville{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:999px;background:rgba(0,76,63,.05);border:1px solid rgba(0,76,63,.12);font-size:13.5px;color:var(--g);font-weight:500;text-decoration:none}
a.vt-ville:hover{background:var(--g);color:#fff;border-color:var(--g)}
#contact{scroll-margin-top:84px}
.vt-bar{display:none}
@media(max-width:840px){
  body{padding-bottom:84px}
  .vt-bar{display:flex;gap:8px;position:fixed;left:0;right:0;bottom:0;z-index:90;padding:10px 14px calc(10px + env(safe-area-inset-bottom));background:rgba(253,252,249,.96);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-top:1px solid rgba(0,76,63,.12);box-shadow:0 -8px 24px rgba(0,26,17,.08);transform:translateY(110%);transition:transform .25s ease}
  .vt-bar.on{transform:none}
  .vt-bar a{display:inline-flex;align-items:center;justify-content:center;gap:7px;border-radius:10px;font-weight:600;font-size:15px;text-decoration:none;padding:13px 14px;font-family:'Outfit',sans-serif}
  .vt-bar-p{flex:1;background:#FFD56B;color:#003329}
  .vt-bar-s{border:1px solid rgba(0,76,63,.22);color:var(--g);background:#fff}
}`

/** Visionneuse, barre fixée en bas, défilement doux vers le formulaire */
export const VITRINE_JS = `<script>
(function(){
  var d=document.getElementById('vt-lb');
  var items=[].slice.call(document.querySelectorAll('[data-vt-full]'));
  var i=0;
  function show(k){if(!d||!items.length)return;i=(k+items.length)%items.length;var im=d.querySelector('img');im.src=items[i].getAttribute('data-vt-full');var t=items[i].querySelector('img');im.alt=t?t.alt:'';d.querySelector('.vt-lb-n').textContent=(i+1)+' / '+items.length}
  document.addEventListener('click',function(e){
    var o=e.target.closest&&e.target.closest('[data-vt-open]');
    if(o&&d&&items.length){e.preventDefault();show(+o.getAttribute('data-vt-open'));if(d.showModal)d.showModal();else d.setAttribute('open','');return}
    if(!d)return;
    if(e.target.closest('[data-vt-close]')||e.target===d)d.close();
    else if(e.target.closest('[data-vt-prev]'))show(i-1);
    else if(e.target.closest('[data-vt-next]'))show(i+1);
  });
  document.addEventListener('click',function(e){
    var v=e.target.closest&&e.target.closest('[data-vt-video]');
    if(!v)return;
    var f;
    if(v.hasAttribute('data-vt-file')){f=document.createElement('video');f.src=v.getAttribute('data-vt-video');f.controls=true;f.autoplay=true;f.muted=true;f.loop=true;f.playsInline=true}
    else{f=document.createElement('iframe');f.src=v.getAttribute('data-vt-video');f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';f.allowFullscreen=true}
    f.title=v.getAttribute('aria-label')||'Vidéo';
    v.replaceWith(f);
  });
  document.addEventListener('keydown',function(e){if(!d||!d.open)return;if(e.key==='ArrowLeft')show(i-1);if(e.key==='ArrowRight')show(i+1)});
  document.addEventListener('click',function(e){
    var c=e.target.closest&&e.target.closest('[data-vt-contact]');
    var t=document.getElementById('contact');
    if(!c||!t)return;
    e.preventDefault();
    t.scrollIntoView({behavior:'smooth',block:'start'});
    var f=t.querySelector('input:not([type=hidden]):not([tabindex="-1"]),textarea');
    if(f)setTimeout(function(){try{f.focus({preventScroll:true})}catch(x){}},450);
  });
  var bar=document.getElementById('vt-bar'),hero=document.querySelector('.hero'),ct=document.getElementById('contact');
  if(bar&&hero&&'IntersectionObserver' in window){
    var pastHero=false,seeContact=false;
    function upd(){var on=pastHero&&!seeContact;bar.classList.toggle('on',on);bar.setAttribute('aria-hidden',on?'false':'true');[].forEach.call(bar.querySelectorAll('a'),function(a){a.tabIndex=on?0:-1})}
    new IntersectionObserver(function(es){pastHero=!es[0].isIntersecting;upd()}).observe(hero);
    if(ct)new IntersectionObserver(function(es){seeContact=es[0].isIntersecting;upd()},{threshold:.15}).observe(ct);
  }
})();
</script>`
