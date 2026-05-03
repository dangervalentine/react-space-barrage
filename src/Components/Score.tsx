import React from 'react';
import { useGameContext } from '../Context';
import styles from './Score.module.css';

export default function Score() {
  const { score, highScore } = useGameContext();
  return (
    <div className={styles.scoreContainer}>
      <div className={styles.score}>{score}</div>
      {highScore > 0 && <div className={styles.highScore}>HI {highScore}</div>}
    </div>
  );
}
