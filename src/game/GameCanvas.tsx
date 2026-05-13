// Per-game wrapper around `<ArcadeCanvas>`. The shared component owns
// the `<canvas>` mount, ResizeObserver wiring, and engine→renderer
// callback installation; this file just supplies space-barrage's
// `Renderer` factory and forwards the engine as the re-init key.
//
// `onRendererReady` — optional callback fired with the `Renderer`
// instance each time ArcadeCanvas constructs a fresh renderer (i.e.
// once per session, or once per reinitKey change). `SpaceBarrageGame.tsx`
// uses this to bridge `boardEntriesRef` from the async leaderboard
// fetch into the renderer without re-mounting the canvas.

import React, { type MutableRefObject, useCallback } from 'react';
import { ArcadeCanvas, type ArcadeFrame } from '@arcade';
import { GameEngine } from './engine/GameEngine';
import { Renderer } from './engine/Renderer';
import type { GameState } from './engine/types';

interface GameCanvasProps {
  engine: GameEngine | null;
  /** Frame envelope sink — ArcadeCanvas reassigns `current` to a
   *  function that forwards each frame to `renderer.drawFrame`.
   *  Pre-Stage-1A this was `(state: GameState) => void`. */
  onUpdateRef: MutableRefObject<(frame: ArcadeFrame<GameState>) => void>;
  /**
   * Optional callback fired with the freshly-constructed `Renderer`
   * instance each time ArcadeCanvas (re)creates the renderer. Used by
   * the parent Game component to update `boardEntriesRef` after async
   * leaderboard fetches resolve — without needing a ref to the canvas
   * component itself.
   */
  onRendererReady?: (renderer: Renderer) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  engine,
  onUpdateRef,
  onRendererReady,
}) => {
  // Wrap the factory so we can fire onRendererReady.
  // useCallback with [onRendererReady] dep keeps identity stable when
  // the callback itself is stable (parent wraps it in useCallback).
  const createRenderer = useCallback(
    (canvas: HTMLCanvasElement): Renderer => {
      const r = new Renderer(canvas);
      onRendererReady?.(r);
      return r;
    },
    [onRendererReady],
  );

  return (
    <ArcadeCanvas<GameState>
      createRenderer={createRenderer}
      onUpdateRef={onUpdateRef}
      // Pass `'attract'` instead of `null` when engine isn't constructed
      // yet (landing / gameover modes) so ArcadeCanvas constructs the
      // renderer and starts forwarding frames. Without this sentinel,
      // ArcadeCanvas would bail on `reinitKey == null` and the landing-
      // mode self-RAF would feed `onUpdateRef.current` (still a no-op)
      // for the entire pre-game lifetime — canvas in DOM but no paint.
      reinitKey={engine ?? 'attract'}
    />
  );
};

export default GameCanvas;
