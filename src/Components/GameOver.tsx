import React from 'react';
import styles from './GameOver.module.css';

function GameOver() {
  return (
    <div className={styles.gameOver}>
      <div>GAME OVER</div>
      <br />
      <span>press SPACE to reset</span>
    </div>
  );
}

GameOver.displayName = 'GameOver';
export default GameOver;
