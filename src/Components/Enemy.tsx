import React from 'react';
import type { EnemyState } from '../engine/types';
import enemy1 from '../Assets/enemy1.svg';
import enemy2 from '../Assets/enemy2.svg';
import enemy3 from '../Assets/enemy3.svg';
import styles from './Enemy.module.css';

const enemyImages = [enemy1, enemy2, enemy3];

interface EnemyProps {
  enemy: EnemyState;
}

function Enemy({ enemy }: EnemyProps) {
  console.log(`Enemy render: id=${enemy.id}, x=${enemy.x}, y=${enemy.y}, imageIndex=${enemy.imageIndex}`);
  return (
    <div
      className={styles.enemy}
      style={{
        left: `${enemy.x}px`,
        top: `${enemy.y}px`,
        backgroundImage: `url(${enemyImages[enemy.imageIndex]})`,
      }}
    />
  );
}

Enemy.displayName = 'Enemy';
export default Enemy;
