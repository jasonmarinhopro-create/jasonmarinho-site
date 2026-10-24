// Visuels des publications Facebook / Instagram (24/10/2026). Charte du site :
// vert #004C3F / #003329, jaune #FFD56B, crème #F7F5F0, Fraunces (titres, mots
// en italique jaune) et Outfit (texte), monogramme en blanc sur le vert.
// Un même gabarit sert au carrousel (1080 x 1350), à la photo simple et aux
// scènes du Reel (1080 x 1920). Spécification : data/social/CONSIGNES.md.

export const SIZES = { feed: { w: 1080, h: 1350 }, reel: { w: 1080, h: 1920 } }

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
// *mot* : italique jaune (comme les titres du site)
const rich = s => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>')

/** Diapositives complètes : numéros des points, fin ajoutée si absente. */
export function normalizeSlides(spec) {
  const slides = (spec.slides ?? []).map(s => ({ ...s }))
  let n = 0
  for (const s of slides) if (s.type === 'point') s.num = String(++n).padStart(2, '0')
  if (spec.format !== 'photo' && !slides.some(s => s.type === 'fin')) {
    slides.push({ type: 'fin', titre: spec.public === 'pros' ? 'Rejoins *l’annuaire*' : 'Tout est sur *le site*', texte: '', bouton: 'Lien en bio' })
  }
  return slides
}

const CSS = ({ w, h }) => `
@import url('/fonts/site-fonts.css');
@import url('/fonts/phosphor-bold.css');
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${w}px;height:${h}px;overflow:hidden}
body{font-family:'Outfit',sans-serif;-webkit-font-smoothing:antialiased;color:#0F1A0D}
.s{position:relative;width:${w}px;height:${h}px;overflow:hidden;display:flex;flex-direction:column;padding:${h > 1500 ? '170px 150px 400px 90px' : '84px 84px 92px'}}
.dark{background:radial-gradient(ellipse 70% 55% at 88% 6%,rgba(255,213,107,.16),transparent 70%),linear-gradient(162deg,#001a11 0%,#003329 52%,#00463a 100%);color:#fff}
.cream{background:#F7F5F0}
.bg{position:absolute;inset:0;background-size:cover;background-position:center}
.bg::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,26,17,.55) 0%,rgba(0,26,17,.35) 38%,rgba(0,26,17,.92) 78%,#001a11 100%)}
.top{position:relative;display:flex;align-items:center;justify-content:space-between;z-index:2}
.brand{display:flex;align-items:center;gap:16px;font-family:'Fraunces',serif;font-size:30px;font-weight:600;letter-spacing:-.3px}
.brand img{width:52px;height:52px;object-fit:contain}
.dark .brand img{filter:brightness(0) invert(1)}
.cream .brand{color:#003329}
.brand em{font-style:italic;font-weight:300;color:#FFD56B}
.cream .brand em{color:#004C3F}
.count{font-size:24px;font-weight:600;letter-spacing:2px;opacity:.55}
.body{position:relative;z-index:2;flex:1;display:flex;flex-direction:column;justify-content:center;gap:34px}
.kick{display:inline-flex;align-self:flex-start;align-items:center;gap:14px;font-size:26px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#FFD56B}
.kick::before{content:'';width:46px;height:4px;border-radius:4px;background:currentColor}
.cream .kick{color:#556B2F}
h1{font-family:'Fraunces',serif;font-weight:400;font-size:${h > 1500 ? 104 : 92}px;line-height:1.04;letter-spacing:-2px}
h2{font-family:'Fraunces',serif;font-weight:400;font-size:${h > 1500 ? 86 : 78}px;line-height:1.08;letter-spacing:-1.4px}
h1 em,h2 em{font-style:italic;font-weight:300;color:#FFD56B}
.cream h1 em,.cream h2 em{color:#004C3F}
.sub{font-size:36px;line-height:1.45;font-weight:300;color:rgba(255,255,255,.82);max-width:880px}
.txt{font-size:42px;line-height:1.5;font-weight:300;color:#3D5038;max-width:900px}
.dark .txt{color:rgba(255,255,255,.82)}
.num{font-family:'Fraunces',serif;font-size:150px;line-height:.9;font-weight:300;font-style:italic;color:#004C3F;opacity:.9}
.num small{display:block;width:90px;height:6px;border-radius:6px;background:#FFD56B;margin-top:22px}
ul{list-style:none;display:flex;flex-direction:column;gap:30px;margin-top:10px}
li{display:flex;gap:24px;align-items:flex-start;font-size:42px;line-height:1.38;font-weight:400;color:#1d2b1a}
.dark li{color:#fff}
li .ck{flex:none;width:52px;height:52px;border-radius:50%;background:#004C3F;color:#FFD56B;display:grid;place-items:center;font-style:normal;font-weight:700;font-size:28px;margin-top:2px}
.dark li .ck{background:#FFD56B;color:#003329}
.stat{font-family:'Fraunces',serif;font-size:${h > 1500 ? 230 : 200}px;line-height:.95;font-weight:300;color:#FFD56B;letter-spacing:-6px}
.lab{font-size:42px;line-height:1.35;font-weight:400;max-width:860px}
.src{font-size:24px;color:rgba(255,255,255,.55)}
.cream .src{color:#6E7F6B}
.tip{background:#fff;border:2px solid rgba(0,76,63,.12);border-left:10px solid #FFD56B;border-radius:28px;padding:48px 50px;display:flex;flex-direction:column;gap:22px;box-shadow:0 24px 60px rgba(0,51,41,.08)}
.tip b{font-size:26px;letter-spacing:3px;text-transform:uppercase;color:#556B2F}
.tip p{font-size:40px;line-height:1.45;color:#1d2b1a}
.foot{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;font-size:26px;font-weight:500;letter-spacing:.5px;opacity:.75}
.cream .foot{color:#003329}
.swipe{display:flex;align-items:center;gap:12px;font-weight:600}
.swipe span{display:inline-block;width:64px;height:3px;background:currentColor;position:relative}
.swipe span::after{content:'';position:absolute;right:-2px;top:-7px;border:8px solid transparent;border-left:12px solid currentColor;border-right:0}
.cta{display:inline-flex;align-self:flex-start;align-items:center;gap:16px;background:#FFD56B;color:#003329;font-weight:700;font-size:38px;padding:30px 46px;border-radius:22px}
.url{font-size:34px;font-weight:600;color:#FFD56B;letter-spacing:.5px}
.mono{width:150px;height:150px;object-fit:contain;filter:brightness(0) invert(1);opacity:.95}
.deco{position:absolute;right:-120px;bottom:-120px;width:520px;height:520px;border-radius:50%;border:2px solid rgba(255,213,107,.18)}
.deco2{position:absolute;right:40px;bottom:40px;width:240px;height:240px;border-radius:50%;background:rgba(255,213,107,.06)}
.bars{position:absolute;left:90px;right:90px;top:70px;display:flex;gap:10px;z-index:3}
.bars div{flex:1;height:6px;border-radius:6px;background:rgba(255,255,255,.28);overflow:hidden}
.cream .bars div{background:rgba(0,51,41,.15)}
.bars div b{display:block;height:100%;width:0;background:#FFD56B}
p em,li em,.lab em{font-style:normal;font-weight:600;color:#FFD56B}
.cream p em,.cream li em{color:#004C3F}
.wm{position:absolute;right:-90px;bottom:-60px;width:560px;height:560px;object-fit:contain;opacity:.05;z-index:1}
.cream .rule{position:absolute;left:0;top:0;bottom:0;width:14px;background:linear-gradient(180deg,#004C3F,#00463a)}
[data-in]{will-change:opacity,transform}
`

