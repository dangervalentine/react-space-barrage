import React from 'react';
import { ParticleState } from '../engine/types';
import styles from './Particle.module.css';

interface ParticleProps {
  particle: ParticleState;
}

export default function Particle({ particle }: ParticleProps) {
  return (
    <div
      className={styles.particle}
      style={{
        left: `${particle.x}px`,
        top: `${particle.y}px`,
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
}
