import React, { useState, useEffect, useRef } from 'react';
import Screen from './Components/Screen';
import { TouchControls } from './Components/TouchControls';
import { Provider } from './Context';
import { GameEngine } from './engine/GameEngine';
import type { GameState } from './engine/types';
import { getHighScore } from './utils/storage';
import styles from './App.module.css';

const getInitialState = (): GameState => ({
  score: 0,
  highScore: getHighScore(),
  lives: 3,
  shipX: 490,
  shipY: 700,
  velocityX: 0,
  velocityY: 0,
  isShipHit: false,
  lastHitTime: performance.now() - 2000,
  enemies: [],
  shields: [],
  particles: [],
});

export default function App() {
  const [state, setState] = useState<GameState>(getInitialState);
  const engineRef = useRef<GameEngine | null>(null);
  const screenBezelRef = useRef<HTMLDivElement>(null);

  console.log(`App render: ${state.enemies.length} enemies, isShipHit=${state.isShipHit}`);

  useEffect(() => {
    console.log('App mounted, starting engine');
    const engine = new GameEngine((newState) => {
      console.log(`Engine update: ${newState.enemies.length} enemies`);
      setState(newState);
    });
    engineRef.current = engine;
    engine.start();

    return () => {
      console.log('App unmounting, stopping engine');
      engine.stop();
    };
  }, []);

  useEffect(() => {
    const updateScale = () => {
      if (screenBezelRef.current) {
        const rect = screenBezelRef.current.getBoundingClientRect();
        const scale = rect.width / 1080;
        document.documentElement.style.setProperty('--game-scale', scale.toString());
      }
    };

    updateScale();
    const resizeObserver = new ResizeObserver(updateScale);
    if (screenBezelRef.current) {
      resizeObserver.observe(screenBezelRef.current);
    }

    window.addEventListener('resize', updateScale);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.keyCode === 32) e.preventDefault();
      engineRef.current?.handleKeyDown(e.keyCode);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      engineRef.current?.handleKeyUp(e.keyCode);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <Provider value={state}>
      <div className={styles.container}>
        <div className={styles.screenBezel} ref={screenBezelRef}>
          <Screen isShipHit={state.isShipHit} engine={engineRef.current} />
        </div>
        <TouchControls engine={engineRef.current} />
      </div>
    </Provider>
  );
}
