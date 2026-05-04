import React, { useEffect, useState } from 'react';
import styles from './LandingScreen.module.css';

interface LandingScreenProps {
  onStart: () => void;
}

// 11x13 player ship + flame trail — mirror of SHIP_ROWS_A/B + FLAME_ROWS_A/B
// in engine/GameRenderer.ts. Flame chars (F/I/M/P) are uppercase to avoid
// colliding with ship chars (y=cockpit, w=highlight, g=engine glow).
//   F = yellow flame, I = white-hot core, M = pink mid, P = coral tail
const SHIP_FRAME_A = [
  '.....b.....',
  '....bbb....',
  '....byb....',
  '...bbybb...',
  '..ccbwbcc..',
  '.cccbbbccc.',
  'cccbbbbbccc',
  'ccbbbbbbbcc',
  '.ccbbbbbcc.',
  '....bbb....',
  '....p.p....',
  '....FIF....',
  '.....M.....',
];
const SHIP_FRAME_B = [
  '.....b.....',
  '....bbb....',
  '....byb....',
  '...bbybb...',
  '..ccbwbcc..',
  '.cccbbbccc.',
  'cccbbbbbccc',
  'ccbbbbbbbcc',
  '.ccbbbbbcc.',
  '....bbb....',
  '....g.g....',
  '....MFM....',
  '.....P.....',
];

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStart }) => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setFrame((f) => f + 1), 80);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.keyCode === 32 || e.key === 'Enter') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onStart]);

  return (
    <div
      className={styles.wrapper}
      onClick={onStart}
      onTouchStart={onStart}
      role="button"
      tabIndex={0}
    >
      <div className={styles.starfield} />
      <div className={styles.banner}>
        <div className={styles.titleStack}>
          <h1 className={styles.title}>SPACE</h1>
          <h1 className={styles.title}>BARRAGE</h1>
        </div>
        <p className={styles.subtitle}>★ INSERT COIN ★</p>

        <div className={styles.pixelArt} aria-hidden>
          {(frame % 2 === 0 ? SHIP_FRAME_A : SHIP_FRAME_B).flatMap((row, r) =>
            row.split('').map((ch, c) => (
              <span key={`${r}-${c}`} data-c={ch === '.' ? '' : ch} />
            ))
          )}
        </div>

        <div className={styles.controls}>
          <div className={styles.controlsDesktop}>
            <div className={styles.controlGroup}>
              <div className={styles.keyCluster}>
                <span className={styles.keycap}>W</span>
                <div className={styles.keyClusterRow}>
                  <span className={styles.keycap}>A</span>
                  <span className={styles.keycap}>S</span>
                  <span className={styles.keycap}>D</span>
                </div>
              </div>
              <span className={styles.label}>MOVE</span>
            </div>
            <div className={styles.controlGroup}>
              <div className={styles.keyCluster}>
                <span className={styles.spacer} aria-hidden />
                <span className={`${styles.keycap} ${styles.keycapWide}`}>SPACE</span>
              </div>
              <span className={styles.label}>FIRE</span>
            </div>
          </div>

          <div className={styles.controlsMobile}>
            <div className={styles.controlGroup}>
              <span className={styles.label}>MOVE</span>
              <span className={styles.joystick} aria-hidden />
            </div>
            <div className={styles.controlGroup}>
              <span className={styles.label}>FIRE</span>
              <span className={styles.fireDot} aria-hidden>◆</span>
            </div>
          </div>
        </div>

        <p className={styles.prompt}>PRESS START</p>
      </div>
    </div>
  );
};

export default LandingScreen;
