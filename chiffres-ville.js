/* Encart « Cette page dans Google » des pages de ville des pros (13/10/2026).
   Lit https://app.jasonmarinho.com/api/public/chiffres?page=<chemin> :
   recherches où la page sort en première page (place moyenne de Google
   Search Console sur 28 jours) et, au-delà du seuil, ses affichages, clics et
   visiteurs. Rien à montrer pour la page : les chiffres de tout le site.
   Demandes d'hôtes de la ville du métier (17/10/2026), zéro compris. */
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
      var c = d.city, html = '', rk = d.rank;
      var metier = /^\/menage-/.test(path) ? 'menage' : /^\/depannage-/.test(path) ? 'depannage' : 'photographe';
      // Place de la page elle-même (18/10/2026) : Google ne nomme pas les recherches rares
      if (rk && !(c && c.queries && c.queries.length)) {
        html += '<p class="cv-lead">Sur Google, cette page sort en première page :</p><ul class="cv-q"><li><span class="cv-place' + (rk.place <= 3 ? ' top' : '') + '">' + pf.format(rk.place) + '</span><span>Place moyenne de la page' + (rk.query ? ', par exemple sur « ' + esc(rk.query) + ' »' : '') + '<small>' + n(rk.impressions) + ' affichages sur 28 jours</small></span></li></ul>';
      }
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
        // Pas encore de chiffres pour la page : le titre le dit (27/10/2026,
        // « Cette page dans Google » au-dessus des chiffres de tout le site).
        var hb = box.querySelector('.cv-h b'), hp = box.querySelector('.cv-h p');
        if (hb) hb.textContent = 'Le site dans Google';
        if (hp && hp.firstChild && hp.firstChild.nodeType === 3) hp.firstChild.nodeValue = 'Chiffres réels de Google Search Console, mis à jour chaque jour. Pas encore assez de données pour cette page seule : voici celles de tout le site. ';
        html = '<p class="cv-lead">Sur tout le site, ces 28 derniers jours :</p><div class="cv-t"><span><b>' + n(d.site.impressions) + '</b> affichages Google</span><span><b>' + n(d.site.clicks) + '</b> clics</span>' + (d.site.visitors ? '<span><b>' + n(d.site.visitors) + '</b> visiteurs</span>' : '') + '</div>';
      }
      // Demandes d'hôtes mises en valeur dans l'encart (14/11/2026, Jason : « mets les
      // demandes en avant sur les pages de ville », pas dans l'en-tête) : la ville pour
      // ce métier, zéro compris, puis le total du site et la dernière demande
      // (métier, ville et mois seulement). Dépannage compté pour lui-même (avant : photographes).
      if (html && d.demandes) {
        var UN = { photographe: 'un photographe ou vidéaste', menage: 'une équipe de ménage', depannage: 'un pro du dépannage' };
        var MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
        var mois = function (m) { var p = String(m || '').split('-'); return p.length === 2 ? MOIS[+p[1] - 1] + ' ' + p[0] : ''; };
        var dm = d.demandes[metier] || 0, ds = d.demandesSite, L = ds && ds.last, slug = path.replace(/^\/(photographe|menage|depannage)-lcd-/, '');
        var sub = ds && ds.total ? n(ds.total) + ' demande' + (ds.total > 1 ? 's' : '') + ' d’hôtes sur tout le site depuis ' + esc(mois(ds.since)) + (L ? ', la dernière pour ' + esc(UN[L.metier] || 'un pro') + (L.slug ? ' à ' + esc(L.label) : '') + ' (' + esc(mois(L.month)) + ')' : '') : '';
        html += '<a class="cv-dm" href="/chiffres?ville=' + esc(slug) + '#ta-ville"><i class="ph-bold ph-paper-plane-tilt"></i><span><b>' + n(dm) + ' demande' + (dm > 1 ? 's' : '') + ' d’hôte' + (dm > 1 ? 's' : '') + '</b> pour ' + UN[metier] + ' dans cette ville' + (sub ? '<small>' + sub + '.</small>' : '') + '</span><i class="ph-bold ph-arrow-right go"></i></a>';
      }
      if (!html) return;
      out.innerHTML = html;
      box.hidden = false;
    })
    .catch(function () { /* rien à afficher */ });
})();
