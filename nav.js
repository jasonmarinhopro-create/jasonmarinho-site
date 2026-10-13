(function () {
  'use strict';
  // Certaines pages incluent nav.js deux fois : sans ce garde, deux menus
  // sont injectés et chaque visite est comptée deux fois.
  if (window.__jmNavLoaded) return;
  window.__jmNavLoaded = true;

  /* ── Phosphor Icons : assure que les deux subsets (regular + bold) sont chargés ─
   * Si une page n'inclut qu'un seul subset, on ajoute le ou les manquants
   * pour éviter les icônes cassées (cas du footer qui mélange ph et ph-bold). */
  // URL écrites en entier : scripts/build-phosphor-subset.mjs y réécrit le
  // ?v= (hash du contenu) à chaque build.
  [['phosphor-bold-subset','/fonts/phosphor-bold-subset.css?v=f8a9c210db'],
   ['phosphor-regular-subset','/fonts/phosphor-regular-subset.css?v=a9d374e172']].forEach(function(s){
    if (!document.querySelector('link[href*="'+s[0]+'"]')) {
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.type = 'text/css';
      l.href = s[1];
      document.head.appendChild(l);
    }
  });

  /* ── Speculation Rules (Chrome 121+ / Edge 121+, ignoré ailleurs) ──
   * Prefetch automatique des pages internes au hover (eagerness moderate)
   * → quand l'utilisateur survole un lien, la page suivante est déjà chargée
   * → clic = navigation perçue comme instantanée
   * Coût zéro sur Firefox/Safari (script simplement ignoré). */
  if (!document.querySelector('script[type="speculationrules"]') && 'HTMLScriptElement' in window) {
    try {
      var sr = document.createElement('script');
      sr.type = 'speculationrules';
      sr.textContent = JSON.stringify({
        prefetch: [{
          source: 'document',
          where: {
            and: [
              { href_matches: '/*' },
              { not: { href_matches: '/api/*' } },
              { not: { href_matches: '/sign/*' } },
              { not: { selector_matches: 'a[rel~="external"]' } },
              { not: { selector_matches: 'a[target="_blank"]' } }
            ]
          },
          eagerness: 'moderate'
        }]
      });
      document.head.appendChild(sr);
    } catch (e) { /* navigateur ne supporte pas, fail silently */ }
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
      '.n-mega{position:absolute;top:calc(100% + 2px);left:50%;transform:translateX(-50%) translateY(6px);opacity:0;visibility:hidden;transition:opacity .18s,transform .18s,visibility .18s;background:#001f16;border:1px solid rgba(255,213,107,.1);border-radius:14px;padding:20px;z-index:300;box-shadow:0 24px 64px rgba(0,0,0,.55);display:flex;gap:24px;pointer-events:none;min-width:200px}',
      '.n-mega::before{content:"";position:absolute;top:-5px;left:50%;transform:translateX(-50%) rotate(45deg);width:10px;height:10px;background:#001f16;border-top:1px solid rgba(255,213,107,.1);border-left:1px solid rgba(255,213,107,.1)}',
      '@media(hover:hover){.n-drop:hover>.n-mega{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0);pointer-events:auto}}',
      '.n-drop.open>.n-mega{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0);pointer-events:auto}',
      '.n-col{display:flex;flex-direction:column;gap:1px;min-width:180px}',
      '.n-col-title{font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,213,107,.45);margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.05);white-space:nowrap}',
      '.n-mega a{display:flex;align-items:center;gap:9px;color:rgba(255,255,255,.65);font-size:13.5px;font-family:\'Outfit\',sans-serif;text-decoration:none;padding:8px 9px;border-radius:7px;transition:color .15s,background .15s;white-space:nowrap}',
      '.n-mega a:hover{color:#fff;background:rgba(255,255,255,.05)}',
      '.n-mega a.active{color:var(--y)}',
      '.n-mega a i{font-size:15px;color:rgba(255,213,107,.55);flex-shrink:0;width:16px;text-align:center}',
      '.n-mega-3{min-width:680px}',
      '.n-mega-3 .n-col{min-width:200px;flex:1}',

      /* Mega services : 3 colonnes par intention + carte vedette */
      '.n-mega-svc{min-width:980px;padding:28px 28px 24px;gap:32px}',
      '.n-mega-svc .n-col-svc{flex:1;min-width:200px;display:flex;flex-direction:column;gap:2px}',
      '.n-mega-svc .n-col-svc-h{font-family:\'Fraunces\',serif;font-size:15px;font-weight:500;color:#fff;letter-spacing:-.01em;margin:0 0 4px}',
      '.n-mega-svc .n-col-svc-cap{font-size:12px;color:rgba(255,255,255,.4);line-height:1.5;margin:0 0 14px}',
      '.n-mega-svc .n-col-svc a{justify-content:space-between;padding:7px 0;color:rgba(255,255,255,.78);font-size:14px;border-radius:0;border-bottom:1px solid transparent;transition:color .15s}',
      '.n-mega-svc .n-col-svc a:hover{background:transparent;color:var(--y)}',
      '.n-mega-svc .n-col-svc a:hover .n-arr{opacity:1;transform:translateX(2px)}',
      '.n-mega-svc .n-arr{font-size:11px;color:rgba(255,213,107,.6);opacity:0;transition:all .18s}',
      '.n-mega-svc .n-sub-cat{font-size:10px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:rgba(255,213,107,.55);margin:14px 0 4px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,.06)}',
      '.n-mega-svc .n-sub-cat:first-of-type{margin-top:0}',
      '.n-mega-svc .n-feat{display:flex;flex-direction:column;gap:12px;min-width:235px;max-width:260px;background:linear-gradient(160deg,#001a11 0%,var(--gd) 60%,#00463a 100%);color:#fff;border:1px solid rgba(255,213,107,.22);border-radius:12px;padding:20px;text-decoration:none!important;position:relative;overflow:hidden;transition:border-color .2s,transform .2s;white-space:normal!important;align-items:flex-start}',
      '.n-mega-svc .n-feat::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 70% 80% at 80% 30%,rgba(255,213,107,.10),transparent 70%);pointer-events:none}',
      '.n-mega-svc .n-feat>*{position:relative;z-index:1}',
      '.n-mega-svc .n-feat:hover{border-color:rgba(255,213,107,.42);transform:translateY(-2px)}',
      '.n-mega-svc .n-feat:hover .n-feat-cta{background:var(--y);color:var(--gd)}',
      '.n-mega-svc .n-feat-tag{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--y);padding:3px 10px;border-radius:999px;background:rgba(255,213,107,.10);align-self:flex-start;display:inline-flex;align-items:center;gap:5px}',
      '.n-mega-svc .n-feat-dot{width:5px;height:5px;border-radius:50%;background:var(--y);box-shadow:0 0 7px rgba(255,213,107,.7)}',
      '.n-mega-svc .n-feat-h{font-family:\'Fraunces\',serif;font-size:19px;line-height:1.25;font-weight:400;letter-spacing:-.01em;margin:0;color:#fff;white-space:normal}',
      '.n-mega-svc .n-feat-h em{color:var(--y);font-style:italic;font-weight:300}',
      '.n-mega-svc .n-feat-p{font-size:13px;color:rgba(255,255,255,.65);line-height:1.55;margin:0;white-space:normal}',
      '.n-mega-svc .n-feat-cta{margin-top:auto;display:inline-flex;align-items:center;gap:6px;padding:9px 14px;background:rgba(255,213,107,.15);color:var(--y);font-weight:600;font-size:12.5px;border-radius:8px;text-decoration:none;align-self:flex-start;transition:background .2s,color .2s}',
      '@media(max-width:1180px){.n-mega-svc{min-width:auto;width:min(96vw,900px);flex-wrap:wrap}.n-mega-svc .n-feat{flex:1 1 100%;max-width:none;flex-direction:row;align-items:center;gap:14px}}',

      /* Annuaire (proposition C validée par Jason le 13/10/2026) : 2 cartes visuelles
         comme Tarifs / Ressources + colonne « Pour les hôtes / Pour les pros » */
      '.n-mega-ann{gap:14px;padding:20px;align-items:stretch}',
      '.n-mega a.n-ann-vc{flex:0 0 196px;display:flex;flex-direction:column;justify-content:flex-end;align-items:stretch;gap:4px;min-height:190px;padding:15px;border-radius:12px;white-space:normal;position:relative;overflow:hidden;color:#fff;transition:transform .2s,border-color .2s}',
      '.n-mega a.n-ann-vc:hover{transform:translateY(-2px);color:#fff}',
      '.n-mega a.n-ann-photo,.n-mega a.n-ann-photo:hover{background:linear-gradient(160deg,#002a1f 0%,#00463a 100%);border:1px solid rgba(255,213,107,.18)}',
      '.n-mega a.n-ann-menage,.n-mega a.n-ann-menage:hover{background:linear-gradient(160deg,#3d4a22 0%,#56622c 100%);border:1px solid rgba(255,213,107,.18)}',
      '.n-mega a.n-ann-vc:hover{border-color:rgba(255,213,107,.45)}',
      '.n-ann-mos{position:absolute;top:14px;left:14px;right:14px;display:grid;grid-template-columns:repeat(3,1fr);gap:5px}',
      '.n-mega a.n-ann-vc .n-ann-mos i{display:block;width:auto;height:36px;border-radius:5px;background:linear-gradient(135deg,#4d7a5a,#2d6466)}',
      '.n-mega a.n-ann-vc .n-ann-mos i:nth-child(2n){background:linear-gradient(135deg,#2d6466,#55785a)}',
      '.n-ann-chk{position:absolute;top:14px;left:14px;right:14px;display:flex;flex-direction:column;gap:5px}',
      '.n-ann-chk>span{display:flex;align-items:center;gap:7px;font-size:11.5px;font-weight:500;padding:6px 8px;border-radius:7px;background:rgba(255,255,255,.09)}',
      '.n-mega a.n-ann-vc .n-ann-chk i{font-size:13px;width:auto;color:inherit;opacity:.85}',
      '.n-ann-chk b{margin-left:auto;font-size:10px;font-weight:700;padding:1px 7px;border-radius:999px;background:rgba(255,213,107,.8);color:#3d3a10}',
      '.n-ann-vt{font-family:\'Fraunces\',serif;font-size:18px;font-weight:500;line-height:1.2;display:block}',
      '.n-ann-vs{display:flex;align-items:center;gap:6px;font-size:12px;color:rgba(255,255,255,.68)}',
      '.n-mega a.n-ann-vc .n-ann-vs i{font-size:11px;width:auto;color:inherit;transition:transform .18s}',
      '.n-mega a.n-ann-vc:hover .n-ann-vs{color:var(--y)}',
      '.n-mega a.n-ann-vc:hover .n-ann-vs i{transform:translateX(2px)}',
      '.n-ann-side{display:flex;flex-direction:column;gap:1px;min-width:220px;padding-left:6px}',
      '.n-ann-side .n-ann-t2{margin-top:10px}',
      '.n-ann-side .n-col-title{margin-bottom:4px;padding-bottom:6px}',
      '.n-mega .n-ann-side a{padding:6px 9px}',
      '.n-mega a.n-ann-need{align-items:flex-start;color:var(--y);white-space:normal;background:rgba(255,213,107,.07);border:1px solid rgba(255,213,107,.18);padding:8px 10px!important;margin:2px 0}',
      '.n-mega a.n-ann-need:hover{background:rgba(255,213,107,.12);color:var(--y)}',
      '.n-mega a.n-ann-need i{color:var(--y);margin-top:2px}',
      '.n-ann-need b{display:block;font-weight:600;font-size:13.5px}',
      '.n-ann-need small{display:block;font-size:11.5px;color:rgba(255,255,255,.55);margin-top:1px}',

      /* Ressources (13/10/2026, proposition D + colonne de la A, choisies par Jason) :
         3 derniers articles (derniers-articles.json, écrit au build), carte Partenaires,
         colonne « Pour apprendre » / « Me connaître », ligne Le Check-in */
      '.n-mega-res{flex-direction:column;gap:14px;width:min(860px,94vw);padding:20px}',
      '.n-res-top{display:flex;gap:14px;align-items:stretch}',
      '.n-res-news-list{flex:1.5;min-width:0;display:flex;flex-direction:column;padding:15px 18px 10px;border-radius:12px;background:linear-gradient(160deg,#FFD56B 0%,#ffe39a 100%);border:1px solid rgba(255,213,107,.6);color:var(--gd)}',
      '.n-res-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:4px}',
      '.n-mega .n-res-hd a{padding:0;color:var(--gd);background:transparent;white-space:nowrap}',
      '.n-mega .n-res-hd a:hover,.n-mega .n-res-hd a.active{background:transparent;color:var(--gd)}',
      '.n-mega .n-res-hd a.n-res-h{font-family:\'Fraunces\',serif;font-size:19px;font-weight:500;gap:8px}',
      '.n-mega .n-res-hd a.n-res-all{font-size:12.5px;font-weight:600;gap:5px}',
      '.n-mega .n-res-hd a i{color:var(--gd);width:auto;font-size:16px}',
      '.n-mega .n-res-hd a.n-res-all i{font-size:11px}',
      '.n-res-arts{display:flex;flex-direction:column;min-height:150px}',
      '.n-mega .n-res-arts a{align-items:flex-start;gap:10px;padding:8px 0;border-radius:0;border-top:1px solid rgba(0,51,41,.14);color:var(--gd);font-size:13px;line-height:1.35;white-space:normal}',
      '.n-mega .n-res-arts a:hover{background:transparent;color:var(--gd);text-decoration:underline;text-underline-offset:3px}',
      '.n-res-arts small{flex-shrink:0;width:46px;font-size:11px;font-weight:600;opacity:.62;padding-top:1px}',
      '.n-res-arts span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.n-res-skel{height:34px;border-top:1px solid rgba(0,51,41,.14);display:flex;align-items:center}',
      '.n-res-skel::after{content:"";height:9px;width:80%;border-radius:9px;background:rgba(0,51,41,.1)}',
      '.n-res-arts p{margin:6px 0 0;font-size:13px;line-height:1.5;color:rgba(0,51,41,.75)}',
      '.n-mega-res a.n-res-card{flex:0 0 180px;min-height:0}',
      '.n-mega-res .n-res-more{display:flex;flex-direction:column;gap:1px;min-width:190px;padding:2px 2px 0 8px}',
      '.n-mega-res .n-res-more .n-col-title{margin-bottom:4px}',
      '.n-mega-res .n-res-more .n-res-t2{margin-top:10px}',
      '.n-mega-res .n-res-more a{padding:6px 9px}',
      '.n-mega a.n-res-checkin{align-items:center;gap:12px;padding:12px 14px;border-radius:11px;background:rgba(255,213,107,.07);border:1px solid rgba(255,213,107,.2);white-space:normal}',
      '.n-mega a.n-res-checkin:hover{background:rgba(255,213,107,.12)}',
      '.n-mega a.n-res-checkin i{color:var(--y);font-size:18px;width:auto}',
      '.n-res-checkin b{display:block;color:var(--y);font-weight:600;font-size:14px}',
      '.n-res-checkin small{display:block;font-size:12px;color:rgba(255,255,255,.55)}',
      '.n-res-go{margin-left:auto;display:flex;align-items:center;gap:5px;color:var(--y);font-size:13px;white-space:nowrap}',
      '.n-mega a.n-res-checkin .n-res-go i{font-size:12px}',
      '@media(max-width:1080px){.n-mega-res a.n-res-card{flex-basis:150px}.n-mega-res .n-res-more{min-width:170px}}',
      '.n-mega-res a.n-res-card{flex:0 0 200px;display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-start;gap:6px;min-height:210px;border-radius:12px;padding:18px;position:relative;overflow:hidden;white-space:normal;text-decoration:none;transition:transform .2s,border-color .2s}',
      '.n-mega-res a.n-res-card:hover{transform:translateY(-2px)}',
      '.n-mega-res a.n-res-part,.n-mega-res a.n-res-part:hover{background:linear-gradient(160deg,#001a11 0%,var(--gd) 60%,#00463a 100%);border:1px solid rgba(255,213,107,.22)}',
      '.n-mega-res .n-res-part:hover{border-color:rgba(255,213,107,.45)}',
      '.n-mega-res .n-res-ico{position:absolute;top:16px;left:18px;width:44px;height:44px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:22px}',
      '.n-mega-res a.n-res-card .n-res-ico i{font-size:22px;width:auto;color:inherit}',
      '.n-mega-res .n-res-part .n-res-ico{background:rgba(255,213,107,.10);color:var(--y)}',
      '.n-mega-res .n-res-card i.n-res-deco{position:absolute;right:-14px;top:40px;font-size:120px;opacity:.10;width:auto}',
      '.n-mega-res .n-res-part i.n-res-deco{color:var(--y)}',
      '.n-mega-res .n-res-t{font-family:\'Fraunces\',serif;font-size:19px;font-weight:500;letter-spacing:-.01em;position:relative}',
      '.n-mega-res .n-res-part .n-res-t{color:#fff}',
      '.n-mega-res .n-res-d{font-size:12.5px;line-height:1.45;position:relative}',
      '.n-mega-res .n-res-part .n-res-d{color:rgba(255,255,255,.6)}',

      /* Menus larges (Services, Tarifs) : centrés sur la page et collés sous la
         barre, sinon ils débordent de l'écran. Le <li> occupe toute la hauteur
         de la barre pour que le survol ne se perde pas entre bouton et menu. */
      '.n-links{align-self:stretch}',
      '.n-links>li{display:flex;align-items:center;align-self:stretch}',
      '.n-drop-wide{position:static}',
      '.n-drop-wide::after{display:none}',
      '.n-drop-wide>.n-mega{top:100%}',
      '.n-drop-wide>.n-mega::before{display:none}',
      /* Services (proposition A validée par Jason le 13/10/2026, « trop chargé ») :
         3 colonnes de 4 ou 5 liens essentiels, barre d'inscription en bas */
      '.n-mega-svc3{display:flex;flex-direction:column;gap:0;width:min(820px,94vw);padding:22px 24px 0}',
      '.n-svc3-cols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px}',
      '.n-svc3-col{display:flex;flex-direction:column;gap:1px;min-width:0}',
      '.n-svc3-h{display:flex;align-items:center;gap:9px;font-family:\'Fraunces\',serif;font-size:16px;font-weight:500;color:#fff;margin:0 0 3px}',
      '.n-svc3-h i{color:var(--y);font-size:17px}',
      '.n-svc3-cap{font-size:12px;color:rgba(255,255,255,.45);margin:0 0 8px}',
      '.n-mega .n-svc3-col a{padding:7px 8px;margin:0 -8px;white-space:normal;line-height:1.3}',
      '.n-mega .n-svc3-col a.n-svc3-all{color:rgba(255,213,107,.8);font-size:12.5px;margin-top:4px}',
      '.n-mega .n-svc3-col a.n-svc3-all:hover{color:var(--y)}',
      '.n-mega .n-svc3-col a.n-svc3-all i{font-size:11px;color:inherit;width:auto}',
      '.n-svc3-bar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:18px -24px 0;padding:14px 24px;border-top:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);border-radius:0 0 14px 14px}',
      '.n-svc3-bar p{margin:0;font-size:12.5px;color:rgba(255,255,255,.55)}',
      '.n-svc3-act{display:flex;align-items:center;gap:14px}',
      '.n-mega .n-svc3-act a.n-svc3-tar{color:rgba(255,255,255,.72);padding:6px 8px}',
      '.n-mega a.n-svc3-cta,.n-mega a.n-svc3-cta:hover{background:var(--y);color:var(--gd);font-weight:600;font-size:13px;padding:10px 15px;border-radius:9px}',
      '.n-mega a.n-svc3-cta:hover{background:#ffe08f}',
      '.n-mega a.n-svc3-cta i{color:var(--gd);font-size:12px;width:auto}',

      /* Tarifs (façon Shine) : une carte visuelle par offre + offres spéciales */
      '.n-mega-tar{flex-direction:column;gap:14px;padding:22px}',
      '.n-tar-top{display:flex;gap:16px;align-items:stretch}',
      '.n-mega a.n-tar-card{flex:0 0 190px;display:flex;flex-direction:column;align-items:stretch;justify-content:space-between;gap:14px;min-height:236px;padding:16px;border-radius:12px;white-space:normal;position:relative;overflow:hidden;transition:transform .2s}',
      '.n-mega a.n-tar-card:hover{transform:translateY(-2px)}',
      '.n-mega a.n-tar-hote,.n-mega a.n-tar-hote:hover{background:linear-gradient(160deg,#FFE9A8 0%,var(--y) 100%);color:var(--gd)}',
      '.n-mega a.n-tar-photo,.n-mega a.n-tar-photo:hover{background:linear-gradient(160deg,#00463a 0%,#003329 100%);border:1px solid rgba(255,213,107,.2);color:#fff}',
      '.n-mega a.n-tar-menage,.n-mega a.n-tar-menage:hover{background:linear-gradient(160deg,#556B2F 0%,#3d5022 100%);color:#fff}',
      '.n-tar-vis{display:flex;flex-direction:column;gap:6px}',
      '.n-tar-row{display:flex;align-items:center;gap:7px;font-size:11.5px;font-weight:500;padding:7px 9px;border-radius:8px;background:rgba(255,255,255,.75);color:var(--gd)}',
      '.n-tar-row-dk{background:rgba(255,255,255,.1);color:#fff}',
      '.n-mega a.n-tar-card .n-tar-row i{font-size:13px;width:auto;color:inherit;opacity:.8}',
      '.n-tar-row b{margin-left:auto;font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px;background:rgba(0,51,41,.1);white-space:nowrap}',
      '.n-tar-row{white-space:nowrap}',
      '.n-tar-row-dk b{background:rgba(255,213,107,.18);color:var(--y)}',
      '.n-tar-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}',
      '.n-mega a.n-tar-card .n-tar-grid i{display:block;width:auto;aspect-ratio:1;border-radius:5px;background:linear-gradient(135deg,rgba(255,213,107,.35),rgba(255,255,255,.08))}',
      '.n-mega a.n-tar-card .n-tar-grid i{background:linear-gradient(135deg,#4d7a5a,#2d6466)}',
      '.n-mega a.n-tar-card .n-tar-grid i:nth-child(2n){background:linear-gradient(135deg,#2d6466,#55785a)}',
      '.n-tar-foot{display:block}',
      '.n-tar-t{font-family:\'Fraunces\',serif;font-size:18px;font-weight:500;line-height:1.2;display:block}',
      '.n-tar-s{font-size:12px;line-height:1.4;opacity:.72;display:block;margin-top:3px}',
      '.n-tar-side{display:flex;flex-direction:column;gap:1px;min-width:220px;padding-left:6px}',
      '.n-tar-side .n-col-title{margin-bottom:4px;padding-bottom:6px}',
      '.n-tar-side .n-tar-t2{margin-top:10px}',
      '.n-mega .n-tar-side a{padding:6px 9px}',
      '.n-mega a.n-tar-band{align-items:center;gap:12px;padding:12px 14px;border-radius:11px;background:rgba(255,213,107,.07);border:1px solid rgba(255,213,107,.2);white-space:normal}',
      '.n-mega a.n-tar-band:hover{background:rgba(255,213,107,.12)}',
      '.n-mega a.n-tar-band i{color:var(--y);font-size:18px;width:auto}',
      '.n-tar-band b{display:block;color:var(--y);font-weight:600;font-size:14px}',
      '.n-tar-band small{display:block;font-size:12px;color:rgba(255,255,255,.55)}',
      '.n-tar-go{margin-left:auto;display:flex;align-items:center;gap:5px;color:var(--y);font-size:13px;white-space:nowrap}',
      '.n-mega a.n-tar-band .n-tar-go i{font-size:12px}',
      '@media(max-width:1180px){.n-mega a.n-tar-card{flex-basis:168px}.n-tar-side{min-width:186px}.n-tar-row{font-size:11px;padding:6px 7px;gap:5px}.n-tar-row b{padding:2px 5px}}',

      '.n-tag-free{display:inline-flex;align-items:center;font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;padding:2px 6px;border-radius:999px;background:rgba(99,214,131,.18);color:#7AE89A;border:1px solid rgba(99,214,131,.30);margin-left:auto;flex-shrink:0}',
      '.n-mega a.n-sub-link{color:rgba(255,213,107,.7);font-size:12.5px;margin-top:4px;border-top:1px dashed rgba(255,255,255,.06);padding-top:10px}',
      '.n-mega a.n-sub-link:hover{color:var(--y)}',
      '@media(max-width:1080px){.n-mega-3{min-width:0;flex-direction:column;gap:14px}}',

      /* Pour qui (proposition A, 13/10/2026) : « Tu loues » / « Tu travailles pour les hôtes » + bandeau Driing */
      '.n-mega-pq{flex-direction:column;gap:14px;width:min(660px,94vw);padding:20px 22px}',
      '.n-pq-cols{display:grid;grid-template-columns:1fr 1fr;gap:26px}',
      '.n-pq-col{display:flex;flex-direction:column;gap:1px;min-width:0}',
      '.n-mega .n-pq-col a{align-items:flex-start;gap:11px;padding:8px;margin:0 -8px;white-space:normal}',
      '.n-mega .n-pq-col a i{font-size:17px;margin-top:2px;color:rgba(255,213,107,.7)}',
      '.n-pq-col b{display:block;font-weight:500;font-size:14px;color:#fff;line-height:1.3}',
      '.n-pq-col small{display:block;font-size:12px;color:rgba(255,255,255,.5);line-height:1.35;margin-top:1px}',
      '.n-mega a.n-pq-driing{align-items:center;gap:12px;padding:12px 14px;border-radius:11px;background:rgba(255,213,107,.07);border:1px solid rgba(255,213,107,.2);white-space:normal}',
      '.n-mega a.n-pq-driing:hover{background:rgba(255,213,107,.12)}',
      '.n-mega a.n-pq-driing i{color:var(--y);font-size:18px;width:auto}',
      '.n-pq-driing b{display:block;color:var(--y);font-weight:600;font-size:14px}',
      '.n-pq-driing small{display:block;font-size:12px;color:rgba(255,255,255,.55)}',
      '.n-pq-go{margin-left:auto;display:flex;align-items:center;gap:5px;color:var(--y);font-size:13px;white-space:nowrap}',
      '.n-mega a.n-pq-driing .n-pq-go i{font-size:12px}',

      /* Right CTAs */
      '.n-right{display:flex;align-items:center;gap:8px;flex-shrink:0}',
      '.nb-o{font-family:\'Outfit\',sans-serif;font-size:13px;font-weight:500;color:rgba(255,255,255,.65);border:1px solid rgba(255,255,255,.18);background:transparent;padding:10px 15px;border-radius:8px;text-decoration:none;display:flex;align-items:center;gap:5px;transition:all .2s;white-space:nowrap;min-height:40px}',
      '.nb-o:hover{border-color:rgba(255,255,255,.4);color:#fff}',
      '.nb-c{font-family:\'Outfit\',sans-serif;font-size:13px;font-weight:600;color:var(--gd);background:var(--y);padding:10px 16px;border-radius:8px;text-decoration:none;display:flex;align-items:center;gap:5px;transition:all .2s;white-space:nowrap;min-height:40px}',
      '.nb-c:hover{background:#ffe08f}',

      /* Hamburger */
      '.hbg{display:none;background:none;border:none;cursor:pointer;padding:10px;flex-direction:column;gap:5px;z-index:201;min-width:40px;min-height:40px;justify-content:center;align-items:center}',
      '.hbg span{display:block;width:22px;height:2px;background:rgba(255,255,255,.7);border-radius:2px;transition:all .25s}',
      '.hbg.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}',
      '.hbg.open span:nth-child(2){opacity:0;transform:scaleX(0)}',
      '.hbg.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}',

      /* Mobile menu (refonte 13/10/2026, Jason : en-têtes en petites capitales
         peu lisibles, Annuaire trop gros) : rubriques avec icône + sous-titre,
         un seul accordéon ouvert, Annuaire et Ressources en cartes compactes,
         boutons du bas toujours visibles, page derrière bloquée. */
      '.mob-menu{display:none;position:fixed;top:64px;left:0;right:0;bottom:0;background:var(--gd);border-top:1px solid rgba(255,213,107,.08);padding:6px clamp(16px,5vw,32px) 0;z-index:199;flex-direction:column;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;opacity:0;transform:translateY(-8px);transition:opacity .2s,transform .2s}',
      '.mob-menu.open{opacity:1;transform:translateY(0)}',
      '.mob-stitle{font-size:10px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:rgba(255,213,107,.6);padding:18px 0 6px;display:block}',
      '.mob-menu a{font-size:15px;color:rgba(255,255,255,.78);text-decoration:none;padding:11px 0;display:flex;align-items:center;gap:12px;transition:color .15s;border-bottom:1px solid rgba(255,255,255,.04)}',
      '.mob-menu a:hover,.mob-menu a:active{color:#fff}',
      '.mob-menu a i{font-size:17px;color:rgba(255,213,107,.6);flex-shrink:0;width:20px;text-align:center}',
      '.mob-acc{border-bottom:1px solid rgba(255,255,255,.06)}',
      '.mob-acc-btn{width:100%;background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:13px;padding:13px 0;color:#fff;font-family:\'Outfit\',sans-serif;text-align:left;-webkit-tap-highlight-color:transparent}',
      '.mob-acc-ico{width:38px;height:38px;border-radius:10px;background:rgba(255,213,107,.09);color:var(--y);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;transition:background .2s,color .2s}',
      '.mob-acc-txt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}',
      '.mob-acc-txt b{font-size:16px;font-weight:500;line-height:1.2;transition:color .2s}',
      '.mob-acc-txt small{font-size:12.5px;color:rgba(255,255,255,.5);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.mob-acc.open .mob-acc-ico{background:var(--y);color:var(--gd)}',
      '.mob-acc.open .mob-acc-txt b{color:var(--y)}',
      '.mob-acc-arrow{width:12px;height:12px;fill:none;stroke:rgba(255,255,255,.45);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;transition:transform .25s;flex-shrink:0}',
      '.mob-acc.open .mob-acc-arrow{transform:rotate(180deg);stroke:var(--y)}',
      '.mob-acc-body{max-height:0;overflow:hidden;transition:max-height .35s ease;padding-left:51px}',
      '.mob-acc.open .mob-acc-body{max-height:1600px;padding-bottom:14px}',
      '.mob-acc-body.mob-wide{padding-left:0}',
      '.mob-acc-body>a:last-child{border-bottom:none}',

      /* Tablette : grille 2 colonnes dans les accordéons pour densifier */
      '@media(min-width:560px) and (max-width:960px){',
        '.mob-acc-body{display:grid;grid-template-columns:1fr 1fr;column-gap:28px;row-gap:0;align-content:start}',
        '.mob-acc-body .mob-stitle,.mob-acc-body .mob-vgrid,.mob-acc-body .mob-driing,.mob-acc-body .mob-sublink{grid-column:1 / -1}',
      '}',

      /* Lien "Voir tout" discret */
      '.mob-sublink{font-size:13px!important;color:rgba(255,213,107,.75)!important;padding:10px 0 6px!important;border-bottom:none!important;display:inline-flex!important;align-items:center;gap:6px}',
      '.mob-sublink:hover{color:var(--y)!important}',
      '.mob-sublink i{color:rgba(255,213,107,.6)!important;font-size:12px!important;width:auto!important}',

      /* Ligne mise en avant (Driing, Décrire mon besoin) */
      '.mob-driing{background:rgba(255,213,107,.07)!important;border:1px solid rgba(255,213,107,.2)!important;border-radius:11px!important;padding:12px 14px!important;margin-top:8px;border-bottom:1px solid rgba(255,213,107,.2)!important}',
      '.mob-driing i{color:var(--y)!important}',
      '.mob-driing-body{display:flex;flex-direction:column;gap:1px;flex:1}',
      '.mob-driing-name{font-size:15px;font-weight:600;color:var(--y);line-height:1.3}',
      '.mob-driing-sub{font-size:12px;color:rgba(255,255,255,.55)}',

      /* Cartes visuelles compactes (Annuaire, Ressources) */
      '.mob-vgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding-top:4px}',
      '.mob-menu a.mob-vc{position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;align-items:stretch;gap:2px;min-height:134px;padding:12px;border-radius:12px;border:1px solid rgba(255,213,107,.18);color:#fff}',
      '.mob-menu a.mob-vc-photo{background:linear-gradient(160deg,#002a1f 0%,#00463a 100%)}',
      '.mob-menu a.mob-vc-menage{background:linear-gradient(160deg,#3d4a22 0%,#56622c 100%)}',
      '.mob-menu a.mob-vc-blog{background:linear-gradient(160deg,#FFD56B 0%,#ffe39a 100%);color:var(--gd);border-color:rgba(255,213,107,.6)}',
      '.mob-menu a.mob-vc-part{background:linear-gradient(160deg,#001a11 0%,#00463a 100%)}',
      '.mob-vc .n-ann-mos{top:12px;left:12px;right:12px;gap:4px}',
      '.mob-menu a.mob-vc .n-ann-mos i{display:block;width:auto;height:26px;border-radius:5px;background:linear-gradient(135deg,#4d7a5a,#2d6466)}',
      '.mob-menu a.mob-vc .n-ann-mos i:nth-child(2n){background:linear-gradient(135deg,#2d6466,#55785a)}',
      '.mob-vc .n-ann-chk{top:12px;left:12px;right:12px;gap:4px}',
      '.mob-vc .n-ann-chk>span{font-size:11px;padding:4px 7px;gap:5px}',
      '.mob-menu a.mob-vc .n-ann-chk i{font-size:12px;width:auto;color:inherit}',
      '.mob-vc .n-ann-chk b{font-size:9.5px;padding:1px 6px}',
      '.mob-vc-ico{position:absolute;top:12px;left:12px;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center}',
      '.mob-menu a.mob-vc .mob-vc-ico i{font-size:19px;width:auto;color:inherit}',
      '.mob-vc-blog .mob-vc-ico{background:rgba(0,51,41,.1);color:var(--gd)}',
      '.mob-vc-part .mob-vc-ico{background:rgba(255,213,107,.1);color:var(--y)}',
      '.mob-vt{font-family:\'Fraunces\',serif;font-size:16.5px;font-weight:500;line-height:1.2}',
      '.mob-vs{display:flex;align-items:center;gap:5px;font-size:12px;opacity:.72}',
      '.mob-menu a.mob-vc .mob-vs i{font-size:11px;width:auto;color:inherit}',

      /* Offres du menu Tarifs (mobile) */
      '.mob-menu a.mob-offer{gap:12px;padding:12px;border-radius:12px;margin-top:8px;border-bottom:none}',
      '.mob-menu a.mob-offer-hote{background:linear-gradient(160deg,#FFE9A8,#FFD56B);color:var(--gd)}',
      '.mob-menu a.mob-offer-photo{background:linear-gradient(160deg,#002a1f,#00463a);border:1px solid rgba(255,213,107,.18);color:#fff}',
      '.mob-menu a.mob-offer-menage{background:linear-gradient(160deg,#3d4a22,#56622c);color:#fff}',
      '.mob-offer-ic{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:rgba(255,213,107,.12);color:var(--y)}',
      '.mob-offer-hote .mob-offer-ic{background:rgba(0,51,41,.1);color:var(--gd)}',
      '.mob-menu a.mob-offer .mob-offer-ic i{font-size:17px;width:auto;color:inherit}',
      '.mob-offer-t{flex:1;min-width:0}',
      '.mob-offer-t b{display:block;font-size:15px;font-weight:600}',
      '.mob-offer-t small{display:block;font-size:12px;opacity:.78}',
      '.mob-menu a.mob-offer i.mob-offer-go{margin-left:auto;font-size:15px;width:auto;color:inherit;opacity:.8}',
      '@media(min-width:560px) and (max-width:960px){.mob-acc-body .mob-offer{grid-column:1 / -1}}',

      /* Boutons du bas, toujours visibles */
      '.mob-ctas{display:flex;gap:8px;margin-top:auto;position:sticky;bottom:0;background:var(--gd);padding:14px 0 calc(14px + env(safe-area-inset-bottom));border-top:1px solid rgba(255,255,255,.07);z-index:2}',
      '.mob-ctas a{flex:1;justify-content:center;font-size:14px;font-weight:500;text-decoration:none;padding:13px 0;border-radius:9px;display:flex;align-items:center;gap:6px;transition:all .2s;border-bottom:none}',
      '.mc-o{color:rgba(255,255,255,.75)!important;border:1px solid rgba(255,255,255,.2)!important}',
      '.mc-o:hover{border-color:rgba(255,255,255,.35);color:#fff}',
      '.mc-c{color:var(--gd)!important;background:var(--y);font-weight:600!important}',
      '.mc-c:hover{background:#ffe08f}',
      '.mob-ctas a i{width:auto!important}',
      '.mc-c i{color:var(--gd)!important}',
      '.mc-o i{color:inherit!important}',
      'html.mob-lock,html.mob-lock body{overflow:hidden}',

      /* Responsive */
      '@media(max-width:960px){.n-links,.n-right .nb-c,.n-right .nb-o{display:none}.hbg{display:flex}}'
    ].join('');
    document.head.appendChild(style);
  }

  /* ── SVG CARET ── */
  var CARET = '<svg class="n-caret" viewBox="0 0 12 12" aria-hidden="true"><polyline points="2,4 6,8 10,4"/></svg>';
  var MOB_ARROW = '<svg class="mob-acc-arrow" viewBox="0 0 12 12" aria-hidden="true"><polyline points="2,4 6,8 10,4"/></svg>';
  function accBtn(icon, title, sub) {
    return '<button class="mob-acc-btn" aria-expanded="false">'
      + '<span class="mob-acc-ico"><i class="ph ' + icon + '"></i></span>'
      + '<span class="mob-acc-txt"><b>' + title + '</b><small>' + sub + '</small></span>'
      + MOB_ARROW + '</button>';
  }

  /* ── NAV HTML ── */
  var h = '<nav id="nav">'
    + '<a href="/" class="n-logo">'
      + '<img src="/logo-nav.webp" alt="Jason Marinho" class="nav-logo-img" width="34" height="34" loading="eager">'
      + '<span class="n-brand">Jason <em>Marinho</em></span>'
    + '</a>'
    + '<ul class="n-links">'

      /* ── Services : 3 colonnes de liens essentiels (proposition A, 13/10/2026) ── */
      + '<li class="n-drop n-drop-wide">'
        + '<button class="n-btn" aria-haspopup="true" aria-expanded="false">Services ' + CARET + '</button>'
        + '<div class="n-mega n-mega-svc3">'
          + '<div class="n-svc3-cols">'
            + '<div class="n-svc3-col">'
              + '<div class="n-svc3-h"><i class="ph ph-calendar-check"></i>Gérer ta location</div>'
              + '<div class="n-svc3-cap">Dans l\'app, au quotidien</div>'
              + '<a href="/services/contrats"><i class="ph ph-signature"></i>Contrats & paiements</a>'
              + '<a href="/services/planning-menage"><i class="ph ph-broom"></i>Planning ménage</a>'
              + '<a href="/services/declarations-voyageurs"><i class="ph ph-identification-card"></i>Déclarations voyageurs</a>'
              + '<a href="/services/calendrier"><i class="ph ph-calendar-check"></i>Calendrier & check-list</a>'
              + '<a href="/services/securite"><i class="ph ph-shield-check"></i>Vérifier un voyageur</a>'
              + '<a href="/services" class="n-svc3-all">Tous les services <i class="ph-bold ph-arrow-right"></i></a>'
            + '</div>'
            + '<div class="n-svc3-col">'
              + '<div class="n-svc3-h"><i class="ph ph-calculator"></i>Chiffrer & investir</div>'
              + '<div class="n-svc3-cap">Simulateurs gratuits</div>'
              + '<a href="/calculateurs/revenus-lcd"><i class="ph ph-trend-up"></i>Estimateur de revenus</a>'
              + '<a href="/services/simulateurs/rentabilite-location-courte-duree"><i class="ph ph-chart-line-up"></i>Rentabilité LCD</a>'
              + '<a href="/services/simulateurs/fiscalite-micro-bic"><i class="ph ph-currency-eur"></i>Fiscalité micro-BIC</a>'
              + '<a href="/services/simulateurs/taxe-de-sejour"><i class="ph ph-map-pin"></i>Taxe de séjour</a>'
              + '<a href="/services/simulateurs" class="n-svc3-all">Tous les simulateurs <i class="ph-bold ph-arrow-right"></i></a>'
            + '</div>'
            + '<div class="n-svc3-col">'
              + '<div class="n-svc3-h"><i class="ph ph-graduation-cap"></i>Apprendre</div>'
              + '<div class="n-svc3-cap">Formations et entraide</div>'
              + '<a href="/services/formations"><i class="ph ph-graduation-cap"></i>Formations LCD</a>'
              + '<a href="/services/guides-lcd"><i class="ph ph-books"></i>Guides LCD</a>'
              + '<a href="/services/entre-hotes"><i class="ph ph-chats-circle"></i>Questions & réponses</a>'
              + '<a href="/sos-hote"><i class="ph ph-lifebuoy"></i>SOS Hôte (urgences)</a>'
              + '<a href="/services/formations" class="n-svc3-all">Toutes les formations <i class="ph-bold ph-arrow-right"></i></a>'
            + '</div>'
          + '</div>'
          + '<div class="n-svc3-bar">'
            + '<p>Gratuit pour commencer, sans carte bancaire.</p>'
            + '<span class="n-svc3-act">'
              + '<a href="/tarifs" class="n-svc3-tar"><i class="ph ph-tag"></i>Voir les tarifs</a>'
              + '<a href="https://app.jasonmarinho.com/auth/register" class="n-svc3-cta">Créer mon compte gratuit <i class="ph-bold ph-arrow-right"></i></a>'
            + '</span>'
          + '</div>'
        + '</div>'
      + '</li>'

      /* ── Annuaire (de retour dans la barre le 04/10/2026, demande de Jason : trop caché dans Services) ── */
      + '<li class="n-drop">'
        + '<button class="n-btn" aria-haspopup="true" aria-expanded="false">Annuaire ' + CARET + '</button>'
        + '<div class="n-mega n-mega-ann">'
          + '<a href="/annuaires/photographes" class="n-ann-vc n-ann-photo">'
            + '<span class="n-ann-mos" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>'
            + '<span class="n-ann-vt">Photographes</span>'
            + '<span class="n-ann-vs">Voir l\'annuaire <i class="ph-bold ph-arrow-right"></i></span>'
          + '</a>'
          + '<a href="/annuaires/menage" class="n-ann-vc n-ann-menage">'
            + '<span class="n-ann-chk" aria-hidden="true">'
              + '<span><i class="ph-bold ph-check-circle"></i>Chambres<b>Fait</b></span>'
              + '<span><i class="ph-bold ph-check-circle"></i>Linge<b>Fait</b></span>'
              + '<span><i class="ph-bold ph-camera"></i>Photos<b>Envoyées</b></span>'
            + '</span>'
            + '<span class="n-ann-vt">Équipes de ménage</span>'
            + '<span class="n-ann-vs">Voir l\'annuaire <i class="ph-bold ph-arrow-right"></i></span>'
          + '</a>'
          + '<div class="n-ann-side">'
            + '<div class="n-col-title">Pour les hôtes</div>'
            + '<a href="/trouver-un-pro" class="n-ann-need"><i class="ph-bold ph-paper-plane-tilt"></i><span><b>Décrire mon besoin</b><small>Les pros viennent à toi</small></span></a>'
            + '<div class="n-col-title n-ann-t2">Pour les pros</div>'
            + '<a href="/devenir-photographe-lcd"><i class="ph ph-camera"></i>Devenir photographe</a>'
            + '<a href="/devenir-prestataire-menage-lcd"><i class="ph ph-sparkle"></i>Devenir équipe de ménage</a>'
            + '<a href="/tarifs#photographes"><i class="ph ph-tag"></i>Tarifs des fiches</a>'
            + '<a href="/chiffres"><i class="ph ph-chart-line-up"></i>La visibilité en chiffres</a>'
          + '</div>'
        + '</div>'
      + '</li>'

      /* ── Pour qui : deux familles + bandeau Driing (proposition A, 13/10/2026) ── */
      + '<li class="n-drop">'
        + '<button class="n-btn" aria-haspopup="true" aria-expanded="false">Pour qui ' + CARET + '</button>'
        + '<div class="n-mega n-mega-pq">'
          + '<div class="n-pq-cols">'
            + '<div class="n-pq-col">'
              + '<div class="n-col-title">Tu loues</div>'
              + '<a href="/pour-qui/gites"><i class="ph ph-tree-evergreen"></i><span><b>Gîtes</b><small>Remplir le calendrier, plus de direct</small></span></a>'
              + '<a href="/pour-qui/chambres-dhotes"><i class="ph ph-house-line"></i><span><b>Chambres d\'hôtes</b><small>Visibilité Google et réservations directes</small></span></a>'
              + '<a href="/pour-qui/conciergeries"><i class="ph ph-buildings"></i><span><b>Conciergeries</b><small>Gérer plusieurs logements sans s\'éparpiller</small></span></a>'
              + '<a href="/pour-qui/investisseurs"><i class="ph ph-chart-line-up"></i><span><b>Investisseurs</b><small>Estimer un bien avant d\'acheter</small></span></a>'
            + '</div>'
            + '<div class="n-pq-col">'
              + '<div class="n-col-title">Tu travailles pour les hôtes</div>'
              + '<a href="/pour-qui/photographes"><i class="ph ph-camera"></i><span><b>Photographes</b><small>Une fiche vue par les hôtes de ta ville</small></span></a>'
              + '<a href="/pour-qui/menage"><i class="ph ph-sparkle"></i><span><b>Équipes de ménage</b><small>Des clients et leur planning, sans commission</small></span></a>'
            + '</div>'
          + '</div>'
          + '<a href="/pour-qui/membres-driing" class="n-pq-driing"><i class="ph ph-lightning"></i><span><b>Membre Driing ?</b><small>Ton accès à l\'app est inclus</small></span><span class="n-pq-go">Voir mes avantages <i class="ph-bold ph-arrow-right"></i></span></a>'
        + '</div>'
      + '</li>'

      /* ── Ressources : derniers articles, Partenaires, liens rangés, Le Check-in (13/10/2026) ── */
      + '<li class="n-drop n-drop-res">'
        + '<button class="n-btn" aria-haspopup="true" aria-expanded="false">Ressources ' + CARET + '</button>'
        + '<div class="n-mega n-mega-res">'
          + '<div class="n-res-top">'
            + '<div class="n-res-news-list">'
              + '<div class="n-res-hd">'
                + '<a href="/blog" class="n-res-h"><i class="ph-bold ph-newspaper"></i>Derniers articles</a>'
                + '<a href="/blog" class="n-res-all">Tout le blog <i class="ph-bold ph-arrow-right"></i></a>'
              + '</div>'
              + '<div class="n-res-arts" data-derniers><span class="n-res-skel"></span><span class="n-res-skel"></span><span class="n-res-skel"></span><span class="n-res-skel"></span></div>'
            + '</div>'
            + '<a href="/partenaires" class="n-res-card n-res-part">'
              + '<span class="n-res-ico"><i class="ph-bold ph-handshake"></i></span>'
              + '<i class="ph ph-handshake n-res-deco"></i>'
              + '<span class="n-res-t">Partenaires</span>'
              + '<span class="n-res-d">Outils recommandés et offres pour les membres.</span>'
            + '</a>'
            + '<div class="n-res-more">'
              + '<div class="n-col-title">Pour apprendre</div>'
              + '<a href="/services/guides-lcd"><i class="ph ph-books"></i>Guides LCD</a>'
              + '<a href="/services/actualites"><i class="ph ph-megaphone"></i>Actualités LCD</a>'
              + '<a href="/partenaires#comparatifs"><i class="ph ph-scales"></i>Comparatifs outils</a>'
              + '<a href="/lexique-lcd"><i class="ph ph-book-open"></i>Lexique LCD</a>'
              + '<div class="n-col-title n-res-t2">Me connaître</div>'
              + '<a href="/qui-suis-je"><i class="ph ph-user-circle"></i>Qui suis-je</a>'
              + '<a href="/contact"><i class="ph ph-envelope"></i>Contact</a>'
            + '</div>'
          + '</div>'
          + '<a href="/#contact" class="n-res-checkin"><i class="ph ph-envelope-simple"></i><span><b>Le Check-in</b><small>Une lettre par mois : ce qui change, un outil, un bon plan</small></span><span class="n-res-go">M\'inscrire <i class="ph-bold ph-arrow-right"></i></span></a>'
        + '</div>'
      + '</li>'

      /* ── Tarifs : une carte par offre, colonne Offres / Aide, places Fondateur en direct (13/10/2026) ── */
      + '<li class="n-drop n-drop-wide n-drop-tar">'
        + '<button class="n-btn" aria-haspopup="true" aria-expanded="false">Tarifs ' + CARET + '</button>'
        + '<div class="n-mega n-mega-tar">'
          + '<div class="n-tar-top">'
          + '<a href="/tarifs#hote" class="n-tar-card n-tar-hote">'
            + '<span class="n-tar-vis">'
              + '<span class="n-tar-row"><i class="ph-bold ph-file-text"></i>Contrat<b>Signé</b></span>'
              + '<span class="n-tar-row"><i class="ph-bold ph-sparkle"></i>Ménage<b>Planifié</b></span>'
              + '<span class="n-tar-row"><i class="ph-bold ph-identification-card"></i>Fiche police<b>Prête</b></span>'
            + '</span>'
            + '<span class="n-tar-foot"><span class="n-tar-t">Plateforme hôte</span><span class="n-tar-s">Gratuit pour commencer, Standard à l\'année</span></span>'
          + '</a>'
          + '<a href="/tarifs#photographes" class="n-tar-card n-tar-photo">'
            + '<span class="n-tar-vis">'
              + '<span class="n-tar-grid"><i></i><i></i><i></i><i></i><i></i><i></i></span>'
              + '<span class="n-tar-row n-tar-row-dk"><i class="ph-bold ph-link"></i>Ton site<b>Dofollow</b></span>'
            + '</span>'
            + '<span class="n-tar-foot"><span class="n-tar-t">Photographes</span><span class="n-tar-s">Ta fiche à l\'année, sans commission</span></span>'
          + '</a>'
          + '<a href="/tarifs#menage" class="n-tar-card n-tar-menage">'
            + '<span class="n-tar-vis">'
              + '<span class="n-tar-row n-tar-row-dk"><i class="ph-bold ph-check-circle"></i>Chambres<b>Fait</b></span>'
              + '<span class="n-tar-row n-tar-row-dk"><i class="ph-bold ph-check-circle"></i>Linge<b>Fait</b></span>'
              + '<span class="n-tar-row n-tar-row-dk"><i class="ph-bold ph-calendar-check"></i>Planning<b>À jour</b></span>'
            + '</span>'
            + '<span class="n-tar-foot"><span class="n-tar-t">Équipes de ménage</span><span class="n-tar-s">Ta fiche à l\'année, sans commission</span></span>'
          + '</a>'
          + '<div class="n-tar-side">'
            + '<div class="n-col-title">Offres</div>'
            + '<a href="/tarifs#hote"><i class="ph ph-seal-check"></i>Membre Fondateur, prix à vie</a>'
            + '<a href="/pour-qui/membres-driing"><i class="ph ph-lightning"></i>Membres Driing : tout inclus</a>'
            + '<div class="n-col-title n-tar-t2">Aide</div>'
            + '<a href="/tarifs#compare"><i class="ph ph-table"></i>Comparer les plans</a>'
            + '<a href="/tarifs#garantie"><i class="ph ph-arrow-counter-clockwise"></i>Remboursé 30 jours</a>'
            + '<a href="/tarifs#faq"><i class="ph ph-question"></i>Questions fréquentes</a>'
          + '</div>'
          + '</div>'
          + '<a href="/tarifs" class="n-tar-band"><i class="ph ph-seal-check"></i><span><b>Places Fondateur : prix bloqué à vie</b><small data-tar-places>Pour les premiers inscrits de chaque offre</small></span><span class="n-tar-go">Voir les offres <i class="ph-bold ph-arrow-right"></i></span></a>'
        + '</div>'
      + '</li>'

    + '</ul>'
    + '<div class="n-right">'
      + '<a href="https://app.jasonmarinho.com/ouverture" class="nb-o"><i class="ph ph-user"></i> Mon espace</a>'
      + '<a href="https://app.jasonmarinho.com/auth/register" class="nb-c">Commencer <i class="ph-bold ph-arrow-right"></i></a>'
    + '</div>'
    + '<button class="hbg" id="hbg" aria-label="Menu" aria-expanded="false" aria-controls="mob"><span></span><span></span><span></span></button>'
  + '</nav>'

  /* ── MOBILE MENU, ordre identique au desktop ── */
  + '<div class="mob-menu" id="mob">'

    + '<div class="mob-acc" id="acc-sv">'
      + accBtn('ph-squares-four', 'Services', 'Contrats, ménage, simulateurs, formations')
      + '<div class="mob-acc-body">'
        /* Mêmes 3 groupes et mêmes liens que le menu ordinateur (proposition A, 13/10/2026) */
        + '<span class="mob-stitle">Gérer ta location</span>'
        + '<a href="/services/contrats"><i class="ph ph-signature"></i>Contrats & paiements</a>'
        + '<a href="/services/planning-menage"><i class="ph ph-broom"></i>Planning ménage</a>'
        + '<a href="/services/declarations-voyageurs"><i class="ph ph-identification-card"></i>Déclarations voyageurs</a>'
        + '<a href="/services/calendrier"><i class="ph ph-calendar-check"></i>Calendrier & check-list</a>'
        + '<a href="/services/securite"><i class="ph ph-shield-check"></i>Vérifier un voyageur</a>'
        + '<a href="/services" class="mob-sublink">Tous les services <i class="ph-bold ph-arrow-right"></i></a>'
        + '<span class="mob-stitle">Chiffrer & investir</span>'
        + '<a href="/calculateurs/revenus-lcd"><i class="ph ph-trend-up"></i>Estimateur de revenus</a>'
        + '<a href="/services/simulateurs/rentabilite-location-courte-duree"><i class="ph ph-chart-line-up"></i>Rentabilité LCD</a>'
        + '<a href="/services/simulateurs/fiscalite-micro-bic"><i class="ph ph-currency-eur"></i>Fiscalité micro-BIC</a>'
        + '<a href="/services/simulateurs/taxe-de-sejour"><i class="ph ph-map-pin"></i>Taxe de séjour</a>'
        + '<a href="/services/simulateurs" class="mob-sublink">Tous les simulateurs <i class="ph-bold ph-arrow-right"></i></a>'
        + '<span class="mob-stitle">Apprendre</span>'
        + '<a href="/services/formations"><i class="ph ph-graduation-cap"></i>Formations LCD</a>'
        + '<a href="/services/guides-lcd"><i class="ph ph-books"></i>Guides LCD</a>'
        + '<a href="/services/entre-hotes"><i class="ph ph-chats-circle"></i>Questions & réponses</a>'
        + '<a href="/sos-hote"><i class="ph ph-lifebuoy"></i>SOS Hôte (urgences)</a>'
        + '<a href="/services/formations" class="mob-sublink">Toutes les formations <i class="ph-bold ph-arrow-right"></i></a>'
      + '</div>'
    + '</div>'

    /* Annuaire : même contenu que le menu ordinateur (proposition C) */
    + '<div class="mob-acc" id="acc-ann">'
      + accBtn('ph-address-book', 'Annuaire', 'Photographes et équipes de ménage')
      + '<div class="mob-acc-body mob-wide">'
        + '<div class="mob-vgrid">'
          + '<a href="/annuaires/photographes" class="mob-vc mob-vc-photo">'
            + '<span class="n-ann-mos" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>'
            + '<span class="mob-vt">Photographes</span>'
            + '<span class="mob-vs">Voir l\'annuaire <i class="ph-bold ph-arrow-right"></i></span>'
          + '</a>'
          + '<a href="/annuaires/menage" class="mob-vc mob-vc-menage">'
            + '<span class="n-ann-chk" aria-hidden="true">'
              + '<span><i class="ph-bold ph-check-circle"></i>Chambres<b>Fait</b></span>'
              + '<span><i class="ph-bold ph-check-circle"></i>Linge<b>Fait</b></span>'
            + '</span>'
            + '<span class="mob-vt">Équipes de ménage</span>'
            + '<span class="mob-vs">Voir l\'annuaire <i class="ph-bold ph-arrow-right"></i></span>'
          + '</a>'
        + '</div>'
        + '<span class="mob-stitle">Pour les hôtes</span>'
        + '<a href="/trouver-un-pro" class="mob-driing">'
          + '<i class="ph-bold ph-paper-plane-tilt"></i>'
          + '<div class="mob-driing-body">'
            + '<span class="mob-driing-name">Décrire mon besoin</span>'
            + '<span class="mob-driing-sub">Les pros près de chez toi viennent à toi</span>'
          + '</div>'
        + '</a>'
        + '<span class="mob-stitle">Pour les pros</span>'
        + '<a href="/devenir-photographe-lcd"><i class="ph ph-camera"></i>Devenir photographe</a>'
        + '<a href="/devenir-prestataire-menage-lcd"><i class="ph ph-sparkle"></i>Devenir équipe de ménage</a>'
        + '<a href="/tarifs#photographes"><i class="ph ph-tag"></i>Tarifs des fiches</a>'
        + '<a href="/chiffres"><i class="ph ph-chart-line-up"></i>La visibilité en chiffres</a>'
      + '</div>'
    + '</div>'

    + '<div class="mob-acc" id="acc-pq">'
      + accBtn('ph-users-three', 'Pour qui', 'Gîtes, chambres d\'hôtes, conciergeries…')
      + '<div class="mob-acc-body">'
        + '<span class="mob-stitle">Tu loues</span>'
        + '<a href="/pour-qui/gites"><i class="ph ph-tree-evergreen"></i>Gîtes</a>'
        + '<a href="/pour-qui/chambres-dhotes"><i class="ph ph-house-line"></i>Chambres d\'hôtes</a>'
        + '<a href="/pour-qui/conciergeries"><i class="ph ph-buildings"></i>Conciergeries</a>'
        + '<a href="/pour-qui/investisseurs"><i class="ph ph-chart-line-up"></i>Investisseurs</a>'
        + '<span class="mob-stitle">Tu travailles pour les hôtes</span>'
        + '<a href="/pour-qui/photographes"><i class="ph ph-camera"></i>Photographes</a>'
        + '<a href="/pour-qui/menage"><i class="ph ph-sparkle"></i>Équipes de ménage</a>'
        + '<a href="/pour-qui/membres-driing" class="mob-driing">'
          + '<i class="ph ph-lightning"></i>'
          + '<div class="mob-driing-body">'
            + '<span class="mob-driing-name">Membre Driing ?</span>'
            + '<span class="mob-driing-sub">Ton accès à l\'app est inclus</span>'
          + '</div>'
        + '</a>'
      + '</div>'
    + '</div>'

    + '<div class="mob-acc" id="acc-res">'
      + accBtn('ph-books', 'Ressources', 'Blog, partenaires, guides, lexique')
      + '<div class="mob-acc-body mob-wide">'
        + '<div class="mob-vgrid">'
          + '<a href="/blog" class="mob-vc mob-vc-blog">'
            + '<span class="mob-vc-ico"><i class="ph-bold ph-newspaper"></i></span>'
            + '<span class="mob-vt">Blog</span>'
            + '<span class="mob-vs">Conseils et actus <i class="ph-bold ph-arrow-right"></i></span>'
          + '</a>'
          + '<a href="/partenaires" class="mob-vc mob-vc-part">'
            + '<span class="mob-vc-ico"><i class="ph-bold ph-handshake"></i></span>'
            + '<span class="mob-vt">Partenaires</span>'
            + '<span class="mob-vs">Outils et offres <i class="ph-bold ph-arrow-right"></i></span>'
          + '</a>'
        + '</div>'
        + '<span class="mob-stitle">Pour apprendre</span>'
        + '<a href="/services/guides-lcd"><i class="ph ph-books"></i>Guides LCD</a>'
        + '<a href="/services/actualites"><i class="ph ph-megaphone"></i>Actualités LCD</a>'
        + '<a href="/partenaires#comparatifs"><i class="ph ph-scales"></i>Comparatifs outils</a>'
        + '<a href="/lexique-lcd"><i class="ph ph-book-open"></i>Lexique LCD</a>'
        + '<span class="mob-stitle">Me connaître</span>'
        + '<a href="/qui-suis-je"><i class="ph ph-user-circle"></i>Qui suis-je</a>'
        + '<a href="/contact"><i class="ph ph-envelope"></i>Contact</a>'
        + '<a href="/#contact" class="mob-driing">'
          + '<i class="ph ph-envelope-simple"></i>'
          + '<div class="mob-driing-body">'
            + '<span class="mob-driing-name">Le Check-in</span>'
            + '<span class="mob-driing-sub">Une lettre par mois : ce qui change, un outil, un bon plan</span>'
          + '</div>'
        + '</a>'
      + '</div>'
    + '</div>'

    + '<div class="mob-acc" id="acc-tar">'
      + accBtn('ph-tag', 'Tarifs', 'Gratuit pour commencer, sans carte')
      + '<div class="mob-acc-body mob-wide">'
        + '<a href="/tarifs#hote" class="mob-offer mob-offer-hote"><span class="mob-offer-ic"><i class="ph-bold ph-house-line"></i></span><span class="mob-offer-t"><b>Plateforme hôte</b><small>Gratuit, puis Standard à l\'année</small></span><i class="ph-bold ph-arrow-right mob-offer-go"></i></a>'
        + '<a href="/tarifs#photographes" class="mob-offer mob-offer-photo"><span class="mob-offer-ic"><i class="ph-bold ph-camera"></i></span><span class="mob-offer-t"><b>Photographes</b><small>Ta fiche à l\'année, sans commission</small></span><i class="ph-bold ph-arrow-right mob-offer-go"></i></a>'
        + '<a href="/tarifs#menage" class="mob-offer mob-offer-menage"><span class="mob-offer-ic"><i class="ph-bold ph-sparkle"></i></span><span class="mob-offer-t"><b>Équipes de ménage</b><small>Ta fiche et le planning de tes clients</small></span><i class="ph-bold ph-arrow-right mob-offer-go"></i></a>'
        + '<span class="mob-stitle">Offres & aide</span>'
        + '<a href="/tarifs#hote"><i class="ph ph-seal-check"></i>Membre Fondateur, prix à vie</a>'
        + '<a href="/pour-qui/membres-driing"><i class="ph ph-lightning"></i>Membres Driing : tout inclus</a>'
        + '<a href="/tarifs#compare"><i class="ph ph-table"></i>Comparer les plans</a>'
        + '<a href="/tarifs#garantie"><i class="ph ph-arrow-counter-clockwise"></i>Remboursé 30 jours</a>'
        + '<a href="/tarifs#faq"><i class="ph ph-question"></i>Questions fréquentes</a>'
      + '</div>'
    + '</div>'


    + '<div class="mob-ctas">'
      + '<a href="https://app.jasonmarinho.com/ouverture" class="mc-o"><i class="ph ph-user"></i> Mon espace</a>'
      + '<a href="https://app.jasonmarinho.com/auth/register" class="mc-c">Commencer <i class="ph-bold ph-arrow-right"></i></a>'
    + '</div>'

  + '</div>';

  /* ── INJECTION ── */
  var tmp = document.createElement('div');
  tmp.innerHTML = h;
  var frag = document.createDocumentFragment();
  while (tmp.firstChild) frag.appendChild(tmp.firstChild);
  // Always prepend to body, regardless of where the script tag lives
  // (works for inline body scripts, deferred head scripts, async, etc.)
  if (document.body) {
    document.body.prepend(frag);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.prepend(frag);
    });
  }

  /* ── INTERACTIONS ── */
  document.addEventListener('DOMContentLoaded', function () {
    var nav = document.getElementById('nav');
    var hbg = document.getElementById('hbg');
    var mob = document.getElementById('mob');

    /* Scroll shadow */
    window.addEventListener('scroll', function () {
      nav.classList.toggle('sc', window.scrollY > 10);
    }, { passive: true });

    /* Ferme tous les accordéons mobile */
    function closeAccordions() {
      document.querySelectorAll('.mob-acc.open').forEach(function (acc) {
        acc.classList.remove('open');
        acc.querySelector('.mob-acc-btn').setAttribute('aria-expanded', 'false');
      });
    }

    /* Ouverture / fermeture du menu mobile. La page derrière est bloquée
       pendant l'ouverture ; à la fermeture le menu est vraiment masqué
       (avant : un lien d'ancre sur la même page laissait un menu invisible
       qui captait les clics). */
    function openMob() {
      mob.style.display = 'flex';
      mob.offsetHeight; /* force reflow pour déclencher la transition */
      mob.classList.add('open');
      hbg.classList.add('open');
      hbg.setAttribute('aria-expanded', 'true');
      document.documentElement.classList.add('mob-lock');
    }
    function closeMob() {
      if (!mob.classList.contains('open')) return;
      mob.classList.remove('open');
      hbg.classList.remove('open');
      hbg.setAttribute('aria-expanded', 'false');
      document.documentElement.classList.remove('mob-lock');
      setTimeout(function () {
        if (!mob.classList.contains('open')) { mob.style.display = ''; closeAccordions(); mob.scrollTop = 0; }
      }, 220);
    }

    hbg.addEventListener('click', function (e) {
      e.stopPropagation();
      if (mob.classList.contains('open')) closeMob(); else openMob();
    });

    /* Fermer au clic extérieur */
    document.addEventListener('click', function (e) {
      if (mob.classList.contains('open') && !mob.contains(e.target) && !hbg.contains(e.target)) closeMob();
    });

    /* Fermer mobile au clic d'un lien */
    mob.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMob);
    });

    /* Accordéons mobile : un seul ouvert à la fois, la rubrique ouverte
       remonte en haut du menu. */
    document.querySelectorAll('.mob-acc-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var acc = btn.parentElement;
        var wasOpen = acc.classList.contains('open');
        document.querySelectorAll('.mob-acc.open').forEach(function (other) {
          if (other === acc) return;
          var body = other.querySelector('.mob-acc-body');
          body.style.transition = 'none';
          other.classList.remove('open');
          other.querySelector('.mob-acc-btn').setAttribute('aria-expanded', 'false');
          body.offsetHeight;
          body.style.transition = '';
        });
        acc.classList.toggle('open', !wasOpen);
        btn.setAttribute('aria-expanded', String(!wasOpen));
        if (!wasOpen) {
          var top = acc.offsetTop - 6;
          if (Math.abs(mob.scrollTop - top) > 4) {
            try { mob.scrollTo({ top: top, behavior: 'smooth' }); } catch (_) { mob.scrollTop = top; }
          }
        }
      });
    });

    /* Mega menu desktop, toggle au clic (touch/clavier) */
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

    /* Ressources : les 4 derniers articles, chargés à la première ouverture
       du menu (derniers-articles.json, écrit au build par
       scripts/build-derniers-articles.mjs). */
    var derniersBox = document.querySelector('[data-derniers]');
    var derniersAsked = false;
    function loadDerniers() {
      if (derniersAsked || !derniersBox) return;
      derniersAsked = true;
      fetch('/derniers-articles.json').then(function (r) {
        if (!r.ok) throw new Error('http');
        return r.json();
      }).then(function (list) {
        if (!Array.isArray(list) || !list.length) throw new Error('vide');
        derniersBox.textContent = '';
        list.slice(0, 4).forEach(function (art) {
          if (!art || typeof art.u !== 'string' || art.u.indexOf('/blog/') !== 0) return;
          var a = document.createElement('a');
          a.href = art.u;
          var d = document.createElement('small');
          d.textContent = art.d || '';
          var t = document.createElement('span');
          t.textContent = art.t || '';
          a.appendChild(d); a.appendChild(t);
          derniersBox.appendChild(a);
        });
      }).catch(function () {
        derniersBox.innerHTML = '<p>Conseils, stratégies et actus pour les hôtes, un article tous les 2 jours.</p>';
      });
    }
    var resDrop = document.querySelector('.n-drop-res');
    if (resDrop) {
      ['mouseenter', 'focusin', 'touchstart', 'click'].forEach(function (ev) {
        resDrop.addEventListener(ev, loadDerniers, { passive: true });
      });
    }

    /* Tarifs : places Fondateur restantes, lues à la première ouverture du menu
       (/api/founder-seats de l'app pour les hôtes, /api/annuaire-places pour
       les pros, en cache 5 min côté serveur). */
    var tarPlaces = document.querySelector('[data-tar-places]');
    var tarAsked = false;
    function loadTarPlaces() {
      if (tarAsked || !tarPlaces) return;
      tarAsked = true;
      var get = function (u) { return fetch(u, { headers: { Accept: 'application/json' } }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); };
      Promise.all([get('https://app.jasonmarinho.com/api/founder-seats'), get('/api/annuaire-places')]).then(function (res) {
        var h = res[0] && typeof res[0].remaining === 'number' ? res[0].remaining : null;
        var p = res[1] && typeof res[1].photographers === 'number' ? res[1].photographers : null;
        var c = res[1] && typeof res[1].cleaners === 'number' ? res[1].cleaners : null;
        var parts = [];
        if (h) parts.push(h + ' place' + (h > 1 ? 's' : '') + ' hôtes');
        if (p) parts.push(p + ' photographe' + (p > 1 ? 's' : ''));
        if (c) parts.push(c + ' équipe' + (c > 1 ? 's' : '') + ' de ménage');
        if (parts.length) tarPlaces.textContent = 'Encore ' + parts.join(' · ');
      });
    }
    var tarDrop = document.querySelector('.n-drop-tar');
    if (tarDrop) {
      ['mouseenter', 'focusin', 'touchstart', 'click'].forEach(function (ev) {
        tarDrop.addEventListener(ev, loadTarPlaces, { passive: true });
      });
    }

    /* Échap */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.n-drop.open').forEach(function (d) { d.classList.remove('open'); });
        closeMob();
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

