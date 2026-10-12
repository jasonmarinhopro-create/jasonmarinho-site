// Annuaires des photographes et des équipes de ménage, pensés pour l'HÔTE
// (12/10/2026, Jason : « dans l'annuaire on doit être à la place d'un hôte »).
// Morceaux partagés par build-photographers.mjs et build-cleaners.mjs : titre
// fixe (plus de compteur ni de « sélectionné »), recherche par ville avec les
// villes où il y a des pros, guide pour choisir, FAQ (HTML + JSON-LD), guides
// par ville avec les villes couvertes en tête, lien discret pour les pros.
// Aucune donnée chiffrée inventée : les tarifs viennent des fiches et des guides
// de ville ; la FAQ ne contient que des conseils et des faits vérifiables.

import fs from 'node:fs'
import { villePageSlug, villeLabel } from './inject-ville-pros.mjs'

const esc = s => s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

export const ANNUAIRES = {
  photographe: {
    prefix: 'photographe-lcd',
    one: 'photographe', many: 'photographes', unOne: 'un photographe',
    title: 'Photographe Airbnb : trouve un pro près de chez toi',
    desc: 'Photographes spécialisés Airbnb et location courte durée : photos, formules, villes couvertes. Contacte-les directement, sans commission.',
    h1: 'Un photographe <em>pour ton annonce</em>',
    lead: 'Des photographes qui connaissent la location courte durée : regarde leurs photos, leurs formules et les villes où ils se déplacent, puis écris-leur directement. Sans commission, sans intermédiaire.',
    icon: 'ph-camera',
    questions: [
      ['As-tu déjà photographié des locations Airbnb ou Booking ?', 'Demande 2 ou 3 annonces en ligne prises par le photographe : c’est la meilleure preuve.'],
      ['Combien de photos, livrées en combien de temps ?', 'Le nombre de photos retouchées et le délai de livraison doivent être écrits sur le devis.'],
      ['Les formats sont-ils prêts pour les plateformes ?', 'Format paysage pour Airbnb et Booking, et une photo de couverture qui reste lisible en petit.'],
      ['Que se passe-t-il s’il pleut ou si la lumière est mauvaise ?', 'Un bon photographe propose de décaler la séance ou de revenir pour l’extérieur.'],
      ['Peux-tu réutiliser les photos partout ?', 'Annonces, site de réservation directe, réseaux : vérifie que les droits d’utilisation te sont cédés.'],
    ],
    prepare: [
      'Lits faits au carré, linge neutre et repassé',
      'Plans de travail dégagés, objets personnels rangés',
      'Toutes les lumières allumées, volets ouverts',
      'Petites touches de déco : plante, bouquet, livre, plateau',
      'Extérieur balayé, voitures hors du champ',
    ],
    articles: [
      ['/blog/photographe-airbnb-tarifs-comment-choisir', 'Photographe Airbnb : tarifs et comment choisir'],
      ['/blog/photo-couverture-airbnb-7-criteres-algo-computer-vision', 'La photo de couverture : 7 critères'],
      ['/blog/photographier-logement-location-courte-duree-smartphone', 'Photographier ton logement au smartphone'],
    ],
    faq: [
      ['Combien coûte un photographe pour une annonce Airbnb ?', 'Chaque photographe fixe ses tarifs selon la taille du logement, le nombre de photos et les options (drone, vidéo). Les fiches affichent leurs formules ou leur fourchette de prix, et les guides par ville donnent les fourchettes constatées localement.'],
      ['Jason Marinho prend-il une commission ?', 'Non. Tu contactes le photographe depuis sa fiche, et le devis, la séance et le paiement se règlent directement entre vous.'],
      ['Comment savoir si un photographe est sérieux ?', 'Chaque fiche est remplie par le photographe lui-même. Regarde ses photos et son portfolio, demande un devis écrit, et vérifie son entreprise gratuitement sur annuaire-entreprises.data.gouv.fr.'],
      ['Comment le contacter ?', 'Avec le formulaire de sa fiche : ton message arrive directement dans sa boîte mail et il te répond lui-même.'],
      ['Il n’y a pas encore de photographe dans ma ville, que faire ?', 'Regarde le guide de ta ville ci-dessous (tarifs locaux, photos indispensables, comment briefer), et repasse : l’annuaire grandit chaque semaine.'],
    ],
    join: ['/devenir-photographe-lcd', 'Tu es photographe ? Rejoins l’annuaire'],
  },
  menage: {
    prefix: 'menage-lcd',
    one: 'équipe', many: 'équipes', unOne: 'une équipe de ménage',
    title: 'Ménage Airbnb : trouve une équipe près de chez toi',
    desc: 'Équipes de ménage spécialisées Airbnb et location courte durée : formules, prestations, villes couvertes. Contacte-les directement, sans commission.',
    h1: 'Une équipe de ménage <em>entre deux voyageurs</em>',
    lead: 'Des équipes qui connaissent le ménage entre deux séjours : regarde leurs formules, leurs prestations et les villes où elles interviennent, puis écris-leur directement. Sans commission, sans intermédiaire.',
    icon: 'ph-sparkle',
    questions: [
      ['Faites-vous déjà des ménages entre deux voyageurs ?', 'Le ménage de location courte durée a ses règles : délai serré, linge, vérification du logement.'],
      ['Le linge est-il compris ?', 'Draps et serviettes fournis, lavés, ou à ta charge : c’est souvent la plus grosse différence de prix.'],
      ['Êtes-vous disponibles le jour même ?', 'Départ à 11 h et arrivée à 16 h : demande comment l’équipe gère ces journées serrées, week-ends compris.'],
      ['Avez-vous une assurance responsabilité civile pro ?', 'Demande l’attestation avant de confier tes clés : elle te couvre en cas de casse.'],
      ['Comment me prévenez-vous quand c’est prêt ?', 'Une photo de fin de ménage ou un message à chaque passage évite les mauvaises surprises.'],
    ],
    prepare: [
      'Une checklist écrite, pièce par pièce',
      'Un stock de linge et de consommables sur place',
      'Un accès simple : boîte à clés ou serrure à code',
      'Ton planning de réservations partagé avec l’équipe',
      'Un tarif clair : par ménage, linge et consommables compris ou non',
    ],
    articles: [
      ['/blog/trouver-equipe-menage-airbnb-fiable', 'Trouver une équipe de ménage fiable'],
      ['/blog/checklist-menage-professionnelle-location-courte-duree', 'La checklist de ménage pièce par pièce'],
      ['/blog/frais-menage-airbnb-combien-facturer-2026', 'Frais de ménage Airbnb : combien facturer'],
    ],
    faq: [
      ['Combien coûte un ménage entre deux voyageurs ?', 'Chaque équipe fixe ses tarifs selon la surface, le linge et les prestations. Les fiches affichent leurs formules ou leur forfait, et les guides par ville donnent les fourchettes constatées localement.'],
      ['Jason Marinho prend-il une commission ?', 'Non. Tu contactes l’équipe depuis sa fiche, et le devis, les passages et le paiement se règlent directement entre vous.'],
      ['Comment savoir si une équipe est sérieuse ?', 'Chaque fiche est remplie par l’équipe elle-même. Demande un devis écrit et l’attestation d’assurance, et vérifie l’entreprise gratuitement sur annuaire-entreprises.data.gouv.fr.'],
      ['Comment partager mes réservations avec l’équipe ?', 'Avec l’app Jason Marinho (gratuite pour commencer) : les ménages sont calculés depuis tes calendriers Airbnb et Booking, et l’équipe les voit avec un simple lien.'],
      ['Il n’y a pas encore d’équipe dans ma ville, que faire ?', 'Regarde le guide de ta ville ci-dessous (tarifs locaux, checklist, questions à poser), et repasse : l’annuaire grandit chaque semaine.'],
    ],
    join: ['/devenir-prestataire-menage-lcd', 'Tu fais du ménage de location courte durée ? Rejoins l’annuaire'],
  },
}

