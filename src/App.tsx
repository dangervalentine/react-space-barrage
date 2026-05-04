import React, { useEffect, useRef, useState } from 'react';
import GameCanvas from './Components/GameCanvas';
import { TouchControls } from './Components/TouchControls';
import { LandingScreen } from './Components/LandingScreen';
import { GameEngine } from './engine/GameEngine';
import type { GameState } from './engine/types';
import styles from './App.module.css';

// Mirror of ENEMY_ROWS in engine/GameRenderer.ts (11x7 pixel-art enemy).
const MARQUEE_ENEMY_ROWS = [
  '.....y.....',
  '....yby....',
  '...ybbby...',
  '..cbbbbbbc.',
  '.ccwbbbbwcc',
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
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const onUpdateRef = useRef<(state: GameState) => void>(() => {
    // Placeholder - will be set by GameCanvas
  });

  useEffect(() => {
    if (!started) return;
    console.log('App mounted, starting engine');
    const newEngine = new GameEngine((state) => {
      onUpdateRef.current(state);
    });
    setEngine(newEngine);
    newEngine.start();

    return () => {
      console.log('App unmounting, stopping engine');
      newEngine.stop();
    };
  }, [started]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.keyCode === 32) e.preventDefault();
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
  }, [engine]);

  const handleFireDown = () => {
    if (!started) {
      setStarted(true);
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
        {started ? (
          <GameCanvas engine={engine} onUpdateRef={onUpdateRef} />
        ) : (
          <LandingScreen onStart={() => setStarted(true)} />
        )}
      </div>
      <div className={styles.controlPanel}>
        <span className={styles.rivet} style={{ top: 8, left: 8 }} />
        <span className={styles.rivet} style={{ top: 8, right: 8 }} />
        <span className={styles.rivet} style={{ bottom: 8, left: 8 }} />
        <span className={styles.rivet} style={{ bottom: 8, right: 8 }} />
        <div className={styles.controlSlot}>
          <TouchControls engine={engine} />
          <span className={styles.controlLabel}>MOVE</span>
        </div>
        <div className={styles.controlSlot}>
          <button
            className={styles.fireButton}
            onTouchStart={handleFireDown}
            onTouchEnd={handleFireUp}
            onMouseDown={handleFireDown}
            onMouseUp={handleFireUp}
            aria-label="Fire"
          >
            <span className={styles.fireGlyph}>◆</span>
          </button>
          <span className={styles.controlLabel}>FIRE</span>
        </div>
      </div>
    </div>
  );
}
