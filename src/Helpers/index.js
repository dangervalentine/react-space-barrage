import { KEYS } from "../Resources";

export const decayVelocity = newState => {
  newState.leftVelocity =
    newState.leftVelocity < 0 ? newState.leftVelocity + 2 : 0;

  newState.rightVelocity =
    newState.rightVelocity > 0 ? newState.rightVelocity - 2 : 0;

  newState.x =
    newState.x > 0
      ? newState.x + newState.rightVelocity + newState.leftVelocity
      : 0;

  return newState;
};

export const handleKeys = (newState, e) => {
  if (e.keyCode === KEYS.RIGHT || e.keyCode === KEYS.D) {
    newState.rightVelocity =
      newState.rightVelocity < 20 ? newState.rightVelocity + 2 : 20;

    newState.x = newState.x + newState.rightVelocity;
  }

  if (e.keyCode === KEYS.LEFT || e.keyCode === KEYS.A) {
    newState.leftVelocity =
      newState.leftVelocity > -20 ? newState.leftVelocity - 2 : -20;

    newState.x = newState.x > 0 ? newState.x + newState.leftVelocity : 0;
  }

  return newState;
};
