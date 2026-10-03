/* =========================================================
   LOU TCHAPPÉ — script.js
   Pagina unica: carta vini + proposte del giorno
   ========================================================= */

var CONFIG = {
  API_KEY: '$2a$10$aULdtLYQzrRZ6f7c/SMLjOUDoWnF142XoYjYl9jgdoqCKAf4hPoaa',
  BIN_ID: '6a441993da38895dfe17d492',
  BASE_URL: 'https://api.jsonbin.io/v3/b'
};

var ORDINE_CATEGORIE = ['Antipasto', 'Primo', 'Secondo', 'Contorno', 'Dessert', 'Speciale'];

var linguaAttiva = 'it';
var proposteGlobali = [];

/* ---------------------------------------------------------
   DATA DI OGGI
   --------------------------------------------------------- */
function mostraData() {
  var el = document.getElementById('data-oggi');
  if (!el) return;
  var oggi = new Date();
  var locale = linguaAttiva === 'fr' ? 'fr-FR' : linguaAttiva === 'en' ? 'en-GB' : 'it-IT';
  el.textContent = oggi.toLocaleDateString(locale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

/* ---------------------------------------------------------
   BOTTONI LINGUA
   --------------------------------------------------------- */
function inizializzaLingua() {
  var container = document.getElementById('proposte-lang');
  if (!container) return;

  container.addEventListener('click', function (e) {
    var btn = e.target.closest('.proposte-lang__btn');
    if (!btn) return;

    container.querySelectorAll('.proposte-lang__btn').forEach(function (b) {
      b.classList.remove('proposte-lang__btn--active');
    });
    btn.classList.add('proposte-lang__btn--active');
    linguaAttiva = btn.dataset.lang;

    /* Aggiorna data nella lingua giusta */
    mostraData();

    /* Aggiorna titolo sezione */
    var titolo = document.getElementById('proposte-titolo');
    if (titolo) {
      titolo.textContent = linguaAttiva === 'fr' ? 'Plats du Jour'
                         : linguaAttiva === 'en' ? 'Daily Specials'
                         : 'Proposte del Giorno';
    }

    renderProposte(proposteGlobali, linguaAttiva);
  });
}

/* ---------------------------------------------------------
   CARICAMENTO DATI
   --------------------------------------------------------- */
function caricaDati() {
  fetch(CONFIG.BASE_URL + '/' + CONFIG.BIN_ID + '/latest', {
    headers: { 'X-Master-Key': CONFIG.API_KEY }
  })
  .then(function (res) {
    if (!res.ok) throw new Error('Errore ' + res.status);
    return res.json();
  })
  .then(function (data) {
    proposteGlobali = (data.record && data.record.proposte) ? data.record.proposte : [];
    renderProposte(proposteGlobali, linguaAttiva);
  })
  .catch(function () {
    var lista = document.getElementById('proposte-lista');
    if (lista) lista.innerHTML = '<div class="proposte__vuoto"><p>⚠️</p><p>Impossibile caricare i dati.</p></div>';
  });
}

/* ---------------------------------------------------------
   RENDER PROPOSTE
   --------------------------------------------------------- */
function renderProposte(proposte, lingua) {
  var lista = document.getElementById('proposte-lista');
  var vuoto = document.getElementById('proposte-vuoto');
  if (!lista) return;

  lista.innerHTML = '';

  if (!proposte || proposte.length === 0) {
    lista.style.display = 'none';
    if (vuoto) vuoto.style.display = 'block';
    return;
  }

  if (vuoto) vuoto.style.display = 'none';
  lista.style.display = 'flex';

  proposte.sort(function (a, b) {
    return ORDINE_CATEGORIE.indexOf(a.categoria) - ORDINE_CATEGORIE.indexOf(b.categoria);
  });

  proposte.forEach(function (piatto) {
    var nome = lingua === 'fr' ? (piatto.nome_fr || piatto.nome || '')
             : lingua === 'en' ? (piatto.nome_en || piatto.nome || '')
             : (piatto.nome || '');
    var descrizione = lingua === 'fr' ? (piatto.descrizione_fr || piatto.descrizione || '')
                    : lingua === 'en' ? (piatto.descrizione_en || piatto.descrizione || '')
                    : (piatto.descrizione || '');
    var categoria = lingua === 'fr' ? (piatto.categoria_fr || piatto.categoria || '')
                  : lingua === 'en' ? (piatto.categoria_en || piatto.categoria || '')
                  : (piatto.categoria || '');

    var card = document.createElement('div');
    card.className = 'piatto';
    card.innerHTML =
      '<div class="piatto__top">' +
        '<span class="piatto__categoria">' + categoria + '</span>' +
        '<span class="piatto__prezzo">€ ' + Number(piatto.prezzo).toFixed(2) + '</span>' +
      '</div>' +
      '<div class="piatto__nome">' + nome + '</div>' +
      (descrizione ? '<div class="piatto__descrizione">' + descrizione + '</div>' : '');
    lista.appendChild(card);
  });
}

/* ---------------------------------------------------------
   ANIMAZIONI
   --------------------------------------------------------- */
function animaIngresso() {
  var elementi = document.querySelectorAll('[data-animate]');
  elementi.forEach(function (el, i) {
    window.setTimeout(function () {
      el.classList.add('is-visible');
    }, 150 + i * 180);
  });
}

/* ---------------------------------------------------------
   INIT
   --------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function () {
  mostraData();
  inizializzaLingua();
  caricaDati();
  animaIngresso();
});
