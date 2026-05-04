import React from 'react';
import { GameEngine } from '../engine/GameEngine';
import { KEYS } from '../engine/types';
import styles from './TouchControls.module.css';

interface TouchControlsProps {
  engine: GameEngine | null;
}

export const TouchControls = ({ engine }: TouchControlsProps) => {
  const handleMultiKeyDown = (keyCodes: number[]) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    keyCodes.forEach(code => engine?.handleKeyDown(code));
  };

  const handleMultiKeyUp = (keyCodes: number[]) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    keyCodes.forEach(code => engine?.handleKeyUp(code));
  };

  const createButton = (label: string, keyCodes: number[], className: string) => (
    <button
      className={`${styles.button} ${className}`}
      onTouchStart={handleMultiKeyDown(keyCodes)}
      onTouchEnd={handleMultiKeyUp(keyCodes)}
      onMouseDown={handleMultiKeyDown(keyCodes)}
      onMouseUp={handleMultiKeyUp(keyCodes)}
      onMouseLeave={handleMultiKeyUp(keyCodes)}
      aria-label={`Direction ${label}`}
    >
      {label}
    </button>
  );

  return (
    <div className={styles.container}>
      <div className={styles.joystick}>
        <div className={styles.row}>
          {createButton('↖', [KEYS.UP, KEYS.LEFT], styles.upLeft)}
          {createButton('↑', [KEYS.UP], styles.up)}
          {createButton('↗', [KEYS.UP, KEYS.RIGHT], styles.upRight)}
        </div>
        <div className={styles.row}>
          {createButton('←', [KEYS.LEFT], styles.left)}
          <div className={styles.center} />
          {createButton('→', [KEYS.RIGHT], styles.right)}
        </div>
        <div className={styles.row}>
          {createButton('↙', [KEYS.DOWN, KEYS.LEFT], styles.downLeft)}
          {createButton('↓', [KEYS.DOWN], styles.down)}
          {createButton('↘', [KEYS.DOWN, KEYS.RIGHT], styles.downRight)}
        </div>
      </div>
    </div>
  );
};