function inner(slide, spec, i, total, size) {
  const reel = size.h > 1500
  const head = `<div class="top"><div class="brand"><img src="/logo-nav.webp" alt="">Jason <em>Marinho</em></div>${reel || spec.format === 'photo' ? '' : `<div class="count">${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</div>`}</div>`
  const last = i === total - 1
  const foot = reel ? '' : `<div class="foot"><span>jasonmarinho.com</span>${!reel && spec.format === 'carrousel' && !last ? '<span class="swipe">Glisse <span></span></span>' : ''}</div>`
  let d = 0
  const at = () => `data-in="${(d++ * 0.28 + 0.15).toFixed(2)}"`
  switch (slide.type) {
    case 'couverture':
      return { cls: 'dark', bg: spec.photo, html: `${head}<div class="body" style="justify-content:flex-end;padding-bottom:20px">${slide.kicker ? `<div class="kick" ${at()}>${esc(slide.kicker)}</div>` : ''}<h1 ${at()}>${rich(slide.titre)}</h1>${slide.sous_titre ? `<p class="sub" ${at()}>${rich(slide.sous_titre)}</p>` : ''}</div>${foot}` }
    case 'point':
      return { cls: 'cream', html: `${head}<div class="body"><div class="num" ${at()}>${slide.num}<small></small></div><h2 ${at()}>${rich(slide.titre)}</h2>${slide.texte ? `<p class="txt" ${at()}>${rich(slide.texte)}</p>` : ''}</div>${foot}` }
    case 'liste':
      return { cls: 'cream', html: `${head}<div class="body">${slide.kicker ? `<div class="kick" ${at()}>${esc(slide.kicker)}</div>` : ''}<h2 ${at()}>${rich(slide.titre)}</h2><ul>${(slide.items ?? []).map(t => `<li ${at()}><span class="ck"><i class="ph-bold ph-check"></i></span><span>${rich(t)}</span></li>`).join('')}</ul></div>${foot}` }
    case 'chiffre':
      return { cls: 'dark', html: `${head}<div class="deco"></div><div class="body">${slide.kicker ? `<div class="kick" ${at()}>${esc(slide.kicker)}</div>` : ''}<div class="stat" ${at()}>${esc(slide.valeur)}</div><p class="lab" ${at()}>${rich(slide.label)}</p>${slide.source ? `<p class="src" ${at()}>Source : ${esc(slide.source)}</p>` : ''}</div>${foot}` }
    case 'astuce':
      return { cls: 'cream', html: `${head}<div class="body"><div class="tip" ${at()}><b>${esc(slide.kicker || 'Astuce')}</b>${slide.titre ? `<h2 style="font-size:${reel ? 64 : 58}px">${rich(slide.titre)}</h2>` : ''}<p>${rich(slide.texte)}</p></div></div>${foot}` }
    case 'fin':
    default:
      return { cls: 'dark', html: `${head}<div class="deco"></div><div class="deco2"></div><div class="body"><img class="mono" src="/logo-nav.webp" alt="" ${at()}><h2 ${at()}>${rich(slide.titre || 'Tout est sur *le site*')}</h2>${slide.texte ? `<p class="sub" ${at()}>${rich(slide.texte)}</p>` : ''}<div class="cta" ${at()}>${esc(slide.bouton || 'Lien en bio')}</div><div class="url" ${at()}>jasonmarinho.com</div></div>${reel ? '' : '<div class="foot"><span></span></div>'}` }
  }
}

/** Page HTML d'une diapositive (ou d'une scène du Reel). */
export function slideHtml(spec, slides, i, size, { reel = false } = {}) {
  const s = inner(slides[i], spec, i, slides.length, size)
  const bars = reel ? `<div class="bars">${slides.map((_, k) => `<div><b data-bar="${k}"></b></div>`).join('')}</div>` : ''
  const bg = s.bg ? `<div class="bg" data-kb style="background-image:url('/${esc(String(s.bg).replace(/^\/+/, ''))}')"></div>` : ''
  const deco = s.cls === 'cream' ? '<div class="rule"></div><img class="wm" src="/logo-nav.webp" alt="">' : ''
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${CSS(size)}</style></head><body><div class="s ${s.cls}">${bg}${deco}${bars}${s.html}</div></body></html>`
}

/** Durée d'une scène du Reel (secondes), selon la quantité de texte. */
export function sceneDuration(slide) {
  const words = [slide.titre, slide.texte, slide.sous_titre, slide.label, ...(slide.items ?? [])].join(' ').split(/\s+/).filter(Boolean).length
  return Math.min(5.5, Math.max(3, 1.4 + words * 0.15))
}

// Story qui annonce le post (24/10/2026) : 1080 x 1920, la couverture du post
// en carte inclinée, une accroche et « sur le profil ». L'API Meta ne pose
// ni lien ni sticker, d'où le renvoi vers le profil.
// Zones sûres : rien d'important dans les 250 px du haut ni les 300 du bas.
export function storyHtml(spec, coverSrc) {
  const size = { w: 1080, h: 1920 }
  const nature = spec.format === 'reel' ? 'Nouveau Reel' : spec.format === 'carrousel' ? 'Nouveau carrousel' : 'Nouveau post'
  const n = spec.format === 'carrousel' ? normalizeSlides(spec).length : 0
  // Toujours un texte : l'accroche de la routine (« story.texte »), sinon le
  // sous-titre de la couverture, sinon une phrase neutre (le titre est déjà
  // sur la couverture)
  const cover = (spec.slides ?? [])[0] ?? {}
  const texte = spec.story?.texte || cover.sous_titre || 'Tout le détail est *sur le profil*'
  const css = `${CSS(size)}
.st{padding:250px 96px 300px;justify-content:space-between}
.st .pill{align-self:flex-start;display:inline-flex;align-items:center;gap:14px;background:#FFD56B;color:#003329;font-weight:700;font-size:30px;letter-spacing:3px;text-transform:uppercase;padding:16px 28px;border-radius:999px}
.st .card{position:relative;align-self:center;width:700px;height:875px;border-radius:40px;overflow:hidden;transform:rotate(-2.5deg);box-shadow:0 50px 90px rgba(0,0,0,.45),0 0 0 6px rgba(255,255,255,.9)}
.st .card img{width:100%;height:100%;object-fit:cover;display:block}
.st h2{font-size:76px;line-height:1.08}
.st .go{display:flex;align-items:center;gap:18px;font-size:36px;font-weight:600;color:#FFD56B}
.st .go i{font-size:40px}
`
  const body = `<div class="top"><div class="brand"><img src="/logo-nav.webp" alt="">Jason <em>Marinho</em></div></div>
<div class="pill">${esc(nature)}${n ? ` · ${n} images` : ''}</div>
<div class="card"><img src="${esc(coverSrc)}" alt=""></div>
<h2>${rich(texte)}</h2>
<div class="go"><i class="ph-bold ph-arrow-circle-up"></i>À voir sur notre profil</div>`
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${css}</style></head><body><div class="s dark st"><div class="deco"></div>${body}</div></body></html>`
}
