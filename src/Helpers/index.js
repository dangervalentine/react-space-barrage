import { KEYS } from '../Resources';

export const decayVelocity = newState => {
  let { rVelocity, lVelocity, x } = newState;

  newState.lVelocity = lVelocity < 0 ? lVelocity + 1 : 0;

  newState.rVelocity = rVelocity > 0 ? rVelocity - 1 : 0;

  newState.x = x > 0 ? x + newState.rVelocity + newState.lVelocity : 0;

  return newState;
};

export const handleKeys = (newState, e) => {
  let { rVelocity, lVelocity, x } = newState;
  let key = e.keyCode;

  if (key === KEYS.RIGHT || key === KEYS.D)
    newState.rVelocity = rVelocity < 20 ? rVelocity + 2 : 20;

  if (key === KEYS.LEFT || key === KEYS.A)
    newState.lVelocity = lVelocity > -20 ? lVelocity - 2 : -20;

  newState.x = x + newState.lVelocity + newState.rVelocity;

  return newState;
};
