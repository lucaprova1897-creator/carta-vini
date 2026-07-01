/* =========================================================
   LOU TCHAPPÉ — admin.js
   Gestione piatti del giorno + vini al calice
   ========================================================= */

var CONFIG = {
  PASSWORD: 'LouTchappe26',
  API_KEY: '$2a$10$aULdtLYQzrRZ6f7c/SMLjOUDoWnF142XoYjYl9jgdoqCKAf4hPoaa',
  BIN_ID: '6a441993da38895dfe17d492',
  BASE_URL: 'https://api.jsonbin.io/v3/b'
};

var ORDINE_PIATTI = ['Antipasto', 'Primo', 'Secondo', 'Contorno', 'Dessert', 'Speciale'];
var ORDINE_VINI = ['Bollicine', 'Bianchi', 'Rosati', 'Rossi'];

var stato = {
  proposte: [],
  vini: [],
  modificandoPiattoId: null,
  modificandoVinoId: null
};

/* ---------------------------------------------------------
   LOGIN
   --------------------------------------------------------- */
function inizializzaLogin() {
  var btnLogin = document.getElementById('login-btn');
  var inputPwd = document.getElementById('password-input');
  var errore = document.getElementById('login-errore');

  function tentaLogin() {
    if (inputPwd.value === CONFIG.PASSWORD) {
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('admin-panel').style.display = 'block';
      inizializzaAdmin();
    } else {
      errore.style.display = 'block';
      inputPwd.value = '';
      inputPwd.focus();
    }
  }

  btnLogin.addEventListener('click', tentaLogin);
  inputPwd.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') tentaLogin();
  });

  document.getElementById('logout-btn').addEventListener('click', function () {
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('password-input').value = '';
  });
}

/* ---------------------------------------------------------
   INIT ADMIN
   --------------------------------------------------------- */
function inizializzaAdmin() {
  var dataEl = document.getElementById('admin-data');
  if (dataEl) {
    var oggi = new Date();
    dataEl.textContent = oggi.toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
  }

  inizializzaTabAdmin();
  caricaDati();
  inizializzaFormPiatti();
  inizializzaFormVini();
}

/* ---------------------------------------------------------
   TAB ADMIN (Piatti / Vini)
   --------------------------------------------------------- */
function inizializzaTabAdmin() {
  var tabs = document.querySelectorAll('.admin__tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('admin__tab--active'); });
      this.classList.add('admin__tab--active');
      var section = this.dataset.section;
      document.getElementById('section-piatti').style.display = section === 'piatti' ? 'block' : 'none';
      document.getElementById('section-vini').style.display = section === 'vini' ? 'block' : 'none';
    });
  });
}

/* ---------------------------------------------------------
   CARICA DATI DA JSONBIN
   --------------------------------------------------------- */
function caricaDati() {
  fetch(CONFIG.BASE_URL + '/' + CONFIG.BIN_ID + '/latest', {
    headers: { 'X-Master-Key': CONFIG.API_KEY }
  })
  .then(function (res) {
    if (!res.ok) throw new Error('Errore');
    return res.json();
  })
  .then(function (data) {
    var record = data.record || {};
    stato.proposte = record.proposte || [];
    stato.vini = record.vini || [];
    renderListaPiatti();
    renderListaVini();
  })
  .catch(function () {
    document.getElementById('admin-lista-piatti').innerHTML =
      '<p class="admin__vuoto">⚠️ Errore di connessione. Riprova.</p>';
    document.getElementById('admin-lista-vini').innerHTML =
      '<p class="admin__vuoto">⚠️ Errore di connessione. Riprova.</p>';
  });
}

/* ---------------------------------------------------------
   SALVA REMOTO
   --------------------------------------------------------- */
function salvaRemoto() {
  return fetch(CONFIG.BASE_URL + '/' + CONFIG.BIN_ID, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': CONFIG.API_KEY
    },
    body: JSON.stringify({
      proposte: stato.proposte,
      vini: stato.vini
    })
  }).then(function (res) {
    if (!res.ok) throw new Error('Errore ' + res.status);
    return res.json();
  });
}

