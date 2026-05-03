import React from 'react';
import Container from './Container';
import GameOver from './GameOver';
import styles from './Screen.module.css';

interface ScreenProps {
  isShipHit: boolean;
}

const Screen = React.memo(
  ({ isShipHit }: ScreenProps) => (
    <div className={styles.screen}>
      {isShipHit && <GameOver />}
      <Container />
    </div>
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
