(function () {
  'use strict';

  /* ── Phosphor Icons (fallback si non chargé par la page) ── */
  if (!document.querySelector('link[href*="phosphor"]')) {
    ['phosphor-bold','phosphor-regular'].forEach(function(n){
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.type = 'text/css';
      l.href = '/fonts/'+n+'.css';
      document.head.appendChild(l);
    });
  }

  /* ── CSS ── */
  if (!document.getElementById('nav-styles')) {
    var style = document.createElement('style');
    style.id = 'nav-styles';
    style.textContent = [
      ':root{--g:#004C3F;--gd:#003329;--gm:#005A4A;--ol:#556B2F;--y:#FFD56B;--yw:#FFF8E1;--cr:#F7F5F0;--w:#FDFCF9;--td:#0F1A0D;--tm:#3D5038;--tl:#7A8C77;--bd:rgba(0,76,63,.09)}',
      '*,*::before,*::after{box-sizing:border-box}',

      /* Nav */
      'nav#nav{height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(16px,5vw,60px);position:fixed;top:0;left:0;right:0;z-index:200;background:var(--gd);transition:box-shadow .3s}',
      'nav#nav.sc{box-shadow:0 4px 32px rgba(0,0,0,.3)}',

      /* Logo */
      '.n-logo{display:flex;align-items:center;gap:10px;text-decoration:none;flex-shrink:0}',
      '.nav-logo-img{width:34px;height:34px;flex-shrink:0;border-radius:4px;filter:brightness(0) invert(1);opacity:.9}',
      '.n-brand{font-family:\'Fraunces\',serif;font-size:16px;font-weight:600;color:#fff;letter-spacing:-.2px;white-space:nowrap}',
      '.n-brand em{color:var(--y);font-style:italic;font-weight:300}',

      /* Desktop links */
      '.n-links{display:flex;flex-direction:row;align-items:center;gap:4px;list-style:none;margin:0;padding:0}',
      '.n-link{color:rgba(255,255,255,.55);text-decoration:none;font-size:14px;font-family:\'Outfit\',sans-serif;font-weight:500;padding:6px 12px;border-radius:7px;transition:color .2s,background .2s;white-space:nowrap}',
      '.n-link:hover,.n-link.active{color:#fff}',
      '.n-btn{background:none;border:none;color:rgba(255,255,255,.55);font:500 14px/1 \'Outfit\',sans-serif;cursor:pointer;display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:7px;transition:color .2s;white-space:nowrap}',
      '.n-btn:hover,.n-drop:hover .n-btn{color:#fff}',
      '.n-caret{width:10px;height:10px;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;transition:transform .2s;flex-shrink:0}',
      '.n-drop:hover .n-caret,.n-drop.open .n-caret{transform:rotate(180deg)}',

      /* Mega menu */
      '.n-drop{position:relative}',
      '.n-drop::after{content:"";position:absolute;bottom:-10px;left:0;right:0;height:12px}',
      '.n-mega{position:absolute;top:calc(100% + 10px);left:50%;transform:translateX(-50%) translateY(6px);opacity:0;visibility:hidden;transition:opacity .18s,transform .18s,visibility .18s;background:#001f16;border:1px solid rgba(255,213,107,.1);border-radius:14px;padding:20px;z-index:300;box-shadow:0 24px 64px rgba(0,0,0,.55);display:flex;gap:24px;pointer-events:none;min-width:200px}',
      '.n-mega::before{content:"";position:absolute;top:-5px;left:50%;transform:translateX(-50%) rotate(45deg);width:10px;height:10px;background:#001f16;border-top:1px solid rgba(255,213,107,.1);border-left:1px solid rgba(255,213,107,.1)}',
      '@media(hover:hover){.n-drop:hover>.n-mega{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0);pointer-events:auto}}',
      '.n-drop.open>.n-mega{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0);pointer-events:auto}',
      '.n-col{display:flex;flex-direction:column;gap:1px;min-width:180px}',
      '.n-col-title{font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,213,107,.45);margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.05);white-space:nowrap}',
      '.n-mega a{display:flex;align-items:center;gap:9px;color:rgba(255,255,255,.65);font-size:13.5px;font-family:\'Outfit\',sans-serif;text-decoration:none;padding:8px 9px;border-radius:7px;transition:color .15s,background .15s;white-space:nowrap}',
      '.n-mega a:hover{color:#fff;background:rgba(255,255,255,.05)}',
      '.n-mega a.active{color:var(--y)}',
      '.n-mega a i{font-size:15px;color:rgba(255,213,107,.55);flex-shrink:0;width:16px;text-align:center}',

      /* Driing card redesignée */
      '.n-driing-card{display:flex;flex-direction:column;gap:10px;background:linear-gradient(145deg,rgba(255,213,107,.09) 0%,rgba(255,213,107,.04) 100%);border:1px solid rgba(255,213,107,.22);border-radius:12px;padding:18px 16px;text-decoration:none!important;color:inherit;transition:background .2s,border-color .2s;min-width:210px;align-self:stretch}',
      '.n-driing-card:hover{background:linear-gradient(145deg,rgba(255,213,107,.16) 0%,rgba(255,213,107,.08) 100%)!important;border-color:rgba(255,213,107,.42)!important}',
      '.n-driing-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(255,213,107,.1);border:1px solid rgba(255,213,107,.18);border-radius:20px;padding:3px 9px;width:fit-content}',
      '.n-driing-dot{width:5px;height:5px;border-radius:50%;background:var(--y);flex-shrink:0;box-shadow:0 0 7px rgba(255,213,107,.7)}',
      '.n-driing-badge-txt{font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:rgba(255,213,107,.7)}',
      '.n-driing-name{font-family:\'Fraunces\',serif;font-size:22px;font-weight:400;color:#fff;letter-spacing:-.3px;line-height:1.15}',
      '.n-driing-sub{font-size:12px;color:rgba(255,255,255,.45);line-height:1.55}',
      '.n-driing-cta{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:var(--y);padding:7px 11px;background:rgba(255,213,107,.1);border-radius:7px;margin-top:2px;transition:background .2s;width:fit-content}',
      '.n-driing-card:hover .n-driing-cta{background:rgba(255,213,107,.18)}',

      /* Right CTAs */
      '.n-right{display:flex;align-items:center;gap:8px;flex-shrink:0}',
      '.nb-o{font-family:\'Outfit\',sans-serif;font-size:13px;font-weight:500;color:rgba(255,255,255,.65);border:1px solid rgba(255,255,255,.18);background:transparent;padding:8px 15px;border-radius:8px;text-decoration:none;display:flex;align-items:center;gap:5px;transition:all .2s;white-space:nowrap}',
      '.nb-o:hover{border-color:rgba(255,255,255,.4);color:#fff}',
      '.nb-c{font-family:\'Outfit\',sans-serif;font-size:13px;font-weight:600;color:var(--gd);background:var(--y);padding:8px 16px;border-radius:8px;text-decoration:none;display:flex;align-items:center;gap:5px;transition:all .2s;white-space:nowrap}',
      '.nb-c:hover{background:#ffe08f}',

      /* Hamburger */
      '.hbg{display:none;background:none;border:none;cursor:pointer;padding:6px;flex-direction:column;gap:5px;z-index:201}',
      '.hbg span{display:block;width:22px;height:2px;background:rgba(255,255,255,.7);border-radius:2px;transition:all .25s}',
      '.hbg.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}',
      '.hbg.open span:nth-child(2){opacity:0;transform:scaleX(0)}',
      '.hbg.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}',

      /* Mobile menu — compact, animé, zéro scroll */
      '.mob-menu{display:none;position:fixed;top:64px;left:0;right:0;bottom:0;background:var(--gd);border-top:1px solid rgba(255,213,107,.08);padding:4px clamp(16px,5vw,32px) 28px;z-index:199;flex-direction:column;overflow-y:auto;-webkit-overflow-scrolling:touch;opacity:0;transform:translateY(-8px);transition:opacity .2s,transform .2s}',
      '.mob-menu.open{opacity:1;transform:translateY(0)}',
      '.mob-stitle{font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,213,107,.4);padding:18px 0 4px}',
      '.mob-menu a{font-size:15px;color:rgba(255,255,255,.6);text-decoration:none;padding:13px 0;display:flex;align-items:center;gap:12px;transition:color .15s;border-bottom:1px solid rgba(255,255,255,.035)}',
      '.mob-menu a:hover,.mob-menu a:active{color:#fff}',
      '.mob-menu a i{font-size:17px;color:rgba(255,213,107,.4);flex-shrink:0;width:18px;text-align:center}',
      '.mob-sep{height:1px;background:rgba(255,255,255,.05);margin:6px 0}',

      /* Driing mobile — carte highlight */
      '.mob-driing{background:rgba(255,213,107,.06)!important;border:1px solid rgba(255,213,107,.18)!important;border-radius:10px!important;padding:13px 14px!important;margin-top:4px;border-bottom:none!important}',
      '.mob-driing i{color:var(--y)!important;opacity:.85}',
      '.mob-driing-body{display:flex;flex-direction:column;gap:1px}',
      '.mob-driing-name{font-size:15px;font-weight:500;color:var(--y);line-height:1.3}',
      '.mob-driing-sub{font-size:12px;color:rgba(255,213,107,.45)}',

      /* CTAs mobile */
      '.mob-ctas{display:flex;gap:8px;margin-top:auto;padding-top:20px;border-top:1px solid rgba(255,255,255,.06)}',
      '.mob-ctas a{flex:1;justify-content:center;font-size:14px;font-weight:500;text-decoration:none;padding:13px 0;border-radius:9px;display:flex;align-items:center;gap:6px;transition:all .2s}',
      '.mc-o{color:rgba(255,255,255,.65);border:1px solid rgba(255,255,255,.18)}',
      '.mc-o:hover{border-color:rgba(255,255,255,.35);color:#fff}',
      '.mc-c{color:var(--gd)!important;background:var(--y);font-weight:600!important}',
      '.mc-c:hover{background:#ffe08f}',

      /* Responsive */
      '@media(max-width:960px){.n-links,.n-right .nb-c{display:none}.hbg{display:flex}}',
      '@media(max-width:520px){.nb-o{display:none}}'
    ].join('');
    document.head.appendChild(style);
  }

  /* ── SVG CARET ── */
  var CARET = '<svg class="n-caret" viewBox="0 0 12 12" aria-hidden="true"><polyline points="2,4 6,8 10,4"/></svg>';

  /* ── NAV HTML ── */
  var h = '<nav id="nav">'
    + '<a href="/" class="n-logo">'
      + '<img src="/logo.webp" alt="Jason Marinho" class="nav-logo-img" width="34" height="34" loading="eager">'
      + '<span class="n-brand">Jason <em>Marinho</em></span>'
    + '</a>'
    + '<ul class="n-links">'

      /* ── Pour qui ── */
      + '<li class="n-drop">'
        + '<button class="n-btn" aria-haspopup="true" aria-expanded="false">Pour qui ' + CARET + '</button>'
        + '<div class="n-mega">'
          + '<div class="n-col">'
            + '<div class="n-col-title">Par profil</div>'
            + '<a href="/pour-qui/chambres-dhotes"><i class="ph ph-house-line"></i>Chambres d\'hôtes</a>'
            + '<a href="/pour-qui/gites"><i class="ph ph-tree-evergreen"></i>Gîtes</a>'
            + '<a href="/pour-qui/conciergeries"><i class="ph ph-buildings"></i>Conciergeries</a>'
          + '</div>'
          + '<a href="/pour-qui/membres-driing" class="n-driing-card">'
            + '<div class="n-driing-badge"><div class="n-driing-dot"></div><span class="n-driing-badge-txt">Membres</span></div>'
            + '<div class="n-driing-name">Driing</div>'
            + '<div class="n-driing-sub">Réservation directe sans commission — accédez à vos avantages exclusifs</div>'
            + '<div class="n-driing-cta">Voir mes avantages <i class="ph ph-arrow-right" style="font-size:11px"></i></div>'
          + '</a>'
        + '</div>'
      + '</li>'

      /* ── Services ── */
      + '<li class="n-drop">'
        + '<button class="n-btn" aria-haspopup="true" aria-expanded="false">Services ' + CARET + '</button>'
        + '<div class="n-mega">'
          + '<div class="n-col">'
            + '<a href="/services/formations"><i class="ph ph-graduation-cap"></i>Formations</a>'
            + '<a href="/services/securite"><i class="ph ph-shield-check"></i>Vérification voyageurs</a>'
            + '<a href="/services/communaute"><i class="ph ph-users-four"></i>Communauté LCD</a>'
            + '<a href="/services/partenaires"><i class="ph ph-handshake"></i>Partenaires exclusifs</a>'
            + '<a href="/ressources/gabarits-messages"><i class="ph ph-chat-text"></i>Gabarits de messages</a>'
          + '</div>'
        + '</div>'
      + '</li>'

      /* ── Blog ── */
      + '<li><a href="/blog" class="n-link">Blog</a></li>'

      /* ── Qui suis-je ── */
      + '<li><a href="/qui-suis-je" class="n-link">Qui suis-je</a></li>'

      /* ── Tarifs ── */
      + '<li><a href="/tarifs" class="n-link">Tarifs</a></li>'

    + '</ul>'
    + '<div class="n-right">'
      + '<a href="https://app.jasonmarinho.com/auth/login" class="nb-o"><i class="ph ph-user"></i> Mon espace</a>'
      + '<a href="https://app.jasonmarinho.com/auth/register" class="nb-c">Commencer <i class="ph-bold ph-arrow-right"></i></a>'
    + '</div>'
    + '<button class="hbg" id="hbg" aria-label="Menu"><span></span><span></span><span></span></button>'
  + '</nav>'

  /* ── MOBILE MENU — ordre identique au desktop ── */
  + '<div class="mob-menu" id="mob">'

    + '<div class="mob-stitle">Pour qui</div>'
    + '<a href="/pour-qui/chambres-dhotes"><i class="ph ph-house-line"></i>Chambres d\'hôtes</a>'
    + '<a href="/pour-qui/gites"><i class="ph ph-tree-evergreen"></i>Gîtes</a>'
    + '<a href="/pour-qui/conciergeries"><i class="ph ph-buildings"></i>Conciergeries</a>'
    + '<a href="/pour-qui/membres-driing" class="mob-driing">'
      + '<i class="ph ph-lightning"></i>'
      + '<div class="mob-driing-body">'
        + '<span class="mob-driing-name">Membres Driing</span>'
        + '<span class="mob-driing-sub">Accès inclus avec Driing</span>'
      + '</div>'
    + '</a>'

    + '<div class="mob-sep"></div>'

    + '<div class="mob-stitle">Services</div>'
    + '<a href="/services/formations"><i class="ph ph-graduation-cap"></i>Formations</a>'
    + '<a href="/services/securite"><i class="ph ph-shield-check"></i>Vérification voyageurs</a>'
    + '<a href="/services/communaute"><i class="ph ph-users-four"></i>Communauté LCD</a>'
    + '<a href="/services/partenaires"><i class="ph ph-handshake"></i>Partenaires exclusifs</a>'

    + '<div class="mob-sep"></div>'

    + '<a href="/blog"><i class="ph ph-newspaper"></i>Blog LCD</a>'
    + '<a href="/qui-suis-je"><i class="ph ph-user-circle"></i>Qui suis-je</a>'
    + '<a href="/tarifs"><i class="ph ph-tag"></i>Tarifs</a>'

    + '<div class="mob-ctas">'
      + '<a href="https://app.jasonmarinho.com/auth/login" class="mc-o"><i class="ph ph-user"></i> Mon espace</a>'
      + '<a href="https://app.jasonmarinho.com/auth/register" class="mc-c">Commencer <i class="ph-bold ph-arrow-right"></i></a>'
    + '</div>'

  + '</div>';

  /* ── INJECTION ── */
  var tmp = document.createElement('div');
  tmp.innerHTML = h;
  var s = document.currentScript;
  while (tmp.firstChild) s.parentNode.insertBefore(tmp.firstChild, s);

  /* ── INTERACTIONS ── */
  document.addEventListener('DOMContentLoaded', function () {
    var nav = document.getElementById('nav');
    var hbg = document.getElementById('hbg');
    var mob = document.getElementById('mob');

    /* Scroll shadow */
    window.addEventListener('scroll', function () {
      nav.classList.toggle('sc', window.scrollY > 10);
    }, { passive: true });

    /* Hamburger — animation fluide (opacity + translateY) */
    hbg.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = mob.classList.contains('open');
      if (!isOpen) {
        mob.style.display = 'flex';
        mob.offsetHeight; /* force reflow pour déclencher la transition */
        mob.classList.add('open');
        hbg.classList.add('open');
      } else {
        mob.classList.remove('open');
        hbg.classList.remove('open');
        mob.addEventListener('transitionend', function hide() {
          if (!mob.classList.contains('open')) mob.style.display = '';
          mob.removeEventListener('transitionend', hide);
        });
      }
    });

    /* Fermer au clic extérieur */
    document.addEventListener('click', function (e) {
      if (mob.classList.contains('open') && !mob.contains(e.target) && !hbg.contains(e.target)) {
        mob.classList.remove('open');
        hbg.classList.remove('open');
        mob.addEventListener('transitionend', function hide() {
          if (!mob.classList.contains('open')) mob.style.display = '';
          mob.removeEventListener('transitionend', hide);
        });
      }
    });

    /* Fermer mobile au clic d'un lien */
    mob.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mob.classList.remove('open');
        hbg.classList.remove('open');
      });
    });

    /* Mega menu desktop — toggle au clic (touch/clavier) */
    document.querySelectorAll('.n-drop').forEach(function (drop) {
      drop.querySelector('.n-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        var wasOpen = drop.classList.contains('open');
        document.querySelectorAll('.n-drop').forEach(function (d) { d.classList.remove('open'); });
        if (!wasOpen) drop.classList.add('open');
      });
    });
    document.addEventListener('click', function () {
      document.querySelectorAll('.n-drop.open').forEach(function (d) { d.classList.remove('open'); });
    });

    /* Échap */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.n-drop.open').forEach(function (d) { d.classList.remove('open'); });
        mob.classList.remove('open');
        hbg.classList.remove('open');
      }
    });

    /* Lien actif */
    var path = window.location.pathname;
    document.querySelectorAll('.n-mega a[href], .n-link[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href && href !== '/' && path.startsWith(href)) a.classList.add('active');
    });
  });
}());
