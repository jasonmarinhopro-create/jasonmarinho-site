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
  [['phosphor-bold-subset','/fonts/phosphor-bold-subset.css?v=a872f92e5a'],
   ['phosphor-regular-subset','/fonts/phosphor-regular-subset.css?v=811eafe0e6']].forEach(function(s){
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

      /* Annuaire mega menu : 2 grandes cards côte à côte */
      '.n-mega-ann{min-width:680px;padding:24px;gap:16px;display:flex}',
      '.n-mega-ann .n-ann-card{flex:1;display:flex;flex-direction:column;gap:10px;background:linear-gradient(160deg,#001a11 0%,var(--gd) 60%,#00463a 100%);color:#fff;border:1px solid rgba(255,213,107,.22);border-radius:14px;padding:22px 22px 20px;position:relative;overflow:hidden;white-space:normal!important;min-width:280px}',
      '.n-mega-ann .n-ann-card::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 70% 80% at 80% 20%,rgba(255,213,107,.10),transparent 70%);pointer-events:none}',
      '.n-mega-ann .n-ann-card>*{position:relative;z-index:1}',
      '.n-mega-ann .n-ann-tag{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--y);padding:3px 10px;border-radius:999px;background:rgba(255,213,107,.10);align-self:flex-start}',
      '.n-mega-ann .n-ann-dot{width:5px;height:5px;border-radius:50%;background:var(--y);box-shadow:0 0 7px rgba(255,213,107,.7)}',
      '.n-mega-ann .n-ann-icon{width:40px;height:40px;border-radius:10px;background:rgba(255,213,107,.10);color:var(--y);display:flex;align-items:center;justify-content:center;font-size:20px;margin:4px 0 2px}',
      '.n-mega-ann .n-ann-h{font-family:\'Fraunces\',serif;font-size:19px;line-height:1.25;font-weight:400;letter-spacing:-.01em;margin:0;color:#fff;white-space:normal}',
      '.n-mega-ann .n-ann-h em{color:var(--y);font-style:italic;font-weight:300}',
      '.n-mega-ann .n-ann-p{font-size:13px;color:rgba(255,255,255,.65);line-height:1.55;margin:0;white-space:normal}',
      '.n-mega-ann .n-ann-actions{display:flex;flex-direction:column;gap:6px;margin-top:8px}',
      '.n-mega-ann .n-ann-cta{display:inline-flex;align-items:center;gap:7px;padding:10px 14px;border-radius:9px;text-decoration:none!important;font-weight:600;font-size:13px;transition:all .2s;white-space:nowrap;justify-content:center}',
      '.n-mega-ann .n-ann-cta i{font-size:13px;flex-shrink:0}',
      '.n-mega-ann .n-ann-cta-primary,.n-mega-ann .n-ann-cta-primary.active,.n-mega-ann .n-ann-cta-primary:hover{background:var(--y);color:var(--gd)}',
      '.n-mega-ann .n-ann-cta-primary i,.n-mega-ann .n-ann-cta-primary.active i,.n-mega-ann .n-ann-cta-primary:hover i{color:var(--gd)}',
      '.n-mega-ann .n-ann-cta-primary:hover{background:#ffe08f;transform:translateY(-1px)}',
      '.n-mega-ann .n-ann-cta-secondary,.n-mega-ann .n-ann-cta-secondary.active{background:transparent;color:rgba(255,213,107,.75);border:1px solid rgba(255,213,107,.20)}',
      '.n-mega-ann .n-ann-cta-secondary:hover{color:var(--y);border-color:rgba(255,213,107,.4);background:rgba(255,213,107,.05)}',
      '.n-mega-ann .n-ann-cta-secondary i,.n-mega-ann .n-ann-cta-secondary:hover i{color:inherit}',
      '@media(max-width:780px){.n-mega-ann{min-width:auto;width:min(94vw,520px);flex-direction:column}.n-mega-ann .n-ann-card{min-width:auto}}',

      /* Ressources mega menu : 2 cartes visuelles + colonne "Plus" (modèle Shine) */
      '.n-mega-res{min-width:720px;padding:22px;gap:14px;align-items:stretch}',
      '.n-mega-res a.n-res-card{flex:0 0 200px;display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-start;gap:6px;min-height:210px;border-radius:12px;padding:18px;position:relative;overflow:hidden;white-space:normal;text-decoration:none;transition:transform .2s,border-color .2s}',
      '.n-mega-res a.n-res-card:hover{transform:translateY(-2px)}',
      '.n-mega-res a.n-res-blog,.n-mega-res a.n-res-blog:hover{background:linear-gradient(160deg,#FFD56B 0%,#ffe39a 100%);border:1px solid rgba(255,213,107,.6)}',
      '.n-mega-res a.n-res-part,.n-mega-res a.n-res-part:hover{background:linear-gradient(160deg,#001a11 0%,var(--gd) 60%,#00463a 100%);border:1px solid rgba(255,213,107,.22)}',
      '.n-mega-res .n-res-part:hover{border-color:rgba(255,213,107,.45)}',
      '.n-mega-res .n-res-ico{position:absolute;top:16px;left:18px;width:44px;height:44px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:22px}',
      '.n-mega-res a.n-res-card .n-res-ico i{font-size:22px;width:auto;color:inherit}',
      '.n-mega-res .n-res-blog .n-res-ico{background:rgba(0,51,41,.10);color:var(--gd)}',
      '.n-mega-res .n-res-part .n-res-ico{background:rgba(255,213,107,.10);color:var(--y)}',
      '.n-mega-res .n-res-card i.n-res-deco{position:absolute;right:-14px;top:40px;font-size:120px;opacity:.10;width:auto}',
      '.n-mega-res .n-res-blog i.n-res-deco{color:var(--gd)}',
      '.n-mega-res .n-res-part i.n-res-deco{color:var(--y)}',
      '.n-mega-res .n-res-t{font-family:\'Fraunces\',serif;font-size:19px;font-weight:500;letter-spacing:-.01em;position:relative}',
      '.n-mega-res .n-res-blog .n-res-t{color:var(--gd)}',
      '.n-mega-res .n-res-part .n-res-t{color:#fff}',
      '.n-mega-res .n-res-d{font-size:12.5px;line-height:1.45;position:relative}',
      '.n-mega-res .n-res-blog .n-res-d{color:rgba(0,51,41,.7)}',
      '.n-mega-res .n-res-part .n-res-d{color:rgba(255,255,255,.6)}',
      '.n-mega-res .n-res-more{display:flex;flex-direction:column;gap:1px;min-width:190px;padding:4px 4px 0 10px}',
      '.n-mega-res .n-res-more .n-col-title{margin-bottom:6px}',
      '@media(max-width:1080px){.n-mega-res{min-width:auto;width:min(96vw,640px);flex-wrap:wrap}.n-mega-res a.n-res-card{flex:1 1 180px;min-height:170px}.n-mega-res .n-res-more{flex:1 1 100%;padding:8px 0 0}}',

      /* Menus larges (Services, Tarifs) : centrés sur la page et collés sous la
         barre, sinon ils débordent de l'écran. Le <li> occupe toute la hauteur
         de la barre pour que le survol ne se perde pas entre bouton et menu. */
      '.n-links{align-self:stretch}',
      '.n-links>li{display:flex;align-items:center;align-self:stretch}',
      '.n-drop-wide{position:static}',
      '.n-drop-wide::after{display:none}',
      '.n-drop-wide>.n-mega{top:100%}',
      '.n-drop-wide>.n-mega::before{display:none}',
      /* Services (façon Shine) : domaines à gauche, fonctionnalités au centre, « Plus » à droite */
      '.n-mega-sol{display:grid;grid-template-columns:250px minmax(0,1fr) 230px;gap:28px;width:min(1080px,94vw);padding:24px 26px}',
      '.n-sol-tabs{display:flex;flex-direction:column;gap:8px}',
      '.n-sol-tab{display:flex;align-items:flex-start;gap:11px;width:100%;text-align:left;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.06);border-radius:11px;padding:13px 14px;cursor:pointer;font-family:\'Outfit\',sans-serif;color:#fff;transition:background .15s,border-color .15s}',
      '.n-sol-tab i{font-size:18px;color:rgba(255,213,107,.55);margin-top:1px;flex-shrink:0}',
      '.n-sol-tab:hover{background:rgba(255,255,255,.06)}',
      '.n-sol-tab.on{background:rgba(255,213,107,.11);border-color:rgba(255,213,107,.38)}',
      '.n-sol-tab.on i{color:var(--y)}',
      '.n-sol-t{display:block;font-size:14.5px;font-weight:600;line-height:1.3}',
      '.n-sol-s{display:block;font-size:12px;color:rgba(255,255,255,.48);margin-top:2px;line-height:1.35}',
      '.n-sol-mid{display:flex;flex-direction:column;min-width:0}',
      '.n-sol-panel{display:none;grid-template-columns:1fr 1fr;column-gap:18px;row-gap:1px;align-content:start}',
      '.n-sol-panel.on{display:grid}',
      '.n-mega .n-sol-panel a{white-space:normal;line-height:1.3}',
      '.n-mega .n-sol-panel a.n-sol-all{grid-column:1 / -1;color:rgba(255,213,107,.75);font-size:12.5px;margin-top:6px}',
      '.n-mega .n-sol-panel a.n-sol-all i{font-size:11px;color:inherit;width:auto}',
      '.n-mega a.n-sol-cta{margin-top:auto;padding:16px 0 2px;border-radius:0;color:var(--y);font-weight:600;font-size:13.5px;text-decoration:underline;text-underline-offset:5px;text-decoration-color:rgba(255,213,107,.45);white-space:normal}',
      '.n-mega a.n-sol-cta:hover{background:transparent;text-decoration-color:var(--y)}',
      '.n-mega a.n-sol-cta i{color:var(--y);font-size:12px;width:auto}',
      '.n-sol-side{display:flex;flex-direction:column;gap:1px;min-width:0}',
      '.n-mega a.n-sol-card{display:flex;flex-direction:column;align-items:flex-start;gap:6px;margin-top:12px;padding:16px;border-radius:12px;white-space:normal;background:linear-gradient(160deg,#001a11 0%,var(--gd) 60%,#00463a 100%);border:1px solid rgba(255,213,107,.22)}',
      '.n-mega a.n-sol-card:hover{border-color:rgba(255,213,107,.45);background:linear-gradient(160deg,#001a11 0%,var(--gd) 60%,#00463a 100%)}',
      '.n-sol-card-tag{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:var(--y);background:rgba(255,213,107,.1);padding:3px 9px;border-radius:999px}',
      '.n-sol-card .n-feat-dot{width:5px;height:5px;border-radius:50%;background:var(--y)}',
      '.n-sol-card-h{font-family:\'Fraunces\',serif;font-size:17px;line-height:1.25;color:#fff}',
      '.n-sol-card-h em{color:var(--y);font-style:italic;font-weight:300}',
      '.n-sol-card-p{font-size:12.5px;line-height:1.5;color:rgba(255,255,255,.6)}',
      /* « Trouver un pro » : les deux cartes de l'ancien menu Annuaire, dans le panneau central */
      '.n-sol-ann{display:flex;flex-direction:column;gap:8px;padding:16px;border-radius:12px;background:linear-gradient(160deg,#001a11 0%,var(--gd) 60%,#00463a 100%);border:1px solid rgba(255,213,107,.22);white-space:normal}',
      '.n-sol-ann-head{display:flex;align-items:center;justify-content:space-between;gap:8px}',
      '.n-sol-ann-ico{width:36px;height:36px;border-radius:9px;background:rgba(255,213,107,.10);color:var(--y);display:flex;align-items:center;justify-content:center;font-size:18px}',
      '.n-sol-ann .n-ann-tag{display:inline-flex;align-items:center;gap:5px;font-size:9.5px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:var(--y);padding:3px 9px;border-radius:999px;background:rgba(255,213,107,.10)}',
      '.n-sol-ann .n-ann-dot{width:5px;height:5px;border-radius:50%;background:var(--y);box-shadow:0 0 7px rgba(255,213,107,.7)}',
      '.n-sol-ann-h{font-family:\'Fraunces\',serif;font-size:18px;line-height:1.25;color:#fff}',
      '.n-sol-ann-h em{color:var(--y);font-style:italic;font-weight:300}',
      '.n-sol-ann-p{font-size:12.5px;line-height:1.5;color:rgba(255,255,255,.62);margin-bottom:4px}',
      '.n-mega a.n-sol-ann-cta{justify-content:center;padding:9px 12px;border-radius:8px;font-weight:600;font-size:12.5px;white-space:nowrap}',
      '.n-mega a.n-sol-ann-primary,.n-mega a.n-sol-ann-primary:hover{background:var(--y);color:var(--gd)}',
      '.n-mega a.n-sol-ann-primary:hover{background:#ffe08f}',
      '.n-mega a.n-sol-ann-cta i{width:auto;font-size:13px;color:inherit}',
      '.n-mega a.n-sol-ann-secondary{color:rgba(255,213,107,.8);border:1px solid rgba(255,213,107,.22)}',
      '.n-mega a.n-sol-ann-secondary:hover{color:var(--y);border-color:rgba(255,213,107,.45);background:rgba(255,213,107,.05)}',
      '.n-sol-panel-ann{column-gap:14px!important;row-gap:14px!important}',
      '@media(max-width:1180px){.n-mega-sol{grid-template-columns:230px minmax(0,1fr)}.n-sol-side{display:none}}',

      /* Tarifs (façon Shine) : une carte visuelle par offre + offres spéciales */
      '.n-mega-tar{gap:16px;padding:22px;align-items:stretch}',
      '.n-mega a.n-tar-card{flex:0 0 190px;display:flex;flex-direction:column;align-items:stretch;justify-content:space-between;gap:14px;min-height:236px;padding:16px;border-radius:12px;white-space:normal;position:relative;overflow:hidden;transition:transform .2s}',
      '.n-mega a.n-tar-card:hover{transform:translateY(-2px)}',
      '.n-mega a.n-tar-hote,.n-mega a.n-tar-hote:hover{background:linear-gradient(160deg,#FFE9A8 0%,var(--y) 100%);color:var(--gd)}',
      '.n-mega a.n-tar-photo,.n-mega a.n-tar-photo:hover{background:linear-gradient(160deg,#00463a 0%,#003329 100%);border:1px solid rgba(255,213,107,.2);color:#fff}',
      '.n-mega a.n-tar-menage,.n-mega a.n-tar-menage:hover{background:linear-gradient(160deg,#556B2F 0%,#3d5022 100%);color:#fff}',
      '.n-tar-vis{display:flex;flex-direction:column;gap:6px}',
      '.n-tar-row{display:flex;align-items:center;gap:7px;font-size:11.5px;font-weight:500;padding:7px 9px;border-radius:8px;background:rgba(255,255,255,.75);color:var(--gd)}',
      '.n-tar-row-dk{background:rgba(255,255,255,.1);color:#fff}',
      '.n-mega a.n-tar-card .n-tar-row i{font-size:13px;width:auto;color:inherit;opacity:.8}',
      '.n-tar-row b{margin-left:auto;font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px;background:rgba(0,51,41,.1)}',
      '.n-tar-row-dk b{background:rgba(255,213,107,.18);color:var(--y)}',
      '.n-tar-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}',
      '.n-mega a.n-tar-card .n-tar-grid i{display:block;width:auto;aspect-ratio:1;border-radius:5px;background:linear-gradient(135deg,rgba(255,213,107,.35),rgba(255,255,255,.08))}',
      '.n-mega a.n-tar-card .n-tar-grid i:nth-child(2n){background:linear-gradient(135deg,rgba(147,197,253,.3),rgba(255,255,255,.06))}',
      '.n-tar-foot{display:block}',
      '.n-tar-t{font-family:\'Fraunces\',serif;font-size:18px;font-weight:500;line-height:1.2;display:block}',
      '.n-tar-s{font-size:12px;line-height:1.4;opacity:.72;display:block;margin-top:3px}',
      '.n-tar-side{display:flex;flex-direction:column;gap:1px;min-width:220px;padding-left:6px}',
      '@media(max-width:1180px){.n-mega a.n-tar-card{flex-basis:160px}.n-tar-side{min-width:190px}}',

      '.n-tag-free{display:inline-flex;align-items:center;font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;padding:2px 6px;border-radius:999px;background:rgba(99,214,131,.18);color:#7AE89A;border:1px solid rgba(99,214,131,.30);margin-left:auto;flex-shrink:0}',
      '.n-mega a.n-sub-link{color:rgba(255,213,107,.7);font-size:12.5px;margin-top:4px;border-top:1px dashed rgba(255,255,255,.06);padding-top:10px}',
      '.n-mega a.n-sub-link:hover{color:var(--y)}',
      '@media(max-width:1080px){.n-mega-3{min-width:0;flex-direction:column;gap:14px}}',

      /* Driing card redesignée */
      '.n-driing-card{display:flex;flex-direction:column;gap:10px;background:linear-gradient(145deg,rgba(255,213,107,.09) 0%,rgba(255,213,107,.04) 100%);border:1px solid rgba(255,213,107,.22);border-radius:12px;padding:18px 16px;color:inherit;transition:background .2s,border-color .2s;min-width:220px;align-self:stretch}',
      '.n-driing-card:hover{background:linear-gradient(145deg,rgba(255,213,107,.16) 0%,rgba(255,213,107,.08) 100%);border-color:rgba(255,213,107,.42)}',
      '.n-driing-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(255,213,107,.1);border:1px solid rgba(255,213,107,.18);border-radius:20px;padding:3px 9px;width:fit-content}',
      '.n-driing-dot{width:5px;height:5px;border-radius:50%;background:var(--y);flex-shrink:0;box-shadow:0 0 7px rgba(255,213,107,.7)}',
      '.n-driing-badge-txt{font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:rgba(255,213,107,.7)}',
      '.n-driing-name{font-family:\'Fraunces\',serif;font-size:22px;font-weight:400;color:#fff;letter-spacing:-.3px;line-height:1.15}',
      '.n-driing-sub{font-size:12px;color:rgba(255,255,255,.45);line-height:1.55}',
      '.n-driing-actions{display:flex;flex-direction:column;gap:6px;margin-top:2px}',
      '.n-driing-card .n-driing-cta{display:inline-flex;align-items:center;gap:7px;justify-content:center;font-size:12.5px;font-weight:600;padding:9px 12px;border-radius:8px;text-decoration:none!important;transition:all .2s;white-space:nowrap}',
      '.n-driing-card .n-driing-cta i{font-size:12px;flex-shrink:0}',
      '.n-driing-card .n-driing-cta-primary,.n-driing-card .n-driing-cta-primary:hover{background:var(--y);color:var(--gd)}',
      '.n-driing-card .n-driing-cta-primary:hover{background:#ffe08f}',
      '.n-driing-card .n-driing-cta-primary i{color:var(--gd)}',
      '.n-driing-card .n-driing-cta-secondary{background:transparent;color:rgba(255,213,107,.75);border:1px solid rgba(255,213,107,.20)}',
      '.n-driing-card .n-driing-cta-secondary:hover{color:var(--y);border-color:rgba(255,213,107,.4);background:rgba(255,213,107,.05)}',
      '.n-driing-card .n-driing-cta-secondary i{color:inherit}',

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

      /* Mobile menu, compact, animé, zéro scroll */
      '.mob-menu{display:none;position:fixed;top:64px;left:0;right:0;bottom:0;background:var(--gd);border-top:1px solid rgba(255,213,107,.08);padding:4px clamp(16px,5vw,32px) 28px;z-index:199;flex-direction:column;overflow-y:auto;-webkit-overflow-scrolling:touch;opacity:0;transform:translateY(-8px);transition:opacity .2s,transform .2s}',
      '.mob-menu.open{opacity:1;transform:translateY(0)}',
      '.mob-stitle{font-family:\'Fraunces\',serif;font-size:14px;font-weight:500;letter-spacing:-.01em;color:#fff;padding:22px 0 10px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,213,107,.10);margin-bottom:4px}',
      '.mob-stitle::before{content:"";width:18px;height:1px;background:var(--y);flex-shrink:0;opacity:.55}',
      '.mob-menu a{font-size:15px;color:rgba(255,255,255,.7);text-decoration:none;padding:11px 0;display:flex;align-items:center;gap:12px;transition:color .15s;border-bottom:1px solid rgba(255,255,255,.035)}',
      '.mob-menu a:hover,.mob-menu a:active{color:#fff}',
      '.mob-menu a i{font-size:16px;color:rgba(255,213,107,.5);flex-shrink:0;width:18px;text-align:center}',
      '.mob-sep{height:1px;background:rgba(255,255,255,.05);margin:6px 0}',
      '.mob-acc{}',
      '.mob-acc-btn{width:100%;background:none;border:none;border-bottom:1px solid rgba(255,255,255,.035);cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:16px 0 14px;color:rgba(255,213,107,.45);font:600 10px/1 \'Outfit\',sans-serif;letter-spacing:1.5px;text-transform:uppercase;transition:color .2s}',
      '.mob-acc-btn:hover{color:rgba(255,213,107,.7)}',
      '.mob-acc-arrow{width:11px;height:11px;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;transition:transform .25s;flex-shrink:0}',
      '.mob-acc.open .mob-acc-arrow{transform:rotate(180deg)}',
      '.mob-acc-body{max-height:0;overflow:hidden;transition:max-height .4s ease}',
      '.mob-acc.open .mob-acc-body{max-height:2200px}',

      /* Tablette : grille 2 colonnes dans les accordéons pour densifier */
      '@media(min-width:560px) and (max-width:960px){',
        '.mob-acc-body{display:grid;grid-template-columns:1fr 1fr;column-gap:28px;row-gap:0}',
        '.mob-acc-body .mob-stitle{grid-column:1 / -1}',
        '.mob-acc-body .mob-driing-card{grid-column:1 / -1}',
        '.mob-acc-body .mob-driing{grid-column:1 / -1}',
        '.mob-acc-body .mob-sublink{grid-column:1 / -1}',
      '}',

      /* Lien "Voir tout" discret */
      '.mob-sublink{font-size:13px!important;color:rgba(255,213,107,.65)!important;padding:11px 0 14px!important;border-bottom:none!important;display:inline-flex!important;align-items:center;gap:6px;margin-bottom:4px}',
      '.mob-sublink:hover{color:var(--y)!important}',
      '.mob-sublink i{color:rgba(255,213,107,.5)!important;font-size:12px!important}',

      /* Driing mobile, carte highlight (Pour qui) */
      '.mob-driing{background:rgba(255,213,107,.06)!important;border:1px solid rgba(255,213,107,.18)!important;border-radius:10px!important;padding:13px 14px!important;margin-top:4px;border-bottom:none!important}',
      '.mob-driing i{color:var(--y)!important;opacity:.85}',
      '.mob-driing-body{display:flex;flex-direction:column;gap:1px}',
      '.mob-driing-name{font-size:15px;font-weight:500;color:var(--y);line-height:1.3}',
      '.mob-driing-sub{font-size:12px;color:rgba(255,213,107,.45)}',

      /* Driing card riche pour Services accordion (mobile + tablette) */
      '.mob-driing-card{display:flex!important;flex-direction:column;gap:10px;background:linear-gradient(160deg,#001a11 0%,var(--gd) 60%,#00463a 100%)!important;border:1px solid rgba(255,213,107,.22)!important;border-radius:12px!important;padding:18px!important;margin:18px 0 4px!important;text-decoration:none!important;position:relative;overflow:hidden;border-bottom:none!important;align-items:flex-start!important}',
      '.mob-driing-card::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 70% 80% at 80% 30%,rgba(255,213,107,.10),transparent 70%);pointer-events:none}',
      '.mob-driing-card>*{position:relative;z-index:1}',
      '.mob-driing-card .mdc-tag{display:inline-flex;align-items:center;gap:5px;font-size:9.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--y);background:rgba(255,213,107,.10);padding:3px 9px;border-radius:999px;width:fit-content}',
      '.mob-driing-card .mdc-tag .mdc-dot{width:5px;height:5px;border-radius:50%;background:var(--y);box-shadow:0 0 7px rgba(255,213,107,.7)}',
      '.mob-driing-card .mdc-h{font-family:\'Fraunces\',serif;font-size:18px;line-height:1.25;font-weight:400;color:#fff;letter-spacing:-.01em}',
      '.mob-driing-card .mdc-h em{color:var(--y);font-style:italic;font-weight:300}',
      '.mob-driing-card .mdc-p{font-size:13px;color:rgba(255,255,255,.65);line-height:1.5}',
      '.mob-driing-card .mdc-actions{display:flex;flex-direction:column;gap:6px;margin-top:6px}',
      '.mob-driing-card .mdc-cta{display:inline-flex;align-items:center;gap:7px;padding:10px 14px;border-radius:9px;text-decoration:none!important;font-weight:600;font-size:13px;justify-content:center;transition:all .2s;white-space:nowrap}',
      '.mob-driing-card .mdc-cta i{font-size:13px;flex-shrink:0}',
      '.mob-driing-card .mdc-cta-primary,.mob-driing-card .mdc-cta-primary.active,.mob-driing-card .mdc-cta-primary:hover{background:var(--y);color:var(--gd)}',
      '.mob-driing-card .mdc-cta-primary i,.mob-driing-card .mdc-cta-primary.active i,.mob-driing-card .mdc-cta-primary:hover i{color:var(--gd)}',
      '.mob-driing-card .mdc-cta-secondary,.mob-driing-card .mdc-cta-secondary.active{background:transparent;color:rgba(255,213,107,.75);border:1px solid rgba(255,213,107,.20)}',
      '.mob-driing-card .mdc-cta-secondary i,.mob-driing-card .mdc-cta-secondary:hover i{color:inherit}',

      /* CTAs mobile */
      '.mob-ctas{display:flex;gap:8px;margin-top:auto;padding-top:20px;border-top:1px solid rgba(255,255,255,.06)}',
      '.mob-ctas a{flex:1;justify-content:center;font-size:14px;font-weight:500;text-decoration:none;padding:13px 0;border-radius:9px;display:flex;align-items:center;gap:6px;transition:all .2s}',
      '.mc-o{color:rgba(255,255,255,.65);border:1px solid rgba(255,255,255,.18)}',
      '.mc-o:hover{border-color:rgba(255,255,255,.35);color:#fff}',
      '.mc-c{color:var(--gd)!important;background:var(--y);font-weight:600!important}',
      '.mc-c:hover{background:#ffe08f}',
      '.mc-c i{color:var(--gd)!important}',

      /* Responsive */
      '@media(max-width:960px){.n-links,.n-right .nb-c,.n-right .nb-o{display:none}.hbg{display:flex}}'
    ].join('');
    document.head.appendChild(style);
  }

  /* ── SVG CARET ── */
  var CARET = '<svg class="n-caret" viewBox="0 0 12 12" aria-hidden="true"><polyline points="2,4 6,8 10,4"/></svg>';
  var MOB_ARROW = '<svg class="mob-acc-arrow" viewBox="0 0 12 12" aria-hidden="true"><polyline points="2,4 6,8 10,4"/></svg>';

  /* ── NAV HTML ── */
  var h = '<nav id="nav">'
    + '<a href="/" class="n-logo">'
      + '<img src="/logo.webp" alt="Jason Marinho" class="nav-logo-img" width="34" height="34" loading="eager">'
      + '<span class="n-brand">Jason <em>Marinho</em></span>'
    + '</a>'
    + '<ul class="n-links">'

      /* ── Services (structure inspirée de Shine : domaines à gauche,
         fonctionnalités au centre, liens transverses à droite) ── */
      + '<li class="n-drop n-drop-wide">'
        + '<button class="n-btn" aria-haspopup="true" aria-expanded="false">Services ' + CARET + '</button>'
        + '<div class="n-mega n-mega-sol">'
          + '<div class="n-sol-tabs" role="tablist" aria-label="Domaines">'
            + '<button type="button" class="n-sol-tab on" role="tab" aria-selected="true" data-sol="gerer"><i class="ph ph-calendar-check"></i><span><span class="n-sol-t">Gérer ton activité</span><span class="n-sol-s">Contrats, ménage, revenus</span></span></button>'
            + '<button type="button" class="n-sol-tab" role="tab" aria-selected="false" data-sol="chiffrer"><i class="ph ph-calculator"></i><span><span class="n-sol-t">Chiffrer & investir</span><span class="n-sol-s">Simulateurs et calculateurs</span></span></button>'
            + '<button type="button" class="n-sol-tab" role="tab" aria-selected="false" data-sol="apprendre"><i class="ph ph-graduation-cap"></i><span><span class="n-sol-t">Te former & échanger</span><span class="n-sol-s">Formations, questions, entraide</span></span></button>'
            + '<button type="button" class="n-sol-tab" role="tab" aria-selected="false" data-sol="pros"><i class="ph ph-camera"></i><span><span class="n-sol-t">Trouver un pro</span><span class="n-sol-s">Photographes et équipes ménage</span></span></button>'
          + '</div>'
          + '<div class="n-sol-mid">'
            + '<div class="n-col-title">Fonctionnalités</div>'
            + '<div class="n-sol-panel on" data-sol-panel="gerer" role="tabpanel">'
              + '<a href="/services/calendrier"><i class="ph ph-calendar-check"></i>Calendrier & check-list</a>'
              + '<a href="/services/contrats"><i class="ph ph-signature"></i>Contrats & paiements</a>'
              + '<a href="/services/planning-menage"><i class="ph ph-broom"></i>Planning ménage</a>'
              + '<a href="/services/declarations-voyageurs"><i class="ph ph-identification-card"></i>Déclarations voyageurs</a>'
              + '<a href="/services/performances"><i class="ph ph-chart-bar"></i>Performances LCD</a>'
              + '<a href="/services/revenus"><i class="ph ph-chart-line-up"></i>Suivi des revenus</a>'
              + '<a href="/services/carnet-voyageurs"><i class="ph ph-address-book"></i>Carnet voyageurs (CRM)</a>'
              + '<a href="/services/securite"><i class="ph ph-shield-check"></i>Vérification voyageurs</a>'
              + '<a href="/securite/signalements"><i class="ph ph-megaphone"></i>Signalements publics</a>'
              + '<a href="/services/gabarits-messages"><i class="ph ph-chat-text"></i>Gabarits de messages</a>'
              + '<a href="/services/qr-affiches"><i class="ph ph-squares-four"></i>QR & Affiches WiFi</a>'
              + '<a href="/services/audit-gbp"><i class="ph ph-magnifying-glass"></i>Fiche Google (audit)</a>'
              + '<a href="/services/annonce-directe"><i class="ph ph-globe"></i>Annonce directe</a>'
              + '<a href="/services" class="n-sol-all">Voir tous les services <i class="ph-bold ph-arrow-right"></i></a>'
            + '</div>'
            + '<div class="n-sol-panel" data-sol-panel="chiffrer" role="tabpanel">'
              + '<a href="/services/simulateurs/fiscalite-micro-bic"><i class="ph ph-currency-eur"></i>Fiscalité micro-BIC</a>'
              + '<a href="/services/simulateurs/choisir-statut-ei-sasu"><i class="ph ph-scales"></i>EI vs SASU</a>'
              + '<a href="/services/simulateurs/rentabilite-location-courte-duree"><i class="ph ph-chart-line-up"></i>Rentabilité LCD</a>'
              + '<a href="/services/simulateurs/taxe-de-sejour"><i class="ph ph-map-pin"></i>Taxe de séjour</a>'
              + '<a href="/services/simulateurs/franchise-tva-lcd"><i class="ph ph-percent"></i>Franchise TVA</a>'
              + '<a href="/investir-lcd"><i class="ph ph-buildings"></i>Investir en LCD</a>'
              + '<a href="/calculateurs/revenus-lcd"><i class="ph ph-trend-up"></i>Estimateur de revenus</a>'
              + '<a href="/calculateurs/prix-lcd"><i class="ph ph-tag"></i>Calculateur de prix</a>'
              + '<a href="/calculateurs/comparer-villes"><i class="ph ph-scales"></i>Comparateur de villes</a>'
              + '<a href="/services/simulateurs" class="n-sol-all">Voir tous les simulateurs <i class="ph-bold ph-arrow-right"></i></a>'
            + '</div>'
            + '<div class="n-sol-panel" data-sol-panel="apprendre" role="tabpanel">'
              + '<a href="/services/formations"><i class="ph ph-graduation-cap"></i>Formations LCD</a>'
              + '<a href="/services/guides-lcd"><i class="ph ph-books"></i>Guides LCD</a>'
              + '<a href="/sos-hote"><i class="ph ph-lifebuoy"></i>SOS Hôte (urgences)</a>'
              + '<a href="/services/entre-hotes"><i class="ph ph-chats-circle"></i>Questions & réponses</a>'
              + '<a href="/services/communaute"><i class="ph ph-users-four"></i>Groupes Facebook</a>'
              + '<a href="/services/actualites"><i class="ph ph-newspaper"></i>Actualités LCD</a>'
              + '<a href="/services/formations" class="n-sol-all">Voir les formations <i class="ph-bold ph-arrow-right"></i></a>'
            + '</div>'
            + '<div class="n-sol-panel n-sol-panel-ann" data-sol-panel="pros" role="tabpanel">'
              + '<div class="n-sol-ann">'
              + '<span class="n-sol-ann-head"><span class="n-sol-ann-ico"><i class="ph-bold ph-camera"></i></span><span class="n-ann-tag"><span class="n-ann-dot"></span>Annuaire pro</span></span>'
              + '<span class="n-sol-ann-h">Photographes <em>LCD</em></span>'
              + '<span class="n-sol-ann-p">Pros qui maîtrisent l\'angle Airbnb, portfolio visible sur leur fiche.</span>'
              + '<a href="/annuaires/photographes" class="n-sol-ann-cta n-sol-ann-primary"><i class="ph-bold ph-magnifying-glass"></i>Voir l\'annuaire</a>'
              + '<a href="/devenir-photographe-lcd" class="n-sol-ann-cta n-sol-ann-secondary"><i class="ph-bold ph-user-plus"></i>Devenir photographe LCD</a>'
              + '</div>'
              + '<div class="n-sol-ann">'
              + '<span class="n-sol-ann-head"><span class="n-sol-ann-ico"><i class="ph-bold ph-sparkle"></i></span><span class="n-ann-tag"><span class="n-ann-dot"></span>Annuaire pro</span></span>'
              + '<span class="n-sol-ann-h">Ménage <em>LCD</em></span>'
              + '<span class="n-sol-ann-p">Équipes de turnover express, gestion du linge, RC pro vérifiée.</span>'
              + '<a href="/annuaires/menage" class="n-sol-ann-cta n-sol-ann-primary"><i class="ph-bold ph-magnifying-glass"></i>Voir l\'annuaire</a>'
              + '<a href="/devenir-prestataire-menage-lcd" class="n-sol-ann-cta n-sol-ann-secondary"><i class="ph-bold ph-user-plus"></i>Devenir prestataire ménage</a>'
              + '</div>'
              + '<a href="/tarifs#photographes" class="n-sol-all">Tarifs des fiches pros <i class="ph-bold ph-arrow-right"></i></a>'
            + '</div>'
            + '<a href="https://app.jasonmarinho.com/auth/register" class="n-sol-cta">Commence gratuitement : 0 €, sans carte bancaire <i class="ph-bold ph-arrow-right"></i></a>'
          + '</div>'
          + '<div class="n-sol-side">'
          + '<div class="n-col-title">Plus</div>'
          + '<a href="/tarifs"><i class="ph ph-tag"></i>Choisir ton offre</a>'
          + '<a href="/partenaires"><i class="ph ph-handshake"></i>Offres partenaires</a>'
          + '<a href="/partenaires#comparatifs"><i class="ph ph-scales"></i>Comparatifs outils</a>'
          + '<a href="/pour-qui/membres-driing"><i class="ph ph-lightning"></i>Membres Driing</a>'
          + '<a href="/services/securite" class="n-sol-card">'
          + '<span class="n-sol-card-tag"><span class="n-feat-dot"></span>Gratuit</span>'
          + '<span class="n-sol-card-h">Vérifie un voyageur <em>avant</em> d\'accepter</span>'
          + '<span class="n-sol-card-p">La base de signalements de la communauté des hôtes.</span>'
          + '</a>'
          + '</div>'
        + '</div>'
      + '</li>'

      /* ── Pour qui ── */
      + '<li class="n-drop">'
        + '<button class="n-btn" aria-haspopup="true" aria-expanded="false">Pour qui ' + CARET + '</button>'
        + '<div class="n-mega">'
          + '<div class="n-col">'
            + '<div class="n-col-title">Par profil</div>'
            + '<a href="/pour-qui/chambres-dhotes"><i class="ph ph-house-line"></i>Chambres d\'hôtes</a>'
            + '<a href="/pour-qui/gites"><i class="ph ph-tree-evergreen"></i>Gîtes</a>'
            + '<a href="/pour-qui/conciergeries"><i class="ph ph-buildings"></i>Conciergeries</a>'
            + '<a href="/pour-qui/photographes"><i class="ph ph-camera"></i>Photographes LCD</a>'
            + '<a href="/pour-qui/menage"><i class="ph ph-sparkle"></i>Équipes ménage LCD</a>'
            + '<a href="/pour-qui/investisseurs"><i class="ph ph-chart-line-up"></i>Investisseurs LCD</a>'
          + '</div>'
          + '<div class="n-driing-card">'
            + '<div class="n-driing-badge"><div class="n-driing-dot"></div><span class="n-driing-badge-txt">Membres</span></div>'
            + '<div class="n-driing-name">Driing</div>'
            + '<div class="n-driing-sub">Réservation directe sans commission, accédez à vos avantages exclusifs</div>'
            + '<div class="n-driing-actions">'
              + '<a href="/pour-qui/membres-driing" class="n-driing-cta n-driing-cta-primary">Voir mes avantages <i class="ph ph-arrow-right"></i></a>'
              + '<a href="https://driing.co" target="_blank" rel="noopener" class="n-driing-cta n-driing-cta-secondary">Découvrir Driing <i class="ph ph-arrow-square-out"></i></a>'
            + '</div>'
          + '</div>'
        + '</div>'
      + '</li>'

      /* ── Ressources (Blog, Partenaires + liens secondaires) ── */
      + '<li class="n-drop">'
        + '<button class="n-btn" aria-haspopup="true" aria-expanded="false">Ressources ' + CARET + '</button>'
        + '<div class="n-mega n-mega-res">'
          + '<a href="/blog" class="n-res-card n-res-blog">'
            + '<span class="n-res-ico"><i class="ph-bold ph-newspaper"></i></span>'
            + '<i class="ph ph-newspaper n-res-deco"></i>'
            + '<span class="n-res-t">Blog</span>'
            + '<span class="n-res-d">Conseils, stratégies et actus pour les hôtes LCD.</span>'
          + '</a>'
          + '<a href="/partenaires" class="n-res-card n-res-part">'
            + '<span class="n-res-ico"><i class="ph-bold ph-handshake"></i></span>'
            + '<i class="ph ph-handshake n-res-deco"></i>'
            + '<span class="n-res-t">Partenaires</span>'
            + '<span class="n-res-d">Outils recommandés et offres négociées pour les membres.</span>'
          + '</a>'
          + '<div class="n-res-more">'
            + '<div class="n-col-title">Plus</div>'
            + '<a href="/qui-suis-je"><i class="ph ph-user-circle"></i>Qui suis-je</a>'
            + '<a href="/contact"><i class="ph ph-envelope"></i>Contact</a>'
            + '<a href="/partenaires#comparatifs"><i class="ph ph-scales"></i>Comparatifs outils</a>'
            + '<a href="/services/guides-lcd"><i class="ph ph-books"></i>Guides LCD</a>'
            + '<a href="/services/actualites"><i class="ph ph-megaphone"></i>Actualités LCD</a>'
            + '<a href="/lexique-lcd"><i class="ph ph-book-open"></i>Lexique LCD</a>'
          + '</div>'
        + '</div>'
      + '</li>'

      /* ── Tarifs : une carte par offre (3 publics différents), offres spéciales à droite ── */
      + '<li class="n-drop n-drop-wide">'
        + '<button class="n-btn" aria-haspopup="true" aria-expanded="false">Tarifs ' + CARET + '</button>'
        + '<div class="n-mega n-mega-tar">'
          + '<a href="/tarifs#hote" class="n-tar-card n-tar-hote">'
            + '<span class="n-tar-vis">'
              + '<span class="n-tar-row"><i class="ph-bold ph-file-text"></i>Contrat<b>Signé</b></span>'
              + '<span class="n-tar-row"><i class="ph-bold ph-sparkle"></i>Ménage<b>Planifié</b></span>'
              + '<span class="n-tar-row"><i class="ph-bold ph-lock-key"></i>Caution<b>Bloquée</b></span>'
            + '</span>'
            + '<span class="n-tar-foot"><span class="n-tar-t">Plateforme hôte</span><span class="n-tar-s">Gratuit, puis Standard à l\'année</span></span>'
          + '</a>'
          + '<a href="/tarifs#photographes" class="n-tar-card n-tar-photo">'
            + '<span class="n-tar-vis">'
              + '<span class="n-tar-grid"><i></i><i></i><i></i><i></i><i></i><i></i></span>'
              + '<span class="n-tar-row n-tar-row-dk"><i class="ph-bold ph-camera"></i>Portfolio<b>12 photos</b></span>'
            + '</span>'
            + '<span class="n-tar-foot"><span class="n-tar-t">Photographes LCD</span><span class="n-tar-s">Ta fiche dans l\'annuaire</span></span>'
          + '</a>'
          + '<a href="/tarifs#menage" class="n-tar-card n-tar-menage">'
            + '<span class="n-tar-vis">'
              + '<span class="n-tar-row n-tar-row-dk"><i class="ph-bold ph-check-circle"></i>Chambres<b>Fait</b></span>'
              + '<span class="n-tar-row n-tar-row-dk"><i class="ph-bold ph-check-circle"></i>Linge<b>Fait</b></span>'
              + '<span class="n-tar-row n-tar-row-dk"><i class="ph-bold ph-camera"></i>Photos<b>Envoyées</b></span>'
            + '</span>'
            + '<span class="n-tar-foot"><span class="n-tar-t">Équipes ménage</span><span class="n-tar-s">Ta fiche dans l\'annuaire</span></span>'
          + '</a>'
          + '<div class="n-tar-side">'
          + '<div class="n-col-title">Offres & aide</div>'
          + '<a href="/tarifs#hote"><i class="ph ph-seal-check"></i>Membre Fondateur, prix à vie</a>'
          + '<a href="/pour-qui/membres-driing"><i class="ph ph-lightning"></i>Membres Driing : tout inclus</a>'
          + '<a href="/tarifs#compare"><i class="ph ph-table"></i>Comparer les plans</a>'
          + '<a href="/tarifs#garantie"><i class="ph ph-arrow-counter-clockwise"></i>Remboursé 30 jours</a>'
          + '<a href="/tarifs#faq"><i class="ph ph-question"></i>Questions fréquentes</a>'
          + '</div>'
        + '</div>'
      + '</li>'

    + '</ul>'
    + '<div class="n-right">'
      + '<a href="https://app.jasonmarinho.com/dashboard" class="nb-o"><i class="ph ph-user"></i> Mon espace</a>'
      + '<a href="https://app.jasonmarinho.com/auth/register" class="nb-c">Commencer <i class="ph-bold ph-arrow-right"></i></a>'
    + '</div>'
    + '<button class="hbg" id="hbg" aria-label="Menu"><span></span><span></span><span></span></button>'
  + '</nav>'

  /* ── MOBILE MENU, ordre identique au desktop ── */
  + '<div class="mob-menu" id="mob">'

    + '<div class="mob-acc" id="acc-sv">'
      + '<button class="mob-acc-btn" aria-expanded="false">Services ' + MOB_ARROW + '</button>'
      + '<div class="mob-acc-body">'
        + '<span class="mob-stitle">Gérer ton activité</span>'
        + '<a href="/services/calendrier"><i class="ph ph-calendar-check"></i>Calendrier & check-list</a>'
        + '<a href="/services/contrats"><i class="ph ph-signature"></i>Contrats & paiements</a>'
        + '<a href="/services/planning-menage"><i class="ph ph-broom"></i>Planning ménage</a>'
        + '<a href="/services/declarations-voyageurs"><i class="ph ph-identification-card"></i>Déclarations voyageurs</a>'
        + '<a href="/services/performances"><i class="ph ph-chart-bar"></i>Performances LCD</a>'
        + '<a href="/services/revenus"><i class="ph ph-chart-line-up"></i>Suivi des revenus</a>'
        + '<a href="/services/carnet-voyageurs"><i class="ph ph-address-book"></i>Carnet voyageurs (CRM)</a>'
        + '<a href="/services/securite"><i class="ph ph-shield-check"></i>Vérification voyageurs</a>'
        + '<a href="/securite/signalements"><i class="ph ph-megaphone"></i>Signalements publics</a>'
        + '<a href="/services/gabarits-messages"><i class="ph ph-chat-text"></i>Gabarits de messages</a>'
        + '<a href="/services/qr-affiches"><i class="ph ph-squares-four"></i>QR & Affiches WiFi</a>'
        + '<a href="/services/audit-gbp"><i class="ph ph-magnifying-glass"></i>Fiche Google (audit)</a>'
        + '<a href="/services/annonce-directe"><i class="ph ph-globe"></i>Annonce directe</a>'
        + '<a href="/services" class="mob-sublink">Voir tous les services <i class="ph-bold ph-arrow-right"></i></a>'
        + '<span class="mob-stitle">Chiffrer & investir</span>'
        + '<a href="/services/simulateurs/fiscalite-micro-bic"><i class="ph ph-currency-eur"></i>Fiscalité micro-BIC</a>'
        + '<a href="/services/simulateurs/choisir-statut-ei-sasu"><i class="ph ph-scales"></i>EI vs SASU</a>'
        + '<a href="/services/simulateurs/rentabilite-location-courte-duree"><i class="ph ph-chart-line-up"></i>Rentabilité LCD</a>'
        + '<a href="/services/simulateurs/taxe-de-sejour"><i class="ph ph-map-pin"></i>Taxe de séjour</a>'
        + '<a href="/services/simulateurs/franchise-tva-lcd"><i class="ph ph-percent"></i>Franchise TVA</a>'
        + '<a href="/investir-lcd"><i class="ph ph-buildings"></i>Investir en LCD</a>'
        + '<a href="/calculateurs/revenus-lcd"><i class="ph ph-trend-up"></i>Estimateur de revenus</a>'
        + '<a href="/calculateurs/prix-lcd"><i class="ph ph-tag"></i>Calculateur de prix</a>'
        + '<a href="/calculateurs/comparer-villes"><i class="ph ph-scales"></i>Comparateur de villes</a>'
        + '<a href="/services/simulateurs" class="mob-sublink">Voir tous les simulateurs <i class="ph-bold ph-arrow-right"></i></a>'
        + '<span class="mob-stitle">Te former & échanger</span>'
        + '<a href="/services/formations"><i class="ph ph-graduation-cap"></i>Formations LCD</a>'
        + '<a href="/services/guides-lcd"><i class="ph ph-books"></i>Guides LCD</a>'
        + '<a href="/sos-hote"><i class="ph ph-lifebuoy"></i>SOS Hôte (urgences)</a>'
        + '<a href="/services/entre-hotes"><i class="ph ph-chats-circle"></i>Questions & réponses</a>'
        + '<a href="/services/communaute"><i class="ph ph-users-four"></i>Groupes Facebook</a>'
        + '<a href="/services/actualites"><i class="ph ph-newspaper"></i>Actualités LCD</a>'
        + '<a href="/services/formations" class="mob-sublink">Voir les formations <i class="ph-bold ph-arrow-right"></i></a>'
        + '<span class="mob-stitle">Trouver un pro</span>'
        + '<div class="mob-driing-card">'
        + '<span class="mdc-tag"><span class="mdc-dot"></span>Annuaire pro</span>'
        + '<div class="mdc-h">Photographes <em>LCD</em></div>'
        + '<div class="mdc-p">Pros qui maîtrisent l\'angle Airbnb, portfolio visible sur leur fiche.</div>'
        + '<div class="mdc-actions">'
        + '<a href="/annuaires/photographes" class="mdc-cta mdc-cta-primary"><i class="ph-bold ph-magnifying-glass"></i>Voir l\'annuaire</a>'
        + '<a href="/devenir-photographe-lcd" class="mdc-cta mdc-cta-secondary"><i class="ph-bold ph-info"></i>Devenir photographe LCD</a>'
        + '</div>'
        + '</div>'
        + '<div class="mob-driing-card">'
        + '<span class="mdc-tag"><span class="mdc-dot"></span>Annuaire pro</span>'
        + '<div class="mdc-h">Ménage <em>LCD</em></div>'
        + '<div class="mdc-p">Équipes de turnover express, gestion du linge, RC pro vérifiée.</div>'
        + '<div class="mdc-actions">'
        + '<a href="/annuaires/menage" class="mdc-cta mdc-cta-primary"><i class="ph-bold ph-magnifying-glass"></i>Voir l\'annuaire</a>'
        + '<a href="/devenir-prestataire-menage-lcd" class="mdc-cta mdc-cta-secondary"><i class="ph-bold ph-info"></i>Devenir prestataire ménage</a>'
        + '</div>'
        + '</div>'
        + '<a href="/tarifs#photographes" class="mob-sublink">Tarifs des fiches pros <i class="ph-bold ph-arrow-right"></i></a>'
      + '</div>'
    + '</div>'

    + '<div class="mob-acc" id="acc-pq">'
      + '<button class="mob-acc-btn" aria-expanded="false">Pour qui ' + MOB_ARROW + '</button>'
      + '<div class="mob-acc-body">'
        + '<a href="/pour-qui/chambres-dhotes"><i class="ph ph-house-line"></i>Chambres d\'hôtes</a>'
        + '<a href="/pour-qui/gites"><i class="ph ph-tree-evergreen"></i>Gîtes</a>'
        + '<a href="/pour-qui/conciergeries"><i class="ph ph-buildings"></i>Conciergeries</a>'
        + '<a href="/pour-qui/photographes"><i class="ph ph-camera"></i>Photographes LCD</a>'
        + '<a href="/pour-qui/menage"><i class="ph ph-sparkle"></i>Équipes ménage LCD</a>'
        + '<a href="/pour-qui/investisseurs"><i class="ph ph-chart-line-up"></i>Investisseurs LCD</a>'
        + '<a href="/pour-qui/membres-driing" class="mob-driing">'
          + '<i class="ph ph-lightning"></i>'
          + '<div class="mob-driing-body">'
            + '<span class="mob-driing-name">Membres Driing</span>'
            + '<span class="mob-driing-sub">Accès inclus avec Driing</span>'
          + '</div>'
        + '</a>'
      + '</div>'
    + '</div>'

    + '<div class="mob-acc" id="acc-res">'
      + '<button class="mob-acc-btn" aria-expanded="false">Ressources ' + MOB_ARROW + '</button>'
      + '<div class="mob-acc-body">'
        + '<a href="/blog"><i class="ph ph-newspaper"></i>Blog LCD</a>'
        + '<a href="/partenaires" class="mob-driing">'
          + '<i class="ph ph-handshake"></i>'
          + '<div class="mob-driing-body">'
            + '<span class="mob-driing-name">Partenaires</span>'
            + '<span class="mob-driing-sub">Outils recommandés et offres membres</span>'
          + '</div>'
        + '</a>'
        + '<a href="/qui-suis-je"><i class="ph ph-user-circle"></i>Qui suis-je</a>'
        + '<a href="/contact"><i class="ph ph-envelope"></i>Contact</a>'
        + '<a href="/partenaires#comparatifs"><i class="ph ph-scales"></i>Comparatifs outils</a>'
        + '<a href="/services/guides-lcd"><i class="ph ph-books"></i>Guides LCD</a>'
        + '<a href="/services/actualites"><i class="ph ph-megaphone"></i>Actualités LCD</a>'
        + '<a href="/lexique-lcd"><i class="ph ph-book-open"></i>Lexique LCD</a>'
      + '</div>'
    + '</div>'

    + '<div class="mob-acc" id="acc-tar">'
      + '<button class="mob-acc-btn" aria-expanded="false">Tarifs ' + MOB_ARROW + '</button>'
      + '<div class="mob-acc-body">'
        + '<a href="/tarifs#hote"><i class="ph ph-house-line"></i>Plateforme hôte</a>'
        + '<a href="/tarifs#photographes"><i class="ph ph-camera"></i>Photographes LCD</a>'
        + '<a href="/tarifs#menage"><i class="ph ph-sparkle"></i>Équipes ménage</a>'
        + '<a href="/pour-qui/membres-driing"><i class="ph ph-lightning"></i>Membres Driing : tout inclus</a>'
        + '<a href="/tarifs#compare"><i class="ph ph-table"></i>Comparer les plans</a>'
        + '<a href="/tarifs#faq"><i class="ph ph-question"></i>Questions fréquentes</a>'
      + '</div>'
    + '</div>'


    + '<div class="mob-ctas">'
      + '<a href="https://app.jasonmarinho.com/dashboard" class="mc-o"><i class="ph ph-user"></i> Mon espace</a>'
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

    /* Hamburger, animation fluide (opacity + translateY) */
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
          if (!mob.classList.contains('open')) { mob.style.display = ''; closeAccordions(); }
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

    /* Accordéons mobile */
    document.querySelectorAll('.mob-acc-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var acc = btn.parentElement;
        var wasOpen = acc.classList.contains('open');
        acc.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(!wasOpen));
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

    /* Services : les domaines de gauche pilotent la colonne centrale
       (survol, focus clavier ou clic tactile). */
    document.querySelectorAll('.n-sol-tab').forEach(function (tab) {
      function show(e) {
        if (e && e.type === 'click') e.stopPropagation();
        var mega = tab.closest('.n-mega-sol');
        mega.querySelectorAll('.n-sol-tab').forEach(function (t2) {
          var on = t2 === tab;
          t2.classList.toggle('on', on);
          t2.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        mega.querySelectorAll('.n-sol-panel').forEach(function (p) {
          p.classList.toggle('on', p.getAttribute('data-sol-panel') === tab.getAttribute('data-sol'));
        });
      }
      tab.addEventListener('mouseenter', show);
      tab.addEventListener('focus', show);
      tab.addEventListener('click', show);
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
    var payload = JSON.stringify({
      session_id: sid,
      path: window.location.pathname,
      referrer: document.referrer || '',
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track/visit', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('/api/track/visit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(function () {});
    }

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
      if (a && a.href.indexOf('/dashboard') !== -1) { try { localStorage.setItem('jm-membre', '1'); } catch (err) {} }
    }, true);

    var membre = false;
    try { membre = localStorage.getItem('jm-membre') === '1'; } catch (e) {}
    if (membre) (window.requestIdleCallback || function (f) { setTimeout(f, 1200); })(warm);
  } catch (e) { /* fail-silent */ }
}());
