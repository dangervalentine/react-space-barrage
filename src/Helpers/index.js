import React from 'react';

import { SmStarSC, MdStarSC, LgStarSC } from '../Components/StyledComponents';
import { KEYS } from '../Resources';

//////////////////////
// Helper Functions //
//////////////////////

// Runs every 50ms in order to assess and adjust state
export const tick = state => {
  state = hitDection(state);
  state = decayVelocity(state);
  state = updateEnemies(state);

  return state;
};

// Lower the inertia of a moving ship
const decayVelocity = state => {
  const newState = { ...state };
  const { rVelocity, lVelocity, shipX } = newState;
  const velocity = lVelocity + rVelocity;
  const maxX = 760;
  const minX = -40;

  newState.lVelocity = lVelocity < 0 ? lVelocity + 1 : 0;

  newState.rVelocity = rVelocity > 0 ? rVelocity - 1 : 0;

  if (velocity >= 0) {
    newState.shipX = shipX <= maxX ? shipX + velocity : minX;
  } else if (velocity <= 0) {
    newState.shipX = shipX >= minX ? shipX + velocity : maxX;
  }

  return newState;
};

// Update and reset position of enemies
const updateEnemies = state => {
  const newState = { ...state };
  const { enemy1, enemy2, enemy3, enemy4, enemy5 } = newState;
  let enemies = [enemy1, enemy2, enemy3, enemy4, enemy5];

  enemies = enemies.map(enemy => {
    const { y, speed, index } = enemy;

    enemy.y = y + speed * 10;
    if (enemy.y > 800) {
      enemy = createEnemy(index);
      newState.score = newState.score + 1;
    }
    return enemy;
  });

  newState.enemy1 = enemies[0];
  newState.enemy2 = enemies[1];
  newState.enemy3 = enemies[2];
  newState.enemy4 = enemies[3];
  newState.enemy5 = enemies[4];

  return newState;
};

const hitDection = state => {
  const newState = { ...state };
  const { shipX, enemy1, enemy2, enemy3, enemy4, enemy5 } = newState;
  const enemies = [enemy1, enemy2, enemy3, enemy4, enemy5];

  enemies.forEach(enemy => {
    const { y, x } = enemy;
    if (y > 560 && y < 720 && x >= shipX - 60 && x <= shipX + 60) {
      newState.isShipHit = true;
      return;
    }
  });

  return newState;
};

// Randomly re-creates and places an enemy at the top
export const createEnemy = (key = 1) => {
  return {
    y: 0,
    x: randomUpTo(8) * 100,

    index: key,
    color: randomUpTo(3),
    speed: randomUpTo(3) + 1
  };
};

// Move the ship through keyboard input
export const handleKeys = (state, e) => {
  const newState = { ...state };
  const { rVelocity, lVelocity, shipX } = newState;
  const key = e.keyCode;

  if (key === KEYS.RIGHT || key === KEYS.D)
    newState.rVelocity = rVelocity < 20 ? rVelocity + 2 : 20;

  if (key === KEYS.LEFT || key === KEYS.A)
    newState.lVelocity = lVelocity > -20 ? lVelocity - 2 : -20;

  newState.shipX = shipX + newState.lVelocity + newState.rVelocity;

  return newState;
};

// Creates 30 star elements with animation
// Returns array of stars
export const createStars = () => {
  const rX = () => randomUpTo(800);
  const rDelay = () => 0 - randomUpTo(4800);

  const stars = [];
  for (let i = 0; i < 5; ++i) {
    stars.push(
      <SmStarSC key={'a' + i} x={rX()} sp={12} delay={rDelay()} />,
      <MdStarSC key={'b' + i} x={rX()} sp={8} delay={rDelay()} />,
      <LgStarSC key={'c' + i} x={rX()} sp={6} delay={rDelay()} />
    );
  }

  return stars;
};

// Random number from one up to the parameter
const randomUpTo = upperLimit => Math.floor(Math.random() * upperLimit);
