/* =========================================================
   LOU TCHAPPÉ — script.js
   ========================================================= */

var CONFIG = {
  API_KEY: '$2a$10$aULdtLYQzrRZ6f7c/SMLjOUDoWnF142XoYjYl9jgdoqCKAf4hPoaa',
  BIN_ID: '6a441993da38895dfe17d492',
  BASE_URL: 'https://api.jsonbin.io/v3/b'
};

var ORDINE_CATEGORIE_PIATTI = ['Antipasto', 'Primo', 'Secondo', 'Contorno', 'Dessert', 'Speciale'];

/* Lingua attiva nelle proposte — default italiano */
var linguaProposte = 'it';
var proposteGlobali = [];

/* ---------------------------------------------------------
   BOTTONE FISSO PROPOSTE
   --------------------------------------------------------- */
function inizializzaHintBtn() {
  var btn = document.createElement('button');
  btn.className = 'hint-btn';
  btn.setAttribute('aria-label', 'Vai alle proposte del giorno');
  btn.innerHTML = '🍽️ Proposte del Giorno <span class="hint-btn__freccia">→</span>';
  document.body.appendChild(btn);
  btn.addEventListener('click', function () {
    var tabProposte = document.querySelector('[data-tab="proposte"]');
    if (tabProposte) tabProposte.click();
  });
  return btn;
}

/* ---------------------------------------------------------
   TABS E SLIDER
   --------------------------------------------------------- */
function inizializzaTabs(hintBtn) {
  var tabs = document.querySelectorAll('.tabs__btn');
  var slider = document.getElementById('slider');
  if (!tabs.length || !slider) return;

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = this.dataset.tab;
      tabs.forEach(function (t) {
        t.classList.remove('tabs__btn--active');
        t.setAttribute('aria-selected', 'false');
      });
      this.classList.add('tabs__btn--active');
      this.setAttribute('aria-selected', 'true');
      if (target === 'proposte') {
        slider.classList.add('slider--proposte');
        if (hintBtn) hintBtn.classList.add('nascosto');
      } else {
        slider.classList.remove('slider--proposte');
        if (hintBtn) hintBtn.classList.remove('nascosto');
      }
    });
  });

  var touchStartX = 0;
  var touchStartY = 0;
  slider.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });
  slider.addEventListener('touchend', function (e) {
    var deltaX = e.changedTouches[0].screenX - touchStartX;
    var deltaY = Math.abs(e.changedTouches[0].screenY - touchStartY);
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > deltaY * 1.5) {
      var attivo = slider.classList.contains('slider--proposte');
      if (deltaX < 0 && !attivo) { tabs[1].click(); }
      else if (deltaX > 0 && attivo) { tabs[0].click(); }
    }
  }, { passive: true });
}

/* ---------------------------------------------------------
   DATA DI OGGI
   --------------------------------------------------------- */
function mostraData() {
  var el = document.getElementById('data-oggi');
  if (!el) return;
  var oggi = new Date();
  el.textContent = oggi.toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

/* ---------------------------------------------------------
   CARICAMENTO DATI DA JSONBIN
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
    var record = data.record || {};
    proposteGlobali = record.proposte || [];
    renderProposte(proposteGlobali, linguaProposte);
  })
  .catch(function () {
    var lista = document.getElementById('proposte-lista');
    if (lista) lista.innerHTML = '<div class="proposte__vuoto"><p>⚠️</p><p>Impossibile caricare i dati.</p></div>';
  });
}

/* ---------------------------------------------------------
   BOTTONI LINGUA PROPOSTE
   --------------------------------------------------------- */
function inizializzaLinguaProposte() {
  var container = document.getElementById('proposte-lang');
  if (!container) return;

  container.addEventListener('click', function (e) {
    var btn = e.target.closest('.proposte-lang__btn');
    if (!btn) return;

    container.querySelectorAll('.proposte-lang__btn').forEach(function (b) {
      b.classList.remove('proposte-lang__btn--active');
    });
    btn.classList.add('proposte-lang__btn--active');
    linguaProposte = btn.dataset.lang;
    renderProposte(proposteGlobali, linguaProposte);
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
    return ORDINE_CATEGORIE_PIATTI.indexOf(a.categoria) - ORDINE_CATEGORIE_PIATTI.indexOf(b.categoria);
  });

  proposte.forEach(function (piatto) {
    /* Seleziona i campi nella lingua giusta */
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
      '<div class="piatto__descrizione">' + descrizione + '</div>';
    lista.appendChild(card);
  });
}

/* ---------------------------------------------------------
   ANIMAZIONI D'INGRESSO
   --------------------------------------------------------- */
function animaIngressoSequenziale() {
  var elementi = document.querySelectorAll('[data-animate]');
  elementi.forEach(function (elemento, indice) {
    window.setTimeout(function () {
      elemento.classList.add('is-visible');
    }, 150 + indice * 180);
  });
}

/* ---------------------------------------------------------
   PARALLASSE (solo desktop)
   --------------------------------------------------------- */
function attivaParallasse() {
  var supportaHover = window.matchMedia('(min-width: 900px) and (pointer: fine)').matches;
  var movimentoRidotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!supportaHover || movimentoRidotto) return;
  document.addEventListener('mousemove', function (e) {
    var px = (e.clientX / window.innerWidth - 0.5);
    var py = (e.clientY / window.innerHeight - 0.5);
    var lontane = document.querySelector('.hero__mountains--far');
    var vicine = document.querySelector('.hero__mountains--near');
    if (lontane) lontane.style.transform = 'translate(' + (px * 10) + 'px,' + (py * 4) + 'px)';
    if (vicine) vicine.style.transform = 'translate(' + (px * 18) + 'px,' + (py * 7) + 'px)';
  });
}

/* ---------------------------------------------------------
   FEEDBACK PULSANTE CTA
   --------------------------------------------------------- */
function aggiungiFeedbackPulsante() {
  var pulsante = document.getElementById('open-wine-list');
  if (!pulsante) return;
  pulsante.addEventListener('click', function () {
    pulsante.style.transform = 'translateY(-1px) scale(0.97)';
    window.setTimeout(function () { pulsante.style.transform = ''; }, 150);
  });
}

/* ---------------------------------------------------------
   INIT
   --------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function () {
  var hintBtn = inizializzaHintBtn();
  inizializzaTabs(hintBtn);
  inizializzaLinguaProposte();
  mostraData();
  caricaDati();
  animaIngressoSequenziale();
  attivaParallasse();
  aggiungiFeedbackPulsante();
});
