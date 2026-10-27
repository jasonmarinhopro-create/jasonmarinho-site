// Exemple de « Mes statistiques » des pros (12/10/2026, Jason : « un exemple de
// la partie statistiques pour les photographes et les équipes de ménage, afin
// qu'ils se rendent compte du travail et de ce que je peux leur apporter »).
// Copie statique de l'écran de l'app (components/pros/stats/ProStatsView.tsx) :
// mêmes tuiles, même courbe, mêmes cartes. Chiffres fictifs, annoncés comme
// tels. Injecté par scripts/inject-stats-demo.mjs (marqueurs STATSDEMO).
// Si l'écran de l'app change (tuiles, cartes), mettre cet exemple à jour.

const DATA = {
  photographe: {
    ville: 'Lyon',
    page: 'Photographe à Lyon',
    tiles: [
      ['ph-users', 'Visiteurs', '', '64', '+38 %'],
      ['ph-eye', 'Vues de la fiche', '', '82', '+41 %'],
      ['ph-timer', 'Temps de lecture', 'moyen par visiteur', '1 min 05', '+9 %'],
      ['ph-cursor-click', 'Clics', 'portfolio, Instagram', '19', '+52 %'],
      ['ph-chat-circle', 'Demandes reçues', '', '3', '+2'],
      ['ph-magnifying-glass', 'Vu sur Google', 'affichages', '410', '+64 %'],
    ],
    canaux: [['Google', 44], ['Page « Photographe à Lyon »', 27], ['Instagram', 15], ['Accès direct', 9], ['IA (ChatGPT, Perplexity…)', 5]],
    lieux: [['Lyon', 51], ['Villeurbanne', 12], ['Annecy', 8], ['Paris', 6], ['Caluire-et-Cuire', 5]],
    google: [['photographe airbnb lyon', '6', '128', '5'], ['photographe location saisonnière lyon', '9', '96', '2'], ['photographe immobilier lyon', '14', '74', '1'], ['camille sénéchal photographe', '1', '18', '6']],
    clics: [['Portfolio', 12], ['Instagram', 5], ['Site', 2]],
    cityPage: [['312', 'visiteurs de la page'], ['17', 'venus sur ta fiche depuis la page'], ['8,3', 'place moyenne Google']],
    retenir: [
      'Google t\'envoie près d\'un visiteur sur deux : « photographe airbnb lyon » te place 6e, encore deux places pour être dans le trio de tête.',
      'La page « Photographe à Lyon » t\'a amené 17 visiteurs : c\'est elle qui présente ta fiche aux hôtes qui cherchent dans ta ville.',
      '2 visiteurs sur 3 lisent ta fiche sur téléphone : vérifie que ta première photo de portfolio est belle en petit.',
    ],
  },
  menage: {
    ville: 'Bordeaux',
    page: 'Ménage à Bordeaux',
    tiles: [
      ['ph-users', 'Visiteurs', '', '71', '+29 %'],
      ['ph-eye', 'Vues de la fiche', '', '90', '+33 %'],
      ['ph-timer', 'Temps de lecture', 'moyen par visiteur', '54 s', '+6 %'],
      ['ph-cursor-click', 'Clics', 'site, Instagram', '14', '+40 %'],
      ['ph-chat-circle', 'Demandes reçues', '', '4', '+3'],
      ['ph-magnifying-glass', 'Vu sur Google', 'affichages', '380', '+58 %'],
    ],
    canaux: [['Google', 41], ['Page « Ménage à Bordeaux »', 31], ['Accès direct', 12], ['Instagram', 10], ['IA (ChatGPT, Perplexity…)', 6]],
    lieux: [['Bordeaux', 47], ['Mérignac', 13], ['Arcachon', 10], ['Pessac', 7], ['Paris', 5]],
    google: [['ménage airbnb bordeaux', '7', '112', '4'], ['femme de ménage location saisonnière bordeaux', '9', '84', '2'], ['conciergerie ménage bordeaux', '12', '61', '1'], ['éclat ménage bordeaux', '1', '15', '5']],
    clics: [['Site', 9], ['Instagram', 5]],
    cityPage: [['268', 'visiteurs de la page'], ['22', 'venus sur ta fiche depuis la page'], ['7,9', 'place moyenne Google']],
    retenir: [
      'La page « Ménage à Bordeaux » t\'a amené 22 visiteurs : les hôtes de ta ville tombent sur ta fiche sans te connaître.',
      'Tu es 7e sur « ménage airbnb bordeaux » : ajoute Arcachon et Mérignac à ta zone, des hôtes de là-bas te lisent déjà.',
      '4 demandes ce mois-ci, 3 de plus que le mois d\'avant : réponds dans la journée, c\'est souvent le premier qui répond qui décroche le client.',
    ],
  },
}

