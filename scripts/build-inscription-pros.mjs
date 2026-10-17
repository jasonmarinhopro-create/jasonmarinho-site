#!/usr/bin/env node
// Pages d'inscription des pros (13/10/2026, Jason : « revoir l'inscription avec
// les nouveautés, une belle DA qui leur donne envie ») :
//   /annuaires/photographes/inscription  et  /annuaires/menage/inscription
// Même gabarit pour les deux : bandeau vert avec le prix et les places
// Fondateur en direct, formulaire en 4 étapes, aperçu en direct de la carte
// du pro dans l'annuaire (design « Monogramme »), ce que la fiche apporte
// (site vitrine, page de la ville, demandes d'hôtes, statistiques, photos et
// formules ajoutées ensuite depuis l'espace), FAQ courte.
// Les identifiants des champs sont ceux lus par api/photographer/signup.js et
// api/cleaner/signup.js : ne pas les renommer.
// Usage : node scripts/build-inscription-pros.mjs  (pages statiques, pas lancé au build)

import { METIERS_VISUELS, OPTIONS_VISUELLES } from './lib/pro-visuel.mjs'
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
const cities = loadCities().map(c => c.name).filter(Boolean).sort((a, b) => a.localeCompare(b, 'fr'))

const field = ({ id, label, req, hint, type = 'text', ph, attrs = '', full }) => `
        <div class="f${full ? ' full' : ''}">
          <label for="${id}">${label}${req ? ' <span class="req" aria-hidden="true">*</span>' : ' <small>facultatif</small>'}</label>
          <input type="${type === 'url' ? 'text' : type}" id="${id}" name="${id}"${type === 'url' ? ' data-url inputmode="url" autocapitalize="off" autocorrect="off" spellcheck="false"' : ''}${req ? ' required' : ''}${ph ? ` placeholder="${esc(ph)}"` : ''} ${attrs}>
          ${hint ? `<span class="hint">${hint}</span>` : ''}
        </div>`

const select = ({ id, label, options, hint, full }) => `
        <div class="f${full ? ' full' : ''}">
          <label for="${id}">${label} <small>facultatif</small></label>
          <select id="${id}" name="${id}"><option value="">Choisir</option>${options.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('')}</select>
          ${hint ? `<span class="hint">${hint}</span>` : ''}
        </div>`

const step = (n, title, sub, body) => `
    <section class="step-card" aria-labelledby="st${n}">
      <header class="step-head"><span class="step-n">${n}</span><div><h2 id="st${n}">${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div></header>
      <div class="grid">${body}
      </div>
    </section>`

const accountFields = (cfg) => `${cfg.key === 'menage'
  ? field({ id: 'fullName', label: 'Ton prénom et ton nom', req: true, ph: 'Marie Dupont', attrs: 'autocomplete="name" maxlength="100"' })
    + field({ id: 'pseudo', label: 'Nom de ton entreprise', ph: 'Bee Clean Marseille', hint: 'C’est lui que verront les hôtes. Sinon, ton nom.', attrs: 'maxlength="100"' })
  : field({ id: 'fullName', label: 'Ton prénom et ton nom', req: true, ph: 'Marie Dupont', attrs: 'autocomplete="name" maxlength="100"', hint: 'Affiché sur ta fiche.' })
    + field({ id: 'telephone', label: 'Téléphone', type: 'tel', ph: '06 12 34 56 78', attrs: 'autocomplete="tel"' })}
${field({ id: 'email', label: 'E-mail pro', req: true, type: 'email', ph: cfg.emailPh, attrs: 'autocomplete="email"', hint: 'Les demandes des hôtes arrivent ici. C’est aussi ton identifiant.' })}
        <div class="f">
          <label for="password">Mot de passe <span class="req" aria-hidden="true">*</span></label>
          <div class="pw"><input type="password" id="password" name="password" required minlength="8" autocomplete="new-password" placeholder="8 caractères minimum"><button type="button" class="pw-eye" aria-label="Afficher le mot de passe" data-show><i class="ph-bold ph-eye"></i></button></div>
          <span class="hint">Pour modifier ta fiche quand tu veux sur app.jasonmarinho.com.</span>
        </div>
${cfg.key === 'menage' ? field({ id: 'telephone', label: 'Téléphone', type: 'tel', ph: '06 12 34 56 78', attrs: 'autocomplete="tel"' }) : ''}`

const whereFields = cfg => `
${field({ id: 'ville', label: 'Ta ville principale', req: true, ph: cfg.villePh, attrs: 'list="villes" autocomplete="address-level2" maxlength="80"', hint: 'Ta fiche apparaît sur la page de ta ville quand elle existe.' })}
${field({ id: 'zoneCouverte', label: 'Ta zone', ph: cfg.zonePh, attrs: 'maxlength="200"', hint: 'Tu pourras ajouter jusqu’à 10 villes depuis ton espace.' })}`

