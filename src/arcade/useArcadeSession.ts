// web/app/_arcade/useArcadeSession.ts
//
// Shared lifecycle hooks for arcade games — state machine + keyboard
// wiring. Both `AsteroidsGame.tsx` and `SpaceBarrageGame.tsx` previously
// duplicated this exact shape; this file is the single source of truth.
//
// Each game still owns its own engine creation `useEffect` (the
// GameEngine class is per-game and the terminal-state field differs —
// `state.isGameOver` for asteroids, `state.isShipHit` for space-barrage),
// but the surrounding state, refs, and handlers come from the hooks.
//
// State transitions:
//
//   started=false          ──fire-down──▶  started=true
//   sessionId=N            ──── play ───▶  (engine alive)
//                          ──ship dies──▶  if qualifies: finalScore=score
//                                          else:         handlePlayAgain()
//   finalScore=null        ──Continue──▶  handlePlayAgain()
//   ─────────────────                     │
//   handlePlayAgain():                    │
//     setFinalScore(null);                ▼
//     setStarted(false);          (back to landing,
//     setLandingView('title');     fresh sessionId
//     setSessionId(id => id+1);    forces a clean engine)

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { ArcadeMode, LandingView, PauseMenuItem } from './arcadeFrame';

/** Default pause-menu items consumed by both games. Kept here (not in
 *  per-game adapters) so the menu reads identically across cabinets;
 *  per-game adapters can pass a custom array via session options if a
 *  future game wants to extend (e.g. add MUTE / RESTART). The order
 *  here is the rendered order; CONTINUE first means it's selected by
 *  default whenever the menu opens. */
export const DEFAULT_PAUSE_ITEMS: ReadonlyArray<PauseMenuItem> = [
  { id: 'continue', label: 'CONTINUE' },
  { id: 'menu', label: 'MENU' },
] as const;

// Re-export for backward compat with consumers that import LandingView
// from this module. The canonical definition lives in `arcadeFrame.ts`
// where it's a sibling of the other UI sub-state types.
export type { LandingView };

export interface UseArcadeSessionOptions {
  /** Hold time after game-over before fire-button input can restart, in
   *  ms. Prevents an in-game fire press from instantly bouncing into a
   *  fresh game on the game-over screen. Default 800. */
  restartLockoutMs?: number;
}

export interface ArcadeSession {
  // Core state
  started: boolean;
  sessionId: number;
  finalScore: number | null;
  landingView: LandingView;
  /** True while the pause menu is open. Only meaningful when the
   *  derived `mode` is `'paused'` (i.e. `started && finalScore ===
   *  null && paused`). Toggled by `togglePause()`; cleared by
   *  `exitToLanding()` and `handlePlayAgain()`. */
  paused: boolean;
  /** Currently-selected row in the pause menu, indexing into
   *  `pauseItems`. Reset to 0 (CONTINUE) every time the menu opens
   *  so the player doesn't land on a stale MENU selection. */
  pauseSelectedIndex: number;
  /** The fixed item array rendered in the pause menu. Not stateful —
   *  carried on the session for convenience so per-game adapters
   *  don't have to import the constant. */
  pauseItems: ReadonlyArray<PauseMenuItem>;
  /** Derived: which canvas-rendered screen the cabinet should be
   *  showing. Per-game adapters read this to decide whether the
   *  engine drives frame emissions (`playing`) or a self-RAF
   *  synthesizes idle frames (`landing` / `paused` / `gameover`).
   *  Renderer's `drawFrame` also dispatches on this. */
  mode: ArcadeMode;

  // Setters — each game owns its own engine `useEffect`, so it needs to
  // advance these directly (e.g. setStarted(true) on fire-down,
  // setFinalScore(score) when the player qualifies).
  setStarted: Dispatch<SetStateAction<boolean>>;
  setSessionId: Dispatch<SetStateAction<number>>;
  setFinalScore: Dispatch<SetStateAction<number | null>>;
  setLandingView: Dispatch<SetStateAction<LandingView>>;

  // Lockout machinery — engine effect calls `markGameOver()` when the
  // game's terminal state fires; restart paths call `isRestartReady()`
  // before dispatching `handlePlayAgain()`.
  gameOverAtRef: MutableRefObject<number>;
  markGameOver: (finalScore: number) => void;
  isRestartReady: () => boolean;

  // Identical state-machine helpers (every consumer used these verbatim
  // in the pre-extraction code).
  handlePlayAgain: () => void;
  toggleLandingView: () => void;

