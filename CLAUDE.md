# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Vanilla JS Tetris (HTML5 Canvas). No build, no package.json, no deps, no tests, no linter. README.md is in Spanish; UI strings also Spanish.

## Run

Open `index.html` directly, or serve statically: `python3 -m http.server 8000` / `npx serve .`

## Architecture

Three files: `index.html` (DOM + canvases), `style.css`, `game.js` (all logic, single global script, `'use strict'`).

- `index.html` hardcodes canvas size: `#board` 300x600 = `COLS*BLOCK` x `ROWS*BLOCK`. Changing `COLS`/`ROWS`/`BLOCK` in `game.js` requires updating canvas `width`/`height` there. `#next-canvas` is 120x120 (4 cells x 30px, `drawNext` uses fixed `NB = 30`).
- Board = `ROWS x COLS` int matrix: `0` empty, `1-7` index into both `COLORS` and `PIECES` (same index = piece type).
- Module-level mutable state (`board`, `current`, `next`, `score`, ...) declared in one `let`; `init()` resets everything and doubles as restart handler.
- Loop: `loop(ts)` via `requestAnimationFrame`, accumulates `dropAccum` vs `dropInterval`; `animId` cancelled on pause/game over. Resume from pause calls `loop` directly after resetting `lastTime`.
- Piece lifecycle: `lockPiece()` = `merge()` -> `clearLines()` -> `spawn()`. `spawn()` calls `endGame()` if new piece collides. Score/level/`dropInterval` are updated inside `clearLines()`.
- Rotation: `rotateCW` (transpose + reverse), `tryRotate` tries horizontal kicks `[0,-1,1,-2,2]` only (no SRS, no floor kicks).
- Scoring is spread across `clearLines` (line table x level), `hardDrop` (2/cell), `softDrop` (1/row); gravity-based drops in `loop` score nothing.
- Records (`records.js`, `records.css`, loaded after `game.js`): start screen (`#start-screen`) shown on load; `game.js` no longer calls `init()` at file end (sets `gameOver = true`), the Jugar button calls `init()`. `endGame()` calls `Records.onGameOver(score, lines, bestCombo)`. Combo (`comboCount`/`bestCombo`) tracked in `clearLines`. localStorage keys `tetris.records` (top 5 `{name,score,lines,combo,date}`) and `tetris.bests` (`{combo,lines}`). Keydown handler ignores events from `<input>`. Hooks in `game.js` marked `// [records]`.
- Piece randomizer is uniform random (no 7-bag).
