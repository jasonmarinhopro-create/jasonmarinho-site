(function () {
  'use strict';

  /* ── Phosphor Icons : assure que les deux subsets (regular + bold) sont chargés ─
   * Si une page n'inclut qu'un seul subset, on ajoute le ou les manquants
   * pour éviter les icônes cassées (cas du footer qui mélange ph et ph-bold). */
  ['phosphor-bold-subset','phosphor-regular-subset'].forEach(function(n){
    if (!document.querySelector('link[href*="'+n+'"]')) {
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.type = 'text/css';
      l.href = '/fonts/'+n+'.css?v=2026-06-23';
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
      '.n-mega-ann .n-ann-cta-primary{background:var(--y);color:var(--gd)}',
      '.n-mega-ann .n-ann-cta-primary:hover{background:#ffe08f;transform:translateY(-1px)}',
      '.n-mega-ann .n-ann-cta-secondary{background:transparent;color:rgba(255,213,107,.75);border:1px solid rgba(255,213,107,.20)}',
      '.n-mega-ann .n-ann-cta-secondary:hover{color:var(--y);border-color:rgba(255,213,107,.4);background:rgba(255,213,107,.05)}',
      '@media(max-width:780px){.n-mega-ann{min-width:auto;width:min(94vw,520px);flex-direction:column}.n-mega-ann .n-ann-card{min-width:auto}}',

      '.n-tag-free{display:inline-flex;align-items:center;font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;padding:2px 6px;border-radius:999px;background:rgba(99,214,131,.18);color:#7AE89A;border:1px solid rgba(99,214,131,.30);margin-left:auto;flex-shrink:0}',
      '.n-mega a.n-sub-link{color:rgba(255,213,107,.7);font-size:12.5px;margin-top:4px;border-top:1px dashed rgba(255,255,255,.06);padding-top:10px}',
      '.n-mega a.n-sub-link:hover{color:var(--y)}',
      '@media(max-width:1080px){.n-mega-3{min-width:0;flex-direction:column;gap:14px}}',

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
      '.mob-driing-card .mdc-cta-primary{background:var(--y);color:var(--gd)}',
      '.mob-driing-card .mdc-cta-secondary{background:transparent;color:rgba(255,213,107,.75);border:1px solid rgba(255,213,107,.20)}',

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
            + '<div class="n-driing-sub">Réservation directe sans commission, accédez à vos avantages exclusifs</div>'
            + '<div class="n-driing-cta">Voir mes avantages <i class="ph ph-arrow-right" style="font-size:11px"></i></div>'
          + '</a>'
        + '</div>'
      + '</li>'

      /* ── Services ── */
      + '<li class="n-drop">'
        + '<button class="n-btn" aria-haspopup="true" aria-expanded="false">Services ' + CARET + '</button>'
        + '<div class="n-mega n-mega-svc">'
          + '<div class="n-col-svc">'
            + '<h3 class="n-col-svc-h">Piloter ton activité</h3>'
            + '<p class="n-col-svc-cap">Tes opérations au quotidien.</p>'
            + '<a href="/services/calendrier">Calendrier & check-list<span class="n-arr">→</span></a>'
            + '<a href="/services/performances">Performances LCD<span class="n-arr">→</span></a>'
            + '<a href="/services/revenus">Suivi des revenus<span class="n-arr">→</span></a>'
            + '<a href="/services/securite">Vérification voyageurs<span class="n-arr">→</span></a>'
            + '<a href="/securite/signalements">Signalements publics<span class="n-arr">→</span></a>'
            + '<a href="/services/carnet-voyageurs">Carnet voyageurs (CRM)<span class="n-arr">→</span></a>'
            + '<a href="/services/gabarits-messages">Gabarits de messages<span class="n-arr">→</span></a>'
            + '<a href="/services/qr-affiches">QR & Affiches WiFi<span class="n-arr">→</span></a>'
            + '<a href="/services/audit-gbp">Audit Google Business<span class="n-arr">→</span></a>'
          + '</div>'
          + '<div class="n-col-svc">'
            + '<h3 class="n-col-svc-h">Chiffrer & décider</h3>'
            + '<p class="n-col-svc-cap">Avant d\'investir ou de relancer un prix.</p>'
            + '<div class="n-sub-cat">Simulateurs fiscaux</div>'
            + '<a href="/services/simulateurs/fiscalite-micro-bic">Fiscalité micro-BIC<span class="n-arr">→</span></a>'
            + '<a href="/services/simulateurs/choisir-statut-ei-sasu">EI vs SASU<span class="n-arr">→</span></a>'
            + '<a href="/services/simulateurs/rentabilite-location-courte-duree">Rentabilité LCD<span class="n-arr">→</span></a>'
            + '<a href="/services/simulateurs/taxe-de-sejour">Taxe de séjour<span class="n-arr">→</span></a>'
            + '<a href="/services/simulateurs/franchise-tva-lcd">Franchise TVA<span class="n-arr">→</span></a>'
            + '<div class="n-sub-cat">Calculateurs marché</div>'
            + '<a href="/calculateurs/revenus-lcd">Estimateur de revenus<span class="n-arr">→</span></a>'
            + '<a href="/calculateurs/prix-lcd">Calculateur de prix<span class="n-arr">→</span></a>'
            + '<a href="/calculateurs/comparer-villes">Comparateur de villes<span class="n-arr">→</span></a>'
          + '</div>'
          + '<div class="n-col-svc">'
            + '<h3 class="n-col-svc-h">Apprendre & échanger</h3>'
            + '<p class="n-col-svc-cap">Pour aller plus loin et trouver du soutien.</p>'
            + '<a href="/services/formations">Formations LCD<span class="n-arr">→</span></a>'
            + '<a href="/services/guides-lcd">Guides LCD<span class="n-arr">→</span></a>'
            + '<a href="/services/actualites">Actualités LCD<span class="n-arr">→</span></a>'
            + '<a href="/sos-hote">SOS Hôte (urgences)<span class="n-arr">→</span></a>'
            + '<a href="/services/entre-hotes">Entre Hôtes (forum)<span class="n-arr">→</span></a>'
            + '<a href="/services/ecosysteme">Écosystème LCD<span class="n-arr">→</span></a>'
            + '<a href="/services/communaute">Groupes Facebook<span class="n-arr">→</span></a>'
          + '</div>'
        + '</div>'
      + '</li>'

      /* ── Annuaires pros ── */
      + '<li class="n-drop">'
        + '<button class="n-btn" aria-haspopup="true" aria-expanded="false">Annuaire ' + CARET + '</button>'
        + '<div class="n-mega n-mega-ann">'
          + '<div class="n-ann-card">'
            + '<span class="n-ann-tag"><span class="n-ann-dot"></span>Annuaire pro</span>'
            + '<div class="n-ann-icon"><i class="ph-bold ph-camera"></i></div>'
            + '<h3 class="n-ann-h">Photographes <em>LCD</em></h3>'
            + '<p class="n-ann-p">Pros qui maîtrisent l\'angle Airbnb. Photos qui font booker +40 %.</p>'
            + '<div class="n-ann-actions">'
              + '<a href="/annuaires/photographes#annuaire" class="n-ann-cta n-ann-cta-primary"><i class="ph-bold ph-magnifying-glass"></i>Voir l\'annuaire</a>'
              + '<a href="/annuaires/photographes/inscription" class="n-ann-cta n-ann-cta-secondary"><i class="ph-bold ph-plus"></i>Créer ma fiche</a>'
            + '</div>'
          + '</div>'
          + '<div class="n-ann-card">'
            + '<span class="n-ann-tag"><span class="n-ann-dot"></span>Annuaire pro</span>'
            + '<div class="n-ann-icon"><i class="ph-bold ph-sparkle"></i></div>'
            + '<h3 class="n-ann-h">Ménage <em>LCD</em></h3>'
            + '<p class="n-ann-p">Équipes de turnover express, gestion du linge, RC pro vérifiée.</p>'
            + '<div class="n-ann-actions">'
              + '<a href="/annuaires/menage#annuaire" class="n-ann-cta n-ann-cta-primary"><i class="ph-bold ph-magnifying-glass"></i>Voir l\'annuaire</a>'
              + '<a href="/annuaires/menage/inscription" class="n-ann-cta n-ann-cta-secondary"><i class="ph-bold ph-plus"></i>Créer ma fiche</a>'
            + '</div>'
          + '</div>'
        + '</div>'
      + '</li>'

      /* ── Blog ── */
      + '<li><a href="/blog" class="n-link">Blog</a></li>'

      /* ── Qui suis-je ── */
      + '<li><a href="/qui-suis-je" class="n-link">Qui suis-je</a></li>'

      /* ── Contact ── */
      + '<li><a href="/contact" class="n-link">Contact</a></li>'

      /* ── Tarifs ── */
      + '<li><a href="/tarifs" class="n-link">Tarifs</a></li>'

    + '</ul>'
    + '<div class="n-right">'
      + '<a href="/mon-compte" class="nb-o"><i class="ph ph-user"></i> Mon espace</a>'
      + '<a href="https://app.jasonmarinho.com/auth/register" class="nb-c">Commencer <i class="ph-bold ph-arrow-right"></i></a>'
    + '</div>'
    + '<button class="hbg" id="hbg" aria-label="Menu"><span></span><span></span><span></span></button>'
  + '</nav>'

  /* ── MOBILE MENU, ordre identique au desktop ── */
  + '<div class="mob-menu" id="mob">'

    + '<div class="mob-acc" id="acc-pq">'
      + '<button class="mob-acc-btn" aria-expanded="false">Pour qui ' + MOB_ARROW + '</button>'
      + '<div class="mob-acc-body">'
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
      + '</div>'
    + '</div>'

    + '<div class="mob-acc" id="acc-sv">'
      + '<button class="mob-acc-btn" aria-expanded="false">Services ' + MOB_ARROW + '</button>'
      + '<div class="mob-acc-body">'
        + '<span class="mob-stitle">Piloter ton activité</span>'
        + '<a href="/services/calendrier"><i class="ph ph-calendar-check"></i>Calendrier & check-list</a>'
        + '<a href="/services/performances"><i class="ph ph-chart-bar"></i>Performances LCD</a>'
        + '<a href="/services/revenus"><i class="ph ph-chart-line-up"></i>Suivi des revenus</a>'
        + '<a href="/services/securite"><i class="ph ph-shield-check"></i>Vérification voyageurs</a>'
        + '<a href="/securite/signalements"><i class="ph ph-megaphone"></i>Signalements publics</a>'
        + '<a href="/services/carnet-voyageurs"><i class="ph ph-address-book"></i>Carnet voyageurs (CRM)</a>'
        + '<a href="/services/gabarits-messages"><i class="ph ph-chat-text"></i>Gabarits de messages</a>'
        + '<a href="/services/qr-affiches"><i class="ph ph-squares-four"></i>QR & Affiches WiFi</a>'
        + '<a href="/services/audit-gbp"><i class="ph ph-magnifying-glass"></i>Audit Google Business</a>'
        + '<span class="mob-stitle">Chiffrer & décider</span>'
        + '<a href="/services/simulateurs/fiscalite-micro-bic"><i class="ph ph-currency-eur"></i>Fiscalité micro-BIC</a>'
        + '<a href="/services/simulateurs/choisir-statut-ei-sasu"><i class="ph ph-scales"></i>EI vs SASU</a>'
        + '<a href="/services/simulateurs/rentabilite-location-courte-duree"><i class="ph ph-chart-line-up"></i>Rentabilité LCD</a>'
        + '<a href="/services/simulateurs/taxe-de-sejour"><i class="ph ph-map-pin"></i>Taxe de séjour</a>'
        + '<a href="/services/simulateurs/franchise-tva-lcd"><i class="ph ph-percent"></i>Franchise TVA</a>'
        + '<a href="/services/simulateurs" class="mob-sublink">Voir tous les simulateurs <i class="ph-bold ph-arrow-right"></i></a>'
        + '<a href="/calculateurs/revenus-lcd"><i class="ph ph-trend-up"></i>Estimateur de revenus</a>'
        + '<a href="/calculateurs/prix-lcd"><i class="ph ph-currency-eur"></i>Calculateur de prix</a>'
        + '<a href="/calculateurs/comparer-villes"><i class="ph ph-scales"></i>Comparateur de villes</a>'
        + '<a href="/calculateurs" class="mob-sublink">Voir tous les calculateurs <i class="ph-bold ph-arrow-right"></i></a>'
        + '<span class="mob-stitle">Apprendre & échanger</span>'
        + '<a href="/services/formations"><i class="ph ph-graduation-cap"></i>Formations LCD</a>'
        + '<a href="/services/guides-lcd"><i class="ph ph-books"></i>Guides LCD</a>'
        + '<a href="/services/actualites"><i class="ph ph-megaphone"></i>Actualités LCD</a>'
        + '<a href="/sos-hote"><i class="ph ph-lifebuoy"></i>SOS Hôte (urgences)</a>'
        + '<a href="/services/entre-hotes"><i class="ph ph-house"></i>Entre Hôtes (forum)</a>'
        + '<a href="/services/ecosysteme"><i class="ph ph-globe"></i>Écosystème LCD</a>'
        + '<a href="/services/communaute"><i class="ph ph-users-four"></i>Groupes Facebook</a>'
      + '</div>'
    + '</div>'

    + '<div class="mob-acc" id="acc-ann">'
      + '<button class="mob-acc-btn" aria-expanded="false">Annuaire ' + MOB_ARROW + '</button>'
      + '<div class="mob-acc-body">'
        + '<div class="mob-driing-card">'
          + '<span class="mdc-tag"><span class="mdc-dot"></span>Annuaire pro</span>'
          + '<div class="mdc-h">Photographes <em>LCD</em></div>'
          + '<div class="mdc-p">Annuaire des pros qui maîtrisent l\'angle Airbnb. Photos qui font booker +40 %.</div>'
          + '<div class="mdc-actions">'
            + '<a href="/annuaires/photographes#annuaire" class="mdc-cta mdc-cta-primary"><i class="ph-bold ph-magnifying-glass"></i>Voir l\'annuaire</a>'
            + '<a href="/annuaires/photographes/inscription" class="mdc-cta mdc-cta-secondary"><i class="ph-bold ph-plus"></i>Créer ma fiche</a>'
          + '</div>'
        + '</div>'
        + '<div class="mob-driing-card">'
          + '<span class="mdc-tag"><span class="mdc-dot"></span>Annuaire pro</span>'
          + '<div class="mdc-h">Ménage <em>LCD</em></div>'
          + '<div class="mdc-p">Équipes de ménage spécialisées turnover Airbnb. Linge, photo, RC pro vérifiée.</div>'
          + '<div class="mdc-actions">'
            + '<a href="/annuaires/menage#annuaire" class="mdc-cta mdc-cta-primary"><i class="ph-bold ph-magnifying-glass"></i>Voir l\'annuaire</a>'
            + '<a href="/annuaires/menage/inscription" class="mdc-cta mdc-cta-secondary"><i class="ph-bold ph-plus"></i>Créer ma fiche</a>'
          + '</div>'
        + '</div>'
      + '</div>'
    + '</div>'

    + '<a href="/blog"><i class="ph ph-newspaper"></i>Blog LCD</a>'
    + '<a href="/qui-suis-je"><i class="ph ph-user-circle"></i>Qui suis-je</a>'
    + '<a href="/contact"><i class="ph ph-envelope"></i>Contact</a>'
    + '<a href="/tarifs"><i class="ph ph-tag"></i>Tarifs</a>'

    + '<div class="mob-ctas">'
      + '<a href="/mon-compte" class="mc-o"><i class="ph ph-user"></i> Mon espace</a>'
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
