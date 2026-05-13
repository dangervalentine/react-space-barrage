// web/app/_arcade/arcadeFrame.ts
//
// Unified frame envelope passed from the per-game adapter to the
// renderer once per RAF tick. Replaces the old "engine emits TState
// directly to renderer.draw(state, ts)" pipeline with an envelope
// that carries:
//
//   - `mode`: which UI screen is showing (landing/playing/gameover).
//             The renderer dispatches by mode.
//   - `game`: the engine's TState snapshot. Always present; renderer
//             reads it for the playing draw path AND uses it as the
//             frozen-backdrop for landing/gameover overlays.
//   - `ui`:   discriminated union — mode-specific data the renderer
//             needs that's NOT in the game state (picker indices,
//             initials cursor, leaderboard data).
//
// Why this shape: every state of the cabinet's screen is now ONE
// canvas paint, regardless of mode. The renderer's `drawFrame(frame,
// ts)` receives all the info it needs in one call. Lifecycle / state-
// machine logic stays in `useArcadeSession` + per-game adapters; the
// renderer is a pure function of the latest frame.
//
// **Migration staging:**
//   Stage 1A (this commit): types declared, renderer interface
//     broadens to `drawFrame`. Both games keep HTML landing/gameover
//     screens mounted; canvas only renders during 'playing' mode.
//     Zero visual change.
//   Stage 1B (next): asteroids landing screen migrates into the
//     canvas via `drawFrame(frame, ts)` with `frame.mode = 'landing'`.
//   Stage 2: asteroids gameover migrates.
//   Stage 3: space-barrage parity + cleanup of HTML landing/gameover
//     components.

export type ArcadeMode = 'landing' | 'playing' | 'paused' | 'gameover';

/** One option row inside the pause menu. `id` is the discriminator
 *  the React layer reads to decide what to do on confirm
 *  (`'continue'` resumes the engine, `'menu'` resets to landing).
 *  `label` is the rendered text — kept short (PressStart2P at the
 *  pause-menu size has wide tracking, so 8–10 chars is comfortable).
 *  Items are intentionally a flat array (not a tree) so the up/down
 *  nav stays trivial; multi-level submenus would justify a real
 *  navigation primitive. */
export interface PauseMenuItem {
  id: 'continue' | 'menu';
  label: string;
}

/** Two-screen toggle on the landing page. Both games today have a
 *  title view (with picker) and a scores view. Defined here (rather
 *  than in `useArcadeSession`) so per-game adapters and the renderer
 *  can both consume it without circular deps. */
export type LandingView = 'title' | 'scores';

/** Landing-mode UI — what the renderer needs to draw the title screen
 *  beyond what's in the game state. */
export interface LandingUI {
  mode: 'landing';
  view: LandingView;
  /** Index into a per-game picker (color scheme for asteroids, ship
   *  variant for space-barrage). The renderer's per-game cabinetUI
   *  config translates this to a label + drawing callback. */
  pickerIndex: number;
}

export interface PlayingUI {
  mode: 'playing';
}

/** Paused-mode UI — drives the pause-menu overlay drawn on top of
 *  the frozen last gameplay frame. The renderer paints `frame.game`
 *  as a static backdrop (engine has been told to `pause()`, so no
 *  fresh emissions arrive), then dims with a translucent black layer
 *  and delegates to `drawPauseMenu` from `_arcade/canvasUI.ts`. */
export interface PauseUI {
  mode: 'paused';
  items: ReadonlyArray<PauseMenuItem>;
  /** Index into `items` of the currently-selected row. The caret
   *  glyph (▶) renders to the LEFT of this row's label. */
  selectedIndex: number;
}

/** Gameover-mode UI — phase + leaderboard sub-state. */
export interface GameoverUI {
  mode: 'gameover';
  phase: 'reveal' | 'board';
  finalScore: number;
  /**
   * Highlight row index in the visible Top 10 if the player landed in
   * the top 10. Null if their rank > 10 or they're a guest.
   */
  highlightIndex: number | null;
  /**
   * Player's global rank for the Top-10 board. Set after submission
   * resolves (auth) or remains null (guest, no-username, or pending POST).
   */
  rank: number | null;
  /**
   * For unauthenticated players: their best score recorded today
   * (local-timezone day, daily reset). Null if they have no entry today.
   */
  todaysBest: number | null;
  /**
   * Discriminated submission status — drives the messaging beneath the
   * board.
   */
  submitStatus: 'idle' | 'pending' | 'submitted' | 'unauth' | 'username_required' | 'network_error';
}

export type ArcadeUI = LandingUI | PlayingUI | PauseUI | GameoverUI;

/** Frame envelope. The renderer's `drawFrame(frame, ts)` receives
 *  this; mode dispatch happens internally. */
export interface ArcadeFrame<TGameState> {
  mode: ArcadeMode;
  game: TGameState;
  ui: ArcadeUI;
}

/** Per-game cabinet UI configuration. Each game ships one of these
 *  alongside its renderer; the renderer reads it during landing /
 *  gameover passes. Drawing callbacks (e.g. `picker.drawPreview`) are
 *  per-game because the previews differ too much to abstract.
 *
 *  Stage 1A note: this type is declared but no game implements it
 *  yet. Wiring lands in Stage 1B alongside the asteroids landing
 *  migration. */
export interface CabinetUIConfig {
  landing: {
    title: string;
    promptDesktop: string;
    promptMobile: string;
    attribution: { name: string; year: number };
    /** Picker label + a callback to draw the live preview. The
     *  bounds are in CSS-pixel space (the renderer applies its own
     *  DPR transform around the call). */
    picker: {
      label: string;
      count: () => number;
      currentIndex: () => number;
      drawPreview: (
        ctx: CanvasRenderingContext2D,
        bounds: { x: number; y: number; w: number; h: number },
        timestamp: number,
        index: number,
      ) => void;
    };
    /** Hint clusters — each is a label + a key-cluster (rows of
     *  glyphs) and an optional sub-label that sits between the
     *  cluster and the main label.
     *
     *  An empty-string glyph (`''`) inside a row is rendered as a
     *  blank slot of the same width as a single-letter keycap — used
     *  to leave a gap where a key would normally sit (e.g., the
     *  `[A][_][D]` MOVE row that omits S because S is hyper).
     *
     *  `column` (optional) groups hints into the same vertical column
     *  in the CONTROLS box. Hints sharing a column stack vertically.
     *  Omitted column → each hint gets its own column (the original
     *  N-clusters-side-by-side behavior). */
    hints: Array<{
      label: string;
      cluster: ReadonlyArray<ReadonlyArray<string>>;
      sublabel?: string;
      column?: number;
    }>;
  };
  gameover: {
    title: string;
  };
  /** Reveal-phase text config — shown for 1.5 s after game-over
   *  before transitioning to the board phase. */
  gameoverReveal: {
    label: string;
    subPrompt: string;
  };
  /** Board-phase text config — shown after the reveal flash. */
  gameoverBoard: {
    rankPrefix: string;
    todaysBestPrefix: string;
    setUsernamePrompt: string;
    saveFailedPrompt: string;
    continuePrompt: string;
  };
  /** Bounds for the "FULL LEADERBOARD →" tap-target painted on the
   *  landing scores view, expressed in design-coordinate units
   *  (1080×810, 4:3 space). The renderer paints from these constants;
   *  the React layer overlays a transparent <Link> at the matching px
   *  rect. */
  landingScoresTapTarget: {
    designCenterX: number;
    designCenterY: number;
    designWidth: number;
    designHeight: number;
    label: string;
  };
}