const PHOTO = {
  key: 'photographe',
  dir: 'photographes',
  title: 'Inscription photographe ou vidéaste Airbnb : ta fiche',
  desc: 'Crée ta fiche de photographe ou de vidéaste location courte durée : site vitrine sur Google, demandes d’hôtes en direct, statistiques. Sans commission.',
  metier: 'Photographe',
  eye: 'Annuaire · photographes et vidéastes location courte durée',
  h1: 'Tes photos et tes vidéos, vues par <em>les hôtes de ta ville</em>',
  lead: 'Ta fiche sert de site vitrine sur Google : tes photos, ta vidéo, tes formules, ta zone. Les hôtes te contactent directement et les demandes de ta zone arrivent chez toi. En ligne quelques minutes après le paiement, sans validation à attendre.',
  brd: ['/devenir-photographe-lcd', 'Photographes LCD'],
  apiPath: '/api/photographer/signup',
  placesKey: 'photographers',
  emailPh: 'marie@studio-photo.fr',
  villePh: 'Lyon',
  zonePh: 'Lyon + 60 km',
  exemple: '/annuaires/photographes/exemple-fiche',
  stats: '/devenir-photographe-lcd#exemple-stats',
  devenir: '/devenir-photographe-lcd',
  specialiteId: 'specialite',
  benefits: [
    ['ph-globe', 'Un site vitrine sur Google', 'Ta fiche est indexée, avec un lien direct (dofollow) vers ton site ou ton portfolio.'],
    ['ph-map-pin', 'Sur la page de ta ville', 'Les hôtes qui cherchent « photographe Airbnb » + ta ville tombent sur toi.'],
    ['ph-paper-plane-tilt', 'Les demandes viennent à toi', 'Quand un hôte de ta zone décrit son besoin, il arrive chez les 3 pros les plus proches.'],
    ['ph-play-circle', 'Ta vidéo en haut de ta fiche', 'Un lien YouTube ou Vimeo se lit sur ta fiche. Les hôtes filtrent par photographe, vidéaste ou drone.'],
    ['ph-images', 'Photos et formules', 'Ajoute ensuite 6 photos, tes formules et ta façon de travailler depuis ton espace.'],
    ['ph-chart-line-up', 'Tes statistiques', 'Visiteurs, clics, demandes et recherches Google, avec un bilan chaque mois.'],
    ['ph-file-text', 'Devis en ligne', 'Envoie un devis propre en 2 minutes, accepté en ligne par l’hôte.'],
  ],
  offerFields: `
        <div class="f full">
          <label>Tu proposes <span class="req" aria-hidden="true">*</span></label>
          <div class="chips" role="radiogroup" aria-label="Tu proposes">${METIERS_VISUELS.map((m, i) => `<label class="chip"><input type="radio" name="metier" value="${m.key}"${i === 0 ? ' checked' : ''}><span><i class="ph-bold ph-${m.icon}" style="margin-right:6px"></i>${esc(m.label)}</span></label>`).join('')}</div>
          <span class="hint">Les hôtes filtrent l’annuaire par photographe, vidéaste ou les deux.</span>
        </div>
        <div class="f full">
          <label>Options proposées <small>facultatif</small></label>
          <div class="chips">${OPTIONS_VISUELLES.map(o => `<label class="chip"><input type="checkbox" name="options" value="${o.key}"><span><i class="ph-bold ph-${o.icon}" style="margin-right:6px"></i>${esc(o.label)}</span></label>`).join('')}</div>
        </div>
${field({ id: 'portfolioUrl', label: 'Ton site ou ton portfolio', req: true, type: 'url', ph: 'monsite.fr ou instagram.com/moncompte', attrs: 'maxlength="300"', hint: 'Le bouton « Voir le portfolio » de ta fiche y mène. Un compte Instagram pro marche aussi (@moncompte).', full: true })}
${field({ id: 'videoUrl', label: 'Lien vers tes vidéos', type: 'url', ph: 'youtube.com/watch?v=… ou ta chaîne, Vimeo, Instagram', attrs: 'maxlength="300"', hint: 'Une vidéo YouTube ou Vimeo se lit directement en haut de ta fiche. Une chaîne ou un compte : un bouton « Voir les vidéos ».', full: true })}
${field({ id: 'instagramHandle', label: 'Instagram', ph: 'marie.photo', attrs: 'maxlength="50"', hint: 'Sans le @.' })}
${select({ id: 'specialite', label: 'Ta spécialité', options: [['Intérieurs LCD', 'Intérieurs de location courte durée'], ['Intérieurs + drone extérieur', 'Intérieurs + drone extérieur'], ['Intérieurs + vidéo / Reels', 'Intérieurs + vidéo / Reels'], ['Vidéo de visite du logement', 'Vidéo de visite du logement'], ['Visite virtuelle Matterport 3D', 'Visite virtuelle 3D'], ['Hôtels et gîtes de charme', 'Hôtels et gîtes de charme'], ['Architecture + mise en scène', 'Architecture + mise en scène']] })}
${field({ id: 'tarifMin', label: 'Prix de départ d’une séance (€)', type: 'number', ph: '250', attrs: 'min="0" max="5000" inputmode="numeric"', hint: 'Affiché « dès 250 € » sur ta carte.' })}
${field({ id: 'tarifMax', label: 'Prix d’une grosse séance (€)', type: 'number', ph: '600', attrs: 'min="0" max="5000" inputmode="numeric"' })}`,
  bioPh: 'Depuis quand tu photographies ou filmes des locations, ce que les hôtes aiment dans ton travail, comment se passe une séance. Quelques lignes suffisent.',
  ids: ['fullName', 'email', 'password', 'ville', 'zoneCouverte', 'portfolioUrl', 'videoUrl', 'instagramHandle', 'telephone', 'specialite', 'tarifMin', 'tarifMax', 'bio'],
  extraCollect: `
    var mt = form.querySelector('input[name="metier"]:checked')
    data.metier = mt ? mt.value : 'photo'
    data.options = Array.from(form.querySelectorAll('input[name="options"]:checked')).map(function (i) { return i.value })`,
  faq: [
    ['Y a-t-il une validation de mon profil ?', 'Non. Ta fiche est en ligne quelques minutes après le paiement. Tu la complètes ensuite quand tu veux depuis ton espace.'],
    ['Je suis vidéaste, pas photographe : c’est pour moi ?', 'Oui. Choisis « Vidéaste » ou « Photographe et vidéaste » : les hôtes filtrent l’annuaire selon ce qu’ils cherchent, et ta vidéo se lit en haut de ta fiche.'],
    ['Je n’ai pas encore mes photos sous la main', 'Pas de souci : tu ajoutes tes photos, tes formules et tes villes après l’inscription, depuis ton espace. En attendant, ta carte affiche tes initiales.'],
    ['Prenez-vous une commission sur mes séances ?', 'Non, jamais. Les hôtes te contactent directement et le devis, la séance et le paiement se règlent entre vous.'],
    ['Comment arrêter ?', 'Ton abonnement est annuel et se résilie à tout moment depuis ton espace, sans frais.'],
  ],
}

