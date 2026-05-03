import React from 'react';
import styles from './Lives.module.css';

interface LivesProps {
  lives: number;
}

export default function Lives({ lives }: LivesProps) {
  return (
    <div className={styles.lives}>
      LIVES: {lives}
    </div>
  );
}
