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
import { zonesLiens, chipsRepliables } from './footer-html.mjs'
import { villesRegistre } from './registre-geo.mjs'
import { aPhoto, PHOTOS_COMMONS, creditPhoto } from '../data/photos-villes.mjs'

const esc = s => s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

export const ANNUAIRES = {
  photographe: {
    key: 'photographe',
    prefix: 'photographe-lcd',
    one: 'photographe', many: 'photographes', unOne: 'un photographe',
    title: 'Photographe et vidéaste Airbnb : trouve un pro près de toi',
    desc: 'Photographes et vidéastes spécialisés Airbnb et location courte durée : photos, vidéos, drone, formules, villes couvertes. Contact direct, sans commission.',
    h1: 'Un photographe ou un vidéaste <em>pour ton annonce</em>',
    lead: 'Des photographes et des vidéastes qui connaissent la location courte durée : regarde leurs photos, leurs vidéos, leurs formules et les villes où ils se déplacent, puis écris-leur directement. Sans commission, sans intermédiaire.',
    icon: 'ph-camera',
    questions: [
      ['As-tu déjà photographié des locations Airbnb ou Booking ?', 'Demande 2 ou 3 annonces en ligne prises par le photographe : c’est la meilleure preuve.'],
      ['Combien de photos, livrées en combien de temps ?', 'Le nombre de photos retouchées et le délai de livraison doivent être écrits sur le devis.'],
      ['Les formats sont-ils prêts pour les plateformes ?', 'Format paysage pour Airbnb et Booking, et une photo de couverture qui reste lisible en petit.'],
      ['Que se passe-t-il s’il pleut ou si la lumière est mauvaise ?', 'Un bon photographe propose de décaler la séance ou de revenir pour l’extérieur.'],
      ['Peux-tu réutiliser les photos et la vidéo partout ?', 'Annonces, site de réservation directe, réseaux, fiche Google : vérifie que les droits d’utilisation te sont cédés.'],
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
      ['Photographe ou vidéaste : lequel choisir ?', 'Les photos restent la base de ton annonce sur Airbnb et Booking. Une vidéo sert surtout ailleurs : site de réservation directe, réseaux sociaux, fiche Google. Beaucoup de pros font les deux en une seule séance : filtre « Photographe et vidéaste ».'],
      ['Et les vues aériennes au drone ?', 'Utiles pour un logement avec un extérieur, une vue ou un terrain. Filtre « Vues aériennes (drone) », et demande au pro s’il est en règle avec l’aviation civile (DGAC) et si le vol est permis à ton adresse : les règles sont plus strictes en ville et près des aéroports.'],
      ['Combien coûte un photographe pour une annonce Airbnb ?', 'Chaque photographe fixe ses tarifs selon la taille du logement, le nombre de photos et les options (drone, vidéo). Les fiches affichent leurs formules ou leur fourchette de prix, et les guides par ville donnent les fourchettes constatées localement.'],
      ['Jason Marinho prend-il une commission ?', 'Non. Tu contactes le photographe depuis sa fiche, et le devis, la séance et le paiement se règlent directement entre vous.'],
      ['Comment savoir si un photographe est sérieux ?', 'Chaque fiche est remplie par le photographe lui-même. Regarde ses photos et son portfolio, demande un devis écrit, et vérifie son entreprise gratuitement sur annuaire-entreprises.data.gouv.fr.'],
      ['Comment le contacter ?', 'Avec le formulaire de sa fiche : ton message arrive directement dans sa boîte mail et il te répond lui-même.'],
      ['Il n’y a pas encore de photographe dans ma ville, que faire ?', 'Regarde le guide de ta ville ci-dessous (tarifs locaux, photos indispensables, comment briefer), et repasse : l’annuaire grandit chaque semaine.'],
    ],
    join: ['/devenir-photographe-lcd', 'Tu es photographe ou vidéaste ? Rejoins l’annuaire'],
    joinBox: {
      eyebrow: 'Pour les photographes et vidéastes',
      title: 'Tes photos et tes vidéos, vues par les hôtes <em>de ta ville</em>',
      text: 'Une fiche qui sert de site vitrine sur Google, un lien vers ton portfolio et ta vidéo en haut de ta fiche, tes statistiques et les demandes des hôtes en direct. Sans commission.',
      exemple: '/annuaires/photographes/exemple-fiche',
    },
  },
  menage: {
    key: 'menage',
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
    joinBox: {
      eyebrow: 'Pour les équipes de ménage',
      title: 'Trouve des hôtes <em>près de chez toi</em>',
      text: 'Une fiche qui sert de site vitrine sur Google, le planning de tes clients calculé depuis leurs réservations et les demandes des hôtes en direct. Sans commission.',
      exemple: '/annuaires/menage/exemple-fiche',
    },
  },
  // Dépannage et maintenance (31/10/2026, docs/claude/projet-maintenance.md).
  // Conseils seulement, aucun prix ni règle juridique : les tarifs viennent des fiches.
  depannage: {
    key: 'depannage',
    prefix: 'depannage-lcd',
    one: 'pro', many: 'pros du dépannage', unOne: 'un pro du dépannage',
    villeLabel: 'dépannage',
    villesIntro: 'Les bons réflexes en cas de panne et les questions à poser, ville par ville.',
    prepareTitle: 'Ce qui fait gagner du temps <em>au pro</em>',
    title: 'Dépannage Airbnb : plombier, électricien près de toi',
    desc: 'Plombiers, électriciens, serruriers et multiservices pour la location courte durée : spécialités, délai d’intervention, villes couvertes. Contact direct, sans commission.',
    h1: 'Un pro du dépannage <em>entre deux voyageurs</em>',
    lead: 'Plombiers, électriciens, serruriers, multiservices : des pros qui savent qu’un logement doit être prêt pour le prochain voyageur. Regarde leurs spécialités, leur délai d’intervention et les villes où ils se déplacent, puis écris-leur directement. Sans commission, sans intermédiaire.',
    icon: 'ph-wrench',
    questions: [
      ['Pouvez-vous intervenir entre deux voyageurs ?', 'Une fuite ou un chauffe-eau en panne ne peut pas attendre le séjour suivant : demande les délais réels, soirs et week-ends compris.'],
      ['Combien coûtent le déplacement et la première heure ?', 'Fais-les préciser avant l’intervention, surtout en urgence : ce sont les deux lignes qui surprennent le plus sur une facture.'],
      ['Me donnez-vous un devis écrit ?', 'Dès que la réparation dépasse le petit dépannage, un devis écrit évite les mauvaises surprises.'],
      ['Pouvez-vous intervenir sans moi sur place ?', 'Boîte à clés, serrure à code, consignes d’accès : la plupart des hôtes ne sont pas sur place le jour de la panne.'],
      ['M’envoyez-vous un compte rendu ?', 'Une photo après l’intervention et une facture claire te permettent de suivre ton logement à distance, et de refacturer un dégât si un voyageur en est la cause.'],
    ],
    prepare: [
      'Où se trouvent le compteur, le disjoncteur et l’arrivée d’eau, noté dans ton guide',
      'Les marques et modèles de tes appareils (chauffe-eau, chaudière, électroménager)',
      'Un accès simple : boîte à clés ou serrure à code',
      'Des photos de la panne envoyées avec ta demande',
      'Les créneaux libres entre deux réservations',
    ],
    articles: [
      ['/blog/galeres-location-courte-duree-comment-gerer-urgence', 'Urgences en location courte durée : les galères fréquentes'],
      ['/blog/panne-courant-eau-internet-lcd-7-reflexes-coupure-sejour', 'Panne d’eau, de courant ou d’internet : 7 réflexes'],
      ['/blog/refacturer-degat-voyageur-airbnb-procedure', 'Refacturer un dégât voyageur : la procédure'],
    ],
    faq: [
      ['Combien coûte un dépannage ?', 'Chaque pro fixe ses tarifs : déplacement, heure de main-d’œuvre, pièces. Les fiches affichent le tarif horaire, le prix du déplacement ou des formules : demande un devis avant l’intervention.'],
      ['Jason Marinho prend-il une commission ?', 'Non. Tu contactes le pro depuis sa fiche, et le devis, l’intervention et le paiement se règlent directement entre vous.'],
      ['Comment savoir si un pro est sérieux ?', 'Chaque fiche est remplie par le pro lui-même. Demande un devis écrit et, pour des travaux, son attestation d’assurance, et vérifie l’entreprise gratuitement sur annuaire-entreprises.data.gouv.fr.'],
      ['Et si la panne arrive pendant un séjour ?', 'Filtre « Urgences » ou « Le jour même » : ces pros ont indiqué pouvoir venir vite. Le mieux reste d’avoir deux ou trois contacts de côté avant d’en avoir besoin.'],
      ['Il n’y a pas encore de pro dans ma ville, que faire ?', 'Décris ton besoin : ta demande part aux pros de ta zone dès qu’ils sont là. Repasse aussi : l’annuaire grandit chaque semaine.'],
    ],
    join: ['/annuaires/depannage/inscription', 'Tu es artisan ou multiservice ? Rejoins l’annuaire'],
    joinBox: {
      eyebrow: 'Pour les artisans et les multiservices',
      title: 'Les hôtes de ta ville <em>ont besoin de toi</em>',
      text: 'Une fiche qui sert de site vitrine sur Google, les demandes des hôtes et des conciergeries en direct, tes devis faits en deux minutes. Sans commission.',
      exemple: '/annuaires/depannage/exemple-fiche',
    },
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

/** Photos de la carte de l'annuaire : 4 au plus (carrousel), la sortie Supabase gratuite est comptée */
export const CARD_PHOTOS_MAX = 4

const initialsOf = name => String(name || '').split(/\s+/).filter(w => /^\p{L}/u.test(w)).map(w => w[0]).slice(0, 2).join('').toUpperCase()
const boldPrices = s => esc(s).replace(/(\d[\d  ]*(?:,\d+)?\s?€(?:\/h)?)/g, '<strong>$1</strong>')

/**
 * Carte d'un pro dans l'annuaire, design « Monogramme » validé par Jason
 * (12/10/2026, « plus épuré, plus élégant ») : photo en 3:2, carrousel quand
 * il y en a plusieurs ; sans photo, aplat crème avec les initiales (ou le
 * logo) au même format, pour que la grille reste alignée.
 * `attrs` : attributs data-* déjà échappés (recherche et filtres).
 */
export function proCardHtml({ href, attrs = '', name, metier, ville, lieu, extra, tarif, tarifSuffix, photos = [], logoUrl, alt }) {
  const n = photos.length
  const media = n
    ? `<div class="pc-slides">${photos.map((ph, i) => `<img src="${esc(ph.thumb)}" alt="${i === 0 ? esc(alt) : ''}" width="640" height="427" loading="lazy" decoding="async">`).join('')}</div>${n > 1
      ? `<span class="pc-nav pc-prev" aria-hidden="true"><i class="ph-bold ph-caret-left"></i></span><span class="pc-nav pc-next" aria-hidden="true"><i class="ph-bold ph-caret-right"></i></span><span class="pc-dots" aria-hidden="true">${photos.map((_, i) => `<span class="pc-dot${i === 0 ? ' on' : ''}"></span>`).join('')}</span>`
      : ''}`
    : `<div class="pc-mono" aria-hidden="true">${logoUrl ? `<img class="pc-logo" src="${esc(logoUrl)}" alt="" loading="lazy">` : `<span class="pc-ini">${esc(initialsOf(name))}</span>`}<small>${esc(metier)}</small></div>`
  const meta = [ville, lieu].filter(Boolean).join(' · ')
  return `<a href="${esc(href)}" class="card pc"${attrs ? ` ${attrs}` : ''}>
  <div class="pc-media">${media}</div>
  <div class="pc-body">
    <h3 class="pc-name">${esc(name)}</h3>
    ${meta ? `<p class="pc-meta">${esc(meta)}</p>` : ''}
    ${extra ? `<p class="pc-extra">${esc(extra)}</p>` : ''}
    <div class="pc-foot"><span>${tarif ? `${boldPrices(tarif)}${tarifSuffix ? ` <small>${esc(tarifSuffix)}</small>` : ''}` : ''}</span><span class="pc-go">Voir la fiche <i class="ph-bold ph-arrow-right"></i></span></div>
  </div>
</a>`
}

/** « Lyon 6e, Villeurbanne… » ou la zone couverte, en court */
export function cardLieu(villes, zone, verbe) {
  const v = (Array.isArray(villes) ? villes : []).filter(Boolean)
  if (v.length) return `${verbe} ${v.slice(0, 2).join(', ')}${v.length > 2 ? ` +${v.length - 2}` : ''}`
  const z = String(zone || '').trim()
  return z.length > 48 ? `${z.slice(0, 46).replace(/[\s,;·-]+\S*$/, '')}…` : z
}

export function heroInnerHtml(cfg, breadcrumb) {
  return `<nav class="brd" aria-label="Fil d'Ariane">${breadcrumb}</nav>
    <span class="lbl">Annuaire · contact direct, sans commission</span>
    <h1>${cfg.h1}</h1>
    <p class="lead">${esc(cfg.lead)}</p>`
}

/**
 * Liste des villes sous la recherche (25/10/2026, Jason : « sur téléphone le
 * clavier cache tout, mettre les villes proposées pour qu'on clique
 * directement ») : villes des pages couvertes et villes principales des pros,
 * avec le nombre de pros. Filtrée pendant la saisie (CITY_PICKS_JS).
 */
export function citySuggestHtml(cfg, counts, items) {
  const byLabel = new Map()
  for (const [slug, n] of counts) byLabel.set(villeLabel(slug), n)
  const norm = v => String(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const known = new Set([...byLabel.keys()].map(norm))
  for (const p of items) {
    const v = String(p.ville ?? '').trim()
    if (!v || known.has(norm(v))) continue
    byLabel.set(v, (byLabel.get(v) ?? 0) + 1)
  }
  const list = [...byLabel.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'))
  if (!list.length) return ''
  return `<div class="city-sug" id="city-sug" role="listbox" aria-label="Villes avec des ${esc(cfg.many)}" hidden>
    <div class="cs-h">Villes avec des ${esc(cfg.many)}</div>
    <div class="cs-list">${list.map(([v, n]) => `<button type="button" class="cs-opt" role="option" data-city="${esc(v)}" data-n="${esc(norm(v))}"><i class="ph-bold ph-map-pin"></i><span>${esc(v)}</span><small>${n}</small></button>`).join('')}</div>
    <p class="cs-none" hidden>Pas encore de ville à ce nom : lance quand même la recherche.</p>
  </div>`
}

/** Raccourcis « Villes avec un photographe » sous la recherche */
export function cityPicksHtml(cfg, counts) {
  const list = [...counts.entries()].sort((a, b) => b[1] - a[1] || villeLabel(a[0]).localeCompare(villeLabel(b[0]), 'fr')).slice(0, 12)
  if (!list.length) return ''
  return `<div class="city-picks"><span class="city-picks-l">${cfg.many.charAt(0).toUpperCase() + cfg.many.slice(1)} à :</span>${list.map(([slug, n]) =>
    `<button type="button" class="city-pick" data-city="${esc(villeLabel(slug))}">${esc(villeLabel(slug))} <span>${n}</span></button>`).join('')}</div>`
}

/**
 * État vide (aucun pro) côté hôte. Refait le 10/11/2026 (Jason : « minimaliste,
 * le plus utile possible, effet wow », l'ancien panneau de 640 px était trop
 * étroit) : pleine largeur, ce que l'hôte peut faire tout de suite à gauche,
 * comment ça marche à droite, une ligne pour les pros du secteur.
 * La zone (« dans les Alpes-Maritimes ») est posée par les pages de zone entre
 * les marqueurs EMPTY-ZONE ; sinon « près de chez toi ».
 */
export function emptyHtml(cfg) {
  const nu = cfg.unOne.replace(/^une? /, '')
  const de = /^[aeiouyéèêh]/i.test(nu) ? `d’${nu}` : `de ${nu}`
  const zone = '<!--EMPTY-ZONE-->près de chez toi<!--/EMPTY-ZONE-->'
  return `<section class="e2" aria-labelledby="e2-h">
  <div class="e2-main">
    <span class="e2-tag"><i class="ph-bold ${cfg.icon}"></i> L’annuaire ouvre ${zone}</span>
    <h2 id="e2-h">Pas encore ${esc(de)} inscrit${nu.startsWith('équipe') ? 'e' : ''} ici. <em>Ta demande, elle, peut partir maintenant.</em></h2>
    <p>Décris ton logement et ton besoin : ta demande part aux pros de ta zone dès qu’ils sont là, et ils te répondent en direct, sans commission.</p>
    <div class="e2-cta">
      <a href="/trouver-un-pro?metier=${cfg.key}" class="e2-btn">Décrire mon besoin <i class="ph-bold ph-arrow-right"></i></a>
      <a href="#villes" class="e2-lnk">Les tarifs constatés dans ma ville</a>
    </div>
  </div>
  <ol class="e2-steps">
    <li><span class="e2-n">1</span><div><b>Tu décris ton besoin</b><small>Ton logement, tes dates, ce qu’il te faut.</small></div></li>
    <li><span class="e2-n">2</span><div><b>Elle part aux pros de ta zone</b><small>Dès qu’ils s’inscrivent sur l’annuaire.</small></div></li>
    <li><span class="e2-n">3</span><div><b>Ils te répondent en direct</b><small>Sans intermédiaire, sans commission.</small></div></li>
  </ol>
  <p class="e2-pro"><i class="ph-bold ph-briefcase"></i> Tu es ${esc(cfg.unOne)}<!--EMPTY-ZONE-PRO--><!--/EMPTY-ZONE-PRO--> ? <a href="${cfg.join[0]}">Crée ta fiche et reçois les demandes du secteur</a></p>
</section>
<style>
.e2{position:relative;display:grid;grid-template-columns:1.25fr 1fr;gap:0;background:#fff;border:1px solid rgba(0,76,63,.1);border-radius:24px;overflow:hidden;box-shadow:0 24px 60px rgba(0,40,30,.08)}
.e2-main{padding:clamp(26px,4vw,48px)}
.e2-tag{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--g);background:rgba(0,76,63,.07);border-radius:999px;padding:6px 12px}
.e2 h2{font-family:Fraunces,serif;font-weight:300;font-size:clamp(26px,3.1vw,38px);line-height:1.14;letter-spacing:-.02em;color:var(--td);margin:18px 0 14px}
.e2 h2 em{display:block;color:var(--g);font-style:italic}
.e2-main>p{font-size:15.5px;line-height:1.7;color:var(--tm);font-weight:300;margin:0;max-width:520px}
.e2-cta{display:flex;flex-wrap:wrap;align-items:center;gap:10px 22px;margin-top:26px}
.e2-btn{display:inline-flex;align-items:center;gap:8px;background:#FFD56B;color:#003329;font-weight:600;font-size:15px;padding:14px 22px;border-radius:12px;text-decoration:none;transition:transform .2s,box-shadow .2s}
.e2-btn:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(255,200,69,.4)}
.e2-lnk{font-size:14.5px;font-weight:600;color:var(--g);text-decoration:none;border-bottom:1px solid rgba(0,76,63,.3);padding-bottom:1px}
.e2-lnk:hover{border-color:var(--g)}
.e2-steps{list-style:none;margin:0;padding:clamp(26px,4vw,44px);background:radial-gradient(ellipse 80% 70% at 85% 10%,rgba(255,213,107,.14),transparent 60%),linear-gradient(160deg,#001a11,#003329 55%,#00463a);color:#fff;display:flex;flex-direction:column;justify-content:center;gap:22px;position:relative}
.e2-steps li{display:flex;gap:16px;align-items:flex-start;position:relative}
.e2-steps li:not(:last-child)::after{content:"";position:absolute;left:17px;top:40px;bottom:-18px;width:1px;background:rgba(255,213,107,.3)}
.e2-n{flex-shrink:0;width:35px;height:35px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:Fraunces,serif;font-size:17px;color:#003329;background:#FFD56B;box-shadow:0 0 0 6px rgba(255,213,107,.12)}
.e2-steps b{display:block;font-weight:600;font-size:15.5px;margin-top:5px}
.e2-steps small{display:block;font-size:13.5px;color:rgba(255,255,255,.65);margin-top:2px;line-height:1.5}
.e2-pro{grid-column:1/-1;margin:0;padding:14px clamp(26px,4vw,48px);border-top:1px solid rgba(0,76,63,.1);background:#FBFAF6;font-size:14px;color:var(--tm);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.e2-pro i{color:var(--g)}
.e2-pro a{color:var(--g);font-weight:600;text-decoration:none;border-bottom:1px solid rgba(0,76,63,.3)}
@media(max-width:820px){.e2{grid-template-columns:1fr}.e2-steps{gap:18px}}
</style>`
}

/** « Pas le temps de chercher ? » : vers le formulaire de demande inversée */
export function demandeBandHtml(cfg) {
  return `<div class="dem-band">
  <div><strong>Pas le temps de chercher ?</strong> Décris ton besoin : ta demande part aux 3 ${esc(cfg.many)} les plus proches de ton logement.</div>
  <a href="/trouver-un-pro?metier=${cfg.key}" class="dem-btn" id="dem-link"><i class="ph-bold ph-paper-plane-tilt"></i>Décrire mon besoin</a>
</div>`
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
        <h2 class="guide-h">${cfg.prepareTitle ?? (cfg.one === 'photographe' ? 'Prépare ton logement <em>avant la séance</em>' : 'Ce qui facilite <em>le travail de l’équipe</em>')}</h2>
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

/**
 * Section « Guide … de ta ville » (10/11/2026, refaite à la demande de Jason :
 * « plus visuel, une sorte de carrousel mignon ») :
 * - un carrousel de cartes photo, les villes où il y a des pros en tête, puis
 *   les plus grands marchés ; photo Pexels vérifiée (scripts/data/photos-villes.mjs)
 *   ou carte graphique tant qu'il n'y en a pas ;
 * - puis les zones, comme le pied de page : par région, par département
 *   (18 visibles, le reste replié), hors de France, et toutes les villes de A à Z
 *   (repliées, ancre #toutes-villes). Tous les liens restent dans le HTML.
 */
export function villesGuidesHtml(cfg, cities, counts) {
  const kind = { 'photographe-lcd': 'photographe', 'menage-lcd': 'menage', 'depannage-lcd': 'depannage' }[cfg.prefix]
  if (!kind) return ''
  const z = zonesLiens(kind)
  const reg = new Map(villesRegistre().map(v => [v.slug, v]))
  const villes = [...z.villes, ...z.etranger].map(([url, nom, slug]) => ({ url, nom, slug, v: reg.get(slug), n: counts.get(slug) ?? 0 }))
  if (!villes.length) return ''
  const label = cfg.villeLabel ?? (cfg.one === 'photographe' ? 'photographe' : 'ménage')
  const proLabel = n => `${n} ${n > 1 ? cfg.many : cfg.one}`
  // Pros d'abord, puis les villes avec photo, puis l'ordre des marchés (tri stable)
  const ordre = [...villes].sort((a, b) => (b.n - a.n) || ((aPhoto(b.slug) ? 1 : 0) - (aPhoto(a.slug) ? 1 : 0)))
  const carte = c => {
    const lieu = c.v?.pays === 'FR' ? c.v?.region?.nom : c.v?.paysNom
    const media = aPhoto(c.slug)
      ? `<img src="/img/villes/${c.slug}.webp" alt="${esc(c.nom)}" width="560" height="700" loading="lazy" decoding="async">`
      : `<span class="vc-ph" aria-hidden="true"><span>${esc(c.nom.charAt(0))}</span></span>`
    return `<a class="vc-card" href="${c.url}">${media}<span class="vc-shade"></span>`
      + (c.n ? `<span class="vc-badge"><i class="ph-bold ph-check-circle"></i>${esc(proLabel(c.n))}</span>` : '')
      + `<span class="vc-txt">${lieu ? `<span class="vc-reg">${esc(lieu)}</span>` : ''}<span class="vc-name">${esc(c.nom)}</span><span class="vc-go">Voir le guide <i class="ph-bold ph-arrow-right"></i></span></span></a>`
  }
  const aZ = [...villes].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')).map(c => `<a href="${c.url}"${c.n ? ' class="has"' : ''}>${esc(c.nom)}${c.n ? ` <span>${esc(proLabel(c.n))}</span>` : ''}</a>`).join('')
  const ligne = (t, xs, reste) => xs.length ? `<div class="vz-row"><p class="vz-t">${t}</p><div>${chipsRepliables(xs, reste, '', { cls: 'villes-chips', more: 'vz-more' })}</div></div>` : ''
  const avecPros = villes.filter(c => c.n).length
  return `<section class="villes-section" id="villes">
  <div class="villes-in">
    <div class="vc-head">
      <div>
        <h2 class="villes-h">Guide ${label} <em>de ta ville</em></h2>
        <p class="villes-p">${esc(cfg.villesIntro ?? 'Tarifs constatés, checklist et questions à poser, ville par ville.')} ${villes.length} villes${avecPros ? `, dont ${avecPros} avec des ${esc(cfg.many)} déjà inscrits (en tête)` : ''}.</p>
      </div>
      <div class="vc-arrows"><button type="button" class="vc-btn" data-d="-1" aria-label="Villes précédentes" disabled><i class="ph-bold ph-caret-left"></i></button><button type="button" class="vc-btn" data-d="1" aria-label="Villes suivantes"><i class="ph-bold ph-caret-right"></i></button></div>
    </div>
    <div class="vc-track" role="list">
      ${ordre.map(carte).join('\n      ')}
    </div>
    <details class="vc-credit"><summary>Photos des villes : Pexels et Wikimedia Commons <i class="ph-bold ph-caret-down"></i></summary><p><a href="https://www.pexels.com/license/" target="_blank" rel="noopener">Pexels</a>, licence gratuite${villes.some(c => PHOTOS_COMMONS[c.slug]) ? ` ; ${villes.filter(c => PHOTOS_COMMONS[c.slug]).map(c => `${esc(c.nom)} : ${creditPhoto(c.slug)}`).join(' · ')}` : ''}.</p></details>
    <div class="vz">
      ${ligne('Par région', z.regions, 'régions')}
      ${ligne('Par département', z.departements, 'départements')}
      ${ligne('Hors de France', z.etranger.map(([u, n]) => [u, n]), 'villes')}
      <details class="vz-all" id="toutes-villes"><summary><span><i class="ph-bold ph-list-checks"></i> Toutes les villes, de A à Z <small>${villes.length}</small></span><i class="ph-bold ph-caret-down vz-car"></i></summary><div class="villes-chips">${aZ}</div></details>
    </div>
  </div>
</section>
<style>${VC_CSS}</style>
<script>${VC_JS}</script>`
}

const VC_CSS = '.vc-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:18px}.vc-head .villes-p{margin-bottom:0}'
  + '.vc-arrows{display:flex;gap:8px;flex-shrink:0}.vc-btn{width:42px;height:42px;border-radius:50%;border:1px solid rgba(0,76,63,.18);background:#fff;color:var(--g);display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;transition:background .2s,color .2s}.vc-btn:hover:not(:disabled){background:var(--g);color:#fff}.vc-btn:disabled{opacity:.35;cursor:default}'
  + '.vc-track{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding-left:2px;padding:4px 2px 14px;scrollbar-width:thin;scrollbar-color:rgba(0,76,63,.25) transparent;overscroll-behavior-x:contain}'
  + '.vc-card{position:relative;flex:0 0 clamp(170px,22vw,210px);aspect-ratio:4/5;border-radius:18px;overflow:hidden;scroll-snap-align:start;text-decoration:none;color:#fff;background:#0b3b31;box-shadow:0 6px 18px rgba(0,40,30,.10);transition:transform .25s,box-shadow .25s}'
  + '.vc-card:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(0,40,30,.18)}'
  + '.vc-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .5s}.vc-card:hover img{transform:scale(1.05)}'
  + '.vc-ph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 20% 18%,rgba(255,213,107,.28),transparent 45%),radial-gradient(circle at 85% 85%,rgba(99,214,131,.22),transparent 50%),linear-gradient(155deg,#003d31,#00594a 60%,#0b6b57)}'
  + '.vc-ph span{font-family:Fraunces,serif;font-style:italic;font-weight:300;font-size:92px;line-height:1;color:rgba(255,213,107,.55);margin-top:-34px}'
  + '.vc-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,20,14,.78))}'
  + '.vc-badge{position:absolute;top:10px;left:10px;display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;background:#FFD56B;color:#003d31;padding:5px 10px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.15)}'
  + '.vc-txt{position:absolute;left:14px;right:14px;bottom:13px;display:flex;flex-direction:column;gap:2px}'
  + '.vc-reg{font-size:10.5px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:rgba(255,255,255,.75)}'
  + '.vc-name{font-family:Fraunces,serif;font-size:22px;line-height:1.15}'
  + '.vc-go{font-size:12px;font-weight:600;color:#FFD56B;display:inline-flex;align-items:center;gap:4px;margin-top:4px;opacity:.9}'
  + '.vc-credit{font-size:11.5px;color:var(--tl);margin:4px 0 0;text-align:right}.vc-credit a{color:inherit}'
  // Crédits repliés (10/11/2026, Jason) : une ligne, le détail au clic sur le chevron
  + '.vc-credit summary{list-style:none;cursor:pointer;display:inline-flex;align-items:center;gap:5px}.vc-credit summary::-webkit-details-marker{display:none}'
  + '.vc-credit summary i{font-size:11px;transition:transform .2s}.vc-credit[open] summary i{transform:rotate(180deg)}.vc-credit p{margin:8px 0 0;line-height:1.6}'
  + '.vz{margin-top:22px;border-top:1px solid rgba(0,76,63,.1)}'
  + '.vz-row{display:grid;grid-template-columns:150px 1fr;gap:16px;padding:16px 0;border-bottom:1px solid rgba(0,76,63,.1)}'
  + '.vz-t{font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--tl);margin:0;padding-top:7px}'
  + '.vz-more{margin-top:8px}.vz-more>summary,.vz-all>summary{list-style:none;cursor:pointer}.vz-more>summary::-webkit-details-marker,.vz-all>summary::-webkit-details-marker{display:none}'
  + '.vz-more>summary{display:inline-flex;font-size:12.5px;font-weight:600;color:var(--g);padding:2px 0}.vz-more-c{display:none}.vz-more[open]>summary .vz-more-o{display:none}.vz-more[open]>summary .vz-more-c{display:inline}.vz-more .villes-chips{margin-top:9px}'
  + '.vz-all>summary{display:flex;align-items:center;justify-content:space-between;padding:16px 0;font-weight:600;color:var(--td)}.vz-all>summary span{display:inline-flex;align-items:center;gap:8px}.vz-all>summary i{color:var(--g)}.vz-all>summary small{font-size:11.5px;font-weight:700;color:var(--g);background:rgba(0,76,63,.08);border-radius:999px;padding:2px 8px}'
  + '.vz-car{transition:transform .2s}.vz-all[open] .vz-car{transform:rotate(180deg)}.vz-all .villes-chips{padding-bottom:12px}'
  + '.villes-chips a.has{background:rgba(0,76,63,.08);color:var(--g);font-weight:600;border-color:rgba(0,76,63,.18)}.villes-chips a span{font-size:11px;font-weight:600;opacity:.8}'
  + '@media(max-width:640px){.vz-row{grid-template-columns:1fr;gap:10px}.vz-t{padding-top:0}.vc-arrows{display:none}.vc-card{flex-basis:62vw;max-width:240px}}'

const VC_JS = '(function(){var s=document.getElementById("villes");if(!s)return;var t=s.querySelector(".vc-track"),b=s.querySelectorAll(".vc-btn");'
  + 'function u(){b[0].disabled=t.scrollLeft<4;b[1].disabled=t.scrollLeft+t.clientWidth>=t.scrollWidth-4}'
  + 'b.forEach(function(x){x.addEventListener("click",function(){t.scrollBy({left:+x.dataset.d*t.clientWidth*.85,behavior:"smooth"})})});'
  + 't.addEventListener("scroll",u,{passive:true});u();'
  + 'function h(){if(location.hash==="#toutes-villes"){var d=document.getElementById("toutes-villes");d.open=true;d.scrollIntoView()}}h();addEventListener("hashchange",h)})()'

export function joinLineHtml(cfg) {
  const b = cfg.joinBox
  return `<aside class="join-box" aria-label="${esc(b.eyebrow)}">
  <div class="join-in">
    <div class="join-txt">
      <span class="join-eye">${esc(b.eyebrow)}</span>
      <h2 class="join-h">${b.title}</h2>
      <p class="join-p">${esc(b.text)}</p>
    </div>
    <div class="join-act">
      <a href="${cfg.join[0]}" class="join-btn">Créer ma fiche <i class="ph-bold ph-arrow-right"></i></a>
      <a href="${b.exemple}" class="join-lnk">Voir un exemple de fiche</a>
    </div>
  </div>
</aside>`
}

export const ANNUAIRE_CSS = `
.city-sug{position:absolute;left:clamp(16px,5vw,40px);right:clamp(16px,5vw,40px);top:calc(100% + 8px);background:#fff;border:1px solid var(--bd);border-radius:16px;box-shadow:0 18px 44px rgba(0,30,20,.18);padding:10px;z-index:20;max-height:min(320px,42vh);overflow:auto}
.city-sug[hidden]{display:none}
.cs-h{font-size:11.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--tl);padding:4px 8px 8px}
.cs-list{display:flex;flex-direction:column}
.cs-opt{display:flex;align-items:center;gap:10px;width:100%;border:0;background:none;padding:11px 10px;border-radius:10px;font-family:'Outfit',sans-serif;font-size:16px;color:var(--td);text-align:left;cursor:pointer}
.cs-opt i{color:var(--g);font-size:16px}
.cs-opt span{flex:1;min-width:0}
.cs-opt small{font-size:12px;font-weight:700;color:var(--g);background:rgba(0,76,63,.08);border-radius:999px;padding:2px 8px}
.cs-opt:hover,.cs-opt.act{background:#F1F5F2}
.cs-opt[hidden]{display:none}
.cs-none{margin:6px 8px;font-size:13.5px;color:var(--tm)}
/* iOS zoome sur un champ en dessous de 16 px */
@media(max-width:719px){#pro-search{font-size:16px}}
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
.card-photo{width:100%;align-self:stretch;flex-shrink:0;border:0;border-radius:0;margin:0}
.card-cover{position:relative;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 18% 22%,rgba(255,213,107,.22),transparent 42%),radial-gradient(circle at 85% 90%,rgba(99,214,131,.16),transparent 45%),linear-gradient(150deg,#001a11,#003329 55%,#00463a)}
.card-cover-ini{width:84px;height:84px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,213,107,.12);border:1px solid rgba(255,213,107,.35);color:#FFD56B;font-family:'Fraunces',serif;font-size:32px;font-style:italic;letter-spacing:.5px}
.card-cover-logo{width:96px;height:96px;border-radius:20px;background:#fff center/cover no-repeat;box-shadow:0 10px 28px rgba(0,0,0,.3)}
.card-cover-lbl{position:absolute;left:16px;bottom:12px;font-size:10.5px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:rgba(255,255,255,.6)}
.card-body{display:flex;flex-direction:column;gap:12px;padding:20px 22px 22px;flex:1}
.card.pc{display:flex;flex-direction:column;padding:0;gap:0;background:#fff;border:1px solid rgba(0,76,63,.10);border-radius:14px;overflow:hidden;transform:none;box-shadow:none;transition:border-color .2s,box-shadow .2s}
.card.pc:hover{transform:none;border-color:rgba(0,76,63,.22);box-shadow:0 10px 30px rgba(15,26,13,.06)}
.pc-media{position:relative;aspect-ratio:3/2;background:#EEEAE1;overflow:hidden;flex-shrink:0}
.pc-slides{display:flex;height:100%;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scrollbar-width:none;overscroll-behavior-x:contain}
.pc-slides::-webkit-scrollbar{display:none}
.pc-slides img{flex:0 0 100%;width:100%;height:100%;object-fit:cover;scroll-snap-align:start;display:block}
.pc-dots{position:absolute;left:0;right:0;bottom:10px;display:flex;justify-content:center;gap:5px;pointer-events:none}
.pc-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.55);box-shadow:0 0 3px rgba(0,0,0,.25);transition:background .2s}
.pc-dot.on{background:#fff}
.pc-nav{position:absolute;top:50%;margin-top:-16px;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.94);color:#0F1A0D;display:flex;align-items:center;justify-content:center;font-size:13px;opacity:0;transition:opacity .2s;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.14)}
.pc-prev{left:10px}.pc-next{right:10px}
@media(hover:hover){.card.pc:hover .pc-nav{opacity:1}}
.card.pc .pc-nav.off{opacity:0;pointer-events:none}
.pc-mono{height:100%;display:flex;align-items:center;justify-content:center;position:relative}
.pc-ini{font-family:'Fraunces',serif;font-weight:300;font-size:60px;color:var(--g);letter-spacing:2px;line-height:1}
.pc-logo{width:84px;height:84px;border-radius:14px;object-fit:cover;background:#fff}
.pc-mono small{position:absolute;bottom:14px;left:0;right:0;text-align:center;font-size:10.5px;letter-spacing:1.6px;text-transform:uppercase;color:rgba(0,76,63,.55);font-weight:500}
.pc-body{display:flex;flex-direction:column;gap:4px;padding:18px 20px;flex:1}
.pc-name{font-family:'Fraunces',serif;font-size:20px;font-weight:400;letter-spacing:-.2px;line-height:1.25;margin:0;color:var(--td)}
.pc-meta{font-size:13px;color:var(--tm);line-height:1.5;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.pc-extra{font-size:12.5px;color:var(--tl);line-height:1.5;margin:0}
.pc-foot{margin-top:auto;padding-top:14px;display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:13.5px;color:var(--tm)}
.pc-foot strong{font-weight:600;color:var(--td)}
.pc-foot small{font-size:11.5px;color:var(--tl)}
.pc-go{color:var(--g);font-weight:500;white-space:nowrap;display:inline-flex;align-items:center;gap:5px}
.pc-go i{font-size:12px}
.card-villes{font-size:12.5px;color:var(--tm);line-height:1.55;display:flex;gap:6px;align-items:flex-start}
.card-villes i{color:var(--g);margin-top:2px}
.dem-band{max-width:820px;margin:16px auto 0;padding:14px 16px 14px 20px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;background:#fff;border:1px solid rgba(0,76,63,.14);border-radius:14px;font-size:14px;color:var(--tm);line-height:1.5}
.dem-band>div{flex:1 1 300px}
.dem-band strong{color:var(--td)}
.dem-btn{display:inline-flex;align-items:center;gap:7px;padding:10px 16px;border-radius:10px;background:var(--g);color:#fff;font-weight:600;font-size:14px;text-decoration:none;white-space:nowrap}
.dem-btn:hover{background:#00382e}
@media(max-width:860px){.dem-band{margin-left:16px;margin-right:16px}}
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
.vh-groups{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:22px 32px;margin-top:6px}
.vh-group{min-width:0}
.vh-group-wide{grid-column:1/-1}
.vh-group-t a{color:inherit;text-decoration:none}.vh-group-t a:hover{color:var(--g)}
.vh-group-t{font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--tl,#5A6B57);margin:0 0 9px}
.villes-chips a.has{background:rgba(0,76,63,.09);color:var(--g);font-weight:600;border-color:rgba(0,76,63,.2)}
.villes-chips a span{font-size:11px;font-weight:600;opacity:.8}
.join-box{max-width:1100px;margin:8px auto 64px;padding:0 clamp(16px,5vw,40px)}
.join-in{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:20px 32px;padding:26px clamp(20px,3vw,32px);background:#fff;border:1px solid rgba(0,76,63,.10);border-radius:16px}
.join-txt{flex:1 1 420px;min-width:0}
.join-eye{display:block;font-size:10.5px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;color:var(--tl);margin-bottom:8px}
.join-h{font-family:'Fraunces',serif;font-weight:400;font-size:clamp(20px,2.2vw,24px);line-height:1.25;letter-spacing:-.2px;margin:0 0 8px;color:var(--td)}
.join-h em{font-style:italic;font-weight:300;color:var(--g)}
.join-p{margin:0;font-size:14px;line-height:1.65;color:var(--tm);max-width:560px}
.join-act{display:flex;flex-direction:column;align-items:flex-start;gap:10px;flex-shrink:0}
.join-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 20px;border-radius:10px;border:1px solid var(--g);color:var(--g);font-weight:600;font-size:14px;text-decoration:none;transition:background .2s,color .2s}
.join-btn:hover{background:var(--g);color:#fff}
.join-lnk{font-size:13px;color:var(--tl);text-decoration:underline;text-underline-offset:3px}
.join-lnk:hover{color:var(--g)}
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
  // Liste des villes sous la recherche : ouverte au clic, filtrée en tapant ;
  // un choix remplit la recherche, ferme le clavier et montre les résultats
  var sug=document.getElementById('city-sug');
  if(sug){
    var opts=[].slice.call(sug.querySelectorAll('.cs-opt')),none=sug.querySelector('.cs-none'),row=input.closest('.tools-row');
    var nrm=function(v){return String(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()};
    var filt=function(){var q=nrm(input.value),n=0;opts.forEach(function(o){var ok=!q||o.getAttribute('data-n').indexOf(q)>=0;o.hidden=!ok;if(ok)n++});none.hidden=n>0};
    var show=function(){filt();sug.hidden=false;if(window.innerWidth<720&&row){var y=row.getBoundingClientRect().top+window.scrollY-74;window.scrollTo({top:y,behavior:'smooth'})}};
    input.addEventListener('focus',show);
    input.addEventListener('input',function(){if(document.activeElement===input){filt();sug.hidden=false}});
    input.addEventListener('blur',function(){setTimeout(function(){sug.hidden=true},180)});
    input.addEventListener('keydown',function(e){if(e.key==='Escape'){sug.hidden=true}if(e.key==='Enter'){sug.hidden=true;input.blur()}});
    sug.addEventListener('mousedown',function(e){e.preventDefault()});
    sug.addEventListener('click',function(e){
      var o=e.target.closest('.cs-opt');if(!o)return;
      input.value=o.getAttribute('data-city');input.dispatchEvent(new Event('input'));
      sug.hidden=true;input.blur();
      var res=document.querySelector('.grid')||document.getElementById('search-empty');
      if(res)setTimeout(function(){window.scrollTo({top:res.getBoundingClientRect().top+window.scrollY-130,behavior:'smooth'})},120);
    });
  }
  var links=[].slice.call(document.querySelectorAll('#dem-link,#search-demande'));
  links.forEach(function(l){l.setAttribute('data-base',l.getAttribute('href'))});
  input.addEventListener('input',function(){var v=input.value.trim();links.forEach(function(l){l.setAttribute('href',l.getAttribute('data-base')+(v?'&ville='+encodeURIComponent(v):''))})});
})();
(function(){
  [].forEach.call(document.querySelectorAll('.pc-slides'),function(sl){
    var card=sl.parentNode;var dots=card.querySelectorAll('.pc-dot');if(dots.length<2)return;
    var prev=card.querySelector('.pc-prev'),next=card.querySelector('.pc-next'),raf=0;
    function idx(){return Math.round(sl.scrollLeft/(sl.clientWidth||1))}
    function upd(){raf=0;var i=idx();[].forEach.call(dots,function(d,k){d.classList.toggle('on',k===i)});prev.classList.toggle('off',i<=0);next.classList.toggle('off',i>=dots.length-1)}
    function go(d,e){e.preventDefault();e.stopPropagation();sl.scrollTo({left:(idx()+d)*sl.clientWidth,behavior:'smooth'})}
    prev.addEventListener('click',function(e){go(-1,e)});
    next.addEventListener('click',function(e){go(1,e)});
    sl.addEventListener('scroll',function(){if(!raf)raf=requestAnimationFrame(upd)},{passive:true});
    upd();
  });
})();
</script>`
