# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — dev server (Vite) at localhost
- `npm run build` — typecheck (`tsc`) then production build to `build/`
- `npm test` — run vitest suite once (jsdom env, globals enabled)
- `npx vitest run path/to/file.test.ts` — run a single test file
- `npx vitest` — watch mode
- `npm run deploy` — `gh-pages -d build` (publishes to `/react-space-barrage/` base)

Vite `base` is `/react-space-barrage/` for GitHub Pages — keep this in mind for any asset paths.

## Architecture

Space Barrage is a vertical-scrolling shoot-'em-up. The React layer is a thin shell; all gameplay lives in a vanilla TS engine + canvas renderer.

**Two-loop split (deliberate — do not collapse into React state):**
- `src/engine/GameEngine.ts` owns simulation: ship physics, enemy/bullet/particle/shield updates, collision, scoring, spawning. Runs on `requestAnimationFrame`. Mutates an internal `GameState` and emits a shallow copy via `onUpdate` each tick.
- `src/engine/GameRenderer.ts` consumes `GameState` and draws to a `<canvas>`. Pure rendering — no game logic.
- `src/App.tsx` constructs the engine when the player presses start, wires window keydown/keyup → `engine.handleKeyDown/Up`, and forwards touch events from `TouchControls`/fire button.
- `src/Components/GameCanvas.tsx` instantiates the renderer once assets load, sets up a `ResizeObserver`, and assigns `onUpdateRef.current` so the engine's per-frame callback drives `renderer.draw(state)`. State never round-trips through React for gameplay frames.

**Spawning system (`engine/`):**
- `WaveManager` — cadence: gates "is it time for a new wave?" via `shouldSpawnWave(timestamp)` / `markWaveSpawned`. Wave delay is mutable via `setWaveDelay`.
- `DifficultyScaler` — maps `score → DifficultyTier` (max enemies per wave, traverse duration, pattern type, wave delay).
- `PatternGenerator` / `PatternFactory` — pattern infrastructure exists (wall/diagonal/gaps/random in `types.ts`) but `GameEngine.spawnEnemies` currently picks random columns per wave; patterns are intentionally bypassed for now (see comment in `spawnEnemies`).
- `ColumnManager` — fixed 10-column grid (`GRID_CONFIG` in `types.ts`).

**Coordinate system:** logical game space is `GAME_WIDTH=1080 × GAME_HEIGHT=800` (in `types.ts`). The renderer scales this to the canvas's actual pixel size on resize. All engine math uses logical coordinates.

**Input:** keyboard (arrows + WASD, space to fire/restart) handled in `App.tsx`. Touch uses `TouchControls` (analog joystick → `engine.setAnalogVelocity`) and a separate fire button. Analog input takes precedence over keyboard when active.

**Assets:** `AssetLoader.ts` loads images. The enemy sprite is currently rendered as pixel art via a char-grid + `fillRect` helper in `GameRenderer.ts` (`ENEMY_ROWS`); the same grid is mirrored in `App.tsx` (`MARQUEE_ENEMY_ROWS`) for the marquee — keep them in sync if changed.

## Testing

Vitest with jsdom. Engine modules have colocated tests in `src/engine/*.test.ts` / `*.spec.ts`. There is also a `tests/engine/` directory (currently empty) reserved for higher-level engine tests.