// Courbe : 30 jours, période en cours et période d'avant (pointillés)
function series(seed, base, growth) {
  let x = seed
  const rnd = () => { x = (x * 9301 + 49297) % 233280; return x / 233280 }
  return Array.from({ length: 30 }, (_, i) => Math.max(0, base + growth * i + (rnd() - 0.5) * base * 1.1))
}
function path(pts, w, h, max) {
  return pts.map((v, i) => `${i ? 'L' : 'M'}${(i * w / (pts.length - 1)).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`).join(' ')
}
function chart(metier) {
  const now = series(metier === 'menage' ? 7 : 3, 1.4, 0.06)
  const before = series(metier === 'menage' ? 11 : 5, 1.2, 0.015)
  const W = 600, H = 150, max = Math.max(...now, ...before) * 1.15
  const line = path(now, W, H, max)
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="sd-svg" role="img" aria-label="Courbe des visiteurs sur 30 jours (exemple)">
        <defs><linearGradient id="sd-fill-${metier}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e9d54" stop-opacity=".22"/><stop offset="1" stop-color="#1e9d54" stop-opacity="0"/></linearGradient></defs>
        <path d="${line} L${W},${H} L0,${H} Z" fill="url(#sd-fill-${metier})"/>
        <path d="${path(before, W, H, max)}" fill="none" stroke="#5A6B57" stroke-width="1.6" stroke-dasharray="5 5" vector-effect="non-scaling-stroke"/>
        <path d="${line}" fill="none" stroke="#004C3F" stroke-width="2.4" vector-effect="non-scaling-stroke"/>
      </svg>`
}

const bars = rows => rows.map(([l, p]) => `<div class="sd-bar"><span class="sd-bar-l">${l}</span><span class="sd-bar-t"><span style="width:${p}%"></span></span><span class="sd-bar-p">${p} %</span></div>`).join('')

export const STATS_DEMO_CSS = `.sd{max-width:1080px;margin:0 auto;padding:0 16px;font-family:'Outfit',system-ui,sans-serif;color:#0F1A0D}
.sd-head{text-align:center;max-width:700px;margin:0 auto 28px}
.sd-lbl{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:5px 12px;border-radius:999px;background:rgba(255,213,107,.2);color:#8a6408;border:1px solid rgba(255,213,107,.5);margin-bottom:12px}
.sd-h2{font-family:'Fraunces',serif;font-size:clamp(1.6rem,3.2vw,2.3rem);font-weight:400;line-height:1.2;margin:0 0 12px;color:#0F1A0D}
.sd-h2 em{font-style:italic;color:#004C3F}
.sd-sub{font-size:15.5px;color:#3D5038;line-height:1.7;margin:0}
.sd-app{background:#F4F8F5;border:1px solid rgba(0,76,63,.12);border-radius:22px;padding:clamp(14px,2.4vw,26px);box-shadow:0 18px 50px rgba(0,51,41,.08)}
.sd-hero{background:linear-gradient(135deg,#001a11,#003329 55%,#00463a);border-radius:16px;padding:18px clamp(16px,2.4vw,24px);color:#fff;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin-bottom:14px}
.sd-hero-t{font-family:'Fraunces',serif;font-size:clamp(1.15rem,2.2vw,1.45rem);font-weight:400;margin:2px 0 0}
.sd-hero-t em{color:#FFD56B;font-style:italic}
.sd-eyebrow{font-size:10.5px;letter-spacing:1.4px;text-transform:uppercase;color:rgba(255,213,107,.8);font-weight:600}
.sd-pills{display:flex;gap:6px;flex-wrap:wrap}
.sd-pill{font-size:12.5px;padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.25);color:rgba(255,255,255,.8)}
.sd-pill.on{background:#FFD56B;border-color:#FFD56B;color:#003329;font-weight:600}
.sd-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:14px}
.sd-tile{background:#fff;border:1px solid rgba(0,76,63,.1);border-radius:14px;padding:12px 14px}
.sd-tile.on{border:1px solid #1e9d54;box-shadow:0 0 0 3px rgba(30,157,84,.12)}
.sd-tile-l{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#3D5038}
.sd-tile-l i{color:#1e9d54;font-size:15px}
.sd-tile-h{font-size:11px;color:#5A6B57;margin-top:1px;min-height:14px}
.sd-tile-v{font-family:'Fraunces',serif;font-size:26px;line-height:1.1;margin-top:4px;color:#0F1A0D}
.sd-tile-d{display:inline-block;font-size:11.5px;font-weight:600;color:#17803f;background:rgba(30,157,84,.1);border-radius:999px;padding:2px 8px;margin-top:6px}
.sd-card{background:#fff;border:1px solid rgba(0,76,63,.1);border-radius:16px;padding:16px 18px;min-width:0}
.sd-card-h{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.sd-ic{width:34px;height:34px;border-radius:10px;background:rgba(30,157,84,.1);color:#004C3F;display:inline-flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}
.sd-card-t{font-family:'Fraunces',serif;font-size:17px;font-weight:400;margin:0;color:#0F1A0D;line-height:1.25}
.sd-card-s{font-size:12px;color:#5A6B57;margin-top:1px}
.sd-chart{margin-bottom:14px}
.sd-chart-top{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:baseline;justify-content:space-between;margin-bottom:8px}
.sd-legend{display:flex;gap:14px;font-size:12px;color:#3D5038;flex-wrap:wrap}
.sd-legend span{display:inline-flex;align-items:center;gap:6px}
.sd-legend b{display:inline-block;width:18px;height:3px;border-radius:2px;background:#004C3F}
.sd-legend b.prev{background:none;border-top:2px dashed #5A6B57;height:0}
.sd-svg{display:block;width:100%;height:150px}
.sd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:12px}
.sd-bar{display:grid;grid-template-columns:minmax(0,1.3fr) 1fr 42px;gap:10px;align-items:center;margin:7px 0;font-size:13px}
.sd-bar-l{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#0F1A0D}
.sd-bar-t{height:8px;border-radius:99px;background:rgba(0,76,63,.08);overflow:hidden}
.sd-bar-t span{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#004C3F,#1e9d54)}
.sd-bar-p{text-align:right;color:#3D5038;font-variant-numeric:tabular-nums}
.sd-q{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;padding:8px 0;border-top:1px solid rgba(0,76,63,.07);font-size:13px}
.sd-q:first-of-type{border-top:0}
.sd-q-n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sd-q-p{font-weight:600;color:#004C3F;font-size:12px;background:rgba(30,157,84,.1);border-radius:999px;padding:2px 8px;white-space:nowrap}
.sd-q-m{grid-column:1/-1;font-size:11.5px;color:#5A6B57}
.sd-nums{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.sd-num{background:#F4F8F5;border-radius:12px;padding:10px;min-width:0}
.sd-num-v{font-family:'Fraunces',serif;font-size:22px;color:#0F1A0D;line-height:1.1}
.sd-num-l{font-size:11.5px;color:#3D5038;margin-top:3px;line-height:1.35}
.sd-list{list-style:none;margin:0;padding:0}
.sd-list li{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;line-height:1.55;color:#0F1A0D;padding:6px 0}
.sd-list li i{color:#1e9d54;font-size:16px;margin-top:2px;flex-shrink:0}
.sd-wide{grid-column:1/-1}
.sd-foot{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;justify-content:center;margin-top:20px;font-size:13.5px;color:#3D5038;text-align:center}
.sd-foot span{display:inline-flex;align-items:center;gap:6px}
.sd-foot i{color:#1e9d54}
@media (max-width:520px){.sd-nums{grid-template-columns:1fr}.sd-tile-v{font-size:22px}.sd-bar{grid-template-columns:minmax(0,1.2fr) .8fr 38px}}`

/** Bloc HTML (CSS inclus) de l'exemple de statistiques. metier : 'photographe' | 'menage' */
export function statsDemoHtml(metier, { cta = null } = {}) {
  const d = DATA[metier]
  const tu = metier === 'photographe' ? 'photographe' : 'équipe de ménage'
  const tiles = d.tiles.map(([ic, l, h, v, delta], i) => `<div class="sd-tile${i === 0 ? ' on' : ''}"><div class="sd-tile-l"><i class="ph ${ic}"></i>${l}</div><div class="sd-tile-h">${h}</div><div class="sd-tile-v">${v}</div><span class="sd-tile-d">${delta}</span></div>`).join('')
  const google = d.google.map(([q, place, aff, clics]) => `<div class="sd-q"><span class="sd-q-n">${q}</span><span class="sd-q-p">${place === '1' ? '1re place' : place + 'e place'}</span><span class="sd-q-m">${aff} affichages · ${clics} clic${clics === '1' ? '' : 's'}</span></div>`).join('')
  const clicsMax = Math.max(...d.clics.map(c => c[1]))
  const clics = d.clics.map(([l, n]) => `<div class="sd-bar"><span class="sd-bar-l">${l}</span><span class="sd-bar-t"><span style="width:${Math.round(n / clicsMax * 100)}%"></span></span><span class="sd-bar-p">${n}</span></div>`).join('')
  const card = (ic, t, s, body, cls = '') => `<div class="sd-card${cls}"><div class="sd-card-h"><span class="sd-ic"><i class="ph ${ic}"></i></span><div><h3 class="sd-card-t">${t}</h3><div class="sd-card-s">${s}</div></div></div>${body}</div>`
  return `<style>${STATS_DEMO_CSS}</style>
<div class="sd">
  <div class="sd-head">
    <span class="sd-lbl"><i class="ph-bold ph-eye"></i>Exemple · chiffres fictifs</span>
    <h2 class="sd-h2">Tes statistiques, <em>comme dans ton espace</em></h2>
    <p class="sd-sub">Voici « Mes statistiques », l'écran que tu retrouves dans ton espace pro : qui voit ta fiche, d'où viennent ces visiteurs, sur quelles recherches Google tu apparais et ce que ça te rapporte en demandes. Exemple d'une fiche de ${tu} à ${d.ville} sur 30 jours (chiffres fictifs). Les vrais chiffres du site sont publics : <a href="/chiffres" style="color:#004C3F;font-weight:600">la visibilité en chiffres</a>.</p>
  </div>
  <div class="sd-app">
    <div class="sd-hero">
      <div><div class="sd-eyebrow">Mes statistiques</div><p class="sd-hero-t">Qui voit ta fiche, <em>et d'où</em></p></div>
      <div class="sd-pills"><span class="sd-pill on">30 jours</span><span class="sd-pill">3 mois</span><span class="sd-pill">12 mois</span></div>
    </div>
    <div class="sd-tiles">${tiles}</div>
    <div class="sd-card sd-chart">
      <div class="sd-chart-top"><h3 class="sd-card-t">Visiteurs <span style="font-family:'Outfit',sans-serif;font-size:13px;color:#5A6B57">· par jour</span></h3>
      <div class="sd-legend"><span><b></b>30 derniers jours</span><span><b class="prev"></b>30 jours d'avant</span></div></div>
      ${chart(metier)}
    </div>
    <div class="sd-grid">
      ${card('ph-compass', 'Comment ils te trouvent', 'Provenance des visiteurs', bars(d.canaux))}
      ${card('ph-magnifying-glass', 'Sur Google', 'Tes recherches et ta place', google)}
      ${card('ph-buildings', `Page « ${d.page} »`, `Ta fiche y est présentée aux hôtes de ${d.ville}`, `<div class="sd-nums">${d.cityPage.map(([v, l]) => `<div class="sd-num"><div class="sd-num-v">${v}</div><div class="sd-num-l">${l}</div></div>`).join('')}</div>`)}
      ${card('ph-map-pin', "D'où ils viennent", 'Lieu de connexion des visiteurs', bars(d.lieux))}
      ${card('ph-device-mobile', 'Sur quel écran', 'Téléphone, ordinateur ou tablette', bars([['Téléphone', 66], ['Ordinateur', 31], ['Tablette', 3]]))}
      ${card('ph-cursor-click', 'Clics sur ta fiche', 'Ce que les visiteurs ont ouvert', clics)}
      ${card('ph-lightbulb', "Ce qu'il faut retenir", 'Sur les 30 derniers jours', `<ul class="sd-list">${d.retenir.map(r => `<li><i class="ph-bold ph-check-circle"></i><span>${r}</span></li>`).join('')}</ul>`, ' sd-wide')}
    </div>
  </div>
  <div class="sd-foot">
    <span><i class="ph-bold ph-envelope-simple"></i>Un bilan par e-mail le 1er de chaque mois</span>
    <span><i class="ph-bold ph-file-pdf"></i>Enregistrable en PDF</span>
    <span><i class="ph-bold ph-arrows-left-right"></i>Comparé à la période d'avant</span>
  </div>${cta ? `
  <div style="text-align:center;margin-top:22px"><a href="${cta.href}" style="display:inline-flex;align-items:center;gap:8px;background:#004C3F;color:#fff;font-weight:600;font-size:15px;padding:13px 24px;border-radius:10px;text-decoration:none"><i class="ph-bold ph-arrow-right"></i>${cta.label}</a></div>` : ''}
</div>`
}
