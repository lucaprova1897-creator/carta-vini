/* =========================================================
   LOU TCHAPPÉ — Carta dei Vini
   Script: animazioni d'ingresso + parallasse leggero (desktop)
   ========================================================= */

/**
 * Anima in sequenza gli elementi [data-animate], nell'ordine
 * in cui appaiono nel DOM: logo → titolo → emblema → libro →
 * pulsante → footer.
 */
function animaIngressoSequenziale() {
  var elementi = document.querySelectorAll('[data-animate]');

  var BASE_DELAY_MS = 150;
  var STEP_MS = 180;

  elementi.forEach(function (elemento, indice) {
    var ritardo = BASE_DELAY_MS + indice * STEP_MS;
    window.setTimeout(function () {
      elemento.classList.add('is-visible');
    }, ritardo);
  });
}

/**
 * Parallasse leggero sulle due catene montuose, solo su desktop
 * con mouse (rispetta prefers-reduced-motion e i dispositivi touch,
 * dove non ha senso). Il movimento è volutamente minimo: atmosfera,
 * non un effetto vistoso.
 */
function attivaParallasseMontagne() {
  var supportaHover = window.matchMedia('(min-width: 900px) and (pointer: fine)').matches;
  var movimentoRidotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!supportaHover || movimentoRidotto) return;

  var montagneLontane = document.querySelector('.hero__mountains--far');
  var montagneVicine = document.querySelector('.hero__mountains--near');
  if (!montagneLontane || !montagneVicine) return;

  document.addEventListener('mousemove', function (evento) {
    var percentualeX = (evento.clientX / window.innerWidth - 0.5); // -0.5 .. 0.5
    var percentualeY = (evento.clientY / window.innerHeight - 0.5);

    // Le montagne lontane si muovono meno (più distanti), quelle vicine di più
    var spostamentoLontaneX = percentualeX * 10;
    var spostamentoLontaneY = percentualeY * 4;
    var spostamentoVicineX = percentualeX * 18;
    var spostamentoVicineY = percentualeY * 7;

    montagneLontane.style.transform =
      'translate(' + spostamentoLontaneX + 'px,' + spostamentoLontaneY + 'px)';
    montagneVicine.style.transform =
      'translate(' + spostamentoVicineX + 'px,' + spostamentoVicineY + 'px)';
  });
}

/**
 * Piccolo feedback tattile sul pulsante principale al click.
 */
function aggiungiFeedbackPulsante() {
  var pulsante = document.getElementById('open-wine-list');
  if (!pulsante) return;

  pulsante.addEventListener('click', function () {
    pulsante.style.transform = 'translateY(-1px) scale(0.97)';
    window.setTimeout(function () {
      pulsante.style.transform = '';
    }, 150);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  animaIngressoSequenziale();
  attivaParallasseMontagne();
  aggiungiFeedbackPulsante();
});
