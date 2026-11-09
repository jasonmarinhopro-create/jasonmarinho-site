// Pied de page du site (étape 4 de la feuille de route « géographie, pied de
// page et fil d'Ariane », 09/11/2026). Source unique du HTML du pied de page :
// - écrit dans les pages au déploiement (scripts/build-footer.mjs --inject),
//   pour que Google voie tous les liens sans exécuter de JavaScript ;
// - recopié dans footer.js (marqueurs FOOTER_HTML), en secours pour une page
//   qui n'aurait pas reçu la version écrite.
// Villes et études de revenus : registre géographique (scripts/data/registre-geo.mjs).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { villesRegistre } from './registre-geo.mjs'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// ── Colonnes (inchangées depuis footer.js) ───────────────────────────
const COLONNES = [
  { titre: 'Plateforme hôte', liens: [
    ['/services/contrats', 'Contrats & paiements'], ['/services/planning-menage', 'Planning ménage'],
    ['/services/declarations-voyageurs', 'Déclarations voyageurs'], ['/services/calendrier', 'Calendrier & check-list'],
    ['/services/performances', 'Performances LCD'], ['/services/carnet-voyageurs', 'Carnet voyageurs'],
    ['/services/securite', 'Vérification voyageurs'], ['/services/simulateurs', 'Simulateurs & calculateurs'],
    ['/investir-lcd', 'Investir en LCD'],
  ], plus: ['/services', 'Tous les services →'] },
  { titre: 'Annuaires pros', liens: [
    ['/annuaires/photographes', 'Photographes et vidéastes LCD'], ['/annuaires/menage', 'Annuaire équipes de ménage'],
    ['/annuaires/depannage', 'Dépannage et maintenance'], ['/devenir-photographe-lcd', 'Devenir photographe ou vidéaste'],
    ['/devenir-prestataire-menage-lcd', 'Devenir prestataire ménage'], ['/pour-qui/depannage', 'Rejoindre le dépannage'],
    ['/chiffres', 'La visibilité en chiffres'],
  ], plus: ['https://app.jasonmarinho.com/ouverture', 'Mon espace pro →'] },
  { titre: 'Ressources', liens: [
    ['/blog', 'Blog LCD'], ['/services/guides-lcd', 'Guides LCD'], ['/services/formations', 'Formations'],
    ['/services/actualites', 'Actualités LCD'], ['/services/entre-hotes', 'Questions & réponses'], ['/lexique-lcd', 'Lexique LCD'],
    ['/partenaires', 'Partenaires'], ['/sos-hote', 'SOS Hôte (urgences)'],
  ] },
  { titre: 'Entreprise', liens: [
    ['/qui-suis-je', 'Qui suis-je'], ['/tarifs', 'Tarifs'], ['/contact', 'Contact'],
    ['https://driing.co', 'Driing', 'ext'], ['https://app.jasonmarinho.com', 'Espace membre'],
    ['https://app.jasonmarinho.com/installer', "Installer l'app"],
  ] },
]

const COMPARATIFS = [
  ['/comparatif-airdna-mashvisor', 'AirDNA vs Mashvisor'], ['/comparatif-driing-airbnb-booking', 'Driing vs Airbnb vs Booking'],
  ['/comparatif-hostfully-guesty', 'Hostfully vs Guesty'], ['/comparatif-hostfully-guidebook-driing-touchstay', 'Guidebook vs Driing vs Touch Stay'],
  ['/comparatif-igloohome-ttlock', 'igloohome vs TTLock'], ['/comparatif-indy-tiime-henrri', 'Indy vs Tiime vs Henrri'],
  ['/comparatif-lodgify-smoobu', 'Lodgify vs Smoobu'], ['/lodgify-avis', 'Lodgify : avis 2026'], ['/lodgify-prix', 'Lodgify : prix 2026'],
  ['/code-promo-lodgify', 'Code promo Lodgify'], ['/partenaires/brevo', 'Brevo : newsletter et CRM'],
  ['/partenaires/airdna', 'AirDNA : étude de marché'], ['/partenaires/shine', 'Shine : compte pro et factures'],
  ['/partenaires/qonto', 'Qonto : compte pro en ligne'], ['/partenaires/jd2m', 'JD2M : comptable LMNP'],
  ['/partenaires/keobiz', 'Keobiz : expert-comptable'], ['/partenaires/sport-decouverte', 'Sport Découverte : activités'],
  ['/comparatif-matterport-cubicasa', 'Matterport vs CubiCasa'], ['/comparatif-pricelabs-beyond-wheelhouse', 'PriceLabs vs Beyond vs Wheelhouse'],
  ['/comparatif-ring-eufy-reolink', 'Ring vs Eufy vs Reolink'], ['/comparatif-smoobu-hospitable', 'Smoobu vs Hospitable'],
  ['/hospitable-avis', 'Hospitable : avis 2026'], ['/comparatif-superhote-welkeys', 'Superhote vs Welkeys'],
  ['/comparatif-turnoverbnb-properly', 'Turno vs Properly'], ['/comparatif-welkeys-guestready', 'Welkeys vs GuestReady'],
]

