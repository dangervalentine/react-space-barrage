import React from 'react';

import {
  SmStarSC,
  MdStarSC,
  LgStarSC,
  EnemySC
} from '../Components/StyledComponents';
import { KEYS } from '../Resources';

export const decayVelocity = state => {
  const { rVelocity, lVelocity, shipX } = state;
  const velocity = lVelocity + rVelocity;
  const maxX = 900;

  state.lVelocity = lVelocity < 0 && shipX > 0 ? lVelocity + 1 : 0;

  state.rVelocity = rVelocity > 0 && shipX < maxX ? rVelocity - 1 : 0;

  if (velocity >= 0) {
    state.shipX = shipX <= maxX ? shipX + velocity : maxX;
  } else if (velocity <= 0) {
    state.shipX = shipX >= 0 ? shipX + velocity : 0;
  }

  return state;
};

export const handleKeys = (state, e) => {
  const key = e.keyCode;
  const { rVelocity, lVelocity, shipX } = state;

  if (!shipX >= 0 && !shipX <= 1000) {
    if (key === KEYS.RIGHT || key === KEYS.D)
      state.rVelocity = rVelocity < 20 ? rVelocity + 2 : 20;

    if (key === KEYS.LEFT || key === KEYS.A)
      state.lVelocity = lVelocity > -20 ? lVelocity - 2 : -20;

    state.shipX = shipX + state.lVelocity + state.rVelocity;

    return state;
  }
};

export const createStars = () => {
  const rX = () => randomUpTo(1000);
  const rDelay = () => 0 - randomUpTo(4800);

  const stars = [];
  for (let i = 0; i < 10; ++i) {
    stars.push(
      <SmStarSC key={'a' + i} x={rX()} sp={12} delay={rDelay()} />,
      <MdStarSC key={'b' + i} x={rX()} sp={8} delay={rDelay()} />,
      <LgStarSC key={'c' + i} x={rX()} sp={6} delay={rDelay()} />
    );
  }

  return stars;
};

export const createEnemies = () => {
  const rX = () => randomUpTo(10);
  const color = () => randomUpTo(3);
  const rDelay = () => 0 - randomUpTo(10);

  const enemies = [];
  for (let i = 0; i < 10; ++i) {
    enemies.push(
      <EnemySC
        key={i}
        x={rX()}
        sp={(color() + 1) * 3}
        color={color()}
        delay={rDelay()}
      />
    );
  }

  return enemies;
};

export const randomUpTo = upperLimit => Math.floor(Math.random() * upperLimit);