const MENAGE = {
  key: 'menage',
  dir: 'menage',
  title: 'Inscription ménage Airbnb : crée ta fiche pro',
  desc: 'Crée la fiche de ton équipe de ménage location courte durée : site vitrine sur Google, demandes d’hôtes en direct, planning de tes clients. Sans commission.',
  metier: 'Équipe de ménage',
  h1: 'Trouve des hôtes <em>près de chez toi</em>',
  lead: 'Ta fiche sert de site vitrine sur Google : tes prestations, tes prix, ta zone. Les hôtes te contactent directement, les demandes de ta zone arrivent chez toi et tu retrouves le planning de tes clients au même endroit.',
  brd: ['/devenir-prestataire-menage-lcd', 'Ménage LCD'],
  apiPath: '/api/cleaner/signup',
  placesKey: 'cleaners',
  emailPh: 'contact@beeclean.fr',
  villePh: 'Marseille',
  zonePh: 'Marseille + littoral',
  exemple: '/annuaires/menage/exemple-fiche',
  stats: '/devenir-prestataire-menage-lcd#exemple-stats',
  devenir: '/devenir-prestataire-menage-lcd',
  specialiteId: 'equipeType',
  benefits: [
    ['ph-globe', 'Un site vitrine sur Google', 'Ta fiche est indexée, avec un lien direct (dofollow) vers ton site.'],
    ['ph-map-pin', 'Sur la page de ta ville', 'Les hôtes qui cherchent « ménage Airbnb » + ta ville tombent sur toi.'],
    ['ph-paper-plane-tilt', 'Les demandes viennent à toi', 'Quand un hôte de ta zone décrit son besoin, il arrive chez les 3 équipes les plus proches.'],
    ['ph-calendar-check', 'Le planning de tes clients', 'Les ménages calculés depuis leurs réservations Airbnb et Booking, avec photos de fin de ménage.'],
    ['ph-chart-line-up', 'Tes statistiques', 'Visiteurs, clics, demandes et recherches Google, avec un bilan chaque mois.'],
    ['ph-images', 'Photos et formules', 'Ajoute ensuite 6 photos, tes formules et ta façon de travailler depuis ton espace.'],
  ],
  offerFields: `
        <div class="f full">
          <label>Ce que fait ton équipe <small>facultatif</small></label>
          <div class="chips">
            ${[['menage_standard', 'Ménage entre deux voyageurs'], ['gestion_linge', 'Gestion du linge'], ['repassage', 'Repassage'], ['reapprovisionnement', 'Réassort des consommables'], ['etat_des_lieux_photo', 'État des lieux en photos'], ['petite_maintenance', 'Petite maintenance'], ['nettoyage_exterieur', 'Extérieurs'], ['gestion_dechets', 'Déchets']].map(([v, t]) => `<label class="chip"><input type="checkbox" name="prestations" value="${v}"><span>${t}</span></label>`).join('')}
          </div>
        </div>
${select({ id: 'equipeType', label: 'Taille de l’équipe', options: [['solo', 'Solo'], ['duo', 'Duo'], ['equipe_3_5', '3 à 5 personnes'], ['equipe_6_plus', '6 personnes ou plus']] })}
${select({ id: 'delaiReservation', label: 'Délai pour réserver', options: [['jour_meme', 'Le jour même'], ['24h', 'Sous 24 h'], ['48h', 'Sous 48 h'], ['72h', 'Sous 72 h']] })}
${field({ id: 'tarifForfaitMin', label: 'Prix d’un ménage, à partir de (€)', type: 'number', ph: '45', attrs: 'min="0" max="999" inputmode="numeric"', hint: 'Affiché « dès 45 € » sur ta carte.' })}
${field({ id: 'tarifForfaitMax', label: 'Jusqu’à (€)', type: 'number', ph: '120', attrs: 'min="0" max="999" inputmode="numeric"' })}
${field({ id: 'tarifHeure', label: 'Tarif horaire (€/h)', type: 'number', ph: '30', attrs: 'min="0" max="200" inputmode="numeric"' })}
${field({ id: 'logementsGeres', label: 'Logements entretenus aujourd’hui', type: 'number', ph: '12', attrs: 'min="0" max="999" inputmode="numeric"' })}
        <div class="f full">
          <label>Langues parlées <small>facultatif</small></label>
          <div class="chips">
            ${[['fr', 'Français', true], ['en', 'English'], ['es', 'Español'], ['it', 'Italiano'], ['de', 'Deutsch'], ['pt', 'Português'], ['ar', 'العربية']].map(([v, t, on]) => `<label class="chip"><input type="checkbox" name="langues" value="${v}"${on ? ' checked' : ''}><span>${t}</span></label>`).join('')}
          </div>
        </div>
${field({ id: 'siteUrl', label: 'Ton site', type: 'url', ph: 'monsite.fr', attrs: 'maxlength="300"' })}
${field({ id: 'instagramHandle', label: 'Instagram', ph: 'beeclean.lcd', attrs: 'maxlength="50"', hint: 'Sans le @.' })}
${field({ id: 'siret', label: 'SIRET', ph: '14 chiffres', attrs: 'maxlength="14" inputmode="numeric"', hint: 'Affiché sur ta fiche : il rassure les hôtes.' })}
        <div class="f full">
          <label class="toggle"><input type="checkbox" id="assuranceRcPro" name="assuranceRcPro"><span>Mon équipe a une assurance responsabilité civile professionnelle</span></label>
        </div>`,
  bioPh: 'Depuis quand vous entretenez des locations, comment vous travaillez (linge, check-list, photos de fin de ménage), ce que les hôtes apprécient. Quelques lignes suffisent.',
  ids: ['fullName', 'pseudo', 'email', 'password', 'telephone', 'ville', 'zoneCouverte', 'siteUrl', 'instagramHandle', 'equipeType', 'logementsGeres', 'delaiReservation', 'tarifForfaitMin', 'tarifForfaitMax', 'tarifHeure', 'siret', 'bio'],
  extraCollect: `
    data.prestations = Array.from(form.querySelectorAll('input[name="prestations"]:checked')).map(function (i) { return i.value })
    data.langues = Array.from(form.querySelectorAll('input[name="langues"]:checked')).map(function (i) { return i.value })
    data.assuranceRcPro = document.getElementById('assuranceRcPro').checked`,
  faq: [
    ['Y a-t-il une validation de mon profil ?', 'Non. Ta fiche est en ligne quelques minutes après le paiement. Tu la complètes ensuite quand tu veux depuis ton espace.'],
    ['Comment marche le planning de mes clients ?', 'L’hôte te partage un lien depuis son app : tes ménages s’affichent tout seuls d’après ses réservations, et tu les marques faits avec des photos.'],
    ['Prenez-vous une commission sur mes ménages ?', 'Non, jamais. Les hôtes te contactent directement et le devis, les ménages et le paiement se règlent entre vous.'],
    ['Comment arrêter ?', 'Ton abonnement est annuel et se résilie à tout moment depuis ton espace, sans frais.'],
  ],
}

