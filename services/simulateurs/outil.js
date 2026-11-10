/* Outils communs des simulateurs du site (revenus, prix, comparer des villes),
   10/11/2026. Charger après /services/simulateurs/engine.js et avant
   /suggestions.js (tous en defer, dans cet ordre).
   - JMOutil.cityField(input, onPick) : champ ville où l'on écrit, liste du site
     (pays, prix moyen, occupation), noms en français, ville absente = moyenne France
   - JMOutil.fit() : les menus et champs des phrases prennent la largeur du texte
   - JMOutil.eur(n) : « 12 345 € » avec espaces insécables (la police Fraunces
     n'a pas l'espace fine) */
(function () {
  if (window.JMOutil) return
  var COUNTRIES = { FR: 'France', PT: 'Portugal', ES: 'Espagne', IT: 'Italie', BE: 'Belgique', DE: 'Allemagne', NL: 'Pays-Bas', AT: 'Autriche', CH: 'Suisse' }
  // Noms en français des villes étrangères (le moteur garde les noms locaux)
  var FR_NAME = { Lisboa: 'Lisbonne', 'Évora': 'Evora', Barcelona: 'Barcelone', Sevilla: 'Séville', Valencia: 'Valence', 'Málaga': 'Malaga', 'San Sebastián': 'Saint-Sébastien', Roma: 'Rome', Milano: 'Milan', Firenze: 'Florence', Venezia: 'Venise', Napoli: 'Naples', Torino: 'Turin', Bologna: 'Bologne', Verona: 'Vérone', Palermo: 'Palerme', Brugge: 'Bruges', Gent: 'Gand', Antwerpen: 'Anvers', 'München': 'Munich', Hamburg: 'Hambourg', 'Köln': 'Cologne', 'Frankfurt am Main': 'Francfort', 'Den Haag': 'La Haye', Wien: 'Vienne', Salzburg: 'Salzbourg', 'Zürich': 'Zurich', Bern: 'Berne' }
  var LIST_ID = 'jm-dl-villes'

  function key (s) { return String(s || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') }
  function shown (ville) { return FR_NAME[ville] || ville }
  function eur (n) { return Math.round(n).toLocaleString('fr-FR').replace(/[  ]/g, ' ') + ' €' }
  function J () { return window.JMCalc }

  var BY = null
  function index () {
    if (BY) return BY
    BY = {}
    Object.keys(COUNTRIES).forEach(function (p) {
      J().citiesByCountry(p).forEach(function (c) { BY[key(c.ville)] = BY[key(shown(c.ville))] = { pays: p, ville: c.ville } })
    })
    return BY
  }
  /** Ville du moteur pour un nom tapé (exact, puis début du nom), sinon null */
  function find (raw) {
    var k = key(raw), by = index()
    if (!k) return null
    if (by[k]) return by[k]
    var n = Object.keys(by).filter(function (x) { return x.indexOf(k) === 0 })[0]
    return n ? by[n] : null
  }

  function ensureList () {
    if (document.getElementById(LIST_ID)) return
    var html = ''
    Object.keys(COUNTRIES).forEach(function (p) {
      J().citiesByCountry(p).forEach(function (c) {
        html += '<option value="' + shown(c.ville) + '" data-sub="' + COUNTRIES[p] + ', ' + c.adr + ' € la nuit, ' + c.occ + ' % d\'occupation"></option>'
      })
    })
    var dl = document.createElement('datalist')
    dl.id = LIST_ID
    dl.innerHTML = html
    document.body.appendChild(dl)
  }

  // Les menus et champs des phrases prennent la largeur du choix affiché
  var ruler = null
  function fit (root) {
    if (!ruler) { ruler = document.createElement('span'); ruler.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;left:-9999px;top:0'; document.body.appendChild(ruler) }
    Array.prototype.forEach.call((root || document).querySelectorAll('.pill select, .pill input[type=text]'), function (el) {
      var cs = getComputedStyle(el)
      ruler.style.font = cs.font
      ruler.style.fontStyle = cs.fontStyle
      ruler.textContent = el.tagName === 'INPUT' ? (el.value || el.placeholder) + ' ' : (el.options[el.selectedIndex] ? el.options[el.selectedIndex].text : '')
      el.style.width = Math.ceil(ruler.getBoundingClientRect().width + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + 4) + 'px'
    })
  }

  /**
   * Champ ville. onPick({ pays, ville, connue }) à chaque choix.
   * Renvoie { set(pays, ville) } pour fixer la ville affichée sans appeler onPick.
   */
  function cityField (input, onPick) {
    ensureList()
    var cur = { pays: 'FR', ville: 'Paris' }
    input.setAttribute('list', LIST_ID)
    input.setAttribute('data-suggest', 'ville')
    input.setAttribute('data-suggest-fresh', '')
    input.setAttribute('data-suggest-found', 'Villes avec leurs chiffres')
    input.setAttribute('data-suggest-none', 'Pas encore de chiffres pour cette ville : moyenne de la France')
    input.setAttribute('autocomplete', 'off')
    input.setAttribute('spellcheck', 'false')
    input.setAttribute('enterkeyhint', 'done')
    if (window.jmSuggest) window.jmSuggest.enhance(input)

    function set (pays, ville) { cur = { pays: pays, ville: ville }; input.value = shown(ville); fit(input.parentNode) }
    function pick () {
      var raw = input.value.trim()
      if (!raw) { input.value = shown(cur.ville); fit(input.parentNode); return }
      var hit = find(raw)
      if (hit) set(hit.pays, hit.ville)
      else set('FR', raw.charAt(0).toUpperCase() + raw.slice(1))
      onPick({ pays: cur.pays, ville: cur.ville, connue: !!hit })
      // Choix fait : on quitte le champ (le prochain clic resélectionne tout)
      if (document.activeElement === input) input.blur()
    }
    var justFocused = false
    input.addEventListener('change', pick)
    input.addEventListener('input', function () { fit(input.parentNode) })
    // Un clic sélectionne tout : on écrit directement par-dessus la ville affichée
    input.addEventListener('focus', function () { justFocused = true; try { input.select() } catch (e) {} })
    input.addEventListener('mouseup', function (e) { if (justFocused) e.preventDefault(); justFocused = false })
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); input.blur() } })
    return { set: set, get: function () { return cur } }
  }

  window.JMOutil = { COUNTRIES: COUNTRIES, shown: shown, find: find, eur: eur, fit: fit, cityField: cityField }
  window.addEventListener('resize', function () { fit() })
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fit() })
})()
