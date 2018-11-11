import { KEYS } from '../Resources';

export const decayVelocity = newState => {
  newState.upVelocity = newState.upVelocity > 0 ? newState.upVelocity - 1 : 0;

  newState.leftVelocity =
    newState.leftVelocity < 0 ? newState.leftVelocity + 1 : 0;

  newState.downVelocity =
    newState.downVelocity < 0 ? newState.downVelocity + 1 : 0;

  newState.rightVelocity =
    newState.rightVelocity > 0 ? newState.rightVelocity - 1 : 0;

  newState.y =
    newState.y > 0
      ? newState.y + newState.upVelocity + newState.downVelocity
      : 0;
      
  newState.x =
    newState.x > 0
      ? newState.x + newState.rightVelocity + newState.leftVelocity
      : 0;

  return newState;
};

export const handleKeys = (newState, e) => {
  if (e.keyCode === KEYS.RIGHT || e.keyCode === KEYS.D) {
    newState.rightVelocity =
      newState.rightVelocity < 10 ? newState.rightVelocity + 1 : 10;

    newState.x = newState.x + newState.rightVelocity;
  }

  if (e.keyCode === KEYS.LEFT || e.keyCode === KEYS.A) {
    newState.leftVelocity =
      newState.leftVelocity > -10 ? newState.leftVelocity - 1 : -10;

    newState.x = newState.x > 0 ? newState.x + newState.leftVelocity : 0;
  }

  if (e.keyCode === KEYS.UP || e.keyCode === KEYS.W) {
    newState.upVelocity =
      newState.upVelocity < 10 ? newState.upVelocity + 1 : 10;

    newState.y = newState.y + newState.upVelocity;
  }

  if (e.keyCode === KEYS.DOWN || e.keyCode === KEYS.S) {
    newState.downVelocity =
      newState.downVelocity > -10 ? newState.downVelocity - 1 : -10;

    newState.y = newState.y > 0 ? newState.y + newState.downVelocity : 0;
  }

  return newState;
};
