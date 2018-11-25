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
  const { rVelocity, lVelocity, shipX } = state;
  const velocity = lVelocity + rVelocity;
  const maxX = 760;
  const minX = -40;

  state.lVelocity = lVelocity < 0 ? lVelocity + 1 : 0;

  state.rVelocity = rVelocity > 0 ? rVelocity - 1 : 0;

  if (velocity >= 0) {
    state.shipX = shipX <= maxX ? shipX + velocity : minX;
  } else if (velocity <= 0) {
    state.shipX = shipX >= minX ? shipX + velocity : maxX;
  }

  return state;
};

// Update and reset position of enemies
const updateEnemies = state => {
  const { enemy1, enemy2, enemy3, enemy4, enemy5 } = state;
  let enemies = Array.from([enemy1, enemy2, enemy3, enemy4, enemy5]);

  enemies = enemies.map(enemy => {
    const { y, speed, index } = enemy;

    enemy.y = y + speed * 10;
    if (enemy.y > 800) {
      enemy = createEnemy(index);
      state.score = state.score + 1;
    }
    return enemy;
  });

  state.enemy1 = enemies[0];
  state.enemy2 = enemies[1];
  state.enemy3 = enemies[2];
  state.enemy4 = enemies[3];
  state.enemy5 = enemies[4];

  return state;
};

const hitDection = state => {
  const { shipX, enemy1, enemy2, enemy3, enemy4, enemy5 } = state;
  const enemies = Array.from([enemy1, enemy2, enemy3, enemy4, enemy5]);

  enemies.forEach(enemy => {
    const { y, x } = enemy;
    if (y > 560 && y < 720 && x >= shipX - 60 && x <= shipX + 60) {
      state.isShipHit = true;
      return;
    }
  });

  return state;
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
  const { rVelocity, lVelocity, shipX } = state;
  const key = e.keyCode;

  if (key === KEYS.RIGHT || key === KEYS.D)
    state.rVelocity = rVelocity < 20 ? rVelocity + 2 : 20;

  if (key === KEYS.LEFT || key === KEYS.A)
    state.lVelocity = lVelocity > -20 ? lVelocity - 2 : -20;

  state.shipX = shipX + state.lVelocity + state.rVelocity;

  return state;
};

// Creates 30 star elements with animation
// Returns array of stars
export const createStars = () => {
  const rX = () => randomUpTo(800);
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

// Random number from one up to the parameter
const randomUpTo = upperLimit => Math.floor(Math.random() * upperLimit);