const CSS = `
:root{--g:#004C3F;--gd:#003329;--y:#FFD56B;--cr:#F7F5F0;--w:#FDFCF9;--td:#0F1A0D;--tm:#3D5038;--tl:#7A8C77;--bd:rgba(0,76,63,.10)}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Outfit',sans-serif;background:var(--cr);color:var(--td);padding-top:64px}
body::before{content:'';position:fixed;top:0;left:0;right:0;height:64px;background:var(--gd);z-index:100}
.s-in{max-width:1140px;margin:0 auto;padding:0 clamp(16px,5vw,40px)}
.hero{background:radial-gradient(ellipse 60% 70% at 85% 10%,rgba(255,213,107,.10),transparent 70%),linear-gradient(160deg,#001a11 0%,var(--gd) 55%,#00463a 100%);color:#fff;padding:clamp(40px,6vw,64px) 0 clamp(100px,12vw,128px)}
.hero-grid{display:grid;gap:28px;align-items:end}
@media(min-width:960px){.hero-grid{grid-template-columns:minmax(0,1fr) 340px}}
.brd{font-size:13px;color:rgba(255,255,255,.45);margin-bottom:18px}.brd a{color:rgba(255,255,255,.65);text-decoration:none}
.eye{display:inline-block;font-size:11px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;color:rgba(255,213,107,.85);margin-bottom:12px}
h1{font-family:'Fraunces',serif;font-size:clamp(30px,4.6vw,50px);font-weight:400;line-height:1.08;letter-spacing:-.6px;max-width:680px}
h1 em{color:var(--y);font-style:italic;font-weight:300}
.lead{font-size:16px;color:rgba(255,255,255,.75);line-height:1.7;max-width:620px;margin-top:16px}
.ticks{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:20px;font-size:14px;color:rgba(255,255,255,.85)}
.ticks span{display:inline-flex;align-items:center;gap:7px}.ticks i{color:var(--y)}
.price{background:rgba(255,255,255,.06);border:1px solid rgba(255,213,107,.25);border-radius:18px;padding:22px}
.price-eye{font-size:10.5px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.55)}
.price-n{font-family:'Fraunces',serif;font-size:44px;font-weight:300;line-height:1;margin:10px 0 4px;color:#fff}
.price-n small{font-family:'Outfit',sans-serif;font-size:14px;color:rgba(255,255,255,.6);font-weight:400;margin-left:4px}
.price-sub{font-size:13.5px;color:rgba(255,255,255,.7);line-height:1.55}
.places{display:none;align-items:center;gap:7px;margin-top:14px;padding:7px 12px;border-radius:999px;background:rgba(255,213,107,.14);color:var(--y);font-size:12.5px;font-weight:600}
.price-foot{margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.1);font-size:12px;color:rgba(255,255,255,.5);line-height:1.5}
.wrap{max-width:1140px;margin:-76px auto 0;padding:0 clamp(16px,5vw,40px) 40px;display:grid;gap:22px;position:relative}
@media(min-width:980px){.wrap{grid-template-columns:minmax(0,1fr) 340px;align-items:start}}
form{display:flex;flex-direction:column;gap:14px}
.step-card{background:#fff;border:1px solid var(--bd);border-radius:18px;padding:clamp(20px,3vw,28px)}
.step-card:first-child{box-shadow:0 18px 50px rgba(0,30,20,.10)}
.step-head{display:flex;gap:14px;align-items:flex-start;margin-bottom:18px}
.step-n{flex-shrink:0;width:32px;height:32px;border-radius:50%;border:1px solid rgba(0,76,63,.25);color:var(--g);display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-size:16px}
.step-head h2{font-family:'Fraunces',serif;font-size:21px;font-weight:400;line-height:1.25}
.step-head p{font-size:13.5px;color:var(--tl);margin-top:3px;line-height:1.5}
.grid{display:grid;gap:4px 16px}
@media(min-width:640px){.grid{grid-template-columns:1fr 1fr}.f.full{grid-column:1/-1}}
.f{display:flex;flex-direction:column;gap:6px;margin-bottom:12px;min-width:0}
.f label{font-size:13px;font-weight:600;color:var(--tm)}
.f label small{font-weight:400;color:var(--tl);margin-left:2px}
.req{color:#b45309}
.f input[type=text],.f input[type=email],.f input[type=url],.f input[type=tel],.f input[type=number],.f input[type=password],.f select,.f textarea{width:100%;padding:12px 13px;border:1px solid rgba(0,76,63,.18);border-radius:10px;background:#fff;font-family:'Outfit',sans-serif;font-size:15px;color:var(--td);transition:border-color .15s,box-shadow .15s}
.f textarea{min-height:120px;resize:vertical;line-height:1.6}
.f input:focus,.f select:focus,.f textarea:focus{outline:none;border-color:var(--g);box-shadow:0 0 0 3px rgba(0,76,63,.1)}
.hint{font-size:12px;color:var(--tl);line-height:1.5}
.pw{position:relative}.pw input{padding-right:46px!important}
.pw-eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:34px;height:34px;border:0;background:transparent;color:var(--tl);cursor:pointer;border-radius:8px;font-size:17px}
.pw-eye:hover{color:var(--g);background:rgba(0,76,63,.05)}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{position:relative;cursor:pointer}
.chip input{position:absolute;opacity:0;pointer-events:none}
.chip span{display:inline-flex;align-items:center;padding:8px 14px;border-radius:999px;border:1px solid rgba(0,76,63,.18);background:#fff;font-size:13.5px;color:var(--tm);transition:all .15s}
.chip input:checked+span{background:var(--g);border-color:var(--g);color:#fff}
.chip input:focus-visible+span{outline:3px solid rgba(255,213,107,.8);outline-offset:2px}
.toggle{display:flex!important;gap:10px;align-items:flex-start;font-weight:500!important;color:var(--td)!important;font-size:14px!important;padding:12px 14px;border:1px solid rgba(0,76,63,.14);border-radius:10px;cursor:pointer;line-height:1.5}
.toggle input{width:18px;height:18px;accent-color:var(--g);margin-top:2px;flex-shrink:0}
.count{align-self:flex-end}
.submit{background:#fff;border:1px solid var(--bd);border-radius:18px;padding:clamp(20px,3vw,26px)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:16px 22px;border:none;border-radius:12px;background:var(--g);color:#fff;font-family:'Outfit',sans-serif;font-weight:700;font-size:16px;cursor:pointer;transition:background .15s}
.btn:hover:not(:disabled){background:#00382e}.btn:disabled{opacity:.6;cursor:wait}
.btn i{color:var(--y)}
.secure{display:flex;flex-wrap:wrap;gap:6px 16px;justify-content:center;margin-top:12px;font-size:12.5px;color:var(--tl)}
.secure span{display:inline-flex;align-items:center;gap:5px}
.legal{margin-top:12px;font-size:12px;color:var(--tl);line-height:1.6;text-align:center}
.legal a{color:var(--g)}
.err{display:none;padding:12px 14px;background:rgba(220,38,38,.07);border:1px solid rgba(220,38,38,.2);border-radius:10px;color:#b91c1c;font-size:13.5px}
.hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.side{display:flex;flex-direction:column;gap:16px}
@media(min-width:980px){.side{position:sticky;top:84px}}
.box{background:#fff;border:1px solid var(--bd);border-radius:18px;padding:20px}
.box h3{font-family:'Fraunces',serif;font-size:17px;font-weight:400;margin-bottom:12px}
.box-eye{font-size:10.5px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--tl);margin-bottom:10px}
.pc{border:1px solid var(--bd);border-radius:14px;overflow:hidden;background:#fff}
.pc-media{aspect-ratio:3/2;background:#EEEAE1;display:flex;align-items:center;justify-content:center;position:relative}
.pc-ini{font-family:'Fraunces',serif;font-weight:300;font-size:56px;color:var(--g);letter-spacing:2px;line-height:1}
.pc-media small{position:absolute;bottom:12px;left:0;right:0;text-align:center;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:rgba(0,76,63,.55);font-weight:500}
.pc-body{padding:14px 16px;display:flex;flex-direction:column;gap:3px}
.pc-name{font-family:'Fraunces',serif;font-size:18px;color:var(--td);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pc-meta{font-size:12.5px;color:var(--tm);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pc-extra{font-size:12px;color:var(--tl);min-height:18px}
.pc-foot{display:flex;justify-content:space-between;align-items:baseline;margin-top:10px;font-size:13px;color:var(--tm)}
.pc-foot strong{color:var(--td)}
.pc-foot em{font-style:normal;color:var(--g);font-weight:500}
.pc-note{font-size:12px;color:var(--tl);line-height:1.5;margin-top:10px}
.ben{list-style:none;display:flex;flex-direction:column;gap:14px}
.ben li{display:flex;gap:12px;align-items:flex-start}
.ben i{flex-shrink:0;width:34px;height:34px;border-radius:10px;background:rgba(0,76,63,.06);color:var(--g);display:flex;align-items:center;justify-content:center;font-size:17px}
.ben b{display:block;font-size:14px;font-weight:600;color:var(--td);margin-bottom:2px}
.ben span{font-size:13px;color:var(--tm);line-height:1.5}
.links{display:flex;flex-direction:column;gap:8px;margin-top:4px}
.links a{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:11px 14px;border:1px solid var(--bd);border-radius:12px;color:var(--g);font-size:13.5px;font-weight:600;text-decoration:none}
.links a:hover{border-color:rgba(0,76,63,.3)}
.faq{max-width:1140px;margin:0 auto 64px;padding:0 clamp(16px,5vw,40px)}
.faq h2{font-family:'Fraunces',serif;font-size:24px;font-weight:400;margin-bottom:14px}
.faq-grid{display:grid;gap:12px}
@media(min-width:760px){.faq-grid{grid-template-columns:1fr 1fr}}
.faq-item{background:#fff;border:1px solid var(--bd);border-radius:14px;padding:18px 20px}
.faq-item h3{font-size:15px;font-weight:600;color:var(--td);margin-bottom:6px}
.faq-item p{font-size:14px;color:var(--tm);line-height:1.6}
`

