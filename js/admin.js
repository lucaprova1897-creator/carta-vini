/* =========================================================
   LOU TCHAPPÉ — admin.js
   Gestione piatti del giorno + vini al calice con traduzione automatica
   ========================================================= */

var CONFIG = {
  PASSWORD: 'LouTchappe26',
  API_KEY: '$2a$10$aULdtLYQzrRZ6f7c/SMLjOUDoWnF142XoYjYl9jgdoqCKAf4hPoaa',
  BIN_ID: '6a441993da38895dfe17d492',
  BASE_URL: 'https://api.jsonbin.io/v3/b',
  ANTHROPIC_KEY: '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'
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
   TAB ADMIN
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

/* ---------------------------------------------------------
   TRADUZIONE AUTOMATICA CON CLAUDE
   --------------------------------------------------------- */
function traduciVino(nome, vitigno, descrizione) {
  var testo = '';
  if (vitigno) testo += 'Vitigno: ' + vitigno + '\n';
  if (descrizione) testo += 'Descrizione: ' + descrizione;

  if (!testo.trim()) {
    return Promise.resolve({ vitigno_fr: '', vitigno_en: '', descrizione_fr: '', descrizione_en: '' });
  }

  var prompt = 'Traduci i seguenti campi di un vino italiano in francese e in inglese. ' +
    'Rispondi SOLO con un oggetto JSON valido, senza markdown, senza testo aggiuntivo.\n\n' +
    'Testo originale (italiano):\n' + testo + '\n\n' +
    'Formato risposta:\n' +
    '{"vitigno_fr":"...","vitigno_en":"...","descrizione_fr":"...","descrizione_en":"..."}\n\n' +
    'Se un campo è vuoto, metti stringa vuota. Mantieni termini tecnici del vino appropriati per lingua.';

  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CONFIG.ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  .then(function (res) {
    if (!res.ok) throw new Error('Errore API');
    return res.json();
  })
  .then(function (data) {
    var testo = data.content[0].text.trim();
    return JSON.parse(testo);
  })
  .catch(function () {
    return { vitigno_fr: vitigno || '', vitigno_en: vitigno || '', descrizione_fr: descrizione || '', descrizione_en: descrizione || '' };
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
  document.getElementById('btn-annulla-vino').addEventListener('click', resetFormVini);
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
  var regione = document.getElementById('input-regione-vino').value.trim();
  var prezzo = parseFloat(document.getElementById('input-prezzo-vino').value);

  if (!nome) { mostraFeedback('feedback-vini', 'Inserisci il nome del vino', 'err'); return; }
  if (!produttore) { mostraFeedback('feedback-vini', 'Inserisci il produttore', 'err'); return; }
  if (isNaN(prezzo) || prezzo < 0) { mostraFeedback('feedback-vini', 'Inserisci un prezzo valido', 'err'); return; }

   var idModifica = stato.modificandoVinoId;
  var eraModifica = idModifica !== null;
  var idVino = eraModifica ? idModifica : Date.now();

  mostraFeedback('feedback-vini', '🔄 Traduzione in corso...', 'ok');

  traduciVino(nome, vitigno, descrizione).then(function (traduzioni) {
    var vino = {
      id: idVino,
      categoria: categoria,
      tipologia: tipologia,
      nome: nome,
      vitigno: vitigno,
      vitigno_fr: traduzioni.vitigno_fr || vitigno,
      vitigno_en: traduzioni.vitigno_en || vitigno,
      descrizione: descrizione,
      descrizione_fr: traduzioni.descrizione_fr || descrizione,
      descrizione_en: traduzioni.descrizione_en || descrizione,
      produttore: produttore,
      regione: regione,
      prezzo: prezzo
    };

    if (eraModifica) {
      stato.vini = stato.vini.map(function (v) {
        return v.id === stato.modificandoVinoId ? vino : v;
      });
    } else {
      stato.vini.push(vino);
    }

    return salvaRemoto();
  })
  .then(function () {
    renderListaVini();
    resetFormVini();
    mostraFeedback('feedback-vini', eraModifica ? 'Vino aggiornato ✓' : 'Vino aggiunto ✓ (tradotto in FR e EN)', 'ok');
  })
  .catch(function () {
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
        '<div class="admin__piatto-cat">' + vino.categoria + ' · ' + vino.tipologia + (vino.regione ? ' · ' + vino.regione : '') + '</div>' +
        '<div class="admin__piatto-desc">' + vino.produttore + '</div>' +
        '<div class="admin__piatto-nome">' + vino.nome + '</div>' +
        (vino.vitigno ? '<div class="admin__piatto-desc">' + vino.vitigno + '</div>' : '') +
        '<div class="admin__piatto-desc" style="color:rgba(201,166,107,0.6);font-size:0.7rem">' +
          (vino.descrizione_fr ? '🇫🇷 ✓' : '🇫🇷 —') + ' ' +
          (vino.descrizione_en ? '🇬🇧 ✓' : '🇬🇧 —') +
        '</div>' +
        '<div class="admin__piatto-prezzo">€ ' + Number(vino.prezzo).toFixed(2) + '</div>' +
      '</div>' +
      '<div class="admin__piatto-azioni">' +
        '<button class="admin__piatto-btn admin__piatto-btn--modifica" title="Modifica">✏️</button>' +
        '<button class="admin__piatto-btn admin__piatto-btn--elimina" title="Elimina">🗑️</button>' +
      '</div>';

    card.querySelector('.admin__piatto-btn--modifica').addEventListener('click', function () { modificaVino(vino.id); });
    card.querySelector('.admin__piatto-btn--elimina').addEventListener('click', function () { eliminaVino(vino.id); });
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
  document.getElementById('input-regione-vino').value = vino.regione || "Valle d'Aosta";
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
  document.getElementById('input-regione-vino').value = "Valle d'Aosta";
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
  window.setTimeout(function () { el.style.display = 'none'; }, 4000);
}

/* ---------------------------------------------------------
   INIT
   --------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function () {
  inizializzaLogin();
});
