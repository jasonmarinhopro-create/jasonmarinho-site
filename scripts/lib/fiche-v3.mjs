// Fiche pro, version 3 (24/10/2026). Jason a choisi la direction A des
// maquettes (artifact « Fiches pros, version 3 ») : « le portfolio d'abord »,
// cohérente entre photographes, vidéastes et équipes de ménage, belle même
// quand le pro n'a pas tout rempli (pas de photo, pas de prix, pas de bio).
//   - en haut : les photos en grand (carrousel sur téléphone, mosaïque sur
//     ordinateur), le nom posé dessus ; sans photo, un bandeau vert soigné ;
//   - 3 repères, la vidéo, les formules, la présentation (coupée),
//     « Ce que … propose », la zone (carte compacte), les liens ;
//   - à droite sur ordinateur, une carte de contact qui reste visible ;
//     sur téléphone, un bouton fixe en bas ;
//   - le contact en 2 étapes dans une fenêtre : le besoin en 2 touches,
//     puis prénom et e-mail (date et détail facultatifs).
// Utilisée par build-photographers.mjs et build-cleaners.mjs.

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
const euros = n => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`

// Mêmes logements que /trouver-un-pro (lib/demandes/rules.ts)
export const LOGEMENTS = ['Studio ou T1', 'T2 ou T3', 'T4 et plus', 'Maison', 'Plusieurs logements']

/** Formules affichables (3 au plus, nom obligatoire) */
export function v3Formules(raw) {
  return (Array.isArray(raw) ? raw : [])
    .filter(f => f && typeof f.nom === 'string' && f.nom.trim())
    .slice(0, 3)
    .map(f => ({ nom: f.nom.trim(), prix: typeof f.prix === 'number' && f.prix > 0 ? f.prix : null, detail: typeof f.detail === 'string' ? f.detail.trim() : '' }))
}

/** Prix affiché dans la carte de contact : « dès 230 € », une fourchette, sinon « Sur devis » */
export function v3Prix(formules, tarifMin, tarifMax) {
  const prix = v3Formules(formules).map(f => f.prix).filter(Boolean)
  if (typeof tarifMin === 'number' && tarifMin > 0) prix.push(tarifMin)
  if (prix.length) return { v: `dès ${euros(Math.min(...prix))}`, devis: false }
  if (typeof tarifMax === 'number' && tarifMax > 0) return { v: `jusqu’à ${euros(tarifMax)}`, devis: false }
  return { v: 'Sur devis', devis: true }
}

function galleryHtml(photos, name) {
  const n = photos.length
  if (!n) return ''
  const slides = photos.map((p, i) => `<button type="button" class="fx-ph" data-vt-open="${i}" data-vt-full="${esc(p.full)}" aria-label="Agrandir la photo ${i + 1} sur ${n}"><img src="${esc(p.thumb)}" alt="Photo ${i + 1} sur ${n}, par ${esc(name)}" width="800" height="600"${i === 0 ? ' fetchpriority="high"' : ' loading="lazy"'}></button>`).join('')
  return `<div class="fx-gal n${Math.min(n, 5)}" id="photos">
    <div class="fx-car" tabindex="-1">${slides}</div>
    ${n > 1 ? `<span class="fx-cnt" aria-hidden="true"><b>1</b> / ${n}</span>` : ''}
    ${n > 1 ? `<button type="button" class="fx-all" data-vt-open="0"><i class="ph-bold ph-images"></i>Voir les ${n} photos</button>` : ''}
  </div>
<dialog class="vt-lb" id="vt-lb" aria-label="Photos en grand">
  <button type="button" class="vt-lb-x" data-vt-close aria-label="Fermer"><i class="ph-bold ph-x"></i></button>
  <button type="button" class="vt-lb-nav prev" data-vt-prev aria-label="Photo précédente"><i class="ph-bold ph-caret-left"></i></button>
  <img alt="">
  <button type="button" class="vt-lb-nav next" data-vt-next aria-label="Photo suivante"><i class="ph-bold ph-caret-right"></i></button>
  <div class="vt-lb-n"></div>