// ── Onglets : titre et phrase propres (validés par Jason dans la feuille de route) ──
export const PANELS = [
  { key: 'revenus', tab: 'Études de revenus', titre: 'Combien rapporte la LCD <em>dans ta ville</em>',
    hint: 'Prix moyen par nuit, taux d’occupation et revenu net estimé, ville par ville.',
    kind: 'revenus', all: ['/calculateurs', n => `Les ${n} études de revenus`] },
  { key: 'hote', tab: 'Devenir hôte', titre: 'Devenir hôte <em>près de chez toi</em>',
    hint: 'Réglementation locale, numéro d’enregistrement, taxe de séjour officielle et saisons : le guide pour démarrer en règle dans ta ville.',
    kind: 'hote', all: ['/villes', n => `Les ${n} guides hôte par ville`] },
  { key: 'photographes', tab: 'Photographes & vidéastes', titre: 'Trouver un photographe <em>près de chez toi</em>',
    hint: 'Des photographes et vidéastes qui connaissent la location courte durée : tarifs locaux, conseils pour ton annonce, demande de devis gratuite.',
    kind: 'photographe', all: ['/annuaires/photographes#villes', n => `Les ${n} villes et l’annuaire des photographes`] },
  { key: 'menage', tab: 'Ménage', titre: 'Trouver une équipe de ménage <em>près de chez toi</em>',
    hint: 'Des équipes habituées aux rotations entre deux voyageurs : tarifs locaux, checklist et demande de devis gratuite.',
    kind: 'menage', all: ['/annuaires/menage#villes', n => `Les ${n} villes et l’annuaire du ménage`] },
  { key: 'depannage', tab: 'Dépannage', titre: 'Trouver un artisan <em>près de chez toi</em>',
    hint: 'Plombier, électricien, serrurier : des pros qui interviennent entre deux voyageurs, et les bons réflexes avant d’appeler.',
    kind: 'depannage', all: ['/annuaires/depannage#villes', n => `Les ${n} villes et l’annuaire du dépannage`] },
  { key: 'outils', tab: 'Comparatifs outils', titre: 'Bien choisir <em>tes outils</em>',
    hint: 'Logiciels, serrures, tarification, comptabilité : des comparatifs avec les prix, les forces et les limites de chaque outil.',
    liens: COMPARATIFS, all: ['/partenaires', () => 'Tous les partenaires'] },
]

/** Onglet ouvert d'office selon la page (les liens de tous les onglets restent dans le HTML) */
export const PANEL_RULES = [
  ['photographes', '^/(photographe-lcd-|annuaires/photographes|devenir-photographe-lcd|photographe-)'],
  ['menage', '^/(menage-lcd-|annuaires/menage|devenir-prestataire-menage-lcd)'],
  ['depannage', '^/(depannage-lcd-|annuaires/depannage|pour-qui/depannage)'],
  ['hote', '^/(devenir-hote-airbnb-|villes(/|$))'],
  ['outils', '^/(comparatif-|partenaires|code-promo-|[a-z-]+-(avis|prix)(/|$))'],
]
export function panelForPath(p) {
  for (const [key, re] of PANEL_RULES) if (new RegExp(re).test(p)) return key
  return 'revenus'
}

