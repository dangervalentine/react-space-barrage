import React from 'react';
import Container from './Container';
import GameOver from './GameOver';
import { TouchControls } from './TouchControls';
import { GameEngine } from '../engine/GameEngine';
import { useGameContext } from '../Context';
import styles from './Screen.module.css';

interface ScreenProps {
  isShipHit: boolean;
  engine: GameEngine | null;
}

const ScreenContent = ({ isShipHit, engine }: ScreenProps) => {
  const { score, highScore } = useGameContext();

  return (
    <div className={styles.screen}>
      {isShipHit && <GameOver score={score} highScore={highScore} />}
      <Container />
      <TouchControls engine={engine} />
    </div>
  );
};

const Screen = React.memo(
  ({ isShipHit, engine }: ScreenProps) => (
    <ScreenContent isShipHit={isShipHit} engine={engine} />
  ),
  (prev, next) => {
    if (next.isShipHit && !prev.isShipHit) {
      return false;
    }
    return prev.isShipHit === next.isShipHit;
  }
);

Screen.displayName = 'Screen';
export default Screen;
