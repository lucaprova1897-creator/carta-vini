/* =========================================================
   LOU TCHAPPÉ — admin.js
   Gestione piatti del giorno con traduzione automatica FR/EN
   ========================================================= */

/* v2 */
var CONFIG = {
  PASSWORD: 'LouTchappe26',
  API_KEY: '$2a$10$aULdtLYQzrRZ6f7c/SMLjOUDoWnF142XoYjYl9jgdoqCKAf4hPoaa',
  BIN_ID: '6a441993da38895dfe17d492',
  BASE_URL: 'https://api.jsonbin.io/v3/b',
  ANTHROPIC_KEY: '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'
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
    var record = data.record || {};
    stato.proposte = record.proposte || [];
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

/* ---------------------------------------------------------
   TRADUZIONE AUTOMATICA CON CLAUDE
   --------------------------------------------------------- */
function traduciPiatto(categoria, nome, descrizione) {
  var testi = [categoria, nome, descrizione || ''].join('\n---\n');

  return fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'auth_key=d7f695e8-b9dd-4a02-b213-04cbcf643fea%3Afx' +
          '&text=' + encodeURIComponent(categoria) +
          '&text=' + encodeURIComponent(nome) +
          '&text=' + encodeURIComponent(descrizione || '') +
          '&source_lang=IT&target_lang=FR'
  })
  .then(function (res) { return res.json(); })
  .then(function (dataFR) {
    return fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'auth_key=d7f695e8-b9dd-4a02-b213-04cbcf643fea%3Afx' +
            '&text=' + encodeURIComponent(categoria) +
            '&text=' + encodeURIComponent(nome) +
            '&text=' + encodeURIComponent(descrizione || '') +
            '&source_lang=IT&target_lang=EN'
    })
    .then(function (res) { return res.json(); })
    .then(function (dataEN) {
      return {
        categoria_fr: dataFR.translations[0].text,
        nome_fr:      dataFR.translations[1].text,
        descrizione_fr: dataFR.translations[2].text,
        categoria_en: dataEN.translations[0].text,
        nome_en:      dataEN.translations[1].text,
        descrizione_en: dataEN.translations[2].text
      };
    });
  })
  .catch(function (err) {
    console.warn('Traduzione fallita:', err);
    return {
      categoria_fr: categoria, nome_fr: nome, descrizione_fr: descrizione || '',
      categoria_en: categoria, nome_en: nome, descrizione_en: descrizione || ''
    };
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

  var idModifica = stato.modificandoPiattoId;
  var eraModifica = idModifica !== null;
  var idPiatto = eraModifica ? idModifica : Date.now();

  mostraFeedback('feedback-piatti', '🔄 Traduzione in corso...', 'ok');

  traduciPiatto(categoria, nome, descrizione).then(function (traduzioni) {
    var piatto = {
      id: idPiatto,
      categoria: categoria,
      categoria_fr: traduzioni.categoria_fr || categoria,
      categoria_en: traduzioni.categoria_en || categoria,
      nome: nome,
      nome_fr: traduzioni.nome_fr || nome,
      nome_en: traduzioni.nome_en || nome,
      descrizione: descrizione,
      descrizione_fr: traduzioni.descrizione_fr || descrizione,
      descrizione_en: traduzioni.descrizione_en || descrizione,
      prezzo: prezzo
    };

    if (eraModifica) {
      stato.proposte = stato.proposte.map(function (p) {
        return p.id === idModifica ? piatto : p;
      });
    } else {
      stato.proposte.push(piatto);
    }

    return salvaRemoto();
  })
  .then(function () {
    renderListaPiatti();
    resetFormPiatti();
    mostraFeedback('feedback-piatti', eraModifica ? 'Piatto aggiornato ✓' : 'Piatto aggiunto ✓ (tradotto in FR e EN)', 'ok');
  })
  .catch(function () {
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
          (piatto.nome_fr ? '🇫🇷 ' + piatto.nome_fr : '🇫🇷 —') + ' · ' +
          (piatto.nome_en ? '🇬🇧 ' + piatto.nome_en : '🇬🇧 —') +
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
