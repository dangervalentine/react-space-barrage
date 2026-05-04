import React, { useEffect } from 'react';
import styles from './LandingScreen.module.css';

interface LandingScreenProps {
  onStart: () => void;
}

// 11x7 pixel-art ship made of colored cells. '.' is empty.
const SHIP_ROWS = [
  '.....y.....',
  '....ypy....',
  '...ypppy...',
  '..cppppppc.',
  '.ccwppppwcc',
  'c.c.ypy.c.c',
  '....g.g....',
];

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStart }) => {
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
          <p className={styles.subtitle}>★ INSERT COIN ★</p>
        </div>

        <div className={styles.pixelArt} aria-hidden>
          {SHIP_ROWS.flatMap((row, r) =>
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
