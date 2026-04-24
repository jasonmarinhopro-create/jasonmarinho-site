(function () {
  'use strict';

  if (!document.getElementById('footer-styles')) {
    var style = document.createElement('style');
    style.id = 'footer-styles';
    style.textContent = [
      'footer{background:#001a11;padding:clamp(48px,6vw,72px) clamp(16px,5vw,60px) clamp(24px,4vw,40px);border-top:1px solid rgba(255,255,255,.05)}',
      '.ft-in{max-width:1240px;margin:0 auto}',
      '.ft-g{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:36px;margin-bottom:44px}',
      '.ft-col-brand{min-width:0}',
      '.ft-desc{font-size:14px;color:rgba(255,255,255,.35);line-height:1.75;max-width:300px;margin-top:14px;font-family:\'Outfit\',sans-serif}',
      '.ft-ct{font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,213,107,.4);margin-bottom:14px;font-family:\'Outfit\',sans-serif}',
      '.ft-ls{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:2px}',
      '.ft-ls a{color:rgba(255,255,255,.4);text-decoration:none;font-size:14px;font-family:\'Outfit\',sans-serif;display:flex;align-items:center;gap:8px;padding:5px 0;transition:color .2s;line-height:1.3}',
      '.ft-ls a:hover{color:rgba(255,255,255,.85)}',
      '.ft-ls a i{font-size:14px;color:rgba(255,213,107,.35);flex-shrink:0;width:14px;text-align:center}',
      '.ft-ls a .ft-ext{font-size:10px;color:rgba(255,213,107,.35);margin-left:2px}',
      '.ft-bot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;padding-top:28px;border-top:1px solid rgba(255,255,255,.05)}',
      '.ft-bot-l{display:flex;align-items:center;flex-wrap:wrap;gap:8px 16px;font-family:\'Outfit\',sans-serif}',
      '.ft-cp{font-size:12px;color:rgba(255,255,255,.2)}',
      '.ft-legal{display:flex;align-items:center;flex-wrap:wrap;gap:4px 12px}',
      '.ft-legal a{font-size:12px;color:rgba(255,255,255,.28);text-decoration:none;transition:color .2s}',
      '.ft-legal a:hover{color:rgba(255,255,255,.7)}',
      '.ft-legal-sep{color:rgba(255,255,255,.15);font-size:11px}',
      '.socs{display:flex;gap:8px}',
      '.soc{width:40px;height:40px;border-radius:8px;border:1px solid rgba(255,255,255,.09);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.3);text-decoration:none;font-size:15px;transition:all .2s}',
      '.soc:hover{border-color:rgba(255,255,255,.3);color:#fff}',
      /* Tablet : 3 cols, brand pleine largeur */
      '@media(max-width:960px){.ft-g{grid-template-columns:repeat(3,1fr);gap:28px}.ft-col-brand{grid-column:1 / -1;max-width:520px}.ft-desc{max-width:none}}',
      /* Mobile : 2 cols */
      '@media(max-width:640px){.ft-g{grid-template-columns:1fr 1fr;gap:24px}.ft-bot{flex-direction:column;align-items:flex-start}.ft-legal{margin-top:-4px}}',
      /* Petit mobile : 1 col */
      '@media(max-width:420px){.ft-g{grid-template-columns:1fr;gap:22px}}'
    ].join('');
    document.head.appendChild(style);
  }

  var FOOTER_HTML = '<footer>'
    + '<div class="ft-in">'
      + '<div class="ft-g">'
        + '<div class="ft-col-brand">'
          + '<a href="/" class="n-logo" style="text-decoration:none">'
            + '<img src="/logo.webp" alt="Jason Marinho" class="nav-logo-img" width="34" height="34" loading="lazy">'
            + '<div class="n-brand">Jason <em>Marinho</em></div>'
          + '</a>'
          + '<p class="ft-desc">Expert LCD et co-fondateur de Driing. J\'accompagne les hôtes et conciergeries à développer leur activité, honnêtement et efficacement.</p>'
        + '</div>'
        + '<div>'
          + '<div class="ft-ct">Outils</div>'
          + '<ul class="ft-ls">'
            + '<li><a href="/services/calendrier"><i class="ph ph-calendar-check"></i>Calendrier & check-list</a></li>'
            + '<li><a href="/services/revenus"><i class="ph ph-chart-line-up"></i>Suivi des revenus</a></li>'
            + '<li><a href="/services/securite"><i class="ph ph-shield-check"></i>Vérification voyageurs</a></li>'
            + '<li><a href="/ressources/gabarits-messages"><i class="ph ph-chat-text"></i>Gabarits messages</a></li>'
          + '</ul>'
        + '</div>'
        + '<div>'
          + '<div class="ft-ct">Ressources</div>'
          + '<ul class="ft-ls">'
            + '<li><a href="/blog"><i class="ph ph-newspaper"></i>Blog LCD</a></li>'
            + '<li><a href="/services/actualites"><i class="ph ph-megaphone"></i>Actualités LCD</a></li>'
            + '<li><a href="/services/formations"><i class="ph ph-graduation-cap"></i>Formations</a></li>'
            + '<li><a href="/services/guides-lcd"><i class="ph ph-books"></i>Guides LCD</a></li>'
            + '<li><a href="/services/communaute"><i class="ph ph-users-four"></i>Communauté</a></li>'
            + '<li><a href="/services/partenaires"><i class="ph ph-handshake"></i>Partenaires</a></li>'
          + '</ul>'
        + '</div>'
        + '<div>'
          + '<div class="ft-ct">Pour qui</div>'
          + '<ul class="ft-ls">'
            + '<li><a href="/pour-qui/chambres-dhotes"><i class="ph ph-house-line"></i>Chambres d\'hôtes</a></li>'
            + '<li><a href="/pour-qui/gites"><i class="ph ph-tree-evergreen"></i>Gîtes</a></li>'
            + '<li><a href="/pour-qui/conciergeries"><i class="ph ph-buildings"></i>Conciergeries</a></li>'
            + '<li><a href="/pour-qui/membres-driing"><i class="ph ph-lightning"></i>Membres Driing</a></li>'
          + '</ul>'
        + '</div>'
        + '<div>'
          + '<div class="ft-ct">À propos</div>'
          + '<ul class="ft-ls">'
            + '<li><a href="/qui-suis-je"><i class="ph ph-user-circle"></i>Qui suis-je</a></li>'
            + '<li><a href="/tarifs"><i class="ph ph-tag"></i>Tarifs</a></li>'
            + '<li><a href="/contact"><i class="ph ph-envelope"></i>Contact</a></li>'
            + '<li><a href="https://app.jasonmarinho.com"><i class="ph ph-layout"></i>Espace membre</a></li>'
            + '<li><a href="https://driing.co" target="_blank" rel="noopener"><i class="ph ph-arrow-square-out"></i>Driing<span class="ft-ext"><i class="ph ph-arrow-up-right"></i></span></a></li>'
          + '</ul>'
        + '</div>'
      + '</div>'
      + '<div class="ft-bot">'
        + '<div class="ft-bot-l">'
          + '<div class="ft-cp">© 2026 Jason Marinho · Fait avec soin à Paris</div>'
          + '<div class="ft-legal">'
            + '<span class="ft-legal-sep">·</span>'
            + '<a href="/mentions-legales">Mentions légales</a>'
            + '<span class="ft-legal-sep">·</span>'
            + '<a href="/politique-de-confidentialite">Confidentialité</a>'
            + '<span class="ft-legal-sep">·</span>'
            + '<a href="/cgvu">CGV / CGU</a>'
          + '</div>'
        + '</div>'
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
