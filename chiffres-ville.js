/* Encart « Cette page dans Google » des pages de ville des pros (13/10/2026).
   Lit https://app.jasonmarinho.com/api/public/chiffres?page=<chemin> :
   recherches où la page sort en première page (place moyenne de Google
   Search Console sur 28 jours) et, au-delà du seuil, ses affichages, clics et
   visiteurs. Rien à montrer pour la page : les chiffres de tout le site. */
(function () {
  var box = document.querySelector('[data-chiffres-ville]');
  if (!box || box.getAttribute('data-done')) return;
  box.setAttribute('data-done', '1');
  var path = location.pathname.replace(/\/+$/, '');
  var nf = new Intl.NumberFormat('fr-FR');
  var pf = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var n = function (x) { return nf.format(Math.round(x)); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var out = box.querySelector('[data-cv-body]');
  fetch('https://app.jasonmarinho.com/api/public/chiffres?page=' + encodeURIComponent(path))
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (d) {
      var c = d.city, html = '';
      if (c && c.queries && c.queries.length) {
        html += '<p class="cv-lead">Sur Google, cette page sort en première page pour :</p><ul class="cv-q">' +
          c.queries.slice(0, 4).map(function (q) {
            return '<li><span class="cv-place' + (q.place <= 3 ? ' top' : '') + '">' + pf.format(q.place) + '</span><span>« ' + esc(q.q) + ' »<small>' + n(q.impressions) + ' affichages sur 28 jours</small></span></li>';
          }).join('') + '</ul>';
      }
      if (c && c.totals) {
        html += '<div class="cv-t"><span><b>' + n(c.totals.impressions) + '</b> affichages Google</span><span><b>' + n(c.totals.clicks) + '</b> clics</span><span><b>' + n(c.totals.visitors) + '</b> visiteurs</span></div><p class="cv-note">Cette page sur les 28 derniers jours (30 pour les visiteurs).</p>';
      }
      if (!html && d.site) {
        html = '<p class="cv-lead">Sur tout le site, ces 28 derniers jours :</p><div class="cv-t"><span><b>' + n(d.site.impressions) + '</b> affichages Google</span><span><b>' + n(d.site.clicks) + '</b> clics</span>' + (d.site.visitors ? '<span><b>' + n(d.site.visitors) + '</b> visiteurs</span>' : '') + '</div>';
      }
      if (!html) return;
      out.innerHTML = html;
      box.hidden = false;
    })
    .catch(function () { /* rien à afficher */ });
})();
