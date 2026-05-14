(function () {
  var KEY = 'cookie_consent_v2';

  // ─── État de consentement ─────────────────────────────────────────────
  // Format en localStorage : JSON { essential:true, analytics:bool, t:number }
  // L'ancienne clé 'cookie_consent' (Accept/Refuse simple) est ignorée pour
  // que les anciens utilisateurs voient le nouveau bandeau granulaire.
  function getConsent() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      // Les choix valent 6 mois (recommandation CNIL).
      if (Date.now() - parsed.t > 1000 * 60 * 60 * 24 * 183) return null;
      return parsed;
    } catch (e) { return null; }
  }

  function saveConsent(analytics) {
    localStorage.setItem(KEY, JSON.stringify({
      essential: true,
      analytics: !!analytics,
      t: Date.now(),
    }));
    // Custom event pour que d'autres scripts puissent réagir si besoin.
    try { document.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: { analytics: !!analytics } })); } catch (e) {}
  }

  // ─── Styles ───────────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = [
    '#jm-cookie{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);',
    'width:calc(100% - 40px);max-width:560px;z-index:99999;',
    'background:#fff;border:1px solid rgba(0,76,63,.15);border-radius:16px;',
    'padding:20px 22px;box-shadow:0 12px 40px rgba(0,0,0,.12);',
    'font-family:Outfit,sans-serif;color:#0F1A0D;}',
    '#jm-cookie h3{margin:0 0 6px;font-size:15px;font-weight:600;}',
    '#jm-cookie p{margin:0 0 14px;font-size:13px;color:#7A8C77;line-height:1.55;}',
    '#jm-cookie p a{color:#004C3F;text-decoration:underline;}',
    '.jm-cookie-acts{display:flex;gap:8px;flex-wrap:wrap;}',
    '.jm-cookie-acts button{padding:9px 16px;border-radius:10px;font-size:13px;',
    'font-weight:500;cursor:pointer;font-family:inherit;border:1px solid transparent;}',
    '.jm-cookie-acts .jm-c-ghost{background:transparent;color:#7A8C77;border-color:rgba(0,76,63,.18);}',
    '.jm-cookie-acts .jm-c-ghost:hover{color:#0F1A0D;border-color:rgba(0,76,63,.4);}',
    '.jm-cookie-acts .jm-c-primary{background:#004C3F;color:#fff;flex:1;min-width:120px;}',
    '.jm-cookie-acts .jm-c-primary:hover{background:#003329;}',
    '.jm-cookie-cats{display:flex;flex-direction:column;gap:10px;margin:14px 0 16px;',
    'padding:14px;background:#F7F5F0;border-radius:10px;}',
    '.jm-cookie-cat{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;}',
    '.jm-cookie-cat-txt{flex:1;}',
    '.jm-cookie-cat-name{font-size:13px;font-weight:600;color:#0F1A0D;}',
    '.jm-cookie-cat-desc{font-size:12px;color:#7A8C77;line-height:1.45;margin-top:2px;}',
    '.jm-cookie-cat-lock{font-size:11px;color:#A0A8A0;font-weight:500;padding:6px 10px;',
    'border:1px solid rgba(0,76,63,.12);border-radius:100px;background:#fff;}',
    '.jm-cookie-toggle{position:relative;width:38px;height:22px;flex-shrink:0;cursor:pointer;}',
    '.jm-cookie-toggle input{opacity:0;width:0;height:0;}',
    '.jm-cookie-slider{position:absolute;inset:0;background:#D7DBD3;border-radius:22px;transition:.2s;}',
    '.jm-cookie-slider::before{content:"";position:absolute;left:3px;top:3px;width:16px;height:16px;',
    'background:#fff;border-radius:50%;transition:.2s;box-shadow:0 1px 2px rgba(0,0,0,.15);}',
    '.jm-cookie-toggle input:checked + .jm-cookie-slider{background:#004C3F;}',
    '.jm-cookie-toggle input:checked + .jm-cookie-slider::before{transform:translateX(16px);}',
    '.jm-cookie-hide{display:none !important;}',
    '@media(max-width:480px){',
    '#jm-cookie{padding:18px;border-radius:14px;}',
    '.jm-cookie-acts{flex-direction:column;}',
    '.jm-cookie-acts button{width:100%;}',
    '.jm-cookie-acts .jm-c-primary{order:-1;}',
    '}',
  ].join('');

  // ─── Construction du bandeau ──────────────────────────────────────────
  function buildBanner() {
    var banner = document.createElement('div');
    banner.id = 'jm-cookie';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Bandeau de consentement aux cookies');
    banner.innerHTML = [
      '<h3>Cookies &amp; confidentialité</h3>',
      '<p>',
      'On utilise des cookies essentiels au fonctionnement du site et, en option, ',
      'des outils d\'analyse anonyme pour mesurer la fréquentation. Aucun cookie publicitaire tiers. ',
      '<a href="/politique-de-confidentialite">En savoir plus</a>.',
      '</p>',
      '<div class="jm-cookie-cats jm-cookie-hide" id="jm-cookie-cats">',
      '  <div class="jm-cookie-cat">',
      '    <div class="jm-cookie-cat-txt">',
      '      <div class="jm-cookie-cat-name">Essentiels</div>',
      '      <div class="jm-cookie-cat-desc">Indispensables : session, préférences d\'affichage, sécurité.</div>',
      '    </div>',
      '    <span class="jm-cookie-cat-lock">Toujours actifs</span>',
      '  </div>',
      '  <div class="jm-cookie-cat">',
      '    <div class="jm-cookie-cat-txt">',
      '      <div class="jm-cookie-cat-name">Mesure d\'audience</div>',
      '      <div class="jm-cookie-cat-desc">Statistiques anonymes pour comprendre les pages les plus utiles. Aucune donnée personnelle.</div>',
      '    </div>',
      '    <label class="jm-cookie-toggle">',
      '      <input type="checkbox" id="jm-cookie-analytics" checked>',
      '      <span class="jm-cookie-slider"></span>',
      '    </label>',
      '  </div>',
      '</div>',
      '<div class="jm-cookie-acts" id="jm-cookie-acts-default">',
      '  <button class="jm-c-ghost" id="jm-cookie-refuse">Tout refuser</button>',
      '  <button class="jm-c-ghost" id="jm-cookie-custom">Personnaliser</button>',
      '  <button class="jm-c-primary" id="jm-cookie-accept">Tout accepter</button>',
      '</div>',
      '<div class="jm-cookie-acts jm-cookie-hide" id="jm-cookie-acts-custom">',
      '  <button class="jm-c-ghost" id="jm-cookie-back">Retour</button>',
      '  <button class="jm-c-primary" id="jm-cookie-save">Enregistrer mes choix</button>',
      '</div>',
    ].join('');
    return banner;
  }

  function showBanner() {
    if (document.getElementById('jm-cookie')) return;
    if (!document.head) return; // safety si appelé trop tôt
    if (!document.body) return;
    document.head.appendChild(style.cloneNode(true));
    var banner = buildBanner();
    document.body.appendChild(banner);

    var $ = function (id) { return document.getElementById(id); };

    function dismiss() {
      banner.style.opacity = '0';
      banner.style.transition = 'opacity .25s';
      setTimeout(function () { banner.remove(); }, 250);
    }

    $('jm-cookie-accept').addEventListener('click', function () {
      saveConsent(true); dismiss();
    });
    $('jm-cookie-refuse').addEventListener('click', function () {
      saveConsent(false); dismiss();
    });
    $('jm-cookie-custom').addEventListener('click', function () {
      $('jm-cookie-cats').classList.remove('jm-cookie-hide');
      $('jm-cookie-acts-default').classList.add('jm-cookie-hide');
      $('jm-cookie-acts-custom').classList.remove('jm-cookie-hide');
    });
    $('jm-cookie-back').addEventListener('click', function () {
      $('jm-cookie-cats').classList.add('jm-cookie-hide');
      $('jm-cookie-acts-default').classList.remove('jm-cookie-hide');
      $('jm-cookie-acts-custom').classList.add('jm-cookie-hide');
    });
    $('jm-cookie-save').addEventListener('click', function () {
      saveConsent($('jm-cookie-analytics').checked); dismiss();
    });
  }

  // API publique pour rouvrir le bandeau depuis un lien du footer
  // <a href="#" onclick="openCookieSettings();return false;">Gérer les cookies</a>
  window.openCookieSettings = function () {
    var existing = document.getElementById('jm-cookie');
    if (existing) existing.remove();
    showBanner();
  };

  // Affichage initial si aucun consentement valide stocké
  if (!getConsent()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  }
})();