/** Pages de ville du métier (slug) déduites du dossier du site */
function citySlugs(root, prefix) {
  return fs.readdirSync(root).filter(d => d.startsWith(`${prefix}-`)).map(d => d.slice(prefix.length + 1))
}

/**
 * Villes de pages couvertes par chaque pro (ville principale, zone, villes couvertes).
 * @returns {{ byPro: Map<string, Set<string>>, counts: Map<string, number> }}
 */
export function cityCoverage(root, prefix, items) {
  const slugs = citySlugs(root, prefix)
  const byPro = new Map()
  const counts = new Map()
  for (const p of items) {
    const set = new Set()
    const main = villePageSlug(p.ville, slugs, p.zone_couverte)
    if (main) set.add(main)
    for (const v of Array.isArray(p.villes_couvertes) ? p.villes_couvertes : []) {
      const s = villePageSlug(v, slugs)
      if (s) set.add(s)
    }
    byPro.set(p.id, set)
    for (const s of set) counts.set(s, (counts.get(s) ?? 0) + 1)
  }
  return { byPro, counts }
}

/** Texte de recherche d'un pro : ville, zone, villes couvertes et noms des pages de ville */
export function searchWords(p, coveredSlugs) {
  return [p.ville, p.zone_couverte, ...(Array.isArray(p.villes_couvertes) ? p.villes_couvertes : []), ...[...(coveredSlugs ?? [])].map(villeLabel)].filter(Boolean).join(' ')
}

