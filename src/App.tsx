import React, { useState, useEffect, useRef } from 'react';
import Screen from './Components/Screen';
import { Provider } from './Context';
import { GameEngine } from './engine/GameEngine';
import type { GameState } from './engine/types';
import styles from './App.module.css';

const initialState: GameState = {
  score: 0,
  shipX: 490,
  rVelocity: 0,
  lVelocity: 0,
  isShipHit: false,
  enemies: [],
};

export default function App() {
  const [state, setState] = useState<GameState>(initialState);
  const engineRef = useRef<GameEngine | null>(null);

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
    const handleKeyPress = (e: KeyboardEvent) => {
      engineRef.current?.handleKey(e.keyCode);
    };
    window.addEventListener('keydown', handleKeyPress);

    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <Provider value={state}>
      <div className={styles.container}>
        <Screen isShipHit={state.isShipHit} />
      </div>
    </Provider>
  );
}
