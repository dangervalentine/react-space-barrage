import React from 'react';
import styles from './Guide.module.css';

function Guide() {
  return (
    <div className={styles.guide}>
      <span className={styles.keycap}>A</span>
      and
      <span className={styles.keycap}>D</span>
      or
      <span className={styles.keycap}>←</span>
      and
      <span className={styles.keycap}>→</span>
    </div>
  );
}

Guide.displayName = 'Guide';
export default Guide;
