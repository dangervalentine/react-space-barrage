import React from 'react';

import { SmStarSC, MdStarSC, LgStarSC } from '../Components/StyledComponents';
import { KEYS } from '../Resources';

export const decayVelocity = state => {
  const maxX = state.containerWidth * 0.9;
  const { rVelocity, lVelocity, shipX } = state;
  const velocity = lVelocity + rVelocity;

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
  const maxX = state.containerWidth;
  const { rVelocity, lVelocity, shipX } = state;

  if (!shipX >= 0 && !shipX <= maxX) {
    if (key === KEYS.RIGHT || key === KEYS.D)
      state.rVelocity = rVelocity < 20 ? rVelocity + 2 : 20;

    if (key === KEYS.LEFT || key === KEYS.A)
      state.lVelocity = lVelocity > -20 ? lVelocity - 2 : -20;

    state.shipX = shipX + state.lVelocity + state.rVelocity;

    return state;
  }
};

export const createStars = maxSize => {
  const rX = () => Math.floor(Math.random() * maxSize);
  const rDelay = () => 0 - Math.floor(Math.random() * 2400);

  const stars = [];
  for (var i = 0; i < 10; ++i) {
    stars.push(
      <SmStarSC key={'a' + i} x={rX()} sp={12} delay={rDelay()} />,
      <MdStarSC key={'b' + i} x={rX()} sp={8} delay={rDelay()} />,
      <LgStarSC key={'c' + i} x={rX()} sp={6} delay={rDelay()} />
    );
  }
  return stars;
};
