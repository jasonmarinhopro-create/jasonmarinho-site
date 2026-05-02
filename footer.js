(function () {
  'use strict';

  if (!document.getElementById('footer-styles')) {
    var style = document.createElement('style');
    style.id = 'footer-styles';
    style.textContent = [
      'footer{background:#001a11;padding:clamp(48px,6vw,72px) clamp(16px,5vw,60px) clamp(24px,4vw,40px);border-top:1px solid rgba(255,255,255,.05)}',
      '.ft-in{max-width:1240px;margin:0 auto}',
      '.ft-g{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:36px;margin-bottom:36px}',
      '.ft-col-brand{min-width:0}',
      '.ft-desc{font-size:14px;color:rgba(255,255,255,.35);line-height:1.75;max-width:300px;margin-top:14px;font-family:\'Outfit\',sans-serif}',
      '.ft-ct{font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,213,107,.4);margin-bottom:14px;font-family:\'Outfit\',sans-serif}',
      '.ft-ls{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:2px}',
      '.ft-ls a{color:rgba(255,255,255,.4);text-decoration:none;font-size:14px;font-family:\'Outfit\',sans-serif;display:flex;align-items:center;gap:8px;padding:5px 0;transition:color .2s;line-height:1.3}',
      '.ft-ls a:hover{color:rgba(255,255,255,.85)}',
      '.ft-ls a i{font-size:14px;color:rgba(255,213,107,.35);flex-shrink:0;width:14px;text-align:center}',
      '.ft-ls a .ft-ext{font-size:10px;color:rgba(255,213,107,.35);margin-left:2px}',
      /* Collapsible SEO sections */
      '.ft-seo{border-top:1px solid rgba(255,255,255,.05);padding-top:8px;margin-bottom:28px}',
      '.ft-seo-block{border-bottom:1px solid rgba(255,255,255,.04)}',
      '.ft-seo-block:last-child{border-bottom:none}',
      '.ft-seo-block summary{list-style:none;cursor:pointer;padding:16px 4px;display:flex;align-items:center;justify-content:space-between;font-family:\'Outfit\',sans-serif;font-size:13px;font-weight:500;color:rgba(255,255,255,.55);transition:color .2s;-webkit-tap-highlight-color:transparent}',
      '.ft-seo-block summary::-webkit-details-marker{display:none}',
      '.ft-seo-block summary:hover{color:rgba(255,255,255,.9)}',
      '.ft-seo-block summary .ft-seo-label{display:flex;align-items:center;gap:10px}',
      '.ft-seo-block summary .ft-seo-label i{font-size:14px;color:rgba(255,213,107,.5)}',
      '.ft-seo-block summary .ft-seo-caret{font-size:12px;color:rgba(255,255,255,.3);transition:transform .25s}',
      '.ft-seo-block[open] summary .ft-seo-caret{transform:rotate(180deg)}',
      '.ft-seo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:6px 24px;padding:4px 4px 20px}',
      '.ft-seo-grid a{color:rgba(255,255,255,.38);text-decoration:none;font-size:13px;font-family:\'Outfit\',sans-serif;padding:5px 0;transition:color .2s;line-height:1.4}',
      '.ft-seo-grid a:hover{color:rgba(255,255,255,.85)}',
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
      '@media(max-width:640px){.ft-g{grid-template-columns:1fr 1fr;gap:24px}.ft-bot{flex-direction:column;align-items:flex-start}.ft-legal{margin-top:-4px}.ft-seo-grid{grid-template-columns:1fr 1fr;gap:4px 16px}}',
      /* Petit mobile : 1 col */
      '@media(max-width:420px){.ft-g{grid-template-columns:1fr;gap:22px}.ft-seo-grid{grid-template-columns:1fr}}'
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
            + '<li><a href="/services/simulateurs"><i class="ph ph-calculator"></i>Simulateurs LCD</a></li>'
            + '<li><a href="/services/audit-gbp"><i class="ph ph-magnifying-glass"></i>Audit Google Business</a></li>'
            + '<li><a href="/services/calendrier"><i class="ph ph-calendar-check"></i>Calendrier & check-list</a></li>'
            + '<li><a href="/services/revenus"><i class="ph ph-chart-line-up"></i>Suivi des revenus</a></li>'
            + '<li><a href="/services/performances"><i class="ph ph-chart-bar"></i>Performances LCD</a></li>'
            + '<li><a href="/services/securite"><i class="ph ph-shield-check"></i>Vérification voyageurs</a></li>'
            + '<li><a href="/services/gabarits-messages"><i class="ph ph-chat-text"></i>Gabarits messages</a></li>'
          + '</ul>'
        + '</div>'
        + '<div>'
          + '<div class="ft-ct">Ressources</div>'
          + '<ul class="ft-ls">'
            + '<li><a href="/blog"><i class="ph ph-newspaper"></i>Blog LCD</a></li>'
            + '<li><a href="/lexique-lcd"><i class="ph ph-book-open"></i>Lexique LCD</a></li>'
            + '<li><a href="/services/actualites"><i class="ph ph-megaphone"></i>Actualités LCD</a></li>'
            + '<li><a href="/services/formations"><i class="ph ph-graduation-cap"></i>Formations</a></li>'
            + '<li><a href="/services/guides-lcd"><i class="ph ph-books"></i>Guides LCD</a></li>'
            + '<li><a href="/services/chez-nous"><i class="ph ph-house"></i>Chez Nous (forum)</a></li>'
            + '<li><a href="/services/communaute"><i class="ph ph-users-four"></i>Groupes Facebook</a></li>'
            + '<li><a href="/services/ecosysteme"><i class="ph ph-globe"></i>Écosystème LCD</a></li>'
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
      /* Sections SEO collapsibles : capture longue traîne sans polluer la nav */
      + '<div class="ft-seo">'
        + '<details class="ft-seo-block">'
          + '<summary>'
            + '<span class="ft-seo-label"><i class="ph ph-map-pin"></i>Devenir hôte par ville</span>'
            + '<i class="ph ph-caret-down ft-seo-caret"></i>'
          + '</summary>'
          + '<div class="ft-seo-grid">'
            + '<a href="/devenir-hote-airbnb-lyon">Devenir hôte à Lyon</a>'
            + '<a href="/devenir-hote-airbnb-bordeaux">Devenir hôte à Bordeaux</a>'
            + '<a href="/devenir-hote-airbnb-annecy">Devenir hôte à Annecy</a>'
            + '<a href="/devenir-hote-airbnb-nice">Devenir hôte à Nice</a>'
            + '<a href="/devenir-hote-airbnb-strasbourg">Devenir hôte à Strasbourg</a>'
            + '<a href="/devenir-hote-airbnb-biarritz">Devenir hôte à Biarritz</a>'
            + '<a href="/devenir-hote-airbnb-la-rochelle">Devenir hôte à La Rochelle</a>'
            + '<a href="/devenir-hote-airbnb-marseille">Devenir hôte à Marseille</a>'
            + '<a href="/devenir-hote-airbnb-toulouse">Devenir hôte à Toulouse</a>'
            + '<a href="/devenir-hote-airbnb-montpellier">Devenir hôte à Montpellier</a>'
            + '<a href="/devenir-hote-airbnb-nantes">Devenir hôte à Nantes</a>'
            + '<a href="/devenir-hote-airbnb-lille">Devenir hôte à Lille</a>'
            + '<a href="/devenir-hote-airbnb-aix-en-provence">Devenir hôte à Aix-en-Provence</a>'
            + '<a href="/devenir-hote-airbnb-cannes">Devenir hôte à Cannes</a>'
            + '<a href="/devenir-hote-airbnb-avignon">Devenir hôte à Avignon</a>'
            + '<a href="/devenir-hote-airbnb-chamonix">Devenir hôte à Chamonix</a>'
            + '<a href="/devenir-hote-airbnb-saint-malo">Devenir hôte à Saint-Malo</a>'
            + '<a href="/devenir-hote-airbnb-rennes">Devenir hôte à Rennes</a>'
            + '<a href="/devenir-hote-airbnb-colmar">Devenir hôte à Colmar</a>'
            + '<a href="/devenir-hote-airbnb-dijon">Devenir hôte à Dijon</a>'
            + '<a href="/devenir-hote-airbnb-arcachon">Devenir hôte à Arcachon</a>'
            + '<a href="/devenir-hote-airbnb-deauville">Devenir hôte à Deauville</a>'
            + '<a href="/devenir-hote-airbnb-reims">Devenir hôte à Reims</a>'
            + '<a href="/devenir-hote-airbnb-tours">Devenir hôte à Tours</a>'
            + '<a href="/devenir-hote-airbnb-metz">Devenir hôte à Metz</a>'
            + '<a href="/devenir-hote-airbnb-rouen">Devenir hôte à Rouen</a>'
            + '<a href="/devenir-hote-airbnb-perpignan">Devenir hôte à Perpignan</a>'
          + '</div>'
          + '<a href="/villes" style="display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-size:12px;font-weight:600;color:var(--ft-accent,#63D683);text-decoration:none;letter-spacing:.2px">Voir les guides pour les 27 villes <i class="ph-bold ph-arrow-right" style="font-size:11px"></i></a>'
        + '</details>'
        + '<details class="ft-seo-block">'
          + '<summary>'
            + '<span class="ft-seo-label"><i class="ph ph-scales"></i>Comparatifs outils LCD</span>'
            + '<i class="ph ph-caret-down ft-seo-caret"></i>'
          + '</summary>'
          + '<div class="ft-seo-grid">'
            + '<a href="/comparatif-pricelabs-beyond-wheelhouse">PriceLabs vs Beyond vs Wheelhouse</a>'
            + '<a href="/comparatif-smoobu-hospitable">Smoobu vs Hospitable</a>'
            + '<a href="/comparatif-superhote-welkeys">Superhote vs Welkeys</a>'
          + '</div>'
        + '</details>'
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
