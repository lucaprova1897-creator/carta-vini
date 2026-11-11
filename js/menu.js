/* Lou Tchappé — menu pubblico (QR code)
 * Legge i piatti del giorno CONFERMATI dal gestionale, tramite la funzione
 * pubblica "menu-pubblico" su Supabase. Nessuna chiave qui dentro: la
 * funzione restituisce solo il menu, nient'altro.
 */
(function () {
  var API = 'https://shdzchwhymajnqhocirp.supabase.co/functions/v1/menu-pubblico';
  var WINE = 'https://cantina360.it/c/b403944e-895e-4dd6-8d46-fd5c207cfcda?lang=';
  var LOCALE = { it: 'it-IT', en: 'en-GB', fr: 'fr-FR' };

  var T = {
    it: {
      title: 'Proposte del giorno', loading: 'Un momento…',
      empty: 'Le proposte di oggi non sono ancora pronte.', emptyHint: 'Chiedi pure al personale di sala.',
      error: 'Non riusciamo a caricare il menu in questo momento.', errorHint: 'Chiedi al personale, o riprova tra poco.',
      wineTitle: 'La carta dei vini', wineText: 'Etichette valdostane e italiane, scelte in cantina.', wineBtn: 'Apri la carta dei vini',
      allergens: 'Allergie o intolleranze? Chiedi al nostro personale: ti indicheremo gli ingredienti di ogni piatto.',
    },
    en: {
      title: "Today's specials", loading: 'One moment…',
      empty: "Today's specials are not ready yet.", emptyHint: 'Please ask our staff.',
      error: "We can't load the menu right now.", errorHint: 'Please ask our staff, or try again shortly.',
      wineTitle: 'Wine list', wineText: 'Wines from the Aosta Valley and the rest of Italy, chosen in our cellar.', wineBtn: 'Open the wine list',
      allergens: 'Allergies or intolerances? Please ask our staff: we will tell you the ingredients of every dish.',
    },
    fr: {
      title: 'Suggestions du jour', loading: 'Un instant…',
      empty: 'Les suggestions du jour ne sont pas encore prêtes.', emptyHint: 'Demandez à notre personnel.',
      error: 'Impossible de charger le menu pour le moment.', errorHint: 'Demandez à notre personnel ou réessayez dans un instant.',
      wineTitle: 'La carte des vins', wineText: 'Vins de la Vallée d’Aoste et d’Italie, choisis dans notre cave.', wineBtn: 'Ouvrir la carte des vins',
      allergens: 'Allergies ou intolérances ? Demandez à notre personnel : nous vous indiquerons les ingrédients de chaque plat.',
    },
  };

  var data = null;
  var failed = false;
  var lang = pickLang();

  function pickLang() {
    try {
      var saved = localStorage.getItem('lt-lang');
      if (saved && T[saved]) return saved;
    } catch (e) { /* senza memoria del browser va bene lo stesso */ }
    var nav = (navigator.language || 'it').slice(0, 2).toLowerCase();
    return T[nav] ? nav : (nav === 'de' || nav === 'nl' ? 'en' : 'it');
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function price(p) {
    if (p == null || isNaN(p)) return '';
    var n = Number(p);
    return '€ ' + (n % 1 ? n.toFixed(2) : String(n)).replace('.', lang === 'en' ? '.' : ',');
  }

  function pick(obj) { return (obj && (obj[lang] || obj.it)) || ''; }

  function renderStatic() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-t]').forEach(function (el) {
      var k = el.getAttribute('data-t');
      if (T[lang][k]) el.textContent = T[lang][k];
    });
    document.querySelectorAll('.lang button').forEach(function (b) {
      var on = b.getAttribute('data-lang') === lang;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.getElementById('wine-link').href = WINE + lang;
    var d = data && data.data ? new Date(data.data + 'T12:00:00') : new Date();
    var label = d.toLocaleDateString(LOCALE[lang], { weekday: 'long', day: 'numeric', month: 'long' });
    document.getElementById('today-date').textContent = label.charAt(0).toUpperCase() + label.slice(1);
  }

  function renderDishes() {
    var box = document.getElementById('dishes');
    var t = T[lang];
    if (failed && !data) {
      box.innerHTML = '<div class="state"><p>' + esc(t.error) + '</p><p class="state-hint">' + esc(t.errorHint) + '</p></div>';
      return;
    }
    if (!data) { box.innerHTML = '<p class="state">' + esc(t.loading) + '</p>'; return; }
    var list = data.piatti || [];
    if (!list.length) {
      box.innerHTML = '<div class="state"><p>' + esc(t.empty) + '</p><p class="state-hint">' + esc(t.emptyHint) + '</p></div>';
      return;
    }
    var html = '';
    var current = null;
    list.forEach(function (p) {
      if (p.categoria !== current) {
        if (current !== null) html += '</ul></div>';
        current = p.categoria;
        html += '<div class="course"><h3>' + esc(pick(p.categoria_nome)) + '</h3><ul>';
      }
      var desc = pick(p.descrizione);
      html += '<li class="dish">' +
        '<div class="dish-line"><span class="dish-name">' + esc(pick(p.nome)) + '</span>' +
        (p.prezzo != null ? '<span class="dish-dots" aria-hidden="true"></span><span class="dish-price">' + esc(price(p.prezzo)) + '</span>' : '') +
        '</div>' +
        (desc ? '<p class="dish-desc">' + esc(desc) + '</p>' : '') +
        '</li>';
    });
    html += '</ul></div>';
    box.innerHTML = html;
  }

  function render() { renderStatic(); renderDishes(); }

  function load() {
    fetch(API, { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { data = d; failed = false; render(); })
      .catch(function () { failed = true; render(); });
  }

  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () {
      lang = b.getAttribute('data-lang');
      try { localStorage.setItem('lt-lang', lang); } catch (e) { /* ignora */ }
      render();
    });
  });

  render();
  load();
  // Se il cliente tiene la pagina aperta, si aggiorna da sola (es. piatto finito)
  setInterval(load, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) load(); });
})();
