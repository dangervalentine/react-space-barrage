import React, { useEffect, useState } from 'react';
import { updateHighScore } from '../utils/storage';
import styles from './GameOver.module.css';

interface GameOverProps {
  score: number;
  highScore: number;
}

function GameOver({ score, highScore }: GameOverProps) {
  const [displayHighScore, setDisplayHighScore] = useState(highScore);
  const [isNewRecord, setIsNewRecord] = useState(false);

  useEffect(() => {
    const newHighScore = updateHighScore(score);
    setDisplayHighScore(newHighScore);
    setIsNewRecord(newHighScore > highScore);
  }, [score, highScore]);

  return (
    <div className={styles.gameOver}>
      <div className={styles.title}>GAME OVER</div>
      <div className={styles.scores}>
        <div>SCORE: {score}</div>
        <div className={isNewRecord ? styles.newRecord : ''}>
          HIGH: {displayHighScore}
          {isNewRecord && <span className={styles.recordText}> ★ NEW ★</span>}
        </div>
      </div>
      <br />
      <span>press SPACE to reset</span>
    </div>
  );
}

GameOver.displayName = 'GameOver';
export default GameOver;
