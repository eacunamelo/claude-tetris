'use strict';

// Skins visuales. Se carga ANTES de game.js; solo define datos/funciones,
// game.js las consulta en tiempo de llamada (activeSkin()).
// colors[0] = null; mismo orden que PIECES (1-7: I O T S Z J L).

const SKIN_STORAGE_KEY = 'tetris.skin';
const DEFAULT_SKIN = 'retro';

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const SKINS = {
  retro: {
    name: 'Retro',
    colors: [null, '#4dd0e1', '#ffd54f', '#ba68c8', '#81c784', '#e57373', '#90caf9', '#ffb74d'],
    boardBg: '#1a1a25',
    gridColor: '#22222e',
    drawBlock(ctx, x, y, ci, size, alpha) {
      ctx.globalAlpha = alpha ?? 1;
      ctx.fillStyle = this.colors[ci];
      ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x * size + 1, y * size + 1, size - 2, 4);
      ctx.globalAlpha = 1;
    },
  },

  neon: {
    name: 'Neón',
    colors: [null, '#00f0ff', '#fff700', '#d500f9', '#39ff14', '#ff1744', '#2979ff', '#ff9100'],
    boardBg: '#000000',
    gridColor: '#14141c',
    drawBlock(ctx, x, y, ci, size, alpha) {
      const color = this.colors[ci];
      const a = alpha ?? 1;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.shadowColor = color;
      ctx.shadowBlur = a < 1 ? 4 : 12;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x * size + 3, y * size + 3, size - 6, size - 6);
      ctx.fillStyle = color;
      ctx.globalAlpha = a * 0.35;
      ctx.fillRect(x * size + 3, y * size + 3, size - 6, size - 6);
      ctx.restore();
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.globalAlpha = 1;
    },
  },

  pastel: {
    name: 'Pastel',
    colors: [null, '#a8e6cf', '#fff3b0', '#d7bde2', '#c5e8b7', '#ffb3ba', '#aec6ff', '#ffd6a5'],
    boardBg: '#2a2733',
    gridColor: '#34303f',
    drawBlock(ctx, x, y, ci, size, alpha) {
      ctx.globalAlpha = alpha ?? 1;
      roundRectPath(ctx, x * size + 2, y * size + 2, size - 4, size - 4, 7);
      ctx.fillStyle = this.colors[ci];
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    },
  },

  pixel: {
    name: 'Pixel art',
    colors: [null, '#29adff', '#ffec27', '#b13e53', '#38b764', '#ef7d57', '#3b5dc9', '#ffa300'],
    boardBg: '#1a1c2c',
    gridColor: '#262a40',
    drawBlock(ctx, x, y, ci, size, alpha) {
      const px = x * size, py = y * size;
      const u = size / 10; // "pixel" del sprite
      const color = this.colors[ci];
      ctx.globalAlpha = alpha ?? 1;
      ctx.fillStyle = color;
      ctx.fillRect(px + u, py + u, size - 2 * u, size - 2 * u);
      // bisel claro arriba/izquierda, oscuro abajo/derecha
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(px + u, py + u, size - 2 * u, u);
      ctx.fillRect(px + u, py + u, u, size - 2 * u);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(px + u, py + size - 2 * u, size - 2 * u, u);
      ctx.fillRect(px + size - 2 * u, py + u, u, size - 2 * u);
      // trama ajedrezada (dither)
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let i = 2; i < 8; i++)
        for (let j = 2; j < 8; j++)
          if ((i + j) % 2 === 0) ctx.fillRect(px + i * u, py + j * u, u, u);
      // brillo
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(px + 2 * u, py + 2 * u, u, u);
      ctx.globalAlpha = 1;
    },
  },
};

function loadSkinName() {
  try {
    const v = localStorage.getItem(SKIN_STORAGE_KEY);
    if (v && Object.prototype.hasOwnProperty.call(SKINS, v)) return v;
  } catch (e) { /* sin acceso a localStorage */ }
  return DEFAULT_SKIN;
}

let currentSkinName = loadSkinName();

function activeSkin() {
  return SKINS[currentSkinName];
}

// Aplica fondo/atributo; no redibuja (lo hace el llamador).
function applySkin(name) {
  if (!Object.prototype.hasOwnProperty.call(SKINS, name)) name = DEFAULT_SKIN;
  currentSkinName = name;
  document.body.dataset.skin = name;
  const bg = SKINS[name].boardBg;
  document.getElementById('board').style.background = bg;
  document.getElementById('next-canvas').style.background = bg;
}

function initSkinSelector() {
  const sel = document.getElementById('skin-select');
  applySkin(currentSkinName);
  if (!sel) return;
  sel.innerHTML = '';
  for (const key of Object.keys(SKINS)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = SKINS[key].name;
    sel.appendChild(opt);
  }
  sel.value = currentSkinName;
  // Con el select enfocado, las flechas/Espacio no deben cambiar la skin: soltar foco y dejar que el juego las maneje.
  sel.addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
      sel.blur();
    }
  });
  sel.addEventListener('change', () => {
    applySkin(sel.value);
    try { localStorage.setItem(SKIN_STORAGE_KEY, currentSkinName); } catch (e) { /* ignorar */ }
    // Redibujar aunque esté en pausa / game over (si el juego ya inició).
    if (typeof redrawAll === 'function') redrawAll();
    sel.blur(); // que las flechas/Espacio no afecten al select
  });
}

// El script va al final del <body>: los elementos ya existen.
initSkinSelector();
