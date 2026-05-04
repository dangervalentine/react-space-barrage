import React from 'react';
import styles from './Guide.module.css';

function Guide() {
  return (
    <div className={styles.guide}>
      <div className={styles.keyGroup}>
        <div className={styles.topRow}>
          <span className={styles.keycap}>W</span>
        </div>
        <div className={styles.bottomRow}>
          <span className={styles.keycap}>A</span>
          <span className={styles.keycap}>S</span>
          <span className={styles.keycap}>D</span>
        </div>
      </div>
      <span className={styles.separator}>or</span>
      <div className={styles.keyGroup}>
        <div className={styles.topRow}>
          <span className={styles.keycap}>↑</span>
        </div>
        <div className={styles.bottomRow}>
          <span className={styles.keycap}>←</span>
          <span className={styles.keycap}>↓</span>
          <span className={styles.keycap}>→</span>
        </div>
      </div>
    </div>
  );
}

Guide.displayName = 'Guide';
export default Guide;
