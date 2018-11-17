import React from 'react';

import { SmStarSC, MdStarSC, LgStarSC } from '../Components/StyledComponents';
import { KEYS } from '../Resources';

export const decayVelocity = ship => {
  const state = ship.state;
  const maxX = ship.props.maxX * 0.9;
  const { rVelocity, lVelocity, x } = state;
  const velocity = lVelocity + rVelocity;

  state.lVelocity = lVelocity < 0 ? lVelocity + 1 : 0;

  state.rVelocity = rVelocity > 0 ? rVelocity - 1 : 0;

  if (velocity >= 0) {
    state.x = x <= maxX ? x + velocity : maxX;
  } else if (velocity <= 0) {
    state.x = x >= 0 ? x + velocity : 0;
  }

  return state;
};

export const handleKeys = (ship, e) => {
  const key = e.keyCode;
  const state = ship.state;
  const maxX = ship.props.maxX;
  const { rVelocity, lVelocity, x } = state;

  if (!x >= 0 && !x <= maxX) {
    if (key === KEYS.RIGHT || key === KEYS.D)
      state.rVelocity = rVelocity < 20 ? rVelocity + 2 : 20;

    if (key === KEYS.LEFT || key === KEYS.A)
      state.lVelocity = lVelocity > -20 ? lVelocity - 2 : -20;

    state.x = x + state.lVelocity + state.rVelocity;

    return state;
  }
};

export const createStars = maxSize => {
  const rX = () => Math.floor(Math.random() * maxSize);
  const rDelay = () => 0 - Math.floor(Math.random() * 1200);

  const stars = [];
  for (var i = 0; i < 10; ++i) {
    stars.push(
      <SmStarSC key={'a' + i} x={rX()} sp={9} delay={rDelay()} />,
      <MdStarSC key={'b' + i} x={rX()} sp={7} delay={rDelay()} />,
      <LgStarSC key={'c' + i} x={rX()} sp={5} delay={rDelay()} />
    );
  }
  return stars;
};
