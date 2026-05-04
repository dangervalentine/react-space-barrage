import React, { useEffect, useRef, useState } from 'react';
import GameCanvas from './Components/GameCanvas';
import { TouchControls } from './Components/TouchControls';
import { LandingScreen } from './Components/LandingScreen';
import { GameOverScreen } from './Components/GameOverScreen';
import { GameEngine } from './engine/GameEngine';
import type { GameState } from './engine/types';
import styles from './App.module.css';

// Mirror of ENEMY_ROWS in engine/GameRenderer.ts (11x7 pixel-art enemy).
const MARQUEE_ENEMY_ROWS = [
  '.....y.....',
  '....yby....',
  '...ybbby...',
  '..cbbbbbc..',
  '.ccwbbbwcc.',
  'c.c.yby.c.c',
  '....g.g....',
];

const MarqueeEnemy = () => (
  <span className={styles.marqueeEnemy} aria-hidden>
    {MARQUEE_ENEMY_ROWS.flatMap((row, r) =>
      row.split('').map((ch, c) => (
        <span key={`${r}-${c}`} data-c={ch === '.' ? '' : ch} />
      ))
    )}
  </span>
);

export default function App() {
  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState(0);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const wasShipHitRef = useRef(false);
  const latestScoreRef = useRef(0);
  const onUpdateRef = useRef<(state: GameState) => void>(() => {
    // Placeholder - will be set by GameCanvas
  });

  useEffect(() => {
    if (!started) return;
    wasShipHitRef.current = false;
    latestScoreRef.current = 0;

    const newEngine = new GameEngine((state) => {
      latestScoreRef.current = state.score;
      if (state.isShipHit && !wasShipHitRef.current) {
        wasShipHitRef.current = true;
        setFinalScore(latestScoreRef.current);
      }
      onUpdateRef.current(state);
    });
    setEngine(newEngine);
    newEngine.start();

    return () => {
      newEngine.stop();
    };
  }, [started, sessionId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.keyCode === 32) e.preventDefault();
      if (e.keyCode === 32 && finalScore !== null) {
        handlePlayAgain();
        return;
      }
      engine?.handleKeyDown(e.keyCode);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      engine?.handleKeyUp(e.keyCode);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engine, finalScore]);

  const handlePlayAgain = () => {
    setFinalScore(null);
    setSessionId((id) => id + 1);
  };

  const handleFireDown = () => {
    if (!started) {
      setStarted(true);
      return;
    }
    if (finalScore !== null) {
      handlePlayAgain();
      return;
    }
    engine?.handleKeyDown(32);
  };

  const handleFireUp = () => {
    engine?.handleKeyUp(32);
  };

  return (
    <div className={styles.container}>
      <div className={styles.marquee} aria-hidden="true">
        <MarqueeEnemy />
        <span className={styles.marqueeText}>SPACE BARRAGE</span>
        <MarqueeEnemy />
      </div>
      <div className={styles.screenBezel}>
        {!started ? (
          <LandingScreen onStart={() => setStarted(true)} />
        ) : finalScore !== null ? (
          <GameOverScreen score={finalScore} onPlayAgain={handlePlayAgain} />
        ) : (
          <GameCanvas engine={engine} onUpdateRef={onUpdateRef} />
        )}
      </div>
      <div className={styles.cabinetDeck} aria-hidden="true">
        <div className={styles.coinSlot}>
          <div className={styles.coinSlotMouth} />
        </div>
      </div>
      <div className={styles.controlPanel}>
        <span className={styles.rivet} style={{ top: 8, left: 8 }} />
        <span className={styles.rivet} style={{ top: 8, right: 8 }} />
        <span className={styles.rivet} style={{ bottom: 8, left: 8 }} />
        <span className={styles.rivet} style={{ bottom: 8, right: 8 }} />
        <div className={styles.controlSlot}>
          <TouchControls engine={engine} />
        </div>
        <div className={styles.controlSlot}>
          <button
            className={styles.fireButton}
            onTouchStart={handleFireDown}
            onTouchEnd={handleFireUp}
            onMouseDown={handleFireDown}
            onMouseUp={handleFireUp}
            aria-label="Fire"
          />
        </div>
      </div>
      <div className={styles.cabinetBase} aria-hidden="true" />
    </div>
  );
}