</dialog>`
}

function avatarHtml(m, cls = '') {
  return m.logoUrl
    ? `<span class="fx-av ${cls}" style="background-image:url('${esc(m.logoUrl)}')" role="img" aria-label="${esc(m.name)}"></span>`
    : `<span class="fx-av ${cls} ini" aria-hidden="true">${esc(m.initials)}</span>`
}

function contactSheetHtml(m) {
  const pill = (name, v, type) => `<label class="fx-pill"><input type="${type}" name="${name}" value="${esc(v)}"><span>${esc(v)}</span></label>`
  return `<dialog class="fx-sheet" id="contact" aria-label="Demander un devis à ${esc(m.firstName)}">
  <form class="fx-form" id="contact-form" novalidate>
    <div class="fx-sh-top"><div class="fx-steps"><i class="on"></i><i></i></div><button type="button" class="fx-x" data-fx-close aria-label="Fermer"><i class="ph-bold ph-x"></i></button></div>
    <div class="fx-step" data-step="1">
      <h2>Ton besoin</h2>
      <fieldset><legend>Ce qu’il te faut</legend><div class="fx-pills">${m.besoins.map(b => pill('besoin', b, 'checkbox')).join('')}</div></fieldset>
      <fieldset><legend>Ton logement</legend><div class="fx-pills">${LOGEMENTS.map(l => pill('logement', l, 'radio')).join('')}</div></fieldset>
      <p class="fx-err" data-err="1" hidden></p>
      <button type="button" class="fx-btn g" data-fx-next>Continuer <i class="ph-bold ph-arrow-right"></i></button>
      <p class="fx-fine">Gratuit, sans commission : ${esc(m.firstName)} te répond directement.</p>
    </div>
    <div class="fx-step" data-step="2" hidden>
      <h2>Où ${esc(m.firstName)} te répond</h2>
      <input type="text" name="contactName" placeholder="Ton prénom" autocomplete="given-name" maxlength="100">
      <input type="email" name="contactEmail" placeholder="Ton e-mail" autocomplete="email" maxlength="200">
      <button type="button" class="fx-more" data-fx-more><i class="ph-bold ph-plus"></i>Ajouter une date ou un détail</button>
      <div class="fx-extra" hidden>
        <input type="hidden" name="date" data-date data-today placeholder="Une date souhaitée (facultatif)">
        <textarea name="message" placeholder="${esc(m.placeholder)}" maxlength="1500"></textarea>
      </div>
      <div class="hp" aria-hidden="true"><label>Site</label><input type="text" name="website" tabindex="-1" autocomplete="off"></div>
      <p class="fx-err" data-err="2" hidden></p>
      <button type="submit" class="fx-btn" id="contact-btn"><i class="ph-bold ph-paper-plane-tilt"></i>Envoyer à ${esc(m.firstName)}</button>
      <button type="button" class="fx-back" data-fx-back><i class="ph-bold ph-arrow-left"></i>Retour</button>
      <p class="fx-fine">Ton prénom, ton e-mail et ton message vont à ${esc(m.firstName)} seulement, pour te répondre, et sont supprimés au bout de 3 ans. <a href="/politique-de-confidentialite#annuaire">Confidentialité</a></p>
    </div>
    <div class="fx-done" hidden>
      <span class="fx-ok"><i class="ph-bold ph-check"></i></span>
      <h2>C’est envoyé</h2>
      <p>${esc(m.firstName)} reçoit ta demande par e-mail et te répond directement.</p>
      <a class="fx-btn g" href="${esc(m.annuaire.href)}">${esc(m.annuaire.label)}</a>
    </div>
  </form>
</dialog>`
}

/**
 * Corps de la fiche. `m` : name, firstName, initials, logoUrl, role, sub,
 * crumbs [{href,label}], badges [{icon,label}], photos [{thumb,full}],
 * videoHtml, facts [{v,l}] (3), formules, tarifMin, tarifMax, unite, bio,
 * offerTitle, offers [{icon,label}], zoneHtml, links [{href,label,icon,track,rel}],
 * reseauxHtml, telHtml, besoins, placeholder, reco {href,label},
 * guide {href,label}, annuaire {href,label}, disclaimer.
 */
export function ficheV3Html(m) {
  const forms = v3Formules(m.formules)
  const prix = v3Prix(m.formules, m.tarifMin, m.tarifMax)
  const facts = m.facts.filter(Boolean).slice(0, 3)
  const links = (m.links || []).filter(Boolean)
  const hasPh = m.photos.length > 0
  const ctaLabel = 'Demander un devis'
  return `<main class="fx${hasPh ? '' : ' no-ph'}">