  /** Open or close the pause menu. Only honored while `mode === 'playing'`
   *  (open path) or `mode === 'paused'` (close path) — calls during
   *  landing / gameover are no-ops, since the menu's two items only
   *  make sense mid-run. Engine pause/resume is the React layer's job
   *  (per-game adapter watches mode and calls `engine.pause()` /
   *  `engine.resume()` accordingly). */
  togglePause: () => void;
  /** Pause-menu nav: move selection by ±1 with wraparound. No-op
   *  outside `mode === 'paused'`. */
  movePauseSelection: (delta: -1 | 1) => void;
  /** Confirm the currently-selected pause-menu item. CONTINUE → resume
   *  (mode → 'playing'); MENU → reset to landing without router push.
   *  No-op outside `mode === 'paused'`. */
  confirmPauseSelection: () => void;
  /** Hard reset to landing — engine-tear-down + state flags cleared,
   *  identical to handlePlayAgain except landingView is also reset.
   *  Used by the pause menu's `MENU` action. */
  exitToLanding: () => void;

  /** Higher-order fire handler — routes the press to start /
   *  restart-after-lockout / in-game-fire depending on session state.
   *  Pass the in-game fire callback for each game (asteroids:
   *  triggerFire; space-barrage: handleKeyDown(32)). */
  handleFireDown: (inGameFire: () => void) => void;

  // ---- Gameover state -------------------------------------------------------
  // Active during `mode === 'gameover'`. Resets to defaults each time
  // `markGameOver(finalScore)` is called (entering a fresh gameover).
  /** Whether we're in the score-reveal flash (`'reveal'`) or showing the
   *  board (`'board'`). Transitions automatically after 1.5 s. */
  gameoverPhase: 'reveal' | 'board';
  /** Index in the visible Top 10 that belongs to the player's just-
   *  submitted entry. Null if rank > 10, guest, or not yet submitted. */
  highlightIndex: number | null;
  /** Player's global rank after submission resolves. Null while pending,
   *  or for guests / players without a username. */
  rank: number | null;
  /** For unauthenticated players: their best score today (local-timezone
   *  day). Null if they have no entry today. */
  todaysBest: number | null;
  /** Submission pipeline status — drives the messaging beneath the board. */
  submitStatus: 'idle' | 'pending' | 'submitted' | 'unauth' | 'username_required' | 'network_error';

  setGameoverPhase: Dispatch<SetStateAction<'reveal' | 'board'>>;
  setHighlightIndex: Dispatch<SetStateAction<number | null>>;
  setRank: Dispatch<SetStateAction<number | null>>;
  setTodaysBest: Dispatch<SetStateAction<number | null>>;
  setSubmitStatus: Dispatch<SetStateAction<'idle' | 'pending' | 'submitted' | 'unauth' | 'username_required' | 'network_error'>>;
}

