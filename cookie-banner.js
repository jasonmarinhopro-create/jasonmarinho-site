(function () {
  var KEY = 'cookie_consent';
  if (localStorage.getItem(KEY)) return;

  var style = document.createElement('style');
  style.textContent = [
    '#jm-cookie{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);',
    'width:calc(100% - 40px);max-width:700px;z-index:99999;',
    'background:#fff;border:1px solid rgba(0,76,63,.15);border-radius:16px;',
    'padding:18px 22px;box-shadow:0 8px 32px rgba(0,0,0,.10);',
    'display:flex;align-items:center;gap:20px;flex-wrap:wrap;',
    'font-family:Outfit,sans-serif;}',
    '#jm-cookie-text{flex:1;min-width:180px;}',
    '#jm-cookie-title{font-size:14px;font-weight:600;color:#0F1A0D;margin-bottom:3px;}',
    '#jm-cookie-desc{font-size:13px;color:#7A8C77;line-height:1.5;margin:0;}',
    '#jm-cookie-desc a{color:#004C3F;text-decoration:underline;}',
    '#jm-cookie-actions{display:flex;gap:10px;flex-shrink:0;}',
    '#jm-cookie-refuse{padding:9px 18px;border-radius:10px;border:1px solid rgba(0,76,63,.2);',
    'background:transparent;color:#7A8C77;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;}',
    '#jm-cookie-accept{padding:9px 18px;border-radius:10px;border:none;',
    'background:#004C3F;color:#fff;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;}',
  ].join('');
  document.head.appendChild(style);

  var banner = document.createElement('div');
  banner.id = 'jm-cookie';
  banner.innerHTML = [
    '<div id="jm-cookie-text">',
    '  <div id="jm-cookie-title">Cookies & confidentialité</div>',
    '  <p id="jm-cookie-desc">',
    '    Ce site utilise des cookies essentiels pour améliorer ton expérience.',
    '    Aucun cookie publicitaire tiers n\'est utilisé.',
    '    <a href="/politique-de-confidentialite.html">Politique de confidentialité</a>.',
    '  </p>',
    '</div>',
    '<div id="jm-cookie-actions">',
    '  <button id="jm-cookie-refuse">Refuser</button>',
    '  <button id="jm-cookie-accept">Accepter</button>',
    '</div>',
  ].join('');
  document.body.appendChild(banner);

  function dismiss(value) {
    localStorage.setItem(KEY, value);
    banner.style.opacity = '0';
    banner.style.transition = 'opacity .3s';
    setTimeout(function () { banner.remove(); }, 300);
  }

  document.getElementById('jm-cookie-accept').addEventListener('click', function () { dismiss('accepted'); });
  document.getElementById('jm-cookie-refuse').addEventListener('click', function () { dismiss('refused'); });
})();
