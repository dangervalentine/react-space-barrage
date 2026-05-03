import React, { useMemo } from 'react';
import { randomUpTo } from '../engine/types';
import styles from './Stars.module.css';

const maxX = 1025;

interface StarProps {
  variant: 'sm' | 'md' | 'lg';
}

const Star = ({ variant }: StarProps) => {
  const sizes = { sm: 12, md: 8, lg: 6 };
  const className = {
    sm: `${styles.star} ${styles.starSm}`,
    md: `${styles.star} ${styles.starMd}`,
    lg: `${styles.star} ${styles.starLg}`,
  };

  const x = randomUpTo(maxX);
  const delay = 0 - randomUpTo(4800);
  const speed = sizes[variant];

  return (
    <div
      className={className[variant]}
      style={{
        left: `${x}px`,
        animation: `moveY ${speed}s linear ${delay}ms infinite normal`,
      }}
    />
  );
};

export const StarsField = ({ count = 10 }: { count?: number }) => {
  const stars = useMemo(() => {
    const starList = [];
    for (let i = 0; i < count; i++) {
      starList.push(
        <Star key={`sm-${i}`} variant="sm" />,
        <Star key={`md-${i}`} variant="md" />,
        <Star key={`lg-${i}`} variant="lg" />
      );
    }
    return starList;
  }, [count]);

  return <>{stars}</>;
};
