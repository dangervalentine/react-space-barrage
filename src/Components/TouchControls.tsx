import React from 'react';
import { GameEngine } from '../engine/GameEngine';
import { KEYS } from '../engine/types';
import styles from './TouchControls.module.css';

interface TouchControlsProps {
  engine: GameEngine | null;
}

export const TouchControls = ({ engine }: TouchControlsProps) => {
  const handleTouchStart = (keyCode: number) => (e: React.TouchEvent) => {
    e.preventDefault();
    engine?.handleKeyDown(keyCode);
  };

  const handleTouchEnd = (keyCode: number) => (e: React.TouchEvent) => {
    e.preventDefault();
    engine?.handleKeyUp(keyCode);
  };

  const handleMouseDown = (keyCode: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    engine?.handleKeyDown(keyCode);
  };

  const handleMouseUp = (keyCode: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    engine?.handleKeyUp(keyCode);
  };

  return (
    <div className={styles.container}>
      <div className={styles.dpad}>
        <button
          className={`${styles.button} ${styles.up}`}
          onTouchStart={handleTouchStart(KEYS.UP)}
          onTouchEnd={handleTouchEnd(KEYS.UP)}
          onMouseDown={handleMouseDown(KEYS.UP)}
          onMouseUp={handleMouseUp(KEYS.UP)}
          onMouseLeave={handleMouseUp(KEYS.UP)}
          aria-label="Up"
        >
          ▲
        </button>
        <div className={styles.row}>
          <button
            className={`${styles.button} ${styles.left}`}
            onTouchStart={handleTouchStart(KEYS.LEFT)}
            onTouchEnd={handleTouchEnd(KEYS.LEFT)}
            onMouseDown={handleMouseDown(KEYS.LEFT)}
            onMouseUp={handleMouseUp(KEYS.LEFT)}
            onMouseLeave={handleMouseUp(KEYS.LEFT)}
            aria-label="Left"
          >
            ◀
          </button>
          <button
            className={`${styles.button} ${styles.down}`}
            onTouchStart={handleTouchStart(KEYS.DOWN)}
            onTouchEnd={handleTouchEnd(KEYS.DOWN)}
            onMouseDown={handleMouseDown(KEYS.DOWN)}
            onMouseUp={handleMouseUp(KEYS.DOWN)}
            onMouseLeave={handleMouseUp(KEYS.DOWN)}
            aria-label="Down"
          >
            ▼
          </button>
          <button
            className={`${styles.button} ${styles.right}`}
            onTouchStart={handleTouchStart(KEYS.RIGHT)}
            onTouchEnd={handleTouchEnd(KEYS.RIGHT)}
            onMouseDown={handleMouseDown(KEYS.RIGHT)}
            onMouseUp={handleMouseUp(KEYS.RIGHT)}
            onMouseLeave={handleMouseUp(KEYS.RIGHT)}
            aria-label="Right"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};