/** Prix « dès » : formule la moins chère, sinon le tarif minimum */
export function prixDes(formules, fallback) {
  const prices = (Array.isArray(formules) ? formules : []).map(f => Number(f?.prix)).filter(n => Number.isFinite(n) && n > 0)
  const n = prices.length ? Math.min(...prices) : Number(fallback)
  return Number.isFinite(n) && n > 0 ? `dès ${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €` : null
}

export function heroInnerHtml(cfg, breadcrumb) {
  return `<div class="brd">${breadcrumb}</div>
    <span class="lbl">Annuaire · contact direct, sans commission</span>
    <h1>${cfg.h1}</h1>
    <p class="lead">${esc(cfg.lead)}</p>`
}

/** Raccourcis « Villes avec un photographe » sous la recherche */
export function cityPicksHtml(cfg, counts) {
  const list = [...counts.entries()].sort((a, b) => b[1] - a[1] || villeLabel(a[0]).localeCompare(villeLabel(b[0]), 'fr')).slice(0, 12)
  if (!list.length) return ''
  return `<div class="city-picks"><span class="city-picks-l">${cfg.many.charAt(0).toUpperCase() + cfg.many.slice(1)} à :</span>${list.map(([slug, n]) =>
    `<button type="button" class="city-pick" data-city="${esc(villeLabel(slug))}">${esc(villeLabel(slug))} <span>${n}</span></button>`).join('')}</div>`
}

/** État vide (aucun pro) côté hôte */
export function emptyHtml(cfg) {
  return `<div class="empty"><div class="empty-ico"><i class="ph-bold ${cfg.icon}" style="font-size:32px;color:var(--g)"></i></div><h2>Les premiers ${esc(cfg.many)} arrivent</h2><p>L’annuaire vient d’ouvrir. En attendant, le guide de ta ville (plus bas) te donne les tarifs constatés et les questions à poser avant de choisir.</p><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><a href="#villes" class="btn-p">Voir le guide de ma ville</a><a href="${cfg.articles[0][0]}" class="btn-p" style="background:transparent;border:1px solid rgba(0,76,63,.25);color:var(--g)">${esc(cfg.articles[0][1])}</a></div></div>`
}

