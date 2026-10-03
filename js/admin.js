/* =========================================================
   LOU TCHAPPÉ — admin.js
   Gestione piatti del giorno con traduzioni manuali FR/EN
   ========================================================= */

var CONFIG = {
  PASSWORD: 'LouTchappe26',
  API_KEY: '$2a$10$aULdtLYQzrRZ6f7c/SMLjOUDoWnF142XoYjYl9jgdoqCKAf4hPoaa',
  BIN_ID: '6a441993da38895dfe17d492',
  BASE_URL: 'https://api.jsonbin.io/v3/b'
};

var ORDINE_PIATTI = ['Antipasto', 'Primo', 'Secondo', 'Contorno', 'Dessert', 'Speciale'];

var stato = {
  proposte: [],
  modificandoPiattoId: null
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
  caricaDati();
  inizializzaFormPiatti();
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
    stato.proposte = (data.record && data.record.proposte) ? data.record.proposte : [];
    renderListaPiatti();
  })
  .catch(function () {
    document.getElementById('admin-lista-piatti').innerHTML =
      '<p class="admin__vuoto">⚠️ Errore di connessione. Riprova.</p>';
  });
}

/* ---------------------------------------------------------
   SALVA REMOTO
   --------------------------------------------------------- */
function salvaRemoto() {
  return fetch(CONFIG.BASE_URL + '/' + CONFIG.BIN_ID + '/latest', {
    headers: { 'X-Master-Key': CONFIG.API_KEY }
  })
  .then(function (res) { return res.json(); })
  .then(function (data) {
    var record = data.record || {};
    record.proposte = stato.proposte;
    return fetch(CONFIG.BASE_URL + '/' + CONFIG.BIN_ID, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': CONFIG.API_KEY
      },
      body: JSON.stringify(record)
    });
  })
  .then(function (res) {
    if (!res.ok) throw new Error('Errore ' + res.status);
    return res.json();
  });
}

/* =========================================================
   PIATTI DEL GIORNO
   ========================================================= */

function inizializzaFormPiatti() {
  document.getElementById('btn-salva-piatto').addEventListener('click', salvaPiatto);
  document.getElementById('btn-annulla-piatto').addEventListener('click', resetFormPiatti);
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
  var categoria_fr = document.getElementById('input-categoria-fr').value.trim();
  var nome_fr = document.getElementById('input-nome-fr').value.trim();
  var descrizione_fr = document.getElementById('input-descrizione-fr').value.trim();
  var categoria_en = document.getElementById('input-categoria-en').value.trim();
  var nome_en = document.getElementById('input-nome-en').value.trim();
  var descrizione_en = document.getElementById('input-descrizione-en').value.trim();
  var prezzo = parseFloat(document.getElementById('input-prezzo-piatto').value);

  if (!nome) { mostraFeedback('feedback-piatti', 'Inserisci il nome del piatto', 'err'); return; }
  if (isNaN(prezzo) || prezzo < 0) { mostraFeedback('feedback-piatti', 'Inserisci un prezzo valido', 'err'); return; }

  var idModifica = stato.modificandoPiattoId;
  var eraModifica = idModifica !== null;
  var idPiatto = eraModifica ? idModifica : Date.now();

  var piatto = {
    id: idPiatto,
    categoria: categoria,
    categoria_fr: categoria_fr || categoria,
    categoria_en: categoria_en || categoria,
    nome: nome,
    nome_fr: nome_fr || nome,
    nome_en: nome_en || nome,
    descrizione: descrizione,
    descrizione_fr: descrizione_fr || descrizione,
    descrizione_en: descrizione_en || descrizione,
    prezzo: prezzo
  };

  if (eraModifica) {
    stato.proposte = stato.proposte.map(function (p) {
      return p.id === idModifica ? piatto : p;
    });
  } else {
    stato.proposte.push(piatto);
  }

  mostraFeedback('feedback-piatti', '💾 Salvataggio...', 'ok');

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
        '<div class="admin__piatto-desc">' + (piatto.descrizione || '') + '</div>' +
        '<div class="admin__piatto-desc" style="color:rgba(201,166,107,0.7);font-size:0.7rem;margin-top:0.2rem">' +
          (piatto.nome_fr && piatto.nome_fr !== piatto.nome ? '🇫🇷 ' + piatto.nome_fr : '🇫🇷 —') + ' · ' +
          (piatto.nome_en && piatto.nome_en !== piatto.nome ? '🇬🇧 ' + piatto.nome_en : '🇬🇧 —') +
        '</div>' +
        '<div class="admin__piatto-prezzo">€ ' + Number(piatto.prezzo).toFixed(2) + '</div>' +
      '</div>' +
      '<div class="admin__piatto-azioni">' +
        '<button class="admin__piatto-btn admin__piatto-btn--modifica" title="Modifica">✏️</button>' +
        '<button class="admin__piatto-btn admin__piatto-btn--elimina" title="Elimina">🗑️</button>' +
      '</div>';

    card.querySelector('.admin__piatto-btn--modifica').addEventListener('click', function () { modificaPiatto(piatto.id); });
    card.querySelector('.admin__piatto-btn--elimina').addEventListener('click', function () { eliminaPiatto(piatto.id); });
    listaEl.appendChild(card);
  });
}

function modificaPiatto(id) {
  var piatto = stato.proposte.find(function (p) { return p.id === id; });
  if (!piatto) return;
  stato.modificandoPiattoId = id;
  document.getElementById('input-categoria').value = piatto.categoria;
  document.getElementById('input-nome-piatto').value = piatto.nome;
  document.getElementById('input-descrizione-piatto').value = piatto.descrizione || '';
  document.getElementById('input-categoria-fr').value = piatto.categoria_fr || '';
  document.getElementById('input-nome-fr').value = piatto.nome_fr || '';
  document.getElementById('input-descrizione-fr').value = piatto.descrizione_fr || '';
  document.getElementById('input-categoria-en').value = piatto.categoria_en || '';
  document.getElementById('input-nome-en').value = piatto.nome_en || '';
  document.getElementById('input-descrizione-en').value = piatto.descrizione_en || '';
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
  document.getElementById('input-categoria-fr').value = '';
  document.getElementById('input-nome-fr').value = '';
  document.getElementById('input-descrizione-fr').value = '';
  document.getElementById('input-categoria-en').value = '';
  document.getElementById('input-nome-en').value = '';
  document.getElementById('input-descrizione-en').value = '';
  document.getElementById('input-prezzo-piatto').value = '';
  document.getElementById('form-titolo-piatti').textContent = 'Aggiungi Piatto';
  document.getElementById('btn-annulla-piatto').style.display = 'none';
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