function page(cfg) {
  const url = `https://jasonmarinho.com/annuaires/${cfg.dir}/inscription`
  const extraLabel = cfg.key === 'menage' ? 'type d’équipe' : 'spécialité'
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(cfg.title)}</title>
<meta name="description" content="${esc(cfg.desc)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(cfg.title)}">
<meta property="og:description" content="${esc(cfg.desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://jasonmarinho.com/couverture-jason.webp">
<link rel="shortcut icon" href="/favicon.ico">
<link rel="icon" href="/favicon.ico?v=2026-06" sizes="any">
<link rel="icon" type="image/png" sizes="96x96" href="/icon-96.png?v=2026-06">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2026-06">
<link rel="manifest" href="/manifest.json?v=2026-06">
<meta name="theme-color" content="#004C3F">
<link rel="stylesheet" href="/fonts/site-fonts.css?v=0e07aaf42e">
<link rel="stylesheet" type="text/css" href="/fonts/phosphor-bold-subset.css?v=29999e9550">
<link rel="stylesheet" type="text/css" href="/fonts/phosphor-regular-subset.css?v=868073a0d4">
<style>${CSS}</style>
<script defer src="/nav.js"></script>
</head>
<body>
<header class="hero">
  <div class="s-in hero-grid">
    <div>
      <div class="brd"><a href="/">Accueil</a> · <a href="${cfg.brd[0]}">${cfg.brd[1]}</a> · <span>Créer ma fiche</span></div>
      <span class="eye">${esc(cfg.eye || `Annuaire · ${cfg.metier.toLowerCase()}s location courte durée`)}</span>
      <h1>${cfg.h1}</h1>
      <p class="lead">${esc(cfg.lead)}</p>
      <div class="ticks">
        <span><i class="ph-bold ph-check"></i>En ligne en quelques minutes</span>
        <span><i class="ph-bold ph-check"></i>Aucune commission</span>
        <span><i class="ph-bold ph-check"></i>Résiliable à tout moment</span>
      </div>
    </div>
    <aside class="price" aria-label="Prix de la fiche">
      <div class="price-eye">Tarif Fondateur</div>
      <div class="price-n">39,98 €<small>TTC / an</small></div>
      <div class="price-sub">À vie pour les 20 premiers inscrits, appliqué tout seul. Ensuite 79,98 € TTC / an.</div>
      <div class="places" id="places"><i class="ph-bold ph-hourglass-medium"></i><span></span></div>
      <div class="price-foot">Soit moins de 3,50 € par mois. TVA non applicable, art. 293 B du CGI.</div>
    </aside>
  </div>
