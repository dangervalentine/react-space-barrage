import React from 'react';
import {
  JoystickCanvas,
  type JoystickState,
} from '@arcade';
import cabinet from '@arcade/cabinet.module.css';
import { GameEngine } from './engine/GameEngine';
import styles from './App.module.css';

interface TouchControlsProps {
  engine: GameEngine | null;
  /** Called on button press / mouse-down. The Game owns the routing
   *  — landing flips `started`, gameover entry submits initials,
   *  gameover board plays again, in-game presses Space. */
  onFireDown: () => void;
  /** Called on button release / mouse-up — for hold-to-fire mechanics
   *  (space-barrage's fire is auto-repeating while the button is held;
   *  the engine treats space release as `handleKeyUp(32)`). */
  onFireUp: () => void;
  onDownFlick?: () => void;
  onLeftFlick?: () => void;
  onRightFlick?: () => void;
  /** Up-flick — used during gameover entry phase to cycle the active
   *  letter cell upward (Z direction). Optional because in-game and
   *  landing modes don't bind it. */
  onUpFlick?: () => void;
}

const MAX_VELOCITY = 500;

export const TouchControls = ({
  engine,
  onFireDown,
  onFireUp,
  onDownFlick,
  onLeftFlick,
  onRightFlick,
  onUpFlick,
}: TouchControlsProps) => {
  const handleChange = (s: JoystickState) => {
    if (s.magnitude === 0) {
      engine?.setAnalogVelocity(0, 0);
      return;
    }
    const vx = Math.cos(s.angle) * s.magnitude * MAX_VELOCITY;
    const vy = Math.sin(s.angle) * s.magnitude * MAX_VELOCITY;
    engine?.setAnalogVelocity(vx, vy);
  };
  return (
    <div className={styles.touchControls}>
      <JoystickCanvas
        onChange={handleChange}
        onDownFlick={onDownFlick}
        onLeftFlick={onLeftFlick}
        onRightFlick={onRightFlick}
        onUpFlick={onUpFlick}
      />
      <button
        className={cabinet.actionButton}
        onTouchStart={onFireDown}
        onTouchEnd={onFireUp}
        onMouseDown={onFireDown}
        onMouseUp={onFireUp}
        aria-label="Fire"
      />
    </div>
  );
};
