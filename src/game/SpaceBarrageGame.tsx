import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import GameCanvas from './GameCanvas';
import { TouchControls } from './TouchControls';
import { LandingA11yMirror } from './LandingA11yMirror';
import { GameoverA11yMirror } from './GameoverA11yMirror';
import { SpaceBarrageMarqueeArt } from './MarqueeArt';
import { GameEngine } from './engine/GameEngine';
import { Renderer } from './engine/Renderer';
import { getShipVariant, setShipVariant, SHIP_VARIANTS } from './shipVariant';
import {
  ArcadeCabinet,
  PauseA11yMirror,
  createTodaysBest,
  useArcadeKeyboard,
  useArcadeSession,
  type ArcadeFrame,
} from '@arcade';
import type { GameState } from './engine/types';
import styles from './App.module.css';
import './space-barrage.css';

// Module-scope today's-best helper for guests. Keyed per-game.
const todaysBest = createTodaysBest('arcade-space-barrage:todaysBest');

/** Idle game state read by the renderer's `drawLanding` when the
 *  engine isn't running (between sessions). The renderer's landing
 *  pass doesn't read entity arrays or ship position — they're empty
 *  stubs to satisfy the `ArcadeFrame<GameState>` envelope shape.
 *  After a gameover this ref gets overwritten with the engine's
 *  final-tick state, so the gameover backdrop freezes that frame. */
const IDLE_GAME_STATE: GameState = {
  score: 0,
  highScore: 0,
  lives: 3,
  shipX: 0,
  shipY: 0,
  velocityX: 0,
  velocityY: 0,
  isShipHit: false,
  // Far-past timestamp so the renderer's invuln-flicker check
  // doesn't trigger on the very first idle frame.
  lastHitTime: -10_000,
  enemies: [],
  shields: [],
  particles: [],
  bullets: [],
};