</header>

<main class="wrap">
  <form id="signup-form" novalidate>
    <div id="err-box" class="err" role="alert"></div>
${step(1, 'Ton compte', 'Pour gérer ta fiche et recevoir les demandes.', accountFields(cfg))}
${step(2, 'Où tu travailles', 'Les hôtes cherchent d’abord par ville.', whereFields(cfg))}
${step(3, cfg.key === 'menage' ? 'Ce que propose ton équipe' : 'Ton travail', 'Tout se modifie ensuite depuis ton espace.', cfg.offerFields)}
${step(4, cfg.key === 'menage' ? 'Ton équipe en quelques mots' : 'Toi en quelques mots', 'C’est ce que les hôtes lisent en premier sur ta fiche.', `
        <div class="f full">
          <label for="bio">Présentation <small>facultatif</small></label>
          <textarea id="bio" name="bio" maxlength="600" placeholder="${esc(cfg.bioPh)}"></textarea>
          <span class="hint count" id="bio-count">0 / 600</span>
        </div>`)}
    <div class="hp" aria-hidden="true"><label>Site web (laisser vide)</label><input type="text" name="website" tabindex="-1" autocomplete="off"></div>
    <div class="submit">
      <button type="submit" class="btn" id="submit-btn"><i class="ph-bold ph-lock-key"></i><span>Continuer vers le paiement sécurisé</span></button>
      <div class="secure"><span><i class="ph-bold ph-shield-check"></i>Paiement par Stripe</span><span><i class="ph-bold ph-clock"></i>Fiche en ligne en quelques minutes</span><span><i class="ph-bold ph-x-circle"></i>Résiliable à tout moment</span></div>
      <p class="legal">En continuant, tu acceptes les <a href="/cgvu">CGV / CGU</a> et la <a href="/politique-de-confidentialite#annuaire">politique de confidentialité</a>.</p>
    </div>
  </form>

  <aside class="side">
    <div class="box">
      <div class="box-eye">Ta carte dans l’annuaire</div>
      <div class="pc" aria-live="polite">
        <div class="pc-media"><span class="pc-ini" id="pv-ini">${cfg.key === 'menage' ? 'BC' : 'MD'}</span><small>${esc(cfg.metier)}</small></div>
        <div class="pc-body">
          <div class="pc-name" id="pv-name">${cfg.key === 'menage' ? 'Ton entreprise' : 'Ton nom'}</div>
          <div class="pc-meta" id="pv-meta">Ta ville</div>
          <div class="pc-extra" id="pv-extra"></div>
          <div class="pc-foot"><span id="pv-price">Tarifs sur la fiche</span><em>Voir la fiche →</em></div>
        </div>
      </div>
      <p class="pc-note">Elle se remplit pendant que tu tapes. Tes photos, ajoutées ensuite depuis ton espace, remplacent les initiales.</p>
    </div>
    <div class="box">
      <h3>Ce que ta fiche t’apporte</h3>
      <ul class="ben">
        ${cfg.benefits.map(([icon, t, d]) => `<li><i class="ph-bold ${icon}"></i><div><b>${esc(t)}</b><span>${esc(d)}</span></div></li>`).join('\n        ')}
      </ul>
    </div>
    <div class="box">
      <h3>Voir avant de t’inscrire</h3>
      <div class="links">
        <a href="${cfg.exemple}">Un exemple de fiche <i class="ph-bold ph-arrow-right"></i></a>
        <a href="${cfg.stats}">Un exemple de statistiques <i class="ph-bold ph-arrow-right"></i></a>
        <a href="/chiffres">La visibilité réelle du site <i class="ph-bold ph-arrow-right"></i></a>
        <a href="${cfg.devenir}">Tout sur l’annuaire <i class="ph-bold ph-arrow-right"></i></a>
      </div>
    </div>
  </aside>
