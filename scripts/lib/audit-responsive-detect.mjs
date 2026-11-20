// Détection des défauts d'affichage dans une page (audit responsive,
// 20/11/2026, docs/claude/responsive.md). Fonction autonome : elle est
// envoyée telle quelle dans le navigateur (page.evaluate), sans import.
//
// Renvoie, pour la largeur courante de la fenêtre :
// - docOverflow : la page défile de côté (px en trop) ;
// - overflow    : éléments qui sortent de l'écran (hors zones qui défilent) ;
// - cut         : texte qui dépasse d'un conteneur qui le masque (donc coupé
//                 sans « … »), le cas du dashboard dont .dash-main masque ;
// - clipped     : texte coupé en largeur ou en hauteur dans sa propre boîte
//                 (« ellipsis » et « line-clamp » sont voulus, listés à part) ;
// - overlap     : deux textes visibles qui se chevauchent.
// withText=false : aucune phrase de la page dans le résultat (dashboard :
// données de comptes réels), seulement des sélecteurs.
export function detect(withText) {
  const W = window.innerWidth
  const out = { docOverflow: Math.max(0, document.documentElement.scrollWidth - W), overflow: [], cut: [], clipped: [], overlap: [] }
  const txt = s => (withText ? String(s || '').trim().replace(/\s+/g, ' ').slice(0, 60) : '')
  const path = el => {
    const parts = []
    for (let e = el; e && e !== document.body && parts.length < 4; e = e.parentElement) {
      let s = e.tagName.toLowerCase()
      if (e.id && !/\d{3,}/.test(e.id)) { s += '#' + e.id; parts.unshift(s); break }
      const c = (typeof e.className === 'string' ? e.className : '').trim().split(/\s+/).filter(x => x && !/^(jsx|css|sc)-/.test(x)).slice(0, 2)
      if (c.length) s += '.' + c.join('.')
      parts.unshift(s)
    }
    return parts.join('>')
  }
  const visible = el => {
    if (el.closest('details:not([open])') && !el.closest('summary')) return false
    if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })) return false
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false
    const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0
  }
  const ancestors = function* (el) { for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) yield e }
  const scrolls = cs => /(auto|scroll)/.test(cs.overflowX)
  const inScroller = el => { for (const e of ancestors(el)) { const cs = getComputedStyle(e); if (/(auto|scroll|hidden|clip)/.test(cs.overflowX) || cs.position === 'fixed') return true } return false }
  const fixedish = el => { for (let e = el; e && e !== document.body; e = e.parentElement) { const p = getComputedStyle(e).position; if (p === 'fixed' || p === 'sticky') return true } return false }
  const in3d = el => { for (let e = el; e; e = e.parentElement) if (getComputedStyle(e).transformStyle === 'preserve-3d') return true; return false }
  const hasText = el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1)
  const textRects = el => {
    const rects = []
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.textContent.trim()) continue
      const range = document.createRange(); range.selectNodeContents(n)
      for (const r of range.getClientRects()) if (r.width > 2 && r.height > 2) rects.push(r)
    }
    return rects
  }
  const all = [...document.body.querySelectorAll('*')].filter(e => !['SCRIPT', 'STYLE', 'NOSCRIPT', 'svg', 'path', 'BR', 'TEMPLATE'].includes(e.tagName) && !e.closest('svg') && !e.closest('[aria-hidden="true"]'))

  // 1. Hors de l'écran
  const seen = new Set()
  for (const el of all) {
    if (!visible(el) || fixedish(el)) continue
    const r = el.getBoundingClientRect()
    if ((r.right > W + 2 || r.left < -2) && !inScroller(el) && !(r.right < 0 && r.width <= 2)) {
      let dup = false
      for (const p of ancestors(el)) if (seen.has(p)) { dup = true; break }
      seen.add(el)
      if (!dup) out.overflow.push({ el: path(el), right: Math.round(r.right), w: Math.round(r.width) })
    }
  }

  // 2. Texte qui sort d'un conteneur qui masque (coupé net)
  for (const el of all) {
    if (!hasText(el) || !visible(el)) continue
    const own = getComputedStyle(el)
    if (own.textOverflow === 'ellipsis') continue
    for (const anc of [el, ...ancestors(el)]) {
      const cs = getComputedStyle(anc)
      if (cs.overflowX === 'visible' || scrolls(cs) || cs.textOverflow === 'ellipsis') { if (scrolls(cs)) break; continue }
      const b = anc.getBoundingClientRect()
      const bad = textRects(el).some(r => r.right > b.right + 2 || r.left < b.left - 2)
      if (bad) { const tr = textRects(el); out.cut.push({ el: path(el), box: path(anc), text: txt(el.textContent), dep: Math.round(Math.max(...tr.map(r => r.right)) - b.right), boxW: Math.round(b.width) }) }
      break
    }
  }

  // 3. Texte coupé dans sa propre boîte
  for (const el of all) {
    if (!visible(el)) continue
    const cs = getComputedStyle(el)
    if (!hasText(el) && !(cs.textOverflow === 'ellipsis' && el.textContent.trim())) continue
    const clipsX = /(hidden|clip)/.test(cs.overflowX) || cs.textOverflow === 'ellipsis'
    const clipsY = /(hidden|clip)/.test(cs.overflowY) || cs.webkitLineClamp !== 'none'
    const cutX = clipsX && el.scrollWidth > el.clientWidth + 2
    const cutY = clipsY && el.scrollHeight > el.clientHeight + 3 && cs.overflowY !== 'visible'
    // Aperçu volontairement coupé avec un fondu (mask-image) : voulu, comme « … »
    const fondu = (cs.maskImage && cs.maskImage !== 'none') || (cs.webkitMaskImage && cs.webkitMaskImage !== 'none')
    if (cutX || cutY) out.clipped.push({ el: path(el), how: cutX ? (cs.textOverflow === 'ellipsis' ? 'ellipsis' : 'coupé') : (cs.webkitLineClamp !== 'none' ? 'line-clamp' : fondu ? 'fondu' : 'coupé-bas'), text: txt(el.textContent) })
  }

  // 4. Textes qui se chevauchent (partie réellement visible de chaque texte)
  const leaves = []
  for (const el of all) {
    if (!hasText(el) || !visible(el) || fixedish(el) || in3d(el)) continue
    let clip = { left: -1e9, top: -1e9, right: 1e9, bottom: 1e9 }
    for (const e of [el, ...ancestors(el)]) {
      const cs = getComputedStyle(e)
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
        const b = e.getBoundingClientRect()
        clip = { left: Math.max(clip.left, b.left), top: Math.max(clip.top, b.top), right: Math.min(clip.right, b.right), bottom: Math.min(clip.bottom, b.bottom) }
      }
    }
    const rects = textRects(el).map(r => ({ left: Math.max(r.left, clip.left), top: Math.max(r.top, clip.top), right: Math.min(r.right, clip.right), bottom: Math.min(r.bottom, clip.bottom) }))
      .map(r => ({ ...r, width: r.right - r.left, height: r.bottom - r.top })).filter(r => r.width > 2 && r.height > 2)
    if (rects.length) leaves.push({ el, rects })
  }
  const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
  outer: for (let i = 0; i < leaves.length; i++) for (let j = i + 1; j < leaves.length; j++) {
    const A = leaves[i], B = leaves[j]
    if (A.el.contains(B.el) || B.el.contains(A.el)) continue
    for (const a of A.rects) for (const b of B.rects) {
      const ar = inter(a, b); const min = Math.min(a.width * a.height, b.width * b.height)
      if (ar > 0.25 * min && ar > 20) { out.overlap.push({ a: path(A.el), b: path(B.el), ta: txt(A.el.textContent), tb: txt(B.el.textContent) }); if (out.overlap.length > 30) break outer; break }
    }
  }
  out.overflow = out.overflow.slice(0, 15); out.cut = out.cut.slice(0, 20); out.clipped = out.clipped.slice(0, 25)
  return out
}
