/* Calendrier maison du site (18/10/2026, Jason : « l'agenda du navigateur est à bannir »).
 * Même calendrier que l'app (jason-app/components/ui/CalendarInput.tsx) : un seul fichier
 * pour tout le site, à inclure en defer. Transforme chaque <input type="date"> (ou
 * [data-date]) : le champ d'origine devient caché et garde la valeur AAAA-MM-JJ ; un bouton
 * affiche la date en toutes lettres et ouvre le calendrier. Un clic sur le titre passe aux
 * mois puis aux années. Attributs : min, max, placeholder, data-birth (date de naissance).
 * Le champ d'origine reçoit les événements input et change à chaque choix.
 */
(function () {
  if (window.__jmCal) return;
  window.__jmCal = true;

  var CSS =
    '.jmc-t{display:flex;align-items:center;gap:10px;width:100%;min-height:52px;padding:12px 15px;border:1.5px solid rgba(0,76,63,.11);border-radius:13px;background:#fff;font:400 16px Outfit,system-ui,sans-serif;color:#0F1A0D;text-align:left;cursor:pointer;transition:border-color .15s}' +
    '.jmc-t:hover{border-color:rgba(0,76,63,.35)}' +
    '.jmc-t.on,.jmc-t:focus-visible{outline:none;border-color:#004C3F;box-shadow:0 0 0 4px rgba(255,213,107,.35)}' +
    '.jmc-t .jmc-i{color:#004C3F;flex-shrink:0;display:flex}' +
    '.jmc-t .jmc-v{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.jmc-t .jmc-v.mute{color:#8A9488}' +
    '.jmc-t .jmc-c{color:#8A9488;display:flex;transition:transform .15s}.jmc-t.on .jmc-c{transform:rotate(180deg)}' +
    '.jmc-p{position:fixed;z-index:99990;background:#fff;border:1px solid #E7E2D6;border-radius:16px;padding:14px 14px 10px;box-shadow:0 18px 44px rgba(0,40,30,.18);font-family:Outfit,system-ui,sans-serif;color:#0F1A0D;animation:jmc-in .14s ease}' +
    '@keyframes jmc-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}' +
    '.jmc-h{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}' +
    '.jmc-n{width:32px;height:32px;border-radius:50%;border:1px solid #E7E2D6;background:#FAF8F3;color:#3D5038;display:grid;place-items:center;cursor:pointer;flex-shrink:0}' +
    '.jmc-n:hover{border-color:#004C3F;color:#004C3F}' +
    '.jmc-ti{border:none;background:none;font:600 14px Outfit,system-ui,sans-serif;color:#0F1A0D;cursor:pointer;padding:6px 10px;border-radius:8px;display:inline-flex;align-items:center;gap:6px}' +
    '.jmc-ti:hover{background:#F4F1E9}' +
    '.jmc-w{display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:2px}' +
    '.jmc-w span{text-align:center;font-size:10.5px;font-weight:600;color:#6B7568;padding:3px 0;letter-spacing:.5px}' +
    '.jmc-g{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}' +
    '.jmc-g.mo{grid-template-columns:repeat(3,1fr);gap:6px}' +
    '.jmc-d{height:36px;border:none;border-radius:9px;background:transparent;font:400 14px Outfit,system-ui,sans-serif;color:#22311F;cursor:pointer}' +
    '.jmc-g.mo .jmc-d{height:44px;background:#FAF8F3;font-weight:500}' +
    '.jmc-d:hover{background:#F4F1E9}' +
    '.jmc-d.td{background:#F2EFE8;color:#1e7a45;font-weight:700}' +
    '.jmc-d.sel{background:rgba(0,76,63,.1);color:#004C3F;font-weight:700;box-shadow:inset 0 0 0 1.5px rgba(0,76,63,.4)}' +
    '.jmc-d:disabled{opacity:.3;cursor:default;background:transparent}' +
    '.jmc-d:focus-visible,.jmc-n:focus-visible,.jmc-ti:focus-visible,.jmc-l:focus-visible{outline:3px solid rgba(255,213,107,.9);outline-offset:1px}' +
    '.jmc-f{display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid #EFEBE2}' +
    '.jmc-l{border:none;background:none;font:600 13px Outfit,system-ui,sans-serif;color:#004C3F;cursor:pointer;padding:5px 6px;border-radius:6px}' +
    '.jmc-l.mu{color:#8A9488}' +
    '@media (prefers-reduced-motion:reduce){.jmc-p{animation:none}}';

  var ICON_CAL = '<svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M208 28h-20v-4a12 12 0 0 0-24 0v4H92v-4a12 12 0 0 0-24 0v4H48a20 20 0 0 0-20 20v160a20 20 0 0 0 20 20h160a20 20 0 0 0 20-20V48a20 20 0 0 0-20-20Zm-4 24v24H52V52Zm-152 152V100h152v104Z"/></svg>';
  var CARET = function (d) { return '<svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="' + d + '"/></svg>'; };
  var DOWN = CARET('M216.49 104.49l-80 80a12 12 0 0 1-17 0l-80-80a12 12 0 0 1 17-17L128 159l71.51-71.52a12 12 0 0 1 17 17Z');
  var LEFT = CARET('M168.49 199.51a12 12 0 0 1-17 17l-80-80a12 12 0 0 1 0-17l80-80a12 12 0 0 1 17 17L97 128Z');
  var RIGHT = CARET('M184.49 136.49l-80 80a12 12 0 0 1-17-17L159 128L87.51 56.49a12 12 0 1 1 17-17l80 80a12 12 0 0 1-.02 17Z');

  var LABELS = { fr: ['Aujourd’hui', 'Effacer', 'Précédent', 'Suivant', 'Choisir une date'], en: ['Today', 'Clear', 'Previous', 'Next', 'Pick a date'], pt: ['Hoje', 'Limpar', 'Anterior', 'Seguinte', 'Escolher uma data'] };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(v) { return /^\d{4}-\d{2}-\d{2}$/.test(v || '') ? new Date(v + 'T12:00:00') : null; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var open = null; // { close }

  function enhance(input) {
    if (input._jmc) return;
    input._jmc = true;
    if (!document.getElementById('jmc-css')) { var st = document.createElement('style'); st.id = 'jmc-css'; st.textContent = CSS; document.head.appendChild(st); }
    var loc = (document.documentElement.lang || 'fr').slice(0, 2); if (!LABELS[loc]) loc = 'fr';
    var L = LABELS[loc];
    var birth = input.hasAttribute('data-birth');
    var ph = input.getAttribute('placeholder') || input.getAttribute('aria-label') || L[4];
    var label = input.getAttribute('aria-label') || (input.labels && input.labels[0] && input.labels[0].textContent.trim()) || ph;
    input.type = 'hidden';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'jmc-t';
    btn.setAttribute('aria-haspopup', 'dialog');
    if (input.id) { var lab = document.querySelector('label[for="' + input.id + '"]'); if (lab) { lab.removeAttribute('for'); lab.addEventListener('click', function () { btn.focus(); }); } }
    if (input.style.maxWidth) btn.style.maxWidth = input.style.maxWidth;
    input.parentNode.insertBefore(btn, input.nextSibling);
    var MONTHS = [], SHORT = [], DAYS = [];
    for (var i = 0; i < 12; i++) { var d0 = new Date(2026, i, 1); MONTHS.push(cap(d0.toLocaleDateString(loc, { month: 'long' }))); SHORT.push(cap(d0.toLocaleDateString(loc, { month: 'short' }))); }
    for (var j = 0; j < 7; j++) DAYS.push(cap(new Date(2026, 0, 5 + j).toLocaleDateString(loc, { weekday: 'short' }).replace('.', '').slice(0, 2)));

    function paintBtn() {
      var d = parse(input.value);
      btn.innerHTML = '<span class="jmc-i">' + ICON_CAL + '</span><span class="jmc-v' + (d ? '' : ' mute') + '">' + esc(d ? d.toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' }) : ph) + '</span><span class="jmc-c">' + DOWN + '</span>';
      btn.setAttribute('aria-label', label + ' : ' + (d ? d.toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' }) : ph));
    }
    paintBtn();
    input._jmcPaint = paintBtn;

    function show() {
      if (open) open.close();
      var view = birth && !input.value ? 'years' : 'days';
      var cur = parse(input.value) || (birth ? new Date(1990, 0, 1) : new Date());
      var pop = document.createElement('div');
      pop.className = 'jmc-p';
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-label', label);
      document.body.appendChild(pop);
      btn.classList.add('on');
      btn.setAttribute('aria-expanded', 'true');
      var today = iso(new Date());
      var min = input.getAttribute('min') || '', max = input.getAttribute('max') || (birth ? today : '');
      function out(v) { return (min && v < min) || (max && v > max); }

      function place() {
        var r = btn.getBoundingClientRect(), W = Math.min(Math.max(r.width, 300), window.innerWidth - 24);
        pop.style.width = W + 'px';
        var H = pop.offsetHeight || 360, left = Math.min(Math.max(12, r.left), window.innerWidth - W - 12);
        var top = r.bottom + 6;
        if (top + H > window.innerHeight - 12 && r.top - H - 6 > 12) top = r.top - H - 6;
        pop.style.left = left + 'px'; pop.style.top = Math.max(12, top) + 'px';
      }
      function render() {
        var y = cur.getFullYear(), m = cur.getMonth(), dec = Math.floor(y / 12) * 12, h = '';
        var title = view === 'days' ? MONTHS[m] + ' ' + y : view === 'months' ? String(y) : dec + ' – ' + (dec + 11);
        h += '<div class="jmc-h"><button type="button" class="jmc-n" data-nav="-1" aria-label="' + L[2] + '">' + LEFT + '</button><button type="button" class="jmc-ti" data-title>' + title + ' ' + DOWN + '</button><button type="button" class="jmc-n" data-nav="1" aria-label="' + L[3] + '">' + RIGHT + '</button></div>';
        if (view === 'days') {
          var first = (new Date(y, m, 1).getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate();
          h += '<div class="jmc-w">' + DAYS.map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</div><div class="jmc-g">';
          for (var e = 0; e < first; e++) h += '<span></span>';
          for (var k = 1; k <= n; k++) {
            var v = iso(new Date(y, m, k)), cls = 'jmc-d' + (v === input.value ? ' sel' : v === today ? ' td' : '');
            h += '<button type="button" class="' + cls + '" data-day="' + v + '"' + (out(v) ? ' disabled' : '') + (v === input.value ? ' aria-pressed="true"' : '') + '>' + k + '</button>';
          }
          h += '</div>';
        } else if (view === 'months') {
          h += '<div class="jmc-g mo">' + SHORT.map(function (s, i) { var sel = parse(input.value); return '<button type="button" class="jmc-d' + (sel && sel.getFullYear() === y && sel.getMonth() === i ? ' sel' : '') + '" data-month="' + i + '">' + s + '</button>'; }).join('') + '</div>';
        } else {
          h += '<div class="jmc-g mo">';
          for (var a = dec; a < dec + 12; a++) { var off = (max && a + '-01-01' > max) || (min && a + '-12-31' < min); h += '<button type="button" class="jmc-d' + (parse(input.value) && parse(input.value).getFullYear() === a ? ' sel' : '') + '" data-year="' + a + '"' + (off ? ' disabled' : '') + '>' + a + '</button>'; }
          h += '</div>';
        }
        h += '<div class="jmc-f">' + (!birth && !out(today) ? '<button type="button" class="jmc-l" data-day="' + today + '">' + L[0] + '</button>' : '<span></span>') + (input.value ? '<button type="button" class="jmc-l mu" data-clear>' + L[1] + '</button>' : '<span></span>') + '</div>';
        pop.innerHTML = h;
        place();
      }
      function set(v) {
        input.value = v;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        paintBtn();
      }
      pop.addEventListener('click', function (ev) {
        var t = ev.target.closest('button'); if (!t || t.disabled) return;
        if (t.hasAttribute('data-nav')) { var s = Number(t.getAttribute('data-nav')); var y = cur.getFullYear(), m = cur.getMonth(); cur = view === 'days' ? new Date(y, m + s, 1) : view === 'months' ? new Date(y + s, m, 1) : new Date(y + 12 * s, m, 1); render(); }
        else if (t.hasAttribute('data-title')) { view = view === 'days' ? 'months' : view === 'months' ? 'years' : 'days'; render(); }
        else if (t.hasAttribute('data-year')) { cur = new Date(Number(t.getAttribute('data-year')), cur.getMonth(), 1); view = 'months'; render(); }
        else if (t.hasAttribute('data-month')) { cur = new Date(cur.getFullYear(), Number(t.getAttribute('data-month')), 1); view = 'days'; render(); }
        else if (t.hasAttribute('data-day')) { set(t.getAttribute('data-day')); close(); btn.focus(); }
        else if (t.hasAttribute('data-clear')) { set(''); close(); btn.focus(); }
      });
      function onDown(ev) { if (!pop.contains(ev.target) && !btn.contains(ev.target)) close(); }
      function onKey(ev) { if (ev.key === 'Escape') { close(); btn.focus(); } }
      function onMove(ev) { if (ev.target && pop.contains(ev.target)) return; place(); }
      function close() {
        pop.remove(); btn.classList.remove('on'); btn.setAttribute('aria-expanded', 'false');
        document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown);
        document.removeEventListener('keydown', onKey); window.removeEventListener('scroll', onMove, true); window.removeEventListener('resize', onMove);
        if (open && open.pop === pop) open = null;
      }
      document.addEventListener('mousedown', onDown); document.addEventListener('touchstart', onDown, { passive: true });
      document.addEventListener('keydown', onKey); window.addEventListener('scroll', onMove, true); window.addEventListener('resize', onMove);
      open = { close: close, pop: pop };
      render();
      var f = pop.querySelector('.jmc-d.sel') || pop.querySelector('.jmc-d.td') || pop.querySelector('.jmc-ti');
      if (f) f.focus({ preventScroll: true });
    }
    btn.addEventListener('click', function () { if (open && btn.classList.contains('on')) open.close(); else show(); });
  }

  function scan(root) { (root || document).querySelectorAll('input[type="date"], input[data-date]').forEach(enhance); }
  window.jmCalendar = { enhance: enhance, scan: scan };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { scan(); });
  else scan();
})();