</main>

<section class="faq" aria-labelledby="faq-t">
  <h2 id="faq-t">Questions fréquentes</h2>
  <div class="faq-grid">
    ${cfg.faq.map(([q, a]) => `<div class="faq-item"><h3>${esc(q)}</h3><p>${esc(a)}</p></div>`).join('\n    ')}
  </div>
</section>

<datalist id="villes">${cities.map(c => `<option value="${esc(c)}">`).join('')}</datalist>

<script>
(function () {
  var t0 = Date.now()
  var form = document.getElementById('signup-form')
  var errBox = document.getElementById('err-box')
  var btn = document.getElementById('submit-btn')
  var BTN = btn.innerHTML
  var $ = function (id) { return document.getElementById(id) }

  // Places Fondateur restantes (rien d'affiché si l'API ne répond pas)
  fetch('/api/annuaire-places').then(function (r) { return r.ok ? r.json() : null }).then(function (d) {
    var n = d && d.${cfg.placesKey}
    if (typeof n !== 'number') return
    if (n <= 0) {
      // Places Fondateur épuisées : prix normal
      document.querySelector('.price-eye').textContent = 'Tarif annuel'
      document.querySelector('.price-n').innerHTML = '79,98 €<small>TTC / an</small>'
      document.querySelector('.price-sub').textContent = 'Les 20 places Fondateur sont prises. Tout est compris, sans commission.'
      document.querySelector('.price-foot').textContent = 'Soit moins de 6,70 € par mois. TVA non applicable, art. 293 B du CGI.'
      return
    }
    var el = $('places')
    el.querySelector('span').textContent = 'Plus que ' + n + ' place' + (n > 1 ? 's' : '') + ' à ce prix'
    el.style.display = 'inline-flex'
  }).catch(function () {})

  // Afficher le mot de passe
  document.querySelectorAll('[data-show]').forEach(function (b) {
    b.addEventListener('click', function () {
      var i = b.parentNode.querySelector('input')
      var show = i.type === 'password'
      i.type = show ? 'text' : 'password'
      b.innerHTML = show ? '<i class="ph-bold ph-eye-slash"></i>' : '<i class="ph-bold ph-eye"></i>'
      b.setAttribute('aria-label', show ? 'Masquer le mot de passe' : 'Afficher le mot de passe')
    })
  })

  var bio = $('bio')
  bio.addEventListener('input', function () { $('bio-count').textContent = bio.value.length + ' / 600' })

  // Aperçu de la carte
  function initials(s) { return s.split(/\\s+/).filter(function (w) { return /^[A-Za-zÀ-ÿ]/.test(w) }).map(function (w) { return w[0] }).slice(0, 2).join('').toUpperCase() }
  function val(id) { var el = $(id); return el ? el.value.trim() : '' }
  function selText(id) { var el = $(id); return el && el.value ? el.options[el.selectedIndex].text : '' }
  function preview() {
    var name = ${cfg.key === 'menage' ? "val('pseudo') || val('fullName')" : "val('fullName')"}
    $('pv-name').textContent = name || '${cfg.key === 'menage' ? 'Ton entreprise' : 'Ton nom'}'
    $('pv-ini').textContent = initials(name) || '${cfg.key === 'menage' ? 'BC' : 'MD'}'
    var zone = val('zoneCouverte')
    $('pv-meta').textContent = [val('ville') || 'Ta ville', zone].filter(Boolean).join(' · ')
    ${cfg.key === 'menage' ? `$('pv-extra').textContent = selText('${cfg.specialiteId}')` : `var mt = form.querySelector('input[name="metier"]:checked'); var ml = mt ? mt.parentNode.textContent.trim() : 'Photographe'
    $('pv-extra').textContent = [ml, selText('${cfg.specialiteId}')].filter(Boolean).join(' · ')
    var pm = document.querySelector('.pc-media small'); if (pm) pm.textContent = ml`}
    var p = parseInt(val('${cfg.key === 'menage' ? 'tarifForfaitMin' : 'tarifMin'}'), 10)
    $('pv-price').innerHTML = p > 0 ? 'dès <strong>' + p + ' €</strong>' : 'Tarifs sur la fiche'
  }
  form.addEventListener('input', preview)
  form.addEventListener('change', preview)

  function showError(msg, focusEl) {
    errBox.textContent = msg
    errBox.style.display = 'block'
    btn.disabled = false; btn.innerHTML = BTN
    if (focusEl) focusEl.focus()
    errBox.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // Adresse de site tolérante (15/10/2026, inscription bloquée sur « l'adresse
  // semble incorrecte ») : « monsite.fr » ou « www… » reçoivent https://,
  // « @compte » devient le lien Instagram. Même règle côté serveur (signup.js).
  function normUrl(v) {
    v = (v || '').trim().replace(/\\s+/g, '')
    if (!v) return ''
    if (/^@[\\w.]{1,30}$/.test(v)) return 'https://www.instagram.com/' + v.slice(1)
    if (!/^https?:\\/\\//i.test(v)) v = 'https://' + v.replace(/^\\/+/, '')
    return v
  }
  function urlOk(v) { return /^https?:\\/\\/[^\\s\\/.]+(\\.[^\\s\\/.]+)+/i.test(v) }
  Array.prototype.forEach.call(form.querySelectorAll('[data-url]'), function (el) {
    el.addEventListener('blur', function () { el.value = normUrl(el.value) })
  })
  function labelOf(el) {
    var label = form.querySelector('label[for="' + el.id + '"]')
    return label ? label.childNodes[0].textContent.trim() : 'Un champ'
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault()
    errBox.style.display = 'none'
    Array.prototype.forEach.call(form.querySelectorAll('[data-url]'), function (el) { el.value = normUrl(el.value) })
    var missing = Array.prototype.find.call(form.querySelectorAll('[required]'), function (el) { return !el.value.trim() || !el.checkValidity() })
    if (missing) {
      var name = labelOf(missing)
      var msg = missing.id === 'password' ? 'Le mot de passe doit faire au moins 8 caractères.'
        : missing.id === 'email' && missing.validity && missing.validity.typeMismatch ? 'E-mail pro : cette adresse e-mail semble incomplète (exemple : prenom@domaine.fr).'
        : name + ' : à remplir.'
      return showError(msg, missing)
    }
    var badUrl = Array.prototype.find.call(form.querySelectorAll('[data-url]'), function (el) { return el.value && !urlOk(el.value) })
    if (badUrl) return showError(labelOf(badUrl) + ' : ce lien ne ressemble pas à une adresse de site (exemple : monsite.fr ou instagram.com/moncompte).', badUrl)
    btn.disabled = true
    btn.innerHTML = '<i class="ph-bold ph-spinner"></i><span>Préparation du paiement…</span>'
    var data = { t: t0, website: form.website ? form.website.value : '' }
    try { data.acq = window.__jmAcq || JSON.parse(sessionStorage.getItem('jm_acq') || 'null') } catch (err) { data.acq = null }
    ${JSON.stringify(cfg.ids)}.forEach(function (k) { data[k] = val(k) })${cfg.extraCollect}
    var ctrl = new AbortController()
    var timer = setTimeout(function () { ctrl.abort() }, 30000)
    try {
      var res = await fetch('${cfg.apiPath}', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: ctrl.signal })
      clearTimeout(timer)
      var body = {}
      try { body = await res.json() } catch (err) { body = {} }
      if (!res.ok) return showError(body.error || 'Le serveur n’a pas pu enregistrer ta fiche. Réessaie dans un instant.')
      if (!body.checkoutUrl) return showError('Le paiement n’a pas pu être préparé. Écris-nous à contact@jasonmarinho.com, on règle ça vite.')
      window.location.assign(body.checkoutUrl)
    } catch (err) {
      clearTimeout(timer)
      showError(err && err.name === 'AbortError' ? 'Le serveur met trop de temps à répondre. Réessaie, ou écris à contact@jasonmarinho.com.' : 'Connexion impossible. Vérifie ta connexion internet et réessaie.')
    }
  })
})()
</script>
<script defer src="/footer.js"></script>
<script src="/cookie-banner.js" defer></script>
</body>
</html>
`
}

for (const cfg of [PHOTO, MENAGE]) {
  if (cfg.title.length > 60) throw new Error(`Titre trop long (${cfg.title.length}) : ${cfg.title}`)
  const html = page(cfg)
  if (html.includes('—')) throw new Error('Tiret cadratin dans la page ' + cfg.key)
  fs.writeFileSync(path.join(ROOT, 'annuaires', cfg.dir, 'inscription', 'index.html'), html, 'utf8')
  console.log(`[inscription-pros] annuaires/${cfg.dir}/inscription`)
}
