import React from 'react';
import { useGameContext } from '../Context';
import rocket from '../Assets/rocket.svg';
import fire from '../Assets/fire.svg';
import styles from './Ship.module.css';

const Ship = React.memo(() => {
  const { shipX, velocity } = useGameContext();
  const rotate = (velocity / 500) * 30;
  const baseScale = 0.3;
  const velocityScale = Math.max(baseScale, Math.min(Math.abs(velocity) / 500, 1));

  return (
    <div
      className={`${styles.shipContainer} Ship`}
      style={{
        left: `${shipX}px`,
        transform: `translate(-50%, 0%) rotate(${rotate}deg)`,
      }}
    >
      <div
        className={styles.ship}
        style={{ backgroundImage: `url(${rocket})` }}
      />
      <div
        className={styles.fire}
        style={{
          backgroundImage: `url(${fire})`,
          transform: `scaleX(${velocityScale}) scaleY(${velocityScale})`,
          transformOrigin: 'top center',
        }}
      />
    </div>
  );
});

Ship.displayName = 'Ship';
export default Ship;
