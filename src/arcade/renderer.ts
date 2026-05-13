// web/app/_arcade/renderer.ts
//
// Shared structural contract every per-game renderer satisfies. The
// shared `<ArcadeCanvas>` consumes this interface so it doesn't need
// to know which game it's hosting.
//
// The interface is generic on `TGameState` because each game's
// renderable engine snapshot differs — asteroids has ships /
// asteroids / bullets / particles / UFOs + HUD scalars; space-barrage
// has its own `GameState` with enemies, shields, particles, etc.
// Each game's renderer specifies its own `TGameState` and the engine
// emits exactly that shape via `onUpdate`.
//
// Convention: renderers take a `<canvas>` element at construction
// (not a `CanvasRenderingContext2D`) so they can own their own DPR /
// resize behavior. Each game decides whether it wants crisp DPR
// rescaling (asteroids) or 1×-CSS-pixel chunky rendering
// (space-barrage's CRT look). The shared canvas component just calls
// `resize(w, h)` from a `ResizeObserver` and `drawFrame(frame, ts)`
// from each tick's `onUpdate` callback.
//
// **Frame envelope (post-Stage-1A):** `drawFrame` receives an
// `ArcadeFrame<TGameState>` containing `mode` + `game` + `ui`.
// Renderers dispatch internally on `frame.mode`:
//
//   - `playing` → the existing per-tick game render (asteroids /
//     space-barrage gameplay). Most renderers keep their pre-frame-
//     envelope draw pipeline as a private `drawPlaying(state, ts)`
//     and let `drawFrame` switch to it.
//   - `landing` → title-screen overlay. Stage 1B onward.
//   - `gameover` → game-over overlay. Stage 2 onward.

import type { ArcadeFrame } from './arcadeFrame';

export interface ArcadeRenderer<TGameState> {
  /** Apply a CSS-pixel size change. Renderer is free to internally
   *  apply DPR scaling, recompute world transforms, etc. Width /
   *  height are CSS pixels; the renderer handles its own
   *  backing-store sizing. */
  resize(width: number, height: number): void;

  /** Render one frame of the current envelope. `timestamp` is
   *  typically `performance.now()`. Called from the per-tick
   *  `onUpdate` callback in the React layer. */
  drawFrame(
    frame: ArcadeFrame<TGameState>,
    timestamp: number,
  ): void;

  /** Optional cleanup hook for renderers that hold timers,
   *  listeners, or offscreen canvases. Called when the canvas
   *  component unmounts. Most renderers don't need this — leave
   *  undefined to skip. */
  destroy?(): void;
}