<section class="fx-top">
  <div class="fx-wrap">
    <nav class="fx-brd" aria-label="Fil d’Ariane">${m.crumbs.map(c => c.href ? `<a href="${esc(c.href)}">${esc(c.label)}</a>` : `<span>${esc(c.label)}</span>`).join(' · ')}</nav>
    <div class="fx-hero">
      ${galleryHtml(m.photos, m.name)}
      <div class="fx-id">
        ${avatarHtml(m)}
        <div class="fx-id-t">
          <h1>${esc(m.name)}<span class="fx-role">${esc(m.role)}</span></h1>
          ${m.badges.length ? `<div class="fx-badges">${m.badges.map(b => `<span class="fx-badge${b.tone ? ' ' + b.tone : ''}"><i class="ph-bold ${b.icon}"></i>${esc(b.label)}</span>`).join('')}</div>` : ''}
        </div>
      </div>
    </div>
  </div>
</section>

<div class="fx-wrap fx-body">
  <div class="fx-main">
    ${facts.length ? `<div class="fx-facts n${facts.length}">${facts.map(f => `<div class="fx-fact"><b>${esc(f.v)}</b><span>${esc(f.l)}</span></div>`).join('')}</div>` : ''}
    ${m.videoHtml ? `<section class="fx-sec"><h2>La vidéo</h2>${m.videoHtml}</section>` : ''}
    ${forms.length ? `<section class="fx-sec" id="formules"><h2>Formules</h2>
      <div class="fx-forms n${forms.length}">${forms.map((f, i) => `<div class="fx-fm${forms.length === 3 && i === 1 ? ' hl' : ''}"><span class="fx-fm-n">${esc(f.nom)}</span><b>${f.prix ? euros(f.prix) : 'Sur devis'}</b>${f.detail ? `<p>${esc(f.detail)}</p>` : ''}</div>`).join('')}</div>
      <p class="fx-note">Prix indicatifs${m.unite ? `, ${esc(m.unite)}` : ''} : le devis final dépend de ton logement.</p>
    </section>` : ''}
    ${m.bio ? `<section class="fx-sec"><h2>Présentation</h2><div class="fx-bio" data-fx-bio><p>${esc(m.bio)}</p></div><button type="button" class="fx-more-bio" data-fx-bio-btn hidden>Lire la suite</button></section>` : ''}
    ${m.offers.length ? `<section class="fx-sec"><h2>${esc(m.offerTitle)}</h2><div class="fx-offers">${m.offers.map(o => `<span class="fx-offer"><i class="ph-bold ${o.icon}"></i>${esc(o.label)}</span>`).join('')}</div></section>` : ''}
    ${m.zoneHtml || ''}
    ${links.length || m.reseauxHtml ? `<section class="fx-sec"><h2>${esc(m.linksTitle || 'En ligne')}</h2><div class="fx-links">${links.map(l => `<a href="${esc(l.href)}" target="_blank" rel="${l.rel || 'noopener noreferrer'}" class="fx-link"${l.track ? ` onclick="jmTrack('${l.track}')"` : ''}><i class="ph-bold ${l.icon}"></i><span>${esc(l.label)}</span><i class="ph-bold ph-arrow-up-right"></i></a>`).join('')}</div>${m.reseauxHtml || ''}</section>` : ''}
    <div class="fx-end">
      <a href="${esc(m.annuaire.href)}"><i class="ph-bold ph-arrow-left"></i>${esc(m.annuaire.label)}</a>
      ${m.guide ? `<a href="${esc(m.guide.href)}"><i class="ph-bold ph-map-pin"></i>${esc(m.guide.label)}</a>` : ''}
    </div>
    <p class="disclaimer fx-disc"><strong>Bon à savoir.</strong> ${esc(m.disclaimer)}</p>
  </div>

  <aside class="fx-side">
    <div class="fx-card">
      <div class="fx-card-id">${avatarHtml(m, 'sm')}<div><b>${esc(m.name)}</b><span>${esc(m.sub)}</span></div></div>
      <div class="fx-price${prix.devis ? ' devis' : ''}">${esc(prix.v)}${!prix.devis && m.unite ? `<small>${esc(m.unite)}</small>` : ''}</div>
      ${forms.length > 1 ? `<div class="fx-mini">${forms.map(f => `<div><span>${esc(f.nom)}</span><b>${f.prix ? euros(f.prix) : 'Sur devis'}</b></div>`).join('')}</div>` : ''}
      <button type="button" class="fx-btn" data-fx-open><i class="ph-bold ph-paper-plane-tilt"></i>${ctaLabel}</button>
      ${m.telHtml || ''}
      <p class="fx-fine">Contact direct, sans commission. ${esc(m.firstName)} te répond par e-mail.</p>
      ${m.reco ? `<p class="fx-reco">Tu as déjà travaillé avec ${esc(m.firstName)} ? <a href="${esc(m.reco.href)}">${esc(m.reco.label)}</a></p>` : ''}
    </div>
  </aside>
