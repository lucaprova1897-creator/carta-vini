/* =========================================================
   LOU TCHAPPÉ — script.js
   ========================================================= */

var CONFIG = {
  API_KEY: '$2a$10$aULdtLYQzrRZ6f7c/SMLjOUDoWnF142XoYjYl9jgdoqCKAf4hPoaa',
  BIN_ID: '6a441993da38895dfe17d492',
  BASE_URL: 'https://api.jsonbin.io/v3/b'
};

var ORDINE_CATEGORIE_PIATTI = ['Antipasto', 'Primo', 'Secondo', 'Contorno', 'Dessert', 'Speciale'];
var ORDINE_CATEGORIE_VINI = ['Bollicine', 'Bianchi', 'Rosati', 'Rossi'];

/* ---------------------------------------------------------
   NOTIFICA FERRAGOSTO
   --------------------------------------------------------- */
function inizializzaFerragosto() {
  var overlay = document.getElementById('ferragosto-overlay');
  var btnClose = document.getElementById('ferragosto-close');
  var img = document.getElementById('ferragosto-img');
  var imgBox = document.getElementById('ferragosto-img-box');
  var fullscreen = document.getElementById('ferragosto-fullscreen');
  var fullscreenImg = document.getElementById('ferragosto-fullscreen-img');
  var fullscreenClose = document.getElementById('ferragosto-fullscreen-close');
  var langBtns = document.querySelectorAll('.ferragosto-lang__btn');
  var riapriBtn = document.getElementById('ferragosto-btn');

  if (!overlay) return;

  /* Mostra il bottone di riapertura */
  function mostraBtnRiapri() {
    if (riapriBtn) {
      riapriBtn.style.display = 'block';
      window.setTimeout(function () {
        riapriBtn.classList.remove('nascosto');
      }, 50);
    }
  }

  /* Apri overlay */
  function apriOverlay() {
    overlay.style.opacity = '0';
    overlay.style.display = 'flex';
    window.setTimeout(function () {
      overlay.style.opacity = '1';
      overlay.style.transition = 'opacity 0.4s ease';
    }, 10);
    if (riapriBtn) riapriBtn.classList.add('nascosto');
  }

  /* Chiudi overlay */
  function chiudiOverlay() {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';
    window.setTimeout(function () {
      overlay.style.display = 'none';
      overlay.style.opacity = '';
      overlay.style.transition = '';
    }, 300);
    sessionStorage.setItem('ferragosto-visto', '1');
    mostraBtnRiapri();
  }

  /* Prima apertura automatica */
  if (!sessionStorage.getItem('ferragosto-visto')) {
    window.setTimeout(apriOverlay, 800);
  } else {
    mostraBtnRiapri();
  }

  /* Bottone riapertura */
  if (riapriBtn) {
    riapriBtn.addEventListener('click', apriOverlay);
  }

  /* Chiudi con X */
  btnClose.addEventListener('click', chiudiOverlay);

  /* Chiudi cliccando fuori dalla card */
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) chiudiOverlay();
  });

  /* Nascondi bottone quando si va sulle proposte, rimostra tornando ai vini */
  var tabProposte = document.querySelector('[data-tab="proposte"]');
  var tabVini = document.querySelector('[data-tab="vini"]');
  if (tabProposte && riapriBtn) {
    tabProposte.addEventListener('click', function () {
      riapriBtn.classList.add('nascosto');
    });
  }
  if (tabVini && riapriBtn) {
    tabVini.addEventListener('click', function () {
      if (!overlay.style.display || overlay.style.display === 'none') {
        riapriBtn.classList.remove('nascosto');
      }
    });
  }

  /* Switch lingua ITA/ENG */
  langBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      langBtns.forEach(function (b) { b.classList.remove('ferragosto-lang__btn--active'); });
      this.classList.add('ferragosto-lang__btn--active');
      var src = this.dataset.lang === 'ita' ? 'ferragosto_ita.jpg' : 'ferragosto_ing.jpg';
      img.src = src;
      fullscreenImg.src = src;
    });
  });

  /* Apri immagine a schermo intero */
  imgBox.addEventListener('click', function () {
    fullscreen.style.display = 'flex';
  });

  /* Chiudi schermo intero */
  fullscreenClose.addEventListener('click', function () {
    fullscreen.style.display = 'none';
  });

  fullscreen.addEventListener('click', function (e) {
    if (e.target === fullscreen) fullscreen.style.display = 'none';
  });
}

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
    renderProposte(record.proposte || []);
    renderViniCalice(record.vini || []);
  })
  .catch(function () {
    var lista = document.getElementById('proposte-lista');
    if (lista) lista.innerHTML = '<div class="proposte__vuoto"><p>⚠️</p><p>Impossibile caricare i dati.</p></div>';
    var caliceVuoto = document.getElementById('calice-vuoto');
    if (caliceVuoto) caliceVuoto.style.display = 'block';
    var caliceLista = document.getElementById('calice-lista');
    if (caliceLista) caliceLista.innerHTML = '';
  });
}

/* ---------------------------------------------------------
   RENDER PROPOSTE
   --------------------------------------------------------- */
function renderProposte(proposte) {
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
   RENDER VINI AL CALICE
   --------------------------------------------------------- */
function renderViniCalice(vini) {
  var lista = document.getElementById('calice-lista');
  var vuoto = document.getElementById('calice-vuoto');
  if (!lista) return;

  lista.innerHTML = '';

  if (!vini || vini.length === 0) {
    lista.style.display = 'none';
    if (vuoto) vuoto.style.display = 'block';
    return;
  }

  if (vuoto) vuoto.style.display = 'none';
  lista.style.flexDirection = 'column';
  lista.style.gap = '1rem';

  ORDINE_CATEGORIE_VINI.forEach(function (categoria) {
    var gruppo = vini.filter(function (v) { return v.categoria === categoria; });
    if (gruppo.length === 0) return;

    var gruppoEl = document.createElement('div');
    gruppoEl.className = 'calice__gruppo';

    var catEl = document.createElement('div');
    catEl.className = 'calice__categoria';
    catEl.textContent = categoria;
    gruppoEl.appendChild(catEl);

    gruppo.forEach(function (vino) {
      var vinoEl = document.createElement('div');
      vinoEl.className = 'calice__vino';
      vinoEl.innerHTML =
        '<div class="calice__vino-info">' +
          '<div class="calice__vino-produttore">' +
            vino.produttore +
            (vino.regione ? ' <span class="calice__vino-regione">· ' + vino.regione + '</span>' : '') +
          '</div>' +
          '<div class="calice__vino-tipo">' + vino.tipologia + '</div>' +
          '<div class="calice__vino-nome">' + vino.nome + '</div>' +
          (vino.vitigno ? '<div class="calice__vino-vitigno">' + vino.vitigno + '</div>' : '') +
          (vino.descrizione ? '<div class="calice__vino-descrizione">' + vino.descrizione + '</div>' : '') +
        '</div>' +
        '<div class="calice__vino-prezzo">€ ' + Number(vino.prezzo).toFixed(2) + '</div>';
      gruppoEl.appendChild(vinoEl);
    });

    lista.appendChild(gruppoEl);
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
  inizializzaFerragosto();
  var hintBtn = inizializzaHintBtn();
  inizializzaTabs(hintBtn);
  mostraData();
  caricaDati();
  animaIngressoSequenziale();
  attivaParallasse();
  aggiungiFeedbackPulsante();
});