export default function SpaceBarrageGame() {
  const {
    started,
    sessionId,
    finalScore,
    mode,
    paused,
    pauseSelectedIndex,
    pauseItems,
    setFinalScore,
    handlePlayAgain,
    isRestartReady,
    markGameOver,
    handleFireDown,
    togglePause,
    movePauseSelection,
    confirmPauseSelection,
    // Gameover state
    gameoverPhase,
    highlightIndex,
    rank,
    todaysBest: todaysBestState,
    submitStatus,
    setTodaysBest: setTodaysBestState,
    setSubmitStatus,
  } = useArcadeSession();

  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [variantIndex, setVariantIndex] = useState(() =>
    Math.max(0, SHIP_VARIANTS.indexOf(getShipVariant())),
  );

  // Picker is only mounted on the landing screen; engine doesn't exist
  // yet — so we just persist + bump the index. When the engine
  // constructor reads `getShipVariant()` it inherits whatever the
  // player picked. UP-only cycling — wraps around at the end.
  const cycleVariant = useCallback(() => {
    setVariantIndex((i) => {
      const next = (i + 1) % SHIP_VARIANTS.length;
      setShipVariant(SHIP_VARIANTS[next]);
      return next;
    });
  }, []);

  const onLandingUp = useCallback(() => {
    cycleVariant();
  }, [cycleVariant]);

  const wasShipHitRef = useRef(false);
  const latestScoreRef = useRef(0);
  /** Last engine-emitted game state. Read by the landing-mode and
   *  gameover-mode self-RAFs to fill `frame.game` (drawLanding ignores
   *  entities; drawGameover paints the frozen last gameplay frame as
   *  backdrop). Initialized to IDLE_GAME_STATE so the very first
   *  landing tick — before any engine has run — has something to read. */
  const lastGameStateRef = useRef<GameState>(IDLE_GAME_STATE);
  /** Synced to `mode`. Read inside the engine onUpdate to short-circuit
   *  emissions once the session has flipped to 'gameover' — prevents a
   *  race where the engine's last tick (which set `isShipHit=true`)
   *  re-emits a 'playing' frame envelope after the gameover self-RAF
   *  is already painting. */
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  // Frame-envelope sink. ArcadeCanvas reassigns `current` to a fn
  // that forwards each frame to `renderer.drawFrame`. Engine
  // emissions wrap their state in a `mode: 'playing'` envelope below;
  // the landing-mode and gameover-mode self-RAFs further down
  // synthesize their respective envelopes when the engine isn't driving.
  const onUpdateRef = useRef<(frame: ArcadeFrame<GameState>) => void>(() => {});

  // Ref to the active renderer — populated via the onRendererReady callback
  // from GameCanvas.
  const rendererRef = useRef<Renderer | null>(null);

  const handleRendererReady = useCallback((r: Renderer) => {
    rendererRef.current = r;
  }, []);

  // ---- Engine creation -------------------------------------------------------
  // Gated on `started && finalScore === null` rather than `mode === 'playing'`
  // so the engine stays ALIVE while paused — pause toggles call
  // `engine.pause()` / `engine.resume()` from a separate effect below.
  // If we re-keyed on mode here, every pause would tear the engine down,
  // and the next resume would call `engine.start()` which re-initializes
  // the ship + wave manager, effectively restarting the run.

  useEffect(() => {
    if (!started || finalScore !== null) return;
    wasShipHitRef.current = false;
    latestScoreRef.current = 0;
    // Hard-reset the frozen-frame ref so any landing/paused/gameover
    // self-RAF that runs before the new engine's first emission reads
    // a clean idle state instead of the previous run's last-tick
    // entities. The renderer's prepareForFreshSession below also
    // wipes any pixel residue from prior modes.
    lastGameStateRef.current = IDLE_GAME_STATE;
    rendererRef.current?.prepareForFreshSession();

    const newEngine = new GameEngine((state) => {
      latestScoreRef.current = state.score;
      lastGameStateRef.current = state;
      if (state.isShipHit && !wasShipHitRef.current) {
        wasShipHitRef.current = true;
        const score = latestScoreRef.current;
        markGameOver(score);
        setFinalScore(score);
      }
      if (modeRef.current !== 'playing') return;
      onUpdateRef.current({
        mode: 'playing',
        game: state,
        ui: { mode: 'playing' },
      });
    });
    setEngine(newEngine);
    newEngine.start();

    return () => {
      newEngine.stop();
    };
  }, [started, finalScore, sessionId, markGameOver, setFinalScore]);

  // ---- Pause/resume ---------------------------------------------------------
  // Watch `paused` state and forward to the engine, but ONLY while a
  // run is alive. Without this mode-gate, resetting via the MENU
  // action would race: (1) paused flips false alongside started
  // false in one render, (2) the engine creation effect's cleanup
  // stops the engine, then (3) this effect immediately re-starts it
  // via engine.resume() — leaking a RAF until next render.
  useEffect(() => {
    if (!engine) return;
    if (!started || finalScore !== null) return;
    if (paused) engine.pause();
    else engine.resume();
  }, [engine, paused, started, finalScore]);

  // ---- Gameover: record today's-best (localStorage only) ---------------------

  useEffect(() => {
    if (mode !== 'gameover' || finalScore === null) return;
    todaysBest.set(finalScore);
    const tb = todaysBest.get();
    setTodaysBestState(tb?.score ?? null);
    setSubmitStatus('idle');
  }, [mode, finalScore, setTodaysBestState, setSubmitStatus]);

  // ---- Landing-mode self-RAF -------------------------------------------------

  useEffect(() => {
    if (mode !== 'landing') return;

    let raf = 0;
    const tick = () => {
      onUpdateRef.current({
        mode: 'landing',
        game: lastGameStateRef.current,
        ui: {
          mode: 'landing',
          view: 'title',
          pickerIndex: variantIndex,
        },
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode, variantIndex]);

  // ---- Landing-mode keyboard -------------------------------------------------
  // Control mapping:
  //   SPACE / Enter  → start
  //   W / ArrowUp    → cycle ship variant

  useEffect(() => {
    if (mode !== 'landing') return;

    const handle = (e: KeyboardEvent) => {
      if (e.keyCode === 32 || e.key === 'Enter') {
        e.preventDefault();
        handleFireDown(() => {});
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        onLandingUp();
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [mode, handleFireDown, onLandingUp]);

  // ---- Pause-mode self-RAF ---------------------------------------------------

  useEffect(() => {
    if (mode !== 'paused') return;
    let raf = 0;
    const tick = () => {
      onUpdateRef.current({
        mode: 'paused',
        game: lastGameStateRef.current,
        ui: {
          mode: 'paused',
          items: pauseItems,
          selectedIndex: pauseSelectedIndex,
        },
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode, pauseItems, pauseSelectedIndex]);

  // ---- Gameover-mode self-RAF ------------------------------------------------

  useEffect(() => {
    if (mode !== 'gameover' || finalScore === null) return;

    let raf = 0;
    const tick = () => {
      onUpdateRef.current({
        mode: 'gameover',
        game: lastGameStateRef.current,
        ui: {
          mode: 'gameover',
          phase: gameoverPhase,
          finalScore,
          highlightIndex,
          rank,
          todaysBest: todaysBestState,
          submitStatus,
        },
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [
    mode,
    finalScore,
    gameoverPhase,
    highlightIndex,
    rank,
    todaysBestState,
    submitStatus,
  ]);

  // ---- Phase-aware Space handler (board phase → play again) ------------------

  const onSpaceWhenGameOver = useCallback(() => {
    if (isRestartReady()) {
      handlePlayAgain();
    }
  }, [isRestartReady, handlePlayAgain]);

  useArcadeKeyboard({
    engine,
    finalScore,
    onSpaceWhenGameOver,
    paused,
    onPauseToggle: togglePause,
    onPauseMove: movePauseSelection,
    onPauseConfirm: confirmPauseSelection,
  });

  // ---- FIRE button -----------------------------------------------------------
  // Mobile FIRE doubles as the pause-menu confirm while paused
  // (CONTINUE resumes; MENU resets to landing). Outside paused mode
  // it routes through `handleFireDown` like before.

  const onFireButton = useCallback(() => {
    if (paused) {
      confirmPauseSelection();
      return;
    }
    handleFireDown(() => engine?.handleKeyDown(32));
  }, [paused, confirmPauseSelection, handleFireDown, engine]);

  // ---- Mobile flick routing --------------------------------------------------
  // Joystick flicks are repurposed by mode:
  //   landing — UP cycles ship variant
  //   paused  — UP/DOWN move the pause-menu selection
  //   playing — undefined (analog joystick drives the ship continuously)

  const onUpFlick =
    mode === 'paused' ? () => movePauseSelection(-1)
    : mode === 'landing' ? onLandingUp
    : undefined;
  const onDownFlick =
    mode === 'paused' ? () => movePauseSelection(1)
    : undefined;

  // ---- Render ----------------------------------------------------------------

  return (
    <ArcadeCabinet
      marqueeText="SPACE BARRAGE"
      marqueeDecoration={<SpaceBarrageMarqueeArt className={styles.marqueeArt} />}
      isPlayMode={mode === 'playing' || mode === 'paused'}
      isPaused={mode === 'paused'}
      onPauseToggle={togglePause}
      controlsSlot={
        <TouchControls
          engine={engine}
          onFireDown={onFireButton}
          onFireUp={() => engine?.handleKeyUp(32)}
          onUpFlick={onUpFlick}
          onDownFlick={onDownFlick}
        />
      }
    >
      {/* Canvas wrapper — width/height 100% so
          `<canvas style={width:100%; height:100%}>` fills the screen
          bezel; without this, the canvas collapses to its intrinsic
          300×150 default and the bezel shows empty bg around it.
          The leaderboard nav used to be an absolute-positioned Link
          overlay here — replaced by the cabinet's UP control on the
          scores view (see `onLandingUp` above). */}
      <div style={{ width: '100%', height: '100%' }}>
        <GameCanvas
          engine={engine}
          onUpdateRef={onUpdateRef}
          onRendererReady={handleRendererReady}
        />
      </div>

      {/* Visually-hidden DOM mirrors for screen readers. */}
      {mode === 'landing' && (
        <LandingA11yMirror
          view="title"
          boardEntries={null}
        />
      )}
      {mode === 'paused' && (
        <PauseA11yMirror
          gameLabel="Space Barrage"
          items={pauseItems}
          selectedIndex={pauseSelectedIndex}
        />
      )}
      {mode === 'gameover' && finalScore !== null && (
        <GameoverA11yMirror
          ui={{
            mode: 'gameover',
            phase: gameoverPhase,
            finalScore,
            highlightIndex,
            rank,
            todaysBest: todaysBestState,
            submitStatus,
          }}
          boardEntries={null}
        />
      )}
    </ArcadeCabinet>
  );
}