export function useArcadeSession(
  opts: UseArcadeSessionOptions = {},
): ArcadeSession {
  const restartLockoutMs = opts.restartLockoutMs ?? 800;

  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState(0);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [landingView, setLandingView] = useState<LandingView>('title');
  const [paused, setPaused] = useState(false);
  const [pauseSelectedIndex, setPauseSelectedIndex] = useState(0);
  // pauseItems is currently a constant; the state wrapper is here so
  // future per-game-options support can swap it without changing the
  // ArcadeSession surface.
  const pauseItems = DEFAULT_PAUSE_ITEMS;

  const [gameoverPhase, setGameoverPhase] = useState<'reveal' | 'board'>('reveal');
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [todaysBest, setTodaysBest] = useState<number | null>(null);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'pending' | 'submitted' | 'unauth' | 'username_required' | 'network_error'
  >('idle');

  const gameOverAtRef = useRef(0);

  const markGameOver = useCallback((finalScore: number) => {
    gameOverAtRef.current = Date.now();
    setFinalScore(finalScore);
    setGameoverPhase('reveal');
    setHighlightIndex(null);
    setRank(null);
    setTodaysBest(null);
    setSubmitStatus('idle');
  }, []);

  const isRestartReady = useCallback(
    () => Date.now() - gameOverAtRef.current >= restartLockoutMs,
    [restartLockoutMs],
  );

  const handlePlayAgain = useCallback(() => {
    setFinalScore(null);
    setStarted(false);
    setLandingView('title');
    setSessionId((id) => id + 1);
    setGameoverPhase('reveal');
    setHighlightIndex(null);
    setRank(null);
    setTodaysBest(null);
    setSubmitStatus('idle');
    setPaused(false);
    setPauseSelectedIndex(0);
  }, []);

  /** Hard reset to landing. Same as handlePlayAgain but the call site
   *  is the pause menu's `MENU` action — semantically distinct (the
   *  player chose to abandon a run, not start a fresh one), so it gets
   *  its own name. Implementation is identical because both paths
   *  need the engine torn down + landingView reset. */
  const exitToLanding = useCallback(() => {
    setFinalScore(null);
    setStarted(false);
    setLandingView('title');
    setSessionId((id) => id + 1);
    setGameoverPhase('reveal');
    setHighlightIndex(null);
    setRank(null);
    setTodaysBest(null);
    setSubmitStatus('idle');
    setPaused(false);
    setPauseSelectedIndex(0);
  }, []);

  const toggleLandingView = useCallback(() => {
    setLandingView((v) => (v === 'title' ? 'scores' : 'title'));
  }, []);

  const togglePause = useCallback(() => {
    // Only honored mid-run. We can't pause the landing screen (no
    // engine to freeze) or the gameover flow (would race with
    // leaderboard submission). started + finalScore are read inside
    // the setter callback to avoid stale-closure bugs from
    // togglePause being captured at an old render.
    setPaused((wasPaused) => {
      if (wasPaused) return false;
      // About to open: reset selection to CONTINUE.
      setPauseSelectedIndex(0);
      return true;
    });
  }, []);

  const movePauseSelection = useCallback(
    (delta: -1 | 1) => {
      setPauseSelectedIndex((i) => {
        const n = pauseItems.length;
        return ((i + delta) % n + n) % n;
      });
    },
    [pauseItems.length],
  );

  const confirmPauseSelection = useCallback(() => {
    const item = pauseItems[pauseSelectedIndex];
    if (!item) return;
    if (item.id === 'continue') {
      setPaused(false);
      return;
    }
    if (item.id === 'menu') {
      exitToLanding();
      return;
    }
  }, [pauseItems, pauseSelectedIndex, exitToLanding]);

  const handleFireDown = useCallback(
    (inGameFire: () => void) => {
      if (!started) {
        setStarted(true);
        return;
      }
      if (finalScore !== null) {
        // Gameover routing now flows through the per-game adapter so
        // it can choose between submit-initials (entry phase) and
        // play-again (board phase) based on `gameoverPhase`. Falling
        // back to legacy behavior if the adapter doesn't intercept
        // (current asteroids/space-barrage both wire fire-down through
        // their own handler that owns the entry/board branching).
        if (isRestartReady()) handlePlayAgain();
        return;
      }
      inGameFire();
    },
    [started, finalScore, isRestartReady, handlePlayAgain],
  );

  // Derive `mode` from the existing flags. States are mutually
  // exclusive and ordered by precedence:
  //   - non-null `finalScore` always means gameover (even if the
  //     engine briefly re-emits before teardown);
  //   - `started=false` means landing;
  //   - `paused=true` (only reachable mid-run, since opening the
  //     menu requires started && !finalScore) means paused;
  //   - otherwise we're in playing.
  const mode: ArcadeMode =
    finalScore !== null ? 'gameover' :
    !started ? 'landing' :
    paused ? 'paused' :
    'playing';

  // ---- Auto-pause on window blur / tab hide --------------------------------
  // Classic-arcade-respectful UX: alt-tabbing or hiding the tab while
  // mid-run freezes the simulation in place. Only fires while
  // `mode === 'playing'` so we never spuriously open the menu on the
  // landing or gameover screens. `visibilitychange` covers tab hide;
  // `blur` covers focus loss without tab change (e.g. clicking into a
  // devtools panel). Both call `togglePause` which is idempotent (it
  // checks the current paused state).

  useEffect(() => {
    if (mode !== 'playing') return;
    const onHidden = () => {
      if (document.visibilityState === 'hidden') {
        // togglePause flips; we only want to OPEN, not toggle. Use
        // the setter directly with selection reset.
        setPauseSelectedIndex(0);
        setPaused(true);
      }
    };
    const onBlur = () => {
      setPauseSelectedIndex(0);
      setPaused(true);
    };
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('blur', onBlur);
    };
  }, [mode]);

  // ---- Reveal → board transition timer ------------------------------------

  useEffect(() => {
    if (mode !== 'gameover') return;
    if (gameoverPhase !== 'reveal') return;
    const t = setTimeout(() => setGameoverPhase('board'), 1500);
    return () => clearTimeout(t);
  }, [mode, gameoverPhase]);

  return {
    started,
    sessionId,
    finalScore,
    landingView,
    paused,
    pauseSelectedIndex,
    pauseItems,
    mode,
    setStarted,
    setSessionId,
    setFinalScore,
    setLandingView,
    gameOverAtRef,
    markGameOver,
    isRestartReady,
    handlePlayAgain,
    toggleLandingView,
    togglePause,
    movePauseSelection,
    confirmPauseSelection,
    exitToLanding,
    handleFireDown,
    gameoverPhase,
    highlightIndex,
    rank,
    todaysBest,
    submitStatus,
    setGameoverPhase,
    setHighlightIndex,
    setRank,
    setTodaysBest,
    setSubmitStatus,
  };
}

