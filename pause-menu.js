'use strict';
// Menú de pausa. Se carga después de game.js (usa sus globals: paused, gameOver, init, togglePause, startLevel).

const START_LEVEL_KEY = 'tetris.startLevel';
const MIN_START_LEVEL = 1;
const MAX_START_LEVEL = 10;

const pauseMenuEl = document.getElementById('pause-menu');
const pmMain = document.getElementById('pm-main');
const pmControls = document.getElementById('pm-controls-view');
const pmLevelSel = document.getElementById('pm-start-level');
const pmResume = document.getElementById('pm-resume');
const pmControlsBtn = document.getElementById('pm-controls');
const pmBack = document.getElementById('pm-back');

let pmView = 'main';
// Tras cerrar el menú: ignora auto-repeat de teclas que seguían presionadas hasta que
// se vuelvan a pulsar (keydown sin repeat). Se registra por tecla.
const pmFresh = new Set();

function loadStartLevel() {
  try {
    const n = parseInt(localStorage.getItem(START_LEVEL_KEY), 10);
    if (n >= MIN_START_LEVEL && n <= MAX_START_LEVEL) return n;
  } catch (e) { /* sin storage */ }
  return MIN_START_LEVEL;
}

function saveStartLevel(n) {
  try { localStorage.setItem(START_LEVEL_KEY, String(n)); } catch (e) { /* sin storage */ }
}

function pmShowView(view) {
  pmView = view;
  pmMain.classList.toggle('hidden', view !== 'main');
  pmControls.classList.toggle('hidden', view !== 'controls');
  (view === 'main' ? pmResume : pmBack).focus();
}

function pauseMenuShow() {
  pmLevelSel.value = String(pmPendingLevel);
  pauseMenuEl.classList.remove('hidden');
  pmShowView('main');
}

function pauseMenuHide() {
  pauseMenuEl.classList.add('hidden');
  if (document.activeElement && pauseMenuEl.contains(document.activeElement)) document.activeElement.blur();
  pmFresh.clear();
}

// Llamado desde el keydown de game.js. Devuelve true si la tecla fue consumida.
function pauseMenuKey(e) {
  if (e.repeat) {
    if (!pmFresh.has(e.code)) return true;
  } else {
    pmFresh.add(e.code);
  }
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (e.repeat || gameOver) return true;
    if (paused && pmView === 'controls' && e.code === 'Escape') pmShowView('main');
    else togglePause();
    return true;
  }
  if (!paused || gameOver) return false;
  // Menú abierto: ninguna tecla llega al juego.
  const vertical = (e.code === 'ArrowDown' || e.code === 'ArrowUp') && e.target.tagName !== 'SELECT';
  if (vertical || e.code === 'Tab') { // Tab/flechas ciclan el foco dentro del menú
    const items = [...pauseMenuEl.querySelectorAll('.pm-view:not(.hidden) button, .pm-view:not(.hidden) select')];
    const i = items.indexOf(document.activeElement);
    const d = (e.code === 'ArrowUp' || (e.code === 'Tab' && e.shiftKey)) ? -1 : 1;
    items[(i + d + items.length) % items.length].focus();
    e.preventDefault();
  }
  return true;
}

pmResume.addEventListener('click', () => { if (paused) togglePause(); });
document.getElementById('pm-restart').addEventListener('click', () => init());
pmControlsBtn.addEventListener('click', () => pmShowView('controls'));
pmBack.addEventListener('click', () => pmShowView('main'));

for (let n = MIN_START_LEVEL; n <= MAX_START_LEVEL; n++) {
  pmLevelSel.add(new Option(String(n), String(n)));
}
// La selección solo se aplica a `startLevel` cuando empieza una partida nueva (init).
let pmPendingLevel = loadStartLevel();
function pauseMenuApplyLevel() { startLevel = pmPendingLevel; }

pmLevelSel.addEventListener('change', () => {
  pmPendingLevel = parseInt(pmLevelSel.value, 10);
  saveStartLevel(pmPendingLevel);
});

pmLevelSel.value = String(pmPendingLevel);
// [records] sin init() aquí: la partida empieza al pulsar Jugar y init() aplica el nivel elegido