const chip = (href, label, current) => current === href
  ? `<a href="${href}" class="on" aria-current="page">${esc(label)}</a>`
  : `<a href="${href}">${esc(label)}</a>`

// Villes mises en avant : les plus grands marchés (nombre d'annonces de CITIES,
// footer.js), 18 au plus par ligne. La liste complète est sur la page mère.
export const PAR_LIGNE = 18
let _ann = null
const annonces = slug => {
  if (!_ann) {
    const s = fs.readFileSync(path.join(ROOT, 'footer.js'), 'utf8')
    const open = s.indexOf('[', s.indexOf('var CITIES = ['))
    _ann = Object.fromEntries(new Function('return ' + s.slice(open, s.indexOf('];', open) + 1))().map(c => [c.slug, Number(String(c.ann).replace(/[^0-9]/g, '')) || 0]))
  }
  return _ann[slug] ?? 0
}
const parTaille = (a, b) => annonces(b.slug) - annonces(a.slug) || a.nom.localeCompare(b.nom, 'fr')

/**
 * Page d'une région pour un type de page, si elle existe (étape 7 de la
 * feuille de route) : la ligne « Par région » n'apparaît qu'avec de vraies pages.
 */
export function cheminRegion(kind, regionNom) {
  const slug = regionNom.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const base = { photographe: '/annuaires/photographes', menage: '/annuaires/menage', depannage: '/annuaires/depannage', hote: '/villes' }[kind]
  if (!base) return null
  const url = `${base}/${slug}`
  return fs.existsSync(path.join(ROOT, url.slice(1), 'index.html')) ? url : null
}

/** Lignes d'un onglet : [titre, [[lien, nom], …]] */
function lignes(panel) {
  if (panel.liens) {
    return [
      ['Comparatifs', panel.liens.filter(([h]) => !h.startsWith('/partenaires/'))],
      ['Partenaires', panel.liens.filter(([h]) => h.startsWith('/partenaires/'))],
    ]
  }
  const villes = villesRegistre().filter(v => v.pages[panel.kind])
  if (panel.kind === 'revenus') {
    return [
      ['En France', villes.filter(v => v.pays === 'FR').sort(parTaille).slice(0, PAR_LIGNE).map(v => [v.pages.revenus, v.nom])],
      ['En Europe', villes.filter(v => v.pays !== 'FR').slice(0, PAR_LIGNE).map(v => [v.pages.revenus, v.nom])],
    ]
  }
  const rows = [['Par ville', villes.filter(v => v.pays === 'FR').sort(parTaille).slice(0, PAR_LIGNE).map(v => [v.pages[panel.kind], v.nom])]]
  const regions = [...new Map(villes.filter(v => v.region).map(v => [v.region.code, v.region.nom])).values()]
    .sort((a, b) => a.localeCompare(b, 'fr'))
    .map(nom => [cheminRegion(panel.kind, nom), nom]).filter(([h]) => h)
  if (regions.length) rows.push(['Par région', regions])
  const etranger = villes.filter(v => v.pays !== 'FR').map(v => [v.pages[panel.kind], v.nom])
  if (etranger.length) rows.push(['Hors de France', etranger])
  return rows.filter(([, xs]) => xs.length)
}

function panelHtml(panel, on, current) {
  const total = panel.liens ? panel.liens.length : villesRegistre().filter(v => v.pages[panel.kind]).length
  const rows = lignes(panel).map(([t, xs]) =>
    `<div class="ft-row"><p class="ft-row-t">${esc(t)}</p><div class="ft-chips">${xs.map(([h, l]) => chip(h, l, current)).join('')}</div></div>`,
  ).join('')
  return `<div class="ft-panel${on ? ' on' : ''}" data-panel="${panel.key}" role="tabpanel">`
    + `<p class="ft-panel-hint">${esc(panel.hint)}</p><div class="ft-rows">${rows}</div>`
    + `<a href="${panel.all[0]}" class="ft-see-all">${esc(panel.all[1](total))} <i class="ph-bold ph-arrow-right" style="font-size:11px"></i></a>`
    + `</div>`
}

