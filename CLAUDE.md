# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Vanilla JS Tetris (HTML5 Canvas). No build, no package.json, no deps, no tests, no linter. README.md is in Spanish; UI strings also Spanish.

## Run

Open `index.html` directly, or serve statically: `python3 -m http.server 8000` / `npx serve .`

## Architecture

Files: `index.html` (DOM + canvases), `style.css`, `game.js` (all logic, single global script, `'use strict'`), `pause-menu.js` + `pause-menu.css` (pause menu; classic script loaded after `game.js`, hooks marked `// [pause-menu]`).

- `index.html` hardcodes canvas size: `#board` 300x600 = `COLS*BLOCK` x `ROWS*BLOCK`. Changing `COLS`/`ROWS`/`BLOCK` in `game.js` requires updating canvas `width`/`height` there. `#next-canvas` is 120x120 (4 cells x 30px, `drawNext` uses fixed `NB = 30`).
- Board = `ROWS x COLS` int matrix: `0` empty, `1-7` index into both `COLORS` and `PIECES` (same index = piece type).
- Module-level mutable state (`board`, `current`, `next`, `score`, ...) declared in one `let`; `init()` resets everything and doubles as restart handler.
- Loop: `loop(ts)` via `requestAnimationFrame`, accumulates `dropAccum` vs `dropInterval`; `animId` cancelled on pause/game over. Resume from pause calls `loop` directly after resetting `lastTime`. Pause (`P`/`Escape`) shows `#pause-menu` (not `#overlay`; that is game-over only) via `pauseMenuShow/Hide`; `pauseMenuKey(e)` runs first in the keydown handler and consumes keys while paused, and ignores `e.repeat` until keyup after closing.
- Piece lifecycle: `lockPiece()` = `merge()` -> `clearLines()` -> `spawn()`. `spawn()` calls `endGame()` if new piece collides. Score/level/`dropInterval` are updated inside `clearLines()`. Level = `max(startLevel, floor(lines/10)+1)`; `init()` starts at `startLevel` (persisted in `localStorage['tetris.startLevel']`, 1-10).
- Rotation: `rotateCW` (transpose + reverse), `tryRotate` tries horizontal kicks `[0,-1,1,-2,2]` only (no SRS, no floor kicks).
- Scoring is spread across `clearLines` (line table x level), `hardDrop` (2/cell), `softDrop` (1/row); gravity-based drops in `loop` score nothing.
- Piece randomizer is uniform random (no 7-bag).