/* =========================================================
   PIATTI DEL GIORNO
   ========================================================= */

function inizializzaFormPiatti() {
  document.getElementById('btn-salva-piatto').addEventListener('click', salvaPiatto);
  document.getElementById('btn-annulla-piatto').addEventListener('click', function () {
    resetFormPiatti();
  });
  document.getElementById('btn-svuota-piatti').addEventListener('click', function () {
    if (confirm('Eliminare tutti i piatti di oggi?')) {
      stato.proposte = [];
      salvaRemoto().then(function () {
        renderListaPiatti();
        mostraFeedback('feedback-piatti', 'Tutti i piatti eliminati', 'ok');
      });
    }
  });
}

function salvaPiatto() {
  var categoria = document.getElementById('input-categoria').value.trim();
  var nome = document.getElementById('input-nome-piatto').value.trim();
  var descrizione = document.getElementById('input-descrizione-piatto').value.trim();
  var prezzo = parseFloat(document.getElementById('input-prezzo-piatto').value);

  if (!nome) { mostraFeedback('feedback-piatti', 'Inserisci il nome del piatto', 'err'); return; }
  if (isNaN(prezzo) || prezzo < 0) { mostraFeedback('feedback-piatti', 'Inserisci un prezzo valido', 'err'); return; }

  var eraModifica = stato.modificandoPiattoId !== null;

  if (eraModifica) {
    stato.proposte = stato.proposte.map(function (p) {
      if (p.id === stato.modificandoPiattoId) {
        return { id: p.id, categoria: categoria, nome: nome, descrizione: descrizione, prezzo: prezzo };
      }
      return p;
    });
  } else {
    stato.proposte.push({ id: Date.now(), categoria: categoria, nome: nome, descrizione: descrizione, prezzo: prezzo });
  }

  salvaRemoto().then(function () {
    renderListaPiatti();
    resetFormPiatti();
    mostraFeedback('feedback-piatti', eraModifica ? 'Piatto aggiornato ✓' : 'Piatto aggiunto ✓', 'ok');
  }).catch(function () {
    mostraFeedback('feedback-piatti', 'Errore di salvataggio. Riprova.', 'err');
  });
}

function renderListaPiatti() {
  var listaEl = document.getElementById('admin-lista-piatti');
  listaEl.innerHTML = '';

  if (stato.proposte.length === 0) {
    listaEl.innerHTML = '<p class="admin__vuoto">Nessun piatto aggiunto.<br>Usa il form qui sopra.</p>';
    return;
  }

  var ordinate = stato.proposte.slice().sort(function (a, b) {
    return ORDINE_PIATTI.indexOf(a.categoria) - ORDINE_PIATTI.indexOf(b.categoria);
  });

  ordinate.forEach(function (piatto) {
    var card = document.createElement('div');
    card.className = 'admin__piatto';
    card.innerHTML =
      '<div class="admin__piatto-info">' +
        '<div class="admin__piatto-cat">' + piatto.categoria + '</div>' +
        '<div class="admin__piatto-nome">' + piatto.nome + '</div>' +
        '<div class="admin__piatto-desc">' + piatto.descrizione + '</div>' +
        '<div class="admin__piatto-prezzo">€ ' + Number(piatto.prezzo).toFixed(2) + '</div>' +
      '</div>' +
      '<div class="admin__piatto-azioni">' +
        '<button class="admin__piatto-btn admin__piatto-btn--modifica" title="Modifica">✏️</button>' +
        '<button class="admin__piatto-btn admin__piatto-btn--elimina" title="Elimina">🗑️</button>' +
      '</div>';

    card.querySelector('.admin__piatto-btn--modifica').addEventListener('click', function () {
      modificaPiatto(piatto.id);
    });
    card.querySelector('.admin__piatto-btn--elimina').addEventListener('click', function () {
      eliminaPiatto(piatto.id);
    });

    listaEl.appendChild(card);
  });
}

