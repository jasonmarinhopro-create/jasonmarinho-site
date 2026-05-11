/* Install widget — propose d'installer le site comme app via UN SEUL
   bouton "Installer l'app" qui s'adapte automatiquement au device :

   1. Chrome / Edge / Android compatible → déclenche le prompt natif PWA
      (instantané, l'utilisateur clique "Installer" dans la popup système).
   2. iOS Safari → overlay visuel plein écran avec instructions GRAPHIQUES
      (pas d'API native dispo, on guide l'utilisateur 1 → 2 → 3).
   3. Autres (Firefox desktop, Safari Mac…) → tente navigator.share, sinon
      affiche un guide bookmark (Ctrl/⌘+D).

   Skip si déjà installé (display-mode: standalone).
   Dismiss persistant via localStorage (90 jours).
*/

(function () {
  'use strict'

  const STORAGE_KEY = 'jm-install-widget'
  const DISMISS_DAYS = 7

  // Échappatoire : ?install=1 dans l'URL force l'affichage du widget,
  // même si l'utilisateur l'a fermé récemment. Pratique pour les liens
  // d'invitation (« clique ici pour installer »).
  const forceShow = /[?&]install=1/.test(window.location.search)

  // 1. Skip si déjà installé / mode standalone
  const isStandalone =
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone === true
  if (isStandalone && !forceShow) return

  // 2. Skip si dismissed récemment (sauf forceShow)
  if (!forceShow) {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY)
      if (dismissed) {
        const t = parseInt(dismissed, 10)
        if (!isNaN(t) && Date.now() - t < DISMISS_DAYS * 86400 * 1000) return
      }
    } catch (e) { /* localStorage indisponible — on continue */ }
  }

  // 3. Détection navigateur
  const ua = navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/.test(ua) && !window.MSStream
  const isAndroid = /Android/.test(ua)
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua)
  const isFirefox = /Firefox|FxiOS/.test(ua)
  const isEdge = /Edg/.test(ua)
  const isChrome = /Chrome|CriOS/.test(ua) && !isEdge

  let beforeInstallEvent = null
  let widgetEl = null

  // 4. Capture le prompt d'installation natif si dispo
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault()
    beforeInstallEvent = e
  })

  // 5. Si l'app finit installée, on cache le widget définitivement
  window.addEventListener('appinstalled', function () {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now() + 365 * 86400 * 1000)) } catch (e) {}
    if (widgetEl) widgetEl.remove()
  })

  // 6. Délai avant affichage (immédiat si ?install=1)
  setTimeout(render, forceShow ? 0 : 4500)

  function render() {
    if (document.getElementById('jm-install-widget')) return

    const root = document.createElement('div')
    root.id = 'jm-install-widget'
    root.setAttribute('role', 'dialog')
    root.setAttribute('aria-label', "Installer Jason Marinho")
    root.innerHTML = template()
    document.body.appendChild(root)
    widgetEl = root

    root.querySelector('[data-dismiss]').addEventListener('click', dismiss)
    root.querySelector('[data-install]').addEventListener('click', handleInstallClick)

    requestAnimationFrame(() => root.classList.add('jm-iw-open'))
  }

  function template() {
    return `
      <style>
        #jm-install-widget { position:fixed; bottom:16px; right:16px; left:auto; z-index:9998;
          width:min(360px, calc(100vw - 32px));
          background:#FDFCF9; color:#0F1A0D;
          border:1px solid rgba(0,76,63,.16); border-radius:14px;
          box-shadow:0 12px 32px rgba(0,0,0,.18);
          font-family:'Outfit',system-ui,sans-serif;
          padding:14px 16px 12px;
          transform:translateY(140%); opacity:0;
          transition:transform .35s cubic-bezier(.22,.61,.36,1), opacity .25s; }
        #jm-install-widget.jm-iw-open { transform:translateY(0); opacity:1; }
        .jm-iw-head { display:flex; align-items:flex-start; gap:10px; }
        .jm-iw-icon { width:36px; height:36px; flex-shrink:0; border-radius:9px; overflow:hidden;
          background:#004C3F; display:flex; align-items:center; justify-content:center; }
        .jm-iw-icon img { width:100%; height:100%; object-fit:cover; }
        .jm-iw-title { font-size:14px; font-weight:600; margin:0 0 2px; letter-spacing:-.1px; }
        .jm-iw-desc { font-size:12.5px; color:rgba(15,26,13,.66); margin:0; line-height:1.45; }
        .jm-iw-close { background:none; border:none; cursor:pointer; padding:4px;
          color:rgba(15,26,13,.4); font-size:18px; line-height:1; margin-left:auto;
          width:24px; height:24px; display:flex; align-items:center; justify-content:center;
          border-radius:6px; flex-shrink:0; }
        .jm-iw-close:hover { background:rgba(15,26,13,.06); color:rgba(15,26,13,.7); }
        .jm-iw-btn { width:100%; margin-top:12px; padding:10px 14px; border-radius:10px;
          font-size:13px; font-weight:600; cursor:pointer; border:none;
          font-family:inherit; background:#004C3F; color:#FFD56B;
          display:flex; align-items:center; justify-content:center; gap:7px;
          transition:background .15s, transform .15s; }
        .jm-iw-btn:hover { background:#003329; transform:translateY(-1px); }
        .jm-iw-btn:active { transform:translateY(0); }
        @media (max-width:480px) {
          #jm-install-widget { right:8px; bottom:8px; left:8px; width:auto; }
        }
        @media (prefers-color-scheme: dark) {
          #jm-install-widget { background:#0F1A0D; color:#FDFCF9; border-color:rgba(255,213,107,.18); }
          .jm-iw-desc { color:rgba(255,255,255,.62); }
          .jm-iw-close { color:rgba(255,255,255,.4); }
          .jm-iw-close:hover { background:rgba(255,255,255,.08); color:rgba(255,255,255,.7); }
        }

        /* Overlay iOS — apparaît au-dessus de tout, plein écran */
        #jm-ios-overlay { position:fixed; inset:0; z-index:99999;
          background:rgba(0,15,10,.86); backdrop-filter:blur(8px);
          display:flex; align-items:flex-end; justify-content:center;
          opacity:0; transition:opacity .25s; padding:0;
          font-family:'Outfit',system-ui,sans-serif; }
        #jm-ios-overlay.open { opacity:1; }
        .jm-ios-card { background:#FDFCF9; color:#0F1A0D; width:100%;
          max-width:480px; border-radius:20px 20px 0 0; padding:24px 20px 32px;
          transform:translateY(20px); transition:transform .3s cubic-bezier(.22,.61,.36,1); }
        #jm-ios-overlay.open .jm-ios-card { transform:translateY(0); }
        .jm-ios-head { display:flex; justify-content:space-between; align-items:center;
          margin-bottom:18px; }
        .jm-ios-title { font-family:'Fraunces',serif; font-size:22px; font-weight:400;
          margin:0; letter-spacing:-.3px; }
        .jm-ios-close { background:rgba(15,26,13,.06); border:none; cursor:pointer;
          width:32px; height:32px; border-radius:50%; font-size:20px;
          display:flex; align-items:center; justify-content:center; color:rgba(15,26,13,.55); }
        .jm-ios-step { display:flex; gap:14px; padding:12px 0;
          border-top:1px solid rgba(0,76,63,.08); }
        .jm-ios-step:first-of-type { border-top:none; }
        .jm-ios-stepNum { width:28px; height:28px; border-radius:50%; flex-shrink:0;
          background:#004C3F; color:#FFD56B; font-size:13px; font-weight:700;
          display:flex; align-items:center; justify-content:center; }
        .jm-ios-stepText { font-size:14px; line-height:1.55; padding-top:3px; flex:1; }
        .jm-ios-stepText strong { color:#004C3F; font-weight:600; }
        .jm-ios-pictogram { display:inline-flex; align-items:center; justify-content:center;
          width:24px; height:24px; vertical-align:middle; margin:0 2px;
          background:rgba(0,76,63,.08); border-radius:6px; color:#004C3F; }
        .jm-ios-arrow { display:block; text-align:center; font-size:26px;
          color:rgba(0,76,63,.4); margin:14px 0 6px; animation:jm-ios-bounce 1.4s infinite; }
        @keyframes jm-ios-bounce {
          0%, 100% { transform:translateY(0); opacity:.5; }
          50%      { transform:translateY(6px); opacity:1; }
        }
      </style>
      <div class="jm-iw-head">
        <div class="jm-iw-icon">
          <img src="/icon-192.png" alt="" width="36" height="36" />
        </div>
        <div style="flex:1;min-width:0">
          <p class="jm-iw-title">Garde Jason à portée de clic</p>
          <p class="jm-iw-desc">Ajoute le site à ton écran d'accueil pour le retrouver en un tap.</p>
        </div>
        <button class="jm-iw-close" data-dismiss aria-label="Fermer">×</button>
      </div>
      <button class="jm-iw-btn" data-install>Installer l'app</button>
    `
  }

  // Handler du bouton "Installer l'app" — choisit la meilleure méthode dispo
  async function handleInstallClick() {
    // CAS 1 — Prompt natif PWA (Chrome / Edge / Android)
    if (beforeInstallEvent) {
      beforeInstallEvent.prompt()
      try {
        const { outcome } = await beforeInstallEvent.userChoice
        if (outcome === 'accepted' && widgetEl) widgetEl.remove()
      } catch (e) {}
      beforeInstallEvent = null
      return
    }

    // CAS 2 — iOS Safari : pas d'API native, on affiche l'overlay visuel
    if (isIOS) {
      showIOSOverlay()
      return
    }

    // CAS 3 — Web Share API (mobiles non-Chrome, ex: Firefox Android)
    if (navigator.share && (isAndroid || isFirefox)) {
      try {
        await navigator.share({
          title: document.title,
          text: 'Jason Marinho — Expert location courte durée',
          url: window.location.href,
        })
        return
      } catch (e) { /* user cancelled — on tombe sur le fallback */ }
    }

    // CAS 4 — Desktop sans support PWA (Safari Mac, Firefox desktop) → bookmark
    showBookmarkHint()
  }

  // Overlay plein écran iOS avec instructions visuelles claires
  function showIOSOverlay() {
    if (document.getElementById('jm-ios-overlay')) return
    const overlay = document.createElement('div')
    overlay.id = 'jm-ios-overlay'
    overlay.innerHTML = `
      <div class="jm-ios-card">
        <div class="jm-ios-head">
          <h3 class="jm-ios-title">Ajoute Jason à ton écran d'accueil</h3>
          <button class="jm-ios-close" aria-label="Fermer">×</button>
        </div>
        <div class="jm-ios-step">
          <div class="jm-ios-stepNum">1</div>
          <div class="jm-ios-stepText">
            Touche l'icône <strong>Partager</strong>
            <span class="jm-ios-pictogram" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1L4 5h2.5v6h3V5H12L8 1zm6 12H2v-2H1v3a1 1 0 001 1h12a1 1 0 001-1v-3h-1v2z"/></svg>
            </span>
            en bas de l'écran.
          </div>
        </div>
        <div class="jm-ios-step">
          <div class="jm-ios-stepNum">2</div>
          <div class="jm-ios-stepText">
            Fais défiler la liste, puis touche
            <strong>« Sur l'écran d'accueil »</strong>
            <span class="jm-ios-pictogram" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a1 1 0 011 1v6h6a1 1 0 010 2H9v6a1 1 0 01-2 0V9H1a1 1 0 010-2h6V1a1 1 0 011-1z"/></svg>
            </span>
            <div style="margin-top:8px;font-size:12.5px;color:rgba(15,26,13,.55);background:rgba(0,76,63,.05);border-radius:8px;padding:8px 10px">
              Tu ne la vois pas&nbsp;? Touche <strong>« En voir plus »</strong> en bas de la feuille, l'option se trouve dans la liste complète.
            </div>
          </div>
        </div>
        <div class="jm-ios-step">
          <div class="jm-ios-stepNum">3</div>
          <div class="jm-ios-stepText">
            Touche <strong>Ajouter</strong> en haut à droite. C'est fait&nbsp;!
          </div>
        </div>
        <div class="jm-ios-arrow" aria-hidden="true">↓</div>
      </div>
    `
    document.body.appendChild(overlay)
    requestAnimationFrame(() => overlay.classList.add('open'))

    function closeOverlay() {
      overlay.classList.remove('open')
      setTimeout(() => overlay.remove(), 300)
    }
    overlay.querySelector('.jm-ios-close').addEventListener('click', closeOverlay)
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay() })
  }

  // Hint bookmark inline (desktop sans support PWA)
  function showBookmarkHint() {
    if (!widgetEl) return
    const isMac = /Mac/.test(navigator.platform)
    const key = isMac ? '⌘' : 'Ctrl'
    const btn = widgetEl.querySelector('[data-install]')
    if (!btn) return
    const original = btn.innerHTML
    btn.innerHTML = `Appuie sur ${key} + D pour ajouter aux favoris`
    btn.style.background = '#003329'
    btn.disabled = true
    setTimeout(() => {
      btn.innerHTML = original
      btn.style.background = ''
      btn.disabled = false
    }, 5000)
  }

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch (e) {}
    if (widgetEl) {
      widgetEl.classList.remove('jm-iw-open')
      setTimeout(() => widgetEl.remove(), 350)
    }
  }

  // Register service worker (requis pour beforeinstallprompt)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    })
  }
})()
