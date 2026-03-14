(function () {
  'use strict';

  if (!document.getElementById('footer-styles')) {
    var style = document.createElement('style');
    style.id = 'footer-styles';
    style.textContent = [
      'footer{background:#001a11;padding:clamp(48px,6vw,72px) clamp(16px,5vw,60px) clamp(24px,4vw,40px);border-top:1px solid rgba(255,255,255,.05)}',
      '.ft-in{max-width:1200px;margin:0 auto}',
      '.ft-g{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:48px}',
      '.ft-desc{font-size:14px;color:rgba(255,255,255,.35);line-height:1.75;max-width:280px;margin-top:14px;font-family:\'Outfit\',sans-serif}',
      '.ft-ct{font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,213,107,.4);margin-bottom:14px;font-family:\'Outfit\',sans-serif}',
      '.ft-ls{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:4px}',
      '.ft-ls a{color:rgba(255,255,255,.4);text-decoration:none;font-size:14px;font-family:\'Outfit\',sans-serif;display:flex;align-items:center;gap:8px;padding:5px 0;transition:color .2s}',
      '.ft-ls a:hover{color:rgba(255,255,255,.8)}',
      '.ft-ls a i{font-size:14px;color:rgba(255,213,107,.35);flex-shrink:0;width:14px;text-align:center}',
      '.ft-bot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;padding-top:28px;border-top:1px solid rgba(255,255,255,.05)}',
      '.ft-cp{font-size:12px;color:rgba(255,255,255,.2);font-family:\'Outfit\',sans-serif}',
      '.socs{display:flex;gap:8px}',
      '.soc{width:34px;height:34px;border-radius:8px;border:1px solid rgba(255,255,255,.09);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.3);text-decoration:none;font-size:15px;transition:all .2s}',
      '.soc:hover{border-color:rgba(255,255,255,.3);color:#fff}',
      '@media(max-width:768px){.ft-g{grid-template-columns:1fr 1fr;gap:28px}}',
      '@media(max-width:480px){.ft-g{grid-template-columns:1fr;gap:24px}}'
    ].join('');
    document.head.appendChild(style);
  }

  var FOOTER_HTML = '<footer>'
    + '<div class="ft-in">'
      + '<div class="ft-g">'
        + '<div>'
          + '<a href="/" class="n-logo" style="text-decoration:none">'
            + '<img src="/logo.webp" alt="Jason Marinho" class="nav-logo-img" width="34" height="34" loading="lazy">'
            + '<div class="n-brand">Jason <em>Marinho</em></div>'
          + '</a>'
          + '<p class="ft-desc">Expert LCD et co-fondateur de Driing. J\'accompagne les hôtes et conciergeries à développer leur activité, honnêtement et efficacement.</p>'
        + '</div>'
        + '<div>'
          + '<div class="ft-ct">Plateforme</div>'
          + '<ul class="ft-ls">'
            + '<li><a href="/blog"><i class="ph-regular ph-newspaper"></i>Blog LCD</a></li>'
            + '<li><a href="/ressources/gabarits-messages"><i class="ph-regular ph-chat-text"></i>Gabarits messages</a></li>'
            + '<li><a href="https://app.jasonmarinho.com"><i class="ph-regular ph-layout"></i>Espace membre</a></li>'
          + '</ul>'
        + '</div>'
        + '<div>'
          + '<div class="ft-ct">Jason</div>'
          + '<ul class="ft-ls">'
            + '<li><a href="/qui-suis-je"><i class="ph-regular ph-user-circle"></i>Qui suis-je</a></li>'
            + '<li><a href="/tarifs"><i class="ph-regular ph-tag"></i>Tarifs</a></li>'
            + '<li><a href="/contact"><i class="ph-regular ph-envelope"></i>Contact</a></li>'
            + '<li><a href="https://driing.co" target="_blank" rel="noopener"><i class="ph-regular ph-arrow-square-out"></i>Driing</a></li>'
          + '</ul>'
        + '</div>'
        + '<div>'
          + '<div class="ft-ct">Légal</div>'
          + '<ul class="ft-ls">'
            + '<li><a href="/mentions-legales"><i class="ph-regular ph-file-text"></i>Mentions légales</a></li>'
            + '<li><a href="/politique-de-confidentialite"><i class="ph-regular ph-shield"></i>Confidentialité</a></li>'
            + '<li><a href="/cgvu"><i class="ph-regular ph-scroll"></i>CGV / CGU</a></li>'
          + '</ul>'
        + '</div>'
      + '</div>'
      + '<div class="ft-bot">'
        + '<div class="ft-cp">© 2026 Jason Marinho · Fait avec soin à Paris <i class="ph-bold ph-flag" style="font-size:10px;color:rgba(255,255,255,.15)"></i></div>'
        + '<div class="socs">'
          + '<a href="https://instagram.com/jason_marinho" target="_blank" rel="noopener" class="soc" aria-label="Instagram"><i class="ph-bold ph-instagram-logo"></i></a>'
          + '<a href="https://www.linkedin.com/in/jason-driing-location-sanscommission/" target="_blank" rel="noopener" class="soc" aria-label="LinkedIn"><i class="ph-bold ph-linkedin-logo"></i></a>'
          + '<a href="https://wa.me/33630212592" target="_blank" rel="noopener" class="soc" aria-label="WhatsApp"><i class="ph-bold ph-whatsapp-logo"></i></a>'
        + '</div>'
      + '</div>'
    + '</div>'
  + '</footer>';

  var tmp = document.createElement('div');
  tmp.innerHTML = FOOTER_HTML;
  var s = document.currentScript;
  while (tmp.firstChild) s.parentNode.insertBefore(tmp.firstChild, s);
}());