/** Guide pour choisir + préparer, et articles */
export function guideHtml(cfg) {
  return `<section class="guide-section" id="choisir">
  <div class="guide-grid">
    <div class="guide-card">
      <h2 class="guide-h">Les 5 questions à poser <em>avant de choisir</em></h2>
      <ol class="guide-q">${cfg.questions.map(([q, a], i) => `<li><span class="guide-n">${i + 1}</span><div><strong>${esc(q)}</strong><p>${esc(a)}</p></div></li>`).join('')}</ol>
    </div>
    <div class="guide-side">
      <div class="guide-card">
        <h2 class="guide-h">${cfg.one === 'photographe' ? 'Prépare ton logement <em>avant la séance</em>' : 'Ce qui facilite <em>le travail de l’équipe</em>'}</h2>
        <ul class="guide-list">${cfg.prepare.map(t => `<li><i class="ph-bold ph-check-circle"></i>${esc(t)}</li>`).join('')}</ul>
      </div>
      <div class="guide-card">
        <h2 class="guide-h">À lire <em>pour bien choisir</em></h2>
        <div class="guide-links">${cfg.articles.map(([href, label]) => `<a href="${href}"><i class="ph-bold ph-article"></i>${esc(label)}<i class="ph-bold ph-arrow-right"></i></a>`).join('')}</div>
      </div>
    </div>
  </div>
</section>`
}

export function faqHtml(cfg) {
  return `<section class="faq-section" id="faq">
  <h2 class="guide-h" style="text-align:center;margin-bottom:18px">Questions <em>fréquentes</em></h2>
  ${cfg.faq.map(([q, a]) => `<details class="faq-it"><summary>${esc(q)}<i class="ph-bold ph-caret-down"></i></summary><p>${esc(a)}</p></details>`).join('\n  ')}
</section>`
}

export function faqJsonLd(cfg) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: cfg.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  })
}

/** Guides par ville : les villes où il y a des pros en tête, avec leur nombre */
export function villesGuidesHtml(cfg, cities, counts) {
  if (!cities.length) return ''
  const label = cfg.one === 'photographe' ? 'photographe' : 'ménage'
  const sorted = [...cities].sort((a, b) => (counts.get(b.slug) ?? 0) - (counts.get(a.slug) ?? 0))
  const chips = sorted.map(c => {
    const n = counts.get(c.slug) ?? 0
    return `<a href="/${cfg.prefix}-${c.slug}"${n ? ' class="has"' : ''}>${esc(c.name)}${n ? ` <span>${n} ${n > 1 ? esc(cfg.many) : esc(cfg.one)}</span>` : ''}</a>`
  }).join('')
  return `<section class="villes-section" id="villes">
  <div class="villes-in">
    <h2 class="villes-h">Guide ${label} <em>de ta ville</em></h2>
    <p class="villes-p">Tarifs constatés, checklist et questions à poser, ville par ville. Les villes en vert ont déjà des ${esc(cfg.many)} dans l’annuaire.</p>
    <div class="villes-chips">${chips}</div>
  </div>
</section>`
}

export function joinLineHtml(cfg) {
  return `<p class="join-line"><a href="${cfg.join[0]}">${esc(cfg.join[1])} <i class="ph-bold ph-arrow-right"></i></a></p>`
}

