import React from 'react';
import { useGameContext } from '../Context';
import Ship from './Ship';
import Score from './Score';
import Guide from './Guide';
import Enemy from './Enemy';
import Shield from './Shield';
import Lives from './Lives';
import Particle from './Particle';
import { StarsField } from './Stars';
import styles from './Container.module.css';

export default function Container() {
  const { enemies, shields, lives, particles } = useGameContext();

  console.log(`Container render: ${enemies.length} enemies`);

  return (
    <div className={styles.container}>
      <Score />
      <Lives lives={lives} />
      <StarsField count={10} />
      {shields.map(shield => <Shield key={shield.id} x={shield.x} y={shield.y} />)}
      {enemies.map(enemy => <Enemy key={enemy.id} enemy={enemy} />)}
      {particles.map(particle => <Particle key={particle.id} particle={particle} />)}
      <Ship />
      <Guide />
    </div>
  );
}
