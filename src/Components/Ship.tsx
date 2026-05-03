import React from 'react';
import { useGameContext } from '../Context';
import rocket from '../Assets/rocket.svg';
import fire from '../Assets/fire.svg';
import styles from './Ship.module.css';

const Ship = React.memo(() => {
  const { shipX, rVelocity, lVelocity } = useGameContext();
  const rotate = (rVelocity + lVelocity) * 2.5;

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
        style={{ backgroundImage: `url(${fire})` }}
      />
    </div>
  );
});

Ship.displayName = 'Ship';
export default Ship;