/* Ping léger "page vue" pour le compteur en direct + canal d'acquisition
   (admin). Une ligne par navigation, pas de dédup (sert à mesurer
   l'activité récente). session_id généré une fois par onglet, pas de
   cookie, aucune IP/UA stockée côté serveur. Fail-silent : ne doit
   jamais bloquer ni ralentir l'affichage de la page. */
(function () {
  if (window.__jmVisitSent) return;
  window.__jmVisitSent = true;
  try {
    var KEY = 'jm_sid';
    var sid = sessionStorage.getItem(KEY);
    if (!sid) {
      sid = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem(KEY, sid);
    }
    var params = new URLSearchParams(window.location.search);
    /* Identifiant de cette vue de page : sert à y rattacher le temps passé */
    var vid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    /* Facebook ajoute fbclid à ses liens sortants mais son navigateur intégré
       ne transmet souvent pas d'origine : sans ça, ces visites passaient en « direct ». */
    var fbclid = params.get('fbclid');
    var utmSource = params.get('utm_source') || (fbclid ? 'facebook' : '');
    var utmMedium = params.get('utm_medium') || (fbclid ? 'social' : '');
    var utmCampaign = params.get('utm_campaign') || '';
    var payload = JSON.stringify({
      visit_id: vid,
      session_id: sid,
      path: window.location.pathname,
      referrer: document.referrer || '',
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
    });

    /* Provenance des inscriptions (10/10/2026) : point d'entrée de la visite
       (source, campagne, site d'origine, première page), gardé le temps de
       l'onglet. Ajouté aux liens vers l'inscription de l'app et envoyé par les
       formulaires d'inscription des pros. Jamais le parcours sur le site. */
    var acq = null;
    try { acq = JSON.parse(sessionStorage.getItem('jm_acq') || 'null'); } catch (err) { acq = null; }
    var refHost = '';
    try { refHost = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ''; } catch (err) { refHost = ''; }
    if (/(^|\.)jasonmarinho\.com$/.test(refHost)) refHost = '';
    /* Arrivée depuis l'app (choix du profil sur la page d'inscription) : la provenance suit */
    if (params.get('acq_t')) {
      acq = { source: params.get('acq_s') || '', medium: params.get('acq_m') || '', campaign: params.get('acq_c') || '', ref: params.get('acq_r') || '', landing: params.get('acq_l') || '', at: params.get('acq_t') };
      try { sessionStorage.setItem('jm_acq', JSON.stringify(acq)); } catch (err) { /* stockage refusé */ }
    } else if (!acq || (utmSource && !acq.source)) {
      acq = { source: utmSource, medium: utmMedium, campaign: utmCampaign, ref: refHost, landing: window.location.pathname, at: new Date().toISOString() };
      try { sessionStorage.setItem('jm_acq', JSON.stringify(acq)); } catch (err) { /* stockage refusé */ }
    }
    window.__jmAcq = acq;
    document.addEventListener('click', function (e) {
      try {
        var a = e.target && e.target.closest ? e.target.closest('a[href*="app.jasonmarinho.com/auth/register"]') : null;
        if (!a || !acq) return;
        var u = new URL(a.href);
        if (u.searchParams.has('acq_t')) return;
        [['acq_s', 'source'], ['acq_m', 'medium'], ['acq_c', 'campaign'], ['acq_r', 'ref'], ['acq_l', 'landing'], ['acq_t', 'at']].forEach(function (p) {
          if (acq[p[1]]) u.searchParams.set(p[0], acq[p[1]]);
        });
        a.href = u.toString();
      } catch (err) { /* fail-silent */ }
    }, true);
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track/visit', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('/api/track/visit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(function () {});
    }

    /* Temps passé sur la page (onglet visible seulement), envoyé quand on
       la quitte ou qu'on change d'onglet : le total remplace le précédent. */
    var shownAt = document.visibilityState === 'visible' ? Date.now() : 0;
    var spent = 0, lastSent = 0;
    var sendLeave = function () {
      if (shownAt) { spent += Date.now() - shownAt; shownAt = 0; }
      var secs = Math.round(spent / 1000);
      if (secs < 1 || secs === lastSent) return;
      lastSent = secs;
      var b = JSON.stringify({ visit_id: vid, seconds: Math.min(secs, 3600) });
      if (navigator.sendBeacon) navigator.sendBeacon('/api/track/leave', new Blob([b], { type: 'application/json' }));
    };
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') sendLeave();
      else shownAt = Date.now();
    });
    window.addEventListener('pagehide', sendLeave);

    /* Clics sortants sur les liens affiliés/partenaires (rel="sponsored") :
       une ligne par clic, pour savoir quelles pages envoient des clients. */
    document.addEventListener('click', function (e) {
      try {
        var a = e.target && e.target.closest ? e.target.closest('a[rel~="sponsored"]') : null;
        if (!a || !a.href) return;
        var body = JSON.stringify({ session_id: sid, path: window.location.pathname, url: a.href });
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/track/click', new Blob([body], { type: 'application/json' }));
        } else {
          fetch('/api/track/click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true }).catch(function () {});
        }
      } catch (err) { /* fail-silent */ }
    }, true);
  } catch (e) { /* fail-silent */ }
}());