/**
 * HTML complet du pied de page.
 * @param {{ path?: string, statique?: boolean }} o  path : page qui le reçoit
 *   (onglet ouvert, ville en cours) ; statique : écrit dans la page au build.
 */
export function footerHtml({ path: p = '', statique = false } = {}) {
  const open = panelForPath(p)
  const current = p.replace(/\/$/, '')
  const active = PANELS.find(x => x.key === open)
  const cols = COLONNES.map(c => `<div class="ft-cat"><h2 class="ft-cat-t">${esc(c.titre)}</h2>`
    + c.liens.map(([h, l, ext]) => ext
      ? `<a href="${h}" target="_blank" rel="noopener">${esc(l)}<span class="ft-ext"><i class="ph ph-arrow-up-right"></i></span></a>`
      : `<a href="${h}">${esc(l)}</a>`).join('')
    + (c.plus ? `<a href="${c.plus[0]}" class="ft-cat-more">${esc(c.plus[1])}</a>` : '')
    + '</div>').join('')
  return `<footer${statique ? ' class="ft-static"' : ''}><div class="ft-in">`
    + '<div class="ft-hero"><div class="ft-brand"><a class="ft-brand-logo" href="/"><img src="/logo-nav.webp" alt="" width="36" height="36" loading="lazy"><span class="ft-brand-name">Jason <em>Marinho</em></span></a>'
    + '<p class="ft-brand-desc">Expert LCD et co-fondateur de Driing. J\'aide les hôtes et conciergeries à piloter leur activité avec des chiffres clairs, honnêtement et efficacement.</p>'
    + '<div class="ft-socs"><a href="https://www.linkedin.com/in/jason-driing-location-sanscommission/" target="_blank" rel="noopener" class="ft-soc" aria-label="LinkedIn"><i class="ph ph-linkedin-logo"></i></a><a href="https://instagram.com/jason_marinho" target="_blank" rel="noopener" class="ft-soc" aria-label="Instagram"><i class="ph ph-instagram-logo"></i></a><a href="https://www.facebook.com/jasonmarinholcd" target="_blank" rel="noopener" class="ft-soc" aria-label="Facebook"><i class="ph ph-facebook-logo"></i></a><a href="https://wa.me/33630212592" target="_blank" rel="noopener" class="ft-soc" aria-label="WhatsApp"><i class="ph ph-whatsapp-logo"></i></a></div></div>'
    + `<div class="ft-cols">${cols}</div></div>`
    + '<div class="ft-explore"><div class="ft-explore-head">'
    + `<h3 class="ft-explore-h"><i class="ph ph-compass"></i><span class="ft-explore-h-text">${active.titre}</span></h3>`
    + '<div class="ft-explore-tabs" role="tablist">'
    + PANELS.map(x => `<button class="ft-tab${x.key === open ? ' on' : ''}" data-panel="${x.key}" data-title="${esc(x.titre)}" role="tab" aria-selected="${x.key === open}">${esc(x.tab)}</button>`).join('')
    + '</div></div><div class="ft-panels">'
    + PANELS.map(x => panelHtml(x, x.key === open, current)).join('')
    + '</div></div>'
    + '<div class="ft-baseline"><div class="ft-cp">© 2026 Jason Marinho · Fait avec soin à Paris</div><div class="ft-legal"><a href="/mentions-legales">Mentions légales</a><a href="/politique-de-confidentialite">Confidentialité</a><a href="/cgvu">CGV / CGU</a><a href="#" onclick="if(window.openCookieSettings){openCookieSettings();}return false;">Cookies</a></div></div>'
    + '</div></footer>'
}

/** CSS du pied de page, lu dans footer.js (même source pour la page écrite et le secours) */
export function footerCss() {
  const s = fs.readFileSync(path.join(ROOT, 'footer.js'), 'utf8')
  const a = s.indexOf('style.textContent = [') + 'style.textContent = '.length
  const b = s.indexOf("].join('')", a) + 1
  if (a < 30 || b < a) throw new Error('CSS du pied de page introuvable dans footer.js')
  return new Function('return ' + s.slice(a, b))().join('')
}