/** Minimal structural contract — each game's GameEngine class implements
 *  these. Avoids importing per-game types into shared code. */
export interface ArcadeKeyboardEngine {
  handleKeyDown: (keyCode: number) => void;
  handleKeyUp: (keyCode: number) => void;
}

export interface UseArcadeKeyboardOptions {
  engine: ArcadeKeyboardEngine | null;
  finalScore: number | null;
  /** Called when Space is pressed while the game-over screen is up. Each
   *  game wires this to `() => isRestartReady() && handlePlayAgain()`. */
  onSpaceWhenGameOver: () => void;
  /** True while the pause menu is open. Suppresses gameplay-key
   *  forwarding and routes Up/Down/W/S to `onPauseMove` and Space to
   *  `onPauseConfirm`. */
  paused?: boolean;
  /** Toggle pause menu — bound to Esc. Fires whenever Esc is pressed,
   *  regardless of mode; the session hook decides whether the toggle
   *  is meaningful (no-op outside playing/paused). */
  onPauseToggle?: () => void;
  /** Move pause-menu selection by ±1 with wraparound. Called on
   *  Up/Down/W/S while paused. */
  onPauseMove?: (delta: -1 | 1) => void;
  /** Confirm currently-selected pause-menu item. Called on Space
   *  while paused. */
  onPauseConfirm?: () => void;
}

/** Captured keys are intentionally hardcoded — both games today consume
 *  the same set (Space, arrows, WASD, Escape). preventDefault() on these
 *  stops the page from scrolling or browser shortcuts firing while the
 *  game is mounted. Escape is included so a stray Esc doesn't trigger
 *  browser-level fullscreen exits while the cabinet handles it. If a
 *  future game needs a different set, lift this to an option. */
const CAPTURED_KEYS = new Set([
  27,                  // Escape
  32,                  // Space
  37, 38, 39, 40,      // Arrows
  65, 68, 83, 87,      // A D S W
]);

/** Up-direction nav for the pause menu — Up arrow OR W. A/D are
 *  intentionally NOT bound (asteroids' rotate-left/right would
 *  otherwise cycle the menu by accident when the player reaches for
 *  them on resume). */
function isPauseUp(e: KeyboardEvent): boolean {
  return e.keyCode === 38 || e.keyCode === 87; // ArrowUp / W
}
/** Down-direction nav for the pause menu — Down arrow OR S. */
function isPauseDown(e: KeyboardEvent): boolean {
  return e.keyCode === 40 || e.keyCode === 83; // ArrowDown / S
}

/** Wires window keydown/keyup forwarding to the engine, with mode-
 *  aware routing:
 *   - `Esc` always toggles the pause menu (open mid-run, close while
 *     paused) — open path is no-op'd by the session hook on landing/
 *     gameover.
 *   - During gameover, Space restarts via `onSpaceWhenGameOver`, all
 *     other keys are dropped.
 *   - During pause, Space confirms via `onPauseConfirm`, Up/W and
 *     Down/S move selection via `onPauseMove`, all gameplay keys are
 *     dropped.
 *   - Otherwise (landing/playing), keys forward to the engine. */
export function useArcadeKeyboard(opts: UseArcadeKeyboardOptions): void {
  const {
    engine, finalScore, onSpaceWhenGameOver,
    paused = false,
    onPauseToggle,
    onPauseMove,
    onPauseConfirm,
  } = opts;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Esc is checked first — it's the global pause toggle and must
      // work regardless of mode (open during play, close during pause;
      // session hook quietly drops it on landing/gameover).
      if (e.keyCode === 27) {
        e.preventDefault();
        onPauseToggle?.();
        return;
      }
      if (paused) {
        if (CAPTURED_KEYS.has(e.keyCode)) e.preventDefault();
        if (e.keyCode === 32) {
          onPauseConfirm?.();
          return;
        }
        if (isPauseUp(e)) {
          onPauseMove?.(-1);
          return;
        }
        if (isPauseDown(e)) {
          onPauseMove?.(1);
          return;
        }
        // All other keys (A/D/etc) are intentionally dropped while
        // paused — gameplay must not advance, and we don't want
        // asteroids' rotate keys to scroll the menu.
        return;
      }
      if (finalScore !== null) {
        if (e.keyCode === 32) onSpaceWhenGameOver();
        return;
      }
      if (CAPTURED_KEYS.has(e.keyCode)) e.preventDefault();
      engine?.handleKeyDown(e.keyCode);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (finalScore !== null || paused) return;
      engine?.handleKeyUp(e.keyCode);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [
    engine, finalScore, onSpaceWhenGameOver,
    paused, onPauseToggle, onPauseMove, onPauseConfirm,
  ]);
}
