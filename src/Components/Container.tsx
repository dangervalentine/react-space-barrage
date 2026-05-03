import React from 'react';
import { useGameContext } from '../Context';
import Ship from './Ship';
import Score from './Score';
import Guide from './Guide';
import Enemy from './Enemy';
import { StarsField } from './Stars';
import styles from './Container.module.css';

export default function Container() {
  const { enemies } = useGameContext();

  console.log(`Container render: ${enemies.length} enemies`);

  return (
    <div className={styles.container}>
      <Score />
      <StarsField count={10} />
      {enemies.map(enemy => <Enemy key={enemy.id} enemy={enemy} />)}
      <Ship />
      <Guide />
    </div>
  );
}