export const ANNUAIRE_CSS = `
.city-picks{max-width:820px;margin:14px auto 0;padding:0 clamp(16px,5vw,40px);display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.city-picks-l{font-size:12.5px;color:var(--tl);margin-right:4px}
.city-pick{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;border:1px solid rgba(0,76,63,.15);background:#fff;color:var(--g);font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;cursor:pointer}
.city-pick span{font-size:11px;background:rgba(0,76,63,.08);border-radius:999px;padding:1px 7px}
.city-pick:hover,.city-pick.on{background:var(--g);color:#fff;border-color:var(--g)}
.city-pick:hover span,.city-pick.on span{background:rgba(255,255,255,.2)}
.card{padding:0;gap:0;overflow:hidden}
.card-photo{aspect-ratio:16/10;background:#EEF3EF;overflow:hidden}
.card-photo img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s}
.card:hover .card-photo img{transform:scale(1.04)}
.card-photo.empty{display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#EAF3EE,#F4F8F5);color:rgba(0,76,63,.35);font-size:38px}
.card-body{display:flex;flex-direction:column;gap:12px;padding:20px 22px 22px;flex:1}
.card-villes{font-size:12.5px;color:var(--tm);line-height:1.55;display:flex;gap:6px;align-items:flex-start}
.card-villes i{color:var(--g);margin-top:2px}
.guide-section{max-width:1100px;margin:40px auto 0;padding:0 clamp(16px,5vw,40px)}
.guide-grid{display:grid;gap:18px}
@media(min-width:900px){.guide-grid{grid-template-columns:minmax(0,1.25fr) minmax(0,1fr)}}
.guide-side{display:flex;flex-direction:column;gap:18px}
.guide-card{padding:26px;background:#fff;border:1px solid var(--bd);border-radius:16px}
.guide-h{font-family:'Fraunces',serif;font-size:20px;font-weight:400;color:var(--td);margin:0 0 14px;letter-spacing:-.2px;line-height:1.3}
.guide-h em{color:var(--g);font-style:italic;font-weight:300}
.guide-q{list-style:none;display:flex;flex-direction:column;gap:14px}
.guide-q li{display:flex;gap:12px;align-items:flex-start}
.guide-n{flex-shrink:0;width:28px;height:28px;border-radius:50%;background:var(--g);color:#FFD56B;font-family:'Fraunces',serif;font-size:14px;display:flex;align-items:center;justify-content:center}
.guide-q strong{display:block;font-size:14.5px;color:var(--td);margin-top:3px}
.guide-q p{font-size:13.5px;color:var(--tm);line-height:1.6;margin-top:3px}
.guide-list{list-style:none;display:flex;flex-direction:column;gap:9px}
.guide-list li{display:flex;gap:9px;align-items:flex-start;font-size:14px;color:var(--tm);line-height:1.5}
.guide-list i{color:#1e9d54;font-size:16px;margin-top:1px;flex-shrink:0}
.guide-links{display:flex;flex-direction:column;gap:8px}
.guide-links a{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:10px;background:rgba(0,76,63,.04);border:1px solid rgba(0,76,63,.08);color:var(--td);font-size:13.5px;font-weight:500;text-decoration:none}
.guide-links a i:first-child{color:var(--g)}
.guide-links a i:last-child{margin-left:auto;color:var(--g)}
.guide-links a:hover{border-color:rgba(0,76,63,.25);background:rgba(0,76,63,.07)}
.faq-section{max-width:800px;margin:40px auto 0;padding:0 clamp(16px,5vw,40px)}
.faq-it{background:#fff;border:1px solid var(--bd);border-radius:12px;padding:16px 18px;margin-bottom:10px}
.faq-it summary{list-style:none;cursor:pointer;font-weight:600;font-size:14.5px;color:var(--td);display:flex;justify-content:space-between;gap:12px;align-items:center}
.faq-it summary::-webkit-details-marker{display:none}
.faq-it summary i{color:var(--g);transition:transform .2s;flex-shrink:0}
.faq-it[open] summary i{transform:rotate(180deg)}
.faq-it p{font-size:14px;color:var(--tm);line-height:1.7;margin-top:10px}
.villes-chips a.has{background:rgba(0,76,63,.09);color:var(--g);font-weight:600;border-color:rgba(0,76,63,.2)}
.villes-chips a span{font-size:11px;font-weight:600;opacity:.8}
.join-line{max-width:1100px;margin:18px auto 0;padding:0 clamp(16px,5vw,40px);text-align:center}
.join-line a{font-size:13.5px;color:var(--g);font-weight:600;text-decoration:none}
.join-line a:hover{text-decoration:underline}
`

/** Raccourcis de ville : remplissent la recherche */
export const CITY_PICKS_JS = `<script>
(function(){
  var input=document.getElementById('pro-search');
  if(!input)return;
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('.city-pick');
    if(!b)return;
    var on=b.classList.contains('on');
    [].forEach.call(document.querySelectorAll('.city-pick'),function(x){x.classList.remove('on')});
    input.value=on?'':b.getAttribute('data-city');
    if(!on)b.classList.add('on');
    input.dispatchEvent(new Event('input'));
  });
  input.addEventListener('input',function(){[].forEach.call(document.querySelectorAll('.city-pick'),function(x){if(x.getAttribute('data-city')!==input.value)x.classList.remove('on')})});
})();
</script>`
