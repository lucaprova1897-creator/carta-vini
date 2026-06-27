/* =========================================================
   LOU TCHAPPÉ — Carta dei Vini
   Script: orchestrazione animazioni d'ingresso
   ========================================================= */

/**
 * Anima in sequenza ("a cascata") tutti gli elementi marcati
 * con [data-animate]. L'ordine di apparizione segue l'ordine
 * nel DOM: logo → copertina → testo → pulsante → footer.
 *
 * Modificabile: cambia BASE_DELAY_MS e STEP_MS per velocizzare
 * o rallentare la sequenza.
 */
function animaIngressoSequenziale() {
  var elementi = document.querySelectorAll('[data-animate]');

  var BASE_DELAY_MS = 120;  // ritardo prima del primo elemento
  var STEP_MS = 160;        // intervallo tra un elemento e il successivo

  elementi.forEach(function (elemento, indice) {
    var ritardo = BASE_DELAY_MS + indice * STEP_MS;

    window.setTimeout(function () {
      elemento.classList.add('is-visible');
    }, ritardo);
  });
}

/**
 * Piccolo feedback tattile/visivo extra sul pulsante principale:
 * non blocca la navigazione (il link apre comunque il PDF),
 * serve solo a rendere il click più "vivo".
 */
function aggiungiFeedbackPulsante() {
  var pulsante = document.getElementById('open-wine-list');
  if (!pulsante) return;

  pulsante.addEventListener('click', function () {
    pulsante.style.transform = 'translateY(-1px) scale(0.98)';
    window.setTimeout(function () {
      pulsante.style.transform = '';
    }, 150);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  animaIngressoSequenziale();
  aggiungiFeedbackPulsante();
});