function modificaPiatto(id) {
  var piatto = stato.proposte.find(function (p) { return p.id === id; });
  if (!piatto) return;
  stato.modificandoPiattoId = id;
  document.getElementById('input-categoria').value = piatto.categoria;
  document.getElementById('input-nome-piatto').value = piatto.nome;
  document.getElementById('input-descrizione-piatto').value = piatto.descrizione;
  document.getElementById('input-prezzo-piatto').value = piatto.prezzo;
  document.getElementById('form-titolo-piatti').textContent = 'Modifica Piatto';
  document.getElementById('btn-annulla-piatto').style.display = 'block';
  document.getElementById('form-box-piatti').scrollIntoView({ behavior: 'smooth' });
}

function eliminaPiatto(id) {
  stato.proposte = stato.proposte.filter(function (p) { return p.id !== id; });
  salvaRemoto().then(function () {
    renderListaPiatti();
    mostraFeedback('feedback-piatti', 'Piatto eliminato', 'ok');
  });
}

function resetFormPiatti() {
  stato.modificandoPiattoId = null;
  document.getElementById('input-categoria').value = 'Antipasto';
  document.getElementById('input-nome-piatto').value = '';
  document.getElementById('input-descrizione-piatto').value = '';
  document.getElementById('input-prezzo-piatto').value = '';
  document.getElementById('form-titolo-piatti').textContent = 'Aggiungi Piatto';
  document.getElementById('btn-annulla-piatto').style.display = 'none';
}

/* =========================================================
   VINI AL CALICE
   ========================================================= */

function inizializzaFormVini() {
  document.getElementById('btn-salva-vino').addEventListener('click', salvaVino);
  document.getElementById('btn-annulla-vino').addEventListener('click', function () {
    resetFormVini();
  });
  document.getElementById('btn-svuota-vini').addEventListener('click', function () {
    if (confirm('Eliminare tutti i vini al calice?')) {
      stato.vini = [];
      salvaRemoto().then(function () {
        renderListaVini();
        mostraFeedback('feedback-vini', 'Tutti i vini eliminati', 'ok');
      });
    }
  });
}

function salvaVino() {
  var categoria = document.getElementById('input-categoria-vino').value.trim();
  var tipologia = document.getElementById('input-tipologia-vino').value.trim();
  var nome = document.getElementById('input-nome-vino').value.trim();
  var vitigno = document.getElementById('input-vitigno-vino').value.trim();
  var descrizione = document.getElementById('input-descrizione-vino').value.trim();
  var produttore = document.getElementById('input-produttore-vino').value.trim();
  var prezzo = parseFloat(document.getElementById('input-prezzo-vino').value);

  if (!nome) { mostraFeedback('feedback-vini', 'Inserisci il nome del vino', 'err'); return; }
  if (!produttore) { mostraFeedback('feedback-vini', 'Inserisci il produttore', 'err'); return; }
  if (isNaN(prezzo) || prezzo < 0) { mostraFeedback('feedback-vini', 'Inserisci un prezzo valido', 'err'); return; }

  var eraModifica = stato.modificandoVinoId !== null;

  if (eraModifica) {
    stato.vini = stato.vini.map(function (v) {
      if (v.id === stato.modificandoVinoId) {
        return { id: v.id, categoria: categoria, tipologia: tipologia, nome: nome, vitigno: vitigno, descrizione: descrizione, produttore: produttore, prezzo: prezzo };
      }
      return v;
    });
  } else {
    stato.vini.push({ id: Date.now(), categoria: categoria, tipologia: tipologia, nome: nome, vitigno: vitigno, descrizione: descrizione, produttore: produttore, prezzo: prezzo });
  }

  salvaRemoto().then(function () {
    renderListaVini();
    resetFormVini();
    mostraFeedback('feedback-vini', eraModifica ? 'Vino aggiornato ✓' : 'Vino aggiunto ✓', 'ok');
  }).catch(function () {
    mostraFeedback('feedback-vini', 'Errore di salvataggio. Riprova.', 'err');
  });
}

