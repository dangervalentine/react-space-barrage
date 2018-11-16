import { KEYS } from '../Resources';

export const decayVelocity = state => {
  let { rVelocity, lVelocity, x } = state;

  state.lVelocity = lVelocity < 0 ? lVelocity + 1 : 0;

  state.rVelocity = rVelocity > 0 ? rVelocity - 1 : 0;

  state.x = x > 0 ? x + state.rVelocity + state.lVelocity : 0;

  return state;
};

export const handleKeys = (state, e) => {
  let { rVelocity, lVelocity, x } = state;
  let key = e.keyCode;

  if (key === KEYS.RIGHT || key === KEYS.D)
    state.rVelocity = rVelocity < 20 ? rVelocity + 2 : 20;

  if (key === KEYS.LEFT || key === KEYS.A)
    state.lVelocity = lVelocity > -20 ? lVelocity - 2 : -20;

  state.x = x + state.lVelocity + state.rVelocity;

  return state;
};
