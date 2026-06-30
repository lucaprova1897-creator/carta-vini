/* =========================================================
   LOU TCHAPPÉ — script.js
   Gestione tabs, slider, animazioni, caricamento proposte
   ========================================================= */

var CONFIG = {
  API_KEY: '$2a$10$aULdtLYQzrRZ6f7c/SMLjOUDoWnF142XoYjYl9jgdoqCKAf4hPoaa',
  BIN_ID: '6a441993da38895dfe17d492',
  BASE_URL: 'https://api.jsonbin.io/v3/b'
};

var ORDINE_CATEGORIE = ['Antipasto', 'Primo', 'Secondo', 'Contorno', 'Dessert', 'Speciale'];

/* ---------------------------------------------------------
   BOTTONE FISSO PROPOSTE
   --------------------------------------------------------- */
function inizializzaHintBtn() {
  // Crea il bottone e lo aggiunge alla pagina
  var btn = document.createElement('button');
  btn.className = 'hint-btn';
  btn.setAttribute('aria-label', 'Vai alle proposte del giorno');
  btn.innerHTML =
    '🍽️ Proposte del Giorno' +
    '<span class="hint-btn__freccia">→</span>';
  document.body.appendChild(btn);

  // Click: porta direttamente alle proposte
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

      // Aggiorna tab attivo
      tabs.forEach(function (t) {
        t.classList.remove('tabs__btn--active');
        t.setAttribute('aria-selected', 'false');
      });
      this.classList.add('tabs__btn--active');
      this.setAttribute('aria-selected', 'true');

      // Sposta slider
      if (target === 'proposte') {
        slider.classList.add('slider--proposte');
        // Nasconde il bottone quando si è sulle proposte
        if (hintBtn) hintBtn.classList.add('nascosto');
      } else {
        slider.classList.remove('slider--proposte');
        // Mostra di nuovo il bottone tornando alla carta vini
        if (hintBtn) hintBtn.classList.remove('nascosto');
      }
    });
  });

  /* Swipe touch */
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
   CARICAMENTO PROPOSTE DA JSONBIN
   --------------------------------------------------------- */
function caricaProposte() {
  var lista = document.getElementById('proposte-lista');
  var vuoto = document.getElementById('proposte-vuoto');
  if (!lista) return;

  fetch(CONFIG.BASE_URL + '/' + CONFIG.BIN_ID + '/latest', {
    headers: { 'X-Master-Key': CONFIG.API_KEY }
  })
  .then(function (res) {
    if (!res.ok) throw new Error('Errore ' + res.status);
    return res.json();
  })
  .then(function (data) {
    var proposte = (data.record && data.record.proposte) ? data.record.proposte : [];
    renderProposte(proposte, lista, vuoto);
  })
  .catch(function () {
    lista.innerHTML = '<div class="proposte__vuoto"><p>⚠️</p><p>Impossibile caricare le proposte. Riprova più tardi.</p></div>';
  });
}

function renderProposte(proposte, lista, vuoto) {
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
    var card = document.createElement('div');
    card.className = 'piatto';
    card.innerHTML =
      '<div class="piatto__top">' +
        '<span class="piatto__categoria">' + piatto.categoria + '</span>' +
        '<span class="piatto__prezzo">€ ' + Number(piatto.prezzo).toFixed(2) + '</span>' +
      '</div>' +
      '<div class="piatto__nome">' + piatto.nome + '</div>' +
      '<div class="piatto__descrizione">' + piatto.descrizione + '</div>';
    lista.appendChild(card);
  });
}

/* ---------------------------------------------------------
   ANIMAZIONI D'INGRESSO
   --------------------------------------------------------- */
function animaIngressoSequenziale() {
  var elementi = document.querySelectorAll('[data-animate]');
  var BASE_DELAY_MS = 150;
  var STEP_MS = 180;
  elementi.forEach(function (elemento, indice) {
    window.setTimeout(function () {
      elemento.classList.add('is-visible');
    }, BASE_DELAY_MS + indice * STEP_MS);
  });
}

/* ---------------------------------------------------------
   PARALLASSE LEGGERO (solo desktop)
   --------------------------------------------------------- */
function attivaParallasse() {
  var supportaHover = window.matchMedia('(min-width: 900px) and (pointer: fine)').matches;
  var movimentoRidotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!supportaHover || movimentoRidotto) return;
  var lontane = document.querySelector('.hero__mountains--far');
  var vicine = document.querySelector('.hero__mountains--near');
  if (!lontane || !vicine) return;
  document.addEventListener('mousemove', function (e) {
    var px = (e.clientX / window.innerWidth - 0.5);
    var py = (e.clientY / window.innerHeight - 0.5);
    lontane.style.transform = 'translate(' + (px * 10) + 'px,' + (py * 4) + 'px)';
    vicine.style.transform = 'translate(' + (px * 18) + 'px,' + (py * 7) + 'px)';
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
  mostraData();
  caricaProposte();
  animaIngressoSequenziale();
  attivaParallasse();
  aggiungiFeedbackPulsante();
});
