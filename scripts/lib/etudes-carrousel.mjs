// Études de revenus par ville sur /services/simulateurs (10/11/2026, Jason :
// « des carrousels et des belles images à la place de ce truc affreux »).
// Une carte photo par ville (photo de la ville, revenu d'un T2 calculé par le
// moteur, région ou pays), filtres Toutes / France / Europe, flèches.
// Injecté par scripts/build-footer.mjs (marqueur ETUDES). Tous les liens sont
// dans le HTML (lisibles par Google sans JavaScript).
import { villesRegistre } from './registre-geo.mjs'
import { aPhoto, creditPhoto, PHOTOS_COMMONS } from '../data/photos-villes.mjs'
import { CITIES, etudeUrl, loadEngine } from '../generate-city-revenue-articles.mjs'

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const eur = n => `${Math.round(n).toLocaleString('fr-FR').replace(/[  ]/g, ' ')} €`
// Les plus recherchées d'abord, puis les autres par revenu
const EN_TETE = ['paris', 'lyon', 'bordeaux', 'nice', 'marseille', 'annecy', 'biarritz', 'saint-malo', 'lisbonne', 'rome', 'madrid', 'amsterdam']

export function etudesCarrouselHtml() {
  const J = loadEngine()
  const byUrl = new Map(CITIES.map(c => [etudeUrl(c), c]))
  const villes = villesRegistre().filter(v => v.pages.revenus).map(v => {
    const c = byUrl.get(v.pages.revenus)
    const r = c ? J.estimateRevenue({ pays: c.pays, ville: c.ville, typeLogement: 't2', nbChambres: 1, mode: 'toute-annee' }) : null
    return { v, rev: r?.revenuAnnuel ?? 0, occ: r?.occupation ?? 0, fr: v.pays === 'FR' }
  })
  const rang = x => { const i = EN_TETE.indexOf(x.v.slug); return i < 0 ? 99 : i }
  villes.sort((a, b) => (rang(a) - rang(b)) || ((aPhoto(b.v.slug) ? 1 : 0) - (aPhoto(a.v.slug) ? 1 : 0)) || (b.rev - a.rev))
  const nFr = villes.filter(x => x.fr).length
  const carte = x => {
    const { v } = x
    const lieu = x.fr ? v.region?.nom : v.paysNom
    const media = aPhoto(v.slug)
      ? `<img src="/img/villes/${v.slug}.webp" alt="${esc(v.nom)}" width="560" height="700" loading="lazy" decoding="async">`
      : `<span class="ec-ph" aria-hidden="true"><span>${esc(v.nom.charAt(0))}</span></span>`
    return `<a class="ec-card" href="${v.pages.revenus}" data-z="${x.fr ? 'fr' : 'eu'}">${media}<span class="ec-shade"></span>`
      + (x.rev ? `<span class="ec-badge">T2 : ${eur(x.rev)} par an</span>` : '')
      + `<span class="ec-txt">${lieu ? `<span class="ec-reg">${esc(lieu)}</span>` : ''}<span class="ec-name">${esc(v.nom)}</span>`
      + `<span class="ec-go">${x.occ ? `${x.occ} % d'occupation · ` : ''}Voir l'étude <i class="ph-bold ph-arrow-right"></i></span></span></a>`
  }
  const commons = villes.filter(x => PHOTOS_COMMONS[x.v.slug] && aPhoto(x.v.slug))
  return `<div class="ec" id="etudes">
  <div class="ec-bar">
    <div class="ec-f" role="group" aria-label="Filtrer les villes">
      <button type="button" class="on" data-f="all" aria-pressed="true">Toutes <small>${villes.length}</small></button>
      <button type="button" data-f="fr" aria-pressed="false">France <small>${nFr}</small></button>
      <button type="button" data-f="eu" aria-pressed="false">Europe <small>${villes.length - nFr}</small></button>
    </div>
    <div class="ec-arrows"><button type="button" class="ec-btn" data-d="-1" aria-label="Villes précédentes" disabled><i class="ph-bold ph-caret-left"></i></button><button type="button" class="ec-btn" data-d="1" aria-label="Villes suivantes"><i class="ph-bold ph-caret-right"></i></button></div>
  </div>
  <div class="ec-track">
    ${villes.map(carte).join('\n    ')}
  </div>
  <details class="ec-credit"><summary>Revenus bruts d'un T2 loué toute l'année, mêmes calculs que l'estimateur. Photos : Pexels et Wikimedia Commons <span>(crédits)</span> <i class="ph-bold ph-caret-down"></i></summary><p><a href="https://www.pexels.com/license/" target="_blank" rel="noopener">Pexels</a>, licence gratuite${commons.length ? ` ; ${commons.map(x => `${esc(x.v.nom)} : ${creditPhoto(x.v.slug)}`).join(' · ')}` : ''}.</p></details>
</div>
<script>
(function () {
  var s = document.getElementById('etudes'); if (!s) return
  var t = s.querySelector('.ec-track'), b = s.querySelectorAll('.ec-btn'), f = s.querySelectorAll('.ec-f button')
  function u () { b[0].disabled = t.scrollLeft < 4; b[1].disabled = t.scrollLeft + t.clientWidth >= t.scrollWidth - 4 }
  b.forEach(function (x) { x.addEventListener('click', function () { t.scrollBy({ left: +x.dataset.d * t.clientWidth * 0.85, behavior: 'smooth' }) }) })
  f.forEach(function (x) {
    x.addEventListener('click', function () {
      f.forEach(function (y) { y.classList.toggle('on', y === x); y.setAttribute('aria-pressed', String(y === x)) })
      var z = x.dataset.f
      t.querySelectorAll('.ec-card').forEach(function (c) { c.hidden = z !== 'all' && c.dataset.z !== z })
      t.scrollLeft = 0; u()
    })
  })
  t.addEventListener('scroll', u, { passive: true }); addEventListener('resize', u); u()
})()
</script>`
}
