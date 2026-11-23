/* Bulle des graphiques (23/11/2026, Jason : « pouvoir mettre la souris ou toucher du doigt
   pour voir les chiffres »). Un conteneur [data-bulle] dont chaque barre porte data-bt (le chiffre,
   en gras) et data-bs (le mois, ou un détail). Souris : survol. Téléphone : toucher (un second
   toucher sur la même barre ou un toucher ailleurs referme). Clavier : Tab et Échap.
   La bulle est posée sur la page (pas dans le graphique) : rien ne la coupe, et elle est
   toujours recalée dans l'écran. Les barres peuvent être redessinées par la page : délégation. */
(function () {
  if (window.__jmBulle) return
  window.__jmBulle = 1
  var css = '.jm-bulle{position:absolute;z-index:400;left:0;top:0;pointer-events:none;padding:8px 11px;border-radius:11px;background:#0F1A0D;color:rgba(255,255,255,.75);font:400 12.5px/1.45 Outfit,system-ui,sans-serif;white-space:nowrap;box-shadow:0 12px 30px rgba(0,0,0,.25);opacity:0;visibility:hidden;transition:opacity .12s}'
    + '.jm-bulle.on{opacity:1;visibility:visible}'
    + '.jm-bulle b{display:block;color:#fff;font-size:14px;font-weight:600}'
    + '[data-bulle]>[data-bt]{cursor:pointer;-webkit-tap-highlight-color:transparent;transition:opacity .15s}'
    + '[data-bulle]>[data-bt]:focus{outline:none}'
    + '[data-bulle]>[data-bt]:focus-visible{box-shadow:0 0 0 2px #fff,0 0 0 4px #004C3F}'
    + '[data-bulle].bulle-sel>[data-bt]:not(.bulle-on){opacity:.45}'
    + '[data-bulle-hint] .bh-t{display:none}'
    + '@media(hover:none){[data-bulle-hint] .bh-t{display:inline}[data-bulle-hint] .bh-s{display:none}}'
  var st = document.createElement('style')
  st.textContent = css
  document.head.appendChild(st)

  var fine = window.matchMedia && matchMedia('(hover:hover)').matches
  var tip = null, curEl = null, curC = null, curI = -1, focusAt = 0
  var esc = function (s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }
  /* Espace fine des milliers absente de certaines polices : espace insécable classique */
  var sp = function (s) { return String(s || '').replace(/ /g, ' ') }
  function bar (t) {
    var el = t && t.closest && t.closest('[data-bt]')
    return el && el.parentNode && el.parentNode.hasAttribute && el.parentNode.hasAttribute('data-bulle') ? el : null
  }
  function hide () {
    if (curEl) curEl.classList.remove('bulle-on')
    if (curC) curC.classList.remove('bulle-sel')
    if (tip) tip.classList.remove('on')
    curEl = null; curC = null; curI = -1
  }
  function show (el) {
    if (el === curEl) return
    hide()
    if (!tip) { tip = document.createElement('div'); tip.className = 'jm-bulle'; tip.setAttribute('aria-hidden', 'true'); document.body.appendChild(tip) }
    var bs = el.getAttribute('data-bs')
    tip.innerHTML = '<b>' + esc(sp(el.getAttribute('data-bt'))) + '</b>' + (bs ? esc(sp(bs)) : '')
    var r = el.getBoundingClientRect(), vw = document.documentElement.clientWidth
    var w = tip.offsetWidth, h = tip.offsetHeight
    var x = Math.max(8, Math.min(vw - 8 - w, r.left + r.width / 2 - w / 2))
    var y = r.top - h - 10
    if (y < 64) y = r.bottom + 10 /* sous la barre si le haut de l'écran (menu) la cacherait */
    tip.style.left = (x + window.scrollX) + 'px'
    tip.style.top = (y + window.scrollY) + 'px'
    tip.classList.add('on')
    curEl = el; curC = el.parentNode; curI = Array.prototype.indexOf.call(curC.children, el)
    el.classList.add('bulle-on'); curC.classList.add('bulle-sel')
  }
  /* Une page qui redessine ses barres au clic (simulateur de prix) : on garde le mois choisi */
  function keep () {
    setTimeout(function () {
      if (!curC || curI < 0) return
      var el = curC.children[curI]
      if (el && el !== curEl && el.hasAttribute('data-bt')) { curEl = el; el.classList.add('bulle-on') }
    }, 0)
  }
  if (fine) {
    document.addEventListener('mouseover', function (e) {
      var el = bar(e.target)
      if (el) show(el)
      else if (curC && !curC.contains(e.target)) hide()
    })
  }
  document.addEventListener('focusin', function (e) {
    var el = bar(e.target)
    if (el) { focusAt = Date.now(); show(el) } else if (curEl) hide()
  })
  /* Phase de capture : avant qu'une page ne redessine les barres */
  document.addEventListener('click', function (e) {
    var el = bar(e.target)
    if (!el) { hide(); return }
    /* Au toucher, le focus arrive juste avant le clic : seul un second toucher referme */
    if (!fine && el === curEl && Date.now() - focusAt > 400) { hide(); return }
    show(el)
    keep()
  }, true)
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide() })
  window.addEventListener('resize', hide)
})()
