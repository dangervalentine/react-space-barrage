import React from 'react';
import { useGameContext } from '../Context';
import rocket from '../Assets/rocket.svg';
import fire from '../Assets/fire.svg';
import styles from './Ship.module.css';

const Ship = React.memo(() => {
  const { shipX, shipY, velocityX, velocityY, lastHitTime } = useGameContext();
  const rotate = (velocityX / 500) * 30;
  const baseScale = 0.4;
  const velocityMagnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
  const velocityScale = Math.max(baseScale, Math.min(velocityMagnitude / 500, 1));

  const timeSinceHit = performance.now() - lastHitTime;
  const isInvulnerable = timeSinceHit < 2000;
  const opacity = isInvulnerable ? Math.sin(timeSinceHit / 75) * 0.4 + 0.6 : 1;

  const shipFilter = undefined;

  return (
    <div
      className={`${styles.shipContainer} Ship`}
      style={{
        left: `${shipX}px`,
        top: `${shipY}px`,
        transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
        opacity,
      }}
    >
      <div
        className={styles.ship}
        style={{
          backgroundImage: `url(${rocket})`,
          filter: shipFilter,
        }}
      />
      <div
        className={styles.fire}
        style={{
          backgroundImage: `url(${fire})`,
          transform: `scaleX(${velocityScale}) scaleY(${velocityScale})`,
          transformOrigin: 'top center',
          filter: shipFilter,
        }}
      />
    </div>
  );
});

Ship.displayName = 'Ship';
export default Ship;
