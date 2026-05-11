/* Install widget — propose d'installer le site comme app ou de l'ajouter
   à l'écran d'accueil selon le navigateur détecté.

   Comportements :
   - Chrome/Edge desktop + Android : capture beforeinstallprompt et
     déclenche le prompt natif au clic sur le bouton.
   - Safari iOS : pas de prompt natif disponible, on affiche un guide
     visuel "Partager → Ajouter à l'écran d'accueil".
   - Firefox / autres : guide "Bookmark · Ctrl/Cmd+D" ou "Menu → Installer".
   - Si déjà installé (display-mode standalone) : on ne montre rien.
   - Dismiss persistant via localStorage (90 jours).
*/

(function () {
  'use strict'

  const STORAGE_KEY = 'jm-install-widget'
  const DISMISS_DAYS = 90

  // 1. Skip si déjà installé / mode standalone (PWA already on home screen)
  const isStandalone =
    window.matchMedia && window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  if (isStandalone) return

  // 2. Skip si dismissed récemment
  try {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed) {
      const t = parseInt(dismissed, 10)
      if (!isNaN(t) && Date.now() - t < DISMISS_DAYS * 86400 * 1000) return
    }
  } catch (e) { /* localStorage indisponible — on continue */ }

  // 3. Détection navigateur (sniffing minimal, suffisant pour le routage UX)
  const ua = navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/.test(ua) && !window.MSStream
  const isAndroid = /Android/.test(ua)
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua)
  const isFirefox = /Firefox|FxiOS/.test(ua)
  const isEdge = /Edg/.test(ua)
  const isChrome = /Chrome|CriOS/.test(ua) && !isEdge

  let beforeInstallEvent = null
  let widgetEl = null

  // 4. Capture l'événement natif d'installation (Chrome/Edge/Samsung/Opera)
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault()
    beforeInstallEvent = e
    if (widgetEl) {
      // Si le widget est déjà rendu sans bouton natif, on l'update
      widgetEl.querySelector('[data-install-native]')?.style.removeProperty('display')
    }
  })

  // 5. Quand l'app est installée, on cache le widget définitivement
  window.addEventListener('appinstalled', function () {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now() + 365 * 86400 * 1000)) } catch (e) {}
    if (widgetEl) widgetEl.remove()
  })

  // 6. Délai avant affichage — laisser la page se charger
  setTimeout(render, 4500)

  function render() {
    if (document.getElementById('jm-install-widget')) return

    const root = document.createElement('div')
    root.id = 'jm-install-widget'
    root.setAttribute('role', 'dialog')
    root.setAttribute('aria-label', "Installer Jason Marinho")
    root.innerHTML = template()
    document.body.appendChild(root)
    widgetEl = root

    // Bind events
    root.querySelector('[data-dismiss]').addEventListener('click', dismiss)
    const installBtn = root.querySelector('[data-install-native]')
    if (installBtn) installBtn.addEventListener('click', installNative)
    const guideBtn = root.querySelector('[data-show-guide]')
    if (guideBtn) guideBtn.addEventListener('click', () => {
      root.querySelector('[data-guide-panel]')?.classList.toggle('open')
    })

    // Animation entrée
    requestAnimationFrame(() => root.classList.add('jm-iw-open'))
  }

  function template() {
    const native = !!beforeInstallEvent
    const guideText = getGuideText()
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
        .jm-iw-actions { display:flex; gap:8px; margin-top:12px; }
        .jm-iw-btn { flex:1; padding:8px 12px; border-radius:9px; font-size:12.5px; font-weight:600;
          cursor:pointer; border:none; font-family:inherit; transition:background .15s, transform .15s; }
        .jm-iw-btn-primary { background:#004C3F; color:#FFD56B; }
        .jm-iw-btn-primary:hover { background:#003329; }
        .jm-iw-btn-ghost { background:transparent; color:rgba(15,26,13,.7);
          border:1px solid rgba(0,76,63,.18); }
        .jm-iw-btn-ghost:hover { background:rgba(0,76,63,.04); }
        .jm-iw-guide { max-height:0; overflow:hidden; transition:max-height .3s;
          font-size:12px; color:rgba(15,26,13,.7); line-height:1.55; }
        .jm-iw-guide.open { max-height:200px; margin-top:10px;
          padding-top:10px; border-top:1px solid rgba(0,76,63,.1); }
        .jm-iw-guide kbd { background:rgba(0,76,63,.08); border:1px solid rgba(0,76,63,.18);
          border-radius:4px; padding:1px 6px; font-size:11px; font-family:ui-monospace,monospace; }
        @media (max-width:480px) {
          #jm-install-widget { right:8px; bottom:8px; left:8px; width:auto; }
        }
        @media (prefers-color-scheme: dark) {
          #jm-install-widget { background:#0F1A0D; color:#FDFCF9; border-color:rgba(255,213,107,.18); }
          .jm-iw-desc { color:rgba(255,255,255,.62); }
          .jm-iw-close { color:rgba(255,255,255,.4); }
          .jm-iw-close:hover { background:rgba(255,255,255,.08); color:rgba(255,255,255,.7); }
          .jm-iw-btn-ghost { color:rgba(255,255,255,.7); border-color:rgba(255,213,107,.2); }
          .jm-iw-btn-ghost:hover { background:rgba(255,213,107,.06); }
          .jm-iw-guide { color:rgba(255,255,255,.7); }
          .jm-iw-guide { border-top-color:rgba(255,213,107,.12); }
          .jm-iw-guide kbd { background:rgba(255,255,255,.08); border-color:rgba(255,255,255,.18); }
        }
      </style>
      <div class="jm-iw-head">
        <div class="jm-iw-icon">
          <img src="/icon-192.png" alt="" width="36" height="36" />
        </div>
        <div style="flex:1;min-width:0">
          <p class="jm-iw-title">Garde Jason à portée de clic</p>
          <p class="jm-iw-desc">Installe le site comme une app pour le retrouver en un tap sur ton écran d'accueil.</p>
        </div>
        <button class="jm-iw-close" data-dismiss aria-label="Fermer">×</button>
      </div>
      <div class="jm-iw-actions">
        <button class="jm-iw-btn jm-iw-btn-primary" data-install-native
                style="${native ? '' : 'display:none'}">
          Installer l'app
        </button>
        <button class="jm-iw-btn ${native ? 'jm-iw-btn-ghost' : 'jm-iw-btn-primary'}" data-show-guide>
          ${native ? 'Autre méthode' : 'Comment faire ?'}
        </button>
      </div>
      <div class="jm-iw-guide" data-guide-panel>
        ${guideText}
      </div>
    `
  }

  function getGuideText() {
    if (isIOS && isSafari) {
      return `
        <strong>Sur Safari iPhone/iPad :</strong><br>
        1. Touche l'icône <strong>Partager</strong> en bas (⬆️)<br>
        2. Fais défiler et choisis <strong>« Sur l'écran d'accueil »</strong><br>
        3. Touche <strong>Ajouter</strong> en haut à droite
      `
    }
    if (isIOS) {
      return `
        <strong>Sur iPhone/iPad :</strong> ouvre cette page dans <strong>Safari</strong>,
        puis Partager (⬆️) → <strong>Sur l'écran d'accueil</strong>.
      `
    }
    if (isAndroid && isFirefox) {
      return `
        <strong>Sur Firefox Android :</strong> Menu (⋮) → <strong>Installer</strong>.
        Ou bien ajoute aux favoris : Menu → <strong>Marque-page</strong>.
      `
    }
    if (isAndroid) {
      return `
        <strong>Sur Android :</strong> Menu (⋮) → <strong>Installer l'application</strong>
        (ou <strong>« Ajouter à l'écran d'accueil »</strong>).
      `
    }
    if (isFirefox) {
      return `
        <strong>Sur Firefox :</strong> ajoute aux favoris avec
        <kbd>Ctrl</kbd>+<kbd>D</kbd> (ou <kbd>⌘</kbd>+<kbd>D</kbd> sur Mac).
        Firefox desktop ne propose pas l'installation PWA.
      `
    }
    if (isSafari) {
      return `
        <strong>Sur Safari Mac :</strong> ajoute aux favoris avec
        <kbd>⌘</kbd>+<kbd>D</kbd>. Pour épingler l'onglet, fais clic-droit
        sur l'onglet → <strong>Épingler l'onglet</strong>.
      `
    }
    if (isChrome || isEdge) {
      return `
        <strong>Sur ${isEdge ? 'Edge' : 'Chrome'} :</strong> clique l'icône
        d'installation (⊕) dans la barre d'adresse, ou Menu (⋮) →
        <strong>Installer Jason Marinho</strong>.
      `
    }
    return `
      Ajoute cette page aux favoris avec <kbd>Ctrl</kbd>+<kbd>D</kbd>
      (ou <kbd>⌘</kbd>+<kbd>D</kbd> sur Mac) pour la retrouver facilement.
    `
  }

  async function installNative() {
    if (!beforeInstallEvent) return
    beforeInstallEvent.prompt()
    try {
      const { outcome } = await beforeInstallEvent.userChoice
      if (outcome === 'accepted') {
        widgetEl && widgetEl.remove()
      }
    } catch (e) { /* user closed the prompt — keep widget visible */ }
    beforeInstallEvent = null
  }

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch (e) {}
    if (widgetEl) {
      widgetEl.classList.remove('jm-iw-open')
      setTimeout(() => widgetEl.remove(), 350)
    }
  }

  // Register service worker (nécessaire pour beforeinstallprompt sur Chrome/Edge)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    })
  }
})()
