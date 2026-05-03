import React from 'react';
import styles from './ShieldIndicator.module.css';

interface ShieldIndicatorProps {
  hasShield: boolean;
}

export default function ShieldIndicator({ hasShield }: ShieldIndicatorProps) {
  return (
    <div className={`${styles.indicator} ${hasShield ? styles.active : ''}`}>
      ◆ SHIELD {hasShield ? 'ON' : 'OFF'} ◆
    </div>
  );
}
