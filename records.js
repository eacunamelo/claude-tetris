'use strict';

// Tabla de records local (localStorage). Se carga despues de game.js.
const Records = (() => {
  const KEY_TOP = 'tetris.records';
  const KEY_BESTS = 'tetris.bests';
  const MAX = 5;
  const DEFAULT_NAME = 'Jugador';

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* sin almacenamiento */ }
  }

  function num(v) { v = Number(v); return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0; }

  function loadTop() {
    const raw = readJSON(KEY_TOP, []);
    if (!Array.isArray(raw)) return [];
    return raw.filter(e => e && typeof e === 'object').map(e => ({
      name: String(e.name == null ? DEFAULT_NAME : e.name).slice(0, 12),
      score: num(e.score), lines: num(e.lines), combo: num(e.combo), date: String(e.date || ''),
    })).sort((a, b) => b.score - a.score).slice(0, MAX);
  }
  function loadBests() {
    const b = readJSON(KEY_BESTS, {});
    return { combo: num(b && b.combo), lines: num(b && b.lines) };
  }

  function qualifies(score) {
    if (score <= 0) return false;
    const top = loadTop();
    return top.length < MAX || score > top[top.length - 1].score;
  }

  function addEntry(entry) {
    const top = loadTop();
    let idx = top.findIndex(e => e.score < entry.score);
    if (idx === -1) idx = top.length;
    top.splice(idx, 0, entry);
    top.length = Math.min(top.length, MAX);
    writeJSON(KEY_TOP, top);
    return idx < MAX ? idx : -1;
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function render(container, highlight) {
    container.textContent = '';
    const top = loadTop();
    const bests = loadBests();
    const table = el('table', 'records-table');
    const colgroup = el('colgroup');
    ['22px', '', '62px', '42px', '42px'].forEach(w => {
      const c = el('col');
      if (w) c.style.width = w;
      colgroup.appendChild(c);
    });
    table.appendChild(colgroup);
    const head = el('tr');
    ['#', 'Nombre', 'Puntos', 'Lineas', 'Combo'].forEach(h => head.appendChild(el('th', '', h)));
    table.appendChild(head);
    if (!top.length) {
      const tr = el('tr');
      const td = el('td', 'records-empty', 'Sin records');
      td.colSpan = 5;
      tr.appendChild(td);
      table.appendChild(tr);
    }
    top.forEach((e, i) => {
      const tr = el('tr', i === highlight ? 'highlight' : '');
      [i + 1, e.name, e.score.toLocaleString(), e.lines, e.combo].forEach(v => tr.appendChild(el('td', '', String(v))));
      table.appendChild(tr);
    });
    container.appendChild(table);
    container.appendChild(el('p', 'records-bests',
      `Mejor combo: ${bests.combo} · Max lineas: ${bests.lines}`));
  }

  const startBox = document.getElementById('records-start');
  const goBox = document.getElementById('records-gameover');
  const startScreen = document.getElementById('start-screen');

  let pendingSave = null; // guarda la entrada pendiente (si hay input de nombre visible)

  function onGameOver(score, linesDone, combo) {
    const bests = loadBests();
    bests.combo = Math.max(bests.combo, num(combo));
    bests.lines = Math.max(bests.lines, num(linesDone));
    writeJSON(KEY_BESTS, bests);

    pendingSave = null;
    if (!qualifies(score)) { render(goBox, -1); return; }

    goBox.textContent = '';
    goBox.appendChild(el('p', 'records-new', 'Nuevo record! Escribe tu nombre'));
    const input = el('input', 'name-input');
    input.type = 'text';
    input.maxLength = 12;
    input.value = DEFAULT_NAME;
    input.setAttribute('aria-label', 'Nombre');
    const save = el('button', 'btn', 'Guardar');
    save.type = 'button';
    let saved = false;
    const doSave = () => {
      if (saved) return;
      saved = true;
      pendingSave = null;
      const name = input.value.trim().slice(0, 12) || DEFAULT_NAME;
      const idx = addEntry({ name, score, lines: linesDone, combo: num(combo), date: new Date().toISOString() });
      render(goBox, idx);
    };
    save.addEventListener('click', doSave);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') doSave(); });
    const row = el('div', 'name-row');
    row.append(input, save);
    goBox.appendChild(row);
    pendingSave = doSave;
    // retrasar el foco: evita que una tecla de juego aun pulsada escriba en el input
    setTimeout(() => { if (!saved) { input.focus(); input.select(); } }, 400);
  }

  function resetRecords() {
    if (!confirm('Borrar todos los records?')) return;
    pendingSave = null;
    try { localStorage.removeItem(KEY_TOP); localStorage.removeItem(KEY_BESTS); } catch (e) { /* ignorar */ }
    render(startBox, -1);
    if (gameOver && startScreen.classList.contains('hidden')) render(goBox, -1);
  }

  document.getElementById('reset-records-start').addEventListener('click', resetRecords);
  document.getElementById('reset-records-go').addEventListener('click', resetRecords);
  // limpiar el panel de game over al reiniciar (evita contenido viejo en otros usos del overlay)
  document.getElementById('restart-btn').addEventListener('click', () => {
    if (pendingSave) pendingSave(); // no perder un record sin guardar al reiniciar
    goBox.textContent = '';
  });
  document.getElementById('play-btn').addEventListener('click', e => {
    e.currentTarget.blur();
    startScreen.classList.add('hidden');
    init();
  });

  render(startBox, -1);

  return { onGameOver, render };
})();
