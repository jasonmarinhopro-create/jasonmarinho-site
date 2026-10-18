/* Liste de suggestions du site (18/10/2026, Jason : « ce petit panneau noir,
   je ne peux plus le voir », propositions B + D choisies). Remplace la liste
   du navigateur (<datalist>, dessinée par Chrome en noir, impossible à styler)
   sur tout champ <input list="…"> de la page :
   - ordinateur : liste sous le champ (repère de lieu, région, « Page dédiée »,
     lettres tapées soulignées, flèches / Entrée / Échap, « Utiliser « … » ») ;
   - téléphone (≤ 640 px) : feuille plein écran avec sa propre recherche.
   Un seul fichier pour tout le site : le faire évoluer ici seulement.
   Options du champ :
     data-suggest="ville"         repères (région, « Page dédiée ») pour les villes
     data-suggest-anchor="<sel>"  boîte visuelle du champ (ex. .vs-in) pour placer la liste
     data-suggest-submit          envoie le formulaire au choix d'une ligne
     data-suggest-strict          pas de ligne « Utiliser « … » »
   La valeur choisie déclenche les événements input et change du champ.
   Même composant dans l'app : jason-app/components/ui/SuggestInput.tsx. */
(function () {
  if (window.__jmSuggest) return;
  window.__jmSuggest = true;

  /* Régions des villes qui ont leurs pages : réécrit par scripts/inject-villes-voisines.mjs */
  var REGIONS = /*REGIONS:START*/{"aix-en-provence":"Provence-Alpes-Côte d'Azur","ajaccio":"Corse","angers":"Pays de la Loire et Val de Loire","annecy":"Auvergne-Rhône-Alpes","antibes":"Provence-Alpes-Côte d'Azur","arcachon":"Nouvelle-Aquitaine","avignon":"Provence-Alpes-Côte d'Azur","bastia":"Corse","bayonne":"Nouvelle-Aquitaine","beaune":"Bourgogne","biarritz":"Nouvelle-Aquitaine","bordeaux":"Nouvelle-Aquitaine","brest":"Bretagne","caen":"Normandie et Hauts-de-France","cannes":"Provence-Alpes-Côte d'Azur","carcassonne":"Occitanie","chambery":"Auvergne-Rhône-Alpes","chamonix":"Auvergne-Rhône-Alpes","clermont-ferrand":"Auvergne-Rhône-Alpes","colmar":"Grand Est","deauville":"Normandie et Hauts-de-France","dijon":"Bourgogne","dinard":"Bretagne","epernay":"Grand Est","etretat":"Normandie et Hauts-de-France","grenoble":"Auvergne-Rhône-Alpes","honfleur":"Normandie et Hauts-de-France","la-baule":"Pays de la Loire et Val de Loire","la-rochelle":"Nouvelle-Aquitaine","le-mans":"Pays de la Loire et Val de Loire","le-touquet":"Normandie et Hauts-de-France","les-sables-d-olonne":"Pays de la Loire et Val de Loire","lille":"Normandie et Hauts-de-France","lyon":"Auvergne-Rhône-Alpes","marseille":"Provence-Alpes-Côte d'Azur","megeve":"Auvergne-Rhône-Alpes","menton":"Provence-Alpes-Côte d'Azur","metz":"Grand Est","montpellier":"Occitanie","nancy":"Grand Est","nantes":"Pays de la Loire et Val de Loire","nice":"Provence-Alpes-Côte d'Azur","nimes":"Occitanie","paris":"Île-de-France","pau":"Nouvelle-Aquitaine","perpignan":"Occitanie","poitiers":"Nouvelle-Aquitaine","quebec":"Canada","quimper":"Bretagne","reims":"Grand Est","rennes":"Bretagne","roanne":"Auvergne-Rhône-Alpes","rouen":"Normandie et Hauts-de-France","saint-malo":"Bretagne","saint-tropez":"Provence-Alpes-Côte d'Azur","sarlat":"Nouvelle-Aquitaine","sete":"Occitanie","strasbourg":"Grand Est","toulouse":"Occitanie","tours":"Pays de la Loire et Val de Loire","troyes":"Grand Est","vannes":"Bretagne","versailles":"Île-de-France"}/*REGIONS:END*/;
  var POPULAR = ['paris', 'lyon', 'bordeaux', 'nice', 'annecy', 'biarritz', 'marseille', 'saint-malo'];
  var MAX = 8;

  var norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var slug = function (s) { return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var isPhone = function () { return window.matchMedia('(max-width: 640px)').matches; };
  var uid = 0;

  var PIN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
  var PLUS = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  var LOUPE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';

  var css = '' +
    '.jms-pop{position:fixed;z-index:9990;padding:8px;background:#fff;border:1px solid #E7E2D6;border-radius:16px;box-shadow:0 18px 44px rgba(0,40,30,.15),0 2px 6px rgba(0,40,30,.06);font-family:Outfit,system-ui,sans-serif;color:#0F1A0D;max-height:340px;overflow:auto;overscroll-behavior:contain;box-sizing:border-box}' +
    '.jms-h{padding:6px 10px 8px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#6B7568}' +
    '.jms-o{display:flex;align-items:center;gap:12px;min-height:48px;padding:6px 10px;border-radius:11px;cursor:pointer;text-align:left}' +
    '.jms-o.on{background:#F4F1E9}' +
    '.jms-pin{width:34px;height:34px;border-radius:10px;background:#EEF4F1;color:#004C3F;display:flex;align-items:center;justify-content:center;flex-shrink:0}' +
    '.jms-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}' +
    '.jms-n{font-size:15px;font-weight:600;color:#22311F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.jms-n u{color:#004C3F;text-decoration:underline;text-decoration-color:#FFD56B;text-decoration-thickness:3px;text-underline-offset:3px}' +
    '.jms-r{font-size:12.5px;color:#6B7568}' +
    '.jms-b{font-size:11.5px;font-weight:600;color:#004C3F;background:#EEF4F1;border-radius:999px;padding:3px 9px;white-space:nowrap}' +
    '.jms-free{display:flex;align-items:center;gap:12px;min-height:48px;margin-top:4px;padding:6px 10px;border-top:1px dashed #E1DCD0;border-radius:0 0 11px 11px;cursor:pointer;font-size:14.5px;color:#22311F}' +
    '.jms-free.on{background:#F4F1E9}' +
    '.jms-free .jms-pin{background:transparent;border:1.5px dashed #C9C2B2;color:#5E6B5B}' +
    '.jms-empty{padding:10px 12px;font-size:14px;color:#5E6B5B}' +
    '.jms-plain .jms-o{min-height:40px}' +
    '.jms-veil{position:fixed;inset:0;z-index:9990;background:rgba(15,26,13,.35);animation:jms-f .18s ease}' +
    '.jms-sheet{position:fixed;left:0;right:0;bottom:0;top:28px;z-index:9991;background:#fff;border-radius:22px 22px 0 0;box-shadow:0 -10px 40px rgba(0,40,30,.18);display:flex;flex-direction:column;font-family:Outfit,system-ui,sans-serif;color:#0F1A0D;animation:jms-u .24s cubic-bezier(.2,.8,.2,1)}' +
    '.jms-grab{display:flex;justify-content:center;padding-top:10px}.jms-grab span{width:40px;height:5px;border-radius:3px;background:#DDD7CA}' +
    '.jms-top{display:flex;align-items:center;gap:10px;padding:14px 16px 12px;border-bottom:1px solid #EFEBE2}' +
    '.jms-box{flex:1;display:flex;align-items:center;gap:10px;height:48px;padding:0 14px;border-radius:12px;background:#F4F1E9;color:#5E6B5B}' +
    '.jms-box input{flex:1;min-width:0;border:none;background:transparent;font:400 16px Outfit,system-ui,sans-serif;color:#0F1A0D;padding:0;outline:none}' +
    '.jms-cancel{height:44px;padding:0 6px;border:none;background:transparent;font:600 15px Outfit,system-ui,sans-serif;color:#004C3F;cursor:pointer}' +
    '.jms-list{flex:1;overflow:auto;padding:8px 8px 32px;overscroll-behavior:contain}' +
    '.jms-sheet .jms-o{min-height:58px;border-radius:0;border-bottom:1px solid #F2EFE8}' +
    '.jms-sheet .jms-pin{border-radius:50%;width:36px;height:36px}' +
    '.jms-sheet .jms-n{font-size:16px}.jms-sheet .jms-n u{text-decoration:none}' +
    '.jms-sheet .jms-free{min-height:54px;margin-top:10px;border:1.5px dashed #C9C2B2;border-radius:12px;justify-content:center}' +
    '.jms-sheet .jms-free .jms-pin{display:none}' +
    'html.jms-lock,html.jms-lock body{overflow:hidden}' +
    '@keyframes jms-u{from{transform:translateY(100%)}to{transform:none}}@keyframes jms-f{from{opacity:0}to{opacity:1}}' +
    '@media (prefers-reduced-motion:reduce){.jms-sheet,.jms-veil{animation:none}}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  function readOptions(input) {
    var dl = input._jmsList ? document.getElementById(input._jmsList) : null;
    if (!dl) return [];
    return Array.prototype.map.call(dl.querySelectorAll('option'), function (o) {
      return { value: o.value, label: o.value };
    }).filter(function (o) { return o.value; });
  }

  function search(input, q) {
    var all = readOptions(input), nq = norm(q.trim()), city = input.dataset.suggest === 'ville';
    var list;
    if (!nq) {
      list = city ? POPULAR.map(function (s) { return all.filter(function (o) { return slug(o.value) === s; })[0]; }).filter(Boolean) : all.slice();
      if (!list.length) list = all.slice();
    } else {
      list = all.filter(function (o) { return norm(o.value).indexOf(nq) >= 0; });
      list.sort(function (a, b) { return (norm(a.value).indexOf(nq) === 0 ? 0 : 1) - (norm(b.value).indexOf(nq) === 0 ? 0 : 1) || a.value.localeCompare(b.value, 'fr'); });
    }
    var exact = all.some(function (o) { return norm(o.value) === nq; });
    return {
      items: list.slice(0, isPhone() ? 30 : MAX),
      heading: !nq ? (city ? 'Les plus demandées' : 'Suggestions') : (list.length ? (city ? 'Villes avec une page sur le site' : 'Suggestions') : (city ? 'Pas encore de page pour cette ville' : '')),
      free: nq && !exact && !input.hasAttribute('data-suggest-strict') ? q.trim() : null,
      nq: nq, city: city
    };
  }

  function rowHtml(o, i, r, active, id) {
    var k = r.nq ? norm(o.value).indexOf(r.nq) : -1;
    var name = k >= 0 ? esc(o.value.slice(0, k)) + '<u>' + esc(o.value.slice(k, k + r.nq.length)) + '</u>' + esc(o.value.slice(k + r.nq.length)) : esc(o.value);
    var reg = r.city ? REGIONS[slug(o.value)] : null;
    return '<div class="jms-o' + (i === active ? ' on' : '') + '" role="option" id="' + id + '-' + i + '" aria-selected="' + (i === active) + '" data-i="' + i + '">' +
      (r.city ? '<span class="jms-pin">' + PIN + '</span>' : '') +
      '<span class="jms-t"><span class="jms-n">' + name + '</span>' + (reg ? '<span class="jms-r">' + esc(reg) + '</span>' : '') + '</span>' +
      (reg ? '<span class="jms-b">Page dédiée</span>' : '') + '</div>';
  }

  function listHtml(r, active, id) {
    var h = r.heading ? '<div class="jms-h">' + r.heading + '</div>' : '';
    var rows = r.items.map(function (o, i) { return rowHtml(o, i, r, active, id); }).join('');
    if (r.free !== null) {
      var i = r.items.length;
      rows += '<div class="jms-free' + (i === active ? ' on' : '') + '" role="option" id="' + id + '-' + i + '" aria-selected="' + (i === active) + '" data-i="' + i + '"><span class="jms-pin">' + PLUS + '</span><span>Utiliser « <strong>' + esc(r.free) + '</strong> »</span></div>';
    }
    if (!rows) rows = '<div class="jms-empty">Aucune suggestion</div>';
    return h + rows;
  }

  function choose(input, value) {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    if (input.hasAttribute('data-suggest-submit') && input.form) {
      if (input.form.requestSubmit) input.form.requestSubmit(); else input.form.submit();
    }
  }

  /* ── Ordinateur : liste sous le champ ── */
  function attachDesktop(input) {
    var id = 'jms' + (++uid), pop = null, r = null, active = -1;
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', id);
    var anchor = function () { return (input.dataset.suggestAnchor && input.closest(input.dataset.suggestAnchor)) || input; };
    function place() {
      if (!pop) return;
      var b = anchor().getBoundingClientRect(), below = window.innerHeight - b.bottom;
      var w = Math.min(Math.max(b.width, input.dataset.suggest === 'ville' ? 360 : 240), window.innerWidth - 16);
      pop.style.width = w + 'px';
      pop.style.left = Math.max(8, Math.min(b.left, window.innerWidth - w - 8)) + 'px';
      if (below < 240 && b.top > below) { pop.style.top = ''; pop.style.bottom = (window.innerHeight - b.top + 8) + 'px'; pop.style.maxHeight = Math.min(340, b.top - 16) + 'px'; }
      else { pop.style.bottom = ''; pop.style.top = (b.bottom + 8) + 'px'; pop.style.maxHeight = Math.min(340, below - 16) + 'px'; }
    }
    function render() {
      r = search(input, input.value);
      var count = r.items.length + (r.free !== null ? 1 : 0);
      if (!count && !r.heading) { close(); return; }
      if (active >= count) active = count - 1;
      if (!pop) {
        pop = document.createElement('div');
        pop.className = 'jms-pop' + (input.dataset.suggest === 'ville' ? '' : ' jms-plain');
        pop.id = id;
        pop.setAttribute('role', 'listbox');
        pop.addEventListener('mousedown', function (e) {
          e.preventDefault();
          var row = e.target.closest('[data-i]'); if (row) pick(Number(row.getAttribute('data-i')));
        });
        pop.addEventListener('mousemove', function (e) {
          var row = e.target.closest('[data-i]'); if (!row) return;
          var i = Number(row.getAttribute('data-i')); if (i !== active) { active = i; paintActive(); }
        });
        document.body.appendChild(pop);
        window.addEventListener('scroll', place, true);
        window.addEventListener('resize', place);
      }
      pop.innerHTML = listHtml(r, active, id);
      input.setAttribute('aria-expanded', 'true');
      place();
      paintActive();
    }
    function paintActive() {
      if (!pop) return;
      pop.querySelectorAll('[data-i]').forEach(function (el) {
        var on = Number(el.getAttribute('data-i')) === active;
        el.classList.toggle('on', on); el.setAttribute('aria-selected', String(on));
        if (on) el.scrollIntoView({ block: 'nearest' });
      });
      if (active >= 0) input.setAttribute('aria-activedescendant', id + '-' + active); else input.removeAttribute('aria-activedescendant');
    }
    function close() {
      if (pop) { pop.remove(); pop = null; window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place); }
      active = -1;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    }
    function pick(i) {
      if (!r) return;
      var v = i < r.items.length ? r.items[i].value : r.free;
      close();
      if (v != null) choose(input, v);
    }
    input.addEventListener('focus', function () { if (!isPhone()) { active = -1; render(); } });
    input.addEventListener('input', function (e) { if (isPhone() || !e.isTrusted) return; active = input.value.trim() ? 0 : -1; render(); });
    input.addEventListener('blur', function () { setTimeout(close, 120); });
    input.addEventListener('keydown', function (e) {
      if (isPhone()) return;
      var count = r ? r.items.length + (r.free !== null ? 1 : 0) : 0;
      if (e.key === 'ArrowDown') { e.preventDefault(); if (!pop) { render(); } active = Math.min(active + 1, count - 1); paintActive(); }
      else if (e.key === 'ArrowUp') { if (!pop) return; e.preventDefault(); active = Math.max(active - 1, 0); paintActive(); }
      else if (e.key === 'Enter' && pop && active >= 0) { e.preventDefault(); pick(active); }
      else if (e.key === 'Escape' && pop) { e.preventDefault(); close(); }
      else if (e.key === 'Tab') close();
    });
    return close;
  }

  /* ── Téléphone : feuille plein écran ── */
  function openSheet(input) {
    var id = 'jms' + (++uid), veil = document.createElement('div'), sheet = document.createElement('div');
    veil.className = 'jms-veil';
    sheet.className = 'jms-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    var label = (input.labels && input.labels[0] && input.labels[0].textContent.trim()) || input.getAttribute('aria-label') || 'Choisir';
    sheet.setAttribute('aria-label', label);
    sheet.innerHTML = '<div class="jms-grab"><span></span></div><div class="jms-top"><label class="jms-box">' + LOUPE +
      '<input type="text" autocomplete="off" autocapitalize="words" enterkeyhint="done" aria-label="' + esc(label) + '" placeholder="' + esc(input.getAttribute('placeholder') || 'Rechercher') + '"></label>' +
      '<button type="button" class="jms-cancel">Annuler</button></div><div class="jms-list" role="listbox" id="' + id + '"></div>';
    document.body.appendChild(veil);
    document.body.appendChild(sheet);
    document.documentElement.classList.add('jms-lock');
    var field = sheet.querySelector('input'), list = sheet.querySelector('.jms-list'), r = null;
    field.value = input.value;
    function render() { r = search(input, field.value); list.innerHTML = listHtml(r, -1, id); }
    function shut() { veil.remove(); sheet.remove(); document.documentElement.classList.remove('jms-lock'); }
    function pick(v) { shut(); if (v != null) choose(input, v); }
    field.addEventListener('input', render);
    field.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); pick(r && r.items[0] && norm(r.items[0].value) === norm(field.value.trim()) ? r.items[0].value : (field.value.trim() || null)); }
      else if (e.key === 'Escape') shut();
    });
    list.addEventListener('click', function (e) {
      var row = e.target.closest('[data-i]'); if (!row || !r) return;
      var i = Number(row.getAttribute('data-i'));
      pick(i < r.items.length ? r.items[i].value : r.free);
    });
    sheet.querySelector('.jms-cancel').addEventListener('click', shut);
    // Le « clic » du toucher qui a ouvert la feuille arrive après : pas de fermeture tout de suite
    var openedAt = Date.now();
    veil.addEventListener('click', function () { if (Date.now() - openedAt > 450) shut(); });
    render();
    setTimeout(function () { field.focus(); }, 30);
  }

  function enhance(input) {
    if (input._jms) return;
    var listId = input.getAttribute('list');
    if (!listId) return;
    input._jms = true;
    input._jmsList = listId;
    input.removeAttribute('list');
    input.setAttribute('autocomplete', 'off');
    attachDesktop(input);
    // Téléphone : le champ ouvre la feuille (sans clavier sur la page derrière)
    input.addEventListener('focus', function () {
      if (!isPhone() || document.querySelector('.jms-sheet')) return;
      input.blur();
      openSheet(input);
    });
  }

  function scan(root) { (root || document).querySelectorAll('input[list]').forEach(enhance); }
  window.jmSuggest = { enhance: enhance, scan: scan };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { scan(); });
  else scan();
})();
