import React from 'react';
import shield from '../Assets/shield.svg';
import styles from './Shield.module.css';

interface ShieldProps {
  x: number;
  y: number;
}

const Shield = React.memo(({ x, y }: ShieldProps) => (
  <div
    className={styles.shield}
    style={{
      left: `${x}px`,
      top: `${y}px`,
    }}
  >
    <img src={shield} alt="Shield" />
  </div>
));

Shield.displayName = 'Shield';
export default Shield;
