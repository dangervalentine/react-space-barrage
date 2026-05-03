import React from 'react';
import { useGameContext } from '../Context';
import styles from './Score.module.css';

export default function Score() {
  const { score } = useGameContext();
  return <div className={styles.score}>{score}</div>;
}
