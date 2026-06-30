/* =========================================================
   LOU TCHAPPÉ — admin.js
   Pannello di gestione proposte del giorno
   ========================================================= */

var CONFIG = {
  PASSWORD: 'LouTchappe26',
  API_KEY: '$2a$10$aULdtLYQzrRZ6f7c/SMLjOUDoWnF142XoYjYl9jgdoqCKAf4hPoaa',
  BIN_ID: '6a441993da38895dfe17d492',
  BASE_URL: 'https://api.jsonbin.io/v3/b'
};

var ORDINE_CATEGORIE = ['Antipasto', 'Primo', 'Secondo', 'Contorno', 'Dessert', 'Speciale'];

var stato = {
  proposte: [],
  modificandoId: null
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

  caricaProposte();

  document.getElementById('btn-salva').addEventListener('click', salva);
  document.getElementById('btn-annulla').addEventListener('click', function () { resetForm(); });
  document.getElementById('btn-svuota').addEventListener('click', function () {
    if (confirm('Sei sicuro di voler eliminare tutte le proposte di oggi?')) {
      stato.proposte = [];
      salvaRemoto().then(function () {
        renderListaAdmin();
        mostraFeedback('Tutte le proposte eliminate', 'ok');
      });
    }
  });
}

/* ---------------------------------------------------------
   CARICA PROPOSTE
   --------------------------------------------------------- */
function caricaProposte() {
  var listaEl = document.getElementById('admin-lista');

  fetch(CONFIG.BASE_URL + '/' + CONFIG.BIN_ID + '/latest', {
    headers: { 'X-Master-Key': CONFIG.API_KEY }
  })
  .then(function (res) {
    if (!res.ok) throw new Error('Errore');
    return res.json();
  })
  .then(function (data) {
    stato.proposte = (data.record && data.record.proposte) ? data.record.proposte : [];
    renderListaAdmin();
  })
  .catch(function () {
    listaEl.innerHTML = '<p class="admin__vuoto">⚠️ Errore di connessione. Riprova.</p>';
  });
}

/* ---------------------------------------------------------
   RENDER LISTA ADMIN
   --------------------------------------------------------- */
function renderListaAdmin() {
  var listaEl = document.getElementById('admin-lista');
  listaEl.innerHTML = '';

  if (stato.proposte.length === 0) {
    listaEl.innerHTML = '<p class="admin__vuoto">Nessuna proposta aggiunta oggi.<br>Usa il form qui sopra per aggiungerne.</p>';
    return;
  }

  var ordinate = stato.proposte.slice().sort(function (a, b) {
    return ORDINE_CATEGORIE.indexOf(a.categoria) - ORDINE_CATEGORIE.indexOf(b.categoria);
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
        '<button class="admin__piatto-btn admin__piatto-btn--modifica" data-id="' + piatto.id + '" title="Modifica">✏️</button>' +
        '<button class="admin__piatto-btn admin__piatto-btn--elimina" data-id="' + piatto.id + '" title="Elimina">🗑️</button>' +
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

/* ---------------------------------------------------------
   SALVA
   --------------------------------------------------------- */
function salva() {
  var categoria = document.getElementById('input-categoria').value.trim();
  var nome = document.getElementById('input-nome').value.trim();
  var descrizione = document.getElementById('input-descrizione').value.trim();
  var prezzo = parseFloat(document.getElementById('input-prezzo').value);

  if (!nome) { mostraFeedback('Inserisci il nome del piatto', 'err'); return; }
  if (isNaN(prezzo) || prezzo < 0) { mostraFeedback('Inserisci un prezzo valido', 'err'); return; }

  if (stato.modificandoId !== null) {
    stato.proposte = stato.proposte.map(function (p) {
      if (p.id === stato.modificandoId) {
        return { id: p.id, categoria: categoria, nome: nome, descrizione: descrizione, prezzo: prezzo };
      }
      return p;
    });
  } else {
    stato.proposte.push({
      id: Date.now(),
      categoria: categoria,
      nome: nome,
      descrizione: descrizione,
      prezzo: prezzo
    });
  }

  var eramodifica = stato.modificandoId !== null;
  salvaRemoto().then(function () {
    renderListaAdmin();
    resetForm();
    mostraFeedback(eraModifica ? 'Piatto aggiornato ✓' : 'Piatto aggiunto ✓', 'ok');
  }).catch(function () {
    mostraFeedback('Errore di salvataggio. Riprova.', 'err');
  });
}

/* ---------------------------------------------------------
   MODIFICA
   --------------------------------------------------------- */
function modificaPiatto(id) {
  var piatto = stato.proposte.find(function (p) { return p.id === id; });
  if (!piatto) return;

  stato.modificandoId = id;
  document.getElementById('input-categoria').value = piatto.categoria;
  document.getElementById('input-nome').value = piatto.nome;
  document.getElementById('input-descrizione').value = piatto.descrizione;
  document.getElementById('input-prezzo').value = piatto.prezzo;
  document.getElementById('form-titolo').textContent = 'Modifica Piatto';
  document.getElementById('btn-annulla').style.display = 'block';
  document.getElementById('form-box').scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('input-nome').focus();
}

/* ---------------------------------------------------------
   ELIMINA
   --------------------------------------------------------- */
function eliminaPiatto(id) {
  stato.proposte = stato.proposte.filter(function (p) { return p.id !== id; });
  salvaRemoto().then(function () {
    renderListaAdmin();
    mostraFeedback('Piatto eliminato', 'ok');
  });
}

/* ---------------------------------------------------------
   RESET FORM
   --------------------------------------------------------- */
function resetForm() {
  stato.modificandoId = null;
  document.getElementById('input-categoria').value = 'Antipasto';
  document.getElementById('input-nome').value = '';
  document.getElementById('input-descrizione').value = '';
  document.getElementById('input-prezzo').value = '';
  document.getElementById('form-titolo').textContent = 'Aggiungi Piatto';
  document.getElementById('btn-annulla').style.display = 'none';
}

/* ---------------------------------------------------------
   SALVA REMOTO SU JSONBIN
   --------------------------------------------------------- */
function salvaRemoto() {
  return fetch(CONFIG.BASE_URL + '/' + CONFIG.BIN_ID, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': CONFIG.API_KEY
    },
    body: JSON.stringify({ proposte: stato.proposte })
  }).then(function (res) {
    if (!res.ok) throw new Error('Errore ' + res.status);
    return res.json();
  });
}

/* ---------------------------------------------------------
   FEEDBACK
   --------------------------------------------------------- */
function mostraFeedback(messaggio, tipo) {
  var el = document.getElementById('feedback');
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