/* ── Réveil de l'app avant le clic sur « Mon espace » (30/09/2026) ──
   Sur l'offre Vercel gratuite, la fonction qui rend les pages de
   app.jasonmarinho.com s'endort quand personne ne s'en sert : le premier
   appel coûtait jusqu'à 1 s de plus. On ouvre la connexion tôt, on réveille
   l'app au survol (ou au toucher) d'un lien vers elle, et dès le chargement
   pour un membre qui a déjà cliqué sur « Mon espace » (au plus toutes les
   5 min). Aucune donnée envoyée. */
(function () {
  if (window.__jmAppWarm) return;
  window.__jmAppWarm = true;
  try {
    var APP = 'https://app.jasonmarinho.com';
    var head = document.head || document.getElementsByTagName('head')[0];
    var pc = document.createElement('link');
    pc.rel = 'preconnect'; pc.href = APP;
    head.appendChild(pc);

    var done = false;
    function warm() {
      if (done) return;
      done = true;
      try {
        var last = Number(sessionStorage.getItem('jm-app-warm') || 0);
        if (Date.now() - last < 5 * 60 * 1000) return;
        sessionStorage.setItem('jm-app-warm', String(Date.now()));
      } catch (e) { /* stockage bloqué : on réveille quand même */ }
      try { fetch(APP + '/reveil', { mode: 'no-cors', credentials: 'omit', cache: 'no-store', keepalive: true }).catch(function () {}); } catch (e) {}
    }
    function appLink(t) {
      var a = t && t.closest ? t.closest('a[href^="' + APP + '"]') : null;
      return a;
    }
    function onIntent(e) { if (appLink(e.target)) warm(); }
    document.addEventListener('pointerover', onIntent, { passive: true });
    document.addEventListener('touchstart', onIntent, { passive: true });
    document.addEventListener('focusin', onIntent);
    document.addEventListener('click', function (e) {
      var a = appLink(e.target);
      if (a && (a.href.indexOf('/dashboard') !== -1 || a.href.indexOf('/ouverture') !== -1)) { try { localStorage.setItem('jm-membre', '1'); } catch (err) {} }
    }, true);

    var membre = false;
    try { membre = localStorage.getItem('jm-membre') === '1'; } catch (e) {}
    if (membre) (window.requestIdleCallback || function (f) { setTimeout(f, 1200); })(warm);
  } catch (e) { /* fail-silent */ }
}());