function renderListaVini() {
  var listaEl = document.getElementById('admin-lista-vini');
  listaEl.innerHTML = '';

  if (stato.vini.length === 0) {
    listaEl.innerHTML = '<p class="admin__vuoto">Nessun vino aggiunto.<br>Usa il form qui sopra.</p>';
    return;
  }

  var ordinati = stato.vini.slice().sort(function (a, b) {
    return ORDINE_VINI.indexOf(a.categoria) - ORDINE_VINI.indexOf(b.categoria);
  });

  ordinati.forEach(function (vino) {
    var card = document.createElement('div');
    card.className = 'admin__piatto';
    card.innerHTML =
      '<div class="admin__piatto-info">' +
        '<div class="admin__piatto-cat">' + vino.categoria + ' · ' + vino.tipologia + '</div>' +
        '<div class="admin__piatto-nome">' + vino.nome + '</div>' +
        (vino.vitigno ? '<div class="admin__piatto-desc">' + vino.vitigno + '</div>' : '') +
        '<div class="admin__piatto-desc">' + vino.produttore + '</div>' +
        '<div class="admin__piatto-prezzo">€ ' + Number(vino.prezzo).toFixed(2) + '</div>' +
      '</div>' +
      '<div class="admin__piatto-azioni">' +
        '<button class="admin__piatto-btn admin__piatto-btn--modifica" title="Modifica">✏️</button>' +
        '<button class="admin__piatto-btn admin__piatto-btn--elimina" title="Elimina">🗑️</button>' +
      '</div>';

    card.querySelector('.admin__piatto-btn--modifica').addEventListener('click', function () {
      modificaVino(vino.id);
    });
    card.querySelector('.admin__piatto-btn--elimina').addEventListener('click', function () {
      eliminaVino(vino.id);
    });

    listaEl.appendChild(card);
  });
}

function modificaVino(id) {
  var vino = stato.vini.find(function (v) { return v.id === id; });
  if (!vino) return;
  stato.modificandoVinoId = id;
  document.getElementById('input-categoria-vino').value = vino.categoria;
  document.getElementById('input-tipologia-vino').value = vino.tipologia;
  document.getElementById('input-nome-vino').value = vino.nome;
  document.getElementById('input-vitigno-vino').value = vino.vitigno || '';
  document.getElementById('input-descrizione-vino').value = vino.descrizione || '';
  document.getElementById('input-produttore-vino').value = vino.produttore;
  document.getElementById('input-prezzo-vino').value = vino.prezzo;
  document.getElementById('form-titolo-vini').textContent = 'Modifica Vino';
  document.getElementById('btn-annulla-vino').style.display = 'block';
  document.getElementById('form-box-vini').scrollIntoView({ behavior: 'smooth' });
}

function eliminaVino(id) {
  stato.vini = stato.vini.filter(function (v) { return v.id !== id; });
  salvaRemoto().then(function () {
    renderListaVini();
    mostraFeedback('feedback-vini', 'Vino eliminato', 'ok');
  });
}

function resetFormVini() {
  stato.modificandoVinoId = null;
  document.getElementById('input-categoria-vino').value = 'Bollicine';
  document.getElementById('input-tipologia-vino').value = 'Spumante';
  document.getElementById('input-nome-vino').value = '';
  document.getElementById('input-vitigno-vino').value = '';
  document.getElementById('input-descrizione-vino').value = '';
  document.getElementById('input-produttore-vino').value = '';
  document.getElementById('input-prezzo-vino').value = '';
  document.getElementById('form-titolo-vini').textContent = 'Aggiungi Vino al Calice';
  document.getElementById('btn-annulla-vino').style.display = 'none';
}

/* ---------------------------------------------------------
   FEEDBACK
   --------------------------------------------------------- */
function mostraFeedback(elId, messaggio, tipo) {
  var el = document.getElementById(elId);
  if (!el) return;
  el.textContent = messaggio;
  el.className = 'admin__feedback admin__feedback--' + tipo;
  el.style.display = 'block';
  window.setTimeout(function () { el.style.display = 'none'; }, 3000);
}

/* ---------------------------------------------------------
   INIT
   --------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function () {
  inizializzaLogin();
});
