// web/app/_arcade/ArcadeCanvas.tsx
//
// Shared canvas component for arcade games. Mounts the `<canvas>`,
// constructs the per-game renderer via the `createRenderer` factory
// the caller passes in, wires a `ResizeObserver` that calls
// `renderer.resize`, and assigns `onUpdateRef.current` to a function
// that calls `renderer.drawFrame(frame, performance.now())`.
//
// Per-game `Components/GameCanvas.tsx` files collapse to a thin
// wrapper that supplies its own renderer factory; everything else
// (DOM mount, ResizeObserver wiring, last-frame replay on resize,
// cleanup) is shared.
//
// **Frame envelope contract (post-Stage-1A):** the per-game adapter
// emits `ArcadeFrame<TGameState>` envelopes via `onUpdateRef.current`
// — the canvas reassigns `current` to a function that forwards each
// frame to `renderer.drawFrame`. Replaces the pre-1A pattern where
// engines emitted bare `TState` via `onUpdate` and the canvas called
// `renderer.draw(state, ts)` directly. Now every emission carries
// `mode` + `ui` alongside `game`, and the renderer dispatches
// internally on `frame.mode`.
//
// API contract — see also `_arcade/renderer.ts`:
//
// - `createRenderer(canvas) => ArcadeRenderer<TGameState>` is called
//   once per wire-up cycle. Stabilize it (module-scope const, or
//   `useCallback` with empty deps) so the effect doesn't re-run every
//   render.
// - `onUpdateRef` is the same mutable-ref pattern the engine layer
//   already uses; the canvas reassigns `current` to wire frame
//   emissions → renderer `drawFrame`. Both engine emissions (during
//   playing mode) and per-game adapter self-RAF emissions (during
//   landing / gameover modes — Stage 1B onward) call
//   `onUpdateRef.current(frame)`.
// - `reinitKey` triggers a full tear-down + re-init of the renderer
//   on change. Pass the engine instance — a new engine means a new
//   session and a fresh renderer. Pass `null` to keep the canvas
//   dormant (no renderer constructed yet).

import React, {
  useEffect,
  useRef,
  type MutableRefObject,
} from 'react';
import type { ArcadeFrame } from './arcadeFrame';
import type { ArcadeRenderer } from './renderer';
import styles from './ArcadeCanvas.module.css';

export interface ArcadeCanvasProps<TGameState> {
  createRenderer: (canvas: HTMLCanvasElement) => ArcadeRenderer<TGameState>;
  onUpdateRef: MutableRefObject<(frame: ArcadeFrame<TGameState>) => void>;
  /** Identity-driven re-init. When this changes (e.g., a new engine
   *  instance), the canvas tears down the current renderer + observer
   *  and constructs a fresh one. Pass `null` to leave the canvas
   *  dormant (rendered, but no renderer wired up). */
  reinitKey?: unknown;
}

export function ArcadeCanvas<TGameState>({
  createRenderer,
  onUpdateRef,
  reinitKey,
}: ArcadeCanvasProps<TGameState>): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastFrameRef = useRef<ArcadeFrame<TGameState> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reinitKey == null) return;

    const renderer = createRenderer(canvas);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        renderer.resize(width, height);
        // Repaint the last frame so a window resize between ticks
        // doesn't leave a stretched / empty canvas.
        if (lastFrameRef.current) {
          renderer.drawFrame(lastFrameRef.current, performance.now());
        }
      }
    });

    resizeObserver.observe(canvas);
    const rect = canvas.getBoundingClientRect();
    renderer.resize(rect.width, rect.height);

    onUpdateRef.current = (frame: ArcadeFrame<TGameState>) => {
      lastFrameRef.current = frame;
      renderer.drawFrame(frame, performance.now());
    };

    return () => {
      resizeObserver.disconnect();
      renderer.destroy?.();
    };
  }, [createRenderer, onUpdateRef, reinitKey]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}

export default ArcadeCanvas;
