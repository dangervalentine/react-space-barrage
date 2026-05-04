import React, { useEffect, useRef, useState } from 'react';
import GameCanvas from './Components/GameCanvas';
import { TouchControls } from './Components/TouchControls';
import { LandingScreen } from './Components/LandingScreen';
import { GameEngine } from './engine/GameEngine';
import type { GameState } from './engine/types';
import styles from './App.module.css';

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
    engine?.handleKeyDown(32);
  };

  const handleFireUp = () => {
    engine?.handleKeyUp(32);
  };

  return (
    <div className={styles.container}>
      <div className={styles.screenBezel}>
        {started ? (
          <GameCanvas engine={engine} onUpdateRef={onUpdateRef} />
        ) : (
          <LandingScreen onStart={() => setStarted(true)} />
        )}
      </div>
      {started && <TouchControls engine={engine} />}
      {started && (
        <button
          className={styles.fireButton}
          onTouchStart={handleFireDown}
          onTouchEnd={handleFireUp}
          onMouseDown={handleFireDown}
          onMouseUp={handleFireUp}
        >
          ◆
        </button>
      )}
    </div>
  );
}