</div>
</main>

<div class="fx-bar" id="fx-bar"><button type="button" class="fx-btn" data-fx-open><i class="ph-bold ph-paper-plane-tilt"></i>${ctaLabel}</button>${m.telHref ? `<a class="fx-bar-tel" href="${esc(m.telHref)}" aria-label="Appeler ${esc(m.firstName)}"><i class="ph-bold ph-phone"></i></a>` : ''}</div>
${contactSheetHtml(m)}`
}

export const FICHE_V3_CSS = `
body{padding-bottom:86px}
@media(min-width:960px){body{padding-bottom:0}}
.fx{--fxw:1120px}
.fx-wrap{max-width:var(--fxw);margin:0 auto;padding-left:clamp(16px,4vw,40px);padding-right:clamp(16px,4vw,40px)}
.fx-top{background:var(--cr)}
.fx-brd{font-size:12.5px;color:var(--tl);padding:18px 0 12px}
.fx-brd a{color:var(--tm);text-decoration:none}.fx-brd a:hover{color:var(--g)}
.fx-hero{display:flex;flex-direction:column;gap:18px}
.fx-gal{position:relative;border-radius:20px;overflow:hidden;background:#dfe6e2}
.fx-car{display:grid;gap:6px;height:min(460px,52vw);grid-template-columns:2fr 1fr 1fr;grid-template-rows:1fr 1fr}
.fx-ph{border:0;padding:0;margin:0;cursor:zoom-in;overflow:hidden;background:#dfe6e2;display:block;min-width:0}
.fx-ph img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s ease}
.fx-ph:hover img{transform:scale(1.035)}
.fx-ph:first-child{grid-row:span 2}
.fx-ph:nth-child(n+6){display:none}
.fx-gal.n1 .fx-car{grid-template-columns:1fr;grid-template-rows:1fr}
.fx-gal.n2 .fx-car{grid-template-columns:1fr 1fr;grid-template-rows:1fr}.fx-gal.n2 .fx-ph:first-child{grid-row:auto}
.fx-gal.n3 .fx-car{grid-template-columns:2fr 1fr}
.fx-gal.n4 .fx-car{grid-template-columns:2fr 1fr 1fr}.fx-gal.n4 .fx-ph:nth-child(2){grid-row:span 2}
.fx-cnt{display:none}
.fx-all{position:absolute;right:14px;bottom:14px;display:inline-flex;align-items:center;gap:7px;background:#fff;color:var(--gd);border:0;border-radius:10px;padding:9px 14px;font:600 13px 'Outfit',sans-serif;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.18)}
.fx-id{display:flex;align-items:center;gap:16px;min-width:0}
.fx-av{flex:none;width:72px;height:72px;border-radius:50%;background:#e8efeb center/cover no-repeat;border:3px solid #fff;box-shadow:0 6px 18px rgba(0,51,41,.18)}
.fx-av.ini{display:grid;place-items:center;background:linear-gradient(135deg,#335e52,#0e3a2f);color:var(--y);font-family:'Fraunces',serif;font-size:28px}
.fx-av.sm{width:46px;height:46px;border-width:2px;font-size:18px;box-shadow:none}
.fx-id-t{min-width:0}
.fx-id h1{font-family:'Fraunces',serif;font-weight:400;font-size:clamp(30px,4vw,46px);line-height:1.04;letter-spacing:-.6px;color:var(--td);margin:0}
.fx-role{display:block;font-family:'Outfit',sans-serif;font-size:15px;font-weight:500;letter-spacing:0;color:var(--g);margin-top:6px}
.fx-badges{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.fx-badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--tm);background:#fff;border:1px solid var(--bd);border-radius:999px;padding:4px 10px}
.fx-badge.reco{color:#1d6b3f;background:#e6f4ec;border-color:#bfe2cc}
.fx-badge i{font-size:12px}
.fx.no-ph .fx-top{background:linear-gradient(160deg,#001a11 0%,var(--gd) 55%,#00463a 100%)}
.fx.no-ph .fx-brd,.fx.no-ph .fx-brd a{color:rgba(255,255,255,.6)}
.fx.no-ph .fx-hero{padding:14px 0 40px}
.fx.no-ph .fx-id h1{color:#fff}
.fx.no-ph .fx-role{color:var(--y)}
.fx.no-ph .fx-id .fx-av{width:96px;height:96px;border-color:rgba(255,255,255,.9)}
.fx-body{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:36px;align-items:start;padding-top:26px;padding-bottom:40px}
.fx-main{display:flex;flex-direction:column;gap:18px;min-width:0}
.fx-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.fx-facts.n2{grid-template-columns:repeat(2,minmax(0,1fr))}.fx-facts.n1{grid-template-columns:1fr}
.fx-fact{background:#fff;border:1px solid var(--bd);border-radius:14px;padding:13px 15px;min-width:0}
.fx-fact b{display:block;font-family:'Fraunces',serif;font-weight:400;font-size:21px;line-height:1.15;color:var(--td);overflow-wrap:anywhere}
.fx-fact span{display:block;font-size:12.5px;color:var(--tl);margin-top:3px}
.fx-sec{background:#fff;border:1px solid var(--bd);border-radius:18px;padding:22px 24px;min-width:0}
.fx-sec h2,.fx .sct h2{font-family:'Fraunces',serif;font-weight:400;font-size:21px;color:var(--td);margin:0 0 14px}
.fx-forms{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.fx-forms.n2{grid-template-columns:repeat(2,minmax(0,1fr))}.fx-forms.n1{grid-template-columns:1fr}
.fx-fm{border:1px solid var(--bd);border-radius:14px;padding:14px 15px;background:var(--cr);min-width:0}
.fx-fm.hl{background:#fff;border:1px solid var(--g);box-shadow:0 0 0 1px var(--g) inset}
.fx-fm-n{font-size:11px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:var(--tl)}
.fx-fm b{display:block;font-family:'Fraunces',serif;font-weight:400;font-size:26px;color:var(--g);margin:2px 0 4px}
.fx-fm p{font-size:13.5px;line-height:1.55;color:var(--tm);margin:0}
.fx-note{font-size:12px;color:var(--tl);margin:12px 0 0}
.fx-bio p{font-size:15px;line-height:1.75;color:var(--tm);white-space:pre-wrap;margin:0}
.fx-bio.cut{max-height:7.1em;overflow:hidden;-webkit-mask-image:linear-gradient(180deg,#000 55%,transparent);mask-image:linear-gradient(180deg,#000 55%,transparent)}
.fx-more-bio{margin-top:8px;background:none;border:0;padding:0;color:var(--g);font:600 14px 'Outfit',sans-serif;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.fx-offers{display:flex;flex-wrap:wrap;gap:8px}
.fx-offer{display:inline-flex;align-items:center;gap:7px;font-size:13.5px;color:var(--td);background:var(--cr);border:1px solid var(--bd);border-radius:999px;padding:7px 13px}
.fx-offer i{color:var(--g);font-size:14px}
.fx .sct{border-radius:18px;padding:22px 24px;margin:0}
.fx .sct-map{max-width:460px;margin:0 auto}
.fx-links{display:flex;flex-direction:column;gap:8px}
.fx-link{display:flex;align-items:center;gap:11px;padding:11px 14px;border:1px solid var(--bd);border-radius:12px;text-decoration:none;color:var(--td);font-size:14.5px;font-weight:500;min-width:0}
.fx-link span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fx-link i:first-child{color:var(--g);font-size:17px}.fx-link i:last-child{color:var(--tl);font-size:14px}
.fx-link:hover{border-color:rgba(0,76,63,.35)}
.fx-end{display:flex;flex-wrap:wrap;gap:10px}
.fx-end a{display:inline-flex;align-items:center;gap:7px;padding:10px 15px;background:#fff;border:1px solid var(--bd);border-radius:10px;font-size:13px;font-weight:600;color:var(--g);text-decoration:none}
.fx-disc{padding:0;margin:0;font-size:12.5px;color:var(--tl);line-height:1.7}
.fx-side{position:sticky;top:84px}
.fx-card{background:#fff;border:1px solid var(--bd);border-radius:20px;padding:20px;display:flex;flex-direction:column;gap:12px;box-shadow:0 18px 40px rgba(0,51,41,.08)}
.fx-card-id{display:flex;gap:11px;align-items:center;min-width:0}
.fx-card-id b{display:block;font-family:'Fraunces',serif;font-weight:400;font-size:19px;line-height:1.1;color:var(--td)}
.fx-card-id span{display:block;font-size:12.5px;color:var(--tl);margin-top:2px}
.fx-price{font-family:'Fraunces',serif;font-size:30px;color:var(--g);line-height:1.1}
.fx-price small{font-family:'Outfit',sans-serif;font-size:13px;color:var(--tl);margin-left:6px}
.fx-price.devis{font-size:24px}
.fx-mini{display:flex;flex-direction:column;gap:6px}
.fx-mini div{display:flex;justify-content:space-between;gap:10px;font-size:13.5px;color:var(--tm);border-bottom:1px dashed var(--bd);padding-bottom:6px}
.fx-mini b{color:var(--td);font-variant-numeric:tabular-nums}
.fx-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;border:0;border-radius:12px;padding:14px 18px;background:var(--y);color:var(--gd);font:700 15px 'Outfit',sans-serif;cursor:pointer;text-decoration:none;transition:background .2s,transform .2s}
.fx-btn:hover{background:#ffe08f;transform:translateY(-1px)}
.fx-btn.g{background:var(--g);color:#fff}.fx-btn.g:hover{background:var(--gd)}
.fx-card .vt-tel{margin-top:0}
.fx-sec .vt-video-btn{box-shadow:none}
.fx-sec .vt-video-n{color:var(--tl)}
.fx-fine{font-size:12px;line-height:1.6;color:var(--tl);margin:0}
.fx-fine a{color:var(--g)}
.fx-reco{font-size:12.5px;color:var(--tm);margin:0;padding-top:10px;border-top:1px solid var(--bd)}
.fx-reco a{color:var(--g);font-weight:600}
.fx-bar{display:none}
/* Fenêtre de contact */
.fx-sheet{border:0;padding:0;margin:auto;width:min(480px,100%);max-height:92vh;border-radius:22px;background:#fff;color:var(--td);box-shadow:0 30px 80px rgba(0,20,14,.35)}
.fx-sheet::backdrop{background:rgba(0,26,17,.5)}
.fx-form{display:flex;flex-direction:column;gap:0;padding:16px 20px 22px}
.fx-sh-top{display:flex;align-items:center;gap:12px;margin-bottom:14px}
.fx-steps{flex:1;display:flex;gap:5px}.fx-steps i{flex:1;height:4px;border-radius:4px;background:#e2ebe6}.fx-steps i.on{background:var(--g)}
.fx-x{border:0;background:var(--cr);width:34px;height:34px;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:var(--tm)}
.fx-step{display:flex;flex-direction:column;gap:12px}
.fx-step[hidden],.fx-done[hidden],.fx-extra[hidden]{display:none}
.fx-sheet h2{font-family:'Fraunces',serif;font-weight:400;font-size:24px;margin:0}
.fx-sheet fieldset{border:0;padding:0;margin:0}
.fx-sheet legend{font-size:13px;font-weight:700;color:var(--tm);margin-bottom:8px}
.fx-pills{display:flex;flex-wrap:wrap;gap:7px}
.fx-pill{position:relative;cursor:pointer}
.fx-pill input{position:absolute;opacity:0;pointer-events:none}
.fx-pill span{display:inline-flex;align-items:center;border:1px solid rgba(0,76,63,.2);border-radius:999px;padding:9px 14px;font-size:14px;background:#fff;transition:all .15s}
.fx-pill input:checked+span{background:#E8F2EC;border-color:var(--g);color:var(--g);font-weight:700}
.fx-pill input:focus-visible+span{outline:2px solid var(--g);outline-offset:2px}
.fx-sheet input[type=text],.fx-sheet input[type=email],.fx-sheet textarea{width:100%;padding:13px 14px;border:1px solid rgba(0,76,63,.2);border-radius:12px;font:15px 'Outfit',sans-serif;color:var(--td);background:#fff}
.fx-sheet input:focus,.fx-sheet textarea:focus{outline:none;border-color:var(--g);box-shadow:0 0 0 3px rgba(0,76,63,.12)}
.fx-sheet textarea{min-height:90px;resize:vertical;margin-top:8px}
.fx-more,.fx-back{align-self:flex-start;background:none;border:0;padding:2px 0;color:var(--g);font:600 14px 'Outfit',sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.fx-back{align-self:center;color:var(--tl);font-weight:500}
.fx-err{margin:0;font-size:13.5px;color:#b3261e;background:rgba(179,38,30,.07);border-radius:10px;padding:9px 12px}
.fx-done{display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;padding:26px 6px 6px}
.fx-done p{margin:0 0 6px;color:var(--tm);font-size:15px}
.fx-ok{width:62px;height:62px;border-radius:50%;background:#E8F2EC;color:var(--g);display:grid;place-items:center;font-size:28px}
.hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
@media(max-width:959px){
  .fx-body{grid-template-columns:minmax(0,1fr);padding-top:16px}
  .fx-side{position:static}
  .fx-card .fx-btn{display:none}
  .fx-bar{display:flex;gap:8px;position:fixed;left:0;right:0;bottom:0;z-index:90;padding:10px max(14px,env(safe-area-inset-left,0px)) calc(12px + env(safe-area-inset-bottom,0px));background:linear-gradient(180deg,rgba(247,245,240,0),var(--cr) 26%)}
  .fx-bar .fx-btn{box-shadow:0 10px 24px rgba(0,51,41,.18)}
  .fx-bar-tel{flex:none;width:52px;border-radius:12px;background:#fff;border:1px solid var(--bd);display:grid;place-items:center;color:var(--g);font-size:20px;text-decoration:none}
  .fx-sheet{margin:auto 0 0;width:100%;max-width:none;border-radius:22px 22px 0 0;max-height:94vh}
  .fx-form{padding-bottom:calc(22px + env(safe-area-inset-bottom,0px))}
}
@media(max-width:719px){
  .fx-brd{display:none}
  .fx-top .fx-wrap{padding-left:0;padding-right:0}
  .fx-hero{gap:0;position:relative}
  .fx-gal{border-radius:0}
  .fx-car{display:flex;height:auto;gap:0;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}
  .fx-car::-webkit-scrollbar{display:none}
  .fx-ph,.fx-ph:first-child{flex:0 0 100%;aspect-ratio:4/3.4;scroll-snap-align:start;grid-row:auto}
  .fx-ph:nth-child(n+6){display:block}
  .fx-ph:hover img{transform:none}
  .fx-all{display:none}
  .fx-cnt{display:block;position:absolute;top:14px;right:14px;background:rgba(255,255,255,.92);color:var(--gd);font-size:12px;font-weight:700;border-radius:999px;padding:4px 10px;z-index:2}
  .fx:not(.no-ph) .fx-id{position:absolute;left:0;right:0;bottom:0;padding:60px 16px 16px;background:linear-gradient(180deg,transparent,rgba(0,26,17,.86));pointer-events:none}
  .fx:not(.no-ph) .fx-id h1{color:#fff;font-size:30px}
  .fx:not(.no-ph) .fx-role{color:var(--y)}
  .fx:not(.no-ph) .fx-badges{display:none}
  .fx-av{width:56px;height:56px}
  .fx.no-ph .fx-hero{padding:22px 16px 30px}
  .fx.no-ph .fx-id{flex-direction:column;align-items:flex-start}
  .fx-facts{grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
  .fx-offer{font-size:13px;padding:6px 11px}
  .fx-fact{padding:10px 11px}.fx-fact b{font-size:17px}.fx-fact span{font-size:11.5px}
  .fx-sec,.fx .sct{padding:18px}
  .fx-forms{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:9px;margin:0 -18px;padding:0 18px 4px;scrollbar-width:none}
  .fx-forms::-webkit-scrollbar{display:none}
  .fx-fm{flex:0 0 72%;scroll-snap-align:start}
  .fx-forms.n1 .fx-fm{flex-basis:100%}
}
@media(prefers-reduced-motion:reduce){.fx-ph img,.fx-btn{transition:none}}
`

/** Comportements : compteur du carrousel, présentation coupée, fenêtre de contact en 2 étapes */
export function ficheV3Js({ api, firstName }) {
  return `<script>
(function(){
  var car=document.querySelector('.fx-car'),cnt=document.querySelector('.fx-cnt b');
  if(car&&cnt)car.addEventListener('scroll',function(){cnt.textContent=Math.round(car.scrollLeft/car.clientWidth)+1},{passive:true});
  var bio=document.querySelector('[data-fx-bio]'),bb=document.querySelector('[data-fx-bio-btn]');
  if(bio&&bb&&bio.scrollHeight>parseFloat(getComputedStyle(bio.querySelector('p')).lineHeight||'26')*7){bio.classList.add('cut');bb.hidden=false;bb.addEventListener('click',function(){bio.classList.remove('cut');bb.hidden=true})}
  var dlg=document.getElementById('contact'),f=document.getElementById('contact-form');
  if(!dlg||!f)return;
  var steps=f.querySelectorAll('.fx-step'),bars=f.querySelectorAll('.fx-steps i'),done=f.querySelector('.fx-done');
  function go(n){[].forEach.call(steps,function(s){s.hidden=s.getAttribute('data-step')!==String(n)});[].forEach.call(bars,function(b,i){b.classList.toggle('on',i<n)});var el=f.querySelector('.fx-step[data-step="'+n+'"] input:not([type=hidden]):not([tabindex="-1"])');if(n===2&&el)setTimeout(function(){try{el.focus()}catch(e){}},60)}
  function err(n,t){var e=f.querySelector('[data-err="'+n+'"]');if(!e)return;e.textContent=t||'';e.hidden=!t}
  function open(){go(1);err(1);err(2);if(dlg.showModal&&!dlg.open)dlg.showModal();else dlg.setAttribute('open','');try{jmTrack('contact_open')}catch(e){}}
  document.addEventListener('click',function(e){
    if(e.target.closest('[data-fx-open]')){e.preventDefault();open()}
    else if(e.target.closest('[data-fx-close]')||e.target===dlg)dlg.close();
    else if(e.target.closest('[data-fx-next]')){
      var b=f.querySelectorAll('input[name=besoin]:checked').length,l=f.querySelector('input[name=logement]:checked');
      if(!b&&!l){err(1,'Choisis ce qu’il te faut et ton logement.');return}
      if(!b){err(1,'Choisis ce qu’il te faut.');return}
      if(!l){err(1,'Choisis ton logement.');return}
      err(1);go(2);
    }
    else if(e.target.closest('[data-fx-back]'))go(1);
    else if(e.target.closest('[data-fx-more]')){f.querySelector('.fx-extra').hidden=false;e.target.closest('[data-fx-more]').hidden=true}
  });
  if(location.hash==='#contact')setTimeout(open,300);
  var t0=Date.now();
  f.addEventListener('submit',async function(e){
    e.preventDefault();
    var name=f.contactName.value.trim(),mail=f.contactEmail.value.trim();
    if(!name){err(2,'Écris ton prénom.');return}
    if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(mail)){err(2,'Vérifie ton e-mail.');return}
    err(2);
    var btn=document.getElementById('contact-btn');btn.disabled=true;var lbl=btn.innerHTML;btn.innerHTML='Envoi…';
    var data={slug:window.__slug||'',contactName:name,contactEmail:mail,message:window.jmContactMessage?jmContactMessage(f):'',website:f.website?f.website.value:'',t:t0};
    try{
      var res=await fetch(${JSON.stringify(api)},{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      if(!res.ok){var body=await res.json().catch(function(){return{}});err(2,body.error||'L’envoi n’a pas marché. Réessaie dans un instant.');btn.disabled=false;btn.innerHTML=lbl;return}
      [].forEach.call(steps,function(s){s.hidden=true});f.querySelector('.fx-sh-top .fx-steps').style.visibility='hidden';done.hidden=false;
    }catch(x){err(2,'Pas de réseau : réessaie dans un instant.');btn.disabled=false;btn.innerHTML=lbl}
  });
})();
</script>`
}

/** Lien tel: du bouton fixe (même règle que telHtml : 8 chiffres au moins) */
export function telHref(telephone) {
  const digits = String(telephone || '').trim().replace(/[^\d+]/g, '')
  return digits.replace(/\D/g, '').length >= 8 ? `tel:${digits}` : ''
}
